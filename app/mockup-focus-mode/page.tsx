import { Suspense } from 'react';
import MockupFocusModeClient from './Client';

export const dynamic = 'force-static';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <MockupFocusModeClient />
    </Suspense>
  );
}
