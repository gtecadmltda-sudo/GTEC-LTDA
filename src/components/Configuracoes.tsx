import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Cloud, 
  Bell, 
  BookOpen, 
  Users, 
  ShieldAlert, 
  Building2, 
  FileCheck,
  HardDrive,
  FileSpreadsheet,
  CheckCircle2,
  Save,
  Zap,
  Download
} from 'lucide-react';
import { 
  User, 
  UserRole, 
  AuditLog, 
  FinancialCategory, 
  DASPayment, 
  Client, 
  Supplier, 
  Employee, 
  Product, 
  Service, 
  FinancialTransaction, 
  StockMovement, 
  Invoice, 
  Goal 
} from '../types';
import { ConfiguracaoCertificadoDigital, DigitalCertificate } from './ConfiguracaoCertificadoDigital';
import { ConfiguracaoLembretes } from './ConfiguracaoLembretes';
import { PlanoDeContas } from './PlanoDeContas';
import { ControleUsuarios } from './ControleUsuarios';
import { LogsAuditoria } from './LogsAuditoria';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { PainelIntegracoes } from './PainelIntegracoes';

const DEFAULT_CERTIFICATE: DigitalCertificate = {
  isUploaded: true,
  tipo: 'A1',
  titular: 'Carlos Oliveira Marcenaria MEI',
  cnpj: '30.751.934/0001-30',
  emissor: 'Certisign ICP-Brasil',
  validadeInicio: '2026-01-10',
  validadeFim: '2027-01-10',
  diasRestantes: 290,
  status: 'VALID',
  ufSefaz: 'SP',
  ambiente: 'HOMOLOGACAO',
  fileName: 'certificado_carlos_oliveira_2026.pfx',
  fileSize: '4.2 KB',
  serialNumber: '7B:4A:89:12:F0:34',
  lastValidated: '2026-06-01 10:00'
};

export interface ConfiguracoesProps {
  certificate?: DigitalCertificate;
  onUpdateCertificate?: (cert: DigitalCertificate) => void;
  categories: FinancialCategory[];
  onAddCategory: (c: FinancialCategory) => void;
  onUpdateCategory: (id: string, updated: Partial<FinancialCategory>) => void;
  onDeleteCategory: (id: string) => void;
  users?: User[];
  usersList?: User[];
  currentUser: User | null;
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onToggleUserStatus: (id: string) => void;
  onChangeUserRole: (id: string, role: UserRole) => void;
  logs?: AuditLog[];
  auditLogs?: AuditLog[];
  dasPayments: DASPayment[];
  onPayDAS?: (id: string) => void;
  clients: Client[];
  suppliers: Supplier[];
  employees: Employee[];
  products: Product[];
  services: Service[];
  transactions: FinancialTransaction[];
  stockMovements: StockMovement[];
  invoices: Invoice[];
  goals: Goal[];
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'EXPORTACAO', descricao: string) => void;
  initialTab?: 'certificado' | 'empresa' | 'integracoes' | 'nuvem' | 'lembretes' | 'contas' | 'equipe' | 'auditoria';
}

export const Configuracoes = React.memo(function Configuracoes({
  certificate: propCert,
  onUpdateCertificate: propOnUpdateCert,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  users: propUsers,
  usersList: propUsersList,
  currentUser,
  onAddUser,
  onDeleteUser,
  onToggleUserStatus,
  onChangeUserRole,
  logs: propLogs,
  auditLogs: propAuditLogs,
  dasPayments,
  onPayDAS,
  clients,
  suppliers,
  employees,
  products,
  services,
  transactions,
  stockMovements,
  invoices,
  goals,
  addLog,
  initialTab = 'certificado'
}: ConfiguracoesProps) {
  const users = propUsers || propUsersList || [];
  const logs = propLogs || propAuditLogs || [];
  const [internalCert, setInternalCert] = useState<DigitalCertificate>(DEFAULT_CERTIFICATE);
  const certificate = propCert || internalCert;
  const onUpdateCertificate = propOnUpdateCert || setInternalCert;
  const [activeTab, setActiveTab] = useState<'certificado' | 'empresa' | 'integracoes' | 'nuvem' | 'lembretes' | 'contas' | 'equipe' | 'auditoria'>(initialTab);

  // Empresa MEI Editable State
  const [empresaData, setEmpresaData] = useState(() => {
    const saved = localStorage.getItem('meisimple_empresa_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback default
      }
    }
    return {
      razaoSocial: 'Carlos Oliveira - Marcenaria MEI',
      nomeFantasia: 'Oliveira Móveis & Design',
      cnpj: '30.751.934/0001-30',
      regime: 'SIMEI - Simples Nacional',
      cnae: '3101-2/00 - Fabricação de móveis com predominância de madeira',
      inscricaoEstadual: '114.892.451.119',
      inscricaoMunicipal: '8.921.340-1',
      telefone: '(11) 98765-4321',
      email: 'carlos.oliveira.marcenaria@gmail.com',
      logradouro: 'Rua das Araucárias, 450',
      bairro: 'Vila Madalena',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '05432-000'
    };
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('meisimple_empresa_data', JSON.stringify(empresaData));
    addLog('Configurações', 'EDICAO', 'Dados cadastrais da empresa MEI atualizados com sucesso.');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const navCategories = [
    {
      id: 'certificado',
      label: 'Certificado Digital',
      desc: 'SEFAZ A1, A3 e Nuvem',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'empresa',
      label: 'Dados da Empresa',
      desc: 'CNPJ, Razão e Atividades',
      icon: Building2,
      color: 'text-[#004AAD]',
      bgColor: 'bg-[#e6effa]'
    },
    {
      id: 'integracoes',
      label: 'Integrações',
      desc: 'Google Sheets & Agenda',
      icon: Zap,
      color: 'text-[#004AAD]',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'nuvem',
      label: 'Nuvem & Backup',
      desc: 'Google Drive & Workspace',
      icon: Cloud,
      color: 'text-[#5E17EB]',
      bgColor: 'bg-[#f3ecfd]'
    },
    {
      id: 'lembretes',
      label: 'Lembretes & DAS',
      desc: 'Prazos fiscais e alertas',
      icon: Bell,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      id: 'contas',
      label: 'Plano de Contas',
      desc: 'Categorias de Receitas/Despesas',
      icon: BookOpen,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 'equipe',
      label: 'Equipe & Acessos',
      desc: 'Usuários e permissões',
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      id: 'auditoria',
      label: 'Trilha de Auditoria',
      desc: 'Histórico e conformidade',
      icon: ShieldAlert,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100'
    }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
        <SectionHeader
          as="h1"
          icon={<Settings className="w-6 h-6 text-[#2dd683]" />}
          iconVariant="default"
          title="Central de Configurações"
          info="Gerencie todos os parâmetros fiscais, integrações na nuvem, segurança e cadastros gerais do MEI"
          badges={
            <StatusBadge tone="neutral" label="Ambiente: Homologado & Ativo" />
          }
        />

        {/* Category Navigation Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {navCategories.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl transition cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-[#2dd683] text-black border-[#2dd683] shadow-xs font-black'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Panels */}
      <div>
        {/* 1. CERTIFICADO DIGITAL */}
        {activeTab === 'certificado' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  O Certificado Digital A1 ou em Nuvem é utilizado pelo sistema para assinar notas fiscais eletrônicas (NF-e) perante a SEFAZ estadual com validade jurídica.
                </span>
              </div>
            </div>

            <ConfiguracaoCertificadoDigital
              certificate={certificate}
              onUpdateCertificate={onUpdateCertificate}
            />
          </div>
        )}

        {/* 2. DADOS DA EMPRESA MEI */}
        {activeTab === 'empresa' && (
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#004AAD]" />
                  <span>Dados Cadastrais do CNPJ MEI</span>
                  <InfoTooltip text="Informações oficiais utilizadas no cabeçalho das notas fiscais e relatórios contábeis" />
                </h3>
              </div>

              {savedSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" /> Alterações salvas!
                </div>
              )}
            </div>

            <form onSubmit={handleSaveEmpresa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social</label>
                  <input
                    type="text"
                    value={empresaData.razaoSocial}
                    onChange={(e) => setEmpresaData({ ...empresaData, razaoSocial: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={empresaData.nomeFantasia}
                    onChange={(e) => setEmpresaData({ ...empresaData, nomeFantasia: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={empresaData.cnpj}
                    onChange={(e) => setEmpresaData({ ...empresaData, cnpj: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Regime Tributário</label>
                  <input
                    type="text"
                    disabled
                    value={empresaData.regime}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inscrição Estadual (IE)</label>
                  <input
                    type="text"
                    value={empresaData.inscricaoEstadual}
                    onChange={(e) => setEmpresaData({ ...empresaData, inscricaoEstadual: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inscrição Municipal (IM)</label>
                  <input
                    type="text"
                    value={empresaData.inscricaoMunicipal}
                    onChange={(e) => setEmpresaData({ ...empresaData, inscricaoMunicipal: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Atividade Econômica Principal (CNAE)</label>
                  <input
                    type="text"
                    value={empresaData.cnae}
                    onChange={(e) => setEmpresaData({ ...empresaData, cnae: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Comercial</label>
                  <input
                    type="email"
                    value={empresaData.email}
                    onChange={(e) => setEmpresaData({ ...empresaData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Comercial</label>
                  <input
                    type="text"
                    value={empresaData.telefone}
                    onChange={(e) => setEmpresaData({ ...empresaData, telefone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Comercial</label>
                  <input
                    type="text"
                    value={empresaData.logradouro}
                    onChange={(e) => setEmpresaData({ ...empresaData, logradouro: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cidade / UF / CEP</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={empresaData.cidade}
                      onChange={(e) => setEmpresaData({ ...empresaData, cidade: e.target.value })}
                      placeholder="Cidade"
                      className="w-1/2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
                    />
                    <input
                      type="text"
                      value={empresaData.uf}
                      onChange={(e) => setEmpresaData({ ...empresaData, uf: e.target.value })}
                      placeholder="UF"
                      className="w-1/4 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900"
                    />
                    <input
                      type="text"
                      value={empresaData.cep}
                      onChange={(e) => setEmpresaData({ ...empresaData, cep: e.target.value })}
                      placeholder="CEP"
                      className="w-1/4 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2dd683] hover:bg-[#25c074] text-black font-extrabold text-xs transition cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" /> Salvar Informações da Empresa
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. INTEGRAÇÕES (GOOGLE SHEETS & GOOGLE AGENDA) */}
        {activeTab === 'integracoes' && (
          <div className="space-y-4">
            <PainelIntegracoes
              transactions={transactions}
              categories={categories}
              dasPayments={dasPayments}
              invoices={invoices}
              addLog={addLog}
            />
          </div>
        )}

        {/* 4. NUVEM & BACKUP */}
        {activeTab === 'nuvem' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-600" /> Backup e Exportação dos Dados do MEI
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gere cópias de segurança integrais de todas as transações, cadastros, notas fiscais e relatórios gerenciais em formato JSON estruturado.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-800">Exportar Backup Completo (JSON)</p>
                <p className="text-xs text-slate-500">Inclui clientes, fornecedores, produtos, notas fiscais, caixa e histórico fiscal.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const backupData = {
                    version: '1.0.0',
                    exportDate: new Date().toISOString(),
                    clients,
                    suppliers,
                    employees,
                    products,
                    services,
                    categories,
                    transactions,
                    stockMovements,
                    invoices,
                    dasPayments,
                    goals
                  };
                  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `meisimple_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  addLog('Configurações', 'EXPORTACAO', 'Backup completo do sistema exportado em arquivo JSON.');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Baixar Arquivo de Backup
              </button>
            </div>
          </div>
        )}

        {/* 4. NOTIFICAÇÕES & LEMBRETES DAS */}
        {activeTab === 'lembretes' && (
          <div className="space-y-4">
            <ConfiguracaoLembretes
              users={users}
              currentUser={currentUser}
              dasPayments={dasPayments}
              addLog={addLog}
            />
          </div>
        )}

        {/* 5. PLANO DE CONTAS FINANCEIRO */}
        {activeTab === 'contas' && (
          <div className="space-y-4">
            <PlanoDeContas
              categories={categories}
              onAddCategory={onAddCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
              addLog={addLog}
            />
          </div>
        )}

        {/* 6. EQUIPE & USUÁRIOS */}
        {activeTab === 'equipe' && (
          <div className="space-y-4">
            <ControleUsuarios
              users={users}
              currentUser={currentUser}
              dasPayments={dasPayments}
              onAddUser={onAddUser}
              onDeleteUser={onDeleteUser}
              onToggleUserStatus={onToggleUserStatus}
              onChangeUserRole={onChangeUserRole}
              addLog={addLog}
            />
          </div>
        )}

        {/* 7. LOGS DE AUDITORIA */}
        {activeTab === 'auditoria' && (
          <div className="space-y-4">
            <LogsAuditoria logs={logs} />
          </div>
        )}
      </div>
    </div>
  );
});
