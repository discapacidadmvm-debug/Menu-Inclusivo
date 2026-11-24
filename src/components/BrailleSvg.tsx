import React from 'react';
import {
  BRAILLE_GEOMETRY_PRESETS,
  BrailleMatrixGeometry,
  brailleCharToDots,
} from '../utils/braille.ts';

export interface BrailleSvgLine {
  braille: string;
  guide?: string;
}

interface BrailleSvgProps {
  lines: BrailleSvgLine[];
  geometry?: BrailleMatrixGeometry;
  offsetXMm?: number;
  offsetYMm?: number;
  showGuide?: boolean;
  showEmptyDots?: boolean;
  fixedCols?: number;
  ariaLabel?: string;
  className?: string;
}

/**
 * Renderizador vectorial Braille a escala física exacta (1:1 en milímetros, sin píxeles).
 * Todas las coordenadas, radios, pasos y traslaciones se expresan en mm reales.
 */
export const BrailleSvg: React.FC<BrailleSvgProps> = ({
  lines,
  geometry = BRAILLE_GEOMETRY_PRESETS.slate_portrait,
  offsetXMm = 0,
  offsetYMm = 0,
  showGuide = false,
  showEmptyDots = false,
  fixedCols,
  ariaLabel,
  className = '',
}) => {
  const safeLines = lines.length > 0 ? lines : [{ braille: '⠀' }];
  const {
    cellWidthMm,
    cellHeightMm,
    dotSpacingMm,
    dotRadiusMm,
    stepXMm,
    stepYMm,
    rotated90,
  } = geometry;

  const tokenizedLines = safeLines.map((line) => ({
    cells: Array.from(line.braille),
    guide: line.guide,
  }));

  const maxLineCols = Math.max(
    1,
    ...tokenizedLines.map((l) => l.cells.length)
  );
  const maxCols = fixedCols ? Math.max(fixedCols, maxLineCols) : maxLineCols;
  const rowCount = tokenizedLines.length;

  const widthMm = Number(
    ((maxCols - 1) * stepXMm + cellWidthMm).toFixed(2)
  );
  const hasAnyGuide =
    showGuide && tokenizedLines.some((l) => Boolean(l.guide && l.guide.trim()));
  const extraBottomMm = hasAnyGuide ? (rotated90 ? 2.1 : 2.9) : 0;
  const heightMm = Number(
    ((rowCount - 1) * stepYMm + cellHeightMm + extraBottomMm).toFixed(2)
  );

  // Posiciones relativas de los 6 puntos dentro de la celda (distancia centro a centro = 2,5 mm)
  const dotOffsets: ReadonlyArray<readonly [number, number]> = rotated90
    ? [
        [dotRadiusMm + dotSpacingMm * 2, dotRadiusMm], // Punto 1
        [dotRadiusMm + dotSpacingMm, dotRadiusMm], // Punto 2
        [dotRadiusMm, dotRadiusMm], // Punto 3
        [dotRadiusMm + dotSpacingMm * 2, dotRadiusMm + dotSpacingMm], // Punto 4
        [dotRadiusMm + dotSpacingMm, dotRadiusMm + dotSpacingMm], // Punto 5
        [dotRadiusMm, dotRadiusMm + dotSpacingMm], // Punto 6
      ]
    : [
        [dotRadiusMm, dotRadiusMm], // Punto 1 (sup-izq)
        [dotRadiusMm, dotRadiusMm + dotSpacingMm], // Punto 2 (med-izq)
        [dotRadiusMm, dotRadiusMm + dotSpacingMm * 2], // Punto 3 (inf-izq)
        [dotRadiusMm + dotSpacingMm, dotRadiusMm], // Punto 4 (sup-der)
        [dotRadiusMm + dotSpacingMm, dotRadiusMm + dotSpacingMm], // Punto 5 (med-der)
        [dotRadiusMm + dotSpacingMm, dotRadiusMm + dotSpacingMm * 2], // Punto 6 (inf-der)
      ];

  const guideFontSizeMm = rotated90 ? 1.65 : 2.1;
  const guideOffsetFromCellBottomMm = rotated90 ? 1.75 : 2.45;
  const hasMatrixShift = offsetXMm !== 0 || offsetYMm !== 0;

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
        overflow: 'visible',
        transform: hasMatrixShift
          ? `translate(${offsetXMm}mm, ${offsetYMm}mm)`
          : undefined,
      }}
    >
      {tokenizedLines.map((line, rowIdx) => {
        const y0 = Number((rowIdx * stepYMm).toFixed(3));
        return (
          <g key={`row-${rowIdx}`}>
            {line.cells.map((ch, colIdx) => {
              const x0 = Number((colIdx * stepXMm).toFixed(3));
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
                          r={0.28}
                          fill="#94a3b8"
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
                y={Number(
                  (y0 + cellHeightMm + guideOffsetFromCellBottomMm).toFixed(2)
                )}
                fontSize={guideFontSizeMm}
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
