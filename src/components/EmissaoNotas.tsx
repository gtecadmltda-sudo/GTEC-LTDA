/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Invoice, Product, Client, Service, DASPayment } from '../types';
import { 
  FileText, 
  Send, 
  Download, 
  FileDown,
  Eye, 
  AlertCircle, 
  CheckCircle, 
  CheckCircle2,
  FileCode, 
  Globe, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  FileWarning,
  Clock,
  XOctagon, 
  ExternalLink,
  Printer,
  RefreshCw,
  Lock,
  QrCode,
  History,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Coins,
  Calendar,
  CreditCard,
  Check
} from 'lucide-react';
import { FiscalInvoicePreviewModal } from './FiscalInvoicePreviewModal';
import { ResponsiveModal } from './ResponsiveModal';
import { useIncrementalList } from '../hooks/useIncrementalList';
import { exportFiscalReportToPdf } from '../utils/exportFiscalReport';
import { FiscalQRCode } from './FiscalQRCode';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { ActionButton } from './ActionButton';
import { ConfiguracaoCertificadoDigital, DigitalCertificate } from './ConfiguracaoCertificadoDigital';
import { downloadInvoiceXml, downloadInvoicesZip, downloadXmlString, ensureInvoiceXml } from '../utils/xmlDownloader';

interface EmissaoNotasProps {
  initialTab?: 'nfe' | 'nfse' | 'das';
  invoices: Invoice[];
  products: Product[];
  clients: Client[];
  services: Service[];
  dasPayments?: DASPayment[];
  onPayDAS?: (id: string) => void;
  onEmitInvoice: (invoice: Invoice) => void;
  onCancelInvoice?: (id: string) => void;
  addLog: (modulo: string, acao: any, descricao: string) => void;
  onNavigate?: (view: string) => void;
}

export const EmissaoNotas = React.memo(function EmissaoNotas({ 
  initialTab = 'nfe',
  invoices, 
  products, 
  clients, 
  services, 
  dasPayments = [],
  onPayDAS,
  onEmitInvoice, 
  onCancelInvoice,
  addLog,
  onNavigate
}: EmissaoNotasProps) {
  // Tab controller: 'nfe' (Produtos) vs 'nfse' (Serviços) vs 'das' (Guia DAS MEI)
  const [activeTab, setActiveTab] = useState<'nfe' | 'nfse' | 'das'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [fiscalEnv, setFiscalEnv] = useState<'HOMOLOGACAO' | 'PRODUCAO'>('HOMOLOGACAO');
  
  // NFe (Produtos) form state
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || '');
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [prodQty, setProdQty] = useState('1');
  
  // NFSe (Serviços) form state
  const [serviceClient, setServiceClient] = useState(clients[0]?.id || '');
  const [selectedService, setSelectedService] = useState(services[0]?.id || '');
  
  // Digital Certificate State (Required specifically for NFe Produtos)
  const [digitalCertificate, setDigitalCertificate] = useState<DigitalCertificate>({
    isUploaded: true,
    tipo: 'A1',
    titular: 'CARLOS OLIVEIRA MEI',
    cnpj: '30.751.934/0001-30',
    emissor: 'AC SERPRO RFB v5 (ICP-Brasil)',
    validadeInicio: '14/03/2026',
    validadeFim: '14/03/2027',
    diasRestantes: 194,
    status: 'VALID',
    ufSefaz: 'SP - SEFAZ São Paulo',
    ambiente: 'PRODUCAO',
    fileName: 'certificado_carlos_oliveira_2026.pfx',
    fileSize: '8.4 KB',
    serialNumber: '7F:3A:9B:12:88:E4:C0:51:29:A7',
    lastValidated: 'Hoje às 10:45'
  });
  
  // Modals & Visualizers
  const [activeXmlVisualizer, setActiveXmlVisualizer] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [qrModalInvoice, setQrModalInvoice] = useState<Invoice | null>(null);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'NFE' | 'NFSE'>('ALL');
  const [previewOrientation, setPreviewOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  // Export State
  const [exportToast, setExportToast] = useState<string | null>(null);
  const [exportingReport, setExportingReport] = useState(false);

  const handleExportFiscalReport = async (invoicesToExport?: Invoice[], filterDescription?: string) => {
    const targetList = invoicesToExport && invoicesToExport.length > 0 ? invoicesToExport : invoices;
    if (!targetList || targetList.length === 0) {
      alert('Nenhuma nota fiscal disponível para exportação no momento.');
      return;
    }
    setExportingReport(true);
    try {
      await exportFiscalReportToPdf({
        invoices: targetList,
        filterTitle: filterDescription || 'Todas as Notas Listadas no MEISimple',
        companyName: 'CARLOS OLIVEIRA MEI',
        cnpj: '30.751.934/0001-30'
      });
      setExportToast(`Relatório Fiscal Simplificado gerado com ${targetList.length} documento(s)!`);
      setTimeout(() => setExportToast(null), 4000);
    } catch (error) {
      console.error('Erro ao gerar relatório fiscal em PDF:', error);
      alert('Ocorreu um erro ao gerar o relatório fiscal em PDF. Tente novamente.');
    } finally {
      setExportingReport(false);
    }
  };

  const handleEmitNFe = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClient);
    const prod = products.find(p => p.id === selectedProduct);
    const qty = parseInt(prodQty) || 1;

    if (!client || !prod) {
      setExportToast('Selecione um cliente e produto válidos para a emissão.');
      return;
    }

    if (!digitalCertificate.isUploaded || digitalCertificate.status === 'NOT_CONFIGURED') {
      setExportToast('Atenção: É necessário carregar e validar um Certificado Digital A1 ativo para assinar e autorizar a NF-e.');
      return;
    }

    const total = prod.venda * qty;
    const invoiceNum = (invoices.filter(i => i.tipo === 'NFE').length + 1).toString().padStart(6, '0');

    // Generated compliant XML for NFe Produto (Simulação SEFAZ)
    const xmlNFe = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe3526063075193400013055001000${invoiceNum}1004883291" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <cNF>00488329</cNF>
      <natOp>VENDA DE PRODUCAO DO ESTABELECIMENTO</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>${invoiceNum}</nNF>
      <dhEmi>${new Date().toISOString()}</dhEmi>
      <tpNF>1</tpNF>
      <idDest>1</idDest>
      <cMunFG>3550308</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <tpAmb>${fiscalEnv === 'PRODUCAO' ? '1' : '2'}</tpAmb>
      <finNFe>1</finNFe>
      <indFinal>1</indFinal>
      <indPres>1</indPres>
    </ide>
    <emit>
      <CNPJ>30751934000130</CNPJ>
      <xNome>CARLOS OLIVEIRA MEI</xNome>
      <xFant>MARCENARIA DESIGN MEI</xFant>
      <enderEmit>
        <xLgr>Rua Bento de Souza</xLgr>
        <nro>40</nro>
        <xBairro>Vila Nova</xBairro>
        <cMun>3550308</cMun>
        <xMun>Sao Paulo</xMun>
        <UF>SP</UF>
        <CEP>01310100</CEP>
      </enderEmit>
      <IE>123456789110</IE>
      <CRT>1</CRT> <!-- Simples Nacional (MEI) -->
    </emit>
    <dest>
      <CPF>${client.documento.replace(/\D/g, '')}</CPF>
      <xNome>${client.nome}</xNome>
      <indIEDest>9</indIEDest>
    </dest>
    <det nItem="1">
      <prod>
        <cProd>${prod.sku}</cProd>
        <cEAN>SEM GTIN</cEAN>
        <xProd>${prod.nome}</xProd>
        <NCM>94034000</NCM>
        <CFOP>5101</CFOP>
        <uCom>UN</uCom>
        <qCom>${qty}.0000</qCom>
        <vUnCom>${prod.venda.toFixed(2)}</vUnCom>
        <vProd>${total.toFixed(2)}</vProd>
        <cEANTrib>SEM GTIN</cEANTrib>
        <uTrib>UN</uTrib>
        <qTrib>${qty}.0000</qTrib>
        <vUnTrib>${prod.venda.toFixed(2)}</vUnTrib>
        <indTot>1</indTot>
      </prod>
      <imposto>
        <ICMS>
          <ICMSSN102>
            <orig>0</orig>
            <CSOSN>102</CSOSN> <!-- Tributada pelo Simples Nacional sem permissão de crédito (MEI) -->
          </ICMSSN102>
        </ICMS>
        <PIS>
          <PISNT>
            <CST>07</CST>
          </PISNT>
        </PIS>
        <COFINS>
          <COFINSNT>
            <CST>07</CST>
          </COFINSNT>
        </COFINS>
      </imposto>
    </det>
    <total>
      <ICMSTot>
        <vBC>0.00</vBC>
        <vICMS>0.00</vICMS>
        <vProd>${total.toFixed(2)}</vProd>
        <vNF>${total.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    <infAdic>
      <infCpl>DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL (MEI). NAO GERA DIREITO A CREDITO FISCAL DE IPI/ICMS.</infCpl>
    </infAdic>
  </infNFe>
</NFe>`;

    const newInvoice: Invoice = {
      id: `inv-nfe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      numero: invoiceNum,
      tipo: 'NFE',
      destinatarioNome: client.nome,
      destinatarioDocumento: client.documento,
      valorTotal: total,
      dataEmissao: new Date().toISOString(),
      status: fiscalEnv,
      xmlSimulado: xmlNFe
    };

    onEmitInvoice(newInvoice);
    addLog('Fiscal', 'CRIACAO', `NF-e Comercial Nº ${invoiceNum} transmitida para SEFAZ (${fiscalEnv}). Cliente: ${client.nome}. Valor: R$ ${total.toFixed(2)}`);
    setProdQty('1');
    alert(`Nota Fiscal de Produto (NF-e) nº ${invoiceNum} assinada com Certificado A1 e transmitida à SEFAZ com sucesso!`);
  };

  const handleEmitNFSe = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === serviceClient);
    const serv = services.find(s => s.id === selectedService);

    if (!client || !serv) {
      alert('Selecione um tomador e serviço válidos');
      return;
    }

    const total = serv.valor;
    const invoiceNum = (invoices.filter(i => i.tipo === 'NFSE').length + 1).toString().padStart(6, '0');

    // Generated compliant XML for NFSe de Serviços (Padrão Nacional Gov.br MEI)
    const xmlNFSe = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe xmlns="http://www.sped.fazenda.gov.br/nfse">
  <infNFSe Id="NFSe3526063075193400013056001000${invoiceNum}">
    <nNFSe>${invoiceNum}</nNFSe>
    <dEmi>${new Date().toISOString()}</dEmi>
    <tpAmb>${fiscalEnv === 'PRODUCAO' ? '1' : '2'}</tpAmb>
    <emit>
      <CNPJ>30751934000130</CNPJ>
      <xNome>CARLOS OLIVEIRA MEI</xNome>
      <optanteSN>1</optanteSN>
      <optanteSIMEI>1</optanteSIMEI>
    </emit>
    <toma>
      <CPF>${client.documento.replace(/\D/g, '')}</CPF>
      <xNome>${client.nome}</xNome>
    </toma>
    <serv>
      <cServ>14.06.01</cServ>
      <xServ>${serv.nome} - Instalação e Montagem</xServ>
      <vServ>${total.toFixed(2)}</vServ>
      <issRetido>2</issRetido> <!-- Não retido (ISS Fixo recolhido no DAS-MEI) -->
      <vLiquido>${total.toFixed(2)}</vLiquido>
    </serv>
  </infNFSe>
</NFSe>`;

    const newInvoice: Invoice = {
      id: `inv-nfse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      numero: invoiceNum,
      tipo: 'NFSE',
      destinatarioNome: client.nome,
      destinatarioDocumento: client.documento,
      valorTotal: total,
      dataEmissao: new Date().toISOString(),
      status: fiscalEnv,
      xmlSimulado: xmlNFSe
    };

    onEmitInvoice(newInvoice);
    addLog('Fiscal', 'CRIACAO', `NFS-e de Serviço Nacional Gov.br Nº ${invoiceNum} emitida para ${client.nome}. Valor: R$ ${total.toFixed(2)}`);
    setExportToast(`NFS-e Nacional de Serviço nº ${invoiceNum} emitida com sucesso via Portal Gov.br!`);
  };

  // 3 Últimas Notas Fiscais Emitidas ou Rascunhos
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime())
    .slice(0, 3);

  // Lista Filtrada para o Modal de Histórico Completo
  const filteredHistoryInvoices = invoices.filter(inv => {
    if (historyTypeFilter !== 'ALL' && inv.tipo !== historyTypeFilter) return false;
    if (historySearchTerm.trim()) {
      const term = historySearchTerm.toLowerCase();
      const matchDoc = inv.destinatarioDocumento?.toLowerCase().includes(term);
      const matchName = inv.destinatarioNome?.toLowerCase().includes(term);
      const matchNum = inv.numero?.toLowerCase().includes(term);
      if (!matchDoc && !matchName && !matchNum) return false;
    }
    return true;
  });

  const {
    visibleItems: visibleHistoryInvoices,
    hasMore: hasMoreHistoryInvoices,
    sentinelRef: historySentinelRef
  } = useIncrementalList(filteredHistoryInvoices, 10, 10);

  // Filtro e Cálculos Dinâmicos do Card de Resumo Fiscal Acumulado
  const [summaryFilter, setSummaryFilter] = useState<'ALL' | 'NFE' | 'NFSE'>('ALL');

  const summaryInvoices = invoices.filter(inv => {
    if (summaryFilter === 'ALL') return true;
    return inv.tipo === summaryFilter;
  });

  const totalGeneralAccumulated = summaryInvoices.reduce((acc, inv) => acc + (Number(inv.valorTotal) || 0), 0);
  const allInvoicesAccumulated = invoices.reduce((acc, inv) => acc + (Number(inv.valorTotal) || 0), 0);

  const totalNFeAccumulated = invoices.filter(inv => inv.tipo === 'NFE').reduce((acc, inv) => acc + (Number(inv.valorTotal) || 0), 0);
  const countNFe = invoices.filter(inv => inv.tipo === 'NFE').length;

  const totalNFSeAccumulated = invoices.filter(inv => inv.tipo === 'NFSE').reduce((acc, inv) => acc + (Number(inv.valorTotal) || 0), 0);
  const countNFSe = invoices.filter(inv => inv.tipo === 'NFSE').length;

  const countAuthorized = summaryInvoices.filter(inv => inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO').length;
  const countDraft = summaryInvoices.filter(inv => inv.status === 'RASCUNHO' || inv.status === 'CANCELADA').length;
  const avgTicket = summaryInvoices.length > 0 ? (totalGeneralAccumulated / summaryInvoices.length) : 0;

  // Helpers para Gestão do DAS MEI
  const handleDownloadDASBoleto = (period: string, amount: number) => {
    let slipText = `=========================================================\n`;
    slipText += `DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL (DAS-MEI)\n`;
    slipText += `PROGRAMA GERADOR DO DAS PARA O MEI (PGMEI)\n`;
    slipText += `=========================================================\n\n`;
    slipText += `RAZÃO SOCIAL: CARLOS OLIVEIRA MEI\n`;
    slipText += `CNPJ MATRIZ: 30.751.934/0001-30\n`;
    slipText += `COMPETÊNCIA DE APURAÇÃO: ${period}\n`;
    slipText += `DATA DE VENCIMENTO OFICIAL: 20/${period}\n`;
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
    link.download = `Guia_DAS_MEI_${period.replace('/', '_')}.txt`;
    link.click();
    addLog('Fiscal', 'EXPORTACAO', `Download do boleto virtual DAS referente à competência ${period}`);
    setExportToast(`Guia DAS referente a ${period} baixada com sucesso!`);
  };

  const handleCopyDASBarcode = (period: string) => {
    const code = "836700000005712000280000001010202602010000000013";
    navigator.clipboard.writeText(code);
    setExportToast(`Linha digitável da competência ${period} copiada com sucesso!`);
  };

  // Animação de Entrada Sequencial (Staggered Entry) com Framer Motion
  const fiscalContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.04
      }
    }
  };

  const fiscalItemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1] as const
      }
    }
  };

  return (
    <motion.div 
      className="fiscal-container space-y-6"
      variants={fiscalContainerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* =========================================================================
          CARD DE RESUMO FISCAL ACUMULADO (NF-e & NFS-e) - NO TOPO DO .fiscal-container
          Exibe o valor total acumulado das notas listadas, atualizando dinamicamente
          conforme os filtros ou listas forem alterados.
          ========================================================================= */}
      <motion.div
        variants={fiscalItemVariants}
        className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5"
      >
        {/* Header do Card de Resumo */}
        <div className="pb-4 border-b border-slate-100">
          <SectionHeader
            as="h2"
            icon={<TrendingUp className="w-6 h-6 text-semantic-success" />}
            title="Resumo Fiscal Acumulado"
            info="Total acumulado em documentos fiscais (NF-e Comercial e NFS-e de Serviços) emitidos pelo MEI"
            badges={
              <StatusBadge
                tone="success"
                label={`${invoices.length} ${invoices.length === 1 ? 'Nota Emitida' : 'Notas Emitidas'}`}
              />
            }
            actions={
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl self-start sm:self-auto text-xs font-bold font-inter">
                <button
                  type="button"
                  onClick={() => setSummaryFilter('ALL')}
                  className={`h-9 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    summaryFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Todas ({invoices.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryFilter('NFE')}
                  className={`h-9 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    summaryFilter === 'NFE'
                      ? 'bg-[#004AAD] text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>NF-e ({countNFe})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryFilter('NFSE')}
                  className={`h-9 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    summaryFilter === 'NFSE'
                      ? 'bg-[#5E17EB] text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>NFS-e ({countNFSe})</span>
                </button>
              </div>
            }
          />
        </div>

        {/* Grid de Métricas Acumuladas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Valor Total Acumulado */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-emerald-300 hover:shadow-xs transition font-inter">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-montserrat">
                {summaryFilter === 'ALL' ? 'Total Acumulado Geral' : summaryFilter === 'NFE' ? 'Total Acumulado NF-e' : 'Total Acumulado NFS-e'}
              </span>
              <span className="p-2 rounded-xl bg-semantic-success-light text-semantic-success">
                <DollarSign className="w-4 h-4 text-semantic-success" />
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 block tracking-tight">
                R$ {totalGeneralAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                {summaryInvoices.length} documento(s) fiscal(is) somado(s)
              </span>
            </div>
          </div>

          {/* Card 2: Total NF-e Produtos */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-blue-300 hover:shadow-xs transition font-inter">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-montserrat">
                NF-e (Produtos)
              </span>
              <span className="p-2 rounded-xl bg-blue-100 text-[#004AAD]">
                <FileText className="w-4 h-4 text-[#004AAD]" />
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#004AAD] block tracking-tight">
                R$ {totalNFeAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-medium">
                <span>{countNFe} nota(s) modelo 55</span>
                <span className="font-bold text-slate-700">
                  {allInvoicesAccumulated > 0 ? `${((totalNFeAccumulated / allInvoicesAccumulated) * 100).toFixed(0)}% do total` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Total NFS-e Serviços */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-purple-300 hover:shadow-xs transition font-inter">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-montserrat">
                NFS-e (Serviços)
              </span>
              <span className="p-2 rounded-xl bg-purple-100 text-[#5E17EB]">
                <Globe className="w-4 h-4 text-[#5E17EB]" />
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#5E17EB] block tracking-tight">
                R$ {totalNFSeAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-medium">
                <span>{countNFSe} nota(s) Gov.br</span>
                <span className="font-bold text-slate-700">
                  {allInvoicesAccumulated > 0 ? `${((totalNFSeAccumulated / allInvoicesAccumulated) * 100).toFixed(0)}% do total` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Tíquete Médio & Status das Notas */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-slate-400 hover:shadow-xs transition font-inter">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-montserrat">
                Tíquete Médio
              </span>
              <span className="p-2 rounded-xl bg-semantic-success-light text-semantic-success">
                <CheckCircle2 className="w-4 h-4 text-semantic-success" />
              </span>
            </div>
            <div className="mt-2.5">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 block tracking-tight">
                R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1 font-medium">
                <span className="inline-flex items-center gap-1 font-semibold text-semantic-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-success inline-block" />
                  {countAuthorized} autorizada(s)
                </span>
                {countDraft > 0 && (
                  <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning inline-block" />
                    {countDraft} rascunho(s)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upper Mode Selector Controller & Fiscal Environment */}
      <motion.div 
        variants={fiscalItemVariants}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        
        {/* Abas Principais de Módulo Fiscal */}
        <div className="flex flex-wrap gap-2 text-xs font-bold font-inter">
          <button
            type="button"
            onClick={() => setActiveTab('nfe')}
            className={`h-11 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'nfe'
                ? 'bg-[#004AAD] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'nfe' ? 'text-[#2dd683]' : 'text-[#004AAD]'}`} />
            <span>Nota de Produto Comercial (NF-e Modelo 55)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nfse')}
            className={`h-11 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'nfse'
                ? 'bg-[#5E17EB] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white'
            }`}
          >
            <Globe className={`w-4 h-4 ${activeTab === 'nfse' ? 'text-[#2dd683]' : 'text-[#5E17EB]'}`} />
            <span>Nota de Prestação de Serviço (NFS-e Gov.br)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('das')}
            className={`h-11 px-4 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'das'
                ? 'bg-semantic-success text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white'
            }`}
          >
            <Coins className={`w-4 h-4 ${activeTab === 'das' ? 'text-white' : 'text-semantic-success'}`} />
            <span>Guia DAS (Simples Nacional)</span>
            {dasPayments.filter(d => d.status === 'PENDENTE').length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-inter ${
                activeTab === 'das' ? 'bg-white text-semantic-danger' : 'bg-semantic-danger-light text-semantic-danger border border-semantic-danger-light'
              }`}>
                {dasPayments.filter(d => d.status === 'PENDENTE').length} pendente(s)
              </span>
            )}
          </button>
        </div>

        {/* Global Fiscal Switch (Homologacao vs Producao) & Exportar Relatorio Fiscal */}
        <div className="flex flex-wrap items-center gap-2.5 font-inter">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 inline-flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#004AAD]" /> SEFAZ:
            </span>
            <div className="bg-slate-100 p-1 border border-slate-300 rounded-xl flex gap-1 font-bold">
              <button
                type="button"
                onClick={() => setFiscalEnv('HOMOLOGACAO')}
                className={`h-9 px-3 rounded-lg text-xs transition cursor-pointer flex items-center ${
                  fiscalEnv === 'HOMOLOGACAO' 
                    ? 'bg-white text-slate-900 shadow-xs font-extrabold border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Homologação
              </button>
              <button
                type="button"
                onClick={() => setFiscalEnv('PRODUCAO')}
                className={`h-9 px-3 rounded-lg text-xs transition cursor-pointer flex items-center ${
                  fiscalEnv === 'PRODUCAO' 
                    ? 'bg-semantic-success text-white shadow-xs font-extrabold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Produção
              </button>
            </div>
          </div>

          {/* Botão de Download de Todos os XMLs (.ZIP) */}
          <button
            type="button"
            onClick={async () => {
              setExportToast('Gerando pacote ZIP de todos os arquivos XML fiscais...');
              await downloadInvoicesZip(invoices, `Pacote_Completo_XML_Notas_Fiscais_MEI_${new Date().toISOString().split('T')[0]}.zip`);
              setExportToast('Download do pacote ZIP concluído com sucesso!');
              addLog('Fiscal', 'EXPORTACAO', `Download do pacote completo de XMLs das notas fiscais (${invoices.length} documentos)`);
            }}
            disabled={invoices.length === 0}
            className="h-11 px-3.5 rounded-xl bg-semantic-success-light hover:bg-emerald-100 text-slate-900 border border-semantic-success-light font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Baixar todos os arquivos XML fiscais em formato .ZIP"
          >
            <Download className="w-4 h-4 text-semantic-success" />
            <span>Baixar XMLs (.ZIP)</span>
          </button>

          {/* Botão de Exportar Relatório Fiscal */}
          <button
            type="button"
            onClick={() => handleExportFiscalReport(invoices, 'Visão Geral de Todas as Notas')}
            disabled={exportingReport}
            className="h-11 px-3.5 rounded-xl bg-[#004AAD] hover:bg-[#00367d] text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Exportar Relatório Fiscal simplificado em PDF com todas as notas fiscais"
          >
            {exportingReport ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#2dd683]" />
            ) : (
              <FileDown className="w-4 h-4 text-[#2dd683]" />
            )}
            <span>{exportingReport ? 'Gerando...' : 'Exportar Relatório Fiscal'}</span>
          </button>
        </div>

      </motion.div>

      {/* -------------------------------------------------------------
          WIDGET DE LISTA: 3 ÚLTIMAS NOTAS FISCAIS EMITIDAS OU RASCUNHOS
          COM BOTÃO DE ACESSO RÁPIDO PARA O HISTÓRICO COMPLETO
          ------------------------------------------------------------- */}
      <motion.div variants={fiscalItemVariants} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4 font-inter">
        {/* Header do Widget */}
        <div className="pb-3 border-b border-slate-200">
          <SectionHeader
            as="h3"
            icon={<History className="w-5 h-5 text-[#2dd683]" />}
            iconVariant="blue"
            title="Últimas Notas Fiscais & Rascunhos"
            info="Conferência ágil das últimas transmissões ou rascunhos fiscais emitidos no MEI-Simple."
            badges={
              <StatusBadge
                tone="neutral"
                label="3 Mais Recentes"
              />
            }
            actions={
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto font-inter">
                {/* Botão Baixar Lote de XMLs (.ZIP) */}
                <button
                  type="button"
                  onClick={async () => {
                    setExportToast('Compactando e gerando pacote de arquivos XML...');
                    await downloadInvoicesZip(invoices);
                    setExportToast('Pacote de XMLs fiscais (.ZIP) baixado com sucesso!');
                  }}
                  className="h-11 px-3.5 rounded-xl bg-semantic-success-light hover:bg-emerald-100 text-slate-900 font-bold text-xs flex items-center gap-2 border border-semantic-success-light cursor-pointer transition shadow-xs disabled:opacity-50"
                  title="Baixar pacote ZIP com todos os arquivos XML das notas fiscais emitidas"
                >
                  <Download className="w-4 h-4 text-semantic-success" />
                  <span>Baixar XMLs (.ZIP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportFiscalReport(recentInvoices, 'Últimas 3 Notas Recentes')}
                  disabled={exportingReport}
                  className="h-11 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-300 cursor-pointer transition shadow-xs hover:border-[#004AAD]/50 disabled:opacity-50"
                  title="Exportar Relatório Fiscal em PDF com as notas recentes"
                >
                  {exportingReport ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#004AAD]" />
                  ) : (
                    <FileDown className="w-4 h-4 text-[#004AAD]" />
                  )}
                  <span>Exportar PDF</span>
                </button>

                {/* Botão de Acesso Rápido para Histórico Completo */}
                <button
                  type="button"
                  onClick={() => setShowFullHistoryModal(true)}
                  className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-300 cursor-pointer transition shadow-xs self-start sm:self-auto hover:border-[#004AAD]/50"
                  title="Acessar o histórico completo de notas fiscais emitidas"
                >
                  <History className="w-4 h-4 text-[#004AAD]" />
                  <span>Histórico Completo</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#004AAD] text-[10px] font-mono font-extrabold">
                    {invoices.length}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            }
          />
        </div>

        {/* Lista das 3 Últimas Notas Fiscais com cards rounded-2xl */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentInvoices.map((inv, idx) => {
            const isNfe = inv.tipo === 'NFE';
            return (
              <div
                key={inv.id || `recent-${inv.numero}-${idx}`}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md hover:scale-[1.01] ${
                  isNfe
                    ? 'bg-blue-50/40 border-blue-200/80 hover:border-[#004AAD]'
                    : 'bg-purple-50/40 border-purple-200/80 hover:border-[#5E17EB]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 font-inter ${
                      isNfe
                        ? 'bg-[#004AAD] text-white border-[#00367d]'
                        : 'bg-[#5E17EB] text-white border-[#470ec4]'
                    }`}>
                      {isNfe ? <FileText className="w-3 h-3 text-[#2dd683]" /> : <Globe className="w-3 h-3 text-[#2dd683]" />}
                      <span>{isNfe ? 'NF-e Produto' : 'NFS-e Serviço'}</span>
                    </span>

                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-inter ${
                      inv.status === 'PRODUCAO'
                        ? 'bg-semantic-success-light text-semantic-success border-semantic-success-light'
                        : inv.status === 'RASCUNHO'
                        ? 'bg-semantic-warning-light text-slate-900 border-semantic-warning-light'
                        : 'bg-brand-blue-light text-brand-blue border-brand-blue-light'
                    }`}>
                      {inv.status === 'PRODUCAO' ? 'Autorizada' : inv.status === 'RASCUNHO' ? 'Rascunho' : 'Homologação'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-extrabold text-slate-900">
                        Nº {inv.numero}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5 font-montserrat flex items-center" title={inv.destinatarioNome}>
                      <span className="truncate">{inv.destinatarioNome}</span>
                      <InfoTooltip text={`Documento: ${inv.destinatarioDocumento}`} />
                    </h4>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-600 font-montserrat">Total:</span>
                    <span className="font-mono text-xs font-extrabold text-slate-900">
                      R$ {inv.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[11px] font-bold font-inter">
                    <button
                      type="button"
                      onClick={() => setQrModalInvoice(inv)}
                      className="h-9 px-1 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Escanear e Conferir com QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#004AAD]" />
                      <span className="text-[10px]">QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveXmlVisualizer(inv.xmlSimulado || ensureInvoiceXml(inv))}
                      className="h-9 px-1 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Ver Código XML Fiscal"
                    >
                      <FileCode className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[10px]">Ver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        downloadInvoiceXml(inv);
                        setExportToast(`Download da NF nº ${inv.numero} em XML concluído!`);
                      }}
                      className="h-9 px-1 rounded-xl bg-semantic-success-light hover:bg-emerald-100 text-slate-900 border border-semantic-success-light flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Baixar Arquivo XML (.xml)"
                    >
                      <Download className="w-3.5 h-3.5 text-semantic-success" />
                      <span className="text-[10px]">XML</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewInvoice(inv)}
                      className={`h-9 px-1 rounded-xl text-white flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs ${
                        isNfe ? 'bg-[#004AAD] hover:bg-[#00367d]' : 'bg-[#5E17EB] hover:bg-[#470ec4]'
                      }`}
                      title={isNfe ? 'Visualizar DANFE' : 'Visualizar DANFSE'}
                    >
                      <Eye className="w-3.5 h-3.5 text-[#2dd683]" />
                      <span className="text-[10px]">{isNfe ? 'DANFE' : 'NFS-e'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {recentInvoices.length === 0 && (
            <div className="col-span-full py-8 text-center p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-600 font-medium">
              Nenhuma nota fiscal ou rascunho emitido até o momento.
            </div>
          )}
        </div>
      </motion.div>

      {/* -------------------------------------------------------------
          ABA 1: VENDA DE PRODUTOS (NF-e) + CONFIGURAÇÃO DO CERTIFICADO DIGITAL
          ------------------------------------------------------------- */}
      {activeTab === 'nfe' && (
        <motion.div 
          key="nfe-tab"
          variants={fiscalItemVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          
          {/* Status do Certificado Digital SEFAZ (Gerenciado na Central de Configurações) */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    Certificado Digital SEFAZ: <strong className="text-emerald-700 font-extrabold">{digitalCertificate.titular || 'Ativo'} ({digitalCertificate.tipo})</strong>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Ativo • Vence em {digitalCertificate.diasRestantes} dias
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Emissor: {digitalCertificate.emissor} • Arquivo: {digitalCertificate.fileName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.('configuracoes')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>Gerenciar em Configurações</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid Principal: Assistente de Emissão Comercial + Histórico de NF-e */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Assistente de Emissão Comercial (NF-e) */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="pb-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#004AAD]" />
                  <span>Emissor de NF-e (Produto Comercial)</span>
                  <InfoTooltip text="Preencha os dados do comprador e do produto" />
                </h3>
              </div>
              
              <div className="h-[0.8px] w-full bg-logo-gradient mb-3 rounded-full shadow-xs" />

              <form onSubmit={handleEmitNFe} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Passo 1: Destinatário / Comprador
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 hover:border-slate-400 transition font-medium"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.documento})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Passo 2: Item de Mercadoria
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 hover:border-slate-400 transition font-medium"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.sku} | {p.nome} (R$ {p.venda.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Quantidade de Peças / Unidades
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={prodQty}
                    onChange={(e) => setProdQty(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 font-mono font-bold"
                  />
                </div>

                {/* Aviso Tributário MEI */}
                <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-[11px] text-blue-950 space-y-1">
                  <p className="font-bold inline-flex items-center gap-1.5 text-[#00367d]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#004AAD]" /> Enquadramento Fiscal do MEI
                  </p>
                  <p className="leading-relaxed text-[10px] text-slate-700">
                    O MEI goza de imunidade tributária de ICMS/IPI próprio nas notas. O sistema preenche automaticamente o Código de Situação da Operação no Simples Nacional (CSOSN) como <strong>102 (Imunidade total)</strong> no XML fiscal.
                  </p>
                </div>

                {/* Botão de Envio com Altura Padronizada h-11 */}
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Transmitir NF-e e Assinar com Certificado A1</span>
                </button>
              </form>
            </div>

            {/* Histórico e Ações de NF-e Emitidas */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-1">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                    Notas Fiscais de Produto Emitidas (NF-e)
                    <InfoTooltip text="Histórico de transmissões autorizadas pela SEFAZ" />
                  </h3>
                </div>
              </div>

              <div className="h-[0.8px] w-full bg-logo-gradient mb-3 rounded-full shadow-xs" />

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {invoices
                  .filter(i => i.tipo === 'NFE')
                  .map((inv, idx) => (
                    <div 
                      key={inv.id || `nfe-${inv.numero}-${idx}`} 
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans hover:bg-white hover:border-blue-300 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ease-out"
                    >
                      <div className="w-full md:w-auto space-y-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-mono bg-white text-slate-900 px-2 py-0.5 rounded font-extrabold border border-slate-300">
                            NF-e Nº {inv.numero}
                          </span>
                          
                          <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full border ${
                            inv.status === 'PRODUCAO' 
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}>
                            {inv.status === 'PRODUCAO' ? 'SEFAZ Autorizada' : 'Homologação (Testes)'}
                          </span>
                          
                          <span className="text-[10px] text-slate-600 font-medium">
                            Emissão: {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 flex items-center">
                          <span>{inv.destinatarioNome}</span>
                          <InfoTooltip text={`Documento: ${inv.destinatarioDocumento}`} />
                        </h4>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-none pt-3 md:pt-0 border-slate-200">
                        <div className="flex items-center justify-between sm:block">
                          <span className="text-[10px] uppercase font-bold text-slate-500 sm:hidden">Valor Total:</span>
                          <span className="font-mono text-sm font-extrabold text-slate-900 block">
                            R$ {inv.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:flex gap-2 text-xs font-bold w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setQrModalInvoice(inv)}
                            className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-300"
                            title="Escanear e Conferir Chave com QR Code"
                          >
                            <QrCode className="w-4 h-4 text-[#004AAD]" />
                            <span className="text-xs">QR Code</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveXmlVisualizer(inv.xmlSimulado || ensureInvoiceXml(inv))}
                            className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-300"
                            title="Exibir Código XML Fiscal"
                          >
                            <FileCode className="w-4 h-4 text-[#004AAD]" />
                            <span className="text-xs">Ver XML</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              downloadInvoiceXml(inv);
                              setExportToast(`Download da NF-e nº ${inv.numero} em XML concluído!`);
                            }}
                            className="h-11 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-center gap-1.5 cursor-pointer transition border border-emerald-300 shadow-2xs"
                            title="Baixar Arquivo XML (.xml)"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs">Baixar XML</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="h-11 px-4 rounded-xl bg-[#004AAD] hover:bg-[#00367d] text-white flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                            title="Visualizar e Imprimir DANFE"
                          >
                            <Printer className="w-4 h-4 text-[#2dd683]" />
                            <span className="text-xs">DANFE</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {invoices.filter(i => i.tipo === 'NFE').length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-600 font-medium">
                    Nenhuma nota fiscal eletrônica NF-e emitida ainda. Utilize o formulário ao lado.
                  </div>
                )}
              </div>
            </div>

          </div>

        </motion.div>
      )}

      {/* -------------------------------------------------------------
          ABA 2: PRESTAÇÃO DE SERVIÇOS (NFS-e GOV.BR)
          ------------------------------------------------------------- */}
      {activeTab === 'nfse' && (
        <motion.div 
          key="nfse-tab"
          variants={fiscalItemVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          
          {/* Informações de Conexão Portal Nacional da NFS-e Gov.br */}
          <div className="bg-white border border-purple-200/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-purple-100 text-[#5E17EB] border border-purple-200">
                  <Globe className="w-5 h-5 text-[#5E17EB]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                    Portal Nacional da NFS-e Gov.br (Padrão Unificado MEI)
                    <InfoTooltip text="Desde a Resolução CGSN 169/2022, o MEI emite NFS-e pelo Gov.br usando Usuário/Senha Web ou Certificado Digital opcional" />
                  </h3>
                </div>
              </div>

              <span className="text-[10px] font-bold px-3 py-1 rounded-full border inline-flex items-center gap-1.5 self-start sm:self-auto bg-emerald-100 text-emerald-900 border-emerald-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                Integração Gov.br Conectada
              </span>
            </div>

            <div className="h-[0.8px] w-full bg-logo-gradient rounded-full shadow-xs" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-700 block">
                  Padrão de Emissão
                </span>
                <p className="font-bold text-slate-900">NFS-e Nacional Padrão ABRASF</p>
                <p className="text-[10px] text-slate-600 font-medium">Sistema Emissor Nacional Gov.br / MEI</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-700 block">
                  Forma de Autenticação
                </span>
                <p className="font-bold text-[#5E17EB]">Login Gov.br (Prata / Ouro)</p>
                <p className="text-[10px] text-slate-600 font-medium">Isento de obrigatoriedade de certificado A1</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-700 block">
                    Código de Serviço (NBS)
                  </span>
                  <strong className="text-slate-900 font-mono">14.06.01 - Marcenaria</strong>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-xl">
                  Ativo
                </span>
              </div>

            </div>
          </div>

          {/* Grid Principal: Assistente de NFS-e de Serviços + Histórico */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Assistente de NFS-e */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="pb-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#5E17EB]" />
                  <span>Emissor de NFS-e de Serviços</span>
                  <InfoTooltip text="Emissão para tomadores de serviço" />
                </h3>
              </div>
              
              <div className="h-[0.8px] w-full bg-logo-gradient mb-3 rounded-full shadow-xs" />

              <form onSubmit={handleEmitNFSe} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Tomador do Serviço (Cliente)
                  </label>
                  <select
                    value={serviceClient}
                    onChange={(e) => setServiceClient(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 hover:border-slate-400 transition font-medium"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.documento})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Serviço Executado
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 px-3 py-2.5 hover:border-slate-400 transition font-medium"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nome} (R$ {s.valor.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tributação MEI */}
                <div className="p-3.5 bg-purple-50/90 border border-purple-200 rounded-2xl text-[11px] text-purple-950 space-y-1">
                  <p className="font-bold inline-flex items-center gap-1.5 text-[#420bb8]">
                    <CheckCircle className="w-3.5 h-3.5 text-[#5E17EB]" /> ISS Recolhido via DAS Mensal
                  </p>
                  <p className="leading-relaxed text-[10px] text-slate-700">
                    O ISSQN do MEI é fixo no DAS mensal (R$ 5,00/mês). Não há retenção na fonte de ISS quando prestado para pessoas físicas ou jurídicas padrão.
                  </p>
                </div>

                {/* Botão de Envio com Altura Padronizada h-11 */}
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#5E17EB] hover:bg-[#470ec4] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send className="w-4 h-4 text-[#2dd683]" />
                  <span>Transmitir NFS-e Nacional</span>
                </button>
              </form>
            </div>

            {/* Histórico e Ações de NFS-e */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-1">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                    NFS-e de Serviço Emitidas
                    <InfoTooltip text="Histórico de notas de serviço registradas" />
                  </h3>
                </div>
              </div>

              <div className="h-[0.8px] w-full bg-logo-gradient mb-3 rounded-full shadow-xs" />

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {invoices
                  .filter(i => i.tipo === 'NFSE')
                  .map((inv, idx) => (
                    <div 
                      key={inv.id || `nfse-${inv.numero}-${idx}`} 
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans hover:bg-white hover:border-purple-300 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ease-out"
                    >
                      <div className="w-full md:w-auto space-y-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-mono bg-white text-slate-900 px-2 py-0.5 rounded font-extrabold border border-slate-300">
                            NFS-e Nº {inv.numero}
                          </span>
                          
                          <span className="text-[10px] font-bold py-0.5 px-2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            Autorizada Gov.br
                          </span>
                          
                          <span className="text-[10px] text-slate-600 font-medium">
                            Emissão: {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 flex items-center">
                          <span>{inv.destinatarioNome}</span>
                          <InfoTooltip text={`Documento: ${inv.destinatarioDocumento}`} />
                        </h4>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-none pt-3 md:pt-0 border-slate-200">
                        <div className="flex items-center justify-between sm:block">
                          <span className="text-[10px] uppercase font-bold text-slate-500 sm:hidden">Valor Total:</span>
                          <span className="font-mono text-sm font-extrabold text-slate-900 block">
                            R$ {inv.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:flex gap-2 text-xs font-bold w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setQrModalInvoice(inv)}
                            className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-300"
                            title="Escanear e Conferir Chave com QR Code"
                          >
                            <QrCode className="w-4 h-4 text-[#5E17EB]" />
                            <span className="text-xs">QR Code</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveXmlVisualizer(inv.xmlSimulado || ensureInvoiceXml(inv))}
                            className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-300"
                            title="Exibir Código XML Fiscal"
                          >
                            <FileCode className="w-4 h-4 text-[#5E17EB]" />
                            <span className="text-xs">Ver XML</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              downloadInvoiceXml(inv);
                              setExportToast(`Download da NFS-e nº ${inv.numero} em XML concluído!`);
                            }}
                            className="h-11 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-center gap-1.5 cursor-pointer transition border border-emerald-300 shadow-2xs"
                            title="Baixar Arquivo XML (.xml)"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs">Baixar XML</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className="h-11 px-4 rounded-xl bg-[#5E17EB] hover:bg-[#470ec4] text-white flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                            title="Visualizar e Imprimir DANFSE"
                          >
                            <Printer className="w-4 h-4 text-[#2dd683]" />
                            <span className="text-xs">DANFSE</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {invoices.filter(i => i.tipo === 'NFSE').length === 0 && (
                  <div className="text-center py-12 text-xs text-slate-600 font-medium">
                    Nenhuma nota fiscal de serviço NFS-e emitida ainda. Utilize o formulário ao lado.
                  </div>
                )}
              </div>
            </div>

          </div>

        </motion.div>
      )}

      {/* -------------------------------------------------------------
          ABA 3: GUIA DAS (SIMPLES NACIONAL) - RECOLHIMENTO E APURAÇÃO UNIFICADA MEI
          ------------------------------------------------------------- */}
      {activeTab === 'das' && (
        <motion.div 
          key="das-tab"
          variants={fiscalItemVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Card de Visão Geral & Conformidade do DAS */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <SectionHeader
                as="h3"
                icon={<Coins className="w-6 h-6 text-emerald-600" />}
                iconVariant="emerald"
                title="Documento de Arrecadação do Simples Nacional (DAS-MEI)"
                info="Guia unificada mensal de tributos (INSS Previdência, ICMS Comércio e ISS Serviços)"
                badges={
                  <StatusBadge
                    tone="success"
                    icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />}
                    label="CNPJ Regular no Simples Nacional"
                  />
                }
              />
            </div>

            {/* Grid de 3 Indicadores Rápidos do DAS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-inter">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:bg-white hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Competências Pagas
                  </span>
                  <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-extrabold font-mono text-slate-900 block">
                    {dasPayments.filter(d => d.status === 'PAGO').length} de {dasPayments.length || 12}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {dasPayments.filter(d => d.status === 'PENDENTE').length === 0 ? 'Todas as guias em dia' : `${dasPayments.filter(d => d.status === 'PENDENTE').length} pendente(s)`}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:bg-white hover:border-blue-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Tributos Quitados
                  </span>
                  <span className="p-2 rounded-xl bg-blue-100 text-[#004AAD]">
                    <DollarSign className="w-4 h-4 text-[#004AAD]" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-extrabold font-mono text-[#004AAD] block">
                    R$ {dasPayments.filter(d => d.status === 'PAGO').reduce((sum, d) => sum + d.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Valor fixo de R$ 75,60 por competência
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:bg-white hover:border-purple-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Limite Legal MEI (DASN-SIMEI)
                  </span>
                  <span className="p-2 rounded-xl bg-purple-100 text-[#5E17EB]">
                    <TrendingUp className="w-4 h-4 text-[#5E17EB]" />
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold font-mono text-slate-900">
                      R$ {totalGeneralAccumulated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      / R$ 81.000,00
                    </span>
                  </div>
                  {/* Barra de Progresso do Teto Anual */}
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        (totalGeneralAccumulated / 81000) > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (totalGeneralAccumulated / 81000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Guias Mensais DAS do Exercício 2026 */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 font-inter">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 font-montserrat flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Competências e Guias de Recolhimento Mensal</span>
                  <InfoTooltip text="Vencimento padrão: todo dia 20 do mês subsequente à competência" />
                </h4>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Composição: INSS (R$ 70,60) + ICMS (R$ 1,00) + ISS (R$ 5,00)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-inter">
              {(dasPayments.length > 0 ? dasPayments : [
                { id: 'das-1', periodoReferencia: '01/2026', dataVencimento: '2026-02-20', valor: 75.60, status: 'PAGO' },
                { id: 'das-2', periodoReferencia: '02/2026', dataVencimento: '2026-03-20', valor: 75.60, status: 'PAGO' },
                { id: 'das-3', periodoReferencia: '03/2026', dataVencimento: '2026-04-20', valor: 75.60, status: 'PENDENTE' },
                { id: 'das-4', periodoReferencia: '04/2026', dataVencimento: '2026-05-20', valor: 75.60, status: 'PENDENTE' },
                { id: 'das-5', periodoReferencia: '05/2026', dataVencimento: '2026-06-20', valor: 75.60, status: 'PENDENTE' },
                { id: 'das-6', periodoReferencia: '06/2026', dataVencimento: '2026-07-20', valor: 75.60, status: 'PENDENTE' },
              ]).map((das, idx) => {
                const isPaid = das.status === 'PAGO';
                return (
                  <div 
                    key={das.id || `das-${das.periodoReferencia}-${idx}`}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                      isPaid 
                        ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400' 
                        : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-xs font-extrabold text-slate-900 block font-montserrat">
                          Competência {das.periodoReferencia}
                        </strong>
                        <span className="text-[11px] text-slate-500 block font-medium mt-0.5">
                          Vencimento: {new Date(das.dataVencimento).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isPaid 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                      }`}>
                        {isPaid ? 'PAGO' : 'EM ABERTO'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">Valor Devido:</span>
                      <strong className="text-sm font-mono font-extrabold text-slate-900">
                        R$ {das.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => handleDownloadDASBoleto(das.periodoReferencia, das.valor)}
                        className="flex-1 h-11 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                        title="Baixar Boleto Oficial / Comprovante DAS"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-xs">Boleto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyDASBarcode(das.periodoReferencia)}
                        className="h-11 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                        title="Copiar Linha Digitável do Código de Barras"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-xs">Código</span>
                      </button>

                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onPayDAS) {
                              onPayDAS(das.id);
                            }
                            addLog('Fiscal', 'EDICAO', `Quitada guia DAS da competência ${das.periodoReferencia} via ERP`);
                            setExportToast(`Guia DAS referente a ${das.periodoReferencia} quitada com sucesso!`);
                          }}
                          className="flex-1 h-11 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Confirmar Pagamento da Guia DAS"
                        >
                          <Check className="w-4 h-4" />
                          <span className="text-xs">Pagar</span>
                        </button>
                      ) : (
                        <span className="flex-1 h-11 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Quitado</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card Didático: Benefícios Previdenciários do MEI */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-3 font-inter">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-montserrat flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direitos e Benefícios Garantidos pelo Recolhimento do DAS</span>
              <InfoTooltip text="Cobertura previdenciária do INSS assegurada aos microempreendedores em dia com a guia mensal" />
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Aposentadoria</strong>
                <span className="text-[11px] text-slate-600 mt-0.5 block">Por idade após carência mínima de contribuição</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Auxílio por Incapacidade</strong>
                <span className="text-[11px] text-slate-600 mt-0.5 block">Auxílio-doença temporário por motivo médico</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Salário-Maternidade</strong>
                <span className="text-[11px] text-slate-600 mt-0.5 block">Benefício de 120 dias para parto ou adoção</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block font-bold">Pensão e Reclusão</strong>
                <span className="text-[11px] text-slate-600 mt-0.5 block">Proteção previdenciária extensiva aos dependentes</span>
              </div>
            </div>
          </div>

        </motion.div>
      )}

      {/* -------------------------------------------------------------
          MODAL 1: XML CONSOLIDADO SEFAZ / GOV.BR
          ------------------------------------------------------------- */}
      {activeXmlVisualizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 border border-slate-300 space-y-4">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#004AAD]" />
                <span>XML Consolidado do Documento Fiscal</span>
              </h3>
              <button 
                type="button"
                onClick={() => setActiveXmlVisualizer(null)} 
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <XOctagon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="h-[0.8px] w-full bg-logo-gradient rounded-full shadow-xs" />

            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded-2xl overflow-x-auto max-h-[50vh] leading-relaxed select-text border border-slate-800">
              <code>{activeXmlVisualizer}</code>
            </pre>

            <div className="pt-2 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeXmlVisualizer);
                  setExportToast('Código XML copiado com sucesso!');
                }}
                className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer border border-slate-300"
              >
                Copiar XML
              </button>

              <button
                type="button"
                onClick={() => {
                  const now = new Date().toISOString().split('T')[0];
                  downloadXmlString(`NotaFiscal_SEFAZ_${now}.xml`, activeXmlVisualizer);
                  setExportToast('Download do arquivo XML realizado com sucesso!');
                }}
                className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
                title="Baixar arquivo XML completo no computador"
              >
                <Download className="w-4 h-4" />
                <span>Baixar XML (.xml)</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveXmlVisualizer(null)}
                className="h-11 px-5 rounded-xl bg-[#004AAD] hover:bg-[#00367d] text-white text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 2: ESPELHO FISCAL DANFE & DANFSE (COM CONTROLE HORIZONTAL/VERTICAL E BORDAS ARREDONDADAS)
          ------------------------------------------------------------- */}
      {previewInvoice && (
        <FiscalInvoicePreviewModal
          invoice={previewInvoice}
          defaultOrientation={previewOrientation}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {/* -------------------------------------------------------------
          MODAL 3: QR CODE DINÂMICO PARA CONFERÊNCIA RÁPIDA VIA CELULAR
          ------------------------------------------------------------- */}
      {qrModalInvoice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setQrModalInvoice(null)}
        >
          <div 
            className="bg-white border border-slate-300 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#004AAD]" />
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center">
                  <span>Conferência QR Code {qrModalInvoice.tipo === 'NFE' ? 'NF-e' : 'NFS-e'}</span>
                  <InfoTooltip text="Consulte a autenticidade fiscal diretamente no portal oficial da SEFAZ ou Gov.br com a câmera do celular" />
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalInvoice(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-center py-2">
              <FiscalQRCode
                chaveAcesso={
                  qrModalInvoice.tipo === 'NFE'
                    ? `3526 0630 7519 3400 0130 5500 1000 ${qrModalInvoice.numero} 1004 8832 91`
                    : `3526063075193400013056001000${qrModalInvoice.numero}`
                }
                tipo={qrModalInvoice.tipo}
                numero={qrModalInvoice.numero}
                size={180}
                showDetails={true}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setQrModalInvoice(null)}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 4: HISTÓRICO COMPLETO DE NOTAS FISCAIS (rounded-2xl)
          ------------------------------------------------------------- */}
      {showFullHistoryModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowFullHistoryModal(false)}
        >
          <div 
            className="bg-white border border-slate-300 rounded-3xl p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#004AAD] text-white shadow-xs">
                  <History className="w-5 h-5 text-[#2dd683]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center">
                    Histórico Completo de Notas Fiscais Emitidas & Rascunhos
                    <InfoTooltip text={`Total de ${invoices.length} documento(s) fiscal(is) registrado(s).`} />
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullHistoryModal(false)}
                className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer font-bold self-end sm:self-auto transition"
              >
                ✕
              </button>
            </div>

            {/* Filtros e Busca Rápida */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder="Buscar por número, destinatário ou CPF/CNPJ..."
                  className="w-full h-11 pl-4 pr-10 rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium focus:outline-hidden focus:border-[#004AAD]"
                />
                {historySearchTerm && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 p-1 bg-slate-100 border border-slate-300 rounded-2xl text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setHistoryTypeFilter('ALL')}
                  className={`h-9 px-3 rounded-xl transition cursor-pointer ${
                    historyTypeFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({invoices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTypeFilter('NFE')}
                  className={`h-9 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    historyTypeFilter === 'NFE'
                      ? 'bg-[#004AAD] text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3 h-3 text-[#2dd683]" />
                  <span>NF-e ({invoices.filter(i => i.tipo === 'NFE').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTypeFilter('NFSE')}
                  className={`h-9 px-3 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    historyTypeFilter === 'NFSE'
                      ? 'bg-[#5E17EB] text-white shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3 h-3 text-[#2dd683]" />
                  <span>NFS-e ({invoices.filter(i => i.tipo === 'NFSE').length})</span>
                </button>
              </div>
            </div>

            {/* Lista com Rolagem e Cards rounded-2xl */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
              {visibleHistoryInvoices.map((inv, idx) => {
                const isNfe = inv.tipo === 'NFE';
                return (
                  <div
                    key={inv.id || `hist-${inv.numero}-${idx}`}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white hover:border-[#004AAD]/50 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-2xl border inline-flex items-center gap-1 ${
                          isNfe
                            ? 'bg-[#004AAD] text-white border-[#00367d]'
                            : 'bg-[#5E17EB] text-white border-[#470ec4]'
                        }`}>
                          {isNfe ? <FileText className="w-3 h-3 text-[#2dd683]" /> : <Globe className="w-3 h-3 text-[#2dd683]" />}
                          <span>{isNfe ? `NF-e Nº ${inv.numero}` : `NFS-e Nº ${inv.numero}`}</span>
                        </span>

                        <span className={`text-[10px] font-bold py-0.5 px-2 rounded-2xl border ${
                          inv.status === 'PRODUCAO'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : inv.status === 'RASCUNHO'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-blue-100 text-blue-900 border-blue-300'
                        }`}>
                          {inv.status === 'PRODUCAO' ? 'SEFAZ / Gov.br Autorizada' : inv.status === 'RASCUNHO' ? 'Rascunho' : 'Homologação (Testes)'}
                        </span>

                        <span className="text-[10px] text-slate-600 font-medium">
                          Emissão: {new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 flex items-center">
                        <span>{inv.destinatarioNome}</span>
                        <InfoTooltip text={`Documento: ${inv.destinatarioDocumento}`} />
                      </h4>
                    </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-none pt-3 md:pt-0 border-slate-200">
                        <div className="flex items-center justify-between sm:block">
                          <span className="text-[10px] uppercase font-bold text-slate-500 sm:hidden">Valor Total:</span>
                          <span className="font-mono text-sm font-extrabold text-slate-900 block">
                            R$ {inv.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:flex gap-2 text-xs font-bold w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setQrModalInvoice(inv)}
                            className="h-11 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-300"
                            title="Escanear e Conferir com QR Code"
                          >
                            <QrCode className="w-4 h-4 text-[#004AAD]" />
                            <span className="text-xs">QR Code</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveXmlVisualizer(inv.xmlSimulado || ensureInvoiceXml(inv))}
                            className="h-11 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-300"
                            title="Exibir Código XML Fiscal"
                          >
                            <FileCode className="w-4 h-4 text-[#004AAD]" />
                            <span className="text-xs">Ver XML</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              downloadInvoiceXml(inv);
                              setExportToast(`Download da NF nº ${inv.numero} em XML concluído!`);
                            }}
                            className="h-11 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-center gap-1.5 cursor-pointer transition border border-emerald-300 shadow-2xs"
                            title="Baixar Arquivo XML (.xml)"
                          >
                            <Download className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs">Baixar XML</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewInvoice(inv)}
                            className={`h-11 px-4 rounded-2xl text-white flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs ${
                              isNfe ? 'bg-[#004AAD] hover:bg-[#00367d]' : 'bg-[#5E17EB] hover:bg-[#470ec4]'
                            }`}
                            title="Visualizar e Imprimir Espelho Fiscal"
                          >
                            <Printer className="w-4 h-4 text-[#2dd683]" />
                            <span className="text-xs">{isNfe ? 'DANFE' : 'DANFSE'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                );
              })}

              {hasMoreHistoryInvoices && (
                <div ref={historySentinelRef} className="py-3 text-center text-xs text-slate-400">
                  Carregando mais notas fiscais...
                </div>
              )}

              {filteredHistoryInvoices.length === 0 && (
                <div className="text-center py-12 text-xs text-slate-600 font-medium">
                  Nenhuma nota fiscal encontrada para o filtro selecionado.
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-[11px] text-slate-500">
                Mostrando {visibleHistoryInvoices.length} de {filteredHistoryInvoices.length} notas ({invoices.length} no total)
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setExportToast('Gerando pacote ZIP dos arquivos XML selecionados...');
                    await downloadInvoicesZip(filteredHistoryInvoices, `Pacote_XML_${historyTypeFilter}_${filteredHistoryInvoices.length}_notas.zip`);
                    setExportToast('Download do pacote ZIP concluído com sucesso!');
                  }}
                  disabled={filteredHistoryInvoices.length === 0}
                  className="h-11 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                  title="Baixar todos os XMLs filtrados em um único arquivo compactado .ZIP"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar XMLs Filtrados (.ZIP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const label = historyTypeFilter === 'NFE' ? 'Apenas NF-e' : historyTypeFilter === 'NFSE' ? 'Apenas NFS-e' : 'Todas as Notas do Histórico';
                    handleExportFiscalReport(filteredHistoryInvoices, historySearchTerm ? `${label} (Filtro: "${historySearchTerm}")` : label);
                  }}
                  disabled={exportingReport || filteredHistoryInvoices.length === 0}
                  className="h-11 px-4 rounded-2xl bg-[#004AAD] hover:bg-[#00367d] text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                  title="Exportar em PDF as notas filtradas atualmente"
                >
                  {exportingReport ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#2dd683]" />
                  ) : (
                    <FileDown className="w-4 h-4 text-[#2dd683]" />
                  )}
                  <span>Exportar Relatório Fiscal PDF ({filteredHistoryInvoices.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullHistoryModal(false)}
                  className="h-11 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer border border-slate-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Export Toast Notification */}
      {exportToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80">
            <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">{exportToast}</span>
            <button
              type="button"
              onClick={() => setExportToast(null)}
              className="ml-2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
});
