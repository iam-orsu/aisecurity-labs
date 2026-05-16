# CiotX AI Security Labs

A Docker-based AI Pentesting Training Platform.

## Setup

1. Copy `.env.example` to `.env` and fill in your NVIDIA API Key.
   ```bash
   cp .env.example .env
   ```
2. Build and start the containers.
   ```bash
   docker compose up -d --build
   ```
3. Access the platform at http://localhost:3000
