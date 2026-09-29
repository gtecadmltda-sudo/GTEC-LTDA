/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode as QrCodeIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Maximize2, 
  X, 
  ShieldCheck, 
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InfoTooltip } from './InfoTooltip';

export interface FiscalQRCodeProps {
  chaveAcesso: string;
  tipo: 'NFE' | 'NFSE' | 'NF-e' | 'NFS-e';
  numero?: string;
  size?: number;
  className?: string;
  showDetails?: boolean;
  showExpandButton?: boolean;
  onScanClick?: () => void;
  darkColor?: string;
  lightColor?: string;
}

export function getOfficialConsultationUrl(chaveAcesso: string, tipo: 'NFE' | 'NFSE' | 'NF-e' | 'NFS-e'): string {
  const cleanKey = chaveAcesso.replace(/\s+/g, '');
  if (tipo === 'NFE' || tipo === 'NF-e') {
    return `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&nfe=${cleanKey}`;
  }
  return `https://www.nfse.gov.br/consultapublica?chave=${cleanKey}`;
}

export function FiscalQRCode({
  chaveAcesso,
  tipo,
  numero,
  size = 120,
  className = '',
  showDetails = false,
  showExpandButton = true,
  darkColor = '#0f172a',
  lightColor = '#ffffff'
}: FiscalQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const cleanKey = chaveAcesso.replace(/\s+/g, '');
  const consultUrl = getOfficialConsultationUrl(chaveAcesso, tipo);

  useEffect(() => {
    let isMounted = true;
    
    // We encode the official verification URL which contains the full chave de acesso
    QRCode.toDataURL(consultUrl, {
      width: Math.max(size * 2, 256),
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Erro ao gerar QR Code Fiscal:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [consultUrl, size, darkColor, lightColor]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(cleanKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(consultUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QRCode_Chave_${tipo}_${numero || 'nota'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={`relative inline-flex flex-col items-center ${className}`}>
        <div 
          className="relative group cursor-pointer bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200"
          onClick={() => showExpandButton && setIsModalOpen(true)}
          title="Clique para ampliar o QR Code para escaneamento rápido no celular"
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code Chave ${tipo}`} 
              style={{ width: size, height: size }}
              className="block rounded-lg object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              style={{ width: size, height: size }} 
              className="flex items-center justify-center bg-slate-100 rounded-lg animate-pulse"
            >
              <QrCodeIcon className="w-8 h-8 text-slate-400" />
            </div>
          )}

          {showExpandButton && (
            <div className="absolute inset-0 bg-slate-900/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 p-1">
              <Maximize2 className="w-4 h-4 text-[#2dd683]" />
              <span>Ampliar</span>
            </div>
          )}
        </div>

        {showDetails && (
          <div className="mt-2 text-center w-full max-w-[200px]">
            <span className="text-[10px] font-bold text-slate-700 block truncate">
              {tipo === 'NFE' ? 'Consulta SEFAZ' : 'Consulta Gov.br'}
            </span>
            <span className="text-[9px] font-mono text-slate-500 block truncate" title={cleanKey}>
              {cleanKey.slice(0, 14)}...{cleanKey.slice(-6)}
            </span>
          </div>
        )}
      </div>

      {/* Modal de Conferência Rápida / Escaneamento por Smartphone */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-300 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4"
            >
              {/* Topo do Modal */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-inter">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-white ${tipo === 'NFE' ? 'bg-sky-600' : 'bg-indigo-600'}`}>
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-montserrat text-slate-900 flex items-center">
                      Conferência Rápida via QR Code
                      <InfoTooltip text={`${tipo === 'NFE' ? 'DANFE • Nota Fiscal de Produto' : 'DANFSE • Nota Fiscal de Serviço'} ${numero ? `Nº ${numero}` : ''}`} />
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Code em Destaque Alto Contraste */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 font-inter">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-300">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Oficial"
                      className="w-56 h-56 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="text-center space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-inter bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Pronto para Escaneamento com a Câmera
                  </span>
                  <p className="text-xs font-inter text-slate-600 font-medium pt-1 max-w-xs">
                    Aponte a câmera do seu celular para abrir a autenticidade diretamente no portal oficial do {tipo === 'NFE' ? 'SEFAZ' : 'Gov.br'}.
                  </p>
                </div>
              </div>

              {/* Chave de Acesso Detalhada */}
              <div className="space-y-1.5 bg-slate-100 p-3 rounded-xl border border-slate-200 font-inter">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 font-inter">
                    Chave de Acesso Fiscal ({tipo === 'NFE' ? '44 dígitos' : 'Código de Autenticação'}):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-[10px] font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-inter"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? 'Copiada!' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-300 font-mono text-[10px] font-bold text-slate-900 break-all select-all leading-tight">
                  {chaveAcesso}
                </div>
              </div>

              {/* Ações do Modal */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 font-inter">
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="h-11 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition cursor-pointer flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Baixar QR Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="h-11 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  title="Copiar Link de Consulta"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <span>{copiedUrl ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>

                <a
                  href={consultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex-1 flex items-center justify-center gap-2 shadow-xs text-center"
                >
                  <ExternalLink className="w-4 h-4 text-[#2dd683]" />
                  <span>Abrir Portal {tipo === 'NFE' ? 'SEFAZ' : 'Gov.br'}</span>
                </a>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
