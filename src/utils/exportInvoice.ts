/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Invoice } from '../types';
import { getOfficialConsultationUrl } from '../components/FiscalQRCode';

export interface ExportOptions {
  format: 'png' | 'pdf';
  orientation?: 'portrait' | 'landscape';
  element?: HTMLElement | null;
  invoice: Invoice;
}

export async function exportInvoiceToPngOrPdf({
  format,
  orientation = 'portrait',
  element,
  invoice
}: ExportOptions): Promise<void> {
  const isNFe = invoice.tipo === 'NFE';
  const prefix = isNFe ? 'DANFE_NFe' : 'DANFSE_NFSe';
  const fileName = `${prefix}_${invoice.numero}_${orientation}`;

  let targetEl: HTMLElement | null = null;
  let createdTemp = false;

  // Se um elemento foi passado e está no DOM, tenta usar; se não ou se falhar, usa o gerador offscreen seguro
  if (element && document.body.contains(element)) {
    targetEl = element;
  } else {
    createdTemp = true;
    targetEl = await createOffscreenInvoiceElement(invoice, orientation);
    document.body.appendChild(targetEl);
  }

  try {
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(targetEl, {
        scale: 2, // Resolução HD (300 DPI)
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: orientation === 'landscape' ? 1200 : 900
      });
    } catch (renderErr) {
      console.warn('Erro ao renderizar elemento fornecido, executando fallback offscreen:', renderErr);
      if (!createdTemp) {
        createdTemp = true;
        targetEl = await createOffscreenInvoiceElement(invoice, orientation);
        document.body.appendChild(targetEl);
        canvas = await html2canvas(targetEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: orientation === 'landscape' ? 1200 : 900
        });
      } else {
        throw renderErr;
      }
    }

    if (format === 'png') {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // PDF export via jsPDF com Marca d'Água Transversal
      const isLandscape = orientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL('image/png');
      
      const margin = 8;
      const printableWidth = pageWidth - (margin * 2);
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * printableWidth) / imgProps.width;

      if (imgHeight > pageHeight - (margin * 2)) {
        // Ajusta proporcionalmente dentro dos limites da página A4
        const scaledHeight = pageHeight - (margin * 2);
        const scaledWidth = (imgProps.width * scaledHeight) / imgProps.height;
        const xOffset = (pageWidth - scaledWidth) / 2;
        pdf.addImage(imgData, 'PNG', xOffset, margin, scaledWidth, scaledHeight, '', 'FAST');
      } else {
        pdf.addImage(imgData, 'PNG', margin, margin, printableWidth, imgHeight, '', 'FAST');
      }

      // Adiciona Marca d'Água Transversal Obrigatória no PDF
      try {
        pdf.saveGraphicsState();
        if (typeof (pdf as any).setGState === 'function' && typeof (pdf as any).GState === 'function') {
          pdf.setGState(new (pdf as any).GState({ opacity: 0.28 }));
        }
        pdf.setTextColor(220, 38, 38); // Vermelho de Aviso
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(isLandscape ? 17 : 14);
        
        const watermarkText = "DOCUMENTO GERADO EM AMBIENTE DE TESTE, PORTANTO SEM VALOR FISCAL";
        pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: isLandscape ? 28 : 42
        });
        pdf.restoreGraphicsState();
      } catch (watermarkErr) {
        console.warn('Marca d\'água nativa do PDF aplicada via layout visual:', watermarkErr);
      }

      pdf.save(`${fileName}.pdf`);
    }
  } finally {
    if (createdTemp && targetEl && targetEl.parentNode) {
      targetEl.parentNode.removeChild(targetEl);
    }
  }
}

async function createOffscreenInvoiceElement(invoice: Invoice, orientation: 'portrait' | 'landscape'): Promise<HTMLElement> {
  const isNFe = invoice.tipo === 'NFE';
  const chaveAcesso = isNFe 
    ? `3526 0630 7519 3400 0130 5500 1000 ${invoice.numero} 1004 8832 91`
    : `3526063075193400013056001000${invoice.numero}`;

  const consultUrl = getOfficialConsultationUrl(chaveAcesso, invoice.tipo as 'NFE' | 'NFSE');
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(consultUrl, {
      margin: 1,
      width: 200,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (err) {
    console.error('Error rendering QR code for export:', err);
  }

  const container = document.createElement('div');
  // Posicionamento visível na viewport porém com z-index negativo e sem interceptar eventos (100% compatível com html2canvas)
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.zIndex = '-9999';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';
  container.style.visibility = 'visible';
  container.style.width = orientation === 'landscape' ? '1100px' : '820px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.padding = '32px';
  container.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.4';
  container.style.boxSizing = 'border-box';
  container.style.borderRadius = '16px';
  container.style.border = '2px solid #cbd5e1';
  container.style.position = 'relative';

  const watermarkHtml = `
    <div style="position: absolute; top: 48%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 19px; font-weight: 900; color: rgba(220, 38, 38, 0.22); text-transform: uppercase; letter-spacing: 1.5px; text-align: center; pointer-events: none; border: 3px dashed rgba(220, 38, 38, 0.3); padding: 14px 28px; border-radius: 12px; width: 88%; z-index: 99; box-sizing: border-box;">
      DOCUMENTO GERADO EM AMBIENTE DE TESTE, PORTANTO SEM VALOR FISCAL
    </div>
  `;

  if (isNFe) {
    container.innerHTML = `
      ${watermarkHtml}
      <div style="margin-bottom: 16px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px; background-color: #f8fafc; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 11px; color: #334155;">
          Recebemos de <strong>CARLOS OLIVEIRA MEI</strong> os produtos constantes da Nota Fiscal Eletrônica indicada abaixo.
          <div style="margin-top: 6px; font-size: 10px; color: #64748b; font-family: monospace;">
            Data de Recebimento: ____/____/________ &nbsp;&nbsp;&nbsp;&nbsp; Assinatura: _____________________________
          </div>
        </div>
        <div style="text-align: right; border-left: 1px solid #cbd5e1; padding-left: 12px;">
          <strong style="font-size: 13px;">NF-e Nº ${invoice.numero}</strong><br/>
          <span style="font-size: 10px; color: #64748b;">SÉRIE: 1</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px;">
          <div style="font-size: 10px; font-weight: bold; color: #004AAD; text-transform: uppercase; margin-bottom: 4px;">Identificação do Emitente</div>
          <strong style="font-size: 13px; color: #0f172a;">CARLOS OLIVEIRA MEI</strong>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">Marcenaria & Móveis Planejados</div>
          <div style="font-size: 10px; color: #64748b;">Rua Bento de Souza, 40 - Vila Nova - São Paulo / SP</div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 10px; font-family: monospace;">
            CNPJ: <strong>30.751.934/0001-30</strong>
          </div>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; background-color: #f8fafc; text-align: center;">
          <strong style="font-size: 14px; text-transform: uppercase;">DANFE</strong>
          <div style="font-size: 10px; color: #475569;">Doc. Auxiliar da Nota Fiscal Eletrônica</div>
          <div style="display: inline-block; margin: 8px 0; padding: 4px 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: bold; font-family: monospace; font-size: 11px;">
            1 - SAÍDA [ 1 ]
          </div>
          <div style="font-size: 13px; font-weight: bold;">Nº ${invoice.numero}</div>
          <div style="font-size: 10px; color: #64748b;">Série 001 • Folha 1/1</div>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; align-items: center;">
          <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">Controle do Fisco (SEFAZ)</div>
          ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width: 54px; height: 54px; margin: 4px auto; border-radius: 4px;" />` : ''}
          <div style="font-size: 8px; color: #64748b;">CHAVE DE ACESSO:</div>
          <strong style="font-size: 8px; font-family: monospace; word-break: break-all;">${chaveAcesso}</strong>
        </div>
      </div>

      <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
        <div style="font-size: 10px; font-weight: bold; color: #004AAD; text-transform: uppercase; margin-bottom: 6px;">Destinatário / Remetente</div>
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px;">
          <div><span style="color: #64748b; font-size: 10px;">NOME / RAZÃO SOCIAL:</span><br/><strong>${invoice.destinatarioNome || invoice.cliente || 'MARIA SILVA SANTOS'}</strong></div>
          <div><span style="color: #64748b; font-size: 10px;">CNPJ / CPF:</span><br/><strong style="font-family: monospace;">${invoice.destinatarioDocumento || invoice.clienteCnpjCpf || '123.456.789-00'}</strong></div>
          <div><span style="color: #64748b; font-size: 10px;">DATA EMISSÃO:</span><br/><strong style="font-family: monospace;">${new Date(invoice.dataEmissao).toLocaleDateString('pt-BR')}</strong></div>
        </div>
      </div>

      <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
        <div style="background: #f1f5f9; padding: 8px 12px; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #334155;">
          Dados do Produto / Mercadoria
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1; background-color: #f8fafc; font-size: 10px; color: #475569;">
              <th style="padding: 8px 12px;">CÓDIGO</th>
              <th style="padding: 8px 12px;">DESCRIÇÃO DO PRODUTO</th>
              <th style="padding: 8px 12px;">NCM/SH</th>
              <th style="padding: 8px 12px;">CFOP</th>
              <th style="padding: 8px 12px;">UN</th>
              <th style="padding: 8px 12px;">QTD</th>
              <th style="padding: 8px 12px; text-align: right;">VALOR UNIT.</th>
              <th style="padding: 8px 12px; text-align: right;">VALOR TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 12px; font-family: monospace;">PRD-001</td>
              <td style="padding: 10px 12px;"><strong>${invoice.discriminacao || 'Mesa de Jantar em Madeira Maciça 6 Lugares com Acabamento Verniz Acetinado'}</strong></td>
              <td style="padding: 10px 12px; font-family: monospace;">9403.60.00</td>
              <td style="padding: 10px 12px; font-family: monospace;">5.102</td>
              <td style="padding: 10px 12px;">UN</td>
              <td style="padding: 10px 12px; font-family: monospace;">1</td>
              <td style="padding: 10px 12px; text-align: right; font-family: monospace;">R$ ${invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-weight: bold;">R$ ${invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; background-color: #f8fafc; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <div>
            <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">Informações Complementares / MEI</div>
            <p style="font-size: 10px; color: #334155; margin-top: 4px;">
              Documento emitido por ME - Optante pelo Simples Nacional / MEI. Não gera direito a crédito fiscal de IPI e ICMS. Emissão autorizada sob regime especial.
            </p>
          </div>
          ${qrCodeDataUrl ? `
            <div style="text-align: center; border-left: 1px solid #cbd5e1; padding-left: 12px; flex-shrink: 0;">
              <img src="${qrCodeDataUrl}" style="width: 58px; height: 58px; border-radius: 4px;" />
              <div style="font-size: 8px; color: #64748b; font-weight: bold; margin-top: 2px;">Consulta SEFAZ</div>
            </div>
          ` : ''}
        </div>
        <div style="border: 2px solid #004AAD; border-radius: 12px; padding: 12px; text-align: right; background-color: #f0f7ff;">
          <div style="font-size: 11px; color: #004AAD; font-weight: bold;">VALOR TOTAL DA NOTA:</div>
          <strong style="font-size: 20px; color: #004AAD; font-family: monospace;">
            R$ ${invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      ${watermarkHtml}
      <div style="border: 2px solid #5E17EB; border-radius: 12px; padding: 16px; margin-bottom: 16px; background-color: #faf5ff;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 10px; font-weight: bold; color: #5E17EB; text-transform: uppercase;">Portal Nacional da Nota Fiscal de Serviço Eletrônica</div>
            <strong style="font-size: 18px; color: #3b0764;">DANFSE - Documento Auxiliar da NFS-e</strong>
            <div style="font-size: 11px; color: #6b21a8;">Padrão Nacional MEI • Receita Federal do Brasil & Município</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: #6b21a8;">NÚMERO DA NOTA</div>
            <strong style="font-size: 16px; font-family: monospace; color: #5E17EB;">${invoice.numero}</strong>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px;">
          <div style="font-size: 10px; font-weight: bold; color: #5E17EB; text-transform: uppercase; margin-bottom: 4px;">Prestador de Serviços (MEI)</div>
          <strong style="font-size: 13px;">CARLOS OLIVEIRA MEI</strong>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">CNPJ: 30.751.934/0001-30</div>
          <div style="font-size: 10px; color: #64748b;">Inscrição Municipal: 9.876.543-2 • São Paulo/SP</div>
        </div>

        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px;">
          <div style="font-size: 10px; font-weight: bold; color: #5E17EB; text-transform: uppercase; margin-bottom: 4px;">Tomador do Serviço</div>
          <strong style="font-size: 13px;">${invoice.destinatarioNome || invoice.cliente || 'MARIA SILVA SANTOS'}</strong>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">CPF/CNPJ: ${invoice.destinatarioDocumento || invoice.clienteCnpjCpf || '123.456.789-00'}</div>
          <div style="font-size: 10px; color: #64748b;">Ambiente Nacional Integrado Gov.br</div>
        </div>
      </div>

      <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
        <div style="font-size: 11px; font-weight: bold; color: #334155; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          Discriminação dos Serviços Prestados
        </div>
        <p style="font-size: 12px; color: #1e293b; line-height: 1.6;">
          ${invoice.discriminacao || 'Serviço de Restauração e Montagem de Móveis Residenciais e Comerciais'}
        </p>
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #64748b;">
          <span>Item LC 116/2003: <strong>14.01 - Manutenção / Carpintaria</strong></span>
          <span>Local de Prestação: <strong>São Paulo - SP</strong></span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; background-color: #f8fafc; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <div>
            <div style="font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase;">Tributação & Autenticidade</div>
            <div style="font-size: 10px; color: #334155; margin-top: 4px;">
              Código de Verificação: <strong style="font-family: monospace;">A8F2-7E91-BC03-4D55</strong><br/>
              Tributado no MEI via DAS mensal simplificado. Sem retenção de ISSQN na fonte.
            </div>
          </div>
          ${qrCodeDataUrl ? `
            <div style="text-align: center; border-left: 1px solid #cbd5e1; padding-left: 12px; flex-shrink: 0;">
              <img src="${qrCodeDataUrl}" style="width: 58px; height: 58px; border-radius: 4px;" />
              <div style="font-size: 8px; color: #64748b; font-weight: bold; margin-top: 2px;">Gov.br Autenticidade</div>
            </div>
          ` : ''}
        </div>
        <div style="border: 2px solid #5E17EB; border-radius: 12px; padding: 12px; text-align: right; background-color: #faf5ff;">
          <div style="font-size: 11px; color: #5E17EB; font-weight: bold;">VALOR LÍQUIDO NFS-e:</div>
          <strong style="font-size: 20px; color: #5E17EB; font-family: monospace;">
            R$ ${invoice.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>
    `;
  }

  return container;
}

