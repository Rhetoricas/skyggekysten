import { spilTilstand } from './spilTilstand.svelte';
import { bygOgHopGennemPortal, hentKortBredde, regnHexAfstand } from './spilmotor';
import { blodskovensHjerteEvents } from './event_blodskov';
import { naturkatastrofeEvents } from './event_naturkatastrofer';
import { metaEvents } from './event_meta';
import { vaabenEvents } from './event_vaaben';
import { specialItemEvents } from './event_specialitems';
import { tekst } from './i18n.svelte';
import type { Biome } from './types';

export interface Udfald {
    log: string; 
    logEn?: string;
    hpAendring?: number;
    maxHpAendring?: number; 
    guldAendring?: number;
    kollaps?: boolean;
    givItem?: string;         
    mistItem?: string;        
    naesteTrin?: string;      
}

export interface Valg {
    tekst: string;
    tekstEn?: string;
    kraeverItem?: string;     
    kraeverEtAfItems?: string[];
    kosterItem?: string;
    kosterEnergi?: number;    
    kraeverKarakter?: string; 
    gemtForKarakter?: string; 
    fordelItem?: string;      
    fordelKarakter?: string;  
    puljeVaerdi?: number;     
    naesteTrin?: string;      
    udfaldListe?: Udfald[];
    effekt?: () => {
        logBesked: string;
        logBeskedEn?: string;
        hpOp?: number;
        hpNed?: number;
        guldOp?: number;
        guldNed?: number;
        energiOp?: number;    
        energiTil?: number;
        energiNed?: number;   
        maxHpAendring?: number; 
        energisyn?: boolean;
        itemUd?: string;
        naesteEvent?: string;
    };
}

export interface SpilEvent {
    id: string;
    biome: Biome | Biome[] | 'alle' | 'any';
    titel: string;
    titelEn?: string;
    tekst: string;
    tekstEn?: string;
    billede?: string;         
    vaegt?: number;           
    kravDag?: number;         
    minKolonnePct?: number;
    maxKolonnePct?: number;
    unik?: boolean;           
    sfx?: string;             
    erSubTrin?: boolean;      
    valg: Valg[];
}

export function eventTitel(evt: SpilEvent | null | undefined) {
    return evt ? tekst(evt.titel, evt.titelEn || evt.titel) : '';
}

export function eventTekst(evt: SpilEvent | null | undefined) {
    return evt ? tekst(evt.tekst, evt.tekstEn || evt.tekst) : '';
}

export function valgTekst(valg: Valg | null | undefined) {
    return valg ? tekst(valg.tekst, valg.tekstEn || valg.tekst) : '';
}

export function udfaldLog(udfald: Udfald | null | undefined) {
    return udfald ? tekst(udfald.log, udfald.logEn || 'Your choice takes effect.') : '';
}

export function effektLog(resultat: { logBesked: string; logBeskedEn?: string } | null | undefined) {
    return resultat ? tekst(resultat.logBesked, resultat.logBeskedEn || 'Your choice takes effect.') : '';
}

function retningTilFelt(fraIndex: number, tilIndex: number) {
    const bredde = hentKortBredde();
    const fraKolonne = fraIndex % bredde;
    const fraRaekke = Math.floor(fraIndex / bredde);
    const tilKolonne = tilIndex % bredde;
    const tilRaekke = Math.floor(tilIndex / bredde);
    const lodret = tilRaekke < fraRaekke ? tekst('nord', 'north') : tilRaekke > fraRaekke ? tekst('syd', 'south') : '';
    const vandret = tilKolonne > fraKolonne ? tekst('øst', 'east') : tilKolonne < fraKolonne ? tekst('vest', 'west') : '';

    if (lodret && vandret) return tekst(`${lodret}${vandret}`, `${lodret}-${vandret}`);
    return lodret || vandret || tekst('her', 'here');
}

function afslorNaermesteGuldminer(antal: number) {
    const start = spilTilstand.spillerIndex;
    const bredde = hentKortBredde();
    const spillerKolonne = start % bredde;
    const kendte = new Set(spilTilstand.mineKendteFelter || []);
    const miner = spilTilstand.gitter
        .map((felt, index) => ({ felt, index }))
        .filter(({ felt, index }) => felt.hasGoldmine && index % bredde >= spillerKolonne)
        .sort((a, b) => regnHexAfstand(start, a.index, bredde) - regnHexAfstand(start, b.index, bredde))
        .slice(0, antal);

    if (miner.length === 0) {
        return tekst(
            'Dværgen lukker øjnene og mærker efter et øjeblik. "Længere fremme er der ingen guldmine, jeg tør love dig," siger han.',
            'The dwarf closes his eyes and listens for a moment. "Farther ahead, there is no gold mine I can promise you," he says.'
        );
    }

    for (const mine of miner) kendte.add(mine.index);
    spilTilstand.mineKendteFelter = Array.from(kendte);

    const retninger = miner.map((mine) => {
        const afstand = regnHexAfstand(start, mine.index, bredde);
        return `${retningTilFelt(start, mine.index)} (${tekst('afstand i felter', 'distance in tiles')}: ${afstand})`;
    });

    return miner.length === 1
        ? tekst(
            `Dværgen tegner et kort i jorden med en blodig finger. Han markerer en guldmine ${retninger[0]}.`,
            `The dwarf draws a map in the dirt with a bloody finger. He marks a gold mine ${retninger[0]}.`
        )
        : tekst(
            `Dværgen nævner to gamle minenavne og markerer dem på kortet: ${retninger.join(' og ')}.`,
            `The dwarf names two old mines and marks them on the map: ${retninger.join(' and ')}.`
        );
}

function alkymistForsog() {
    if (Math.random() < 0.5) {
        return {
            logBesked: 'Alkymisten hælder guldet i maskinen. Rørene summer, og en gylden dråbe får kredsløbet til at tænde. Med rystende hænder skubber han destillatoren over til dig.',
            logBeskedEn: 'The alchemist pours the gold into the machine. The pipes hum, and a golden drop brings the circuit to life. With shaking hands, he pushes the distiller toward you.',
            itemUd: 'gylden_destillator'
        };
    }

    return {
        logBesked: 'Maskinen hoster, sprutter og går i stå. Alkymisten samler det meste af guldet op igen og undskylder uden at møde dit blik.',
        logBeskedEn: 'The machine coughs, sputters and stops. The alchemist recovers most of the gold and apologizes without meeting your eyes.',
        guldOp: 40
    };
}

export const eventBibliotek: Record<string, SpilEvent> = {
    ...blodskovensHjerteEvents,
    ...naturkatastrofeEvents,
    ...metaEvents,
    ...vaabenEvents,
    ...specialItemEvents,

    'tutorial_lejr': {
        id: 'tutorial_lejr',
        titel: 'Den forladte lejr',
        titelEn: 'The Abandoned Camp',
        tekst: 'En lille lejr ligger mellem sammenstyrtede sten. Her kan du afprøve valg og konsekvenser, uden at øvelsen bliver farlig.',
        tekstEn: 'A small camp lies among collapsed stones. Here you can try out choices and consequences without putting yourself in danger during the tutorial.',
        biome: 'ruin',
        billede: '/events/event.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Undersøg tasken',
                tekstEn: 'Search the bag',
                udfaldListe: [
                    {
                        log: 'I tasken ligger en tør fakkel. Du pakker den ned.',
                        logEn: 'Inside the bag, you find a dry torch and pack it away.',
                        givItem: 'fakkel'
                    }
                ]
            },
            {
                tekst: 'Led efter mønter',
                tekstEn: 'Look for coins',
                udfaldListe: [
                    {
                        log: 'Under en løs sten finder du en lille pung med mønter.',
                        logEn: 'Under a loose stone, you find a small coin pouch.',
                        guldAendring: 60
                    }
                ]
            }
        ]
    },

    'den_toerstige_alkymist': {
        id: 'den_toerstige_alkymist',
        titel: 'Den tørstige alkymist',
        titelEn: 'The Thirsty Alchemist',
        tekst: 'Ved en udtørret brønd står en alkymist med en høj maskine af gyldne rør og glas. Han påstår, at den kan trække metal ud af jorden, men kredsløbet kræver noget levende for at starte.',
        tekstEn: 'Beside a dry well stands an alchemist with a tall machine of golden pipes and glass. He claims it can draw metal from the soil, but the circuit needs something living to start.',
        biome: ['ruin', 'hule', 'bjerg', 'marked'],
        billede: '/events/ev_ruin.webp',
        unik: true,
        valg: [
            {
                tekst: 'Brug en livseliksir',
                tekstEn: 'Use a life elixir',
                kosterItem: 'livseliksir',
                udfaldListe: [
                    {
                        log: 'Eliksiren lyser i rørene, og maskinen går i gang. Alkymisten ler lettet og giver dig den gyldne destillator.',
                        logEn: 'The elixir glows in the pipes, and the machine starts. The alchemist laughs with relief and gives you the golden distiller.',
                        givItem: 'gylden_destillator'
                    }
                ]
            },
            {
                tekst: 'Betal 100 guld for et forsøg',
                tekstEn: 'Pay 100 gold for one attempt',
                puljeVaerdi: 100,
                effekt: () => alkymistForsog()
            },
            {
                tekst: 'Kalibrer med metaldetektoren',
                tekstEn: 'Calibrate with the metal detector',
                kraeverItem: 'metaldetektor',
                effekt: () => ({
                    logBesked: 'Metaldetektoren finder den rette frekvens i rørene. Maskinen spytter mønter ud, og alkymisten deler udbyttet med dig.',
                    logBeskedEn: 'The metal detector finds the right frequency in the pipes. The machine spits out coins, and the alchemist shares the yield with you.',
                    guldOp: 120
                })
            },
            {
                tekst: 'Gå videre',
                tekstEn: 'Move on',
                effekt: () => ({
                    logBesked: 'Du går videre og lader alkymisten stå ved den tørre brønd. Maskinen tikker bag dig.',
                    logBeskedEn: 'You move on and leave the alchemist beside the dry well. The machine ticks behind you.'
                })
            }
        ]
    },

    'traeet_med_den_aabne_puls': {
        id: 'traeet_med_den_aabne_puls',
        titel: 'Pulsen i træet',
        titelEn: 'The Pulse in the Tree',
        tekst: 'Stammen på et gammelt træ er revnet. Inde i træet banker en grøn kerne med en rolig puls. Rødderne trækker sig væk fra dine fødder, da du nærmer dig.',
        tekstEn: 'The trunk of an old tree has split open. Inside, a green core beats with a steady pulse. The roots pull away from your feet as you approach.',
        biome: ['skov', 'blodskov', 'eng'],
        billede: '/events/ev_skov.webp',
        unik: true,
        valg: [
            {
                tekst: 'Giv træet en madration',
                tekstEn: 'Give the tree a food ration',
                kosterItem: 'mad',
                udfaldListe: [
                    {
                        log: 'Rødderne trækker maden ned i jorden. Stammen åbner sig lidt mere, og den grønne kerne falder tungt ned i dine hænder.',
                        logEn: 'The roots pull the food into the ground. The trunk opens a little farther, and the green core drops heavily into your hands.',
                        givItem: 'rodhjertet'
                    }
                ]
            },
            {
                tekst: 'Brug søgekvisten',
                tekstEn: 'Use the seeker twig',
                kosterItem: 'soegekvist',
                udfaldListe: [
                    {
                        log: 'Kvisten finder pulsen og knækker med et skarpt smæld. Træet lukker sig, men Rodhjertet ligger tilbage i græsset.',
                        logEn: 'The twig finds the pulse and snaps with a sharp crack. The tree closes, but the Root Heart remains in the grass.',
                        givItem: 'rodhjertet'
                    }
                ]
            },
            {
                tekst: 'Skær hjertet fri',
                tekstEn: 'Cut the heart free',
                kraeverItem: 'kniv',
                effekt: () => ({
                    logBesked: 'Du skærer hjertet fri, men en rod snor sig om dit håndled og flår huden op. Du slipper væk med Rodhjertet.',
                    logBeskedEn: 'You cut the heart free, but a root coils around your wrist and tears your skin. You escape with the Root Heart.',
                    hpNed: 15,
                    itemUd: 'rodhjertet'
                })
            },
            {
                tekst: 'Lad træet være',
                tekstEn: 'Leave the tree alone',
                effekt: () => ({
                    logBesked: 'Du lægger hånden mod stammen og træder tilbage. Varmen fra træet dæmper smerten i kroppen.',
                    logBeskedEn: 'You place a hand against the trunk and step back. The tree’s warmth eases the pain in your body.',
                    hpOp: 20
                })
            }
        ]
    },

    'campfire': {
        id: 'campfire',
        titel: "Lejren ved bålet",
        titelEn: "The Campfire",
        tekst: "En gruppe rejsende sidder tæt omkring et bål og følger dig med øjnene. Deres leder nikker mod en ledig plads i udkanten af lyset.",
        tekstEn: "A group of travelers sits close around a fire and watches you approach. Their leader nods toward an open place at the edge of the light.",
        biome: ['eng', 'skov', 'mark', 'bjerg', 'hoejland'],
        billede: '/events/ev_campfire.webp', 
        unik: false,
        valg: [
            {
                tekst: "Betal 10 guld for varmen",
                tekstEn: "Pay 10 gold for warmth",
                puljeVaerdi: 10,
                udfaldListe: [
                    { log: "De gør plads ved bålet. Varmen løsner kroppen, og du får sovet ordentligt.", logEn: "They make room by the fire. The warmth eases your body, and you get a proper night’s sleep.", hpAendring: 50 }
                ]
            },
            {
                tekst: "Del din livseliksir",
                tekstEn: "Share your life elixir",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { 
                        log: "Du deler eliksiren med de rejsende. De betaler dig og holder vagt, mens du sover.",
                        logEn: "You share the elixir with the travelers. They pay you and keep watch while you sleep.",
                        hpAendring: 100, 
                        maxHpAendring: 10,
                        guldAendring: 50 
                    }
                ]
            },
            {
                tekst: "Sov i udkanten af lejren",
                tekstEn: "Sleep at the edge of camp",
                udfaldListe: [{ log: "Du sover uroligt i det kolde græs, men får i det mindste hvilet benene.", logEn: "You sleep uneasily in the cold grass, but at least your legs get some rest.", hpAendring: 20 }]
            }
        ]
    },

    'kikkerten_i_messing': {
        id: 'kikkerten_i_messing',
        titel: "Messingkikkerten",
        titelEn: "The Brass Spyglass",
        biome: ['ruin', 'bjerg', 'by'],
        unik: true,
        billede: '/events/ev_kikkert.webp',
        tekst: "En tung messingkikkert er boltet fast i en sten. Da du rører den, låser en mekanisme sig om dit håndled. En indgravering siger, at du må vælge en linse for at komme fri.",
        tekstEn: "A heavy brass spyglass is bolted to a stone. When you touch it, a mechanism locks around your wrist. An engraving says you must choose a lens to break free.",
        valg: [
            { 
                tekst: "Se gennem okularet",
                tekstEn: "Look through the eyepiece",
                effekt: () => {
                    return { 
                        logBesked: "Synet strækker sig ud over landskabet. Hele øen virker pludselig længere væk.",
                        logBeskedEn: "Your view stretches across the landscape. The entire island suddenly seems farther away.",
                        hpNed: 5,
                        itemUd: 'kikkert_45'
                    };
                } 
            },
            { 
                tekst: "Se gennem objektivet",
                tekstEn: "Look through the objective lens",
                effekt: () => {
                    return { 
                        logBesked: "Landskabet rykker brat tættere på. Selv de fjerne klipper virker lige foran dig.",
                        logBeskedEn: "The landscape rushes closer. Even the distant cliffs seem to be right in front of you.",
                        hpNed: 5,
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            { 
                tekst: "Lirk fjedrene løs med kniven",
                tekstEn: "Pry the springs loose with the knife",
                kraeverItem: 'kniv', 
                effekt: () => {
                    return { 
                        logBesked: "Kniven løsner grebet. I samme øjeblik drejer mekanismen kikkerten og presser objektivet mod dit øje.",
                        logBeskedEn: "The knife loosens the grip. At the same moment, the mechanism turns the spyglass and presses the objective lens to your eye.",
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            {
                tekst: "Opløs mekanismen med eliksiren",
                tekstEn: "Dissolve the mechanism with the elixir",
                kosterItem: 'livseliksir',
                effekt: () => {
                    return { 
                        logBesked: "Eliksiren ætser gennem messingrøret, og mekanismen falder fra hinanden. Begge linser viser sig at være diamanter.",
                        logBeskedEn: "The elixir eats through the brass tube, and the mechanism falls apart. Both lenses turn out to be diamonds.",
                        itemUd: 'diamant, diamant' 
                    };
                }
            }
        ]
    },

    'spraekken_i_luften': {
        id: 'spraekken_i_luften',
        titel: "Flimmeret",
        titelEn: "The Shimmer",
        biome: ['ritual', 'blodskov', 'eng'],
        unik: false,
        billede: '/events/ev_portal.webp',
        tekst: "Luften flimrer lavt over jorden. En smal revne skærer gennem synsfeltet, og græsset omkring den er svedet sort.",
        tekstEn: "The air shimmers low above the ground. A narrow crack cuts across your vision, and the grass around it is scorched black.",
        valg: [
            { 
                tekst: "Træd ind i flimmeret", 
                tekstEn: "Step into the shimmer",
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Flimmeret samler sig omkring dig og åbner en portal. Du bliver slynget mod øst.", logBeskedEn: "The shimmer closes around you and opens a portal. You are thrown eastward." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen lukker sig brat. Et par mønter ligger tilbage i det svedne græs.", logBeskedEn: "The crack snaps shut. A few coins remain in the scorched grass.", guldOp: guld };
                    } else {
                        return { logBesked: "Flimmeret slipper dig midt i springet, og du rammer jorden hårdt.", logBeskedEn: "The shimmer releases you mid-jump, and you hit the ground hard.", hpNed: 8 };
                    }
                } 
            },
            { 
                tekst: "Stik sværdet ind i flimmeret",
                tekstEn: "Push the sword into the shimmer",
                kraeverItem: 'svaerd', 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Flimmeret fæstner sig omkring klingen og åbner en portal. Du ryger igennem.", logBeskedEn: "The shimmer anchors around the blade and opens a portal. You tumble through." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen ryster, og et par mønter falder ud ved dine fødder.", logBeskedEn: "The crack shudders, and a few coins fall out at your feet.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen lukker sig omkring klingen og forsvinder. Sværdet har ikke taget skade.", logBeskedEn: "The crack closes around the blade and vanishes. The sword is unharmed." };
                    }
                } 
            },
            { 
                tekst: "Kast 20 guld ind i revnen", 
                tekstEn: "Throw 20 gold into the crack",
                puljeVaerdi: 20,
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Mønterne forsvinder i revnen. Et øjeblik senere åbner den sig som en portal mod øst.", logBeskedEn: "The coins vanish into the crack. A moment later, it opens into a portal leading east." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 51) + 100; 
                        return { logBesked: "Revnen åbner sig et øjeblik og spytter mere guld ud, end du kastede ind.", logBeskedEn: "The crack opens for a moment and spits out more gold than you threw in.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen sluger guldet og lukker sig med et tørt smæld.", logBeskedEn: "The crack swallows the gold and closes with a dry snap." };
                    }
                } 
            },
            {
                tekst: "Hold afstand",
                tekstEn: "Keep your distance",
                effekt: () => {
                    return { logBesked: "Du holder afstand til revnen og fortsætter til fods.", logBeskedEn: "You keep your distance from the crack and continue on foot." };
                }
            }
        ]
    },

    'den_vilde_kilde': {
        id: 'den_vilde_kilde',
        titel: "Kogende jord",
        titelEn: "Boiling Earth",
        biome: ['bjerg', 'skov', 'hoejland'],
        unik: false,
        billede: '/events/ev_kilde.webp',
        tekst: "En lille gejser bryder gennem jorden. Dampen sitrer over stenene og føles ladet med energi. Gennem disen virker stierne omkring dig usædvanligt tydelige.",
        tekstEn: "A small geyser bursts through the ground. The steam shimmers above the rocks and feels charged with energy. Through the haze, the paths around you look unusually clear.",
        valg: [
            { 
                tekst: "Indånd dampen",
                tekstEn: "Breathe in the steam",
                effekt: () => {
                    return { 
                        logBesked: "Dampen svier i brystet, men fylder dig med energi. Terrænets energiforbrug står nu tydeligt for dig.",
                        logBeskedEn: "The steam burns in your chest but fills you with energy. You can now clearly read the terrain’s energy cost.",
                        hpNed: 10,
                        energiTil: 9,
                        energisyn: true
                    };
                } 
            },
            { 
                tekst: "Filtrér dampen gennem tøjet",
                tekstEn: "Filter the steam through your clothes",
                kosterItem: 'alle_toej', 
                effekt: () => {
                    return { 
                        logBesked: "Tøjet tager det værste af varmen. Du får ny energi, og terrænets energiforbrug står tydeligt for dig.",
                        logBeskedEn: "The cloth absorbs the worst of the heat. You gain new energy, and the terrain’s energy cost becomes clear to you.",
                        energiTil: 9,
                        energisyn: true
                    };
                } 
            },
            { 
                tekst: "Drik af pølen",
                tekstEn: "Drink from the pool",
                effekt: () => {
                    return { 
                        logBesked: "Vandet smager af metal og brænder gennem kroppen. Du får energi og kan aflæse terrænet, men varmen efterlader varige skader.",
                        logBeskedEn: "The water tastes of metal and burns through your body. You gain energy and can read the terrain, but the heat leaves lasting damage.",
                        energiTil: 9,
                        maxHpAendring: -2,
                        energisyn: true
                    };
                } 
            },
            {
                tekst: "Gå uden om gejseren",
                tekstEn: "Walk around the geyser",
                effekt: () => {
                    return { logBesked: "Du går uden om gejseren og holder afstand til den varme damp.", logBeskedEn: "You walk around the geyser and keep away from the hot steam." };
                }
            }
        ]
    },

    'dvaergens_sidste_aare': {
        id: 'dvaergens_sidste_aare',
        titel: "Dværgens sidste mine",
        titelEn: "The Dwarf's Last Mine",
        biome: ['bjerg', 'hule', 'ruin'],
        unik: true,
        billede: '/events/ev_lig.webp',
        tekst: "En dværg ligger klemt mellem to sprængte sten. En skarp malmkant har flænset hans mave, og skægget er stift af støv og blod. Han holder stadig fast i en lille sort notesbog. \"Jeg skjulte minerne for længe,\" hoster han. \"Nu må en anden bære kortet videre.\"",
        tekstEn: "A dwarf lies pinned between two blasted rocks. A sharp edge of ore has torn open his belly, and his beard is stiff with dust and blood. He still clutches a small black notebook. \"I hid the mines for too long,\" he coughs. \"Now someone else must carry the map onward.\"",
        valg: [
            {
                tekst: "Spørg efter den nærmeste mine",
                tekstEn: "Ask about the nearest mine",
                effekt: () => {
                    const logBesked = afslorNaermesteGuldminer(1);
                    return {
                        logBesked,
                        logBeskedEn: logBesked
                    };
                }
            },
            {
                tekst: "Giv ham mad og hør resten",
                tekstEn: "Give him food and hear the rest",
                kosterItem: 'mad',
                effekt: () => {
                    const logBesked = `${afslorNaermesteGuldminer(2)} ${tekst('Maden giver ham kræfter til en sidste advarsel: Gentag ikke hans fejl. Gå ikke mod vest.', 'The food gives him strength for one final warning: do not repeat his mistake. Do not head west.')}`;
                    return {
                        logBesked,
                        logBeskedEn: logBesked
                    };
                }
            },
            {
                tekst: "Giv ham en livseliksir",
                tekstEn: "Give him a life elixir",
                kosterItem: 'livseliksir',
                effekt: () => {
                    const logBesked = `${afslorNaermesteGuldminer(2)} ${tekst('Eliksiren kan ikke lukke såret, men hans blik bliver klart et øjeblik. Han presser notesbogen i din hånd og beder dig bruge guldet bedre, end han selv gjorde.', 'The elixir cannot close the wound, but his eyes clear for a moment. He presses the notebook into your hand and asks you to use the gold better than he did.')}`;
                    return {
                        logBesked,
                        logBeskedEn: logBesked,
                        maxHpAendring: 5
                    };
                }
            },
            {
                tekst: "Tag notesbogen",
                tekstEn: "Take the notebook",
                effekt: () => {
                    return {
                        logBesked: "Du river notesbogen ud af hånden på ham. Siderne er fyldt med koder og blodpletter. Dværgen bider tænderne sammen og nægter at hjælpe dig.",
                        logBeskedEn: "You tear the notebook from his hand. The pages are filled with codes and bloodstains. The dwarf grits his teeth and refuses to help you.",
                        hpNed: 4
                    };
                }
            }
        ]
    },

    'det_glemte_lig': {
        id: 'det_glemte_lig',
        titel: "Koldt mudder",
        titelEn: "Cold Mud",
        biome: ['slagmark', 'mark', 'eng'],
        unik: false,
        billede: '/events/ev_lig.webp',
        tekst: "Et lig ligger halvt begravet i mudderet. Tøjet er allerede gennemrodet, men der kan stadig ligge noget under kroppen.",
        tekstEn: "A body lies half-buried in the mud. Its clothes have already been searched, but something may still be trapped underneath.",
        valg: [
            { 
                tekst: "Grav med hænderne",
                tekstEn: "Dig with your hands",
                kosterEnergi: 2,
                effekt: () => {
                    if (Math.random() < 0.50) {
                        const guld = Math.floor(Math.random() * 31) + 20;
                        return { logBesked: "Fingrene rammer en tung pung under overfladen. Du trækker den fri af mudderet.", logBeskedEn: "Your fingers find a heavy purse below the surface. You pull it free of the mud.", guldOp: guld };
                    } else {
                        return { logBesked: "Du finder kun koldt mudder. Alt af værdi er allerede væk.", logBeskedEn: "You find nothing but cold mud. Anything valuable is already gone." };
                    }
                } 
            },
            { 
                tekst: "Grav med skovlen",
                tekstEn: "Dig with the shovel",
                kraeverItem: 'skovl', 
                effekt: () => {
                    if (Math.random() < 0.50) {
                        const guld = Math.floor(Math.random() * 31) + 20;
                        return { logBesked: "Ved ligets støvler finder du en håndfuld mønter i mudderet.", logBeskedEn: "By the body’s boots, you find a handful of coins in the mud.", guldOp: guld };
                    } else {
                        return { logBesked: "Du skovler mudderet væk, men finder intet af værdi.", logBeskedEn: "You shovel the mud away but find nothing of value.", };
                    }
                } 
            },
            { 
                tekst: "Vend liget med foden",
                tekstEn: "Turn the body with your foot",
                effekt: () => {
                    const guld = Math.floor(Math.random() * 31) + 20;
                    return { 
                        logBesked: "En rådden stank stiger op fra mudderet og slår dig tilbage. Samtidig falder en pung fri af ligets frakke.",
                        logBeskedEn: "A rotten stench rises from the mud and makes you recoil. At the same time, a purse falls from the body’s coat.",
                        hpNed: 6,
                        guldOp: guld
                    };
                } 
            },
            {
                tekst: "Lad kroppen ligge",
                tekstEn: "Leave the body alone",
                effekt: () => {
                    return { logBesked: "Du lader kroppen ligge og går videre.", logBeskedEn: "You leave the body and move on." };
                }
            }
        ]
    },
};
