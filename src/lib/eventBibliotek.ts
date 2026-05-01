// eventBibliotek.ts
import { spilTilstand } from './spilTilstand.svelte';
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
            },
            {
                tekst: "Spark til stenen",
                udfaldListe: [{ log: "Alteret brummer vredt og brænder dig, men taber et par løse mønter i chokket.", hpAendring: -10, guldAendring: 15 }]
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
            },
            {
                tekst: "Spark kassen i afgrunden",
                udfaldListe: [{ log: "Kassen forsvinder med et brag. Du bryder forbandelsen og redder dit sind." }]
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
            },
            {
                tekst: "Kast dig over rødderne med de bare næver",
                udfaldListe: [{ log: "Du tæver løs på senerne. Træet knuser dit ribben, før det giver op. Du river et sværd fri.", hpAendring: -40, givItem: 'svaerd' }]
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
            },
            {
                tekst: "Spark til hjertet",
                udfaldListe: [{ log: "Du udløser et syrespjæt, men finder et par stykker guld under det.", hpAendring: -10, guldAendring: 30 }]
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
                udfaldListe: [{ log: "Du slår dig løs, blødende og forslået.", hpAendring: -30 }]
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
            },
            {
                tekst: "Saml lynhurtigt de løse mønter og løb",
                udfaldListe: [{ log: "Du snupper en håndfuld guld, før lungen ånder ind og spytter syre efter dig.", hpAendring: -15, guldAendring: 30 }]
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
            },
            {
                tekst: "Grib pungen med magt",
                udfaldListe: [{ log: "Ormene bider sig fast og forgifter dig voldsomt, men pungen er din.", hpAendring: -50, naesteTrin: 'parasit_pungen' }]
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
            },
            {
                tekst: "Flå pungen op med fingrene",
                udfaldListe: [{ log: "Et par små orme bider dig, men du redder tænderne.", hpAendring: -15, guldAendring: 150 }]
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
            },
            {
                tekst: "Riv knoglerne fra hinanden med hænderne",
                udfaldListe: [{ log: "Knoglerne splintres. Sporerne rammer dig hårdt.", hpAendring: -40, naesteTrin: 'omfavnelse_sporer' }]
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
            },
            {
                tekst: "Brænd dig igennem med en smule guld",
                puljeVaerdi: 20,
                udfaldListe: [{ log: "Guldets refleksion blænder dem længe nok til, at du kan flygte stenen.", givItem: 'diamant' }]
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
            },
            {
                tekst: "Knus kisten med rå magt",
                udfaldListe: [{ log: "Kisten splintres. Træstykkerne spidder din hånd, men du redder halvdelen af guldet.", hpAendring: -25, guldAendring: 80 }]
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
            },
            {
                tekst: "Stjæl hendes taske mens hun er distraheret",
                udfaldListe: [{ log: "Hun bider dig i armen som et vildt dyr, men du river tasken til dig.", hpAendring: -20, naesteTrin: 'enken_bunden' }]
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
            },
            {
                tekst: "Slå låsen løs mod en sten",
                udfaldListe: [{ log: "Låsen går af, men du udløser gassen i ansigtet.", hpAendring: -25, guldAendring: 80 }]
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
            },
            {
                tekst: "Kæmp for dit liv",
                udfaldListe: [{ log: "Bæstet flænger dit kød i laser. Kvinden giver dig diamanten som plaster på såret.", hpAendring: -50, givItem: 'diamant' }]
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
            },
            {
                tekst: "Stir refleksionen ned indtil spejlet brister",
                udfaldListe: [{ log: "Det kræver enorm viljestyrke og slider på sjælen, men spejlet splintres til sidst.", hpAendring: -40, naesteTrin: 'spejlet_skår' }]
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
            },
            {
                tekst: "Vend ryggen til og gå",
                udfaldListe: [{ log: "Refleksionen skriger af raseri, da du afviser gaven." }]
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
            },
            {
                tekst: "Tag et hurtigt blik for guld",
                udfaldListe: [{ log: "Du snupper lidt guld, før du skærer fingrene til blods.", hpAendring: -10, guldAendring: 40 }]
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
            },
            {
                tekst: "Prøv at bryste hende væk",
                udfaldListe: [{ log: "Hendes kløer skærer dybt ind i dit kød. Kampen bliver blodig.", hpAendring: -45, naesteTrin: 'brudens_kiste' }]
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
            },
            {
                tekst: "Slå hende bevidstløs og tag alt",
                udfaldListe: [{ log: "Det koster dyrt i skrammer, men du rydder pladsen for værdier.", hpAendring: -40, guldAendring: 100 }]
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
            },
            {
                tekst: "Spark manden væk med magt",
                udfaldListe: [{ log: "Han bider dig i benet og forsvarer sin elskede, men du maser dig forbi.", hpAendring: -30, naesteTrin: 'alkymistens_valg' }]
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
            },
            {
                tekst: "Fej alt guld ned i lommen hurtigt",
                udfaldListe: [{ log: "Alkymisten kradser dig i ansigtet, mens du tømmer bordet.", hpAendring: -25, guldAendring: 80 }]
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
            },
            {
                tekst: "Prøv at fiske den op med fingrene",
                udfaldListe: [{ log: "Du læner dig for langt frem og styrter i afgrunden.", hpAendring: -50, naesteTrin: 'kloeften_bund' }]
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
            },
            {
                tekst: "Grib bare ud i luften",
                udfaldListe: [{ log: "Du fanger kun spidse sten.", hpAendring: -10 }]
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
            },
            {
                tekst: "Brug fingrene som spade",
                udfaldListe: [{ log: "Dine negle flækker på rødderne, men jorden bløder hurtigt op.", hpAendring: -30, naesteTrin: 'hjertets_blod' }]
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
            },
            {
                tekst: "Løb væk fra stanken",
                udfaldListe: [{ log: "Du forlader graven og beholder dit helbred." }]
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
            },
            {
                tekst: "Træk vognen op med muskler",
                udfaldListe: [{ log: "Din ryg knækker næsten sammen, men han slipper fri.", hpAendring: -40, naesteTrin: 'forraederens_sandhed' }]
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
            },
            {
                tekst: "Skyd ham med en sten",
                udfaldListe: [{ log: "Han parerer let og rammer dig med kniven, men du får en pose mønter.", hpAendring: -30, guldAendring: 80 }]
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
            },
            {
                tekst: "Bestik væsenet med guld",
                puljeVaerdi: 100,
                udfaldListe: [{ log: "Det slikker mønterne og lader dig passere ind i ruinen.", naesteTrin: 'guidens_sti' }]
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
            },
            {
                tekst: "Slå til væsenet forfra",
                udfaldListe: [{ log: "Det bider dig i ansigtet, og du snubler baglæns ind i guld og edderkopper.", hpAendring: -35, guldAendring: 150 }]
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
            },
            {
                tekst: "Slå dem begge bevidstløse",
                udfaldListe: [{ log: "Du får voldsomme prygl, men snupper både flaske og sten i kaosset.", hpAendring: -50, naesteTrin: 'maeglerens_valg' }]
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
            },
            {
                tekst: "Tag pengene og lad dem dø",
                udfaldListe: [{ log: "Deres dødsskrig plager din samvittighed.", guldAendring: 100 }]
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
            },
            {
                tekst: "Løft kistelåget forsigtigt",
                udfaldListe: [{ log: "Monsteret sprøjter syre i øjnene på dig, men du snupper noget af byttet.", hpAendring: -40, guldAendring: 50 }]
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
            },
            {
                tekst: "Bank næverne ind i dens øjne",
                udfaldListe: [{ log: "Den slipper i chok, men bider dig blødende i siden.", hpAendring: -45, guldAendring: 100 }]
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
            },
            {
                tekst: "Træk ham ud uden at løfte vognen",
                udfaldListe: [{ log: "Hans skrig genlyder i hulen. Han mister benet, men kaster pungen i vrede.", hpAendring: -10, naesteTrin: 'gidsel_tak' }]
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
            },
            {
                tekst: "Kast pungen væk",
                udfaldListe: [{ log: "Du smider forbandelsen i floden." }]
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
            },
            {
                tekst: "Kravl langsomt frem",
                udfaldListe: [{ log: "Du skærer maven op på glasset, men undgår de store splinter.", hpAendring: -40, naesteTrin: 'krystal_svaerd' }]
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
            },
            {
                tekst: "Tag kun mønterne og undgå våbnet",
                udfaldListe: [{ log: "Du rydder lommen for guld og tager ingen chancer.", guldAendring: 50 }]
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
            },
            {
                tekst: "Skyd ungerne med sten",
                udfaldListe: [{ log: "Moderen brøler af raseri og æder dig næsten levende. Du flygter ind i en smal sprække.", hpAendring: -60, naesteTrin: 'moder_flugt' }]
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
            },
            {
                tekst: "Brug al din vægt til at knuse den",
                udfaldListe: [{ log: "Du brækker armen på slaget, men finder diamanten.", hpAendring: -35, givItem: 'diamant' }]
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
            },
            {
                tekst: "Hæld guld ned for at hæve overfladen",
                puljeVaerdi: 50,
                udfaldListe: [{ log: "Stenen flyder op til overfladen. Du tager den urørt.", givItem: 'diamant', naesteTrin: 'kildens_bund' }]
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
            },
            {
                tekst: "Grib blindlyt fat i alt",
                udfaldListe: [{ log: "Syren rister din arm fuldstændigt, men du trækker både sværd og rustning op.", hpAendring: -50, givItem: 'rustning' }]
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
            },
            {
                tekst: "Brug ryggen til at holde den oppe",
                udfaldListe: [{ log: "Din ryg brækker næsten sammen. Du skriger, men sparker maskinen fri.", hpAendring: -45, givItem: 'metaldetektor', naesteTrin: 'krigerens_arv' }]
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
            },
            {
                tekst: "Slæb dig væk uden at kigge sig tilbage",
                udfaldListe: [{ log: "Du overlever uden yderligere blødninger." }]
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
            },
            {
                tekst: "Riv tovet over med fingrene",
                udfaldListe: [{ log: "De brænder huden i stykker, men tovet ryger over.", hpAendring: -40, naesteTrin: 'galejens_vraggods' }]
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
            },
            {
                tekst: "Tag intet og svøm for livet",
                udfaldListe: [{ log: "Vandet slår ind over kisten og trækker den dybere ned." }]
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
            },
            {
                tekst: "Skub ham i havet",
                udfaldListe: [{ log: "Han griber fat i dig og hiver dig med under, men du stjæler skallen i vandet.", hpAendring: -35, naesteTrin: 'muslingens_hemmelighed' }]
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
            },
            {
                tekst: "Træk knuden op med munden",
                udfaldListe: [{ log: "Det koster dig to tænder, men diamanten falder ud i gruset.", hpAendring: -25, givItem: 'diamant' }]
            }
        ]
    },

'campfire': {
        id: 'campfire',
        titel: "Fremmed Lejr",
        tekst: "En flok vejrbidte rejsende varmer hænderne over et knitrende bål. De stirrer stift på dig. Lederen nikker mod en ledig plads og kræver betaling for at lade dig sove i deres cirkel.",
        biome: ['eng', 'skov', 'mark', 'bjerg', 'hoejland'],
        billede: '/events/ev_campfire.webp', 
        unik: false,
        valg: [
{
                tekst: "Køb dig til en nats ro (20 Guld)",
                puljeVaerdi: 20,
                effekt: () => {
                    const overlev = Math.random();
                    if (overlev < 0.75) {
                        return { logBesked: "De holder ord. Varmen og sikkerheden lader dine sår hele natten over.", hpOp: 50 };
                    } else {
                        spilTilstand.nuvaerendeEnergi = 0;
                        return { logBesked: "Du betaler og drikker af deres krus. Alt går i sort. Du vågner afbrudt og mørbanket, totalt drænet for energi. Tågen er rykket nærmere." };
                    }
                }
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
},
            {
                tekst: "Kast dig i græsset og ignorer dem",
                udfaldListe: [{ log: "De sparker dig hårdt i maven for at stjæle lidt guld i nattens mulm og mørke.", hpAendring: -15, guldAendring: -10 }]
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
            },
            {
                tekst: "Kast jord i hovedet på ham og løb",
                udfaldListe: [{ log: "Han hoster, mens lejesvende smider knive i ryggen på dig.", hpAendring: -20 }]
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
            },
            {
                tekst: "Bryd kassen med rå vold",
                udfaldListe: [{ log: "Du smadrer fingrene på træet, men kassen giver efter og belønner dig.", hpAendring: -15, guldAendring: 150 }]
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
            },
            {
                tekst: "Skub stenen ned over ham",
                udfaldListe: [{ log: "Han ruller sig til siden og sparker dig ned, men stenen knuser hans pung.", hpAendring: -20, guldAendring: 80 }]
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
            },
            {
                tekst: "Bryd indgangen op",
                udfaldListe: [{ log: "Du smadrer døren ned med ryggen og tager statuens ædelsten, men metallet flænger din arm.", hpAendring: -45, naesteTrin: 'statuens_hjerte' }]
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
            },
            {
                tekst: "Kast dig over resterne på jorden",
                udfaldListe: [{ log: "Tandhjulene kværner videre, mens du plukker løst guld.", guldAendring: 80 }]
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
            },
            {
                tekst: "Træk vognen op med ren kraft",
                udfaldListe: [{ log: "Du overriver et snesevis af sener og bløder slemt. Han kaster en eliksir i tak og lader vognen stå.", hpAendring: -55, givItem: 'livseliksir', naesteTrin: 'monopol_kisten' }]
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
            },
            {
                tekst: "Kast kassen ud i kviksandet",
                udfaldListe: [{ log: "Du ser den tunge kiste forsvinde. Måske har øen brug for det mere." }]
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
            },
            {
                tekst: "Sprint blindt indeni",
                udfaldListe: [{ log: "Du hamrer mod en bruskvæg og falder. Dit ansigt flænges, men du ruller forbi.", hpAendring: -45, naesteTrin: 'labyrint_moerke' }]
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
            },
            {
                tekst: "Svøm igennem blodfloden",
                udfaldListe: [{ log: "Syren brænder huden af, men du kæmper dig frem til midten.", hpAendring: -50, naesteTrin: 'labyrint_hjerte' }]
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
            },
            {
                tekst: "Kravl ud af åbningen",
                udfaldListe: [{ log: "Kødet skurer mod dine ribben, men du slipper fri uden belønning.", hpAendring: -15 }]
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
            },
            {
                tekst: "Kast dig mod diamanten",
                udfaldListe: [{ log: "Blodet skolder dit ansigt. Du får diamanten fri, men kollapser næsten.", hpAendring: -55, givItem: 'diamant' }]
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
            },
            {
                tekst: "Grib fat i mønterne",
                udfaldListe: [{ log: "Labyrinten kværner dig rundt, men du beholder guldet.", hpAendring: -10, guldAendring: 100 }]
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
            },
            {
                tekst: "Vælt dem begge med ren muskelkraft",
                udfaldListe: [{ log: "Det koster dig to brækkede ribben, men begge statuer vælter ned og smadres.", hpAendring: -45, naesteTrin: 'tvilling_vold' }]
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
            },
            {
                tekst: "Spark til det røde alter",
                udfaldListe: [{ log: "En smule varme siver ud og helbreder dig svagt.", hpAendring: 30 }]
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
            },
            {
                tekst: "Tag guldet fra det smadrede bryst",
                udfaldListe: [{ log: "Kanten skærer dine fingre, men du snupper guldet.", hpAendring: -15, guldAendring: 120 }]
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
            },
            {
                tekst: "Træk hånden tilbage",
                udfaldListe: [{ log: "Du løber ud af passagen, før det æder din sjæl." }]
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
            },
            {
                tekst: "Lad dig glide forsigtigt ned",
                udfaldListe: [{ log: "Det går galt. Du falder, brækker hoften, og misser stenen.", hpAendring: -50 }]
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
            },
            {
                tekst: "Spark ind i røret",
                udfaldListe: [{ log: "En gnist skyder ud og rammer dit ansigt.", hpAendring: -20 }]
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
            },
            {
                tekst: "Spil knoglerne ud i skrænten",
                udfaldListe: [{ log: "Skelettet forsvinder. Det udløser en smule guld på jorden.", guldAendring: 40 }]
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
            },
            {
                tekst: "Spark til ham",
                udfaldListe: [{ log: "Han forsvinder i tågen, hylende og vrængende." }]
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
            },
            {
                tekst: "Ryd murbrokkerne med vold",
                udfaldListe: [{ log: "Du smadrer fingrene under stenene, men finder et skjult kammer med guld.", hpAendring: -35, guldAendring: 160 }]
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
            },
            {
                tekst: "Riv liget ned og led",
                udfaldListe: [{ log: "Liget splintres. Du finder kun et par mønter i lommen.", guldAendring: 30 }]
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
            },
            {
                tekst: "Tag olien i tøjet",
                udfaldListe: [{ log: "Din arm er næsten brændt væk, men noget eliksir er samlet.", hpAendring: -50, givItem: 'livseliksir' }]
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
            },
            {
                tekst: "Kast dig mod tovet i desperation",
                udfaldListe: [{ log: "Du trækker i tovet. Buret svinger ind, men knuser dine ben i forsøget.", hpAendring: -60, guldAendring: 200 }]
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
            },
            {
                tekst: "Grib blindlyt ud i buret",
                udfaldListe: [{ log: "Buret snitter din arm, men du beholder livet.", hpAendring: -20 }]
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
    
    'krusenes_mester': {
        id: 'krusenes_mester',
        titel: "Krusenes Mester",
        tekst: "En mand med lynhurtige hænder flytter tre trækrus rundt på et bord. 'Perlen starter under det midterste. Jeg bytter yderkrusene, rykker midten til venstre, og bytter højre og midt. Hvor er perlen nu?'",
        biome: ['by', 'marked'],
        unik: false,
        valg: [
            {
                tekst: "Gæt på venstre krus",
                udfaldListe: [{ log: "Han griner højt. 'Dum som en sten.' Du betaler din indsats og går slukøret derfra.", guldAendring: -15 }]
            },
            {
                tekst: "Gæt på midterste krus",
                udfaldListe: [{ log: "Han griner højt. 'Dum som en sten.' Du betaler din indsats og går slukøret derfra.", guldAendring: -15 }]
            },
            {
                tekst: "Gæt på højre krus",
                udfaldListe: [{ log: "Hans smil stivner. Han rækker dig modvilligt en pose tunge mønter.", guldAendring: 40 }]
            },
            {
                tekst: "Smadr bordet med din stav",
                kraeverItem: 'stav',
                udfaldListe: [{ log: "Staven knalder ned i brædderne. Træet splintres, krusene flyver, og han stikker af. Du samler mønterne op fra mudderet.", guldAendring: 25 }]
            },
            {
                tekst: "Kast dig over bordet",
                udfaldListe: [{ log: "Han slår dig hårdt i maven, men du fanger kruset.", hpAendring: -20, guldAendring: 10 }]
            }
        ]
    },

    'ligningen_i_stoevet': {
        id: 'ligningen_i_stoevet',
        titel: "Ligningen i Støvet",
        tekst: "En beskidt gøgler tegner tal i gadesnavset. 'En kappe og en kniv koster samlet 110 guld. Kappen koster 100 guld mere end kniven. Hvad koster kniven? Svar rigtigt, og den er din.'",
        biome: ['by', 'marked'],
        unik: false,
        valg: [
            {
                tekst: "Svar 10 guld",
                udfaldListe: [{ log: "Gøgleren ryster på hovedet. 'Matematik er tydeligvis ikke for bønder.' Du kaster en mønt i hans skål af ren skam.", guldAendring: -10 }]
            },
            {
                tekst: "Svar 5 guld",
                udfaldListe: [{ log: "Han nikker anerkendende, sparker snavset over og rækker dig våbnet fra bordet.", givItem: 'kniv' }]
            },
            {
                tekst: "Tru ham med din økse",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Du hæver øksen over hans hoved. Han skriger op og smider kniven for fødderne af dig, før han flygter.", givItem: 'kniv' }]
            },
            {
                tekst: "Spark til bordet i raseri",
                udfaldListe: [{ log: "Han kaster en sten på dig. Du flygter.", hpAendring: -15 }]
            }
        ]
    },

    'den_falske_moent': {
        id: 'den_falske_moent',
        titel: "Den Falske Mønt",
        tekst: "En købmand med en lille messingvægt smiler skævt til dig. 'Jeg har 9 mønter. Én af dem er uægte bly og vejer mindre. Du må bruge min vægt præcis to gange. Hvordan finder du fup-mønten?'",
        biome: ['marked'],
        unik: false,
        valg: [
            {
                tekst: "Vej fire mod fire",
                udfaldListe: [{ log: "Han skraldgriner og klasker sig på lårene. 'Så mangler du en vejning, fjols!' Han snupper lidt af dit guld som betaling for undervisningen.", guldAendring: -20 }]
            },
            {
                tekst: "Vej tre mod tre",
                udfaldListe: [{ log: "Købmanden spærrer øjnene op. 'Du forstår dig åbenbart på elimineringsmetoden.' Han overdrager dig en stor belønning for at slå ham i hans eget spil.", guldAendring: 60 }]
            },
            {
                tekst: "Scan dem med din detektor",
                kraeverItem: 'metaldetektor',
                udfaldListe: [{ log: "Maskinen hyler øjeblikkeligt, da du fører den over blymønten. Han bliver hvid i ansigtet og betaler dig for at holde kæft.", guldAendring: 50 }]
            },
            {
                tekst: "Brug tyngdekraften",
                udfaldListe: [{ log: "Købmanden slår dig ned bagfra.", hpAendring: -25 }]
            }
        ]
    },

    'flaskernes_logik': {
        id: 'flaskernes_logik',
        titel: "Giftblanderens Leg",
        tekst: "En svindler har stillet tre uigennemsigtige flasker frem på en tønde. En med vand, en med vin, en med gift. 'Vinen står til højre for vandet. Giften står ikke i midten. Vandet står ikke til venstre. Hvad står i midten?'",
        biome: ['by', 'marked'],
        unik: false,
        valg: [
            {
                tekst: "Giften står i midten",
                udfaldListe: [{ log: "Han tager modvilligt imod dit bud. 'Du lytter ikke engang til reglerne.' Du taber dit væddemål.", guldAendring: -25 }]
            },
            {
                tekst: "Vinen står i midten",
                udfaldListe: [{ log: "Svindleren ryster opgivende på hovedet og rager din indsats til sig.", guldAendring: -25 }]
            },
            {
                tekst: "Vandet står i midten",
                udfaldListe: [{ log: "Han bander lavmælt og skubber flasken over til dig. Det viser sig at være en sjælden eliksir i stedet for vand.", givItem: 'livseliksir' }]
            },
            {
                tekst: "Kast tønden væk",
                udfaldListe: [{ log: "Du smadrer tønden og mister dit eget guld.", guldAendring: -30 }]
            }
        ]
    },

    'iglernes_broend': {
        id: 'iglernes_broend',
        titel: "Iglernes Brønd",
        tekst: "En fedladen adelsmand vræler ved kanten af et mudderhul fyldt med armtykke igler. Han har tabt en enorm guldring i dybet. Han lover dig en formue, hvis du vader ned og fisker den op med de bare næver.",
        biome: ['eng', 'skov'],
        unik: true,
        valg: [
            {
                tekst: "Vad ned i mudderet",
                udfaldListe: [{ log: "Iglerne suger sig fast og dræner dig for blod. Du finder ringen, og manden kaster en tung pose mønter til dig i bytte.", hpAendring: -40, guldAendring: 180 }]
            },
            {
                tekst: "Skub ham i hullet med staven",
                kosterItem: 'stav',
                udfaldListe: [{ log: "Staven knækker, da du vælter ham. Iglerne kaster sig over ham. Du fisker roligt ringen op og tager hans efterladte pung.", guldAendring: 250 }]
            },
            {
                tekst: "Kast jord i hullet",
                udfaldListe: [{ log: "Adelsmanden kaster jord på dig i raseri.", hpAendring: -10 }]
            }
        ]
    },

    'raaddenskabens_hoest': {
        id: 'raaddenskabens_hoest',
        titel: "Råddenskabens Høst",
        tekst: "En bonde sidder fastklemt under en massiv, giftig svamp. Sporerne ætser hans hud væk. Han klamrer sig til en intakt metaldetektor og tigger dig om at grave ham fri. At røre massen vil inficere dig varigt.",
        biome: ['mark', 'eng'],
        unik: true,
        valg: [
            {
                tekst: "Grav ham fri med hænderne",
                udfaldListe: [{ log: "Sporerne trænger ind i dine lunger og brænder. Din krop tager varig skade, men manden overlever og overrækker dig maskinen.", maxHpAendring: -15, givItem: 'metaldetektor' }]
            },
            {
                tekst: "Hug armen af ham",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Du skærer mandens arm over og snupper maskinen. Han besvimer af chok. Du undgår svampens gift.", givItem: 'metaldetektor' }]
            },
            {
                tekst: "Tving detektoren fri",
                udfaldListe: [{ log: "Svampen sprøjter gift, men du løber med den.", hpAendring: -45, givItem: 'metaldetektor' }]
            }
        ]
    },

    'smertens_segl': {
        id: 'smertens_segl',
        titel: "Smertens Segl",
        tekst: "En fanatiker ligger for døden foran et stenalter. Han holder en flaske med ren livseliksir. Han nægter at give dig den, medmindre du lader ham brænde sin sekts symbol ind i dit ansigt med et glødende jern.",
        biome: ['ruin', 'ritual'],
        unik: true,
        valg: [
            {
                tekst: "Accepter jernet mod huden",
                udfaldListe: [{ log: "Smerten er ubeskrivelig. Kødet syder, og du mister en del af din vitalitet. Han smiler tilfreds og rækker dig flasken, før han dør.", maxHpAendring: -20, givItem: 'livseliksir' }]
            },
            {
                tekst: "Kvæl ham med dine klude",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Du presser stoffet over hans ansigt. Han kæmper svagt imod, dør, og du tager flasken fra hans slappe greb.", givItem: 'livseliksir' }]
            },
            {
                tekst: "Brug fingrene",
                udfaldListe: [{ log: "Han angriber med jernet, og det koster et ar i panden, men eliksiren er din.", hpAendring: -30, givItem: 'livseliksir' }]
            }
        ]
    },

    'kloakkens_fange': {
        id: 'kloakkens_fange',
        titel: "Kloakkens Fange",
        tekst: "En tyv er spærret inde i et jernbur, der langsomt fyldes med byens rådne spildevand. Han hoster sort væske op. Han har slugt en massiv diamant og lover at kaste den op til dig, hvis du dykker ned i stanken og dirker låsen.",
        biome: ['by', 'marked'],
        unik: true,
        valg: [
            {
                tekst: "Dyk ned i kloakvandet",
                udfaldListe: [{ log: "Stanken får dig til at kaste op. Sygdommen river i din krop, da du tvinger låsen op. Han hoster diamanten op som lovet.", hpAendring: -45, givItem: 'diamant' }]
            },
            {
                tekst: "Brug din stav som brækjern",
                kosterItem: 'stav',
                udfaldListe: [{ log: "Træet splintres under pres, men låsen giver efter. Du slipper for vandet, og han afleverer stenen.", givItem: 'diamant' }]
            },
            {
                tekst: "Vent til han drukner, skær ham op",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Vandet stiger. Han skriger, indtil boblerne stopper. Du trækker liget op, flænser maven og finder stenen.", givItem: 'diamant' }]
            },
            {
                tekst: "Forlad stedet",
                udfaldListe: [{ log: "Du vender ryggen til buret. Hans skrig drukner langsomt i spildevandet bag dig." }]
            },
            {
                tekst: "Brug fingrene i panik",
                udfaldListe: [{ log: "Låsen afviser dig, og spildevandet forbrænder din arm.", hpAendring: -25 }]
            }
        ]
    },

    'krigshunden': {
        id: 'krigshunden',
        titel: "Kæmpehunden",
        tekst: "En enorm krigshund med panser på ryggen står over sin døde herre. Den knurrer dybt, da du nærmer dig herrens oppakning. Hunden bløder fra et grimt sår i flanken.",
        biome: ['slagmark', 'eng', 'skov'],
        unik: true,
        valg: [
            {
                tekst: "Helbred dyret med eliksir",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "Hunden slikker din hånd. Den grynter og graver sin herres nedgravede krigskasse op til dig.", guldAendring: 180, givItem: 'skovl' }]
            },
            {
                tekst: "Skræm den væk med ild",
                kosterItem: 'fakkel',
                udfaldListe: [{ log: "Den trækker sig pibende tilbage. Du tømmer ligets lommer og stjæler hans våben.", guldAendring: 80, givItem: 'sabel' }]
            },
            {
                tekst: "Kæmp mod udyret",
                udfaldListe: [{ log: "Hunden flænger dit ben. Du sparker den væk og flår herrens tunge udstyr med dig i farten.", hpAendring: -30, givItem: 'rustning' }]
            },
            {
                tekst: "Løb af frygt for dyret",
                udfaldListe: [{ log: "Den napper dig i hælen i flugten.", hpAendring: -10 }]
            }
        ]
    },

    'blind_passager': {
        id: 'blind_passager',
        titel: "Parasitten i Pelsen",
        tekst: "En lille abe med guldringe i ørerne hopper ned på din skulder fra en ruin. Den virker tam og lægger en sølvmønt i din hånd. Sekundet efter borer den sine knivskarpe kløer direkte ind i din nakke.",
        biome: ['ruin', 'by'],
        unik: true,
        valg: [
            {
                tekst: "Riv dyret af med magt",
                udfaldListe: [{ log: "Kløerne flænger din hud. Aben skriger og stikker af, men taber en tung læderpung på jorden.", hpAendring: -25, naesteTrin: 'abens_pose' }]
            },
            {
                tekst: "Lad den drikke sit fill",
                udfaldListe: [{ log: "Den suger sig mæt i dit blod og slipper grebet. Den gylper en stor krystal op i dine hænder og forsvinder.", hpAendring: -40, givItem: 'diamant' }]
            },
            {
                tekst: "Prøv at ryste den af",
                udfaldListe: [{ log: "Den bider en luns hud af nakken på dig.", hpAendring: -30 }]
            }
        ]
    },

    'abens_pose': {
        id: 'abens_pose',
        titel: "Det Stjålne Bytte",
        tekst: "Læderpungen bevæger sig let. Der er noget mere end mønter derinde.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Træd på pungen",
                udfaldListe: [{ log: "Noget kvaser under din støvle. Du åbner pungen og finder knuste knogler samt en masse guld.", guldAendring: 140 }]
            },
            {
                tekst: "Åbn den forsigtigt",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "En giftig edderkop springer ud, men du parerer med kniven. I bunden af pungen ligger en uvurderlig sten.", givItem: 'diamant' }]
            },
            {
                tekst: "Tøm pungen ud i luften",
                udfaldListe: [{ log: "Du får et par mønter, men insekterne bider.", hpAendring: -20, guldAendring: 40 }]
            }
        ]
    },

    'sumpdyret': {
        id: 'sumpdyret',
        titel: "Lastdyret i Mudderet",
        tekst: "En muteret, sekspenet okse sidder urokkeligt fast i et dybt mudderhul. Tunge lædertasker hænger over dens ryg. Udyret brøler panisk. Mudderet stiger langsomt om dens hals.",
        biome: ['eng', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Skær taskerne fri og forlad dyret",
                kraeverItem: 'sabel',
                udfaldListe: [{ log: "Oksen synker til bunds med et gisp. Taskerne kaster en enorm formue af sig.", guldAendring: 250 }]
            },
            {
                tekst: "Grav dyret fri",
                kosterItem: 'skovl',
                udfaldListe: [{ log: "Skovlen splintres. Oksen kommer på fri fod og gnubber sig op ad dig. Den hoster en krystal op fra sin ene mave.", givItem: 'diamant' }]
            },
            {
                tekst: "Hop ud og grib taskerne",
                udfaldListe: [{ log: "Oksen trækker dig med ned i panik. Du sluger tykt mudder. Du får flået en genstand ud af tasken, før du må slippe dyret.", hpAendring: -35, givItem: 'metaldetektor' }]
            },
            {
                tekst: "Træk fat i hornene",
                udfaldListe: [{ log: "Oksen river sig fri i smerte, men kaster dig tilbage i mudderet.", hpAendring: -25 }]
            }
        ]
    },

    'falkejaegeren': {
        id: 'falkejaegeren',
        titel: "Den Mekaniske Fugl",
        tekst: "En jæger ligger dræbt under et væltet træ. Hans følgesvend er en falk bygget af letmetal og fjedre. Fuglen hakker aggressivt ud efter dig for at beskytte sin døde herre.",
        biome: ['mark', 'skov'],
        unik: true,
        valg: [
            {
                tekst: "Fang fuglen med dit fine tøj",
                kosterItem: 'flot_toej',
                udfaldListe: [{ log: "Stoffet fanger fuglen skånsomt. Du skiller maskinen ad og trækker en enorm diamant ud af dens brystkasse.", givItem: 'diamant' }]
            },
            {
                tekst: "Slå den i stykker med øksen",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Metallet splintres i hundrede stykker. En fjeder flænger din arm, men liget bærer på en stor pose mønter.", hpAendring: -15, guldAendring: 120 }]
            },
            {
                tekst: "Kast mønter mod den",
                puljeVaerdi: 50,
                udfaldListe: [{ log: "Fuglen distraheres af det skinnende metal. Du sniger dig hen til jægeren og stjæler hans dyreste værktøj.", givItem: 'metaldetektor' }]
            },
            {
                tekst: "Fang fuglen med hænderne",
                udfaldListe: [{ log: "Fuglen flænger din arm, men du kvaser den mod en sten og redder nogle få mønter.", hpAendring: -40, guldAendring: 40 }]
            }
        ]
    },

    'krigens_ekko': {
        id: 'krigens_ekko',
        titel: "Krigens Ekko",
        tekst: "Et gammelt våbenskjold ligger knust under murbrokker. En såret krigsveteran vogter over det og ryster over hele kroppen. Han mumler usammenhængende om ære, svigt og en stjålen skat.",
        biome: ['slagmark', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Træd frem, tal krigernes sprog og beordr ham til at hvile",
                kraeverKarakter: 'knight_m',
                udfaldListe: [{ log: "Veteranens øjne genkender en ligemand. Han gør honnør, udånder og lader dig tage sin formue.", guldAendring: 180, givItem: 'diamant' }]
            },
            {
                tekst: "Vis ham dit mærke, tal krigernes sprog og bed ham hvile",
                kraeverKarakter: 'knight_f',
                udfaldListe: [{ log: "Veteranens øjne genkender en ligemand. Han gør honnør, udånder og lader dig tage sin formue.", guldAendring: 180, givItem: 'diamant' }]
            },
            {
                tekst: "Gør en ende på hans mumlen med øksen",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Et rent hug stopper lidelserne. Murbrokkerne dækker over en intakt rustning.", givItem: 'rustning', guldAendring: 50 }]
            },
            {
                tekst: "Vent til han sover ind og tag hans ting",
                udfaldListe: [{ log: "Da han dør, tager du guldet. En fælde under skjoldet klipper dine fingre i stykker.", hpAendring: -35, guldAendring: 80 }]
            }
        ]
    },

    'stjernernes_skyggespil': {
        id: 'stjernernes_skyggespil',
        titel: "Stjernernes Skyggespil",
        tekst: "Et magisk beskyttelsessegl blokerer indgangen til en grotte. Energien slår revner i luften. Seglet er lavet til at stege tyve og nysgerrige til aske.",
        biome: ['ritual', 'hule'],
        unik: true,
        valg: [
            {
                tekst: "Kør fingrene over runerne og dechifrer seglets magi",
                kraeverKarakter: 'magician_m',
                udfaldListe: [{ log: "Du kender remsen. Seglet brister som glas, og du tømmer grotten for ædelsten og eliksir.", givItem: 'diamant', guldAendring: 150 }]
            },
            {
                tekst: "Aflæs magien i luften og opløs beskyttelsen",
                kraeverKarakter: 'magician_f',
                udfaldListe: [{ log: "Du kender remsen. Seglet brister som glas, og du tømmer grotten for ædelsten og eliksir.", givItem: 'diamant', guldAendring: 150 }]
            },
            {
                tekst: "Kortslut energien ved at hamre din stav ind i seglet",
                kosterItem: 'stav',
                udfaldListe: [{ log: "Staven brænder op i et blændende lysglimt. Grotten står åben, men du står uden dit våben.", givItem: 'livseliksir', guldAendring: 100 }]
            },
            {
                tekst: "Tag en dyb indånding og tving dig igennem muren af energi",
                udfaldListe: [{ log: "Magien brænder huden af dine underarme. Du falder omkuld inde i grotten, men klemmer fast om en lille skat.", hpAendring: -50, givItem: 'diamant' }]
            }
        ]
    },

    'adelens_fald': {
        id: 'adelens_fald',
        titel: "Adelens Fald",
        tekst: "En lokal købmand nægter at slippe en tung trækiste til en flok desperate bønder. Han påstår hovmodigt, at kun adelen må gøre krav på indholdet, som loven foreskriver.",
        biome: ['by', 'marked'],
        unik: true,
        valg: [
            {
                tekst: "Brug din titel og kræv din retmæssige ejendom udleveret",
                kraeverKarakter: 'royal_m',
                udfaldListe: [{ log: "Bønderne viger ærbødigt tilbage, og købmanden overrækker skatten uden at blinke.", givItem: 'diamant', guldAendring: 250 }]
            },
            {
                tekst: "Træd frem som adelig og overtag situationen",
                kraeverKarakter: 'royal_f',
                udfaldListe: [{ log: "Bønderne viger ærbødigt tilbage, og købmanden overrækker skatten uden at blinke.", givItem: 'diamant', guldAendring: 250 }]
            },
            {
                tekst: "Smæk 150 guld i bordet for at lukke munden på ham",
                puljeVaerdi: 150,
                udfaldListe: [{ log: "Købmanden accepterer betalingen over loven og overdrager kistens mest værdifulde våben.", givItem: 'sabel' }]
            },
            {
                tekst: "Slut dig til bøndernes blodige oprør mod manden",
                udfaldListe: [{ log: "I slåskampen får du en kniv i ribbenene, men plyndrer købmandens kasse midt i kaosset.", hpAendring: -30, guldAendring: 140 }]
            }
        ]
    },

    'blod_paa_tanden': {
        id: 'blod_paa_tanden',
        titel: "Stenslottets Baghold",
        tekst: "To snigmordere springer frem fra tågen med trukne våben. De flankerer dig og har kun øje for dit guld og dit liv.",
        biome: ['ruin', 'bandit'],
        unik: true,
        valg: [
            {
                tekst: "Spænd musklerne og mød deres klinger med ren, rå brutalitet",
                kraeverKarakter: 'orc_m',
                udfaldListe: [{ log: "Deres våben preller af på din tykke hud. Du knækker nakken på dem begge og tager deres skatte.", givItem: 'diamant', guldAendring: 90 }]
            },
            {
                tekst: "Brøl af vrede og knus dem med dine bare næver",
                kraeverKarakter: 'orc_f',
                udfaldListe: [{ log: "Deres våben preller af på din tykke hud. Du knækker nakken på dem begge og tager deres skatte.", givItem: 'diamant', guldAendring: 90 }]
            },
            {
                tekst: "Skyd den forreste med buen",
                kraeverItem: 'bue',
                udfaldListe: [{ log: "Pilen i hjertet får makkeren til at flygte i panik og efterlade sit bytte.", guldAendring: 120, givItem: 'rustning' }]
            },
            {
                tekst: "Kast dig forover i en blodig nævekamp",
                udfaldListe: [{ log: "Deres sabler skærer dig til blods utallige steder, men du nedkæmper dem desperat.", hpAendring: -55, guldAendring: 150 }]
            }
        ]
    },

    'stormens_bytte': {
        id: 'stormens_bytte',
        titel: "Stormen på Kanten",
        tekst: "Vinden hyler over det blottede højland. En tung trækiste er langsomt ved at glide ud over en skrænt i stormstødene. Du har sekunder til at handle, før skatten knuses hundredvis af meter nede.",
        biome: ['hoejland'],
        unik: true,
        valg: [
            {
                tekst: "Læs klippens faldvinkel og udnyt vindens tryk til at fiksere kisten",
                kraeverKarakter: 'explorer_m',
                udfaldListe: [{ log: "Dit overblik er perfekt. Kisten kiler sig fast i en naturlig fordybning. Du bryder låsen og fylder lommerne.", guldAendring: 180, givItem: 'diamant' }]
            },
            {
                tekst: "Læs klippens faldvinkel og udnyt vindens tryk til at fiksere kisten",
                kraeverKarakter: 'explorer_f',
                udfaldListe: [{ log: "Dit overblik er perfekt. Kisten kiler sig fast i en naturlig fordybning. Du bryder låsen og fylder lommerne.", guldAendring: 180, givItem: 'diamant' }]
            },
            {
                tekst: "Kobl dit sværd dybt ned i sprækken som en bremseklods",
                kosterItem: 'svaerd',
                udfaldListe: [{ log: "Stålet hviner og knækker under presset, men det stopper kistens fald. Du flår guldet ud af træværket.", guldAendring: 220 }]
            },
            {
                tekst: "Kast hele din kropsvægt over kisten før den tipper",
                udfaldListe: [{ log: "Kisten trækker dig med ud over kanten. Du fanger en rod i faldet, men river skulderen af led, før du kan kravle op med en smule guld.", hpAendring: -45, guldAendring: 60 }]
            }
        ]
    },

    'klippeoernens_rede': {
        id: 'klippeoernens_rede',
        titel: "Døden fra Himlen",
        tekst: "Du står blottet på et plateau. En gigantisk fugl dykker lydløst mod dig med udstrakte kløer. Dens rede hænger på klippevæggen bag den, overfyldt med skinnende metal.",
        biome: ['hoejland'],
        unik: true,
        valg: [
            {
                tekst: "Følg fuglens skygge og forudse dens præcise angrebsvinkel",
                kraeverKarakter: 'hunter_m',
                udfaldListe: [{ log: "Du ruller under dykket i det eksakte millisekund. Fuglen smadrer ind i klippen og brækker nakken. Reden er din.", guldAendring: 150, givItem: 'diamant' }]
            },
            {
                tekst: "Følg fuglens skygge og forudse dens præcise angrebsvinkel",
                kraeverKarakter: 'hunter_f',
                udfaldListe: [{ log: "Du ruller under dykket i det eksakte millisekund. Fuglen smadrer ind i klippen og brækker nakken. Reden er din.", guldAendring: 150, givItem: 'diamant' }]
            },
            {
                tekst: "Spænd stramt og plant en pil i udyret under dets dyk",
                kraeverItem: 'bue',
                udfaldListe: [{ log: "Pilen borer sig ind i brystkassen. Fuglen styrter i afgrunden. Du tømmer roligt reden for alt af værdi.", guldAendring: 200 }]
            },
            {
                tekst: "Grib fat om de massive kløer når den slår ned",
                udfaldListe: [{ log: "Kløerne flænger din hud ind til benet. I kampens hede styrter fuglen, og du slæber dig blødende op til reden.", hpAendring: -55, givItem: 'diamant' }]
            }
        ]
    },

    'den_klarsynede': {
        id: 'den_klarsynede',
        titel: "Eneboerens Handel",
        tekst: "En vejrbidt gammel mand sidder på den koldeste bakketop. Hans blik er helt tomt for frygt. Han tilbyder en tung metaldetektor i bytte for noget, der kan holde hans krop varm den kommende nat.",
        biome: ['hoejland'],
        unik: true,
        valg: [
            {
                tekst: "Stil dig over ham og kræv udstyret som beskyttelsespenge",
                kraeverKarakter: 'viking_m',
                udfaldListe: [{ log: "Manden genkender overmagten i din holdning. Han bukker hovedet og lægger maskinen for dine fødder.", givItem: 'metaldetektor', guldAendring: 40 }]
            },
            {
                tekst: "Stil dig over ham og kræv udstyret som beskyttelsespenge",
                kraeverKarakter: 'viking_f',
                udfaldListe: [{ log: "Manden genkender overmagten i din holdning. Han bukker hovedet og lægger maskinen for dine fødder.", givItem: 'metaldetektor', guldAendring: 40 }]
            },
            {
                tekst: "Ræk ham dit varme soveudstyr og afslut handlen",
                kosterItem: 'sovepose',
                udfaldListe: [{ log: "Han svøber sig tavst i stoffet. Maskinen er din, men du må sove på den bare jord fremover.", givItem: 'metaldetektor' }]
            },
            {
                tekst: "Træk manden op i kraven og plyndr ham med magt",
                udfaldListe: [{ log: "Han er lynhurtig og slår dig hårdt over knæene med en skjult kæp. Du ender med at vinde, men det koster helbred.", hpAendring: -30, givItem: 'metaldetektor' }]
            }
        ]
    },

    'stensangen': {
        id: 'stensangen',
        titel: "De Hylende Sten",
        tekst: "Vinden blæser ukontrolleret gennem en stencirkel og skaber en frekvens, der får hjernen til at krampe. I midten ligger liget af en udplyndret tyv med en massiv diamant i hånden.",
        biome: ['hoejland'],
        unik: true,
        valg: [
            {
                tekst: "Træd ind i cirklen med klippefolkets totale døvhed for svag magi",
                kraeverKarakter: 'dwarf_m',
                udfaldListe: [{ log: "Lyden preller fuldstændig af på dit sind. Du henter stenen og sparker lidt ekstra guld fri fra støvet.", givItem: 'diamant', guldAendring: 100 }]
            },
            {
                tekst: "Træd ind i cirklen med klippefolkets totale døvhed for svag magi",
                kraeverKarakter: 'dwarf_f',
                udfaldListe: [{ log: "Lyden preller fuldstændig af på dit sind. Du henter stenen og sparker lidt ekstra guld fri fra støvet.", givItem: 'diamant', guldAendring: 100 }]
            },
            {
                tekst: "Prop tykt stof dybt ind i begge øregange",
                kosterItem: 'klude',
                udfaldListe: [{ log: "Stoffet blokerer det værste af stensangen. Du vader ind, tager diamanten og lader kludene ligge.", givItem: 'diamant' }]
            },
            {
                tekst: "Sprint ind til liget og ignorer smerten i kraniet",
                udfaldListe: [{ log: "Lydbølgerne sprænger dine trommehinder og koster dig en flig af din forstand. Du slæber dig ud med diamanten.", hpAendring: -40, maxHpAendring: -10, givItem: 'diamant' }]
            }
        ]
    },


    'falsk_refleksion': {
        id: 'falsk_refleksion',
        titel: "Den Bedre Udgave",
        tekst: "En massiv, spejlblank krystalvæg rejser sig fra mudderet. Dit spejlbillede kigger tilbage på dig, men det har rent tøj på og bløder ikke. Spejlbilledet rækker en hånd ud og beder om en byttehandel.",
        biome: ['krystal', 'ruin'],
        unik: true,
        valg: [
            {
                tekst: "Skab kontakt og gennemsku spejlets sande natur",
                kraeverKarakter: 'magician_m',
                udfaldListe: [{ log: "Magien slår revner i illusionen. Krystallen splintres fredeligt og efterlader en enorm diamant på jorden.", givItem: 'diamant', guldAendring: 50 }]
            },
            {
                tekst: "Brug din indsigt til at afvise illusionen",
                kraeverKarakter: 'magician_f',
                udfaldListe: [{ log: "Din magi afviser spejlbilledet. Væggen krakelerer og blotter en ædelsten i sit indre.", givItem: 'diamant', guldAendring: 50 }]
            },
            {
                tekst: "Aflever dit fine tøj til krystallen",
                kosterItem: 'flot_toej',
                udfaldListe: [{ log: "Spejlbilledet tager imod tøjet med et smil. Krystallen spytter en skinnende diamant ud som betaling.", givItem: 'diamant' }]
            },
            {
                tekst: "Smadr væggen med de bare næver",
                udfaldListe: [{ log: "Krystallen eksploderer i tusindvis af nålespidse skår. Du bløder fra ansigt og hænder, men finder guld i støvet.", hpAendring: -35, guldAendring: 120 }]
            }
        ]
    },

    'glasroserne': {
        id: 'glasroserne',
        titel: "Dødens Have",
        tekst: "Et område er dækket af krystaller formet som roser. Bladene er tynde som barberblade. Midt i bedet ligger et uigenkendeligt lig og klamrer sig til en fuldt intakt søgekvist.",
        biome: ['krystal'],
        unik: true,
        valg: [
            {
                tekst: "Brænd en sti gennem krystallerne med ilden",
                kosterItem: 'fakkel',
                udfaldListe: [{ log: "Varmen får krystallerne til at smelte og knække. Du vader ubesværet ind og henter redskabet.", givItem: 'soegekvist', guldAendring: 40 }]
            },
            {
                tekst: "Brug kniven til at skære de farligste klinger væk",
                kraeverItem: 'kniv',
                udfaldListe: [{ log: "Bladet på kniven sløves, men du baner dig vej uden at miste en dråbe blod.", givItem: 'soegekvist', guldAendring: 60 }]
            },
            {
                tekst: "Mas dig direkte gennem de skarpe krystaller",
                udfaldListe: [{ log: "Roserne skærer dig til plukfisk. Dine bukser er gennemblødte af blod, da du når frem til liget.", hpAendring: -45, givItem: 'soegekvist' }]
            }
        ]
    },

    'prismets_vildfarelse': {
        id: 'prismets_vildfarelse',
        titel: "Løgnerens Prisme",
        tekst: "Et enormt, svævende prisme kaster rædselsvækkende illusioner af flamberede lig og brølende monstre ud i tågen. I virkeligheden skjuler lyset over en formue i mønter.",
        biome: ['krystal', 'bjerg'],
        unik: true,
        valg: [
            {
                tekst: "Grin medskyldigt og lad galskaben afmontere illusionen",
                kraeverKarakter: 'joker_m',
                udfaldListe: [{ log: "Du ler højlydt af synet. Prismet kan ikke håndtere din mangel på frygt og falder passivt til jorden.", guldAendring: 250, givItem: 'diamant' }]
            },
            {
                tekst: "Giv illusionerne et skævt smil og byd dem velkommen",
                kraeverKarakter: 'joker_f',
                udfaldListe: [{ log: "Lyset flimrer og dør, da det indser, at du nyder synet. Du samler formuen op fra den bare jord.", guldAendring: 250, givItem: 'diamant' }]
            },
            {
                tekst: "Løft kikkerten og find den sande sti gennem lyset",
                kraeverItem: 'kikkert_250',
                udfaldListe: [{ log: "Linserne skærer igennem blændværket. Du træder roligt forbi de falske monstre og tømmer pladsen for guld.", guldAendring: 180 }]
            },
            {
                tekst: "Kast dig brølende ind i illusionerne",
                udfaldListe: [{ log: "Lyset brænder din hud, og dit sind kramper under presset. Du flår i blinde guld til dig og flygter udmattet.", hpAendring: -40, guldAendring: 120 }]
            }
        ]
    },

    'bloddiamanten': {
        id: 'bloddiamanten',
        titel: "Kød og Kvarts",
        tekst: "En muteret bjørn sover uroligt i mudderet. Ud af dens ryg vokser en rå, ubeskåret krystal, der pulserer svagt. Dyret lider tydeligvis under den voksende sten.",
        biome: ['krystal', 'blodskov'],
        unik: true,
        valg: [
            {
                tekst: "Bedøm dyrets åndedræt og træk stenen fri med et ryk",
                kraeverKarakter: 'hunter_m',
                udfaldListe: [{ log: "Dit snit er kirurgisk. Dyret sover videre, uvidende om at du netop har berøvet det en formue.", givItem: 'diamant', guldAendring: 60 }]
            },
            {
                tekst: "Læs dyrets muskelspænding og vrid krystallen ud",
                kraeverKarakter: 'hunter_f',
                udfaldListe: [{ log: "Stenen slipper kødet med et vådt smæld. Dyret rører sig ikke. Du forlader stedet som en rigere jæger.", givItem: 'diamant', guldAendring: 60 }]
            },
            {
                tekst: "Lirk stenen ud med spidsen af din sabel",
                kraeverItem: 'sabel',
                udfaldListe: [{ log: "Klingen skærer lidt for dybt. Bjørnen vågner med et brøl, men du flygter ud i krattet med stenen i hånden.", givItem: 'diamant' }]
            },
            {
                tekst: "Plant støvlen i dyret og ryk stenen ud med rå kraft",
                udfaldListe: [{ log: "Bjørnen vågner i raseri og bider din arm næsten i stykker. Du får stenen, men prisen i blod er massiv.", hpAendring: -50, givItem: 'diamant' }]
            }
        ]
    },

    'krystalpaladset': {
        id: 'krystalpaladset',
        titel: "Spejllabyrinten",
        tekst: "Et enormt bygningsværk af massive krystalpaneler rejser sig foran dig. Væggene skaber hundredvis af falske korridorer. Labyrinten virker levende, og indgangen lukker sig lydløst bag dig.",
        biome: ['krystal', 'by'],
        unik: true,
        valg: [
            {
                tekst: "Følg de endeløse spejlinger af glitrende mønter dybere ind",
                udfaldListe: [{ log: "Du lader grådigheden styre dine skridt. Lysene trækker dig længere ned.", naesteTrin: 'krystal_illusion' }]
            },
            {
                tekst: "Luk øjnene helt og følg luftstrømmene i mørket",
                udfaldListe: [{ log: "Du stoler på dine instinkter. Du rammer kold luft og står foran bygningens sande midte.", naesteTrin: 'krystal_kerne' }]
            },
            {
                tekst: "Brug al din kraft på at smadre panelerne foran dig",
                udfaldListe: [{ log: "Glasset krakelerer under dine knytnæver. Væggene begynder at forsvare sig selv med spidse krystaller.", hpAendring: -15, naesteTrin: 'krystal_splinter' }]
            }
        ]
    },

    'krystal_illusion': {
        id: 'krystal_illusion',
        titel: "Grådighedens Pris",
        tekst: "Du er omringet af guld på alle sider, men alt er spejlinger. Gribber du forkert, skærer panelerne dine hænder af.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Brug udstyret til at adskille ægte metal fra lys",
                kraeverItem: 'metaldetektor',
                udfaldListe: [{ log: "Maskinen hyler ved et bestemt panel. Du smadrer det roligt og finder kilden til alle spejlingerne.", guldAendring: 250, givItem: 'diamant' }]
            },
            {
                tekst: "Kast din skovl ind i spejlene for at teste dem",
                kosterItem: 'skovl',
                udfaldListe: [{ log: "Skovlen splintrer en falsk væg og afslører udgangen samt et bundt mønter. Du har mistet dit værktøj.", guldAendring: 120 }]
            },
            {
                tekst: "Kast dig over den største stak guld",
                udfaldListe: [{ log: "Du griber rent glas. Det skærer dine underarme op. Du får reddet en smule guld fra gulvet, før labyrinten spytter dig ud.", hpAendring: -40, guldAendring: 50 }]
            }
        ]
    },

    'krystal_kerne': {
        id: 'krystal_kerne',
        titel: "Sandheden i Krystallen",
        tekst: "Et hjerte af rent lys hænger i midten af rummet. Det summer af en farlig, koncentreret energi.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Læg eliksiren på alteret under hjertet",
                kosterItem: 'livseliksir',
                udfaldListe: [{ log: "Kernen absorberer væsken og skyder en enorm, varmende bølge af ren helbredelse gennem dig.", hpAendring: 150, maxHpAendring: 10, givItem: 'diamant' }]
            },
            {
                tekst: "Slå kernen itu med øksen",
                kraeverItem: 'oekse',
                udfaldListe: [{ log: "Slaget udløser et blændende lys. Krystallerne raserer rummet, men du flygter med fragmenterne.", hpAendring: -25, guldAendring: 180 }]
            },
            {
                tekst: "Riv lyset ned med de bare næver",
                udfaldListe: [{ log: "Energien brænder dine håndflader sorte. Smerten er ubeskrivelig, men du står tilbage med en ubeskåret diamant.", hpAendring: -50, givItem: 'diamant' }]
            }
        ]
    },

    'krystal_splinter': {
        id: 'krystal_splinter',
        titel: "Voldens Svar",
        tekst: "Væggene skyder nåleskarpe splinter ud i luften. Labyrinten forsøger aktivt at makulere dig for din opførsel.",
        erSubTrin: true,
        biome: 'any',
        valg: [
            {
                tekst: "Sæt dig i knæ og lad metallet tage af for glasset",
                kosterItem: 'rustning',
                udfaldListe: [{ log: "Glasset borer sig ind i rustningen og ødelægger den totalt. Du overlever uden ridser og finder krystallens guldbeholdning.", guldAendring: 200 }]
            },
            {
                tekst: "Kast 100 guld i luften som distraktion for mekanikken",
                puljeVaerdi: 100,
                udfaldListe: [{ log: "Labyrinten reagerer på refleksionerne og beskyder mønterne. Du stikker af med et par ridser og en diamant.", hpAendring: -10, givItem: 'diamant' }]
            },
            {
                tekst: "Dæk ansigtet og løb direkte gennem regnen af glas",
                udfaldListe: [{ log: "Du bliver gennemhullet af små splinter. Du overlever knapt, og labyrinten smider dig blødende ud på marken.", hpAendring: -60, guldAendring: 80 }]
            }
        ]
    },

};