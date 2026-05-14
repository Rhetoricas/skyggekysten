import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_OUTFILE, extractTextsFromFile, listUiFiles, toTsv } from './text-table-utils.mjs';

const outFile = process.argv[2] || DEFAULT_OUTFILE;
const rows = listUiFiles('src').flatMap((file) => extractTextsFromFile(file));

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, toTsv(rows), 'utf8');

console.log(`Eksporterede ${rows.length} UI-tekster til ${outFile}`);
console.log('Ret kun i kolonnen "updated". Regelbog og eventfiler er udeladt i denne runde.');
