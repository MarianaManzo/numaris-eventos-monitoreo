'use client';

import dynamic from 'next/dynamic';

const EventosView = dynamic(() => import('@/components/Eventos/EventosView'), { ssr: false });

export default function EventosPageClient() {
  return <EventosView />;
}
