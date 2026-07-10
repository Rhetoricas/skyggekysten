<script lang="ts">
    import { lydKontrol, lydTitel, skiftLydNiveau } from '$lib/lydKontrol.svelte';
    import { gemProfilLydNiveau } from '$lib/auth.svelte';
    import { tekst } from '$lib/i18n.svelte';

    let { knapClass = '' } = $props<{ knapClass?: string }>();

    function skiftOgGemLyd() {
        skiftLydNiveau();
        void gemProfilLydNiveau(lydKontrol.niveau);
    }
</script>

<button
    class="musik-toggle-btn {knapClass}"
    class:lyd-lav={lydKontrol.niveau === 'lav'}
    class:lyd-slukket={lydKontrol.niveau === 'slukket'}
    onclick={skiftOgGemLyd}
    title={`${lydTitel()} – ${tekst('tryk for næste niveau', 'press for next level')}`}
    aria-label={`${lydTitel()} – ${tekst('tryk for næste niveau', 'press for next level')}`}
>
    <svg class="lyd-ikon" viewBox="0 0 48 48" aria-hidden="true">
        <path class="lyd-højttaler" d="M7 19h8l11-9v28l-11-9H7z" />
        {#if lydKontrol.niveau === 'slukket'}
            <path class="lyd-kryds" d="M34 18l8 8m0-8l-8 8" />
        {:else}
            <path class="lyd-boelge" d="M31 18c2 2 3 4 3 6s-1 4-3 6" />
            {#if lydKontrol.niveau === 'fuld'}
                <path class="lyd-boelge lyd-boelge-stor" d="M36 13c4 4 6 8 6 11s-2 7-6 11" />
            {/if}
        {/if}
    </svg>
</button>

<style>
    .musik-toggle-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, filter 0.2s;
    }

    .lyd-ikon {
        width: 37px;
        height: 37px;
        opacity: 0.9;
        overflow: visible;
        filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.72));
    }

    .lyd-højttaler {
        fill: #d9e4df;
        stroke: #f4fbf8;
        stroke-width: 1.5;
        stroke-linejoin: round;
    }

    .lyd-boelge,
    .lyd-kryds {
        fill: none;
        stroke: #d9e4df;
        stroke-width: 3.5;
        stroke-linecap: round;
        stroke-linejoin: round;
    }

    .musik-toggle-btn:hover {
        transform: scale(1.04);
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.35));
    }

    .musik-toggle-btn:hover .lyd-ikon {
        opacity: 1;
    }

    .musik-toggle-btn.lyd-lav .lyd-ikon {
        opacity: 0.68;
    }

    .musik-toggle-btn.lyd-slukket {
        opacity: 0.76;
    }

    .musik-toggle-btn.lyd-slukket .lyd-højttaler,
    .musik-toggle-btn.lyd-slukket .lyd-kryds {
        stroke: #bfc7c3;
    }

    .musik-toggle-btn.lyd-slukket .lyd-højttaler {
        fill: #aeb8b4;
    }

    @media (max-width: 700px) {
        .musik-toggle-btn {
            width: 42px;
            height: 42px;
        }

        .lyd-ikon {
            width: 33px;
            height: 33px;
        }
    }
</style>
