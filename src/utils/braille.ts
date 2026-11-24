import type { ComercioPublico, PlatoMenu } from '../types.ts';
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

/**
 * Especificaciones físicas calibradas con la tableta Braille real (en milímetros):
 * - Dimensión de celda (6 puntos): 6,5 mm × 4,0 mm
 * - Distancia entre centros de puntos (H y V): 2,5 mm (radio de punto 0,75 mm / Ø 1,5 mm)
 * - Separación libre entre celdas: 2,3 mm (lado de 4,0 mm -> paso 6,3 mm) y 3,5 mm (lado de 6,5 mm -> paso 10,0 mm)
 */
export type BrailleOrientationMode = 'slate_portrait' | 'slate_rotated_90';

export interface BrailleMatrixGeometry {
  mode: BrailleOrientationMode;
  label: string;
  cellWidthMm: number;
  cellHeightMm: number;
  dotSpacingMm: number;
  dotRadiusMm: number;
  freeGapXMm: number;
  freeGapYMm: number;
  stepXMm: number;
  stepYMm: number;
  rotated90: boolean;
}

export const BRAILLE_GEOMETRY_PRESETS: Record<
  BrailleOrientationMode,
  BrailleMatrixGeometry
> = {
  slate_portrait: {
    mode: 'slate_portrait',
    label: 'Estándar tableta',
    cellWidthMm: 4.0,
    cellHeightMm: 6.5,
    dotSpacingMm: 2.5,
    dotRadiusMm: 0.75,
    freeGapXMm: 2.35,
    freeGapYMm: 3.5,
    stepXMm: 6.35,
    stepYMm: 10.0,
    rotated90: false,
  },
  slate_rotated_90: {
    mode: 'slate_rotated_90',
    label: 'Tableta girada 90°',
    cellWidthMm: 6.5,
    cellHeightMm: 4.0,
    dotSpacingMm: 2.5,
    dotRadiusMm: 0.75,
    freeGapXMm: 3.5,
    freeGapYMm: 2.35,
    stepXMm: 10.0,
    stepYMm: 6.35,
    rotated90: true,
  },
};

export const BRAILLE_SPECS_MM = {
  cellHeightMm: 6.5,
  cellWidthMm: 4.0,
  dotSpacingMm: 2.5,
  cellPitchMm: 6.35,
  lineSpacingMm: 10.0,
  freeGapHorizontalMm: 2.35,
  freeGapVerticalMm: 3.5,
  dotRadiusMm: 0.75,
  pictogramMaxHeightMm: 15.0,
} as const;

export type BrailleSixDots = [
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
];

/**
 * Decodifica una celda Braille Unicode (U+2800..U+283F) en sus 6 puntos [1..6].
 * Orden estándar: puntos 1,2,3 columna izquierda (arriba->abajo); 4,5,6 columna derecha.
 */
export function brailleCharToDots(ch: string): BrailleSixDots {
  const code = ch.codePointAt(0) ?? 0x2800;
  if (code < 0x2800 || code > 0x28ff) {
    return [false, false, false, false, false, false];
  }
  const mask = code - 0x2800;
  return [
    Boolean(mask & 0x01),
    Boolean(mask & 0x02),
    Boolean(mask & 0x04),
    Boolean(mask & 0x08),
    Boolean(mask & 0x10),
    Boolean(mask & 0x20),
  ];
}

export interface WrappedBrailleRow {
  braille: string;
  plain: string;
}

/**
 * Envuelve texto plano en renglones respetando un máximo de celdas Braille por línea
 * (evitando cortar prefijos numéricos/mayúsculas o palabras por la mitad).
 */
export function wrapBrailleLineWithPlain(
  plainInput: string,
  maxCellsPerLine: number,
  precomputedBraille?: string
): WrappedBrailleRow[] {
  const limit = Math.max(4, maxCellsPerLine);
  const trimmed = plainInput.trim();

  if (!trimmed) {
    if (precomputedBraille) {
      const cells = Array.from(precomputedBraille);
      return [
        {
          braille: cells.slice(0, limit).join(''),
          plain: '',
        },
      ];
    }
    return [{ braille: '', plain: '' }];
  }

  const words = trimmed.split(/\s+/);
  const rows: WrappedBrailleRow[] = [];
  let currentPlain = '';

  const pushPlainChunk = (chunk: string) => {
    const br = textToBraille(chunk);
    const cells = Array.from(br);
    if (cells.length <= limit) {
      rows.push({ braille: br, plain: chunk });
      return;
    }
    // Palabra excepcionalmente larga: partir respetando el límite de celdas
    let sub = '';
    for (const ch of chunk) {
      const next = sub + ch;
      if (Array.from(textToBraille(next)).length > limit && sub) {
        rows.push({ braille: textToBraille(sub), plain: sub });
        sub = ch;
      } else {
        sub = next;
      }
    }
    if (sub) {
      rows.push({ braille: textToBraille(sub), plain: sub });
    }
  };

  for (const word of words) {
    const candidate = currentPlain ? `${currentPlain} ${word}` : word;
    const candidateCells = Array.from(textToBraille(candidate)).length;

    if (candidateCells <= limit) {
      currentPlain = candidate;
    } else {
      if (currentPlain) {
        pushPlainChunk(currentPlain);
      }
      if (Array.from(textToBraille(word)).length <= limit) {
        currentPlain = word;
      } else {
        pushPlainChunk(word);
        currentPlain = '';
      }
    }
  }

  if (currentPlain) {
    pushPlainChunk(currentPlain);
  }

  return rows.length > 0 ? rows : [{ braille: '', plain: '' }];
}

