/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useMemo } from 'react';

export interface IdentifiableItem {
  id: string;
  [key: string]: any;
}

export interface UseBulkSelectionReturn<T extends IdentifiableItem> {
  selectedIds: Set<string>;
  selectedCount: number;
  isSelectionMode: boolean;
  selectedItems: T[];
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
  selectAll: (customItems?: T[]) => void;
  clearSelection: () => void;
  setSelectionMode: (active: boolean) => void;
  handleItemClick: (e: React.MouseEvent, id: string, defaultAction?: () => void) => void;
  bindLongPress: (id: string, defaultAction?: () => void) => {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onClick: (e: React.MouseEvent) => void;
  };
}

/**
 * Motor Global de Seleção e Exclusão em Massa (Arquitetura DRY).
 * Gerencia seleção múltipla, atalhos Ctrl+Click no Desktop e Long Press (500ms) no Mobile.
 */
export function useBulkSelection<T extends IdentifiableItem>(items: T[] = []): UseBulkSelectionReturn<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setIsSelectionMode(next.size > 0);
      return next;
    });
  }, []);

  const selectAll = useCallback((customItems?: T[]) => {
    const targetItems = customItems || items;
    const allIds = new Set(targetItems.map((item) => item.id));
    setSelectedIds(allIds);
    setIsSelectionMode(allIds.size > 0);
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  const setSelectionMode = useCallback((active: boolean) => {
    setIsSelectionMode(active);
    if (!active) {
      setSelectedIds(new Set());
    }
  }, []);

  /**
   * Trata o clique no item suportando Ctrl+Click / Cmd+Click no Desktop.
   * Se já estiver em modo de seleção, o clique simples alterna a seleção.
   * Caso contrário, dispara a ação padrão do item (ex: abrir ficha ou editar).
   */
  const handleItemClick = useCallback((
    e: React.MouseEvent,
    id: string,
    defaultAction?: () => void
  ) => {
    if (e.ctrlKey || e.metaKey || isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(id);
    } else {
      if (defaultAction) {
        defaultAction();
      }
    }
  }, [isSelectionMode, toggleSelection]);

  /**
   * Vincula ouvintes de toque para suporte a Long Press no Mobile (500ms).
   * Ativa o modo de seleção com retorno tátil (vibração).
   */
  const bindLongPress = useCallback((id: string, defaultAction?: () => void) => {
    const handleTouchStart = (e: React.TouchEvent) => {
      isLongPressTriggeredRef.current = false;
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      longPressTimerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(50); } catch { /* noop */ }
        }
        toggleSelection(id);
      }, 500);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      // Se o usuário rolou mais de 10px, cancela o Long Press
      if (!touchStartPosRef.current) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

      if (deltaX > 10 || deltaY > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      // Se acabou de disparar o Long Press, bloqueia o clique para não disparar defaultAction
      if (isLongPressTriggeredRef.current) {
        e.preventDefault();
        e.stopPropagation();
        isLongPressTriggeredRef.current = false;
        return;
      }

      handleItemClick(e, id, defaultAction);
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick
    };
  }, [handleItemClick, toggleSelection]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item.id));
  }, [items, selectedIds]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelectionMode,
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    setSelectionMode,
    handleItemClick,
    bindLongPress
  };
}

export default useBulkSelection;
