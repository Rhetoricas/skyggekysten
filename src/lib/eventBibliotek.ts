// eventBibliotek.ts
import type { Biome } from './types';

export interface Udfald {
    log: string; 
    hpAendring?: number;
    maxHpAendring?: number; // <--- NY VARIABEL TILFØJET
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
    kraeverKarakter?: string; 
    gemtForKarakter?: string; 
    fordelItem?: string;      
    fordelKarakter?: string;  
    puljeVaerdi?: number;     
    naesteTrin?: string;      
    udfaldListe?: Udfald[];   
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
    
    // <--- HER ER DET NYE ALTER
    'blodalter': {
        id: 'blodalter',
        titel: "Det Røde Alter",
        tekst: "En pulserende sten står midt i lysningen. Indgraveringerne lover dig en pose guld, hvis du ofrer en flig af din vitalitet. Alteret ser ud til at kunne sluge din styrke permanent.",
        biome: ['ruin', 'blodskov'],
        billede: '/events/ev_alter.webp',
        unik: false,
        valg: [
            {
                tekst: "Lad alteret suge dit blod (Mist 15 Max HP)",
                udfaldListe: [
                    { log: "Du presser hænderne mod stenen. Maskinen trækker vejret. Du føler dig svagere, men alteret spytter mønter ud.", maxHpAendring: -15, guldAendring: 60 }
                ]
            },
            {
                tekst: "Gå derfra",
                udfaldListe: [
                    { log: "Du vender ryggen til stenen og sparer dit kød." }
                ]
            }
        ]
    },

    'stjernekikkert': {
        id: "stjernekikkert",
        biome: ["bjerg", "mark", "ruin"],
        titel: "Den Forbandede Stjernekikkert",
        tekst: "Du snubler over en kasse beklædt med mørkt fløjl. Indeni ligger en stjernekikkert af massivt guld. Den virker utrolig dragende. Du mærker en trang til at se verden gennem dens linser.",
        valg: [
            {
                tekst: "Kig gennem okularet",
                udfaldListe: [
                    { log: "Verden maser sig brutalt op i ansigtet på dig. Du slæber den tunge kikkert med dig.", givItem: "kikkert_250" }
                ]
            },
            {
                tekst: "Smadr kikkerten med dit våben",
                kraeverItem: "oekse",
                udfaldListe: [
                    { log: "Glasset splintres. Indeni røret lå en massiv diamant gemt som en prisme.", givItem: "diamant" }
                ]
            }
        ]
    },  
    
    'koedvuggen': {
        id: 'koedvuggen',
        titel: "Kødvuggen",
        tekst: "En enorm egestamme er flækket på langs. Indeni pulserer en varm masse af sener. Den ånder tungt, og rødderne er filtrede ind i rustne sværd fra tidligere ofre.",
        biome: ['skov', 'mark'],
        unik: true,
        valg: [
            {
                tekst: "Hæld eliksir i massen for at vække den",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "Træet kramper og trækker rødderne til side. En vej åbner sig ind i stammen.", naesteTrin: 'koedvuggen_indre' }]
            },
            {
                tekst: "Skær rødderne over med vold",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Stammen skriger. Vævet sprøjter syre på dine arme, mens du kæmper dig fri.", hpAendring: -25, naesteTrin: 'koedvuggen_kamp' }]
            }
        ]
    },

    'koedvuggen_indre': {
        id: 'koedvuggen_indre',
        titel: "Træets Hjerte",
        tekst: "Dybt inde i egestammen finder du et pulserende organ af rent lys. Det lugter af råddenskab og uendeligt liv på samme tid.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Ofre dit sværd for at løsne organet",
                kosterItem: 'svaerd',
                udfaldListe: [{ log: "Klingen brækker, men du får organet fri. Det forvandles til en massiv diamant i dine hænder.", givItem: 'diamant' }]
            },
            {
                tekst: "Spis en bid af det levende væv",
                udfaldListe: [
                    { log: "Dine sår lukker sig eksplosivt. Din krop genfødes.", hpAendring: 100 },
                    { log: "Kødet er giftigt. Du falder om i kramper.", kollaps: true }
                ]
            }
        ]
    },

    'koedvuggen_kamp': {
        id: 'koedvuggen_kamp',
        titel: "Skoven Hævner",
        tekst: "Rødderne strammer grebet. Træet vil ikke lade dig gå, før det har fået kød for sit blod.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Brænd rødderne med en fakkel",
                kraeverItem: 'fakkel',
                udfaldListe: [{ log: "Ilden spreder sig. Træet dør i smerte og taber en pose guld i asken.", guldAendring: 120 }]
            },
            {
                tekst: "Kæmp imod med de bare næver",
                udfaldListe: [{ log: "Du tæver løs på senerne. Træet knuser dit ribben, før det giver op. Du river et sværd fri.", hpAendring: -40, givItem: 'svaerd' }]
            }
        ]
    },

    'sumpens_lunge': {
        id: 'sumpens_lunge',
        titel: "Sumpens Lunge",
        tekst: "Jorden hæver og sænker sig. En gennemsigtig blære stikker op af mudderet og filtrerer luften. Hver gang den puster ud, regner det med små mønter.",
        biome: ['eng', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Begrav lungen levende",
                kraeverItem: 'skovl',
                udfaldListe: [{ log: "Du kaster mudder over blæren. Du plyndrer lungens overflade for skinnende guld.", guldAendring: 100 }]
            },
            {
                tekst: "Kvæl den med dine klude",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Blæren sprænges med et brag og afslører en diamant dybt nede i krateret.", givItem: 'diamant' }]
            }
        ]
    },

    'parasitmarkedet': {
        id: 'parasitmarkedet',
        titel: "Krybet i Jernet",
        tekst: "En ridderrustning knæler i gruset. Det er ikke en mand indeni, men et mylder af hvide orme, der rasler med en pung.",
        biome: ['ruin', 'slagmark'],
        unik: true,
        valg: [
            {
                tekst: "Byd dem din arm og betal med blod",
                udfaldListe: [{ log: "Kulden spreder sig, men de rækker dig pungen.", hpAendring: -40, naesteTrin: 'parasit_pungen' }]
            },
            {
                tekst: "Smid fint tøj over dem som bo",
                kosterItem: 'flot_toej',
                udfaldListe: [{ log: "Ormene elsker silken og forlader rustningen.", naesteTrin: 'parasit_rustning' }]
            }
        ]
    },

    'parasit_pungen': {
        id: 'parasit_pungen',
        titel: "Blodets Bytte",
        tekst: "Du har pungen. Noget bevæger sig inde i læderet.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Åbn pungen med kniven",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Du finder en massiv diamant gemt i en klump kød.", givItem: 'diamant' }]
            },
            {
                tekst: "Hæld indholdet ud",
                udfaldListe: [{ log: "Det er hundredevis af guldtænder.", guldAendring: 150 }]
            }
        ]
    },

    'parasit_rustning': {
        id: 'parasit_rustning',
        titel: "Det Tomme Panser",
        tekst: "Rustningen ligger forladt. Den er dækket af ætsende slim.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Rens det med eliksir først",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "Syren neutraliseres. Du får en perfekt rustning.", givItem: 'rustning' }]
            },
            {
                tekst: "Tag den på med det samme",
                udfaldListe: [{ log: "Syren ætser din hud, men rustningen sidder fast nu.", hpAendring: -30, givItem: 'rustning' }]
            }
        ]
    },

    'de_omfavnede': {
        id: 'de_omfavnede',
        titel: "Den Evige Omfavnelse",
        tekst: "To skeletter er syet sammen af rødder. Mellem deres ribben hænger en diamant.",
        biome: ['skov', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Hug ribbenene over",
                kraeverItem: 'svaerd',
                udfaldListe: [{ log: "En sky af giftige sporer siver ud fra deres lunger.", hpAendring: -20, naesteTrin: 'omfavnelse_sporer' }]
            },
            {
                tekst: "Grav dem fri",
                kraeverItem: 'skovl',
                udfaldListe: [{ log: "Du finder en skjult kiste under dem.", naesteTrin: 'omfavnelse_kiste' }]
            }
        ]
    },

    'omfavnelse_sporer': {
        id: 'omfavnelse_sporer',
        titel: "Dødens Åndedræt",
        tekst: "Sporerne slører dit syn. Skeletterne begynder at vågne.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Løb for livet",
                udfaldListe: [{ log: "Du falder og slår dig i mørket, men stikker af med stenen.", hpAendring: -30, givItem: 'diamant' }]
            },
            {
                tekst: "Kast din kappe over dem",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Støvet lægger sig. Du står med diamanten i sikkerhed.", givItem: 'diamant' }]
            }
        ]
    },

    'omfavnelse_kiste': {
        id: 'omfavnelse_kiste',
        titel: "Kistens Forbandelse",
        tekst: "Kisten er tung. Mønter klirrer indeni.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Spræng låsen med en fakkel",
                kraeverItem: 'fakkel',
                udfaldListe: [{ log: "Låsen smelter. Kisten er fyldt med guld og en livseliksir.", guldAendring: 200, givItem: 'livseliksir' }]
            },
            {
                tekst: "Dirk den op med kniven",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Kniven brækker, men kisten åbner sig.", guldAendring: 100, givItem: 'oekse' }]
            }
        ]
    },

    'enkens_byrde': {
        id: 'enkens_byrde',
        titel: "Enkens Fodring",
        tekst: "En kvinde skærer dybe snit i sine underarme og lader blodet dryppe ned i et krater.",
        biome: ['mark', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Spark hende ned til udyret",
                udfaldListe: [{ log: "Kæberne smækker i. Udyret skubber hendes taske op.", guldAendring: 60, naesteTrin: 'enken_bunden' }]
            },
            {
                tekst: "Forbind hendes sår",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Udyret i mørket sulter og kravler op mod jer.", naesteTrin: 'enken_angreb' }]
            }
        ]
    },

    'enken_bunden': {
        id: 'enken_bunden',
        titel: "Taskens Hemmelighed",
        tekst: "Tasken er dækket af blod og lugter af kemikalier.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Åbn den forsigtigt",
                udfaldListe: [{ log: "Giftig gas rammer dig. Du hoster blod, men finder en diamant.", hpAendring: -30, givItem: 'diamant' }]
            },
            {
                tekst: "Smadr låsen med din skovl",
                kraeverItem: 'skovl',
                udfaldListe: [{ log: "Tasken sprænger åben. Gassen siver ud ufarligt.", guldAendring: 100 }]
            }
        ]
    },

    'enken_angreb': {
        id: 'enken_angreb',
        titel: "Mørkets Sult",
        tekst: "Bæstet trækker sig op fra krateret. Det lugter dit blod.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Bloker dets kæber med øksen",
                kosterItem: 'oekse',
                udfaldListe: [{ log: "Bæstet kvæles. Kvinden afleverer en kostbar genstand i taknemmelighed.", givItem: 'diamant' }]
            },
            {
                tekst: "Kast 100 guld i gabet",
                puljeVaerdi: 100,
                udfaldListe: [{ log: "Metallet forvirrer bæstet. Det spytter syre efter dig og forsvinder.", hpAendring: -15, givItem: 'rustning' }]
            }
        ]
    },

    'spejlets_gaade': {
        id: 'spejlets_gaade',
        titel: "Sort Obsidian",
        tekst: "Et enormt spejl af sort glas spærrer stien. Din refleksion bløder fra øjnene.",
        biome: ['ruin', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Giv refleksionen dit sværd",
                kosterItem: 'svaerd',
                udfaldListe: [{ log: "Glasset flyder som vand og åbner sig.", naesteTrin: 'spejlet_gave' }]
            },
            {
                tekst: "Knus spejlet med din økse",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Glasset splintres i skår, der borer sig ind i dig.", hpAendring: -35, naesteTrin: 'spejlet_skår' }]
            }
        ]
    },

    'spejlet_gave': {
        id: 'spejlet_gave',
        titel: "Bag Glasset",
        tekst: "Refleksionen rækker dig noget koldt tilbage.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Tag imod gaven",
                udfaldListe: [{ log: "Du modtager en diamant med sort lys.", givItem: 'diamant' }]
            },
            {
                tekst: "Kræv dit sværd tilbage",
                udfaldListe: [{ log: "Spejlet eksploderer. Du får dit sværd, men skæres slemt.", hpAendring: -25, givItem: 'svaerd' }]
            }
        ]
    },

    'spejlet_skår': {
        id: 'spejlet_skår',
        titel: "Guld i Skårene",
        tekst: "Noget glimter i de sorte glasskår på jorden.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Saml alt op trods smerterne",
                udfaldListe: [{ log: "Dine hænder skæres op. Du finder både guld og diamant.", hpAendring: -20, guldAendring: 150, givItem: 'diamant' }]
            },
            {
                tekst: "Brug din kappe til at feje skårene",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Stoffet rives i stykker, men du samler mønter fra støvet.", guldAendring: 80 }]
            }
        ]
    },

    'den_svigtede_brud': {
        id: 'den_svigtede_brud',
        titel: "Den Svigtede Brud",
        tekst: "En kvinde i brudekjole sidder på en kiste med kløer som klinger.",
        biome: ['by', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Tilbyd dit fine tøj",
                kosterItem: 'flot_toej',
                udfaldListe: [{ log: "Hun lader dig tage den diamant, hendes mand skulle have haft.", givItem: 'diamant' }]
            },
            {
                tekst: "Skær kisten fri med magt",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Hendes kløer flænger din arm.", hpAendring: -25, naesteTrin: 'brudens_kiste' }]
            }
        ]
    },

    'brudens_kiste': {
        id: 'brudens_kiste',
        titel: "Medgiftens Pris",
        tekst: "Kvinden angriber dig. Kistens indhold ligger spredt i mudderet.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Kæmp og dræb hende",
                kraeverItem: 'svaerd',
                udfaldListe: [{ log: "Du fælder hende og samler formuen op.", guldAendring: 140 }]
            },
            {
                tekst: "Grib tøj og guld, og flygt",
                udfaldListe: [{ log: "Hun river dig i ryggen. Du slipper væk med lidt bytte.", hpAendring: -20, guldAendring: 50, givItem: 'flot_toej' }]
            }
        ]
    },

    'alkymistens_sorg': {
        id: 'alkymistens_sorg',
        titel: "Alkymistens Sorg",
        tekst: "En mand knæler over sin syge mand. Han mangler en ren ingrediens.",
        biome: ['eng', 'mark'],
        unik: true,
        valg: [
            {
                tekst: "Doner din eliksir",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "Manden reddes. Alkymisten tømmer sit kasseapparat for dig.", guldAendring: 200 }]
            },
            {
                tekst: "Tru ham væk",
                kraeverItem: 'bue',
                udfaldListe: [{ log: "Han beskytter sin mand. Du presser ham væk.", naesteTrin: 'alkymistens_valg' }]
            }
        ]
    },

    'alkymistens_valg': {
        id: 'alkymistens_valg',
        titel: "Tyveriet",
        tekst: "Bordet flyder med kemikalier og en enkelt glitrende sten.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Tag stenen",
                udfaldListe: [{ log: "Alkymisten kaster syre på dig. Du mister hud, men får stenen.", hpAendring: -40, givItem: 'diamant' }]
            },
            {
                tekst: "Stjæl hans våben",
                udfaldListe: [{ log: "Du snupper en sabel fra gulvet og lader dem være.", givItem: 'sabel' }]
            }
        ]
    },

    'de_adskilte_elskende': {
        id: 'de_adskilte_elskende',
        titel: "Afgrundens Kærlighed",
        tekst: "En rustning ligger fastklemt nede i mørket i en dyb revne.",
        biome: ['bjerg', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Brug din stav som bro",
                kosterItem: 'stav',
                udfaldListe: [{ log: "Træet knækker. Du henter rustningen, men våbnet er ødelagt.", givItem: 'rustning' }]
            },
            {
                tekst: "Hop ned efter byttet",
                udfaldListe: [{ log: "Du rammer bunden hårdt og vrider om på foden.", hpAendring: -30, naesteTrin: 'kloeften_bund' }]
            }
        ]
    },

    'kloeften_bund': {
        id: 'kloeften_bund',
        titel: "Bunden af Revnen",
        tekst: "Mørket omslutter dig. Metallet er tæt på.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Tænd din fakkel",
                kosterItem: 'fakkel',
                udfaldListe: [{ log: "Lyset fanger en diamant. Du hakker den fri.", givItem: 'diamant' }]
            },
            {
                tekst: "Føl dig frem i mørket",
                udfaldListe: [{ log: "Du flænger hænderne, men finder guld og en skovl.", hpAendring: -15, guldAendring: 90, givItem: 'skovl' }]
            }
        ]
    },

    'hjerteslaget_i_muld': {
        id: 'hjerteslaget_i_muld',
        titel: "Det Levende Mudder",
        tekst: "Jorden pulserer i en langsom rytme over en grav.",
        biome: ['skov', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Grav dem op",
                kraeverItem: 'skovl',
                udfaldListe: [{ log: "Jorden begynder at bløde kraftigt.", naesteTrin: 'hjertets_blod' }]
            },
            {
                tekst: "Scan overfladen",
                kraeverItem: 'metaldetektor',
                udfaldListe: [{ log: "Du lader de døde hvile og tager det øverste lag guld.", guldAendring: 70 }]
            }
        ]
    },

    'hjertets_blod': {
        id: 'hjertets_blod',
        titel: "Gravrøveriet",
        tekst: "En diamant hviler på den døde kones bryst. Jorden bløder.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Riv stenen og guldet fri",
                udfaldListe: [{ log: "Rådne hænder griber dig. Du river dig fri, men betaler med blod.", hpAendring: -40, guldAendring: 50, givItem: 'diamant' }]
            },
            {
                tekst: "Sug blodet op",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Jorden lukker dine sår med en helende varme.", hpAendring: 80 }]
            }
        ]
    },

    'forraederens_loefte': {
        id: 'forraederens_loefte',
        titel: "Forræderens Løfte",
        tekst: "En mand ligger under en trækvogn med guld. Han lover halvdelen for hjælp.",
        biome: ['by', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Hæld eliksir på ham",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "Han rejser sig op med posen i hånden.", naesteTrin: 'forraederens_sandhed' }]
            },
            {
                tekst: "Hug armen af ham",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "En skjult armbrøst rammer dig, men du får byttet.", hpAendring: -30, givItem: 'rustning' }]
            }
        ]
    },

    'forraederens_sandhed': {
        id: 'forraederens_sandhed',
        titel: "Opgøret",
        tekst: "Manden trækker en kniv.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Kræv guldet",
                udfaldListe: [{ log: "Han stikker dig i maven. Du flår en diamant fra ham.", hpAendring: -40, givItem: 'diamant' }]
            },
            {
                tekst: "Træk våben",
                kraeverItem: 'svaerd',
                udfaldListe: [{ log: "Han smider halvdelen af guldet og flygter.", guldAendring: 100 }]
            }
        ]
    },

    'blind_tillid': {
        id: 'blind_tillid',
        titel: "Blind Tillid",
        tekst: "Et væsen blokerer ruinen. Det kræver dit våben som garanti.",
        biome: ['ruin', 'hule'],
        unik: true,
        valg: [
            {
                tekst: "Aflever dit sværd",
                kosterItem: 'svaerd',
                udfaldListe: [{ log: "Væsenet begynder at guide dig.", naesteTrin: 'guidens_sti' }]
            },
            {
                tekst: "Brug detektor",
                kraeverItem: 'metaldetektor',
                udfaldListe: [{ log: "Du efterlader væsenet og tømmer ruinen.", guldAendring: 120 }]
            }
        ]
    },

    'guidens_sti': {
        id: 'guidens_sti',
        titel: "Ruinens Hjerte",
        tekst: "Væsenet holder dit sværd truende hævet foran en diamant.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Kast dig over stenen",
                udfaldListe: [{ log: "Sværdet flænger din side, men stenen er din.", hpAendring: -45, givItem: 'diamant' }]
            },
            {
                tekst: "Forlad ruinen",
                udfaldListe: [{ log: "Væsenet rækker dig en skjult eliksir som tak for freden.", givItem: 'livseliksir' }]
            }
        ]
    },

    'giftig_alliance': {
        id: 'giftig_alliance',
        titel: "Dødvandet",
        tekst: "To forgiftede lejesvende nægter at bytte diamant og modgift.",
        biome: ['slagmark', 'mark'],
        unik: true,
        valg: [
            {
                tekst: "Optræd som mægler",
                udfaldListe: [{ log: "Du tager stenen og flasken.", naesteTrin: 'maeglerens_valg' }]
            },
            {
                tekst: "Skyd dem",
                kraeverItem: 'bue',
                udfaldListe: [{ log: "De udløser en bombe, men du overlever med stenen.", hpAendring: -35, givItem: 'diamant' }]
            }
        ]
    },

    'maeglerens_valg': {
        id: 'maeglerens_valg',
        titel: "Fragten af Værdier",
        tekst: "Du står med diamanten og kuren.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Gennemfør ærligt",
                udfaldListe: [{ log: "De overlever og donerer deres mønter til dig.", guldAendring: 180 }]
            },
            {
                tekst: "Drik kuren og stik af",
                udfaldListe: [{ log: "Du får enorm energi, men de kaster knive i din ryg.", hpAendring: 50, givItem: 'diamant' }]
            }
        ]
    },

    'faeldens_lokkemad': {
        id: 'faeldens_lokkemad',
        titel: "Kistens Stemme",
        tekst: "En stemme fra en kiste hævder at være et fanget barn.",
        biome: ['skov', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Stik armen ind",
                udfaldListe: [{ log: "Skarpe tænder smækker om dit håndled.", naesteTrin: 'kistens_krav' }]
            },
            {
                tekst: "Smadr kisten",
                kosterItem: 'skovl',
                udfaldListe: [{ log: "Et monster ligger dødt indeni med sit guld.", guldAendring: 90 }]
            }
        ]
    },

    'kistens_krav': {
        id: 'kistens_krav',
        titel: "Kødets Løsesum",
        tekst: "Kisten vil have noget hårdt i bytte for dit kød.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Fodr den med rustningen",
                kosterItem: 'rustning',
                udfaldListe: [{ log: "Kæberne slipper. Den spytter en diamant ud.", givItem: 'diamant' }]
            },
            {
                tekst: "Flå armen ud",
                udfaldListe: [{ log: "Tænderne skærer. Du flår guld og sten med ud.", hpAendring: -30, guldAendring: 60, givItem: 'diamant' }]
            }
        ]
    },

    'moerkets_gidsel': {
        id: 'moerkets_gidsel',
        titel: "Under Vognen",
        tekst: "En trævogn klemmer en minearbejder fast.",
        biome: ['hule', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Løft vognen",
                udfaldListe: [{ log: "Dine muskler rives over. Han afleverer pungen.", hpAendring: -30, naesteTrin: 'gidsel_tak' }]
            },
            {
                tekst: "Lad ham dø",
                udfaldListe: [{ log: "Pungen rummer hans formue.", guldAendring: 100 }]
            }
        ]
    },

    'gidsel_tak': {
        id: 'gidsel_tak',
        titel: "Læderpungen",
        tekst: "Du har pungen i hånden.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Åbn den",
                udfaldListe: [{ log: "Indeni ligger en diamant.", givItem: 'diamant' }]
            },
            {
                tekst: "Sælg pungen lukket",
                udfaldListe: [{ log: "Købmænd betaler godt for minernes fund.", guldAendring: 200 }]
            }
        ]
    },

    'sultne_krystaller': {
        id: 'sultne_krystaller',
        titel: "Splintret Glas",
        tekst: "Krystaller skyder splinter efter alt. En mand i rustning ligger død.",
        biome: ['hule', 'krystal'],
        unik: true,
        valg: [
            {
                tekst: "Kast din fakkel",
                kosterItem: 'fakkel',
                udfaldListe: [{ log: "Du afmonterer rustningen uden en skramme.", givItem: 'rustning' }]
            },
            {
                tekst: "Sprint ind",
                udfaldListe: [{ log: "Splinterne rammer dig, men du tager rustningen.", hpAendring: -35, givItem: 'rustning', naesteTrin: 'krystal_svaerd' }]
            }
        ]
    },

    'krystal_svaerd': {
        id: 'krystal_svaerd',
        titel: "Våbnet i Blodet",
        tekst: "Et sværd ligger i mandens indtørrede blod.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Rens det med klude",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Du afslører et perfekt balanceret sværd.", givItem: 'svaerd' }]
            },
            {
                tekst: "Tør det i tøjet",
                udfaldListe: [{ log: "Blodet smitter dig med sygdom.", hpAendring: -15, givItem: 'svaerd' }]
            }
        ]
    },

    'den_blinde_moder': {
        id: 'den_blinde_moder',
        titel: "Bæstets Rede",
        tekst: "Et enormt bæst sover på en bunke guld. Ungerne snøfter omkring benene.",
        biome: ['hule', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Fodr ungerne med eliksir",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "De falder i søvn. Du tømmer reden.", guldAendring: 250 }]
            },
            {
                tekst: "Træk byttet med din stav",
                kraeverItem: 'stav',
                udfaldListe: [{ log: "Bæstet vågner og flænger dig, men du snupper et våben.", hpAendring: -25, givItem: 'sabel', naesteTrin: 'moder_flugt' }]
            }
        ]
    },

    'moder_flugt': {
        id: 'moder_flugt',
        titel: "Trækisten i Mørket",
        tekst: "Du flygter til en trækiste i mørket.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Slå låsen med øksen",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Træet splintres. Du finder en diamant og guld.", guldAendring: 60, givItem: 'diamant' }]
            },
            {
                tekst: "Dirk låsen",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Du ridser låsen op og belønnes med mønter.", guldAendring: 80 }]
            }
        ]
    },

    'giftkilden': {
        id: 'giftkilden',
        titel: "Den Sorte Syre",
        tekst: "En diamant ligger på bunden af sort syre.",
        biome: ['hule', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Fisk stenen med skovl",
                kosterItem: 'skovl',
                udfaldListe: [{ log: "Skovlen ætses, men stenen er din.", givItem: 'diamant' }]
            },
            {
                tekst: "Ræk armen i",
                udfaldListe: [{ log: "Syren brænder huden væk.", hpAendring: -40, givItem: 'diamant', naesteTrin: 'kildens_bund' }]
            }
        ]
    },

    'kildens_bund': {
        id: 'kildens_bund',
        titel: "Syrens Ekstra Præmie",
        tekst: "Du rører ved metal på bunden.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Træk genstanden op",
                udfaldListe: [{ log: "Smerten forværres. Du hiver et sværd og lidt guld op.", hpAendring: -10, guldAendring: 40, givItem: 'svaerd' }]
            },
            {
                tekst: "Træk armen til dig",
                udfaldListe: [{ log: "Du fokuserer på overlevelse." }]
            }
        ]
    },

    'stenens_tyngde': {
        id: 'stenens_tyngde',
        titel: "Klippens Vægt",
        tekst: "En sten hviler usikkert over en detektor.",
        biome: ['hule', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Sikr stenen med sværd",
                kosterItem: 'svaerd',
                udfaldListe: [{ log: "Klingen holder stenen. Du tager maskinen.", givItem: 'metaldetektor' }]
            },
            {
                tekst: "Tag chancen",
                udfaldListe: [{ log: "Stenen skrider og knuser din fod.", hpAendring: -30, givItem: 'metaldetektor', naesteTrin: 'krigerens_arv' }]
            }
        ]
    },

    'krigerens_arv': {
        id: 'krigerens_arv',
        titel: "Sprækken i Klippen",
        tekst: "Foden bløder. En sprække lyser blåt.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Fiks foden med klude",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Kroppen belønner dig for at stoppe blødningen.", hpAendring: 30 }]
            },
            {
                tekst: "Hug klippen med økse",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Du finder en diamant, men blodtabet svækker dig.", hpAendring: -15, givItem: 'diamant' }]
            }
        ]
    },

    'den_druknede_galej': {
        id: 'den_druknede_galej',
        titel: "Den Druknede Galej",
        tekst: "En kiste er viklet ind i tovværk under vandet. Brandmænd pulserer omkring.",
        biome: ['hav'],
        unik: true,
        valg: [
            {
                tekst: "Dæk brandmændene med rustning",
                kosterItem: 'rustning',
                udfaldListe: [{ log: "Metallet tager trådene med ned. Du finder guld.", guldAendring: 180 }]
            },
            {
                tekst: "Brug kniven",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Trådene svier smertefuldt. Du kapper tovet.", hpAendring: -10, naesteTrin: 'galejens_vraggods' }]
            }
        ]
    },

    'galejens_vraggods': {
        id: 'galejens_vraggods',
        titel: "Våd Valuta",
        tekst: "Kisten åbnes. Vandet fosser ind.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Grib den skinnende sten",
                udfaldListe: [{ log: "Du tager stenen og lidt guldmønter i farten.", guldAendring: 40, givItem: 'diamant' }]
            },
            {
                tekst: "Tag logbogen",
                udfaldListe: [{ log: "Bogen indeholder en intakt medicin.", givItem: 'livseliksir' }]
            }
        ]
    },

    'det_flydende_alter': {
        id: 'det_flydende_alter',
        titel: "Det Flydende Alter",
        tekst: "En udtørret skikkelse på en flåde rækker en lukket muslingeskal frem.",
        biome: ['hav'],
        unik: true,
        valg: [
            {
                tekst: "Læg 100 guld i skålen",
                puljeVaerdi: 100,
                udfaldListe: [{ log: "Han åbner muslingen og rækker dig en diamant.", givItem: 'diamant' }]
            },
            {
                tekst: "Slå ham med staven",
                kraeverItem: 'stav',
                udfaldListe: [{ log: "Han plasker hjælpeløst. Du stjæler skallen.", naesteTrin: 'muslingens_hemmelighed' }]
            }
        ]
    },

    'muslingens_hemmelighed': {
        id: 'muslingens_hemmelighed',
        titel: "Forseglet af Havet",
        tekst: "Skallen er låst stramt fast af kalk.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Bræk den med skovlen",
                kosterItem: 'skovl',
                udfaldListe: [{ log: "Skaftet knækker. Du trækker en kappe ud.", givItem: 'flot_toej' }]
            },
            {
                tekst: "Tving den op",
                udfaldListe: [{ log: "Den ru overflade river dine negle, men du får diamanten.", hpAendring: -15, givItem: 'diamant' }]
            }
        ]
    },

'campfire': {
        id: 'campfire',
        titel: "Fremmed Lejr",
        tekst: "En flok vejrbidte rejsende varmer hænderne over et knitrende bål. De stirrer stift på dig. Lederen nikker mod en ledig plads og kræver betaling for at lade dig sove i deres cirkel.",
        biome: ['eng', 'skov', 'mark', 'bjerg', 'gen'],
        billede: '/events/ev_campfire.webp', 
        unik: false,
        valg: [
            {
                tekst: "Køb dig til en nats ro (20 Guld)",
                puljeVaerdi: 20,
                udfaldListe: [
                    { log: "De holder ord. Varmen og sikkerheden lader dine sår hele natten over.", hpAendring: 50 },
                                        { log: "De holder ord. Varmen og sikkerheden lader dine sår hele natten over.", hpAendring: 50 },
                                                            { log: "De holder ord. Varmen og sikkerheden lader dine sår hele natten over.", hpAendring: 50 },
                    { log: "Det var en fælde. Du vågner ved at de gennemtæver dig og sparker dig ud i mørket.", hpAendring: -25 }
                ]
            },
{
    tekst: "Del din eliksir med gruppen",
    kosterItem: 'livseliksir',
    udfaldListe: [
        { 
            log: "Du varmer eliksiren over bålet for at gøre den stærkere og deler den gerne. De giver dig dit guld tilbage og holder vagt, mens du sover tungt og genvinder alle kræfter.", 
            hpAendring: 100, 
            guldAendring: 20 
        }
    ]
}
        ]
    },

    'pyramidespillet': {
        id: 'pyramidespillet',
        titel: "Visionærens Trone",
        tekst: "En mand i mudret silke står på en høj af dyreknogler. Han taler rasende hurtigt om en unik investering. Han påstår, at du bliver øens ukronede konge, hvis du skyder kapital i hans projekt.",
        biome: ['by', 'marked'],
        unik: true,
        valg: [
            {
                tekst: "Invester 150 guld i hans vision",
                puljeVaerdi: 150,
                udfaldListe: [{ log: "Han griner højt og kaster et 'ejerbevis' ned til dig, før han forsvinder. Beviset er en massiv, ubeskåret diamant.", givItem: 'diamant' }]
            },
            {
                tekst: "Skub ham ned fra tronen",
                udfaldListe: [{ log: "Han styrter ned og brækker nakken. To skjulte lejesvende springer frem og angriber dig for at beskytte kassen.", hpAendring: -30, naesteTrin: 'pyramide_plyndring' }]
            }
        ]
    },

    'pyramide_plyndring': {
        id: 'pyramide_plyndring',
        titel: "Det Knuste Imperium",
        tekst: "Lejesvendene ligger blødende i mudderet. Svindlerens trækasse står ubevogtet tilbage på toppen af højen.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Spark kassen op",
                udfaldListe: [{ log: "Indeni ligger midlerne fra alle hans tidligere ofre. Det er en formidabel sum.", guldAendring: 180 }]
            },
            {
                tekst: "Søg ligene for udstyr",
                udfaldListe: [{ log: "Du lader kassen stå og trækker i stedet en perfekt sabel ud af lejesvendens stive greb.", givItem: 'sabel' }]
            }
        ]
    },

    'arkitektens_storhedsvanvid': {
        id: 'arkitektens_storhedsvanvid',
        titel: "Paladset i Mudderet",
        tekst: "En arrogant bygherre beordrer dig til at udlevere dit værktøj. Han peger på en sunken marmorbue og insisterer på, at hans mesterværk blot mangler et par timers udgravning.",
        biome: ['ruin', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Aflever din skovl til projektet",
                kosterItem: 'skovl',
                udfaldListe: [{ log: "Han graver fanatisk og underminerer en bærende sten. Buen kollapser over ham. Du finder hans betaling i murbrokkerne.", guldAendring: 120, givItem: 'diamant' }]
            },
            {
                tekst: "Slå ham ned og stjæl kapitalen",
                kraeverItem: 'stav',
                udfaldListe: [{ log: "Han trækker en kniv og forsvarer sit livsværk. Han flænger dig, før staven slår ham bevidstløs.", hpAendring: -25, guldAendring: 150 }]
            }
        ]
    },

    'det_gyldne_ego': {
        id: 'det_gyldne_ego',
        titel: "Erobrerens Statue",
        tekst: "En massiv guldstatue af en glemt tyran spærrer stien. Inskriptionen forlanger, at kun den bedst klædte på øen må passere tronsalen. Statuens øjne følger dig stift.",
        biome: ['ruin', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Klæd statuen i dit fine tøj",
                kosterItem: 'flot_toej',
                udfaldListe: [{ log: "Statuens indre maskineri genkender silken. Brystkassen åbner sig med et klik og afslører en skat.", givItem: 'diamant' }]
            },
            {
                tekst: "Hug statuens ansigt i stykker",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Guldstykker regner ned over dig som skarpe barberblade. Du skærer dig slemt på det flyvende metal.", hpAendring: -35, guldAendring: 140, naesteTrin: 'statuens_hjerte' }]
            }
        ]
    },

    'statuens_hjerte': {
        id: 'statuens_hjerte',
        titel: "Maskineriets Indre",
        tekst: "Statuens hoved ligger i græsset. Nede i halsåbningen snurrer et kompleks af dræbende tandhjul omkring en genstand.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Brug detektoren til at finde en vinkel",
                kraeverItem: 'metaldetektor',
                udfaldListe: [{ log: "Maskinen udpeger et blindt punkt i mekanikken. Du trækker en intakt rustning op uden problemer.", givItem: 'rustning' }]
            },
            {
                tekst: "Stik armen ned i maskinen",
                udfaldListe: [{ log: "Tandhjulene knuser dit kød. Du flår armen til dig i blind smerte, men du fik fat i et våben.", hpAendring: -25, givItem: 'svaerd' }]
            }
        ]
    },

    'monopolets_fald': {
        id: 'monopolets_fald',
        titel: "Kviksandets Købmand",
        tekst: "Øens eneste eliksir-sælger synker langsomt i et mudderhul med sin tunge vogn. Han nægter at kaste varerne overbord for at redde sig selv. Han forlanger fuld overpris for sit varelager.",
        biome: ['mark', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Betal hans ågerpris",
                puljeVaerdi: 200,
                udfaldListe: [{ log: "Han kaster medicinen op til dig. Vægten af dine mønter får ham til at synke helt under overfladen.", givItem: 'livseliksir', naesteTrin: 'monopol_kisten' }]
            },
            {
                tekst: "Lad ham drukne og brug kvisten",
                kraeverItem: 'soegekvist',
                udfaldListe: [{ log: "Du mærker præcis, hvor vognen lander på bunden. At trække den op koster dig blod, sved og næsten livet.", hpAendring: -45, guldAendring: 250 }]
            }
        ]
    },

    'monopol_kisten': {
        id: 'monopol_kisten',
        titel: "Kuskesædets Hemmelighed",
        tekst: "Sælgeren forsvandt i kviksandet. Trækassen under hans gamle kuskesæde flød op til overfladen. Den er låst med en stålmekanisme.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Bryd den op med kniven",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Låsen springer. En lille syrefælde eksploderer i ansigtet på dig, men skrinet rummer en enorm diamant.", hpAendring: -20, givItem: 'diamant' }]
            },
            {
                tekst: "Spark låget af med ren kraft",
                udfaldListe: [{ log: "Træet giver efter. Du flækker skinnebenet i processen, men finder sælgerens hemmelige guldreserve.", hpAendring: -15, guldAendring: 120 }]
            }
        ]
    },

    'koedlabyrinten': {
        id: 'koedlabyrinten',
        titel: "kødets labyrint",
        tekst: "En massiv port af pulserende kød står åben foran dig. Tænder roterer langsomt i dørkarmen. En stank af råddenskab og brændt sukker slår ud fra mørket. Det er en direkte invitation til at teste dit værd.",
        biome: ['skov', 'blodskov'],
        unik: true,
        valg: [
            {
                tekst: "Træd ind med hævet fakkel",
                kosterItem: 'fakkel',
                udfaldListe: [{ log: "Ilden får kødet til at trække sig tilbage. Du navigerer sikkert forbi de første roterende tænder og står nu ved en skillevej.", naesteTrin: 'labyrint_lys' }]
            },
            {
                tekst: "Tving dig igennem med rå magt",
                udfaldListe: [{ log: "Tænderne flænger dine skuldre. Du presser dig forbi og bløder voldsomt på stengulvet. Du står nu i et bælgmørkt rum.", hpAendring: -35, naesteTrin: 'labyrint_moerke' }]
            }
        ]
    },

    'labyrint_lys': {
        id: 'labyrint_lys',
        titel: "skillevejen i kødet",
        tekst: "Gangen deler sig. Den venstre sti er dækket af tykke guldtråde, der gror ud af væggene. Den højre sti er en flod af sort blod, som kræver et solidt våben at vade igennem.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Følg guldtrådene",
                udfaldListe: [
                    { log: "Trådene leder dig til et lille kammer fyldt med mønter. Du fylder lommerne og forlader labyrinten uset.", guldAendring: 180 },
                    { log: "Guldtrådene er levende parasitter. De snor sig om dine ben og bider. Du river dem af og får en dyr klump guld med ud.", hpAendring: -25, guldAendring: 120 }
                ]
            },
            {
                tekst: "Brug sablen til at rydde den højre sti",
                kosterItem: 'sabel',
                udfaldListe: [{ log: "Stålet kapper de seje hinder over. Blodet brænder våbnet væk, men du når frem til labyrintens absolutte midte.", naesteTrin: 'labyrint_hjerte' }]
            }
        ]
    },

    'labyrint_moerke': {
        id: 'labyrint_moerke',
        titel: "mørkets blindgyde",
        tekst: "Du kan intet se. Væggene trækker sig langsomt sammen om dig. Du mærker en metaldør foran dig og en blød, kødfuld væg til siden.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Grav gennem kødvæggen med skovlen",
                kosterItem: 'skovl',
                udfaldListe: [{ log: "Skovlen æder sig gennem massen. Træet splintres, men du bryder igennem til et hemmeligt skatkammer.", naesteTrin: 'labyrint_skat' }]
            },
            {
                tekst: "Løb blindt mod metaldøren",
                udfaldListe: [
                    { log: "Du smadrer hovedet ind i døren og falder om. Du vågner senere udenfor, mørbanket, men med en ukendt eliksir i hånden.", hpAendring: -40, givItem: 'livseliksir' },
                    { log: "Døren er åben. Du styrter igennem og falder direkte ned i en bunke guld og knogler. Faldet knækker et ribben.", hpAendring: -30, guldAendring: 200 }
                ]
            }
        ]
    },

    'labyrint_hjerte': {
        id: 'labyrint_hjerte',
        titel: "labyrintens kerne",
        tekst: "Et massivt, bankende organ svæver i midten af rummet. En glitrende diamant sidder fast i hovedpulsåren.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Skær stenen fri med kniven",
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: "Blodet sprøjter i alle retninger og skolder dig. Du får diamanten fri, og labyrinten dør omkring dig.", hpAendring: -25, givItem: 'diamant' },
                    { log: "Dit snit er perfekt. Stenen falder direkte ned i din hånd. Organet belønner dig med et massivt skud ren livskraft.", hpAendring: 80, givItem: 'diamant' }
                ]
            },
            {
                tekst: "Sug blodet med dine klude",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Stoffet mættes med det sorte blod. Det forvandler sig til et ubrydeligt panser. Du lader diamanten sidde.", givItem: 'rustning' }]
            }
        ]
    },

    'labyrint_skat': {
        id: 'labyrint_skat',
        titel: "kødets belønning",
        tekst: "Skatkammeret rummer to piedestaler. På den ene ligger en tung læderpung. På den anden hviler et skinnende våben. Labyrinten lukker sig bag dig. Du har kun tid til at gribe én.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Grib den tunge læderpung",
                udfaldListe: [{ log: "Du tager pungen. Labyrinten spytter dig ud med brutal kraft. Pungen er fyldt med mønter.", hpAendring: -15, guldAendring: 220 }]
            },
            {
                tekst: "Tag våbnet og hug dig ud",
                udfaldListe: [{ log: "Du griber et mesterligt sværd og hakker dig vej til overfladen. Det koster dig blod, men du overlever.", hpAendring: -25, givItem: 'svaerd' }]
            }
        ]
    },

    'tvillingernes_dom': {
        id: 'tvillingernes_dom',
        titel: "tvillingernes dom",
        tekst: "To forstenede figurer bærer en gigantisk vægt. Den ene figur har et fredfyldt ansigt. Den anden vrænger i evig smerte. Vægten tipper uroligt. De kræver, at du balancerer regnskabet.",
        biome: ['ruin', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Læg 150 guld i den fredfyldte skål",
                puljeVaerdi: 150,
                udfaldListe: [{ log: "Mønterne tynger vægten ned. Den smertende figur åbner munden og blotter en hemmelig sti.", naesteTrin: 'tvilling_velsignelse' }]
            },
            {
                tekst: "Brug din økse til at smadre vægten",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Stenen splintres. Magien kollapser. Begge figurer falder mod jorden med enorm kraft.", naesteTrin: 'tvilling_vold' }]
            }
        ]
    },

    'tvilling_velsignelse': {
        id: 'tvilling_velsignelse',
        titel: "den skjulte passage",
        tekst: "Passagen lugter af myrra. To altre står klar. Det røde alter rummer en voldsom varme. Det sorte alter suger lyset ud af luften.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Træd op på det røde alter",
                udfaldListe: [
                    { log: "Varmen omslutter dig og fjerner alle dine skader. Som tak finder du en diamant på alteret.", hpAendring: 100, givItem: 'diamant' },
                    { log: "Varmen brænder en række af dine ejendele væk, men hærder din krop massivt.", hpAendring: 120, mistItem: 'svaerd' }
                ]
            },
            {
                tekst: "Læg hånden på det sorte alter",
                udfaldListe: [{ log: "Kulden bider sig fast i dine knogler. Et ekko ruller gennem rummet og præsenterer dig for et nyt valg.", naesteTrin: 'tvilling_sort' }]
            }
        ]
    },

    'tvilling_vold': {
        id: 'tvilling_vold',
        titel: "stensplinterne",
        tekst: "Figurerne ligger i gruset. Magien er brudt, men energien leder efter et nyt offer. Du skal afslutte værket.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Hak hovedet af den fredfyldte",
                udfaldListe: [{ log: "Du smadrer stenen helt. Du finder mønter i dens hule bryst, men gulvet begynder at revne.", naesteTrin: 'tvilling_fald' }]
            },
            {
                tekst: "Hak hovedet af den smertende",
                udfaldListe: [
                    { log: "Ansigtet knuses. En syge siver ind i dit blod, men en enorm diamant ruller ud af stenmunden.", hpAendring: -45, givItem: 'diamant' },
                    { log: "Du stopper lidelsen. Den døde figur slipper sit greb om en formue i guld.", guldAendring: 250 }
                ]
            }
        ]
    },

    'tvilling_sort': {
        id: 'tvilling_sort',
        titel: "mørkets bytte",
        tekst: "Det sorte alter kræver et reelt offer for at slippe sine skatte.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Ofre din rustning",
                kosterItem: 'rustning',
                udfaldListe: [{ log: "Metallet suges ind i stenen. Alteret spytter en diamant og en stabel mønter ud til dig.", guldAendring: 150, givItem: 'diamant' }]
            },
            {
                tekst: "Ofre din egen livskraft",
                udfaldListe: [{ log: "Alteret suger dit blod. Du overlever knapt, men belønnes med øens dyreste udstyr.", hpAendring: -60, givItem: 'metaldetektor' }]
            }
        ]
    },

    'tvilling_fald': {
        id: 'tvilling_fald',
        titel: "revnen i gulvet",
        tekst: "Gulvet kollapser under dig. Du klamrer dig til kanten. Nede i mørket glimter noget.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Træk dig op i sikkerhed",
                udfaldListe: [{ log: "Du redder livet. På kanten finder du en forladt skovl fra en tidligere eventyrer.", givItem: 'skovl' }]
            },
            {
                tekst: "Hop ned i mørket efter glimtet",
                udfaldListe: [{ log: "Du lander hårdt på knogler og sten. Det var ikke guld, men en diamant. Du slæber dig afsted med store smerter.", hpAendring: -35, givItem: 'diamant' }]
            }
        ]
    },

    'taagens_lunge': {
        id: 'taagens_lunge',
        titel: "Mekanisk Lunge",
        tekst: "Et massivt messingrør stikker ud af klippesiden. Den tykke tåge pumper rytmisk ud herfra. En stank af brændt blod og ozon river i næsen. Det er ikke et vejrfænomen. Det er en maskine.",
        biome: ['bjerg', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Prop hullet til med dit tøj",
                kosterItem: 'flot_toej',
                udfaldListe: [{ log: "Trykket opbygges. Røret overopheder med et hvæs og spytter en glødende diamant ud, før det flækker og skolder dig med damp.", hpAendring: -15, givItem: 'diamant' }]
            },
            {
                tekst: "Træk vejret dybt i dampen",
                udfaldListe: [{ log: "Dampen smager af metal. Du ser et lynsnart syn af tusindvis af ofrede slaver under øen. Det koster på forstanden.", hpAendring: -25, naesteTrin: 'taage_vision' }]
            }
        ]
    },

    'taage_vision': {
        id: 'taage_vision',
        titel: "Sandheden i Dampen",
        tekst: "Synerne brænder sig fast på nethinden. Maskinen æder liv for at producere den gas, der dækker øen. Foran røret ligger et gammelt skelet svøbt i læder.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Smadr skelettets kasse med øksen",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Træet splintrer. Kassen er fyldt med mønter fra de ofrede arbejdere.", guldAendring: 180 }]
            },
            {
                tekst: "Søg liget systematisk",
                udfaldListe: [{ log: "Mellem knoglerne finder du udstyret fra en ingeniør. Du tager hans redskab.", givItem: 'metaldetektor' }]
            }
        ]
    },

    'taagedrikkeren': {
        id: 'taagedrikkeren',
        titel: "Den Krystalliserede Mand",
        tekst: "En mand sidder på knæ og suger grådigt tågen direkte ned i lungerne. Hans hud er krystalliseret. Han raller usammenhængende om, at gassen er lavet af smeltet grådighed fra øens konger.",
        biome: ['mark', 'blodskov'],
        unik: true,
        valg: [
            {
                tekst: "Giv ham livseliksir",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "Kroppen kan ikke håndtere renheden. Han kaster tågen op i form af en massiv diamant og dør af chokket.", givItem: 'diamant' }]
            },
            {
                tekst: "Slå ham ned for at stoppe larmen",
                kraeverItem: 'svaerd',
                udfaldListe: [{ log: "Han splintres som et spejl. Ud af hans brystkasse vælter det med mønter, men stumperne borer sig ind i din arm.", hpAendring: -30, guldAendring: 160 }]
            }
        ]
    },

    'den_faldne_kuppel': {
        id: 'den_faldne_kuppel',
        titel: "Det Store Skjold",
        tekst: "Midt i ruinen ligger et knust glastag. En obelisk i midten udskiller en hvid, tæt gas. En ridset indgravering fortæller om 'Det Store Skjold', bygget for at skjule en ubeskrivelig rigdom. Skjoldet groede fast og dræbte skaberne.",
        biome: ['ritual', 'by'],
        unik: true,
        valg: [
            {
                tekst: "Brug detektoren på fundamentet",
                kraeverItem: 'metaldetektor',
                udfaldListe: [{ log: "Maskinen hyler konstant. Du graver bygherrens personlige lønkammer frem fra murbrokkerne.", guldAendring: 250 }]
            },
            {
                tekst: "Placer 100 guld på obelisken",
                puljeVaerdi: 100,
                udfaldListe: [{ log: "Stenen opsluger mønterne grådigt. Mekanismen skifter gear og sprøjter rent, helende vand og en intakt kappe ud i hovedet på dig.", hpAendring: 80, givItem: 'rustning' }]
            }
        ]
    },

    'alkymistens_logbog': {
        id: 'alkymistens_logbog',
        titel: "Forseglet Viden",
        tekst: "Et telt af tykt læder holder gassen ude. Indeni sidder et indtørret lig over et bord. Noterne slår det fast: Tågen fodres af død. Jo flere blodsudgydelser på øen, jo hurtigere kryber den frem over landskabet.",
        biome: ['skov', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Brænd teltet og noterne ned",
                kraeverItem: 'fakkel',
                udfaldListe: [{ log: "Ilden renser luften brutalt. Varmen får en skjult kælderdør til at springe op under briksen.", naesteTrin: 'alkymistens_kaelder' }]
            },
            {
                tekst: "Stjæl hans forskning",
                udfaldListe: [{ log: "Teltdugen revner under din bevægelse. Tågen vælter ind og kvæler dig halvt, men du flygter med en massiv diamant fra hans skuffe.", hpAendring: -35, givItem: 'diamant' }]
            }
        ]
    },

    'alkymistens_kaelder': {
        id: 'alkymistens_kaelder',
        titel: "Kælderen",
        tekst: "Det underjordiske rum stinker af kemi. Her nede gemmer mandens sidste eksperiment sig. Et massivt våben dyppet i olie, der frastøder gassen.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Skrab olien ned i en flaske",
                udfaldListe: [{ log: "Du samler den potente væske. Det rene koncentrat fungerer som en kraftig modgift mod alle skader.", givItem: 'livseliksir' }]
            },
            {
                tekst: "Grib våbnet med de bare næver",
                udfaldListe: [{ log: "Olien ætser din hud sort, men stålet slipper sit greb i stenen. Du står med et frygtindgydende sværd.", hpAendring: -15, givItem: 'svaerd' }]
            }
        ]
    },

  'galgens_bytte': {
        id: 'galgens_bytte',
        titel: "Galgens Bytte",
        tekst: "Et jernbur dingler i en tyk kæde over en bundløs kløft. Nede i buret ligger et lig svøbt i fint tøj over en stor kiste. Et reb holder buret trukket ud fra klippevæggen. Kappen af rebet vil svinge buret ind til kanten.",
        biome: ['bjerg', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Skyd rebet over med buen",
                kraeverItem: 'bue',
                udfaldListe: [{ log: "Pilen snitter rebet over i ét ryk. Buret svinger voldsomt ind mod klippen. Du griber ind gennem tremmerne og trækker en svulmende sæk guld ud.", guldAendring: 180 }]
            },
            {
                tekst: "Hop over på buret",
                udfaldListe: [{ log: "Buret svinger faretruende under din vægt. Du vrider armen af led for at nå kisten. Faldet tilbage til kanten koster dig endnu mere helbred.", hpAendring: -45, guldAendring: 120, naesteTrin: 'buret_svajer' }]
            }
        ]
    },

    'buret_svajer': {
        id: 'buret_svajer',
        titel: "Metallet Knirker",
        tekst: "Kæden ruster op i farten. Buret er på vej mod afgrunden. Du ligger på kanten og kigger ind på ligets fine tøj.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Grib fat i stoffet",
                udfaldListe: [{ log: "Du river det fine tøj af liget, mens buret forsvinder ned i mørket.", givItem: 'flot_toej' }]
            },
            {
                tekst: "Lad det falde",
                udfaldListe: [{ log: "Du tager ingen chancer. Buret knuses mod bunden af kløften minutter senere." }]
            }
        ]
    },

    'edderkoppens_skat': {
        id: 'edderkoppens_skat',
        titel: "Spindet i Træet",
        tekst: "Et enormt net af seje, syredryppende tråde spærrer for et kranie med guldplomber. En almindelig kniv vil kile sig fast i det tykke spind, og skovlen er for klodset.",
        biome: ['skov', 'blodskov'],
        unik: true,
        valg: [
            {
                tekst: "Brug sablen til at flænse nettet",
                kraeverItem: 'sabel',
                udfaldListe: [{ log: "Sablens krumme blad skærer ubesværet gennem de sygdomsbefængte tråde. Du river guldet ud fra kraniets mund uden at røre spindet.", guldAendring: 160 }]
            },
            {
                tekst: "Brænd spindet væk med faklen",
                kosterItem: 'fakkel',
                udfaldListe: [{ log: "Faklen antænder syren. Nettet brænder op i et lynsnart glimt, der svier dine øjenbryn af. Du finder en diamant i asken.", hpAendring: -10, givItem: 'diamant' }]
            },
            {
                tekst: "Træk det løs med bare næver",
                udfaldListe: [{ log: "Syren brænder huden af dine hænder. Du skriger af smerte, men får flået kraniet fri. Guldet falder ud i mudderet.", hpAendring: -35, guldAendring: 110 }]
            }
        ]
    },
    
};