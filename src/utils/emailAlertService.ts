/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Serviço Real de Envio de E-mails de Alerta via EmailJS (MEI-Simple).
 * Permite disparo assíncrono de notificações de estoque crítico para o e-mail cadastrado.
 * Os campos de chaves estão preparados para preenchimento posterior pelo usuário.
 */

// Credenciais do EmailJS (insira suas credenciais da conta EmailJS aqui)
export const EMAILJS_SERVICE_ID = '';
export const EMAILJS_TEMPLATE_ID = '';
export const EMAILJS_PUBLIC_KEY = ''; // Deixe os campos de PUBLIC_KEY limpos para eu inserir depois

export interface StockAlertEmailPayload {
  toEmail: string;
  productName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  companyName?: string;
  operatorName?: string;
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  simulated?: boolean;
}

/**
 * Constrói o HTML do template de notificação financeira e de estoque
 */
export function buildStockAlertHtml(payload: StockAlertEmailPayload): string {
  const { toEmail: _to, productName, currentStock, minStock, unit, companyName, operatorName } = payload;
  const now = new Date().toLocaleString('pt-BR');

  return `
    <div style="font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: #0f172a; padding: 20px 24px; border-bottom: 2px solid #2dd683;">
          <h1 style="margin: 0; font-size: 18px; color: #ffffff; font-weight: 800; letter-spacing: -0.02em;">
            MEI<span style="color: #2dd683;">-Simple</span> • Alerta de Estoque Crítico
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
            Sistema de Gestão Descomplicada para o Microempreendedor
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 24px;">
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: #e11d48;">
              ⚠️ Nível Mínimo de Segurança Atingido!
            </p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #475569; line-height: 1.5;">
              O produto <strong>"${productName}"</strong> atingiu o ponto crítico configurado em seu inventário operacional.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Produto:</td>
                <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a;">${productName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Saldo Atual em Estoque:</td>
                <td style="padding: 8px 0; font-weight: 800; font-family: monospace; text-align: right; color: #e11d48;">
                  ${currentStock.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ${unit}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Limite Mínimo de Alerta:</td>
                <td style="padding: 8px 0; font-weight: 700; font-family: monospace; text-align: right; color: #0f172a;">
                  ${minStock.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} ${unit}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Empresa / MEI:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a;">${companyName || 'MEI Cadastrado'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">Operador / Responsável:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a;">${operatorName || 'Carlos Oliveira'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Data e Hora da Apuração:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #0f172a;">${now}</td>
              </tr>
            </tbody>
          </table>

          <div style="background: #f8fafc; border-radius: 10px; padding: 14px; font-size: 11px; color: #64748b; line-height: 1.4;">
            💡 <strong>Dica de Giro MEI:</strong> Programe uma nova ordem de compra ou reposição com seus fornecedores cadastrados para evitar quebras de pedidos e perda de faturamento.
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          Enviado automaticamente pelo MEI-Simple • Gestão Financeira, Estoque e DAS
        </div>
      </div>
    </div>
  `;
}

/**
 * Dispara e-mail real utilizando a API REST oficial do EmailJS.
 * Se a PUBLIC_KEY estiver vazia, opera em modo de prontidão registrando os parâmetros exatos.
 */
export async function sendStockAlertEmail(payload: StockAlertEmailPayload): Promise<EmailSendResult> {
  const { toEmail, productName, currentStock, minStock, unit, companyName, operatorName } = payload;
  const now = new Date().toLocaleString('pt-BR');

  // Verifica chaves salvas localmente caso o usuário as tenha preenchido via interface ou código
  const publicKey = EMAILJS_PUBLIC_KEY || (typeof localStorage !== 'undefined' ? localStorage.getItem('MEISIMPLE_EMAILJS_PUBLIC_KEY') || '' : '');
  const serviceId = EMAILJS_SERVICE_ID || (typeof localStorage !== 'undefined' ? localStorage.getItem('MEISIMPLE_EMAILJS_SERVICE_ID') || 'service_meisimple' : 'service_meisimple');
  const templateId = EMAILJS_TEMPLATE_ID || (typeof localStorage !== 'undefined' ? localStorage.getItem('MEISIMPLE_EMAILJS_TEMPLATE_ID') || 'template_stock_alert' : 'template_stock_alert');

  if (!publicKey) {
    console.info(
      `%c[EmailJS MEI-Simple]%c Estrutura de e-mail pronta. Aguardando inserção da PUBLIC_KEY para envio em rede.\nDestinatário: ${toEmail}\nItem: ${productName} (Saldo: ${currentStock} ${unit}, Mínimo: ${minStock} ${unit})`,
      'background: #0f172a; color: #2dd683; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'color: #64748b;'
    );
    return {
      success: true,
      simulated: true,
      message: `Pronto para envio. Insira sua PUBLIC_KEY do EmailJS para despacho automático para ${toEmail}.`
    };
  }

  try {
    const htmlTemplate = buildStockAlertHtml(payload);

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: toEmail,
          product_name: productName,
          current_stock: currentStock.toLocaleString('pt-BR', { minimumFractionDigits: 3 }),
          min_stock: minStock.toLocaleString('pt-BR', { minimumFractionDigits: 3 }),
          unit: unit,
          company_name: companyName || 'MEI-Simple',
          operator_name: operatorName || 'Operador',
          timestamp: now,
          html_content: htmlTemplate
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[EmailJS] Falha na resposta da API:', response.status, errText);
      return {
        success: false,
        message: `Erro no servidor EmailJS (${response.status}): ${errText}`
      };
    }

    return {
      success: true,
      simulated: false,
      message: `E-mail de alerta disparado com sucesso para ${toEmail}!`
    };
  } catch (error: any) {
    console.error('[EmailJS] Exceção na requisição:', error);
    return {
      success: false,
      message: error?.message || 'Falha na conexão com a API do EmailJS.'
    };
  }
}
