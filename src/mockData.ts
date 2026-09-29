/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Client,
  Supplier,
  Employee,
  Product,
  Service,
  FinancialCategory,
  FinancialTransaction,
  StockMovement,
  Invoice,
  DASPayment,
  AuditLog,
  User,
  OnboardingStep
} from './types';

export const USER_ROLES: User[] = [
  {
    id: 'usr-1',
    name: '39.527.169 GEOVANE PEREIRA DA SILVA',
    email: 'geovanefundador@meisimple.com.br',
    role: 'admin',
    permissions: {
      dashboard: true,
      cadastros: true,
      estoque: true,
      financeiro: true,
      notas: true,
      relatorios: true,
      configuracoes: true
    }
  },
  {
    id: 'usr-2',
    name: 'Gustavo',
    email: 'gustavo.aux@meisimple.com.br',
    role: 'auxiliar',
    permissions: {
      dashboard: true,
      cadastros: true,
      estoque: true,
      financeiro: false,
      notas: true,
      relatorios: false,
      configuracoes: false
    }
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    nome: 'Supermercado Nova Esperança Ltda',
    documento: '43.201.890/0001-34',
    tipo: 'PJ',
    cep: '01001-000',
    logradouro: 'Praça da Sé, 110',
    bairro: 'Sé',
    cidade: 'São Paulo',
    uf: 'SP',
    telefone: '(11) 98765-4321',
    email: 'financeiro@novaesperanca.com',
    adimplente: true,
    historicoCompras: [
      { data: '2026-05-10', valor: 1500, descricao: 'Lote de Embalagens e Suportes de Madeira' },
      { data: '2026-06-02', valor: 2200, descricao: 'Serviço de Manutenção Preventiva de Gôndolas' }
    ]
  },
  {
    id: 'cli-2',
    nome: 'Mariana de Souza Menezes',
    documento: '215.489.308-41',
    tipo: 'PF',
    cep: '20040-002',
    logradouro: 'Avenida Rio Branco, 156',
    bairro: 'Centro',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    telefone: '(21) 99888-7766',
    email: 'mariana.souza@gmail.com',
    adimplente: true,
    historicoCompras: [
      { data: '2026-04-12', valor: 450, descricao: 'Conjunto de Organizadores Personalizados' }
    ]
  },
  {
    id: 'cli-3',
    nome: 'Reis & Associados Consultoria',
    documento: '12.345.678/0001-90',
    tipo: 'PJ',
    cep: '30110-002',
    logradouro: 'Avenida Afonso Pena, 1200',
    bairro: 'Centro',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    telefone: '(31) 3255-9000',
    email: 'contato@reisconsultoria.com.br',
    adimplente: false,
    historicoCompras: [
      { data: '2026-03-01', valor: 3500, descricao: 'Desenvolvimento de Logotipos e Identidade Visual' }
    ]
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'for-1',
    razaoSocial: 'Madeireira Pinus Soluções Florestais Ltda',
    cnpj: '09.876.543/0001-21',
    contatoNome: 'Roberto Pinheiro',
    telefone: '(41) 3344-5566',
    email: 'compras@pinussoluces.com.br',
    condicoesPagamento: 'Faturado 30 dias',
    historicoPedidos: [
      { data: '2026-05-02', valor: 1800, status: 'Recebido' },
      { data: '2026-06-10', valor: 1200, status: 'Pendente' }
    ]
  },
  {
    id: 'for-2',
    razaoSocial: 'Distribuidora Global Polímeros S/A',
    cnpj: '11.222.333/0001-44',
    contatoNome: 'Juliana Castro',
    telefone: '(11) 4004-9890',
    email: 'vendas@globalpolimeros.com',
    condicoesPagamento: 'À vista via Pix',
    historicoPedidos: [
      { data: '2026-04-15', valor: 3400, status: 'Recebido' }
    ]
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    nome: 'Lucas Gabriel Albuquerque',
    cpf: '450.392.108-99',
    cargo: 'Auxiliar de Oficina Geral',
    remuneracao: 1620.00, // Salário Mínimo Nacional (2024+)
    dataAdmissao: '2025-02-10',
    documentacao: 'PIS/PASEP: 123.45678.90-1, CTPS nº 987654 Serie 001-SP'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'ORG-WD-40',
    nome: 'Organizador de Madeira Pinus 40cm',
    descricao: 'Suporte organizador prático feito em madeira de pinus de reflorestamento, lixado e com acabamento em seladora.',
    ncm: '4421.99.00', // Outras obras de madeira
    unidade: 'UN',
    custo: 18.50,
    venda: 45.00,
    lucroReais: 26.50,
    lucroPercentual: 143.24,
    categoria: 'Organizadores',
    fornecedorId: 'for-1',
    estoqueAtual: 35,
    estoqueMinimo: 10,
    imagemUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'prod-2',
    sku: 'CAB-MT-10',
    nome: 'Cabideiro Industrial Ferro & Madeira',
    descricao: 'Cabideiro modular com estrutura de ferro com pintura eletrostática preta e prateleiras de madeira rústica.',
    ncm: '7326.90.90', // Outros artefatos de ferro/aço
    unidade: 'UN',
    custo: 55.00,
    venda: 129.90,
    lucroReais: 74.90,
    lucroPercentual: 136.18,
    categoria: 'Móveis Rústicos',
    fornecedorId: 'for-1',
    estoqueAtual: 4,
    estoqueMinimo: 5, // Estoque crítico!
    imagemUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=400&auto=format&fit=crop'
  },
  {
    id: 'prod-3',
    sku: 'SUP-LV-15',
    nome: 'Suporte Invisível de Aço para Prateleiras',
    descricao: 'Haste metálica de ultra-resistência para fixação de prateleiras suspensas, fácil instalação.',
    ncm: '8302.41.00', // Guarnições, ferragens para edifícios
    unidade: 'PCT',
    custo: 7.20,
    venda: 19.90,
    lucroReais: 12.70,
    lucroPercentual: 176.39,
    categoria: 'Ferragens',
    fornecedorId: 'for-2',
    estoqueAtual: 50,
    estoqueMinimo: 15,
    imagemUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=400&auto=format&fit=crop'
  }
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'serv-1',
    nome: 'Mão de Obra de Instalação de Prateleiras',
    descricao: 'Serviço residencial ou comercial de instalação de suportes e fixação de prateleiras fornecidas pelo cliente ou compradas na oficina.',
    valor: 150.00,
    categoria: 'Montagem & Instalação',
    tempoEstimado: '1.5 horas',
    codigoServico: '14.06' // Serviços de instalação e montagem de móveis
  },
  {
    id: 'serv-2',
    nome: 'Restauração de Móveis de Madeira Maciça',
    descricao: 'Serviço sob orçamento que inclui lixamento térmico, tratamento contra pragas, aplicação de massa de correção, verniz e seladoras.',
    valor: 450.00,
    categoria: 'Marcenaria & Restauro',
    tempoEstimado: '6 horas',
    codigoServico: '14.05' // Serviços de restauração, recondicionamento e pintura
  },
  {
    id: 'serv-3',
    nome: 'Consultoria de Design de Interiores Comerciais',
    descricao: 'Desenvolvimento de plantas esquemáticas 3D e aconselhamento de aproveitamento visual com mobiliários modulares e sob medida.',
    valor: 1200.00,
    categoria: 'Consultoria Técnica',
    tempoEstimado: '12 horas',
    codigoServico: '07.03' // Projetos de arquitetura, urbanismo e design de interiores
  }
];

export const PRE_STRUCTURED_CHART_OF_ACCOUNTS: FinancialCategory[] = [
  // RECEITAS (Grupo 1)
  { id: 'cat-r1', codigo: '1.1', nome: 'Venda de Mercadorias (Comércio)', tipo: 'RECEITA', centroCusto: 'Operacional', ativa: true, canDelete: false },
  { id: 'cat-r2', codigo: '1.2', nome: 'Prestação de Serviços (NFS-e)', tipo: 'RECEITA', centroCusto: 'Operacional', ativa: true, canDelete: false },
  { id: 'cat-r3', codigo: '1.3', nome: 'Rendimentos de Aplicação', tipo: 'RECEITA', centroCusto: 'Financeiro', ativa: true, canDelete: true },
  { id: 'cat-r4', codigo: '1.9', nome: 'Outras receitas extraordinárias', tipo: 'RECEITA', centroCusto: 'Financeiro', ativa: true, canDelete: true },

  // DESPESAS (Grupo 2)
  { id: 'cat-d1', codigo: '2.1', nome: 'Compra de Estoque / Matéria-prima', tipo: 'DESPESA', centroCusto: 'Custo de Venda (CMV)', ativa: true, canDelete: false },
  { id: 'cat-d2', codigo: '2.2', nome: 'Pagamento de Funcionário CLT', tipo: 'DESPESA', centroCusto: 'Recursos Humanos', ativa: true, canDelete: false },
  { id: 'cat-d3', codigo: '2.3', nome: 'Tarifa Mensal MEI DAS', tipo: 'DESPESA', centroCusto: 'Tributário', ativa: true, canDelete: false },
  { id: 'cat-d4', codigo: '2.4', nome: 'Aluguel do Espaço Comercial', tipo: 'DESPESA', centroCusto: 'Administrativo', ativa: true, canDelete: true },
  { id: 'cat-d5', codigo: '2.5', nome: 'Contas de Água, Luz, Internet', tipo: 'DESPESA', centroCusto: 'Administrativo', ativa: true, canDelete: true },
  { id: 'cat-d6', codigo: '2.6', nome: 'Marketing e Anúncios Digitais', tipo: 'DESPESA', centroCusto: 'Comercial', ativa: true, canDelete: true },
  { id: 'cat-d7', codigo: '2.7', nome: 'Tarifas Bancárias e de Máquina de Cartão', tipo: 'DESPESA', centroCusto: 'Financeiro', ativa: true, canDelete: true },
  { id: 'cat-d8', codigo: '2.8', nome: 'Saques Pessoais (Pró-Labore / Distribuição)', tipo: 'DESPESA', centroCusto: 'Pró-Labore', ativa: true, canDelete: false }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  // Jan/2026
  { id: 'tr-1', data: '2026-01-10', dataVencimento: '2026-01-10', tipo: 'RECEITA', categoriaId: 'cat-r1', descricao: 'Venda de cabideiro e organizador', valor: 850.00, status: 'PAGO' },
  { id: 'tr-2', data: '2026-01-15', dataVencimento: '2026-01-15', tipo: 'DESPESA', categoriaId: 'cat-d1', descricao: 'Lote de madeira serrada', valor: 450.00, status: 'PAGO' },
  { id: 'tr-3', data: '2026-01-20', dataVencimento: '2026-01-20', tipo: 'DESPESA', categoriaId: 'cat-d3', descricao: 'DAS MEI Janeira/2026', valor: 76.60, status: 'PAGO' },

  // Fev/2026
  { id: 'tr-4', data: '2026-02-05', dataVencimento: '2026-02-05', tipo: 'RECEITA', categoriaId: 'cat-r2', descricao: 'Serviço de montagem predial', valor: 2800.00, status: 'PAGO' },
  { id: 'tr-5', data: '2026-02-12', dataVencimento: '2026-02-12', tipo: 'DESPESA', categoriaId: 'cat-d4', descricao: 'Aluguel do galpão', valor: 1200.00, status: 'PAGO' },
  { id: 'tr-6', data: '2026-02-20', dataVencimento: '2026-02-20', tipo: 'DESPESA', categoriaId: 'cat-d3', descricao: 'DAS MEI Fevereiro/2026', valor: 76.60, status: 'PAGO' },

  // Mar/2026
  { id: 'tr-7', data: '2026-03-08', dataVencimento: '2026-03-08', tipo: 'RECEITA', categoriaId: 'cat-r1', descricao: 'Vendas balcão - Peças variadas', valor: 3100.00, status: 'PAGO' },
  { id: 'tr-8', data: '2026-03-10', dataVencimento: '2026-03-10', tipo: 'RECEITA', categoriaId: 'cat-r2', descricao: 'Restauração mesa de jantar carvalho', valor: 1200.00, status: 'PAGO' },
  { id: 'tr-9', data: '2026-03-15', dataVencimento: '2026-03-15', tipo: 'DESPESA', categoriaId: 'cat-d1', descricao: 'Chapas de Compensado e cola', valor: 650.00, status: 'PAGO' },
  { id: 'tr-10', data: '2026-03-20', dataVencimento: '2026-03-20', tipo: 'DESPESA', categoriaId: 'cat-d3', descricao: 'DAS MEI Março/2026', valor: 76.60, status: 'PAGO' },

  // Abr/2026
  { id: 'tr-11', data: '2026-04-05', dataVencimento: '2026-04-05', tipo: 'RECEITA', categoriaId: 'cat-r2', descricao: 'Consultoria de Design 3D Reis', valor: 4500.00, status: 'PAGO' },
  { id: 'tr-12', data: '2026-04-12', dataVencimento: '2026-04-12', tipo: 'RECEITA', categoriaId: 'cat-r1', descricao: 'Encomenda de cabideiros mdf', valor: 2200.00, status: 'PAGO' },
  { id: 'tr-13', data: '2026-04-20', dataVencimento: '2026-04-20', tipo: 'DESPESA', categoriaId: 'cat-d3', descricao: 'DAS MEI Abril/2026', valor: 76.60, status: 'PAGO' },
  { id: 'tr-14', data: '2026-04-25', dataVencimento: '2026-04-25', tipo: 'DESPESA', categoriaId: 'cat-d6', descricao: 'Anúncios Instagram/Google', valor: 350.00, status: 'PAGO' },

  // Mai/2026
  { id: 'tr-15', data: '2026-05-10', dataVencimento: '2026-05-10', tipo: 'RECEITA', categoriaId: 'cat-r1', descricao: 'Lote Organizadores Pinus Nova Esperança', valor: 6800.00, status: 'PAGO' },
  { id: 'tr-16', data: '2026-05-15', dataVencimento: '2026-05-15', tipo: 'DESPESA', categoriaId: 'cat-d1', descricao: 'Fornecedor Pinus Madeiras', valor: 1800.00, status: 'PAGO' },
  { id: 'tr-17', data: '2026-05-20', dataVencimento: '2026-05-20', tipo: 'DESPESA', categoriaId: 'cat-d3', descricao: 'DAS MEI Maio/2026', valor: 76.60, status: 'PAGO' },
  { id: 'tr-18', data: '2026-05-30', dataVencimento: '2026-05-30', tipo: 'DESPESA', categoriaId: 'cat-d2', descricao: 'Salário Cláudio / Lucas Admissão', valor: 1412.00, status: 'PAGO' },

  // Jun/2026 (Mês Atual)
  { id: 'tr-19', data: '2026-06-02', dataVencimento: '2026-06-02', tipo: 'RECEITA', categoriaId: 'cat-r2', descricao: 'Serviço Gôndolas Nova Esperança', valor: 2200.00, status: 'PAGO' },
  { id: 'tr-20', data: '2026-06-05', dataVencimento: '2026-06-05', tipo: 'RECEITA', categoriaId: 'cat-r1', descricao: 'Venda de Painéis Organizadores', valor: 1850.00, status: 'PAGO' },
  { id: 'tr-21', data: '2026-06-12', dataVencimento: '2026-06-12', tipo: 'RECEITA', categoriaId: 'cat-r2', descricao: 'Instalação de prateleiras residenciais', valor: 450.00, status: 'PAGO' },
  { id: 'tr-22', data: '2026-06-10', dataVencimento: '2026-06-10', tipo: 'DESPESA', categoriaId: 'cat-d1', descricao: 'Madeireira Pinus compra', valor: 1200.00, status: 'PENDENTE' },
  { id: 'tr-23', data: '2026-06-12', dataVencimento: '2026-06-12', tipo: 'DESPESA', categoriaId: 'cat-d5', descricao: 'Conta de Energia Elétrica Enel', valor: 185.30, status: 'PAGO' },
  { id: 'tr-24', data: '2026-06-20', dataVencimento: '2026-06-20', tipo: 'DESPESA', categoriaId: 'cat-d3', descricao: 'DAS MEI Junho/2026', valor: 76.60, status: 'PENDENTE' }, // DAS Aberto!

  // Contas Futuras (Julho, Agosto...) para Projeção
  { id: 'tr-25', data: '2026-07-05', dataVencimento: '2026-07-05', tipo: 'RECEITA', categoriaId: 'cat-r2', descricao: 'Contrato recorrente de montagem', valor: 2400.00, status: 'PENDENTE' },
  { id: 'tr-26', data: '2026-07-10', dataVencimento: '2026-07-10', tipo: 'DESPESA', categoriaId: 'cat-d4', descricao: 'Aluguel programado Galpão', valor: 1200.00, status: 'PENDENTE' },
  { id: 'tr-27', data: '2026-08-05', dataVencimento: '2026-08-05', tipo: 'RECEITA', categoriaId: 'cat-r2', descricao: 'Serviço programado Restauração', valor: 1500.00, status: 'PENDENTE' },
  { id: 'tr-28', data: '2026-08-10', dataVencimento: '2026-08-10', tipo: 'DESPESA', categoriaId: 'cat-d4', descricao: 'Aluguel programado Galpão', valor: 1200.00, status: 'PENDENTE' }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'mov-1', productId: 'prod-1', tipo: 'ENTRADA', quantidade: 50, data: '2026-05-02', motivo: 'Compra de matéria prima', responsavel: 'Carlos Oliveira' },
  { id: 'mov-2', productId: 'prod-1', tipo: 'SAIDA', quantidade: 15, data: '2026-05-10', motivo: 'Venda integrada Nova Esperança', responsavel: 'Carlos Oliveira' },
  { id: 'mov-3', productId: 'prod-2', tipo: 'ENTRADA', quantidade: 10, data: '2026-04-15', motivo: 'Montagem interna', responsavel: 'Lucas Gabriel' },
  { id: 'mov-4', productId: 'prod-2', tipo: 'SAIDA', quantidade: 6, data: '2026-05-20', motivo: 'Venda balcão de material', responsavel: 'Carlos Oliveira' }
];

export const INITIAL_DAS: DASPayment[] = [
  { id: 'das-1', periodoReferencia: '01/2026', dataVencimento: '2026-02-20', valor: 76.60, status: 'PAGO', dataPagamento: '2026-02-18', boletoUrl: '#' },
  { id: 'das-2', periodoReferencia: '02/2026', dataVencimento: '2026-03-20', valor: 76.60, status: 'PAGO', dataPagamento: '2026-03-15', boletoUrl: '#' },
  { id: 'das-3', periodoReferencia: '03/2026', dataVencimento: '2026-04-20', valor: 76.60, status: 'PAGO', dataPagamento: '2026-04-19', boletoUrl: '#' },
  { id: 'das-4', periodoReferencia: '04/2026', dataVencimento: '2026-05-20', valor: 76.60, status: 'PAGO', dataPagamento: '2026-05-20', boletoUrl: '#' },
  { id: 'das-5', periodoReferencia: '05/2026', dataVencimento: '2026-06-20', valor: 76.60, status: 'PAGO', dataPagamento: '2026-06-08', boletoUrl: '#' },
  { id: 'das-6', periodoReferencia: '06/2026', dataVencimento: '2026-07-20', valor: 76.60, status: 'PAGO', dataPagamento: '20/07/2026', boletoUrl: '#' },
  { id: 'das-7', periodoReferencia: '07/2026', dataVencimento: '2026-08-20', valor: 76.60, status: 'PAGO', dataPagamento: '20/08/2026', boletoUrl: '#' },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    numero: '000001',
    tipo: 'NF-e',
    destinatarioNome: 'Supermercado Nova Esperança Ltda',
    destinatarioDocumento: '43.201.890/0001-34',
    valorTotal: 6800.00,
    dataEmissao: '2026-05-10',
    status: 'Produção',
    xmlSimulado: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260530751934000130550010000000011855662134" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>85566213</cNF>
        <natOp>Venda Mercadoria adquirida terceiros</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1</nNF>
        <dhEmi>2026-05-10T14:30:22-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>4</cDV>
        <tpAmb>1</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>ERPEssencialMEIv1</verProc>
      </ide>
      <emit>
        <CNPJ>30.751.934/0001-30</CNPJ>
        <xNome>Carlos Oliveira - Marcenaria MEI</xNome>
        <xFant>ERP Essencial Marcenaria</xFant>
        <enderEmit>
          <xLgr>Rua Bento de Souza</xLgr>
          <nro>40</nro>
          <xBairro>Vila Nova</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>04533010</CEP>
        </enderEmit>
        <IE>123456789110</IE>
        <CRT>1</CRT>
      </emit>
      <dest>
        <CNPJ>43201890000134</CNPJ>
        <xNome>Supermercado Nova Esperanca Ltda</xNome>
        <enderDest>
          <xLgr>Praca da Se</xLgr>
          <nro>110</nro>
          <xBairro>Se</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>987654321110</IE>
        <email>financeiro@novaesperanca.com</email>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>ORG-WD-40</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>Organizador de Madeira Pinus 40cm</xProd>
          <NCM>44219900</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>150.00</qCom>
          <vUnCom>45.33</vUnCom>
          <vProd>6800.00</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
        </prod>
        <imposto>
          <ICMS>
            <ICMSSN102>
              <orig>0</orig>
              <CSOSN>102</CSOSN>
            </ICMSSN102>
          </ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>0.00</vBC>
          <vICMS>0.00</vICMS>
          <vProd>6800.00</vProd>
          <vOutro>0.00</vOutro>
          <vNF>6800.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`
  },
  {
    id: 'inv-2',
    numero: '000002',
    tipo: 'NFSE',
    destinatarioNome: 'Reis & Associados Consultoria',
    destinatarioDocumento: '12.345.678/0001-90',
    valorTotal: 4500.00,
    dataEmissao: '2026-04-05',
    status: 'PRODUCAO',
    xmlSimulado: `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps Id="lote_1" versao="2.01">
    <NumeroLote>1</NumeroLote>
    <Cnpj>30751934000130</Cnpj>
    <InscricaoMunicipal>8765431</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfDeclaracaoPrestacaoServico Id="rps_0002">
          <Rps Id="r_2">
            <IdentificacaoRps>
              <Numero>2</Numero>
              <Serie>MEI</Serie>
              <Tipo>1</Tipo>
            </IdentificacaoRps>
            <DataEmissao>2026-04-05T10:00:00</DataEmissao>
            <Status>1</Status>
          </Rps>
          <Competencia>2026-04-05Competencia></Competencia>
          <Servico>
            <Valores>
              <ValorServicos>4500.00</ValorServicos>
              <ValorDeducoes>0.00</ValorDeducoes>
              <Aliquota>0.00</Aliquota>
              <ValorIss>0.00</ValorIss>
              <IssRetido>2</IssRetido>
            </Valores>
            <ItemListaServico>07.03</ItemListaServico>
            <CodigoCnae>7410202</CodigoCnae>
            <CodigoTributacaoMunicipio>070301</CodigoTributacaoMunicipio>
            <Discriminacao>Servico de Consultoria de Identidade Visual e Projetos Comerciais Marcenaria sob Medida - MEI Isento de ISS por DAS Nacional</Discriminacao>
            <CodigoMunicipio>3550308</CodigoMunicipio>
          </Servico>
          <Prestador>
            <Cnpj>30751934000130</Cnpj>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                <Cnpj>12345678000190</Cnpj>
              </CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>Reis &amp; Associados Consultoria</RazaoSocial>
          </Tomador>
        </InfDeclaracaoPrestacaoServico>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-13T10:30:15-03:00',
    usuario: 'Carlos Oliveira',
    modulo: 'Autenticação',
    acao: 'LOGIN',
    descricao: 'Login efetuado com sucesso no sistema. IP: 187.64.201.29',
    ip: '187.64.201.29'
  },
  {
    id: 'log-2',
    timestamp: '2026-06-13T10:45:00-03:00',
    usuario: 'Carlos Oliveira',
    modulo: 'Clientes',
    acao: 'CRIACAO',
    descricao: 'Novo cliente cadastrado: Supermercado Nova Esperança Ltda',
    diffNovo: '{"id":"cli-1","nome":"Supermercado Nova Esperança Ltda","documento":"43.201.890/0001-34"}',
    ip: '187.64.201.29'
  },
  {
    id: 'log-3',
    timestamp: '2026-06-13T11:02:45-03:00',
    usuario: 'Carlos Oliveira',
    modulo: 'Funcionários',
    acao: 'CONCURSABILIDADE',
    descricao: 'Alerta de restrição legal acionado: Tentativa de cadastro de funcionário Lucas Gabriel Albuquerque verificou limitação de empregado único do MEI.',
    ip: '187.64.201.29'
  },
  {
    id: 'log-4',
    timestamp: '2026-06-13T14:15:33-03:00',
    usuario: 'Carlos Oliveira',
    modulo: 'Fiscal',
    acao: 'EXPORTACAO',
    descricao: 'Relatório Mensal de faturamento exportado em formato CSV para fins de declaração PGDAS-D.',
    ip: '187.64.201.29'
  }
];

export const ONBOARDING_TOUR_STEPS: OnboardingStep[] = [
  {
    target: '#tour-dashboard-card-limite',
    title: 'Limite Anual do MEI',
    content: 'Aqui você acompanha o faturamento acumulado no ano contra o limite oficial de R$ 81.000,00. Mostramos barras de progresso que ficam amarelas (75%) ou vermelhas (90%) para evitar que você desenquadre irregularmente.'
  },
  {
    target: '#tour-das-pendente',
    title: 'Sua Guia DAS',
    content: 'O pagamento mensual da DAS é sua principal obrigação como MEI! Acompanhe o boleto do mês, o valor exato e seu histórico diretamente por esta seção.'
  },
  {
    target: '#tour-planocontas-button',
    title: 'Plano de Contas Didático',
    content: 'Diferente de sistemas complexos, aqui estruturamos as receitas e despesas respeitando a contabilidade simplificada do MEI, para quando chegar a hora de preencher sua declaração anual (DASN).'
  },
  {
    target: '#tour-emissao-check',
    title: 'Emissão Sem Fronteiras',
    content: 'Simulador e emissor de NF-e para suas mercadorias e de NFS-e integrado com o Portal Nacional de Serviços do Gov.br. Sem mistérios!'
  }
];
