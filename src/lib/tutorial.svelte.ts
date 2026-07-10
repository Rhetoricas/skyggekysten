import type { Felt, Karakter } from './types';
import { kanGravesIBiome } from './graveRegler';
import { tekst } from './i18n.svelte';

export const TUTORIAL_BREDDE = 20;
export const TUTORIAL_HOEJDE = 10;
export const TUTORIAL_RUMKODE = 'tutorial';
export const TUTORIAL_SPILLERNAVN = 'Lærling';
const TUTORIAL_KNAP_SKJULT_KEY = 'taage_tutorial_knap_skjult';

export const TUTORIAL_RANGTRIN = [
    {
        point: 0,
        titel: 'Landkrabbe',
        tekst: 'Du kom i gang og lærte øens grundregler.'
    },
    {
        point: 500,
        titel: 'Begynder',
        tekst: 'Du har styr på bevægelse, energi og de første valg.'
    },
    {
        point: 1000,
        titel: 'Stifinder',
        tekst: 'Du fandt en sikker rute og brugte øens muligheder godt.'
    },
    {
        point: 1500,
        titel: 'Ø-kender',
        tekst: 'Du fik udstyr, udforskning og tempo til at arbejde sammen.'
    },
    {
        point: 2000,
        titel: 'Tågevandrer',
        tekst: 'Du bevæger dig gennem tutorialen som på en rigtig ekspedition.'
    }
];

const tutorialRangEngelsk = [
    {
        titel: 'Landlubber',
        tekst: 'You got started and learned the island basics.'
    },
    {
        titel: 'Beginner',
        tekst: 'You understand movement, energy and the first choices.'
    },
    {
        titel: 'Pathfinder',
        tekst: 'You found a safe route and used the island well.'
    },
    {
        titel: 'Island Guide',
        tekst: 'You brought equipment, exploration and pace together.'
    },
    {
        titel: 'Fog Walker',
        tekst: 'You move through the tutorial like a real expedition.'
    }
];

function oversaetTutorialRangTrin(trin: (typeof TUTORIAL_RANGTRIN)[number]) {
    const index = TUTORIAL_RANGTRIN.indexOf(trin);
    const engelsk = tutorialRangEngelsk[index] || tutorialRangEngelsk[0];
    return {
        ...trin,
        titel: tekst(trin.titel, engelsk.titel),
        tekst: tekst(trin.tekst, engelsk.tekst)
    };
}

export function hentTutorialRangtrin() {
    return TUTORIAL_RANGTRIN.map(oversaetTutorialRangTrin);
}

export function hentTutorialRang(score: number) {
    const point = Number.isFinite(score) ? score : 0;
    let aktuel = TUTORIAL_RANGTRIN[0];
    for (const trin of TUTORIAL_RANGTRIN) {
        if (point >= trin.point) aktuel = trin;
    }

    return {
        aktuel: oversaetTutorialRangTrin(aktuel),
        naeste: TUTORIAL_RANGTRIN.find((trin) => point < trin.point)
            ? oversaetTutorialRangTrin(TUTORIAL_RANGTRIN.find((trin) => point < trin.point)!)
            : null
    };
}

export function erTutorialKnapSkjult() {
    try {
        return typeof localStorage !== 'undefined' && localStorage.getItem(TUTORIAL_KNAP_SKJULT_KEY) === '1';
    } catch {
        return false;
    }
}

export function skjulTutorialKnap() {
    try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(TUTORIAL_KNAP_SKJULT_KEY, '1');
    } catch {
        // Browseren kan blokere localStorage. Så vises knappen bare igen næste gang.
    }
}

export const tutorialKarakter: Karakter = {
    id: 'tutorial_laerling',
    navn: 'Lærling',
    ikon: '/game_faces/beginner.webp',
    startMsg: 'En rolig tur, hvor du kan lære øen at kende.',
    startHp: 120,
    startGuld: 180,
    startUdstyr: ['skovl', 'mad', 'sovepose'],
    moveCost: 1,
    digCost: 2,
    dmgMod: 1,
    goldMod: 1,
    fordel: 'Du ser langt, graver billigt og starter med skovl, mad og sovepose.',
    ulempe: 'Lærlingen bruges kun i tutorialen og tæller ikke med i din score.',
    baseEnergi: 12,
    synsRadius: 2
};

export type TutorialHandling = 'move' | 'help' | 'rulebook' | 'dig' | 'item' | 'shop' | 'event' | 'boat';

type TutorialTrinId = TutorialHandling | 'done';

export type TutorialTrin = {
    id: TutorialTrinId;
    titel: string;
    tekst: string;
    popupTitel: string;
    popupTekst: string;
    popupPunkter?: string[];
    laesMere?: string;
};

export const tutorialTrin: TutorialTrin[] = [
    {
        id: 'move',
        titel: '1. Gå i land',
        tekst: 'Tutorial-øen er 20 × 10 felter. Tryk på et felt ved siden af dig for at flytte.',
        popupTitel: 'Velkommen, Lærling',
        popupTekst: 'Her kan du lære de vigtigste dele af Tågeøerne uden at påvirke gemte spil eller toplisten.',
        popupPunkter: [
            'Kortet er 20 × 10 felter. De store øer er omkring 100 × 20.',
            'Tryk på et felt lige ved siden af Lærling for at flytte.',
            'Øverst ligger fokus, spørgsmålstegn, regelbog og lyd. Nederst ligger HP, guld, energi, gravning og rygsæk.'
        ],
        laesMere: 'Du skal ikke huske alt nu. Spørgsmålstegnet og regelbogen er lavet til at hjælpe dig senere.'
    },
    {
        id: 'help',
        titel: '2. Brug spørgsmålstegnet',
        tekst: 'Tryk på ? øverst til højre. Tryk derefter på et felt, et ikon eller en status for at få en forklaring.',
        popupTitel: 'Få hjælp direkte på skærmen',
        popupTekst: 'Spørgsmålstegnet forklarer felter, ikoner og status, mens du spiller.',
        popupPunkter: [
            'Tryk på ? øverst til højre for at slå hjælpen til.',
            'Tryk derefter på et felt, HP, guld, energi, graveknappen eller en genstand.',
            'Tryk på ? igen for at vende tilbage til spillet.'
        ],
        laesMere: 'Når du senere møder mærkelige felter eller nye ikoner, er ? det første sted at starte.'
    },
    {
        id: 'rulebook',
        titel: '3. Åbn regelbogen',
        tekst: 'Tryk på bogikonet øverst. Her kan du altid slå en regel op.',
        popupTitel: 'Brug regelbogen, når du er i tvivl',
        popupTekst: 'Her finder du reglerne for tåge, både, udstyr, hændelser, gravning, score og karakterer.',
        popupPunkter: [
            'Du behøver ikke læse den fra start til slut.',
            'Brug den, når du vil forstå hvorfor noget skete.',
            'De store øer bliver lettere at læse, når du kender nogle få nøgleregler.'
        ],
        laesMere: 'Tutorialen viser kun det vigtigste. Regelbogen er dér, hvor du kan sætte dig mere ind i detaljerne.'
    },
    {
        id: 'dig',
        titel: '4. Grav efter noget',
        tekst: 'Gå til marken på ruten, og tryk på graveknappen nederst. Med en skovl bruger du mindre energi.',
        popupTitel: 'Der kan ligge noget under jorden',
        popupTekst: 'Nogle felter gemmer guld, helende rødder, fælder eller udstyr. Graveknappen bliver aktiv, når du kan grave på feltet.',
        popupPunkter: [
            'En skovl gør gravning billigere og mindre risikabel end at grave med hænderne.',
            'Gravning bruger energi. Når energien slipper op, går dagen videre.',
            'Det er ikke altid værd at grave alt. Tågen presser dig mod øst.'
        ],
        laesMere: 'Regelbogen har mere om skjulte fælder, rødder, skovle og særligt graveudstyr.'
    },
    {
        id: 'item',
        titel: '5. Brug rygsækken',
        tekst: 'Tryk på din madration nederst. Du bruger genstande i rygsækken ved at trykke på dem.',
        popupTitel: 'Rygsækken er din værktøjskasse',
        popupTekst: 'Nogle genstande bruger du selv, mens andre virker automatisk. Madrationen virker med det samme og er et godt sted at begynde.',
        popupPunkter: [
            'Tryk på madrationen for at få HP og gøre næste bevægelse gratis.',
            'Nogle ting virker kun i bestemte situationer og bliver grå, når de ikke kan bruges.',
            'Andre ting virker automatisk, for eksempel udstyr der ændrer skade, syn eller energi.'
        ],
        laesMere: 'Brug ? på en genstand for at se, hvornår og hvordan den virker.'
    },
    {
        id: 'shop',
        titel: '6. Besøg markedet',
        tekst: 'Gå ind på markedet, og køb en vare. Guld kan bruges på udstyr eller gemmes til din score.',
        popupTitel: 'Brug guldet – eller tag det med hjem',
        popupTekst: 'På markeder og i butikker kan du købe udstyr. På en rigtig ø må du vælge mellem hjælp her og nu eller mere guld til din score.',
        popupPunkter: [
            'Tryk på en vare for at købe den.',
            'Tryk på dine egne genstande for at sælge dem.',
            'Nogle varer er almindelige, mens sjældne relikvier typisk findes i hændelser.'
        ],
        laesMere: 'Regelbogen forklarer butikker, værksteder, salgsværdi og hvordan guld tæller med i slutscoren.'
    },
    {
        id: 'event',
        titel: '7. Prøv en hændelse',
        tekst: 'Gå til prismet på ruten, og vælg en handling. Der ligger endnu et prisme i nærheden, hvis du vil prøve mere.',
        popupTitel: 'Hændelser giver dig valg',
        popupTekst: 'En hændelse sætter dig i en situation og lader dig vælge, hvad du gør. Nogle valg kræver bestemt udstyr eller har en tydelig risiko.',
        popupPunkter: [
            'Prismet kan have låste valg, hvis du mangler bestemte genstande.',
            'Hændelsen i tutorialen er mere rolig og viser samme grundidé med mindre risiko.',
            'Det rette udstyr kan ofte åbne en bedre eller mere sikker løsning.',
            'Når hændelsen er slut, går tiden normalt videre.'
        ],
        laesMere: 'Regelbogen forklarer krav, våbenfordele, relikvier og længere hændelsesforløb.'
    },
    {
        id: 'boat',
        titel: '8. Find båden',
        tekst: 'Fortsæt mod øst til flugtbåden. Gå ombord for at klare øen.',
        popupTitel: 'Målet er ikke at se alt',
        popupTekst: 'Du skal ikke undersøge alt. Du skal overleve længe nok til at nå en flugtbåd. På de store øer ligger bådene typisk mod øst, mens tågen presser på bagfra.',
        popupPunkter: [
            'Du vinder ved at gå ombord på en båd.',
            'De store øer kræver skarpere rutevalg og et højere tempo.',
            'Det er ofte bedre at nå frem end at rydde hele kortet.'
        ],
        laesMere: 'Regelbogen har mere om tågens retning, hvornår bådene ankommer, og hvordan flere spillere deler øen.'
    },
    {
        id: 'done',
        titel: 'Tutorial klaret',
        tekst: 'Du har prøvet de vigtigste handlinger. De store øer er farligere og omkring 100 × 20 felter.',
        popupTitel: 'Du er klar til en rigtig ø',
        popupTekst: 'Du har bevæget dig, gravet, brugt udstyr, handlet, mødt en hændelse og fundet flugtbåden. Nu er du klar til tågen.',
        popupPunkter: [
            'På startskærmen kan du skrive et ønavn eller få et tilfældigt forslag.',
            'Det samme ønavn skaber den samme ø, så andre kan lande der i begyndelsen.',
            'Brug ? og regelbogen undervejs, når du møder noget nyt.'
        ],
        laesMere: 'Det er helt fint ikke at kende alle regler fra start. Spillet er lavet til at blive lært gennem ture.'
    }
];

const tutorialTrinEngelsk: Record<TutorialTrinId, Partial<TutorialTrin>> = {
    move: {
        titel: '1. Land',
        tekst: 'The tutorial island is 20 × 10 tiles. Tap a tile next to you to move.',
        popupTitel: 'Welcome, Apprentice',
        popupTekst: 'Here you can learn the most important parts of Fog Island without affecting saved games or the leaderboard.',
        popupPunkter: [
            'The map is 20 × 10 tiles. Larger islands are about 100 × 20.',
            'Tap a tile next to the Apprentice to move.',
            'The top holds focus, help, rulebook and sound. The bottom holds HP, gold, energy, digging and backpack.'
        ],
        laesMere: 'You do not need to remember everything now. The question mark and rulebook are built to help you later.'
    },
    help: {
        titel: '2. Use the question mark',
        tekst: 'Tap ? in the top right. Then tap a tile, icon or status to see an explanation.',
        popupTitel: 'Get help on screen',
        popupTekst: 'The question mark explains tiles, icons and status while you play.',
        popupPunkter: [
            'Tap ? in the top right to turn help on.',
            'Then tap a tile, HP, gold, energy, the dig button or an item.',
            'Tap ? again to return to the game.'
        ],
        laesMere: 'When you later meet unfamiliar tiles or new icons, ? is the first place to start.'
    },
    rulebook: {
        titel: '3. Open the rulebook',
        tekst: 'Tap the book icon at the top. You can always look up a rule here.',
        popupTitel: 'Use the rulebook when in doubt',
        popupTekst: 'It covers fog, boats, equipment, events, digging, score and characters.',
        popupPunkter: [
            'You do not need to read it from start to finish.',
            'Use it when you want to understand why something happened.',
            'Larger islands become easier to read once you know a few key rules.'
        ],
        laesMere: 'The tutorial shows only the essentials. The rulebook is where you can dig into the details.'
    },
    dig: {
        titel: '4. Dig something up',
        tekst: 'Go to the field on the route and tap the dig button at the bottom. A shovel costs less energy.',
        popupTitel: 'Something may be buried here',
        popupTekst: 'Some tiles hide gold, healing roots, traps or equipment. The dig button becomes active when you can dig on the tile.',
        popupPunkter: [
            'A shovel makes digging cheaper and less risky than digging with your hands.',
            'Digging uses energy. When energy runs out, the day advances.',
            'It is not always worth digging everything. The fog pushes you east.'
        ],
        laesMere: 'The rulebook has more about hidden traps, roots, shovels and special digging items.'
    },
    item: {
        titel: '5. Use the backpack',
        tekst: 'Tap your food ration at the bottom. Tap items in your backpack to use them.',
        popupTitel: 'The backpack is your toolbox',
        popupTekst: 'Some items are used directly, while others work automatically. The food ration works at once and is a good place to start.',
        popupPunkter: [
            'Tap food to gain HP and make the next move free.',
            'Some items work only in specific situations and turn grey when they cannot be used.',
            'Other items work automatically, for example equipment that changes damage, sight or energy.'
        ],
        laesMere: 'Use ? on an item to see when and how it works.'
    },
    shop: {
        titel: '6. Visit the market',
        tekst: 'Enter the market and buy an item. Spend gold on equipment or save it for your score.',
        popupTitel: 'Spend the gold – or bring it home',
        popupTekst: 'Markets and shops sell equipment. On a real island, you must choose between help now and more gold for your score.',
        popupPunkter: [
            'Select an item to buy it.',
            'Select one of your own items to sell it.',
            'Some goods are common, while rare relics are usually found in events.'
        ],
        laesMere: 'The rulebook explains shops, workshops, sale value and how gold counts in final score.'
    },
    event: {
        titel: '7. Try an event',
        tekst: 'Go to the prism on the route and choose an action. Another event is nearby if you want to try more.',
        popupTitel: 'Events give you a choice',
        popupTekst: 'An event puts you in a situation and lets you decide what to do. Some choices require certain equipment or carry a clear risk.',
        popupPunkter: [
            'The prism may have locked choices if you lack specific items.',
            'The tutorial event is calmer and shows the same basic idea with less risk.',
            'The right item can often open a better or safer solution.',
            'When the event ends, time normally advances.'
        ],
        laesMere: 'Later you can use the rulebook to understand requirements, weapon advantages, relics and linked events.'
    },
    boat: {
        titel: '8. Find the boat',
        tekst: 'Continue east to the escape boat. Board it to clear the island.',
        popupTitel: 'The goal is not to see everything',
        popupTekst: 'You do not need to explore everything. Survive long enough to reach an escape boat. On larger islands, the boats are usually to the east while the fog closes in from behind.',
        popupPunkter: [
            'You win by boarding a boat.',
            'Larger islands demand sharper route choices and a faster pace.',
            'It is often better to make it out than to clear the entire map.'
        ],
        laesMere: 'The rulebook has more about fog direction, when the boats arrive and how several players share the island.'
    },
    done: {
        titel: 'Tutorial complete',
        tekst: 'You tried the most important actions. Larger islands are more dangerous and about 100 × 20 tiles.',
        popupTitel: 'You are ready for a larger island',
        popupTekst: 'You moved, dug, used equipment, traded, faced an event and found the escape boat. You are ready for the fog.',
        popupPunkter: [
            'On the main menu you can write an island name or get a random one.',
            'The same island name gives the same island, so others can land in the same place at the start.',
            'Use ? and the rulebook whenever you encounter something new.'
        ],
        laesMere: 'You do not need to know every rule at first. The game is meant to be learned one journey at a time.'
    }
};

function oversaetTutorialTrin(trin: TutorialTrin) {
    const engelsk = tutorialTrinEngelsk[trin.id] || {};
    return {
        ...trin,
        titel: tekst(trin.titel, engelsk.titel || trin.titel),
        tekst: tekst(trin.tekst, engelsk.tekst || trin.tekst),
        popupTitel: tekst(trin.popupTitel, engelsk.popupTitel || trin.popupTitel),
        popupTekst: tekst(trin.popupTekst, engelsk.popupTekst || trin.popupTekst),
        popupPunkter: trin.popupPunkter?.map((punkt, index) => tekst(punkt, engelsk.popupPunkter?.[index] || punkt)),
        laesMere: trin.laesMere ? tekst(trin.laesMere, engelsk.laesMere || trin.laesMere) : undefined
    };
}

export const tutorialState = $state({
    aktiv: false,
    trin: 0,
    move: false,
    help: false,
    rulebook: false,
    dig: false,
    item: false,
    shop: false,
    event: false,
    boat: false
});

export function tutorialIndex(kolonne: number, raekke: number) {
    return raekke * TUTORIAL_BREDDE + kolonne;
}

export const TUTORIAL_START_INDEX = tutorialIndex(1, 5);

export function nulstilTutorialState(aktiv = true) {
    tutorialState.aktiv = aktiv;
    tutorialState.trin = 0;
    tutorialState.move = false;
    tutorialState.help = false;
    tutorialState.rulebook = false;
    tutorialState.dig = false;
    tutorialState.item = false;
    tutorialState.shop = false;
    tutorialState.event = false;
    tutorialState.boat = false;
}

export function stopTutorial() {
    nulstilTutorialState(false);
}

function erFuldført(id: TutorialTrinId) {
    if (id === 'done') return false;
    return tutorialState[id];
}

function opdaterTutorialTrin() {
    while (tutorialState.trin < tutorialTrin.length - 1 && erFuldført(tutorialTrin[tutorialState.trin].id)) {
        tutorialState.trin++;
    }
}

export function markerTutorialHandling(handling: TutorialHandling) {
    if (!tutorialState.aktiv) return;
    tutorialState[handling] = true;
    opdaterTutorialTrin();
}

export function hentAktueltTutorialTrin() {
    return oversaetTutorialTrin(tutorialTrin[Math.min(tutorialState.trin, tutorialTrin.length - 1)]);
}

function lavFelt(index: number, biome: Felt['biome'] = 'eng'): Felt {
    return {
        id: index,
        kolonne: index % TUTORIAL_BREDDE,
        raekke: Math.floor(index / TUTORIAL_BREDDE),
        guld: 0,
        gravet: false,
        udforsket: false,
        eventFuldført: false,
        biome,
        kanGraves: kanGravesIBiome(biome),
        skjultGuld: 0,
        skjultLiv: 0,
        skjultFaelde: false,
        skjultLoot: null,
        grundBiome: biome
    };
}

export function lavTutorialGitter(): Felt[] {
    const felter = Array.from({ length: TUTORIAL_BREDDE * TUTORIAL_HOEJDE }, (_, index) => lavFelt(index, 'eng'));

    const saetBiome = (kolonne: number, raekke: number, biome: Felt['biome']) => {
        const index = tutorialIndex(kolonne, raekke);
        felter[index] = { ...lavFelt(index, biome), id: felter[index].id };
        return felter[index];
    };

    for (let raekke = 0; raekke < TUTORIAL_HOEJDE; raekke++) {
        for (let kolonne = 0; kolonne < TUTORIAL_BREDDE; kolonne++) {
            const index = tutorialIndex(kolonne, raekke);
            const biomer: Felt['biome'][] = ['eng', 'mark', 'skov', 'hoejland', 'eng', 'skov'];
            const biome = biomer[(kolonne * 3 + raekke * 5) % biomer.length];
            felter[index] = lavFelt(index, biome);
        }
    }

    const vandFelter = new Set<string>();
    const tilfoejVand = (kolonne: number, raekke: number) => vandFelter.add(`${kolonne},${raekke}`);

    for (let k = 0; k < TUTORIAL_BREDDE; k++) {
        tilfoejVand(k, 0);
        tilfoejVand(k, TUTORIAL_HOEJDE - 1);
    }
    for (let r = 0; r < TUTORIAL_HOEJDE; r++) {
        tilfoejVand(0, r);
        tilfoejVand(TUTORIAL_BREDDE - 1, r);
    }

    [
        [1, 1], [2, 1], [17, 1], [18, 1],
        [1, 2], [18, 2], [2, 8], [3, 8],
        [16, 8], [17, 8], [18, 8], [1, 7],
        [18, 4], [18, 6], [14, 1], [15, 1],
        [4, 1], [5, 1]
    ].forEach(([kolonne, raekke]) => tilfoejVand(kolonne, raekke));

    for (const koordinat of vandFelter) {
        const [kolonne, raekke] = koordinat.split(',').map(Number);
        saetBiome(kolonne, raekke, 'hav');
    }

    const saetGravefelt = (kolonne: number, raekke: number, biome: Felt['biome'], skjultGuld = 0, skjultLiv = 0, skjultLoot: string | null = null) => {
        const felt = saetBiome(kolonne, raekke, biome);
        felt.skjultGuld = skjultGuld;
        felt.skjultLiv = skjultLiv;
        felt.skjultLoot = skjultLoot;
        return felt;
    };

    saetBiome(1, 5, 'eng');
    saetBiome(2, 5, 'eng');
    const graveFelt = saetBiome(3, 5, 'mark');
    graveFelt.skjultGuld = 70;

    saetGravefelt(4, 5, 'skov', 0, 18);

    const marked = saetBiome(5, 5, 'marked');
    marked.shopItems = ['skovl', 'mad', 'fakkel', 'kniv'];
    marked.shopBasisItems = ['skovl', 'mad', 'fakkel', 'kniv'];
    marked.shopGenopfyldtDag = 1;

    saetBiome(6, 5, 'hoejland');

    const kaerreFelt = saetBiome(7, 5, 'eng');
    kaerreFelt.eventID = 'vaeltet_vogn';
    kaerreFelt.grundEvent = 'vaeltet_vogn';

    saetGravefelt(8, 5, 'bjerg', 45);
    saetGravefelt(9, 5, 'krystal', 0, 0, 'diamant');
    const vaerksted = saetBiome(10, 5, 'by');
    vaerksted.hasWorkshop = true;
    saetGravefelt(11, 5, 'skov', 0, 20);
    saetBiome(12, 5, 'eng');
    saetGravefelt(13, 5, 'mark', 30);
    saetBiome(14, 5, 'hoejland');
    saetGravefelt(15, 5, 'skov', 0, 16);
    saetBiome(16, 5, 'eng');
    saetBiome(17, 5, 'eng');

    const baad = saetBiome(18, 5, 'hav');
    baad.hasBoat = true;
    baad.boatCount = 1;

    saetBiome(3, 3, 'soe');
    saetBiome(4, 4, 'soe');
    saetGravefelt(5, 3, 'skov', 0, 14);
    saetBiome(6, 3, 'bandit');
    saetGravefelt(8, 4, 'hule', 55);
    saetGravefelt(9, 4, 'bjerg', 35);

    const tutorialEventFelt = saetBiome(10, 4, 'ruin');
    tutorialEventFelt.eventID = 'tutorial_lejr';
    tutorialEventFelt.grundEvent = 'tutorial_lejr';

    saetBiome(11, 4, 'marked');
    saetBiome(12, 3, 'ritual');
    saetGravefelt(14, 3, 'krystal', 0, 0, 'diamant');
    saetBiome(16, 3, 'by');
    saetGravefelt(6, 6, 'skov', 0, 16);
    saetGravefelt(7, 6, 'slagmark', 60);
    saetBiome(10, 6, 'ritual');
    saetBiome(13, 6, 'blodskov');
    saetGravefelt(14, 7, 'bjerg', 40);
    saetBiome(15, 7, 'hule');
    saetBiome(3, 6, 'mark');
    saetBiome(4, 7, 'skov');
    saetBiome(12, 7, 'bandit');

    return felter;
}
