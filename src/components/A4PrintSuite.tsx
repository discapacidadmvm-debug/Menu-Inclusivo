import React, { useMemo, useState } from 'react';
import { Printer, Download, Eye, UtensilsCrossed } from 'lucide-react';
import { ComercioPublico, PlatoMenu } from '../types.ts';
import { formatArs, formatFechaAr } from '../utils/dates.ts';
import {
  buildBraillePlainTextExport,
  buildMenuBrailleLines,
  formatDishPriceBraille,
} from '../utils/braille.ts';
import { SinTaccLogo } from './SinTaccLogo.tsx';
import { QrCodeBlock } from './QrCodeBlock.tsx';
import { DishQrMini } from './DishQrMini.tsx';

interface A4PrintSuiteProps {
  comercio: ComercioPublico;
  platos: PlatoMenu[];
  publicMenuUrl: string;
}

type PrintMode = 'pictogramas' | 'braille' | 'oblea_qr';

export const A4PrintSuite: React.FC<A4PrintSuiteProps> = ({
  comercio,
  platos,
  publicMenuUrl,
}) => {
  const [mode, setMode] = useState<PrintMode>('pictogramas');
  const [brailleConGuia, setBrailleConGuia] = useState(true);

  const platosActivos = useMemo(
    () => platos.filter((p) => p.disponible),
    [platos]
  );

  const categorias = useMemo(
    () => Array.from(new Set(platosActivos.map((p) => p.categoria))),
    [platosActivos]
  );

  const brailleLines = useMemo(
    () => buildMenuBrailleLines(comercio, platos),
    [comercio, platos]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadBraille = () => {
    const content = buildBraillePlainTextExport(comercio, platos, brailleConGuia);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carta-braille-${comercio.slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
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
            Carta A4 con Pictogramas
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

        <div className="flex flex-wrap items-center gap-3">
          {mode === 'braille' && (
            <>
              <button
                type="button"
                onClick={() => setBrailleConGuia((v) => !v)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                {brailleConGuia ? 'Ocultar texto guía' : 'Mostrar texto guía'}
              </button>
              <button
                type="button"
                onClick={handleDownloadBraille}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
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

      {/* Aviso normativo Art. 6º */}
      <div className="no-print text-xs text-slate-600 px-1">
        Parámetros Ordenanza Art. 6º: Papel A4 no deslizante, sin brillo ni plastificado. Alto contraste, fondo liso blanco y tipografía Verdana/sans-serif tamaño mínimo 14 pt.
      </div>

      {/* MODO 1: CARTA A4 CON PICTOGRAMAS Y FOTOS REALES */}
      {mode === 'pictogramas' && (
        <section
          className="a4-sheet mx-auto bg-white border border-slate-300 rounded-lg p-8 sm:p-10 text-black"
          style={{
            maxWidth: '210mm',
            minHeight: '297mm',
            fontFamily: 'Verdana, Helvetica, Arial, sans-serif',
          }}
        >
          {/* Encabezado A4 */}
          <header className="border-b-2 border-black pb-5 mb-6 flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Carta Inclusiva — Municipalidad de Vicuña Mackenna
              </p>
              <h1 className="text-3xl font-bold text-black">{comercio.nombre}</h1>
              <p className="text-sm text-black">
                {comercio.rubro} · {comercio.direccion}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold">Oblea Nº {comercio.obleaNumero}</p>
              <p className="text-xs">Precios en Pesos Argentinos (ARS)</p>
            </div>
          </header>

          {platosActivos.length === 0 ? (
            <p className="text-base py-12 text-center">
              No hay platos activos cargados para imprimir.
            </p>
          ) : (
            <div className="space-y-8">
              {categorias.map((categoria) => {
                const items = platosActivos.filter((p) => p.categoria === categoria);
                return (
                  <div key={categoria} className="space-y-4">
                    <h2 className="text-2xl font-bold border-b border-black pb-1.5 text-black">
                      {categoria}
                    </h2>

                    <div className="space-y-5">
                      {items.map((plato) => (
                        <article
                          key={plato.id}
                          className="a4-avoid-break border border-black rounded-lg p-4 bg-white"
                        >
                          <div className="grid grid-cols-12 gap-4 items-start">
                            {/* Foto real */}
                            <div className="col-span-4">
                              {plato.fotoUrl ? (
                                <img
                                  src={plato.fotoUrl}
                                  alt={plato.nombre}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-36 object-cover rounded border border-slate-400"
                                />
                              ) : (
                                <div className="w-full h-36 border border-slate-400 rounded flex flex-col items-center justify-center bg-slate-50 text-slate-600 p-2 text-center">
                                  <UtensilsCrossed className="w-7 h-7 mb-1" />
                                  <span className="text-xs font-semibold">
                                    {plato.nombre}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Detalle min 14pt + Pictogramas */}
                            <div className="col-span-8 space-y-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <h3
                                  className="font-bold text-black leading-snug"
                                  style={{ fontSize: '18px' }}
                                >
                                  {plato.nombre}
                                </h3>
                                <span
                                  className="font-bold font-mono-tabular text-black shrink-0"
                                  style={{ fontSize: '18px' }}
                                >
                                  {formatArs(plato.precioArs)}
                                </span>
                              </div>

                              {plato.libreDeTacc && (
                                <div>
                                  <SinTaccLogo size="sm" highContrast />
                                </div>
                              )}

                              {plato.descripcion && (
                                <p
                                  className="text-black leading-snug"
                                  style={{ fontSize: '14.5px' }}
                                >
                                  {plato.descripcion}
                                </p>
                              )}

                              {plato.pictogramas.length > 0 && (
                                <div className="pt-1.5">
                                  <p className="text-xs font-bold uppercase tracking-wide text-black mb-1.5">
                                    Ingredientes (Pictogramas):
                                  </p>
                                  <div className="flex flex-wrap gap-2.5">
                                    {plato.pictogramas.map((pg, idx) => (
                                      <div
                                        key={`${pg.id}-${idx}`}
                                        className="border border-black rounded p-1.5 w-20 text-center bg-white"
                                      >
                                        <img
                                          src={pg.imageUrl}
                                          alt={pg.label}
                                          referrerPolicy="no-referrer"
                                          className="w-12 h-12 mx-auto object-contain"
                                        />
                                        <span className="block mt-1 text-xs font-bold text-black leading-tight">
                                          {pg.label}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Braille (plato + precio) y QR individual en ficha A4 */}
                              <div className="pt-2.5 mt-2 border-t border-slate-400 flex items-center justify-between gap-4">
                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-black">
                                    Sistema Braille (Plato y Precio):
                                  </p>
                                  <p className="text-lg font-bold tracking-wider text-black break-words">
                                    {
                                      formatDishPriceBraille(
                                        plato.nombre,
                                        plato.precioArs,
                                        plato.libreDeTacc
                                      ).braille
                                    }
                                  </p>
                                </div>
                                <div className="shrink-0 text-center">
                                  <DishQrMini
                                    slug={comercio.slug}
                                    platoId={plato.id}
                                    platoNombre={plato.nombre}
                                    size={62}
                                    showActions={false}
                                  />
                                  <span className="block text-[10px] font-bold text-black mt-0.5">
                                    QR Audio
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <footer className="mt-8 pt-4 border-t border-black flex items-center justify-between text-xs text-black">
            <span>
              Carta conforme Ordenanza Municipal "Carta o Menú Inclusivo" — Vicuña Mackenna
            </span>
            <span>Vigencia hasta: {formatFechaAr(comercio.vigencia.fechaCaducidad)}</span>
          </footer>
        </section>
      )}

      {/* MODO 2: CARTA A4 EN SISTEMA BRAILLE */}
      {mode === 'braille' && (
        <section
          className="a4-sheet mx-auto bg-white border border-slate-300 rounded-lg p-8 sm:p-10 text-black"
          style={{ maxWidth: '210mm', minHeight: '297mm' }}
        >
          <div className="border-b-2 border-black pb-4 mb-6">
            <h1 className="text-xl font-bold text-black">
              {comercio.nombre} — Carta en Sistema Braille (Formato A4)
            </h1>
            <p className="text-xs text-slate-700 mt-1">
              Celdas estándar de 6 puntos (Alfabeto Braille Español). Apto para impresión en relieve o papel microcápsula.
            </p>
          </div>

          <div className="space-y-4">
            {brailleLines.map((line, i) => {
              if (line.kind === 'separator') {
                return (
                  <div
                    key={i}
                    className="py-1 text-lg tracking-widest text-black select-all"
                  >
                    {line.braille}
                  </div>
                );
              }
              return (
                <div key={i} className="a4-avoid-break space-y-0.5">
                  <p
                    className={`select-all leading-relaxed tracking-wider text-black ${
                      line.kind === 'title' || line.kind === 'category'
                        ? 'text-2xl font-bold'
                        : 'text-xl'
                    }`}
                  >
                    {line.braille}
                  </p>
                  {brailleConGuia && (
                    <p className="text-xs text-slate-600 font-mono-tabular">
                      {line.plain}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
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
              Este comercio cuenta con Carta y Menú Accesible con Pictogramas ARASAAC, Sistema Braille y Menú Digital con lectura en voz multilingüe (Ordenanza Municipal "Carta o Menú Inclusivo").
            </p>

            <div className="py-2">
              <p className="text-2xl font-bold text-slate-900">{comercio.nombre}</p>
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
              <span>Habilitado el: {formatFechaAr(comercio.fechaHabilitacion)}</span>
              <span>Oblea Nº {comercio.obleaNumero}</span>
              <span>Caducidad anual: {formatFechaAr(comercio.vigencia.fechaCaducidad)}</span>
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
                  <p className="text-sm font-bold text-slate-900">{comercio.nombre}</p>
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
