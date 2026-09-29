import React from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

export interface StatusBadgeProps {
  status?: string;
  tone?: BadgeTone;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  pulse?: boolean;
  size?: 'xs' | 'sm';
  className?: string;
}

const TONE_MAP: Record<BadgeTone, string> = {
  success: 'bg-emerald-50 text-[#2e7d32] border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
  info: 'bg-blue-50 text-[#004AAD] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
  purple: 'bg-[#f3ecfd] text-[#5E17EB] border-[#ddd0fb] dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export function getToneFromStatus(status?: string): BadgeTone {
  if (!status) return 'neutral';
  const s = status.toUpperCase();
  if (['PAGO', 'CONCLUIDO', 'CONCLUÍDO', 'RECEITA', 'ATIVO', 'SUCESSO', 'AUTORIZADA'].includes(s)) return 'success';
  if (['PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO', 'ALERTA', 'ATENÇÃO', 'ATENCAO'].includes(s)) return 'warning';
  if (['ATRASADO', 'VENCIDO', 'CANCELADO', 'CANCELADA', 'DESPESA', 'ERRO', 'FALHA', 'BLOQUEADO'].includes(s)) return 'danger';
  if (['PROCESSANDO', 'SIMPLES_NACIONAL', 'INFO'].includes(s)) return 'info';
  return 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  tone,
  label,
  icon,
  pulse = false,
  size = 'xs',
  className = '',
}) => {
  const resolvedTone = tone || getToneFromStatus(status);
  const style = TONE_MAP[resolvedTone];
  const sizeClasses = size === 'xs' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold font-mono rounded-full border shadow-2xs select-none transition-colors ${sizeClasses} ${style} ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            resolvedTone === 'danger'
              ? 'bg-rose-500'
              : resolvedTone === 'warning'
              ? 'bg-amber-500'
              : resolvedTone === 'success'
              ? 'bg-emerald-500'
              : 'bg-blue-500'
          }`}
        />
      )}
      {icon}
      <span>{label || status}</span>
    </span>
  );
};

export default StatusBadge;
