'use client';

import type { SVGAttributes } from 'react';

type FilterGlyphProps = {
  size?: number;
  color?: string;
} & Omit<SVGAttributes<SVGSVGElement>, 'color'>;

export default function FilterGlyph({ size = 20, color = 'currentColor', ...props }: FilterGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 4h18l-6.5 9.4v5.7L9 20.3v-6.9L3 4Z"
        fill={color}
      />
    </svg>
  );
}
