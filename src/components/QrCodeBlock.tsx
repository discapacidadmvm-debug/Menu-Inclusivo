import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';

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
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, {
      width: size * 2,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((res) => {
        if (active) setDataUrl(res);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [url, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-carta-${comercioNombre.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="bg-white border border-slate-300 rounded-xl p-3 flex items-center justify-center"
        style={{ width: size + 24, height: size + 24 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Código QR de la carta digital inclusiva de ${comercioNombre}`}
            width={size}
            height={size}
            className="block"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-xs text-slate-500 text-center px-4">
            Generando código QR...
          </div>
        )}
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
            disabled={!dataUrl}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar QR (PNG)
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
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
