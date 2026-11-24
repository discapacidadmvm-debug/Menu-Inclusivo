import React from 'react';
import {
  BRAILLE_SPECS_MM,
  brailleCharToDots,
} from '../utils/braille.ts';

export interface BrailleSvgLine {
  braille: string;
  guide?: string;
}

interface BrailleSvgProps {
  lines: BrailleSvgLine[];
  showGuide?: boolean;
  showEmptyDots?: boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Renderizador vectorial Braille a escala física exacta (1:1 en milímetros):
 * - Alto de celda (6 puntos): 6,5 mm
 * - Ancho de celda: 4,0 mm
 * - Distancia entre puntos (H y V, centro a centro): 2,5 mm
 * - Distancia entre celdas contiguas (centro a centro): 6,0 mm
 * - Interlineado entre renglones (centro a centro): 10,0 mm
 */
export const BrailleSvg: React.FC<BrailleSvgProps> = ({
  lines,
  showGuide = false,
  showEmptyDots = false,
  ariaLabel,
  className = '',
}) => {
  const safeLines = lines.length > 0 ? lines : [{ braille: '⠀' }];
  const {
    cellWidthMm,
    cellHeightMm,
    dotSpacingMm,
    cellPitchMm,
    lineSpacingMm,
    dotRadiusMm,
  } = BRAILLE_SPECS_MM;

  const tokenizedLines = safeLines.map((line) => ({
    cells: Array.from(line.braille),
    guide: line.guide,
  }));

  const maxCols = Math.max(
    1,
    ...tokenizedLines.map((l) => l.cells.length)
  );
  const rowCount = tokenizedLines.length;

  const widthMm = Number(
    ((maxCols - 1) * cellPitchMm + cellWidthMm).toFixed(2)
  );
  const hasAnyGuide =
    showGuide && tokenizedLines.some((l) => Boolean(l.guide && l.guide.trim()));
  const extraBottomMm = hasAnyGuide ? 2.9 : 0;
  const heightMm = Number(
    ((rowCount - 1) * lineSpacingMm + cellHeightMm + extraBottomMm).toFixed(2)
  );

  // Posiciones relativas de los 6 puntos dentro de la celda (centro a centro = 2,5 mm)
  const dotOffsets: ReadonlyArray<readonly [number, number]> = [
    [dotRadiusMm, dotRadiusMm], // Punto 1 (sup-izq)
    [dotRadiusMm, dotRadiusMm + dotSpacingMm], // Punto 2 (med-izq)
    [dotRadiusMm, dotRadiusMm + dotSpacingMm * 2], // Punto 3 (inf-izq)
    [dotRadiusMm + dotSpacingMm, dotRadiusMm], // Punto 4 (sup-der)
    [dotRadiusMm + dotSpacingMm, dotRadiusMm + dotSpacingMm], // Punto 5 (med-der)
    [dotRadiusMm + dotSpacingMm, dotRadiusMm + dotSpacingMm * 2], // Punto 6 (inf-der)
  ];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={`${widthMm}mm`}
      height={`${heightMm}mm`}
      viewBox={`0 0 ${widthMm} ${heightMm}`}
      role="img"
      aria-label={
        ariaLabel ||
        safeLines
          .map((l) => l.guide || l.braille)
          .join(' ')
          .trim()
      }
      className={className}
      style={{
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        minWidth: `${widthMm}mm`,
        maxWidth: 'none',
        display: 'block',
      }}
    >
      {tokenizedLines.map((line, rowIdx) => {
        const y0 = rowIdx * lineSpacingMm;
        return (
          <g key={`row-${rowIdx}`}>
            {line.cells.map((ch, colIdx) => {
              const x0 = colIdx * cellPitchMm;
              const dots = brailleCharToDots(ch);
              return (
                <g key={`cell-${rowIdx}-${colIdx}`}>
                  {dots.map((active, dotIdx) => {
                    const [dx, dy] = dotOffsets[dotIdx];
                    const cx = Number((x0 + dx).toFixed(3));
                    const cy = Number((y0 + dy).toFixed(3));
                    if (active) {
                      return (
                        <circle
                          key={`dot-${dotIdx}`}
                          cx={cx}
                          cy={cy}
                          r={dotRadiusMm}
                          fill="#000000"
                        />
                      );
                    }
                    if (showEmptyDots) {
                      return (
                        <circle
                          key={`dot-empty-${dotIdx}`}
                          cx={cx}
                          cy={cy}
                          r={0.22}
                          fill="#cbd5e1"
                        />
                      );
                    }
                    return null;
                  })}
                </g>
              );
            })}

            {hasAnyGuide && line.guide && (
              <text
                x={0}
                y={Number((y0 + cellHeightMm + 2.45).toFixed(2))}
                fontSize={2.1}
                fill="#475569"
                fontFamily="Verdana, Helvetica, Arial, sans-serif"
              >
                {line.guide}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
