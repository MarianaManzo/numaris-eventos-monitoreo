'use client';

import { useState } from 'react';
import { PaperPlaneRight } from 'phosphor-react';

export interface EventNoteInputProps {
  eventId: string;
  author: string;
  onAddNote: (eventId: string, author: string, content: string) => void;
  placeholder?: string;
}

/**
 * EventNoteInput - Inline note input component
 *
 * Provides a text input field for adding notes to events.
 * Used in both VehicleEventCard and EventDetailSidebar.
 *
 * @example
 * <EventNoteInput
 *   eventId="evento-1"
 *   author="Carlos Martínez"
 *   onAddNote={noteStore.addNote}
 *   placeholder="Agregar nota..."
 * />
 */
export default function EventNoteInput({
  eventId,
  author,
  onAddNote,
  placeholder = 'Agregar nota...'
}: EventNoteInputProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Validation
    const trimmedContent = content.trim();
    if (trimmedContent.length < 5) {
      setError('La nota debe tener al menos 5 caracteres');
      return;
    }
    if (trimmedContent.length > 500) {
      setError('La nota no puede exceder 500 caracteres');
      return;
    }

    // Add note
    onAddNote(eventId, author, trimmedContent);

    // Reset form
    setContent('');
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null); // Clear error when user types
  };

  const isValid = content.trim().length >= 5 && content.trim().length <= 500;
  const charCount = content.length;

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%'
      }}>
        {/* Textarea with submit button */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px'
        }}>
          <textarea
            value={content}
            onChange={handleChange}
            onClick={(e) => e.stopPropagation()}
            placeholder={placeholder}
            rows={2}
            style={{
              flex: 1,
              fontSize: '13px',
              color: '#111827',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5
            }}
          />
          <button
            type="submit"
            disabled={!isValid}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isValid ? '#1867ff' : '#e5e7eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: isValid ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (isValid) {
                e.currentTarget.style.backgroundColor = '#0047cc';
              }
            }}
            onMouseLeave={(e) => {
              if (isValid) {
                e.currentTarget.style.backgroundColor = '#1867ff';
              }
            }}
          >
            <PaperPlaneRight size={16} weight="regular" />
          </button>
        </div>

        {/* Character count and error */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px'
        }}>
          <span style={{
            color: error ? '#dc2626' : 'transparent'
          }}>
            {error || '\u00A0'}
          </span>
          <span style={{
            color: charCount > 500 ? '#dc2626' : '#6b7280'
          }}>
            {charCount}/500
          </span>
        </div>
      </div>
    </form>
  );
}
