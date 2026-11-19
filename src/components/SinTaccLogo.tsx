import React from 'react';

interface SinTaccLogoProps {
  size?: 'sm' | 'md' | 'lg';
  highContrast?: boolean;
  className?: string;
}

export const SinTaccLogo: React.FC<SinTaccLogoProps> = ({
  size = 'md',
  highContrast = false,
  className = '',
}) => {
  const dims =
    size === 'sm'
      ? { box: 'h-6 w-6', text: 'text-xs' }
      : size === 'lg'
        ? { box: 'h-10 w-10', text: 'text-base' }
        : { box: 'h-8 w-8', text: 'text-sm' };

  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold ${
        highContrast ? 'text-black' : 'text-emerald-900'
      } ${className}`}
      aria-label="Alimento Libre de TACC - Apto para celíacos"
    >
      <svg
        viewBox="0 0 64 64"
        className={`${dims.box} shrink-0`}
        role="img"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          fill={highContrast ? '#ffffff' : '#ecfdf5'}
          stroke={highContrast ? '#000000' : '#047857'}
          strokeWidth="4"
        />
        {/* Espiga de trigo estilizada */}
        <path
          d="M32 13v38"
          stroke={highContrast ? '#000000' : '#047857'}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M32 20c-4-2-7-6-7-9 4 0 7 3 7 9zm0 0c4-2 7-6 7-9-4 0-7 3-7 9zm0 10c-5-2-9-6-9-10 5 0 9 4 9 10zm0 0c5-2 9-6 9-10-5 0-9 4-9 10zm0 10c-5-2-9-6-9-10 5 0 9 4 9 10zm0 0c5-2 9-6 9-10-5 0-9 4-9 10z"
          fill={highContrast ? '#000000' : '#059669'}
        />
        {/* Barra diagonal de prohibición (Sin TACC) */}
        <line
          x1="13"
          y1="51"
          x2="51"
          y2="13"
          stroke="#dc2626"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <span className={`${dims.text} font-bold tracking-tight whitespace-nowrap`}>
        Libre de TACC
      </span>
    </span>
  );
};
