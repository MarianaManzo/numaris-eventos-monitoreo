// Quick test to verify event data structure
const event = {
  id: "event-7",
  evento: "Error del conductor",
  fechaCreacion: "2025-10-05T20:01:36.000Z",
  severidad: "Media",
  position: [20.75, -103.45],
  etiqueta: "OXXO",
  responsable: "maria.garcia@email.com"
};

console.log("Event object:", event);
console.log("Has etiqueta?", !!event.etiqueta);
console.log("Has responsable?", !!event.responsable);
console.log("Etiqueta value:", event.etiqueta);
console.log("Responsable value:", event.responsable);
