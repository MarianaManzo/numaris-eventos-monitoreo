'use client';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { EventNote } from '@/lib/events/noteStore';

// Extend dayjs with relativeTime plugin for fromNow()
dayjs.extend(relativeTime);

export interface EventNoteItemProps {
  note: EventNote;
  showFullContent?: boolean;
}

/**
 * EventNoteItem - Single note display component
 *
 * Displays a note with avatar, author, timestamp, and content.
 * Used in both VehicleEventCard (latest note preview) and EventDetailSidebar (all notes).
 *
 * @example
 * <EventNoteItem
 *   note={latestNote}
 *   showFullContent={true}
 * />
 */
export default function EventNoteItem({
  note,
  showFullContent = true
}: EventNoteItemProps) {
  // Generate initials from author name
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '8px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px'
    }}>
      {/* Avatar */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#1867ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 600,
        flexShrink: 0
      }}>
        {note.authorAvatar ? (
          <img
            src={note.authorAvatar}
            alt={note.author}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          getInitials(note.author)
        )}
      </div>

      {/* Note content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Author and timestamp */}
        <div style={{
          fontSize: '13px',
          color: '#111827',
          fontWeight: 600,
          marginBottom: '2px'
        }}>
          {note.author}
          <span style={{
            fontWeight: 400,
            color: '#6b7280',
            marginLeft: '4px'
          }}>
            • {note.timestamp.fromNow()}
          </span>
        </div>

        {/* Note content */}
        <div style={{
          fontSize: '13px',
          color: '#6b7280',
          lineHeight: 1.5,
          wordBreak: 'break-word'
        }}>
          {showFullContent ? note.content : note.content.slice(0, 100) + (note.content.length > 100 ? '...' : '')}
        </div>
      </div>
    </div>
  );
}
