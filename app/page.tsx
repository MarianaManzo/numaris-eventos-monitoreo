import { Suspense } from 'react';
import HomeClient from './HomeClient';

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default function Page({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeClient initialParams={searchParams} />
    </Suspense>
  );
}
