import { signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { FinancialTransaction, FinancialCategory, DASPayment, Invoice } from '../types';

// In-memory cache for the retrieved Google OAuth Access Token
let cachedAccessToken: string | null = null;
let connectedUser: FirebaseUser | null = null;

// Google API Providers with required scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.metadata');

/**
 * Initiates the Google Sign-In popup with both Sheets and Calendar scopes
 */
export async function connectGoogleWorkspace(): Promise<{ user: FirebaseUser; accessToken: string } | null> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }
    cachedAccessToken = credential.accessToken;
    connectedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('Autorização do Google Workspace cancelada pelo usuário (janela fechada).');
      return null;
    }
    console.error('Erro de autenticação com o Google Workspace:', error);
    throw error;
  }
}

// Backward compatibility helper
export const connectGoogleSheets = connectGoogleWorkspace;

/**
 * Signs out from Firebase/Google Auth and purges cache tokens
 */
export async function disconnectGoogleSheets(): Promise<void> {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    connectedUser = null;
  } catch (error) {
    console.error('Erro ao desconectar:', error);
  }
}

export const disconnectGoogleWorkspace = disconnectGoogleSheets;

/**
 * Returns cached accessToken in memory
 */
export function getCachedToken(): string | null {
  return cachedAccessToken;
}

/**
 * Returns active google user info if signed-in
 */
export function getConnectedUser(): FirebaseUser | null {
  return connectedUser;
}

/**
 * Generic Fetch helper to make Google API requests
 */
async function callGoogleAPI(url: string, method: string, token: string, body?: any) {
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `Erro da API Google (${response.status})`);
  }

  return response.json();
}

/**
 * Helper to execute a Google Sheets API call with Authorization header
 */
async function callSheetsAPI(endpoint: string, method: string, token: string, body?: any) {
  return callGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets${endpoint}`, method, token, body);
}

/**
 * Creates a brand new Google Spreadsheet and populates it with headers and rows
 */
export async function createAndPopulateSpreadsheet(
  token: string,
  title: string,
  workbookData: { sheetName: string; headers: string[]; rows: any[][] }[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  
  // 1. Create a skeleton Spreadsheet with specific sheets (tabs)
  const createBody = {
    properties: {
      title,
    },
    sheets: workbookData.map(wd => ({
      properties: {
        title: wd.sheetName,
        gridProperties: {
          frozenRowCount: 1, // Freeze header row
        }
      }
    }))
  };

  const createResult = await callSheetsAPI('', 'POST', token, createBody);
  const spreadsheetId = createResult.spreadsheetId;
  const spreadsheetUrl = createResult.spreadsheetUrl;

  // 2. Populate each sheet with their data
  for (const wd of workbookData) {
    const range = `${wd.sheetName}!A1`;
    const updateBody = {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range,
          majorDimension: 'ROWS',
          values: [wd.headers, ...wd.rows]
        }
      ]
    };
    // Batched update values endpoint
    await callSheetsAPI(`/${spreadsheetId}/values:batchUpdate`, 'POST', token, updateBody);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/* ==========================================
 * GOOGLE CALENDAR REST API SERVICES
 * ========================================== */

export interface GoogleCalendarEventPayload {
  summary: string;
  description: string;
  location?: string;
  start: {
    date?: string;     // format: YYYY-MM-DD
    dateTime?: string; // ISO string for precise times
    timeZone?: string;
  };
  end: {
    date?: string;     // format: YYYY-MM-DD
    dateTime?: string; // ISO string for precise times
    timeZone?: string;
  };
}

/**
 * Lists the upcoming Google Calendar events from the Primary calendar
 * Limits to 100 events for optimal bandwidth
 */
export async function listCalendarEvents(token: string, daysOffset: number = 30): Promise<any[]> {
  const now = new Date();
  const timeMin = now.toISOString();
  
  // End of offset period
  const future = new Date();
  future.setDate(future.getDate() + daysOffset);
  const timeMax = future.toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`;
  
  try {
    const result = await callGoogleAPI(url, 'GET', token);
    return result.items || [];
  } catch (error) {
    console.error('Erro ao ler lista de eventos do Google Calendar:', error);
    throw error;
  }
}

/**
 * Creates an event in the user's primary calendar
 */
export async function createCalendarEvent(token: string, event: GoogleCalendarEventPayload): Promise<any> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
  try {
    const result = await callGoogleAPI(url, 'POST', token, event);
    return result;
  } catch (error) {
    console.error('Erro ao criar evento de calendário:', error);
    throw error;
  }
}

/**
 * Helper to update/patch/delete is also possible
 */
export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  try {
    await callGoogleAPI(url, 'DELETE', token);
  } catch (error) {
    console.error('Erro ao excluir compromisso do calendário:', error);
    throw error;
  }
}

/**
 * Shared utility to build spreadsheets structure and sync to Google Sheets
 */
export async function syncReportsToSheets(
  token: string,
  selectedYear: string,
  transactions: FinancialTransaction[],
  categories: FinancialCategory[],
  dasPayments: DASPayment[],
  invoices: Invoice[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. CALCULATE DRE SHEET DATA
  const yearTransactions = transactions.filter(t => t.data.startsWith(selectedYear));
  
  const totalInboundSales = yearTransactions
    .filter(t => t.tipo === 'RECEITA' && t.status === 'PAGO')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalProcurementCosts = yearTransactions
    .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.categoriaId === 'cat-d1')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalAdministrativeDrafts = yearTransactions
    .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.categoriaId === 'cat-d2')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalDASTaxesPaid = dasPayments
    .filter(d => d.status === 'PAGO')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalOtherExpenses = yearTransactions
    .filter(t => t.tipo === 'DESPESA' && t.status === 'PAGO' && t.categoriaId !== 'cat-d1' && t.categoriaId !== 'cat-d2')
    .reduce((sum, item) => sum + item.valor, 0);

  const totalExpensesSum = totalProcurementCosts + totalAdministrativeDrafts + totalDASTaxesPaid + totalOtherExpenses;
  const netEarningsSum = totalInboundSales - totalExpensesSum;

  const dreHeaders = ['Rubrica / Indicador Financeiro', 'Valor (Regime de Caixa)', 'Observações Didáticas'];
  const dreRows = [
    ['RECEITA OPERACIONAL BRUTA (+)', totalInboundSales, 'Total de receitas recolhidas no período'],
    ['(-) Custo de Compra de Matérias Primas', totalProcurementCosts, 'Insumos de marcenaria comprados'],
    ['(-) Despesas Administrativas de Manutenção', totalAdministrativeDrafts, 'Aluguel, Luz, Internet etc.'],
    ['(-) Impostos Unificados DAS Quitados', totalDASTaxesPaid, 'Guias recolhidas mensais PGMEI'],
    ['(-) Outras Despesas de Funcionamento', totalOtherExpenses, 'Tarifas bancárias PJ, taxas e afins'],
    ['TOTAL DE DESPESAS OPERACIONAIS (-)', totalExpensesSum, 'Soma total dos desembolsos computados'],
    ['= RESULTADO LÍQUIDO DO PERÍODO', netEarningsSum, 'Lucro líquido passível de distribuição isenta']
  ];

  // 2. CALCULATE PGDAS SHEET DATA
  const meses = [
    { num: '01', nome: 'Janeiro' },
    { num: '02', nome: 'Fevereiro' },
    { num: '03', nome: 'Março' },
    { num: '04', nome: 'Abril' },
    { num: '05', nome: 'Maio' },
    { num: '06', nome: 'Junho' },
    { num: '07', nome: 'Julho' },
    { num: '08', nome: 'Agosto' },
    { num: '09', nome: 'Setembro' },
    { num: '10', nome: 'Outubro' },
    { num: '11', nome: 'Novembro' },
    { num: '12', nome: 'Dezembro' }
  ];

  const pgdasHeaders = [
    'Competência', 
    'Comércio (c/ Nota Emitida)', 
    'Comércio (s/ Nota Emitida)', 
    'Serviço (c/ Nota Emitida)', 
    'Serviço (s/ Nota Emitida)', 
    'Faturamento Mensal Bruto'
  ];

  const pgdasRows = meses.map(mes => {
    const monthStr = `${selectedYear}-${mes.num}`;
    
    const totalComercio = yearTransactions
      .filter(t => t.tipo === 'RECEITA' && t.data.startsWith(monthStr) && t.categoriaId === 'cat-r1')
      .reduce((sum, t) => sum + t.valor, 0);
      
    const invoicesComercio = invoices
      .filter(inv => inv.tipo === 'NFE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
      .reduce((sum, inv) => sum + inv.valorTotal, 0);
      
    const comercioComNota = Math.min(totalComercio, invoicesComercio);
    const comercioSemNota = Math.max(0, totalComercio - comercioComNota);

    const totalServico = yearTransactions
      .filter(t => t.tipo === 'RECEITA' && t.data.startsWith(monthStr) && t.categoriaId === 'cat-r2')
      .reduce((sum, t) => sum + t.valor, 0);
      
    const invoicesServico = invoices
      .filter(inv => inv.tipo === 'NFSE' && (inv.status === 'PRODUCAO' || inv.status === 'HOMOLOGACAO') && inv.dataEmissao.startsWith(monthStr))
      .reduce((sum, inv) => sum + inv.valorTotal, 0);
      
    const servicoComNota = Math.min(totalServico, invoicesServico);
    const servicoSemNota = Math.max(0, totalServico - servicoComNota);
    const totalMes = totalComercio + totalServico;

    return [
      mes.nome,
      comercioComNota,
      comercioSemNota,
      servicoComNota,
      servicoSemNota,
      totalMes
    ];
  });

  // 3. TRANSACTIONS LIST SHEET DATA
  const transHeaders = [
    'ID Transação', 
    'Data Lançamento', 
    'Tipo', 
    'Categoria Integrada', 
    'Descrição Detalhada', 
    'Valor (BRL)', 
    'Situação de Caixa'
  ];
  
  const transRows = yearTransactions.map(t => {
    const categoryName = categories.find(c => c.id === t.categoriaId)?.nome || t.categoriaId;
    return [
      t.id,
      t.data,
      t.tipo,
      categoryName,
      t.descricao,
      t.valor,
      t.status
    ];
  });

  // Assemble Workbook Worksheets Structure
  const workbookData = [
    {
      sheetName: 'Demonstração DRE Simplificada',
      headers: dreHeaders,
      rows: dreRows
    },
    {
      sheetName: 'Apuração Mensal PGDAS-D',
      headers: pgdasHeaders,
      rows: pgdasRows
    },
    {
      sheetName: 'Lançamentos de Caixa Detalhados',
      headers: transHeaders,
      rows: transRows
    }
  ];

  const title = `MEI-Simple_Relatorio_Consolidado_${selectedYear}`;
  return createAndPopulateSpreadsheet(token, title, workbookData);
}

/* ==========================================
 * GOOGLE DRIVE REST API SERVICES
 * ========================================== */

export interface GoogleDriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
  trashed?: boolean;
}

export interface GoogleDriveStorageQuota {
  limit?: string;
  usage?: string;
  usageInDrive?: string;
  usageInDriveTrash?: string;
  user?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
  };
}

/**
 * Retrieves storage quota and user profile info from Google Drive
 */
export async function getDriveStorageInfo(token: string): Promise<GoogleDriveStorageQuota> {
  const url = `https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink),storageQuota`;
  try {
    const result = await callGoogleAPI(url, 'GET', token);
    return {
      limit: result.storageQuota?.limit,
      usage: result.storageQuota?.usage,
      usageInDrive: result.storageQuota?.usageInDrive,
      usageInDriveTrash: result.storageQuota?.usageInDriveTrash,
      user: result.user
    };
  } catch (err) {
    console.error('Erro ao obter dados de armazenamento do Google Drive:', err);
    throw err;
  }
}

/**
 * Lists files and folders from Google Drive
 */
export async function listDriveFiles(
  token: string, 
  options: {
    folderId?: string;
    searchTerm?: string;
    mimeTypeFilter?: string;
    pageSize?: number;
    pageToken?: string;
  } = {}
): Promise<{ files: GoogleDriveFileItem[]; nextPageToken?: string }> {
  const { folderId, searchTerm, mimeTypeFilter, pageSize = 50, pageToken } = options;
  
  const queryParts: string[] = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  } else if (!searchTerm) {
    // If not searching, default to root or unparented/top level
    queryParts.push(`'root' in parents`);
  }

  if (searchTerm) {
    const escaped = searchTerm.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  if (mimeTypeFilter) {
    queryParts.push(`mimeType = '${mimeTypeFilter}'`);
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink,webViewLink,webContentLink,parents,trashed)');
  const orderBy = encodeURIComponent('folder,modifiedTime desc');
  
  let url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=${pageSize}&orderBy=${orderBy}`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  try {
    const result = await callGoogleAPI(url, 'GET', token);
    return {
      files: result.files || [],
      nextPageToken: result.nextPageToken
    };
  } catch (err) {
    console.error('Erro ao listar arquivos do Google Drive:', err);
    throw err;
  }
}

/**
 * Creates a folder inside Google Drive
 */
export async function createDriveFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<GoogleDriveFileItem> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const url = `https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink,parents`;
  try {
    const result = await callGoogleAPI(url, 'POST', token, metadata);
    return result;
  } catch (err) {
    console.error('Erro ao criar pasta no Google Drive:', err);
    throw err;
  }
}

/**
 * Finds an existing folder by name or creates it if not found
 */
export async function getOrCreateFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<GoogleDriveFileItem> {
  const queryParts = [
    `name = '${folderName.replace(/'/g, "\\'")}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`
  ];
  if (parentFolderId) {
    queryParts.push(`'${parentFolderId}' in parents`);
  } else {
    queryParts.push(`'root' in parents`);
  }

  const q = encodeURIComponent(queryParts.join(' and '));
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,parents)`;
  
  try {
    const searchRes = await callGoogleAPI(url, 'GET', token);
    if (searchRes.files && searchRes.files.length > 0) {
      return searchRes.files[0];
    }
    return await createDriveFolder(token, folderName, parentFolderId);
  } catch (err) {
    console.error(`Erro ao buscar ou criar pasta '${folderName}' no Google Drive:`, err);
    throw err;
  }
}

/**
 * Uploads a file (Blob / File / text content) into Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  token: string,
  fileData: Blob | File | string,
  metadata: {
    name: string;
    mimeType?: string;
    parents?: string[];
    description?: string;
  }
): Promise<GoogleDriveFileItem> {
  const boundary = `-------314159265358979323846_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const contentType = metadata.mimeType || (fileData instanceof File ? fileData.type : 'application/octet-stream') || 'application/octet-stream';

  const metadataJson = JSON.stringify({
    name: metadata.name,
    mimeType: contentType,
    parents: metadata.parents || undefined,
    description: metadata.description || undefined
  });

  let fileBlob: Blob;
  if (typeof fileData === 'string') {
    fileBlob = new Blob([fileData], { type: contentType });
  } else {
    fileBlob = fileData;
  }

  const multipartRequestBody = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataJson,
    delimiter,
    `Content-Type: ${contentType}\r\n\r\n`,
    fileBlob,
    closeDelimiter
  ]);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Falha no upload para o Google Drive (${response.status})`);
  }

  return response.json();
}

/**
 * Uploads full JSON system backup to Google Drive in a dedicated MEI-Simple folder
 */
export async function uploadJsonBackupToDrive(
  token: string,
  backupName: string,
  data: any,
  parentFolderId?: string
): Promise<GoogleDriveFileItem> {
  let targetParentId = parentFolderId;
  if (!targetParentId) {
    const backupFolder = await getOrCreateFolder(token, 'MEI-Simple - Backups & Documentos');
    targetParentId = backupFolder.id;
  }

  const jsonString = JSON.stringify(data, null, 2);
  const fileName = `${backupName}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  return uploadFileToDrive(token, jsonString, {
    name: fileName,
    mimeType: 'application/json',
    parents: [targetParentId],
    description: 'Backup de segurança estruturado do MEI-Simple'
  });
}

/**
 * Deletes a file or folder from Google Drive
 */
export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Falha ao remover arquivo (${response.status})`);
    }
  } catch (err) {
    console.error('Erro ao deletar arquivo do Google Drive:', err);
    throw err;
  }
}

