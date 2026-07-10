export const glashjertetEvents = {
  glashjertet_i_vraget: {
    id: 'glashjertet_i_vraget',
    titel: 'Glashjertet i vraget',
    biome: ['hav', 'ruin', 'ritual'],
    tekst: 'Ved lavvande ligger et skibsvrag klemt mellem sorte sten. Skroget er ikke råddent, men gennemsigtigt som mørkt rav. Bag ribberne slår et hjerte af glas. Efter hvert slag banker noget under dækket tilbage, som en hånd mod et låg. På masten står der ridset: “Tag skatten, og nogen husker dig. Tag barnet, og nogen glemmer dig.” Næsten skjult under saltlaget står en sidste linje: “Den, der betaler først, vælger sidst.”',
    unik: true,
    erSubTrin: false,
    billede: '/events/ev_hav.webp',
    valg: [
      {
        tekst: 'Læs den nederste linje højt.',
        udfaldListe: [
          { log: 'Ordene er svære at få ud. Da du siger dem, forstår du, at hjertet ikke vogter skatten, men den rækkefølge, I vælger i. Vraget falder til ro omkring dig.', hpAendring: -8, naesteTrin: 'glashjertet_eden' },
          { log: 'Ved den sidste lyd revner masten, og små glasskår drysser ned i sandet. Mellem dem ligger mønter med dit ansigt på. Du samler dem op, selvom det føles forkert.', guldAendring: 95, naesteTrin: 'glashjertet_eden' },
          { log: 'Linjen forsvinder, mens du læser. Du når at forstå advarslen: Den første betaling bliver ikke den sidste. En smal passage åbner sig ind mod hjertet.', maxHpAendring: 6, naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Spark lugen op, og følg stemmen under dækket.',
        udfaldListe: [
          { log: 'Lugen giver efter. Stemmen er væk, men lyden vækker en gammel frygt i dig. Længere inde banker nogen stadig mod træet.', hpAendring: -18, naesteTrin: 'glashjertet_underdaekket' },
          { log: 'Dit spark rammer et skjult hængsel, og dækket åbner sig med et suk. I en pyt flyder en lille tegning af en båd. Under den ligger vådt guld, varmt mod huden.', guldAendring: 130, naesteTrin: 'glashjertet_underdaekket' },
          { log: 'Du er gennem lugen, før vraget når at reagere. Et øjeblik bliver der helt stille under dækket.', naesteTrin: 'glashjertet_underdaekket' }
        ]
      },
      {
        tekst: 'Hold faklen lavt, og find de skygger, der bevæger sig forkert.',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: 'Ribbernes skygger følger flammen. Skyggen fra glashjertet gør ikke. Den peger mod en dør uden håndtag og ligner et øjeblik en vugge.', naesteTrin: 'glashjertet_skyggedoren' },
          { log: 'Flammen bliver blå. I lyset ser du mønter, der ligger oven på vandet. Du tager dem, før de synker.', guldAendring: 80, naesteTrin: 'glashjertet_skyggedoren' },
          { log: 'Saltet i luften knitrer omkring faklen. Du ser vejen, men den skarpe røg river i lungerne og får dig til at hoste blod.', hpAendring: -12, naesteTrin: 'glashjertet_skyggedoren' }
        ]
      },
      {
        tekst: 'Følg søgekvisten til det, der er begravet.',
        kraeverItem: 'soegekvist',
        udfaldListe: [
          { log: 'Kvisten søger ikke mod guldet. Den bøjer sig mod et sted i sandet, hvor nogen har skrevet det samme navn igen og igen.', naesteTrin: 'glashjertet_navnet' },
          { log: 'Barken sprækker, og kvisten ligner et øjeblik en lille arm. Den peger først mod hjertet og så mod din rygsæk. Noget herinde forventer betaling.', hpAendring: -10, naesteTrin: 'glashjertet_navnet' },
          { log: 'Kvisten finder en rusten kapsel. Indeni ligger en gylden kikkert og et tørt kort over vraget. Kortet viser tre rum, men kun to veje ud.', givItem: 'kikkert_45', naesteTrin: 'glashjertet_navnet' }
        ]
      },
      {
        tekst: 'Læg guld i skålen, og køb ét spørgsmål.',
        puljeVaerdi: 120,
        udfaldListe: [
          { log: 'Skålen sluger betalingen uden en lyd. Før du når at spørge, svarer en stemme: “Barnet lever, hvis nogen tager skylden.”', naesteTrin: 'glashjertet_eden' },
          { log: 'Skålen spytter halvdelen af mønterne tilbage som sorte skiver. Du har købt dit spørgsmål, men også vist vraget, hvor meget du ønsker kontrol.', maxHpAendring: -5, naesteTrin: 'glashjertet_eden' },
          { log: 'Vraget tager imod guldet. Plankerne glider til side og åbner en let vej ind. Den ser ud til at være brugt mange gange før.', naesteTrin: 'glashjertet_underdaekket' }
        ]
      }
    ]
  },

  glashjertet_eden: {
    id: 'glashjertet_eden',
    titel: 'Eden i glasset',
    biome: ['ritual'],
    tekst: 'Inde i skroget hænger glashjertet i kæder flettet af hår. Hver kæde bærer en messingring med et navn. Kun én ring er blank. Under hjertet ligger en diamant, en sovende dreng svøbt i sejl og en kniv med tørret salt på bladet. Drengen trækker kun vejret, når hjertet slår. Diamanten lyser kun, når hans bryst står stille. Kniven ligger mellem dem.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ritual.webp',
    valg: [
      {
        tekst: 'Løft barnet, og lad diamanten ligge.',
        udfaldListe: [
          { log: 'Drengen vågner ikke, men hans hånd lukker sig om din finger. Diamanten bliver sort, og et navn forsvinder fra kæderne. Frygten letter sit greb om dig.', maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Da du løfter ham, slår hjertet hårdt. Drengen får vejret, men lyden fra glasset skærer gennem dig.', hpAendring: -24, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Drengen er tungere, end han burde være. I sejlklædet finder du mønter, som nogen har syet ind til den, der kom for at redde ham.', guldAendring: 90, naesteTrin: 'glashjertet_barnets_vaegt' }
        ]
      },
      {
        tekst: 'Tag diamanten, og lov drengen, at du kommer tilbage.',
        udfaldListe: [
          { log: 'Diamanten løsner sig med det samme. Drengen åbner øjnene længe nok til at se, at du valgte den først. Han græder ikke, og det rammer hårdere end en anklage.', givItem: 'diamant', hpAendring: -16, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Du tager diamanten. Drengen bliver ved med at trække vejret — indtil videre. Følelsen af at have snydt vraget bliver siddende i kroppen.', givItem: 'diamant', naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'I diamanten ser du dit eget ansigt, mange år ældre. Den er værdifuld, men den husker, hvad du valgte først.', givItem: 'diamant', maxHpAendring: -4, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Skær en hårlænke over med kniven.',
        kraeverItem: 'kniv',
        udfaldListe: [
          { log: 'Kniven glider gennem håret. Ringen uden navn falder kold ned i din hånd. Drengen trækker vejret selv, men hjertet begynder at følge din puls.', mistItem: 'kniv', maxHpAendring: 8, naesteTrin: 'glashjertet_ringen' },
          { log: 'Der løber blod fra den overskårne lænke. Drengen kommer fri, men kniven bliver siddende, og hjertet svarer med et tungt slag.', mistItem: 'kniv', hpAendring: -18, naesteTrin: 'glashjertet_ringen' },
          { log: 'Du skærer forkert. Såret er ikke dybt, men dybt nok. Diamanten ruller hen til din hånd, mens drengen bliver liggende.', givItem: 'diamant', hpAendring: -12, naesteTrin: 'glashjertet_ringen' }
        ]
      },
      {
        tekst: 'Kil staven ind mellem hjertet og kæderne.',
        kraeverItem: 'stav',
        udfaldListe: [
          { log: 'Staven giver en skarp tone fra sig. Hjertet standser længe nok til, at drengen kommer fri, men magien trækker varmen ud af dig.', hpAendring: -14, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Staven opfanger hjertets rytme og sender den skævt tilbage. Kæderne løsner sig, men pulsen fortsætter i din krop.', maxHpAendring: 5, naesteTrin: 'glashjertet_ringen' },
          { log: 'Kæderne snor sig om staven. En sprække åbner sig i hjertet, og inde bag glasset ligger en række mønter. Du tager dem, før sprækken lukker.', guldAendring: 120, naesteTrin: 'glashjertet_ringen' }
        ]
      },
      {
        tekst: 'Bind sejlklædet om hjertet, og dæmp dets slag.',
        udfaldListe: [
          { log: 'Sejlet dæmper lyset fra hjertet. Drengen sover videre, men hans vejrtrækning bliver rolig. Du får tid til at vælge.', naesteTrin: 'glashjertet_stilheden' },
          { log: 'Hjertet og diamanten mister noget af deres glød. Du har ikke reddet drengen endnu, men fristelsen er lettere at modstå.', maxHpAendring: 4, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Sejlet strammer sig om hjertet. Drengen hoster saltvand op, og kæderne begynder at slå i takt med din puls.', hpAendring: -15, naesteTrin: 'glashjertet_stilheden' }
        ]
      }
    ]
  },

  glashjertet_underdaekket: {
    id: 'glashjertet_underdaekket',
    titel: 'Under dækket',
    biome: ['hav', 'ruin'],
    tekst: 'Trappen ned er våd, men vandet løber opad. Langs væggen er der ridser i børnehøjde. Nogle tæller dage. Andre angiver priser: “En sang: lidt blod.” “En løgn: en mønt.” “Et løfte: prisen afhænger af, hvem der hører det.” For enden står en dør med tre låse: én af jern, én af voks og én af hud.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ruin.webp',
    valg: [
      {
        tekst: 'Bryd jernlåsen op.',
        udfaldListe: [
          { log: 'Jernet giver sig, men braget vækker noget i lastrummet. Du kommer gennem døren og hører tunge bevægelser bag dig.', hpAendring: -14, naesteTrin: 'glashjertet_eden' },
          { log: 'Låsen springer op, og en skjult pung falder ud på gulvet. Den lå klar til nogen, der havde mere travlt end samvittighed.', guldAendring: 100, naesteTrin: 'glashjertet_eden' },
          { log: 'Døren åbner næsten uden modstand. På den anden side venter hjertet, som om det hele tiden vidste, du ville vælge vold.', naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Varm vokslåsen, og læs aftrykket.',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: 'I voksen står et navn, som er skrabet væk alle andre steder. Du siger det ikke højt, men husker det, da døren åbner.', maxHpAendring: 5, naesteTrin: 'glashjertet_navnet' },
          { log: 'Voksen smelter for hurtigt og løber hen over din hånd. Smerten holder dig vågen, mens døren glider op.', hpAendring: -12, naesteTrin: 'glashjertet_eden' },
          { log: 'Aftrykket viser en spejlvendt diamant. Advarslen er klar: Lad være med at kalde grådighed for nødvendighed.', naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Tryk hånden mod hudlåsen.',
        udfaldListe: [
          { log: 'Hudlåsen er varm. “Redningsmand,” hvisker den, men tonen lyder mere som en advarsel end ros.', maxHpAendring: 7, naesteTrin: 'glashjertet_eden' },
          { log: '“Røver,” siger låsen. Døren åbner alligevel, og en lille bunke mønter ligger lige på den anden side.', guldAendring: 70, naesteTrin: 'glashjertet_eden' },
          { log: 'Låsen siger ingenting. Den tager dit håndaftryk og lukker dig ind. Huden svier, da du trækker hånden til dig.', hpAendring: -8, naesteTrin: 'glashjertet_eden' }
        ]
      }
    ]
  },

  glashjertet_skyggedoren: {
    id: 'glashjertet_skyggedoren',
    titel: 'Døren uden håndtag',
    biome: ['blodskov', 'ritual', 'ruin'],
    tekst: 'Døren kan kun ses i skyggen fra glashjertet. Hver gang faklen blafrer, træder den tydeligere frem. I træet er der skåret tre hænder: én åben, én knyttet og én, der peger væk. Under dem står små skaller med salt, guldstøv og mørkt vand. Døren har intet håndtag, kun fingeraftryk på begge sider.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Læg en åben hånd mod døren, og giv den et minde.',
        udfaldListe: [
          { log: 'Døren tager mindet om en venlig stemme og åbner lydløst. Savnet rammer med det samme, men kroppen føles lettere.', maxHpAendring: 10, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Døren tager et minde, du troede var ligegyldigt. Først da det er væk, mærker du, hvor meget det bar dig.', maxHpAendring: -6, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Døren tager et minde, som ikke tilhører dig. I rummet bagved ligger en fremmeds mønter spredt på gulvet.', guldAendring: 110, naesteTrin: 'glashjertet_stilheden' }
        ]
      },
      {
        tekst: 'Knyt hånden, og kræv betaling for det, øen har taget.',
        udfaldListe: [
          { log: 'Kravet virker. Døren åbner, og en håndfuld guld falder ud. Resten af prisen venter stadig på den anden side.', guldAendring: 160, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'En tør latter går gennem træet. Døren åbner, men dine knoer sprækker og bløder mod aftrykket.', hpAendring: -20, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Din knyttede hånd passer i aftrykket. “I det mindste er du ærlig om, hvad du vil have,” hvisker døren og åbner.', naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Følg den hånd, der peger væk.',
        udfaldListe: [
          { log: 'Bag en fold i skyggen finder du en smal sprække. Den fører uden om hjertet og ind i et skjult rum.', naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Omvejen går gennem iskoldt vand og skarpe muslinger. Du kommer frem, men benene og hænderne er flænset.', hpAendring: -17, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Du lader døren være. På den anden side falder noget tungt til ro, og lettelsen breder sig i kroppen.', maxHpAendring: 6, naesteTrin: 'glashjertet_efterregningen' }
        ]
      }
    ]
  },

  glashjertet_navnet: {
    id: 'glashjertet_navnet',
    titel: 'Navnet i sandet',
    biome: ['hav', 'ritual'],
    tekst: 'Navnet i sandet ligner først dit eget og derefter drengens. Til sidst bliver det til et navn, du ikke kender. Hver gang vandet rammer bogstaverne, bliver de skåret dybere i sandet. Ved siden af ligger en ren skovl af ben, alt for lille til en voksen hånd.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_hav.webp',
    valg: [
      {
        tekst: 'Grav under navnet med skovlen.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: 'Under navnet finder du ingen krop, kun en pakke usendte breve og en gylden kikkert. Brevene fortæller nok til at hjælpe drengen, men ikke nok til at gøre nogen uskyldig.', givItem: 'kikkert_250', naesteTrin: 'glashjertet_eden' },
          { log: 'Du graver for dybt og rammer en af vragets gamle ribber. Sandet styrter sammen om dine ben, og du må rive dig fri med munden fuld af salt.', hpAendring: -22, naesteTrin: 'glashjertet_eden' },
          { log: 'Sandet glider til side og afslører guld. Det blev gravet ned som betaling for tavshed — en tavshed, du netop har brudt.', guldAendring: 150, naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Skriv dit navn ved siden af den dødes.',
        udfaldListe: [
          { log: 'Bogstaverne trækker varmen ud af din hånd. En del af den dødes historie sætter sig i dig. Det gør ondt, men gør også byrden lettere at bære.', maxHpAendring: 9, hpAendring: -10, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Det døde navn skriver sig hen over dit. Et øjeblik kan du ikke huske, hvem af jer der skulle reddes.', maxHpAendring: -5, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Da du skriver dit navn, kommer gamle mønter op gennem sandet. Om det er betaling eller bestikkelse, må du selv afgøre.', guldAendring: 115, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Visk navnet ud med støvlen.',
        udfaldListe: [
          { log: 'Navnet forsvinder, og den rene overflade giver et kort øjebliks lettelse. Så begynder noget at banke under sandet. Mønter presses op omkring din støvle.', guldAendring: 90, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Du visker igen og igen, men hvert strøg gør bogstaverne dybere. Til sidst kan du se navnet, hver gang du lukker øjnene.', hpAendring: -18, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Sandet lader dig slette navnet, men dit støvleaftryk bliver stående som en ny underskrift.', maxHpAendring: -4, naesteTrin: 'glashjertet_efterregningen' }
        ]
      }
    ]
  },

  glashjertet_stilheden: {
    id: 'glashjertet_stilheden',
    titel: 'Den stille aftale',
    biome: ['ritual', 'ruin'],
    tekst: 'Hjertet slår så svagt, at du kan høre drengens vejrtrækning og mønter, der flytter sig af sig selv. På gulvet står tre skåle: én med rent vand, én med sort vand og én tom. Over dem står der: “Helbred ham, betal dig fri, eller lad sandheden vælge.”',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ritual.webp',
    valg: [
      {
        tekst: 'Hæld det rene vand over drengen.',
        udfaldListe: [
          { log: 'Drengen hoster og får varme i kinderne. Dit spejlbillede i skålen bliver blegt, mens vandet tager kræfterne fra dig og giver dem til ham.', hpAendring: -20, maxHpAendring: 8, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Vandet helbreder drengen. Samtidig letter en gammel uro i dig, og for første gang er der ro omkring hjertet.', maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Drengen vågner med to ord på læberne: “Ikke mig.” Så peger han på diamanten.', naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Drik det sorte vand, og tag straffen selv.',
        udfaldListe: [
          { log: 'Det sorte vand smager bittert og koldt. Du kan bære straffen, men den sætter sig i kroppen. På bunden af skålen ligger guld som betaling.', maxHpAendring: -8, guldAendring: 140, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Vandet brænder hele vejen ned. Drengen trækker vejret frit, og hjertet slår én tung gang, da det tager din betaling.', hpAendring: -28, maxHpAendring: 10, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Du prøver at drikke, men vandet løber tilbage i skålen. Vraget vil ikke have en gestus. Det vil have noget konkret.', naesteTrin: 'glashjertet_efterregningen' }
        ]
      },
      {
        tekst: 'Læg madrationen i den tomme skål.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: 'Madrationen forsvinder. Drengen vågner sulten, levende og vred. Vreden er et godt tegn.', maxHpAendring: 6, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Skålen tager maden og giver mønter tilbage. Handlen er kold, men pengene kan hjælpe jer videre herfra.', guldAendring: 100, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Skålen afviser maden. Den var noget værd, men ikke svær nok for dig at undvære. Hjertet slår hårdt imod dig.', hpAendring: -10, naesteTrin: 'glashjertet_efterregningen' }
        ]
      },
      {
        tekst: 'Læg livseliksiren i den tomme skål.',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: 'Eliksiren brister i skålen, og lyset løber ind i drengen. Hjertet bliver klart. Han vågner og ser på dig med et blik, du ikke glemmer.', maxHpAendring: 16, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Vraget tager eliksiren og helbreder drengen nok til, at han kan overleve. Resten bliver til guld på bunden af skålen. Det er nyttigt og ubehageligt på samme tid.', guldAendring: 180, maxHpAendring: 5, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Eliksiren virker næsten for godt. Drengen vågner med havbundens mørke i øjnene. Han lever, men noget fra vraget er fulgt med.', hpAendring: -12, maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      }
    ]
  },

  glashjertet_barnets_blik: {
    id: 'glashjertet_barnets_blik',
    titel: 'Barnets blik',
    biome: ['hav', 'ritual'],
    tekst: 'Drengen åbner øjnene. Han ser først på diamanten, så på dine hænder og til sidst på udgangen. “Hvis du går nu, finder du måske skatten,” siger han. “Hvis du bliver, finder den måske dig.” Han rækker ikke ud efter hjælp.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_hav.webp',
    valg: [
      {
        tekst: 'Giv ham diamanten, og lad ham vælge.',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: 'Han holder diamanten mod brystet. Lyset går ud, og drengen smiler for første gang. Skatten er væk, men du går derfra stærkere.', maxHpAendring: 18 },
          { log: 'Han kaster diamanten i vandet. Vraget ryster, og mønter skyller ind over dine støvler. Drengen kalder dem ikke en belønning.', guldAendring: 130, maxHpAendring: 8 },
          { log: 'Han vil ikke tage imod den. “Du skal ikke give mig alt, du fortryder,” siger han. Diamanten opløses i dine hænder og efterlader et lyst ar.', hpAendring: -10, maxHpAendring: 14 }
        ]
      },
      {
        tekst: 'Fortæl ham, at du overvejede at tage skatten.',
        udfaldListe: [
          { log: 'Han nikker. Din ærlighed gør dig ikke bedre, men den viser, at du er til at stole på. Sammen finder I en skjult pose bag vuggen.', guldAendring: 150 },
          { log: 'Sandheden ligger tungt mellem jer. Drengen ser ikke væk, og du tvinger dig selv til at møde hans blik.', maxHpAendring: 10, hpAendring: -8 },
          { log: '“Det gjorde alle,” svarer han. Så griner han kort. Noget i vraget brister, og vejen ud åbner sig.', maxHpAendring: 12 }
        ]
      },
      {
        tekst: 'Sig, at du aldrig ville have taget skatten.',
        udfaldListe: [
          { log: 'Drengen tror på løgnen. Vraget gør ikke. Guld samler sig varmt i din lomme, mens noget i dig bliver koldere.', guldAendring: 180, maxHpAendring: -6 },
          { log: 'Drengen smiler, fordi han gerne vil tro dig. Det gør løgnen sværere at bære. På vej ud finder du guld mellem plankerne.', hpAendring: -16, guldAendring: 90 },
          { log: 'Vraget tager imod den pæne løgn og giver dig en gylden kikkert. Til gengæld bliver det lidt sværere at sige sandheden næste gang.', givItem: 'kikkert_250', maxHpAendring: -8 }
        ]
      },
      {
        tekst: 'Gå uden at svare.',
        udfaldListe: [
          { log: 'Du går. Bag dig begynder drengen at synge lavt. Sangen holder vraget tilbage, og du slipper ud med guld i lommerne.', guldAendring: 120 },
          { log: 'Du går, men spørgsmålet følger med. Hvert skridt gør ondt, samtidig med at beslutningen gør dig mere sikker.', hpAendring: -12, maxHpAendring: 6 },
          { log: 'Udgangen lukker sig næsten om din hæl. Du slipper ud, men efterlader et aftryk i glasset, der ligner begyndelsen på en ny dør.', maxHpAendring: 5 }
        ]
      }
    ]
  },

  glashjertet_barnets_vaegt: {
    id: 'glashjertet_barnets_vaegt',
    titel: 'Den, du bærer',
    biome: ['hav', 'ruin'],
    tekst: 'Drengen ligger i dine arme. Han bliver tungere, hver gang dit blik falder på guldet, og hver gang du tænker på den lange vej til sikkerhed. Foran jer ligger udgangen som en smal stribe dagslys. Bag jer begynder glashjertet langsomt at slå igen.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ruin.webp',
    valg: [
      {
        tekst: 'Bær ham forbi skattekisterne og helt ud.',
        udfaldListe: [
          { log: 'Kisterne åbner sig, da du går forbi, men du ser ikke ned. Ude i lyset trækker drengen vejret uden hjertets hjælp, og kræfterne vender tilbage til dig.', hpAendring: 24, maxHpAendring: 10 },
          { log: 'Du ser ikke ned, men hører mønterne falde bag dig. Vejen ud tærer på kroppen, men hvert skridt gør dit valg lettere at bære.', hpAendring: -10, maxHpAendring: 14 },
          { log: 'Da I når stranden, finder drengen en mønt i sin hånd og giver den til dig. Ikke som betaling, men som en lille tak.', guldAendring: 70, maxHpAendring: 8 }
        ]
      },
      {
        tekst: 'Sæt ham ned, og tag det guld, du hurtigt kan bære.',
        udfaldListe: [
          { log: 'Du tager en håndfuld guld og løfter ham igen. Drengen siger ingenting, men lægger hovedet mod din skulder. I kommer begge videre.', guldAendring: 145, hpAendring: -8 },
          { log: 'Du bøjer dig efter mønterne og mister ham næsten. Da du får ham op igen, er huden blevet koldere.', guldAendring: 180, maxHpAendring: -6 },
          { log: 'Blandt mønterne finder du en lille diamant. Da du vender dig, ligger drengen helt stille. Skatten kostede mere, end du først kunne se.', givItem: 'diamant', hpAendring: -16 }
        ]
      },
      {
        tekst: 'Giv ham mad, og lad ham gå det sidste stykke selv.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: 'Han spiser langsomt og rejser sig. Da han går ved siden af dig, er han ikke længere en byrde, men en person, du har fået med ud.', maxHpAendring: 10 },
          { log: 'Maden giver ham kræfter til at gå og mod til at spørge: “Havde du også båret mig, hvis jeg vejede mere end skatten?”', hpAendring: -10, maxHpAendring: 8 },
          { log: 'Han gemmer halvdelen af maden og bytter den ved udgangen for en lille pose mønter. “Vi skal begge klare os,” siger han.', guldAendring: 90, maxHpAendring: 5 }
        ]
      },
      {
        tekst: 'Lav en båre af soveposen, og træk ham ud.',
        kosterItem: 'sovepose',
        udfaldListe: [
          { log: 'Soveposen flænses mod glasset, men drengen undgår skårene. På stranden mangler du ly for natten, men han er i live.', maxHpAendring: 16, hpAendring: -6 },
          { log: 'Båren gør jer langsomme, og vraget griber fat i den ene ende. Du må rive til, så stoffet flækker. Drengen lever; soveposen er ødelagt.', hpAendring: -18, maxHpAendring: 12 },
          { log: 'Da du samler resterne af soveposen, falder guld ud af en gammel syning. Nogen før dig gemte mønterne til en flugt.', guldAendring: 130, maxHpAendring: 6 }
        ]
      }
    ]
  },

  glashjertet_ringen: {
    id: 'glashjertet_ringen',
    titel: 'Den blanke ring',
    biome: ['ritual', 'ruin'],
    tekst: 'Ringen uden navn ligger i din håndflade. Den passer ikke på nogen finger. Når du holder den tæt på drengen, trækker han vejret lettere. Ved diamanten lyser den stærkere. Mod din egen hud bliver den varm.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ritual.webp',
    valg: [
      {
        tekst: 'Sæt ringen fast i drengens sejlklæde.',
        udfaldListe: [
          { log: 'Ringen lukker sig om sejlet. Drengen vågner med et dybt suk og får endelig ro i kroppen.', maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Ringen får ham til at trække vejret, men binder samtidig din puls til hans. Det svækker dig, selvom forbindelsen også giver styrke.', hpAendring: -14, maxHpAendring: 10, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Ringen glider af sejlet og afslører mønter under kanten. Vragets besked er kølig og klar: Drengen skal også kunne overleve efter redningen.', guldAendring: 105, naesteTrin: 'glashjertet_barnets_vaegt' }
        ]
      },
      {
        tekst: 'Hold ringen mod diamanten.',
        udfaldListe: [
          { log: 'Diamanten revner og bliver til lys, der løber ind i drengen. Skatten forsvinder, og hans vejrtrækning bliver stærk.', maxHpAendring: 15, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Diamanten giver guld fra sig, men hjælper ikke drengen. Du står med mere i hænderne og det samme trætte blik foran dig.', guldAendring: 190, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Ringen og diamanten smelter sammen til en kold, lysende sten. Den er smuk, værdifuld og tydeligt farlig.', givItem: 'diamant', maxHpAendring: -5, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Luk ringen om dit håndled, og tag forbandelsen med ud.',
        udfaldListe: [
          { log: 'Ringen krymper ind i huden og fylder dig med en hård styrke. Drengen trækker vejret, men ser uroligt på mærket om dit håndled.', maxHpAendring: 18, hpAendring: -12, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Forbandelsen slipper vraget og sætter sig i dig. Smerten følges af ny styrke, og guld falder ud mellem plankerne.', maxHpAendring: 8, guldAendring: 120, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Ringen strammer, til synet bliver sort. Et øjeblik kan du ikke huske, om du kom for drengen eller skatten.', hpAendring: -26, naesteTrin: 'glashjertet_efterregningen' }
        ]
      }
    ]
  },

  glashjertet_efterregningen: {
    id: 'glashjertet_efterregningen',
    titel: 'Efterregningen',
    biome: ['hav', 'ruin', 'ritual'],
    tekst: 'Bag de andre rum finder du et lille kammer. Her er ingen skattekister, kun et regnskab ridset i glas. Hver linje viser, hvad nogen tog, hvem der betalte, og hvad de bagefter kaldte deres valg. Der er plads til én linje mere. Pennen er lavet af knogle, og blækket sidder allerede på dine fingre.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ruin.webp',
    valg: [
      {
        tekst: 'Skriv: “Jeg tog noget, fordi jeg ville leve.”',
        udfaldListe: [
          { log: 'Glasset tager imod sætningen. Den tilgiver dig ikke, men den er præcis. Regnskabet giver dig guld uden at gøre det rent.', guldAendring: 160 },
          { log: 'Ordene bliver stående. Det giver en uventet ro at indrømme, at du bare ville overleve.', maxHpAendring: 9 },
          { log: 'Regnskabet kræver en smertefuld underskrift. Da du giver den, lyser linjen og viser vejen ud. Guld ligger klar ved døren.', hpAendring: -18, guldAendring: 110 }
        ]
      },
      {
        tekst: 'Skriv: “Jeg reddede nogen, fordi jeg ikke kunne bære at lade være.”',
        udfaldListe: [
          { log: 'Regnskabet tøver, men ordene er sande nok. Glasset slipper sit tag i kroppen, og du mærker ny styrke.', maxHpAendring: 14 },
          { log: 'Pennen knækker, og døren åbner. Handlingen kan ikke gøres op i regnskabet, men kroppen får ro til at hele.', hpAendring: 18 },
          { log: 'Glasset kræver betaling for ordene. Kulden skærer ind i dig, men du står stærkere, da døren åbner.', hpAendring: -16, maxHpAendring: 10 }
        ]
      },
      {
        tekst: 'Lad linjen stå blank.',
        udfaldListe: [
          { log: 'Linjen bliver stående blank, og vraget skælver omkring dig. Du går uden belønning, men med en ro, du ikke havde før.', maxHpAendring: 11 },
          { log: 'Tavsheden får glasset til at ryste. Det spytter mønter efter dig, og du samler nogle af dem op på vej ud.', guldAendring: 95, maxHpAendring: 5 },
          { log: 'Den blanke linje suger lyset ud af rummet. I mørket hører du noget følge efter dig med rolige, sikre skridt.', hpAendring: -20 }
        ]
      },
      {
        tekst: 'Smadr regnskabet med køllen.',
        kraeverItem: 'koelle',
        udfaldListe: [
          { log: 'Køllen flækker glasset. I skårene ser du forskellige udgaver af dig selv: rigere, venligere, men ingen helt uskyldige. Splinterne skærer, mens du samler guldet op.', hpAendring: -20, guldAendring: 140 },
          { log: 'Glasset splintrer, og et øjeblik glemmer vraget, hvad det vogter. Du bruger chancen til at tømme kammerets skjulte beholdning.', guldAendring: 230 },
          { log: 'Slaget knuser mere end glasset. Det gør ondt, men bryder også den kraft, der hele tiden har vejet dine valg.', hpAendring: -24, maxHpAendring: 16 }
        ]
      },
      {
        tekst: 'Skær dit navn ud af regnskabet med sværdet.',
        kraeverItem: 'svaerd',
        udfaldListe: [
          { log: 'Sværdet river dit navn fri, og linjen mister sin magt. Glasset skærer dig, men du går ud stærkere end før.', maxHpAendring: 15, hpAendring: -10 },
          { log: 'Dit navn kommer fri i en sky af guldstøv. Du ved ikke, om regnskabet slettede dig eller købte dig ud.', guldAendring: 180, maxHpAendring: -4 },
          { log: 'Sværdet sætter sig fast i glasset. Da du river det fri, er armen flænset, men klingen og dit greb føles tungere og stærkere.', hpAendring: -14, maxHpAendring: 8 }
        ]
      }
    ]
  }
};
