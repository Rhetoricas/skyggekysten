import { spilTilstand } from './spilTilstand.svelte';
import { afslørOmraade, hentNaboIndices, rykTaagenTilbage, udloesFaellesEventEffekt } from './spilmotor';
import type { SpilEvent } from './eventBibliotek';

function spillerNavn() {
    return spilTilstand.spillerNavn || 'En spiller';
}

function afslørRadiusOgLog(logBesked: string, radius: number) {
    afslørOmraade(spilTilstand.spillerIndex, radius);
    return { logBesked };
}

export const specialItemEvents: Record<string, SpilEvent> = {
    spejlet_i_taagekanten: {
        id: 'spejlet_i_taagekanten',
        titel: 'Spejlet i tågekanten',
        tekst: 'Et lavt spejl står i græsset med bagsiden mod øst. Glasset viser ikke dit ansigt, men tågens kant set oppefra. Når du rører rammen, trækker disen sig sammen som en hånd.',
        biome: ['ritual', 'ruin', 'krystal', 'hoejland'],
        billede: '/events/ev_krystal.webp',
        minKolonnePct: 0.20,
        unik: false,
        valg: [
            {
                tekst: 'Ret den gyldne kikkert mod spejlet',
                kraeverItem: 'kikkert_45',
                effekt: () => {
                    rykTaagenTilbage(2);
                    return { logBesked: 'Kikkerten viser tågen dens egen bagside. Den trækker sig to felter tilbage.' };
                }
            },
            {
                tekst: 'Tving spejlet åbent med staven',
                kraeverItem: 'stav',
                effekt: () => {
                    rykTaagenTilbage(2);
                    return { logBesked: 'Staven slår en ren linje gennem glasset. Tågen rykker to felter tilbage, men spejlet lukker sig med det samme.', energiNed: 2 };
                }
            },
            {
                tekst: 'Hold faklen foran glasset',
                kraeverItem: 'fakkel',
                effekt: () => {
                    afslørOmraade(spilTilstand.spillerIndex, 2);
                    return { logBesked: 'Lyset gør ikke tågen bange, men det får den til at tegne sine nærmeste folder tydeligt.' };
                }
            },
            {
                tekst: 'Lad spejlet stå',
                udfaldListe: [
                    { log: 'Du går videre uden at lade spejlet lære dit ansigt.' }
                ]
            }
        ]
    },

    klokken_i_mosen: {
        id: 'klokken_i_mosen',
        titel: 'Klokken i mosen',
        tekst: 'En bronzeklokke ligger halvt sunket i en mørk mose. Den er for tung til at tage med. På indersiden står der: "Når én ringer, hører alle det."',
        biome: ['eng', 'mark', 'ruin', 'blodskov'],
        billede: '/events/ev_kilde.webp',
        unik: false,
        valg: [
            {
                tekst: 'Slå klokken rent med sabelen',
                kraeverItem: 'sabel',
                effekt: () => {
                    const besked = `${spillerNavn()} ringede med klokken i mosen. Alle på øen finder 100 guld i deres lommer.`;
                    udloesFaellesEventEffekt({ besked, guldAendring: 100 });
                    return { logBesked: besked };
                }
            },
            {
                tekst: 'Slå klokken hårdt med øksen',
                kraeverItem: 'oekse',
                effekt: () => {
                    const besked = `${spillerNavn()} slog klokken i mosen for hårdt. Lyden går gennem knoglerne på alle.`;
                    udloesFaellesEventEffekt({ besked, skade: 9 });
                    return { logBesked: besked };
                }
            },
            {
                tekst: 'Lirk mudderet væk med skovlen',
                kraeverItem: 'skovl',
                effekt: () => ({
                    logBesked: 'Du får klokken fri nok til at læse bunden. Under den ligger en gammel offerpose.',
                    guldOp: 85
                })
            },
            {
                tekst: 'Gå stille forbi',
                udfaldListe: [
                    { log: 'Mosen sluger dit fodspor uden lyd.' }
                ]
            }
        ]
    },

    dyrene_under_stjernerne: {
        id: 'dyrene_under_stjernerne',
        titel: 'Dyrene under stjernerne',
        tekst: 'En flok små, hvide dyr står i en ring omkring et felt med nedtrampet græs. De ligner hjorte, indtil de vender hovederne samtidig. De venter på et signal, ikke på mad.',
        biome: ['skov', 'eng', 'hoejland', 'blodskov'],
        billede: '/events/ev_skov.webp',
        unik: false,
        valg: [
            {
                tekst: 'Sænk buen og vis, at du kan holde afstand',
                kraeverItem: 'bue',
                effekt: () => {
                    afslørOmraade(spilTilstand.spillerIndex, 2);
                    return { logBesked: 'Dyrene spreder sig uden panik og efterlader en åbning i terrænet. Området omkring dig bliver tydeligere.', maxHpAendring: 5 };
                }
            },
            {
                tekst: 'Følg søgekvistens ryk i jorden',
                kraeverItem: 'soegekvist',
                effekt: () => ({
                    logBesked: 'Kvisten trækker dig mod et sted, hvor dyrene har skrabet jorden op. Rødderne under græsset er friske.',
                    hpOp: 22,
                    energiOp: 2
                })
            },
            {
                tekst: 'Læg mad ned og vent',
                kraeverItem: 'mad',
                effekt: () => ({
                    logBesked: 'Dyrene rører ikke maden. De sætter sig i stedet omkring dig, indtil din puls falder til ro.',
                    hpOp: 16,
                    maxHpAendring: 3
                })
            },
            {
                tekst: 'Gå gennem ringen',
                effekt: () => afslørRadiusOgLog('Dyrene træder til side. Da du er igennem, forstår du landskabet bedre. Et større område omkring dig bliver synligt.', 3)
            }
        ]
    },

    de_to_ved_broen: {
        id: 'de_to_ved_broen',
        titel: 'De to ved broen',
        tekst: 'To mennesker står på hver sin side af en smal bro. De taler ikke til hinanden, men de har begge samme tørre blomst bundet om håndleddet. Broen knager, hver gang en af dem prøver at gå først.',
        biome: ['by', 'ruin', 'eng', 'marked'],
        billede: '/events/ev_ruin.webp',
        unik: false,
        valg: [
            {
                tekst: 'Gå imellem dem i dit fine tøj',
                kraeverItem: 'flot_toej',
                effekt: () => ({
                    logBesked: 'De lytter, fordi du ligner en, der er vant til at blive hørt. Det er måske ikke retfærdigt, men i dag hjælper det.',
                    maxHpAendring: 8,
                    guldOp: 60
                })
            },
            {
                tekst: 'Lad elverrustningen bære det første skridt',
                kraeverItem: 'rustning_elver',
                effekt: () => ({
                    logBesked: 'Broen bøjer ikke under elverrustningen. De følger efter, én ad gangen. Ingen kalder det kærlighed, men ingen falder.',
                    maxHpAendring: 12
                })
            },
            {
                tekst: 'Lys broen op med faklen',
                kraeverItem: 'fakkel',
                effekt: () => {
                    rykTaagenTilbage(1);
                    return { logBesked: 'Faklen viser, at broen er kortere end frygten. Tågen slipper et enkelt felt, mens de finder hinanden.' };
                }
            },
            {
                tekst: 'Fortæl dem sandheden: broen holder ikke længe',
                effekt: () => ({
                    logBesked: 'De går samtidig. Broen mister to brædder, men holder. De efterlader dig en lille pose, som om sandhed også kan betales.',
                    guldOp: 45
                })
            }
        ]
    }
};
