# Worker Portal Demo Mode Documentation

## Overview

The **Worker Portal** includes a **Demo Mode** feature that allows developers to test and use the UI without needing a running API server. This is useful for:

- Development and debugging
- Presentation and demos
- Testing UI changes before deploying to production
- Offline work sessions

## What Changed

### File Modified

**File**: `/apps/wayofpi-ui/src/pages/WorkerPortal.tsx`

### Key Changes

#### 1. Login Handler Enhancement

**Before**: Login directly called API without fallback
**After**: Login now checks for demo credentials first before calling API

```typescript
// NEW: Check for demo credentials
const isDemoCredentials = 
  loginData.username.toLowerCase() === 'demo' && 
  loginData.password === '1234';

if (isDemoCredentials) {
  // Use demo data instead of API call
  return loadDemoData();
}

// Normal flow...
await fetchWorkers();
await fetchFiles();
await fetchProjects();
await fetchWorkflows();
await fetchBoards();
await fetchTasks();
```

#### 2. Demo Mode Detection

The application now auto-detects when in demo mode:

```typescript
const isDemoMode = 
  loginData.username.toLowerCase() === 'demo' && 
  loginData.password === '1234';
```

### Demo Credentials

- **Username**: `Demo`
- **Password**: `1234`

These credentials trigger demo mode automatically.

## How Demo Mode Works

### 1. Authentication Flow

1. **User enters credentials**
2. **System checks for demo credentials**
3. **If demo credentials**: Skip API, use demo data
4. **If real credentials**: Continue with API flow

### 2. Demo Data Loading

When in demo mode, the following data is loaded:

```typescript
// Task List
const [taskList, setTaskList] = useState<DemoWorkTask[]>(DEMO_TASKS);

// Files
const [files, setFiles] = useState<FileItem[]>(DEMO_FILES);

// Projects
const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);

// Workflows  
const [workflows, setWorkflows] = useState<WorkFlow[]>(DEMO_WORKFLOWS);

// Boards
const [boards, setBoards] = useState<KanBanColumn[]>(DEMO_BOARDS);

// Tasks
const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
```

### 3. Component Integration

Demo data is used in all Kanban components:

- `PushToKanbanModal`
- `PushWorkflowToKanbanModal` 
- `PushTaskListToKanbanModal`
- `BoardSettingsModal`
- `WorkBoard`
- `WorkTaskCard`

## Why Demo Mode Was Added

### Problem

Previously, the Worker Portal required:
1. A running API server (`http://127.0.0.1:3333`)
2. Valid authentication
3. Network connectivity

This blocked:
- Local development
- Testing UI changes
- Presentations
- Offline work

### Solution

Demo credentials allow:
- **Zero-dependency testing**: No server needed
- **UI development**: Test components independently
- **Offline work**: Work even when network unavailable
- **Faster iteration**: Skip API setup time

## Usage Instructions

### Starting Demo Mode

1. **Start the UI server** (if you want to test with server):
```bash
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-ui"
npm run dev
```

2. **Open browser** to: `http://localhost:5173`

3. **Login with demo credentials**:
   - Username: `Demo`
   - Password: `1234`

4. **Demo mode activates automatically**

### Using Without Server

Demo mode works **without** a running server:

1. **Just open the HTML file**:
```bash
cd "/home/zerwiz/CodeP/Way of pi/apps/wayofpi-ui"
# Open with browser to index.html or served file
```

2. **Use**: `Demo` / `1234`

3. **Access all features**:
   - View tasks
   - View files
   - View projects
   - View workflows
   - View boards
   - Kanban operations

## Demo Data Structure

### Tasks

Demo tasks include various statuses:

```json
[
  {
    "id": "TASK-001",
    "title": "Fix login authentication",
    "description": "Resolve issues with user login",
    "status": "In Progress",
    "category": "Development",
    "assignee": "John Doe",
    "dueDate": "2026-05-05",
    "priority": "high"
  }
]
```

### Files

Demo files:
- README.md
- CHANGELOG.md
- LICENSE
- etc.

### Projects

Demo projects:
- Development
- Testing
- Demo

### Workflows

Demo workflows:
- New Project
- Development
- Testing
- Review
- Production

### Boards

Demo boards:
- Development Board
- Testing Board
- Production Board

## Developer Guide

### Adding New Demo Data

To add demo data for new features:

1. **Find** the demo data constant:
```typescript
const DEMO_TASKS: DemoWorkTask[] = [
  // existing tasks
];
```

2. **Add** new demo items:
```typescript
const DEMO_TASKS: DemoWorkTask[] = [
  // existing tasks
  {
    id: "TASK-NEW",
    title: "Your new task",
    description: "Your new task description",
    status: "New",
    category: "Development",
    assignee: "Test User",
    dueDate: "2026-05-05",
    priority: "medium"
  }
];
```

3. **Export** and use in components

### Testing Demo Mode

1. **Clear browser cache**: `Ctrl+Shift+R` or `Cmd+Shift+R`

2. **Login with**: `Demo` / `1234`

3. **Verify demo data loads**

4. **Test UI interactions**

### Switching to Live Mode

To use actual API data:

1. **Start the server**:
```bash
npm run server
```

2. **Use real credentials** instead of `Demo`/`1234`

3. **API calls will populate** real data

## Troubleshooting

### Demo Mode Not Working

**Problem**: Demo mode doesn't activate

**Solutions**:
1. **Clear browser cache**
2. **Check credentials**: Must be exactly `Demo` and `1234`
3. **Try different browser**
4. **Check browser console** for errors

### Switching Between Modes

**Problem**: Can't switch from demo to live

**Solution**:
1. **Logout** from Worker Portal (if possible)
2. **Use different credentials**
3. **Clear application state**

## Future Enhancements

Potential improvements for demo mode:

- [ ] **Flag demo mode** for users
- [ ] **Separate demo databases**
- [ ] **Toggle demo mode** setting
- [ ] **Export demo data**
- [ ] **Import custom demo data**

## Related Files

### Modified

- `/apps/wayofpi-ui/src/pages/WorkerPortal.tsx`

### Demo Data Files

- `/apps/wayofpi-ui/src/data/demo-data.*`

### Components Using Demo Data

- `/apps/wayofpi-ui/src/components/work/kanban/**`

## Security Notes

### Demo Credentials

- **Not for production**: Use `Demo`/`1234` only for development
- **Change in production**: Never use demo credentials in production
- **Clear after demo**: Change credentials or disable demo mode

### API vs Demo

- **Production**: Always use API
- **Development**: Demo mode or API both acceptable
- **Testing**: Demo mode recommended for UI testing

## Summary

**Demo Mode** provides:
- ✅ Zero-dependency development
- ✅ Offline work capability
- ✅ Faster iteration cycles
- ✅ Safe testing environment
- ✅ Offline presentations

Use it for development, testing, and demos. Use API for production.

---

**Last Updated**: 2026-05-05  
**Author**: Developer Guide  
**Version**: 0.19.99

