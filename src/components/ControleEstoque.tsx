/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, StockMovement, User } from '../types';
import { useIncrementalList } from '../hooks/useIncrementalList';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { GlobalBulkActionBar } from './GlobalBulkActionBar';
import { ConfirmActionModal } from './ConfirmActionModal';
import { ResponsiveModal } from './ResponsiveModal';
import { DataTable, Column } from './DataTable';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';
import { ActionButton } from './ActionButton';
import { 
  formatQuantity, 
  formatCurrencyBRL 
} from '../utils/formatters';
import { sendStockAlertEmail } from '../utils/emailAlertService';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  History, 
  ClipboardCheck, 
  RefreshCw, 
  Gauge, 
  Bell, 
  Settings, 
  Mail, 
  X,
  Check,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  User as UserIcon,
  Lock,
  Layers
} from 'lucide-react';

interface ControleEstoqueProps {
  products: Product[];
  stockMovements: StockMovement[];
  onAddMovement: (m: StockMovement) => void;
  onUpdateProductStock: (id: string, newStock: number) => void;
  onDeleteMovement?: (id: string) => void;
  onBulkDeleteMovements?: (ids: string[]) => void;
  currentUser?: User | null;
  addLog: (modulo: string, acao: any, descricao: string) => void;
  onOpenNewProduct?: () => void;
}

export const ControleEstoque = React.memo(function ControleEstoque({
  products,
  stockMovements,
  onAddMovement,
  onUpdateProductStock,
  onDeleteMovement,
  onBulkDeleteMovements,
  currentUser,
  addLog,
  onOpenNewProduct
}: ControleEstoqueProps) {
  // Modal de Movimentação Manual (Requisito 6)
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>(products[0]?.id || '');
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [movementQty, setMovementQty] = useState('');
  const [movementReason, setMovementReason] = useState('Compra de Reposição');
  const [motivoDetalhado, setMotivoDetalhado] = useState('');

  // Autor fixado como currentUser.name (desabilitado para edição)
  const movementAuthor = currentUser?.name || '39.527.169 GEOVANE PEREIRA DA SILVA';

  // Quick count audit modal
  const [auditProductId, setAuditProductId] = useState<string | null>(null);
  const [auditPhysicalCount, setAuditPhysicalCount] = useState('');
  const [auditDiffReason, setAuditDiffReason] = useState('Divergência de contagem manual');

  // Modal Global de Confirmação para Exclusões (Requisito 2)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    itemName?: string;
    itemCount?: number;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  // Motor Global de Seleção e Exclusão em Massa para Movimentações de Estoque (Requisito 3)
  const bulk = useBulkSelection<StockMovement>(stockMovements);

  // STOCK NOTIFICATIONS STATE (with persistency)
  const [alertEmail, setAlertEmail] = useState<string>(() => {
    return localStorage.getItem('gtec_stock_alert_email') || 'gtec.adm.ltda@gmail.com';
  });
  const [enableEmailAlerts, setEnableEmailAlerts] = useState<boolean>(() => {
    return localStorage.getItem('gtec_stock_enable_email') !== 'false';
  });
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [emailConfigInput, setEmailConfigInput] = useState<string>(alertEmail);
  const [emailSavedMessage, setEmailSavedMessage] = useState(false);

  // Recent toast alert when a change drives an item low
  const [recentLiveAlert, setRecentLiveAlert] = useState<{
    id: string;
    productName: string;
    currentStock: number;
    minStock: number;
    unidade: string;
    emailSentTo: string | null;
  } | null>(null);

  // Tracking dismissed product alerts
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gtec_stock_dismissed_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Incremental lists for initial 10 items performance optimization
  const {
    visibleItems: visibleProducts,
    hasMore: hasMoreProducts,
    sentinelRef: productsSentinelRef
  } = useIncrementalList(products, 10, 10);

  const {
    visibleItems: visibleMovements,
    hasMore: hasMoreMovements,
    sentinelRef: movementsSentinelRef
  } = useIncrementalList(stockMovements, 15, 10);

  const handleDismissAlert = (prodId: string) => {
    const updated = [...dismissedAlerts, prodId];
    setDismissedAlerts(updated);
    localStorage.setItem('gtec_stock_dismissed_alerts', JSON.stringify(updated));
  };

  const handleResetDismissedAlerts = () => {
    setDismissedAlerts([]);
    localStorage.removeItem('gtec_stock_dismissed_alerts');
  };

  // Integração real com EmailJS (Requisito 7)
  const triggerEmailAlert = async (prodName: string, actualCount: number, limit: number, unit: string) => {
    setRecentLiveAlert({
      id: `alert-${Date.now()}`,
      productName: prodName,
      currentStock: actualCount,
      minStock: limit,
      unidade: unit,
      emailSentTo: enableEmailAlerts ? alertEmail : null
    });

    if (enableEmailAlerts && alertEmail) {
      await sendStockAlertEmail({
        toEmail: alertEmail,
        productName: prodName,
        currentStock: actualCount,
        minStock: limit,
        unit: unit,
        companyName: 'MEI-Simple',
        operatorName: movementAuthor
      });
    }
  };

  // Aplicação da movimentação manual (Requisito 6)
  const handleApplyMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(movementQty);
    if (!selectedProduct || isNaN(qty) || qty <= 0) return;
    if (motivoDetalhado.trim().length < 10) return;

    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    let nextStock = prod.estoqueAtual;
    if (movementType === 'ENTRADA') {
      nextStock += qty;
    } else {
      if (qty > prod.estoqueAtual) {
        alert(`Impossível efetuar saída de ${formatQuantity(qty)} ${prod.unidade}! Saldo atual disponível: ${formatQuantity(prod.estoqueAtual)} ${prod.unidade}.`);
        return;
      }
      nextStock -= qty;
    }

    const fullReason = `${movementReason}: ${motivoDetalhado.trim()}`;

    const newMov: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: selectedProduct,
      tipo: movementType,
      quantidade: qty,
      data: new Date().toISOString().split('T')[0],
      motivo: fullReason,
      responsavel: movementAuthor
    };

    onAddMovement(newMov);
    onUpdateProductStock(selectedProduct, nextStock);
    addLog(
      'Estoque', 
      'EDICAO', 
      `Movimentação de ${movementType} (${formatQuantity(qty)} ${prod.unidade}) registrada para "${prod.nome}". Novo saldo: ${formatQuantity(nextStock)}`
    );

    // Dispara alerta se atingiu estoque crítico
    if (nextStock <= prod.estoqueMinimo) {
      triggerEmailAlert(prod.nome, nextStock, prod.estoqueMinimo, prod.unidade);
    }

    setMovementQty('');
    setMotivoDetalhado('');
    setShowMovementModal(false);
  };

  // Inventário Periódico Manual
  const handlePeriodicInventoryAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCount = parseFloat(auditPhysicalCount);
    if (!auditProductId || isNaN(cleanCount) || cleanCount < 0) return;

    const prod = products.find(p => p.id === auditProductId);
    if (!prod) return;

    const diff = cleanCount - prod.estoqueAtual;
    if (diff === 0) {
      setAuditProductId(null);
      return;
    }

    const direction = diff > 0 ? 'ENTRADA' : 'SAIDA';
    const volume = Math.abs(diff);

    const adjustmentMov: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: auditProductId,
      tipo: direction,
      quantidade: volume,
      data: new Date().toISOString().split('T')[0],
      motivo: `Inventário Periódico: ${auditDiffReason}`,
      responsavel: `${movementAuthor} (Reajuste Manual)`
    };

    onAddMovement(adjustmentMov);
    onUpdateProductStock(auditProductId, cleanCount);
    addLog(
      'Estoque', 
      'EDICAO', 
      `Ajuste de inventário manual para "${prod.nome}". Estoque anterior: ${formatQuantity(prod.estoqueAtual)} | Físico: ${formatQuantity(cleanCount)} (${auditDiffReason})`
    );

    if (cleanCount <= prod.estoqueMinimo) {
      triggerEmailAlert(prod.nome, cleanCount, prod.estoqueMinimo, prod.unidade);
    }

    setAuditProductId(null);
    setAuditPhysicalCount('');
  };

  // Exclusão em Massa de Movimentações (Requisitos 2 & 3)
  const handleDeleteBulkMovements = () => {
    const count = bulk.selectedCount;
    if (count === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão em Massa de Movimentações',
      description: `Esta ação removerá ${count} registros da trilha histórica de movimentação de estoque. Os saldos atuais dos produtos não serão revertidos retroativamente.`,
      itemCount: count,
      onConfirm: () => {
        const ids = Array.from(bulk.selectedIds);
        if (onBulkDeleteMovements) {
          onBulkDeleteMovements(ids);
        } else if (onDeleteMovement) {
          ids.forEach(id => onDeleteMovement(id));
        }
        addLog('Estoque', 'EXCLUSAO', `Exclusão em massa de ${count} movimentações de estoque`);
        bulk.clearSelection();
      }
    });
  };

  // Exclusão Individual de Movimentação com Modal Global
  const handleSingleDeleteMovement = (m: StockMovement) => {
    const prod = products.find(p => p.id === m.productId);
    const prodName = prod?.nome || 'Item Desconhecido';

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Movimentação de Estoque',
      description: `Deseja remover este registro de ${m.tipo} (${formatQuantity(m.quantidade)} ${prod?.unidade || 'UN'}) de "${prodName}"?`,
      itemName: `${m.tipo}: ${prodName} (${m.motivo})`,
      onConfirm: () => {
        if (onDeleteMovement) {
          onDeleteMovement(m.id);
        }
        addLog('Estoque', 'EXCLUSAO', `Movimentação removida: ${m.tipo} de ${prodName}`);
      }
    });
  };

  // Giro de Estoque helper
  const calculateStockTurnoverRating = (p: Product) => {
    const sorties = stockMovements
      .filter(m => m.productId === p.id && m.tipo === 'SAIDA')
      .reduce((sum, item) => sum + item.quantidade, 0);

    if (sorties > 15) return { label: 'Alto Giro', color: 'text-emerald-500 bg-emerald-50' };
    if (sorties > 5) return { label: 'Giro Médio', color: 'text-indigo-500 bg-indigo-50' };
    return { label: 'Baixo Giro', color: 'text-blue-500 bg-blue-50' };
  };

  // Validação do campo Motivo Detalhado (mínimo 10 caracteres)
  const isMotivoValid = motivoDetalhado.trim().length >= 10;

  // Colunas padronizadas do DataTable para o Histórico Consolidado de Ajustes e Movimentação (DRY)
  const movementColumns: Column<StockMovement>[] = useMemo(() => [
    {
      key: 'data',
      header: 'Data',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-mono text-slate-500',
      render: (m) => new Date(m.data).toLocaleDateString('pt-BR')
    },
    {
      key: 'produto',
      header: 'Produto / Item',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 font-semibold text-slate-800',
      render: (m) => {
        const associatedProduct = products.find(p => p.id === m.productId);
        return associatedProduct?.nome || 'Produto Excluído';
      }
    },
    {
      key: 'tipo',
      header: 'Operação',
      align: 'center',
      headerClassName: 'py-2.5 px-3 text-center',
      className: 'py-2.5 px-3 text-center',
      render: (m) => (
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
          m.tipo === 'ENTRADA' 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
            : 'bg-rose-50 text-rose-600 border border-rose-200'
        }`}>
          {m.tipo === 'ENTRADA' ? (
            <><ArrowUpRight className="w-3 h-3" /> Entrada</>
          ) : (
            <><ArrowDownRight className="w-3 h-3" /> Saída</>
          )}
        </span>
      )
    },
    {
      key: 'quantidade',
      header: 'Volume',
      align: 'right',
      headerClassName: 'py-2.5 px-3 text-right',
      className: 'py-2.5 px-3 text-right font-bold font-mono',
      render: (m) => {
        const associatedProduct = products.find(p => p.id === m.productId);
        return `${formatQuantity(m.quantidade)} ${associatedProduct?.unidade || 'UN'}`;
      }
    },
    {
      key: 'motivo',
      header: 'Motivo / Justificativa',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-slate-600 truncate max-w-xs',
      render: (m) => (
        <span title={m.motivo} className="truncate block max-w-xs">
          {m.motivo}
        </span>
      )
    },
    {
      key: 'responsavel',
      header: 'Operador',
      headerClassName: 'py-2.5 px-3',
      className: 'py-2.5 px-3 text-slate-500 font-medium',
      render: (m) => m.responsavel
    },
    {
      key: 'acoes',
      header: 'Ações',
      align: 'center',
      width: '48px',
      headerClassName: 'py-2.5 px-3 rounded-r-lg text-center w-12',
      className: 'py-2.5 px-3 text-center',
      render: (m) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
          <button
            type="button"
            onClick={() => handleSingleDeleteMovement(m)}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
            title="Excluir movimentação do histórico"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ], [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* LIVE EVENT TOAST BANNER */}
      {recentLiveAlert && (
        <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-md border border-emerald-500 flex items-start justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/30 border border-emerald-400/40 rounded-lg shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-emerald-100 animate-bounce" />
            </div>
            <div>
              <strong className="text-sm font-bold block">
                📧 Notificação de Alerta Emitida!
              </strong>
              <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                O produto <span className="font-extrabold underline">"{recentLiveAlert.productName}"</span> caiu ou está em <strong>{formatQuantity(recentLiveAlert.currentStock)} {recentLiveAlert.unidade}</strong>, atingindo o estoque mínimo de {formatQuantity(recentLiveAlert.minStock)} {recentLiveAlert.unidade}.
              </p>
              {recentLiveAlert.emailSentTo ? (
                <span className="inline-flex mt-2 bg-emerald-800 border border-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-100">
                  Enviado e-mail de alerta real via EmailJS para: <strong>{recentLiveAlert.emailSentTo}</strong>
                </span>
              ) : (
                <span className="inline-block mt-2 bg-amber-600/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-amber-200">
                  Aviso Visual em Tela (E-mail desabilitado nas configurações)
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRecentLiveAlert(null)}
            className="p-1 hover:bg-emerald-700 rounded-full text-emerald-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CARD DE RESUMO OPERACIONAL DE ESTOQUE */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="pb-4 border-b border-slate-100">
          <SectionHeader
            as="h2"
            icon={<Package className="w-6 h-6 text-emerald-600" />}
            title="Controle Operacional de Estoque"
            info="Saldos em tempo real, monitoramento de giro de mercadorias e auditoria de inventário do MEI"
            badges={
              <StatusBadge
                tone="success"
                label={`${products.length} ${products.length === 1 ? 'SKU Ativo' : 'SKUs Ativos'}`}
              />
            }
            actions={
              <div className="flex items-center gap-2 flex-wrap">
                {onOpenNewProduct && (
                  <ActionButton
                    variant="primary"
                    size="sm"
                    onClick={onOpenNewProduct}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Novo Produto
                  </ActionButton>
                )}
                <ActionButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmailConfigInput(alertEmail);
                    setShowConfigPanel(!showConfigPanel);
                  }}
                  icon={<Settings className="w-3.5 h-3.5 text-slate-600" />}
                >
                  Configurar Alertas
                </ActionButton>
              </div>
            }
          />
        </div>

        {/* PAINEL COLAPSÁVEL DE CONFIGURAÇÕES DE ALERTA */}
        {showConfigPanel && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                Destinatário de Alertas por E-mail (EmailJS)
              </span>
              <button
                type="button"
                onClick={() => setShowConfigPanel(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  E-mail do Empreendedor ou Contador
                </label>
                <input
                  type="email"
                  value={emailConfigInput}
                  onChange={(e) => setEmailConfigInput(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setAlertEmail(emailConfigInput);
                  localStorage.setItem('gtec_stock_alert_email', emailConfigInput);
                  setEmailSavedMessage(true);
                  setTimeout(() => setEmailSavedMessage(false), 2500);
                }}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Salvar E-mail
              </button>
            </div>

            <div className="flex items-center gap-4 pt-2 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEmailAlerts}
                  onChange={(e) => {
                    setEnableEmailAlerts(e.target.checked);
                    localStorage.setItem('gtec_stock_enable_email', String(e.target.checked));
                  }}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Ativar envio automático de alertas por e-mail
              </label>
            </div>

            {emailSavedMessage && (
              <span className="text-[11px] font-bold text-emerald-600 block">
                ✓ Configurações de alerta salvas com sucesso!
              </span>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          CONTAINER GIRO DE ESTOQUE E ALERTAS CRÍTICOS (LARGURA TOTAL)
          Com botão "Movimentar manualmente" ao lado de "CONSOLIDAÇÃO ATUALIZADA"
          ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Giro de Estoque e Alertas Críticos
            </h3>
            <InfoTooltip text="Monitoramento de produtos com baixa rotatividade ou saldo abaixo do estoque mínimo de segurança." />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
              Consolidação atualizada
            </span>

            {/* BOTÃO DE DISPARO DA MOVIMENTAÇÃO MANUAL (Requisito 6) */}
            <button
              type="button"
              onClick={() => {
                setSelectedProduct(products[0]?.id || '');
                setMovementQty('');
                setMotivoDetalhado('');
                setShowMovementModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Movimentar manualmente</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {visibleProducts.map((p) => {
            const rating = calculateStockTurnoverRating(p);
            const isCritical = p.estoqueAtual <= p.estoqueMinimo;

            return (
              <div 
                key={p.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isCritical 
                    ? 'border-amber-300 bg-amber-50/40 shadow-xs' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCritical ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isCritical ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <Package className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-slate-900 block truncate max-w-xs">{p.nome}</strong>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${rating.color}`}>
                        {rating.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>SKU: <strong className="font-mono text-slate-700">{p.sku}</strong></span>
                      <span>•</span>
                      <span>Mínimo: <strong className="font-mono">{formatQuantity(p.estoqueMinimo)} {p.unidade}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-2 md:pt-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Saldo Atual</span>
                    <strong className={`font-mono text-sm block ${isCritical ? 'text-amber-700 font-extrabold' : 'text-slate-800'}`}>
                      {formatQuantity(p.estoqueAtual)} {p.unidade}
                    </strong>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuditProductId(p.id);
                        setAuditPhysicalCount(p.estoqueAtual.toString());
                      }}
                      className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer border border-slate-200 transition"
                      title="Inventário Geral Manual"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Ajuste Físico</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMoreProducts && (
            <div ref={productsSentinelRef} className="py-2 text-center text-[11px] text-slate-400">
              Carregando mais produtos...
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          TABELA: HISTÓRICO CONSOLIDADO COM SELEÇÃO EM MASSA (DRY)
          ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center pb-2 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              Histórico Consolidado de Ajustes e Movimentação
            </h3>
            <InfoTooltip text="Rastreabilidade física e contábil com atalhos de seleção por Ctrl+Click ou toque longo no celular." />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              Exibindo {visibleMovements.length} de {stockMovements.length} registros
            </span>
          </div>
        </div>

        <DataTable
          columns={movementColumns}
          data={visibleMovements}
          keyExtractor={(m) => m.id}
          emptyMessage="Nenhuma movimentação de estoque registrada até o momento."
          selectedIds={bulk.selectedIds}
          onToggleSelectRow={(id) => bulk.toggleSelection(id)}
          onSelectAll={() => {
            if (bulk.selectedCount === stockMovements.length) {
              bulk.clearSelection();
            } else {
              bulk.selectAll(stockMovements);
            }
          }}
          isAllSelected={bulk.selectedCount > 0 && bulk.selectedCount === stockMovements.length}
          rowHandlers={(m) => bulk.bindLongPress(m.id)}
          className="border-0 shadow-none rounded-none"
        />

        {hasMoreMovements && (
          <div ref={movementsSentinelRef} className="py-3 text-center text-[11px] text-slate-400">
            Carregando mais movimentações...
          </div>
        )}
      </div>

      {/* =========================================================================
          POPUP DE REGISTRO DE MOVIMENTO MANUAL (Requisito 6)
          - Autor fixado como currentUser.name (desabilitado para edição)
          - Campo textarea "Motivo Detalhado" (max 500 caracteres)
          - Campos de valor e botão salvar DISABLED até motivo >= 10 caracteres
          ========================================================================= */}
      <ResponsiveModal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title="Registrar Movimentação Manual de Estoque"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleApplyMovement} className="space-y-4 text-xs">
          
          {/* Produto Alvo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Selecionar Produto <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2.5 focus:border-emerald-500 focus:outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} — Saldo: {formatQuantity(p.estoqueAtual)} {p.unidade} (SKU: {p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Movimento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Ação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMovementType('ENTRADA');
                  setMovementReason('Compra de Reposição');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  movementType === 'ENTRADA' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                + Entrada (Adicionar ao Saldo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMovementType('SAIDA');
                  setMovementReason('Consumo de Produção');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  movementType === 'SAIDA' 
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-2xs' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                - Saída (Deduzir do Saldo)
              </button>
            </div>
          </div>

          {/* Autor (Fixado como currentUser.name e desabilitado para edição) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Autor da Movimentação (Operador Logado)</span>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Fixado pelo sistema
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                value={movementAuthor}
                className="block w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs px-3 py-2.5 font-bold cursor-not-allowed opacity-80"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {/* Lista Suspensa de Motivos Básicos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Finalidade / Classificação do Lançamento
            </label>
            <select
              value={movementReason}
              onChange={(e) => setMovementReason(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2.5 focus:border-emerald-500"
            >
              {movementType === 'ENTRADA' ? (
                <>
                  <option value="Compra de Reposição">Compra de Reposição de Insumos</option>
                  <option value="Devolução de Cliente">Devolução de Mercadoria por Cliente</option>
                  <option value="Brinde / Amostra Recebida">Amostra / Brinde de Fornecedor</option>
                  <option value="Ajuste de Lançamento Errado">Correção de Lançamento Contábil</option>
                </>
              ) : (
                <>
                  <option value="Venda integrada ao Cliente">Venda Direta / Balcão ao Consumidor</option>
                  <option value="Consumo interno na Oficina">Consumo Interno / Matéria Prima de Produção</option>
                  <option value="Mesa deteriorada/Quebra">Quebra, Avaria ou Desgaste Físico</option>
                  <option value="Amostra grátis de demonstração">Cortesia / Amostra Promocional</option>
                  <option value="Perda no Transporte">Perda ou Dano Logístico no Transporte</option>
                </>
              )}
            </select>
          </div>

          {/* CAMPO OBRIGATÓRIO: TEXTAREA MOTIVO DETALHADO (max 500 caracteres) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800">
                Motivo Detalhado <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono font-semibold ${isMotivoValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                {motivoDetalhado.length}/500 {motivoDetalhado.trim().length < 10 && `(mínimo 10 caracteres)`}
              </span>
            </div>

            <textarea
              rows={3}
              maxLength={500}
              required
              value={motivoDetalhado}
              onChange={(e) => setMotivoDetalhado(e.target.value)}
              placeholder="Descreva detalhadamente a justificativa desta movimentação (mínimo de 10 caracteres para liberar o valor e confirmação)..."
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs p-2.5 focus:border-emerald-500 focus:outline-none"
            />

            {!isMotivoValid && (
              <p className="text-[10px] text-amber-700 font-medium">
                ⚠️ O campo de quantidade e o botão de salvar ficarão desabilitados até que o motivo detalhado atinja ao menos 10 caracteres.
              </p>
            )}
          </div>

          {/* Campo Quantidade (Disabled até motivoDetalhado >= 10 caracteres) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantidade a Movimentar <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              required
              disabled={!isMotivoValid}
              value={movementQty}
              onChange={(e) => setMovementQty(e.target.value)}
              placeholder={isMotivoValid ? "Ex: 10 ou 1.500" : "Preencha primeiro o motivo detalhado acima"}
              className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2.5 font-mono disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed focus:border-emerald-500"
            />
          </div>

          {/* Botões do Popup */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowMovementModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!isMotivoValid || !movementQty || parseFloat(movementQty) <= 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Movimentação</span>
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* POPUP DE REAJUSTE FÍSICO POR INVENTÁRIO */}
      <ResponsiveModal
        isOpen={!!auditProductId}
        onClose={() => setAuditProductId(null)}
        title="Reajuste Físico (Inventário)"
        maxWidth="max-w-md"
      >
        {auditProductId && (
          <form onSubmit={handlePeriodicInventoryAudit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-0.5 font-medium">Produto:</span>
              <strong className="text-slate-800 block text-sm">
                {products.find(p => p.id === auditProductId)?.nome}
              </strong>
              <span className="text-slate-500 font-mono mt-1 block">
                Saldo no sistema: <strong>{formatQuantity(products.find(p => p.id === auditProductId)?.estoqueAtual)} {products.find(p => p.id === auditProductId)?.unidade}</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantidade Real Identificada Fiscamente (Físico)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={auditPhysicalCount}
                onChange={(e) => setAuditPhysicalCount(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-center font-mono text-base py-2 focus:border-emerald-500 focus:outline-none"
                placeholder="0.000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Justificativa da Divergência</label>
              <select
                value={auditDiffReason}
                onChange={(e) => setAuditDiffReason(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs px-3 py-2.5 focus:border-emerald-500"
              >
                <option value="Divergência de contagem manual">Divergência de contagem manual</option>
                <option value="Matéria prima deteriorada por umidade">Matéria prima deteriorada por umidade</option>
                <option value="Descarte voluntário por erro de especificação">Descarte por erro de especificação</option>
                <option value="Recuperação de mercadoria perdida">Recuperação de mercadoria perdida</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuditProductId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-4 rounded-xl cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-5 rounded-xl shadow-xs cursor-pointer"
              >
                Atualizar Saldo Físico
              </button>
            </div>
          </form>
        )}
      </ResponsiveModal>

      {/* BARRA FLUTUANTE GLOBAL DE AÇÕES EM MASSA (Requisito 3) */}
      <GlobalBulkActionBar
        selectedCount={bulk.selectedCount}
        totalCount={stockMovements.length}
        entityNamePlural="movimentações"
        onClearSelection={bulk.clearSelection}
        onSelectAll={() => bulk.selectAll(stockMovements)}
        onDeleteBulk={handleDeleteBulkMovements}
      />

      {/* MODAL GLOBAL DE CONFIRMAÇÃO DE EXCLUSÃO (Requisito 2) */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        itemName={confirmModal.itemName}
        itemCount={confirmModal.itemCount}
      />

    </div>
  );
});

export default ControleEstoque;
