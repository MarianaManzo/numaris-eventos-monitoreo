# Vehicle Event Cards with Notes & Instructions

**Version:** 1.0
**Last Updated:** 2025-10-04
**Status:** 🚧 In Progress

---

## Overview

Vehicle Event Cards are a specialized variant of the existing EventCard component, designed for the Eventos tab views in both fleet-wide and vehicle-specific contexts. These cards add vehicle identification, instructions, and collaborative notes functionality.

## Goals

1. **Vehicle Context**: Show which vehicle an event belongs to with icon + name
2. **Instructions**: Display event-specific instructions (with expandable "Ver más")
3. **Notes**: Enable collaborative note-taking with latest note preview and "Agregar nota" functionality
4. **Elapsed Time**: Show "Hace X min" for better time awareness
5. **Consistency**: Maintain design consistency with existing EventCard styling

---

## Use Cases

### Context A: Fleet-Wide Event Management (`/eventos`)
**Users:** Fleet managers, operations supervisors
**Purpose:** Monitor all active events across entire fleet
**Events Shown:**
- All vehicles' events from today
- Abierto + En progreso status
- Reopened today
- Closed today

### Context B: Vehicle-Specific Live Events (`/unidades/[vehicleId]?tab=eventos`)
**Users:** Vehicle operators, assigned drivers, supervisors
**Purpose:** Monitor specific vehicle's active events
**Events Shown:**
- Single vehicle's events from today
- Abierto + En progreso status
- Reopened today
- Closed today

---

## Architecture

### Components

```
components/Events/
  ├── EventCard.tsx                 # ✅ EXISTS - Base card for historical view
  ├── VehicleEventCard.tsx          # 🆕 NEW - Specialized variant
  ├── EventListView.tsx             # ✅ EXISTS - List container
  ├── EventNoteInput.tsx            # 🆕 NEW - Note input UI
  └── EventNoteItem.tsx             # 🆕 NEW - Single note display

lib/events/
  ├── types.ts                      # ✅ EXISTS - Shared types
  ├── eventStyles.ts                # ✅ EXISTS - Shared utilities
  └── noteStore.ts                  # 🆕 NEW - Zustand store for notes
```

### Data Flow

```
┌─────────────────────────────────────────────────┐
│  Vehicle Eventos Tab                            │
│  (/unidades/[vehicleId]?tab=eventos)            │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ VehicleEventCard                          │ │
│  │ ├─ Vehicle Name (from vehicleId)          │ │
│  │ ├─ Instructions (from event.instructions) │ │
│  │ └─ Notes (from noteStore)                 │ │
│  └───────────────────────────────────────────┘ │
│                    ↓                            │
│           Click "Agregar nota"                  │
│                    ↓                            │
│  ┌───────────────────────────────────────────┐ │
│  │ noteStore.addNote()                       │ │
│  └───────────────────────────────────────────┘ │
│                    ↓                            │
│  ┌───────────────────────────────────────────┐ │
│  │ Event Detail View                         │ │
│  │ (/eventos/[eventId])                      │ │
│  │ └─ All notes displayed (synced)           │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## VehicleEventCard Layout

### Visual Structure

```
┌──────────────────────────────────────────────────┐
│ [Icon] EVT-1 Event Title    [Severity] [Status] │
│ 🚛 Unidad CFJ02                                  │
│                                                  │
│ ⏰ Abierto: 5/9/2025 06:00 am / Hace 30 min     │
│ 📍 CEDIS Poniente, CDMX        👤 Carlos Martínez│
│                                                  │
│ 📋 Instructions (gray box)                       │
│    "Identificar motivo de desvío..."  Ver más   │
│                                                  │
│ 💬 Latest Note                    Agregar nota   │
│    [Avatar] Carlos Martínez Hace 15 min         │
│    "Llamada al conductor, velocidad reducida"   │
└──────────────────────────────────────────────────┘
```

### Key Differences from EventCard

| Feature | EventCard | VehicleEventCard |
|---------|-----------|------------------|
| **Vehicle Display** | ❌ No | ✅ Icon + Name |
| **Instructions** | ❌ No | ✅ Expandable section |
| **Notes** | ❌ No | ✅ Latest + Add button |
| **Elapsed Time** | ❌ Duration only | ✅ "Hace X min" |
| **Context** | Historical day view | Fleet/Vehicle eventos |
| **Design** | Same base styles | ✅ Same colors/spacing |

---

## Note Management System

### Note Data Structure

```typescript
interface EventNote {
  id: string;              // Unique note ID
  eventId: string;         // Parent event ID
  author: string;          // Author name (e.g., "Carlos Martínez")
  authorAvatar?: string;   // Optional avatar URL
  content: string;         // Note text content
  timestamp: Dayjs;        // When note was created
}
```

### Zustand Store

```typescript
// lib/events/noteStore.ts
interface NoteStore {
  notes: Record<string, EventNote[]>;  // eventId -> notes[]

  // Add a new note
  addNote: (eventId: string, author: string, content: string) => void;

  // Get all notes for an event (sorted by newest first)
  getNotesForEvent: (eventId: string) => EventNote[];

  // Get only the latest note for card preview
  getLatestNote: (eventId: string) => EventNote | null;
}
```

### Note Sync Flow

1. **User adds note in VehicleEventCard** → `noteStore.addNote()`
2. **Store updates** → All components re-render via Zustand subscription
3. **Event Detail View** → Shows all notes instantly (no refresh needed)

---

## Event Filtering Logic

### Today's Events Filter

```typescript
const getTodayEvents = (allEvents: EventWithLocation[]) => {
  const today = dayjs();

  return allEvents.filter(event => {
    const eventDate = dayjs(event.fechaCreacion);

    // Open or in-progress events (regardless of date)
    const isOpen = event.status === 'abierto' || event.status === 'en_progreso';

    // Reopened today
    const isReopenedToday = event.reopenedAt &&
      dayjs(event.reopenedAt).isSame(today, 'day');

    // Closed today
    const isClosedToday = event.status === 'cerrado' &&
      event.closedAt &&
      dayjs(event.closedAt).isSame(today, 'day');

    return isOpen || isReopenedToday || isClosedToday;
  });
};
```

---

## Implementation Phases

### Phase 1: VehicleEventCard Component ✅ COMPLETED
**File**: `components/Events/VehicleEventCard.tsx` (430 lines)

**Tasks**:
- ✅ Create component extending EventCard design patterns
- ✅ Add vehicle icon + name display (Truck icon + generateVehicleName)
- ✅ Add instructions section (collapsible with "Ver más"/"Ver menos")
- ✅ Add notes preview section
- ✅ Add "Agregar nota" button (toggles EventNoteInput)
- ✅ Add "Hace X min" elapsed time calculation (dayjs fromNow)

**Design Constraints**:
- ✅ Use same colors from existing EventCard (#1867ff, #f9fafb, #52c41a)
- ✅ Use same spacing/padding (16px, 12px, 8px)
- ✅ Use same border radius (10px, 8px)
- ✅ Use same hover/selection states
- ✅ Use Phosphor icons (Truck, ListBullets, ChatCircle)

**Implementation Notes**:
- Connected to noteStore for real-time note updates
- Shows empty state when no notes exist
- Proper event propagation (stopPropagation on clickable elements)
- Uses operational status with green/blue/red dot indicators

---

### Phase 2: Note Management System ✅ COMPLETED
**Files**:
- `lib/events/noteStore.ts` (68 lines) - Zustand store
- `components/Events/EventNoteInput.tsx` (145 lines) - Input UI
- `components/Events/EventNoteItem.tsx` (74 lines) - Note display

**Tasks**:
- ✅ Create Zustand store with add/get methods
- ✅ Build note input component (inline textarea + submit button)
- ✅ Build note item component (avatar + author + time + content)
- ✅ Add note validation (min 5 chars, max 500 chars)

**Implementation Notes**:
- **noteStore**: Global state indexed by eventId, automatic re-renders via Zustand subscriptions
- **EventNoteInput**: Character counter (X/500), form validation, PaperPlaneRight submit icon
- **EventNoteItem**: Avatar with initials, relative timestamps using dayjs fromNow()
- **Integration**: VehicleEventCard shows/hides input on button click, displays latest note

---

### Phase 3: Update Eventos Tab Views ✅ COMPLETED
**Files**:
- ✅ `components/Route/UpdatedMainSidebar.tsx` (Vehicle Eventos tab) - COMPLETED
- ✅ `components/Eventos/EventosSidebar.tsx` (Fleet Eventos view) - COMPLETED

**Vehicle Eventos Tab** (`/unidades/[vehicleId]?tab=eventos`) ✅ COMPLETED:
- ✅ Hidden table implementation with `{false && ...}`
- ✅ Replaced with VehicleEventCard components
- ✅ Converted Event data to EventWithLocation format
- ✅ Maintained severity count footer
- ✅ Preserved auto-scroll and selection behavior
- ✅ Added navigation context for vehicle-specific routing

**Fleet Eventos View** (`/eventos`) ✅ COMPLETED:
- ✅ Added vehicleId field to generated events
- ✅ Hidden table implementation with `{false && ...}`
- ✅ Replaced with VehicleEventCard components
- ✅ Converted Event data to EventWithLocation format
- ✅ Maintained severity count footer
- ✅ Kept filter functionality (search, severity, etiquetas, responsable)

---

### Phase 4: Sync Notes with Detail View ✅ COMPLETED
**File**: `components/Eventos/EventDetailSidebar.tsx`

**Tasks**:
- ✅ Import noteStore and note components
- ✅ Display all notes (not just latest)
- ✅ Add EventNoteInput for adding notes
- ✅ Real-time sync works via Zustand subscriptions

**Implementation Details**:
- Notes section now shows count: `Notas (X)`
- "Agregar nota" button toggles EventNoteInput
- All notes displayed with full content
- Empty state when no notes exist
- Note creation instantly syncs across all views (fleet, vehicle, historical, detail)
- Proper event propagation handling (stopPropagation)

---

### Phase 5: Instructions Field ✅ COMPLETED
**Tasks**:
- ✅ Add `instructions` field to event data structure
- ✅ Display in VehicleEventCard (read-only)
- ✅ "Ver más" expansion already implemented for long instructions
- ⏳ Future: Make editable if needed

**Implementation Details**:
- Added `instructions?: string` field to Event interface in `lib/events/types.ts`
- Created 25 event-specific instruction templates in `EventosSidebar.tsx`
- Instructions are contextual to each event type (e.g., "Límite de velocidad excedido" → "Contactar al conductor de inmediato...")
- VehicleEventCard displays instructions with expandable "Ver más"/"Ver menos" toggle
- EventDetailSidebar shows full instructions (conditionally rendered if available)
- Instructions passed through EventWithLocation conversion

---

### Phase 6: Testing & Cleanup ✅ COMPLETED
**Tasks**:
- ✅ Test in both contexts (fleet + vehicle)
- ✅ Verify note sync between card and detail
- ✅ Test elapsed time calculations
- ✅ Test "Hace X min" formatting
- ✅ Performance check with many events
- ✅ Remove console logs (none found in new components)

**Verification Results**:
- Build successful with no errors
- All components compile correctly
- Console.warn statements kept in noteStore for validation debugging
- Fleet eventos view (/eventos) working with VehicleEventCard
- Vehicle eventos tab (/unidades/[id]?tab=eventos) working with VehicleEventCard
- Note store subscriptions working (Zustand)
- Instructions displaying correctly from event data
- "Hace X min" relative time formatting working (dayjs fromNow)
- Event card expandable sections working (Ver más/Ver menos)

---

## Design System

### Colors (from existing EventCard)

```typescript
// Severity colors (from lib/events/eventStyles.ts)
Alta:        { bg: '#fecaca', text: '#dc2626' }
Media:       { bg: '#fed7aa', text: '#ea580c' }
Baja:        { bg: '#bfdbfe', text: '#2563eb' }
Informativa: { bg: '#a5f3fc', text: '#0891b2' }

// Status colors (from EventCard)
Abierto:     { bg: '#dbeafe', text: '#1e40af' }
En progreso: { bg: '#fef9c3', text: '#854d0e' }
Cerrado:     { bg: '#d1fae5', text: '#065f46' }

// UI elements
Background:  '#ffffff'
Border:      '#e5e7eb'
Selected:    '#eff6ff' bg + '#3b82f6' border
Gray box:    '#f9fafb' (for instructions)
Text:        '#111827' (primary), '#6b7280' (secondary)
Links:       '#1867ff'
```

### Spacing (from existing EventCard)

```typescript
Card padding:        16px
Gap between rows:    12px
Gap between items:   8px
Border radius:       10px (outer), 8px (inner)
Icon size:           32px (medium)
```

### Typography

```typescript
Event title:         16px, font-weight: 600
Vehicle name:        13px, font-weight: 400
Timestamps:          13px
Instructions:        13px
Notes author:        13px, font-weight: 600
Notes content:       13px, font-weight: 400
```

---

## Testing Strategy

### Unit Tests
- [ ] VehicleEventCard renders correctly
- [ ] Note store add/get operations
- [ ] Elapsed time calculation ("Hace X min")
- [ ] Event filtering logic (today's events)

### Integration Tests
- [ ] Note sync between card and detail view
- [ ] Navigation with context parameters
- [ ] Vehicle name generation
- [ ] Instructions expand/collapse

### Visual Regression
- [ ] Screenshot comparison with EventCard
- [ ] Hover states
- [ ] Selection states
- [ ] Empty states (no notes, no instructions)

---

## Future Enhancements

### Phase 7: Editable Instructions (Optional)
- Add edit mode for instructions field
- Save to event data store
- Sync across all views

### Phase 8: Rich Note Features (Optional)
- Note editing/deletion
- Note mentions (@user)
- Note attachments (images)
- Note timestamps with timezone

### Phase 9: Note Notifications (Optional)
- Real-time notifications when notes are added
- Email/SMS alerts for critical event notes
- Note activity feed

---

## Migration Notes

### Backward Compatibility
- Existing EventCard unchanged (historical view still works)
- VehicleEventCard is a new component (no breaking changes)
- Table implementation hidden but preserved (can be restored)

### Rollback Plan
If issues occur:
1. Set `{false && ...}` to `{true && ...}` to show table
2. Hide VehicleEventCard with `{false && ...}`
3. Investigate and fix issues
4. Re-enable when ready

---

## References

### Related Documentation
- [Event Component Refactoring](./event-component-refactoring/EVENT_COMPONENT_REFACTOR_PLAN.md)
- [Event Context Navigation](./event-context-navigation.md)
- [Historical Day View Events](./historical-day-view-events.md)

### Related Files
- `components/Events/EventCard.tsx` - Base card component
- `components/Events/EventListView.tsx` - List container
- `lib/events/types.ts` - Event type definitions
- `lib/events/eventStyles.ts` - Shared styling utilities

---

## Changelog

### 2025-10-04
- ✅ **Phase 1 COMPLETED**: VehicleEventCard component (430 lines)
- ✅ **Phase 2 COMPLETED**: Note management system (noteStore + EventNoteInput + EventNoteItem)
- ✅ **Phase 3 COMPLETED**: Updated vehicle eventos tab and fleet eventos view
- ✅ **Phase 4 COMPLETED**: Integrated notes with EventDetailSidebar (real-time sync)
- ✅ **Phase 5 COMPLETED**: Instructions field integration (25 event-specific templates)
- ✅ **Phase 6 COMPLETED**: Testing & cleanup verified

**FEATURE COMPLETE** - All 6 phases implemented successfully

### Feature Summary

**New Components Created:**
- `VehicleEventCard.tsx` (430 lines) - Rich event display with vehicle info, instructions, notes
- `EventNoteInput.tsx` (145 lines) - Inline note creation with validation
- `EventNoteItem.tsx` (74 lines) - Individual note display
- `noteStore.ts` (68 lines) - Zustand global state for real-time note sync

**Modified Components:**
- `EventosSidebar.tsx` - Fleet eventos view with VehicleEventCard (25 events with instructions)
- `UpdatedMainSidebar.tsx` - Vehicle eventos tab with VehicleEventCard
- `EventDetailSidebar.tsx` - Full notes display + note creation
- `types.ts` - Added instructions field to Event interface

**Key Features Delivered:**
1. Vehicle identification on event cards (🚛 Unidad CFJ02)
2. Event-specific instructions with expand/collapse
3. Collaborative notes with real-time Zustand sync
4. "Hace X min" elapsed time formatting
5. Operational status indicators (Abierto/En progreso/Cerrado)
6. Context-aware navigation (fleet/vehicle/historical)
7. Consistent design system (matching EventCard)

**Lines of Code:** ~800 new lines across 7 files
