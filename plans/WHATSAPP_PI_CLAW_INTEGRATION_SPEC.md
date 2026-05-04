# WhatsApp Pi Integration Specification

> **Status:** Active development. One service, one document - separate from Telegram.

## Architecture
**WhatsApp:** Direct via `RaphaelCastello/whatsapp-pi` extension (standalone).
**Telegram:** Direct via `badlogic/pi-telegram` extension (standalone).

Two separate systems, two separate documents, two separate services.

---

## Timed Messages Feature (MANDATORY for Project Managers)

### Overview
Project managers need to send **automated daily messages** to employees' phones every morning with "what to do today". This is a core feature for WhatsApp (and Telegram) integration.

### Use Case: Morning Task Notifications
1. **Project Manager** opens Claw interface
2. Goes to **Contacts** tab (WhatsApp/Telegram)
3. Selects employees from contact list
4. Sets up **timed message** (every day at 8:00 AM)
5. Message contains: "Today's tasks: [tasks from Work mode]"
6. System automatically sends to employees' phones via WhatsApp/Telegram

### Data Model

#### Contact List
```typescript
interface Contact {
  id: string;
  name: string;
  phone: string; // WhatsApp format: "1234567890"
  platform: 'whatsapp' | 'telegram';
  role: string; // "developer", "designer", "qa", etc.
  active: boolean;
  lastMessageAt?: string;
}
```

#### Timed Message
```typescript
interface TimedMessage {
  id: string;
  name: string; // "Morning Tasks - Dev Team"
  content: string; // "Good morning! Today: {tasks}"
  schedule: {
    type: 'daily' | 'weekly' | 'custom';
    time: string; // "08:00" (24h format)
    days?: number[]; // [1,2,3,4,5] for weekdays only
    timezone: string; // "America/New_York"
  };
  recipients: string[]; // Contact ids
  source: {
    type: 'static' | 'from_work_mode'; // Pull tasks from "Work" mode
    staticText?: string;
  };
  enabled: boolean;
  lastSentAt?: string;
  createdBy: string; // Project Manager id
  createdAt: string;
}
```

### Claw UI Integration

#### Location
**Claw → Contacts Tab → "Timed Messages" Section**

```
┌─────────────────────────────────────┐
│  Contacts (WhatsApp)               │
├─────────────────────────────────────┤
│  [+ Add Contact] [Import from Phone]│
│                                   │
│  📱 John Doe (Developer)  [Edit]  │
│  📱 Jane Smith (Designer) [Edit]  │
│  📱 Bob Wilson (QA)      [Edit]  │
├─────────────────────────────────────┤
│  Timed Messages                    │
│  ─────────────────────────────    │
│  ☑ Morning Tasks (8:00 AM)      │
│    → 3 recipients, Daily         │
│    [Edit] [Disable] [Delete]      │
│                                   │
│  [+ New Timed Message]            │
└─────────────────────────────────────┘
```

#### New Timed Message Form
```
┌─────────────────────────────────────┐
│  New Timed Message                 │
├─────────────────────────────────────┤
│  Name: [Morning Tasks - Dev Team] │
│                                   │
│  Schedule:                        │
│    Time: [08:00___]              │
│    Repeat: [Daily ▼]              │
│    Days: [✓] Mon [✓] Tue...     │
│                                   │
│  Recipients:                      │
│    ☑ John Doe (Developer)         │
│    ☑ Jane Smith (Designer)        │
│    ☐ Bob Wilson (QA)              │
│                                   │
│  Message Source:                   │
│    ⚫ Static text                  │
│    ⚫ From Work Mode (auto-pull)   │
│                                   │
│  Static Text: (if static)          │
│    [Good morning! Today's tasks:   │
│     {tasks from Work mode}]        │
│                                   │
│  [Save]  [Cancel]                │
└─────────────────────────────────────┘
```

### Server API Endpoints

#### Contacts
- `GET /api/whatsapp/contacts` - List all contacts
- `POST /api/whatsapp/contacts` - Add new contact
- `PUT /api/whatsapp/contacts/:id` - Update contact
- `DELETE /api/whatsapp/contacts/:id` - Remove contact

#### Timed Messages
- `GET /api/whatsapp/timed-messages` - List all timed messages
- `POST /api/whatsapp/timed-messages` - Create new timed message
- `PUT /api/whatsapp/timed-messages/:id` - Update timed message
- `POST /api/whatsapp/timed-messages/:id/toggle` - Enable/disable
- `DELETE /api/whatsapp/timed-messages/:id` - Delete timed message
- `POST /api/whatsapp/send-now/:id` - Send immediately (test)

#### Message Sending (Internal)
- `POST /api/whatsapp/send` - Send message to contact(s)
- Called by timer or manually
- Integrates with `whatsapp-pi` extension

### Integration with Work Mode

When `source.type = 'from_work_mode'`:
1. Query **Work Mode** (`/api/time-entries?worker=...&date=today`)
2. Get tasks assigned to employee
3. Format message: "Good morning {name}! Today: {task1}, {task2}..."
4. Send via WhatsApp API

Example auto-generated message:
```
Good morning John! 🌅
Today's tasks (2026-05-05):
✅ Review PR #123
🚀 Implement Docs UI mode  
📝 Update CHANGELOG

Sent by Project Manager via Way of Pi
```

### Storage (Server-Side)

#### Files
- `workspace/.wayofpi/whatsapp-contacts.json`
- `workspace/.wayofpi/whatsapp-timed-messages.json`

#### Example `whatsapp-timed-messages.json`
```json
{
  "messages": [
    {
      "id": "tm-001",
      "name": "Morning Tasks - Dev Team",
      "content": "Good morning {name}! Today: {tasks}",
      "schedule": {
        "type": "daily",
        "time": "08:00",
        "timezone": "America/New_York"
      },
      "recipients": ["contact-001", "contact-002"],
      "source": {
        "type": "from_work_mode"
      },
      "enabled": true,
      "createdBy": "pm-001",
      "createdAt": "2026-05-05T10:00:00Z"
    }
  ]
}
```

### Implementation Phases

#### Phase 1: Contact Management
1. Create contact list UI in Claw Contacts tab
2. Store contacts in `whatsapp-contacts.json`
3. Add/Edit/Delete contacts
4. Import from phone (future)

#### Phase 2: Basic Timed Messages
1. Create timed message form
2. Store in `whatsapp-timed-messages.json`
3. Cron job runs every minute, checks schedules
4. Send message via `whatsapp-pi` extension

#### Phase 3: Work Mode Integration
1. Query Work Mode API for employee tasks
2. Auto-format message with tasks
3. Send personalized messages
4. Fallback to static text if no tasks

#### Phase 4: Advanced Features
1. Message templates
2. Read receipts / delivery status
3. Reply handling ("I'm sick today" → notify PM)
4. Analytics (who reads messages, response times)

### Claw Contacts Tab Changes

#### Current:
```
Contacts | Channels | Schedules | Settings
```

#### Updated:
```
Contacts | Timed Messages | Channels | Schedules | Settings
```

- **Contacts:** Manage contact list
- **Timed Messages:** Set up automated daily messages (NEW)
- **Channels:** WhatsApp/Telegram connection status
- **Schedules:** Existing Claw schedules (unrelated)
- **Settings:** Extension settings

### Security & Permissions

#### Project Manager:
- ✅ Create timed messages
- ✅ Select recipients from contact list
- ✅ Enable/disable messages
- ✅ View delivery status

#### Employees (Recipients):
- ❌ Cannot see timed messages setup
- ✅ Receive messages on their phones
- ✅ Can reply (future: PM gets notified)

### Example Workflow

1. **PM sets up contacts:**
   - John Doe, +1-234-567-890, Developer
   - Jane Smith, +1-234-567-891, Designer

2. **PM creates timed message:**
   - Name: "Morning Tasks - All"
   - Time: 8:00 AM daily
   - Recipients: John, Jane
   - Source: From Work Mode

3. **Every day at 8:00 AM:**
   - System queries Work Mode for each employee's tasks
   - Formats message
   - Sends via WhatsApp to John and Jane

4. **Employees receive:**
   ```
   Good morning John! 🌅
   Today's tasks (2026-05-05):
   ✅ Review PR #123
   🚀 Implement Docs UI mode
   
   Sent by PM via Way of Pi
   ```

---

## Legacy Section (Superseded)

### Previous Architecture
1. User → WhatsApp Pi Bot
2. WhatsApp Pi Bot → Telegram Bridge (Relay)
3. Telegram Bridge → Way of Pi Agent

### New Architecture (Canonical)
*See [WOP_WHATSAPP_PLAN.md](../../docs/wayofpi/WOP_WHATSAPP_PLAN.md) for details.*

1. User → WhatsApp Business API
2. WhatsApp Pi extension → Way of Pi Agent
3. Way of Pi Agent → Result back to WhatsApp
