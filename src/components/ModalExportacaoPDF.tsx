/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Eye, 
  Settings,
  Building,
  TrendingUp,
  Coins
} from 'lucide-react';
import { FinancialTransaction, DASPayment, Invoice, FinancialCategory, User } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { 
  calculateReportFinancials, 
  downloadReportPDF, 
  formatCurrencyBRL 
} from '../lib/pdfReportGenerator';

interface ModalExportacaoPDFProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: FinancialTransaction[];
  dasPayments: DASPayment[];
  invoices: Invoice[];
  categories: FinancialCategory[];
  selectedYear: string;
  currentUser: User | null;
  addLog: (modulo: string, acao: any, descricao: string) => void;
}

export function ModalExportacaoPDF({
  isOpen,
  onClose,
  transactions,
  dasPayments,
  invoices,
  selectedYear,
  currentUser,
  addLog
}: ModalExportacaoPDFProps) {
  const [includeDRE, setIncludeDRE] = useState(true);
  const [includeMonthlyBalance, setIncludeMonthlyBalance] = useState(true);
  const [includeFiscalBreakdown, setIncludeFiscalBreakdown] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [empresaNome, setEmpresaNome] = useState('Carlos Oliveira MEI');
  const [cnpj, setCnpj] = useState('30.751.934/0001-30');
  const [responsavel, setResponsavel] = useState(currentUser?.name || 'Carlos Oliveira');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'config'>('preview');

  if (!isOpen) return null;

  const reportData = calculateReportFinancials(transactions, dasPayments, invoices, selectedYear);

  const handleDownloadPDF = () => {
    try {
      downloadReportPDF({
        selectedYear,
        transactions,
        dasPayments,
        invoices,
        companyName: empresaNome,
        cnpj,
        responsavelNome: responsavel,
        includeDRE,
        includeMonthlyBalance,
        includeFiscalBreakdown,
        includeSignatures
      });

      addLog(
        'Relatorios', 
        'EXPORTACAO', 
        `Gerado e baixado arquivo PDF oficial de Balanços e DRE (${selectedYear})`
      );
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      alert('Houve um erro ao processar o arquivo PDF. Tente novamente.');
    }
  };

  const handlePrint = () => {
    window.print();
    addLog(
      'Relatorios', 
      'EXPORTACAO', 
      `Disparada impressão de Balanços e DRE (${selectedYear})`
    );
  };

  const handleCopySummary = () => {
    let summary = `*MEI-Simple ERP - Relatório Financeiro ${selectedYear}*\n`;
    summary += `Empresa: ${empresaNome} (CNPJ: ${cnpj})\n\n`;
    summary += `📊 *Resumo Consolidado:*\n`;
    summary += `• Receita Bruta Total: ${formatCurrencyBRL(reportData.totalReceitaBruta)}\n`;
    summary += `• Custos de Mercadorias / Insumos: ${formatCurrencyBRL(reportData.totalCustosInsumos)}\n`;
    summary += `• Despesas Operacionais / Administrativas: ${formatCurrencyBRL(reportData.totalDespesasAdm + reportData.totalOutrasDespesas)}\n`;
    summary += `• Impostos DAS Pagos: ${formatCurrencyBRL(reportData.totalDAS)}\n`;
    summary += `• *Lucro Líquido do Exercício:* ${formatCurrencyBRL(reportData.lucroLiquido)} (Margem: ${reportData.margemLiquidaPercent.toFixed(1)}%)\n\n`;
    summary += `Enquadramento Teto MEI (R$ 81.000,00): ${reportData.percentualLimiteMEI.toFixed(1)}% utilizado (${reportData.statusLimite})\n`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] sm:max-h-[92vh] rounded-t-[32px] sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator (iOS WhatsApp style) */}
        <div 
          onClick={onClose}
          className="w-full flex flex-col items-center pt-2.5 pb-1 sm:hidden cursor-grab active:cursor-grabbing select-none bg-slate-50/70 border-b border-slate-100"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          <span className="text-[10px] text-slate-400 font-medium mt-0.5">Arraste para baixo para fechar</span>
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2dd683] text-[#000000] rounded-xl font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-[#000000] dark:text-white font-display flex items-center">
                  Exportar Balanços Mensais & DRE em PDF
                  <InfoTooltip text="Gere um documento contábil formatado pronto para arquivamento, declaração anual ou comprovação bancária." />
                </h3>
                <span className="text-[10px] bg-[#f3ecfd] text-[#5E17EB] font-bold px-2 py-0.5 rounded-full border border-[#ddd0fb]">
                  Exercício {selectedYear}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar & Options */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-[#2dd683] text-[#000000] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Visualização Formatada
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-[#2dd683] text-[#000000] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Opções do Relatório
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold transition flex items-center gap-2 cursor-pointer"
              title="Copiar resumo textual"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold transition flex items-center gap-2 cursor-pointer"
              title="Imprimir relatório"
            >
              <Printer className="w-4 h-4 text-[#004AAD]" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="h-11 px-4 rounded-xl bg-[#5E17EB] hover:bg-[#4d11c7] text-white font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              title="Baixar arquivo PDF"
            >
              <Download className="w-4 h-4 text-[#2dd683]" />
              <span>Baixar PDF Oficial</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'config' ? (
            /* CONFIGURATION PANEL */
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#5E17EB]" />
                  Dados do Cabeçalho e da Empresa
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Razão Social / Nome Fantasia:</label>
                    <input
                      type="text"
                      value={empresaNome}
                      onChange={(e) => setEmpresaNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#2dd683]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">CNPJ da Empresa:</label>
                    <input
                      type="text"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#2dd683]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">Responsável pela Emissão / Titular:</label>
                    <input
                      type="text"
                      value={responsavel}
                      onChange={(e) => setResponsavel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-[#2dd683]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#004AAD]" />
                  Seções Incluídas no Arquivo PDF
                </h4>

                <div className="space-y-2.5 text-xs font-medium">
                  <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDRE}
                      onChange={(e) => setIncludeDRE(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2dd683] accent-[#2dd683] cursor-pointer"
                    />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Demonstrativo do Resultado do Exercício (DRE)</strong>
                      <span className="text-[11px] text-slate-500">Receita Bruta, Deduções, Custo CMV, Despesas Administrativas e Lucro Líquido.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMonthlyBalance}
                      onChange={(e) => setIncludeMonthlyBalance(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2dd683] accent-[#2dd683] cursor-pointer"
                    />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Balanço Financeiro Mensal (12 Meses)</strong>
                      <span className="text-[11px] text-slate-500">Fluxo discriminado mês a mês com receitas, despesas, DAS pago, saldos e acumulado.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFiscalBreakdown}
                      onChange={(e) => setIncludeFiscalBreakdown(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2dd683] accent-[#2dd683] cursor-pointer"
                    />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Apuração Fiscal Auxiliar PGDAS-D & DASN-SIMEI</strong>
                      <span className="text-[11px] text-slate-500">Segregação por comércio e serviços, com nota e sem nota fiscal emitida.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSignatures}
                      onChange={(e) => setIncludeSignatures(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2dd683] accent-[#2dd683] cursor-pointer"
                    />
                    <div>
                      <strong className="block text-slate-900 dark:text-white">Termo de Encerramento e Campos de Assinatura</strong>
                      <span className="text-[11px] text-slate-500">Declaração de fidedignidade contábil e espaço para assinatura do Titular e Contador.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 bg-[#2dd683] text-[#000000] rounded-xl font-bold hover:bg-[#25bc73] transition cursor-pointer"
                >
                  Ver Pré-visualização com as Novas Opções
                </button>
              </div>
            </div>
          ) : (
            /* PRINT PREVIEW SHEET (High fidelity A4 sheet layout) */
            <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto space-y-8 font-sans print:p-0 print:border-0 print:shadow-none print:bg-white text-slate-900 dark:text-slate-100">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-black tracking-widest text-[#5E17EB] uppercase block">
                      MEI-Simple ERP • Sistema de Gestão Contábil
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase font-display mt-0.5">
                      Demonstrativo de Resultados (DRE) & Balanços Mensais
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Relatório Contábil e Fiscal Consolidado para o Exercício de {selectedYear}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-[#2dd683] text-[#000000] rounded-lg font-black text-xs font-mono">
                      EXERCÍCIO {selectedYear}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-mono mt-1">
                      Regime: SIMEI (Lei 123/06)
                    </span>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <div><strong>Empresa:</strong> {empresaNome}</div>
                  <div><strong>CNPJ:</strong> <span className="font-mono">{cnpj}</span></div>
                  <div><strong>Responsável:</strong> {responsavel}</div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Receita Bruta Total</span>
                  <strong className="text-base font-black font-mono text-[#000000] dark:text-white block mt-0.5">
                    {formatCurrencyBRL(reportData.totalReceitaBruta)}
                  </strong>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total de Custos & Desp.</span>
                  <strong className="text-base font-black font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                    {formatCurrencyBRL(reportData.totalDespesasGerais)}
                  </strong>
                </div>

                <div className="p-3.5 bg-[#e6effa] dark:bg-blue-950/30 rounded-xl border border-[#b8d4f6] dark:border-blue-900/50">
                  <span className="text-[10px] font-bold text-[#004AAD] dark:text-blue-300 uppercase block">Tributos DAS Pagos</span>
                  <strong className="text-base font-black font-mono text-[#004AAD] dark:text-blue-400 block mt-0.5">
                    {formatCurrencyBRL(reportData.totalDAS)}
                  </strong>
                </div>

                <div className="p-3.5 bg-[#f3ecfd] dark:bg-purple-950/30 rounded-xl border border-[#ddd0fb] dark:border-purple-900/50">
                  <span className="text-[10px] font-bold text-[#5E17EB] dark:text-purple-300 uppercase block">Lucro Líquido Final</span>
                  <strong className="text-base font-black font-mono text-[#5E17EB] dark:text-purple-400 block mt-0.5">
                    {formatCurrencyBRL(reportData.lucroLiquido)}
                  </strong>
                </div>
              </div>

              {/* 1. DRE Table */}
              {includeDRE && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#2dd683]" />
                      1. Demonstração do Resultado do Exercício (DRE Simplificada)
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Regime de Caixa</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                          <th className="p-2.5">Estrutura Contábil / Rubrica</th>
                          <th className="p-2.5 text-right">Valor Apurado (R$)</th>
                          <th className="p-2.5 text-right">% s/ Receita</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 font-bold">
                          <td className="p-2.5">1. RECEITA OPERACIONAL BRUTA (+)</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrencyBRL(reportData.totalReceitaBruta)}</td>
                          <td className="p-2.5 text-right font-mono">100.0%</td>
                        </tr>
                        <tr className="text-slate-600 dark:text-slate-400">
                          <td className="p-2 pl-6">1.1 Venda de Mercadorias e Produtos (Comércio)</td>
                          <td className="p-2 text-right font-mono">{formatCurrencyBRL(reportData.totalComercio)}</td>
                          <td className="p-2 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.totalComercio / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr className="text-slate-600 dark:text-slate-400">
                          <td className="p-2 pl-6">1.2 Prestação de Serviços em Geral</td>
                          <td className="p-2 text-right font-mono">{formatCurrencyBRL(reportData.totalServicos)}</td>
                          <td className="p-2 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.totalServicos / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">2. DEDUÇÕES E TRIBUTOS UNIFICADOS DAS (-)</td>
                          <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrencyBRL(reportData.totalDAS)}</td>
                          <td className="p-2.5 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.totalDAS / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 font-bold">
                          <td className="p-2.5">3. (=) RECEITA OPERACIONAL LÍQUIDA</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrencyBRL(reportData.receitaLiquida)}</td>
                          <td className="p-2.5 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.receitaLiquida / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">4. CUSTOS DE MERCADORIAS E INSUMOS (CMV) (-)</td>
                          <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrencyBRL(reportData.totalCustosInsumos)}</td>
                          <td className="p-2.5 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.totalCustosInsumos / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 font-bold">
                          <td className="p-2.5">5. (=) MARGEM DE CONTRIBUIÇÃO BRUTA</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrencyBRL(reportData.margemContribuicao)}</td>
                          <td className="p-2.5 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.margemContribuicao / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">6. DESPESAS OPERACIONAIS E ADMINISTRATIVAS (-)</td>
                          <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{formatCurrencyBRL(reportData.totalDespesasAdm + reportData.totalOutrasDespesas)}</td>
                          <td className="p-2.5 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${(((reportData.totalDespesasAdm + reportData.totalOutrasDespesas) / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr className="text-slate-600 dark:text-slate-400 text-[11px]">
                          <td className="p-1.5 pl-6">6.1 Despesas Administrativas e Ocupacionais (Aluguel, Luz, etc.)</td>
                          <td className="p-1.5 text-right font-mono">{formatCurrencyBRL(reportData.totalDespesasAdm)}</td>
                          <td className="p-1.5 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.totalDespesasAdm / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr className="text-slate-600 dark:text-slate-400 text-[11px]">
                          <td className="p-1.5 pl-6">6.2 Outras Despesas Operacionais (Taxas, Bancárias, etc.)</td>
                          <td className="p-1.5 text-right font-mono">{formatCurrencyBRL(reportData.totalOutrasDespesas)}</td>
                          <td className="p-1.5 text-right font-mono">{reportData.totalReceitaBruta > 0 ? `${((reportData.totalOutrasDespesas / reportData.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'}</td>
                        </tr>
                        <tr className="bg-[#f3ecfd] dark:bg-purple-950/40 text-[#5E17EB] dark:text-purple-300 font-extrabold text-xs border-t-2 border-[#5E17EB]">
                          <td className="p-3">7. (=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO)</td>
                          <td className="p-3 text-right font-mono">{formatCurrencyBRL(reportData.lucroLiquido)}</td>
                          <td className="p-3 text-right font-mono">{reportData.margemLiquidaPercent.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Monthly Balance Table */}
              {includeMonthlyBalance && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <Coins className="w-4 h-4 text-[#004AAD]" />
                      2. Balanço Financeiro Mensal (Mês a Mês do Exercício {selectedYear})
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">12 Competências</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#004AAD] text-white font-bold uppercase text-[10px]">
                          <th className="p-2.5">Competência</th>
                          <th className="p-2.5 text-right">Receitas (R$)</th>
                          <th className="p-2.5 text-right">Despesas (R$)</th>
                          <th className="p-2.5 text-right">DAS (R$)</th>
                          <th className="p-2.5 text-right">Saldo Líquido</th>
                          <th className="p-2.5 text-right">Margem</th>
                          <th className="p-2.5 text-right">Acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                        {reportData.meses.map((m) => (
                          <tr key={m.mesNum} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-2 font-sans font-semibold text-slate-800 dark:text-slate-200">{m.mesNum} - {m.mesNome}</td>
                            <td className="p-2 text-right">{formatCurrencyBRL(m.receita)}</td>
                            <td className="p-2 text-right">{formatCurrencyBRL(m.despesa)}</td>
                            <td className="p-2 text-right">{formatCurrencyBRL(m.das)}</td>
                            <td className={`p-2 text-right font-bold ${m.saldoLiquido >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                              {formatCurrencyBRL(m.saldoLiquido)}
                            </td>
                            <td className="p-2 text-right">{m.margemPercent.toFixed(1)}%</td>
                            <td className="p-2 text-right font-bold text-slate-900 dark:text-slate-100">{formatCurrencyBRL(m.saldoAcumulado)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 dark:bg-slate-900 font-bold text-xs border-t-2 border-slate-300 dark:border-slate-700">
                          <td className="p-2.5 font-sans">TOTAL ANUAL</td>
                          <td className="p-2.5 text-right">{formatCurrencyBRL(reportData.totalReceitaBruta)}</td>
                          <td className="p-2.5 text-right">{formatCurrencyBRL(reportData.totalDespesasGerais)}</td>
                          <td className="p-2.5 text-right">{formatCurrencyBRL(reportData.totalDAS)}</td>
                          <td className="p-2.5 text-right text-[#5E17EB]">{formatCurrencyBRL(reportData.lucroLiquido)}</td>
                          <td className="p-2.5 text-right">{reportData.margemLiquidaPercent.toFixed(1)}%</td>
                          <td className="p-2.5 text-right text-slate-900 dark:text-white">{formatCurrencyBRL(reportData.lucroLiquido)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. Fiscal Breakdown Table */}
              {includeFiscalBreakdown && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      3. Apuração Fiscal PGDAS-D & Livro Caixa Auxiliar
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Simples Nacional</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-700 text-white font-bold uppercase text-[10px]">
                          <th className="p-2.5">Competência</th>
                          <th className="p-2.5 text-right">Comércio (c/ NF)</th>
                          <th className="p-2.5 text-right">Comércio (s/ NF)</th>
                          <th className="p-2.5 text-right">Serviço (c/ NF)</th>
                          <th className="p-2.5 text-right">Serviço (s/ NF)</th>
                          <th className="p-2.5 text-right">Faturamento Bruto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                        {reportData.meses.map((m) => (
                          <tr key={m.mesNum} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <td className="p-2 font-sans font-semibold text-slate-800 dark:text-slate-200">{m.mesNome}/{selectedYear}</td>
                            <td className="p-2 text-right">{formatCurrencyBRL(m.comercioComNota)}</td>
                            <td className="p-2 text-right">{formatCurrencyBRL(m.comercioSemNota)}</td>
                            <td className="p-2 text-right">{formatCurrencyBRL(m.servicoComNota)}</td>
                            <td className="p-2 text-right">{formatCurrencyBRL(m.servicoSemNota)}</td>
                            <td className="p-2 text-right font-bold text-slate-900 dark:text-slate-100 bg-emerald-50/20 dark:bg-emerald-950/10">
                              {formatCurrencyBRL(m.receita)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Declaration & Signatures */}
              {includeSignatures && (
                <div className="pt-4 space-y-8 border-t border-slate-200 dark:border-slate-800">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>DECLARAÇÃO:</strong> As informações e valores constantes neste demonstrativo representam fidedignamente o livro caixa e as receitas auferidas pelo Microempreendedor Individual no exercício {selectedYear}, conforme a Lei Complementar 123/2006.
                  </div>

                  <div className="grid grid-cols-2 gap-12 pt-6">
                    <div className="text-center space-y-1">
                      <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-xs">
                        {empresaNome}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Titular Responsável / CNPJ: {cnpj}
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="border-t border-slate-400 dark:border-slate-600 pt-2 font-bold text-xs">
                        Responsável Contábil / Auditoria MEI
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Contabilidade & Gestão Tributária
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-[#2dd683]" />
            <span>Documento compatível com impressoras térmicas, jato de tinta, laser e arquivos PDF vetoriais A4.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadPDF}
              className="h-11 px-5 rounded-xl bg-[#5E17EB] hover:bg-[#4d11c7] text-white font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#2dd683]" />
              <span>Baixar Arquivo PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
