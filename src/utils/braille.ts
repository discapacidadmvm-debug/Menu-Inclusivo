import { ComercioPublico, PlatoMenu } from '../types.ts';
import { formatArs } from './dates.ts';

// Alfabeto Braille Español (ONCE / Argentina - celdas Unicode de 6 puntos U+2800..U+283F)
const BRAILLE_MAP: Record<string, string> = {
  a: '⠁',
  b: '⠃',
  c: '⠉',
  d: '⠙',
  e: '⠑',
  f: '⠋',
  g: '⠛',
  h: '⠓',
  i: '⠊',
  j: '⠚',
  k: '⠅',
  l: '⠇',
  m: '⠍',
  n: '⠝',
  ñ: '⠻',
  o: '⠕',
  p: '⠏',
  q: '⠟',
  r: '⠗',
  s: '⠎',
  t: '⠞',
  u: '⠥',
  v: '⠧',
  w: '⠺',
  x: '⠭',
  y: '⠽',
  z: '⠵',
  á: '⠷',
  é: '⠮',
  í: '⠌',
  ó: '⠬',
  ú: '⠾',
  ü: '⠳',
  ' ': '⠀',
  ',': '⠂',
  ';': '⠆',
  ':': '⠒',
  '.': '⠄',
  '-': '⠤',
  '(': '⠣',
  ')': '⠜',
  '/': '⠸⠌',
  '?': '⠢',
  '¿': '⠢',
  '!': '⠖',
  '¡': '⠖',
  '+': '⠖',
  '%': '⠸⠴',
  $: '⠸⠎',
};

const DIGIT_MAP: Record<string, string> = {
  '1': '⠁',
  '2': '⠃',
  '3': '⠉',
  '4': '⠙',
  '5': '⠑',
  '6': '⠋',
  '7': '⠛',
  '8': '⠓',
  '9': '⠊',
  '0': '⠚',
};

const NUMBER_PREFIX = '⠼';
const UPPERCASE_PREFIX = '⠨';

export function textToBraille(input: string): string {
  let out = '';
  let inNumberMode = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '\n') {
      out += '\n';
      inNumberMode = false;
      continue;
    }

    if (DIGIT_MAP[ch]) {
      if (!inNumberMode) {
        out += NUMBER_PREFIX;
        inNumberMode = true;
      }
      out += DIGIT_MAP[ch];
      continue;
    }

    // Separadores numéricos en precios argentinos (ej. 12.500 o 12,50)
    if (inNumberMode && (ch === '.' || ch === ',')) {
      const next = input[i + 1];
      if (next && DIGIT_MAP[next]) {
        out += ch === '.' ? '⠄' : '⠂';
        continue;
      }
    }

    inNumberMode = false;
    const lower = ch.toLowerCase();
    const isUpper = ch !== lower && ch.toUpperCase() === ch;

    if (BRAILLE_MAP[lower]) {
      if (isUpper) {
        out += UPPERCASE_PREFIX;
      }
      out += BRAILLE_MAP[lower];
    } else if (ch === '\t') {
      out += '⠀⠀';
    } else {
      out += '⠀';
    }
  }

  return out;
}

export interface BrailleLine {
  plain: string;
  braille: string;
  kind: 'title' | 'category' | 'item' | 'detail' | 'separator';
}

export function buildMenuBrailleLines(
  comercio: ComercioPublico,
  platos: PlatoMenu[]
): BrailleLine[] {
  const lines: BrailleLine[] = [];

  const push = (plain: string, kind: BrailleLine['kind']) => {
    lines.push({
      plain,
      braille: kind === 'separator' ? '⠒'.repeat(28) : textToBraille(plain),
      kind,
    });
  };

  push(`${comercio.nombre} (${comercio.rubro})`, 'title');
  push('CARTA INCLUSIVA - SISTEMA BRAILLE', 'detail');
  push(`${comercio.direccion}`, 'detail');
  push('', 'separator');

  const activos = platos.filter((p) => p.disponible);
  const categorias = Array.from(new Set(activos.map((p) => p.categoria)));

  for (const cat of categorias) {
    push(cat.toUpperCase(), 'category');
    const items = activos.filter((p) => p.categoria === cat);
    for (const item of items) {
      const precioTxt = formatArs(item.precioArs).replace(/\s+/g, ' ').trim();
      const taccTxt = item.libreDeTacc ? ' - LIBRE DE TACC (SIN TACC)' : '';
      push(`${item.nombre}${taccTxt} - ${precioTxt}`, 'item');

      if (item.descripcion.trim()) {
        push(`Detalle: ${item.descripcion.trim()}`, 'detail');
      }
      if (item.pictogramas.length > 0) {
        const ings = item.pictogramas.map((pg) => pg.label).join(', ');
        push(`Ingredientes: ${ings}`, 'detail');
      }
    }
    push('', 'separator');
  }

  return lines;
}

export function formatDishPriceBraille(
  nombre: string,
  precioArs: number,
  libreDeTacc?: boolean
): { plain: string; braille: string } {
  const cleanName = nombre.trim() || 'Plato sin nombre';
  const precioTxt = formatArs(Number(precioArs) || 0)
    .replace(/\s+/g, ' ')
    .trim();
  const taccTxt = libreDeTacc ? ' (Libre de TACC)' : '';
  const plain = `${cleanName}${taccTxt} - ${precioTxt}`;
  return {
    plain,
    braille: textToBraille(plain),
  };
}

export function buildBraillePlainTextExport(
  comercio: ComercioPublico,
  platos: PlatoMenu[],
  includeReference: boolean
): string {
  const lines = buildMenuBrailleLines(comercio, platos);
  return lines
    .map((line) => {
      if (line.kind === 'separator') return line.braille;
      if (!includeReference) return line.braille;
      return `${line.braille}\n[${line.plain}]`;
    })
    .join('\n');
}
