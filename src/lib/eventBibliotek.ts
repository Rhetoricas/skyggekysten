import { BREDDE } from './spildata';
import { spilTilstand } from './spilTilstand.svelte';
import { bygOgHopGennemPortal, regnHexAfstand } from './spilmotor';
import { blodskovensHjerteEvents } from './event_blodskov';
import { naturkatastrofeEvents } from './event_naturkatastrofer';
import { metaEvents } from './event_meta';
import { vaabenEvents } from './event_vaaben';
import { specialItemEvents } from './event_specialitems';
import type { Biome } from './types';

export interface Udfald {
    log: string; 
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
        hpOp?: number;
        hpNed?: number;
        guldOp?: number;
        guldNed?: number;
        energiOp?: number;    
        energiNed?: number;   
        maxHpAendring?: number; 
        itemUd?: string;
        naesteEvent?: string;
    };
}

export interface SpilEvent {
    id: string;
    biome: Biome | Biome[] | 'alle' | 'any';
    titel: string;
    tekst: string;
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

function retningTilFelt(fraIndex: number, tilIndex: number) {
    const fraKolonne = fraIndex % BREDDE;
    const fraRaekke = Math.floor(fraIndex / BREDDE);
    const tilKolonne = tilIndex % BREDDE;
    const tilRaekke = Math.floor(tilIndex / BREDDE);
    const lodret = tilRaekke < fraRaekke ? 'nord' : tilRaekke > fraRaekke ? 'syd' : '';
    const vandret = tilKolonne > fraKolonne ? 'øst' : tilKolonne < fraKolonne ? 'vest' : '';

    if (lodret && vandret) return `${lodret}${vandret}`;
    return lodret || vandret || 'her';
}

function afslorNaermesteGuldminer(antal: number) {
    const start = spilTilstand.spillerIndex;
    const spillerKolonne = start % BREDDE;
    const kendte = new Set(spilTilstand.mineKendteFelter || []);
    const miner = spilTilstand.gitter
        .map((felt, index) => ({ felt, index }))
        .filter(({ felt, index }) => felt.hasGoldmine && index % BREDDE >= spillerKolonne)
        .sort((a, b) => regnHexAfstand(start, a.index, BREDDE) - regnHexAfstand(start, b.index, BREDDE))
        .slice(0, antal);

    if (miner.length === 0) {
        return 'Dværgen lukker øjnene og snuser efter malm. "Ikke bagud," hvisker han. "Fremad er der intet guld, jeg tør love dig."';
    }

    for (const mine of miner) kendte.add(mine.index);
    spilTilstand.mineKendteFelter = Array.from(kendte);

    const retninger = miner.map((mine) => {
        const afstand = regnHexAfstand(start, mine.index, BREDDE);
        return `${retningTilFelt(start, mine.index)} (${afstand} felter)`;
    });

    return miner.length === 1
        ? `Dværgen kradser et kort i jorden med en blodig finger. En guldmine bliver tydelig ${retninger[0]}.`
        : `Dværgen hvisker to gamle mine-navne og ridser dem ind i din hukommelse. Guldminer bliver tydelige: ${retninger.join(' og ')}.`;
}

function alkymistForsog() {
    if (Math.random() < 0.5) {
        return {
            logBesked: 'Alkymisten hælder guldet i maskinen. Rørene synger, og en ren gylden dråbe lukker kredsløbet. Han skubber destillatoren over til dig med rystende hænder.',
            itemUd: 'gylden_destillator'
        };
    }

    return {
        logBesked: 'Maskinen hoster, sprutter og dør med et lille suk. Alkymisten fisker det meste af guldet op igen og undskylder uden at møde dit blik.',
        guldOp: 40
    };
}

export const eventBibliotek: Record<string, SpilEvent> = {
    ...blodskovensHjerteEvents,
    ...naturkatastrofeEvents,
    ...metaEvents,
    ...vaabenEvents,
    ...specialItemEvents,

    'den_toerstige_alkymist': {
        id: 'den_toerstige_alkymist',
        titel: 'Den Tørstige Alkymist',
        tekst: 'Ved en tør brønd står en alkymist med en høj, gylden maskine af rør og glas. Den kan destillere metal ud af jord, påstår han, men kredsløbet mangler noget levende at starte på.',
        biome: ['ruin', 'hule', 'bjerg', 'marked'],
        billede: '/events/ev_ruin.webp',
        unik: true,
        valg: [
            {
                tekst: 'Giv ham en livseliksir til kredsløbet.',
                kosterItem: 'livseliksir',
                udfaldListe: [
                    {
                        log: 'Eliksiren lyser gennem rørene. Maskinen vågner, og alkymisten ler, som om han lige har hørt jorden tale. Han giver dig den gyldne destillator.',
                        givItem: 'gylden_destillator'
                    }
                ]
            },
            {
                tekst: 'Betal 100 guld for et forsøg.',
                puljeVaerdi: 100,
                effekt: () => alkymistForsog()
            },
            {
                tekst: 'Kalibrer maskinen med metaldetektoren.',
                kraeverItem: 'metaldetektor',
                effekt: () => ({
                    logBesked: 'Detektoren finder den rette tone i rørene. Alkymisten får maskinen til at spytte mønter ud og deler udbyttet med dig.',
                    guldOp: 120
                })
            },
            {
                tekst: 'Lad ham tørste videre.',
                effekt: () => ({ logBesked: 'Du lader alkymisten stå ved sin tørre brønd. Maskinen tikker fornærmet bag dig.' })
            }
        ]
    },

    'traeet_med_den_aabne_puls': {
        id: 'traeet_med_den_aabne_puls',
        titel: 'Træet Med Den Åbne Puls',
        tekst: 'Et gammelt træ står med stammen revnet op. Indeni slår noget grønt og levende, som om skoven har et hjerte. Rødderne omkring dig flytter sig væk fra dine fødder.',
        biome: ['skov', 'blodskov', 'eng'],
        billede: '/events/ev_skov.webp',
        unik: true,
        valg: [
            {
                tekst: 'Giv træet en madration.',
                kosterItem: 'mad',
                udfaldListe: [
                    {
                        log: 'Træet åbner sig uden smerte. Maden forsvinder mellem rødderne, og hjertet falder ned i dine hænder som en tung grøn frugt.',
                        givItem: 'rodhjertet'
                    }
                ]
            },
            {
                tekst: 'Før søgekvisten ind i revnen.',
                kosterItem: 'soegekvist',
                udfaldListe: [
                    {
                        log: 'Kvisten finder pulsen og knækker med et lykkeligt smæld. Da træet lukker sig, ligger Rodhjertet tilbage i græsset.',
                        givItem: 'rodhjertet'
                    }
                ]
            },
            {
                tekst: 'Skær hjertet fri med kniven.',
                kraeverItem: 'kniv',
                effekt: () => ({
                    logBesked: 'Kniven får hjertet fri, men træet vrider sig om dit håndled. Du får Rodhjertet, og skoven husker lyden.',
                    hpNed: 15,
                    itemUd: 'rodhjertet'
                })
            },
            {
                tekst: 'Lad træet leve.',
                effekt: () => ({
                    logBesked: 'Du lægger hånden mod stammen og træder tilbage. Rødderne løsner jorden under dig og deler lidt af deres ro.',
                    hpOp: 20
                })
            }
        ]
    },

    'campfire': {
        id: 'campfire',
        titel: "Fremmed Lejr",
        tekst: "En gruppe rejsende sidder tæt omkring et bål. De følger dig med øjnene. Lederen nikker mod en ledig plads ved kanten af lyset.",
        biome: ['eng', 'skov', 'mark', 'bjerg', 'hoejland'],
        billede: '/events/ev_campfire.webp', 
        unik: false,
        valg: [
            {
                tekst: "Betal 10 guld for en plads tættere på ilden",
                puljeVaerdi: 10,
                udfaldListe: [
                    { log: "De gør plads. Varmen hjælper. Du hviler bedre, end du havde ventet.", hpAendring: 50 }
                ]
            },
            {
                tekst: "Del din eliksir med gruppen",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { 
                        log: "Du deler eliksiren med lejren. De betaler dig og holder vagt, mens du sover.", 
                        hpAendring: 100, 
                        maxHpAendring: 10,
                        guldAendring: 50 
                    }
                ]
            },
            {
                tekst: "Læg dig i yderkanten af lejren",
                udfaldListe: [{ log: "Du sover uroligt i græsset. Det er koldt, men du får hvilet benene.", hpAendring: 20 }]
            }
        ]
    },

    'kikkerten_i_messing': {
        id: 'kikkerten_i_messing',
        titel: "Det Faste Greb",
        biome: ['ruin', 'bjerg', 'by'],
        unik: true,
        billede: '/events/ev_kikkert.webp',
        tekst: "En tung messingkikkert sidder fast i en sten. Da du rører den, låser en mekanisme sig om dit håndled. Du må se gennem en af linserne for at komme fri.",
        valg: [
            { 
                tekst: "Kig igennem okularet", 
                effekt: () => {
                    return { 
                        logBesked: "Synsfeltet trækker sig udad. Øen virker længere væk.", 
                        hpNed: 5,
                        itemUd: 'kikkert_45'
                    };
                } 
            },
            { 
                tekst: "Kig igennem objektivet", 
                effekt: () => {
                    return { 
                        logBesked: "Synsfeltet trækker sig indad. Øen virker alt for tæt på.", 
                        hpNed: 5,
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            { 
                tekst: "Lirk fjedrene løst med din kniv", 
                kraeverItem: 'kniv', 
                effekt: () => {
                    return { 
                        logBesked: "Kniven løsner grebet, men mekanismen drejer kikkerten mod objektivet.", 
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            {
                tekst: "Opløs maskineriet med din eliksir",
                kosterItem: 'livseliksir',
                effekt: () => {
                    return { 
                        logBesked: "Eliksiren ætser messingrøret op. Mekanismen falder fra hinanden. Linserne viser sig at være diamanter.",
                        itemUd: 'diamant, diamant' 
                    };
                }
            }
        ]
    },

    'spraekken_i_luften': {
        id: 'spraekken_i_luften',
        titel: "Flimmeret",
        biome: ['ritual', 'blodskov', 'eng'],
        unik: false,
        billede: '/events/ev_portal.webp',
        tekst: "Luften flimrer lavt over jorden. Der er en smal revne i synsfeltet, og græsset omkring den er svedet.",
        valg: [
            { 
                tekst: "Træd ind i flimmeret", 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Flimmeret samler sig til en portal. Du flyttes mod øst." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen lukker sig brat. Nogle mønter ligger tilbage i græsset.", guldOp: guld };
                    } else {
                        return { logBesked: "Flimmeret slipper dig for tidligt. Du falder hårdt.", hpNed: 8 };
                    }
                } 
            },
            { 
                tekst: "Hold sværdet ind i flimmeret", 
                kraeverItem: 'svaerd', 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Flimmeret fæstner sig i jorden som en portal. Du ryger igennem." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen ryster og efterlader mønter ved dine fødder.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen lukker sig omkring klingen og forsvinder. Sværdet er uskadt." };
                    }
                } 
            },
            { 
                tekst: "Kast 20 guld ind i revnen", 
                puljeVaerdi: 20,
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Mønterne forsvinder. Revnen åbner som en portal mod øst." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 51) + 100; 
                        return { logBesked: "Revnen åbner kort og skubber mere guld ud.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen tager guldet og lukker sig med et tørt smæld." };
                    }
                } 
            },
            {
                tekst: "Hold afstand",
                effekt: () => {
                    return { logBesked: "Du holder afstand og fortsætter til fods." };
                }
            }
        ]
    },

    'den_vilde_kilde': {
        id: 'den_vilde_kilde',
        titel: "Kogende Jord",
        biome: ['bjerg', 'skov', 'hoejland'],
        unik: false,
        billede: '/events/ev_kilde.webp',
        tekst: "En lille gejser sender varm damp op gennem jorden. Luften svier i halsen, men kroppen reagerer med et uroligt overskud.",
        valg: [
            { 
                tekst: "Indånd dampen direkte", 
                effekt: () => {
                    const energi = Math.floor(Math.random() * 3) + 3;
                    return { 
                        logBesked: "Dampen svier i brystet. Du får energi, men det koster liv.", 
                        hpNed: 5,
                        energiOp: energi
                    };
                } 
            },
            { 
                tekst: "Filtrér dampen gennem beskidte klude", 
                kosterItem: 'klude', 
                effekt: () => {
                    const energi = Math.floor(Math.random() * 3) + 3;
                    return { 
                        logBesked: "Kludene tager noget af giften. Du får energi uden at tage skade.", 
                        energiOp: energi
                    };
                } 
            },
            { 
                tekst: "Drik vandet fra pølen", 
                effekt: () => {
                    const energi = Math.floor(Math.random() * 3) + 3;
                    return { 
                        logBesked: "Vandet smager af metal. Du får energi, men kroppen tager varig skade.", 
                        energiOp: energi,
                        maxHpAendring: -2
                    };
                } 
            },
            {
                tekst: "Gå uden om gejseren",
                effekt: () => {
                    return { logBesked: "Du holder afstand fra dampen." };
                }
            }
        ]
    },

    'dvaergens_sidste_aare': {
        id: 'dvaergens_sidste_aare',
        titel: "Dværgens Sidste Åre",
        biome: ['bjerg', 'hule', 'ruin'],
        unik: true,
        billede: '/events/ev_lig.webp',
        tekst: "En dværg ligger klemt mellem to sprængte sten. Maven er flået op af en skarp malmkant, og hans skæg er stift af støv og blod. Alligevel holder han fast i en lille sort notesbog. \"Jeg holdt på dem for længe,\" hoster han. \"Guldårerne. Jeg lod ingen andre finde dem. Nu kan jeg ikke bære kortet længere.\"",
        valg: [
            {
                tekst: "Støt hans hoved og bed ham nævne den nærmeste mine.",
                effekt: () => {
                    return {
                        logBesked: afslorNaermesteGuldminer(1)
                    };
                }
            },
            {
                tekst: "Giv ham mad og lad ham tale langsomt.",
                kosterItem: 'mad',
                effekt: () => {
                    return {
                        logBesked: `${afslorNaermesteGuldminer(2)} Maden giver ham kræfter nok til at advare dig: gå ikke vestpå efter hans fejl.`
                    };
                }
            },
            {
                tekst: "Giv ham en livseliksir fra apoteket.",
                kosterItem: 'livseliksir',
                effekt: () => {
                    return {
                        logBesked: `${afslorNaermesteGuldminer(2)} Eliksiren lukker ikke såret, men hans øjne bliver klare et øjeblik. Han presser notesbogen mod din hånd og beder dig bruge guldet bedre, end han gjorde.`,
                        maxHpAendring: 5
                    };
                }
            },
            {
                tekst: "Tag notesbogen og lad ham ligge.",
                effekt: () => {
                    return {
                        logBesked: "Du trækker notesbogen fri, men siderne er skrevet i kode og blod. Da dværgen ser det, bider han tænderne sammen og tier. Du får intet ud af ham.",
                        hpNed: 4
                    };
                }
            }
        ]
    },

    'det_glemte_lig': {
        id: 'det_glemte_lig',
        titel: "Kold Mudder",
        biome: ['slagmark', 'mark', 'eng'],
        unik: false,
        billede: '/events/ev_lig.webp',
        tekst: "Et lig ligger halvt begravet i mudderet. Tøjet er allerede gennemrodet, men noget kan være sunket længere ned.",
        valg: [
            { 
                tekst: "Grav i mudderet med de bare næver", 
                kosterEnergi: 2,
                effekt: () => {
                    if (Math.random() < 0.50) {
                        const guld = Math.floor(Math.random() * 31) + 20;
                        return { logBesked: "Du mærker en tung pung under overfladen og trækker den fri.", guldOp: guld };
                    } else {
                        return { logBesked: "Du får kun koldt mudder under neglene. Der var intet værdifuldt tilbage." };
                    }
                } 
            },
            { 
                tekst: "Grav omkring kroppen med skovlen", 
                kraeverItem: 'skovl', 
                effekt: () => {
                    if (Math.random() < 0.50) {
                        const guld = Math.floor(Math.random() * 31) + 20;
                        return { logBesked: "Du finder glemte mønter ved hans støvler.", guldOp: guld };
                    } else {
                        return { logBesked: "Du skovler mudderet væk. Der er ikke noget tilbage." };
                    }
                } 
            },
            { 
                tekst: "Vend kroppen om med foden", 
                effekt: () => {
                    const guld = Math.floor(Math.random() * 31) + 20;
                    return { 
                        logBesked: "En tung lugt stiger op fra mudderet. Du tager skade, men en pung falder fri.", 
                        hpNed: 6,
                        guldOp: guld
                    };
                } 
            },
            {
                tekst: "Lad kroppen ligge",
                effekt: () => {
                    return { logBesked: "Du lader kroppen ligge og går videre." };
                }
            }
        ]
    },
};
