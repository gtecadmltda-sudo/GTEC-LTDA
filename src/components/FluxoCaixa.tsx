/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { FinancialTransaction, FinancialCategory } from '../types';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Upload, 
  Check, 
  Clock, 
  X, 
  Plus, 
  Filter, 
  LineChart, 
  Search,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useIncrementalList } from '../hooks/useIncrementalList';
import { ResponsiveModal } from './ResponsiveModal';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { ActionButton } from './ActionButton';

interface FluxoCaixaProps {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
  onAddTransaction: (t: Omit<FinancialTransaction, 'id'>) => void;
  onUpdateTransactionStatus: (id: string, nextStatus: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO') => void;
  onUploadReceipt: (id: string, fileName: string) => void;
  onImportTransactions: (tList: Omit<FinancialTransaction, 'id'>[]) => void;
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO', descricao: string) => void;
  initialSegment?: 'lancamentos' | 'pagar-receber' | 'reconciliacao' | 'projecoes';
  initialFilterType?: 'TODOS' | 'RECEITA' | 'DESPESA';
  initialFilterStatus?: 'TODOS' | 'PENDENTE' | 'PAGO' | 'ATRASADO';
}

export const FluxoCaixa = React.memo(function FluxoCaixa({
  transactions,
  categories,
  onAddTransaction,
  onUpdateTransactionStatus,
  onUploadReceipt,
  onImportTransactions,
  addLog,
  initialSegment,
  initialFilterType,
  initialFilterStatus
}: FluxoCaixaProps) {
  // Navigation tabs for Caixa
  const [activeSegment, setActiveSegment] = useState<'lancamentos' | 'pagar-receber' | 'reconciliacao' | 'projecoes'>(initialSegment || 'lancamentos');

  // New Transaction Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [txDesc, setTxDesc] = useState('');
  const [txTipo, setTxTipo] = useState<'RECEITA' | 'DESPESA'>('RECEITA');
  const [txValor, setTxValor] = useState('');
  const [txData, setTxData] = useState(new Date().toISOString().split('T')[0]);
  const [txVencimento, setTxVencimento] = useState(new Date().toISOString().split('T')[0]);
  const [txCategoria, setTxCategoria] = useState('');
  const [txStatus, setTxStatus] = useState<'PENDENTE' | 'PAGO'>('PAGO');

  // Filters
  const [filterType, setFilterType] = useState<'TODOS' | 'RECEITA' | 'DESPESA'>(initialFilterType || 'TODOS');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'PENDENTE' | 'PAGO' | 'ATRASADO'>(initialFilterStatus || 'TODOS');

  React.useEffect(() => {
    if (initialSegment) setActiveSegment(initialSegment);
    if (initialFilterType) setFilterType(initialFilterType);
    if (initialFilterStatus) setFilterStatus(initialFilterStatus);
  }, [initialSegment, initialFilterType, initialFilterStatus]);
  const [searchTerm, setSearchTerm] = useState('');

  // Reconciliation Wizard State
  const [importedFileLogs, setImportedFileLogs] = useState<string | null>(null);
  const [tempSimulatedImports, setTempSimulatedImports] = useState<Omit<FinancialTransaction, 'id'>[]>([]);
  const [reconciliationComplete, setReconciliationComplete] = useState(false);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleAddNewTx = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(txValor);
    if (isNaN(val) || val <= 0) return;

    const catId = txCategoria || (txTipo === 'RECEITA' ? 'cat-r1' : 'cat-d1');
    const catName = categories.find(c => c.id === catId)?.nome || '';

    onAddTransaction({
      data: txData,
      dataVencimento: txVencimento,
      tipo: txTipo,
      categoriaId: catId,
      descricao: txDesc || `Lançamento manual de ${catName}`,
      valor: val,
      status: txStatus
    });

    addLog(
      'Financeiro', 
      'CRIACAO', 
      `Nova transação cadastrada: ${txDesc} | Valor: R$ ${val.toFixed(2)} (${txStatus})`
    );

    // reset Form
    setTxDesc('');
    setTxValor('');
    setShowAddForm(false);
    alert('Lançamento registrado com sucesso!');
  };

  // Simulates uploading a payment proof (comprovante)
  const simulateReceiptUpload = (txId: string) => {
    const dummyReceipts = [
      'comprovante_pix_recebimento_0129.pdf',
      'nfe_fornecedor_compra_pinus_90.pdf',
      'boleto_das_pago_simples_nacional.pdf',
      'recibo_venda_balcao_oficina.pdf'
    ];
    const pickedReceipt = dummyReceipts[Math.floor(Math.random() * dummyReceipts.length)];
    onUploadReceipt(txId, pickedReceipt);
    addLog('Financeiro', 'EDICAO', `Anexado comprovante "${pickedReceipt}" na transação #${txId}`);
    alert(`Comprovante "${pickedReceipt}" anexado com sucesso para fins de dedutibilidade fiscal!`);
  };

  // -------------------------------------------------------------
  // BANK RECONCILIATION WIZARD (OFX/CSV)
  // -------------------------------------------------------------
  const triggerMockExtraction = (fileType: 'OFX' | 'CSV') => {
    // Generate simulated extract items from Banco do Brasil/Itaú/Pix
    const mockExtractedItems: Omit<FinancialTransaction, 'id'>[] = [
      {
        data: '2026-06-12',
        dataVencimento: '2026-06-12',
        tipo: 'RECEITA',
        categoriaId: 'cat-r1',
        descricao: 'PIX RECEBIDO - AGENCIA SÉ SUP. ESPERANÇA',
        valor: 2200.00,
        status: 'PAGO',
        importado: true
      },
      {
        data: '2026-06-11',
        dataVencimento: '2026-06-11',
        tipo: 'DESPESA',
        categoriaId: 'cat-d5',
        descricao: 'DEBITO AUT - COMP. ENERGIA ENEL S.A.',
        valor: 185.30,
        status: 'PAGO',
        importado: true
      },
      {
        data: '2026-06-12',
        dataVencimento: '2026-06-12',
        tipo: 'DESPESA',
        categoriaId: 'cat-d7',
        descricao: 'TAR. BANCARIA MENSAL PJ',
        valor: 35.00,
        status: 'PAGO',
        importado: true
      }
    ];

    setImportedFileLogs(`extrato_bancario_compact_${new Date().getFullYear()}.${fileType.toLowerCase()}`);
    setTempSimulatedImports(mockExtractedItems);
    setReconciliationComplete(false);
  };

  const executeConciliationMatch = () => {
    if (tempSimulatedImports.length === 0) return;
    
    // Add transactions checklist to database
    onImportTransactions(tempSimulatedImports);
    
    // Log audit
    addLog('Financeiro', 'CRIACAO', `Conciliação de Extrato Bancário efetuada com sucesso. ${tempSimulatedImports.length} novos movimentos compensados.`);
    
    setTempSimulatedImports([]);
    setReconciliationComplete(true);
    setImportedFileLogs(null);
    alert('Conciliação Bancária realizada com sucesso!\n\nOs lançamentos foram importados, vinculados ao seu plano de contas e compensados instantaneamente no fluxo de caixa.');
  };

  // -------------------------------------------------------------
  // PROJECTION CALCULATIONS
  // -------------------------------------------------------------
  const balanceAtCurrentDay = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO')
    .reduce((sum, item) => sum + item.valor, 0) -
    transactions
      .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO')
      .reduce((sum, item) => sum + item.valor, 0);

  // Future due lists for Projection display
  const futureTransactions = transactions
    .filter(t => t.status === 'PENDENTE')
    .sort((a,b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

  // Projections: 30, 60, 90 days calculations
  const calculateCashProjection = (days: number) => {
    const horizonDate = new Date();
    horizonDate.setDate(horizonDate.getDate() + days);

    const futureReceitas = transactions
      .filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE' && new Date(t.dataVencimento) <= horizonDate)
      .reduce((sum, t) => sum + t.valor, 0);

    const futureDespesas = transactions
      .filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE' && new Date(t.dataVencimento) <= horizonDate)
      .reduce((sum, t) => sum + t.valor, 0);

    return balanceAtCurrentDay + futureReceitas - futureDespesas;
  };

  // Calculations for Hero Summary Card
  const totalReceitas = transactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalDespesas = transactions
    .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO')
    .reduce((sum, item) => sum + item.valor, 0);

  const pendingDespesas = transactions
    .filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE')
    .reduce((sum, item) => sum + item.valor, 0);

  // filtered list
  const filteredTransactions = transactions
    .filter(t => {
      const matchType = filterType === 'TODOS' ? true : t.tipo === filterType;
      const matchStatus = filterStatus === 'TODOS' ? true : t.status === filterStatus;
      const matchSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchStatus && matchSearch;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Incremental data loading (10 initial, scroll to load more)
  const {
    visibleItems: visibleTransactions,
    hasMore: hasMoreTransactions,
    displayedCount: displayedTransactionsCount,
    totalCount: totalTransactionsCount,
    sentinelRef: txSentinelRef
  } = useIncrementalList(filteredTransactions, 10, 10);

  return (
    <div className="space-y-6">

      {/* =========================================================================
          CARD DE RESUMO FINANCEIRO - PADRÃO FISCAL & DAS
          ========================================================================= */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <SectionHeader
            as="h2"
            icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
            title="Fluxo de Caixa & Gestão Financeira"
            info="Controle diário de entradas, saídas, conciliação bancária OFX/CSV e projeção de liquidez"
            badges={
              <StatusBadge
                tone="success"
                label={`${transactions.length} Lançamentos`}
              />
            }
            actions={
              <ActionButton
                onClick={() => {
                  setTxTipo('RECEITA');
                  setTxCategoria('cat-r1');
                  setShowAddForm(true);
                }}
                icon={<Plus className="w-4 h-4" />}
                size="sm"
              >
                Novo Lançamento
              </ActionButton>
            }
          />
        </div>

        {/* Grid de Métricas de Caixa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-bold">Saldo Consolidado</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xl font-extrabold font-mono text-slate-900 mt-1 block">
              R$ {balanceAtCurrentDay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Caixa atual</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-bold">Entradas Realizadas</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xl font-extrabold font-mono text-emerald-600 mt-1 block">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Receitas pagas</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-bold">Saídas / Despesas</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <span className="text-xl font-extrabold font-mono text-rose-600 mt-1 block">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Despesas pagas</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-bold">A Pagar Pendente</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xl font-extrabold font-mono text-amber-600 mt-1 block">
              R$ {pendingDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Contas em aberto</span>
          </div>
        </div>
      </div>
      
      {/* Visual Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 flex flex-wrap gap-1 shadow-sm">
        <button
          onClick={() => setActiveSegment('lancamentos')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSegment === 'lancamentos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Livro de Caixa e Lançamentos
        </button>

        <button
          onClick={() => setActiveSegment('pagar-receber')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSegment === 'pagar-receber'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" /> Contas a Pagar & Receber
        </button>

        <button
          onClick={() => setActiveSegment('reconciliacao')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSegment === 'reconciliacao'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" /> Conciliação de Extratos (OFX/CSV)
        </button>

        <button
          onClick={() => setActiveSegment('projecoes')}
          className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer ${
            activeSegment === 'projecoes'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LineChart className="w-4 h-4" /> Projeções de Caixa Futuro
        </button>
      </div>

      {/* -------------------------------------------------------------
          SEGMENT 1: GENERAL TRANSACTION BOOK
          ------------------------------------------------------------- */}
      {activeSegment === 'lancamentos' && (
        <div className="space-y-6">
          
          {/* Quick Filters Header */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              
              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-500">Filtrar Fluxo:</span>
              </div>

              {/* Type toggle */}
              <div className="bg-slate-50 p-1 border border-slate-200 rounded-xl flex gap-1">
                <button
                  onClick={() => setFilterType('TODOS')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${filterType === 'TODOS' ? 'bg-white shadow-xs font-bold text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('RECEITA')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${filterType === 'RECEITA' ? 'bg-emerald-100 text-emerald-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Receitas
                </button>
                <button
                  onClick={() => setFilterType('DESPESA')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${filterType === 'DESPESA' ? 'bg-rose-100 text-rose-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Despesas
                </button>
              </div>

              {/* Status Select */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white text-slate-700 px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="TODOS">Todos Status</option>
                <option value="PENDENTE">Apenas Pendente</option>
                <option value="PAGO">Apenas Pago/Quitado</option>
              </select>
            </div>

            {/* Searching text */}
            <div className="flex gap-2.5 items-center">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 text-slate-900 focus:outline-none"
                />
              </div>

              <button
                onClick={() => {
                  setTxTipo('RECEITA');
                  setTxCategoria('cat-r1');
                  setShowAddForm(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer shrink-0 inline-flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Novo Lançamento
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Fluxo / Categoria</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-2">Data Lançamento</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleTransactions.map((tx) => {
                    const cat = categories.find(c => c.id === tx.categoriaId);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                        {/* Flow category name */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 font-semibold ${tx.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.tipo === 'RECEITA' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {cat?.nome || 'Operação Extraordinária'}
                          </span>
                        </td>
                        
                        {/* Summary description */}
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {tx.descricao}
                          {tx.importado && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 ml-1.5 px-1.5 py-0.5 rounded uppercase font-bold">
                              Extrato
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-2 font-mono text-slate-500">
                          {new Date(tx.data).toLocaleDateString('pt-BR')}
                        </td>

                        {/* Amount */}
                        <td className={`py-3 px-4 text-right font-bold font-mono text-sm ${tx.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {tx.tipo === 'RECEITA' ? '+' : '-'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Status columns */}
                        <td className="py-3 px-4 text-center">
                          <select
                            value={tx.status}
                            onChange={(e) => {
                              onUpdateTransactionStatus(tx.id, e.target.value as any);
                              addLog('Financeiro', 'EDICAO', `Status da Transação "${tx.descricao}" atualizado para ${e.target.value}`);
                            }}
                            className={`rounded-full font-extrabold text-[10px] px-2.5 py-1 text-center cursor-pointer outline-none border ${
                              tx.status === 'PAGO' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : tx.status === 'PENDENTE'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <option value="PENDENTE">PENDENTE</option>
                            <option value="PAGO">COMPENSADO</option>
                            <option value="CANCELADO">CANCELADO</option>
                          </select>
                        </td>

                        {/* Simulated Voucher attachments */}
                        <td className="py-3 px-4 text-center">
                          {tx.comprovanteUrl ? (
                            <span 
                              className="text-[10px] text-slate-600 cursor-pointer hover:underline inline-flex items-center gap-1 font-medium"
                              title={tx.comprovanteNome}
                              onClick={() => alert(`Visualização do Comprovante de Pagamento:\n\nArquivo anexo: ${tx.comprovanteNome}\nStatus do arquivo: Armazenado com segurança contra fraude contratual.`)}
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> {tx.comprovanteNome?.slice(0, 15)}...
                            </span>
                          ) : (
                            <button
                              onClick={() => simulateReceiptUpload(tx.id)}
                              className="border border-slate-200 hover:bg-slate-50 text-[10px] py-1 px-2.5 rounded-lg inline-flex items-center gap-1 font-semibold text-slate-600 cursor-pointer"
                            >
                              <Upload className="w-3 h-3 text-slate-400" /> Anexar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-400">
                Nenhuma partida de lançamento identificada com os filtros atuais.
              </div>
            )}

            {hasMoreTransactions && (
              <div ref={txSentinelRef} className="py-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                Carregando mais lançamentos... ({displayedTransactionsCount} de {totalTransactionsCount})
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SEGMENT 2: ACCOUNTS PAYABLE & RECEIVABLE LIST
          ------------------------------------------------------------- */}
      {activeSegment === 'pagar-receber' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          
          {/* Contas a Receber column */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-1 select-none">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Contas a Receber (Vendas/Faturado)</span>
                  <InfoTooltip text="Títulos e recebíveis futuros de vendas a prazo no radar" />
                </h3>
                <span className="text-xs font-bold text-emerald-600 font-mono shrink-0">
                  R$ {transactions.filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE').reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR')} aberto
                </span>
              </div>
              <div className="h-px w-full bg-slate-100 mt-1.5" />
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {transactions
                .filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE')
                .map(t => (
                  <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-sans">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center">
                        <span>{t.descricao}</span>
                        <InfoTooltip text={`Vencimento: ${new Date(t.dataVencimento).toLocaleDateString('pt-BR')}`} />
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-emerald-600">R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <button
                        onClick={() => {
                          onUpdateTransactionStatus(t.id, 'PAGO');
                          addLog('Financeiro', 'EDICAO', `Contas a Receber "${t.descricao}" recebido e liquidado.`);
                          alert('Título faturado compensado com sucesso!');
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                        title="Receber Pagamento"
                      >
                        ✓ Quitar
                      </button>
                    </div>
                  </div>
                ))}

              {transactions.filter(t => t.tipo === 'RECEITA' && t.status === 'PENDENTE').length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400">
                  Sem recebimentos pendentes identificados para os próximos 90 dias.
                </div>
              )}
            </div>
          </div>

          {/* Contas a Pagar column */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-1 select-none">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Contas a Pagar (Custos/DAS)</span>
                  <InfoTooltip text="Obrigações futuras, DAS-MEI e despesas operacionais a pagar" />
                </h3>
                <span className="text-xs font-bold text-amber-600 font-mono shrink-0">
                  R$ {transactions.filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE').reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR')} aberto
                </span>
              </div>
              <div className="h-px w-full bg-slate-100 mt-1.5" />
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {transactions
                .filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE')
                .map(t => (
                  <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center">
                        <span>{t.descricao}</span>
                        <InfoTooltip text={`Vencimento: ${new Date(t.dataVencimento).toLocaleDateString('pt-BR')}`} />
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-rose-600">R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <button
                        onClick={() => {
                          onUpdateTransactionStatus(t.id, 'PAGO');
                          addLog('Financeiro', 'EDICAO', `Contas a Pagar "${t.descricao}" pago e compensado.`);
                          alert('Boleto/Título de pagamento liquidado com sucesso!');
                        }}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-[10px] px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer"
                        title="Pagar conta"
                      >
                        $ Pagar
                      </button>
                    </div>
                  </div>
                ))}

              {transactions.filter(t => t.tipo === 'DESPESA' && t.status === 'PENDENTE').length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400">
                  Sem contas pendentes registradas no cronograma.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          SEGMENT 3: BANK CONCILIATION WIZARD (OFX / CSV)
          ------------------------------------------------------------- */}
      {activeSegment === 'reconciliacao' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-1 select-none">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              Conciliação Bancária de Extratos OFX ou CSV
              <InfoTooltip text="Evite digitar transações manualmente. Importe o arquivo eletrônico OFX ou CSV fornecido pela sua instituição PJ (Itaú PJ, Banco do Brasil, Inter, Nubank) e liquide lançamentos do plano de contas de forma assistida." />
            </h3>
            <div className="h-px w-full bg-slate-100 mt-1.5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box drag-n-drop simulated */}
            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 transition duration-150 rounded-2xl p-6 text-center bg-slate-50 flex flex-col justify-center items-center pointer-events-auto">
              <Upload className="w-10 h-10 text-slate-400 mb-3 animate-bounce" />
              <strong className="text-xs font-bold text-slate-800 block">Arraste seu extrato OFX/CSV de teste aqui</strong>
              <span className="text-[10px] text-slate-500 block mt-1">Sistemas autorizados: Itaú, BB, Nubank, Caixa, Inter ou PJ genéricos.</span>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-6">
                <button
                  type="button"
                  onClick={() => triggerMockExtraction('OFX')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-xl font-mono transition cursor-pointer shadow-xs"
                >
                  Simular .OFX PJ
                </button>
                <button
                  type="button"
                  onClick={() => triggerMockExtraction('CSV')}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold py-2 rounded-xl font-mono transition cursor-pointer shadow-xs"
                >
                  Simular .CSV Pix
                </button>
              </div>
            </div>

            {/* Extracted results matches block */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-baseline pb-1 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-900">Estampa do Extrato Preparado</h4>
                {importedFileLogs ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full inline-block">
                    Conectado
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full inline-block">
                    Aguardando Arquivo
                  </span>
                )}
              </div>

              {importedFileLogs && tempSimulatedImports.length > 0 ? (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-slate-500 font-mono">Arquivo: <strong>{importedFileLogs}</strong></p>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tempSimulatedImports.map((item, id) => (
                      <div key={id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                        <div>
                          <strong className="text-slate-800 block text-[10px] truncate w-48">{item.descricao}</strong>
                          <span className="text-[9px] text-slate-400 block">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <span className={`font-bold ${item.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {item.tipo === 'RECEITA' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={executeConciliationMatch}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Consolidar e Gravar Lançamentos
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400 text-center py-12 flex flex-col items-center justify-center gap-1.5">
                  <Clock className="w-8 h-8 text-slate-350 shrink-0" />
                  <span>Configure um extrato de simulação à esquerda para visualizar e reconciliar transações sem intervenção manual.</span>
                </div>
              )}

              {reconciliationComplete && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex gap-1.5 items-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Muito bem! Bancarização concluída perfeitamente para este exercício. Guia atualizado.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SEGMENT 4: FINANCIAL CASH FLOW PROJECTIONS (30,60,90 Days)
          ------------------------------------------------------------- */}
      {activeSegment === 'projecoes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-1 select-none">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center">
              Projeção de Caixa Futuro (30, 60, 90 Dias)
              <InfoTooltip text="Entenda a sustentabilidade do seu negócio no médio prazo. O sistema calcula o saldo simulado somando as suas receitas previstas (Contas a Receber) e subtraindo as despesas fixas estimadas do MEI (Aluguel, luz e boleto DAS)." />
            </h3>
            <div className="h-px w-full bg-slate-100 mt-1.5" />
          </div>

          {/* Projection Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Saldo Base Líquido</span>
              <strong className="text-lg font-bold font-mono block text-slate-900 mt-1">
                R$ {balanceAtCurrentDay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mt-2">Hoje</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Est. Caixa 30 Dias</span>
              <strong className={`text-lg font-bold font-mono block mt-1 ${calculateCashProjection(30) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                R$ {calculateCashProjection(30).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-[9px] text-slate-600 font-bold bg-slate-200 px-2.5 py-0.5 rounded-full inline-block mt-2">Médio Prazo</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Est. Caixa 60 Dias</span>
              <strong className={`text-lg font-bold font-mono block mt-1 ${calculateCashProjection(60) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                R$ {calculateCashProjection(60).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-[9px] text-slate-600 font-bold bg-slate-200 px-2.5 py-0.5 rounded-full inline-block mt-2">Médio Prazo</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Est. Caixa 90 Dias</span>
              <strong className={`text-lg font-bold font-mono block mt-1 ${calculateCashProjection(90) >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                R$ {calculateCashProjection(90).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-[9px] text-slate-600 font-bold bg-slate-200 px-2.5 py-0.5 rounded-full inline-block mt-2">Longo Prazo</span>
            </div>
          </div>

          {/* Future schedule breakdown */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center">
              <span>Lançamentos Agendados e Recorrentes</span>
              <InfoTooltip text="Cronograma de receitas e despesas futuras para cálculo do fluxo de caixa previsto" />
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {futureTransactions.map((fT) => (
                <div key={fT.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center text-slate-600">
                  <div>
                    <strong className="text-slate-800 block">{fT.descricao}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">Duração / Venc: {new Date(fT.dataVencimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="text-right">
                    <span className={`font-mono font-bold block ${fT.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {fT.tipo === 'RECEITA' ? '+' : '-'} R$ {fT.valor.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[9px] text-slate-500 block capitalize">Status: Pendente</span>
                  </div>
                </div>
              ))}

              {futureTransactions.length === 0 && (
                <div className="col-span-2 text-center py-6 text-xs text-slate-400">
                  Nenhum título programado cadastrado para projeção horizontal do caixa.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          RESPONSIVE MODAL: ADD MANUAL TRANSACTION (iOS BOTTOM SHEET ON MOBILE)
          ------------------------------------------------------------- */}
      <ResponsiveModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        maxWidth="max-w-md"
        title="Registrar Lançamento Financeiro"
        subtitle="Entrada ou saída com conciliação contábil"
        icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
      >
        <form onSubmit={handleAddNewTx} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tipo de Caixa</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxTipo('RECEITA');
                      setTxCategoria('cat-r1');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      txTipo === 'RECEITA' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Receita/Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxTipo('DESPESA');
                      setTxCategoria('cat-d1');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      txTipo === 'DESPESA' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Despesa/Saída
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Valor do Título (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txValor}
                  onChange={(e) => setTxValor(e.target.value)}
                  placeholder="0.00"
                  className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-sans">Descrição do Lançamento</label>
                <input
                  type="text"
                  required
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Ex: Pagamento Fornecedor de compensados MDF..."
                  className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Categoria Contábil</label>
                  <select
                    value={txCategoria}
                    onChange={(e) => setTxCategoria(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-2.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    {categories
                      .filter(c => c.tipo === txTipo && c.ativa)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Status da Partida</label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as any)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-2.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PAGO">Pago/Compensado</option>
                    <option value="PENDENTE">A Agendar (Pendente)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">Data do Lançamento</label>
                  <input
                    type="date"
                    required
                    value={txData}
                    onChange={(e) => setTxData(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={txVencimento}
                    onChange={(e) => setTxVencimento(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5 font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-5 rounded-xl shadow-sm cursor-pointer"
                >
                  Salvar Título
                </button>
              </div>
            </form>
      </ResponsiveModal>

    </div>
  );
});
