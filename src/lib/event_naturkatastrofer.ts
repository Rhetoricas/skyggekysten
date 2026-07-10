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
            ` Græshopperne æder de modne afgrøder. Ramte markfelter: ${ramteMarker}.`,
            ` The locusts devour the ripe crops. Fields affected: ${ramteMarker}.`
        )
        : tekst(
            ' Græshopperne spreder sig i området, men finder ingen modne marker.',
            ' The locusts spread through the area but find no ripe fields.'
        );
    return { logBesked: `${logBesked}${feltLog}`, logBeskedEn: `${logBeskedEn}${feltLog}` };
}

export const naturkatastrofeEvents: Record<string, SpilEvent> = {
    alkymistens_insektglas: {
        id: 'alkymistens_insektglas',
        titel: 'Alkymistens glas',
        titelEn: "The Alchemist's Jar",
        tekst: 'En alkymist sidder blandt forsøgsflasker og visne blade. En stor græshoppe hamrer mod låget på et tykt glas. Alkymisten siger, at giften næsten virker. Glasset ryster igen.',
        tekstEn: 'An alchemist sits among test flasks and withered leaves. A large locust hammers against the lid of a thick glass jar. The alchemist says the poison almost works. The jar shakes again.',
        biome: ['mark', 'eng', 'by', 'ruin'],
        billede: '/events/ev_mark.webp',
        unik: true,
        valg: [
            {
                tekst: 'Hjælp med giften',
                tekstEn: 'Help with the poison',
                effekt: () => {
                    if (Math.random() < 0.62) {
                        return {
                            logBesked: 'Du holder glasset, mens alkymisten drypper en grå væske gennem risten i låget. Græshoppen bliver stille. Han betaler dig uden at møde dit blik.',
                            logBeskedEn: 'You hold the jar while the alchemist drips a gray liquid through the grate in the lid. The locust goes still. He pays you without meeting your eyes.',
                            guldOp: 120,
                            maxHpAendring: 4
                        };
                    }
                    return {
                        ...slipInsekterLoes(
                            'Du holder for hårdt om glasset. Låget springer af, og græshoppen forsvinder mellem planterne.',
                            'You grip the jar too tightly. The lid comes loose, and the locust vanishes among the plants.'
                        ),
                        hpNed: 12
                    };
                }
            },
            {
                tekst: 'Brænd græshoppen med faklen',
                tekstEn: 'Burn the locust with the torch',
                kosterItem: 'fakkel',
                effekt: () => ({
                    logBesked: 'Flammen fylder glasset, og græshoppen bliver stille. Alkymisten siger ingenting, men rækker dig en flaske fra bordet.',
                    logBeskedEn: 'The flame fills the jar, and the locust goes still. The alchemist says nothing, but hands you a bottle from the table.',
                    hpOp: 12,
                    maxHpAendring: 3
                })
            },
            {
                tekst: 'Knus glasset med sværdet',
                tekstEn: 'Smash the jar with your sword',
                kraeverItem: 'svaerd',
                effekt: () => ({
                    logBesked: 'Glasset splintres, og sværdet rammer græshoppen. Alkymisten er rasende over skårene, men markerne er sikre.',
                    logBeskedEn: 'The jar shatters, and the sword strikes the locust. The alchemist is furious about the shards, but the fields are safe.',
                    hpNed: 6,
                    guldOp: 60
                })
            },
            {
                tekst: 'Lad alkymisten fortsætte',
                tekstEn: 'Let the alchemist continue',
                effekt: () => slipInsekterLoes(
                    'Du går, mens alkymisten mumler tal for sig selv. Bag dig springer låget af med et skarpt smæld.',
                    'You leave while the alchemist mutters numbers to himself. Behind you, the lid comes off with a sharp crack.'
                )
            },
            {
                tekst: 'Åbn glasset',
                tekstEn: 'Open the jar',
                effekt: () => ({
                    ...slipInsekterLoes(
                        'Du løfter låget. Græshoppen sidder stille et øjeblik og vender hovedet mod dig. Så forsvinder den mellem planterne.',
                        'You lift the lid. The locust sits still for a moment and turns its head toward you. Then it vanishes among the plants.'
                    ),
                    hpNed: 18
                })
            }
        ]
    },

    stjernekald: {
        id: 'stjernekald',
        titel: 'Kaldet fra himlen',
        titelEn: 'The Call from the Sky',
        tekst: 'Et sort stenalter står på den åbne jord. Inskriptionerne lover rigdom, hvis du læser ritualet højt. Nederst står en kort advarsel: Nedslaget skelner ikke mellem venner og fjender.',
        tekstEn: 'A black stone altar stands on open ground. The inscriptions promise wealth if you read the ritual aloud. A short warning is carved below: the impact does not distinguish friend from foe.',
        biome: 'ritual',
        billede: '/events/ev_ritual.webp',
        unik: false,
        valg: [
            {
                tekst: 'Udfør ritualet',
                tekstEn: 'Perform the ritual',
                effekt: () => {
                    udloesNaturkatastrofe(spilTilstand.spillerIndex);
                    return {
                        logBesked: 'Du læser ordene højt. En mørk skygge breder sig over himlen.',
                        logBeskedEn: 'You read the words aloud. A dark shadow spreads across the sky.'
                    };
                }
            },
            {
                tekst: 'Lad alteret være',
                tekstEn: 'Leave the altar alone',
                effekt: () => ladFeltetStaa('Du lader alteret være og går videre.', 'You leave the altar alone and move on.')
            }
        ]
    },

    meteor_skat: {
        id: 'meteor_skat',
        titel: 'Det glødende krater',
        titelEn: 'The Glowing Crater',
        tekst: 'I krateret ligger en glødende sten med guldårer i overfladen. Skallen er allerede begyndt at køle og hærde.',
        tekstEn: 'A glowing rock with veins of gold lies in the crater. Its outer shell is already cooling and hardening.',
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
                tekst: 'Brug hænderne',
                tekstEn: 'Use your hands',
                effekt: () => udvindMeteorSkat('haender')
            },
            {
                tekst: 'Lad stenen ligge',
                tekstEn: 'Leave the stone alone',
                effekt: () => ladFeltetStaa('Du lader stenen ligge. Varmen slår stadig op fra krateret.', 'You leave the rock alone. Heat still rises from the crater.')
            }
        ]
    },

    jordens_hjerte: {
        id: 'jordens_hjerte',
        titel: 'Sprækken i dybet',
        titelEn: 'The Crack in the Deep',
        tekst: 'En smal revne skærer gennem jorden. En dyb brummen stiger op fra mørket og stopper, når du står helt stille.',
        tekstEn: 'A narrow crack cuts through the ground. A deep hum rises from the darkness and stops when you stand completely still.',
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
                        logBesked: 'Faklen forsvinder i dybet. Et øjeblik senere ryster jorden. De nye bjergfelter bliver markeret med krydser, men kun ét skjuler den begravede kiste.',
                        logBeskedEn: 'The torch vanishes into the depths. A moment later, the ground shakes. The new mountain tiles are marked with crosses, but only one hides the buried chest.'
                    };
                }
            },
            {
                tekst: 'Træd tilbage',
                tekstEn: 'Step back',
                effekt: () => ladFeltetStaa('Du træder væk fra revnen og lader den være.', 'You step away from the crack and leave it alone.')
            }
        ]
    },

    havets_alter: {
        id: 'havets_alter',
        titel: 'Det sunkne alter',
        titelEn: 'The Sunken Altar',
        tekst: 'Et alter af drivtømmer og muslingeskaller står langt fra kysten. En mørk diamant hviler på en fod af guld, og sandet omkring alteret er vådt.',
        tekstEn: 'An altar of driftwood and shells stands far from the shore. A dark diamond rests on a golden base, and the sand around the altar is wet.',
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
                        logBesked: 'Du løfter diamanten fra alteret. Ude ved horisonten rejser havet sig.',
                        logBeskedEn: 'You lift the diamond from the altar. On the horizon, the sea begins to rise.',
                        guldOp: 10,
                        itemUd: 'diamant'
                    };
                }
            },
            {
                tekst: 'Lad offergaven ligge',
                tekstEn: 'Leave the offering',
                effekt: () => ladFeltetStaa('Du lader diamanten ligge og går væk fra det våde sand.', 'You leave the diamond and move away from the wet sand.')
            }
        ]
    },

    elverkongen_paa_slagmarken: {
        id: 'elverkongen_paa_slagmarken',
        titel: 'Kongen i græsset',
        titelEn: 'The King in the Grass',
        tekst: 'Mellem knækkede spyd ligger en død elverkonge, uberørt af tiden. Hans hænder holder stadig om en grøn rustning. Pilene i kroppen er sorte af jord, men kronen er ren.',
        tekstEn: 'Among broken spears lies a dead elven king, untouched by time. His hands still hold a suit of green armor. The arrows in his body are black with soil, but his crown is clean.',
        biome: 'slagmark',
        billede: '/events/ev_slagmark.webp',
        unik: true,
        valg: [
            {
                tekst: 'Tag rustningen',
                tekstEn: 'Take the armor',
                effekt: () => {
                    const skade = erKrigertype() ? 35 : 85;
                    const logBesked = erKrigertype()
                        ? 'Da du rører kongen, rejser de døde soldater sig i tavse rækker. De genkender en kriger og slår kun én gang, før de marcherer ud over slagmarken.'
                        : 'Da du rører kongen, rejser de døde soldater sig omkring dig. De ser ingen arving, kun en tyv, og deres første angreb rammer hårdt.';
                    const logBeskedEn = erKrigertype()
                        ? 'When you touch the king, the dead soldiers rise in silent ranks. They recognize a warrior and strike only once before marching across the battlefield.'
                        : 'When you touch the king, the dead soldiers rise around you. They see no heir, only a thief, and their first attack hits hard.';
                    return vaekElverkongen(skade, logBesked, logBeskedEn);
                }
            },
            {
                tekst: 'Læg sværdet i kongens hånd',
                tekstEn: 'Place the sword in the king’s hand',
                kraeverItem: 'svaerd',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Sværdet falder på plads i kongens hånd. De døde vågner, men respekterer din gave og lader dig tage rustningen, før de marcherer mod nabofelterne.',
                    'The sword settles into the king’s hand. The dead wake, but honor your gift and let you take the armor before marching toward the neighboring tiles.'
                )
            },
            {
                tekst: 'Læg øksen ved kongens fødder',
                tekstEn: 'Lay the axe at the king’s feet',
                kraeverItem: 'oekse',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Øksen synker ned i græsset ved kongens fødder. De døde vågner og samler sig om ham, men lader dig gå med rustningen, før de marcherer videre.',
                    'The axe sinks into the grass at the king’s feet. The dead wake and gather around him, but let you leave with the armor before marching on.'
                )
            },
            {
                tekst: 'Læg sablen over kongens bryst',
                tekstEn: 'Lay the saber across the king’s chest',
                kraeverItem: 'sabel',
                effekt: () => vaekElverkongen(
                    erKrigertype() ? 18 : 45,
                    'Sablen ligger roligt over kongens bryst. De døde rejser sig, men holder rækkerne og lader dig træde væk med rustningen, før de angriber.',
                    'The saber rests across the king’s chest. The dead rise, but hold their ranks and let you step away with the armor before they attack.'
                )
            },
            {
                tekst: 'Byt rustning med kongen',
                tekstEn: 'Trade armor with the king',
                kosterItem: 'rustning',
                effekt: () => vaekElverkongen(
                    20,
                    'Du lægger din egen rustning over kongens bryst. Hans hænder slipper elverrustningen, og de døde går forbi dig, da de marcherer ud over øen.',
                    'You lay your own armor across the king’s chest. His hands release the elven armor, and the dead pass you by as they march across the island.'
                )
            },
            {
                tekst: 'Vent ved kongens side',
                tekstEn: 'Wait beside the king',
                effekt: () => {
                    udloesDoedeSlagmark(spilTilstand.spillerIndex);
                    if (Math.random() < 0.35) {
                        rydAndenRustning();
                        return {
                            logBesked: 'Du ligger stille, mens jorden åbner sig. En død soldat lægger rustningen over din ryg og forsvinder uden et ord.',
                            logBeskedEn: 'You lie still as the ground opens. A dead soldier lays the armor across your back and vanishes without a word.',
                            hpNed: 55,
                            itemUd: 'rustning_elver'
                        };
                    }
                    return {
                        logBesked: 'Du venter, mens de døde samler sig. De ser dig hverken som fjende eller arving. Da de marcherer videre, ligger rustningen stadig hos kongen.',
                        logBeskedEn: 'You wait as the dead gather. They see you as neither enemy nor heir. When they march on, the armor remains with the king.',
                        hpNed: 35
                    };
                }
            },
            {
                tekst: 'Lad kongen hvile',
                tekstEn: 'Let the king rest',
                effekt: () => ladFeltetStaa(
                    'Du lader kongen ligge. Slagmarken bliver stille igen, men freden holder ikke længe.',
                    'You leave the king where he lies. The battlefield grows quiet again, but the peace will not last.'
                )
            }
        ]
    }
};
