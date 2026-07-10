import type { SpilEvent } from './eventBibliotek';

export const blodskovensHjerteEvents: Record<string, SpilEvent> = {
  blodskovens_hjerte: {
    id: 'blodskovens_hjerte',
    titel: 'Det blødende træ',
    titelEn: 'The Bleeding Tree',
    biome: ['blodskov'],
    tekst: `Rød saft klistrer til dine støvler. Midt i lysningen står et massivt træ. Dets tykke rødder holder fem skovhuggere presset mod stammen og strammer langsomt grebet.

Deres leder er stadig fri. Hun prøver at hugge dem løs med en sløv økse. Ved træets fod sidder en gammel mand bundet til barken med sit eget hår. Hver gang øksen rammer, løber der blod fra hans mund.

Lederen råber, at træets kerne kan betale hele gruppens gæld. Den gamle mand spytter blod og advarer: Tager de kernen med hjem, vil den æde byen indefra.`,
    tekstEn: `Red sap sticks to your boots. A massive tree fills the whole clearing. Thick roots hold five woodcutters pinned against the trunk. The roots are slowly crushing them.

Their leader stands free. She chops a dull axe into the bark to free them. At the foot of the tree, an old man is bound to the bark with his own hair. Every time the axe lands, blood runs from his mouth.

The leader shouts that the tree’s core can pay the group’s debt. The old man spits blood and warns that the core will devour any town it is brought to.`,
    unik: true,
    erSubTrin: false,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Træd frem, og få lederen til at sænke øksen.',
        tekstEn: 'Step forward and demand that the leader drop the axe.',
        udfaldListe: [
          { log: `Hun standser midt i slaget. I pausen strammer træet grebet om en af skovhuggerne. Hans kraveben brækker med et højt knæk.`, hpAendring: -5, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Hun svinger øksen mod dig i stedet for stammen. Du dukker dig, men skaftet rammer din skulder hårdt.`, hpAendring: -12, naesteTrin: 'blodskov_angrebet' },
          { log: `Din stemme får dem begge til at standse. Mens de ser på dig, løsner rødderne grebet en smule.`, maxHpAendring: 4, naesteTrin: 'blodskov_vaegtskaalen' }
        ]
      },
      {
        tekst: 'Træk dit våben, og hjælp med at fælde træet.',
        tekstEn: 'Draw your weapon and help fell the tree.',
        kraeverEtAfItems: ['svaerd', 'sabel', 'oekse', 'kniv'],
        udfaldListe: [
          { log: `Barken flænges under jeres fælles angreb. Den gamle mand skriger, og jorden ryster under jer.`, naesteTrin: 'blodskov_angrebet' },
          { log: `En gren pisker ned fra trækronen og slår dig til jorden. Al luft bliver slået ud af dig.`, hpAendring: -18, naesteTrin: 'blodskov_angrebet' },
          { log: `Du rammer et blødt punkt i stammen. Rød saft vælter ud og tvinger rødderne tilbage.`, guldAendring: 40, maxHpAendring: 5, naesteTrin: 'blodskov_saften' }
        ]
      },
      {
        tekst: 'Grav omkring rødderne med skovlen.',
        tekstEn: 'Dig the roots free with the shovel.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Skovlen får fat under de øverste rødder. Du løsner dem nok til, at lederen sænker øksen og lytter.`, maxHpAendring: 4, naesteTrin: 'blodskov_roedderne' },
          { log: `Du rammer en blodfyldt rod. Saften sprøjter op, og en anden rod hamrer ned over dig.`, hpAendring: -10, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Jorden giver efter ved stammen og afslører et lille hulrum. Det er ikke kernen, men mørket gemmer på gamle mønter.`, guldAendring: 60, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Sæt ild til grenene med faklen.',
        tekstEn: 'Set fire to the branches with your torch.',
        kosterItem: 'fakkel',
        udfaldListe: [
          { log: `Ilden får fat i den tørre bark. Træet trækker rødderne til sig for at beskytte stammen, og skovhuggerne falder ned i mudderet.`, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Flammerne breder sig hurtigere end ventet. Du får skabt afstand, men varmen svider hænder og ansigt.`, hpAendring: -10, naesteTrin: 'blodskov_roedderne' },
          { log: `Ilden afslører et hulrum højt oppe i stammen. Forkullede mønter falder ud, og lederen ser dem med det samme.`, guldAendring: 60, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Giv den gamle mand din mad.',
        tekstEn: 'Give the old man your food.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: `Han tager imod brødet. Da han spiser, mister træet sit faste greb om mændene.`, maxHpAendring: 5, naesteTrin: 'blodskov_vaegtskaalen' },
          { log: `Han ignorerer maden. En sulten skovhugger kaster sig i stedet over den, og forvirringen vokser.`, hpAendring: -6, naesteTrin: 'blodskov_roedderne' },
          { log: `Brødet suger rød saft fra jorden. Den gamle tager det og betaler dig med en lille pung mønter.`, guldAendring: 50, naesteTrin: 'blodskov_vaegtskaalen' }
        ]
      },
      {
        tekst: 'Læs røddernes bevægelser som jæger.',
        tekstEn: 'Read the roots’ movements as a hunter.',
        kraeverKarakter: 'hunter_m',
        udfaldListe: [
          { log: `Du ser, at rødderne ikke angriber. De forsvarer stammens indre. Den gamle mand styrer dem med små ryk i fingrene.`, naesteTrin: 'blodskov_kernen' },
          { log: `Du ser for længe på rødderne. Mudderet giver efter, og du glider ned i en pøl af saft.`, hpAendring: -8, naesteTrin: 'blodskov_saften' },
          { log: `Du finder rytmen i træets forsvar og bevæger dig helt frem til kernen uden at blive ramt.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Læs røddernes bevægelser som jægerinde.',
        tekstEn: 'Read the roots’ movements as a huntress.',
        kraeverKarakter: 'hunter_f',
        udfaldListe: [
          { log: `Du ser, at rødderne ikke angriber. De forsvarer stammens indre. Den gamle mand styrer dem med små ryk i fingrene.`, naesteTrin: 'blodskov_kernen' },
          { log: `Du ser for længe på rødderne. Mudderet giver efter, og du glider ned i en pøl af saft.`, hpAendring: -8, naesteTrin: 'blodskov_saften' },
          { log: `Du finder rytmen i træets forsvar og bevæger dig helt frem til kernen uden at blive ramt.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' }
        ]
      }
    ]
  },

  blodskov_vaegtskaalen: {
    id: 'blodskov_vaegtskaalen',
    titel: 'Vægtskålen',
    titelEn: 'The Scales',
    biome: ['blodskov'],
    tekst: `Lederen sænker øksen og tørrer sveden af panden. Hun peger på den gamle mand og kalder ham kultist. I årevis, siger hun, har han fodret træet med folk fra byen.

Den gamle spytter blod i mudderet. Han påstår, at han er den eneste lås på et bur, der ellers ville slippe skoven løs over egnen.

De fastklemte skovhuggere stønner, mens rødderne igen strammer grebet. Hvis du vil gribe ind, skal det være nu.`,
    tekstEn: `The leader lowers her axe. She wipes sweat from her brow and points accusingly at the old man. She says he is a cultist who has fed the tree with townsfolk for years.

The old man spits again. He says he is the only lock on a cage that keeps the forest from eating the region.

The trapped woodcutters groan. The tree slowly tightens its grip again. There is no time for negotiations here. Something must be done.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Pres den gamle mand til at slippe skovhuggerne.',
        tekstEn: 'Force the old man to release the woodcutters.',
        udfaldListe: [
          { log: `Han nægter. Du vrider hans arm, og træet reagerer ved at kaste dig tilbage i mudderet.`, hpAendring: -15, naesteTrin: 'blodskov_roedderne' },
          { log: `Du sætter støvlen mod hans hals. Rødderne løsner straks grebet, og skovhuggerne falder fri.`, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Han ler af dig. Det giver lederen tid til at finde sin økse og rette den mod jer begge.`, hpAendring: -6, guldAendring: 30, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Betal lederen for at opgive træet.',
        tekstEn: 'Pay the leader to abandon the tree.',
        puljeVaerdi: 150,
        udfaldListe: [
          { log: `Hun tager pengene. Gælden er betalt, men hendes folk sidder stadig fast. Du har kun løst hendes problem.`, maxHpAendring: -2, naesteTrin: 'blodskov_roedderne' },
          { log: `Betalingen overbeviser hende. Hun kalder sine folk tilbage, og den gamle mand lader rødderne slippe.`, hpAendring: 12, maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' },
          { log: `Hun gemmer pengene og hugger alligevel. Grådighed lader sig sjældent stoppe af en enkelt betaling.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Find kæden under mudderet med metaldetektoren.',
        tekstEn: 'Find the iron chain under the mud with your metal detector.',
        kraeverItem: 'metaldetektor',
        udfaldListe: [
          { log: `Metaldetektoren hyler over en kæde, der binder manden til træet. Du knækker den, og han slår straks fra sig.`, naesteTrin: 'blodskov_angrebet' },
          { log: `I et skjult rum i kæden finder du gamle mønter. Du tager dem, mens de andre skændes.`, guldAendring: 120, naesteTrin: 'blodskov_kernen' },
          { log: `Du griber om det forkerte led. Kæden bliver glohed og brænder kræfterne ud af armen.`, hpAendring: -14, naesteTrin: 'blodskov_kernen' }
        ]
      },
      {
        tekst: 'Grav mandens binding fri med skovlen.',
        tekstEn: 'Dig around the man’s binding with the shovel.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Du løsner jorden omkring håret og finder knuden, der holder manden fast. Kort efter slipper rødderne deres greb.`, maxHpAendring: 5, naesteTrin: 'blodskov_roedderne' },
          { log: `Skovlen rammer en skjult jernring under mudderet. Den er gammel, men stadig penge værd.`, guldAendring: 70, naesteTrin: 'blodskov_kernen' },
          { log: `Roden slår tilbage gennem skaftet. Smerten går op gennem armen, før du når væk.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Kast dit fine tøj over mandens hoved.',
        tekstEn: 'Throw your fine clothes over the man’s head to blind his control.',
        kosterItem: 'flot_toej',
        udfaldListe: [
          { log: `Stoffet dækker hans ansigt. Rødderne farer planløst rundt og slipper skovhuggerne.`, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Han river tøjet i stykker med det samme. Træet strammer grebet af ren vrede.`, hpAendring: -8, naesteTrin: 'blodskov_angrebet' },
          { log: `Forvirringen giver dig tid til at tømme de efterladte tasker på jorden.`, guldAendring: 90, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Skab ro, og beordr våbenhvile som ridder.',
        tekstEn: 'Order a ceasefire as a knight.',
        kraeverKarakter: 'knight_m',
        udfaldListe: [
          { log: `Din autoritet slår igennem. Lederen træder tilbage, og den gamle mand falder til ro. Vejen til kernen er fri.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Din befaling bliver mødt med en splintrende gren, der slår ind mod dit panser. Her gælder kun skovens lov.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' },
          { log: `Skovhuggerne adlyder og samler deres ting. Så trækker de sig tilbage og overlader den gamle mand til dig.`, guldAendring: 60, naesteTrin: 'blodskov_angrebet' }
        ]
      },
      {
        tekst: 'Skab ro, og beordr våbenhvile som skjoldmø.',
        tekstEn: 'Order a ceasefire as a shieldmaiden.',
        kraeverKarakter: 'knight_f',
        udfaldListe: [
          { log: `Din autoritet slår igennem. Lederen træder tilbage, og den gamle mand falder til ro. Vejen til kernen er fri.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Din befaling bliver mødt med en splintrende gren, der slår ind mod dit panser. Her gælder kun skovens lov.`, hpAendring: -10, naesteTrin: 'blodskov_angrebet' },
          { log: `Skovhuggerne adlyder og samler deres ting. Så trækker de sig tilbage og overlader den gamle mand til dig.`, guldAendring: 60, naesteTrin: 'blodskov_angrebet' }
        ]
      }
    ]
  },

  blodskov_angrebet: {
    id: 'blodskov_angrebet',
    titel: 'Bark og blod',
    titelEn: 'Bark and Blood',
    biome: ['blodskov'],
    tekst: `Barken flækker, og en byge af skarpe splinter flyver ud over lysningen. Den gamle mand brøler, mens rødderne trækker to skovhuggere ned i jorden.

Inde bag såret gløder stammen rødt. Lederen har set det. Hun er klar til at lade sine folk blive taget, hvis det betyder, at hun når kilden først.`,
    tekstEn: `The bark splits. The tree throws a shower of needle-sharp splinters across the clearing. The old man roars while the roots begin dragging two of the workers underground.

The inside of the trunk glows faintly red through the wound. The leader is ready to abandon her people if it means reaching the source first.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Skub lederen væk, og nå hulrummet først.',
        tekstEn: 'Push the leader aside and reach the hollow first.',
        udfaldListe: [
          { log: `Hun falder tungt i mudderet. Du rækker ind i træet og får fat i noget stort og glødende.`, naesteTrin: 'blodskov_kernen' },
          { log: `Hun trækker dig med ned, og rødderne pisker jer begge.`, hpAendring: -18, naesteTrin: 'blodskov_kernen' },
          { log: `Du kommer først frem og samler løse ædelsten op foran stammen.`, guldAendring: 110, maxHpAendring: 3, naesteTrin: 'blodskov_saften' }
        ]
      },
      {
        tekst: 'Træk skovhuggerne op af jorden.',
        tekstEn: 'Pull the woodcutters out of the ground.',
        udfaldListe: [
          { log: `Du får to af dem op. De hoster jord og giver dig det guld, de har tilbage i lommerne.`, guldAendring: 140, maxHpAendring: 6, naesteTrin: 'blodskov_roedderne' },
          { log: `Rødderne er for stærke. De trækker skovhuggerne ned, mens tornene flår huden på dine underarme.`, hpAendring: -22, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du får den ene fri, mens den anden forsvinder under jorden. Den overlevende giver dig sin dolk med rystende hænder.`, givItem: 'kniv', maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Brug rustningen som skjold mod splinterne.',
        tekstEn: 'Use your armor as a shield against the splinters.',
        kosterItem: 'rustning',
        udfaldListe: [
          { log: `Panseret tager hele bygen. Du presser dig gennem kaosset og når stammen uden en skramme.`, maxHpAendring: 8, naesteTrin: 'blodskov_kernen' },
          { log: `Splinterne flår metallet op, og flere trænger igennem til dit lår.`, hpAendring: -12, naesteTrin: 'blodskov_saften' },
          { log: `Du tager imod bygen for de andre. Lederen takker ved at give dig det bytte, hun har samlet.`, guldAendring: 160, naesteTrin: 'blodskov_roedderne' }
        ]
      },
      {
        tekst: 'Slå stammen med de bare næver som ork.',
        tekstEn: 'Strike the trunk with your bare fists as an orc.',
        kraeverKarakter: 'orc_m',
        udfaldListe: [
          { log: `Slaget sender en bølge gennem barken. Træet standser angrebet, og hullet i stammen flækker endnu mere op.`, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Træet er hårdere end sten. To knoer brækker, og smerten skyder op gennem armen.`, hpAendring: -15, naesteTrin: 'blodskov_saften' },
          { log: `Slaget river døde grene løs. Mellem dem hænger en intakt eliksir og en møntpung fra en tidligere rejsende.`, givItem: 'livseliksir', guldAendring: 50, naesteTrin: 'blodskov_roedderne' }
        ]
      },
      {
        tekst: 'Slå stammen med de bare næver som klanleder.',
        tekstEn: 'Strike the trunk with your bare fists as a clan leader.',
        kraeverKarakter: 'orc_f',
        udfaldListe: [
          { log: `Slaget sender en bølge gennem barken. Træet standser angrebet, og hullet i stammen flækker endnu mere op.`, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Træet er hårdere end sten. To knoer brækker, og smerten skyder op gennem armen.`, hpAendring: -15, naesteTrin: 'blodskov_saften' },
          { log: `Slaget river døde grene løs. Mellem dem hænger en intakt eliksir og en møntpung fra en tidligere rejsende.`, givItem: 'livseliksir', guldAendring: 50, naesteTrin: 'blodskov_roedderne' }
        ]
      }
    ]
  },

  blodskov_roedderne: {
    id: 'blodskov_roedderne',
    titel: 'Jordens lås',
    titelEn: 'The Earth’s Lock',
    biome: ['blodskov'],
    tekst: `Rødderne er seje som ståltråd, og mudderet lugter skarpt af jern. En af skovhuggerne rækker dig sin pung. Han beder dig tage pengene og lade ham ligge. Han har givet op.

Den gamle mand styrer uden tvivl rødderne. Han lader skovhuggerne lide med vilje. Hvis rødderne får dem helt ned, kommer de ikke op igen.`,
    tekstEn: `The roots are tough as wire, and the mud reeks of iron. One of the woodcutters holds out his purse and asks you to take the money and leave him there. He has given up.

The old man is clearly controlling the roots. He is making the woodcutters suffer on purpose. If the roots pull them all the way under, they will not come back.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Skær skovhuggerne fri med kniven.',
        tekstEn: 'Cut the woodcutters free with your knife.',
        kraeverItem: 'kniv',
        udfaldListe: [
          { log: `Kniven glider sikkert gennem de tynde rødder. Skovhuggerne kommer fri og giver dig deres guld som tak.`, guldAendring: 180, maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Klingen smutter på den hårde bark og skærer dybt i din håndflade. Skovhuggerne kommer fri, men du må betale i blod.`, hpAendring: -12, guldAendring: 100, naesteTrin: 'blodskov_efterspillet' },
          { log: `Sort gas siver ud fra snittene. Du hoster og mister pusten, mens skovhuggerne flygter.`, hpAendring: -16, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Grav skovhuggerne fri med skovlen.',
        tekstEn: 'Dig the woodcutters free with your shovel.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Du fjerner jorden omkring rødderne uden at skære i dem. Det tager tid, men alle kommer fri.`, guldAendring: 90, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du graver for tæt på en levende rod. Den slår op gennem mudderet og rammer dig hårdt i siden.`, hpAendring: -12, naesteTrin: 'blodskov_saften' },
          { log: `Skovlen rammer et gammelt skjul under en rod. Der ligger mad og mønter fra folk, der ikke slap ud.`, givItem: 'mad', guldAendring: 70, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Træk dem fri med håndkraft.',
        tekstEn: 'Pull them up with raw strength.',
        udfaldListe: [
          { log: `Det kræver alle dine kræfter. Du får dem fri, men smerten skærer gennem ryggen og lænden.`, hpAendring: -20, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du planter fødderne i mudderet og river dem fri én efter én. Din styrke holder hele vejen.`, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du mister grebet om den sidste, og rødderne tager ham. Tilbage ligger hans taske i mudderet.`, guldAendring: 130, hpAendring: -8, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Giv den fastklemte skovhugger din livseliksir.',
        tekstEn: 'Give the trapped woodcutter your life elixir.',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: `Eliksiren giver ham styrke til selv at bryde rødderne op. Da han kommer fri, rækker han dig en diamant fra jorden.`, givItem: 'diamant', maxHpAendring: 8, naesteTrin: 'blodskov_efterspillet' },
          { log: `Han spilder det meste, men får nok i sig til at overleve og komme fri.`, maxHpAendring: 3, naesteTrin: 'blodskov_efterspillet' },
          { log: `Jorden suger en del af eliksiren til sig. Rødderne falder til ro og trækker sig mætte tilbage.`, hpAendring: 10, maxHpAendring: 5, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Brug søgekvisten til at finde jordens svage punkt.',
        tekstEn: 'Use the seeker twig to find the ground’s weak point.',
        kraeverItem: 'soegekvist',
        udfaldListe: [
          { log: `Kvisten peger på en hul rod. Du træder den i stykker, og de andre rødder slipper straks deres greb.`, maxHpAendring: 10, naesteTrin: 'blodskov_saften' },
          { log: `Kvisten fører dig uden om skovhuggerne og hen til en skjult bunke mønter.`, guldAendring: 160, naesteTrin: 'blodskov_efterspillet' },
          { log: `Træets magi sender kvisten på afveje og leder dig direkte ind i en tornebusk.`, hpAendring: -10, naesteTrin: 'blodskov_saften' }
        ]
      }
    ]
  },

  blodskov_saften: {
    id: 'blodskov_saften',
    titel: 'Det røde guld',
    titelEn: 'The Red Gold',
    biome: ['blodskov'],
    tekst: `Rød saft strømmer frit fra sårene i stammen. Den er varm og lugter skarpt af jern. Inde fra træet kommer langsomme, dæmpede slag.

Lederen holder en læderflaske ind under strømmen. Hun siger, at saften kan helbrede enhver sygdom. Den gamle mand advarer hende: Drikker hun den, vil hendes blod aldrig blive det samme.`,
    tekstEn: `The red sap now streams freely from the wounds in the trunk. It is warm and smells sharply of iron. You can hear faint pulses from inside the tree.

The leader quickly thrusts in a leather bottle to catch the drops. She says it can heal all sickness. The old man warns that the drops will change her blood permanently.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Sug saften op med dine klude.',
        tekstEn: 'Soak up the sap with your rags.',
        kosterItem: 'klude',
        udfaldListe: [
          { log: `Kludene suger saften til sig. Bare dampen fylder kroppen med varme og nye kræfter.`, hpAendring: 25, maxHpAendring: 10, naesteTrin: 'blodskov_kernen' },
          { log: `Saften ætser gennem stoffet på få sekunder. Du slipper kludene, men ikke før syren har svedet fingrene.`, hpAendring: -5, naesteTrin: 'blodskov_kernen' },
          { log: `Saften drypper ned i lommen og giver mønterne en sjælden rød glans. En samler vil betale godt for dem.`, guldAendring: 120, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Slå flasken ud af lederens hånd.',
        tekstEn: 'Knock the bottle from her hand.',
        udfaldListe: [
          { log: `Flasken splintres. Den røde saft trænger ned i jorden. Lederen trækker sin kniv mod dig.`, hpAendring: -14, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du slår flasken væk, før hun kan drikke. Hun forstår advarslen, nikker stumt og giver dig sin sabel.`, givItem: 'sabel', maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Lederen kaster sig efter flasken i mudderet. Mens hun leder, tager du hendes tunge pengepung.`, guldAendring: 150, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Stjæl flasken som pirat.',
        tekstEn: 'Steal the bottle as a pirate.',
        kraeverKarakter: 'pirate_m',
        udfaldListe: [
          { log: `Dine hænder er hurtigere end hendes blik. Du bytter flasken ud med en klump mudder og drikker selv saften.`, hpAendring: 30, maxHpAendring: 12, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du snupper flasken og drikker. Saften koger i maven og trækker kroppen sammen i en voldsom krampe.`, hpAendring: -18, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du stjæler flasken og kræver en høj pris for at give den tilbage. Lederen betaler.`, guldAendring: 250, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Stjæl flasken som korsar.',
        tekstEn: 'Steal the bottle as a corsair.',
        kraeverKarakter: 'pirate_f',
        udfaldListe: [
          { log: `Dine hænder er hurtigere end hendes blik. Du bytter flasken ud med en klump mudder og drikker selv saften.`, hpAendring: 30, maxHpAendring: 12, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du snupper flasken og drikker. Saften koger i maven og trækker kroppen sammen i en voldsom krampe.`, hpAendring: -18, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du stjæler flasken og kræver en høj pris for at give den tilbage. Lederen betaler.`, guldAendring: 250, naesteTrin: 'blodskov_efterspillet' }
        ]
      }
    ]
  },

  blodskov_kernen: {
    id: 'blodskov_kernen',
    titel: 'Træets hjerte',
    titelEn: 'The Tree’s Heart',
    biome: ['blodskov'],
    tekst: `Træets indre ligger åbent. Midt i stammen sidder en stor, rød krystal. Den pulserer langsomt og sender en kvælende varme ud i lysningen.

Den gamle mands øjne er rullet tilbage. Med de sidste tynde rødder prøver han at dække krystallen. Lederen hæver kniven. Hun vil skære stenen fri, selv hvis hendes egne folk dør under rødderne.`,
    tekstEn: `The inside of the tree lies exposed. An enormous red crystal sits in the center of the trunk, pulsing slowly and radiating choking heat.

The old man’s eyes have rolled back in his head, and he tries to cover the crystal with his last thin roots. The leader raises her knife. She will cut out the stone even if it costs her own people’s lives under the roots.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Flæk krystallen med sværdet.',
        tekstEn: 'Split the crystal with your sword.',
        kraeverItem: 'svaerd',
        udfaldListe: [
          { log: `Sværdet rammer rent. Krystallen splintrer, og træet dør med det samme. Du samler det største stykke og de værdifulde splinter op.`, givItem: 'diamant', guldAendring: 120, naesteTrin: 'blodskov_efterspillet' },
          { log: `Slaget udløser en trykbølge, der knuser klingen og kaster dig ind i en stamme. Våbnet er tabt, men træet dør.`, hpAendring: -20, maxHpAendring: -2, naesteTrin: 'blodskov_efterspillet' },
          { log: `Du knuser hjertet. Gløden forsvinder, og den gamle mand falder om. Under rødderne finder du hans skjulte mønter.`, guldAendring: 220, maxHpAendring: 8, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Skyd krystallen løs med buen.',
        tekstEn: 'Shoot the crystal loose with your bow.',
        kraeverItem: 'bue',
        udfaldListe: [
          { log: `Pilen borer sig ind bag stenen og vipper den fri. Varmen falder, så du kan tage krystallen med hænderne.`, givItem: 'diamant', maxHpAendring: 6, naesteTrin: 'blodskov_efterspillet' },
          { log: `Pilen går forbi og rammer en lomme fuld af saft. Den varme damp svier øjne og luftveje.`, hpAendring: -15, naesteTrin: 'blodskov_efterspillet' },
          { log: `Skuddet deler stenen i to. Lederen griber den ene halvdel, og du tager den anden uden at diskutere.`, givItem: 'diamant', guldAendring: 90, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Byt din diamant for træets kerne.',
        tekstEn: 'Trade your diamond for the tree’s core.',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: `Træet tager imod byttet. Krystallen triller ud, og rødderne falder til ro med din diamant i stammen.`, givItem: 'livseliksir', guldAendring: 300, naesteTrin: 'blodskov_efterspillet' },
          { log: `Træet sluger diamanten og sender en stråle syre mod dit ansigt. Det vil have mere end betaling.`, hpAendring: -25, naesteTrin: 'blodskov_efterspillet' },
          { log: `Den gamle mand sluger diamanten. Han løsner grebet, og rødderne skubber rustning, våben og mønter op af jorden.`, givItem: 'rustning', guldAendring: 150, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Tilbyd lederen en del af stenens værdi.',
        tekstEn: 'Offer to share the stone’s value with the leader.',
        udfaldListe: [
          { log: `Hun accepterer. Sammen vrikker I stenen fri og deler værdien med det samme.`, givItem: 'diamant', hpAendring: -5, naesteTrin: 'blodskov_efterspillet' },
          { log: `Hun snyder dig og stikker af med stenen, mens træet pisker dig over ansigtet med en gren.`, hpAendring: -16, naesteTrin: 'blodskov_efterspillet' },
          { log: `I taler for længe. Krystallen smelter væk, men efterlader de tidligere ofres mønter i det åbne hulrum.`, guldAendring: 250, maxHpAendring: 4, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Bryd forbindelsen mellem sten og træ som troldmand.',
        tekstEn: 'Sever the link between stone and tree as a wizard.',
        kraeverKarakter: 'magician_m',
        udfaldListe: [
          { log: `Du sender en modpuls gennem stammen. Forbindelsen brister, og gløden forsvinder stille fra træet. Stenen er din.`, givItem: 'diamant', maxHpAendring: 10, naesteTrin: 'blodskov_efterspillet' },
          { log: `Magien slår hårdere tilbage end ventet og dræner dine kræfter. Til sidst slipper træet stenen.`, hpAendring: -20, givItem: 'diamant', naesteTrin: 'blodskov_efterspillet' },
          { log: `Du slukker træets magi helt. Den gamle mand takker og åbner sit skjulte lager. Du tager mønterne og en metaldetektor.`, givItem: 'metaldetektor', guldAendring: 180, naesteTrin: 'blodskov_efterspillet' }
        ]
      },
      {
        tekst: 'Bryd forbindelsen mellem sten og træ som troldkvinde.',
        tekstEn: 'Sever the link between stone and tree as a sorceress.',
        kraeverKarakter: 'magician_f',
        udfaldListe: [
          { log: `Du sender en modpuls gennem stammen. Forbindelsen brister, og gløden forsvinder stille fra træet. Stenen er din.`, givItem: 'diamant', maxHpAendring: 10, naesteTrin: 'blodskov_efterspillet' },
          { log: `Magien slår hårdere tilbage end ventet og dræner dine kræfter. Til sidst slipper træet stenen.`, hpAendring: -20, givItem: 'diamant', naesteTrin: 'blodskov_efterspillet' },
          { log: `Du slukker træets magi helt. Den gamle mand takker og åbner sit skjulte lager. Du tager mønterne og en metaldetektor.`, givItem: 'metaldetektor', guldAendring: 180, naesteTrin: 'blodskov_efterspillet' }
        ]
      }
    ]
  },

  blodskov_efterspillet: {
    id: 'blodskov_efterspillet',
    titel: 'Stilhed i lysningen',
    titelEn: 'Silence in the Clearing',
    biome: ['blodskov'],
    tekst: `Lysningen bliver stille. Rødderne ligger livløse, og skovhuggerne prøver at komme på benene og forbinde deres sår.

Træet står udhulet tilbage. Mudderet er dækket af ødelagt udstyr og efterladte tasker. Tågen driver allerede ind mellem stammerne. Du må beslutte, hvad du tager med, og komme videre.`,
    tekstEn: `The clearing falls silent. The roots lie still, and the woodcutters struggle to their feet and bind their wounds.

The tree stands hollow. Broken equipment and abandoned bags cover the mud, and fog is already drifting between the trunks. Decide what to take and move on.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Forlad lysningen med det samme.',
        tekstEn: 'Leave the clearing at once.',
        udfaldListe: [
          { log: `Du trækker dig tilbage og lader lysningen ligge. Først mellem de næste træer falder pulsen til ro.`, maxHpAendring: 5 },
          { log: `På vej væk træder du på en rod skjult i mudderet og vrider anklen slemt. Du kommer ud, men hvert skridt gør ondt.`, hpAendring: -8, maxHpAendring: 3 },
          { log: `Ved kanten af lysningen finder du en efterladt skovl. Du tager den med, før tågen lukker sig bag dig.`, givItem: 'skovl', maxHpAendring: 4 }
        ]
      },
      {
        tekst: 'Kræv betaling af de overlevende.',
        tekstEn: 'Demand payment from the survivors.',
        udfaldListe: [
          { log: `De orker ikke at diskutere. Med vrede blikke kaster de deres møntposer over til dig.`, guldAendring: 240, maxHpAendring: -2 },
          { log: `Lederen nægter først og flænser dig med kniven. Da hun ser, at du ikke giver dig, betaler hun.`, hpAendring: -12, guldAendring: 180 },
          { log: `De betaler uden et ord. Mønterne klirrer koldt i lommen. Du har overlevet. De har overlevet. Intet mere.`, guldAendring: 210 }
        ]
      },
      {
        tekst: 'Følg dem sikkert ud af skoven.',
        tekstEn: 'Escort them safely out of the forest.',
        udfaldListe: [
          { log: `Turen ud bliver rolig. Kroppen får tid til at komme sig, og skovhuggerne takker dig med de mønter, de kan undvære.`, hpAendring: 15, guldAendring: 80 },
          { log: `På vejen falder en tung gren og rammer dig i hovedet. Du får dem ud, men må betale prisen.`, hpAendring: -14, maxHpAendring: 5 },
          { log: `Du får alle sikkert ud. Ved skovbrynet presser en af dem en lille ædelsten i din hånd som tak.`, givItem: 'diamant', maxHpAendring: 8 }
        ]
      },
      {
        tekst: 'Beslaglæg værdierne i statens navn som hertug.',
        tekstEn: 'Seize the valuables in the name of the state as a duke.',
        kraeverKarakter: 'royal_m',
        udfaldListe: [
          { log: `Ingen tør modsige din ordre. Du tager alt af værdi fra lysningen. Beskidt arbejde, men en god forretning.`, guldAendring: 320, maxHpAendring: 5 },
          { log: `En skovhugger gør desperat modstand. Du får mønterne, men ikke uden skrammer.`, hpAendring: -15, guldAendring: 280 },
          { log: `Den gamle mand accepterer din ordre. Du tager mønterne og en sabel, der ligger i mudderet.`, givItem: 'sabel', guldAendring: 200 }
        ]
      },
      {
        tekst: 'Beslaglæg værdierne i statens navn som hertuginde.',
        tekstEn: 'Seize the valuables in the name of the state as a duchess.',
        kraeverKarakter: 'royal_f',
        udfaldListe: [
          { log: `Ingen tør modsige din ordre. Du tager alt af værdi fra lysningen. Beskidt arbejde, men en god forretning.`, guldAendring: 320, maxHpAendring: 5 },
          { log: `En skovhugger gør desperat modstand. Du får mønterne, men ikke uden skrammer.`, hpAendring: -15, guldAendring: 280 },
          { log: `Den gamle mand accepterer din ordre. Du tager mønterne og en sabel, der ligger i mudderet.`, givItem: 'sabel', guldAendring: 200 }
        ]
      }
    ]
  }
};

const blodskovLogEn: Record<string, string> = {
  [`Hun standser midt i slaget. I pausen strammer træet grebet om en af skovhuggerne. Hans kraveben brækker med et højt knæk.`]: `She stops mid-swing. During the pause, the tree tightens its grip on one of the woodcutters. His collarbone breaks with a loud crack.`,
  [`Hun svinger øksen mod dig i stedet for stammen. Du dukker dig, men skaftet rammer din skulder hårdt.`]: `She swings the axe at you instead of the trunk. You duck, but the handle strikes your shoulder hard.`,
  [`Din stemme får dem begge til at standse. Mens de ser på dig, løsner rødderne grebet en smule.`]: `Your voice makes both of them stop. While they watch you, the roots loosen their grip slightly.`,
  [`Barken flænges under jeres fælles angreb. Den gamle mand skriger, og jorden ryster under jer.`]: `The bark splits under your combined attack. The old man screams, and the ground shakes beneath you.`,
  [`En gren pisker ned fra trækronen og slår dig til jorden. Al luft bliver slået ud af dig.`]: `A branch lashes down from the crown and knocks you to the ground. The impact drives the air from your lungs.`,
  [`Du rammer et blødt punkt i stammen. Rød saft vælter ud og tvinger rødderne tilbage.`]: `You strike a soft spot in the trunk. Red sap pours out and forces the roots back.`,
  [`Skovlen får fat under de øverste rødder. Du løsner dem nok til, at lederen sænker øksen og lytter.`]: `The shovel catches beneath the upper roots. You loosen them enough that the leader lowers her axe and listens.`,
  [`Du rammer en blodfyldt rod. Saften sprøjter op, og en anden rod hamrer ned over dig.`]: `You hit a blood-filled root. Sap sprays up, and another root slams down on you.`,
  [`Jorden giver efter ved stammen og afslører et lille hulrum. Det er ikke kernen, men mørket gemmer på gamle mønter.`]: `The ground opens a small hollow by the trunk. It is not the core, but old coins lie in the darkness.`,
  [`Ilden får fat i den tørre bark. Træet trækker rødderne til sig for at beskytte stammen, og skovhuggerne falder ned i mudderet.`]: `The fire catches in the dry bark. The tree pulls its roots inward in defense, and the woodcutters drop into the mud.`,
  [`Flammerne breder sig hurtigere end ventet. Du får skabt afstand, men varmen svider hænder og ansigt.`]: `The flames spread faster than expected. You create some distance, but the heat burns your hands and face.`,
  [`Ilden afslører et hulrum højt oppe i stammen. Forkullede mønter falder ud, og lederen ser dem med det samme.`]: `The fire reveals a hollow high in the trunk. Charred coins tumble out, and the leader spots them at once.`,
  [`Han tager imod brødet. Da han spiser, mister træet sit faste greb om mændene.`]: `He accepts the bread. When he eats, the tree loses its firm grip on the men.`,
  [`Han ignorerer maden. En sulten skovhugger kaster sig i stedet over den, og forvirringen vokser.`]: `He ignores the food. A hungry woodcutter lunges for it instead, adding to the confusion.`,
  [`Brødet suger rød saft fra jorden. Den gamle tager det og betaler dig med en lille pung mønter.`]: `The bread absorbs red sap from the ground. The old man takes it and pays you with a small pouch of coins.`,
  [`Du ser, at rødderne ikke angriber. De forsvarer stammens indre. Den gamle mand styrer dem med små ryk i fingrene.`]: `You see that the roots are not attacking. They are defending the trunk's interior. The old man controls them with tiny jerks of his fingers.`,
  [`Du ser for længe på rødderne. Mudderet giver efter, og du glider ned i en pøl af saft.`]: `You watch the roots for too long. The mud gives way, and you slide into a pool of sap.`,
  [`Du finder rytmen i træets forsvar og bevæger dig helt frem til kernen uden at blive ramt.`]: `You find the rhythm of the tree's defense and reach the core without being hit.`,
  [`Han nægter. Du vrider hans arm, og træet reagerer ved at kaste dig tilbage i mudderet.`]: `He refuses. You twist his arm, and the tree responds by throwing you back into the mud.`,
  [`Du sætter støvlen mod hans hals. Rødderne løsner straks grebet, og skovhuggerne falder fri.`]: `You press a boot against his throat. The roots release their grip instantly, and the woodcutters fall free.`,
  [`Han ler af dig. Det giver lederen tid til at finde sin økse og rette den mod jer begge.`]: `He laughs at you. It gives the leader time to find her axe and point it at both of you.`,
  [`Hun tager pengene. Gælden er betalt, men hendes folk sidder stadig fast. Du har kun løst hendes problem.`]: `She takes the money. Her debt is paid, but her people remain trapped. You have solved only her problem.`,
  [`Betalingen overbeviser hende. Hun kalder sine folk tilbage, og den gamle mand lader rødderne slippe.`]: `The payment convinces her. She calls her people back, and the old man makes the roots release them.`,
  [`Hun gemmer pengene og hugger alligevel. Grådighed lader sig sjældent stoppe af en enkelt betaling.`]: `She pockets the money and chops anyway. Greed is rarely stopped by a single payment.`,
  [`Metaldetektoren hyler over en kæde, der binder manden til træet. Du knækker den, og han slår straks fra sig.`]: `The metal detector shrieks over a chain binding the man to the tree. You break it, and he immediately strikes out.`,
  [`I et skjult rum i kæden finder du gamle mønter. Du tager dem, mens de andre skændes.`]: `The chain contains a hidden compartment with old coins. You take them while the others argue.`,
  [`Du griber om det forkerte led. Kæden bliver glohed og brænder kræfterne ud af armen.`]: `You grab the wrong link. The chain turns white-hot and burns the strength from your arm.`,
  [`Du løsner jorden omkring håret og finder knuden, der holder manden fast. Kort efter slipper rødderne deres greb.`]: `You loosen the soil around the hair and find the knot holding the man in place. The roots let go shortly after.`,
  [`Skovlen rammer en skjult jernring under mudderet. Den er gammel, men stadig penge værd.`]: `The shovel hits a hidden iron ring beneath the mud. It is old, but still worth money.`,
  [`Roden slår tilbage gennem skaftet. Smerten går op gennem armen, før du når væk.`]: `The root strikes back through the shaft. Pain runs up your arm before you can get away.`,
  [`Stoffet dækker hans ansigt. Rødderne farer planløst rundt og slipper skovhuggerne.`]: `The cloth covers his face. The roots flail blindly and release the woodcutters.`,
  [`Han river tøjet i stykker med det samme. Træet strammer grebet af ren vrede.`]: `He tears the clothes apart immediately. The tree tightens its grip out of pure anger.`,
  [`Forvirringen giver dig tid til at tømme de efterladte tasker på jorden.`]: `It creates enough confusion for you to empty the bags abandoned on the ground.`,
  [`Din autoritet slår igennem. Lederen træder tilbage, og den gamle mand falder til ro. Vejen til kernen er fri.`]: `Your authority carries. The leader steps back, the old man calms down, and the way to the core opens.`,
  [`Din befaling bliver mødt med en splintrende gren, der slår ind mod dit panser. Her gælder kun skovens lov.`]: `Your order is met by a splintering branch that smashes into your armor. Only the forest's law applies here.`,
  [`Skovhuggerne adlyder og samler deres ting. Så trækker de sig tilbage og overlader den gamle mand til dig.`]: `The woodcutters obey, gather their things and withdraw, leaving the old man to you.`,
  [`Hun falder tungt i mudderet. Du rækker ind i træet og får fat i noget stort og glødende.`]: `She falls heavily into the mud. You reach into the tree and grasp something large and glowing.`,
  [`Hun trækker dig med ned, og rødderne pisker jer begge.`]: `She drags you down with her, and the roots whip both of you.`,
  [`Du kommer først frem og samler løse ædelsten op foran stammen.`]: `You get there first and gather the loose gemstones in front of the trunk.`,
  [`Du får to af dem op. De hoster jord og giver dig det guld, de har tilbage i lommerne.`]: `You pull two of them free. They cough up dirt and give you the gold left in their pockets.`,
  [`Rødderne er for stærke. De trækker skovhuggerne ned, mens tornene flår huden på dine underarme.`]: `The roots are too strong. They pull the woodcutters under while thorns tear the skin from your forearms.`,
  [`Du får den ene fri, mens den anden forsvinder under jorden. Den overlevende giver dig sin dolk med rystende hænder.`]: `You free one while the other disappears underground. The survivor gives you his dagger with shaking hands.`,
  [`Panseret tager hele bygen. Du presser dig gennem kaosset og når stammen uden en skramme.`]: `Your armor takes the full shower. You push through the chaos and reach the trunk without a scratch.`,
  [`Splinterne flår metallet op, og flere trænger igennem til dit lår.`]: `The splinters tear through the metal, and several pierce your thigh.`,
  [`Du tager imod bygen for de andre. Lederen takker ved at give dig det bytte, hun har samlet.`]: `You take the shower of splinters for the others. The leader thanks you with the valuables she has collected.`,
  [`Slaget sender en bølge gennem barken. Træet standser angrebet, og hullet i stammen flækker endnu mere op.`]: `The blow sends a wave through the bark. The tree stops its attack, and the hollow in the trunk splits wider.`,
  [`Træet er hårdere end sten. To knoer brækker, og smerten skyder op gennem armen.`]: `The tree is harder than stone. Two knuckles break, and pain shoots up your arm.`,
  [`Slaget river døde grene løs. Mellem dem hænger en intakt eliksir og en møntpung fra en tidligere rejsende.`]: `The blow tears loose several dead branches. An intact elixir and a former traveler’s coin pouch hang among them.`,
  [`Kniven glider sikkert gennem de tynde rødder. Skovhuggerne kommer fri og giver dig deres guld som tak.`]: `The knife slides cleanly through the thin roots. The woodcutters come free and give you their gold in thanks.`,
  [`Klingen smutter på den hårde bark og skærer dybt i din håndflade. Skovhuggerne kommer fri, men du må betale i blod.`]: `The blade slips on the hard bark and cuts deep into your palm. The woodcutters get free, but you pay in blood.`,
  [`Sort gas siver ud fra snittene. Du hoster og mister pusten, mens skovhuggerne flygter.`]: `The tree releases black gas from the cuts. You cough and lose your breath while they run away.`,
  [`Du fjerner jorden omkring rødderne uden at skære i dem. Det tager tid, men alle kommer fri.`]: `You clear the soil from around the roots without cutting them. It takes time, but everyone gets free.`,
  [`Du graver for tæt på en levende rod. Den slår op gennem mudderet og rammer dig hårdt i siden.`]: `You dig too close to a living root. It strikes up through the mud and hits you hard in the side.`,
  [`Skovlen rammer et gammelt skjul under en rod. Der ligger mad og mønter fra folk, der ikke slap ud.`]: `The shovel hits an old cache beneath a root. Food and coins from people who never escaped are inside.`,
  [`Det kræver alle dine kræfter. Du får dem fri, men smerten skærer gennem ryggen og lænden.`]: `It takes all your strength. You free them, but pain cuts through your back and lower spine.`,
  [`Du planter fødderne i mudderet og river dem fri én efter én. Din styrke holder hele vejen.`]: `You plant your feet in the mud and pull them free one by one. Your strength holds.`,
  [`Du mister grebet om den sidste, og rødderne tager ham. Tilbage ligger hans taske i mudderet.`]: `You lose your grip on the last woodcutter, and the roots take him. His bag remains in the mud.`,
  [`Eliksiren giver ham styrke til selv at bryde rødderne op. Da han kommer fri, rækker han dig en diamant fra jorden.`]: `The elixir gives him enough strength to break the roots himself. Once free, he hands you a diamond from the soil.`,
  [`Han spilder det meste, men får nok i sig til at overleve og komme fri.`]: `He spills most of it but drinks enough to survive and pull himself free.`,
  [`Jorden suger en del af eliksiren til sig. Rødderne falder til ro og trækker sig mætte tilbage.`]: `The soil absorbs some of the elixir. The roots grow still and withdraw, satisfied.`,
  [`Kvisten peger på en hul rod. Du træder den i stykker, og de andre rødder slipper straks deres greb.`]: `The twig points to a hollow root. You crush it underfoot, and the other roots immediately release their grip.`,
  [`Kvisten fører dig uden om skovhuggerne og hen til en skjult bunke mønter.`]: `The twig leads you around the woodcutters and straight to a hidden pile of coins.`,
  [`Træets magi sender kvisten på afveje og leder dig direkte ind i en tornebusk.`]: `The tree’s magic sends the twig off course and leads you straight into a thorn bush.`,
  [`Kludene suger saften til sig. Bare dampen fylder kroppen med varme og nye kræfter.`]: `The rags soak up the sap. Even the vapor fills your body with warmth and fresh strength.`,
  [`Saften ætser gennem stoffet på få sekunder. Du slipper kludene, men ikke før syren har svedet fingrene.`]: `The sap eats through the fabric in seconds. You drop the rags, but not before the acid burns your fingers.`,
  [`Saften drypper ned i lommen og giver mønterne en sjælden rød glans. En samler vil betale godt for dem.`]: `It drips onto the coins in your pocket, giving them a strange red sheen and making them more valuable to collectors.`,
  [`Flasken splintres. Den røde saft trænger ned i jorden. Lederen trækker sin kniv mod dig.`]: `The bottle shatters. The red sap seeps into the ground. The leader draws her knife against you.`,
  [`Du slår flasken væk, før hun kan drikke. Hun forstår advarslen, nikker stumt og giver dig sin sabel.`]: `You knock the bottle away before she can drink. She understands the warning, nods silently and gives you her saber.`,
  [`Lederen kaster sig efter flasken i mudderet. Mens hun leder, tager du hendes tunge pengepung.`]: `The leader dives after it in the mud. In the confusion, you quietly snatch her heavy purse.`,
  [`Dine hænder er hurtigere end hendes blik. Du bytter flasken ud med en klump mudder og drikker selv saften.`]: `Your hands are faster than her eyes. You replace the bottle with a lump of mud and drink the sap yourself.`,
  [`Du snupper flasken og drikker. Saften koger i maven og trækker kroppen sammen i en voldsom krampe.`]: `You snatch the bottle and drink. The sap boils in your stomach and sends your body into a violent spasm.`,
  [`Du stjæler flasken og kræver en høj pris for at give den tilbage. Lederen betaler.`]: `You steal the bottle and demand a high price to return it. The leader pays.`,
  [`Sværdet rammer rent. Krystallen splintrer, og træet dør med det samme. Du samler det største stykke og de værdifulde splinter op.`]: `The sword strikes cleanly. The crystal shatters, and the tree dies at once. You collect the largest piece and the valuable shards.`,
  [`Slaget udløser en trykbølge, der knuser klingen og kaster dig ind i en stamme. Våbnet er tabt, men træet dør.`]: `The blow releases a shock wave that shatters the blade and throws you into a trunk. The weapon is lost, but the tree dies.`,
  [`Du knuser hjertet. Gløden forsvinder, og den gamle mand falder om. Under rødderne finder du hans skjulte mønter.`]: `You crush the heart. Its glow fades, and the old man collapses. Beneath the roots, you find his hidden coins.`,
  [`Pilen borer sig ind bag stenen og vipper den fri. Varmen falder, så du kan tage krystallen med hænderne.`]: `The arrow drives in behind the stone and levers it free. The heat subsides, allowing you to pick up the crystal.`,
  [`Pilen går forbi og rammer en lomme fuld af saft. Den varme damp svier øjne og luftveje.`]: `The arrow misses and pierces a pocket of sap. The hot vapor burns your eyes and airways.`,
  [`Skuddet deler stenen i to. Lederen griber den ene halvdel, og du tager den anden uden at diskutere.`]: `The shot splits the stone in two. The leader grabs one half, and you take the other without arguing.`,
  [`Træet tager imod byttet. Krystallen triller ud, og rødderne falder til ro med din diamant i stammen.`]: `The tree accepts the trade. The crystal rolls out, and the roots settle with your diamond inside the trunk.`,
  [`Træet sluger diamanten og sender en stråle syre mod dit ansigt. Det vil have mere end betaling.`]: `The tree swallows the diamond and spits acid at your face. It wants more than payment.`,
  [`Den gamle mand sluger diamanten. Han løsner grebet, og rødderne skubber rustning, våben og mønter op af jorden.`]: `The old man swallows the diamond. He loosens his grip, and the roots push armor, weapons and coins out of the ground.`,
  [`Hun accepterer. Sammen vrikker I stenen fri og deler værdien med det samme.`]: `She accepts. Together, you work the stone loose and split its value on the spot.`,
  [`Hun snyder dig og stikker af med stenen, mens træet pisker dig over ansigtet med en gren.`]: `She cheats you and runs off with the stone while the tree lashes your face with a branch.`,
  [`I taler for længe. Krystallen smelter væk, men efterlader de tidligere ofres mønter i det åbne hulrum.`]: `The negotiation takes too long. The crystal melts away, but leaves coins from earlier victims lying in the open.`,
  [`Du sender en modpuls gennem stammen. Forbindelsen brister, og gløden forsvinder stille fra træet. Stenen er din.`]: `You send a counter-pulse through the trunk. The connection breaks, and the tree’s glow fades. The stone is yours.`,
  [`Magien slår hårdere tilbage end ventet og dræner dine kræfter. Til sidst slipper træet stenen.`]: `The magic strikes back harder than expected and drains your strength. At last, the tree releases the stone.`,
  [`Du slukker træets magi helt. Den gamle mand takker og åbner sit skjulte lager. Du tager mønterne og en metaldetektor.`]: `You extinguish the tree’s magic. The old man thanks you and opens his hidden cache. You take the coins and a metal detector.`,
  [`Du trækker dig tilbage og lader lysningen ligge. Først mellem de næste træer falder pulsen til ro.`]: `You retreat and leave the clearing behind. Your pulse settles only once you are among the trees beyond it.`,
  [`På vej væk træder du på en rod skjult i mudderet og vrider anklen slemt. Du kommer ud, men hvert skridt gør ondt.`]: `On the way out, you step on a root hidden in the mud and badly twist your ankle. You make it out, but every step hurts.`,
  [`Ved kanten af lysningen finder du en efterladt skovl. Du tager den med, før tågen lukker sig bag dig.`]: `At the edge of the clearing, you find an abandoned shovel. You take it before the fog closes behind you.`,
  [`De orker ikke at diskutere. Med vrede blikke kaster de deres møntposer over til dig.`]: `They have no energy to argue. They throw their coin pouches to you with angry looks.`,
  [`Lederen nægter først og flænser dig med kniven. Da hun ser, at du ikke giver dig, betaler hun.`]: `The leader refuses at first and slashes you with her knife. When she sees that you will not back down, she pays.`,
  [`De betaler uden et ord. Mønterne klirrer koldt i lommen. Du har overlevet. De har overlevet. Intet mere.`]: `They pay without a word. The coins clink coldly in your pocket. You survived. They survived. Nothing more.`,
  [`Turen ud bliver rolig. Kroppen får tid til at komme sig, og skovhuggerne takker dig med de mønter, de kan undvære.`]: `The walk out is quiet. Your body has time to recover, and the woodcutters thank you with the coins they can spare.`,
  [`På vejen falder en tung gren og rammer dig i hovedet. Du får dem ud, men må betale prisen.`]: `A heavy branch falls and hits you on the head. You get them out, but the effort costs you.`,
  [`Du får alle sikkert ud. Ved skovbrynet presser en af dem en lille ædelsten i din hånd som tak.`]: `You lead everyone out safely. At the forest edge, one of them presses a small gemstone into your hand in thanks.`,
  [`Ingen tør modsige din ordre. Du tager alt af værdi fra lysningen. Beskidt arbejde, men en god forretning.`]: `No one dares challenge your order. You take everything of value from the clearing. Dirty work, but profitable.`,
  [`En skovhugger gør desperat modstand. Du får mønterne, men ikke uden skrammer.`]: `A woodcutter resists desperately. You get the coins, but not without a few scrapes.`,
  [`Den gamle mand accepterer din ordre. Du tager mønterne og en sabel, der ligger i mudderet.`]: `The old man accepts your order. You take the coins and a saber lying in the mud.`
};

for (const event of Object.values(blodskovensHjerteEvents)) {
  for (const valg of event.valg) {
    for (const udfald of valg.udfaldListe || []) {
      udfald.logEn ||= blodskovLogEn[udfald.log];
    }
  }
}
