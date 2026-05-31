import json
import os
from datetime import UTC, datetime

import boto3


ANALYSIS_TABLE = os.environ.get("ANALYSIS_TABLE", "video_analysis_results")
rekognition = boto3.client("rekognition")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(ANALYSIS_TABLE)

CAMERA_ZONES = {
    "cam_meydan_01": "Meydan",
    "cam_otogar_01": "Otogar",
    "cam_kampus_01": "Kampus",
    "cam_hastane_01": "Hastane",
    "cam_sanayi_01": "Sanayi",
}


def _crowd_level(people_count, vehicle_count):
    if people_count >= 160 or vehicle_count >= 90:
        return "critical"
    if people_count >= 100 or vehicle_count >= 60:
        return "high"
    if people_count >= 50 or vehicle_count >= 30:
        return "medium"
    return "low"


def _motion_level(vehicle_count):
    if vehicle_count >= 90:
        return "high"
    if vehicle_count >= 30:
        return "medium"
    return "low"


def _extract_counts_and_labels(job_id):
    response = rekognition.get_label_detection(JobId=job_id, SortBy="TIMESTAMP", MaxResults=1000)
    labels = response.get("Labels", [])
    label_names = set()
    people_count = 0
    vehicle_count = 0

    for item in labels:
        label = item.get("Label", {})
        name = label.get("Name")
        if name:
            label_names.add(name.lower())
        instance_count = len(label.get("Instances", []))
        parent_names = {parent.get("Name", "").lower() for parent in label.get("Parents", [])}
        normalized = (name or "").lower()

        if normalized in {"person", "human"} or "person" in parent_names:
            people_count = max(people_count, instance_count)
        if normalized in {"car", "bus", "truck", "vehicle"} or "vehicle" in parent_names:
            vehicle_count = max(vehicle_count, instance_count)

    return people_count, vehicle_count, sorted(label_names)[:8]


def _handle_message(message):
    if message.get("Status") != "SUCCEEDED":
        return {"ok": False, "status": message.get("Status"), "job_id": message.get("JobId")}

    job_id = message["JobId"]
    camera_id = message.get("JobTag") or "cam_meydan_01"
    zone = CAMERA_ZONES.get(camera_id, "Meydan")
    people_count, vehicle_count, labels = _extract_counts_and_labels(job_id)

    event = {
        "camera_id": camera_id,
        "zone": zone,
        "people_count": people_count,
        "vehicle_count": vehicle_count,
        "motion_level": _motion_level(vehicle_count),
        "crowd_level": _crowd_level(people_count, vehicle_count),
        "recognition_labels": labels or ["rekognition"],
        "timestamp": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }
    table.put_item(Item=event)
    return {"ok": True, "job_id": job_id, "event": event}


def lambda_handler(event, context):
    results = []
    for record in event.get("Records", []):
        sns = record.get("Sns", {})
        message = sns.get("Message", "{}")
        results.append(_handle_message(json.loads(message)))
    return {"results": results}
