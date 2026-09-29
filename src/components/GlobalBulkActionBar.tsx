/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, CheckSquare, Layers } from 'lucide-react';

export interface GlobalBulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  onDeleteBulk: () => void;
  onSelectAll?: () => void;
  entityNamePlural?: string;
  isDeleting?: boolean;
  extraActions?: React.ReactNode;
}

/**
 * Barra Flutuante Global de Ações em Massa (Global Bulk Action Bar).
 * Sobrepõe-se à interface exibindo ações contextuais para itens selecionados.
 * Construída com o efeito padrão "Dark Liquid Glass" do MEI-Simple.
 */
export const GlobalBulkActionBar: React.FC<GlobalBulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClearSelection,
  onDeleteBulk,
  onSelectAll,
  entityNamePlural = 'itens',
  isDeleting = false,
  extraActions
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] max-w-[95vw] w-auto pointer-events-auto"
        >
          <div className="liquid-glass rounded-2xl sm:rounded-full px-4 sm:px-6 py-3 sm:py-3.5 shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-6 border border-emerald-500/40 text-white backdrop-blur-xl">
            {/* Lado Esquerdo: Contador e Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#2dd683] text-[#000000] flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {selectedCount}
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5 leading-tight">
                  {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {totalCount ? `de ${totalCount} ${entityNamePlural}` : `em ${entityNamePlural}`}
                </span>
              </div>
            </div>

            {/* Separador vertical em telas médias/grandes */}
            <div className="hidden sm:block h-6 w-px bg-white/20" />

            {/* Lado Direito: Ações */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {onSelectAll && totalCount && selectedCount < totalCount && (
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="px-3 py-1.5 text-[11px] sm:text-xs font-bold rounded-xl text-slate-200 bg-white/10 hover:bg-white/20 border border-white/10 transition cursor-pointer flex items-center gap-1.5"
                  title="Selecionar todos os itens da listagem"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Todos ({totalCount})</span>
                  <span className="md:hidden">Todos</span>
                </button>
              )}

              {extraActions}

              <button
                type="button"
                onClick={onDeleteBulk}
                disabled={isDeleting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                title="Excluir itens selecionados"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir ({selectedCount})</span>
              </button>

              <button
                type="button"
                onClick={onClearSelection}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
                title="Limpar seleção"
                aria-label="Limpar seleção"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalBulkActionBar;
