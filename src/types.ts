/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'auxiliar' | 'contador' | 'Sócio' | 'Funcionário' | 'Contador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: {
    dashboard: boolean;
    cadastros: boolean;
    estoque: boolean;
    financeiro: boolean;
    notas: boolean;
    relatorios: boolean;
    configuracoes: boolean;
  };
  ativo?: boolean;
  lgpdAceito?: boolean;
  lgpdDataConsentimento?: string;
  document?: string;
  cargo?: string;
  dataAdmissao?: string;
  status?: string;
  foto?: string;
}

export interface Client {
  id: string;
  nome: string;
  documento: string; // CPF or CNPJ
  tipo: 'PF' | 'PJ';
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  adimplente: boolean;
  historicoCompras: {
    data: string;
    valor: number;
    descricao: string;
  }[];
}

export interface Supplier {
  id: string;
  razaoSocial: string;
  cnpj: string;
  contatoNome: string;
  telefone: string;
  email: string;
  condicoesPagamento: string;
  historicoPedidos: {
    data: string;
    valor: number;
    status: 'Pendente' | 'Recebido' | 'Cancelado';
  }[];
}

export interface Employee {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  remuneracao: number; // Max alert constraints
  dataAdmissao: string;
  documentacao: string;
}

export interface Product {
  id: string;
  sku: string;
  nome: string;
  descricao: string;
  ncm: string;
  unidade: 'UN' | 'KG' | 'L' | 'M' | 'PCT';
  custo: number;
  venda: number;
  lucroReais: number;
  lucroPercentual: number;
  categoria: string;
  fornecedorId: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  imagemUrl?: string;
}

export interface Service {
  id: string;
  nome: string;
  descricao: string;
  valor: number;
  categoria: string;
  tempoEstimado: string; // e.g. "2 horas"
  codigoServico: string; // NBS / municipal
}

export interface FinancialCategory {
  id: string;
  codigo: string; // e.g., "1.1", "2.1.2"
  nome: string;
  tipo: 'RECEITA' | 'DESPESA' | 'Receita' | 'Despesa';
  centroCusto: string;
  ativa: boolean;
  canDelete: boolean;
}

export interface FinancialTransaction {
  id: string;
  data: string;
  dataVencimento: string;
  tipo: 'RECEITA' | 'DESPESA' | 'Receita' | 'Despesa';
  categoriaId: string; // links to FinancialCategory.id
  descricao: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO' | 'Pendente' | 'Pago' | 'Vencido' | 'Atrasado' | 'Cancelado' | 'Renegociado' | 'Protestado/Serasa' | 'Prejuízo';
  comprovanteUrl?: string;
  comprovanteNome?: string;
  importado?: boolean; // via OFX / CSV
}

export interface StockMovement {
  id: string;
  productId: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'Entrada' | 'Saída';
  quantidade: number;
  data: string;
  motivo: string;
  responsavel: string;
}

export interface Invoice {
  id: string;
  numero: string;
  tipo: 'NFE' | 'NFSE' | 'NF-e' | 'NFS-e';
  destinatarioNome: string;
  destinatarioDocumento: string;
  valorTotal: number;
  dataEmissao: string;
  status: 'HOMOLOGACAO' | 'PRODUCAO' | 'CANCELADA' | 'RASCUNHO' | 'Homologação' | 'Produção' | 'Cancelada' | 'Rascunho';
  xmlSimulado: string;
  xmlVisualizer?: boolean;
  cliente?: string;
  clienteCnpjCpf?: string;
  discriminacao?: string;
}

export interface DASPayment {
  id: string;
  periodoReferencia: string; // "MM/AAAA"
  dataVencimento: string;
  valor: number;
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO' | 'Pago' | 'Pendente' | 'Atrasado';
  dataPagamento?: string;
  boletoUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  modulo: string;
  acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'EXPORTACAO' | 'LOGIN' | 'ALTERACAO_SENHA' | 'CONCURSABILIDADE' | 'Cadastro' | 'Edição' | 'Exclusão' | 'Exportação' | 'Login' | 'Alteração de senha' | 'Aalteração de senha' | 'Concursabilidade' | 'Movimentação Fiscal' | 'Permissão de usuários' | 'Movimentação Financeira';
  descricao: string;
  diffAnterior?: string; // stringified JSON representing previous state
  diffNovo?: string;     // stringified JSON representing new state
  ip: string;
}

export interface OnboardingStep {
  target: string; // selector
  content: string;
  title: string;
}

export interface Goal {
  id: string;
  tipo: 'FATURAMENTO_ANUAL' | 'FATURAMENTO_MENSAL' | 'VENDA_PRODUTO' | 'VENDA_SERVICO' | 'Faturamento Anual' | 'Faturamento Mensal' | 'Venda de Produto' | 'Venda de Serviço';
  targetId?: string; // ID do produto ou serviço correspondente
  targetName?: string; // Nome do produto ou serviço
  valorAlvo: number;
  periodo: string; // "2026" ou "09/2026"
  unidade: 'REAIS' | 'UNIDADES' | 'Reais' | 'Unidades';
}

export interface CustomReportConfig {
  id: string;
  nome: string;
  descricao: string;
  tipoFonte: 'TRANSACOES' | 'CLIENTES' | 'NOTAS_FISCAIS' | 'ESTOQUE' | 'Transações' | 'Clientes' | 'Notas Fiscais' | 'Estoque';
  campos: string[];
  filtros: {
    dataInicio?: string;
    dataFim?: string;
    tipo?: string;
    categoriaId?: string;
    categoria?: string;
    status?: string;
    clienteId?: string;
    adimplente?: string;
    minValor?: number;
    maxValor?: number;
    estoqueBaixo?: boolean;
  };
  agrupamento: 'nenhum' | 'categoria' | 'tipo' | 'status' | 'data_mes' | 'data/mês' | 'cliente' | 'adimplente';
  ordenador: string; // designator like field_asc, field_desc
  userId?: string;
  createdAt: string;
}
