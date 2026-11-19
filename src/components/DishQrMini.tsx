import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check } from 'lucide-react';

interface DishQrMiniProps {
  slug: string;
  platoId: string;
  platoNombre: string;
  size?: number;
  showActions?: boolean;
}

export function buildDishUrl(slug: string, platoId: string): string {
  if (typeof window === 'undefined') {
    return `/?carta=${encodeURIComponent(slug)}&plato=${encodeURIComponent(platoId)}`;
  }
  return `${window.location.origin}/?carta=${encodeURIComponent(slug)}&plato=${encodeURIComponent(platoId)}`;
}

export const DishQrMini: React.FC<DishQrMiniProps> = ({
  slug,
  platoId,
  platoNombre,
  size = 96,
  showActions = true,
}) => {
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const dishUrl = buildDishUrl(slug, platoId);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(dishUrl, {
      width: size * 3,
      margin: 1,
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
  }, [dishUrl, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    const safeName = (platoNombre || 'plato')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    a.download = `qr-plato-${safeName || platoId}.png`;
    a.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dishUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="bg-white border border-slate-300 rounded-lg p-1.5 shrink-0 flex items-center justify-center"
        style={{ width: size + 12, height: size + 12 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR del plato ${platoNombre}`}
            width={size}
            height={size}
            className="block"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-[10px] text-slate-500 text-center">QR</span>
        )}
      </div>

      {showActions && (
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-semibold text-slate-800">
            QR directo del plato
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!dataUrl}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer disabled:opacity-50"
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
          </div>
        </div>
      )}
    </div>
  );
};
