/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FinancialTransaction, Product, DASPayment, Client, Invoice, FinancialCategory, User } from '../types';
import { RelatorioCustomizavel } from './RelatorioCustomizavel';
import { ModalExportacaoPDF } from './ModalExportacaoPDF';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { downloadReportPDF } from '../lib/pdfReportGenerator';
import { 
  BarChart, 
  Download, 
  TrendingUp, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Layers,
  FileText,
  Printer,
  Coins,
  Activity,
  FileCode
} from 'lucide-react';
import { downloadInvoicesZip } from '../utils/xmlDownloader';

interface RelatoriosGeraisProps {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
  products: Product[];
  dasPayments: DASPayment[];
  clients: Client[];
  invoices: Invoice[];
  onPayDAS: (id: string) => void;
  addLog: (modulo: string, acao: any, descricao: string) => void;
  currentUser: User | null;
}

export const RelatoriosGerais = React.memo(function RelatoriosGerais({
  transactions,
  categories,
  products,
  dasPayments,
  clients,
  invoices,
  onPayDAS,
  addLog,
  currentUser
}: RelatoriosGeraisProps) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [reportType, setReportType] = useState<'DRE' | 'COMPLIANCE' | 'FISCAL_REPORTS' | 'GIRO' | 'CUSTOM'>('DRE');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Year filter logic & DRE metrics memoized for CPU efficiency
  const {
    yearTransactions,
    totalInboundSales,
    totalProcurementCosts,
    totalAdministrativeDrafts,
    totalDASTaxesPaid,
    totalOtherExpenses,
    totalExpensesSum,
    netEarningsSum,
    targetSafetyRatio
  } = useMemo(() => {
    const yTrans = transactions.filter(t => t.data.startsWith(selectedYear));
    const inbound = yTrans
      .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO')
      .reduce((sum, item) => sum + item.valor, 0);

    const procurement = yTrans
      .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.categoriaId === 'cat-d1')
      .reduce((sum, item) => sum + item.valor, 0);

    const adminDrafts = yTrans
      .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.categoriaId === 'cat-d2')
      .reduce((sum, item) => sum + item.valor, 0);

    const dasPaid = dasPayments
      .filter(d => d.status === 'PAGO')
      .reduce((sum, item) => sum + item.valor, 0);

    const otherExp = yTrans
      .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.categoriaId !== 'cat-d1' && t.categoriaId !== 'cat-d2')
      .reduce((sum, item) => sum + item.valor, 0);

    const expSum = procurement + adminDrafts + dasPaid + otherExp;
    const netSum = inbound - expSum;
    const safetyRatio = inbound / 81000.00;

    return {
      yearTransactions: yTrans,
      totalInboundSales: inbound,
      totalProcurementCosts: procurement,
      totalAdministrativeDrafts: adminDrafts,
      totalDASTaxesPaid: dasPaid,
      totalOtherExpenses: otherExp,
      totalExpensesSum: expSum,
      netEarningsSum: netSum,
      targetSafetyRatio: safetyRatio
    };
  }, [transactions, dasPayments, selectedYear]);

  // 2. DASN-SIMEI CEILING TRACKING
  const MEI_ANNUAL_CEILING = 81000.00;

  const getAlertProfile = () => {
    if (targetSafetyRatio >= 1.0) {
      return {
        label: 'ESTOUROU O LIMITE LEGAL (100%+)',
        color: 'border-red-300 bg-red-50/25 text-red-700 dark:border-red-900/30',
        helper: 'Atenção imediata! Seu faturamento anual excedeu os R$ 81.000,00 do regime MEI. Recomenda-se contatar um contador para migrar para Microempresa (ME) de forma voluntária.'
      };
    }
    if (targetSafetyRatio >= 0.8) {
      return {
        label: 'ATENÇÃO: LIMITE DE ALERTA (80%)',
        color: 'border-amber-300 bg-amber-50/20 text-amber-700 dark:border-amber-900/30',
        helper: 'Você atingiu 80% do limite legal para o MEI. Se ultrapassar R$ 81.000,00, poderá ser desenquadrado e passar ao regime de tributação do Simples Nacional tradicional.'
      };
    }
    return {
      label: 'REGIME SEGURO E CONFORME',
      color: 'border-emerald-300 bg-emerald-50/15 text-emerald-700 dark:border-emerald-900/35',
      helper: 'Seu faturamento acumulado está seguro e perfeitamente dentro dos limites estipulados para continuar usufruindo da simplificação contábil de recolhimento DAS.'
    };
  };

  const alertLevel = getAlertProfile();

  // Excel / CSV Export simulated script trigger
  const triggerSpreadsheetDownload = (format: 'CSV' | 'XLSX') => {
    let outputString = 'ERP ESSENCIAL MEI - RELATORIO DRE SIMPLIFICADA\n';
    outputString += `Exercicio de Referencia: ${selectedYear}\n\n`;
    outputString += `Receita Bruta Total;${totalInboundSales.toFixed(2)}\n`;
    outputString += `(-) Custo de Compra de Materias Primas;${totalProcurementCosts.toFixed(2)}\n`;
    outputString += `(-) Despesas Administrativas Gerais;${totalAdministrativeDrafts.toFixed(2)}\n`;
    outputString += `(-) Tarifas e Impostos DAS Pagos;${totalDASTaxesPaid.toFixed(2)}\n`;
    outputString += `(-) Outras Despesas Compensadas;${totalOtherExpenses.toFixed(2)}\n`;
    outputString += `(=) LUCRO LIQUIDO DO EXERCICIO;${netEarningsSum.toFixed(2)}\n`;

    const blob = new Blob([outputString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Financeiro_MEI_${selectedYear}.${format.toLowerCase()}`;
    link.click();
    
    addLog('Relatorios', 'EDICAO', `Exportado relatório financeiro anual ${selectedYear} em formato ${format}`);
    alert(`Relatório em formato ${format} exportado com sucesso no gerenciador de downloads!`);
  };

  const exportPGDASCSV = () => {
    let csv = "MES;RECEITA COMERCIO (COM NOTA);RECEITA COMERCIO (SEM NOTA);RECEITA SERVICO (COM NOTA);RECEITA SERVICO (SEM NOTA);FATURAMENTO BRUTO TOTAL\n";
    
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    meses.forEach((nome, idx) => {
      const mNum = idx + 1;
      const monthStr = `${selectedYear}-${String(mNum).padStart(2, '0')}`;
      
      const totalComercio = yearTransactions
        .filter(t => t.tipo === 'RECEITA' && t.data.startsWith(monthStr) && t.categoriaId === 'cat-r1')
        .reduce((sum, t) => sum + t.valor, 0);
        
      const invoicesComercio = invoices
        .filter(inv => inv.tipo === 'NFE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
        .reduce((sum, inv) => sum + inv.valorTotal, 0);
        
      const comercioComNota = Math.min(totalComercio, invoicesComercio);
      const comercioSemNota = Math.max(0, totalComercio - comercioComNota);

      const totalServico = yearTransactions
        .filter(t => t.tipo === 'RECEITA' && t.data.startsWith(monthStr) && t.categoriaId === 'cat-r2')
        .reduce((sum, t) => sum + t.valor, 0);
        
      const invoicesServico = invoices
        .filter(inv => inv.tipo === 'NFSE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
        .reduce((sum, inv) => sum + inv.valorTotal, 0);
        
      const servicoComNota = Math.min(totalServico, invoicesServico);
      const servicoSemNota = Math.max(0, totalServico - servicoComNota);
      const totalMes = totalComercio + totalServico;

      csv += `${nome}/${selectedYear};${comercioComNota.toFixed(2)};${comercioSemNota.toFixed(2)};${servicoComNota.toFixed(2)};${servicoSemNota.toFixed(2)};${totalMes.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PGDAS_D_Auxiliar_MEI_${selectedYear}.csv`;
    link.click();
    
    addLog('Relatorios', 'EXPORTACAO', `Exportado relatório detalhado PGDAS-D em CSV para o exercício ${selectedYear}`);
    alert("Relatório CSV gerado com sucesso! Arquivo copiado para a pasta de downloads.");
  };

  const downloadDASSimulatedBoleto = (period: string, amount: number) => {
    let slipText = `=========================================================\n`;
    slipText += `           RECEITA FEDERAL DO BRASIL - SIMPLES NACIONAL          \n`;
    slipText += `                 DOCUMENTO DE ARRECADAÇÃO DO SIMPLES (DAS)        \n`;
    slipText += `=========================================================\n\n`;
    slipText += `PERÍODO DE APURAÇÃO: ${period}\n`;
    slipText += `DATA DE VENCIMENTO: 20/07/2026\n`;
    slipText += `VALOR TOTAL DA GUIA: R$ ${amount.toFixed(2)}\n\n`;
    slipText += `------------------ COMPOSIÇÃO DOS IMPOSTOS ------------------\n`;
    slipText += `- INSS (Previdência Social - 5% salário mínimo): R$ 70,60\n`;
    slipText += `- ICMS (Imposto de Comércio - Comércio): R$ 1,00\n`;
    slipText += `- ISS  (Imposto de Serviços - Serviços): R$ 5,00\n\n`;
    slipText += `------------------ CÓDIGO DE BARRAS / LINHA DIGITÁVEL -----\n`;
    slipText += `83670000000-5  71200028000-0  00101020260-2  01000000001-3\n\n`;
    slipText += `=========================================================\n`;
    slipText += `Pague via Internet Banking ou Caixa Eletrônico até a data limite.\n`;

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Boleto_DAS_MEI_Competencia_${period.replace('/', '_')}.txt`;
    link.click();

    addLog('Relatorios', 'EXPORTACAO', `Realizado download do boleto DAS referente à competência ${period}`);
    alert(`Boleto virtual DAS referente à competência ${period} baixado como arquivo de texto estruturado!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Summary Card: Layout padrão Fiscal & DAS */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5">
        {/* Header do Card com Título e Ações */}
        <div className="pb-4 border-b border-slate-100">
          <SectionHeader
            as="h2"
            icon={<BarChart className="w-6 h-6 text-emerald-600" />}
            title="Relatórios Fiscais & Contábeis MEI"
            info="Demonstração de resultados (DRE), conformidade tributária DASN-SIMEI e integrações oficiais"
            badges={
              <StatusBadge
                tone="success"
                label={`Exercício ${selectedYear}`}
              />
            }
            actions={
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                  <span className="text-slate-500 font-semibold text-xs">Exercício:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent text-slate-800 cursor-pointer font-extrabold outline-none text-xs"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="h-10 px-4 rounded-xl bg-[#5E17EB] hover:bg-[#4d11c7] text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  title="Exportar Balanços e DRE em PDF Formatado"
                >
                  <FileText className="w-4 h-4 text-[#2dd683]" />
                  <span>Exportar PDF Oficial</span>
                </button>
              </div>
            }
          />
        </div>

        {/* Segment Tabs Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setReportType('DRE')}
            className={`h-9 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              reportType === 'DRE'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>DRE Simplificada</span>
          </button>
          
          <button
            type="button"
            onClick={() => setReportType('COMPLIANCE')}
            className={`h-9 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              reportType === 'COMPLIANCE'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>DASN-SIMEI & Limites MEI</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('FISCAL_REPORTS')}
            className={`h-9 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              reportType === 'FISCAL_REPORTS'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-blue-600" />
            <span>Relatórios Fiscais (DAS / PGDAS-D)</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('CUSTOM')}
            className={`h-9 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              reportType === 'CUSTOM'
                ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Relatórios Customizáveis</span>
          </button>
        </div>

        {/* Métricas Acumuladas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 block">Receita Bruta Total</span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5 block font-mono">
              R$ {totalInboundSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Entradas acumuladas ({selectedYear})</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <span className="text-[11px] font-semibold text-slate-500 block">Custos & Despesas</span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5 block font-mono">
              R$ {totalExpensesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Insumos, luz, taxas e guias</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            netEarningsSum >= 0 ? 'bg-emerald-50/50 border-emerald-200/80' : 'bg-rose-50/50 border-rose-200/80'
          }`}>
            <span className={`text-[11px] font-semibold block ${netEarningsSum >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              Resultado Líquido do Exercício
            </span>
            <span className={`text-xl font-extrabold mt-0.5 block font-mono ${
              netEarningsSum >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              R$ {netEarningsSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] mt-0.5 block font-medium ${netEarningsSum >= 0 ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
              Renda isenta para IRPF
            </span>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            targetSafetyRatio >= 1.0 
              ? 'bg-rose-50/50 border-rose-200/80' 
              : targetSafetyRatio >= 0.8 
                ? 'bg-amber-50/50 border-amber-200/80' 
                : 'bg-blue-50/50 border-blue-200/80'
          }`}>
            <span className={`text-[11px] font-semibold block ${
              targetSafetyRatio >= 1.0 ? 'text-rose-700' : targetSafetyRatio >= 0.8 ? 'text-amber-700' : 'text-blue-700'
            }`}>
              Teto MEI R$ 81.000 ({(targetSafetyRatio * 100).toFixed(1)}%)
            </span>
            <span className={`text-xl font-extrabold mt-0.5 block font-mono ${
              targetSafetyRatio >= 1.0 ? 'text-rose-700' : targetSafetyRatio >= 0.8 ? 'text-amber-700' : 'text-blue-700'
            }`}>
              R$ {(MEI_ANNUAL_CEILING - totalInboundSales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] mt-0.5 block font-medium ${
              targetSafetyRatio >= 1.0 ? 'text-rose-600/80' : targetSafetyRatio >= 0.8 ? 'text-amber-600/80' : 'text-blue-600/80'
            }`}>
              Saldo disponível no teto
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          REPORT VIEW 1: DEMONSTRAÇÃO DO RESULTADO (DRE SIMPLIFICADA)
          ------------------------------------------------------------- */}
      {reportType === 'DRE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Book DRE list table */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
            <div className="flex justify-between items-baseline pb-1.5 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                Demonstração de Resultado do Exercício (Regime de Caixa)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                DRE do MEI {selectedYear}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Row 1: Receita operacional bruta */}
              <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="text-slate-900 block font-bold">RECEITA BRUTA DE VENDAS E SERVIÇOS (+)</strong>
                  <span className="text-[10.5px] text-slate-500 font-medium">Total faturado e compensado no livro caixa do MEI</span>
                </div>
                <strong className="text-emerald-700 font-mono text-sm font-extrabold">
                  R$ {totalInboundSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>

              {/* Row 2: Deductions CM */}
              <div className="flex justify-between items-center p-3 border-b border-slate-100 pl-4">
                <div>
                  <span className="text-slate-800 font-semibold">Custo de Mercadorias para Revenda (-)</span>
                  <span className="text-[10.5px] text-slate-500 block">Madeiras, insumos, componentes e ferragens</span>
                </div>
                <span className="text-slate-800 font-mono font-semibold">
                  R$ {totalProcurementCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Row 3: Administrative charges */}
              <div className="flex justify-between items-center p-3 border-b border-slate-100 pl-4">
                <div>
                  <span className="text-slate-800 font-semibold">Despesas Administrativas e Fixas (-)</span>
                  <span className="text-[10.5px] text-slate-500 block">Aluguel da oficina física e consumo de energia</span>
                </div>
                <span className="text-slate-800 font-mono font-semibold">
                  R$ {totalAdministrativeDrafts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Row 4: Taxes and DAS */}
              <div className="flex justify-between items-center p-3 border-b border-slate-100 pl-4">
                <div>
                  <span className="text-slate-800 font-semibold">Impostos Unificados DAS Liquidados (-)</span>
                  <span className="text-[10.5px] text-slate-500 block">Guias fiscais mensais do Simples Nacional compensadas</span>
                </div>
                <span className="text-slate-800 font-mono font-semibold">
                  R$ {totalDASTaxesPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Row 5: Miscellaneous */}
              <div className="flex justify-between items-center p-3 border-b border-slate-100 pl-4">
                <div>
                  <span className="text-slate-800 font-semibold">Outras Despesas Operacionais (-)</span>
                  <span className="text-[10.5px] text-slate-500 block">Seguros, taxas de banco e maquininha</span>
                </div>
                <span className="text-slate-800 font-mono font-semibold">
                  R$ {totalOtherExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Row 6: Final margin result block */}
              <div className="flex justify-between items-center p-4 bg-slate-50 text-slate-900 rounded-xl border border-slate-300">
                <div>
                  <strong className="text-sm block font-extrabold">RESULTADO LÍQUIDO DO PERÍODO (=)</strong>
                  <span className="text-[10px] text-slate-600 font-bold uppercase">Renda Líquida para Isenção fiscal IRPF</span>
                </div>
                <strong className={`font-mono text-base font-extrabold ${netEarningsSum >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  R$ {netEarningsSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick PDF export toolbox panel */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center">
                Exportação para Contabilidade
                <InfoTooltip text="Exporte seus dados financeiros consolidados diretamente para fins de declaração anual dos rendimentos ou para comprovação de renda em bancos." />
              </h4>
            </div>

            <div className="space-y-2.5 font-bold text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  downloadReportPDF({
                    selectedYear,
                    transactions,
                    dasPayments,
                    invoices,
                    companyName: 'Carlos Oliveira MEI',
                    cnpj: '30.751.934/0001-30',
                    responsavelNome: currentUser?.name || 'Carlos Oliveira'
                  });
                  addLog('Relatorios', 'EXPORTACAO', `Exportado arquivo PDF oficial de Balanços e DRE (${selectedYear})`);
                }}
                className="w-full h-11 px-4 bg-[#5E17EB] hover:bg-[#4d11c7] text-white rounded-xl flex items-center justify-between transition cursor-pointer font-bold shadow-xs"
              >
                <span>Baixar PDF de Balanços & DRE</span>
                <Download className="w-4 h-4 text-[#2dd683]" />
              </button>

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="w-full h-11 px-4 bg-[#2dd683] hover:bg-[#25bc73] text-black rounded-xl flex items-center justify-between transition cursor-pointer font-extrabold shadow-xs"
              >
                <span>Pré-visualizar & Imprimir</span>
                <Printer className="w-4 h-4 text-black" />
              </button>

              <button
                onClick={() => triggerSpreadsheetDownload('CSV')}
                className="w-full h-11 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-between transition cursor-pointer font-semibold"
              >
                <span>Exportar Planilha (.CSV)</span>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => triggerSpreadsheetDownload('XLSX')}
                className="w-full h-11 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-between transition cursor-pointer font-semibold"
              >
                <span>Exportar Demonstrativo (.XLSX)</span>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  const filteredByYear = invoices.filter(inv => {
                    const y = new Date(inv.dataEmissao).getFullYear();
                    return y === Number(selectedYear);
                  });
                  const listToDownload = filteredByYear.length > 0 ? filteredByYear : invoices;
                  await downloadInvoicesZip(listToDownload, `Pacote_Fiscal_XML_${selectedYear}_MEI.zip`);
                  addLog('Relatorios', 'EXPORTACAO', `Exportou pacote ZIP com arquivos XML das notas fiscais do ano ${selectedYear}`);
                }}
                className="w-full h-11 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-between transition cursor-pointer font-semibold"
                title="Baixar pacote ZIP com todos os arquivos XML das notas fiscais para o contador"
              >
                <span>Exportar Pacote Fiscal XML (.ZIP)</span>
                <FileCode className="w-4 h-4 text-sky-600" />
              </button>
            </div>
            
            <div className="p-3 bg-indigo-50/50 border border-indigo-200/60 text-[11px] text-slate-600 leading-relaxed rounded-xl font-medium">
              💡 <strong>Dica MEI:</strong> O Lucro Líquido apurado acima pode ser transferido ao titular como <strong>Rendimento Isento e Não Tributável</strong> em seu IRPF pessoal.
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          REPORT VIEW 2: DASN-SIMEI LIMIT AND CEILING COMPLIANCE PREVIEW
          ------------------------------------------------------------- */}
      {reportType === 'COMPLIANCE' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-baseline pb-2 border-b border-slate-100">
            <h3 className="text-sm font-extrabold text-slate-900">Declaração de Conformidade Tributária (DASN-SIMEI)</h3>
            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              Teto Legal: R$ 81.000,00
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Limit bars */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">Faturamento Realizado ({selectedYear})</span>
                  <span className="text-slate-900 font-mono">
                    R$ {totalInboundSales.toLocaleString('pt-BR')} de {MEI_ANNUAL_CEILING.toLocaleString('pt-BR')} ({(targetSafetyRatio * 100).toFixed(1)}%)
                  </span>
                </div>
                
                {/* Progress bar visual container */}
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full transition-all duration-300 font-sans text-[9px] text-center text-white font-bold flex items-center justify-center ${
                      targetSafetyRatio >= 1.0 
                        ? 'bg-rose-600' 
                        : targetSafetyRatio >= 0.8 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(targetSafetyRatio * 100, 100)}%` }}
                  >
                    {(targetSafetyRatio * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Status Alert panel */}
              <div className={`p-4 border rounded-2xl space-y-2 text-xs ${alertLevel.color}`}>
                <strong className="block text-sm uppercase font-extrabold">{alertLevel.label}</strong>
                <p className="leading-relaxed font-sans font-medium">{alertLevel.helper}</p>
              </div>
            </div>

            {/* Checklist guide pre-filled for DASN-Simei submission */}
            <div className="border border-slate-200 p-5 rounded-2xl bg-slate-50 space-y-4 text-xs font-sans">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Guia Prático para Preencher a Declaração Anual</span>
                <InfoTooltip text="Para entregar a DASN-SIMEI até 31 de maio, utilize os valores apurados abaixo diretamente no portal oficial do Empreendedor:" />
              </h4>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Comércio / Produtos</span>
                  <strong className="text-xs font-mono text-slate-900 block mt-1 font-bold">
                    R$ {totalInboundSales.toLocaleString('pt-BR')}
                  </strong>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Venda com e sem NF</span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Serviços Gerais</span>
                  <strong className="text-xs font-mono text-slate-900 block mt-1 font-bold">
                    R$ 0,00
                  </strong>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">Sem serviços vinculados</span>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl border border-slate-205 flex items-baseline gap-2 text-[11px] leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 self-start mt-0.5" />
                <span className="text-slate-600 block">
                  A não entrega da declaração dentro do prazo acarreta em multa mínima de <strong>R$ 50,00</strong> gerada eletronicamente na sua caixa de mensagens do DTE-CNPJ.
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          REPORT VIEW 3: RELATÓRIOS E OBRIGAÇÕES FISCAIS (DAS / PGDAS-D)
          ------------------------------------------------------------- */}
      {reportType === 'FISCAL_REPORTS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Receita Bruta Acumulada</span>
                <strong className="text-sm font-mono text-slate-900 font-extrabold">
                  R$ {totalInboundSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">DAS Competências Pagas</span>
                <strong className="text-sm font-mono text-slate-900 font-extrabold">
                  {dasPayments.filter(d => d.status === 'PAGO').length} de {dasPayments.length} meses ({totalDASTaxesPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                </strong>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-xs">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Situação Fiscal Geral</span>
                <strong className="text-xs text-amber-600 font-extrabold block">
                  {dasPayments.some(d => d.status === 'PENDENTE') ? 'PENDÊNCIAS EM ABERTO' : 'REGULAR E EM DIA'}
                </strong>
              </div>
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Livro Caixa Auxiliar de Apuração Mensal (Simples Nacional)</span>
                  <InfoTooltip text="Valores consolidados em regime de caixa para facilitar o preenchimento da declaração PGDAS-D e DASN-SIMEI." />
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await downloadInvoicesZip(invoices, `Pacote_XML_Notas_Fiscais_MEI_${selectedYear}.zip`);
                    addLog('Relatorios', 'EXPORTACAO', `Download do pacote completo de arquivos XML das notas fiscais do exercício ${selectedYear}`);
                  }}
                  className="h-10 px-4 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                  title="Baixar todos os arquivos XML das notas fiscais do MEI em formato .ZIP"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Baixar XMLs (.ZIP)</span>
                </button>
                <button
                  type="button"
                  onClick={exportPGDASCSV}
                  className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel / CSV
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs"
                  title="Pré-visualizar ou Baixar PDF Formatado"
                >
                  <Printer className="w-4 h-4 text-slate-700" />
                  <span>Imprimir / PDF Oficial</span>
                </button>
              </div>
            </div>

            {/* Responsive Table Grid */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-3">Competência</th>
                    <th className="p-3 text-right">Comércio (c/ Nota)</th>
                    <th className="p-3 text-right">Comércio (s/ Nota)</th>
                    <th className="p-3 text-right">Serviço (c/ Nota)</th>
                    <th className="p-3 text-right">Serviço (s/ Nota)</th>
                    <th className="p-3 text-right bg-emerald-50 text-slate-900 font-extrabold">Faturamento Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { num: '01', nome: 'Janeiro' },
                    { num: '02', nome: 'Fevereiro' },
                    { num: '03', nome: 'Março' },
                    { num: '04', nome: 'Abril' },
                    { num: '05', nome: 'Maio' },
                    { num: '06', nome: 'Junho' },
                    { num: '07', nome: 'Julho' },
                    { num: '08', nome: 'Agosto' },
                    { num: '09', nome: 'Setembro' },
                    { num: '10', nome: 'Outubro' },
                    { num: '11', nome: 'Novembro' },
                    { num: '12', nome: 'Dezembro' }
                  ].map((mes) => {
                    const monthStr = `${selectedYear}-${mes.num}`;
                    
                    const totalComercio = yearTransactions
                      .filter(t => t.tipo === 'RECEITA' && t.data.startsWith(monthStr) && t.categoriaId === 'cat-r1')
                      .reduce((sum, t) => sum + t.valor, 0);
                      
                    const invoicesComercio = invoices
                      .filter(inv => inv.tipo === 'NFE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
                      .reduce((sum, inv) => sum + inv.valorTotal, 0);
                      
                    const comercioComNota = Math.min(totalComercio, invoicesComercio);
                    const comercioSemNota = Math.max(0, totalComercio - comercioComNota);

                    const totalServico = yearTransactions
                      .filter(t => t.tipo === 'RECEITA' && t.data.startsWith(monthStr) && t.categoriaId === 'cat-r2')
                      .reduce((sum, t) => sum + t.valor, 0);
                      
                    const invoicesServico = invoices
                      .filter(inv => inv.tipo === 'NFSE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
                      .reduce((sum, inv) => sum + inv.valorTotal, 0);
                      
                    const servicoComNota = Math.min(totalServico, invoicesServico);
                    const servicoSemNota = Math.max(0, totalServico - servicoComNota);
                    const totalMes = totalComercio + totalServico;

                    return (
                      <tr key={mes.num} className="hover:bg-slate-50 font-mono">
                        <td className="p-3 font-semibold font-sans text-slate-800">{mes.nome}</td>
                        <td className="p-3 text-right text-slate-600">R$ {comercioComNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-slate-600">R$ {comercioSemNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-slate-600">R$ {servicoComNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right text-slate-600">R$ {servicoSemNota.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right bg-emerald-50/50 font-extrabold text-slate-900">
                          R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl text-xs text-slate-700 leading-relaxed font-medium">
              💡 <strong>Didática do Preenchimento:</strong> Ao acessar o portal do Simples Nacional da Receita Federal (PGDAS-D), digite os valores separados por comércio e serviços, separando o faturamento que teve emissão de NF daquele que não teve.
            </div>
          </div>

          {/* DAS Monthly Manager Section */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Guia de Recolhimento Mensal (DAS-MEI {selectedYear})</span>
                <InfoTooltip text="Acompanhe o recolhimento das guias mensais unificadas de tributos. Pague diretamente pelo ERP para liquidar suas obrigações!" />
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dasPayments
                .filter(das => das.periodoReferencia.endsWith(selectedYear))
                .map((das) => {
                  return (
                    <div key={das.id} className="p-4 border border-slate-200 rounded-xl flex flex-col justify-between hover:shadow-xs transition bg-slate-50/50">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <strong className="text-xs font-bold text-slate-800">Competência {das.periodoReferencia}</strong>
                          <span className="text-[10px] text-slate-400 block font-sans mt-0.5">Vencimento: 20/{das.periodoReferencia}</span>
                        </div>

                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          das.status === 'PAGO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {das.status}
                        </span>
                      </div>

                      <div className="mt-4 flex justify-between items-baseline">
                        <span className="text-xs text-slate-500 font-medium">Total Devido:</span>
                        <strong className="text-sm font-mono text-slate-900 font-extrabold">R$ {das.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                        <button
                          type="button"
                          onClick={() => downloadDASSimulatedBoleto(das.periodoReferencia, das.valor)}
                          className="flex-1 h-10 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Boleto
                        </button>
                        
                        {das.status !== 'PAGO' ? (
                          <button
                            type="button"
                            onClick={() => {
                              onPayDAS(das.id);
                              addLog('Relatorios', 'EDICAO', `Quitada guia DAS da competência ${das.periodoReferencia} via ERP`);
                            }}
                            className="flex-1 h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Pagar DAS
                          </button>
                        ) : (
                          <span className="flex-1 h-10 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5">
                            ✅ Imposto Pago
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {reportType === 'CUSTOM' && (
        <RelatorioCustomizavel
          transactions={transactions}
          categories={categories}
          products={products}
          clients={clients}
          invoices={invoices}
          currentUser={currentUser}
          addLog={addLog}
        />
      )}

      {/* PDF Export & Print Preview Modal */}
      <ModalExportacaoPDF
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        transactions={transactions}
        dasPayments={dasPayments}
        invoices={invoices}
        categories={categories}
        selectedYear={selectedYear}
        currentUser={currentUser}
        addLog={addLog}
      />

    </div>
  );
});
