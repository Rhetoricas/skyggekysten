<script lang="ts">
    import { gemProfilSprog } from '$lib/auth.svelte';
    import { sprogState, tekst, type AppSprog } from '$lib/i18n.svelte';

    let { knapClass = '' } = $props<{ knapClass?: string }>();

    function vaelgSprog(sprog: AppSprog) {
        if (sprogState.sprog === sprog) return;
        void gemProfilSprog(sprog);
    }
</script>

<div class="sprog-segmenteret {knapClass}" role="group" aria-label={tekst('Vælg sprog', 'Choose language')}>
    <button
        type="button"
        class:aktiv={sprogState.sprog === 'da'}
        aria-pressed={sprogState.sprog === 'da'}
        title={tekst('Dansk', 'Danish')}
        onclick={() => vaelgSprog('da')}
    >
        DA
    </button>
    <button
        type="button"
        class:aktiv={sprogState.sprog === 'en'}
        aria-pressed={sprogState.sprog === 'en'}
        title={tekst('Engelsk', 'English')}
        onclick={() => vaelgSprog('en')}
    >
        EN
    </button>
</div>

<style>
    .sprog-segmenteret {
        height: 42px;
        padding: 3px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.22);
        display: inline-flex;
        align-items: center;
        gap: 2px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    }

    .sprog-segmenteret button {
        min-width: 34px;
        height: 34px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: rgba(238, 244, 239, 0.7);
        font-family: 'Cinzel', serif;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
        transition: background 0.2s, color 0.2s, transform 0.2s;
    }

    .sprog-segmenteret button.aktiv {
        background: rgba(238, 244, 239, 0.18);
        color: #ffffff;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
    }

    .sprog-segmenteret button:hover,
    .sprog-segmenteret button:focus-visible {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        transform: translateY(-1px);
        outline: none;
    }

    @media (max-width: 700px) {
        .sprog-segmenteret {
            height: 38px;
            padding: 2px;
        }

        .sprog-segmenteret button {
            min-width: 31px;
            height: 31px;
            font-size: 0.72rem;
        }
    }
</style>
