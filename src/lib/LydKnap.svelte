<script lang="ts">
    import { lydIkon, lydKontrol, lydTitel, skiftLydNiveau } from '$lib/lydKontrol.svelte';

    let { knapClass = '' } = $props<{ knapClass?: string }>();
</script>

<button
    class="musik-toggle-btn {knapClass}"
    class:lyd-lav={lydKontrol.niveau === 'lav'}
    class:lyd-slukket={lydKontrol.niveau === 'slukket'}
    onclick={skiftLydNiveau}
    title={`${lydTitel()} - klik for næste niveau`}
    aria-label={`${lydTitel()} - klik for næste niveau`}
>
    <img src={lydIkon()} alt="" />
</button>

<style>
    .musik-toggle-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        cursor: pointer;
        padding: 9px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, background 0.2s, border-color 0.2s;
    }

    .musik-toggle-btn img {
        height: 54px;
        width: auto;
        opacity: 0.86;
    }

    .musik-toggle-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: #666;
        transform: scale(1.04);
    }

    .musik-toggle-btn:hover img {
        opacity: 1;
    }

    .musik-toggle-btn.lyd-lav img {
        opacity: 0.55;
    }

    .musik-toggle-btn.lyd-slukket {
        background: rgba(0, 0, 0, 0.22);
    }

    @media (max-width: 700px) {
        .musik-toggle-btn img {
            height: 42px;
        }
    }
</style>
