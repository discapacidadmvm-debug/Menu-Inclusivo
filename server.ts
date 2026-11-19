import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  loadDb,
  saveDb,
  slugifyNombre,
  StoredComercio,
  toComercioAdmin,
  toComercioPublico,
} from './server/store.ts';
import { searchLocalCatalog } from './src/data/arasaacCatalog.ts';
import type {
  IdiomaCodigo,
  PictogramaItem,
  PlatoMenu,
  TranslatedPlatoFields,
} from './src/types.ts';

const PORT = 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mackenna2026';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const translationCache = new Map<string, Record<string, TranslatedPlatoFields>>();

const LOCAL_PHRASE_DICT: Record<Exclude<IdiomaCodigo, 'es-AR'>, Record<string, string>> = {
  'en-US': {
    Milanesa: 'Breaded beef cutlet',
    Jamón: 'Ham',
    Queso: 'Cheese',
    'Salsa de tomate': 'Tomato sauce',
    'Papas fritas': 'French fries',
    'Carne vacuna': 'Beef',
    Pollo: 'Chicken',
    Pescado: 'Fish',
    Huevo: 'Egg',
    'Pan / Harina': 'Bread / Flour',
    Empanada: 'Empanada (stuffed pastry)',
    'Ensalada / Verduras': 'Salad / Vegetables',
    Limón: 'Lemon',
    Café: 'Coffee',
    Leche: 'Milk',
    Medialuna: 'Sweet croissant',
    Helado: 'Ice cream',
    Chocolate: 'Chocolate',
    'Dulce de leche': 'Dulce de leche (milk caramel)',
    Agua: 'Water',
    'Gaseosa / Jugo': 'Soda / Juice',
    'Cerveza / Vino': 'Beer / Wine',
    Pizza: 'Pizza',
    'Pastas / Fideos': 'Pasta',
    'Cebolla / Ajo': 'Onion / Garlic',
    'Frutilla / Fruta': 'Strawberry / Fruit',
  },
  'pt-BR': {
    Milanesa: 'Bife à milanesa',
    Jamón: 'Presunto',
    Queso: 'Queijo',
    'Salsa de tomate': 'Molho de tomate',
    'Papas fritas': 'Batatas fritas',
    'Carne vacuna': 'Carne bovina',
    Pollo: 'Frango',
    Pescado: 'Peixe',
    Huevo: 'Ovo',
    'Pan / Harina': 'Pão / Farinha',
    Empanada: 'Empanada',
    'Ensalada / Verduras': 'Salada / Verduras',
    Limón: 'Limão',
    Café: 'Café',
    Leche: 'Leite',
    Medialuna: 'Croissant doce',
    Helado: 'Sorvete',
    Chocolate: 'Chocolate',
    'Dulce de leche': 'Doce de leite',
    Agua: 'Água',
    'Gaseosa / Jugo': 'Refrigerante / Suco',
    'Cerveza / Vino': 'Cerveja / Vinho',
    Pizza: 'Pizza',
    'Pastas / Fideos': 'Massas',
    'Cebolla / Ajo': 'Cebola / Alho',
    'Frutilla / Fruta': 'Morango / Fruta',
  },
  'fr-FR': {
    Milanesa: 'Escalope panée',
    Jamón: 'Jambon',
    Queso: 'Fromage',
    'Salsa de tomate': 'Sauce tomate',
    'Papas fritas': 'Frites',
    'Carne vacuna': 'Bœuf',
    Pollo: 'Poulet',
    Pescado: 'Poisson',
    Huevo: 'Œuf',
    'Pan / Harina': 'Pain / Farine',
    Empanada: 'Chausson salé (Empanada)',
    'Ensalada / Verduras': 'Salade / Légumes',
    Limón: 'Citron',
    Café: 'Café',
    Leche: 'Lait',
    Medialuna: 'Croissant',
    Helado: 'Glace',
    Chocolate: 'Chocolat',
    'Dulce de leche': 'Confiture de lait',
    Agua: 'Eau',
    'Gaseosa / Jugo': 'Soda / Jus',
    'Cerveza / Vino': 'Bière / Vin',
    Pizza: 'Pizza',
    'Pastas / Fideos': 'Pâtes',
    'Cebolla / Ajo': 'Oignon / Ail',
    'Frutilla / Fruta': 'Fraise / Fruit',
  },
  'it-IT': {
    Milanesa: 'Cotoletta alla milanese',
    Jamón: 'Prosciutto',
    Queso: 'Formaggio',
    'Salsa de tomate': 'Salsa di pomodoro',
    'Papas fritas': 'Patatine fritte',
    'Carne vacuna': 'Carne di manzo',
    Pollo: 'Pollo',
    Pescado: 'Pesce',
    Huevo: 'Uovo',
    'Pan / Harina': 'Pane / Farina',
    Empanada: 'Empanada',
    'Ensalada / Verduras': 'Insalata / Verdure',
    Limón: 'Limone',
    Café: 'Caffè',
    Leche: 'Latte',
    Medialuna: 'Cornetto',
    Helado: 'Gelato',
    Chocolate: 'Cioccolato',
    'Dulce de leche': 'Dulce de leche',
    Agua: 'Acqua',
    'Gaseosa / Jugo': 'Bibita / Succo',
    'Cerveza / Vino': 'Birra / Vino',
    Pizza: 'Pizza',
    'Pastas / Fideos': 'Pasta',
    'Cebolla / Ajo': 'Cipolla / Aglio',
    'Frutilla / Fruta': 'Fragola / Frutta',
  },
  'de-DE': {
    Milanesa: 'Paniertes Schnitzel',
    Jamón: 'Schinken',
    Queso: 'Käse',
    'Salsa de tomate': 'Tomatensauce',
    'Papas fritas': 'Pommes frites',
    'Carne vacuna': 'Rindfleisch',
    Pollo: 'Hähnchen',
    Pescado: 'Fisch',
    Huevo: 'Ei',
    'Pan / Harina': 'Brot / Mehl',
    Empanada: 'Empanada (Teigtasche)',
    'Ensalada / Verduras': 'Salat / Gemüse',
    Limón: 'Zitrone',
    Café: 'Kaffee',
    Leche: 'Milch',
    Medialuna: 'Croissant',
    Helado: 'Eis',
    Chocolate: 'Schokolade',
    'Dulce de leche': 'Milchkaramell',
    Agua: 'Wasser',
    'Gaseosa / Jugo': 'Limonade / Saft',
    'Cerveza / Vino': 'Bier / Wein',
    Pizza: 'Pizza',
    'Pastas / Fideos': 'Pasta / Nudeln',
    'Cebolla / Ajo': 'Zwiebel / Knoblauch',
    'Frutilla / Fruta': 'Erdbeere / Obst',
  },
};

function fallbackTranslatePlatos(
  platos: PlatoMenu[],
  targetLang: Exclude<IdiomaCodigo, 'es-AR'>
): Record<string, TranslatedPlatoFields> {
  const dict = LOCAL_PHRASE_DICT[targetLang] || {};
  const result: Record<string, TranslatedPlatoFields> = {};
  for (const plato of platos) {
    result[plato.id] = {
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      categoria: plato.categoria,
      pictogramasLabels: plato.pictogramas.map((p) => dict[p.label] || p.label),
    };
  }
  return result;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // --- AUTH ---
  app.post('/api/auth/admin', (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password || password.trim() !== ADMIN_PASSWORD) {
      res.status(401).json({ error: 'Contraseña municipal incorrecta.' });
      return;
    }
    res.json({ ok: true, role: 'admin' });
  });

  app.post('/api/auth/comercio', (req, res) => {
    const { comercioId, password } = req.body as {
      comercioId?: string;
      password?: string;
    };
    const db = loadDb();
    const found = db.comercios.find(
      (c) => c.id === comercioId || c.slug === comercioId
    );
    if (!found) {
      res.status(404).json({ error: 'Comercio no encontrado.' });
      return;
    }
    if (found.password !== (password || '').trim()) {
      res.status(401).json({ error: 'Contraseña habilitada incorrecta.' });
      return;
    }
    res.json({
      ok: true,
      comercio: toComercioPublico(found),
    });
  });

  // --- PUBLIC ---
  app.get('/api/public/comercios', (_req, res) => {
    const db = loadDb();
    const list = db.comercios.map((c) => ({
      ...toComercioPublico(c),
      cantidadPlatos: db.platos.filter((p) => p.comercioId === c.id && p.disponible).length,
    }));
    res.json({ comercios: list });
  });

  app.get('/api/public/carta/:slug', (req, res) => {
    const db = loadDb();
    const comercio = db.comercios.find(
      (c) => c.slug === req.params.slug || c.id === req.params.slug
    );
    if (!comercio) {
      res.status(404).json({ error: 'Carta gastronómica no encontrada.' });
      return;
    }
    const platos = db.platos
      .filter((p) => p.comercioId === comercio.id && p.disponible)
      .sort((a, b) => a.orden - b.orden);

    res.json({
      comercio: toComercioPublico(comercio),
      platos,
    });
  });

  // --- ADMIN MUNICIPAL ---
  app.get('/api/admin/comercios', (_req, res) => {
    const db = loadDb();
    res.json({
      comercios: db.comercios.map((c) => toComercioAdmin(c, db.platos)),
    });
  });

  app.post('/api/admin/comercios', (req, res) => {
    const { nombre, rubro, direccion, telefono, password, fechaHabilitacion } =
      req.body as Partial<StoredComercio>;

    if (!nombre?.trim() || !password?.trim() || !fechaHabilitacion?.trim()) {
      res.status(400).json({
        error: 'Nombre del comercio, contraseña y primera fecha de habilitación son obligatorios.',
      });
      return;
    }

    const db = loadDb();
    let baseSlug = slugifyNombre(nombre);
    if (!baseSlug) baseSlug = `comercio-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 2;
    while (db.comercios.some((c) => c.slug === slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const nextNum = String(db.comercios.length + 1).padStart(3, '0');
    const nuevo: StoredComercio = {
      id: `com-${Date.now()}`,
      slug,
      nombre: nombre.trim(),
      rubro: rubro || 'Restaurante',
      direccion: direccion?.trim() || 'Vicuña Mackenna, Córdoba',
      telefono: telefono?.trim() || '',
      password: password.trim(),
      fechaHabilitacion: fechaHabilitacion.trim(),
      activa: true,
      obleaNumero: `VM-INC-${nextNum}`,
    };

    db.comercios.push(nuevo);
    saveDb(db);
    res.status(201).json({ comercio: toComercioAdmin(nuevo, db.platos) });
  });

  app.patch('/api/admin/comercios/:id', (req, res) => {
    const db = loadDb();
    const idx = db.comercios.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Comercio no encontrado.' });
      return;
    }
    const current = db.comercios[idx];
    const body = req.body as Partial<StoredComercio>;
    const updated: StoredComercio = {
      ...current,
      nombre: body.nombre !== undefined ? body.nombre.trim() : current.nombre,
      rubro: body.rubro !== undefined ? body.rubro : current.rubro,
      direccion: body.direccion !== undefined ? body.direccion.trim() : current.direccion,
      telefono: body.telefono !== undefined ? body.telefono.trim() : current.telefono,
      password: body.password !== undefined && body.password.trim() ? body.password.trim() : current.password,
      fechaHabilitacion:
        body.fechaHabilitacion !== undefined
          ? body.fechaHabilitacion.trim()
          : current.fechaHabilitacion,
      activa: body.activa !== undefined ? body.activa : current.activa,
    };
    db.comercios[idx] = updated;
    saveDb(db);
    res.json({ comercio: toComercioAdmin(updated, db.platos) });
  });

  app.delete('/api/admin/comercios/:id', (req, res) => {
    const db = loadDb();
    db.comercios = db.comercios.filter((c) => c.id !== req.params.id);
    db.platos = db.platos.filter((p) => p.comercioId !== req.params.id);
    db.customPictograms = db.customPictograms.filter(
      (pg) => pg.comercioId !== req.params.id
    );
    saveDb(db);
    res.json({ ok: true });
  });

  // --- COMERCIO MENU CRUD ---
  app.get('/api/comercio/:id/menu', (req, res) => {
    const db = loadDb();
    const comercio = db.comercios.find((c) => c.id === req.params.id);
    if (!comercio) {
      res.status(404).json({ error: 'Comercio no encontrado.' });
      return;
    }
    const platos = db.platos
      .filter((p) => p.comercioId === comercio.id)
      .sort((a, b) => a.orden - b.orden);
    const customPictograms = db.customPictograms.filter(
      (pg) => pg.comercioId === comercio.id
    );
    res.json({
      comercio: toComercioPublico(comercio),
      platos,
      customPictograms,
    });
  });

  app.post('/api/comercio/:id/platos', (req, res) => {
    const db = loadDb();
    const comercio = db.comercios.find((c) => c.id === req.params.id);
    if (!comercio) {
      res.status(404).json({ error: 'Comercio no encontrado.' });
      return;
    }
    const body = req.body as Partial<PlatoMenu>;
    if (!body.nombre?.trim()) {
      res.status(400).json({ error: 'El nombre del plato es obligatorio.' });
      return;
    }
    const maxOrden = db.platos
      .filter((p) => p.comercioId === comercio.id)
      .reduce((max, p) => Math.max(max, p.orden), 0);

    const requestedId =
      typeof body.id === 'string' &&
      /^pla-[a-zA-Z0-9_-]{4,40}$/.test(body.id) &&
      !db.platos.some((p) => p.id === body.id)
        ? body.id
        : `pla-${Date.now()}`;

    const nuevo: PlatoMenu = {
      id: requestedId,
      comercioId: comercio.id,
      categoria: body.categoria || 'Platos Principales',
      nombre: body.nombre.trim(),
      descripcion: (body.descripcion || '').trim(),
      precioArs: Number(body.precioArs) || 0,
      fotoUrl: body.fotoUrl || '',
      libreDeTacc: Boolean(body.libreDeTacc),
      disponible: body.disponible !== undefined ? Boolean(body.disponible) : true,
      pictogramas: Array.isArray(body.pictogramas) ? body.pictogramas : [],
      orden: maxOrden + 1,
    };

    db.platos.push(nuevo);
    saveDb(db);
    translationCache.clear();
    res.status(201).json({ plato: nuevo });
  });

  app.patch('/api/comercio/:id/platos/:platoId', (req, res) => {
    const db = loadDb();
    const idx = db.platos.findIndex(
      (p) => p.id === req.params.platoId && p.comercioId === req.params.id
    );
    if (idx === -1) {
      res.status(404).json({ error: 'Plato no encontrado.' });
      return;
    }
    const current = db.platos[idx];
    const body = req.body as Partial<PlatoMenu>;
    const updated: PlatoMenu = {
      ...current,
      categoria: body.categoria !== undefined ? body.categoria : current.categoria,
      nombre: body.nombre !== undefined ? body.nombre.trim() : current.nombre,
      descripcion:
        body.descripcion !== undefined ? body.descripcion.trim() : current.descripcion,
      precioArs:
        body.precioArs !== undefined ? Number(body.precioArs) : current.precioArs,
      fotoUrl: body.fotoUrl !== undefined ? body.fotoUrl : current.fotoUrl,
      libreDeTacc:
        body.libreDeTacc !== undefined ? Boolean(body.libreDeTacc) : current.libreDeTacc,
      disponible:
        body.disponible !== undefined ? Boolean(body.disponible) : current.disponible,
      pictogramas:
        body.pictogramas !== undefined ? body.pictogramas : current.pictogramas,
    };
    db.platos[idx] = updated;
    saveDb(db);
    translationCache.clear();
    res.json({ plato: updated });
  });

  app.delete('/api/comercio/:id/platos/:platoId', (req, res) => {
    const db = loadDb();
    db.platos = db.platos.filter(
      (p) => !(p.id === req.params.platoId && p.comercioId === req.params.id)
    );
    saveDb(db);
    translationCache.clear();
    res.json({ ok: true });
  });

  // --- PICTOGRAMAS PROPIOS (cuando ARASAAC no tiene uno apto) ---
  app.post('/api/comercio/:id/pictogramas', (req, res) => {
    const db = loadDb();
    const comercio = db.comercios.find((c) => c.id === req.params.id);
    if (!comercio) {
      res.status(404).json({ error: 'Comercio no encontrado.' });
      return;
    }
    const { label, imageUrl } = req.body as { label?: string; imageUrl?: string };
    if (!label?.trim() || !imageUrl?.trim()) {
      res.status(400).json({ error: 'Etiqueta e imagen del pictograma son obligatorias.' });
      return;
    }
    const record = {
      id: `custom-${Date.now()}`,
      comercioId: comercio.id,
      label: label.trim(),
      imageUrl: imageUrl.trim(),
      source: 'custom' as const,
    };
    db.customPictograms.push(record);
    saveDb(db);
    res.status(201).json({ pictograma: record });
  });

  // --- BUSCADOR DE PICTOGRAMAS ARASAAC (API oficial + catálogo local instantáneo) ---
  app.get('/api/arasaac/search', async (req, res) => {
    const q = String(req.query.q || '').trim();
    const localMatches: PictogramaItem[] = searchLocalCatalog(q).map((c) => ({
      id: c.id,
      label: c.label,
      imageUrl: c.imageUrl,
      source: 'catalogo',
    }));

    if (!q || q.length < 2) {
      res.json({ results: localMatches, remoteCount: 0 });
      return;
    }

    const remoteResults: PictogramaItem[] = [];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const apiUrl = `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(q)}`;
      const resp = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = (await resp.json()) as Array<{
          _id: number;
          keywords?: Array<{ keyword?: string }>;
        }>;
        for (const item of data.slice(0, 12)) {
          const kwLabel = item.keywords?.[0]?.keyword || q;
          const formatted =
            kwLabel.charAt(0).toUpperCase() + kwLabel.slice(1);
          remoteResults.push({
            id: `arasaac-${item._id}`,
            label: formatted,
            imageUrl: `https://static.arasaac.org/pictograms/${item._id}/${item._id}_300.png`,
            source: 'arasaac',
          });
        }
      }
    } catch {
      // Silencioso: si el entorno bloquea salida externa, devolvemos el catálogo local sin romper nada
    }

    res.json({
      results: [...localMatches, ...remoteResults],
      remoteCount: remoteResults.length,
    });
  });

  // --- TRADUCCIÓN MULTILINGÜE DE MENÚ DIGITAL ---
  app.post('/api/translate-menu', async (req, res) => {
    const { slug, targetLang } = req.body as {
      slug?: string;
      targetLang?: IdiomaCodigo;
    };

    if (!slug || !targetLang || targetLang === 'es-AR') {
      res.json({ translations: {} });
      return;
    }

    const db = loadDb();
    const comercio = db.comercios.find((c) => c.slug === slug || c.id === slug);
    if (!comercio) {
      res.status(404).json({ error: 'Comercio no encontrado.' });
      return;
    }

    const cacheKey = `${comercio.id}:${targetLang}`;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      res.json({ translations: cached });
      return;
    }

    const platos = db.platos.filter((p) => p.comercioId === comercio.id && p.disponible);
    if (!ai) {
      const fb = fallbackTranslatePlatos(platos, targetLang);
      res.json({ translations: fb });
      return;
    }

    const langNames: Record<Exclude<IdiomaCodigo, 'es-AR'>, string> = {
      'en-US': 'English',
      'pt-BR': 'Brazilian Portuguese',
      'fr-FR': 'French',
      'it-IT': 'Italian',
      'de-DE': 'German',
    };

    try {
      const payload = platos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        categoria: p.categoria,
        pictogramasLabels: p.pictogramas.map((pg) => pg.label),
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Translate the following Argentine restaurant menu items from Spanish into natural, clear ${langNames[targetLang]} suitable for accessible reading aloud. Preserve the exact item ids and array length of pictogramasLabels. Input JSON: ${JSON.stringify(payload)}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                nombre: { type: Type.STRING },
                descripcion: { type: Type.STRING },
                categoria: { type: Type.STRING },
                pictogramasLabels: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['id', 'nombre', 'descripcion', 'categoria', 'pictogramasLabels'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]') as Array<{
        id: string;
        nombre: string;
        descripcion: string;
        categoria: string;
        pictogramasLabels: string[];
      }>;

      const map: Record<string, TranslatedPlatoFields> = {};
      for (const item of parsed) {
        map[item.id] = {
          nombre: item.nombre,
          descripcion: item.descripcion,
          categoria: item.categoria,
          pictogramasLabels: item.pictogramasLabels,
        };
      }
      translationCache.set(cacheKey, map);
      res.json({ translations: map });
    } catch {
      const fb = fallbackTranslatePlatos(platos, targetLang);
      res.json({ translations: fb });
    }
  });

  // --- VITE / STATIC ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Carta Inclusiva Vicuña Mackenna escuchando en http://localhost:${PORT}`);
  });
}

startServer();
