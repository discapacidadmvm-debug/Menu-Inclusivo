import type {
  ComercioAdmin,
  ComercioPublico,
  IdiomaCodigo,
  PictogramaItem,
  PlatoMenu,
  RubroComercio,
  TranslatedPlatoFields,
} from '../types.ts';
import { ARASAAC_LOCAL_CATALOG, searchLocalCatalog } from '../data/arasaacCatalog.ts';
import { calcularVigenciaHabilitacion } from './dates.ts';

const ADMIN_FALLBACK_PASSWORDS = ['mackenna2026'];
const LS_KEY = 'carta_inclusiva_mackenna_db_v1';

interface LocalComercio {
  id: string;
  slug: string;
  nombre: string;
  rubro: RubroComercio;
  direccion: string;
  telefono: string;
  password: string;
  fechaHabilitacion: string;
  activa: boolean;
  obleaNumero: string;
}

interface LocalCustomPicto extends PictogramaItem {
  comercioId: string;
}

interface LocalDbState {
  comercios: LocalComercio[];
  platos: PlatoMenu[];
  customPictograms: LocalCustomPicto[];
}

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function pickCat(id: string): PictogramaItem {
  const found = ARASAAC_LOCAL_CATALOG.find((c) => c.id === id);
  if (!found) {
    return { id, label: id, imageUrl: '', source: 'catalogo' };
  }
  return {
    id: found.id,
    label: found.label,
    imageUrl: found.imageUrl,
    source: found.source,
  };
}

function buildFallbackSeed(): LocalDbState {
  return {
    comercios: [
      {
        id: 'com-1',
        slug: 'bodegon-el-encuentro',
        nombre: 'Bodegón El Encuentro',
        rubro: 'Restaurante',
        direccion: 'Av. Sarmiento 412, Vicuña Mackenna, Córdoba',
        telefono: '03583 42-1890',
        password: 'milan2026',
        fechaHabilitacion: isoDaysAgo(120),
        activa: true,
        obleaNumero: 'VM-INC-001',
      },
      {
        id: 'com-2',
        slug: 'cafe-plaza-mackenna',
        nombre: 'Café y Confitería Plaza',
        rubro: 'Café',
        direccion: 'Belgrano 185 (frente a Plaza Sarmiento), Vicuña Mackenna',
        telefono: '03583 42-3410',
        password: 'cafe2026',
        fechaHabilitacion: isoDaysAgo(330),
        activa: true,
        obleaNumero: 'VM-INC-002',
      },
      {
        id: 'com-3',
        slug: 'heladeria-los-tilos',
        nombre: 'Heladería Artesanal Los Tilos',
        rubro: 'Heladería',
        direccion: 'San Martín 620, Vicuña Mackenna, Córdoba',
        telefono: '03583 42-5122',
        password: 'helado2026',
        fechaHabilitacion: isoDaysAgo(380),
        activa: true,
        obleaNumero: 'VM-INC-003',
      },
    ],
    platos: [
      {
        id: 'pla-1',
        comercioId: 'com-1',
        categoria: 'Platos Principales',
        nombre: 'Milanesa a la Napolitana con Papas Fritas',
        descripcion:
          'Milanesa de ternera cubierta con salsa de tomate casera, jamón cocido, queso muzzarella gratinado y orégano. Incluye guarnición de papas fritas.',
        precioArs: 14500,
        fotoUrl: '/src/assets/images/dish_milanesa_napolitana_1795101212946.jpg',
        libreDeTacc: false,
        disponible: true,
        pictogramas: [
          pickCat('cat-milanesa'),
          pickCat('cat-jamon'),
          pickCat('cat-queso'),
          pickCat('cat-tomate'),
          pickCat('cat-papas-fritas'),
        ],
        orden: 1,
      },
      {
        id: 'pla-2',
        comercioId: 'com-1',
        categoria: 'Entradas',
        nombre: 'Empanadas Criollas al Horno (3 unidades)',
        descripcion:
          'Tres empanadas horneadas rellenas de carne vacuna cortada a cuchillo, cebolla y huevo duro, acompañadas con gajo de limón.',
        precioArs: 5400,
        fotoUrl: '/src/assets/images/dish_empanadas_criollas_1795101212958.jpg',
        libreDeTacc: false,
        disponible: true,
        pictogramas: [
          pickCat('cat-empanada'),
          pickCat('cat-carne'),
          pickCat('cat-cebolla'),
          pickCat('cat-huevo'),
          pickCat('cat-limon'),
        ],
        orden: 2,
      },
      {
        id: 'pla-3',
        comercioId: 'com-1',
        categoria: 'Platos Principales',
        nombre: 'Suprema Grillada con Ensalada Mixta (Sin TACC)',
        descripcion:
          'Pechuga de pollo a la plancha sin rebozar, preparada en sector libre de gluten, servida con ensalada fresca de lechuga, tomate y limón.',
        precioArs: 12800,
        fotoUrl: '',
        libreDeTacc: true,
        disponible: true,
        pictogramas: [
          pickCat('cat-pollo'),
          pickCat('cat-ensalada'),
          pickCat('cat-tomate'),
          pickCat('cat-limon'),
        ],
        orden: 3,
      },
      {
        id: 'pla-4',
        comercioId: 'com-1',
        categoria: 'Bebidas',
        nombre: 'Agua Mineral sin Gas (500 ml)',
        descripcion: 'Botella cerrada de agua mineral natural sin gas, fría o natural.',
        precioArs: 2200,
        fotoUrl: '',
        libreDeTacc: true,
        disponible: true,
        pictogramas: [pickCat('cat-agua')],
        orden: 4,
      },
      {
        id: 'pla-5',
        comercioId: 'com-2',
        categoria: 'Desayunos y Meriendas',
        nombre: 'Café con Leche y 3 Medialunas de Manteca',
        descripcion:
          'Taza grande de café expreso con leche espumada acompañado de tres medialunas artesanales glaseadas.',
        precioArs: 5800,
        fotoUrl: '/src/assets/images/dish_cafe_medialunas_1795101212622.jpg',
        libreDeTacc: false,
        disponible: true,
        pictogramas: [
          pickCat('cat-cafe'),
          pickCat('cat-leche'),
          pickCat('cat-medialuna'),
        ],
        orden: 1,
      },
      {
        id: 'pla-6',
        comercioId: 'com-2',
        categoria: 'Bebidas',
        nombre: 'Submarino con Chocolate Apto Celíacos',
        descripcion:
          'Vaso de leche caliente entera con barra de chocolate semiamargo certificada sin gluten.',
        precioArs: 4500,
        fotoUrl: '',
        libreDeTacc: true,
        disponible: true,
        pictogramas: [pickCat('cat-leche'), pickCat('cat-chocolate')],
        orden: 2,
      },
      {
        id: 'pla-7',
        comercioId: 'com-3',
        categoria: 'Heladería',
        nombre: 'Copa de Helado Artesanal (2 Bochas)',
        descripcion:
          'Dos bochas generosas a elección: Dulce de Leche Granizado y Chocolate Amargo. Consultar opción en vasito sin oblea apto celíacos.',
        precioArs: 6200,
        fotoUrl: '/src/assets/images/dish_helado_artesanal_1795101212146.jpg',
        libreDeTacc: true,
        disponible: true,
        pictogramas: [
          pickCat('cat-helado'),
          pickCat('cat-dulce-leche'),
          pickCat('cat-chocolate'),
          pickCat('cat-leche'),
        ],
        orden: 1,
      },
    ],
    customPictograms: [],
  };
}

function readLocalDb(): LocalDbState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDbState;
      if (Array.isArray(parsed.comercios) && parsed.comercios.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  const seed = buildFallbackSeed();
  writeLocalDb(seed);
  return seed;
}

function writeLocalDb(state: LocalDbState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function toPub(c: LocalComercio): ComercioPublico {
  return {
    id: c.id,
    slug: c.slug,
    nombre: c.nombre,
    rubro: c.rubro,
    direccion: c.direccion,
    telefono: c.telefono,
    fechaHabilitacion: c.fechaHabilitacion,
    activa: c.activa,
    obleaNumero: c.obleaNumero,
    vigencia: calcularVigenciaHabilitacion(c.fechaHabilitacion),
  };
}

function toAdm(c: LocalComercio, platos: PlatoMenu[]): ComercioAdmin {
  return {
    ...toPub(c),
    password: c.password,
    cantidadPlatos: platos.filter((p) => p.comercioId === c.id).length,
  };
}

function slugify(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function tryApiJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; data?: T }> {
  try {
    const res = await fetch(url, options);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return { ok: false, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function apiAuthAdmin(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await tryApiJson<{ ok?: boolean; error?: string }>(
    '/api/auth/admin',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }
  );
  if (res.data) {
    return res.ok ? { ok: true } : { ok: false, error: res.data.error || 'Contraseña incorrecta.' };
  }
  if (ADMIN_FALLBACK_PASSWORDS.includes(password.trim())) {
    return { ok: true };
  }
  return { ok: false, error: 'Contraseña municipal incorrecta.' };
}

export async function apiAuthComercio(
  comercioId: string,
  password: string
): Promise<{ ok: boolean; comercio?: ComercioPublico; error?: string }> {
  const res = await tryApiJson<{ ok?: boolean; comercio?: ComercioPublico; error?: string }>(
    '/api/auth/comercio',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comercioId, password }),
    }
  );
  if (res.data) {
    if (res.ok && res.data.comercio) {
      return { ok: true, comercio: res.data.comercio };
    }
    return { ok: false, error: res.data.error || 'Contraseña incorrecta.' };
  }
  const db = readLocalDb();
  const found = db.comercios.find((c) => c.id === comercioId || c.slug === comercioId);
  if (!found) return { ok: false, error: 'Comercio no encontrado.' };
  if (found.password !== password.trim()) {
    return { ok: false, error: 'Contraseña habilitada incorrecta.' };
  }
  return { ok: true, comercio: toPub(found) };
}

export async function apiGetPublicComercios(): Promise<
  Array<ComercioPublico & { cantidadPlatos?: number }>
> {
  const res = await tryApiJson<{
    comercios: Array<ComercioPublico & { cantidadPlatos?: number }>;
  }>('/api/public/comercios');
  if (res.ok && res.data && Array.isArray(res.data.comercios)) {
    return res.data.comercios;
  }
  const db = readLocalDb();
  return db.comercios.map((c) => ({
    ...toPub(c),
    cantidadPlatos: db.platos.filter((p) => p.comercioId === c.id && p.disponible).length,
  }));
}

export async function apiGetPublicCarta(
  slug: string
): Promise<{ comercio: ComercioPublico; platos: PlatoMenu[] } | null> {
  const res = await tryApiJson<{ comercio: ComercioPublico; platos: PlatoMenu[] }>(
    `/api/public/carta/${encodeURIComponent(slug)}`
  );
  if (res.ok && res.data?.comercio) {
    return res.data;
  }
  const db = readLocalDb();
  const c = db.comercios.find((item) => item.slug === slug || item.id === slug);
  if (!c) return null;
  const platos = db.platos
    .filter((p) => p.comercioId === c.id && p.disponible)
    .sort((a, b) => a.orden - b.orden);
  return { comercio: toPub(c), platos };
}

export async function apiGetAdminComercios(): Promise<ComercioAdmin[]> {
  const res = await tryApiJson<{ comercios: ComercioAdmin[] }>('/api/admin/comercios');
  if (res.ok && res.data && Array.isArray(res.data.comercios)) {
    return res.data.comercios;
  }
  const db = readLocalDb();
  return db.comercios.map((c) => toAdm(c, db.platos));
}

export async function apiCreateComercio(payload: {
  nombre: string;
  rubro: RubroComercio;
  direccion: string;
  telefono: string;
  password: string;
  fechaHabilitacion: string;
}): Promise<{ ok: boolean; comercio?: ComercioAdmin; error?: string }> {
  const res = await tryApiJson<{ comercio?: ComercioAdmin; error?: string }>(
    '/api/admin/comercios',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  if (res.data) {
    return res.ok && res.data.comercio
      ? { ok: true, comercio: res.data.comercio }
      : { ok: false, error: res.data.error || 'No se pudo guardar.' };
  }

  const db = readLocalDb();
  let baseSlug = slugify(payload.nombre) || `comercio-${Date.now()}`;
  let slug = baseSlug;
  let i = 2;
  while (db.comercios.some((c) => c.slug === slug)) {
    slug = `${baseSlug}-${i++}`;
  }
  const nextNum = String(db.comercios.length + 1).padStart(3, '0');
  const nuevo: LocalComercio = {
    id: `com-${Date.now()}`,
    slug,
    nombre: payload.nombre.trim(),
    rubro: payload.rubro,
    direccion: payload.direccion.trim() || 'Vicuña Mackenna, Córdoba',
    telefono: payload.telefono.trim(),
    password: payload.password.trim(),
    fechaHabilitacion: payload.fechaHabilitacion,
    activa: true,
    obleaNumero: `VM-INC-${nextNum}`,
  };
  db.comercios.push(nuevo);
  writeLocalDb(db);
  return { ok: true, comercio: toAdm(nuevo, db.platos) };
}

export async function apiUpdateComercio(
  id: string,
  patch: Partial<LocalComercio>
): Promise<{ ok: boolean; error?: string }> {
  const res = await tryApiJson<{ comercio?: ComercioAdmin; error?: string }>(
    `/api/admin/comercios/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }
  );
  if (res.data) {
    return res.ok ? { ok: true } : { ok: false, error: res.data.error };
  }

  const db = readLocalDb();
  const idx = db.comercios.findIndex((c) => c.id === id);
  if (idx === -1) return { ok: false, error: 'Comercio no encontrado.' };
  db.comercios[idx] = { ...db.comercios[idx], ...patch };
  writeLocalDb(db);
  return { ok: true };
}

export async function apiDeleteComercio(id: string): Promise<void> {
  const res = await tryApiJson(`/api/admin/comercios/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (res.ok) return;
  const db = readLocalDb();
  db.comercios = db.comercios.filter((c) => c.id !== id);
  db.platos = db.platos.filter((p) => p.comercioId !== id);
  writeLocalDb(db);
}

export async function apiGetMerchantMenu(comercioId: string): Promise<{
  comercio: ComercioPublico;
  platos: PlatoMenu[];
  customPictograms: PictogramaItem[];
} | null> {
  const res = await tryApiJson<{
    comercio: ComercioPublico;
    platos: PlatoMenu[];
    customPictograms: PictogramaItem[];
  }>(`/api/comercio/${encodeURIComponent(comercioId)}/menu`);
  if (res.ok && res.data?.comercio) {
    return res.data;
  }
  const db = readLocalDb();
  const c = db.comercios.find((item) => item.id === comercioId);
  if (!c) return null;
  return {
    comercio: toPub(c),
    platos: db.platos
      .filter((p) => p.comercioId === c.id)
      .sort((a, b) => a.orden - b.orden),
    customPictograms: db.customPictograms.filter((pg) => pg.comercioId === c.id),
  };
}

export async function apiSavePlato(
  comercioId: string,
  platoId: string | null,
  body: Partial<PlatoMenu>
): Promise<{ ok: boolean; error?: string }> {
  const url = platoId
    ? `/api/comercio/${encodeURIComponent(comercioId)}/platos/${encodeURIComponent(platoId)}`
    : `/api/comercio/${encodeURIComponent(comercioId)}/platos`;
  const method = platoId ? 'PATCH' : 'POST';

  const res = await tryApiJson<{ plato?: PlatoMenu; error?: string }>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.data) {
    return res.ok ? { ok: true } : { ok: false, error: res.data.error };
  }

  const db = readLocalDb();
  if (platoId) {
    const idx = db.platos.findIndex(
      (p) => p.id === platoId && p.comercioId === comercioId
    );
    if (idx === -1) return { ok: false, error: 'Plato no encontrado.' };
    db.platos[idx] = { ...db.platos[idx], ...body } as PlatoMenu;
  } else {
    const maxOrden = db.platos
      .filter((p) => p.comercioId === comercioId)
      .reduce((m, p) => Math.max(m, p.orden), 0);
    db.platos.push({
      id: (body.id as string) || `pla-${Date.now()}`,
      comercioId,
      categoria: body.categoria || 'Platos Principales',
      nombre: (body.nombre || '').trim(),
      descripcion: (body.descripcion || '').trim(),
      precioArs: Number(body.precioArs) || 0,
      fotoUrl: body.fotoUrl || '',
      libreDeTacc: Boolean(body.libreDeTacc),
      disponible: body.disponible !== undefined ? Boolean(body.disponible) : true,
      pictogramas: body.pictogramas || [],
      orden: maxOrden + 1,
    });
  }
  writeLocalDb(db);
  return { ok: true };
}

export async function apiDeletePlato(
  comercioId: string,
  platoId: string
): Promise<void> {
  const res = await tryApiJson(
    `/api/comercio/${encodeURIComponent(comercioId)}/platos/${encodeURIComponent(platoId)}`,
    { method: 'DELETE' }
  );
  if (res.ok) return;
  const db = readLocalDb();
  db.platos = db.platos.filter(
    (p) => !(p.id === platoId && p.comercioId === comercioId)
  );
  writeLocalDb(db);
}

export async function apiSaveCustomPictogram(
  comercioId: string,
  label: string,
  imageUrl: string
): Promise<PictogramaItem | null> {
  const res = await tryApiJson<{ pictograma?: PictogramaItem }>(
    `/api/comercio/${encodeURIComponent(comercioId)}/pictogramas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, imageUrl }),
    }
  );
  if (res.ok && res.data?.pictograma) {
    return res.data.pictograma;
  }
  const db = readLocalDb();
  const record: LocalCustomPicto = {
    id: `custom-${Date.now()}`,
    comercioId,
    label,
    imageUrl,
    source: 'custom',
  };
  db.customPictograms.push(record);
  writeLocalDb(db);
  return record;
}

export interface ArasaacSearchResponse {
  results: PictogramaItem[];
  totalRemote: number;
  hasMore: boolean;
}

export async function apiSearchArasaac(
  queryText: string,
  options?: { cat?: string; limit?: number }
): Promise<ArasaacSearchResponse> {
  const cat = options?.cat || 'todos';
  const limit = options?.limit ?? 80;
  const params = new URLSearchParams();
  if (queryText.trim()) params.set('q', queryText.trim());
  if (cat) params.set('cat', cat);
  params.set('limit', String(limit));

  const res = await tryApiJson<{
    results: PictogramaItem[];
    totalRemote?: number;
    hasMore?: boolean;
  }>(`/api/arasaac/search?${params.toString()}`);

  if (res.ok && res.data?.results) {
    return {
      results: res.data.results,
      totalRemote: res.data.totalRemote ?? res.data.results.length,
      hasMore: Boolean(res.data.hasMore),
    };
  }

  // Fallback directo (p. ej. hosting estático): catálogo local completo + API oficial ARASAAC (CORS abierto)
  const localItems: PictogramaItem[] = searchLocalCatalog(
    queryText.trim() || (cat !== 'todos' ? cat : '')
  ).map((c) => ({
    id: c.id,
    label: c.label,
    imageUrl: c.imageUrl,
    source: 'catalogo',
  }));

  const remoteItems: PictogramaItem[] = [];
  const searchTerm =
    queryText.trim().length >= 2
      ? queryText.trim()
      : cat !== 'todos'
        ? cat
        : 'alimento';
  try {
    const r = await fetch(
      `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(searchTerm)}`
    );
    if (r.ok) {
      const data = (await r.json()) as Array<{
        _id: number;
        keywords?: Array<{ keyword?: string }>;
      }>;
      if (Array.isArray(data)) {
        for (const item of data.slice(0, limit)) {
          const kwLabel = item.keywords?.[0]?.keyword || searchTerm;
          remoteItems.push({
            id: `arasaac-${item._id}`,
            label: kwLabel.charAt(0).toUpperCase() + kwLabel.slice(1),
            imageUrl: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`,
            source: 'arasaac',
          });
        }
        return {
          results: [...localItems, ...remoteItems],
          totalRemote: data.length,
          hasMore: data.length > limit,
        };
      }
    }
  } catch {
    // Silencioso: al menos devolvemos el catálogo local completo
  }

  return {
    results: localItems,
    totalRemote: 0,
    hasMore: false,
  };
}

export async function apiTranslateMenu(
  slug: string,
  targetLang: IdiomaCodigo
): Promise<Record<string, TranslatedPlatoFields>> {
  const res = await tryApiJson<{ translations: Record<string, TranslatedPlatoFields> }>(
    '/api/translate-menu',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, targetLang }),
    }
  );
  if (res.ok && res.data?.translations) {
    return res.data.translations;
  }
  return {};
}
