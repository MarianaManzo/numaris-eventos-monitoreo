'use client';

import dynamic from 'next/dynamic';

const UnidadesView = dynamic(() => import('@/components/Unidades/UnidadesView'), { ssr: false });

export default function UnidadesPage() {
  return <UnidadesView />;
}