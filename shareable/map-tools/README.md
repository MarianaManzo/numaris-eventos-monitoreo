# Map Tools Bundle

Este paquete contiene todos los componentes, hooks y utilidades necesarios para renderizar el mapa unificado de Numaris (marcadores, toolbars, clústeres, cálculos de rutas, etc.). Copiando la carpeta `map-tools` puedes reutilizar toda la funcionalidad en otro prototipo sin depender de alias de importación (`@/`).

## Contenido

- `components/`: todos los componentes de mapa (`MapToolbar`, `UnifiedMapView`, `MarkerClusterGroup`, etc.).
- `lib/`: hooks, stores, tipos y utilidades usadas por los componentes.
- `hooks/useMapFitBounds.ts`: hook auxiliar para ajustar el mapa a los bounds.
- `types/route.ts`: definición de tipos de rutas.
- `index.ts`: re-exporta los componentes y utilidades más comunes.

## Dependencias externas

Asegúrate de instalar en el proyecto destino:

```bash
npm install react react-dom react-leaflet leaflet leaflet.markercluster zustand dayjs phosphor-react
```

Y de importar los estilos globales de Leaflet (p. ej. en `_app.tsx`):

```ts
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
```

## Uso

```ts
import { MapToolbar, UnifiedMapView, useUnifiedMap } from './map-tools';
```

Cada store (`useRouteStore`, `useMapStore`, `useGlobalMapStore`) queda incluido; solo necesitas envolver tus vistas con los componentes y proporcionar los datos de rutas/eventos.

## Copia rápida

Para compartir con otro equipo, basta con comprimir la carpeta:

```bash
zip -r_map-tools.zip shareable/map-tools
```

Luego descomprime en el proyecto destino y ajusta los imports a la ruta en donde la coloques.
