'use client';

import { CaretLeft, CaretRight } from 'phosphor-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  style
}: PaginationControlsProps) {
  const hasPages = totalPages > 0;
  const pageDisplay = hasPages ? currentPage + 1 : 0;
  const totalDisplay = hasPages ? totalPages : 0;

  const canGoPrev = !disabled && hasPages && currentPage > 0;
  const canGoNext = !disabled && hasPages && currentPage < totalPages - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const baseButtonStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.15s ease, color 0.15s ease'
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        gap: 12,
        ...style
      }}
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={!canGoPrev}
        aria-label="Página anterior"
        style={{
          ...baseButtonStyle,
          cursor: !canGoPrev ? 'not-allowed' : 'pointer',
          color: !canGoPrev ? '#94a3b8' : '#0f172a'
        }}
      >
        <CaretLeft size={16} weight="bold" />
      </button>

      <span style={{ fontSize: '12px', color: '#64748b', minWidth: 54, textAlign: 'center' }}>
        {pageDisplay} / {totalDisplay}
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label="Página siguiente"
        style={{
          ...baseButtonStyle,
          cursor: !canGoNext ? 'not-allowed' : 'pointer',
          color: !canGoNext ? '#94a3b8' : '#0f172a'
        }}
      >
        <CaretRight size={16} weight="bold" />
      </button>
    </div>
  );
}
