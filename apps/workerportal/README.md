# Worker Portal

Worker self-service portal for the Way of Work platform. Provides a clean, focused interface for workers to manage their profile, time entries, certificates, and calendar.

## Features

- **Profile**: View/edit personal details (name, email, phone, role)
- **Certificates**: Upload and manage qualifications
- **Calendar**: View schedule and availability
- **PIN Change**: Update access PIN
- **Time Entries**: View and submit daily time (WIP)

## Architecture

Part of the multi-app platform sharing the backend API at `apps/wayofpi-server/` (port 3333).

- Port **5175** (Vite dev)
- Port **3333** (API backend, shared)
- Auth via JWT token in localStorage (`wop_token`)

## Quick Start

```bash
cd apps/workerportal
bun install
bun run dev          # Vite on :5175
```

Requires the main API server running on port 3333.

## Auth

- Token-based: stores `wop_token` in localStorage
- Roles: WORKER, LEADER — validated via `/api/auth/me`
- Redirects to `/profile` on invalid token
- Logout clears token and redirects to `/`

## Status

Working: Profile, certificates, calendar, PIN change.
WIP: Time entries, proper navigation, team collaboration.
