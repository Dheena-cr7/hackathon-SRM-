#!/usr/bin/env python3
"""
CampusOps — GeoJSON CLI Management & Validation Tool
Permits adding, listing, updating, and validating building footprints in data/campus.geojson
Zero external dependencies (uses standard library json, math, sys, os).
"""

import json
import os
import sys

GEOJSON_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "campus.geojson")

def load_geojson(path=GEOJSON_PATH):
    if not os.path.exists(path):
        raise FileNotFoundError(f"GeoJSON file not found at {path}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_geojson(data, path=GEOJSON_PATH):
    validate_geojson(data)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Successfully saved and validated GeoJSON to {path}")

def validate_geojson(data):
    if not isinstance(data, dict):
        raise ValueError("Invalid GeoJSON: Root must be a JSON object.")
    if data.get("type") != "FeatureCollection":
        raise ValueError("Invalid GeoJSON: type must be 'FeatureCollection'.")
    features = data.get("features", [])
    if not isinstance(features, list):
        raise ValueError("Invalid GeoJSON: 'features' must be an array.")
    
    seen_ids = set()
    for idx, feature in enumerate(features):
        feat_type = feature.get("type")
        if feat_type != "Feature":
            raise ValueError(f"Feature at index {idx} has invalid type '{feat_type}' (expected 'Feature').")
        
        props = feature.get("properties", {})
        building_id = feature.get("id") or props.get("building_id")
        if not building_id:
            raise ValueError(f"Feature at index {idx} lacks a mandatory 'id' or 'properties.building_id'.")
        
        if building_id in seen_ids:
            raise ValueError(f"Duplicate building ID detected: '{building_id}'. Building IDs must be unique.")
        seen_ids.add(building_id)

        geom = feature.get("geometry", {})
        if not isinstance(geom, dict) or geom.get("type") not in ("Polygon", "MultiPolygon"):
            raise ValueError(f"Building '{building_id}' geometry must be Polygon or MultiPolygon.")
        
        coords = geom.get("coordinates", [])
        if not coords or not isinstance(coords, list):
            raise ValueError(f"Building '{building_id}' has invalid coordinate array.")
    
    return True, len(features)

def list_buildings():
    data = load_geojson()
    valid, count = validate_geojson(data)
    print(f"\n--- CampusOps GeoJSON Buildings (Count: {count}) ---")
    print(f"License: {data.get('license', 'Unspecified')} | Attribution: {data.get('copyright', '')}\n")
    for f in data.get("features", []):
        props = f.get("properties", {})
        b_id = f.get("id") or props.get("building_id")
        name = props.get("name", "Unnamed")
        code = props.get("code", "N/A")
        floors = props.get("floors", 1)
        b_type = props.get("building_type", "general")
        status = props.get("operational_status", "normal")
        print(f"• [{b_id}] {name} ({code}) | Type: {b_type} | Floors: {floors} | Status: {status}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_buildings()
    else:
        try:
            data = load_geojson()
            valid, count = validate_geojson(data)
            print(f"GeoJSON Validation PASSED: {count} valid building footprints detected in {GEOJSON_PATH}")
        except Exception as e:
            print(f"GeoJSON Validation FAILED: {e}", file=sys.stderr)
            sys.exit(1)
