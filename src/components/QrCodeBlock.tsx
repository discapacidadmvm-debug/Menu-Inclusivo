import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { QrSvg } from './QrSvg.tsx';

interface QrCodeBlockProps {
  url: string;
  comercioNombre: string;
  obleaNumero?: string;
  size?: number;
  showActions?: boolean;
  onOpenDigitalMenu?: () => void;
}

export const QrCodeBlock: React.FC<QrCodeBlockProps> = ({
  url,
  comercioNombre,
  obleaNumero,
  size = 220,
  showActions = true,
  onOpenDigitalMenu,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // Fallback para entornos sin permiso de portapapeles
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  const handleDownloadPng = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: Math.max(size * 3, 600),
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr-carta-${comercioNombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      link.click();
    } catch {
      // Si fallara toDataURL, no rompe la UI
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="bg-white border border-slate-300 rounded-xl p-3 flex items-center justify-center"
        style={{ width: size + 24, height: size + 24 }}
      >
        <QrSvg
          value={url}
          size={size}
          title={`Código QR de la carta digital inclusiva de ${comercioNombre}`}
          quietZone={2}
        />
      </div>

      {obleaNumero && (
        <p className="mt-2 text-xs text-slate-600 font-mono-tabular">
          Oblea Municipal Nº {obleaNumero}
        </p>
      )}

      {showActions && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar QR (PNG)
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-700" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </button>

          {onOpenDigitalMenu && (
            <button
              type="button"
              onClick={onOpenDigitalMenu}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir menú digital con voz
            </button>
          )}
        </div>
      )}
    </div>
  );
};
