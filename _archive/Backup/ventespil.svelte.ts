import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';

// Lokal tilstand for den aktuelle streak
let rundeGuld = 0;
let rundeLiv = 0;

function delNyeKort() {
    spilTilstand.logBesked = "Kortene bliver blandet på ny...";
    
    const typer = ['slut'];
    const antalLiv = Math.random() > 0.5 ? 2 : 1;
    const antalGuld = 3 - antalLiv;

    for(let i=0; i<antalLiv; i++) typer.push('liv');
    for(let i=0; i<antalGuld; i++) typer.push('guld');

    typer.sort(() => Math.random() - 0.5);

    const jackpotIndex = Math.random() < 0.02 ? typer.indexOf('guld') : -1;

    spilTilstand.venteKort = typer.map((type, i) => {
        let vaerdi = 0;
        if (type === 'liv') {
            vaerdi = Math.floor(Math.random() * 3) + 1;
        } else if (type === 'guld') {
            if (i === jackpotIndex) {
                vaerdi = 50;
            } else {
                vaerdi = Math.floor(Math.random() * 5) + 1;
            }
        }
        return { type, vaerdi, afsloeret: false };
    });
}

export function startVenteSpil(kosterPenge: boolean = false) {
    if (kosterPenge) {
        const totalGuld = spilTilstand.guldTotal + spilTilstand.ventePuljeGuld;
        if (totalGuld < 5) return;

        // Puljen på bordet dækker regningen først
        if (spilTilstand.ventePuljeGuld >= 5) {
            spilTilstand.ventePuljeGuld -= 5;
        } else {
            const restPris = 5 - spilTilstand.ventePuljeGuld;
            spilTilstand.ventePuljeGuld = 0;
            spilTilstand.guldTotal -= restPris;
        }
    }
    
    spilTilstand.venteSpilAktiv = true;
    spilTilstand.venteFase = 'spiller';
    spilTilstand.sidsteVenteDag = spilTilstand.dag;
    spilTilstand.venteRunde++;

    rundeGuld = 0;
    rundeLiv = 0;

    delNyeKort();
}

export function vendKort(index: number) {
    if (spilTilstand.venteFase !== 'spiller' || spilTilstand.venteKort[index].afsloeret) return;

    const kort = spilTilstand.venteKort[index];
    kort.afsloeret = true;

    if (kort.type === 'slut') {
        spilTilstand.ventePuljeGuld -= rundeGuld;
        spilTilstand.ventePuljeLiv -= rundeLiv;

        spilTilstand.logBesked = `Kraniet bed! Runde-gevinsten på ${rundeGuld} Guld og ${rundeLiv} HP gik tabt. Sikret pulje er intakt.`;
        spilTilstand.venteFase = 'tabt'; 
        
        rundeGuld = 0;
        rundeLiv = 0;
        syncTilDb(true);

        // Afslør de resterende kort efter et halvt sekund, så man kan se resten af bordet
        setTimeout(() => {
            if (spilTilstand.venteSpilAktiv) {
                spilTilstand.venteKort = spilTilstand.venteKort.map(k => ({...k, afsloeret: true}));
            }
        }, 500);

    } else {
        if (kort.type === 'liv') {
            spilTilstand.ventePuljeLiv += kort.vaerdi;
            rundeLiv += kort.vaerdi; 
        }
        if (kort.type === 'guld') {
            spilTilstand.ventePuljeGuld += kort.vaerdi;
            rundeGuld += kort.vaerdi; 
            if (kort.vaerdi === 50) spilTilstand.logBesked = "Jackpot! Du fandt den legendariske guldskat!";
        }

        spilTilstand.venteFase = 'viser_gevinst';
        syncTilDb(true);

        // 1. Afslør resten af kortene, så spilleren kan se hvad de gik glip af
        setTimeout(() => {
            if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                spilTilstand.venteKort = spilTilstand.venteKort.map(k => ({...k, afsloeret: true}));
                
                // 2. Vend dem om på maven igen efter at have kigget på dem
                setTimeout(() => {
                    if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                        spilTilstand.venteKort = spilTilstand.venteKort.map(k => ({...k, afsloeret: false}));
                        
                        // 3. Del uset ud igen
                        setTimeout(() => {
                            if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                                delNyeKort();
                                spilTilstand.venteFase = 'spiller';
                            }
                        }, 500); // Tiden det tager at vende kortet fysisk via CSS
                    }
                }, 1500); // 1.5 sekunders kiggetid på de usynlige gevinster
            }
        }, 600); // Pause lige efter man har vendt sit eget kort
    }
}

function udbetalPulje() {
    if (spilTilstand.ventePuljeLiv > 0 || spilTilstand.ventePuljeGuld > 0) {
        spilTilstand.livspoint += spilTilstand.ventePuljeLiv;
        spilTilstand.guldTotal += spilTilstand.ventePuljeGuld;
        spilTilstand.logBesked = `Du forlod bordet og indkasserede ${spilTilstand.ventePuljeGuld} Guld og ${spilTilstand.ventePuljeLiv} HP.`;
        
        spilTilstand.ventePuljeLiv = 0;
        spilTilstand.ventePuljeGuld = 0;
        syncTilDb(true);
    }
}

export function stopVenteSpil() {
    spilTilstand.logBesked = "Du har låst puljen på bordet. Den er nu sikker mod kraniet.";
    spilTilstand.venteFase = 'vundet';
    syncTilDb(true);
}

export function lukVenteSpil() {
    // Først når spilleren forlader bordet (eller smides af pga tåge), udbetales alt
    udbetalPulje();

    spilTilstand.venteSpilAktiv = false;
    spilTilstand.venteRunde = 0;
    syncTilDb(true);
}