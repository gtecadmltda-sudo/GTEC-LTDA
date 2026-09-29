import React, { memo, useEffect } from 'react';
import { 
  Keyboard, 
  X, 
  Search, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  LayoutDashboard, 
  Package, 
  Users, 
  Command, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction: (actionKey: string) => void;
}

interface ShortcutItem {
  keys: string[];
  label: string;
  description: string;
  actionKey: string;
  icon: React.ReactNode;
  badgeColor?: string;
}

const SHORTCUT_GROUPS: { category: string; items: ShortcutItem[] }[] = [
  {
    category: 'Ações Operacionais Rápidas',
    items: [
      {
        keys: ['Ctrl', 'B'],
        label: 'Nova Venda / Receita',
        description: 'Lançar recebimento ou venda no fluxo de caixa',
        actionKey: 'nova-venda',
        icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        badgeColor: 'border-emerald-500/40 text-emerald-300'
      },
      {
        keys: ['Ctrl', 'G'],
        label: 'Novo Gasto / Despesa',
        description: 'Lançar despesa, conta a pagar ou compra',
        actionKey: 'novo-gasto',
        icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
        badgeColor: 'border-rose-500/40 text-rose-300'
      },
      {
        keys: ['Ctrl', 'N'],
        label: 'Emitir Nota Fiscal',
        description: 'Abrir emissor e gestão de NF-e / NFS-e',
        actionKey: 'emitir-nota',
        icon: <FileText className="w-4 h-4 text-blue-400" />,
        badgeColor: 'border-blue-500/40 text-blue-300'
      },
      {
        keys: ['Ctrl', 'K'],
        label: 'Busca Global',
        description: 'Localizar qualquer cliente, nota, transação ou produto',
        actionKey: 'busca',
        icon: <Search className="w-4 h-4 text-amber-400" />,
        badgeColor: 'border-amber-500/40 text-amber-300'
      }
    ]
  },
  {
    category: 'Navegação do Sistema',
    items: [
      {
        keys: ['Ctrl', 'D'],
        label: 'Painel Geral (Dashboard)',
        description: 'Retornar para a tela inicial executiva',
        actionKey: 'dashboard',
        icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" />
      },
      {
        keys: ['Ctrl', 'E'],
        label: 'Controle de Estoque',
        description: 'Ver estoque mínimo, inventário e ajustes',
        actionKey: 'estoque',
        icon: <Package className="w-4 h-4 text-purple-400" />
      },
      {
        keys: ['Alt', 'C'],
        label: 'Cadastros Gerais',
        description: 'Gerenciar clientes, fornecedores e catálogo',
        actionKey: 'cadastros',
        icon: <Users className="w-4 h-4 text-cyan-400" />
      },
      {
        keys: ['?'],
        label: 'Ajuda / Atalhos',
        description: 'Exibir este menu de atalhos em qualquer tela',
        actionKey: 'shortcuts',
        icon: <HelpCircle className="w-4 h-4 text-slate-300" />
      },
      {
        keys: ['Esc'],
        label: 'Fechar Janela',
        description: 'Fechar modais, menus ou telas de pesquisa ativas',
        actionKey: 'close',
        icon: <X className="w-4 h-4 text-slate-400" />
      }
    ]
  }
];

export const KeyboardShortcutsModal = memo(function KeyboardShortcutsModal({
  isOpen,
  onClose,
  onTriggerAction
}: KeyboardShortcutsModalProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Atalhos de Teclado MEI-Simple"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] glass-panel-3d bg-[#0f1722]/95 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-[#2dd683]/15 text-[#2dd683] border border-[#2dd683]/30">
                  <Keyboard className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                    Atalhos de Teclado
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Power-User
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Navegue e execute rotinas diárias do MEI com rapidez sem usar o mouse
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Fechar (Esc)"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Shortcuts List */}
            <div className="p-6 overflow-y-auto space-y-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.category} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span>{group.category}</span>
                    <span className="h-px flex-1 bg-white/10" />
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          if (item.actionKey === 'close') {
                            onClose();
                          } else {
                            onTriggerAction(item.actionKey);
                            onClose();
                          }
                        }}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#2dd683]/50 transition-all text-left flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0 group-hover:scale-105 transition-transform">
                            {item.icon}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-white group-hover:text-[#2dd683] transition-colors truncate">
                              {item.label}
                            </span>
                            <span className="block text-[11px] text-slate-400 truncate">
                              {item.description}
                            </span>
                          </div>
                        </div>

                        {/* Keys Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          {item.keys.map((k, idx) => (
                            <React.Fragment key={k}>
                              <kbd className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-black/50 border shadow-xs ${
                                item.badgeColor || 'border-white/20 text-slate-200'
                              }`}>
                                {k}
                              </kbd>
                              {idx < item.keys.length - 1 && (
                                <span className="text-slate-500 text-xs font-mono">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer Tip */}
            <div className="px-6 py-3.5 bg-black/40 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2dd683]" />
                <span>Dica: Pressione <kbd className="px-1 py-0.5 rounded text-[10px] font-mono bg-white/10 border border-white/20 text-slate-300">?</kbd> em qualquer tela para abrir este painel.</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                MEI-Simple Pro
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
