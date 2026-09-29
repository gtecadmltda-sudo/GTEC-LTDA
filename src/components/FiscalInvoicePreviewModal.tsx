/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Invoice } from '../types';
import { 
  Printer, 
  X, 
  Copy, 
  Check, 
  FileText, 
  Globe, 
  ShieldCheck, 
  Building2, 
  Download,
  FileDown,
  Image,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportInvoiceToPngOrPdf } from '../utils/exportInvoice';
import { FiscalQRCode } from './FiscalQRCode';
import { downloadInvoiceXml } from '../utils/xmlDownloader';

interface FiscalInvoicePreviewModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  defaultOrientation?: 'portrait' | 'landscape';
}

export function FiscalInvoicePreviewModal({
  invoice,
  onClose,
  defaultOrientation = 'portrait'
}: FiscalInvoicePreviewModalProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(defaultOrientation);
  const [copiedKey, setCopiedKey] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'png' | 'pdf' | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrientation(defaultOrientation);
  }, [defaultOrientation]);

  if (!invoice) return null;

  const isNFe = invoice.tipo === 'NFE';
  const chaveAcesso = isNFe 
    ? `3526 0630 7519 3400 0130 5500 1000 ${invoice.numero} 1004 8832 91`
    : `3526063075193400013056001000${invoice.numero}`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(chaveAcesso.replace(/\s/g, ''));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!invoice) return;
    setExportingFormat(format);
    try {
      await exportInvoiceToPngOrPdf({
        format,
        orientation,
        element: documentRef.current,
        invoice
      });
    } catch (err) {
      console.error('Erro ao exportar nota:', err);
      alert('Erro ao exportar o documento. Tente novamente.');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-xs">
        
        {/* Container Principal com bordas arredondadas, classe de seleção fiscal-container e animação suave com motion */}
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.95, y: '100%' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: '100%' }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_e, info) => {
            if (info.offset.y > 80 || info.velocity.y > 250) {
              onClose();
            }
          }}
          transition={{
            layout: { 
              duration: 0.45, 
              ease: [0.16, 1, 0.3, 1] 
            },
            opacity: { duration: 0.25 },
            scale: { duration: 0.25 }
          }}
          className={`fiscal-container relative bg-slate-100 rounded-t-[32px] sm:rounded-2xl shadow-2xl border border-slate-300 w-full flex flex-col max-h-[92vh] sm:max-h-[95vh] overflow-hidden ${
            orientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
          }`}
        >
          {/* Mobile Drag Indicator (iOS WhatsApp style) */}
          <div className="w-full flex flex-col items-center pt-2.5 pb-1 sm:hidden cursor-grab active:cursor-grabbing select-none bg-white border-b border-slate-100">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Arraste para baixo para fechar</span>
          </div>
          
          {/* Header da Barra de Ferramentas / Controles de Layout */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-white rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none shrink-0 font-inter">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white shadow-xs ${isNFe ? 'bg-[#004AAD]' : 'bg-[#5E17EB]'}`}>
                {isNFe ? <FileText className="w-5 h-5 text-white" /> : <Globe className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="text-sm font-extrabold font-montserrat text-slate-900 flex items-center gap-2">
                  <span>{isNFe ? 'DANFE - NF-e (Produto Comercial)' : 'DANFSE - NFS-e (Serviço Nacional MEI)'}</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-semantic-success-light text-semantic-success font-bold border border-semantic-success-light">
                    Nº {invoice.numero}
                  </span>
                </h3>
                <p className="text-[11px] font-inter text-slate-500">
                  Visualização formatada oficial com alternância Horizontal (Paisagem) e Vertical (Retrato)
                </p>
              </div>
            </div>

            {/* Opções de Orientação e Ações */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Seletor de Orientação com Botões Padronizados h-11 rounded-xl e Pill animada */}
              <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`relative h-11 px-3.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 z-10 ${
                    orientation === 'portrait'
                      ? 'text-slate-900 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Modo Retrato / Vertical"
                >
                  {orientation === 'portrait' && (
                    <motion.div
                      layoutId="activeOrientationPill"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/80 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <div className="w-3.5 h-4.5 border-2 border-current rounded-xs inline-block" />
                  <span className="hidden sm:inline">Vertical (Retrato)</span>
                  <span className="sm:hidden">Retrato</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`relative h-11 px-3.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 z-10 ${
                    orientation === 'landscape'
                      ? 'text-slate-900 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Modo Paisagem / Horizontal"
                >
                  {orientation === 'landscape' && (
                    <motion.div
                      layoutId="activeOrientationPill"
                      className="absolute inset-0 bg-white rounded-xl shadow-xs border border-slate-200/80 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <div className="w-4.5 h-3.5 border-2 border-current rounded-xs inline-block" />
                  <span className="hidden sm:inline">Horizontal (Paisagem)</span>
                  <span className="sm:hidden">Paisagem</span>
                </button>
              </div>

              {/* Fechar com Altura Padronizada */}
              <button
                type="button"
                onClick={onClose}
                className="h-11 w-11 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center justify-center"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corpo do Documento (Área de Impressão e Visualização do Espelho Fiscal) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/70">
            
            <motion.div 
              ref={documentRef}
              layout
              transition={{
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1]
              }}
              className={`relative bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-lg font-sans w-full overflow-hidden ${
                orientation === 'landscape' ? 'max-w-4xl min-h-[500px]' : 'max-w-2xl min-h-[700px]'
              }`}
            >
              {/* Marca d'Água Transversal Obrigatória para Ambiente de Teste / Sem Valor Fiscal */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] pointer-events-none z-30 select-none text-center border-2 border-dashed border-rose-500/35 bg-rose-500/5 px-6 py-3 rounded-2xl w-[90%] shadow-xs"
                aria-hidden="true"
              >
                <span className="font-extrabold text-rose-600/35 uppercase text-xs sm:text-sm tracking-widest block font-display">
                  DOCUMENTO GERADO EM AMBIENTE DE TESTE, PORTANTO SEM VALOR FISCAL
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${isNFe ? 'nfe' : 'nfse'}-${orientation}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >

                  {/* =========================================================
                      LAYOUT 1: NF-e (DANFE - PRODUTO / COMÉRCIO)
                     ========================================================= */}
                  {isNFe ? (
                    <div className="space-y-4 text-[11px] leading-tight">
                      
                      {/* 1. Canhoto de Recebimento */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="border border-slate-300 rounded-2xl p-2.5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]">
                        <div className="space-y-1 w-full sm:w-2/3">
                          <p className="font-semibold text-slate-700">
                            Recebemos de <strong>CARLOS OLIVEIRA MEI</strong> os produtos constantes da Nota Fiscal Eletrônica indicada abaixo.
                          </p>
                          <div className="flex gap-4 pt-1 font-mono text-[9px] text-slate-500">
                            <span>Data de Recebimento: ____/____/________</span>
                            <span>Assinatura do Recebedor: _________________________________</span>
                          </div>
                        </div>
                        <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-300 pt-1 sm:pt-0 sm:pl-3 w-full sm:w-1/3">
                          <strong className="block text-xs font-bold">NF-e Nº {invoice.numero}</strong>
                          <span className="text-slate-500 font-mono text-[9px]">SÉRIE: 1</span>
                        </div>
                      </motion.div>

                      {/* 2. Cabeçalho DANFE com Dados do Emitente e Chave SEFAZ */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={`grid gap-3 ${orientation === 'landscape' ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
                        
                        {/* Emitente */}
                        <div className="border border-slate-300 rounded-2xl p-3 bg-white flex flex-col justify-between sm:col-span-1">
                          <div>
                            <div className="flex items-center gap-1.5 text-[#004AAD] mb-1">
                              <Building2 className="w-4 h-4" />
                              <span className="font-extrabold uppercase text-[10px] tracking-wider">Identificação do Emitente</span>
                            </div>
                            <h4 className="font-extrabold text-xs text-slate-900">CARLOS OLIVEIRA MEI</h4>
                            <p className="text-[10px] text-slate-600 mt-1">Marcenaria & Móveis Planejados</p>
                            <p className="text-[9px] text-slate-500">Rua Bento de Souza, 40 - Vila Nova</p>
                            <p className="text-[9px] text-slate-500">São Paulo - SP | CEP: 01310-100</p>
                          </div>
                          <div className="pt-2 mt-2 border-t border-slate-200 text-[9px] font-mono">
                            <span>CNPJ: <strong>30.751.934/0001-30</strong></span>
                          </div>
                        </div>

                        {/* Quadro DANFE Central */}
                        <div className="border border-slate-300 rounded-2xl p-3 bg-slate-50/80 text-center flex flex-col items-center justify-center sm:col-span-1">
                          <strong className="text-xs font-extrabold tracking-wide uppercase block text-slate-900">
                            DANFE
                          </strong>
                          <span className="text-[9px] font-medium text-slate-600 block mt-0.5">
                            Documento Auxiliar da Nota Fiscal Eletrônica
                          </span>
                          <div className="my-2 py-1 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono font-black">
                            0 - ENTRADA<br />
                            <strong className="text-emerald-700">1 - SAÍDA [ 1 ]</strong>
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-900">Nº {invoice.numero}</span>
                          <span className="text-[9px] font-mono text-slate-500">Série 001 | Folha 1/1</span>
                        </div>

                        {/* Código de Barras / Chave de Acesso */}
                        <div className="border border-slate-300 rounded-2xl p-3 bg-white flex flex-col justify-between sm:col-span-1">
                          <div className="space-y-1 text-center">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 block">
                              Controle do Fisco (SEFAZ)
                            </span>
                            {/* Código de barras simulado em SVG */}
                            <div className="h-8 flex items-center justify-center gap-0.5 my-1 overflow-hidden px-2 bg-slate-50 rounded-xl border border-slate-200">
                              {Array.from({ length: 38 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`h-6 ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-0.5 bg-transparent'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[8px] font-mono block text-slate-500 break-all">
                              CHAVE DE ACESSO:
                            </span>
                            <strong className="text-[8px] font-mono text-slate-900 block break-all tracking-tighter">
                              {chaveAcesso}
                            </strong>
                          </div>
                          <div className="pt-2 mt-1 border-t border-slate-200 text-center">
                            <span className="text-[9px] font-bold text-emerald-700">
                              Protocolo de Autorização SEFAZ Homologado
                            </span>
                          </div>
                        </div>

                      </motion.div>

                      {/* 3. Dados da Operação / Natureza */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="border border-slate-300 rounded-2xl p-2.5 bg-slate-50/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500 block text-[9px]">NATUREZA DA OPERAÇÃO</span>
                          <strong className="text-slate-800">Venda de Produção do Estabelecimento</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">INSCRIÇÃO ESTADUAL</span>
                          <strong className="text-slate-800 font-mono">123.456.789.110</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">AMBIENTE FISCAL</span>
                          <strong className="text-[#004AAD] font-bold">{invoice.status}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">DATA DE EMISSÃO</span>
                          <strong className="text-slate-800 font-mono">{new Date(invoice.dataEmissao).toLocaleDateString('pt-BR')}</strong>
                        </div>
                      </motion.div>

                      {/* 4. Layout Adaptativo: Destinatário & Cálculo de Impostos */}
                      {orientation === 'landscape' ? (
                        <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          
                          {/* Destinatário no modo Paisagem */}
                          <div className="border border-slate-300 rounded-2xl p-3 bg-white space-y-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                              Destinatário / Remetente
                            </span>
                            <div className="space-y-1.5 text-[10px]">
                              <div>
                                <span className="text-slate-500 text-[9px] block">NOME / RAZÃO SOCIAL:</span>
                                <strong className="text-slate-900 text-xs">{invoice.destinatarioNome}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[9px] block">CNPJ / CPF:</span>
                                <strong className="text-slate-900 font-mono">{invoice.destinatarioDocumento}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Cálculo do Imposto no modo Paisagem */}
                          <div className="border border-slate-300 rounded-2xl p-3 bg-slate-50/60 space-y-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                              Cálculo do Imposto (Tributação Simplificada MEI)
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                              <div>
                                <span className="text-slate-500 block">BASE ICMS / ALÍQUOTA</span>
                                <span className="font-bold">R$ 0,00 (0,00%)</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">VALOR DO ICMS</span>
                                <span className="font-bold">R$ 0,00 (Isento)</span>
                              </div>
                              <div className="col-span-2 bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-right mt-1">
                                <span className="text-emerald-800 text-[9px] font-sans font-bold block">VALOR TOTAL DA NOTA FISCAL</span>
                                <strong className="text-sm text-emerald-950 font-black">
                                  R$ {invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </strong>
                              </div>
                            </div>
                          </div>

                        </motion.div>
                      ) : (
                        <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="space-y-3">
                          {/* Destinatário / Remetente (Modo Retrato) */}
                          <div className="border border-slate-300 rounded-2xl p-3 bg-white space-y-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                              Destinatário / Remetente
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                              <div className="sm:col-span-2">
                                <span className="text-slate-500 text-[9px] block">NOME / RAZÃO SOCIAL:</span>
                                <strong className="text-slate-900 text-xs">{invoice.destinatarioNome}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[9px] block">CNPJ / CPF:</span>
                                <strong className="text-slate-900 font-mono">{invoice.destinatarioDocumento}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Cálculo do Imposto (Modo Retrato) */}
                          <div className="border border-slate-300 rounded-2xl p-3 bg-slate-50/60 space-y-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                              Cálculo do Imposto (Tributação Simplificada MEI)
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[9px] font-mono">
                              <div>
                                <span className="text-slate-500 block">BASE CÁLC. ICMS</span>
                                <span className="font-bold">R$ 0,00</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">VALOR DO ICMS</span>
                                <span className="font-bold">R$ 0,00</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">DESCONTOS</span>
                                <span className="font-bold">R$ 0,00</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">OUTRAS DESP.</span>
                                <span className="font-bold">R$ 0,00</span>
                              </div>
                              <div className="bg-emerald-50 p-1.5 rounded-xl border border-emerald-200 text-right">
                                <span className="text-emerald-800 text-[9px] font-sans font-bold block">VALOR TOTAL</span>
                                <strong className="text-xs text-emerald-950 font-black">
                                  R$ {invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* 5. Dados dos Produtos / Mercadorias */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="border border-slate-300 rounded-2xl overflow-hidden bg-white">
                        <div className="bg-slate-100 p-2.5 border-b border-slate-200 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 flex justify-between items-center">
                          <span>Dados dos Produtos / Mercadorias</span>
                          <span className="font-mono text-slate-500 text-[9px]">1 Item Listado</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10px] text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] text-slate-600 font-bold uppercase">
                              <tr>
                                <th className="p-2.5">Cód. SKU</th>
                                <th className="p-2.5">Descrição do Produto / Mercadoria</th>
                                <th className="p-2.5">NCM/SH</th>
                                <th className="p-2.5">CSOSN</th>
                                <th className="p-2.5">CFOP</th>
                                <th className="p-2.5">Un</th>
                                <th className="p-2.5 text-right">Qtd</th>
                                <th className="p-2.5 text-right">V. Unit</th>
                                <th className="p-2.5 text-right">V. Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 text-[9px] font-mono">
                              <tr>
                                <td className="p-2.5">PRD-01</td>
                                <td className="p-2.5 font-sans font-medium text-slate-900">Armário de Cozinha Planejado em MDF 18mm</td>
                                <td className="p-2.5">9403.40.00</td>
                                <td className="p-2.5 font-bold text-emerald-700">102 (Imun.)</td>
                                <td className="p-2.5">5101</td>
                                <td className="p-2.5">UN</td>
                                <td className="p-2.5 text-right">1,00</td>
                                <td className="p-2.5 text-right">R$ {invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="p-2.5 text-right font-bold text-slate-900">R$ {invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </motion.div>

                      {/* 6. Informações Complementares e QR Code Fiscal */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="border border-slate-300 rounded-2xl p-3 bg-slate-50 text-[9px] text-slate-600 leading-relaxed sm:col-span-2">
                          <strong className="block text-[10px] font-bold text-slate-800 uppercase mb-1">
                            Informações Complementares / Observações do Contribuinte
                          </strong>
                          <p>
                            I - Documento emitido por ME ou EPP optante pelo Simples Nacional (MEI).<br />
                            II - Não gera direito a crédito fiscal de IPI e de ICMS nos termos do art. 23 da LC 123/2006.<br />
                            III - Emissão efetuada com base no regime de apuração do SIMEI (Tributação fixa mensal no DAS).
                          </p>
                        </div>

                        <div className="border border-slate-300 rounded-2xl p-3 bg-white flex items-center justify-between gap-2.5">
                          <div className="space-y-1">
                            <strong className="text-[10px] font-extrabold text-[#004AAD] uppercase block">
                              Consulta SEFAZ
                            </strong>
                            <span className="text-[8px] text-slate-600 block leading-tight font-medium">
                              Aponte a câmera do celular para conferência rápida da chave de acesso.
                            </span>
                            <span className="text-[8px] text-emerald-700 font-bold block pt-0.5">
                              • QR Code Dinâmico
                            </span>
                          </div>
                          <FiscalQRCode 
                            chaveAcesso={chaveAcesso} 
                            tipo="NFE" 
                            numero={invoice.numero} 
                            size={68}
                            showExpandButton={true}
                          />
                        </div>
                      </motion.div>

                    </div>
                  ) : (
                    /* =========================================================
                        LAYOUT 2: NFS-e (DANFSE - SERVIÇO NACIONAL MEI)
                       ========================================================= */
                    <div className="space-y-4 text-[11px] leading-tight">
                      
                      {/* 1. Cabeçalho Padrão Nacional NFS-e */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="border-2 border-slate-300 rounded-2xl p-4 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#5E17EB] text-white flex items-center justify-center font-black text-xl shadow-xs">
                            MEI
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase">
                              NFS-e - NOTA FISCAL DE SERVIÇO ELETRÔNICA
                            </h4>
                            <p className="text-[10px] font-semibold text-slate-600">
                              Padrão Nacional Gov.br / Sistema Integrado de Emissão
                            </p>
                            <span className="text-[9px] font-mono text-[#5E17EB] font-bold">
                              Ambiente: {invoice.status} | Município: São Paulo - SP
                            </span>
                          </div>
                        </div>

                        <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-4">
                          <span className="text-[10px] text-slate-500 font-bold block">NÚMERO DA NOTA</span>
                          <strong className="text-base font-mono font-black text-slate-900 block">
                            {invoice.numero}
                          </strong>
                          <span className="text-[9px] text-slate-500 font-mono">
                            Emissão: {new Date(invoice.dataEmissao).toLocaleDateString('pt-BR')} às 10:25
                          </span>
                        </div>
                      </motion.div>

                      {/* 2. Prestador & Tomador de Serviços (Adaptativo Horizontal vs Vertical) */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={`grid gap-3 ${orientation === 'landscape' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        
                        {/* Prestador do Serviço */}
                        <div className="border border-slate-300 rounded-2xl p-3 bg-white space-y-1.5">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                            <strong className="text-[10px] font-extrabold uppercase text-[#5E17EB]">
                              PRESTADOR DE SERVIÇOS (MEI)
                            </strong>
                            <span className="text-[9px] font-mono text-slate-500">Simples Nacional</span>
                          </div>
                          <div className="space-y-1 text-[10px]">
                            <div>
                              <span className="text-slate-500 text-[9px] block">RAZÃO SOCIAL:</span>
                              <strong className="text-slate-900">CARLOS OLIVEIRA MEI</strong>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-slate-500 text-[9px] block">CNPJ:</span>
                                <strong className="text-slate-900 font-mono">30.751.934/0001-30</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[9px] block">INSCRIÇÃO MUNICIPAL:</span>
                                <strong className="text-slate-900 font-mono">9.876.543-2</strong>
                              </div>
                            </div>
                            <p className="text-[9px] text-slate-500 pt-1">
                              Endereço: Rua Bento de Souza, 40 - Vila Nova, São Paulo/SP - CEP 01310-100
                            </p>
                          </div>
                        </div>

                        {/* Tomador do Serviço */}
                        <div className="border border-slate-300 rounded-2xl p-3 bg-white space-y-1.5">
                          <div className="border-b border-slate-200 pb-1">
                            <strong className="text-[10px] font-extrabold uppercase text-slate-700">
                              TOMADOR DE SERVIÇOS (CLIENTE)
                            </strong>
                          </div>
                          <div className="space-y-1 text-[10px]">
                            <div>
                              <span className="text-slate-500 text-[9px] block">NOME / RAZÃO SOCIAL:</span>
                              <strong className="text-slate-900">{invoice.destinatarioNome}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[9px] block">CPF / CNPJ:</span>
                              <strong className="text-slate-900 font-mono">{invoice.destinatarioDocumento}</strong>
                            </div>
                            <p className="text-[9px] text-slate-500 pt-1">
                              Município: São Paulo - SP | País: Brasil
                            </p>
                          </div>
                        </div>

                      </motion.div>

                      {/* 3. Discriminação dos Serviços & Valores (Adaptativo Horizontal vs Vertical) */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={`grid gap-3 ${orientation === 'landscape' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        
                        {/* Discriminação dos Serviços */}
                        <div className="border border-slate-300 rounded-2xl p-3 bg-white space-y-2 flex flex-col justify-between">
                          <div>
                            <div className="border-b border-slate-200 pb-1 flex justify-between items-center">
                              <strong className="text-[10px] font-extrabold uppercase text-slate-700">
                                DISCRIMINAÇÃO DOS SERVIÇOS
                              </strong>
                              <span className="text-[9px] font-mono text-slate-500">Cód: 14.06.01</span>
                            </div>
                            <p className="text-[10px] text-slate-800 leading-relaxed font-sans bg-slate-50/70 p-2.5 rounded-xl border border-slate-200 mt-2">
                              Serviços de montagem, instalação e ajuste de ferragens, móveis sob medida e manutenção em marcenaria residencial e comercial.
                            </p>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono">
                            Local da Prestação: São Paulo - SP
                          </span>
                        </div>

                        {/* Valores e Retenções Tributárias */}
                        <div className="border border-slate-300 rounded-2xl p-3 bg-slate-50/80 space-y-2">
                          <div className="border-b border-slate-200 pb-1">
                            <strong className="text-[10px] font-extrabold uppercase text-slate-700">
                              VALOR TOTAL DOS SERVIÇOS E TRIBUTOS
                            </strong>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                            <div>
                              <span className="text-slate-500 block">PIS / COFINS</span>
                              <span className="font-bold">R$ 0,00</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">INSS RETIDO</span>
                              <span className="font-bold">R$ 0,00</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">ISS RETIDO</span>
                              <span className="font-bold">NÃO (Isento MEI)</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">DEDUÇÕES LEGAIS</span>
                              <span className="font-bold">R$ 0,00</span>
                            </div>
                          </div>
                          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-right mt-2">
                            <span className="text-emerald-800 text-[9px] font-sans font-bold block">VALOR LÍQUIDO NFS-e</span>
                            <strong className="text-base text-emerald-950 font-black font-mono">
                              R$ {invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </div>
                        </div>

                      </motion.div>

                      {/* 4. Informações de Autenticidade Nacional */}
                      <motion.div layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="border border-slate-300 rounded-2xl p-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px]">
                        <div className="space-y-1">
                          <p className="font-bold text-[#5E17EB] uppercase text-[10px]">CÓDIGO DE VERIFICAÇÃO DE AUTENTICIDADE:</p>
                          <p className="font-mono text-slate-900 text-[11px] font-extrabold tracking-wider">A7B9-83C1-4D5E-92F0</p>
                          <p className="text-slate-600 font-medium">
                            Consulte a validade deste documento no Portal Nacional da NFS-e: <strong>gov.br/nfse</strong>
                          </p>
                          <span className="text-[8px] text-emerald-700 font-bold block pt-0.5">
                            • QR Code Dinâmico para Escaneamento Mobile
                          </span>
                        </div>
                        <div className="p-2 border border-slate-200 rounded-2xl bg-slate-50 flex items-center gap-3 shrink-0">
                          <FiscalQRCode 
                            chaveAcesso={chaveAcesso} 
                            tipo="NFSE" 
                            numero={invoice.numero} 
                            size={72}
                            showExpandButton={true}
                          />
                          <span className="text-[8px] font-bold text-slate-600 leading-tight">
                            Autenticidade<br />Digital Gov.br<br />
                            <span className="text-[#5E17EB] font-mono text-[7px]">Toque p/ Ampliar</span>
                          </span>
                        </div>
                      </motion.div>

                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

            </motion.div>

          </div>

          {/* Footer com Botões Padronizados h-11 rounded-xl */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 select-none shrink-0 font-inter">
            
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#2dd683]" />
              <span>Documento em conformidade com as regras fiscais do Estatuto MEI</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              
              <button
                type="button"
                onClick={handleCopyKey}
                className="h-11 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                title="Copiar chave de acesso"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
                <span className="hidden md:inline">{copiedKey ? 'Chave Copiada!' : 'Copiar Chave'}</span>
              </button>

              {/* Botão Exportar Imagem (PNG) */}
              <button
                type="button"
                onClick={() => handleExport('png')}
                disabled={!!exportingFormat}
                className="h-11 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                title="Baixar Layout como Imagem PNG (300 DPI)"
              >
                {exportingFormat === 'png' ? (
                  <RefreshCw className="w-4 h-4 text-slate-600 animate-spin" />
                ) : (
                  <Image className="w-4 h-4 text-slate-600" />
                )}
                <span>{exportingFormat === 'png' ? 'Gerando PNG...' : 'Exportar PNG'}</span>
              </button>

              {/* Botão Exportar PDF */}
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={!!exportingFormat}
                className="h-11 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                title="Baixar Layout como Documento PDF A4"
              >
                {exportingFormat === 'pdf' ? (
                  <RefreshCw className="w-4 h-4 text-slate-600 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 text-slate-600" />
                )}
                <span>{exportingFormat === 'pdf' ? 'Gerando PDF...' : 'Exportar PDF'}</span>
              </button>

              {/* Botão Baixar XML Fiscal */}
              <button
                type="button"
                onClick={() => {
                  if (invoice) downloadInvoiceXml(invoice);
                }}
                className="h-11 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                title="Baixar arquivo XML SEFAZ / Gov.br"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Baixar XML</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                title="Abrir diálogo do navegador para impressão"
              >
                <Printer className="w-4 h-4 text-[#2dd683]" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center"
              >
                Fechar
              </button>

            </div>

          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
}
