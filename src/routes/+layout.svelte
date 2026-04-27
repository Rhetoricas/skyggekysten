<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import BottomUI from '$lib/BottomUI.svelte';
    import { spilTilstand } from '$lib/spilTilstand.svelte';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if spilTilstand.gameState === 'play'}
    <BottomUI />
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #0a0a0a;
        color: white;
        font-family: 'Lato', sans-serif;
        overflow: hidden;
    }

    :global(h1), :global(h2), :global(h3) {
        font-family: 'Cinzel', serif;
        font-weight: 700;
    }

    :global(button) {
        border: none;
    }
</style>