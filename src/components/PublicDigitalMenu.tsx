import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Volume2,
  Square,
  Globe,
  Eye,
  Type as TypeIcon,
  ArrowLeft,
  UtensilsCrossed,
  MapPin,
  Phone,
  QrCode,
} from 'lucide-react';
import {
  ComercioPublico,
  IdiomaCodigo,
  PlatoMenu,
  TranslatedPlatoFields,
} from '../types.ts';
import {
  CATEGORY_TRANSLATIONS,
  IDIOMAS_DISPONIBLES,
  UI_STRINGS,
  speakText,
  stopSpeaking,
} from '../utils/i18n.ts';
import { formatArs } from '../utils/dates.ts';
import { formatDishPriceBraille } from '../utils/braille.ts';
import { apiGetPublicCarta, apiTranslateMenu } from '../utils/apiClient.ts';
import { SinTaccLogo } from './SinTaccLogo.tsx';
import { DishQrMini } from './DishQrMini.tsx';

interface PublicDigitalMenuProps {
  slug: string;
  focusedPlatoId?: string;
  onClearFocus?: () => void;
  onExit?: () => void;
}

export const PublicDigitalMenu: React.FC<PublicDigitalMenuProps> = ({
  slug,
  focusedPlatoId = '',
  onClearFocus,
  onExit,
}) => {
  const [comercio, setComercio] = useState<ComercioPublico | null>(null);
  const [platos, setPlatos] = useState<PlatoMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [idioma, setIdioma] = useState<IdiomaCodigo>('es-AR');
  const [translations, setTranslations] = useState<Record<string, TranslatedPlatoFields>>({});
  const [translating, setTranslating] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlySinTacc, setOnlySinTacc] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [openQrPlatoId, setOpenQrPlatoId] = useState<string | null>(null);

  const speechQueueRef = useRef<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiGetPublicCarta(slug)
      .then((data) => {
        if (!active) return;
        if (!data) {
          setError('No se encontró la carta solicitada.');
          return;
        }
        setComercio(data.comercio);
        setPlatos(data.platos || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Error al cargar el menú.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      speechQueueRef.current = false;
      stopSpeaking();
    };
  }, [slug]);

  useEffect(() => {
    if (idioma === 'es-AR' || platos.length === 0) {
      if (idioma === 'es-AR') setTranslations({});
      return;
    }
    let active = true;
    setTranslating(true);
    apiTranslateMenu(slug, idioma, platos)
      .then((tr) => {
        if (active && tr) {
          setTranslations(tr);
        }
      })
      .catch(() => {
        // Si falla mantiene español
      })
      .finally(() => {
        if (active) setTranslating(false);
      });

    return () => {
      active = false;
    };
  }, [idioma, slug, platos]);

  const strings = UI_STRINGS[idioma];

  const categories = useMemo(() => {
    return Array.from(new Set(platos.map((p) => p.categoria)));
  }, [platos]);

  const focusedDishExists = useMemo(
    () => Boolean(focusedPlatoId && platos.some((p) => p.id === focusedPlatoId)),
    [focusedPlatoId, platos]
  );

  const filteredPlatos = useMemo(() => {
    const base = platos.filter((p) => {
      if (focusedDishExists && p.id !== focusedPlatoId) return false;
      if (selectedCategory !== 'ALL' && p.categoria !== selectedCategory) return false;
      if (onlySinTacc && !p.libreDeTacc) return false;
      return true;
    });
    return base;
  }, [platos, focusedDishExists, focusedPlatoId, selectedCategory, onlySinTacc]);

  const getDishView = (plato: PlatoMenu) => {
    const tr = idioma === 'es-AR' ? undefined : translations[plato.id];
    const catTranslated =
      CATEGORY_TRANSLATIONS[plato.categoria]?.[idioma] || tr?.categoria || plato.categoria;
    return {
      nombre: tr?.nombre || plato.nombre,
      descripcion: tr?.descripcion || plato.descripcion,
      categoria: catTranslated,
      pictogramas: plato.pictogramas.map((pg, idx) => ({
        ...pg,
        label: tr?.pictogramasLabels?.[idx] || pg.label,
      })),
    };
  };

  const buildDishSpeechScript = (plato: PlatoMenu): string => {
    const view = getDishView(plato);
    const ingList =
      view.pictogramas.length > 0
        ? `${strings.ingredientsLabel}: ${view.pictogramas.map((p) => p.label).join(', ')}.`
        : '';
    const taccPart = plato.libreDeTacc ? `${strings.glutenFreeLabel}.` : '';
    const pricePart = `${plato.precioArs} ${strings.priceInArs}.`;
    return [view.nombre, view.descripcion, ingList, taccPart, pricePart]
      .filter(Boolean)
      .join('. ');
  };

  const handleListenDish = (plato: PlatoMenu) => {
    speechQueueRef.current = false;
    if (speakingId === plato.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(plato.id);
    speakText(buildDishSpeechScript(plato), idioma, speechRate, () => {
      setSpeakingId((curr) => (curr === plato.id ? null : curr));
    });
  };

  const handleListenFullMenu = () => {
    if (speakingId === 'FULL') {
      speechQueueRef.current = false;
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    if (!comercio || filteredPlatos.length === 0) return;

    speechQueueRef.current = true;
    setSpeakingId('FULL');

    const intro = `${comercio.nombre}. ${strings.digitalMenuTitle}.`;
    const parts = [intro, ...filteredPlatos.map((p) => buildDishSpeechScript(p))];

    let index = 0;
    const speakNext = () => {
      if (!speechQueueRef.current || index >= parts.length) {
        speechQueueRef.current = false;
        setSpeakingId(null);
        return;
      }
      const chunk = parts[index++];
      speakText(chunk, idioma, speechRate, speakNext);
    };
    speakNext();
  };

  const handleStopAll = () => {
    speechQueueRef.current = false;
    stopSpeaking();
    setSpeakingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-[18pt] font-semibold text-slate-900">Cargando carta inclusiva...</p>
          <p className="text-[14pt] text-slate-700">Preparando pictogramas y lectura por voz</p>
        </div>
      </div>
    );
  }

  if (error || !comercio) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center space-y-4">
          <h1 className="text-[18pt] font-bold text-slate-900">Carta no disponible</h1>
          <p className="text-[14pt] text-slate-700">{error}</p>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-4 py-2 text-[14pt] font-medium bg-slate-900 text-white rounded-lg cursor-pointer"
            >
              Volver al portal
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        highContrast ? 'bg-white text-black' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Cabecera accesible del restaurante */}
      <header
        className={`border-b ${
          highContrast ? 'bg-white border-black border-b-2' : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className={`inline-flex items-center gap-1.5 text-[14pt] font-medium mb-1 cursor-pointer ${
                    highContrast
                      ? 'text-black underline'
                      : 'text-blue-700 hover:text-blue-900'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Volver a Carta Inclusiva
                </button>
              )}
              <h1
                className={`font-bold tracking-tight ${
                  largeText ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                }`}
              >
                {comercio.nombre}
              </h1>
              <div
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${
                  largeText ? 'text-[16pt]' : 'text-[14pt]'
                } ${highContrast ? 'text-black font-medium' : 'text-slate-700'}`}
              >
                <span>{comercio.rubro}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 shrink-0" />
                  {comercio.direccion}
                </span>
                {comercio.telefono && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono-tabular">
                      <Phone className="w-4 h-4 shrink-0" />
                      {comercio.telefono}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[14pt] font-semibold uppercase tracking-wide text-emerald-900">
                Oblea {comercio.obleaNumero}
              </p>
              <p className="text-[14pt] text-slate-700 max-w-sm">{strings.inclusiveSeal}</p>
            </div>
          </div>

          {/* Barra de idioma y lectura en voz alta */}
          <div
            className={`rounded-xl p-4 border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
              highContrast
                ? 'bg-yellow-50 border-black border-2'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="idioma-selector"
                className="inline-flex items-center gap-2 text-[14pt] font-semibold"
              >
                <Globe className="w-5 h-5" />
                Idioma / Language:
              </label>
              <select
                id="idioma-selector"
                value={idioma}
                onChange={(e) => {
                  handleStopAll();
                  setIdioma(e.target.value as IdiomaCodigo);
                }}
                className={`px-3 py-2 rounded-lg text-[14pt] font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  highContrast
                    ? 'bg-white border-black text-black'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {IDIOMAS_DISPONIBLES.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.nativeName} — {opt.label}
                  </option>
                ))}
              </select>
              {translating && (
                <span className="text-[14pt] font-medium text-blue-700">
                  Traduciendo carta...
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleListenFullMenu}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14pt] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  speakingId === 'FULL'
                    ? 'bg-red-700 text-white hover:bg-red-800'
                    : highContrast
                      ? 'bg-black text-white hover:bg-slate-800'
                      : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {speakingId === 'FULL' ? (
                  <>
                    <Square className="w-5 h-5 fill-current" />
                    {strings.stopAudio}
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    {strings.listenFullMenu}
                  </>
                )}
              </button>

              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1">
                {[
                  { label: strings.speedSlow, val: 0.8 },
                  { label: strings.speedNormal, val: 1.0 },
                  { label: strings.speedFast, val: 1.2 },
                ].map((spd) => (
                  <button
                    key={spd.val}
                    type="button"
                    onClick={() => setSpeechRate(spd.val)}
                    className={`px-3 py-1 text-[14pt] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      speechRate === spd.val
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {spd.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controles visuales y filtros de acceso */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-2 rounded-lg text-[14pt] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {strings.allCategories}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-lg text-[14pt] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {CATEGORY_TRANSLATIONS[cat]?.[idioma] || cat}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOnlySinTacc((v) => !v)}
                className={`px-3 py-2 rounded-lg text-[14pt] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  onlySinTacc
                    ? 'bg-emerald-800 border-emerald-800 text-white'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {strings.onlyGlutenFree}
              </button>

              <button
                type="button"
                onClick={() => setHighContrast((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14pt] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  highContrast
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Eye className="w-5 h-5" />
                {strings.highContrast}
              </button>

              <button
                type="button"
                onClick={() => setLargeText((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14pt] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  largeText
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <TypeIcon className="w-5 h-5" />
                {strings.largeText}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Listado accesible de platos */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {focusedPlatoId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14pt] font-semibold text-blue-950">
              {focusedDishExists
                ? 'Mostrando el plato seleccionado por código QR.'
                : 'El plato solicitado por QR no está disponible actualmente; mostrando toda la carta.'}
            </p>
            {onClearFocus && (
              <button
                type="button"
                onClick={onClearFocus}
                className="px-3.5 py-1.5 text-[14pt] font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 cursor-pointer"
              >
                Ver toda la carta
              </button>
            )}
          </div>
        )}

        {filteredPlatos.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-[15pt] font-medium text-slate-800">{strings.noItemsMatch}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPlatos.map((plato) => {
              const view = getDishView(plato);
              const isSpeakingThis = speakingId === plato.id;

              return (
                <article
                  key={plato.id}
                  className={`rounded-xl overflow-hidden border ${
                    highContrast
                      ? 'bg-white border-black border-2'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
                    {/* Foto real del plato */}
                    <div className="md:col-span-4 bg-slate-100 min-h-[210px]">
                      {plato.fotoUrl ? (
                        <img
                          src={plato.fotoUrl}
                          alt={view.nombre}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover min-h-[210px] max-h-[300px] md:max-h-none"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[210px] flex flex-col items-center justify-center p-6 text-slate-700 bg-slate-100">
                          <UtensilsCrossed className="w-10 h-10 mb-2 text-slate-500" />
                          <span className="text-[14pt] font-medium text-center">
                            {view.nombre}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Información + Pictogramas + Voz */}
                    <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p
                              className={`font-semibold uppercase tracking-wide ${
                                largeText ? 'text-[16pt]' : 'text-[14pt]'
                              } ${highContrast ? 'text-black' : 'text-slate-700'}`}
                            >
                              {view.categoria}
                            </p>
                            <h2
                              className={`font-bold leading-snug ${
                                largeText ? 'text-[22pt] sm:text-[26pt]' : 'text-[17pt] sm:text-[20pt]'
                              }`}
                            >
                              {view.nombre}
                            </h2>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono-tabular font-bold ${
                                largeText ? 'text-[22pt] sm:text-[26pt]' : 'text-[17pt] sm:text-[20pt]'
                              } ${highContrast ? 'text-black' : 'text-slate-900'}`}
                            >
                              {formatArs(plato.precioArs)}
                            </span>
                            <p
                              className={`${
                                largeText ? 'text-[15pt]' : 'text-[14pt]'
                              } ${highContrast ? 'text-black' : 'text-slate-700'}`}
                            >
                              ARS
                            </p>
                          </div>
                        </div>

                        {plato.libreDeTacc && (
                          <div className="pt-1">
                            <SinTaccLogo size={largeText ? 'lg' : 'md'} highContrast={highContrast} />
                          </div>
                        )}

                        {view.descripcion && (
                          <p
                            className={`leading-relaxed ${
                              largeText ? 'text-[17pt]' : 'text-[14pt]'
                            } ${highContrast ? 'text-black' : 'text-slate-800'}`}
                          >
                            {view.descripcion}
                          </p>
                        )}

                        {/* Pictogramas ARASAAC de ingredientes */}
                        {view.pictogramas.length > 0 && (
                          <div className="pt-2">
                            <p
                              className={`font-semibold uppercase tracking-wide mb-2.5 ${
                                largeText ? 'text-[15pt]' : 'text-[14pt]'
                              } ${highContrast ? 'text-black' : 'text-slate-700'}`}
                            >
                              {strings.ingredientsLabel}
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {view.pictogramas.map((pg, idx) => (
                                <div
                                  key={`${pg.id}-${idx}`}
                                  className={`flex flex-col items-center p-3 rounded-lg border min-w-[128px] max-w-[190px] text-center ${
                                    highContrast
                                      ? 'bg-white border-black border-2'
                                      : 'bg-slate-50 border-slate-200'
                                  }`}
                                >
                                  <img
                                    src={pg.imageUrl}
                                    alt={pg.label}
                                    referrerPolicy="no-referrer"
                                    className="w-16 h-16 object-contain bg-white rounded border border-slate-200 p-1"
                                  />
                                  <span
                                    className={`mt-1.5 font-semibold leading-tight break-words ${
                                      largeText ? 'text-[16pt]' : 'text-[14pt]'
                                    } ${highContrast ? 'text-black' : 'text-slate-900'}`}
                                  >
                                    {pg.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Alfabeto Braille del plato y precio */}
                        <div
                          className={`rounded-lg border px-3.5 py-2.5 space-y-1 ${
                            highContrast
                              ? 'bg-white border-black border-2'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <p
                            className={`font-semibold uppercase tracking-wide ${
                              largeText ? 'text-[15pt]' : 'text-[14pt]'
                            } ${highContrast ? 'text-black' : 'text-slate-700'}`}
                          >
                            Sistema Braille (Plato y Precio)
                          </p>
                          {(() => {
                            const br = formatDishPriceBraille(
                              view.nombre,
                              plato.precioArs,
                              plato.libreDeTacc
                            );
                            return (
                              <>
                                <p
                                  className={`tracking-wider break-words select-all ${
                                    largeText ? 'text-3xl' : 'text-2xl'
                                  } ${highContrast ? 'text-black font-bold' : 'text-slate-950'}`}
                                >
                                  {br.braille}
                                </p>
                                <p
                                  className={`font-mono-tabular ${
                                    largeText ? 'text-[16pt]' : 'text-[14pt]'
                                  } ${highContrast ? 'text-black' : 'text-slate-700'}`}
                                >
                                  {br.plain}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => handleListenDish(plato)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                              largeText ? 'text-[16pt]' : 'text-[14pt]'
                            } ${
                              isSpeakingThis
                                ? 'bg-red-700 text-white hover:bg-red-800'
                                : highContrast
                                  ? 'bg-black text-white hover:bg-slate-800'
                                  : 'bg-blue-700 text-white hover:bg-blue-800'
                            }`}
                          >
                            {isSpeakingThis ? (
                              <>
                                <Square className="w-5 h-5 fill-current" />
                                {strings.stopAudio}
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-5 h-5" />
                                {strings.listenDish}
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setOpenQrPlatoId((curr) =>
                                curr === plato.id ? null : plato.id
                              )
                            }
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                              largeText ? 'text-[16pt]' : 'text-[14pt]'
                            } ${
                              highContrast
                                ? 'bg-white border-black text-black'
                                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <QrCode className="w-5 h-5" />
                            {openQrPlatoId === plato.id
                              ? 'Ocultar QR del plato'
                              : 'QR de este plato'}
                          </button>
                        </div>

                        {openQrPlatoId === plato.id && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <DishQrMini
                              slug={comercio.slug}
                              platoId={plato.id}
                              platoNombre={view.nombre}
                              size={84}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
