import dayjs from 'dayjs';
import React from 'react';

interface Event {
  id: string;
  evento: string;
  fechaCreacion: string;
  severidad: 'Alta' | 'Media' | 'Baja' | 'Informativa';
  icon: React.ReactElement;
  position: [number, number];
  etiqueta?: string;
  responsable?: string;
}

const getEventIconBySeverity = (severidad: string) => {
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'Alta':
        return '#dc2626';
      case 'Media':
        return '#ea580c';
      case 'Baja':
        return '#2563eb';
      case 'Informativa':
        return '#0891b2';
      default:
        return '#374151';
    }
  };

  const getEventIconPath = (sev: string) => {
    switch (sev) {
      case 'Alta':
        return 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z';
      case 'Media':
        return 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z';
      case 'Baja':
        return 'M224,48H32A16,16,0,0,0,16,64V176a16,16,0,0,0,16,16H80v24a8,8,0,0,0,16,0V192h64v24a8,8,0,0,0,16,0V192h48a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,176V64H224V176Z';
      case 'Informativa':
        return 'M240.26,186.1,152.81,34.23h0a28.74,28.74,0,0,0-49.62,0L15.74,186.1a27.45,27.45,0,0,0,0,27.71A28.31,28.31,0,0,0,40.55,228h174.9a28.31,28.31,0,0,0,24.79-14.19A27.45,27.45,0,0,0,240.26,186.1Zm-20.8,15.7a4.46,4.46,0,0,1-4,2.2H40.55a4.46,4.46,0,0,1-4-2.2,3.56,3.56,0,0,1,0-3.73L124,46.2a4.77,4.77,0,0,1,8,0l87.44,151.87A3.56,3.56,0,0,1,219.46,201.8ZM116,136V104a12,12,0,0,1,24,0v32a12,12,0,0,1-24,0Zm28,40a16,16,0,1,1-16-16A16,16,0,0,1,144,176Z';
      default:
        return 'M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z';
    }
  };

  const color = getSeverityStyle(severidad);
  const path = getEventIconPath(severidad);

  return React.createElement(
    'svg',
    { width: '16', height: '16', viewBox: '0 0 256 256', fill: color },
    React.createElement('path', { d: path })
  );
};

export function generateEventsForMap(): Event[] {
  const tags = ['Walmart', 'OXXO', 'Soriana', 'Costco', 'Home Depot', 'Liverpool', 'Chedraui', 'Sam\'s Club', 'Bodega Aurrera', 'Office Depot', 'Best Buy', 'Elektra', 'Coppel', 'Suburbia', 'Sears', 'Palacio de Hierro', 'Sanborns', '7-Eleven', 'Circle K', 'Farmacias Guadalajara'];
  const emails = ['juan.perez@email.com', 'maria.garcia@email.com', 'carlos.lopez@email.com', 'ana.martinez@email.com', 'luis.hernandez@email.com', 'sofia.rodriguez@email.com', 'diego.sanchez@email.com', 'carmen.ramirez@email.com'];

  const eventTemplates = [
    { evento: 'Límite de velocidad excedido', severidad: 'Alta' as const },
    { evento: 'Botón de pánico activado', severidad: 'Alta' as const },
    { evento: 'Parada abrupta detectada', severidad: 'Informativa' as const },
    { evento: 'Desconexión de batería', severidad: 'Alta' as const },
    { evento: 'Frenazo de emergencia', severidad: 'Alta' as const },
    { evento: 'Exceso de velocidad', severidad: 'Media' as const },
    { evento: 'Colisión inminente', severidad: 'Media' as const },
    { evento: 'Error del conductor', severidad: 'Media' as const },
    { evento: 'Desprendimiento detectado', severidad: 'Media' as const },
    { evento: 'Obstrucción en la vía', severidad: 'Baja' as const },
    { evento: 'Pérdida de control', severidad: 'Informativa' as const },
    { evento: 'Distracción al volante', severidad: 'Baja' as const },
    { evento: 'Fallo en los frenos', severidad: 'Alta' as const },
    { evento: 'Cambio brusco de carril', severidad: 'Media' as const },
    { evento: 'Batería baja', severidad: 'Baja' as const },
    { evento: 'Acceso no autorizado', severidad: 'Alta' as const },
    { evento: 'Mantenimiento programado', severidad: 'Informativa' as const },
    { evento: 'Temperatura elevada del motor', severidad: 'Media' as const },
    { evento: 'Puerta abierta durante tránsito', severidad: 'Baja' as const },
    { evento: 'Sistema actualizado', severidad: 'Informativa' as const },
    { evento: 'Señal GPS débil', severidad: 'Baja' as const },
    { evento: 'Cinturón de seguridad sin abrochar', severidad: 'Media' as const },
    { evento: 'Presión de neumáticos baja', severidad: 'Baja' as const },
    { evento: 'Entrada a zona restringida', severidad: 'Alta' as const },
    { evento: 'Ralentí prolongado', severidad: 'Informativa' as const },
  ];

  const baseLatitude = 20.659699;
  const baseLongitude = -103.349609;
  const events: Event[] = [];
  const now = dayjs();

  for (let i = 0; i < 25; i++) {
    const template = eventTemplates[i];
    // Keep events within Guadalajara (approximately 10-15km radius)
    const latOffset = (Math.random() - 0.5) * 0.1;  // ±0.05 degrees ≈ ±5km
    const lngOffset = (Math.random() - 0.5) * 0.1;  // ±0.05 degrees ≈ ±5km
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const secondsAgo = Math.floor(Math.random() * 60);
    const eventDateTime = now.subtract(hoursAgo, 'hour').subtract(minutesAgo, 'minute').subtract(secondsAgo, 'second');

    // Randomly assign tag and email
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    const randomEmail = emails[Math.floor(Math.random() * emails.length)];

    events.push({
      id: `event-${i}`,
      evento: template.evento,
      fechaCreacion: eventDateTime.toISOString(),
      severidad: template.severidad,
      icon: getEventIconBySeverity(template.severidad),
      position: [baseLatitude + latOffset, baseLongitude + lngOffset],
      etiqueta: randomTag,
      responsable: randomEmail
    });
  }

  return events.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
}
