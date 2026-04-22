# 🔗 Symbolic Links Setup

## 📋 Purpose

Create symbolic links from `${USER_HOME}/.honcho` to `${USER_HOME}/.honcho` for convenience.

---

## 🎯 Setup

### 1. Create Symbolic Link

```bash
# In your home directory
ln -s ${USER_HOME}/CodeP/Way\ of\ pi/.honcho ${USER_HOME}/.honcho

# Now you can use either path:
cd ${USER_HOME}/.honcho
cd ${USER_HOME}/.honcho
# Both work!
```

### 2. Verify Link

```bash
ls -la ${USER_HOME}/.honcho/
# Should show:
# lrwxrwxrwx 1 user user X date -> ${USER_HOME}/CodeP/Way of pi/.honcho
```

---

## 🚀 Benefits

- ✅ **Convenient Location** - Access from home directory
- ✅ **Backups Easy** - `${USER_HOME}/.honcho` is easy to backup
- ✅ **No Path Changes** - Scripts use `${USER_HOME}`
- ✅ **Cross-Platform** - Works on any Unix system

---

## ⚙️ Usage

```bash
# ===== Access from ${USER_HOME}/.honcho =====
cd ${USER_HOME}/.honcho
just honcho-night

# ===== Access from project =====
cd ${USER_HOME}/.honcho
just honcho-up

# ===== Config =====
cat ${USER_HOME}/.honcho/config.json
cat ${USER_HOME}/.honcho/config.json
# Same file!
```

---

## ✅ Alternative: Use Project Path Only

```bash
# Option 1: Use symbolic link
ln -s ${USER_HOME}/CodeP/Way\ of\ pi/.honcho ${USER_HOME}/.honcho

# Option 2: Use project path directly (recommended)
export HONCHO_DIR=${USER_HOME}/.honcho
cd ${HONCHO_DIR}

# Option 3: Add to ~/.bashrc
alias honcho='${USER_HOME}/CodeP/Way\ of\ pi/.honcho'
```

---

**End of Symbolic Links Guide**

