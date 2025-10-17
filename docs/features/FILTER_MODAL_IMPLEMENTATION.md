# Event Filter Modal Implementation Plan

## Overview
This document tracks the implementation progress of the new event filter modal design. The new filter modal replaces the existing Popover-based filters with a modern, full-screen modal design that provides a better user experience.

**Status:** 🟡 In Progress
**Created:** 2025-10-10
**Last Updated:** 2025-10-10

---

## Table of Contents
1. [Background](#background)
2. [Design Changes](#design-changes)
3. [Implementation Status](#implementation-status)
4. [Technical Details](#technical-details)
5. [Integration Steps](#integration-steps)
6. [Filter Logic Conversion](#filter-logic-conversion)
7. [Testing Checklist](#testing-checklist)
8. [Code References](#code-references)

---

## Background

### Previous Implementation
- Filter UI: Popover component with dropdowns
- Estado filter: Multi-select dropdown with 3 states (`abierto`, `en_progreso`, `cerrado`)
- Severidad filter: Multi-select dropdown
- Other filters: Responsable, Etiquetas dropdowns
- Location: Used in both `EventosTab.tsx` (vehicle detail) and `EventosSidebar.tsx` (main view)

### User Requirements
The new filter modal should:
1. Work in **vehicle detail Eventos tab** and **Historial subtab Eventos**
2. Work in **main Eventos view** with an additional Unidades filter
3. Use toggle buttons for Abiertos/Cerrados instead of dropdown
4. Use pill buttons for Severidad selection
5. Keep dropdown selects for Asignado, Etiquetas, and Unidades
6. Include a "Limpiar" button to reset all filters

---

## Design Changes

### Visual Changes
| Old Design | New Design |
|------------|------------|
| Popover with dropdowns | Full-screen modal (800px wide, 90vh max height) |
| Estado: Multi-select dropdown | Toggle buttons: Abiertos / Cerrados |
| Severidad: Multi-select dropdown | Pill buttons with severity colors |
| Small popover window | Scrollable modal with sections |

### Filter State Changes
| Filter | Old Type | New Type | Notes |
|--------|----------|----------|-------|
| Estado | `OperationalStatus[]` | `'abiertos' \| 'cerrados'` | Simplified to binary toggle |
| Severidad | `EventSeverity[]` | `EventSeverity[]` | Same, but UI changed to pills |
| Responsables | `string[]` | `string[]` | No change |
| Etiquetas | `string[]` | `string[]` | No change |
| Unidades | N/A (only in main view) | `string[]` | Only shown when `showUnidadesFilter={true}` |

---

## Implementation Status

### ✅ Completed Tasks

#### 1. EventFilterModal Component Created
- **File:** `components/Events/EventFilterModal.tsx`
- **Lines:** 1-343
- **Status:** ✅ Complete
- **Features Implemented:**
  - Toggle buttons for Abiertos/Cerrados (lines 143-186)
  - Severity pill buttons with dynamic colors (lines 188-226)
  - Asignado dropdown (lines 228-251)
  - Etiquetas dropdown (lines 253-276)
  - Unidades dropdown (conditional, lines 278-303)
  - Limpiar button (lines 305-335)
  - Local state management with apply-on-close pattern

**Component Interface:**
```typescript
interface EventFilterModalProps {
  open: boolean;
  onClose: () => void;
  // Filter state
  selectedEstado: 'abiertos' | 'cerrados';
  onEstadoChange: (estado: 'abiertos' | 'cerrados') => void;
  selectedSeveridades: EventSeverity[];
  onSeveridadesChange: (severidades: EventSeverity[]) => void;
  selectedResponsables: string[];
  onResponsablesChange: (responsables: string[]) => void;
  selectedEtiquetas: string[];
  onEtiquetasChange: (etiquetas: string[]) => void;
  selectedUnidades?: string[];
  onUnidadesChange?: (unidades: string[]) => void;
  // Available options
  availableResponsables: string[];
  availableEtiquetas: string[];
  availableUnidades?: string[];
  // Config
  showUnidadesFilter?: boolean;
}
```

### 🔄 In Progress Tasks

#### 2. Update EventosTab.tsx (Vehicle Detail View)
- **File:** `components/Route/EventosTab.tsx`
- **Status:** 🔄 Pending Integration
- **Sections to Modify:**
  - Lines 252-256: Filter state declarations
  - Lines 707-858: Replace Popover with EventFilterModal
  - Lines 280-348: Update filter logic to work with Abiertos/Cerrados toggle

#### 3. Update EventosSidebar.tsx (Main Eventos View)
- **File:** `components/Eventos/EventosSidebar.tsx`
- **Status:** 🔄 Pending Integration
- **Additional Requirements:**
  - Include Unidades filter section (`showUnidadesFilter={true}`)
  - Pass `availableUnidades` and `selectedUnidades` props
  - Similar integration pattern as EventosTab

### ⏳ Pending Tasks

#### 4. Testing
- **Status:** ⏳ Not Started
- See [Testing Checklist](#testing-checklist) below

---

## Technical Details

### Filter Logic Conversion Strategy

The main challenge is converting between the old three-state filter system and the new two-state toggle:

**Old System (Three States):**
```typescript
// Old filter state
const [selectedEstados, setSelectedEstados] = useState<OperationalStatus[]>([
  'abierto',
  'en_progreso',
  'cerrado'
]);

// Old filter logic
const filteredEvents = allEvents.filter(event =>
  selectedEstados.includes(event.operationalStatus)
);
```

**New System (Two States):**
```typescript
// New filter state
const [selectedEstado, setSelectedEstado] = useState<'abiertos' | 'cerrados'>('abiertos');

// New filter logic (RECOMMENDED APPROACH)
const filteredEvents = allEvents.filter(event => {
  if (selectedEstado === 'abiertos') {
    return event.operationalStatus === 'abierto' || event.operationalStatus === 'en_progreso';
  } else {
    return event.operationalStatus === 'cerrado';
  }
});
```

**Mapping Logic:**
- **Abiertos** = `'abierto'` + `'en_progreso'` (both active states)
- **Cerrados** = `'cerrado'` (finalized state)

---

## Integration Steps

### Step 1: Update EventosTab.tsx Filter State

**Location:** `components/Route/EventosTab.tsx:252-256`

**Current Code:**
```typescript
// Old filter state
const [selectedEstados, setSelectedEstados] = useState<OperationalStatus[]>([
  'abierto',
  'en_progreso'
]);
```

**New Code:**
```typescript
// New filter state - binary toggle
const [selectedEstado, setSelectedEstado] = useState<'abiertos' | 'cerrados'>('abiertos');
```

---

### Step 2: Update EventosTab.tsx Filter Logic

**Location:** `components/Route/EventosTab.tsx:280-348`

**Current Filter Logic (lines 311-346):**
```typescript
const sortedFilteredEvents = useMemo(() => {
  if (!selectedVehicleId) return [];

  let filtered = eventsByVehicle[selectedVehicleId] || [];

  // Filter by estado
  filtered = filtered.filter(event => selectedEstados.includes(event.operationalStatus));

  // Filter by severidad
  if (selectedSeveridades.length > 0) {
    filtered = filtered.filter(event => selectedSeveridades.includes(event.severity));
  }

  // Filter by responsable
  if (selectedResponsables.length > 0) {
    filtered = filtered.filter(event =>
      event.assignedTo && selectedResponsables.includes(event.assignedTo)
    );
  }

  // Filter by etiquetas
  if (selectedEtiquetas.length > 0) {
    filtered = filtered.filter(event =>
      event.tags?.some(tag => selectedEtiquetas.includes(tag))
    );
  }

  // Sort by date
  return filtered.sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}, [selectedVehicleId, eventsByVehicle, selectedEstados, selectedSeveridades, selectedResponsables, selectedEtiquetas]);
```

**New Filter Logic:**
```typescript
const sortedFilteredEvents = useMemo(() => {
  if (!selectedVehicleId) return [];

  let filtered = eventsByVehicle[selectedVehicleId] || [];

  // Filter by estado (NEW: binary toggle logic)
  filtered = filtered.filter(event => {
    if (selectedEstado === 'abiertos') {
      // Abiertos includes both 'abierto' and 'en_progreso'
      return event.operationalStatus === 'abierto' || event.operationalStatus === 'en_progreso';
    } else {
      // Cerrados only includes 'cerrado'
      return event.operationalStatus === 'cerrado';
    }
  });

  // Filter by severidad (unchanged)
  if (selectedSeveridades.length > 0) {
    filtered = filtered.filter(event => selectedSeveridades.includes(event.severity));
  }

  // Filter by responsable (unchanged)
  if (selectedResponsables.length > 0) {
    filtered = filtered.filter(event =>
      event.assignedTo && selectedResponsables.includes(event.assignedTo)
    );
  }

  // Filter by etiquetas (unchanged)
  if (selectedEtiquetas.length > 0) {
    filtered = filtered.filter(event =>
      event.tags?.some(tag => selectedEtiquetas.includes(tag))
    );
  }

  // Sort by date (unchanged)
  return filtered.sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}, [selectedVehicleId, eventsByVehicle, selectedEstado, selectedSeveridades, selectedResponsables, selectedEtiquetas]);
// NOTE: Updated dependency from selectedEstados to selectedEstado
```

---

### Step 3: Replace Popover with EventFilterModal in EventosTab.tsx

**Location:** `components/Route/EventosTab.tsx:707-858`

**Current Code (Popover implementation):**
```typescript
{/* Old Popover Filter */}
<Popover
  content={
    <div style={{ width: '300px' }}>
      {/* Estado dropdown */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '8px', fontWeight: 600 }}>Estado</div>
        <Select
          mode="multiple"
          placeholder="Seleccionar estados"
          value={selectedEstados}
          onChange={setSelectedEstados}
          style={{ width: '100%' }}
          options={[
            { label: 'Abierto', value: 'abierto' },
            { label: 'En Progreso', value: 'en_progreso' },
            { label: 'Cerrado', value: 'cerrado' }
          ]}
        />
      </div>
      {/* Other filters... */}
    </div>
  }
  trigger="click"
  placement="bottomRight"
>
  <button style={{ /* button styles */ }}>
    <Funnel size={18} weight="bold" />
    <span>Filtros</span>
  </button>
</Popover>
```

**New Code (EventFilterModal implementation):**
```typescript
{/* Import at top of file */}
import EventFilterModal from '@/components/Events/EventFilterModal';

{/* Add state for modal visibility */}
const [filterModalOpen, setFilterModalOpen] = useState(false);

{/* Replace Popover button with simple button */}
<button
  onClick={() => setFilterModalOpen(true)}
  style={{ /* same button styles */ }}
>
  <Funnel size={18} weight="bold" />
  <span>Filtros</span>
</button>

{/* Add EventFilterModal component */}
<EventFilterModal
  open={filterModalOpen}
  onClose={() => setFilterModalOpen(false)}
  selectedEstado={selectedEstado}
  onEstadoChange={setSelectedEstado}
  selectedSeveridades={selectedSeveridades}
  onSeveridadesChange={setSelectedSeveridades}
  selectedResponsables={selectedResponsables}
  onResponsablesChange={setSelectedResponsables}
  selectedEtiquetas={selectedEtiquetas}
  onEtiquetasChange={setSelectedEtiquetas}
  availableResponsables={availableResponsables}
  availableEtiquetas={availableEtiquetas}
  showUnidadesFilter={false}  // No Unidades filter in vehicle detail view
/>
```

---

### Step 4: Update EventosSidebar.tsx (Main View)

**Location:** `components/Eventos/EventosSidebar.tsx`

**Similar Changes as EventosTab.tsx, PLUS:**

1. **Filter State:** Add `selectedUnidades` state
```typescript
const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
```

2. **Available Options:** Create `availableUnidades` from event data
```typescript
const availableUnidades = useMemo(() => {
  const unidades = new Set<string>();
  Object.values(eventsByVehicle).flat().forEach(event => {
    if (event.vehicleId) {
      unidades.add(event.vehicleId);
    }
  });
  return Array.from(unidades).sort();
}, [eventsByVehicle]);
```

3. **Filter Logic:** Add Unidades filter to the existing filter chain
```typescript
// Filter by unidades (NEW for main view)
if (selectedUnidades.length > 0) {
  filtered = filtered.filter(event =>
    event.vehicleId && selectedUnidades.includes(event.vehicleId)
  );
}
```

4. **EventFilterModal Props:** Include Unidades section
```typescript
<EventFilterModal
  open={filterModalOpen}
  onClose={() => setFilterModalOpen(false)}
  selectedEstado={selectedEstado}
  onEstadoChange={setSelectedEstado}
  selectedSeveridades={selectedSeveridades}
  onSeveridadesChange={setSelectedSeveridades}
  selectedResponsables={selectedResponsables}
  onResponsablesChange={setSelectedResponsables}
  selectedEtiquetas={selectedEtiquetas}
  onEtiquetasChange={setSelectedEtiquetas}
  selectedUnidades={selectedUnidades}           // NEW
  onUnidadesChange={setSelectedUnidades}        // NEW
  availableResponsables={availableResponsables}
  availableEtiquetas={availableEtiquetas}
  availableUnidades={availableUnidades}         // NEW
  showUnidadesFilter={true}                     // NEW - show Unidades section
/>
```

---

## Filter Logic Conversion

### Conversion Helper Function (Optional)

If you need to convert between old and new filter states for any reason, here's a helper function:

```typescript
/**
 * Converts old three-state OperationalStatus[] to new binary estado
 */
function convertToEstado(selectedEstados: OperationalStatus[]): 'abiertos' | 'cerrados' {
  // If any open states are selected, default to 'abiertos'
  if (selectedEstados.includes('abierto') || selectedEstados.includes('en_progreso')) {
    return 'abiertos';
  }
  return 'cerrados';
}

/**
 * Converts new binary estado to old three-state OperationalStatus[]
 */
function convertToEstados(selectedEstado: 'abiertos' | 'cerrados'): OperationalStatus[] {
  if (selectedEstado === 'abiertos') {
    return ['abierto', 'en_progreso'];
  }
  return ['cerrado'];
}
```

---

## Testing Checklist

### Vehicle Detail View (EventosTab.tsx)

#### Eventos Tab
- [ ] Filter modal opens when clicking "Filtros" button
- [ ] Abiertos toggle shows only `abierto` and `en_progreso` events
- [ ] Cerrados toggle shows only `cerrado` events
- [ ] Severidad pills filter correctly (test each: Alta, Media, Baja, Informativa)
- [ ] Severidad pills can be toggled on/off individually
- [ ] Multiple severidad selections work (e.g., Alta + Media)
- [ ] Asignado dropdown filters by assigned user
- [ ] Multiple Asignado selections work
- [ ] Etiquetas dropdown filters by tags
- [ ] Multiple Etiquetas selections work
- [ ] Limpiar button resets all filters to defaults
- [ ] Filter modal closes on X button click
- [ ] Filter modal closes on outside click
- [ ] Filters apply immediately on modal close
- [ ] Event count badge updates correctly with filters

#### Historial Subtab > Eventos
- [ ] Same filter functionality works in Historial subtab
- [ ] Filters are independent between Eventos tab and Historial subtab
- [ ] Switching between tabs maintains filter state

### Main Eventos View (EventosSidebar.tsx)

- [ ] All filters from Vehicle Detail View work correctly
- [ ] Unidades dropdown section is visible
- [ ] Unidades dropdown filters by vehicle ID
- [ ] Multiple Unidades selections work
- [ ] Limpiar button resets Unidades filter along with others
- [ ] Event count updates correctly with Unidades filter
- [ ] Combination of all filters works (Estado + Severidad + Asignado + Etiquetas + Unidades)

### Edge Cases

- [ ] Empty filter results show appropriate message
- [ ] Filter modal works with no events
- [ ] Filter modal works with 100+ events
- [ ] Filter options update dynamically if event data changes
- [ ] Filtering preserves sort order (newest first)
- [ ] Modal is responsive on smaller screens
- [ ] No console errors or warnings

### Performance

- [ ] Filter operations complete in <100ms with 100+ events
- [ ] No unnecessary re-renders when opening/closing modal
- [ ] useMemo dependencies are correct (no stale data)

---

## Code References

### Files Modified/Created

| File | Status | Lines Modified | Purpose |
|------|--------|----------------|---------|
| `components/Events/EventFilterModal.tsx` | ✅ Created | 1-343 | New modal component |
| `components/Route/EventosTab.tsx` | 🔄 Pending | 252-256, 280-348, 707-858 | Vehicle detail integration |
| `components/Eventos/EventosSidebar.tsx` | 🔄 Pending | Similar to EventosTab | Main view integration |

### Key Type Definitions

**Event Types:**
- File: `lib/events/types.ts`
- `EventSeverity`: `'Alta' | 'Media' | 'Baja' | 'Informativa'`
- `OperationalStatus`: `'abierto' | 'en_progreso' | 'cerrado'`

**Event Interface:**
```typescript
interface Event {
  id: string;
  vehicleId: string;
  severity: EventSeverity;
  operationalStatus: OperationalStatus;
  assignedTo?: string;
  tags?: string[];
  startTime: string;
  endTime?: string;
  // ... other fields
}
```

---

## Notes and Considerations

### Why Binary Toggle Instead of Three States?

The new design simplifies the user experience by grouping `'abierto'` and `'en_progreso'` into a single "Abiertos" category. This makes sense because:
1. Both states represent active/ongoing events
2. Users typically want to see "what's happening now" (Abiertos) vs "what's finished" (Cerrados)
3. The `'en_progreso'` state is primarily an internal status that doesn't need separate filtering

### Alternative Approach: Three-State Toggle

If the client later requests the ability to filter `'en_progreso'` separately, the modal could be extended:

```typescript
// Alternative three-state design
selectedEstado: 'abiertos' | 'en_progreso' | 'cerrados' | 'todos';

// UI with three buttons
<button>Abiertos</button>
<button>En Progreso</button>
<button>Cerrados</button>
```

However, this would require UX approval and design updates.

---

## Future Enhancements

### Potential Improvements
1. **Filter Presets**: Save commonly used filter combinations
2. **Filter URL State**: Persist filters in URL query params for shareability
3. **Advanced Filters**: Date range, geofence areas, event types
4. **Filter Analytics**: Track which filters are most commonly used
5. **Quick Filters**: Pre-defined filter buttons (e.g., "Mis Eventos", "Alta Prioridad")

### Performance Optimizations
1. **Virtual Scrolling**: For large event lists (1000+ items)
2. **Debounced Filtering**: For text search filters
3. **Web Workers**: Move filter logic to background thread for very large datasets

---

## Completion Criteria

This implementation will be considered complete when:

- [x] EventFilterModal component is created and tested
- [ ] EventosTab.tsx is integrated with the new modal
- [ ] EventosSidebar.tsx is integrated with the new modal (including Unidades)
- [ ] All items in the Testing Checklist are verified
- [ ] No console errors or TypeScript errors
- [ ] User acceptance testing is completed
- [ ] Documentation is updated (this file)

---

## Change Log

### 2025-10-10
- **Created:** Initial implementation plan document
- **Progress:** EventFilterModal component completed (components/Events/EventFilterModal.tsx)
- **Next:** Integrate modal into EventosTab.tsx and EventosSidebar.tsx

---

## Contact and Support

If you encounter any issues during implementation:
1. Check TypeScript errors in the IDE
2. Review filter logic carefully (three-state to two-state conversion)
3. Test with mock data before testing with real events
4. Verify all useMemo dependencies are up to date

---

**Last Updated:** 2025-10-10 by Claude Code
**Document Version:** 1.0
