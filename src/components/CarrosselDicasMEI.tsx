import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  BookOpen,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export interface MEITip {
  id: string;
  title: string;
  category: 'FINANCAS' | 'TRIBUTARIO' | 'VENDAS' | 'LEGISLACAO' | 'GESTAO';
  categoryLabel: string;
  categoryColor: string;
  source: 'Sebrae' | 'Portal do Empreendedor' | 'Serasa' | 'Receita Federal' | 'INSS / Previdência';
  sourceBadgeColor: string;
  sourceUrl: string;
  imageUrl: string;
  summary: string;
  actionText: string;
}

// Catálogo curado de fontes oficiais e reconhecidas (Sebrae, Portal do Empreendedor, Serasa, Receita Federal)
const EXTERNAL_TIPS_DATABASE: MEITip[] = [
  {
    id: 'tip-sebrae-fluxo-caixa',
    title: 'Separação de Contas: Como Blindar o Fluxo de Caixa do MEI',
    category: 'FINANCAS',
    categoryLabel: 'Educação Financeira',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    source: 'Sebrae',
    sourceBadgeColor: 'bg-[#004AAD]/10 text-[#004AAD] border-[#004AAD]/30',
    sourceUrl: 'https://sebrae.com.br/sites/PortalSebrae/ufs/sp/artigos/como-separar-as-contas-pessoais-e-da-empresa,3114d4e0b3884810VgnVCM100000d701210aRCRD',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    summary: 'Misturar despesas pessoais com o caixa da empresa é o principal motivo de falência nos primeiros 2 anos. Mantenha uma conta corrente exclusiva PJ e defina um pró-labore fixo mensal.',
    actionText: 'Ler Guia Oficial no Sebrae'
  },
  {
    id: 'tip-portal-dasn-simei',
    title: 'Declaração Anual DASN-SIMEI: Prazos e Cuidados com o Limite',
    category: 'TRIBUTARIO',
    categoryLabel: 'Obrigações Fiscais',
    categoryColor: 'bg-amber-50 text-amber-700 border-amber-200',
    source: 'Portal do Empreendedor',
    sourceBadgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    sourceUrl: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/declaracao-anual-de-faturamento',
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    summary: 'A declaração anual deve conter toda a receita bruta de comércio, indústria e serviços obtida no ano anterior. O teto MEI é de R$ 81.000,00 anuais (ou proporcional aos meses de atividade).',
    actionText: 'Acessar Portal do Empreendedor'
  },
  {
    id: 'tip-serasa-score-pj',
    title: 'Construindo Score PJ e Evitando Negativações Comerciais',
    category: 'FINANCAS',
    categoryLabel: 'Crédito e Reputação',
    categoryColor: 'bg-blue-50 text-blue-700 border-blue-200',
    source: 'Serasa',
    sourceBadgeColor: 'bg-purple-50 text-[#5E17EB] border-purple-200',
    sourceUrl: 'https://www.serasa.com.br/ensina/score/o-que-e-score-cnpj-e-como-consultar/',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    summary: 'Pagar boletos de fornecedores e o DAS em dia fortalece o cadastro positivo da sua empresa, liberando taxas de juros até 40% menores em financiamentos de equipamentos e veículos.',
    actionText: 'Consultar Orientações Serasa'
  },
  {
    id: 'tip-receita-nfse-nacional',
    title: 'NFS-e Nacional de Padrão Único: Emissão Obrigatória para Serviços',
    category: 'LEGISLACAO',
    categoryLabel: 'Normas Tributárias',
    categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    source: 'Receita Federal',
    sourceBadgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
    sourceUrl: 'https://www.gov.br/nfse/pt-br',
    imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    summary: 'Todos os MEIs prestadores de serviços no Brasil devem emitir suas notas fiscais exclusivamente pelo emissor nacional da Receita Federal. O MEI é isento quando presta serviço para pessoa física.',
    actionText: 'Acessar Emissor Nacional Gov.br'
  },
  {
    id: 'tip-inss-previdencia-beneficios',
    title: 'Previdência do MEI: Auxílio-Doença, Aposentadoria e Salário-Maternidade',
    category: 'LEGISLACAO',
    categoryLabel: 'Seguridade Social',
    categoryColor: 'bg-teal-50 text-teal-700 border-teal-200',
    source: 'INSS / Previdência',
    sourceBadgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
    sourceUrl: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/direitos-e-obrigacoes/previdencia-social',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
    summary: 'Ao pagar o DAS em dia, 5% do salário mínimo vai para o INSS, garantindo aposentadoria por idade, pensão por morte, salário-maternidade e auxílio por incapacidade temporária.',
    actionText: 'Ver Tabela de Direitos Previdenciários'
  },
  {
    id: 'tip-sebrae-precificacao',
    title: 'Como Calcular o Preço de Venda Sem Deixar Dinheiro na Mesa',
    category: 'GESTAO',
    categoryLabel: 'Gestão de Negócios',
    categoryColor: 'bg-purple-50 text-purple-700 border-purple-200',
    source: 'Sebrae',
    sourceBadgeColor: 'bg-[#004AAD]/10 text-[#004AAD] border-[#004AAD]/30',
    sourceUrl: 'https://sebrae.com.br/sites/PortalSebrae/ufs/sp/artigos/como-calcular-o-preco-de-venda-do-seu-produto-ou-servico,3e6f987299a94810VgnVCM100000d701210aRCRD',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    summary: 'O preço certo deve cobrir o custo da mercadoria, as despesas fixas da oficina/escritório, o imposto do MEI e ainda gerar margem de lucro líquida para novos investimentos.',
    actionText: 'Baixar Calculadora no Sebrae'
  },
  {
    id: 'tip-sebrae-vendas-whatsapp',
    title: 'WhatsApp Business: Catálogo, Mensagens Automáticas e Vendas',
    category: 'VENDAS',
    categoryLabel: 'Crescimento e Vendas',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    source: 'Sebrae',
    sourceBadgeColor: 'bg-[#004AAD]/10 text-[#004AAD] border-[#004AAD]/30',
    sourceUrl: 'https://sebrae.com.br/sites/PortalSebrae/ufs/sp/artigos/como-usar-o-whatsapp-business-para-vender-mais,4f39567990145810VgnVCM100000d701210aRCRD',
    imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?auto=format&fit=crop&w=800&q=80',
    summary: 'Configure respostas rápidas para orçamentos e crie seu catálogo de produtos no perfil comercial. Empresas que atendem em menos de 10 minutos convertem 3x mais clientes.',
    actionText: 'Ver Dicas de Atendimento Sebrae'
  },
  {
    id: 'tip-serasa-golpe-boleto',
    title: 'Alerta Antifraude: Como Identificar Boletos Falsos de Cobrança do MEI',
    category: 'TRIBUTARIO',
    categoryLabel: 'Segurança e Conformidade',
    categoryColor: 'bg-rose-50 text-rose-700 border-rose-200',
    source: 'Serasa',
    sourceBadgeColor: 'bg-purple-50 text-[#5E17EB] border-purple-200',
    sourceUrl: 'https://www.serasa.com.br/ensina/protecao-de-dados/golpe-do-mei-falso-como-se-proteger/',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    summary: 'O MEI não é obrigado a pagar taxas de associações comerciais, sindicatos ou cadastramentos que chegam por e-mail ou correio. A única guia obrigatória é o DAS oficial gerado pelo PGMEI.',
    actionText: 'Ler Alerta Completo no Serasa'
  },
  {
    id: 'tip-portal-funcionario-mei',
    title: 'Contratação de 1 Funcionário pelo MEI: Regras do eSocial e Encargos',
    category: 'LEGISLACAO',
    categoryLabel: 'Recursos Humanos',
    categoryColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    source: 'Portal do Empreendedor',
    sourceBadgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    sourceUrl: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/contratacao-de-empregado',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    summary: 'O MEI pode contratar um único empregado que receba o salário mínimo nacional ou o piso da categoria. O custo é de 3% para a Previdência Social e 8% para o FGTS via DAE do eSocial.',
    actionText: 'Guia de Contratação no Portal'
  },
  {
    id: 'tip-sebrae-controle-estoque',
    title: 'Gestão Inteligente de Estoque: Giro, Curva ABC e Ponto de Pedido',
    category: 'GESTAO',
    categoryLabel: 'Operações e Logística',
    categoryColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    source: 'Sebrae',
    sourceBadgeColor: 'bg-[#004AAD]/10 text-[#004AAD] border-[#004AAD]/30',
    sourceUrl: 'https://sebrae.com.br/sites/PortalSebrae/ufs/sp/artigos/controle-de-estoque-o-que-e-e-como-fazer,7449279090145810VgnVCM100000d701210aRCRD',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    summary: 'Estoque parado é dinheiro sem rendimento. Identifique seus 20% de itens que geram 80% das vendas e estabeleça um estoque mínimo com alertas de recompra automatizados.',
    actionText: 'Acessar Ferramenta do Sebrae'
  }
];

export interface CarrosselDicasMEIProps {
  companyCnpj?: string;
  companyName?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface StoredCompanyTips {
  companyCnpj: string;
  generatedAt: number; // timestamp em milissegundos
  tips: MEITip[];
  historyIds: string[];
}

const STORAGE_KEY_PREFIX = 'MEISIMPLE_DICAS_EMPRESA_';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const AUTOPLAY_INTERVAL_MS = 6500; // 6.5s por slide

export const CarrosselDicasMEI = memo(function CarrosselDicasMEI({
  companyCnpj = '30.751.934/0001-30',
  companyName = 'Carlos Oliveira - Marcenaria MEI',
  isOpen = false,
  onClose
}: CarrosselDicasMEIProps) {
  const [tips, setTips] = useState<MEITip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Normalização do CNPJ da empresa para isolamento estrito
  const cleanCnpj = companyCnpj.replace(/\D/g, '') || '30751934000130';
  const storageKey = `${STORAGE_KEY_PREFIX}${cleanCnpj}`;

  // Função para selecionar 5 dicas externas não repetidas baseadas na empresa
  const generateFreshTipsForCompany = useCallback((excludeIds: string[] = []): { newTips: MEITip[], updatedHistory: string[] } => {
    let pool = EXTERNAL_TIPS_DATABASE.filter(t => !excludeIds.includes(t.id));
    
    // Se esgotar a rotação, limpa o histórico e reinicia
    if (pool.length < 5) {
      pool = [...EXTERNAL_TIPS_DATABASE];
      excludeIds = [];
    }

    // Embaralha o pool de forma determinística
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    const newHistory = Array.from(new Set([...excludeIds, ...selected.map(s => s.id)]));

    return {
      newTips: selected,
      updatedHistory: newHistory
    };
  }, []);

  // Carregamento e sincronização com ciclo de 24 horas atrelado à empresa
  const loadOrSyncCompanyTips = useCallback((forceRefresh: boolean = false) => {
    try {
      const now = Date.now();
      const rawStored = localStorage.getItem(storageKey);
      
      if (rawStored && !forceRefresh) {
        const parsed: StoredCompanyTips = JSON.parse(rawStored);
        const age = now - parsed.generatedAt;

        // Se ainda está dentro do prazo de 24h e possui exatamente 5 dicas válidas
        if (age < TWENTY_FOUR_HOURS_MS && parsed.tips && parsed.tips.length === 5) {
          setTips(parsed.tips);
          setLastGeneratedAt(parsed.generatedAt);
          return;
        }
      }

      // Passou de 24 horas ou refresh forçado: gerar novo conjunto de 5 dicas sem repetir
      let previousHistory: string[] = [];
      if (rawStored) {
        try {
          const parsed: StoredCompanyTips = JSON.parse(rawStored);
          previousHistory = parsed.historyIds || [];
        } catch {
          // ignore
        }
      }

      const { newTips, updatedHistory } = generateFreshTipsForCompany(previousHistory);

      const stateToSave: StoredCompanyTips = {
        companyCnpj: cleanCnpj,
        generatedAt: now,
        tips: newTips,
        historyIds: updatedHistory
      };

      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      setTips(newTips);
      setLastGeneratedAt(now);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Erro ao sincronizar dicas externas do MEI:', err);
      // Fallback seguro de 5 dicas
      const fallback = EXTERNAL_TIPS_DATABASE.slice(0, 5);
      setTips(fallback);
    }
  }, [storageKey, cleanCnpj, generateFreshTipsForCompany]);

  // Inicialização no ciclo de vida
  useEffect(() => {
    loadOrSyncCompanyTips();
  }, [loadOrSyncCompanyTips]);

  // Autoplay com intervalo fixo e pausa no hover
  useEffect(() => {
    if (isPaused || tips.length === 0) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 5);
    }, AUTOPLAY_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, tips.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + 5) % 5);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % 5);
  };

  // Suporte a swipe por toque no mobile
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null) {
      const threshold = 40;
      if (touchDeltaX.current < -threshold) {
        handleNext();
      } else if (touchDeltaX.current > threshold) {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setIsPaused(false);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadOrSyncCompanyTips(true);
      setIsRefreshing(false);
    }, 450);
  };

  if (!isOpen || tips.length === 0) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Stories de Dicas Oficiais do MEI"
    >
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <section 
        id="secao-carrossel-dicas-mei"
        aria-label="Carrossel de Dicas Oficiais do MEI"
        className="relative z-10 w-full max-w-4xl my-auto select-none"
      >
      {/* SVG FILTER ELEMENT DE FALLBACK (SEM MUTAÇÕES NO DOM, USADO APENAS CASO PAINT WORKLET NÃO SEJA SUPORTADO) */}
      <svg 
        id="carrossel-liquid-svg-filter" 
        className="sr-only pointer-events-none absolute" 
        aria-hidden="true" 
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter id="carrossel-liquid-distortion" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.028 0.038" 
              numOctaves="2" 
              result="turbulence" 
              seed="7"
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="turbulence" 
              scale="0" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </defs>
      </svg>

      {/* PRIMEIRO CONTÊINER COM EFEITO LIQUID GLASS INTEGRANDO CABEÇALHO E SLIDES */}
      <div 
        id="carrossel-dicas-liquid-container"
        className="relative carrossel-liquid-glass rounded-3xl p-4 sm:p-6 overflow-hidden transition-all shadow-xs touch-pan-y"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Barra de Progresso Autoplay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
          <motion.div 
            key={currentIndex + (isPaused ? '-paused' : '')}
            initial={{ width: '0%' }}
            animate={{ width: isPaused ? '100%' : '100%' }}
            transition={{ 
              duration: isPaused ? 0 : AUTOPLAY_INTERVAL_MS / 1000, 
              ease: 'linear' 
            }}
            className="h-full bg-gradient-to-r from-[#2dd683] to-emerald-400"
          />
        </div>

        {/* CABEÇALHO DENTRO DO PRIMEIRO CONTÊINER: Ícone + "Stories do MEI" + Botão Atualizar + Novo Botão Fechar */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#2dd683] to-emerald-600 text-black flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Stories do MEI
              </h3>
              <span className="text-[10px] text-emerald-300 font-semibold hidden sm:inline">
                Dicas & Orientações Oficiais
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÃO DE ATUALIZAR DICAS (EXISTENTE) */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-[#2dd683] transition shadow-2xs cursor-pointer disabled:opacity-50 flex items-center justify-center active:scale-95"
              title="Atualizar dicas (24h)"
              aria-label="Atualizar dicas"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2dd683]' : ''}`} />
            </button>

            {/* NOVO BOTÃO DE FECHAR (REQUISITO 4) */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/40 border border-white/20 text-white hover:text-rose-200 transition shadow-2xs cursor-pointer flex items-center justify-center active:scale-95"
                title="Fechar Stories e retornar à tela anterior"
                aria-label="Fechar Stories"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* TRILHA DESLIZANTE DO CARROSSEL COM PEEKING DAS LATERAIS */}
        <div className="relative overflow-hidden py-1">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(calc(-${currentIndex * 88}% + ${6}%))`
            }}
          >
            {tips.map((tip, index) => {
              const isActive = index === currentIndex;
              return (
                <div
                  key={tip.id}
                  onClick={() => {
                    if (!isActive) setCurrentIndex(index);
                  }}
                  style={{ width: '88%' }}
                  className={`shrink-0 px-2 sm:px-3 transition-all duration-500 ${
                    isActive 
                      ? 'opacity-100 scale-100 cursor-default' 
                      : 'opacity-40 scale-[0.96] hover:opacity-70 cursor-pointer'
                  }`}
                >
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 md:p-8 min-h-[320px] md:min-h-[360px] flex items-center">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-7 items-center w-full">
                      
                      {/* LADO ESQUERDO: IMAGEM ILUSTRATIVA */}
                      <div className="md:col-span-5 relative group">
                        <div className="relative aspect-16/10 md:aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs h-full min-h-[180px] md:min-h-[260px]">
                          <img
                            src={tip.imageUrl}
                            alt={tip.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          {/* Selo sobre a imagem */}
                          <div className="absolute top-2.5 left-2.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-xs ${tip.categoryColor} backdrop-blur-xs bg-white/95`}>
                              {tip.categoryLabel}
                            </span>
                          </div>
                          {/* Badge da Fonte na Imagem */}
                          <div className="absolute bottom-2.5 right-2.5">
                            <span className="bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                              <BookOpen className="w-3 h-3 text-[#2dd683]" />
                              {tip.source}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* LADO DIREITO: TEXTO DA DICA + FONTE + BOTÃO DE AÇÃO */}
                      <div className="md:col-span-7 flex flex-col justify-between h-full space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${tip.sourceBadgeColor}`}>
                              Fonte Externa: <strong>{tip.source}</strong>
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Dica {index + 1} de 5
                            </span>
                          </div>

                          <h4 className="text-base sm:text-lg md:text-xl font-black text-slate-900 leading-tight">
                            {tip.title}
                          </h4>

                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl line-clamp-3 sm:line-clamp-none">
                            {tip.summary}
                          </p>
                        </div>

                        {/* BOTÃO DE AÇÃO: ABRE EM NOVA GUIA A MATÉRIA OFICIAL */}
                        <div className="pt-2 flex items-center gap-3 flex-wrap">
                          <a
                            href={tip.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer hover:gap-2.5"
                            title={`Abrir conteúdo completo em ${tip.source}`}
                          >
                            <span>{tip.actionText}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#2dd683]" />
                          </a>

                          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                            Matéria oficial • Sem intermediários
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NAVEGAÇÃO CIRCULAR COM EXATAMENTE 5 INDICADORES FIXOS (BOLINHAS LOGO ABAIXO) */}
        <div 
          className="flex items-center justify-center gap-2 mt-4"
          role="tablist"
          aria-label="Indicadores de slides de dicas"
        >
          {[0, 1, 2, 3, 4].map((index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Ir para dica ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-200 cursor-pointer rounded-full flex items-center justify-center ${
                  isActive 
                    ? 'w-7 h-3 bg-white rounded-full' 
                    : 'w-3 h-3 bg-white/35 hover:bg-white/55'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-[#2dd683] rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
    </div>
  );
});
