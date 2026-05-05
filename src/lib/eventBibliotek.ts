import { spilTilstand } from './spilTilstand.svelte';
import type { Biome } from './types';

import { klokkenPaaTorvetEvents } from './klokken_paa_torvet_events';
import { blodskovensHjerteEvents } from './event_blodskov';
import { glashjertetEvents } from './event_glashjertet';

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
    
    ...(klokkenPaaTorvetEvents as unknown as Record<string, SpilEvent>),
    ...(blodskovensHjerteEvents as unknown as Record<string, SpilEvent>),
    ...(glashjertetEvents as unknown as Record<string, SpilEvent>),

    'blodalter': {
        id: 'blodalter', titel: "Et Gammelt Alter", biome: ['ruin', 'blodskov'], billede: '/events/ev_alter.webp', unik: false,
        tekst: "Et sort stenalter trækker sig ud af tågen. Der sidder guldstykker fast i indtørret snavs på overfladen, og stenen brummer svagt.",
        valg: [
            { tekst: "Hæld eliksir over stenen for at rense den", kosterItem: 'livseliksir', udfaldListe: [{ log: "Væsken ætser snavset væk. Et lille skjult rum åbner sig og afslører et velholdt sværd.", givItem: 'svaerd', guldAendring: 150 }] },
            { tekst: "Vrist guldet løs med råstyrke", udfaldListe: [
                { log: "Alteret forsvarer sig. Du får et stød, der kaster dig hårdt tilbage mod klipperne.", hpAendring: -37 },
                { log: "Du får et solidt greb. Stenen giver efter, og du trækker både guld og en diamant fri.", hpAendring: -5, guldAendring: 250, givItem: 'diamant' }
            ]},
            { tekst: "Læg hænderne på stenen og ofr noget af din livskraft", udfaldListe: [{ log: "Kulden trækker ind i dig og tapper dig permanent for kræfter. Til gengæld løsner en stor diamant sig fra alteret.", maxHpAendring: -7, givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'stjernekikkert': {
        id: "stjernekikkert", titel: "Tågens Øje", biome: ["bjerg", "mark", "ruin"], unik: true,
        tekst: "En forladt stjernekikkert ligger i mudderet. Linsen udsender et skarpt violet lys, der giver dig hovedpine.",
        valg: [
            { tekst: "Knus kikkerten med din økse", kraeverItem: "oekse", udfaldListe: [{ log: "Messingrøret bøjer sammen under slaget. Linsen overlever og viser sig at være en værdifuld diamant.", givItem: "diamant", guldAendring: 80 }] },
            { tekst: "Kig direkte ind i det violette lys", udfaldListe: [
                { log: "Lyset brænder i øjnene. Det føles som om, energien forsvinder fra din krop.", hpAendring: -42 },
                { log: "Du afmonterer forsigtigt linsen og opdager, at det er en slebet diamant.", hpAendring: -7, givItem: "diamant", guldAendring: 250 }
            ]},
            { tekst: "Dæk linsen til med klude, før du rører den", kosterItem: "klude", udfaldListe: [{ log: "Stoffet skærmer dig mod lyset. Du pakker kikkerten sikkert ned sammen med nogle tabte mønter.", givItem: "kikkert_250", guldAendring: 150 }] }
        ]
    },  
    
    'koedvuggen': {
        id: 'koedvuggen', titel: "Træstammen", biome: ['skov', 'mark'], unik: true,
        tekst: "En tyk træstamme er flækket. Indeni vokser en mærkelig blød svamp, som har viklet sig om nogle rustne våben og en læderpung.",
        valg: [
            { tekst: "Træk genstandene ud med hænderne", udfaldListe: [
                { log: "Svampen udsender en syrlig væske, der giver dig grimme brandsår på underarmen.", hpAendring: -42 },
                { log: "Du er hurtig nok. Du river et våben og pungen til dig, inden svampen reagerer.", hpAendring: -7, givItem: 'svaerd', guldAendring: 280 }
            ]},
            { tekst: "Hæld eliksir over svampen for at skrumpe den", kosterItem: 'livseliksir', udfaldListe: [{ log: "Væsken får massen til at trække sig sammen. Du kan nu se dybere ind i træstammen.", naesteTrin: 'koedvuggen_indre' }] },
            { tekst: "Hak dig vej gennem fibrene med din økse", kraeverItem: 'oekse', udfaldListe: [{ log: "Du hugger dig igennem, men stammen sprøjter irriterende saft ud over dig. Du står nu foran kernen.", hpAendring: -12, naesteTrin: 'koedvuggen_kamp' }] }
        ]
    },

    'koedvuggen_indre': {
        id: 'koedvuggen_indre', titel: "Stammens Kerne", biome: 'any', erSubTrin: true,
        tekst: "Kernen lyser svagt. En rund genstand ligger halvt begravet i nogle gamle knogler og guldstykker.",
        valg: [
            { tekst: "Brug søgekvisten til at finde en sikker vej", kraeverItem: 'soegekvist', udfaldListe: [{ log: "Kvisten guider din hånd udenom de farlige sporer. Du samler guldskatten op.", guldAendring: 250 }] },
            { tekst: "Grib fat i den runde genstand", udfaldListe: [
                { log: "Genstanden brænder dig voldsomt, og du må trække hånden til dig uden udbytte.", hpAendring: -37 },
                { log: "Den køler ned, da du rører den. Det er en funklende diamant.", hpAendring: -10, givItem: 'diamant', guldAendring: 200 }
            ]},
            { tekst: "Stik dit sværd ind i kernen", kosterItem: 'svaerd', udfaldListe: [{ log: "Sværdet sætter sig fast for altid. Til gengæld triller en smuk diamant ned i gruset.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'koedvuggen_kamp': {
        id: 'koedvuggen_kamp', titel: "Hårde Rødder", biome: 'any', erSubTrin: true,
        tekst: "Tykke rødder skyder op fra jorden og slår ud efter dine ben for at forsvare stammen.",
        valg: [
            { tekst: "Svid rødderne væk med din fakkel", kosterItem: 'fakkel', udfaldListe: [{ log: "Ilden får rødderne til at trække sig tilbage. Du finder en gammel rustning i bunden.", givItem: 'rustning', guldAendring: 180 }] },
            { tekst: "Træd rødderne ned med støvlerne", udfaldListe: [
                { log: "Rødderne er stærke og dækket af torne. Du får dybe rifter på benene.", hpAendring: -37 },
                { log: "Du tramper dem ned. Vejen er banet, og du skraber en god mængde guld sammen.", hpAendring: -10, guldAendring: 300 }
            ]},
            { tekst: "Skær dem over med din kniv", kraeverItem: 'kniv', udfaldListe: [{ log: "Du kapper de største rødder over. Du får et par skrammer, men sikrer dig guldet.", hpAendring: -7, guldAendring: 150 }] }
        ]
    },

    'sumpens_lunge': {
        id: 'sumpens_lunge', titel: "Noget i Mudderet", biome: ['eng', 'bjerg'], unik: true,
        tekst: "Mudderet hæver og sænker sig. En stor, gennemsigtig blære ånder tungt i overfladen, og der ligger mønter inde i den.",
        valg: [
            { tekst: "Stik armen hurtigt ind, når den åbner sig", udfaldListe: [
                { log: "Den klapper sammen om din arm med et smæld. Det trækker hårdt i skulderen at komme fri.", hpAendring: -42 },
                { log: "Du fanger dens rytme og trækker en pung og en diamant ud, lige før den lukker i.", hpAendring: -7, guldAendring: 250, givItem: 'diamant' }
            ]},
            { tekst: "Dæk den til med en skovl for at stoppe bevægelsen", kraeverItem: 'skovl', udfaldListe: [{ log: "Du skovler jord over den, indtil den ligger helt stille. Du kan nu roligt samle mønterne.", guldAendring: 180 }] },
            { tekst: "Brug din rustning til at klemme den flad", kosterItem: 'rustning', udfaldListe: [{ log: "Blæren brister. Rustningen ætses i stykker af indholdet, men du finder en ædelsten i resterne.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'parasitmarkedet': {
        id: 'parasitmarkedet', titel: "Den Gamle Rustning", biome: ['ruin', 'slagmark'], unik: true,
        tekst: "En rustning står efterladt i gruset. Den vrimler med store insekter, der kravler rundt om en læderpung i midten.",
        valg: [
            { tekst: "Brug dit fine tøj til at lokke insekterne væk", kosterItem: 'flot_toej', udfaldListe: [{ log: "Insekterne foretrækker stoffet og forlader rustningen. Du kan nu inspicere udstyret.", naesteTrin: 'parasit_rustning' }] },
            { tekst: "Grib pungen med hænderne", udfaldListe: [
                { log: "Insekterne forsvarer sig aggressivt. Du bliver bidt gentagne gange og hæver op.", hpAendring: -40, naesteTrin: 'parasit_pungen' },
                { log: "Du slår insekterne væk og får fat i pungen med kun et par enkelte bid.", hpAendring: -5, naesteTrin: 'parasit_pungen' }
            ]},
            { tekst: "Brug dit sværd til at feje pungen ud", kraeverItem: 'svaerd', udfaldListe: [{ log: "Du holder afstand og bruger klingen til at vippe pungen ned på jorden.", naesteTrin: 'parasit_pungen' }] }
        ]
    },

    'parasit_pungen': {
        id: 'parasit_pungen', titel: "Læderposen", biome: 'any', erSubTrin: true,
        tekst: "Læderposen føles varm i din hånd. Noget bevæger sig nede i den.",
        valg: [
            { tekst: "Hæld eliksir i posen for at drukne indholdet", kosterItem: 'livseliksir', udfaldListe: [{ log: "Væsken får al bevægelse til at stoppe. Nede i bunden fisker du en diamant op.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Skær posen forsigtigt op med din kniv", kraeverItem: 'kniv', udfaldListe: [{ log: "Du sprætter siden op og undgår faren i toppen. En diamant triller ud.", givItem: 'diamant', guldAendring: 100 }] },
            { tekst: "Ryst indholdet ud på jorden", udfaldListe: [
                { log: "Noget skarpt stikker dig gennem læderet, da du griber om posen.", hpAendring: -37 },
                { log: "Du ryster den hårdt. En gammel detektor og nogle mønter falder ud i gruset.", hpAendring: -7, givItem: 'metaldetektor', guldAendring: 150 }
            ]}
        ]
    },

    'parasit_rustning': {
        id: 'parasit_rustning', titel: "Det Tomme Panser", biome: 'any', erSubTrin: true,
        tekst: "Insekterne er væk. Rustningen ser stærk ud, men indersiden er dækket af en mærkelig, slimelig væske.",
        valg: [
            { tekst: "Tag rustningen på alligevel", udfaldListe: [
                { log: "Væsken svider voldsomt mod din hud. Det er ubehageligt, men du har nu et panser.", hpAendring: -42, givItem: 'rustning' },
                { log: "Væsken er indtørret og gør ingen skade. Du spænder rustningen fast.", hpAendring: -2, givItem: 'rustning', guldAendring: 100 }
            ]},
            { tekst: "Rens indersiden med din eliksir", kosterItem: 'livseliksir', udfaldListe: [{ log: "Eliksiren renser metallet perfekt. Du tager den på og finder lidt guld i en inderlomme.", givItem: 'rustning', guldAendring: 350 }] },
            { tekst: "Skrab slimen væk med din skovl", kraeverItem: 'skovl', udfaldListe: [{ log: "Du får kradset det meste af. Væsken irriterer dine hænder, men rustningen er nu brugbar.", hpAendring: -12, givItem: 'rustning' }] }
        ]
    },

    'de_omfavnede': {
        id: 'de_omfavnede', titel: "De To Skeletter", biome: ['skov', 'ruin'], unik: true,
        tekst: "To skeletter sidder viklet ind i hinanden under et træ. Mellem dem ligger en perle, men hele området er dækket af et gult pulver.",
        valg: [
            { tekst: "Brug metaldetektoren til at finde en sikker vej", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Detektoren bipper væk fra skeletterne og leder dig hen til et nedgravet skrin.", naesteTrin: 'omfavnelse_kiste' }] },
            { tekst: "Hold vejret og forsøg at tage perlen", udfaldListe: [
                { log: "Du kommer til at indånde pulveret. Det får dig til at hoste voldsomt og dræner din energi.", hpAendring: -42, naesteTrin: 'omfavnelse_sporer' },
                { log: "Du holder vejret perfekt og snupper perlen fra støvet.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug dit fine tøj som filter over ansigtet", kosterItem: 'flot_toej', udfaldListe: [{ log: "Tøjet skærmer dine lunger. Du får stenen med dig, som viser sig at være en ægte diamant.", givItem: 'diamant', guldAendring: 150 }] }
        ]
    },

    'omfavnelse_sporer': {
        id: 'omfavnelse_sporer', titel: "Gult Støv", biome: 'any', erSubTrin: true,
        tekst: "Støvet er ubehageligt tæt omkring skeletterne. Perlen ligger stadig derinde.",
        valg: [
            { tekst: "Luk øjnene og ræk ud efter stenen i blinde", udfaldListe: [
                { log: "Du famler rundt og skærer dig på skarpe knogler. Du må trække dig tilbage uden perlen.", hpAendring: -42 },
                { log: "Dine fingre lukker sig om juvelen i første forsøg. Du træder hurtigt ud i den friske luft.", hpAendring: -7, givItem: 'diamant', guldAendring: 200 }
            ]},
            { tekst: "Kast mønter på jorden for at binde støvet", puljeVaerdi: 100, udfaldListe: [{ log: "Vægten af de mange mønter presser støvskyen ned. Du samler roligt dine egne og deres værdier op.", guldAendring: 300 }] },
            { tekst: "Bind kludene for munden som en maske", kosterItem: 'klude', udfaldListe: [{ log: "Masken fjerner det værste. Du får fat i den smukke perle og et par tabte mønter.", givItem: 'diamant', guldAendring: 80 }] }
        ]
    },

    'omfavnelse_kiste': {
        id: 'omfavnelse_kiste', titel: "Det Lille Skrin", biome: 'any', erSubTrin: true,
        tekst: "Et lille jernskrin sidder fast i jorden. Hængslerne er rustet fuldstændig fast.",
        valg: [
            { tekst: "Brug din fakkel til at varme låsen op", kosterItem: 'fakkel', udfaldListe: [{ log: "Varmen gør metallet skørt, så du kan bryde det op. Indeni ligger en eliksir og guld.", givItem: 'livseliksir', guldAendring: 250 }] },
            { tekst: "Vip låsen op med din kniv", kraeverItem: 'kniv', udfaldListe: [{ log: "Du får dirket låsen op uden besvær og tømmer skrinet for mønter.", guldAendring: 220 }] },
            { tekst: "Slå skrinet åbent med hælen", udfaldListe: [
                { log: "Metallet er for hårdt. Du slår foden voldsomt og må opgive.", hpAendring: -37 },
                { log: "Rusten har ædt det meste af jernet. Det går i stykker ved første spark, og en diamant triller ud.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

    'enkens_byrde': {
        id: 'enkens_byrde', titel: "Kvinden ved Hullet", biome: ['mark', 'eng'], unik: true,
        tekst: "En kvinde sidder på kanten af et slughul i jorden. Hun lader bevidst blod dryppe fra sin hånd ned i mørket.",
        valg: [
            { tekst: "Skub til hende for at se ned i hullet", udfaldListe: [
                { log: "Hun klamrer sig til dig, og I er ved at falde ned. Du river dig fri, men vrider armen af led.", hpAendring: -42, naesteTrin: 'enken_bunden' },
                { log: "Hun rykker sig skræmt tilbage og flygter. Du ser hendes efterladte taske og ignorerer hullet.", hpAendring: -5, guldAendring: 200, naesteTrin: 'enken_bunden' }
            ]},
            { tekst: "Træk dit sværd og bed hende om at forsvinde", kraeverItem: 'svaerd', udfaldListe: [{ log: "Hun rejser sig og løber lydløst ind i tågen. Hendes taske ligger tilbage på kanten.", naesteTrin: 'enken_bunden' }] },
            { tekst: "Rens hendes sår med din eliksir", kosterItem: 'livseliksir', udfaldListe: [{ log: "Hendes sår lukkes. Nede fra hullet lyder en skuffet knurren, der lynhurtigt kommer nærmere.", naesteTrin: 'enken_angreb' }] }
        ]
    },

    'enken_bunden': {
        id: 'enken_bunden', titel: "Tasken på Kanten", biome: 'any', erSubTrin: true,
        tekst: "Kvindens taske er lukket stramt med ståltråd. Den lugter af kemikalier.",
        valg: [
            { tekst: "Træk ståltråden op med fingrene", udfaldListe: [
                { log: "En sky af ubehagelig røg siver ud. Det svider i halsen at indånde den.", hpAendring: -40 },
                { log: "Du løsner låsen uden problemer. I tasken ligger en flot diamant og lidt guld.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Læg dit fine tøj over tasken for at dæmpe indholdet", kosterItem: 'flot_toej', udfaldListe: [{ log: "Tøjet tager skade af gassen, men beskytter dig. Du redder diamanten fra tasken.", givItem: 'diamant', guldAendring: 150 }] },
            { tekst: "Brug skovlen til at åbne den på afstand", kraeverItem: 'skovl', udfaldListe: [{ log: "Du slår tasken åben og står langt væk, da røgen fordamper. Derefter tager du guldet.", guldAendring: 280 }] }
        ]
    },

    'enken_angreb': {
        id: 'enken_angreb', titel: "Dyr i Mørket", biome: 'any', erSubTrin: true,
        tekst: "Et stort, blindt rovdyr klatrer op mod kanten af hullet. Det er tydeligvis sultent.",
        valg: [
            { tekst: "Skyd det med buen, før det når helt op", kraeverItem: 'bue', udfaldListe: [{ log: "Pilen får dyret til at slippe grebet og falde tilbage i dybet. Du tager kvindens taske som tak.", guldAendring: 280 }] },
            { tekst: "Kast en sten mod dyrets hoved", udfaldListe: [
                { log: "Du rammer forbi. Dyret når kanten og flænser dit ben, inden du får sparket det ned.", hpAendring: -42 },
                { log: "Du rammer den lige i snotten. Den falder ned igen. Du finder en ædelsten og mønter på kanten.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Slå det ned med din økse", kosterItem: 'oekse', udfaldListe: [{ log: "Øksen sætter sig fast i dyret og forsvinder med det ned i hullet. Kvinden takker dig med en ædelsten.", givItem: 'diamant', guldAendring: 150 }] }
        ]
    },

    'spejlets_gaade': {
        id: 'spejlets_gaade', titel: "Det Sorte Spejl", biome: ['ruin', 'bjerg'], unik: true,
        tekst: "Et massivt spejl af sort glas spærrer vejen. Dit eget spejlbillede kigger på dig og rækker hånden frem.",
        valg: [
            { tekst: "Slå spejlet i stykker med din stav", kraeverItem: 'stav', udfaldListe: [{ log: "Staven overlever slaget. Glasset splintres i hundrede stykker og falder til jorden.", naesteTrin: 'spejlet_skår' }] },
            { tekst: "Læg dit sværd i spejlbilledets hånd", kosterItem: 'svaerd', udfaldListe: [{ log: "Sværdet bliver trukket ind i spejlet og forsvinder. Spejlbilledet træder til side.", naesteTrin: 'spejlet_gave' }] },
            { tekst: "Kast dig mod spejlet med skulderen forrest", udfaldListe: [
                { log: "Glasset er ufatteligt hårdt. Du slår dig voldsomt, før det endelig giver efter.", hpAendring: -42, naesteTrin: 'spejlet_skår' },
                { log: "Du brager igennem det. Glasset splintres, og en skinnende diamant ligger skjult bagved.", hpAendring: -5, givItem: 'diamant', guldAendring: 250, naesteTrin: 'spejlet_skår' }
            ]}
        ]
    },

    'spejlet_gave': {
        id: 'spejlet_gave', titel: "Bagved Spejlet", biome: 'any', erSubTrin: true,
        tekst: "Der er tomt i spejlrammen nu. Ud af mørket rækkes en genstand frem mod dig.",
        valg: [
            { tekst: "Læg 50 guldstykker og tag imod gaven", puljeVaerdi: 50, udfaldListe: [{ log: "Du afleverer betalingen, og hånden overdrager en meget flot diamant til dig.", givItem: 'diamant', guldAendring: 150 }] },
            { tekst: "Grib fat i hånden og træk til dig", udfaldListe: [
                { log: "Hånden vrider din arm af led i et ryk. Du får fat i udstyret, men det gør ondt.", hpAendring: -42, givItem: 'metaldetektor' },
                { log: "Du rykker hårdt til. Hånden slipper, og du får både en funklende sten og guld med dig.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Kig nærmere på mørket med kikkerten", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Linsen afslører, at rummet bag spejlet er fyldt med mønter. Du ignorerer gaven og fylder lommerne.", guldAendring: 280 }] }
        ]
    },

    'spejlet_skår': {
        id: 'spejlet_skår', titel: "Glasskårene", biome: 'any', erSubTrin: true,
        tekst: "Skarpe stykker af sort glas flyder på jorden. Du kan se mønter blinke imellem skårene.",
        valg: [
            { tekst: "Brug fingrene til at samle mønterne", udfaldListe: [
                { log: "Du skærer dig dybt i hænderne på glasset undervejs.", hpAendring: -42, guldAendring: 100 },
                { log: "Du navigerer uden om de skarpe kanter og samler både diamant og guld op.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Skub skårene til side med skovlen", kraeverItem: 'skovl', udfaldListe: [{ log: "Skovlen rydder jorden nemt. Du finder et våben og lidt guld under glasset.", givItem: 'sabel', guldAendring: 180 }] },
            { tekst: "Brug dit fine tøj til at beskytte hænderne", kosterItem: 'flot_toej', udfaldListe: [{ log: "Tøjet skæres i laser, men beskytter dig. Du samler en smuk diamant op.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'den_svigtede_brud': {
        id: 'den_svigtede_brud', titel: "Bruden", biome: ['by', 'ruin'], unik: true,
        tekst: "En kvinde i en beskidt brudekjole sidder på en kiste og spærrer vejen. Hun har unaturligt lange, skarpe negle.",
        valg: [
            { tekst: "Tilbyd dit fine tøj som bytte for kisten", kosterItem: 'flot_toej', udfaldListe: [{ log: "Hun ser på stoffet, nikker og træder til side. Kisten gemmer på en detektor.", givItem: 'metaldetektor', guldAendring: 250 }] },
            { tekst: "Forsøg at skræmme hende med et råb", udfaldListe: [
                { log: "Hun farer frem og river dig over underarmen, inden hun flygter i tågen.", hpAendring: -40, naesteTrin: 'brudens_kiste' },
                { log: "Hun bliver bange, rejser sig op og forsvinder. Kisten står ubevogtet tilbage.", hpAendring: -7, guldAendring: 150, naesteTrin: 'brudens_kiste' }
            ]},
            { tekst: "Sigt på hende med buen", kraeverItem: 'bue', udfaldListe: [{ log: "Truslen virker. Hun trækker sig tilbage ind i ruinen og lader kisten stå.", naesteTrin: 'brudens_kiste' }] }
        ]
    },

    'brudens_kiste': {
        id: 'brudens_kiste', titel: "Kisten", biome: 'any', erSubTrin: true,
        tekst: "Låget er lukket med en tung, rusten hængelås.",
        valg: [
            { tekst: "Slå på låsen med en stor sten", udfaldListe: [
                { log: "Stenen smutter, og du smadrer tommelfingeren mod jernet.", hpAendring: -37, guldAendring: 150 },
                { log: "Et præcist slag smadrer hængelåsen. En funklende diamant ligger derinde.", hpAendring: -5, givItem: 'diamant', guldAendring: 200 }
            ]},
            { tekst: "Opvarm jernet med faklen", kosterItem: 'fakkel', udfaldListe: [{ log: "Varmen udvider metallet, og låsen springer op. Du tager en eliksir fra kisten.", givItem: 'livseliksir', guldAendring: 200 }] },
            { tekst: "Brug dit sværd som brækjern", kraeverItem: 'svaerd', udfaldListe: [{ log: "Klingen vrikker låget løst. Du finder en solid mængde mønter.", guldAendring: 280 }] }
        ]
    },

    'alkymistens_sorg': {
        id: 'alkymistens_sorg', titel: "Alkymisten", biome: ['eng', 'mark'], unik: true,
        tekst: "En mand står bøjet over et arbejdsbord med kemikalier. Han prøver at behandle et sygt barn.",
        valg: [
            { tekst: "Gå tæt på for at se, hvad han laver", udfaldListe: [
                { log: "Han går i panik og kaster en flaske med skarp syre ud over dig.", hpAendring: -42, naesteTrin: 'alkymistens_valg' },
                { log: "Han er for dybt koncentreret til at ænse dig. Du stiller dig roligt ved bordet.", hpAendring: -2, guldAendring: 100, naesteTrin: 'alkymistens_valg' }
            ]},
            { tekst: "Giv ham din eliksir til barnet", kosterItem: 'livseliksir', udfaldListe: [{ log: "Væsken virker omgående. Som tak får du lov at tage mandens metaldetektor og guld.", givItem: 'metaldetektor', guldAendring: 400 }] },
            { tekst: "Træk sværdet og bed ham fjerne sig", kraeverItem: 'svaerd', udfaldListe: [{ log: "Han griber barnet og viger rædselsslagen væk fra bordet.", naesteTrin: 'alkymistens_valg' }] }
        ]
    },

    'alkymistens_valg': {
        id: 'alkymistens_valg', titel: "Arbejdsbordet", biome: 'any', erSubTrin: true,
        tekst: "Bordet er fyldt med kolber, der bobler ustabilt. En skarp kemisk lugt hænger i luften.",
        valg: [
            { tekst: "Scan bordets underside med detektoren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Maskinen bimler. Du finder et skjult rum under pladen med en stor stak guld.", guldAendring: 350 }] },
            { tekst: "List værdierne forsigtigt ned i tasken", udfaldListe: [
                { log: "Du kommer til at vælte en kolbe. Dampen gør dig svimmel og svag.", hpAendring: -40, guldAendring: 100 },
                { log: "Du undgår kemikalierne helt og fisker en diamant og guld med dig.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Kast dit fine tøj over kolberne for at stoppe dampen", kosterItem: 'flot_toej', udfaldListe: [{ log: "Stoffet suger det meste af gassen. Du tømmer bordet for penge og et godt våben.", givItem: 'sabel', guldAendring: 300 }] }
        ]
    },

    'de_adskilte_elskende': {
        id: 'de_adskilte_elskende', titel: "Klippesprækken", biome: ['bjerg', 'ruin'], unik: true,
        tekst: "En rustning ligger nede på en afsats i en mørk og stejl klippesprække.",
        valg: [
            { tekst: "Brug kvisten til at teste de løse sten", kraeverItem: 'soegekvist', udfaldListe: [{ log: "Træet fortæller dig, hvilke sten der kan bære. Du klatrer sikkert ned.", naesteTrin: 'kloeften_bund' }] },
            { tekst: "Klatr ned ad den glatte stige", udfaldListe: [
                { log: "Et trin knækker, og du glider det sidste stykke ned. Det koster et slag på knæet.", hpAendring: -42, naesteTrin: 'kloeften_bund' },
                { log: "Du holder balancen og hopper sikkert ned på afsatsen.", hpAendring: -7, givItem: 'rustning', naesteTrin: 'kloeften_bund' }
            ]},
            { tekst: "Brug din stav til at lirke rustningen op til dig", kosterItem: 'stav', udfaldListe: [{ log: "Staven knækker under vægten, men det lykkes dig at fiske rustningen og lidt mønter op.", givItem: 'rustning', guldAendring: 200 }] }
        ]
    },

    'kloeften_bund': {
        id: 'kloeften_bund', titel: "Mørket i Kløften", biome: 'any', erSubTrin: true,
        tekst: "Der er bælgmørkt på afsatsen. Du kan mærke løse genstande nede i mudderet.",
        valg: [
            { tekst: "Føl dig frem med hænderne", udfaldListe: [
                { log: "Du skærer dig på noget rustent metal, der ligger skjult.", hpAendring: -37, guldAendring: 100 },
                { log: "Dine fingre lukker sig om en glat sten. Det er en diamant.", hpAendring: -5, givItem: 'diamant', guldAendring: 180 }
            ]},
            { tekst: "Brug kniven til forsigtigt at skubbe jorden væk", kraeverItem: 'kniv', udfaldListe: [{ log: "Klingen støder mod et lille skrin. Du samler det op og finder guld indeni.", guldAendring: 280 }] },
            { tekst: "Brug faklen til at lyse området op", kosterItem: 'fakkel', udfaldListe: [{ log: "Med lys på kan du roligt samle en diamant og nogle tabte penge op.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'hjerteslaget_i_muld': {
        id: 'hjerteslaget_i_muld', titel: "Puls i Jorden", biome: ['skov', 'eng'], unik: true,
        tekst: "Jorden i en fordybning bevæger sig taktfast op og ned. Det lyder som et stort, tungt hjerteslag.",
        valg: [
            { tekst: "Afsøg kanten af hullet med detektoren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Detektoren bipper tæt på overfladen. Du undgår at grave dybt og finder guld.", guldAendring: 250 }] },
            { tekst: "Sæt din økse i den rod, der bevæger sig", kosterItem: 'oekse', udfaldListe: [{ log: "Øksen sætter sig uhjælpeligt fast, men et hul åbner sig i jorden.", naesteTrin: 'hjertets_blod' }] },
            { tekst: "Grav forsigtigt med hænderne over midten", udfaldListe: [
                { log: "Jorden er pludselig brændvarm, og du får et smerteligt udslet på huden.", hpAendring: -42, naesteTrin: 'hjertets_blod' },
                { log: "Jorden er blød. Du graver et pænt hul ned til kernen.", hpAendring: -2, naesteTrin: 'hjertets_blod' }
            ]}
        ]
    },

    'hjertets_blod': {
        id: 'hjertets_blod', titel: "Mørkt Vand", biome: 'any', erSubTrin: true,
        tekst: "Nede i fordybningen samler der sig mørkt vand. En glinsende sten ligger på bunden.",
        valg: [
            { tekst: "Stik armen ned i vandet for at hente stenen", udfaldListe: [
                { log: "Vandet koger næsten og brænder huden på din arm.", hpAendring: -40, givItem: 'diamant' },
                { log: "Du tager stenen lynhurtigt. Vandet gør ikke skade, og stenen er en diamant.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug rustningen som handske", kosterItem: 'rustning', udfaldListe: [{ log: "Vandet ætser metallet i stykker, men du fisker diamanten sikkert op.", givItem: 'diamant', guldAendring: 180 }] },
            { tekst: "Grav en rende og led vandet væk med skovlen", kraeverItem: 'skovl', udfaldListe: [{ log: "Du tømmer hullet for væske og kan uforstyrret samle guld op fra bunden.", guldAendring: 320 }] }
        ]
    },

    'forraederens_loefte': {
        id: 'forraederens_loefte', titel: "Den Væltede Vogn", biome: ['by', 'eng'], unik: true,
        tekst: "En mand ligger fastklemt under en tung trækvogn og tigger om din hjælp.",
        valg: [
            { tekst: "Løft vognen med råstyrke", udfaldListe: [
                { log: "Vægten er enorm. Du får et alvorligt ryk i ryggen af anstrengelsen.", hpAendring: -42, naesteTrin: 'forraederens_sandhed' },
                { log: "Du samler kræfter og vipper træet væk fra ham uden problemer.", hpAendring: -5, naesteTrin: 'forraederens_sandhed' }
            ]},
            { tekst: "Brug skovlen til at grave ham fri underfra", kraeverItem: 'skovl', udfaldListe: [{ log: "Du graver en rende under ham, så han kan klemme sig ud.", naesteTrin: 'forraederens_sandhed' }] },
            { tekst: "Sæt staven i klemme som en vægtstang", kosterItem: 'stav', udfaldListe: [{ log: "Staven brækker, men han kommer fri og giver dig lidt mønter i farten.", guldAendring: 280, naesteTrin: 'forraederens_sandhed' }] }
        ]
    },

    'forraederens_sandhed': {
        id: 'forraederens_sandhed', titel: "Tak for Hjælpen", biome: 'any', erSubTrin: true,
        tekst: "Manden rejser sig, trækker en kniv og ryster på hovedet. 'Du får ingenting,' siger han.",
        valg: [
            { tekst: "Sigt på ham med buen", kraeverItem: 'bue', udfaldListe: [{ log: "Han forstår hurtigt alvoren, taber kniven og overlader sin diamant til dig.", givItem: 'diamant', guldAendring: 150 }] },
            { tekst: "Forsøg at vride kniven ud af hånden på ham", udfaldListe: [
                { log: "Han stritter imod og kradser dig over skulderen med klingen.", hpAendring: -40, guldAendring: 250 },
                { log: "Du afvæbner ham med en hurtig bevægelse og tømmer hans lommer.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Kast dit tøj i hovedet på ham", kosterItem: 'flot_toej', udfaldListe: [{ log: "Det forvirrer ham nok til, at du kan snuppe hans metaldetektor og stikke af.", givItem: 'metaldetektor', guldAendring: 200 }] }
        ]
    },

    'blind_tillid': {
        id: 'blind_tillid', titel: "Vagten", biome: ['ruin', 'hule'], unik: true,
        tekst: "En høj skikkelse står i døråbningen. Den peger indad og gnider fingrene mod hinanden for at kræve betaling.",
        valg: [
            { tekst: "Tilbyd din detektor i bytte for passage", kosterItem: 'metaldetektor', udfaldListe: [{ log: "Skikkelsen tager apparatet og kaster en tung pengepung til dig som bytte.", guldAendring: 350, naesteTrin: 'guidens_sti' }] },
            { tekst: "Betal vagten 200 guldstykker", puljeVaerdi: 200, udfaldListe: [{ log: "Den tæller mønterne, nikker og træder til side.", naesteTrin: 'guidens_sti' }] },
            { tekst: "Forsøg at skubbe den fysisk af vejen", udfaldListe: [
                { log: "Den svarer igen med et par ekstremt hårde slag, før den til sidst lader dig gå.", hpAendring: -42, naesteTrin: 'guidens_sti' },
                { log: "Den mister balancen, da du puffer, og du træder ubesværet forbi.", hpAendring: -5, naesteTrin: 'guidens_sti' }
            ]}
        ]
    },

    'guidens_sti': {
        id: 'guidens_sti', titel: "Det Inderste Rum", biome: 'any', erSubTrin: true,
        tekst: "Der er tynde tråde spændt ud over gulvet i hele rummet. Det ligner en fælde.",
        valg: [
            { tekst: "Opløs trådene med din eliksir", kosterItem: 'livseliksir', udfaldListe: [{ log: "Væsken brænder snorene over. Du kan frit samle en diamant op fra midten af rummet.", givItem: 'diamant', guldAendring: 180 }] },
            { tekst: "Prøv at liste benene over snorene", udfaldListe: [
                { log: "Du rammer en tråd med vristen. En lille fjederpil skyder ud og rammer dig i låret.", hpAendring: -40, givItem: 'diamant', guldAendring: 120 },
                { log: "Du træder præcist og undgår mekanismen. Diamanten i midten af rummet er din.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Kap snorene forsigtigt over med sværdet", kraeverItem: 'svaerd', udfaldListe: [{ log: "Du deaktiverer fælderne og finder et fuldt sæt rustning på den anden side.", givItem: 'rustning', guldAendring: 250 }] }
        ]
    },

    'giftig_alliance': {
        id: 'giftig_alliance', titel: "To Sider", biome: ['slagmark', 'mark'], unik: true,
        tekst: "To forgiftede lejesvende ligger i græsset. Den ene klamrer sig til en flaske modgift, den anden til en stor diamant.",
        valg: [
            { tekst: "Tving tingene fra dem", udfaldListe: [
                { log: "De har stadig kræfter til at gøre modstand og kradser dig i kampen.", hpAendring: -42, naesteTrin: 'maeglerens_valg' },
                { log: "Du tager tingene fra deres svage hænder uden overhovedet at møde modstand.", hpAendring: -5, naesteTrin: 'maeglerens_valg' }
            ]},
            { tekst: "Byt din egen eliksir væk for deres ting", kosterItem: 'livseliksir', udfaldListe: [{ log: "De accepterer byttet for at overleve. Du overtager diamanten og deres guld.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Brug buen til at true dem til at overgive sig", kraeverItem: 'bue', udfaldListe: [{ log: "De opgiver stædigheden. Den ene kaster sin detektor til dig.", givItem: 'metaldetektor', naesteTrin: 'maeglerens_valg' }] }
        ]
    },

    'maeglerens_valg': {
        id: 'maeglerens_valg', titel: "Modgiften", biome: 'any', erSubTrin: true,
        tekst: "Du står nu med diamanten og lejesvendenes egen flaske modgift.",
        valg: [
            { tekst: "Smadr flasken med sværdet og tag kun guldet", kosterItem: 'svaerd', udfaldListe: [{ log: "Væsken ætser dit sværd, men du fylder lommerne med mønter uden at løbe en risiko med giften.", guldAendring: 380 }] },
            { tekst: "Drik modgiften for at se, om den virker", udfaldListe: [
                { log: "Det var ikke en modgift. Det brænder i maven, men diamanten er din.", hpAendring: -42, givItem: 'diamant' },
                { log: "Drikken er kraftfuld og styrkende! Du får det markant bedre.", hpAendring: 150, maxHpAendring: 10, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Undersøg flasken med din kikkert", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Væsken er fyldt med urenheder. Du lader den ligge og tager kun diamanten og guldet.", givItem: 'diamant', guldAendring: 180 }] }
        ]
    },

    'faeldens_lokkemad': {
        id: 'faeldens_lokkemad', titel: "Trækassen", biome: ['skov', 'eng'], unik: true,
        tekst: "En svag stemme kalder på hjælp nede fra en lukket trækasse. Den lugter stærkt af kemikalier.",
        valg: [
            { tekst: "Åbn kassen med hænderne", udfaldListe: [
                { log: "Der var ingen indeni. Kassen smækker sammen om dine fingre.", hpAendring: -45, naesteTrin: 'kistens_krav' },
                { log: "Du river låget op og snupper diamanten indeni, lige før en fælde smækker kassen i.", hpAendring: -5, givItem: 'diamant', guldAendring: 180 }
            ]},
            { tekst: "Brug skovlen til at slå kassen op på afstand", kosterItem: 'skovl', udfaldListe: [{ log: "Kassen sprøjter ætsende syre ud over skovlen, som ødelægges. Du samler roligt guldet bagefter.", givItem: 'diamant', guldAendring: 150 }] },
            { tekst: "Lirk haspen op med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Du åbner fælden præcist og finder en anselig sum penge.", guldAendring: 280 }] }
        ]
    },

    'kistens_krav': {
        id: 'kistens_krav', titel: "Den Tunge Lås", biome: 'any', erSubTrin: true,
        tekst: "Stemmen er stoppet. Kassen har lukket sig igen og klikket i lås.",
        valg: [
            { tekst: "Scan mekanismen med detektoren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du gennemskuer låsen, trykker på et skjult bræt og får adgang til et rum med guld.", guldAendring: 350 }] },
            { tekst: "Klem rustningen ind i sprækken", kosterItem: 'rustning', udfaldListe: [{ log: "Rustningen kiler låget fast. Du kan tømme kassen for værdier, men må efterlade dit panser.", givItem: 'diamant', guldAendring: 220 }] },
            { tekst: "Ryk låget op med råstyrke", udfaldListe: [
                { log: "Du anstrenger dig for meget og trækker en muskel i ryggen.", hpAendring: -40, givItem: 'diamant' },
                { log: "Det giver efter med et knæk. Kisten gemmer på en diamant og penge.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

    'moerkets_gidsel': {
        id: 'moerkets_gidsel', titel: "Under Hjulet", biome: ['hule', 'ruin'], unik: true,
        tekst: "En mand ligger skrigende med benet klemt under hjulet på en tung vogn. En pengepung ligger ved siden af hjulet.",
        valg: [
            { tekst: "Brug buen som brækjern under hjulet", kosterItem: 'bue', udfaldListe: [{ log: "Buen brækker, men hjulet løftes nok til, at manden kommer fri. Han giver dig pungen.", givItem: 'diamant', guldAendring: 200, naesteTrin: 'gidsel_tak' }] },
            { tekst: "Grav mudderet væk under hans ben", kraeverItem: 'skovl', udfaldListe: [{ log: "Du skaber nok plads i jorden til, at han kan trække sig i sikkerhed.", naesteTrin: 'gidsel_tak' }] },
            { tekst: "Forsøg at vippe vognen tilbage", udfaldListe: [
                { log: "Den er urimeligt tung, og det koster et smertende ryk i din krop.", hpAendring: -42, naesteTrin: 'gidsel_tak' },
                { log: "Du lægger ryggen i og vipper den lige akkurat fri.", hpAendring: -5, naesteTrin: 'gidsel_tak' }
            ]}
        ]
    },

    'gidsel_tak': {
        id: 'gidsel_tak', titel: "Tråden", biome: 'any', erSubTrin: true,
        tekst: "Pungen er snøret sammen med en mørk ståltråd, der lugter af svovl.",
        valg: [
            { tekst: "Træk ståltråden af med fingrene", udfaldListe: [
                { log: "Tråden er skarp og snitter dig i fingrene undervejs.", hpAendring: -40, givItem: 'diamant' },
                { log: "Du bryder snøren uden problemer og tager diamanten.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Hold om pungen med dit tøj", kosterItem: 'flot_toej', udfaldListe: [{ log: "Stoffet beskytter dig. Tøjet bliver ødelagt, men diamanten og guldet er intakt.", givItem: 'diamant', guldAendring: 180 }] },
            { tekst: "Skær snøren over med din kniv", kraeverItem: 'kniv', udfaldListe: [{ log: "Du klipper ubesværet snøren og hælder mønterne i din egen taske.", guldAendring: 380 }] }
        ]
    },

    'sultne_krystaller': {
        id: 'sultne_krystaller', titel: "De Skarpe Sten", biome: ['hule', 'krystal'], unik: true,
        tekst: "Små, spidse krystaller skyder lynhurtigt ud fra hulevæggen mod bevægelse. Der ligger en rustning midt på gulvet.",
        valg: [
            { tekst: "Kast faklen derind for at aflede faren", kosterItem: 'fakkel', udfaldListe: [{ log: "Varmen fra ilden får krystallerne til at trække sig tilbage, og du henter udstyret.", givItem: 'rustning', guldAendring: 250 }] },
            { tekst: "Løb ind og snup tingene i farten", udfaldListe: [
                { log: "Du er ikke hurtig nok. Flere krystaller snitter dine arme.", hpAendring: -42, naesteTrin: 'krystal_svaerd' },
                { log: "Du undviger det meste og ruller sikkert i dækning med fangsten.", hpAendring: -5, naesteTrin: 'krystal_svaerd' }
            ]},
            { tekst: "Studér deres mønster med kikkerten", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Du afkoder, at de skyder i intervaller, og går ind, mens de lader op.", naesteTrin: 'krystal_svaerd' }] }
        ]
    },

    'krystal_svaerd': {
        id: 'krystal_svaerd', titel: "Det Mørke Blad", biome: 'any', erSubTrin: true,
        tekst: "Ved siden af rustningen ligger et mørkt sværd. Klingen er dækket af rødlig rust.",
        valg: [
            { tekst: "Skrab bladet rent med skovlen", kraeverItem: 'skovl', udfaldListe: [{ log: "Du skraber det værste snavs væk og står tilbage med et glimrende våben.", givItem: 'svaerd', guldAendring: 150 }] },
            { tekst: "Tør bladet af med dine klude", kosterItem: 'klude', udfaldListe: [{ log: "Kludene tager skade af rusten, men sværdet er nu helt rent og brugbart.", givItem: 'svaerd', guldAendring: 220 }] },
            { tekst: "Tør klingen af i noget løst græs", udfaldListe: [
                { log: "Rusten smitter af på dine hænder og svider som syre.", hpAendring: -40, givItem: 'svaerd' },
                { log: "Du får børstet rusten af med forsigtighed og sikrer sværdet.", hpAendring: -2, givItem: 'svaerd', guldAendring: 200 }
            ]}
        ]
    },

    'den_blinde_moder': {
        id: 'den_blinde_moder', titel: "Dyret i Hulen", biome: ['hule', 'bjerg'], unik: true,
        tekst: "Et enormt, bjørnelignende dyr sover tungt hen over en pengepung. Et par unger leger i baggrunden.",
        valg: [
            { tekst: "Sæt en skål eliksir til ungerne", kosterItem: 'livseliksir', udfaldListe: [{ log: "Drikken får dem til at falde i en dyb søvn. Du tager diamanten uforstyrret.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "List hen og fjern pungen, mens dyret sover", udfaldListe: [
                { log: "Dyret rører på sig i søvne og skubber dig hårdt mod væggen med en pote.", hpAendring: -42, naesteTrin: 'moder_flugt' },
                { log: "Den vågner ikke. Du trækker pungen let til dig og bakker ud.", hpAendring: -5, guldAendring: 400, naesteTrin: 'moder_flugt' }
            ]},
            { tekst: "Skyd en pil i væggen for at skræmme dem", kraeverItem: 'bue', udfaldListe: [{ log: "Smældet fra pilen får dyrene til at trække sig længere ind i hulen. Du tager guldet.", guldAendring: 320 }] }
        ]
    },

    'moder_flugt': {
        id: 'moder_flugt', titel: "Trækisten", biome: 'any', erSubTrin: true,
        tekst: "I hulens indgang står en gammel trækiste med mørke metalbeslag.",
        valg: [
            { tekst: "Slå beslagene i stykker med øksen", kraeverItem: 'oekse', udfaldListe: [{ log: "Du åbner låget og finder både guld og en ægte diamant.", givItem: 'diamant', guldAendring: 180 }] },
            { tekst: "Pres låget opad med hænderne", udfaldListe: [
                { log: "Træet splintrer og giver dig skarpe flænger over hænderne.", hpAendring: -40, guldAendring: 300 },
                { log: "Kisten åbner med et knæk. En stor, glitrende diamant ligger indeni.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Spræt træet op med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Klingen skærer sig igennem toppen. Du finder en stak mønter.", guldAendring: 280 }] }
        ]
    },

    'giftkilden': {
        id: 'giftkilden', titel: "Den Mørke Væske", biome: ['hule', 'ruin'], unik: true,
        tekst: "En diamant ligger på bunden af et lille stenbassin. Bassinet er fyldt med sort, tyk væske.",
        valg: [
            { tekst: "Stik armen ned for at tage stenen", udfaldListe: [
                { log: "Væsken føles ætsende og brænder huden på din arm.", hpAendring: -42, guldAendring: 350, naesteTrin: 'kildens_bund' },
                { log: "Du tøver ikke. Væsken når ikke at gøre skade, før diamanten er oppe.", hpAendring: -5, givItem: 'diamant', guldAendring: 150, naesteTrin: 'kildens_bund' }
            ]},
            { tekst: "Brug skovlen til at vippe den op", kosterItem: 'skovl', udfaldListe: [{ log: "Skovlen ødelægges af syren, men diamanten lander oppe på fliserne.", givItem: 'diamant', guldAendring: 150 }] },
            { tekst: "Søg efter et afløb med detektoren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du finder en kontakt under gulvet, der dræner bassinet for væske.", guldAendring: 350, naesteTrin: 'kildens_bund' }] }
        ]
    },

    'kildens_bund': {
        id: 'kildens_bund', titel: "Metal på Bunden", biome: 'any', erSubTrin: true,
        tekst: "Du kan nu se, at der ligger et skjold og et sværd helt nede på bunden af bassinet.",
        valg: [
            { tekst: "Forsøg at få det op med hænderne", udfaldListe: [
                { log: "Resterne af væsken svider dine hænder, mens du bakser med udstyret.", hpAendring: -42, givItem: 'rustning' },
                { log: "Du griber fat i stroppen og rykker det sikkert op.", hpAendring: -2, givItem: 'rustning', guldAendring: 350 }
            ]},
            { tekst: "Brug dit tøj som en tyk handske", kosterItem: 'flot_toej', udfaldListe: [{ log: "Det beskytter huden helt. Du får fat i et sværd og mønterne.", givItem: 'svaerd', guldAendring: 250 }] },
            { tekst: "Brug staven som en krog", kraeverItem: 'stav', udfaldListe: [{ log: "Du lister sværdet op med staven uden at røre væsken overhovedet.", givItem: 'svaerd', guldAendring: 180 }] }
        ]
    },

    'stenens_tyngde': {
        id: 'stenens_tyngde', titel: "Stenen", biome: ['hule', 'bjerg'], unik: true,
        tekst: "En massiv klippeblok er faldet ned og spærrer åbningen til en kælder.",
        valg: [
            { tekst: "Skub til stenen med alle dine kræfter", udfaldListe: [
                { log: "Den er for tung. Du anstrenger ryggen voldsomt og giver op.", hpAendring: -42, naesteTrin: 'krigerens_arv' },
                { log: "Den rykker sig lige akkurat nok til, at du kan klemme dig ind.", hpAendring: -5, givItem: 'metaldetektor', guldAendring: 300, naesteTrin: 'krigerens_arv' }
            ]},
            { tekst: "Brug sværdet som løftestang", kosterItem: 'svaerd', udfaldListe: [{ log: "Klingen brækker, men den giver et afgørende ryk til stenen.", givItem: 'metaldetektor', guldAendring: 220 }] },
            { tekst: "Brug øksen til at hugge hjørnerne af klippen", kraeverItem: 'oekse', udfaldListe: [{ log: "Du skaber nok plads til at nå ind og tømme kælderen for guld.", guldAendring: 320 }] }
        ]
    },

    'krigerens_arv': {
        id: 'krigerens_arv', titel: "Det Blå Lys", biome: 'any', erSubTrin: true,
        tekst: "Kælderen oplyses af en skinnende sten med et unaturligt blåt skær.",
        valg: [
            { tekst: "Pak stenen ind i dine klude for at dæmpe lyset", kosterItem: 'klude', udfaldListe: [{ log: "Stoffet fjerner lysets farlige effekt. Den blå diamant heler dine sår.", hpAendring: 180, givItem: 'diamant' }] },
            { tekst: "Saml den op på trods af lyset", udfaldListe: [
                { log: "Lyset føles brændende mod din hud og gør dig udmattet.", hpAendring: -40, guldAendring: 350 },
                { log: "Du tager diamanten uden at mærke det mindste ubehag.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Scan den med metaldetektoren først", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Detektoren bekræfter, at den er sikker. Du tømmer roligt rummet.", guldAendring: 350 }] }
        ]
    },

    'den_druknede_galej': {
        id: 'den_druknede_galej', titel: "I Vandkanten", biome: ['hav'], unik: true,
        tekst: "En tung skibskiste sidder fast i tang og reb på lavt vand. Farverige brandmænd svømmer omkring den.",
        valg: [
            { tekst: "Skær rebet over med din kniv under vandet", kraeverItem: 'kniv', udfaldListe: [{ log: "Brandmændene brænder din underarm lidt, mens du frigør kisten.", hpAendring: -12, naesteTrin: 'galejens_vraggods' }] },
            { tekst: "Tag rustningen på mod brandmændene", kosterItem: 'rustning', udfaldListe: [{ log: "Saltvandet ødelægger metallet, men kisten bliver bjærget i land.", guldAendring: 400 }] },
            { tekst: "Ryk kisten fri med ren håndkraft oppe fra land", udfaldListe: [
                { log: "Snorene strammer sig fast, og du falder halvt i vandet.", hpAendring: -42, naesteTrin: 'galejens_vraggods' },
                { log: "Tovværket mørner, og du rykker kisten helt op på stranden.", hpAendring: -5, naesteTrin: 'galejens_vraggods' }
            ]}
        ]
    },

    'galejens_vraggods': {
        id: 'galejens_vraggods', titel: "Våd Skat", biome: 'any', erSubTrin: true,
        tekst: "Kisten åbner sig. Den er halvt fuld af havvand og sølv.",
        valg: [
            { tekst: "Fisk de store sten op med spidsen af sværdet", kraeverItem: 'svaerd', udfaldListe: [{ log: "Klingen får fat under en af dem. Det er en massiv diamant.", givItem: 'diamant', guldAendring: 180 }] },
            { tekst: "Grab alt indholdet op med hænderne", udfaldListe: [
                { log: "Vandet er koldt, og kanterne er ubehagelige. Det gør ondt at samle.", hpAendring: -42, guldAendring: 350 },
                { log: "Du tager det hele uden at blinke og finder en fin diamant.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Drik eliksir for varme og ro", kosterItem: 'livseliksir', udfaldListe: [{ log: "Drikken varmer dig op, så du kan rode jernbeslagene igennem for en uvurderlig diamant.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'det_flydende_alter': {
        id: 'det_flydende_alter', titel: "Flåden", biome: ['hav'], unik: true,
        tekst: "En gammel tømmerflåde vugger i vandet. Et lig ligger ovenpå og klamrer sig til en stor muslingeskal.",
        valg: [
            { tekst: "Hop ud på flåden for at tage skallen", udfaldListe: [
                { log: "Brædderne er dækket af glatte alger, og du slår hoften mod kanten.", hpAendring: -42, naesteTrin: 'muslingens_hemmelighed' },
                { log: "Du lander blødt. Liget er let at skubbe væk, og muslingen er din.", hpAendring: -5, naesteTrin: 'muslingens_hemmelighed' }
            ]},
            { tekst: "Kast 200 mønter ud i vandet som betaling", puljeVaerdi: 200, udfaldListe: [{ log: "Vandet slår ind over kanten, og muslingen åbner sig forsigtigt. En diamant kommer til syne.", givItem: 'diamant', guldAendring: 50 }] },
            { tekst: "Træk flåden ind mod kysten med staven", kraeverItem: 'stav', udfaldListe: [{ log: "Staven lader dig hive flåden helt ind på land, så du undgår vandet.", naesteTrin: 'muslingens_hemmelighed' }] }
        ]
    },

    'muslingens_hemmelighed': {
        id: 'muslingens_hemmelighed', titel: "Kalkens Beskyttelse", biome: 'any', erSubTrin: true,
        tekst: "Muslingen er nærmest limet sammen af gammelt kalk.",
        valg: [
            { tekst: "Bryd skallen op med fingrene", udfaldListe: [
                { log: "Kanterne er sylskarpe og giver dig nogle meget dybe flænger.", hpAendring: -42, guldAendring: 300 },
                { log: "Hængslet er mørt, og skallen knækker over. Diamanten triller frem.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug skovlen til at banke den op", kosterItem: 'skovl', udfaldListe: [{ log: "Slaget ødelægger spaden, men knuser kalken og frigør diamanten.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Skær roligt ind i sprækken med din kniv", kraeverItem: 'kniv', udfaldListe: [{ log: "Kniven åbner den let og ubeskadiget som en fin æske.", givItem: 'flot_toej', guldAendring: 180 }] }
        ]
    },

    'campfire': {
        id: 'campfire', titel: "Fremmed Lejr", biome: ['eng', 'skov', 'mark', 'bjerg', 'hoejland'], billede: '/events/ev_campfire.webp', unik: false,
        tekst: "Et par fremmede sidder omkring et lille bål. De stirrer vagtsomt på dig.",
        valg: [
            { tekst: "Del din eliksir med den sårede i lejren", kosterItem: 'livseliksir', udfaldListe: [{ log: "Eliksiren virker fantastisk. Lejren takker dig med en diamant og guld, og du får selv varmen.", hpAendring: 180, maxHpAendring: 15, givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Bed dem aggressivt om at forsvinde", udfaldListe: [
                { log: "De rejser sig samlet og overmander dig med slag, før de løber deres vej.", hpAendring: -37, guldAendring: -60 },
                { log: "De pakker skræmt deres ting, men glemmer en diamant og noget guld i skyndingen.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Køb adgang til lejrens sikkerhed for natten med 30 mønter", puljeVaerdi: 30, effekt: () => {
                const overlev = Math.random();
                if (overlev < 0.70) {
                    return { logBesked: "Du sover trygt ved ilden og vågner helt udhvilet.", hpOp: 100 };
                } else {
                    spilTilstand.nuvaerendeEnergi = 0;
                    return { logBesked: "Det var en fælde. Du vågner alene, forfrossen og med en sløret bevidsthed.", hpNed: 20 };
                }
            }}
        ]
    },

    'pyramidespillet': {
        id: 'pyramidespillet', titel: "Svindleren", biome: ['by', 'marked'], unik: true,
        tekst: "En højtråbende mand står på en trækasse og forsøger at sælge dig et investeringsbevis.",
        valg: [
            { tekst: "Skub ham ned af kassen med din stav", kraeverItem: 'stav', udfaldListe: [{ log: "Han falder baglæns. Du rydder hans kasse for fortjeneste, før han kommer på benene.", guldAendring: 280 }] },
            { tekst: "Vælt kassen og træk dit våben", udfaldListe: [
                { log: "Hans folk træder ud fra mørket og tildeler dig en hård lektion, før de flygter.", hpAendring: -42, naesteTrin: 'pyramide_plyndring' },
                { log: "Folk griner af ham. Du lægger beslag på hans efterladte værdier.", hpAendring: -5, naesteTrin: 'pyramide_plyndring' }
            ]},
            { tekst: "Spil med og læg 200 mønter for beviset", puljeVaerdi: 200, udfaldListe: [{ log: "Han virker chokeret over, at nogen betaler. Han rækker dig en ægte diamant som tak.", givItem: 'diamant' }] }
        ]
    },

    'pyramide_plyndring': {
        id: 'pyramide_plyndring', titel: "Svindlerens Kasse", biome: 'any', erSubTrin: true,
        tekst: "Svindlerens trækasse står lukket og forladt. Der er en solid lås på forsiden.",
        valg: [
            { tekst: "Slå beslaget i stykker med en sten", udfaldListe: [
                { log: "Jernet er sejt. Du får buler på fingrene, før kassen endelig åbnes.", hpAendring: -40, givItem: 'diamant', guldAendring: 180 },
                { log: "Den var ikke engang låst! Du tager frit for dig af guldet.", hpAendring: -2, guldAendring: 400 }
            ]},
            { tekst: "Brug øksen til at splitte den ad", kraeverItem: 'oekse', udfaldListe: [{ log: "Øksen gør kort proces. Kassen indeholder mange af folks tabte mønter.", guldAendring: 400 }] },
            { tekst: "Brug detektoren til at finde udløseren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du åbner den elegant med et skjult tryk og finder både en sabel og lidt valuta.", givItem: 'sabel', guldAendring: 250 }] }
        ]
    },

    'arkitektens_storhedsvanvid': {
        id: 'arkitektens_storhedsvanvid', titel: "Den Faldne Søjle", biome: ['ruin', 'eng'], unik: true,
        tekst: "En desperat mand kæmper for at forhindre en marmorsøjle i at vælte. Den er på vej til at knuse hans taske.",
        valg: [
            { tekst: "Råb til ham at han skal slippe den", udfaldListe: [
                { log: "Søjlen rammer jorden tungt, og splinter flyver op og rammer dig, mens du henter tasken.", hpAendring: -40, guldAendring: 250 },
                { log: "Den ruller sikkert til side i græsset. Han jamrer, mens du stikker af med tasken.", hpAendring: -2, guldAendring: 400 }
            ]},
            { tekst: "Brug din skovl som ekstra støtte til stenen", kosterItem: 'skovl', udfaldListe: [{ log: "Skovlen holder længe nok til, at du kan trække tasken og en diamant ud, inden skaftet brækker.", guldAendring: 180, givItem: 'diamant' }] },
            { tekst: "Sigt med buen for at få ham til at vige", kraeverItem: 'bue', udfaldListe: [{ log: "Truslen virker. Han løber sin vej, og du kan overtage hans efterladte ting.", guldAendring: 200 }] }
        ]
    },

    'det_gyldne_ego': {
        id: 'det_gyldne_ego', titel: "Statuen", biome: ['ruin', 'bjerg'], unik: true,
        tekst: "En mekanisk guldstatue står foran en port. Den brummer og bevæger armene kluntet.",
        valg: [
            { tekst: "Brug detektoren til at scanne den for fejl", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Maskinen finder en skjult luge i statuens sokkel. Der ligger en sabel og penge.", givItem: 'sabel', guldAendring: 300 }] },
            { tekst: "Tving porten bag den op med hænderne", udfaldListe: [
                { log: "Statuens arm svirper ud og slår dig over skulderen, mens du presser på døren.", hpAendring: -42, naesteTrin: 'statuens_hjerte' },
                { log: "Du er hurtigere end maskinen. Porten giver efter, før den når at ramme dig.", hpAendring: -5, naesteTrin: 'statuens_hjerte' }
            ]},
            { tekst: "Stop tandhjulene med dit fine tøj", kosterItem: 'flot_toej', udfaldListe: [{ log: "Stoffet blokerer mekanismen helt. Den åbner en lille skuffe med en diamant.", givItem: 'diamant', guldAendring: 200 }] }
        ]
    },

    'statuens_hjerte': {
        id: 'statuens_hjerte', titel: "Maskinrummet", biome: 'any', erSubTrin: true,
        tekst: "Bag døren kører store, smurte tandhjul omkring et åbent skrin med guld.",
        valg: [
            { tekst: "Stik armen ind og snup guldet", udfaldListe: [
                { log: "Tandhjulene napper fast i din ærme og trækker til, før du river dig løs.", hpAendring: -42, givItem: 'svaerd' },
                { log: "Du har perfekt timing og trækker et sværd og pengene fri.", hpAendring: -5, givItem: 'svaerd', guldAendring: 350 }
            ]},
            { tekst: "Lås hjulene fast med din rustning", kosterItem: 'rustning', udfaldListe: [{ log: "Rustningen presses i stykker, men maskinen stopper. Du tager den flotteste diamant.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Skub mønterne ud med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Klingen skubbes roligt forbi de kørende dele og skraber guldet ud til dig.", guldAendring: 320 }] }
        ]
    },

    'monopolets_fald': {
        id: 'monopolets_fald', titel: "Apotekeren", biome: ['mark', 'eng'], unik: true,
        tekst: "En mand er ved at synke ned i kviksandet. Han knuger en mørk trækasse mod brystet.",
        valg: [
            { tekst: "Stik kvisten ud for at lede ham", kraeverItem: 'soegekvist', udfaldListe: [{ log: "Kvisten viser vejen ud. Han slipper kassen i mudderet, da han redder sig selv.", guldAendring: 380, naesteTrin: 'monopol_kisten' }] },
            { tekst: "Kast 200 mønter ud til ham i bytte for kassen", puljeVaerdi: 200, udfaldListe: [{ log: "Han bytter omgående. Han giver slip på det tunge træ, tager mønterne og kaster en eliksir til dig.", givItem: 'livseliksir', naesteTrin: 'monopol_kisten' }] },
            { tekst: "Træk kassen og manden op med magt", udfaldListe: [
                { log: "Vægten rykker ubehageligt i dine muskler, men kassen kommer fri.", hpAendring: -42, naesteTrin: 'monopol_kisten' },
                { log: "Du har styrken. Han kastes sikkert i land, og du tager guld i bytte.", hpAendring: -5, givItem: 'livseliksir', guldAendring: 250, naesteTrin: 'monopol_kisten' }
            ]}
        ]
    },

    'monopol_kisten': {
        id: 'monopol_kisten', titel: "Trækassen", biome: 'any', erSubTrin: true,
        tekst: "Kassen ligger smurt ind i mudder. Låsen ser avanceret ud.",
        valg: [
            { tekst: "Varm låsen med faklen", kosterItem: 'fakkel', udfaldListe: [{ log: "Små dele i mekanismen smelter sammen. Du kan lige præcis lirke en diamant ud.", givItem: 'diamant', guldAendring: 220 }] },
            { tekst: "Spark kassen op", udfaldListe: [
                { log: "Kassen udsender en støvsky, der svider meget voldsomt i lungerne et øjeblik.", hpAendring: -42, guldAendring: 280 },
                { log: "Låget flyver op uden dramatik. Du tager den flotte diamant indeni.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Dirk fjedrene i låsen med din kniv", kraeverItem: 'kniv', udfaldListe: [{ log: "Du arbejder forsigtigt klingen ind og tvinger hasperne op.", hpAendring: -10, givItem: 'diamant', guldAendring: 180 }] }
        ]
    },

    'koedlabyrinten': {
        id: 'koedlabyrinten', titel: "Den Underlige Dør", biome: ['skov', 'blodskov'], unik: true,
        tekst: "Døråbningen ind til grotten pulserer ligesom hud. Indgangen virker blød.",
        valg: [
            { tekst: "Løb ind", udfaldListe: [
                { log: "Siderne klapper sammen om dig og giver dig et ubehageligt tryk, før du slipper ind.", hpAendring: -42, naesteTrin: 'labyrint_moerke' },
                { log: "Du smutter forbi på det helt rigtige tidspunkt. Vejen er sikker.", hpAendring: -2, naesteTrin: 'labyrint_moerke' }
            ]},
            { tekst: "Brug faklen til at holde åbningen tilbage", kosterItem: 'fakkel', udfaldListe: [{ log: "Varmen får muskulaturen til at rykke sig skræmt tilbage. Du lister roligt ind.", naesteTrin: 'labyrint_lys' }] },
            { tekst: "Klem skovlen fast i døråbningen", kraeverItem: 'skovl', udfaldListe: [{ log: "Skaftet presser huden ud, så du kan komme ind, før træet knækker bag dig.", naesteTrin: 'labyrint_lys' }] }
        ]
    },

    'labyrint_lys': {
        id: 'labyrint_lys', titel: "Det Røde Rum", biome: 'any', erSubTrin: true,
        tekst: "Korridoren deler sig her. Der hænger rødlige tråde ned fra loftet over en sprække i gulvet.",
        valg: [
            { tekst: "Scan trådene med metaldetektoren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Maskinen afslører et skjult rum gemt inde i væggen bag trådene.", guldAendring: 400 }] },
            { tekst: "Skær trådene væk med sablen", kosterItem: 'sabel', udfaldListe: [{ log: "Bladet ætses i stykker af trådene, men du skaber fri passage fremad.", naesteTrin: 'labyrint_hjerte' }] },
            { tekst: "Hop over sprækken i gulvet", udfaldListe: [
                { log: "Du fejlvurderer afstanden lidt og vrider anklen grimt under landingen.", hpAendring: -42, naesteTrin: 'labyrint_hjerte' },
                { log: "Du klarer springet i en blød, perfekt bue.", hpAendring: -5, naesteTrin: 'labyrint_hjerte' }
            ]}
        ]
    },

    'labyrint_moerke': {
        id: 'labyrint_moerke', titel: "Det Trange Mørke", biome: 'any', erSubTrin: true,
        tekst: "Væggene føles ubehageligt tætte her. Gulvet mærkes sumpet og blødt.",
        valg: [
            { tekst: "Brug detektoren til at scanne sumpen i blinde", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Den piber nede ved dine fødder. Du finder en kasse med en diamant.", givItem: 'diamant', guldAendring: 150, naesteTrin: 'labyrint_skat' }] },
            { tekst: "Mast dig hurtigt frem gennem mørket", udfaldListe: [
                { log: "Du banker hovedet hårdt ind i noget solidt over dig.", hpAendring: -42, naesteTrin: 'labyrint_skat' },
                { log: "Du presser dig sikkert frem og finder ud af, at sumpen flyder med guld.", hpAendring: -5, guldAendring: 350, naesteTrin: 'labyrint_skat' }
            ]},
            { tekst: "Gå med sværdet forrest som en blindestok", kraeverItem: 'svaerd', udfaldListe: [{ log: "Klingen tager af for væggene. Du navigerer sikkert uden at støde ind i faren.", guldAendring: 300, naesteTrin: 'labyrint_skat' }] }
        ]
    },

    'labyrint_hjerte': {
        id: 'labyrint_hjerte', titel: "Lys i Mørket", biome: 'any', erSubTrin: true,
        tekst: "En lysende krystal svæver svagt i luften, holdt fast af små snore.",
        valg: [
            { tekst: "Skær krystallen fri med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Snittet frigiver en bølge af energi, som fylder dig med ny udholdenhed.", hpAendring: 180, maxHpAendring: 15, givItem: 'diamant' }] },
            { tekst: "Træk den ned med hænderne", udfaldListe: [
                { log: "Du forbrænder huden på krystallens varme undervejs.", hpAendring: -42, guldAendring: 350 },
                { log: "Den slipper overraskende let. En mængde småpenge rasler med ned fra loftet.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Læg rustningen omkring krystallen og træk", kosterItem: 'rustning', udfaldListe: [{ log: "Lyset æder metallet, men diamanten indeni lander ubeskadiget i dine hænder.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'labyrint_skat': {
        id: 'labyrint_skat', titel: "Enden på Ruten", biome: 'any', erSubTrin: true,
        tekst: "Grotten ender her. Et stykke udstyr ligger forladt på gulvet, men det stinker af forrådnelse.",
        valg: [
            { tekst: "Skynd dig at samle det op", udfaldListe: [
                { log: "Stanken overvælder dig i et sekund, og du slår albuen hårdt mod væggen i din hast.", hpAendring: -40, guldAendring: 350 },
                { log: "Du trækker vejret overfladisk, snapper sværdet og guldet, og løber ud.", hpAendring: -5, givItem: 'svaerd', guldAendring: 350 }
            ]},
            { tekst: "Tør udstyret af med dine klude før det ryger i tasken", kosterItem: 'flot_toej', udfaldListe: [{ log: "Tøjet tager stanken. Du pakker våbnet og pengene ned uden bekymring.", givItem: 'svaerd', guldAendring: 250 }] },
            { tekst: "Brug buen til at trække sværdet til dig fra afstand", kraeverItem: 'bue', udfaldListe: [{ log: "Du holder afstand til lugten og skubber byttet ud i den friske luft.", givItem: 'svaerd', guldAendring: 300 }] }
        ]
    },

    'tvillingernes_dom': {
        id: 'tvillingernes_dom', titel: "De To Ansigter", biome: ['ruin', 'bjerg'], unik: true,
        tekst: "To stenfigurer balancerer et stort bræt af træ som en vægt. På brættet står en skål.",
        valg: [
            { tekst: "Læg 150 guldstykker i skålen", puljeVaerdi: 150, udfaldListe: [{ log: "Brættet vipper i balance. Gulvet under dig giver sig og åbner trappen ned til en kælder.", naesteTrin: 'tvilling_velsignelse' }] },
            { tekst: "Brug øksen på stenfiguren", kraeverItem: 'oekse', udfaldListe: [{ log: "Soklen knuses. Hele mekanismen falder fra hinanden og afslører kælderen nedenunder.", naesteTrin: 'tvilling_vold' }] },
            { tekst: "Skub til brættet for at ødelægge balancen", udfaldListe: [
                { log: "Figurerne udløser en fælde, og en sten falder ned i ryggen på dig.", hpAendring: -42, naesteTrin: 'tvilling_vold' },
                { log: "Brættet knækker over, og spærrer for fælden. Vejen er åben.", hpAendring: -5, naesteTrin: 'tvilling_vold' }
            ]}
        ]
    },

    'tvilling_velsignelse': {
        id: 'tvilling_velsignelse', titel: "Lys og Varme", biome: 'any', erSubTrin: true,
        tekst: "Der står to stenborde i kælderen. Det ene lyser og udsender behagelig varme, det andet spreder frysende kulde.",
        valg: [
            { tekst: "Undersøg varmekilden med detektoren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Detektoren bekræfter varmens gode energi. Du rører ved bordet og mærker kroppen hele.", hpAendring: 120, guldAendring: 250 }] },
            { tekst: "Gå direkte hen til det kolde stenbord", udfaldListe: [
                { log: "Kulden går lynhurtigt i knoglerne og får dine fingre til at smerte.", hpAendring: -42, naesteTrin: 'tvilling_sort' },
                { log: "Du tager et par dybe indåndinger og lader dig ikke påvirke af kulden.", hpAendring: -5, naesteTrin: 'tvilling_sort' }
            ]},
            { tekst: "Læg dit sværd ned i det varme lys", kosterItem: 'svaerd', udfaldListe: [{ log: "Våbnet absorberes, men lyset strømmer i stedet ind i dig. Du får det markant bedre.", hpAendring: 180, maxHpAendring: 15, givItem: 'diamant', guldAendring: 200 }] }
        ]
    },

    'tvilling_vold': {
        id: 'tvilling_vold', titel: "Murbrokker", biome: 'any', erSubTrin: true,
        tekst: "Det ødelagte monument har efterladt stien ned dækket af murbrokker og støv.",
        valg: [
            { tekst: "Brug skovlen til at rydde vejen", kraeverItem: 'skovl', udfaldListe: [{ log: "Du skovler nemt brokkerne til side og samler valuta op undervejs.", guldAendring: 320, naesteTrin: 'tvilling_fald' }] },
            { tekst: "Dæk dit hoved med tøjet, mens du går ned", kosterItem: 'flot_toej', udfaldListe: [{ log: "Stoffet beskytter dig mod faldende grus fra taget, og du ser en diamant i støvet.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Klatr forsigtigt ned uden hjælpemidler", udfaldListe: [
                { log: "Du vrider om på en løs sten og slår armen hårdt mod væggen.", hpAendring: -42, guldAendring: 300 },
                { log: "Du har god balance og når sikker grund i bunden uden uheld.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

    'tvilling_sort': {
        id: 'tvilling_sort', titel: "Det Kolde Alter", biome: 'any', erSubTrin: true,
        tekst: "Det sorte alter i kulden brummer. Der er et hul i toppen, hvor en mørk røg siver ud.",
        valg: [
            { tekst: "Stik hånden ind i hullet", udfaldListe: [
                { log: "Røgen brænder i huden. Du får fingrene i en tung stak mønter, men det gør ondt.", hpAendring: -42, guldAendring: 400 },
                { log: "Mekanismen indeni udløses med et klik. En ædelsten falder lige ud i hånden på dig.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Klem rustningen ned i hullet for at blokere det", kosterItem: 'rustning', udfaldListe: [{ log: "Vægten får en hemmelig luge til at glide op og afsløre en detektor.", givItem: 'metaldetektor', guldAendring: 400 }] },
            { tekst: "Stik hullet op med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Knivens klinge udløser falsk bund. En pæn skat lander for dine fødder.", guldAendring: 350 }] }
        ]
    },

    'tvilling_fald': {
        id: 'tvilling_fald', titel: "Afslutningen på Stien", biome: 'any', erSubTrin: true,
        tekst: "Stien ender blindt ved et brat fald ned til kældergulvet.",
        valg: [
            { tekst: "Brug kniven som støtte for at klatre", kraeverItem: 'kniv', udfaldListe: [{ log: "Klingen giver dig sikkert fodfæste, og du klatrer problemfrit det sidste stykke.", guldAendring: 320 }] },
            { tekst: "Lad dig falde resten af vejen", udfaldListe: [
                { log: "Det var længere nede end forventet. Landingen sender et chok gennem dit ben.", hpAendring: -42, guldAendring: 350 },
                { log: "Du ruller rundt i landingen og absorberer hele stødet som ingenting.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Sænk dig langsomt ned med staven", kosterItem: 'stav', udfaldListe: [{ log: "Staven knækker midtpå, men den gør faldet blødt. Der ligger udstyr hernede.", givItem: 'skovl', guldAendring: 250 }] }
        ]
    },

    'taagens_lunge': {
        id: 'taagens_lunge', titel: "Messingrøret", biome: ['bjerg', 'ruin'], unik: true,
        tekst: "Et rør stikker ud af klippevæggen. Det skyder kogende damp ud i konstante intervaller.",
        valg: [
            { tekst: "Hold vejret og ræk hånden ind i røret", udfaldListe: [
                { log: "Dampen er ubehageligt tæt og svider over armen og brystet.", hpAendring: -42, guldAendring: 380, naesteTrin: 'taage_vision' },
                { log: "Du timer det perfekt. Dampen rører dig ikke, og du fisker en diamant ud.", hpAendring: -5, givItem: 'diamant', guldAendring: 250, naesteTrin: 'taage_vision' }
            ]},
            { tekst: "Køl røret ned med din eliksir", kosterItem: 'livseliksir', udfaldListe: [{ log: "Væsken stopper dampen fra at koge over, og du tager sikkert en diamant fra åbningen.", givItem: 'diamant', guldAendring: 250, naesteTrin: 'taage_vision' }] },
            { tekst: "Undersøg maskineriet bagved med detektoren", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du afkoder mekanismen og lukker ubesværet for ventilen til dampen.", guldAendring: 350, naesteTrin: 'taage_vision' }] }
        ]
    },

    'taage_vision': {
        id: 'taage_vision', titel: "Skyggerne Lettede", biome: 'any', erSubTrin: true,
        tekst: "Dampen er væk nu. På jorden under røret ligger resterne af et skelet iført en tyk læderdragt.",
        valg: [
            { tekst: "Kig på liget gennem din kikkert", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Du ser, at lommen har en skjult fjederfælde. Du navigerer udenom og tager detektoren.", givItem: 'metaldetektor', guldAendring: 200 }] },
            { tekst: "Spræt tøjet op med øksen", kraeverItem: 'oekse', udfaldListe: [{ log: "Du skærer læderet åbent og finder nemt alle gemte værdier i jakken.", guldAendring: 350 }] },
            { tekst: "Ledsag skelettet med hænderne", udfaldListe: [
                { log: "Du kommer til at røre en mekanisme i lommen, der snitter dig.", hpAendring: -42, guldAendring: 250 },
                { log: "Du mærker forsigtigt lommerne efter og rager både maskine og guld til dig.", hpAendring: -5, givItem: 'metaldetektor', guldAendring: 380 }
            ]}
        ]
    },

    'taagedrikkeren': {
        id: 'taagedrikkeren', titel: "Mand med Krystaller", biome: ['mark', 'blodskov'], unik: true,
        tekst: "En mand ligger og puster overfladisk. Lilla krystaller vokser ud af huden på hans bryst.",
        valg: [
            { tekst: "Vip krystallerne af ham med sværdet", kraeverItem: 'svaerd', udfaldListe: [{ log: "Sværdet lader dig fjerne den største krystal med et rent snit. Den er overraskende værdifuld.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Bræk krystallerne af med fingrene", udfaldListe: [
                { log: "De sidder fast under huden. Et snit river ham til blods, og han slår skræmt ud efter dig.", hpAendring: -42, guldAendring: 300 },
                { log: "Du brækker dem af med et fast greb. Han trækker vejret friere, og stenen ligner en diamant.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Giv ham din eliksir", kosterItem: 'livseliksir', udfaldListe: [{ log: "Væsken opløser væksten på få sekunder. Du samler resterne, der er størknet som en diamant.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'den_faldne_kuppel': {
        id: 'den_faldne_kuppel', titel: "Glaskuplen", biome: ['ritual', 'by'], unik: true,
        tekst: "En solid glaskuppel på en sokkel skærmer et lysende objekt. Det udstråler en mærkbar hede.",
        valg: [
            { tekst: "Læg 150 mønter i soklens rille", puljeVaerdi: 150, udfaldListe: [{ log: "Mekanismen accepterer mønterne og slukker varmen. Lyset dæmpes, og rummet indeni åbner sig.", hpAendring: 180, givItem: 'rustning', guldAendring: 250 }] },
            { tekst: "Smadr kuplen med et slag", udfaldListe: [
                { log: "Glasset er ekstremt tykt. Det skærer sig dybt ind i dit kno før det giver efter.", hpAendring: -42, guldAendring: 350 },
                { log: "Du finder kuplens svage punkt og smadrer glasset med et præcist brag.", hpAendring: -5, givItem: 'rustning', guldAendring: 400 }
            ]},
            { tekst: "Test fundamentet med din detektor", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du finder en lille skjult kontakt på bagsiden, der åbner glasset stille og roligt.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'alkymistens_logbog': {
        id: 'alkymistens_logbog', titel: "Det Forladte Telt", biome: ['skov', 'eng'], unik: true,
        tekst: "Du finder et forladt telt i vildnisset. Det flyder med utætte flasker, der udsender ubehagelige gasser.",
        valg: [
            { tekst: "Brænd gassen væk med din fakkel", kosterItem: 'fakkel', udfaldListe: [{ log: "Faklen fanger dampen, og luften brænder rent med et lille smæld. En luge til en kælder dukker op.", guldAendring: 350, naesteTrin: 'alkymistens_kaelder' }] },
            { tekst: "Led teltet igennem, mens du holder vejret", udfaldListe: [
                { log: "Kemikalierne trænger alligevel ind i øjnene og halsen og tager din styrke.", hpAendring: -42, guldAendring: 250, naesteTrin: 'alkymistens_kaelder' },
                { log: "Du lukker totalt af for indåndingen og roder dig vej igennem rodet uden at blinke.", hpAendring: -5, givItem: 'diamant', guldAendring: 250, naesteTrin: 'alkymistens_kaelder' }
            ]},
            { tekst: "Kast skovlfulde af jord ind over flaskerne", kraeverItem: 'skovl', udfaldListe: [{ log: "Jorden begraver udslippet fuldstændig. Du kan nu frit afsøge teltets bund.", guldAendring: 350, naesteTrin: 'alkymistens_kaelder' }] }
        ]
    },

    'alkymistens_kaelder': {
        id: 'alkymistens_kaelder', titel: "Olie i Kælderen", biome: 'any', erSubTrin: true,
        tekst: "Under en gulvluge finder du en brønd med tyk, mørk olie. Et elektronisk apparat blinker helt nede i bunden.",
        valg: [
            { tekst: "Brug din kniv til at skubbe det tættere på kanten", kraeverItem: 'kniv', udfaldListe: [{ log: "Klingen får krog i apparatet, og du trækker både en detektor og guld op.", givItem: 'metaldetektor', guldAendring: 280 }] },
            { tekst: "Dyp hænderne og hent det", udfaldListe: [
                { log: "Olien ætser huden på underarmen i det sekund, du mærker efter.", hpAendring: -42, givItem: 'metaldetektor' },
                { log: "Du dykker hurtigt og er ikke i kontakt med olien længe nok til, at det skader dig.", hpAendring: -5, givItem: 'metaldetektor', guldAendring: 380 }
            ]},
            { tekst: "Dæk din arm med dine klude for beskyttelse", kosterItem: 'klude', udfaldListe: [{ log: "Kludene tager skraldet for dig. Apparatet er reddet.", hpAendring: 200, givItem: 'metaldetektor', guldAendring: 250 }] }
        ]
    },

    'galgens_bytte': {
        id: 'galgens_bytte', titel: "Buret Over Kløften", biome: ['bjerg', 'ruin'], unik: true,
        tekst: "Et solidt jernbur gynger over en bred afgrund i blæsten. Der blinker noget værdifuldt inde i det.",
        valg: [
            { tekst: "Tag springet ud til buret", udfaldListe: [
                { log: "Du lander hårdt mod tremmerne og slår knæet, men du hænger fast.", hpAendring: -42, guldAendring: 300, naesteTrin: 'buret_svajer' },
                { log: "Det er et let spring, og du klamrer dig stærkt fast i metallet.", hpAendring: -5, guldAendring: 400, naesteTrin: 'buret_svajer' }
            ]},
            { tekst: "Skyd låsen i stykker fra sikker afstand", kraeverItem: 'bue', udfaldListe: [{ log: "Pilen smadrer burets lille hasp, og du venter til vinden svinger buret ind over jorden.", guldAendring: 380, naesteTrin: 'buret_svajer' }] },
            { tekst: "Hold detektoren ud for at finde en krog", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du finder burets svageste hængsel og trækker det hele ind med ro.", givItem: 'diamant', guldAendring: 250, naesteTrin: 'buret_svajer' }] }
        ]
    },

    'buret_svajer': {
        id: 'buret_svajer', titel: "Tyngden", biome: 'any', erSubTrin: true,
        tekst: "Buret svinger nu ind over fast grund. Det er nemt at nå indholdet nu.",
        valg: [
            { tekst: "Brug din stav til at lirke mere ud af mørket", kosterItem: 'stav', udfaldListe: [{ log: "Staven trykker mod metallet og brækker, men et par klude rasler ud til dig.", givItem: 'flot_toej', guldAendring: 180 }] },
            { tekst: "Skær en større åbning i bunden med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Kniven sprætter træbunden op. En god rustning dumper ned i dit skød.", givItem: 'rustning', guldAendring: 280 }] },
            { tekst: "Grib tingene hurtigt under bevægelsen", udfaldListe: [
                { log: "Buret svinger tilbage, da du griber, og du klemmer hånden i metallet.", hpAendring: -40, guldAendring: 400 },
                { log: "Du fisker ædelstenen og guldet elegant ud midt i luftturen.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

    'edderkoppens_skat': {
        id: 'edderkoppens_skat', titel: "Grønt Spind", biome: ['skov', 'blodskov'], unik: true,
        tekst: "Et mærkeligt, grønt spindelvæv strækker sig ud over skovbunden og lugter syrligt.",
        valg: [
            { tekst: "Hak spindet over med sablen", kraeverItem: 'sabel', udfaldListe: [{ log: "Klingen skærer problemfrit trådene, så du får let adgang til en metaldetektor under nettet.", givItem: 'metaldetektor', guldAendring: 300 }] },
            { tekst: "Riv trådene væk med næverne", udfaldListe: [
                { log: "Spindet sætter sig fast i huden og brænder som åbne sår.", hpAendring: -42, guldAendring: 350 },
                { log: "Du river det hurtigt over i bundter uden at mærke noget på huden.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug faklen til at brænde nettet væk", kosterItem: 'fakkel', udfaldListe: [{ log: "Ilden æder spindet på et sekund og skaber en sikker bane frem til genstandene.", givItem: 'metaldetektor', guldAendring: 250 }] }
        ]
    },

    'krusenes_mester': {
        id: 'krusenes_mester', titel: "Gadespillet", biome: ['by', 'marked'], unik: false,
        tekst: "En gøgler flytter rundt på tre trækrus over en bordplade. 'Hvor ligger perlen?' spørger han smilende.",
        valg: [
            { tekst: "Vend bordet, snup guldet og stik af", udfaldListe: [
                { log: "Han slår ud efter dig og rammer dig over kæben, mens han råber om vagter.", hpAendring: -40, guldAendring: 150 },
                { log: "Du tager ham fuldstændig på sengen og griber alt, hvad han ejer på bordet.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug metaldetektoren til at afsløre ham", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du afslører hans primitive snyd. Gøgleren sukker og overgiver diamanten for at undgå problemer.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Læg 100 guldstykker og peg på et krus", puljeVaerdi: 100, udfaldListe: [{ log: "Du valgte rigtigt. Han accepterer sit nederlag og udbetaler præmien.", givItem: 'diamant', guldAendring: 220 }] }
        ]
    },

    'ligningen_i_stoevet': {
        id: 'ligningen_i_stoevet', titel: "Gåden i Støvet", biome: ['by', 'marked'], unik: false,
        tekst: "En snavset mand har tegnet en streg i støvet og forventer, at du besvarer hans gåde.",
        valg: [
            { tekst: "Sæt øksen i jorden og afvis legen med et blik", kraeverItem: 'oekse', udfaldListe: [{ log: "Han bakker skræmt væk fra dit våben og glemmer sin lille kniv og mønterne.", givItem: 'kniv', guldAendring: 150 }] },
            { tekst: "Ødelæg tegningen med din støvle", udfaldListe: [
                { log: "Det gør ham rasende, og han slår hårdt ud efter dit ben i vrede.", hpAendring: -42, givItem: 'kniv' },
                { log: "Han giver et opgivende suk over din brutalitet og afleverer sine ting.", hpAendring: -5, givItem: 'kniv', guldAendring: 300 }
            ]},
            { tekst: "Giv ham 50 mønter for indsatsen", puljeVaerdi: 50, udfaldListe: [{ log: "Han smiler venligt, tager pengene og rækker dig en kniv.", givItem: 'kniv', guldAendring: 200 }] }
        ]
    },

    'den_falske_moent': {
        id: 'den_falske_moent', titel: "Snyd i Vægten", biome: ['marked'], unik: false,
        tekst: "En sælger holder en lille vægt oppe. Hans mønter afvejes tydeligvis skævt og fylder ikke det, de skal.",
        valg: [
            { tekst: "Slå vægten ud af hænderne på ham", udfaldListe: [
                { log: "Han tager fat i din trøje og slår kontra, inden du tømmer hans skuffe.", hpAendring: -40, guldAendring: 180 },
                { log: "Vægten falder til jorden. Manden fryser fast, og du tømmer let hans bord.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Spænd buen mod ham og kig ham i øjnene", kraeverItem: 'bue', udfaldListe: [{ log: "Sælgeren forstår budskabet. Han overgiver alle sine snydepenge til dig i stilhed.", guldAendring: 200 }] },
            { tekst: "Før detektoren hen over bordet for at afsløre jernet under pladen", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Snydet er nu bekræftet. Du kræver kompensation og får hans diamant.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'flaskernes_logik': {
        id: 'flaskernes_logik', titel: "Flaskerne", biome: ['by', 'marked'], unik: false,
        tekst: "Tre små glasflasker står på et træbord. Sælgeren påstår, at kun én af dem rummer en modgift.",
        valg: [
            { tekst: "Drik din egen eliksir som modvægt", kosterItem: 'livseliksir', udfaldListe: [{ log: "Du tager modgiften på forhånd, blander hans flasker og tvinger ham til at udbetale præmien.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Tru ham med kniven og snup hans udstyr", kraeverItem: 'kniv', udfaldListe: [{ log: "Han rækker hænderne i vejret, mens du rydder bordet og undgår at lege med.", givItem: 'livseliksir', guldAendring: 250 }] },
            { tekst: "Gæt på en af flaskerne og drik", udfaldListe: [
                { log: "Du tog fejl. En besk syre brænder din hals, og dit humør styrtdykker.", hpAendring: -42, guldAendring: 150 },
                { log: "Den smager fantastisk! Du valgte rigtigt, sikrer dig guld og får endda frisk energi.", hpAendring: 150, maxHpAendring: 10, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

    'iglernes_broend': {
        id: 'iglernes_broend', titel: "Våd Ring", biome: ['eng', 'skov'], unik: true,
        tekst: "En velklædt herre peger fortvivlet ned i en mudderpøl fyldt med igler. Hans guldring ligger på bunden.",
        valg: [
            { tekst: "Grav ringen op med skovlen", kraeverItem: 'skovl', udfaldListe: [{ log: "Spaden glider direkte ned i bunden og henter ringen op uden problemer.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Fisk ringen op med hænderne", udfaldListe: [
                { log: "Iglerne sætter sig fast og bider slemt, mens du kæmper i mudderet.", hpAendring: -42, guldAendring: 300 },
                { log: "Du får fat i smykket lynhurtigt. Mudderet ryster du bare af bagefter.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug din stav til at rode iglerne væk med", kosterItem: 'stav', udfaldListe: [{ log: "Du bruger staven til at rode plads, indtil du kan fiske ringen op, og pinden knækker.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'raaddenskabens_hoest': {
        id: 'raaddenskabens_hoest', titel: "Svampe i Mudderet", biome: ['mark', 'eng'], unik: true,
        tekst: "Hvide svampe dækker en efterladt rygsæk fuldstændig. Sporer stiger op fra dem.",
        valg: [
            { tekst: "Hold vejret og flå rygsækken frem", udfaldListe: [
                { log: "Du får en solid slurk af sporerne og hoster voldsomt bagefter.", hpAendring: -42, givItem: 'metaldetektor' },
                { log: "Det lykkes uden ét eneste hiv efter vejret. Du trækker rygsækken i sikkerhed.", hpAendring: -5, givItem: 'metaldetektor', guldAendring: 350 }
            ]},
            { tekst: "Vikl tøjet omkring armen og hovedet", kosterItem: 'flot_toej', udfaldListe: [{ log: "Tøjet lukker effektivt tågen ude, og du sikrer dig maskinen uden mén.", givItem: 'metaldetektor', guldAendring: 250 }] },
            { tekst: "Skær svampene over med roligt snit med øksen", kraeverItem: 'oekse', udfaldListe: [{ log: "De falder fra hinanden for bladet. Faren minimeres, og grejet er dit.", givItem: 'metaldetektor', guldAendring: 200 }] }
        ]
    },

    'smertens_segl': {
        id: 'smertens_segl', titel: "Glødende Jern", biome: ['ruin', 'ritual'], unik: true,
        tekst: "En stående mand rækker et brændende varmt jern frem mod dig i bytte for sin eliksir.",
        valg: [
            { tekst: "Smid ham omkuld og snup eliksiren", udfaldListe: [
                { log: "Han borer jernet skræmt i din skulder, mens han falder baglæns.", hpAendring: -42, givItem: 'livseliksir' },
                { log: "Du vælter ham uden besvær. Han ryster og lader flasken ligge på jorden.", hpAendring: -5, givItem: 'livseliksir', guldAendring: 320 }
            ]},
            { tekst: "Accepter betingelsen og lad ham brændemærke dig", udfaldListe: [{ log: "Jernet gør et permanent indhug i din fysik, men flasken rækkes andægtigt til dig.", maxHpAendring: -7, givItem: 'livseliksir', guldAendring: 350 }] },
            { tekst: "Vis ham din kniv som afvisning", kraeverItem: 'kniv', udfaldListe: [{ log: "Han taber pinden i forfærdelse og skubber både guld og flaske over til dig.", givItem: 'livseliksir', guldAendring: 200 }] }
        ]
    },

    'kloakkens_fange': {
        id: 'kloakkens_fange', titel: "Fanget Tyv", biome: ['by', 'marked'], unik: true,
        tekst: "En tyv er fanget i et bur over stigende kloakvand og tyk, svovlagtig damp.",
        valg: [
            { tekst: "Brug tøjet over næsen, mens du låser ham ud", kosterItem: 'flot_toej', udfaldListe: [{ log: "Dampen ignoreres takket være stoffet. Han betaler dig en diamant for friheden.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Knæk beslaget af buret med hænderne", udfaldListe: [
                { log: "Vandet ætser ubehageligt mod dine arme, mens du kæmper med jernet.", hpAendring: -42, guldAendring: 300 },
                { log: "Din armstyrke giver et perfekt knæk, og buret svinger op på kort tid.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Lirk haspen præcist med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Det går metodisk og lydløst. Låsen klikker, og tyven tager hatten af som tak.", guldAendring: 400 }] }
        ]
    },

    'krigshunden': {
        id: 'krigshunden', titel: "Hunden i Blodet", biome: ['slagmark', 'eng', 'skov'], unik: true,
        tekst: "En kampklar hund står vagt og knurrer over sin faldne ejers udrustning.",
        valg: [
            { tekst: "Nedkæmp det bange dyr", udfaldListe: [
                { log: "Hunden farer aggressivt op og planter tænderne i dit ben under kampen.", hpAendring: -42, givItem: 'rustning', guldAendring: 150 },
                { log: "Du slår hunden bevidstløs. Den segner om i sandet, og du kan fjerne rustningen.", hpAendring: -5, givItem: 'rustning', guldAendring: 350 }
            ]},
            { tekst: "Sæt en skål eliksir foran dens næse", kosterItem: 'livseliksir', udfaldListe: [{ log: "Den slikker på det og falder straks i en dyb søvn. Lommerne er frie til dig.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Hold knurren tilbage med skovlens skjold", kraeverItem: 'skovl', udfaldListe: [{ log: "Den bider fast i træskaftet, og du kan række ned og trække udstyret roligt til dig.", givItem: 'metaldetektor', guldAendring: 250 }] }
        ]
    },

    'blind_passager': {
        id: 'blind_passager', titel: "Aben i Tågen", biome: ['ruin', 'by'], unik: true,
        tekst: "En lille rødøjet abe sidder tæt ved en stak mønter og stirrer olmt på dig.",
        valg: [
            { tekst: "Grib fat i aben før den angriber", udfaldListe: [
                { log: "Aben bider og kradser desperat ind i dit håndled.", hpAendring: -40, guldAendring: 300 },
                { log: "Du slår en handske over den, og den slipper pungen for friheden.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug faklen til at skræmme den oppefra", kosterItem: 'fakkel', udfaldListe: [{ log: "Kombinationen af ild og lyden får dyret til at hvine og hoppe væk fra mønterne.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Parér dens spring med et våben", kraeverItem: 'sabel', udfaldListe: [{ log: "Sablen afværger dens angreb totalt. Den løber sur væk, og mønterne overdrages.", guldAendring: 350 }] }
        ]
    },

    'abens_pose': {
        id: 'abens_pose', titel: "Den Klamme Pung", biome: 'any', erSubTrin: true,
        tekst: "Pungen lugter forfærdeligt af gammelt slim og klæber sig let til mudderet.",
        valg: [
            { tekst: "Før detektoren let henover den", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Den fortæller dig, hvilken del af posen der kan røres ved uden slim på fingrene.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Stik armen direkte ind i pungen", udfaldListe: [
                { log: "Bunden vrimler med skarpe, ubehagelige kløer, der gør stor skade.", hpAendring: -42, guldAendring: 280 },
                { log: "Mønterne smyger sig fri af slimen. Der sker ingenting i lommen.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Skær bunden af pungen og ryst indholdet ud", kraeverItem: 'kniv', udfaldListe: [{ log: "Du skærer forsigtigt bunden væk. Slimet bliver i posen, og en ædelsten falder ud.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'sumpdyret': {
        id: 'sumpdyret', titel: "Dyret i Kviksand", biome: ['eng', 'bjerg'], unik: true,
        tekst: "Et lastdyr sidder fast til maven i mudder. Pungen hænger løst fra sadlen.",
        valg: [
            { tekst: "Brug skovlen til at lette presset under benene", kosterItem: 'skovl', udfaldListe: [{ log: "Arbejdet giver plads nok. Dyret vrikker sig lettet op, ryster tasken af sig og går.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Klip sadelbåndet over for at redde godset", kraeverItem: 'sabel', udfaldListe: [{ log: "Sablen fjerner remmen let. Dyret og godset slipper hinanden.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Træk sadlen løs med muskelkraft over kanten", udfaldListe: [
                { log: "Mudrets modstand giver muskelkramper i dine ben over slæbet.", hpAendring: -42, givItem: 'metaldetektor' },
                { log: "Slammet slipper, og rygsækken svæver nærmest over til dit fodfæste.", hpAendring: -5, givItem: 'metaldetektor', guldAendring: 400 }
            ]}
        ]
    },

    'falkejaegeren': {
        id: 'falkejaegeren', titel: "Ørnen i Himlen", biome: ['mark', 'skov'], unik: true,
        tekst: "En mekanisk ørn suser over himlen og gør klar til et dyk mod dig.",
        valg: [
            { tekst: "Skyd maskinen ned med buen", kraeverItem: 'bue', udfaldListe: [{ log: "Pilen smadrer svingfjerene, og maskineriet styrter ned ved dine fødder.", givItem: 'metaldetektor', guldAendring: 300 }] },
            { tekst: "Vig til side lige inden angrebet", udfaldListe: [
                { log: "Den snitter dine arme med sine skarpe spidser før slaget mod klippen.", hpAendring: -42, givItem: 'rustning', guldAendring: 180 },
                { log: "Du undviger dykket i sidste sekund. Fuglen smadres mod stenen, og du kan samle dens indbyggede ædelsten op.", hpAendring: -2, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Dæk himlen til over dig med stoffet", kosterItem: 'flot_toej', udfaldListe: [{ log: "Det forvirrer sensorerne. Den tvinges til nødlanding i stof og overgiver diamanten.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'krigens_ekko': {
        id: 'krigens_ekko', titel: "Ridderens Fald", biome: ['slagmark', 'ruin'], unik: true,
        tekst: "En døende ridder stønner på slagmarken og prøver at holde fat om sit store skjold.",
        valg: [
            { tekst: "Brug din ridderstatus for at overtage tjansen for ham", kraeverKarakter: 'knight_m', udfaldListe: [{ log: "Han slapper af i nærværet af en kollega. Hans diamantbærende armbånd er dit som gave.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Skub skjoldet roligt væk med øksen", kraeverItem: 'oekse', udfaldListe: [{ log: "Træet fejes væk, og hans greb løsner sig endeligt. Du tager den rustning, der var skjult under skjoldet.", givItem: 'rustning', guldAendring: 280 }] },
            { tekst: "Spark kisten ud af hænderne på ham", udfaldListe: [
                { log: "Han giver et desperat sidste slag, der rammer forbløffende hårdt mod maven.", hpAendring: -42, givItem: 'rustning' },
                { log: "Hans krop giver endelig op og overlader resten af panseret til dit indsamlingsarbejde.", hpAendring: -5, givItem: 'rustning', guldAendring: 350 }
            ]}
        ]
    },

    'stjernernes_skyggespil': {
        id: 'stjernernes_skyggespil', titel: "Barrieren af Lys", biome: ['ritual', 'hule'], unik: true,
        tekst: "En utroligt varm og massiv lysstråle skærer gennem rummet og spærrer stien frem.",
        valg: [
            { tekst: "Spring igennem lyset", udfaldListe: [
                { log: "Varmen efterlader overfladiske brandsår overalt under springet.", hpAendring: -42, guldAendring: 350 },
                { log: "Det snitter dig knapt nok. Målet nås og diamanten er i hus.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Brug linsen på afstand for at undersøge det svage punkt", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Kikkerten viser maskinens fejl og afbryder kilden sikkert.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Slå mekanismen til strålen itu med en stav", kosterItem: 'stav', udfaldListe: [{ log: "Maskineriet kvases under staven og slukker truslen totalt. Du tager indholdet med ro.", givItem: 'livseliksir', guldAendring: 300 }] }
        ]
    },

    'adelens_fald': {
        id: 'adelens_fald', titel: "Pøbelens Oprør", biome: ['by', 'marked'], unik: true,
        tekst: "En vred menneskemængde har trængt en rigmand op i et hjørne. Han klamrer sig til en tung pengekasse.",
        valg: [
            { tekst: "Træd frem og brug din adelige autoritet til at rydde pladsen", kraeverKarakter: 'royal_m', udfaldListe: [{ log: "Mængden trækker sig mumlende tilbage. Rigmanden giver dig en diamant som tak for hjælpen.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Stil dig på borgernes side og kræv kisten åbnet", udfaldListe: [
                { log: "Situationen eskalerer til et slagsmål, hvor du får et par hårde slag, inden folkemængden spreder sig.", hpAendring: -42, guldAendring: 350 },
                { log: "Rigmanden overgiver sig skræmt. Han taber sin pengekasse og en diamant i farten.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Betal folkemængden 150 guld for at lade ham være", puljeVaerdi: 150, udfaldListe: [{ log: "Guldet får borgerne til at glemme deres vrede. Rigmanden efterlader sit våben til dig i skyndingen.", givItem: 'sabel', guldAendring: 290 }] }
        ]
    },

    'blod_paa_tanden': {
        id: 'blod_paa_tanden', titel: "Skurke i Mørket", biome: ['ruin', 'bandit'], unik: true,
        tekst: "Banditter med skarpe klinger blokerer vejen frem. De stirrer ondt på dig og din oppakning.",
        valg: [
            { tekst: "Spring over mod dem for et angreb", udfaldListe: [
                { log: "Et blødt snit rammer din overarm under slåskampen, men banditterne tvinges på flugt.", hpAendring: -42, guldAendring: 400 },
                { log: "Raseriet presser dem ud! En modstander glemmer sin diamant i støvet af forvirring.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Kast din eliksir over bålet foran dem", kosterItem: 'livseliksir', udfaldListe: [{ log: "Dampe fra drikken spreder sig og virker stærkt bedøvende på lejren. Der er frit slaw.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Spænd buen og sigt mod det nærmeste ansigt", kraeverItem: 'bue', udfaldListe: [{ log: "De opgiver alle planer om tyveri og ryster på hovedet. Panser og guld står urørt tilbage.", givItem: 'rustning', guldAendring: 320 }] }
        ]
    },

    'stormens_bytte': {
        id: 'stormens_bytte', titel: "Blæst", biome: ['hoejland'], unik: true,
        tekst: "Vinden truer med at blæse en tung kiste direkte ud over kanten af et bjergpas.",
        valg: [
            { tekst: "Brug din viden om klipperne til at afkode blæstens retning", kraeverKarakter: 'explorer_m', udfaldListe: [{ log: "Du udnytter klipperne fejlfrit. Vinden raser forbi dig, mens du løsner detektoren og mønterne.", givItem: 'metaldetektor', guldAendring: 200 }] },
            { tekst: "Sæt sværdet som et anker i jorden foran den", kosterItem: 'svaerd', udfaldListe: [{ log: "Stålet brækker midtover under presset, men kisten bremser, og udbetalingen reddes fra blæsevejret.", guldAendring: 350 }] },
            { tekst: "Kast dig over og læg tyngde over kisten", udfaldListe: [
                { log: "Faldet mod træet gør skade på ben og lår, men kisten falder ikke ud over.", hpAendring: -42, guldAendring: 320 },
                { log: "Springet balancerer perfekt vægten! Du napper diamanten ud af spalten uden skrammer.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

'klippeoernens_rede': {
        id: 'klippeoernens_rede', titel: "Skyggen fra Skyen", biome: ['hoejland'], unik: true,
        tekst: "Solen forsvinder et øjeblik bag et enormt vingefang. En gigantisk rovfugl folder vingerne sammen og dykker direkte mod dig for at forsvare sin rede på klippehylden.",
        valg: [
            { tekst: "Læs vindens retning og fuglens angrebsmønster for at overliste den", kraeverKarakter: 'hunter_m', udfaldListe: [{ log: "Du forudser dens bane perfekt. Fuglen slår kløerne i den tomme klippe, mens du roligt tømmer reden for guld bag dens ryg.", guldAendring: 400 }] },
            { tekst: "Spænd buen og sigt direkte mod dens bryst", kraeverItem: 'bue', udfaldListe: [{ log: "Rovfuglen genkender et dødeligt våben og afbryder sit dyk. Den trækker væk og efterlader reden ubeskyttet.", guldAendring: 350 }] },
            { tekst: "Kast dig frem mod reden i samme sekund, fuglen angriber", udfaldListe: [
                { log: "Du fejlvurderer farten. Kløerne borer sig dybt ind i din arm, før du får vristet dig fri med byttet.", hpAendring: -22, givItem: 'diamant', guldAendring: 10 },
                { log: "Fuglen rammer kun den tomme luft over dig. Du lander i reden og snupper en funklende diamant, inden den når at vende om.", hpAendring: -5, givItem: 'diamant', guldAendring: 50 }
            ]}
        ]
    },

    'den_klarsynede': {
        id: 'den_klarsynede', titel: "Snestorm", biome: ['hoejland'], unik: true,
        tekst: "En forfrossen mand nægter at slippe sin metaldetektor, mens snestormen raser.",
        valg: [
            { tekst: "Smid soveposen til ham mod kulden", kosterItem: 'sovepose', udfaldListe: [{ log: "Kulden fordamper fra mandens ansigt. Han trækker sig og overdrager scanneren imens guld samles urørt.", givItem: 'metaldetektor', guldAendring: 220 }] },
            { tekst: "Undersøg ham gennem kikkerten for at gennemskue bedrag", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Linsen fjerner stormen. Han glemmer frygten, overgiver maskinen og lader dig hente lønnen.", givItem: 'metaldetektor', guldAendring: 230 }] },
            { tekst: "Bøj hans fingre tilbage i sneen for at tage det", udfaldListe: [
                { log: "Manden flænger stenen før han falder besvimet. Han sparkede hårdt før du tog pungen.", hpAendring: -40, givItem: 'metaldetektor' },
                { log: "Et lynhurtigt sving kaster manden af! Udstyret pilles ud fra stenen helt uden en skramme.", hpAendring: -2, givItem: 'metaldetektor', guldAendring: 350 }
            ]}
        ]
    },

    'stensangen': {
        id: 'stensangen', titel: "Stensangen", biome: ['hoejland'], unik: true,
        tekst: "Vinden hyler gennem bjergpasset. Larmen er overdøvende, og et mærkeligt skelet ligger spredt over klipperne.",
        valg: [
            { tekst: "Hæv stemmen og brug din arv til at dæmpe tonen", kraeverKarakter: 'dwarf_m', udfaldListe: [{ log: "Vinden lystrer bjergets søn, og fjeldet dæmper sine toner. Diamanten frelses roligt.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Træd direkte frem i larmen mod byttet", udfaldListe: [
                { log: "Lyden gør alvorligt ondt i ører og hoved. Sindet lider et voldsomt dyk.", hpAendring: -42, maxHpAendring: -10, guldAendring: 350 },
                { log: "Tonen slår mod sten i stedet for ører! Du skovler uvurderligt støjende guld udenom de falmende ruiner.", hpAendring: -5, guldAendring: 400 }
            ]},
            { tekst: "Beskyt ørene med tyk klud omkransende hovedet", kosterItem: 'klude', udfaldListe: [{ log: "Stoffet forhindrer den blødende støj for din bevidsthed! Tonen fordamper over ædelstenen.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'falsk_refleksion': {
        id: 'falsk_refleksion', titel: "Spejlbilledets Tåge", biome: ['krystal', 'ruin'], unik: true,
        tekst: "Et forvrænget spejl viser en bunke guld, der overhovedet ikke er der. Det tigger i støvet.",
        valg: [
            { tekst: "Kast det dyre tøj over illusionen", kosterItem: 'flot_toej', udfaldListe: [{ log: "Tøjet skaber et tæppe over forbandelsen. Ud ruller ægte, stærke diamantskatte under spejlet.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Gennemsku den magiske kilde og afbryd fupnummeret", kraeverKarakter: 'magician_m', udfaldListe: [{ log: "Illusionen slukker og spejlet smuldrer uden larm. Du afhenter en enorm, samlet rigdom uden fup.", guldAendring: 400 }] },
            { tekst: "Smadr overfladen med al din kraft mod spejlet", udfaldListe: [
                { log: "Glasset splintrer og de flyvende stumper flænger underarme før guldet er hevet.", hpAendring: -42, guldAendring: 320 },
                { log: "Glasset kvases mod jorden! Du skovler magi og juvel roligt op og overskrider illusionen.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

    'glasroserne': {
        id: 'glasroserne', titel: "Knivsblade", biome: ['krystal'], unik: true,
        tekst: "Skarpe krystaller vokser op af jorden som spidse blomster og spærrer stien til en søgekvist.",
        valg: [
            { tekst: "Svid spidserne væk med faklens hede", kosterItem: 'fakkel', udfaldListe: [{ log: "Ilden skaber tryghed. Roserne smelter og åbenbarer søgekvisten uden problemer.", givItem: 'soegekvist', guldAendring: 300 }] },
            { tekst: "Hop udenom dem og grib mod midten", udfaldListe: [
                { log: "Armene snittes for de glasklare blomster imens kvisten hives op af faren.", hpAendring: -40, givItem: 'soegekvist' },
                { log: "Du springer snævert forbi flængerne og griber stærkt ind efter kvisten uden mærker.", hpAendring: -2, givItem: 'soegekvist', guldAendring: 350 }
            ]},
            { tekst: "Snit rosen ned ved stilken med et rent klem", kraeverItem: 'kniv', udfaldListe: [{ log: "Bladet skaber stien ren! Du udrydder faren uden et snit før grejet trækkes op.", givItem: 'soegekvist', guldAendring: 250 }] }
        ]
    },

    'prismets_vildfarelse': {
        id: 'prismets_vildfarelse', titel: "Skyggebilleder", biome: ['krystal', 'bjerg'], unik: true,
        tekst: "Et prisme kaster forvirrende skygger af truende skikkelser op på hulevæggen. I midten ligger en ædelsten.",
        valg: [
            { tekst: "Løb udenom skyggerne og hent juvelen under farerne", udfaldListe: [
                { log: "Stødet blænder sindet slemt, imens juvel og skat rykkes frit ned.", hpAendring: -42, givItem: 'diamant', guldAendring: 250 },
                { log: "Magien er kun fup! Spøgelset blegner, og skatten drages ind under udbetaling for asken.", hpAendring: -5, guldAendring: 400 }
            ]},
            { tekst: "Se illusionen igennem glassets optik", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Den fantastiske linse udstiller brølet som magi. Stenen lænses for sandheden i mørket uden rædsel.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Spil med på vanviddet og le med skyggerne", kraeverKarakter: 'joker_m', udfaldListe: [{ log: "Dit eget grin afbryder prismet til overgivelse! Skatten samles i fuldendt ro før magien smuldrer væk.", guldAendring: 400 }] }
        ]
    },

    'bloddiamanten': {
        id: 'bloddiamanten', titel: "Bæstets Skat", biome: ['krystal', 'blodskov'], unik: true,
        tekst: "En massiv bjørn sover tungt henover en krystal og en hob af gamle mønter.",
        valg: [
            { tekst: "Træk diamanten udenom bamsen som skovens mester", kraeverKarakter: 'hunter_m', udfaldListe: [{ log: "Fingrene danser ufattelig let! Dyret ånder lettet mens stenen lister rent i din taske.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Hold dyrets snude tilbage med sabel under arbejdet", kraeverItem: 'sabel', udfaldListe: [{ log: "Du fastholder afstanden. Bjørnen vrider over skatten og mønterne tømmes understående.", guldAendring: 350 }] },
            { tekst: "Træk hårdt til og håb på at dyret forbliver i dvale", udfaldListe: [
                { log: "Dyrets klo fanger din arm under bevægelsen over krystallen. Blodet flyder før stenen overgives.", hpAendring: -42, guldAendring: 350 },
                { log: "Rykket lyner fejlfrit fra stenen! Udyret sover roligt over alt mudderet og overlader byttet.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]}
        ]
    },

    'krystalpaladset': {
        id: 'krystalpaladset', titel: "Spejlhuset", biome: ['krystal', 'by'], unik: true,
        tekst: "Et rum af glasvægge kaster utallige refleksioner. Midten gemmer på faren og diamanterne.",
        valg: [
            { tekst: "Kør metaldetektoren mod murstens skjulte vægge", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Væggenes refleksion udstilles og en hemmelig bane åbnes ind mod midten.", naesteTrin: 'krystal_kerne' }] },
            { tekst: "Slå fliserne ned og ryd paladset med næver", udfaldListe: [
                { log: "Glasset splintrer over dig og giver mærkbare stik indtil væggen vælter.", hpAendring: -40, naesteTrin: 'krystal_splinter' },
                { log: "Brølet kaster murstens illusion i støv! Skåret åbner kernens rum uden blødende snit.", hpAendring: -2, naesteTrin: 'krystal_splinter' }
            ]},
            { tekst: "Følg refleksionen uden forsvaret", udfaldListe: [{ log: "Skyggen lokker og truer lidelserne i støvet mens faldet viger over gulvets mønter.", naesteTrin: 'krystal_illusion' }] }
        ]
    },

    'krystal_illusion': {
        id: 'krystal_illusion', titel: "Grådighed", biome: 'any', erSubTrin: true,
        tekst: "En guldstak lyser svagt foran dig i det forvirrende spejlkammer.",
        valg: [
            { tekst: "Tjek guldstakken for urværk med scanner", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Mønterne dækker et rum over muren. Penge udtages og detektoren melder klart.", guldAendring: 400 }] },
            { tekst: "Grib stakken under refleksionens tåger", udfaldListe: [
                { log: "Fingrene kapper usynligt over glaskanterne. Du hiver diamanten ud i tryghed efter lidelserne.", hpAendring: -42, givItem: 'diamant', guldAendring: 250 },
                { log: "Et blændende snuptag overvælder illusionen! Stenen kastes roligt ned under dække for guld.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Slå guldet ned i lommen via skovlens plade", kosterItem: 'skovl', udfaldListe: [{ log: "Skovlen æder magiens slag, men illusionen udleverer diamanten og rigdommen i mørket.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'krystal_kerne': {
        id: 'krystal_kerne', titel: "Kernen", biome: 'any', erSubTrin: true,
        tekst: "Spejlhuset udsender pludselig ekstrem varme omkring perlen.",
        valg: [
            { tekst: "Slå hånden igennem heden efter rovet", udfaldListe: [
                { log: "Heden forbrænder huden slemt over forfanget! Stenen trækkes ud af ilden efterfølgende.", hpAendring: -45, givItem: 'diamant' },
                { log: "Kastevinden dæmper luen i få sekunder og juvelen fjernes under ilden urørt.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Skænk væsken fra flasken for at rydde flammen", kosterItem: 'livseliksir', udfaldListe: [{ log: "Eliksiren fordamper varmen udenom forbandelsen. Kroppen styrkes, guld overtages udenom.", hpAendring: 180, maxHpAendring: 15, guldAendring: 400 }] },
            { tekst: "Hak den varme sokkel med øksehovedet", kraeverItem: 'oekse', udfaldListe: [{ log: "Skaftet skærmer mod risten og fjerner flammer før diamanten klares i fuldkommen dvale.", givItem: 'diamant', guldAendring: 250 }] }
        ]
    },

    'krystal_splinter': {
        id: 'krystal_splinter', titel: "Pile af Glas", biome: 'any', erSubTrin: true,
        tekst: "De knuste spejle farer ud mod dig som små pile fra loftet og mod jorden.",
        valg: [
            { tekst: "Beskyt overkroppen med dit rustne skjold", kosterItem: 'rustning', udfaldListe: [{ log: "Rustningen overdrager ro over glasset. Perlen og guld falder uskadte bag det ridsede lag.", givItem: 'diamant', guldAendring: 250 }] },
            { tekst: "Spring af vejen før pilene lander", udfaldListe: [
                { log: "Regnen snitter ryggen før stenen rages af støvet og guldet triller ud.", hpAendring: -42, givItem: 'diamant', guldAendring: 250 },
                { log: "Svinget afviger fuldstændigt for faldet under glasset! Skatten udleveres roligt bagefter.", hpAendring: -5, givItem: 'diamant', guldAendring: 250 }
            ]},
            { tekst: "Smid guld over gulvet før glasset fanger byttet", puljeVaerdi: 150, udfaldListe: [{ log: "Mønterne rydder glasset, og formuen er fjernet udenom spidserne til udbetaling af rigdom.", guldAendring: 400 }] }
        ]
    },

    'forladt_fiskebaal': {
        id: 'forladt_fiskebaal', titel: "Gløder i Tågen", biome: ['hav', 'eng', 'mark'], unik: false,
        tekst: "Et lille bål ulmer svagt. På et spid over gløderne rister en stor fisk stadig.",
        valg: [
            { tekst: "Spis fisken direkte fra det varme spid", udfaldListe: [
                { log: "Kødet er gennemstegt og fylder maven med behagelig varme.", hpAendring: 25 },
                { log: "Fisken har slugt en skarp krog. Du flænger gummerne lidt, men kødet mætter.", hpAendring: 10 }
            ]},
            { tekst: "Skær de rene fileter fri med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Klingen parterer fisken perfekt. Du får et stort, rent måltid uden ben.", hpAendring: 35 }] },
            { tekst: "Grav gløderne ud og gennemsøg pladsen under bålet", kraeverItem: 'skovl', udfaldListe: [{ log: "Fisken mætter dig, og under asken finder du en lille pose med penge.", hpAendring: 15, guldAendring: 25 }] }
        ]
    },

    'gloe_frugten': {
        id: 'gloe_frugten', titel: "Frugten på Grenen", biome: ['skov', 'blodskov'], unik: false,
        tekst: "Et udgået træ knejser i mørket. Blandt de rådne grene hænger en stor, violet frugt.",
        valg: [
            { tekst: "Riv frugten ned og bid direkte gennem skallen", udfaldListe: [
                { log: "Saften er bitter, men den giver god mæthed og ny energi.", hpAendring: 20 },
                { log: "Skallen er dækket af usynlige pigge. Dit ansigt svulmer lidt, men maden virker.", hpAendring: 5 }
            ]},
            { tekst: "Skyd frugten ned med en pil", kraeverItem: 'bue', udfaldListe: [{ log: "Pilen kapper stilken rent. Du undgår skallen og spiser frugtkødet sikkert.", hpAendring: 30 }] },
            { tekst: "Spis den med din medbragte ration for at dæmpe smagen", kosterItem: 'mad', udfaldListe: [{ log: "Sammensætningen fjerner al bitterhed og skaber et utroligt mættende måltid.", hpAendring: 45 }] }
        ]
    },

    'jaegerens_gryde': {
        id: 'jaegerens_gryde', titel: "Stuvningen", biome: ['bjerg', 'hoejland'], unik: false,
        tekst: "En tung jerngryde koger over en kilde i jorden. Den rummer en tyk svampestuvning.",
        valg: [
            { tekst: "Drik suppen af gryden", udfaldListe: [
                { log: "Varmen spreder sig lindrende i dine årer. Næringen genopbygger din krop.", hpAendring: 30 },
                { log: "Kilden afgiver svovldampe, der irriterer halsen. Maden virker dog stadig godt.", hpAendring: 15 }
            ]},
            { tekst: "Dæk dampene med faklen for at koge den ren", kosterItem: 'fakkel', udfaldListe: [{ log: "Ilden renser gasserne fra overfladen. Stuvningen smager fantastisk.", hpAendring: 40 }] },
            { tekst: "Led manden ved siden af for mønter", udfaldListe: [{ log: "Du lader maden stå. I stedet finder du en pose med mønter ved gryden.", guldAendring: 35 }] }
        ]
    },

    'ruinens_spisekammer': {
        id: 'ruinens_spisekammer', titel: "Gammel Ost", biome: ['ruin', 'by'], unik: false,
        tekst: "Tørret kød og gamle oste hænger urørt ned fra loftet i et køligt kælderrum.",
        valg: [
            { tekst: "Spis af kødet uden at tøve", udfaldListe: [
                { log: "Saltet tørster dig, men kødet mætter og fjerner udmattelsen.", hpAendring: 25 },
                { log: "En plet forrådnelse ødelægger smagen lidt og giver ondt i maven.", hpAendring: 10 }
            ]},
            { tekst: "Inspicer osten grundigt med kikkerten", kraeverItem: 'kikkert_250', udfaldListe: [{ log: "Du opdager skjulte mider i skorpen. Du fravælger osten og spiser kun det sikre kød.", hpAendring: 35 }] },
            { tekst: "Brug detektoren på væggene bag maden", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Du finder et løst panel i muren og glemmer sulten. Der lå valuta gemt bag det.", guldAendring: 45 }] }
        ]
    },

    'mudderkrabber': {
        id: 'mudderkrabber', titel: "De Varme Krabber", biome: ['mark', 'slagmark'], unik: false,
        tekst: "Damp stiger op fra et mudderhul. Flere store krabber ligger kogte i varmen.",
        valg: [
            { tekst: "Knus skjoldene med støvlen for at få kødet", udfaldListe: [
                { log: "Kødet er mørt og forbedrer din tilstand fremragende.", hpAendring: 25 },
                { log: "Skallen gemte på kogende vand, der sprøjter op på benet. Maden opvejer det lidt.", hpAendring: 10 }
            ]},
            { tekst: "Slå skjoldet op med øksen", kraeverItem: 'oekse', udfaldListe: [{ log: "Øksen flækker skallen perfekt. Du finder mønter i vandet og får et godt måltid.", hpAendring: 25, guldAendring: 20 }] },
            { tekst: "Brug tøjet som handske til at rydde skallerne", kosterItem: 'klude', udfaldListe: [{ log: "Kludene tager alt vand og svineri. Du får ubesværet adgang til maden.", hpAendring: 35 }] }
        ]
    },

    'rusten_kasse': {
        id: 'rusten_kasse', titel: "I Hjulsporet", biome: 'any', unik: false,
        tekst: "En lille trækasse stikker halvt op af mudderet. Hængslet er slidt og rustent.",
        valg: [
            { tekst: "Spark kassen op med støvlen", udfaldListe: [
                { log: "Låget knækker med et smæld, og du kan samle pengene op.", guldAendring: 35 },
                { log: "Kassen sidder fast, og du vrider knæet under sparket. Men du får guldet.", hpAendring: -2, guldAendring: 30 }
            ]},
            { tekst: "Dirk låsen med kniven", kraeverItem: 'kniv', udfaldListe: [{ log: "Klingen tvinger beslaget åbent uden larm. Lommen fyldes.", guldAendring: 45 }] },
            { tekst: "Knus den med din stav", kosterItem: 'stav', udfaldListe: [{ log: "Staven overlever ikke, men kassen bliver flad. Overskuddet pilles ud.", guldAendring: 55 }] }
        ]
    },

    'budbringerens_taske': {
        id: 'budbringerens_taske', titel: "Kuréren", biome: ['eng', 'mark', 'skov'], unik: false,
        tekst: "En kurér ligger knust under en stamme. Hans lædertaske klirrer af guld under grene og jord.",
        valg: [
            { tekst: "Flå tasken fri under stammen", udfaldListe: [
                { log: "Læderet river sig løs med magt, og du sikrer dig byttet derfra.", guldAendring: 30 },
                { log: "Remmen giver pludselig efter og svirper dig i hovedet, men mønterne er oppe.", hpAendring: -2, guldAendring: 35 }
            ]},
            { tekst: "Grav jorden under tasken fri", kraeverItem: 'skovl', udfaldListe: [{ log: "Du laver et hul under tasken, så den kan glide fri. Al valutaen reddes ud.", guldAendring: 50 }] },
            { tekst: "Dæk kuréren til med dit klæde", kosterItem: 'flot_toej', udfaldListe: [{ log: "Mens du dækker ham ærbødigt, finder du en ekstra møntpose, han havde gemt i trøjen.", guldAendring: 60 }] }
        ]
    },

    'vagtmandens_skjul': {
        id: 'vagtmandens_skjul', titel: "Løs Sten", biome: ['ruin', 'bandit', 'by'], unik: false,
        tekst: "En gammel læderpung ligger skjult bag en løs sten i muren.",
        valg: [
            { tekst: "Stik armen ind og grib den", udfaldListe: [
                { log: "Du får et godt greb om pungen og drager indholdet til dig.", guldAendring: 35 },
                { log: "En edderkop bider din hånd derinde. Det gør ondt, men du får guldet ud.", hpAendring: -5, guldAendring: 40 }
            ]},
            { tekst: "Vip pungen ud med sablen", kraeverItem: 'sabel', udfaldListe: [{ log: "Klingen vipper læderposen ned på fliserne, så du undgår mørket i muren.", guldAendring: 50 }] },
            { tekst: "Læg mønter i hullet for at løsne stenen", puljeVaerdi: 15, udfaldListe: [{ log: "Stenen ruller fri under vægten, og hele posen dumper ned i armene på dig.", guldAendring: 65 }] }
        ]
    },

    'tabt_udstyr': {
        id: 'tabt_udstyr', titel: "Efterladt Grej", biome: ['skov', 'blodskov'], unik: false,
        tekst: "En rygsæk er smidt på jorden. Den ser ud til at være flænset op af et dyr.",
        valg: [
            { tekst: "Rod i lommerne i en fart", udfaldListe: [
                { log: "Du fylder dine lommer og stikker af, før dyret kommer tilbage.", guldAendring: 35 },
                { log: "Du river din hånd på et skarpt spænde i farten, men byttet tages.", hpAendring: -2, guldAendring: 40 }
            ]},
            { tekst: "Brug rustningen som forsvar, mens du tømmer den", kraeverItem: 'rustning', udfaldListe: [{ log: "Panseret giver dig ro. Du afsøger tasken metodisk og finder hver en mønt.", guldAendring: 45 }] },
            { tekst: "Brug detektoren over spænderne", kraeverItem: 'metaldetektor', udfaldListe: [{ log: "Scanneren leder dig direkte til den dyreste lomme i stoffet. God fangst.", guldAendring: 55 }] }
        ]
    },

    'soelvmurens_rest': {
        id: 'soelvmurens_rest', titel: "Markedets Støv", biome: ['marked', 'by'], unik: false,
        tekst: "Et forladt markedstelt er styrtet sammen. Mønter ligger dækket af et tykt lag snavs og lærred.",
        valg: [
            { tekst: "Saml pengene en for en under lærredet", udfaldListe: [
                { log: "Du støver jorden af og tager det med dig, som du finder.", guldAendring: 30 },
                { log: "Tykket støv får dig til at nyse ubehageligt, men du piller mønterne op.", hpAendring: -2, guldAendring: 35 }
            ]},
            { tekst: "Skovl jorden væk og saml bunken", kraeverItem: 'skovl', udfaldListe: [{ log: "Du blotlægger det hele og skovler mønterne nemt over i tasken.", guldAendring: 45 }] },
            { tekst: "Sæt ild til dugen for overblik", kosterItem: 'fakkel', udfaldListe: [{ log: "Flammen rydder teltdugen. Det efterlader mønterne åbne på jorden til din fornøjelse.", guldAendring: 55 }] }
        ]
    }
};