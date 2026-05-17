import type { SpilEvent } from './eventBibliotek';
import { spilTilstand } from './spilTilstand.svelte';

function koebDirkAfTyv() {
    const karakterId = spilTilstand.valgtKarakter?.id;
    const harDirk = spilTilstand.mitUdstyr.some(ting => (ting.id === 'dirk' || ting.id === 'mesterdirk') && ting.maengde > 0);

    if (harDirk) {
        return {
            logBesked: 'Tyven ser din dirk og lukker frakken igen. "Du mangler ikke mit værktøj."'
        };
    }

    const erTyv = karakterId === 'thief_m' || karakterId === 'thief_f';
    const bliverSnydt = karakterId === 'orc_m' || karakterId === 'orc_f' || karakterId === 'viking_m' || karakterId === 'viking_f';
    const pris = erTyv ? 25 : bliverSnydt ? 125 : 75;

    if (spilTilstand.guldTotal < pris) {
        return {
            logBesked: `Tyven vil have ${pris} guld for dirken. Du har ikke nok.`
        };
    }

    if (erTyv) {
        return {
            logBesked: `Tyven genkender dit blik og giver dig prisen uden teater. Dirken koster ${pris} guld.`,
            guldNed: pris,
            itemUd: 'dirk'
        };
    }

    if (bliverSnydt) {
        return {
            logBesked: `Tyven roser dine stærke hænder, mens han tager ${pris} guld for et stykke værktøj, der ikke burde koste det halve.`,
            guldNed: pris,
            itemUd: 'dirk'
        };
    }

    return {
        logBesked: `Tyven sælger dig en dirk for ${pris} guld og forsvinder, før du når at spørge, hvor den kommer fra.`,
        guldNed: pris,
        itemUd: 'dirk'
    };
}

export const vaabenEvents: Record<string, SpilEvent> = {
    tyven_med_dirken: {
        id: 'tyven_med_dirken',
        titel: 'Tyven ved muren',
        tekst: 'En smal mand står i læ af en mur og holder en lille dirk mellem to fingre. Han kalder det ikke tyveri. Han kalder det adgang.',
        biome: ['by', 'bandit'],
        billede: '/events/ev_bandit.webp',
        vaegt: 0.8,
        unik: false,
        valg: [
            {
                tekst: 'Køb dirken',
                effekt: () => koebDirkAfTyv()
            },
            {
                tekst: 'Sig nej og gå videre',
                udfaldListe: [
                    { log: 'Tyven trækker på skuldrene. "Alle døre er lukkede, indtil de ikke er det."' }
                ]
            }
        ]
    },

    reb_over_kloften: {
        id: 'reb_over_kloften',
        titel: 'Rebet over kløften',
        tekst: 'Et gammelt reb hænger over en smal kløft. På den anden side ligger en lille taske klemt fast mellem to sten. Rebet kan bære noget. Måske dig. Måske ikke.',
        biome: ['bjerg', 'hoejland', 'ruin'],
        billede: '/events/ev_bjerg.webp',
        valg: [
            {
                tekst: 'Skær tasken fri med kniven',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Kniven går gennem rebet uden at ryste hånden. Tasken falder ned på din side.', guldAendring: 90, maxHpAendring: 3 }
                ]
            },
            {
                tekst: 'Hug rebet fri med øksen',
                kraeverItem: 'oekse',
                udfaldListe: [
                    { log: 'Øksen kløver den rådne knude. Tasken kommer fri, og stenen bag den afslører et tørt skjul.', guldAendring: 70, givItem: 'mad' }
                ]
            },
            {
                tekst: 'Kravl ud på rebet',
                udfaldListe: [
                    { log: 'Rebet holder. Du får tasken fri med tænderne og kommer tilbage med en grim smag i munden.', guldAendring: 60 },
                    { log: 'Rebet holder ikke hele vejen. Du rammer klippevæggen hårdt, men tasken ryger med ned.', hpAendring: -14, guldAendring: 50 }
                ]
            },
            {
                tekst: 'Lad tasken hænge',
                udfaldListe: [
                    { log: 'Du lader tasken hænge. Nogle ting sidder fast af en grund.' }
                ]
            }
        ]
    },

    hjorten_i_taagen: {
        id: 'hjorten_i_taagen',
        titel: 'Hjorten i tågen',
        tekst: 'En mager hjort står helt stille mellem stammerne. Den ser ikke syg ud. Den ser ud, som om den venter på, at nogen gør det første forkerte.',
        biome: ['skov', 'eng', 'blodskov'],
        billede: '/events/ev_skov.webp',
        valg: [
            {
                tekst: 'Skyd den rent med buen',
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: 'Pilen rammer præcist. Dyret falder uden skrig. Du får mad nok til at komme videre.', hpAendring: 18, givItem: 'mad' }
                ]
            },
            {
                tekst: 'List tæt på med kniven',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Du kommer tæt nok på. Det er ikke elegant, men det er hurtigt.', hpAendring: 10, guldAendring: 25 },
                    { log: 'Hjorten springer for sent, men hornet river dig over armen. Du får byttet med, men det koster blod.', hpAendring: -8, guldAendring: 35 }
                ]
            },
            {
                tekst: 'Følg den uden våben',
                udfaldListe: [
                    { log: 'Den fører dig til et sted med bløde rødder og rent vand.', hpAendring: 20 },
                    { log: 'Den forsvinder mellem træerne. Du står alene, trættere og lidt længere fra din plan.', hpAendring: -5 }
                ]
            },
            {
                tekst: 'Lad den være',
                udfaldListe: [
                    { log: 'Hjorten bliver stående, mens du går. Det føles mindre som fred end som en aftale.' }
                ]
            }
        ]
    },

    smuglerens_baadkrog: {
        id: 'smuglerens_baadkrog',
        titel: 'Smuglerens bådkrog',
        tekst: 'Under nogle våde sejl ligger en jernkrog, en låst kasse og spor efter nogen, der kom i land uden at ville ses.',
        biome: ['hav', 'marked', 'by'],
        billede: '/events/ev_hav.webp',
        valg: [
            {
                tekst: 'Vrid låsen op med sabelen',
                kraeverItem: 'sabel',
                udfaldListe: [
                    { log: 'Sabelens spids finder låsens svage sted. Kassen åbner med et klik, der lyder dyrt.', guldAendring: 140 }
                ]
            },
            {
                tekst: 'Skær sejlet op med kniven',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Inde i sejlet er der syet mønter ind i kanten. Smuglere stolede åbenbart mere på stof end folk.', guldAendring: 80 }
                ]
            },
            {
                tekst: 'Brug krogen som den er',
                udfaldListe: [
                    { log: 'Du får kassen fri, men krogen smutter og slår dig over knoerne.', hpAendring: -7, guldAendring: 65 },
                    { log: 'Krogen tager fat, og kassen følger med. Ingen finesse. Det virker.', guldAendring: 75 }
                ]
            },
            {
                tekst: 'Lad smuglergodset ligge',
                udfaldListe: [
                    { log: 'Du lader kassen ligge. Havet kan beholde sine hemmeligheder lidt endnu.' }
                ]
            }
        ]
    },

    vaeltet_vogn: {
        id: 'vaeltet_vogn',
        titel: 'Den væltede vogn',
        tekst: 'En vogn ligger på siden i mudderet. Hjulene drejer langsomt, selv om der ikke er vind. Under ladet ligger noget pakket ind i voksdug.',
        biome: ['mark', 'eng', 'by', 'marked'],
        billede: '/events/ev_marked.webp',
        valg: [
            {
                tekst: 'Hug akslen over med øksen',
                kraeverItem: 'oekse',
                udfaldListe: [
                    { log: 'Akslen giver efter. Vognen sætter sig tungt i mudderet, og pakken glider fri.', guldAendring: 100, givItem: 'mad' }
                ]
            },
            {
                tekst: 'Skær voksdugen op med kniven',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Du skærer kun lige nok til at få hånden ind. Indholdet er tørt, og ingen ser dig tage det.', guldAendring: 75, hpAendring: 5 }
                ]
            },
            {
                tekst: 'Hold afstand og skyd rebet over med buen',
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: 'Pilen skærer rebet. Fælden under vognen klapper sammen uden at ramme dig.', guldAendring: 60, maxHpAendring: 4 }
                ]
            },
            {
                tekst: 'Kravl ind under vognen',
                udfaldListe: [
                    { log: 'Du får pakken fri, men vognen synker et stykke og presser luften ud af dig.', hpAendring: -15, guldAendring: 90 },
                    { log: 'Du glider ind og ud igen, dækket af mudder, men med pakken under armen.', guldAendring: 65 }
                ]
            }
        ]
    }
};
