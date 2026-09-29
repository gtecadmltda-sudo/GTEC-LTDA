import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  TrendingUp, 
  FileText, 
  Target, 
  BarChart, 
  Settings, 
  Lock, 
  Pin, 
  PinOff, 
  User as UserIcon, 
  LogOut, 
  Camera, 
  Sparkles, 
  Trash2, 
  Receipt 
} from 'lucide-react';
import { Product, User } from '../types';

export interface DesktopSidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  sidebarPinned: boolean;
  sidebarHovered: boolean;
  onTogglePin: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  clientsCount: number;
  suppliersCount: number;
  products?: Product[];
  hasLowStock?: boolean;
  hasViewPermission: (view: string) => boolean;
  currentUser?: User | null;
  onUpdateUserPhoto?: (photoDataUrl: string | undefined) => void;
  onOpenStories?: () => void;
  onLogout?: () => void;
}

export const DesktopSidebar = memo(function DesktopSidebar({
  activeView,
  onNavigate,
  sidebarPinned,
  onTogglePin,
  clientsCount,
  suppliersCount,
  products,
  hasLowStock: propHasLowStock,
  hasViewPermission,
  currentUser,
  onUpdateUserPhoto,
  onOpenStories,
  onLogout
}: DesktopSidebarProps) {
  const isLowStock = propHasLowStock ?? (products ? products.some(p => p.estoqueAtual <= p.estoqueMinimo) : false);

  const [showUserPopup, setShowUserPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Fecha o popup ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowUserPopup(false);
      }
    }
    if (showUserPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserPopup]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateUserPhoto?.(reader.result);
          setShowUserPopup(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside 
      className="hidden md:flex flex-col justify-between fixed top-[10mm] left-[10mm] bottom-[10mm] w-[256px] z-[100] p-4 glass-panel-3d rounded-3xl overflow-hidden shadow-2xl select-none"
    >
      {/* Input de arquivo oculto para upload de foto */}
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Top Section: Header + User Profile Card + Scrollable Navigation */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header block with navigation label and pin state */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
          <span className="font-bold text-slate-300 tracking-wider text-[11px] uppercase">Navegação</span>
          <button 
            type="button"
            onClick={onTogglePin}
            className="p-1 hover:bg-white/10 text-slate-400 hover:text-white transition rounded-xl cursor-pointer"
            title={sidebarPinned ? "Painel fixo ativo" : "Fixar menu"}
            aria-label="Fixar menu"
          >
            {sidebarPinned ? <Pin className="w-3.5 h-3.5 text-[#2dd683]" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Card de Usuário no Menu Lateral */}
        <div ref={popupRef} className="relative mb-3 shrink-0">
          <div className="p-3 bg-white/5 rounded-2xl border border-[#2dd683]/60 shadow-2xs flex flex-col items-center text-center backdrop-blur-sm">
            {/* Foto circular com upload */}
            <button
              type="button"
              onClick={() => setShowUserPopup(!showUserPopup)}
              className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#2dd683] bg-emerald-950/60 text-emerald-300 flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 transition-transform group"
              title="Clique para opções de perfil e stories"
              aria-label="Opções de perfil do usuário"
            >
              {currentUser?.foto ? (
                <img 
                  src={currentUser.foto} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover rounded-full" 
                />
              ) : (
                <UserIcon className="w-7 h-7 text-emerald-300" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
            </button>

            {/* Nome do usuário em caixa alta */}
            <span className="mt-2 font-black text-xs text-white uppercase tracking-tight max-w-full truncate px-1">
              {currentUser?.name || 'CARLOS OLIVEIRA'}
            </span>

            {/* Badge de Nível de Acesso */}
            <div className="mt-1">
              <span className="text-[10px] text-emerald-300 font-extrabold uppercase bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 inline-block shadow-2xs">
                {currentUser?.role === 'admin' ? 'MASTER' : 'AUXILIAR'}
              </span>
            </div>
          </div>

          {/* Popup de Ações ao clicar no usuário */}
          {showUserPopup && (
            <div 
              className="absolute z-50 p-2 glass-panel-3d bg-[#0f1722]/95 rounded-2xl border border-white/15 shadow-2xl transition-all top-[calc(100%+6px)] left-0 right-0"
            >
              <div className="text-[10px] font-extrabold uppercase text-slate-400 px-2 py-1 tracking-wider border-b border-white/10 mb-1">
                Opções do Perfil
              </div>

              {/* Opção a: Editar Foto */}
              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-xs font-bold text-slate-200 hover:text-white cursor-pointer transition active:scale-98"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate">
                    {currentUser?.foto ? 'Editar Foto' : 'Adicionar Foto'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Formato circular
                  </div>
                </div>
              </button>

              {/* Opção b: Acessar Stories */}
              <button
                type="button"
                onClick={() => {
                  setShowUserPopup(false);
                  onOpenStories?.();
                }}
                className="w-full text-left p-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-xs font-bold text-slate-200 hover:text-white cursor-pointer transition active:scale-98 mt-1"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-950/60 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate">
                    Acessar Stories
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Dicas e orientações MEI
                  </div>
                </div>
              </button>

              {/* Opção c: Remover Foto */}
              {currentUser?.foto && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateUserPhoto?.(undefined);
                    setShowUserPopup(false);
                  }}
                  className="w-full text-left p-2 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center gap-2 text-xs font-bold cursor-pointer transition mt-1 border-t border-white/10"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400 ml-1" />
                  <span className="text-[11px]">Remover Foto</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Navigation Links */}
        <div className="overflow-y-auto pr-1 space-y-1.5 flex-1 min-h-0 custom-scrollbar">
          {/* 1. Painel */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            title="Painel Principal MEI-Simple"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
            <span>Painel</span>
          </button>

          {/* 2. Cadastros */}
          <button
            type="button"
            onClick={() => onNavigate('cadastros')}
            title="Cadastros de Clientes, Fornecedores e Produtos"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
              activeView === 'cadastros'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4.5 h-4.5 shrink-0" />
              <span>Cadastros</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeView === 'cadastros' ? 'bg-[#000000] text-[#2dd683]' : 'bg-white/10 text-slate-200 border border-white/10'
            }`}>
              {clientsCount + suppliersCount}
            </span>
          </button>

          {/* 3. Estoque */}
          <button
            type="button"
            onClick={() => onNavigate('estoque')}
            title="Controle de Estoque & Movimentações"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
              activeView === 'estoque'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4.5 h-4.5 shrink-0" />
              <span>Estoque</span>
            </span>
            {isLowStock && (
              <span className="w-2 h-2 bg-[#cb6ce6] rounded-full animate-ping" />
            )}
          </button>

          {/* 4. Finanças & Caixa */}
          <button
            type="button"
            onClick={() => {
              if (hasViewPermission('financeiro')) {
                onNavigate('financeiro');
              } else {
                alert('Acesso negado!\n\nSeu perfil não tem direitos para visualizar fluxos bancários.');
              }
            }}
            title="Fluxo de Caixa, Lançamentos e Finanças"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
              activeView === 'financeiro'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <TrendingUp className="w-4.5 h-4.5 shrink-0" />
              <span>Finanças & Caixa</span>
            </span>
            {!hasViewPermission('financeiro') && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </button>

          {/* 5. Notas Fiscais (Emissão) */}
          <button
            type="button"
            id="tour-emissao-check"
            onClick={() => onNavigate('fiscal')}
            title="Emissão e Gestão de Notas Fiscais (NF-e / NFS-e)"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
              activeView === 'fiscal'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText className="w-4.5 h-4.5 shrink-0" />
            <span>Notas Fiscais (Emissão)</span>
          </button>

          {/* 6. Obrigações MEI (DAS/SIMEI) */}
          <button
            type="button"
            onClick={() => onNavigate('obrigacoes')}
            title="Guia Mensal DAS, Teto de Faturamento e Declaração SIMEI"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
              activeView === 'obrigacoes' || activeView === 'das'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Receipt className={`w-4.5 h-4.5 shrink-0 ${activeView === 'obrigacoes' || activeView === 'das' ? 'text-black' : 'text-[#2dd683]'}`} />
            <span>Obrigações MEI (DAS)</span>
          </button>

          {/* 7. Metas */}
          <button
            type="button"
            onClick={() => onNavigate('metas')}
            title="Metas & Indicadores de Desempenho"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
              activeView === 'metas'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Target className={`w-4.5 h-4.5 shrink-0 ${activeView === 'metas' ? 'text-black' : 'text-[#5E17EB]'}`} />
            <span>Metas</span>
          </button>

          {/* 8. Relatórios & DRE */}
          <button
            type="button"
            onClick={() => {
              if (hasViewPermission('relatorios')) {
                onNavigate('relatorios');
              } else {
                alert('Privilégio restrito!\n\nAcesso aos relatórios fiscais negado.');
              }
            }}
            title="Faturamento, Relatórios Fiscais e DRE"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
              activeView === 'relatorios'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BarChart className="w-4.5 h-4.5 shrink-0" />
              <span>Relatórios & DRE</span>
            </span>
            {!hasViewPermission('relatorios') && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </button>

          {/* 9. Configurações */}
          <button
            type="button"
            onClick={() => {
              if (hasViewPermission('configuracoes')) {
                onNavigate('configuracoes');
              } else {
                alert('Acesso negado!\n\nAs configurações exigem nível de acesso MASTER.');
              }
            }}
            title="Configurações do Sistema"
            className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
              activeView === 'configuracoes'
                ? 'bg-[#2dd683] text-[#000000] shadow-xs font-black'
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Settings className={`w-4.5 h-4.5 shrink-0 ${activeView === 'configuracoes' ? 'text-black' : 'text-slate-200'}`} />
              <span>Configurações</span>
            </span>
            {!hasViewPermission('configuracoes') && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          </button>
        </div>
      </div>

      {/* Bottom Section: Company info & Logout button */}
      <div className="pt-3 border-t border-white/10 text-[11px] text-slate-300 leading-relaxed font-sans flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0 flex-1">
          <span className="block font-bold text-white truncate">Carlos Oliveira MEI</span>
          <span className="block text-slate-400 font-mono text-[10px] truncate">CNPJ: 30.751.934/0001-30</span>
          <span className="inline-block mt-1 text-[#000000] bg-[#2dd683] px-2 py-0.5 rounded-lg font-bold text-[9.5px]">MEI-Simple</span>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl cursor-pointer transition border border-rose-500/30 shadow-2xs shrink-0 active:scale-95"
            title="Desconectar do MEI-Simple"
            aria-label="Sair do sistema"
          >
            <LogOut className="w-4.5 h-4.5 text-rose-400" />
          </button>
        )}
      </div>
    </aside>
  );
});

export default DesktopSidebar;
