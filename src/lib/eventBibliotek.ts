import { spilTilstand } from '$lib/spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { bygOgHopGennemPortal, udvindMeteorSkat, udloesNaturkatastrofe, udloesOversvoemmelse, udloesJordskaelv } from './spilmotor';import type { Biome } from './types';

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
    unik?: boolean;           
    sfx?: string;             
    erSubTrin?: boolean;      
    valg: Valg[];
}

export const eventBibliotek: Record<string, SpilEvent> = {

    'campfire': {
        id: 'campfire',
        titel: "Fremmed Lejr",
        tekst: "En flok vejrbidte rejsende sidder ved et knitrende bål. De stirrer stift på dig. Lederen nikker og tilbyder dig en plads i nærheden af bålet",
        biome: ['eng', 'skov', 'mark', 'bjerg', 'hoejland'],
        billede: '/events/ev_campfire.webp', 
        unik: false,
        valg: [
            {
                tekst: "Køb dig til en bedre plads tættere ved ilden",
                puljeVaerdi: 10,
                udfaldListe: [
                    { log: "De gør plads. Varmen og sikkerheden er vidunderlig.", hpAendring: 50 }
                ]
            },
            {
                tekst: "Del din eliksir med gruppen",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { 
                        log: "Du varmer eliksiren over bålet og deler med dem. De giver dig en pose guld som tak og holder vagt, mens du sover og genvinder dine kræfter og mere til.", 
                        hpAendring: 100, 
                        maxHpAendring: 10,
                        guldAendring: 50 
                    }
                ]
            },
            {
                tekst: "Læg dig i yderkanten af lejren",
                udfaldListe: [{ log: "Du sover uroligt i græsset. Det er koldt på afstand af ilden, men du får hvilet benene.", hpAendring: 20 }]
            }
        ]
    },

    'kikkerten_i_messing': {
        id: 'kikkerten_i_messing',
        titel: "Det Faste Greb",
        biome: ['ruin', 'bjerg', 'by'],
        unik: true,
        billede: '/events/ev_kikkert.webp',
        tekst: "En tung messingkikkert er støbt fast i en sten. En mekanisme klapper stramt om dit håndled, og du er tvunget til at se igennem kikkerten for at komme fri.",
        valg: [
            { 
                tekst: "Kig igennem okularet", 
                effekt: () => {
                    return { 
                        logBesked: "Du føler et sug udad og ser øen længere væk.", 
                        hpNed: 5,
                        itemUd: 'kikkert_45'
                    };
                } 
            },
            { 
                tekst: "Kig igennem objektivet", 
                effekt: () => {
                    return { 
                        logBesked: "Du føler et sug indad og ser øen tættere på.", 
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
                        logBesked: "Klingen glider ind i mekanismen og vender sig, så du er nødt til at se igennem objektivet", 
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            {
                tekst: "Opløs maskineriet med din eliksir",
                kosterItem: 'livseliksir',
                effekt: () => {
                    return { 
                        logBesked: "Den kraftige væske ætser messingrøret væk. Mekanismen falder fra hinanden, og du opdager, at begge linser er lavet af diamanter.",
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
        tekst: "Luften flimrer over jorden som en varmedis. Revnen lugter skarpt af ozon og spytter små gnister ud i græsset.",
        valg: [
            { 
                tekst: "Kast dig ind i det magiske felt", 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Magien materialiserer en portal. Du bliver kastet fremad over øen." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen afviser dig, men spytter nogle mønter ud i græsset.", guldOp: guld };
                    } else {
                        return { logBesked: "Magien kollapser under dig, og du lander hårdt mod jorden.", hpNed: 8 };
                    }
                } 
            },
            { 
                tekst: "Brug dit sværd som anker mod magien", 
                kraeverItem: 'svaerd', 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Magien forankres i jorden bag dig som en permanent portal og du flyver selv igennem." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Revnen vibrerer og kaster pludselig mønter ud til dig.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen lukker sig om klingen og forsvinder. Du trækker våbnet til dig uden at tage skade." };
                    }
                } 
            },
            { 
                tekst: "Smid 20 guld ind i revnen", 
                puljeVaerdi: 20,
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Mønterne forsvinder og lyset bliver til en portal, der flytter dig længere mod øst." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 51) + 100; 
                        return { logBesked: "Revnen åbner sig og smider guld ud fra andre eventyrere.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen sluger dine penge og lukker sig med et mærkbart smæld." };
                    }
                } 
            },
            {
                tekst: "Vend ryggen til den ustabile magi",
                effekt: () => {
                    return { logBesked: "Du ignorerer flimmeret og fortsætter til fods uden at tage chancer." };
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
        tekst: "En lille gejser skyder damp op fra undergrunden. Gassen river i lungerne, men får samtidig dit hjerte til at hamre overnaturligt hurtigt.",
        valg: [
            { 
                tekst: "Træk dampen direkte ned i lungerne", 
                effekt: () => {
                    const energi = Math.floor(Math.random() * 3) + 3;
                    return { 
                        logBesked: "Du fylder brystet med jordgas. Det ætser dit indre, men musklerne spændes med overskudskraft.", 
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
                        logBesked: "Stoffet tager den giftige kant. Du suger ren kraft ind uden at hoste blod.", 
                        energiOp: energi
                    };
                } 
            },
            { 
                tekst: "Drik det svovlholdige vand fra pølen", 
                effekt: () => {
                    const energi = Math.floor(Math.random() * 3) + 3;
                    return { 
                        logBesked: "Vandet smager af kobber. Det rammer dig med massiv energi, men forgifter din krop permanent.", 
                        energiOp: energi,
                        maxHpAendring: -2
                    };
                } 
            },
            {
                tekst: "Gå en stor bue uden om gejseren",
                effekt: () => {
                    return { logBesked: "Du vil ikke risikere forgiftning. Du lader dampen slippe ud i ingenting." };
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
        tekst: "En uheldig stakkel ligger halvt begravet i mudderet. Andre forbipasserende har for længst flænset tøjet for alt synligt af værdi.",
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
                tekst: "Grav ham fri af jorden", 
                kraeverItem: 'skovl', 
                effekt: () => {
                    if (Math.random() < 0.50) {
                        const guld = Math.floor(Math.random() * 31) + 20;
                        return { logBesked: "Du finder glemte mønter ved hans støvler.", guldOp: guld };
                    } else {
                        return { logBesked: "Du skovler mudderet væk, men han var fuldstændig plyndret." };
                    }
                } 
            },
            { 
                tekst: "Spark liget rundt og om på ryggen", 
                effekt: () => {
                    const guld = Math.floor(Math.random() * 31) + 20;
                    return { 
                        logBesked: "En sky af forrådnelse stiger op. Du indånder det og tager skade, men hans pung falder ud fra inderlommen.", 
                        hpNed: 6,
                        guldOp: guld
                    };
                } 
            },
            {
                tekst: "Lad ham ligge i fred",
                effekt: () => {
                    return { logBesked: "Du roder ikke ved de døde. Du går videre ud." };
                }
            }
        ]
    },

'stjernekald': {
        id: 'stjernekald',
        titel: 'Stjernekaldet',
        tekst: 'Et massivt alter af obsidian tårner sig op foran dig. Inskriptionerne lover stor rigdom trukket direkte ud af himmelrummet. De advarer dog også om, at stjernernes vrede vil knuse jorden og brænde kødet af den, der tør kalde.',
        biome: 'ritual',
        billede: '/events/ev_ritual.webp',
        unik: false,
        valg: [
            {
                tekst: 'Læs ritualet højt og træk himlen ned',
                effekt: () => {
                    udloesNaturkatastrofe(spilTilstand.spillerIndex);
                    return { logBesked: "Du læser de ukendte ord højt. En massiv skygge kastes pludselig over øen." };
                }
            },
            {
                tekst: 'Vend ryggen til galskaben',
                effekt: () => {
                    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
                    if (felt) felt.eventFuldført = false; 
                    syncTilDb(true);
                    return { logBesked: "Du ryster på hovedet og lader alteret stå urørt." };
                }
            }
        ]
    },
    'meteor_skat': {
        id: 'meteor_skat',
        titel: 'Det Glødende Krater',
        tekst: 'Klippen pulserer af en næsten overnaturlig varme. I midten af krateret ligger en kugle af sten, guld og sammenpresset kulstof. Du kan forsøge at åbne den nu, før klippen størkner. Varmen er utålelig.',
        biome: 'meteor',
        billede: '/events/meteor.webp',
        unik: false,
        valg: [
            {
                tekst: 'Grav med skovlen',
                kosterItem: 'skovl',
                effekt: () => { return udvindMeteorSkat('skovl'); }
            },
            {
                tekst: 'Flæk stenen med øksen',
                kosterItem: 'oekse',
                effekt: () => { return udvindMeteorSkat('oekse'); }
            },
            {
                tekst: 'Brug sværdet som brækjern',
                kosterItem: 'svaerd',
                effekt: () => { return udvindMeteorSkat('svaerd'); }
            },
            {
                tekst: 'Hæld livseliksir over stenen for at køle den',
                kosterItem: 'livseliksir',
                effekt: () => { return udvindMeteorSkat('livseliksir'); }
            },
            {
                tekst: 'Grav denfri med hænderne>',
                effekt: () => { return udvindMeteorSkat('haender'); }
            },
            {
                tekst: 'Varmen er for intens. Opgiv det.',
                effekt: () => {
                    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
                    if (felt) felt.eventFuldført = false; 
                    syncTilDb(true);
                    return { logBesked: "Du skåner dig selv og dit udstyr og lader stenen ligge." };
                }
            }
        ]
    },

    'jordens_hjerte': {
        id: 'jordens_hjerte',
        titel: 'Sprækken i Dybet',
        tekst: 'Du ser en smal revne i jorden foran dig. Der stiger en dyb brummen op nede fra mørket, som om selve øen ligger og knurrer.',
        biome: ['bjerg', 'hule', 'hoejland'],
        billede: '/events/ev_bjerg.webp',
        unik: false,
        valg: [
            {
                tekst: 'Kast en fakkel ned i dybet',
                kosterItem: 'fakkel',
                effekt: () => {
                    udloesJordskaelv(spilTilstand.spillerIndex);
                    return { logBesked: "Faklen forsvinder i mørket. Et øjeblik efter rejser landskabet sig og gammle klipper, jord og ruiner stiger op. En nedgravet kiste flækker og drysser sit indhold ud.", guldOp: 160  };
                }
            },
            {
                tekst: 'Træd forsigtigt tilbage',
                effekt: () => {
                    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
                    if (felt) felt.eventFuldført = false;
                    syncTilDb(true);
                    return { logBesked: "Du lader kløften være og trækker dig tilbage i sikkerhed." };
                }
            }
        ]
    },

    'havets_alter': {
        id: 'havets_alter',
        titel: 'Det Sunkne Alter',
        tekst: 'Et slimet alter af drivtømmer og muslingeskaller står plantet i jorden. En mørk diamant står på en guldfod og pulserer i midten. Du har på fornemmelsen, at noget er galt.',
        biome: ['eng', 'mark', 'by', 'ruin'],
        billede: '/events/ev_hav.webp',
        unik: false,
        valg: [
            {
                tekst: 'Tag diamanten fra alteret',
                effekt: () => {
                    udloesOversvoemmelse(spilTilstand.spillerIndex);
                    return { logBesked: "Du river diamanten til dig! Sekundet efter rejser en massiv, sort mur af vand sig ude i horisonten.", guldOp: 10, itemUd: 'diamant' };
                }
            },
            {
                tekst: 'Lad offergaven ligge',
                effekt: () => {
                    const felt = spilTilstand.gitter[spilTilstand.spillerIndex];
                    if (felt) felt.eventFuldført = false;
                    syncTilDb(true);
                    return { logBesked: "Du lytter til din sunde fornuft og lader diamanten være." };
                }
            }
        ]
    },
};