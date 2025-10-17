# Map FitBounds Implementation Guide

## Problem Statement
Leaflet maps don't automatically center on event markers when first loaded due to timing issues with:
1. Map DOM initialization
2. Marker rendering
3. Map container size calculation

This results in markers being rendered outside the visible map area on initial page load.

## Solution
A reusable custom React hook `useMapFitBounds` that handles the timing complexity and ensures markers are properly visible on first load.

## Usage

### 1. Import the Hook

```typescript
import { useMapFitBounds } from '@/hooks/useMapFitBounds';
```

### 2. Basic Implementation

```typescript
const YourMapComponent = ({ eventMarkers }: Props) => {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Automatically fit bounds on initial load
  useMapFitBounds({
    mapRef,
    markers: eventMarkers,
    isClient,
    padding: [50, 50, 50, 50],  // [top, right, bottom, left]
    maxZoom: 15,
    animate: false
  });

  return (
    <MapContainer ref={mapRef} /* ...other props */>
      {/* Your map content */}
    </MapContainer>
  );
};
```

### 3. Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mapRef` | `RefObject<L.Map \| null>` | Required | Reference to the Leaflet map instance |
| `markers` | `Array<{ position: [number, number] }>` | Required | Array of markers with lat/lng positions |
| `isClient` | `boolean` | Required | Whether client-side rendering is ready (for SSR) |
| `padding` | `[number, number, number, number]` | `[50, 50, 50, 50]` | Padding in pixels `[top, right, bottom, left]` |
| `maxZoom` | `number` | `15` | Maximum zoom level when fitting bounds |
| `initialDelay` | `number` | `700` | Delay in ms before attempting fitBounds |
| `animate` | `boolean` | `false` | Whether to animate the initial fitBounds |

## Implementation Details

### Timing Strategy
The hook uses a **two-stage delay approach**:

1. **Initial delay (700ms)**: Allows map DOM to render and markers to be created
2. **Size recalculation delay (100ms)**: After calling `invalidateSize()`, gives the map time to recalculate its dimensions

### Key Implementation Points

```typescript
// Stage 1: Wait for initial render
setTimeout(() => {
  if (!mapRef.current) return;

  // Stage 2: Force size recalculation
  mapRef.current.invalidateSize();

  setTimeout(() => {
    // Stage 3: Calculate and apply bounds
    const bounds = L.latLngBounds(positions);
    mapRef.current.fitBounds(bounds, options);
  }, 100);
}, 700);
```

### Why These Delays?
- **700ms initial**: Ensures markers are fully rendered in the DOM
- **100ms secondary**: Allows Leaflet to complete `invalidateSize()` calculations
- **`invalidateSize()` call**: Critical for ensuring the map knows its actual container dimensions

## Common Pitfalls

### ❌ Incorrect: Padding for Sidebars
```typescript
// DON'T do this if sidebar is outside map container
useMapFitBounds({
  padding: [50, 50, 50, 475]  // ❌ Accounting for 450px sidebar
});
```

### ✅ Correct: Understanding Layout
```typescript
// Sidebar is handled by Ant Design Layout - map gets remaining space
useMapFitBounds({
  padding: [50, 50, 50, 50]  // ✅ Uniform padding for visual comfort
});
```

## Implementation Examples

### Example 1: Events Map (Already Implemented)
File: `components/Eventos/EventosMapView.tsx`

```typescript
const hasInitializedBounds = useMapFitBounds({
  mapRef,
  markers: eventMarkers,
  isClient,
  padding: [50, 50, 50, 50],
  maxZoom: 15,
  animate: false
});
```

### Example 2: Route Events Tab (To Be Implemented)
File: `components/Route/EventosTab.tsx`

```typescript
// Add to your map component within EventosTab
const mapRef = useRef<L.Map | null>(null);

useMapFitBounds({
  mapRef,
  markers: eventMarkers,  // Your existing event markers
  isClient: true,  // or manage with useState if using SSR
  padding: [50, 50, 50, 50],
  maxZoom: 16
});
```

### Example 3: Custom Padding for Different Layouts
```typescript
// For a layout with a header and footer
useMapFitBounds({
  mapRef,
  markers: eventMarkers,
  isClient,
  padding: [80, 50, 100, 50],  // More padding top/bottom
  maxZoom: 15
});
```

## Troubleshooting

### Markers Still Not Visible?

1. **Check map container size**: Ensure your map container has explicit height/width
   ```css
   .map-container {
     height: 100%;
     width: 100%;
   }
   ```

2. **Verify marker positions**: Ensure markers have valid lat/lng coordinates
   ```typescript
   console.log('Markers:', markers.map(m => m.position));
   ```

3. **Adjust delays**: For slower devices, increase `initialDelay`
   ```typescript
   useMapFitBounds({
     /* ...other options */
     initialDelay: 1000  // Increase from 700ms
   });
   ```

4. **Check padding**: Large padding values can push markers outside viewport
   ```typescript
   // Too much padding for small screens
   padding: [200, 200, 200, 200]  // ❌

   // Reasonable padding
   padding: [50, 50, 50, 50]  // ✅
   ```

## Benefits of This Approach

✅ **Reusable**: Single hook works across all map views
✅ **Maintainable**: Fix bugs in one place, affects all implementations
✅ **Type-safe**: Full TypeScript support with proper types
✅ **Documented**: JSDoc comments explain usage
✅ **Tested**: Already working in production on `/eventos` page

## Migration Checklist

When adding fitBounds to a new map view:

- [ ] Import `useMapFitBounds` hook
- [ ] Ensure you have a `mapRef` using `useRef<L.Map | null>(null)`
- [ ] Ensure you have `isClient` state for SSR compatibility
- [ ] Call the hook with appropriate options
- [ ] Test on initial page load
- [ ] Test with different numbers of markers (1, many, all clustered)
- [ ] Test on different screen sizes
- [ ] Remove any old manual fitBounds logic

## Related Files

- **Hook Implementation**: `hooks/useMapFitBounds.ts`
- **Example Usage**: `components/Eventos/EventosMapView.tsx`
- **Other Map Views**:
  - `components/Route/EventosTab.tsx` (to be updated)
  - `components/Map/UnifiedMapView.tsx` (if needed)

---

**Last Updated**: September 29, 2025
**Author**: Claude Code
**Status**: Production Ready ✅