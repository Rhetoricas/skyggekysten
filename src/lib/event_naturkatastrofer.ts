import { spilTilstand } from '$lib/spilTilstand.svelte';
import { broadcastFelt, syncKortTilDbSenere, syncTilDb } from './netvaerk';
import { udloesDoedeSlagmark, udloesInsektPlage, udloesJordskaelv, udloesNaturkatastrofe, udloesOversvoemmelse, udvindMeteorSkat } from './spilmotor';
import type { SpilEvent } from './eventBibliotek';
import { tekst } from './i18n.svelte';

function ladFeltetStaa(logBesked: string, logBeskedEn: string) {
    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
    if (felt) {
        felt.eventFuldført = false;
        broadcastFelt(spilTilstand.spillerIndex, felt);
    }
    syncTilDb();
    syncKortTilDbSenere();
    return { logBesked, logBeskedEn };
}

function erKrigertype() {
    return ['knight_m', 'knight_f', 'viking_m', 'viking_f', 'orc_m', 'orc_f'].includes(spilTilstand.valgtKarakter?.id ?? '');
}

function rydAndenRustning() {
    spilTilstand.mitUdstyr = spilTilstand.mitUdstyr.filter((ting) => ting.id !== 'rustning' && ting.id !== 'kongepanser' && ting.id !== 'rustning_elver');
}

function vaekElverkongen(skade: number, logBesked: string, logBeskedEn: string) {
    udloesDoedeSlagmark(spilTilstand.spillerIndex);
    rydAndenRustning();
    return {
        logBesked,
        logBeskedEn,
        hpNed: skade,
        itemUd: 'rustning_elver'
    };
}

function slipInsekterLoes(logBesked: string, logBeskedEn: string) {
    const ramteMarker = udloesInsektPlage(spilTilstand.spillerIndex);
    const feltLog = ramteMarker > 0
        ? tekst(
            ` Græshopperne æder ${ramteMarker} modne markfelter i denne blok.`,
            ` The locusts eat ${ramteMarker} ripe field tiles in this block.`
        )
        : tekst(
            ' Græshopperne søger efter modne marker i denne blok.',
            ' The locusts search for ripe fields in this block.'
        );
    return { logBesked: `${logBesked}${feltLog}`, logBeskedEn: `${logBeskedEn}${feltLog}` };
}

export const naturkatastrofeEvents: Record<string, SpilEvent> = {
    alkymistens_insektglas: {
        id: 'alkymistens_insektglas',
        titel: 'Alkymistens glas',
        titelEn: "The Alchemist's Jar",
        tekst: 'En alkymist sidder midt mellem forsøgsflasker og visne blade. I et tykt glas banker en græshoppe mod låget. Han siger, at giften næsten virker. Glasset siger noget andet.',
        tekstEn: 'An alchemist sits among trial flasks and withered leaves. In a thick glass jar, a locust knocks against the lid. He says the poison almost works. The jar says otherwise.',
        biome: ['mark', 'eng', 'by', 'ruin'],
        billede: '/events/ev_mark.webp',
        unik: true,
        valg: [
            {
                tekst: 'Hjælp ham med at dosere giften',
                tekstEn: 'Help him dose the poison',
                effekt: () => {
                    if (Math.random() < 0.62) {
                        return {
                            logBesked: 'Du holder glasset stille, mens alkymisten drypper en grå væske gennem lågets rist. Græshoppen går i stå. Alkymisten betaler uden at se dig i øjnene.',
                            logBeskedEn: 'You hold the jar still while the alchemist drips a gray liquid through the lid grate. The locust stops. The alchemist pays without looking you in the eye.',
                            guldOp: 120,
                            maxHpAendring: 4
                        };
                    }
                    return {
                        ...slipInsekterLoes(
                            'Du holder glasset for hårdt. Låget vrider sig fri, og noget vådt og hurtigt forsvinder ned mellem planterne.',
                            'You hold the jar too tightly. The lid twists free, and something wet and fast disappears down among the plants.'
                        ),
                        hpNed: 12
                    };
                }
            },
            {
                tekst: 'Brænd græshoppen i glasset med en fakkel',
                tekstEn: 'Burn the locust in the jar with a torch',
                kosterItem: 'fakkel',
                effekt: () => ({
                    logBesked: 'Flammen gør kort proces med græshoppen. Alkymisten bliver tavs, men han giver dig en flaske fra bordet.',
                    logBeskedEn: 'The flame makes short work of the locust. The alchemist falls silent, but gives you a bottle from the table.',
                    hpOp: 12,
                    maxHpAendring: 3
                })
            },
            {
                tekst: 'Knus glasset med dit våben og dræb græshoppen',
                tekstEn: 'Smash the jar with your weapon and kill the locust',
                kraeverItem: 'svaerd',
                effekt: () => ({
                    logBesked: 'Glasset springer, men sværdet rammer præcist. Græshoppen bliver liggende i de våde skår. Alkymisten er rasende, men markerne er stille.',
                    logBeskedEn: 'The glass bursts, but the sword strikes true. The locust lies still in the wet shards. The alchemist is furious, but the fields are quiet.',
                    hpNed: 6,
                    guldOp: 60
                })
            },
            {
                tekst: 'Lad alkymisten fortsætte forsøget alene',
                tekstEn: 'Let the alchemist continue the experiment alone',
                effekt: () => slipInsekterLoes(
                    'Du går, mens alkymisten hvisker tal til sig selv. Bag dig lyder et skarpt smæld fra glasset.',
                    'You leave while the alchemist whispers numbers to himself. Behind you, a sharp crack sounds from the jar.'
                )
            },
            {
                tekst: 'Åbn glasset og se, hvad græshoppen gør',
                tekstEn: 'Open the jar and see what the locust does',
                effekt: () => ({
                    ...slipInsekterLoes(
                        'Du løfter låget. Græshoppen sidder stille et halvt sekund, som om den lærer dit ansigt at kende. Så er den væk.',
                        'You lift the lid. The locust sits still for half a second, as if learning your face. Then it is gone.'
                    ),
                    hpNed: 18
                })
            }
        ]
    },

    stjernekald: {
        id: 'stjernekald',
        titel: 'Stjernekaldet',
        titelEn: 'The Star Calling',
        tekst: 'Et sort stenalter står på åben jord. Inskriptionerne lover rigdom, hvis du kalder noget ned fra himlen. Advarslen er kort: nedslaget rammer ikke kun fjender.',
        tekstEn: 'A black stone altar stands on open ground. The inscriptions promise wealth if you call something down from the sky. The warning is short: the impact does not only hit enemies.',
        biome: 'ritual',
        billede: '/events/ev_ritual.webp',
        unik: false,
        valg: [
            {
                tekst: 'Læs ritualet højt',
                tekstEn: 'Read the ritual aloud',
                effekt: () => {
                    udloesNaturkatastrofe(spilTilstand.spillerIndex);
                    return {
                        logBesked: 'Du læser ordene højt. Himlen bliver mørkere over øen.',
                        logBeskedEn: 'You read the words aloud. The sky darkens over the island.'
                    };
                }
            },
            {
                tekst: 'Lad alteret være',
                tekstEn: 'Leave the altar alone',
                effekt: () => ladFeltetStaa('Du lader alteret stå.', 'You leave the altar standing.')
            }
        ]
    },

    meteor_skat: {
        id: 'meteor_skat',
        titel: 'Det Glødende Krater',
        titelEn: 'The Glowing Crater',
        tekst: 'I krateret ligger en varm stenklump med guldårer i overfladen. Den kan måske åbnes, før den køler helt ned.',
        tekstEn: 'In the crater lies a warm stone lump with gold veins on its surface. It may be possible to open before it cools completely.',
        biome: 'meteor',
        billede: '/events/meteor.webp',
        unik: false,
        valg: [
            {
                tekst: 'Grav med skovlen',
                tekstEn: 'Dig with the shovel',
                kosterItem: 'skovl',
                effekt: (betaltItem?: string | null) => udvindMeteorSkat(betaltItem === 'mesterskovl' ? 'mesterskovl' : 'skovl')
            },
            {
                tekst: 'Flæk stenen med øksen',
                tekstEn: 'Split the stone with the axe',
                kosterItem: 'oekse',
                effekt: () => udvindMeteorSkat('oekse')
            },
            {
                tekst: 'Knus skallen med køllen',
                tekstEn: 'Crush the shell with the club',
                kosterItem: 'koelle',
                effekt: () => udvindMeteorSkat('koelle')
            },
            {
                tekst: 'Brug sværdet som brækjern',
                tekstEn: 'Use the sword as a crowbar',
                kosterItem: 'svaerd',
                effekt: () => udvindMeteorSkat('svaerd')
            },
            {
                tekst: 'Hæld livseliksir over stenen',
                tekstEn: 'Pour life elixir over the stone',
                kosterItem: 'livseliksir',
                effekt: () => udvindMeteorSkat('livseliksir')
            },
            {
                tekst: 'Forsøg med hænderne',
                tekstEn: 'Try with your hands',
                effekt: () => udvindMeteorSkat('haender')
            },
            {
                tekst: 'Lad stenen ligge',
                tekstEn: 'Leave the stone alone',
                effekt: () => ladFeltetStaa('Du lader stenen ligge. Den er stadig for varm.', 'You leave the stone alone. It is still too hot.')
            }
        ]
    },

    jordens_hjerte: {
        id: 'jordens_hjerte',
        titel: 'Sprækken i Dybet',
        titelEn: 'The Crack in the Deep',
        tekst: 'En smal revne skærer gennem jorden. Der kommer en lav brummen nedefra. Den stopper, når du står helt stille.',
        tekstEn: 'A narrow crack cuts through the earth. A low hum rises from below. It stops when you stand completely still.',
        biome: ['bjerg', 'hule', 'hoejland'],
        billede: '/events/ev_bjerg.webp',
        unik: false,
        valg: [
            {
                tekst: 'Kast en fakkel ned i revnen',
                tekstEn: 'Throw a torch into the crack',
                kosterItem: 'fakkel',
                effekt: () => {
                    udloesJordskaelv(spilTilstand.spillerIndex, true);
                    return {
                        logBesked: 'Faklen forsvinder. Jorden rykker sig kort efter, og en begravet kiste bliver klemt ind i et af de nye bjergfelter.',
                        logBeskedEn: 'The torch disappears. The earth shifts shortly after, and a buried chest is squeezed into one of the new mountain tiles.'
                    };
                }
            },
            {
                tekst: 'Træd tilbage',
                tekstEn: 'Step back',
                effekt: () => ladFeltetStaa('Du træder væk fra revnen.', 'You step away from the crack.')
            }
        ]
    },

    havets_alter: {
        id: 'havets_alter',
        titel: 'Det Sunkne Alter',
        titelEn: 'The Sunken Altar',
        tekst: 'Et alter af drivtømmer og muslingeskaller står langt fra vandet. En mørk diamant ligger på en guldfod. Sandet omkring alteret er vådt.',
        tekstEn: 'An altar of driftwood and shells stands far from the water. A dark diamond rests on a golden foot. The sand around the altar is wet.',
        biome: ['eng', 'mark', 'by', 'ruin'],
        billede: '/events/ev_hav.webp',
        unik: false,
        valg: [
            {
                tekst: 'Tag diamanten fra alteret',
                tekstEn: 'Take the diamond from the altar',
                effekt: () => {
                    udloesOversvoemmelse(spilTilstand.spillerIndex);
                    return {
                        logBesked: 'Du tager diamanten. Ude mod horisonten rejser vandet sig.',
                        logBeskedEn: 'You take the diamond. Out by the horizon, the water rises.',
                        guldOp: 10,
                        itemUd: 'diamant'
                    };
                }
            },
            {
                tekst: 'Lad offergaven ligge',
                tekstEn: 'Leave the offering',
                effekt: () => ladFeltetStaa('Du lader diamanten ligge.', 'You leave the diamond where it is.')
            }
        ]
    },

    elverkongen_paa_slagmarken: {
        id: 'elverkongen_paa_slagmarken',
        titel: 'Kongen i græsset',
        titelEn: 'The King in the Grass',
        tekst: 'Mellem knækkede spyd ligger et lig, der ikke er rådnet. En gammel elverkonge hviler med hænderne om en grønlig rustning. Pilene i ham er sorte af jord, men kronen er ren.',
        tekstEn: 'Among broken spears lies a body that has not rotted. An old elven king rests with his hands around greenish armor. The arrows in him are black with soil, but the crown is clean.',
        biome: 'slagmark',
        billede: '/events/ev_slagmark.webp',
        unik: true,
        valg: [
            {
                tekst: 'Løft kongen fri og tag rustningen',
                tekstEn: 'Lift the king free and take the armor',
                effekt: () => {
                    const skade = erKrigertype() ? 35 : 85;
                    const logBesked = erKrigertype()
                        ? 'Da du rører kongen, rejser de døde sig i tavs formation. De genkender krig i dig og slår kun én gang, før de marcherer ud over slagmarken.'
                        : 'Da du rører kongen, rejser de døde sig omkring dig. De ser ikke en arving til slagmarken. De ser en tyv. Deres første angreb rammer hårdt.';
                    const logBeskedEn = erKrigertype()
                        ? 'When you touch the king, the dead rise in silent formation. They recognize war in you and strike only once before marching out across the battlefield.'
                        : 'When you touch the king, the dead rise around you. They do not see an heir to the battlefield. They see a thief. Their first attack hits hard.';
                    return vaekElverkongen(skade, logBesked, logBeskedEn);
                }
            },
            {
                tekst: 'Læg dit våben i kongens hånd, før du tager rustningen',
                tekstEn: 'Place your weapon in the king’s hand before taking the armor',
                kraeverItem: 'svaerd',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Sværdet passer i kongens hånd, som om det har ventet der. De døde vågner alligevel, men de viger for ritualet og driver krigen ud i nabofelterne.',
                    'The sword fits in the king’s hand as if it waited there. The dead wake anyway, but they yield to the ritual and drive the war into nearby tiles.'
                )
            },
            {
                tekst: 'Læg øksen ved kongens fødder, før du tager rustningen',
                tekstEn: 'Lay the axe at the king’s feet before taking the armor',
                kraeverItem: 'oekse',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Øksen ligger tungt i græsset. De døde vågner og samler sig om kongen, men de lader dig træde tilbage med rustningen, før de vælter ud over slagmarken.',
                    'The axe lies heavy in the grass. The dead wake and gather around the king, but they let you step back with the armor before they spill across the battlefield.'
                )
            },
            {
                tekst: 'Læg sabelen over kongens bryst, før du tager rustningen',
                tekstEn: 'Lay the saber across the king’s chest before taking the armor',
                kraeverItem: 'sabel',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Sabelen lægger sig over kongens ribben som en sidste ed. De døde rejser sig, men angrebet rammer skævt, som om nogen stadig holder orden i rækkerne.',
                    'The saber settles over the king’s ribs like a final oath. The dead rise, but the attack lands crookedly, as if someone still keeps order in the ranks.'
                )
            },
            {
                tekst: 'Byt din egen rustning for hans',
                tekstEn: 'Trade your own armor for his',
                kosterItem: 'rustning',
                effekt: () => vaekElverkongen(
                    20,
                    'Du lægger din tunge rustning over kongens bryst. Den synker ned omkring ham som jord. Elverrustningen slipper hans hænder, og de døde går uden om dig, men ikke uden om øen.',
                    'You lay your heavy armor over the king’s chest. It sinks around him like soil. The elven armor slips from his hands, and the dead walk around you, but not around the island.'
                )
            },
            {
                tekst: 'Læg dig ned ved siden af ham og vent til de døde selv vælger',
                tekstEn: 'Lie down beside him and wait for the dead to choose',
                effekt: () => {
                    udloesDoedeSlagmark(spilTilstand.spillerIndex);
                    if (Math.random() < 0.35) {
                        rydAndenRustning();
                        return {
                            logBesked: 'Du ligger stille, mens jorden åbner sig omkring dig. En død soldat lægger rustningen over din ryg og forsvinder uden et ord.',
                            logBeskedEn: 'You lie still while the earth opens around you. A dead soldier lays the armor over your back and vanishes without a word.',
                            hpNed: 55,
                            itemUd: 'rustning_elver'
                        };
                    }
                    return {
                        logBesked: 'Du ligger stille for længe. De døde accepterer dig ikke som fjende og ikke som arving. Da de marcherer videre, er rustningen stadig hos kongen.',
                        logBeskedEn: 'You lie still too long. The dead accept you neither as enemy nor heir. When they march on, the armor is still with the king.',
                        hpNed: 35
                    };
                }
            },
            {
                tekst: 'Lad kongen ligge',
                tekstEn: 'Leave the king lying',
                effekt: () => ladFeltetStaa(
                    'Du lader kongen ligge. Slagmarken bliver stille igen, men ikke fredelig.',
                    'You leave the king lying. The battlefield grows quiet again, but not peaceful.'
                )
            }
        ]
    }
};
