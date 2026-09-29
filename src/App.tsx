/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  User, 
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
  Goal 
} from './types';

import { 
  USER_ROLES, 
  INITIAL_CLIENTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_EMPLOYEES, 
  INITIAL_PRODUCTS, 
  INITIAL_SERVICES, 
  PRE_STRUCTURED_CHART_OF_ACCOUNTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_STOCK_MOVEMENTS, 
  INITIAL_DAS, 
  INITIAL_INVOICES, 
  INITIAL_AUDIT_LOGS 
} from './mockData';

// Component imports
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { Cadastros } from './components/Cadastros';
import { ControleEstoque } from './components/ControleEstoque';
import { FluxoCaixa } from './components/FluxoCaixa';
import { PlanoDeContas } from './components/PlanoDeContas';
import { EmissaoNotas } from './components/EmissaoNotas';
import { Metas } from './components/Metas';
import { RelatoriosGerais } from './components/RelatoriosGerais';
import { ControleUsuarios } from './components/ControleUsuarios';
import { LogsAuditoria } from './components/LogsAuditoria';
import { OnboardingTour } from './components/OnboardingTour';
import { Header } from './components/Header';
import { DesktopSidebar } from './components/DesktopSidebar';
import { MobileNavigationDrawer } from './components/MobileNavigationDrawer';
import { CarrosselDicasMEI } from './components/CarrosselDicasMEI';
import { Configuracoes } from './components/Configuracoes';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FloatingSearchButton } from './components/FloatingSearchButton';
import { FloatingMobileMenuButton } from './components/FloatingMobileMenuButton';
import { NotificationDrawerModal } from './components/NotificationCenter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initLiquidPaintWorklet } from './lib/paintWorklet';
import { getLiquidWorkerClient } from './lib/liquidWorker';
import { motion, AnimatePresence } from 'motion/react';

// Google Workspace Integration helpers
import { getCachedToken, syncReportsToSheets, createCalendarEvent } from './lib/googleIntegration';

// Firestore database persistence helpers
import { fetchUserCollection, saveUserDocument, deleteUserDocument, auth, logOutFirebase } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Icon imports
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  FileText, 
  BookOpen, 
  BarChart, 
  Users, 
  ShieldAlert, 
  LogOut, 
  Lock,
  Menu,
  HelpCircle,
  Heart,
  Bell,
  Pin,
  PinOff,
  Target,
  HardDrive,
  User as UserIcon,
  Sparkles,
  Settings
} from 'lucide-react';

/**
 * Função pura fora do componente para cálculo da baseFrequency da distorção líquida.
 * Isola completamente o processamento matemático do ciclo do React e do DOM,
 * eliminando qualquer possibilidade de layout thrashing durante a rolagem.
 */
export function calculateLiquidBaseFrequency(scrollY: number): string {
  const freqX = (0.0032 + (scrollY % 140) * 0.00003).toFixed(5);
  const freqY = (0.038 + (scrollY % 100) * 0.0001).toFixed(4);
  return `${freqX} ${freqY}`;
}

/**
 * Função pura fora do componente para cálculo da escala dinâmica baseada no delta do scroll.
 */
export function calculateLiquidScale(deltaY: number, baseScale: number = 16, maxExtra: number = 8): number {
  const dynamicAdd = Math.min(maxExtra, Math.max(0, deltaY * 0.15));
  return baseScale + dynamicAdd;
}

export default function App() {
  // Interactive User States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(USER_ROLES);

  // Active Screen Selector
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [cadastrosInitialTab, setCadastrosInitialTab] = useState<'clientes' | 'fornecedores' | 'funcionarios' | 'produtos' | 'servicos'>('clientes');
  const [cadastrosAutoOpenAdd, setCadastrosAutoOpenAdd] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [shortcutFeedback, setShortcutFeedback] = useState<{ keys: string; label: string } | null>(null);

  // Sync Firebase Auth session on reload
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && !currentUser) {
        const restoredUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Empreendedor MEI',
          email: fbUser.email || 'usuario@meisimple.com.br',
          role: 'admin',
          permissions: {
            dashboard: true,
            cadastros: true,
            estoque: true,
            financeiro: true,
            notas: true,
            relatorios: true,
            configuracoes: true
          },
          document: '30.751.934/0001-30',
          cargo: 'Titular / Administrador MEI',
          dataAdmissao: new Date().toISOString().split('T')[0],
          status: 'ativo',
          foto: fbUser.photoURL || undefined
        };
        setCurrentUser(restoredUser);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Inicialização e controle do Paint Worklet para Distorção Líquida (CSS Houdini)
  // Substitui completamente a manipulação de atributos SVG feTurbulence e feDisplacementMap no DOM.
  // A renderização de refração ocorre em contexto de pintura isolado na GPU, sem layout thrashing nem loops rAF.
  useEffect(() => {
    initLiquidPaintWorklet();

    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    const BASE_SCALE = 16;
    let prevScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    // Define valores iniciais nas CSS Custom Properties consumidas pelo Paint Worklet
    document.documentElement.style.setProperty('--liquid-scale', String(BASE_SCALE));
    document.documentElement.style.setProperty('--liquid-scroll', String(Math.round(prevScrollY)));

    if (prefersReducedMotion) {
      return;
    }

    const onScroll = () => {
      const scrollY = window.scrollY;
      const deltaY = Math.abs(scrollY - prevScrollY);
      prevScrollY = scrollY;

      // Atualiza variáveis CSS diretamente no compositor (zero recálculos de layout, zero mutações SVG no DOM)
      document.documentElement.style.setProperty('--liquid-scroll', String(Math.round(scrollY)));

      // Ajuste dinâmico sutil da escala ótica durante aceleração do scroll
      if (deltaY > 2) {
        const dynamicScale = calculateLiquidScale(deltaY, BASE_SCALE, 8);
        document.documentElement.style.setProperty('--liquid-scale', String(Math.round(dynamicScale * 10) / 10));
      }

      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        document.documentElement.style.setProperty('--liquid-scale', String(BASE_SCALE));
      }, 100);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, []);

  // Collapsible and sticky sidebar layout state
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('MEISIMPLE_SIDEBAR_PINNED') || localStorage.getItem('GMEI_SIDEBAR_PINNED');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Restore/Sync pinning preference in localized database
  useEffect(() => {
    try {
      localStorage.setItem('MEISIMPLE_SIDEBAR_PINNED', String(sidebarPinned));
    } catch {
      // ignore
    }
    if (currentUser) {
      saveUserDocument('preferences', currentUser.id, { id: 'sidebarPinned', value: String(sidebarPinned) }).catch(() => {});
    }
  }, [sidebarPinned, currentUser]);

  // Core database states
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [categories, setCategories] = useState<FinancialCategory[]>(PRE_STRUCTURED_CHART_OF_ACCOUNTS);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(INITIAL_TRANSACTIONS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [dasPayments, setDasPayments] = useState<DASPayment[]>(INITIAL_DAS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Metas e Indicadores de Desempenho
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('MEI_GOALS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    // Metas iniciais (de exemplo realistas)
    return [
      { id: 'goal-annual', tipo: 'FATURAMENTO_ANUAL', valorAlvo: 81000, periodo: '2026', unidade: 'REAIS' },
      { id: 'goal-monthly', tipo: 'FATURAMENTO_MENSAL', valorAlvo: 6750, periodo: '2026-06', unidade: 'REAIS' },
      { id: 'goal-prod-1', tipo: 'VENDA_PRODUTO', targetId: 'prod-1', targetName: 'Armário de Cozinha Planejado', valorAlvo: 10, periodo: '2026-06', unidade: 'UNIDADES' },
      { id: 'goal-serv-1', tipo: 'VENDA_SERVICO', targetId: 'serv-1', targetName: 'Instalação de Ferragens', valorAlvo: 8, periodo: '2026-06', unidade: 'UNIDADES' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('MEI_GOALS', JSON.stringify(goals));
    if (currentUser) {
      (goals || []).forEach(item => {
        saveUserDocument('goals', currentUser.id, item).catch(() => {});
      });
    }
  }, [goals, currentUser]);

  // Firestore Auth-Based Sync & Initial Seeding Workflow
  useEffect(() => {
    if (!currentUser) return;

    async function syncFirestoreData() {
      const uid = currentUser.id;
      try {
        const [
          dbClients,
          dbSuppliers,
          dbEmployees,
          dbProducts,
          dbServices,
          dbCategories,
          dbTransactions,
          dbStockMovements,
          dbDasPayments,
          dbInvoices,
          dbAuditLogs,
          dbGoals,
          dbPreferences
        ] = await Promise.all([
          fetchUserCollection<Client>('clients', uid),
          fetchUserCollection<Supplier>('suppliers', uid),
          fetchUserCollection<Employee>('employees', uid),
          fetchUserCollection<Product>('products', uid),
          fetchUserCollection<Service>('services', uid),
          fetchUserCollection<FinancialCategory>('categories', uid),
          fetchUserCollection<FinancialTransaction>('transactions', uid),
          fetchUserCollection<StockMovement>('stockMovements', uid),
          fetchUserCollection<DASPayment>('dasPayments', uid),
          fetchUserCollection<Invoice>('invoices', uid),
          fetchUserCollection<AuditLog>('auditLogs', uid),
          fetchUserCollection<Goal>('goals', uid),
          fetchUserCollection<{ id: string, value: string }>('preferences', uid)
        ]);

        // Seed with standard/mock structures on first login, otherwise override with secure remote Firestore context
        if (dbClients.length > 0) {
          setClients(dbClients);
        } else {
          INITIAL_CLIENTS.forEach(item => saveUserDocument('clients', uid, item).catch(() => {}));
        }

        if (dbSuppliers.length > 0) {
          setSuppliers(dbSuppliers);
        } else {
          INITIAL_SUPPLIERS.forEach(item => saveUserDocument('suppliers', uid, item).catch(() => {}));
        }

        if (dbEmployees.length > 0) {
          setEmployees(dbEmployees);
        } else {
          INITIAL_EMPLOYEES.forEach(item => saveUserDocument('employees', uid, item).catch(() => {}));
        }

        if (dbProducts.length > 0) {
          setProducts(dbProducts);
        } else {
          INITIAL_PRODUCTS.forEach(item => saveUserDocument('products', uid, item).catch(() => {}));
        }

        if (dbServices.length > 0) {
          setServices(dbServices);
        } else {
          INITIAL_SERVICES.forEach(item => saveUserDocument('services', uid, item).catch(() => {}));
        }

        if (dbCategories.length > 0) {
          setCategories(dbCategories);
        } else {
          PRE_STRUCTURED_CHART_OF_ACCOUNTS.forEach(item => saveUserDocument('categories', uid, item).catch(() => {}));
        }

        if (dbTransactions.length > 0) {
          setTransactions(dbTransactions);
        } else {
          INITIAL_TRANSACTIONS.forEach(item => saveUserDocument('transactions', uid, item).catch(() => {}));
        }

        if (dbStockMovements.length > 0) {
          setStockMovements(dbStockMovements);
        } else {
          INITIAL_STOCK_MOVEMENTS.forEach(item => saveUserDocument('stockMovements', uid, item).catch(() => {}));
        }

        if (dbDasPayments.length > 0) {
          setDasPayments(dbDasPayments);
        } else {
          INITIAL_DAS.forEach(item => saveUserDocument('dasPayments', uid, item).catch(() => {}));
        }

        if (dbInvoices.length > 0) {
          const sanitizedInvoices = dbInvoices.map((inv, idx) => ({
            ...inv,
            id: (inv.id && typeof inv.id === 'string' && inv.id.trim()) ? inv.id : `inv-loaded-${idx}-${Date.now()}`
          }));
          setInvoices(sanitizedInvoices);
        } else {
          INITIAL_INVOICES.forEach(item => saveUserDocument('invoices', uid, item).catch(() => {}));
        }

        if (dbAuditLogs.length > 0) {
          setAuditLogs(dbAuditLogs);
        } else {
          INITIAL_AUDIT_LOGS.forEach(item => saveUserDocument('auditLogs', uid, item).catch(() => {}));
        }

        if (dbGoals.length > 0) {
          setGoals(dbGoals);
        } else {
          (goals || []).forEach(item => saveUserDocument('goals', uid, item).catch(() => {}));
        }

        // Apply loaded sidebar pinning preference
        const pinPreference = dbPreferences.find(p => p.id === 'sidebarPinned');
        if (pinPreference) {
          setSidebarPinned(pinPreference.value === 'true');
        }

      } catch (err) {
        console.error("Erro sincronizando Firestore, usando cache local/mock como fallback:", err);
      }
    }

    syncFirestoreData();
  }, [currentUser]);

  // Synchronized refs to allow stable callbacks without triggering re-render cascades
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const productsRef = useRef(products);
  productsRef.current = products;
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;
  const dasPaymentsRef = useRef(dasPayments);
  dasPaymentsRef.current = dasPayments;
  const invoicesRef = useRef(invoices);
  invoicesRef.current = invoices;
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  // Onboarding / Tutorial control
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  // Stories MEI modal control (Requisito 4)
  const [storiesOpen, setStoriesOpen] = useState(false);
  // Notification drawer modal control
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Requisito: Total de alertas urgentes (pagamentos em atraso ou prazos fiscais a vencer)
  const urgentNotificationsCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Despesas vencidas
    const overdueCount = transactions.filter(t => 
      t.tipo === 'DESPESA' && 
      t.status !== 'PAGO' && 
      t.status !== 'CANCELADO' && 
      (t.status === 'ATRASADO' || (t.status === 'PENDENTE' && t.dataVencimento && t.dataVencimento < todayStr))
    ).length;

    // Obrigações fiscais (DAS e tributos)
    const isTax = (t: FinancialTransaction) => {
      const cat = categories.find(c => c.id === t.categoriaId);
      const isTaxCat = cat && (cat.centroCusto === 'Tributário' || /das|tribut|imposto/i.test(cat.nome));
      return isTaxCat || /das|imposto|tributo|inss|icms|iss|simples nacional/i.test(t.descricao);
    };

    const pendingTaxTxCount = transactions.filter(t => isTax(t) && (t.status === 'PENDENTE' || t.status === 'ATRASADO')).length;
    const pendingDasCount = dasPayments.filter(d => d.status === 'PENDENTE' || d.status === 'ATRASADO').length;

    return overdueCount + Math.max(pendingTaxTxCount, pendingDasCount);
  }, [transactions, categories, dasPayments]);

  // Helper: append security history trail (memoized with stable reference)
  const addLog = useCallback((
    modulo: string, 
    acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'EXPORTACAO' | 'LOGIN' | 'ALTERACAO_SENHA', 
    descricao: string
  ) => {
    const user = currentUserRef.current;
    const freshLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      usuario: user?.name || 'Sistema Coletor',
      modulo,
      acao: acao as any,
      descricao,
      ip: '192.168.0.45'
    };
    setAuditLogs(prev => [freshLog, ...prev]);
    if (user) {
      saveUserDocument('auditLogs', user.id, freshLog).catch(() => {});
    }
  }, []);

  // Manipulador para atualizar e persistir foto de perfil do usuário (Requisito 4a)
  const handleUpdateUserPhoto = useCallback((photoDataUrl: string | undefined) => {
    setCurrentUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, foto: photoDataUrl };
      try {
        localStorage.setItem('MEISIMPLE_USER_PHOTO_' + updated.id, photoDataUrl || '');
      } catch (e) {
        // ignore
      }
      return updated;
    });
    if (currentUser) {
      setUsersList(prev => prev.map(u => u.id === currentUser.id ? { ...u, foto: photoDataUrl } : u));
    }
    addLog('Perfil', 'EDICAO', photoDataUrl ? 'Foto de perfil do usuário atualizada' : 'Foto de perfil removida');
  }, [currentUser, addLog]);

  // Restaura foto de perfil salva localmente para o usuário ativo
  useEffect(() => {
    if (currentUser && !currentUser.foto) {
      try {
        const savedPhoto = localStorage.getItem('MEISIMPLE_USER_PHOTO_' + currentUser.id);
        if (savedPhoto) {
          setCurrentUser(prev => prev ? { ...prev, foto: savedPhoto } : null);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [currentUser?.id]);

  // Google Workspace Automated Background Sync Handlers
  const triggerAutoSheetsSync = useCallback(async (
    currentTransactions: FinancialTransaction[],
    currentDAS: DASPayment[],
    currentInvoices: Invoice[]
  ) => {
    try {
      const isAuto = (localStorage.getItem('meisimple_auto_sync_sheets') || localStorage.getItem('gmei_auto_sync_sheets')) === 'true';
      if (!isAuto) return;
      
      const token = getCachedToken();
      if (!token) return;

      await syncReportsToSheets(
        token,
        '2026', // Sincroniza o exercício atual de 2026
        currentTransactions,
        categoriesRef.current,
        currentDAS,
        currentInvoices
      );
      
      addLog(
        'Relatorios', 
        'EXPORTACAO', 
        'Sincronização automática em segundo plano: Planilha Google atualizada!'
      );
    } catch (err: any) {
      console.warn('Sincronização automática em segundo plano com Google Sheets não concluída (serviço indisponível ou token pendente):', err?.message || err);
    }
  }, [addLog]);

  const triggerAutoCalendarSyncForInvoice = useCallback(async (invoice: Invoice) => {
    try {
      const isAuto = (localStorage.getItem('meisimple_auto_sync_calendar') || localStorage.getItem('gmei_auto_sync_calendar')) === 'true';
      if (!isAuto) return;

      const token = getCachedToken();
      if (!token) return;

      const titleStr = `Entrega de Nota Fiscal Nº ${invoice.numero} - ${invoice.destinatarioNome}`;
      const descStr = `Destinatário: ${invoice.destinatarioNome}\nCNPJ/CPF: ${invoice.destinatarioDocumento}\nValor Estimado: R$ ${invoice.valorTotal.toFixed(2)}\n\nLembrete automatizado gerado pelo MEI-Simple.`;

      const payload = {
        summary: titleStr,
        description: descStr,
        start: {
          date: invoice.dataEmissao
        },
        end: {
          date: invoice.dataEmissao
        }
      };

      await createCalendarEvent(token, payload);
      addLog(
        'Relatorios', 
        'EXPORTACAO', 
        `Agenda atualizada: Compromisso da NF nº ${invoice.numero} inserido automaticamente!`
      );
    } catch (err: any) {
      console.warn('Sincronização em segundo plano de NF com Google Agenda não concluída:', err?.message || err);
    }
  }, [addLog]);

  const triggerAutoCalendarSyncForDAS = useCallback(async (das: DASPayment) => {
    try {
      const isAuto = (localStorage.getItem('meisimple_auto_sync_calendar') || localStorage.getItem('gmei_auto_sync_calendar')) === 'true';
      if (!isAuto) return;

      const token = getCachedToken();
      if (!token) return;

      const titleStr = `DAS-MEI Simples Quitada: Ref ${das.periodoReferencia}`;
      const descStr = `Liquidação de imposto mensal confirmada e exportada automaticamente.\nValor recolhido: R$ ${das.valor.toFixed(2)}\nVencimento original: ${das.dataVencimento}\n\nLançado via MEI-Simple Inteligente.`;

      const payload = {
        summary: titleStr,
        description: descStr,
        start: {
          date: new Date().toISOString().split('T')[0]
        },
        end: {
          date: new Date().toISOString().split('T')[0]
        }
      };

      await createCalendarEvent(token, payload);
      addLog(
         'Relatorios', 
         'EXPORTACAO', 
         `Agenda atualizada: Comprovante de quitação do DAS ${das.periodoReferencia} inserido automaticamente!`
      );
    } catch (err: any) {
      console.warn('Sincronização em segundo plano de DAS com Google Agenda não concluída:', err?.message || err);
    }
  }, [addLog]);

  // -------------------------------------------------------------
  // STATE MANAGEMENT WORKFLOWS (CRUD HANDLERS MEMOIZED WITH USECALLBACK)
  // -------------------------------------------------------------
  
  // Clients CRUD
  const handleAddClient = useCallback((nc: Client) => {
    setClients(prev => [nc, ...prev]);
    const user = currentUserRef.current;
    if (user) saveUserDocument('clients', user.id, nc).catch(() => {});
  }, []);

  const handleUpdateClient = useCallback((updated: Client) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    const user = currentUserRef.current;
    if (user) saveUserDocument('clients', user.id, updated).catch(() => {});
  }, []);

  const handleDeleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    deleteUserDocument('clients', id).catch(() => {});
  }, []);

  // Suppliers CRUD
  const handleAddSupplier = useCallback((ns: Supplier) => {
    setSuppliers(prev => [ns, ...prev]);
    const user = currentUserRef.current;
    if (user) saveUserDocument('suppliers', user.id, ns).catch(() => {});
  }, []);

  const handleUpdateSupplier = useCallback((updated: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
    const user = currentUserRef.current;
    if (user) saveUserDocument('suppliers', user.id, updated).catch(() => {});
  }, []);

  const handleDeleteSupplier = useCallback((id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    deleteUserDocument('suppliers', id).catch(() => {});
  }, []);

  // Employees CRUD (MEI Max constraint is 1, handled in component)
  const handleAddEmployee = useCallback((ne: Employee) => {
    setEmployees(prev => [ne, ...prev]);
    const user = currentUserRef.current;
    if (user) saveUserDocument('employees', user.id, ne).catch(() => {});
  }, []);

  const handleUpdateEmployee = useCallback((updated: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
    const user = currentUserRef.current;
    if (user) saveUserDocument('employees', user.id, updated).catch(() => {});
  }, []);

  const handleDeleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    deleteUserDocument('employees', id).catch(() => {});
  }, []);

  // Products CRUD
  const handleAddProduct = useCallback((np: Product) => {
    setProducts(prev => [np, ...prev]);
    const user = currentUserRef.current;
    if (user) saveUserDocument('products', user.id, np).catch(() => {});
  }, []);

  const handleUpdateProduct = useCallback((updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    const user = currentUserRef.current;
    if (user) saveUserDocument('products', user.id, updated).catch(() => {});
  }, []);

  const handleDeleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    deleteUserDocument('products', id).catch(() => {});
  }, []);

  // Services CRUD
  const handleAddService = useCallback((ns: Service) => {
    setServices(prev => [ns, ...prev]);
    const user = currentUserRef.current;
    if (user) saveUserDocument('services', user.id, ns).catch(() => {});
  }, []);

  const handleUpdateService = useCallback((updated: Service) => {
    setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
    const user = currentUserRef.current;
    if (user) saveUserDocument('services', user.id, updated).catch(() => {});
  }, []);

  const handleDeleteService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    deleteUserDocument('services', id).catch(() => {});
  }, []);

  // Financial transactions CRUD
  const handleAddTransaction = useCallback((tx: Omit<FinancialTransaction, 'id'>) => {
    const fullTx: FinancialTransaction = {
      ...tx,
      id: `tr-${Date.now()}`
    };
    const user = currentUserRef.current;
    setTransactions(prev => {
      const updated = [fullTx, ...prev];
      triggerAutoSheetsSync(updated, dasPaymentsRef.current, invoicesRef.current);
      return updated;
    });
    if (user) {
      saveUserDocument('transactions', user.id, fullTx).catch(() => {});
    }

    // Also simulate updating DAS stats if a DAS expense occurs
    if (tx.categoriaId === 'cat-d3') {
      const parts = tx.descricao.split(' ');
      const matchedRef = parts[parts.length - 1] || '06/2026';
      setDasPayments(prev => {
        const updatedDas = prev.map(d => {
          if (d.periodoReferencia === matchedRef) {
            const upd = { ...d, status: 'PAGO' as const, dataPagamento: tx.data };
            if (user) {
              saveUserDocument('dasPayments', user.id, upd).catch(() => {});
            }
            return upd;
          }
          return d;
        });
        triggerAutoSheetsSync([fullTx, ...transactionsRef.current], updatedDas, invoicesRef.current);
        return updatedDas;
      });
    }
  }, [triggerAutoSheetsSync]);

  const handleUpdateTransactionStatus = useCallback((id: string, stat: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO') => {
    const user = currentUserRef.current;
    setTransactions(prev => {
      const updated = prev.map(tx => {
        if (tx.id === id) {
          const upd = { ...tx, status: stat };
          if (user) {
            saveUserDocument('transactions', user.id, upd).catch(() => {});
          }
          return upd;
        }
        return tx;
      });
      triggerAutoSheetsSync(updated, dasPaymentsRef.current, invoicesRef.current);
      return updated;
    });
  }, [triggerAutoSheetsSync]);

  const handleUploadReceipt = useCallback((id: string, name: string) => {
    const user = currentUserRef.current;
    setTransactions(prev => prev.map(tx => {
      if (tx.id === id) {
        const upd = { ...tx, comprovanteUrl: '#', comprovanteNome: name };
        if (user) {
          saveUserDocument('transactions', user.id, upd).catch(() => {});
        }
        return upd;
      }
      return tx;
    }));
  }, []);

  const handleImportTransactions = useCallback((tList: Omit<FinancialTransaction, 'id'>[]) => {
    const formatted = tList.map((item, id) => ({
      ...item,
      id: `tr-import-${Date.now()}-${id}`
    }));
    const user = currentUserRef.current;
    setTransactions(prev => {
      const updated = [...formatted, ...prev];
      triggerAutoSheetsSync(updated, dasPaymentsRef.current, invoicesRef.current);
      return updated;
    });
    if (user) {
      formatted.forEach(tx => {
        saveUserDocument('transactions', user.id, tx).catch(() => {});
      });
    }
  }, [triggerAutoSheetsSync]);

  // Stock movements
  const handleAddStockMovement = useCallback((sm: StockMovement) => {
    setStockMovements(prev => [sm, ...prev]);
    const user = currentUserRef.current;
    if (user) {
      saveUserDocument('stockMovements', user.id, sm).catch(() => {});
    }
  }, []);

  const handleDeleteStockMovement = useCallback((id: string) => {
    setStockMovements(prev => prev.filter(m => m.id !== id));
    deleteUserDocument('stockMovements', id).catch(() => {});
  }, []);

  const handleBulkDeleteStockMovements = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setStockMovements(prev => prev.filter(m => !idSet.has(m.id)));
    ids.forEach(id => {
      deleteUserDocument('stockMovements', id).catch(() => {});
    });
  }, []);

  const handleUpdateProductStock = useCallback((id: string, val: number) => {
    const user = currentUserRef.current;
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const upd = { ...p, estoqueAtual: val };
        if (user) {
          saveUserDocument('products', user.id, upd).catch(() => {});
        }
        return upd;
      }
      return p;
    }));
  }, []);

  // Co-accounts
  const handleAddCategory = useCallback((nc: FinancialCategory) => {
    setCategories(prev => [...prev, nc]);
    const user = currentUserRef.current;
    if (user) {
      saveUserDocument('categories', user.id, nc).catch(() => {});
    }
  }, []);

  const handleUpdateCategory = useCallback((id: string, fields: Partial<FinancialCategory>) => {
    const user = currentUserRef.current;
    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        const upd = { ...c, ...fields };
        if (user) {
          saveUserDocument('categories', user.id, upd).catch(() => {});
        }
        return upd;
      }
      return c;
    }));
  }, []);

  const handleDeleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    deleteUserDocument('categories', id).catch(() => {});
  }, []);

  // Invoices
  const handleEmitInvoice = useCallback((inv: Invoice | (Omit<Invoice, 'id'> & { id?: string })) => {
    const invoiceWithId: Invoice = {
      ...inv,
      id: (inv.id && typeof inv.id === 'string' && inv.id.trim())
        ? inv.id.trim()
        : `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };

    const user = currentUserRef.current;
    setInvoices(prev => {
      const updated = [invoiceWithId, ...prev];
      triggerAutoSheetsSync(transactionsRef.current, dasPaymentsRef.current, updated);
      return updated;
    });
    if (user) {
      saveUserDocument('invoices', user.id, invoiceWithId).catch((err) => {
        console.warn('Erro ao salvar nota no Firestore:', err);
      });
    }

    // Trigger auto calendar sync for this invoice
    triggerAutoCalendarSyncForInvoice(invoiceWithId);

    // If NF-e is issued, automatically update corresponding product stock amount
    if (invoiceWithId.tipo === 'NFE') {
      const prods = productsRef.current;
      const targetProd = prods.find(p => invoiceWithId.destinatarioNome.includes(p.nome) || (prods[0] && prods[0].id));
      if (targetProd) {
        const nextQty = Math.max(0, targetProd.estoqueAtual - 1);
        handleUpdateProductStock(targetProd.id, nextQty);
        handleAddStockMovement({
          id: `mov-auto-${Date.now()}`,
          productId: targetProd.id,
          tipo: 'SAIDA',
          quantidade: 1,
          data: new Date().toISOString().split('T')[0],
          motivo: `Emissão NF-e de venda nº ${invoiceWithId.numero}`,
          responsavel: user?.name || 'B2B Integrador'
        });
      }
    }
  }, [triggerAutoSheetsSync, triggerAutoCalendarSyncForInvoice, handleUpdateProductStock, handleAddStockMovement]);

  const handleCancelInvoice = useCallback((id: string) => {
    const user = currentUserRef.current;
    setInvoices(prev => {
      const updated = prev.map(inv => {
        if (inv.id === id) {
          const upd = { ...inv, status: 'CANCELADA' as const };
          if (user) {
            saveUserDocument('invoices', user.id, upd).catch(() => {});
          }
          return upd;
        }
        return inv;
      });
      triggerAutoSheetsSync(transactionsRef.current, dasPaymentsRef.current, updated);
      return updated;
    });
  }, [triggerAutoSheetsSync]);

  // DAS Tax payment
  const handlePayDAS = useCallback((id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const associatedDAS = dasPaymentsRef.current.find(d => d.id === id);
    const user = currentUserRef.current;

    setDasPayments(prev => {
      const updated = prev.map(d => {
        if (d.id === id) {
          const upd = { ...d, status: 'PAGO' as const, dataPagamento: todayStr };
          if (user) {
            saveUserDocument('dasPayments', user.id, upd).catch(() => {});
          }
          return upd;
        }
        return d;
      });
      triggerAutoSheetsSync(transactionsRef.current, updated, invoicesRef.current);
      return updated;
    });

    if (associatedDAS) {
      // Create Calendar event for matching paid DAS
      triggerAutoCalendarSyncForDAS({ ...associatedDAS, status: 'PAGO', dataPagamento: todayStr });

      // Launch corresponding accounting expense transaction
      handleAddTransaction({
        data: todayStr,
        dataVencimento: associatedDAS.dataVencimento,
        tipo: 'DESPESA',
        categoriaId: 'cat-d3',
        descricao: `Liquidação DAS Simples Nacional - Exercício ${associatedDAS.periodoReferencia}`,
        valor: associatedDAS.valor,
        status: 'PAGO'
      });
    }
  }, [triggerAutoSheetsSync, triggerAutoCalendarSyncForDAS, handleAddTransaction]);

  // System Users List management
  const handleAddUser = useCallback((nU: User) => {
    setUsersList(prev => [...prev, nU]);
  }, []);

  const handleDeleteUser = useCallback((id: string) => {
    setUsersList(prev => prev.filter(u => u.id !== id));
  }, []);

  const handleToggleUserStatus = useCallback((id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, ativo: u.ativo === false ? true : false } : u));
  }, []);

  const handleChangeUserRole = useCallback((id: string, role: any) => {
    const permissions = role === 'admin'
      ? { dashboard: true, cadastros: true, estoque: true, financeiro: true, notas: true, relatorios: true, configuracoes: true }
      : { dashboard: true, cadastros: true, estoque: true, financeiro: false, notas: true, relatorios: false, configuracoes: false };

    setUsersList(prev => prev.map(u => u.id === id ? { ...u, role, permissions } : u));
  }, []);

  // Handle successful logins
  const handleAuthSuccess = (selectedUser: User) => {
    setCurrentUser(selectedUser);
    // Open onboarding tour to assist the MEI on first experience
    setOnboardingOpen(true);
  };

  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleNavigate = useCallback((view: string) => {
    setActiveView(view);
  }, []);

  const handleTogglePin = useCallback(() => {
    setSidebarPinned(prev => !prev);
  }, []);

  const handleSidebarMouseEnter = useCallback(() => {
    setSidebarHovered(true);
  }, []);

  const handleSidebarMouseLeave = useCallback(() => {
    setSidebarHovered(false);
  }, []);

  const handleOpenOnboarding = useCallback(() => {
    setOnboardingOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    addLog('Autenticação', 'LOGIN', `Logout voluntário efetuado pelo operador ${currentUser?.name}`);
    logOutFirebase().catch(() => {});
    setCurrentUser(null);
    setActiveView('dashboard');
  }, [currentUser, addLog]);

  // Check custom roles to show lockout notice or disable views
  const [financeiroFilter, setFinanceiroFilter] = useState<{
    segment?: 'lancamentos' | 'pagar-receber' | 'reconciliacao' | 'projecoes';
    filterType?: 'TODOS' | 'RECEITA' | 'DESPESA';
  }>({});

  const hasViewPermission = useCallback((viewName: string): boolean => {
    if (!currentUser) return false;
    // Administrador role features no locks
    if (currentUser.role === 'admin') return true;

    // Auxiliary limits
    const mapping: Record<string, keyof User['permissions']> = {
      dashboard: 'dashboard',
      cadastros: 'cadastros',
      estoque: 'estoque',
      financeiro: 'financeiro',
      configuracoes: 'configuracoes',
      contas: 'configuracoes',
      fiscal: 'notas',
      obrigacoes: 'notas',
      das: 'notas',
      relatorios: 'relatorios',
      drive: 'configuracoes',
      usuarios: 'configuracoes',
      auditoria: 'configuracoes'
    };

    const permKey = mapping[viewName];
    if (permKey && currentUser.permissions) {
      return !!currentUser.permissions[permKey];
    }
    return true;
  }, [currentUser]);

  const handleDashboardNavigate = useCallback((v: string, params?: { segment?: 'lancamentos' | 'pagar-receber' | 'reconciliacao' | 'projecoes', filterType?: 'TODOS' | 'RECEITA' | 'DESPESA' }) => {
    if (params) {
      setFinanceiroFilter(params);
    }
    if (hasViewPermission(v)) {
      setActiveView(v);
    } else {
      alert('Esta seção é restrita e exige nível de privilégio superior.');
    }
  }, [hasViewPermission]);

  const handleMetasNavigate = useCallback((v: string) => {
    if (hasViewPermission(v)) {
      setActiveView(v);
    } else {
      alert('Esta seção é restrita e exige nível de privilégio superior.');
    }
  }, [hasViewPermission]);

  const hasLowStock = useMemo(() => {
    return products.some(p => p.estoqueAtual <= p.estoqueMinimo);
  }, [products]);

  const triggerShortcutFeedback = useCallback((keys: string, label: string) => {
    setShortcutFeedback({ keys, label });
    const timer = setTimeout(() => {
      setShortcutFeedback(null);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleTriggerShortcutAction = useCallback((actionKey: string) => {
    switch (actionKey) {
      case 'busca':
        setIsSearchOpen(true);
        break;
      case 'emitir-nota':
        handleNavigate('fiscal');
        break;
      case 'nova-venda':
        handleDashboardNavigate('financeiro', { segment: 'lancamentos', filterType: 'RECEITA' });
        break;
      case 'novo-gasto':
        handleDashboardNavigate('financeiro', { segment: 'lancamentos', filterType: 'DESPESA' });
        break;
      case 'dashboard':
        handleNavigate('dashboard');
        break;
      case 'estoque':
        handleNavigate('estoque');
        break;
      case 'cadastros':
        handleNavigate('cadastros');
        break;
      case 'shortcuts':
        setIsShortcutsOpen(true);
        break;
      default:
        break;
    }
  }, [handleNavigate, handleDashboardNavigate]);

  // Global Keyboard Shortcuts for Power-Users (Ctrl+K, Ctrl+N, Ctrl+B, Ctrl+G, Ctrl+D, Ctrl+E, ?)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );

      const isModifier = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl+K / Cmd+K: Busca Global
      if (isModifier && key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setIsSearchOpen(prev => !prev);
        triggerShortcutFeedback('Ctrl + K', 'Busca Global');
        return;
      }

      // Ctrl+N / Cmd+N: Emitir Nota Fiscal
      if (isModifier && key === 'n') {
        e.preventDefault();
        e.stopPropagation();
        handleNavigate('fiscal');
        triggerShortcutFeedback('Ctrl + N', 'Emitir Nota Fiscal');
        return;
      }

      // Ctrl+B / Cmd+B: Nova Venda / Receita
      if (isModifier && key === 'b') {
        e.preventDefault();
        e.stopPropagation();
        handleDashboardNavigate('financeiro', { segment: 'lancamentos', filterType: 'RECEITA' });
        triggerShortcutFeedback('Ctrl + B', 'Nova Venda / Receita');
        return;
      }

      // Ctrl+G / Cmd+G: Novo Gasto / Despesa
      if (isModifier && key === 'g') {
        e.preventDefault();
        e.stopPropagation();
        handleDashboardNavigate('financeiro', { segment: 'lancamentos', filterType: 'DESPESA' });
        triggerShortcutFeedback('Ctrl + G', 'Novo Gasto / Despesa');
        return;
      }

      // Ctrl+D / Cmd+D: Painel Principal
      if (isModifier && key === 'd') {
        e.preventDefault();
        e.stopPropagation();
        handleNavigate('dashboard');
        triggerShortcutFeedback('Ctrl + D', 'Painel Geral');
        return;
      }

      // Ctrl+E / Cmd+E: Estoque
      if (isModifier && key === 'e') {
        e.preventDefault();
        e.stopPropagation();
        handleNavigate('estoque');
        triggerShortcutFeedback('Ctrl + E', 'Controle de Estoque');
        return;
      }

      // Alt+C ou Ctrl+Shift+C: Cadastros
      if ((e.altKey && key === 'c') || (isModifier && e.shiftKey && key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        handleNavigate('cadastros');
        triggerShortcutFeedback('Alt + C', 'Cadastros Gerais');
        return;
      }

      // '?' ou Ctrl+/ / Ctrl+H: Guia de Atalhos
      if ((!isModifier && e.key === '?' && !isInputActive) || (isModifier && (key === 'h' || key === '/'))) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleNavigate, handleDashboardNavigate, triggerShortcutFeedback]);

  if (!currentUser) {
    return <AuthPage onLoginSuccess={handleAuthSuccess} addLog={addLog} />;
  }

  return (
    <div className="bg-slate-900 min-h-screen h-screen overflow-hidden font-sans antialiased text-slate-100 selection:bg-[#2dd683]/30 relative">
      
      {/* SVG FILTER ELEMENT DE ALTA PERFORMANCE (LENTE ÓTICA DARK LIQUID GLASS) */}
      <svg 
        id="liquid-header-svg-filter" 
        className="sr-only pointer-events-none absolute" 
        aria-hidden="true" 
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter 
            id="liquid-distortion" 
            x="-20%" 
            y="-20%" 
            width="140%" 
            height="140%"
          >
            <feTurbulence 
              type="turbulence" 
              baseFrequency="0.002 0.002" 
              numOctaves="1" 
              result="turbulence" 
              seed="2"
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="turbulence" 
              scale="18" 
              xChannelSelector="R" 
              yChannelSelector="B" 
            />
          </filter>
        </defs>
      </svg>

      {/* HEADER BAR COM POSICIONAMENTO ABSOLUTAMENTE FIXO */}
      <Header
        onNavigate={handleNavigate}
        onOpenTutorial={handleOpenOnboarding}
        onOpenOnboarding={handleOpenOnboarding}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        activeView={activeView}
        urgentNotificationsCount={urgentNotificationsCount}
      />

      {/* SIDEBAR NAVIGATION: DESKTOP PANEL ABSOLUTAMENTE FIXO */}
      <DesktopSidebar 
        activeView={activeView}
        onNavigate={handleNavigate}
        sidebarPinned={sidebarPinned}
        sidebarHovered={sidebarHovered}
        onTogglePin={handleTogglePin}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        clientsCount={clients.length}
        suppliersCount={suppliers.length}
        hasLowStock={hasLowStock}
        hasViewPermission={hasViewPermission}
        currentUser={currentUser}
        onUpdateUserPhoto={handleUpdateUserPhoto}
        onOpenStories={() => setStoriesOpen(true)}
        onLogout={handleLogout}
      />

      {/* MOBILE NAVIGATION OVERLAY DRAWER */}
      <MobileNavigationDrawer 
        isOpen={mobileMenuOpen}
        onClose={handleCloseMobileMenu}
        activeView={activeView}
        onNavigate={handleNavigate}
        hasViewPermission={hasViewPermission}
        currentUser={currentUser}
        users={usersList}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          addLog('Autenticação', 'LOGIN', `Operador alternado para ${user.name}`);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTutorial={handleOpenOnboarding}
        onOpenOnboarding={handleOpenOnboarding}
        onOpenStories={() => setStoriesOpen(true)}
        onUpdateUserPhoto={handleUpdateUserPhoto}
        onLogout={handleLogout}
      />

      {/* ÁREA DE CONTEÚDO PRINCIPAL - ÚNICA PARTE ROLÁVEL DA PÁGINA */}
      <main className="main-content-scroll h-[calc(100vh-80px)] overflow-y-auto ml-2 mr-2 mt-[calc(64px+16px)] md:ml-[calc(256px+20mm)] md:mr-[10mm] md:mt-[calc(64px+20mm)] pr-1 md:pr-2 pb-16 flex flex-col justify-between custom-scrollbar">
        <div className="w-full flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {activeView === 'dashboard' && (
            <ErrorBoundary
              moduleName="Dashboard"
              onGoHome={() => setActiveView('dashboard')}
            >
              <Dashboard 
                clients={clients}
                products={products}
                categories={categories}
                transactions={transactions}
                dasPayments={dasPayments}
                goals={goals}
                onUpdateGoals={setGoals}
                services={services}
                stockMovements={stockMovements}
                invoices={invoices}
                onNavigate={handleDashboardNavigate}
                onAddTransaction={handleAddTransaction}
                currentUserRole={currentUser?.role || 'admin'}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
              />
            </ErrorBoundary>
          )}

          {activeView === 'metas' && (
            <ErrorBoundary
              moduleName="Metas"
              onGoHome={() => setActiveView('dashboard')}
            >
              <Metas
                products={products}
                services={services}
                transactions={transactions}
                stockMovements={stockMovements}
                invoices={invoices}
                goals={goals}
                onUpdateGoals={setGoals}
                onNavigate={handleMetasNavigate}
              />
            </ErrorBoundary>
          )}

          {activeView === 'cadastros' && (
            <ErrorBoundary
              moduleName="Cadastros"
              onGoHome={() => setActiveView('dashboard')}
            >
              <Cadastros
                clients={clients}
                suppliers={suppliers}
                employees={employees}
                products={products}
                services={services}
                onAddClient={handleAddClient}
                onAddSupplier={handleAddSupplier}
                onAddEmployee={handleAddEmployee}
                onAddProduct={handleAddProduct}
                onAddService={handleAddService}
                onUpdateClient={handleUpdateClient}
                onUpdateSupplier={handleUpdateSupplier}
                onUpdateEmployee={handleUpdateEmployee}
                onUpdateProduct={handleUpdateProduct}
                onUpdateService={handleUpdateService}
                onDeleteClient={handleDeleteClient}
                onDeleteSupplier={handleDeleteSupplier}
                onDeleteEmployee={handleDeleteEmployee}
                onDeleteProduct={handleDeleteProduct}
                onDeleteService={handleDeleteService}
                addLog={addLog}
                initialTab={cadastrosInitialTab}
                autoOpenAdd={cadastrosAutoOpenAdd}
              />
            </ErrorBoundary>
          )}

          {activeView === 'estoque' && (
            <ErrorBoundary
              moduleName="Estoque"
              onGoHome={() => setActiveView('dashboard')}
            >
              <ControleEstoque
                products={products}
                stockMovements={stockMovements}
                onAddMovement={handleAddStockMovement}
                onUpdateProductStock={handleUpdateProductStock}
                onDeleteMovement={handleDeleteStockMovement}
                onBulkDeleteMovements={handleBulkDeleteStockMovements}
                currentUser={currentUser}
                addLog={addLog}
                onOpenNewProduct={() => {
                  setCadastrosInitialTab('produtos');
                  setCadastrosAutoOpenAdd(true);
                  setActiveView('cadastros');
                }}
              />
            </ErrorBoundary>
          )}

          {activeView === 'financeiro' && (
            <ErrorBoundary
              moduleName="Fluxo de Caixa"
              onGoHome={() => setActiveView('dashboard')}
            >
              <FluxoCaixa
                transactions={transactions}
                categories={categories}
                onAddTransaction={handleAddTransaction}
                onUpdateTransactionStatus={handleUpdateTransactionStatus}
                onUploadReceipt={handleUploadReceipt}
                onImportTransactions={handleImportTransactions}
                addLog={addLog}
                initialSegment={financeiroFilter.segment}
                initialFilterType={financeiroFilter.filterType}
              />
            </ErrorBoundary>
          )}

          {activeView === 'contas' && (
            <ErrorBoundary
              moduleName="Plano de Contas"
              onGoHome={() => setActiveView('dashboard')}
            >
              <PlanoDeContas
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                addLog={addLog}
              />
            </ErrorBoundary>
          )}

          {(activeView === 'fiscal' || activeView === 'obrigacoes' || activeView === 'das') && (
            <ErrorBoundary
              moduleName="Fiscal & DAS"
              onGoHome={() => setActiveView('dashboard')}
            >
              <EmissaoNotas
                initialTab={activeView === 'obrigacoes' || activeView === 'das' ? 'das' : 'nfe'}
                invoices={invoices}
                clients={clients}
                products={products}
                services={services}
                dasPayments={dasPayments}
                onPayDAS={handlePayDAS}
                onEmitInvoice={handleEmitInvoice}
                onCancelInvoice={handleCancelInvoice}
                addLog={addLog}
                onNavigate={handleNavigate}
              />
            </ErrorBoundary>
          )}

          {activeView === 'relatorios' && (
            <ErrorBoundary
              moduleName="Relatórios"
              onGoHome={() => setActiveView('dashboard')}
            >
              <RelatoriosGerais
                transactions={transactions}
                categories={categories}
                products={products}
                dasPayments={dasPayments}
                clients={clients}
                invoices={invoices}
                onPayDAS={handlePayDAS}
                addLog={addLog}
                currentUser={currentUser}
              />
            </ErrorBoundary>
          )}

          {activeView === 'usuarios' && (
            <ErrorBoundary
              moduleName="Controle de Usuários"
              onGoHome={() => setActiveView('dashboard')}
            >
              <ControleUsuarios
                users={usersList}
                currentUser={currentUser}
                dasPayments={dasPayments}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onToggleUserStatus={handleToggleUserStatus}
                onChangeUserRole={handleChangeUserRole}
                addLog={addLog}
              />
            </ErrorBoundary>
          )}

          {activeView === 'auditoria' && (
            <ErrorBoundary
              moduleName="Auditoria"
              onGoHome={() => setActiveView('dashboard')}
            >
              <LogsAuditoria logs={auditLogs} />
            </ErrorBoundary>
          )}

          {activeView === 'configuracoes' && (
            <ErrorBoundary
              moduleName="Configurações"
              onGoHome={() => setActiveView('dashboard')}
            >
              <Configuracoes
                currentUser={currentUser}
                usersList={usersList}
                auditLogs={auditLogs}
                dasPayments={dasPayments}
                categories={categories}
                clients={clients}
                suppliers={suppliers}
                employees={employees}
                products={products}
                services={services}
                transactions={transactions}
                stockMovements={stockMovements}
                invoices={invoices}
                goals={goals}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
                onToggleUserStatus={handleToggleUserStatus}
                onChangeUserRole={handleChangeUserRole}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                addLog={addLog}
              />
            </ErrorBoundary>
          )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FOOTER GENERAL CREDIT - Rola junto com o conteúdo no final da página */}
        <footer className="w-full glass-panel-3d py-4 px-4 sm:px-6 md:px-8 mt-8 mb-4 text-slate-400 text-xs rounded-3xl shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-center md:text-left select-none">
            <p className="font-semibold text-slate-200">© {new Date().getFullYear()} MEI-Simple - Gestão Inteligente e Descomplicada para o MEI.</p>
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-slate-400">
              <span>Desenvolvido sob padrões de usabilidade e LGPD. Feito com</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline shrink-0 animate-pulse" />
              <span>para o empreendedor brasileiro.</span>
            </div>
          </div>
        </footer>
      </main>

      {/* CARROSSEL / STORIES DE DICAS OBRIGATÓRIAS DO MEI (REQUISITO 4: OVERLAY TELA CHEIA AO SER ACIONADO) */}
      <CarrosselDicasMEI 
        isOpen={storiesOpen}
        onClose={() => setStoriesOpen(false)}
        companyCnpj="30.751.934/0001-30"
        companyName="Carlos Oliveira - Marcenaria MEI"
      />

      {/* OVERLAY INTERACTIVE TUTORIAL TOUR ASSISTANT */}
      <OnboardingTour 
        isOpen={onboardingOpen} 
        onClose={() => setOnboardingOpen(false)} 
        activeView={activeView}
        setActiveView={setActiveView}
        setSidebarPinned={setSidebarPinned}
      />

      {/* REQUISITO 5: BOTÃO FLUTUANTE DE MENU NO MOBILE (AO LADO DO BOTÃO DE PESQUISA) */}
      <FloatingMobileMenuButton 
        onClick={handleToggleMobileMenu} 
        isOpen={mobileMenuOpen}
      />

      {/* REQUISITO 2: BOTÃO FLUTUANTE DE PESQUISA COM ÍCONE PRETO #000000 */}
      <FloatingSearchButton onClick={() => setIsSearchOpen(true)} />

      {/* GLOBAL SEARCH MODAL */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(view) => {
          setActiveView(view);
          setIsSearchOpen(false);
        }}
        clients={clients}
        suppliers={suppliers}
        products={products}
        services={services}
        invoices={invoices}
        dasPayments={dasPayments}
        transactions={transactions}
      />

      {/* REQUISITO: NOTIFICATION DRAWER MODAL COM INDICADORES VISUAIS DE PRAZOS FISCAIS E CONTAS VENCIDAS */}
      <NotificationDrawerModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        transactions={transactions}
        dasPayments={dasPayments}
        categories={categories}
        onNavigate={(view, params) => {
          setActiveView(view);
          setIsNotificationsOpen(false);
          if (params && params.segment) {
            setFinanceiroFilter(params);
          }
        }}
      />

      {/* POWER-USER KEYBOARD SHORTCUTS MODAL / CHEAT SHEET */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        onTriggerAction={handleTriggerShortcutAction}
      />

      {/* POWER-USER KEYBOARD SHORTCUT HUD TOAST */}
      <AnimatePresence>
        {shortcutFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.16 }}
            className="fixed bottom-6 right-6 z-50 pointer-events-none glass-panel-3d bg-[#0f1722]/95 border border-[#2dd683]/50 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-white backdrop-blur-xl"
          >
            <span className="w-2 h-2 rounded-full bg-[#2dd683] animate-ping shrink-0" />
            <kbd className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-black/60 text-emerald-300 border border-emerald-500/40 shadow-xs">
              {shortcutFeedback.keys}
            </kbd>
            <span className="text-xs font-bold text-slate-200">
              {shortcutFeedback.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
