import type { SpilEvent } from './eventBibliotek';
import { spilTilstand } from './spilTilstand.svelte';
import { tekst } from './i18n.svelte';

function koebDirkAfTyv() {
    const karakterId = spilTilstand.valgtKarakter?.id;
    const harDirk = spilTilstand.mitUdstyr.some(ting => (ting.id === 'dirk' || ting.id === 'mesterdirk') && ting.maengde > 0);

    if (harDirk) {
        return {
            logBesked: 'Tyven får øje på din dirk og lukker frakken igen. "Du har allerede det, du skal bruge."',
            logBeskedEn: 'The thief spots your lockpick and closes his coat. "You already have what you need."'
        };
    }

    const erTyv = karakterId === 'thief_m' || karakterId === 'thief_f';
    const bliverSnydt = karakterId === 'orc_m' || karakterId === 'orc_f' || karakterId === 'viking_m' || karakterId === 'viking_f';
    const pris = erTyv ? 25 : bliverSnydt ? 125 : 75;

    if (spilTilstand.guldTotal < pris) {
        const logBesked = tekst(
            `Tyven vil have ${pris} guld for dirken, men du mangler pengene.`,
            `The thief wants ${pris} gold for the lockpick, but you cannot afford it.`
        );
        return {
            logBesked,
            logBeskedEn: logBesked
        };
    }

    if (erTyv) {
        return {
            logBesked: `Tyven ser, at du kender faget, og springer salgstalen over. Du får dirken for ${pris} guld.`,
            logBeskedEn: `The thief sees that you know the trade and skips the sales pitch. The lockpick is yours for ${pris} gold.`,
            guldNed: pris,
            itemUd: 'dirk'
        };
    }

    if (bliverSnydt) {
        return {
            logBesked: `Tyven roser dine stærke hænder og tager ${pris} guld. Dirken er ikke halvdelen værd, men det fortæller han dig ikke.`,
            logBeskedEn: `The thief praises your strong hands and takes ${pris} gold. The lockpick is not worth half that, but he does not tell you.`,
            guldNed: pris,
            itemUd: 'dirk'
        };
    }

    return {
        logBesked: `Du køber dirken for ${pris} guld. Tyven er væk, før du når at spørge, hvor den kommer fra.`,
        logBeskedEn: `You buy the lockpick for ${pris} gold. The thief is gone before you can ask where it came from.`,
        guldNed: pris,
        itemUd: 'dirk'
    };
}

export const vaabenEvents: Record<string, SpilEvent> = {
    tyven_med_dirken: {
        id: 'tyven_med_dirken',
        titel: 'Tyven ved muren',
        titelEn: 'The Thief by the Wall',
        tekst: 'En ranglet mand står i læ ved muren med en lille dirk mellem fingrene. Han kalder det ikke tyveri, kun adgang.',
        tekstEn: 'A lanky man shelters by the wall with a small lockpick between his fingers. He does not call it theft, only access.',
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
                    { log: 'Tyven trækker på skuldrene. "En lukket dør er kun lukket, til nogen åbner den."', logEn: 'The thief shrugs. "A locked door is only locked until someone opens it."' }
                ]
            }
        ]
    },

    reb_over_kloften: {
        id: 'reb_over_kloften',
        titel: 'Rebet over kløften',
        titelEn: 'The Rope over the Ravine',
        tekst: 'Et slidt reb hænger over en smal kløft. På den anden side sidder en lille taske fast mellem to sten. Rebet kan måske bære dig. Måske.',
        tekstEn: 'A worn rope hangs over a narrow ravine. On the far side, a small bag is wedged between two rocks. The rope might hold your weight. Might.',
        biome: ['bjerg', 'hoejland', 'ruin'],
        billede: '/events/ev_bjerg.webp',
        valg: [
            {
                tekst: 'Skær tasken fri med kniven',
                tekstEn: 'Cut the bag free with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Du skærer rebet over med et rent snit. Tasken falder ned på din side af kløften.', logEn: 'You cut through the rope with one clean stroke. The bag drops onto your side of the ravine.', guldAendring: 90, maxHpAendring: 3 }
                ]
            },
            {
                tekst: 'Hug rebet fri med øksen',
                tekstEn: 'Chop the rope free with the axe',
                kraeverItem: 'oekse',
                udfaldListe: [
                    { log: 'Øksen kløver den rådne knude. Tasken falder fri, og bag stenen finder du et tørt forråd.', logEn: 'The axe splits the rotten knot. The bag comes free, revealing a dry stash behind the rock.', guldAendring: 70, givItem: 'mad' }
                ]
            },
            {
                tekst: 'Kravl ud på rebet',
                tekstEn: 'Crawl out onto the rope',
                udfaldListe: [
                    { log: 'Rebet holder. Du bider tasken fri og kravler tilbage med smagen af gammelt reb i munden.', logEn: 'The rope holds. You bite the bag free and crawl back with the taste of old rope in your mouth.', guldAendring: 60 },
                    { log: 'Rebet brister under dig. Du rammer klippevæggen hårdt, men får tasken med ned.', logEn: 'The rope snaps beneath you. You hit the cliff face hard, but the bag comes down with you.', hpAendring: -14, guldAendring: 50 }
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
        tekst: 'En mager hjort står helt stille mellem træerne. Den virker ikke syg, kun på vagt, som om den venter på dit første fejltrin.',
        tekstEn: 'A lean deer stands perfectly still between the trees. It does not look sick, only alert, as if waiting for your first mistake.',
        biome: ['skov', 'eng', 'blodskov'],
        billede: '/events/ev_skov.webp',
        valg: [
            {
                tekst: 'Skyd den rent med buen',
                tekstEn: 'Shoot it cleanly with the bow',
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: 'Pilen rammer rent, og hjorten falder uden et skrig. Der er mad nok til den videre rejse.', logEn: 'The arrow strikes cleanly, and the deer falls without a cry. There is enough meat for the road ahead.', hpAendring: 18, givItem: 'mad' }
                ]
            },
            {
                tekst: 'List tæt på med kniven',
                tekstEn: 'Sneak close with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Du kommer tæt nok på. Det er ikke kønt, men det går hurtigt.', logEn: 'You get close enough. It is not pretty, but it is quick.', hpAendring: 10, guldAendring: 25 },
                    { log: 'Hjorten springer for sent, men et gevir flår din arm. Du får byttet, men betaler med blod.', logEn: 'The deer leaps too late, but an antler tears your arm. You take the prey, but pay in blood.', hpAendring: -8, guldAendring: 35 }
                ]
            },
            {
                tekst: 'Følg den uden våben',
                tekstEn: 'Follow it without a weapon',
                udfaldListe: [
                    { log: 'Den fører dig til et sted med bløde rødder og rent vand.', logEn: 'It leads you to a place with soft roots and clean water.', hpAendring: 20 },
                    { log: 'Den forsvinder mellem træerne. Du står alene, træt og kommet ud af kurs.', logEn: 'It vanishes between the trees. You are left alone, tired and off course.', hpAendring: -5 }
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
        tekst: 'Under et bundt våde sejl finder du en jernkrog og en låst kasse. Fodsporene omkring dem tilhører nogen, der helst ikke ville ses.',
        tekstEn: 'Beneath a bundle of wet sails, you find an iron hook and a locked chest. The tracks around them belong to someone who did not want to be seen.',
        biome: ['hav', 'marked', 'by'],
        billede: '/events/ev_hav.webp',
        valg: [
            {
                tekst: 'Vrid låsen op med sabelen',
                tekstEn: 'Twist the lock open with the saber',
                kraeverItem: 'sabel',
                udfaldListe: [
                    { log: 'Sabelspidsen finder låsens svage punkt. Kassen åbner med et lovende klik.', logEn: 'The saber tip finds the lock’s weak point. The chest opens with a promising click.', guldAendring: 140 }
                ]
            },
            {
                tekst: 'Skær sejlet op med kniven',
                tekstEn: 'Cut open the sail with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Der er syet mønter ind i sejlets kant. Smuglerne stolede åbenbart mere på stof end på folk.', logEn: 'Coins are sewn into the sail’s hem. The smugglers clearly trusted cloth more than people.', guldAendring: 80 }
                ]
            },
            {
                tekst: 'Brug krogen som den er',
                tekstEn: 'Use the hook as it is',
                udfaldListe: [
                    { log: 'Du får kassen fri, men krogen smutter og slår dig over knoerne.', logEn: 'You free the chest, but the hook slips and strikes your knuckles.', hpAendring: -7, guldAendring: 65 },
                    { log: 'Krogen får fat, og kassen følger med. Det er klodset, men det virker.', logEn: 'The hook catches, and the chest comes with it. Clumsy, but effective.', guldAendring: 75 }
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
        tekst: 'En vogn ligger væltet i mudderet. Hjulene drejer langsomt i den stille luft. Under ladet kan du se en pakke svøbt i voksdug.',
        tekstEn: 'A cart lies overturned in the mud. Its wheels turn slowly in the still air. Beneath the bed, you spot a package wrapped in waxed cloth.',
        biome: ['mark', 'eng', 'by', 'marked'],
        billede: '/events/ev_marked.webp',
        valg: [
            {
                tekst: 'Hug akslen over med øksen',
                tekstEn: 'Chop through the axle with the axe',
                kraeverItem: 'oekse',
                udfaldListe: [
                    { log: 'Akslen giver efter. Vognen synker tungt ned i mudderet, og pakken glider fri.', logEn: 'The axle gives way. The cart sinks heavily into the mud, and the package slides free.', guldAendring: 100, givItem: 'mad' }
                ]
            },
            {
                tekst: 'Skær voksdugen op med kniven',
                tekstEn: 'Cut open the waxed cloth with the knife',
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: 'Du skærer en smal åbning og får hånden ind. Indholdet er tørt, og ingen ser dig tage det.', logEn: 'You cut a narrow opening and slip your hand inside. The contents are dry, and no one sees you take them.', guldAendring: 75, hpAendring: 5 }
                ]
            },
            {
                tekst: 'Skyd rebet over på afstand',
                tekstEn: 'Shoot the rope from a distance',
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
                    { log: 'Du kryber ind og slipper ud igen, dækket af mudder, men med pakken under armen.', logEn: 'You crawl in and make it back out, covered in mud but carrying the package.', guldAendring: 65 }
                ]
            }
        ]
    }
};
