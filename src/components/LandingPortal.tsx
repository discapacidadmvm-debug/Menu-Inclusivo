import React, { useEffect, useState } from 'react';
import {
  Volume2,
  Printer,
  QrCode,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { ComercioPublico } from '../types.ts';
import { formatFechaAr } from '../utils/dates.ts';
import { apiGetPublicComercios } from '../utils/apiClient.ts';
import { SinTaccLogo } from './SinTaccLogo.tsx';
import { ARASAAC_LOCAL_CATALOG } from '../data/arasaacCatalog.ts';

interface LandingPortalProps {
  onNavigate: (view: 'home' | 'merchant' | 'admin') => void;
  onOpenDigitalMenu: (slug: string) => void;
}

interface DirectoryComercio extends ComercioPublico {
  cantidadPlatos?: number;
}

export const LandingPortal: React.FC<LandingPortalProps> = ({
  onNavigate,
  onOpenDigitalMenu,
}) => {
  const [comercios, setComercios] = useState<DirectoryComercio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetPublicComercios()
      .then((list) => setComercios(list))
      .finally(() => setLoading(false));
  }, []);

  const milanesaPictos = ARASAAC_LOCAL_CATALOG.slice(0, 5);

  return (
    <div className="space-y-16 pb-16">
      {/* HERO INSTITUCIONAL */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <p className="text-sm font-semibold text-blue-800">
              Municipalidad de Vicuña Mackenna · Ordenanza «Carta o Menú Inclusivo»
            </p>
            <h1
              className="font-bold tracking-tight text-slate-950 leading-tight"
              style={{
                fontSize: 'clamp(2rem, 3.6vw, 3.25rem)',
                textWrap: 'balance',
              }}
            >
              Cartas gastronómicas accesibles para toda la comunidad
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Herramienta oficial gratuita para que bares, restaurantes, confiterías, cafés y heladerías confeccionen e impriman en formato A4 su carta con pictogramas ARASAAC, sistema Braille, sello Libre de TACC y código QR con lectura en voz multilingüe.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('merchant')}
                className="px-5 py-3 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Ingresar como Comercio
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="px-5 py-3 text-sm font-semibold bg-white border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Acceso Municipal
              </button>
              {comercios[0] && (
                <button
                  type="button"
                  onClick={() => onOpenDigitalMenu(comercios[0].slug)}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-blue-800 hover:text-blue-950 whitespace-nowrap cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  Probar carta digital con voz
                </button>
              )}
            </div>
          </div>

          {/* Ejemplo visual concreto: Milanesa Napolitana con foto real + pictogramas ARASAAC */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
            <img
              src="/src/assets/images/dish_milanesa_napolitana_1795101212946.jpg"
              alt="Milanesa a la Napolitana con papas fritas — Ejemplo de plato en Carta Inclusiva"
              referrerPolicy="no-referrer"
              className="w-full h-56 object-cover"
            />
            <div className="p-5 space-y-4 bg-white flex-1 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Ejemplo de plato accesible
                  </p>
                  <h2 className="text-lg font-bold text-slate-900">
                    Milanesa a la Napolitana con Papas Fritas
                  </h2>
                </div>
                <span className="font-mono-tabular text-lg font-bold text-slate-900 shrink-0">
                  $ 14.500
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {milanesaPictos.map((pg) => (
                  <div
                    key={pg.id}
                    className="border border-slate-200 rounded-lg p-1.5 text-center bg-slate-50"
                  >
                    <img
                      src={pg.imageUrl}
                      alt={pg.label}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 mx-auto object-contain bg-white rounded"
                    />
                    <span className="block mt-1 text-[11px] font-semibold text-slate-800 leading-tight truncate">
                      {pg.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Apto TEA, afasia y barreras lingüísticas</span>
                <SinTaccLogo size="sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILARES DE ACCESIBILIDAD */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">
            Inclusión comunicacional y sensorial en cada mesa
          </h2>
          <p className="text-sm text-slate-600">
            Diseñado conforme a la Convención sobre los Derechos de las Personas con Discapacidad (Ley 26.378 y 27.044) y la Ley 24.240.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <Printer className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              Impresión A4 con Pictogramas y Braille
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Genera cartas listas para imprimir en hoja A4 con tipografía legible mínima de 14 pt, alto contraste, fotos reales, pictogramas ARASAAC de cada ingrediente y traducción directa al sistema Braille de 6 puntos.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <QrCode className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              QR por Comercio con Voz Multilingüe
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cada local recibe su oblea municipal y tarjetas QR imprimibles. Al escanearlo, el cliente accede al menú digital y puede reproducirlo en voz alta en Español, Inglés, Portugués, Francés, Italiano o Alemán.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2.5">
            <BookOpen className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-bold text-slate-900">
              Control Municipal y Sello Sin TACC
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              La Secretaría de Desarrollo Social (Bromatología) habilita las contraseñas comerciales con vigencia anual y alerta automática 8 semanas antes del vencimiento. Incluye identificación oficial Libre de TACC.
            </p>
          </div>
        </div>
      </section>

      {/* COMERCIOS ADHERIDOS EN VICUÑA MACKENNA */}
      <section id="comercios" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Establecimientos adheridos en Vicuña Mackenna
            </h2>
            <p className="text-sm text-slate-600">
              Abrí la carta digital interactiva de cualquier comercio para probar el modo voz y selector de idiomas.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            Cargando establecimientos adheridos...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comercios.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{c.rubro}</span>
                    <span className="font-mono-tabular">Oblea {c.obleaNumero}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{c.nombre}</h3>
                  <p className="text-sm text-slate-600">{c.direccion}</p>
                  <div className="pt-1 text-xs font-mono-tabular text-slate-500">
                    {c.cantidadPlatos ?? 0} platos cargados · Vigencia hasta{' '}
                    {formatFechaAr(c.vigencia.fechaCaducidad)}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
                  {c.vigencia.estado === 'vencida' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                      <XCircle className="w-3.5 h-3.5" />
                      Renovación pendiente
                    </span>
                  ) : c.vigencia.requiereAlerta8Semanas ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Vence en {c.vigencia.semanasRestantes} sem.
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Habilitada
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenDigitalMenu(c.slug)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                  >
                    Ver Carta Digital
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SÍNTESIS DE LA ORDENANZA */}
      <section id="ordenanza" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Honorable Concejo Deliberante · Vicuña Mackenna
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Parámetros obligatorios de la Ordenanza «Carta o Menú Inclusivo»
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700 leading-relaxed">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">
                Art. 2º, 4º y 5º — Alcance y Equivalencia
              </h3>
              <p>
                Todos los establecimientos gastronómicos (bares, confiterías, heladerías, cafés, restaurantes y casas de comida) deben ofrecer cartas inclusivas con pictogramas y sistema Braille idénticas a la carta ordinaria, con nombres, descripciones, bebidas y precios actualizados.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">
                Art. 6º — Papel, Contraste y Formato A4
              </h3>
              <p>
                Papel no deslizante, no brillante ni plastificado, con alto contraste, fondo liso, tipografía legible Verdana/Helvética tamaño mínimo 14 pt y encabezados en negrita. El sistema Braille se imprime en formato A4 de gramaje óptimo.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">
                Art. 7º — Disponibilidad e Idioma Claro
              </h3>
              <p>
                Las cartas inclusivas deben estar disponibles en cada mesa y barra de atención, contar con imágenes preferentemente de alta resolución y redactarse en español evitando emoticones o decoraciones excesivas.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">
                Art. 3º, 8º, 10º y 11º — Beneficios y Autoridad de Aplicación
              </h3>
              <p>
                La Secretaría de Desarrollo Social (Área de Bromatología) otorga la oblea identificatoria y coordina reducciones en tasas de higiene y seguridad. Es condición obligatoria contar con menú inclusivo para nuevas habilitaciones comerciales.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
