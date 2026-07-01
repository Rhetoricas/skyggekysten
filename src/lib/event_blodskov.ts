import type { SpilEvent } from './eventBibliotek';

export const blodskovensHjerteEvents: Record<string, SpilEvent> = {
  blodskovens_hjerte: {
    id: 'blodskovens_hjerte',
    titel: 'Træets blødende rod',
    titelEn: 'The Tree’s Bleeding Root',
    biome: ['blodskov'],
    tekst: `Rød saft klistrer til dine støvler. Et massivt træ fylder hele lysningen. Tykke rødder holder fem skovhuggere fastspændt mod stammen. Rødderne knuser dem langsomt.

Deres leder står fri. Hun hugger en sløv økse i barken for at få dem fri. Ved træets fod sidder en gammel mand bundet til barken med sit eget hår. Hver gang øksen rammer, bløder han fra munden.

Lederen råber, at træets kerne kan betale mændenes gæld. Den gamle mand spytter blod og siger, at kernen vil æde den by, den bliver bragt til.`,
    tekstEn: `Red sap sticks to your boots. A massive tree fills the whole clearing. Thick roots hold five woodcutters pinned against the trunk. The roots are slowly crushing them.

Their leader stands free. She chops a dull axe into the bark to free them. At the foot of the tree, an old man is bound to the bark with his own hair. Every time the axe lands, blood runs from his mouth.

The leader shouts that the tree’s core can pay the men’s debt. The old man spits blood and says the core will devour the town it is brought to.`,
    unik: true,
    erSubTrin: false,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Træd frem og kræv at lederen smider øksen.',
        tekstEn: 'Step forward and demand that the leader drops the axe.',
        udfaldListe: [
          { log: `Hun stopper slaget. Træet udnytter pausen til at stramme grebet om en arbejder. Hans kraveben brækker med et højt knæk.`, hpAendring: -5, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Hun svinger øksen mod dig i stedet for stammen. Du dukker dig, men skaftet rammer din skulder hårdt.`, hpAendring: -12, naesteTrin: 'blodskov_angrebet' },
          { log: `Din stemme får pladsen til at fryse. Både kvinden og den gamle mand kigger på dig, mens rødderne slapper en anelse af.`, maxHpAendring: 4, naesteTrin: 'blodskov_vaegtskaalen' }
        ]
      },
      {
        tekst: 'Træk dit våben og hjælp med at fælde træet.',
        tekstEn: 'Draw your weapon and help fell the tree.',
        kraeverEtAfItems: ['svaerd', 'sabel', 'oekse', 'kniv'],
        udfaldListe: [
          { log: `Barken flænges under jeres fælles angreb. Den gamle mand skriger, og jorden ryster voldsomt under jer.`, naesteTrin: 'blodskov_angrebet' },
          { log: `En gren pisker ned fra trækronen og slår dig til jorden. Du mister pusten totalt.`, hpAendring: -18, naesteTrin: 'blodskov_angrebet' },
          { log: `Du rammer et blødt punkt i stammen. En enorm mængde rød saft flyder ud og tvinger rødderne tilbage.`, guldAendring: 40, maxHpAendring: 5, naesteTrin: 'blodskov_saften' }
        ]
      },
      {
        tekst: 'Grav rødderne fri med skovlen.',
        tekstEn: 'Dig the roots free with the shovel.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Skovlen får fat under de øverste rødder. Du løsner dem nok til, at lederen sænker øksen og lytter.`, maxHpAendring: 4, naesteTrin: 'blodskov_roedderne' },
          { log: `Du rammer en blodfyldt rod. Saften sprøjter op, og træet svarer ved at slå hårdt ned omkring dig.`, hpAendring: -10, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Jorden åbner et lille hulrum ved stammen. Det er ikke kernen, men der ligger gamle mønter i det mørke.`, guldAendring: 60, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Sæt ild til grenene med din fakkel for at skabe panik.',
        tekstEn: 'Set fire to the branches with your torch to create panic.',
        kosterItem: 'fakkel',
        udfaldListe: [
          { log: `Ilden griber fat i den tørre bark. Træet trækker sine rødder til sig i forsvarsmekanisme, og skovhuggerne falder ned i mudderet.`, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Varmen brænder også dig. Du skaber afstanden, men flammerne fortærer din oppakning lidt.`, hpAendring: -10, naesteTrin: 'blodskov_roedderne' },
          { log: `Ilden afslører et mærkeligt hulrum oppe i stammen. Lederen stirrer grådigt på det.`, guldAendring: 60, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Giv den gamle mand din mad for at aflede hans magt.',
        tekstEn: 'Give the old man your food to distract his power.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: `Han tager imod brødet. Da han spiser, mister træet sit faste greb om mændene.`, maxHpAendring: 5, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Han ignorerer maden fuldstændig. En sulten arbejder kaster sig frem og sluger det foran ham. Det skaber kun mere kaos.`, hpAendring: -6, naesteTrin: 'blodskov_roedderne' },
          { log: `Brødet absorberer noget af den røde saft på jorden. Den gamle samler det op og gemmer det. Han skylder dig noget nu.`, guldAendring: 50, naesteTrin: 'blodskov_vaegtskaalen' }
        ]
      },
      {
        tekst: 'Som jæger læser du røddernes bevægelsesmønster før du reagerer.',
        tekstEn: 'As hunter, read the roots’ movement pattern before reacting.',
        kraeverKarakter: 'hunter_m',
        udfaldListe: [
          { log: `Du ser, at rødderne ikke angriber. De forsvarer stammens indre. Den gamle mand styrer dem med små ryk i fingrene.`, naesteTrin: 'blodskov_kernen' },
          { log: `Du står for længe og observerer. Mudderet giver efter under dig, og du glider ned i en pøl af saft.`, hpAendring: -8, naesteTrin: 'blodskov_saften' },
          { log: `Du finder den nøjagtige rytme i træets forsvar. Du kan træde helt hen til kernen uden at blive rørt.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Som jægerinde læser du røddernes bevægelsesmønster før du reagerer.',
        tekstEn: 'As huntress, read the roots’ movement pattern before reacting.',
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
    titelEn: 'The Scales',
    biome: ['blodskov'],
    tekst: `Lederen sænker sin økse. Hun tørrer sved af panden og peger anklagende på den gamle mand. Hun siger, at han er en kultist, der har fodret træet med byfolk i årevis.

Den gamle spytter igen. Han siger, at han er den eneste lås på et bur, der holder skoven fra at æde egnen.

De fastklemte skovhuggere stønner. Træet strammer langsomt grebet igen. Her er ingen tid til forhandlinger. Der skal handles.`,
    tekstEn: `The leader lowers her axe. She wipes sweat from her brow and points accusingly at the old man. She says he is a cultist who has fed the tree with townsfolk for years.

The old man spits again. He says he is the only lock on a cage that keeps the forest from eating the region.

The trapped woodcutters groan. The tree slowly tightens its grip again. There is no time for negotiations here. Something must be done.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Gå tæt på og tving manden til at slippe mændene.',
        tekstEn: 'Move close and force the man to release the workers.',
        udfaldListe: [
          { log: `Han nægter. Du vrider hans arm, og træet reagerer ved at kaste dig tilbage i mudderet.`, hpAendring: -15, naesteTrin: 'blodskov_roedderne' },
          { log: `Du presser en støvle mod hans hals. Rødderne løsner grebet øjeblikkeligt, og skovhuggerne falder fri.`, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Han ler af dig. Det giver lederen tid til at finde sin økse og rette den mod jer begge.`, hpAendring: -6, guldAendring: 30, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Betal lederen for at opgive træet og lade det være i fred.',
        tekstEn: 'Pay the leader to abandon the tree and leave it in peace.',
        puljeVaerdi: 150,
        udfaldListe: [
          { log: `Hun tager pengene. Det løser hendes gæld, men hendes mænd sidder stadig fast i rødderne. Problemet eksisterer stadig.`, maxHpAendring: -2, naesteTrin: 'blodskov_roedderne' },
          { log: `Mønterne overbeviser hende. Hun kalder sine folk tilbage, og manden stopper sit forsvar.`, hpAendring: 12, maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' },
          { log: `Hun gemmer pengene og hugger alligevel. Grådighed lader sig sjældent stoppe af en enkelt betaling.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Find jernkæden under mudderet med din metaldetektor.',
        tekstEn: 'Find the iron chain under the mud with your metal detector.',
        kraeverItem: 'metaldetektor',
        udfaldListe: [
          { log: `Maskinen hyler. Du finder kæden, der binder manden til træet, og knækker den. Han er nu fri til at slå fra sig.`, naesteTrin: 'blodskov_angrebet' },
          { log: `Kæden rummer et skjult rum med gamle mønter. Du tager dem, mens de andre skændes.`, guldAendring: 120, naesteTrin: 'blodskov_kernen' },
          { log: `Du rører en forkert del af kæden, og den brænder dig med mørk magi. Det koster på kræfterne.`, hpAendring: -14, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Grav rundt om mandens binding med skovlen.',
        tekstEn: 'Dig around the man’s binding with the shovel.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Du løsner jorden omkring håret og finder den knude, der holder manden fast. Rødderne slipper kort efter.`, maxHpAendring: 5, naesteTrin: 'blodskov_roedderne' },
          { log: `Skovlen rammer en skjult jernring under mudderet. Den er gammel, men stadig penge værd.`, guldAendring: 70, naesteTrin: 'blodskov_kernen' },
          { log: `Roden slår tilbage gennem skaftet. Smerten går op gennem armen, før du når væk.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Kast dit flotte tøj over mandens hoved for at blænde hans kontrol.',
        tekstEn: 'Throw your fine clothes over the man’s head to blind his control.',
        kosterItem: 'flot_toej',
        udfaldListe: [
          { log: `Stoffet blokerer hans udsyn. Rødderne mister retning og slipper mændene.`, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Han river tøjet i stykker med det samme. Træet strammer grebet af ren vrede.`, hpAendring: -8, naesteTrin: 'blodskov_angrebet' },
          { log: `Det skaber nok forvirring til, at du kan tømme de tasker, der ligger efterladt på jorden.`, guldAendring: 90, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som ridder tager du kontrollen over pladsen og beordrer våbenhvile.',
        tekstEn: 'As knight, take control of the clearing and order a ceasefire.',
        kraeverKarakter: 'knight_m',
        udfaldListe: [
          { log: `Din autoritet slår igennem. Lederen bakker, og manden slapper af. Du kan nu frit tilgå træets kerne.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Din befaling bliver mødt med en splintrende gren, der slår ind mod dit panser. Her gælder kun skovens lov.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' },
          { log: `Skovhuggerne adlyder dig og samler deres ting. De overlader kampen mod kultisten til dig.`, guldAendring: 60, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Som skjoldmø tager du kontrollen over pladsen og beordrer våbenhvile.',
        tekstEn: 'As shieldmaiden, take control of the clearing and order a ceasefire.',
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
    titelEn: 'Bark and Blood',
    biome: ['blodskov'],
    tekst: `Barken flænges. Træet kaster en byge af sylespidse splinter ud over rydningen. Den gamle mand brøler, mens rødderne begynder at trække to af mændene under jorden.

Gennem såret i stammen lyser træets indre svagt rødt. Lederen gør klar til at lade sine folk i stikken for at nå frem til kilden først.`,
    tekstEn: `The bark splits. The tree throws a shower of needle-sharp splinters across the clearing. The old man roars while the roots begin dragging two of the workers underground.

Through the wound in the trunk, the tree’s inside glows faintly red. The leader prepares to abandon her people to reach the source first.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Skub lederen i mudderet og tag hulrummet for dig selv.',
        tekstEn: 'Push the leader into the mud and claim the hollow for yourself.',
        udfaldListe: [
          { log: `Hun falder tungt. Du rækker ind i træet og får fingrene i noget massivt og glødende.`, naesteTrin: 'blodskov_kernen' },
          { log: `Hun trækker dig med ned i faldet. Rødderne pisker jer begge. Du betaler med smerte for dit grådighed.`, hpAendring: -18, naesteTrin: 'blodskov_kernen' },
          { log: `Du får et solidt forspring og samler løse ædelstene op fra jorden foran stammen.`, guldAendring: 110, maxHpAendring: 3, naesteTrin: 'blodskov_saften' }
        ]
      },
      {
        tekst: 'Prøv at hive folkene op fra hullerne.',
        tekstEn: 'Try to pull the workers up from the holes.',
        udfaldListe: [
          { log: `Du får fat i to af dem. De hoster jord op og takker dig med det guld, de har tilbage i lommerne.`, guldAendring: 140, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Rødderne er for stærke. De trækker dem under, mens tornene river huden af dine underarme.`, hpAendring: -22, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du redder den ene, mens den anden forsvinder. Det er en delvis sejr. Han lader sin dolk ligge til dig.`, givItem: 'kniv', maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Brug din rustning som et skjold mod træets splint-regn.',
        tekstEn: 'Use your armor as a shield against the tree’s splinter rain.',
        kosterItem: 'rustning',
        udfaldListe: [
          { log: `Panseret beskytter dig fuldstændigt mod angrebet. Du baner vej gennem kaosset og når stammen uskadet.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Træet smadrer metallet totalt, og et par splinter slipper igennem til dit lår.`, hpAendring: -12, naesteTrin: 'blodskov_saften' },
          { log: `Du absorberer stødet for alle. Lederen kvitterer ved at række dig sin stak af sammensparet bytte.`, guldAendring: 160, naesteTrin: 'blodskov_roedderne' }
        ]
      },
      {
        tekst: 'Som ork brøler du højt og slår stammen med dine bare næver.',
        tekstEn: 'As orc, roar loudly and strike the trunk with your bare fists.',
        kraeverKarakter: 'orc_m',
        udfaldListe: [
          { log: `Dit slag kaster en trykbølge gennem barken. Træet standser sit angreb af ren chok, og hulrummet åbnes yderligere.`, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Træet er hårdere end sten. Du brækker to knoer og falder baglæns med en smertefuld rysten i armen.`, hpAendring: -15, naesteTrin: 'blodskov_saften' },
          { log: `Slaget vælter døde grene ned. De indeholder intakte eliksirer fra tidligere rejsende, der mødte skoven.`, givItem: 'livseliksir', guldAendring: 50, naesteTrin: 'blodskov_roedderne' }
        ]
      },
      {
        tekst: 'Som klanleder brøler du højt og slår stammen med dine bare næver.',
        tekstEn: 'As clan leader, roar loudly and strike the trunk with your bare fists.',
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
    titelEn: 'The Earth’s Lock',
    biome: ['blodskov'],
    tekst: `Rødderne er seje som ståltråd. Mudderet stinker voldsomt af jern. En af mændene rækker dig en pung og beder dig tage pengene mod at lade ham ligge. Han har opgivet.

Den gamle mand styrer tydeligvis røddernes greb. Han lader skovhuggerne lide med fuldt overlæg. Lader du rødderne æde dem, tager skoven dem permanent.`,
    tekstEn: `The roots are tough as wire. The mud reeks violently of iron. One of the men reaches you a purse and asks you to take the money in exchange for leaving him there. He has given up.

The old man is clearly controlling the roots’ grip. He is letting the woodcutters suffer deliberately. If you let the roots eat them, the forest takes them permanently.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Skær mændene fri én efter én med dit blad.',
        tekstEn: 'Cut the men free one by one with your blade.',
        kraeverItem: 'kniv',
        udfaldListe: [
          { log: `Kniven arbejder hurtigt og præcist. Du løsner båndene og sikrer dig arbejdernes guld som tak.`, guldAendring: 180, maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Klingen smutter på den hårde bark og skærer dybt i din håndflade. De kommer fri, men det kostede.`, hpAendring: -12, guldAendring: 100, naesteTrin: 'blodskov_efterspillet' },
          { log: `Træet afgiver en sort gas fra snittene. Du hoster og mister pusten, mens de stikker af.`, hpAendring: -16, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Grav de fastklemte fri med skovlen.',
        tekstEn: 'Dig the trapped men free with the shovel.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Du skærer ikke rødderne over, men fjerner jorden omkring dem. Det tager tid, men mændene kommer fri.`, guldAendring: 90, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du graver for tæt på en levende rod. Den slår op gennem mudderet og rammer dig hårdt i siden.`, hpAendring: -12, naesteTrin: 'blodskov_saften' },
          { log: `Skovlen rammer et gammelt skjul under en rod. Der ligger mad og mønter fra folk, der ikke slap ud.`, givItem: 'mad', guldAendring: 70, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Træk dem op med ren håndkraft.',
        tekstEn: 'Pull them up with raw strength.',
        udfaldListe: [
          { log: `Det kræver al din styrke. Din ryg brokker sig voldsomt, og det trækker hårde smerter gennem lænden.`, hpAendring: -20, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du hiver dem op som radiser. Din styrke redder dagen uden omkostninger.`, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du mister grebet om den sidste. Han overlever ikke. Du samler hans taske op i stedet.`, guldAendring: 130, hpAendring: -8, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Sænk din eliksir ned til manden, så han kan tåle trykket.',
        tekstEn: 'Lower your elixir to the man so he can withstand the pressure.',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: `Væsken giver ham styrke til selv at brække rødderne op. Han rækker dig en diamant, han fandt dernede.`, givItem: 'diamant', maxHpAendring: 8, naesteTrin: 'blodskov_efterspillet' },
          { log: `Han spilder det meste. Det redder hans liv, men skaber ingen rigdom til dig.`, maxHpAendring: 3, naesteTrin: 'blodskov_efterspillet' },
          { log: `Trædrikken absorberes delvist af jorden. Skoven trækker sig roligt tilbage mæt af energi.`, hpAendring: 10, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Mærk med kvisten efter det sted, hvor jorden er svagest.',
        tekstEn: 'Use the twig to feel where the ground is weakest.',
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
    titelEn: 'The Red Gold',
    biome: ['blodskov'],
    tekst: `Den røde saft strømmer nu frit fra sårene i stammen. Den er varm og lugter kraftigt af jern. Du kan høre svage stød inde fra træet.

Lederen stikker hurtigt en læderflaske ind for at fange dråberne. Hun siger, det kan hele al sygdom. Den gamle mand advarer om, at dråberne vil forandre hendes blod permanent.`,
    tekstEn: `The red sap now streams freely from the wounds in the trunk. It is warm and smells sharply of iron. You can hear faint pulses from inside the tree.

The leader quickly thrusts in a leather bottle to catch the drops. She says it can heal all sickness. The old man warns that the drops will change her blood permanently.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Saml saften op med dit eget tøj.',
        tekstEn: 'Collect the sap with your own clothes.',
        kosterItem: 'klude',
        udfaldListe: [
          { log: `Tøjet fungerer som en svamp. Du vrider det ned i din egen taske og får et massivt energiboost af dampen alene.`, hpAendring: 25, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Syren i saften ætser stoffet på sekunder. Du når lige akkurat at undgå brændsår på fingrene.`, hpAendring: -5, naesteTrin: 'blodskov_kernen' },
          { log: `Det drypper på mønterne i lommen, som tager en underlig rød glans og stiger i værdi for samlere.`, guldAendring: 120, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Slå flasken ud af hånden på hende.',
        tekstEn: 'Knock the bottle from her hand.',
        udfaldListe: [
          { log: `Flasken splintres. Den røde saft trænger ned i jorden. Lederen trækker sin kniv mod dig.`, hpAendring: -14, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du vipper den væk. Det forhindrer hende i at drikke giften. Hun takker dig stumt og afleverer sit udstyr.`, givItem: 'sabel', maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Lederen dykker efter den i mudderet. I forvirringen napper du hendes tunge pengepung uforstyrret.`, guldAendring: 150, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som pirat stjæler du flasken i farten for dig selv.',
        tekstEn: 'As pirate, steal the bottle for yourself in the rush.',
        kraeverKarakter: 'pirate_m',
        udfaldListe: [
          { log: `Dine hænder er hurtigere end hendes øjne. Du erstatter flasken med mudder og drikker styrken i dig selv.`, hpAendring: 30, maxHpAendring: 12, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du hugger den, men saften koger op i maven på dig og forvolder en voldsom krampe.`, hpAendring: -18, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du fanger flasken og tvinger hende til at betale en enorm løsesum for at få den tilbage.`, guldAendring: 250, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som korsar stjæler du flasken i farten for dig selv.',
        tekstEn: 'As corsair, steal the bottle for yourself in the rush.',
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
    titelEn: 'The Tree’s Heart',
    biome: ['blodskov'],
    tekst: `Træets midte er nu fuldstændig blottet. Her sidder en kæmpemæssig, rødlig krystal. Den udstråler en kvælende hede og pumper i et langsomt tempo.

Den gamle mands øjne er rullet tilbage i hovedet, og han forsøger at dække krystallen med sine sidste tynde rødder. Lederen hæver sin kniv. Hun vil skære stenen ud, selv hvis det koster hendes egne folks liv under rødderne.`,
    tekstEn: `The tree’s center is now completely exposed. Here sits an enormous reddish crystal. It radiates choking heat and pulses at a slow rhythm.

The old man’s eyes have rolled back in his head, and he tries to cover the crystal with his last thin roots. The leader raises her knife. She will cut out the stone even if it costs her own people’s lives under the roots.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Flæk krystallen med et tungt slag fra dit sværd.',
        tekstEn: 'Split the crystal with a heavy blow from your sword.',
        kraeverItem: 'svaerd',
        udfaldListe: [
          { log: `Sværdet rammer plet. Krystallen sprænges i tusind stykker, og træet dør øjeblikkeligt. Du samler splinterne op.`, givItem: 'diamant', guldAendring: 120, naesteTrin: 'blodskov_efterspillet' },
          { log: `Trykbølgen fra slaget smadrer klingen og sender dig flyvende ind i en stamme. Våbnet er tabt, men skoven giver op.`, hpAendring: -20, maxHpAendring: -2, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du knuser hjertet. Magien fordamper, og den gamle mand falder om. Du tager pengene fra hans gemmer under rødderne.`, guldAendring: 220, maxHpAendring: 8, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Skyd krystallen ud af stammen med en pil fra afstand.',
        tekstEn: 'Shoot the crystal out of the trunk with an arrow from a distance.',
        kraeverItem: 'bue',
        udfaldListe: [
          { log: `Pilen borer sig ind bag stenen og vipper den ud. Krystallen dæmper sin varme og lader sig let indsamle.`, givItem: 'diamant', maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du rammer forbi stenen og punkterer en saftkirtel. Dampen svider din næse og øjne alvorligt.`, hpAendring: -15, naesteTrin: 'blodskov_efterspillet' },
          { log: `Skuddet skærer stenen i to. Lederen griber den ene, du tager den anden. Det er en handel formet af vold.`, givItem: 'diamant', guldAendring: 90, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Smid en diamant til rødderne for at bytte med træets kerne.',
        tekstEn: 'Throw a diamond to the roots to bargain for the tree’s core.',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: `Træet accepterer din byttehandel. Krystallen triller ud, og skoven roer sig ned med din diamant som erstatning.`, givItem: 'livseliksir', guldAendring: 300, naesteTrin: 'blodskov_efterspillet' },
          { log: `Træet æder diamanten og spytter syre ud i hovedet på dig. Magien vil ikke købes i dag.`, hpAendring: -25, naesteTrin: 'blodskov_efterspillet' },
          { log: `Manden sluger diamanten. Han løsner sit eget greb og trækker vejret tungt, mens træet frigiver en stak skjold og våben.`, givItem: 'rustning', guldAendring: 150, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Kræv stenen udleveret mod at dele overskuddet med lederen.',
        tekstEn: 'Demand the stone in exchange for sharing the profit with the leader.',
        udfaldListe: [
          { log: `Hun accepterer. I vrikker stenen løs sammen og deler puljen op på stående fod.`, givItem: 'diamant', hpAendring: -5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Hun snyder dig og stikker af med stenen, mens træet pisker dig over ansigtet med en gren.`, hpAendring: -16, naesteTrin: 'blodskov_efterspillet' },
          { log: `Forhandlingen tager for lang tid. Krystallen smelter væk, men lader mønter fra de tidligere ofre ligge frit fremme.`, guldAendring: 250, maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som troldmand afbryder du forbindelsen mellem sten og træ.',
        tekstEn: 'As wizard, sever the connection between stone and tree.',
        kraeverKarakter: 'magician_m',
        udfaldListe: [
          { log: `Du udsender en modpuls. Krystallen afbrydes fra træet, og magien fader blødt ud uden fare. Stenen er din.`, givItem: 'diamant', maxHpAendring: 10, naesteTrin: 'blodskov_efterspillet' },
          { log: `Magien er stærkere end forventet. Du får et alvorligt tilbagekast, der dræner dit indre, før stenen overgiver sig.`, hpAendring: -20, givItem: 'diamant', naesteTrin: 'blodskov_efterspillet' },
          { log: `Du slukker træet fuldstændig. Den gamle mand takker dig med dybe buk og lader sit lager af udstyr stå åbent.`, givItem: 'metaldetektor', guldAendring: 180, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Som troldkvinde afbryder du forbindelsen mellem sten og træ.',
        tekstEn: 'As sorceress, sever the connection between stone and tree.',
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
    titelEn: 'Silence over the Sap',
    biome: ['blodskov'],
    tekst: `Rydningen bliver mærkeligt stille. Rødderne trækker sig ikke længere. Skovhuggerne forsøger at samle sig og binde deres sår ind.

Træet er blot en stor, udhulet plante nu. Omkring dig flyder det med efterladenskaber. Det er tid til at vurdere prisen på din indgriben, pakke rygsækken og komme videre inden tågen opsluger pladsen.`,
    tekstEn: `The clearing grows strangely quiet. The roots no longer pull. The woodcutters try to gather themselves and bind their wounds.

The tree is only a large hollowed plant now. Around you lie scattered remains. It is time to judge the price of your intervention, pack your backpack and move on before the fog swallows the place.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Forlad pladsen hurtigst muligt.',
        tekstEn: 'Leave the place as quickly as possible.',
        udfaldListe: [
          { log: `Du trækker dig tilbage og overlader rydningen til sig selv. Skoven har ikke mere at fortælle dig i dag.`, maxHpAendring: 5 },
          { log: `Du træder over en skjult rod på vej væk og får et slemt træk i anklen, men overlever sagen.`, hpAendring: -8, maxHpAendring: 3 },
          { log: `Du lister afsted og opdager en efterladt skovl ved kanten af lysningen. Skoven sørger altid for noget.`, givItem: 'skovl', maxHpAendring: 4 }
        ]
      },
      {
        tekst: 'Kræv kontant betaling af de overlevende for din indsats.',
        tekstEn: 'Demand cash payment from the survivors for your effort.',
        udfaldListe: [
          { log: `De har ingen energi til at diskutere. De kaster deres møntposer over til dig med vrede blikke.`, guldAendring: 240, maxHpAendring: -2 },
          { log: `Lederen forsvarer sit guld til det sidste og skærer dig en overfladisk flænge med kniven, inden hun betaler.`, hpAendring: -12, guldAendring: 180 },
          { log: `De betaler uden et ord. Mønterne klirrer koldt i lommen. Du har overlevet. De har overlevet. Intet mere.`, guldAendring: 210 }
        ]
      },
      {
        tekst: 'Tilbyd at eskortere dem ud til grænsen af skoven.',
        tekstEn: 'Offer to escort them to the edge of the forest.',
        udfaldListe: [
          { log: `Turen ud er rolig. Det giver dig anledning til at rense tankerne og helbrede kroppen let. De takker med lidt mønter.`, hpAendring: 15, guldAendring: 80 },
          { log: `En sidste gren falder uventet og slår dig over hovedet på vejen. Du hjælper dem, men betaler prisen.`, hpAendring: -14, maxHpAendring: 5 },
          { log: `Du guider dem ud sikkert. En arbejder presser en lille ædelsten i din hånd som tak for livet.`, givItem: 'diamant', maxHpAendring: 8 }
        ]
      },
      {
        tekst: 'Som hertug beslaglægger du alle værdier fra pladsen i statens navn.',
        tekstEn: 'As duke, seize all valuables from the place in the name of the state.',
        kraeverKarakter: 'royal_m',
        udfaldListe: [
          { log: `Din autoritet tillader ingen modsigelse. Du rydder lysningen for alt af værdi. Det er beskidt arbejde, men yderst rentabelt.`, guldAendring: 320, maxHpAendring: 5 },
          { log: `En skovhugger yder desperat modstand. Det koster dig nogle skrammer at overbevise ham om dit ejerskab.`, hpAendring: -15, guldAendring: 280 },
          { log: `Den gamle mand nikker og accepterer din lov. Du modtager både mønter og et efterladt våben fra jorden.`, givItem: 'sabel', guldAendring: 200 }
        ]
      },
      {
        tekst: 'Som hertuginde beslaglægger du alle værdier fra pladsen i statens navn.',
        tekstEn: 'As duchess, seize all valuables from the place in the name of the state.',
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

const blodskovLogEn: Record<string, string> = {
  [`Hun stopper slaget. Træet udnytter pausen til at stramme grebet om en arbejder. Hans kraveben brækker med et højt knæk.`]: `She stops the blow. The tree uses the pause to tighten its grip around a worker. His collarbone breaks with a loud crack.`,
  [`Hun svinger øksen mod dig i stedet for stammen. Du dukker dig, men skaftet rammer din skulder hårdt.`]: `She swings the axe at you instead of the trunk. You duck, but the haft hits your shoulder hard.`,
  [`Din stemme får pladsen til at fryse. Både kvinden og den gamle mand kigger på dig, mens rødderne slapper en anelse af.`]: `Your voice freezes the clearing. Both the woman and the old man look at you while the roots loosen slightly.`,
  [`Barken flænges under jeres fælles angreb. Den gamle mand skriger, og jorden ryster voldsomt under jer.`]: `The bark splits under your joint attack. The old man screams, and the ground shakes violently beneath you.`,
  [`En gren pisker ned fra trækronen og slår dig til jorden. Du mister pusten totalt.`]: `A branch lashes down from the crown and knocks you to the ground. The air is driven completely out of you.`,
  [`Du rammer et blødt punkt i stammen. En enorm mængde rød saft flyder ud og tvinger rødderne tilbage.`]: `You strike a soft spot in the trunk. A huge rush of red sap flows out and forces the roots back.`,
  [`Skovlen får fat under de øverste rødder. Du løsner dem nok til, at lederen sænker øksen og lytter.`]: `The shovel catches beneath the upper roots. You loosen them enough that the leader lowers her axe and listens.`,
  [`Du rammer en blodfyldt rod. Saften sprøjter op, og træet svarer ved at slå hårdt ned omkring dig.`]: `You hit a blood-filled root. Sap sprays up, and the tree answers by striking hard around you.`,
  [`Jorden åbner et lille hulrum ved stammen. Det er ikke kernen, men der ligger gamle mønter i det mørke.`]: `The ground opens a small hollow by the trunk. It is not the core, but old coins lie in the darkness.`,
  [`Ilden griber fat i den tørre bark. Træet trækker sine rødder til sig i forsvarsmekanisme, og skovhuggerne falder ned i mudderet.`]: `The fire catches in the dry bark. The tree pulls its roots inward in defense, and the woodcutters drop into the mud.`,
  [`Varmen brænder også dig. Du skaber afstanden, men flammerne fortærer din oppakning lidt.`]: `The heat burns you too. You create space, but the flames eat at your pack a little.`,
  [`Ilden afslører et mærkeligt hulrum oppe i stammen. Lederen stirrer grådigt på det.`]: `The fire reveals a strange hollow high in the trunk. The leader stares at it greedily.`,
  [`Han tager imod brødet. Da han spiser, mister træet sit faste greb om mændene.`]: `He accepts the bread. When he eats, the tree loses its firm grip on the men.`,
  [`Han ignorerer maden fuldstændig. En sulten arbejder kaster sig frem og sluger det foran ham. Det skaber kun mere kaos.`]: `He ignores the food completely. A hungry worker lunges forward and swallows it in front of him. It only creates more chaos.`,
  [`Brødet absorberer noget af den røde saft på jorden. Den gamle samler det op og gemmer det. Han skylder dig noget nu.`]: `The bread absorbs some of the red sap on the ground. The old man picks it up and hides it. He owes you something now.`,
  [`Du ser, at rødderne ikke angriber. De forsvarer stammens indre. Den gamle mand styrer dem med små ryk i fingrene.`]: `You see that the roots are not attacking. They are defending the trunk's interior. The old man controls them with tiny jerks of his fingers.`,
  [`Du står for længe og observerer. Mudderet giver efter under dig, og du glider ned i en pøl af saft.`]: `You stand and observe too long. The mud gives way beneath you, and you slide into a pool of sap.`,
  [`Du finder den nøjagtige rytme i træets forsvar. Du kan træde helt hen til kernen uden at blive rørt.`]: `You find the exact rhythm of the tree's defense. You can step all the way to the core without being touched.`,
  [`Han nægter. Du vrider hans arm, og træet reagerer ved at kaste dig tilbage i mudderet.`]: `He refuses. You twist his arm, and the tree responds by throwing you back into the mud.`,
  [`Du presser en støvle mod hans hals. Rødderne løsner grebet øjeblikkeligt, og skovhuggerne falder fri.`]: `You press a boot against his throat. The roots release their grip instantly, and the woodcutters fall free.`,
  [`Han ler af dig. Det giver lederen tid til at finde sin økse og rette den mod jer begge.`]: `He laughs at you. It gives the leader time to find her axe and point it at both of you.`,
  [`Hun tager pengene. Det løser hendes gæld, men hendes mænd sidder stadig fast i rødderne. Problemet eksisterer stadig.`]: `She takes the money. It solves her debt, but her men are still trapped in the roots. The problem still exists.`,
  [`Mønterne overbeviser hende. Hun kalder sine folk tilbage, og manden stopper sit forsvar.`]: `The coins convince her. She calls her people back, and the man stops his defense.`,
  [`Hun gemmer pengene og hugger alligevel. Grådighed lader sig sjældent stoppe af en enkelt betaling.`]: `She pockets the money and chops anyway. Greed is rarely stopped by a single payment.`,
  [`Maskinen hyler. Du finder kæden, der binder manden til træet, og knækker den. Han er nu fri til at slå fra sig.`]: `The machine howls. You find the chain binding the man to the tree and break it. He is now free to strike back.`,
  [`Kæden rummer et skjult rum med gamle mønter. Du tager dem, mens de andre skændes.`]: `The chain contains a hidden compartment with old coins. You take them while the others argue.`,
  [`Du rører en forkert del af kæden, og den brænder dig med mørk magi. Det koster på kræfterne.`]: `You touch the wrong part of the chain, and it burns you with dark magic. It costs you strength.`,
  [`Du løsner jorden omkring håret og finder den knude, der holder manden fast. Rødderne slipper kort efter.`]: `You loosen the soil around the hair and find the knot holding the man in place. The roots let go shortly after.`,
  [`Skovlen rammer en skjult jernring under mudderet. Den er gammel, men stadig penge værd.`]: `The shovel hits a hidden iron ring beneath the mud. It is old, but still worth money.`,
  [`Roden slår tilbage gennem skaftet. Smerten går op gennem armen, før du når væk.`]: `The root strikes back through the shaft. Pain runs up your arm before you can get away.`,
  [`Stoffet blokerer hans udsyn. Rødderne mister retning og slipper mændene.`]: `The cloth blocks his sight. The roots lose direction and release the men.`,
  [`Han river tøjet i stykker med det samme. Træet strammer grebet af ren vrede.`]: `He tears the clothes apart immediately. The tree tightens its grip out of pure anger.`,
  [`Det skaber nok forvirring til, at du kan tømme de tasker, der ligger efterladt på jorden.`]: `It creates enough confusion for you to empty the bags abandoned on the ground.`,
  [`Din autoritet slår igennem. Lederen bakker, og manden slapper af. Du kan nu frit tilgå træets kerne.`]: `Your authority breaks through. The leader backs down, and the man relaxes. You can now approach the tree's core freely.`,
  [`Din befaling bliver mødt med en splintrende gren, der slår ind mod dit panser. Her gælder kun skovens lov.`]: `Your order is met by a splintering branch that smashes into your armor. Only the forest's law applies here.`,
  [`Skovhuggerne adlyder dig og samler deres ting. De overlader kampen mod kultisten til dig.`]: `The woodcutters obey you and gather their things. They leave the fight against the cultist to you.`,
  [`Hun falder tungt. Du rækker ind i træet og får fingrene i noget massivt og glødende.`]: `She falls heavily. You reach into the tree and get your fingers around something solid and glowing.`,
  [`Hun trækker dig med ned i faldet. Rødderne pisker jer begge. Du betaler med smerte for dit grådighed.`]: `She drags you down with her. The roots whip you both. You pay for your greed in pain.`,
  [`Du får et solidt forspring og samler løse ædelstene op fra jorden foran stammen.`]: `You gain a solid lead and scoop up loose gemstones from the ground in front of the trunk.`,
  [`Du får fat i to af dem. De hoster jord op og takker dig med det guld, de har tilbage i lommerne.`]: `You get hold of two of them. They cough up dirt and thank you with the gold left in their pockets.`,
  [`Rødderne er for stærke. De trækker dem under, mens tornene river huden af dine underarme.`]: `The roots are too strong. They pull them under while thorns tear the skin from your forearms.`,
  [`Du redder den ene, mens den anden forsvinder. Det er en delvis sejr. Han lader sin dolk ligge til dig.`]: `You save one while the other disappears. It is a partial victory. He leaves his dagger behind for you.`,
  [`Panseret beskytter dig fuldstændigt mod angrebet. Du baner vej gennem kaosset og når stammen uskadet.`]: `The armor protects you completely from the attack. You force a path through the chaos and reach the trunk unharmed.`,
  [`Træet smadrer metallet totalt, og et par splinter slipper igennem til dit lår.`]: `The tree smashes the metal completely, and a few splinters get through to your thigh.`,
  [`Du absorberer stødet for alle. Lederen kvitterer ved at række dig sin stak af sammensparet bytte.`]: `You absorb the impact for everyone. The leader repays you by handing over her stack of saved-up loot.`,
  [`Dit slag kaster en trykbølge gennem barken. Træet standser sit angreb af ren chok, og hulrummet åbnes yderligere.`]: `Your blow throws a pressure wave through the bark. The tree stops its attack from sheer shock, and the hollow opens wider.`,
  [`Træet er hårdere end sten. Du brækker to knoer og falder baglæns med en smertefuld rysten i armen.`]: `The tree is harder than stone. You break two knuckles and fall backward with a painful tremor in your arm.`,
  [`Slaget vælter døde grene ned. De indeholder intakte eliksirer fra tidligere rejsende, der mødte skoven.`]: `The blow knocks dead branches down. They contain intact elixirs from earlier travelers who met the forest.`,
  [`Kniven arbejder hurtigt og præcist. Du løsner båndene og sikrer dig arbejdernes guld som tak.`]: `The knife works quickly and precisely. You loosen the bonds and secure the workers' gold as thanks.`,
  [`Klingen smutter på den hårde bark og skærer dybt i din håndflade. De kommer fri, men det kostede.`]: `The blade slips on the hard bark and cuts deep into your palm. They get free, but it cost you.`,
  [`Træet afgiver en sort gas fra snittene. Du hoster og mister pusten, mens de stikker af.`]: `The tree releases black gas from the cuts. You cough and lose your breath while they run away.`,
  [`Du skærer ikke rødderne over, men fjerner jorden omkring dem. Det tager tid, men mændene kommer fri.`]: `You do not cut the roots, but remove the soil around them. It takes time, but the men get free.`,
  [`Du graver for tæt på en levende rod. Den slår op gennem mudderet og rammer dig hårdt i siden.`]: `You dig too close to a living root. It strikes up through the mud and hits you hard in the side.`,
  [`Skovlen rammer et gammelt skjul under en rod. Der ligger mad og mønter fra folk, der ikke slap ud.`]: `The shovel hits an old cache beneath a root. Food and coins from people who never escaped are inside.`,
  [`Det kræver al din styrke. Din ryg brokker sig voldsomt, og det trækker hårde smerter gennem lænden.`]: `It takes all your strength. Your back protests violently, sending hard pain through your lower spine.`,
  [`Du hiver dem op som radiser. Din styrke redder dagen uden omkostninger.`]: `You pull them up like radishes. Your strength saves the day without cost.`,
  [`Du mister grebet om den sidste. Han overlever ikke. Du samler hans taske op i stedet.`]: `You lose your grip on the last one. He does not survive. You pick up his bag instead.`,
  [`Væsken giver ham styrke til selv at brække rødderne op. Han rækker dig en diamant, han fandt dernede.`]: `The liquid gives him the strength to break the roots himself. He hands you a diamond he found down there.`,
  [`Han spilder det meste. Det redder hans liv, men skaber ingen rigdom til dig.`]: `He spills most of it. It saves his life, but creates no wealth for you.`,
  [`Trædrikken absorberes delvist af jorden. Skoven trækker sig roligt tilbage mæt af energi.`]: `The tree-drink is partly absorbed by the soil. The forest calmly withdraws, full of energy.`,
  [`Kvisten peger direkte på en hul rod. Du træder på den, og alle fangere slipper øjeblikkeligt deres bytte.`]: `The twig points straight at a hollow root. You step on it, and every captor instantly releases its prey.`,
  [`Den viser dig en vej uden om mændene, direkte til en skjult bunke valuta.`]: `It shows you a way around the men, straight to a hidden pile of valuables.`,
  [`Kvisten forvirres af træets magi og vildleder dig ud i en tornebusk.`]: `The twig is confused by the tree's magic and misleads you into a thornbush.`,
  [`Tøjet fungerer som en svamp. Du vrider det ned i din egen taske og får et massivt energiboost af dampen alene.`]: `The cloth works like a sponge. You wring it into your own bag and get a massive boost from the vapor alone.`,
  [`Syren i saften ætser stoffet på sekunder. Du når lige akkurat at undgå brændsår på fingrene.`]: `The acid in the sap eats through the fabric in seconds. You barely avoid burns on your fingers.`,
  [`Det drypper på mønterne i lommen, som tager en underlig rød glans og stiger i værdi for samlere.`]: `It drips onto the coins in your pocket, giving them a strange red sheen and making them more valuable to collectors.`,
  [`Flasken splintres. Den røde saft trænger ned i jorden. Lederen trækker sin kniv mod dig.`]: `The bottle shatters. The red sap seeps into the ground. The leader draws her knife against you.`,
  [`Du vipper den væk. Det forhindrer hende i at drikke giften. Hun takker dig stumt og afleverer sit udstyr.`]: `You knock it away. It keeps her from drinking the poison. She thanks you silently and hands over her gear.`,
  [`Lederen dykker efter den i mudderet. I forvirringen napper du hendes tunge pengepung uforstyrret.`]: `The leader dives after it in the mud. In the confusion, you quietly snatch her heavy purse.`,
  [`Dine hænder er hurtigere end hendes øjne. Du erstatter flasken med mudder og drikker styrken i dig selv.`]: `Your hands are faster than her eyes. You replace the bottle with mud and drink the strength into yourself.`,
  [`Du hugger den, men saften koger op i maven på dig og forvolder en voldsom krampe.`]: `You snatch it, but the sap boils up in your stomach and causes a violent cramp.`,
  [`Du fanger flasken og tvinger hende til at betale en enorm løsesum for at få den tilbage.`]: `You catch the bottle and force her to pay an enormous ransom to get it back.`,
  [`Sværdet rammer plet. Krystallen sprænges i tusind stykker, og træet dør øjeblikkeligt. Du samler splinterne op.`]: `The sword strikes true. The crystal bursts into a thousand pieces, and the tree dies instantly. You gather the shards.`,
  [`Trykbølgen fra slaget smadrer klingen og sender dig flyvende ind i en stamme. Våbnet er tabt, men skoven giver op.`]: `The shock wave from the blow shatters the blade and sends you flying into a trunk. The weapon is lost, but the forest gives up.`,
  [`Du knuser hjertet. Magien fordamper, og den gamle mand falder om. Du tager pengene fra hans gemmer under rødderne.`]: `You crush the heart. The magic evaporates, and the old man collapses. You take the money from his stores beneath the roots.`,
  [`Pilen borer sig ind bag stenen og vipper den ud. Krystallen dæmper sin varme og lader sig let indsamle.`]: `The arrow drives in behind the stone and levers it out. The crystal dampens its heat and lets itself be collected easily.`,
  [`Du rammer forbi stenen og punkterer en saftkirtel. Dampen svider din næse og øjne alvorligt.`]: `You miss the stone and puncture a sap gland. The vapor badly stings your nose and eyes.`,
  [`Skuddet skærer stenen i to. Lederen griber den ene, du tager den anden. Det er en handel formet af vold.`]: `The shot cuts the stone in two. The leader grabs one half, and you take the other. It is a trade shaped by violence.`,
  [`Træet accepterer din byttehandel. Krystallen triller ud, og skoven roer sig ned med din diamant som erstatning.`]: `The tree accepts your bargain. The crystal rolls out, and the forest calms with your diamond as replacement.`,
  [`Træet æder diamanten og spytter syre ud i hovedet på dig. Magien vil ikke købes i dag.`]: `The tree eats the diamond and spits acid into your face. The magic will not be bought today.`,
  [`Manden sluger diamanten. Han løsner sit eget greb og trækker vejret tungt, mens træet frigiver en stak skjold og våben.`]: `The man swallows the diamond. He loosens his own grip and breathes heavily while the tree releases a stack of shields and weapons.`,
  [`Hun accepterer. I vrikker stenen løs sammen og deler puljen op på stående fod.`]: `She accepts. Together you work the stone loose and split the take on the spot.`,
  [`Hun snyder dig og stikker af med stenen, mens træet pisker dig over ansigtet med en gren.`]: `She cheats you and runs off with the stone while the tree lashes your face with a branch.`,
  [`Forhandlingen tager for lang tid. Krystallen smelter væk, men lader mønter fra de tidligere ofre ligge frit fremme.`]: `The negotiation takes too long. The crystal melts away, but leaves coins from earlier victims lying in the open.`,
  [`Du udsender en modpuls. Krystallen afbrydes fra træet, og magien fader blødt ud uden fare. Stenen er din.`]: `You send out a counter-pulse. The crystal is severed from the tree, and the magic fades softly without danger. The stone is yours.`,
  [`Magien er stærkere end forventet. Du får et alvorligt tilbagekast, der dræner dit indre, før stenen overgiver sig.`]: `The magic is stronger than expected. You suffer a serious backlash that drains your insides before the stone yields.`,
  [`Du slukker træet fuldstændig. Den gamle mand takker dig med dybe buk og lader sit lager af udstyr stå åbent.`]: `You extinguish the tree completely. The old man thanks you with deep bows and leaves his equipment store open.`,
  [`Du trækker dig tilbage og overlader rydningen til sig selv. Skoven har ikke mere at fortælle dig i dag.`]: `You withdraw and leave the clearing to itself. The forest has nothing more to tell you today.`,
  [`Du træder over en skjult rod på vej væk og får et slemt træk i anklen, men overlever sagen.`]: `You step over a hidden root on the way out and twist your ankle badly, but you survive the matter.`,
  [`Du lister afsted og opdager en efterladt skovl ved kanten af lysningen. Skoven sørger altid for noget.`]: `You slip away and discover an abandoned shovel at the edge of the clearing. The forest always provides something.`,
  [`De har ingen energi til at diskutere. De kaster deres møntposer over til dig med vrede blikke.`]: `They have no energy to argue. They throw their coin pouches to you with angry looks.`,
  [`Lederen forsvarer sit guld til det sidste og skærer dig en overfladisk flænge med kniven, inden hun betaler.`]: `The leader defends her gold to the end and cuts you shallowly with the knife before paying.`,
  [`De betaler uden et ord. Mønterne klirrer koldt i lommen. Du har overlevet. De har overlevet. Intet mere.`]: `They pay without a word. The coins clink coldly in your pocket. You survived. They survived. Nothing more.`,
  [`Turen ud er rolig. Det giver dig anledning til at rense tankerne og helbrede kroppen let. De takker med lidt mønter.`]: `The walk out is calm. It gives you a chance to clear your thoughts and heal your body a little. They thank you with a few coins.`,
  [`En sidste gren falder uventet og slår dig over hovedet på vejen. Du hjælper dem, men betaler prisen.`]: `One last branch falls unexpectedly and hits you on the head on the way. You help them, but pay the price.`,
  [`Du guider dem ud sikkert. En arbejder presser en lille ædelsten i din hånd som tak for livet.`]: `You guide them out safely. A worker presses a small gemstone into your hand as thanks for his life.`,
  [`Din autoritet tillader ingen modsigelse. Du rydder lysningen for alt af værdi. Det er beskidt arbejde, men yderst rentabelt.`]: `Your authority allows no objection. You clear the clearing of everything valuable. It is dirty work, but extremely profitable.`,
  [`En skovhugger yder desperat modstand. Det koster dig nogle skrammer at overbevise ham om dit ejerskab.`]: `A woodcutter resists desperately. It costs you a few scrapes to convince him of your ownership.`,
  [`Den gamle mand nikker og accepterer din lov. Du modtager både mønter og et efterladt våben fra jorden.`]: `The old man nods and accepts your law. You receive both coins and an abandoned weapon from the ground.`
};

for (const event of Object.values(blodskovensHjerteEvents)) {
  for (const valg of event.valg) {
    for (const udfald of valg.udfaldListe || []) {
      udfald.logEn ||= blodskovLogEn[udfald.log];
    }
  }
}
