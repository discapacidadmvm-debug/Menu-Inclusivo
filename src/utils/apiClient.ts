import type {
  ComercioAdmin,
  ComercioPublico,
  IdiomaCodigo,
  PictogramaItem,
  PlatoMenu,
  RubroComercio,
  TranslatedPlatoFields,
} from '../types.ts';
import { searchLocalCatalog } from '../data/arasaacCatalog.ts';
import { auth } from '../firebase.ts';
import {
  fsAuthComercioWithPassword,
  fsCreateComercio,
  fsDeleteComercio,
  fsDeletePlato,
  fsGetAdminComercios,
  fsGetMerchantMenu,
  fsGetPublicCarta,
  fsGetPublicComercios,
  fsSaveCustomPictogram,
  fsSavePlato,
  fsUpdateComercio,
} from './firestoreService.ts';

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

export async function apiAuthComercio(
  comercioId: string,
  password: string
): Promise<{ ok: boolean; comercio?: ComercioPublico; error?: string }> {
  return fsAuthComercioWithPassword(comercioId, password, auth.currentUser);
}

export async function apiGetPublicComercios(): Promise<
  Array<ComercioPublico & { cantidadPlatos?: number }>
> {
  return fsGetPublicComercios();
}

export async function apiGetPublicCarta(
  slug: string
): Promise<{ comercio: ComercioPublico; platos: PlatoMenu[] } | null> {
  return fsGetPublicCarta(slug);
}

export async function apiGetAdminComercios(): Promise<ComercioAdmin[]> {
  return fsGetAdminComercios();
}

export async function apiCreateComercio(payload: {
  nombre: string;
  rubro: RubroComercio;
  direccion: string;
  telefono: string;
  password: string;
  fechaHabilitacion: string;
}): Promise<{ ok: boolean; comercio?: ComercioAdmin; error?: string }> {
  return fsCreateComercio(payload);
}

export async function apiUpdateComercio(
  id: string,
  patch: Partial<{
    nombre: string;
    rubro: RubroComercio;
    direccion: string;
    telefono: string;
    password: string;
    fechaHabilitacion: string;
    activa: boolean;
  }>
): Promise<{ ok: boolean; error?: string }> {
  return fsUpdateComercio(id, patch);
}

export async function apiDeleteComercio(id: string): Promise<void> {
  return fsDeleteComercio(id);
}

export async function apiGetMerchantMenu(comercioId: string): Promise<{
  comercio: ComercioPublico;
  platos: PlatoMenu[];
  customPictograms: PictogramaItem[];
} | null> {
  return fsGetMerchantMenu(comercioId);
}

export async function apiSavePlato(
  comercioId: string,
  platoId: string | null,
  body: Partial<PlatoMenu>
): Promise<{ ok: boolean; error?: string }> {
  return fsSavePlato(comercioId, platoId, body);
}

export async function apiDeletePlato(
  comercioId: string,
  platoId: string
): Promise<void> {
  return fsDeletePlato(comercioId, platoId);
}

export async function apiSaveCustomPictogram(
  comercioId: string,
  label: string,
  imageUrl: string
): Promise<PictogramaItem | null> {
  return fsSaveCustomPictogram(comercioId, label, imageUrl);
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
  targetLang: IdiomaCodigo,
  platos?: PlatoMenu[]
): Promise<Record<string, TranslatedPlatoFields>> {
  const res = await tryApiJson<{ translations: Record<string, TranslatedPlatoFields> }>(
    '/api/translate-menu',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, targetLang, platos }),
    }
  );
  if (res.ok && res.data?.translations) {
    return res.data.translations;
  }
  return {};
}
