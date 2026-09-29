import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Package, TrendingUp, BarChart } from 'lucide-react';

export interface LiquidNavigationBarProps {
  activeView?: string;
  onNavigate: (view: string) => void;
  className?: string;
}

export const LiquidNavigationBar: React.FC<LiquidNavigationBarProps> = ({
  activeView = 'dashboard',
  onNavigate,
  className = '',
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'financeiro', label: 'Caixa', icon: TrendingUp },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart }
  ];

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden ${className}`}>
      {/* O container principal com o efeito de vidro 3D */}
      <div className="glass-panel-3d flex items-center gap-1.5 p-2 rounded-[28px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl outline-none focus:outline-none group liquid-hover-pill cursor-pointer"
            >
              {/* Efeito de clique e hover no botão individual */}
              <motion.div
                className="flex flex-col items-center justify-center w-full h-full z-10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9, y: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon 
                  className={`w-5 h-5 mb-1 transition-colors duration-300 ${
                    isActive ? 'text-[#2dd683]' : 'text-slate-400 group-hover:text-slate-200'
                  }`} 
                />
                <span 
                  className={`text-[9px] font-bold tracking-wide transition-colors duration-300 ${
                    isActive ? 'text-[#2dd683]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </span>
              </motion.div>

              {/* Bolha Verde Líquida deslizando pelo layout */}
              {isActive && (
                <motion.div
                  layoutId="activeBubble"
                  className="absolute inset-0 liquid-active-green rounded-2xl z-0"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 24,
                    mass: 0.8
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LiquidNavigationBar;
