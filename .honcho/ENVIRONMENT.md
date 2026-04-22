# 🌙 Honcho Environment Configuration

## 📋 Setup Instructions

### 1. Source Environment Variables

```bash
# Source user environment (if not already sourced)
source ~/.bashrc
source ${USER_HOME}/.env

# Set environment variables for the project
export USER_HOME=$HOME
export HONCHO_DIR=${USER_HOME}/.honcho
export HONCHO_SERVER=${HONCHO_DIR}/honcho-server

# Now use these paths everywhere
cd ${HONCHO_SERVER}
just honcho-up
just honcho-night
```

### 2. Directory Structure

```
${HONCHO_DIR}/
├── config.json          # Multi-model configuration
├── .env                 # API keys and environment
└── honcho-server/       # Honcho application
    ├── justfile         # Automation recipes
    ├── docker-compose.yml
    ├── docker-compose.yml.example
    ├── docker-compose.prod.yml
    ├── Dockerfile
    └── ...             # Application code
```

### 3. Available Commands

```bash
# ===== Night Operations =====
just honcho-night       # Start at 22:00
just honcho-stop-night  # Stop at 07:00
just honcho-model-status # Check model status
just honcho-night-check # Health check

# ===== API Operations =====
just honcho-up          # Start Docker services
just honcho-open-ui     # Open Honcho UI
just honcho-open-metrics # Open metrics

# ===== Configuration =====
cat ${HONCHO_DIR}/config.json
source ${HONCHO_DIR}/.env  # If needed
```

---

## 🎯 Environment Variables

```bash
# ===== User Environment =====
USER_HOME=$HOME

# ===== Honcho Environment =====
HONCHO_DIR=${USER_HOME}/.honcho
HONCHO_SERVER=${HONCHO_DIR}/honcho-server

# ===== Configuration =====
CONFIG_FILE=${HONCHO_DIR}/config.json
CONFIG_ENV=${HONCHO_DIR}/.env

# ===== Server =====
HONCHO_UI=http://localhost:18000/
HONCHO_API=${HONCHO_UI}
```

---

## 📅 Cron Jobs

```bash
# Night Start at 22:00
*/1 * * * * test "$(date +"%H")" = "22" && cd ${HONCHO_SERVER} && just honcho-night

# Morning Stop at 07:00
*/1 * * * * test "$(date +"%H")" = "07" && cd ${HONCHO_SERVER} && just honcho-stop-night

# Health Check every 30 min
*/30 * * * * cd ${HONCHO_SERVER} && just honcho-model-status
```

---

**End of Environment Configuration**

