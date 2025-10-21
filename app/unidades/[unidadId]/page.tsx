import { Suspense } from 'react';
import UnidadDetailClient from './page.client';

type UnidadRouteParams = {
  params: { unidadId: string };
};

const isUnidadRouteParams = (value: unknown): value is UnidadRouteParams => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const params = (value as Record<string, unknown>).params;

  return (
    params !== undefined &&
    params !== null &&
    typeof params === 'object' &&
    typeof (params as Record<string, unknown>).unidadId === 'string'
  );
};

export default function Page(props: unknown) {
  if (!isUnidadRouteParams(props)) {
    throw new Error('Expected params to contain a unidadId string.');
  }

  const {
    params: { unidadId },
  } = props;

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <UnidadDetailClient unidadId={unidadId} />
    </Suspense>
  );
}
