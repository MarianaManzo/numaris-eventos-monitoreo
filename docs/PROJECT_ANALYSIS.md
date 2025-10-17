# Unidades Tracking System - Comprehensive Project Analysis

> **Analysis Date**: January 2025
> **Project Version**: 1.1.0
> **Focus**: Features, UX/Navigation Patterns, DRY Opportunities, Improvement Recommendations

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Scope & Jobs to Be Done](#project-scope--jobs-to-be-done)
3. [Features Implemented](#features-implemented)
4. [Technical Implementation Analysis](#technical-implementation-analysis)
5. [UX & Navigation Pattern Analysis](#ux--navigation-pattern-analysis)
6. [DRY Violations & Code Duplication](#dry-violations--code-duplication)
7. [If Starting Over: Ideal Architecture](#if-starting-over-ideal-architecture)
8. [Improvement Opportunities](#improvement-opportunities)
9. [Recommended Refactoring Patterns](#recommended-refactoring-patterns)
10. [Action Plan & Prioritization](#action-plan--prioritization)

---

## Executive Summary

### What This Project Is

**Unidades Tracking** is a **real-time fleet management and vehicle monitoring system** built with Next.js 15, React 19, TypeScript, Ant Design, and Leaflet. It provides comprehensive tracking, event management, and route analysis capabilities for vehicle fleets.

### Key Statistics

| Metric | Count | Notes |
|--------|-------|-------|
| **Total Components** | 43+ | Includes UI, domain, and feature components |
| **Map Components** | 27 | Significant duplication opportunity |
| **App Routes** | 5 | Home, Eventos, Unidades, Unidades/[id], Test |
| **Zustand Stores** | 3 | routeStore, unidadesStore, mapStore |
| **Type Definitions** | Scattered | Needs centralization |
| **Code Duplication** | ~40% | Primarily in View components and Map logic |

### Critical Findings

#### ✅ **Strengths**
1. **Modern Tech Stack**: Leverages cutting-edge React 19 and Next.js 15
2. **Type Safety**: TypeScript throughout with strict typing
3. **State Management**: Clean Zustand implementation with persistence
4. **Dynamic Imports**: Proper SSR handling for Leaflet maps
5. **Responsive Design**: Well-thought-out layouts and transitions

#### ⚠️ **Critical Issues**
1. **Massive Code Duplication**: 3 nearly identical View components (UnidadesView, EventosView, MainView)
2. **No Separation of Concerns**: Data generation mixed with presentation
3. **Inconsistent Navigation**: Multiple patterns causing cognitive load
4. **Map Component Explosion**: 27 map components with overlapping responsibilities
5. **Missing Abstraction Layers**: No generic UI components for reuse

---

## Project Scope & Jobs to Be Done

### Primary User Jobs

#### 1. **Fleet Monitoring** (Continuous)
**Job**: "I need to know where all my vehicles are right now and their status"

**Enables**:
- Real-time vehicle location tracking
- Status monitoring (Activo, Inactivo, En Ruta, Detenido)
- Telemetry data (speed, battery, signal, odometer)
- Quick filtering and searching across fleet

**Current Implementation**: ✅ Delivered via `/unidades` page

---

#### 2. **Event Management** (Reactive)
**Job**: "When something critical happens, I need to be alerted and respond quickly"

**Enables**:
- Real-time event notifications
- Severity-based prioritization (Alta, Media, Baja, Informativa)
- Geographic visualization of events
- Filtering by severity, date, vehicle, responsible person

**Current Implementation**: ✅ Delivered via `/eventos` page

---

#### 3. **Historical Route Analysis** (Investigative)
**Job**: "I need to understand where a vehicle went on a specific day and identify stops"

**Enables**:
- Day-by-day route visualization
- Stop vs. travel segment identification
- Duration and distance calculations
- Month calendar view for route overview

**Current Implementation**: ✅ Delivered via `/` home page and `/unidades/[id]` detail

---

#### 4. **Vehicle Deep Dive** (Investigative)
**Job**: "I need complete information about a specific vehicle across all dimensions"

**Enables**:
- Telemática: Real-time positioning and telemetry
- Unidad: Vehicle specifications and metadata
- Eventos: Vehicle-specific event history
- Historial: 30-day route history

**Current Implementation**: ✅ Delivered via `/unidades/[id]` with tabbed interface

---

### Scope Boundaries

#### In Scope
- ✅ Real-time monitoring
- ✅ Historical route playback
- ✅ Event tracking and visualization
- ✅ Multi-vehicle comparison
- ✅ Geographic visualization
- ✅ Filtering and search

#### Out of Scope (Currently)
- ❌ Live alerts/notifications (push)
- ❌ Report generation/export
- ❌ Route optimization
- ❌ Predictive analytics
- ❌ User management/permissions
- ❌ Backend API integration (using mock data)
- ❌ Mobile app

---

## Features Implemented

### Feature Matrix

| Feature | Module | Status | Implementation Quality |
|---------|--------|--------|------------------------|
| **Vehicle List** | Unidades | ✅ Complete | Good - Resizable, filterable |
| **Vehicle Map** | Unidades | ✅ Complete | Good - Custom markers, popups |
| **Vehicle Detail** | Unidades | ✅ Complete | Excellent - Tabbed interface |
| **Event List** | Eventos | ✅ Complete | Good - Severity filtering |
| **Event Map** | Eventos | ✅ Complete | Good - Dual marker support |
| **Route Calendar** | Routes | ✅ Complete | Good - Month view |
| **Route Visualization** | Routes | ✅ Complete | Excellent - Segments, stops |
| **Day Route Analysis** | Routes | ✅ Complete | Good - Detailed segments |
| **Telemetry Dashboard** | Vehicle Detail | ✅ Complete | Good - Real-time data |
| **Sidebar Resizing** | All | ✅ Complete | Good - localStorage persist |
| **Column Resizing** | Unidades, Eventos | ✅ Complete | Good |
| **Skeleton Loading** | All | ✅ Complete | Excellent - Smooth transitions |
| **Collapsible Menu** | Layout | ✅ Complete | Good - Icon/text modes |

### Feature Deep Dive

#### 1. Vehicle List (Unidades Module)

**Location**: `components/Unidades/UnidadesSidebar.tsx`

**Capabilities**:
- ✅ Mock data generation (15 vehicles)
- ✅ Search by vehicle name
- ✅ Filter by estado, etiqueta, responsable
- ✅ Sort by multiple criteria
- ✅ Resizable columns
- ✅ Row selection → Map highlighting
- ✅ Estado-based color coding

**Data Structure**:
```typescript
interface Unidad {
  id: string;              // "unidad-1"
  nombre: string;          // "Unidad ABC01"
  estado: 'Activo' | 'Inactivo' | 'En ruta' | 'Detenido';
  position: [lat, lng];
  etiqueta?: string;       // Optional category
  responsable?: string;    // Optional assigned person
}
```

**UX Flow**:
1. User lands on `/unidades`
2. Sees list of vehicles + map
3. Can filter/search to narrow down
4. Clicks row → Map centers on vehicle, opens popup
5. Clicks vehicle name → Navigates to `/unidades/[id]` detail page

---

#### 2. Event Management (Eventos Module)

**Location**: `components/Eventos/EventosSidebar.tsx`

**Capabilities**:
- ✅ Mock data generation (25 events with 20+ types)
- ✅ Severity-based filtering (Alta, Media, Baja, Informativa)
- ✅ Date range picker
- ✅ Event type variety (speed limits, panic button, battery disconnect, etc.)
- ✅ Geographic spread across Guadalajara
- ✅ Integration with vehicle markers (can show both)

**Event Types Implemented**:
```typescript
const eventTemplates = [
  { evento: 'Límite de velocidad excedido', severidad: 'Alta' },
  { evento: 'Botón de pánico activado', severidad: 'Alta' },
  { evento: 'Parada abrupta detectada', severidad: 'Media' },
  { evento: 'Desconexión de batería', severidad: 'Alta' },
  { evento: 'Frenazo de emergencia', severidad: 'Alta' },
  { evento: 'Entrada a zona restringida', severidad: 'Media' },
  { evento: 'Ralentí prolongado', severidad: 'Baja' },
  { evento: 'Exceso de ralentí detectado', severidad: 'Media' },
  { evento: 'Geovalla entrada', severidad: 'Informativa' },
  { evento: 'Geovalla salida', severidad: 'Informativa' },
  // ... 15+ more types
];
```

**Severity Styling**:
```typescript
const severityColors = {
  'Alta': { bg: '#fff2f0', border: '#ff4d4f', text: '#ff4d4f' },
  'Media': { bg: '#fff7e6', border: '#fa8c16', text: '#fa8c16' },
  'Baja': { bg: '#e6f7ff', border: '#1890ff', text: '#1890ff' },
  'Informativa': { bg: '#e6fffb', border: '#13c2c2', text: '#13c2c2' }
};
```

**UX Flow**:
1. User lands on `/eventos`
2. Sees event list + map with event markers
3. Can filter by severity, date range
4. Clicks event row → Map centers, opens event popup
5. Can toggle vehicle markers on/off (shows vehicles + events on same map)
6. Click event link → Navigate with `?eventId=` parameter

**Critical Feature**: **Dual Marker Support**
Events can show both the event marker AND the vehicle marker for closed events, providing context about where the vehicle currently is vs where the event occurred.

---

#### 3. Route Visualization & Analysis

**Location**: Home (`/`) and Vehicle Detail (`/unidades/[id]`)

**Components Involved**:
- `MainView.tsx`: Container for route view
- `UpdatedMainSidebar.tsx`: 4-tab sidebar (Telemática, Unidad, Eventos, Historial)
- `MainMapView.tsx`: Map with polylines and segments
- `DayView.tsx` + `DaySidebar.tsx`: Day route detailed analysis

**Route Data Structure**:
```typescript
interface RouteData {
  id: string;
  name: string;
  distance: string;
  color: string;
  coordinates: LatLngExpression[];
  markers?: MarkerData[];  // Stop points
  visible: boolean;
}

interface RouteSegment {
  id: number;
  name: string;
  coordinates: LatLngExpression[];
  duration: string;
  timeRange: string;
  location?: string;
  distance: string;
  type: 'stop' | 'travel';
}
```

**Route Visualization Capabilities**:
- ✅ Polyline routes with directional arrows
- ✅ Stop markers (red circles)
- ✅ Travel segments (blue lines)
- ✅ Color-coded by route
- ✅ Hover to highlight segments
- ✅ Click to zoom into segment
- ✅ Auto-fit bounds for visible routes
- ✅ Multiple route overlay

**Calendar View** (`UpdatedMainSidebar.tsx` - Historial tab):
- ✅ 30-day calendar grid
- ✅ Color-coded days with routes
- ✅ Distance display per day
- ✅ Click day → Open day view
- ✅ Route visibility toggles
- ✅ Focus mode (view single route)

**Day View Analysis**:
- ✅ Chronological segment list
- ✅ Stop vs. travel identification
- ✅ Duration for each segment
- ✅ Distance for travel segments
- ✅ Location names
- ✅ Click segment → Map zooms to segment
- ✅ Visual timeline

**UX Flow - Historical Analysis**:
1. User lands on home `/` → Sees September 2025 calendar
2. Clicks a day (e.g., Sept 5) → Day view opens
3. Day view shows list of segments: "Stop at Location A (30 min)" → "Travel to Location B (5.2 km, 15 min)" → ...
4. Click segment → Map zooms to that specific segment
5. Can navigate between days
6. Can return to month view

---

#### 4. Vehicle Detail Page (Tabbed Interface)

**Location**: `/unidades/[id]` → `components/Route/MainView.tsx` with `unidadId` prop

**Tab Structure**:

##### Tab 1: Telemática (Real-time Data)
**Data Displayed**:
```typescript
{
  posición: { time: string, ago: string },
  ubicación: string,  // Lat/Lng
  velocidad: string,  // km/h
  temperatura: string,  // °C
  rumbo: string,  // N, S, E, W
  batería: string,  // %
  señal: string,  // %
  odómetro: string,  // km
  motor: string,  // Encendido/Apagado
  última_comunicación: { time: string, ago: string }
}
```

**Map**: Shows real-time vehicle position with `TelematicaMapView`

**Data Generation**: Deterministic seed-based generation from vehicle ID
```typescript
const seed = parseInt(vehicleId.match(/unidad-(\d+)/)[1]);
const speed = Math.floor((seed * 7) % 121);  // 0-120 km/h
const temp = 20 + Math.floor((seed * 3) % 61);  // 20-80°C
```

##### Tab 2: Unidad (Vehicle Info)
**Data Displayed**:
- Vehicle specifications
- Metadata
- Configuration

**Status**: Currently placeholder, but structure ready for expansion

##### Tab 3: Eventos (Vehicle-Specific Events)
**Features**:
- ✅ Filters: Severity, Tipo, Etiqueta, Responsable, Date Range
- ✅ Event list with links to event detail
- ✅ Event cards show latest note with count badge
- ✅ Dual markers on map for closed events
- ✅ Integration with main Eventos module

**Map Behavior**:
- Shows events for this specific vehicle
- Uses `MainMapView` with `eventMarkers` filtered to vehicle
- Can show event location + current vehicle location (dual markers)

##### Tab 4: Historial (30-Day Route Calendar)
**Features**:
- ✅ Same calendar as home page but vehicle-specific
- ✅ Click day → Opens day view for that vehicle
- ✅ Distance summary per day
- ✅ Route visibility toggles

**UX Flow - Vehicle Detail**:
1. User clicks vehicle name from Unidades list
2. Navigates to `/unidades/unidad-5`
3. Lands on Telemática tab (default)
4. Sees real-time telemetry grid + map with vehicle position
5. Switches to Eventos → Sees events for this vehicle
6. Switches to Historial → Sees 30-day calendar
7. Clicks a day → Day view opens with routes for that vehicle on that day
8. Back button → Returns to Unidades list (uses `router.back()`)

---

### Feature Comparison: Current vs Ideal

| Feature Area | Current Implementation | Ideal State | Gap |
|-------------|------------------------|-------------|-----|
| **Vehicle List** | ✅ Custom table in sidebar | ✅ Generic `<DataTable>` | Needs abstraction |
| **Event List** | ✅ Custom table in sidebar | ✅ Generic `<DataTable>` | Needs abstraction |
| **Map Rendering** | ✅ 5 different map components | ✅ Single `<BaseMapView>` | Major duplication |
| **Markers** | ✅ 4 marker types (Unidad, Event, Stop, Reporte) | ✅ Generic `<MapMarker>` with variants | Minor duplication |
| **Sidebar** | ✅ Inline implementation in each View | ✅ Generic `<Sidebar>` component | Needs abstraction |
| **Filtering** | ✅ Inline logic in each sidebar | ✅ Generic `useFilters` hook | Needs abstraction |
| **Data Fetching** | ❌ Inline generation in components | ✅ Zustand stores + API layer | Architecture gap |
| **Skeleton Loading** | ✅ Implemented in all Views | ✅ Continue pattern | Good ✓ |
| **Responsive Design** | ✅ Fixed layouts with resizing | ✅ Continue pattern | Good ✓ |

---

## Technical Implementation Analysis

### How It's Currently Built

#### Architecture Pattern: **Container-Presentation** (Partial)

```
┌─────────────────────────────────────────────────────┐
│ Page Component (app/unidades/page.tsx)             │
│  - Renders UnidadesView                             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│ View Component (UnidadesView)                       │
│  - Layout (MainNav, Menu, Sider, Content)          │
│  - State management (selection, filters)            │
│  - Sidebar resizing logic                           │
│  - Loading states                                   │
└─────────┬──────────────────────────────┬────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐       ┌──────────────────────┐
│ UnidadesSidebar     │       │ UnidadesMapView      │
│  - Data generation  │       │  - Leaflet map       │
│  - Filtering        │       │  - Marker rendering  │
│  - List rendering   │       │  - Map controls      │
│  - Column resizing  │       │  - Popup handling    │
└─────────────────────┘       └──────────────────────┘
```

**Problem**: This pattern is **repeated 3 times** with minimal variation:
- `UnidadesView` + `UnidadesSidebar` + `UnidadesMapView`
- `EventosView` + `EventosSidebar` + `EventosMapView`
- `MainView` + `UpdatedMainSidebar` + `MainMapView`

**Estimated Code Duplication**: ~300 lines per View × 3 = **~900 lines duplicated**

---

#### State Management

**Zustand Stores** (3 stores):

##### 1. `routeStore.ts` (Well-Designed ✅)
```typescript
{
  routes: RouteData[],
  selectedRoute: RouteData | null,
  selectedDate: string | null,
  focusedRouteId: string | null,
  viewMode: 'main' | 'day' | 'week' | 'month',
  isFullscreen: boolean,

  // Actions
  setRoutes, toggleRoute, selectRoute,
  setFocusedRoute, setViewMode, ...
}
```
**Persistence**: ✅ `persist` middleware, localStorage

**Usage**: Routes module, vehicle detail Historial tab

**Quality**: **Excellent** - Clean separation, well-typed, properly persisted

---

##### 2. `unidadesStore.ts` (Minimal)
```typescript
{
  showUnidadesOnMap: boolean,
  setShowUnidadesOnMap: (show: boolean) => void
}
```

**Purpose**: Control vehicle marker visibility when viewing Eventos (allows events + vehicles on same map)

**Quality**: **Good** - Simple, focused

---

##### 3. `mapStore.ts` (Likely Underused)
**Note**: Referenced in imports but specific usage not clear from codebase review. May be a placeholder.

**Quality**: **Unclear** - Needs investigation

---

#### Local State Patterns

**In View Components** (`UnidadesView`, `EventosView`, `MainView`):

```typescript
// Layout state
const [menuCollapsed, setMenuCollapsed] = useState(true);
const [sidebarWidth, setSidebarWidth] = useState(450);

// Data state
const [unidades, setUnidades] = useState<Unidad[]>([]);
const [filteredUnidades, setFilteredUnidades] = useState<Unidad[]>([]);

// Selection state
const [selectedUnidadId, setSelectedUnidadId] = useState<string | null>(null);

// Loading state
const [isLoading, setIsLoading] = useState(true);
```

**Problem**: Same pattern repeated 3 times. Should be:
- Layout state → Generic `useLayout` hook or UI store
- Data state → Domain-specific Zustand store (vehicleStore, eventStore)
- Selection state → Generic `useSelection` hook
- Loading state → Integrated with data fetching hooks

---

#### Data Generation (Mock Data)

**Current Approach**: Inline generation in Sidebar components

**UnidadesSidebar** (`generateUnidades` called in `useEffect`):
```typescript
useEffect(() => {
  const generatedUnidades = generateUnidades();  // lib/unidades/generateUnidades.ts
  setUnidades(generatedUnidades);
  onUnidadesGenerated(generatedUnidades);
}, []);
```

**EventosSidebar** (inline generation):
```typescript
useEffect(() => {
  const eventos = [];
  for (let i = 0; i < 25; i++) {
    const template = eventTemplates[i % eventTemplates.length];
    const seed = i * 137;
    eventos.push({
      id: `event-${i + 1}`,
      evento: template.evento,
      severidad: template.severidad,
      // ... more fields
    });
  }
  setEvents(eventos);
}, []);
```

**Problem**:
- ❌ Mixing data logic with presentation
- ❌ Hard to replace with real API
- ❌ Testing is difficult
- ❌ No loading/error states
- ❌ No caching

**Better Approach**:
```typescript
// In vehicleStore
loadVehicles: async () => {
  set({ loading: true });
  const vehicles = await vehiclesAPI.getAll();  // API abstraction
  set({ vehicles, loading: false });
}

// In component
const { vehicles, loading } = useVehicles();  // Custom hook
```

---

#### Map Implementation

**27 Map Components** - Critical Duplication Zone

**Main Map Components**:
1. `UnidadesMapView.tsx` - Vehicles map
2. `EventosMapView.tsx` - Events map
3. `MainMapView.tsx` - Routes + Events map
4. `TelematicaMapView.tsx` - Single vehicle telemetry map
5. `SingleRouteMapView.tsx` - Single route visualization
6. `UnifiedMapView.tsx` - Reusable map base (newer)

**Supporting Components**:
- `MapToolbar.tsx` - Zoom controls, fullscreen
- `MapFitBounds.tsx`, `EventMapFitBounds.tsx`, `DynamicMapFitBounds.tsx` - Auto-fit logic
- `EventMarker.tsx`, `UnidadMarker.tsx`, `ReporteMarker.tsx`, `StopMarker.tsx`, `UnifiedMarker.tsx` - Marker types
- `SimpleArrowPolyline.tsx` - Route lines with arrows
- `RouteHoverNodes.tsx`, `ReporteHoverNodes.tsx` - Hover interactions
- `NodePopover.tsx`, `EventPopup.tsx` - Popups
- `StopIndicator.tsx` - Stop duration display
- `SegmentZoom.tsx` - Zoom to route segment
- `MapClickHandler.tsx`, `MapSelectionHandler.tsx`, `MapViewController.tsx` - Event handlers

**Duplication Analysis**:

| Functionality | Implemented In | Should Be |
|---------------|----------------|-----------|
| **Map initialization** | 6 components | 1 `BaseMapView` |
| **Marker rendering** | 5 marker types | 1 `MapMarker` with variants |
| **Fit bounds logic** | 3 components | 1 `useFitBounds` hook |
| **Map toolbar** | 1 component ✅ | Reusable ✅ |
| **Popup handling** | 2 components | 1 `MapPopup` |
| **Polyline rendering** | 1 component ✅ | Reusable ✅ |

**Estimated Duplication**: ~400-500 lines of map initialization code repeated across 5-6 components

---

#### Styling Approach

**Mix of Patterns**:

1. **Inline Styles** (Most common):
```typescript
<div style={{
  position: 'absolute',
  left: 0,
  top: 0,
  width: menuCollapsed ? '48px' : '240px',
  transition: 'width 0.3s ease'
}}>
```

**Pros**: Type-safe, dynamic values easy
**Cons**: Verbose, no reuse, hard to maintain

2. **Tailwind Classes** (Secondary):
```typescript
<Layout className="h-screen">
  <Content className="relative" />
</Layout>
```

**Pros**: Utility-first, concise
**Cons**: Inconsistent usage, mixed with inline styles

3. **Global CSS** (`globals.css`):
```css
.event-popup .leaflet-popup-close-button {
  width: 32px !important;
  height: 32px !important;
  /* ... */
}
```

**Pros**: Necessary for Leaflet overrides
**Cons**: !important required, hard to scope

**Recommendation**: **Consolidate to Tailwind** with CSS modules for complex components

---

### Type Safety Analysis

**Current Type Definitions**:

1. **`types/route.ts`** ✅ Well-defined:
```typescript
export interface RouteData { ... }
export interface RouteSegment { ... }
export type ViewMode = 'main' | 'day' | 'week' | 'month';
export interface MapConfig { ... }
```

2. **Inline Types** ❌ (in View components):
```typescript
// UnidadesView.tsx
interface Unidad {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Inactivo' | 'En ruta' | 'Detenido';
  // ...
}

// EventosView.tsx
interface Event {
  id: string;
  evento: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  // ...
}
```

**Problem**: Same domain types defined in multiple places

**Solution**: Centralize in `/types/domain/`:
```
types/
├── domain/
│   ├── vehicle.ts      // Vehicle, VehicleTelemetry, VehicleEstado
│   ├── event.ts        // Event, EventSeverity
│   ├── route.ts        // RouteData, RouteSegment (existing)
│   └── telemetry.ts    // Telemetry types
├── ui/
│   ├── table.ts        // DataTable types
│   ├── filters.ts      // Filter types
│   └── map.ts          // Map component types
└── api/
    ├── requests.ts     // Request payloads
    └── responses.ts    // API responses
```

---

## UX & Navigation Pattern Analysis

### Navigation Architecture

#### Current Navigation Structure

```
┌───────────────────────────────────────────────────────────┐
│                    MainNavTopMenu                          │
│  [Numaris Logo]  Monitoreo  Reportes  Configuración  [👤] │
└───────────────────────────────────────────────────────────┘
     │
     ├─ "Monitoreo" (currently selected, shows subnav)
     │
┌────▼──────────────────────────────────────────────────────┐
│  CollapsibleMenu (Left Sidebar, 48px collapsed / 240px)   │
│  ┌──────────┐                                             │
│  │ [≫]      │  ← Toggle button                            │
│  │ [🚗] Unidades                                           │
│  │ [⚠] Eventos                                            │
│  └──────────┘                                             │
└────┬──────────────────────────────────────────────────────┘
     │
     ├─ /unidades → UnidadesView
     ├─ /eventos → EventosView
     ├─ / (home) → MainView (Routes)
     └─ /unidades/[id] → MainView with unidadId (Vehicle Detail)
```

#### Navigation Patterns Identified

##### Pattern 1: **Top Nav → Sub Nav** (Monitoreo)
- **Cognitive Load**: LOW
- **Consistency**: ✅ Good
- **Pattern**: User expects top nav to switch between major sections (Monitoreo, Reportes, etc.)
- **Implementation**: Ant Design Menu in `MainNavTopMenu`

##### Pattern 2: **Left Sidebar Toggle** (Unidades / Eventos)
- **Cognitive Load**: LOW
- **Consistency**: ✅ Excellent
- **Pattern**: Icon-only when collapsed, icon + label when expanded
- **Visual Feedback**:
  - ✅ Active state: Blue background (#e2f6ff) + blue icon
  - ✅ Hover state: Gray background (#f5f5f5)
  - ✅ Smooth transition (0.3s)
- **Best Practice**: Follows macOS Finder sidebar pattern

##### Pattern 3: **Direct Navigation via URL**
- `/unidades` → Vehicle list + map
- `/eventos` → Event list + map
- `/` → Route calendar (currently confusing, should be `/routes` or `/historial`)
- `/unidades/[id]` → Vehicle detail

**Cognitive Load**: MEDIUM
**Issue**: Home page (`/`) shows routes, not an overview. User might expect a dashboard.

**Recommendation**: Make `/` a dashboard with quick stats, recent events, fleet overview. Move routes to `/routes` or `/historial`.

##### Pattern 4: **Tabbed Navigation** (Vehicle Detail Page)
- **Location**: `/unidades/[id]`
- **Tabs**: Telemática | Unidad | Eventos | Historial
- **State Persistence**: ✅ URL query parameter (`?tab=telematica`)
- **Cognitive Load**: LOW
- **Consistency**: ✅ Excellent
- **Pattern**: Clear information architecture, each tab is a distinct view

**Best Practice**: Tab state in URL allows deep linking (e.g., `/unidades/unidad-5?tab=eventos`)

##### Pattern 5: **Back Navigation**
- **Implementation**: `router.back()` (not hardcoded routes)
- **Cognitive Load**: LOW ✅
- **Consistency**: ✅ Respects browser history
- **Best Practice**: Better than hardcoded routes because user could arrive from different pages

##### Pattern 6: **In-Page Selection** (List → Map)
- **Pattern**: Click row in sidebar → Map centers on marker + opens popup
- **Visual Feedback**:
  - ✅ Selected row highlights (blue background)
  - ✅ Marker changes (larger, different border color)
  - ✅ Map animates (pan + zoom)
- **Cognitive Load**: LOW
- **Consistency**: ✅ Same across Unidades and Eventos

##### Pattern 7: **Cross-Module Navigation** (Event → Vehicle Detail)
- **Example**: Click vehicle name in event card → Navigate to `/unidades/[id]`
- **Cognitive Load**: LOW
- **Best Practice**: Context switching is clear (from Events to Vehicle detail)

---

### Cognitive Load Analysis

#### Mental Models User Must Learn

| Mental Model | Complexity | Current Clarity | Improvement Needed |
|-------------|------------|-----------------|-------------------|
| **1. Top Nav Structure** | Simple | ✅ Clear | None |
| **2. Left Sidebar (Unidades/Eventos)** | Simple | ✅ Clear | None |
| **3. Home Page = Routes** | Medium | ⚠️ Confusing | Make `/` a dashboard, move routes to `/routes` |
| **4. Vehicle Detail Tabs** | Simple | ✅ Clear | None |
| **5. List → Map Interaction** | Simple | ✅ Clear | None |
| **6. Route Calendar → Day View** | Medium | ✅ Clear | None |
| **7. Dual Markers (Event + Vehicle)** | Complex | ⚠️ Not obvious | Add tooltip/hint |
| **8. Sidebar Resizing** | Simple | ✅ Clear (hover shows resize cursor) | None |
| **9. Filter Behavior** | Medium | ✅ Clear | None |
| **10. Map Controls (Toolbar)** | Simple | ✅ Clear (icons + tooltips) | None |

**Total Cognitive Load Score**: 6.5/10 (Medium)

**Key Insight**: Most patterns are clear and consistent. Main issues:
1. ⚠️ Home page (`/`) being routes instead of dashboard
2. ⚠️ Dual marker feature is powerful but not discoverable

---

### Navigation Consistency Score

| Navigation Element | Unidades | Eventos | Routes | Vehicle Detail | Score |
|-------------------|----------|---------|--------|---------------|-------|
| **Layout Pattern** | Sidebar + Map | Sidebar + Map | Sidebar + Map | Sidebar + Map | ✅ 100% |
| **Sidebar Width** | 450px | 520px | 520px | 520px | ⚠️ 75% |
| **Sidebar Resizing** | ✅ Yes | ✅ Yes (disabled) | ✅ No | ✅ No | ⚠️ 50% |
| **Loading Skeleton** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ 100% |
| **Filter UI** | ✅ Yes | ✅ Yes | ✅ Yes (in tabs) | ✅ Yes (in tabs) | ✅ 100% |
| **Search Bar** | ✅ Yes | ✅ Yes | ✅ No | ✅ No | ⚠️ 50% |
| **Map Toolbar** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ 100% |
| **Back Button** | N/A | N/A | N/A | ✅ Yes | N/A |

**Overall Consistency**: **82.1%** (Good, but room for improvement)

**Inconsistencies Identified**:
1. ⚠️ **Sidebar width varies**: 450px (Unidades) vs 520px (Eventos, Routes)
2. ⚠️ **Resize enabled inconsistently**: Unidades can resize, Eventos sidebar has resize code but min=max (disabled), Routes has no resizing
3. ⚠️ **Search not available in Routes**: Should be consistent

**Recommendation**: Standardize all sidebars to 520px default, enable resizing for all (450-600px range), add search to Routes if applicable.

---

### UX Heuristics Evaluation

Using **Nielsen's 10 Usability Heuristics**:

#### 1. **Visibility of System Status** ✅ GOOD
- ✅ Skeleton loading shows loading state
- ✅ Selected items highlighted
- ✅ Active nav items styled
- ✅ "Hace X minutos" shows data freshness
- ⚠️ **Missing**: Network error states, retry mechanisms

**Score**: 8/10

---

#### 2. **Match Between System and Real World** ✅ EXCELLENT
- ✅ "Unidades" (Units/Vehicles) is domain-appropriate
- ✅ "Eventos" (Events) is clear
- ✅ Severity labels: Alta, Media, Baja (High, Medium, Low) - Natural language
- ✅ Status: Activo, Inactivo, En Ruta, Detenido (Active, Inactive, On Route, Stopped) - Clear states
- ✅ Icons: 🚗 for vehicles, ⚠️ for events

**Score**: 10/10

---

#### 3. **User Control and Freedom** ✅ GOOD
- ✅ Back button (vehicle detail → vehicle list)
- ✅ Deselect by clicking background/other row
- ✅ Toggle visibility (routes, vehicles, events)
- ✅ Collapsible menu (reduce clutter)
- ⚠️ **Missing**: Undo for bulk actions (e.g., "Deselect all routes")
- ⚠️ **Missing**: Breadcrumbs for deep navigation

**Score**: 7/10

---

#### 4. **Consistency and Standards** ⚠️ NEEDS IMPROVEMENT
- ✅ Color coding is consistent (blue for primary, red for alta, etc.)
- ✅ Icon usage is consistent
- ✅ Layout pattern is consistent (sidebar + map)
- ⚠️ **Inconsistent**: Sidebar width varies
- ⚠️ **Inconsistent**: Resize behavior varies
- ⚠️ **Inconsistent**: Search availability varies

**Score**: 6/10

---

#### 5. **Error Prevention** ⚠️ NEEDS WORK
- ✅ Input validation (date pickers, dropdowns)
- ❌ **Missing**: Confirmation for destructive actions
- ❌ **Missing**: Prevent navigation with unsaved changes (future feature)
- ❌ **Missing**: Error messages for failed actions

**Score**: 4/10

---

#### 6. **Recognition Rather Than Recall** ✅ EXCELLENT
- ✅ Icons with labels (when expanded)
- ✅ Color coding (estados, severity)
- ✅ Visual markers on map
- ✅ Breadcrumb-like vehicle name in detail page
- ✅ Active state clearly shown

**Score**: 9/10

---

#### 7. **Flexibility and Efficiency of Use** ✅ EXCELLENT
- ✅ Keyboard shortcuts could be added (future)
- ✅ Filters for power users
- ✅ Resize sidebar for space management
- ✅ Column resize for customization
- ✅ Multiple routes visible at once
- ✅ Quick toggle for visibility

**Score**: 8/10

---

#### 8. **Aesthetic and Minimalist Design** ✅ EXCELLENT
- ✅ Clean, modern design
- ✅ Proper use of whitespace
- ✅ No unnecessary elements
- ✅ Ant Design components provide polish
- ✅ Color palette is professional

**Score**: 9/10

---

#### 9. **Help Users Recognize, Diagnose, and Recover from Errors** ❌ POOR
- ❌ No error messages currently (mock data always succeeds)
- ❌ No error states in UI
- ❌ No retry mechanisms
- ❌ No fallback UI for failed map loads

**Future Requirement**: When API is integrated, implement comprehensive error handling

**Score**: 2/10 (N/A for current scope)

---

#### 10. **Help and Documentation** ⚠️ MINIMAL
- ✅ Tooltips on map controls
- ⚠️ No onboarding tour
- ⚠️ No help documentation
- ⚠️ No contextual help

**Future Recommendation**: Add first-run tour, help icons with tooltips

**Score**: 3/10

---

### Overall UX Score: **66/100** (GOOD, with clear improvement areas)

**Strengths**:
- ✅ Clean, professional design
- ✅ Consistent visual language
- ✅ Good match with real-world concepts
- ✅ Excellent use of visual feedback

**Weaknesses**:
- ❌ Error handling not implemented (API integration needed)
- ⚠️ Inconsistent sidebar behavior
- ⚠️ Missing help/onboarding
- ⚠️ Some navigation patterns could be clearer (home page confusion)

---

## DRY Violations & Code Duplication

### Duplication Matrix

| Component/Pattern | Occurrences | Lines Duplicated | Severity | Impact |
|-------------------|-------------|------------------|----------|--------|
| **View Component** | 3 (Unidades, Eventos, Main) | ~250 each = 750 | 🔴 Critical | High |
| **Sidebar Component** | 3 (Unidades, Eventos, UpdatedMain) | ~300 each = 900 | 🔴 Critical | High |
| **Map Component** | 5 main variants | ~200 each = 1000 | 🔴 Critical | Very High |
| **Marker Component** | 5 types | ~100 each = 500 | 🟡 Medium | Medium |
| **FitBounds Logic** | 3 variants | ~80 each = 240 | 🟡 Medium | Low |
| **Skeleton Loading** | 3 (in Views) | ~60 each = 180 | 🟢 Low | Low |
| **Sidebar Resize Logic** | 3 (in Views) | ~40 each = 120 | 🟡 Medium | Low |

**Total Estimated Duplication**: **~3,690 lines** (~40% of codebase)

---

### Critical Duplication #1: View Components

**Pattern Repeated In**:
- `components/Unidades/UnidadesView.tsx`
- `components/Eventos/EventosView.tsx`
- `components/Route/MainView.tsx`

**Duplicated Code**:

```typescript
// DUPLICATED: Layout structure
<Layout className="h-screen">
  <MainNavTopMenu selectedMenuItem="monitoreo" />
  <Layout style={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
    {/* Collapsible Menu - EXACT SAME */}
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, ... }}>
      <CollapsibleMenu ... />
    </div>

    {/* Main Layout - EXACT SAME */}
    <Layout style={{ marginLeft: menuCollapsed ? '48px' : '240px', ... }}>
      <Sider width={sidebarWidth} style={{ ... }}>
        {/* DIFFERENT: Sidebar content varies */}
      </Sider>

      <Content className="relative" style={{ flex: 1, height: '100%' }}>
        {/* DIFFERENT: Map content varies */}
      </Content>
    </Layout>
  </Layout>
</Layout>
```

**Differences**:
- Sidebar content (UnidadesSidebar vs EventosSidebar vs UpdatedMainSidebar)
- Map content (UnidadesMapView vs EventosMapView vs MainMapView)
- Sidebar width (450 vs 520)
- Data types (Unidad vs Event vs Route)

**Why This Is Bad**:
1. 🔴 Bug fixes must be applied 3 times
2. 🔴 Layout changes require 3 updates
3. 🔴 New features (e.g., keyboard shortcuts) need 3 implementations
4. 🔴 Testing requires 3x effort

**Solution**: Generic `<PageLayout>` Component

```typescript
// components/ui/Layout/PageLayout.tsx
interface PageLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  sidebarWidth?: number;
  loading?: boolean;
}

export function PageLayout({ sidebar, content, sidebarWidth = 520, loading }: PageLayoutProps) {
  const [menuCollapsed, setMenuCollapsed] = useState(true);

  return (
    <Layout className="h-screen">
      <MainNavTopMenu selectedMenuItem="monitoreo" />
      <Layout style={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
        <CollapsibleMenu ... />
        <Layout style={{ marginLeft: menuCollapsed ? '48px' : '240px', ... }}>
          <Sider width={sidebarWidth}>
            {loading ? <SidebarSkeleton /> : sidebar}
          </Sider>
          <Content>
            {loading ? <ContentSkeleton /> : content}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

// Usage in UnidadesView:
export default function UnidadesView() {
  const { vehicles, loading } = useVehicles();

  return (
    <PageLayout
      sidebar={<VehicleList vehicles={vehicles} />}
      content={<VehicleMap vehicles={vehicles} />}
      loading={loading}
    />
  );
}
```

**Impact**: Reduce ~750 lines to ~150 lines = **600 lines saved**

---

### Critical Duplication #2: Map Components

**27 Map Components** with 5 main variants:

1. `UnidadesMapView.tsx` - Vehicles
2. `EventosMapView.tsx` - Events
3. `MainMapView.tsx` - Routes + Events
4. `TelematicaMapView.tsx` - Single vehicle
5. `SingleRouteMapView.tsx` - Single route

**Shared Code (Duplicated)**:

```typescript
// Map initialization (DUPLICATED 5x)
const mapRef = useRef<L.Map | null>(null);
const [mapLoaded, setMapLoaded] = useState(false);

useEffect(() => {
  if (typeof window === 'undefined') return;

  const map = L.map(mapContainerRef.current, {
    center: [20.659699, -103.349609],
    zoom: 13,
    zoomControl: false,
    // ... more config
  });

  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  mapRef.current = map;
  setMapLoaded(true);

  return () => { map.remove(); };
}, []);

// Fit bounds logic (DUPLICATED 3x with variations)
useEffect(() => {
  if (!mapLoaded || !mapRef.current) return;

  const bounds = L.latLngBounds(markers.map(m => m.position));
  mapRef.current.fitBounds(bounds, {
    paddingTopLeft: [80, 80],
    paddingBottomRight: [80, 80],
    maxZoom: 15
  });
}, [mapLoaded, markers]);
```

**Solution**: Single `<BaseMapView>` Component

```typescript
// components/ui/MapView/BaseMapView.tsx
interface BaseMapViewProps {
  center?: LatLngExpression;
  zoom?: number;
  children?: React.ReactNode;  // For markers, polylines, etc.
  onMapReady?: (map: L.Map) => void;
  fitBounds?: LatLngBounds | LatLngExpression[];
  fitBoundsPadding?: PaddingOptions;
  toolbar?: boolean;
}

export function BaseMapView({
  center = [20.659699, -103.349609],
  zoom = 13,
  children,
  onMapReady,
  fitBounds,
  fitBoundsPadding,
  toolbar = true
}: BaseMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  // Single map initialization
  useEffect(() => {
    const mapInstance = L.map('map', { center, zoom, zoomControl: false });
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(mapInstance);

    mapRef.current = mapInstance;
    setMap(mapInstance);
    onMapReady?.(mapInstance);

    return () => mapInstance.remove();
  }, []);

  // Single fit bounds logic
  useFitBounds(map, fitBounds, fitBoundsPadding);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />
      {toolbar && <MapToolbar map={map} />}
      {children && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </div>
  );
}

// Usage:
<BaseMapView fitBounds={vehiclePositions}>
  {vehicles.map(v => (
    <VehicleMarker key={v.id} position={v.position} vehicle={v} />
  ))}
</BaseMapView>
```

**Impact**: Reduce ~1000 lines of map code to ~200 lines = **800 lines saved**

---

### Critical Duplication #3: Sidebar Components

**Pattern Repeated In**:
- `UnidadesSidebar.tsx` - Vehicle list
- `EventosSidebar.tsx` - Event list
- `UpdatedMainSidebar.tsx` - Vehicle detail tabs

**Shared Structure**:
```typescript
// DUPLICATED: List structure
<div style={{ padding: '16px' }}>
  <Input.Search
    placeholder="Buscar..."
    onChange={handleSearch}
  />
</div>

<div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
  <div style={{ display: 'flex', gap: '8px' }}>
    <Select placeholder="Filter by X" onChange={handleFilter} />
    <Select placeholder="Filter by Y" onChange={handleFilter} />
  </div>
</div>

<div style={{ height: 'calc(100vh - Xpx)', overflow: 'auto' }}>
  {filteredItems.map(item => (
    <div
      key={item.id}
      onClick={() => onSelect(item.id)}
      style={{
        backgroundColor: selected === item.id ? '#e6f7ff' : 'white',
        // ... more styles
      }}
    >
      {/* Item content */}
    </div>
  ))}
</div>
```

**Solution**: Generic `<FilterableList>` Component

```typescript
// components/ui/List/FilterableList.tsx
interface FilterableListProps<T> {
  items: T[];
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  onItemSelect: (item: T) => void;
  selectedId?: string;
  filters?: FilterConfig[];
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function FilterableList<T extends { id: string }>({
  items,
  renderItem,
  onItemSelect,
  selectedId,
  filters = [],
  searchable = true,
  searchPlaceholder = "Buscar..."
}: FilterableListProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  const filteredItems = useFilters(items, searchTerm, filterValues);

  return (
    <>
      {searchable && (
        <div style={{ padding: '16px' }}>
          <Input.Search
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {filters.length > 0 && (
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Filters filters={filters} onChange={setFilterValues} />
        </div>
      )}

      <div style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
        {filteredItems.map(item => (
          <div
            key={item.id}
            onClick={() => onItemSelect(item)}
            className="list-item"
          >
            {renderItem(item, selectedId === item.id)}
          </div>
        ))}
      </div>
    </>
  );
}

// Usage in VehicleList:
<FilterableList<Vehicle>
  items={vehicles}
  renderItem={(vehicle, isSelected) => (
    <VehicleListItem vehicle={vehicle} isSelected={isSelected} />
  )}
  onItemSelect={handleSelect}
  selectedId={selectedId}
  filters={[
    { key: 'estado', type: 'select', options: ['Activo', 'Inactivo', 'En Ruta'] },
    { key: 'responsable', type: 'select', options: responsables }
  ]}
  searchable
/>
```

**Impact**: Reduce ~900 lines to ~250 lines = **650 lines saved**

---

### Duplication Summary & Savings

| Refactoring | Lines Before | Lines After | Saved | Effort |
|-------------|--------------|-------------|-------|--------|
| **PageLayout** | 750 | 150 | 600 | Medium |
| **BaseMapView** | 1000 | 200 | 800 | High |
| **FilterableList** | 900 | 250 | 650 | Medium |
| **Generic Marker** | 500 | 100 | 400 | Low |
| **FitBounds Hook** | 240 | 40 | 200 | Low |
| **Total** | **3,390** | **740** | **2,650** | |

**Code Reduction**: **78%** in duplicated areas
**Estimated Effort**: **2-3 weeks** for complete refactoring

---

## If Starting Over: Ideal Architecture

### What We'd Do Differently

#### 1. **Start with Design System**

**Day 1-3**: Build UI Component Library

```
components/ui/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx (Storybook)
│   └── Button.test.tsx
├── Input/
│   ├── Input.tsx
│   ├── SearchInput.tsx
│   └── Input.test.tsx
├── Layout/
│   ├── PageLayout.tsx         ← Build this FIRST
│   ├── Sidebar.tsx
│   ├── SplitView.tsx
│   └── Card.tsx
├── DataDisplay/
│   ├── Table/
│   │   ├── DataTable.tsx      ← Build this SECOND
│   │   ├── TableRow.tsx
│   │   ├── TableHeader.tsx
│   │   └── TableFilters.tsx
│   ├── Badge/
│   │   ├── StatusBadge.tsx
│   │   └── SeverityBadge.tsx
│   └── Tag/
│       └── Tag.tsx
├── Map/
│   ├── BaseMapView.tsx         ← Build this THIRD
│   ├── MapMarker.tsx
│   ├── MapPolyline.tsx
│   ├── MapPopup.tsx
│   └── MapToolbar.tsx
└── Feedback/
    ├── Skeleton.tsx
    ├── LoadingSpinner.tsx
    └── ErrorMessage.tsx
```

**Why**: Generic components first = no duplication possible

**Tool**: Use **Storybook** to develop in isolation

---

#### 2. **Type System First**

**Day 1**: Define all domain types

```typescript
// types/domain/vehicle.ts
export interface Vehicle {
  id: VehicleId;
  nombre: string;
  placa: string;
  marca: string;
  modelo: string;
  estado: VehicleEstado;
  position: Coordinates;
  lastUpdate: Timestamp;
  telemetry: VehicleTelemetry;
}

export type VehicleId = string;  // Branded type
export type VehicleEstado = 'Activo' | 'Inactivo' | 'En Ruta' | 'Detenido';
export type Coordinates = [number, number];  // [lat, lng]
export type Timestamp = string;  // ISO 8601

export interface VehicleTelemetry {
  velocidad: number;  // km/h
  temperatura: number;  // °C
  bateria: number;  // percentage
  señal: number;  // percentage
  odometro: number;  // km
  motor: MotorEstado;
  direccion: number;  // degrees
}

export type MotorEstado = 'Encendido' | 'Apagado';
```

**Why**: Types drive the entire architecture. No inline types allowed.

---

#### 3. **API Layer + Data Fetching Pattern**

**Day 2-4**: Build data layer

```typescript
// lib/api/client.ts
export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  return response.json();
}

// lib/api/vehicles.ts
export const vehiclesAPI = {
  getAll: () => apiClient<Vehicle[]>('/vehicles'),
  getById: (id: VehicleId) => apiClient<Vehicle>(`/vehicles/${id}`),
  getTelemetry: (id: VehicleId) => apiClient<VehicleTelemetry>(`/vehicles/${id}/telemetry`),
  getRoutes: (id: VehicleId, date: string) => apiClient<Route[]>(`/vehicles/${id}/routes?date=${date}`),
};

// lib/stores/vehicleStore.ts (Zustand)
export const useVehicleStore = create<VehicleStore>()((set) => ({
  vehicles: [],
  loading: false,
  error: null,

  loadVehicles: async () => {
    set({ loading: true, error: null });
    try {
      const vehicles = await vehiclesAPI.getAll();
      set({ vehicles, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

// hooks/domain/useVehicles.ts
export function useVehicles() {
  const { vehicles, loading, error, loadVehicles } = useVehicleStore();

  useEffect(() => {
    if (vehicles.length === 0) {
      loadVehicles();
    }
  }, []);

  return { vehicles, loading, error, refetch: loadVehicles };
}
```

**Why**: Clear separation: API → Store → Hook → Component. No data logic in components.

---

#### 4. **Feature-Based Architecture**

**Structure** (instead of component-type grouping):

```
components/
├── ui/                    ← Generic, reusable
│   ├── Button/
│   ├── Input/
│   ├── Layout/
│   ├── DataDisplay/
│   └── Map/
│
├── features/              ← Feature compositions
│   ├── VehicleMonitoring/
│   │   ├── VehicleMonitoringView.tsx
│   │   ├── VehicleList.tsx
│   │   ├── VehicleMap.tsx
│   │   └── VehicleFilters.tsx
│   │
│   ├── EventMonitoring/
│   │   ├── EventMonitoringView.tsx
│   │   ├── EventList.tsx
│   │   ├── EventMap.tsx
│   │   └── EventFilters.tsx
│   │
│   ├── VehicleDetail/
│   │   ├── VehicleDetailView.tsx
│   │   ├── TelematicaTab.tsx
│   │   ├── EventosTab.tsx
│   │   ├── HistorialTab.tsx
│   │   └── VehicleHeader.tsx
│   │
│   └── RouteAnalysis/
│       ├── RouteAnalysisView.tsx
│       ├── RouteCalendar.tsx
│       ├── DayRouteView.tsx
│       └── RouteSegmentList.tsx
│
└── domain/                ← Domain-specific components
    ├── vehicle/
    │   ├── VehicleCard.tsx
    │   ├── VehicleMarker.tsx
    │   └── VehicleTelemetryPanel.tsx
    ├── event/
    │   ├── EventCard.tsx
    │   ├── EventMarker.tsx
    │   └── EventSeverityBadge.tsx
    └── route/
        ├── RoutePolyline.tsx
        ├── StopMarker.tsx
        └── SegmentCard.tsx
```

**Why**: Features are cohesive units. Easier to find code, easier to delete features.

---

#### 5. **Configuration-Driven**

**All magic numbers in config files**:

```typescript
// config/map.config.ts
export const MAP_CONFIG = {
  defaultCenter: [20.659699, -103.349609] as Coordinates,
  defaultZoom: 13,
  maxZoom: 18,
  minZoom: 10,
  guadalajaraArea: {
    north: 20.75,
    south: 20.55,
    east: -103.25,
    west: -103.45,
  },
  tileLayer: {
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; OpenStreetMap',
  },
  fitBoundsPadding: {
    topLeft: [80, 80] as [number, number],
    bottomRight: [80, 80] as [number, number],
  },
};

// config/ui.config.ts
export const UI_CONFIG = {
  sidebar: {
    defaultWidth: 520,
    minWidth: 450,
    maxWidth: 800,
  },
  loadingDelay: 800,  // ms
  transitionDuration: 300,  // ms
  skeletonRows: {
    telematica: 12,
    unidad: 8,
    eventos: 10,
    historial: 15,
  },
};

// config/colors.config.ts
export const COLORS = {
  primary: '#1867ff',
  estados: {
    Activo: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0c4a6e' },
    Inactivo: { bg: '#f1f5f9', border: '#64748b', text: '#1e293b' },
    'En Ruta': { bg: '#ecfccb', border: '#84cc16', text: '#365314' },
    Detenido: { bg: '#fef2f2', border: '#ef4444', text: '#7f1d1d' },
  },
  severidades: {
    Alta: { bg: '#fff2f0', border: '#ff4d4f', text: '#ff4d4f' },
    Media: { bg: '#fff7e6', border: '#fa8c16', text: '#fa8c16' },
    Baja: { bg: '#e6f7ff', border: '#1890ff', text: '#1890ff' },
    Informativa: { bg: '#e6fffb', border: '#13c2c2', text: '#13c2c2' },
  },
};
```

**Why**: Single source of truth. Easy to update branding, easy to maintain consistency.

---

#### 6. **Testing from Day 1**

**Test Pyramid**:
- **Unit Tests**: All hooks, utilities, stores
- **Integration Tests**: Feature components
- **E2E Tests**: Critical user flows

**Example**:
```typescript
// hooks/domain/useVehicles.test.tsx
describe('useVehicles', () => {
  it('loads vehicles on mount', async () => {
    const { result } = renderHook(() => useVehicles());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.vehicles).toHaveLength(15);
    });
  });

  it('handles API errors', async () => {
    mockAPI.getVehicles.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useVehicles());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});
```

**Why**: Prevents regressions, documents behavior, enables refactoring with confidence.

---

### Architectural Comparison

| Aspect | Current Architecture | Ideal Architecture | Benefit |
|--------|---------------------|-------------------|---------|
| **Component Organization** | By type (Map/, Route/, etc.) | By feature + ui/ + domain/ | Easier to navigate, delete features |
| **Code Reuse** | ~60% (40% duplicated) | ~95% | Faster development, fewer bugs |
| **Type Safety** | Inline types + types/ | Centralized types/ | Single source of truth |
| **Data Fetching** | In components (mock data) | API → Store → Hook | Testable, swappable |
| **Styling** | Mix (inline + Tailwind + CSS) | Tailwind + CSS Modules | Consistent, maintainable |
| **Testing** | Minimal | Comprehensive | Confidence in changes |
| **State Management** | Zustand (good) + local state | Zustand + React Query | Server/client state separation |
| **Error Handling** | None (mock data) | Comprehensive | Production-ready |
| **Configuration** | Hardcoded values | Config files | Easy to maintain |
| **Developer Experience** | Good | Excellent | Faster onboarding, clear patterns |

---

## Improvement Opportunities

### High-Impact Improvements (Prioritized)

#### 1. 🔴 **CRITICAL: Eliminate View Component Duplication**

**Problem**: 750 lines duplicated across UnidadesView, EventosView, MainView

**Solution**: Create `<PageLayout>` component (as detailed in DRY section)

**Effort**: 2-3 days
**Impact**: Very High
**Priority**: P0 (Do immediately)

**Benefits**:
- 1 place to fix layout bugs
- Consistent behavior across all pages
- Easier to add new pages

---

#### 2. 🔴 **CRITICAL: Consolidate Map Components**

**Problem**: 27 map components with 5 main variants = ~1000 lines duplicated

**Solution**:
1. Create `<BaseMapView>` (generic map initialization)
2. Create `<MapMarker>` (generic marker component with variants)
3. Create `useFitBounds` hook (shared bounds logic)

**Effort**: 5-7 days
**Impact**: Very High
**Priority**: P0

**Benefits**:
- 1 place for map initialization
- Consistent map behavior
- Easier to add new map features (e.g., clustering)

---

#### 3. 🟡 **HIGH: Centralize Data Layer**

**Problem**: Mock data generation mixed with presentation

**Solution**:
1. Create Zustand stores: `vehicleStore`, `eventStore`
2. Create API client structure (even if using mock endpoints initially)
3. Create custom hooks: `useVehicles`, `useEvents`, `useVehicle(id)`

**Effort**: 3-4 days
**Impact**: High
**Priority**: P1

**Benefits**:
- Easy to swap mock → real API
- Testable data logic
- Loading/error states in one place

---

#### 4. 🟡 **HIGH: Standardize Navigation**

**Problem**: Home page (`/`) is routes (confusing), inconsistent sidebar widths

**Solution**:
1. Move routes from `/` to `/historial`
2. Make `/` a dashboard with overview cards
3. Standardize all sidebar widths to 520px
4. Enable resizing for all (450-800px range)

**Effort**: 1-2 days
**Impact**: Medium-High
**Priority**: P1

**Benefits**:
- Clearer mental model
- Consistent UX
- Better first impression

---

#### 5. 🟢 **MEDIUM: Create Generic List Component**

**Problem**: 900 lines duplicated across UnidadesSidebar, EventosSidebar

**Solution**: Create `<FilterableList>` component (as detailed in DRY section)

**Effort**: 2-3 days
**Impact**: Medium
**Priority**: P2

**Benefits**:
- Consistent list behavior
- Easier to add new list views

---

#### 6. 🟢 **MEDIUM: Add Comprehensive Type Definitions**

**Problem**: Types scattered (inline + types/route.ts)

**Solution**:
1. Create `types/domain/` for all domain models
2. Create `types/ui/` for component prop types
3. Create `types/api/` for API request/response types
4. Remove all inline type definitions

**Effort**: 1-2 days
**Impact**: Medium
**Priority**: P2

**Benefits**:
- Single source of truth
- Better autocomplete
- Easier refactoring

---

#### 7. 🟢 **MEDIUM: Configuration Management**

**Problem**: Magic numbers scattered throughout codebase

**Solution**: Create config files:
- `config/map.config.ts`
- `config/ui.config.ts`
- `config/colors.config.ts`
- `config/constants.ts`

**Effort**: 1 day
**Impact**: Low-Medium
**Priority**: P2

**Benefits**:
- Easy to update values
- Single source of truth for constants
- Better for theming

---

#### 8. 🟢 **LOW: Error Handling Architecture**

**Problem**: No error states (mock data always succeeds)

**Solution**:
1. Create `<ErrorBoundary>` component
2. Create `<ErrorMessage>` component
3. Add error handling to all data fetching hooks
4. Create retry mechanisms

**Effort**: 2-3 days
**Impact**: Medium (future-proofing)
**Priority**: P3 (before API integration)

**Benefits**:
- Production-ready
- Better UX for failures
- Easier debugging

---

#### 9. 🟢 **LOW: Onboarding & Help**

**Problem**: No help documentation, no tour

**Solution**:
1. Add tooltips to all interactive elements
2. Create first-run tour (using Intro.js or similar)
3. Add help documentation page

**Effort**: 3-4 days
**Impact**: Low-Medium
**Priority**: P4 (nice-to-have)

**Benefits**:
- Lower learning curve
- Reduced support requests
- Professional feel

---

### Quick Wins (Low Effort, High Impact)

#### 1. ✅ **Standardize Sidebar Width** (30 min)
Change all sidebars to 520px default, enable resizing for all.

#### 2. ✅ **Fix Home Page Route** (1 hour)
Create `/historial` route, make `/` a proper dashboard.

#### 3. ✅ **Add Search to Routes** (1 hour)
Add search bar to Routes view for consistency.

#### 4. ✅ **Standardize Loading Times** (30 min)
Change all skeleton delays to 800ms (currently varies).

#### 5. ✅ **Add Tooltips to Map Controls** (1 hour)
Ensure all icons have clear tooltips.

---

## Recommended Refactoring Patterns

### Pattern 1: **Composition over Duplication**

**Before** (Duplicated):
```typescript
// UnidadesView.tsx
export default function UnidadesView() {
  return (
    <Layout className="h-screen">
      <MainNavTopMenu selectedMenuItem="monitoreo" />
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        <CollapsibleMenu ... />
        <Sider width={450}>
          <UnidadesSidebar />
        </Sider>
        <Content>
          <UnidadesMapView />
        </Content>
      </Layout>
    </Layout>
  );
}

// EventosView.tsx (95% same code)
export default function EventosView() {
  return (
    <Layout className="h-screen">
      <MainNavTopMenu selectedMenuItem="monitoreo" />
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        <CollapsibleMenu ... />
        <Sider width={520}>  {/* Only difference: width */}
          <EventosSidebar />  {/* Only difference: sidebar */}
        </Sider>
        <Content>
          <EventosMapView />  {/* Only difference: map */}
        </Content>
      </Layout>
    </Layout>
  );
}
```

**After** (Composed):
```typescript
// components/ui/Layout/PageLayout.tsx
export function PageLayout({ sidebar, content, sidebarWidth = 520 }) {
  return (
    <Layout className="h-screen">
      <MainNavTopMenu selectedMenuItem="monitoreo" />
      <Layout style={{ height: 'calc(100vh - 64px)' }}>
        <CollapsibleMenu ... />
        <Sider width={sidebarWidth}>
          {sidebar}
        </Sider>
        <Content>
          {content}
        </Content>
      </Layout>
    </Layout>
  );
}

// UnidadesView.tsx (clean)
export default function UnidadesView() {
  return (
    <PageLayout
      sidebar={<UnidadesSidebar />}
      content={<UnidadesMapView />}
      sidebarWidth={520}
    />
  );
}

// EventosView.tsx (clean)
export default function EventosView() {
  return (
    <PageLayout
      sidebar={<EventosSidebar />}
      content={<EventosMapView />}
    />
  );
}
```

**Result**: 200+ lines → 20 lines per view

---

### Pattern 2: **Hook Extraction for Logic Reuse**

**Before** (Inline logic):
```typescript
// In UnidadesSidebar.tsx
const [unidades, setUnidades] = useState([]);
const [filtered, setFiltered] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [estadoFilter, setEstadoFilter] = useState('');

useEffect(() => {
  const result = unidades.filter(u => {
    if (searchTerm && !u.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (estadoFilter && u.estado !== estadoFilter) {
      return false;
    }
    return true;
  });
  setFiltered(result);
}, [unidades, searchTerm, estadoFilter]);

// ... same logic repeated in EventosSidebar.tsx
```

**After** (Extracted hook):
```typescript
// hooks/ui/useFilters.ts
export function useFilters<T>(
  items: T[],
  filterConfig: FilterConfig<T>[]
) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filtered = useMemo(() => {
    return items.filter(item => {
      return filterConfig.every(config => {
        const filterValue = filters[config.key];
        if (!filterValue) return true;

        if (config.type === 'search') {
          return item[config.key]
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        }

        if (config.type === 'select') {
          return item[config.key] === filterValue;
        }

        return true;
      });
    });
  }, [items, filters, filterConfig]);

  return { filtered, filters, setFilters };
}

// Usage in UnidadesSidebar:
const { filtered, filters, setFilters } = useFilters(unidades, [
  { key: 'nombre', type: 'search' },
  { key: 'estado', type: 'select' },
]);
```

**Result**: Filter logic reused, testable, maintainable

---

### Pattern 3: **Configuration-Driven Rendering**

**Before** (Hardcoded):
```typescript
// Multiple marker components with hardcoded values
export function UnidadMarker({ estado }) {
  let color;
  if (estado === 'Activo') color = '#0ea5e9';
  else if (estado === 'Inactivo') color = '#64748b';
  else if (estado === 'En Ruta') color = '#84cc16';
  else color = '#ef4444';

  return <Marker icon={customIcon(color)} />;
}

// ... repeated in EventMarker, StopMarker, etc.
```

**After** (Configuration):
```typescript
// config/colors.config.ts
export const ESTADO_COLORS = {
  'Activo': '#0ea5e9',
  'Inactivo': '#64748b',
  'En Ruta': '#84cc16',
  'Detenido': '#ef4444',
} as const;

export const SEVERITY_COLORS = {
  'Alta': '#ff4d4f',
  'Media': '#fa8c16',
  'Baja': '#1890ff',
  'Informativa': '#13c2c2',
} as const;

// components/ui/Map/MapMarker.tsx
interface MapMarkerProps {
  position: [number, number];
  color: string;
  icon?: React.ReactNode;
  size?: number;
}

export function MapMarker({ position, color, icon, size = 32 }: MapMarkerProps) {
  return <Marker position={position} icon={customIcon(color, size)} />;
}

// Usage:
<MapMarker
  position={vehicle.position}
  color={ESTADO_COLORS[vehicle.estado]}
  size={isSelected ? 40 : 32}
/>
```

**Result**: Colors defined once, easy to update, type-safe

---

### Pattern 4: **Store + Hook Pattern for Data**

**Before** (Component state):
```typescript
// In UnidadesSidebar
const [unidades, setUnidades] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  const data = generateUnidades();  // Mock
  setUnidades(data);
  setLoading(false);
}, []);
```

**After** (Store + Hook):
```typescript
// lib/stores/vehicleStore.ts
export const useVehicleStore = create<VehicleStore>()((set) => ({
  vehicles: [],
  loading: false,
  error: null,

  loadVehicles: async () => {
    set({ loading: true, error: null });
    try {
      const vehicles = await vehiclesAPI.getAll();
      set({ vehicles, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

// hooks/domain/useVehicles.ts
export function useVehicles() {
  const { vehicles, loading, error, loadVehicles } = useVehicleStore();

  useEffect(() => {
    if (vehicles.length === 0) {
      loadVehicles();
    }
  }, []);

  return { vehicles, loading, error, refetch: loadVehicles };
}

// In component:
const { vehicles, loading, error } = useVehicles();

if (loading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
return <VehicleList vehicles={vehicles} />;
```

**Result**:
- ✅ Testable
- ✅ Reusable
- ✅ Centralized state
- ✅ Easy to swap mock → real API

---

### Pattern 5: **Render Props for Flexibility**

**Before** (Rigid):
```typescript
export function VehicleList({ vehicles }) {
  return (
    <div>
      {vehicles.map(v => (
        <div key={v.id}>
          <VehicleIcon estado={v.estado} />
          <span>{v.nombre}</span>
          <StatusBadge estado={v.estado} />
        </div>
      ))}
    </div>
  );
}

// Can't customize rendering
```

**After** (Flexible):
```typescript
interface FilterableListProps<T> {
  items: T[];
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  onItemSelect: (item: T) => void;
  selectedId?: string;
}

export function FilterableList<T extends { id: string }>({
  items,
  renderItem,
  onItemSelect,
  selectedId,
}: FilterableListProps<T>) {
  return (
    <div>
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => onItemSelect(item)}
          className={selectedId === item.id ? 'selected' : ''}
        >
          {renderItem(item, selectedId === item.id)}
        </div>
      ))}
    </div>
  );
}

// Usage - fully customizable:
<FilterableList<Vehicle>
  items={vehicles}
  renderItem={(vehicle, isSelected) => (
    <>
      <VehicleIcon estado={vehicle.estado} />
      <span style={{ fontWeight: isSelected ? 600 : 400 }}>
        {vehicle.nombre}
      </span>
      <StatusBadge estado={vehicle.estado} />
    </>
  )}
  onItemSelect={handleSelect}
  selectedId={selectedId}
/>
```

**Result**: Generic component, customizable rendering, fully reusable

---

## Action Plan & Prioritization

### Phase 1: Foundation Refactoring (Week 1-2)

**Goal**: Eliminate critical duplication

#### Week 1: Layout & UI Components

**Day 1-2**: PageLayout Component
- [ ] Create `components/ui/Layout/PageLayout.tsx`
- [ ] Extract menu collapse logic
- [ ] Extract sidebar resize logic
- [ ] Add skeleton loading support
- [ ] Test with UnidadesView

**Day 3-4**: Migrate All Views
- [ ] Refactor `UnidadesView` to use PageLayout
- [ ] Refactor `EventosView` to use PageLayout
- [ ] Refactor `MainView` to use PageLayout
- [ ] Test all pages
- [ ] Delete duplicated code

**Day 5**: FilterableList Component
- [ ] Create `components/ui/List/FilterableList.tsx`
- [ ] Create `hooks/ui/useFilters.ts`
- [ ] Test with vehicle list

**Expected Savings**: ~800 lines removed

---

#### Week 2: Map Consolidation

**Day 1-3**: BaseMapView Component
- [ ] Create `components/ui/Map/BaseMapView.tsx`
- [ ] Extract map initialization
- [ ] Create `useFitBounds` hook
- [ ] Add MapContext for child components
- [ ] Test with vehicles map

**Day 4-5**: Migrate All Maps
- [ ] Migrate `UnidadesMapView` to use BaseMapView
- [ ] Migrate `EventosMapView` to use BaseMapView
- [ ] Migrate `TelematicaMapView` to use BaseMapView
- [ ] Test all map views
- [ ] Delete old map components

**Expected Savings**: ~1000 lines removed

---

### Phase 2: Data Layer (Week 3)

**Goal**: Centralize data fetching

**Day 1**: Type Definitions
- [ ] Create `types/domain/vehicle.ts`
- [ ] Create `types/domain/event.ts`
- [ ] Create `types/api/responses.ts`
- [ ] Remove inline types

**Day 2-3**: Zustand Stores
- [ ] Create `lib/stores/vehicleStore.ts`
- [ ] Create `lib/stores/eventStore.ts`
- [ ] Implement loading/error states
- [ ] Add persist middleware

**Day 4-5**: Custom Hooks + Migration
- [ ] Create `hooks/domain/useVehicles.ts`
- [ ] Create `hooks/domain/useEvents.ts`
- [ ] Create `hooks/domain/useVehicle.ts`
- [ ] Migrate sidebars to use hooks
- [ ] Remove inline data generation

**Expected Savings**: Cleaner architecture, testable code

---

### Phase 3: Navigation & UX (Week 4)

**Goal**: Improve navigation consistency

**Day 1**: Route Restructuring
- [ ] Create `/historial` route
- [ ] Create `/` dashboard page
- [ ] Update navigation links
- [ ] Test all routes

**Day 2**: Sidebar Standardization
- [ ] Standardize all sidebar widths to 520px
- [ ] Enable resizing for all (450-800px)
- [ ] Add search to Routes view
- [ ] Test resize behavior

**Day 3**: UI Polish
- [ ] Add tooltips to all map controls
- [ ] Standardize loading delays to 800ms
- [ ] Add hover states to all interactive elements
- [ ] Test on different screen sizes

**Day 4-5**: Configuration Management
- [ ] Create `config/map.config.ts`
- [ ] Create `config/ui.config.ts`
- [ ] Create `config/colors.config.ts`
- [ ] Replace all hardcoded values

---

### Phase 4: Error Handling & Testing (Week 5+)

**Goal**: Production readiness

**Day 1-2**: Error Handling
- [ ] Create `<ErrorBoundary>`
- [ ] Create `<ErrorMessage>`
- [ ] Add error states to stores
- [ ] Add retry mechanisms

**Day 3-5**: Testing
- [ ] Write unit tests for hooks
- [ ] Write integration tests for features
- [ ] Set up E2E tests (Playwright/Cypress)
- [ ] Achieve 80%+ coverage

---

### Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| **Lines of Code** | ~9,000 | ~6,000 | -33% |
| **Duplicated Code** | 40% | <5% | <10% |
| **Test Coverage** | 0% | 80% | >75% |
| **Build Time** | ~30s | ~20s | <25s |
| **Type Coverage** | 85% | 100% | 100% |
| **Components** | 43 | 30 | <35 |
| **Generic UI Components** | 0 | 15 | >10 |
| **Domain Components** | 0 | 12 | >8 |

---

## Conclusion

### Executive Summary

**Current State**: Feature-complete vehicle tracking system with modern tech stack, but suffering from ~40% code duplication and architectural debt.

**Strengths**:
- ✅ Excellent feature set
- ✅ Modern stack (React 19, Next.js 15, TypeScript)
- ✅ Clean design and UX
- ✅ Good state management foundation (Zustand)

**Weaknesses**:
- ❌ Massive code duplication (~3,700 lines)
- ❌ No separation of concerns (data mixed with presentation)
- ❌ Inconsistent patterns (sidebar width, resize behavior)
- ❌ No error handling (mock data only)

**Recommended Path Forward**:
1. **Phase 1** (Weeks 1-2): Eliminate View and Map duplication = **-1,800 lines**
2. **Phase 2** (Week 3): Centralize data layer = Testable, maintainable
3. **Phase 3** (Week 4): Improve navigation = Better UX
4. **Phase 4** (Week 5+): Add error handling + tests = Production-ready

**Total Effort**: **4-5 weeks**
**Expected ROI**:
- **-33% lines of code**
- **<5% duplication**
- **80%+ test coverage**
- **Faster feature development** (generic components)
- **Easier maintenance** (single source of truth)

### Key Recommendations

#### Immediate Actions (This Week)
1. 🔴 Create `PageLayout` component → Migrate all Views
2. 🔴 Create `BaseMapView` component → Migrate all Maps
3. 🟡 Standardize sidebar widths to 520px

#### Short-term (Next 2 Weeks)
1. 🟡 Create Zustand stores for vehicles and events
2. 🟡 Extract data fetching to custom hooks
3. 🟡 Centralize type definitions

#### Medium-term (Next Month)
1. 🟢 Restructure routes (`/` → dashboard, `/historial` → routes)
2. 🟢 Create configuration files
3. 🟢 Add comprehensive error handling

#### Long-term (Next Quarter)
1. 🟢 Integrate with real backend API
2. 🟢 Add comprehensive testing
3. 🟢 Add onboarding/help documentation

---

### If Starting Over Checklist

If rebuilding from scratch, ensure:
- ✅ Design system first (Storybook)
- ✅ Type definitions first (types/)
- ✅ Generic components first (ui/)
- ✅ Data layer first (API + stores + hooks)
- ✅ Feature components last (features/)
- ✅ Configuration-driven (config/)
- ✅ Test-driven (tests alongside code)
- ✅ Documentation-driven (README, ARCHITECTURE, API docs)

---

**Document Version**: 1.0.0
**Next Review**: After Phase 1 completion
**Maintained By**: Development Team
**Questions/Feedback**: [Create GitHub Issue]

---

END OF DOCUMENT
