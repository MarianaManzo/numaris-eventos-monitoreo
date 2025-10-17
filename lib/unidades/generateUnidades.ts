export interface Unidad {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Inactivo' | 'En ruta' | 'Detenido';
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
  heading?: number; // Direction vehicle is facing in degrees (0-360)
  lastReportMinutes?: number; // Minutes since last report
}

// Generate sample unidades - deterministic based on seed for consistency
export const generateUnidades = (): Unidad[] => {
  const tags = ['Walmart', 'OXXO', 'Soriana', 'Costco', 'Home Depot'];
  const emails = ['juan.perez@email.com', 'maria.garcia@email.com', 'carlos.lopez@email.com'];
  const estados: ('Activo' | 'Inactivo' | 'En ruta' | 'Detenido')[] = ['Activo', 'Inactivo', 'En ruta', 'Detenido'];

  const baseLatitude = 20.659699;
  const baseLongitude = -103.349609;
  const unidades: Unidad[] = [];

  // Use a fixed seed for deterministic generation
  const seed = 12345;
  const seededRandom = (index: number, offset: number = 0) => {
    const x = Math.sin(seed + index + offset) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 15; i++) {
    const latOffset = (seededRandom(i, 100) - 0.5) * 0.1;
    const lngOffset = (seededRandom(i, 200) - 0.5) * 0.1;
    const tagIndex = Math.floor(seededRandom(i, 300) * tags.length);
    const emailIndex = Math.floor(seededRandom(i, 400) * emails.length);
    const estadoIndex = Math.floor(seededRandom(i, 500) * estados.length);
    const heading = Math.floor(seededRandom(i, 600) * 360); // Random heading 0-360 degrees

    // Generate random last report time (in minutes)
    // 0-30 = green, 31-60 = orange, 60+ = red
    const lastReportRandom = seededRandom(i, 700);
    let lastReportMinutes: number;
    if (lastReportRandom < 0.4) {
      // 40% chance: recent (0-30 minutes) - green
      lastReportMinutes = Math.floor(lastReportRandom * 75); // 0-30
    } else if (lastReportRandom < 0.7) {
      // 30% chance: warning (31-60 minutes) - orange
      lastReportMinutes = 31 + Math.floor((lastReportRandom - 0.4) * 100); // 31-60
    } else {
      // 30% chance: critical (60+ minutes) - red
      lastReportMinutes = 61 + Math.floor((lastReportRandom - 0.7) * 500); // 61+
    }

    unidades.push({
      id: `unidad-${i}`,
      nombre: `Unidad ${String.fromCharCode(65 + i)}${String.fromCharCode(65 + ((i + 3) % 26))}${String.fromCharCode(65 + ((i + 7) % 26))}${i.toString().padStart(2, '0')}`,
      estado: estados[estadoIndex],
      position: [baseLatitude + latOffset, baseLongitude + lngOffset],
      etiqueta: tags[tagIndex],
      responsable: emails[emailIndex],
      heading,
      lastReportMinutes
    });
  }

  return unidades.sort((a, b) => a.nombre.localeCompare(b.nombre));
};

// Get a specific vehicle's current position by ID
export const getVehicleCurrentPosition = (unidadId: string): [number, number] | null => {
  const unidades = generateUnidades();
  const unidad = unidades.find(u => u.id === unidadId);
  return unidad ? unidad.position : null;
};
