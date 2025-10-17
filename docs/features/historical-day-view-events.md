# Historical Day View Events System

## Overview

The Historical Day View Events system provides a comprehensive interface for viewing, navigating, and analyzing vehicle events within a specific date context. This document describes the architecture, business logic, user interactions, and scalability considerations.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Event Types & States](#event-types--states)
3. [Time Calculation Logic](#time-calculation-logic)
4. [User Interactions](#user-interactions)
5. [Component Structure](#component-structure)
6. [Use Cases](#use-cases)
7. [Performance Considerations](#performance-considerations)
8. [Scalability Improvements](#scalability-improvements)

---

## Architecture

### Core Components

```
Historical Tab
└── DayView (when view=day)
    ├── Date Selector
    ├── Tab Navigation (Trayectos / Eventos del día / Registros)
    └── EventosTab (when dayTab=eventos)
        ├── EventListView (sidebar panel)
        │   ├── Severity Count Badges
        │   └── EventCard[] (scrollable list)
        └── UnifiedMapView (map panel)
            ├── Event Markers (start/end positions)
            └── Event Popup (detail dialog)
```

### Data Flow

```
1. User selects date → viewDate state updated
2. Events filtered by date range
3. Events rendered with context-aware time calculations
4. User interaction (click/keyboard) → selectedEventId updated
5. Map popup opens + card highlights + auto-scroll
```

---

## Event Types & States

### Event Severity

Events are categorized by severity level, each with distinct visual styling:

| Severity | Color | Use Case |
|----------|-------|----------|
| **Alta** | Red (#dc2626) | Critical issues requiring immediate attention (e.g., unauthorized access, emergency braking) |
| **Media** | Orange (#ea580c) | Important issues requiring attention (e.g., speeding, driver error) |
| **Baja** | Blue (#2563eb) | Minor issues or notifications (e.g., low battery, open door) |
| **Informativa** | Cyan (#0891b2) | Informational events (e.g., system updates, scheduled maintenance) |

### Operational Status

Events have an **operational status** independent of their timeline state:

| Status | Indicator | Meaning | Percentage Distribution |
|--------|-----------|---------|------------------------|
| **Abierto** | 🟢 Green dot | Event created but not yet addressed | 40% |
| **En progreso** | 🔵 Blue dot | Event being actively worked on | 30% |
| **Cerrado** | 🔴 Red dot | Event resolved and closed | 30% |

**Key Point**: Operational status determines time display behavior (see [Time Calculation Logic](#time-calculation-logic))

---

## Time Calculation Logic

### Critical Business Rule

**Events can NEVER show timestamps in the future relative to the view date.**

### For Open Events (Abierto / En progreso)

```typescript
// Start Time: Actual creation timestamp from event data
startTime = event.locationData.startLocation.timestamp

// End Time: Current real-world time (NOW)
endTime = dayjs()

// Elapsed Time: From creation to NOW
elapsedTime = dayjs().diff(startTime, 'minute')
```

**Example**:
- View Date: September 7, 2025 (looking at historical data)
- Event Created: September 6, 2025 at 4:00 PM (operational status: Abierto)
- Today: October 3, 2025
- Display:
  - "Abierto: 6/9/2025 04:00 pm"
  - "Transcurrido: 3sem 6d 11h" (≈27 days from Sept 6 to Oct 3)

### For Closed Events (Cerrado)

```typescript
// Start Time: Actual creation timestamp
startTime = event.locationData.startLocation.timestamp

// End Time: Actual closing timestamp
endTime = event.locationData.endLocation.timestamp

// Display both timestamps without modification
```

**Example**:
- "Abierto: 7/9/2025 06:20 am"
- "Cerrado: 7/9/2025 09:00 am"
- Duration: 2h 40min

### Time Unit Localization (Latin America)

| Unit | Spanish Abbreviation | Full Spanish |
|------|---------------------|--------------|
| Months | m | mes |
| Weeks | sem | semanas |
| Days | d | día |
| Hours | h | hora |
| Minutes | min | minutos |
| Seconds | s | segundos |

**Display Format**: Shows 2-3 most significant units for readability
- ✅ "3sem 4d 11h" (clean, readable)
- ❌ "634h 59min" (too granular)

---

## User Interactions

### 1. Event Selection

**Trigger Methods**:
- Click on event card in sidebar
- Click on map marker
- Keyboard navigation (↑/↓ arrow keys)

**Visual Feedback**:
- Card: Blue background (#f0f7ff) + blue border (#1867ff) + blue shadow
- Map: Marker popup opens with event details
- Auto-scroll: Card scrolls into view if off-screen

### 2. Keyboard Navigation

**Keys**: `Arrow Up` / `Arrow Down`

**Behavior**:
- Navigate through events in chronological order
- Auto-scroll to keep selected card visible
- Opens corresponding map marker popup
- Stops at list boundaries (no wrap-around)

**Usage**:
1. Click on event list panel to focus
2. Use ↑/↓ keys to navigate
3. Selected event highlights
4. Map popup updates automatically

**Performance**: Optimized for hundreds of events

### 3. Event Card Click

**Action**: Opens detailed event popup on map

**Popup Content**:
- Event ID (e.g., "EVT-04")
- Event name
- Severity badge
- Operational status (Iniciado/Abierto/En progreso/Cerrado)
- Timestamps (Abierto/Cerrado or Transcurrido)
- Assignee name
- Location (geofence or street address)

### 4. Map Marker Click

**Action**: Highlights corresponding card + opens popup

**Marker Types**:
- Start marker: Where event began
- End marker: Where event ended (if different location)

---

## Component Structure

### EventCard Component

**File**: `components/Events/EventCard.tsx`

**Props**:
```typescript
{
  event: EventWithLocation;
  isSelected: boolean;
  onClick: (eventId: string) => void;
  viewDate?: Dayjs;           // Context date for historical views
  showLocationData?: boolean;  // Show/hide location info
}
```

**Key Features**:
- Dual-layer border (outer selection + inner severity)
- Context-aware time formatting
- Deterministic random data (assignee, operational status)
- Hover effects (disabled when selected)

**Visual Design**:
```
┌─────────────────────────────────────────┐ ← Outer wrapper (selection border)
│ ┌─────────────────────────────────────┐ │
│ █ [Icon] EVT-04 Event Name  [Alta] 🟢 │ │ ← Left border (severity color)
│ │                                       │ │
│ │ ⏰ Abierto: 6/9/2025 04:00 pm        │ │
│ │ ⏱️ Transcurrido: 3sem 6d 11h         │ │
│ │ 👤 Carmen López                       │ │
│ │ 📍 CEDIS Norte                        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### EventListView Component

**File**: `components/Events/EventListView.tsx`

**Responsibilities**:
- Render scrollable list of EventCard components
- Handle keyboard navigation
- Auto-scroll to selected item
- Display severity count badges

**Performance Optimizations**:
- Ref-based item tracking (avoid re-renders)
- Memoized severity counts
- Smooth scroll behavior
- Event listener cleanup

### EventIcon Component

**File**: `components/Events/EventIcon.tsx`

**Variants**:
- `circled`: Round background (used in cards)
- `plain`: Icon only (used in other contexts)

**Sizes**: `small`, `medium`, `large`

---

## Use Cases

### UC1: Review Historical Events

**Actor**: Fleet Manager

**Scenario**: Manager wants to review all events from last week

**Steps**:
1. Navigate to Historial tab
2. Select vehicle
3. Choose date from last week
4. Click "Eventos del día" tab
5. Review event cards in sidebar
6. Click events to see map locations
7. Use keyboard arrows to navigate quickly

**Expected Result**: All events from selected date displayed with accurate historical timestamps

---

### UC2: Investigate Open Event

**Actor**: Operations Supervisor

**Scenario**: Supervisor needs to check status of ongoing event

**Steps**:
1. Open Historical view for today
2. See event marked "Abierto" or "En progreso"
3. View "Transcurrido" time showing elapsed duration from creation to NOW
4. Check assignee to see who's handling it
5. View location on map

**Expected Result**:
- Event shows "Abierto: [creation date/time]"
- "Transcurrido" shows time from creation to current moment
- Even if viewing historical date, elapsed time is from creation to NOW (not viewDate)

---

### UC3: Compare Event Patterns

**Actor**: Data Analyst

**Scenario**: Analyst wants to identify patterns in event types

**Steps**:
1. Navigate through multiple dates
2. Review severity count badges
3. Use keyboard navigation for fast scanning
4. Note frequency of Alta/Media events
5. Check common locations on map

**Expected Result**: Quick overview of event distribution and patterns

---

### UC4: Verify Event Resolution

**Actor**: Fleet Manager

**Scenario**: Manager wants to confirm event was properly closed

**Steps**:
1. Find event in historical view
2. Check operational status (should show 🔴 Cerrado)
3. Review "Abierto" and "Cerrado" timestamps
4. Verify duration makes sense
5. Check assignee who resolved it

**Expected Result**: Event shows clear timeline from opening to closure

---

## Performance Considerations

### Current Performance Characteristics

| Metric | Current State | Target |
|--------|--------------|---------|
| **Events per day** | 3-25 | 100-500 |
| **Render time** | <50ms | <100ms |
| **Scroll performance** | Smooth | Smooth |
| **Memory usage** | Low | Moderate |

### Bottlenecks (at scale)

1. **All events rendered at once** - DOM nodes grow linearly
2. **Scroll position calculations** - O(n) for each selection
3. **Re-renders on state change** - All cards re-render when selection changes
4. **Map marker rendering** - All markers rendered simultaneously

---

## Scalability Improvements

### 1. Virtual Scrolling

**Problem**: Rendering 500+ event cards causes DOM bloat

**Solution**: Implement windowing (only render visible items)

**Libraries**:
- `react-window` or `react-virtual`
- Renders only ~10-15 visible items
- Dynamically adds/removes items during scroll

**Expected Impact**:
- ✅ Constant DOM size regardless of event count
- ✅ 50-70% faster initial render
- ✅ Smooth scrolling with 1000+ events

**Implementation**:
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={events.length}
  itemSize={150}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <EventCard event={events[index]} ... />
    </div>
  )}
</FixedSizeList>
```

---

### 2. Data Pagination

**Problem**: Loading 500 events at once from API

**Solution**: Implement cursor-based pagination

**API Design**:
```typescript
GET /api/events?
  vehicleId=unidad-0
  &date=2025-09-07
  &cursor=event-50
  &limit=50
```

**Implementation**:
- Load first 50 events on mount
- Load next batch on scroll to bottom
- Cache loaded events in client state

**Expected Impact**:
- ✅ Faster initial page load
- ✅ Reduced API response size
- ✅ Lower memory footprint

---

### 3. Memoization & React.memo

**Problem**: Unnecessary re-renders when parent state changes

**Solution**: Wrap EventCard in React.memo with custom comparison

**Implementation**:
```typescript
const EventCard = React.memo(({ event, isSelected, ... }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Only re-render if event data or selection changed
  return prevProps.event.id === nextProps.event.id &&
         prevProps.isSelected === nextProps.isSelected;
});
```

**Expected Impact**:
- ✅ 40-60% fewer re-renders
- ✅ Smoother interactions

---

### 4. Web Workers for Data Processing

**Problem**: Heavy calculations (severity counts, filtering) block UI

**Solution**: Offload computation to Web Worker

**Use Cases**:
- Severity count aggregation
- Event filtering by criteria
- Time calculation for large datasets

**Implementation**:
```typescript
// worker.ts
self.onmessage = (e) => {
  const { events } = e.data;
  const counts = {
    Alta: events.filter(e => e.severidad === 'Alta').length,
    // ... other counts
  };
  self.postMessage(counts);
};
```

**Expected Impact**:
- ✅ Non-blocking UI updates
- ✅ Faster processing for 500+ events

---

### 5. IndexedDB Caching

**Problem**: Repeated API calls for same historical data

**Solution**: Cache events locally in IndexedDB

**Strategy**:
- Cache events by `vehicleId + date` key
- TTL: 24 hours for historical data
- Invalidate on manual refresh

**Expected Impact**:
- ✅ Instant load for cached dates
- ✅ Offline capability
- ✅ Reduced server load

---

### 6. Intersection Observer for Lazy Loading

**Problem**: Map markers all render at once

**Solution**: Lazy-load markers as they enter viewport

**Implementation**:
```typescript
useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Load marker data
      }
    });
  });

  eventMarkers.forEach(marker => observer.observe(marker));

  return () => observer.disconnect();
}, [eventMarkers]);
```

**Expected Impact**:
- ✅ Faster map initialization
- ✅ Lower memory usage

---

### 7. Server-Side Aggregation

**Problem**: Client-side severity counting on large datasets

**Solution**: Move aggregation to backend

**API Response**:
```json
{
  "events": [...],
  "summary": {
    "total": 347,
    "severityCounts": {
      "Alta": 45,
      "Media": 102,
      "Baja": 150,
      "Informativa": 50
    },
    "statusCounts": {
      "abierto": 120,
      "en_progreso": 87,
      "cerrado": 140
    }
  }
}
```

**Expected Impact**:
- ✅ Instant badge updates
- ✅ Reduced client-side computation

---

## Implementation Priority

### Phase 1: Critical (500 events)
1. ✅ Virtual Scrolling
2. ✅ React.memo optimization
3. ✅ Server-side aggregation

### Phase 2: Important (1000+ events)
4. Data Pagination
5. IndexedDB caching

### Phase 3: Advanced (5000+ events)
6. Web Workers
7. Intersection Observer for markers

---

## Testing Considerations

### Load Testing Scenarios

| Scenario | Event Count | Expected Behavior |
|----------|-------------|-------------------|
| Light Day | 10-50 | Instant rendering |
| Normal Day | 50-200 | <100ms render |
| Heavy Day | 200-500 | <200ms render (with virtual scroll) |
| Extreme Day | 500-1000 | <300ms render (with pagination) |

### Performance Metrics

```typescript
// Measure render time
console.time('EventListRender');
// ... render events
console.timeEnd('EventListRender');

// Measure scroll performance
const scrollFPS = new PerformanceObserver((list) => {
  console.log('Scroll FPS:', list.getEntries());
});
scrollFPS.observe({ entryTypes: ['measure'] });
```

---

## Conclusion

The Historical Day View Events system provides a robust interface for event management with strong time-based business logic. The current implementation handles 100-200 events efficiently. For larger scales (500+ events), implementing virtual scrolling and pagination will be critical for maintaining performance.

Key strengths:
- ✅ Clear separation of operational vs. timeline states
- ✅ Accurate time calculations respecting viewDate context
- ✅ Keyboard navigation for power users
- ✅ Auto-scroll and visual feedback

Recommended next steps:
1. Implement virtual scrolling (react-window)
2. Add server-side pagination
3. Optimize with React.memo
4. Monitor performance metrics in production

---

**Last Updated**: 2025-10-03
**Version**: 1.0
**Maintainer**: Development Team
