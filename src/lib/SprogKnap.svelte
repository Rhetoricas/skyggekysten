<script lang="ts">
    import { gemProfilSprog } from '$lib/auth.svelte';
    import { sprogState, tekst, type AppSprog } from '$lib/i18n.svelte';

    let { knapClass = '' } = $props<{ knapClass?: string }>();

    function naesteSprog(): AppSprog {
        return sprogState.sprog === 'en' ? 'da' : 'en';
    }

    function skiftSprog() {
        void gemProfilSprog(naesteSprog());
    }
</script>

<button
    type="button"
    class="sprog-toggle-btn {knapClass}"
    onclick={skiftSprog}
    title={tekst('Skift sprog', 'Change language')}
    aria-label={tekst('Skift sprog', 'Change language')}
>
    {sprogState.sprog === 'en' ? 'DA' : 'EN'}
</button>

<style>
    .sprog-toggle-btn {
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.2);
        color: #eef4ef;
        font-family: 'Cinzel', serif;
        font-size: 0.88rem;
        font-weight: 700;
        letter-spacing: 0;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
        transition: transform 0.2s, background 0.2s, border-color 0.2s;
    }

    .sprog-toggle-btn:hover,
    .sprog-toggle-btn:focus-visible {
        transform: scale(1.04);
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.45);
        outline: none;
    }

    @media (max-width: 700px) {
        .sprog-toggle-btn {
            width: 38px;
            height: 38px;
            font-size: 0.78rem;
        }
    }
</style>
