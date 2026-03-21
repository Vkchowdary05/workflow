# Drag-to-Action System

The drag-to-action system is the core UX feature of the Quantixone Workflow Builder. It allows users to **drag workflow nodes from the ReactFlow canvas** and **drop them onto sidebar panels** to trigger real backend API calls.

---

## How It Works

### 1. Making Nodes Draggable

Every node in `CustomNodes.jsx` has:
```jsx
<div draggable onDragStart={makeOnDragStart(data)} ...>
```

The `makeOnDragStart` helper serializes node data into the `dataTransfer` object using a custom MIME type:

```javascript
e.dataTransfer.setData('application/quantixone-node', JSON.stringify({
  nodeKind:   data.nodeKind,    // 'trigger' | 'action' | 'condition' | 'delay'
  actionType: data.actionType,  // 'send_email' | 'send_sms' | 'move_pipeline' | ...
  label:      data.label,
  config:     data.config,
  stepId:     data.stepId,
}));
```

### 2. Drop Zone Setup

Each sidebar panel implements three HTML5 drag event handlers:

```javascript
onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
onDragLeave={(e) => { setDragOver(false); }}
onDrop={(e) => handleDrop(e)}
```

Drop zones exist at two levels:
- **Panel level** — drop on the panel header → applies action to the first item
- **Card level** — drop on a specific contact/opportunity card → applies to that item

### 3. Parsing Drop Data

The shared `dragHelpers.js` utility reads the custom MIME type:

```javascript
export function parseDropData(e) {
  const raw = e.dataTransfer.getData('application/quantixone-node');
  return raw ? JSON.parse(raw) : null;
}
```

---

## Action Matrix

### Contacts Panel

| Node Action Type | What Happens |
|-----------------|-------------|
| `send_email` | `POST /messages/email` with contact's email |
| `send_sms` | `POST /messages/sms` with contact's phone |
| `send_whatsapp` | `POST /messages/whatsapp` with contact's phone |
| `add_tag` | `POST /contacts/{id}/tags` with tags from node config |
| `update_contact` | `PUT /contacts/{id}` with field_updates (template variables filtered out) |
| `create_opportunity` | `POST /opportunities` linked to the contact |
| `move_pipeline` | ⚠ Warning toast: "Applies to opportunities, not contacts" |

### Opportunities Panel

| Node Action Type | What Happens |
|-----------------|-------------|
| `move_pipeline` | `PUT /opportunities/{id}/move` with `target_stage` from config |
| `update_contact` | `PUT /contacts/{linked_contact_id}` — updates the linked contact |
| `add_tag` | `POST /contacts/{linked_contact_id}/tags` — tags the linked contact |
| `send_email` | `POST /messages/email` to linked contact's email |
| `send_sms` | `POST /messages/sms` to linked contact's phone |
| `send_whatsapp` | `POST /messages/whatsapp` to linked contact's phone |
| `create_opportunity` | ⚠ Warning toast: "Cannot apply to existing opportunity" |

### Execute Panel

| Any Node Type | What Happens |
|--------------|-------------|
| Any node | `POST /workflows/{id}/execute` — triggers full workflow execution |

---

## Visual Feedback

### Drop Zone Highlighting

When a node is dragged over a panel, CSS classes are applied:

| Panel | CSS Class | Visual Effect |
|-------|-----------|--------------|
| Contacts | `.drop-active-contact` | Purple dashed border + light indigo background |
| Opportunities | `.drop-active-opp` | Amber dashed border + light yellow background |
| Execute | `.drop-active-execute` | Green dashed border + light green background |

### Drop Hint Strip

A hint strip appears inside the drop zone during hover:
```
↓ Drop here to apply to Jane Doe
```

### Toast Notifications

After every drop action, a toast notification appears in the bottom-right:

| Type | Color | Example |
|------|-------|---------|
| Success | Green | "✉ Email sent to Jane (jane@example.com)" |
| Warning | Yellow | "Step has no tags defined" |
| Error | Red | "Failed: Contact not found" |
| Info | Blue | "All update values are template variables" |

Toasts auto-dismiss after 3.5 seconds.

---

## Template Variable Handling

Some node configs contain template variables like `{{contact.email}}` or `{{contact.first_name}}`. These cannot be resolved in the drag-to-action context (there's no template engine running in the frontend).

The panels handle this by filtering out template values:

```javascript
const clean = Object.fromEntries(
  Object.entries(raw).filter(([, v]) =>
    typeof v !== 'string' || !v.includes('{{')
  )
);
```

If all values are template variables, the user gets an info toast:
> "All update values are template variables — cannot resolve here"

---

## Technical Details

- **MIME Type**: `application/quantixone-node` — custom type prevents interference with ReactFlow's internal drag system
- **Event Propagation**: `e.stopPropagation()` on `onDragStart` prevents ReactFlow from intercepting the drag
- **Card vs Panel drops**: Card-level drops use `e.stopPropagation()` to prevent bubbling to the panel-level handler
- **DragLeave Debouncing**: Uses `e.currentTarget.contains(e.relatedTarget)` to prevent false drag-leave events from child elements
