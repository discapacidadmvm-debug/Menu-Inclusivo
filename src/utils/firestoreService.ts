import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import type {
  ComercioAdmin,
  ComercioPublico,
  PictogramaItem,
  PlatoMenu,
  RubroComercio,
} from '../types.ts';
import { ARASAAC_LOCAL_CATALOG } from '../data/arasaacCatalog.ts';
import { calcularVigenciaHabilitacion } from './dates.ts';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'discapacidadgovmvm@gmail.com';

interface FirestoreComercioDoc {
  id: string;
  slug: string;
  nombre: string;
  rubro: RubroComercio;
  direccion: string;
  telefono: string;
  fechaHabilitacion: string;
  activa: boolean;
  obleaNumero: string;
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

export function buildDefaultSeedData(): {
  comercios: Array<FirestoreComercioDoc & { password: string }>;
  platos: PlatoMenu[];
} {
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
  };
}

function slugify(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 110) || `comercio-${Date.now()}`
  );
}

function sanitizeId(raw: string, prefix: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '');
  if (cleaned.length >= 1 && cleaned.length <= 128) return cleaned;
  return `${prefix}-${Date.now()}`;
}

function sanitizePictogramas(list: PictogramaItem[]): PictogramaItem[] {
  return (Array.isArray(list) ? list : []).slice(0, 25).map((pg) => ({
    id: String(pg.id || `pg-${Date.now()}`).slice(0, 128),
    label: String(pg.label || 'Ingrediente').trim().slice(0, 80),
    imageUrl: String(pg.imageUrl || '').slice(0, 250000),
    source:
      pg.source === 'arasaac' || pg.source === 'custom' ? pg.source : 'catalogo',
  }));
}

function toComercioPublico(c: FirestoreComercioDoc): ComercioPublico {
  return {
    id: c.id,
    slug: c.slug,
    nombre: c.nombre,
    rubro: c.rubro,
    direccion: c.direccion,
    telefono: c.telefono,
    fechaHabilitacion: c.fechaHabilitacion,
    activa: Boolean(c.activa),
    obleaNumero: c.obleaNumero,
    vigencia: calcularVigenciaHabilitacion(c.fechaHabilitacion),
  };
}

export async function fsIsUserAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if ((user.email || '').toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function fsSeedInitialDataIfEmpty(): Promise<boolean> {
  const comerciosPath = 'comercios';
  try {
    const existingSnap = await getDocs(query(collection(db, comerciosPath), limit(1)));
    if (!existingSnap.empty) {
      return false;
    }

    const seed = buildDefaultSeedData();
    const batch = writeBatch(db);

    for (const c of seed.comercios) {
      const comRef = doc(db, 'comercios', c.id);
      batch.set(comRef, {
        id: c.id,
        slug: c.slug,
        nombre: c.nombre,
        rubro: c.rubro,
        direccion: c.direccion,
        telefono: c.telefono,
        fechaHabilitacion: c.fechaHabilitacion,
        activa: c.activa,
        obleaNumero: c.obleaNumero,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const credRef = doc(db, 'comercios_credentials', c.id);
      batch.set(credRef, {
        comercioId: c.id,
        accessCode: c.password,
        updatedAt: serverTimestamp(),
      });
    }

    for (const p of seed.platos) {
      const platoRef = doc(db, 'comercios', p.comercioId, 'platos', p.id);
      batch.set(platoRef, {
        id: p.id,
        comercioId: p.comercioId,
        categoria: p.categoria,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precioArs: p.precioArs,
        fotoUrl: p.fotoUrl,
        libreDeTacc: p.libreDeTacc,
        disponible: p.disponible,
        pictogramas: sanitizePictogramas(p.pictogramas),
        orden: p.orden,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, comerciosPath);
  }
}

export async function fsGetPublicComercios(): Promise<
  Array<ComercioPublico & { cantidadPlatos?: number }>
> {
  const path = 'comercios';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      // Si todavía no se inicializó Firestore por un admin, mostramos referencia inicial de lectura
      const seed = buildDefaultSeedData();
      return seed.comercios.map((c) => ({
        ...toComercioPublico(c),
        cantidadPlatos: seed.platos.filter(
          (p) => p.comercioId === c.id && p.disponible
        ).length,
      }));
    }

    const comercios = snap.docs.map((d) => d.data() as FirestoreComercioDoc);
    const counts = await Promise.all(
      comercios.map(async (c) => {
        const platosSnap = await getDocs(
          collection(db, 'comercios', c.id, 'platos')
        );
        return platosSnap.docs.filter((pd) => Boolean(pd.data().disponible)).length;
      })
    );

    return comercios
      .map((c, idx) => ({
        ...toComercioPublico(c),
        cantidadPlatos: counts[idx] ?? 0,
      }))
      .sort((a, b) => a.obleaNumero.localeCompare(b.obleaNumero));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fsGetPublicCarta(
  slug: string
): Promise<{ comercio: ComercioPublico; platos: PlatoMenu[] } | null> {
  const path = 'comercios';
  try {
    const q = query(collection(db, path), where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);

    let comercioDoc: FirestoreComercioDoc | null = null;
    if (!snap.empty) {
      comercioDoc = snap.docs[0].data() as FirestoreComercioDoc;
    } else {
      // Intentar por ID directo si se pasó un ID en lugar de slug
      const directSnap = await getDoc(doc(db, path, slug));
      if (directSnap.exists()) {
        comercioDoc = directSnap.data() as FirestoreComercioDoc;
      }
    }

    if (!comercioDoc) {
      // Respaldo de solo lectura si Firestore aún no fue inicializado
      const allSnap = await getDocs(query(collection(db, path), limit(1)));
      if (allSnap.empty) {
        const seed = buildDefaultSeedData();
        const c = seed.comercios.find(
          (item) => item.slug === slug || item.id === slug
        );
        if (!c) return null;
        return {
          comercio: toComercioPublico(c),
          platos: seed.platos
            .filter((p) => p.comercioId === c.id && p.disponible)
            .sort((a, b) => a.orden - b.orden),
        };
      }
      return null;
    }

    const platosPath = `comercios/${comercioDoc.id}/platos`;
    const platosSnap = await getDocs(collection(db, platosPath));
    const platos = platosSnap.docs
      .map((d) => d.data() as PlatoMenu)
      .filter((p) => Boolean(p.disponible))
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    return {
      comercio: toComercioPublico(comercioDoc),
      platos,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${path}/${slug}`);
  }
}

export async function fsGetAdminComercios(): Promise<ComercioAdmin[]> {
  const path = 'comercios';
  try {
    const [comerciosSnap, credsSnap] = await Promise.all([
      getDocs(collection(db, 'comercios')),
      getDocs(collection(db, 'comercios_credentials')),
    ]);

    const credMap = new Map<string, string>();
    for (const d of credsSnap.docs) {
      const data = d.data() as { comercioId?: string; accessCode?: string };
      credMap.set(d.id, data.accessCode || '');
    }

    const comercios = comerciosSnap.docs.map((d) => d.data() as FirestoreComercioDoc);
    const platoCounts = await Promise.all(
      comercios.map(async (c) => {
        const ps = await getDocs(collection(db, 'comercios', c.id, 'platos'));
        return ps.size;
      })
    );

    return comercios
      .map((c, idx) => ({
        ...toComercioPublico(c),
        password: credMap.get(c.id) || '',
        cantidadPlatos: platoCounts[idx] ?? 0,
      }))
      .sort((a, b) => a.obleaNumero.localeCompare(b.obleaNumero));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fsCreateComercio(payload: {
  nombre: string;
  rubro: RubroComercio;
  direccion: string;
  telefono: string;
  password: string;
  fechaHabilitacion: string;
}): Promise<{ ok: boolean; comercio?: ComercioAdmin; error?: string }> {
  const nombre = payload.nombre.trim().slice(0, 140);
  const password = payload.password.trim().slice(0, 80);
  const fechaHabilitacion = payload.fechaHabilitacion.trim().slice(0, 10);

  if (!nombre || password.length < 4 || !/^\d{4}-\d{2}-\d{2}$/.test(fechaHabilitacion)) {
    return {
      ok: false,
      error:
        'Nombre, contraseña (mínimo 4 caracteres) y fecha de habilitación son obligatorios.',
    };
  }

  const path = 'comercios';
  try {
    const existingSnap = await getDocs(collection(db, path));
    const existingSlugs = new Set(
      existingSnap.docs.map((d) => String(d.data().slug || ''))
    );

    const baseSlug = slugify(nombre);
    let slug = baseSlug;
    let suffix = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug.slice(0, 110)}-${suffix++}`;
    }

    const id = `com-${Date.now()}`;
    const obleaNumero = `VM-INC-${String(existingSnap.size + 1).padStart(3, '0')}`;
    const docData: FirestoreComercioDoc = {
      id,
      slug,
      nombre,
      rubro: payload.rubro || 'Restaurante',
      direccion: (payload.direccion.trim() || 'Vicuña Mackenna, Córdoba').slice(0, 200),
      telefono: payload.telefono.trim().slice(0, 50),
      fechaHabilitacion,
      activa: true,
      obleaNumero,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'comercios', id), {
      ...docData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'comercios_credentials', id), {
      comercioId: id,
      accessCode: password,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    return {
      ok: true,
      comercio: {
        ...toComercioPublico(docData),
        password,
        cantidadPlatos: 0,
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fsUpdateComercio(
  id: string,
  patch: Partial<FirestoreComercioDoc & { password: string }>
): Promise<{ ok: boolean; error?: string }> {
  const path = `comercios/${id}`;
  try {
    const comRef = doc(db, 'comercios', id);
    const snap = await getDoc(comRef);
    if (!snap.exists()) {
      return { ok: false, error: 'Comercio no encontrado.' };
    }

    const batch = writeBatch(db);
    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (patch.nombre !== undefined) {
      updatePayload.nombre = patch.nombre.trim().slice(0, 140);
    }
    if (patch.rubro !== undefined) {
      updatePayload.rubro = patch.rubro;
    }
    if (patch.direccion !== undefined) {
      updatePayload.direccion = patch.direccion.trim().slice(0, 200);
    }
    if (patch.telefono !== undefined) {
      updatePayload.telefono = patch.telefono.trim().slice(0, 50);
    }
    if (patch.fechaHabilitacion !== undefined) {
      updatePayload.fechaHabilitacion = patch.fechaHabilitacion.trim().slice(0, 10);
    }
    if (patch.activa !== undefined) {
      updatePayload.activa = Boolean(patch.activa);
    }
    if (patch.slug !== undefined) {
      updatePayload.slug = patch.slug;
    }
    if (patch.obleaNumero !== undefined) {
      updatePayload.obleaNumero = patch.obleaNumero.slice(0, 40);
    }

    batch.update(comRef, updatePayload);

    if (patch.password !== undefined && patch.password.trim()) {
      const accessCode = patch.password.trim().slice(0, 80);
      if (accessCode.length < 4) {
        return {
          ok: false,
          error: 'La contraseña del comercio debe tener al menos 4 caracteres.',
        };
      }
      batch.set(
        doc(db, 'comercios_credentials', id),
        {
          comercioId: id,
          accessCode,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    return { ok: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsDeleteComercio(id: string): Promise<void> {
  const path = `comercios/${id}`;
  try {
    const [platosSnap, pictosSnap, membersSnap] = await Promise.all([
      getDocs(collection(db, 'comercios', id, 'platos')),
      getDocs(collection(db, 'comercios', id, 'pictogramasCustom')),
      getDocs(collection(db, 'comercios', id, 'members')),
    ]);

    const batch = writeBatch(db);
    platosSnap.docs.forEach((d) => batch.delete(d.ref));
    pictosSnap.docs.forEach((d) => batch.delete(d.ref));
    membersSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'comercios_credentials', id));
    batch.delete(doc(db, 'comercios', id));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsAuthComercioWithPassword(
  comercioId: string,
  password: string,
  user: User | null
): Promise<{ ok: boolean; comercio?: ComercioPublico; error?: string }> {
  if (!user || !user.emailVerified) {
    return {
      ok: false,
      error: 'Primero conectá tu cuenta Google verificada para acceder al comercio.',
    };
  }

  const trimmedCode = password.trim();
  if (trimmedCode.length < 4) {
    return { ok: false, error: 'Contraseña habilitada incorrecta.' };
  }

  const comPath = `comercios/${comercioId}`;
  let comercioSnap;
  try {
    comercioSnap = await getDoc(doc(db, 'comercios', comercioId));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, comPath);
  }

  if (!comercioSnap.exists()) {
    return { ok: false, error: 'Comercio no encontrado en la base de datos.' };
  }

  const memberPath = `comercios/${comercioId}/members/${user.uid}`;
  try {
    const memberRef = doc(db, 'comercios', comercioId, 'members', user.uid);
    const existingMember = await getDoc(memberRef);
    if (existingMember.exists()) {
      await updateDoc(memberRef, {
        accessCode: trimmedCode,
        joinedAt: serverTimestamp(),
      });
    } else {
      await setDoc(memberRef, {
        uid: user.uid,
        comercioId,
        accessCode: trimmedCode,
        joinedAt: serverTimestamp(),
      });
    }

    return {
      ok: true,
      comercio: toComercioPublico(comercioSnap.data() as FirestoreComercioDoc),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('permission-denied') ||
      msg.includes('Missing or insufficient permissions')
    ) {
      return {
        ok: false,
        error: 'Contraseña habilitada incorrecta para este comercio.',
      };
    }
    handleFirestoreError(error, OperationType.WRITE, memberPath);
  }
}

export async function fsGetMerchantMenu(comercioId: string): Promise<{
  comercio: ComercioPublico;
  platos: PlatoMenu[];
  customPictograms: PictogramaItem[];
} | null> {
  const path = `comercios/${comercioId}`;
  try {
    const [comSnap, platosSnap, customSnap] = await Promise.all([
      getDoc(doc(db, 'comercios', comercioId)),
      getDocs(collection(db, 'comercios', comercioId, 'platos')),
      getDocs(collection(db, 'comercios', comercioId, 'pictogramasCustom')),
    ]);

    if (!comSnap.exists()) return null;

    const platos = platosSnap.docs
      .map((d) => d.data() as PlatoMenu)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

    const customPictograms = customSnap.docs.map((d) => {
      const raw = d.data() as PictogramaItem;
      return {
        id: raw.id,
        label: raw.label,
        imageUrl: raw.imageUrl,
        source: 'custom' as const,
      };
    });

    return {
      comercio: toComercioPublico(comSnap.data() as FirestoreComercioDoc),
      platos,
      customPictograms,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fsSavePlato(
  comercioId: string,
  platoId: string | null,
  body: Partial<PlatoMenu>
): Promise<{ ok: boolean; error?: string }> {
  const nombre = (body.nombre || '').trim().slice(0, 160);
  if (!nombre) {
    return { ok: false, error: 'El nombre del plato es obligatorio.' };
  }

  const targetId = platoId
    ? sanitizeId(platoId, 'pla')
    : sanitizeId(String(body.id || `pla-${Date.now()}`), 'pla');
  const path = `comercios/${comercioId}/platos/${targetId}`;

  try {
    if (platoId) {
      await updateDoc(doc(db, 'comercios', comercioId, 'platos', targetId), {
        categoria: String(body.categoria || 'Platos Principales').slice(0, 60),
        nombre,
        descripcion: String(body.descripcion || '').trim().slice(0, 1000),
        precioArs: Math.max(0, Math.min(Number(body.precioArs) || 0, 10000000)),
        fotoUrl: String(body.fotoUrl || '').slice(0, 700000),
        libreDeTacc: Boolean(body.libreDeTacc),
        disponible:
          body.disponible !== undefined ? Boolean(body.disponible) : true,
        pictogramas: sanitizePictogramas(body.pictogramas || []),
        updatedAt: serverTimestamp(),
      });
      return { ok: true };
    }

    const platosSnap = await getDocs(collection(db, 'comercios', comercioId, 'platos'));
    const maxOrden = platosSnap.docs.reduce(
      (max, d) => Math.max(max, Number(d.data().orden) || 0),
      0
    );

    await setDoc(doc(db, 'comercios', comercioId, 'platos', targetId), {
      id: targetId,
      comercioId,
      categoria: String(body.categoria || 'Platos Principales').slice(0, 60),
      nombre,
      descripcion: String(body.descripcion || '').trim().slice(0, 1000),
      precioArs: Math.max(0, Math.min(Number(body.precioArs) || 0, 10000000)),
      fotoUrl: String(body.fotoUrl || '').slice(0, 700000),
      libreDeTacc: Boolean(body.libreDeTacc),
      disponible:
        body.disponible !== undefined ? Boolean(body.disponible) : true,
      pictogramas: sanitizePictogramas(body.pictogramas || []),
      orden: maxOrden + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    handleFirestoreError(
      error,
      platoId ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function fsDeletePlato(
  comercioId: string,
  platoId: string
): Promise<void> {
  const path = `comercios/${comercioId}/platos/${platoId}`;
  try {
    await deleteDoc(doc(db, 'comercios', comercioId, 'platos', platoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsSaveCustomPictogram(
  comercioId: string,
  label: string,
  imageUrl: string
): Promise<PictogramaItem | null> {
  const cleanLabel = label.trim().slice(0, 80);
  const cleanImg = imageUrl.trim().slice(0, 250000);
  if (!cleanLabel || !cleanImg) return null;

  const id = `custom-${Date.now()}`;
  const path = `comercios/${comercioId}/pictogramasCustom/${id}`;
  try {
    await setDoc(doc(db, 'comercios', comercioId, 'pictogramasCustom', id), {
      id,
      comercioId,
      label: cleanLabel,
      imageUrl: cleanImg,
      source: 'custom',
      createdAt: serverTimestamp(),
    });
    return {
      id,
      label: cleanLabel,
      imageUrl: cleanImg,
      source: 'custom',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
