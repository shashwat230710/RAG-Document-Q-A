#!/usr/bin/env bash
set -e
uvicorn app.api:app --reload --port 8000
