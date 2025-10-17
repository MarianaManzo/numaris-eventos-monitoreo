# Unidades Tracking System - Architecture & Migration Guide

> **Version**: 1.0.0
> **Last Updated**: January 2025
> **Tech Stack**: Next.js 15.5.4, React 19, TypeScript, Ant Design, Leaflet, Zustand

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current System Analysis](#current-system-analysis)
3. [Feature Catalog](#feature-catalog)
4. [Current Architecture Patterns](#current-architecture-patterns)
5. [Ideal Architecture Design](#ideal-architecture-design)
6. [Component Reusability Strategy](#component-reusability-strategy)
7. [Migration Plan](#migration-plan)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Best Practices Reference](#best-practices-reference)

---

## Executive Summary

### What This System Does

**Unidades Tracking** is a fleet management and vehicle tracking system that provides real-time monitoring, historical route analysis, and event management for vehicle fleets. It combines GPS tracking, telemetry data, event detection, and route visualization in a single unified platform.

### Core Capabilities

- **Real-time Vehicle Tracking**: Monitor live vehicle positions with telemetry data (speed, battery, signal strength, odometer)
- **Event Management**: Track and categorize vehicle events by severity (Alta, Media, Baja, Informativa)
- **Historical Route Analysis**: View vehicle routes by day, week, or month with detailed stop/travel segments
- **Multi-view Architecture**: Three main views (Unidades, Eventos, Routes) each with specialized data display
- **Interactive Maps**: Leaflet-based mapping with custom markers, polylines, and interactive controls

### Technology Decisions

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Next.js** | 15.5.4 | Framework | App Router, SSR, dynamic routing, Turbopack |
| **React** | 19.1.0 | UI Library | Latest with `use()` hook for async params |
| **TypeScript** | 5.x | Type Safety | Full type coverage across codebase |
| **Ant Design** | 5.27.4 | UI Components | Enterprise-grade component library |
| **Leaflet** | 1.9.4 | Mapping | Open-source, customizable maps |
| **Zustand** | 5.0.8 | State Management | Lightweight, simple API, persist middleware |
| **Tailwind CSS** | 4.x | Styling | Utility-first CSS with @tailwindcss/postcss |
| **Day.js** | 1.11.18 | Date Handling | Lightweight date manipulation |

---

## Current System Analysis

### Project Structure

```
unidades-tracking-antd/
├── app/                          # Next.js 15 App Router
│   ├── page.tsx                  # Home (Routes main view)
│   ├── eventos/
│   │   └── page.tsx              # Events list page
│   ├── unidades/
│   │   ├── page.tsx              # Vehicles list page
│   │   └── [unidadId]/
│   │       └── page.tsx          # Individual vehicle route view
│   └── test/
│       └── page.tsx              # Test/demo page
│
├── components/                   # React components
│   ├── Eventos/                  # Events module
│   │   ├── EventosView.tsx       # Main layout
│   │   ├── EventosSidebar.tsx    # List, filters, data generation
│   │   └── EventosMapView.tsx    # Map with event markers
│   │
│   ├── Unidades/                 # Vehicles module
│   │   ├── UnidadesView.tsx      # Main layout
│   │   ├── UnidadesSidebar.tsx   # List, filters, data generation
│   │   └── UnidadesMapView.tsx   # Map with vehicle markers
│   │
│   ├── Route/                    # Route tracking module
│   │   ├── MainView.tsx          # Route main view (vehicle detail)
│   │   ├── DayView.tsx           # Single day route analysis
│   │   ├── MainSidebar.tsx       # Route list (legacy)
│   │   ├── UpdatedMainSidebar.tsx # Route list with tabs
│   │   ├── DaySidebar.tsx        # Day route segment list
│   │   ├── RouteSidebar.tsx      # Route selector
│   │   ├── EventosTab.tsx        # Events tab content
│   │   └── TelematicaMapView.tsx # Individual vehicle tracking map
│   │
│   ├── Map/                      # Mapping components
│   │   ├── MainMapView.tsx       # Unified map for routes + events
│   │   ├── EventosMapView.tsx    # Events-specific map
│   │   ├── UnidadesMapView.tsx   # Vehicles-specific map
│   │   ├── TelematicaMapView.tsx # Individual vehicle map
│   │   ├── SingleRouteMapView.tsx # Single route visualization
│   │   ├── UnifiedMapView.tsx    # Reusable map base
│   │   ├── MapToolbar.tsx        # Zoom, fullscreen, recenter controls
│   │   ├── MapFitBounds.tsx      # Auto-fit bounds utility
│   │   ├── EventMapFitBounds.tsx # Event-specific bounds
│   │   ├── DynamicMapFitBounds.tsx # Dynamic bounds
│   │   ├── EventMarker.tsx       # Event marker with popup
│   │   ├── UnidadMarker.tsx      # Vehicle marker with popup
│   │   ├── ReporteMarker.tsx     # Report marker
│   │   ├── StopMarker.tsx        # Stop point marker
│   │   ├── UnifiedMarker.tsx     # Generic marker component
│   │   ├── SimpleArrowPolyline.tsx # Directional route lines
│   │   ├── RouteHoverNodes.tsx   # Route hover interactions
│   │   ├── NodePopover.tsx       # Node info popover
│   │   ├── StopIndicator.tsx     # Stop duration indicator
│   │   ├── SegmentZoom.tsx       # Route segment zoom
│   │   ├── MapClickHandler.tsx   # Map click events
│   │   ├── MapSelectionHandler.tsx # Selection logic
│   │   └── MapViewController.tsx # View state controller
│   │
│   └── Layout/                   # Layout components
│       ├── MainNavTopMenu.tsx    # Top navigation bar
│       ├── CollapsibleMenu.tsx   # Left sidebar menu
│       ├── NumarisLogo.tsx       # Logo component
│       └── Header.tsx            # Header component
│
├── lib/                          # Business logic & utilities
│   ├── stores/                   # Zustand stores
│   │   ├── routeStore.ts         # Route state management
│   │   └── mapStore.ts           # Map state management
│   └── utils/
│       └── routeGenerator.ts     # Sample route data generation
│
├── hooks/                        # Custom React hooks
│   ├── useMapFitBounds.ts        # Map bounds hook
│   └── [other hooks]
│
├── types/                        # TypeScript definitions
│   └── route.ts                  # Route-related types
│
└── public/                       # Static assets
```

### Key Metrics

- **Total Components**: 43 React components
- **Pages**: 5 routes (home, eventos, unidades, unidades/[id], test)
- **State Stores**: 2 Zustand stores (route, map)
- **Custom Hooks**: Multiple (mapFitBounds, etc.)
- **Type Definitions**: Centralized in `/types`

---

## Feature Catalog

### 1. Unidades (Vehicles) Module

**Purpose**: Real-time fleet monitoring and vehicle status tracking

#### Features

##### 1.1 Vehicle List View
- **Location**: `/unidades` → `UnidadesSidebar.tsx`
- **Capabilities**:
  - Display all vehicles in filterable list
  - Show vehicle icon (color-coded by estado)
  - Real-time status badges (Activo, Inactivo, En Ruta, Detenido)
  - Search by vehicle name
  - Filter by estado, etiqueta, responsable
  - Sort by various criteria
  - Column resizing
  - Row selection highlights map marker

##### 1.2 Vehicle Map View
- **Location**: `/unidades` → `UnidadesMapView.tsx`
- **Capabilities**:
  - Google Maps tile layer
  - Custom vehicle markers (UnidadMarker)
  - Marker color coding by estado
  - Click to open vehicle dialog
  - Pan to selected vehicle (viewport-aware centering)
  - Map toolbar: zoom in/out, reset view, recenter all, fullscreen

##### 1.3 Vehicle Marker Dialog
- **Location**: `UnidadMarker.tsx`
- **Data Displayed**:
  - Vehicle name
  - Last update timestamp
  - Address (geocoded)
  - Telemetry grid:
    - Movement status (Activo/Inactivo)
    - Speed (km/h)
    - Engine status (Encendido/Apagado)
    - Signal strength (%)
    - Battery level (%)
    - Odometer reading (km)
  - Estado badge
  - GPS button

##### 1.4 Vehicle Detail View (Individual Routes)
- **Location**: `/unidades/[unidadId]` → `MainView.tsx`
- **Capabilities**:
  - Tabbed interface:
    - **Telemática**: Real-time tracking map
    - **Unidad**: Vehicle details and specifications
    - **Eventos**: Vehicle-specific events
    - **Historial**: Historical routes by month
  - Vehicle name in header
  - Tab state persistence (localStorage)
  - Dynamic routing with unidadId parameter

### 2. Eventos (Events) Module

**Purpose**: Track and manage vehicle events by severity

#### Features

##### 2.1 Event List View
- **Location**: `/eventos` → `EventosSidebar.tsx`
- **Capabilities**:
  - Display all events (25 random generated)
  - Event types:
    - Límite de velocidad excedido
    - Botón de pánico activado
    - Parada abrupta detectada
    - Desconexión de batería
    - Frenazo de emergencia
    - And 20+ more event types
  - Severity classification:
    - **Alta** (Red): Critical events
    - **Media** (Orange): Medium priority
    - **Baja** (Blue): Low priority
    - **Informativa** (Cyan): Informational
  - Filter by severity, etiqueta, responsable
  - Date range picker
  - Search by event name
  - Sort options
  - Column resizing

##### 2.2 Event Map View
- **Location**: `/eventos` → `EventosMapView.tsx`
- **Capabilities**:
  - Google Maps tile layer
  - Custom event markers (EventMarker)
  - Marker color coding by severity
  - Event position spread across Guadalajara area
  - Click to open event dialog
  - Pan to selected event
  - Map toolbar: zoom, reset, recenter, fullscreen

##### 2.3 Event Marker Dialog
- **Location**: `EventMarker.tsx`
- **Data Displayed**:
  - Event icon (severity-based)
  - Event name
  - Creation timestamp
  - Severity badge
  - Optional: etiqueta, responsable

### 3. Routes (Rutas) Module

**Purpose**: Historical route tracking and analysis

#### Features

##### 3.1 Main Route View
- **Location**: `/` (home) → `MainView.tsx`
- **Capabilities**:
  - Monthly route calendar (September 2025)
  - Route list by day
  - Route visibility toggles
  - Multiple route overlay on map
  - Route color coding
  - Distance display per route
  - View modes: main, day, week, month

##### 3.2 Route Map Visualization
- **Location**: `MainMapView.tsx`
- **Capabilities**:
  - Polyline routes with directional arrows
  - Stop markers (red circles)
  - Travel segments (blue lines)
  - Route hover interactions
  - Segment selection
  - Auto-fit bounds for visible routes
  - Route segment details on hover

##### 3.3 Day View (Single Route Analysis)
- **Location**: `DayView.tsx` + `DaySidebar.tsx`
- **Capabilities**:
  - Detailed route breakdown
  - Stop segments with duration
  - Travel segments with distance
  - Time ranges for each segment
  - Location names
  - Segment highlighting on map
  - Segment selection for zoom

##### 3.4 Updated Sidebar with Tabs
- **Location**: `UpdatedMainSidebar.tsx`
- **Tabs**:
  - **Telemática**: Real-time vehicle data
  - **Unidad**: Vehicle information
  - **Eventos**: Event list with filters
  - **Historial**: 30-day route calendar
- **Historial Features**:
  - Calendar view of routes
  - Click day to open day view
  - Route visibility toggles
  - Route focus mode
  - Distance summary per day

### 4. Map Infrastructure

#### 4.1 Base Map Features
- Google Maps tiles (`lyrs=m`)
- OpenStreetMap attribution
- Dynamic imports (client-side only)
- Ref-based map instances
- Custom controls (no default zoom control)

#### 4.2 Map Toolbar (`MapToolbar.tsx`)
- **Zoom In/Out**: Incremental zoom controls
- **Reset View**: Return to default center/zoom
- **Recenter Route**: Fit all visible markers
- **Fullscreen Toggle**: Expand map to fullscreen

#### 4.3 Auto-Fit Bounds
- Multiple implementations:
  - `MapFitBounds.tsx`: Generic bounds fitting
  - `EventMapFitBounds.tsx`: Event-specific
  - `DynamicMapFitBounds.tsx`: Dynamic marker sets
- Configurable padding and maxZoom
- Initial delay for map initialization
- Animation support

#### 4.4 Marker System
- **EventMarker**: Event-specific with severity styling
- **UnidadMarker**: Vehicle-specific with estado styling
- **StopMarker**: Route stop points
- **ReporteMarker**: Report markers
- **UnifiedMarker**: Generic reusable marker
- All markers support:
  - Selection state
  - Custom icons
  - Popups with rich data
  - Click handlers

### 5. State Management

#### 5.1 Route Store (`routeStore.ts`)
- **State**:
  - `routes`: Array of RouteData
  - `selectedRoute`: Currently selected route
  - `selectedDate`: ISO date string
  - `focusedRouteId`: Focused route ID
  - `selectedMonth`: Current month view
  - `viewMode`: main | day | week | month
  - `isFullscreen`: Fullscreen state
  - `dayViewPrimaryTab`: Tab state for day view
- **Actions**:
  - `setRoutes`, `toggleRoute`, `selectRoute`
  - `setSelectedDate`, `setFocusedRoute`
  - `setViewMode`, `setSelectedMonth`
  - `toggleFullscreen`
  - `selectAllRoutes`, `deselectAllRoutes`
  - `updateRoute`, `setDayViewPrimaryTab`
- **Persistence**: Zustand persist middleware

#### 5.2 Map Store (`mapStore.ts`)
- Purpose: Map-specific state (if needed)

### 6. Layout & Navigation

#### 6.1 Top Navigation (`MainNavTopMenu.tsx`)
- Logo + branding
- Navigation items
- User menu (future)
- Responsive design

#### 6.2 Collapsible Sidebar (`CollapsibleMenu.tsx`)
- **Menu Items**:
  - Unidades (vehicle icon)
  - Eventos (alert icon)
- **States**:
  - Collapsed (48px width, icons only)
  - Expanded (240px width, labels visible)
- **Navigation**:
  - Client-side routing with Next.js router
  - Active state highlighting
  - Smooth transitions

### 7. Data Generation

#### 7.1 Route Generator (`lib/utils/routeGenerator.ts`)
- Generates 30 sample routes for September 2025
- Each route includes:
  - Unique ID and name
  - Random color
  - Coordinates array (Guadalajara area)
  - Stop markers with timestamps
  - Distance calculation
  - Visibility state

#### 7.2 Event Generator (in `EventosSidebar.tsx`)
- Generates 25 random events
- Event templates with severity
- Random positions in Guadalajara
- Timestamp generation
- Unique IDs

#### 7.3 Vehicle Generator (in `UnidadesSidebar.tsx`)
- Generates mock vehicles
- Estados: Activo, Inactivo, En Ruta, Detenido
- Random positions
- Optional etiquetas and responsables

### 8. UI/UX Features

#### 8.1 Filtering & Search
- Real-time search across all modules
- Multi-criteria filters (estado, severity, etiqueta, responsable)
- Date range pickers
- Filter combination support
- Reset filters functionality

#### 8.2 Sorting
- Sortable columns in all list views
- Sort by: name, estado, date, severity, distance
- Ascending/descending toggle

#### 8.3 Column Resizing
- Resizable columns in Unidades and Eventos
- localStorage persistence
- Visual resize handles
- Min/max width constraints

#### 8.4 Sidebar Resizing
- Drag-to-resize sidebars
- Min width: 450px, Max width: 800px
- localStorage persistence
- Visual resize indicator on hover

#### 8.5 Selection & Interaction
- Row click to select
- Selected row highlighting
- Map marker synchronization
- Deselect on background click
- Keyboard navigation support (future)

#### 8.6 Responsive Design
- Fixed layouts with calculated heights
- No overflow scrolling issues
- Proper z-index layering
- Smooth transitions and animations

### 9. Performance Optimizations

#### 9.1 Dynamic Imports
- All map components use `dynamic(() => import(...), { ssr: false })`
- Prevents SSR issues with Leaflet
- Reduces initial bundle size
- Lazy loading for better performance

#### 9.2 Memoization
- `useMemo` for expensive calculations
- `useCallback` for event handlers
- Prevents unnecessary re-renders

#### 9.3 Ref Management
- Map refs for direct DOM manipulation
- Avoids React re-renders for map interactions
- Efficient event handling

---

## Current Architecture Patterns

### Pattern Analysis

#### ✅ What Works Well

1. **Modular Component Structure**
   - Clear separation: Eventos, Unidades, Route, Map, Layout
   - Single responsibility per component
   - Reusable where possible

2. **Zustand State Management**
   - Simple API, easy to understand
   - Persist middleware for localStorage
   - Minimal boilerplate

3. **Type Safety**
   - TypeScript throughout
   - Centralized type definitions in `/types`
   - Interface-driven development

4. **Dynamic Imports**
   - Proper SSR handling for Leaflet
   - Code splitting

5. **Next.js App Router**
   - Modern routing with dynamic segments
   - React 19 `use()` hook for async params

#### ❌ Current Issues

1. **Data Coupling**
   - Each module generates its own mock data
   - No centralized data layer
   - Components tightly coupled to data structure

2. **Component Duplication**
   - Similar patterns across Eventos/Unidades/Routes
   - Duplicate View components (EventosView, UnidadesView)
   - Duplicate Sidebar components (EventosSidebar, UnidadesSidebar)
   - Duplicate MapView components

3. **Prop Drilling**
   - Deep prop chains in complex components
   - Event handlers passed through multiple levels
   - State lifted too high in some cases

4. **Inconsistent State Management**
   - Some state in Zustand, some in component state
   - No clear pattern for when to use which

5. **Mock Data in Components**
   - Data generation logic mixed with presentation
   - Hard to replace with real API calls
   - Testing difficulties

6. **Limited Reusability**
   - `UnidadMarker` vs `EventMarker` share 90% of code
   - Map views are similar but not reusable
   - Sidebar patterns repeated

7. **No Data Fetching Layer**
   - No API integration structure
   - No loading states architecture
   - No error handling patterns

8. **Type Definitions Incomplete**
   - Some types defined inline
   - Missing comprehensive domain models
   - No API response types

### Current Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Page Component (UnidadesPage, EventosPage, etc.)       │
│  - Renders *View component                              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ *View Component (EventosView, UnidadesView)             │
│  - Layout structure                                      │
│  - Local state: selectedId, filters, etc.               │
│  - Callbacks: onSelect, onFilter                        │
└──────────────┬─────────────────────────┬────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────────┐  ┌─────────────────────────┐
│ *Sidebar Component       │  │ *MapView Component      │
│  - Generates mock data   │  │  - Receives markers     │
│  - Manages filters       │  │  - Map interactions     │
│  - Renders list          │  │  - Marker selection     │
│  - Lifts state up        │  │  - Uses MapToolbar      │
└──────────────────────────┘  └─────────────────────────┘
```

**Problems**:
- Data generated in Sidebar, not at page level
- No single source of truth
- View component manages too much state
- Sidebar has both presentation and data logic

---

## Ideal Architecture Design

### Principles

1. **Separation of Concerns**: Data, business logic, presentation separated
2. **Single Responsibility**: Each component/hook/store has one clear purpose
3. **DRY (Don't Repeat Yourself)**: Maximum code reuse
4. **Type Safety**: Comprehensive TypeScript coverage
5. **Testability**: Easy to unit test each layer
6. **Scalability**: Easy to add new features
7. **Performance**: Optimized re-renders, lazy loading
8. **Maintainability**: Clear patterns, easy to understand

### Layered Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                       │
│  Pages → Views → Composable UI Components                    │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                     APPLICATION LAYER                         │
│  Custom Hooks → Business Logic → Zustand Stores              │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                       DATA LAYER                              │
│  API Services → Type Definitions → Data Transformers         │
└──────────────────────────────────────────────────────────────┘
```

### New Directory Structure

```
unidades-tracking-antd/
├── app/                                # Next.js App Router (unchanged)
│
├── components/                         # PRESENTATION LAYER
│   ├── ui/                             # Generic reusable UI components
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx           # Generic table with filters/sort
│   │   │   ├── DataTableHeader.tsx
│   │   │   ├── DataTableRow.tsx
│   │   │   ├── DataTableFilters.tsx
│   │   │   └── DataTableColumn.tsx
│   │   │
│   │   ├── MapView/
│   │   │   ├── BaseMapView.tsx         # Base map component
│   │   │   ├── MapToolbar.tsx
│   │   │   ├── MapMarker.tsx           # Generic marker
│   │   │   ├── MapPopup.tsx            # Generic popup
│   │   │   └── MapControls.tsx
│   │   │
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx             # Generic sidebar
│   │   │   ├── SidebarHeader.tsx
│   │   │   ├── SidebarContent.tsx
│   │   │   └── SidebarResizer.tsx
│   │   │
│   │   ├── Layout/
│   │   │   ├── PageLayout.tsx          # Standard page layout
│   │   │   ├── SplitView.tsx           # Sidebar + Content
│   │   │   └── TabbedView.tsx          # Tab interface
│   │   │
│   │   └── Badge/
│   │       ├── StatusBadge.tsx         # Generic status badge
│   │       └── SeverityBadge.tsx       # Severity indicator
│   │
│   ├── domain/                         # Domain-specific components
│   │   ├── vehicle/
│   │   │   ├── VehicleList.tsx         # Uses DataTable
│   │   │   ├── VehicleListRow.tsx
│   │   │   ├── VehicleMap.tsx          # Uses BaseMapView
│   │   │   ├── VehicleMarker.tsx       # Uses MapMarker
│   │   │   ├── VehicleDialog.tsx
│   │   │   ├── VehicleFilters.tsx
│   │   │   └── VehicleTelemetryPanel.tsx
│   │   │
│   │   ├── event/
│   │   │   ├── EventList.tsx           # Uses DataTable
│   │   │   ├── EventListRow.tsx
│   │   │   ├── EventMap.tsx            # Uses BaseMapView
│   │   │   ├── EventMarker.tsx         # Uses MapMarker
│   │   │   ├── EventDialog.tsx
│   │   │   └── EventFilters.tsx
│   │   │
│   │   └── route/
│   │       ├── RouteList.tsx           # Uses DataTable
│   │       ├── RouteMap.tsx            # Uses BaseMapView
│   │       ├── RoutePolyline.tsx
│   │       ├── RouteSegmentList.tsx
│   │       └── RouteCalendar.tsx
│   │
│   ├── features/                       # Feature-specific compositions
│   │   ├── VehicleMonitoring/
│   │   │   └── VehicleMonitoringView.tsx  # Composes VehicleList + VehicleMap
│   │   │
│   │   ├── EventMonitoring/
│   │   │   └── EventMonitoringView.tsx    # Composes EventList + EventMap
│   │   │
│   │   └── VehicleDetail/
│   │       ├── VehicleDetailView.tsx      # Tabbed view
│   │       ├── TelematicaTab.tsx
│   │       ├── UnidadTab.tsx
│   │       ├── EventosTab.tsx
│   │       └── HistorialTab.tsx
│   │
│   └── layout/                         # App-level layout components
│       ├── MainNavTopMenu.tsx
│       ├── CollapsibleMenu.tsx
│       └── NumarisLogo.tsx
│
├── hooks/                              # APPLICATION LAYER - Custom Hooks
│   ├── domain/                         # Domain-specific hooks
│   │   ├── useVehicle.ts               # Fetch single vehicle
│   │   ├── useVehicles.ts              # Fetch vehicle list
│   │   ├── useVehicleTelemetry.ts      # Real-time telemetry
│   │   ├── useVehicleEvents.ts         # Vehicle events
│   │   ├── useVehicleRoutes.ts         # Vehicle routes
│   │   ├── useEvents.ts                # Fetch events
│   │   └── useRoutes.ts                # Fetch routes
│   │
│   ├── ui/                             # UI-specific hooks
│   │   ├── useFilters.ts               # Generic filter hook
│   │   ├── useSort.ts                  # Generic sort hook
│   │   ├── useSelection.ts             # Selection management
│   │   ├── useTableResize.ts           # Column resizing
│   │   └── useSidebarResize.ts         # Sidebar resizing
│   │
│   └── map/                            # Map-specific hooks
│       ├── useMapInstance.ts           # Map initialization
│       ├── useMapBounds.ts             # Bounds management
│       ├── useMapMarkers.ts            # Marker management
│       └── useMapSelection.ts          # Map selection state
│
├── lib/                                # APPLICATION LAYER - Business Logic
│   ├── stores/                         # Zustand stores
│   │   ├── vehicleStore.ts             # Vehicle state
│   │   ├── eventStore.ts               # Event state
│   │   ├── routeStore.ts               # Route state (existing)
│   │   ├── mapStore.ts                 # Map state (existing)
│   │   └── uiStore.ts                  # UI state (filters, selection)
│   │
│   ├── api/                            # API client layer
│   │   ├── client.ts                   # Base fetch wrapper
│   │   ├── vehicles.ts                 # Vehicle API calls
│   │   ├── events.ts                   # Event API calls
│   │   ├── routes.ts                   # Route API calls
│   │   └── telemetry.ts                # Telemetry API calls
│   │
│   ├── utils/                          # Utility functions
│   │   ├── routeGenerator.ts           # Mock data (existing)
│   │   ├── dateUtils.ts                # Date formatting
│   │   ├── coordinateUtils.ts          # Geo calculations
│   │   └── colorUtils.ts               # Color generation
│   │
│   └── transformers/                   # Data transformers
│       ├── vehicleTransformer.ts       # API → App types
│       ├── eventTransformer.ts
│       └── routeTransformer.ts
│
├── types/                              # DATA LAYER - Type Definitions
│   ├── domain/                         # Domain models
│   │   ├── vehicle.ts                  # Vehicle types
│   │   ├── event.ts                    # Event types
│   │   ├── route.ts                    # Route types (existing)
│   │   └── telemetry.ts                # Telemetry types
│   │
│   ├── api/                            # API types
│   │   ├── requests.ts                 # Request types
│   │   ├── responses.ts                # Response types
│   │   └── errors.ts                   # Error types
│   │
│   └── ui/                             # UI types
│       ├── filters.ts                  # Filter types
│       ├── table.ts                    # Table types
│       └── map.ts                      # Map types
│
└── config/                             # Configuration
    ├── map.config.ts                   # Map settings
    ├── api.config.ts                   # API endpoints
    └── constants.ts                    # App constants
```

### Ideal Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Page Component (app/unidades/page.tsx)                      │
│  - Minimal logic                                             │
│  - Renders feature component                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Feature Component (VehicleMonitoringView)                   │
│  - Composition layer                                         │
│  - Uses domain hooks (useVehicles)                           │
│  - Distributes data to children                              │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────┐    ┌───────────────────────────┐
│ Domain Component        │    │ Domain Component          │
│ (VehicleList)           │    │ (VehicleMap)              │
│  - Uses UI components   │    │  - Uses UI components     │
│  - Domain-specific      │    │  - Domain-specific        │
│    rendering            │    │    rendering              │
└────────┬────────────────┘    └─────────┬─────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────────┐      ┌──────────────────────────┐
│ UI Component         │      │ UI Component             │
│ (DataTable)          │      │ (BaseMapView)            │
│  - Generic           │      │  - Generic               │
│  - Reusable          │      │  - Reusable              │
│  - No domain logic   │      │  - No domain logic       │
└──────────────────────┘      └──────────────────────────┘

DATA FLOW:
┌─────────────────────────────────────────────────────────────┐
│ useVehicles() Hook                                           │
│  ↓ Calls vehicleStore.loadVehicles()                        │
│  ↓ Store calls API: api/vehicles.getAll()                   │
│  ↓ API calls backend: /api/vehicles                          │
│  ↓ Response transforms: vehicleTransformer.toApp()          │
│  ↓ Store updates state                                       │
│  ↓ Hook returns vehicles                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Reusability Strategy

### Generic UI Components

#### 1. DataTable Component

**Purpose**: Reusable table for any data type with filters, sort, selection

**API**:
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  filters?: FilterDef[];
  onRowSelect?: (item: T) => void;
  selectedId?: string;
  idField: keyof T;
  searchable?: boolean;
  sortable?: boolean;
  resizable?: boolean;
}

// Usage:
<DataTable<Vehicle>
  data={vehicles}
  columns={[
    { key: 'icon', render: (v) => <VehicleIcon estado={v.estado} /> },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'estado', label: 'Estado', render: (v) => <StatusBadge estado={v.estado} /> }
  ]}
  filters={[
    { type: 'select', key: 'estado', options: ['Activo', 'Inactivo'] },
    { type: 'search', key: 'nombre' }
  ]}
  onRowSelect={handleSelect}
  selectedId={selectedId}
  idField="id"
/>
```

**Reuse Cases**:
- VehicleList (Unidades module)
- EventList (Eventos module)
- RouteList (Routes module)
- Any future list views

#### 2. BaseMapView Component

**Purpose**: Reusable map with markers, polylines, controls

**API**:
```typescript
interface BaseMapViewProps {
  center?: LatLngExpression;
  zoom?: number;
  markers?: MarkerConfig[];
  polylines?: PolylineConfig[];
  selectedMarkerId?: string;
  onMarkerClick?: (markerId: string) => void;
  toolbar?: boolean;
  onRecenter?: () => void;
  fitBounds?: boolean;
  children?: React.ReactNode; // For custom overlays
}

// Usage:
<BaseMapView
  center={center}
  zoom={15}
  markers={vehicles.map(v => ({
    id: v.id,
    position: v.position,
    icon: <VehicleIcon estado={v.estado} />,
    popup: <VehicleDialog vehicle={v} />
  }))}
  toolbar
  fitBounds
  onMarkerClick={handleVehicleSelect}
/>
```

**Reuse Cases**:
- VehicleMap (Unidades)
- EventMap (Eventos)
- RouteMap (Routes)
- TelematicaMap (Individual vehicle tracking)

#### 3. MapMarker Component

**Purpose**: Generic marker with custom icon and popup

**API**:
```typescript
interface MapMarkerProps {
  position: LatLngExpression;
  icon: React.ReactNode | string;
  popup?: React.ReactNode;
  isSelected?: boolean;
  color?: string;
  size?: number;
  onClick?: () => void;
}

// Usage:
<MapMarker
  position={vehicle.position}
  icon={<CarIcon />}
  popup={<VehicleDialog vehicle={vehicle} />}
  isSelected={selectedId === vehicle.id}
  color={getEstadoColor(vehicle.estado)}
  onClick={() => onSelect(vehicle.id)}
/>
```

**Reuse Cases**:
- VehicleMarker extends MapMarker
- EventMarker extends MapMarker
- StopMarker extends MapMarker

#### 4. Sidebar Component

**Purpose**: Generic sidebar with header, content, resizer

**API**:
```typescript
interface SidebarProps {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  header?: React.ReactNode;
  children: React.ReactNode;
  onWidthChange?: (width: number) => void;
}

// Usage:
<Sidebar
  width={450}
  resizable
  header={<SidebarHeader title="Unidades" actions={<FilterButton />} />}
>
  <VehicleList vehicles={vehicles} />
</Sidebar>
```

**Reuse Cases**:
- All sidebar implementations

#### 5. StatusBadge Component

**Purpose**: Generic badge for statuses

**API**:
```typescript
interface StatusBadgeProps {
  status: string;
  variant?: 'estado' | 'severity' | 'custom';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Usage:
<StatusBadge status="Activo" variant="estado" />
<StatusBadge status="Alta" variant="severity" />
```

**Reuse Cases**:
- Vehicle estado badges
- Event severity badges
- Any status indicators

### Domain Components

#### VehicleList

**Purpose**: Display vehicles using DataTable

**Responsibility**: Configure DataTable for vehicle data

```typescript
function VehicleList({ vehicles, onSelect }: VehicleListProps) {
  return (
    <DataTable<Vehicle>
      data={vehicles}
      columns={vehicleColumns}
      filters={vehicleFilters}
      onRowSelect={onSelect}
    />
  );
}
```

#### VehicleMap

**Purpose**: Display vehicles on map

**Responsibility**: Configure BaseMapView for vehicles

```typescript
function VehicleMap({ vehicles, selectedId, onSelect }: VehicleMapProps) {
  return (
    <BaseMapView
      markers={vehicles.map(v => ({
        id: v.id,
        position: v.position,
        icon: <VehicleIcon estado={v.estado} />,
        popup: <VehicleDialog vehicle={v} />
      }))}
      selectedMarkerId={selectedId}
      onMarkerClick={onSelect}
      toolbar
    />
  );
}
```

### Composition Strategy

**Feature Component** (VehicleMonitoringView):
```typescript
function VehicleMonitoringView() {
  // Data layer
  const { vehicles, loading } = useVehicles();
  const { filtered, setFilters } = useFilters(vehicles);

  // UI state
  const { selected, setSelected } = useSelection();

  return (
    <PageLayout
      sidebar={
        <Sidebar>
          <VehicleFilters onFiltersChange={setFilters} />
          <VehicleList
            vehicles={filtered}
            onSelect={setSelected}
            selectedId={selected}
          />
        </Sidebar>
      }
      content={
        <VehicleMap
          vehicles={filtered}
          selectedId={selected}
          onSelect={setSelected}
        />
      }
    />
  );
}
```

### Reusability Metrics

| Component | Current Reuse | Ideal Reuse | Improvement |
|-----------|---------------|-------------|-------------|
| DataTable | 0 (3 duplicates) | 3 modules + future | ∞ |
| BaseMapView | 0 (4 duplicates) | 4 maps + future | ∞ |
| MapMarker | 0 (3 types) | All markers | 3x |
| Sidebar | 0 (duplicated) | All sidebars | 3x |
| StatusBadge | 0 (inline) | All badges | ∞ |
| Filters | 0 (duplicated) | All lists | 3x |

**Total Code Reduction**: ~40% of component code can be eliminated

---

## Migration Plan

### Phase 1: Foundation (Week 1)

#### Objectives
- Set up new directory structure
- Create type definitions
- Build generic UI components
- No breaking changes to existing code

#### Tasks

##### 1.1 Type System
```bash
mkdir -p types/{domain,api,ui}
```

**Create** `types/domain/vehicle.ts`:
```typescript
export interface Vehicle {
  id: string;
  nombre: string;
  placa: string;
  marca: string;
  modelo: string;
  estado: VehicleEstado;
  position: [number, number];
  lastUpdate: string;
  etiqueta?: string;
  responsable?: string;
}

export type VehicleEstado = 'Activo' | 'Inactivo' | 'En Ruta' | 'Detenido';

export interface VehicleTelemetry {
  unidadId: string;
  timestamp: string;
  position: [number, number];
  velocidad: number;
  motor: 'Encendido' | 'Apagado';
  señal: number;
  bateria: number;
  odometro: number;
  direccion: number;
  address?: string;
}
```

**Create** `types/domain/event.ts`:
```typescript
export interface Event {
  id: string;
  unidadId: string;
  evento: string;
  fechaCreacion: string;
  severidad: EventSeverity;
  position: [number, number];
  descripcion?: string;
  etiqueta?: string;
  responsable?: string;
}

export type EventSeverity = 'Alta' | 'Media' | 'Baja' | 'Informativa';
```

**Create** `types/ui/table.ts`, `types/ui/filters.ts`, etc.

##### 1.2 Generic UI Components
```bash
mkdir -p components/ui/{DataTable,MapView,Sidebar,Layout,Badge}
```

**Create** `components/ui/DataTable/DataTable.tsx`
**Create** `components/ui/MapView/BaseMapView.tsx`
**Create** `components/ui/Sidebar/Sidebar.tsx`
**Create** `components/ui/Badge/StatusBadge.tsx`

##### 1.3 Configuration
```bash
mkdir config
```

**Create** `config/map.config.ts`:
```typescript
export const MAP_CONFIG = {
  defaultCenter: [20.659699, -103.349609] as [number, number],
  defaultZoom: 15,
  maxZoom: 18,
  minZoom: 10,
  tileLayer: {
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }
};
```

**Testing**: Test each generic component in isolation

---

### Phase 2: Stores & Hooks (Week 2)

#### Objectives
- Create Zustand stores for each domain
- Build custom hooks for data fetching
- Set up API client structure
- Still no breaking changes

#### Tasks

##### 2.1 Zustand Stores
**Create** `lib/stores/vehicleStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vehicle, VehicleTelemetry } from '@/types/domain/vehicle';

interface VehicleStore {
  // State
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  telemetry: Record<string, VehicleTelemetry>;
  loading: boolean;
  error: string | null;

  // Actions
  setVehicles: (vehicles: Vehicle[]) => void;
  loadVehicle: (id: string) => Promise<void>;
  loadVehicles: () => Promise<void>;
  updateTelemetry: (id: string, data: VehicleTelemetry) => void;
  clearVehicle: () => void;
}

export const useVehicleStore = create<VehicleStore>()(
  persist(
    (set, get) => ({
      vehicles: [],
      currentVehicle: null,
      telemetry: {},
      loading: false,
      error: null,

      setVehicles: (vehicles) => set({ vehicles }),

      loadVehicle: async (id) => {
        set({ loading: true });
        try {
          // TODO: Replace with API call
          const vehicle = get().vehicles.find(v => v.id === id);
          set({ currentVehicle: vehicle || null, loading: false });
        } catch (error) {
          set({ error: String(error), loading: false });
        }
      },

      loadVehicles: async () => {
        set({ loading: true });
        try {
          // TODO: Replace with API call
          // For now, keep using generator
          const { generateVehicles } = await import('@/lib/utils/vehicleGenerator');
          const vehicles = generateVehicles();
          set({ vehicles, loading: false });
        } catch (error) {
          set({ error: String(error), loading: false });
        }
      },

      updateTelemetry: (id, data) => {
        set(state => ({
          telemetry: { ...state.telemetry, [id]: data }
        }));
      },

      clearVehicle: () => set({ currentVehicle: null })
    }),
    { name: 'vehicle-storage' }
  )
);
```

**Create** `lib/stores/eventStore.ts` (similar pattern)

##### 2.2 Custom Hooks
**Create** `hooks/domain/useVehicles.ts`:
```typescript
import { useEffect } from 'react';
import { useVehicleStore } from '@/lib/stores/vehicleStore';

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

**Create** `hooks/domain/useVehicle.ts`:
```typescript
export function useVehicle(id: string) {
  const { currentVehicle, telemetry, loading, loadVehicle } = useVehicleStore();

  useEffect(() => {
    if (id) {
      loadVehicle(id);
    }
  }, [id]);

  return {
    vehicle: currentVehicle,
    telemetry: telemetry[id],
    loading
  };
}
```

**Create** `hooks/ui/useFilters.ts`:
```typescript
export function useFilters<T>(data: T[]) {
  const [filters, setFilters] = useState<FilterState>({});

  const filtered = useMemo(() => {
    return data.filter(item => {
      // Generic filter logic
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return item[key] === value;
      });
    });
  }, [data, filters]);

  return { filtered, filters, setFilters };
}
```

##### 2.3 API Client Structure
**Create** `lib/api/client.ts`:
```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

**Create** `lib/api/vehicles.ts`:
```typescript
import { apiClient } from './client';
import { Vehicle } from '@/types/domain/vehicle';

export const vehiclesAPI = {
  getAll: () => apiClient<Vehicle[]>('/vehicles'),
  getById: (id: string) => apiClient<Vehicle>(`/vehicles/${id}`),
  getTelemetry: (id: string) => apiClient(`/vehicles/${id}/telemetry`),
  // etc.
};
```

**Testing**: Test stores and hooks with mock data

---

### Phase 3: Domain Components (Week 3)

#### Objectives
- Build domain-specific components using UI components
- Migrate one module completely (Unidades)
- Run old and new versions in parallel

#### Tasks

##### 3.1 Vehicle Domain Components
```bash
mkdir -p components/domain/vehicle
```

**Create** `components/domain/vehicle/VehicleList.tsx`:
```typescript
import { DataTable } from '@/components/ui/DataTable';
import { Vehicle } from '@/types/domain/vehicle';
import { VehicleIcon } from './VehicleIcon';
import { StatusBadge } from '@/components/ui/Badge';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelect?: (vehicle: Vehicle) => void;
  selectedId?: string;
}

export function VehicleList({ vehicles, onSelect, selectedId }: VehicleListProps) {
  return (
    <DataTable<Vehicle>
      data={vehicles}
      columns={[
        {
          key: 'icon',
          width: 40,
          render: (v) => <VehicleIcon estado={v.estado} size={20} />
        },
        {
          key: 'nombre',
          label: 'Nombre',
          sortable: true,
          render: (v) => (
            <Link href={`/unidades/${v.id}`}>
              {v.nombre}
            </Link>
          )
        },
        {
          key: 'estado',
          label: 'Estado',
          width: 120,
          render: (v) => <StatusBadge status={v.estado} variant="estado" />
        },
        // ... more columns
      ]}
      onRowSelect={onSelect}
      selectedId={selectedId}
      idField="id"
      searchable
      sortable
      resizable
    />
  );
}
```

**Create** `components/domain/vehicle/VehicleMap.tsx`
**Create** `components/domain/vehicle/VehicleMarker.tsx`
**Create** `components/domain/vehicle/VehicleDialog.tsx`
**Create** `components/domain/vehicle/VehicleFilters.tsx`

##### 3.2 Feature Composition
**Create** `components/features/VehicleMonitoring/VehicleMonitoringView.tsx`:
```typescript
import { useVehicles } from '@/hooks/domain/useVehicles';
import { useFilters } from '@/hooks/ui/useFilters';
import { useSelection } from '@/hooks/ui/useSelection';
import { PageLayout } from '@/components/ui/Layout';
import { Sidebar } from '@/components/ui/Sidebar';
import { VehicleList } from '@/components/domain/vehicle/VehicleList';
import { VehicleMap } from '@/components/domain/vehicle/VehicleMap';
import { VehicleFilters } from '@/components/domain/vehicle/VehicleFilters';

export function VehicleMonitoringView() {
  const { vehicles, loading } = useVehicles();
  const { filtered, setFilters } = useFilters(vehicles);
  const { selected, setSelected } = useSelection<string>();

  if (loading) return <LoadingSpinner />;

  return (
    <PageLayout
      sidebar={
        <Sidebar
          width={450}
          resizable
          header={<h2>Unidades</h2>}
        >
          <VehicleFilters onFiltersChange={setFilters} />
          <VehicleList
            vehicles={filtered}
            onSelect={(v) => setSelected(v.id)}
            selectedId={selected}
          />
        </Sidebar>
      }
      content={
        <VehicleMap
          vehicles={filtered}
          selectedId={selected}
          onSelect={setSelected}
        />
      }
    />
  );
}
```

##### 3.3 Parallel Running
**Update** `app/unidades/page.tsx`:
```typescript
'use client';

import dynamic from 'next/dynamic';

// Feature flag to switch between old and new
const USE_NEW_ARCHITECTURE = process.env.NEXT_PUBLIC_NEW_ARCH === 'true';

const UnidadesView = dynamic(() =>
  USE_NEW_ARCHITECTURE
    ? import('@/components/features/VehicleMonitoring/VehicleMonitoringView')
    : import('@/components/Unidades/UnidadesView'),
  { ssr: false }
);

export default function UnidadesPage() {
  return <UnidadesView />;
}
```

**Testing**: Toggle feature flag, test both versions

---

### Phase 4: Complete Migration (Week 4)

#### Objectives
- Migrate Events module
- Migrate Routes module
- Migrate Vehicle Detail view
- Remove old components

#### Tasks

##### 4.1 Events Module
- Create `components/domain/event/*`
- Create `components/features/EventMonitoring/EventMonitoringView.tsx`
- Update `app/eventos/page.tsx`

##### 4.2 Routes Module
- Create `components/domain/route/*`
- Create `components/features/RouteAnalysis/*`
- Update `app/page.tsx`

##### 4.3 Vehicle Detail
- Create `components/features/VehicleDetail/VehicleDetailView.tsx`
- Create tab components (Telemática, Unidad, Eventos, Historial)
- Update `app/unidades/[unidadId]/page.tsx`

##### 4.4 Cleanup
- Remove `components/Unidades/` (old)
- Remove `components/Eventos/` (old)
- Remove duplicate map components
- Update imports across codebase

---

### Phase 5: API Integration (Week 5+)

#### Objectives
- Replace mock data with real API calls
- Implement error handling
- Add loading states
- WebSocket for real-time telemetry

#### Tasks

##### 5.1 Backend API Setup
```typescript
// lib/api/vehicles.ts
export const vehiclesAPI = {
  async getAll(): Promise<Vehicle[]> {
    // Remove mock generator, call real API
    return apiClient<Vehicle[]>('/vehicles');
  },

  async getById(id: string): Promise<Vehicle> {
    return apiClient<Vehicle>(`/vehicles/${id}`);
  },

  async getTelemetry(id: string): Promise<VehicleTelemetry> {
    return apiClient<VehicleTelemetry>(`/vehicles/${id}/telemetry`);
  }
};
```

##### 5.2 WebSocket Integration
**Create** `lib/websocket/telemetrySocket.ts`:
```typescript
export function useTelemetryStream(vehicleId: string) {
  const { updateTelemetry } = useVehicleStore();

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/vehicles/${vehicleId}/telemetry`);

    ws.onmessage = (event) => {
      const telemetry = JSON.parse(event.data);
      updateTelemetry(vehicleId, telemetry);
    };

    return () => ws.close();
  }, [vehicleId]);
}
```

##### 5.3 Error Handling
**Create** `components/ui/ErrorBoundary.tsx`
**Create** `components/ui/ErrorMessage.tsx`

##### 5.4 Loading States
**Create** `components/ui/LoadingSpinner.tsx`
**Create** `components/ui/Skeleton.tsx`

---

### Migration Checklist

#### Pre-Migration
- [ ] Document current features
- [ ] Set up feature flags
- [ ] Create test plan
- [ ] Backup current codebase

#### Phase 1 (Foundation)
- [ ] Create type definitions
- [ ] Build DataTable component
- [ ] Build BaseMapView component
- [ ] Build Sidebar component
- [ ] Build StatusBadge component
- [ ] Test UI components in isolation

#### Phase 2 (Stores & Hooks)
- [ ] Create vehicleStore
- [ ] Create eventStore
- [ ] Update routeStore
- [ ] Create useVehicles hook
- [ ] Create useEvents hook
- [ ] Create useFilters hook
- [ ] Create useSelection hook
- [ ] Set up API client structure
- [ ] Test stores and hooks

#### Phase 3 (Domain Components)
- [ ] Create Vehicle domain components
- [ ] Create VehicleMonitoringView
- [ ] Enable parallel running (feature flag)
- [ ] Test Unidades module (new version)
- [ ] QA comparison (old vs new)

#### Phase 4 (Complete Migration)
- [ ] Create Event domain components
- [ ] Create EventMonitoringView
- [ ] Test Eventos module
- [ ] Create Route domain components
- [ ] Create RouteAnalysisView
- [ ] Test Routes module
- [ ] Create VehicleDetail components
- [ ] Test Vehicle Detail view
- [ ] Remove old components
- [ ] Clean up imports
- [ ] Update documentation

#### Phase 5 (API Integration)
- [ ] Implement real API calls
- [ ] Replace mock data
- [ ] Add error handling
- [ ] Add loading states
- [ ] Implement WebSocket
- [ ] Test real-time telemetry
- [ ] Performance testing
- [ ] Security audit

#### Post-Migration
- [ ] Final QA testing
- [ ] Performance optimization
- [ ] Documentation update
- [ ] Team training
- [ ] Deploy to production

---

## Implementation Roadmap

### Timeline Overview

```
Week 1: Foundation
├─ Day 1-2: Type system
├─ Day 3-4: Generic UI components
└─ Day 5: Testing & documentation

Week 2: Stores & Hooks
├─ Day 1-2: Zustand stores
├─ Day 3-4: Custom hooks
└─ Day 5: API client setup

Week 3: Domain Components
├─ Day 1-2: Vehicle components
├─ Day 3: VehicleMonitoringView
└─ Day 4-5: Testing & QA

Week 4: Complete Migration
├─ Day 1-2: Events module
├─ Day 3: Routes module
└─ Day 4-5: Vehicle Detail & cleanup

Week 5+: API Integration
├─ Replace mock data
├─ WebSocket implementation
├─ Error handling
└─ Production deployment
```

### Team Structure

**Frontend Lead**: Architecture decisions, code review
**Component Developer 1**: Generic UI components
**Component Developer 2**: Domain components
**State Management Developer**: Zustand stores, hooks
**QA Engineer**: Testing, comparison, regression

### Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes | High | Feature flags, parallel running |
| Type errors | Medium | Incremental migration, strict TypeScript |
| Performance issues | Medium | Performance testing at each phase |
| Missing features | High | Comprehensive feature catalog, QA checklist |
| Data loss | High | Zustand persist, backup strategy |

---

## Best Practices Reference

### Component Design

#### ✅ DO

```typescript
// ✅ Generic, reusable component
function DataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <table>
      {data.map(item => (
        <tr key={item.id}>
          {columns.map(col => (
            <td>{col.render(item)}</td>
          ))}
        </tr>
      ))}
    </table>
  );
}

// ✅ Domain component uses generic component
function VehicleList({ vehicles }: VehicleListProps) {
  return (
    <DataTable<Vehicle>
      data={vehicles}
      columns={vehicleColumns}
    />
  );
}

// ✅ Composition in feature component
function VehicleMonitoringView() {
  const { vehicles } = useVehicles();
  return (
    <PageLayout
      sidebar={<VehicleList vehicles={vehicles} />}
      content={<VehicleMap vehicles={vehicles} />}
    />
  );
}
```

#### ❌ DON'T

```typescript
// ❌ Hardcoded, non-reusable
function VehicleTable() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    // Data fetching in component
    fetchVehicles().then(setVehicles);
  }, []);

  return (
    <table>
      {/* Hardcoded columns */}
      {vehicles.map(v => (
        <tr>
          <td>{v.nombre}</td>
          <td>{v.estado}</td>
        </tr>
      ))}
    </table>
  );
}
```

### State Management

#### ✅ DO

```typescript
// ✅ Zustand store for domain state
const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  loading: false,
  loadVehicles: async () => {
    set({ loading: true });
    const vehicles = await vehiclesAPI.getAll();
    set({ vehicles, loading: false });
  }
}));

// ✅ Custom hook for component
function useVehicles() {
  const { vehicles, loading, loadVehicles } = useVehicleStore();

  useEffect(() => {
    loadVehicles();
  }, []);

  return { vehicles, loading };
}

// ✅ Component uses hook
function VehicleList() {
  const { vehicles, loading } = useVehicles();
  return loading ? <Spinner /> : <List data={vehicles} />;
}
```

#### ❌ DON'T

```typescript
// ❌ Component state for domain data
function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/vehicles')
      .then(res => res.json())
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  return loading ? <Spinner /> : <List data={vehicles} />;
}
```

### Data Flow

#### ✅ DO

```typescript
// ✅ Clear unidirectional flow
Page → Feature → Domain → UI

// Page (minimal)
export default function UnidadesPage() {
  return <VehicleMonitoringView />;
}

// Feature (composition + data)
function VehicleMonitoringView() {
  const { vehicles } = useVehicles(); // Data layer
  const { filtered } = useFilters(vehicles); // Business logic
  const [selected, setSelected] = useState(null); // UI state

  return (
    <Layout>
      <VehicleList vehicles={filtered} onSelect={setSelected} />
      <VehicleMap vehicles={filtered} selectedId={selected} />
    </Layout>
  );
}

// Domain (configuration)
function VehicleList({ vehicles, onSelect }) {
  return <DataTable data={vehicles} columns={columns} onRowClick={onSelect} />;
}

// UI (generic)
function DataTable({ data, columns, onRowClick }) {
  return <table>...</table>;
}
```

#### ❌ DON'T

```typescript
// ❌ Mixed concerns
function VehicleList() {
  // Data fetching in presentation component
  const [vehicles, setVehicles] = useState([]);
  useEffect(() => {
    fetchVehicles().then(setVehicles);
  }, []);

  // Business logic in presentation
  const filtered = vehicles.filter(v => v.estado === 'Activo');

  // UI state mixed with domain state
  const [selectedId, setSelectedId] = useState(null);

  // Hardcoded rendering
  return (
    <div>
      {filtered.map(v => <VehicleRow vehicle={v} />)}
    </div>
  );
}
```

### Type Safety

#### ✅ DO

```typescript
// ✅ Centralized types
// types/domain/vehicle.ts
export interface Vehicle {
  id: string;
  nombre: string;
  estado: VehicleEstado;
}

export type VehicleEstado = 'Activo' | 'Inactivo';

// ✅ Generic with type parameter
function DataTable<T extends { id: string }>({ data }: { data: T[] }) {
  return <table>...</table>;
}

// ✅ Strict component props
interface VehicleListProps {
  vehicles: Vehicle[];
  onSelect: (vehicle: Vehicle) => void;
  selectedId?: string;
}
```

#### ❌ DON'T

```typescript
// ❌ Inline types
function VehicleList({ vehicles }: { vehicles: any[] }) {
  return <div>...</div>;
}

// ❌ Missing types
function VehicleList({ vehicles, onSelect }) {
  return <div>...</div>;
}

// ❌ Type assertions everywhere
const vehicle = data as Vehicle;
```

---

## Conclusion

This architecture document provides:

1. **Complete feature catalog**: Every capability documented
2. **Current architecture analysis**: What works, what doesn't
3. **Ideal architecture design**: Best practices, layered approach
4. **Reusability strategy**: Generic → Domain → Feature composition
5. **Migration plan**: 5-phase approach with minimal risk
6. **Implementation roadmap**: Week-by-week timeline
7. **Best practices**: Do's and Don'ts for consistency

### Key Takeaways

- **Separation of concerns**: Data → Logic → Presentation
- **Component reusability**: Generic UI → Domain → Feature
- **Type safety**: Comprehensive TypeScript
- **State management**: Zustand for domain, hooks for UI
- **Incremental migration**: Feature flags, parallel running
- **Testing at each phase**: No big-bang deployment

### Next Steps

1. Review and approve architecture
2. Set up project board with tasks
3. Assign team members
4. Begin Phase 1 (Foundation)
5. Weekly reviews and adjustments

---

**Document Version**: 1.1.0
**Last Updated**: January 2025
**Maintained By**: Development Team
**Review Cycle**: Monthly

---

## Latest Implementations & Patterns

### Recent Enhancements (v1.1)

This section documents the latest implementations and best practices learned from recent development work.

#### 1. Skeleton Loading Transitions

**Pattern**: Tab switching with perceived performance improvements

**Implementation** (UpdatedMainSidebar.tsx:88-103):
```typescript
// State for loading transitions
const [isTabLoading, setIsTabLoading] = useState(false);

// Tab change handler with 300ms delay
const handleTabChange = (tab: string) => {
  setIsTabLoading(true);
  setActiveTab(tab);
  setTimeout(() => {
    setIsTabLoading(false);
  }, 300); // Optimal delay for smooth transition
};

// Conditional rendering pattern
{activeTab === 'telematica' && (
  <div>
    {isTabLoading ? (
      <div style={{ padding: '24px' }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    ) : (
      <>
        {/* Actual content */}
      </>
    )}
  </div>
)}
```

**Best Practices**:
- ✅ Use 300ms delay for optimal user experience (not too fast, not too slow)
- ✅ Adjust skeleton rows based on content complexity:
  - Telemática: 12 rows (dense data)
  - Unidad: 8 rows (medium data)
  - Eventos: 10 rows (table data)
  - Historial: 15 rows (calendar + list)
- ✅ Always wrap skeleton in padding for visual consistency
- ✅ Use Ant Design `Skeleton` component with `active` prop for animation
- ❌ Don't use skeleton for instant loads (<100ms)
- ❌ Don't forget to reset loading state in setTimeout

**User Impact**: Improves perceived performance during tab switching, reduces jarring content shifts

---

#### 2. Vehicle Marker Labels

**Pattern**: Multi-element Leaflet markers with proper anchor positioning

**Implementation** (UnidadMarker.tsx:147-199):
```typescript
const size = isSelected ? 40 : 32;
const iconHtml = `
  <div style="display: flex; flex-direction: column; align-items: center;">
    <!-- Marker Circle -->
    <div class="unidad-marker-icon" style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${estadoStyle.text};
      border: ${isSelected ? '4px' : '3px'} solid ${isSelected ? '#1867ff' : 'white'};
      /* ... more styles ... */
    ">
      <svg>...</svg>
    </div>

    <!-- Vehicle Name Label (NEW) -->
    <div style="
      margin-top: 4px;
      padding: 4px 10px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      white-space: nowrap;
      font-family: 'Source Sans 3', sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      border: 1px solid #e5e7eb;
    ">
      ${nombre}
    </div>
  </div>
`;

// CRITICAL: Adjust icon dimensions for multi-element marker
const totalHeight = size + 24; // marker + label height
const customIcon = L.divIcon({
  html: iconHtml,
  className: 'custom-unidad-marker',
  iconSize: [size + 40, totalHeight], // Extra width for label text
  iconAnchor: [size / 2 + 20, size / 2], // Anchor at marker circle center, NOT label
});
```

**Critical Learning Points**:
- ✅ `iconSize`: Must account for BOTH marker and label dimensions
  - Width: `size + 40` (extra space for variable label text width)
  - Height: `size + 24` (marker height + label height with margin)
- ✅ `iconAnchor`: Position at marker circle center, NOT at label
  - X: `size / 2 + 20` (half of marker + half of extra width)
  - Y: `size / 2` (half of marker height, ignoring label)
- ✅ Use flexbox column layout to stack marker and label
- ✅ Capsule label styling:
  - `border-radius: 12px` for pill shape
  - `white-space: nowrap` to prevent wrapping
  - `font-size: 11px` for readability without overwhelming
  - Subtle shadow for depth: `0 2px 8px rgba(0,0,0,0.15)`
- ❌ Don't anchor at bottom (will offset marker position on map)
- ❌ Don't use fixed width for label (vehicle names vary)

**User Impact**: Improves marker identification without clicking, better UX for fleet monitoring

---

#### 3. Dynamic Telemetry Data Generation

**Pattern**: Seed-based deterministic random data generation

**Implementation** (UpdatedMainSidebar.tsx:158-228):
```typescript
const getTelematicsData = (id: string | undefined) => {
  if (!id) return null;

  // Extract seed from ID
  const match = id.match(/unidad-(\d+)/);
  const seed = match ? parseInt(match[1]) : 0;

  // Seed-based random values (deterministic)
  const speed = Math.floor((seed * 7) % 121); // 0-120 km/h
  const temp = 20 + Math.floor((seed * 3) % 61); // 20-80°C
  const lat = 20.659699 + ((seed * 0.1) % 1 - 0.5) * 0.1;
  const lng = -103.349609 + ((seed * 0.2) % 1 - 0.5) * 0.1;

  // Generate consistent timestamps
  const now = dayjs();
  const minutesAgo = (seed * 13) % 60;
  const timeAgo = now.subtract(minutesAgo, 'minute');

  return {
    posicion: {
      time: timeAgo.format('DD/MM/YYYY HH:mm:ss'),
      ago: minutesAgo < 1 ? 'Hace menos de 1 minuto' :
           minutesAgo === 1 ? 'Hace 1 minuto' :
           `Hace ${minutesAgo} minutos`
    },
    ubicacion: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
    velocidad: `${speed} km/h`,
    temperatura: `${temp}°C`,
    // ... more fields
  };
};
```

**Best Practices**:
- ✅ Use seed-based generation for consistency (same ID = same data)
- ✅ Extract numeric seed from string IDs with regex
- ✅ Use modulo operator for bounded random values
- ✅ Multiply seed by prime numbers (7, 13, 17) for better distribution
- ✅ Add base values to keep data realistic (20°C base temp, not 0°C)
- ✅ Format data for display immediately (don't store raw numbers)
- ✅ Handle edge cases (0 minutes ago, 1 minute vs minutes)
- ❌ Don't use `Math.random()` - not deterministic across re-renders
- ❌ Don't forget null checks for optional IDs
- ❌ Don't mix raw and formatted data in the same object

**User Impact**: Provides realistic, consistent telemetry data for testing and development

---

#### 4. Vehicle Name Generation Algorithm

**Pattern**: Deterministic name generation from numeric IDs

**Implementation** (UpdatedMainSidebar.tsx:130-145):
```typescript
const getVehicleName = (id: string | undefined): string => {
  if (!id) return 'Rutas - Septiembre 2025';

  // Extract number from "unidad-11" format
  const match = id.match(/unidad-(\d+)/);
  if (!match) return id;

  const num = parseInt(match[1]);

  // Generate 3-letter code from number
  const char1 = String.fromCharCode(65 + num); // A-Z based on num
  const char2 = String.fromCharCode(65 + ((num + 3) % 26)); // Offset by 3
  const char3 = String.fromCharCode(65 + ((num + 7) % 26)); // Offset by 7

  // Format: "Unidad ABC11" (3 letters + 2 digit number)
  return `Unidad ${char1}${char2}${char3}${num.toString().padStart(2, '0')}`;
};

// Examples:
// unidad-0  → "Unidad ADH00"
// unidad-11 → "Unidad LRM11"
// unidad-25 → "Unidad ZCF25"
```

**Best Practices**:
- ✅ Use character codes (65 = 'A') for letter generation
- ✅ Add different offsets (3, 7) to create varied letter combinations
- ✅ Use modulo 26 to wrap around alphabet
- ✅ Pad numbers with leading zeros for consistent length
- ✅ Provide fallback for invalid IDs
- ✅ Make it deterministic (same input = same output)
- ❌ Don't use random letters - breaks consistency
- ❌ Don't forget to handle undefined/null IDs

**User Impact**: Creates realistic, memorable vehicle names that are consistent across the app

---

#### 5. Leaflet Map Best Practices & Gotchas

**Critical Issues Encountered & Solutions**:

##### Issue 1: Padding Type Error
```typescript
// ❌ WRONG - 4-element array not supported
map.fitBounds(bounds, {
  padding: [80, 80, 80, 450] // CSS-style padding
});

// ✅ CORRECT - Use paddingTopLeft and paddingBottomRight
map.fitBounds(bounds, {
  paddingTopLeft: [80, 80],
  paddingBottomRight: hasDialog ? [450, 80] : [80, 80],
  maxZoom: 15,
  animate: false
});
```

**Lesson**: Leaflet's `fitBounds` only accepts 2-element Point arrays, not CSS-style 4-element arrays. Use separate `paddingTopLeft` and `paddingBottomRight` for asymmetric padding.

##### Issue 2: Marker Border Color for Visibility
```typescript
// ❌ PROBLEM - White border hard to see on light map backgrounds
border: ${isSelected ? '4px' : '3px'} solid white;

// ✅ SOLUTION - Use brand color for better contrast
border: ${isSelected ? '4px' : '3px'} solid ${isSelected ? '#1867ff' : 'white'};
```

**Lesson**: Selected markers need high-contrast borders to stand out against map tiles (roads, streets). Blue (#1867ff) provides better visibility than white on Google Maps.

##### Issue 3: Popup Auto-Pan with Custom Padding
```typescript
// Built-in autoPan doesn't account for popup height properly
useEffect(() => {
  if (isSelected && markerRef.current) {
    setTimeout(() => {
      markerRef.current.openPopup();

      // Custom pan calculation after popup renders
      setTimeout(() => {
        const marker = markerRef.current;
        const map = marker._map;
        const popup = marker.getPopup();

        if (popup && popup.isOpen()) {
          const popupLatLng = popup.getLatLng();
          const containerSize = map.getSize();
          const padding = 150;
          const popupHeight = 285; // Known popup height
          const pixelPoint = map.latLngToContainerPoint(popupLatLng);

          // Calculate if pan is needed
          let needsPan = false;
          const panOffset = [0, 0];

          // Check all edges
          if (pixelPoint.y < padding + popupHeight) {
            panOffset[1] = pixelPoint.y - (padding + popupHeight);
            needsPan = true;
          }
          if (pixelPoint.x < padding) {
            panOffset[0] = pixelPoint.x - padding;
            needsPan = true;
          }
          if (pixelPoint.x > containerSize.x - padding) {
            panOffset[0] = pixelPoint.x - (containerSize.x - padding);
            needsPan = true;
          }

          if (needsPan) {
            map.panBy(panOffset, { animate: true, duration: 0.3 });
          }
        }
      }, 100); // Wait for popup to render
    }, 100); // Wait for marker selection
  }
}, [isSelected]);
```

**Lesson**: Leaflet's built-in `autoPan` doesn't always work well with large popups. Implement custom pan logic with:
- Double setTimeout pattern (marker selection → popup render)
- Manual edge detection using `latLngToContainerPoint`
- Account for actual popup height
- Use `panBy` instead of `panTo` for smooth offset panning

##### Issue 4: Event Coordinate Validation
```typescript
// generateEvent.ts - Ensure coordinates stay within valid bounds
const baseLatitude = 20.659699;  // Guadalajara center
const baseLongitude = -103.349609;

// CRITICAL: Constrain offset to prevent markers appearing in ocean
const latOffset = ((seed * 0.1) % 1 - 0.5) * 0.1; // ±0.05 degrees
const lngOffset = ((seed * 0.2) % 1 - 0.5) * 0.1; // ±0.05 degrees

const position: [number, number] = [
  baseLatitude + latOffset,
  baseLongitude + lngOffset
];
```

**Lesson**: Always validate that generated coordinates are within expected geographic bounds. Use small offsets (0.1 degrees ≈ 11km) to keep markers in the same city.

---

#### 6. UI/UX Enhancement Patterns

##### Pattern 1: Fullscreen API with State Management
```typescript
const [isFullscreen, setIsFullscreen] = useState(false);

const handleToggleFullscreen = () => {
  const element = document.documentElement;

  if (!isFullscreen) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  setIsFullscreen(!isFullscreen);
};

// Optional: Listen for fullscreen changes (user pressing ESC)
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, []);
```

**Best Practices**:
- ✅ Use `document.documentElement` for full page fullscreen
- ✅ Check for browser support with conditional
- ✅ Track state for UI updates (button icon changes)
- ✅ Listen for `fullscreenchange` to sync state when user exits with ESC
- ❌ Don't forget to clean up event listeners
- ❌ Don't request fullscreen on specific element (use document)

##### Pattern 2: Browser History Navigation
```typescript
// ❌ AVOID - Hardcoded routes break dynamic navigation
<button onClick={() => router.push('/unidades')}>
  Back
</button>

// ✅ PREFER - Use browser history for correct back button behavior
import { useRouter } from 'next/navigation';

const router = useRouter();

<button onClick={() => router.back()}>
  Back
</button>
```

**Lesson**: Use `router.back()` instead of hardcoded routes for back buttons. This respects the user's actual navigation history (they might have come from different pages).

##### Pattern 3: Clickable Link Styling
```typescript
// Best practice for clickable text/links within data displays
<span
  onClick={() => router.push(`/unidades/${vehicleName}`)}
  onMouseEnter={(e) => e.currentTarget.style.color = '#0047cc'}
  onMouseLeave={(e) => e.currentTarget.style.color = '#1867ff'}
  style={{
    fontSize: '15px',
    fontWeight: 400,
    color: '#1867ff',
    cursor: 'pointer',
    transition: 'color 0.2s',
  }}
>
  {vehicleName}
</span>
```

**Best Practices**:
- ✅ Base color: `#1867ff` (brand blue)
- ✅ Hover color: `#0047cc` (darker blue for feedback)
- ✅ Always include `cursor: 'pointer'`
- ✅ Add smooth transition for professional feel
- ✅ Use onClick for navigation, not href (for better SPA experience)

---

#### 7. TypeScript Type Assertion Patterns

**Problem**: Converting custom objects to React types

```typescript
// ❌ WRONG - Direct assertion fails type checking
return {
  type: 'svg',
  width: 16,
  // ...
} as React.ReactElement; // ERROR: Cannot convert

// ✅ CORRECT - Double assertion pattern
return {
  type: 'svg',
  width: 16,
  // ...
} as unknown as React.ReactElement; // Works
```

**Lesson**: Use double type assertion (`as unknown as TargetType`) when converting incompatible types. The intermediate `unknown` type acts as a safe escape hatch for complex type conversions.

**When to Use**:
- Converting API data to component types
- Converting icon data objects to React elements
- Working with complex generics that TypeScript can't infer

**When NOT to Use**:
- When proper type definitions exist
- When data can be properly transformed
- For simple type conversions

---

#### 8. Global CSS for Dynamic Content

**Pattern**: Styling dynamically created Leaflet popups

```css
/* globals.css - Popup close button enhancement */
.event-popup .leaflet-popup-close-button,
.unidad-popup .leaflet-popup-close-button,
.reporte-popup .leaflet-popup-close-button,
.stop-dialog-popup .leaflet-popup-close-button {
  width: 32px !important;
  height: 32px !important;
  font-size: 24px !important;
  line-height: 32px !important;
  right: 8px !important;
  top: 8px !important;
  color: #8c8c8c !important;
  padding: 0 !important;
}

.event-popup .leaflet-popup-close-button:hover,
/* ... other selectors ... */ {
  color: #1867ff !important;
  background-color: #f0f0f0 !important;
}
```

**Best Practices**:
- ✅ Use `!important` for Leaflet overrides (they use inline styles)
- ✅ Define styles for all popup types in one place
- ✅ Make close buttons larger (32px) for better touch targets
- ✅ Add hover states for better UX
- ✅ Use consistent spacing (8px inset from corner)
- ❌ Don't try to style Leaflet components with inline styles in components
- ❌ Don't forget to apply className to Popup component

---

#### 9. Performance: Skeleton Row Calculation

**Pattern**: Match skeleton loading to actual content complexity

```typescript
// Light content (8 rows)
{activeTab === 'unidad' && (
  isTabLoading ? (
    <Skeleton active paragraph={{ rows: 8 }} />
  ) : (
    <VehicleDetails /> // ~8 data fields
  )
)}

// Medium content (10 rows)
{activeTab === 'eventos' && (
  isTabLoading ? (
    <Skeleton active paragraph={{ rows: 10 }} />
  ) : (
    <EventsTable /> // ~10 row table
  )
)}

// Dense content (12 rows)
{activeTab === 'telematica' && (
  isTabLoading ? (
    <Skeleton active paragraph={{ rows: 12 }} />
  ) : (
    <TelemetryPanel /> // 12+ data points in grid
  )
)}

// Very dense content (15 rows)
{activeTab === 'historial' && (
  isTabLoading ? (
    <Skeleton active paragraph={{ rows: 15 }} />
  ) : (
    <RouteCalendar /> // 30-day calendar + route list
  )
)}
```

**Best Practices**:
- ✅ Count actual data rows/fields in real content
- ✅ Add 1-2 extra skeleton rows for spacing/headers
- ✅ Use more rows for dense content (calendars, large tables)
- ✅ Use fewer rows for simple forms
- ✅ Test visually - skeleton should roughly match content height
- ❌ Don't use same skeleton rows for all tabs
- ❌ Don't use too few rows (looks like content hasn't loaded)

**User Impact**: Skeleton that matches content height reduces layout shift and improves perceived loading performance.

---

### Migration Learnings

#### What Works in Current Codebase

1. **Seed-based Data Generation**: Deterministic random data is perfect for development
   - Easy to debug (same ID = same data)
   - No database needed for prototyping
   - Realistic data for demos

2. **Dynamic Imports for Maps**: Using `dynamic(() => import(...), { ssr: false })` prevents SSR issues with Leaflet

3. **Inline Styling with TypeScript**: Type-safe styles in components without CSS modules overhead

4. **Zustand Persist**: LocalStorage persistence works well for UI state (filters, selected routes, etc.)

5. **Multi-element Markers**: Complex marker designs possible with divIcon + HTML

#### What to Change in Migration

1. **Separate Data from Components**: Move all `generate*` functions to dedicated `/lib/generators/` or replace with API calls

2. **Extract Marker Components**: Create `<VehicleMarker>`, `<EventMarker>` as separate components, not inline HTML strings

3. **Centralize Styling**: Move repeated inline styles to Tailwind classes or CSS modules

4. **Type Definitions**: Move all inline interfaces to `/types/domain/`

5. **Configuration**: Extract magic numbers (delays, sizes, colors) to `config/` files

---

## Appendix: Quick Reference

### Component Hierarchy

```
Generic UI Components (components/ui/)
  ↓ Used by
Domain Components (components/domain/)
  ↓ Composed into
Feature Components (components/features/)
  ↓ Rendered by
Page Components (app/)
```

### Data Flow

```
API (lib/api/)
  ↓ Called by
Stores (lib/stores/)
  ↓ Consumed by
Hooks (hooks/)
  ↓ Used in
Feature Components
  ↓ Display via
Domain & UI Components
```

### File Naming Conventions

- **Components**: PascalCase (`VehicleList.tsx`)
- **Hooks**: camelCase with `use` prefix (`useVehicles.ts`)
- **Stores**: camelCase with `Store` suffix (`vehicleStore.ts`)
- **Types**: PascalCase (`Vehicle`, `VehicleEstado`)
- **Utils**: camelCase (`dateUtils.ts`)
- **Config**: camelCase with `.config` (`map.config.ts`)

### Import Order

```typescript
// 1. External libraries
import { useState, useEffect } from 'react';
import { Layout } from 'antd';

// 2. Internal modules
import { useVehicles } from '@/hooks/domain/useVehicles';
import { VehicleList } from '@/components/domain/vehicle/VehicleList';

// 3. Types
import type { Vehicle } from '@/types/domain/vehicle';

// 4. Styles
import styles from './VehicleView.module.css';
```

### Testing Strategy

- **Unit Tests**: UI components, hooks, stores
- **Integration Tests**: Feature components
- **E2E Tests**: Full user flows
- **Visual Regression**: Storybook + Chromatic

### Performance Checklist

- [ ] Use `dynamic()` for map components
- [ ] Memoize expensive calculations
- [ ] Use `useCallback` for event handlers
- [ ] Implement virtualization for large lists
- [ ] Lazy load tabs and modals
- [ ] Optimize bundle size
- [ ] Monitor render performance

---

**END OF DOCUMENT**