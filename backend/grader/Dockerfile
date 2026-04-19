FROM python:3.11-slim

# Minimal runtime deps; we deliberately do not install docker-in-docker.
# On Railway, /submit will return 503 sandbox_unavailable — live grading
# runs on the local dev machine. This image is for frontend-serve mode:
# generate tests, serve pytest files, serve deliverables, push/poll status.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PORT=8000 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

# Railway injects PORT; default to 8000 for local docker run.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
