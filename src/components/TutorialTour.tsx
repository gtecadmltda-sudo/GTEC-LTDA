/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  AlertCircle,
  SkipForward,
  CheckCircle2
} from 'lucide-react';

export interface TutorialTourStep {
  title: string;
  content: string;
  target?: string;
  tip?: string;
}

// Catálogo de passos contextuais por página/módulo do sistema
const CONTEXTUAL_PAGE_STEPS: Record<string, { pageTitle: string; steps: TutorialTourStep[] }> = {
  dashboard: {
    pageTitle: 'Painel Geral',
    steps: [
      {
        title: 'Faturamento & Termômetro de Limite MEI',
        target: '#tour-dashboard-card-limite',
        content: 'Monitore em tempo real seu faturamento acumulado no ano fiscal contra o teto oficial do MEI de R$ 81.000,00. As barras dinâmicas alertam em 75% (atenção) e 90% (crítico) para evitar desenquadramento involuntário.',
        tip: 'Dica MEI: O desenquadramento por excesso de faturamento pode retroagir ao início do ano se ultrapassar 20% do limite.'
      },
      {
        title: 'Fluxo de Caixa Operacional',
        target: '#tour-fluxo-caixa',
        content: 'Visualize entradas, saídas e saldo líquido consolidado. O gráfico interativo com escala de amortecimento permite acompanhar a rentabilidade diária com precisão cirúrgica.',
        tip: 'Dica MEI: Nunca misture o cartão de crédito pessoal com os lançamentos da marcenaria/oficina PJ.'
      },
      {
        title: 'Saúde Financeira e Diagnóstico',
        target: '#saude-financeira-card',
        content: 'Diagnóstico automatizado que avalia a liquidez, margem de lucro e cobertura de despesas fixas da sua empresa com recomendações práticas.',
        tip: 'Dica MEI: O capital de giro ideal para o MEI deve cobrir pelo menos 3 meses de despesas fixas operacionais.'
      },
      {
        title: 'Alertas de Conformidade e Guia DAS',
        target: '#tour-das-pendente',
        content: 'Acompanhe o vencimento da sua Guia DAS do Simples Nacional todo dia 20. Pague via PIX ou boleto diretamente e mantenha seus benefícios previdenciários ativos.',
        tip: 'Dica MEI: O atraso do DAS cancela benefícios como auxílio-doença e salário-maternidade do INSS.'
      },
      {
        title: 'Faturamento Mensal (D3)',
        target: '#tour-monthly-chart',
        content: 'Gráfico D3 de alta resolução que ocupa a largura total da página, ilustrando a curva de receitas e conformidade dos últimos 6 meses com peeking lateral.',
        tip: 'Dica MEI: Oscilações de faturamento indicam sazonalidade — prepare seu caixa nos meses de alta.'
      }
    ]
  },
  metas: {
    pageTitle: 'Metas do Negócio',
    steps: [
      {
        title: 'Planejamento de Indicadores',
        content: 'Defina metas claras de receita bruta, quantidade de vendas e margem líquida para orientar o crescimento sustentável do seu MEI.',
        tip: 'Dica MEI: Estabeleça metas realistas divididas por semana para engajar sua rotina.'
      },
      {
        title: 'Termômetro de Conquista',
        content: 'Acompanhe o percentual atingido de cada objetivo com projeção estimativa até o fechamento do mês.',
        tip: 'Dica MEI: Acompanhar o ritmo diário evita surpresas no último dia do mês.'
      }
    ]
  },
  cadastros: {
    pageTitle: 'Cadastros Gerais',
    steps: [
      {
        title: 'Gestão de Clientes e Fornecedores',
        content: 'Cadastre pessoas físicas e jurídicas com validação automática de CNPJ/CPF, dados de contato e histórico completo de pedidos.',
        tip: 'Dica MEI: Manter dados de fornecedores organizados agiliza a emissão de notas fiscais de entrada.'
      },
      {
        title: 'Controle de Funcionário Único (Regra Legal)',
        content: 'O MEI tem direito legal a contratar no máximo 1 empregado que receba salário mínimo ou piso da categoria. O sistema monitora essa conformidade.',
        tip: 'Dica MEI: Encargos do empregado MEI são reduzidos: apenas 3% de INSS patronal e 8% de FGTS via eSocial.'
      },
      {
        title: 'Catálogo de Produtos e Serviços',
        content: 'Gerencie itens com precificação inteligente, cálculo de margem de lucro e formação de preço de venda competitiva.',
        tip: 'Dica MEI: Sempre inclua os custos de frete e embalagem no custo do produto.'
      }
    ]
  },
  estoque: {
    pageTitle: 'Controle de Estoque',
    steps: [
      {
        title: 'Posição e Valor Imobilizado',
        content: 'Veja a quantidade em estoque de cada produto e o capital total investido parado em prateleira.',
        tip: 'Dica MEI: Estoque parado é capital sem rendimento — promova queimas dos itens de baixo giro.'
      },
      {
        title: 'Ponto de Pedido & Estoque Mínimo',
        content: 'Receba alertas imediatos quando um item atinge o nível crítico de segurança para reposição imediata.',
        tip: 'Dica MEI: Configure o estoque mínimo considerando o tempo de entrega do seu melhor fornecedor.'
      },
      {
        title: 'Movimentações de Entrada e Saída',
        content: 'Registre entradas por compras de matéria-prima e baixas automáticas a cada venda efetuada.',
        tip: 'Dica MEI: Realize um inventário físico quinzenal para calibrar eventuais perdas.'
      }
    ]
  },
  financeiro: {
    pageTitle: 'Finanças & Caixa',
    steps: [
      {
        title: 'Livro Caixa Digital',
        content: 'Lançamentos simplificados de receitas e despesas com categorização no plano de contas didático do MEI.',
        tip: 'Dica MEI: Registre cada centavo que entrar ou sair da conta bancária da sua empresa.'
      },
      {
        title: 'Filtros Rápidos por Segmento',
        content: 'Isole os lançamentos por período, tipo (receita/despesa) ou centro de custo para análises rápidas.',
        tip: 'Dica MEI: Categorizar corretamente facilita o preenchimento da Declaração Anual DASN-SIMEI.'
      },
      {
        title: 'Anexação de Comprovantes',
        content: 'Guarde fotos e PDFs de notas e recibos diretamente anexados às transações para auditoria e prestação de contas.',
        tip: 'Dica MEI: A Receita Federal exige guarda de notas e comprovantes por no mínimo 5 anos.'
      }
    ]
  },
  fiscal: {
    pageTitle: 'Fiscal & DAS',
    steps: [
      {
        title: 'Emissão de NFS-e Nacional',
        content: 'Emissão unificada de Notas Fiscais de Serviços Eletrônicas pelo padrão nacional da Receita Federal e Gov.br.',
        tip: 'Dica MEI: O MEI é isento de emitir nota para consumidor pessoa física, exceto se o cliente solicitar.'
      },
      {
        title: 'NF-e de Mercadorias',
        content: 'Emita notas de venda de mercadorias com geração de XML homologado e DANFE simplificado em PDF.',
        tip: 'Dica MEI: Vendas para outras empresas (PJ) sempre exigem a emissão de nota fiscal.'
      },
      {
        title: 'Apuração e Pagamento da DAS',
        content: 'Monitore o valor da guia unificada mensal com cálculo de INSS, ICMS e ISS em boleto ou chave PIX.',
        tip: 'Dica MEI: Pague sempre até o dia 20 de cada mês para evitar multas de 0,33% ao dia.'
      }
    ]
  },
  metas_gerais: {
    pageTitle: 'Metas',
    steps: [
      {
        title: 'Indicadores de Resultados',
        content: 'Acompanhamento do alcance das metas mensais com métricas financeiras integradas ao fluxo de caixa.',
        tip: 'Dica MEI: Revise suas metas no início de cada trimestre para se adequar ao mercado.'
      }
    ]
  },
  relatorios: {
    pageTitle: 'Relatórios & DRE',
    steps: [
      {
        title: 'DRE Simplificado do MEI',
        content: 'Demonstrativo do Resultado do Exercício adaptado para o pequeno empreendedor: Receita Bruta - Custos = Lucro Real.',
        tip: 'Dica MEI: Apresente o DRE ao seu banco para negociar taxas de juros mais baixas para sua conta PJ.'
      },
      {
        title: 'Relatório Oficial para a DASN-SIMEI',
        content: 'Relatório pronto com a soma discriminada de comércio, indústria e serviços para entregar a declaração anual sem erro.',
        tip: 'Dica MEI: O prazo final da DASN é sempre 31 de maio de cada ano.'
      }
    ]
  },
  contas: {
    pageTitle: 'Plano de Contas',
    steps: [
      {
        title: 'Estrutura Didática Sem Complicações',
        content: 'Categorias limpas de entradas e saídas que dispensam conhecimento técnico de contabilidade avançada.',
        tip: 'Dica MEI: Categorias claras permitem saber onde está o maior ralo de dinheiro da sua empresa.'
      }
    ]
  },
  configuracoes: {
    pageTitle: 'Configurações',
    steps: [
      {
        title: 'Certificado Digital & Emissão',
        content: 'Configure seu certificado A1 para emissão e assinatura digital das suas notas fiscais com segurança.',
        tip: 'Dica MEI: Mantenha uma cópia de segurança do arquivo .pfx do seu certificado fora do computador.'
      },
      {
        title: 'Integrações Google Workspace',
        content: 'Sincronize relatórios com Google Planilhas, faça backup de XMLs no Google Drive e registre lembretes na Agenda.',
        tip: 'Dica MEI: A nuvem protege os dados do seu MEI mesmo em caso de perda ou furto do aparelho.'
      },
      {
        title: 'Operadores & Permissões',
        content: 'Defina quem na sua equipe pode acessar dados financeiros (perfil Master) ou apenas emitir notas/vendas (Auxiliar).',
        tip: 'Dica MEI: O controle de operadores evita fraudes e alterações indevidas no caixa.'
      }
    ]
  }
};

export interface TutorialTourProps {
  isOpen: boolean;
  onClose: () => void;
  activeView?: string;
  setActiveView?: (view: string) => void;
  setSidebarPinned?: (pinned: boolean) => void;
}

export const TutorialTour = React.memo(function TutorialTour({ 
  isOpen, 
  onClose, 
  activeView = 'dashboard'
}: TutorialTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightCoords, setHighlightCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Seleciona os passos contextuais da página atualmente aberta
  const pageData = useMemo(() => {
    return CONTEXTUAL_PAGE_STEPS[activeView] || CONTEXTUAL_PAGE_STEPS.dashboard;
  }, [activeView]);

  const steps = pageData.steps;

  // Reinicia o passo se o módulo mudar ou se o tutorial for aberto
  useEffect(() => {
    setCurrentStep(0);
  }, [activeView, isOpen]);

  // Recalcula coordenadas do elemento alvo na tela
  useEffect(() => {
    if (!isOpen) return;

    const findTarget = () => {
      const step = steps[currentStep];
      if (step?.target) {
        const el = document.querySelector(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          const left = rect.left + window.scrollX;
          setHighlightCoords({
            top: top - 4,
            left: left - 4,
            width: rect.width + 8,
            height: rect.height + 8
          });
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      setHighlightCoords(null);
    };

    const timer = setTimeout(findTarget, 250);
    return () => clearTimeout(timer);
  }, [currentStep, isOpen, steps]);

  if (!isOpen) return null;

  const step = steps[currentStep] || steps[0];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Ação explícita de "Pular" solicitada no Requisito 7
  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[75] overflow-y-auto pointer-events-none select-none">
      {/* Backdrop de foco suave */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs pointer-events-auto transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Indicador de Spotlight ao redor da ferramenta explicada */}
      {highlightCoords && (
        <div
          className="absolute border-2 border-[#2dd683] rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.78),0_0_24px_rgba(45,214,131,0.6)] z-40 transition-all duration-300 pointer-events-none"
          style={{
            top: `${highlightCoords.top}px`,
            left: `${highlightCoords.left}px`,
            width: `${highlightCoords.width}px`,
            height: `${highlightCoords.height}px`
          }}
        />
      )}

      {/* Card Flutuante de Instruções do Tutorial */}
      <div 
        className="fixed bottom-6 right-6 md:bottom-12 md:right-12 max-w-md w-[calc(100vw-2rem)] bg-white shadow-2xl rounded-3xl border border-slate-200/90 p-5 sm:p-6 pointer-events-auto z-50 transition-all"
        id="tutorial-tour-card"
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial Guiado"
      >
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#2dd683]/20 border border-[#2dd683] flex items-center justify-center text-emerald-800">
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 tracking-tight block">
                Tutorial: {pageData.pageTitle}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Tour Contextual da Página
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition flex items-center justify-center cursor-pointer"
            title="Fechar Tutorial"
            aria-label="Fechar Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo do Passo Atual */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Ferramenta {currentStep + 1} de {steps.length}
            </span>
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <span 
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentStep ? 'bg-[#2dd683] w-4' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <h4 className="text-base font-black text-slate-900 leading-snug">
            {step.title}
          </h4>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
            {step.content}
          </p>

          {/* Dica MEI do Passo */}
          {step.tip && (
            <div className="bg-emerald-50/70 rounded-2xl p-3 flex gap-2.5 items-start border border-emerald-200/80">
              <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-900 font-semibold leading-relaxed">
                {step.tip}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Ações do Tutorial */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
          
          {/* Ação explícita de "Pular" (Requisito 7: o usuário deve poder pular a qualquer momento) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 active:scale-95"
              title="Pular todo o tour desta página"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Pular</span>
            </button>

            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 text-xs font-bold py-1.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          {/* Botão Próximo / Concluir */}
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 text-xs font-extrabold py-2 px-4 rounded-xl bg-[#2dd683] hover:bg-[#25be73] text-[#000000] shadow-xs transition cursor-pointer active:scale-95"
          >
            {isLast ? (
              <>
                <span>Concluir</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default TutorialTour;
