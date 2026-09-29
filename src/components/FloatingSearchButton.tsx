import React, { memo } from 'react';
import { Search } from 'lucide-react';

interface FloatingSearchButtonProps {
  onClick: () => void;
}

export const FloatingSearchButton = memo(function FloatingSearchButton({
  onClick
}: FloatingSearchButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Abrir pesquisa global"
      title="Pesquisa Global do Sistema (Ctrl + K)"
      className="fixed right-4 sm:right-6 md:right-[10mm] bottom-[calc(4.2rem+1rem)] sm:bottom-[calc(4.5rem+1.5rem)] md:bottom-[10mm] z-40 w-13 h-13 sm:w-14 sm:h-14 floating-liquid-glass-search flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-slate-900"
    >
      <span className="relative z-10 flex items-center justify-center">
        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200 group-hover:scale-115" />
      </span>
      <span className="sr-only">Pesquisar</span>
    </button>
  );
});

export default FloatingSearchButton;
