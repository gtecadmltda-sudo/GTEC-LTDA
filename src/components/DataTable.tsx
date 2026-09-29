/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckSquare, Square, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (item: T, e: React.MouseEvent) => void;
  // Integração com motor de seleção em massa (useBulkSelection)
  selectedIds?: Set<string>;
  onToggleSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  rowHandlers?: (item: T) => Record<string, any>;
  className?: string;
  maxHeight?: string;
}

/**
 * Componente Genérico Global de Tabela (DataTable) - Padrão DRY MEI-Simple.
 * Unifica a estrutura de <table>, <thead>, <tbody>, hover states, estados vazios
 * e suporte a seleção em massa em todas as listagens financeiras e operacionais.
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Nenhum registro encontrado.',
  isLoading = false,
  onRowClick,
  selectedIds,
  onToggleSelectRow,
  onSelectAll,
  isAllSelected,
  rowHandlers,
  className = '',
  maxHeight
}: DataTableProps<T>) {
  const hasSelectionColumn = !!selectedIds && !!onToggleSelectRow;

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs ${className}`}>
      <div 
        className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200"
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
      >
        <table className="w-full text-left text-xs font-sans border-collapse">
          {/* Cabeçalho Padronizado */}
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10 select-none">
            <tr>
              {/* Coluna opcional de seleção rápida */}
              {hasSelectionColumn && (
                <th className="py-3 px-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer transition"
                    title={isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    aria-label="Selecionar todos os itens da tabela"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}

              {columns.map((col, idx) => {
                const alignClass = 
                  col.align === 'center' 
                    ? 'text-center' 
                    : col.align === 'right' 
                      ? 'text-right' 
                      : 'text-left';

                return (
                  <th
                    key={col.key || idx}
                    style={col.width ? { width: col.width } : undefined}
                    className={`py-3 px-3.5 text-slate-700 tracking-tight font-extrabold ${alignClass} ${col.headerClassName || ''}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Corpo da Tabela com Hover e Divisores */}
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td 
                  colSpan={columns.length + (hasSelectionColumn ? 1 : 0)} 
                  className="py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Carregando dados...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (hasSelectionColumn ? 1 : 0)} 
                  className="py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <span className="text-xs font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const rowKey = keyExtractor(item, index);
                const isSelected = selectedIds ? selectedIds.has(rowKey) : false;
                const handlers = rowHandlers ? rowHandlers(item) : {};

                return (
                  <tr
                    key={rowKey}
                    {...handlers}
                    onClick={(e) => onRowClick && onRowClick(item, e)}
                    className={`transition-colors duration-100 ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-2 border-emerald-500'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Checkbox de Linha */}
                    {hasSelectionColumn && (
                      <td 
                        className="py-2.5 px-3.5 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelectRow(rowKey);
                        }}
                      >
                        <button
                          type="button"
                          className="flex items-center justify-center text-slate-400 hover:text-emerald-600 cursor-pointer"
                          aria-label={`Selecionar linha ${index + 1}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                    )}

                    {/* Células de Dados */}
                    {columns.map((col, colIdx) => {
                      const alignClass = 
                        col.align === 'center' 
                          ? 'text-center' 
                          : col.align === 'right' 
                            ? 'text-right' 
                            : 'text-left';

                      const cellContent = col.render 
                        ? col.render(item, index) 
                        : (item as any)[col.key];

                      return (
                        <td
                          key={col.key || colIdx}
                          className={`py-2.5 px-3.5 text-slate-800 ${alignClass} ${col.className || ''}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
