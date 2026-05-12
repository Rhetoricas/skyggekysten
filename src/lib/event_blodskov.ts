import type { SpilEvent } from './eventBibliotek';

export const blodskovensHjerteEvents: Record<string, SpilEvent> = {
  blodskovens_hjerte: {
    id: 'blodskovens_hjerte',
    titel: 'Træets blødende rod',
    biome: ['blodskov'],
    tekst: `Rød saft klistrer til dine støvler. Et massivt træ fylder hele lysningen. Tykke rødder holder fem skovhuggere fastspændt mod stammen. Rødderne knuser dem langsomt.

Deres leder står fri. Hun hugger en sløv økse i barken for at få dem fri. Ved træets fod sidder en gammel mand bundet til barken med sit eget hår. Hver gang øksen rammer, bløder han fra munden.

Lederen råber, at træets kerne kan betale mændenes gæld. Den gamle mand spytter blod og siger, at kernen vil æde den by, den bliver bragt til.`,
    unik: true,
    erSubTrin: false,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Træd frem og kræv at lederen smider øksen.',
        udfaldListe: [
          { log: `Hun stopper slaget. Træet udnytter pausen til at stramme grebet om en arbejder. Hans kraveben brækker med et højt knæk.`, hpAendring: -5, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Hun svinger øksen mod dig i stedet for stammen. Du dukker dig, men skaftet rammer din skulder hårdt.`, hpAendring: -12, naesteTrin: 'blodskov_angrebet' },
          { log: `Din stemme får pladsen til at fryse. Både kvinden og den gamle mand kigger på dig, mens rødderne slapper en anelse af.`, maxHpAendring: 4, naesteTrin: 'blodskov_vaegtskaalen' }
        ]
      },
      {
        tekst: 'Træk dit våben og hjælp med at fælde træet.',
        udfaldListe: [
          { log: `Barken flænges under jeres fælles angreb. Den gamle mand skriger, og jorden ryster voldsomt under jer.`, naesteTrin: 'blodskov_angrebet' },
          { log: `En gren pisker ned fra trækronen og slår dig til jorden. Du mister pusten totalt.`, hpAendring: -18, naesteTrin: 'blodskov_angrebet' },
          { log: `Du rammer et blødt punkt i stammen. En enorm mængde rød saft flyder ud og tvinger rødderne tilbage.`, guldAendring: 40, maxHpAendring: 5, naesteTrin: 'blodskov_saften' }
        ]
      },
      {
        tekst: 'Sæt ild til grenene med din fakkel for at skabe panik.',
        kosterItem: 'fakkel',
        udfaldListe: [
          { log: `Ilden griber fat i den tørre bark. Træet trækker sine rødder til sig i forsvarsmekanisme, og skovhuggerne falder ned i mudderet.`, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Varmen brænder også dig. Du skaber afstanden, men flammerne fortærer din oppakning lidt.`, hpAendring: -10, naesteTrin: 'blodskov_roedderne' },
          { log: `Ilden afslører et mærkeligt hulrum oppe i stammen. Lederen stirrer grådigt på det.`, guldAendring: 60, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Giv den gamle mand din mad for at aflede hans magt.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: `Han tager imod brødet. Da han spiser, mister træet sit faste greb om mændene.`, maxHpAendring: 5, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Han ignorerer maden fuldstændig. En sulten arbejder kaster sig frem og sluger det foran ham. Det skaber kun mere kaos.`, hpAendring: -6, naesteTrin: 'blodskov_roedderne' },
          { log: `Brødet absorberer noget af den røde saft på jorden. Den gamle samler det op og gemmer det. Han skylder dig noget nu.`, guldAendring: 50, naesteTrin: 'blodskov_vaegtskaalen' }
        ]
      },
      {
        tekst: 'Som jæger læser du røddernes bevægelsesmønster før du reagerer.',
        kraeverKarakter: 'hunter_m',
        udfaldListe: [
          { log: `Du ser, at rødderne ikke angriber. De forsvarer stammens indre. Den gamle mand styrer dem med små ryk i fingrene.`, naesteTrin: 'blodskov_kernen' },
          { log: `Du står for længe og observerer. Mudderet giver efter under dig, og du glider ned i en pøl af saft.`, hpAendring: -8, naesteTrin: 'blodskov_saften' },
          { log: `Du finder den nøjagtige rytme i træets forsvar. Du kan træde helt hen til kernen uden at blive rørt.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Som jægerinde læser du røddernes bevægelsesmønster før du reagerer.',
        kraeverKarakter: 'hunter_f',
        udfaldListe: [
          { log: `Du ser, at rødderne ikke angriber. De forsvarer stammens indre. Den gamle mand styrer dem med små ryk i fingrene.`, naesteTrin: 'blodskov_kernen' },
          { log: `Du står for længe og observerer. Mudderet giver efter under dig, og du glider ned i en pøl af saft.`, hpAendring: -8, naesteTrin: 'blodskov_saften' },
          { log: `Du finder den nøjagtige rytme i træets forsvar. Du kan træde helt hen til kernen uden at blive rørt.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' }
        ]
      }
    ]
  },

  blodskov_vaegtskaalen: {
    id: 'blodskov_vaegtskaalen',
    titel: 'Vægtskålen',
    biome: ['blodskov'],
    tekst: `Lederen sænker sin økse. Hun tørrer sved af panden og peger anklagende på den gamle mand. Hun siger, at han er en kultist, der har fodret træet med byfolk i årevis.

Den gamle spytter igen. Han siger, at han er den eneste lås på et bur, der holder skoven fra at æde egnen.

De fastklemte skovhuggere stønner. Træet strammer langsomt grebet igen. Her er ingen tid til forhandlinger. Der skal handles.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Gå tæt på og tving manden til at slippe mændene.',
        udfaldListe: [
          { log: `Han nægter. Du vrider hans arm, og træet reagerer ved at kaste dig tilbage i mudderet.`, hpAendring: -15, naesteTrin: 'blodskov_roedderne' },
          { log: `Du presser en støvle mod hans hals. Rødderne løsner grebet øjeblikkeligt, og skovhuggerne falder fri.`, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Han ler af dig. Det giver lederen tid til at finde sin økse og rette den mod jer begge.`, hpAendring: -6, guldAendring: 30, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Betal lederen for at opgive træet og lade det være i fred.',
        puljeVaerdi: 150,
        udfaldListe: [
          { log: `Hun tager pengene. Det løser hendes gæld, men hendes mænd sidder stadig fast i rødderne. Problemet eksisterer stadig.`, maxHpAendring: -2, naesteTrin: 'blodskov_roedderne' },
          { log: `Mønterne overbeviser hende. Hun kalder sine folk tilbage, og manden stopper sit forsvar.`, hpAendring: 12, maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' },
          { log: `Hun gemmer pengene og hugger alligevel. Grådighed lader sig sjældent stoppe af en enkelt betaling.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Find jernkæden under mudderet med din metaldetektor.',
        kraeverItem: 'metaldetektor',
        udfaldListe: [
          { log: `Maskinen hyler. Du finder kæden, der binder manden til træet, og knækker den. Han er nu fri til at slå fra sig.`, naesteTrin: 'blodskov_angrebet' },
          { log: `Kæden rummer et skjult rum med gamle mønter. Du tager dem, mens de andre skændes.`, guldAendring: 120, naesteTrin: 'blodskov_kernen' },
          { log: `Du rører en forkert del af kæden, og den brænder dig med mørk magi. Det koster på kræfterne.`, hpAendring: -14, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Kast dit flotte tøj over mandens hoved for at blænde hans kontrol.',
        kosterItem: 'flot_toej',
        udfaldListe: [
          { log: `Stoffet blokerer hans udsyn. Rødderne mister retning og slipper mændene.`, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Han river tøjet i stykker med det samme. Træet strammer grebet af ren vrede.`, hpAendring: -8, naesteTrin: 'blodskov_angrebet' },
          { log: `Det skaber nok forvirring til, at du kan tømme de tasker, der ligger efterladt på jorden.`, guldAendring: 90, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som ridder tager du kontrollen over pladsen og beordrer våbenhvile.',
        kraeverKarakter: 'knight_m',
        udfaldListe: [
          { log: `Din autoritet slår igennem. Lederen bakker, og manden slapper af. Du kan nu frit tilgå træets kerne.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Din befaling bliver mødt med en splintrende gren, der slår ind mod dit panser. Her gælder kun skovens lov.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' },
          { log: `Skovhuggerne adlyder dig og samler deres ting. De overlader kampen mod kultisten til dig.`, guldAendring: 60, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Som skjoldmø tager du kontrollen over pladsen og beordrer våbenhvile.',
        kraeverKarakter: 'knight_f',
        udfaldListe: [
          { log: `Din autoritet slår igennem. Lederen bakker, og manden slapper af. Du kan nu frit tilgå træets kerne.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Din befaling bliver mødt med en splintrende gren, der slår ind mod dit panser. Her gælder kun skovens lov.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' },
          { log: `Skovhuggerne adlyder dig og samler deres ting. De overlader kampen mod kultisten til dig.`, guldAendring: 60, naesteTrin: 'blodskov_angrebet' }
        ]
      }
    ]
  },

  blodskov_angrebet: {
    id: 'blodskov_angrebet',
    titel: 'Bark og Blod',
    biome: ['blodskov'],
    tekst: `Barken flænges. Træet kaster en byge af sylespidse splinter ud over rydningen. Den gamle mand brøler, mens rødderne begynder at trække to af mændene under jorden.

Gennem såret i stammen lyser træets indre svagt rødt. Lederen gør klar til at lade sine folk i stikken for at nå frem til kilden først.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Skub lederen i mudderet og tag hulrummet for dig selv.',
        udfaldListe: [
          { log: `Hun falder tungt. Du rækker ind i træet og får fingrene i noget massivt og glødende.`, naesteTrin: 'blodskov_kernen' },
          { log: `Hun trækker dig med ned i faldet. Rødderne pisker jer begge. Du betaler med smerte for dit grådighed.`, hpAendring: -18, naesteTrin: 'blodskov_kernen' },
          { log: `Du får et solidt forspring og samler løse ædelstene op fra jorden foran stammen.`, guldAendring: 110, maxHpAendring: 3, naesteTrin: 'blodskov_saften' }
        ]
      },
      {
        tekst: 'Afbryd dit angreb og prøv at hive folkene op fra hullerne.',
        udfaldListe: [
          { log: `Du får fat i to af dem. De hoster jord op og takker dig med det guld, de har tilbage i lommerne.`, guldAendring: 140, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Rødderne er for stærke. De trækker dem under, mens tornene river huden af dine underarme.`, hpAendring: -22, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du redder den ene, mens den anden forsvinder. Det er en delvis sejr. Han lader sin dolk ligge til dig.`, givItem: 'kniv', maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Brug din rustning som et skjold mod træets splint-regn.',
        kosterItem: 'rustning',
        udfaldListe: [
          { log: `Panseret beskytter dig fuldstændigt mod angrebet. Du baner vej gennem kaosset og når stammen uskadet.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Træet smadrer metallet totalt, og et par splinter slipper igennem til dit lår.`, hpAendring: -12, naesteTrin: 'blodskov_saften' },
          { log: `Du absorberer stødet for alle. Lederen kvitterer ved at række dig sin stak af sammensparet bytte.`, guldAendring: 160, naesteTrin: 'blodskov_roedderne' }
        ]
      },
      {
        tekst: 'Som ork brøler du højt og slår stammen med dine bare næver.',
        kraeverKarakter: 'orc_m',
        udfaldListe: [
          { log: `Dit slag kaster en trykbølge gennem barken. Træet standser sit angreb af ren chok, og hulrummet åbnes yderligere.`, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Træet er hårdere end sten. Du brækker to knoer og falder baglæns med en smertefuld rysten i armen.`, hpAendring: -15, naesteTrin: 'blodskov_saften' },
          { log: `Slaget vælter døde grene ned. De indeholder intakte eliksirer fra tidligere rejsende, der mødte skoven.`, givItem: 'livseliksir', guldAendring: 50, naesteTrin: 'blodskov_roedderne' }
        ]
      },
      {
        tekst: 'Som klanleder brøler du højt og slår stammen med dine bare næver.',
        kraeverKarakter: 'orc_f',
        udfaldListe: [
          { log: `Dit slag kaster en trykbølge gennem barken. Træet standser sit angreb af ren chok, og hulrummet åbnes yderligere.`, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Træet er hårdere end sten. Du brækker to knoer og falder baglæns med en smertefuld rysten i armen.`, hpAendring: -15, naesteTrin: 'blodskov_saften' },
          { log: `Slaget vælter døde grene ned. De indeholder intakte eliksirer fra tidligere rejsende, der mødte skoven.`, givItem: 'livseliksir', guldAendring: 50, naesteTrin: 'blodskov_roedderne' }
        ]
      }
    ]
  },

  blodskov_roedderne: {
    id: 'blodskov_roedderne',
    titel: 'Jordens Lås',
    biome: ['blodskov'],
    tekst: `Rødderne er seje som ståltråd. Mudderet stinker voldsomt af jern. En af mændene rækker dig en pung og beder dig tage pengene mod at lade ham ligge. Han har opgivet.

Den gamle mand styrer tydeligvis røddernes greb. Han lader skovhuggerne lide med fuldt overlæg. Lader du rødderne æde dem, tager skoven dem permanent.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Skær mændene fri én efter én med dit blad.',
        kraeverItem: 'kniv',
        udfaldListe: [
          { log: `Kniven arbejder hurtigt og præcist. Du løsner båndene og sikrer dig arbejdernes guld som tak.`, guldAendring: 180, maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Klingen smutter på den hårde bark og skærer dybt i din håndflade. De kommer fri, men det kostede.`, hpAendring: -12, guldAendring: 100, naesteTrin: 'blodskov_efterspillet' },
          { log: `Træet afgiver en sort gas fra snittene. Du hoster og mister pusten, mens de stikker af.`, hpAendring: -16, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Træk dem op med ren håndkraft.',
        udfaldListe: [
          { log: `Det kræver al din styrke. Din ryg brokker sig voldsomt, og det trækker hårde smerter gennem lænden.`, hpAendring: -20, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du hiver dem op som radiser. Din styrke redder dagen uden omkostninger.`, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du mister grebet om den sidste. Han overlever ikke. Du samler hans taske op i stedet.`, guldAendring: 130, hpAendring: -8, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Sænk din eliksir ned til manden, så han kan tåle trykket.',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: `Væsken giver ham styrke til selv at brække rødderne op. Han rækker dig en diamant, han fandt dernede.`, givItem: 'diamant', maxHpAendring: 8, naesteTrin: 'blodskov_efterspillet' },
          { log: `Han spilder det meste. Det redder hans liv, men skaber ingen rigdom til dig.`, maxHpAendring: 3, naesteTrin: 'blodskov_efterspillet' },
          { log: `Trædrikken absorberes delvist af jorden. Skoven trækker sig roligt tilbage mæt af energi.`, hpAendring: 10, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Mærk med kvisten efter det sted, hvor jorden er svagest.',
        kraeverItem: 'soegekvist',
        udfaldListe: [
          { log: `Kvisten peger direkte på en hul rod. Du træder på den, og alle fangere slipper øjeblikkeligt deres bytte.`, maxHpAendring: 10, naesteTrin: 'blodskov_saften' },
          { log: `Den viser dig en vej uden om mændene, direkte til en skjult bunke valuta.`, guldAendring: 160, naesteTrin: 'blodskov_efterspillet' },
          { log: `Kvisten forvirres af træets magi og vildleder dig ud i en tornebusk.`, hpAendring: -10, naesteTrin: 'blodskov_saften' }
        ]
      }
    ]
  },

  blodskov_saften: {
    id: 'blodskov_saften',
    titel: 'Det Røde Guld',
    biome: ['blodskov'],
    tekst: `Den røde saft strømmer nu frit fra sårene i stammen. Den er varm og lugter kraftigt af jern. Du kan høre svage stød inde fra træet.

Lederen stikker hurtigt en læderflaske ind for at fange dråberne. Hun siger, det kan hele al sygdom. Den gamle mand advarer om, at dråberne vil forandre hendes blod permanent.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Saml saften op med dine egne klude.',
        kosterItem: 'klude',
        udfaldListe: [
          { log: `Kludene fungerer som svampe. Du vrider dem ned i din egen taske og får et massivt energiboost af dampen alene.`, hpAendring: 25, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Syren i saften ætser stoffet på sekunder. Du når lige akkurat at undgå brændsår på fingrene.`, hpAendring: -5, naesteTrin: 'blodskov_kernen' },
          { log: `Det drypper på mønterne i lommen, som tager en underlig rød glans og stiger i værdi for samlere.`, guldAendring: 120, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Slå flasken ud af hånden på hende.',
        udfaldListe: [
          { log: `Flasken splintres. Den røde saft trænger ned i jorden. Lederen trækker sin kniv mod dig.`, hpAendring: -14, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du vipper den væk. Det forhindrer hende i at drikke giften. Hun takker dig stumt og afleverer sit udstyr.`, givItem: 'sabel', maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Lederen dykker efter den i mudderet. I forvirringen napper du hendes tunge pengepung uforstyrret.`, guldAendring: 150, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som pirat stjæler du flasken i farten for dig selv.',
        kraeverKarakter: 'pirate_m',
        udfaldListe: [
          { log: `Dine hænder er hurtigere end hendes øjne. Du erstatter flasken med mudder og drikker styrken i dig selv.`, hpAendring: 30, maxHpAendring: 12, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du hugger den, men saften koger op i maven på dig og forvolder en voldsom krampe.`, hpAendring: -18, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du fanger flasken og tvinger hende til at betale en enorm løsesum for at få den tilbage.`, guldAendring: 250, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som korsar stjæler du flasken i farten for dig selv.',
        kraeverKarakter: 'pirate_f',
        udfaldListe: [
          { log: `Dine hænder er hurtigere end hendes øjne. Du erstatter flasken med mudder og drikker styrken i dig selv.`, hpAendring: 30, maxHpAendring: 12, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du hugger den, men saften koger op i maven på dig og forvolder en voldsom krampe.`, hpAendring: -18, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du fanger flasken og tvinger hende til at betale en enorm løsesum for at få den tilbage.`, guldAendring: 250, naesteTrin: 'blodskov_efterspillet' }
        ]
      }
    ]
  },

  blodskov_kernen: {
    id: 'blodskov_kernen',
    titel: 'Træets Hjerte',
    biome: ['blodskov'],
    tekst: `Træets midte er nu fuldstændig blottet. Her sidder en kæmpemæssig, rødlig krystal. Den udstråler en kvælende hede og pumper i et langsomt tempo.

Den gamle mands øjne er rullet tilbage i hovedet, og han forsøger at dække krystallen med sine sidste tynde rødder. Lederen hæver sin kniv. Hun vil skære stenen ud, selv hvis det koster hendes egne folks liv under rødderne.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Flæk krystallen med et tungt slag fra dit sværd.',
        kraeverItem: 'svaerd',
        udfaldListe: [
          { log: `Sværdet rammer plet. Krystallen sprænges i tusind stykker, og træet dør øjeblikkeligt. Du samler splinterne op.`, givItem: 'diamant', guldAendring: 120, naesteTrin: 'blodskov_efterspillet' },
          { log: `Trykbølgen fra slaget smadrer klingen og sender dig flyvende ind i en stamme. Våbnet er tabt, men skoven giver op.`, hpAendring: -20, maxHpAendring: -2, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du knuser hjertet. Magien fordamper, og den gamle mand falder om. Du tager pengene fra hans gemmer under rødderne.`, guldAendring: 220, maxHpAendring: 8, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Skyd krystallen ud af stammen med en pil fra afstand.',
        kraeverItem: 'bue',
        udfaldListe: [
          { log: `Pilen borer sig ind bag stenen og vipper den ud. Krystallen dæmper sin varme og lader sig let indsamle.`, givItem: 'diamant', maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du rammer forbi stenen og punkterer en saftkirtel. Dampen svider din næse og øjne alvorligt.`, hpAendring: -15, naesteTrin: 'blodskov_efterspillet' },
          { log: `Skuddet skærer stenen i to. Lederen griber den ene, du tager den anden. Det er en handel formet af vold.`, givItem: 'diamant', guldAendring: 90, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Smid en diamant til rødderne for at bytte med træets kerne.',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: `Træet accepterer din byttehandel. Krystallen triller ud, og skoven roer sig ned med din diamant som erstatning.`, givItem: 'livseliksir', guldAendring: 300, naesteTrin: 'blodskov_efterspillet' },
          { log: `Træet æder diamanten og spytter syre ud i hovedet på dig. Magien vil ikke købes i dag.`, hpAendring: -25, naesteTrin: 'blodskov_efterspillet' },
          { log: `Manden sluger diamanten. Han løsner sit eget greb og trækker vejret tungt, mens træet frigiver en stak skjold og våben.`, givItem: 'rustning', guldAendring: 150, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Kræv stenen udleveret mod at dele overskuddet med lederen.',
        udfaldListe: [
          { log: `Hun accepterer. I vrikker stenen løs sammen og deler puljen op på stående fod.`, givItem: 'diamant', hpAendring: -5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Hun snyder dig og stikker af med stenen, mens træet pisker dig over ansigtet med en gren.`, hpAendring: -16, naesteTrin: 'blodskov_efterspillet' },
          { log: `Forhandlingen tager for lang tid. Krystallen smelter væk, men lader mønter fra de tidligere ofre ligge frit fremme.`, guldAendring: 250, maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som troldmand afbryder du forbindelsen mellem sten og træ.',
        kraeverKarakter: 'magician_m',
        udfaldListe: [
          { log: `Du udsender en modpuls. Krystallen afbrydes fra træet, og magien fader blødt ud uden fare. Stenen er din.`, givItem: 'diamant', maxHpAendring: 10, naesteTrin: 'blodskov_efterspillet' },
          { log: `Magien er stærkere end forventet. Du får et alvorligt tilbagekast, der dræner dit indre, før stenen overgiver sig.`, hpAendring: -20, givItem: 'diamant', naesteTrin: 'blodskov_efterspillet' },
          { log: `Du slukker træet fuldstændig. Den gamle mand takker dig med dybe buk og lader sit lager af udstyr stå åbent.`, givItem: 'metaldetektor', guldAendring: 180, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som troldkvinde afbryder du forbindelsen mellem sten og træ.',
        kraeverKarakter: 'magician_f',
        udfaldListe: [
          { log: `Du udsender en modpuls. Krystallen afbrydes fra træet, og magien fader blødt ud uden fare. Stenen er din.`, givItem: 'diamant', maxHpAendring: 10, naesteTrin: 'blodskov_efterspillet' },
          { log: `Magien er stærkere end forventet. Du får et alvorligt tilbagekast, der dræner dit indre, før stenen overgiver sig.`, hpAendring: -20, givItem: 'diamant', naesteTrin: 'blodskov_efterspillet' },
          { log: `Du slukker træet fuldstændig. Den gamle mand takker dig med dybe buk og lader sit lager af udstyr stå åbent.`, givItem: 'metaldetektor', guldAendring: 180, naesteTrin: 'blodskov_efterspillet' }
        ]
      }
    ]
  },

  blodskov_efterspillet: {
    id: 'blodskov_efterspillet',
    titel: 'Stilhed over Saften',
    biome: ['blodskov'],
    tekst: `Rydningen bliver mærkeligt stille. Rødderne trækker sig ikke længere. Skovhuggerne forsøger at samle sig og binde deres sår ind.

Træet er blot en stor, udhulet plante nu. Omkring dig flyder det med efterladenskaber. Det er tid til at vurdere prisen på din indgriben, pakke rygsækken og komme videre inden tågen opsluger pladsen.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Forlad pladsen hurtigst muligt.',
        udfaldListe: [
          { log: `Du trækker dig tilbage og overlader rydningen til sig selv. Skoven har ikke mere at fortælle dig i dag.`, maxHpAendring: 5 },
          { log: `Du træder over en skjult rod på vej væk og får et slemt træk i anklen, men overlever sagen.`, hpAendring: -8, maxHpAendring: 3 },
          { log: `Du lister afsted og opdager en efterladt skovl ved kanten af lysningen. Skoven sørger altid for noget.`, givItem: 'skovl', maxHpAendring: 4 }
        ]
      },
      {
        tekst: 'Kræv kontant betaling af de overlevende for din indsats.',
        udfaldListe: [
          { log: `De har ingen energi til at diskutere. De kaster deres møntposer over til dig med vrede blikke.`, guldAendring: 240, maxHpAendring: -2 },
          { log: `Lederen forsvarer sit guld til det sidste og skærer dig en overfladisk flænge med kniven, inden hun betaler.`, hpAendring: -12, guldAendring: 180 },
          { log: `De betaler uden et ord. Mønterne klirrer koldt i lommen. Du har overlevet. De har overlevet. Intet mere.`, guldAendring: 210 }
        ]
      },
      {
        tekst: 'Tilbyd at eskortere dem ud til grænsen af skoven.',
        udfaldListe: [
          { log: `Turen ud er rolig. Det giver dig anledning til at rense tankerne og helbrede kroppen let. De takker med lidt mønter.`, hpAendring: 15, guldAendring: 80 },
          { log: `En sidste gren falder uventet og slår dig over hovedet på vejen. Du hjælper dem, men betaler prisen.`, hpAendring: -14, maxHpAendring: 5 },
          { log: `Du guider dem ud sikkert. En arbejder presser en lille ædelsten i din hånd som tak for livet.`, givItem: 'diamant', maxHpAendring: 8 }
        ]
      },
      {
        tekst: 'Som hertug beslaglægger du alle værdier fra pladsen i statens navn.',
        kraeverKarakter: 'royal_m',
        udfaldListe: [
          { log: `Din autoritet tillader ingen modsigelse. Du rydder lysningen for alt af værdi. Det er beskidt arbejde, men yderst rentabelt.`, guldAendring: 320, maxHpAendring: 5 },
          { log: `En skovhugger yder desperat modstand. Det koster dig nogle skrammer at overbevise ham om dit ejerskab.`, hpAendring: -15, guldAendring: 280 },
          { log: `Den gamle mand nikker og accepterer din lov. Du modtager både mønter og et efterladt våben fra jorden.`, givItem: 'sabel', guldAendring: 200 }
        ]
      },
      {
        tekst: 'Som hertuginde beslaglægger du alle værdier fra pladsen i statens navn.',
        kraeverKarakter: 'royal_f',
        udfaldListe: [
          { log: `Din autoritet tillader ingen modsigelse. Du rydder lysningen for alt af værdi. Det er beskidt arbejde, men yderst rentabelt.`, guldAendring: 320, maxHpAendring: 5 },
          { log: `En skovhugger yder desperat modstand. Det koster dig nogle skrammer at overbevise ham om dit ejerskab.`, hpAendring: -15, guldAendring: 280 },
          { log: `Den gamle mand nikker og accepterer din lov. Du modtager både mønter og et efterladt våben fra jorden.`, givItem: 'sabel', guldAendring: 200 }
        ]
      }
    ]
  }
};
