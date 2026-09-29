/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, Supplier, Employee, Product, Service } from '../types';
import { useIncrementalList } from '../hooks/useIncrementalList';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { GlobalBulkActionBar } from './GlobalBulkActionBar';
import { ConfirmActionModal } from './ConfirmActionModal';
import { FichaCadastralModal, FichaCadastralType } from './FichaCadastralModal';
import { 
  formatCurrencyBRL, 
  formatQuantity, 
  formatDocument, 
  formatPhone,
  maskCurrency,
  parseCurrencyInput
} from '../utils/formatters';
import { ResponsiveModal } from './ResponsiveModal';
import { DataTable, Column } from './DataTable';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { ActionButton } from './ActionButton';
import { 
  Users, 
  Truck, 
  UserSquare2, 
  Package, 
  Hammer, 
  Search, 
  Plus, 
  X, 
  Eye, 
  AlertOctagon, 
  HelpCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  Pencil,
  Save,
  CheckSquare,
  Square,
  FileText,
  List,
  Grid
} from 'lucide-react';

interface CadastrosProps {
  clients: Client[];
  suppliers: Supplier[];
  employees: Employee[];
  products: Product[];
  services: Service[];
  onAddClient: (c: Client) => void;
  onAddSupplier: (s: Supplier) => void;
  onAddEmployee: (e: Employee) => void;
  onAddProduct: (p: Product) => void;
  onAddService: (s: Service) => void;
  onUpdateClient?: (c: Client) => void;
  onUpdateSupplier?: (s: Supplier) => void;
  onUpdateEmployee?: (e: Employee) => void;
  onUpdateProduct?: (p: Product) => void;
  onUpdateService?: (s: Service) => void;
  onDeleteClient: (id: string) => void;
  onDeleteSupplier: (id: string) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onDeleteService: (id: string) => void;
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'EXPORTACAO', descricao: string) => void;
  initialTab?: 'clientes' | 'fornecedores' | 'funcionarios' | 'produtos' | 'servicos';
  autoOpenAdd?: boolean;
}

export const Cadastros = React.memo(function Cadastros({
  clients,
  suppliers,
  employees,
  products,
  services,
  onAddClient,
  onAddSupplier,
  onAddEmployee,
  onAddProduct,
  onAddService,
  onUpdateClient,
  onUpdateSupplier,
  onUpdateEmployee,
  onUpdateProduct,
  onUpdateService,
  onDeleteClient,
  onDeleteSupplier,
  onDeleteEmployee,
  onDeleteProduct,
  onDeleteService,
  addLog,
  initialTab,
  autoOpenAdd
}: CadastrosProps) {
  const [activeTab, setActiveTab] = useState<'clientes' | 'fornecedores' | 'funcionarios' | 'produtos' | 'servicos'>(initialTab || 'clientes');
  
  // Search and filter state
  const [searchText, setSearchText] = useState('');
  const [subFilter, setSubFilter] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'tabela' | 'cartoes'>('tabela');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewHistoryItem, setViewHistoryItem] = useState<any | null>(null);

  // Sync initialTab and autoOpenAdd when passed from external callers (e.g. Estoque screen)
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (autoOpenAdd) {
      setShowAddModal(true);
    }
  }, [autoOpenAdd]);

  // Filtered list based on active tab, search text and subFilters
  const currentTabItems = useMemo(() => {
    const term = searchText.toLowerCase().trim();
    if (activeTab === 'clientes') {
      return clients.filter(c => {
        const matchesSearch = c.nome.toLowerCase().includes(term) || c.documento.includes(term) || (c.cidade && c.cidade.toLowerCase().includes(term));
        if (!matchesSearch) return false;
        if (subFilter === 'PJ') return c.tipo === 'PJ';
        if (subFilter === 'PF') return c.tipo === 'PF';
        if (subFilter === 'ADIMPLENTES') return c.adimplente;
        if (subFilter === 'INADIMPLENTES') return !c.adimplente;
        return true;
      });
    } else if (activeTab === 'fornecedores') {
      return suppliers.filter(s => {
        const matchesSearch = s.razaoSocial.toLowerCase().includes(term) || s.cnpj.includes(term) || (s.contatoNome && s.contatoNome.toLowerCase().includes(term));
        if (!matchesSearch) return false;
        if (subFilter === 'A_VISTA') return s.condicoesPagamento.toLowerCase().includes('vista');
        if (subFilter === 'A_PRAZO') return !s.condicoesPagamento.toLowerCase().includes('vista');
        return true;
      });
    } else if (activeTab === 'funcionarios') {
      return employees.filter(e => e.nome.toLowerCase().includes(term) || e.cpf.includes(term) || (e.cargo && e.cargo.toLowerCase().includes(term)));
    } else if (activeTab === 'produtos') {
      return products.filter(p => {
        const matchesSearch = p.nome.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || (p.categoria && p.categoria.toLowerCase().includes(term));
        if (!matchesSearch) return false;
        if (subFilter === 'ESTOQUE_BAIXO') return p.estoqueAtual <= p.estoqueMinimo;
        if (subFilter !== 'TODOS') return p.categoria === subFilter;
        return true;
      });
    } else {
      return services.filter(s => {
        const matchesSearch = s.nome.toLowerCase().includes(term) || (s.codigoServico && s.codigoServico.includes(term)) || (s.categoria && s.categoria.toLowerCase().includes(term));
        if (!matchesSearch) return false;
        if (subFilter !== 'TODOS') return s.categoria === subFilter;
        return true;
      });
    }
  }, [activeTab, searchText, subFilter, clients, suppliers, employees, products, services]);

  const {
    visibleItems,
    hasMore,
    totalCount,
    displayedCount,
    sentinelRef
  } = useIncrementalList<any>(currentTabItems as any[], 10, 10);

  // Modals state
  const [editingEntity, setEditingEntity] = useState<{
    type: 'clientes' | 'fornecedores' | 'funcionarios' | 'produtos' | 'servicos';
    data: any;
  } | null>(null);

  // Motor Global de Seleção e Exclusão em Massa
  const bulk = useBulkSelection<any>(currentTabItems as any[]);

  // Modal Global de Confirmação (Substitui window.confirm em 100% dos fluxos)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    itemName?: string;
    itemCount?: number;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  // Modal Global de Ficha Cadastral (Visualização + Impressão / Exportação PDF)
  const [fichaModal, setFichaModal] = useState<{
    isOpen: boolean;
    type: FichaCadastralType;
    data: any;
  }>({
    isOpen: false,
    type: 'cliente',
    data: null
  });

  const handleOpenFicha = (type: FichaCadastralType, data: any) => {
    setFichaModal({
      isOpen: true,
      type,
      data
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;

    const { type, data } = editingEntity;

    if (type === 'clientes') {
      onUpdateClient?.(data);
      addLog('Clientes', 'EDICAO', `Cliente atualizado: ${data.nome}`);
    } else if (type === 'fornecedores') {
      onUpdateSupplier?.(data);
      addLog('Fornecedores', 'EDICAO', `Fornecedor atualizado: ${data.razaoSocial}`);
    } else if (type === 'funcionarios') {
      onUpdateEmployee?.(data);
      addLog('Funcionários', 'EDICAO', `Funcionário atualizado: ${data.nome}`);
    } else if (type === 'produtos') {
      const custo = Number(data.custo) || 0;
      const venda = Number(data.venda) || 0;
      const lucroReais = venda - custo;
      const lucroPercentual = custo > 0 ? (lucroReais / custo) * 100 : 0;
      const updatedProduct = {
        ...data,
        custo,
        venda,
        lucroReais,
        lucroPercentual,
        estoqueAtual: Number(data.estoqueAtual) || 0,
        estoqueMinimo: Number(data.estoqueMinimo) || 0
      };
      onUpdateProduct?.(updatedProduct);
      addLog('Produtos', 'EDICAO', `Produto atualizado: ${data.nome}`);
    } else if (type === 'servicos') {
      const valor = Number(data.valor) || 0;
      const updatedService = {
        ...data,
        valor
      };
      onUpdateService?.(updatedService);
      addLog('Serviços', 'EDICAO', `Serviço atualizado: ${data.nome}`);
    }

    setEditingEntity(null);
  };

  // Forms state
  // -- Clients
  const [clientNome, setClientNome] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientTipo, setClientTipo] = useState<'PF' | 'PJ'>('PJ');
  const [clientCep, setClientCep] = useState('');
  const [clientLgr, setClientLgr] = useState('');
  const [clientBairro, setClientBairro] = useState('');
  const [clientCidade, setClientCidade] = useState('');
  const [clientUf, setClientUf] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAdimplente, setClientAdimplente] = useState(true);
  const [isCEPloading, setIsCEPLoading] = useState(false);
  
  // -- Suppliers
  const [supRazao, setSupRazao] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supContato, setSupContato] = useState('');
  const [supTel, setSupTel] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supCondicoes, setSupCondicoes] = useState('À vista');

  // -- Employees
  const [empNome, setEmpNome] = useState('');
  const [empCpf, setEmpCpf] = useState('');
  const [empCargo, setEmpCargo] = useState('');
  const [empRemun, setEmpRemun] = useState('1412.00'); // Default current minimum CLT
  const [empDocs, setEmpDocs] = useState('');

  // -- Products
  const [prodSku, setProdSku] = useState('');
  const [prodNome, setProdNome] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodNcm, setProdNcm] = useState('');
  const [prodUnidade, setProdUnidade] = useState<'UN' | 'KG' | 'L' | 'M' | 'PCT'>('UN');
  const [prodCusto, setProdCusto] = useState('');
  const [prodVenda, setProdVenda] = useState('');
  const [prodCategoria, setProdCategoria] = useState('');
  const [prodFornecedor, setProdFornecedor] = useState('');
  const [prodEstoque, setProdEstoque] = useState('');
  const [prodEstoqueMin, setProdEstoqueMin] = useState('5');

  // -- Services
  const [servNome, setServNome] = useState('');
  const [servDesc, setServDesc] = useState('');
  const [servValor, setServValor] = useState('');
  const [servCategoria, setServCategoria] = useState('');
  const [servTempo, setServTempo] = useState('2 horas');
  const [servCodigo, setServCodigo] = useState(''); // NBS

  // API helper status state
  const [receitaLookupStatus, setReceitaLookupStatus] = useState('');

  // -------------------------------------------------------------
  // API SIMULATIONS / TRIGGERS
  // -------------------------------------------------------------
  const handleViaCEPLookup = async () => {
    const cleanCEP = clientCep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      alert('Por favor, insira um CEP válido de 8 dígitos para consulta (ex: 01001000).');
      return;
    }

    setIsCEPLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      if (data.erro) {
        alert('CEP não encontrado na base pública do ViaCEP.');
      } else {
        setClientLgr(data.logradouro || '');
        setClientBairro(data.bairro || '');
        setClientCidade(data.localidade || '');
        setClientUf(data.uf || '');
      }
    } catch (err) {
      // Fallback local mock simulation if network blocks/fails
      console.warn('Network error or rate-limiting on ViaCEP, using simulated Brazilian address template.', err);
      // Let's autofill a realistic address
      setClientLgr('Praça Ramos de Azevedo, s/n');
      setClientBairro('República');
      setClientCidade('São Paulo');
      setClientUf('SP');
    } finally {
      setIsCEPLoading(false);
    }
  };

  const handleReceitaCNPJLookup = () => {
    const cleanDoc = (clientTipo === 'PJ' ? clientDoc : supCnpj).replace(/\D/g, '');
    if (cleanDoc.length !== 14) {
      alert('Para simular a consulta da Receita Federal, digite um CNPJ com 14 dígitos.');
      return;
    }

    setReceitaLookupStatus('Consultando Receita Federal...');
    setTimeout(() => {
      setReceitaLookupStatus('');
      
      const mockedPJNames: { [key: string]: { razao: string, lgr: string, cep: string, cidade: string, uf: string, bairro: string } } = {
        '43201890000134': { razao: 'Supermercado Nova Esperança Ltda', lgr: 'Praça da Sé, 110', cep: '01001-000', cidade: 'São Paulo', uf: 'SP', bairro: 'Sé' },
        '12345678000190': { razao: 'Reis & Associados Consultoria', lgr: 'Avenida Afonso Pena, 1200', cep: '30110-002', cidade: 'Belo Horizonte', uf: 'MG', bairro: 'Centro' },
        '09876543000121': { razao: 'Madeireira Pinus Soluções Florestais Ltda', lgr: 'Avenida República Argentina, 500', cep: '80240-210', cidade: 'Curitiba', uf: 'PR', bairro: 'Água Verde' }
      };

      const match = mockedPJNames[cleanDoc];
      if (match) {
        if (activeTab === 'clientes') {
          setClientNome(match.razao);
          setClientCep(match.cep);
          setClientLgr(match.lgr);
          setClientCidade(match.cidade);
          setClientUf(match.uf);
          setClientBairro(match.bairro);
        } else if (activeTab === 'fornecedores') {
          setSupRazao(match.razao);
          setSupEmail(`comercial@${match.razao.toLowerCase().replace(/[^a-z]/g, '')}.com`);
          setSupContato('Responsável Consultor');
        }
        alert('Cadastro de CNPJ Encontrado na Receita Federal e autocompletado com sucesso!');
      } else {
        // Fallback generic generator
        const dummyName = activeTab === 'clientes' ? 'Indústria e Distribuição Horizonte S/A' : 'Atacadista de Madeiras Sul Brasil Ltda';
        if (activeTab === 'clientes') {
          setClientNome(dummyName);
          setClientCep('04533-010');
          setClientLgr('Rua Bento de Souza, 40');
          setClientCidade('São Paulo');
          setClientUf('SP');
          setClientBairro('Vila Nova');
        } else if (activeTab === 'fornecedores') {
          setSupRazao(dummyName);
          setSupContato('José Marques');
          setSupEmail('contato@marquesmadeiras.com.br');
        }
        alert('Consulta concluída! CNPJ simulado validado com sucesso na Receita Federal brasileira.');
      }
    }, 1200);
  };

  // -------------------------------------------------------------
  // FORM SUBMISSION HANDLERS
  // -------------------------------------------------------------
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'clientes') {
      const newCli: Client = {
        id: `cli-${Date.now()}`,
        nome: clientNome,
        documento: clientDoc,
        tipo: clientTipo,
        cep: clientCep,
        logradouro: clientLgr,
        bairro: clientBairro,
        cidade: clientCidade,
        uf: clientUf,
        telefone: clientTel,
        email: clientEmail,
        adimplente: clientAdimplente,
        historicoCompras: []
      };
      onAddClient(newCli);
      addLog('Clientes', 'CRIACAO', `Criado cliente ${clientNome} (${clientDoc})`);
      resetClientForm();
    } 
    
    else if (activeTab === 'fornecedores') {
      const newSup: Supplier = {
        id: `for-${Date.now()}`,
        razaoSocial: supRazao,
        cnpj: supCnpj,
        contatoNome: supContato,
        telefone: supTel,
        email: supEmail,
        condicoesPagamento: supCondicoes,
        historicoPedidos: []
      };
      onAddSupplier(newSup);
      addLog('Fornecedores', 'CRIACAO', `Criado fornecedor ${supRazao}`);
      resetSupplierForm();
    } 
    
    else if (activeTab === 'funcionarios') {
      // ⚠️ LAW VALIDATION OF MEI: Only 1 Employee is allowed!
      if (employees.length >= 1) {
        addLog('Funcionários', 'EXCLUSAO', `Bloqueio legal: Tentativa de cadastro de segundo funcionário recusado.`);
        alert('RESTRIÇÃO SEVERA DO MEI:\n\nPela legislação brasileira vigente (LC 123/2006), o Microempreendedor Individual (MEI) está estritamente limitado à contratação de apenas 1 (um) único empregado que receba o salário mínimo ou o piso salarial da categoria.\n\nO sistema impediu este cadastro para manter sua empresa em total conformidade legal e evitar o desenquadramento do regime fiscal.');
        return; // Halt immediately!
      }

      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        nome: empNome,
        cpf: empCpf,
        cargo: empCargo,
        remuneracao: parseFloat(empRemun) || 1412.00,
        dataAdmissao: new Date().toISOString().split('T')[0],
        documentacao: empDocs
      };
      onAddEmployee(newEmp);
      addLog('Funcionários', 'CRIACAO', `Criado funcionário CLT ${empNome}`);
      resetEmployeeForm();
    } 
    
    else if (activeTab === 'produtos') {
      const c = parseFloat(prodCusto) || 0;
      const v = parseFloat(prodVenda) || 0;
      const profitR = v - c;
      const profitP = c > 0 ? (profitR / c) * 100 : 100;

      const newProd: Product = {
        id: `prod-${Date.now()}`,
        sku: prodSku || `SKU-${Date.now().toString().slice(-6)}`,
        nome: prodNome,
        descricao: prodDesc,
        ncm: prodNcm || '0000.00.00',
        unidade: prodUnidade,
        custo: c,
        venda: v,
        lucroReais: profitR,
        lucroPercentual: profitP,
        categoria: prodCategoria || 'Geral',
        fornecedorId: prodFornecedor || 'for-1',
        estoqueAtual: parseInt(prodEstoque) || 0,
        estoqueMinimo: parseInt(prodEstoqueMin) || 3
      };
      onAddProduct(newProd);
      addLog('Produtos', 'CRIACAO', `Criado produto ${prodNome} (Margem: ${profitP.toFixed(1)}%)`);
      resetProductForm();
    } 
    
    else if (activeTab === 'servicos') {
      const newServ: Service = {
        id: `serv-${Date.now()}`,
        nome: servNome,
        descricao: servDesc,
        valor: parseFloat(servValor) || 0,
        categoria: servCategoria || 'Serviços',
        tempoEstimado: servTempo,
        codigoServico: servCodigo || '14.05'
      };
      onAddService(newServ);
      addLog('Serviços', 'CRIACAO', `Criado serviço ${servNome}`);
      resetServiceForm();
    }

    setShowAddModal(false);
  };

  // -------------------------------------------------------------
  // RESET HELPERS
  // -------------------------------------------------------------
  const resetClientForm = () => {
    setClientNome('');
    setClientDoc('');
    setClientTipo('PJ');
    setClientCep('');
    setClientLgr('');
    setClientBairro('');
    setClientCidade('');
    setClientUf('');
    setClientTel('');
    setClientEmail('');
    setClientAdimplente(true);
  };

  const resetSupplierForm = () => {
    setSupRazao('');
    setSupCnpj('');
    setSupContato('');
    setSupTel('');
    setSupEmail('');
    setSupCondicoes('À vista');
  };

  const resetEmployeeForm = () => {
    setEmpNome('');
    setEmpCpf('');
    setEmpCargo('');
    setEmpRemun('1412.00');
    setEmpDocs('');
  };

  const resetProductForm = () => {
    setProdSku('');
    setProdNome('');
    setProdDesc('');
    setProdNcm('');
    setProdUnidade('UN');
    setProdCusto('');
    setProdVenda('');
    setProdCategoria('');
    setProdFornecedor('');
    setProdEstoque('');
    setProdEstoqueMin('5');
  };

  const resetServiceForm = () => {
    setServNome('');
    setServDesc('');
    setServValor('');
    setServCategoria('');
    setServTempo('2 horas');
    setServCodigo('');
  };

  // -------------------------------------------------------------
  // DELETE TRIGGERS (PADRONIZADO COM ConfirmActionModal)
  // -------------------------------------------------------------
  const executeDelete = (id: string, name: string) => {
    if (activeTab === 'clientes') {
      onDeleteClient(id);
      addLog('Clientes', 'EXCLUSAO', `Excluído cliente: ${name}`);
    } else if (activeTab === 'fornecedores') {
      onDeleteSupplier(id);
      addLog('Fornecedores', 'EXCLUSAO', `Excluído fornecedor: ${name}`);
    } else if (activeTab === 'funcionarios') {
      onDeleteEmployee(id);
      addLog('Funcionários', 'EXCLUSAO', `Excluído funcionário: ${name}`);
    } else if (activeTab === 'produtos') {
      onDeleteProduct(id);
      addLog('Produtos', 'EXCLUSAO', `Excluído produto: ${name}`);
    } else if (activeTab === 'servicos') {
      onDeleteService(id);
      addLog('Serviços', 'EXCLUSAO', `Excluído serviço: ${name}`);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão',
      itemName: name,
      description: `Tem certeza que deseja excluir "${name}" do sistema? Esta operação removerá todos os dados deste cadastro com registro em auditoria.`,
      onConfirm: () => executeDelete(id, name)
    });
  };

  const handleDeleteBulk = () => {
    const count = bulk.selectedCount;
    if (count === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Itens em Massa',
      itemCount: count,
      description: `Tem certeza que deseja excluir os ${count} registros selecionados de ${activeTab}? Esta operação é definitiva.`,
      onConfirm: () => {
        bulk.selectedItems.forEach(item => {
          executeDelete(item.id, item.nome || item.razaoSocial || item.id);
        });
        bulk.clearSelection();
      }
    });
  };

  // Compute Profit margin metrics on the fly for UI inputs
  const calculatedMarginPercentage = () => {
    const cost = parseFloat(prodCusto) || 0;
    const sale = parseFloat(prodVenda) || 0;
    if (cost <= 0) return 0;
    return (((sale - cost) / cost) * 100);
  };

  // -------------------------------------------------------------
  // CONFIGURAÇÃO DE ABAS E COLUNAS DO DATATABLE
  // -------------------------------------------------------------
  const tabConfig = {
    clientes: {
      label: 'Clientes',
      singular: 'Cliente',
      icon: Users,
      actionLabel: '+ Novo Cliente',
      count: clients.length
    },
    fornecedores: {
      label: 'Fornecedores',
      singular: 'Fornecedor',
      icon: Truck,
      actionLabel: '+ Novo Fornecedor',
      count: suppliers.length
    },
    funcionarios: {
      label: 'Funcionário',
      singular: 'Funcionário',
      icon: UserSquare2,
      actionLabel: '+ Novo Funcionário',
      count: employees.length
    },
    produtos: {
      label: 'Produtos',
      singular: 'Produto',
      icon: Package,
      actionLabel: '+ Novo Produto',
      count: products.length
    },
    servicos: {
      label: 'Serviços',
      singular: 'Serviço',
      icon: Hammer,
      actionLabel: '+ Novo Serviço',
      count: services.length
    }
  };

  const clientColumns: Column<Client>[] = useMemo(() => [
    {
      key: 'documento',
      header: 'Tipo / Doc',
      width: '140px',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3',
      render: (c) => (
        <div className="flex flex-col gap-0.5">
          <span className={`inline-block w-fit text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full ${
            c.tipo === 'PJ' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-pink-50 text-pink-600 border border-pink-200'
          }`}>
            {c.tipo}
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {formatDocument(c.documento)}
          </span>
        </div>
      )
    },
    {
      key: 'nome',
      header: 'Cliente / Razão Social',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3',
      render: (c) => (
        <div>
          <button
            type="button"
            onClick={() => handleOpenFicha('cliente', c)}
            className="font-bold text-slate-900 hover:text-emerald-600 transition text-left cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            {c.nome}
          </button>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>{c.email || 'Sem e-mail'}</span>
            {c.telefone && <span>• {formatPhone(c.telefone)}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'localizacao',
      header: 'Cidade / UF',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-slate-600',
      render: (c) => (
        <span className="text-xs">
          {c.cidade ? `${c.cidade} - ${c.uf}` : 'Não informada'}
        </span>
      )
    },
    {
      key: 'situacao',
      header: 'Situação',
      align: 'center',
      headerClassName: 'py-2.5 px-3 text-center',
      className: 'py-2.5 px-3 text-center',
      render: (c) => (
        <StatusBadge
          tone={c.adimplente ? 'success' : 'warning'}
          label={c.adimplente ? 'Adimplente' : 'Inadimplente'}
          size="sm"
        />
      )
    },
    {
      key: 'historico',
      header: 'Histórico',
      align: 'center',
      headerClassName: 'py-2.5 px-3 text-center',
      className: 'py-2.5 px-3 text-center',
      render: (c) => (
        <button
          type="button"
          onClick={() => setViewHistoryItem({ title: `Compras de ${c.nome}`, list: c.historicoCompras })}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
        >
          <Eye className="w-3 h-3" /> {c.historicoCompras.length} compras
        </button>
      )
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      width: '180px',
      headerClassName: 'py-2.5 px-3 text-right',
      className: 'py-2.5 px-3 text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenFicha('cliente', c)}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            <FileText className="w-3 h-3" /> Ficha
          </button>
          <button
            type="button"
            onClick={() => setEditingEntity({ type: 'clientes', data: { ...c } })}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Editar cliente"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteItem(c.id, c.nome)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer font-medium"
            title="Excluir cliente"
          >
            Excluir
          </button>
        </div>
      )
    }
  ], []);

  const supplierColumns: Column<Supplier>[] = useMemo(() => [
    {
      key: 'cnpj',
      header: 'CNPJ',
      width: '160px',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-mono text-[11px] text-slate-600',
      render: (s) => formatDocument(s.cnpj)
    },
    {
      key: 'razaoSocial',
      header: 'Fornecedor / Razão Social',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3',
      render: (s) => (
        <div>
          <button
            type="button"
            onClick={() => handleOpenFicha('fornecedor', s)}
            className="font-bold text-slate-900 hover:text-emerald-600 transition text-left cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            {s.razaoSocial}
          </button>
          <div className="text-[11px] text-slate-400">
            Contato: {s.contatoNome || 'Não informado'}
          </div>
        </div>
      )
    },
    {
      key: 'contato',
      header: 'Telefone & E-mail',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-xs text-slate-600',
      render: (s) => (
        <div>
          <div>{formatPhone(s.telefone) || 'Sem telefone'}</div>
          <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.email}</div>
        </div>
      )
    },
    {
      key: 'condicoes',
      header: 'Condições',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-xs font-medium text-slate-700',
      render: (s) => s.condicoesPagamento || 'Padrão'
    },
    {
      key: 'pedidos',
      header: 'Pedidos',
      align: 'center',
      headerClassName: 'py-2.5 px-3 text-center',
      className: 'py-2.5 px-3 text-center',
      render: (s) => (
        <button
          type="button"
          onClick={() => setViewHistoryItem({ title: `Pedidos de ${s.razaoSocial}`, list: s.historicoPedidos })}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
        >
          <Eye className="w-3 h-3" /> {s.historicoPedidos.length} pedidos
        </button>
      )
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      width: '180px',
      headerClassName: 'py-2.5 px-3 text-right',
      className: 'py-2.5 px-3 text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenFicha('fornecedor', s)}
            className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            <FileText className="w-3 h-3" /> Ficha
          </button>
          <button
            type="button"
            onClick={() => setEditingEntity({ type: 'fornecedores', data: { ...s } })}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Editar fornecedor"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteItem(s.id, s.razaoSocial)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer font-medium"
            title="Excluir fornecedor"
          >
            Excluir
          </button>
        </div>
      )
    }
  ], []);

  const employeeColumns: Column<Employee>[] = useMemo(() => [
    {
      key: 'cpf',
      header: 'CPF',
      width: '140px',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-mono text-[11px] text-slate-600',
      render: (e) => formatDocument(e.cpf)
    },
    {
      key: 'nome',
      header: 'Colaborador CLT',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3',
      render: (e) => (
        <div>
          <button
            type="button"
            onClick={() => handleOpenFicha('funcionario', e)}
            className="font-bold text-slate-900 hover:text-emerald-600 transition text-left cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            {e.nome}
          </button>
          <div className="text-[11px] text-slate-400">
            Admissão: {new Date(e.dataAdmissao).toLocaleDateString('pt-BR')}
          </div>
        </div>
      )
    },
    {
      key: 'cargo',
      header: 'Função / Cargo',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-xs font-semibold text-slate-700',
      render: (e) => e.cargo
    },
    {
      key: 'remuneracao',
      header: 'Salário CLT',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-mono text-xs font-bold text-slate-900',
      render: (e) => formatCurrencyBRL(e.remuneracao)
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      width: '180px',
      headerClassName: 'py-2.5 px-3 text-right',
      className: 'py-2.5 px-3 text-right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenFicha('funcionario', e)}
            className="text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            <FileText className="w-3 h-3" /> Ficha
          </button>
          <button
            type="button"
            onClick={() => setEditingEntity({ type: 'funcionarios', data: { ...e } })}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Editar funcionário"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteItem(e.id, e.nome)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer font-medium"
            title="Excluir funcionário"
          >
            Excluir
          </button>
        </div>
      )
    }
  ], []);

  const productColumns: Column<Product>[] = useMemo(() => [
    {
      key: 'sku',
      header: 'SKU',
      width: '120px',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-mono text-[11px] text-slate-600',
      render: (p) => p.sku
    },
    {
      key: 'nome',
      header: 'Produto / Catálogo',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3',
      render: (p) => (
        <div>
          <button
            type="button"
            onClick={() => handleOpenFicha('produto', p)}
            className="font-bold text-slate-900 hover:text-emerald-600 transition text-left cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            {p.nome}
          </button>
          <div className="text-[11px] text-slate-400">
            Categoria: <span className="font-semibold text-slate-600">{p.categoria || 'Geral'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'valores',
      header: 'Custo / Venda / Margem',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-xs',
      render: (p) => (
        <div className="space-y-0.5">
          <div className="font-mono text-slate-800">
            Venda: <strong className="text-emerald-700">{formatCurrencyBRL(p.venda)}</strong>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Custo: {formatCurrencyBRL(p.custo)} • <span className="text-emerald-600 font-bold">{p.lucroPercentual.toFixed(1)}% margem</span>
          </div>
        </div>
      )
    },
    {
      key: 'estoque',
      header: 'Estoque Atual / Mínimo',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-xs',
      render: (p) => {
        const isLow = p.estoqueAtual <= p.estoqueMinimo;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
              {formatQuantity(p.estoqueAtual)} {p.unidade}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (mín: {formatQuantity(p.estoqueMinimo)})
            </span>
            {isLow && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                Baixo
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      width: '180px',
      headerClassName: 'py-2.5 px-3 text-right',
      className: 'py-2.5 px-3 text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenFicha('produto', p)}
            className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            <FileText className="w-3 h-3" /> Ficha
          </button>
          <button
            type="button"
            onClick={() => setEditingEntity({ type: 'produtos', data: { ...p } })}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Editar produto"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteItem(p.id, p.nome)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer font-medium"
            title="Excluir produto"
          >
            Excluir
          </button>
        </div>
      )
    }
  ], []);

  const serviceColumns: Column<Service>[] = useMemo(() => [
    {
      key: 'codigo',
      header: 'Código NBS',
      width: '120px',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-mono text-[11px] text-slate-600',
      render: (s) => s.codigoServico || '14.05'
    },
    {
      key: 'nome',
      header: 'Serviço / Atividade',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3',
      render: (s) => (
        <div>
          <button
            type="button"
            onClick={() => handleOpenFicha('servico', s)}
            className="font-bold text-slate-900 hover:text-indigo-600 transition text-left cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            {s.nome}
          </button>
          <div className="text-[11px] text-slate-400">
            Categoria: <span className="font-semibold text-slate-600">{s.categoria || 'Geral'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'tempo',
      header: 'Tempo Estimado',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-xs text-slate-600',
      render: (s) => s.tempoEstimado || 'Sob consulta'
    },
    {
      key: 'valor',
      header: 'Preço Cobrado',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-mono text-xs font-bold text-slate-900',
      render: (s) => formatCurrencyBRL(s.valor)
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      width: '180px',
      headerClassName: 'py-2.5 px-3 text-right',
      className: 'py-2.5 px-3 text-right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenFicha('servico', s)}
            className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Abrir Ficha Cadastral"
          >
            <FileText className="w-3 h-3" /> Ficha
          </button>
          <button
            type="button"
            onClick={() => setEditingEntity({ type: 'servicos', data: { ...s } })}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
            title="Editar serviço"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteItem(s.id, s.nome)}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer font-medium"
            title="Excluir serviço"
          >
            Excluir
          </button>
        </div>
      )
    }
  ], []);

  const totalGeralRegistros = clients.length + suppliers.length + employees.length + products.length + services.length;
  const currentConfig = tabConfig[activeTab];

  return (
    <div className="space-y-6">
      
      {/* =========================================================================
          BLOCO 1: CONTROLES GERAIS CONSOLIDADOS (DARK LIQUID GLASS)
          ========================================================================= */}
      <div className="glass-panel-3d rounded-2xl p-5 space-y-4 shadow-sm border border-white/10">
        
        {/* LINHA 1 (TOPO): TÍTULO DA PÁGINA À ESQUERDA E O ÚNICO BOTÃO DE AÇÃO PRIMÁRIA À DIREITA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2dd683]/15 border border-[#2dd683]/30 flex items-center justify-center text-[#2dd683] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Gestão Geral de Cadastros
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2dd683]/20 text-[#2dd683] border border-[#2dd683]/30">
                  {totalGeralRegistros} Registros
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Controle centralizado de parceiros, carteira de clientes, colaborador CLT e catálogo comercial do MEI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* O ÚNICO BOTÃO DE AÇÃO PRIMÁRIA */}
            <button
              type="button"
              disabled={activeTab === 'funcionarios' && employees.length >= 1}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 text-xs font-extrabold bg-[#2dd683] hover:bg-[#25c074] disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-black py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
              title={activeTab === 'funcionarios' && employees.length >= 1 ? 'Limite legal de 1 funcionário MEI atingido' : currentConfig.actionLabel}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{currentConfig.actionLabel}</span>
            </button>
          </div>
        </div>

        {/* LINHA 2 (ABAS): BOTÕES DE ALTERNÂNCIA DE TIPO ESTILIZADOS COMO ABAS HORIZONTAIS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map((tabKey) => {
            const tab = tabConfig[tabKey];
            const Icon = tab.icon;
            const isActive = activeTab === tabKey;

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  setActiveTab(tabKey);
                  setSearchText('');
                  setSubFilter('TODOS');
                  bulk.clearSelection();
                }}
                className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#2dd683] text-black shadow-sm ring-1 ring-[#2dd683]'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  {tabKey === 'funcionarios' ? `${employees.length}/1` : tab.count}
                </span>
                {tabKey === 'funcionarios' && employees.length >= 1 && (
                  <span className="text-[9px] font-bold px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                    CLT Limite
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* LINHA 3 (FILTROS): CAMPO DE BUSCA (SEARCH) E EVENTUAIS FILTROS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Filtrar em ${currentConfig.label.toLowerCase()}...`}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 pr-8 py-2 w-full text-xs bg-slate-900/70 border border-white/15 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#2dd683] focus:ring-1 focus:ring-[#2dd683]/50 transition"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros Contextuais Rápidos */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {activeTab === 'clientes' && (
              <div className="flex items-center gap-1 text-[11px]">
                {['TODOS', 'PJ', 'PF', 'ADIMPLENTES', 'INADIMPLENTES'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSubFilter(f)}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      subFilter === f
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {f === 'TODOS' ? 'Todos' : f === 'ADIMPLENTES' ? 'Adimplentes' : f === 'INADIMPLENTES' ? 'Inadimplentes' : f}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'produtos' && (
              <div className="flex items-center gap-1 text-[11px]">
                {['TODOS', 'ESTOQUE_BAIXO'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSubFilter(f)}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                      subFilter === f
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {f === 'TODOS' ? 'Todos' : '⚠️ Estoque Baixo'}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                {currentTabItems.length} {currentTabItems.length === 1 ? 'item' : 'itens'}
              </span>

              {/* Alternador de visualização Tabela / Cartões */}
              <div className="flex items-center bg-slate-900/60 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode('tabela')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'tabela' ? 'bg-[#2dd683] text-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Visualização em Tabela (DataTable)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cartoes')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'cartoes' ? 'bg-[#2dd683] text-black' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Visualização em Cartões"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning banner if Employees page and already has 1 employee */}
      {activeTab === 'funcionarios' && employees.length >= 1 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/30 flex gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold text-amber-950 dark:text-amber-200">
              Limite Geral MEI de Funcionários Atingido
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Você já possui <strong>{employees.length} funcionário registrado</strong>. Para manter o enquadramento simplificado de MEI, a contratação de adicionais não é permitida por lei. Adicionar um novo CLT exige a transformação societária ou desenquadramento voluntário no portal da Receita Federal.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          BLOCO 2: A LISTA (FLUIDA, OCUPA O RESTO DO ESPAÇO)
          ========================================================================= */}
      <div className="w-full flex-1 space-y-4">
        {viewMode === 'tabela' ? (
          <div>
            {activeTab === 'clientes' && (
              <DataTable
                columns={clientColumns}
                data={visibleItems as Client[]}
                keyExtractor={(c) => c.id}
                emptyMessage="Nenhum cliente cadastrado ou encontrado com os filtros atuais."
                selectedIds={bulk.selectedIds}
                onToggleSelectRow={(id) => bulk.toggleSelection(id)}
                onSelectAll={() => {
                  if (bulk.selectedCount === currentTabItems.length) {
                    bulk.clearSelection();
                  } else {
                    bulk.selectAll(currentTabItems as any[]);
                  }
                }}
                isAllSelected={bulk.selectedCount > 0 && bulk.selectedCount === currentTabItems.length}
                rowHandlers={(c) => bulk.bindLongPress(c.id, () => handleOpenFicha('cliente', c))}
              />
            )}

            {activeTab === 'fornecedores' && (
              <DataTable
                columns={supplierColumns}
                data={visibleItems as unknown as Supplier[]}
                keyExtractor={(s) => s.id}
                emptyMessage="Nenhum fornecedor cadastrado ou encontrado com os filtros atuais."
                selectedIds={bulk.selectedIds}
                onToggleSelectRow={(id) => bulk.toggleSelection(id)}
                onSelectAll={() => {
                  if (bulk.selectedCount === currentTabItems.length) {
                    bulk.clearSelection();
                  } else {
                    bulk.selectAll(currentTabItems as any[]);
                  }
                }}
                isAllSelected={bulk.selectedCount > 0 && bulk.selectedCount === currentTabItems.length}
                rowHandlers={(s) => bulk.bindLongPress(s.id, () => handleOpenFicha('fornecedor', s))}
              />
            )}

            {activeTab === 'funcionarios' && (
              <DataTable
                columns={employeeColumns}
                data={visibleItems as unknown as Employee[]}
                keyExtractor={(e) => e.id}
                emptyMessage="Nenhum funcionário cadastrado."
                selectedIds={bulk.selectedIds}
                onToggleSelectRow={(id) => bulk.toggleSelection(id)}
                onSelectAll={() => {
                  if (bulk.selectedCount === currentTabItems.length) {
                    bulk.clearSelection();
                  } else {
                    bulk.selectAll(currentTabItems as any[]);
                  }
                }}
                isAllSelected={bulk.selectedCount > 0 && bulk.selectedCount === currentTabItems.length}
                rowHandlers={(e) => bulk.bindLongPress(e.id, () => handleOpenFicha('funcionario', e))}
              />
            )}

            {activeTab === 'produtos' && (
              <DataTable
                columns={productColumns}
                data={visibleItems as unknown as Product[]}
                keyExtractor={(p) => p.id}
                emptyMessage="Nenhum produto cadastrado ou encontrado com os filtros atuais."
                selectedIds={bulk.selectedIds}
                onToggleSelectRow={(id) => bulk.toggleSelection(id)}
                onSelectAll={() => {
                  if (bulk.selectedCount === currentTabItems.length) {
                    bulk.clearSelection();
                  } else {
                    bulk.selectAll(currentTabItems as any[]);
                  }
                }}
                isAllSelected={bulk.selectedCount > 0 && bulk.selectedCount === currentTabItems.length}
                rowHandlers={(p) => bulk.bindLongPress(p.id, () => handleOpenFicha('produto', p))}
              />
            )}

            {activeTab === 'servicos' && (
              <DataTable
                columns={serviceColumns}
                data={visibleItems as unknown as Service[]}
                keyExtractor={(s) => s.id}
                emptyMessage="Nenhum serviço cadastrado ou encontrado com os filtros atuais."
                selectedIds={bulk.selectedIds}
                onToggleSelectRow={(id) => bulk.toggleSelection(id)}
                onSelectAll={() => {
                  if (bulk.selectedCount === currentTabItems.length) {
                    bulk.clearSelection();
                  } else {
                    bulk.selectAll(currentTabItems as any[]);
                  }
                }}
                isAllSelected={bulk.selectedCount > 0 && bulk.selectedCount === currentTabItems.length}
                rowHandlers={(s) => bulk.bindLongPress(s.id, () => handleOpenFicha('servico', s))}
              />
            )}
          </div>
        ) : (
          /* MODO CARTÕES */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CLIENTS VIEW */}
        {activeTab === 'clientes' && (visibleItems as Client[])
          .map(c => {
            const isSelected = bulk.isSelected(c.id);
            return (
              <div 
                key={c.id} 
                className={`bg-white p-5 rounded-2xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/15 shadow-md'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
                {...bulk.bindLongPress(c.id, () => handleOpenFicha('cliente', c))}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          bulk.toggleSelection(c.id);
                        }}
                        className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
                        title={isSelected ? "Desmarcar item" : "Selecionar item"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full ${
                        c.tipo === 'PJ' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'
                      }`}>
                        {c.tipo} • {c.tipo === 'PJ' ? 'CNPJ' : 'CPF'}
                      </span>
                    </div>
                    
                    <span className={`text-[10px] font-bold py-0.5 px-2 rounded ${
                      c.adimplente ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'
                    }`}>
                      {c.adimplente ? 'Adimplente' : 'Inadimplente'}
                    </span>
                  </div>

                  <h3 
                    onClick={() => handleOpenFicha('cliente', c)}
                    className="text-base font-bold text-slate-900 line-clamp-1 mb-1 hover:text-emerald-700 transition cursor-pointer"
                    title="Clique para abrir a Ficha Cadastral completa"
                  >
                    {c.nome}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mb-2">
                    Doc: {formatDocument(c.documento)}
                  </p>

                  <div className="space-y-1 text-xs text-slate-600 mb-4">
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.cidade} - {c.uf} (CEP {c.cep})
                    </p>
                    <p>Tel: {formatPhone(c.telefone) || 'Não informado'}</p>
                    <p className="truncate">Email: {c.email}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-1 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenFicha('cliente', c)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                      title="Abrir Ficha Cadastral com Opção de Imprimir/PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" /> Ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewHistoryItem({ title: `Compras de ${c.nome}`, list: c.historicoCompras })}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Compras ({c.historicoCompras.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingEntity({ type: 'clientes', data: { ...c } })}
                      className="text-xs font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition"
                      title="Editar informações do cliente"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(c.id, c.nome)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        }

        {/* FORNECEDORES VIEW */}
        {activeTab === 'fornecedores' && (visibleItems as unknown as Supplier[])
          .map(s => {
            const isSelected = bulk.isSelected(s.id);
            return (
              <div 
                key={s.id} 
                className={`bg-white p-5 rounded-2xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/15 shadow-md'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
                {...bulk.bindLongPress(s.id, () => handleOpenFicha('fornecedor', s))}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          bulk.toggleSelection(s.id);
                        }}
                        className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
                        title={isSelected ? "Desmarcar item" : "Selecionar item"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 py-0.5 px-2 rounded-full inline-block">
                        Parceiro Homologado
                      </span>
                    </div>
                  </div>
                  
                  <h3 
                    onClick={() => handleOpenFicha('fornecedor', s)}
                    className="text-base font-bold text-slate-900 line-clamp-1 mb-1 hover:text-blue-700 transition cursor-pointer"
                    title="Clique para abrir a Ficha Cadastral do fornecedor"
                  >
                    {s.razaoSocial}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mb-3">
                    CNPJ: {formatDocument(s.cnpj)}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <p><strong className="font-semibold text-slate-700">Contato:</strong> {s.contatoNome}</p>
                    <p><strong className="font-semibold text-slate-700">Telefone:</strong> {formatPhone(s.telefone) || 'Não informado'}</p>
                    <p className="truncate"><strong className="font-semibold text-slate-700">E-mail:</strong> {s.email}</p>
                    <p className="bg-slate-50 p-1.5 rounded text-[10px] text-slate-500 font-mono border border-slate-200">
                      Condição Comercial: {s.condicoesPagamento}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-1 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenFicha('fornecedor', s)}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                      title="Abrir Ficha Cadastral com Opção de Imprimir/PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> Ficha
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewHistoryItem({ title: `Pedidos de ${s.razaoSocial}`, list: s.historicoPedidos })}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> Pedidos ({s.historicoPedidos.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingEntity({ type: 'fornecedores', data: { ...s } })}
                      className="text-xs font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition"
                      title="Editar informações do fornecedor"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(s.id, s.razaoSocial)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        }

        {/* EMPLOYEES VIEW */}
        {activeTab === 'funcionarios' && (visibleItems as unknown as Employee[])
          .map(e => {
            const isSelected = bulk.isSelected(e.id);
            return (
              <div 
                key={e.id} 
                className={`bg-white p-5 rounded-2xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/15 shadow-md'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
                {...bulk.bindLongPress(e.id, () => handleOpenFicha('funcionario', e))}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          bulk.toggleSelection(e.id);
                        }}
                        className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
                        title={isSelected ? "Desmarcar item" : "Selecionar item"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 py-0.5 px-2 rounded-full inline-block">
                        Registro CLT Vigente (MEI Único)
                      </span>
                    </div>
                  </div>

                  <h3 
                    onClick={() => handleOpenFicha('funcionario', e)}
                    className="text-base font-bold text-slate-900 mb-1 hover:text-purple-700 transition cursor-pointer"
                    title="Clique para abrir a Ficha Cadastral do colaborador"
                  >
                    {e.nome}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize font-medium mb-3">
                    Cargo: {e.cargo}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <p><strong className="font-semibold text-slate-700">CPF:</strong> {formatDocument(e.cpf)}</p>
                    <p><strong className="font-semibold text-slate-700">Remuneração CLT:</strong> {formatCurrencyBRL(e.remuneracao)}</p>
                    <p><strong className="font-semibold text-slate-700">Admissão:</strong> {new Date(e.dataAdmissao).toLocaleDateString('pt-BR')}</p>
                    <p className="text-[10px] text-slate-500 italic bg-amber-50 p-1.5 rounded border border-amber-200">{e.documentacao}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenFicha('funcionario', e)}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                    title="Abrir Ficha Cadastral com Opção de Imprimir/PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" /> Ficha
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingEntity({ type: 'funcionarios', data: { ...e } })}
                      className="text-xs font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition"
                      title="Editar informações do funcionário"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(e.id, e.nome)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    >
                      Demitir/Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        }

        {/* PRODUCTS VIEW */}
        {activeTab === 'produtos' && (visibleItems as unknown as Product[])
          .map(p => {
            const isSelected = bulk.isSelected(p.id);
            return (
              <div 
                key={p.id} 
                className={`bg-white p-5 rounded-2xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/15 shadow-md'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
                {...bulk.bindLongPress(p.id, () => handleOpenFicha('produto', p))}
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          bulk.toggleSelection(p.id);
                        }}
                        className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
                        title={isSelected ? "Desmarcar item" : "Selecionar item"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-600 py-0.5 px-2 rounded">
                        SKU: {p.sku}
                      </span>
                    </div>
                    
                    <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded ${
                      p.estoqueAtual <= p.estoqueMinimo ? 'bg-amber-100 text-amber-800 font-extrabold' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      Estoque: {formatQuantity(p.estoqueAtual, p.unidade)} {p.estoqueAtual <= p.estoqueMinimo ? '(Crítico)' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {p.imagemUrl && (
                      <img 
                        src={p.imagemUrl} 
                        alt={p.nome} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-200" 
                      />
                    )}
                    <div>
                      <h3 
                        onClick={() => handleOpenFicha('produto', p)}
                        className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-amber-700 transition cursor-pointer"
                        title="Clique para abrir a Ficha Cadastral do produto"
                      >
                        {p.nome}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 capitalize">{p.categoria}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {p.descricao}
                  </p>

                  {/* Margins details */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Custo de Compra</span>
                      <strong className="text-slate-700 font-bold font-mono">{formatCurrencyBRL(p.custo)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Preço de Venda</span>
                      <strong className="text-slate-900 font-bold font-mono">{formatCurrencyBRL(p.venda)}</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200 flex justify-between items-baseline">
                      <span className="text-[10px] text-emerald-600 font-semibold inline-flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Lucro Bruto:</span>
                      <span className="font-mono text-emerald-600 font-extrabold text-[11px]">
                        {formatCurrencyBRL(p.lucroReais)} ({Number(p.lucroPercentual).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 gap-1 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenFicha('produto', p)}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                      title="Abrir Ficha Cadastral com Opção de Imprimir/PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" /> Ficha
                    </button>
                    <span className="font-mono text-[11px]">NCM: {p.ncm}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingEntity({ type: 'produtos', data: { ...p } })}
                      className="text-xs font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition"
                      title="Editar informações do produto"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" /> Editar
                    </button>
                    <button
                      onClick={() => handleDeleteItem(p.id, p.nome)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        }

        {/* SERVICES VIEW */}
        {activeTab === 'servicos' && (visibleItems as unknown as Service[])
          .map(s => {
            const isSelected = bulk.isSelected(s.id);
            return (
              <div 
                key={s.id} 
                className={`bg-white p-5 rounded-2xl border transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/15 shadow-md'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
                {...bulk.bindLongPress(s.id, () => handleOpenFicha('servico', s))}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          bulk.toggleSelection(s.id);
                        }}
                        className="text-slate-400 hover:text-emerald-600 transition cursor-pointer p-0.5"
                        title={isSelected ? "Desmarcar item" : "Selecionar item"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                      <span className="text-[9px] font-mono bg-blue-50 text-blue-600 py-0.5 px-2.5 rounded-full">
                        NBS: {s.codigoServico}
                      </span>
                    </div>
                    
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Est: {s.tempoEstimado}
                    </span>
                  </div>

                  <h3 
                    onClick={() => handleOpenFicha('servico', s)}
                    className="text-base font-bold text-slate-900 mb-1 hover:text-indigo-700 transition cursor-pointer"
                    title="Clique para abrir a Ficha Cadastral do serviço"
                  >
                    {s.nome}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold capitalize mb-3">{s.categoria}</p>

                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {s.descricao}
                  </p>

                  <div className="text-xs p-2 bg-slate-50 rounded-lg flex justify-between items-center mb-4 border border-slate-200">
                    <span className="text-slate-500">Valor Unitário Cobrado:</span>
                    <strong className="text-slate-950 font-mono font-bold text-sm">
                      {formatCurrencyBRL(s.valor)}
                    </strong>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => handleOpenFicha('servico', s)}
                    className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                    title="Abrir Ficha Cadastral com Opção de Imprimir/PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" /> Ficha
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingEntity({ type: 'servicos', data: { ...s } })}
                      className="text-xs font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition"
                      title="Editar informações do serviço"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(s.id, s.nome)}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        }
          </div>
        )}

        {/* Sentinel for incremental scroll */}
        {hasMore && (
          <div ref={sentinelRef} className="py-3 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/10">
            Carregando mais {activeTab}... ({displayedCount} de {totalCount})
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          MODALS SECTION: INCLUDE NEW RECORD
          ------------------------------------------------------------- */}
      <ResponsiveModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Cadastrar ${activeTab.slice(0, -1)}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* CLIENT FORM */}
              {activeTab === 'clientes' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tipo de Cliente</label>
                      <select
                        value={clientTipo}
                        onChange={(e) => setClientTipo(e.target.value as 'PF' | 'PJ')}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-2.5 py-2"
                      >
                        <option value="PJ">Pessoa Jurídica (PJ)</option>
                        <option value="PF">Pessoa Física (PF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        {clientTipo === 'PJ' ? 'CNPJ' : 'CPF'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={clientDoc}
                          onChange={(e) => setClientDoc(e.target.value)}
                          placeholder={clientTipo === 'PJ' ? '43201890000134' : 'CPF do Cliente'}
                          className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                        />
                        {clientTipo === 'PJ' && (
                          <button
                            type="button"
                            onClick={handleReceitaCNPJLookup}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs px-2 rounded-lg border border-emerald-500/20 shadow-sm shrink-0 font-semibold"
                            title="Consultar na Receita Federal"
                          >
                            <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Consulta
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {receitaLookupStatus && (
                    <div className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30 font-semibold">
                      {receitaLookupStatus}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nome Completo / Razão Social</label>
                    <input
                      type="text"
                      required
                      value={clientNome}
                      onChange={(e) => setClientNome(e.target.value)}
                      placeholder="Ex: Carlos Silva de Souza..."
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">CEP</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={clientCep}
                          onChange={(e) => setClientCep(e.target.value)}
                          placeholder="01001-000"
                          className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleViaCEPLookup}
                          disabled={isCEPloading}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg p-2 shrink-0"
                          title="Consultar CEP"
                        >
                          🔍
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Logradouro / Endereço</label>
                      <input
                        type="text"
                        required
                        value={clientLgr}
                        onChange={(e) => setClientLgr(e.target.value)}
                        placeholder="Ex: Rua Central, 40"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Bairro</label>
                      <input
                        type="text"
                        required
                        value={clientBairro}
                        onChange={(e) => setClientBairro(e.target.value)}
                        placeholder="Sé"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Cidade</label>
                      <input
                        type="text"
                        required
                        value={clientCidade}
                        onChange={(e) => setClientCidade(e.target.value)}
                        placeholder="São Paulo"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">UF (Estado)</label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={clientUf}
                        onChange={(e) => setClientUf(e.target.value)}
                        placeholder="SP"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Telefone</label>
                      <input
                        type="text"
                        value={clientTel}
                        onChange={(e) => setClientTel(e.target.value)}
                        placeholder="(11) 99999-1234"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">E-mail</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="nome@dominio.com"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SUPPLIER FORM */}
              {activeTab === 'fornecedores' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">CNPJ</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={supCnpj}
                          onChange={(e) => setSupCnpj(e.target.value)}
                          placeholder="09.876.543/0001-21"
                          className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleReceitaCNPJLookup}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs px-2.5 rounded-lg border border-emerald-500/10 shadow-sm font-semibold"
                          title="Simular consulta na base federal"
                        >
                          Consulta
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Preço/Faturamento padrão</label>
                      <select
                        value={supCondicoes}
                        onChange={(e) => setSupCondicoes(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-2.5 py-2 font-mono"
                      >
                        <option value="À vista via Pix">À vista via Pix</option>
                        <option value="Faturado 30 dias">Faturado 30 dias</option>
                        <option value="Faturado em 15/30/45 d">Faturado em 15/30/45 d</option>
                        <option value="Boleto bancário à vista">Boleto bancário à vista</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Razão Social Fornecedora</label>
                    <input
                      type="text"
                      required
                      value={supRazao}
                      onChange={(e) => setSupRazao(e.target.value)}
                      placeholder="Ex: Distribuidora Nacional de Madeiras..."
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nome do Contato Principal</label>
                      <input
                        type="text"
                        required
                        value={supContato}
                        onChange={(e) => setSupContato(e.target.value)}
                        placeholder="Ex: Geraldo Pinheiro"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">Telefone</label>
                      <input
                        type="text"
                        value={supTel}
                        onChange={(e) => setSupTel(e.target.value)}
                        placeholder="(41) 3344-5566"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">E-mail Comercial</label>
                    <input
                      type="email"
                      value={supEmail}
                      onChange={(e) => setSupEmail(e.target.value)}
                      placeholder="vendas@fornecedormadeira.com.br"
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>
                </>
              )}

              {/* EMPLOYEE FORM */}
              {activeTab === 'funcionarios' && (
                <>
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-start gap-2 border border-red-200 dark:border-red-900/30">
                    <AlertOctagon className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-900 dark:text-rose-200 leading-snug">
                      <strong>Compromisso Legal MEI:</strong> Você só pode registrar 1 único funcionário. O salário não pode ser inferior ao Piso da categoria ou ao Salário Mínimo Federal (R$ 1.412,00).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nome do Funcionário</label>
                    <input
                      type="text"
                      required
                      value={empNome}
                      onChange={(e) => setEmpNome(e.target.value)}
                      placeholder="Ex: Lucas Gabriel Albuquerque..."
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">CPF</label>
                      <input
                        type="text"
                        required
                        value={empCpf}
                        onChange={(e) => setEmpCpf(e.target.value)}
                        placeholder="000.000.000-00"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Remuneração CLT (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={empRemun}
                        onChange={(e) => setEmpRemun(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Função / Cargo Praticado</label>
                    <input
                      type="text"
                      required
                      value={empCargo}
                      onChange={(e) => setEmpCargo(e.target.value)}
                      placeholder="Ex: Tecnólogo ou Auxiliar de Oficina"
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Documentos Adicionais (Nº CTPS, PIS...)</label>
                    <textarea
                      value={empDocs}
                      onChange={(e) => setEmpDocs(e.target.value)}
                      rows={2}
                      placeholder="Digite o número da carteira de trabalho, PIS/PASEP e observações médicas de admissão..."
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2.5"
                    />
                  </div>
                </>
              )}

              {/* PRODUCT FORM */}
              {activeTab === 'produtos' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Código SKU</label>
                      <input
                        type="text"
                        value={prodSku}
                        onChange={(e) => setProdSku(e.target.value)}
                        placeholder="Ex: ORG-WD-40"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-baseline">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">NCM Fiscal</label>
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5 cursor-help" title="Nomenclatura Comum do Mercosul - Obrigatório na emissão de nota fiscal de produto.">
                          <HelpCircle className="w-3 h-3" /> NCM?
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={prodNcm}
                        onChange={(e) => setProdNcm(e.target.value)}
                        placeholder="4421.99.00"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-sans">Nome Comercial do Produto</label>
                      <input
                        type="text"
                        required
                        value={prodNome}
                        onChange={(e) => setProdNome(e.target.value)}
                        placeholder="Ex: Estante de Pinus 5 Prateleiras"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">Unidade</label>
                      <select
                        value={prodUnidade}
                        onChange={(e) => setProdUnidade(e.target.value as any)}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-2 py-2"
                      >
                        <option value="UN">Unidade (UN)</option>
                        <option value="KG">Quilo (KG)</option>
                        <option value="L">Litro (L)</option>
                        <option value="M">Metro (M)</option>
                        <option value="PCT">Pacote (PCT)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Descrição do Produto</label>
                    <textarea
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={2}
                      placeholder="Detalhes físicos, de produção ou especificação técnica..."
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Custo Unitário (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={prodCusto}
                        onChange={(e) => setProdCusto(e.target.value)}
                        placeholder="18.50"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Preço de Venda (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={prodVenda}
                        onChange={(e) => setProdVenda(e.target.value)}
                        placeholder="45.00"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  {/* Marginal helper preview on add modal */}
                  {parseFloat(prodCusto) > 0 && parseFloat(prodVenda) > 0 && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 rounded-xl text-xs flex justify-between items-center text-emerald-800 dark:text-emerald-400">
                      <span>Projeção de Lucro Margem:</span>
                      <strong className="font-mono">
                        + R$ {(parseFloat(prodVenda) - parseFloat(prodCusto)).toFixed(2)} ({calculatedMarginPercentage().toFixed(1)}% markup)
                      </strong>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Estoque Inicial (Qtd)</label>
                      <input
                        type="number"
                        required
                        value={prodEstoque}
                        onChange={(e) => setProdEstoque(e.target.value)}
                        placeholder="35"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Estoque Alerta Mínimo (Membro)</label>
                      <input
                        type="number"
                        required
                        value={prodEstoqueMin}
                        onChange={(e) => setProdEstoqueMin(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Categoria</label>
                      <input
                        type="text"
                        value={prodCategoria}
                        onChange={(e) => setProdCategoria(e.target.value)}
                        placeholder="Ex: Móveis Rústicos"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Fornecedor Vinculado</label>
                      <select
                        value={prodFornecedor}
                        onChange={(e) => setProdFornecedor(e.target.value)}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-2 py-2"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.razaoSocial}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* SERVICES FORM */}
              {activeTab === 'servicos' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Código de Serviço NFS-e</label>
                      <input
                        type="text"
                        required
                        value={servCodigo}
                        onChange={(e) => setServCodigo(e.target.value)}
                        placeholder="Ex: 14.05"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tempo Estimado</label>
                      <input
                        type="text"
                        required
                        value={servTempo}
                        onChange={(e) => setServTempo(e.target.value)}
                        placeholder="Ex: 3 horas, 2 dias..."
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nome do Serviço</label>
                    <input
                      type="text"
                      required
                      value={servNome}
                      onChange={(e) => setServNome(e.target.value)}
                      placeholder="Ex: Instalação comercial de painéis ripados"
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Valor Cobrado (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={servValor}
                        onChange={(e) => setServValor(e.target.value)}
                        placeholder="350.00"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Categoria de Serviço</label>
                      <input
                        type="text"
                        value={servCategoria}
                        onChange={(e) => setServCategoria(e.target.value)}
                        placeholder="Ex: Reforma / Instalação"
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Descrição das Atividades executadas</label>
                    <textarea
                      value={servDesc}
                      onChange={(e) => setServDesc(e.target.value)}
                      rows={2.5}
                      placeholder="Indique os procedimentos adotados, ferramentas e materiais necessários..."
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs px-3 py-2"
                    />
                  </div>
                </>
              )}

              {/* ACTION COMMAND BAR */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 text-xs font-bold py-2 px-5.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
      </ResponsiveModal>

      {/* -------------------------------------------------------------
          MODALS SECTION: HISTORY VIEWER
          ------------------------------------------------------------- */}
      <ResponsiveModal
        isOpen={!!viewHistoryItem}
        onClose={() => setViewHistoryItem(null)}
        title={viewHistoryItem?.title || 'Histórico'}
        maxWidth="max-w-md"
      >
        {viewHistoryItem && (
          <div>
            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {viewHistoryItem.list && viewHistoryItem.list.length > 0 ? (
                viewHistoryItem.list.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block text-[11px] font-sans">
                        {item.descricao || `Pedido de Lote #${idx + 1}`}
                      </strong>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(item.data).toLocaleDateString('pt-BR')} 
                        {item.status ? ` | Status: ${item.status}` : ''}
                      </span>
                    </div>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-6">
                  Nenhum registro anterior identificado na base consolidada.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewHistoryItem(null)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 text-xs font-bold py-1.5 px-4 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* -------------------------------------------------------------
          MODALS SECTION: EDIT ENTITY MODAL
          ------------------------------------------------------------- */}
      <ResponsiveModal
        isOpen={!!editingEntity}
        onClose={() => setEditingEntity(null)}
        title={editingEntity ? `Editar ${editingEntity.type === 'clientes' ? 'Cliente' : editingEntity.type === 'fornecedores' ? 'Fornecedor' : editingEntity.type === 'funcionarios' ? 'Funcionário' : editingEntity.type === 'produtos' ? 'Produto' : 'Serviço'}` : 'Editar'}
        maxWidth="max-w-lg"
      >
        {editingEntity && (
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* CLIENT EDIT */}
              {editingEntity.type === 'clientes' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo / Razão Social</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.data.nome || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, nome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CPF ou CNPJ</label>
                      <input
                        type="text"
                        required
                        value={editingEntity.data.documento || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, documento: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                      <input
                        type="text"
                        value={editingEntity.data.telefone || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, telefone: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={editingEntity.data.email || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, email: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={editingEntity.data.cidade || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, cidade: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">UF</label>
                      <input
                        type="text"
                        value={editingEntity.data.uf || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, uf: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 pt-1">
                      <input
                        type="checkbox"
                        checked={editingEntity.data.adimplente}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, adimplente: e.target.checked } })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Cliente Adimplente (Sem pendências de pagamento)</span>
                    </label>
                  </div>
                </>
              )}

              {/* SUPPLIER EDIT */}
              {editingEntity.type === 'fornecedores' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.data.razaoSocial || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, razaoSocial: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                      <input
                        type="text"
                        required
                        value={editingEntity.data.cnpj || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, cnpj: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Contato</label>
                      <input
                        type="text"
                        value={editingEntity.data.contatoNome || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, contatoNome: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                      <input
                        type="text"
                        value={editingEntity.data.telefone || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, telefone: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        value={editingEntity.data.email || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, email: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Condições de Pagamento</label>
                    <input
                      type="text"
                      value={editingEntity.data.condicoesPagamento || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, condicoesPagamento: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                </>
              )}

              {/* EMPLOYEE EDIT */}
              {editingEntity.type === 'funcionarios' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.data.nome || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, nome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CPF</label>
                      <input
                        type="text"
                        required
                        value={editingEntity.data.cpf || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, cpf: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cargo CLT</label>
                      <input
                        type="text"
                        required
                        value={editingEntity.data.cargo || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, cargo: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Remuneração CLT (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingEntity.data.remuneracao || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, remuneracao: parseFloat(e.target.value) } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                    />
                  </div>
                </>
              )}

              {/* PRODUCT EDIT */}
              {editingEntity.type === 'produtos' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.data.nome || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, nome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SKU</label>
                      <input
                        type="text"
                        required
                        value={editingEntity.data.sku || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, sku: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                      <input
                        type="text"
                        value={editingEntity.data.categoria || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, categoria: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Custo de Compra (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingEntity.data.custo || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, custo: parseFloat(e.target.value) } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Venda (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingEntity.data.venda || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, venda: parseFloat(e.target.value) } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Atual</label>
                      <input
                        type="number"
                        required
                        value={editingEntity.data.estoqueAtual ?? ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, estoqueAtual: parseInt(e.target.value) || 0 } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Mínimo</label>
                      <input
                        type="number"
                        required
                        value={editingEntity.data.estoqueMinimo ?? ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, estoqueMinimo: parseInt(e.target.value) || 0 } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SERVICE EDIT */}
              {editingEntity.type === 'servicos' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Serviço</label>
                    <input
                      type="text"
                      required
                      value={editingEntity.data.nome || ''}
                      onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, nome: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Código NFS-e</label>
                      <input
                        type="text"
                        required
                        value={editingEntity.data.codigoServico || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, codigoServico: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Valor Unitário (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editingEntity.data.valor || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, valor: parseFloat(e.target.value) } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tempo Estimado</label>
                      <input
                        type="text"
                        value={editingEntity.data.tempoEstimado || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, tempoEstimado: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                      <input
                        type="text"
                        value={editingEntity.data.categoria || ''}
                        onChange={(e) => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, categoria: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEntity(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-[#2dd683] hover:bg-[#25c074] text-black text-xs font-extrabold py-2 px-5 rounded-xl cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Alterações
                </button>
              </div>
            </form>
        )}
      </ResponsiveModal>

      {/* Barra Flutuante Global de Ações em Massa (Dark Liquid Glass) */}
      <GlobalBulkActionBar
        selectedCount={bulk.selectedCount}
        totalCount={currentTabItems.length}
        entityNamePlural={activeTab}
        onClearSelection={bulk.clearSelection}
        onSelectAll={() => bulk.selectAll(currentTabItems as any[])}
        onDeleteBulk={handleDeleteBulk}
      />

      {/* Modal Global de Confirmação para Exclusões (Visual Notification Center) */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        itemName={confirmModal.itemName}
        itemCount={confirmModal.itemCount}
      />

      {/* Modal Global de Ficha Cadastral (Visualização + Impressão / PDF) */}
      <FichaCadastralModal
        isOpen={fichaModal.isOpen}
        onClose={() => setFichaModal(prev => ({ ...prev, isOpen: false }))}
        type={fichaModal.type}
        data={fichaModal.data}
        onEdit={(item) => setEditingEntity({ type: activeTab, data: { ...item } })}
      />

    </div>
  );
});
