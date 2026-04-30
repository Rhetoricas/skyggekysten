// --- 1. ORDBOGEN (INTERFACES) ---

export interface Udfald {
    log: string; 
    aktionType: 'hp' | 'guld' | 'hp_lejr' | 'guld_lejr' | 'fortsaet' | 'kollaps'; 
    vaerdi?: number;          
    multiplikator?: number;   
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
    udfaldListe?: Udfald[];   // Maskinen trækker et tilfældigt udfald herfra i blinde
}

export interface SpilEvent {
    id: string;
    biome: string | string[];
    titel: string;
    tekst: string;
    billede?: string;         // Maskinen bruger standardbilleder, medmindre vi udfylder en specifik sti her
    vaegt?: number;           // Styrer sandsynligheden for at trække eventet
    kravDag?: number;         // Låser eventet indtil et bestemt tidspunkt
    unik?: boolean;           // Sørger for at eventet fjernes fra puljen, når det er spillet
    sfx?: string;             // Lydfil til at sætte stemningen
    erSubTrin?: boolean;      // Gør eventet usynligt for landkortet, så det kun virker som en del af en kædereaktion
    valg: Valg[];
}

// --- 2. SELVE KATALOGET OVER EVENTS ---

export const eventBibliotek: Record<string, SpilEvent> = {


'stjernekikkert': {
        id: "stjernekikkert",
        biome: ["bjerg", "mark", "ruin"],
        titel: "Den Forbandede Stjernekikkert",
        tekst: "Du snubler over en kasse beklædt med mørkt fløjl. Indeni ligger en stjernekikkert af massivt guld. Den virker utrolig dragende. Du mærker en trang til at se verden gennem dens linser, selvom du ved, at den vil låse dit syn fast i de næste 5 ture.",
        billede: "/events/event.webp",
        valg: [
            {
                tekst: "Kig gennem okularet (250% Zoom)",
                udfaldListe: [
                    {
                        log: "Verden maser sig brutalt op i ansigtet på dig. Du må slæbe den tunge kikkert med dig.",
                        aktionType: "fortsaet",
                        givItem: "kikkert_250"
                    }
                ]
            },
            {
                tekst: "Kig gennem frontglasset (45% Zoom)",
                udfaldListe: [
                    {
                        log: "Landskabet eksploderer væk fra dig. Du føler dig som en kæmpe.",
                        aktionType: "fortsaet",
                        givItem: "kikkert_45"
                    }
                ]
            }
        ]
    },  
    
'koedvuggen': {
        id: 'koedvuggen',
        titel: "Kødvuggen",
        tekst: "En enorm egestamme er flækket på langs. Indeni pulserer en blød og varm masse af sener. Den trækker vejret tungt. Rundt om rødderne ligger hundredvis af rustne våben, som om træet har afvæbnet tidligere besøgende.",
        biome: ['skov', 'mark'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Hæld Livseliksir direkte ind i massen",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Væsken får træet til at krampe voldsomt. Det spytter en tung klump rav ud fyldt med antikke mønter, før det visner.", aktionType: 'guld', vaerdi: 80 }
                ]
            },
            {
                tekst: "Ræk armen ind og træk massen ud",
                udfaldListe: [
                    { log: "Kødet griber fat i din arm og forsøger at fordøje den. Du river dig fri, men mister store mængder blod.", aktionType: 'hp', vaerdi: -35 },
                    { log: "Musklerne knuser dine fingre, men du får fat i et solidt skjold af brusk.", aktionType: 'hp', vaerdi: -15, givItem: 'rustning' }
                ]
            },
            {
                tekst: "Høst vævet systematisk med dit blad",
                kraeverItem: 'svaerd',
                naesteTrin: 'koedvuggen_hjertet'
            },
            {
                tekst: "Læg hænderne på barken og stjæl dens liv",
                kraeverKarakter: 'kultist',
                udfaldListe: [
                    { log: "Du suger træets puls ind i dine egne årer. Træet dør, og du føler dig uovervindelig.", aktionType: 'hp', vaerdi: 60 }
                ]
            }
        ]
    },

    'koedvuggen_hjertet': {
        id: 'koedvuggen_hjertet',
        titel: "Det Bankende Center",
        tekst: "Du skærer dig gennem seje hinder af plante og kød. Dybt inde finder du et pulserende organ, der lyser svagt. Det lugter af råddenskab og uendeligt liv på samme tid.",
        biome: ['skov', 'mark'],
        erSubTrin: true,
        valg: [
            {
                tekst: "Ofre dit sværd for at løsne organet intakt",
                kosterItem: 'svaerd',
                udfaldListe: [
                    { log: "Klingen sætter sig fast i roden og brækker. Du får organet fri. Det drypper af potent eliksir.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Spis organet råt på stedet",
                udfaldListe: [
                    { log: "Smagen fremkalder brutale hallucinationer. Dit sind knækker, og du kollapser i mudderet.", aktionType: 'kollaps' },
                    { log: "Dine sår brænder, mens fremmede celler reparerer din krop fra indersiden. En voldsom, men effektiv helbredelse.", aktionType: 'hp', vaerdi: 90 }
                ]
            },
            {
                tekst: "Efterlad kødet og grav i stedet under rødderne",
                kraeverItem: 'skovl',
                udfaldListe: [
                    { log: "Du undgår det levende væv og graver en skjult kiste fri fra mulden.", aktionType: 'guld', vaerdi: 50 }
                ]
            }
        ]
    },

    'sumpens_lunge': {
        id: 'sumpens_lunge',
        titel: "Sumpens Lunge",
        tekst: "Jorden hæver og sænker sig i en våd rytme. En gigantisk, gennemsigtig blære stikker op af mudderet og filtrerer luften. Hver gang den puster ud, regner det med små, skinnende mønter.",
        biome: ['eng', 'bjerg'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Lad den sluge din rustning for at kvæle den",
                kosterItem: 'rustning',
                udfaldListe: [
                    { log: "Metallet river blæren op indefra. Den sprænges, og et hav af opsparede mønter skyller ud over dig.", aktionType: 'guld', vaerdi: 100 }
                ]
            },
            {
                tekst: "Prøv at gribe mønterne under dens udånding",
                udfaldListe: [
                    { log: "Gassen fra udåndingen ætser dine lunger. Du hoster blod op, men får fat i lidt guld.", aktionType: 'hp', vaerdi: -25 },
                    { log: "Du holder vejret længe nok til at fylde lommen, før gassen tvinger dig væk.", aktionType: 'guld', vaerdi: 30 }
                ]
            },
            {
                tekst: "Træk vejret i præcis samme takt som lungen",
                kraeverKarakter: 'praest',
                naesteTrin: 'lungen_symbiose'
            },
            {
                tekst: "Læg 20 Guld som offer på den varme hud",
                puljeVaerdi: 20,
                udfaldListe: [
                    { log: "Lungen vibrerer anerkendende. En helende damp omslutter dig og lukker alle dine sår.", aktionType: 'hp', vaerdi: 60 }
                ]
            }
        ]
    },

    'lungen_symbiose': {
        id: 'lungen_symbiose',
        titel: "Det Rene Åndedræt",
        tekst: "Dine lunger synkroniserer sig med skabningen. Tågen omkring jer forsvinder, og væsenet åbner en lille, kødet lomme. Der ligger noget indeni.",
        biome: ['eng', 'bjerg'],
        erSubTrin: true,
        valg: [
            {
                tekst: "Tag forsigtigt gaven",
                udfaldListe: [
                    { log: "Du tager en indkapslet eliksir ud. Den føles utroligt ren.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Udnyt åbningen og hug lommen af",
                kraeverItem: 'svaerd',
                udfaldListe: [
                    { log: "Blæren hviner og skrumper ind. Du står tilbage med et mærkeligt, men kraftfuldt hudpanser.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Stil dig ind i lommen for beskyttelse",
                udfaldListe: [
                    { log: "Skabningen lukker sig om dig som en vugge. Du vågner udhvilet og stærkere end nogensinde.", aktionType: 'hp', vaerdi: 100 }
                ]
            }
        ]
    },

    'parasitmarkedet': {
        id: 'parasitmarkedet',
        titel: "Krybet i Jernet",
        tekst: "En ridderrustning knæler i gruset. Det er ikke en mand indeni. Et mylder af tykke, blege orme styrer leddene. De rækker en pansret hånd frem mod dig og rasler med en tung læderpung fyldt med guld.",
        biome: ['ruin', 'slagmark'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Kast din varme kappe over dem som bytte",
                kosterItem: 'kappe',
                udfaldListe: [
                    { log: "Ormene elsker mørket i stoffet. De danner et bo i kappen og slipper pungen med guld.", aktionType: 'guld', vaerdi: 60 }
                ]
            },
            {
                tekst: "Slå hånden væk og spark hjelmen af",
                udfaldListe: [
                    { log: "Ormene reagerer prompte og sprøjter ætsende syre ud gennem visiret. Din hud brænder.", aktionType: 'hp', vaerdi: -30 },
                    { log: "Du vælter rustningen bagover. Ormene flygter i panik og efterlader udstyret.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Byd dem din arm og betal med dit blod",
                udfaldListe: [
                    { log: "De suger grådigt fra din pulsåre. Det svækker dig voldsomt, men de lægger pungen i din kolde hånd.", aktionType: 'hp', vaerdi: -40, naesteTrin: 'parasit_pungen' }
                ]
            },
            {
                tekst: "Stjæl pungen og dirk panseret op lynhurtigt",
                kraeverKarakter: 'tyv',
                udfaldListe: [
                    { log: "Dine fingre er for hurtige. Du fjerner både guld og brystharnisk, før de fatter mistanke.", aktionType: 'guld', vaerdi: 40, givItem: 'rustning' }
                ]
            }
        ]
    },

    'parasit_pungen': {
        id: 'parasit_pungen',
        titel: "Blodets Pris",
        tekst: "Du har pungen, og ormene lader dig være. Vægten er enorm, men du bemærker en svag, rytmisk bevægelse inde fra selve læderet.",
        biome: ['ruin', 'slagmark'],
        erSubTrin: true,
        valg: [
            {
                tekst: "Åbn pungen og hæld indholdet ud",
                udfaldListe: [
                    { log: "Det er ikke guld. Det er hundredevis af forgyldte tænder. Alligevel bærer de en høj værdi.", aktionType: 'guld', vaerdi: 70 },
                    { log: "Mønterne er dækket af en helbredende svamp. Det var en fremragende byttehandel.", aktionType: 'hp', vaerdi: 50 }
                ]
            },
            {
                tekst: "Brænd pungen lukket med dit bål",
                udfaldListe: [
                    { log: "Bevægelsen stopper. Du skærer læderet op og finder en massiv, sleben ædelsten.", aktionType: 'guld', vaerdi: 120 }
                ]
            }
        ]
    },

    'de_omfavnede': {
        id: 'de_omfavnede',
        titel: "Den Evige Omfavnelse",
        tekst: "To skeletter knæler i mudderet. Tykke, sorte rødder har syet deres ribben sammen i en ubrydelig, krampagtig omfavnelse. Mellem deres brystkasser hænger en tung guldhalskæde, der holdes fast af knogler og tjørn.",
        biome: ['skov', 'ruin'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Hug ribbenene over med magt",
                kraeverItem: 'svaerd',
                udfaldListe: [
                    { log: "Knoglerne splintrer under dit blad. Tjørnen pisker dig over ansigtet i en refleks, men du får guldet fri.", aktionType: 'guld', vaerdi: 50 },
                    { log: "Du skiller dem ad. En sky af giftige sporer siver ud fra deres forenede lunger. Du hoster blod op.", aktionType: 'hp', vaerdi: -20, givItem: 'rustning' }
                ]
            },
            {
                tekst: "Træk halskæden fri med de bare næver",
                udfaldListe: [
                    { log: "Tjørnen flænger dit kød til benet. Du bløder voldsomt, men kæden er din.", aktionType: 'hp', vaerdi: -30 },
                    { log: "Du lirker den løs. Rødderne strammer grebet om skeletterne og knuser dem til støv.", aktionType: 'guld', vaerdi: 40 }
                ]
            },
            {
                tekst: "Velsign deres evige bånd",
                kraeverKarakter: 'praest',
                udfaldListe: [
                    { log: "Lyset skinner svagt. Rødderne trækker sig tilbage og lader halskæden falde i dine hænder som en tak.", aktionType: 'guld', vaerdi: 60 }
                ]
            },
            {
                tekst: "Bræk fingrene af dem og tag deres ringe",
                udfaldListe: [
                    { log: "Du stjæler deres ringe. En isnende kulde sætter sig fast i dit bryst og nægter at slippe.", aktionType: 'hp', vaerdi: -15 }
                ]
            }
        ]
    },

    'enkens_byrde': {
        id: 'enkens_byrde',
        titel: "Enkens Fodring",
        tekst: "En kvinde i lasede klæder sidder på kanten af et mudret krater. Hun skærer dybe snit i sine egne underarme og lader blodet dryppe ned i mørket. Noget dernede smasker kærligt. Hun beder dig om hjælp til at mætte sin husbond.",
        biome: ['mark', 'eng'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Hæld din Livseliksir i krateret",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Væsken rammer mørket. Væsenet kaster en byld op, der brister og afslører funklende ædelsten.", aktionType: 'guld', vaerdi: 90 },
                    { log: "Bæstet vokser voldsomt af medicinen. Det kravler halvt op og afleverer sit aflagte skjold af brusk.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Giv dit eget blod til hendes mand",
                udfaldListe: [
                    { log: "Du lader det drikke fra din pulsåre. Du besvimer næsten, men kvinden giver dig en tung belønning.", aktionType: 'hp', vaerdi: -40, givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Spark kvinden ned til ham",
                udfaldListe: [
                    { log: "Hun skriger, da kæberne smækker i. Bæstet fortærer hende og efterlader hendes taske ubevogtet.", aktionType: 'guld', vaerdi: 55 }
                ]
            },
            {
                tekst: "Forbind hendes sår mod hendes vilje",
                kraeverItem: 'kappe',
                kosterItem: 'kappe',
                udfaldListe: [
                    { log: "Du tvinger stoffet om hendes arme. Væsenet brøler af sult nede i mørket. Hun overlever.", aktionType: 'fortsaet' }
                ]
            }
        ]
    },

    'det_sultne_blad': {
        id: 'det_sultne_blad',
        titel: "En Kold Affære",
        tekst: "Et utroligt smukt sværd sidder boret gennem brystet på en død eventyrer. Klingen vibrerer svagt. Den udsender en varme, der føles som ren, besiddende hengivenhed. Den vil trækkes fri. Den vil elske en ny ejer.",
        biome: ['slagmark', 'bjerg'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Efterlad din rustning som bytte og tag sværdet",
                kosterItem: 'rustning',
                udfaldListe: [
                    { log: "Våbnet accepterer din gave. Det slipper kødet villigt og lægger sig perfekt i din hånd.", aktionType: 'fortsaet', givItem: 'svaerd' }
                ]
            },
            {
                tekst: "Grib hjaltet uden at ofre noget",
                udfaldListe: [
                    { log: "Sværdet flænger dine hænder til blods i vrede over din nærighed. Du tvinger det med dig alligevel.", aktionType: 'hp', vaerdi: -25, givItem: 'svaerd' }
                ]
            },
            {
                tekst: "Lirk guldringene af liget og lad sværdet sidde",
                kraeverKarakter: 'tyv',
                udfaldListe: [
                    { log: "Du tager værdierne uden at røre våbnet. Vægten i din lomme vokser hurtigt.", aktionType: 'guld', vaerdi: 45 }
                ]
            },
            {
                tekst: "Tal våbnets sande navn",
                kraeverKarakter: 'kultist',
                udfaldListe: [
                    { log: "Stålet hviner af glæde. En strøm af mørk energi flyder fra grebet og op i dine årer.", aktionType: 'hp', vaerdi: 50, givItem: 'svaerd' }
                ]
            }
        ]
    },

    'koedbrylluppet': {
        id: 'koedbrylluppet',
        titel: "Bryllup i Tjørnen",
        tekst: "Fire muterede skikkelser har bundet et panisk udyr fast til et alter af brusk. De fejrer et grotesk bryllup. Bruden er en sygelig masse af kød, der bærer en massiv guldkrone. De rækker en skål med sort væske frem mod dig.",
        biome: ['ruin', 'ritual'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Drik brudeskålen i én slurk",
                udfaldListe: [
                    { log: "Væsken er ren gift. Dit hjerte hamrer uregelmæssigt, og du falder omkuld.", aktionType: 'kollaps' },
                    { log: "Det smager af jern og rodfrugter. Dine celler deler sig eksplosivt og lukker alle dine sår.", aktionType: 'hp', vaerdi: 80 }
                ]
            },
            {
                tekst: "Læg 30 guld på alteret som gave",
                puljeVaerdi: 30,
                udfaldListe: [
                    { log: "Skikkelserne nikker anerkendende. Bruden kaster en sjælden flaske i din retning.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Angrib festen brutalt",
                kraeverKarakter: 'kriger',
                udfaldListe: [
                    { log: "Du fælder dem alle. Det koster dig dyrt i helbred, men du river kronen af kødmassen.", aktionType: 'hp', vaerdi: -30, givItem: 'rustning' }
                ]
            },
            {
                tekst: "Vend ryggen til det perverse syn",
                udfaldListe: [
                    { log: "Du lader dem fortsætte ritualet og sniger dig væk.", aktionType: 'fortsaet' }
                ]
            }
        ]
    },

    'bejlerens_kiste': {
        id: 'bejlerens_kiste',
        titel: "Det Låste Løfte",
        tekst: "En mand har lænket sig selv fast til en tung jernkiste. Han er næsten død af sult. Han svor at beskytte kisten til sin elskede vendte tilbage. Nøglen hænger om hans hals. Han tigger dig om at lade ham holde sit løfte.",
        biome: ['by', 'bjerg'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Slå ham ihjel og tag nøglen",
                kraeverItem: 'svaerd',
                naesteTrin: 'bejlerens_straf'
            },
            {
                tekst: "Giv ham Livseliksir for at forlænge hans ventetid",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Væsken giver ham farve i kinderne. I taknemmelighed afleverer han sit eget skjold.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Begrav ham levende med kisten",
                kraeverItem: 'skovl',
                udfaldListe: [
                    { log: "Mudderet dækker hans ansigt. Det er barmhjertigt på en syg måde. Du finder mønter i jorden.", aktionType: 'guld', vaerdi: 35 }
                ]
            },
            {
                tekst: "Stjæl kisten og træk ham med dig i lænken",
                udfaldListe: [
                    { log: "Byrden er enorm. Dine led knirker under vægten. Til sidst dør han, og du tager indholdet.", aktionType: 'hp', vaerdi: -25, givItem: 'rustning' }
                ]
            }
        ]
    },

    'bejlerens_straf': {
        id: 'bejlerens_straf',
        titel: "Blodets Bytte",
        tekst: "Du skærer mandens hals over. Han yder ingen modstand, men stirrer bebrejdende på dig. Du låser kisten op.",
        biome: ['by', 'bjerg'],
        erSubTrin: true,
        valg: [
            {
                tekst: "Åbn låget",
                udfaldListe: [
                    { log: "Kisten er fyldt med tunge guldbarrer. Et massivt fund, bygget på et knust løfte.", aktionType: 'guld', vaerdi: 120 },
                    { log: "Kisten indeholder kun et råddent kranie. En aggressiv sporemassakre blæser op i dit ansigt.", aktionType: 'hp', vaerdi: -40 }
                ]
            }
        ]
    },


'spejlets_gaade': {
        id: 'spejlets_gaade',
        titel: "Sort Obsidian",
        tekst: "Et enormt spejl af sort glas spærrer stien. Din refleksion kigger på dig. Den bløder fra øjnene. Den bevæger læberne og hvisker gennem glasset, at du skal ofre det du frygter, for at vinde det du mangler.",
        biome: ['ruin', 'bjerg'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Knus spejlbilledet med din klinge",
                kraeverItem: 'svaerd',
                udfaldListe: [
                    { log: "Glasset splintres. Din egen krop rives op af usynlige skår. Du bløder, men finder gamle mønter i rammen.", aktionType: 'hp', vaerdi: -35, givItem: 'rustning' },
                    { log: "Spejlet æder stødet. Våbnet falder ud af dine hænder, og glasset brækker over i to stykker fyldt med guld.", aktionType: 'guld', vaerdi: 50 }
                ]
            },
            {
                tekst: "Læg mønter på rammen som betaling",
                puljeVaerdi: 20,
                udfaldListe: [
                    { log: "Refleksionen smiler blodigt. Den rækker en hånd ud gennem glasset og kaster en kolbe til dig.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Sælg dit tøj til skyggen i spejlet",
                kosterItem: 'rustning',
                udfaldListe: [
                    { log: "Skyggen tager din beskyttelse på. Spejlet forsvinder i en sky af røg og efterlader en tung skat på jorden.", aktionType: 'guld', vaerdi: 80 }
                ]
            },
            {
                tekst: "Stir tilbage indtil spejlet viger",
                kraeverKarakter: 'kriger',
                udfaldListe: [
                    { log: "Din vrede overmander magien. Glasset krakelerer af ren frygt og spytter et skjult sværd ud.", aktionType: 'fortsaet', givItem: 'svaerd' }
                ]
            }
        ]
    },

    'tre_hoveder': {
        id: 'tre_hoveder',
        titel: "Løgnerens Port",
        tekst: "Tre afhuggede stenhoveder sidder fast på en jernport. De taler i munden på hinanden. Den ene lyver altid. Den anden taler sandt. Den tredje skriger bare uafbrudt og overdøver de to andre.",
        biome: ['ruin', 'by'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Hæld eliksir ned i halsen på den skrigende",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Væsken heler stenen. Hovedet stopper med at skrige og hoster et smykke op fra portens indre.", aktionType: 'guld', vaerdi: 60 }
                ]
            },
            {
                tekst: "Brug skovlen og smadr den løgnagtige",
                kraeverItem: 'skovl',
                udfaldListe: [
                    { log: "Du smadrer hovedet. Porten går op, men stumperne river dybe sår i dine arme.", aktionType: 'hp', vaerdi: -25, givItem: 'rustning' }
                ]
            },
            {
                tekst: "Ignorer gåden og træk porten op",
                udfaldListe: [
                    { log: "Mekanismen klemmer dine fingre knusende hårdt. Du kommer igennem med store smerter og tomme hænder.", aktionType: 'hp', vaerdi: -20 },
                    { log: "Du river hasperne over. Bag porten venter intet andet end en forladt læderpung.", aktionType: 'guld', vaerdi: 15 }
                ]
            },
            {
                tekst: "Hør Guds stemme gennem larmen",
                kraeverKarakter: 'praest',
                udfaldListe: [
                    { log: "Du filtrerer løgnen fra. Sandheden låser porten op og helbreder dine sår med et svagt lys.", aktionType: 'hp', vaerdi: 40 }
                ]
            }
        ]
    },

    'oraklets_spil': {
        id: 'oraklets_spil',
        titel: "Tankelæseren",
        tekst: "En blind skabning med en massiv, blottet hjerne blokerer broen. Han tvinger dig til at spille med. Han beder dig tænke på et tal. Han vil grave det ud af dit sind med vold, hvis du nægter at tale.",
        biome: ['mark', 'eng'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Lad ham æde dine tanker",
                udfaldListe: [
                    { log: "Hans sind trænger ind i dit. Smerten får dig til at kaste op. Han tager dine hemmeligheder, men betaler i ædelsten.", aktionType: 'hp', vaerdi: -35, givItem: 'rustning' }
                ]
            },
            {
                tekst: "Forstyr hans koncentration med larmende mønter",
                puljeVaerdi: 30,
                udfaldListe: [
                    { log: "Lyden af guld afsporer hans evner. Han tager pengene og rækker dig blindt et solidt våben.", aktionType: 'fortsaet', givItem: 'svaerd' }
                ]
            },
            {
                tekst: "Tænk på absolut og betingelsesløs vold",
                kraeverItem: 'svaerd',
                udfaldListe: [
                    { log: "Billederne i dit hoved får oraklet til at bløde kraftigt fra næsen. Han trækker sig tilbage i rædsel og taber en flaske.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Tal hans eget sande navn højt",
                kraeverKarakter: 'kultist',
                udfaldListe: [
                    { log: "Hans store hjerne kramper. Du bryder hans magt og tømmer hans lommer uden modstand.", aktionType: 'guld', vaerdi: 70 }
                ]
            }
        ]
    },

    'benskak': {
        id: 'benskak',
        titel: "Evighedens Bræt",
        tekst: "Et stengulv danner et gigantisk skakbræt. Brikkerne er udhugget af menneskeknogler. Du træder ind på feltet og er øjeblikkeligt sat skakmat af usynlige kræfter. Spillet kræver et træk.",
        biome: ['ruin', 'slagmark'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Vælt kongen og overgiv dig",
                udfaldListe: [
                    { log: "Stengulvet flækker og sluger dig. Du falder tungt ned i mørket og besvimer.", aktionType: 'kollaps' },
                    { log: "Gulvet åbner sig roligt. Du stiger ned i et skjult kammer fyldt med mønter.", aktionType: 'guld', vaerdi: 90 }
                ]
            },
            {
                tekst: "Ofre din rustning som en ny brik",
                kosterItem: 'rustning',
                udfaldListe: [
                    { log: "Brættet accepterer metallet. Spillet nulstilles, og tågen afslører en sikker vej og en glemt medicin.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Træk et ulovligt træk, mens brættet kigger væk",
                kraeverKarakter: 'tyv',
                udfaldListe: [
                    { log: "Du snyder systemet. Brikkerne fryser fast, og modstanderens guldindsats materialiserer sig foran dig.", aktionType: 'guld', vaerdi: 50 }
                ]
            },
            {
                tekst: "Knus dronningen med din klinge",
                kraeverItem: 'svaerd',
                udfaldListe: [
                    { log: "Knoglerne splintres. Den usynlige modstander skriger af vrede og river din hud op, men magien brydes.", aktionType: 'hp', vaerdi: -20, givItem: 'rustning' }
                ]
            }
        ]
    },

    'tungelaasen': {
        id: 'tungelaasen',
        titel: "Stilhedens Sprog",
        tekst: "En massiv metaldør er forseglet. Låsen er ikke et nøglehul, men en klynge af afskårne tunger. Du skal trykke på dem i den rigtige rækkefølge for at stave et glemt ord.",
        biome: ['by', 'ruin'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Stav ordet SMERTE med fingrene",
                udfaldListe: [
                    { log: "Tungerne slikker dine fingre tørre for blod. Døren glider op og koster dig en del helbred.", aktionType: 'hp', vaerdi: -25, givItem: 'svaerd' },
                    { log: "Mekanismen klikker. Døren svinger lydløst op og belønner dig med et glemt skatkammer.", aktionType: 'guld', vaerdi: 60 }
                ]
            },
            {
                tekst: "Skær mekanismen fri med vold",
                kraeverItem: 'skovl',
                kosterItem: 'skovl',
                udfaldListe: [
                    { log: "Du bryder låsen. Bag døren ligger en beskyttende kappe svøbt i støv.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Dryp eliksir på de tørre muskler",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Tungerne vækkes til live. De synger koden højt, og bag porten finder du et hav af guld.", aktionType: 'guld', vaerdi: 100 }
                ]
            },
            {
                tekst: "Smag på dem for at finde svaret",
                udfaldListe: [
                    { log: "Smagen af forrådnelse sender dig i gulvet med voldsomme kramper.", aktionType: 'kollaps' }
                ]
            }
        ]
    },

    'jernjomfruens_dom': {
        id: 'jernjomfruens_dom',
        titel: "Piggenes Omfavnelse",
        tekst: "En massiv jernjomfru står midt i et stinkende mudderhul. Lågerne er på vej til at smække i om et lig, der knuger en tung kiste. Du har sekunder til at reagere, før piggene låser skatten fast for evigt.",
        biome: ['hule', 'ruin'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Brug din økse som en kile i døråbningen",
                kraeverItem: 'oekse',
                kosterItem: 'oekse',
                udfaldListe: [
                    { log: "Skaftet brækker under presset! Du får armen ind og hiver kisten ud, før dørene knuser våbnet helt.", aktionType: 'guld', vaerdi: 80 }
                ]
            },
            {
                tekst: "Hæld eliksir på de rustne hængsler",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Væsken æder rusten på magisk vis. Dørene falder af, og du træder ind for at plyndre den døde.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Brug din kniv til at låse mekanismen før den smækker",
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: "Dine fingre er hurtige. Du blokerer et tandhjul med knivsbladet og skærer den dødes læderpung fri.", aktionType: 'guld', vaerdi: 50 }
                ]
            },
            {
                tekst: "Brug al din kraft på at holde lågerne",
                kraeverKarakter: 'viking_m', 
                udfaldListe: [
                    { log: "Dine sener er tæt på at briste. Du holder jernet stangen, mens du med foden trækker et blankt sværd ud af liget.", aktionType: 'hp', vaerdi: -15, givItem: 'svaerd' }
                ]
            },
            {
                tekst: "Tving hånden ind gennem den lukkende sprække",
                udfaldListe: [
                    { log: "Piggene flænger din arm! Du trækker hånden til dig i smerte og mister store mængder blod.", aktionType: 'hp', vaerdi: -35 },
                    { log: "Du bliver spiddet, men får fat i en håndfuld store ædelsten, før du river dig fri.", aktionType: 'hp', vaerdi: -20, givItem: 'svaerd' }
                ]
            }
        ]
    },

    'smeltediglen': {
        id: 'smeltediglen',
        titel: "Den Sygdomsramte Esse",
        tekst: "En stensat grav flyder med sydende magma. Varmen svider dine øjenbryn. I bunden af graven flyder hundredvis af smeltede mønter sammen til en massiv klump, der kræver en ofring at nå ned til.",
        biome: ['bjerg', 'ruin'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Kast dit fine tøj i magmaen for at dæmpe varmen",
                kosterItem: 'flot_toej',
                udfaldListe: [
                    { log: "Silken brænder øjeblikkeligt væk og danner et tykt askelag, du kan træde på længe nok til at gribe guldet.", aktionType: 'guld', vaerdi: 100 }
                ]
            },
            {
                tekst: "Grav en kanal og led magmaen væk",
                kraeverItem: 'skovl',
                udfaldListe: [
                    { log: "Skovlen koger i dine hænder. Det lykkes dig at tømme graven delvist og hugge værdierne fri.", aktionType: 'hp', vaerdi: -15, givItem: 'sabel' }
                ]
            },
            {
                tekst: "Brug staven til at trække klumpen op",
                kraeverItem: 'stav',
                kosterItem: 'stav',
                udfaldListe: [
                    { log: "Træet bryder i brand! Du flår klumpen op på kanten, før våbnet forvandles til aske.", aktionType: 'guld', vaerdi: 70 }
                ]
            },
            {
                tekst: "Ræk armen direkte ned i flammerne",
                udfaldListe: [
                    { log: "Varmen steger dit kød. Smerten er ulidelig, men du trækker en smeltet og værdifuld guldklump op.", aktionType: 'guld', vaerdi: 60 } 
                ]
            }
        ]
    },

    'den_blinde_samler': {
        id: 'den_blinde_samler',
        titel: "Købmanden Uden Øjne",
        tekst: "Et væsen syet sammen af lasede lærredsposer sidder på en trone af skrot. Det mangler et ansigt. Det beder grådigt om specifikt udstyr for at fuldende sin samling og nægter at acceptere mønter.",
        biome: ['mark', 'by'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Doner din skovl til væsenet",
                kosterItem: 'skovl',
                udfaldListe: [
                    { log: "Den æder træskaftet med glæde. Som tak spytter den en intakt flaske helbredelse ud.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Doner dine beskidte klude",
                kosterItem: 'klude',
                udfaldListe: [
                    { log: "Den gnider sig i stoffet med stor tilfredshed. Den rækker dig i stedet et fint sæt adeligt tøj.", aktionType: 'fortsaet', givItem: 'flot_toej' }
                ]
            },
            {
                tekst: "Tving dens mund op med staven",
                kraeverItem: 'stav',
                kraeverKarakter: 'magician_m',
                udfaldListe: [
                    { log: "Du tvinger poserne fra hinanden! Inde i dens bløde krop finder du resterne af dens tidligere ofre.", aktionType: 'guld', vaerdi: 80 }
                ]
            },
            {
                tekst: "Slå den ned med de bare næver",
                udfaldListe: [
                    { log: "Poserne sprækker, og ud over dig vælter det med stikkende insekter, der tygger sig gennem din hud.", aktionType: 'hp', vaerdi: -40 }
                ]
            }
        ]
    },

    'blodbroenden': {
        id: 'blodbroenden',
        titel: "Knivenes Skakt",
        tekst: "En dyb stensat brønd er foret med rustne knivblade, der peger opad. En død eventyrer ligger i bunden oven på en lædertaske. Du er nødt til at tænke kynisk, hvis du vil ned.",
        biome: ['ruin', 'slagmark'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Kast din rustning ned over bladene som et tæppe",
                kosterItem: 'rustning',
                udfaldListe: [
                    { log: "Metallet dækker de skarpeste klinger. Du glider derned og henter en skinnende metaldetektor i tasken.", aktionType: 'fortsaet', givItem: 'metaldetektor' }
                ]
            },
            {
                tekst: "Brug søgekvisten til at finde den blinde vinkel",
                kraeverItem: 'soegekvist',
                udfaldListe: [
                    { log: "Kvisten vibrerer og viser en smal, ufarlig sti nedad. Du tømmer tasken i ro og mag.", aktionType: 'guld', vaerdi: 65 }
                ]
            },
            {
                tekst: "Skyd liget nede i bunden med din bue for at løsne tasken",
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: "Pilen rammer perfekt. Tasken tipper, og mønterne regner ud af bunden, hvor du kan samle dem med skovlen.", aktionType: 'guld', vaerdi: 40 }
                ]
            },
            {
                tekst: "Spring derned i blinde",
                udfaldListe: [
                    { log: "Knivene river i dit kød. Du slår dig blødende, men overlever faldet og river en medicin op fra bunden.", aktionType: 'hp', vaerdi: -30, givItem: 'livseliksir' }
                ]
            }
        ]
    },

    'forraadnelsens_alter': {
        id: 'forraadnelsens_alter',
        titel: "Den Syge Helligdom",
        tekst: "En aggressiv svamp har opslugt et lille alter. Den nedbryder alt organisk materiale i rasende fart. Noget skinnende pulserer inde midt i den ætsende masse.",
        biome: ['ritual', 'skov'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Stik dit sværd ind i massen for at åbne den",
                kosterItem: 'svaerd',
                udfaldListe: [
                    { log: "Svampen æder metallet på få sekunder, men alteret blottes! Du tager hurtigt en kasse med intakte mønter.", aktionType: 'guld', vaerdi: 70 }
                ]
            },
            {
                tekst: "Brug din skovl til at vippe det fri på afstand",
                kraeverItem: 'skovl',
                udfaldListe: [
                    { log: "Det kræver præcision, men du får skrabt en intakt bue ud fra massen uden at røre ved forrådnelsen.", aktionType: 'fortsaet', givItem: 'bue' }
                ]
            },
            {
                tekst: "Grib tingen som Udforsker",
                kraeverKarakter: 'explorer_m', 
                udfaldListe: [
                    { log: "Du kender denne svampeart. Du smører dine hænder i mudder først og trækker en intakt rustning ud af pulsen.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Stik de bare hænder ind i ætsningen",
                udfaldListe: [
                    { log: "Syren brænder dit kød af. Du skriger, men redder en enorm mængde guld fra at blive nedbrudt.", aktionType: 'guld', vaerdi: 100 }
                ]
            }
        ]
    },

    'krystalgeoden': {
        id: 'krystalgeoden',
        titel: "Den Syngende Sten",
        tekst: "En massiv, violet krystal svæver få centimeter over jorden. Den udsender en lavfrekvent tone, der får dine knogler til at vibrere. Indkapslet i midten svæver en tung guldbarre. Tonen splintrer langsomt alt metal i nærheden.",
        biome: ['krystal', 'hule'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Brug din metaldetektor til at forstyrre frekvensen",
                kosterItem: 'metaldetektor',
                udfaldListe: [
                    { log: "Maskinens spoler brænder sammen. Frekvensen kollapser, og krystallen splintres i tusind ufarlige stykker. Guldbarren er din.", aktionType: 'guld', vaerdi: 150 }
                ]
            },
            {
                tekst: "Slå krystallen midt over med staven",
                kraeverItem: 'stav',
                udfaldListe: [
                    { log: "Træet absorberer chokbølgen. Krystallen flækker, men et stort skår skærer dig i låret.", aktionType: 'hp', vaerdi: -25, givItem: 'rustning' }
                ]
            },
            {
                tekst: "Sæt dig i skrædderstilling og sug resonansen til dig",
                kraeverKarakter: 'magician_f',
                udfaldListe: [
                    { log: "Din krop fungerer som en svamp. Den voldsomme energi lukker dine sår og fylder dig med en umenneskelig kraft.", aktionType: 'hp', vaerdi: 100 }
                ]
            },
            {
                tekst: "Slå på den med de bare næver",
                udfaldListe: [
                    { log: "Tonen kaster dig bagover med enorm kraft. Du brækker flere ribben, men en håndfuld mønter falder ud af revnerne.", aktionType: 'hp', vaerdi: -40, givItem: 'livseliksir' }
                ]
            }
        ]
    },

    'alkymistens_kar': {
        id: 'alkymistens_kar',
        titel: "Syrebadet",
        tekst: "Et forladt laboratorium flyder med grønt slim. Et stort, åbent kobberkar koger over i midten af rummet. Bunden er dækket af et tykt lag mønter, men væsken ætser alt organisk materiale på sekunder.",
        biome: ['ruin'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Hæld din livseliksir i karret for at neutralisere syren",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Væskerne reagerer med et brag. Syren skummer over og fordamper. Du kan samle mønterne op fra bunden uden fare.", aktionType: 'guld', vaerdi: 120 }
                ]
            },
            {
                tekst: "Dyp dine klude i væsken for at hærde dem",
                kosterItem: 'klude',
                udfaldListe: [
                    { log: "Stoffet suger syren og krystalliserer øjeblikkeligt. Du har netop skabt et formidabelt panser af skrald.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Kast 50 guld i badet for at fremtvinge en reaktion",
                puljeVaerdi: 50,
                udfaldListe: [
                    { log: "Guldet smelter og binder sig til et defekt våben på bunden. Karret spytter et perfekt sværd ud over kanten.", aktionType: 'fortsaet', givItem: 'svaerd' }
                ]
            },
            {
                tekst: "Brug din bue til at fiske mønterne op",
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: "Strengen ætses væk, men træet holder længe nok til at skrabe en solid bunke guld ud på gulvet.", aktionType: 'guld', vaerdi: 60 }
                ]
            },
            {
                tekst: "Ræk armen i syren",
                udfaldListe: [
                    { log: "Kødet skrælles af dine knogler. Smerten får dig til at besvime på pletten.", aktionType: 'kollaps' }
                ]
            }
        ]
    },

    'blodtraeet': {
        id: 'blodtraeet',
        titel: "Skovens Blod",
        tekst: "Bark på et enormt asketræ pulserer som en blodåre. En karavane er blevet opslugt af rødderne. Træet bløder en tyk, rød væske, der lugter skarpt af jern. Du kan se værdier kilet fast mellem rødderne.",
        biome: ['blodskov', 'skov'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Hug roden over og ofr din økse",
                kosterItem: 'oekse',
                udfaldListe: [
                    { log: "Æggen sætter sig urokkeligt fast i træets kød. Roden giver slip på et massivt bytte, men øksen er tabt.", aktionType: 'guld', vaerdi: 110 }
                ]
            },
            {
                tekst: "Brug søgekvisten til at finde grenen uden puls",
                kraeverItem: 'soegekvist',
                udfaldListe: [
                    { log: "Kvisten peger på en død gren. Du knækker den af og lirker en tung læderpung ud af stammens indre.", aktionType: 'guld', vaerdi: 75 }
                ]
            },
            {
                tekst: "Riv rødderne fra hinanden med rå muskelkraft",
                kraeverKarakter: 'viking_f',
                udfaldListe: [
                    { log: "Du tvinger træet i knæ. Det sprøjter blod i ansigtet på dig, men du flår en solid sabel ud af dets greb.", aktionType: 'hp', vaerdi: -20, givItem: 'sabel' }
                ]
            },
            {
                tekst: "Stil dig under blodet og drik",
                udfaldListe: [
                    { log: "Det smager af kobber og jord. Det giver kramper i maven, men det lukker dine mest kritiske sår.", aktionType: 'hp', vaerdi: 60 }
                ]
            }
        ]
    },

    'toldkraeversvinet': {
        id: 'toldkraeversvinet',
        titel: "Tyvekongens Skat",
        tekst: "En brutaliseret toldopkræver hænger med hovedet nedad fra en bjælke. Hans mave er unaturligt opsvulmet. De lokale banditter har tvunget ham til at sluge hele dagens fortjeneste. Han er knap nok i live.",
        biome: ['bandit', 'marked'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Læg et snit i hans mave med din kniv",
                kraeverItem: 'kniv',
                udfaldListe: [
                    { log: "Et præcist snit åbner ham op. Han udånder for sidste gang, og en strøm af guld vælter ned i mudderet.", aktionType: 'guld', vaerdi: 90 }
                ]
            },
            {
                tekst: "Lås kæberne op gennem hans hals",
                kraeverKarakter: 'thief_m',
                udfaldListe: [
                    { log: "Du behøver intet blad. Du trykker på de rigtige punkter på hans hals, og han kaster skatten op.", aktionType: 'guld', vaerdi: 120 }
                ]
            },
            {
                tekst: "Skær ham ned og giv ham medicin",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Du redder hans liv. I taknemmelighed rækker han dig en beskidt, men solid detektor fra sin støvle.", aktionType: 'fortsaet', givItem: 'metaldetektor' }
                ]
            },
            {
                tekst: "Skyd rebet over med din bue",
                kraeverItem: 'bue',
                udfaldListe: [
                    { log: "Han falder tungt til jorden og brækker nakken. Stødet tvinger en del mønter ud af hans mund.", aktionType: 'guld', vaerdi: 50 }
                ]
            },
            {
                tekst: "Tag hans dyre støvler og lad ham hænge",
                udfaldListe: [
                    { log: "Støvlerne sidder fast. Du hiver til, og fælden udløses. Et skjult blad snitter dig dybt i armen.", aktionType: 'hp', vaerdi: -25 }
                ]
            }
        ]
    },

    'glasbaestet': {
        id: 'glasbaestet',
        titel: "Det Forstenede Udyr",
        tekst: "Et enormt rovdyr er frosset fast midt i et spring. En alkymistisk reaktion har forvandlet dets kød og knogler til massivt, uigennemtrængeligt glas. Dets hjerte lyser op indefra som en klump af rent, blåt lys.",
        biome: ['krystal', 'gen'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Stød din sabel direkte ind i hjertet og bryd klingen",
                kosterItem: 'sabel',
                udfaldListe: [
                    { log: "Våbnet splintres mod glasset, men kraften slår hjertet løs. Det er ikke kød, men en ekstremt sjælden eliksir.", aktionType: 'fortsaet', givItem: 'livseliksir' }
                ]
            },
            {
                tekst: "Brug skovlen til at hakke dets glastænder ud",
                kraeverItem: 'skovl',
                udfaldListe: [
                    { log: "Tænderne knækker af i perfekte, gennemsigtige kegler. De repræsenterer en enorm værdi på ethvert marked.", aktionType: 'guld', vaerdi: 85 }
                ]
            },
            {
                tekst: "Afmonter skabningen led for led",
                kraeverKarakter: 'explorer_f',
                udfaldListe: [
                    { log: "Du kender kroppens anatomi. Du piller glaspanseret af skabningen uden at ødelægge pladerne og tager det på.", aktionType: 'fortsaet', givItem: 'rustning' }
                ]
            },
            {
                tekst: "Kast alt dit fine tøj over det for at dæmpe lyset",
                kosterItem: 'flot_toej',
                udfaldListe: [
                    { log: "Mørket får glasset til at slappe af. Skabningen åbner munden et par centimeter og lader en bue falde ud.", aktionType: 'fortsaet', givItem: 'bue' }
                ]
            },
            {
                tekst: "Lirk en gemt mønt fri fra dets pote med din kniv",
                kosterItem: 'kniv',
                udfaldListe: [
                    { log: "Kniven knækker under presset, men mønten slipper. Bag den vælter en lind strøm af guld ud af glasset.", aktionType: 'guld', vaerdi: 60 }
                ]
            },
            {
                tekst: "Spark til dets krystalliserede bagben",
                udfaldListe: [
                    { log: "Benet splintres i spidse skår. Nogle af dem borer sig dybt ind i din krop. Du mister bevidstheden af chokket.", aktionType: 'kollaps' }
                ]
            }
        ]
    },

    'lejesvendenes_fald': {
        id: 'lejesvendenes_fald',
        titel: "De faldne lejesvende",
        tekst: "Døde lejesvende ligger i en ring om en smadret vogn. Deres lønningskiste er sprunget læk. Tykke guldbarrer ligger spredt i mudderet. Desværre har de nået at spænde dødbringende snubletråde ud over hele området, før de døde.",
        biome: ['slagmark', 'marked'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Brug detektoren til at finde en sikker rute",
                kraeverItem: 'metaldetektor',
                udfaldListe: [
                    { log: "Maskinen hyler over trådene. Du navigerer perfekt gennem fælderne og fylder tasken med guldbarrer.", aktionType: 'guld', vaerdi: 150 }
                ]
            },
            {
                tekst: "Grav en tunnel under fælderne",
                kraeverItem: 'skovl',
                udfaldListe: [
                    { log: "Jorden er hård, og det tager timer. Du når ind til midten og henter en solid del af lønnen.", aktionType: 'guld', vaerdi: 90 }
                ]
            },
            {
                tekst: "Kast dit fine tøj over trådene for at udløse dem sikkert",
                kosterItem: 'flot_toej',
                udfaldListe: [
                    { log: "Pilene flænger dit tøj i stumper og stykker. Fælderne er afmonteret, og guldet er dit.", aktionType: 'guld', vaerdi: 120 }
                ]
            },
            {
                tekst: "Smid dig fladt ned og træk guldet til dig",
                kraeverKarakter: 'thief_f',
                udfaldListe: [
                    { log: "Du er smidig nok til at undgå udløserne og snupper værdierne for næsen af døden.", aktionType: 'guld', vaerdi: 110 }
                ]
            },
            {
                tekst: "Løb blindt ind og grib hvad du kan",
                udfaldListe: [
                    { log: "En bolt borer sig ind i din skulder. Du skriger, men får fat i en håndfuld mønter.", aktionType: 'hp', vaerdi: -30 }
                ]
            }
        ]
    },

    'alkymistens_flugt': {
        id: 'alkymistens_flugt',
        titel: "Alkymistens flugt",
        tekst: "En panisk mand forsøger at lette med en interimistisk luftballon. Han kaster tunge sække med guld ud over kanten for at vinde højde. Han råber ned til dig, at han mangler noget til at forsvare sig med mod fuglene.",
        biome: ['by', 'marked'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Kast din bue op til ham",
                kosterItem: 'bue',
                udfaldListe: [
                    { log: "Han griber våbnet. Som tak sparker han sin personlige sparekiste ud over kanten til dig.", aktionType: 'guld', vaerdi: 180 }
                ]
            },
            {
                tekst: "Tilbyd ham kniven",
                kosterItem: 'kniv',
                udfaldListe: [
                    { log: "Den er lille, men han accepterer. Han smider en pose mønter ned, før han svæver væk.", aktionType: 'guld', vaerdi: 70 }
                ]
            },
            {
                tekst: "Brug din stav til at trække ballonen ned",
                kraeverItem: 'stav',
                kosterItem: 'stav',
                udfaldListe: [
                    { log: "Træet splintres mod kurven. Han dumper af skræk endnu mere guld for at slippe fri af dit greb.", aktionType: 'guld', vaerdi: 130 }
                ]
            },
            {
                tekst: "Saml det guld op han allerede har smidt",
                udfaldListe: [
                    { log: "Sækkene er halvt nedsunket i mudderet. Det er ikke meget, men det er gratis.", aktionType: 'guld', vaerdi: 40 }
                ]
            }
        ]
    },

    'mudderets_bankboks': {
        id: 'mudderets_bankboks',
        titel: "Mudderets bankboks",
        tekst: "Et enormt jernskab er sunket dybt ned i sumpen. Kun det øverste af lågen stikker op. Den massive hængelås er rustet næsten helt i stykker. Tunge mønter klirrer svagt indeni.",
        biome: ['eng', 'hule'],
        vaegt: 3,
        unik: true,
        valg: [
            {
                tekst: "Slå hængelåsen i stykker med øksen",
                kosterItem: 'oekse',
                udfaldListe: [
                    { log: "Låsen giver efter med et brag, men din økse knækker midt over. Du lænser skabet for guld.", aktionType: 'guld', vaerdi: 160 }
                ]
            },
            {
                tekst: "Sæt skovlen i klemme og bræk lågen op",
                kosterItem: 'skovl',
                udfaldListe: [
                    { log: "Skaftet flækker. Jernet bøjer. Lågen springer op og afslører en formue.", aktionType: 'guld', vaerdi: 120 }
                ]
            },
            {
                tekst: "Brug dine klude til at binde om håndtaget og træk",
                kraeverItem: 'klude',
                udfaldListe: [
                    { log: "Stoffet skærer sig ind i dine hænder. Du flår skabet op og bliver belønnet for sliddet.", aktionType: 'guld', vaerdi: 80 }
                ]
            },
            {
                tekst: "Kræv skabet åbent i kraft af din titel",
                kraeverKarakter: 'royal_m',
                udfaldListe: [
                    { log: "Din vrede over øens tilstand får dig til at sparke til skabet i ren frustration. Låsen smuldrer mirakuløst.", aktionType: 'guld', vaerdi: 100 }
                ]
            }
        ]
    },

    'gudens_taarer': {
        id: 'gudens_taarer',
        titel: "Gudens tårer",
        tekst: "En massiv stenfigur af en glemt gud græder flydende guld fra sine hule øjne. Dråberne størkner, når de rammer gulvet. Varmen omkring statuen er nok til at koge vand på få sekunder.",
        biome: ['ruin', 'ritual'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Kast din rustning ind for at skærme varmen",
                kosterItem: 'rustning',
                udfaldListe: [
                    { log: "Metallet smelter og blander sig med tårerne, men det dæmper varmen nok til at du kan hugge klumperne fri.", aktionType: 'guld', vaerdi: 200 }
                ]
            },
            {
                tekst: "Brug din sabel som en spejlflade mod varmen",
                kraeverItem: 'sabel',
                udfaldListe: [
                    { log: "Stålet kaster den værste hede tilbage. Du skraber forsigtigt kanten af puljen og får en pæn sum.", aktionType: 'guld', vaerdi: 95 }
                ]
            },
            {
                tekst: "Styrkedrik dig immun og gå direkte ind",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Eliksiren køler dit blod ned. Du vader upåvirket ind i heden og bryder den største guldklump løs.", aktionType: 'guld', vaerdi: 175 }
                ]
            },
            {
                tekst: "Løb ind og saml en håndfuld",
                udfaldListe: [
                    { log: "Smerten er ubeskrivelig. Du brænder store dele af din krop, før du kaster dig ud igen.", aktionType: 'hp', vaerdi: -40 }
                ]
            }
        ]
    },

    'roeverkongens_spil': {
        id: 'roeverkongens_spil',
        titel: "Røverkongens væddemål",
        tekst: "En mand forbløder mod en træstamme. Han griner hæst. Han fortæller dig, at han har gravet sin formue ned i nærheden. Han vil kun give dig kortet, hvis du afslutter hans liv med et rigtigt sværd.",
        biome: ['bandit', 'skov'],
        vaegt: 4,
        unik: true,
        valg: [
            {
                tekst: "Efterkom hans ønske og ofr din klinge",
                kosterItem: 'svaerd',
                udfaldListe: [
                    { log: "Du støder bladet i brystet på ham. Han smiler, dør og lader kortet glide ud af hånden. Du finder guldet.", aktionType: 'guld', vaerdi: 150 }
                ]
            },
            {
                tekst: "Brug søgekvisten til at finde det selv",
                kraeverItem: 'soegekvist',
                udfaldListe: [
                    { log: "Du lader ham ligge og følger kvistens trækninger. Du udgraver formuen tyve skridt derfra.", aktionType: 'guld', vaerdi: 110 }
                ]
            },
            {
                tekst: "Brug din viden om terrænet til at aflæse jorden",
                kraeverKarakter: 'explorer_m',
                udfaldListe: [
                    { log: "Du ser tydelige mærker i skovbunden efter hans tunge slæb. Du følger sporet og tager skatten.", aktionType: 'guld', vaerdi: 130 }
                ]
            },
            {
                tekst: "Gennemsøg hans lommer og forlad ham",
                udfaldListe: [
                    { log: "Han spytter dig i ansigtet. Du finder kun et par småpenge i hans frakke.", aktionType: 'guld', vaerdi: 15 }
                ]
            }
        ]
    },

    'campfire': {
        id: 'campfire',
        titel: "Glemt Lejrbål",
        tekst: "Nogen har slået lejr her for nylig. Gløderne er stadig varme, og tågen tør ikke komme helt tæt på. Det er et sjældent, sikkert sted at hvile, hvis du er villig til at betale prisen.",
        biome: ['eng', 'skov', 'mark', 'bjerg'],
        billede: '/events/ev_campfire.webp', // <--- Her peger vi direkte på dit nye billede!
        unik: false,
        valg: [
            {
                tekst: "Køb dig til ro og varme",
                puljeVaerdi: 20,
                udfaldListe: [
                    { log: "Varmen fra gløderne lindrer dine smerter. Du vågner udhvilet.", aktionType: 'hp', vaerdi: 50 }
                ]
            },
            {
                tekst: "Kog din eliksir over bålet",
                kosterItem: 'livseliksir',
                udfaldListe: [
                    { log: "Varmen forstærker urterne i medicinen markant. Dine sår lukker sig lyn hurtigt.", aktionType: 'hp', vaerdi: 100 }
                ]
            },
            {
                tekst: "Rod desperat i den varme aske efter værdier",
                udfaldListe: [
                    { log: "Du finder kun brændte knogler. Den rødglødende aske svier slemt i hænderne.", aktionType: 'hp', vaerdi: -15 },
                    { log: "Nogen har tabt en pung i deres hastige flugt!", aktionType: 'guld', vaerdi: 35 }
                ]
            }
        ]
    },

    };