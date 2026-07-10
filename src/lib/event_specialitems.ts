import { spilTilstand } from './spilTilstand.svelte';
import { afslørOmraade, hentNaboIndices, rykTaagenTilbage, udloesFaellesEventEffekt } from './spilmotor';
import type { SpilEvent } from './eventBibliotek';
import { tekst } from './i18n.svelte';

function spillerNavn() {
    return spilTilstand.spillerNavn || tekst('En spiller', 'A player');
}

function afslørRadiusOgLog(logBesked: string, logBeskedEn: string, radius: number) {
    afslørOmraade(spilTilstand.spillerIndex, radius);
    return { logBesked, logBeskedEn };
}

export const specialItemEvents: Record<string, SpilEvent> = {
    spejlet_i_taagekanten: {
        id: 'spejlet_i_taagekanten',
        titel: 'Spejlet i tågekanten',
        titelEn: 'The Mirror at the Edge of the Fog',
        tekst: 'Et lavt spejl står i græsset med bagsiden mod øst. I glasset ser du ikke dit ansigt, men tågens kant oppefra. Da du rører rammen, trækker disen sig tættere sammen.',
        tekstEn: 'A low mirror stands in the grass with its back to the east. The glass does not show your face, but the edge of the fog from above. When you touch the frame, the haze draws tighter.',
        biome: ['ritual', 'ruin', 'krystal', 'hoejland'],
        billede: '/events/ev_krystal.webp',
        minKolonnePct: 0.20,
        unik: false,
        valg: [
            {
                tekst: 'Ret den gyldne kikkert mod spejlet',
                tekstEn: 'Aim the golden spyglass at the mirror',
                kraeverItem: 'kikkert_45',
                effekt: () => {
                    rykTaagenTilbage(3);
                    return {
                        logBesked: 'I kikkerten vender tågens mønster tilbage mod sig selv. Disen trækker sig tre felter væk fra øen og giver jer mere tid.',
                        logBeskedEn: 'Through the spyglass, the fog’s pattern turns back on itself. The haze retreats three tiles from the island, buying everyone more time.'
                    };
                }
            },
            {
                tekst: 'Pres tågen væk med staven',
                tekstEn: 'Push the fog back with the staff',
                kraeverItem: 'stav',
                effekt: () => {
                    rykTaagenTilbage(3);
                    return {
                        logBesked: 'Staven tegner en skarp linje gennem glasset, og tågen viger tre felter. Spejlet smækker i igen og dræner dine kræfter.',
                        logBeskedEn: 'The staff draws a sharp line through the glass, and the fog recedes three tiles. The mirror snaps shut again, draining your strength.',
                        energiNed: 2
                    };
                }
            },
            {
                tekst: 'Læs tågen i faklens skær',
                tekstEn: 'Read the fog by torchlight',
                kraeverItem: 'fakkel',
                effekt: () => {
                    const synsRadius = Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn) + 2;
                    afslørOmraade(spilTilstand.spillerIndex, synsRadius);
                    return {
                        logBesked: 'Faklens skær åbner spejlet et øjeblik. Du ser pludselig landskabet omkring dig langt tydeligere.',
                        logBeskedEn: 'The torchlight opens the mirror for a moment. The surrounding landscape suddenly comes into focus.'
                    };
                }
            },
            {
                tekst: 'Lad spejlet stå',
                tekstEn: 'Leave the mirror alone',
                udfaldListe: [
                    { log: 'Du går videre uden at lade spejlet lære dit ansigt.', logEn: 'You move on without letting the mirror learn your face.' }
                ]
            }
        ]
    },

    klokken_i_mosen: {
        id: 'klokken_i_mosen',
        titel: 'Klokken i mosen',
        titelEn: 'The Bell in the Bog',
        tekst: 'En bronzeklokke ligger halvt begravet i den mørke mose. Den er for tung at flytte. På indersiden står der: "Når én ringer, hører alle det."',
        tekstEn: 'A bronze bell lies half buried in the dark bog. It is too heavy to move. An inscription inside reads: "When one rings, all hear it."',
        biome: ['eng', 'mark', 'ruin', 'blodskov'],
        billede: '/events/ev_kilde.webp',
        unik: false,
        valg: [
            {
                tekst: 'Slå på klokken med sabelen',
                tekstEn: 'Strike the bell with the saber',
                kraeverItem: 'sabel',
                effekt: () => {
                    const besked = tekst(
                        `${spillerNavn()} ringede med klokken i mosen. Da tonen dør ud, har alle på øen 100 guld mere i lommen.`,
                        `${spillerNavn()} rang the bell in the bog. When the note fades, everyone on the island has 100 more gold in their pocket.`
                    );
                    udloesFaellesEventEffekt({ besked, guldAendring: 100 });
                    return { logBesked: besked, logBeskedEn: besked };
                }
            },
            {
                tekst: 'Slå på klokken med øksen',
                tekstEn: 'Strike the bell with the axe',
                kraeverItem: 'oekse',
                effekt: () => {
                    const besked = tekst(
                        `${spillerNavn()} slog for hårdt på klokken i mosen. Tonen skærer gennem alle på øen.`,
                        `${spillerNavn()} struck the bell in the bog too hard. The note cuts through everyone on the island.`
                    );
                    udloesFaellesEventEffekt({ besked, skade: 9 });
                    return { logBesked: besked, logBeskedEn: besked };
                }
            },
            {
                tekst: 'Lirk mudderet væk med skovlen',
                tekstEn: 'Pry the mud away with the shovel',
                kraeverItem: 'skovl',
                effekt: () => ({
                    logBesked: 'Du graver klokken fri nok til at løfte kanten. Under den ligger en gammel offerpose.',
                    logBeskedEn: 'You dig out enough of the bell to lift its rim. Beneath it lies an old offering pouch.',
                    guldOp: 85
                })
            },
            {
                tekst: 'Gå stille forbi',
                tekstEn: 'Pass by quietly',
                udfaldListe: [
                    { log: 'Du går stille videre, og mosen lukker sig lydløst om dine fodspor.', logEn: 'You move on quietly, and the bog closes over your footprints without a sound.' }
                ]
            }
        ]
    },

    dyrene_under_stjernerne: {
        id: 'dyrene_under_stjernerne',
        titel: 'Dyrene under stjernerne',
        titelEn: 'The Animals Under the Stars',
        tekst: 'En flok små, hvide dyr står i ring om en plet nedtrampet græs. De ligner hjorte, lige indtil alle hoveder vender sig mod dig på samme tid. De venter ikke på mad, men på et signal.',
        tekstEn: 'A group of small white animals stands in a ring around a patch of trampled grass. They resemble deer until every head turns toward you at once. They are not waiting for food, but for a signal.',
        biome: ['skov', 'eng', 'hoejland', 'blodskov'],
        billede: '/events/ev_skov.webp',
        unik: false,
        valg: [
            {
                tekst: 'Sænk buen og hold afstand',
                tekstEn: 'Lower the bow and keep your distance',
                kraeverItem: 'bue',
                effekt: () => {
                    afslørOmraade(spilTilstand.spillerIndex, 2);
                    return {
                        logBesked: 'Dyrene spreder sig roligt og åbner en vej gennem terrænet. Du får et klart blik over området.',
                        logBeskedEn: 'The animals calmly spread out and open a path through the terrain. You gain a clear view of the area.',
                        maxHpAendring: 5
                    };
                }
            },
            {
                tekst: 'Følg søgekvistens træk',
                tekstEn: 'Follow the seeker twig’s pull',
                kraeverItem: 'soegekvist',
                effekt: () => ({
                    logBesked: 'Kvisten trækker mod et sted, hvor dyrene har skrabet jorden bar. Under græsset finder du friske, spiselige rødder.',
                    logBeskedEn: 'The twig pulls toward a patch where the animals have scraped the earth bare. Beneath the grass, you find fresh edible roots.',
                    hpOp: 22,
                    energiOp: 2
                })
            },
            {
                tekst: 'Læg mad ned og vent',
                tekstEn: 'Place food down and wait',
                kraeverItem: 'mad',
                effekt: () => ({
                    logBesked: 'Dyrene lader maden ligge og sætter sig omkring dig. Lidt efter lidt falder din puls til ro.',
                    logBeskedEn: 'The animals leave the food untouched and sit around you. Little by little, your pulse settles.',
                    hpOp: 16,
                    maxHpAendring: 3
                })
            },
            {
                tekst: 'Gå gennem ringen',
                tekstEn: 'Walk through the ring',
                effekt: () => afslørRadiusOgLog(
                    'Dyrene træder til side. Da du går gennem ringen, falder terrænet på plads for dit blik, og et større område bliver synligt.',
                    'The animals step aside. As you pass through the ring, the terrain falls into place, revealing a wider area around you.',
                    3
                )
            }
        ]
    },

    de_to_ved_broen: {
        id: 'de_to_ved_broen',
        titel: 'De to ved broen',
        titelEn: 'The Two at the Bridge',
        tekst: 'To mennesker står på hver sin side af en smal bro. De siger ikke et ord, men begge har den samme tørrede blomst om håndleddet. Hver gang en af dem træder frem, knager broen.',
        tekstEn: 'Two people stand on opposite sides of a narrow bridge. They do not say a word, but each wears the same dried flower around one wrist. Whenever either steps forward, the bridge creaks.',
        biome: ['by', 'ruin', 'eng', 'marked'],
        billede: '/events/ev_ruin.webp',
        unik: false,
        valg: [
            {
                tekst: 'Mægl mellem dem i dit fine tøj',
                tekstEn: 'Mediate between them in your fine clothes',
                kraeverItem: 'flot_toej',
                effekt: () => ({
                    logBesked: 'De lytter, fordi du ligner en, folk plejer at høre på. Det er ikke helt retfærdigt, men det får dem over broen.',
                    logBeskedEn: 'They listen because you look like someone people usually heed. It is not entirely fair, but it gets them across the bridge.',
                    maxHpAendring: 8,
                    guldOp: 60
                })
            },
            {
                tekst: 'Gå først i elverrustningen',
                tekstEn: 'Cross first in the elven armor',
                kraeverItem: 'rustning_elver',
                effekt: () => ({
                    logBesked: 'Du går først, og broen holder. De følger efter én ad gangen. Ingen siger noget, men begge kommer sikkert over.',
                    logBeskedEn: 'You cross first, and the bridge holds. They follow one at a time. Neither says a word, but both make it safely across.',
                    maxHpAendring: 12
                })
            },
            {
                tekst: 'Lys broen op',
                tekstEn: 'Light the bridge',
                kraeverItem: 'fakkel',
                effekt: () => {
                    rykTaagenTilbage(1);
                    return {
                        logBesked: 'Faklen viser dem hvert et sikkert skridt. De mødes midt på broen, og tågen trækker sig ét felt tilbage.',
                        logBeskedEn: 'The torch shows them each safe step. They meet halfway across, and the fog retreats by one tile.'
                    };
                }
            },
            {
                tekst: 'Sig, at broen snart brister',
                tekstEn: 'Tell them the bridge will soon break',
                effekt: () => ({
                    logBesked: 'De går samtidig. To brædder falder, men broen holder længe nok. På den anden side efterlader de en lille pose til dig.',
                    logBeskedEn: 'They cross at the same time. Two planks fall, but the bridge holds long enough. On the far side, they leave you a small pouch.',
                    guldOp: 45
                })
            }
        ]
    }
};
