import { Suspense } from 'react';
import HomeClient from './HomeClient.client';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomeClient initialParams={resolvedParams} />
    </Suspense>
  );
}
