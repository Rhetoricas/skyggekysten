import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const buildDir = 'build-itch';
const assetRoots = [
	'audio',
	'events',
	'game_faces',
	'inventory',
	'screens',
	'tiles',
	'ui',
	'video',
	'manifest.webmanifest',
	'robots.txt'
];

const assetPattern = assetRoots
	.map((root) => root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
	.join('|');

function walk(dir) {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		const stats = statSync(path);
		return stats.isDirectory() ? walk(path) : [path];
	});
}

function fixHtmlOrJs(source) {
	return source.replace(new RegExp(`(["'\`])\\/(${assetPattern})(?=[/"'\`])`, 'g'), '$1./$2');
}

function fixCss(source) {
	return source.replace(new RegExp(`url\\((["']?)\\/(${assetPattern})(?=[/)"'])`, 'g'), "url($1../../../$2");
}

let changed = 0;
for (const file of walk(buildDir)) {
	if (file.endsWith('service-worker.js')) continue;
	if (!/\.(html|js|css)$/.test(file)) continue;

	const source = readFileSync(file, 'utf8');
	const fixed = file.endsWith('.css') ? fixCss(source) : fixHtmlOrJs(source);

	if (fixed !== source) {
		writeFileSync(file, fixed);
		changed += 1;
	}
}

console.log(`Fixed itch asset paths in ${changed} files.`);
