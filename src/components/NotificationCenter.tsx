import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Landmark, 
  Receipt, 
  DollarSign, 
  ExternalLink,
  CalendarClock,
  Sparkles,
  Flame,
  Check,
  ChevronRight
} from 'lucide-react';
import { FinancialTransaction, DASPayment, FinancialCategory } from '../types';
import { InfoTooltip } from './InfoTooltip';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'das' | 'overdue' | 'tax';
  timestamp: string;
  read?: boolean;
  amount?: number;
  dueDate?: string;
  actionView?: string;
  actionParams?: any;
  actionLabel?: string;
  isDismissible?: boolean;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'backup-info-2',
    title: 'Conformidade Fiscal SEFAZ',
    message: 'Backup automático e trilha de auditoria sincronizados com sucesso.',
    type: 'success',
    timestamp: 'Hoje, 08:30',
    read: false,
    isDismissible: true
  }
];

export interface NotificationDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: FinancialTransaction[];
  dasPayments?: DASPayment[];
  categories?: FinancialCategory[];
  onNavigate?: (view: string, params?: any) => void;
}

function formatBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getDaysDiff(targetDateStr: string, todayStr: string): number {
  try {
    const target = new Date(targetDateStr + 'T00:00:00');
    const today = new Date(todayStr + 'T00:00:00');
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function NotificationDrawerModal({ 
  isOpen, 
  onClose,
  transactions = [],
  dasPayments = [],
  categories = [],
  onNavigate
}: NotificationDrawerModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'tax' | 'system'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('meisimple_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [systemNotifications, setSystemNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('meisimple_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Identify tax-related transactions
  const isTaxTx = (t: FinancialTransaction) => {
    const cat = categories.find(c => c.id === t.categoriaId);
    const catName = cat?.nome?.toLowerCase() || '';
    const centroCusto = cat?.centroCusto?.toLowerCase() || '';
    const desc = (t.descricao || '').toLowerCase();

    return (
      t.categoriaId === 'cat-d3' ||
      centroCusto.includes('tribut') ||
      catName.includes('das') ||
      catName.includes('tribut') ||
      catName.includes('imposto') ||
      desc.includes('das') ||
      desc.includes('tributo') ||
      desc.includes('imposto') ||
      desc.includes('inss') ||
      desc.includes('icms') ||
      desc.includes('iss') ||
      desc.includes('simples nacional')
    );
  };

  // 2. Identify Overdue Expense Transactions
  const overdueTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.tipo !== 'DESPESA') return false;
      if (t.status === 'PAGO' || t.status === 'CANCELADO') return false;
      if (t.status === 'ATRASADO') return true;
      if (t.status === 'PENDENTE' && t.dataVencimento && t.dataVencimento < todayStr) return true;
      return false;
    });
  }, [transactions, todayStr]);

  const totalOverdueAmount = useMemo(() => {
    return overdueTransactions.reduce((acc, t) => acc + (t.valor || 0), 0);
  }, [overdueTransactions]);

  // 3. Identify Upcoming Tax Deadlines (Transactions + DAS Payments)
  const upcomingTaxDeadlines = useMemo(() => {
    const list: {
      id: string;
      title: string;
      description: string;
      dueDate: string;
      amount: number;
      isOverdue: boolean;
      daysRemaining: number;
      source: 'transaction' | 'das';
    }[] = [];

    // Pending tax transactions
    transactions.forEach(t => {
      if (isTaxTx(t) && (t.status === 'PENDENTE' || t.status === 'ATRASADO')) {
        const isPast = t.dataVencimento < todayStr || t.status === 'ATRASADO';
        const diff = getDaysDiff(t.dataVencimento, todayStr);
        list.push({
          id: `tx-tax-${t.id}`,
          title: t.descricao || 'Tributo Fiscal MEI',
          description: `Guia de recolhimento no valor de ${formatBRL(t.valor)}`,
          dueDate: t.dataVencimento,
          amount: t.valor,
          isOverdue: isPast,
          daysRemaining: diff,
          source: 'transaction'
        });
      }
    });

    // Pending DAS payments from dasPayments collection
    dasPayments.forEach(das => {
      if (das.status === 'PENDENTE' || das.status === 'ATRASADO') {
        // avoid exact duplicate if same due date and amount exists in transactions
        const alreadyInList = list.some(
          item => item.dueDate === das.dataVencimento && Math.abs(item.amount - das.valor) < 0.01
        );
        if (!alreadyInList) {
          const isPast = das.dataVencimento < todayStr || das.status === 'ATRASADO';
          const diff = getDaysDiff(das.dataVencimento, todayStr);
          list.push({
            id: `das-${das.id}`,
            title: `DAS-MEI Ref. ${das.periodoReferencia}`,
            description: `Guia mensal obrigatória do Simples Nacional (${formatBRL(das.valor)})`,
            dueDate: das.dataVencimento,
            amount: das.valor,
            isOverdue: isPast,
            daysRemaining: diff,
            source: 'das'
          });
        }
      }
    });

    // Sort by due date ascending
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [transactions, dasPayments, categories, todayStr]);

  // Closest upcoming tax deadline
  const nextUpcomingTax = useMemo(() => {
    // Look first for future or today deadlines
    const futureOnes = upcomingTaxDeadlines.filter(t => !t.isOverdue);
    if (futureOnes.length > 0) return futureOnes[0];
    // Otherwise fallback to the earliest pending one
    return upcomingTaxDeadlines[0] || null;
  }, [upcomingTaxDeadlines]);

  // Combined notifications dynamically built
  const dynamicNotifications = useMemo<AppNotification[]>(() => {
    const items: AppNotification[] = [];

    // Overdue payments notifications
    overdueTransactions.forEach(t => {
      const isTax = isTaxTx(t);
      const diff = Math.abs(getDaysDiff(t.dataVencimento, todayStr));
      items.push({
        id: `notif-overdue-${t.id}`,
        title: isTax ? `Tributo em Atraso: ${t.descricao}` : `Pagamento Vencido: ${t.descricao}`,
        message: `A despesa de ${formatBRL(t.valor)} venceu em ${formatDateBR(t.dataVencimento)} (${diff === 0 ? 'venceu hoje' : `atrasado há ${diff} dia(s)`}). Regularize para evitar encargos.`,
        type: 'overdue',
        timestamp: `Vencimento: ${formatDateBR(t.dataVencimento)}`,
        amount: t.valor,
        dueDate: t.dataVencimento,
        actionView: 'financeiro',
        actionParams: { segment: 'pagar-receber', filterType: 'DESPESA' },
        actionLabel: 'Regularizar no Caixa',
        isDismissible: false
      });
    });

    // Upcoming tax deadlines notifications
    upcomingTaxDeadlines.forEach(tax => {
      // Don't duplicate if already listed in overdue items above
      const alreadyInOverdue = overdueTransactions.some(
        ot => ot.dataVencimento === tax.dueDate && Math.abs(ot.valor - tax.amount) < 0.01
      );
      if (!alreadyInOverdue) {
        let msg = '';
        if (tax.daysRemaining < 0) {
          msg = `A guia de tributo de ${formatBRL(tax.amount)} está vencida desde ${formatDateBR(tax.dueDate)}.`;
        } else if (tax.daysRemaining === 0) {
          msg = `Hoje é a data limite para recolhimento da guia de ${formatBRL(tax.amount)}.`;
        } else {
          msg = `Vencimento em ${formatDateBR(tax.dueDate)} (restam ${tax.daysRemaining} dias). Valor: ${formatBRL(tax.amount)}.`;
        }

        items.push({
          id: `notif-tax-${tax.id}`,
          title: `Prazo Fiscal: ${tax.title}`,
          message: msg,
          type: 'tax',
          timestamp: `Vencimento: ${formatDateBR(tax.dueDate)}`,
          amount: tax.amount,
          dueDate: tax.dueDate,
          actionView: tax.source === 'das' ? 'relatorios' : 'financeiro',
          actionParams: tax.source === 'das' ? undefined : { segment: 'pagar-receber', filterType: 'DESPESA' },
          actionLabel: tax.source === 'das' ? 'Ver Guia DAS' : 'Ver no Caixa',
          isDismissible: false
        });
      }
    });

    // Add saved / system notifications
    systemNotifications.forEach(sys => {
      if (!dismissedIds.includes(sys.id)) {
        items.push(sys);
      }
    });

    return items;
  }, [overdueTransactions, upcomingTaxDeadlines, systemNotifications, dismissedIds, todayStr]);

  // Filtered notifications based on active tab
  const displayedNotifications = useMemo(() => {
    if (activeTab === 'overdue') {
      return dynamicNotifications.filter(n => n.type === 'overdue');
    }
    if (activeTab === 'tax') {
      return dynamicNotifications.filter(n => n.type === 'tax' || n.type === 'das');
    }
    if (activeTab === 'system') {
      return dynamicNotifications.filter(n => n.type === 'success' || n.type === 'info');
    }
    return dynamicNotifications;
  }, [dynamicNotifications, activeTab]);

  const removeNotification = (id: string) => {
    setDismissedIds(prev => {
      const updated = [...prev, id];
      try {
        localStorage.setItem('meisimple_dismissed_notifications', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setSystemNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem('meisimple_notifications', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearAllSystem = () => {
    const allSystemIds = systemNotifications.map(n => n.id);
    setDismissedIds(prev => {
      const updated = Array.from(new Set([...prev, ...allSystemIds]));
      try {
        localStorage.setItem('meisimple_dismissed_notifications', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setSystemNotifications([]);
    try {
      localStorage.setItem('meisimple_notifications', JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  const handleActionClick = (notif: AppNotification) => {
    if (notif.actionView && onNavigate) {
      onNavigate(notif.actionView, notif.actionParams);
      onClose();
    }
  };

  const overdueCount = overdueTransactions.length;
  const taxCount = upcomingTaxDeadlines.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[105] flex items-end sm:items-center justify-end sm:p-6 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 250) {
                onClose();
              }
            }}
            className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-2xl shadow-2xl border-2 border-emerald-500/40 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
          >
            {/* Mobile Drag Indicator */}
            <div className="w-full flex flex-col items-center pt-2.5 pb-1 sm:hidden cursor-grab active:cursor-grabbing select-none bg-slate-50/70 border-b border-slate-100">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              <span className="text-[10px] text-slate-400 mt-0.5">Arraste para baixo para fechar</span>
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      Central de Alertas & Notificações
                      <InfoTooltip text="Radar fiscal, prazos do MEI e controle de vencimentos" />
                    </h3>
                    {(overdueCount > 0 || taxCount > 0) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 animate-pulse">
                        {overdueCount + taxCount} pendente(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {systemNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllSystem}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* ============================================================== */}
              {/* REQUISITO: VISUAL INDICATOR FOR TAX DEADLINES & OVERDUE PAYMENTS */}
              {/* ============================================================== */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    Radar de Obrigações & Vencimentos
                  </span>
                  <span className="text-[10px] text-slate-400">Baseado em lançamentos reais</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  
                  {/* CARD 1: OVERDUE PAYMENTS INDICATOR */}
                  <div
                    onClick={() => setActiveTab('overdue')}
                    className={`cursor-pointer rounded-2xl p-3 border-2 transition-all duration-200 relative overflow-hidden ${
                      overdueCount > 0 
                        ? 'bg-gradient-to-br from-rose-50 via-red-50/70 to-rose-100/50 border-rose-400 hover:border-rose-500 shadow-xs' 
                        : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          overdueCount > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          {overdueCount > 0 ? (
                            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide block ${
                            overdueCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}>
                            {overdueCount > 0 ? 'Pagamentos em Atraso' : 'Contas em Dia'}
                          </span>
                          <span className="text-xs font-black text-slate-900 block leading-tight">
                            {overdueCount > 0 
                              ? `${overdueCount} pendência(s)` 
                              : '0 contas vencidas'
                            }
                          </span>
                        </div>
                      </div>

                      {overdueCount > 0 && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                        </span>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium truncate">
                        {overdueCount > 0 ? `Total: ${formatBRL(totalOverdueAmount)}` : 'Nenhum atraso registrado'}
                      </span>
                      {overdueCount > 0 && (
                        <span className="text-[10px] font-bold text-rose-700 flex items-center gap-0.5 shrink-0 hover:underline">
                          Filtrar <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CARD 2: UPCOMING TAX DEADLINES INDICATOR */}
                  <div
                    onClick={() => setActiveTab('tax')}
                    className={`cursor-pointer rounded-2xl p-3 border-2 transition-all duration-200 relative overflow-hidden ${
                      nextUpcomingTax 
                        ? nextUpcomingTax.isOverdue
                          ? 'bg-gradient-to-br from-rose-50 to-amber-50/70 border-rose-300 hover:border-rose-400 shadow-xs'
                          : 'bg-gradient-to-br from-amber-50 via-yellow-50/50 to-emerald-50/40 border-amber-300 hover:border-amber-400 shadow-xs'
                        : 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          nextUpcomingTax 
                            ? nextUpcomingTax.isOverdue ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}>
                          <Landmark className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wide block ${
                            nextUpcomingTax 
                              ? nextUpcomingTax.isOverdue ? 'text-rose-700' : 'text-amber-800'
                              : 'text-emerald-700'
                          }`}>
                            Prazos Tributários (DAS)
                          </span>
                          <span className="text-xs font-black text-slate-900 block leading-tight truncate max-w-[140px]">
                            {nextUpcomingTax ? nextUpcomingTax.title : 'Tributos em dia'}
                          </span>
                        </div>
                      </div>

                      {nextUpcomingTax && (
                        <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md ${
                          nextUpcomingTax.isOverdue 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : nextUpcomingTax.daysRemaining <= 5
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {nextUpcomingTax.isOverdue 
                            ? 'Vencido' 
                            : nextUpcomingTax.daysRemaining === 0 
                              ? 'Vence hoje' 
                              : `${nextUpcomingTax.daysRemaining}d`
                          }
                        </span>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-medium truncate">
                        {nextUpcomingTax 
                          ? `Vence: ${formatDateBR(nextUpcomingTax.dueDate)} • ${formatBRL(nextUpcomingTax.amount)}` 
                          : 'Nenhum imposto pendente'
                        }
                      </span>
                      {nextUpcomingTax && (
                        <span className="text-[10px] font-bold text-amber-800 flex items-center gap-0.5 shrink-0 hover:underline">
                          Filtrar <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Overall reassurance if zero issues */}
                {overdueCount === 0 && taxCount === 0 && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Excelente! Não há tributos a vencer nos próximos 15 dias e todas as contas estão rigorosamente quitadas.</span>
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* FILTER TABS */}
              {/* ============================================================== */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({dynamicNotifications.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('overdue')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'overdue'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : overdueCount > 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Vencidos ({overdueCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tax')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'tax'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : taxCount > 0
                        ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Landmark className="w-3 h-3" />
                  Prazos Fiscais ({taxCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('system')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'system'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Sistema ({systemNotifications.length})
                </button>
              </div>

              {/* ============================================================== */}
              {/* NOTIFICATIONS LIST */}
              {/* ============================================================== */}
              <div className="space-y-2.5">
                {displayedNotifications.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
                    <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                    <p className="text-xs font-bold text-slate-700">Nenhum alerta nesta categoria</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Suas finanças e guias estão regulares conforme os lançamentos registrados.
                    </p>
                  </div>
                ) : (
                  displayedNotifications.map((notif) => {
                    const isOverdue = notif.type === 'overdue';
                    const isTax = notif.type === 'tax' || notif.type === 'das';

                    return (
                      <motion.div
                        key={notif.id}
                        layout
                        drag={notif.isDismissible ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_e, info) => {
                          if (notif.isDismissible && Math.abs(info.offset.x) > 60) {
                            removeNotification(notif.id);
                          }
                        }}
                        className={`p-3.5 rounded-2xl shadow-xs transition group border-2 ${
                          isOverdue 
                            ? 'bg-gradient-to-r from-rose-50/70 to-white border-rose-300 hover:border-rose-500'
                            : isTax
                              ? 'bg-gradient-to-r from-amber-50/50 to-white border-amber-300 hover:border-amber-500'
                              : 'bg-white border-emerald-500/30 hover:border-emerald-500'
                        } ${notif.isDismissible ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Left Icon Badge */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                            isOverdue
                              ? 'bg-rose-100 border-rose-300 text-rose-700'
                              : isTax
                                ? 'bg-amber-100 border-amber-300 text-amber-800'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {isOverdue ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : isTax ? (
                              <Landmark className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isOverdue && (
                                  <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md border border-rose-200">
                                    🚨 Pagamento em Atraso
                                  </span>
                                )}
                                {isTax && (
                                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-200">
                                    🏛️ Prazo Fiscal MEI
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {notif.timestamp}
                                </span>
                              </div>

                              {notif.amount && (
                                <span className={`text-xs font-black ${isOverdue ? 'text-rose-700' : 'text-slate-900'}`}>
                                  {formatBRL(notif.amount)}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                              {notif.title}
                            </h4>
                            
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                              {notif.message}
                            </p>

                            {/* Action Row */}
                            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                              {notif.actionView ? (
                                <button
                                  type="button"
                                  onClick={() => handleActionClick(notif)}
                                  className={`text-[11px] font-bold inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
                                    isOverdue
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                      : isTax
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  <span>{notif.actionLabel || 'Visualizar'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">Notificação informativa</span>
                              )}

                              {notif.isDismissible && (
                                <span className="text-[9.5px] text-slate-400">
                                  ⇄ Deslize para descartar
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Close / Dismiss */}
                          {notif.isDismissible && (
                            <button
                              type="button"
                              onClick={() => removeNotification(notif.id)}
                              className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                              title="Remover"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Standalone Toast Notification component
export function ToastNotification({
  title,
  message,
  type = 'success',
  onClose
}: {
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'das' | 'info';
  onClose: () => void;
}) {
  return (
    <div className="fixed top-20 right-4 sm:right-8 z-[110] max-w-sm w-[calc(100%-32px)] sm:w-96 pointer-events-auto select-none">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        drag={true}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={(_e, info: PanInfo) => {
          if (
            Math.abs(info.offset.x) > 80 ||
            info.offset.y > 80 ||
            Math.abs(info.velocity.x) > 250 ||
            info.velocity.y > 250
          ) {
            onClose();
          }
        }}
        className="bg-white/95 backdrop-blur-md border-2 border-emerald-500/50 rounded-2xl p-4 shadow-xl shadow-emerald-950/10 cursor-grab active:cursor-grabbing hover:border-emerald-500 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            {type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : type === 'das' ? (
              <Landmark className="w-5 h-5 text-emerald-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Notificação MEI
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-lg transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
              {title}
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              {message}
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
              <span>Agora</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                ⇄ Deslize para descartar
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
