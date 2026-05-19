import type { Karakter, Biome, ItemType } from './types';
import { HEX_W, ROW_H, STANDARD_KORT_BREDDE, STANDARD_KORT_HOEJDE } from './kortDimensioner';

export const BREDDE = STANDARD_KORT_BREDDE;
export const HOEJDE = STANDARD_KORT_HOEJDE;
export { HEX_W, ROW_H }; 

export const biomeVægte: Array<{ id: Biome; vaegt: number }> = [
    { id: 'mark', vaegt: 20 }, { id: 'eng', vaegt: 20 }, { id: 'skov', vaegt: 20 }, { id: 'bjerg', vaegt: 20 },
    { id: 'hule', vaegt: 3}, { id: 'ritual', vaegt: 3 }, { id: 'ruin', vaegt: 3 }, { id: 'bandit', vaegt: 3 },
    { id: 'hoejland', vaegt: 15 }, { id: 'blodskov', vaegt: 5 }, { id: 'soe', vaegt: 5 },
    { id: 'krystal', vaegt: 5 }, { id: 'slagmark', vaegt: 5 }
];

export const biomeTerraenCost: Record<Biome, number> = {
    'mark': 1, 'eng': 1, 'by': 0, 'marked': 0,
    'skov': 3, 'ruin': 3, 'ritual': 3, 'bandit': 2, 'hoejland': 2, 'slagmark': 2,
    'bjerg': 5, 'blodskov': 4, 'hule': 4, 'krystal': 4,
    'hav': 5, 'soe': 5, 'meteor': 1
};

export const markedVarePool = ['skovl', 'livseliksir', 'klude', 'kniv', 'koelle', 'metaldetektor', 'soegekvist', 'fakkel', 'sovepose', 'mad', 'hemmelighed'];

export const itemDB: Record<string, { id: string; navn: string; type: ItemType; billede: string; pris: number; kanKoebes?: boolean; moveMod?: number; dmgMod?: number; synsMod?: number; energiMod?: number; goldMod?: number; beskrivelse?: string }> = {
    'klude': { id: 'klude', navn: 'Klude', type: 'tøj', billede: '/inventory/klude.webp', pris: 10, dmgMod: -0.05, beskrivelse: "Giver en smule beskyttelse. Du tager 5% mindre skade." },
    'rustning': { id: 'rustning', navn: 'Rustning', type: 'tøj', billede: '/inventory/rustning.webp', pris: 150, moveMod: 1, dmgMod: -0.50, beskrivelse: "Halverer al skade, men den tunge vægt koster dig 1 energi pr. skridt. Ridder med rustning tager ingen skade fra nedgravede fælder. Synker til bunds og forsvinder, hvis du går i vandet." },
    'kongepanser': { id: 'kongepanser', navn: 'Kongepanser', type: 'tøj', billede: '/inventory/rustning_upgr.webp', pris: 400, kanKoebes: false, moveMod: 1, dmgMod: -0.70, beskrivelse: "Opgraderet rustning. Reducerer skade med 70%, men den tunge vægt koster stadig 1 energi pr. skridt. Ridder med panser tager ingen skade fra nedgravede fælder. Synker til bunds og forsvinder, hvis du går i vandet." },
    'rustning_elver': { id: 'rustning_elver', navn: 'Elverrustning', type: 'tøj', billede: '/inventory/rustning_elver.webp', pris: 900, kanKoebes: false, dmgMod: -0.50, beskrivelse: "Halverer al skade som almindelig rustning, men vejer ingenting. Ridder med rustning tager ingen skade fra nedgravede fælder. Kan ikke købes." },
    'flot_toej': { id: 'flot_toej', navn: 'Fint tøj', type: 'tøj', billede: '/inventory/flot_toej.webp', pris: 120, dmgMod: -0.05, goldMod: 0.15, beskrivelse: "Øger al guldindkomst med 15%. Kan blive ødelagt i huler og blodskov." },
    'royalt_toej': { id: 'royalt_toej', navn: 'Royalt tøj', type: 'tøj', billede: '/inventory/fint_toej_upgr.webp', pris: 620, kanKoebes: false, dmgMod: -0.10, goldMod: 0.40, beskrivelse: "Opgraderet fint tøj. Øger al guldindkomst med 40% og giver lidt bedre beskyttelse. Hvis det bliver flænset i huler eller blodskov, bliver det til almindeligt fint tøj." },
    'kniv': { id: 'kniv', navn: 'Kniv', type: 'våben', billede: '/inventory/kniv.webp', pris: 40, beskrivelse: "Et simpelt våben. Bruges også i enkelte events." },
    'mesterkniv': { id: 'mesterkniv', navn: 'Mesterkniv', type: 'våben', billede: '/inventory/kniv_upgr.webp', pris: 190, kanKoebes: false, beskrivelse: "Opgraderet kniv. Tæller som kniv i events. Knivvalg giver bedre udbytte: mere guld og mindre skade." },
    'dirk': { id: 'dirk', navn: 'Dirk', type: 'værktøj', billede: '/inventory/dirk.webp', pris: 0, beskrivelse: "Tyveværktøj. Kan bruges til indbrud på tomme byfelter." },
    'mesterdirk': { id: 'mesterdirk', navn: 'Mesterdirk', type: 'værktøj', billede: '/inventory/dirk_upgr.webp', pris: 150, kanKoebes: false, beskrivelse: "Opgraderet dirk. Tæller som dirk og giver dobbelt guld ved indbrud." },
    'stav': { id: 'stav', navn: 'Stav', type: 'våben', billede: '/inventory/stav.webp', pris: 100, beskrivelse: "Kan teleportere dig 4 felter mod øst. Koster base-energi. Feltet aktiveres som normalt." },
    'dragestav': { id: 'dragestav', navn: 'Dragestav', type: 'våben', billede: '/inventory/stav_upgr.webp', pris: 300, kanKoebes: false, beskrivelse: "Opgraderet stav. Teleporterer dig 5 felter mod øst og afslører ruten imellem. Hvis den ville sende dig i åbent vand, redder den dig til sidste sikre felt og bliver til en almindelig stav." },
    'bue': { id: 'bue', navn: 'Bue', type: 'våben', billede: '/inventory/bue.webp', pris: 60, beskrivelse: "Et våben til events, hvor afstand betyder noget." },
    'mesterbue': { id: 'mesterbue', navn: 'Falkebue', type: 'våben', billede: '/inventory/bue_upgr.webp', pris: 235, kanKoebes: false, beskrivelse: "Opgraderet bue. Tæller som bue i events. Buevalg giver lidt mere guld, mindre skade og afslører tre felter mod øst efter skuddet." },
    'oekse': { id: 'oekse', navn: 'Økse', type: 'våben', billede: '/inventory/oekse.webp', pris: 80, beskrivelse: "Et tungt våben. Bruges i enkelte events." },
    'stormoekse': { id: 'stormoekse', navn: 'Stormøkse', type: 'våben', billede: '/inventory/oekse_upgr.webp', pris: 255, kanKoebes: false, beskrivelse: "Opgraderet økse. Tæller som økse i events. Øksevalg giver mere guld og mindre skade, fordi den kan hugge forhindringer væk i ét slag." },
    'koelle': { id: 'koelle', navn: 'Kølle', type: 'våben', billede: '/inventory/koelle.webp', pris: 150, beskrivelse: "Et brutalt våben. Kan smadre markeder og almindelige byfelter til ruiner for meget energi og HP." },
    'koelle_upgr': { id: 'koelle_upgr', navn: 'Murknuser', type: 'våben', billede: '/inventory/koelle_upgr.webp', pris: 275, kanKoebes: false, beskrivelse: "Opgraderet kølle. Kan også smadre værksteder og tømme feltets pengekasse, men det koster hårdt i energi og HP." },
    'svaerd': { id: 'svaerd', navn: 'Sværd', type: 'våben', billede: '/inventory/svaerd.webp', pris: 80, beskrivelse: "Et alsidigt våben. Bruges i flere events." },
    'sabel': { id: 'sabel', navn: 'Sabel', type: 'våben', billede: '/inventory/sabel.webp', pris: 60, beskrivelse: "Et let våben. Bruges i enkelte events." },
    'skovl': { id: 'skovl', navn: 'Skovl', type: 'værktøj', billede: '/inventory/skovl.webp', pris: 60, beskrivelse: "Lader dig grave guld og helende rødder op. Uden skovl kan det blive dyrt at grave." },
    'mesterskovl': { id: 'mesterskovl', navn: 'Mesterskovl', type: 'værktøj', billede: '/inventory/skovl_upgr.webp', pris: 210, kanKoebes: false, beskrivelse: "Opgraderet skovl. Giver dobbelt guld ved gravning og udløser ikke nedgravede fælder." },
    'metaldetektor': { id: 'metaldetektor', navn: 'Detektor', type: 'værktøj', billede: '/inventory/detector.webp', pris: 150, beskrivelse: "Viser skjult guld på kendte felter inden for radius 3. Går du ind i et krystalfelt kortslutter den og bliver ødelagt." },
    'malmviser': { id: 'malmviser', navn: 'Malmviser', type: 'værktøj', billede: '/inventory/detector_upgr.webp', pris: 400, kanKoebes: false, beskrivelse: "Opgraderet detektor. Viser skjult guld på kendte felter inden for radius 3, afslører guldminer inden for radius 2 gennem bjerge og giver 25% mere skjult guld, når du graver det frem. Krystaller nedgraderer den til en almindelig detektor." },
    'soegekvist': { id: 'soegekvist', navn: 'Søgekvist', type: 'værktøj', billede: '/inventory/oenskekvist.webp', pris: 150, beskrivelse: "Viser helende rødder på kendte felter inden for radius 3. Går tabt på ritual-felter." },
    'runekvist': { id: 'runekvist', navn: 'Runekvist', type: 'værktøj', billede: '/inventory/oenskekvist_upgr.webp', pris: 325, kanKoebes: false, beskrivelse: "Opgraderet søgekvist. Viser helende rødder inden for radius 3 og trækker automatisk skjult liv op, når du mangler HP og går ind på feltet. Koster 1 energi og efterlader feltet ugravet, men tomt." },
    'livseliksir': { id: 'livseliksir', navn: 'Livseliksir', type: 'forbrug', billede: '/inventory/livseliksir.webp', pris: 500, beskrivelse: "Drikkes automatisk, hvis du får dødelig skade. Heler dig maksimalt tilbage til 90 HP." },
    'fakkel': { id: 'fakkel', navn: 'Fakkel', type: 'værktøj', billede: '/inventory/fakkel.webp', pris: 150, synsMod: 1, beskrivelse: "Udvider dit synsfelt med +1. Kan bruges til store lejrbål, som alle kan se. Den der tænder bålet får fuld HP og 50 guld. Går tabt i vandet." },
    'solfakkel': { id: 'solfakkel', navn: 'Solfakkel', type: 'værktøj', billede: '/inventory/fakkel_upgr.webp', pris: 375, kanKoebes: false, synsMod: 2, beskrivelse: "Opgraderet fakkel. Udvider synsfeltet med +2. Kan bruges til et større solbål, som afslører et større område, giver fuld HP og 100 guld. Går tabt i vandet." },
    'sovepose': { id: 'sovepose', navn: 'Sovepose', type: 'værktøj', billede: '/inventory/sovepose.webp', pris: 80, beskrivelse: "Slå lejr i vildmarken og få 20 HP (koster resten af din energi). Fugt i huler får den til at rådne med det samme." },
    'silkesovepose': { id: 'silkesovepose', navn: 'Silkesovepose', type: 'værktøj', billede: '/inventory/sovepose_upgr.webp', pris: 230, kanKoebes: false, beskrivelse: "Opgraderet sovepose. Slå lejr i vildmarken og få 40 HP. Fugt i huler ødelægger foret, så den bliver til en almindelig sovepose i stedet for at gå helt tabt." },
    'mad': { id: 'mad', navn: 'Madration', type: 'forbrug', billede: '/inventory/food.webp', pris: 30, beskrivelse: "Giver +20 HP, og din næste bevægelse koster 0 energi. Kan gå tabt i ruiner." },
    'kikkert_250': { id: 'kikkert_250', navn: 'Gylden Kikkert', type: 'forbandelse', billede: '/inventory/kikkert.webp', pris: 100, beskrivelse: "Går i stykker på krystal-felter." },
    'kikkert_45': { id: 'kikkert_45', navn: 'Gylden Kikkert', type: 'forbandelse', billede: '/inventory/kikkert.webp', pris: 100, beskrivelse: "Går i stykker på krystal-felter." },
    'diamant': { id: 'diamant', navn: 'Diamant', type: 'skat', billede: '/inventory/diamant.webp', pris: 500, beskrivelse: "En sjælden og værdifuld ædelsten, der nemt kan sælges." },
    'gylden_destillator': { id: 'gylden_destillator', navn: 'Gylden Destillator', type: 'skat', billede: '/inventory/goldenhance.webp', pris: 700, kanKoebes: false, beskrivelse: "Relikvie. Opgravet guld er dobbelt værd. Sammen med mesterskovl bliver graveguld tredoblet i stedet for firedoblet." },
    'rodhjertet': { id: 'rodhjertet', navn: 'Rodhjertet', type: 'skat', billede: '/inventory/rootenhance.webp', pris: 500, kanKoebes: false, beskrivelse: "Relikvie. Helende rødder giver dobbelt HP, både ved gravning og når Runekvisten trækker dem op." },
    'hemmelighed': { id: 'hemmelighed', navn: 'Skattekort', type: 'forbrug', billede: '/inventory/treasuremap.webp', pris: 100, beskrivelse: "Et gammelt skattekort. Nogle øer kan gemme på flere skatte." }
}

export const tilgaengeligeKarakterer: Karakter[] = [
    { id: 'knight_m', navn: "Ridder", ikon: "/game_faces/knight_m.webp", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning', 'sovepose'], moveCost: 1, digCost: 6, dmgMod: 0.9, goldMod: 1.0, fordel: "Starter med sværd og rustning. Ridder med rustning undgår nedgravede fælder.", ulempe: "Tungt udstyr gør dig langsom.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'knight_f', navn: "Skjoldmø", ikon: "/game_faces/knight_f.webp", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning', 'sovepose'], moveCost: 1, digCost: 6, dmgMod: 0.9, goldMod: 1.0, fordel: "Starter med sværd og rustning. Ridder med rustning undgår nedgravede fælder.", ulempe: "Tungt udstyr gør dig langsom.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'magician_m', navn: "Troldmand", ikon: "/game_faces/magician_m.webp", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir', 'sovepose'], moveCost: 1, digCost: 8, dmgMod: 1.5, goldMod: 1.0, fordel: "Starter med en livseliksir og en stav.", ulempe: "Starter uden guld og tager +50% skade.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'krystal': -2 } },  
    { id: 'magician_f', navn: "Troldkvinde", ikon: "/game_faces/magician_f.webp", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir', 'sovepose'], moveCost: 1, digCost: 8, dmgMod: 1.5, goldMod: 1.0, fordel: "Starter med en livseliksir og en stav.", ulempe: "Starter uden guld og tager +50% skade.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'krystal': -2 } },
    { id: 'thief_m', navn: "Tyv", ikon: "/game_faces/thief_m.webp", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'dirk', 'klude', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.1, fordel: "Hurtig og udstyret med kniv og dirk.", ulempe: "Tager mere skade.", baseEnergi: 9, synsRadius: 1, biomeMod: { 'bandit': -2 } },
    { id: 'thief_f', navn: "Skygge", ikon: "/game_faces/thief_f.webp", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'dirk', 'klude', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.1, fordel: "Hurtig og udstyret med kniv og dirk.", ulempe: "Tager mere skade.", baseEnergi: 9, synsRadius: 1, biomeMod: { 'bandit': -2 } },
    { id: 'explorer_m', navn: "Udforsker", ikon: "/game_faces/explorer_m.webp", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude', 'sovepose'], moveCost: 1, digCost: 3, dmgMod: 1.0, goldMod: 0.9, fordel: "Kan se langt og starter med en skovl.", ulempe: "Mangler våben fra start.", baseEnergi: 7, synsRadius: 2, biomeMod: { 'hule': -2, 'ruin': -2 } },
    { id: 'explorer_f', navn: "Eventyrer", ikon: "/game_faces/explorer_f.webp", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude', 'sovepose'], moveCost: 1, digCost: 3, dmgMod: 1.0, goldMod: 0.9, fordel: "Kan se langt og starter med en skovl.", ulempe: "Mangler våben fra start.", baseEnergi: 7, synsRadius: 2, biomeMod: { 'hule': -2, 'ruin': -2 } },
    { id: 'viking_m', navn: "Viking", ikon: "/game_faces/viking_m.webp", startMsg: "Du starter stærkt, men uden sovepose.", startHp: 150, startGuld: 100, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 0.9, goldMod: 1.0, fordel: "Høj HP og økse. Første gang pr. dag du tager mindst 5 skade, koster næste bevægelse 0 energi.", ulempe: "Starter uden sovepose.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'viking_f', navn: "Valkyrie", ikon: "/game_faces/viking_f.webp", startMsg: "Du starter stærkt, men uden sovepose.", startHp: 150, startGuld: 100, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 0.9, goldMod: 1.0, fordel: "Høj HP og økse. Første gang pr. dag du tager mindst 5 skade, koster næste bevægelse 0 energi.", ulempe: "Starter uden sovepose.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'royal_m', navn: "Hertug", ikon: "/game_faces/royal_m.webp", startMsg: "Du starter med mange penge og intet våben.", startHp: 100, startGuld: 500, startUdstyr: ['flot_toej', 'sovepose'], moveCost: 1, digCost: 10, dmgMod: 1.1, goldMod: 1.2, fordel: "Meget guld og fint tøj.", ulempe: "Intet våben. Gravning koster mere HP.", baseEnergi: 6, synsRadius: 1 },
    { id: 'royal_f', navn: "Hertuginde", ikon: "/game_faces/royal_f.webp", startMsg: "Du starter med mange penge og intet våben.", startHp: 100, startGuld: 500, startUdstyr: ['flot_toej', 'sovepose'], moveCost: 1, digCost: 10, dmgMod: 1.1, goldMod: 1.2, fordel: "Meget guld og fint tøj.", ulempe: "Intet våben. Gravning koster mere HP.", baseEnergi: 6, synsRadius: 1 },
    { id: 'hunter_m', navn: "Jæger", ikon: "/game_faces/hunter_m.webp", startMsg: "Hold afstand til byttet.", startHp: 90, startGuld: 20, startUdstyr: ['bue', 'klude', 'sovepose'], moveCost: 1, digCost: 6, dmgMod: 1.1, goldMod: 1.0, fordel: "Starter med bue og højt syn.", ulempe: "Lav start-HP.", baseEnergi: 8, synsRadius: 2, biomeMod: { 'skov': -2, 'blodskov': -2 } },
    { id: 'hunter_f', navn: "Skytte", ikon: "/game_faces/hunter_f.webp", startMsg: "Hold afstand til byttet.", startHp: 90, startGuld: 20, startUdstyr: ['bue', 'klude', 'sovepose'], moveCost: 1, digCost: 6, dmgMod: 1.1, goldMod: 1.0, fordel: "Starter med bue og højt syn.", ulempe: "Lav start-HP.", baseEnergi: 8, synsRadius: 2, biomeMod: { 'skov': -2, 'blodskov': -2 } },
    { id: 'pirate_m', navn: "Kaptajn", ikon: "/game_faces/pirate_m.webp", startMsg: "Havet tog alt andet.", startHp: 110, startGuld: 150, startUdstyr: ['sabel', 'klude', 'hemmelighed'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.2, fordel: "Høj kapital, sabel og et skattekort.", ulempe: "Ingen sovepose.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'hav': -3, 'soe': -1 } },
    { id: 'pirate_f', navn: "Korsar", ikon: "/game_faces/pirate_f.webp", startMsg: "Havet tog alt andet.", startHp: 110, startGuld: 150, startUdstyr: ['sabel', 'klude', 'hemmelighed'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.2, fordel: "Høj kapital, sabel og et skattekort.", ulempe: "Ingen sovepose.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'hav': -3, 'soe': -1 } },
    { id: 'dwarf_m', navn: "Dværg", ikon: "/game_faces/dwarf_m.webp", startMsg: "Du graver effektivt, men bevæger dig langsomt.", startHp: 130, startGuld: 80, startUdstyr: ['skovl', 'oekse', 'klude'], moveCost: 1.5, digCost: 2, dmgMod: 1.0, goldMod: 1.3, fordel: "God til at grave og tjene guld.", ulempe: "Langsom at flytte.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'bjerg': -3, 'krystal': -2 } },
    { id: 'dwarf_f', navn: "Minegraver", ikon: "/game_faces/dwarf_f.webp", startMsg: "Du graver effektivt, men bevæger dig langsomt.", startHp: 130, startGuld: 80, startUdstyr: ['skovl', 'oekse', 'klude'], moveCost: 1.5, digCost: 2, dmgMod: 1.0, goldMod: 1.3, fordel: "God til at grave og tjene guld.", ulempe: "Langsom at flytte.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'bjerg': -3, 'krystal': -2 } },
    { id: 'orc_m', navn: "Ork", ikon: "/game_faces/orc_m.webp", startMsg: "Du starter med meget HP, kølle og lav guldindkomst.", startHp: 160, startGuld: 0, startUdstyr: ['koelle', 'klude'], moveCost: 1, digCost: 6, dmgMod: 0.8, goldMod: 0.8, fordel: "Meget HP, lav skade og kølle til at smadre civilisation.", ulempe: "Dårligere guldindkomst og smadring koster dyrebare dage.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'orc_f', navn: "Klanleder", ikon: "/game_faces/orc_f.webp", startMsg: "Du starter med meget HP, kølle og lav guldindkomst.", startHp: 160, startGuld: 0, startUdstyr: ['koelle', 'klude'], moveCost: 1, digCost: 6, dmgMod: 0.8, goldMod: 0.8, fordel: "Meget HP, lav skade og kølle til at smadre civilisation.", ulempe: "Dårligere guldindkomst og smadring koster dyrebare dage.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'joker_m', navn: "Joker", ikon: "/game_faces/joker_m.webp", startMsg: "Held er en strategi.", startHp: 50, startGuld: 1, startUdstyr: ['kniv'], moveCost: 1, digCost: 5, dmgMod: 2.0, goldMod: 1.5, fordel: "Guldbonus og godt syn.", ulempe: "Tyndt helbred og tager dobbelt skade.", baseEnergi: 7, synsRadius: 2 },
    { id: 'joker_f', navn: "Harlekin", ikon: "/game_faces/joker_f.webp", startMsg: "Held er en strategi.", startHp: 50, startGuld: 1, startUdstyr: ['kniv'], moveCost: 1, digCost: 5, dmgMod: 2.0, goldMod: 1.5, fordel: "Guldbonus og godt syn.", ulempe: "Tyndt helbred og tager dobbelt skade.", baseEnergi: 7, synsRadius: 2 }
];

export const karakterKlasseNavne: Record<string, string> = {
    knight: 'Ridder',
    magician: 'Troldfolk',
    thief: 'Tyv',
    explorer: 'Udforsker',
    viking: 'Viking',
    royal: 'Adel',
    hunter: 'Jæger',
    pirate: 'Pirat',
    dwarf: 'Dværg',
    orc: 'Ork',
    joker: 'Joker'
};

export function hentKarakterKlasseNoegle(karakter?: Pick<Karakter, 'id' | 'navn'> | string | null) {
    if (!karakter) return null;
    const idEllerNavn = typeof karakter === 'string' ? karakter : karakter.id || karakter.navn;
    const fundet = tilgaengeligeKarakterer.find((k) => k.id === idEllerNavn || k.navn === idEllerNavn);
    return (fundet?.id || idEllerNavn).split('_')[0] || null;
}

export function hentKarakterNavneIKlasse(klasseNoegle?: string | null) {
    if (!klasseNoegle) return [];
    return tilgaengeligeKarakterer
        .filter((karakter) => hentKarakterKlasseNoegle(karakter) === klasseNoegle)
        .map((karakter) => karakter.navn);
}

export function hentKarakterKlasseNavn(karakter?: Pick<Karakter, 'id' | 'navn'> | string | null) {
    const klasseNoegle = hentKarakterKlasseNoegle(karakter);
    return klasseNoegle ? karakterKlasseNavne[klasseNoegle] || klasseNoegle : 'Alle';
}
