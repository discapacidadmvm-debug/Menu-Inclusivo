import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface QrSvgProps {
  value: string;
  size: number;
  title: string;
  quietZone?: number;
}

export const QrSvg: React.FC<QrSvgProps> = ({
  value,
  size,
  title,
  quietZone = 2,
}) => {
  const svgData = useMemo(() => {
    if (!value) return null;
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      const total = count + quietZone * 2;
      let path = '';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.modules.get(r, c)) {
            path += `M${c + quietZone},${r + quietZone}h1v1h-1z`;
          }
        }
      }
      return { total, path };
    } catch {
      return null;
    }
  }, [value, quietZone]);

  if (!svgData) {
    return (
      <div
        className="flex items-center justify-center bg-slate-100 text-xs text-slate-600 text-center p-2"
        style={{ width: size, height: size }}
      >
        URL inválida para QR
      </div>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${svgData.total} ${svgData.total}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
      className="block bg-white"
    >
      <rect width={svgData.total} height={svgData.total} fill="#ffffff" />
      <path d={svgData.path} fill="#0f172a" />
    </svg>
  );
};
