import json
import os
from datetime import UTC, datetime
from decimal import Decimal

import boto3


READINGS_TABLE = os.environ.get("READINGS_TABLE", "iot_sensor_readings")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(READINGS_TABLE)


def _status_level(item):
    if (
        item["air_quality_index"] >= 150
        or item["traffic_level"] >= 85
        or item["temperature"] >= 38
    ):
        return "critical"
    if (
        item["air_quality_index"] >= 100
        or item["traffic_level"] >= 65
        or item["temperature"] >= 34
    ):
        return "warning"
    return "normal"


def _decimalize(value):
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {key: _decimalize(inner) for key, inner in value.items()}
    if isinstance(value, list):
        return [_decimalize(inner) for inner in value]
    return value


def lambda_handler(event, context):
    payload = event
    if isinstance(event, str):
        payload = json.loads(event)
    if "payload" in payload and isinstance(payload["payload"], str):
        payload = json.loads(payload["payload"])

    timestamp = payload.get("timestamp") or datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    item = {
        "sensor_id": payload.get("sensor_id") or payload.get("topic_sensor_id"),
        "zone": payload.get("zone") or payload.get("zone_slug", "").replace("-", " ").title(),
        "temperature": float(payload["temperature"]),
        "humidity": int(payload["humidity"]),
        "air_quality_index": int(payload["air_quality_index"]),
        "traffic_level": int(payload["traffic_level"]),
        "timestamp": timestamp,
    }
    item["status_level"] = _status_level(item)

    table.put_item(Item=_decimalize(item))

    return {
        "ok": True,
        "table": READINGS_TABLE,
        "sensor_id": item["sensor_id"],
        "timestamp": item["timestamp"],
        "status_level": item["status_level"],
    }
