/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MonthlyRevenueD3Chart } from './MonthlyRevenueD3Chart';
import { EvolucaoMensalBarChart } from './EvolucaoMensalBarChart';
import { SaudeFinanceiraCard } from './SaudeFinanceiraCard';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { Client, Product, FinancialCategory, FinancialTransaction, DASPayment, Goal } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  PackageOpen, 
  CalendarMinus, 
  CalendarCheck, 
  BellRing, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  Target, 
  Trophy, 
  AlertTriangle, 
  ShieldCheck, 
  PieChart,
  FileText,
  Search,
  Keyboard
} from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  products: Product[];
  categories: FinancialCategory[];
  transactions: FinancialTransaction[];
  dasPayments: DASPayment[];
  goals: Goal[];
  onUpdateGoals?: any;
  services?: any[];
  stockMovements?: any[];
  invoices?: any[];
  onNavigate: (view: string, params?: { segment?: 'lancamentos' | 'pagar-receber' | 'reconciliacao' | 'projecoes', filterType?: 'TODOS' | 'RECEITA' | 'DESPESA' }) => void;
  onAddTransaction?: any;
  currentUserRole?: string;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
}

export const Dashboard = React.memo(function Dashboard({ 
  clients = [], 
  products = [], 
  categories = [], 
  transactions = [], 
  dasPayments = [], 
  goals = [],
  onNavigate,
  onOpenSearch,
  onOpenShortcuts
}: DashboardProps) {
  const [chartFilter, setChartFilter] = React.useState<'mensal' | 'trimestral' | 'semestral' | 'segundo-trimestre' | 'segundo-semestre' | 'anual'>('semestral');
  const [hoveredPoint, setHoveredPoint] = React.useState<{
    idx: number;
    type: 'revenue' | 'expense' | 'blueNode';
    x: number;
    y: number;
    label: string;
    rev: number;
    exp: number;
    netFlow: number;
    cumulative: number;
  } | null>(null);

  const MEI_ANNUAL_LIMIT = 81000.00;

  // 1. Calculate Consolidated Annual Revenue (RECEITAS for year 2026)
  const annualRevenue = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.data.startsWith('2026'))
    .reduce((sum, t) => sum + t.valor, 0);

  const usagePercent = (annualRevenue / MEI_ANNUAL_LIMIT) * 100;

  // Metas customizadas definidas pelo usuário
  const annualGoal = goals.find(g => g.tipo === 'FATURAMENTO_ANUAL')?.valorAlvo || 81000.00;
  const annualGoalProgress = (annualRevenue / annualGoal) * 100;
  
  // 2. Calculate Monthly Revenue (June 2026)
  const currentMonth = '2026-06';
  const monthlyRevenue = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.data.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.valor, 0);

  const monthlyGoal = goals.find(g => g.tipo === 'FATURAMENTO_MENSAL')?.valorAlvo || 6750.00;
  const monthlyGoalProgress = (monthlyRevenue / monthlyGoal) * 100;

  // 3. Current available cash state.
  const totalReceitasPago = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO')
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesasPago = transactions
    .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO')
    .reduce((sum, t) => sum + t.valor, 0);

  const currentCashBalance = totalReceitasPago - totalDespesasPago;

  // 4. Accounts receivable (receber) and payable (pagar) in next 30 days (June 2026 pending items)
  const accountsReceivable30d = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE' && t.dataVencimento.startsWith('2026-06'))
    .reduce((sum, t) => sum + t.valor, 0);

  const accountsPayable30d = transactions
    .filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE' && t.dataVencimento.startsWith('2026-06'))
    .reduce((sum, t) => sum + t.valor, 0);

  // Contas a Receber (todas as pendentes ou atrasadas)
  const contasAReceberList = transactions.filter(
    t => t.tipo === 'RECEITA' && (t.status === 'PENDENTE' || t.status === 'ATRASADO')
  );
  const totalContasAReceber = contasAReceberList.reduce((sum, t) => sum + t.valor, 0);

  // Contas a Pagar do dia (ou com vencimento no dia de hoje/corrente)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const contasAPagarHojeExatas = transactions.filter(
    t => t.tipo === 'DESPESA' && (t.status === 'PENDENTE' || t.status === 'ATRASADO') && t.dataVencimento === todayDateStr
  );
  const contasAPagarDiaList = contasAPagarHojeExatas.length > 0
    ? contasAPagarHojeExatas
    : transactions.filter(
        t => t.tipo === 'DESPESA' && (t.status === 'PENDENTE' || t.status === 'ATRASADO') && (t.dataVencimento.startsWith('2026-06') || t.dataVencimento <= todayDateStr)
      );
  const totalContasAPagarDia = contasAPagarDiaList.reduce((sum, t) => sum + t.valor, 0);
  const countContasAPagarDia = contasAPagarDiaList.length;

  // 5. Active Clients count
  const activeClientsCount = clients.filter(c => c.adimplente).length;

  // 6. Products with Critical Stock
  const criticalStockProducts = products.filter(p => p.estoqueAtual <= p.estoqueMinimo);

  // 7. DAS of the Month status lookup (June 2026)
  const currentDAS = dasPayments.find(d => d.periodoReferencia === '06/2026');

  // Processamento dinâmico de dados de fluxo do gráfico com filtros estratégicos de período
  const { items: computedItems, initialBalance } = React.useMemo(() => {
    let initBal = 0;
    let itemsList: { label: string; start: string; end: string; yearMonth?: string }[] = [];

    if (chartFilter === 'mensal') {
      initBal = transactions
        .filter(t => t.status === 'PAGO' && t.data < '2026-06-01')
        .reduce((sum, t) => sum + (t.tipo === 'RECEITA' ? t.valor : -t.valor), 0);
      
      itemsList = [
        { label: 'Sem 1', start: '2026-06-01', end: '2026-06-07' },
        { label: 'Sem 2', start: '2026-06-08', end: '2026-06-14' },
        { label: 'Sem 3', start: '2026-06-15', end: '2026-06-21' },
        { label: 'Sem 4', start: '2026-06-22', end: '2026-06-30' },
      ];
    } else if (chartFilter === 'trimestral' || chartFilter === 'segundo-trimestre') {
      initBal = transactions
        .filter(t => t.status === 'PAGO' && t.data < '2026-04-01')
        .reduce((sum, t) => sum + (t.tipo === 'RECEITA' ? t.valor : -t.valor), 0);
      
      itemsList = [
        { label: 'Abr', start: '2026-04-01', end: '2026-04-30', yearMonth: '2026-04' },
        { label: 'Mai', start: '2026-05-01', end: '2026-05-31', yearMonth: '2026-05' },
        { label: 'Jun', start: '2026-06-01', end: '2026-06-30', yearMonth: '2026-06' },
      ];
    } else if (chartFilter === 'semestral') {
      initBal = transactions
        .filter(t => t.status === 'PAGO' && t.data < '2026-01-01')
        .reduce((sum, t) => sum + (t.tipo === 'RECEITA' ? t.valor : -t.valor), 0);
      
      itemsList = [
        { label: 'Jan', start: '2026-01-01', end: '2026-01-31', yearMonth: '2026-01' },
        { label: 'Fev', start: '2026-02-01', end: '2026-02-28', yearMonth: '2026-02' },
        { label: 'Mar', start: '2026-03-01', end: '2026-03-31', yearMonth: '2026-03' },
        { label: 'Abr', start: '2026-04-01', end: '2026-04-30', yearMonth: '2026-04' },
        { label: 'Mai', start: '2026-05-01', end: '2026-05-31', yearMonth: '2026-05' },
        { label: 'Jun', start: '2026-06-01', end: '2026-06-30', yearMonth: '2026-06' },
      ];
    } else if (chartFilter === 'segundo-semestre') {
      initBal = transactions
        .filter(t => t.status === 'PAGO' && t.data < '2026-07-01')
        .reduce((sum, t) => sum + (t.tipo === 'RECEITA' ? t.valor : -t.valor), 0);
      
      itemsList = [
        { label: 'Jul', start: '2026-07-01', end: '2026-07-31', yearMonth: '2026-07' },
        { label: 'Ago', start: '2026-08-01', end: '2026-08-31', yearMonth: '2026-08' },
        { label: 'Set', start: '2026-09-01', end: '2026-09-30', yearMonth: '2026-09' },
        { label: 'Out', start: '2026-10-01', end: '2026-10-31', yearMonth: '2026-10' },
        { label: 'Nov', start: '2026-11-01', end: '2026-11-30', yearMonth: '2026-11' },
        { label: 'Dez', start: '2026-12-01', end: '2026-12-31', yearMonth: '2026-12' },
      ];
    } else { // 'anual'
      initBal = transactions
        .filter(t => t.status === 'PAGO' && t.data < '2026-01-01')
        .reduce((sum, t) => sum + (t.tipo === 'RECEITA' ? t.valor : -t.valor), 0);
      
      itemsList = [
        { label: 'Jan', start: '2026-01-01', end: '2026-01-31', yearMonth: '2026-01' },
        { label: 'Fev', start: '2026-02-01', end: '2026-02-28', yearMonth: '2026-02' },
        { label: 'Mar', start: '2026-03-01', end: '2026-03-31', yearMonth: '2026-03' },
        { label: 'Abr', start: '2026-04-01', end: '2026-04-30', yearMonth: '2026-04' },
        { label: 'Mai', start: '2026-05-01', end: '2026-05-31', yearMonth: '2026-05' },
        { label: 'Jun', start: '2026-06-01', end: '2026-06-30', yearMonth: '2026-06' },
        { label: 'Jul', start: '2026-07-01', end: '2026-07-31', yearMonth: '2026-07' },
        { label: 'Ago', start: '2026-08-01', end: '2026-08-31', yearMonth: '2026-08' },
        { label: 'Set', start: '2026-09-01', end: '2026-09-30', yearMonth: '2026-09' },
        { label: 'Out', start: '2026-10-01', end: '2026-10-31', yearMonth: '2026-10' },
        { label: 'Nov', start: '2026-11-01', end: '2026-11-30', yearMonth: '2026-11' },
        { label: 'Dez', start: '2026-12-01', end: '2026-12-31', yearMonth: '2026-12' },
      ];
    }

    let runningBal = initBal;
    const computed = itemsList.map(item => {
      let rev = 0;
      let exp = 0;
      if (item.yearMonth) {
        rev = transactions
          .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.data.startsWith(item.yearMonth!))
          .reduce((sum, t) => sum + t.valor, 0);
        exp = transactions
          .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.data.startsWith(item.yearMonth!))
          .reduce((sum, t) => sum + t.valor, 0);
      } else {
        rev = transactions
          .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.data >= item.start && t.data <= item.end)
          .reduce((sum, t) => sum + t.valor, 0);
        exp = transactions
          .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.data >= item.start && t.data <= item.end)
          .reduce((sum, t) => sum + t.valor, 0);
      }
      const netFlow = rev - exp;
      runningBal += netFlow;
      return {
        label: item.label,
        revenue: rev,
        expense: exp,
        netFlow,
        cumulative: runningBal
      };
    });

    return { items: computed, initialBalance: initBal };
  }, [chartFilter, transactions]);

  // Estatísticas de média de lucro e Markup do período
  const { avgProfitPercent, markupPeriod } = React.useMemo(() => {
    const totalRev = computedItems.reduce((acc, c) => acc + c.revenue, 0);
    const totalExp = computedItems.reduce((acc, c) => acc + c.expense, 0);
    const profitNet = totalRev - totalExp;
    const profitPercent = totalRev > 0 ? (profitNet / totalRev) * 100 : 0;
    const markupVal = totalExp > 0 ? (totalRev / totalExp) : 1.0;
    return {
      avgProfitPercent: profitPercent,
      markupPeriod: markupVal
    };
  }, [computedItems]);

  // Doughnut distributions (Comércio [cat-r1] vs Serviços [cat-r2])
  const revenueComercio = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.categoriaId === 'cat-r1')
    .reduce((sum, item) => sum + item.valor, 0);

  const revenueServico = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.categoriaId === 'cat-r2')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalSegmented = revenueComercio + revenueServico || 1;
  const pcComercio = (revenueComercio / totalSegmented) * 100;
  const pcServico = (revenueServico / totalSegmented) * 100;

  return (
    <div className="space-y-6">
      
      {/* 🔝 PAINEL GERAL & DESEMPENHO OPERACIONAL */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-6">
        <SectionHeader
          icon={<TrendingUp className="w-5 h-5 text-[#2e7d32]" />}
          iconVariant="emerald"
          title="Painel Geral & Desempenho Operacional"
          info="Visão executiva do faturamento acumulado, metas ativas, conciliação e saúde financeira da sua microempresa."
          badges={
            <>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                Exercício 2026
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                Simples Nacional MEI
              </span>
            </>
          }
        />

        <div className="h-[0.8px] w-full bg-logo-gradient rounded-full shadow-sm" />

        {/* CARDS DE INDICADORES: Contas a Receber, Contas a Pagar do Dia, Guia DAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Contas a Receber (Clicável com filtro de receitas) */}
          <div 
            onClick={() => onNavigate('financeiro', { segment: 'pagar-receber', filterType: 'RECEITA' })}
            className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-[#2e7d32] hover:shadow-md transition cursor-pointer group"
            title="Clique para gerenciar Contas a Receber no Fluxo de Caixa"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-[#2e7d32] transition">
                  Contas a Receber
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#2e7d32] border border-emerald-200">
                  {contasAReceberList.length} pendentes
                </span>
              </div>
              <span className="p-2 rounded-xl bg-emerald-100 text-[#2e7d32] group-hover:scale-110 transition">
                <CalendarCheck className="w-4.5 h-4.5 text-[#2e7d32]" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#2e7d32] block tracking-tight">
                R$ {totalContasAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500 font-medium">
                <span>Previsão de recebimentos</span>
                <span className="text-[#2e7d32] font-bold inline-flex items-center gap-0.5">
                  Ver detalhes <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Contas a Pagar do dia (Clicável com filtro de despesas) */}
          <div 
            onClick={() => onNavigate('financeiro', { segment: 'pagar-receber', filterType: 'DESPESA' })}
            className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-[#c62828] hover:shadow-md transition cursor-pointer group"
            title="Clique para gerenciar Contas a Pagar no Fluxo de Caixa"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-[#c62828] transition">
                  Contas a Pagar do Dia
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#c62828] border border-rose-200">
                  {countContasAPagarDia} {countContasAPagarDia === 1 ? 'conta' : 'contas'}
                </span>
              </div>
              <span className="p-2 rounded-xl bg-rose-100 text-[#c62828] group-hover:scale-110 transition">
                <CalendarMinus className="w-4.5 h-4.5 text-[#c62828]" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#c62828] block tracking-tight">
                R$ {totalContasAPagarDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500 font-medium">
                <span>Compromissos com vencimento</span>
                <span className="text-[#c62828] font-bold inline-flex items-center gap-0.5">
                  Ver detalhes <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Guia DAS Vigente */}
          <div 
            onClick={() => onNavigate('fiscal')}
            className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
            title="Clique para acessar módulo Fiscal & DAS"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-[#004AAD] transition">
                Guia DAS Vigente
              </span>
              <span className={`p-2 rounded-xl ${currentDAS?.status === 'PAGO' ? 'bg-emerald-100 text-[#2e7d32]' : 'bg-amber-100 text-amber-800'}`}>
                <ShieldCheck className="w-4.5 h-4.5" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 block tracking-tight">
                {currentDAS 
                  ? `R$ ${currentDAS.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                  : `R$ ${(76.6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </span>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500 font-medium">
                <span>{currentDAS?.status === 'PAGO' ? 'Guia quitada no Simples' : 'Vencimento: 20/07/2026'}</span>
                <span className="text-[#004AAD] font-bold inline-flex items-center gap-0.5">
                  Guia Fiscal <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ⚡ AÇÕES RÁPIDAS OPERACIONAIS (QUICK-ACCESS ACTION BUTTONS) */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#2dd683]/15 text-[#199f5c] dark:text-[#2dd683] flex items-center justify-center border border-[#2dd683]/30">
                <Zap className="w-4 h-4 fill-current" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  Ações Rápidas Operacionais
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[9.5px] font-bold rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                    Rotinas Diárias
                  </span>
                </h3>
              </div>
            </div>
            {onOpenShortcuts && (
              <button 
                type="button"
                onClick={onOpenShortcuts}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                title="Visualizar atalhos de teclado (pressione ?)"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Atalhos</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200/70 dark:bg-black/40 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/20">?</kbd>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Nova Venda */}
            <button
              type="button"
              onClick={() => onNavigate('financeiro', { segment: 'lancamentos', filterType: 'RECEITA' })}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900/60 border border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-98"
              title="Registrar nova venda ou recebimento (Atalho: Ctrl+B)"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/30">
                  <TrendingUp className="w-4.5 h-4.5" />
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white dark:bg-black/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  Ctrl+B
                </kbd>
              </div>
              <div className="mt-2.5">
                <span className="block text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Nova Venda
                </span>
                <span className="block text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                  Registrar entrada de receita
                </span>
              </div>
            </button>

            {/* 2. Novo Gasto */}
            <button
              type="button"
              onClick={() => onNavigate('financeiro', { segment: 'lancamentos', filterType: 'DESPESA' })}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-950/30 dark:to-slate-900/60 border border-rose-200 dark:border-rose-800/40 hover:border-rose-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-98"
              title="Registrar despesa ou conta a pagar (Atalho: Ctrl+G)"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-500/30">
                  <ArrowDownRight className="w-4.5 h-4.5" />
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white dark:bg-black/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
                  Ctrl+G
                </kbd>
              </div>
              <div className="mt-2.5">
                <span className="block text-xs font-bold text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  Novo Gasto
                </span>
                <span className="block text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                  Lançar despesa ou insumo
                </span>
              </div>
            </button>

            {/* 3. Emitir Nota */}
            <button
              type="button"
              onClick={() => onNavigate('fiscal')}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-white dark:from-blue-950/30 dark:to-slate-900/60 border border-blue-200 dark:border-blue-800/40 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-98"
              title="Emitir NF-e ou NFS-e (Atalho: Ctrl+N)"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                  <FileText className="w-4.5 h-4.5" />
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white dark:bg-black/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                  Ctrl+N
                </kbd>
              </div>
              <div className="mt-2.5">
                <span className="block text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Emitir Nota
                </span>
                <span className="block text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                  Gerar NF-e ou NFS-e MEI
                </span>
              </div>
            </button>

            {/* 4. Novo Cadastro */}
            <button
              type="button"
              onClick={() => onNavigate('cadastros')}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/80 to-white dark:from-purple-950/30 dark:to-slate-900/60 border border-purple-200 dark:border-purple-800/40 hover:border-purple-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-98"
              title="Cadastrar clientes, fornecedores ou produtos (Atalho: Alt+C)"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/30">
                  <Users className="w-4.5 h-4.5" />
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white dark:bg-black/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
                  Alt+C
                </kbd>
              </div>
              <div className="mt-2.5">
                <span className="block text-xs font-bold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Novo Cadastro
                </span>
                <span className="block text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                  Cliente, fornecedor ou item
                </span>
              </div>
            </button>

            {/* 5. Busca Global */}
            <button
              type="button"
              onClick={() => onOpenSearch ? onOpenSearch() : onNavigate('dashboard')}
              className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-white dark:from-amber-950/30 dark:to-slate-900/60 border border-amber-200 dark:border-amber-800/40 hover:border-amber-500 hover:shadow-md transition-all text-left flex flex-col justify-between group cursor-pointer active:scale-98"
              title="Pesquisar em todo o MEI-Simple (Atalho: Ctrl+K)"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-500/30">
                  <Search className="w-4.5 h-4.5" />
                </span>
                <kbd className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-white dark:bg-black/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                  Ctrl+K
                </kbd>
              </div>
              <div className="mt-2.5">
                <span className="block text-xs font-bold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Busca Rápida
                </span>
                <span className="block text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight truncate">
                  Localizar em qualquer módulo
                </span>
              </div>
            </button>
          </div>
        </div>
        <div className="pt-5 border-t border-slate-200/80">
          <EvolucaoMensalBarChart 
            transactions={transactions} 
            onNavigate={onNavigate} 
          />
        </div>
      </div>
      
      {/* ⚠️ LIMITS EXCEEDED ATTENTION CONTAINER */}
      {annualRevenue > MEI_ANNUAL_LIMIT && (
        <div className="p-5 rounded-2xl flex items-start gap-4 border bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900/40 shadow-lg animate-pulse">
          <div className="p-3 rounded-full bg-red-600 text-white shrink-0 shadow-md">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-red-900 dark:text-red-200">
              ATENÇÃO: Limite de Faturamento MEI Ultrapassado!
            </h4>
            <p className="text-xs leading-relaxed text-red-800 dark:text-red-100 font-medium">
              Seu faturamento anual de <strong className="font-mono">R$ {annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ultrapassou o teto fiscal legal do MEI de <strong className="font-mono">R$ 81.000,00</strong>. 
              Para manter as operações em conformidade, <strong>orientamos que procure seu contador para regularizar a situação da melhor forma possível</strong>, planejando o desenquadramento ou migração segura para Microempresa (ME) sem retroatividade prejudicial!
            </p>
          </div>
        </div>
      )}

      {/* ⚠️ LIMITS ALERT SYSTEM */}
      {usagePercent >= 75 && annualRevenue <= MEI_ANNUAL_LIMIT && (
        <div id="tour-alerta-limite" className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm animate-pulse ${
          usagePercent >= 90 
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/30' 
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/30'
        }`}>
          <div className={`p-2 rounded-xl text-white shrink-0 ${
            usagePercent >= 90 ? 'bg-rose-600 dark:bg-rose-500' : 'bg-amber-500 dark:bg-amber-400'
          }`}>
            <BellRing className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className={`text-sm font-bold ${
              usagePercent >= 90 ? 'text-rose-900 dark:text-rose-200' : 'text-amber-900 dark:text-amber-200'
            }`}>
              {usagePercent >= 90 
                ? 'ALERTA CRÍTICO: Limite de Faturamento do MEI acima de 90%' 
                : 'Atenção: Limite de Faturamento do MEI acima de 75%'
              }
            </h4>
            <p className={`text-xs leading-relaxed ${
              usagePercent >= 90 ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'
            }`}>
              {usagePercent >= 90 
                ? `Seu faturamento anual de R$ ${annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} atingiu ${usagePercent.toFixed(1)}% do teto anual do MEI (R$ 81.000,00). Ao ultrapassar este limite, planeje o desenquadramento ou migração para Microempresa (ME) no mês subsequente para evitar retroatividade de impostos!`
                : `Você já utilizou ${usagePercent.toFixed(1)}% do limite permitido por lei (R$ 81.000,00). Monitore suas emissões de notas fiscais de venda e serviço e organize a transição do negócio com seu contador.`
              }
            </p>
          </div>
        </div>
      )}

      {/* 🎯 METAS & INDICADORES MILESTONE ALERT */}
      {annualGoalProgress >= 75 && (
        <div className="p-4 rounded-2xl flex items-start gap-3 border shadow-sm bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30">
          <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
            <Trophy className="w-5 h-5 text-emerald-50" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-250">
              MARCO ALCANÇADO: {annualGoalProgress >= 100 ? 'Meta Anual Concluída!' : 'Sua Meta Anual de Faturamento atingiu 75%!'}
            </h4>
            <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
              Parabéns! Seu faturamento consolidado de <strong>R$ {annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> atingiu <strong>{annualGoalProgress.toFixed(1)}%</strong> da sua meta anual de <strong>R$ {annualGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. Acompanhe abaixo o detalhamento dos seus indicadores!
            </p>
          </div>
        </div>
      )}

      {/* 🔝 INTEGRATED GRID LAYOUT FOR PRO BALANCED DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* LEFT SIDE (Cols 1 & 2): Core Revenue, Analytics History and Metrics Carousel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 📊 CONTAINER UNIFICADO: FATURAMENTO ANUAL & FATURAMENTO MENSAL */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-[#2e7d32] rounded-xl border border-emerald-200/80">
                  <TrendingUp className="w-5 h-5 text-[#2e7d32]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-display flex items-center">
                    Faturamento Consolidado & Metas
                    <InfoTooltip text="Acompanhamento do teto fiscal MEI e desempenho da meta mensal" />
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-[#2e7d32] font-bold px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                Exercício 2026
              </span>
            </div>

            <div className="h-[0.8px] w-full bg-logo-gradient rounded-full shadow-sm" />

            {/* Cards Internos Lado a Lado / Empilhados no Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Interno 1: Faturamento Anual */}
              <div 
                id="tour-dashboard-card-limite" 
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  usagePercent >= 90 
                    ? 'border-rose-400 bg-rose-50/25 shadow-xs' 
                    : usagePercent >= 75 
                      ? 'border-amber-300 bg-amber-50/25 shadow-xs' 
                      : 'border-slate-200 bg-slate-50/60'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1 select-none">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display">
                      Faturamento Anual
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-[#2e7d32] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200 select-none shrink-0">
                      <TrendingUp className="w-3 h-3" /> Ano corrente
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-col items-start gap-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">
                      Faturados
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-baseline gap-1.5 leading-none">
                      <span className={`font-mono transition-colors duration-300 ${
                        usagePercent >= 90 
                          ? 'text-[#c62828]' 
                          : usagePercent >= 75 
                            ? 'text-amber-500' 
                            : 'text-[#2e7d32]'
                      }`}>
                        R$ {annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1 flex-wrap gap-1">
                        <span className="font-semibold text-slate-500">
                          R$ {MEI_ANNUAL_LIMIT.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Teto MEI)
                        </span>
                      </div>
                      <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border transition-all duration-300 ${
                        usagePercent >= 90 
                          ? 'bg-rose-50 border-rose-300' 
                          : usagePercent >= 75 
                            ? 'bg-amber-50 border-amber-300' 
                            : 'bg-slate-200 border-transparent'
                      }`}>
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-1000 ${
                            usagePercent >= 90 
                              ? 'bg-[#c62828] shadow-[0_0_8px_rgba(198,40,40,0.4)]' 
                              : usagePercent >= 75 
                                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                                : 'bg-[#2e7d32] shadow-[0_0_8px_rgba(46,125,50,0.4)]'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex font-mono text-[10px] font-extrabold mt-1.5 justify-between">
                        <span className={`${
                          usagePercent >= 90 
                            ? 'text-[#c62828]' 
                            : usagePercent >= 75 
                              ? 'text-amber-500' 
                              : 'text-[#2e7d32]'
                        }`}>
                          {Math.min(usagePercent, 100).toFixed(1)}% faturado
                        </span>
                        <span className="text-slate-400">
                          {Math.max(0, 100 - usagePercent).toFixed(1)}% restante
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80">
                      <div className="p-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 flex justify-between items-center text-xs shadow-2xs">
                        <span className="font-semibold text-slate-600">Limite Restante:</span>
                        <strong className="font-extrabold font-mono text-slate-900">
                          R$ {Math.max(0, MEI_ANNUAL_LIMIT - annualRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Interno 2: Faturamento Mensal */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1 select-none">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display">
                      Faturamento Mensal
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-[#2e7d32] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 border border-emerald-200">
                      <TrendingUp className="w-3 h-3" /> Mês Corrente
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col items-start gap-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none">
                      Faturados
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-baseline gap-1.5 leading-none">
                      <span className="font-mono text-[#2e7d32] font-extrabold">
                        R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1 flex-wrap gap-1">
                        <span className="font-semibold text-slate-500">
                          R$ {monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Meta Mensal)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full overflow-hidden p-0.5 border border-transparent bg-slate-200">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-1000 bg-[#2e7d32] shadow-[0_0_8px_rgba(46,125,50,0.4)]"
                          style={{ width: `${Math.min(monthlyGoalProgress, 100)}%` }}
                        />
                      </div>
                      <div className="flex font-mono text-[10px] font-extrabold mt-1.5 justify-between">
                        <span className="text-[#2e7d32]">
                          {Math.min(monthlyGoalProgress, 100).toFixed(1)}% faturado
                        </span>
                        <span className="text-slate-400">
                          {Math.max(0, 100 - monthlyGoalProgress).toFixed(1)}% restante
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200/80">
                      <div className="p-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 flex justify-between items-center text-xs shadow-2xs">
                        <span className="font-semibold text-slate-600">Falta para Meta Mensal:</span>
                        <strong className="font-extrabold font-mono text-slate-900">
                          R$ {Math.max(0, monthlyGoal - monthlyRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Row 2: Fluxo de Caixa (Main chart) */}
          {/* Main interactive history SVG Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none mb-6">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display flex items-center">
                    Fluxo de Caixa
                    <InfoTooltip text="Evolução de entradas, saídas e resultado consolidado em 2026" />
                  </h3>
                </div>

                {/* Filtros de Período estratégicos e responsivos */}
                <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {[
                    { value: 'mensal', label: 'Mensal' },
                    { value: 'trimestral', label: 'Trimestral' },
                    { value: 'segundo-trimestre', label: '2º Trim.' },
                    { value: 'semestral', label: 'Semestral' },
                    { value: 'segundo-semestre', label: '2º Sem.' },
                    { value: 'anual', label: 'Anual' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setChartFilter(opt.value as any);
                        setHoveredPoint(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 ${
                        chartFilter === opt.value
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[0.8px] w-full bg-logo-gradient mb-6 rounded-full shadow-sm" />

              {/* Legenda visual das Três Linhas */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold mb-6">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500" />
                  <span>Receitas (Compensadas)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-red-500" />
                  <span>Despesas (Pagas)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-4 h-0.5 bg-blue-500 rounded" />
                  <span>Resultado Consolidado</span>
                </div>
              </div>

              {/* Bespoke interactive SVG Grid Chart */}
              <div className="h-64 relative select-none">
                {(() => {
                  const minValY = Math.min(0, ...computedItems.flatMap(item => [item.revenue, item.expense, (item.revenue + item.expense) / 2]));
                  const maxValY = Math.max(...computedItems.flatMap(item => [item.revenue, item.expense, (item.revenue + item.expense) / 2, 2000]));
                  const rangeY = (maxValY - minValY) || 1;

                  const getY = (val: number) => {
                    return 155 - ((val - minValY) / rangeY) * 125;
                  };

                  const getX = (idx: number) => {
                    const totalPoints = computedItems.length;
                    const startX = 65;
                    const endX = 545;
                    if (totalPoints <= 1) return (startX + endX) / 2;
                    const step = (endX - startX) / (totalPoints - 1);
                    return startX + idx * step;
                  };

                  const dRevenue = computedItems.map((item, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(item.revenue)}`).join(' ');
                  const dExpense = computedItems.map((item, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(item.expense)}`).join(' ');
                  const dBlue = computedItems.map((item, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY((item.revenue + item.expense) / 2)}`).join(' ');

                  return (
                    <>
                      <svg viewBox="0 0 600 220" className="w-full h-full overflow-visible">
                        {/* Grid Lines */}
                        <line x1="55" y1="30" x2="560" y2="30" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800/60" />
                        <line x1="55" y1="92" x2="560" y2="92" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800/60" />
                        <line x1="55" y1="155" x2="560" y2="155" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800/60" />

                        {/* Axis labels */}
                        <text x="15" y="34" className="text-[9px] font-mono font-bold fill-slate-400 dark:fill-slate-500" textAnchor="start">R$ {Math.round(maxValY).toLocaleString()}</text>
                        <text x="15" y="96" className="text-[9px] font-mono font-bold fill-slate-400 dark:fill-slate-500" textAnchor="start">R$ {Math.round((maxValY + minValY) / 2).toLocaleString()}</text>
                        <text x="15" y="159" className="text-[9px] font-mono font-bold fill-slate-400 dark:fill-slate-500" textAnchor="start">R$ {Math.round(minValY).toLocaleString()}</text>

                        {/* Path Lines */}
                        {computedItems.length > 0 && (
                          <>
                            <path d={dRevenue} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" className="transition-all duration-300" />
                            <path d={dExpense} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" className="transition-all duration-300" />
                            <path d={dBlue} fill="none" stroke="#3b82f6" strokeWidth="2.5" className="transition-all duration-300" />
                          </>
                        )}

                        {/* Interactive Node Circles */}
                        {computedItems.map((item, idx) => {
                          const x = getX(idx);
                          const yRev = getY(item.revenue);
                          const yExp = getY(item.expense);
                          const yBlue = getY((item.revenue + item.expense) / 2);
                          const profitPercent = item.revenue > 0 ? ((item.revenue - item.expense) / item.revenue) * 100 : 0;

                          return (
                            <g key={item.label} className="cursor-pointer">
                              {/* Revenue circular dot */}
                              <circle
                                cx={x}
                                cy={yRev}
                                r={hoveredPoint?.idx === idx && hoveredPoint?.type === 'revenue' ? "7" : "4.5"}
                                className="fill-emerald-500 stroke-white dark:stroke-slate-900 stroke-2 transition-all duration-150 hover:r-7"
                                onMouseEnter={() => {
                                  setHoveredPoint({
                                    idx,
                                    type: 'revenue',
                                    x,
                                    y: yRev,
                                    label: item.label,
                                    rev: item.revenue,
                                    exp: item.expense,
                                    netFlow: item.netFlow,
                                    cumulative: item.cumulative
                                  });
                                }}
                              />

                              {/* Expense circular dot */}
                              <circle
                                cx={x}
                                cy={yExp}
                                r={hoveredPoint?.idx === idx && hoveredPoint?.type === 'expense' ? "7" : "4.5"}
                                className="fill-red-550 stroke-white dark:stroke-slate-900 stroke-2 transition-all duration-150 hover:r-7"
                                onMouseEnter={() => {
                                  setHoveredPoint({
                                    idx,
                                    type: 'expense',
                                    x,
                                    y: yExp,
                                    label: item.label,
                                    rev: item.revenue,
                                    exp: item.expense,
                                    netFlow: item.netFlow,
                                    cumulative: item.cumulative
                                  });
                                }}
                              />

                              {/* Middle blue circular dot */}
                              <circle
                                cx={x}
                                cy={yBlue}
                                r={hoveredPoint?.idx === idx && hoveredPoint?.type === 'blueNode' ? "8" : "5.5"}
                                className="fill-blue-600 stroke-white dark:stroke-slate-900 stroke-2 transition-all duration-150 hover:r-8"
                                onMouseEnter={() => {
                                  setHoveredPoint({
                                    idx,
                                    type: 'blueNode',
                                    x,
                                    y: yBlue,
                                    label: item.label,
                                    rev: item.revenue,
                                    exp: item.expense,
                                    netFlow: item.netFlow,
                                    cumulative: item.cumulative
                                  });
                                }}
                              />

                              {/* Period label under axis */}
                              <text
                                x={x}
                                y="185"
                                textAnchor="middle"
                                className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400 font-sans"
                              >
                                {item.label}
                              </text>

                              {/* Profit percentage below each period */}
                              <text
                                x={x}
                                y="200"
                                textAnchor="middle"
                                className={`text-[9px] font-bold font-mono ${profitPercent >= 0 ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-red-600 dark:fill-red-400'}`}
                              >
                                {profitPercent >= 0 ? `+${profitPercent.toFixed(0)}%` : `${profitPercent.toFixed(0)}%`}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Absolute positioning of Tooltip box inside container */}
                      {hoveredPoint && (
                        <div 
                          className="absolute bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700 shadow-xl pointer-events-none z-10 text-[11px] w-48 text-left transition-all duration-150"
                          style={{
                            left: `${(hoveredPoint.x / 600) * 100}%`,
                            top: `${(hoveredPoint.y / 220) * 100 - 35}%`,
                            transform: 'translate(-50%, -100%)',
                          }}
                        >
                          <div className="font-extrabold border-b border-slate-800 pb-1.5 mb-1.5 flex justify-between uppercase text-[9px] text-slate-300">
                            <span>{hoveredPoint.label}</span>
                            {hoveredPoint.type === 'revenue' && <span className="text-emerald-400 font-bold">RELAÇÃO DE RECEITAS</span>}
                            {hoveredPoint.type === 'expense' && <span className="text-red-400 font-bold">RELAÇÃO DE DESPESAS</span>}
                            {hoveredPoint.type === 'blueNode' && <span className="text-blue-400 font-bold">ANALÍTICO CONSOLIDADO</span>}
                          </div>
                          
                          {hoveredPoint.type === 'revenue' && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-450 font-medium">Faturamento:</span>
                              <span className="font-bold font-mono text-emerald-400">R$ {hoveredPoint.rev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          {hoveredPoint.type === 'expense' && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-450 font-medium">Total de Saída:</span>
                              <span className="font-bold font-mono text-red-400">R$ {hoveredPoint.exp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          {hoveredPoint.type === 'blueNode' && (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-slate-300">
                                <span>Fluxo do Período:</span>
                                <span className={`font-bold font-mono ${hoveredPoint.netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  R$ {hoveredPoint.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center border-t border-slate-800/80 pt-1 text-white">
                                <span>Total Acumulado:</span>
                                <span className={`font-bold font-mono ${hoveredPoint.cumulative >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  R$ {hoveredPoint.cumulative.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Legenda de Média de Lucro e Markup do Período */}
            <div className="mt-8 pt-4 border-t border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row gap-4 items-center justify-between text-[11px] text-slate-500">
              <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center sm:justify-start">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Margem de Lucro Bruta do Período: <strong className="text-slate-800 dark:text-slate-200 font-mono font-extrabold">{avgProfitPercent.toFixed(1)}%</strong></span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-100/60 dark:border-slate-800/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Markup Médio das Despesas: <strong className="text-slate-800 dark:text-slate-200 font-mono font-extrabold">{markupPeriod.toFixed(2)}x</strong></span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 italic font-sans text-center sm:text-right">
                * Markup médio = Receita Total / Despesa Total no período selecionado.
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE (Col 3): Saúde Financeira & Alertas de Fluxo */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Indicador de Saúde Financeira */}
          <SaudeFinanceiraCard
            transactions={transactions}
            dasPayments={dasPayments}
            goals={goals}
            currentMonth="2026-06"
            onNavigate={onNavigate}
          />

          {/* ⚡ Alertas de Fluxo e Conformidade (Alinhado à base do Fluxo de Caixa) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col flex-1 justify-between">
            <div className="space-y-4">
              <div className="flex flex-col gap-1 select-none">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-logo-gradient font-display flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  Alertas de Fluxo e Conformidade
                </h4>
                <div className="h-[0.8px] w-full bg-logo-gradient mt-1.5 rounded-full shadow-sm" />
              </div>

              <div className="space-y-3">
                {/* Contas a Pagar 30d */}
                <div 
                  onClick={() => onNavigate('financeiro', { segment: 'pagar-receber', filterType: 'DESPESA' })}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-white hover:border-[#c62828] transition group"
                  title="Ver contas a pagar"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-50 text-[#c62828]">
                      <CalendarMinus className="w-4.5 h-4.5 text-[#c62828]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-[#c62828] transition block">Contas a Pagar (30d)</span>
                      <span className="text-[10px] text-slate-500">Próximos compromissos</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#c62828] font-mono">
                    R$ {accountsPayable30d.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Contas a Receber 30d */}
                <div 
                  onClick={() => onNavigate('financeiro', { segment: 'pagar-receber', filterType: 'RECEITA' })}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-white hover:border-[#2e7d32] transition group"
                  title="Ver contas a receber"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-[#2e7d32]">
                      <CalendarCheck className="w-4.5 h-4.5 text-[#2e7d32]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-[#2e7d32] transition block">Contas a Receber (30d)</span>
                      <span className="text-[10px] text-slate-500">Previsão de cobrança</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#2e7d32] font-mono">
                    R$ {accountsReceivable30d.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Clientes Adimplentes */}
                <div 
                  onClick={() => onNavigate('cadastros')} 
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-white hover:border-blue-300 transition group"
                  title="Ver clientes cadastrados"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#004AAD]">
                      <Users className="w-4.5 h-4.5 text-[#004AAD]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block group-hover:text-[#004AAD] transition">Clientes Adimplentes</span>
                      <span className="text-[10px] text-slate-500">Contas regulares no mês</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#004AAD] font-mono">
                    {activeClientsCount} / {clients.length}
                  </span>
                </div>

                {/* Estoque Crítico */}
                <div 
                  onClick={() => onNavigate('estoque')} 
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-white hover:border-amber-400 transition group"
                  title="Ver itens no controle de estoque"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <PackageOpen className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block group-hover:text-amber-600 transition">Estoque Crítico</span>
                      <span className="text-[10px] text-slate-500">Pronto para reabastecer</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    criticalStockProducts.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {criticalStockProducts.length} itens
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-150/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Painel de Conformidade</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Ativo</span>
            </div>
          </div>

        </div>

      </div>

      {/* 📊 CONTAINER FATURAMENTO MENSAL (ÚLTIMOS 6 MESES): OCUPANDO A PÁGINA INTEIRA COM PADRÃO DE 10 MM */}
      <div className="overflow-hidden w-full relative">
        <MonthlyRevenueD3Chart transactions={transactions} monthlyGoal={monthlyGoal} />
      </div>

      {/* 🥧 ATIVIDADES DO FATURAMENTO (EXPANDIDO & ALTO CONTRASTE WCAG AA) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 select-none">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900 font-display flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#004AAD]" />
                Atividades do Faturamento
                <InfoTooltip text="Distribuição histórica por categoria de receita fiscal do MEI" />
              </h3>
            </div>
            <span className="text-xs font-mono font-extrabold bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
              Total: R$ {(revenueComercio + revenueServico).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-[0.8px] w-full bg-logo-gradient mt-1 mb-5 rounded-full shadow-sm" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Donut Chart Ampliado com Alto Contraste */}
            <div className="md:col-span-5 flex justify-center relative">
              <svg width="170" height="170" viewBox="0 0 44 44" className="w-36 h-36 sm:w-42 sm:h-42 transform -rotate-90">
                {/* Background ring */}
                <circle cx="22" cy="22" r="16" fill="none" stroke="#e2e8f0" strokeWidth="5.5" />
                
                {/* Comércio Segment (#2e7d32) */}
                <circle 
                  cx="22" 
                  cy="22" 
                  r="16" 
                  fill="none" 
                  stroke="#2e7d32" 
                  strokeWidth="6" 
                  strokeDasharray={`${(pcComercio / 100) * 100.53} ${100.53}`}
                  strokeDashoffset="0"
                />

                {/* Serviço Segment (#004AAD) */}
                <circle 
                  cx="22" 
                  cy="22" 
                  r="16" 
                  fill="none" 
                  stroke="#004AAD" 
                  strokeWidth="6" 
                  strokeDasharray={`${(pcServico / 100) * 100.53} ${100.53}`}
                  strokeDashoffset={`-${(pcComercio / 100) * 100.53}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[11px] text-slate-600 uppercase tracking-widest font-bold">Total MEI</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 font-mono">
                  R$ {(revenueComercio + revenueServico).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Legendas e Indicadores com Alto Contraste WCAG AA */}
            <div className="md:col-span-7 space-y-3.5">
              <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 bg-[#2e7d32] rounded-full shrink-0 shadow-xs" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block">Vendas de Prod. e Peças</span>
                      <span className="text-[11px] text-slate-600 font-medium">Comércio / Anexo I</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono block">
                      R$ {revenueComercio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-[#2e7d32] font-mono">
                      {pcComercio.toFixed(1)}% do faturamento
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 bg-[#004AAD] rounded-full shrink-0 shadow-xs" />
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block">Prestação de Serviços</span>
                      <span className="text-[11px] text-slate-600 font-medium">Serviços / Anexo III</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono block">
                      R$ {revenueServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-[#004AAD] font-mono">
                      {pcServico.toFixed(1)}% do faturamento
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <strong className="text-slate-800 font-bold">Observação Fiscal:</strong> A segregação precisa entre Comércio e Serviços orienta o cálculo do DAS-MEI e simplifica o preenchimento da Declaração Anual Simplificada (DASN-SIMEI).
        </div>
      </div>
    </div>
  );
});
