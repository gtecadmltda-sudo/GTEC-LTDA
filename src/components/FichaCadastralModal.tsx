/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  X, 
  Printer, 
  Download, 
  Users, 
  Truck, 
  UserSquare2, 
  Package, 
  Hammer, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Layers,
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Client, Supplier, Employee, Product, Service } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { 
  formatCurrencyBRL, 
  formatQuantity, 
  formatDocument, 
  formatPhone 
} from '../utils/formatters';

export type FichaCadastralType = 'cliente' | 'fornecedor' | 'funcionario' | 'produto' | 'servico';

export interface FichaCadastralModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: FichaCadastralType;
  data: any;
  onEdit?: (data: any) => void;
}

/**
 * Modal Global de Ficha Cadastral com Opções de Impressão e Exportação PDF
 * Suporta Orientação Retrato (Portrait) ou Paisagem (Landscape) padronizada.
 */
export const FichaCadastralModal: React.FC<FichaCadastralModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  onEdit
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  if (!isOpen || !data) return null;

  const getTitleAndIcon = () => {
    switch (type) {
      case 'cliente':
        return {
          title: `Ficha do Cliente: ${data.nome || 'Cliente'}`,
          subtitle: 'Cadastro e Histórico Comercial',
          icon: <Users className="w-5 h-5 text-emerald-700" />,
          badgeColor: 'bg-emerald-100 text-emerald-800'
        };
      case 'fornecedor':
        return {
          title: `Ficha do Fornecedor: ${data.razaoSocial || 'Fornecedor'}`,
          subtitle: 'Parceiro Comercial e Pedidos',
          icon: <Truck className="w-5 h-5 text-blue-700" />,
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      case 'funcionario':
        return {
          title: `Ficha do Colaborador: ${data.nome || 'Funcionário'}`,
          subtitle: 'Dados Trabalhistas e Remuneração MEI',
          icon: <UserSquare2 className="w-5 h-5 text-purple-700" />,
          badgeColor: 'bg-purple-100 text-purple-800'
        };
      case 'produto':
        return {
          title: `Ficha do Produto: ${data.nome || 'Produto'}`,
          subtitle: 'Inventário, Custos e Margem de Venda',
          icon: <Package className="w-5 h-5 text-amber-700" />,
          badgeColor: 'bg-amber-100 text-amber-800'
        };
      case 'servico':
        return {
          title: `Ficha do Serviço: ${data.nome || 'Serviço'}`,
          subtitle: 'Prestação de Serviço e Precificação',
          icon: <Hammer className="w-5 h-5 text-indigo-700" />,
          badgeColor: 'bg-indigo-100 text-indigo-800'
        };
    }
  };

  const headerInfo = getTitleAndIcon();

  const handlePrint = () => {
    // Injeta estilo @page de acordo com a orientação selecionada antes de imprimir
    const styleEl = document.createElement('style');
    styleEl.id = 'print-page-orientation-style';
    styleEl.innerHTML = `@page { size: ${orientation}; margin: 12mm; }`;
    document.head.appendChild(styleEl);

    window.print();

    setTimeout(() => {
      const el = document.getElementById('print-page-orientation-style');
      if (el) el.remove();
    }, 1000);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Top header banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 24, 'F');

      doc.setFillColor(45, 214, 131); // brand primary emerald
      doc.rect(0, 24, pageWidth, 1.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('MEI-Simple ERP • Ficha Cadastral Oficial', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`${headerInfo.title} | ${headerInfo.subtitle}`, 14, 19);

      const timestamp = new Date().toLocaleString('pt-BR');
      doc.text(`Emissão: ${timestamp}`, pageWidth - 14, 19, { align: 'right' });

      // Build data rows for table
      const rows: [string, string][] = [];

      if (type === 'cliente') {
        rows.push(['Nome / Razão Social', data.nome || '']);
        rows.push(['Tipo', data.tipo === 'PJ' ? 'Pessoa Jurídica (PJ)' : 'Pessoa Física (PF)']);
        rows.push(['Documento (CPF/CNPJ)', formatDocument(data.documento)]);
        rows.push(['Situação Cadastral', data.adimplente ? 'Adimplente' : 'Inadimplente']);
        rows.push(['Telefone', formatPhone(data.telefone) || 'Não informado']);
        rows.push(['E-mail', data.email || 'Não informado']);
        rows.push(['Endereço', data.logradouro ? `${data.logradouro}, ${data.bairro || ''} - ${data.cidade || ''}/${data.uf || ''} (CEP: ${data.cep || ''})` : 'Não informado']);
      } else if (type === 'fornecedor') {
        rows.push(['Razão Social / Fantasia', data.razaoSocial || '']);
        rows.push(['CNPJ', formatDocument(data.cnpj)]);
        rows.push(['Pessoa de Contato', data.contato || 'Não informado']);
        rows.push(['Telefone', formatPhone(data.telefone) || 'Não informado']);
        rows.push(['E-mail', data.email || 'Não informado']);
        rows.push(['Condições de Pagamento', data.condicoesPagamento || 'À vista']);
      } else if (type === 'funcionario') {
        rows.push(['Nome Completo', data.nome || '']);
        rows.push(['CPF', formatDocument(data.cpf)]);
        rows.push(['Cargo / Função', data.cargo || '']);
        rows.push(['Remuneração Mensal', typeof data.remuneracao === 'number' ? formatCurrencyBRL(data.remuneracao) : String(data.remuneracao || '')]);
        rows.push(['Data de Admissão', data.dataAdmissao || 'Não informado']);
        rows.push(['Documentação Trabalhista', data.documentacao || 'Não informado']);
      } else if (type === 'produto') {
        rows.push(['Nome do Produto', data.nome || '']);
        rows.push(['Código SKU', data.sku || '']);
        rows.push(['Categoria', data.categoria || 'Geral']);
        rows.push(['Unidade de Medida', data.unidade || 'UN']);
        rows.push(['Preço de Custo', formatCurrencyBRL(data.custo)]);
        rows.push(['Preço de Venda', formatCurrencyBRL(data.venda)]);
        rows.push(['Margem de Lucro', `${formatCurrencyBRL((data.venda || 0) - (data.custo || 0))} (${(data.lucroPercentual || 0).toFixed(1)}%)`]);
        rows.push(['Saldo em Estoque', `${data.estoqueAtual} ${data.unidade || 'UN'}`]);
        rows.push(['Estoque Mínimo de Segurança', `${data.estoqueMinimo} ${data.unidade || 'UN'}`]);
      } else if (type === 'servico') {
        rows.push(['Nome do Serviço', data.nome || '']);
        rows.push(['Categoria', data.categoria || 'Geral']);
        rows.push(['Valor Padrão / Honorário', formatCurrencyBRL(data.valor)]);
        rows.push(['Descrição dos Procedimentos', data.descricao || '']);
      }

      autoTable(doc, {
        startY: 32,
        head: [['Campo / Parâmetro', 'Informação Registrada']],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9.5,
          textColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: orientation === 'landscape' ? 70 : 55, fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        },
        styles: {
          cellPadding: 3.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.2
        }
      });

      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 120;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Documento gerado pelo sistema MEI-Simple. Válido para controle interno e auditoria fiscal MEI.', 14, Math.min(finalY, doc.internal.pageSize.getHeight() - 10));

      const cleanFileName = `ficha_${type}_${String(data.nome || data.razaoSocial || data.sku || 'documento').toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
      doc.save(cleanFileName);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Houve um erro ao processar o arquivo PDF. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 pointer-events-auto">
      <div 
        className="bg-white w-full max-w-4xl max-h-[90vh] sm:max-h-[92vh] rounded-t-[32px] sm:rounded-2xl shadow-2xl border-2 border-emerald-500/40 flex flex-col overflow-hidden text-slate-800 print:shadow-none print:border-none print:max-h-none print:w-full"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Drag Indicator */}
        <div 
          onClick={onClose}
          className="w-full flex flex-col items-center pt-2.5 pb-1 sm:hidden cursor-grab select-none bg-slate-50/70 border-b border-slate-100 print:hidden"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
          <span className="text-[10px] text-slate-400 font-medium mt-0.5">Arraste para fechar</span>
        </div>

        {/* Modal Header */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl font-bold shadow-xs ${headerInfo.badgeColor}`}>
              {headerInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {headerInfo.title}
                </h3>
                <InfoTooltip text="Ficha cadastral com auditoria e opções para impressão e exportação." />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          {/* Botões do topo e Seletor de Orientação */}
          <div className="flex items-center gap-2 print:hidden w-full sm:w-auto justify-end flex-wrap">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  orientation === 'portrait' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Orientação Retrato (Vertical)"
              >
                Retrato
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  orientation === 'landscape' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Orientação Paisagem (Horizontal)"
              >
                Paisagem
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              title="Disparar impressão da ficha"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              title="Exportar arquivo PDF oficial formatado"
            >
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(data);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Editar
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Ficha Cadastral Printable Area */}
        <div className={`p-6 overflow-y-auto space-y-6 ${orientation === 'landscape' ? 'max-w-5xl mx-auto' : ''}`}>
          
          {/* Cabeçalho da Empresa MEI para a Folha */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-[#2dd683] text-[#000000] w-9 h-9 rounded-xl flex items-center justify-center shadow-xs font-black">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <span className="font-bold text-sm text-slate-900 tracking-tight">MEI-Simple ERP</span>
                <span className="text-[11px] text-slate-500 block">Gestão e Conformidade Cadastral do Microempreendedor</span>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <span>Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CONTEÚDO ESPECÍFICO POR TIPO                                    */}
          {/* ============================================================== */}

          {/* 1. CLIENTE */}
          {type === 'cliente' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nome Completo / Razão Social</span>
                  <span className="text-sm font-black text-slate-900">{data.nome}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Tipo: {data.tipo === 'PJ' ? 'Pessoa Jurídica (PJ)' : 'Pessoa Física (PF)'}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CPF / CNPJ</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{formatDocument(data.documento)}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                    data.adimplente ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {data.adimplente ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {data.adimplente ? 'Adimplente' : 'Inadimplente com Pendências'}
                  </span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Contato</span>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {formatPhone(data.telefone) || 'Não informado'}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {data.email || 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Endereço */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Endereço Comercial / Residencial</span>
                <p className="text-xs text-slate-700 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {data.logradouro ? `${data.logradouro}, ${data.bairro || ''} - ${data.cidade || ''}/${data.uf || ''} (CEP: ${data.cep || ''})` : 'Endereço não cadastrado'}
                  </span>
                </p>
              </div>

              {/* Histórico de Compras */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Histórico de Compras & Serviços</h4>
                {data.historicoCompras && data.historicoCompras.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3">Data</th>
                          <th className="p-3">Descrição da Operação</th>
                          <th className="p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.historicoCompras.map((compra: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-600">{compra.data}</td>
                            <td className="p-3 font-medium text-slate-800">{compra.descricao}</td>
                            <td className="p-3 text-right font-bold text-emerald-700">{formatCurrencyBRL(compra.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    Nenhum pedido ou compra registrado para este cliente.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. FORNECEDOR */}
          {type === 'fornecedor' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Razão Social / Nome Fantasia</span>
                  <span className="text-sm font-black text-slate-900">{data.razaoSocial}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Contato: {data.contatoNome || 'Principal'}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CNPJ Oficial</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{formatDocument(data.cnpj)}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Condição: {data.condicoesPagamento || 'Boleto 30d'}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Comunicação</span>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {formatPhone(data.telefone) || 'Não informado'}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {data.email || 'Não informado'}
                  </span>
                </div>
              </div>

              {/* Histórico de Pedidos de Compra */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Histórico de Pedidos com o Fornecedor</h4>
                {data.historicoPedidos && data.historicoPedidos.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3">Data</th>
                          <th className="p-3">Valor da Compra</th>
                          <th className="p-3 text-right">Status do Pedido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.historicoPedidos.map((ped: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-600">{ped.data}</td>
                            <td className="p-3 font-bold text-slate-900">{formatCurrencyBRL(ped.valor)}</td>
                            <td className="p-3 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                                {ped.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    Nenhum pedido de compra registrado para este fornecedor.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. FUNCIONÁRIO */}
          {type === 'funcionario' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Colaborador</span>
                  <span className="text-sm font-black text-slate-900">{data.nome}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Cargo: {data.cargo}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">CPF & CTPS</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{formatDocument(data.cpf)}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Admissão: {data.dataAdmissao || 'Não informada'}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Remuneração Mensal</span>
                  <span className="text-sm font-black text-emerald-700">{formatCurrencyBRL(data.remuneracao)}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Limite MEI: 1 empregado registrado</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Documentação e Registros Trabalhistas</span>
                <p className="text-xs text-slate-700 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {data.documentacao || 'PIS/PASEP e CTPS arquivados fisicamente.'}
                </p>
              </div>
            </div>
          )}

          {/* 4. PRODUTO */}
          {type === 'produto' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Produto & SKU</span>
                  <span className="text-sm font-black text-slate-900">{data.nome}</span>
                  <span className="text-xs font-mono text-slate-500 block mt-0.5">SKU: {data.sku}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Preço de Venda</span>
                  <span className="text-base font-black text-emerald-700">{formatCurrencyBRL(data.venda)}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Custo: {formatCurrencyBRL(data.custo)}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Margem de Lucro</span>
                  <span className="text-base font-black text-slate-900">
                    {data.lucroPercentual ? `${Number(data.lucroPercentual).toFixed(1)}%` : '0.0%'}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold block mt-0.5">Lucro: {formatCurrencyBRL(data.lucroReais)}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Estoque Físico</span>
                  <span className="text-base font-black text-slate-900">
                    {formatQuantity(data.estoqueAtual, data.unidade || 'UN')}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Mínimo: {formatQuantity(data.estoqueMinimo, data.unidade || 'UN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Classificação Fiscal (NCM) & Unidade</span>
                  <span className="text-xs font-bold text-slate-800 block">NCM: {data.ncm || '0000.00.00'}</span>
                  <span className="text-xs text-slate-600 block mt-0.5">Categoria: {data.categoria || 'Geral'}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Descrição Comercial</span>
                  <p className="text-xs text-slate-700">
                    {data.descricao || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. SERVIÇO */}
          {type === 'servico' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Serviço Cadastrado</span>
                  <span className="text-sm font-black text-slate-900">{data.nome}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Categoria: {data.categoria}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Preço / Honorário</span>
                  <span className="text-base font-black text-emerald-700">{formatCurrencyBRL(data.valor)}</span>
                  <span className="text-xs text-slate-500 block mt-0.5">Tempo Estimado: {data.tempoEstimado || 'Sob consulta'}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Código Municipal / NBS</span>
                  <span className="text-xs font-mono font-bold text-slate-800">{data.codigoServico || '14.01'}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Conforme lista da LC 116/2003</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Discriminação Detalhada do Serviço</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {data.descricao || 'Descrição padrão dos serviços executados para o MEI.'}
                </p>
              </div>
            </div>
          )}

          {/* Rodapé de autenticação */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
            <span>MEI-Simple • Trilha de Auditoria e Conformidade Legal</span>
            <span>Documento oficial para simples conferência</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FichaCadastralModal;
