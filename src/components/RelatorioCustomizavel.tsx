/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FinancialTransaction, 
  Product, 
  Client, 
  Invoice, 
  FinancialCategory, 
  CustomReportConfig,
  User
} from '../types';
import { 
  FileSpreadsheet, 
  Download, 
  Save, 
  X, 
  Filter, 
  FileText, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Printer, 
  Sparkles,
  Layers,
  Info,
  FileCode
} from 'lucide-react';
import { fetchUserCollection, saveUserDocument, deleteUserDocument } from '../lib/firebase';
import { downloadInvoicesZip } from '../utils/xmlDownloader';
import { InfoTooltip } from './InfoTooltip';
import { ConfirmActionModal } from './ConfirmActionModal';

interface RelatorioCustomizavelProps {
  transactions: FinancialTransaction[];
  categories: FinancialCategory[];
  products: Product[];
  clients: Client[];
  invoices: Invoice[];
  currentUser: User | null;
  addLog: (modulo: string, acao: 'CRIACAO' | 'EDICAO' | 'EXCLUSAO' | 'EXPORTACAO', descricao: string) => void;
}

export const RelatorioCustomizavel = React.memo(function RelatorioCustomizavel({
  transactions,
  categories,
  products,
  clients,
  invoices,
  currentUser,
  addLog
}: RelatorioCustomizavelProps) {
  // Saved configurations
  const [savedConfigs, setSavedConfigs] = useState<CustomReportConfig[]>([]);
  const [configName, setConfigName] = useState('');
  const [configDesc, setConfigDesc] = useState('');
  
  // Current Config State
  const [tipoFonte, setTipoFonte] = useState<CustomReportConfig['tipoFonte']>('TRANSACOES');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filtros, setFiltros] = useState<CustomReportConfig['filtros']>({
    dataInicio: '',
    dataFim: '',
    tipo: 'TODOS',
    categoriaId: 'TODAS',
    status: 'TODOS',
    clienteId: 'TODOS',
    adimplente: 'TODOS',
    minValor: undefined,
    maxValor: undefined,
    estoqueBaixo: false
  });
  const [agrupamento, setAgrupamento] = useState<CustomReportConfig['agrupamento']>('nenhum');
  const [ordenador, setOrdenador] = useState<string>('default');

  // Loading/saving feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);

  // Field names mapping for visual selection
  const transacoesFields = [
    { key: 'data', label: 'Data do Lançamento' },
    { key: 'dataVencimento', label: 'Data de Vencimento' },
    { key: 'tipo', label: 'Tipo (Receita/Despesa)' },
    { key: 'categoriaNome', label: 'Categoria Contábil' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'valor', label: 'Valor (R$)' },
    { key: 'status', label: 'Status' }
  ];
  const clientesFields = [
    { key: 'nome', label: 'Nome do Cliente' },
    { key: 'documento', label: 'CPF / CNPJ' },
    { key: 'tipo', label: 'Tipo (PF/PJ)' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'E-mail' },
    { key: 'cidade', label: 'Cidade / UF' },
    { key: 'adimplente', label: 'Situação de Adimplência' }
  ];
  const notasFields = [
    { key: 'numero', label: 'Número da Nota' },
    { key: 'tipo', label: 'Tipo (NFe / NFSe)' },
    { key: 'destinatarioNome', label: 'Destinatário' },
    { key: 'destinatarioDocumento', label: 'CNPJ do Destinatário' },
    { key: 'valorTotal', label: 'Valor Total (R$)' },
    { key: 'dataEmissao', label: 'Data de Emissão' },
    { key: 'status', label: 'Status da Emissão' }
  ];
  const estoqueFields = [
    { key: 'sku', label: 'SKU / Código' },
    { key: 'nome', label: 'Nome do Produto' },
    { key: 'desc', label: 'Descrição Curta' },
    { key: 'custo', label: 'Preço de Custo' },
    { key: 'venda', label: 'Preço de Venda' },
    { key: 'lucroReais', label: 'Margem Bruta (R$)' },
    { key: 'estoqueAtual', label: 'Estoque Atual' },
    { key: 'estoqueMinimo', label: 'Estoque de Alerta' },
    { key: 'categoria', label: 'Categoria' }
  ];

  const fieldMapping: Record<CustomReportConfig['tipoFonte'], { key: string; label: string }[]> = {
    TRANSACOES: transacoesFields,
    'Transações': transacoesFields,
    CLIENTES: clientesFields,
    'Clientes': clientesFields,
    NOTAS_FISCAIS: notasFields,
    'Notas Fiscais': notasFields,
    ESTOQUE: estoqueFields,
    'Estoque': estoqueFields
  };

  // Populate default fields when data source changes
  useEffect(() => {
    const defaults = fieldMapping[tipoFonte].map(f => f.key);
    setSelectedFields(defaults);
    setAgrupamento('nenhum');
    setOrdenador('default');
    
    // Reset filters partially
    setFiltros({
      dataInicio: '',
      dataFim: '',
      tipo: 'TODOS',
      categoriaId: 'TODAS',
      status: 'TODOS',
      clienteId: 'TODOS',
      adimplente: 'TODOS',
      minValor: undefined,
      maxValor: undefined,
      estoqueBaixo: false
    });
  }, [tipoFonte]);

  // Load Saved configs from firebase
  const loadSavedConfigs = async () => {
    if (!currentUser) return;
    setIsLoadingConfigs(true);
    try {
      const data = await fetchUserCollection<CustomReportConfig>('customReports', currentUser.id);
      setSavedConfigs(data);
    } catch (error) {
      console.error("Erro ao carregar configurações de relatórios:", error);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  useEffect(() => {
    loadSavedConfigs();
  }, [currentUser]);

  // Save the current config to Firestore
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Apenas usuários autenticados podem salvar configurações de relatórios contábeis.");
      return;
    }
    if (!configName.trim()) {
      alert("Por favor, digite um nome para salvar o modelo de relatório.");
      return;
    }

    setIsSaving(true);
    const id = `report-${Date.now()}`;
    const newConfig: CustomReportConfig = {
      id,
      nome: configName,
      descricao: configDesc,
      tipoFonte,
      campos: selectedFields,
      filtros,
      agrupamento,
      ordenador,
      createdAt: new Date().toISOString()
    };

    try {
      await saveUserDocument('customReports', currentUser.id, newConfig);
      addLog('Relatorios', 'CRIACAO', `Salvou configuração do relatório personalizado: ${configName}`);
      
      setConfigName('');
      setConfigDesc('');
      await loadSavedConfigs();
      alert("Modelo de relatório personalizado salvo com sucesso no seu painel!");
    } catch (err) {
      console.error("Erro ao salvar configuração do relatório:", err);
      alert("Não foi possível salvar a configuração do relatório no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplySavedConfig = (cfg: CustomReportConfig) => {
    setTipoFonte(cfg.tipoFonte);
    // Timeout to bypass useEffect initial resetting
    setTimeout(() => {
      setSelectedFields(cfg.campos);
      setFiltros(cfg.filtros);
      setAgrupamento(cfg.agrupamento);
      setOrdenador(cfg.ordenador);
      alert(`Configurações de "${cfg.nome}" aplicadas com sucesso!`);
    }, 50);
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

  const handleDeleteSavedConfig = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Modelo de Relatório',
      description: 'Confirma a exclusão deste modelo personalizado salvo? Esta ação não afetará os dados primários.',
      itemName: name,
      onConfirm: async () => {
        try {
          await deleteUserDocument('customReports', id);
          addLog('Relatorios', 'EXCLUSAO', `Excluiu modelo de relatório salvo: ${name}`);
          await loadSavedConfigs();
        } catch (error) {
          console.error("Erro ao excluir modelo de relatório:", error);
        }
      }
    });
  };

  const handleToggleField = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      // Keep at least one checked
      if (selectedFields.length > 1) {
        setSelectedFields(selectedFields.filter(f => f !== fieldKey));
      } else {
        alert("O relatório precisa exibir ao menos uma coluna de dados.");
      }
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
  };

  // Process data & generate current rows
  const getFilteredData = (): any[] => {
    let rawList: any[] = [];
    
    if (tipoFonte === 'TRANSACOES') {
      rawList = transactions.map(t => {
        const cat = categories.find(c => c.id === t.categoriaId);
        return {
          ...t,
          categoriaNome: cat ? `${cat.codigo} - ${cat.nome}` : 'Sem Categoria'
        };
      });

      // Filter TRANSACOES
      if (filtros.dataInicio) {
        rawList = rawList.filter(t => t.data >= (filtros.dataInicio || ''));
      }
      if (filtros.dataFim) {
        rawList = rawList.filter(t => t.data <= (filtros.dataFim || ''));
      }
      if (filtros.tipo && filtros.tipo !== 'TODOS') {
        rawList = rawList.filter(t => t.tipo === filtros.tipo);
      }
      if (filtros.categoriaId && filtros.categoriaId !== 'TODAS') {
        rawList = rawList.filter(t => t.categoriaId === filtros.categoriaId);
      }
      if (filtros.status && filtros.status !== 'TODOS') {
        rawList = rawList.filter(t => t.status === filtros.status);
      }
      if (filtros.minValor !== undefined && !isNaN(Number(filtros.minValor))) {
        rawList = rawList.filter(t => t.valor >= Number(filtros.minValor));
      }
      if (filtros.maxValor !== undefined && !isNaN(Number(filtros.maxValor))) {
        rawList = rawList.filter(t => t.valor <= Number(filtros.maxValor));
      }

    } else if (tipoFonte === 'CLIENTES') {
      rawList = [...clients];

      // Filter CLIENTES
      if (filtros.tipo && filtros.tipo !== 'TODOS') {
        rawList = rawList.filter(c => c.tipo === filtros.tipo);
      }
      if (filtros.adimplente && filtros.adimplente !== 'TODOS') {
        const targetAdimplente = filtros.adimplente === 'SIM';
        rawList = rawList.filter(c => c.adimplente === targetAdimplente);
      }
      if (filtros.clienteId && filtros.clienteId !== 'TODOS') {
        rawList = rawList.filter(c => c.id === filtros.clienteId);
      }

    } else if (tipoFonte === 'NOTAS_FISCAIS') {
      rawList = [...invoices];

      // Filter NOTAS
      if (filtros.dataInicio) {
        rawList = rawList.filter(n => n.dataEmissao >= (filtros.dataInicio || ''));
      }
      if (filtros.dataFim) {
        rawList = rawList.filter(n => n.dataEmissao <= (filtros.dataFim || ''));
      }
      if (filtros.tipo && filtros.tipo !== 'TODOS') {
        rawList = rawList.filter(n => n.tipo === filtros.tipo);
      }
      if (filtros.status && filtros.status !== 'TODOS') {
        rawList = rawList.filter(n => n.status === filtros.status);
      }
      if (filtros.minValor !== undefined && !isNaN(Number(filtros.minValor))) {
        rawList = rawList.filter(n => n.valorTotal >= Number(filtros.minValor));
      }
      if (filtros.maxValor !== undefined && !isNaN(Number(filtros.maxValor))) {
        rawList = rawList.filter(n => n.valorTotal <= Number(filtros.maxValor));
      }

    } else if (tipoFonte === 'ESTOQUE') {
      rawList = products.map(p => ({
        ...p,
        desc: p.descricao,
        custo: p.custo,
        venda: p.venda
      }));

      // Filter ESTOQUE
      if (filtros.estoqueBaixo) {
        rawList = rawList.filter(p => p.estoqueAtual <= p.estoqueMinimo);
      }
      if (filtros.categoria && filtros.categoria !== 'TODAS') {
        rawList = rawList.filter(p => p.categoria === filtros.categoria);
      }
      if (filtros.minValor !== undefined && !isNaN(Number(filtros.minValor))) {
        rawList = rawList.filter(p => p.venda >= Number(filtros.minValor));
      }
      if (filtros.maxValor !== undefined && !isNaN(Number(filtros.maxValor))) {
        rawList = rawList.filter(p => p.venda <= Number(filtros.maxValor));
      }
    }

    // Sorters
    if (ordenador !== 'default') {
      const [fld, order] = ordenador.split('_');
      rawList.sort((a, b) => {
        let valA = a[fld];
        let valB = b[fld];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return order === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
    }

    return rawList;
  };

  const currentFilteredData = getFilteredData();

  // Dynamic Grouping mechanism
  const getGroupedData = (data: any[]): Record<string, any[]> => {
    if (agrupamento === 'nenhum') return { 'Geral': data };
    
    return data.reduce((groups, item) => {
      let key = 'N/D';
      
      if (tipoFonte === 'TRANSACOES') {
        if (agrupamento === 'categoria') key = item.categoriaNome;
        else if (agrupamento === 'tipo') key = item.tipo;
        else if (agrupamento === 'status') key = item.status;
        else if (agrupamento === 'data_mes') key = item.data.substring(0, 7); // e.g. "2026-06"
      } else if (tipoFonte === 'CLIENTES') {
        if (agrupamento === 'tipo') key = item.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica';
        else if (agrupamento === 'adimplente') key = item.adimplente ? 'Adimplente' : 'Inadimplente';
      } else if (tipoFonte === 'NOTAS_FISCAIS') {
        if (agrupamento === 'tipo') key = item.tipo;
        else if (agrupamento === 'status') key = item.status;
        else if (agrupamento === 'data_mes') key = item.dataEmissao.substring(0, 7);
      } else if (tipoFonte === 'ESTOQUE') {
        if (agrupamento === 'categoria') key = item.categoria || 'Geral';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  };

  const groupedData = getGroupedData(currentFilteredData);

  // Calculate metrics headers
  const getMetrics = () => {
    const count = currentFilteredData.length;
    let sumLabel = '';
    let sumValue = 0;
    
    if (tipoFonte === 'TRANSACOES') {
      sumLabel = 'Total Líquido';
      const rSum = currentFilteredData.filter(x => x.tipo === 'RECEITA').reduce((s, i) => s + i.valor, 0);
      const dSum = currentFilteredData.filter(x => x.tipo === 'DESPESA').reduce((s, i) => s + i.valor, 0);
      sumValue = rSum - dSum;
    } else if (tipoFonte === 'NOTAS_FISCAIS') {
      sumLabel = 'Total Emitido';
      sumValue = currentFilteredData.reduce((s, i) => s + i.valorTotal, 0);
    } else if (tipoFonte === 'ESTOQUE') {
      sumLabel = 'Custo Total de Estoque';
      sumValue = currentFilteredData.reduce((s, i) => s + (i.custo * i.estoqueAtual), 0);
    } else {
      sumLabel = 'Total Clientes';
      sumValue = count;
    }

    return { count, sumLabel, sumValue };
  };

  const metrics = getMetrics();

  // Exporting Logic
  const exportCSV = () => {
    if (currentFilteredData.length === 0) {
      alert("Nenhum dado filtrado para exportar.");
      return;
    }

    const currentMap = fieldMapping[tipoFonte];
    const headers = currentMap.filter(f => selectedFields.includes(f.key)).map(f => f.label);
    const keys = currentMap.filter(f => selectedFields.includes(f.key)).map(f => f.key);

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `Relatorio Personalizado: MEI-Simple Essencial MEI - Fonte: ${tipoFonte}\n`;
    csvContent += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n\n`;
    csvContent += headers.join(";") + "\n";

    (currentFilteredData || []).forEach(item => {
      const row = keys.map(k => {
        let val = item[k];
        if (k === 'valor' || k === 'valorTotal' || k === 'custo' || k === 'venda' || k === 'lucroReais') {
          return val !== undefined ? Number(val).toFixed(2).replace('.', ',') : '0,00';
        }
        if (k === 'adimplente') {
          return val ? 'Adimplente' : 'Inadimplente';
        }
        // escape semicolons
        return String(val || '').replace(/;/g, ',');
      });
      csvContent += row.join(";") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_MEISimple_Customizado_${tipoFonte}_${Date.now()}.csv`;
    link.click();

    addLog('Relatorios', 'EXPORTACAO', `Exportou relatório customizado (${tipoFonte}) em CSV`);
    alert("Exportação para CSV concluída com sucesso!");
  };

  const exportJSON = () => {
    if (currentFilteredData.length === 0) {
      alert("Nenhum dado filtrado para exportar.");
      return;
    }

    const currentMap = fieldMapping[tipoFonte];
    const keys = currentMap.filter(f => selectedFields.includes(f.key)).map(f => f.key);

    const jsonExport = currentFilteredData.map(item => {
      const obj: Record<string, any> = {};
      keys.forEach(k => {
        obj[k] = item[k];
      });
      return obj;
    });

    const dataStr = JSON.stringify(jsonExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_MEISimple_Customizado_${tipoFonte}_${Date.now()}.json`;
    link.click();

    addLog('Relatorios', 'EXPORTACAO', `Exportou relatório customizado (${tipoFonte}) em JSON`);
    alert("Exportação para JSON concluída com sucesso!");
  };

  const exportXLSX = () => {
    // Generate styled Excel-HTML
    if (currentFilteredData.length === 0) {
      alert("Nenhum dado filtrado para exportar.");
      return;
    }

    const currentMap = fieldMapping[tipoFonte];
    const headers = currentMap.filter(f => selectedFields.includes(f.key)).map(f => f.label);
    const keys = currentMap.filter(f => selectedFields.includes(f.key)).map(f => f.key);

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #10B981; color: white; border: 1px solid #ddd; padding: 8px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          tr:nth-child(even){background-color: #f2f2f2;}
          .title { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 5px; }
          .meta { font-size: 11px; color: #6B7280; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="title">Painel de Relatório Inteligente Personalizado - MEI-Simple</div>
        <div class="meta">Fonte: ${tipoFonte} | Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    (currentFilteredData || []).forEach(item => {
      html += '<tr>';
      keys.forEach(k => {
        let val = item[k];
        if (k === 'valor' || k === 'valorTotal' || k === 'custo' || k === 'venda' || k === 'lucroReais') {
          html += `<td style="mso-number-format:'#,##0.00';">${val !== undefined ? Number(val).toFixed(2) : '0.00'}</td>`;
        } else if (k === 'adimplente') {
          html += `<td>${val ? 'Adimplente' : 'Inadimplente'}</td>`;
        } else {
          html += `<td>${String(val || '')}</td>`;
        }
      });
      html += '</tr>';
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_MEISimple_Customizado_${tipoFonte}_${Date.now()}.xls`;
    link.click();

    addLog('Relatorios', 'EXPORTACAO', `Exportou relatório customizado (${tipoFonte}) em Excel`);
    alert("Exportação para formato Excel compatível finalizada!");
  };

  const handlePrint = () => {
    addLog('Relatorios', 'EXPORTACAO', `Visualizou e enviou para impressão relatório customizado de ${tipoFonte}`);
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 rounded-2xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="bg-emerald-500/30 text-emerald-100 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase inline-block">
            Módulo Avançado
          </span>
          <h2 className="text-lg md:text-xl font-bold font-display flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-200" />
            <span>Relatórios Customizáveis Inteligentes</span>
            <InfoTooltip text="Configure seu demonstrativo de acordo com suas necessidades específicas. Escolha a fonte primária, reordene e ative colunas, defina filtros avançados, agrupe para demonstrar sub-totais por categoria ou status e exporte relatórios dinâmicos." />
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-center shrink-0">
          {tipoFonte === 'NOTAS_FISCAIS' && (
            <button
              onClick={async () => {
                await downloadInvoicesZip(currentFilteredData as unknown as Invoice[], `Lote_XML_Relatorio_Notas_${Date.now()}.zip`);
                addLog('Relatorios', 'EXPORTACAO', `Baixou lote de XMLs fiscais do relatório customizado (${currentFilteredData.length} notas)`);
              }}
              className="h-11 px-4 bg-emerald-400/30 hover:bg-emerald-400/50 active:bg-emerald-400/60 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-300/40"
              title="Baixar pacote ZIP com os arquivos XML de todas as notas fiscais deste relatório"
            >
              <FileCode className="w-4 h-4 text-emerald-200" /> XML (.ZIP)
            </button>
          )}
          <button
            onClick={exportCSV}
            className="h-11 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Exportar para CSV"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={exportXLSX}
            className="h-11 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Exportar para Excel (XLSX)"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={exportJSON}
            className="h-11 px-4 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Exportar como JSON"
          >
            <Info className="w-4 h-4" /> JSON
          </button>
          <button
            onClick={handlePrint}
            className="h-11 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="Imprimir ou Salvar como PDF"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Main Grid: Control panel on left/top, Dynamic outcome report table on right/bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Configurations & Filters */}
        <div className="space-y-6 xl:col-span-1">
          
          {/* Base Configuration Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              1. Dados de Origem e Colunas
            </h3>

            {/* Select Data Source */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1.5">Origem do Relatório</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTipoFonte('TRANSACOES')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    tipoFonte === 'TRANSACOES'
                      ? 'border-emerald-555 bg-emerald-50/20 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'border-slate-150 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  🏦 Caixa & Lançamentos
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFonte('NOTAS_FISCAIS')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    tipoFonte === 'NOTAS_FISCAIS'
                      ? 'border-emerald-555 bg-emerald-50/20 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'border-slate-150 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  📄 Notas Fiscais
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFonte('CLIENTES')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    tipoFonte === 'CLIENTES'
                      ? 'border-emerald-555 bg-emerald-50/20 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'border-slate-150 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  👥 Cadastros Clientes
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFonte('ESTOQUE')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    tipoFonte === 'ESTOQUE'
                      ? 'border-emerald-555 bg-emerald-50/20 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'border-slate-150 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  🪵 Estoque e Produtos
                </button>
              </div>
            </div>

            {/* Select Columns */}
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1.5 flex justify-between">
                <span>Colunas Visíveis no Relatório</span>
                <span className="text-[10px] text-slate-400 font-mono italic">({selectedFields.length} selecionadas)</span>
              </label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-style p-2 rounded-xl text-xs dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/50">
                {fieldMapping[tipoFonte].map((fd) => {
                  const active = selectedFields.includes(fd.key);
                  return (
                    <label key={fd.key} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleToggleField(fd.key)}
                        className="rounded accent-emerald-600 border-slate-300 mr-1"
                      />
                      <span className={active ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-600'}>
                        {fd.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters & Directives Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-500" />
              2. Filtros e Parâmetros
            </h3>

            {/* Render conditional filter elements depending on Selected Source */}
            <div className="space-y-3.5 text-xs font-sans">
              
              {/* DATE RANGE FILTERS (only for Transactions and Invoices) */}
              {(tipoFonte === 'TRANSACOES' || tipoFonte === 'NOTAS_FISCAIS') && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Período Início</label>
                    <input
                      type="date"
                      value={filtros.dataInicio || ''}
                      onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Período Fim</label>
                    <input
                      type="date"
                      value={filtros.dataFim || ''}
                      onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* TRANSACOES SPECIAL FILTERS */}
              {tipoFonte === 'TRANSACOES' && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Tipo de Lançamento</label>
                      <select
                        value={filtros.tipo || 'TODOS'}
                        onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                      >
                        <option value="TODOS">Qualquer Tipo</option>
                        <option value="RECEITA">Entradas / Receitas</option>
                        <option value="DESPESA">Saídas / Despesas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Situação / Status</label>
                      <select
                        value={filtros.status || 'TODOS'}
                        onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                      >
                        <option value="TODOS">Todos Status</option>
                        <option value="PAGO">Pago / Conciliado</option>
                        <option value="PENDENTE">Aberto / Pendente</option>
                        <option value="ATRASADO">Atrasado</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Conta ou Categoria Contábil</label>
                    <select
                      value={filtros.categoriaId || 'TODAS'}
                      onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    >
                      <option value="TODAS">Qualquer Categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>[{cat.tipo}] {cat.codigo} - {cat.nome}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* NOTAS FISCAIS SPECIAL FILTERS */}
              {tipoFonte === 'NOTAS_FISCAIS' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Tipo de Emissão</label>
                    <select
                      value={filtros.tipo || 'TODOS'}
                      onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    >
                      <option value="TODOS">Ambas (NFe e NFSe)</option>
                      <option value="NFE">NF-e (Produto)</option>
                      <option value="NFSE">NFS-e (Serviço)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Status da SEFAZ</label>
                    <select
                      value={filtros.status || 'TODOS'}
                      onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    >
                      <option value="TODOS">Todos Status</option>
                      <option value="PRODUCAO">Transmitida (Produção)</option>
                      <option value="HOMOLOGACAO">Homologação (Teste)</option>
                      <option value="RASCUNHO">Rascunho</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                </div>
              )}

              {/* CLIENTES SPECIAL FILTERS */}
              {tipoFonte === 'CLIENTES' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Tipo de Cliente</label>
                    <select
                      value={filtros.tipo || 'TODOS'}
                      onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="PF">Pessoa Física (CPF)</option>
                      <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Adimplência</label>
                    <select
                      value={filtros.adimplente || 'TODOS'}
                      onChange={(e) => setFiltros({ ...filtros, adimplente: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    >
                      <option value="TODOS">Todos status</option>
                      <option value="SIM">Adimplente / Em Dia</option>
                      <option value="NAO">Inadimplente / Pendente</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ESTOQUE SPECIAL FILTERS */}
              {tipoFonte === 'ESTOQUE' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Categoria</label>
                    <select
                      value={filtros.categoria || 'TODAS'}
                      onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                    >
                      <option value="TODAS">Qualquer Categoria</option>
                      <option value="Madeira">MDF / Chapas de Madeira</option>
                      <option value="Acabamentos">Ferragens / Corrediças</option>
                      <option value="Serviços">Catálogo Especial</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5 h-full">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-[11px] font-bold select-none text-rose-600">
                      <input
                        type="checkbox"
                        checked={filtros.estoqueBaixo || false}
                        onChange={(e) => setFiltros({ ...filtros, estoqueBaixo: e.target.checked })}
                        className="rounded accent-rose-500"
                      />
                      ⚠️ Estoque Abaixo do Mínimo
                    </label>
                  </div>
                </div>
              )}

              {/* Min/Max value range filters (available for transactions, invoices, stock sales) */}
              {(tipoFonte === 'TRANSACOES' || tipoFonte === 'NOTAS_FISCAIS' || tipoFonte === 'ESTOQUE') && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Valor Mínimo (R$)</label>
                    <input
                      type="number"
                      placeholder="Ex: 100"
                      value={filtros.minValor || ''}
                      onChange={(e) => setFiltros({ ...filtros, minValor: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Valor Máximo (R$)</label>
                    <input
                      type="number"
                      placeholder="Ex: 5000"
                      value={filtros.maxValor || ''}
                      onChange={(e) => setFiltros({ ...filtros, maxValor: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Grouping option */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" /> Agrupar Dados
                  </label>
                  <select
                    value={agrupamento}
                    onChange={(e) => setAgrupamento(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="nenhum">Sem Agrupamento</option>
                    {tipoFonte === 'TRANSACOES' && (
                      <>
                        <option value="categoria">Por Categoria Contábil</option>
                        <option value="tipo">Por Tipo (Entrada/Saída)</option>
                        <option value="status">Por Status (Pago/Aberto)</option>
                        <option value="data_mes">Por Mês/Ano</option>
                      </>
                    )}
                    {tipoFonte === 'CLIENTES' && (
                      <>
                        <option value="tipo">Por Tipo (PF/PJ)</option>
                        <option value="adimplente">Por Adimplência</option>
                      </>
                    )}
                    {tipoFonte === 'NOTAS_FISCAIS' && (
                      <>
                        <option value="tipo">Por Tipo (NFe/NFSe)</option>
                        <option value="status">Por Status do Processo</option>
                        <option value="data_mes">Por Mês/Ano de Emissão</option>
                      </>
                    )}
                    {tipoFonte === 'ESTOQUE' && (
                      <option value="categoria">Por Categoria Produto</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" /> Ordenação Inicial
                  </label>
                  <select
                    value={ordenador}
                    onChange={(e) => setOrdenador(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                  >
                    <option value="default">Ordenação Padrão</option>
                    {tipoFonte === 'TRANSACOES' && (
                      <>
                        <option value="data_desc">Recentes primeiro</option>
                        <option value="data_asc">Antigos primeiro</option>
                        <option value="valor_desc">Maior Valor primeiro</option>
                        <option value="valor_asc">Menor Valor primeiro</option>
                        <option value="descricao_asc">Descrição (A-Z)</option>
                      </>
                    )}
                    {tipoFonte === 'CLIENTES' && (
                      <>
                        <option value="nome_asc">Nome (A-Z)</option>
                        <option value="nome_desc">Nome (Z-A)</option>
                      </>
                    )}
                    {tipoFonte === 'NOTAS_FISCAIS' && (
                      <>
                        <option value="dataEmissao_desc">Mais recentes</option>
                        <option value="valorTotal_desc">Maior faturamento</option>
                      </>
                    )}
                    {tipoFonte === 'ESTOQUE' && (
                      <>
                        <option value="venda_desc">Maior Preço de venda</option>
                        <option value="estoqueAtual_asc">Pouco estoque primeiro</option>
                        <option value="nome_asc">Nome (A-Z)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Persist/Save This configuration inside layout */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display flex items-center gap-1.5">
              <Save className="w-4 h-4 text-emerald-500" />
              3. Salvar Modelo Configurado
            </h3>
            
            <form onSubmit={handleSaveConfig} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-500 text-[11px] font-bold mb-1">Título do Relatório Salvo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vendas de MDF do Exercício..."
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-3 py-2 text-slate-850 dark:text-slate-150 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[11px] font-bold mb-1">Descritivo (Opcional)</label>
                <textarea
                  placeholder="Explique o propósito deste layout de DRE..."
                  value={configDesc}
                  onChange={(e) => setConfigDesc(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white dark:bg-slate-950 px-3 py-2 text-slate-850 dark:text-slate-150 h-16 outline-none focus:border-emerald-500 block resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {isSaving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Configuração</>}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Saved Reports Indexer & Live Render Table */}
        <div className="space-y-6 xl:col-span-2">
          
          {/* Saved model template fast links bar */}
          {(savedConfigs.length > 0 || isLoadingConfigs) && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block dark:text-slate-500 font-sans">
                {isLoadingConfigs ? 'Carregando Modelos Salvos...' : `Seus Modelos de Relatórios Salvos (${savedConfigs.length})`}
              </span>
              <div className="flex flex-wrap gap-2">
                {savedConfigs.map((cfg) => (
                  <div key={cfg.id} className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 px-3 py-1.5 rounded-full text-xs">
                    <button
                      onClick={() => handleApplySavedConfig(cfg)}
                      className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium font-sans cursor-pointer flex items-center gap-1"
                      title={cfg.descricao || 'Ativar este modelo de consulta'}
                    >
                      <span>📊</span>
                      <strong>{cfg.nome}</strong>
                    </button>
                    <button
                      onClick={() => handleDeleteSavedConfig(cfg.id, cfg.nome)}
                      className="text-slate-300 hover:text-rose-600 dark:text-slate-700 transition ml-2"
                      title="Excluir este modelo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Dynamic metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total de Registros</span>
                <strong className="text-xl block text-slate-800 dark:text-slate-100 font-mono">{metrics.count}</strong>
              </div>
              <span className="text-xl">📁</span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-xs flex items-center justify-between md:col-span-2">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{metrics.sumLabel}</span>
                <strong className={`text-xl block font-mono ${
                  metrics.sumValue >= 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {tipoFonte === 'CLIENTES' ? metrics.sumValue : `R$ ${metrics.sumValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </strong>
              </div>
              <span className="text-xl">💰</span>
            </div>
          </div>

          {/* DYNAMIC RELATIONAL TABLE HOLDER WITH HIGH EDITORIAL GRAPHICS */}
          <div id="print-area" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
            
            {/* Report Header for printing */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <span>MEI-Simple • Relatório Customizado Avançado</span>
                  <InfoTooltip text="Extrato inteligente analítico de conformidade do banco de dados contábil" />
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-slate-400 mt-2">
                  <span>FONTE: <strong>{tipoFonte}</strong></span>
                  <span>GERADO EM: <strong>{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</strong></span>
                  <span>AUTOR: <strong>{currentUser?.name || currentUser?.email || 'MEI Proprietário'}</strong></span>
                </div>
              </div>

              {/* Little Watermark representation */}
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-1 rounded-full">
                  MEI Conforme
                </span>
                <span className="text-[9px] text-slate-400 block font-mono mt-1">Simples Nacional</span>
              </div>
            </div>

            {/* Active filters summary */}
            <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-850/50 text-[10px] text-slate-500 font-sans">
              <strong>Filtros Ativos:</strong>
              <div className="flex flex-wrap gap-1.5 overflow-x-auto">
                <span className="bg-emerald-100/40 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm">Ordem: {ordenador === 'default' ? 'Padrão' : ordenador}</span>
                <span className="bg-emerald-100/40 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm">Agrupamento: {agrupamento}</span>
                {filtros.dataInicio && <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-sm">Início: {filtros.dataInicio}</span>}
                {filtros.dataFim && <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-sm">Fim: {filtros.dataFim}</span>}
                {filtros.tipo && filtros.tipo !== 'TODOS' && <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-sm">Tipo: {filtros.tipo}</span>}
                {filtros.status && filtros.status !== 'TODOS' && <span className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded-sm">Status: {filtros.status}</span>}
                {filtros.estoqueBaixo && <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-450 px-1.5 py-0.5 rounded-sm font-bold">Apenas Alerta Mínimo</span>}
              </div>
            </div>

            {/* Core Table rendering engine */}
            {currentFilteredData.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-3xl block">🔍</span>
                <strong className="text-sm font-bold text-slate-800 dark:text-slate-250 block font-display">Sem lançamentos para os filtros informados</strong>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Ajuste o período, remova filtros de valor ou confira se a fonte correspondente possui dados válidos inseridos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-sans min-w-[600px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {fieldMapping[tipoFonte]
                        .filter(f => selectedFields.includes(f.key))
                        .map(fv => (
                          <th key={fv.key} className="p-3 font-semibold">{fv.label}</th>
                        ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {Object.keys(groupedData).map((groupTitle) => {
                      const groupRows = groupedData[groupTitle];
                      const totalSubGroupVal = groupRows.reduce((a, b) => {
                        const sumVal = b.valor !== undefined ? b.valor : (b.valorTotal !== undefined ? b.valorTotal : 0);
                        return a + sumVal;
                      }, 0);

                      return (
                        <React.Fragment key={groupTitle}>
                          {/* Render sub-group header if agrupamento is active */}
                          {agrupamento !== 'nenhum' && (
                            <tr className="bg-slate-100/50 dark:bg-slate-950/60 font-semibold text-slate-700 dark:text-slate-300 border-y border-slate-150 dark:border-slate-800">
                              <td 
                                colSpan={selectedFields.length} 
                                className="p-2.5 pl-4 uppercase text-[10px] font-bold tracking-wider text-emerald-600 dark:text-emerald-450 bg-emerald-50/15 dark:bg-emerald-950/10"
                              >
                                📂 {groupTitle} 
                                <span className="text-[9px] text-slate-400 lowercase font-normal ml-2">({groupRows.length} itens)</span>
                                {(tipoFonte === 'TRANSACOES' || tipoFonte === 'NOTAS_FISCAIS') && (
                                  <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 ml-4 border-l pl-4">
                                    Subtotal: R$ {totalSubGroupVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )}

                          {groupRows.map((row, index) => (
                            <tr 
                              key={row.id || index} 
                              className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-920/40 text-slate-750 dark:text-slate-300 transition-colors"
                            >
                              {fieldMapping[tipoFonte]
                                .filter(f => selectedFields.includes(f.key))
                                .map((f) => {
                                  const cellVal = row[f.key];
                                  
                                  // Formatting styles depending on key
                                  if (f.key === 'valor' || f.key === 'valorTotal' || f.key === 'custo' || f.key === 'venda' || f.key === 'lucroReais') {
                                    return (
                                      <td key={f.key} className="p-3 font-mono text-slate-900 dark:text-white font-medium">
                                        R$ {Number(cellVal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                    );
                                  }
                                  
                                  if (f.key === 'tipo') {
                                    return (
                                      <td key={f.key} className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                          cellVal === 'RECEITA' || cellVal === 'ENTRADA'
                                            ? 'bg-emerald-100/60 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                            : 'bg-rose-100/60 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                                        }`}>
                                          {cellVal}
                                        </span>
                                      </td>
                                    );
                                  }

                                  if (f.key === 'status') {
                                    const isPaid = cellVal === 'PAGO' || cellVal === 'PRODUCAO';
                                    const isWaiting = cellVal === 'PENDENTE' || cellVal === 'HOMOLOGACAO' || cellVal === 'RASCUNHO';
                                    return (
                                      <td key={f.key} className="p-3">
                                        <span className={`px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[9px] uppercase tracking-wider ${
                                          isPaid ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/15'
                                          : isWaiting ? 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/15'
                                          : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/15'
                                        }`}>
                                          {cellVal}
                                        </span>
                                      </td>
                                    );
                                  }

                                  if (f.key === 'adimplente') {
                                    return (
                                      <td key={f.key} className="p-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                          cellVal
                                            ? 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/30 dark:text-emerald-450'
                                            : 'bg-amber-100 text-amber-850 dark:bg-amber-950/30 dark:text-amber-455'
                                        }`}>
                                          {cellVal ? 'Adimplente' : 'Inadimplente'}
                                        </span>
                                      </td>
                                    );
                                  }

                                  if (f.key === 'data' || f.key === 'dataVencimento' || f.key === 'dataEmissao') {
                                    return (
                                      <td key={f.key} className="p-3 font-mono text-slate-500">
                                        {cellVal ? new Date(cellVal).toLocaleDateString('pt-BR') : '-'}
                                      </td>
                                    );
                                  }

                                  return (
                                    <td key={f.key} className="p-3 truncate max-w-[200px]">
                                      {String(cellVal ?? '-')}
                                    </td>
                                  );
                                })}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Print Friendly Footer */}
            <div className="text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-150 dark:border-slate-800 pt-3">
              <span>MEI-Simple - Ferramenta de Governança para Microempreendedor Individual</span>
              <span>Página 1 de 1</span>
            </div>
          </div>

        </div>

      </div>

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
