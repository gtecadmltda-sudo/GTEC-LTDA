/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { FinancialTransaction } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Sparkles, 
  Info,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MonthlyRevenueD3ChartProps {
  transactions: FinancialTransaction[];
  monthlyGoal?: number;
}

interface MonthRevenueData {
  monthKey: string;      // e.g. "2026-01"
  monthLabel: string;    // e.g. "Jan/26"
  fullMonthName: string; // e.g. "Janeiro de 2026"
  revenue: number;
  count: number;
  paidRevenue: number;
  pendingRevenue: number;
  growthMoM: number | null; // % relative to previous month
}

export function MonthlyRevenueD3Chart({ 
  transactions = [], 
  monthlyGoal = 6750.00 
}: MonthlyRevenueD3ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);
  const [showGoalLine, setShowGoalLine] = useState<boolean>(true);
  const showValueLabels = true;
  const [revenueFilter, setRevenueFilter] = useState<'all' | 'paid'>('all');
  const [hoveredData, setHoveredData] = useState<MonthRevenueData | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 600, height: 320 });

  // 1. Process and extract the last 6 months of revenue
  const monthlyData = useMemo<MonthRevenueData[]>(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const fullNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Find all distinct months from transactions or default to Jan-Jun 2026
    const allMonthsSet = new Set<string>();
    (transactions || []).forEach(t => {
      if (t.data && t.data.length >= 7) {
        allMonthsSet.add(t.data.substring(0, 7));
      }
    });

    // Default base list if not enough data
    const defaultMonths = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
    defaultMonths.forEach(m => allMonthsSet.add(m));

    const sortedMonths = Array.from(allMonthsSet).sort();
    // Get the last 6 months
    const targetMonths = sortedMonths.slice(-6);

    let previousRevenue: number | null = null;

    return targetMonths.map((mKey) => {
      const [yearStr, monthStr] = mKey.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const yearShort = yearStr.substring(2);

      const monthTransactions = transactions.filter(t => 
        t.tipo === 'RECEITA' && 
        t.data && 
        t.data.startsWith(mKey)
      );

      const paidRevenue = monthTransactions
        .filter(t => t.status === 'PAGO')
        .reduce((sum, t) => sum + t.valor, 0);

      const pendingRevenue = monthTransactions
        .filter(t => t.status === 'PENDENTE')
        .reduce((sum, t) => sum + t.valor, 0);

      const totalRevenue = revenueFilter === 'paid' ? paidRevenue : (paidRevenue + pendingRevenue);
      const count = monthTransactions.length;

      let growthMoM: number | null = null;
      if (previousRevenue !== null) {
        if (previousRevenue === 0) {
          growthMoM = totalRevenue > 0 ? 100 : 0;
        } else {
          growthMoM = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
        }
      }
      previousRevenue = totalRevenue;

      return {
        monthKey: mKey,
        monthLabel: `${monthNames[monthIndex]}/${yearShort}`,
        fullMonthName: `${fullNames[monthIndex]} de ${yearStr}`,
        revenue: totalRevenue,
        paidRevenue,
        pendingRevenue,
        count,
        growthMoM
      };
    });
  }, [transactions, revenueFilter]);

  // Key KPI metrics for the 6-month period
  const totalRevenuePeriod = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [monthlyData]);

  const averageMonthlyRevenue = useMemo(() => {
    return monthlyData.length > 0 ? totalRevenuePeriod / monthlyData.length : 0;
  }, [totalRevenuePeriod, monthlyData]);

  const bestMonth = useMemo(() => {
    if (monthlyData.length === 0) return null;
    return [...monthlyData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [monthlyData]);

  const latestMonth = monthlyData[monthlyData.length - 1];

  // 2. Observe container resize for true responsive D3 rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const width = Math.max(300, entry.contentRect.width);
      setDimensions({ width, height: 320 });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || monthlyData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const { width, height } = dimensions;
    const margin = { 
      top: 35, 
      right: width < 500 ? 15 : 25, 
      bottom: 45, 
      left: width < 500 ? 55 : 70 
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    // SVG Defs (Gradients & Filters)
    const defs = svg.append('defs');

    // Bar Primary Green (#2dd683) Gradient
    const barGradient = defs.append('linearGradient')
      .attr('id', 'd3-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    barGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#2dd683')
      .attr('stop-opacity', 1);

    barGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1db96e')
      .attr('stop-opacity', 0.95);

    // Hover Highlight Gradient
    const hoverGradient = defs.append('linearGradient')
      .attr('id', 'd3-bar-hover-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    hoverGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#5E17EB')
      .attr('stop-opacity', 1);

    hoverGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2dd683')
      .attr('stop-opacity', 1);

    // Best Month Gradient (Secondary Purple #5E17EB -> Complementary #cb6ce6)
    const bestMonthGradient = defs.append('linearGradient')
      .attr('id', 'd3-bar-best-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    bestMonthGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#cb6ce6')
      .attr('stop-opacity', 1);

    bestMonthGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#5E17EB')
      .attr('stop-opacity', 1);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(monthlyData.map(d => d.monthLabel))
      .range([0, innerWidth])
      .padding(width < 500 ? 0.28 : 0.35);

    const maxRevenue = d3.max(monthlyData, (d: MonthRevenueData) => d.revenue) ?? 1000;
    const yMax = Math.max(Number(maxRevenue) * 1.2, monthlyGoal * 1.15, 2000);

    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([innerHeight, 0])
      .nice();

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(5);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .tickSize(0)
      .tickPadding(12);

    const xAxisG = g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG.select('.domain')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5);

    xAxisG.selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', width < 500 ? '11px' : '12px')
      .attr('font-weight', '700')
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(0)
      .tickPadding(8)
      .tickFormat((d) => {
        const num = d.valueOf();
        if (num >= 1000) {
          return `R$ ${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
        }
        return `R$ ${num}`;
      });

    const yAxisG = g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    yAxisG.select('.domain').remove();

    yAxisG.selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '10.5px')
      .attr('font-weight', '600')
      .attr('font-family', 'ui-monospace, monospace');

    // Reference Line: Monthly Goal (Meta Legal / Planejada - Secondary Purple #5E17EB)
    if (showGoalLine && monthlyGoal > 0 && monthlyGoal <= yMax) {
      const goalY = yScale(monthlyGoal);
      const goalGroup = g.append('g').attr('class', 'goal-reference-line');

      goalGroup.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', goalY)
        .attr('y2', goalY)
        .attr('stroke', '#5E17EB')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.9);

      goalGroup.append('rect')
        .attr('x', innerWidth - (width < 500 ? 100 : 125))
        .attr('y', goalY - 18)
        .attr('width', width < 500 ? 98 : 122)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#f3ecfd')
        .attr('stroke', '#ddd0fb')
        .attr('stroke-width', 1);

      goalGroup.append('text')
        .attr('x', innerWidth - 5)
        .attr('y', goalY - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#5E17EB')
        .attr('font-size', '9.5px')
        .attr('font-weight', '700')
        .text(`Meta: R$ ${monthlyGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`);
    }

    // Reference Line: 6-Month Average (Secondary Blue #004AAD)
    if (showAverageLine && averageMonthlyRevenue > 0) {
      const avgY = yScale(averageMonthlyRevenue);
      const avgGroup = g.append('g').attr('class', 'avg-reference-line');

      avgGroup.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', avgY)
        .attr('y2', avgY)
        .attr('stroke', '#004AAD')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.9);

      avgGroup.append('rect')
        .attr('x', 6)
        .attr('y', avgY - 18)
        .attr('width', width < 500 ? 96 : 120)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#e6effa')
        .attr('stroke', '#b8d4f6')
        .attr('stroke-width', 1);

      avgGroup.append('text')
        .attr('x', 12)
        .attr('y', avgY - 6)
        .attr('text-anchor', 'start')
        .attr('fill', '#004AAD')
        .attr('font-size', '9.5px')
        .attr('font-weight', '700')
        .text(`Média: R$ ${averageMonthlyRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`);
    }

    // Bars Container
    const barsGroup = g.append('g').attr('class', 'bars');

    const maxVal = Number(d3.max(monthlyData, (d: MonthRevenueData) => d.revenue) ?? 0);

    // Draw Bars with transition
    const barGroups = barsGroup.selectAll<SVGGElement, MonthRevenueData>('.bar-group')
      .data(monthlyData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .style('cursor', 'pointer');

    // Background track hover column
    barGroups.append('rect')
      .attr('class', 'bar-track')
      .attr('x', (d: MonthRevenueData) => (xScale(d.monthLabel) || 0) - (xScale.bandwidth() * 0.15))
      .attr('y', 0)
      .attr('width', xScale.bandwidth() * 1.3)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('rx', 8)
      .on('mouseenter', function(this: SVGRectElement, _event: MouseEvent, d: MonthRevenueData) {
        setHoveredData(d);
        const parent = this.parentNode as SVGGElement | null;
        if (parent) {
          d3.select(parent)
            .select('.main-bar')
            .transition()
            .duration(150)
            .attr('fill', 'url(#d3-bar-hover-gradient)')
            .attr('transform', 'scale(1.02)')
            .attr('transform-origin', `${(xScale(d.monthLabel) || 0) + xScale.bandwidth() / 2} ${innerHeight}`);
        }
      })
      .on('mouseleave', function(this: SVGRectElement, _event: MouseEvent, d: MonthRevenueData) {
        setHoveredData(null);
        const parent = this.parentNode as SVGGElement | null;
        if (parent) {
          d3.select(parent)
            .select('.main-bar')
            .transition()
            .duration(150)
            .attr('fill', d.revenue === maxVal && maxVal > 0 ? 'url(#d3-bar-best-gradient)' : 'url(#d3-bar-gradient)')
            .attr('transform', 'scale(1)');
        }
      });

    // Visible Bar Rectangles
    const bars = barGroups.append('rect')
      .attr('class', 'main-bar')
      .attr('x', (d: MonthRevenueData) => xScale(d.monthLabel) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight) // Initial for transition
      .attr('height', 0)      // Initial for transition
      .attr('rx', Math.min(6, xScale.bandwidth() / 4))
      .attr('fill', (d: MonthRevenueData) => d.revenue === maxVal && maxVal > 0 ? 'url(#d3-bar-best-gradient)' : 'url(#d3-bar-gradient)')
      .attr('filter', 'drop-shadow(0 2px 4px rgba(16,185,129,0.15))');

    // Transition animation for bar height
    bars.transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .delay((_: unknown, i: number) => i * 60)
      .attr('y', (d: MonthRevenueData) => yScale(d.revenue))
      .attr('height', (d: MonthRevenueData) => Math.max(0, innerHeight - yScale(d.revenue)));

    // Value Labels on Top of Bars
    if (showValueLabels) {
      const labels = barGroups.append('text')
        .attr('class', 'bar-label')
        .attr('x', (d: MonthRevenueData) => (xScale(d.monthLabel) || 0) + xScale.bandwidth() / 2)
        .attr('y', innerHeight) // Initial for transition
        .attr('text-anchor', 'middle')
        .attr('fill', '#0f172a')
        .attr('font-size', width < 500 ? '9.5px' : '11px')
        .attr('font-weight', '800')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('opacity', 0)
        .text((d: MonthRevenueData) => `R$ ${(d.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`);

      labels.transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .delay((_: unknown, i: number) => i * 60 + 200)
        .attr('y', (d: MonthRevenueData) => Math.max(16, yScale(d.revenue) - 8))
        .attr('opacity', 1);
    }

    // Highlight Trophy Icon for Best Month on top
    if (bestMonth && bestMonth.revenue > 0) {
      const bestX = (xScale(bestMonth.monthLabel) || 0) + xScale.bandwidth() / 2;
      const bestY = Math.max(10, yScale(bestMonth.revenue) - (showValueLabels ? 22 : 12));

      const crownGroup = g.append('g')
        .attr('class', 'best-month-badge')
        .attr('opacity', 0);

      crownGroup.append('circle')
        .attr('cx', bestX)
        .attr('cy', bestY)
        .attr('r', 8)
        .attr('fill', '#ecfdf5')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 1.5);

      crownGroup.append('text')
        .attr('x', bestX)
        .attr('y', bestY + 3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .text('★')
        .attr('fill', '#059669')
        .attr('font-weight', 'bold');

      crownGroup.transition()
        .duration(600)
        .delay(650)
        .attr('opacity', 1);
    }

  }, [dimensions, monthlyData, showAverageLine, showGoalLine, showValueLabels, averageMonthlyRevenue, monthlyGoal, bestMonth]);

  return (
    <div 
      id="d3-monthly-revenue-chart-card"
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-left transition"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#2dd683] text-[#000000] rounded-xl shadow-xs font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#000000] font-display flex items-center">
                  Faturamento Mensal (Últimos 6 Meses)
                  <InfoTooltip text="Acompanhamento analítico e evolução do faturamento bruto no último semestre" />
                </h3>
                <span className="text-[10px] bg-[#f3ecfd] text-[#5E17EB] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-[#ddd0fb]">
                  <Sparkles className="w-3 h-3 text-[#5E17EB]" /> D3.js Visualizer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and toggle controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Revenue type filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="d3-filter-all-btn"
              type="button"
              onClick={() => setRevenueFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                revenueFilter === 'all'
                  ? 'bg-[#000000] text-[#2dd683] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas Receitas
            </button>
            <button
              id="d3-filter-paid-btn"
              type="button"
              onClick={() => setRevenueFilter('paid')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                revenueFilter === 'paid'
                  ? 'bg-[#000000] text-[#2dd683] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apenas Compensadas
            </button>
          </div>

          {/* Average line toggle */}
          <button
            id="d3-toggle-avg-line-btn"
            type="button"
            onClick={() => setShowAverageLine(!showAverageLine)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              showAverageLine
                ? 'bg-[#e6effa] border-[#b8d4f6] text-[#004AAD]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Exibir ou ocultar linha de média semestral"
          >
            <span className="w-2 h-2 rounded-full bg-[#004AAD]" />
            Média
          </button>

          {/* Goal line toggle */}
          <button
            id="d3-toggle-goal-line-btn"
            type="button"
            onClick={() => setShowGoalLine(!showGoalLine)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              showGoalLine
                ? 'bg-[#f3ecfd] border-[#ddd0fb] text-[#5E17EB]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Exibir ou ocultar meta mensal de faturamento"
          >
            <span className="w-2 h-2 rounded-full bg-[#5E17EB]" />
            Meta MEI
          </button>
        </div>
      </div>

      {/* KPI Cards Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total 6 Months */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
            <span>Total no Semestre</span>
            <DollarSign className="w-4 h-4 text-[#2dd683]" />
          </div>
          <div className="text-lg font-black font-mono text-[#000000]">
            R$ {totalRevenuePeriod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">
            Soma dos últimos 6 meses
          </div>
        </div>

        {/* KPI 2: Average Monthly */}
        <div className="bg-[#e6effa]/40 p-4 rounded-xl border border-[#b8d4f6]/60">
          <div className="flex items-center justify-between text-xs text-[#004AAD] mb-1 font-bold">
            <span>Média Mensal</span>
            <TrendingUp className="w-4 h-4 text-[#004AAD]" />
          </div>
          <div className="text-lg font-black font-mono text-[#004AAD]">
            R$ {averageMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-600 mt-1 font-medium">
            {averageMonthlyRevenue >= monthlyGoal ? (
              <span className="text-[#000000] font-bold bg-[#2dd683]/30 px-1.5 py-0.5 rounded">Acima da meta mensal</span>
            ) : (
              <span className="text-slate-600">Referência: R$ {monthlyGoal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês</span>
            )}
          </div>
        </div>

        {/* KPI 3: Best Month */}
        <div className="bg-[#f3ecfd]/40 p-4 rounded-xl border border-[#ddd0fb]/60">
          <div className="flex items-center justify-between text-xs text-[#5E17EB] mb-1 font-bold">
            <span>Melhor Mês</span>
            <Award className="w-4 h-4 text-[#5E17EB]" />
          </div>
          <div className="text-lg font-black font-mono text-[#5E17EB] truncate">
            {bestMonth ? bestMonth.monthLabel : '-'}
          </div>
          <div className="text-[10px] text-slate-700 font-bold mt-1">
            R$ {(bestMonth?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* KPI 4: Latest Month & MoM Growth */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
            <span>Mês Atual ({latestMonth?.monthLabel || 'Recente'})</span>
            {latestMonth?.growthMoM !== null && latestMonth?.growthMoM !== undefined ? (
              latestMonth.growthMoM >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-[#2dd683]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
              )
            ) : (
              <Calendar className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="text-lg font-black font-mono text-[#000000]">
            R$ {(latestMonth?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] font-bold mt-1">
            {latestMonth?.growthMoM !== null && latestMonth?.growthMoM !== undefined ? (
              latestMonth.growthMoM >= 0 ? (
                <span className="text-[#000000] bg-[#2dd683]/30 px-1.5 py-0.5 rounded font-bold">+{latestMonth.growthMoM.toFixed(1)}% vs mês ant.</span>
              ) : (
                <span className="text-rose-700 font-bold">{latestMonth.growthMoM.toFixed(1)}% vs mês ant.</span>
              )
            ) : (
              <span className="text-slate-500">Mês inicial de apuração</span>
            )}
          </div>
        </div>
      </div>

      {/* D3 Chart Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full relative bg-slate-50/50 rounded-2xl p-2 border border-slate-200/80 min-h-[320px] flex items-center justify-center overflow-hidden"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible select-none max-w-full"
        />

        {/* Interactive Floating Hover Details Card */}
        {hoveredData && (
          <div 
            ref={tooltipRef}
            className="absolute bottom-4 right-4 bg-[#000000] text-white p-4 rounded-2xl shadow-xl border border-slate-800 text-xs w-64 space-y-2 pointer-events-none animate-in fade-in duration-150 z-20"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-extrabold text-[#2dd683] uppercase tracking-wide text-[11px]">
                {hoveredData.fullMonthName}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {hoveredData.count} {hoveredData.count === 1 ? 'venda' : 'vendas'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Faturamento Total:</span>
                <span className="font-bold font-mono text-[#2dd683] text-sm">
                  R$ {hoveredData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {hoveredData.pendingRevenue > 0 && (
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="text-slate-400">A Compensar (Pendente):</span>
                  <span className="font-mono text-[#cb6ce6]">
                    R$ {hoveredData.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-[10.5px] border-t border-slate-800/80 pt-1">
                <span className="text-slate-400">Variação MoM:</span>
                <span className={`font-bold font-mono ${
                  hoveredData.growthMoM === null
                    ? 'text-slate-400'
                    : hoveredData.growthMoM >= 0
                      ? 'text-[#2dd683]'
                      : 'text-rose-400'
                }`}>
                  {hoveredData.growthMoM !== null
                    ? `${hoveredData.growthMoM >= 0 ? '+' : ''}${hoveredData.growthMoM.toFixed(1)}%`
                    : 'Base inicial'}
                </span>
              </div>

              <div className="flex justify-between items-center text-[10.5px]">
                <span className="text-slate-400">Meta Mensal MEI:</span>
                <span className="font-mono text-slate-300">
                  {((hoveredData.revenue / monthlyGoal) * 100).toFixed(0)}% da meta
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Legend / Insights */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#2dd683] shrink-0" />
            <span className="font-bold text-[#000000]">Faturamento Bruto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#5E17EB] shrink-0" />
            <span className="font-bold text-[#5E17EB]">Destaque (Recorde)</span>
          </div>
          {showAverageLine && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#004AAD] shrink-0" />
              <span className="font-bold text-[#004AAD]">Média Semestral</span>
            </div>
          )}
          {showGoalLine && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#5E17EB] shrink-0" />
              <span className="font-bold text-[#5E17EB]">Meta MEI (R$ 6.750,00)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Renderizado via D3.js com dados em tempo real</span>
        </div>
      </div>
    </div>
  );
}
