export const glashjertetEvents = {
  glashjertet_i_vraget: {
    id: 'glashjertet_i_vraget',
    titel: 'Glashjertet i vraget',
    biome: ['hav', 'ruin', 'ritual'],
    tekst: 'Ved lavvande ligger et skibsvrag på siden mellem sorte sten. Skroget er ikke råddent, men gennemsigtigt som gammelt rav. Inde bag ribberne banker et hjerte af glas. For hvert slag svarer noget nede under dækket med et lille bank, som en hånd mod en kiste. På masten står der ridset: “Tag skatten, og nogen husker dig. Tag barnet, og nogen glemmer dig.” Nederst, næsten skjult under salt, står en kortere linje: “Den der betaler først, vælger sidst.”',
    unik: true,
    erSubTrin: false,
    billede: '/events/ev_hav.webp',
    valg: [
      {
        tekst: 'Læs mastens nederste linje højt, selvom glasset begynder at synge mod dine tænder.',
        udfaldListe: [
          { log: 'Ordene vender sig i munden på dig. Du forstår pludselig, at hjertet ikke vogter skatten. Det vogter rækkefølgen. Noget i vraget lytter nu mere til dig end til havet.', hpAendring: -8, naesteTrin: 'glashjertet_eden' },
          { log: 'Da du siger den sidste lyd, revner masten og spytter små skår ud i sandet. Mellem skårene ligger mønter med dit eget ansigt på. Det føles forkert at samle dem op, men fingrene gør det alligevel.', guldAendring: 95, naesteTrin: 'glashjertet_eden' },
          { log: 'Linjen forsvinder, mens du læser. Du når kun at fange meningen: Den første betaling bliver aldrig den sidste. Vraget åbner en smal passage ind mod hjertet.', maxHpAendring: 6, naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Spark lugen op og gå efter stemmen under dækket, før vraget når at forhandle med dig.',
        udfaldListe: [
          { log: 'Lugen giver efter. Der er ingen barnestemme, kun din egen barndoms frygt, foldet sammen i mørket. Du kan stadig høre nogen banke længere inde.', hpAendring: -18, naesteTrin: 'glashjertet_underdaekket' },
          { log: 'Du rammer et skjult hængsel, og hele dækket sukker åbent. En lille håndtegnet båd flyder i en pyt. Under den ligger vådt guld, varmt som hud.', guldAendring: 130, naesteTrin: 'glashjertet_underdaekket' },
          { log: 'Du handler hurtigt nok til, at vraget ikke får sit første ord. Det gør dig farlig herinde. Det gør også alt andet bange.', naesteTrin: 'glashjertet_underdaekket' }
        ]
      },
      {
        tekst: 'Hold en fakkel lavt og se, hvilke skygger der ikke følger flammen.',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: 'Skyggerne fra ribberne falder rigtigt. Skyggen fra glashjertet gør ikke. Den peger på en dør uden håndtag og former kort en vugge.', naesteTrin: 'glashjertet_skyggedoren' },
          { log: 'Flammen bliver blå. I lyset ser du, at nogle mønter ligger oven på vandet, ikke under. Du tager dem, før du når at spørge hvorfor.', guldAendring: 80, naesteTrin: 'glashjertet_skyggedoren' },
          { log: 'Faklen får saltet i luften til at knitre. Du ser vejen, men røgen får dig til at hoste blodigt og tænke klarere end før.', hpAendring: -12, naesteTrin: 'glashjertet_skyggedoren' }
        ]
      },
      {
        tekst: 'Lad søgekvisten finde det, der blev begravet uden ceremoni.',
        kraeverItem: 'soegekvist',
        udfaldListe: [
          { log: 'Kvisten bøjer sig ikke mod guld. Den bøjer sig mod et sted i sandet, hvor nogen har skrevet et navn om og om igen med en finger.', naesteTrin: 'glashjertet_navnet' },
          { log: 'Kvisten springer af bark og bliver et øjeblik til en lille arm. Den peger mod hjertet og derefter mod din rygsæk, som om den spørger, hvad du selv er villig til at miste.', hpAendring: -10, naesteTrin: 'glashjertet_navnet' },
          { log: 'Kvisten finder en rusten kapsel med et tørt kort over vraget. Kortet viser tre rum, men kun to udgange.', givItem: 'kikkert_45', naesteTrin: 'glashjertet_navnet' }
        ]
      },
      {
        tekst: 'Læg guld i skålen ved masten og køb dig retten til at stille ét spørgsmål.',
        puljeVaerdi: 120,
        udfaldListe: [
          { log: 'Skålen sluger betalingen uden klirren. En stemme svarer, før du spørger: “Barnet lever, hvis nogen tør bære skylden.”', naesteTrin: 'glashjertet_eden' },
          { log: 'Skålen spytter halvdelen af dine mønter tilbage som sorte skiver. Du har købt et spørgsmål, men også vist vraget, hvor gerne du vil have kontrol.', maxHpAendring: -5, naesteTrin: 'glashjertet_eden' },
          { log: 'Vraget accepterer din betaling som en fornærmelse. Plankerne trækker sig til side og viser en nem vej ind. Nemme veje herinde ser næsten altid brugte ud.', naesteTrin: 'glashjertet_underdaekket' }
        ]
      }
    ]
  },

  glashjertet_eden: {
    id: 'glashjertet_eden',
    titel: 'Eden i glasset',
    biome: ['ritual'],
    tekst: 'Inde i skroget hænger glashjertet i kæder af hår. I hver kæde sidder en lille messingring med et navn. Et navn er blankt. Under hjertet ligger tre ting: en diamant, en sovende dreng pakket ind i sejl, og en kniv med tørret salt på bladet. Barnets bryst løfter sig kun, når hjertet slår. Diamanten lyser kun, når barnet ikke trækker vejret. Kniven ligger midt imellem dem, som om den ikke har valgt side endnu.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ritual.webp',
    valg: [
      {
        tekst: 'Løft barnet først og lad diamanten blive, selvom lyset i den følger dine hænder.',
        udfaldListe: [
          { log: 'Barnet vågner ikke, men hans hånd lukker sig om din finger. Diamanten bliver sort. Kæderne mister et navn, og du mærker et nyt rum i brystet, hvor frygt kan ligge uden at styre dig.', maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Da du løfter ham, vågner noget sultent i hjertet. Du redder hans åndedrag, men glasset skærer dig med lyden af alle de skatte, du ikke tog.', hpAendring: -24, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Barnet er tungere end et barn bør være. I sejlklædet finder du mønter syet ind af nogen, der må have håbet, at en redningsmand også skulle overleve.', guldAendring: 90, naesteTrin: 'glashjertet_barnets_vaegt' }
        ]
      },
      {
        tekst: 'Tag diamanten først, men hvis barnet vågner, så lov at komme tilbage.',
        udfaldListe: [
          { log: 'Diamanten løsner sig villigt. Barnet åbner øjnene præcis længe nok til at se, hvem der valgte lyset først. Han græder ikke. Det gør det værre.', givItem: 'diamant', hpAendring: -16, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Du tager diamanten, og barnets åndedrag stopper ikke. Endnu. Vraget lader dig beholde følelsen af at have været snedig, som en krog under huden.', givItem: 'diamant', naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Diamanten viser ikke rigdom, men dit ansigt mange år ældre. Den er værdifuld, ja, men den husker rækkefølgen.', givItem: 'diamant', maxHpAendring: -4, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Skær en hårlænke over med din egen kniv og se, hvem hjertet slipper.',
        kraeverItem: 'kniv',
        udfaldListe: [
          { log: 'Kniven går gennem håret uden modstand. Ringen med det blanke navn falder ned i din hånd og bliver kold. Barnet trækker vejret selv, men hjertet begynder at banke i takt med dig.', mistItem: 'kniv', maxHpAendring: 8, naesteTrin: 'glashjertet_ringen' },
          { log: 'Hårlænken bløder som et dyr. Du får barnet fri, men kniven bliver siddende i kæden, og vraget lærer smagen af din beslutsomhed.', mistItem: 'kniv', hpAendring: -18, naesteTrin: 'glashjertet_ringen' },
          { log: 'Du skærer forkert. Ikke dybt, men nok. Diamanten ruller hen til dig, som om den trøster den hånd, der svigtede.', givItem: 'diamant', hpAendring: -12, naesteTrin: 'glashjertet_ringen' }
        ]
      },
      {
        tekst: 'Brug staven som kile mellem hjertet og kæderne.',
        kraeverItem: 'stav',
        udfaldListe: [
          { log: 'Staven synger med en stemme, der ikke er din. Hjertet standser et åndedrag for længe, og i pausen kan barnet løsne sig. Magien tager sin betaling i varme.', hpAendring: -14, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Staven knækker ikke. Den lærer i stedet hjertets rytme og sender den tilbage forvrænget. Kæderne løsner sig, men en rest af rytmen bliver i dig.', maxHpAendring: 5, naesteTrin: 'glashjertet_ringen' },
          { log: 'Kæderne vrider sig om staven. Hjertet åbner en sprække, og inden i sprækken ligger mønter som tænder. Du tager dem, fordi hånden allerede er der.', guldAendring: 120, naesteTrin: 'glashjertet_ringen' }
        ]
      },
      {
        tekst: 'Bind barnets sejlklæde om glashjertet og dæmp slagene, før du rører noget.',
        udfaldListe: [
          { log: 'Sejlet suger lyset ud af hjertet. Barnet sover videre, men nu som et barn, ikke som pant. Du får tid til at vælge uden at blive skubbet.', naesteTrin: 'glashjertet_stilheden' },
          { log: 'Hjertet dæmpes. Diamanten dæmpes også. Du har ikke reddet nogen endnu, men du har gjort fristelsen mindre smuk.', maxHpAendring: 4, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Sejlet strammer sig forkert. Barnet hoster saltvand op, og kæderne begynder at tælle dine hjerteslag.', hpAendring: -15, naesteTrin: 'glashjertet_stilheden' }
        ]
      }
    ]
  },

  glashjertet_underdaekket: {
    id: 'glashjertet_underdaekket',
    titel: 'Under dækket',
    biome: ['hav', 'ruin'],
    tekst: 'Trappen ned er våd, men vandet løber opad. På væggen hænger små ridser i børnehøjde. Nogle er streger for dage. Andre er priser. “En sang: lidt blod.” “En løgn: en mønt.” “Et løfte: alt efter hvem der hører det.” For enden sidder en dør med tre låse. Den ene er af jern, den anden af voks, den tredje af hud.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ruin.webp',
    valg: [
      {
        tekst: 'Åbn jernlåsen med vold og accepter støjen.',
        udfaldListe: [
          { log: 'Jernet giver sig, men støjen vækker noget i lastrummet. Du når ind, men efterlader en tydelig vej tilbage til dig.', hpAendring: -14, naesteTrin: 'glashjertet_eden' },
          { log: 'Låsen springer op og kaster en skjult pung ud på gulvet. Den har ligget klar til en person, der ikke havde tid til moral.', guldAendring: 100, naesteTrin: 'glashjertet_eden' },
          { log: 'Døren åbner så let, at volden føles pinlig. Bag den ligger hjertet og venter, ikke overrasket, bare skuffet.', naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Varm vokslåsen med faklen og læs aftrykket, før det smelter.',
        kraeverItem: 'fakkel',
        udfaldListe: [
          { log: 'I voksen står et navn, som er kradset ud alle andre steder. Du siger det ikke. Du gemmer det bag tænderne og går ind med en fordel, der føles som tyveri.', maxHpAendring: 5, naesteTrin: 'glashjertet_navnet' },
          { log: 'Voksen smelter for hurtigt og løber hen over din hånd. Smerten holder dig vågen, da døren åbner ind til hjertet.', hpAendring: -12, naesteTrin: 'glashjertet_eden' },
          { log: 'Aftrykket viser en diamant, men spejlvendt. Vraget advarer dig ikke mod grådighed. Det advarer dig mod at kalde grådighed for nødvendighed.', naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Tryk din hånd mod hudlåsen og lad den afgøre, om du er redningsmand eller røver.',
        udfaldListe: [
          { log: 'Hudlåsen er varm. Den kalder dig redningsmand, men med den tone voksne bruger om børn, der ikke har mødt prisen endnu.', maxHpAendring: 7, naesteTrin: 'glashjertet_eden' },
          { log: 'Hudlåsen kalder dig røver. Døren åbner alligevel. Måske fordi røvere tit kommer længst ind.', guldAendring: 70, naesteTrin: 'glashjertet_eden' },
          { log: 'Låsen siger ingenting. Den tager bare dit håndaftryk og giver dig adgang. Tavshed kan også være en dom.', hpAendring: -8, naesteTrin: 'glashjertet_eden' }
        ]
      }
    ]
  },

  glashjertet_skyggedoren: {
    id: 'glashjertet_skyggedoren',
    titel: 'Døren uden håndtag',
    biome: ['blodskov', 'ritual', 'ruin'],
    tekst: 'Døren findes kun i skyggen fra glashjertet. Når faklen flakker, bliver den tydeligere. I træet sidder tre indskårne billeder: en åben hånd, en lukket hånd og en hånd, der peger væk. Under dem ligger små skaller fyldt med salt, guldstøv og mørkt vand. Håndtaget mangler, men døren har aftryk efter fingre på begge sider.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_blodskov.webp',
    valg: [
      {
        tekst: 'Sæt din åbne hånd mod døren og giv den et minde, du gerne ville have beholdt.',
        udfaldListe: [
          { log: 'Døren tager et minde om en venlig stemme. Til gengæld åbner den uden knirk. Du savner straks noget, men kroppen bliver lettere.', maxHpAendring: 10, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Døren tager et minde, du troede var ubetydeligt. Først da det forsvinder, forstår du, at det holdt dig oprejst.', maxHpAendring: -6, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Døren tager et minde, der ikke var dit. I rummet bagved ligger mønter fra en andens liv og blinker uden skyld.', guldAendring: 110, naesteTrin: 'glashjertet_stilheden' }
        ]
      },
      {
        tekst: 'Hold hånden lukket og kræv noget igen for alt det, øen allerede har taget.',
        udfaldListe: [
          { log: 'Kravet virker. Døren åbner, og en håndfuld guld falder ud, næsten som en indrømmelse. Bag døren venter stadig den del, der ikke kan betales med mønter.', guldAendring: 160, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Døren ler gennem træet. Den kender den slags krav. Den åbner, men dine knoer bløder, som om du har banket i årevis.', hpAendring: -20, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Din lukkede hånd passer i aftrykket. Døren kalder dig ærlig, fordi du ikke pyntede på sulten.', naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Peg væk fra døren og følg den retning, ingen af billederne kigger på.',
        udfaldListe: [
          { log: 'Du finder en sprække bag en revne i skyggen. Den fører uden om hjertet og direkte til det sted, hvor valgene gemmer deres efterregning.', naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Vejen væk er ikke flugt. Den er en omvej gennem koldt vand og skarpe muslinger. Da du kommer frem, har du stadig alle dine undskyldninger, men færre kræfter.', hpAendring: -17, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Bag døren, som du ikke åbnede, falder noget tungt til ro. For en stund føles det som sejr ikke at have rørt ved alt.', maxHpAendring: 6, naesteTrin: 'glashjertet_efterregningen' }
        ]
      }
    ]
  },

  glashjertet_navnet: {
    id: 'glashjertet_navnet',
    titel: 'Navnet i sandet',
    biome: ['hav', 'ritual'],
    tekst: 'Navnet i sandet ligner først dit eget. Så barnets. Så et navn, du ikke kender, men allerede sørger over. Hver gang vandet når bogstaverne, bliver de ikke visket ud, men skrevet dybere. Ved siden af ligger en lille skovl af ben. Den er for lille til en voksen hånd. Den er ren.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_hav.webp',
    valg: [
      {
        tekst: 'Grav navnet fri med din skovl og lad sandet vise, hvem der blev skjult.',
        kraeverItem: 'skovl',
        udfaldListe: [
          { log: 'Under navnet ligger ikke en krop, men en pakke breve, aldrig sendt. De fortæller nok til at redde barnet, men ikke nok til at frikende nogen.', givItem: 'kikkert_250', naesteTrin: 'glashjertet_eden' },
          { log: 'Du graver for dybt og rammer vragets gamle ribben. Sandet falder sammen om dine ben, før du river dig fri med munden fuld af salt.', hpAendring: -22, naesteTrin: 'glashjertet_eden' },
          { log: 'Sandet åbner sig som en hånd. I håndfladen ligger guld, lagt ned som betaling for en tavshed, du nu har brudt.', guldAendring: 150, naesteTrin: 'glashjertet_eden' }
        ]
      },
      {
        tekst: 'Skriv dit eget navn ved siden af og del skylden med den døde.',
        udfaldListe: [
          { log: 'Bogstaverne suger varme fra din hånd. Du bærer nu en del af historien, og historien bærer en del af dig. Det gør ondt, men ikke kun som skade.', maxHpAendring: 9, hpAendring: -10, naesteTrin: 'glashjertet_stilheden' },
          { log: 'Navnet nægter at stå ved siden af dit. Det skriver sig oven på dit i stedet. Et øjeblik ved du ikke, hvem der skal reddes.', maxHpAendring: -5, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Da du skriver dit navn, spytter sandet gamle mønter op. Måske betaling. Måske bestikkelse. Forskellen ligger i, hvad du gør bagefter.', guldAendring: 115, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Visk navnet ud med støvlen, før det når at blive sandt.',
        udfaldListe: [
          { log: 'Navnet forsvinder. Noget i dig jubler over den rene overflade. Noget andet begynder straks at banke nedefra.', guldAendring: 90, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Du visker og visker, men hvert strøg gør bogstaverne dybere. Til sidst står navnet på indersiden af dine øjenlåg.', hpAendring: -18, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Sandet lader dig slette navnet, men beholder aftrykket af din støvle som ny underskrift.', maxHpAendring: -4, naesteTrin: 'glashjertet_efterregningen' }
        ]
      }
    ]
  },

  glashjertet_stilheden: {
    id: 'glashjertet_stilheden',
    titel: 'Den stille aftale',
    biome: ['ritual', 'ruin'],
    tekst: 'Hjertet slår nu så lavt, at du hører alt andet: barnets vejrtrækning, mønter der flytter sig af sig selv, og din egen tanke om at overleve. På gulvet står tre skåle. En med rent vand. En med sort vand. En tom. Over dem står: “Helbred ham, betal dig fri, eller lad sandheden vælge krop.”',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ritual.webp',
    valg: [
      {
        tekst: 'Hæld det rene vand over barnet, selvom skålen spejler dit eget ansigt.',
        udfaldListe: [
          { log: 'Barnet hoster og bliver varmere. Dit spejlbillede bliver blegere, som om vandet fordelte livet mere retfærdigt end behageligt.', hpAendring: -20, maxHpAendring: 8, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Vandet helbreder barnet og lukker en gammel sprække i dig. Du står fattigere på muligheder, men rigere på ro.', maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Barnet vågner med et ord på læberne: “Ikke mig.” Så peger han mod diamanten.', naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Drik det sorte vand og tag vragets straf ind i dig, før den vælger barnet.',
        udfaldListe: [
          { log: 'Det sorte vand smager af løfter sagt for hurtigt. Du kan bære straffen, men den gør dig mindre porøs, mindre ung.', maxHpAendring: -8, guldAendring: 140, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Vandet brænder hele vejen ned. Barnet trækker vejret frit. Hjertet banker én gang for dig, som en hård tak.', hpAendring: -28, maxHpAendring: 10, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Du drikker, men vandet nægter dig. Det vil ikke have heltemod. Det vil have et valg, der koster noget mere konkret.', naesteTrin: 'glashjertet_efterregningen' }
        ]
      },
      {
        tekst: 'Læg noget fra rygsækken i den tomme skål og lad vraget veje tabet.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: 'Madrationen forsvinder. Barnet vågner sultent, levende og vred. Det er et godt tegn. Levende børn har ret til vrede.', maxHpAendring: 6, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Skålen tager maden og giver mønter igen. Det er en kynisk handel, men ikke en meningsløs en. En levende krop skal også videre herfra.', guldAendring: 100, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Skålen afviser maden. Ikke fordi den er for lidt værd, men fordi den ikke var svær nok at give væk.', hpAendring: -10, naesteTrin: 'glashjertet_efterregningen' }
        ]
      },
      {
        tekst: 'Læg livseliksiren i den tomme skål og gør redningen større end dig selv.',
        kosterItem: 'livseliksir',
        udfaldListe: [
          { log: 'Eliksiren brister i skålen og løber som morgenlys ind i barnet. Hjertet bliver klart. Du får intet simpelt tilbage, kun et blik, der bliver hos dig.', maxHpAendring: 16, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Vraget tager eliksiren grådigt og helbreder ikke barnet helt, men nok. Resten bliver til guld på bunden af skålen. Det føles både praktisk og grimt.', guldAendring: 180, maxHpAendring: 5, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Eliksiren virker for godt. Barnet vågner med øjne, der allerede har set havbunden. Han lever, men noget af vraget lever også med ham.', hpAendring: -12, maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      }
    ]
  },

  glashjertet_barnets_blik: {
    id: 'glashjertet_barnets_blik',
    titel: 'Barnets blik',
    biome: ['hav', 'ritual'],
    tekst: 'Barnet åbner øjnene. De er ikke uskyldige. De er trætte på den måde, kun nogen kan være, når voksne har forklaret alt for længe. Han ser på diamanten, på dine hænder, på udgangen. “Hvis du går nu,” siger han, “så finder du måske skatten. Hvis du bliver, finder den måske dig.” Han rækker ikke ud. Det er næsten værre.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_hav.webp',
    valg: [
      {
        tekst: 'Giv ham diamanten, hvis du har den. Lad ham vælge, hvad den betyder.',
        kosterItem: 'diamant',
        udfaldListe: [
          { log: 'Han holder diamanten mod hjertet. Lyset i den går ud, men drengen smiler for første gang. Du mister den klareste skat og får en mere besværlig slags styrke.', maxHpAendring: 18 },
          { log: 'Han kaster diamanten i vandet. Vraget skriger uden lyd, og små mønter skyller ind over dine støvler. Han kalder det ikke belønning.', guldAendring: 130, maxHpAendring: 8 },
          { log: 'Han nægter at tage imod den. “Ikke alt, du fortryder, skal gives til mig,” siger han. Diamanten opløses i dine hænder og efterlader et ar af lys.', hpAendring: -10, maxHpAendring: 14 }
        ]
      },
      {
        tekst: 'Fortæl ham sandheden: Du overvejede skatten. Sig det uden at pynte på dig selv.',
        udfaldListe: [
          { log: 'Han nikker, som om ærlighed ikke gør dig god, men brugbar. Sammen finder I en skjult pose bag vuggen. Han tager ikke noget af den.', guldAendring: 150 },
          { log: 'Sandheden lander tungt mellem jer. Barnet ser ikke væk. Det tvinger dig til heller ikke at gøre det.', maxHpAendring: 10, hpAendring: -8 },
          { log: 'Han svarer: “Det gjorde alle.” Så griner han kort, og latteren knækker forbandelsen nok til, at I kan komme ud.', maxHpAendring: 12 }
        ]
      },
      {
        tekst: 'Lyv og sig, at du aldrig ville have taget skatten.',
        udfaldListe: [
          { log: 'Løgnen virker på barnet. Den virker ikke på vraget. En blid varme breder sig i lommen, hvor guld samler sig som bevismateriale.', guldAendring: 180, maxHpAendring: -6 },
          { log: 'Barnet smiler, fordi han gerne vil tro dig. Det gør løgnen tungere, ikke lettere.', hpAendring: -16, guldAendring: 90 },
          { log: 'Vraget elsker en pæn løgn. Det giver dig en gave, der klirrer, og tager noget fra den del af dig, der kunne have sagt sandheden næste gang.', givItem: 'kikkert_250', maxHpAendring: -8 }
        ]
      },
      {
        tekst: 'Gå uden at svare. Nogle spørgsmål bliver fælder, når de stilles af dem, vi har såret.',
        udfaldListe: [
          { log: 'Du går. Bag dig begynder barnet at synge lavt. Sangen holder vraget væk længe nok til, at du slipper ud med mere, end du føler dig værdig til.', guldAendring: 120 },
          { log: 'Du går, men spørgsmålet følger med. Det gør dig ikke svagere. Det gør bare hvert skridt mindre gratis.', hpAendring: -12, maxHpAendring: 6 },
          { log: 'Udgangen lukker sig næsten om din hæl. Du slipper fri, men efterlader et aftryk i glasset, som måske engang bliver en dør for en anden.', maxHpAendring: 5 }
        ]
      }
    ]
  },

  glashjertet_barnets_vaegt: {
    id: 'glashjertet_barnets_vaegt',
    titel: 'Den du bærer',
    biome: ['hav', 'ruin'],
    tekst: 'Barnet er i dine arme nu. Han er ikke tung hele tiden. Kun når du tænker på guld. Kun når du tænker på, hvor langt der er til næste sikre sted. Udgangen ligger foran jer som en smal stribe daglys. Bag jer begynder glashjertet at slå igen, langsomt, fornærmet, næsten ensomt.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ruin.webp',
    valg: [
      {
        tekst: 'Bær ham hele vejen ud uden at stoppe ved de åbne skattekister.',
        udfaldListe: [
          { log: 'Kisterne åbner sig, da du passerer. Du ser ikke ned. Ude i lyset trækker barnet vejret uden hjertets hjælp, og din egen krop husker, at den kan hele.', hpAendring: 24, maxHpAendring: 10 },
          { log: 'Du ser ikke ned, men du hører mønterne falde en efter en bag dig. Hvert klirrende nej gør dig trættere og mere hel.', hpAendring: -10, maxHpAendring: 14 },
          { log: 'Da I når sandet, finder barnet en mønt i sin hånd og giver den til dig. Ikke som betaling. Som bevis på at ikke alt tab er tomt.', guldAendring: 70, maxHpAendring: 8 }
        ]
      },
      {
        tekst: 'Sæt ham ned et øjeblik og fyld lommerne hurtigt. Kun det, du kan bære uden at tabe ham.',
        udfaldListe: [
          { log: 'Du tager lidt og bærer ham videre. Barnet siger ingenting, men lægger hovedet mod din skulder igen. Måske så han det. Måske valgte han at overleve først.', guldAendring: 145, hpAendring: -8 },
          { log: 'Du bøjer dig efter mønter, og hans vægt forsvinder et hjerteslag fra dine arme. Da du griber ham igen, er han koldere.', guldAendring: 180, maxHpAendring: -6 },
          { log: 'Du finder en lille diamant blandt mønterne og forstår for sent, at skattekisten brugte barnets stilhed som låg.', givItem: 'diamant', hpAendring: -16 }
        ]
      },
      {
        tekst: 'Giv ham madrationen og lad ham gå selv det sidste stykke.',
        kosterItem: 'mad',
        udfaldListe: [
          { log: 'Han spiser langsomt og går selv. Hvert skridt gør ham mindre til en byrde og mere til en person. Det er en lettelse, der næsten skammer dig.', maxHpAendring: 10 },
          { log: 'Maden giver ham kræfter, men også stemme. Han spørger, om du ville have båret ham, hvis han havde været tungere end skatten.', hpAendring: -10, maxHpAendring: 8 },
          { log: 'Han gemmer halvdelen af maden og bytter den ved udgangen for en lille pose mønter. “Vi skal begge klare os,” siger han.', guldAendring: 90, maxHpAendring: 5 }
        ]
      },
      {
        tekst: 'Brug soveposen som båre og slæb ham ud, selvom det koster tid og udstyr.',
        kosterItem: 'sovepose',
        udfaldListe: [
          { log: 'Soveposen bliver revet i stykker mod glasset, men barnet slipper for skårene. Ude på stranden er du uden ly for natten, men ikke uden grund til at fortsætte.', maxHpAendring: 16, hpAendring: -6 },
          { log: 'Båren gør jer langsomme. Vraget når at lukke sig om den ene ende, og du må rive hårdt. Barnet lever. Soveposen gør ikke.', hpAendring: -18, maxHpAendring: 12 },
          { log: 'Da du ruller den ødelagte sovepose sammen bagefter, falder guld ud fra en gammel syning. Nogen før dig forberedte både flugt og fristelse.', guldAendring: 130, maxHpAendring: 6 }
        ]
      }
    ]
  },

  glashjertet_ringen: {
    id: 'glashjertet_ringen',
    titel: 'Den blanke ring',
    biome: ['ritual', 'ruin'],
    tekst: 'Ringen uden navn ligger i din håndflade. Den passer ikke på nogen finger, men på alle løfter. Når du holder den tæt på barnet, trækker han vejret lettere. Når du holder den tæt på diamanten, lyser den stærkere. Når du holder den tæt på dig selv, bliver den varm.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ritual.webp',
    valg: [
      {
        tekst: 'Sæt ringen på barnets sejlklæde og bind hans liv til noget uden for vraget.',
        udfaldListe: [
          { log: 'Ringen lukker sig om sejlet. Barnet vågner med et suk, som om han endelig falder ned i sin egen krop.', maxHpAendring: 12, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Ringen virker, men binder også noget af dig til hans næste åndedrag. Hver redning er en forbindelse, ikke en kvittering.', hpAendring: -14, maxHpAendring: 10, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Ringen glider af sejlet og afslører mønter syet ind under kanten. Barnet overlever ikke på idealer alene, synes vraget at sige.', guldAendring: 105, naesteTrin: 'glashjertet_barnets_vaegt' }
        ]
      },
      {
        tekst: 'Hold ringen mod diamanten og lad rigdommen betale livets gæld.',
        udfaldListe: [
          { log: 'Diamanten revner og bliver til lys, der løber ind i barnet. Skatten er væk, men gælden ændrer form.', maxHpAendring: 15, naesteTrin: 'glashjertet_barnets_vaegt' },
          { log: 'Diamanten nægter at betale hele gælden. Den giver guld, ikke nåde. Du står med mere i hånden og samme blik foran dig.', guldAendring: 190, naesteTrin: 'glashjertet_barnets_blik' },
          { log: 'Ringen og diamanten smelter sammen til en kold lille sol. Den er smuk nok til at være farlig.', givItem: 'diamant', maxHpAendring: -5, naesteTrin: 'glashjertet_barnets_blik' }
        ]
      },
      {
        tekst: 'Luk ringen om dit eget håndled og bær forbandelsen ud på dine betingelser.',
        udfaldListe: [
          { log: 'Ringen krymper ind i huden. Du bliver stærkere på en måde, der ikke føles gratis. Barnet trækker vejret, men ser på dig som på en dør, der kan lukke igen.', maxHpAendring: 18, hpAendring: -12, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Forbandelsen tager imod dig med lettelse. Det er ubehageligt at være løsningen på noget, der har ventet så længe.', maxHpAendring: 8, guldAendring: 120, naesteTrin: 'glashjertet_efterregningen' },
          { log: 'Ringen strammer for hårdt. Et øjeblik kan du ikke huske, om du kom for barnet eller skatten.', hpAendring: -26, naesteTrin: 'glashjertet_efterregningen' }
        ]
      }
    ]
  },

  glashjertet_efterregningen: {
    id: 'glashjertet_efterregningen',
    titel: 'Efterregningen',
    biome: ['hav', 'ruin', 'ritual'],
    tekst: 'Du finder rummet bag alle de andre rum. Her ligger ingen skattekister, kun regnskaber ridset i glas. Hver linje har tre kolonner: hvad nogen tog, hvem der betalte, og hvad de kaldte det bagefter. Der er plads til én linje mere. Pennen er en knogle. Blækket er allerede på dine fingre.',
    unik: true,
    erSubTrin: true,
    billede: '/events/ev_ruin.webp',
    valg: [
      {
        tekst: 'Skriv: “Jeg tog noget, fordi jeg ville leve.”',
        udfaldListe: [
          { log: 'Glasset accepterer sætningen. Ikke som tilgivelse, men som præcision. Regnskabet giver dig guld uden at rense det.', guldAendring: 160 },
          { log: 'Ordene står fast. Du mærker en mærkelig ro i ikke at forklare sult som dyd.', maxHpAendring: 9 },
          { log: 'Regnskabet kræver en underskrift i smerte. Du giver den, og linjen lyser klart nok til at vise udgangen.', hpAendring: -18, guldAendring: 110 }
        ]
      },
      {
        tekst: 'Skriv: “Jeg reddede nogen, fordi jeg ikke kunne bære at lade være.”',
        udfaldListe: [
          { log: 'Regnskabet tøver ved ordene. De er ikke rene, men de er sande nok. Glasset lader din krop beholde lidt mere plads til fremtidig frygt.', maxHpAendring: 14 },
          { log: 'Pennen knækker. Det lyder som en dom, men døren åbner. Nogle handlinger kan ikke bogføres uden at blive mindre.', hpAendring: 18 },
          { log: 'Glasset kræver betaling for at skrive noget så varmt i et så koldt rum.', hpAendring: -16, maxHpAendring: 10 }
        ]
      },
      {
        tekst: 'Skriv ingenting. Lad den blanke linje være et vidne, ikke en forklaring.',
        udfaldListe: [
          { log: 'Den blanke linje bliver stående. Vraget hader den. Du går ud uden belønningens klare klang, men med færre ord mellem dig og det, der skete.', maxHpAendring: 11 },
          { log: 'Tavsheden får glasset til at ryste. Det spytter mønter efter dig som fornærmelser. Du tager nogle af dem. Selv tavshed har lommer.', guldAendring: 95, maxHpAendring: 5 },
          { log: 'Den blanke linje trækker lys ud af rummet og efterlader mørke nok til, at noget kan følge dig. Ikke hurtigt. Bare sikkert.', hpAendring: -20 }
        ]
      },
      {
        tekst: 'Smadr regnskabet med køllen og nægt hele præmissen.',
        kraeverItem: 'koelle',
        udfaldListe: [
          { log: 'Køllen flækker glasset. Regnskabet går i tusind stykker, og hvert stykke viser en anden udgave af dig, nogle rigere, nogle venligere, ingen uskyldige.', hpAendring: -20, guldAendring: 140 },
          { log: 'Glasset splintrer, og vraget mister sin hukommelse et øjeblik. I det øjeblik kan du stjæle fra selve efterregningen.', guldAendring: 230 },
          { log: 'Slaget rammer dybt. Ikke i glasset, men i den del af dig, der var træt af at blive målt. Det gør ondt, og det hjælper.', hpAendring: -24, maxHpAendring: 16 }
        ]
      },
      {
        tekst: 'Skær dit navn ud af regnskabet med sværdet og bær arret selv.',
        kraeverItem: 'svaerd',
        udfaldListe: [
          { log: 'Sværdet river dit navn fri. Linjen står uden ejer, og netop derfor mister den magt. Du går ud med et ar, der ikke kan sælges.', maxHpAendring: 15, hpAendring: -10 },
          { log: 'Dit navn kommer fri sammen med en byge af guldstøv. Du kan ikke afgøre, om du blev slettet eller købt ud.', guldAendring: 180, maxHpAendring: -4 },
          { log: 'Sværdet sætter sig fast i glasset et øjeblik for længe. Da det løsner sig, har klingen en ny tyngde.', hpAendring: -14, maxHpAendring: 8 }
        ]
      }
    ]
  }
};
