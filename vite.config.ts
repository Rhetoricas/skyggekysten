import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	define: {
		__ITCH_BUILD__: JSON.stringify(process.env.ITCH_BUILD === '1'),
		__LIVE_APP_URL__: JSON.stringify(process.env.VITE_LIVE_APP_URL || 'https://fogisland.vercel.app')
	},
	plugins: [sveltekit()]
});
