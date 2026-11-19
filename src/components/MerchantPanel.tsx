import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Upload,
  Search,
  Trash2,
  Edit3,
  ArrowLeft,
  ArrowRight,
  LogOut,
  KeyRound,
  ImagePlus,
  Printer,
  QrCode,
  UtensilsCrossed,
} from 'lucide-react';
import {
  CategoriaPlato,
  ComercioPublico,
  PictogramaItem,
  PlatoMenu,
} from '../types.ts';
import { ARASAAC_LOCAL_CATALOG } from '../data/arasaacCatalog.ts';
import { formatArs, formatFechaAr } from '../utils/dates.ts';
import { formatDishPriceBraille } from '../utils/braille.ts';
import {
  apiAuthComercio,
  apiDeletePlato,
  apiGetMerchantMenu,
  apiGetPublicComercios,
  apiSaveCustomPictogram,
  apiSavePlato,
  apiSearchArasaac,
} from '../utils/apiClient.ts';
import { SinTaccLogo } from './SinTaccLogo.tsx';
import { A4PrintSuite } from './A4PrintSuite.tsx';
import { QrCodeBlock } from './QrCodeBlock.tsx';
import { DishQrMini } from './DishQrMini.tsx';

interface MerchantPanelProps {
  onOpenDigitalMenu: (slug: string, platoId?: string) => void;
}

const CATEGORIAS: CategoriaPlato[] = [
  'Desayunos',
  'Meriendas',
  'Desayunos y Meriendas',
  'Cafetería y Panadería',
  'Entradas',
  'Platos Principales',
  'Minutas',
  'Parrilla',
  'Pastas',
  'Pizzas y Empanadas',
  'Sándwiches y Hamburguesas',
  'Ensaladas',
  'Guarniciones',
  'Heladería',
  'Postres',
  'Bebidas',
  'Menú Infantil',
  'Promociones',
];

const SAMPLE_PHOTOS = [
  {
    label: 'Milanesa Napolitana',
    url: '/src/assets/images/dish_milanesa_napolitana_1795101212946.jpg',
  },
  {
    label: 'Empanadas Criollas',
    url: '/src/assets/images/dish_empanadas_criollas_1795101212958.jpg',
  },
  {
    label: 'Café con Medialunas',
    url: '/src/assets/images/dish_cafe_medialunas_1795101212622.jpg',
  },
  {
    label: 'Helado Artesanal',
    url: '/src/assets/images/dish_helado_artesanal_1795101212146.jpg',
  },
];

async function fileToCompressedDataUrl(file: File, maxWidth = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen inválido.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const MerchantPanel: React.FC<MerchantPanelProps> = ({
  onOpenDigitalMenu,
}) => {
  const [comerciosList, setComerciosList] = useState<ComercioPublico[]>([]);
  const [selectedComercioId, setSelectedComercioId] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [comercio, setComercio] = useState<ComercioPublico | null>(null);
  const [platos, setPlatos] = useState<PlatoMenu[]>([]);
  const [customPictograms, setCustomPictograms] = useState<PictogramaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'print' | 'qr'>('editor');

  // Editor de plato
  const [editingPlatoId, setEditingPlatoId] = useState<string | null>(null);
  const [draftPlatoId, setDraftPlatoId] = useState<string>('');
  const [showDishForm, setShowDishForm] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaPlato>('Platos Principales');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioArs, setPrecioArs] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [libreDeTacc, setLibreDeTacc] = useState(false);
  const [disponible, setDisponible] = useState(true);
  const [pictogramas, setPictogramas] = useState<PictogramaItem[]>([]);
  const [savingPlato, setSavingPlato] = useState(false);
  const [dishError, setDishError] = useState('');

  // Buscador ARASAAC
  const [pictoQuery, setPictoQuery] = useState('');
  const [pictoResults, setPictoResults] = useState<PictogramaItem[]>(
    ARASAAC_LOCAL_CATALOG.slice(0, 12).map((c) => ({
      id: c.id,
      label: c.label,
      imageUrl: c.imageUrl,
      source: 'catalogo',
    }))
  );
  const [searchingPicto, setSearchingPicto] = useState(false);

  // Carga de pictograma personalizado
  const [customLabel, setCustomLabel] = useState('');
  const [customPreview, setCustomPreview] = useState('');
  const [uploadingCustom, setUploadingCustom] = useState(false);

  useEffect(() => {
    apiGetPublicComercios()
      .then((list) => {
        setComerciosList(list);
        if (list.length > 0) {
          setSelectedComercioId((prev) => prev || list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const loadMerchantMenu = async (comercioId: string) => {
    const data = await apiGetMerchantMenu(comercioId);
    if (data) {
      setComercio(data.comercio);
      setPlatos(data.platos || []);
      setCustomPictograms(data.customPictograms || []);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await apiAuthComercio(selectedComercioId, passwordInput);
      if (!result.ok || !result.comercio) {
        setAuthError(result.error || 'Contraseña incorrecta.');
        return;
      }
      await loadMerchantMenu(result.comercio.id);
    } catch {
      setAuthError('Error de conexión.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSearchArasaac = async (queryText: string) => {
    setPictoQuery(queryText);
    setSearchingPicto(true);
    try {
      const results = await apiSearchArasaac(queryText);
      setPictoResults(results);
    } finally {
      setSearchingPicto(false);
    }
  };

  const openNewDishForm = () => {
    setEditingPlatoId(null);
    setDraftPlatoId(`pla-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    setCategoria('Desayunos y Meriendas');
    setNombre('');
    setDescripcion('');
    setPrecioArs('');
    setFotoUrl('');
    setLibreDeTacc(false);
    setDisponible(true);
    setPictogramas([]);
    setDishError('');
    setShowDishForm(true);
  };

  const openEditDishForm = (p: PlatoMenu) => {
    setEditingPlatoId(p.id);
    setDraftPlatoId(p.id);
    setCategoria(p.categoria);
    setNombre(p.nombre);
    setDescripcion(p.descripcion);
    setPrecioArs(String(p.precioArs));
    setFotoUrl(p.fotoUrl);
    setLibreDeTacc(p.libreDeTacc);
    setDisponible(p.disponible);
    setPictogramas(p.pictogramas);
    setDishError('');
    setShowDishForm(true);
  };

  const handleUploadDishPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 960);
      setFotoUrl(dataUrl);
    } catch {
      setDishError('No se pudo procesar la foto seleccionada.');
    }
  };

  const handleUploadCustomPictoFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 320);
      setCustomPreview(dataUrl);
    } catch {
      setDishError('No se pudo leer la imagen del pictograma.');
    }
  };

  const handleSaveCustomPictogram = async () => {
    if (!comercio || !customLabel.trim() || !customPreview) return;
    setUploadingCustom(true);
    try {
      const picto = await apiSaveCustomPictogram(
        comercio.id,
        customLabel.trim(),
        customPreview
      );
      if (picto) {
        setCustomPictograms((prev) => [...prev, picto]);
        setPictogramas((prev) => [...prev, picto]);
        setCustomLabel('');
        setCustomPreview('');
      }
    } finally {
      setUploadingCustom(false);
    }
  };

  const handleAddPictogram = (item: PictogramaItem) => {
    setPictogramas((prev) => [
      ...prev,
      { ...item, id: `${item.id}-${Date.now()}-${prev.length}` },
    ]);
  };

  const handleMovePictogram = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= pictogramas.length) return;
    const next = [...pictogramas];
    const tmp = next[idx];
    next[idx] = next[target];
    next[target] = tmp;
    setPictogramas(next);
  };

  const handleSavePlato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercio) return;
    if (!nombre.trim()) {
      setDishError('El nombre del plato es obligatorio.');
      return;
    }
    setSavingPlato(true);
    setDishError('');
    try {
      const result = await apiSavePlato(comercio.id, editingPlatoId, {
        ...(editingPlatoId ? {} : { id: draftPlatoId }),
        categoria,
        nombre,
        descripcion,
        precioArs: Number(precioArs) || 0,
        fotoUrl,
        libreDeTacc,
        disponible,
        pictogramas,
      });
      if (!result.ok) {
        setDishError(result.error || 'No se pudo guardar el plato.');
        return;
      }
      await loadMerchantMenu(comercio.id);
      setShowDishForm(false);
    } catch {
      setDishError('Error de red al guardar el plato.');
    } finally {
      setSavingPlato(false);
    }
  };

  const handleDeletePlato = async (platoId: string) => {
    if (!comercio) return;
    await apiDeletePlato(comercio.id, platoId);
    await loadMerchantMenu(comercio.id);
  };

  if (!comercio) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Gestión de Carta Inclusiva
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Acceso para Comercios
            </h1>
            <p className="text-sm text-slate-600">
              Ingresá con el establecimiento y la contraseña habilitada por la Municipalidad de Vicuña Mackenna.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="comercio-select"
                className="block text-sm font-medium text-slate-800"
              >
                Establecimiento
              </label>
              <select
                id="comercio-select"
                value={selectedComercioId}
                onChange={(e) => setSelectedComercioId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {comerciosList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.rubro})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="comercio-pwd"
                className="block text-sm font-medium text-slate-800"
              >
                Contraseña asignada por el Municipio
              </label>
              <input
                id="comercio-pwd"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresá tu contraseña"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                required
              />
            </div>

            {authError && (
              <p className="text-sm text-red-700 font-medium">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading || !selectedComercioId}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              {authLoading ? 'Ingresando...' : 'Ingresar a mi carta'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">
              Accesos de prueba habilitados:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'com-1', name: 'Bodegón El Encuentro', pwd: 'milan2026' },
                { id: 'com-2', name: 'Café Plaza (Alerta 8 sem.)', pwd: 'cafe2026' },
                { id: 'com-3', name: 'Heladería Los Tilos (Vencida)', pwd: 'helado2026' },
              ].map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => {
                    setSelectedComercioId(demo.id);
                    setPasswordInput(demo.pwd);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium cursor-pointer"
                >
                  {demo.name} · <span className="font-mono-tabular">{demo.pwd}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const publicMenuUrl = `${window.location.origin}${window.location.pathname || '/'}?carta=${encodeURIComponent(comercio.slug)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Cabecera del comercio + Estado de habilitación (oculta al imprimir A4) */}
      <div className="no-print space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {comercio.rubro} · Oblea Nº {comercio.obleaNumero}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {comercio.nombre}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                Carta y Pictogramas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('print')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer className="w-4 h-4" />
                Imprimir A4 y Braille
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                QR y Menú Digital
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setComercio(null);
                setPasswordInput('');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>

        {/* Estado de habilitación y Alerta de 8 semanas */}
        <div
          className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
            comercio.vigencia.estado === 'vencida'
              ? 'bg-red-50 border-red-300'
              : comercio.vigencia.requiereAlerta8Semanas
                ? 'bg-amber-50 border-amber-300'
                : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {comercio.vigencia.estado === 'vencida' ? (
              <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            ) : comercio.vigencia.requiereAlerta8Semanas ? (
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            )}

            <div className="space-y-0.5 text-sm">
              <p className="font-bold text-slate-900">
                {comercio.vigencia.estado === 'vencida'
                  ? 'Habilitación anual vencida — Solicitá renovación municipal'
                  : comercio.vigencia.requiereAlerta8Semanas
                    ? `Alerta de vencimiento (restan ${comercio.vigencia.semanasRestantes} semanas / ${comercio.vigencia.diasRestantes} días)`
                    : `Habilitación municipal vigente (${comercio.vigencia.diasRestantes} días restantes)`}
              </p>
              <p className="text-slate-700 font-mono-tabular text-xs sm:text-sm">
                Primera habilitación: {formatFechaAr(comercio.fechaHabilitacion)} · Caducidad (1 año):{' '}
                {formatFechaAr(comercio.vigencia.fechaCaducidad)}
              </p>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-700">
            Renovación en Secretaría de Desarrollo Social / Bromatología
          </span>
        </div>
      </div>

      {/* TAB 1: EDITOR DE CARTA Y PICTOGRAMAS */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Platos y productos de la carta ({platos.length})
              </h2>
              <p className="text-sm text-slate-600">
                Cargá la foto real de cada plato, sus ingredientes en pictogramas ARASAAC y marcá si es Libre de TACC.
              </p>
            </div>

            <button
              type="button"
              onClick={openNewDishForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Agregar plato o bebida
            </button>
          </div>

          {/* Formulario de plato */}
          {showDishForm && (
            <div className="bg-white border border-slate-300 rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPlatoId ? 'Editar plato del menú' : 'Nuevo plato o producto'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDishForm(false)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleSavePlato} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-800">
                      Categoría *
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as CategoriaPlato)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    >
                      {CATEGORIAS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-800">
                      Nombre del plato o bebida *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Milanesa a la Napolitana"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-800">
                      Precio en pesos argentinos (ARS) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={precioArs}
                      onChange={(e) => setPrecioArs(e.target.value)}
                      placeholder="Ej. 14500"
                      className="w-full px-3.5 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-800">
                      Descripción clara en español (Art. 7º inc. c)
                    </label>
                    <textarea
                      rows={3}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Describí el plato sin emoticones ni decoraciones excesivas. Si usás un término extranjero, agregá la traducción entre paréntesis."
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                    />

                    {/* Libre de TACC + Disponibilidad */}
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={libreDeTacc}
                          onChange={(e) => setLibreDeTacc(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-700"
                        />
                        <span className="text-sm font-semibold text-slate-900">
                          Apto celíacos (Libre de TACC)
                        </span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={disponible}
                          onChange={(e) => setDisponible(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">
                          Visible en carta
                        </span>
                      </label>
                    </div>

                    {libreDeTacc && (
                      <div className="pt-1">
                        <SinTaccLogo size="md" />
                      </div>
                    )}
                  </div>

                  {/* Foto real del plato */}
                  <div className="space-y-2.5">
                    <label className="block text-sm font-medium text-slate-800">
                      Foto real del plato
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-36 h-28 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                        {fotoUrl ? (
                          <img
                            src={fotoUrl}
                            alt="Vista previa del plato"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-500 text-center px-2">
                            Sin foto cargada
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          Subir foto real
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadDishPhoto}
                            className="hidden"
                          />
                        </label>
                        {fotoUrl && (
                          <button
                            type="button"
                            onClick={() => setFotoUrl('')}
                            className="ml-2 text-xs font-medium text-red-700 hover:underline cursor-pointer"
                          >
                            Quitar foto
                          </button>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {SAMPLE_PHOTOS.map((sp) => (
                            <button
                              key={sp.label}
                              type="button"
                              onClick={() => setFotoUrl(sp.url)}
                              className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                            >
                              Usar: {sp.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección Pictogramas de Ingredientes */}
                <div className="border-t border-slate-200 pt-5 space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Pictogramas de ingredientes (ARASAAC / Propios)
                    </h4>
                    <p className="text-xs text-slate-600">
                      Ejemplo: para una milanesa napolitana agregá Milanesa, Jamón, Queso, Salsa de tomate y Papas fritas.
                    </p>
                  </div>

                  {/* Pictogramas ya agregados al plato */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                    <p className="text-xs font-semibold text-slate-700 mb-2">
                      Pictogramas seleccionados ({pictogramas.length}):
                    </p>
                    {pictogramas.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Todavía no agregaste pictogramas. Buscá ingredientes abajo o subí un pictograma propio.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {pictogramas.map((pg, idx) => (
                          <div
                            key={`${pg.id}-${idx}`}
                            className="bg-white border border-slate-300 rounded-lg p-2 w-28 flex flex-col items-center gap-1.5"
                          >
                            <img
                              src={pg.imageUrl}
                              alt={pg.label}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 object-contain"
                            />
                            <input
                              type="text"
                              value={pg.label}
                              onChange={(e) => {
                                const next = [...pictogramas];
                                next[idx] = { ...next[idx], label: e.target.value };
                                setPictogramas(next);
                              }}
                              className="w-full text-center text-xs font-semibold border-b border-slate-200 focus:outline-none focus:border-blue-600 py-0.5"
                            />
                            <div className="flex items-center justify-between w-full pt-0.5 text-slate-500">
                              <button
                                type="button"
                                onClick={() => handleMovePictogram(idx, -1)}
                                disabled={idx === 0}
                                className="p-0.5 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                title="Mover a la izquierda"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPictogramas((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="p-0.5 hover:text-red-700 cursor-pointer"
                                title="Quitar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMovePictogram(idx, 1)}
                                disabled={idx === pictogramas.length - 1}
                                className="p-0.5 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                                title="Mover a la derecha"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buscador ARASAAC */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={pictoQuery}
                            onChange={(e) => setPictoQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearchArasaac(pictoQuery);
                              }
                            }}
                            placeholder="Buscar ingrediente en ARASAAC (ej. milanesa, jamón, queso, tomate)..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSearchArasaac(pictoQuery)}
                          className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                        >
                          {searchingPicto ? 'Buscando...' : 'Buscar'}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-60 overflow-y-auto p-1">
                        {pictoResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleAddPictogram(item)}
                            className="bg-white border border-slate-200 hover:border-blue-600 rounded-lg p-2 flex flex-col items-center text-center gap-1 transition-colors cursor-pointer"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.label}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 object-contain"
                            />
                            <span className="text-xs font-medium text-slate-800 leading-tight line-clamp-2">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cargar pictograma propio si no hay apto en ARASAAC */}
                    <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <ImagePlus className="w-4 h-4 text-blue-700" />
                        ¿No encontrás un pictograma apto?
                      </div>
                      <p className="text-xs text-slate-600">
                        Cargá tu propio pictograma o imagen de ingrediente para usarlo en tu carta.
                      </p>

                      <input
                        type="text"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        placeholder="Nombre (ej. Chimichurri)"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          Elegir imagen
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadCustomPictoFile}
                            className="hidden"
                          />
                        </label>
                        {customPreview && (
                          <img
                            src={customPreview}
                            alt="Vista previa"
                            className="w-10 h-10 object-contain bg-white border border-slate-300 rounded p-0.5"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveCustomPictogram}
                        disabled={uploadingCustom || !customLabel.trim() || !customPreview}
                        className="w-full px-3 py-2 text-xs font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                      >
                        {uploadingCustom ? 'Guardando...' : 'Guardar y agregar al plato'}
                      </button>

                      {customPictograms.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-1.5">
                            Tus pictogramas cargados:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {customPictograms.map((cp) => (
                              <button
                                key={cp.id}
                                type="button"
                                onClick={() => handleAddPictogram(cp)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs hover:border-blue-600 cursor-pointer"
                              >
                                <img
                                  src={cp.imageUrl}
                                  alt={cp.label}
                                  className="w-4 h-4 object-contain"
                                />
                                {cp.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vista previa en vivo: Alfabeto Braille (plato + precio) y QR del plato */}
                <div className="border-t border-slate-200 pt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      Alfabeto Braille del plato y precio (en vivo)
                    </p>
                    {(() => {
                      const br = formatDishPriceBraille(
                        nombre,
                        Number(precioArs) || 0,
                        libreDeTacc
                      );
                      return (
                        <>
                          <p className="text-2xl text-slate-950 tracking-wider leading-relaxed break-words select-all">
                            {br.braille}
                          </p>
                          <p className="text-xs font-mono-tabular text-slate-600">
                            Referencia: {br.plain}
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <DishQrMini
                      slug={comercio.slug}
                      platoId={editingPlatoId || draftPlatoId}
                      platoNombre={nombre || 'Nuevo plato'}
                      size={84}
                      isDraftUnsaved={!editingPlatoId}
                      onTestQr={
                        editingPlatoId
                          ? () => onOpenDigitalMenu(comercio.slug, editingPlatoId)
                          : undefined
                      }
                    />
                  </div>
                </div>

                {dishError && (
                  <p className="text-sm font-medium text-red-700">{dishError}</p>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowDishForm(false)}
                    className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingPlato}
                    className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 cursor-pointer disabled:opacity-60"
                  >
                    {savingPlato
                      ? 'Guardando...'
                      : editingPlatoId
                        ? 'Guardar cambios del plato'
                        : 'Agregar a la carta'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Listado de platos del comercio */}
          {platos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <p className="text-base font-semibold text-slate-900">
                Tu carta todavía no tiene platos cargados
              </p>
              <p className="text-sm text-slate-600">
                Comenzá agregando tu primer plato con foto real y pictogramas ARASAAC.
              </p>
              <button
                type="button"
                onClick={openNewDishForm}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Cargar primer plato
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {platos.map((plato) => (
                <div
                  key={plato.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start"
                >
                  <div className="w-full md:w-44 h-32 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                    {plato.fotoUrl ? (
                      <img
                        src={plato.fotoUrl}
                        alt={plato.nombre}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          {plato.categoria}
                          {!plato.disponible && ' · Oculto temporalmente'}
                        </p>
                        <h3 className="text-lg font-bold text-slate-900">
                          {plato.nombre}
                        </h3>
                      </div>

                      <span className="text-lg font-bold font-mono-tabular text-slate-900">
                        {formatArs(plato.precioArs)}
                      </span>
                    </div>

                    {plato.libreDeTacc && <SinTaccLogo size="sm" />}

                    {plato.descripcion && (
                      <p className="text-sm text-slate-600">{plato.descripcion}</p>
                    )}

                    {plato.pictogramas.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {plato.pictogramas.map((pg, i) => (
                          <div
                            key={`${pg.id}-${i}`}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md"
                          >
                            <img
                              src={pg.imageUrl}
                              alt={pg.label}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 object-contain"
                            />
                            <span className="text-xs font-medium text-slate-800">
                              {pg.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Braille (plato + precio) y QR individual en lo ya publicado */}
                    <div className="pt-3 mt-2 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 space-y-0.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Braille (plato y precio)
                        </p>
                        {(() => {
                          const br = formatDishPriceBraille(
                            plato.nombre,
                            plato.precioArs,
                            plato.libreDeTacc
                          );
                          return (
                            <>
                              <p className="text-lg text-slate-950 tracking-wider break-words select-all">
                                {br.braille}
                              </p>
                              <p className="text-[11px] font-mono-tabular text-slate-500">
                                {br.plain}
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      <div className="lg:col-span-5">
                        <DishQrMini
                          slug={comercio.slug}
                          platoId={plato.id}
                          platoNombre={plato.nombre}
                          size={68}
                          onTestQr={() => onOpenDigitalMenu(comercio.slug, plato.id)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditDishForm(plato)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenDigitalMenu(comercio.slug, plato.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Ver digital
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlato(plato.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPRESIÓN A4 Y BRAILLE */}
      {activeTab === 'print' && (
        <A4PrintSuite
          comercio={comercio}
          platos={platos}
          publicMenuUrl={publicMenuUrl}
        />
      )}

      {/* TAB 3: CÓDIGO QR Y ENLACE DIGITAL CON VOZ */}
      {activeTab === 'qr' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <QrCodeBlock
              url={publicMenuUrl}
              comercioNombre={comercio.nombre}
              obleaNumero={comercio.obleaNumero}
              size={240}
              onOpenDigitalMenu={() => onOpenDigitalMenu(comercio.slug)}
            />
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              Código QR exclusivo de {comercio.nombre}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Al escanear este código QR desde cualquier teléfono celular en la mesa o barra de atención, tus clientes acceden directamente a la carta digital accesible de tu comercio sin necesidad de descargar aplicaciones ni iniciar sesión.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                · Reproducción en voz alta de toda la carta o plato por plato.
              </li>
              <li>
                · Selección de idioma: Español (Argentina), Inglés, Portugués, Francés, Italiano y Alemán.
              </li>
              <li>
                · Visualización de fotos reales, pictogramas ARASAAC de ingredientes, precios en ARS y filtro Libre de TACC.
              </li>
              <li>
                · Modo de alto contraste y texto ampliado para personas con baja visión.
              </li>
            </ul>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Enlace codificado en este QR
              </p>
              <p className="text-xs font-mono-tabular text-slate-800 break-all select-all">
                {publicMenuUrl}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('print')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Ir a imprimir Oblea y Tarjetas QR en A4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
