/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Invoice } from '../types';

export interface FiscalReportOptions {
  invoices: Invoice[];
  filterTitle?: string;
  companyName?: string;
  cnpj?: string;
}

export async function exportFiscalReportToPdf({
  invoices,
  filterTitle = 'Todas as Notas Listadas',
  companyName = 'CARLOS OLIVEIRA MEI',
  cnpj = '30.751.934/0001-30'
}: FiscalReportOptions): Promise<void> {
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('pt-BR');
  const timeStr = currentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fileDate = currentDate.toISOString().split('T')[0];
  const fileName = `Relatorio_Fiscal_${fileDate}.pdf`;

  // Cálculos consolidados
  const totalNotas = invoices.length;
  const nfeInvoices = invoices.filter(i => i.tipo === 'NF-e');
  const nfseInvoices = invoices.filter(i => i.tipo === 'NFS-e');
  
  const totalNfeVal = nfeInvoices.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
  const totalNfseVal = nfseInvoices.reduce((acc, curr) => acc + (curr.valorTotal || 0), 0);
  const valorTotalGeral = totalNfeVal + totalNfseVal;

  const autorizadasCount = invoices.filter(i => i.status === 'PRODUCAO').length;
  const rascunhosCount = invoices.filter(i => i.status === 'RASCUNHO').length;

  // Criar elemento visual temporário fora da tela
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '1px';
  container.style.width = '900px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '36px 40px';
  container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.boxSizing = 'border-box';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.4';

  const rowsHtml = invoices.map((inv, index) => {
    const isNfe = inv.tipo === 'NFE';
    const bgRow = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    const statusBg = inv.status === 'PRODUCAO' 
      ? '#dcfce7; color: #15803d; border: 1px solid #86efac' 
      : inv.status === 'RASCUNHO' 
      ? '#fef3c7; color: #b45309; border: 1px solid #fde68a' 
      : '#dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe';
    const statusLabel = inv.status === 'PRODUCAO' ? 'Autorizada' : inv.status === 'RASCUNHO' ? 'Rascunho' : 'Homologação';

    return `
      <tr style="background-color: ${bgRow}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: bold; font-family: monospace; font-size: 11px; color: #1e293b;">
          ${inv.numero}
        </td>
        <td style="padding: 10px 8px;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 6px; background-color: ${isNfe ? '#eff6ff' : '#faf5ff'}; color: ${isNfe ? '#004AAD' : '#5E17EB'}; border: 1px solid ${isNfe ? '#bfdbfe' : '#e9d5ff'};">
            ${isNfe ? 'NF-e (Prod)' : 'NFS-e (Serv)'}
          </span>
        </td>
        <td style="padding: 10px 8px; font-size: 11px; color: #475569; white-space: nowrap;">
          ${new Date(inv.dataEmissao).toLocaleDateString('pt-BR')}
        </td>
        <td style="padding: 10px 8px; max-width: 220px;">
          <div style="font-weight: bold; font-size: 11px; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${inv.destinatarioNome || inv.cliente || 'Consumidor Final'}
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">
            ${inv.destinatarioDocumento || inv.clienteCnpjCpf || 'Não informado'}
          </div>
        </td>
        <td style="padding: 10px 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; font-size: 9px; font-weight: bold; border-radius: 12px; ${statusBg};">
            ${statusLabel}
          </span>
        </td>
        <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-weight: bold; font-size: 12px; color: #0f172a; white-space: nowrap;">
          R$ ${inv.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div style="border: 2px solid #cbd5e1; border-radius: 16px; padding: 24px; background-color: #ffffff;">
      
      <!-- Cabeçalho Institucional & Fisco -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #004AAD; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="background: linear-gradient(135deg, #004AAD, #5E17EB); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 14px;">
              M
            </div>
            <strong style="font-size: 18px; color: #004AAD; letter-spacing: -0.5px;">MEISimple</strong>
            <span style="background-color: #f1f5f9; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; color: #475569; border: 1px solid #e2e8f0;">
              Módulo Fiscal
            </span>
          </div>
          <h1 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 8px 0 2px 0; text-transform: uppercase;">
            Relatório Fiscal Simplificado
          </h1>
          <p style="font-size: 11px; color: #64748b; margin: 0;">
            Demonstrativo de Documentos Fiscais Eletrônicos (NF-e Modelo 55 / NFS-e Padrão Nacional)
          </p>
        </div>

        <div style="text-align: right; font-size: 11px; color: #475569;">
          <div style="font-weight: bold; color: #0f172a; font-size: 12px;">${companyName}</div>
          <div>CNPJ: <strong style="font-family: monospace;">${cnpj}</strong></div>
          <div style="margin-top: 4px; font-size: 10px; color: #64748b;">
            Emissão: <strong>${dateStr} às ${timeStr}</strong>
          </div>
          <div style="font-size: 10px; color: #004AAD; font-weight: bold;">
            Filtro: ${filterTitle}
          </div>
        </div>
      </div>

      <!-- Métricas e Indicadores Consolidados -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Total de Notas</div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 2px;">
            ${totalNotas}
          </div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
            ${autorizadasCount} autorizadas • ${rascunhosCount} rascunhos
          </div>
        </div>

        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #004AAD;">NF-e (Produtos)</div>
          <div style="font-size: 16px; font-weight: 800; color: #004AAD; font-family: monospace; margin-top: 2px;">
            R$ ${totalNfeVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style="font-size: 9px; color: #1e40af; margin-top: 2px;">
            ${nfeInvoices.length} nota(s) comercial(is)
          </div>
        </div>

        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 12px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #5E17EB;">NFS-e (Serviços)</div>
          <div style="font-size: 16px; font-weight: 800; color: #5E17EB; font-family: monospace; margin-top: 2px;">
            R$ ${totalNfseVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style="font-size: 9px; color: #6b21a8; margin-top: 2px;">
            ${nfseInvoices.length} nota(s) de serviço
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #004AAD, #00367d); color: #ffffff; border-radius: 12px; padding: 12px; text-align: right;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #93c5fd;">Total Consolidado</div>
          <div style="font-size: 18px; font-weight: 800; color: #ffffff; font-family: monospace; margin-top: 2px;">
            R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style="font-size: 9px; color: #bfdbfe; margin-top: 2px;">
            Faturamento bruto do período
          </div>
        </div>

      </div>

      <!-- Tabela de Notas Fiscais -->
      <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 10px 8px;">Nº Nota</th>
              <th style="padding: 10px 8px;">Tipo</th>
              <th style="padding: 10px 8px;">Emissão</th>
              <th style="padding: 10px 8px;">Destinatário / CPF-CNPJ</th>
              <th style="padding: 10px 8px; text-align: center;">Status</th>
              <th style="padding: 10px 8px; text-align: right;">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `
              <tr>
                <td colspan="6" style="padding: 24px; text-align: center; color: #64748b; font-size: 12px;">
                  Nenhum registro de nota fiscal encontrado para o critério selecionado.
                </td>
              </tr>
            `}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; border-top: 2px solid #cbd5e1; font-weight: bold;">
              <td colspan="5" style="padding: 10px 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #334155;">
                Total das ${totalNotas} Notas Listadas:
              </td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; font-size: 13px; color: #004AAD;">
                R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Rodapé Institucional e Legal MEI -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b;">
        <div>
          <strong>MEISimple Gestão Integrada</strong> • Regime Tributário MEI (Simples Nacional) • Isento de retenção de ISSQN / ICMS na fonte.
        </div>
        <div style="font-family: monospace;">
          Documento gerado eletronicamente em ${dateStr}
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 960
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png');
    const margin = 10;
    const printableWidth = pageWidth - (margin * 2);
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * printableWidth) / imgProps.width;

    if (imgHeight > pageHeight - (margin * 2)) {
      const scaledHeight = pageHeight - (margin * 2);
      const scaledWidth = (imgProps.width * scaledHeight) / imgProps.height;
      const xOffset = (pageWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, margin, scaledWidth, scaledHeight, '', 'FAST');
    } else {
      pdf.addImage(imgData, 'PNG', margin, margin, printableWidth, imgHeight, '', 'FAST');
    }

    pdf.save(fileName);
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}
