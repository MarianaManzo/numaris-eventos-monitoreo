'use client';

import { use } from 'react';
import EventDetailView from '@/components/Eventos/EventDetailView';
import type { EventContext } from '@/lib/events/types';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{
    context?: string;
    vehicleId?: string;
    viewDate?: string;
  }>;
}

export default function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const { eventId } = use(params);
  const { context, vehicleId, viewDate } = use(searchParams);

  return (
    <EventDetailView
      eventId={eventId}
      context={context as EventContext}
      vehicleId={vehicleId}
      viewDate={viewDate}
    />
  );
}
