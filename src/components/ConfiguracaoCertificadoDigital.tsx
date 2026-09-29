import React, { useState, useRef } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X,
  FileCode,
  Activity,
  Sliders
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { SectionHeader } from './SectionHeader';
import { ActionButton } from './ActionButton';
import { ConfirmActionModal } from './ConfirmActionModal';

export interface DigitalCertificate {
  isUploaded: boolean;
  tipo: 'A1' | 'A3';
  titular: string;
  cnpj: string;
  emissor: string;
  validadeInicio: string;
  validadeFim: string;
  diasRestantes: number;
  status: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'NOT_CONFIGURED';
  ufSefaz: string;
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
  fileName?: string;
  fileSize?: string;
  serialNumber?: string;
  lastValidated?: string;
}

interface ConfiguracaoCertificadoDigitalProps {
  certificate: DigitalCertificate;
  onUpdateCertificate: (cert: DigitalCertificate) => void;
  isCompact?: boolean;
}

export const ConfiguracaoCertificadoDigital: React.FC<ConfiguracaoCertificadoDigitalProps> = ({
  certificate,
  onUpdateCertificate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(certificate.fileName || 'certificado_digital_carlos_oliveira_2026.pfx');
  const [selectedFileSize, setSelectedFileSize] = useState(certificate.fileSize || '8.4 KB');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [certType, setCertType] = useState<'A1' | 'A3'>(certificate.tipo);
  const [ufSefaz, setUfSefaz] = useState(certificate.ufSefaz);
  const [ambiente, setAmbiente] = useState<'PRODUCAO' | 'HOMOLOGACAO'>(certificate.ambiente);
  
  // Validation Process State
  const [isValidating, setIsValidating] = useState(false);
  const [validationStep, setValidationStep] = useState<number>(0);
  const [validationSuccess, setValidationSuccess] = useState<boolean | null>(null);
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFileName(file.name);
    const sizeInKb = (file.size / 1024).toFixed(1);
    setSelectedFileSize(`${sizeInKb} KB`);
    setValidationSuccess(null);
    setValidationStep(0);
    showToast(`Arquivo "${file.name}" carregado para validação.`);
  };

  // Simulação de Validação Criptográfica e Conexão SEFAZ
  const handleTestAndValidate = async () => {
    setIsValidating(true);
    setValidationSuccess(null);
    setValidationStep(1);
    setValidationLogs(['Iniciando leitura do arquivo PKCS#12 (.pfx / .p12)...']);

    await new Promise(r => setTimeout(r, 600));
    setValidationStep(2);
    setValidationLogs(prev => [...prev, 'Decodificando chave privada e certificado público ICP-Brasil...']);

    await new Promise(r => setTimeout(r, 700));
    setValidationStep(3);
    setValidationLogs(prev => [...prev, 'Validando cadeia de confiança (AC SERPRO RFB v5 -> ICP-Brasil)...']);

    await new Promise(r => setTimeout(r, 600));
    setValidationStep(4);
    setValidationLogs(prev => [
      ...prev,
      `Pingando WebService SEFAZ ${ufSefaz} [Ambiente: ${ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação'}]...`
    ]);

    await new Promise(r => setTimeout(r, 700));
    setValidationStep(5);
    setValidationLogs(prev => [
      ...prev,
      'Status SEFAZ: 107 - Serviço em Operação (Tempo de Resposta: 142ms)',
      'Certificado Digital A1 validado e apto para emissão de NF-e!'
    ]);
    setValidationSuccess(true);
    setIsValidating(false);
  };

  const handleSaveCertificate = () => {
    const updatedCert: DigitalCertificate = {
      isUploaded: true,
      tipo: certType,
      titular: 'CARLOS OLIVEIRA MEI',
      cnpj: '30.751.934/0001-30',
      emissor: 'AC SERPRO RFB v5 (ICP-Brasil)',
      validadeInicio: '14/03/2026',
      validadeFim: '14/03/2027',
      diasRestantes: 194,
      status: 'VALID',
      ufSefaz: ufSefaz,
      ambiente: ambiente,
      fileName: selectedFileName,
      fileSize: selectedFileSize,
      serialNumber: '7F:3A:9B:12:88:E4:C0:51:29:A7',
      lastValidated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    onUpdateCertificate(updatedCert);
    setIsModalOpen(false);
    showToast('Certificado Digital A1 configurado e ativo para emissão de NF-e!');
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {}
  });

  const handleRemoveCertificate = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Certificado Digital',
      description: 'Deseja realmente remover o Certificado Digital atual? A emissão de notas fiscais eletrônicas (NF-e) exigirá uma nova configuração.',
      onConfirm: () => {
        const emptyCert: DigitalCertificate = {
          isUploaded: false,
          tipo: 'A1',
          titular: 'Não Configurado',
          cnpj: '30.751.934/0001-30',
          emissor: 'Pendente',
          validadeInicio: '--',
          validadeFim: '--',
          diasRestantes: 0,
          status: 'NOT_CONFIGURED',
          ufSefaz: ufSefaz,
          ambiente: ambiente,
          fileName: '',
          fileSize: ''
        };
        onUpdateCertificate(emptyCert);
        setSelectedFileName('');
        setValidationSuccess(null);
        setIsModalOpen(false);
        showToast('Certificado Digital desvinculado com sucesso.');
      }
    });
  };

  const getStatusBadge = () => {
    if (!certificate.isUploaded || certificate.status === 'NOT_CONFIGURED') {
      return {
        label: 'Certificado Pendente',
        bg: 'bg-semantic-warning-light text-slate-800 border-semantic-warning-light',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
      };
    }
    if (certificate.status === 'EXPIRED') {
      return {
        label: 'Certificado Expirado',
        bg: 'bg-semantic-danger-light text-semantic-danger border-semantic-danger-light',
        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
      };
    }
    if (certificate.status === 'EXPIRING') {
      return {
        label: `Expira em ${certificate.diasRestantes} dias`,
        bg: 'bg-semantic-warning-light text-slate-800 border-semantic-warning-light',
        icon: <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
      };
    }
    return {
      label: 'Certificado A1 Ativo e Válido',
      bg: 'bg-semantic-success-light text-semantic-success border-semantic-success-light',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-semantic-success" />
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      {/* -------------------------------------------------------------
          CARD PRINCIPAL: STATUS E CONFIGURAÇÃO DO CERTIFICADO DIGITAL
          ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        {/* Cabeçalho do Card */}
        <div className="pb-1">
          <SectionHeader
            as="h3"
            icon={<KeyRound className="w-5 h-5 text-semantic-success" />}
            title="Certificado Digital SEFAZ (Obrigatório p/ NF-e)"
            info="Assinatura digital padrão A1 (.pfx) exigida pela Secretaria da Fazenda para autorização de notas de produto."
            badges={
              <span className="hidden md:inline-flex text-[10px] font-comfortaa px-2.5 py-0.5 rounded-full bg-semantic-success-light text-semantic-success font-bold border border-semantic-success-light">
                ICP-Brasil
              </span>
            }
            actions={
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`text-[10px] font-bold font-inter px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${statusBadge.bg}`}>
                  {statusBadge.icon}
                  <span>{statusBadge.label}</span>
                </span>

                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                  icon={<Sliders className="w-3.5 h-3.5 text-[#2dd683]" />}
                  className="bg-slate-900 hover:bg-slate-800 text-white border-transparent"
                  title="Configurar ou validar certificado digital"
                >
                  Gerenciar
                </ActionButton>
              </div>
            }
          />
        </div>

        <div className="h-[0.8px] w-full bg-slate-100 rounded-full" />

        {/* Grade Informativa de Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs font-inter">
          
          {/* Box 1: Titular e Emissor */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-montserrat">
                Titular & Emissor
              </span>
              <p className="font-bold text-slate-900 text-xs truncate font-montserrat">
                {certificate.isUploaded ? certificate.titular : 'Nenhum certificado ativo'}
              </p>
              <p className="text-[10px] text-slate-600 font-mono font-medium">
                CNPJ: {certificate.cnpj}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                Emissor: {certificate.isUploaded ? certificate.emissor : 'Não vinculado'}
              </p>
            </div>

            {certificate.isUploaded && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Arquivo .pfx:</span>
                <span className="font-mono font-bold text-slate-700 truncate max-w-[130px]">
                  {certificate.fileName || 'certificado.pfx'}
                </span>
              </div>
            )}
          </div>

          {/* Box 2: Validade e Dias Restantes */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-montserrat">
                  Período de Validade
                </span>
                {certificate.isUploaded && (
                  <span className="text-[10px] font-bold text-semantic-success font-mono">
                    {certificate.diasRestantes} dias restantes
                  </span>
                )}
              </div>

              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Emissão:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {certificate.validadeInicio}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Vencimento:</span>
                  <span className="font-mono font-bold text-semantic-success">
                    {certificate.validadeFim}
                  </span>
                </div>
              </div>
            </div>

            {certificate.isUploaded && (
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-semantic-success h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (certificate.diasRestantes / 365) * 100))}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 block text-right font-medium">
                  Criptografia SHA-256 / RSA 2048-bit
                </span>
              </div>
            )}
          </div>

          {/* Box 3: Parâmetros SEFAZ e Ações */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-montserrat">
                Conexão WebService SEFAZ
              </span>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">UF / Região:</span>
                  <span className="font-bold text-slate-900">{certificate.ufSefaz}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Ambiente:</span>
                  <span className="font-bold text-slate-900">
                    {certificate.ambiente === 'PRODUCAO' ? 'Produção (Oficial)' : 'Homologação (Testes)'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Status Conexão:</span>
                  <span className="font-bold text-semantic-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-semantic-success animate-pulse" />
                    Online 107
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-10 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold font-inter transition cursor-pointer flex-1 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Substituir .PFX</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL: CARREGAMENTO, CONFIGURAÇÃO E VALIDAÇÃO DO CERTIFICADO
          ------------------------------------------------------------- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
          onClick={() => !isValidating && setIsModalOpen(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-semantic-success-light text-semantic-success border border-semantic-success-light shadow-xs">
                  <KeyRound className="w-5 h-5 text-semantic-success" />
                </div>
                <div>
                  <h3 className="font-extrabold font-montserrat text-base text-slate-900 flex items-center">
                    Configuração de Certificado Digital A1 / A3
                    <InfoTooltip text="Carregue o arquivo do seu certificado para assinar NF-e com validade jurídica na SEFAZ." />
                  </h3>
                </div>
              </div>

              <button
                type="button"
                disabled={isValidating}
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zona de Seleção / Drag & Drop de Arquivo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold font-inter text-slate-800">
                Arquivo do Certificado Digital (.pfx, .p12, .crt, .cer):
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pfx,.p12,.crt,.cer"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                    : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-emerald-400'
                }`}
              >
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-emerald-600 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold font-inter text-slate-800">
                    Clique para selecionar ou arraste o arquivo <span className="text-emerald-700 font-mono font-bold">.PFX / .P12</span>
                  </p>
                  <p className="text-[11px] font-inter text-slate-500 mt-0.5">
                    Certificados A1 armazenados com segurança e criptografia de ponta a ponta
                  </p>
                </div>

                {selectedFileName && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-semantic-success-light text-semantic-success text-xs font-mono font-bold border border-semantic-success-light">
                    <FileCode className="w-4 h-4 text-semantic-success" />
                    <span>{selectedFileName}</span>
                    <span className="text-[10px] text-semantic-success">({selectedFileSize})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs de Senha e Parâmetros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Senha do Certificado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-inter text-slate-800">
                  Senha do Certificado (.PFX):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha do certificado..."
                    className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium focus:outline-hidden focus:border-[#2dd683]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] font-inter text-slate-500 block">
                  A senha é necessária para descriptografar a chave privada no momento da assinatura.
                </span>
              </div>

              {/* Tipo de Certificado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-inter text-slate-800">
                  Modelo do Certificado:
                </label>
                <select
                  value={certType}
                  onChange={(e) => setCertType(e.target.value as 'A1' | 'A3')}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:outline-hidden focus:border-[#2dd683]"
                >
                  <option value="A1">Certificado A1 (.pfx em Nuvem - Recomendado MEI)</option>
                  <option value="A3">Certificado A3 (Cartão / Token Físico USB)</option>
                </select>
                <span className="text-[10px] font-inter text-slate-500 block">
                  O modelo A1 permite emissões automáticas sem conexão física contínua.
                </span>
              </div>

              {/* SEFAZ Estadual */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-inter text-slate-800">
                  SEFAZ de Origem (UF do MEI):
                </label>
                <select
                  value={ufSefaz}
                  onChange={(e) => setUfSefaz(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:outline-hidden focus:border-[#2dd683]"
                >
                  <option value="SP - SEFAZ São Paulo">SP - SEFAZ São Paulo</option>
                  <option value="RJ - SEFAZ Rio de Janeiro">RJ - SEFAZ Rio de Janeiro</option>
                  <option value="MG - SEFAZ Minas Gerais">MG - SEFAZ Minas Gerais</option>
                  <option value="PR - SEFAZ Paraná">PR - SEFAZ Paraná</option>
                  <option value="RS - SEFAZ Rio Grande do Sul">RS - SEFAZ Rio Grande do Sul</option>
                  <option value="BA - SEFAZ Bahia">BA - SEFAZ Bahia</option>
                  <option value="SC - SEFAZ Santa Catarina">SC - SEFAZ Santa Catarina</option>
                  <option value="GO - SEFAZ Goiás">GO - SEFAZ Goiás</option>
                </select>
              </div>

              {/* Ambiente */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-inter text-slate-800">
                  Ambiente de Transmissão:
                </label>
                <select
                  value={ambiente}
                  onChange={(e) => setAmbiente(e.target.value as 'PRODUCAO' | 'HOMOLOGACAO')}
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold focus:outline-hidden focus:border-[#2dd683]"
                >
                  <option value="PRODUCAO">Produção (Validade Jurídica Fiscal Oficial)</option>
                  <option value="HOMOLOGACAO">Homologação (Ambiente de Testes Sem Valor Fiscal)</option>
                </select>
              </div>

            </div>

            {/* Painel de Validação e Teste */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-semantic-success" />
                  <span className="text-xs font-bold font-montserrat text-slate-800">
                    Teste e Diagnóstico de Conexão SEFAZ
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isValidating}
                  onClick={handleTestAndValidate}
                  className="h-9 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold font-inter transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-semantic-success ${isValidating ? 'animate-spin' : ''}`} />
                  <span>{isValidating ? 'Validando...' : 'Testar Conexão SEFAZ'}</span>
                </button>
              </div>

              {/* Logs de Validação em Tempo Real */}
              {validationLogs.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5 border border-slate-800">
                  {validationLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#2dd683] font-bold shrink-0">✔</span>
                      <span className="leading-relaxed">{log}</span>
                    </div>
                  ))}
                  {isValidating && (
                    <div className="flex items-center gap-2 text-emerald-400 animate-pulse pt-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Processando etapa {validationStep}/5 de verificação...</span>
                    </div>
                  )}
                </div>
              )}

              {validationSuccess && (
                <div className="p-3 rounded-xl bg-semantic-success-light border border-semantic-success-light flex items-center gap-2.5 text-xs text-slate-900">
                  <CheckCircle2 className="w-5 h-5 text-semantic-success shrink-0" />
                  <div>
                    <strong className="block font-extrabold font-montserrat">Certificado e Conexão 100% Válidos!</strong>
                    <span className="text-[11px] font-inter text-slate-700 font-medium">
                      O certificado ICP-Brasil é autêntico, a senha está correta e os servidores da SEFAZ responderam com sucesso.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Ações do Footer */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {certificate.isUploaded ? (
                <button
                  type="button"
                  disabled={isValidating}
                  onClick={handleRemoveCertificate}
                  className="text-semantic-danger hover:underline text-xs font-bold font-inter cursor-pointer transition self-start sm:self-auto"
                >
                  Desvincular Certificado Atual
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isValidating}
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold font-inter transition cursor-pointer flex-1 sm:flex-initial"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isValidating}
                  onClick={handleSaveCertificate}
                  className="h-11 px-6 rounded-xl bg-[#2dd683] hover:bg-[#25be73] text-[#000000] text-xs font-extrabold font-inter transition cursor-pointer flex items-center justify-center gap-2 shadow-xs flex-1 sm:flex-initial"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#000000]" />
                  <span>Salvar & Ativar Certificado</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Global de Confirmação para Exclusões (Requisito 2) */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#2dd683] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
};
