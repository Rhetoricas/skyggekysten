import { spilTilstand } from './spilTilstand.svelte';
import { beregnFremdriftPoint, beregnMinePoint, taelScoreSpillere } from './score';
import { holdTaagenTilbage, lysBaadForAlle, opretTaageblokker } from './spilmotor';
import type { SpilEvent } from './eventBibliotek';
import type { SpillerData } from './types';

function beregnLiveScore(navn: string, data: Partial<SpillerData>) {
    const antalSpillere = taelScoreSpillere(spilTilstand.alleSpillere);
    const erMig = navn === spilTilstand.spillerNavn;
    const guld = erMig ? spilTilstand.guldTotal : (data.guld || 0);
    const hp = erMig ? spilTilstand.livspoint : (data.hp || 0);
    const kolonne = erMig ? spilTilstand.maxKolonne : (data.kolonne || 0);
    const kendteFelter = erMig ? spilTilstand.mineKendteFelter.length : (data.kendteFelter?.length || 0);
    const erVinder = erMig
        ? spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map'
        : !!data.isWinner;

    const fremdriftPoint = beregnFremdriftPoint(kolonne, erVinder);
    const udforskningPoint = kendteFelter * 2;
    const minePoint = beregnMinePoint(spilTilstand.gitter, navn, antalSpillere);

    return Math.floor((guld + fremdriftPoint + udforskningPoint + minePoint) * (1 + Math.max(0, hp) / 1000));
}

function hentScoreOversigt() {
    const spillere = Object.entries(spilTilstand.alleSpillere);
    const medMig: Array<[string, Partial<SpillerData>]> = spillere.some(([navn]) => navn === spilTilstand.spillerNavn)
        ? spillere
        : [
            ...spillere,
            [spilTilstand.spillerNavn, {
                hp: spilTilstand.livspoint,
                guld: spilTilstand.guldTotal,
                kolonne: spilTilstand.maxKolonne,
                kendteFelter: spilTilstand.mineKendteFelter,
                isWinner: spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map'
            } satisfies Partial<SpillerData>]
        ];

    const linjer = medMig
        .map(([navn, data]) => ({ navn, score: beregnLiveScore(navn, data) }))
        .sort((a, b) => b.score - a.score)
        .map((r, index) => `${index + 1}. ${r.navn}: ${r.score}`);

    return linjer.length > 0 ? linjer.join(' | ') : 'Ingen spillere er registreret endnu.';
}

function afsigDom() {
    const egneMiner = spilTilstand.gitter.filter((felt) => felt.hasGoldmine && felt.mineOwner === spilTilstand.spillerNavn).length;
    const kendteFelter = spilTilstand.mineKendteFelter.length;
    const langRute = spilTilstand.historik?.length || 0;

    if (spilTilstand.livspoint <= 25) {
        return {
            logBesked: 'Dommeren læser din tavshed som bevis. Du har allerede betalt nok. Han lader hånden falde, og kroppen finder lidt styrke igen.',
            hpOp: 24,
            maxHpAendring: 5
        };
    }

    if (egneMiner >= 3) {
        const bod = Math.min(spilTilstand.guldTotal, 80 + egneMiner * 40);
        return {
            logBesked: `Dommeren tæller dine miner, ikke dine ord. "Ejerskab er ikke uskyld." Bøden falder uden forhandling.`,
            guldNed: bod
        };
    }

    if (spilTilstand.guldTotal >= 800) {
        return {
            logBesked: 'Dommeren vejer din pung i hånden. "Så meget guld har altid en forklaring. Den behøver ikke være sand." Han tager retsgebyr.',
            guldNed: 160
        };
    }

    if (kendteFelter >= 120 || langRute >= 70) {
        return {
            logBesked: 'Dommeren følger din rute med en finger. "Du har set mere end du har taget." Kendelsen er kort: fortsæt.',
            maxHpAendring: 8,
            hpOp: 10
        };
    }

    return {
        logBesked: 'Dommeren finder ingen stor sag i dig. Det virker næsten værre. Han giver dig en møntpose for at se, hvad du gør med den.',
        guldOp: 70
    };
}

export const metaEvents: Record<string, SpilEvent> = {
    dommeren_ved_broen: {
        id: 'dommeren_ved_broen',
        titel: 'Dommeren ved broen',
        tekst: 'En dommer sidder ved en bro, der ikke fører nogen steder hen. På bordet ligger en vægt, en våd logbog og et kort over din rute. Han spørger ikke, hvad du har gjort. Han ved det allerede.',
        biome: ['ruin', 'by', 'ritual', 'slagmark'],
        billede: '/events/ev_ruin.webp',
        unik: true,
        minKolonnePct: 0.60,
        valg: [
            {
                tekst: 'Lad ham dømme din rejse',
                effekt: () => afsigDom()
            },
            {
                tekst: 'Betal sagsomkostninger og få sagen lukket',
                puljeVaerdi: 120,
                udfaldListe: [
                    { log: 'Dommeren tager imod guldet uden at kalde det bestikkelse. Sagen forsvinder fra bordet.', maxHpAendring: 3 }
                ]
            },
            {
                tekst: 'Nægt at anerkende retten',
                effekt: () => ({
                    logBesked: 'Dommeren nikker, som om den indvending også stod i papirerne. Broen bag ham rykker sig et skridt længere væk.',
                    hpNed: 12,
                    energiNed: 2
                })
            }
        ]
    },

    banken_under_jorden: {
        id: 'banken_under_jorden',
        titel: 'Banken under jorden',
        tekst: 'En luge i græsset åbner ned til en bank med tørre tællere og alt for høje stole. Kassereren kender dit navn, din saldo og stillingen på hele øen.',
        biome: ['by', 'marked', 'ruin'],
        billede: '/events/guldhus.webp',
        valg: [
            {
                tekst: 'Bed om kontoudtog for øen',
                effekt: () => ({
                    logBesked: `Kassereren skubber et papir over disken. Aktuel stilling: ${hentScoreOversigt()}`
                })
            },
            {
                tekst: 'Tag et hurtigt lån på 250 guld',
                effekt: () => ({
                    logBesked: 'Kassereren smiler, mens renten bliver skrevet et sted under dit navn.',
                    guldOp: 250,
                    maxHpAendring: -8
                })
            },
            {
                tekst: 'Betal 150 guld for at skjule din saldo',
                puljeVaerdi: 150,
                udfaldListe: [
                    { log: 'Din saldo bliver ført ind i en bog uden titel. Det føles ikke sikkert, men det føles privat.', maxHpAendring: 6 }
                ]
            },
            {
                tekst: 'Plyndr banken med dit våben',
                kraeverItem: 'svaerd',
                effekt: () => ({
                    logBesked: 'Du slår låsen af kassen. Guldet er virkeligt. Alarmen er også virkelig.',
                    guldOp: 360,
                    hpNed: 18
                })
            }
        ]
    },

    det_sorte_fyrtaarn: {
        id: 'det_sorte_fyrtaarn',
        titel: 'Det sorte fyrtårn',
        tekst: 'Et sort fyrtårn står inde på øen, langt fra kysten. Der er ingen trappe op, men lyset bevæger sig alligevel bag glasset. Det søger ikke skibe. Det søger beslutninger.',
        biome: ['ruin', 'bjerg', 'hoejland', 'hav'],
        billede: '/events/ev_krystal.webp',
        minKolonnePct: 0.45,
        unik: true,
        valg: [
            {
                tekst: 'Drej lyset mod øst og find en båd',
                effekt: () => ({
                    logBesked: lysBaadForAlle()
                })
            },
            {
                tekst: 'Vend lyset mod tågen og hold den tilbage i tre dage',
                effekt: () => {
                    holdTaagenTilbage(3);
                    return {
                        logBesked: 'Lyset rammer tågen som en mur. Den standser ikke for evigt, men i tre dage tør den ikke rykke frem.',
                        energiNed: 2
                    };
                }
            },
            {
                tekst: 'Smadr lanternen og tag linserne',
                effekt: () => ({
                    logBesked: 'Glasset springer uden lyd. Inde i lanternen ligger linserne ikke som glas, men som hårde, mørke diamanter.',
                    hpNed: 10,
                    itemUd: 'diamant, diamant'
                })
            },
            {
                tekst: 'Lad fyrtårnet lyse videre',
                udfaldListe: [
                    { log: 'Du går, mens lyset vender sig efter dig. Det virker næsten lettet over ikke at være blevet brugt.' }
                ]
            }
        ]
    },

    meteorologen_i_stormen: {
        id: 'meteorologen_i_stormen',
        titel: 'Meteorologen i stormen',
        tekst: 'En kvinde i en frakke fuld af måleinstrumenter står med fødderne i mudderet og råber tal ind i vinden. Hun siger, at tågen ikke er vejr. Hun siger også, at det er tæt nok på.',
        biome: ['hoejland', 'bjerg', 'mark', 'ruin'],
        billede: '/events/skovtaage.webp',
        minKolonnePct: 0.25,
        unik: true,
        valg: [
            {
                tekst: 'Hjælp hende med at rejse en tågeblokker',
                effekt: () => {
                    opretTaageblokker();
                    return {
                        logBesked: 'I slår pæle ned, spænder kobbertråd og hænger en sort glaslinse i vinden. Tågen kan stadig komme, men på denne række kan den ikke passere blokkerens felt.',
                        energiNed: 3
                    };
                }
            },
            {
                tekst: 'Køb hendes målinger',
                puljeVaerdi: 90,
                effekt: () => {
                    const nyeFelter = new Set(spilTilstand.mineKendteFelter);
                    const start = Math.max(0, spilTilstand.spillerIndex - 2);
                    const slut = Math.min(spilTilstand.gitter.length - 1, spilTilstand.spillerIndex + 2);
                    for (let i = start; i <= slut; i++) nyeFelter.add(i);
                    spilTilstand.mineKendteFelter = Array.from(nyeFelter);
                    return {
                        logBesked: 'Hun sælger dig en side med tal og pile. De nærmeste mønstre i tågen giver pludselig mening.'
                    };
                }
            },
            {
                tekst: 'Stjæl hendes sorte glaslinse',
                effekt: () => ({
                    logBesked: 'Du river linsen fri af stativet. Hun griner, som om tyveri også var en måling. Linsen er mere værd, end den burde være.',
                    hpNed: 8,
                    itemUd: 'diamant'
                })
            },
            {
                tekst: 'Lad hende fortsætte sine målinger',
                udfaldListe: [
                    { log: 'Hun nikker uden at kigge på dig. Bag hende skriver vinden videre i hendes notesbog.' }
                ]
            }
        ]
    }
};
