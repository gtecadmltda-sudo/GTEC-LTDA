import React, { memo } from 'react';

export interface LiquidFilterProps {
  id?: string;
  baseFrequency?: string;
  numOctaves?: number;
  scale?: number;
}

/**
 * Componente dedicado de alto desempenho para o filtro SVG de distorção líquida (Dark Liquid Glass).
 * Encapsulado com React.memo e renderizado com dimensões nulas fora do fluxo de renderização,
 * garantindo zero overhead de layout thrashing ou re-renderizações desnecessárias.
 * Consumido diretamente via regras CSS: backdrop-filter: url(#liquid-distortion).
 */
export const LiquidFilter = memo(function LiquidFilter({
  id = 'liquid-distortion',
  baseFrequency = '0.002 0.002',
  numOctaves = 1,
  scale = 18
}: LiquidFilterProps) {
  return (
    <svg 
      id="liquid-header-svg-filter" 
      className="sr-only pointer-events-none absolute" 
      aria-hidden="true" 
      style={{ 
        position: 'absolute', 
        width: 0, 
        height: 0, 
        overflow: 'hidden',
        pointerEvents: 'none',
        visibility: 'hidden'
      }}
    >
      <defs>
        <filter 
          id={id} 
          x="-20%" 
          y="-20%" 
          width="140%" 
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence 
            type="turbulence" 
            baseFrequency={baseFrequency} 
            numOctaves={numOctaves} 
            result="turbulence" 
            seed="2"
          />
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="turbulence" 
            scale={scale} 
            xChannelSelector="R" 
            yChannelSelector="B" 
          />
        </filter>
      </defs>
    </svg>
  );
});

export default LiquidFilter;
