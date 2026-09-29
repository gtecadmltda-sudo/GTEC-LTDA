import React, { memo, useState, useEffect } from 'react';
import { Sparkles, Bell, Play, Search, Keyboard } from 'lucide-react';
import { User } from '../types';

export interface HeaderProps {
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onNavigate: (view: string) => void;
  onOpenTutorial?: () => void;
  onOpenOnboarding?: () => void;
  onOpenNotifications?: () => void;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  activeView?: string;
  urgentNotificationsCount?: number;
}

/**
 * Header do MEI-Simple com posicionamento fixo absoluto e estética Dark Liquid Glass.
 */
export const Header = memo(function Header({
  onNavigate,
  onOpenTutorial,
  onOpenOnboarding,
  onOpenNotifications,
  onOpenSearch,
  onOpenShortcuts,
  activeView = 'dashboard',
  urgentNotificationsCount = 0
}: HeaderProps) {
  const [showAutoTooltip, setShowAutoTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // O tooltip "Ver tutorial" deve aparecer automaticamente por 8 segundos ao acessar o Dashboard
  useEffect(() => {
    if (activeView === 'dashboard') {
      setShowAutoTooltip(true);
      const timer = setTimeout(() => {
        setShowAutoTooltip(false);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setShowAutoTooltip(false);
    }
  }, [activeView]);

  const handleTutorialClick = () => {
    setShowAutoTooltip(false);
    if (onOpenTutorial) {
      onOpenTutorial();
    } else if (onOpenOnboarding) {
      onOpenOnboarding();
    }
  };

  return (
    <header className="fixed top-2 left-2 right-2 md:left-auto md:top-[10mm] md:right-[10mm] md:w-[calc(100%-256px-30mm)] z-[100] h-16 glass-panel-3d apple-liquid-glass-header select-none transition-all duration-200 transform-gpu will-change-[transform,backdrop-filter] rounded-3xl">
      <div className="relative z-10 w-full h-full px-4 sm:px-6 pr-6 sm:pr-8 flex items-center justify-between">
        
        {/* Lado Esquerdo: Logo MEI-Simple com link para o Dashboard */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer text-left bg-transparent border-none p-0 focus:outline-none group"
            title="Ir para o Dashboard inicial (Ctrl+D)"
            aria-label="Ir para o Dashboard inicial"
          >
            <span className="bg-[#2dd683] text-[#000000] w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs font-black shrink-0 border border-emerald-400/40 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 shrink-0 text-[#000000]" />
            </span>
            <div className="flex flex-col justify-center">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5 leading-tight">
                MEI <span className="bg-[#2dd683] text-[#000000] px-1.5 py-0.5 rounded-lg text-xs sm:text-sm font-black shadow-xs">Simple</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-300 font-medium tracking-tight">
                Gestão Inteligente & Descomplicada
              </span>
            </div>
          </button>
        </div>

        {/* Lado Direito: Ações (Busca Ctrl+K, Atalhos, Tutorial com Play e Notificações) */}
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs shrink-0">
          
          {/* Botão de Busca Global Rápida com Badge Ctrl+K */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="h-10 px-3 cursor-pointer text-white hover:text-white rounded-2xl hidden md:inline-flex items-center justify-center gap-2 shrink-0 mei-header-btn group transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 active:scale-98"
              title="Buscar no MEI-Simple (Atalho: Ctrl+K)"
              aria-label="Buscar (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">Buscar</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 text-slate-300 border border-white/20">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* Botão Guia de Atalhos de Teclado (?) */}
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="w-10 h-10 rounded-2xl text-white cursor-pointer relative hidden sm:flex items-center justify-center shrink-0 mei-header-btn bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              title="Atalhos de teclado rápidos (Pressione ?)"
              aria-label="Atalhos de teclado"
            >
              <Keyboard className="w-4 h-4 text-slate-300 group-hover:text-[#2dd683] transition-colors" />
            </button>
          )}

          {/* Botão Tutorial: Acrílico translúcido monocromático */}
          <div className="relative">
            <button 
              type="button"
              onClick={handleTutorialClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="h-10 px-3 sm:px-3.5 cursor-pointer font-bold text-white hover:text-white rounded-2xl inline-flex items-center justify-center gap-2 shrink-0 mei-header-btn group transition-all bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
              title="Ver tutorial interativo"
              aria-label="Ver tutorial"
            >
              <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-white/20 transition-all backdrop-blur-sm">
                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
              </div>
            </button>

            {/* Tooltip Tutorial */}
            {(isHovered || showAutoTooltip) && (
              <div 
                role="tooltip"
                className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-black text-white text-[11px] font-bold rounded-xl whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
              >
                <span>Ver tutorial</span>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45 border-l border-t border-slate-700" />
              </div>
            )}
          </div>

          {/* Central de Notificações */}
          <button
            type="button"
            onClick={() => onOpenNotifications ? onOpenNotifications() : undefined}
            className="w-10 h-10 rounded-2xl text-white cursor-pointer relative flex items-center justify-center shrink-0 mei-header-btn bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
            title={urgentNotificationsCount > 0 
              ? `Central de Notificações (${urgentNotificationsCount} pendência(s) de vencimento/tributo)`
              : "Central de Notificações"}
            aria-label="Central de Notificações"
          >
            <Bell className="w-4 h-4 text-white shrink-0" />
            {urgentNotificationsCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg ring-2 ring-black animate-pulse">
                {urgentNotificationsCount > 9 ? '9+' : urgentNotificationsCount}
              </span>
            ) : (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-white/80 rounded-full animate-pulse shadow-xs ring-1 ring-black" />
            )}
          </button>

        </div>

      </div>
    </header>
  );
});

export default Header;
