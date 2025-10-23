import { create } from 'zustand';
import dayjs, { type Dayjs } from 'dayjs';

export interface EventNote {
  id: string;              // Unique note ID
  eventId: string;         // Parent event ID
  author: string;          // Author name (e.g., "Carlos Martínez")
  authorAvatar?: string;   // Optional avatar URL
  content: string;         // Note text content
  timestamp: Dayjs;        // When note was created
}

interface NoteStore {
  notes: Record<string, EventNote[]>;  // eventId -> notes[]

  // Add a new note
  addNote: (eventId: string, author: string, content: string) => void;

  // Get all notes for an event (sorted by newest first)
  getNotesForEvent: (eventId: string) => EventNote[];

  // Get only the latest note for card preview
  getLatestNote: (eventId: string) => EventNote | null;
}

// Generate sample notes for demonstration
const generateSampleNotes = (): Record<string, EventNote[]> => {
  const authors = [
    'Juan Pérez',
    'María García',
    'Carlos López',
    'Ana Martínez',
    'Luis Hernández',
    'Sofía Rodríguez'
  ];

  const noteTemplates = [
    'Conductor contactado, confirmó la situación',
    'Vehículo detenido para revisión',
    'Velocidad reducida por tráfico intenso',
    'Llamada realizada, sin respuesta',
    'Evento resuelto, vehículo en ruta',
    'Coordinando con supervisor de zona',
    'Cliente notificado del retraso',
    'Esperando autorización para proceder',
    'Unidad redirigida a ruta alterna',
    'Documentación completada',
    'Incidente reportado a central',
    'Revisión técnica necesaria'
  ];

  const sampleNotes: Record<string, EventNote[]> = {};

  // Add notes to some random events (using date-based event IDs)
  const dates = ['20250906', '20250907', '20250908', '20250909'];

  dates.forEach(date => {
    // Add notes to events 0, 2, and 4 for each date
    [0, 2, 4].forEach(eventNum => {
      const eventId = `${date}-event-${eventNum}`;
      const noteCount = Math.floor(Math.random() * 3) + 1; // 1-3 notes per event

      sampleNotes[eventId] = [];

      for (let i = 0; i < noteCount; i++) {
        const author = authors[Math.floor(Math.random() * authors.length)];
        const content = noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
        const timestamp = dayjs().subtract(Math.floor(Math.random() * 120), 'minute'); // 0-120 min ago

        sampleNotes[eventId].push({
          id: `note-sample-${eventId}-${i}`,
          eventId,
          author,
          content,
          timestamp
        });
      }

      // Sort by newest first
      sampleNotes[eventId].sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf());
    });
  });

  // Add notes to current events (simple event IDs like event-0, event-1, etc.)
  // Add notes to approximately 40% of events (10 out of 25 events)
  const currentEventIds = [1, 3, 5, 7, 9, 12, 15, 18, 20, 22]; // Random selection

  currentEventIds.forEach(eventNum => {
    const eventId = `event-${eventNum}`;
    const noteCount = Math.floor(Math.random() * 3) + 1; // 1-3 notes per event

    sampleNotes[eventId] = [];

    for (let i = 0; i < noteCount; i++) {
      const author = authors[Math.floor(Math.random() * authors.length)];
      const content = noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
      const hoursAgo = Math.floor(Math.random() * 48); // 0-48 hours ago
      const minutesAgo = Math.floor(Math.random() * 60); // 0-60 minutes
      const timestamp = dayjs().subtract(hoursAgo, 'hour').subtract(minutesAgo, 'minute');

      sampleNotes[eventId].push({
        id: `note-sample-${eventId}-${i}`,
        eventId,
        author,
        content,
        timestamp
      });
    }

    // Sort by newest first
    sampleNotes[eventId].sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf());
  });

  return sampleNotes;
};

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: generateSampleNotes(),

  addNote: (eventId: string, author: string, content: string) => {
    // Validate input
    if (!content.trim() || content.trim().length < 5) {
      console.warn('Note content must be at least 5 characters');
      return;
    }
    if (content.length > 500) {
      console.warn('Note content must not exceed 500 characters');
      return;
    }

    const newNote: EventNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      author,
      content: content.trim(),
      timestamp: dayjs()
    };

    set((state) => ({
      notes: {
        ...state.notes,
        [eventId]: [newNote, ...(state.notes[eventId] || [])]
      }
    }));
  },

  getNotesForEvent: (eventId: string) => {
    const notes = get().notes[eventId] || [];
    // Already sorted by newest first when added
    return notes;
  },

  getLatestNote: (eventId: string) => {
    const notes = get().notes[eventId] || [];
    return notes.length > 0 ? notes[0] : null;
  }
}));
