import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const buildResult = spawnSync(npmCommand, ['run', 'build'], {
	stdio: 'inherit',
	shell: process.platform === 'win32',
	env: {
		...process.env,
		ITCH_BUILD: '1',
		VITE_APP_PLATFORM: 'itch'
	}
});

if (buildResult.error) {
	console.error(buildResult.error);
}

if (buildResult.status !== 0) process.exit(buildResult.status ?? 1);

const fixResult = spawnSync(process.execPath, ['scripts/fix-itch-assets.mjs'], {
	stdio: 'inherit'
});

if (fixResult.error) {
	console.error(fixResult.error);
}

process.exit(fixResult.status ?? 1);
