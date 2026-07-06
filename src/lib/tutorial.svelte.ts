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
        tekst: 'Du kom i gang og fik prøvet øens grundregler.'
    },
    {
        point: 500,
        titel: 'Begynder',
        tekst: 'Du fandt rytmen i bevægelse, energi og de første valg.'
    },
    {
        point: 1000,
        titel: 'Stifinder',
        tekst: 'Du brugte øen målrettet og kom hjem med en solid forståelse.'
    },
    {
        point: 1500,
        titel: 'Ø-kender',
        tekst: 'Du fik både udstyr, udforskning og tempo til at arbejde sammen.'
    },
    {
        point: 2000,
        titel: 'Tågevandrer',
        tekst: 'Du spiller tutorialen som en rigtig ekspedition.'
    }
];

const tutorialRangEngelsk = [
    {
        titel: 'Landlubber',
        tekst: 'You got started and tried the island basics.'
    },
    {
        titel: 'Beginner',
        tekst: 'You found the rhythm of movement, energy and the first choices.'
    },
    {
        titel: 'Pathfinder',
        tekst: 'You used the island with purpose and came home with solid understanding.'
    },
    {
        titel: 'Island-Knower',
        tekst: 'You got equipment, exploration and tempo working together.'
    },
    {
        titel: 'Fog Walker',
        tekst: 'You play the tutorial like a real expedition.'
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
    startMsg: 'En rolig øvelsestur.',
    startHp: 120,
    startGuld: 180,
    startUdstyr: ['skovl', 'mad', 'sovepose'],
    moveCost: 1,
    digCost: 2,
    dmgMod: 1,
    goldMod: 1,
    fordel: 'Balanceret øvelseskarakter med skovl, mad og lidt ekstra fejlmargin.',
    ulempe: 'Bruges kun på tutorial-øen og tæller ikke med i scores.',
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
        tekst: 'Tutorial-øen er 20 felter bred og 10 felter høj. Tryk på et nabofelt for at flytte.',
        popupTitel: 'Velkommen, Lærling',
        popupTekst: 'Her prøver du de vigtigste dele af Tågeøerne uden at påvirke rigtige øer, gemte spil eller highscores.',
        popupPunkter: [
            'Kortet er 20 felter bredt og 10 felter højt. Rigtige øer er cirka 100 x 20.',
            'Tryk på et felt lige ved siden af Lærling for at flytte.',
            'Øverst ligger fokus, spørgsmålstegn, regelbog og lyd. Nederst ligger HP, guld, energi, gravning og rygsæk.'
        ],
        laesMere: 'Du skal ikke huske alt nu. Spørgsmålstegnet og regelbogen er lavet til at hjælpe dig senere.'
    },
    {
        id: 'help',
        titel: '2. Brug spørgsmålstegnet',
        tekst: 'Tryk på ? øverst i højre hjørne og derefter på et felt, ikon eller statusfelt for at få en forklaring.',
        popupTitel: 'Få hjælp på selve skærmen',
        popupTekst: 'Spørgsmålstegnet er den hurtigste måde at forstå interface og felter på, mens du spiller.',
        popupPunkter: [
            'Tryk på ? øverst i højre hjørne for at slå forklaringsmode til.',
            'Tryk derefter på et felt, HP, guld, energi, graveknappen eller en genstand.',
            'Tryk på ? igen, når du vil tilbage til normal styring.'
        ],
        laesMere: 'Når du senere møder mærkelige felter eller nye ikoner, er ? det første sted at starte.'
    },
    {
        id: 'rulebook',
        titel: '3. Åbn regelbogen',
        tekst: 'Tryk på bog-ikonet øverst. Den er altid der, når du bliver i tvivl om reglerne.',
        popupTitel: 'Regelbogen er din reference',
        popupTekst: 'Regelbogen forklarer de større systemer: tåge, både, udstyr, events, gravning, score og karakterer.',
        popupPunkter: [
            'Du behøver ikke læse den fra start til slut.',
            'Brug den, når du vil forstå hvorfor noget skete.',
            'Den almindelige ø bliver meget lettere, når du kender få nøgleregler.'
        ],
        laesMere: 'Tutorialen viser kun det vigtigste. Regelbogen er dér, hvor du kan sætte dig mere ind i detaljerne.'
    },
    {
        id: 'dig',
        titel: '4. Grav efter noget',
        tekst: 'Gå til markfeltet på ruten og tryk på graveknappen i bunden. Skovlen gør det billigere.',
        popupTitel: 'Gravning afslører skjulte ting',
        popupTekst: 'Nogle felter gemmer guld, rødder, fælder eller loot. Graveknappen i bunden bliver aktiv, når feltet kan graves.',
        popupPunkter: [
            'Skovl gør gravning billigere og mindre risikabelt end at grave med hænderne.',
            'Gravning bruger energi. Når energien slipper op, går dagen videre.',
            'Det er ikke altid værd at grave alt. Tågen presser dig mod øst.'
        ],
        laesMere: 'Regelbogen har mere om skjulte fælder, rødder, skovle og særlige grave-genstande.'
    },
    {
        id: 'item',
        titel: '5. Brug rygsækken',
        tekst: 'Tryk på din madration i bunden. Genstande i rygsækken bruges ved at trykke på dem.',
        popupTitel: 'Rygsækken er din værktøjskasse',
        popupTekst: 'Genstande i bunden kan enten bruges med et klik eller give passive effekter. Madration er god at prøve, fordi den virker med det samme.',
        popupPunkter: [
            'Tryk på mad for at få HP og gøre næste bevægelse gratis.',
            'Nogle ting virker kun i bestemte situationer og bliver grå, når de ikke kan bruges.',
            'Andre ting virker automatisk, for eksempel udstyr der ændrer skade, syn eller energi.'
        ],
        laesMere: 'Brug ? på en genstand, hvis du vil vide om den er aktiv, passiv eller situationsbestemt.'
    },
    {
        id: 'shop',
        titel: '6. Besøg markedet',
        tekst: 'Gå ind på markedet og køb en vare. Guld bruges i butikker og tæller normalt med i score.',
        popupTitel: 'Butikker omsætter guld til muligheder',
        popupTekst: 'Når du går ind på et marked eller en butik, kan du købe udstyr. I rigtige spil skal du vurdere, om pengene er bedre brugt eller gemt til score.',
        popupPunkter: [
            'Klik på en vare for at købe den.',
            'Klik på egne genstande i butikken for at sælge dem.',
            'Nogle varer er almindelige, mens sjældne relikvier typisk findes i events.'
        ],
        laesMere: 'Regelbogen forklarer butikker, værksteder, salgsværdi og hvordan guld tæller med i slutscoren.'
    },
    {
        id: 'event',
        titel: '7. Prøv et event',
        tekst: 'Gå til prismet på ruten og vælg en handling. Der er også et ekstra tutorialevent tæt ved.',
        popupTitel: 'Events er øens små historier',
        popupTekst: 'Events giver valg. På tutorial-øen ligger der både prismet fra det rigtige eventbibliotek og et ekstra tutorialevent, så du kan se, at felter kan gemme forskellige situationer.',
        popupPunkter: [
            'Prismet kan have låste valg, hvis du mangler bestemte genstande.',
            'Tutorialeventet er mere roligt og viser samme grundidé uden så meget risiko.',
            'Et godt item kan ofte åbne en bedre eller mere sikker løsning.',
            'Når eventet er færdigt, går tiden normalt videre.'
        ],
        laesMere: 'Senere kan du bruge regelbogen til at forstå krav, våbenfordele, relikvier og særlige event-kæder.'
    },
    {
        id: 'boat',
        titel: '8. Find båden',
        tekst: 'Fortsæt mod øst til flugtbåden. Når du går ombord, er øen klaret.',
        popupTitel: 'Målet er ikke at se alt',
        popupTekst: 'Tågeøerne handler om at overleve længe nok til at nå en flugtbåd. På rigtige øer kommer bådene typisk mod øst, og tågen presser bagfra.',
        popupPunkter: [
            'Du vinder ved at gå ombord på en båd.',
            'Rigtige øer er større, så rutevalg og tempo betyder mere.',
            'Det er ofte bedre at nå frem end at rydde hele kortet.'
        ],
        laesMere: 'Regelbogen har mere om tågens retning, bådenes timing og hvordan flere spillere deler øen.'
    },
    {
        id: 'done',
        titel: 'Tutorial klaret',
        tekst: 'Du har prøvet de vigtigste knapper. Rigtige øer er større, farligere og cirka 100 x 20 felter.',
        popupTitel: 'Du er klar til en rigtig ø',
        popupTekst: 'Du har prøvet bevægelse, hjælp, regelbog, gravning, rygsæk, butik, event og flugtbåd.',
        popupPunkter: [
            'På startskærmen kan du skrive et ø-navn eller få et tilfældigt.',
            'Samme ø-navn giver samme ø, så andre kan lande samme sted i starten.',
            'Brug ? og regelbogen undervejs, når spillet begynder at åbne sig.'
        ],
        laesMere: 'Det er helt fint ikke at kende alle regler fra start. Spillet er lavet til at blive lært gennem ture.'
    }
];

const tutorialTrinEngelsk: Record<TutorialTrinId, Partial<TutorialTrin>> = {
    move: {
        titel: '1. Land',
        tekst: 'The tutorial island is 20 fields wide and 10 fields high. Tap a neighboring field to move.',
        popupTitel: 'Welcome, Apprentice',
        popupTekst: 'Here you try the most important parts of Fog Island without affecting real islands, saved games or highscores.',
        popupPunkter: [
            'The map is 20 fields wide and 10 fields high. Real islands are about 100 x 20.',
            'Tap a field right next to the Apprentice to move.',
            'The top holds focus, help, rulebook and sound. The bottom holds HP, gold, energy, digging and backpack.'
        ],
        laesMere: 'You do not need to remember everything now. The question mark and rulebook are built to help you later.'
    },
    help: {
        titel: '2. Use The Question Mark',
        tekst: 'Tap ? in the top right corner and then tap a field, icon or status field to get an explanation.',
        popupTitel: 'Get Help On The Screen',
        popupTekst: 'The question mark is the fastest way to understand the interface and fields while playing.',
        popupPunkter: [
            'Tap ? in the top right corner to turn explanation mode on.',
            'Then tap a field, HP, gold, energy, the dig button or an item.',
            'Tap ? again when you want normal control back.'
        ],
        laesMere: 'When you later meet strange fields or new icons, ? is the first place to start.'
    },
    rulebook: {
        titel: '3. Open The Rulebook',
        tekst: 'Tap the book icon at the top. It is always there when you are unsure about the rules.',
        popupTitel: 'The Rulebook Is Your Reference',
        popupTekst: 'The rulebook explains the larger systems: fog, boats, equipment, events, digging, score and characters.',
        popupPunkter: [
            'You do not need to read it from start to finish.',
            'Use it when you want to understand why something happened.',
            'The ordinary island becomes much easier once you know a few key rules.'
        ],
        laesMere: 'The tutorial shows only the essentials. The rulebook is where you can dig into the details.'
    },
    dig: {
        titel: '4. Dig Something Up',
        tekst: 'Go to the field field on the route and tap the dig button at the bottom. The shovel makes it cheaper.',
        popupTitel: 'Digging Reveals Hidden Things',
        popupTekst: 'Some fields hide gold, roots, traps or loot. The dig button at the bottom becomes active when the field can be dug.',
        popupPunkter: [
            'Shovel makes digging cheaper and less risky than digging with your hands.',
            'Digging uses energy. When energy runs out, the day advances.',
            'It is not always worth digging everything. The fog pushes you east.'
        ],
        laesMere: 'The rulebook has more about hidden traps, roots, shovels and special digging items.'
    },
    item: {
        titel: '5. Use The Backpack',
        tekst: 'Tap your food ration at the bottom. Items in your backpack are used by tapping them.',
        popupTitel: 'The Backpack Is Your Toolbox',
        popupTekst: 'Items at the bottom can either be used with a tap or give passive effects. Food ration is good to try because it works immediately.',
        popupPunkter: [
            'Tap food to gain HP and make the next move free.',
            'Some items work only in specific situations and turn grey when they cannot be used.',
            'Other items work automatically, for example equipment that changes damage, sight or energy.'
        ],
        laesMere: 'Use ? on an item if you want to know whether it is active, passive or situation-based.'
    },
    shop: {
        titel: '6. Visit The Market',
        tekst: 'Enter the market and buy an item. Gold is used in shops and normally counts toward score.',
        popupTitel: 'Shops Turn Gold Into Options',
        popupTekst: 'When you enter a market or shop, you can buy equipment. In real games you must judge whether money is better spent or kept for score.',
        popupPunkter: [
            'Click an item to buy it.',
            'Click your own items in the shop to sell them.',
            'Some goods are common, while rare relics are usually found in events.'
        ],
        laesMere: 'The rulebook explains shops, workshops, sale value and how gold counts in final score.'
    },
    event: {
        titel: '7. Try An Event',
        tekst: 'Go to the prism on the route and choose an action. There is also an extra tutorial event nearby.',
        popupTitel: 'Events Are The Island Stories',
        popupTekst: 'Events give choices. On the tutorial island there is both the prism from the real event library and an extra tutorial event, so you can see that fields can hide different situations.',
        popupPunkter: [
            'The prism may have locked choices if you lack specific items.',
            'The tutorial event is calmer and shows the same basic idea with less risk.',
            'A good item can often open a better or safer solution.',
            'When the event is finished, time normally advances.'
        ],
        laesMere: 'Later you can use the rulebook to understand requirements, weapon advantages, relics and special event chains.'
    },
    boat: {
        titel: '8. Find The Boat',
        tekst: 'Continue east to the escape boat. When you board, the island is cleared.',
        popupTitel: 'The Goal Is Not To See Everything',
        popupTekst: 'Fog Island is about surviving long enough to reach an escape boat. On real islands, boats usually come toward the east, and the fog presses from behind.',
        popupPunkter: [
            'You win by boarding a boat.',
            'Real islands are larger, so route choice and tempo matter more.',
            'It is often better to make it out than to clear the entire map.'
        ],
        laesMere: 'The rulebook has more about fog direction, boat timing and how several players share the island.'
    },
    done: {
        titel: 'Tutorial Complete',
        tekst: 'You tried the most important buttons. Real islands are larger, more dangerous and about 100 x 20 fields.',
        popupTitel: 'You Are Ready For A Real Island',
        popupTekst: 'You tried movement, help, rulebook, digging, backpack, shop, event and escape boat.',
        popupPunkter: [
            'On the main menu you can write an island name or get a random one.',
            'The same island name gives the same island, so others can land in the same place at the start.',
            'Use ? and the rulebook along the way when the game starts to open up.'
        ],
        laesMere: 'It is completely fine not to know every rule at first. The game is made to be learned through runs.'
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
