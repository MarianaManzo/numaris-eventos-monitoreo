import { Suspense } from 'react';
import EventosPageClient from './page.client';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <EventosPageClient />
    </Suspense>
  );
}
