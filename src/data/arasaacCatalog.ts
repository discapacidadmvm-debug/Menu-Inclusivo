import type { PictogramaItem } from '../types.ts';

function makePictoSvg(paths: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><rect width="120" height="120" rx="12" fill="#ffffff"/>${paths}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface CatalogPictogramEntry extends PictogramaItem {
  keywords: string[];
  arasaacId?: number;
}

export const ARASAAC_LOCAL_CATALOG: CatalogPictogramEntry[] = [
  {
    id: 'cat-milanesa',
    label: 'Milanesa',
    source: 'catalogo',
    arasaacId: 2515,
    keywords: ['milanesa', 'carne', 'empanada', 'rebozado', 'napolitana', 'bife'],
    imageUrl: makePictoSvg(`
      <ellipse cx="60" cy="64" rx="44" ry="26" fill="#d97706" stroke="#111827" stroke-width="4"/>
      <ellipse cx="60" cy="60" rx="38" ry="20" fill="#f59e0b" stroke="#111827" stroke-width="2.5"/>
      <circle cx="42" cy="57" r="2.5" fill="#78350f"/>
      <circle cx="58" cy="52" r="2.5" fill="#78350f"/>
      <circle cx="74" cy="61" r="2.5" fill="#78350f"/>
      <circle cx="52" cy="66" r="2.5" fill="#78350f"/>
      <circle cx="67" cy="55" r="2" fill="#78350f"/>
    `),
  },
  {
    id: 'cat-jamon',
    label: 'Jamón',
    source: 'catalogo',
    arasaacId: 2435,
    keywords: ['jamon', 'jamón', 'fiambre', 'cerdo', 'cocido', 'crudo'],
    imageUrl: makePictoSvg(`
      <path d="M22 68c0-18 16-34 38-34 20 0 38 14 38 30 0 15-16 24-38 24-22 0-38-6-38-20z" fill="#fda4af" stroke="#111827" stroke-width="4"/>
      <path d="M30 66c0-11 12-22 30-22 15 0 28 9 28 19 0 9-12 15-28 15-16 0-30-4-30-12z" fill="#fb7185" stroke="#111827" stroke-width="2.5"/>
      <circle cx="76" cy="58" r="6" fill="#fff1f2" stroke="#111827" stroke-width="2.5"/>
    `),
  },
  {
    id: 'cat-queso',
    label: 'Queso',
    source: 'catalogo',
    arasaacId: 2541,
    keywords: ['queso', 'muzzarella', 'mozzarella', 'cheddar', 'lacteo', 'lácteo'],
    imageUrl: makePictoSvg(`
      <path d="M18 76L62 28l40 24v32H18V76z" fill="#fde047" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M18 76h84v10H18z" fill="#facc15" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="48" cy="66" r="6" fill="#ca8a04" stroke="#111827" stroke-width="2.5"/>
      <circle cx="72" cy="56" r="5" fill="#ca8a04" stroke="#111827" stroke-width="2.5"/>
      <circle cx="84" cy="70" r="4" fill="#ca8a04" stroke="#111827" stroke-width="2"/>
    `),
  },
  {
    id: 'cat-tomate',
    label: 'Salsa de tomate',
    source: 'catalogo',
    arasaacId: 2594,
    keywords: ['tomate', 'salsa', 'tuco', 'napolitana', 'verdura'],
    imageUrl: makePictoSvg(`
      <circle cx="60" cy="66" r="30" fill="#ef4444" stroke="#111827" stroke-width="4"/>
      <path d="M60 36c-6-10-16-8-18-4 8 0 12 4 18 4zm0 0c6-10 16-8 18-4-8 0-12 4-18 4zm0 0v-12" fill="#22c55e" stroke="#111827" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M44 54c3-5 8-8 14-8" fill="none" stroke="#fecaca" stroke-width="4" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cat-papas-fritas',
    label: 'Papas fritas',
    source: 'catalogo',
    arasaacId: 2501,
    keywords: ['papas', 'papa', 'fritas', 'guarnicion', 'guarnición', 'patatas'],
    imageUrl: makePictoSvg(`
      <rect x="34" y="24" width="10" height="44" rx="3" fill="#facc15" stroke="#111827" stroke-width="3"/>
      <rect x="48" y="18" width="10" height="50" rx="3" fill="#fde047" stroke="#111827" stroke-width="3"/>
      <rect x="62" y="20" width="10" height="48" rx="3" fill="#facc15" stroke="#111827" stroke-width="3"/>
      <rect x="76" y="28" width="10" height="40" rx="3" fill="#fde047" stroke="#111827" stroke-width="3"/>
      <path d="M28 54h64l-8 44H36l-8-44z" fill="#dc2626" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
    `),
  },
  {
    id: 'cat-carne',
    label: 'Carne vacuna',
    source: 'catalogo',
    arasaacId: 2328,
    keywords: ['carne', 'vaca', 'bife', 'asado', 'vacuna', 'relleno', 'empanada'],
    imageUrl: makePictoSvg(`
      <path d="M22 62c0-20 18-32 42-32 22 0 36 12 36 28 0 18-16 32-40 32-22 0-38-10-38-28z" fill="#b91c1c" stroke="#111827" stroke-width="4"/>
      <path d="M32 62c0-13 13-22 32-22 16 0 26 8 26 19 0 12-11 21-30 21-17 0-28-7-28-18z" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
      <circle cx="48" cy="58" r="6" fill="#ffffff" stroke="#111827" stroke-width="2.5"/>
    `),
  },
  {
    id: 'cat-pollo',
    label: 'Pollo',
    source: 'catalogo',
    arasaacId: 2534,
    keywords: ['pollo', 'ave', 'suprema', 'pechuga', 'pata'],
    imageUrl: makePictoSvg(`
      <path d="M34 52c0-16 14-28 32-28 16 0 28 12 28 28 0 14-12 26-28 26-8 0-14-3-20-7L30 88c-4 4-10 4-13 0-3-3-3-9 1-13l18-16c-1-2-2-4-2-7z" fill="#f59e0b" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="22" cy="86" r="5" fill="#fef3c7" stroke="#111827" stroke-width="3"/>
    `),
  },
  {
    id: 'cat-pescado',
    label: 'Pescado',
    source: 'catalogo',
    arasaacId: 2517,
    keywords: ['pescado', 'merluza', 'salmon', 'salmón', 'atun', 'atún', 'mar'],
    imageUrl: makePictoSvg(`
      <path d="M22 60c14-18 38-24 62-12l16-12v48L84 72C60 84 36 78 22 60z" fill="#60a5fa" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="38" cy="56" r="4" fill="#111827"/>
      <path d="M56 46c-4 9-4 19 0 28" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cat-huevo',
    label: 'Huevo',
    source: 'catalogo',
    arasaacId: 2427,
    keywords: ['huevo', 'frito', 'tortilla', 'omelette', 'rebozado'],
    imageUrl: makePictoSvg(`
      <path d="M30 72c-8-14 0-32 16-38 14-6 36-4 46 10 10 14 4 36-14 42-16 6-40 0-48-14z" fill="#ffffff" stroke="#111827" stroke-width="4"/>
      <circle cx="60" cy="62" r="16" fill="#facc15" stroke="#111827" stroke-width="3.5"/>
    `),
  },
  {
    id: 'cat-pan',
    label: 'Pan / Harina',
    source: 'catalogo',
    arasaacId: 2494,
    keywords: ['pan', 'harina', 'trigo', 'tostada', 'sandwich', 'sándwich', 'gluten', 'masa'],
    imageUrl: makePictoSvg(`
      <path d="M20 72c0-22 18-38 40-38s40 16 40 38v12H20V72z" fill="#d97706" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 44l6 14M60 40l6 16M78 46l5 12" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cat-empanada',
    label: 'Empanada',
    source: 'catalogo',
    keywords: ['empanada', 'empanadas', 'salteña', 'criolla', 'tucumana'],
    imageUrl: makePictoSvg(`
      <path d="M18 76c4-24 22-40 42-40s38 16 42 40c-22 8-62 8-84 0z" fill="#f59e0b" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 72c8-16 20-26 36-26s28 10 36 26" fill="none" stroke="#92400e" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cat-ensalada',
    label: 'Ensalada / Verduras',
    source: 'catalogo',
    arasaacId: 2380,
    keywords: ['ensalada', 'lechuga', 'verdura', 'vegano', 'vegetariano', 'hojas'],
    imageUrl: makePictoSvg(`
      <circle cx="44" cy="46" r="16" fill="#4ade80" stroke="#111827" stroke-width="3.5"/>
      <circle cx="74" cy="46" r="16" fill="#22c55e" stroke="#111827" stroke-width="3.5"/>
      <circle cx="60" cy="42" r="16" fill="#86efac" stroke="#111827" stroke-width="3.5"/>
      <circle cx="48" cy="54" r="6" fill="#ef4444" stroke="#111827" stroke-width="2.5"/>
      <path d="M22 58h76c-4 22-18 34-38 34S26 80 22 58z" fill="#e2e8f0" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
    `),
  },
  {
    id: 'cat-limon',
    label: 'Limón',
    source: 'catalogo',
    arasaacId: 2448,
    keywords: ['limon', 'limón', 'citrico', 'cítrico', 'limonada'],
    imageUrl: makePictoSvg(`
      <ellipse cx="60" cy="60" rx="34" ry="26" fill="#fde047" stroke="#111827" stroke-width="4"/>
      <circle cx="26" cy="60" r="5" fill="#fde047" stroke="#111827" stroke-width="3"/>
      <circle cx="94" cy="60" r="5" fill="#fde047" stroke="#111827" stroke-width="3"/>
      <path d="M60 34c4-8 14-10 18-6-2 6-10 10-18 6z" fill="#22c55e" stroke="#111827" stroke-width="3"/>
    `),
  },
  {
    id: 'cat-cafe',
    label: 'Café',
    source: 'catalogo',
    arasaacId: 2317,
    keywords: ['cafe', 'café', 'cortado', 'espresso', 'lagrima', 'lágrima', 'capuchino'],
    imageUrl: makePictoSvg(`
      <path d="M30 46h46v24c0 14-10 24-23 24S30 84 30 70V46z" fill="#ffffff" stroke="#111827" stroke-width="4"/>
      <path d="M34 50h38v18c0 10-8 18-19 18s-19-8-19-18V50z" fill="#78350f"/>
      <path d="M76 52h10c6 0 10 4 10 10s-4 10-10 10H76" fill="none" stroke="#111827" stroke-width="4"/>
      <path d="M22 96h64" stroke="#111827" stroke-width="4" stroke-linecap="round"/>
      <path d="M44 26c-4 6 4 10 0 14M58 24c-4 6 4 10 0 14" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cat-leche',
    label: 'Leche',
    source: 'catalogo',
    arasaacId: 2445,
    keywords: ['leche', 'lacteo', 'lácteo', 'crema', 'submarino', 'cafe con leche'],
    imageUrl: makePictoSvg(`
      <path d="M42 22h36l6 18v54H36V40l6-18z" fill="#eff6ff" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <rect x="44" y="16" width="32" height="8" rx="2" fill="#3b82f6" stroke="#111827" stroke-width="3"/>
      <path d="M36 52h48v24H36z" fill="#93c5fd" stroke="#111827" stroke-width="3"/>
    `),
  },
  {
    id: 'cat-medialuna',
    label: 'Medialuna',
    source: 'catalogo',
    arasaacId: 2349,
    keywords: ['medialuna', 'medialunas', 'facturas', 'croissant', 'manteca', 'panaderia'],
    imageUrl: makePictoSvg(`
      <path d="M24 78c4-24 22-36 36-36s32 12 36 36c-12-8-22-12-36-12s-24 4-36 12z" fill="#f59e0b" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 46l-4 22M60 42v24M76 46l4 22" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cat-helado',
    label: 'Helado',
    source: 'catalogo',
    arasaacId: 2423,
    keywords: ['helado', 'bocha', 'cucurucho', 'crema', 'postre', 'heladeria'],
    imageUrl: makePictoSvg(`
      <circle cx="60" cy="40" r="22" fill="#f472b6" stroke="#111827" stroke-width="4"/>
      <circle cx="48" cy="48" r="14" fill="#fde68a" stroke="#111827" stroke-width="3.5"/>
      <circle cx="72" cy="48" r="14" fill="#78350f" stroke="#111827" stroke-width="3.5"/>
      <path d="M36 56h48l-24 46-24-46z" fill="#f59e0b" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
    `),
  },
  {
    id: 'cat-chocolate',
    label: 'Chocolate',
    source: 'catalogo',
    arasaacId: 2337,
    keywords: ['chocolate', 'cacao', 'dulce', 'brownie', 'submarino'],
    imageUrl: makePictoSvg(`
      <rect x="34" y="20" width="52" height="78" rx="6" fill="#78350f" stroke="#111827" stroke-width="4"/>
      <path d="M34 46h52M34 72h52M60 20v78" stroke="#451a03" stroke-width="3.5"/>
    `),
  },
  {
    id: 'cat-dulce-leche',
    label: 'Dulce de leche',
    source: 'catalogo',
    keywords: ['dulce de leche', 'dulce', 'caramelo', 'alfajor', 'flan'],
    imageUrl: makePictoSvg(`
      <rect x="34" y="36" width="52" height="60" rx="8" fill="#b45309" stroke="#111827" stroke-width="4"/>
      <rect x="38" y="24" width="44" height="14" rx="4" fill="#e2e8f0" stroke="#111827" stroke-width="3.5"/>
      <rect x="42" y="52" width="36" height="24" rx="4" fill="#fef3c7" stroke="#111827" stroke-width="2.5"/>
    `),
  },
  {
    id: 'cat-agua',
    label: 'Agua',
    source: 'catalogo',
    arasaacId: 2248,
    keywords: ['agua', 'mineral', 'sin gas', 'con gas', 'bebida'],
    imageUrl: makePictoSvg(`
      <path d="M38 24h44l-6 72H44L38 24z" fill="#e0f2fe" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 50h40l-4 44H44L40 50z" fill="#38bdf8" stroke="#111827" stroke-width="3"/>
    `),
  },
  {
    id: 'cat-gaseosa',
    label: 'Gaseosa / Jugo',
    source: 'catalogo',
    arasaacId: 2553,
    keywords: ['gaseosa', 'jugo', 'refresco', 'cola', 'naranja', 'bebida'],
    imageUrl: makePictoSvg(`
      <rect x="40" y="34" width="40" height="62" rx="6" fill="#fb923c" stroke="#111827" stroke-width="4"/>
      <path d="M64 34l10-16h12" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="54" cy="54" r="3" fill="#ffffff"/>
      <circle cx="66" cy="68" r="4" fill="#ffffff"/>
      <circle cx="52" cy="78" r="2.5" fill="#ffffff"/>
    `),
  },
  {
    id: 'cat-vino-cerveza',
    label: 'Cerveza / Vino',
    source: 'catalogo',
    arasaacId: 2331,
    keywords: ['cerveza', 'vino', 'malbec', 'pinta', 'copa', 'alcohol', 'trago'],
    imageUrl: makePictoSvg(`
      <path d="M34 40h40v48c0 6-4 10-10 10H44c-6 0-10-4-10-10V40z" fill="#fbbf24" stroke="#111827" stroke-width="4"/>
      <path d="M74 48h10c6 0 10 4 10 10v14c0 6-4 10-10 10H74" fill="none" stroke="#111827" stroke-width="4"/>
      <path d="M32 36c0-8 8-14 16-12 4-6 14-6 18 0 8-2 12 4 12 12H32z" fill="#ffffff" stroke="#111827" stroke-width="3.5"/>
    `),
  },
  {
    id: 'cat-pizza',
    label: 'Pizza',
    source: 'catalogo',
    arasaacId: 2525,
    keywords: ['pizza', 'muzzarella', 'napolitana', 'porcion', 'porción'],
    imageUrl: makePictoSvg(`
      <path d="M60 20L98 92H22L60 20z" fill="#fde047" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M22 92h76c-10 8-66 8-76 0z" fill="#d97706" stroke="#111827" stroke-width="4"/>
      <circle cx="60" cy="54" r="6" fill="#dc2626" stroke="#111827" stroke-width="2.5"/>
      <circle cx="48" cy="74" r="6" fill="#dc2626" stroke="#111827" stroke-width="2.5"/>
      <circle cx="72" cy="76" r="5" fill="#16a34a" stroke="#111827" stroke-width="2.5"/>
    `),
  },
  {
    id: 'cat-fideos',
    label: 'Pastas / Fideos',
    source: 'catalogo',
    arasaacId: 2497,
    keywords: ['fideos', 'pastas', 'tallarines', 'ravioles', 'ñoquis', 'sorrentinos'],
    imageUrl: makePictoSvg(`
      <path d="M26 58c8-18 60-18 68 0" fill="#fde047" stroke="#111827" stroke-width="4"/>
      <path d="M36 52c10-10 38-10 48 0" fill="none" stroke="#ca8a04" stroke-width="3"/>
      <circle cx="60" cy="48" r="10" fill="#ef4444" stroke="#111827" stroke-width="3"/>
      <path d="M20 58h80c-4 24-20 36-40 36S24 82 20 58z" fill="#e2e8f0" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
    `),
  },
  {
    id: 'cat-cebolla',
    label: 'Cebolla / Ajo',
    source: 'catalogo',
    arasaacId: 2329,
    keywords: ['cebolla', 'ajo', 'condimento', 'fugazzeta'],
    imageUrl: makePictoSvg(`
      <path d="M60 22c-2 10-26 22-26 44 0 16 12 28 26 28s26-12 26-28c0-22-24-34-26-44z" fill="#e9d5ff" stroke="#111827" stroke-width="4"/>
      <path d="M60 26c-8 14-12 36 0 68M60 26c8 14 12 36 0 68" fill="none" stroke="#9333ea" stroke-width="2.5"/>
    `),
  },
  {
    id: 'cat-frutilla',
    label: 'Frutilla / Fruta',
    source: 'catalogo',
    arasaacId: 2398,
    keywords: ['frutilla', 'fruta', 'frutas', 'postre', 'ensalada de frutas', 'fresa'],
    imageUrl: makePictoSvg(`
      <path d="M60 94c-16 0-30-20-30-38 0-14 14-20 30-20s30 6 30 20c0 18-14 38-30 38z" fill="#ef4444" stroke="#111827" stroke-width="4"/>
      <path d="M44 36l16-12 16 12-16 6-16-6z" fill="#22c55e" stroke="#111827" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="54" r="2" fill="#fef08a"/>
      <circle cx="70" cy="54" r="2" fill="#fef08a"/>
      <circle cx="60" cy="66" r="2" fill="#fef08a"/>
      <circle cx="52" cy="76" r="2" fill="#fef08a"/>
      <circle cx="68" cy="76" r="2" fill="#fef08a"/>
    `),
  },
  {
    id: 'cat-te',
    label: 'Té / Infusión',
    source: 'catalogo',
    arasaacId: 2583,
    keywords: ['te', 'té', 'infusion', 'infusión', 'desayuno', 'merienda', 'saquito', 'mate cocido'],
    imageUrl: makePictoSvg(`
      <path d="M28 50h46v22c0 12-10 22-23 22S28 84 28 72V50z" fill="#ffffff" stroke="#111827" stroke-width="4"/>
      <path d="M32 54h38v16c0 9-8 16-19 16s-19-7-19-16V54z" fill="#d97706"/>
      <path d="M74 56h10c5 0 9 4 9 9s-4 9-9 9H74" fill="none" stroke="#111827" stroke-width="4"/>
      <path d="M56 50V32l12 6v14H56z" fill="#fef3c7" stroke="#111827" stroke-width="2.5"/>
    `),
  },
  {
    id: 'cat-mate',
    label: 'Mate',
    source: 'catalogo',
    arasaacId: 28162,
    keywords: ['mate', 'yerba', 'desayuno', 'merienda', 'infusion'],
    imageUrl: makePictoSvg(`
      <path d="M34 48h52c0 28-10 46-26 46S34 76 34 48z" fill="#78350f" stroke="#111827" stroke-width="4"/>
      <rect x="36" y="42" width="48" height="8" rx="3" fill="#cbd5e1" stroke="#111827" stroke-width="3"/>
      <path d="M64 46l18-24" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
      <circle cx="48" cy="46" r="6" fill="#22c55e"/>
    `),
  },
  {
    id: 'cat-tostadas',
    label: 'Tostadas / Mermelada',
    source: 'catalogo',
    arasaacId: 2595,
    keywords: ['tostada', 'tostadas', 'pan', 'mermelada', 'manteca', 'desayuno', 'merienda', 'dulce'],
    imageUrl: makePictoSvg(`
      <path d="M28 42c0-10 12-18 32-18s32 8 32 18c0 4-2 8-5 10v38H33V52c-3-2-5-6-5-10z" fill="#f59e0b" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 52h40v28H40z" fill="#ef4444" stroke="#111827" stroke-width="2.5" rx="4"/>
    `),
  },
  {
    id: 'cat-jugo',
    label: 'Jugo de naranja',
    source: 'catalogo',
    arasaacId: 2440,
    keywords: ['jugo', 'naranja', 'exprimido', 'desayuno', 'merienda', 'bebida', 'citrico'],
    imageUrl: makePictoSvg(`
      <path d="M38 30h44l-6 64H44L38 30z" fill="#fef3c7" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 46h40l-4 46H44L40 46z" fill="#f97316" stroke="#111827" stroke-width="3"/>
      <circle cx="80" cy="30" r="10" fill="#fb923c" stroke="#111827" stroke-width="3"/>
    `),
  },
  {
    id: 'cat-yogur',
    label: 'Yogur / Granola',
    source: 'catalogo',
    arasaacId: 2616,
    keywords: ['yogur', 'yogurt', 'granola', 'cereales', 'desayuno', 'merienda', 'lacteo'],
    imageUrl: makePictoSvg(`
      <path d="M32 40h56l-8 52H40L32 40z" fill="#f8fafc" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <rect x="28" y="30" width="64" height="10" rx="4" fill="#ec4899" stroke="#111827" stroke-width="3.5"/>
      <circle cx="60" cy="64" r="10" fill="#f472b6" stroke="#111827" stroke-width="2.5"/>
    `),
  },
  {
    id: 'cat-torta',
    label: 'Torta / Budín',
    source: 'catalogo',
    arasaacId: 2592,
    keywords: ['torta', 'pastel', 'budin', 'budín', 'bizcochuelo', 'merienda', 'postre', 'dulce'],
    imageUrl: makePictoSvg(`
      <path d="M24 58l54-26 18 26v28H24V58z" fill="#fde68a" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 68h72v10H24z" fill="#78350f" stroke="#111827" stroke-width="3"/>
      <circle cx="72" cy="30" r="7" fill="#ef4444" stroke="#111827" stroke-width="3"/>
    `),
  },
  {
    id: 'cat-flan',
    label: 'Flan / Postre',
    source: 'catalogo',
    arasaacId: 2394,
    keywords: ['flan', 'postre', 'caramelo', 'crema', 'dulce'],
    imageUrl: makePictoSvg(`
      <path d="M34 40h52l10 42H24L34 40z" fill="#facc15" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 40h52l4 14c-12-4-20 4-30 0s-18 4-30 0l4-14z" fill="#92400e" stroke="#111827" stroke-width="3"/>
      <path d="M18 82h84" stroke="#111827" stroke-width="4" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cat-arroz',
    label: 'Arroz',
    source: 'catalogo',
    arasaacId: 2258,
    keywords: ['arroz', 'guarnicion', 'guarnición', 'risotto', 'sin tacc'],
    imageUrl: makePictoSvg(`
      <path d="M26 56c8-20 60-20 68 0" fill="#ffffff" stroke="#111827" stroke-width="4"/>
      <path d="M20 56h80c-4 24-20 36-40 36S24 80 20 56z" fill="#38bdf8" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="48" cy="48" r="2.5" fill="#94a3b8"/>
      <circle cx="62" cy="45" r="2.5" fill="#94a3b8"/>
      <circle cx="72" cy="50" r="2.5" fill="#94a3b8"/>
    `),
  },
  {
    id: 'cat-cerdo',
    label: 'Cerdo / Bondiola',
    source: 'catalogo',
    arasaacId: 2330,
    keywords: ['cerdo', 'bondiola', 'costilla', 'parrilla', 'carne'],
    imageUrl: makePictoSvg(`
      <path d="M24 62c0-18 16-30 38-30 20 0 34 12 34 26 0 16-14 28-36 28-20 0-36-8-36-24z" fill="#f9a8d4" stroke="#111827" stroke-width="4"/>
      <circle cx="48" cy="58" r="6" fill="#ffffff" stroke="#111827" stroke-width="3"/>
    `),
  },
  {
    id: 'cat-sal',
    label: 'Sal / Condimentos',
    source: 'catalogo',
    arasaacId: 2561,
    keywords: ['sal', 'pimienta', 'condimento', 'especias'],
    imageUrl: makePictoSvg(`
      <path d="M40 38h40l6 54H34l6-54z" fill="#f1f5f9" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
      <path d="M42 38c0-12 36-12 36 0H42z" fill="#94a3b8" stroke="#111827" stroke-width="3.5"/>
      <text x="60" y="72" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">S</text>
    `),
  },
  {
    id: 'cat-azucar',
    label: 'Azúcar / Miel',
    source: 'catalogo',
    arasaacId: 2263,
    keywords: ['azucar', 'azúcar', 'miel', 'dulce', 'desayuno', 'merienda'],
    imageUrl: makePictoSvg(`
      <rect x="34" y="42" width="24" height="24" rx="4" fill="#ffffff" stroke="#111827" stroke-width="3.5"/>
      <rect x="60" y="46" width="24" height="24" rx="4" fill="#fef3c7" stroke="#111827" stroke-width="3.5"/>
      <rect x="46" y="64" width="24" height="24" rx="4" fill="#ffffff" stroke="#111827" stroke-width="3.5"/>
    `),
  },
  {
    id: 'cat-sandwich',
    label: 'Sándwich / Tostado',
    source: 'catalogo',
    arasaacId: 2562,
    keywords: ['sandwich', 'sándwich', 'tostado', 'carlito', 'lomito', 'hamburguesa', 'merienda'],
    imageUrl: makePictoSvg(`
      <path d="M22 44c0-12 18-20 38-20s38 8 38 20H22z" fill="#d97706" stroke="#111827" stroke-width="4"/>
      <rect x="20" y="46" width="80" height="10" rx="4" fill="#22c55e" stroke="#111827" stroke-width="3"/>
      <rect x="20" y="56" width="80" height="10" rx="4" fill="#facc15" stroke="#111827" stroke-width="3"/>
      <rect x="22" y="66" width="76" height="14" rx="4" fill="#d97706" stroke="#111827" stroke-width="4"/>
    `),
  },
];

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function searchLocalCatalog(query: string): CatalogPictogramEntry[] {
  const q = normalizeText(query);
  if (!q) return ARASAAC_LOCAL_CATALOG;
  return ARASAAC_LOCAL_CATALOG.filter(
    (item) =>
      normalizeText(item.label).includes(q) ||
      item.keywords.some((kw) => {
        const nkw = normalizeText(kw);
        return nkw.includes(q) || q.includes(nkw);
      })
  );
}
