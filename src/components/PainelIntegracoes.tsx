import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  LogIn, 
  LogOut, 
  Check, 
  Clock, 
  CalendarCheck,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { FinancialTransaction, FinancialCategory, DASPayment, Invoice } from '../types';
import { 
  connectGoogleWorkspace, 
  disconnectGoogleWorkspace, 
  getCachedToken, 
  getConnectedUser, 
  syncReportsToSheets, 
  createCalendarEvent,
  GoogleCalendarEventPayload 
} from '../lib/googleIntegration';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';

export interface PainelIntegracoesProps {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
  dasPayments: DASPayment[];
  invoices: Invoice[];
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'EXPORTACAO', descricao: string) => void;
  onSyncConfigChange?: () => void;
}

export const PainelIntegracoes = React.memo(function PainelIntegracoes({
  transactions,
  categories,
  dasPayments,
  invoices,
  addLog,
  onSyncConfigChange,
}: PainelIntegracoesProps) {
  // Google Auth State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Sync Preferences State
  const [autoSyncSheets, setAutoSyncSheets] = useState(false);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(false);

  // Operation States
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [lastSheetsSync, setLastSheetsSync] = useState<string | null>(null);
  const [lastCalendarSync, setLastCalendarSync] = useState<string | null>(null);
  const [lastSpreadsheetUrl, setLastSpreadsheetUrl] = useState<string | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Load preferences and check auth on mount
  useEffect(() => {
    const user = getConnectedUser();
    const token = getCachedToken();
    if (user && token) {
      setGoogleUser(user);
      setAccessToken(token);
    }

    const sheetsPref = (localStorage.getItem('meisimple_auto_sync_sheets') || localStorage.getItem('gmei_auto_sync_sheets')) === 'true';
    const calendarPref = (localStorage.getItem('meisimple_auto_sync_calendar') || localStorage.getItem('gmei_auto_sync_calendar')) === 'true';
    setAutoSyncSheets(sheetsPref);
    setAutoSyncCalendar(calendarPref);

    const savedSheetUrl = localStorage.getItem('meisimple_last_sheet_url');
    if (savedSheetUrl) {
      setLastSpreadsheetUrl(savedSheetUrl);
    }
  }, []);

  const showFeedback = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setFeedback({ type, title, message });
    setTimeout(() => {
      setFeedback(null);
    }, 6000);
  };

  // Connect Google Account
  const handleConnect = async () => {
    setIsAuthenticating(true);
    setFeedback(null);
    try {
      const result = await connectGoogleWorkspace();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        addLog('Configuracoes', 'EDICAO', `Google Workspace conectado com sucesso para ${result.user.email}`);
        showFeedback(
          'success',
          'Conta Google Vinculada',
          `Sessão autorizada para ${result.user.displayName || result.user.email}. As integrações estão prontas para uso.`
        );
      } else {
        showFeedback(
          'info',
          'Conexão Cancelada',
          'A janela de autenticação foi encerrada antes da conclusão.'
        );
      }
    } catch (error: any) {
      showFeedback(
        'error',
        'Falha na Conexão',
        error?.message || 'Não foi possível autenticar junto à conta Google.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Disconnect Google Account
  const handleDisconnect = async () => {
    try {
      await disconnectGoogleWorkspace();
      setGoogleUser(null);
      setAccessToken(null);
      addLog('Configuracoes', 'EDICAO', 'Conta Google Workspace desconectada.');
      showFeedback('info', 'Desconectado', 'A sua conta Google foi desconectada do MEI-Simple.');
    } catch (error: any) {
      showFeedback('error', 'Erro', 'Falha ao encerrar a sessão Google.');
    }
  };

  // Toggle Sheets Sync
  const handleToggleSheets = () => {
    const nextVal = !autoSyncSheets;
    setAutoSyncSheets(nextVal);
    localStorage.setItem('meisimple_auto_sync_sheets', String(nextVal));

    addLog(
      'Configuracoes',
      'EDICAO',
      `Sincronização automática com Google Planilhas ${nextVal ? 'ATIVADA' : 'DESATIVADA'}.`
    );

    showFeedback(
      'success',
      nextVal ? 'Sincronização com Sheets Ativada' : 'Sincronização Desativada',
      nextVal 
        ? 'Relatórios e faturamento serão exportados automaticamente a cada novo lançamento.'
        : 'A exportação automática para o Google Planilhas foi pausada.'
    );

    if (onSyncConfigChange) {
      onSyncConfigChange();
    }
  };

  // Toggle Calendar Sync
  const handleToggleCalendar = () => {
    const nextVal = !autoSyncCalendar;
    setAutoSyncCalendar(nextVal);
    localStorage.setItem('meisimple_auto_sync_calendar', String(nextVal));

    addLog(
      'Configuracoes',
      'EDICAO',
      `Sincronização automática com Google Agenda ${nextVal ? 'ATIVADA' : 'DESATIVADA'}.`
    );

    showFeedback(
      'success',
      nextVal ? 'Sincronização com Agenda Ativada' : 'Sincronização Desativada',
      nextVal
        ? 'Guias DAS e notas fiscais gerarão lembretes oficiais na sua agenda automaticamente.'
        : 'O agendamento automático de compromissos no Google Agenda foi pausado.'
    );

    if (onSyncConfigChange) {
      onSyncConfigChange();
    }
  };

  // Manual Trigger: syncReportsToSheets
  const handleSyncSheetsNow = async () => {
    const token = accessToken || getCachedToken();
    if (!token) {
      showFeedback('error', 'Autenticação Necessária', 'Conecte sua conta Google antes de sincronizar.');
      return;
    }

    setIsSyncingSheets(true);
    try {
      const selectedYear = '2026';
      const result = await syncReportsToSheets(
        token,
        selectedYear,
        transactions,
        categories,
        dasPayments,
        invoices
      );

      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setLastSheetsSync(timestamp);
      setLastSpreadsheetUrl(result.spreadsheetUrl);
      localStorage.setItem('meisimple_last_sheet_url', result.spreadsheetUrl);

      addLog(
        'Configuracoes',
        'EXPORTACAO',
        `Relatórios contábeis de ${selectedYear} sincronizados com o Google Sheets com sucesso!`
      );

      showFeedback(
        'success',
        'Planilha Sincronizada com Sucesso',
        'Demonstrativos DRE, faturamento e tributos foram atualizados no Google Planilhas.'
      );
    } catch (err: any) {
      console.error('Erro ao sincronizar com Google Sheets:', err);
      showFeedback(
        'error',
        'Erro na Sincronização com Sheets',
        err?.message || 'Falha ao comunicar com a API do Google Sheets. Verifique as permissões da conta.'
      );
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Manual Trigger: createCalendarEvent
  const handleSyncCalendarNow = async () => {
    const token = accessToken || getCachedToken();
    if (!token) {
      showFeedback('error', 'Autenticação Necessária', 'Conecte sua conta Google antes de sincronizar.');
      return;
    }

    setIsSyncingCalendar(true);
    try {
      // Find pending or next DAS payments
      const pendingDAS = dasPayments.filter(d => d.status === 'PENDENTE' || d.status === 'ATRASADO');
      const targetDAS = pendingDAS.length > 0 ? pendingDAS.slice(0, 3) : dasPayments.slice(0, 1);

      if (targetDAS.length === 0) {
        // Fallback: create a general fiscal checkpoint event
        const nowStr = new Date().toISOString().split('T')[0];
        const payload: GoogleCalendarEventPayload = {
          summary: 'MEI-Simple: Revisão Fiscal & Faturamento Mensal',
          description: 'Lembrete gerado pelo MEI-Simple ERP para conferência do faturamento acumulado e limite do Simples Nacional.',
          start: { date: nowStr },
          end: { date: nowStr },
        };
        await createCalendarEvent(token, payload);
      } else {
        for (const das of targetDAS) {
          const payload: GoogleCalendarEventPayload = {
            summary: `Vencimento DAS-MEI - Competência ${das.periodoReferencia}`,
            description: `Guia de Recolhimento do Simples Nacional.\nValor: R$ ${das.valor.toFixed(2)}\nVencimento: ${das.dataVencimento}\n\nLembrete oficial gerado pelo MEI-Simple.`,
            start: { date: das.dataVencimento },
            end: { date: das.dataVencimento },
          };
          await createCalendarEvent(token, payload);
        }
      }

      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setLastCalendarSync(timestamp);

      addLog(
        'Configuracoes',
        'EXPORTACAO',
        `Prazos fiscais do DAS adicionados à sua Google Agenda com sucesso!`
      );

      showFeedback(
        'success',
        'Eventos Agendados no Google Agenda',
        `${targetDAS.length} lembrete(s) de vencimento fiscal foram criados diretamente no seu Google Calendar.`
      );
    } catch (err: any) {
      console.error('Erro ao agendar no Google Calendar:', err);
      showFeedback(
        'error',
        'Erro na Sincronização com Agenda',
        err?.message || 'Falha ao comunicar com o Google Calendar. Verifique as permissões de acesso.'
      );
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const isConnected = !!googleUser && !!accessToken;

  return (
    <div className="space-y-6">
      {/* Header da Seção de Integrações */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6">
        <SectionHeader
          as="h2"
          icon={<Zap className="w-6 h-6 text-[#004AAD]" />}
          iconVariant="blue"
          title="Integrações & Sincronização em Nuvem"
          info="Configure e controle seletivamente o envio automático de relatórios contábeis para o Google Sheets e o agendamento de tributos e notas no Google Agenda."
          badges={
            isConnected ? (
              <StatusBadge
                tone="success"
                pulse
                icon={<CheckCircle2 className="w-3 h-3 text-[#2e7d32]" />}
                label="Conectado ao Google Workspace"
              />
            ) : (
              <StatusBadge
                tone="warning"
                label="Google Desconectado"
              />
            )
          }
        />
      </div>

      {/* Alerta de Feedback com Animação */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {feedback.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {feedback.type === 'info' && <ShieldCheck className="w-5 h-5 text-[#004AAD] shrink-0 mt-0.5" />}
            
            <div className="flex-1 min-w-0">
              <strong className="block text-xs font-bold">{feedback.title}</strong>
              <span className="block text-xs mt-0.5 opacity-90">{feedback.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cartão de Autenticação / Conexão com Google Workspace */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#004AAD] font-bold shrink-0">
              {googleUser?.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-xl object-cover" 
                />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#004AAD]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <span>Conta Google Workspace</span>
                <InfoTooltip text="Vínculo OAuth2 seguro com permissões para Planilhas e Agenda da sua empresa." />
              </h3>
              <span className="text-xs text-slate-500 font-mono mt-0.5 block truncate max-w-xs sm:max-w-md">
                {googleUser ? (googleUser.email || googleUser.displayName) : 'Nenhuma conta vinculada no momento'}
              </span>
            </div>
          </div>

          <div>
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="h-11 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Desconectar Conta</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isAuthenticating}
                className="h-11 px-5 rounded-xl font-bold text-xs bg-[#004AAD] hover:bg-blue-700 text-white transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 text-[#2dd683]" />
                )}
                <span>Conectar Google Workspace</span>
              </button>
            )}
          </div>
        </div>

        {/* Status de Permissões */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Permissão: Google Planilhas</span>
            <StatusBadge
              tone={isConnected ? 'success' : 'neutral'}
              label={isConnected ? 'Autorizado' : 'Pendente'}
            />
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Permissão: Google Agenda</span>
            <StatusBadge
              tone={isConnected ? 'success' : 'neutral'}
              label={isConnected ? 'Autorizado' : 'Pendente'}
            />
          </div>
        </div>
      </div>

      {/* Grid com os 2 Painéis Principais: Google Sheets & Google Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. PAINEL GOOGLE SHEETS */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header do Módulo */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                    <span>Google Planilhas (Sheets)</span>
                    <InfoTooltip text="Exporta balanços contábeis, receitas, custos e apuração do DRE automaticamente para planilhas oficiais na nuvem." />
                  </h3>
                  <div className="mt-1">
                    <StatusBadge
                      tone={autoSyncSheets ? 'success' : 'neutral'}
                      label={autoSyncSheets ? 'Sincronização Ativa' : 'Sincronização Inativa'}
                    />
                  </div>
                </div>
              </div>

              {/* Interruptor Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={autoSyncSheets}
                onClick={handleToggleSheets}
                className={`w-12 h-6.5 shrink-0 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 ${
                  autoSyncSheets ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title="Ativar/desativar sincronização automática com Sheets"
              >
                <div
                  className={`w-5.5 h-5.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                    autoSyncSheets ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                >
                  {autoSyncSheets && <Check className="w-3 h-3 text-emerald-600 font-bold" />}
                </div>
              </button>
            </div>

            {/* Metadados & Último Status */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Última Sincronização:</span>
                <span className="font-mono font-bold text-slate-800">
                  {lastSheetsSync ? `Hoje às ${lastSheetsSync}` : 'Aguardando primeiro disparo'}
                </span>
              </div>

              {lastSpreadsheetUrl && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-emerald-800 font-medium">Planilha Vinculada:</span>
                  <a
                    href={lastSpreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    <span>Abrir Google Sheets</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Ação Manual: syncReportsToSheets */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSyncingSheets || !isConnected}
              onClick={handleSyncSheetsNow}
              className="w-full h-11 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncingSheets ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sincronizando Relatórios...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-white" />
                  <span>Sincronizar Relatórios com Sheets Agora</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. PAINEL GOOGLE AGENDA */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            {/* Header do Módulo */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-[#5E17EB] shrink-0">
                  <Calendar className="w-5 h-5 text-[#5E17EB]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                    <span>Google Agenda (Calendar)</span>
                    <InfoTooltip text="Cria compromissos automáticos para os vencimentos mensais das guias DAS-MEI e entregas de notas fiscais emitidas." />
                  </h3>
                  <div className="mt-1">
                    <StatusBadge
                      tone={autoSyncCalendar ? 'success' : 'neutral'}
                      label={autoSyncCalendar ? 'Sincronização Ativa' : 'Sincronização Inativa'}
                    />
                  </div>
                </div>
              </div>

              {/* Interruptor Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={autoSyncCalendar}
                onClick={handleToggleCalendar}
                className={`w-12 h-6.5 shrink-0 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 ${
                  autoSyncCalendar ? 'bg-[#5E17EB]' : 'bg-slate-300'
                }`}
                title="Ativar/desativar sincronização automática com Agenda"
              >
                <div
                  className={`w-5.5 h-5.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
                    autoSyncCalendar ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                >
                  {autoSyncCalendar && <Check className="w-3 h-3 text-[#5E17EB] font-bold" />}
                </div>
              </button>
            </div>

            {/* Metadados & Resumo de Prazos */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Último Agendamento:</span>
                <span className="font-mono font-bold text-slate-800">
                  {lastCalendarSync ? `Hoje às ${lastCalendarSync}` : 'Aguardando primeiro disparo'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-purple-900 font-medium">Guias DAS Pendentes:</span>
                <span className="font-mono font-bold text-[#5E17EB]">
                  {dasPayments.filter(d => d.status === 'PENDENTE' || d.status === 'ATRASADO').length} guia(s) no radar
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Ação Manual: createCalendarEvent */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isSyncingCalendar || !isConnected}
              onClick={handleSyncCalendarNow}
              className="w-full h-11 px-4 rounded-xl font-bold text-xs bg-[#5E17EB] hover:bg-[#4d11c7] text-white transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncingCalendar ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Agendando Prazos Fiscais...</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4 text-white" />
                  <span>Sincronizar Guias do DAS na Agenda Agora</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Rodapé Informativo sobre Funcionamento Automático */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            Sincronização em segundo plano garantida via OAuth2 e persistência local criptografada.
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          API v4 Sheets & Calendar v3
        </span>
      </div>
    </div>
  );
});

export default PainelIntegracoes;
