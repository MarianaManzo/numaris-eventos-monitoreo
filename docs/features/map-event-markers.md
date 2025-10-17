# Map Event Markers - Teardrop Pin Design

## Overview
Custom map markers for eventos that use a distinctive teardrop/pin shape with dynamic styling based on event severity and operational status.

## Visual Design

### Marker States

#### 1. **Default State (Unselected)**
- **Shape**: Teardrop pin (circular top with pointed bottom)
- **Styling**:
  - Light background color matching severity
  - Dark icon color for contrast
  - White border with subtle shadow
  - Icon centered in circular top portion
- **Purpose**: Clear visibility while maintaining map readability

#### 2. **Selected State - Inicio**
- **Shape**: Teardrop pin with "Inicio" pill badge
- **Styling**:
  - Solid severity color background
  - White icon and text
  - Pill badge attached below pin point
  - Enhanced shadow for elevation
- **Purpose**: Indicates event start location/time

#### 3. **Selected State - Fin**
- **Shape**: Teardrop pin with "Fin" pill badge
- **Styling**:
  - Same as Inicio but with "Fin" label
  - Solid severity color background
  - White icon and text
- **Purpose**: Indicates event end location/time (for closed events)

## Color System

### Severity Color Mapping

| Severity | Light Background | Dark Icon/Text | Usage |
|----------|-----------------|----------------|-------|
| Alta | `#fecaca` | `#dc2626` | High priority events |
| Media | `#fed7aa` | `#ea580c` | Medium priority events |
| Baja | `#bfdbfe` | `#2563eb` | Low priority events |
| Informativa | `#a5f3fc` | `#0891b2` | Informational events |

### State Color Inversion

**Unselected (Default):**
```typescript
background: severity.bg    // Light (#fecaca, #fed7aa, etc.)
iconColor: severity.text   // Dark (#dc2626, #ea580c, etc.)
border: 'white'
```

**Selected (Inicio/Fin):**
```typescript
background: severity.text  // Solid dark (#dc2626, #ea580c, etc.)
iconColor: '#ffffff'       // White
textColor: '#ffffff'       // White
border: severity.text      // Match background
```

## Technical Implementation

### Component Structure

```
EventMarker (components/Map/EventMarker.tsx)
├── Leaflet DivIcon
│   ├── Teardrop SVG/CSS Shape
│   │   ├── Circular Top (icon container)
│   │   └── Pointed Bottom (pin tail)
│   └── Status Pill Badge (conditional)
│       ├── "Inicio" or "Fin" label
│       └── Solid color styling
└── Event Handlers
    └── Click → onSelect(eventId)
```

### Size Specifications

```typescript
const MARKER_SIZE = {
  default: 40,      // Base width/height of teardrop top circle
  selected: 48,     // Slightly larger when selected
  iconSize: 20,     // Icon within marker
  pillHeight: 24,   // Inicio/Fin pill height
  pillPadding: 12,  // Horizontal padding in pill
};

const TEARDROP_RATIO = 1.5; // height = width * 1.5
```

### Icon System

Icons are sourced from **Phosphor Icons** library:
- **Alta**: Warning triangle (filled)
- **Media**: Info circle (filled)
- **Baja**: Monitor/screen icon
- **Informativa**: Warning triangle (outline)

All icons defined in `lib/events/eventStyles.ts` via `getEventIconPath()`

## Operational Status Logic

### Status Determination

Events can display three operational statuses:

1. **Abierto** (Open)
   - Events that are currently active
   - Shows "Inicio" pill when selected
   - Light marker when unselected

2. **En progreso** (In Progress)
   - Events being actively worked on
   - Shows "Inicio" pill when selected
   - Light marker when unselected

3. **Cerrado** (Closed)
   - Completed/resolved events
   - Shows "Fin" pill when selected
   - May display dual markers (Inicio + Fin) for timeline view

### Dual Marker Support

For **closed events** with location data:
- Two separate markers rendered: `Inicio` + `Fin`
- Each marker can be selected independently
- Both use same teardrop shape
- Connected visually through map fitBounds behavior

## User Interactions

### Hover Effects
- Scale transform: `1.0` → `1.15`
- Enhanced shadow on hover
- Smooth transition (0.2s ease)

### Click Behavior
- Triggers `onSelect(eventId)` callback
- Updates map state to center/zoom on marker
- Shows pill badge if not already visible
- Can trigger event detail sidebar

### Selection Persistence
- Selected state maintained via `isSelected` prop
- Can be controlled by parent component
- Supports deselection via `onDeselect()` callback

## Integration Points

### Used In:
1. **EventosMapView** - Main eventos tab map
2. **DayView EventosTab** - Historical day view with dual markers
3. **UnifiedMapView** - Unified map system for all route/event views

### Props Interface:
```typescript
interface EventMarkerProps {
  position: LatLngExpression;
  eventId: string;
  severidad: EventSeverity;
  isSelected: boolean;
  forceStatus?: 'Iniciado' | 'Finalizado' | 'En curso';
  useOperationalStatus?: boolean;
  onSelect: (id: string) => void;
  // ... additional props
}
```

## Design Rationale

### Why Teardrop Shape?
1. **Familiar Pattern**: Users recognize pins as location markers
2. **Directional Clarity**: Point indicates exact map location
3. **Visual Hierarchy**: Larger top circle emphasizes icon/severity
4. **Differentiation**: Distinct from route stop markers (circles)

### Why Color Inversion on Selection?
1. **Visual Pop**: Solid colors stand out on busy maps
2. **Clear State**: Obvious difference between selected/unselected
3. **Accessibility**: High contrast (white on solid color)
4. **Consistency**: Matches pill badge design language

## Accessibility Considerations

- **Color is not the only indicator**: Pill text provides context
- **High contrast ratios**: All color combinations pass WCAG AA
- **Hover affordance**: Scale effect indicates interactivity
- **Click targets**: Minimum 32px for touch devices

## Performance Notes

- Markers use `useMemo` to prevent unnecessary re-renders
- DivIcon approach allows dynamic HTML/CSS without canvas overhead
- Icons are SVG paths (inline) - no image loading required
- Transition animations use GPU-accelerated transforms

## Future Enhancements

- [ ] Animated pulse for high-priority events
- [ ] Clustering for dense event areas
- [ ] Custom icons per event type (not just severity)
- [ ] Line connector between Inicio/Fin markers
- [ ] Marker labels (event name) on zoom levels > 15

---

**Last Updated**: January 2025
**Component**: `components/Map/EventMarker.tsx`
**Related Files**: `lib/events/eventStyles.ts`, `components/Map/UnifiedMapView.tsx`
