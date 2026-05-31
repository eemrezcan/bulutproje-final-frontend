import json
import os
import urllib.request
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import boto3


PREDICTIONS_TABLE = os.environ.get("PREDICTIONS_TABLE", "ml_predictions")
IOT_API_URL = os.environ.get("IOT_API_URL", "https://d1k4ey8nhx4dtb.cloudfront.net/api/iot")
VIDEO_API_URL = os.environ.get("VIDEO_API_URL", "https://d1k4ey8nhx4dtb.cloudfront.net/api/video")
HORIZON_MINUTES = int(os.environ.get("HORIZON_MINUTES", "60"))
ZONES = ["Meydan", "Otogar", "Kampus", "Hastane", "Sanayi"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(PREDICTIONS_TABLE)


def _get_json(url):
    with urllib.request.urlopen(url, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def _latest_by_zone(items):
    latest = {}
    for item in items:
        zone = item.get("zone")
        timestamp = item.get("timestamp") or item.get("prediction_timestamp") or ""
        if zone and (zone not in latest or timestamp > latest[zone].get("timestamp", "")):
            latest[zone] = item
    return latest


def _crowd_level(people_count, traffic_level):
    if people_count >= 100 or traffic_level >= 85:
        return "critical"
    if people_count >= 65 or traffic_level >= 65:
        return "high"
    if people_count >= 30 or traffic_level >= 45:
        return "medium"
    return "low"


def _risk_level(score):
    if score >= 80:
        return "critical"
    if score >= 55:
        return "warning"
    return "normal"


def _risk_score(predicted_temperature, predicted_crowd_level, iot, video):
    crowd_weights = {"low": 5, "medium": 18, "high": 32, "critical": 45}
    score = 8
    score += crowd_weights.get(predicted_crowd_level, 10)
    score += min(20, max(0, int((predicted_temperature - 24) * 2)))
    score += min(18, max(0, int((int(iot["air_quality_index"]) - 60) / 4)))
    score += min(16, max(0, int(int(iot["traffic_level"]) / 6)))
    score += min(10, int(int(video["people_count"]) / 12))
    score += min(8, int(int(video["vehicle_count"]) / 10))
    return max(0, min(100, score))


def _recommendation(zone, score, crowd):
    level = _risk_level(score)
    if level == "critical":
        return f"{zone} bolgesinde kritik risk bekleniyor. Ekipler hazir konuma alinmali."
    if level == "warning":
        if crowd in {"high", "critical"}:
            return f"{zone} bolgesinde kalabalik ve sicaklik artisi bekleniyor."
        return f"{zone} bolgesinde orta seviye risk bekleniyor."
    return f"{zone} bolgesinde risk normal seviyede."


def _decimalize(value):
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {key: _decimalize(inner) for key, inner in value.items()}
    if isinstance(value, list):
        return [_decimalize(inner) for inner in value]
    return value


def _fallback_iot(zone):
    zone_index = ZONES.index(zone)
    return {
        "zone": zone,
        "temperature": 25.0 + zone_index,
        "humidity": 50,
        "air_quality_index": 70 + zone_index * 10,
        "traffic_level": 40 + zone_index * 7,
    }


def _fallback_video(zone):
    zone_index = ZONES.index(zone)
    return {
        "zone": zone,
        "people_count": 25 + zone_index * 8,
        "vehicle_count": 10 + zone_index * 5,
        "motion_level": "medium",
        "crowd_level": "medium",
    }


def lambda_handler(event, context):
    iot_latest = _latest_by_zone(_get_json(f"{IOT_API_URL}/readings/latest"))
    video_latest = _latest_by_zone(_get_json(f"{VIDEO_API_URL}/analysis/latest"))
    now = datetime.now(UTC).replace(microsecond=0)
    prediction_for = now + timedelta(minutes=HORIZON_MINUTES)

    predictions = []
    for zone in ZONES:
        iot = iot_latest.get(zone) or _fallback_iot(zone)
        video = video_latest.get(zone) or _fallback_video(zone)
        predicted_temperature = round(float(iot["temperature"]) + 1.2, 1)
        predicted_crowd = _crowd_level(int(video["people_count"]), int(iot["traffic_level"]))
        score = _risk_score(predicted_temperature, predicted_crowd, iot, video)
        prediction = {
            "zone": zone,
            "prediction_timestamp": now.isoformat().replace("+00:00", "Z"),
            "prediction_for": prediction_for.isoformat().replace("+00:00", "Z"),
            "predicted_temperature": predicted_temperature,
            "predicted_crowd_level": predicted_crowd,
            "risk_score": score,
            "risk_level": _risk_level(score),
            "recommendation": _recommendation(zone, score, predicted_crowd),
            "input_summary": {
                "temperature": float(iot["temperature"]),
                "humidity": int(iot["humidity"]),
                "air_quality_index": int(iot["air_quality_index"]),
                "traffic_level": int(iot["traffic_level"]),
                "people_count": int(video["people_count"]),
                "vehicle_count": int(video["vehicle_count"]),
                "motion_level": str(video.get("motion_level", "low")),
                "crowd_level": str(video.get("crowd_level", "low")),
            },
        }
        table.put_item(Item=_decimalize(prediction))
        predictions.append(prediction)

    return {"ok": True, "count": len(predictions), "predictions": predictions}
