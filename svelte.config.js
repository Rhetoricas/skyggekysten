import adapterAuto from '@sveltejs/adapter-auto';
import adapterStatic from '@sveltejs/adapter-static';

const itchBuild = process.env.ITCH_BUILD === '1';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		appDir: itchBuild ? 'app' : '_app',
		adapter: itchBuild
			? adapterStatic({
					pages: 'build-itch',
					assets: 'build-itch',
					strict: true
				})
			: adapterAuto(),
		paths: {
			relative: itchBuild
		},
		serviceWorker: {
			register: !itchBuild
		}
	}
};

export default config;
