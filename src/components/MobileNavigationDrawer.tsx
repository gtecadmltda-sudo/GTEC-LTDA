import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  Sparkles,
  LayoutDashboard, 
  Users, 
  Package, 
  TrendingUp, 
  FileText, 
  Target, 
  BarChart, 
  Settings,
  Lock,
  User as UserIcon,
  LogOut,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  Play,
  Camera,
  Trash2,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';

export interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  hasViewPermission: (view: string) => boolean;
  currentUser?: User | null;
  users?: User[];
  onSwitchUser?: (user: User) => void;
  onOpenSearch?: () => void;
  onOpenTutorial?: () => void;
  onOpenOnboarding?: () => void;
  onOpenStories?: () => void;
  onUpdateUserPhoto?: (photoDataUrl: string | undefined) => void;
  onLogout?: () => void;
}

export const MobileNavigationDrawer = memo(function MobileNavigationDrawer({
  isOpen,
  onClose,
  activeView,
  onNavigate,
  hasViewPermission,
  currentUser,
  users = [],
  onSwitchUser,
  onOpenSearch,
  onOpenTutorial,
  onOpenOnboarding,
  onOpenStories,
  onUpdateUserPhoto,
  onLogout
}: MobileNavigationDrawerProps) {
  const [showUserList, setShowUserList] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Fecha popup ao clicar fora
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

  const handleTutorialAction = () => {
    if (onOpenTutorial) {
      onOpenTutorial();
    } else if (onOpenOnboarding) {
      onOpenOnboarding();
    }
    onClose();
  };

  const [dragY, setDragY] = useState(0);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null) {
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 0) {
        setDragY(deltaY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
    touchStartYRef.current = null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden pointer-events-auto select-none">
          {/* Backdrop escuro com efeito de profundidade e desfoque suave - z-[90] cobre tudo inclusive botões flutuantes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[90]"
            onClick={onClose}
          />

          {/* Input de arquivo para troca de foto do usuário */}
          <input 
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          {/* Bottom Sheet estilo iOS / WhatsApp com bordas superiores arredondadas e fundo fixo na base */}
          <motion.nav
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.75 }}
            onDragEnd={(_, info) => {
              // Se arrastado mais de 90px para baixo ou com velocidade descendente, fecha o menu
              if (info.offset.y > 90 || info.velocity.y > 300) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: dragY }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            className="fixed inset-x-0 bottom-0 w-full max-w-lg mx-auto h-[90dvh] max-h-[92dvh] bg-white text-xs flex flex-col rounded-t-[32px] rounded-b-none border-t border-slate-200/90 shadow-2xl z-[100] overflow-hidden touch-pan-y"
          >
            {/* Top Bar com Alça Tátil de Arraste (estilo Galeria WhatsApp no iOS) */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="pt-3 pb-2 flex flex-col items-center justify-center shrink-0 bg-slate-50/90 border-b border-slate-100 cursor-grab active:cursor-grabbing touch-none select-none"
              title="Arraste para baixo para fechar"
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Arraste para baixo para fechar
              </span>
            </div>

            {/* Header & Identidade */}
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="px-4 pb-3 pt-1 border-b border-slate-100 shrink-0 bg-slate-50/80"
            >
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-base text-[#000000] flex items-center gap-2">
                  <span className="bg-[#2dd683] text-[#000000] p-1.5 rounded-xl flex items-center justify-center shadow-xs font-black">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  MEI <span className="text-[#000000] bg-[#2dd683] px-1.5 py-0.5 rounded-lg text-xs font-bold">Simple</span>
                </span>
                <button 
                  onClick={onClose} 
                  className="w-8 h-8 rounded-2xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 flex items-center justify-center font-bold cursor-pointer transition shadow-2xs active:scale-95"
                  title="Fechar menu"
                  aria-label="Fechar menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ações Rápidas: Pesquisa Global & Tutorial */}
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                {onOpenSearch && (
                  <button
                    onClick={() => {
                      onOpenSearch();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#2dd683] hover:bg-emerald-50/40 text-slate-700 font-bold text-[11px] transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-[#000000]" />
                    <span>Buscar</span>
                  </button>
                )}

                <button
                  onClick={handleTutorialAction}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-slate-700 font-bold text-[11px] transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center">
                    <Play className="w-2 h-2 text-[#000000] fill-[#000000] ml-0.5" />
                  </div>
                  <span>Tutorial</span>
                </button>
              </div>
            </div>

            {/* Conteúdo Central Rolável */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
              
              {/* REQUISITO 3: Card de Usuário no Menu Lateral */}
              {/* 1) Foto circular no topo; 2) Nome em caixa alta; 3) Tipo de acesso */}
              {/* Estilo: Bordas arredondadas e contorno 1px verde */}
              <div ref={popupRef} className="relative">
                <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-[#2dd683] shadow-xs flex flex-col items-center text-center">
                  {/* Foto/ícone circular no topo */}
                  <button
                    type="button"
                    onClick={() => setShowUserPopup(!showUserPopup)}
                    className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#2dd683] bg-emerald-50 text-emerald-800 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition-transform group"
                    title="Opções do usuário"
                    aria-label="Opções do usuário"
                  >
                    {currentUser?.foto ? (
                      <img 
                        src={currentUser.foto} 
                        alt={currentUser.name} 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    ) : (
                      <UserIcon className="w-7 h-7 text-[#000000]" />
                    )}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Nome do usuário em caixa alta logo abaixo */}
                  <span className="mt-2 font-black text-xs text-[#000000] uppercase tracking-tight max-w-full truncate px-1">
                    {currentUser?.name || 'CARLOS OLIVEIRA'}
                  </span>

                  {/* Tipo de acesso abaixo do nome */}
                  <div className="mt-1">
                    <span className="text-[10px] text-[#004AAD] font-extrabold uppercase bg-[#e6effa] px-2.5 py-0.5 rounded-lg border border-[#b8d4f6] inline-block shadow-2xs">
                      {currentUser?.role === 'admin' ? 'MASTER' : 'AUXILIAR'}
                    </span>
                  </div>
                </div>

                {/* REQUISITO 4: Popup de Ações (Adicionar/Editar Foto e Acessar Stories) */}
                {showUserPopup && (
                  <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 px-2 py-1 tracking-wider border-b border-slate-100 mb-1">
                      Opções do Perfil
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer transition active:scale-98"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-bold truncate">
                          {currentUser?.foto ? 'Editar Foto' : 'Adicionar Foto'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Formato circular
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserPopup(false);
                        onClose();
                        onOpenStories?.();
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-purple-50 flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer transition active:scale-98 mt-1"
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#5E17EB] flex items-center justify-center shrink-0 border border-purple-200">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-900 font-bold truncate">
                          Acessar Stories
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Dicas Oficiais para o MEI
                        </div>
                      </div>
                    </button>

                    {currentUser?.foto && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateUserPhoto?.(undefined);
                          setShowUserPopup(false);
                        }}
                        className="w-full text-left p-2 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 text-xs font-bold cursor-pointer transition mt-1 border-t border-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500 ml-1" />
                        <span className="text-[11px]">Remover Foto</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Links de Navegação Principal */}
              <div>
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-2 mb-1.5">
                  Módulos do Sistema
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => { onNavigate('dashboard'); onClose(); }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer active:scale-98 ${
                      activeView === 'dashboard'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5" /> 
                    <span>Painel Geral</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('cadastros'); onClose(); }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer active:scale-98 ${
                      activeView === 'cadastros'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4.5 h-4.5" /> 
                    <span>Cadastros Gerais</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('estoque'); onClose(); }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer active:scale-98 ${
                      activeView === 'estoque'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4.5 h-4.5" /> 
                    <span>Controle de Estoque</span>
                  </button>

                  <button
                    onClick={() => {
                      if (hasViewPermission('financeiro')) {
                        onNavigate('financeiro');
                        onClose();
                      } else {
                        alert('Acesso negado no plano auxiliar!');
                      }
                    }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer active:scale-98 ${
                      activeView === 'financeiro'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <TrendingUp className="w-4.5 h-4.5" /> 
                      <span>Finanças & Caixa</span>
                    </span>
                    {!hasViewPermission('financeiro') && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {/* Botão 1: Notas Fiscais (Emissão) */}
                  <button
                    onClick={() => { onNavigate('fiscal'); onClose(); }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer active:scale-98 ${
                      activeView === 'fiscal'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5" /> 
                    <span>Notas Fiscais (Emissão)</span>
                  </button>

                  {/* Botão 2: Obrigações MEI (DAS/SIMEI) */}
                  <button
                    onClick={() => { onNavigate('obrigacoes'); onClose(); }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer active:scale-98 ${
                      activeView === 'obrigacoes' || activeView === 'das'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <Receipt className="w-4.5 h-4.5 text-[#2dd683]" /> 
                    <span>Obrigações MEI (DAS/SIMEI)</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('metas'); onClose(); }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center gap-3 cursor-pointer active:scale-98 ${
                      activeView === 'metas'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <Target className="w-4.5 h-4.5 text-[#5E17EB]" /> 
                    <span>Metas do Negócio</span>
                  </button>

                  <button
                    onClick={() => {
                      if (hasViewPermission('relatorios')) {
                        onNavigate('relatorios');
                        onClose();
                      } else {
                        alert('Privilégio restrito no plano auxiliar!');
                      }
                    }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer active:scale-98 ${
                      activeView === 'relatorios'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <BarChart className="w-4.5 h-4.5" /> 
                      <span>Relatórios & DRE</span>
                    </span>
                    {!hasViewPermission('relatorios') && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  <button
                    onClick={() => {
                      if (hasViewPermission('configuracoes')) {
                        onNavigate('configuracoes');
                        onClose();
                      } else {
                        alert('Acesso restrito ao perfil MASTER!');
                      }
                    }}
                    className={`w-full text-left font-bold px-3 py-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer active:scale-98 ${
                      activeView === 'configuracoes'
                        ? 'bg-[#2dd683] text-[#000000] border-[#2dd683] shadow-xs font-black'
                        : 'text-slate-700 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="w-4.5 h-4.5 text-slate-800" /> 
                      <span>Configurações</span>
                    </span>
                    {!hasViewPermission('configuracoes') && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Seção: Alternância Rápida de Usuários */}
              {users.length > 1 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Alternar Operador ({users.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUserList(!showUserList)}
                      className="text-[11px] font-bold text-[#004AAD] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>{showUserList ? 'Ocultar' : 'Ver Todos'}</span>
                      {showUserList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showUserList && (
                    <div className="space-y-1.5 bg-slate-50/70 p-2 rounded-2xl border border-slate-200/70">
                      {users.map(u => {
                        const isCurrent = currentUser?.id === u.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              if (onSwitchUser && !isCurrent) {
                                onSwitchUser(u);
                              }
                              setShowUserList(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                              isCurrent 
                                ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold' 
                                : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px] shrink-0">
                                {u.foto ? (
                                  <img src={u.foto} alt={u.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  u.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate">{u.name}</div>
                                <div className="text-[9px] text-slate-500 truncate">{u.role === 'admin' ? 'Master' : 'Auxiliar'}</div>
                              </div>
                            </div>
                            {isCurrent && (
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* REQUISITO 6: Botão de Logout posicionado no menu lateral, ao lado do nome da empresa */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/90 shrink-0 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-xs text-[#000000] truncate">Carlos Oliveira MEI</span>
                <span className="block text-[10px] text-slate-500 font-mono truncate">CNPJ: 30.751.934/0001-30</span>
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-extrabold text-xs flex items-center gap-1.5 border border-rose-200 transition shadow-2xs cursor-pointer shrink-0 active:scale-95"
                  title="Desconectar do MEI-Simple"
                >
                  <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Sair</span>
                </button>
              )}
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );
});

export default MobileNavigationDrawer;
