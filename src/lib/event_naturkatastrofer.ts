import { spilTilstand } from '$lib/spilTilstand.svelte';
import { broadcastFelt, syncKortTilDbSenere, syncTilDb } from './netvaerk';
import { udloesDoedeSlagmark, udloesInsektPlage, udloesJordskaelv, udloesNaturkatastrofe, udloesOversvoemmelse, udvindMeteorSkat } from './spilmotor';
import type { SpilEvent } from './eventBibliotek';

function ladFeltetStaa(logBesked: string) {
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (felt) {
        felt.eventFuldført = false;
        broadcastFelt(spilTilstand.spillerIndex, felt);
    }
    syncTilDb();
    syncKortTilDbSenere();
    return { logBesked };
}

function erKrigertype() {
    return ['knight_m', 'knight_f', 'viking_m', 'viking_f', 'orc_m', 'orc_f'].includes(spilTilstand.valgtKarakter?.id ?? '');
}

function rydAndenRustning() {
    spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter((ting) => ting.id !== 'rustning' && ting.id !== 'rustning_elver');
}

function vaekElverkongen(skade: number, logBesked: string) {
    udloesDoedeSlagmark(spilTilstand.spillerIndex);
    rydAndenRustning();
    return {
        logBesked,
        hpNed: skade,
        itemUd: 'rustning_elver'
    };
}

function slipInsekterLoes(logBesked: string) {
    const ramteMarker = udloesInsektPlage(spilTilstand.spillerIndex);
    const feltLog = ramteMarker > 0
        ? ` Græshopperne æder ${ramteMarker} modne markfelter i denne blok.`
        : ' Græshopperne søger efter modne marker i denne blok.';
    return { logBesked: `${logBesked}${feltLog}` };
}

export const naturkatastrofeEvents: Record<string, SpilEvent> = {
    alkymistens_insektglas: {
        id: 'alkymistens_insektglas',
        titel: 'Alkymistens glas',
        tekst: 'En alkymist sidder midt mellem forsøgsflasker og visne blade. I et tykt glas banker en græshoppe mod låget. Han siger, at giften næsten virker. Glasset siger noget andet.',
        biome: ['mark', 'eng', 'by', 'ruin'],
        billede: '/events/ev_mark.webp',
        unik: true,
        valg: [
            {
                tekst: 'Hjælp ham med at dosere giften',
                effekt: () => {
                    if (Math.random() < 0.62) {
                        return {
                            logBesked: 'Du holder glasset stille, mens alkymisten drypper en grå væske gennem lågets rist. Græshoppen går i stå. Alkymisten betaler uden at se dig i øjnene.',
                            guldOp: 120,
                            maxHpAendring: 4
                        };
                    }
                    return {
                        ...slipInsekterLoes('Du holder glasset for hårdt. Låget vrider sig fri, og noget vådt og hurtigt forsvinder ned mellem planterne.'),
                        hpNed: 12
                    };
                }
            },
            {
                tekst: 'Brænd græshoppen i glasset med en fakkel',
                kosterItem: 'fakkel',
                effekt: () => ({
                    logBesked: 'Flammen gør kort proces med græshoppen. Alkymisten bliver tavs, men han giver dig en flaske fra bordet.',
                    hpOp: 12,
                    maxHpAendring: 3
                })
            },
            {
                tekst: 'Knus glasset med dit våben og dræb græshoppen',
                kraeverItem: 'svaerd',
                effekt: () => ({
                    logBesked: 'Glasset springer, men sværdet rammer præcist. Græshoppen bliver liggende i de våde skår. Alkymisten er rasende, men markerne er stille.',
                    hpNed: 6,
                    guldOp: 60
                })
            },
            {
                tekst: 'Lad alkymisten fortsætte forsøget alene',
                effekt: () => slipInsekterLoes('Du går, mens alkymisten hvisker tal til sig selv. Bag dig lyder et skarpt smæld fra glasset.')
            },
            {
                tekst: 'Åbn glasset og se, hvad græshoppen gør',
                effekt: () => ({
                    ...slipInsekterLoes('Du løfter låget. Græshoppen sidder stille et halvt sekund, som om den lærer dit ansigt at kende. Så er den væk.'),
                    hpNed: 18
                })
            }
        ]
    },

    stjernekald: {
        id: 'stjernekald',
        titel: 'Stjernekaldet',
        tekst: 'Et sort stenalter står på åben jord. Inskriptionerne lover rigdom, hvis du kalder noget ned fra himlen. Advarslen er kort: nedslaget rammer ikke kun fjender.',
        biome: 'ritual',
        billede: '/events/ev_ritual.webp',
        unik: false,
        valg: [
            {
                tekst: 'Læs ritualet højt',
                effekt: () => {
                    udloesNaturkatastrofe(spilTilstand.spillerIndex);
                    return { logBesked: 'Du læser ordene højt. Himlen bliver mørkere over øen.' };
                }
            },
            {
                tekst: 'Lad alteret være',
                effekt: () => ladFeltetStaa('Du lader alteret stå.')
            }
        ]
    },

    meteor_skat: {
        id: 'meteor_skat',
        titel: 'Det Glødende Krater',
        tekst: 'I krateret ligger en varm stenklump med guldårer i overfladen. Den kan måske åbnes, før den køler helt ned.',
        biome: 'meteor',
        billede: '/events/meteor.webp',
        unik: false,
        valg: [
            {
                tekst: 'Grav med skovlen',
                kosterItem: 'skovl',
                effekt: (betaltItem?: string | null) => udvindMeteorSkat(betaltItem === 'mesterskovl' ? 'mesterskovl' : 'skovl')
            },
            {
                tekst: 'Flæk stenen med øksen',
                kosterItem: 'oekse',
                effekt: () => udvindMeteorSkat('oekse')
            },
            {
                tekst: 'Brug sværdet som brækjern',
                kosterItem: 'svaerd',
                effekt: () => udvindMeteorSkat('svaerd')
            },
            {
                tekst: 'Hæld livseliksir over stenen',
                kosterItem: 'livseliksir',
                effekt: () => udvindMeteorSkat('livseliksir')
            },
            {
                tekst: 'Forsøg med hænderne',
                effekt: () => udvindMeteorSkat('haender')
            },
            {
                tekst: 'Lad stenen ligge',
                effekt: () => ladFeltetStaa('Du lader stenen ligge. Den er stadig for varm.')
            }
        ]
    },

    jordens_hjerte: {
        id: 'jordens_hjerte',
        titel: 'Sprækken i Dybet',
        tekst: 'En smal revne skærer gennem jorden. Der kommer en lav brummen nedefra. Den stopper, når du står helt stille.',
        biome: ['bjerg', 'hule', 'hoejland'],
        billede: '/events/ev_bjerg.webp',
        unik: false,
        valg: [
            {
                tekst: 'Kast en fakkel ned i revnen',
                kosterItem: 'fakkel',
                effekt: () => {
                    udloesJordskaelv(spilTilstand.spillerIndex);
                    return { logBesked: 'Faklen forsvinder. Jorden rykker sig kort efter, og en begravet kiste bliver brudt op.', guldOp: 160 };
                }
            },
            {
                tekst: 'Træd tilbage',
                effekt: () => ladFeltetStaa('Du træder væk fra revnen.')
            }
        ]
    },

    havets_alter: {
        id: 'havets_alter',
        titel: 'Det Sunkne Alter',
        tekst: 'Et alter af drivtømmer og muslingeskaller står langt fra vandet. En mørk diamant ligger på en guldfod. Sandet omkring alteret er vådt.',
        biome: ['eng', 'mark', 'by', 'ruin'],
        billede: '/events/ev_hav.webp',
        unik: false,
        valg: [
            {
                tekst: 'Tag diamanten fra alteret',
                effekt: () => {
                    udloesOversvoemmelse(spilTilstand.spillerIndex);
                    return { logBesked: 'Du tager diamanten. Ude mod horisonten rejser vandet sig.', guldOp: 10, itemUd: 'diamant' };
                }
            },
            {
                tekst: 'Lad offergaven ligge',
                effekt: () => ladFeltetStaa('Du lader diamanten ligge.')
            }
        ]
    },

    elverkongen_paa_slagmarken: {
        id: 'elverkongen_paa_slagmarken',
        titel: 'Kongen i græsset',
        tekst: 'Mellem knækkede spyd ligger et lig, der ikke er rådnet. En gammel elverkonge hviler med hænderne om en grønlig rustning. Pilene i ham er sorte af jord, men kronen er ren.',
        biome: 'slagmark',
        billede: '/events/ev_slagmark.webp',
        unik: true,
        valg: [
            {
                tekst: 'Løft kongen fri og tag rustningen',
                effekt: () => {
                    const skade = erKrigertype() ? 35 : 85;
                    const logBesked = erKrigertype()
                        ? 'Da du rører kongen, rejser de døde sig i tavs formation. De genkender krig i dig og slår kun én gang, før de marcherer ud over slagmarken.'
                        : 'Da du rører kongen, rejser de døde sig omkring dig. De ser ikke en arving til slagmarken. De ser en tyv. Deres første angreb rammer hårdt.';
                    return vaekElverkongen(skade, logBesked);
                }
            },
            {
                tekst: 'Læg dit våben i kongens hånd, før du tager rustningen',
                kraeverItem: 'svaerd',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Sværdet passer i kongens hånd, som om det har ventet der. De døde vågner alligevel, men de viger for ritualet og driver krigen ud i nabofelterne.'
                )
            },
            {
                tekst: 'Læg øksen ved kongens fødder, før du tager rustningen',
                kraeverItem: 'oekse',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Øksen ligger tungt i græsset. De døde vågner og samler sig om kongen, men de lader dig træde tilbage med rustningen, før de vælter ud over slagmarken.'
                )
            },
            {
                tekst: 'Læg sabelen over kongens bryst, før du tager rustningen',
                kraeverItem: 'sabel',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Sabelen lægger sig over kongens ribben som en sidste ed. De døde rejser sig, men angrebet rammer skævt, som om nogen stadig holder orden i rækkerne.'
                )
            },
            {
                tekst: 'Byt din egen rustning for hans',
                kosterItem: 'rustning',
                effekt: () => vaekElverkongen(
                    20,
                    'Du lægger din tunge rustning over kongens bryst. Den synker ned omkring ham som jord. Elverrustningen slipper hans hænder, og de døde går uden om dig, men ikke uden om øen.'
                )
            },
            {
                tekst: 'Læg dig ned ved siden af ham og vent til de døde selv vælger',
                effekt: () => {
                    udloesDoedeSlagmark(spilTilstand.spillerIndex);
                    if (Math.random() < 0.35) {
                        rydAndenRustning();
                        return {
                            logBesked: 'Du ligger stille, mens jorden åbner sig omkring dig. En død soldat lægger rustningen over din ryg og forsvinder uden et ord.',
                            hpNed: 55,
                            itemUd: 'rustning_elver'
                        };
                    }
                    return {
                        logBesked: 'Du ligger stille for længe. De døde accepterer dig ikke som fjende og ikke som arving. Da de marcherer videre, er rustningen stadig hos kongen.',
                        hpNed: 35
                    };
                }
            },
            {
                tekst: 'Lad kongen ligge',
                effekt: () => ladFeltetStaa('Du lader kongen ligge. Slagmarken bliver stille igen, men ikke fredelig.')
            }
        ]
    }
};
