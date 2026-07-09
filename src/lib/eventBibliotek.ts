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
            'Dværgen lukker øjnene og snuser efter malm. "Ikke bagud," hvisker han. "Fremad er der intet guld, jeg tør love dig."',
            'The dwarf closes his eyes and sniffs for ore. "Not behind you," he whispers. "Ahead, there is no gold I dare promise you."'
        );
    }

    for (const mine of miner) kendte.add(mine.index);
    spilTilstand.mineKendteFelter = Array.from(kendte);

    const retninger = miner.map((mine) => {
        const afstand = regnHexAfstand(start, mine.index, bredde);
        return `${retningTilFelt(start, mine.index)} (${afstand} ${tekst('felter', 'tiles')})`;
    });

    return miner.length === 1
        ? tekst(
            `Dværgen kradser et kort i jorden med en blodig finger. En guldmine bliver tydelig ${retninger[0]}.`,
            `The dwarf scratches a map into the dirt with a bloody finger. A gold mine becomes clear ${retninger[0]}.`
        )
        : tekst(
            `Dværgen hvisker to gamle mine-navne og ridser dem ind i din hukommelse. Guldminer bliver tydelige: ${retninger.join(' og ')}.`,
            `The dwarf whispers two old mine names and carves them into your memory. Gold mines become clear: ${retninger.join(' and ')}.`
        );
}

function alkymistForsog() {
    if (Math.random() < 0.5) {
        return {
            logBesked: 'Alkymisten hælder guldet i maskinen. Rørene synger, og en ren gylden dråbe lukker kredsløbet. Han skubber destillatoren over til dig med rystende hænder.',
            logBeskedEn: 'The alchemist pours the gold into the machine. The pipes sing, and a pure golden drop closes the circuit. He pushes the distiller over to you with shaking hands.',
            itemUd: 'gylden_destillator'
        };
    }

    return {
        logBesked: 'Maskinen hoster, sprutter og dør med et lille suk. Alkymisten fisker det meste af guldet op igen og undskylder uden at møde dit blik.',
        logBeskedEn: 'The machine coughs, sputters and dies with a small sigh. The alchemist fishes most of the gold back out and apologizes without meeting your eye.',
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
        titel: 'Den Forladte Lejr',
        titelEn: 'The Abandoned Camp',
        tekst: 'En lille lejr ligger mellem sammenstyrtede sten. Her kan du prøve, hvordan events giver valg og konsekvenser uden at tutorialen bliver farlig.',
        tekstEn: 'A small camp lies between collapsed stones. Here you can try how events give choices and consequences without making the tutorial dangerous.',
        biome: 'ruin',
        billede: '/events/event.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Undersøg tasken ved bålet.',
                tekstEn: 'Search the bag by the fire.',
                udfaldListe: [
                    {
                        log: 'Du finder en tør fakkel og pakker den roligt ned.',
                        logEn: 'You find a dry torch and calmly pack it away.',
                        givItem: 'fakkel'
                    }
                ]
            },
            {
                tekst: 'Led efter mønter mellem stenene.',
                tekstEn: 'Look for coins between the stones.',
                udfaldListe: [
                    {
                        log: 'Du får fingrene under en løs sten og finder en lille pung.',
                        logEn: 'You get your fingers under a loose stone and find a small purse.',
                        guldAendring: 60
                    }
                ]
            }
        ]
    },

    'den_toerstige_alkymist': {
        id: 'den_toerstige_alkymist',
        titel: 'Den Tørstige Alkymist',
        titelEn: 'The Thirsty Alchemist',
        tekst: 'Ved en tør brønd står en alkymist med en høj, gylden maskine af rør og glas. Den kan destillere metal ud af jord, påstår han, men kredsløbet mangler noget levende at starte på.',
        tekstEn: 'By a dry well stands an alchemist with a tall golden machine of pipes and glass. It can distill metal from soil, he claims, but the circuit needs something living to begin.',
        biome: ['ruin', 'hule', 'bjerg', 'marked'],
        billede: '/events/ev_ruin.webp',
        unik: true,
        valg: [
            {
                tekst: 'Giv ham en livseliksir til kredsløbet.',
                tekstEn: 'Give him a life elixir for the circuit.',
                kosterItem: 'livseliksir',
                udfaldListe: [
                    {
                        log: 'Eliksiren lyser gennem rørene. Maskinen vågner, og alkymisten ler, som om han lige har hørt jorden tale. Han giver dig den gyldne destillator.',
                        logEn: 'The elixir glows through the pipes. The machine wakes, and the alchemist laughs as if he just heard the earth speak. He gives you the golden distiller.',
                        givItem: 'gylden_destillator'
                    }
                ]
            },
            {
                tekst: 'Betal 100 guld for et forsøg.',
                tekstEn: 'Pay 100 gold for an attempt.',
                puljeVaerdi: 100,
                effekt: () => alkymistForsog()
            },
            {
                tekst: 'Kalibrer maskinen med metaldetektoren.',
                tekstEn: 'Calibrate the machine with the metal detector.',
                kraeverItem: 'metaldetektor',
                effekt: () => ({
                    logBesked: 'Detektoren finder den rette tone i rørene. Alkymisten får maskinen til at spytte mønter ud og deler udbyttet med dig.',
                    logBeskedEn: 'The detector finds the right tone in the pipes. The alchemist makes the machine spit out coins and shares the yield with you.',
                    guldOp: 120
                })
            },
            {
                tekst: 'Lad ham tørste videre.',
                tekstEn: 'Let him keep thirsting.',
                effekt: () => ({
                    logBesked: 'Du lader alkymisten stå ved sin tørre brønd. Maskinen tikker fornærmet bag dig.',
                    logBeskedEn: 'You leave the alchemist at his dry well. The machine ticks in offended little beats behind you.'
                })
            }
        ]
    },

    'traeet_med_den_aabne_puls': {
        id: 'traeet_med_den_aabne_puls',
        titel: 'Træet Med Den Åbne Puls',
        titelEn: 'The Tree With the Open Pulse',
        tekst: 'Et gammelt træ står med stammen revnet op. Indeni slår noget grønt og levende, som om skoven har et hjerte. Rødderne omkring dig flytter sig væk fra dine fødder.',
        tekstEn: 'An old tree stands with its trunk split open. Inside beats something green and living, as if the forest has a heart. The roots around you move away from your feet.',
        biome: ['skov', 'blodskov', 'eng'],
        billede: '/events/ev_skov.webp',
        unik: true,
        valg: [
            {
                tekst: 'Giv træet en madration.',
                tekstEn: 'Give the tree a food ration.',
                kosterItem: 'mad',
                udfaldListe: [
                    {
                        log: 'Træet åbner sig uden smerte. Maden forsvinder mellem rødderne, og hjertet falder ned i dine hænder som en tung grøn frugt.',
                        logEn: 'The tree opens without pain. The food vanishes between the roots, and the heart falls into your hands like a heavy green fruit.',
                        givItem: 'rodhjertet'
                    }
                ]
            },
            {
                tekst: 'Før søgekvisten ind i revnen.',
                tekstEn: 'Slide the seeker twig into the crack.',
                kosterItem: 'soegekvist',
                udfaldListe: [
                    {
                        log: 'Kvisten finder pulsen og knækker med et lykkeligt smæld. Da træet lukker sig, ligger Rodhjertet tilbage i græsset.',
                        logEn: 'The twig finds the pulse and snaps with a happy crack. When the tree closes, the Rootheart lies back in the grass.',
                        givItem: 'rodhjertet'
                    }
                ]
            },
            {
                tekst: 'Skær hjertet fri med kniven.',
                tekstEn: 'Cut the heart free with the knife.',
                kraeverItem: 'kniv',
                effekt: () => ({
                    logBesked: 'Kniven får hjertet fri, men træet vrider sig om dit håndled. Du får Rodhjertet, og skoven husker lyden.',
                    logBeskedEn: 'The knife frees the heart, but the tree twists around your wrist. You get the Rootheart, and the forest remembers the sound.',
                    hpNed: 15,
                    itemUd: 'rodhjertet'
                })
            },
            {
                tekst: 'Lad træet leve.',
                tekstEn: 'Let the tree live.',
                effekt: () => ({
                    logBesked: 'Du lægger hånden mod stammen og træder tilbage. Rødderne løsner jorden under dig og deler lidt af deres ro.',
                    logBeskedEn: 'You place your hand against the trunk and step back. The roots loosen the soil beneath you and share a little of their calm.',
                    hpOp: 20
                })
            }
        ]
    },

    'campfire': {
        id: 'campfire',
        titel: "Fremmed Lejr",
        titelEn: "Stranger Camp",
        tekst: "En gruppe rejsende sidder tæt omkring et bål. De følger dig med øjnene. Lederen nikker mod en ledig plads ved kanten af lyset.",
        tekstEn: "A group of travelers sits close around a fire. They follow you with their eyes. The leader nods toward an empty place at the edge of the light.",
        biome: ['eng', 'skov', 'mark', 'bjerg', 'hoejland'],
        billede: '/events/ev_campfire.webp', 
        unik: false,
        valg: [
            {
                tekst: "Betal 10 guld for en plads tættere på ilden",
                tekstEn: "Pay 10 gold for a place closer to the fire",
                puljeVaerdi: 10,
                udfaldListe: [
                    { log: "De gør plads. Varmen hjælper. Du hviler bedre, end du havde ventet.", logEn: "They make room. The warmth helps. You rest better than you expected.", hpAendring: 50 }
                ]
            },
            {
                tekst: "Del din eliksir med gruppen",
                tekstEn: "Share your elixir with the group",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { 
                        log: "Du deler eliksiren med lejren. De betaler dig og holder vagt, mens du sover.", 
                        logEn: "You share the elixir with the camp. They pay you and keep watch while you sleep.",
                        hpAendring: 100, 
                        maxHpAendring: 10,
                        guldAendring: 50 
                    }
                ]
            },
            {
                tekst: "Læg dig i yderkanten af lejren",
                tekstEn: "Lie down at the outer edge of the camp",
                udfaldListe: [{ log: "Du sover uroligt i græsset. Det er koldt, men du får hvilet benene.", logEn: "You sleep uneasily in the grass. It is cold, but your legs get some rest.", hpAendring: 20 }]
            }
        ]
    },

    'kikkerten_i_messing': {
        id: 'kikkerten_i_messing',
        titel: "Det Faste Greb",
        titelEn: "The Locked Grip",
        biome: ['ruin', 'bjerg', 'by'],
        unik: true,
        billede: '/events/ev_kikkert.webp',
        tekst: "En tung messingkikkert sidder fast i en sten. Da du rører den, låser en mekanisme sig om dit håndled. Du må se gennem en af linserne for at komme fri.",
        tekstEn: "A heavy brass spyglass is stuck in a stone. When you touch it, a mechanism locks around your wrist. You must look through one of the lenses to get free.",
        valg: [
            { 
                tekst: "Kig igennem okularet", 
                tekstEn: "Look through the eyepiece",
                effekt: () => {
                    return { 
                        logBesked: "Synsfeltet trækker sig udad. Øen virker længere væk.", 
                        logBeskedEn: "Your field of view pulls outward. The island seems farther away.",
                        hpNed: 5,
                        itemUd: 'kikkert_45'
                    };
                } 
            },
            { 
                tekst: "Kig igennem objektivet", 
                tekstEn: "Look through the objective lens",
                effekt: () => {
                    return { 
                        logBesked: "Synsfeltet trækker sig indad. Øen virker alt for tæt på.", 
                        logBeskedEn: "Your field of view pulls inward. The island seems far too close.",
                        hpNed: 5,
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            { 
                tekst: "Lirk fjedrene løst med din kniv", 
                tekstEn: "Pry the springs loose with your knife",
                kraeverItem: 'kniv', 
                effekt: () => {
                    return { 
                        logBesked: "Kniven løsner grebet, men mekanismen drejer kikkerten mod objektivet.", 
                        logBeskedEn: "The knife loosens the grip, but the mechanism turns the spyglass toward the objective lens.",
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            {
                tekst: "Opløs maskineriet med din eliksir",
                tekstEn: "Dissolve the mechanism with your elixir",
                kosterItem: 'livseliksir',
                effekt: () => {
                    return { 
                        logBesked: "Eliksiren ætser messingrøret op. Mekanismen falder fra hinanden. Linserne viser sig at være diamanter.",
                        logBeskedEn: "The elixir etches through the brass tube. The mechanism falls apart. The lenses turn out to be diamonds.",
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
        tekst: "Luften flimrer lavt over jorden. Der er en smal revne i synsfeltet, og græsset omkring den er svedet.",
        tekstEn: "The air shimmers low over the ground. There is a narrow crack in your field of vision, and the grass around it is scorched.",
        valg: [
            { 
                tekst: "Træd ind i flimmeret", 
                tekstEn: "Step into the shimmer",
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Flimmeret samler sig til en portal. Du flyttes mod øst.", logBeskedEn: "The shimmer gathers into a portal. You are moved east." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen lukker sig brat. Nogle mønter ligger tilbage i græsset.", logBeskedEn: "The crack snaps shut. A few coins are left in the grass.", guldOp: guld };
                    } else {
                        return { logBesked: "Flimmeret slipper dig for tidligt. Du falder hårdt.", logBeskedEn: "The shimmer releases you too soon. You fall hard.", hpNed: 8 };
                    }
                } 
            },
            { 
                tekst: "Hold sværdet ind i flimmeret", 
                tekstEn: "Hold the sword into the shimmer",
                kraeverItem: 'svaerd', 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Flimmeret fæstner sig i jorden som en portal. Du ryger igennem.", logBeskedEn: "The shimmer anchors into the ground as a portal. You tumble through." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen ryster og efterlader mønter ved dine fødder.", logBeskedEn: "The crack trembles and leaves coins at your feet.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen lukker sig omkring klingen og forsvinder. Sværdet er uskadt.", logBeskedEn: "The crack closes around the blade and vanishes. The sword is unharmed." };
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
                        return { logBesked: "Mønterne forsvinder. Revnen åbner som en portal mod øst.", logBeskedEn: "The coins vanish. The crack opens as a portal to the east." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 51) + 100; 
                        return { logBesked: "Revnen åbner kort og skubber mere guld ud.", logBeskedEn: "The crack opens briefly and pushes out more gold.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen tager guldet og lukker sig med et tørt smæld.", logBeskedEn: "The crack takes the gold and closes with a dry snap." };
                    }
                } 
            },
            {
                tekst: "Hold afstand",
                tekstEn: "Keep your distance",
                effekt: () => {
                    return { logBesked: "Du holder afstand og fortsætter til fods.", logBeskedEn: "You keep your distance and continue on foot." };
                }
            }
        ]
    },

    'den_vilde_kilde': {
        id: 'den_vilde_kilde',
        titel: "Kogende Jord",
        titelEn: "Boiling Earth",
        biome: ['bjerg', 'skov', 'hoejland'],
        unik: false,
        billede: '/events/ev_kilde.webp',
        tekst: "En lille gejser sprøjter særligt energifyldt vand op gennem jorden. Dampen sitrer over stenene, og hvert skridt omkring dig virker pludselig lettere at aflæse.",
        tekstEn: "A small geyser sprays unusually energy-rich water through the earth. The steam trembles over the stones, and every step around you suddenly seems easier to read.",
        valg: [
            { 
                tekst: "Indånd dampen direkte", 
                tekstEn: "Inhale the steam directly",
                effekt: () => {
                    return { 
                        logBesked: "Dampen svier i brystet. Du får energi, og et klart energisyn lægger sig over terrænet omkring dig.", 
                        logBeskedEn: "The steam burns in your chest. You gain energy, and a clear energy sight settles over the terrain around you.",
                        hpNed: 10,
                        energiTil: 9,
                        energisyn: true
                    };
                } 
            },
            { 
                tekst: "Filtrér dampen gennem tøj", 
                tekstEn: "Filter the steam through clothes",
                kosterItem: 'alle_toej', 
                effekt: () => {
                    return { 
                        logBesked: "Tøjet filtrerer dampen. Du får energi uden at tage skade, og terrænets energiforbrug står klart for dig.", 
                        logBeskedEn: "The cloth filters the steam. You gain energy without taking damage, and the terrain's energy cost becomes clear to you.",
                        energiTil: 9,
                        energisyn: true
                    };
                } 
            },
            { 
                tekst: "Drik vandet fra pølen", 
                tekstEn: "Drink the water from the pool",
                effekt: () => {
                    return { 
                        logBesked: "Vandet smager af metal og brænder klart i kroppen. Du får energi og energisyn, men kroppen tager varig skade.", 
                        logBeskedEn: "The water tastes of metal and burns bright in your body. You gain energy and energy sight, but your body takes lasting harm.",
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
                    return { logBesked: "Du holder afstand fra dampen.", logBeskedEn: "You keep away from the steam." };
                }
            }
        ]
    },

    'dvaergens_sidste_aare': {
        id: 'dvaergens_sidste_aare',
        titel: "Dværgens Sidste Åre",
        titelEn: "The Dwarf's Last Vein",
        biome: ['bjerg', 'hule', 'ruin'],
        unik: true,
        billede: '/events/ev_lig.webp',
        tekst: "En dværg ligger klemt mellem to sprængte sten. Maven er flået op af en skarp malmkant, og hans skæg er stift af støv og blod. Alligevel holder han fast i en lille sort notesbog. \"Jeg holdt på dem for længe,\" hoster han. \"Guldårerne. Jeg lod ingen andre finde dem. Nu kan jeg ikke bære kortet længere.\"",
        tekstEn: "A dwarf lies pinned between two blasted stones. His belly is torn open by a sharp ore edge, and his beard is stiff with dust and blood. Still, he clutches a small black notebook. \"I held them too long,\" he coughs. \"The gold veins. I let no one else find them. Now I cannot carry the map any farther.\"",
        valg: [
            {
                tekst: "Støt hans hoved og bed ham nævne den nærmeste mine.",
                tekstEn: "Support his head and ask him to name the nearest mine.",
                effekt: () => {
                    const logBesked = afslorNaermesteGuldminer(1);
                    return {
                        logBesked,
                        logBeskedEn: logBesked
                    };
                }
            },
            {
                tekst: "Giv ham mad og lad ham tale langsomt.",
                tekstEn: "Give him food and let him speak slowly.",
                kosterItem: 'mad',
                effekt: () => {
                    const logBesked = `${afslorNaermesteGuldminer(2)} ${tekst('Maden giver ham kræfter nok til at advare dig: gå ikke vestpå efter hans fejl.', 'The food gives him enough strength to warn you: do not go west after his mistake.')}`;
                    return {
                        logBesked,
                        logBeskedEn: logBesked
                    };
                }
            },
            {
                tekst: "Giv ham en livseliksir fra apoteket.",
                tekstEn: "Give him a life elixir from the apothecary.",
                kosterItem: 'livseliksir',
                effekt: () => {
                    const logBesked = `${afslorNaermesteGuldminer(2)} ${tekst('Eliksiren lukker ikke såret, men hans øjne bliver klare et øjeblik. Han presser notesbogen mod din hånd og beder dig bruge guldet bedre, end han gjorde.', 'The elixir does not close the wound, but his eyes clear for a moment. He presses the notebook into your hand and asks you to use the gold better than he did.')}`;
                    return {
                        logBesked,
                        logBeskedEn: logBesked,
                        maxHpAendring: 5
                    };
                }
            },
            {
                tekst: "Tag notesbogen og lad ham ligge.",
                tekstEn: "Take the notebook and leave him.",
                effekt: () => {
                    return {
                        logBesked: "Du trækker notesbogen fri, men siderne er skrevet i kode og blod. Da dværgen ser det, bider han tænderne sammen og tier. Du får intet ud af ham.",
                        logBeskedEn: "You pull the notebook free, but the pages are written in code and blood. When the dwarf sees it, he clenches his teeth and falls silent. You get nothing from him.",
                        hpNed: 4
                    };
                }
            }
        ]
    },

    'det_glemte_lig': {
        id: 'det_glemte_lig',
        titel: "Kold Mudder",
        titelEn: "Cold Mud",
        biome: ['slagmark', 'mark', 'eng'],
        unik: false,
        billede: '/events/ev_lig.webp',
        tekst: "Et lig ligger halvt begravet i mudderet. Tøjet er allerede gennemrodet, men noget kan være sunket længere ned.",
        tekstEn: "A body lies half buried in the mud. The clothes have already been searched, but something may have sunk deeper down.",
        valg: [
            { 
                tekst: "Grav i mudderet med de bare næver", 
                tekstEn: "Dig in the mud with your bare hands",
                kosterEnergi: 2,
                effekt: () => {
                    if (Math.random() < 0.50) {
                        const guld = Math.floor(Math.random() * 31) + 20;
                        return { logBesked: "Du mærker en tung pung under overfladen og trækker den fri.", logBeskedEn: "You feel a heavy purse beneath the surface and pull it free.", guldOp: guld };
                    } else {
                        return { logBesked: "Du får kun koldt mudder under neglene. Der var intet værdifuldt tilbage.", logBeskedEn: "You get only cold mud under your nails. Nothing valuable was left." };
                    }
                } 
            },
            { 
                tekst: "Grav omkring kroppen med skovlen", 
                tekstEn: "Dig around the body with the shovel",
                kraeverItem: 'skovl', 
                effekt: () => {
                    if (Math.random() < 0.50) {
                        const guld = Math.floor(Math.random() * 31) + 20;
                        return { logBesked: "Du finder glemte mønter ved hans støvler.", logBeskedEn: "You find forgotten coins by his boots.", guldOp: guld };
                    } else {
                        return { logBesked: "Du skovler mudderet væk. Der er ikke noget tilbage.", logBeskedEn: "You shovel the mud away. There is nothing left.", };
                    }
                } 
            },
            { 
                tekst: "Vend kroppen om med foden", 
                tekstEn: "Turn the body over with your foot",
                effekt: () => {
                    const guld = Math.floor(Math.random() * 31) + 20;
                    return { 
                        logBesked: "En tung lugt stiger op fra mudderet. Du tager skade, men en pung falder fri.", 
                        logBeskedEn: "A heavy smell rises from the mud. You take damage, but a purse falls free.",
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
