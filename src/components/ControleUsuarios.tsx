/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, DASPayment } from '../types';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { ActionButton } from './ActionButton';
import {
  Users,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Key,
  AlertCircle,
  Plus,
  Trash2,
  Bell,
  Lock,
  Check,
  Save,
  Sparkles,
  Sliders,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { ConfiguracaoLembretes } from './ConfiguracaoLembretes';
import { ConfirmActionModal } from './ConfirmActionModal';
import { ResponsiveModal } from './ResponsiveModal';
import { useIncrementalList } from '../hooks/useIncrementalList';

export interface SystemToolCategory {
  id: string;
  name: string;
  description: string;
}

export const SYSTEM_CATEGORIES: SystemToolCategory[] = [
  { id: 'dashboard', name: 'Dashboard & Gráficos', description: 'Visão executiva, saldo diário e faturamento MEI' },
  { id: 'cadastros', name: 'Cadastros Gerais', description: 'Clientes, fornecedores, produtos, serviços e equipe' },
  { id: 'estoque', name: 'Controle de Estoque', description: 'Movimentações de entrada/saída e alertas de estoque mínimo' },
  { id: 'financeiro', name: 'Financeiro & Caixa', description: 'Lançamentos, conciliação e fluxo de caixa operacional' },
  { id: 'planoContas', name: 'Plano de Contas', description: 'Estrutura hierárquica e centros de custo' },
  { id: 'notas', name: 'Emissão de Notas', description: 'NFS-e, NF-e, download XML e cancelamento' },
  { id: 'relatorios', name: 'Relatórios & DRE', description: 'Relatório fiscal MEI e exportação PDF customizada' },
  { id: 'metas', name: 'Metas & Planejamento', description: 'Objetivos de vendas e controle de margem' },
  { id: 'configuracoes', name: 'Configurações & Google', description: 'Certificado digital e sincronização Google Workspace' },
  { id: 'auditoria', name: 'Trilha de Auditoria', description: 'Logs invioláveis de segurança e conformidade LGPD' }
];

export interface CustomRoleDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: Record<string, boolean>;
  isSystemDefault?: boolean;
}

const DEFAULT_ROLES: CustomRoleDefinition[] = [
  {
    id: 'admin',
    name: 'ADMINISTRADOR (Master)',
    description: 'Acesso total e irrestrito a todas as ferramentas e configurações do sistema.',
    color: 'emerald',
    isSystemDefault: true,
    permissions: {
      dashboard: true,
      cadastros: true,
      estoque: true,
      financeiro: true,
      planoContas: true,
      notas: true,
      relatorios: true,
      metas: true,
      configuracoes: true,
      auditoria: true
    }
  },
  {
    id: 'auxiliar',
    name: 'AUXILIAR (Operacional)',
    description: 'Acesso restrito para operação diária de caixa, estoque e cadastros.',
    color: 'blue',
    isSystemDefault: true,
    permissions: {
      dashboard: true,
      cadastros: true,
      estoque: true,
      financeiro: false,
      planoContas: false,
      notas: true,
      relatorios: false,
      metas: false,
      configuracoes: false,
      auditoria: false
    }
  }
];

const ROLES_STORAGE_KEY = 'meisimple_custom_roles_v2';

interface ControleUsuariosProps {
  users: User[];
  currentUser: User | null;
  dasPayments?: DASPayment[];
  onAddUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onToggleUserStatus: (id: string) => void;
  onChangeUserRole: (id: string, role: UserRole) => void;
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO', descricao: string) => void;
}

export const ControleUsuarios = React.memo(function ControleUsuarios({
  users,
  currentUser,
  dasPayments,
  onAddUser,
  onDeleteUser,
  onToggleUserStatus,
  onChangeUserRole,
  addLog
}: ControleUsuariosProps) {
  const [activeSubTab, setActiveSubTab] = useState<'usuarios' | 'permissoes' | 'lembretes'>('usuarios');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);

  // Incremental data loading for users list (10 initially, load more on scroll)
  const {
    visibleItems: visibleUsers,
    hasMore: hasMoreUsers,
    totalCount: totalUsersCount,
    displayedCount: displayedUsersCount,
    sentinelRef: usersSentinelRef
  } = useIncrementalList(users, 10, 10);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('auxiliar');

  // Custom Roles & Permissions state persisted in localStorage
  const [roles, setRoles] = useState<CustomRoleDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(ROLES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_ROLES;
  });

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('indigo');
  const [saveRoleSuccess, setSaveRoleSuccess] = useState(false);

  // Persist roles whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
    } catch {
      // ignore
    }
  }, [roles]);

  const isMasterOrAdmin = useMemo(() => {
    const r = currentUser?.role?.toLowerCase();
    return r === 'admin' || r === 'master';
  }, [currentUser]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    if (users.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      alert(`O email "${newUserEmail}" já está cadastrado em outra conta operacional.`);
      return;
    }

    const roleDef = roles.find(r => r.id === newUserRole);
    const permissions = roleDef ? roleDef.permissions : (newUserRole === 'admin'
      ? { dashboard: true, cadastros: true, estoque: true, financeiro: true, notas: true, relatorios: true, configuracoes: true }
      : { dashboard: true, cadastros: true, estoque: true, financeiro: false, notas: true, relatorios: false, configuracoes: false });

    const nUsr: User = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole as UserRole,
      permissions: permissions as any,
      ativo: true,
      lgpdAceito: true,
      lgpdDataConsentimento: new Date().toISOString()
    };

    onAddUser(nUsr);
    addLog('Usuarios', 'CRIACAO', `Criado usuário de acesso: ${newUserName.trim()} (${newUserRole})`);

    setNewUserName('');
    setNewUserEmail('');
    setShowAddForm(false);
  };

  const handleRoleChange = (id: string, role: string) => {
    const usr = users.find(u => u.id === id);
    if (!usr) return;

    if (usr.id === currentUser?.id) {
      alert('Você não pode alterar sua própria permissão de segurança para evitar lockouts de privilégio master.');
      return;
    }

    onChangeUserRole(id, role as UserRole);
    addLog('Usuarios', 'EDICAO', `Permissão de "${usr.name}" alterada para ${role}`);
  };

  const handleToggleStatus = (id: string) => {
    const usr = users.find(u => u.id === id);
    if (!usr) return;

    if (usr.id === currentUser?.id) {
      alert('Não é possível desabilitar seu próprio acesso enquanto logado no sistema.');
      return;
    }

    onToggleUserStatus(id);
    addLog('Usuarios', 'EDICAO', `${usr.ativo ? 'Desativado' : 'Ativado'} acesso do operador: ${usr.name}`);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    itemName?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  const handleDelete = (id: string) => {
    const usr = users.find(u => u.id === id);
    if (!usr) return;

    if (usr.id === currentUser?.id) {
      alert('Você não pode deletar seu próprio login master.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Usuário do Sistema',
      description: 'Esta credencial de operador será permanentemente revogada. Seu histórico e logs de auditoria continuarão preservados na base.',
      itemName: `${usr.name} (${usr.email})`,
      onConfirm: () => {
        onDeleteUser(id);
        addLog('Usuarios', 'EXCLUSAO', `Excluída credencial do operador: ${usr.name}`);
      }
    });
  };

  // Permission Matrix toggles
  const handleToggleCategoryPermission = (roleId: string, categoryId: string) => {
    if (!isMasterOrAdmin) return;
    setRoles(prev =>
      prev.map(r => {
        if (r.id !== roleId) return r;
        const currentVal = !!r.permissions[categoryId];
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [categoryId]: !currentVal
          }
        };
      })
    );
  };

  const handleCreateNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const id = `role_${newRoleName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const initialPerms: Record<string, boolean> = {};
    SYSTEM_CATEGORIES.forEach(cat => {
      initialPerms[cat.id] = true;
    });

    const newRole: CustomRoleDefinition = {
      id,
      name: newRoleName.trim().toUpperCase(),
      description: newRoleDesc.trim() || 'Nível de autorização personalizado pelo Administrador Master.',
      color: newRoleColor,
      permissions: initialPerms,
      isSystemDefault: false
    };

    setRoles(prev => [...prev, newRole]);
    addLog('Usuarios', 'CRIACAO', `Criado novo nível de autorização: ${newRole.name}`);
    setNewRoleName('');
    setNewRoleDesc('');
    setShowNewRoleModal(false);
    setSaveRoleSuccess(true);
    setTimeout(() => setSaveRoleSuccess(false), 3000);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete || roleToDelete.isSystemDefault) {
      alert('Níveis de autorização padrão do sistema não podem ser removidos.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Nível de Autorização',
      description: `Confirma a exclusão do nível de autorização "${roleToDelete.name}"? Usuários vinculados a ele serão transferidos para o perfil Auxiliar.`,
      itemName: roleToDelete.name,
      onConfirm: () => {
        setRoles(prev => prev.filter(r => r.id !== roleId));
        addLog('Usuarios', 'EXCLUSAO', `Excluído nível de autorização: ${roleToDelete.name}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSubTab('usuarios')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'usuarios'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Equipe & Usuários ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('permissoes')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'permissoes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Matriz de Permissões & Níveis</span>
          {isMasterOrAdmin && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded border border-emerald-400/40">
              Master
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('lembretes')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
            activeSubTab === 'lembretes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Lembretes DAS-MEI</span>
        </button>
      </div>

      {activeSubTab === 'lembretes' ? (
        <ConfiguracaoLembretes
          users={users}
          currentUser={currentUser}
          dasPayments={dasPayments}
          addLog={addLog}
        />
      ) : activeSubTab === 'permissoes' ? (
        /* ============================================================== */
        /* TAB 2: MATRIZ DE PERMISSÕES & NÍVEIS DE AUTORIZAÇÃO (EXCLUSIVO MASTER/ADMIN) */
        /* ============================================================== */
        <div className="space-y-6">
          {!isMasterOrAdmin ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-amber-900">
                Acesso Restrito a Usuários Master e Administradores
              </h4>
              <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                Apenas usuários com perfil Master / Administrador têm permissão para criar novos níveis de autorização e personalizar a matriz de permissões das ferramentas do sistema.
              </p>
            </div>
          ) : (
            <>
              {/* Master Header */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
                <SectionHeader
                  icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
                  title="Gerenciador de Níveis de Autorização & Permissões por Categoria"
                  info="Personalize o acesso a cada módulo e crie novos papéis operacionais. Todas as alterações permanecem salvas de forma permanente no sistema."
                  actions={
                    <ActionButton
                      size="sm"
                      onClick={() => setShowNewRoleModal(true)}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Criar Novo Nível
                    </ActionButton>
                  }
                />
              </div>

              {saveRoleSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Nível de autorização salvo e sincronizado no sistema com sucesso!
                </div>
              )}

              {/* Roles Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(r => (
                  <div key={r.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <h4 className="text-xs font-bold text-slate-900">{r.name}</h4>
                      </div>
                      {!r.isSystemDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomRole(r.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Excluir Nível Personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed min-h-[34px]">
                      {r.description}
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Ferramentas liberadas:</span>
                      <strong className="font-mono text-emerald-700 font-bold">
                        {Object.values(r.permissions).filter(Boolean).length} / {SYSTEM_CATEGORIES.length}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Permission Matrix Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                        Matriz de Permissões das Ferramentas
                        <InfoTooltip text="Marque ou desmarque as ferramentas para cada nível" />
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold text-[11px]">
                        <th className="py-3 px-4 min-w-[200px]">Categoria da Ferramenta</th>
                        {roles.map(r => (
                          <th key={r.id} className="py-3 px-3 text-center min-w-[130px]">
                            <span className="block">{r.name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SYSTEM_CATEGORIES.map(category => (
                        <tr key={category.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block text-xs">{category.name}</strong>
                            <span className="text-[10.5px] text-slate-500">{category.description}</span>
                          </td>
                          {roles.map(r => {
                            const isAllowed = !!r.permissions[category.id];
                            return (
                              <td key={r.id} className="py-3 px-3 text-center">
                                <label className="inline-flex items-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={isAllowed}
                                    onChange={() => handleToggleCategoryPermission(r.id, category.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* TAB 1: EQUIPE & USUÁRIOS COM INCREMENTAL SCROLL E RESPONSIVE MODAL */
        /* ============================================================== */
        <>
          {/* Intro visual banner */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
            <SectionHeader
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              title="Controle de Usuários e Permissões de Acesso"
              info="Gerencie os colaboradores da sua empresa MEI. Defina quem pode emitir notas, alterar o estoque ou conciliar o extrato financeiro com governança e LGPD."
              actions={
                <ActionButton
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Adicionar Operador
                </ActionButton>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* User rules detail panel */}
            <div className="border border-slate-200 p-5 rounded-2xl bg-white shadow-xs space-y-4 text-xs">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Shield className="w-4 h-4 text-emerald-600" />
                Níveis de Autorização Ativos
              </h4>

              <div className="space-y-2.5 leading-relaxed text-slate-600">
                {roles.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <strong className="text-slate-900 flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> {r.name}
                    </strong>
                    <p className="text-[11px] text-slate-500 leading-normal">{r.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 flex gap-2.5">
                <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">
                  A conformidade LGPD exige consentimento de dados ativo para cada usuário da equipe. O MEI-Simple automatiza essa assinatura ao primeiro login.
                </p>
              </div>
            </div>

            {/* Master User List Table Grid with Incremental Loading */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs lg:col-span-2 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center">
                    <span>Equipe Cadastrada</span>
                    <InfoTooltip text={`Exibindo ${displayedUsersCount} de ${totalUsersCount} operadores`} />
                  </h4>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {visibleUsers.map((usr) => {
                  const isSelf = usr.id === currentUser?.id;
                  
                  return (
                    <div 
                      key={usr.id} 
                      className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-slate-50/60 shadow-2xs ${
                        usr.ativo === false 
                          ? 'bg-slate-50/60 opacity-60 border-slate-200' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-bold text-sm border border-emerald-200 shrink-0">
                          {usr.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-xs font-bold text-slate-900">
                              {usr.name}
                            </h5>
                            {isSelf && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                                Você
                              </span>
                            )}
                          </div>
                          
                          <span className="text-[11px] text-slate-500 block font-mono mt-0.5 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {usr.email}
                          </span>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> LGPD: {usr.lgpdAceito ? `Consentido em ${new Date(usr.lgpdDataConsentimento || '').toLocaleDateString()}` : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-2.5 border-t md:border-none pt-2 md:pt-0">
                        <select
                          value={usr.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(usr.id, e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-medium py-1.5 px-2.5 focus:outline-none focus:border-emerald-500"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(usr.id)}
                            disabled={isSelf}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer disabled:opacity-40 select-none shadow-2xs ${
                              usr.ativo !== false 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={usr.ativo !== false ? 'Inativar Usuário' : 'Ativar Usuário'}
                          >
                            {usr.ativo !== false ? 'Inativar' : 'Reabilitar'}
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDelete(usr.id)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 p-2 rounded-xl cursor-pointer transition shadow-2xs"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Sentinel for incremental scroll */}
                {hasMoreUsers && (
                  <div ref={usersSentinelRef} className="py-2 text-center text-xs text-slate-400">
                    Carregando mais operadores...
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* -------------------------------------------------------------
          RESPONSIVE MODAL: NEW OPERATOR INCLUSION FORM (iOS BOTTOM SHEET ON MOBILE)
          ------------------------------------------------------------- */}
      <ResponsiveModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        maxWidth="max-w-md"
        title="Adicionar Operador de Equipe"
        subtitle="Cadastra credencial e envia simulação de primeiro acesso"
        icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Ex: Amanda Mendes..."
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Profissional *</label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="amanda@marcenariamei.com.br"
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 font-mono px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nível de Autorização Inicial</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 shadow-2xs font-medium"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 font-bold">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl border border-slate-200 text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
            >
              Salvar Operador
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* -------------------------------------------------------------
          RESPONSIVE MODAL: CREATE NEW AUTHORIZATION LEVEL
          ------------------------------------------------------------- */}
      <ResponsiveModal
        isOpen={showNewRoleModal}
        onClose={() => setShowNewRoleModal(false)}
        maxWidth="max-w-md"
        title="Criar Novo Nível de Autorização"
        subtitle="Define um novo perfil de acesso permanente para a equipe MEI"
        icon={<Shield className="w-5 h-5 text-emerald-600" />}
      >
        <form onSubmit={handleCreateNewRole} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome do Nível / Função *
            </label>
            <input
              type="text"
              required
              placeholder="ex: CONTADOR EXTERNO, VENDEDOR, OPERADOR CAIXA..."
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição de Atuação
            </label>
            <textarea
              rows={2}
              placeholder="Descreva as responsabilidades e restrições desse perfil..."
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 shadow-2xs leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 font-bold">
            <button
              type="button"
              onClick={() => setShowNewRoleModal(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl border border-slate-200 text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition"
            >
              Criar e Adicionar à Matriz
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Modal Global de Confirmação para Exclusões (Requisito 2) */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        itemName={confirmModal.itemName}
      />

    </div>
  );
});

export default ControleUsuarios;
