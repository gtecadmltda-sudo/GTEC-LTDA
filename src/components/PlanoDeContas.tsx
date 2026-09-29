/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { FinancialCategory } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { ActionButton } from './ActionButton';
import {
  BookOpen,
  Plus,
  Check,
  Edit2,
  X,
  Star,
  Layers,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Search,
  Sparkles,
  Trash2,
  ArrowUpDown,
  Tag,
  CornerDownRight
} from 'lucide-react';
import { ResponsiveModal } from './ResponsiveModal';
import { ConfirmActionModal } from './ConfirmActionModal';

interface PlanoDeContasProps {
  categories: FinancialCategory[];
  onAddCategory: (c: FinancialCategory) => void;
  onUpdateCategory: (id: string, updated: Partial<FinancialCategory>) => void;
  onDeleteCategory: (id: string) => void;
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO', descricao: string) => void;
}

const SUBGRUPOS_RECEITA = [
  { prefix: '1.1', label: '1.1 - Vendas de Mercadorias e Produtos' },
  { prefix: '1.2', label: '1.2 - Prestação de Serviços em Geral' },
  { prefix: '1.3', label: '1.3 - Rendimentos de Aplicações Financeiras e similares' },
  { prefix: '1.4', label: '1.4 - Outras Receitas' }
];

const SUBGRUPOS_DESPESA = [
  { prefix: '2.1', label: '2.1 - Custos com Mercadorias e Insumos de Produção (CMV)' },
  { prefix: '2.2', label: '2.2 - Despesas Operacionais e Fixas (Aluguel, Luz, Internet, Água)' },
  { prefix: '2.3', label: '2.3 - Marketing, Publicidade, Divulgação e Feiras' },
  { prefix: '2.4', label: '2.4 - Tributos e Guias Fiscais (DAS Simples Nacional, Taxas)' },
  { prefix: '2.5', label: '2.5 - Tarifas Bancárias, Juros e Maquininhas de Cartão' },
  { prefix: '2.6', label: '2.6 - Manutenção, Ferramentas, Veículos e Equipamentos' },
  { prefix: '2.7', label: '2.7 - Pró-Labore & Retiradas de Sócios' },
  { prefix: '2.7.1', label: '2.7.1 - Pessoal (Ordens de Pagamento/Salário)' }
];

const CENTROS_DE_CUSTO_OPCOES = [
  'Operacional',
  'Administrativo',
  'Comercial',
  'Financeiro',
  'Produção',
  'Logística',
  'Impostos',
  'Geral'
];

export const PlanoDeContas = React.memo(function PlanoDeContas({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  addLog
}: PlanoDeContasProps) {
  // Single Unified Genealogical Tree Expanded State
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'ROOT': true,
    'RECEITAS': true,
    'DESPESAS': true,
    '1.1': true,
    '1.2': true,
    '1.2.1': true,
    '2.1': true,
    '2.2': true,
    '2.2.1': true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [catTipo, setCatTipo] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [catSubgrupo, setCatSubgrupo] = useState('1.1');
  const [catCentro, setCatCentro] = useState('Operacional');
  const [customCentro, setCustomCentro] = useState('');
  const [catNome, setCatNome] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState('');
  const [editingCentro, setEditingCentro] = useState('');

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  }, []);

  const expandAll = useCallback(() => {
    const all: Record<string, boolean> = {
      'ROOT': true,
      'RECEITAS': true,
      'DESPESAS': true,
    };
    [...SUBGRUPOS_RECEITA, ...SUBGRUPOS_DESPESA].forEach(sg => {
      all[sg.prefix] = true;
    });
    setExpandedNodes(all);
  }, []);

  const collapseAll = () => {
    setExpandedNodes({
      'ROOT': true,
      'RECEITAS': false,
      'DESPESAS': false,
    });
  };

  const handleTipoChange = (tipo: 'RECEITA' | 'DESPESA') => {
    setCatTipo(tipo);
    if (tipo === 'RECEITA') {
      setCatSubgrupo('1.1');
      setCatCentro('Operacional');
    } else {
      setCatSubgrupo('2.2');
      setCatCentro('Administrativo');
    }
  };

  // Auto generated next sequential code for selected subgroup
  const generatedCode = useMemo(() => {
    const existingInGroup = categories
      .filter(c => c.codigo.startsWith(catSubgrupo))
      .map(c => {
        const parts = c.codigo.split('.');
        const last = parts[parts.length - 1];
        const num = parseInt(last, 10);
        return isNaN(num) ? 0 : num;
      });

    const nextIndex = (existingInGroup.length > 0 ? Math.max(...existingInGroup) : 0) + 1;
    return `${catSubgrupo}.${nextIndex.toString().padStart(2, '0')}`;
  }, [categories, catSubgrupo]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNome.trim()) return;

    const finalCentro = catCentro === 'OUTRO' ? (customCentro.trim() || 'Geral') : catCentro;
    const finalCode = generatedCode;

    if (categories.some(c => c.codigo === finalCode)) {
      alert(`O código gerado "${finalCode}" já está registrado no plano de contas.`);
      return;
    }

    const nCat: FinancialCategory = {
      id: `cat-${Date.now()}`,
      codigo: finalCode,
      nome: catNome.trim(),
      tipo: catTipo,
      centroCusto: finalCentro,
      ativa: true,
      canDelete: true
    };

    onAddCategory(nCat);
    addLog('Contas', 'CRIACAO', `Criada conta contábil: [${finalCode}] ${catNome.trim()} (${catTipo})`);

    // Ensure the parent subgroup is expanded so the user sees the new account immediately
    setExpandedNodes(prev => ({
      ...prev,
      [catTipo === 'RECEITA' ? 'RECEITAS' : 'DESPESAS']: true,
      [catSubgrupo]: true
    }));

    setCatNome('');
    setShowAddModal(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingNome.trim()) return;
    onUpdateCategory(id, {
      nome: editingNome.trim(),
      centroCusto: editingCentro
    });
    addLog('Contas', 'EDICAO', `Atualizada conta [${id}] para: ${editingNome.trim()} - Centro: ${editingCentro}`);
    setEditingId(null);
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

  const handleToggleActive = (c: FinancialCategory) => {
    const nextStatus = !c.ativa;
    onUpdateCategory(c.id, { ativa: nextStatus });
    addLog('Contas', 'EDICAO', `${nextStatus ? 'Ativada' : 'Inativada'} conta: [${c.codigo}] ${c.nome}`);
  };

  const handleDelete = (c: FinancialCategory) => {
    if (!c.canDelete) {
      alert('Esta é uma conta essencial e mandatória para o cumprimento dos relatórios do Simples Nacional.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Conta do Plano de Contas',
      description: 'Esta conta será removida do seu catálogo contábil. Lançamentos prévios poderão manter o registro histórico.',
      itemName: `${c.codigo} - ${c.nome}`,
      onConfirm: () => {
        onDeleteCategory(c.id);
        addLog('Contas', 'EXCLUSAO', `Excluída conta [${c.codigo}] ${c.nome}`);
      }
    });
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return categories;
    return categories.filter(c =>
      c.nome.toLowerCase().includes(term) ||
      c.codigo.toLowerCase().includes(term) ||
      c.centroCusto?.toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  // Quick statistics
  const totalReceitas = categories.filter(c => c.tipo === 'RECEITA').length;
  const totalDespesas = categories.filter(c => c.tipo === 'DESPESA').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <SectionHeader
          icon={<FolderTree className="w-5 h-5 text-emerald-600" />}
          title="Plano de Contas"
          info="Estrutura hierárquica contábil para categorização de entradas, saídas, deduções e apuração do DRE."
          actions={
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar conta ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
                />
              </div>

              <ActionButton
                size="sm"
                onClick={() => setShowAddModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Nova Conta Contábil
              </ActionButton>
            </div>
          }
        />
      </div>

      {/* Overview Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total de Contas</span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{categories.length}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Catálogo completo</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-800 block">Grupo 1: Receitas</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">{totalReceitas}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Entradas operacionais</span>
        </div>

        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-800 block">Grupo 2: Despesas</span>
          <span className="text-xl font-extrabold text-amber-700 mt-0.5 block">{totalDespesas}</span>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Custos e despesas fixas</span>
        </div>

        <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-800 block">Contas Ativas</span>
          <span className="text-xl font-extrabold text-blue-700 mt-0.5 block">
            {categories.filter(c => c.ativa).length}
          </span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Em operação no caixa</span>
        </div>
      </div>

      {/* SINGLE UNIFIED TREE CONTAINER - ÁRVORE GENEALÓGICA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tree Container Header with Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center">
                Árvore Genealógica de Contas
                <InfoTooltip text="Clique nos ramos e grupos para abrir as contas cadastradas e centros de custo" />
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
            >
              Expandir Tudo
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
            >
              Recolher Tudo
            </button>
          </div>
        </div>

        {/* Tree Body */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* ROOT TRUNK: Plano de Contas */}
          <div className="border-l-2 border-emerald-400 pl-4 sm:pl-6 space-y-6">
            
            {/* ============================================================== */}
            {/* BRANCH 1: GRUPO RECEITAS (1.0) */}
            {/* ============================================================== */}
            <div className="space-y-3">
              {/* Branch Header Node */}
              <div
                onClick={() => toggleNode('RECEITAS')}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/70 border border-emerald-200/90 cursor-pointer transition select-none group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    {expandedNodes['RECEITAS'] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded-md border border-emerald-300">
                        1.0
                      </span>
                      <h5 className="text-sm font-extrabold text-emerald-950">
                        RECEITAS OPERACIONAIS E FINANCEIRAS
                      </h5>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                      Vendas de mercadorias, serviços prestados, rendimentos e outras entradas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                    {categories.filter(c => c.tipo === 'RECEITA').length} contas
                  </span>
                </div>
              </div>

              {/* Subgroups under Receitas */}
              {expandedNodes['RECEITAS'] && (
                <div className="ml-4 sm:ml-8 border-l-2 border-dashed border-emerald-300 pl-3 sm:pl-5 space-y-4 pt-1">
                  {SUBGRUPOS_RECEITA.map(subgrupo => {
                    const isSubExpanded = !!expandedNodes[subgrupo.prefix];
                    const subAccounts = filteredCategories.filter(
                      c => c.tipo === 'RECEITA' && c.codigo.startsWith(subgrupo.prefix)
                    ).sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

                    return (
                      <div key={subgrupo.prefix} className="space-y-2">
                        {/* Subgroup Node */}
                        <div
                          onClick={() => toggleNode(subgrupo.prefix)}
                          className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 cursor-pointer transition select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-slate-400">
                              {isSubExpanded ? (
                                <ChevronDown className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {subgrupo.label}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {subAccounts.length}
                          </span>
                        </div>

                        {/* Account Cards inside Subgroup */}
                        {isSubExpanded && (
                          <div className="ml-4 sm:ml-6 border-l-2 border-slate-200 pl-3 sm:pl-4 space-y-2.5 pt-1">
                            {subAccounts.length === 0 ? (
                              <div className="p-3 text-[11px] text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Nenhuma conta cadastrada neste subgrupo.
                              </div>
                            ) : (
                              subAccounts.map(c => {
                                const isEditing = editingId === c.id;
                                return (
                                  <div
                                    key={c.id}
                                    className={`p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                      !c.ativa ? 'opacity-60 bg-slate-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-start sm:items-center gap-3">
                                      <span className="font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-1 rounded-lg text-xs shrink-0">
                                        {c.codigo}
                                      </span>

                                      {isEditing ? (
                                        <div className="space-y-1.5 flex-1">
                                          <input
                                            type="text"
                                            value={editingNome}
                                            onChange={(e) => setEditingNome(e.target.value)}
                                            className="bg-white border border-slate-300 text-xs py-1.5 px-3 rounded-lg outline-none w-full sm:w-64 text-slate-900 font-semibold focus:border-emerald-500"
                                          />
                                          <select
                                            value={editingCentro}
                                            onChange={(e) => setEditingCentro(e.target.value)}
                                            className="bg-white border border-slate-300 text-[11px] py-1 px-2 rounded-lg block text-slate-700 w-full sm:w-64 font-medium"
                                          >
                                            {CENTROS_DE_CUSTO_OPCOES.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        </div>
                                      ) : (
                                        <div>
                                          <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                                            {c.nome}
                                            {!c.canDelete && (
                                              <span title="Conta regulatória obrigatória MEI">
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                              </span>
                                            )}
                                          </strong>
                                          <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500">
                                            <span className="inline-flex items-center gap-1">
                                              <Tag className="w-3 h-3 text-slate-400" />
                                              Centro: <strong className="text-slate-700">{c.centroCusto}</strong>
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                      {isEditing ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEdit(c.id)}
                                            className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                          >
                                            <Check className="w-3.5 h-3.5" /> Salvar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="h-8 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingId(c.id);
                                              setEditingNome(c.nome);
                                              setEditingCentro(c.centroCusto);
                                            }}
                                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                            title="Editar Conta"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleToggleActive(c)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition cursor-pointer ${
                                              c.ativa
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                                            }`}
                                            title={c.ativa ? 'Conta ativa (clique para inativar)' : 'Conta inativa (clique para ativar)'}
                                          >
                                            {c.ativa ? 'Ativa' : 'Inativa'}
                                          </button>

                                          {c.canDelete && (
                                            <button
                                              type="button"
                                              onClick={() => handleDelete(c)}
                                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                              title="Excluir Conta"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* BRANCH 2: GRUPO DESPESAS (2.0) */}
            {/* ============================================================== */}
            <div className="space-y-3">
              {/* Branch Header Node */}
              <div
                onClick={() => toggleNode('DESPESAS')}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 hover:bg-amber-100/70 border border-amber-200/90 cursor-pointer transition select-none group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    {expandedNodes['DESPESAS'] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-md border border-amber-300">
                        2.0
                      </span>
                      <h5 className="text-sm font-extrabold text-amber-950">
                        DESPESAS OPERACIONAIS E CUSTOS
                      </h5>
                    </div>
                    <span className="text-[11px] text-amber-800 font-medium block mt-0.5">
                      Custos de mercadorias, insumos, tributos DAS, despesas fixas e administrativas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-white text-amber-800 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs">
                    {categories.filter(c => c.tipo === 'DESPESA').length} contas
                  </span>
                </div>
              </div>

              {/* Subgroups under Despesas */}
              {expandedNodes['DESPESAS'] && (
                <div className="ml-4 sm:ml-8 border-l-2 border-dashed border-amber-300 pl-3 sm:pl-5 space-y-4 pt-1">
                  {SUBGRUPOS_DESPESA.map(subgrupo => {
                    const isSubExpanded = !!expandedNodes[subgrupo.prefix];
                    const subAccounts = filteredCategories.filter(
                      c => c.tipo === 'DESPESA' && c.codigo.startsWith(subgrupo.prefix)
                    ).sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

                    return (
                      <div key={subgrupo.prefix} className="space-y-2">
                        {/* Subgroup Node */}
                        <div
                          onClick={() => toggleNode(subgrupo.prefix)}
                          className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 cursor-pointer transition select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-slate-400">
                              {isSubExpanded ? (
                                <ChevronDown className="w-4 h-4 text-amber-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {subgrupo.label}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {subAccounts.length}
                          </span>
                        </div>

                        {/* Account Cards inside Subgroup */}
                        {isSubExpanded && (
                          <div className="ml-4 sm:ml-6 border-l-2 border-slate-200 pl-3 sm:pl-4 space-y-2.5 pt-1">
                            {subAccounts.length === 0 ? (
                              <div className="p-3 text-[11px] text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Nenhuma conta cadastrada neste subgrupo.
                              </div>
                            ) : (
                              subAccounts.map(c => {
                                const isEditing = editingId === c.id;
                                return (
                                  <div
                                    key={c.id}
                                    className={`p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                      !c.ativa ? 'opacity-60 bg-slate-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-start sm:items-center gap-3">
                                      <span className="font-mono bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-1 rounded-lg text-xs shrink-0">
                                        {c.codigo}
                                      </span>

                                      {isEditing ? (
                                        <div className="space-y-1.5 flex-1">
                                          <input
                                            type="text"
                                            value={editingNome}
                                            onChange={(e) => setEditingNome(e.target.value)}
                                            className="bg-white border border-slate-300 text-xs py-1.5 px-3 rounded-lg outline-none w-full sm:w-64 text-slate-900 font-semibold focus:border-amber-500"
                                          />
                                          <select
                                            value={editingCentro}
                                            onChange={(e) => setEditingCentro(e.target.value)}
                                            className="bg-white border border-slate-300 text-[11px] py-1 px-2 rounded-lg block text-slate-700 w-full sm:w-64 font-medium"
                                          >
                                            {CENTROS_DE_CUSTO_OPCOES.map(opt => (
                                              <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                          </select>
                                        </div>
                                      ) : (
                                        <div>
                                          <strong className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
                                            {c.nome}
                                            {!c.canDelete && (
                                              <span title="Conta regulatória obrigatória MEI">
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                                              </span>
                                            )}
                                          </strong>
                                          <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500">
                                            <span className="inline-flex items-center gap-1">
                                              <Tag className="w-3 h-3 text-slate-400" />
                                              Centro: <strong className="text-slate-700">{c.centroCusto}</strong>
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                      {isEditing ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEdit(c.id)}
                                            className="h-8 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                                          >
                                            <Check className="w-3.5 h-3.5" /> Salvar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="h-8 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingId(c.id);
                                              setEditingNome(c.nome);
                                              setEditingCentro(c.centroCusto);
                                            }}
                                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                            title="Editar Conta"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleToggleActive(c)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition cursor-pointer ${
                                              c.ativa
                                                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                                            }`}
                                            title={c.ativa ? 'Conta ativa (clique para inativar)' : 'Conta inativa (clique para ativar)'}
                                          >
                                            {c.ativa ? 'Ativa' : 'Inativa'}
                                          </button>

                                          {c.canDelete && (
                                            <button
                                              type="button"
                                              onClick={() => handleDelete(c)}
                                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                              title="Excluir Conta"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Responsive Modal for Adding Account (iOS Bottom Sheet on Mobile) */}
      <ResponsiveModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        maxWidth="max-w-lg"
        title="Cadastrar Nova Conta no Plano"
        subtitle="Adiciona conta hierárquica vinculada a subgrupo contábil e centro de custo"
        icon={<Plus className="w-5 h-5 text-emerald-600" />}
      >
        <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
          {/* Natureza */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Natureza Contábil
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTipoChange('RECEITA')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  catTipo === 'RECEITA'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                1. Receita (Entrada)
              </button>

              <button
                type="button"
                onClick={() => handleTipoChange('DESPESA')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  catTipo === 'DESPESA'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                2. Despesa (Saída)
              </button>
            </div>
          </div>

          {/* Subgrupo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Subgrupo Hierárquico
            </label>
            <select
              value={catSubgrupo}
              onChange={(e) => setCatSubgrupo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white text-slate-800 px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              {(catTipo === 'RECEITA' ? SUBGRUPOS_RECEITA : SUBGRUPOS_DESPESA).map(sg => (
                <option key={sg.prefix} value={sg.prefix}>{sg.label}</option>
              ))}
            </select>
          </div>

          {/* Código Gerado */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-[11px] text-slate-600 font-semibold">Código Contábil Sugerido:</span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
              {generatedCode}
            </span>
          </div>

          {/* Nome da Conta */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nome da Conta / Categoria *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Vendas de Peças Artesanais"
              value={catNome}
              onChange={(e) => setCatNome(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white text-slate-800 px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Centro de Custo */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Centro de Custo Padrão
            </label>
            <select
              value={catCentro}
              onChange={(e) => setCatCentro(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white text-slate-800 px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500"
            >
              {CENTROS_DE_CUSTO_OPCOES.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
              <option value="OUTRO">+ Outro centro personalizado</option>
            </select>
          </div>

          {catCentro === 'OUTRO' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Nome do Centro de Custo
              </label>
              <input
                type="text"
                placeholder="ex: Projeto Especial A"
                value={customCentro}
                onChange={(e) => setCustomCentro(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white text-slate-800 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Cadastrar Conta
            </button>
          </div>
        </form>
      </ResponsiveModal>

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

export default PlanoDeContas;
