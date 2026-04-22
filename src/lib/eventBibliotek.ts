// --- 1. ORDBOGEN (INTERFACES) ---
export interface Udfald {
    log: string; 
    aktionType: string; 
    vaerdi?: number;          // Til skade eller faste beløb
    multiplikator?: number;   // NY: Ganger den skjulte pulje op
    naesteTrin?: string;
}

export interface Valg {
    tekst: string;
    fordelItem?: string; 
    puljeVaerdi?: number;     
    aktionType?: string;
    vaerdi?: number; 
    chance?: number;
    failVaerdi?: number;
    naesteTrin?: string;
    udfald?: {
        katastrofe: Udfald;
        fiasko: Udfald;
        neutral: Udfald;
        succes: Udfald;
        mirakel: Udfald;
    };
}

export interface SpilEvent {
    id: string;
    biome: string | string[];
    titel: string;
    tekst: string;
    type: string;
    billede?: string;       // Svelte-motoren leder efter dette!
    billedeEfter?: string;  // Svelte-motoren leder efter dette!
    erSubTrin?: boolean;
    valg: Valg[];
}


// --- 2. SELVE KATALOGET OVER EVENTS ---
export const eventBibliotek: Record<string, SpilEvent> = {

'campfire': {
        id: 'campfire',
        biome: 'any',
        titel: 'Et forladt lejrbål',
        tekst: 'Asken er stadig varm. Du kan hvile her, men den rå kulde gør, at dine sår aldrig heler helt (Max 80 HP).',
        type: 'historie',
        valg: [
            {
                tekst: "Hvil ved bålet",
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: "Bålet luner dig. (+30 HP)", aktionType: 'hp_lejr', vaerdi: 30 },
                    fiasko: { log: "Bålet luner dig. (+30 HP)", aktionType: 'hp_lejr', vaerdi: 30 },
                    neutral: { log: "Bålet luner dig. (+30 HP)", aktionType: 'hp_lejr', vaerdi: 30 },
                    succes: { log: "Bålet luner dig. (+30 HP)", aktionType: 'hp_lejr', vaerdi: 30 },
                    mirakel: { log: "Bålet luner dig. (+30 HP)", aktionType: 'hp_lejr', vaerdi: 30 }
                }
            },
            {
                tekst: "Rod i asken efter noget værdifuldt",
                puljeVaerdi: 40,
                aktionType: 'guld_lejr', 
                udfald: {
                    katastrofe: { log: "Du brænder fingrene slemt på kullene.", aktionType: 'hp', vaerdi: -10, multiplikator: 0 },
                    fiasko: { log: "Du får kun aske i lungerne.", aktionType: 'hp', vaerdi: 0, multiplikator: 0 },
                    neutral: { log: "Du vrikker en enkelt mønt fri.", aktionType: 'guld', multiplikator: 1 },
                    succes: { log: "Nogen tabte deres pung i farten.", aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: "En massiv guldklump lå gemt under brændet.", aktionType: 'guld', multiplikator: 2.5 }
                }
            }
        ]
    },
    
    'blodeg_hoved': {
        id: 'blodeg_hoved',
        biome: ['blodskov', 'skov', 'mark', 'eng'],
        titel: 'Den Pulserende Egestamme',
        billede: '/events/blodeg1.webp', 
        tekst: 'En massiv egestamme ligger knækket over en dyb kløft. Tyk, rød saft pibler fra barken. Det lugter skarpt af jern. Nede i mørket under stammen glimter noget metallisk. Stammen ser rådden ud, men den er eneste vej over.',
        type: 'historie',
        valg: [
            {
                tekst: "Løb over stammen før den knækker under dig.",
                puljeVaerdi: 80,
                aktionType: 'fortsaet',
                naesteTrin: 'blodeg_loeb'
            },
            {
                tekst: "Brug tid på at hugge grene af til støtteben.",
                puljeVaerdi: 30,
                aktionType: 'fortsaet',
                naesteTrin: 'blodeg_stotte'
            },
            {
                tekst: "Kravl ned i kløften efter det blanke metal.",
                puljeVaerdi: 150,
                aktionType: 'fortsaet',
                naesteTrin: 'blodeg_kloeft'
            }
        ]
    },

    'blodeg_loeb': {
        id: 'blodeg_loeb',
        biome: 'any',
        titel: 'Flænger i Barken',
        billede: '/events/blodeg1.webp', 
        billedeEfter: '/events/blodeg1_efter.webp', 
        tekst: 'Træet skriger under din vægt. Rød saft sprøjter op om dine støvler. Du er halvvejs over, da et massivt stykke af stammen smuldrer og falder i dybet.',
        type: 'historie',
        erSubTrin: true,
        valg: [
            {
                tekst: "Tag sats og spring det sidste stykke mod kanten.",
                fordelItem: 'stav',
                puljeVaerdi: 20,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: "Du rammer kanten og skrider baglæns ned i mudderet.", aktionType: 'hp', vaerdi: -40, multiplikator: 0 },
                    fiasko: { log: "Du lander hårdt og vrider knæet.", aktionType: 'hp', vaerdi: -20, multiplikator: 0 },
                    neutral: { log: "Du ruller rundt på jorden og samler en håndfuld mønter op.", aktionType: 'guld', multiplikator: 1 },
                    succes: { log: "Et atletisk spring sender dig i sikkerhed.", aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: "Du lander perfekt oven på et tabt guldskrin.", aktionType: 'guld', multiplikator: 2.5 }
                }
            }
        ]
    },

    'blodeg_stotte': {
        id: 'blodeg_stotte',
        biome: 'any',
        titel: 'Det Metodiske Arbejde',
        billede: '/events/blodeg1.webp', 
        billedeEfter: '/events/blodeg1_efter.webp', 
        tekst: 'Du sikrer stammen. Broen er nu stabil nok til, at du kan undersøge det hule stykke midt på træet, hvor saften pibler tykkest.',
        type: 'historie',
        erSubTrin: true,
        valg: [
            {
                tekst: "Hak den røde bark op og træk indholdet ud.",
                fordelItem: 'oekse',
                puljeVaerdi: 40,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: "Træets saft er ætsende. Det brænder gennem dit tøj.", aktionType: 'hp', vaerdi: -25, multiplikator: 0 },
                    fiasko: { log: "Barken er stenhård. Du får vabler og splinter i fingrene.", aktionType: 'hp', vaerdi: -10, multiplikator: 0 },
                    neutral: { log: "Du vrikker et par mønter fri fra harpiksen.", aktionType: 'guld', multiplikator: 1 },
                    succes: { log: "Barken giver efter med et vådt smæld.", aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: "Et skjult rum åbner sig ind til stammens hjerte.", aktionType: 'guld', multiplikator: 2.5 }
                }
            }
        ]
    },

    'blodeg_kloeft': {
        id: 'blodeg_kloeft',
        biome: 'any',
        titel: 'Kløftens Grådighed',
        billede: '/events/blodeg1.webp', 
        billedeEfter: '/events/blodeg1_efter.webp', 
        tekst: 'Mudderet på bunden suger sig fast til dine ben. Mellem knogler og rådne blade stikker en tung, jernbeslået kiste frem. Stammen over dig svajer faretruende.',
        type: 'historie',
        erSubTrin: true,
        valg: [
            {
                tekst: "Træk kisten fri med brutal magt inden træet falder.",
                fordelItem: 'skovl',
                puljeVaerdi: 50,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: "Stammen styrter ned over dig og knuser kisten.", aktionType: 'hp', vaerdi: -60, multiplikator: 0 },
                    fiasko: { log: "Kisten sidder uhjælpeligt fast. Du når akkurat at undvige et faldende stykke træ.", aktionType: 'hp', vaerdi: -30, multiplikator: 0 },
                    neutral: { log: "Du sparker låget af og griber det øverste lag guld.", aktionType: 'guld', multiplikator: 1 },
                    succes: { log: "Kisten river sig løs fra mudderet.", aktionType: 'guld', multiplikator: 2 },
                    mirakel: { log: "Du slæber kisten i sikkerhed sekundet før kløften kollapser.", aktionType: 'guld', multiplikator: 3.5 }
                }
            }
        ]
    }
};