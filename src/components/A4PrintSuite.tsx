import React, { useMemo, useState } from 'react';
import { Printer, Download, Eye, UtensilsCrossed, Grid } from 'lucide-react';
import { CategoriaPlato, ComercioPublico, PlatoMenu } from '../types.ts';
import { formatArs, formatFechaAr } from '../utils/dates.ts';
import {
  BRAILLE_SPECS_MM,
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

export const A4PrintSuite: React.FC<A4PrintSuiteProps> = ({
  comercio,
  platos,
  publicMenuUrl,
}) => {
  const [mode, setMode] = useState<PrintMode>('pictogramas');
  const [brailleConGuia, setBrailleConGuia] = useState(true);
  const [showEmptyDots, setShowEmptyDots] = useState(false);

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

  // Reacomodado estrictamente a 3 menúes por hoja A4
  const platosPages = useMemo(
    () => chunkArray(platosActivosOrdenados, 3),
    [platosActivosOrdenados]
  );

  // Líneas Braille completas para Modo 2 (30 celdas/renglón = 178 mm <= 194 mm imprimibles A4)
  const brailleSheetPages = useMemo(() => {
    const rawLines = buildMenuBrailleLines(comercio, platosActivosOrdenados);
    const wrappedRows: BrailleSvgLine[] = [];

    for (const line of rawLines) {
      if (line.kind === 'separator') {
        wrappedRows.push({
          braille: '⠒'.repeat(30),
          guide: '',
        });
        continue;
      }
      const chunks = wrapBrailleLineWithPlain(line.plain, 30, line.braille);
      for (const ch of chunks) {
        wrappedRows.push({
          braille: ch.braille,
          guide: ch.plain,
        });
      }
    }

    // 25 renglones por hoja A4 a 10,0 mm de interlineado = 249,4 mm <= 265 mm útiles
    return chunkArray(wrappedRows, 25);
  }, [comercio, platosActivosOrdenados]);

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

  return (
    <div className="space-y-5">
      {/* Barra de controles de impresión (oculta en impresión A4) */}
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

        <div className="flex flex-wrap items-center gap-2.5">
          {mode !== 'oblea_qr' && (
            <button
              type="button"
              onClick={() => setShowEmptyDots((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <Grid className="w-3.5 h-3.5" />
              {showEmptyDots ? 'Ocultar matriz vacía' : 'Ver 6 puntos guía'}
            </button>
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
            Imprimir formato A4
          </button>
        </div>
      </div>

      {/* Especificaciones técnicas de impresión calibradas en milímetros */}
      <div className="no-print bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Braille calibrado (1:1 mm):</strong> celda{' '}
          {BRAILLE_SPECS_MM.cellHeightMm.toFixed(1).replace('.', ',')} ×{' '}
          {BRAILLE_SPECS_MM.cellWidthMm.toFixed(1).replace('.', ',')} mm ·
          puntos{' '}
          {BRAILLE_SPECS_MM.dotSpacingMm.toFixed(1).replace('.', ',')} mm ·
          celdas contiguas{' '}
          {BRAILLE_SPECS_MM.cellPitchMm.toFixed(1).replace('.', ',')} mm ·
          interlineado{' '}
          {BRAILLE_SPECS_MM.lineSpacingMm.toFixed(1).replace('.', ',')} mm
        </span>
        <span>
          <strong>Pictogramas:</strong> máx.{' '}
          {BRAILLE_SPECS_MM.pictogramMaxHeightMm} mm de alto ·{' '}
          <strong>3 menúes por hoja A4</strong> (escala 100%, sin ajustar
          márgenes)
        </span>
      </div>

      {/* MODO 1: CARTA A4 CON PICTOGRAMAS (<= 15 mm) + BRAILLE EXACTO + 3 MENÚES POR HOJA A4 */}
      {mode === 'pictogramas' && (
        <div className="a4-scroll-wrap overflow-x-auto space-y-6">
          {platosPages.length === 0 ? (
            <section
              className="a4-sheet-page mx-auto bg-white border border-slate-300 rounded-lg text-black flex flex-col justify-center items-center"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '8mm',
                boxSizing: 'border-box',
              }}
            >
              <p className="text-base text-center">
                No hay platos activos cargados para imprimir.
              </p>
            </section>
          ) : (
            platosPages.map((pageItems, pageIdx) => {
              const isLastPage = pageIdx === platosPages.length - 1;
              return (
                <section
                  key={`a4-picto-page-${pageIdx}`}
                  className={`a4-sheet-page mx-auto bg-white border border-slate-300 rounded-lg text-black flex flex-col ${
                    !isLastPage ? 'a4-page-break-after' : ''
                  }`}
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '8mm',
                    boxSizing: 'border-box',
                    fontFamily: 'Verdana, Helvetica, Arial, sans-serif',
                  }}
                >
                  {/* Encabezado compacto de hoja A4 (~10 mm) */}
                  <header
                    className="border-b-2 border-black flex items-end justify-between gap-4 shrink-0"
                    style={{ paddingBottom: '1.8mm', marginBottom: '2.5mm' }}
                  >
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-700 leading-none">
                        Carta Inclusiva — Municipalidad de Vicuña Mackenna
                      </p>
                      <h1 className="text-[16px] font-bold text-black leading-tight mt-0.5 truncate">
                        {comercio.nombre}{' '}
                        <span className="text-[11px] font-normal text-slate-700">
                          · {comercio.rubro} · {comercio.direccion}
                        </span>
                      </h1>
                    </div>
                    <div className="text-right shrink-0 leading-tight">
                      <p className="text-[10px] font-bold text-black">
                        Oblea Nº {comercio.obleaNumero} · ARS
                      </p>
                      <p className="text-[9.5px] text-slate-700">
                        Hoja {pageIdx + 1} de {platosPages.length}
                      </p>
                    </div>
                  </header>

                  {/* Contenedor de hasta 3 menúes por hoja A4 */}
                  <div
                    className="flex flex-col flex-1"
                    style={{ gap: '2.5mm' }}
                  >
                    {pageItems.map((plato) => {
                      const brPlain = formatDishPriceBraille(
                        plato.nombre,
                        plato.precioArs,
                        plato.libreDeTacc
                      ).plain;
                      // 27 celdas * 6,0 mm - 2,0 mm = 160,0 mm <= 167 mm disponibles junto al QR
                      const wrappedBraille = wrapBrailleLineWithPlain(
                        brPlain,
                        27
                      ).slice(0, 3);

                      return (
                        <article
                          key={plato.id}
                          className="a4-avoid-break border border-black rounded bg-white flex flex-col justify-between"
                          style={{
                            padding: '2.4mm 3mm',
                            boxSizing: 'border-box',
                          }}
                        >
                          {/* Banda superior: Foto real + Título + Precio + Sin TACC + Descripción */}
                          <div
                            className="flex items-start"
                            style={{ gap: '3mm' }}
                          >
                            <div
                              className="shrink-0 rounded border border-slate-400 overflow-hidden bg-slate-50 flex items-center justify-center"
                              style={{ width: '32mm', height: '22mm' }}
                            >
                              {plato.fotoUrl ? (
                                <img
                                  src={plato.fotoUrl}
                                  alt={plato.nombre}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-600 p-1 text-center">
                                  <UtensilsCrossed className="w-5 h-5 mb-0.5" />
                                  <span className="text-[8.5px] font-semibold leading-tight">
                                    {plato.nombre}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-700">
                                  {plato.categoria}
                                </span>
                                {plato.libreDeTacc && (
                                  <SinTaccLogo size="sm" highContrast />
                                )}
                              </div>

                              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                                <h2
                                  className="font-bold text-black leading-tight truncate"
                                  style={{ fontSize: '15.5px' }}
                                >
                                  {plato.nombre}
                                </h2>
                                <span
                                  className="font-bold font-mono-tabular text-black shrink-0 leading-tight"
                                  style={{ fontSize: '16px' }}
                                >
                                  {formatArs(plato.precioArs)}
                                </span>
                              </div>

                              {plato.descripcion && (
                                <p
                                  className="text-black leading-snug mt-0.5 line-clamp-2"
                                  style={{ fontSize: '11px' }}
                                >
                                  {plato.descripcion}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Banda media: Pictogramas con tamaño máximo de alto 15 mm */}
                          {plato.pictogramas.length > 0 && (
                            <div
                              className="flex flex-wrap items-start"
                              style={{ gap: '1.5mm', marginTop: '1.8mm' }}
                            >
                              {plato.pictogramas.map((pg, idx) => (
                                <div
                                  key={`${pg.id}-${idx}`}
                                  className="border border-black rounded text-center bg-white flex flex-col items-center justify-between"
                                  style={{
                                    width: '17.5mm',
                                    padding: '0.8mm',
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <img
                                    src={pg.imageUrl}
                                    alt={pg.label}
                                    referrerPolicy="no-referrer"
                                    className="picto-img-15mm mx-auto"
                                    style={{
                                      maxHeight: '15mm',
                                      maxWidth: '15mm',
                                      height: '13.5mm',
                                      width: 'auto',
                                      objectFit: 'contain',
                                    }}
                                  />
                                  <span
                                    className="block w-full font-bold text-black leading-none truncate"
                                    style={{
                                      fontSize: '8.5px',
                                      marginTop: '0.7mm',
                                    }}
                                  >
                                    {pg.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Banda inferior: Braille exacto (6,5x4,0 mm / 2,5 mm / 6,0 mm / 10,0 mm) + QR */}
                          <div
                            className="border-t border-slate-400 flex items-center justify-between"
                            style={{
                              paddingTop: '1.5mm',
                              marginTop: '1.8mm',
                              gap: '3mm',
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[8.5px] font-bold uppercase tracking-wide text-slate-700 mb-1">
                                Braille (6,5×4,0 mm · puntos 2,5 mm · paso 6,0 mm
                                · interlineado 10,0 mm):
                              </p>
                              <BrailleSvg
                                lines={wrappedBraille.map((row) => ({
                                  braille: row.braille,
                                  guide: row.plain,
                                }))}
                                showGuide={false}
                                showEmptyDots={showEmptyDots}
                                ariaLabel={brPlain}
                              />
                            </div>

                            <div className="shrink-0 text-center">
                              <DishQrMini
                                slug={comercio.slug}
                                platoId={plato.id}
                                platoNombre={plato.nombre}
                                size={52}
                                showActions={false}
                              />
                              <span className="block text-[8.5px] font-bold text-black mt-0.5 leading-none">
                                QR Audio
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Pie de hoja compacto (~4 mm) */}
                  <footer
                    className="border-t border-black flex items-center justify-between text-[9.5px] text-black shrink-0"
                    style={{ paddingTop: '1.2mm', marginTop: '2mm' }}
                  >
                    <span>
                      Ordenanza Municipal &ldquo;Carta o Menú Inclusivo&rdquo; —
                      Vicuña Mackenna
                    </span>
                    <span>
                      Vigencia hasta:{' '}
                      {formatFechaAr(comercio.vigencia.fechaCaducidad)} · Hoja{' '}
                      {pageIdx + 1}/{platosPages.length}
                    </span>
                  </footer>
                </section>
              );
            })
          )}
        </div>
      )}

      {/* MODO 2: CARTA A4 EN SISTEMA BRAILLE (ESCALA FÍSICA 1:1 EN MILÍMETROS) */}
      {mode === 'braille' && (
        <div className="a4-scroll-wrap overflow-x-auto space-y-6">
          {brailleSheetPages.map((pageRows, pageIdx) => {
            const isLastPage = pageIdx === brailleSheetPages.length - 1;
            return (
              <section
                key={`a4-braille-page-${pageIdx}`}
                className={`a4-sheet-page mx-auto bg-white border border-slate-300 rounded-lg text-black flex flex-col ${
                  !isLastPage ? 'a4-page-break-after' : ''
                }`}
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '8mm',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  className="border-b-2 border-black flex items-end justify-between gap-4 shrink-0"
                  style={{ paddingBottom: '2mm', marginBottom: '4mm' }}
                >
                  <div>
                    <h1 className="text-base font-bold text-black leading-tight">
                      {comercio.nombre} — Carta en Sistema Braille (Formato A4)
                    </h1>
                    <p className="text-[10px] text-slate-700 mt-0.5">
                      Celda 6,5 × 4,0 mm · Puntos 2,5 mm · Celdas contiguas 6,0
                      mm · Interlineado 10,0 mm (escala real 1:1).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-black shrink-0">
                    Hoja {pageIdx + 1} de {brailleSheetPages.length}
                  </span>
                </div>

                <div className="flex-1">
                  <BrailleSvg
                    lines={pageRows}
                    showGuide={brailleConGuia}
                    showEmptyDots={showEmptyDots}
                    ariaLabel={`${comercio.nombre} Carta Braille Hoja ${
                      pageIdx + 1
                    }`}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* MODO 3: OBLEA MUNICIPAL Y TARJETA QR DE MESA A4 */}
      {mode === 'oblea_qr' && (
        <section
          className="a4-sheet mx-auto bg-white border border-slate-300 rounded-lg p-8 sm:p-12 text-black"
          style={{ maxWidth: '210mm', minHeight: '297mm' }}
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
