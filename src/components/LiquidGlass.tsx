import React from 'react';

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  interactive?: boolean;
}

/**
 * Padrão Oficial Reutilizável: Liquid Glass (Design System MEI-Simple)
 * Superfície ótica idêntica à ferramenta de pesquisa do sistema:
 * - Refração ótica com desfoque e contraste aprimorados
 * - Reflexo especular em degradê na metade superior
 * - Chanfro esqueumórfico 3D com luz no topo e sombras densas na base
 * 
 * Uso:
 * <LiquidGlass className="p-4 rounded-2xl">...</LiquidGlass>
 * ou via classe Tailwind/CSS direta: className="liquid-glass"
 */
export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  as: Component = 'div',
  className = '',
  interactive = false,
  ...props
}) => {
  return (
    <Component
      className={`liquid-glass ${interactive ? 'liquid-glass-interactive cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default LiquidGlass;
