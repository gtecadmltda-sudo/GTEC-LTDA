/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Check, ShieldAlert } from 'lucide-react';

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  itemName?: string;
  itemCount?: number;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

/**
 * Componente Global de Confirmação de Ações Críticas (Exclusões / Baixas / Alterações Irreversíveis).
 * Herda a identidade visual e transições do Notification Center:
 * - Bordas de destaque: border-2 border-emerald-500/40
 * - Transição suave com física de spring do framer-motion
 * - Backdrop blur escuro
 */
export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Exclusão',
  description,
  confirmLabel = 'Confirmar Ação',
  cancelLabel = 'Cancelar',
  itemName,
  itemCount,
  variant = 'danger',
  isLoading = false
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await Promise.resolve(onConfirm());
      onClose();
    } catch (err) {
      console.error('Erro na ação de confirmação:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  const loadingActive = isLoading || internalLoading;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-800',
          btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
          badge: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'primary':
        return {
          iconBg: 'bg-emerald-100 text-emerald-800',
          btnConfirm: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 text-rose-700',
          btnConfirm: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500',
          badge: 'bg-rose-50 text-rose-700 border-rose-200'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto">
        {/* Backdrop com desfoque */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={loadingActive ? undefined : onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative z-10 w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-2xl shadow-2xl border-2 border-emerald-500/40 overflow-hidden flex flex-col max-h-[90vh]"
          role="dialog"
          aria-modal="true"
        >
          {/* Mobile Drag Indicator */}
          <div className="w-full flex flex-col items-center pt-2.5 pb-1 sm:hidden select-none bg-slate-50/70 border-b border-slate-100">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            <span className="text-[10px] text-slate-400 mt-0.5">Confirmação de segurança</span>
          </div>

          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-xs ${styles.iconBg}`}>
                {variant === 'danger' ? (
                  <Trash2 className="w-5 h-5 text-rose-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {title}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Operação crítica no MEI-Simple
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loadingActive}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 bg-white text-slate-700 text-sm">
            {itemCount && itemCount > 1 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Você está prestes a excluir <strong className="font-extrabold text-amber-950">{itemCount} itens selecionados</strong> de uma só vez.</span>
              </div>
            ) : itemName ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                Item selecionado: <strong className="font-bold text-slate-900 block truncate mt-0.5 text-sm">{itemName}</strong>
              </div>
            ) : null}

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {description || 'Esta ação não poderá ser desfeita. Todos os registros associados serão removidos com conformidade na trilha de auditoria.'}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingActive}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loadingActive}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${styles.btnConfirm}`}
            >
              {loadingActive ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmActionModal;
