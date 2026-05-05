# Worker Portal - Documentation Mode UI Demo

**Worker Portal** is a simplified worker dashboard for the Way of Pi project. This implementation provides a clean, minimalistic interface for workers to:
- View pending time entries for approval
- Submit daily time
- View project status
- Access team contacts

---

## 📋 Features

- **Simple Layout**: Clean, focused design (unlike the cluttered main app)
- **Pending Time Entries**: Workers can see their pending entries
- **Project Status**: View current project assignments
- **Team Contacts**: Simple contact list
- **Lightweight**: Minimal dependencies and bundle size

---

## 🏗️ Technical Implementation

### Authentication
Uses a simple token-based system where:
- Workers access portal at any time
- Portal validates token via `portal_token` localStorage
- Valid token grants access to `/portal/*` routes
- Invalid access redirects to `/profile`

### Components Created
- ~~`PortalNavigation`~~: Simple navigation bar
- `PortalAuth`: Component that handles authentication
- `PortalHeader`: Worker-specific header

### API Integration
All CRUD operations use the main app's API at `/api/*` routes

---

## 📁 File Structure

```
project/
├── README.md                    # This file
├── .env.example                 # Environment template
├── src/
│   ├── components/
│   │   ├── index.ts            # Component exports
│   │   ├── PortalNavigation.tsx # Navigation bar
│   │   ├── PortalAuth.tsx      # Auth component
│   │   └── PortalHeader.tsx    # Worker header
│   ├── pages/
│   │   -- [future]
│   └── App.tsx                 # Main entry
└── workerportal.tsx            # Main entry point
```

---

## 🧪 Quick Start

1. **Build the main app:**
```bash
cd /home/zerwiz/CodeP/Way of pi/
yarn build
```

2. **Start API server:**
```bash
yarn api
```

3. **Start UI:**
```bash
yarn ui
```

---

## 🔧 Environment Variables

```bash
PORTAL_TOKEN=worker-portal-token-secret
PORTAL_REDIRECT_URL=http://localhost:5173
BASE_URL=http://localhost:5173
```

---

## ❓ Known Limitations

- No actual login (token-based only)
- Minimal components, needs proper routing
- No team collaboration features yet

---

## 🔍 Current Issues

- **Navigation component** needs completion
- **Components** need proper integration
- **Auth system** needs to handle token expiry
- **Project status** needs backend integration

---

## 📝 Notes

This is a demo implementation for the work button improvement project. The actual worker portal will use the same authentication system as the main app but with a simplified UI focused solely on time entry functionality.

**Status:** WIP - Navigation and Auth components incomplete
