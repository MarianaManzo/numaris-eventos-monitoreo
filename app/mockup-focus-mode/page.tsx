import { Suspense } from 'react';
import MockupFocusModeClient from './Client.client';

export const dynamic = 'force-static';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <MockupFocusModeClient />
    </Suspense>
  );
}
