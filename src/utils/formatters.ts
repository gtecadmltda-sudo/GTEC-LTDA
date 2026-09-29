/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitários centralizados de formatação e mascaramento numérico (MEI-Simple).
 * - Moeda: R$ X.XXX,XX
 * - Quantidades / Pesos: 3 casas decimais padronizadas com Intl.NumberFormat('pt-BR')
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const quantityFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3
});

const standardNumberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Formata um valor numérico para o padrão monetário brasileiro: R$ X.XXX,XX
 */
export function formatCurrencyBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return 'R$ 0,00';
  return currencyFormatter.format(num);
}

/**
 * Formata quantidades e pesos com rigorosamente 3 casas decimais: Ex: 1,500 ou 10,000
 */
export function formatQuantity(value: number | string | null | undefined, unit?: string): string {
  if (value === null || value === undefined || value === '') {
    return unit ? `0,000 ${unit}` : '0,000';
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return unit ? `0,000 ${unit}` : '0,000';
  const formatted = quantityFormatter.format(num);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Formata número com 2 casas decimais sem o símbolo R$
 */
export function formatDecimal(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) return '0,00';
  return standardNumberFormatter.format(num);
}

/**
 * Converte string digitada ou com máscara monetária (Ex: "R$ 1.500,50") de volta para número puro float (1500.50).
 */
export function parseCurrencyInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converte string de quantidade com vírgula para float.
 */
export function parseQuantityInput(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Máscara dinâmica para eventos onChange de inputs monetários.
 * Converte números digitados sequencialmente em formato 'R$ X.XXX,XX'.
 * Exemplo de digitação: "150050" -> "R$ 1.500,50"
 */
export function maskCurrency(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, '');
  if (!digitsOnly) return 'R$ 0,00';
  const numberValue = parseInt(digitsOnly, 10) / 100;
  return formatCurrencyBRL(numberValue);
}

/**
 * Máscara dinâmica para inputs de quantidade com 3 casas decimais.
 * Exemplo de digitação: "1500" -> "1,500"
 */
export function maskQuantity(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, '');
  if (!digitsOnly) return '0,000';
  const numberValue = parseInt(digitsOnly, 10) / 1000;
  return formatQuantity(numberValue);
}

/**
 * Formata CPF ou CNPJ com pontuações canônicas.
 */
export function formatDocument(doc: string): string {
  const clean = doc.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

/**
 * Formata número de telefone brasileiro (fixo ou móvel).
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}
