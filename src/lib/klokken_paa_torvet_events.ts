export const klokkenPaaTorvetEvents = {
  klokken_paa_torvet: {
    id: 'klokken_paa_torvet',
    titel: 'Klokken på torvet',
    biome: ['by', 'marked'],
    tekst: `Torvet er pakket. Der lugter af brød, våd uld og for mange mennesker på for lidt plads.

Ved apotekerens bod holder to vagter en dreng fast. Han knuger en lille grøn flaske. Købmanden siger, den er stjålet. En kvinde fra febervognen siger, at den kan redde én syg – måske flere, hvis den fortyndes. Drengen siger kun: “Hun gav mig mad, da ingen andre gjorde.”

Over toldhuset hænger en klokke, der ikke reagerer på løgn, men på halve sandheder. Nu dirrer den. Alle på torvet fortæller noget sandt, men ingen fortæller det hele.`,
    unik: true,
    erSubTrin: false,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Skab ro og hør alle tre',
        udfaldListe: [
          { log: `Folk falder ikke til ro, men deres nysgerrighed dæmper råbene. Drengen holder op med at kæmpe imod vagterne.`, maxHpAendring: 3, naesteTrin: 'klokken_vidnerne' },
          { log: `Købmanden smiler lidt for længe, da du beder om ro. Han kan lide regler, især når han kender dem bedre end alle andre.`, hpAendring: -5, naesteTrin: 'klokken_vidnerne' },
          { log: `En brødkurv vælter, da folk maser sig frem for at høre. Du samler mønterne op og lægger dem synligt på boden. Det køber dig et par minutters tillid.`, guldAendring: 35, naesteTrin: 'klokken_vidnerne' }
        ]
      },
      {
        tekst: 'Bring flasken til febervognen',
        udfaldListe: [
          { log: `Du når vognen før vagterne. Kvinden ser både lettet og bange ud. Nu er det hende, der skal vælge, hvem flasken skal hjælpe.`, hpAendring: -12, naesteTrin: 'klokken_febervognen' },
          { log: `En hånd griber efter dig, og flasken slår hårdt mod dine ribben. Den holder, men roen på torvet gør ikke.`, hpAendring: -18, naesteTrin: 'klokken_febervognen' },
          { log: `Mængden giver plads. Ingen vil være den, der standser medicin på vej mod en syg. Bag dig råber købmanden, at medlidenhed også kan være tyveri.`, maxHpAendring: 4, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Overlad drengen til vagterne',
        udfaldListe: [
          { log: `Vagterne retter ryggen, da du kræver en formel afgørelse. Drengen ser på dig, som om du bare har flyttet ham fra én fare til en anden.`, guldAendring: 70, naesteTrin: 'klokken_vagtstuen' },
          { log: `Folk buher ikke. De bliver stille, men du kan ikke se, om det skyldes respekt eller frygt.`, maxHpAendring: -3, hpAendring: 10, naesteTrin: 'klokken_vagtstuen' },
          { log: `Købmanden nikker alt for hurtigt. Ved siden af ham skjuler en vagt en lille kvittering i ærmet.`, hpAendring: -6, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Betal for flasken og skab ro',
        puljeVaerdi: 180,
        udfaldListe: [
          { log: `Købmanden tager imod pengene med et høfligt smil. Nu ser hele torvet på dig, som om problemet også er dit.`, maxHpAendring: -4, naesteTrin: 'klokken_koebte_ro' },
          { log: `Flasken skifter hænder uden flere slag. Du har skabt ro, men også accepteret købmandens pris.`, hpAendring: 8, naesteTrin: 'klokken_koebte_ro' },
          { log: `En vagt skriver dit navn på kvitteringen uden at spørge. Papiret kan beskytte dig, men det kan også blive brugt imod dig.`, guldAendring: 50, naesteTrin: 'klokken_koebte_ro' }
        ]
      },
      {
        tekst: 'Læs torvets hænder som tyv',
        kraeverKarakter: 'thief_m',
        udfaldListe: [
          { log: `Du ser tre bevægelser, andre overser: En vagt gemmer en kvittering, en lærling skjuler en ekstra flaske, og drengen knuger en lap papir i sin frie hånd.`, naesteTrin: 'klokken_skyggerne' },
          { log: `Du glider tættere på uden at skubbe. Din gamle vane gør dig næsten usynlig, men på et bange torv er næsten ikke altid nok.`, hpAendring: -7, naesteTrin: 'klokken_skyggerne' },
          { log: `Du ser, at drengen ikke flygter mod porten. Han kigger hele tiden mod gyden bag bageren.`, maxHpAendring: 4, naesteTrin: 'klokken_skyggerne' }
        ]
      },
      {
        tekst: 'Læs torvets hænder som skygge',
        kraeverKarakter: 'thief_f',
        udfaldListe: [
          { log: `Du ser tre bevægelser, andre overser: En vagt gemmer en kvittering, en lærling skjuler en ekstra flaske, og drengen knuger en lap papir i sin frie hånd.`, naesteTrin: 'klokken_skyggerne' },
          { log: `Du glider tættere på uden at skubbe. Din gamle vane gør dig næsten usynlig, men på et bange torv er næsten ikke altid nok.`, hpAendring: -7, naesteTrin: 'klokken_skyggerne' },
          { log: `Du ser, at drengen ikke flygter mod porten. Han kigger hele tiden mod gyden bag bageren.`, maxHpAendring: 4, naesteTrin: 'klokken_skyggerne' }
        ]
      },
      {
        tekst: 'Kræv byens takst som hertug',
        kraeverKarakter: 'royal_m',
        udfaldListe: [
          { log: `Købmændene hører din titel før dine ord. Det gør de fattige også. Der bliver ro, men ikke alle føler sig tryggere.`, naesteTrin: 'klokken_taksten' },
          { log: `Vagterne giver dig plads. Du kan bruge den til at hjælpe, men alle kan også se, hvem der har magten.`, maxHpAendring: 5, naesteTrin: 'klokken_taksten' },
          { log: `Købmanden bukker kort og begynder straks at tale om erstatning. Du har flyttet striden over på et sprog, han mestrer.`, guldAendring: -40, naesteTrin: 'klokken_taksten' }
        ]
      },
      {
        tekst: 'Kræv byens takst som hertuginde',
        kraeverKarakter: 'royal_f',
        udfaldListe: [
          { log: `Købmændene hører din titel før dine ord. Det gør de fattige også. Der bliver ro, men ikke alle føler sig tryggere.`, naesteTrin: 'klokken_taksten' },
          { log: `Vagterne giver dig plads. Du kan bruge den til at hjælpe, men alle kan også se, hvem der har magten.`, maxHpAendring: 5, naesteTrin: 'klokken_taksten' },
          { log: `Købmanden bukker kort og begynder straks at tale om erstatning. Du har flyttet striden over på et sprog, han mestrer.`, guldAendring: -40, naesteTrin: 'klokken_taksten' }
        ]
      }
    ]
  },

  klokken_vidnerne: {
    id: 'klokken_vidnerne',
    titel: 'Tre forklaringer',
    biome: ['by', 'marked'],
    tekst: `Du får de tre til at fortælle deres version.

Drengen indrømmer, at han stjal flasken, selv om han knap kan få ordene frem.

Købmanden ejer den ifølge sine papirer. Han købte et helt parti fra byens nødkasse, da rådet manglede penge til muren ved nordporten.

Kvinden i febervognen er ikke drengens mor. Hun gav ham brød hele vinteren. Nu ligger hun syg under en lånt frakke.

Klokken slår én gang. Ingen har løjet, men noget mangler stadig.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Fortæl hele torvet sandheden',
        udfaldListe: [
          { log: `Torvet lytter. Nogle vender vreden mod købmanden, andre mod rådet. En mand råber, at retfærdighed alene ikke gør en syg kvinde rask.`, hpAendring: -10, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden mister farven i ansigtet, da du nævner nødkassen. Drengen ser for første gang mindre alene ud.`, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du får det hele sagt, men ordene sætter ild til vreden. Mængden presser frem, og nogen vælter en bod.`, hpAendring: -16, guldAendring: 45, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Skjul sagen om nødkassen for nu',
        udfaldListe: [
          { log: `Du vælger ro frem for fuld åbenhed. Det føles forkert, men flasken kommer hurtigt videre mod febervognen.`, hpAendring: 8, naesteTrin: 'klokken_febervognen' },
          { log: `Købmanden bemærker, hvad du udelader, og slapper synligt af. Du ved, at din tavshed også beskytter ham.`, maxHpAendring: -3, naesteTrin: 'klokken_febervognen' },
          { log: `Drengen forstår, at du beskytter ham – og måske også manden, han stjal fra. Han siger ikke tak.`, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Spørg, hvem flasken skal redde',
        udfaldListe: [
          { log: `Kvinden i vognen lukker øjnene. Lægen svarer i stedet: én fuld dosis kan redde én nu. En tynd blanding kan holde flere i live til i morgen.`, naesteTrin: 'klokken_dosis' },
          { log: `Spørgsmålet rammer hårdere end en dom. Folk indser, at ejerskab kun er den første del af problemet.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' },
          { log: `Drengen begynder at græde lydløst. Måske ved han ikke længere, hvilket svar han håber på.`, hpAendring: -4, naesteTrin: 'klokken_dosis' }
        ]
      },
      {
        tekst: 'Lad søgekvisten finde den største mangel',
        kraeverItem: 'soegekvist',
        udfaldListe: [
          { log: `Kvisten peger ikke på flasken. Den peger bag apotekerboden, hvor en hjælper står alt for stille.`, naesteTrin: 'klokken_bag_boderne' },
          { log: `Kvisten ryster mellem febervognen og købmandens pengekasse. Den peger både på sygdommen og på prisen.`, maxHpAendring: 4, naesteTrin: 'klokken_bag_boderne' },
          { log: `Kvisten knækker og falder mod drengens lukkede hånd. Han gemmer ikke flere flasker. Han gemmer et navn.`, mistItem: 'soegekvist', naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Søg under boden med metaldetektoren',
        kraeverItem: 'metaldetektor',
        udfaldListe: [
          { log: `Detektoren skratter under købmandens bord. Du finder en tynd metalplade med indridsede navne og beløb. Det er et gældsregister.`, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du finder en falsk bund med små betalinger sorteret efter mærker. Hver mønt kan forklares, men mønsteret kan ikke.`, guldAendring: 80, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Detektoren hyler, og mængden vender sig mod dig. Du har fundet noget, men du har også gjort dig selv til midten af sagen.`, hpAendring: -9, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Giv drengen mad og spørg igen',
        kosterItem: 'mad',
        udfaldListe: [
          { log: `Han spiser for hurtigt og bliver flov over det. Så siger han et navn, der får kvinden i febervognen til at åbne øjnene.`, hpAendring: 6, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Maden gør ham ikke mere ærlig, men den gør ham mindre bange. Det er nok til, at han begynder at tale.`, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `En anden sulten hånd rækker ud. Drengen deler maden uden at se på dig. Det gør det sværere at afgøre, hvad han fortjener.`, hpAendring: 8, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      }
    ]
  },

  klokken_febervognen: {
    id: 'klokken_febervognen',
    titel: 'Febervognen',
    biome: ['by', 'marked'],
    tekst: `Febervognen står bag fiskeboderne, hvor luften er køligere og lugter af eddike. Fem syge ligger på halm. Kun én af dem kender drengen.

Lægen holder flasken op mod lyset. “En fuld dosis kan sandsynligvis redde én. Fortynder vi den, kan vi købe tid til flere. Gemmer vi den som bevis, kan vi måske få hele nødkassen tilbage.”

Kvinden, drengen stjal for, åbner øjnene. “Vælg mig ikke bare for at få det bedre med dig selv,” siger hun.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Giv kvinden hele dosen',
        udfaldListe: [
          { log: `Kvinden får farve i kinderne, og drengen synker sammen af lettelse. Lægen ser tavst hen på de fire andre senge.`, hpAendring: 14, maxHpAendring: -3, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Hun klarer de første kritiske minutter. Det er ingen garanti, men det er en chance. Manden i nabosengen vender ansigtet væk.`, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Dosen virker. Kvindens første klare ord er til drengen: Han skylder hende ikke resten af sit liv.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Fortynd dosen til alle fem',
        udfaldListe: [
          { log: `Lægen fordeler blandingen med rolige hænder. Ingen jubler, men fem mennesker trækker vejret lidt lettere, og deres familier tør håbe lidt længere.`, maxHpAendring: 8, hpAendring: 5, naesteTrin: 'klokken_borgerraadet' },
          { log: `Blandingen virker langsomt. I morgen vil nogen kalde valget klogt og andre fejt, alt efter hvem der vågner.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En patient får det værre, før de andre får det bedre. Lægen beder dig holde sengen fast, mens kramperne står på.`, hpAendring: -12, maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Gem flasken som bevis',
        udfaldListe: [
          { log: `Lægen hader valget, men forstår det. Hvis flasken beviser misbrug af nødkassen, kan den næste måske komme uden tyveri. Natten bliver lang.`, hpAendring: -8, maxHpAendring: 8, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Kvinden nikker svagt, som om hun nægter at være vigtigere end alle dem, der endnu ikke ligger her. Drengen hører det som afvisning.`, maxHpAendring: 6, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Flasken bliver lagt i en låst kasse. Da låsen klikker, bliver der helt stille i vognen.`, hpAendring: -14, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Brug din egen livseliksir',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: `Din eliksir virker med det samme. Den er dyr at undvære, men giver lægen endnu en mulighed uden at bruge beviset.`, maxHpAendring: 10, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Lægen tager imod din eliksir med både lettelse og irritation. Din gave hjælper nu, men løser ikke byens problem med medicinen.`, hpAendring: 16, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' },
          { log: `Eliksiren redder én hurtigt og køber tid til de andre. Drengen ser udmattet ud, som om selv hjælp kan være svær at rumme.`, maxHpAendring: 8, hpAendring: 10, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Undersøg flasken som troldmand',
        kraeverKarakter: 'magician_m',
        udfaldListe: [
          { log: `Flasken er ægte, men forseglingen stammer fra en anden kasse. Magien afslører ikke den skyldige, kun at flere hænder har rørt den.`, hpAendring: -6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du mærker to blandinger i samme flaske. Den kan hjælpe, men ikke uden risiko. Folk hader usikkerhed mere, når de allerede har valgt side.`, maxHpAendring: 7, naesteTrin: 'klokken_dosis' },
          { log: `Din stav bliver kold som et lagerrum. Flasken har ligget et sted, hvor nødhjælp blev behandlet som en vare.`, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Undersøg flasken som troldkvinde',
        kraeverKarakter: 'magician_f',
        udfaldListe: [
          { log: `Flasken er ægte, men forseglingen stammer fra en anden kasse. Magien afslører ikke den skyldige, kun at flere hænder har rørt den.`, hpAendring: -6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du mærker to blandinger i samme flaske. Den kan hjælpe, men ikke uden risiko. Folk hader usikkerhed mere, når de allerede har valgt side.`, maxHpAendring: 7, naesteTrin: 'klokken_dosis' },
          { log: `Din stav bliver kold som et lagerrum. Flasken har ligget et sted, hvor nødhjælp blev behandlet som en vare.`, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Lav kolde omslag af kludene',
        kosterItem: 'klude',
        udfaldListe: [
          { log: `Kludene er ikke medicin, men de dæmper en patients voldsomme rystelser. Det er ikke nok, men det hjælper.`, hpAendring: 10, maxHpAendring: 3, naesteTrin: 'klokken_dosis' },
          { log: `Du arbejder ved sengene, til råbene fra torvet bliver fjerne. Det afgør ikke sagen, men det hjælper de syge her og nu.`, hpAendring: -5, maxHpAendring: 8, naesteTrin: 'klokken_dosis' },
          { log: `Lægen tager kludene uden videre. Hun har brug for tørre hænder og mere tid, ikke en tale.`, hpAendring: 12, naesteTrin: 'klokken_dosis' }
        ]
      }
    ]
  },

  klokken_vagtstuen: {
    id: 'klokken_vagtstuen',
    titel: 'Vagtstuen',
    biome: ['by', 'marked'],
    tekst: `Vagtstuen ligger bag toldhuset og lugter af støv, blæk og gammel kaffe. Drengen sidder på en bænk med hænderne bundet foran sig.

Købmanden har allerede sendt en kvittering, der beviser, at flasken er hans. Vagten siger, at loven er klar. Så sænker hun stemmen: En klar lov kan stadig bruges beskidt.

Udenfor kræver torvet en afgørelse. Inde i stuen vil alle have dig til at bakke netop deres løsning op.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Kræv en offentlig høring',
        udfaldListe: [
          { log: `Vagten sukker og åbner døren. En offentlig høring er ingen garanti for retfærdighed, men sagen skal ud af det lukkede rum.`, naesteTrin: 'klokken_borgerraadet' },
          { log: `Drengen bliver mere bange ved tanken om mængden end ved tanken om cellen. Det siger noget om begge dele.`, hpAendring: -6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmandens skriver løber foran jer for at samle sine folk. Du får din høring, men du får ikke en tom scene.`, guldAendring: -35, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Betal drengens kaution',
        puljeVaerdi: 100,
        udfaldListe: [
          { log: `Vagten løsner rebet. Drengen gnider håndleddene og ser mistroisk på den åbne dør.`, hpAendring: 8, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Dit navn bliver skrevet på kautionen. Nu hænger loven også på dig, hvis han forsvinder.`, maxHpAendring: -2, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Vagten tager imod pengene og hvisker, at du ikke skal lade ham løbe alene. Det lyder som et råd, ikke en ordre.`, maxHpAendring: 4, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Tag købmandens penge og gå',
        udfaldListe: [
          { log: `Pengene er stadig varme fra købmandens hånd. Du lader loven gå sin gang uden din indblanding.`, guldAendring: 140, maxHpAendring: -5 },
          { log: `Drengen bliver ført ind i baglokalet uden at gøre modstand. Du tager pengene og lader døren lukke bag ham.`, guldAendring: 110, hpAendring: -8 },
          { log: `Vagten ser ikke imponeret ud, men hun stopper dig heller ikke. Du tager betalingen og forlader sagen.`, guldAendring: 95, hpAendring: 10 }
        ]
      },
      {
        tekst: 'Skab ro som ridder',
        kraeverKarakter: 'knight_m',
        udfaldListe: [
          { log: `Rustningen får folk til at holde afstand, men den gør ikke dommen lettere. I det mindste får du plads til at høre sagen.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En sten springer af din skulderplade. Den rammer i det mindste ikke personen bag dig.`, hpAendring: -7, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vagterne slapper af, da du tager plads i døren. Det skaber ro, men lader også dem træde ud af ansvaret.`, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Skab ro som skjoldmø',
        kraeverKarakter: 'knight_f',
        udfaldListe: [
          { log: `Rustningen får folk til at holde afstand, men den gør ikke dommen lettere. I det mindste får du plads til at høre sagen.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En sten springer af din skulderplade. Den rammer i det mindste ikke personen bag dig.`, hpAendring: -7, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vagterne slapper af, da du tager plads i døren. Det skaber ro, men lader også dem træde ud af ansvaret.`, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Læg ansvaret hos de stærkeste som ork',
        kraeverKarakter: 'orc_m',
        udfaldListe: [
          { log: `Vagterne hører en trussel, men drengen hører en regel. Købmandens skriver bliver urolig og skubber sin stol tilbage.`, hpAendring: -5, maxHpAendring: 9, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du slår ikke nogen. Du behøver ikke. Det giver dig plads, men det farver også alt, du siger bagefter.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `En vagt kalder dig brutal. Drengen ser på de bundne hænder og spørger, hvem der begyndte med brutaliteten.`, hpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Læg ansvaret hos de stærkeste som klanleder',
        kraeverKarakter: 'orc_f',
        udfaldListe: [
          { log: `Vagterne hører en trussel, men drengen hører en regel. Købmandens skriver bliver urolig og skubber sin stol tilbage.`, hpAendring: -5, maxHpAendring: 9, naesteTrin: 'klokken_gaeldsbogen' },
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
    tekst: `Pengene skifter hænder, og torvet bliver stille. En anden har betalt og dermed taget beslutningen.

Købmanden giver dig flasken og en kvittering. Nederst står der med småt, at køberen hæfter for følgerne, hvis flasken bruges uden lægens stempel.

Du har købt ro. Nu venter alle på at se, hvad du gør med den.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Riv kvitteringen itu og giv flasken væk',
        udfaldListe: [
          { log: `Papiret går let i stykker. Folk klapper, men lægen ser bekymret ud. Kvitteringen var også et muligt bevis.`, maxHpAendring: 5, naesteTrin: 'klokken_febervognen' },
          { log: `Købmanden smiler, da du ødelægger beviset på prisen. Du har sikret flasken, men svækket en mulig sag.`, hpAendring: 8, maxHpAendring: -3, naesteTrin: 'klokken_febervognen' },
          { log: `Drengen ser lettet ud, fordi flasken bevæger sig mod vognen. Han ser ikke, hvad kvitteringen kunne have gjort senere.`, hpAendring: 10, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Gem kvitteringen som bevis',
        udfaldListe: [
          { log: `Købmanden opdager for sent, at kvitteringen også binder ham. Vreden forsvinder, og han begynder at regne.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du har ikke reddet nogen endnu, men du har fået et greb om manden, der satte prisen. Det er koldt, men kan føre til mere.`, hpAendring: -6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Vagten nikker næsten usynligt. Hun kan ikke tage sagen uden papir. Nu har hun papir.`, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Pres købmanden til at sænke priserne',
        udfaldListe: [
          { log: `Han sænker prisen med sammenbidte tænder. Flere får råd til medicin, men alle ser, at det krævede en trussel.`, guldAendring: 85, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden går med til det og hæver prisen på salt i stedet. Regningen rammer bare et andet sted.`, guldAendring: 60, hpAendring: -6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Folk jubler, men lærlingen ved boden græder stille. Han ved, hvem der skal forklare tabet senere.`, maxHpAendring: 6, naesteTrin: 'klokken_bag_boderne' }
        ]
      },
      {
        tekst: 'Sælg flasken tilbage med fortjeneste',
        udfaldListe: [
          { log: `Handlen lykkes. Guldet kan redde dig senere, men råbene fra febervognen følger dig fra torvet.`, guldAendring: 260, maxHpAendring: -6 },
          { log: `Købmanden køber flasken tilbage og kalder dig fornuftig. Hans anerkendelse føles værre end en fornærmelse.`, guldAendring: 220, hpAendring: -8 },
          { log: `Du tjener på forvirringen og går. Måske gør mønterne nytte senere. I dag køber de dig afstand.`, guldAendring: 190, maxHpAendring: -3 }
        ]
      },
      {
        tekst: 'Køb hele medicinlageret med diamanten',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: `Købmanden stirrer på diamanten. Lægen får hele lageret, og inden længe taler hele torvet om din handel.`, givItem: 'livseliksir', maxHpAendring: 10, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Diamanten hjælper mange syge nu, men gør også købmanden rigere end før. Resultatet er godt, selv om handlen stadig er skæv.`, hpAendring: 18, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lægen tager imod kassen og sender dig et kort blik. Taknemmelighed og vrede kan godt stå i samme ansigt.`, givItem: 'mad', maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Sæt dit fine tøj i pant',
        kosterItem: 'flot_toej',
        udfaldListe: [
          { log: `Det fine tøj ender på boden som pant. Købmanden tager imod, og flasken kan gå videre til de syge.`, hpAendring: 12, maxHpAendring: 5, naesteTrin: 'klokken_febervognen' },
          { log: `Købmanden vurderer tøjet uden skam. Det vender sig i dig, men flasken skifter hænder uden mere vold.`, hpAendring: 8, naesteTrin: 'klokken_febervognen' },
          { log: `En kvinde i mængden ler bittert og siger, at fint tøj stadig er en lettere pris end en nat i gældskælderen. Hun tager ikke fejl.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      }
    ]
  },

  klokken_skyggerne: {
    id: 'klokken_skyggerne',
    titel: 'Hænder i mængden',
    biome: ['by', 'marked'],
    tekst: `Du træder ud til siden og ser på hænderne i stedet for ansigterne. Det er ofte dér, folk afslører sig først.

Købmandens lærling har en ekstra flaske i inderlommen. Vagten med det pæne skæg skjuler en kvittering med den forkerte dato. Drengen gemmer en lap med tre navne. Ingen af dem er hans.

Du kan handle nu. Det løser ikke hele sagen, men det kan åbne en vej.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Stjæl drengens lap med navne',
        udfaldListe: [
          { log: `Navnene tilhører patienter, ikke medskyldige. Drengen ville dele dosen, selv om han sagde, at flasken kun var til én. Klokken dirrer.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' },
          { log: `Du tager lappen uden at blive opdaget. Det første navn er skrevet med en voksens hånd.`, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Drengen opdager dig og råber “tyv”. Ordet rammer mængden skævt, mens han selv står med den stjålne flaske.`, hpAendring: -8, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Stjæl lærlingens ekstra flaske',
        udfaldListe: [
          { log: `Flasken glider ind under din kappe. Du kan bruge den til at redde nogen, men den afgør ikke sagen på torvet.`, givItem: 'livseliksir', maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lærlingen opdager tabet og bliver hvid i ansigtet. Han er en del af sagen, men næppe den, der styrer den.`, hpAendring: -9, givItem: 'livseliksir', naesteTrin: 'klokken_bag_boderne' },
          { log: `Du får flasken, men en gammel kone ser det. Hun træder ikke i vejen.`, givItem: 'livseliksir', maxHpAendring: 3, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Betal bøden med købmandens mønter',
        udfaldListe: [
          { log: `Pungen rummer nok til bøden. Du flytter købmandens penge direkte over på lovens bord. Elegant, men stadig tyveri.`, guldAendring: 120, naesteTrin: 'klokken_vagtstuen' },
          { log: `Du får pungen, men købmandens skriver ser din albue. Nu kan drengens sag og din sag blandes sammen.`, guldAendring: 90, hpAendring: -10, naesteTrin: 'klokken_vagtstuen' },
          { log: `Du lader et par mønter falde foran vagten. Hun forstår nok til at se væk et øjeblik.`, guldAendring: 60, maxHpAendring: 4, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Skær markisen ned og befri drengen',
        kraeverItem: 'kniv',
        udfaldListe: [
          { log: `Markisen falder som et vådt sejl, og drengen slipper fri. En ældre mand bliver ramt på skulderen, men ingen bliver trampet ned.`, hpAendring: -7, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Forvirringen breder sig for hurtigt. Folk løber i alle retninger, og et øjeblik ved ingen, hvor flasken er.`, hpAendring: -14, givItem: 'kniv', naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Drengen er væk, men lappen med navnene ligger på brostenene. Den kan hjælpe de syge, men han kan ikke længere forklare den.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' }
        ]
      },
      {
        tekst: 'Pres lærlingen til at tale',
        udfaldListe: [
          { log: `Han bryder ikke sammen. Han begynder at forhandle, og det fortæller dig, at han ved noget.`, naesteTrin: 'klokken_bag_boderne' },
          { log: `Lærlingen hvisker, at reserveflasken ikke er til salg. Den er til købmandens egen familie, hvis feberen når deres hus.`, maxHpAendring: 4, naesteTrin: 'klokken_dosis' },
          { log: `Han giver dig et navn fra gældsbogen for at redde sig selv. Det er ikke modigt, men det giver dig en åbning.`, guldAendring: 40, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Afled torvet som joker',
        kraeverKarakter: 'joker_m',
        udfaldListe: [
          { log: `Du får torvet til at le, og vagternes greb om drengen løsner sig. For et øjeblik falder spændingen.`, hpAendring: 12, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vittigheden rammer købmanden, men også en syg familie i mængden. Folk ler, og stemningen bliver ikke mildere af den grund.`, guldAendring: 80, hpAendring: -8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du gemmer en sandhed i en spøg. Klokken svarer med et lavt slag.`, maxHpAendring: 7, naesteTrin: 'klokken_skyggerne' }
        ]
      },
      {
        tekst: 'Afled torvet som harlekin',
        kraeverKarakter: 'joker_f',
        udfaldListe: [
          { log: `Du får torvet til at le, og vagternes greb om drengen løsner sig. For et øjeblik falder spændingen.`, hpAendring: 12, naesteTrin: 'klokken_borgerraadet' },
          { log: `Vittigheden rammer købmanden, men også en syg familie i mængden. Folk ler, og stemningen bliver ikke mildere af den grund.`, guldAendring: 80, hpAendring: -8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du gemmer en sandhed i en spøg. Klokken svarer med et lavt slag.`, maxHpAendring: 7, naesteTrin: 'klokken_skyggerne' }
        ]
      }
    ]
  },

  klokken_taksten: {
    id: 'klokken_taksten',
    titel: 'Byens takst',
    biome: ['by', 'marked'],
    tekst: `Da du nævner byens faste takst, kommer flere dokumenter frem. Ingen er enige om, hvordan de skal læses. Det passer både købmanden og vagterne fint.

En gammel markedskone siger: “Når fine folk sætter prisen ned, kalder de det orden. Når fattige gør det, kalder de det tyveri.”

Hun siger det roligt, og ingen på torvet modsiger hende.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Sæt den lave takst og betal forskellen',
        puljeVaerdi: 80,
        udfaldListe: [
          { log: `Købmanden accepterer, fordi taksten står på papir. Du betaler forskellen, og flasken går til de syge. Alle ser stadig, hvem der havde råd til at vælge.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_febervognen' },
          { log: `Handlen går igennem. Da prisen falder, får en ung mor også råd til medicin til sin søn.`, givItem: 'mad', maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Du betaler forskellen og løser det akutte problem. Men så længe løsningen kræver din pung, er den ikke åben for alle.`, hpAendring: 8, maxHpAendring: -2, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Tru med at lukke købmandens bod',
        udfaldListe: [
          { log: `Han åbner bøgerne, fordi han risikerer at miste sin stadeplads. Truslen virker, men ingen er i tvivl om, at det er tvang.`, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `De andre købmænd bliver stille. De ser, hvad du kan gøre mod én af dem, og frygten vil ikke forsvinde med denne sag.`, maxHpAendring: 5, hpAendring: -5, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `En lærling smutter om bag boden med noget under jakken. Trusler flytter sandhed. De får den ikke altid frem.`, naesteTrin: 'klokken_bag_boderne' }
        ]
      },
      {
        tekst: 'Frikend drengen med det samme',
        udfaldListe: [
          { log: `Drengen løber ikke. Måske stoler han på dig. Måske ved han bare ikke, hvor han ellers skal gå hen.`, maxHpAendring: 4, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Købmanden råber om overgreb. Han har en pointe, selvom han bruger den grimt.`, hpAendring: -8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Torvet jubler for hurtigt. Hurtig jubel kan være lige så farlig som hurtig straf.`, hpAendring: 10, maxHpAendring: -3, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Lad torvet stemme om prisen',
        udfaldListe: [
          { log: `Hænderne ryger op. Ikke alle forstår papirerne, men mange kender sult og sygdom.`, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Afstemningen bliver hård, men folk, der normalt kun betaler, får for en gangs skyld indflydelse på prisen.`, hpAendring: -9, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `En købmand lukker sin bod i protest. En anden sænker prisen, fordi hun ikke tør andet. Begge reaktioner kan ændre byen.`, guldAendring: 70, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Sæt dit fine tøj i pant for rådet',
        kosterItem: 'flot_toej',
        udfaldListe: [
          { log: `Tøjet hænger på væggen som garanti. Folk ler først, men pantet gør dit løfte konkret.`, maxHpAendring: 8, naesteTrin: 'klokken_febervognen' },
          { log: `Rådsbuddet tager højtideligt imod pantet. Sagen er nu officiel, men papirarbejdet forsinker hjælpen.`, hpAendring: -5, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' },
          { log: `Købmanden accepterer pantet, men kalder det teater. Han tager ikke helt fejl. Nogle gange virker teater, fordi alle kan se det.`, hpAendring: 6, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Lad drengen arbejde gælden af',
        udfaldListe: [
          { log: `Det lyder mildt sammenlignet med en celle. Så spørger drengen, hvor mange år en flaske er værd.`, maxHpAendring: -4, hpAendring: 8, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Købmanden accepterer mistænkeligt hurtigt. Markedskonen lukker øjnene; hun har tydeligvis set den løsning før.`, hpAendring: -7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Vagterne kan lide forslaget, fordi det kræver mindre papirarbejde. Det er grund nok til at undersøge aftalen nærmere.`, maxHpAendring: 3, naesteTrin: 'klokken_vagtstuen' }
        ]
      }
    ]
  },

  klokken_bag_boderne: {
    id: 'klokken_bag_boderne',
    titel: 'Bag boderne',
    biome: ['by', 'marked'],
    tekst: `Bag apotekerboden står kasserne tæt. Torvets råb er dæmpet heromme, og alt ser mere nøgternt ud.

Flere kasser bærer byens nødmærke. Du finder også en ekstra flaske pakket ind i uld. På låget står der: “Til familien.”

En lærling spærrer vejen. Drengen frygter straf. Lærlingen frygter at miste det arbejde, der holder hans egen familie ude af febervognen.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Tag den ekstra flaske til lægen',
        udfaldListe: [
          { log: `Lægen tager flasken uden spørgsmål. Hun har brug for medicinen nu, og lærlingens rolle forbliver skjult lidt længere.`, givItem: 'livseliksir', maxHpAendring: -2, naesteTrin: 'klokken_febervognen' },
          { log: `Du får flasken væk uden råb. De syge får hjælp, men købmandens handel kan fortsætte.`, hpAendring: 10, maxHpAendring: -3, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lærlingen lader dig tage den og hvisker, at han hader dig for det i dag og måske takker dig i morgen.`, hpAendring: 8, naesteTrin: 'klokken_dosis' }
        ]
      },
      {
        tekst: 'Vis torvet mærkerne fra nødkassen',
        udfaldListe: [
          { log: `Folk forstår mærkerne hurtigere end dokumenterne. En gammel mand spytter på brostenene: Tyveriet begyndte før drengen.`, hpAendring: -8, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden råber, at han købte varerne lovligt. Klokken slår, for lovligheden er kun en del af historien.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Nogen begynder at flå kasserne op. Du har vist beviset, men ikke givet vreden nogen retning.`, hpAendring: -16, guldAendring: 60, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Byt flasken for gældsbogen',
        udfaldListe: [
          { log: `Han tøver længe og vælger til sidst gældsbogen. Papiret kan skade hans chef, men hans familie mister flasken.`, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Han nægter først, men river til sidst en nøgle fra snoren om halsen. Du får adgang til bogen, men ingen tak.`, hpAendring: -5, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Han beholder flasken og giver dig kun nogle sider. Det er ikke nok til at vælte nogen, men nok til at gøre dem bange.`, guldAendring: 45, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Køb flasken og lærlingens tavshed',
        puljeVaerdi: 90,
        udfaldListe: [
          { log: `Han tager guldet, og du får flasken. Den akutte mangel er løst, men købmanden står stadig ved sin bod i morgen.`, givItem: 'livseliksir', maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lærlingen tager guldet og flygter. Du har skaffet en flaske, men mistet et vidne – præcis som købmanden kunne ønske sig.`, givItem: 'livseliksir', hpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han tager kun halvdelen og beder dig give resten til febervognen. Han er sværere at dømme, end du ventede.`, guldAendring: 35, maxHpAendring: 5, naesteTrin: 'klokken_febervognen' }
        ]
      },
      {
        tekst: 'Følg lærlingens flugtvej som jæger',
        kraeverKarakter: 'hunter_m',
        udfaldListe: [
          { log: `Blikket fører dig til en bagport, hvor en lille pakke allerede ligger klar. Han planlagde ikke kun at hjælpe sin familie. Han planlagde at forsvinde.`, guldAendring: 70, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Du finder en kurér ved bagporten. Han bærer mærker fra en anden by. Varerne er ikke kun stjålet fra nødkassen. De er på vej ud af byen.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du følger sporet for langt og mister overblikket over torvet. Da du vender tilbage, har sagen allerede flyttet sig.`, hpAendring: -8, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Følg lærlingens flugtvej som skytte',
        kraeverKarakter: 'hunter_f',
        udfaldListe: [
          { log: `Blikket fører dig til en bagport, hvor en lille pakke allerede ligger klar. Han planlagde ikke kun at hjælpe sin familie. Han planlagde at forsvinde.`, guldAendring: 70, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Du finder en kurér ved bagporten. Han bærer mærker fra en anden by. Varerne er ikke kun stjålet fra nødkassen. De er på vej ud af byen.`, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du følger sporet for langt og mister overblikket over torvet. Da du vender tilbage, har sagen allerede flyttet sig.`, hpAendring: -8, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      },
      {
        tekst: 'Undersøg smuglerknuderne som kaptajn',
        kraeverKarakter: 'pirate_m',
        udfaldListe: [
          { log: `Knuderne stammer fra et skib, der undgår registrering. Købmanden er næppe øverst i kæden, og sagen er større end hans bod.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du løsner den rigtige knude og finder et rum med mønter. Smuglere stoler mere på reb end på mennesker.`, guldAendring: 130, naesteTrin: 'klokken_borgerraadet' },
          { log: `En kurér ser, at du kender arbejdet, og tilbyder dig en andel for at gå. Tilbuddet er grimt, men klart.`, guldAendring: 170, maxHpAendring: -4 }
        ]
      },
      {
        tekst: 'Undersøg smuglerknuderne som korsar',
        kraeverKarakter: 'pirate_f',
        udfaldListe: [
          { log: `Knuderne stammer fra et skib, der undgår registrering. Købmanden er næppe øverst i kæden, og sagen er større end hans bod.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Du løsner den rigtige knude og finder et rum med mønter. Smuglere stoler mere på reb end på mennesker.`, guldAendring: 130, naesteTrin: 'klokken_borgerraadet' },
          { log: `En kurér ser, at du kender arbejdet, og tilbyder dig en andel for at gå. Tilbuddet er grimt, men klart.`, guldAendring: 170, maxHpAendring: -4 }
        ]
      },
      {
        tekst: 'Varm kasseseglene med faklen',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: `Varmen får den gamle voks frem. Nødkassens segl er ikke fjernet, kun skjult under et nyt.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
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
    tekst: `Lægen sætter flasken på et lille bord. Hun taler lavt, men alle ved vognen lytter.

“En fuld dosis kan redde én hurtigt. En tynd blanding kan holde flere i live, måske kun indtil næste flaske kommer. Vi kan også lade den være lukket og bruge den som bevis mod dem, der solgte nødhjælpen.”

Drengen står ved siden af dig. Han stjal for at redde én bestemt person. Nu skal I vælge mellem hende, de andre syge og en sag, der kan hjælpe flere senere.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Giv kvinden hele dosen',
        udfaldListe: [
          { log: `Mara klarer timen, og drengen tør endelig trække vejret. Lægen vender sig straks mod de fire andre patienter.`, hpAendring: 16, maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Dosen virker hurtigt. Mara tager drengens hånd og siger, at han ikke måtte stjæle. Han smiler, fordi hun er rask nok til at skælde ud.`, hpAendring: 12, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Hun får det bedre, men en anden patient får kramper. Ingen siger, at du valgte forkert. Det ville næsten have været nemmere.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Giv dosen til lærlingens søster',
        udfaldListe: [
          { log: `Hans søster trækker vejret friere, og lærlingen lover at åbne gældsbogen. Hjælpen har købt ham mod, men også bundet ham til dig.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Drengen forstår valget og hader det. Lærlingen forstår det også og har svært ved at møde hans blik.`, hpAendring: -8, maxHpAendring: 7, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Lærlingen vidner, men alle ved, at hans søsters behandling var prisen. Det vil præge, hvordan hans ord bliver hørt.`, guldAendring: 60, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Fortynd dosen til alle fem',
        udfaldListe: [
          { log: `Ingen rejser sig, men ingen dør lige nu. Alle fem får en chance, og ingen får et løfte.`, maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' },
          { log: `Blandingen køber dem en nat. Det er ikke en sejr, men det giver tid til at finde mere medicin.`, hpAendring: 8, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Folk kalder dig ubeslutsom. Lægen kalder dig praktisk. Begge ord kan passe til samme handling.`, guldAendring: 55, maxHpAendring: 4, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Bevar flasken som bevis',
        udfaldListe: [
          { log: `Lægen låser flasken inde. Beviset kan redde flere senere, men de syge på halmen har brug for hjælp nu.`, hpAendring: -12, maxHpAendring: 8, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Drengen kalder dig kold. Han har ikke helt ret. Han har heller ikke helt uret.`, hpAendring: -6, maxHpAendring: 7, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Flasken bliver sikret som bevis, og vreden breder sig på torvet. Den kan presse sagen frem eller få den til at løbe af sporet.`, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Brug din egen livseliksir',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: `Din eliksir løser ikke byens problem, men den fjerner det akutte pres. Nu kan sagen handle om ansvar i stedet for, hvem der dør først.`, hpAendring: 18, maxHpAendring: 8, naesteTrin: 'klokken_gaeldsbogen' },
          { log: `Lægen deler din eliksir og gemmer den oprindelige flaske som bevis. For første gang i dag kan hun arbejde uden at skulle vælge én fra.`, maxHpAendring: 10, naesteTrin: 'klokken_borgerraadet' },
          { log: `Patienterne får tid, men du mister en eliksir, du selv kunne få brug for. Det er en reel pris, også når valget var dit.`, hpAendring: 12, maxHpAendring: 7, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Del dosen med magi som troldmand',
        kraeverKarakter: 'magician_m',
        udfaldListe: [
          { log: `Staven deler væsken, men ikke rent. Du får mere medicin ud af flasken og overtager selv en voldsom feberrystelse.`, hpAendring: -12, maxHpAendring: 9, naesteTrin: 'klokken_febervognen' },
          { log: `Magien virker, da lægen styrer din rystende hånd. Hendes erfaring og din stav får dosen til at række længere.`, hpAendring: 10, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Flasken revner, og noget af dosen går tabt. Folk ser kun tabet. Lægen ser, at resten stadig kan bruges.`, hpAendring: -8, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Del dosen med magi som troldkvinde',
        kraeverKarakter: 'magician_f',
        udfaldListe: [
          { log: `Staven deler væsken, men ikke rent. Du får mere medicin ud af flasken og overtager selv en voldsom feberrystelse.`, hpAendring: -12, maxHpAendring: 9, naesteTrin: 'klokken_febervognen' },
          { log: `Magien virker, da lægen styrer din rystende hånd. Hendes erfaring og din stav får dosen til at række længere.`, hpAendring: 10, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Flasken revner, og noget af dosen går tabt. Folk ser kun tabet. Lægen ser, at resten stadig kan bruges.`, hpAendring: -8, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' }
        ]
      }
    ]
  },

  klokken_gaeldsbogen: {
    id: 'klokken_gaeldsbogen',
    titel: 'Gældsbogen',
    biome: ['by', 'marked'],
    tekst: `Gældsbogen ligger næsten fremme. Det tyder på, at mange kendte til den, men ingen havde råd til at sige noget.

Bogen rummer navnene på folk, der købte medicin på kredit, og papirerne fra byrådets salg af nødkassen. Meget af det er lovligt. Det gør ikke skaden mindre.

Brænder du bogen, slipper mange for deres gæld. Bevarer du den, kan den måske fælde dem, der solgte nødhjælpen. Sælger du den, går du herfra med en tung pung.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Brænd gældsbogen på torvet',
        udfaldListe: [
          { log: `Bogen brænder hurtigt. Folk græder af lettelse, men vagterne mister beviset mod rådet. Gælden er væk, og det samme er sporene.`, maxHpAendring: 9, hpAendring: -6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden råber som en såret mand. Han mister sit greb om skyldnerne, mens byen mister et vigtigt bevis.`, maxHpAendring: 8, guldAendring: -40, naesteTrin: 'klokken_borgerraadet' },
          { log: `Asken flyver over torvet som sort sne. En kvinde samler et forkullet hjørne med sit eget navn op og kysser det.`, hpAendring: 14, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Aflever bogen til vagterne',
        udfaldListe: [
          { log: `Vagten tager bogen med begge hænder. Nu har hun et stærkt bevis, men sagen er langt fra vundet.`, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' },
          { log: `Folk protesterer, fordi retten arbejder langsomt. Den kan nå frem til en retfærdig dom, men måske først efter vinteren.`, hpAendring: -9, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Købmanden bliver først bange, da vagten forsegler bogen. Papirerne kan stadig ramme ham.`, guldAendring: 55, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Sælg bogen tilbage til købmanden',
        udfaldListe: [
          { log: `Han betaler uden at forhandle. Enten kunne du have krævet mere, eller også skulle du have krævet noget helt andet.`, guldAendring: 260, maxHpAendring: -6 },
          { log: `Du går med en tung pung. De mennesker, hvis navne står i bogen, beholder deres gæld.`, guldAendring: 230, hpAendring: -6 },
          { log: `Købmanden brænder bogen i sin egen ovn. Du får guldet, og han får tavshed.`, guldAendring: 210, maxHpAendring: -4 }
        ]
      },
      {
        tekst: 'Kopiér navnene før bogen afleveres',
        udfaldListe: [
          { log: `Du skriver, til fingrene kramper. Arbejdet er langsomt, men kopierne kan overleve, selv hvis originalen forsvinder.`, hpAendring: -8, maxHpAendring: 10, naesteTrin: 'klokken_borgerraadet' },
          { log: `Nogle navne bliver ulæselige i hasten. Du får ikke alt med, men nok til at vagterne ikke står alene med beviset.`, hpAendring: -5, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `En skriver fra rådet hjælper dig i stilhed. Han vil ikke være helt. Han vil bare kunne sove.`, maxHpAendring: 7, guldAendring: 45, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Brænd rentesiderne med faklen',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: `Ilden tager renterne. Hovedgælden og beviserne står tilbage. Ingen får alt, men flere får en lettelse.`, maxHpAendring: 9, naesteTrin: 'klokken_borgerraadet' },
          { log: `Faklen slikker for langt ind over siden. Du redder det meste, men ikke de navne, der stod tættest på flammen.`, hpAendring: -8, maxHpAendring: 7, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden kalder det hærværk. En skyldner kalder det en ny opgørelse. De står ved det samme sodsværtede bord.`, guldAendring: -30, maxHpAendring: 10, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Find den skjulte fortjeneste som dværg',
        kraeverKarakter: 'dwarf_m',
        udfaldListe: [
          { log: `Tallene er stablet som en dårlig minegang. Du finder den ene post, der holder hele regnskabet oppe, og den kan ikke forklares.`, guldAendring: 120, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du ser præcis, hvor prisen blev lagt på igen og igen. Købmandens dygtighed er en del af problemet.`, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du finder en kolonne, der peger væk fra boden og ind mod rådhuset. Sagen bliver større, og dermed langsommere.`, hpAendring: -6, maxHpAendring: 9, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Find den skjulte fortjeneste som minegraver',
        kraeverKarakter: 'dwarf_f',
        udfaldListe: [
          { log: `Tallene er stablet som en dårlig minegang. Du finder den ene post, der holder hele regnskabet oppe, og den kan ikke forklares.`, guldAendring: 120, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du ser præcis, hvor prisen blev lagt på igen og igen. Købmandens dygtighed er en del af problemet.`, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du finder en kolonne, der peger væk fra boden og ind mod rådhuset. Sagen bliver større, og dermed langsommere.`, hpAendring: -6, maxHpAendring: 9, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Grav efter kassen under boden',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: `Under boden ligger en næsten tom kasse med rådets segl. De få rester er nok til at vise, at nogen har tømt den.`, guldAendring: 90, maxHpAendring: 5, naesteTrin: 'klokken_borgerraadet' },
          { log: `Brostenene giver efter, og folk snubler over hullet. Du finder beviset, men efterlader kaos og ømme ankler.`, hpAendring: -10, guldAendring: 80, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du finder kun en tom kasse og et gammelt segl. Selv den tomme kasse viser, at noget mangler.`, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' }
        ]
      }
    ]
  },

  klokken_borgerraadet: {
    id: 'klokken_borgerraadet',
    titel: 'Dom på åben plads',
    biome: ['by', 'marked'],
    tekst: `Torvet er blevet en retssal uden vægge. Alt foregår åbent, men råbene gør det svært at tænke klart.

Købmanden har loven og sine papirer. Drengen har flasken – eller mindet om den. Bag lægen venter de syge. Vagterne vil have en afgørelse, de kan håndhæve i morgen.

Klokken over toldhuset er stille nu. Der findes ingen ren løsning, men nogen skal tage ansvaret for den, der bliver valgt.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Lad torvet stemme',
        udfaldListe: [
          { log: `Flertallet frikender drengen og tvinger købmanden til at åbne lageret. Jubelen stopper, da flere hænder rækker frem, end lægen kan hjælpe.`, hpAendring: -12, maxHpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Flertallet kræver, at drengen arbejder gælden af. Det er mildere end fængsel, men de mennesker, der stemte, går selv hjem som frie.`, hpAendring: 8, maxHpAendring: -3, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Flertallet deler skylden mellem dreng, købmand og råd. Alle bliver utilfredse på en måde, der næsten ligner balance.`, maxHpAendring: 9, guldAendring: 65, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Del sagen mellem lægen og vagterne',
        udfaldListe: [
          { log: `Sagen bliver delt i to, så både medicinen og tyveriet kan håndteres. Ansvaret bliver også delt, og ingen står med hele beslutningen.`, maxHpAendring: 6, hpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Lægen tager flasken, og vagten tager drengen. Begge gør deres arbejde, men drengen ender stadig med bundne hænder.`, hpAendring: -6, maxHpAendring: 7, naesteTrin: 'klokken_vagtstuen' },
          { log: `Folk accepterer delingen. Senere vil nogle kalde den klog og andre kalde den en pæn måde at undgå det svære valg.`, maxHpAendring: 5, guldAendring: 45, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Straff købmanden og giv drengen en bøde',
        udfaldListe: [
          { log: `Drengen slipper for cellen, og købmanden mister mere end flasken. Torvet får en klar regel at bruge næste gang.`, guldAendring: 90, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Nogle kalder bøden smålig. Andre kalder den nødvendig. Drengen ser ud, som om han måske kan forstå den om et år. Ikke i dag.`, hpAendring: 8, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Købmanden betaler, men hans kolleger lukker tre boder i protest. Retfærdighed kan give tomme hylder, før den giver bedre priser.`, guldAendring: 120, hpAendring: -8, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Lad drengen tale først',
        udfaldListe: [
          { log: `Han siger, at han stjal og ville gøre det igen. Torvet gisper. Det er det dårligst mulige forsvar, men måske også det mest ærlige.`, maxHpAendring: 9, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Han prøver at lyve for at beskytte Mara, men klokken slår. Så fortæller han det enkelt uden at pynte på sig selv, og folk lytter.`, hpAendring: 10, maxHpAendring: 7, naesteTrin: 'klokken_barnet_i_gyden' },
          { log: `Han går i stå foran alle. Du gav ham ordet, men frygten tager stemmen fra ham.`, hpAendring: -10, maxHpAendring: 5, naesteTrin: 'klokken_barnet_i_gyden' }
        ]
      },
      {
        tekst: 'Kræv en enkel løsning som viking',
        kraeverKarakter: 'viking_m',
        udfaldListe: [
          { log: `Folk forstår den direkte aftale: Mad og medicin ud nu, bøden bagefter. Kasserne bliver flyttet, og patienterne får hjælp.`, hpAendring: 12, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden kalder det plyndring med regler. Du svarer ikke. Reglerne får til gengæld nogle flasker ud af boden.`, guldAendring: 80, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Din løsning virker i dag, men bygger ikke meget tillid til i morgen. De syge får i det mindste chancen for at nå dertil.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Kræv en enkel løsning som valkyrie',
        kraeverKarakter: 'viking_f',
        udfaldListe: [
          { log: `Folk forstår den direkte aftale: Mad og medicin ud nu, bøden bagefter. Kasserne bliver flyttet, og patienterne får hjælp.`, hpAendring: 12, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Købmanden kalder det plyndring med regler. Du svarer ikke. Reglerne får til gengæld nogle flasker ud af boden.`, guldAendring: 80, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Din løsning virker i dag, men bygger ikke meget tillid til i morgen. De syge får i det mindste chancen for at nå dertil.`, hpAendring: 10, maxHpAendring: 4, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Skab afstand med buen synlig',
        kraeverItem: 'bue',
        udfaldListe: [
          { log: `Folk træder tilbage. Lægen får plads, og vagterne har færre undskyldninger for at bruge magt. Alle har dog set buen.`, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `En mand råber, at våben ikke er argumenter. Han har ret. Alligevel stopper han med at skubbe.`, hpAendring: -5, maxHpAendring: 7, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Buen dæmper råbene, men ikke spændingen. Det er alligevel nok til at få en beslutning igennem.`, hpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Læg sværdet ned og kræv åbenhed',
        kraeverItem: 'svaerd',
        udfaldListe: [
          { log: `Sværdet rammer brostenene med et hårdt slag. Købmanden lægger kvitteringen frem, vagten sin nøgle og drengen flasken.`, maxHpAendring: 9, naesteTrin: 'klokken_dosis' },
          { log: `En mand prøver at tage sværdet. Du når at træde på klingen med støvlen. Symboler virker kun, mens nogen passer på dem.`, hpAendring: -8, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `Folk følger ikke dit eksempel helt, men flere begynder at vise, hvad de har skjult. Det bringer sagen videre.`, maxHpAendring: 6, naesteTrin: 'klokken_gaeldsbogen' }
        ]
      }
    ]
  },

  klokken_barnet_i_gyden: {
    id: 'klokken_barnet_i_gyden',
    titel: 'Drengen i gyden',
    biome: ['by', 'marked'],
    tekst: `Gyden bag bageren er så smal, at larmen fra torvet bliver til en fjern mur af lyd.

Drengen hedder Nilo. Han siger navnet hurtigt og ser mod gadens ende. Kvinden i febervognen hedder Mara. Hun gav ham brød, fordi hun selv mistede et barn, mens andre stod og diskuterede regler.

Nilo stjal flasken til Mara, selv om han vidste, at dosen måske kunne deles. Han løj, fordi han var bange for, at en mindre dosis ikke ville være nok til hende.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_by.webp',
    valg: [
      {
        tekst: 'Følg Nilo tilbage til torvet',
        udfaldListe: [
          { log: `Han går ved siden af dig, ikke bagved. På torvet står han frem som et menneske med støtte, ikke som en fange.`, maxHpAendring: 7, naesteTrin: 'klokken_borgerraadet' },
          { log: `Han når næsten frem, før han kaster op af skræk. Du bliver hos ham, til han er klar til at gå videre.`, hpAendring: -5, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Han fortæller dig et ekstra navn på vejen: lærlingen, der viste ham flaskerne. Nu bærer du mere sandhed, end han selv tør.`, guldAendring: 35, naesteTrin: 'klokken_bag_boderne' }
        ]
      },
      {
        tekst: 'Hjælp Nilo ud gennem nordporten',
        udfaldListe: [
          { log: `Nilo løber uden at se tilbage. Du har reddet ham fra straffen, men sagen har mistet sit vigtigste vidne.`, hpAendring: 8, maxHpAendring: -3, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `På vej mod porten stopper han og giver dig lappen med navnene. Han vil ikke være helt, bare ikke den eneste grund til, at nogen bliver reddet.`, maxHpAendring: 5, naesteTrin: 'klokken_dosis' },
          { log: `Vagterne opdager flugten og sætter efter ham. Købmanden står tilbage med en langt enklere historie om en tyv på flugt.`, hpAendring: -8, naesteTrin: 'klokken_vagtstuen' }
        ]
      },
      {
        tekst: 'Giv Nilo mad og lad ham vælge',
        kosterItem: 'mad',
        udfaldListe: [
          { log: `Han spiser halvdelen og gemmer resten. Så vælger han at tale, fordi han ikke vil lade Mara bære følgerne af hans tavshed.`, maxHpAendring: 8, naesteTrin: 'klokken_borgerraadet' },
          { log: `Han vælger at flygte. Det skuffer dig, men et barn, der får sit første frie valg, vælger ofte den åbne vej.`, hpAendring: 10, maxHpAendring: -2, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han vælger at arbejde gælden af hos lægen i stedet for købmanden. Det er stadig gæld, men arbejdet hjælper de syge.`, maxHpAendring: 6, hpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Giv Nilo soveposen og send ham væk',
        kosterItem: 'sovepose',
        udfaldListe: [
          { log: `Med soveposen over skulderen ligner han en ung rejsende i stedet for en flygtning. Det får ham sikkert gennem porten.`, maxHpAendring: 5, hpAendring: -4, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han tager imod den og spørger, om Mara ved det. Du svarer ikke hurtigt nok.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `En portvagt ser soveposen og lader ham passere som en ung handelsdreng. Han er ude af byen før nattevagten.`, hpAendring: 8, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Giv Nilo en kniv til beskyttelse',
        kosterItem: 'kniv',
        udfaldListe: [
          { log: `Han tager kniven forsigtigt. Du har givet ham en måde at beskytte sig på – og en ny fare at bære.`, maxHpAendring: -2, hpAendring: 8, naesteTrin: 'klokken_aftenmarkedet' },
          { log: `Han nægter kniven. “Jeg stjal for at redde,” siger han. “Jeg vil ikke lære, at alle problemer har en skarp løsning.”`, maxHpAendring: 7, givItem: 'kniv', naesteTrin: 'klokken_borgerraadet' },
          { log: `Han gemmer kniven og begynder først at græde bagefter. Tilliden og ansvaret rammer ham på samme tid.`, hpAendring: -5, maxHpAendring: 5, naesteTrin: 'klokken_aftenmarkedet' }
        ]
      },
      {
        tekst: 'Før Nilo gennem baggårdene som eventyrer',
        kraeverKarakter: 'explorer_f',
        udfaldListe: [
          { log: `Du finder en rute, hvor han kan nå febervognen uden at passere vagterne. Han kan stadig vælge at tale bagefter.`, maxHpAendring: 7, naesteTrin: 'klokken_febervognen' },
          { log: `Baggårdene er ikke tomme. Folk ser ham sammen med dig, og nye rygter når torvet før jer.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du viser ham en vej tilbage til torvet fra siden. Nogle gange hjælper man bedst ved ikke at føre folk ind gennem hoveddøren.`, hpAendring: 8, naesteTrin: 'klokken_borgerraadet' }
        ]
      },
      {
        tekst: 'Før Nilo gennem baggårdene som udforsker',
        kraeverKarakter: 'explorer_m',
        udfaldListe: [
          { log: `Du finder en rute, hvor han kan nå febervognen uden at passere vagterne. Han kan stadig vælge at tale bagefter.`, maxHpAendring: 7, naesteTrin: 'klokken_febervognen' },
          { log: `Baggårdene er ikke tomme. Folk ser ham sammen med dig, og nye rygter når torvet før jer.`, hpAendring: -6, maxHpAendring: 6, naesteTrin: 'klokken_borgerraadet' },
          { log: `Du viser ham en vej tilbage til torvet fra siden. Nogle gange hjælper man bedst ved ikke at føre folk ind gennem hoveddøren.`, hpAendring: 8, naesteTrin: 'klokken_borgerraadet' }
        ]
      }
    ]
  },

  klokken_aftenmarkedet: {
    id: 'klokken_aftenmarkedet',
    titel: 'Da boderne lukker',
    biome: ['by', 'marked'],
    tekst: `Hen mod aften lukker boderne én efter én. Torvet ligner igen et marked i stedet for en domstol. Træborde, kurve og prisskilte får hurtigt det hele til at se normalt ud.

Nogle nikker til dig. Andre vender sig væk. Lægen vasker hænder i en balje med gråt vand, mens en vagt skriver noget ned, der måske bliver til en sag – eller bare endnu et ark.

På trappen til toldhuset venter tre ting: en pung fra købmanden, en lille pakke fra lægen og en ledig plads på bænken ved siden af Nilo eller Mara, hvis de stadig er der.`,
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_marked.webp',
    valg: [
      {
        tekst: 'Tag købmandens betaling',
        udfaldListe: [
          { log: `Pungen er tung nok til at gøre næste dag lettere. Den fortæller ikke, om betalingen var for arbejdet eller for din tavshed.`, guldAendring: 180, maxHpAendring: -3 },
          { log: `Købmanden nikker, som om I nu har en fælles forståelse. Du tager pengene, men ikke uden en pris.`, guldAendring: 150, hpAendring: -5 },
          { log: `Du tager pengene og går, før nogen kan gøre betalingen til en historie om dig. Den bliver nok fortalt alligevel.`, guldAendring: 130 }
        ]
      },
      {
        tekst: 'Tag imod lægens forsyninger',
        udfaldListe: [
          { log: `Pakken indeholder tør mad og et bittert pulver. Lægen siger, at overlevelse ofte begynder med helt almindelige forsyninger.`, givItem: 'mad', hpAendring: 12 },
          { log: `Lægen giver dig en lille flaske og siger, at du skal bruge den uden at vente på en ren grund.`, givItem: 'livseliksir', maxHpAendring: 4 },
          { log: `Du får bandager og mad. Lægen hverken tilgiver eller dømmer dig, men hun anerkender, at du hjalp.`, givItem: 'klude', hpAendring: 10, maxHpAendring: 3 }
        ]
      },
      {
        tekst: 'Sæt dig og lyt til den anden side',
        udfaldListe: [
          { log: `Du får ingen ny løsning, men flere detaljer. Det ændrer ikke din beslutning, men giver dig et mere ærligt billede af følgerne.`, maxHpAendring: 10, hpAendring: 6 },
          { log: `Historien bliver længere, mens lyset falmer. Du forstår ikke alt, men du forstår, hvorfor den enkle dom virkede så fristende.`, maxHpAendring: 9 },
          { log: `Du bliver siddende, til torvet næsten er tomt. Kroppen får hvile, og dit ansvar står klarere.`, hpAendring: 18, maxHpAendring: 5 }
        ]
      },
      {
        tekst: 'Køb mad til dem ved febervognen',
        puljeVaerdi: 70,
        udfaldListe: [
          { log: `Maden løser ikke sagen, men gør natten lettere for dem, der stadig venter ved vognen.`, hpAendring: 14, maxHpAendring: 5 },
          { log: `Du deler brød ud, og folk tager imod uden taler. Her er selve handlingen nok.`, hpAendring: 16 },
          { log: `En købmand sænker prisen på de sidste brød, da han ser køen. Om det skyldes skam eller god forretning, får folk stadig mere at spise.`, guldAendring: 40, maxHpAendring: 4 }
        ]
      },
      {
        tekst: 'Køb en flaske til rejsen',
        puljeVaerdi: 140,
        udfaldListe: [
          { log: `Flasken ligger tungt i tasken. Det er fornuftigt at være klar til næste fare, selv om det føles forkert efter dagen på torvet.`, givItem: 'livseliksir', maxHpAendring: -2 },
          { log: `Du betaler fuld pris og hader det lidt. Men en død helt hjælper ingen i morgen.`, givItem: 'livseliksir', hpAendring: 8 },
          { log: `Lægen sælger dig en flaske billigere, end købmanden ville have gjort. Hun kalder det ikke belønning. Hun kalder det lagerstyring.`, givItem: 'livseliksir', guldAendring: 35 }
        ]
      },
      {
        tekst: 'Gå uden belønning',
        udfaldListe: [
          { log: `Du går, mens folk diskuterer, om du var klog, hård, blød eller grådig. Du lader dem tale.`, maxHpAendring: 8 },
          { log: `Klokken slår én gang bag dig. Ikke som en anklage, men som en påmindelse om alt det, der stadig kun er halvt fortalt.`, hpAendring: 12, maxHpAendring: 4 },
          { log: `Du får intet med til tasken, men du forlader torvet med et klarere blik på byen og dens regler.`, maxHpAendring: 6, hpAendring: 8 }
        ]
      },
      {
        tekst: 'Giv lægen en diamant',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: `Lægen tager forsigtigt imod diamanten. Den kan redde mange, men en gave af den størrelse vil også ændre magten omkring vognen.`, maxHpAendring: 12, hpAendring: 8 },
          { log: `Med diamanten kan hun købe et lager uden om købmanden, i hvert fald denne gang. Flere flasker finder en direkte vej til de syge.`, maxHpAendring: 14 },
          { log: `Rygtet om diamanten spreder sig hurtigere end hjælpen. Folk kommer både af nød og i håb om at få del i mere.`, maxHpAendring: 10, hpAendring: -6 }
        ]
      }
    ]
  }
};
