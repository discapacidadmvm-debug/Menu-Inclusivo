import React, { useEffect, useMemo, useState } from 'react';
import {
  Printer,
  Download,
  Eye,
  UtensilsCrossed,
  Grid,
  Ruler,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { CategoriaPlato, ComercioPublico, PlatoMenu } from '../types.ts';
import { formatArs, formatFechaAr } from '../utils/dates.ts';
import {
  BRAILLE_GEOMETRY_PRESETS,
  BRAILLE_SPECS_MM,
  BrailleOrientationMode,
  buildBraillePlainTextExport,
  buildMenuBrailleLines,
  formatDishPriceBraille,
  wrapBrailleLineWithPlain,
} from '../utils/braille.ts';
import { SinTaccLogo } from './SinTaccLogo.tsx';
import { QrCodeBlock } from './QrCodeBlock.tsx';
import { DishQrMini } from './DishQrMini.tsx';
import { BrailleSvg, BrailleSvgLine } from './BrailleSvg.tsx';

interface A4PrintSuiteProps {
  comercio: ComercioPublico;
  platos: PlatoMenu[];
  publicMenuUrl: string;
}

type PrintMode = 'pictogramas' | 'braille' | 'oblea_qr';

interface BrailleCalibrationState {
  orientation: BrailleOrientationMode;
  offsetXMm: number;
  offsetYMm: number;
  showEmptyDots: boolean;
  showVerificationRuler: boolean;
}

const CALIBRATION_STORAGE_KEY = 'carta_braille_calibration_v1';

const DEFAULT_CALIBRATION: BrailleCalibrationState = {
  orientation: 'slate_portrait',
  offsetXMm: 0,
  offsetYMm: 0,
  showEmptyDots: true,
  showVerificationRuler: false,
};

const CATEGORIA_ORDER: Record<CategoriaPlato, number> = {
  Desayunos: 1,
  Meriendas: 2,
  'Desayunos y Meriendas': 3,
  'Cafetería y Panadería': 4,
  Entradas: 5,
  'Platos Principales': 6,
  Minutas: 7,
  Parrilla: 8,
  Pastas: 9,
  'Pizzas y Empanadas': 10,
  'Sándwiches y Hamburguesas': 11,
  Ensaladas: 12,
  Guarniciones: 13,
  Heladería: 14,
  Postres: 15,
  Bebidas: 16,
  'Menú Infantil': 17,
  Promociones: 18,
};

function chunkArray<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

function loadCalibration(): BrailleCalibrationState {
  if (typeof window === 'undefined') return DEFAULT_CALIBRATION;
  try {
    const raw = window.localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (!raw) return DEFAULT_CALIBRATION;
    const parsed = JSON.parse(raw);
    return {
      orientation:
        parsed.orientation === 'slate_rotated_90'
          ? 'slate_rotated_90'
          : 'slate_portrait',
      offsetXMm:
        typeof parsed.offsetXMm === 'number' && Number.isFinite(parsed.offsetXMm)
          ? Math.max(-30, Math.min(30, Number(parsed.offsetXMm.toFixed(1))))
          : 0,
      offsetYMm:
        typeof parsed.offsetYMm === 'number' && Number.isFinite(parsed.offsetYMm)
          ? Math.max(-30, Math.min(30, Number(parsed.offsetYMm.toFixed(1))))
          : 0,
      showEmptyDots:
        typeof parsed.showEmptyDots === 'boolean' ? parsed.showEmptyDots : true,
      showVerificationRuler:
        typeof parsed.showVerificationRuler === 'boolean'
          ? parsed.showVerificationRuler
          : false,
    };
  } catch {
    return DEFAULT_CALIBRATION;
  }
}

const VerificationRulerMm: React.FC = () => {
  const totalMm = 100;
  const ticks = Array.from({ length: totalMm + 1 }, (_, mm) => mm);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="104mm"
      height="7mm"
      viewBox="-2 0 104 7"
      aria-label="Regla de verificación física de 100 mm"
      style={{
        width: '104mm',
        height: '7mm',
        maxWidth: 'none',
        display: 'block',
      }}
    >
      <line x1={0} y1={0.3} x2={totalMm} y2={0.3} stroke="#0f172a" strokeWidth={0.25} />
      {ticks.map((mm) => {
        const isCm = mm % 10 === 0;
        const isHalf = mm % 5 === 0 && !isCm;
        const tickLen = isCm ? 3.2 : isHalf ? 2.2 : 1.3;
        return (
          <g key={mm}>
            <line
              x1={mm}
              y1={0.3}
              x2={mm}
              y2={0.3 + tickLen}
              stroke="#0f172a"
              strokeWidth={isCm ? 0.3 : 0.18}
            />
            {isCm && (
              <text
                x={mm}
                y={6.2}
                textAnchor="middle"
                fontSize={2.3}
                fontWeight="bold"
                fill="#0f172a"
                fontFamily="Verdana, Helvetica, Arial, sans-serif"
              >
                {mm / 10}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const A4PrintSuite: React.FC<A4PrintSuiteProps> = ({
  comercio,
  platos,
  publicMenuUrl,
}) => {
  const [mode, setMode] = useState<PrintMode>('pictogramas');
  const [brailleConGuia, setBrailleConGuia] = useState(true);
  const [calibration, setCalibration] = useState<BrailleCalibrationState>(
    loadCalibration
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CALIBRATION_STORAGE_KEY,
        JSON.stringify(calibration)
      );
    } catch {
      // ignore storage errors
    }
  }, [calibration]);

  const geometry = BRAILLE_GEOMETRY_PRESETS[calibration.orientation];

  const platosActivosOrdenados = useMemo(() => {
    return platos
      .filter((p) => p.disponible)
      .slice()
      .sort((a, b) => {
        const catDiff =
          (CATEGORIA_ORDER[a.categoria] ?? 99) -
          (CATEGORIA_ORDER[b.categoria] ?? 99);
        if (catDiff !== 0) return catDiff;
        return (a.orden ?? 0) - (b.orden ?? 0);
      });
  }, [platos]);

  // Estrictamente 3 menúes por hoja A4
  const platosPages = useMemo(
    () => chunkArray(platosActivosOrdenados, 3),
    [platosActivosOrdenados]
  );

  // Columnas máximas según ancho imprimible y paso horizontal real de tableta
  const maxColsCard = geometry.rotated90 ? 16 : 26; // 156,5 mm o 161,5 mm <= 167 mm disponibles
  const maxRowsCard = geometry.rotated90 ? 4 : 3;

  const maxColsFullSheet = geometry.rotated90 ? 18 : 28; // 176,5 mm o 174,1 mm <= 194 mm
  const maxRowsFullSheet = geometry.rotated90 ? 37 : 25;

  // Líneas Braille completas para Modo 2 (Carta A4 en Braille)
  const brailleSheetPages = useMemo(() => {
    const rawLines = buildMenuBrailleLines(comercio, platosActivosOrdenados);
    const wrappedRows: BrailleSvgLine[] = [];

    for (const line of rawLines) {
      if (line.kind === 'separator') {
        wrappedRows.push({
          braille: '⠒'.repeat(maxColsFullSheet),
          guide: '',
        });
        continue;
      }
      const chunks = wrapBrailleLineWithPlain(
        line.plain,
        maxColsFullSheet,
        line.braille
      );
      for (const ch of chunks) {
        wrappedRows.push({
          braille: ch.braille,
          guide: ch.plain,
        });
      }
    }

    return chunkArray(wrappedRows, maxRowsFullSheet);
  }, [comercio, platosActivosOrdenados, maxColsFullSheet, maxRowsFullSheet]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadBraille = () => {
    const content = buildBraillePlainTextExport(
      comercio,
      platosActivosOrdenados,
      brailleConGuia
    );
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carta-braille-${comercio.slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const adjustOffset = (axis: 'offsetXMm' | 'offsetYMm', delta: number) => {
    setCalibration((prev) => ({
      ...prev,
      [axis]: Math.max(
        -30,
        Math.min(30, Number((prev[axis] + delta).toFixed(1)))
      ),
    }));
  };

  // Paso vertical entre tarjetas = múltiplo entero exacto del paso vertical de la tableta
  // Estándar (stepY=10,0 mm): 9 filas = 90,0 mm (tarjeta 87,5 mm + espacio 2,5 mm)
  // Girada 90° (stepY=6,3 mm): 14 filas = 88,2 mm (tarjeta 85,7 mm + espacio 2,5 mm)
  const cardHeightMm = geometry.rotated90 ? 85.7 : 87.5;
  const cardGapMm = 2.5;

  return (
    <div className="space-y-4">
      {/* Barra superior de selección de formato e impresión */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('pictogramas')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'pictogramas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Carta A4 (3 menúes/hoja)
          </button>
          <button
            type="button"
            onClick={() => setMode('braille')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'braille'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Carta A4 en Braille
          </button>
          <button
            type="button"
            onClick={() => setMode('oblea_qr')}
            className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              mode === 'oblea_qr'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Oblea Municipal y QR de Mesa
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode !== 'oblea_qr' && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCalibration((p) => ({
                    ...p,
                    showEmptyDots: !p.showEmptyDots,
                  }))
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Grid className="w-3.5 h-3.5" />
                {calibration.showEmptyDots
                  ? 'Ocultar 6 puntos guía'
                  : 'Ver 6 puntos guía'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setCalibration((p) => ({
                    ...p,
                    showVerificationRuler: !p.showVerificationRuler,
                  }))
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Ruler className="w-3.5 h-3.5" />
                {calibration.showVerificationRuler
                  ? 'Ocultar regla 100 mm'
                  : 'Regla control 100 mm'}
              </button>
            </>
          )}

          {mode === 'braille' && (
            <>
              <button
                type="button"
                onClick={() => setBrailleConGuia((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5" />
                {brailleConGuia ? 'Ocultar texto guía' : 'Mostrar texto guía'}
              </button>
              <button
                type="button"
                onClick={handleDownloadBraille}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar .TXT Braille
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir formato A4 (100%)
          </button>
        </div>
      </div>

      {/* Panel de calibración física de matriz Braille (mm exactos, sin píxeles) */}
      {mode !== 'oblea_qr' && (
        <div className="no-print bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <SlidersHorizontal className="w-4 h-4 text-blue-700" />
              Calibración física con tableta Braille (100% en milímetros)
            </div>
            <button
              type="button"
              onClick={() => setCalibration(DEFAULT_CALIBRATION)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer valores
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-6 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Orientación de celdas y pasos de la tableta
              </label>
              <select
                value={calibration.orientation}
                onChange={(e) =>
                  setCalibration((prev) => ({
                    ...prev,
                    orientation: e.target.value as BrailleOrientationMode,
                  }))
                }
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              >
                <option value="slate_portrait">
                  {BRAILLE_GEOMETRY_PRESETS.slate_portrait.label}
                </option>
                <option value="slate_rotated_90">
                  {BRAILLE_GEOMETRY_PRESETS.slate_rotated_90.label}
                </option>
              </select>
            </div>

            {/* Ajuste horizontal X independiente */}
            <div className="lg:col-span-3 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Desplazamiento horizontal X (mm)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustOffset('offsetXMm', -0.5)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 cursor-pointer"
                >
                  -0,5
                </button>
                <input
                  type="number"
                  step="0.1"
                  min="-30"
                  max="30"
                  value={calibration.offsetXMm}
                  onChange={(e) =>
                    setCalibration((prev) => ({
                      ...prev,
                      offsetXMm: Math.max(
                        -30,
                        Math.min(30, Number(e.target.value) || 0)
                      ),
                    }))
                  }
                  className="w-full px-2 py-1.5 text-xs font-mono-tabular text-center border border-slate-300 rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => adjustOffset('offsetXMm', 0.5)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 cursor-pointer"
                >
                  +0,5
                </button>
              </div>
            </div>

            {/* Ajuste vertical Y independiente */}
            <div className="lg:col-span-3 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Desplazamiento vertical Y (mm)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustOffset('offsetYMm', -0.5)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 cursor-pointer"
                >
                  -0,5
                </button>
                <input
                  type="number"
                  step="0.1"
                  min="-30"
                  max="30"
                  value={calibration.offsetYMm}
                  onChange={(e) =>
                    setCalibration((prev) => ({
                      ...prev,
                      offsetYMm: Math.max(
                        -30,
                        Math.min(30, Number(e.target.value) || 0)
                      ),
                    }))
                  }
                  className="w-full px-2 py-1.5 text-xs font-mono-tabular text-center border border-slate-300 rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => adjustOffset('offsetYMm', 0.5)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 cursor-pointer"
                >
                  +0,5
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Geometría activa de puntos:</strong> celda{' '}
              {geometry.cellWidthMm.toFixed(1).replace('.', ',')} ×{' '}
              {geometry.cellHeightMm.toFixed(1).replace('.', ',')} mm · centros
              de puntos {geometry.dotSpacingMm.toFixed(1).replace('.', ',')} mm
              · separación libre H{' '}
              {geometry.freeGapXMm.toFixed(1).replace('.', ',')} mm / V{' '}
              {geometry.freeGapYMm.toFixed(1).replace('.', ',')} mm · paso H{' '}
              {geometry.stepXMm.toFixed(1).replace('.', ',')} mm × V{' '}
              {geometry.stepYMm.toFixed(1).replace('.', ',')} mm.
            </span>
            <span className="font-semibold text-slate-800">
              Imprimir en Chrome/Edge con: Papel A4 · Márgenes: Ninguno · Escala:
              100%
            </span>
          </div>
        </div>
      )}

      {/* MODO 1: CARTA A4 CON PICTOGRAMAS (<= 15 mm) + MATRIZ BRAILLE ALINEADA A TABLETA + 3 MENÚES POR HOJA */}
      {mode === 'pictogramas' && (
        <div className="a4-scroll-wrap overflow-x-auto space-y-6">
          {platosPages.length === 0 ? (
            <section
              className="a4-sheet-page mx-auto bg-white border border-slate-300 rounded-lg text-black flex flex-col justify-center items-center"
              style={{
                width: '210mm',
                minHeight: '296.5mm',
                padding: '7mm 8mm 6mm 8mm',
                boxSizing: 'border-box',
              }}
            >
              <p style={{ fontSize: '12pt' }}>
                No hay platos activos cargados para imprimir.
              </p>
            </section>
          ) : (
            platosPages.map((pageItems, pageIdx) => {
              const isLastPage = pageIdx === platosPages.length - 1;
              return (
                <section
                  key={`a4-picto-page-${pageIdx}`}
                  className={`a4-sheet-page mx-auto bg-white border border-slate-300 text-black flex flex-col ${
                    !isLastPage ? 'a4-page-break-after' : ''
                  }`}
                  style={{
                    width: '210mm',
                    height: '296.5mm',
                    minHeight: '296.5mm',
                    padding: '5.5mm 8mm 4.5mm 8mm',
                    boxSizing: 'border-box',
                    fontFamily: 'Verdana, Helvetica, Arial, sans-serif',
                  }}
                >
                  {/* Encabezado compacto fijo (9 mm + 1,5 mm margen = 10,5 mm) */}
                  <header
                    className="border-b-2 border-black flex items-end justify-between shrink-0"
                    style={{
                      height: '9mm',
                      paddingBottom: '1.2mm',
                      marginBottom: '1.5mm',
                      gap: '4mm',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div className="min-w-0">
                      <p
                        className="font-bold uppercase tracking-wider text-slate-700 leading-none"
                        style={{ fontSize: '7pt' }}
                      >
                        Carta Inclusiva — Municipalidad de Vicuña Mackenna
                      </p>
                      <h1
                        className="font-bold text-black leading-tight truncate"
                        style={{ fontSize: '12pt', marginTop: '0.6mm' }}
                      >
                        {comercio.nombre}{' '}
                        <span
                          className="font-normal text-slate-700"
                          style={{ fontSize: '8.5pt' }}
                        >
                          · {comercio.rubro} · {comercio.direccion}
                        </span>
                      </h1>
                    </div>
                    <div className="text-right shrink-0 leading-tight">
                      <p
                        className="font-bold text-black"
                        style={{ fontSize: '7.5pt' }}
                      >
                        Oblea Nº {comercio.obleaNumero} · ARS
                      </p>
                      <p
                        className="text-slate-700"
                        style={{ fontSize: '7pt' }}
                      >
                        Hoja {pageIdx + 1} de {platosPages.length}
                      </p>
                    </div>
                  </header>

                  {/* Contenedor de 3 menúes con paso vertical exacto (múltiplo entero de stepYMm) */}
                  <div
                    className="flex flex-col shrink-0"
                    style={{ gap: `${cardGapMm}mm` }}
                  >
                    {pageItems.map((plato) => {
                      const brPlain = formatDishPriceBraille(
                        plato.nombre,
                        plato.precioArs,
                        plato.libreDeTacc
                      ).plain;
                      const wrappedBraille = wrapBrailleLineWithPlain(
                        brPlain,
                        maxColsCard
                      ).slice(0, maxRowsCard);

                      return (
                        <article
                          key={plato.id}
                          className="a4-avoid-break bg-white flex flex-col shrink-0"
                          style={{
                            height: `${cardHeightMm}mm`,
                            border: '0.35mm solid #000000',
                            borderRadius: '1.2mm',
                            padding: '2.2mm 3mm',
                            boxSizing: 'border-box',
                          }}
                        >
                          {/* Bloque superior de altura fija (45,8 mm) para bloquear la matriz Braille en la grilla vertical */}
                          <div
                            className="shrink-0 overflow-hidden"
                            style={{ height: '45.8mm' }}
                          >
                            {/* Foto real + Título + Precio + Sin TACC + Descripción */}
                            <div
                              className="flex items-start"
                              style={{ height: '22mm', gap: '3mm' }}
                            >
                              <div
                                className="shrink-0 border border-slate-400 overflow-hidden bg-slate-50 flex items-center justify-center"
                                style={{
                                  width: '32mm',
                                  height: '22mm',
                                  borderRadius: '1mm',
                                }}
                              >
                                {plato.fotoUrl ? (
                                  <img
                                    src={plato.fotoUrl}
                                    alt={plato.nombre}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div
                                    className="flex flex-col items-center justify-center text-slate-600 text-center"
                                    style={{ padding: '1mm' }}
                                  >
                                    <UtensilsCrossed
                                      style={{ width: '5mm', height: '5mm' }}
                                    />
                                    <span
                                      className="font-semibold leading-tight"
                                      style={{
                                        fontSize: '6.5pt',
                                        marginTop: '0.5mm',
                                      }}
                                    >
                                      {plato.nombre}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div
                                  className="flex items-center justify-between"
                                  style={{ gap: '2mm' }}
                                >
                                  <span
                                    className="font-bold uppercase tracking-wide text-slate-700"
                                    style={{ fontSize: '6.8pt' }}
                                  >
                                    {plato.categoria}
                                  </span>
                                  {plato.libreDeTacc && (
                                    <SinTaccLogo size="sm" highContrast />
                                  )}
                                </div>

                                <div
                                  className="flex items-baseline justify-between"
                                  style={{ gap: '2mm', marginTop: '0.5mm' }}
                                >
                                  <h2
                                    className="font-bold text-black leading-tight truncate"
                                    style={{ fontSize: '11.5pt' }}
                                  >
                                    {plato.nombre}
                                  </h2>
                                  <span
                                    className="font-bold font-mono-tabular text-black shrink-0 leading-tight"
                                    style={{ fontSize: '12pt' }}
                                  >
                                    {formatArs(plato.precioArs)}
                                  </span>
                                </div>

                                {plato.descripcion && (
                                  <p
                                    className="text-black leading-snug line-clamp-2"
                                    style={{
                                      fontSize: '8.2pt',
                                      marginTop: '0.6mm',
                                    }}
                                  >
                                    {plato.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Pictogramas (tamaño máximo de alto 15 mm) */}
                            {plato.pictogramas.length > 0 && (
                              <div
                                className="flex flex-wrap items-start overflow-hidden"
                                style={{
                                  gap: '1.5mm',
                                  marginTop: '1.8mm',
                                  maxHeight: '21.5mm',
                                }}
                              >
                                {plato.pictogramas.map((pg, idx) => (
                                  <div
                                    key={`${pg.id}-${idx}`}
                                    className="border border-black text-center bg-white flex flex-col items-center justify-between"
                                    style={{
                                      width: '17.5mm',
                                      padding: '0.8mm',
                                      borderRadius: '0.8mm',
                                      boxSizing: 'border-box',
                                    }}
                                  >
                                    <img
                                      src={pg.imageUrl}
                                      alt={pg.label}
                                      referrerPolicy="no-referrer"
                                      className="picto-img-15mm mx-auto"
                                      style={{
                                        maxHeight: `${BRAILLE_SPECS_MM.pictogramMaxHeightMm}mm`,
                                        maxWidth: '15mm',
                                        height: '13.5mm',
                                        width: 'auto',
                                        objectFit: 'contain',
                                      }}
                                    />
                                    <span
                                      className="block w-full font-bold text-black leading-none truncate"
                                      style={{
                                        fontSize: '6.5pt',
                                        marginTop: '0.7mm',
                                      }}
                                    >
                                      {pg.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Banda inferior fija: Matriz Braille exacta (en mm) + QR individual (en mm) */}
                          <div
                            className="flex items-start justify-between flex-1"
                            style={{
                              borderTop: '0.25mm solid #94a3b8',
                              paddingTop: '1mm',
                              gap: '3mm',
                              overflow: 'visible',
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className="font-bold uppercase tracking-wide text-slate-700 leading-none"
                                style={{
                                  fontSize: '6.3pt',
                                  height: '2.5mm',
                                  marginBottom: '0.5mm',
                                }}
                              >
                                Braille ({geometry.cellWidthMm.toFixed(1).replace('.', ',')}×
                                {geometry.cellHeightMm.toFixed(1).replace('.', ',')} mm · puntos{' '}
                                {geometry.dotSpacingMm.toFixed(1).replace('.', ',')} mm · paso H{' '}
                                {geometry.stepXMm.toFixed(1).replace('.', ',')} mm × V{' '}
                                {geometry.stepYMm.toFixed(1).replace('.', ',')} mm)
                              </p>
                              <BrailleSvg
                                lines={wrappedBraille.map((row) => ({
                                  braille: row.braille,
                                  guide: row.plain,
                                }))}
                                geometry={geometry}
                                offsetXMm={calibration.offsetXMm}
                                offsetYMm={calibration.offsetYMm}
                                showGuide={false}
                                showEmptyDots={calibration.showEmptyDots}
                                ariaLabel={brPlain}
                              />
                            </div>

                            <div className="shrink-0 text-center">
                              <DishQrMini
                                slug={comercio.slug}
                                platoId={plato.id}
                                platoNombre={plato.nombre}
                                sizeMm={14}
                                showActions={false}
                              />
                              <span
                                className="block font-bold text-black leading-none"
                                style={{ fontSize: '6.5pt', marginTop: '0.7mm' }}
                              >
                                QR Audio
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Pie de hoja + regla opcional de verificación física 100 mm */}
                  <footer
                    className="border-t border-black flex items-center justify-between text-black shrink-0 mt-auto"
                    style={{
                      paddingTop: '1mm',
                      fontSize: '7pt',
                      gap: '3mm',
                    }}
                  >
                    {calibration.showVerificationRuler ? (
                      <div className="flex items-center" style={{ gap: '3mm' }}>
                        <VerificationRulerMm />
                        <span style={{ fontSize: '6.5pt' }}>
                          Control escala 100 mm (10 cm)
                        </span>
                      </div>
                    ) : (
                      <span>
                        Ordenanza Municipal &ldquo;Carta o Menú Inclusivo&rdquo;
                        — Vicuña Mackenna
                      </span>
                    )}
                    <span className="shrink-0">
                      Vigencia: {formatFechaAr(comercio.vigencia.fechaCaducidad)}{' '}
                      · Hoja {pageIdx + 1}/{platosPages.length}
                    </span>
                  </footer>
                </section>
              );
            })
          )}
        </div>
      )}

      {/* MODO 2: CARTA A4 EN SISTEMA BRAILLE (MATRIZ COMPLETA EN MM EXACTO) */}
      {mode === 'braille' && (
        <div className="a4-scroll-wrap overflow-x-auto space-y-6">
          {brailleSheetPages.map((pageRows, pageIdx) => {
            const isLastPage = pageIdx === brailleSheetPages.length - 1;
            return (
              <section
                key={`a4-braille-page-${pageIdx}`}
                className={`a4-sheet-page mx-auto bg-white border border-slate-300 text-black flex flex-col ${
                  !isLastPage ? 'a4-page-break-after' : ''
                }`}
                style={{
                  width: '210mm',
                  height: '296.5mm',
                  minHeight: '296.5mm',
                  padding: '8mm',
                  boxSizing: 'border-box',
                  fontFamily: 'Verdana, Helvetica, Arial, sans-serif',
                }}
              >
                <div
                  className="border-b-2 border-black flex items-end justify-between shrink-0"
                  style={{
                    paddingBottom: '2mm',
                    marginBottom: '4mm',
                    gap: '4mm',
                  }}
                >
                  <div>
                    <h1
                      className="font-bold text-black leading-tight"
                      style={{ fontSize: '11.5pt' }}
                    >
                      {comercio.nombre} — Carta en Sistema Braille (Formato A4)
                    </h1>
                    <p
                      className="text-slate-700"
                      style={{ fontSize: '7.5pt', marginTop: '0.6mm' }}
                    >
                      Celda {geometry.cellWidthMm.toFixed(1).replace('.', ',')} ×{' '}
                      {geometry.cellHeightMm.toFixed(1).replace('.', ',')} mm ·
                      Puntos{' '}
                      {geometry.dotSpacingMm.toFixed(1).replace('.', ',')} mm ·
                      Paso H {geometry.stepXMm.toFixed(1).replace('.', ',')} mm ×
                      V {geometry.stepYMm.toFixed(1).replace('.', ',')} mm (escala
                      100%).
                    </p>
                  </div>
                  <span
                    className="font-bold text-black shrink-0"
                    style={{ fontSize: '8pt' }}
                  >
                    Hoja {pageIdx + 1} de {brailleSheetPages.length}
                  </span>
                </div>

                <div className="flex-1" style={{ overflow: 'visible' }}>
                  <BrailleSvg
                    lines={pageRows}
                    geometry={geometry}
                    offsetXMm={calibration.offsetXMm}
                    offsetYMm={calibration.offsetYMm}
                    showGuide={brailleConGuia}
                    showEmptyDots={calibration.showEmptyDots}
                    fixedCols={maxColsFullSheet}
                    ariaLabel={`${comercio.nombre} Carta Braille Hoja ${
                      pageIdx + 1
                    }`}
                  />
                </div>

                {calibration.showVerificationRuler && (
                  <footer
                    className="border-t border-black flex items-center justify-between shrink-0 mt-auto"
                    style={{ paddingTop: '1.5mm', fontSize: '7pt' }}
                  >
                    <VerificationRulerMm />
                    <span>
                      Desplazamiento matriz: X={calibration.offsetXMm} mm · Y=
                      {calibration.offsetYMm} mm
                    </span>
                  </footer>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* MODO 3: OBLEA MUNICIPAL Y TARJETA QR DE MESA A4 */}
      {mode === 'oblea_qr' && (
        <section
          className="a4-sheet mx-auto bg-white border border-slate-300 rounded-lg text-black"
          style={{
            width: '210mm',
            minHeight: '296.5mm',
            padding: '10mm',
            boxSizing: 'border-box',
          }}
        >
          {/* Oblea Principal */}
          <div className="border-4 border-slate-900 rounded-2xl p-8 text-center space-y-5">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-800">
              Municipalidad de Vicuña Mackenna · Secretaría de Desarrollo Social
            </p>
            <h1 className="text-3xl font-extrabold text-slate-950">
              ESTABLECIMIENTO GASTRONÓMICO INCLUSIVO
            </h1>
            <p className="text-base text-slate-800 max-w-lg mx-auto">
              Este comercio cuenta con Carta y Menú Accesible con Pictogramas
              ARASAAC, Sistema Braille y Menú Digital con lectura en voz
              multilingüe (Ordenanza Municipal &ldquo;Carta o Menú
              Inclusivo&rdquo;).
            </p>

            <div className="py-2">
              <p className="text-2xl font-bold text-slate-900">
                {comercio.nombre}
              </p>
              <p className="text-sm text-slate-700">
                {comercio.rubro} · {comercio.direccion}
              </p>
            </div>

            <div className="flex justify-center py-2">
              <QrCodeBlock
                url={publicMenuUrl}
                comercioNombre={comercio.nombre}
                obleaNumero={comercio.obleaNumero}
                size={240}
                showActions={false}
              />
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-slate-900">
                Escaneá el código QR para ver y escuchar la carta en tu idioma
              </p>
              <p className="text-xs text-slate-600 font-mono-tabular break-all">
                {publicMenuUrl}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-300 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700">
              <span>
                Habilitado el: {formatFechaAr(comercio.fechaHabilitacion)}
              </span>
              <span>Oblea Nº {comercio.obleaNumero}</span>
              <span>
                Caducidad anual:{' '}
                {formatFechaAr(comercio.vigencia.fechaCaducidad)}
              </span>
            </div>
          </div>

          {/* 2 Tarjetas recortables de mesa debajo */}
          <div className="mt-8 grid grid-cols-2 gap-6 a4-avoid-break">
            {[1, 2].map((num) => (
              <div
                key={num}
                className="border-2 border-dashed border-slate-400 rounded-xl p-4 flex items-center gap-4"
              >
                <QrCodeBlock
                  url={publicMenuUrl}
                  comercioNombre={comercio.nombre}
                  size={108}
                  showActions={false}
                />
                <div className="space-y-1 text-left">
                  <p className="text-xs font-bold uppercase text-blue-800">
                    Menú Digital con Voz
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {comercio.nombre}
                  </p>
                  <p className="text-xs text-slate-700">
                    Pictogramas · Sin TACC · Audio en varios idiomas
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
