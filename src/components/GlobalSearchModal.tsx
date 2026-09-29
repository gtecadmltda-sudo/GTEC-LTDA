import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { 
  Search, 
  X, 
  User, 
  Package, 
  FileText, 
  Receipt, 
  ArrowRight, 
  Calendar, 
  Sparkles, 
  Hammer, 
  Truck,
  History,
  Clock,
  Trash2,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Supplier, Product, Service, Invoice, DASPayment, FinancialTransaction } from '../types';

export interface GlobalSearchModalProps {
  clients?: Client[];
  suppliers?: Supplier[];
  products?: Product[];
  services?: Service[];
  invoices?: Invoice[];
  dasPayments?: DASPayment[];
  transactions?: FinancialTransaction[];
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export type SearchFilterCategory = 
  | 'TODOS' 
  | 'CLIENTES' 
  | 'PRODUTOS' 
  | 'NOTAS' 
  | 'FORNECEDORES' 
  | 'SERVICOS' 
  | 'DAS' 
  | 'COMPROVANTES';

interface SearchResultItem {
  id: string;
  category: 'CLIENTE' | 'FORNECEDOR' | 'PRODUTO' | 'SERVICO' | 'NOTA_FISCAL' | 'COMPROVANTE' | 'DAS';
  categoryFilter: SearchFilterCategory;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  extraInfo?: string;
  targetView: string;
  rawObj?: any;
}

const RECENT_SEARCHES_STORAGE_KEY = 'meisimple_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const GlobalSearchModal = memo(function GlobalSearchModal({
  clients = [],
  suppliers = [],
  products = [],
  services = [],
  invoices = [],
  dasPayments = [],
  transactions = [],
  onNavigate,
  isOpen,
  onClose
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SearchFilterCategory>('TODOS');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch (e) {
      console.error('Falha ao carregar buscas recentes', e);
    }
  }, [isOpen]);

  // Save a search query to recent searches (max 5)
  const saveRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) return;

    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Falha ao salvar busca recente', e);
      }
      return next;
    });
  }, []);

  // Remove single recent search
  const handleRemoveRecentSearch = useCallback((searchToRemove: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentSearches(prev => {
      const next = prev.filter(item => item !== searchToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Falha ao remover item de busca recente', err);
      }
      return next;
    });
  }, []);

  // Clear all recent searches
  const handleClearAllRecent = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch (err) {
      console.error('Falha ao limpar histórico de buscas', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedFilter('TODOS');
    }
  }, [isOpen]);

  // Global shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute all matching items before category filter (to provide category counts)
  const allMatchingResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // 1. Clientes
    (clients || []).forEach(c => {
      const match = !q || 
        c.nome.toLowerCase().includes(q) ||
        c.documento.toLowerCase().includes(q) ||
        (c.cidade && c.cidade.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.telefone && c.telefone.toLowerCase().includes(q));

      if (match) {
        results.push({
          id: `cli-${c.id}`,
          category: 'CLIENTE',
          categoryFilter: 'CLIENTES',
          title: c.nome,
          subtitle: `${c.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: ${c.documento} • ${c.cidade || 'Cidade não inf.'} - ${c.uf || 'UF'}`,
          badge: 'Cliente',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          extraInfo: c.adimplente ? 'Adimplente' : 'Pendente',
          targetView: 'cadastros',
          rawObj: c
        });
      }
    });

    // 2. Produtos
    (products || []).forEach(p => {
      const match = !q ||
        p.nome.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.descricao && p.descricao.toLowerCase().includes(q)) ||
        (p.categoria && p.categoria.toLowerCase().includes(q));

      if (match) {
        results.push({
          id: `prod-${p.id}`,
          category: 'PRODUTO',
          categoryFilter: 'PRODUTOS',
          title: p.nome,
          subtitle: `SKU: ${p.sku} • Estoque: ${p.estoqueAtual} ${p.unidade} • ${p.categoria || 'Geral'}`,
          badge: 'Produto',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          extraInfo: `R$ ${p.venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          targetView: 'estoque',
          rawObj: p
        });
      }
    });

    // 3. Notas Fiscais (Invoices)
    (invoices || []).forEach(inv => {
      const match = !q ||
        inv.numero.toLowerCase().includes(q) ||
        inv.destinatarioNome.toLowerCase().includes(q) ||
        inv.destinatarioDocumento.toLowerCase().includes(q) ||
        inv.tipo.toLowerCase().includes(q) ||
        (inv.discriminacao && inv.discriminacao.toLowerCase().includes(q));

      if (match) {
        results.push({
          id: `inv-${inv.id}`,
          category: 'NOTA_FISCAL',
          categoryFilter: 'NOTAS',
          title: `${inv.tipo === 'NFE' ? 'NF-e' : 'NFS-e'} Nº ${inv.numero}`,
          subtitle: `Destinatário: ${inv.destinatarioNome} • Emissão: ${inv.dataEmissao}`,
          badge: inv.tipo === 'NFE' ? 'NF-e' : 'NFS-e',
          badgeColor: inv.tipo === 'NFE' ? 'bg-[#004AAD]/10 text-[#004AAD] border-[#004AAD]/20' : 'bg-[#5E17EB]/10 text-[#5E17EB] border-[#5E17EB]/20',
          extraInfo: `R$ ${inv.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          targetView: 'fiscal',
          rawObj: inv
        });
      }
    });

    // 4. Fornecedores
    (suppliers || []).forEach(s => {
      const match = !q ||
        s.razaoSocial.toLowerCase().includes(q) ||
        s.cnpj.toLowerCase().includes(q) ||
        (s.contatoNome && s.contatoNome.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.telefone && s.telefone.toLowerCase().includes(q));

      if (match) {
        results.push({
          id: `sup-${s.id}`,
          category: 'FORNECEDOR',
          categoryFilter: 'FORNECEDORES',
          title: s.razaoSocial,
          subtitle: `CNPJ: ${s.cnpj} • Contato: ${s.contatoNome || 'Não inf.'}`,
          badge: 'Fornecedor',
          badgeColor: 'bg-indigo-50 text-[#004AAD] border-indigo-200',
          extraInfo: s.condicoesPagamento || 'Fornecedor',
          targetView: 'cadastros',
          rawObj: s
        });
      }
    });

    // 5. Serviços
    (services || []).forEach(s => {
      const match = !q ||
        s.nome.toLowerCase().includes(q) ||
        (s.descricao && s.descricao.toLowerCase().includes(q)) ||
        (s.categoria && s.categoria.toLowerCase().includes(q)) ||
        (s.codigoServico && s.codigoServico.toLowerCase().includes(q));

      if (match) {
        results.push({
          id: `srv-${s.id}`,
          category: 'SERVICO',
          categoryFilter: 'SERVICOS',
          title: s.nome,
          subtitle: `Tempo: ${s.tempoEstimado || 'Sob consulta'} • ${s.categoria || 'Serviço MEI'}`,
          badge: 'Serviço',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          extraInfo: `R$ ${s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          targetView: 'cadastros',
          rawObj: s
        });
      }
    });

    // 6. Guias DAS
    (dasPayments || []).forEach(das => {
      const match = !q ||
        das.periodoReferencia.toLowerCase().includes(q) ||
        'das'.includes(q) ||
        'imposto'.includes(q) ||
        das.status.toLowerCase().includes(q);

      if (match) {
        results.push({
          id: `das-${das.id}`,
          category: 'DAS',
          categoryFilter: 'DAS',
          title: `Guia DAS MEI - ${das.periodoReferencia}`,
          subtitle: `Vencimento: ${das.dataVencimento} • Status: ${das.status === 'PAGO' ? 'Pago' : 'Pendente'}`,
          badge: 'DAS MEI',
          badgeColor: das.status === 'PAGO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
          extraInfo: `R$ ${das.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          targetView: 'fiscal',
          rawObj: das
        });
      }
    });

    // 7. Transações com Comprovante
    (transactions || []).filter(t => t.comprovanteNome || t.comprovanteUrl).forEach(tx => {
      const match = !q ||
        tx.descricao.toLowerCase().includes(q) ||
        (tx.comprovanteNome && tx.comprovanteNome.toLowerCase().includes(q)) ||
        'comprovante'.includes(q) ||
        'recibo'.includes(q);

      if (match) {
        results.push({
          id: `tx-${tx.id}`,
          category: 'COMPROVANTE',
          categoryFilter: 'COMPROVANTES',
          title: `Comprovante: ${tx.descricao}`,
          subtitle: `Arquivo: ${tx.comprovanteNome || 'comprovante.pdf'} • Data: ${tx.data}`,
          badge: 'Anexo',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          extraInfo: `R$ ${tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          targetView: 'financeiro',
          rawObj: tx
        });
      }
    });

    return results;
  }, [query, clients, suppliers, products, services, invoices, dasPayments, transactions]);

  // Counts for each category filter based on the current search
  const categoryCounts = useMemo(() => {
    const counts: Record<SearchFilterCategory, number> = {
      TODOS: allMatchingResults.length,
      CLIENTES: 0,
      PRODUTOS: 0,
      NOTAS: 0,
      FORNECEDORES: 0,
      SERVICOS: 0,
      DAS: 0,
      COMPROVANTES: 0
    };

    allMatchingResults.forEach(r => {
      if (counts[r.categoryFilter] !== undefined) {
        counts[r.categoryFilter]++;
      }
    });

    return counts;
  }, [allMatchingResults]);

  // Final filtered list based on the active category filter
  const searchResults = useMemo<SearchResultItem[]>(() => {
    if (selectedFilter === 'TODOS') {
      return allMatchingResults;
    }
    return allMatchingResults.filter(r => r.categoryFilter === selectedFilter);
  }, [allMatchingResults, selectedFilter]);

  // Keyboard navigation within results
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        saveRecentSearch(query);
      }
      if (searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    if (query.trim()) {
      saveRecentSearch(query);
    } else {
      saveRecentSearch(item.title);
    }
    onNavigate(item.targetView);
    onClose();
  };

  const renderIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'CLIENTE':
        return <User className="w-4 h-4 text-emerald-600" />;
      case 'FORNECEDOR':
        return <Truck className="w-4 h-4 text-[#004AAD]" />;
      case 'PRODUTO':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'SERVICO':
        return <Hammer className="w-4 h-4 text-purple-600" />;
      case 'NOTA_FISCAL':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'DAS':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'COMPROVANTE':
        return <Receipt className="w-4 h-4 text-slate-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  const filterTabs: Array<{ id: SearchFilterCategory; label: string; icon: React.ReactNode }> = [
    { id: 'TODOS', label: 'Todos', icon: <Filter className="w-3 h-3" /> },
    { id: 'CLIENTES', label: 'Clientes', icon: <User className="w-3 h-3" /> },
    { id: 'PRODUTOS', label: 'Produtos', icon: <Package className="w-3 h-3" /> },
    { id: 'NOTAS', label: 'Notas Fiscais', icon: <FileText className="w-3 h-3" /> },
    { id: 'FORNECEDORES', label: 'Fornecedores', icon: <Truck className="w-3 h-3" /> },
    { id: 'SERVICOS', label: 'Serviços', icon: <Hammer className="w-3 h-3" /> },
    { id: 'DAS', label: 'Guias DAS', icon: <Calendar className="w-3 h-3" /> },
    { id: 'COMPROVANTES', label: 'Comprovantes', icon: <Receipt className="w-3 h-3" /> }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center p-0 sm:pt-20 sm:px-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: '100%' }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: '100%' }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_e, info) => {
            if (info.offset.y > 80 || info.velocity.y > 250) {
              onClose();
            }
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white rounded-t-[32px] sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh] sm:max-h-[80vh]"
          onKeyDown={handleKeyDownList}
        >
          {/* Mobile Drag Indicator (iOS WhatsApp style) */}
          <div className="w-full flex flex-col items-center pt-2.5 pb-1 sm:hidden cursor-grab active:cursor-grabbing select-none bg-slate-50/70 border-b border-slate-100">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Arraste para baixo para fechar</span>
          </div>

          {/* Header & Search Input */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/70">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
              <Search className="w-5 h-5 text-white" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  saveRecentSearch(query);
                }
              }}
              placeholder="Pesquisar clientes, produtos, notas fiscais, DAS..."
              className="flex-1 bg-transparent text-slate-900 text-sm sm:text-base font-semibold placeholder-slate-400 focus:outline-none"
            />

            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer shadow-2xs"
            >
              ESC
            </button>
          </div>

          {/* RECENT SEARCHES BAR (Persisted in localStorage, max 5) */}
          {recentSearches.length > 0 && (
            <div className="px-4 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-bold text-[11px]">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Recentes:</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {recentSearches.map((item, idx) => (
                  <div
                    key={`${item}-${idx}`}
                    className="group inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-xl bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-medium transition cursor-pointer shadow-2xs shrink-0"
                    onClick={() => {
                      setQuery(item);
                      setSelectedIndex(0);
                      inputRef.current?.focus();
                    }}
                  >
                    <Clock className="w-3 h-3 text-slate-400 group-hover:text-slate-700" />
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{item}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentSearch(item, e)}
                      className="p-0.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
                      title="Remover do histórico"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleClearAllRecent}
                  className="text-[10px] text-slate-400 hover:text-rose-600 hover:underline px-1.5 py-1 whitespace-nowrap cursor-pointer font-semibold shrink-0"
                  title="Limpar todas as buscas recentes"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* FILTER BAR TO NARROW RESULTS BY CATEGORY (Clients, Products, Invoices, etc.) */}
          <div className="px-3.5 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs font-bold text-slate-600 scrollbar-none">
            {filterTabs.map((tab) => {
              const count = categoryCounts[tab.id];
              const isSelected = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(tab.id);
                    setSelectedIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 text-xs ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : count > 0 
                        ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className={isSelected ? 'text-white' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100">
            {searchResults.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Nenhum resultado encontrado {selectedFilter !== 'TODOS' ? `na categoria ${filterTabs.find(t => t.id === selectedFilter)?.label}` : ''}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {selectedFilter !== 'TODOS' ? (
                    <button
                      type="button"
                      onClick={() => setSelectedFilter('TODOS')}
                      className="text-emerald-600 hover:underline font-bold mt-1 inline-block cursor-pointer"
                    >
                      Remover filtro de categoria e buscar em todos os registros
                    </button>
                  ) : (
                    'Tente buscar por nome de cliente, CNPJ, produto, SKU ou número de nota fiscal.'
                  )}
                </p>
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border border-emerald-200/80 shadow-xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                        {renderIcon(item.category)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.extraInfo && (
                        <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {item.extraInfo}
                        </span>
                      )}
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts Info */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium px-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">↓</kbd> Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">↵</kbd> Acessar
              </span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono shadow-2xs">ESC</kbd> Fechar
              </span>
            </div>
            <span className="font-bold text-slate-700">
              {searchResults.length} {searchResults.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default GlobalSearchModal;
