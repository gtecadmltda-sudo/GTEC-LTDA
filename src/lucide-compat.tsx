import React from 'react';

// Generates an icon mapping using Font Awesome class names
const MAP: Record<string, string> = {
  // Navigation, Core & Layout
  Home: "fa-solid fa-house",
  LayoutDashboard: "fa-solid fa-gauge-high",
  Gauge: "fa-solid fa-gauge",
  FolderLock: "fa-solid fa-lock",
  Menu: "fa-solid fa-bars",
  Sliders: "fa-solid fa-sliders",
  SlidersHorizontal: "fa-solid fa-sliders",
  Settings: "fa-solid fa-gear",
  Wrench: "fa-solid fa-wrench",
  Tool: "fa-solid fa-wrench",
  Layers: "fa-solid fa-layer-group",
  LayoutTemplate: "fa-solid fa-table-cells",
  Grid: "fa-solid fa-border-all",
  List: "fa-solid fa-list",
  Globe: "fa-solid fa-globe",
  Radio: "fa-solid fa-tower-broadcast",
  Moon: "fa-solid fa-moon",
  Sun: "fa-solid fa-sun",
  Sparkles: "fa-solid fa-wand-magic-sparkles",
  Bot: "fa-solid fa-robot",
  Loader2: "fa-solid fa-spinner fa-spin",
  Compass: "fa-solid fa-compass",
  Cpu: "fa-solid fa-microchip",
  BrainCircuit: "fa-solid fa-brain",
  Map: "fa-solid fa-map",
  Zap: "fa-solid fa-bolt",
  Activity: "fa-solid fa-wave-square",

  // Products, Warehouse & Inventory
  Package: "fa-solid fa-box",
  PackageOpen: "fa-solid fa-box-open",
  PackageCheck: "fa-solid fa-box-archive",
  PackagePlus: "fa-solid fa-box-archive",
  PackageX: "fa-solid fa-box-archive",
  Boxes: "fa-solid fa-boxes-stacked",
  BoxesStacked: "fa-solid fa-boxes-stacked",
  Truck: "fa-solid fa-truck",
  TruckFast: "fa-solid fa-truck-fast",
  Hammer: "fa-solid fa-hammer",
  Tag: "fa-solid fa-tag",
  Tags: "fa-solid fa-tags",
  Barcode: "fa-solid fa-barcode",
  QrCode: "fa-solid fa-qrcode",
  ShoppingBag: "fa-solid fa-bag-shopping",
  ShoppingCart: "fa-solid fa-cart-shopping",
  Store: "fa-solid fa-store",
  Warehouse: "fa-solid fa-warehouse",

  // Financial, Fiscal & Taxes
  FileText: "fa-solid fa-file-invoice-dollar",
  DollarSign: "fa-solid fa-dollar-sign",
  Coins: "fa-solid fa-coins",
  CreditCard: "fa-solid fa-credit-card",
  Receipt: "fa-solid fa-receipt",
  Percent: "fa-solid fa-percent",
  BadgePercent: "fa-solid fa-percent",
  Wallet: "fa-solid fa-wallet",
  Banknote: "fa-solid fa-money-bill-wave",
  PiggyBank: "fa-solid fa-piggy-bank",
  Scale: "fa-solid fa-scale-balanced",
  Landmark: "fa-solid fa-landmark",
  Calculator: "fa-solid fa-calculator",
  TrendingUp: "fa-solid fa-chart-line",
  TrendingDown: "fa-solid fa-arrow-trend-down",
  BarChart: "fa-solid fa-chart-column",
  BarChart2: "fa-solid fa-chart-column",
  BarChart3: "fa-solid fa-chart-column",
  LineChart: "fa-solid fa-chart-line",
  PieChart: "fa-solid fa-chart-pie",
  PieIcon: "fa-solid fa-chart-pie",

  // Users, Clients, Suppliers & HR
  User: "fa-solid fa-user",
  UserIcon: "fa-solid fa-user",
  Users: "fa-solid fa-users",
  UserCheck: "fa-solid fa-user-check",
  UserPlus: "fa-solid fa-user-plus",
  UserMinus: "fa-solid fa-user-minus",
  UserX: "fa-solid fa-user-xmark",
  UserSquare2: "fa-solid fa-user-tie",
  UserTie: "fa-solid fa-user-tie",
  Contact: "fa-solid fa-address-card",
  AddressBook: "fa-solid fa-address-book",
  Briefcase: "fa-solid fa-briefcase",
  IdCard: "fa-solid fa-id-card",
  HeartHandshake: "fa-solid fa-handshake-angle",
  Handshake: "fa-solid fa-handshake",
  Building: "fa-solid fa-building",
  Building2: "fa-solid fa-building",

  // Documents & Storage
  BookOpen: "fa-solid fa-book",
  FileSpreadsheet: "fa-solid fa-file-excel",
  FileCode: "fa-solid fa-file-code",
  FileArchive: "fa-solid fa-file-zipper",
  FileDown: "fa-solid fa-file-arrow-down",
  FileCheck: "fa-solid fa-file-circle-check",
  FileCheck2: "fa-solid fa-file-circle-check",
  FileSignature: "fa-solid fa-file-signature",
  FileWarning: "fa-solid fa-file-circle-exclamation",
  Folder: "fa-solid fa-folder",
  FolderPlus: "fa-solid fa-folder-plus",
  FolderOpen: "fa-solid fa-folder-open",
  FolderTree: "fa-solid fa-folder-tree",
  HardDrive: "fa-solid fa-hard-drive",
  Database: "fa-solid fa-database",
  Cloud: "fa-solid fa-cloud",
  Save: "fa-solid fa-floppy-disk",
  ClipboardCheck: "fa-solid fa-clipboard-check",
  ClipboardList: "fa-solid fa-clipboard-list",

  // Communication & Notifications
  Bell: "fa-solid fa-bell",
  BellRing: "fa-solid fa-bell",
  BellOff: "fa-solid fa-bell-slash",
  Mail: "fa-solid fa-envelope",
  Inbox: "fa-solid fa-inbox",
  MailCheck: "fa-solid fa-envelope-circle-check",
  MailWarning: "fa-solid fa-envelope-open-text",
  MessageSquare: "fa-solid fa-message",
  MessageCircle: "fa-solid fa-comment-dots",
  Send: "fa-solid fa-paper-plane",
  SendHorizontal: "fa-solid fa-paper-plane",
  AtSign: "fa-solid fa-at",
  Phone: "fa-solid fa-phone",
  PhoneCall: "fa-solid fa-phone-volume",
  Smartphone: "fa-solid fa-mobile-screen-button",
  Volume2: "fa-solid fa-volume-high",

  // Security, Access & System
  Lock: "fa-solid fa-lock",
  Unlock: "fa-solid fa-lock-open",
  Key: "fa-solid fa-key",
  KeyRound: "fa-solid fa-key",
  Shield: "fa-solid fa-shield",
  ShieldCheck: "fa-solid fa-shield-halved",
  ShieldAlert: "fa-solid fa-shield-halved",
  ShieldX: "fa-solid fa-shield-xmark",
  LogIn: "fa-solid fa-right-to-bracket",
  LogOut: "fa-solid fa-right-from-bracket",

  // Status, Alerts & Verification
  Check: "fa-solid fa-check",
  CheckCircle: "fa-solid fa-circle-check",
  CheckCircle2: "fa-solid fa-circle-check",
  CheckSquare: "fa-solid fa-square-check",
  Square: "fa-regular fa-square",
  X: "fa-solid fa-xmark",
  XOctagon: "fa-solid fa-circle-xmark",
  AlertCircle: "fa-solid fa-circle-exclamation",
  AlertTriangle: "fa-solid fa-triangle-exclamation",
  AlertOctagon: "fa-solid fa-octagon-exclamation",
  Ban: "fa-solid fa-ban",
  HelpCircle: "fa-solid fa-circle-question",
  Info: "fa-solid fa-circle-info",
  Clock: "fa-solid fa-clock",
  Hourglass: "fa-solid fa-hourglass-half",
  History: "fa-solid fa-clock-rotate-left",
  RotateCcw: "fa-solid fa-rotate-left",
  RefreshCw: "fa-solid fa-arrows-rotate",
  Target: "fa-solid fa-bullseye",
  Trophy: "fa-solid fa-trophy",
  Award: "fa-solid fa-award",
  Star: "fa-solid fa-star",
  Heart: "fa-solid fa-heart",

  // Dates & Calendar
  Calendar: "fa-solid fa-calendar-days",
  CalendarClock: "fa-solid fa-calendar-days",
  CalendarCheck: "fa-solid fa-calendar-check",
  CalendarMinus: "fa-solid fa-calendar-minus",
  CalendarPlus: "fa-solid fa-calendar-plus",
  Flame: "fa-solid fa-fire",

  // Actions, Navigation & Controls
  Search: "fa-solid fa-magnifying-glass",
  Filter: "fa-solid fa-filter",
  Plus: "fa-solid fa-plus",
  Minus: "fa-solid fa-minus",
  Edit: "fa-solid fa-pen",
  Edit2: "fa-solid fa-pen-to-square",
  Edit3: "fa-solid fa-pen-to-square",
  Pencil: "fa-solid fa-pen-to-square",
  Trash2: "fa-solid fa-trash-can",
  Trash: "fa-solid fa-trash-can",
  Eye: "fa-solid fa-eye",
  EyeOff: "fa-solid fa-eye-slash",
  Download: "fa-solid fa-download",
  Upload: "fa-solid fa-upload",
  Printer: "fa-solid fa-print",
  Copy: "fa-solid fa-copy",
  Pin: "fa-solid fa-thumbtack",
  PinOff: "fa-solid fa-thumbtack",
  MapPin: "fa-solid fa-location-dot",
  ExternalLink: "fa-solid fa-up-right-from-square",
  ArrowUp: "fa-solid fa-arrow-up",
  ArrowDown: "fa-solid fa-arrow-down",
  ArrowLeft: "fa-solid fa-arrow-left",
  ArrowRight: "fa-solid fa-arrow-right",
  ArrowUpDown: "fa-solid fa-sort",
  ArrowUpRight: "fa-solid fa-arrow-trend-up",
  ArrowDownRight: "fa-solid fa-arrow-trend-down",
  ChevronUp: "fa-solid fa-chevron-up",
  ChevronDown: "fa-solid fa-chevron-down",
  ChevronLeft: "fa-solid fa-chevron-left",
  ChevronRight: "fa-solid fa-chevron-right",
  Maximize2: "fa-solid fa-expand",
  CornerDownLeft: "fa-solid fa-arrow-turn-down",
  Image: "fa-solid fa-image",
  ImageIcon: "fa-solid fa-image",
  Camera: "fa-solid fa-camera",
  Play: "fa-solid fa-play",
  PlayCircle: "fa-solid fa-circle-play",
  SkipForward: "fa-solid fa-forward-step",
  Video: "fa-solid fa-video",
  Keyboard: "fa-solid fa-keyboard",
  Command: "fa-solid fa-terminal",
};

export interface LucideIconProps extends React.HTMLAttributes<HTMLElement> {
  size?: number | string;
  strokeWidth?: number | string;
  color?: string;
  className?: string;
}

export const makeIcon = (faClass: string) => {
  const IconComponent = React.forwardRef<HTMLElement, LucideIconProps>((props, ref) => {
    const { className = '', size, strokeWidth: _sw, color, style: propStyle, ...rest } = props;
    
    const style: React.CSSProperties = {
      ...(size ? { 
        fontSize: typeof size === 'number' ? `${size}px` : size,
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size 
      } : {}),
      ...(color ? { color } : {}),
      ...(propStyle || {})
    };

    return (
      <i 
        ref={ref}
        className={`${faClass} ${className}`} 
        style={style}
        {...rest}
      />
    );
  });

  IconComponent.displayName = `AwesomeIcon(${faClass})`;
  return IconComponent;
};

// Componente Universal para consumo dinâmico da Galeria de Ícones Awesome
export interface AwesomeIconProps extends React.HTMLAttributes<HTMLElement> {
  name: string; // Nome ou classe (ex: "fa-solid fa-box" ou "Package")
  size?: number | string;
  color?: string;
  className?: string;
}

export const AwesomeIcon = React.forwardRef<HTMLElement, AwesomeIconProps>(({ name, size, color, className = '', style: propStyle, ...rest }, ref) => {
  const resolvedClass = MAP[name] || (name.startsWith('fa') ? name : `fa-solid fa-${name}`);
  const style: React.CSSProperties = {
    ...(size ? { 
      fontSize: typeof size === 'number' ? `${size}px` : size,
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size 
    } : {}),
    ...(color ? { color } : {}),
    ...(propStyle || {})
  };

  return (
    <i 
      ref={ref}
      className={`${resolvedClass} ${className}`} 
      style={style}
      {...rest}
    />
  );
});
AwesomeIcon.displayName = 'AwesomeIcon';

// Galeria de Metadados de Ícones Awesome para catálogo, filtros e personalização
export interface AwesomeGalleryItem {
  id: string;
  name: string;
  faClass: string;
  label: string;
  category: 'FINANCEIRO' | 'ESTOQUE' | 'CADASTROS' | 'SISTEMA' | 'COMUNICACAO';
}

export const AWESOME_ICON_GALLERY: AwesomeGalleryItem[] = [
  // Financeiro
  { id: 'f-filetext', name: 'FileText', faClass: 'fa-solid fa-file-invoice-dollar', label: 'Nota / Fatura', category: 'FINANCEIRO' },
  { id: 'f-receipt', name: 'Receipt', faClass: 'fa-solid fa-receipt', label: 'Recibo Fiscal', category: 'FINANCEIRO' },
  { id: 'f-creditcard', name: 'CreditCard', faClass: 'fa-solid fa-credit-card', label: 'Cartão de Crédito', category: 'FINANCEIRO' },
  { id: 'f-dollar', name: 'DollarSign', faClass: 'fa-solid fa-dollar-sign', label: 'Cifrão / Dinheiro', category: 'FINANCEIRO' },
  { id: 'f-coins', name: 'Coins', faClass: 'fa-solid fa-coins', label: 'Moedas e Troco', category: 'FINANCEIRO' },
  { id: 'f-wallet', name: 'Wallet', faClass: 'fa-solid fa-wallet', label: 'Carteira Digital', category: 'FINANCEIRO' },
  { id: 'f-bank', name: 'Landmark', faClass: 'fa-solid fa-landmark', label: 'Banco / Conta PJ', category: 'FINANCEIRO' },
  { id: 'f-calc', name: 'Calculator', faClass: 'fa-solid fa-calculator', label: 'Calculadora de Custos', category: 'FINANCEIRO' },
  { id: 'f-trendingup', name: 'TrendingUp', faClass: 'fa-solid fa-chart-line', label: 'Crescimento de Faturamento', category: 'FINANCEIRO' },
  { id: 'f-scale', name: 'Scale', faClass: 'fa-solid fa-scale-balanced', label: 'Balanço Patrimonial', category: 'FINANCEIRO' },

  // Estoque & Produtos
  { id: 'e-package', name: 'Package', faClass: 'fa-solid fa-box', label: 'Produto Unitário', category: 'ESTOQUE' },
  { id: 'e-packageopen', name: 'PackageOpen', faClass: 'fa-solid fa-box-open', label: 'Caixa Aberta / Reposição', category: 'ESTOQUE' },
  { id: 'e-boxes', name: 'BoxesStacked', faClass: 'fa-solid fa-boxes-stacked', label: 'Lote de Estoque', category: 'ESTOQUE' },
  { id: 'e-truck', name: 'Truck', faClass: 'fa-solid fa-truck', label: 'Entrega / Frete', category: 'ESTOQUE' },
  { id: 'e-tag', name: 'Tag', faClass: 'fa-solid fa-tag', label: 'Etiqueta de Preço', category: 'ESTOQUE' },
  { id: 'e-barcode', name: 'Barcode', faClass: 'fa-solid fa-barcode', label: 'Código EAN / Barras', category: 'ESTOQUE' },
  { id: 'e-qrcode', name: 'QrCode', faClass: 'fa-solid fa-qrcode', label: 'QR Code PIX / Fiscal', category: 'ESTOQUE' },
  { id: 'e-cart', name: 'ShoppingCart', faClass: 'fa-solid fa-cart-shopping', label: 'Carrinho de Vendas', category: 'ESTOQUE' },
  { id: 'e-store', name: 'Store', faClass: 'fa-solid fa-store', label: 'Ponto Comercial', category: 'ESTOQUE' },
  { id: 'e-hammer', name: 'Hammer', faClass: 'fa-solid fa-hammer', label: 'Produção / Oficina', category: 'ESTOQUE' },

  // Cadastros & Pessoas
  { id: 'c-user', name: 'User', faClass: 'fa-solid fa-user', label: 'Cliente Individual', category: 'CADASTROS' },
  { id: 'c-users', name: 'Users', faClass: 'fa-solid fa-users', label: 'Clientes & Equipe', category: 'CADASTROS' },
  { id: 'c-usercheck', name: 'UserCheck', faClass: 'fa-solid fa-user-check', label: 'Cliente Adimplente', category: 'CADASTROS' },
  { id: 'c-usertie', name: 'UserTie', faClass: 'fa-solid fa-user-tie', label: 'Fornecedor Credenciado', category: 'CADASTROS' },
  { id: 'c-idcard', name: 'IdCard', faClass: 'fa-solid fa-id-card', label: 'CPF / CNPJ / Registro', category: 'CADASTROS' },
  { id: 'c-handshake', name: 'Handshake', faClass: 'fa-solid fa-handshake', label: 'Parcerias & Contratos', category: 'CADASTROS' },
  { id: 'c-building', name: 'Building', faClass: 'fa-solid fa-building', label: 'Empresa / Filial', category: 'CADASTROS' },

  // Sistema, Segurança & Auditoria
  { id: 's-shieldcheck', name: 'ShieldCheck', faClass: 'fa-solid fa-shield-halved', label: 'LGPD / Segurança', category: 'SISTEMA' },
  { id: 's-lock', name: 'Lock', faClass: 'fa-solid fa-lock', label: 'Acesso Protegido', category: 'SISTEMA' },
  { id: 's-key', name: 'Key', faClass: 'fa-solid fa-key', label: 'Certificado Digital A1', category: 'SISTEMA' },
  { id: 's-gauge', name: 'Gauge', faClass: 'fa-solid fa-gauge', label: 'Painel Geral', category: 'SISTEMA' },
  { id: 's-clock', name: 'Clock', faClass: 'fa-solid fa-clock', label: 'Prazo 24h / Histórico', category: 'SISTEMA' },
  { id: 's-sparkles', name: 'Sparkles', faClass: 'fa-solid fa-wand-magic-sparkles', label: 'Automação Inteligente', category: 'SISTEMA' },
  { id: 's-trophy', name: 'Trophy', faClass: 'fa-solid fa-trophy', label: 'Metas Atingidas', category: 'SISTEMA' },

  // Comunicação & Alertas
  { id: 'm-bell', name: 'Bell', faClass: 'fa-solid fa-bell', label: 'Notificações', category: 'COMUNICACAO' },
  { id: 'm-mail', name: 'Mail', faClass: 'fa-solid fa-envelope', label: 'E-mail de Cobrança', category: 'COMUNICACAO' },
  { id: 'm-message', name: 'MessageSquare', faClass: 'fa-solid fa-message', label: 'Chat & Atendimento', category: 'COMUNICACAO' },
  { id: 'm-phone', name: 'Phone', faClass: 'fa-solid fa-phone', label: 'Telefone / WhatsApp', category: 'COMUNICACAO' },
  { id: 'm-send', name: 'Send', faClass: 'fa-solid fa-paper-plane', label: 'Disparo de Alertas', category: 'COMUNICACAO' }
];

// Exportações nomeadas completas para compatibilidade total com import { ... } from 'lucide-react'
export const LayoutDashboard = makeIcon(MAP.LayoutDashboard);
export const Home = makeIcon(MAP.Home);
export const Gauge = makeIcon(MAP.Gauge);
export const FolderLock = makeIcon(MAP.FolderLock);
export const Menu = makeIcon(MAP.Menu);
export const Sliders = makeIcon(MAP.Sliders);
export const SlidersHorizontal = makeIcon(MAP.SlidersHorizontal);
export const Settings = makeIcon(MAP.Settings);
export const Wrench = makeIcon(MAP.Wrench);
export const Tool = makeIcon(MAP.Tool);
export const Layers = makeIcon(MAP.Layers);
export const LayoutTemplate = makeIcon(MAP.LayoutTemplate);
export const Grid = makeIcon(MAP.Grid);
export const List = makeIcon(MAP.List);
export const Globe = makeIcon(MAP.Globe);
export const Radio = makeIcon(MAP.Radio);
export const Moon = makeIcon(MAP.Moon);
export const Sun = makeIcon(MAP.Sun);
export const Sparkles = makeIcon(MAP.Sparkles);
export const Zap = makeIcon(MAP.Zap);
export const Activity = makeIcon(MAP.Activity);

export const Package = makeIcon(MAP.Package);
export const PackageOpen = makeIcon(MAP.PackageOpen);
export const PackageCheck = makeIcon(MAP.PackageCheck);
export const PackagePlus = makeIcon(MAP.PackagePlus);
export const PackageX = makeIcon(MAP.PackageX);
export const Boxes = makeIcon(MAP.Boxes);
export const BoxesStacked = makeIcon(MAP.BoxesStacked);
export const Truck = makeIcon(MAP.Truck);
export const TruckFast = makeIcon(MAP.TruckFast);
export const Hammer = makeIcon(MAP.Hammer);
export const Tag = makeIcon(MAP.Tag);
export const Tags = makeIcon(MAP.Tags);
export const Barcode = makeIcon(MAP.Barcode);
export const QrCode = makeIcon(MAP.QrCode);
export const ShoppingBag = makeIcon(MAP.ShoppingBag);
export const ShoppingCart = makeIcon(MAP.ShoppingCart);
export const Store = makeIcon(MAP.Store);
export const Warehouse = makeIcon(MAP.Warehouse);

export const FileText = makeIcon(MAP.FileText);
export const DollarSign = makeIcon(MAP.DollarSign);
export const Coins = makeIcon(MAP.Coins);
export const CreditCard = makeIcon(MAP.CreditCard);
export const Receipt = makeIcon(MAP.Receipt);
export const Percent = makeIcon(MAP.Percent);
export const BadgePercent = makeIcon(MAP.BadgePercent);
export const Wallet = makeIcon(MAP.Wallet);
export const Banknote = makeIcon(MAP.Banknote);
export const PiggyBank = makeIcon(MAP.PiggyBank);
export const Scale = makeIcon(MAP.Scale);
export const Landmark = makeIcon(MAP.Landmark);
export const Calculator = makeIcon(MAP.Calculator);
export const TrendingUp = makeIcon(MAP.TrendingUp);
export const TrendingDown = makeIcon(MAP.TrendingDown);
export const BarChart = makeIcon(MAP.BarChart);
export const BarChart2 = makeIcon(MAP.BarChart2);
export const BarChart3 = makeIcon(MAP.BarChart3);
export const LineChart = makeIcon(MAP.LineChart);
export const PieChart = makeIcon(MAP.PieChart);
export const PieIcon = makeIcon(MAP.PieIcon);

export const User = makeIcon(MAP.User);
export const UserIcon = makeIcon(MAP.UserIcon);
export const Users = makeIcon(MAP.Users);
export const UserCheck = makeIcon(MAP.UserCheck);
export const UserPlus = makeIcon(MAP.UserPlus);
export const UserMinus = makeIcon(MAP.UserMinus);
export const UserX = makeIcon(MAP.UserX);
export const UserSquare2 = makeIcon(MAP.UserSquare2);
export const UserTie = makeIcon(MAP.UserTie);
export const Contact = makeIcon(MAP.Contact);
export const AddressBook = makeIcon(MAP.AddressBook);
export const Briefcase = makeIcon(MAP.Briefcase);
export const IdCard = makeIcon(MAP.IdCard);
export const HeartHandshake = makeIcon(MAP.HeartHandshake);
export const Handshake = makeIcon(MAP.Handshake);
export const Building = makeIcon(MAP.Building);
export const Building2 = makeIcon(MAP.Building2);

export const BookOpen = makeIcon(MAP.BookOpen);
export const FileSpreadsheet = makeIcon(MAP.FileSpreadsheet);
export const FileCode = makeIcon(MAP.FileCode);
export const FileArchive = makeIcon(MAP.FileArchive);
export const FileDown = makeIcon(MAP.FileDown);
export const FileCheck = makeIcon(MAP.FileCheck);
export const FileCheck2 = makeIcon(MAP.FileCheck2);
export const FileSignature = makeIcon(MAP.FileSignature);
export const FileWarning = makeIcon(MAP.FileWarning);
export const Folder = makeIcon(MAP.Folder);
export const FolderPlus = makeIcon(MAP.FolderPlus);
export const FolderOpen = makeIcon(MAP.FolderOpen);
export const FolderTree = makeIcon(MAP.FolderTree);
export const HardDrive = makeIcon(MAP.HardDrive);
export const Database = makeIcon(MAP.Database);
export const Cloud = makeIcon(MAP.Cloud);
export const Save = makeIcon(MAP.Save);
export const ClipboardCheck = makeIcon(MAP.ClipboardCheck);
export const ClipboardList = makeIcon(MAP.ClipboardList);

export const Bell = makeIcon(MAP.Bell);
export const BellRing = makeIcon(MAP.BellRing);
export const BellOff = makeIcon(MAP.BellOff);
export const Mail = makeIcon(MAP.Mail);
export const Inbox = makeIcon(MAP.Inbox);
export const MailCheck = makeIcon(MAP.MailCheck);
export const MailWarning = makeIcon(MAP.MailWarning);
export const MessageSquare = makeIcon(MAP.MessageSquare);
export const MessageCircle = makeIcon(MAP.MessageCircle);
export const Send = makeIcon(MAP.Send);
export const SendHorizontal = makeIcon(MAP.SendHorizontal);
export const AtSign = makeIcon(MAP.AtSign);
export const Phone = makeIcon(MAP.Phone);
export const PhoneCall = makeIcon(MAP.PhoneCall);
export const Smartphone = makeIcon(MAP.Smartphone);
export const Volume2 = makeIcon(MAP.Volume2);

export const Lock = makeIcon(MAP.Lock);
export const Unlock = makeIcon(MAP.Unlock);
export const Key = makeIcon(MAP.Key);
export const KeyRound = makeIcon(MAP.KeyRound);
export const Shield = makeIcon(MAP.Shield);
export const ShieldCheck = makeIcon(MAP.ShieldCheck);
export const ShieldAlert = makeIcon(MAP.ShieldAlert);
export const ShieldX = makeIcon(MAP.ShieldX);
export const LogIn = makeIcon(MAP.LogIn);
export const LogOut = makeIcon(MAP.LogOut);

export const Check = makeIcon(MAP.Check);
export const CheckCircle = makeIcon(MAP.CheckCircle);
export const CheckCircle2 = makeIcon(MAP.CheckCircle2);
export const CheckSquare = makeIcon(MAP.CheckSquare);
export const Square = makeIcon(MAP.Square);
export const X = makeIcon(MAP.X);
export const XOctagon = makeIcon(MAP.XOctagon);
export const AlertCircle = makeIcon(MAP.AlertCircle);
export const AlertTriangle = makeIcon(MAP.AlertTriangle);
export const AlertOctagon = makeIcon(MAP.AlertOctagon);
export const Ban = makeIcon(MAP.Ban);
export const HelpCircle = makeIcon(MAP.HelpCircle);
export const Info = makeIcon(MAP.Info);
export const Clock = makeIcon(MAP.Clock);
export const Hourglass = makeIcon(MAP.Hourglass);
export const History = makeIcon(MAP.History);
export const RotateCcw = makeIcon(MAP.RotateCcw);
export const RefreshCw = makeIcon(MAP.RefreshCw);
export const Target = makeIcon(MAP.Target);
export const Trophy = makeIcon(MAP.Trophy);
export const Award = makeIcon(MAP.Award);
export const Star = makeIcon(MAP.Star);
export const Heart = makeIcon(MAP.Heart);

export const Calendar = makeIcon(MAP.Calendar);
export const CalendarClock = makeIcon(MAP.CalendarClock);
export const CalendarCheck = makeIcon(MAP.CalendarCheck);
export const CalendarMinus = makeIcon(MAP.CalendarMinus);
export const CalendarPlus = makeIcon(MAP.CalendarPlus);
export const Flame = makeIcon(MAP.Flame);

export const Search = makeIcon(MAP.Search);
export const Filter = makeIcon(MAP.Filter);
export const Plus = makeIcon(MAP.Plus);
export const Minus = makeIcon(MAP.Minus);
export const Edit = makeIcon(MAP.Edit);
export const Edit2 = makeIcon(MAP.Edit2);
export const Edit3 = makeIcon(MAP.Edit3);
export const Pencil = makeIcon(MAP.Pencil);
export const Trash2 = makeIcon(MAP.Trash2);
export const Trash = makeIcon(MAP.Trash);
export const Eye = makeIcon(MAP.Eye);
export const EyeOff = makeIcon(MAP.EyeOff);
export const Download = makeIcon(MAP.Download);
export const Upload = makeIcon(MAP.Upload);
export const Printer = makeIcon(MAP.Printer);
export const Copy = makeIcon(MAP.Copy);
export const Pin = makeIcon(MAP.Pin);
export const PinOff = makeIcon(MAP.PinOff);
export const MapPin = makeIcon(MAP.MapPin);
export const ExternalLink = makeIcon(MAP.ExternalLink);
export const ArrowUp = makeIcon(MAP.ArrowUp);
export const ArrowDown = makeIcon(MAP.ArrowDown);
export const ArrowLeft = makeIcon(MAP.ArrowLeft);
export const ArrowRight = makeIcon(MAP.ArrowRight);
export const ArrowUpDown = makeIcon(MAP.ArrowUpDown);
export const ArrowUpRight = makeIcon(MAP.ArrowUpRight);
export const ArrowDownRight = makeIcon(MAP.ArrowDownRight);
export const ChevronUp = makeIcon(MAP.ChevronUp);
export const ChevronDown = makeIcon(MAP.ChevronDown);
export const ChevronLeft = makeIcon(MAP.ChevronLeft);
export const ChevronRight = makeIcon(MAP.ChevronRight);
export const Maximize2 = makeIcon(MAP.Maximize2);
export const CornerDownLeft = makeIcon(MAP.CornerDownLeft);
export const Image = makeIcon(MAP.Image);
export const ImageIcon = makeIcon(MAP.ImageIcon);

export const Loader2 = makeIcon(MAP.Loader2);
export const Bot = makeIcon(MAP.Bot);
export const Compass = makeIcon(MAP.Compass);
export const Cpu = makeIcon(MAP.Cpu);
export const BrainCircuit = makeIcon(MAP.BrainCircuit);
export const Map = makeIcon(MAP.Map);

export const Camera = makeIcon(MAP.Camera);
export const Play = makeIcon(MAP.Play);
export const PlayCircle = makeIcon(MAP.PlayCircle);
export const SkipForward = makeIcon(MAP.SkipForward);
export const Video = makeIcon(MAP.Video);
export const Keyboard = makeIcon(MAP.Keyboard);
export const Command = makeIcon(MAP.Command);

