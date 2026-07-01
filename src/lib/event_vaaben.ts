import type { SpilEvent } from './eventBibliotek';
import { spilTilstand } from './spilTilstand.svelte';
import { tekst } from './i18n.svelte';

function koebDirkAfTyv() {
    const karakterId = spilTilstand.valgtKarakter?.id;
    const harDirk = spilTilstand.mitUdstyr.some(ting => (ting.id === 'dirk' || ting.id === 'mesterdirk') && ting.maengde > 0);

    if (harDirk) {
        return {
            logBesked: 'Tyven ser din dirk og lukker frakken igen. "Du mangler ikke mit værktøj."',
            logBeskedEn: 'The thief sees your lockpick and closes his coat again. "You do not need my tool."'
        };
    }

    const erTyv = karakterId === 'thief_m' || karakterId === 'thief_f';
    const bliverSnydt = karakterId === 'orc_m' || karakterId === 'orc_f' || karakterId === 'viking_m' || karakterId === 'viking_f';
    const pris = erTyv ? 25 : bliverSnydt ? 125 : 75;

    if (spilTilstand.guldTotal < pris) {
        const logBesked = tekst(
            `Tyven vil have ${pris} guld for dirken. Du har ikke nok.`,
            `The thief wants ${pris} gold for the lockpick. You do not have enough.`
        );
        return {
            logBesked,
            logBeskedEn: logBesked
        };
    }

    if (erTyv) {
        return {
            logBesked: `Tyven genkender dit blik og giver dig prisen uden teater. Dirken koster ${pris} guld.`,
            logBeskedEn: `The thief recognizes your look and gives you the price without theater. The lockpick costs ${pris} gold.`,
            guldNed: pris,
            itemUd: 'dirk'
        };
    }

    if (bliverSnydt) {
        return {
            logBesked: `Tyven roser dine stærke hænder, mens han tager ${pris} guld for et stykke værktøj, der ikke burde koste det halve.`,
            logBeskedEn: `The thief praises your strong hands while taking ${pris} gold for a tool that should not cost half that.`,
            guldNed: pris,
            itemUd: 'dirk'
        };
    }

    return {
        logBesked: `Tyven sælger dig en dirk for ${pris} guld og forsvinder, før du når at spørge, hvor den kommer fra.`,
        logBeskedEn: `The thief sells you a lockpick for ${pris} gold and vanishes before you can ask where it came from.`,
        guldNed: pris,
        itemUd: 'dirk'
    };
}

export const vaabenEvents: Record<string, SpilEvent> = {
    tyven_med_dirken: {
        id: 'tyven_med_dirken',
        titel: 'Tyven ved muren',
        titelEn: 'The Thief by the Wall',
        tekst: 'En smal mand står i læ af en mur og holder en lille dirk mellem to fingre. Han kalder det ikke tyveri. Han kalder det adgang.',
        tekstEn: 'A narrow man stands in the shelter of a wall, holding a small lockpick between two fingers. He does not call it theft. He calls it access.',
        biome: ['by', 'bandit'],
        billede: '/events/ev_bandit.webp',
        vaegt: 0.8,
        unik: false,
        valg: [
            {
                tekst: 'Køb dirken',
                tekstEn: 'Buy the lockpick',
                effekt: () => koebDirkAfTyv()
            },
            {
                tekst: 'Sig nej og gå videre',
                tekstEn: 'Say no and move on',
                udfaldListe: [
                    { log: 'Tyven trækker på skuldrene. "Alle døre er lukkede, indtil de ikke er det."', logEn: 'The thief shrugs. "All doors are locked until they are not."' }
                ]
            }
        ]
    },

    reb_over_kloften: {
        id: 'reb_over_kloften',
        titel: 'Rebet over kløften',
        titelEn: 'The Rope over the Ravine',
        tekst: 'Et gammelt reb hænger over en smal kløft. På den anden side ligger en lille taske klemt fast mellem to sten. Rebet kan bære noget. Måske dig. Måske ikke.',
        tekstEn: 'An old rope hangs over a narrow ravine. On the other side, a small bag is wedged between two stones. The rope can carry something. Maybe you. Maybe not.',
        biome: ['bjerg', 'hoejland', 'ruin'],
        billede: '/events/ev_bjerg.webp',
        valg: [
            {
                tekst: 'Skær tasken fri med kniven',
                tekstEn: 'Cut the bag free with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Kniven går gennem rebet uden at ryste hånden. Tasken falder ned på din side.', logEn: 'The knife goes through the rope without your hand shaking. The bag falls onto your side.', guldAendring: 90, maxHpAendring: 3 }
                ]
            },
            {
                tekst: 'Hug rebet fri med øksen',
                tekstEn: 'Chop the rope free with the axe',
                kraeverItem: 'oekse',
                udfaldListe: [
                    { log: 'Øksen kløver den rådne knude. Tasken kommer fri, og stenen bag den afslører et tørt skjul.', logEn: 'The axe splits the rotten knot. The bag comes free, and the stone behind it reveals a dry stash.', guldAendring: 70, givItem: 'mad' }
                ]
            },
            {
                tekst: 'Kravl ud på rebet',
                tekstEn: 'Crawl out onto the rope',
                udfaldListe: [
                    { log: 'Rebet holder. Du får tasken fri med tænderne og kommer tilbage med en grim smag i munden.', logEn: 'The rope holds. You free the bag with your teeth and return with a foul taste in your mouth.', guldAendring: 60 },
                    { log: 'Rebet holder ikke hele vejen. Du rammer klippevæggen hårdt, men tasken ryger med ned.', logEn: 'The rope does not hold all the way. You hit the cliff wall hard, but the bag comes down with you.', hpAendring: -14, guldAendring: 50 }
                ]
            },
            {
                tekst: 'Lad tasken hænge',
                tekstEn: 'Leave the bag hanging',
                udfaldListe: [
                    { log: 'Du lader tasken hænge. Nogle ting sidder fast af en grund.', logEn: 'You leave the bag hanging. Some things are stuck for a reason.' }
                ]
            }
        ]
    },

    hjorten_i_taagen: {
        id: 'hjorten_i_taagen',
        titel: 'Hjorten i tågen',
        titelEn: 'The Deer in the Fog',
        tekst: 'En mager hjort står helt stille mellem stammerne. Den ser ikke syg ud. Den ser ud, som om den venter på, at nogen gør det første forkerte.',
        tekstEn: 'A thin deer stands perfectly still between the trunks. It does not look sick. It looks as if it is waiting for someone to do the first wrong thing.',
        biome: ['skov', 'eng', 'blodskov'],
        billede: '/events/ev_skov.webp',
        valg: [
            {
                tekst: 'Skyd den rent med buen',
                tekstEn: 'Shoot it cleanly with the bow',
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: 'Pilen rammer præcist. Dyret falder uden skrig. Du får mad nok til at komme videre.', logEn: 'The arrow hits cleanly. The animal falls without a cry. You get enough food to move on.', hpAendring: 18, givItem: 'mad' }
                ]
            },
            {
                tekst: 'List tæt på med kniven',
                tekstEn: 'Sneak close with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Du kommer tæt nok på. Det er ikke elegant, men det er hurtigt.', logEn: 'You get close enough. It is not elegant, but it is quick.', hpAendring: 10, guldAendring: 25 },
                    { log: 'Hjorten springer for sent, men hornet river dig over armen. Du får byttet med, men det koster blod.', logEn: 'The deer leaps too late, but the antler tears your arm. You get the prey, but it costs blood.', hpAendring: -8, guldAendring: 35 }
                ]
            },
            {
                tekst: 'Følg den uden våben',
                tekstEn: 'Follow it without a weapon',
                udfaldListe: [
                    { log: 'Den fører dig til et sted med bløde rødder og rent vand.', logEn: 'It leads you to a place with soft roots and clean water.', hpAendring: 20 },
                    { log: 'Den forsvinder mellem træerne. Du står alene, trættere og lidt længere fra din plan.', logEn: 'It vanishes between the trees. You stand alone, more tired and a little farther from your plan.', hpAendring: -5 }
                ]
            },
            {
                tekst: 'Lad den være',
                tekstEn: 'Leave it alone',
                udfaldListe: [
                    { log: 'Hjorten bliver stående, mens du går. Det føles mindre som fred end som en aftale.', logEn: 'The deer remains standing as you leave. It feels less like peace than like an agreement.' }
                ]
            }
        ]
    },

    smuglerens_baadkrog: {
        id: 'smuglerens_baadkrog',
        titel: 'Smuglerens bådkrog',
        titelEn: "The Smuggler's Boat Hook",
        tekst: 'Under nogle våde sejl ligger en jernkrog, en låst kasse og spor efter nogen, der kom i land uden at ville ses.',
        tekstEn: 'Under some wet sails lie an iron hook, a locked chest and traces of someone who came ashore without wanting to be seen.',
        biome: ['hav', 'marked', 'by'],
        billede: '/events/ev_hav.webp',
        valg: [
            {
                tekst: 'Vrid låsen op med sabelen',
                tekstEn: 'Twist the lock open with the saber',
                kraeverItem: 'sabel',
                udfaldListe: [
                    { log: 'Sabelens spids finder låsens svage sted. Kassen åbner med et klik, der lyder dyrt.', logEn: 'The saber tip finds the lock’s weak point. The chest opens with a click that sounds expensive.', guldAendring: 140 }
                ]
            },
            {
                tekst: 'Skær sejlet op med kniven',
                tekstEn: 'Cut open the sail with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Inde i sejlet er der syet mønter ind i kanten. Smuglere stolede åbenbart mere på stof end folk.', logEn: 'Inside the sail, coins are sewn into the hem. Smugglers apparently trusted cloth more than people.', guldAendring: 80 }
                ]
            },
            {
                tekst: 'Brug krogen som den er',
                tekstEn: 'Use the hook as it is',
                udfaldListe: [
                    { log: 'Du får kassen fri, men krogen smutter og slår dig over knoerne.', logEn: 'You free the chest, but the hook slips and strikes your knuckles.', hpAendring: -7, guldAendring: 65 },
                    { log: 'Krogen tager fat, og kassen følger med. Ingen finesse. Det virker.', logEn: 'The hook catches, and the chest comes with it. No finesse. It works.', guldAendring: 75 }
                ]
            },
            {
                tekst: 'Lad smuglergodset ligge',
                tekstEn: 'Leave the smuggled goods',
                udfaldListe: [
                    { log: 'Du lader kassen ligge. Havet kan beholde sine hemmeligheder lidt endnu.', logEn: 'You leave the chest. The sea can keep its secrets a little longer.' }
                ]
            }
        ]
    },

    vaeltet_vogn: {
        id: 'vaeltet_vogn',
        titel: 'Den væltede vogn',
        titelEn: 'The Overturned Cart',
        tekst: 'En vogn ligger på siden i mudderet. Hjulene drejer langsomt, selv om der ikke er vind. Under ladet ligger noget pakket ind i voksdug.',
        tekstEn: 'A cart lies on its side in the mud. The wheels turn slowly, though there is no wind. Under the bed lies something wrapped in waxed cloth.',
        biome: ['mark', 'eng', 'by', 'marked'],
        billede: '/events/ev_marked.webp',
        valg: [
            {
                tekst: 'Hug akslen over med øksen',
                tekstEn: 'Chop through the axle with the axe',
                kraeverItem: 'oekse',
                udfaldListe: [
                    { log: 'Akslen giver efter. Vognen sætter sig tungt i mudderet, og pakken glider fri.', logEn: 'The axle gives way. The cart settles heavily into the mud, and the package slides free.', guldAendring: 100, givItem: 'mad' }
                ]
            },
            {
                tekst: 'Skær voksdugen op med kniven',
                tekstEn: 'Cut open the waxed cloth with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Du skærer kun lige nok til at få hånden ind. Indholdet er tørt, og ingen ser dig tage det.', logEn: 'You cut just enough to get your hand inside. The contents are dry, and no one sees you take them.', guldAendring: 75, hpAendring: 5 }
                ]
            },
            {
                tekst: 'Hold afstand og skyd rebet over med buen',
                tekstEn: 'Keep your distance and shoot the rope with the bow',
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: 'Pilen skærer rebet. Fælden under vognen klapper sammen uden at ramme dig.', logEn: 'The arrow cuts the rope. The trap under the cart snaps shut without hitting you.', guldAendring: 60, maxHpAendring: 4 }
                ]
            },
            {
                tekst: 'Kravl ind under vognen',
                tekstEn: 'Crawl under the cart',
                udfaldListe: [
                    { log: 'Du får pakken fri, men vognen synker et stykke og presser luften ud af dig.', logEn: 'You free the package, but the cart sinks a little and squeezes the air out of you.', hpAendring: -15, guldAendring: 90 },
                    { log: 'Du glider ind og ud igen, dækket af mudder, men med pakken under armen.', logEn: 'You slide in and out again, covered in mud, but with the package under your arm.', guldAendring: 65 }
                ]
            }
        ]
    }
};
