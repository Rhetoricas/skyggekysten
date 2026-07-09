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
        titelEn: 'The Mirror at the Fog Edge',
        tekst: 'Et lavt spejl står i græsset med bagsiden mod øst. Glasset viser ikke dit ansigt, men tågens kant set oppefra. Når du rører rammen, trækker disen sig sammen som en hånd.',
        tekstEn: 'A low mirror stands in the grass with its back facing east. The glass does not show your face, but the fog edge seen from above. When you touch the frame, the haze tightens like a hand.',
        biome: ['ritual', 'ruin', 'krystal', 'hoejland'],
        billede: '/events/ev_krystal.webp',
        minKolonnePct: 0.20,
        unik: false,
        valg: [
            {
                tekst: 'Ret den gyldne kikkert mod spejlet og vend tågen mod sig selv',
                tekstEn: 'Aim the golden spyglass at the mirror and turn the fog against itself',
                kraeverItem: 'kikkert_45',
                effekt: () => {
                    rykTaagenTilbage(3);
                    return {
                        logBesked: 'Kikkerten viser tågen dens egen bagside. Disen folder sig tre felter væk fra øen og giver jer mere tid.',
                        logBeskedEn: 'The spyglass shows the fog its own backside. The haze folds three tiles away from the island and gives you all more time.'
                    };
                }
            },
            {
                tekst: 'Tving spejlet åbent med staven og pres tågen væk',
                tekstEn: 'Force the mirror open with the staff and push the fog away',
                kraeverItem: 'stav',
                effekt: () => {
                    rykTaagenTilbage(3);
                    return {
                        logBesked: 'Staven slår en ren linje gennem glasset. Tågen viger tre felter, men spejlet klapper hårdt i og tager kræfter med sig.',
                        logBeskedEn: 'The staff strikes a clean line through the glass. The fog recedes three tiles, but the mirror snaps shut hard and takes strength with it.',
                        energiNed: 2
                    };
                }
            },
            {
                tekst: 'Hold faklen foran glasset og læs tågens folder',
                tekstEn: 'Hold the torch before the glass and read the folds of the fog',
                kraeverItem: 'fakkel',
                effekt: () => {
                    const synsRadius = Math.max(1, (spilTilstand.valgtKarakter?.synsRadius || 1) + spilTilstand.rygsækEffekt.syn) + 2;
                    afslørOmraade(spilTilstand.spillerIndex, synsRadius);
                    return {
                        logBesked: 'Lyset får spejlet til at åbne sig et øjeblik. Landskabet omkring dig står skarpere.',
                        logBeskedEn: 'The light makes the mirror open for a moment. The landscape around you sharpens.'
                    };
                }
            },
            {
                tekst: 'Lad spejlet stå og gå videre uden at røre tågen',
                tekstEn: 'Leave the mirror standing and move on without touching the fog',
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
        tekst: 'En bronzeklokke ligger halvt sunket i en mørk mose. Den er for tung til at tage med. På indersiden står der: "Når én ringer, hører alle det."',
        tekstEn: 'A bronze bell lies half sunk in a dark bog. It is too heavy to carry. Inside it says: "When one rings, all hear it."',
        biome: ['eng', 'mark', 'ruin', 'blodskov'],
        billede: '/events/ev_kilde.webp',
        unik: false,
        valg: [
            {
                tekst: 'Slå klokken rent med sabelen',
                tekstEn: 'Strike the bell cleanly with the saber',
                kraeverItem: 'sabel',
                effekt: () => {
                    const besked = tekst(
                        `${spillerNavn()} ringede med klokken i mosen. Alle på øen finder 100 guld i deres lommer.`,
                        `${spillerNavn()} rang the bell in the bog. Everyone on the island finds 100 gold in their pockets.`
                    );
                    udloesFaellesEventEffekt({ besked, guldAendring: 100 });
                    return { logBesked: besked, logBeskedEn: besked };
                }
            },
            {
                tekst: 'Slå klokken hårdt med øksen',
                tekstEn: 'Strike the bell hard with the axe',
                kraeverItem: 'oekse',
                effekt: () => {
                    const besked = tekst(
                        `${spillerNavn()} slog klokken i mosen for hårdt. Lyden går gennem knoglerne på alle.`,
                        `${spillerNavn()} struck the bell in the bog too hard. The sound goes through everyone’s bones.`
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
                    logBesked: 'Du får klokken fri nok til at læse bunden. Under den ligger en gammel offerpose.',
                    logBeskedEn: 'You free the bell enough to read the bottom. Beneath it lies an old offering pouch.',
                    guldOp: 85
                })
            },
            {
                tekst: 'Gå stille forbi',
                tekstEn: 'Pass by quietly',
                udfaldListe: [
                    { log: 'Mosen sluger dit fodspor uden lyd.', logEn: 'The bog swallows your footprint without a sound.' }
                ]
            }
        ]
    },

    dyrene_under_stjernerne: {
        id: 'dyrene_under_stjernerne',
        titel: 'Dyrene under stjernerne',
        titelEn: 'The Animals Under the Stars',
        tekst: 'En flok små, hvide dyr står i en ring omkring et felt med nedtrampet græs. De ligner hjorte, indtil de vender hovederne samtidig. De venter på et signal, ikke på mad.',
        tekstEn: 'A flock of small white animals stands in a ring around a patch of trampled grass. They look like deer until they turn their heads at the same time. They are waiting for a signal, not for food.',
        biome: ['skov', 'eng', 'hoejland', 'blodskov'],
        billede: '/events/ev_skov.webp',
        unik: false,
        valg: [
            {
                tekst: 'Sænk buen og vis, at du kan holde afstand',
                tekstEn: 'Lower the bow and show that you can keep your distance',
                kraeverItem: 'bue',
                effekt: () => {
                    afslørOmraade(spilTilstand.spillerIndex, 2);
                    return {
                        logBesked: 'Dyrene spreder sig uden panik og efterlader en åbning i terrænet. Området omkring dig bliver tydeligere.',
                        logBeskedEn: 'The animals spread out without panic and leave an opening in the terrain. The area around you becomes clearer.',
                        maxHpAendring: 5
                    };
                }
            },
            {
                tekst: 'Følg søgekvistens ryk i jorden',
                tekstEn: 'Follow the seeker twig’s tug in the ground',
                kraeverItem: 'soegekvist',
                effekt: () => ({
                    logBesked: 'Kvisten trækker dig mod et sted, hvor dyrene har skrabet jorden op. Rødderne under græsset er friske.',
                    logBeskedEn: 'The twig pulls you toward a place where the animals have scraped up the earth. The roots under the grass are fresh.',
                    hpOp: 22,
                    energiOp: 2
                })
            },
            {
                tekst: 'Læg mad ned og vent',
                tekstEn: 'Place food down and wait',
                kraeverItem: 'mad',
                effekt: () => ({
                    logBesked: 'Dyrene rører ikke maden. De sætter sig i stedet omkring dig, indtil din puls falder til ro.',
                    logBeskedEn: 'The animals do not touch the food. Instead, they sit around you until your pulse settles.',
                    hpOp: 16,
                    maxHpAendring: 3
                })
            },
            {
                tekst: 'Gå gennem ringen',
                tekstEn: 'Walk through the ring',
                effekt: () => afslørRadiusOgLog(
                    'Dyrene træder til side. Da du er igennem, forstår du landskabet bedre. Et større område omkring dig bliver synligt.',
                    'The animals step aside. Once you are through, you understand the landscape better. A larger area around you becomes visible.',
                    3
                )
            }
        ]
    },

    de_to_ved_broen: {
        id: 'de_to_ved_broen',
        titel: 'De to ved broen',
        titelEn: 'The Two at the Bridge',
        tekst: 'To mennesker står på hver sin side af en smal bro. De taler ikke til hinanden, men de har begge samme tørre blomst bundet om håndleddet. Broen knager, hver gang en af dem prøver at gå først.',
        tekstEn: 'Two people stand on opposite sides of a narrow bridge. They do not speak to each other, but both have the same dry flower tied around their wrist. The bridge creaks whenever one of them tries to go first.',
        biome: ['by', 'ruin', 'eng', 'marked'],
        billede: '/events/ev_ruin.webp',
        unik: false,
        valg: [
            {
                tekst: 'Gå imellem dem i dit fine tøj',
                tekstEn: 'Step between them in your fine clothes',
                kraeverItem: 'flot_toej',
                effekt: () => ({
                    logBesked: 'De lytter, fordi du ligner en, der er vant til at blive hørt. Det er måske ikke retfærdigt, men i dag hjælper det.',
                    logBeskedEn: 'They listen because you look like someone used to being heard. It may not be fair, but today it helps.',
                    maxHpAendring: 8,
                    guldOp: 60
                })
            },
            {
                tekst: 'Lad elverrustningen bære det første skridt',
                tekstEn: 'Let the elven armor carry the first step',
                kraeverItem: 'rustning_elver',
                effekt: () => ({
                    logBesked: 'Broen bøjer ikke under elverrustningen. De følger efter, én ad gangen. Ingen kalder det kærlighed, men ingen falder.',
                    logBeskedEn: 'The bridge does not bend under the elven armor. They follow, one at a time. No one calls it love, but no one falls.',
                    maxHpAendring: 12
                })
            },
            {
                tekst: 'Lys broen op med faklen',
                tekstEn: 'Light the bridge with the torch',
                kraeverItem: 'fakkel',
                effekt: () => {
                    rykTaagenTilbage(1);
                    return {
                        logBesked: 'Faklen viser, at broen er kortere end frygten. Tågen slipper et enkelt felt, mens de finder hinanden.',
                        logBeskedEn: 'The torch shows that the bridge is shorter than the fear. The fog releases a single tile while they find each other.'
                    };
                }
            },
            {
                tekst: 'Fortæl dem sandheden: broen holder ikke længe',
                tekstEn: 'Tell them the truth: the bridge will not hold long',
                effekt: () => ({
                    logBesked: 'De går samtidig. Broen mister to brædder, men holder. De efterlader dig en lille pose, som om sandhed også kan betales.',
                    logBeskedEn: 'They walk at the same time. The bridge loses two planks, but holds. They leave you a small pouch, as if truth can also be paid for.',
                    guldOp: 45
                })
            }
        ]
    }
};
