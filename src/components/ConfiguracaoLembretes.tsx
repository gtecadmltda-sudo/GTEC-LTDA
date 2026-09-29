/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, DASPayment } from '../types';
import { InfoTooltip } from './InfoTooltip';
import {
  Bell,
  BellRing,
  Mail,
  Smartphone,
  Calendar,
  Clock,
  CheckCircle2,
  Save,
  Send,
  Sparkles,
  Info,
  Volume2,
  ShieldCheck,
  Check,
  X,
  MessageSquare,
  CalendarCheck
} from 'lucide-react';
import { ResponsiveModal } from './ResponsiveModal';

export interface DASReminderConfig {
  pushEnabled: boolean;
  pushSound: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  reminderDays: {
    sevenDaysBefore: boolean;
    threeDaysBefore: boolean;
    oneDayBefore: boolean;
    onDueDate: boolean;
    oneDayAfter: boolean;
  };
  preferredTime: string;
  selectedRecipientIds: string[];
  additionalEmails: string;
  whatsappPhone: string;
  customMessageTemplate: string;
}

const DEFAULT_CONFIG: DASReminderConfig = {
  pushEnabled: true,
  pushSound: true,
  emailEnabled: true,
  whatsappEnabled: false,
  reminderDays: {
    sevenDaysBefore: true,
    threeDaysBefore: true,
    oneDayBefore: true,
    onDueDate: true,
    oneDayAfter: true,
  },
  preferredTime: '09:00',
  selectedRecipientIds: [],
  additionalEmails: '',
  whatsappPhone: '',
  customMessageTemplate: 'Olá {nome_operador}! Lembramos que o DAS-MEI ({mes_referencia}) vence em {data_vencimento}. Valor estimado: {valor_estimado}. Evite multas e mantenha os benefícios do INSS em dia.',
};

const STORAGE_KEY = 'meisimple_das_reminders_config';

interface ConfiguracaoLembretesProps {
  users: User[];
  currentUser: User | null;
  dasPayments?: DASPayment[];
  addLog?: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO', descricao: string) => void;
}

export function ConfiguracaoLembretes({
  users,
  currentUser,
  dasPayments = [],
  addLog
}: ConfiguracaoLembretesProps) {
  const [config, setConfig] = useState<DASReminderConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testNotificationToast, setTestNotificationToast] = useState<{
    show: boolean;
    title: string;
    body: string;
  } | null>(null);

  const [emailPreviewModalOpen, setEmailPreviewModalOpen] = useState(false);

  // Initialize selected recipients if empty
  useEffect(() => {
    if (config.selectedRecipientIds.length === 0 && users.length > 0) {
      setConfig(prev => ({
        ...prev,
        selectedRecipientIds: [users[0].id]
      }));
    }
  }, [users]);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSaveSuccess(true);
      if (addLog) {
        addLog(
          'Configurações',
          'EDICAO',
          `Parâmetros de Lembretes & Alertas do DAS-MEI atualizados por ${currentUser?.name || 'Administrador'}`
        );
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações de lembretes:', err);
    }
  };

  const handleRequestPushPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          triggerTestPush();
        }
      } catch (e) {
        console.error('Erro ao solicitar permissão de notificação:', e);
      }
    }
  };

  const triggerTestPush = () => {
    const title = 'Lembrete DAS-MEI (Simulação)';
    const body = `Olá ${currentUser?.name || 'Empreendedor'}! O DAS de Agosto/2026 vence no dia 21/09/2026 (R$ 75,60). Evite multas!`;

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch {
        // fallback to UI toast
      }
    }

    setTestNotificationToast({
      show: true,
      title,
      body
    });

    setTimeout(() => {
      setTestNotificationToast(null);
    }, 6000);
  };

  const triggerTestEmail = () => {
    setEmailPreviewModalOpen(true);
  };

  const toggleRecipient = (userId: string) => {
    setConfig(prev => {
      const exists = prev.selectedRecipientIds.includes(userId);
      const newIds = exists
        ? prev.selectedRecipientIds.filter(id => id !== userId)
        : [...prev.selectedRecipientIds, userId];
      return { ...prev, selectedRecipientIds: newIds };
    });
  };

  const currentYear = 2026;
  const dasMonths = [
    { mes: '01', nome: 'Janeiro/2026', venc: '20/02/2026', valor: 75.60, status: 'PAGO' },
    { mes: '02', nome: 'Fevereiro/2026', venc: '20/03/2026', valor: 75.60, status: 'PAGO' },
    { mes: '03', nome: 'Março/2026', venc: '20/04/2026', valor: 75.60, status: 'PAGO' },
    { mes: '04', nome: 'Abril/2026', venc: '20/05/2026', valor: 75.60, status: 'PAGO' },
    { mes: '05', nome: 'Maio/2026', venc: '22/06/2026', valor: 75.60, status: 'PAGO' },
    { mes: '06', nome: 'Junho/2026', venc: '20/07/2026', valor: 75.60, status: 'PAGO' },
    { mes: '07', nome: 'Julho/2026', venc: '20/08/2026', valor: 75.60, status: 'PAGO' },
    { mes: '08', nome: 'Agosto/2026', venc: '21/09/2026', valor: 75.60, status: 'PENDENTE' },
    { mes: '09', nome: 'Setembro/2026', venc: '20/10/2026', valor: 75.60, status: 'PENDENTE' },
    { mes: '10', nome: 'Outubro/2026', venc: '20/11/2026', valor: 75.60, status: 'PENDENTE' },
    { mes: '11', nome: 'Novembro/2026', venc: '21/12/2026', valor: 75.60, status: 'PENDENTE' },
    { mes: '12', nome: 'Dezembro/2026', venc: '20/01/2027', valor: 75.60, status: 'PENDENTE' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification Simulation: Padrão claro com bordas arredondadas e verdes */}
      {testNotificationToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-[120] max-w-sm w-full bg-white/95 backdrop-blur-md text-slate-900 p-4 rounded-2xl shadow-xl border-2 border-emerald-500/50 flex items-start gap-3 transition-all">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center shrink-0 border border-emerald-300">
            <BellRing className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-800 uppercase tracking-wider text-[10px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Notificação do Sistema
              </span>
              <button
                type="button"
                onClick={() => setTestNotificationToast(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h5 className="font-bold text-sm text-slate-900 mt-1">{testNotificationToast.title}</h5>
            <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{testNotificationToast.body}</p>
          </div>
        </div>
      )}

      {/* Main Header Banner: Layout Claro MEI-Simple */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Configuração de Lembretes & Alertas do DAS-MEI</span>
                <InfoTooltip text="Programe notificações automáticas no navegador e e-mails de alerta para os operadores da equipe antes do vencimento mensal da guia do Simples Nacional (todo dia 20)." />
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Pontualidade Fiscal
                </span>
                {dasPayments.filter(d => d.status === 'PENDENTE' || d.status === 'ATRASADO').length > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    {dasPayments.filter(d => d.status === 'PENDENTE' || d.status === 'ATRASADO').length} Pendente(s)
                  </span>
                )}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={triggerTestPush}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Testar Notificação Push no Navegador"
          >
            <BellRing className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Testar Push</span>
          </button>

          <button
            type="button"
            onClick={triggerTestEmail}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-3.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Ver e testar layout do e-mail"
          >
            <Mail className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Ver E-mail</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Lembretes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Channels & Scheduling (Layout Claro) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Channels & Permission Status */}
        <div className="space-y-6">
          
          {/* Push Notification Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center">
                    <span>Notificações Push (Web)</span>
                    <InfoTooltip text="Alertas nativos na área de trabalho" />
                  </h4>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.pushEnabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, pushEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Status no Navegador:
                </span>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : notificationPermission === 'denied'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {notificationPermission === 'granted' ? 'Autorizado' : notificationPermission === 'denied' ? 'Bloqueado' : 'Pendente'}
                </span>
              </div>

              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPushPermission}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Habilitar Permissão de Notificações
                </button>
              )}

              <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.pushSound}
                  onChange={(e) => setConfig(prev => ({ ...prev, pushSound: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                Emitir sinal sonoro no aviso
              </label>
            </div>
          </div>

          {/* Email Notification Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center">
                    <span>Avisos por E-mail</span>
                    <InfoTooltip text="Disparo automático com guia e código PIX" />
                  </h4>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.emailEnabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, emailEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Horário de Envio Preferencial
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={config.preferredTime}
                    onChange={(e) => setConfig(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="rounded-lg border border-slate-200 bg-white text-slate-800 px-2.5 py-1.5 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-500">(Horário de Brasília)</span>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  E-mails Adicionais (Contador / Financeiro)
                </label>
                <input
                  type="text"
                  placeholder="ex: contador@fiscalmei.com.br, adm@empresa.com"
                  value={config.additionalEmails}
                  onChange={(e) => setConfig(prev => ({ ...prev, additionalEmails: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white text-slate-800 px-3 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[9.5px] text-slate-400 block mt-1">
                  Separe múltiplos e-mails por vírgula.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Tip info card */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
              <Info className="w-4 h-4 text-emerald-600" />
              Importância do DAS-MEI Pontual
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              O pagamento mensal do DAS garante cobertura previdenciária (aposentadoria, auxílio-doença, salário-maternidade) e mantém o CNPJ livre de multas da Receita Federal e dívida ativa.
            </p>
          </div>

        </div>

        {/* Center Column: Frequency & Rules */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span>Frequência de Avisos (Gatilhos)</span>
                <InfoTooltip text="Escolha em quais momentos o sistema deve emitir os alertas do DAS." />
              </h4>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.reminderDays.sevenDaysBefore}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    reminderDays: { ...prev.reminderDays, sevenDaysBefore: e.target.checked }
                  }))}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <strong className="text-slate-800 block font-semibold">
                    7 dias antes do vencimento
                  </strong>
                  <span className="text-[10.5px] text-slate-500">
                    Aviso preventivo para planejamento e provisão de caixa.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.reminderDays.threeDaysBefore}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    reminderDays: { ...prev.reminderDays, threeDaysBefore: e.target.checked }
                  }))}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <strong className="text-slate-800 block font-semibold">
                    3 dias antes do vencimento
                  </strong>
                  <span className="text-[10.5px] text-slate-500">
                    Alerta de preparação com código de barras e chave PIX.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.reminderDays.oneDayBefore}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    reminderDays: { ...prev.reminderDays, oneDayBefore: e.target.checked }
                  }))}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <strong className="text-slate-800 block font-semibold">
                    1 dia antes (Véspera)
                  </strong>
                  <span className="text-[10.5px] text-slate-500">
                    Lembrete de urgência para o pagamento no dia seguinte.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.reminderDays.onDueDate}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    reminderDays: { ...prev.reminderDays, onDueDate: e.target.checked }
                  }))}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <strong className="text-emerald-900 block font-bold">
                    No dia do vencimento (Dia 20)
                  </strong>
                  <span className="text-[10.5px] text-emerald-800/80">
                    Alerta com alta prioridade para liquidação imediata.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={config.reminderDays.oneDayAfter}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    reminderDays: { ...prev.reminderDays, oneDayAfter: e.target.checked }
                  }))}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <strong className="text-amber-900 block font-bold">
                    1 dia após (Se não houver confirmação de baixa)
                  </strong>
                  <span className="text-[10.5px] text-amber-800/80">
                    Aviso preventivo de juros de mora e atualização pelo PGMEI.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Custom message template */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Mensagem do Lembrete
              </h4>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, customMessageTemplate: DEFAULT_CONFIG.customMessageTemplate }))}
                className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Restaurar Padrão
              </button>
            </div>

            <textarea
              rows={3}
              value={config.customMessageTemplate}
              onChange={(e) => setConfig(prev => ({ ...prev, customMessageTemplate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white text-slate-800 p-3 text-xs leading-relaxed focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center gap-1.5 flex-wrap text-[9.5px] font-mono text-slate-500">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{"{nome_operador}"}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{"{mes_referencia}"}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{"{data_vencimento}"}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{"{valor_estimado}"}</span>
            </div>
          </div>

        </div>

        {/* Right Column: Recipients from Team & 2026 Calendar Schedule */}
        <div className="space-y-6">
          
          {/* Team Members Selection */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Destinatários da Equipe</span>
                <InfoTooltip text="Selecione os operadores que receberão os avisos." />
              </h4>
            </div>

            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {users.map(user => {
                const isSelected = config.selectedRecipientIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleRecipient(user.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {user.name}
                          {user.role === 'admin' && (
                            <span className="text-[8.5px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono border border-slate-200">
                              Master
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule timeline for current period */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Cronograma DAS-MEI (Ano {currentYear})
              </h4>
              <span className="text-[9.5px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                Dia 20 Mensal
              </span>
            </div>

            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1 text-xs">
              {dasMonths.map(dm => {
                const isPaid = dm.status === 'PAGO';
                return (
                  <div
                    key={dm.mes}
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                      isPaid
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-amber-200 bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="font-semibold text-slate-800">
                        {dm.nome}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500">
                        Venc: {dm.venc}
                      </span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {isPaid ? 'Liquidado' : 'Agendado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Email Preview Responsive Modal: iOS Bottom Sheet no Mobile */}
      <ResponsiveModal
        isOpen={emailPreviewModalOpen}
        onClose={() => setEmailPreviewModalOpen(false)}
        maxWidth="max-w-xl"
        title="Modelo do E-mail de Lembrete DAS-MEI"
        subtitle="Visualização da mensagem enviada à equipe de operadores"
        icon={<Mail className="w-5 h-5 text-emerald-600" />}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEmailPreviewModalOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer border border-slate-200"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                setEmailPreviewModalOpen(false);
                setTestNotificationToast({
                  show: true,
                  title: 'E-mail de Teste Simulado',
                  body: 'Disparo de aviso realizado com sucesso para a equipe configurada!'
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Disparar E-mail de Teste
            </button>
          </div>
        }
      >
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-sans text-xs">
          <div className="text-[11px] space-y-1 text-slate-600 border-b border-slate-200 pb-2">
            <div><strong>De:</strong> MEI-Simple Alertas &lt;notificacoes@meisimple.com.br&gt;</div>
            <div>
              <strong>Para:</strong> {config.selectedRecipientIds.map(id => users.find(u => u.id === id)?.email).filter(Boolean).join(', ') || 'equipe@empresa.com.br'} {config.additionalEmails ? `, ${config.additionalEmails}` : ''}
            </div>
            <div><strong>Assunto:</strong> 🔔 [MEI-Simple Alerta] Vencimento do DAS-MEI de Agosto/2026 se aproxima (21/09/2026)</div>
          </div>

          {/* Email Content Body */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> MEI-Simple Notificações
              </span>
              <span className="text-[10px] text-slate-500">Guia Mensal Simples Nacional</span>
            </div>

            <p className="text-xs leading-relaxed">
              Olá, <strong>{currentUser?.name || 'Gestor MEI'}</strong>!
            </p>
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              Este é um lembrete automático programado para a sua equipe. O DAS referente ao período <strong>Agosto/2026</strong> possui vencimento no dia <strong>21/09/2026</strong>.
            </p>

            {/* Amount summary box */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-semibold block uppercase">
                  Valor da Guia Mensal
                </span>
                <strong className="text-base text-emerald-950 font-mono">
                  R$ 75,60
                </strong>
              </div>
              <div className="text-right text-[10px] text-slate-600">
                <div>INSS: R$ 70,60</div>
                <div>ICMS/ISS: R$ 5,00</div>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="p-2.5 bg-slate-50 rounded-lg font-mono text-[10px] text-center border border-slate-200">
              <span className="text-slate-500 block text-[9px] mb-0.5">Linha Digitável / Código PIX</span>
              <span className="font-bold tracking-wider text-slate-800 select-all">
                85800000000 75600328260 92026082100 12345678901
              </span>
            </div>

            <div className="pt-2 text-[10.5px] text-slate-500 text-center leading-tight">
              Mantenha suas contribuições em dia e preserve o acesso aos benefícios previdenciários.
            </div>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
