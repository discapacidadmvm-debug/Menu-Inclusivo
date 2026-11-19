import fs from 'fs';
import path from 'path';
import type {
  ComercioAdmin,
  ComercioPublico,
  PictogramaItem,
  PlatoMenu,
  RubroComercio,
} from '../src/types.ts';
import { ARASAAC_LOCAL_CATALOG } from '../src/data/arasaacCatalog.ts';
import { calcularVigenciaHabilitacion } from '../src/utils/dates.ts';

export interface StoredComercio {
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

export interface CustomPictogramRecord extends PictogramaItem {
  comercioId: string;
}

export interface DatabaseState {
  comercios: StoredComercio[];
  platos: PlatoMenu[];
  customPictograms: CustomPictogramRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function pickCat(id: string): PictogramaItem {
  const found = ARASAAC_LOCAL_CATALOG.find((c) => c.id === id);
  if (!found) {
    return {
      id,
      label: id,
      imageUrl: '',
      source: 'catalogo',
    };
  }
  return {
    id: found.id,
    label: found.label,
    imageUrl: found.imageUrl,
    source: found.source,
  };
}

function createInitialSeed(): DatabaseState {
  const comercios: StoredComercio[] = [
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
      fechaHabilitacion: isoDaysAgo(330), // 35 días restantes -> Alerta 8 semanas
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
      fechaHabilitacion: isoDaysAgo(380), // Vencida hace ~15 días
      activa: true,
      obleaNumero: 'VM-INC-003',
    },
  ];

  const platos: PlatoMenu[] = [
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
      categoria: 'Cafetería y Panadería',
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
  ];

  return {
    comercios,
    platos,
    customPictograms: [],
  };
}

let memoryCache: DatabaseState | null = null;

export function loadDb(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      const initial = memoryCache || createInitialSeed();
      memoryCache = initial;
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      } catch {
        // ignore if filesystem is read-only
      }
      return initial;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseState;
    if (!Array.isArray(parsed.comercios)) {
      throw new Error('Invalid DB shape');
    }
    memoryCache = parsed;
    return parsed;
  } catch {
    const fallback = memoryCache || createInitialSeed();
    memoryCache = fallback;
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf-8');
    } catch {
      // ignore if filesystem is read-only
    }
    return fallback;
  }
}

export function saveDb(state: DatabaseState): void {
  memoryCache = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch {
    // keep in-memory state if disk write is unavailable
  }
}

export function toComercioPublico(c: StoredComercio): ComercioPublico {
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

export function toComercioAdmin(
  c: StoredComercio,
  platos: PlatoMenu[]
): ComercioAdmin {
  return {
    ...toComercioPublico(c),
    password: c.password,
    cantidadPlatos: platos.filter((p) => p.comercioId === c.id).length,
  };
}

export function slugifyNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
