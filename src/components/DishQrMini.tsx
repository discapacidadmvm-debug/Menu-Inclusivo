import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, ExternalLink } from 'lucide-react';
import { QrSvg } from './QrSvg.tsx';

interface DishQrMiniProps {
  slug: string;
  platoId: string;
  platoNombre: string;
  size?: number;
  sizeMm?: number;
  showActions?: boolean;
  isDraftUnsaved?: boolean;
  onTestQr?: () => void;
}

export function buildDishUrl(slug: string, platoId: string): string {
  const pathPart =
    typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${pathPart}`
      : '/';
  return `${base}?carta=${encodeURIComponent(slug)}&plato=${encodeURIComponent(platoId)}`;
}

export const DishQrMini: React.FC<DishQrMiniProps> = ({
  slug,
  platoId,
  platoNombre,
  size = 96,
  sizeMm,
  showActions = true,
  isDraftUnsaved = false,
  onTestQr,
}) => {
  const [copied, setCopied] = useState(false);

  const dishUrl = buildDishUrl(slug, platoId);

  const handleDownload = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(dishUrl, {
        width: Math.max(size * 4, 480),
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      const safeName = (platoNombre || 'plato')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      a.download = `qr-plato-${safeName || platoId}.png`;
      a.click();
    } catch {
      // ignore
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dishUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      return;
    } catch {
      // Fallback para entornos sin permiso de portapapeles
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = dishUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="bg-white border border-slate-300 shrink-0 flex items-center justify-center"
        style={
          sizeMm
            ? {
                width: `${sizeMm + 2}mm`,
                height: `${sizeMm + 2}mm`,
                padding: '1mm',
                borderRadius: '1mm',
                boxSizing: 'border-box',
              }
            : { width: size + 12, height: size + 12, padding: 6, borderRadius: 8 }
        }
      >
        <QrSvg
          value={dishUrl}
          size={sizeMm ?? size}
          unit={sizeMm ? 'mm' : 'px'}
          title={`QR del plato ${platoNombre}`}
          quietZone={1}
        />
      </div>

      {showActions && (
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-semibold text-slate-800">
            QR directo del plato
          </p>
          <p className="text-[11px] text-slate-500 font-mono-tabular truncate max-w-[230px]">
            {isDraftUnsaved
              ? 'Se activa al guardar el plato'
              : `?carta=${slug}&plato=${platoId}`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              PNG
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-700" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? 'Copiado' : 'Enlace'}
            </button>
            {onTestQr && !isDraftUnsaved && (
              <button
                type="button"
                onClick={onTestQr}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 border border-blue-200 text-blue-800 rounded hover:bg-blue-100 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                Probar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
