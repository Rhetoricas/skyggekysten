import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';

let rundeGuld = 0;
let rundeLiv = 0;

export function delNyeKort() {
    const typer = ['slut'];
    const antalLiv = Math.random() > 0.5 ? 2 : 1;
    const antalGuld = 3 - antalLiv;

    for(let i=0; i<antalLiv; i++) typer.push('liv');
    for(let i=0; i<antalGuld; i++) typer.push('guld');

    typer.sort(() => Math.random() - 0.5);

    const jackpotIndex = Math.random() < 0.02 ? typer.indexOf('guld') : -1;

    spilTilstand.venteKort = typer.map((type, indeks) => {
        let vaerdi = 0;
        if (type === 'liv') {
            vaerdi = Math.floor(Math.random() * 5) + 1;
        } else if (type === 'guld') {
            if (indeks === jackpotIndex) {
                vaerdi = 100;
            } else {
                vaerdi = Math.floor(Math.random() * 4) + 2;
            }
        }
        return { type, vaerdi, afsloeret: false };
    });
}

export function erNaesteVenteRundeGratis() {
    return spilTilstand.venteGratisFeltBrugt !== spilTilstand.spillerIndex;
}

export function startVenteSpil(kosterPenge: boolean = false) {
    const foersteRunde = erNaesteVenteRundeGratis();
    const skalBetale = kosterPenge && !foersteRunde;

    if (skalBetale) {
        const totalGuld = spilTilstand.guldTotal + spilTilstand.ventePuljeGuld;
        if (totalGuld < 5) return;

        if (spilTilstand.ventePuljeGuld >= 5) {
            spilTilstand.ventePuljeGuld -= 5;
        } else {
            const restPris = 5 - spilTilstand.ventePuljeGuld;
            spilTilstand.ventePuljeGuld = 0;
            spilTilstand.guldTotal -= restPris;
        }
        spilTilstand.logBesked = "Du lægger 5 guld på bordet. Impen blander kortene.";
    } else {
        spilTilstand.logBesked = foersteRunde
            ? "Impen blander kortene til første runde. Den er gratis."
            : "Impen blander kortene.";
    }
    
    spilTilstand.venteSpilAktiv = true;
    spilTilstand.venteFase = 'spiller';
    spilTilstand.sidsteVenteDag = spilTilstand.dag;
    spilTilstand.venteRunde++;
    if (foersteRunde) spilTilstand.venteGratisFeltBrugt = spilTilstand.spillerIndex;

    rundeGuld = 0;
    rundeLiv = 0;

    delNyeKort();
    syncTilDb();
}

export function vendKort(indeks: number) {
    if (spilTilstand.venteFase !== 'spiller' || spilTilstand.venteKort[indeks].afsloeret) return;

    const kort = spilTilstand.venteKort[indeks];
    kort.afsloeret = true;

    if (kort.type === 'slut') {
        spilTilstand.ventePuljeGuld -= rundeGuld;
        spilTilstand.ventePuljeLiv -= rundeLiv;

        spilTilstand.logBesked = `Kraniet bed. Du mistede runde-gevinsten på ${rundeGuld} Guld og ${rundeLiv} HP. Du beholder din sikre pulje.`;
        spilTilstand.venteFase = 'tabt'; 
        
        rundeGuld = 0;
        rundeLiv = 0;
        syncTilDb();

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
            if (kort.vaerdi === 100) spilTilstand.logBesked = "Jackpot! Du fandt den legendariske guldskat.";
        }

        spilTilstand.venteFase = 'viser_gevinst';
        syncTilDb();

        setTimeout(() => {
            if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                spilTilstand.venteKort = spilTilstand.venteKort.map(k => ({...k, afsloeret: true}));
                
                setTimeout(() => {
                    if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                        spilTilstand.venteKort = spilTilstand.venteKort.map(k => ({...k, afsloeret: false}));
                        
                        setTimeout(() => {
                            if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                                delNyeKort();
                                spilTilstand.venteFase = 'spiller';
                            }
                        }, 500); 
                    }
                }, 1500); 
            }
        }, 600); 
    }
}

function udbetalPulje() {
    if (spilTilstand.ventePuljeLiv > 0 || spilTilstand.ventePuljeGuld > 0) {
        spilTilstand.livspoint += spilTilstand.ventePuljeLiv;
        spilTilstand.guldTotal += spilTilstand.ventePuljeGuld;
        spilTilstand.logBesked = `Du forlod bordet. Du indkasserede ${spilTilstand.ventePuljeGuld} Guld og ${spilTilstand.ventePuljeLiv} HP.`;
        
        spilTilstand.ventePuljeLiv = 0;
        spilTilstand.ventePuljeGuld = 0;
        syncTilDb();
    }
}

export function stopVenteSpil() {
    spilTilstand.logBesked = "Du låser puljen på bordet. Den tåler nu kraniets bid.";
    spilTilstand.venteFase = 'vundet';
    syncTilDb();
}

export function lukVenteSpil() {
    udbetalPulje();

    spilTilstand.venteSpilAktiv = false;
    spilTilstand.venteRunde = 0;
    spilTilstand.venteFase = 'venter';
    syncTilDb();
}
