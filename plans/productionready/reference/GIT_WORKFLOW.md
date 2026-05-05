# Way of Pi: Git Workflow & Release Strategy

This document defines the branching and release strategy for **Way of Pi** to ensure the `main` branch always contains a stable, production-ready version for users.

## 1. Branching Model

| Branch Type | Name Pattern | Purpose |
|-------------|--------------|---------|
| **Stable** | `main` | **Default Branch.** Always contains the latest stable, verified version. Users should download/clone from here. |
| **Development** | `dev` | Integration branch for upcoming features. May be unstable. |
| **Feature** | `feat/*` | Individual features or bug fixes. Branched from `dev`, merged back to `dev` via PR. |
| **Release** | `release/vX.Y.Z`| Snapshot of `main` for a specific verified release. Used for long-term support (LTS). |
| **Hotfix** | `hotfix/*` | Critical fixes branched from `main` and merged directly back to `main` and `dev`. |

## 2. Release Workflow

1.  **Development:** All work happens on `feat/*` branches.
2.  **Integration:** Features are merged into `dev` after peer review and basic testing.
3.  **Staging:** When `dev` is ready for a release, a `release/vX.Y.Z` branch is created.
4.  **Verification:** The release branch is tested in a production-like environment (Docker, Electron package).
5.  **Finalize:**
    - Merge `release/*` into `main`.
    - Tag the commit on `main` (e.g., `git tag v0.6.7`).
    - Merge `main` back into `dev` to keep it in sync.
6.  **Distribution:** The GitHub CI/CD pipeline builds the native binaries (`.dmg`, `.exe`, `.AppImage`) from the `main` tag and attaches them to a new GitHub Release.

## 3. Versioning Strategy
We use [Semantic Versioning (SemVer)](https://semver.org/):
- **MAJOR** version for incompatible API changes.
- **MINOR** version for added functionality in a backwards-compatible manner.
- **PATCH** version for backwards-compatible bug fixes.

## 4. Maintenance for Forkers/Contributors
- Keep your `main` branch synced with `origin/main` to get the latest stable updates.
- Use `git pull --rebase origin main` to update your local environment without creating merge commits.
- Run `./doctor.sh` after any major pull to ensure your machine-specific paths are correctly handled.

---
*Way of Pi - Stable, Reliable, Production-Ready.*
