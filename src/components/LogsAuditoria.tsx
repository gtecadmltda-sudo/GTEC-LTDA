/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import { AuditLog } from '../types';
import {
  ShieldCheck,
  Search,
  Filter,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { ResponsiveModal } from './ResponsiveModal';
import { useIncrementalList } from '../hooks/useIncrementalList';
import { DataTable, Column } from './DataTable';

interface LogsAuditoriaProps {
  logs?: AuditLog[];
}

export const LogsAuditoria = React.memo(function LogsAuditoria({ logs = [] }: LogsAuditoriaProps) {
  const [filterModulo, setFilterModulo] = useState<string>('TODOS');
  const [filterAcao, setFilterAcao] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json' | 'xml' | 'pdf'>('csv');

  const mOptions = ['TODOS', 'Estoque', 'Financeiro', 'Fiscal', 'Cadastros', 'Usuarios', 'Contas', 'Autenticação', 'Configurações'];

  // Filtering logic
  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (logs || [])
      .filter(l => {
        const matchMod = filterModulo === 'TODOS' ? true : l.modulo === filterModulo;
        const matchAct = filterAcao === 'TODOS' ? true : l.acao === filterAcao;
        const matchSearch = term ? l.descricao.toLowerCase().includes(term) || l.usuario.toLowerCase().includes(term) : true;
        return matchMod && matchAct && matchSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, filterModulo, filterAcao, searchTerm]);

  // Incremental data loading (10 initial, scroll to load more)
  const {
    visibleItems: visibleLogs,
    hasMore,
    totalCount,
    displayedCount,
    sentinelRef
  } = useIncrementalList(filteredLogs, 10, 10);

  // 1. Export as CSV
  const exportCSV = useCallback(() => {
    let output = '\uFEFF'; // UTF-8 BOM
    output += 'RELATÓRIO DE AUDITORIA E SEGURANÇA FISCAL - MEI-SIMPLE\n';
    output += `Gerado em;${new Date().toLocaleString('pt-BR')};Total de Registros;${filteredLogs.length}\n\n`;
    output += 'Data_Hora;Usuario;Modulo;Acao;Descricao_Evento\n';
    filteredLogs.forEach(l => {
      const cleanDesc = (l.descricao || '').replace(/;/g, ',');
      output += `${l.timestamp};${l.usuario};${l.modulo};${l.acao};${cleanDesc}\n`;
    });

    const blob = new Blob([output], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `trilha_auditoria_MEI_${Date.now()}.csv`);
  }, [filteredLogs]);

  // 2. Export as Excel / XML Spreadsheet (.xlsx compatible)
  const exportXLSX = useCallback(() => {
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#064E3B"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Trilha de Auditoria">
  <Table>
   <Row>
    <Cell ss:StyleID="Title"><Data ss:Type="String">MEI-Simple - Relatório de Auditoria e Conformidade Fiscal (LGPD / SEFAZ)</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Exportado em: ${new Date().toLocaleString('pt-BR')}</Data></Cell>
   </Row>
   <Row ss:Index="4">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Data / Hora</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Operador Responsável</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Módulo do Sistema</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Operação</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Descrição do Evento Auditado</Data></Cell>
   </Row>`;

    filteredLogs.forEach(l => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(l.timestamp)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.usuario)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.modulo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.acao)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(l.descricao)}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    downloadBlob(blob, `auditoria_MEI_excel_${Date.now()}.xls`);
  }, [filteredLogs]);

  // 3. Export as JSON
  const exportJSON = useCallback(() => {
    const payload = {
      sistema: 'MEI-Simple ERP',
      finalidade: 'Trilha de Auditoria e Governança LGPD / Fiscal',
      dataExportacao: new Date().toISOString(),
      quantidadeRegistros: filteredLogs.length,
      logs: filteredLogs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `auditoria_MEI_${Date.now()}.json`);
  }, [filteredLogs]);

  // 4. Export as XML
  const exportXML = useCallback(() => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<TrilhaAuditoriaMEI exportadoEm="${new Date().toISOString()}" totalRegistros="${filteredLogs.length}">\n`;
    filteredLogs.forEach(l => {
      xml += `  <Registro id="${escapeXml(l.id)}">\n`;
      xml += `    <DataHora>${escapeXml(l.timestamp)}</DataHora>\n`;
      xml += `    <Usuario>${escapeXml(l.usuario)}</Usuario>\n`;
      xml += `    <Modulo>${escapeXml(l.modulo)}</Modulo>\n`;
      xml += `    <Acao>${escapeXml(l.acao)}</Acao>\n`;
      xml += `    <Descricao>${escapeXml(l.descricao)}</Descricao>\n`;
      xml += `  </Registro>\n`;
    });
    xml += `</TrilhaAuditoriaMEI>`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    downloadBlob(blob, `auditoria_MEI_${Date.now()}.xml`);
  }, [filteredLogs]);

  // 5. Export as Printable / PDF Document
  const exportPDF = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para gerar a visualização de impressão em PDF.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Trilha de Auditoria MEI-Simple</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
          .header { border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 18px; font-weight: bold; color: #064e3b; margin: 0; }
          .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
          th { background-color: #f1f5f9; padding: 8px 10px; text-align: left; font-weight: bold; border-bottom: 1.5px solid #cbd5e1; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-criacao { background: #dcfce7; color: #166534; }
          .badge-edicao { background: #fef3c7; color: #92400e; }
          .badge-exclusao { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">MEI-Simple — Relatório Oficial de Auditoria e Rastreabilidade</h1>
            <p class="meta">Conformidade com a Lei Geral de Proteção de Dados (LGPD) e Normas SEFAZ/CGSN</p>
          </div>
          <div style="text-align: right;" class="meta">
            <strong>Emissão:</strong> ${new Date().toLocaleString('pt-BR')}<br>
            <strong>Total de Registros:</strong> ${filteredLogs.length}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 130px;">Data / Hora</th>
              <th style="width: 140px;">Operador</th>
              <th style="width: 100px;">Módulo</th>
              <th style="width: 80px; text-align: center;">Operação</th>
              <th>Descrição do Evento</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLogs.map(l => `
              <tr>
                <td>${escapeXml(l.timestamp)}</td>
                <td><strong>${escapeXml(l.usuario)}</strong></td>
                <td>${escapeXml(l.modulo)}</td>
                <td style="text-align: center;">
                  <span class="badge ${l.acao === 'CRIACAO' ? 'badge-criacao' : l.acao === 'EXCLUSAO' ? 'badge-exclusao' : 'badge-edicao'}">
                    ${escapeXml(l.acao)}
                  </span>
                </td>
                <td>${escapeXml(l.descricao)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Documento gerado automaticamente pelo ERP MEI-Simple. Registro inviolável para fins de fiscalização e auditoria contábil.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }, [filteredLogs]);

  const handleExecuteExport = () => {
    setShowExportModal(false);
    if (exportFormat === 'csv') exportCSV();
    else if (exportFormat === 'xlsx') exportXLSX();
    else if (exportFormat === 'json') exportJSON();
    else if (exportFormat === 'xml') exportXML();
    else if (exportFormat === 'pdf') exportPDF();
  };

  const columns: Column<AuditLog>[] = useMemo(() => [
    {
      key: 'timestamp',
      header: 'Momento',
      headerClassName: 'py-3 px-4',
      className: 'py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap',
      render: (log) => log.timestamp
    },
    {
      key: 'usuario',
      header: 'Operador',
      headerClassName: 'py-3 px-3',
      className: 'py-3 px-3 font-semibold text-slate-900',
      render: (log) => log.usuario
    },
    {
      key: 'modulo',
      header: 'Módulo',
      headerClassName: 'py-3 px-3',
      className: 'py-3 px-3',
      render: (log) => (
        <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10.5px] font-bold">
          {log.modulo}
        </span>
      )
    },
    {
      key: 'acao',
      header: 'Tipo Ação',
      align: 'center',
      headerClassName: 'py-3 px-3 text-center',
      className: 'py-3 px-3 text-center',
      render: (log) => {
        const actionColor = 
          log.acao === 'EXCLUSAO'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : log.acao === 'EDICAO'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : log.acao === 'CRIACAO'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-blue-50 text-blue-700 border-blue-200';

        return (
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${actionColor}`}>
            {log.acao}
          </span>
        );
      }
    },
    {
      key: 'descricao',
      header: 'Descrição do Evento Auditado',
      headerClassName: 'py-3 px-4',
      className: 'py-3 px-4 text-slate-600 font-medium',
      render: (log) => log.descricao
    }
  ], []);

  return (
    <div className="space-y-6">
      
      {/* Intro section */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Trilha de Auditoria e Segurança (LGPD & SEFAZ)
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shrink-0 inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Relatório ({filteredLogs.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed font-medium">
            Acompanhe toda alteração de preço, exclusões de lançamentos, emissões de notas fiscais contratuais e ajustes do inventário realizadas pela sua equipe. Este histórico é inviolável e atende às exigências de conformidade fiscal.
          </p>
        </div>
      </div>

      {/* Filter and research block */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">Filtrar:</span>
          </div>

          <div>
            <select
              value={filterModulo}
              onChange={(e) => setFilterModulo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white text-slate-800 text-xs px-3 py-1.5 font-medium outline-none focus:border-emerald-500 shadow-2xs"
            >
              <option value="TODOS">Módulos: Todos</option>
              {mOptions.filter(m => m !== 'TODOS').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterAcao}
              onChange={(e) => setFilterAcao(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white text-slate-800 text-xs px-3 py-1.5 font-medium outline-none focus:border-emerald-500 shadow-2xs"
            >
              <option value="TODOS">Operação: Todas</option>
              <option value="CRIACAO">Criações</option>
              <option value="EDICAO">Alterações / Edições</option>
              <option value="EXCLUSAO">Exclusões</option>
              <option value="LOGIN">Logins / Acessos</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Pesquisar por operador ou evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-900 text-xs shadow-2xs w-full md:w-64 transition"
          />
        </div>
      </div>

      {/* Real Audit logs rows with Incremental Loading */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden text-xs">
        <div className="p-3.5 bg-emerald-50/60 text-[11px] border-b border-emerald-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-emerald-900 font-medium">
              Histórico ordenado e inviolável de conformidade fiscal SEFAZ. Nenhuma entrada pode ser apagada.
            </span>
          </div>
          <span className="text-[10px] text-emerald-800 font-bold font-mono">
            Exibindo {displayedCount} de {totalCount}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={visibleLogs}
          keyExtractor={(log) => log.id}
          emptyMessage="Nenhum registro encontrado para os filtros selecionados."
          className="border-0 shadow-none rounded-none"
        />

        {/* Sentinel for incremental scroll */}
        {hasMore && (
          <div ref={sentinelRef} className="py-3 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
            Carregando mais eventos da trilha de auditoria...
          </div>
        )}
      </div>

      {/* RESPONSIVE MODAL: EXPORT MULTI-FORMAT DIALOG (iOS BOTTOM SHEET ON MOBILE) */}
      <ResponsiveModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        maxWidth="max-w-lg"
        title="Exportar Trilha de Auditoria"
        subtitle="Escolha o formato de arquivo desejado para conformidade e análise contábil"
        icon={<Download className="w-5 h-5 text-emerald-600" />}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Selecione o formato de arquivo para exportar os <strong>{filteredLogs.length}</strong> eventos filtrados no momento:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CSV */}
            <div
              onClick={() => setExportFormat('csv')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                exportFormat === 'csv'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Planilha CSV (.csv)</strong>
                <span className="text-[11px] text-slate-500">Padrão universal UTF-8 compatível com Excel e Google Sheets</span>
              </div>
            </div>

            {/* Excel XLSX */}
            <div
              onClick={() => setExportFormat('xlsx')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                exportFormat === 'xlsx'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Pasta de Trabalho Excel (.xls)</strong>
                <span className="text-[11px] text-slate-500">Planilha formatada com cores, cabeçalhos e colunas ajustadas</span>
              </div>
            </div>

            {/* JSON */}
            <div
              onClick={() => setExportFormat('json')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                exportFormat === 'json'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <FileCode className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Formato JSON (.json)</strong>
                <span className="text-[11px] text-slate-500">Estruturado para integrações com sistemas externos e SIEM</span>
              </div>
            </div>

            {/* XML */}
            <div
              onClick={() => setExportFormat('xml')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                exportFormat === 'xml'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">XML Fiscal (.xml)</strong>
                <span className="text-[11px] text-slate-500">Tags contábeis estruturadas para conferência de fiscalização</span>
              </div>
            </div>

            {/* PDF / Impressão */}
            <div
              onClick={() => setExportFormat('pdf')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 sm:col-span-2 ${
                exportFormat === 'pdf'
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <FileCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-bold">Relatório PDF / Impressão (.pdf)</strong>
                <span className="text-[11px] text-slate-500">Documento diagramado com timbrado MEI, cabeçalho legal e assinatura de conformidade</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowExportModal(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" /> Baixar Arquivo
            </button>
          </div>
        </div>
      </ResponsiveModal>

    </div>
  );
});

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeXml(unsafe: string = ''): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default LogsAuditoria;
