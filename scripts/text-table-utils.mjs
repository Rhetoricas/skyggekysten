import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_OUTFILE = 'text-export/ui-texts.tsv';

const TEXT_ATTRS = new Set(['placeholder', 'title', 'aria-label', 'alt']);
const NON_UI_CODE_WORDS = new Set([
    'Enter',
    'Escape',
    'Space',
    'Tab',
    'Backspace',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight'
]);
const SKIP_FILE_PATTERNS = [
    /src[\\/]lib[\\/]Regelbog\.svelte$/,
    /src[\\/]lib[\\/]event.*\.ts$/,
    /src[\\/]lib[\\/]klokken_paa_torvet_events\.ts$/
];
const CODE_EXTENSIONS = new Set(['.svelte', '.ts']);

export function listUiFiles(rootDir = 'src') {
    const files = [];

    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }

            const normalized = fullPath.replaceAll(path.sep, '/');
            if (!CODE_EXTENSIONS.has(path.extname(entry.name))) continue;
            if (SKIP_FILE_PATTERNS.some((pattern) => pattern.test(normalized))) continue;
            files.push(normalized);
        }
    }

    walk(rootDir);
    return files.sort();
}

export function escapeCell(value) {
    return String(value ?? '')
        .replaceAll('\\', '\\\\')
        .replaceAll('\t', '\\t')
        .replaceAll('\r', '\\r')
        .replaceAll('\n', '\\n')
        .replace(/ +$/g, (spaces) => '\\s'.repeat(spaces.length));
}

export function unescapeCell(value) {
    let out = '';
    for (let i = 0; i < value.length; i++) {
        const char = value[i];
        if (char !== '\\' || i === value.length - 1) {
            out += char;
            continue;
        }

        const next = value[++i];
        if (next === 't') out += '\t';
        else if (next === 'r') out += '\r';
        else if (next === 'n') out += '\n';
        else if (next === 's') out += ' ';
        else out += next;
    }
    return out;
}

export function parseTsv(text) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length === 0) return [];

    const headers = lines[0].split('\t');
    return lines.slice(1).map((line, rowIndex) => {
        const values = line.split('\t');
        const row = { __row: rowIndex + 2 };
        headers.forEach((header, index) => {
            row[header] = unescapeCell(values[index] ?? '');
        });
        return row;
    });
}

export function toTsv(rows) {
    const headers = ['id', 'file', 'kind', 'context', 'original', 'updated'];
    return [
        headers.join('\t'),
        ...rows.map((row) =>
            headers.map((header) => escapeCell(row[header] ?? '')).join('\t').replace(/\t$/, '')
        )
    ].join('\n') + '\n';
}

export function hashText(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function maskRanges(source, ranges) {
    const chars = source.split('');
    for (const [start, end] of ranges) {
        for (let i = start; i < end; i++) {
            if (chars[i] !== '\n' && chars[i] !== '\r') chars[i] = ' ';
        }
    }
    return chars.join('');
}

function findTagRanges(source, tagName) {
    const ranges = [];
    const regex = new RegExp(`<${tagName}\\b[\\s\\S]*?<\\/${tagName}>`, 'gi');
    let match;
    while ((match = regex.exec(source))) ranges.push([match.index, match.index + match[0].length]);
    return ranges;
}

function decodeJsString(raw) {
    try {
        return JSON.parse(`"${raw.replaceAll('"', '\\"')}"`);
    } catch {
        return raw
            .replaceAll('\\n', '\n')
            .replaceAll('\\r', '\r')
            .replaceAll('\\t', '\t')
            .replaceAll("\\'", "'")
            .replaceAll('\\"', '"')
            .replaceAll('\\\\', '\\');
    }
}

function encodeJsString(value, quote) {
    return String(value)
        .replaceAll('\\', '\\\\')
        .replaceAll('\r', '\\r')
        .replaceAll('\n', '\\n')
        .replaceAll('\t', '\\t')
        .replaceAll(quote, `\\${quote}`);
}

export function encodeForKind(value, kind, quote = "'") {
    if (kind === 'string') return encodeJsString(value, quote);
    if (kind === 'attribute') return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    return String(value);
}

export function shouldKeepText(text) {
    const value = text.trim();
    if (value.length < 2) return false;
    if (!/[A-Za-zÆØÅæøå]/.test(value)) return false;
    if (NON_UI_CODE_WORDS.has(value)) return false;
    if (/^[/$.]/.test(value)) return false;
    if (/\.(webp|png|jpg|jpeg|svg|mp3|wav|ts|svelte|css|sql)$/i.test(value)) return false;
    if (value.includes('$lib/')) return false;
    if (/^#[0-9a-f]{3,8}$/i.test(value)) return false;
    if (/^[a-z0-9_:-]+$/.test(value) && value.length < 20) return false;
    if (/^[A-Z0-9_:-]+$/.test(value) && value.length < 20) return false;
    return true;
}

function lineAndColumn(source, index) {
    const before = source.slice(0, index);
    const lines = before.split(/\r?\n/);
    return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function contextFor(source, start, fallback) {
    const { line, column } = lineAndColumn(source, start);
    return `${fallback} @ ${line}:${column}`;
}

function makeRow(file, source, kind, context, start, end, original, quote = '') {
    return {
        id: `${file}:${start}:${end}:${kind}:${hashText(original)}`,
        file,
        kind,
        context,
        original,
        updated: '',
        start,
        end,
        quote
    };
}

export function extractTextsFromFile(file) {
    const source = fs.readFileSync(file, 'utf8');
    const rows = [];
    const scriptStyleRanges = [...findTagRanges(source, 'script'), ...findTagRanges(source, 'style')];
    const markupOnly = maskRanges(source, scriptStyleRanges);

    const textNodeRegex = />([^<>{}]+)</g;
    let match;
    while ((match = textNodeRegex.exec(markupOnly))) {
        const fullInner = match[1];
        const trimmed = fullInner.trim();
        if (!shouldKeepText(trimmed)) continue;
        const leading = fullInner.search(/\S/);
        const start = match.index + 1 + leading;
        const end = start + trimmed.length;
        rows.push(makeRow(file, source, 'text', contextFor(source, start, 'markup'), start, end, trimmed));
    }

    const attrRegex = /\b([a-zA-Z-]+)=["']([^"']+)["']/g;
    while ((match = attrRegex.exec(source))) {
        const attr = match[1];
        const original = match[2];
        if (!TEXT_ATTRS.has(attr) || !shouldKeepText(original)) continue;
        const start = match.index + match[0].indexOf(original);
        const end = start + original.length;
        rows.push(makeRow(file, source, 'attribute', contextFor(source, start, attr), start, end, original, '"'));
    }

    const stringRegex = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
    while ((match = stringRegex.exec(source))) {
        const quote = match[1];
        const raw = match[2];
        if (quote === '`' && raw.includes('${')) continue;
        const original = decodeJsString(raw);
        if (!shouldKeepText(original)) continue;

        const prefix = source.slice(Math.max(0, match.index - 40), match.index);
        if (/\bimport\s*$|\bfrom\s*$/.test(prefix)) continue;
        if (/\bclass:|class=|style=/.test(prefix)) continue;

        const start = match.index + 1;
        const end = start + raw.length;
        rows.push(makeRow(file, source, 'string', contextFor(source, start, 'string'), start, end, original, quote));
    }

    const seen = new Set();
    return rows
        .filter((row) => {
            const key = `${row.start}:${row.end}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => a.start - b.start);
}

export function parseId(id) {
    const match = /^(.*):(\d+):(\d+):([^:]+):([^:]+)$/.exec(id);
    if (!match) return null;
    return {
        file: match[1],
        start: Number(match[2]),
        end: Number(match[3]),
        kind: match[4],
        hash: match[5]
    };
}
