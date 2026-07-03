import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const root = process.cwd();
const buildDir = resolve(root, 'build-itch');
const distDir = resolve(root, 'dist');
const zipPath = resolve(distDir, 'skyggekysten-itch.zip');

if (!existsSync(buildDir)) {
	console.error('build-itch was not found. Run npm run build:itch first.');
	process.exit(1);
}

mkdirSync(distDir, { recursive: true });

let result;
if (process.platform === 'win32') {
	const tempDir = mkdtempSync(resolve(tmpdir(), 'fog-island-itch-'));
	const scriptPath = resolve(tempDir, 'make-itch-zip.ps1');
	writeFileSync(
		scriptPath,
		[
			"$ErrorActionPreference = 'Stop'",
			"Add-Type -AssemblyName System.IO.Compression",
			"Add-Type -AssemblyName System.IO.Compression.FileSystem",
			`$buildDir = '${buildDir}'`,
			`$zipPath = '${zipPath}'`,
			"if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }",
			"$root = (Resolve-Path -LiteralPath $buildDir).Path.TrimEnd('\\', '/') + '\\'",
			"$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)",
			"try {",
			"  Get-ChildItem -LiteralPath $buildDir -Recurse -File | ForEach-Object {",
			"    $relative = $_.FullName.Substring($root.Length).Replace('\\', '/')",
			"    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null",
			"  }",
			"} finally {",
			"  $zip.Dispose()",
			"}"
		].join('\n'),
		'utf8'
	);
	try {
		result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], { stdio: 'inherit' });
	} finally {
		rmSync(tempDir, { recursive: true, force: true });
	}
} else {
	result = spawnSync('zip', ['-r', zipPath, '.'], { stdio: 'inherit', cwd: buildDir });
}

if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`Created ${zipPath}`);
