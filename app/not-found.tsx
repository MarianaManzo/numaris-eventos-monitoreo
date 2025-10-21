import { Suspense } from 'react';
import NotFoundClient from './not-found.client';

export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <NotFoundClient />
    </Suspense>
  );
}
