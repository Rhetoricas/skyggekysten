import { spilTilstand } from './spilTilstand.svelte';
import { beregnSpillerScore } from './score';
import { holdTaagenTilbage, lysBaadForAlle, opretTaageblokker } from './spilmotor';
import type { SpilEvent } from './eventBibliotek';
import type { SpillerData } from './types';
import { tekst } from './i18n.svelte';

function beregnLiveScore(navn: string, data: Partial<SpillerData>) {
    const erMig = navn === spilTilstand.spillerNavn;
    const guld = erMig ? spilTilstand.guldTotal : (data.guld || 0);
    const hp = erMig ? spilTilstand.livspoint : (data.hp || 0);
    const kolonne = erMig ? spilTilstand.maxKolonne : (data.kolonne || 0);
    const erVinder = erMig
        ? spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map'
        : !!data.isWinner;

    return beregnSpillerScore(spilTilstand.gitter, spilTilstand.alleSpillere, navn, {
        ...data,
        guld,
        hp,
        kolonne,
        kendteFelter: erMig ? spilTilstand.mineKendteFelter : data.kendteFelter,
        mitUdstyr: erMig ? spilTilstand.mitUdstyr : data.mitUdstyr,
        isWinner: erVinder
    }, erVinder, spilTilstand.kortBredde, spilTilstand.kortHoejde);
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
                mitUdstyr: spilTilstand.mitUdstyr,
                isWinner: spilTilstand.gameState === 'win' || spilTilstand.gameState === 'win_map'
            } satisfies Partial<SpillerData>]
        ];

    const linjer = medMig
        .map(([navn, data]) => ({ navn, score: beregnLiveScore(navn, data) }))
        .sort((a, b) => b.score - a.score)
        .map((r, index) => `${index + 1}. ${r.navn}: ${r.score}`);

    return linjer.length > 0 ? linjer.join(' | ') : tekst('Ingen spillere er registreret endnu.', 'No players are registered yet.');
}

function afsigDom() {
    const egneMiner = spilTilstand.gitter.filter((felt) => felt.hasGoldmine && felt.mineOwner === spilTilstand.spillerNavn).length;
    const kendteFelter = spilTilstand.mineKendteFelter.length;
    const langRute = spilTilstand.historik?.length || 0;

    if (spilTilstand.livspoint <= 25) {
        return {
            logBesked: 'Dommeren læser din tavshed som bevis. Du har allerede betalt nok. Han lader hånden falde, og kroppen finder lidt styrke igen.',
            logBeskedEn: 'The judge reads your silence as evidence. You have already paid enough. He lowers his hand, and your body finds a little strength again.',
            hpOp: 24,
            maxHpAendring: 5
        };
    }

    if (egneMiner >= 3) {
        const bod = Math.min(spilTilstand.guldTotal, 80 + egneMiner * 40);
        return {
            logBesked: `Dommeren tæller dine miner, ikke dine ord. "Ejerskab er ikke uskyld." Bøden falder uden forhandling.`,
            logBeskedEn: `The judge counts your mines, not your words. "Ownership is not innocence." The fine falls without negotiation.`,
            guldNed: bod
        };
    }

    if (spilTilstand.guldTotal >= 800) {
        return {
            logBesked: 'Dommeren vejer din pung i hånden. "Så meget guld har altid en forklaring. Den behøver ikke være sand." Han tager retsgebyr.',
            logBeskedEn: 'The judge weighs your purse in his hand. "That much gold always has an explanation. It does not have to be true." He takes a court fee.',
            guldNed: 160
        };
    }

    if (kendteFelter >= 120 || langRute >= 70) {
        return {
            logBesked: 'Dommeren følger din rute med en finger. "Du har set mere end du har taget." Kendelsen er kort: fortsæt.',
            logBeskedEn: 'The judge follows your route with one finger. "You have seen more than you have taken." The ruling is brief: continue.',
            maxHpAendring: 8,
            hpOp: 10
        };
    }

    return {
        logBesked: 'Dommeren finder ingen stor sag i dig. Det virker næsten værre. Han giver dig en møntpose for at se, hvad du gør med den.',
        logBeskedEn: 'The judge finds no great case in you. That almost feels worse. He gives you a coin pouch to see what you do with it.',
        guldOp: 70
    };
}

export const metaEvents: Record<string, SpilEvent> = {
    dommeren_ved_broen: {
        id: 'dommeren_ved_broen',
        titel: 'Dommeren ved broen',
        titelEn: 'The Judge at the Bridge',
        tekst: 'En dommer sidder ved en bro, der ikke fører nogen steder hen. På bordet ligger en vægt, en våd logbog og et kort over din rute. Han spørger ikke, hvad du har gjort. Han ved det allerede.',
        tekstEn: 'A judge sits by a bridge that leads nowhere. On the table lie a scale, a wet logbook and a map of your route. He does not ask what you have done. He already knows.',
        biome: ['ruin', 'by', 'ritual', 'slagmark'],
        billede: '/events/ev_ruin.webp',
        unik: false,
        minKolonnePct: 0.60,
        valg: [
            {
                tekst: 'Lad ham dømme din rejse',
                tekstEn: 'Let him judge your journey',
                effekt: () => afsigDom()
            },
            {
                tekst: 'Betal sagsomkostninger og få sagen lukket',
                tekstEn: 'Pay court costs and close the case',
                puljeVaerdi: 120,
                udfaldListe: [
                    { log: 'Dommeren tager imod guldet uden at kalde det bestikkelse. Sagen forsvinder fra bordet.', logEn: 'The judge accepts the gold without calling it a bribe. The case vanishes from the table.', maxHpAendring: 3 }
                ]
            },
            {
                tekst: 'Nægt at anerkende retten',
                tekstEn: 'Refuse to recognize the court',
                effekt: () => ({
                    logBesked: 'Dommeren nikker, som om den indvending også stod i papirerne. Broen bag ham rykker sig et skridt længere væk.',
                    logBeskedEn: 'The judge nods as if that objection was also written in the papers. The bridge behind him moves one step farther away.',
                    hpNed: 12,
                    energiNed: 2
                })
            }
        ]
    },

    banken_under_jorden: {
        id: 'banken_under_jorden',
        titel: 'Banken under jorden',
        titelEn: 'The Bank Underground',
        tekst: 'En luge i græsset åbner ned til en bank med tørre tællere og alt for høje stole. Kassereren kender dit navn, din saldo og stillingen på hele øen.',
        tekstEn: 'A hatch in the grass opens down to a bank with dry counters and chairs far too tall. The cashier knows your name, your balance and the standings across the island.',
        biome: ['by', 'marked', 'ruin'],
        billede: '/events/guldhus.webp',
        valg: [
            {
                tekst: 'Bed om kontoudtog for øen',
                tekstEn: 'Ask for the island account statement',
                effekt: () => {
                    const logBesked = tekst(
                        `Kassereren skubber et papir over disken. Aktuel stilling: ${hentScoreOversigt()}`,
                        `The cashier slides a paper across the counter. Current standings: ${hentScoreOversigt()}`
                    );
                    return {
                        logBesked,
                        logBeskedEn: logBesked
                    };
                }
            },
            {
                tekst: 'Tag et hurtigt lån på 250 guld',
                tekstEn: 'Take a quick loan of 250 gold',
                effekt: () => ({
                    logBesked: 'Kassereren smiler, mens renten bliver skrevet et sted under dit navn.',
                    logBeskedEn: 'The cashier smiles while the interest is written somewhere under your name.',
                    guldOp: 250,
                    maxHpAendring: -8
                })
            },
            {
                tekst: 'Betal 150 guld for at skjule din saldo',
                tekstEn: 'Pay 150 gold to hide your balance',
                puljeVaerdi: 150,
                udfaldListe: [
                    { log: 'Din saldo bliver ført ind i en bog uden titel. Det føles ikke sikkert, men det føles privat.', logEn: 'Your balance is entered into a book without a title. It does not feel safe, but it feels private.', maxHpAendring: 6 }
                ]
            },
            {
                tekst: 'Plyndr banken med dit våben',
                tekstEn: 'Rob the bank with your weapon',
                kraeverItem: 'svaerd',
                effekt: () => ({
                    logBesked: 'Du slår låsen af kassen. Guldet er virkeligt. Alarmen er også virkelig.',
                    logBeskedEn: 'You knock the lock off the box. The gold is real. The alarm is also real.',
                    guldOp: 360,
                    hpNed: 18
                })
            }
        ]
    },

    det_sorte_fyrtaarn: {
        id: 'det_sorte_fyrtaarn',
        titel: 'Det sorte fyrtårn',
        titelEn: 'The Black Lighthouse',
        tekst: 'Et sort fyrtårn står inde på øen, langt fra kysten. Der er ingen trappe op, men lyset bevæger sig alligevel bag glasset. Det søger ikke skibe. Det søger beslutninger.',
        tekstEn: 'A black lighthouse stands inland, far from the coast. There is no stair upward, but the light still moves behind the glass. It does not seek ships. It seeks decisions.',
        biome: ['ruin', 'bjerg', 'hoejland', 'hav'],
        billede: '/events/ev_krystal.webp',
        minKolonnePct: 0.45,
        unik: true,
        valg: [
            {
                tekst: 'Drej lyset mod øst og find en båd',
                tekstEn: 'Turn the light east and find a boat',
                effekt: () => ({
                    logBesked: lysBaadForAlle()
                })
            },
            {
                tekst: 'Vend lyset mod tågen og hold den tilbage i tre dage',
                tekstEn: 'Turn the light toward the fog and hold it back for three days',
                effekt: () => {
                    holdTaagenTilbage(3);
                    return {
                        logBesked: 'Lyset rammer tågen som en mur. Den standser ikke for evigt, men i tre dage tør den ikke rykke frem.',
                        logBeskedEn: 'The light hits the fog like a wall. It does not stop forever, but for three days it dares not move forward.',
                        energiNed: 2
                    };
                }
            },
            {
                tekst: 'Smadr lanternen og tag linserne',
                tekstEn: 'Smash the lantern and take the lenses',
                effekt: () => ({
                    logBesked: 'Glasset springer uden lyd. Inde i lanternen ligger linserne ikke som glas, men som hårde, mørke diamanter.',
                    logBeskedEn: 'The glass bursts without sound. Inside the lantern, the lenses are not glass, but hard dark diamonds.',
                    hpNed: 10,
                    itemUd: 'diamant, diamant'
                })
            },
            {
                tekst: 'Lad fyrtårnet lyse videre',
                tekstEn: 'Let the lighthouse keep shining',
                udfaldListe: [
                    { log: 'Du går, mens lyset vender sig efter dig. Det virker næsten lettet over ikke at være blevet brugt.', logEn: 'You leave while the light turns after you. It seems almost relieved not to have been used.' }
                ]
            }
        ]
    },

    meteorologen_i_stormen: {
        id: 'meteorologen_i_stormen',
        titel: 'Meteorologen i stormen',
        titelEn: 'The Meteorologist in the Storm',
        tekst: 'En kvinde i en frakke fuld af måleinstrumenter står med fødderne i mudderet og råber tal ind i vinden. Hun siger, at tågen ikke er vejr. Hun siger også, at det er tæt nok på.',
        tekstEn: 'A woman in a coat full of measuring instruments stands with her feet in the mud, shouting numbers into the wind. She says the fog is not weather. She also says it is close enough.',
        biome: ['hoejland', 'bjerg', 'mark', 'ruin'],
        billede: '/events/skovtaage.webp',
        minKolonnePct: 0.25,
        unik: true,
        valg: [
            {
                tekst: 'Hjælp hende med at rejse en tågeblokker',
                tekstEn: 'Help her raise a fog blocker',
                effekt: () => {
                    opretTaageblokker();
                    return {
                        logBesked: 'I slår pæle ned, spænder kobbertråd og hænger en sort glaslinse i vinden. Tågen kan stadig komme, men på denne række kan den ikke passere blokkerens felt.',
                        logBeskedEn: 'You drive stakes, stretch copper wire and hang a black glass lens in the wind. The fog can still come, but on this row it cannot pass the blocker’s tile.',
                        energiNed: 3
                    };
                }
            },
            {
                tekst: 'Køb hendes målinger',
                tekstEn: 'Buy her measurements',
                puljeVaerdi: 90,
                effekt: () => {
                    const nyeFelter = new Set(spilTilstand.mineKendteFelter);
                    const start = Math.max(0, spilTilstand.spillerIndex - 2);
                    const slut = Math.min(spilTilstand.gitter.length - 1, spilTilstand.spillerIndex + 2);
                    for (let i = start; i <= slut; i++) nyeFelter.add(i);
                    spilTilstand.mineKendteFelter = Array.from(nyeFelter);
                    return {
                        logBesked: 'Hun sælger dig en side med tal og pile. De nærmeste mønstre i tågen giver pludselig mening.',
                        logBeskedEn: 'She sells you a page of numbers and arrows. The nearest patterns in the fog suddenly make sense.'
                    };
                }
            },
            {
                tekst: 'Stjæl hendes sorte glaslinse',
                tekstEn: 'Steal her black glass lens',
                effekt: () => ({
                    logBesked: 'Du river linsen fri af stativet. Hun griner, som om tyveri også var en måling. Linsen er mere værd, end den burde være.',
                    logBeskedEn: 'You tear the lens free from the stand. She laughs as if theft was also a measurement. The lens is worth more than it should be.',
                    hpNed: 8,
                    itemUd: 'diamant'
                })
            },
            {
                tekst: 'Lad hende fortsætte sine målinger',
                tekstEn: 'Let her continue her measurements',
                udfaldListe: [
                    { log: 'Hun nikker uden at kigge på dig. Bag hende skriver vinden videre i hendes notesbog.', logEn: 'She nods without looking at you. Behind her, the wind keeps writing in her notebook.' }
                ]
            }
        ]
    }
};
