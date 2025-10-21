'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function NotFoundClient() {
  const params = useSearchParams();
  const resource = params.get('resource') || 'Página';
  const message = params.get('message');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 px-6 py-16 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-500">404</p>
          <h1 className="text-3xl font-bold text-slate-900">
            {resource} no encontrada
          </h1>
          <p className="text-sm text-slate-600">
            {message || 'No pudimos encontrar lo que estabas buscando. Verifica el enlace o vuelve al panel principal.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-sky-500 px-5 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
          >
            Ir al inicio
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-full border border-transparent px-5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
}
