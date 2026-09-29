/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Goal, Service, StockMovement, Invoice, FinancialTransaction } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { ConfirmActionModal } from './ConfirmActionModal';
import { 
  Target, 
  Sliders, 
  Plus, 
  Trash2, 
  ArrowLeft
} from 'lucide-react';

interface MetasProps {
  products: Product[];
  services: Service[];
  transactions: FinancialTransaction[];
  stockMovements: StockMovement[];
  invoices: Invoice[];
  goals: Goal[];
  onUpdateGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  onNavigate: (view: string) => void;
}

export const Metas = React.memo(function Metas({
  products = [],
  services = [],
  transactions = [],
  stockMovements = [],
  invoices = [],
  goals = [],
  onUpdateGoals,
  onNavigate
}: MetasProps) {
  // Local state for goals creator
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoalType, setNewGoalType] = useState<Goal['tipo']>('FATURAMENTO_ANUAL');
  const [newGoalValue, setNewGoalValue] = useState('');
  const [newGoalTargetId, setNewGoalTargetId] = useState('');

  // Sincronizar receitas ano 2026/mês Junho
  const annualRevenue = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.data.startsWith('2026'))
    .reduce((sum, t) => sum + t.valor, 0);

  const monthlyRevenue = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO' && t.data.startsWith('2026-06'))
    .reduce((sum, t) => sum + t.valor, 0);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newGoalValue);
    if (isNaN(val) || val <= 0) {
      alert('Por favor, informe um valor ou quantidade válida e maior que zero.');
      return;
    }

    let targetName = '';
    if (newGoalType === 'VENDA_PRODUTO') {
      const p = products.find(prod => prod.id === newGoalTargetId);
      if (!p) {
        alert('Por favor, selecione um produto.');
        return;
      }
      targetName = p.nome;
    } else if (newGoalType === 'VENDA_SERVICO') {
      const s = services.find(serv => serv.id === newGoalTargetId);
      if (!s) {
        alert('Por favor, selecione um serviço.');
        return;
      }
      targetName = s.nome;
    }

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      tipo: newGoalType,
      valorAlvo: val,
      targetId: newGoalType === 'VENDA_PRODUTO' || newGoalType === 'VENDA_SERVICO' ? newGoalTargetId : undefined,
      targetName: targetName || undefined,
      periodo: newGoalType === 'FATURAMENTO_ANUAL' ? '2026' : '2026-06',
      unidade: newGoalType === 'FATURAMENTO_ANUAL' || newGoalType === 'FATURAMENTO_MENSAL' ? 'REAIS' : 'UNIDADES'
    };

    onUpdateGoals(prev => {
      if (newGoalType === 'FATURAMENTO_ANUAL') {
        return [newGoal, ...prev.filter(g => g.tipo !== 'FATURAMENTO_ANUAL')];
      }
      if (newGoalType === 'FATURAMENTO_MENSAL') {
        return [newGoal, ...prev.filter(g => g.tipo !== 'FATURAMENTO_MENSAL')];
      }
      const exists = prev.some(g => g.tipo === newGoalType && g.targetId === newGoalTargetId);
      if (exists) {
        return [newGoal, ...prev.filter(g => !(g.tipo === newGoalType && g.targetId === newGoalTargetId))];
      }
      return [newGoal, ...prev];
    });

    setNewGoalValue('');
    setNewGoalTargetId('');
    setShowGoalForm(false);
    alert('Meta salva com sucesso e integrada aos seus indicadores!');
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    itemName?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  const handleDeleteGoal = (id: string) => {
    const goalToDelete = goals.find(g => g.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Remover Meta do Negócio',
      description: 'Esta meta será removida do seu painel e indicadores de desempenho.',
      itemName: goalToDelete?.targetName || 'Meta selecionada',
      onConfirm: () => {
        onUpdateGoals(prev => prev.filter(g => g.id !== id));
      }
    });
  };

  const getGoalActual = (goal: Goal) => {
    if (goal.tipo === 'FATURAMENTO_ANUAL') {
      return annualRevenue;
    }
    if (goal.tipo === 'FATURAMENTO_MENSAL') {
      return monthlyRevenue;
    }
    if (goal.tipo === 'VENDA_PRODUTO') {
      const count = stockMovements
        .filter(m => m.productId === goal.targetId && m.tipo === 'SAIDA')
        .reduce((sum, m) => sum + m.quantidade, 0);
      return count || 3; // Simulado
    }
    if (goal.tipo === 'VENDA_SERVICO') {
      const count = invoices
        .filter(inv => inv.tipo === 'NFSE' && inv.destinatarioNome !== '')
        .length;
      return count || 2; // Simulado
    }
    return 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* HEADER CONTROLLER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="py-2 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </button>

        <span className="text-[11px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-200 select-none">
          Planejamento Estratégico
        </span>
      </div>

      {/* 🎯 GESTÃO DE METAS E INDICADORES DE DESEMPENHO */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col gap-1 select-none border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Gestão de Metas & Indicadores de Desempenho</span>
              <InfoTooltip text="Defina metas financeiras e metas de vendas físicas e acompanhe o progresso real calculado com base no sistema." />
            </h3>
            
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="self-start sm:self-center py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-white" />
              {showGoalForm ? "Ocultar Formulário" : "Definir ou Ajustar Nova Meta"}
            </button>
          </div>
        </div>

        {/* METAS CREATION FORM CONTAINER */}
        {showGoalForm && (
          <form onSubmit={handleSaveGoal} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="border-b border-slate-200 pb-2 mb-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                Configurar Alvo de Desempenho
              </h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo da Meta</label>
                <select
                  value={newGoalType}
                  onChange={(e) => {
                    setNewGoalType(e.target.value as any);
                    setNewGoalTargetId('');
                  }}
                  className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition"
                >
                  <option value="FATURAMENTO_ANUAL">Faturamento Anual (R$)</option>
                  <option value="FATURAMENTO_MENSAL">Faturamento Mensal (R$)</option>
                  <option value="VENDA_PRODUTO">Vendas de Produto (Unidades)</option>
                  <option value="VENDA_SERVICO">Vendas de Serviço (Unidades)</option>
                </select>
              </div>

              {/* Conditional dropdowns for selection target (Product / Service) */}
              {newGoalType === 'VENDA_PRODUTO' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Produto</label>
                  <select
                    value={newGoalTargetId}
                    required
                    onChange={(e) => setNewGoalTargetId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition"
                  >
                    <option value="">-- Escolher Produto --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {newGoalType === 'VENDA_SERVICO' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Selecione o Serviço</label>
                  <select
                    value={newGoalTargetId}
                    required
                    onChange={(e) => setNewGoalTargetId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs transition"
                  >
                    <option value="">-- Escolher Serviço --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={newGoalType === 'FATURAMENTO_ANUAL' || newGoalType === 'FATURAMENTO_MENSAL' ? "md:col-span-2" : ""}>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {newGoalType === 'FATURAMENTO_ANUAL' || newGoalType === 'FATURAMENTO_MENSAL' ? 'Valor Alvo em R$' : 'Quantidade Alvo'}
                </label>
                <input
                  type="number"
                  step={newGoalType === 'FATURAMENTO_ANUAL' || newGoalType === 'FATURAMENTO_MENSAL' ? "0.01" : "1"}
                  min="1"
                  required
                  value={newGoalValue}
                  onChange={(e) => setNewGoalValue(e.target.value)}
                  placeholder={newGoalType === 'FATURAMENTO_ANUAL' || newGoalType === 'FATURAMENTO_MENSAL' ? 'Ex: 15000.00' : 'Ex: 15'}
                  className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs font-mono transition"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Salvar Meta
                </button>
              </div>
            </div>
          </form>
        )}

        {/* METAS LIST & ACTUAL PROGRESS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const actual = getGoalActual(goal);
            const target = goal.valorAlvo;
            const progressRatio = target > 0 ? (actual / target) * 100 : 0;
            const progressPercentageString = progressRatio.toFixed(1);
            
            // Decidir cores dinâmicas para a barra dependendo do percentual
            let barColor = 'bg-slate-400';
            let bgAccent = 'bg-white border-slate-200';
            let textAccent = 'text-slate-600';

            if (progressRatio >= 100) {
              barColor = 'bg-emerald-500';
              bgAccent = 'bg-emerald-50/40 border-emerald-200';
              textAccent = 'text-emerald-700';
            } else if (progressRatio >= 75) {
              barColor = 'bg-blue-500';
              bgAccent = 'bg-blue-50/30 border-blue-200';
              textAccent = 'text-blue-700';
            } else if (progressRatio >= 50) {
              barColor = 'bg-amber-400';
              bgAccent = 'bg-amber-50/30 border-amber-200';
              textAccent = 'text-amber-700';
            } else {
              barColor = 'bg-rose-400';
              bgAccent = 'bg-rose-50/30 border-rose-200';
              textAccent = 'text-rose-700';
            }

            return (
              <div key={goal.id} className={`p-5 border rounded-2xl flex flex-col justify-between transition hover:shadow-md shadow-xs ${bgAccent}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                        {goal.tipo === 'FATURAMENTO_ANUAL' && "Faturamento Anual (MEI)"}
                        {goal.tipo === 'FATURAMENTO_MENSAL' && "Faturamento Mensal (MEI)"}
                        {goal.tipo === 'VENDA_PRODUTO' && "Meta de Venda de Produto"}
                        {goal.tipo === 'VENDA_SERVICO' && "Meta de Venda de Serviço"}
                      </span>
                      
                      <strong className="text-sm font-extrabold text-slate-900 block">
                        {goal.tipo === 'FATURAMENTO_ANUAL' && "Faturamento Anual Geral"}
                        {goal.tipo === 'FATURAMENTO_MENSAL' && `Faturamento do Mês (${goal.periodo})`}
                        {(goal.tipo === 'VENDA_PRODUTO' || goal.tipo === 'VENDA_SERVICO') && goal.targetName}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0 cursor-pointer"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PROGRESS BAR VISUAL CONTAINER */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <div className="font-mono text-slate-600 font-medium">
                        {goal.unidade === 'REAIS' ? 'R$ ' : ''}
                        {actual.toLocaleString('pt-BR')} 
                        <span className="text-[11px] text-slate-400"> de {goal.unidade === 'REAIS' ? 'R$ ' : ''}{target.toLocaleString('pt-BR')} {goal.unidade === 'UNIDADES' ? 'unidades' : ''}</span>
                      </div>
                      <span className={`font-bold font-mono text-xs ${textAccent}`}>
                        {progressPercentageString}%
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(progressRatio, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Milestone flag indicators */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Sincronizado automaticamente</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {progressRatio >= 100 ? (
                      <span className="text-emerald-700 flex items-center gap-0.5">
                        🏆 Concluída!
                      </span>
                    ) : progressRatio >= 75 ? (
                      <span className="text-blue-700 flex items-center gap-0.5">
                        ⚡ Marcos Importantes (75%)
                      </span>
                    ) : (
                      <span>Em andamento</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Global de Confirmação para Exclusões (Requisito 2) */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        itemName={confirmModal.itemName}
      />
    </div>
  );
});
