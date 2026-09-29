import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  moduleName?: string;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * Componente ErrorBoundary para proteção de módulos críticos (Dashboard, Fluxo de Caixa, etc.)
 * Isola exceções de renderização, falhas assíncronas e erros de permissão do Firestore,
 * evitando que falhas pontuais causem queda de todo o aplicativo.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary - ${this.props.moduleName || 'Geral'}] Erro capturado:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const moduleName = this.props.moduleName || 'Módulo';
      const isFirestoreError = this.state.error?.message?.toLowerCase().includes('permission') ||
                               this.state.error?.message?.toLowerCase().includes('firestore');

      return (
        <div className="w-full my-6 p-6 sm:p-8 bg-white/90 backdrop-blur-md rounded-2xl border border-rose-200/80 shadow-lg text-slate-800 transition-all duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600 shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {moduleName}
                </span>
                {isFirestoreError && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Sincronização Cloud
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {this.props.fallbackTitle || `Houve uma instabilidade no carregamento de ${moduleName}`}
              </h3>

              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                {this.props.fallbackMessage || (
                  isFirestoreError
                    ? 'Não foi possível sincronizar os dados em tempo real com o banco de dados. Suas informações locais permanecem seguras.'
                    : 'Um erro pontual impediu a exibição deste módulo. O restante da sua aplicação continua funcionando perfeitamente.'
                )}
              </p>
            </div>
          </div>

          {/* Ações de recuperação amigáveis */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>

              {this.props.onGoHome && (
                <button
                  type="button"
                  onClick={this.props.onGoHome}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir para o Painel</span>
                </button>
              )}
            </div>

            {/* Alternador de detalhes técnicos para suporte/diagnóstico */}
            {this.state.error && (
              <button
                type="button"
                onClick={this.toggleDetails}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span>{this.state.showDetails ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Bloco de detalhes técnicos expansível */}
          {this.state.showDetails && this.state.error && (
            <div className="mt-4 p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
              <p className="font-semibold text-rose-400 mb-1">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap leading-tight mt-1">
                  {this.state.errorInfo.componentStack.trim()}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
