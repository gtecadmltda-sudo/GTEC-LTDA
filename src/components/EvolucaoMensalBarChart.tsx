import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  ArrowUpRight, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Calendar 
} from 'lucide-react';
import { FinancialTransaction } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { ActionButton } from './ActionButton';

export interface EvolucaoMensalBarChartProps {
  transactions: FinancialTransaction[];
  onNavigate?: (view: string, filter?: any) => void;
  className?: string;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const FULL_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface MonthlyDataPoint {
  mesKey: string;
  mes: string;
  mesCompleto: string;
  receitas: number;
  despesas: number;
  saldo: number;
  count: number;
}

export const EvolucaoMensalBarChart: React.FC<EvolucaoMensalBarChartProps> = ({
  transactions,
  onNavigate,
  className = '',
}) => {
  const [periodFilter, setPeriodFilter] = useState<'ano' | 'semestre1' | 'semestre2' | 'ultimos6'>('ano');
  const [statusFilter, setStatusFilter] = useState<'pagos' | 'todos'>('pagos');

  // Process data for the 12 months of 2026
  const fullYearData = useMemo<MonthlyDataPoint[]>(() => {
    const year = '2026';
    const monthsData: MonthlyDataPoint[] = [];

    for (let m = 1; m <= 12; m++) {
      const monthStr = m.toString().padStart(2, '0');
      const mesKey = `${year}-${monthStr}`;

      const monthTxs = (transactions || []).filter(t => {
        if (!t.data || !t.data.startsWith(mesKey)) return false;
        if (statusFilter === 'pagos') {
          return t.status === 'PAGO';
        }
        return t.status !== 'CANCELADO';
      });

      const receitas = monthTxs
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      const despesas = monthTxs
        .filter(t => t.tipo === 'DESPESA')
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      monthsData.push({
        mesKey,
        mes: MONTH_NAMES[m - 1],
        mesCompleto: `${FULL_MONTH_NAMES[m - 1]} ${year}`,
        receitas,
        despesas,
        saldo: receitas - despesas,
        count: monthTxs.length,
      });
    }

    return monthsData;
  }, [transactions, statusFilter]);

  // Apply Period Filter
  const filteredData = useMemo(() => {
    switch (periodFilter) {
      case 'semestre1':
        return fullYearData.slice(0, 6);
      case 'semestre2':
        return fullYearData.slice(6, 12);
      case 'ultimos6':
        return fullYearData.slice(0, 6);
      case 'ano':
      default:
        return fullYearData;
    }
  }, [fullYearData, periodFilter]);

  // Aggregated Totals
  const totals = useMemo(() => {
    const totalReceitas = filteredData.reduce((acc, d) => acc + d.receitas, 0);
    const totalDespesas = filteredData.reduce((acc, d) => acc + d.despesas, 0);
    const saldo = totalReceitas - totalDespesas;
    const margem = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;

    return { totalReceitas, totalDespesas, saldo, margem };
  }, [filteredData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload as MonthlyDataPoint;
    const rec = dataPoint.receitas;
    const desp = dataPoint.despesas;
    const saldo = dataPoint.saldo;

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-44 select-none">
        <div className="font-extrabold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
          <span>{dataPoint.mesCompleto}</span>
          <span className="text-[10px] text-slate-400 font-mono font-medium">{dataPoint.count} transações</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-emerald-700">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Receitas:
            </span>
            <span className="font-mono font-extrabold">
              R$ {rec.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-rose-700">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Despesas:
            </span>
            <span className="font-mono font-extrabold">
              R$ {desp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between gap-3">
            <span className="font-extrabold text-slate-700">Saldo Líquido:</span>
            <span className={`font-mono font-extrabold ${saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {saldo >= 0 ? '+' : ''} R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5 ${className}`}>
      {/* Header do Gráfico Interativo */}
      <div className="pb-4 border-b border-slate-100">
        <SectionHeader
          as="h3"
          icon={<BarChart3 className="w-5 h-5 text-[#004AAD]" />}
          iconVariant="blue"
          title="Evolução Mensal de Receitas e Despesas"
          info="Acompanhe o comparativo mensal entre receitas recebidas e despesas pagas em tempo real."
          badges={
            <StatusBadge
              tone="info"
              label="Comparativo Mensal"
            />
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Período */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPeriodFilter('ano')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    periodFilter === 'ano'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ano 2026
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('semestre1')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    periodFilter === 'semestre1'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1º Semestre
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('semestre2')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    periodFilter === 'semestre2'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2º Semestre
                </button>
              </div>

              {/* Filtro de Status (Pagos vs Todos) */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('pagos')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    statusFilter === 'pagos'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pagas / Liquidadas
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                    statusFilter === 'todos'
                      ? 'bg-slate-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas (Inc. Pendentes)
                </button>
              </div>

              {onNavigate && (
                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('financeiro')}
                  icon={<ArrowUpRight className="w-3.5 h-3.5 text-[#004AAD]" />}
                >
                  Ver Fluxo Detalhado
                </ActionButton>
              )}
            </div>
          }
        />
      </div>

      {/* Grid de KPIs do Período */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Total Receitas */}
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Receitas</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <strong className="text-base sm:text-lg font-extrabold font-mono text-[#2e7d32] block mt-1">
            + R$ {totals.totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>

        {/* Total Despesas */}
        <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-2xl">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Despesas</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <strong className="text-base sm:text-lg font-extrabold font-mono text-[#c62828] block mt-1">
            - R$ {totals.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>

        {/* Saldo Líquido */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Saldo Líquido</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <strong className={`text-base sm:text-lg font-extrabold font-mono block mt-1 ${totals.saldo >= 0 ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>
            {totals.saldo >= 0 ? '+' : ''} R$ {totals.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>

        {/* Margem Operacional */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl">
          <div className="flex items-center justify-between text-blue-900">
            <span className="text-[10px] font-bold uppercase tracking-wider">Margem</span>
            <Percent className="w-3.5 h-3.5 text-[#004AAD]" />
          </div>
          <strong className={`text-base sm:text-lg font-extrabold font-mono block mt-1 ${totals.margem >= 0 ? 'text-[#004AAD]' : 'text-[#c62828]'}`}>
            {totals.margem.toFixed(1)}%
          </strong>
        </div>
      </div>

      {/* Gráfico Recharts Interativo de Barras */}
      <div className="h-72 sm:h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="mes" 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `R$ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 700 }}
              formatter={(value) => (
                <span className="text-slate-700 font-bold ml-1">{value}</span>
              )}
            />
            <Bar 
              dataKey="receitas" 
              name="Receitas" 
              fill="#10b981" 
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
            <Bar 
              dataKey="despesas" 
              name="Despesas" 
              fill="#f43f5e" 
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda de Auditoria */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Exercício Fiscal 2026 • Valores sincronizados com lançamentos do caixa</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Análise em Tempo Real
        </span>
      </div>
    </div>
  );
};

export default EvolucaoMensalBarChart;
