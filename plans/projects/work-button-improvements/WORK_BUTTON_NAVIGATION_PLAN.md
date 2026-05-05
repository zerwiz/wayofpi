# Work Button Navigation Plan

## 📋 Overview

This module handles all navigation events from the work button, enabling transitions between different states and modes within the application.

---

## 🎯 Navigation States

### Button States

| State | Description | Action |
|--|--|--|
| **Idle** | No recent interaction | Ready for entry |
| **Click Pending** | Worker clicked, waiting review | Pending state |
| **Approving** | Leader reviewing, clicking approve | Approved state |
| **Rejecting** | Leader reviewing, clicking reject | Rejected state |
| **Editing** | Worker editing entry | Edit mode active |

### Navigation Events

| Event | Source | Target | Code | Description |
|--|--|--|--|--|
| `ENTRY_REQUEST` | Worker | PortalEntryPage | `ENTRY_REQUEST` | Request entry creation |
| `ENTRY_SUBMITTED` | Worker | EntrySubmitted | `ENTRY_SUCCESS` | Entry submitted successfully |
| `ENTRY_APPROVED` | Leader | ApprovedEntry | `ENTRY_APPROVED` | Entry approved |
| `ENTRY_REJECTED` | Leader | RejectedEntry | `ENTRY_REJECTED` | Entry rejected |
| `ENTRY_EDITED` | Worker | EditEntryPage | `ENTRY_EDIT` | Entry being edited |
| `ENTRY_DELETED` | Worker | DeletedEntry | `ENTRY_DELETED` | Entry deleted |

---

## 🎨 React Navigation Implementation

### 1. Button Component

```typescript
// WORK_BUTTON.tsx
import React, { useState, useCallback } from 'react';
import { NavigationProps } from '../types';

export const WorkButton: React.FC<NavigationProps> = ({
  projectId,
  projectName,
  hours,
  status,
  isLeader,
  onClick,
  onEdit,
  onDelete,
  onReview,
  onDeleteEntry
}) => {

  const handleClick = useCallback(() => {
    if (status === 'rejected') {
      // Show delete confirmation
      if (window.confirm('Delete this rejected entry?')) {
        onDeleteEntry(projectId);
        return;
      }
    }
    
    onClick({ projectId, projectName, hours, status, isLeader });
  }, [projectId, projectName, hours, status, isLeader, onClick, onDeleteEntry]);

  const handleEdit = useCallback(() => {
    onEdit({ projectId, projectName, hours, status });
  }, [projectId, projectName, hours, status, onEdit]);

  return (
    <button
      className={`work-button ${status}-status`}
      onClick={handleClick}
      disabled={status === 'processing'}
    >
      <div className="button-content">
        <span>{projectName}</span>
        <span>{hours} hrs</span>
      </div>
    </button>
  );
};
```

### 2. Event Handlers

```typescript
// Navigation Event Flow
type NavigationEvent = {
  projectId: string;
  projectName: string;
  hours: number;
  status: EntryStatus;
  timestamp: Date;
  workerId: string;
  leaderId?: string;
};

// Event dispatch
function dispatchNavigationEvent(
  event: NavigationEvent,
  eventBus: Event Bus
) {
  eventBus.emit('NAVIGATION_EVENT', event);
}

// Handle entry request
function handleEntryRequest(event: NavigationEvent) {
  if (event.status === 'pending') {
    // Route to pending queue
    navigate('/portal/entries/pending', { projectId });
  }
}

// Handle entry approval
function handleEntryApproval(event: NavigationEvent) {
  if (event.status === 'pending') {
    // Update to approved
    updateEntryStatus(event.projectId, 'approved');
  }
}
```

### 3. Navigation Service

```typescript
// src/services/navigationService.ts
import { EntryStatus, NavigationEvent } from '../types';
import { eventBus } from '../services/eventBus';

export class NavigationService {
  private readonly ENTRY_REQUEST = 'ENTRY_REQUEST';
  private readonly ENTRY_REVIEW = 'ENTRY_REVIEW';
  private readonly ENTRY_REVIEWER_UPDATED;
  private readonly ENTRY_REVIEWER_REVIEWED;
  private readonly ENTRY_REVIEWED_SUBMITTED;
  private readonly ENTRY_REVIEWED_SUBMITTED;
  private readonly ENTRY_REVIEWER_REVIEWER_REMOVED;
  private readonly ENTRY_DELETED;
  private readonly ENTRY_ARCHIVED;

  constructor(private readonly entryRepository: EntryRepository) {}

  async navigateToEntry(entry: Entry) {
    return navigateToEntry({
      id: entry.id,
      projectId: entry.projectId,
      projectName: entry.projectName,
      hours: entry.hours,
      status: entry.status,
    });
  }
}
```

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                 WORK BUTTON                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  Worker Portal    │  │   Navigation Controller │ │
│  │                  │──┼─────────────────────────┤  │
│  │  [Entry Request] │  │                         │  │
│  └─────────────────┘  │  ┌─────────────────────┐│  │
│                       │  │   Navigation Event   ││  │
│                       │  │   Router & Handler   ││  │
│                       │  └─────────────────────┘│  │
│                       └───────┬─────────────────┘  │
│                              │                     │
│                       ┌──────┴──────────────────┐  │
│                       │   Worker Portal          │  │
│                       │   - TimeEntry Component  │  │
│                       │   - EntryList Component  │  │
│                       │   - PortalHeader         │  │
│                       └──────────────────────────┘  │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  Leader Portal   │  │   Event Bus             │  │
│  │  (Review Queue)  │──┼─────────────────────────┤  │
│  └─────────────────┘  │   - Broadcast Events     │  │
│                       │                         │  │
│                       │   ┌─────────────────────┐│  │
│                       │   │   EntryRepository   ││  │
│                       │   │   - CRUD Operations  ││  │
│                       │   │   - Status Updates   ││  │
│                       │   └─────────────────────┘│  │
│                       └──────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 Event Flow Implementation

### 1. Worker Click Handler

```typescript
// HANDLER: Worker Entry Request
handleWorkerEntryRequest = async (projectId: string, projectName: string) => {
  const event: NavigationEvent = {
    projectId,
    projectName,
    hours: calculateDefaultHours(),
    status: 'pending',
    timestamp: new Date(),
    workerId: currentUserId(),
  };

  // Emit event to other instances
  await eventBus.emit('ENTRY_REQUEST', event);
  
  // Update local state
  this.updateEntryStatus(event.projectId, event.status);
  
  // Navigate to portal
  navigateTo('/portal/portal', event);
};
```

### 2. Leader Review Handler

```typescript
// HANDLER: Leader Entry Approval
handleLeaderApproval = async (projectId: string) => {
  const event: NavigationEvent = {
    ...findPendingEntry(projectId),
    status: 'approved',
    timestamp: new Date(),
    leaderId: currentUserId(),
  };

  // Update in database
  await entryRepository.update(event);
  
  // Emit update event
  await eventBus.emit('ENTRY_APPROVED', event);
};

// HANDLER: Leader Entry Rejection
handleLeaderRejection = async (projectId: string) => {
  const event: NavigationEvent = {
    ...findPendingEntry(projectId),
    status: 'rejected',
    timestamp: new Date(),
    leaderId: currentUserId(),
  };

  // Update in database
  await entryRepository.update(event);
  
  // Emit update event
  await eventBus.emit('ENTRY_REJECTED', event);
};
```

---

## 📱 Navigation Routing

### React Router Implementation

```typescript
// src/services/router.ts
import { useNavigate } from 'react-router-dom';

export const useNavigation = () => {
  const navigate = useNavigate();

  const navigateTo = (path: string) => {
    navigate(path, { replace: true });
  };

  const navigateBack = () => {
    navigate(-1);
  };

  return { navigate, navigateTo, navigateBack, currentPath: window.location.pathname };
};

// Navigation routes
export const navigationRoutes = {
  '/portal': 'Worker Portal',
  '/portal/entries': 'Time Entries',
  '/portal/entries/new': 'New Entry',
  '/portal/entries/pending': 'Pending Review',
  '/portal/entries/approved': 'Approved Entries',
  '/portal/entries/rejected': 'Rejected Entries',
};
```

---

## 🧩 Component Integration

### Portal Entry Flow

1. **Worker clicks Work Button**
2. **Event emitted to navigation controller**
3. **Controller creates navigation event**
4. **Event stored in database**
5. **Worker portal displays entry**
6. **Leader reviews entry**
7. **Leader clicks approve/reject**
8. **Entry updated with new status**
9. **Event emitted to workers**
10. **Entry moved to appropriate queue**

### React Code Example

```typescript
// WorkerPortal.tsx
import { WorkButton } from './components/WorkButton';
import { PortalHeader } from './components/PortalHeader';

export const WorkerPortal: React.FC = () => {
  const { navigate, navigateTo } = useNavigation();

  const handleEntryClick = useCallback((event: NavigationEvent) => {
    // Store entry in local state
    this.setEntry(event);
    
    // Render appropriate component
    this.switchEntryComponent(event.status);
  }, []);

  return (
    <div className="portal-container">
      <PortalHeader />
      <main>
        <WorkButton
          onClick={handleEntryClick}
          projectId={entry.projectId}
          projectName={entry.projectName}
          hours={entry.hours}
          status={entry.status}
        />
        
        {/* Conditional rendering */}
        {entry.status === 'pending' ? <PendingEntryReview /> : null}
        {entry.status === 'approved' ? <ApprovedEntryView /> : null}
        {entry.status === 'rejected' ? <RejectedEntryView /> : null}
      </main>
    </div>
  );
};
```

---

## 🎯 Status Management

```typescript
// Status State Management
type EntryStatus = 'pending' | 'approved' | 'rejected' | 'editing';

// Status reducer
const entryReducer = (state: EntryState, action: Action) => {
  switch (action.type) {
    case 'ENTRY_REQUEST':
      return { ...state, status: 'pending' };
    case 'ENTRY_REVIEWING':
      return { ...state, status: 'reviewing', timestamp: new Date() };
    case 'ENTRY_REVIEWED':
      return { ...state, status: action.payload as EntryStatus };
    case 'ENTRY_DELETED':
      return { ...state, deleted: true };
    default:
      return state;
  }
};
```

---

## 🧪 Testing Navigation

```typescript
// Test navigation events
describe('Navigation Events', () => {
  it('handles entry creation', async () => {
    const mockEvent = {
      projectId: 'project-1',
      projectName: 'Project A',
      hours: 8,
      status: 'pending',
    };

    eventBus.emit('ENTRY_REQUEST', mockEvent);
    
    // Verify event emitted
    expect(await eventBus.waitFor('NAVIGATION_EVENT')).to.eql(mockEvent);
  });

  it('handles entry approval', async () => {
    const mockEvent = { ...mockEvent, status: 'approved' };
    
    eventBus.emit('ENTRY_APPROVED', mockEvent);
    
    // Verify updated status
    const updatedEntry = await entryRepository.get('project-1');
    expect(updatedEntry.status).to.eql('approved');
  });
});
```

---

## 📞 Support

For navigation issues:

- Check event bus configuration
- Verify navigation routes
- Review entry repository methods
- Check navigation controller logs

---

**END OF NAVIGATION PLAN**
