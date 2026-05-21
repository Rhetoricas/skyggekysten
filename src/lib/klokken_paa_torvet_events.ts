export const klokkenPaaTorvetEvents = {
  klokken_paa_torvet: {
    id: 'klokken_paa_torvet',
    titel: 'Klokken på torvet',
    biome: ['by', 'marked'],
    tekst: `Markedet er tæt af folk. Der lugter af brød, vådt uld og for mange mennesker på for lidt plads.

Ved apotekerboden holder to vagter en dreng fast. Han har en lille grøn flaske i hånden. Købmanden siger, at flasken er stjålet. En kvinde fra febervognen siger, at flasken kan redde én i vognen, måske flere hvis den blandes op. Drengen siger kun: “Hun gav mig mad, da ingen andre gjorde.”

Over toldhuset hænger en klokke. Den slår ikke ved løgn. Den slår ved halve sandheder. Lige nu står den og dirrer, som om alle på torvet har sagt nok til at få ret og nok til at tage fejl.`,
    unik: true,
    erSubTrin: false,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Bed alle tie stille og hør drengen, købmanden og kvinden før du vælger side.',
        udfaldListe: [
          { log: `Folk bliver ikke rolige, men de bliver nysgerrige. Det er næsten lige så brugbart. Drengen holder op med at rive i vagternes hænder.`, maxHpAendring: 3, naesteTrin: 'klokken_vidnerne' },
          { log: `Købmanden smiler for længe, da du beder om ro. Han kan godt lide regler, når han kender dem bedre end andre.`, hpAendring: -5, naesteTrin: 'klokken_vidnerne' },
          { log: `En brødkurv vælter, mens folk skubber for at høre med. Du samler et par tabte mønter op og lægger dem synligt på boden. Det køber dig få minutters tillid.`, guldAendring: 35, naesteTrin: 'klokken_vidnerne' }
        ]
      },
      {
        tekst: 'Tag flasken fra drengen og løb den direkte til febervognen.',
        udfaldListe: [
          { log: `Du når vognen, før vagterne når dig. Kvinden ser ikke taknemmelig ud. Hun ser lettet og bange ud, fordi valget nu lander hos hende.`, hpAendring: -12, naesteTrin: 'klokken_febervognen' },
          { log: `En hånd griber efter dig, og flasken rammer dine ribben hårdt. Den går ikke i stykker. Det gør noget af torvets ro til gengæld.`, hpAendring: -18, naesteTrin: 'klokken_febervognen' },
          { log: `Mængden åbner sig, fordi ingen vil være den, der stoppede medicin på vej mod en syg. Købmanden råber, at medlidenhed også kan være tyveri.`, maxHpAendring: 4, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Aflever drengen til vagterne og kræv en rigtig afgørelse, ikke et torveslagsmål.',
        udfaldListe: [
          { log: `Vagterne retter ryggen, da du vælger orden. Drengen ser på dig, som om du lige har flyttet ham fra én fare til en anden.`, guldAendring: 70, naesteTrin: 'klokken_vagtstuen' },
          { log: `Folk buher ikke. De bliver stille. Den slags stilhed kan både være respekt og fejhed.`, maxHpAendring: -3, hpAendring: 10, naesteTrin: 'klokken_vagtstuen' },
          { log: `Købmanden nikker hurtigt. For hurtigt. Vagten ved siden af ham gemmer en lille kvittering i ærmet.`, hpAendring: -6, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Betal købmanden for flasken og køb ro, før nogen kommer mere til skade.',
        puljeVaerdi: 180,
        udfaldListe: [
          { log: `Købmanden tager pengene med et ansigt, der ligner tak. Torvet ser nu på dig, som om du ejer problemet.`, maxHpAendring: -4, naesteTrin: 'klokken_koebte_ro' },
          { log: `Flasken skifter hænder uden flere slag. Det føles fornuftigt. Det føles også som om prisen lige blev en del af sandheden.`, hpAendring: 8, naesteTrin: 'klokken_koebte_ro' },
          { log: `En af vagterne skriver dit navn på kvitteringen, selvom du ikke bad om det. Den slags papir kan beskytte dig. Det kan også finde dig senere.`, guldAendring: 50, naesteTrin: 'klokken_koebte_ro' }
        ]
      },
      {
        tekst: 'Som tyv læser du hænderne på torvet i stedet for ansigterne.',
        kraeverKarakter: 'thief_m',
        udfaldListe: [
          { log: `Du ser tre små bevægelser, som andre overser: en vagt gemmer en kvittering, en lærling skjuler en reserveflaske, og drengen knytter ikke flasken, men en lap papir.`, naesteTrin: 'klokken_skyggerne' },
          { log: `Du går tættere på uden at skubbe. En gammel vane gør dig næsten usynlig, men næsten er ikke altid nok på et bange torv.`, hpAendring: -7, naesteTrin: 'klokken_skyggerne' },
          { log: `Du ser, at drengen ikke flygter mod porten. Han kigger hele tiden mod gyden bag bageren.`, maxHpAendring: 4, naesteTrin: 'klokken_skyggerne' }
        ]
      },
      {
        tekst: 'Som skygge læser du hænderne på torvet i stedet for ansigterne.',
        kraeverKarakter: 'thief_f',
        udfaldListe: [
          { log: `Du ser tre små bevægelser, som andre overser: en vagt gemmer en kvittering, en lærling skjuler en reserveflaske, og drengen knytter ikke flasken, men en lap papir.`, naesteTrin: 'klokken_skyggerne' },
          { log: `Du går tættere på uden at skubbe. En gammel vane gør dig næsten usynlig, men næsten er ikke altid nok på et bange torv.`, hpAendring: -7, naesteTrin: 'klokken_skyggerne' },
          { log: `Du ser, at drengen ikke flygter mod porten. Han kigger hele tiden mod gyden bag bageren.`, maxHpAendring: 4, naesteTrin: 'klokken_skyggerne' }
        ]
      },
      {
        tekst: 'Som hertug kræver du, at prisen bliver sat efter byens takst, ikke købmandens vrede.',
        kraeverKarakter: 'royal_m',
        udfaldListe: [
          { log: `Købmændene hører titlen før de hører ordene. De fattige hører det også. Der kommer ro, men ikke den samme slags ro hos alle.`, naesteTrin: 'klokken_taksten' },
          { log: `Vagterne giver dig plads. En plads kan bruges til at hjælpe. Den kan også ligne ejerskab.`, maxHpAendring: 5, naesteTrin: 'klokken_taksten' },
          { log: `Købmanden bukker kort og begynder straks at tale om erstatning. Han er ikke knust. Han er bare flyttet over på et sprog, han kender godt.`, guldAendring: -40, naesteTrin: 'klokken_taksten' }
        ]
      },
      {
        tekst: 'Som hertuginde kræver du, at prisen bliver sat efter byens takst, ikke købmandens vrede.',
        kraeverKarakter: 'royal_f',
        udfaldListe: [
          { log: `Købmændene hører titlen før de hører ordene. De fattige hører det også. Der kommer ro, men ikke den samme slags ro hos alle.`, naesteTrin: 'klokken_taksten' },
          { log: `Vagterne giver dig plads. En plads kan bruges til at hjælpe. Den kan også ligne ejerskab.`, maxHpAendring: 5, naesteTrin: 'klokken_taksten' },
          { log: `Købmanden bukker kort og begynder straks at tale om erstatning. Han er ikke knust. Han er bare flyttet over på et sprog, han kender godt.`, guldAendring: -40, naesteTrin: 'klokken_taksten' }
        ]
      }
    ]
  },

  klokken_vidnerne: {
    id: 'klokken_vidnerne',
    titel: 'Tre forklaringer',
    biome: ['by', 'marked'],
    tekst: `Du får de tre forklaringer frem.

Drengen stjal flasken. Det siger han selv, selvom han næsten ikke kan få ordene ud.

Købmanden ejer flasken lovligt. Han købte et parti fra byens nødkasse, da rådet manglede penge til murværket ved nordporten.

Kvinden i febervognen er ikke drengens mor. Hun gav ham brød gennem vinteren. Nu ligger hun og ryster under en frakke, der ikke er hendes.

Klokken slår én gang. Ikke for løgn. For noget, der mangler.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Sig hele sandheden højt, også den del der kan starte et oprør.',
        udfaldListe: [
          { log: `Torvet suger ordene til sig. Nogle bliver vrede på købmanden. Andre bliver vrede på rådet. En mand råber, at en syg kvinde ikke bliver rask af retfærdighed alene.`, hpAendring: -10, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden mister farven i ansigtet, da du nævner nødkassen. Drengen ser for første gang mindre alene ud.`, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du får det hele sagt, men ikke i den rækkefølge folk kan tåle. Der går en bølge gennem mængden, og nogen vælter en bod.`, hpAendring: -16, guldAendring: 45, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Hold nødkassen ude af historien for nu og få flasken hen til de syge.',
        udfaldListe: [
          { log: `Du vælger ro frem for fuld åbenhed. Det føles ikke rent, men det får fødder til at flytte sig i retning af febervognen.`, hpAendring: 8, naesteTrin: 'klokken_febervognen' },
          { log: `Købmanden hører, hvad du ikke siger. Han slapper af. Den afslapning koster dig noget indeni.`, maxHpAendring: -3, naesteTrin: 'klokken_febervognen' },
          { log: `Drengen forstår, at du beskytter ham og måske også beskytter den mand, han stjal fra. Han siger ikke tak. Det ville være for enkelt.`, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Spørg hvem flasken skal redde, før du spørger hvem den tilhører.',
        udfaldListe: [
          { log: `Kvinden i vognen lukker øjnene. Lægen svarer i stedet: én fuld dosis kan redde én nu. En tynd blanding kan holde flere i live til i morgen.`, naesteTrin: 'klokken_dosis' },
          { log: `Spørgsmålet rammer hårdere end en dom. Folk opdager, at ejerskab kun er den første knude.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' },
          { log: `Drengen begynder at græde lydløst. Ikke fordi han er uskyldig. Fordi han måske ikke selv ved, hvilket svar han håber på.`, hpAendring: -4, naesteTrin: 'klokken_dosis' }
        ]
      },
      {
        tekst: 'Lad søgekvisten pege på den sande mangel, ikke den største stemme.',
        kraeverItem: 'soegekvist',
        udfaldListe: [
          { log: `Kvisten peger ikke på flasken. Den peger bag apotekerboden, hvor en hjælper står alt for stille.`, naesteTrin: 'klokken_bag_boderne' },
          { log: `Kvisten ryster mellem febervognen og købmandens pengekasse. Mangel kan sidde i en krop. Den kan også sidde i en pris.`, maxHpAendring: 4, naesteTrin: 'klokken_bag_boderne' },
          { log: `Kvisten knækker og falder mod drengens lukkede hånd. Han gemmer ikke flere flasker. Han gemmer et navn.`, mistItem: 'soegekvist', naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Kør metaldetektoren under bodens gulvbrædder, mens de andre skændes.',
        kraeverItem: 'metaldetektor',
        udfaldListe: [
          { log: `Detektoren skratter under købmandens bord. Du finder en tynd metalplade med navne ridset ind. Den ligner ikke pynt. Den ligner gæld.`, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du finder en falsk bund med små betalinger sorteret efter mærker. Hver mønt er lovlig. Mønsteret føles mindre lovligt.`, guldAendring: 80, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Detektoren hyler, og mængden vender sig mod dig. Du har fundet noget, men du har også gjort dig selv til midten af sagen.`, hpAendring: -9, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Giv drengen mad og spørg ham, hvem han egentlig prøver at redde.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: `Han spiser for hurtigt og bliver flov over det. Så siger han et navn, der får kvinden i febervognen til at åbne øjnene.`, hpAendring: 6, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Maden gør ham ikke ærlig. Den gør ham mindre bange. Det er ikke det samme, men det er tæt nok til at hjælpe.`, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `En anden sulten hånd rækker ud efter maden. Drengen deler uden at se på dig. Nu ved du lidt mere om ham og lidt mindre om, hvad han fortjener.`, hpAendring: 8, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      }
    ]
  },

  klokken_febervognen: {
    id: 'klokken_febervognen',
    titel: 'Febervognen',
    biome: ['by', 'marked'],
    tekst: `Febervognen står bag fiskeboderne, hvor luften er køligere og lugter af eddike. Fem mennesker ligger på halm. Kun én af dem kender drengen.

Lægen holder flasken op mod lyset. “Fuld styrke redder nok én. Blandet op kan den købe tid til flere. Gemmer vi den som bevis, kan vi måske få hele nødkassen tilbage.”

Kvinden, drengen stjal for, åbner øjnene. “Lad være med at gøre mig til en god grund, hvis jeg ikke er det,” siger hun.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Giv hele dosen til kvinden, fordi hun er grunden til at drengen handlede.',
        udfaldListe: [
          { log: `Kvinden får farve i kinderne. Drengen synker sammen af lettelse. Lægen ser på de andre senge og siger ingenting.`, hpAendring: 14, maxHpAendring: -3, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Hun overlever de første minutter. Det er ikke en garanti, men det er mere end hun havde. En mand i den næste seng vender ansigtet væk.`, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Dosen virker, men kvinden bruger sin første klare sætning på at sige, at drengen ikke skal skylde hende sit liv.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Bland dosen op, så flere får en chance, men ingen får et løfte.',
        udfaldListe: [
          { log: `Lægen fordeler blandingen med rolige hænder. Ingen jubler. Fem mennesker trækker vejret lidt lettere, og fem familier tør håbe en smule længere.`, maxHpAendring: 8, hpAendring: 5, naesteTrin: 'klokken_borgerraadet' },
          { log: `Blandingen virker langsomt. For langsomt for dem, der ville se et mirakel. Torvet kommer til at kalde valget klogt eller fejt alt efter hvem der vågner i morgen.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En af patienterne får det værre, før de andre får det bedre. Lægen beder dig holde fast i sengen. Din beslutning bliver fysisk.`, hpAendring: -12, maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Gem flasken forseglet som bevis og bed lægen klare natten uden den.',
        udfaldListe: [
          { log: `Lægen hader valget, men hun forstår det. Hvis flasken kan bevise misbrug af nødkassen, kan næste flaske komme uden tyveri. Natten bliver lang.`, hpAendring: -8, maxHpAendring: 8, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Kvinden nikker svagt, som om hun nægter at være vigtigere end alle dem, der endnu ikke ligger her. Drengen hører det som afvisning.`, maxHpAendring: 6, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Flasken bliver lagt i en låst kasse. Lyden af låsen får alle i vognen til at se mindre syge og mere alene ud.`, hpAendring: -14, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Brug din egen livseliksir, så flasken kan blive i sagen.',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: `Din eliksir skaber ro med det samme. Roen er dyr, men den køber et valg mere i stedet for at lukke valget her.`, maxHpAendring: 10, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Lægen bruger din eliksir med en blanding af lettelse og irritation. Hun ved, at gaver kan skjule et system, der stadig er sygt.`, hpAendring: 16, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' },
          { log: `Eliksiren redder én hurtigt og giver de andre tid nok til, at ingen kan kalde det simpelt. Drengen ser på dig, som om helte også kan gøre ham træt.`, maxHpAendring: 8, hpAendring: 10, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Som troldmand undersøger du flasken for magi, før nogen drikker den.',
        kraeverKarakter: 'magician_m',
        udfaldListe: [
          { log: `Flasken er ægte, men forseglingen er flyttet fra en anden kasse. Magien viser ikke skyld. Den viser hænder.`, hpAendring: -6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du mærker to blandinger i samme flaske. Den kan hjælpe, men ikke uden risiko. Folk hader usikkerhed mere, når de allerede har valgt side.`, maxHpAendring: 7, naesteTrin: 'klokken_dosis' },
          { log: `Din stav bliver kold. Ikke ondskabskold. Lagerkold. Flasken har ligget et sted, hvor nødhjælp blev regnet som vare.`, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Som troldkvinde undersøger du flasken for magi, før nogen drikker den.',
        kraeverKarakter: 'magician_f',
        udfaldListe: [
          { log: `Flasken er ægte, men forseglingen er flyttet fra en anden kasse. Magien viser ikke skyld. Den viser hænder.`, hpAendring: -6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du mærker to blandinger i samme flaske. Den kan hjælpe, men ikke uden risiko. Folk hader usikkerhed mere, når de allerede har valgt side.`, maxHpAendring: 7, naesteTrin: 'klokken_dosis' },
          { log: `Din stav bliver kold. Ikke ondskabskold. Lagerkold. Flasken har ligget et sted, hvor nødhjælp blev regnet som vare.`, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Riv tøj til kolde omslag og køb tid med hænderne i stedet for flasken.',
        kosterItem: 'klude',
        udfaldListe: [
          { log: `Tøj er ikke medicin, men det er noget. En af patienterne holder op med at ryste så voldsomt. Det lille hjælper ikke nok. Det hjælper alligevel.`, hpAendring: 10, maxHpAendring: 3, naesteTrin: 'klokken_dosis' },
          { log: `Du arbejder så længe ved sengene, at torvets råb bliver fjerne. Det føles godt at gøre noget konkret, også når det ikke afgør sagen.`, hpAendring: -5, maxHpAendring: 8, naesteTrin: 'klokken_dosis' },
          { log: `Lægen tager imod kludene uden ceremoni. Hun har ikke brug for pæne følelser. Hun har brug for tørre hænder og mere tid.`, hpAendring: 12, naesteTrin: 'klokken_dosis' }
        ]
      }
    ]
  },

  klokken_vagtstuen: {
    id: 'klokken_vagtstuen',
    titel: 'Vagtstuen',
    biome: ['by', 'marked'],
    tekst: `Vagtstuen ligger bag toldhuset. Her lugter af støv, blæk og gammel kaffe. Drengen sidder på en bænk med hænderne bundet foran sig.

Købmanden har allerede sendt en kvittering ind. Den siger, at flasken er hans. Vagten siger, at loven er klar. Så sænker hun stemmen og siger, at klare love stadig kan bruges beskidt.

Udenfor råber torvet på en afgørelse. Inde i stuen vil alle gerne have dig til at kalde deres løsning ansvarlig.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Kræv en offentlig høring, selvom det kan gøre torvet farligere.',
        udfaldListe: [
          { log: `Vagten sukker og åbner døren. Offentlighed er ikke altid retfærdighed, men mørke rum har heller ikke været venlige mod drenge som ham.`, naesteTrin: 'klokken_borgerraadet' },
          { log: `Drengen ser mere bange ud ved tanken om folket end ved tanken om cellen. Det fortæller dig noget om begge steder.`, hpAendring: -6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmandens skriver løber foran jer for at samle sine folk. Du får din høring, men du får ikke en tom scene.`, guldAendring: -35, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Betal drengens kaution og tag ansvaret for, at han møder op senere.',
        puljeVaerdi: 100,
        udfaldListe: [
          { log: `Vagten løsner rebet. Drengen gnider håndleddene og ser på døren, som om frihed også kan være en fælde.`, hpAendring: 8, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Kautionen bliver skrevet ned med dit navn. Loven har nu fået fat i dig i stedet for kun i ham.`, maxHpAendring: -2, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Vagten tager imod pengene og hvisker, at du ikke skal lade ham løbe alene. Det lyder som et råd, ikke en ordre.`, maxHpAendring: 4, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Tag købmandens vidnepenge og lad sagen gå sin almindelige gang.',
        udfaldListe: [
          { log: `Pengene er varme fra hans hånd. Du fortæller dig selv, at loven også skal have lov at virke uden din indblanding. Det er ikke nødvendigvis falsk.`, guldAendring: 140, maxHpAendring: -5 },
          { log: `Drengen bliver ført ind i baglokalet. Han råber ikke. Det gør det sværere at hade valget og lettere at bære det forkert.`, guldAendring: 110, hpAendring: -8 },
          { log: `Vagten ser ikke imponeret ud, men hun stopper dig heller ikke. Byer lever også af, at nogen ikke gør alle sager større.`, guldAendring: 95, hpAendring: 10 }
        ]
      },
      {
        tekst: 'Som ridder stiller du dig mellem vagterne og torvet og kræver ro på begge sider.',
        kraeverKarakter: 'knight_m',
        udfaldListe: [
          { log: `Rustningen gør dig synlig nok til, at folk holder afstand. Den gør dig ikke automatisk klog nok til at dømme. Det er en nyttig ydmygelse.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En sten rammer skulderen og springer af rustningen. Nogen bag dig får ikke stenen i ansigtet. Orden kan også være kropsarbejde.`, hpAendring: -7, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vagterne slapper af, da du tager pladsen i døren. Det hjælper. Det giver dem også mindre grund til selv at stå til ansvar.`, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Som skjoldmø stiller du dig mellem vagterne og torvet og kræver ro på begge sider.',
        kraeverKarakter: 'knight_f',
        udfaldListe: [
          { log: `Rustningen gør dig synlig nok til, at folk holder afstand. Den gør dig ikke automatisk klog nok til at dømme. Det er en nyttig ydmygelse.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En sten rammer skulderen og springer af rustningen. Nogen bag dig får ikke stenen i ansigtet. Orden kan også være kropsarbejde.`, hpAendring: -7, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vagterne slapper af, da du tager pladsen i døren. Det hjælper. Det giver dem også mindre grund til selv at stå til ansvar.`, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Som ork siger du, at den stærkeste i rummet skal bære mest skyld, ikke mindst.',
        kraeverKarakter: 'orc_m',
        udfaldListe: [
          { log: `Vagterne hører truslen, men drengen hører reglen. Købmandens skriver hører, at hans stol ikke længere står helt sikkert.`, hpAendring: -5, maxHpAendring: 9, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du slår ikke nogen. Du behøver ikke. Det giver dig plads, men det farver også alt, du siger bagefter.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En vagt kalder dig brutal. Drengen ser på de bundne hænder og spørger, hvem der begyndte med brutaliteten.`, hpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Som klanleder siger du, at den stærkeste i rummet skal bære mest skyld, ikke mindst.',
        kraeverKarakter: 'orc_f',
        udfaldListe: [
          { log: `Vagterne hører truslen, men drengen hører reglen. Købmandens skriver hører, at hans stol ikke længere står helt sikkert.`, hpAendring: -5, maxHpAendring: 9, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du slår ikke nogen. Du behøver ikke. Det giver dig plads, men det farver også alt, du siger bagefter.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En vagt kalder dig brutal. Drengen ser på de bundne hænder og spørger, hvem der begyndte med brutaliteten.`, hpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      }
    ]
  },

  klokken_koebte_ro: {
    id: 'klokken_koebte_ro',
    titel: 'Den købte ro',
    biome: ['by', 'marked'],
    tekst: `Pengene skifter hænder. Torvet bliver stille på den måde, folk bliver stille, når nogen rigere end dem tager en beslutning.

Købmanden giver dig flasken og en kvittering. Nederst står der med små bogstaver: Hvis flasken bruges uden lægens stempel, hæfter køberen for følgerne.

Du har skaffet ro. Nu vil alle vide, hvad du vil bruge den til.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Riv kvitteringen over og giv flasken til lægen uden flere betingelser.',
        udfaldListe: [
          { log: `Papiret går let i stykker. Folk klapper, men lægen ser bekymret ud. Papir kan være gift. Det kan også være værn.`, maxHpAendring: 5, naesteTrin: 'klokken_febervognen' },
          { log: `Købmanden smiler, da du ødelægger beviset for prisen. Du har vundet en flaske og mistet en mulig sag.`, hpAendring: 8, maxHpAendring: -3, naesteTrin: 'klokken_febervognen' },
          { log: `Drengen ser lettet ud, fordi flasken bevæger sig mod vognen. Han ser ikke, hvad kvitteringen kunne have gjort senere.`, hpAendring: 10, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Gem kvitteringen og brug den til at tvinge købmanden ind i en større sag.',
        udfaldListe: [
          { log: `Købmanden opdager for sent, at papiret også binder ham. Han skifter fra vrede til regning på et øjeblik.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du har ikke reddet nogen endnu. Du har skaffet et greb om manden, der satte prisen. Det føles koldt, men måske ikke forkert.`, hpAendring: -6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Vagten nikker næsten usynligt. Hun kan ikke tage sagen uden papir. Nu har hun papir.`, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Kræv, at købmanden sænker prisen på al medicin i dag, ellers fortæller du, hvad han tog for flasken.',
        udfaldListe: [
          { log: `Han sænker prisen med tænderne presset sammen. Nogle får råd til hjælp. Andre ser, at magt stadig sad hos den, der kunne true.`, guldAendring: 85, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden går med til det og hæver prisen på salt i stedet. Markedet kan flytte smerte hurtigt.`, guldAendring: 60, hpAendring: -6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Folk jubler, men lærlingen ved boden græder stille. Han ved, hvem der skal forklare tabet senere.`, maxHpAendring: 6, naesteTrin: 'klokken_bag_boderne' }
        ]
      },
      {
        tekst: 'Sælg flasken tilbage dyrere og forlad sagen, mens alle andre stadig skændes.',
        udfaldListe: [
          { log: `Handlen lykkes. Du fortæller dig selv, at ressourcer også redder liv senere. Det kan være sandt. Det gør ikke lyden fra febervognen mindre tydelig.`, guldAendring: 260, maxHpAendring: -6 },
          { log: `Købmanden køber den tilbage og kalder dig fornuftig. Det lyder ikke som en fornærmelse. Det lyder værre.`, guldAendring: 220, hpAendring: -8 },
          { log: `Du tjener på forvirringen. En dag kan de mønter måske betale for noget vigtigt. I dag betaler de for afstand.`, guldAendring: 190, maxHpAendring: -3 }
        ]
      },
      {
        tekst: 'Betal med en diamant og køb hele bodens medicinlager fri til lægen.',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: `Købmanden stirrer på diamanten, som om moral pludselig har fået en pris, han kan lide. Lægen får lageret. Torvet får et rygte om dig.`, givItem: 'livseliksir', maxHpAendring: 10, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Diamanten gør det muligt at hjælpe mange nu. Den gør også købmanden rigere end før. Man kan købe et godt resultat uden at rense den handel, der skabte behovet.`, hpAendring: 18, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lægen tager imod kassen og sender dig et kort blik. Taknemmelighed og vrede kan godt stå i samme ansigt.`, givItem: 'mad', maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Brug det fine tøj som pant, så flasken ikke længere kun handler om mønter.',
        kosterItem: 'flot_toej',
        udfaldListe: [
          { log: `Det fine stof ligger på boden som et mærke på status, du kan undvære. Købmanden tager imod. Folk ser, at pris kan betales på flere måder.`, hpAendring: 12, maxHpAendring: 5, naesteTrin: 'klokken_febervognen' },
          { log: `Købmanden vurderer tøjet uden skam. Det giver dig kvalme, men også flasken uden mere blod på torvet.`, hpAendring: 8, naesteTrin: 'klokken_febervognen' },
          { log: `En kvinde i mængden ler bittert og siger, at fint tøj stadig er en lettere pris end en nat i gældskælderen. Hun tager ikke fejl.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      }
    ]
  },

  klokken_skyggerne: {
    id: 'klokken_skyggerne',
    titel: 'Hænder i mængden',
    biome: ['by', 'marked'],
    tekst: `Du ser torvet fra siden. Ikke som en dommer, men som en, der ved, at folk viser sandheden med hænderne først.

Købmandens lærling har en reserveflaske i inderlommen. Vagten med det pæne skæg har en kvittering, der ikke passer til dagens dato. Drengen gemmer en lap papir med tre navne. Ingen af dem er hans eget.

Du kan gøre noget hurtigt. Hurtige ting løser sjældent hele sagen, men de kan åbne en vej.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Stjæl lappen med navne fra drengen og find ud af, hvem han beskytter.',
        udfaldListe: [
          { log: `Navnene er patienter, ikke medskyldige. Drengen har planlagt at dele dosen, selvom han råbte, at flasken var til én. Klokken dirrer ved hans halve sandhed.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' },
          { log: `Du tager lappen uden at han mærker det. Det føles rent teknisk. Så ser du, at det første navn er skrevet med en voksens hånd.`, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Drengen opdager dig og kalder dig tyv. Det rammer mængden skævt, fordi han selv står med flasken.`, hpAendring: -8, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Stjæl reserveflasken fra lærlingen og lad alle tro, at der stadig kun er én.',
        udfaldListe: [
          { log: `Flasken glider ind under din kappe. Nu kan du redde nogen uden at vinde sagen. Eller vinde sagen uden at redde nogen.`, givItem: 'livseliksir', maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lærlingen mærker lommetabet og bliver hvid i ansigtet. Han er ikke uskyldig, men han er heller ikke manden øverst i regnskabet.`, hpAendring: -9, givItem: 'livseliksir', naesteTrin: 'klokken_bag_boderne' },
          { log: `Du får flasken, men ikke ubemærket. En gammel kone ser det og nikker, som om hun netop har set både forbrydelse og hjælp.`, givItem: 'livseliksir', maxHpAendring: 3, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Stjæl købmandens mønter og brug dem til at betale drengens bøde.',
        udfaldListe: [
          { log: `Pungen er tung nok til både bøde og vrede. Du flytter penge fra den stærkes lomme til lovens bord. Det er elegant, men ikke rent.`, guldAendring: 120, naesteTrin: 'klokken_vagtstuen' },
          { log: `Du får pungen, men købmandens skriver ser din albue. Nu kan drengens sag og din sag blandes sammen.`, guldAendring: 90, hpAendring: -10, naesteTrin: 'klokken_vagtstuen' },
          { log: `Du lader et par mønter falde synligt foran vagten. Hun forstår måske ikke alt, men hun forstår nok til at holde munden lukket et øjeblik.`, guldAendring: 60, maxHpAendring: 4, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Skær snoren til apotekerbodens markise og skab forvirring nok til at få drengen væk.',
        kraeverItem: 'kniv',
        udfaldListe: [
          { log: `Markisen falder ned som et vådt sejl. Drengen slipper fri. En ældre mand får et slag over skulderen, men ingen bliver trampet ned.`, hpAendring: -7, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Forvirringen virker for godt. Folk løber i tre retninger, og flasken forsvinder et øjeblik ud af alles historie.`, hpAendring: -14, givItem: 'kniv', naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Drengen er væk, men hans lap med navne ligger tilbage på brostenene. Det er måske bedre end en tilståelse. Måske værre.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' }
        ]
      },
      {
        tekst: 'Fortæl lærlingen stille, at du har set reserveflasken, og kræv sandheden uden at udlevere ham endnu.',
        udfaldListe: [
          { log: `Han bryder ikke sammen. Han forhandler. Det gør ham mindre uskyldig og mere nyttig.`, naesteTrin: 'klokken_bag_boderne' },
          { log: `Lærlingen hvisker, at reserveflasken ikke er til salg. Den er til købmandens egen familie, hvis feberen når deres hus.`, maxHpAendring: 4, naesteTrin: 'klokken_dosis' },
          { log: `Han giver dig et navn fra gældsbogen for at redde sit eget. Det er ikke mod. Det er stadig en åbning.`, guldAendring: 40, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Som joker gør du tyveriet til en forestilling, så alle griner før de dømmer.',
        kraeverKarakter: 'joker_m',
        udfaldListe: [
          { log: `Du får torvet til at le, og latteren løsner grebet om drengen. Den gør også smerten mindre tydelig. Det kan være hjælp. Det kan være flugt.`, hpAendring: 12, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vittigheden rammer købmanden hårdt og en syg familie endnu hårdere. Folk ler, men ikke alle bliver mindre onde af det.`, guldAendring: 80, hpAendring: -8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du skjuler en sandhed i en spøg, og klokken slår lavt. Den kender dit fag.`, maxHpAendring: 7, naesteTrin: 'klokken_skyggerne' }
        ]
      },
      {
        tekst: 'Som harlekin gør du tyveriet til en forestilling, så alle griner før de dømmer.',
        kraeverKarakter: 'joker_f',
        udfaldListe: [
          { log: `Du får torvet til at le, og latteren løsner grebet om drengen. Den gør også smerten mindre tydelig. Det kan være hjælp. Det kan være flugt.`, hpAendring: 12, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vittigheden rammer købmanden hårdt og en syg familie endnu hårdere. Folk ler, men ikke alle bliver mindre onde af det.`, guldAendring: 80, hpAendring: -8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du skjuler en sandhed i en spøg, og klokken slår lavt. Den kender dit fag.`, maxHpAendring: 7, naesteTrin: 'klokken_skyggerne' }
        ]
      }
    ]
  },

  klokken_taksten: {
    id: 'klokken_taksten',
    titel: 'Byens takst',
    biome: ['by', 'marked'],
    tekst: `Da du nævner byens takst, kommer der straks flere dokumenter frem. Ingen er helt enige om, hvad de betyder. Det passer købmanden fint. Det passer vagterne næsten lige så fint.

En gammel markedskone siger højt: “Når fine folk sætter prisen ned, kalder de det orden. Når fattige gør det, kalder de det tyveri.”

Hun siger det uden at hade dig. Det gør det sværere at afvise.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Sæt en lav pris efter loven og betal forskellen af egen lomme.',
        puljeVaerdi: 80,
        udfaldListe: [
          { log: `Købmanden må acceptere, fordi reglen står på papir. De fattige må acceptere, fordi du stadig betalte. Alle får noget. Ingen glemmer hvem der kunne vælge.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_febervognen' },
          { log: `Handlen går igennem. En ung mor køber også medicin til sin søn, fordi prisen falder. Et godt resultat kan godt have en ubehagelig form.`, givItem: 'mad', maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Du betaler forskellen og mærker straks, hvor let det er at ligne løsningen, når problemet var penge.`, hpAendring: 8, maxHpAendring: -2, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Tru med at tage købmandens stadeplads, hvis han ikke åbner sine bøger.',
        udfaldListe: [
          { log: `Han åbner ikke bøgerne af god vilje. Han åbner dem, fordi han kan miste mere end ansigt. Det virker, og det smager af tvang.`, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Købmændene omkring ham bliver stille. Hvis du kan knække én handelsmand i dag, kan du måske knække dem i morgen. Den frygt kan gøre gode ting korte.`, maxHpAendring: 5, hpAendring: -5, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `En lærling smutter om bag boden med noget under jakken. Trusler flytter sandhed. De får den ikke altid frem.`, naesteTrin: 'klokken_bag_boderne' }
        ]
      },
      {
        tekst: 'Frikend drengen her og nu og lad købmanden søge erstatning hos rådet.',
        udfaldListe: [
          { log: `Drengen løber ikke. Det overrasker alle. Måske stoler han på dig. Måske ved han bare ikke, hvor han ellers skal gå hen.`, maxHpAendring: 4, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Købmanden råber om overgreb. Han har en pointe, selvom han bruger den grimt.`, hpAendring: -8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Torvet jubler for hurtigt. Hurtig jubel kan være lige så farlig som hurtig straf.`, hpAendring: 10, maxHpAendring: -3, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Lad torvet stemme om prisen, selvom købmændene kalder det pøbelret.',
        udfaldListe: [
          { log: `Hænderne ryger op. Ikke alle forstår sagen. Mange forstår sult. Det er ikke et lille vidnesbyrd.`, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Afstemningen bliver grim, men ikke meningsløs. Folk, der normalt kun betaler, får et øjeblik lov at sætte pris.`, hpAendring: -9, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `En købmand lukker sin bod i protest. En anden sænker prisen, fordi hun ikke tør andet. Begge reaktioner kan ændre byen.`, guldAendring: 70, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Brug fint tøj som synligt pant for, at rådet skal betale tilbage senere.',
        kosterItem: 'flot_toej',
        udfaldListe: [
          { log: `Tøjet kommer op på væggen som en mærkelig garanti. Folk ler først. Så forstår de, at pantet gør dit løfte mindre luftigt.`, maxHpAendring: 8, naesteTrin: 'klokken_febervognen' },
          { log: `Rådsbuddet tager imod pantet med stor alvor. Det gør sagen mere officiel og mindre hurtig.`, hpAendring: -5, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' },
          { log: `Købmanden accepterer pantet, men kalder det teater. Han tager ikke helt fejl. Nogle gange virker teater, fordi alle kan se det.`, hpAendring: 6, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Lad prisen stå og kræv i stedet, at drengen arbejder gælden af uden fængsel.',
        udfaldListe: [
          { log: `Det lyder mildt ved siden af en celle. Det lyder mindre mildt, da drengen spørger, hvor mange år en flaske er værd.`, maxHpAendring: -4, hpAendring: 8, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Købmanden accepterer straks. For straks. Markedskonen lukker øjnene, som om hun har set den løsning for mange gange.`, hpAendring: -7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Vagterne kan lide forslaget, fordi det kræver færre papirer. Det gør ikke forslaget forkert. Det gør det værd at se nærmere på.`, maxHpAendring: 3, naesteTrin: 'klokken_vagtstuen' }
        ]
      }
    ]
  },

  klokken_bag_boderne: {
    id: 'klokken_bag_boderne',
    titel: 'Bag boderne',
    biome: ['by', 'marked'],
    tekst: `Bag apotekerboden står kasserne tæt. Her er torvets råb lavere, og tingene virker mere praktiske.

Du finder mærker fra byens nødkasse på flere af kasserne. Du finder også en reserveflaske pakket ind i uld. På låget står der: “Familiebrug.”

En lærling spærrer vejen. Han er bange på en anden måde end drengen. Drengen frygter straf. Lærlingen frygter at miste den plads, der holder hans egen familie fra samme vogn.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Tag reserveflasken til lægen og sig ikke noget om, hvor den kom fra.',
        udfaldListe: [
          { log: `Lægen tager flasken uden spørgsmål, fordi hun ikke har råd til rene hænder lige nu. Lærlingen får lov at beholde sit ansigt lidt længere.`, givItem: 'livseliksir', maxHpAendring: -2, naesteTrin: 'klokken_febervognen' },
          { log: `Du får flasken væk uden råb. Det hjælper de syge og lader købmandens system stå en dag mere.`, hpAendring: 10, maxHpAendring: -3, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lærlingen lader dig tage den og hvisker, at han hader dig for det i dag og måske takker dig i morgen.`, hpAendring: 8, naesteTrin: 'klokken_dosis' }
        ]
      },
      {
        tekst: 'Vis nødkasse-mærkerne offentligt og lad torvet se, hvad der blev solgt tilbage til dem.',
        udfaldListe: [
          { log: `Folk forstår mærkerne hurtigere end dokumenterne. En gammel mand spytter på brostenene og siger, at tyveriet startede før drengen.`, hpAendring: -8, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden råber, at han købte varerne lovligt. Klokken slår. Ikke fordi han lyver. Fordi lovligt ikke var hele sagen.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Nogen begynder at rive kasser op. Du har vist sandheden, men ikke bygget et sted den kan lande.`, hpAendring: -16, guldAendring: 60, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Lad lærlingen beholde flasken til sin familie mod at han giver dig gældsbogen.',
        udfaldListe: [
          { log: `Han tøver længe. Så vælger han papir over flaske, fordi papir kan skade den mand, han arbejder for. Hans familie får ingen sikkerhed i dag.`, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Han nægter først, men river til sidst en nøgle fri fra halsen. Du får adgang til bogen, ikke til hans taknemmelighed.`, hpAendring: -5, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Han beholder flasken og giver dig kun nogle sider. Det er ikke nok til at vælte nogen, men nok til at gøre dem bange.`, guldAendring: 45, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Køb lærlingens tavshed og reserveflasken med guld.',
        puljeVaerdi: 90,
        udfaldListe: [
          { log: `Han tager guldet, og du får flasken. Det er en hurtig løsning. Hurtige løsninger efterlader ofte den samme chef ved samme bod.`, givItem: 'livseliksir', maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lærlingen bruger guldet til at løbe. Du har fjernet et vidne og skaffet en flaske. Det kan være klogt. Det kan også være netop det, købmanden håbede.`, givItem: 'livseliksir', hpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han tager kun halvdelen og siger, at resten skal gå til febervognen. Du havde forventet et mere enkelt menneske.`, guldAendring: 35, maxHpAendring: 5, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Som jæger følger du lærlingens blik og finder den vej, han havde tænkt sig at flygte.',
        kraeverKarakter: 'hunter_m',
        udfaldListe: [
          { log: `Blikket fører dig til en bagport, hvor en lille pakke allerede ligger klar. Han planlagde ikke kun at hjælpe sin familie. Han planlagde at forsvinde.`, guldAendring: 70, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Du finder en kurér ved bagporten. Han bærer mærker fra en anden by. Varerne er ikke kun stjålet fra nødkassen. De er på vej ud af byen.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du følger sporet for længe og mister lyden fra torvet. Præcision kan også koste nærvær.`, hpAendring: -8, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Som skytte følger du lærlingens blik og finder den vej, han havde tænkt sig at flygte.',
        kraeverKarakter: 'hunter_f',
        udfaldListe: [
          { log: `Blikket fører dig til en bagport, hvor en lille pakke allerede ligger klar. Han planlagde ikke kun at hjælpe sin familie. Han planlagde at forsvinde.`, guldAendring: 70, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Du finder en kurér ved bagporten. Han bærer mærker fra en anden by. Varerne er ikke kun stjålet fra nødkassen. De er på vej ud af byen.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du følger sporet for længe og mister lyden fra torvet. Præcision kan også koste nærvær.`, hpAendring: -8, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Som kaptajn genkender du smuglerknuderne på medicinkasserne.',
        kraeverKarakter: 'pirate_m',
        udfaldListe: [
          { log: `Knuderne sidder som på et skib, der ikke vil registreres. Købmanden er måske ikke øverst i kæden. Det gør ham ikke uskyldig. Det gør sagen større.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du løsner den rigtige knude og finder et rum med mønter. Smuglere stoler mere på reb end på mennesker.`, guldAendring: 130, naesteTrin: 'klokken_borgerraadet' },
          { log: `En kurér ser, at du kender arbejdet. Han tilbyder dig en andel for at gå. Det er et grimt tilbud. Det er også et ærligt et.`, guldAendring: 170, maxHpAendring: -4 }
        ]
      },
      {
        tekst: 'Som korsar genkender du smuglerknuderne på medicinkasserne.',
        kraeverKarakter: 'pirate_f',
        udfaldListe: [
          { log: `Knuderne sidder som på et skib, der ikke vil registreres. Købmanden er måske ikke øverst i kæden. Det gør ham ikke uskyldig. Det gør sagen større.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du løsner den rigtige knude og finder et rum med mønter. Smuglere stoler mere på reb end på mennesker.`, guldAendring: 130, naesteTrin: 'klokken_borgerraadet' },
          { log: `En kurér ser, at du kender arbejdet. Han tilbyder dig en andel for at gå. Det er et grimt tilbud. Det er også et ærligt et.`, guldAendring: 170, maxHpAendring: -4 }
        ]
      },
      {
        tekst: 'Brug fakkel på kassemærkerne og se, hvilke segl der er ændret.',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: `Varmen får gammel voks til at svede frem. Seglet fra nødkassen er ikke væk. Det er bare dækket til.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `En kasse antænder i kanten, og folk råber. Du redder beviset, men mister roen.`, hpAendring: -10, naesteTrin: 'klokken_borgerraadet' },
          { log: `Seglet viser tre hænder: rådet, købmanden og en ukendt leverandør. Skylden har fået selskab.`, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      }
    ]
  },

  klokken_dosis: {
    id: 'klokken_dosis',
    titel: 'Den ene dosis',
    biome: ['by', 'marked'],
    tekst: `Lægen lægger flasken på et lille bord. Hun taler lavt, men alle ved vognen hører hende.

“Én fuld dosis kan redde én hurtigt. En tynd blanding kan holde flere i live, men måske kun til en ny flaske. Vi kan også holde flasken lukket og bruge den som bevis for at få nødkassen tilbage.”

Drengen står ved siden af dig. Han har stjålet for en bestemt person. Nu forstår han, at en bestemt person ikke altid er det samme som det bedste valg.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Giv den fulde dosis til kvinden, drengen prøvede at redde.',
        udfaldListe: [
          { log: `Kvinden overlever timen. Drengen ser ud, som om verden kan holde et løfte. Lægen ser ud, som om verden stadig skylder fire mere.`, hpAendring: 16, maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Dosen virker stærkt. Kvinden tager drengens hånd og siger, at han ikke måtte stjæle. Han smiler, fordi hun lever nok til at skælde ud.`, hpAendring: 12, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Hun får det bedre, men en anden patient får kramper. Ingen siger, at du valgte forkert. Det ville næsten have været nemmere.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Giv den fulde dosis til lærlingens syge søster, så han tør vidne mod købmanden.',
        udfaldListe: [
          { log: `Lærlingen får sit mod fra et sted, der ikke er rent. Hans søster trækker vejret friere, og han lover at åbne gældsbogen.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Drengen forstår valget og hader det. Han er ikke urimelig. Lærlingen forstår det også og hader sig selv lidt.`, hpAendring: -8, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Lærlingen vidner, men alle kan se, hvad vidnet kostede. Sandhed købt med medicin er stadig sandhed. Den er også købt.`, guldAendring: 60, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Fortynd dosen og fordel den mellem alle fem patienter.',
        udfaldListe: [
          { log: `Ingen rejser sig. Ingen dør heller lige nu. Nogle valg føles små, fordi de nægter at ofre andre for en klar fortælling.`, maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' },
          { log: `Blandingen køber en nat. Det er ikke en sejr, men det er et rum, hvor nye valg kan nå frem.`, hpAendring: 8, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Folk kalder dig ubeslutsom. Lægen kalder dig praktisk. Begge ord kan passe til samme handling.`, guldAendring: 55, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Lad flasken forblive lukket, så den kan fælde dem, der solgte nødhjælpen.',
        udfaldListe: [
          { log: `Lægen lukker kassen om flasken. Den lyd bliver siddende i alle, der ligger på halmen. Bevis kan redde flere senere. Senere er et hårdt ord for syge mennesker.`, hpAendring: -12, maxHpAendring: 8, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Drengen kalder dig kold. Han har ikke helt ret. Han har heller ikke helt uret.`, hpAendring: -6, maxHpAendring: 7, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Flasken bliver bevis, og torvet bliver vredt. Vrede kan ødelægge en sag. Den kan også holde den varm.`, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Brug din egen livseliksir og nægt at lade én flaske bestemme værdien af fem liv.',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: `Din eliksir løser ikke politikken, men den flytter presset fra kroppenes hast til byens ansvar. Det er en stor forskel.`, hpAendring: 18, maxHpAendring: 8, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Lægen deler din eliksir og gemmer den oprindelige flaske. For første gang i dag føles det, som om nogen har fået to hænder fri.`, maxHpAendring: 10, naesteTrin: 'klokken_borgerraadet' },
          { log: `Patienterne får tid. Du mister en sikkerhed, du kunne have brugt senere. Det er let at kalde offer smukt, når man ikke selv skal mangle flasken.`, hpAendring: 12, maxHpAendring: 7, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Som troldmand forsøger du at skille dosen i to stærke dele med staven.',
        kraeverKarakter: 'magician_m',
        udfaldListe: [
          { log: `Staven får væsken til at dele sig, men ikke rent. Du vinder mere hjælp og får en feberrystelse med i købet.`, hpAendring: -12, maxHpAendring: 9, naesteTrin: 'klokken_febervognen' },
          { log: `Magien virker, fordi lægen styrer din hånd, da den begynder at ryste. Ekspertise og trolddom redder mere sammen end hver for sig.`, hpAendring: 10, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Flasken revner, og noget af dosen går tabt. Folk ser kun tabet. Lægen ser, at resten stadig kan bruges.`, hpAendring: -8, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Som troldkvinde forsøger du at skille dosen i to stærke dele med staven.',
        kraeverKarakter: 'magician_f',
        udfaldListe: [
          { log: `Staven får væsken til at dele sig, men ikke rent. Du vinder mere hjælp og får en feberrystelse med i købet.`, hpAendring: -12, maxHpAendring: 9, naesteTrin: 'klokken_febervognen' },
          { log: `Magien virker, fordi lægen styrer din hånd, da den begynder at ryste. Ekspertise og trolddom redder mere sammen end hver for sig.`, hpAendring: 10, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Flasken revner, og noget af dosen går tabt. Folk ser kun tabet. Lægen ser, at resten stadig kan bruges.`, hpAendring: -8, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' }
        ]
      }
    ]
  },

  klokken_gaeldsbogen: {
    id: 'klokken_gaeldsbogen',
    titel: 'Gældsbogen',
    biome: ['by', 'marked'],
    tekst: `Gældsbogen er ikke gemt særlig godt. Det er næsten værre. Den ligger, som om alle vidste den fandtes, og ingen havde råd til at sige det højt.

Her står navne på folk, der købte medicin på kredit. Her står også byrådets salg af nødkassen. Købmanden har papir på meget af det. Papir kan gøre skade uden at bryde loven.

Hvis bogen brænder, slipper mange for gæld. Hvis den bevares, kan den måske fælde dem, der gjorde nødhjælp til handel. Hvis den sælges, kan du gå herfra rigere og stærkere til næste fare.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Brænd gældsbogen foran torvet og slet folks skyld nu.',
        udfaldListe: [
          { log: `Bogen brænder hurtigt. Folk græder af lettelse, men vagterne mister også beviset mod rådet. Ilden redder i dag og gør i morgen sværere at bevise.`, maxHpAendring: 9, hpAendring: -6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden råber som en såret mand, og for en gangs skyld lyver han ikke om følelsen. Han mister magt. Byen mister spor.`, maxHpAendring: 8, guldAendring: -40, naesteTrin: 'klokken_borgerraadet' },
          { log: `Asken flyver over torvet som sort sne. En kvinde samler et forkullet hjørne med sit eget navn op og kysser det.`, hpAendring: 14, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Aflever bogen til vagterne og kræv, at sagen går gennem retten.',
        udfaldListe: [
          { log: `Vagten tager bogen med begge hænder. Hun ser ud som en, der nu har fået et våben, men ikke en sejr.`, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' },
          { log: `Folk protesterer, fordi retten arbejder langsomt. Langsom ret kan være ret. Den kan også nå frem efter vinteren.`, hpAendring: -9, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden bliver ikke bange før han ser vagten forsegle bogen. Det fortæller dig, at papir måske stadig kan bide.`, guldAendring: 55, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Sælg bogen tilbage til købmanden og brug guldet til din egen overlevelse.',
        udfaldListe: [
          { log: `Han betaler uden at forhandle. Det er altid et tegn på, at man kunne have krævet mere eller burde have krævet noget andet.`, guldAendring: 260, maxHpAendring: -6 },
          { log: `Du går med en tung pung. Nogle af navnene i bogen bliver tungere hos dem, der stadig bærer dem.`, guldAendring: 230, hpAendring: -6 },
          { log: `Købmanden brænder bogen i sin egen ovn. Du får pengene. Han får stilheden. Begge dele kan bruges effektivt.`, guldAendring: 210, maxHpAendring: -4 }
        ]
      },
      {
        tekst: 'Kopier navnene, før bogen afleveres, så folk får bevis uden at sagen mister spor.',
        udfaldListe: [
          { log: `Du skriver, til fingrene kramper. Det er kedeligt arbejde. Netop derfor føles det mere holdbart end et råb.`, hpAendring: -8, maxHpAendring: 10, naesteTrin: 'klokken_borgerraadet' },
          { log: `Nogle navne bliver ulæselige i hasten. Du redder ikke hele sandheden, men du redder nok til, at den ikke kun tilhører vagterne.`, hpAendring: -5, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `En skriver fra rådet hjælper dig i stilhed. Han vil ikke være helt. Han vil bare kunne sove.`, maxHpAendring: 7, guldAendring: 45, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Brug faklen til kun at brænde rente-siderne og bevare resten som bevis.',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: `Ilden tager renterne først. Hovedgælden står tilbage, og det gør beviserne også. Ingen får alt. Flere får noget.`, maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' },
          { log: `Faklen slikker for langt ind over siden. Du redder det meste, men ikke de navne, der stod tættest på flammen.`, hpAendring: -8, maxHpAendring: 7, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden kalder det hærværk. En skyldner kalder det regning med varme. Begge beskriver det samme bord.`, guldAendring: -30, maxHpAendring: 10, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Som dværg læser du vægten i bogens tal og finder den skjulte fortjeneste.',
        kraeverKarakter: 'dwarf_m',
        udfaldListe: [
          { log: `Tallene er stablet som en dårlig minegang. Du finder støtten, der bærer hele løgnen, og den knager allerede.`, guldAendring: 120, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du ser, hvor prisen blev lagt på igen og igen. Købmanden er dygtig. Det er noget af det farlige ved ham.`, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du finder en kolonne, der peger væk fra boden og ind mod rådhuset. Sagen bliver større, og dermed langsommere.`, hpAendring: -6, maxHpAendring: 9, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Som minegraver læser du vægten i bogens tal og finder den skjulte fortjeneste.',
        kraeverKarakter: 'dwarf_f',
        udfaldListe: [
          { log: `Tallene er stablet som en dårlig minegang. Du finder støtten, der bærer hele løgnen, og den knager allerede.`, guldAendring: 120, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du ser, hvor prisen blev lagt på igen og igen. Købmanden er dygtig. Det er noget af det farlige ved ham.`, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du finder en kolonne, der peger væk fra boden og ind mod rådhuset. Sagen bliver større, og dermed langsommere.`, hpAendring: -6, maxHpAendring: 9, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Grav under boden efter den kasse, bogen hele tiden henviser til.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Under boden ligger en kasse med rådets segl. Den er næsten tom. Næsten er nok til at bevise, at nogen har været her før dig.`, guldAendring: 90, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' },
          { log: `Brostenene giver efter, og folk snubler over hullet. Du finder bevis, men skaber også et lille kaos med meget konkrete ankler.`, hpAendring: -10, guldAendring: 80, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du finder kun en tom kasse og et gammelt segl. Tomhed kan også være bevis, hvis nogen tør sige, hvad den burde have indeholdt.`, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' }
        ]
      }
    ]
  },

  klokken_borgerraadet: {
    id: 'klokken_borgerraadet',
    titel: 'Dom på åben plads',
    biome: ['by', 'marked'],
    tekst: `Torvet bliver til en retssal uden vægge. Det er både godt og farligt. Ingen kan gemme sig helt. Ingen kan tænke helt i fred.

Købmanden står med loven. Drengen står med flasken eller mindet om den. Lægen står med syge mennesker bag sig. Vagterne står med ansvaret for, at byen også findes i morgen.

Klokken over toldhuset hænger stille nu. Den venter ikke på den rigtige løsning. Den venter på, om du tør eje den løsning, du vælger.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Lad torvet stemme med hænderne og accepter flertallets dom.',
        udfaldListe: [
          { log: `Flertallet frikender drengen og tvinger købmanden til at åbne lageret. Det føles som retfærdighed, indtil de første hænder rækker efter mere, end lægen kan fordele.`, hpAendring: -12, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Flertallet kræver, at drengen arbejder gælden af. Det er mildere end fængsel. Det er også en beslutning taget af mennesker, der går hjem frie.`, hpAendring: 8, maxHpAendring: -3, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Flertallet deler skylden mellem dreng, købmand og råd. Alle bliver utilfredse på en måde, der næsten ligner balance.`, maxHpAendring: 9, guldAendring: 65, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Giv lægen myndighed over medicinen og vagterne myndighed over tyveriet.',
        udfaldListe: [
          { log: `Det splitter sagen i to, så den kan håndteres. Det splitter også ansvaret, så ingen behøver bære hele vægten.`, maxHpAendring: 6, hpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lægen tager flasken. Vagten tager drengen. Begge gør deres arbejde. Det gør ikke scenen blid.`, hpAendring: -6, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' },
          { log: `Folk accepterer delingen, fordi den lyder voksen. Senere vil nogle kalde den klog og andre fejt pæn.`, maxHpAendring: 5, guldAendring: 45, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Døm købmandens prissætning hårdt, men lad drengen betale en mindre bøde.',
        udfaldListe: [
          { log: `Dommen gør ingen til helgen. Drengen slipper for cellen. Købmanden mister mere end flasken. Torvet får en regel at pege på næste gang.`, guldAendring: 90, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Nogle kalder bøden smålig. Andre kalder den nødvendig. Drengen ser ud, som om han måske kan forstå den om et år. Ikke i dag.`, hpAendring: 8, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Købmanden betaler, men hans kolleger lukker tre boder i protest. Retfærdighed kan give tomme hylder, før den giver bedre priser.`, guldAendring: 120, hpAendring: -8, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Lad drengen tale først, selvom hans ord kan ødelægge den sag, du prøver at bygge.',
        udfaldListe: [
          { log: `Han siger, at han stjal og ville gøre det igen. Torvet gisper. Det er den værste mulige sætning og måske den ærligste.`, maxHpAendring: 9, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Han prøver at lyve for at beskytte kvinden, men klokken slår. Så fortæller han det enkelt, uden at gøre sig bedre. Det hjælper mere end en pæn tale.`, hpAendring: 10, maxHpAendring: 7, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Han går i stå foran alle. Du valgte hans stemme, men ikke hans mod. Det ansvar lander tungt.`, hpAendring: -10, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Som viking kræver du en løsning, der kan holdes uden fine ord: mad, medicin og en bøde nu.',
        kraeverKarakter: 'viking_m',
        udfaldListe: [
          { log: `Folk forstår den direkte handel. Den mangler elegance, men den får kasser flyttet og patienter behandlet.`, hpAendring: 12, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden kalder det plyndring med regler. Du svarer ikke. Reglerne får til gengæld nogle flasker ud af boden.`, guldAendring: 80, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Din løsning virker i dag. Den bygger ikke meget tillid til i morgen. Måske skal nogen overleve dagen, før de kan diskutere i morgen.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Som valkyrie kræver du en løsning, der kan holdes uden fine ord: mad, medicin og en bøde nu.',
        kraeverKarakter: 'viking_f',
        udfaldListe: [
          { log: `Folk forstår den direkte handel. Den mangler elegance, men den får kasser flyttet og patienter behandlet.`, hpAendring: 12, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden kalder det plyndring med regler. Du svarer ikke. Reglerne får til gengæld nogle flasker ud af boden.`, guldAendring: 80, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Din løsning virker i dag. Den bygger ikke meget tillid til i morgen. Måske skal nogen overleve dagen, før de kan diskutere i morgen.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Hold buen synlig og skab afstand uden at true nogen direkte.',
        kraeverItem: 'bue',
        udfaldListe: [
          { log: `Afstanden giver lægen plads og vagterne færre undskyldninger. Den minder også alle om, at ro nogle gange har en skarp kant.`, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `En mand råber, at våben ikke er argumenter. Han har ret. Alligevel stopper han med at skubbe.`, hpAendring: -5, maxHpAendring: 7, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Buen sænker lyden på torvet. Ikke spændingen. Bare lyden. Det er nok til at få en beslutning igennem.`, hpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Læg sværdet på jorden og bed de andre lægge deres stærkeste kort ned også.',
        kraeverItem: 'svaerd',
        udfaldListe: [
          { log: `Sværdet mod brostenene giver en lyd, alle kan forstå. Købmanden lægger sin kvittering frem. Vagten lægger sin nøgle. Drengen lægger flasken.`, maxHpAendring: 9, naesteTrin: 'klokken_dosis' },
          { log: `En mand prøver at tage sværdet. Du når at træde på klingen med støvlen. Symboler virker kun, mens nogen passer på dem.`, hpAendring: -8, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `Folk gør ikke helt som du beder om, men de begynder at vise, hvad de holder skjult. Det er mere nyttigt end lydighed.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      }
    ]
  },

  klokken_barnet_i_gyden: {
    id: 'klokken_barnet_i_gyden',
    titel: 'Drengen i gyden',
    biome: ['by', 'marked'],
    tekst: `Gyden bag bageren er smal nok til, at torvets larm bliver til en mur.

Drengen hedder Nilo. Han siger navnet hurtigt, som om det ikke er sikkert at have et. Kvinden i febervognen hedder Mara. Hun gav ham brød, fordi hun selv engang mistede et barn på torvet, mens andre diskuterede regler.

Nilo stjal flasken. Han vidste også, at den måske kunne deles. Han løj, fordi han var bange for, at en delt chance ikke ville være nok til Mara.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Følg Nilo tilbage, så han kan sige sandheden uden at stå alene.',
        udfaldListe: [
          { log: `Han går ved siden af dig, ikke bag dig. Det gør forskellen mindre synlig for torvet og større for ham.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `Han når næsten frem, før han kaster op af skræk. Du venter. Ventetid kan være en slags beskyttelse.`, hpAendring: -5, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Han fortæller dig et ekstra navn på vejen: lærlingen, der viste ham flaskerne. Nu bærer du mere sandhed, end han selv tør.`, guldAendring: 35, naesteTrin: 'klokken_bag_boderne' }
        ]
      },
      {
        tekst: 'Send ham ud gennem nordporten og lad sagen miste sit nemmeste offer.',
        udfaldListe: [
          { log: `Nilo løber uden at se tilbage. Du har reddet et barn fra straffen. Du har også fjernet stemmen, der kunne gøre sagen menneskelig.`, hpAendring: 8, maxHpAendring: -3, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han løber mod porten og stopper for at give dig den lap med navne. Han vil ikke være helt. Han vil bare ikke være eneste grund.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' },
          { log: `Vagterne opdager flugten for sent og for hurtigt på samme tid. Nu leder de efter ham, og købmanden får en enklere historie.`, hpAendring: -8, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Giv ham en madration og bed ham vælge selv: tale, flygte eller betale tilbage.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: `Han spiser halvdelen og gemmer resten. Så vælger han at tale. Ikke fordi det er det rigtige. Fordi han ikke vil have Mara til at bære hans tavshed.`, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Han vælger at flygte. Det skuffer dig måske. Det gør ham ikke falsk. Børn, der får et valg for første gang, vælger tit luft.`, hpAendring: 10, maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han vælger at arbejde gælden af hos lægen, ikke købmanden. Det er stadig gæld. Det er også et sted med hænder, der prøver at hele.`, maxHpAendring: 6, hpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Giv ham din sovepose og send ham væk fra byen før nattevagten.',
        kosterItem: 'sovepose',
        udfaldListe: [
          { log: `Soveposen får ham til at ligne en rejsende i stedet for en flygtning. Det kan redde ham. Det kan også lære ham, at omsorg altid betyder afrejse.`, maxHpAendring: 5, hpAendring: -4, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han tager imod den og spørger, om Mara ved det. Du svarer ikke hurtigt nok.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `En portvagt ser soveposen og lader ham passere som en lille handelsdreng. Din ting blev til hans mulighed.`, hpAendring: 8, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Giv ham en kniv og sig, at næste valg også kræver ansvar.',
        kosterItem: 'kniv',
        udfaldListe: [
          { log: `Han tager kniven, som om den er tungere end flasken. Du har givet ham beskyttelse og fare i samme greb.`, maxHpAendring: -2, hpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han nægter kniven. “Jeg stjal for at redde,” siger han. “Jeg vil ikke lære at alle problemer har en kant.”`, maxHpAendring: 7, givItem: 'kniv', naesteTrin: 'klokken_borgerraadet' },
          { log: `Han gemmer kniven og græder først bagefter. Måske fordi nogen stolede på ham. Måske fordi nogen ikke burde have gjort det.`, hpAendring: -5, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Som eventyrer viser du ham en vej gennem baggårdene, men ikke ud af ansvaret.',
        kraeverKarakter: 'explorer_f',
        udfaldListe: [
          { log: `Du finder en rute, hvor han kan nå febervognen uden at passere vagterne. Han kan stadig vælge at tale bagefter.`, maxHpAendring: 7, naesteTrin: 'klokken_febervognen' },
          { log: `Baggårdene er ikke tomme. Folk ser ham gå med dig og begynder at bygge nye historier. Du kan ikke styre dem alle.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du viser ham en vej tilbage til torvet fra siden. Nogle gange hjælper man bedst ved ikke at føre folk ind gennem hoveddøren.`, hpAendring: 8, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Som udforsker viser du ham en vej gennem baggårdene, men ikke ud af ansvaret.',
        kraeverKarakter: 'explorer_m',
        udfaldListe: [
          { log: `Du finder en rute, hvor han kan nå febervognen uden at passere vagterne. Han kan stadig vælge at tale bagefter.`, maxHpAendring: 7, naesteTrin: 'klokken_febervognen' },
          { log: `Baggårdene er ikke tomme. Folk ser ham gå med dig og begynder at bygge nye historier. Du kan ikke styre dem alle.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du viser ham en vej tilbage til torvet fra siden. Nogle gange hjælper man bedst ved ikke at føre folk ind gennem hoveddøren.`, hpAendring: 8, naesteTrin: 'klokken_borgerraadet' }
        ]
      }
    ]
  },

  klokken_aftenmarkedet: {
    id: 'klokken_aftenmarkedet',
    titel: 'Da boderne lukker',
    biome: ['by', 'marked'],
    tekst: `Hen mod aften lukker boderne én efter én. Torvet ligner igen et marked og ikke en domstol. Det føles næsten uretfærdigt, hvor hurtigt træborde, kurve og priser kan se normale ud igen.

Nogle nikker til dig. Nogle vender sig væk. En læge vasker hænder i en balje med gråt vand. En vagt skriver noget ned, der måske bliver en sag og måske bare bliver endnu et ark.

På trappen til toldhuset står tre tilbud tilbage: en pung fra købmanden, en lille pakke fra lægen og en tom bænk ved siden af Nilo eller Mara, alt efter hvem der stadig venter.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Tag købmandens pung og kald det betaling for arbejdet, ikke for tavshed.',
        udfaldListe: [
          { log: `Pungen er tung nok til at gøre næste dag lettere. Den er ikke tung nok til at forklare sig selv.`, guldAendring: 180, maxHpAendring: -3 },
          { log: `Købmanden nikker, som om I nu forstår hinanden. Måske gør I. Det er ikke automatisk skam. Det er heller ikke gratis.`, guldAendring: 150, hpAendring: -5 },
          { log: `Du tager pengene og går, før nogen kan gøre betalingen til en historie om dig. Den bliver nok fortalt alligevel.`, guldAendring: 130 }
        ]
      },
      {
        tekst: 'Tag lægens pakke og vælg forsyninger frem for mønter.',
        udfaldListe: [
          { log: `Pakken indeholder tør mad og noget bittert pulver. Lægen siger, at overlevelse tit starter kedeligere end folk tror.`, givItem: 'mad', hpAendring: 12 },
          { log: `Lægen giver dig en lille flaske og siger, at du skal bruge den uden at vente på en ren grund.`, givItem: 'livseliksir', maxHpAendring: 4 },
          { log: `Du får bandager, mad og et blik, der hverken tilgiver eller dømmer. Nogle tak er bedst sådan.`, givItem: 'klude', hpAendring: 10, maxHpAendring: 3 }
        ]
      },
      {
        tekst: 'Sæt dig på bænken og brug aftenen på at høre den version, du ikke selv valgte.',
        udfaldListe: [
          { log: `Du får ingen ny løsning. Du får flere detaljer. Det er ikke mindre værd, bare fordi det ikke kan sælges.`, maxHpAendring: 10, hpAendring: 6 },
          { log: `Historien bliver længere, mens lyset forsvinder. Du forstår ikke alt bedre. Du forstår, hvorfor enkle domme føltes fristende.`, maxHpAendring: 9 },
          { log: `Du sidder, til torvet næsten er tomt. Kroppen hviler, men ansvaret bliver ikke væk. Det bliver bare mere præcist.`, hpAendring: 18, maxHpAendring: 5 }
        ]
      },
      {
        tekst: 'Køb mad til dem, der stadig venter ved febervognen.',
        puljeVaerdi: 70,
        udfaldListe: [
          { log: `Maden løser ikke sagen. Den gør natten mindre lang. Der findes handlinger, som kun er små, hvis man står langt væk.`, hpAendring: 14, maxHpAendring: 5 },
          { log: `Du deler brød ud, og folk tager imod uden taler. Det er rart. Det er også muligt, at brød virker bedre uden tale.`, hpAendring: 16 },
          { log: `En købmand sænker prisen på de sidste brød, da han ser køen. Måske af skam. Måske af forretning. Begge dele mætter.`, guldAendring: 40, maxHpAendring: 4 }
        ]
      },
      {
        tekst: 'Køb en flaske til vejen og accepter, at du også skal overleve næste hændelse.',
        puljeVaerdi: 140,
        udfaldListe: [
          { log: `Flasken ligger tungt i tasken. At gemme noget til sig selv kan være klogt. Det kan også lyde forkert efter en dag som den her.`, givItem: 'livseliksir', maxHpAendring: -2 },
          { log: `Du betaler fuld pris og hader det lidt. Men en død helt hjælper ingen i morgen.`, givItem: 'livseliksir', hpAendring: 8 },
          { log: `Lægen sælger dig en flaske billigere, end købmanden ville have gjort. Hun kalder det ikke belønning. Hun kalder det lagerstyring.`, givItem: 'livseliksir', guldAendring: 35 }
        ]
      },
      {
        tekst: 'Gå uden betaling, uden pakke og uden at rette på den historie folk fortæller.',
        udfaldListe: [
          { log: `Du går, mens folk stadig prøver at gøre dig til enten klog, hård, blød eller grådig. Du har ikke pligt til at være let at fortælle.`, maxHpAendring: 8 },
          { log: `Klokken slår én gang bag dig. Ikke som anklage. Mere som en påmindelse om, at halve sandheder også kan være måden mennesker kommer videre på.`, hpAendring: 12, maxHpAendring: 4 },
          { log: `Du får ikke noget med, som kan ligge i tasken. Alligevel går du anderledes over brostenene, end da du kom.`, maxHpAendring: 6, hpAendring: 8 }
        ]
      },
      {
        tekst: 'Efterlad en diamant hos lægen, så næste flaske ikke skal stjæles.',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: `Lægen tager imod diamanten, som om den er farlig. Hun har ret. Store gaver kan redde meget og skævvride resten.`, maxHpAendring: 12, hpAendring: 8 },
          { log: `Med diamanten kan hun købe et lager uden købmanden. I hvert fald denne gang. Byen lærer ikke alt på én aften, men nogle flasker skifter vej.`, maxHpAendring: 14 },
          { log: `Rygtet om gaven spreder sig hurtigere end hjælpen. Nogle kommer af nød, andre af håb om mere. Begge dele er menneskeligt.`, maxHpAendring: 10, hpAendring: -6 }
        ]
      }
    ]
  }
};
