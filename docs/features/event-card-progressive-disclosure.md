# Event Card Progressive Disclosure

**Version:** 1.0
**Last Updated:** 2025-10-01
**Status:** ✅ Implemented

## Overview

Event cards implement a progressive disclosure pattern to improve scanability and reduce visual clutter in event lists. Cards show essential information by default and expand to reveal full details when selected.

## Design Goals

1. **Improve Scanability**: Show 2-3x more events in viewport by reducing card height
2. **Progressive Disclosure**: Essential info visible, details on demand
3. **Consistent Interaction**: Selection (from card OR map) reveals full details
4. **Visual Clarity**: Answer "what, when, and status" at a glance
5. **No Extra Clicks**: Selection already highlights the event, just expand the card too

## Card States

### Collapsed State (Default)

**Height:** ~90-100px (vs previous 200px)
**Visible Information:**
- Event type icon with severity color
- Event name (clickable to detail page)
- Start time
- Status badge (Iniciado/En curso/Finalizado)
- Status indicator dot with label
- Duration (calculated time span)
- Chevron icon (▼) indicating expandable state

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ [Icon] Event Name            Status ▼│  ← Icon, name, status badge, chevron
│        10:30 AM                      │  ← Start time
│                                      │
│ ● Status       ⏱ Duración: 1h 15min │  ← Status dot + Duration
└──────────────────────────────────────┘
```

### Expanded State (When Selected)

**Height:** ~200px
**Additional Information:**
- Full location timeline with start/end markers
- Start location address
- End location address
- End time
- Duration calculation
- Chevron icon (▲) indicating collapsible state

**Visual Structure:**
```
┌─────────────────────────────────────┐
│ [Icon] Event Name            Status ▲│  ← Same header with up chevron
│        10:30 AM                      │
│                                      │
│ ┌─ Inicio              10:30 AM     │  ← Start location timeline
│ │  Av. López Mateos Norte 543       │
│ │                                   │
│ └─ Fin                11:45 AM      │  ← End location timeline
│    Blvd. Puerta de Hierro 4965     │
│                                      │
│ ● Finalizado    ⏱ Duración: 1h 15min│  ← Footer with enhanced details
└──────────────────────────────────────┘
```

## Information Hierarchy

### Tier 1: Always Visible (Collapsed State)
Critical information for scanning and decision-making:

1. **Event Icon** - Visual severity indicator (color-coded)
2. **Event Name** - What happened (e.g., "Exceso de velocidad")
3. **Start Time** - When it happened (e.g., "10:30 AM")
4. **Status Badge** - Current state (Iniciado/En curso/Finalizado)
5. **Status Dot** - Visual indicator of resolution state
6. **Chevron** - Expandability affordance

### Tier 2: Visible on Selection (Expanded State)
Contextual details revealed when user shows interest:

1. **Location Timeline** - Start and end locations with visual connector
2. **Addresses** - Full street addresses for both locations
3. **End Time** - When the event concluded
4. **Duration** - Calculated time span (formatted as "1h 15min", "2d 3h", etc.)

## Interaction Patterns

### Triggering Expansion

**Method 1: Click Card (List)**
```
User clicks card → Card selects → Card expands → Map highlights both markers
```

**Method 2: Click Marker (Map)**
```
User clicks marker → Marker selects → Card expands → Card scrolls into view
```

**Method 3: Click Between Markers (Map)**
```
User clicks Inicio marker → Card already expanded
User clicks Fin marker (same event) → Card stays expanded
```

### Triggering Collapse

**Deselection:**
```
User clicks elsewhere → Card collapses → Map deselects markers
```

## Visual Indicators

### Chevron Icon

**Collapsed (▼):**
- Position: Top-right corner, next to status badge
- Color: `#6b7280` (gray-500)
- Size: 16x16px
- Rotation: 0deg

**Expanded (▲):**
- Position: Top-right corner, next to status badge
- Color: `#3b82f6` (blue-500, matches selection)
- Size: 16x16px
- Rotation: 180deg

### Status Indicator (Footer)

**Collapsed State:**
- Colored dot (12px diameter)
- Status label text
- Colors match event status:
  - Finalizado: `#ef4444` (red)
  - En curso: `#eab308` (yellow)
  - Iniciado: `#3b82f6` (blue)

**Expanded State:**
- Same dot + label
- Additional duration display with clock icon
- Right-aligned layout

## Animation & Transitions

### Card Height Transition
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

**Timing:**
- Expand: 300ms with ease-in-out
- Collapse: 300ms with ease-in-out

### Content Fade
Location timeline fades in/out when expanding/collapsing:
```css
opacity transition: 0.2s ease-in-out
```

### Chevron Rotation
```css
transform: rotate(180deg);
transition: transform 0.3s ease-in-out;
```

## Implementation Details

### Component: `EventCard.tsx`

**Props:**
```typescript
interface EventCardProps {
  event: EventWithLocation;
  isSelected: boolean;
  onClick: (eventId: string) => void;
  viewDate?: Dayjs;
  showLocationData?: boolean;
}
```

**Key Logic:**
- `isSelected` prop controls expanded/collapsed state
- No internal state needed (controlled component)
- Location timeline conditionally rendered based on `isSelected`
- Smooth height transition via CSS

### CSS Strategy

**Collapsed:**
```css
minHeight: 'auto'
padding: '16px'
```

**Expanded:**
```css
minHeight: '200px'
padding: '16px'
```

**Location Timeline:**
```css
maxHeight: isSelected ? '500px' : '0px'
opacity: isSelected ? 1 : 0
overflow: 'hidden'
```

## Benefits

### UX Improvements

1. **Reduced Cognitive Load**: Users see only essential information while scanning
2. **Faster Event Discovery**: 2-3x more events visible without scrolling
3. **Contextual Details**: Full information appears exactly when needed
4. **Clear Affordance**: Chevron signals expandability
5. **Consistent Behavior**: Selection works identically from list or map

### Performance

1. **No Additional Renders**: Expansion controlled by existing selection state
2. **CSS Transitions**: Hardware-accelerated animations
3. **Conditional Rendering**: Location timeline only rendered when visible

### Accessibility

1. **Visual Affordance**: Chevron icon indicates expandability
2. **Consistent Interaction**: Click anywhere on card to select/expand
3. **Clear State**: Visual changes (border, shadow, chevron) indicate selection
4. **Keyboard Navigation**: Works with existing keyboard selection patterns

## Edge Cases Handled

### Same Event, Multiple Markers
When clicking between Inicio/Fin markers of same event:
- Card remains expanded
- Only marker selection changes on map
- No jarring collapse/expand

### Auto-Scroll
When card expands:
- Existing auto-scroll logic centers the expanded card
- Full expanded height visible in viewport
- Smooth scroll animation (400ms)

### Rapid Selection Changes
When quickly selecting different events:
- Previous card collapses immediately
- New card expands immediately
- Transitions run concurrently for smooth UX

## Testing Scenarios

### Visual Testing
- [ ] Collapsed cards show only essential info
- [ ] Expanded cards show full location timeline
- [ ] Chevron rotates smoothly (▼ → ▲)
- [ ] Height transition is smooth (no jerking)
- [ ] Status colors match expected values

### Interaction Testing
- [ ] Click card → Selects and expands
- [ ] Click map marker → Expands corresponding card
- [ ] Click elsewhere → Collapses card
- [ ] Click between Inicio/Fin → Card stays expanded

### List Scanning
- [ ] Can see 2-3x more events in collapsed state
- [ ] Can quickly identify event type from icon
- [ ] Can quickly identify time from start time
- [ ] Can quickly identify status from badge

## Future Enhancements

### Potential Improvements
1. **Keyboard Shortcuts**: Space to expand/collapse selected card
2. **Expand All/Collapse All**: Bulk actions for power users
3. **Pinned Expansion**: Option to keep card expanded while selecting others
4. **Custom Collapsed Info**: User preference for what shows in collapsed state

### Not Planned
- Manual expand/collapse without selection (adds complexity)
- Hover-to-expand (conflicts with selection interaction)
- Different collapsed heights per severity (inconsistent UX)

## Related Documentation

- [Event Lifecycle Visualization](./event-lifecycle-visualization/IMPLEMENTATION_PLAN.md)
- [Event Component Refactor Plan](../EVENT_COMPONENT_REFACTOR_PLAN.md)

## Change Log

### Version 1.0 (2025-10-01)
- Initial implementation of progressive disclosure
- Collapsed state shows: icon, name, start time, status badge, status dot
- Expanded state shows: full location timeline, duration
- Chevron indicator for expand/collapse state
- Smooth CSS transitions (300ms)
- Controlled by existing `isSelected` prop
