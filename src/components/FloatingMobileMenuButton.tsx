import React, { memo } from 'react';
import { Menu } from 'lucide-react';

interface FloatingMobileMenuButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const FloatingMobileMenuButton = memo(function FloatingMobileMenuButton({
  onClick,
  isOpen = false
}: FloatingMobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
      title="Menu de Navegação"
      className="fixed right-4 sm:right-6 md:right-[10mm] bottom-4 sm:bottom-6 md:bottom-[10mm] z-40 md:hidden w-13 h-13 sm:w-14 sm:h-14 floating-liquid-glass-search flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-slate-900"
    >
      <span className="relative z-10 flex items-center justify-center">
        <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200 group-hover:scale-115" />
      </span>
      <span className="sr-only">Menu de Navegação</span>
    </button>
  );
});

export default FloatingMobileMenuButton;
