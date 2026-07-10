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

    return linjer.length > 0 ? linjer.join(' | ') : tekst('Der er ingen spillere på listen endnu.', 'There are no players on the list yet.');
}

function afsigDom() {
    const egneMiner = spilTilstand.gitter.filter((felt) => felt.hasGoldmine && felt.mineOwner === spilTilstand.spillerNavn).length;
    const kendteFelter = spilTilstand.mineKendteFelter.length;
    const langRute = spilTilstand.historik?.length || 0;

    if (spilTilstand.livspoint <= 25) {
        return {
            logBesked: 'Dommeren ser på dine sår og lukker sagen. Du har allerede betalt nok. Da han sænker hånden, vender lidt af styrken tilbage.',
            logBeskedEn: 'The judge looks at your wounds and closes the case. You have already paid enough. As he lowers his hand, some of your strength returns.',
            hpOp: 24,
            maxHpAendring: 5
        };
    }

    if (egneMiner >= 3) {
        const bod = Math.min(spilTilstand.guldTotal, 80 + egneMiner * 40);
        return {
            logBesked: `Dommeren tæller dine miner og ignorerer din forklaring. "Ejerskab gør dig ikke uskyldig." Bøden står ikke til forhandling.`,
            logBeskedEn: `The judge counts your mines and ignores your explanation. "Ownership does not make you innocent." The fine is not up for negotiation.`,
            guldNed: bod
        };
    }

    if (spilTilstand.guldTotal >= 800) {
        return {
            logBesked: 'Dommeren vejer din pung i hånden. "Så meget guld kræver en forklaring. Jeg behøver ikke tro på den." Han opkræver et retsgebyr.',
            logBeskedEn: 'The judge weighs your purse in his hand. "That much gold demands an explanation. I do not have to believe it." He charges a court fee.',
            guldNed: 160
        };
    }

    if (kendteFelter >= 120 || langRute >= 70) {
        return {
            logBesked: 'Dommeren følger din rute med en finger. "Du har set mere, end du har taget." Kendelsen er kort: Du må fortsætte.',
            logBeskedEn: 'The judge traces your route with one finger. "You have seen more than you have taken." The ruling is brief: you may continue.',
            maxHpAendring: 8,
            hpOp: 10
        };
    }

    return {
        logBesked: 'Dommeren finder ikke noget at dømme dig for. Det virker næsten værre. Han rækker dig en møntpose og vil se, hvad du gør med den.',
        logBeskedEn: 'The judge finds nothing to convict you of. That almost feels worse. He hands you a coin pouch to see what you do with it.',
        guldOp: 70
    };
}

export const metaEvents: Record<string, SpilEvent> = {
    dommeren_ved_broen: {
        id: 'dommeren_ved_broen',
        titel: 'Dommeren ved broen',
        titelEn: 'The Judge at the Bridge',
        tekst: 'En dommer sidder ved en bro, der ender midt i ingenting. På bordet ligger en vægt, en våd logbog og et kort over din rute. Han spørger ikke, hvad du har gjort. Det står allerede foran ham.',
        tekstEn: 'A judge sits beside a bridge that ends in the middle of nowhere. On the table lie a scale, a wet logbook and a map of your route. He does not ask what you have done. It is already laid out before him.',
        biome: ['ruin', 'by', 'ritual', 'slagmark'],
        billede: '/events/ev_ruin.webp',
        unik: false,
        minKolonnePct: 0.60,
        valg: [
            {
                tekst: 'Modtag dommen',
                tekstEn: 'Hear the verdict',
                effekt: () => afsigDom()
            },
            {
                tekst: 'Betal 120 guld og luk sagen',
                tekstEn: 'Pay 120 gold to close the case',
                puljeVaerdi: 120,
                udfaldListe: [
                    { log: 'Dommeren tager imod guldet uden at kalde det bestikkelse. Han lukker logbogen og fjerner din sag fra bordet.', logEn: 'The judge accepts the gold without calling it a bribe. He closes the logbook and removes your case from the table.', maxHpAendring: 3 }
                ]
            },
            {
                tekst: 'Afvis dommerens ret',
                tekstEn: 'Reject the judge’s authority',
                effekt: () => ({
                    logBesked: 'Dommeren nikker, som om din indvending allerede står i papirerne. Broen bag ham rykker sig et skridt længere væk.',
                    logBeskedEn: 'The judge nods as if your objection is already written in the papers. The bridge behind him shifts one step farther away.',
                    hpNed: 12,
                    energiNed: 2
                })
            }
        ]
    },

    banken_under_jorden: {
        id: 'banken_under_jorden',
        titel: 'Banken under jorden',
        titelEn: 'The Underground Bank',
        tekst: 'En luge i græsset fører ned til en bank med støvede skranker og alt for høje stole. Kassereren kender allerede dit navn, din saldo og stillingen på øen.',
        tekstEn: 'A hatch in the grass leads down to a bank with dusty counters and chairs that are far too tall. The cashier already knows your name, your balance and the island standings.',
        biome: ['by', 'marked', 'ruin'],
        billede: '/events/guldhus.webp',
        valg: [
            {
                tekst: 'Se øens stilling',
                tekstEn: 'View the island standings',
                effekt: () => {
                    const logBesked = tekst(
                        `Kassereren skubber et ark over disken. Stillingen er: ${hentScoreOversigt()}`,
                        `The cashier slides a sheet across the counter. The standings are: ${hentScoreOversigt()}`
                    );
                    return {
                        logBesked,
                        logBeskedEn: logBesked
                    };
                }
            },
            {
                tekst: 'Lån 250 guld',
                tekstEn: 'Borrow 250 gold',
                effekt: () => ({
                    logBesked: 'Kassereren tæller guldet op med et smil. Et sted under dit navn bliver renten skrevet med småt.',
                    logBeskedEn: 'The cashier counts out the gold with a smile. Somewhere beneath your name, the interest is added in small print.',
                    guldOp: 250,
                    maxHpAendring: -8
                })
            },
            {
                tekst: 'Skjul saldoen for 150 guld',
                tekstEn: 'Hide your balance for 150 gold',
                puljeVaerdi: 150,
                udfaldListe: [
                    { log: 'Kassereren flytter din saldo til en bog uden titel. Det virker ikke sikkert, men ingen andre kan længere se den.', logEn: 'The cashier moves your balance to an untitled book. It does not seem safe, but no one else can see it now.', maxHpAendring: 6 }
                ]
            },
            {
                tekst: 'Plyndr banken',
                tekstEn: 'Rob the bank',
                kraeverItem: 'svaerd',
                effekt: () => ({
                    logBesked: 'Du slår låsen af pengekassen. Guldet er ægte, og det er alarmen også.',
                    logBeskedEn: 'You break the lock off the cashbox. The gold is real, and so is the alarm.',
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
        tekst: 'Et sort fyrtårn står langt inde på øen. Der er ingen trappe op, men lyset drejer stadig bag glasset. Lyskeglen strejfer tågen og standser ved dig.',
        tekstEn: 'A black lighthouse stands far inland. There is no staircase, but the light still turns behind the glass. Its beam sweeps across the fog and stops on you.',
        biome: ['ruin', 'bjerg', 'hoejland', 'hav'],
        billede: '/events/ev_krystal.webp',
        minKolonnePct: 0.45,
        unik: true,
        valg: [
            {
                tekst: 'Lys mod øst efter en båd',
                tekstEn: 'Search east for a boat',
                effekt: () => ({
                    logBesked: lysBaadForAlle()
                })
            },
            {
                tekst: 'Hold tågen tilbage i tre dage',
                tekstEn: 'Hold back the fog for three days',
                effekt: () => {
                    holdTaagenTilbage(3);
                    return {
                        logBesked: 'Lyset skærer gennem tågen og holder den på afstand. Det varer kun tre dage, men indtil da rykker den ikke frem.',
                        logBeskedEn: 'The light cuts through the fog and holds it at bay. It will last only three days, but until then the fog cannot advance.',
                        energiNed: 2
                    };
                }
            },
            {
                tekst: 'Knus lanternen og tag linserne',
                tekstEn: 'Break the lantern and take the lenses',
                effekt: () => ({
                    logBesked: 'Glasset brister uden en lyd. Linserne er ikke af glas, men slebne af mørke diamanter.',
                    logBeskedEn: 'The glass breaks without a sound. The lenses are not glass, but cut from dark diamonds.',
                    hpNed: 10,
                    itemUd: 'diamant, diamant'
                })
            },
            {
                tekst: 'Lad fyrtårnet stå',
                tekstEn: 'Leave the lighthouse alone',
                udfaldListe: [
                    { log: 'Du går videre. Lyskeglen følger dig et øjeblik og vender så tilbage mod tågen.', logEn: 'You move on. The beam follows you for a moment, then turns back toward the fog.' }
                ]
            }
        ]
    },

    meteorologen_i_stormen: {
        id: 'meteorologen_i_stormen',
        titel: 'Meteorologen i stormen',
        titelEn: 'The Meteorologist in the Storm',
        tekst: 'En kvinde med måleinstrumenter spændt over hele frakken står i mudderet og råber tal ind i vinden. Tågen er ikke vejr, siger hun, men den opfører sig næsten sådan.',
        tekstEn: 'A woman with measuring instruments strapped across her coat stands in the mud, shouting numbers into the wind. The fog is not weather, she says, but it behaves almost like it.',
        biome: ['hoejland', 'bjerg', 'mark', 'ruin'],
        billede: '/events/skovtaage.webp',
        minKolonnePct: 0.25,
        unik: true,
        valg: [
            {
                tekst: 'Byg en tågeblokker',
                tekstEn: 'Build a fog blocker',
                effekt: () => {
                    opretTaageblokker();
                    return {
                        logBesked: 'I slår pæle i jorden, spænder kobbertråd ud og hænger en sort glaslinse mellem dem. Tågen kan stadig rykke frem, men den kan ikke passere blokkerens felt på denne række.',
                        logBeskedEn: 'You drive stakes into the ground, stretch copper wire between them and hang a black glass lens in the middle. The fog can still advance, but it cannot pass the blocker’s tile on this row.',
                        energiNed: 3
                    };
                }
            },
            {
                tekst: 'Køb målingerne for 90 guld',
                tekstEn: 'Buy the readings for 90 gold',
                puljeVaerdi: 90,
                effekt: () => {
                    const nyeFelter = new Set(spilTilstand.mineKendteFelter);
                    const start = Math.max(0, spilTilstand.spillerIndex - 2);
                    const slut = Math.min(spilTilstand.gitter.length - 1, spilTilstand.spillerIndex + 2);
                    for (let i = start; i <= slut; i++) nyeFelter.add(i);
                    spilTilstand.mineKendteFelter = Array.from(nyeFelter);
                    return {
                        logBesked: 'Hun rækker dig et ark med tal og pile. Da du sammenholder det med landskabet, bliver området omkring dig lettere at aflæse.',
                        logBeskedEn: 'She hands you a sheet covered in numbers and arrows. When you compare it with the landscape, the area around you becomes easier to read.'
                    };
                }
            },
            {
                tekst: 'Stjæl den sorte linse',
                tekstEn: 'Steal the black lens',
                effekt: () => ({
                    logBesked: 'Du river linsen fri af stativet. Hun griner kort, som om din reaktion bare bekræfter hendes beregninger. Linsen viser sig at være en diamant.',
                    logBeskedEn: 'You tear the lens from its stand. She gives a short laugh, as if your reaction only confirms her calculations. The lens turns out to be a diamond.',
                    hpNed: 8,
                    itemUd: 'diamant'
                })
            },
            {
                tekst: 'Lad hende arbejde videre',
                tekstEn: 'Let her keep working',
                udfaldListe: [
                    { log: 'Hun nikker uden at se op og fortsætter med at notere vindens bevægelser.', logEn: 'She nods without looking up and continues recording the wind’s movements.' }
                ]
            }
        ]
    }
};
