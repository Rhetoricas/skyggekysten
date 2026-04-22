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

    'skov_haengt_start': {
        id: 'skov_haengt_start',
        titel: 'Galgetræet',
        tekst: 'Et udtørret lig dingler højt oppe i en massiv eg. Ravnene har spist øjnene. Lige over liget hviler en jernbeslået kiste på en bred gren. Stammen er glat af råd og mos.',
        type: 'historie',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Klatr op ad den glatte stamme',
                aktionType: 'fortsaet',
                vaerdi: 0,
                naesteTrin: 'skov_haengt_top'
            },
            {
                tekst: 'Kast tunge sten for at slå kisten ned',
                puljeVaerdi: 90,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Du rammer et hvepsebo. En sort sværm overfalder dig og stikker dig til blods.', aktionType: 'hp', vaerdi: -65, multiplikator: 0 },
                    fiasko: { log: 'Du forstrækker skulderen voldsomt efter flere stenkast. Kisten rokker sig ikke.', aktionType: 'hp', vaerdi: -25, multiplikator: 0 },
                    neutral: { log: 'Kisten falder, men den var fuld af skidt og et par kobbermønter.', aktionType: 'guld', multiplikator: 0.3 },
                    succes: { log: 'Kisten splintres mod jorden. Du samler guldet op fra mudderet.', aktionType: 'guld', multiplikator: 1.2 },
                    mirakel: { log: 'Dit kast slår både kisten og liget ned. Liget bar en ekstremt værdifuld amulet.', aktionType: 'guld', multiplikator: 3.5 }
                }
            },
            {
                tekst: 'Brug tid på at hugge træet ned (-20 HP)',
                aktionType: 'hp',
                vaerdi: -20,
                chance: 1.0,
                naesteTrin: 'skov_haengt_top'
            },
            {
                tekst: 'Gå videre i skyggerne',
                aktionType: 'luk'
            }
        ]
    },
    'skov_haengt_top': {
        id: 'skov_haengt_top',
        titel: 'Blandt Krager',
        tekst: 'Du står på grenen. Kisten er låst med en rusten hængelås. Det døde lig svajer ind i dig. Ligstanken er overvældende. Grenen knager faretruende under din vægt.',
        type: 'kamp',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Søg ligets rådne tøj for nøglen',
                puljeVaerdi: 150,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Liget er fyldt med kødædende larver, der kaster sig over dine hænder.', aktionType: 'hp', vaerdi: -75, multiplikator: 0 },
                    fiasko: { log: 'Du finder nøglen, men taber den ned i det høje græs langt nede.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du finder en lille reservepung i hans støvle og opgiver kisten.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Nøglen passer perfekt. Du tømmer kisten lydløst.', aktionType: 'guld', multiplikator: 1.4 },
                    mirakel: { log: 'Hans lommer gemte et skattekort og nøglen. Dobbelt gevinst.', aktionType: 'guld', multiplikator: 3 }
                }
            },
            {
                tekst: 'Smadr låsen med dit våben',
                puljeVaerdi: 120,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Slaget sender chokbølger gennem grenen. Den knækker, og du styrter til jorden.', aktionType: 'hp', vaerdi: -90, multiplikator: 0 },
                    fiasko: { log: 'Våbnet glider, og du hugger dig selv dybt i skinnebenet.', aktionType: 'hp', vaerdi: -40, multiplikator: 0 },
                    neutral: { log: 'Låsen går op, men guldet indeni er smeltet sammen til en billig klump.', aktionType: 'guld', multiplikator: 0.4 },
                    succes: { log: 'Et brutalt og effektivt slag. Kisten åbner sig, rigdommen er din.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Du smadrer låsen og opdager, at kistens bund er af rent, formstøbt sølv.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Forsøg at sparke hele kisten ned på jorden',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Du mister balancen i sparket og falder baglæns ned i tornekrattet.', aktionType: 'hp', vaerdi: -80 },
                    fiasko: { log: 'Du forvrider anklen slemt under manøvren.', aktionType: 'hp', vaerdi: -30 },
                    neutral: { log: 'Kisten falder og lander dybt i et mudderhul. Væk.', aktionType: 'hp', vaerdi: -10 },
                    succes: { log: 'Den lander perfekt og springer op. Du kan kravle ned og hente guldet.', aktionType: 'guld', vaerdi: 120 },
                    mirakel: { log: 'Kisten knuser et skjult monster i skovbunden under faldet. Du plyndrer dem begge.', aktionType: 'guld', vaerdi: 350 }
                }
            },
            {
                tekst: 'Klatr forsigtigt ned uden at røre noget',
                aktionType: 'luk'
            }
        ]
    },

    'skov_heksehus_start': {
        id: 'skov_heksehus_start',
        titel: 'Det Sukkende Hus',
        tekst: 'Et lille skævt hus er flettet af levende rødder og dyreknogler. Det dufter af vanilje og råddent kød. Gennem den sprækkede dør kan du se en massiv stak mønter på et bord.',
        type: 'historie',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Snig dig ind gennem døren',
                aktionType: 'fortsaet',
                vaerdi: 0,
                naesteTrin: 'skov_heksehus_inde'
            },
            {
                tekst: 'Sæt ild til huset udefra',
                puljeVaerdi: 100,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Rødderne er magiske. De slynger sig ud som piske og trækker dig ind i flammerne.', aktionType: 'hp', vaerdi: -85, multiplikator: 0 },
                    fiasko: { log: 'Røgen er ekstremt giftig og lammende. Du må flygte hostende derfra.', aktionType: 'hp', vaerdi: -35, multiplikator: 0 },
                    neutral: { log: 'Huset brænder ned. Du samler lidt mønter fra asken, men det meste er smeltet.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Ejeren brænder inde. Du trækker guldbunken ud før taget kollapser.', aktionType: 'guld', multiplikator: 1.6 },
                    mirakel: { log: 'Ilden afslører en underjordisk kælder proppet med ædle sten.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Brug tid på at gennemsøge skovbunden omkring huset',
                puljeVaerdi: 40,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Du graver i en myretue fyldt med røde dræbermyrer.', aktionType: 'hp', vaerdi: -50, multiplikator: 0 },
                    fiasko: { log: 'Du finder kun knogler og rådne blade.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du finder en tabt mønt fra en tidligere, uheldig rejsende.', aktionType: 'guld', multiplikator: 0.8 },
                    succes: { log: 'Du graver et skjult depot af værdier op i baghaven.', aktionType: 'guld', multiplikator: 2 },
                    mirakel: { log: 'Du finder ejerens hemmelige grav og stjæler et legendarisk guld-klenodie.', aktionType: 'guld', multiplikator: 5 }
                }
            },
            {
                tekst: 'Hold dig langt væk og gå videre',
                aktionType: 'luk'
            }
        ]
    },
    'skov_heksehus_inde': {
        id: 'skov_heksehus_inde',
        titel: 'Sød Forrådnelse',
        tekst: 'Indenfor simrer en gryde med tyk, sort væske. En hæslig, vanskabt skabning sover i en lænestol foran guldet. Gulvbrædderne er rådne og klar til at knække under dig.',
        type: 'kamp',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'List over og tøm bordet for guld',
                puljeVaerdi: 150,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Gulvet knækker. Skabningen vågner, brøler og hugger kløerne i dine tarme.', aktionType: 'hp', vaerdi: -90, multiplikator: 0 },
                    fiasko: { log: 'Mønterne klirrer. Skabningen rører på sig, og du flygter i panik uden guldet.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du får en lille håndfuld med, før du ikke tør rykke tættere på.', aktionType: 'guld', multiplikator: 0.4 },
                    succes: { log: 'Dine nerver er af stål. Du rydder bordet og lister ud igen.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Den sover dræbende tungt. Du stjæler guldet OG skærer halsen over på den.', aktionType: 'guld', multiplikator: 3 }
                }
            },
            {
                tekst: 'Drik fra den kogende gryde',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Det er lammende gift. Dine organer koger indefra, mens du falder om.', aktionType: 'hp', vaerdi: -95 },
                    fiasko: { log: 'Smagen er ubærlig. Du kaster blod op på gulvet.', aktionType: 'hp', vaerdi: -40 },
                    neutral: { log: 'Væsken slukker din tørst, men smager af aske.', aktionType: 'hp', vaerdi: 10 },
                    succes: { log: 'Det er en kraftfuld eliksir. Dine sår lukker sig, og du mærker en enorm varme.', aktionType: 'hp', vaerdi: 90 },
                    mirakel: { log: 'Eliksiren giver dig overmenneskeligt syn. Du finder husets skjulte rum.', aktionType: 'guld', vaerdi: 250 }
                }
            },
            {
                tekst: 'Overfald skabningen og kæmp om byttet',
                puljeVaerdi: 100,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Den vågner i et splitsekund og kaster en sort forbandelse ind i dit ansigt.', aktionType: 'hp', vaerdi: -85, multiplikator: 0 },
                    fiasko: { log: 'Den er utroligt stærk. Du får tæsk og må kaste dig ud ad vinduet.', aktionType: 'hp', vaerdi: -45, multiplikator: 0 },
                    neutral: { log: 'I slås brutalt og du flygter med nogle af mønterne.', aktionType: 'guld', multiplikator: 0.6 },
                    succes: { log: 'Du knækker dens nakke i kampen. Skatten er din.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Skabningen beder om nåde og overdrager en legendarisk magisk skattekiste.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Bak langsomt ud af huset',
                aktionType: 'luk'
            }
        ]
    },

    'skov_taage_start': {
        id: 'skov_taage_start',
        titel: 'De Falske Stemmer',
        tekst: 'En tyk, parfumeret tåge ruller ind mellem træerne. Ud af mørket hører du stemmen fra din afdøde mor. "Jeg fandt skatten, kom herind," kalder hun indsmigrende.',
        type: 'historie',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Følg stemmerne dybt ind i tågen',
                aktionType: 'fortsaet',
                vaerdi: 0,
                naesteTrin: 'skov_taage_lysning'
            },
            {
                tekst: 'Hold dig for ørerne og løb blindt igennem',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Du løber direkte ind i en dyrekæbe-fælde, der smadrer dit underben.', aktionType: 'hp', vaerdi: -75 },
                    fiasko: { log: 'Du flænser dig selv på et massivt tjørnekrat i panikken.', aktionType: 'hp', vaerdi: -30 },
                    neutral: { log: 'Du slipper gennem tågen, udmattet og beskidt.', aktionType: 'hp', vaerdi: -10 },
                    succes: { log: 'Du sprinter sikkert igennem og sparker en pung fri fra mudderet i farten.', aktionType: 'guld', vaerdi: 70 },
                    mirakel: { log: 'Du løber tågens skaber over ende. En mørk alf, som du dræber og plyndrer.', aktionType: 'guld', vaerdi: 280 }
                }
            },
            {
                tekst: 'Bind dig til et træ og udhold trancen (-20 HP)',
                aktionType: 'hp',
                vaerdi: -20,
                chance: 1.0,
                naesteTrin: 'skov_taage_lysning'
            },
            {
                tekst: 'Vend om og lad skoven være i fred',
                aktionType: 'luk'
            }
        ]
    },
    'skov_taage_lysning': {
        id: 'skov_taage_lysning',
        titel: 'Dødens Orkideer',
        tekst: 'I midten af tågen ligger snesevis af skeletter. Stemmerne kommer fra enorme, lysende orkideer, der vokser direkte ud af de dødes øjenhuler. Knoglerne bærer dyrt guldudstyr.',
        type: 'kamp',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Pluk de magiske orkideer for deres saft',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Blomsterne sprøjter ren, ætsende syre ind i dit ansigt.', aktionType: 'hp', vaerdi: -90 },
                    fiasko: { log: 'Du skærer dig på de glasklare torne. En feber rammer dig straks.', aktionType: 'hp', vaerdi: -40 },
                    neutral: { log: 'Orkideerne visner til aske, i det sekund du plukker dem.', aktionType: 'hp', vaerdi: 0 },
                    succes: { log: 'Du tygger bladene. Et enormt sus af energi helbreder din krop.', aktionType: 'hp', vaerdi: 80 },
                    mirakel: { log: 'Nektaren forlænger dit liv magisk. Din max styrke føles grænseløs.', aktionType: 'hp', vaerdi: 180 }
                }
            },
            {
                tekst: 'Ignorer blomsterne og stjæl fra ligene',
                puljeVaerdi: 130,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Ligene griber fast i dig! De trækker dig ned mod rødderne.', aktionType: 'hp', vaerdi: -85, multiplikator: 0 },
                    fiasko: { log: 'Tågen giver dig voldsomme hallucinationer. Du må flygte tomhændet.', aktionType: 'hp', vaerdi: -35, multiplikator: 0 },
                    neutral: { log: 'Du river en guldring af og slipper væk, inden blomsterne reagerer.', aktionType: 'guld', multiplikator: 0.6 },
                    succes: { log: 'Kold plyndring. Du skovler rigdommen op og lader de døde hvile.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Et af skeletterne bærer kongens glemte, massive diamantring.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Trampe blomsterne i stykker for at fjerne forbandelsen',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'De udsender en lammende gift-spore, som knækker dig helt.', aktionType: 'hp', vaerdi: -100 },
                    fiasko: { log: 'Du smadrer dem, men deres skarpe blade skærer dine støvler op.', aktionType: 'hp', vaerdi: -30 },
                    neutral: { log: 'Skoven bliver stille. En lille sejr for dit ego.', aktionType: 'hp', vaerdi: 10 },
                    succes: { log: 'Tågen letter fuldstændigt. Du finder let de tapte skatte.', aktionType: 'guld', vaerdi: 100 },
                    mirakel: { log: 'Blomsterne dør og kaster helende krystalstøv i luften.', aktionType: 'hp', vaerdi: 200 }
                }
            },
            {
                tekst: 'Hold vejret og kom væk',
                aktionType: 'luk'
            }
        ]
    },

    'skov_alter_start': {
        id: 'skov_alter_start',
        titel: 'Det Falske Idol',
        tekst: 'En massiv træstatue af en glemt skovgud dominerer stien. Gabet er åbent og fuld af sylespidse trætænder. Nede i mørket kan du se refleksionen af rent, gult guld.',
        type: 'historie',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Stik hånden ind i gabet efter guldet',
                aktionType: 'fortsaet',
                vaerdi: 0,
                naesteTrin: 'skov_alter_arm'
            },
            {
                tekst: 'Smash munden med dit våben',
                puljeVaerdi: 100,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Statuen er levende! En massiv træarm knuser dig i jorden.', aktionType: 'hp', vaerdi: -85, multiplikator: 0 },
                    fiasko: { log: 'Våbnet sidder fast i træet, og du vrider knæet i panikken.', aktionType: 'hp', vaerdi: -30, multiplikator: 0 },
                    neutral: { log: 'Du får et par tænder knækket og fisker nogle småmønter ud.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Underkæben splintres. Guldet regner ud på jorden.', aktionType: 'guld', multiplikator: 1.3 },
                    mirakel: { log: 'Statuen falder fra hinanden og afslører et hulrum badet i ædelstene.', aktionType: 'guld', multiplikator: 3.5 }
                }
            },
            {
                tekst: 'Ofre dit eget blod i alterets skål (-20 HP)',
                aktionType: 'hp',
                vaerdi: -20,
                chance: 1.0,
                naesteTrin: 'skov_alter_arm'
            },
            {
                tekst: 'Kors dig og find en anden vej',
                aktionType: 'luk'
            }
        ]
    },
    'skov_alter_arm': {
        id: 'skov_alter_arm',
        titel: 'Klemmen',
        tekst: 'Du rækker ind. Guldet føles koldt mod fingerspidserne. Pludselig lyder et mekanisk klik. Kæberne smækker i og låser sig stramt om din underarm. Trætænderne borer sig ind i huden.',
        type: 'kamp',
        biome: 'skov',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Ryk armen fri med brutal magt',
                puljeVaerdi: 140,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Træet flænser kødet af din arm helt ind til benet. Det bløder massivt.', aktionType: 'hp', vaerdi: -90, multiplikator: 0 },
                    fiasko: { log: 'Du river dig fri, men taber alt det guld, du ellers havde i hånden.', aktionType: 'hp', vaerdi: -40, multiplikator: 0 },
                    neutral: { log: 'Du trækker armen blodig ud, men redder et par guldstykker.', aktionType: 'guld', multiplikator: 0.6 },
                    succes: { log: 'Du sparker imod og river både arm og en solid håndfuld guld med ud.', aktionType: 'guld', multiplikator: 1.2 },
                    mirakel: { log: 'Dit voldsomme ryk får hele mekanismen til at kaste et bjerg af guld op.', aktionType: 'guld', multiplikator: 3.5 }
                }
            },
            {
                tekst: 'Stå stille og mærk maskineriets logik',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Mekanismen er designet til langsom knusning. Din arm brækker i to.', aktionType: 'hp', vaerdi: -85 },
                    fiasko: { log: 'Du panikker midtvejs og river dig på tænderne.', aktionType: 'hp', vaerdi: -30 },
                    neutral: { log: 'Gabet åbner sig efter et minut, men guldet glider længere ned.', aktionType: 'hp', vaerdi: -10 },
                    succes: { log: 'Du finder udløseren. Munden åbner sig, og du trækker armen uskadt ud.', aktionType: 'hp', vaerdi: 20 },
                    mirakel: { log: 'Du fjerner fælden og finder den indre kerne, som heler alle dine sår.', aktionType: 'hp', vaerdi: 140 }
                }
            },
            {
                tekst: 'Skær af træet med din dolk',
                puljeVaerdi: 100,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Kniven smutter og du skærer pulsåren i din egen låste arm.', aktionType: 'hp', vaerdi: -95, multiplikator: 0 },
                    fiasko: { log: 'Statuen udsender svovl, der blinder dig, mens du skærer.', aktionType: 'hp', vaerdi: -35, multiplikator: 0 },
                    neutral: { log: 'Du får snittet kæben over og tager lidt mønter i processen.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Gabet falder åbent. Du tager skatten uden problemer.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Du skærer den mekaniske udløser op. Skattekammeret blotlægges helt.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Opgiv guldet og snirkel armen baglæns ud (-15 HP)',
                aktionType: 'hp',
                vaerdi: -15
            }
        ]
    },

'eng_mose_start': {
        id: 'eng_mose_start',
        titel: 'Det Falske Græs',
        tekst: 'En rigt dekoreret hestevogn synker langsomt ned i et usynligt mudderhul midt på engen. Hestene skriger. Kusken klamrer sig til en massiv jernkiste på taget, mens mudderet når ham til knæene.',
        type: 'historie',
        biome: 'eng',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Kast et reb ud og forsøg at redde kusken',
                aktionType: 'fortsaet',
                vaerdi: 0,
                naesteTrin: 'eng_mose_kusk'
            },
            {
                tekst: 'Spring ud og grib fat i jernkisten',
                puljeVaerdi: 160,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Mudderet suger dig nådesløst ned. Du sluger tykt slam og er ved at drukne.', aktionType: 'hp', vaerdi: -85, multiplikator: 0 },
                    fiasko: { log: 'Du får fat i kisten, men den er for tung. Du river neglene af og må opgive.', aktionType: 'hp', vaerdi: -25, multiplikator: 0 },
                    neutral: { log: 'Kisten synker, men du sparker en løs guldbarre op til overfladen.', aktionType: 'guld', multiplikator: 0.4 },
                    succes: { log: 'Du bryder låsen i farten og skovler guld i lommerne, før vognen forsvinder.', aktionType: 'guld', multiplikator: 1.2 },
                    mirakel: { log: 'Du vipper kisten op på fast grund med overmenneskelig styrke.', aktionType: 'guld', multiplikator: 3 }
                }
            },
            {
                tekst: 'Brug panikken til at plyndre vognens bagagerum',
                puljeVaerdi: 80,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'En af hestene sparker bagud i dødsangst og knuser dine ribben.', aktionType: 'hp', vaerdi: -70, multiplikator: 0 },
                    fiasko: { log: 'Bagagerummet indeholder kun dyrt tøj, som bliver ødelagt af mudderet.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du river en silkejakke til dig med et par indsyede mønter.', aktionType: 'guld', multiplikator: 0.6 },
                    succes: { log: 'Du tømmer en sidetaske fyldt med familiens kontanter.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Du finder et hemmeligt rum under sædet spækket med kongelige juveler.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Gå en lang bue udenom',
                aktionType: 'luk'
            }
        ]
    },
    'eng_mose_kusk': {
        id: 'eng_mose_kusk',
        titel: 'Vægten af Liv',
        tekst: 'Kusken griber dit reb. Han er tung, og han nægter at give slip på en læderpose med sit eget guld. Hver gang du trækker, skrider dine støvler mod kanten af mudderhullet.',
        type: 'kamp',
        biome: 'eng',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Træk med alt hvad du har',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Han trækker dig med i faldet. I synker begge to og du sluger mudder.', aktionType: 'hp', vaerdi: -90 },
                    fiasko: { log: 'Musklerne i din ryg overbelastes voldsomt. Han glider ud af rebet.', aktionType: 'hp', vaerdi: -40 },
                    neutral: { log: 'Du får ham op. Han takker dig kortfattet og løber sin vej.', aktionType: 'hp', vaerdi: -10 },
                    succes: { log: 'Du haler ham i land. Han overdrager dig sin læderpose som tak.', aktionType: 'guld', vaerdi: 110 },
                    mirakel: { log: 'Dit heltemod tiltrækker en velsignelse. Dine muskler svulmer med permanent styrke.', aktionType: 'hp', vaerdi: 150 }
                }
            },
            {
                tekst: 'Kræv at han kaster posen op til dig først',
                puljeVaerdi: 100,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Han bliver rasende, kaster posen i hovedet på dig og trækker dig ned.', aktionType: 'hp', vaerdi: -60, multiplikator: 0 },
                    fiasko: { log: 'Han nægter og synker stædigt i døden med sit guld.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Han kaster en håndfuld mønter i græsset og tigger dig om at trække.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Han overgiver sig og kaster hele posen. Du trækker ham sikkert op.', aktionType: 'guld', multiplikator: 1.2 },
                    mirakel: { log: 'Posen indeholder meget mere end guld. Den indeholder et skøde til en hel mark.', aktionType: 'guld', multiplikator: 3 }
                }
            },
            {
                tekst: 'Skær rebet og stjæl den pose han lagde på kanten',
                puljeVaerdi: 50,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Han kastede en forbandelse på sin bagage. Det brænder dit kød.', aktionType: 'hp', vaerdi: -50, multiplikator: 0 },
                    fiasko: { log: 'Posen indeholder kun værdiløse papirer og vådt brød.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du får fat i et par sølvmønter og ignorerer hans skrig.', aktionType: 'guld', multiplikator: 0.8 },
                    succes: { log: 'Koldblodigt og effektivt. Du stikker af med hans rejsepenge.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Posen gemmer på en usleben diamant tiltænkt kongen.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Bind rebet til et træ og lad ham klare resten (-15 HP)',
                aktionType: 'hp',
                vaerdi: -15
            }
        ]
    },

    'eng_blomsterhav': {
        id: 'eng_blomsterhav',
        titel: 'Blodrøde Kronblade',
        tekst: 'En mark af enorme, kødædende blomster spærrer din rute. Midt i feltet ligger et skelet i en skinnende rustning. Luften er tyk af en sød pollen, der sløver sanserne.',
        type: 'kamp',
        biome: 'eng',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Hold vejret og sprint ind efter rustningen',
                puljeVaerdi: 140,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Planterne griber dine ankler. Torne pumper dig fuld af lammende gift.', aktionType: 'hp', vaerdi: -90, multiplikator: 0 },
                    fiasko: { log: 'Du inhalerer pollen og falder om. Du mister timer og energi i marken.', aktionType: 'hp', vaerdi: -40, multiplikator: 0 },
                    neutral: { log: 'Du når frem og tilbage, men får kun flået et par rustningsdele af.', aktionType: 'guld', multiplikator: 0.4 },
                    succes: { log: 'Du navigerer perfekt gennem rødderne og slæber byttet ud.', aktionType: 'guld', multiplikator: 1.3 },
                    mirakel: { log: 'Skelettet bærer et legendarisk guldskjold. Du bærer det uskadt væk.', aktionType: 'guld', multiplikator: 3 }
                }
            },
            {
                tekst: 'Sæt ild til marken',
                puljeVaerdi: 60,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Vinden vender brat. Flammerne slår tilbage og brænder dig slemt.', aktionType: 'hp', vaerdi: -60, multiplikator: 0 },
                    fiasko: { log: 'Ilden smelter alt af værdi. Der er kun aske tilbage.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Ilden rydder vejen. Du finder klumper af smeltet metal.', aktionType: 'guld', multiplikator: 0.8 },
                    succes: { log: 'Blomsterne brænder væk og efterlader skelettets tunge guld ubeskadiget.', aktionType: 'guld', multiplikator: 1.8 },
                    mirakel: { log: 'Ilden hærder rustningen. Du finder et perfekt konserveret mesterværk.', aktionType: 'guld', multiplikator: 3.5 }
                }
            },
            {
                tekst: 'Grav under rødderne for at undgå pollen',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Jorden kollapser i en hule fyldt med blomsternes underjordiske tænder.', aktionType: 'hp', vaerdi: -85 },
                    fiasko: { log: 'Du graver dig vabler og blodige fingre uden at finde noget.', aktionType: 'hp', vaerdi: -25 },
                    neutral: { log: 'Du finder et par mønter i jorden, som tidligere ofre har tabt.', aktionType: 'guld', vaerdi: 30 },
                    succes: { log: 'Du rammer en knold af rent, stjålet sølv, som planten har gemt.', aktionType: 'guld', vaerdi: 120 },
                    mirakel: { log: 'Saften fra plantens rødder drypper på dig og giver dig varig vitalitet.', aktionType: 'hp', vaerdi: 150 }
                }
            },
            {
                tekst: 'Hold dig fra planterne og gå videre',
                aktionType: 'luk'
            }
        ]
    },

    'eng_hyrde_start': {
        id: 'eng_hyrde_start',
        titel: 'Den Gule Hyrde',
        tekst: 'En mand i gule laser vogter en flok får. Fårene græsser ikke på græsset. De æder af en stak menneskeknogler. Hyrden smiler bredt med spidse tænder. Han sælger frisk kød.',
        type: 'historie',
        biome: 'eng',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Køb hans kød (40G)',
                aktionType: 'fortsaet',
                vaerdi: -40,
                naesteTrin: 'eng_hyrde_koed'
            },
            {
                tekst: 'Angrib ham og rens engen',
                puljeVaerdi: 100,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Fårene angriber som en samlet, bestialsk flok og bider kødet af dine knogler.', aktionType: 'hp', vaerdi: -90, multiplikator: 0 },
                    fiasko: { log: 'Hyrden bevæger sig unaturligt hurtigt og stikker dig i låret med en saks.', aktionType: 'hp', vaerdi: -35, multiplikator: 0 },
                    neutral: { log: 'Han flygter, og fårene spreder sig. Du finder lidt tabt guld i græsset.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Du nedlægger ham. Hans frakke er foret med stjålne smykker.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Under hans lejr udgraver du kisten med de døde eventyreres samlede formuer.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Forsøg at stjæle et af dyrene for byttet',
                puljeVaerdi: 60,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Dyret skriger. Hyrden kaster en klinge, der borer sig ind i din skulder.', aktionType: 'hp', vaerdi: -65, multiplikator: 0 },
                    fiasko: { log: 'Fåret river sig løs og sparker dig hårdt i maven.', aktionType: 'hp', vaerdi: -20, multiplikator: 0 },
                    neutral: { log: 'Du får fat i lidt gulduld, men dyret slipper væk.', aktionType: 'guld', multiplikator: 0.8 },
                    succes: { log: 'Du kvæler dyret lydløst. Dets mave er fuld af slugte mønter.', aktionType: 'guld', multiplikator: 2 },
                    mirakel: { log: 'Dyrets uld er spundet af rent guld. En ufattelig værdi.', aktionType: 'guld', multiplikator: 5 }
                }
            },
            {
                tekst: 'Hold øjenkontakt og bak roligt væk',
                aktionType: 'luk'
            }
        ]
    },
    'eng_hyrde_koed': {
        id: 'eng_hyrde_koed',
        titel: 'Uortodoks Kost',
        tekst: 'Han rækker dig en blodig pakke. Kødet er tungt og dufter mærkeligt sødt. Du er sulten, og dine sår trænger til protein for at hele.',
        type: 'kamp',
        biome: 'eng',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Spis det råt for maksimal effekt',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Dit syn sortner. En voldsom parasit spreder sig i dit blod.', aktionType: 'hp', vaerdi: -80 },
                    fiasko: { log: 'Du kaster blod og mavesyre op i græsset.', aktionType: 'hp', vaerdi: -30 },
                    neutral: { log: 'Du tygger dig igennem det. Det mætter, men smagen hjemsøger dig.', aktionType: 'hp', vaerdi: 10 },
                    succes: { log: 'Rå muskelkraft strømmer ud i dine årer og lukker dine sår.', aktionType: 'hp', vaerdi: 70 },
                    mirakel: { log: 'Kødet udløser en latent mutation. Din knoglestruktur forstærkes permanent.', aktionType: 'hp', vaerdi: 160 }
                }
            },
            {
                tekst: 'Brug tid på at gennemstege det',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Røgen tiltrækker en flok banditter. De overfalder dig ved bålet.', aktionType: 'hp', vaerdi: -70 },
                    fiasko: { log: 'Du brænder kødet til kul. Det smager af ingenting og giver ingen næring.', aktionType: 'hp', vaerdi: 0 },
                    neutral: { log: 'Et fornuftigt, lunt måltid. Du genvinder lidt kræfter.', aktionType: 'hp', vaerdi: 30 },
                    succes: { log: 'Kødet er fantastisk. Det styrker din krop og varmer dine led.', aktionType: 'hp', vaerdi: 80 },
                    mirakel: { log: 'Du finder en slugt diamant inde i kødet under udskæringen.', aktionType: 'guld', vaerdi: 200 }
                }
            },
            {
                tekst: 'Brug det som madding til at fange vildt',
                puljeVaerdi: 90,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Maddingen tiltrækker et apex-rovdyr, der angriber dig i stedet.', aktionType: 'hp', vaerdi: -85, multiplikator: 0 },
                    fiasko: { log: 'Kragerne æder maddingen. Du fanger absolut ingenting.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du fanger et lille dyr med en smule værdi.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'En stor hjort går i fælden. Du sælger skind og takker.', aktionType: 'guld', multiplikator: 1.2 },
                    mirakel: { log: 'Du fanger en mytisk guldræv. Dens skind er ufatteligt dyrt.', aktionType: 'guld', multiplikator: 3.5 }
                }
            },
            {
                tekst: 'Smid kødet væk i væmmelse',
                aktionType: 'luk'
            }
        ]
    },


'bjerg_skakt_start': {
        id: 'bjerg_skakt_start',
        titel: 'Det Sorte Hul',
        tekst: 'En lodret skakt er hugget brutalt ind i bjergsiden. En rusten jernstige forsvinder ned i mørket. En stram lugt af vådt rovdyr og kobber stiger op fra dybet.',
        type: 'historie',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Klatr lydløst ned i mørket',
                aktionType: 'fortsaet',
                vaerdi: 0,
                naesteTrin: 'bjerg_skakt_bund'
            },
            {
                tekst: 'Kast en sten ned for at teste dybden',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Stenen rammer noget. En sky af giftige flagermus sværmer op i ansigtet på dig.', aktionType: 'hp', vaerdi: -40 },
                    fiasko: { log: 'Et dybt, rystende brøl svarer dig fra dybet.', aktionType: 'hp', vaerdi: -10 },
                    neutral: { log: 'Stenen falder længe. Du hører et fjernt plask.', aktionType: 'hp', vaerdi: 0 },
                    succes: { log: 'Stenen rammer metal, der splintres. Et skjult rum over dig åbner sig med guld.', aktionType: 'guld', vaerdi: 80 },
                    mirakel: { log: 'Kastet udløser en gammel modvægt, der hejser en kiste fuld af guld op til dig.', aktionType: 'guld', vaerdi: 200 }
                }
            },
            {
                tekst: 'Smid lidt guld derned som offer (-10G)',
                aktionType: 'guld',
                vaerdi: -10,
                chance: 1.0,
                naesteTrin: 'bjerg_skakt_bund'
            },
            {
                tekst: 'Ignorer hullet og find en sikrere sti',
                aktionType: 'luk'
            }
        ]
    },
    'bjerg_skakt_bund': {
        id: 'bjerg_skakt_bund',
        titel: 'Rovdyrets Alter',
        tekst: 'Du står i en grotte dækket af blod. En massiv, såret bjergulv hviler oven på en stak stjålne våben og guldposer. Den trækker vejret tungt, men sover ikke helt.',
        type: 'kamp',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Angrib dyret frontalt for at tage alt',
                puljeVaerdi: 180,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Den var ikke svag. Den flænser din rustning og dine ben i et enkelt angreb.', aktionType: 'hp', vaerdi: -90, multiplikator: 0 },
                    fiasko: { log: 'Den slår dig brutalt tilbage mod muren for at forsvare sit bytte.', aktionType: 'hp', vaerdi: -30, multiplikator: 0 },
                    neutral: { log: 'Du stikker den, og den flygter. Du samler en brøkdel af guldet op i farten.', aktionType: 'guld', multiplikator: 0.3 },
                    succes: { log: 'Et rent drab. Du tømmer alteret fuldstændigt for værdier.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Under bæstet finder du en direkte indgang til et urørt skattekammer.', aktionType: 'guld', multiplikator: 3 }
                }
            },
            {
                tekst: 'Snig dig langs væggen og stjæl det yderste guld',
                puljeVaerdi: 90,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Du træder på en knogle. Bæstet vågner og kaster sig over dig.', aktionType: 'hp', vaerdi: -75, multiplikator: 0 },
                    fiasko: { log: 'Den knurrer truende. Du må trække dig tomhændet tilbage op ad stigen.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du samler en enkelt pose op uden at lave en lyd.', aktionType: 'guld', multiplikator: 0.8 },
                    succes: { log: 'Du tømmer halvdelen af bunken fuldstændig lydløst.', aktionType: 'guld', multiplikator: 1.8 },
                    mirakel: { log: 'Ulven sover så tungt, at du piller dens magiske guldhalsbånd af.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Tilbyd hjælp og forbind dens sår',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Den anser din nærhed som et angreb og bider dig dybt i armen.', aktionType: 'hp', vaerdi: -80 },
                    fiasko: { log: 'Den rejser sig og skubber dig væk. Din hjælp afvises.', aktionType: 'hp', vaerdi: -20 },
                    neutral: { log: 'Den lader dig rense sårene, men beholder sit guld for sig selv.', aktionType: 'hp', vaerdi: 10 },
                    succes: { log: 'Den skubber en tung pose guld over til dig som tak for hjælpen.', aktionType: 'guld', vaerdi: 120 },
                    mirakel: { log: 'Dens blod og spyt heler dine egne sår fuldstændigt. Dyret er helligt.', aktionType: 'hp', vaerdi: 150 }
                }
            },
            {
                tekst: 'Træk dig tilbage før den ser dig',
                aktionType: 'luk'
            }
        ]
    },

    'bjerg_vindbro_start': {
        id: 'bjerg_vindbro_start',
        titel: 'Orkanens Bro',
        tekst: 'En smal stenbro spænder over en dyb kløft. Vinden blæser med en kraft, der river i din kappe. Midt på broen er en massiv forsyningskiste frosset fast til stenene.',
        type: 'historie',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Kravl ud på broen på alle fire',
                aktionType: 'fortsaet',
                vaerdi: 0,
                naesteTrin: 'bjerg_vindbro_midte'
            },
            {
                tekst: 'Løb ud for at få det overstået i en fart',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Et vindstød blæser dig over kanten. Du hænger i fingrene og mister blod i faldet.', aktionType: 'hp', vaerdi: -70 },
                    fiasko: { log: 'Du mister balancen og knalder knæet voldsomt ind i stenen.', aktionType: 'hp', vaerdi: -30 },
                    neutral: { log: 'Du når ud til kisten helskindet, men stakåndet.', aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'bjerg_vindbro_midte' },
                    succes: { log: 'Perfekt balance. Du sparker en løs guldmønt fri fra isen i farten.', aktionType: 'guld', vaerdi: 60 },
                    mirakel: { log: 'Dit moment knuser isen. Kisten åbner sig og blæser sin rigdom op til dig.', aktionType: 'guld', vaerdi: 200 }
                }
            },
            {
                tekst: 'Kast dit reb ud for at sikre dig (-10 HP i anstrengelse)',
                aktionType: 'hp',
                vaerdi: -10,
                chance: 1.0,
                naesteTrin: 'bjerg_vindbro_midte'
            },
            {
                tekst: 'Giv op og bliv på fastlandet',
                aktionType: 'luk'
            }
        ]
    },
    'bjerg_vindbro_midte': {
        id: 'bjerg_vindbro_midte',
        titel: 'Knagende Træ',
        tekst: 'Broen gynger dræbende langsomt under din vægt. Kisten foran dig har to rum. Det ene rasler med tungt metal. Det andet indeholder mørke pakker, der lugter skarpt af kemikalier.',
        type: 'kamp',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Bryd det metalliske rum op med magt',
                puljeVaerdi: 140,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Metallet var fyldt med fælder. Små klinger skyder ud og skærer dine hænder til blods.', aktionType: 'hp', vaerdi: -80, multiplikator: 0 },
                    fiasko: { log: 'Mønterne er frosset sammen til en ubrugelig klump is.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du hakker et par håndfulde kolde mønter fri.', aktionType: 'guld', multiplikator: 0.6 },
                    succes: { log: 'Du bryder rummet op og tømmer en betragtelig formue ned i lommen.', aktionType: 'guld', multiplikator: 1.4 },
                    mirakel: { log: 'Rummet er fyldt med store, uslebne diamanter fra en kongegrav.', aktionType: 'guld', multiplikator: 3.5 }
                }
            },
            {
                tekst: 'Åbn rummet med de ukendte kemikalier',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Pakkerne antænder øjeblikkeligt ved kontakt med ilt. Du bliver slemt forbrændt.', aktionType: 'hp', vaerdi: -90 },
                    fiasko: { log: 'Giftige dampe siver ud og gør dig svimmel i timevis.', aktionType: 'hp', vaerdi: -35 },
                    neutral: { log: 'Pulveret er forældet og blæser væk i den hårde vind.', aktionType: 'hp', vaerdi: 0 },
                    succes: { log: 'Det er ekstremt potente lægeurter. De heler dine skrammer prompte.', aktionType: 'hp', vaerdi: 70 },
                    mirakel: { log: 'Det er ren alkymistisk substans. Din fysik forbedres permanent.', aktionType: 'hp', vaerdi: 160 }
                }
            },
            {
                tekst: 'Brug kisten som læ mod vinden og saml kræfter',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Broen giver pludselig efter for vægten af vind og is. Du styrter dybt ned.', aktionType: 'hp', vaerdi: -100 },
                    fiasko: { log: 'Kulden trænger gennem din rustning. Hvil gør det kun værre.', aktionType: 'hp', vaerdi: -20 },
                    neutral: { log: 'Du får vejret, men kulden sidder stadig i knoglerne.', aktionType: 'hp', vaerdi: 15 },
                    succes: { log: 'Du genvinder dine kræfter effektivt i fuldstændig læ for stormen.', aktionType: 'hp', vaerdi: 50 },
                    mirakel: { log: 'Vinden fjerner løst stenstøv og afslører en massiv guldklump bygget ind i broen.', aktionType: 'guld', vaerdi: 250 }
                }
            },
            {
                tekst: 'Efterlad kisten og kravl tilbage',
                aktionType: 'luk'
            }
        ]
    },



'bjerg_frossen_karavane': {
        id: 'bjerg_frossen_karavane',
        titel: 'Knagende Is',
        tekst: 'En rigmand hænger i et tyndt reb over en sort gletsjerspalte. Hans tunge guldposer trækker ham ned. Isen under dine fødder slår revner og truer med at kollapse når som helst.',
        type: 'historie',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Fir dig ned og grib udelukkende guldet',
                puljeVaerdi: 150,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Isen brister. Du falder ti meter og lander på spidse klipper.', aktionType: 'hp', vaerdi: -70, multiplikator: 0 },
                    fiasko: { log: 'Rebet knækker. Han falder, og du slår ryggen stygt under forsøget.', aktionType: 'hp', vaerdi: -30, multiplikator: 0 },
                    neutral: { log: 'Du får fat i en enkelt pose, før han styrter i dybet.', aktionType: 'guld', multiplikator: 0.3 },
                    succes: { log: 'Du hejser alt guldet op. Manden falder skrigende ned i mørket.', aktionType: 'guld', multiplikator: 1 },
                    mirakel: { log: 'Du trækker både mand og guld i sikkerhed. Han deler formuen med dig i ren chok.', aktionType: 'guld', multiplikator: 2 }
                }
            },
            {
                tekst: 'Skær guldet væk for at trække ham op',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Han slår ud efter dig i raseri over det tabte guld og skubber dig halvt over kanten.', aktionType: 'hp', vaerdi: -50 },
                    fiasko: { log: 'Han græder over sin tabte formue og nægter at se på dig.', aktionType: 'hp', vaerdi: 0 },
                    neutral: { log: 'Han overlever og giver dig irriteret et par mønter fra sin inderlomme.', aktionType: 'guld', vaerdi: 20 },
                    succes: { log: 'Han indser at han lever og sværger dig evig troskab.', aktionType: 'hp', vaerdi: 40 },
                    mirakel: { log: 'Han er arving til et handelshus og bærer en magisk ring, han forærer dig.', aktionType: 'hp', vaerdi: 100 }
                }
            },
            {
                tekst: 'Plyndr de døde vagter på kanten i stedet',
                puljeVaerdi: 40,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'En af vagterne var kun bevidstløs og hugger dig i benet.', aktionType: 'hp', vaerdi: -40, multiplikator: 0 },
                    fiasko: { log: 'Kulden har ødelagt alt af værdi.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Du finder lidt småmønt i deres stive støvler.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Du tømmer deres lommer effektivt mens rigmanden råber på hjælp.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Vagtkaptajnen bar en skjult og uvurderlig skat i sit bælte.', aktionType: 'guld', multiplikator: 3 }
                }
            },
            {
                tekst: 'Forlad stedet inden isen bryder under dig',
                aktionType: 'luk'
            }
        ]
    },

    'bjerg_rovfugl_rede': {
        id: 'bjerg_rovfugl_rede',
        titel: 'Konsekvensens Tinde',
        tekst: 'Et enormt rede af afpillede knogler balancerer på skrænten. To varme, gigantiske æg hviler i midten. Et halvt fordøjet menneskeskelet holder krampagtigt fast i en enorm guldkæde.',
        type: 'kamp',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Drik æggenes indhold for rå styrke',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Fuglemoderen slår pludselig ned fra himlen og flænser din ryg.', aktionType: 'hp', vaerdi: -80 },
                    fiasko: { log: 'Fosteret indeni gør dig voldsomt syg.', aktionType: 'hp', vaerdi: -30 },
                    neutral: { log: 'Det er næringsrigt, men smagen sidder fast i halsen på dig.', aktionType: 'hp', vaerdi: 20 },
                    succes: { log: 'Den tykke væske brænder i årerne og heler dine sår.', aktionType: 'hp', vaerdi: 60 },
                    mirakel: { log: 'Magien i ægget muterer din krop til at være totalt usårlig over for kulde.', aktionType: 'hp', vaerdi: 150 }
                }
            },
            {
                tekst: 'Stjæl guldkæden fra skelettet',
                puljeVaerdi: 120,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Knoglebunken skrider. Du falder ud over den stejle kant.', aktionType: 'hp', vaerdi: -90, multiplikator: 0 },
                    fiasko: { log: 'Kæden sidder fast og fuglen skriger i det fjerne. Du må flygte tomhændet.', aktionType: 'hp', vaerdi: -20, multiplikator: 0 },
                    neutral: { log: 'Du flår den af og slipper ned ad bjerget i tide.', aktionType: 'guld', multiplikator: 0.8 },
                    succes: { log: 'En glat og kold beregnet plyndring af de døde.', aktionType: 'guld', multiplikator: 1.5 },
                    mirakel: { log: 'Du finder skelettets skjulte kompas besat med ædelstene.', aktionType: 'guld', multiplikator: 3 }
                }
            }
        ]
    },

    'bjerg_lavine_hule': {
        id: 'bjerg_lavine_hule',
        titel: 'Det Hvide Mørke',
        tekst: 'Bjerget brøler. En mur af sne og is ruller ned mod dig. En anden såret eventyrer kravler desperat mod det samme lille klippefremspring som dig. Der er kun plads til én.',
        type: 'kamp',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Spark ham væk og overtag hulen',
                puljeVaerdi: 80,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Han griber dit ben i faldet og trækker jer begge ud i snemasserne.', aktionType: 'hp', vaerdi: -100, multiplikator: 0 },
                    fiasko: { log: 'I slås om pladsen, og lavinen rammer jer delvist begge to.', aktionType: 'hp', vaerdi: -50, multiplikator: 0 },
                    neutral: { log: 'Du skubber ham ud i døden og tager hans tabte taske.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Koldblodig overlevelse. Du samler hans guld op, da sneen har lagt sig.', aktionType: 'guld', multiplikator: 1.2 },
                    mirakel: { log: 'Du udgraver et intakt, legendarisk våben fra hans frosne lig.', aktionType: 'guld', multiplikator: 4 }
                }
            },
            {
                tekst: 'Træk ham ind og skærm ham med din krop (-60 HP)',
                aktionType: 'hp',
                vaerdi: -60,
                naesteTrin: 'bjerg_lavine_karma'
            }
        ]
    },

    'bjerg_lavine_karma': {
        id: 'bjerg_lavine_karma',
        titel: 'Gælden',
        tekst: 'Snemasserne hamrer ind i din ryg. Det føles som at blive knust af massiv sten. Da larmen endelig stopper, kigger den fremmede mand op på dig med store øjne.',
        type: 'historie',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        erSubTrin: true,
        valg: [
            {
                tekst: 'Forlang din betaling',
                puljeVaerdi: 200,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Han stikker dig ned og tager dine ting, mens du ligger svækket.', aktionType: 'hp', vaerdi: -40, multiplikator: 0 },
                    fiasko: { log: 'Han har intet af værdi at betale med.', aktionType: 'guld', multiplikator: 0 },
                    neutral: { log: 'Han tømmer sine lommer af ren taknemmelighed.', aktionType: 'guld', multiplikator: 0.5 },
                    succes: { log: 'Han overdrager sit fulde udbytte fra ekspeditionen til dig.', aktionType: 'guld', multiplikator: 1 },
                    mirakel: { log: 'Han er en udsendt kongelig, der skriver et gældsbevis på en hel formue til dig.', aktionType: 'guld', multiplikator: 3 }
                }
            }
        ]
    },

    'bjerg_alter_offer': {
        id: 'bjerg_alter_offer',
        titel: 'Bjergets Tørst',
        tekst: 'Et alter af sort basalt troner på tinden. En indskrift brænder ind i dit sind. Den kræver en permanent ofring af kød eller metal for at lade dig passere med livet i behold.',
        type: 'historie',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Skær dig i armen og giv dit blod (-30 HP)',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Alteret suger blodet direkte fra dine årer. Det er umætteligt.', aktionType: 'hp', vaerdi: -60 },
                    fiasko: { log: 'Såret nægter at lukke sig. Du bløder hele vejen ned ad bjerget.', aktionType: 'hp', vaerdi: -20 },
                    neutral: { log: 'Stenen drikker blodet. Du mærker ingen umiddelbar belønning.', aktionType: 'hp', vaerdi: 0 },
                    succes: { log: 'Døren til bjergets indre åbner sig. Du finder ældgamle mønter.', aktionType: 'guld', vaerdi: 120 },
                    mirakel: { log: 'Dit blod aktiverer alterets magi, der forvandler jorden under dig til rent guld.', aktionType: 'guld', vaerdi: 400 }
                }
            },
            {
                tekst: 'Hæld mønter i skålen',
                puljeVaerdi: 100,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Alteret tager pengene og kaster en kvælende forbandelse over dine lunger.', aktionType: 'hp', vaerdi: -50, multiplikator: -1 },
                    fiasko: { log: 'Mønterne smelter bare ned i stenen. Intet sker.', aktionType: 'hp', vaerdi: 0, multiplikator: -1 },
                    neutral: { log: 'Bjerget brummer anerkendende. Luften bliver lettere at indånde.', aktionType: 'hp', vaerdi: 30, multiplikator: -1 },
                    succes: { log: 'En magisk aura omslutter dig og fjerner alle dine sår.', aktionType: 'hp', vaerdi: 80, multiplikator: -1 },
                    mirakel: { log: 'Du bliver velsignet med stenens hårdhed. Din krop er nu et levende våben.', aktionType: 'hp', vaerdi: 150, multiplikator: -1 }
                }
            },
            {
                tekst: 'Spyt på stenen og afvis guden',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Lynet slår ned direkte i dit bryst.', aktionType: 'hp', vaerdi: -100 },
                    fiasko: { log: 'Klippen giver efter under dig. Du styrter dybt ned.', aktionType: 'hp', vaerdi: -60 },
                    neutral: { log: 'En enorm sværm af bjergfluer angriber dig.', aktionType: 'hp', vaerdi: -20 },
                    succes: { log: 'Du bryder forbandelsen med din stædighed. Alteret krakelerer.', aktionType: 'hp', vaerdi: 0 },
                    mirakel: { log: 'Dit oprør knuser stenen og afslører gudens gemte formue i fundamentet.', aktionType: 'guld', vaerdi: 350 }
                }
            },
            {
                tekst: 'Vend om og find en anden rute',
                aktionType: 'luk'
            }
        ]
    },

    'bjerg_munken': {
        id: 'bjerg_munken',
        titel: 'Vogteren på Broen',
        tekst: 'En munk med bind for øjnene sidder midt på en smal stenbro. Snestormen rører ham ikke. Han hæver en knudret træstav. Du skal ofre noget af værdi for at betræde hans vej.',
        type: 'kamp',
        biome: 'bjerg',
        billede: '/events/placeholder.webp',
        valg: [
            {
                tekst: 'Læg 50 guld i hans tigger-skål',
                puljeVaerdi: 50,
                aktionType: 'guld',
                udfald: {
                    katastrofe: { log: 'Han kaster guldet i afgrunden og slår dig over knæene for din grådighed.', aktionType: 'hp', vaerdi: -60, multiplikator: -1 },
                    fiasko: { log: 'Han tager guldet, men kræver alligevel at du modtager et slag.', aktionType: 'hp', vaerdi: -20, multiplikator: -1 },
                    neutral: { log: 'Han nikker tavst og træder langsomt til side.', aktionType: 'hp', vaerdi: 0, multiplikator: -1 },
                    succes: { log: 'Han anerkender dit storsind og velsigner din videre vandring.', aktionType: 'hp', vaerdi: 40, multiplikator: -1 },
                    mirakel: { log: 'Dit offer rører ham. Han forærer dig sit eget hemmelige skattekort.', aktionType: 'guld', vaerdi: 200, multiplikator: -1 }
                }
            },
            {
                tekst: 'Bed ham slå dig med staven som betaling',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Slaget knuser dit kraveben. Han kendte slet ikke sin egen styrke.', aktionType: 'hp', vaerdi: -80 },
                    fiasko: { log: 'Smerten er meget værre end forventet. Du kaster blod op på sneen.', aktionType: 'hp', vaerdi: -40 },
                    neutral: { log: 'Du tager slaget uden at blinke. Han lader dig passere i respekt.', aktionType: 'hp', vaerdi: -15 },
                    succes: { log: 'Din viljestyrke imponerer ham. Han overdrager dig de vejfarendes efterladte guld.', aktionType: 'guld', vaerdi: 100 },
                    mirakel: { log: 'Slaget bar magi. Det hærder din krop permanent mod fremtidig smerte.', aktionType: 'hp', vaerdi: 120 }
                }
            },
            {
                tekst: 'Angrib og forsøg at skubbe ham i afgrunden',
                puljeVaerdi: 0,
                udfald: {
                    katastrofe: { log: 'Han parerer angrebet med lukkede øjne og kaster dig ned ad bjergsiden.', aktionType: 'hp', vaerdi: -90 },
                    fiasko: { log: 'Han rammer dine nervepunkter med tre lynhurtige stik fra staven.', aktionType: 'hp', vaerdi: -50 },
                    neutral: { log: 'I kæmper en lang, brutal kamp, før han til sidst trækker sig tilbage.', aktionType: 'hp', vaerdi: -20 },
                    succes: { log: 'Du overrumpler manden. Han bærer en tung, skjult amulet under kappen.', aktionType: 'guld', vaerdi: 150 },
                    mirakel: { log: 'Du fanger hans stav, knækker den over knæet og stjæler hans legendestatus.', aktionType: 'guld', vaerdi: 400 }
                }
            },
            {
                tekst: 'Brug ekstra tid på at bestige en farligere klippevæg uden om ham (-15 HP)',
                aktionType: 'hp',
                vaerdi: -15
            }
        ]
    },



    
    'blodeg_hoved': {
        id: 'blodeg_hoved',
        biome: ['blodskov', 'skov'],
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