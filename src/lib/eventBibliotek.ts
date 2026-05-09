import { spilTilstand } from '$lib/spilTilstand.svelte';
import { syncTilDb } from './netvaerk';
import { bygOgHopGennemPortal, udvindMeteorSkat, udloesNaturkatastrofe } from './spilmotor';
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
        tekst: "En tung messingkikkert er støbt fast i en sten. En mekanisme klapper stramt om dit håndled, og en metallisk stemme rasler fra røret. 'Se fremtiden, eller bliv stående.' Du er tvunget til at vælge en linse for at komme fri.",
        valg: [
            { 
                tekst: "Flå armen ud og snup den lille linse", 
                effekt: () => {
                    return { 
                        logBesked: "Du trækker til med rå vold. Jernet flænser din hud. Du sidder nu fast med den lille kikkert i tasken.", 
                        hpNed: 10,
                        itemUd: 'kikkert_45'
                    };
                } 
            },
            { 
                tekst: "Spark mekanismen i stykker og tag den store linse", 
                effekt: () => {
                    return { 
                        logBesked: "Du hamrer støvlen mod soklen, til den giver slip. Slaget forstuver din fod, men du har nu den store kikkert.", 
                        hpNed: 10,
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            { 
                tekst: "Lirk fjedrene lydløst med din kniv", 
                kraeverItem: 'kniv', 
                effekt: () => {
                    return { 
                        logBesked: "Klingen glider ind i mekanismen og udløser låsen. Du tager den store kikkert helt uden at få skrammer.", 
                        itemUd: 'kikkert_250'
                    };
                } 
            },
            {
                tekst: "Opløs maskineriet med ren eliksir",
                kosterItem: 'livseliksir',
                effekt: () => {
                    return { 
                        logBesked: "Den kraftige væske ætser messingrøret væk. Mekanismen falder fra hinanden, og du opdager, at begge linser i virkeligheden er enorme diamanter.",
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
                tekst: "Kast dig blindt ind i magien", 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Magien slår rod og materialiserer en portal. Du kastes blindt fremad over øen til flængens udgang." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Sprækken afviser dig brutalt, men spytter gamle mønter ud i græsset.", guldOp: guld };
                    } else {
                        return { logBesked: "Magien kollapser under dig. Du kastes hårdt mod jorden.", hpNed: 8 };
                    }
                } 
            },
            { 
                tekst: "Anker dig selv med et tungt våben", 
                kraeverItem: 'svaerd', 
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Sværdet styrer dit spring. Magien forankres i jorden bag dig som en permanent portal." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 11) + 10;
                        return { logBesked: "Sprækken vibrerer og kaster skjulte mønter ud til dig.", guldOp: guld };
                    } else {
                        return { logBesked: "Revnen lukker sig om klingen og forsvinder. Du trækker våbnet til dig uden at tage skade." };
                    }
                } 
            },
            { 
                tekst: "Smid 20 guld ind som et indskud", 
                puljeVaerdi: 20,
                effekt: () => {
                    const rul = Math.random();
                    if (rul < 0.50) {
                        bygOgHopGennemPortal();
                        return { logBesked: "Mønterne brænder op. Lyset sluger dig, flytter dig frem og forvandler luften til ægte portaler." };
                    } else if (rul < 0.75) {
                        const guld = Math.floor(Math.random() * 51) + 100; 
                        return { logBesked: "Sprækken returnerer dit indskud med ekstreme renter.", guldOp: guld };
                    } else {
                        return { logBesked: "Sprækken sluger dine penge og lukker sig med et hånligt smæld." };
                    }
                } 
            },
            {
                tekst: "Vend ryggen til den ustabile magi",
                effekt: () => {
                    return { logBesked: "Du ignorerer flimmeret og fortsætter sikkert til fods." };
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
                        hpNed: 12,
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
    }
};