<script lang="ts">
    import { lydIkon, lydKontrol, lydTitel, skiftLydNiveau } from '$lib/lydKontrol.svelte';
    import { gemProfilLydNiveau } from '$lib/auth.svelte';

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
    title={`${lydTitel()} - klik for næste niveau`}
    aria-label={`${lydTitel()} - klik for næste niveau`}
>
    <img src={lydIkon()} alt="" />
</button>

<style>
    .musik-toggle-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, filter 0.2s;
    }

    .musik-toggle-btn img {
        height: 54px;
        width: auto;
        opacity: 0.86;
    }

    .musik-toggle-btn:hover {
        transform: scale(1.04);
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.35));
    }

    .musik-toggle-btn:hover img {
        opacity: 1;
    }

    .musik-toggle-btn.lyd-lav img {
        opacity: 0.55;
    }

    .musik-toggle-btn.lyd-slukket {
        opacity: 0.72;
    }

    @media (max-width: 700px) {
        .musik-toggle-btn img {
            height: 42px;
        }
    }
</style>
