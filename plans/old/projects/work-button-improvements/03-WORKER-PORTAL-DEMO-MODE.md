# WOP WhatsApp Integration Plan - Team Communication

## Overview
Integrate WhatsApp (or similar messaging) as a team communication channel within the Work button dashboard. This enables workers and leaders to communicate instantly about tasks, time entries, and work progress while maintaining the project's security model.

**Proposed location**: `Work` dashboard → Team Portal → WhatsApp Messages

---

## Goals

### Primary Goal
Enable **real-time team communication** integrated with work management, allowing workers and leaders to:
- Discuss tasks and time entries
- Share work updates via chat
- Coordinate with team members
- Receive notifications about approvals/rejections

### Secondary Goals
- Support multiple team chat channels
- Link messages to specific tasks/time entries
- Archive important conversations
- Export chat history for documentation

---

## Architecture

### Communication Model

```
┌────────────────────────────────────────────────────────────┐
│                    Work Dashboard                            │
│  ┌─────────────┬─────────────────┬───────────────────────┐ │
│  │ Team        │ Time/Tasks      │ Leader Actions         │ │
│  │ Browser     │ View            │                        │ │
│  └─────────────┴─────────────────┴───────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Team Portal (WhatsApp Chat)               │ │
│  │  Channel 1: #general                                  │ │
│  │  Channel 2: #project-alpha                            │ │
│  │  Channel 3: #leaders-only                             │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Existing Work Dashboard**:
   - Team Portal section links to WhatsApp
   - Messages appear in dedicated panel
   - Context-aware (current task/project)

2. **Message Context**:
   - Link to related task (via task ID)
   - Link to time entry (via entry ID)
   - Link to file (via file path)
   - Link to worker (via worker ID)

3. **Notification System**:
   - Approvals/rejections trigger messages
   - New tasks appear in channel
   - Deadline warnings sent to channel

---

## User Roles

### Workers
- Read and write messages in team channels
- See mentions (@username) from others
- Receive notifications about task assignments
- Submit messages related to work

### Work Leader
- All worker permissions PLUS:
- Create/delete channels
- Pin important messages
- Moderate channels
- Send announcements
- Set channel topics

---

## Data Model

### Channel
```typescript
interface Channel {
  id: string; // e.g., "general", "project-alpha"
  name: string; // Display name
  description?: string; // Channel purpose
  access: 'public' | 'private' | 'leaders-only';
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  channelId: string;
  senderId: string; // workerId
  senderName: string;
  content: string; // Markdown support
  attachments?: File[];
  taskId?: string; // Optional: link to task
  timeEntryId?: string; // Optional: link to time entry
  fileName?: string; // Optional: link to file
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  readAt?: string;
}
```

### Worker Profile Update
```typescript
// Add to existing Worker interface
interface Worker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'leader';
  whatsappEnabled: boolean; // Optional: opt-in to chat
  joinedAt: string;
}
```

---

## UI Layout

### Team Portal Panel (Left Panel)

```
┌─────────────────────────────────────┐
│ Team Portal                         │
├─────────────────────────────────────┤
│ Channels:                           │
│ ┌─────────────────────────────────┐ │
│ │ 📍 #general                      │ │
│ │    [Messages] [Files] [Stats]    │ │
│ │    Last: "Task approved ✅"      │ │
│ ├─────────────────────────────────┤ │
│ │ 📍 #project-alpha                │ │
│ │    [Messages] [Files] [Stats]    │ │
│ │    Last: "PR review needed"      │ │
│ ├─────────────────────────────────┤ │
│ │ 🔒 #leaders-only (locked)        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Chat View (Center Panel - when channel selected)

```
┌───────────────────────────────────────────────────────────┐
│ #general                                                  │
│ [🔙 Back] [📤 Send] [📎 Attach] [⚙️ Settings]             │
├───────────────────────────────────────────────────────────┤
│                                                            │
│ John Doe (10:30 AM)                                       │
│ Task "docs UI mode" approved! ✅                          │
│                                                            │
│ Alice Smith (10:32 AM)                                    │
│ Great! I'll start implementation now.                      │
│                                                            │
│ [📎] [📤] [🔍] [⚙️]                                      │
└───────────────────────────────────────────────────────────┘
```

### Leader Actions (Right Panel)

```
┌───────────────────────────────────────────────────────────┐
│ Channel Settings (Leader Only)                            │
│                                                           │
│ Channel: #general                                         │
│ Members: John, Alice, Bob, Leader                        │
│                                                           │
│ Actions:                                                  │
│ [📋 Manage Members] [📎 Add Files] [⚙️ Settings]         │
│                                                           │
│ Pinned Messages:                                          │
│ 1. Welcome message                                        │
│ 2. Team guidelines                                        │
└───────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Channels
```
GET    /api/channels                    # List all channels
POST   /api/channels                    # Create channel (leader only)
GET    /api/channels/:id                # Get channel details
DELETE /api/channels/:id                # Delete channel (leader only)

GET    /api/channels/:id/messages      # Get channel messages
POST   /api/channels/:id/messages      # Send message
GET    /api/channels/:id/files         # List channel files
POST   /api/channels/:id/files         # Upload file
```

### Messages
```
GET    /api/messages/search            # Search messages (cross-channel)
POST   /api/messages/pin               # Pin message (leader only)
DELETE /api/messages/:id               # Delete message (leader only)
```

### Notifications
```
GET    /api/notifications              # Get unread count
POST   /api/notifications/read/:id     # Mark as read
GET    /api/notifications              # List notifications
```

### Push Notifications (WebSocket)
```
WebSocket /ws/notifications           # Subscribe to channel events
Event: {
  type: 'message' | 'new_task' | 'time_entry_approved'
  channelId: string
  data: { ... }
}
```

---

## File Attachment Strategy

### Supported File Types
- `.md` - Markdown files (code/docs)
- `.json` - Configuration files
- `.txt` - Text notes
- `.png`, `.jpg` - Screenshots
- `.pdf` - Reports

### File Storage
```json
// workspace/.wayofpi/channels/<channel-id>/files/
// - Files stored per-channel
// - Organized by date
// - Maximum size: 10MB per file
```

---

## Security & Privacy

### Access Control
- Workers: Can only join channels they're assigned to
- Leaders: Can create all channels
- Public channels: Open to all workers
- Private channels: Require invitation

### Message Privacy
- Messages visible only to channel members
- Search limited to current team
- No external sharing
- Leader can archive/delete

### Data Retention
- Messages: 90 days (configurable)
- Files: 180 days (configurable)
- Leader can set longer retention
- GDPR compliance for EU users

---

## Implementation Phases

### Phase 1: Basic Chat (Workers)
**Priority: HIGH | Timeline: 1-2 weeks | See 01-PLAN.md Phase 4**

1. Create `TeamPortal` component (Team Portal section)
2. Implement channel list
3. Basic chat interface
4. File upload support
5. Message search
6. Store in `workspace/.wayofpi/channels/`

### Phase 2: Leader Features
**Priority: MEDIUM | Timeline: 1 week | See WORK_LEADER_SYSTEM_QUICK_REF.md**

1. Channel management (create/delete)
2. Member management
3. Pin important messages
4. Announcements mode
5. Message moderation

### Phase 3: Integration with Work Mode
**Priority: MEDIUM | Timeline: 1 week | See 01-PLAN.md Phase 4**

1. Link messages to tasks (from 01-PLAN.md)
2. Link messages to time entries (from WOP_TIME_MANAGEMENT_PLAN.md)
3. Notification system
4. Mention system (@username)
5. Cross-reference with work data

### Phase 4: WhatsApp/Telegram Integration (Optional)
**Priority: LOW | Timeline: 4-6 weeks | See ref/WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md**

1. Official WhatsApp Business API integration
2. Telegram bot support (via pi-telegram extension)
3. Webhook endpoints for both platforms
4. Message sync between app and WhatsApp/Telegram
5. Export chat history to Work Mode
6. Timed messages for daily task notifications

---
### Phase 4: WhatsApp/Telegram Integration (Optional)
**Priority: LOW | Timeline: 4-6 weeks | See ref/WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md**

1. Official WhatsApp Business API integration
2. Telegram bot support (via pi-telegram extension)
3. Webhook endpoints for both platforms
4. Message sync between app and WhatsApp/Telegram
5. Export chat history to Work Mode (see 01-PLAN.md)
6. Timed messages for daily task notifications (see WORK_LEADER_SYSTEM_QUICK_REF.md)

**Alternative**: Support Telegram, Slack, Discord as fallback
- Use existing APIs if WhatsApp unavailable
- Support custom webhook URLs
- Allow workers to bring own channel (BYOC)

See [WhatsApp CLI Spec](./ref/WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md) for two-bot architecture details.

---



## Configuration

### Channel Configuration File
```json
// workspace/.wayofpi/channels-config.json
{
  "channels": [
    {
      "id": "general",
      "name": "General Chat",
      "description": "Team discussions",
      "access": "public",
      "retentionDays": 90
    },
    {
      "id": "project-alpha",
      "name": "Project Alpha",
      "description": "Work on project-alpha",
      "access": "private",
      "members": ["worker-1", "worker-2", "leader-1"],
      "retentionDays": 180
    },
    {
      "id": "leaders-only",
      "name": "Leaders Channel",
      "description": "Internal team planning",
      "access": "leaders-only",
      "retentionDays": 365
    }
  ],
  "defaultSettings": {
    "maxFileSize": "10MB",
    "allowFileTypes": ["md", "json", "txt", "png", "jpg", "pdf"],
    "webhookUrl": "", // For WhatsApp integration
    "notificationsEnabled": true
  }
}
```

---

## UI Components to Create/Modify

### New Components
1. `apps/wayofpi-ui/src/components/team/TeamPortal.tsx`
2. `apps/wayofpi-ui/src/components/team/ChatView.tsx`
3. `apps/wayofpi-ui/src/components/team/ChannelList.tsx`
4. `apps/wayofpi-ui/src/components/team/MessageInput.tsx`
5. `apps/wayofpi-ui/src/components/team/MessageList.tsx`
6. `apps/wayofpi-ui/src/components/team/ChannelSettings.tsx`

### Modified Components
1. `apps/wayofpi-ui/src/components/WorkApp.tsx` - Add Team Portal section
2. `apps/wayofpi-ui/src/components/UiModeToggle.tsx` - Add Team Chat option

---

## User Experience Flows

### Worker Messages Time Entry
```
1. Worker submits time entry: "Implemented docs UI mode"
2. Leader reviews and approves
3. System auto-messages in #general: "✅ Time entry approved!"
4. Worker sees notification
5. Worker replies: "Thanks! Working on next task now"
6. Leader sees in chat and responds
```

### Task Assignment
```
1. Leader creates task: "Fix navigation bar"
2. Leader assigns to @alice
3. Auto-message: "New task for @alice: Fix navigation bar"
4. Alice replies: "On it!"
5. Alice completes task
6. Auto-message: "Task completed by @alice ✅"
```

---

## Future Enhancements

### WebSocket Real-time
- Live message streaming
- Presence indicators (online/offline)
- Typing indicators

### Rich Media
- Gif stickers
- Reaction emojis
- Polls and surveys
- Screenshots sharing

### Analytics
- Message volume per channel
- Active users
- Response times
- Popular topics

### WhatsApp API (Optional)
- Official WhatsApp Business API
- Message sync between app and WhatsApp
- File delivery to WhatsApp
- End-to-end encryption

---

## Questions to Decide

1. **Official WhatsApp Integration**: 
   - Use WhatsApp Business API (requires phone number, fees)
   - Or support custom webhook URLs (BYOC approach)
   - Recommendation: Support both

2. **File Storage Limits**:
   - Current: 10MB per file
   - Ask users: What's your typical file size?
   - Recommendation: 50MB for images, 20MB for docs

3. **Message Retention**:
   - How long should messages persist?
   - Recommendation: 90 days default, configurable

4. **Notification Strategy**:
   - Real-time WebSocket vs. periodic polling
   - Recommendation: WebSocket with fallback

5. **Team vs. Individual Channels**:
   - Should each worker have private channel?
   - Recommendation: Start with team channels only

6. **Integration with Work Mode**:
   - Auto-pull task data from Work Mode (see 01-PLAN.md Phase 4)
   - Link time entries to WhatsApp messages (see WOP_TIME_MANAGEMENT_PLAN.md)
   - Recommendation: Implement in Phase 3

7. **Contact Management**:
   - Use phone number database or WhatsApp contacts?
   - Recommendation: Use WhatsApp Business API contact list

---

## Related Documents

- [Work Button Plan](../01-PLAN.md) - Main navigation and UI modes
- [Navigation Architecture](../02-NAVIGATION-ARCHITECTURE.md) - RBAC and role-based visibility
- [Worker Portal Demo Mode](../03-WORKER-PORTAL-DEMO-MODE.md) - Demo mode implementation
- [WhatsApp Integration Plan](./04_WHATSAPP_INTEGRATION_PLAN.md) - This document (consolidated)
- [Time Management Plan](./ref/WOP_TIME_MANAGEMENT_PLAN.md) - Work mode time tracking
- [WhatsApp CLI Spec](./ref/WHATSAPP_PI_CLAW_INTEGRATION_SPEC.md) - Two-bot architecture
- [Work Leader System](./ref/WORK_LEADER_SYSTEM_QUICK_REF.md) - Leader/Worker bot overview
- [WorkerPortal Component](../../apps/wayofpi-ui/src/pages/WorkerPortal.tsx) - Portal implementation

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2024-01-XX | Initial WhatsApp integration planning | Way of Pi Team |
| 0.2 | NOW | Added Phase 4: WhatsApp API integration | Way of Pi Team |

---

**Status**: 📝 Planning phase (ready for Phase 1 implementation)

**Dependencies**:
- ✅ Local hosting infrastructure (from TODO.md)
- ✅ API endpoint infrastructure
- ✅ File storage system

**Blockers**:
- None identified (can start with basic chat)
- WhatsApp API requires business verification (optional Phase 4)
</think>

```markdown
# WOP WhatsApp Integration Plan - Team Communication

## Overview
Integrate WhatsApp (or similar messaging) as a team communication channel within the Work button dashboard. This enables workers and leaders to communicate instantly about tasks, time entries, and work progress while maintaining the project's security model.

**Proposed location**: `Work` dashboard → Team Portal → WhatsApp Messages

---

## Goals

### Primary Goal
Enable **real-time team communication** integrated with work management, allowing workers and leaders to:
- Discuss tasks and time entries
- Share work updates via chat
- Coordinate with team members
- Receive notifications about approvals/rejections

### Secondary Goals
- Support multiple team chat channels
- Link messages to specific tasks/time entries
- Archive important conversations
- Export chat history for documentation

---

## Architecture

### Communication Model

```
┌────────────────────────────────────────────────────────────┐
│                    Work Dashboard                            │
│  ┌─────────────┬─────────────────┬───────────────────────┐ │
│  │ Team        │ Time/Tasks      │ Leader Actions         │ │
│  │ Browser     │ View            │                        │ │
│  └─────────────┴─────────────────┴───────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Team Portal (WhatsApp Chat)               │ │
│  │  Channel 1: #general                                  │ │
│  │  Channel 2: #project-alpha                            │ │
│  │  Channel 3: #leaders-only                             │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Existing Work Dashboard**:
   - Team Portal section links to WhatsApp
   - Messages appear in dedicated panel
   - Context-aware (current task/project)

2. **Message Context**:
   - Link to related task (via task ID)
   - Link to time entry (via entry ID)
   - Link to file (via file path)
   - Link to worker (via worker ID)

3. **Notification System**:
   - Approvals/rejections trigger messages
   - New tasks appear in channel
   - Deadline warnings sent to channel

---

## User Roles

### Workers
- Read and write messages in team channels
- See mentions (@username) from others
- Receive notifications about task assignments
- Submit messages related to work

### Work Leader
- All worker permissions PLUS:
- Create/delete channels
- Pin important messages
- Moderate channels
- Send announcements
- Set channel topics

---

## Data Model

### Channel
```typescript
interface Channel {
  id: string; // e.g., "general", "project-alpha"
  name: string; // Display name
  description?: string; // Channel purpose
  access: 'public' | 'private' | 'leaders-only';
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  channelId: string;
  senderId: string; // workerId
  senderName: string;
  content: string; // Markdown support
  attachments?: File[];
  taskId?: string; // Optional: link to task
  timeEntryId?: string; // Optional: link to time entry
  fileName?: string; // Optional: link to file
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  readAt?: string;
}
```

### Worker Profile Update
```typescript
// Add to existing Worker interface
interface Worker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'leader';
  whatsappEnabled: boolean; // Optional: opt-in to chat
  joinedAt: string;
}
```

---

## UI Layout

### Team Portal Panel (Left Panel)

```
┌─────────────────────────────────────┐
│ Team Portal                         │
├─────────────────────────────────────┤
│ Channels:                           │
│ ┌─────────────────────────────────┐ │
│ │ 📍 #general                      │ │
│ │    [Messages] [Files] [Stats]    │ │
│ │    Last: "Task approved ✅"      │ │
│ ├─────────────────────────────────┤ │
│ │ 📍 #project-alpha                │ │
│ │    [Messages] [Files] [Stats]    │ │
│ │    Last: "PR review needed"      │ │
│ ├─────────────────────────────────┤ │
│ │ 🔒 #leaders-only (locked)        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Chat View (Center Panel - when channel selected)

```
┌───────────────────────────────────────────────────────────┐
│ #general                                                  │
│ [🔙 Back] [📤 Send] [📎 Attach] [⚙️ Settings]             │
├───────────────────────────────────────────────────────────┤
│                                                            │
│ John Doe (10:30 AM)                                       │
│ Task "docs UI mode" approved! ✅                          │
│                                                            │
│ Alice Smith (10:32 AM)                                    │
│ Great! I'll start implementation now.                      │
│                                                            │
│ [📎] [📤] [🔍] [⚙️]                                      │
└───────────────────────────────────────────────────────────┘
```

### Leader Actions (Right Panel)

```
┌───────────────────────────────────────────────────────────┐
│ Channel Settings (Leader Only)                            │
│                                                           │
│ Channel: #general                                         │
│ Members: John, Alice, Bob, Leader                        │
│                                                           │
│ Actions:                                                  │
│ [📋 Manage Members] [📎 Add Files] [⚙️ Settings]         │
│                                                           │
│ Pinned Messages:                                          │
│ 1. Welcome message                                        │
│ 2. Team guidelines                                        │
└───────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Channels
```
GET    /api/channels                    # List all channels
POST   /api/channels                    # Create channel (leader only)
GET    /api/channels/:id                # Get channel details
DELETE /api/channels/:id                # Delete channel (leader only)

GET    /api/channels/:id/messages      # Get channel messages
POST   /api/channels/:id/messages      # Send message
GET    /api/channels/:id/files         # List channel files
POST   /api/channels/:id/files         # Upload file
```

### Messages
```
GET    /api/messages/search            # Search messages (cross-channel)
POST   /api/messages/pin               # Pin message (leader only)
DELETE /api/messages/:id               # Delete message (leader only)
```

### Notifications
```
GET    /api/notifications              # Get unread count
POST   /api/notifications/read/:id     # Mark as read
GET    /api/notifications              # List notifications
```

### Push Notifications (WebSocket)
```
WebSocket /ws/notifications           # Subscribe to channel events
Event: {
  type: 'message' | 'new_task' | 'time_entry_approved'
  channelId: string
  data: { ... }
}
```

---

## File Attachment Strategy

### Supported File Types
- `.md` - Markdown files (code/docs)
- `.json` - Configuration files
- `.txt` - Text notes
- `.png`, `.jpg` - Screenshots
- `.pdf` - Reports

### File Storage
```json
// workspace/.wayofpi/channels/<channel-id>/files/
// - Files stored per-channel
// - Organized by date
// - Maximum size: 10MB per file
```

---

## Security & Privacy

### Access Control
- Workers: Can only join channels they're assigned to
- Leaders: Can create all channels
- Public channels: Open to all workers
- Private channels: Require invitation

### Message Privacy
- Messages visible only to channel members
- Search limited to current team
- No external sharing
- Leader can archive/delete

### Data Retention
- Messages: 90 days (configurable)
- Files: 180 days (configurable)
- Leader can set longer retention
- GDPR compliance for EU users

---

## Implementation Phases

### Phase 1: Basic Chat (Workers)
**Priority: HIGH | Timeline: 1-2 weeks**

1. Create `TeamPortal` component
2. Implement channel list
3. Basic chat interface
4. File upload support
5. Message search
6. Store in `workspace/.wayofpi/channels/`

### Phase 2: Leader Features
**Priority: MEDIUM | Timeline: 1 week**

1. Channel management (create/delete)
2. Member management
3. Pin important messages
4. Announcements mode
5. Message moderation

### Phase 3: Integration
**Priority: MEDIUM | Timeline: 1 week**

1. Link messages to tasks
2. Link messages to time entries
3. Notification system
4. Mention system (@username)
5. Cross-reference with work data

### Phase 4: WhatsApp (Optional)
**Priority: LOW | Timeline: 4-6 weeks**

1. Official WhatsApp API integration
2. WhatsApp Business API setup
3. Webhook endpoints for WhatsApp
4. Message sync between app and WhatsApp
5. Export chat history

**Alternative**: Support Telegram, Slack, Discord as fallback
- Use existing APIs if WhatsApp unavailable
- Support custom webhook URLs
- Allow workers to bring own channel (BYOC)

---

## Integration with Existing Features

### Time Entry Workflow
```
1. Worker submits time entry
2. Leader approves
3. Auto-message: "Task 'docs UI' approved! ✅"
4. Worker sees notification in chat
5. Worker responds with comments
```

### Task Management Workflow
```
1. Leader creates task
2. Assigns to worker
3. Auto-message: "New task assigned to @Worker"
4. Worker accepts task
5. Auto-message: "@Worker accepted task"
6. Worker completes task
7. Auto-message: "Task completed! ✅"
```

### File Sharing Workflow
```
1. Worker needs reference material
2. Shares via chat
3. Leader attaches to task
4. Worker links in time entry
5. File archived to workspace
```

---

## Configuration

### Channel Configuration File
```json
// workspace/.wayofpi/channels-config.json
{
  "channels": [
    {
      "id": "general",
      "name": "General Chat",
      "description": "Team discussions",
      "access": "public",
      "retentionDays": 90
    },
    {
      "id": "project-alpha",
      "name": "Project Alpha",
      "description": "Work on project-alpha",
      "access": "private",
      "members": ["worker-1", "worker-2", "leader-1"],
      "retentionDays": 180
    },
    {
      "id": "leaders-only",
      "name": "Leaders Channel",
      "description": "Internal team planning",
      "access": "leaders-only",
      "retentionDays": 365
    }
  ],
  "defaultSettings": {
    "maxFileSize": "10MB",
    "allowFileTypes": ["md", "json", "txt", "png", "jpg", "pdf"],
    "webhookUrl": "", // For WhatsApp integration
    "notificationsEnabled": true
  }
}
```

---

## UI Components to Create/Modify

### New Components
1. `apps/wayofpi-ui/src/components/team/TeamPortal.tsx`
2. `apps/wayofpi-ui/src/components/team/ChatView.tsx`
3. `apps/wayofpi-ui/src/components/team/ChannelList.tsx`
4. `apps/wayofpi-ui/src/components/team/MessageInput.tsx`
5. `apps/wayofpi-ui/src/components/team/MessageList.tsx`
6. `apps/wayofpi-ui/src/components/team/ChannelSettings.tsx`

### Modified Components
1. `apps/wayofpi-ui/src/components/WorkApp.tsx` - Add Team Portal section
2. `apps/wayofpi-ui/src/components/UiModeToggle.tsx` - Add Team Chat option

---

## User Experience Flows

### Worker Messages Time Entry
```
1. Worker submits time entry: "Implemented docs UI mode"
2. Leader reviews and approves
3. System auto-messages in #general: "✅ Time entry approved!"
4. Worker sees notification
5. Worker replies: "Thanks! Working on next task now"
6. Leader sees in chat and responds
```

### Task Assignment
```
1. Leader creates task: "Fix navigation bar"
2. Leader assigns to @alice
3. Auto-message: "New task for @alice: Fix navigation bar"
4. Alice replies: "On it!"
5. Alice completes task
6. Auto-message: "Task completed by @alice ✅"
```

---

## Future Enhancements

### WebSocket Real-time
- Live message streaming
- Presence indicators (online/offline)
- Typing indicators

### Rich Media
- Gif stickers
- Reaction emojis
- Polls and surveys
- Screenshots sharing

### Analytics
- Message volume per channel
- Active users
- Response times
- Popular topics

### WhatsApp API (Optional)
- Official WhatsApp Business API
- Message sync between app and WhatsApp
- File delivery to WhatsApp
- End-to-end encryption

---

## Questions to Decide

1. **Official WhatsApp Integration**: 
   - Use WhatsApp Business API (requires phone number, fees)
   - Or support custom webhook URLs (BYOC approach)
   - Recommendation: Support both

2. **File Storage Limits**:
   - Current: 10MB per file
   - Ask users: What's your typical file size?
   - Recommendation: 50MB for images, 20MB for docs

3. **Message Retention**:
   - How long should messages persist?
   - Recommendation: 90 days default, configurable

4. **Notification Strategy**:
   - Real-time WebSocket vs. periodic polling
   - Recommendation: WebSocket with fallback

5. **Team vs. Individual Channels**:
   - Should each worker have private channel?
   - Recommendation: Start with team channels only

6. **Integration with Work Mode**:
   - Auto-pull task data from Work Mode (see 01-PLAN.md Phase 4)
   - Link time entries to WhatsApp messages (see WOP_TIME_MANAGEMENT_PLAN.md)
   - Recommendation: Implement in Phase 3

7. **Contact Management**:
   - Use phone number database or WhatsApp contacts?
   - Recommendation: Use WhatsApp Business API contact list

---

## Future Enhancements
## Related Documents

- [Time Management Plan](./WOP_TIME_MANAGEMENT_PLAN.md)
- [Work Button Plan](../01-PLAN.md)
- [WorkerPortal Component](../../apps/wayofpi-ui/src/pages/WorkerPortal.tsx)

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2024-01-XX | Initial WhatsApp integration planning | Way of Pi Team |
| 0.2 | NOW | Added Phase 4: WhatsApp API integration | Way of Pi Team |

---

**Status**: 📝 Planning phase (ready for Phase 1 implementation)

**Dependencies**:
- ✅ Local hosting infrastructure (from TODO.md)
- ✅ API endpoint infrastructure
- ✅ File storage system

**Blockers**:
- None identified (can start with basic chat)
- WhatsApp API requires business verification (optional Phase 4)
