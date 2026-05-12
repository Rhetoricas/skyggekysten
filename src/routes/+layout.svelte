<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0a0a0a" />
</svelte:head>

{@render children()}

<style>
    :global(html) {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        overscroll-behavior: none;
        background: #0a0a0a;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100dvh;
        background: #0a0a0a;
        color: white;
        font-family: 'Lato', sans-serif;
        overflow: hidden;
        overscroll-behavior: none;
    }

    :global(h1), :global(h2), :global(h3) {
        font-family: 'Cinzel', serif;
        font-weight: 700;
    }

    :global(button) {
        border: none;
    }
</style>
