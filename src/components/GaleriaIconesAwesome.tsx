import React, { useState, useMemo } from 'react';
import { 
  AWESOME_ICON_GALLERY, 
  AwesomeGalleryItem, 
  Search, 
  X, 
  Copy, 
  Check, 
  Sparkles,
  Filter
} from '../lucide-compat';

interface GaleriaIconesAwesomeProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon?: (iconName: string, faClass: string) => void;
}

export function GaleriaIconesAwesome({ isOpen, onClose, onSelectIcon }: GaleriaIconesAwesomeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'TODOS', label: 'Todos os Ícones' },
    { id: 'FINANCEIRO', label: 'Financeiro & Fiscal' },
    { id: 'ESTOQUE', label: 'Estoque & Vendas' },
    { id: 'CADASTROS', label: 'Cadastros & Equipe' },
    { id: 'SISTEMA', label: 'Sistema & Segurança' },
    { id: 'COMUNICACAO', label: 'Comunicação & Alertas' },
  ];

  const filteredIcons = useMemo(() => {
    return AWESOME_ICON_GALLERY.filter((item: AwesomeGalleryItem) => {
      const matchesCat = selectedCategory === 'TODOS' || item.category === selectedCategory;
      const matchesSearch = !searchTerm.trim() || 
        item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.faClass.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const handleCopy = (item: AwesomeGalleryItem) => {
    navigator.clipboard.writeText(item.faClass);
    setCopiedId(item.id);
    if (onSelectIcon) {
      onSelectIcon(item.name, item.faClass);
    }
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-gallery-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-icons text-lg" />
            </div>
            <div>
              <h2 id="modal-gallery-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
                Galeria de Ícones Awesome
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {AWESOME_ICON_GALLERY.length} disponíveis
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ícones Awesome prontos para uso em cadastros, relatórios e painéis do MEI-Simple
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ícone por nome, função ou classe..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
          {filteredIcons.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <i className="fa-solid fa-magnifying-glass text-3xl mb-2 text-slate-300" />
              <p className="text-sm font-medium">Nenhum ícone encontrado para a busca.</p>
              <p className="text-xs text-slate-400 mt-1">Tente pesquisar com outros termos ou selecione outra categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredIcons.map((item) => {
                const isCopied = copiedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleCopy(item)}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer relative"
                  >
                    <div className="w-11 h-11 rounded-lg bg-slate-50 group-hover:bg-emerald-50 border border-slate-100 group-hover:border-emerald-200 flex items-center justify-center text-slate-700 group-hover:text-emerald-600 transition-colors mb-2">
                      <i className={`${item.faClass} text-lg transition-transform group-hover:scale-110`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700 line-clamp-1">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                      {item.name}
                    </span>

                    {/* Copied Feedback Badge */}
                    {isCopied ? (
                      <span className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-xs font-medium animate-in zoom-in-90">
                        <Check className="w-2.5 h-2.5" />
                        Copiado!
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-emerald-600 transition">
                        <Copy className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Clique em qualquer ícone para copiar sua classe Font Awesome.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
