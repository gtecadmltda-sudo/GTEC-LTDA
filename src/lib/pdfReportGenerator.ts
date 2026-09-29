/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialTransaction, DASPayment, Invoice, FinancialCategory } from '../types';

export interface ReportPDFOptions {
  selectedYear: string;
  transactions: FinancialTransaction[];
  dasPayments: DASPayment[];
  invoices: Invoice[];
  categories?: FinancialCategory[];
  companyName?: string;
  cnpj?: string;
  responsavelNome?: string;
  includeDRE?: boolean;
  includeMonthlyBalance?: boolean;
  includeFiscalBreakdown?: boolean;
  includeSignatures?: boolean;
}

export interface MonthlyBalanceData {
  mesNum: string;
  mesNome: string;
  receita: number;
  despesa: number;
  das: number;
  saldoLiquido: number;
  saldoAcumulado: number;
  margemPercent: number;
  comercioComNota: number;
  comercioSemNota: number;
  servicoComNota: number;
  servicoSemNota: number;
}

export interface CalculatedReportData {
  selectedYear: string;
  totalReceitaBruta: number;
  totalComercio: number;
  totalServicos: number;
  totalCustosInsumos: number;
  totalDespesasAdm: number;
  totalOutrasDespesas: number;
  totalDespesasGerais: number;
  totalDAS: number;
  receitaLiquida: number;
  margemContribuicao: number;
  lucroLiquido: number;
  margemLiquidaPercent: number;
  limiteMEI: number;
  percentualLimiteMEI: number;
  statusLimite: 'REGULAR' | 'ALERTA' | 'EXCEDIDO';
  meses: MonthlyBalanceData[];
}

export function calculateReportFinancials(
  transactions: FinancialTransaction[],
  dasPayments: DASPayment[],
  invoices: Invoice[],
  selectedYear: string
): CalculatedReportData {
  const yearTransactions = transactions.filter(t => t.data.startsWith(selectedYear) && t.status === 'PAGO');

  const totalInboundSales = yearTransactions
    .filter(t => t.tipo === 'RECEITA')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalProcurementCosts = yearTransactions
    .filter(t => t.tipo === 'DESPESA' && t.categoriaId === 'cat-d1')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalAdministrativeDrafts = yearTransactions
    .filter(t => t.tipo === 'DESPESA' && t.categoriaId === 'cat-d2')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalDASTaxesPaid = dasPayments
    .filter(d => d.status === 'PAGO' && d.periodoReferencia.endsWith(selectedYear))
    .reduce((sum, item) => sum + item.valor, 0);

  const totalOtherExpenses = yearTransactions
    .filter(t => t.tipo === 'DESPESA' && t.categoriaId !== 'cat-d1' && t.categoriaId !== 'cat-d2')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalDespesasGerais = totalProcurementCosts + totalAdministrativeDrafts + totalOtherExpenses;
  const lucroLiquido = totalInboundSales - (totalDespesasGerais + totalDASTaxesPaid);
  const margemLiquidaPercent = totalInboundSales > 0 ? (lucroLiquido / totalInboundSales) * 100 : 0;
  const receitaLiquida = totalInboundSales - totalDASTaxesPaid;
  const margemContribuicao = totalInboundSales - totalProcurementCosts;

  const totalComercio = yearTransactions
    .filter(t => t.tipo === 'RECEITA' && t.categoriaId === 'cat-r1')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalServicos = yearTransactions
    .filter(t => t.tipo === 'RECEITA' && t.categoriaId !== 'cat-r1')
    .reduce((sum, item) => sum + item.valor, 0);

  const MEI_ANNUAL_CEILING = 81000.0;
  const percentualLimiteMEI = (totalInboundSales / MEI_ANNUAL_CEILING) * 100;
  const statusLimite = percentualLimiteMEI >= 100 ? 'EXCEDIDO' : percentualLimiteMEI >= 80 ? 'ALERTA' : 'REGULAR';

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  let acumulado = 0;
  const meses: MonthlyBalanceData[] = mesesNomes.map((nome, idx) => {
    const mesNum = String(idx + 1).padStart(2, '0');
    const monthStr = `${selectedYear}-${mesNum}`;

    const monthTx = yearTransactions.filter(t => t.data.startsWith(monthStr));
    const recMes = monthTx.filter(t => t.tipo === 'RECEITA').reduce((s, t) => s + t.valor, 0);
    const despMes = monthTx.filter(t => t.tipo === 'DESPESA').reduce((s, t) => s + t.valor, 0);

    const dasMes = dasPayments
      .filter(d => d.periodoReferencia === `${mesNum}/${selectedYear}` && d.status === 'PAGO')
      .reduce((s, d) => s + d.valor, 0);

    const saldoLiquido = recMes - (despMes + dasMes);
    acumulado += saldoLiquido;

    const margemPercent = recMes > 0 ? (saldoLiquido / recMes) * 100 : 0;

    // Fiscal breakdown by category & invoices
    const comTotal = monthTx.filter(t => t.tipo === 'RECEITA' && t.categoriaId === 'cat-r1').reduce((s, t) => s + t.valor, 0);
    const invCom = invoices
      .filter(inv => inv.tipo === 'NFE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
      .reduce((s, inv) => s + inv.valorTotal, 0);
    const comComNota = Math.min(comTotal, invCom);
    const comSemNota = Math.max(0, comTotal - comComNota);

    const srvTotal = monthTx.filter(t => t.tipo === 'RECEITA' && t.categoriaId !== 'cat-r1').reduce((s, t) => s + t.valor, 0);
    const invSrv = invoices
      .filter(inv => inv.tipo === 'NFSE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
      .reduce((s, inv) => s + inv.valorTotal, 0);
    const srvComNota = Math.min(srvTotal, invSrv);
    const srvSemNota = Math.max(0, srvTotal - srvComNota);

    return {
      mesNum,
      mesNome: nome,
      receita: recMes,
      despesa: despMes,
      das: dasMes,
      saldoLiquido,
      saldoAcumulado: acumulado,
      margemPercent,
      comercioComNota: comComNota,
      comercioSemNota: comSemNota,
      servicoComNota: srvComNota,
      servicoSemNota: srvSemNota
    };
  });

  return {
    selectedYear,
    totalReceitaBruta: totalInboundSales,
    totalComercio,
    totalServicos,
    totalCustosInsumos: totalProcurementCosts,
    totalDespesasAdm: totalAdministrativeDrafts,
    totalOutrasDespesas: totalOtherExpenses,
    totalDespesasGerais,
    totalDAS: totalDASTaxesPaid,
    receitaLiquida,
    margemContribuicao,
    lucroLiquido,
    margemLiquidaPercent,
    limiteMEI: MEI_ANNUAL_CEILING,
    percentualLimiteMEI,
    statusLimite,
    meses
  };
}

export function formatCurrencyBRL(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function exportReportToPDF(options: ReportPDFOptions): jsPDF {
  const {
    selectedYear,
    transactions,
    dasPayments,
    invoices,
    companyName = 'Carlos Oliveira MEI',
    cnpj = '30.751.934/0001-30',
    responsavelNome = 'Carlos Oliveira',
    includeDRE = true,
    includeMonthlyBalance = true,
    includeFiscalBreakdown = true,
    includeSignatures = true
  } = options;

  const data = calculateReportFinancials(transactions, dasPayments, invoices, selectedYear);

  // Initialize jsPDF (A4 format, portrait, millimeters)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Colors
  const primaryGreen = [45, 214, 131]; // #2dd683
  const darkHeader = [15, 23, 42]; // #0f172a
  const accentPurple = [94, 23, 235]; // #5E17EB
  const accentBlue = [0, 74, 173]; // #004AAD
  const textMuted = [100, 116, 139]; // #64748b
  const borderGray = [226, 232, 240]; // #e2e8f0

  // -------------------------------------------------------------
  // HEADER SECTION (Branded, elegant, compliant)
  // -------------------------------------------------------------
  // Top decorative bar
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  currentY = 12;

  // Company Name & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkHeader[0], darkHeader[1], darkHeader[2]);
  doc.text('MEI-Simple ERP', margin, currentY);

  // Document Badge
  doc.setFillColor(243, 236, 253); // light purple
  doc.roundedRect(pageWidth - margin - 50, currentY - 5, 50, 7, 1.5, 1.5, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentPurple[0], accentPurple[1], accentPurple[2]);
  doc.text(`EXERCÍCIO FISCAL ${selectedYear}`, pageWidth - margin - 25, currentY - 0.5, { align: 'center' });

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkHeader[0], darkHeader[1], darkHeader[2]);
  doc.text('DEMONSTRATIVO DE RESULTADOS (DRE) & BALANÇOS MENSAIS', margin, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Empresa: ${companyName}   |   CNPJ: ${cnpj}   |   Regime: Simples Nacional (SIMEI)`,
    margin,
    currentY
  );

  currentY += 4;
  const nowStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Emitido em: ${nowStr}   |   Responsável: ${responsavelNome}   |   Finalidade: Contábil / Bancária`, margin, currentY);

  currentY += 3;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;

  // -------------------------------------------------------------
  // SECTION 1: SUMMARY KPI CARDS
  // -------------------------------------------------------------
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 16;

  const kpis = [
    {
      title: 'RECEITA BRUTA TOTAL',
      value: formatCurrencyBRL(data.totalReceitaBruta),
      color: primaryGreen,
      textColor: [16, 110, 68]
    },
    {
      title: 'CUSTOS & DESPESAS',
      value: formatCurrencyBRL(data.totalDespesasGerais),
      color: [241, 245, 249],
      textColor: [51, 65, 85]
    },
    {
      title: 'TRIBUTOS DAS PAGOS',
      value: formatCurrencyBRL(data.totalDAS),
      color: [230, 239, 250],
      textColor: accentBlue
    },
    {
      title: 'LUCRO LÍQUIDO FINAL',
      value: formatCurrencyBRL(data.lucroLiquido),
      color: [243, 236, 253],
      textColor: accentPurple
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(kpi.title, cardX + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
    doc.text(kpi.value, cardX + 3, currentY + 11.5);
  });

  currentY += cardHeight + 6;

  // -------------------------------------------------------------
  // SECTION 2: DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)
  // -------------------------------------------------------------
  if (includeDRE) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkHeader[0], darkHeader[1], darkHeader[2]);
    doc.text('1. DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE SIMPLIFICADA)', margin, currentY);

    const dreRows = [
      ['1. RECEITA OPERACIONAL BRUTA (+)', formatCurrencyBRL(data.totalReceitaBruta), '100.0%'],
      ['   1.1 Venda de Mercadorias e Produtos (Comércio)', formatCurrencyBRL(data.totalComercio), data.totalReceitaBruta > 0 ? `${((data.totalComercio / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['   1.2 Prestação de Serviços em Geral', formatCurrencyBRL(data.totalServicos), data.totalReceitaBruta > 0 ? `${((data.totalServicos / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['2. DEDUÇÕES E TRIBUTOS UNIFICADOS DAS (-)', formatCurrencyBRL(data.totalDAS), data.totalReceitaBruta > 0 ? `${((data.totalDAS / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['3. (=) RECEITA OPERACIONAL LÍQUIDA', formatCurrencyBRL(data.receitaLiquida), data.totalReceitaBruta > 0 ? `${((data.receitaLiquida / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['4. CUSTOS DE MERCADORIAS E INSUMOS (CMV) (-)', formatCurrencyBRL(data.totalCustosInsumos), data.totalReceitaBruta > 0 ? `${((data.totalCustosInsumos / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['5. (=) MARGEM DE CONTRIBUIÇÃO BRUTA', formatCurrencyBRL(data.margemContribuicao), data.totalReceitaBruta > 0 ? `${((data.margemContribuicao / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['6. DESPESAS OPERACIONAIS E ADMINISTRATIVAS (-)', formatCurrencyBRL(data.totalDespesasAdm + data.totalOutrasDespesas), data.totalReceitaBruta > 0 ? `${(((data.totalDespesasAdm + data.totalOutrasDespesas) / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['   6.1 Despesas Administrativas e Ocupacionais (Aluguel, Luz, etc.)', formatCurrencyBRL(data.totalDespesasAdm), data.totalReceitaBruta > 0 ? `${((data.totalDespesasAdm / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['   6.2 Outras Despesas Operacionais (Taxas, Bancárias, etc.)', formatCurrencyBRL(data.totalOutrasDespesas), data.totalReceitaBruta > 0 ? `${((data.totalOutrasDespesas / data.totalReceitaBruta) * 100).toFixed(1)}%` : '0.0%'],
      ['7. (=) RESULTADO LÍQUIDO DO EXERCÍCIO (LUCRO LÍQUIDO)', formatCurrencyBRL(data.lucroLiquido), `${data.margemLiquidaPercent.toFixed(1)}%`]
    ];

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      head: [['Estrutura Contábil / Rubrica', 'Valor Apurado (R$)', '% s/ Receita']],
      body: dreRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: 28, halign: 'right' }
      },
      didParseCell: function (dataHook) {
        const text = String(dataHook.cell.raw || '');
        if (
          text.startsWith('1. RECEITA') ||
          text.startsWith('3. (=)') ||
          text.startsWith('5. (=)') ||
          text.startsWith('7. (=)')
        ) {
          dataHook.cell.styles.fontStyle = 'bold';
          if (text.startsWith('7. (=)')) {
            dataHook.cell.styles.fillColor = [243, 236, 253];
            dataHook.cell.styles.textColor = [94, 23, 235];
            dataHook.cell.styles.fontSize = 8.5;
          } else if (text.startsWith('1. RECEITA')) {
            dataHook.cell.styles.fillColor = [238, 252, 246];
            dataHook.cell.styles.textColor = [15, 23, 42];
          }
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // -------------------------------------------------------------
  // SECTION 3: BALANÇO MENSAL DETALHADO (12 MESES)
  // -------------------------------------------------------------
  if (includeMonthlyBalance) {
    // Check if we need page break
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkHeader[0], darkHeader[1], darkHeader[2]);
    doc.text('2. BALANÇO FINANCEIRO MENSAL (FLUXO CONSOLIDADO DO EXERCÍCIO)', margin, currentY);

    const balanceRows = data.meses.map(m => [
      `${m.mesNum} - ${m.mesNome}`,
      formatCurrencyBRL(m.receita),
      formatCurrencyBRL(m.despesa),
      formatCurrencyBRL(m.das),
      formatCurrencyBRL(m.saldoLiquido),
      `${m.margemPercent.toFixed(1)}%`,
      formatCurrencyBRL(m.saldoAcumulado)
    ]);

    // Total row
    balanceRows.push([
      'TOTAL DO EXERCÍCIO',
      formatCurrencyBRL(data.totalReceitaBruta),
      formatCurrencyBRL(data.totalDespesasGerais),
      formatCurrencyBRL(data.totalDAS),
      formatCurrencyBRL(data.lucroLiquido),
      `${data.margemLiquidaPercent.toFixed(1)}%`,
      formatCurrencyBRL(data.lucroLiquido)
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      head: [['Mês / Competência', 'Receitas (R$)', 'Despesas (R$)', 'DAS (R$)', 'Saldo Líquido (R$)', 'Margem (%)', 'Acumulado (R$)']],
      body: balanceRows,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 74, 173],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function (dataHook) {
        if (dataHook.row.index === balanceRows.length - 1) {
          dataHook.cell.styles.fontStyle = 'bold';
          dataHook.cell.styles.fillColor = [241, 245, 249];
          dataHook.cell.styles.textColor = [15, 23, 42];
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // -------------------------------------------------------------
  // SECTION 4: APURAÇÃO FISCAL PGDAS-D / LIVRO CAIXA
  // -------------------------------------------------------------
  if (includeFiscalBreakdown) {
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkHeader[0], darkHeader[1], darkHeader[2]);
    doc.text('3. DEMONSTRATIVO FISCAL AUXILIAR PGDAS-D & DASN-SIMEI', margin, currentY);

    const fiscalRows = data.meses.map(m => [
      `${m.mesNome}/${selectedYear}`,
      formatCurrencyBRL(m.comercioComNota),
      formatCurrencyBRL(m.comercioSemNota),
      formatCurrencyBRL(m.servicoComNota),
      formatCurrencyBRL(m.servicoSemNota),
      formatCurrencyBRL(m.receita)
    ]);

    // Summary row
    const totalComComNota = data.meses.reduce((s, m) => s + m.comercioComNota, 0);
    const totalComSemNota = data.meses.reduce((s, m) => s + m.comercioSemNota, 0);
    const totalSrvComNota = data.meses.reduce((s, m) => s + m.servicoComNota, 0);
    const totalSrvSemNota = data.meses.reduce((s, m) => s + m.servicoSemNota, 0);

    fiscalRows.push([
      'TOTAL ACUMULADO',
      formatCurrencyBRL(totalComComNota),
      formatCurrencyBRL(totalComSemNota),
      formatCurrencyBRL(totalSrvComNota),
      formatCurrencyBRL(totalSrvSemNota),
      formatCurrencyBRL(data.totalReceitaBruta)
    ]);

    autoTable(doc, {
      startY: currentY + 2,
      margin: { left: margin, right: margin },
      head: [['Competência', 'Comércio (c/ Nota)', 'Comércio (s/ Nota)', 'Serviço (c/ Nota)', 'Serviço (s/ Nota)', 'Faturamento Bruto']],
      body: fiscalRows,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: function (dataHook) {
        if (dataHook.row.index === fiscalRows.length - 1) {
          dataHook.cell.styles.fontStyle = 'bold';
          dataHook.cell.styles.fillColor = [238, 252, 246];
          dataHook.cell.styles.textColor = [15, 23, 42];
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // -------------------------------------------------------------
  // SECTION 5: COMPLIANCE DECLARATION & SIGNATURES
  // -------------------------------------------------------------
  if (includeSignatures) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin;
    }

    // Declaration Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    const declarationText =
      'DECLARAÇÃO CONTÁBIL E FISCAL: As informações acima prestadas refletem com precisão as movimentações de entradas e saídas operacionais registradas no livro caixa do Microempreendedor Individual (MEI) no respectivo exercício, em estrita conformidade com a Lei Complementar nº 123/2006 e resoluções do Comitê Gestor do Simples Nacional (CGSN).';
    doc.text(doc.splitTextToSize(declarationText, pageWidth - margin * 2 - 6), margin + 3, currentY + 4);

    currentY += 19;

    // Signatures block
    const sigWidth = (pageWidth - margin * 2 - 20) / 2;
    const sigY = currentY + 12;

    // Signature 1: Titular MEI
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, sigY, margin + sigWidth, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(darkHeader[0], darkHeader[1], darkHeader[2]);
    doc.text(companyName, margin + sigWidth / 2, sigY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Titular Responsável / CNPJ: ${cnpj}`, margin + sigWidth / 2, sigY + 7.5, { align: 'center' });

    // Signature 2: Contabilidade / Validação Técnica
    const sig2X = margin + sigWidth + 20;
    doc.line(sig2X, sigY, sig2X + sigWidth, sigY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(darkHeader[0], darkHeader[1], darkHeader[2]);
    doc.text('Responsável Contábil / Auditoria MEI', sig2X + sigWidth / 2, sigY + 4, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Contabilidade & Gestão Tributária', sig2X + sigWidth / 2, sigY + 7.5, { align: 'center' });
  }

  // -------------------------------------------------------------
  // FOOTER (Page numbering on all pages)
  // -------------------------------------------------------------
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `MEI-Simple ERP  |  Relatório Oficial de Balanços e DRE  |  Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadReportPDF(options: ReportPDFOptions, filename?: string): void {
  const doc = exportReportToPDF(options);
  const name = filename || `Balanco_DRE_MEI_${options.selectedYear}_${options.companyName?.replace(/\s+/g, '_') || 'Empresa'}.pdf`;
  doc.save(name);
}
