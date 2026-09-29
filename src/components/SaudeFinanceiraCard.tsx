/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { FinancialTransaction, DASPayment, Goal } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight,
  Info,
  Sparkles,
  Target
} from 'lucide-react';

interface SaudeFinanceiraCardProps {
  transactions: FinancialTransaction[];
  dasPayments: DASPayment[];
  goals: Goal[];
  currentMonth?: string; // Ex: '2026-06'
  onNavigate?: (view: string) => void;
}

export function SaudeFinanceiraCard({
  transactions,
  dasPayments,
  goals,
  currentMonth = '2026-06',
  onNavigate
}: SaudeFinanceiraCardProps) {
  // Limite legal mensal de referência do MEI (R$ 81.000 / 12 meses)
  const MEI_MONTHLY_LIMIT = 6750;

  const {
    monthlyRevenue,
    monthlyNetProfit,
    profitMarginPercent,
    limitProportionPercent,
    currentDasStatus,
    healthScore,
    healthCategory,
    healthTips
  } = useMemo(() => {
    // 1. Transações do mês corrente
    const monthTx = transactions.filter(t => t.data.startsWith(currentMonth) && t.status === 'Pago');
    const rev = monthTx
      .filter(t => t.tipo === 'Receita')
      .reduce((sum, t) => sum + t.valor, 0);
    const exp = monthTx
      .filter(t => t.tipo === 'Despesa')
      .reduce((sum, t) => sum + t.valor, 0);

    const netProfit = rev - exp;
    const margin = rev > 0 ? (netProfit / rev) * 100 : 0;

    // 2. Meta Mensal
    const goalMonthly = goals.find(g => g.tipo === 'Faturamento Mensal' && (g.periodo === currentMonth || g.periodo === '2026-06'));
    const goalTarget = goalMonthly ? goalMonthly.valorAlvo : MEI_MONTHLY_LIMIT;

    const goalPercent = goalTarget > 0 ? (rev / goalTarget) * 100 : 0;
    const limitPercent = (rev / MEI_MONTHLY_LIMIT) * 100;

    // 3. Status DAS
    const das = dasPayments.find(d => d.periodoReferencia === currentMonth || d.periodoReferencia === '06/2026');
    const isDasPaid = das?.status === 'Pago';
    const isDasPending = !das || das.status === 'Pendente';

    // 4. Algoritmo Ponderado de Saúde Financeira (0 a 100)
    // Componente A: Atingimento / Proporção de Faturamento (0 a 40 pts)
    let scoreFaturamento = 0;
    if (goalPercent >= 90 && goalPercent <= 115) {
      scoreFaturamento = 40; // Ideal
    } else if (goalPercent > 115) {
      scoreFaturamento = 38; // Alto faturamento, ótimo, mas com atenção ao teto MEI
    } else if (goalPercent >= 70) {
      scoreFaturamento = 32;
    } else if (goalPercent >= 50) {
      scoreFaturamento = 24;
    } else {
      scoreFaturamento = Math.max(5, Math.round((goalPercent / 50) * 20));
    }

    // Componente B: Margem de Lucro & Eficiência de Despesas (0 a 30 pts)
    let scoreMargem = 0;
    if (margin >= 40) {
      scoreMargem = 30;
    } else if (margin >= 25) {
      scoreMargem = 24;
    } else if (margin >= 10) {
      scoreMargem = 18;
    } else if (margin > 0) {
      scoreMargem = 10;
    } else {
      scoreMargem = 0;
    }

    // Componente C: Regularidade Fiscal DAS / Obrigações MEI (0 a 20 pts)
    let scoreFiscal = isDasPaid ? 20 : isDasPending ? 14 : 5;

    // Componente D: Equilíbrio de Caixa & Cobertura (0 a 10 pts)
    let scoreCaixa = netProfit > 0 ? 10 : rev > 0 ? 4 : 0;

    const finalScore = Math.min(100, Math.max(0, scoreFaturamento + scoreMargem + scoreFiscal + scoreCaixa));

    // Classificação
    let category: { label: string; tone: 'emerald' | 'blue' | 'amber' | 'rose'; description: string };
    if (finalScore >= 85) {
      category = {
        label: 'Excelente Saúde',
        tone: 'emerald',
        description: 'Fluxo superavitário, metas no alvo e DAS em dia!'
      };
    } else if (finalScore >= 70) {
      category = {
        label: 'Saudável & Estável',
        tone: 'blue',
        description: 'Bons resultados operacionais com estabilidade de margem.'
      };
    } else if (finalScore >= 50) {
      category = {
        label: 'Requer Atenção',
        tone: 'amber',
        description: 'Monitore despesas fixas para proteger sua rentabilidade líquida.'
      };
    } else {
      category = {
        label: 'Nível de Alerta',
        tone: 'rose',
        description: 'Faturamento abaixo do ponto de equilíbrio ou despesas elevadas.'
      };
    }

    // Dicas personalizadas
    const tips: string[] = [];
    if (isDasPaid) {
      tips.push('DAS de Junho/2026 liquidado: Direitos previdenciários e CNPJ 100% regulares.');
    } else {
      tips.push('Lembrete: Mantenha o DAS mensal em dia para garantir seus benefícios e evitar juros.');
    }

    if (margin >= 30) {
      tips.push(`Margem líquida de ${margin.toFixed(1)}% supera a média padrão do setor de marcenaria/serviços.`);
    } else if (margin < 15 && rev > 0) {
      tips.push('Dica: Reduza custos de insumos ou reajuste sua tabela para recuperar margem.');
    }

    if (limitPercent > 85) {
      tips.push(`Faturamento do mês atingiu ${limitPercent.toFixed(1)}% do limite médio mensal do MEI (R$ 6.750,00).`);
    }

    return {
      monthlyRevenue: rev,
      monthlyExpenses: exp,
      monthlyNetProfit: netProfit,
      profitMarginPercent: margin,
      monthlyGoalTarget: goalTarget,
      goalRealizationPercent: goalPercent,
      limitProportionPercent: limitPercent,
      currentDasStatus: das?.status || 'Pendente',
      healthScore: finalScore,
      healthCategory: category,
      healthTips: tips
    };
  }, [transactions, dasPayments, goals, currentMonth]);

  // Cores dinâmicas para o mostrador
  const toneColors = {
    emerald: {
      stroke: '#2dd683',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
      gradient: 'from-emerald-500 to-[#004AAD]'
    },
    blue: {
      stroke: '#004AAD',
      text: 'text-[#004AAD] dark:text-blue-400',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
      gradient: 'from-[#004AAD] to-[#5E17EB]'
    },
    amber: {
      stroke: '#f59e0b',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
      gradient: 'from-amber-500 to-amber-600'
    },
    rose: {
      stroke: '#ef4444',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
      gradient: 'from-rose-500 to-rose-600'
    }
  }[healthCategory.tone];

  // Cálculo do arco SVG de 0 a 100% (Semicírculo 180 graus ou círculo completo de progresso)
  // Raio = 42, Circunferência = 2 * Math.PI * 42 = 263.89
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between transition duration-200 relative overflow-hidden">
      
      {/* Background soft ambient glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#2dd683]/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

      <div>
        {/* Header do Card */}
        <div className="flex justify-between items-start mb-1 select-none">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-violet-50 text-[#5E17EB] border border-violet-100 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 font-display flex items-center">
                Saúde Financeira
                <InfoTooltip text="Faturamento Real vs Limite DAS & Metas" />
              </span>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 select-none shrink-0 ${toneColors.badge}`}>
            <Sparkles className="w-3 h-3" />
            {healthCategory.label}
          </span>
        </div>

        <div className="h-[0.8px] w-full bg-logo-gradient my-3.5 rounded-full shadow-xs" />

        {/* Gauge Circular Medidor 0 a 100% */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-4">
          
          {/* Radial Progress Ring */}
          <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress dynamic arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={toneColors.stroke}
                strokeWidth="8.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 leading-none">
                {healthScore}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Índice Score
              </span>
            </div>
          </div>

          {/* Breakdown dos 3 Pilares */}
          <div className="w-full space-y-2.5 text-xs">
            
            {/* 1. Proporção Faturamento vs Limite DAS/Metas */}
            <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#5E17EB] shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Real vs Limite DAS
                  </span>
                  <span className="text-[9px] text-slate-400">
                    R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} / R$ {MEI_MONTHLY_LIMIT.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <span className={`font-mono font-bold text-xs ${
                limitProportionPercent <= 100 ? 'text-emerald-600' : 'text-amber-500'
              }`}>
                {limitProportionPercent.toFixed(0)}%
              </span>
            </div>

            {/* 2. Margem de Lucro Líquida */}
            <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#004AAD] shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Margem Líquida
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Lucro de R$ {monthlyNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <span className={`font-mono font-bold text-xs ${profitMarginPercent >= 20 ? 'text-emerald-600' : 'text-slate-600'}`}>
                {profitMarginPercent.toFixed(1)}%
              </span>
            </div>

            {/* 3. Regularidade DAS */}
            <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${currentDasStatus === 'PAGO' ? 'text-emerald-500' : 'text-amber-500'} shrink-0`} />
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">
                    DAS MEI Mensal
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Ref: 06/2026
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentDasStatus === 'PAGO'
                  ? 'bg-emerald-100/60 text-emerald-800'
                  : 'bg-amber-100/60 text-amber-800'
              }`}>
                {currentDasStatus === 'PAGO' ? 'Pago em Dia' : 'A Vencer / Pendente'}
              </span>
            </div>

          </div>

        </div>

        {/* Diagnóstico contextual */}
        <div className="mt-3 p-3 bg-slate-50/60 rounded-xl border border-slate-150/70 text-[11px] text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#004AAD] shrink-0" />
            <span>Diagnóstico do Negócio: {healthCategory.description}</span>
          </p>
          {healthTips.map((tip, idx) => (
            <p key={idx} className="text-[10px] text-slate-500 pl-5">
              • {tip}
            </p>
          ))}
        </div>
      </div>

      {/* Botão de Ação rápida com a mesma altura padronizada h-11 */}
      {onNavigate && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onNavigate('metas')}
            className="w-full h-11 px-4 rounded-xl font-bold text-xs text-white bg-[#5E17EB] hover:bg-[#4d11c7] transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Ver Metas e Planejamento Financeiro</span>
            <ArrowUpRight className="w-4 h-4 text-[#2dd683]" />
          </button>
        </div>
      )}

    </div>
  );
}
