import fs from 'node:fs';
import { DEFAULT_OUTFILE, encodeForKind, hashText, parseId, parseTsv } from './text-table-utils.mjs';

const inFile = process.argv[2] || DEFAULT_OUTFILE;

if (!fs.existsSync(inFile)) {
    console.error(`Filen findes ikke: ${inFile}`);
    process.exit(1);
}

const rows = parseTsv(fs.readFileSync(inFile, 'utf8'));
const changesByFile = new Map();
const skipped = [];

for (const row of rows) {
    const updated = row.updated?.trim() ? row.updated : '';
    if (!updated || updated === row.original) continue;

    const parsed = parseId(row.id);
    if (!parsed) {
        skipped.push(`Række ${row.__row}: ugyldigt id`);
        continue;
    }

    if (!fs.existsSync(parsed.file)) {
        skipped.push(`Række ${row.__row}: filen findes ikke (${parsed.file})`);
        continue;
    }

    if (!changesByFile.has(parsed.file)) changesByFile.set(parsed.file, []);
    changesByFile.get(parsed.file).push({ ...parsed, row, updated });
}

let changed = 0;

for (const [file, changes] of changesByFile) {
    let source = fs.readFileSync(file, 'utf8');
    const sorted = changes.sort((a, b) => b.start - a.start);

    for (const change of sorted) {
        const currentRaw = source.slice(change.start, change.end);
        const expected = change.kind === 'string'
            ? encodeForKind(change.row.original, change.kind, source[change.start - 1] || "'")
            : change.row.original;

        if (hashText(change.row.original) !== change.hash || currentRaw !== expected) {
            skipped.push(`Række ${change.row.__row}: teksten matcher ikke længere i ${file}`);
            continue;
        }

        const quote = change.kind === 'string' ? (source[change.start - 1] || "'") : '"';
        const replacement = encodeForKind(change.updated, change.kind, quote);
        source = source.slice(0, change.start) + replacement + source.slice(change.end);
        changed++;
    }

    fs.writeFileSync(file, source, 'utf8');
}

console.log(`Opdaterede ${changed} UI-tekster fra ${inFile}`);
if (skipped.length > 0) {
    console.log(`Sprang ${skipped.length} rækker over:`);
    for (const line of skipped) console.log(`- ${line}`);
}
