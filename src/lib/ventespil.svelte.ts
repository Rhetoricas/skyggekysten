import { spilTilstand } from './spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { registrerHeling } from './trofaeer';
import { tekst } from './i18n.svelte';

export const VENTE_MAKS_MS = 60 * 1000;
export const VENTE_FRI_DAGE = 5;

let rundeGuld = 0;
let rundeLiv = 0;
let venteKlientGeneration = 0;

export function nulstilVenteSpilKlientState() {
    rundeGuld = 0;
    rundeLiv = 0;
    venteKlientGeneration++;
}

export function venteTidTilbageMs(now = Date.now()) {
    const startTid = spilTilstand.venteStartTid || now;
    return Math.max(0, VENTE_MAKS_MS - (now - startTid));
}

export function erVenteTidUdlobet(now = Date.now()) {
    return spilTilstand.venteSpilAktiv && venteTidTilbageMs(now) <= 0;
}

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
    if (!spilTilstand.venteSpilAktiv || !spilTilstand.venteStartTid) {
        spilTilstand.venteStartTid = Date.now();
    }

    if (erVenteTidUdlobet()) {
        spilTilstand.venteSpilAktiv = true;
        spilTilstand.venteFase = 'venter';
        spilTilstand.logBesked = tekst('Impen pakker kortene væk. Der er ikke tid til en ny runde.', 'The imp is putting the cards away. There is no time for another round.');
        syncTilDb();
        return;
    }

    const foersteRunde = erNaesteVenteRundeGratis();
    const skalBetale = !foersteRunde && kosterPenge;

    if (!foersteRunde && !kosterPenge) {
        spilTilstand.venteSpilAktiv = true;
        spilTilstand.venteFase = 'venter';
        spilTilstand.logBesked = tekst('Gratisrunden på dette felt er brugt. Du kan spille igen for 5 guld, mens du venter.', 'The free round on this tile is used. You can play again for 5 gold while you wait.');
        if (spilTilstand.venteKort.length === 0) delNyeKort();
        syncTilDb();
        return;
    }

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
        spilTilstand.logBesked = tekst('Du lægger 5 guld på bordet. Impen blander kortene.', 'You put 5 gold on the table. The imp shuffles the cards.');
    } else {
        spilTilstand.logBesked = foersteRunde
            ? tekst('Impen blander kortene. Første runde er gratis.', 'The imp shuffles the cards. The first round is free.')
            : tekst('Impen blander kortene.', 'The imp shuffles the cards.');
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
    const aktuelGeneration = venteKlientGeneration;

    const kort = spilTilstand.venteKort[indeks];
    kort.afsloeret = true;

    if (kort.type === 'slut') {
        spilTilstand.ventePuljeGuld -= rundeGuld;
        spilTilstand.ventePuljeLiv -= rundeLiv;

        spilTilstand.logBesked = tekst(
            `Kraniet dukker op. Du mister rundens ${rundeGuld} guld og ${rundeLiv} HP, men din sikrede pulje er i sikkerhed.`,
            `The skull appears. You lose this round’s ${rundeGuld} gold and ${rundeLiv} HP, but your secured pot is safe.`
        );
        spilTilstand.venteFase = 'tabt'; 
        
        rundeGuld = 0;
        rundeLiv = 0;
        syncTilDb();

        setTimeout(() => {
            if (aktuelGeneration !== venteKlientGeneration) return;
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
            if (kort.vaerdi === 100) spilTilstand.logBesked = tekst('Jackpot! Kortet er 100 guld værd.', 'Jackpot! The card is worth 100 gold.');
        }

        spilTilstand.venteFase = 'viser_gevinst';
        syncTilDb();

        setTimeout(() => {
            if (aktuelGeneration !== venteKlientGeneration) return;
            if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                spilTilstand.venteKort = spilTilstand.venteKort.map(k => ({...k, afsloeret: true}));
                
                setTimeout(() => {
                    if (aktuelGeneration !== venteKlientGeneration) return;
                    if (spilTilstand.venteSpilAktiv && spilTilstand.venteFase === 'viser_gevinst') {
                        spilTilstand.venteKort = spilTilstand.venteKort.map(k => ({...k, afsloeret: false}));
                        
                        setTimeout(() => {
                            if (aktuelGeneration !== venteKlientGeneration) return;
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
        const foerHp = spilTilstand.livspoint;
        spilTilstand.livspoint += spilTilstand.ventePuljeLiv;
        registrerHeling(foerHp, spilTilstand.livspoint);
        spilTilstand.guldTotal += spilTilstand.ventePuljeGuld;
        spilTilstand.logBesked = tekst(
            `Du forlader bordet med ${spilTilstand.ventePuljeGuld} guld og ${spilTilstand.ventePuljeLiv} HP.`,
            `You leave the table with ${spilTilstand.ventePuljeGuld} gold and ${spilTilstand.ventePuljeLiv} HP.`
        );
        
        spilTilstand.ventePuljeLiv = 0;
        spilTilstand.ventePuljeGuld = 0;
        syncTilDb();
    }
}

export function stopVenteSpil() {
    spilTilstand.logBesked = tekst('Du sikrer puljen. Kraniet kan ikke tage den i næste runde.', 'You secure the pot. The skull cannot take it in the next round.');
    spilTilstand.venteFase = 'vundet';
    syncTilDb();
}

export function lukVenteSpil() {
    udbetalPulje();

    spilTilstand.venteFriIndtilDag = Math.max(spilTilstand.venteFriIndtilDag || 0, (spilTilstand.dag || 1) + VENTE_FRI_DAGE);
    const mig = spilTilstand.alleSpillere[spilTilstand.spillerNavn];
    if (mig) mig.venteFriIndtilDag = spilTilstand.venteFriIndtilDag;

    spilTilstand.venteSpilAktiv = false;
    spilTilstand.venteRunde = 0;
    spilTilstand.venteStartTid = 0;
    spilTilstand.venteFase = 'venter';
    syncTilDb();
}
