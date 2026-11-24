import React, { useMemo, useState } from 'react';
import { Printer, Download, Eye, UtensilsCrossed } from 'lucide-react';
import { CategoriaPlato, ComercioPublico, PlatoMenu } from '../types.ts';
import { formatArs, formatFechaAr } from '../utils/dates.ts';
import {
  BRAILLE_GEOMETRY_PRESETS,
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

  const geometry = BRAILLE_GEOMETRY_PRESETS.slate_portrait;

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

  // 3 menúes por hoja A4
  const platosPages = useMemo(
    () => chunkArray(platosActivosOrdenados, 3),
    [platosActivosOrdenados]
  );

  // 26 celdas x 6,35 mm <= 174 mm disponibles junto al QR
  const maxColsCard = 26;
  const maxRowsCard = 3;

  // 28 celdas x 6,35 mm <= 194 mm imprimibles A4
  const maxColsFullSheet = 28;
  const maxRowsFullSheet = 25;

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

  const cardHeightMm = 87.5;
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

      {/* MODO 1: CARTA A4 CON PICTOGRAMAS, BRAILLE EXACTO Y QR (3 MENÚES POR HOJA) */}
      {mode === 'pictogramas' && (
        <div className="a4-scroll-wrap overflow-x-auto space-y-6">
          {platosPages.length === 0 ? (
            <section
              className="a4-sheet-page mx-auto bg-white border border-slate-300 rounded-lg text-black flex flex-col justify-center items-center"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '7mm 8mm',
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
                    minHeight: '297mm',
                    padding: '7mm 8mm',
                    boxSizing: 'border-box',
                    fontFamily: 'Verdana, Helvetica, Arial, sans-serif',
                  }}
                >
                  {/* Encabezado compacto (8,5 mm + 1 mm margen = 9,5 mm) */}
                  <header
                    className="border-b-2 border-black flex items-end justify-between shrink-0"
                    style={{
                      height: '8.5mm',
                      paddingBottom: '1mm',
                      marginBottom: '1mm',
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
                        style={{ fontSize: '11.5pt', marginTop: '0.5mm' }}
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

                  {/* Contenedor de 3 menúes con paso vertical exacto (90,0 mm) */}
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
                          {/* Bloque superior fijo (45,8 mm) para mantener todas las filas Braille alineadas */}
                          <div
                            className="shrink-0 overflow-hidden"
                            style={{ height: '45.8mm' }}
                          >
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

                          {/* Banda inferior fija: Braille exacto + QR individual */}
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
                                  fontSize: '6.5pt',
                                  height: '2.5mm',
                                  marginBottom: '0.5mm',
                                }}
                              >
                                Sistema Braille
                              </p>
                              <BrailleSvg
                                lines={wrappedBraille.map((row) => ({
                                  braille: row.braille,
                                  guide: row.plain,
                                }))}
                                geometry={geometry}
                                showGuide={false}
                                showEmptyDots={false}
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

                  {/* Pie de hoja compacto */}
                  <footer
                    className="border-t border-black flex items-center justify-between text-black shrink-0 mt-auto"
                    style={{
                      height: '4mm',
                      paddingTop: '1mm',
                      marginTop: '1mm',
                      fontSize: '7pt',
                      gap: '3mm',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span>
                      Ordenanza Municipal &ldquo;Carta o Menú Inclusivo&rdquo; —
                      Vicuña Mackenna
                    </span>
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

      {/* MODO 2: CARTA A4 EN SISTEMA BRAILLE */}
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
                  minHeight: '297mm',
                  padding: '7mm 8mm',
                  boxSizing: 'border-box',
                  fontFamily: 'Verdana, Helvetica, Arial, sans-serif',
                }}
              >
                <div
                  className="border-b-2 border-black flex items-end justify-between shrink-0"
                  style={{
                    paddingBottom: '1.5mm',
                    marginBottom: '3.5mm',
                    gap: '4mm',
                  }}
                >
                  <div>
                    <h1
                      className="font-bold text-black leading-tight"
                      style={{ fontSize: '11.5pt' }}
                    >
                      {comercio.nombre} — Carta en Sistema Braille
                    </h1>
                    <p
                      className="text-slate-700"
                      style={{ fontSize: '7.5pt', marginTop: '0.5mm' }}
                    >
                      Alfabeto Braille Español — Formato A4
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
                    showGuide={brailleConGuia}
                    showEmptyDots={false}
                    fixedCols={maxColsFullSheet}
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
          className="a4-sheet mx-auto bg-white border border-slate-300 rounded-lg text-black"
          style={{
            width: '210mm',
            minHeight: '297mm',
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
