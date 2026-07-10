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
    'hav': 5, 'soe': 5, 'meteor': 3
};

export const markedVarePool = ['skovl', 'livseliksir', 'klude', 'kniv', 'koelle', 'metaldetektor', 'soegekvist', 'fakkel', 'sovepose', 'mad', 'hemmelighed'];

export const itemDB: Record<string, { id: string; navn: string; type: ItemType; billede: string; pris: number; kanKoebes?: boolean; moveMod?: number; dmgMod?: number; synsMod?: number; energiMod?: number; goldMod?: number; beskrivelse?: string }> = {
    'klude': { id: 'klude', navn: 'Tøj', type: 'tøj', billede: '/inventory/klude.webp', pris: 10, dmgMod: -0.05, beskrivelse: "Beskytter dig en smule og reducerer al skade med 5%." },
    'rustning': { id: 'rustning', navn: 'Rustning', type: 'tøj', billede: '/inventory/rustning.webp', pris: 150, moveMod: 1, dmgMod: -0.50, beskrivelse: "Halverer al skade. Vægten koster normalt 1 ekstra energi pr. skridt, men Ridder og Skjoldmø mærker den ikke og undgår samtidig nedgravede fælder. Rustningen synker og går tabt i vand." },
    'kongepanser': { id: 'kongepanser', navn: 'Kongepanser', type: 'tøj', billede: '/inventory/rustning_upgr.webp', pris: 400, kanKoebes: false, moveMod: 1, dmgMod: -0.70, beskrivelse: "Reducerer al skade med 70%. Vægten koster normalt 1 ekstra energi pr. skridt, men Ridder og Skjoldmø mærker den ikke og undgår samtidig nedgravede fælder. Panseret synker og går tabt i vand." },
    'rustning_elver': { id: 'rustning_elver', navn: 'Elverrustning', type: 'tøj', billede: '/inventory/rustning_elver.webp', pris: 900, kanKoebes: false, dmgMod: -0.50, beskrivelse: "Halverer al skade uden at koste ekstra energi. Ridder og Skjoldmø undgår også nedgravede fælder, når de bærer den. Kan ikke købes." },
    'flot_toej': { id: 'flot_toej', navn: 'Fint tøj', type: 'tøj', billede: '/inventory/flot_toej.webp', pris: 120, dmgMod: -0.05, goldMod: 0.15, beskrivelse: "Giver 15% mere guld og en smule beskyttelse. Kan blive ødelagt i huler og blodskov." },
    'royalt_toej': { id: 'royalt_toej', navn: 'Royalt tøj', type: 'tøj', billede: '/inventory/fint_toej_upgr.webp', pris: 620, kanKoebes: false, dmgMod: -0.10, goldMod: 0.40, beskrivelse: "Giver 40% mere guld og bedre beskyttelse end fint tøj. Bliver det flænset i en hule eller blodskov, ender det som almindeligt fint tøj." },
    'kniv': { id: 'kniv', navn: 'Kniv', type: 'våben', billede: '/inventory/kniv.webp', pris: 40, beskrivelse: "Et enkelt våben, som også åbner særlige valg i nogle hændelser." },
    'mesterkniv': { id: 'mesterkniv', navn: 'Mesterkniv', type: 'våben', billede: '/inventory/kniv_upgr.webp', pris: 190, kanKoebes: false, beskrivelse: "Åbner de samme valg som en almindelig kniv, men giver mere guld og mindre skade ved knivvalg i hændelser." },
    'dirk': { id: 'dirk', navn: 'Dirk', type: 'værktøj', billede: '/inventory/dirk.webp', pris: 50, kanKoebes: false, beskrivelse: "Bruges til at bryde ind i tomme byfelter." },
    'mesterdirk': { id: 'mesterdirk', navn: 'Mesterdirk', type: 'værktøj', billede: '/inventory/dirk_upgr.webp', pris: 150, kanKoebes: false, beskrivelse: "Åbner de samme indbrud som en almindelig dirk og giver dobbelt så meget guld." },
    'stav': { id: 'stav', navn: 'Stav', type: 'våben', billede: '/inventory/stav.webp', pris: 100, beskrivelse: "Flytter dig 4 felter mod øst til din normale energipris. Landingsfeltet aktiveres som normalt. Står du på krystal, viser staven krystalfelter op til 4 felter væk." },
    'dragestav': { id: 'dragestav', navn: 'Dragestav', type: 'våben', billede: '/inventory/stav_upgr.webp', pris: 300, kanKoebes: false, beskrivelse: "Flytter dig 5 felter mod øst og afslører ruten undervejs. Ender springet i åbent vand, lander du på det sidste sikre felt, og dragestaven bliver til en almindelig stav. På krystal viser den krystalfelter op til 5 felter væk." },
    'bue': { id: 'bue', navn: 'Bue', type: 'våben', billede: '/inventory/bue.webp', pris: 60, beskrivelse: "Åbner særlige valg i hændelser, hvor afstand gør en forskel." },
    'mesterbue': { id: 'mesterbue', navn: 'Falkebue', type: 'våben', billede: '/inventory/bue_upgr.webp', pris: 235, kanKoebes: false, beskrivelse: "Åbner de samme valg som en almindelig bue, men giver mere guld og mindre skade. Når du går, afslører den et lille område lige foran dit synsfelt." },
    'oekse': { id: 'oekse', navn: 'Økse', type: 'våben', billede: '/inventory/oekse.webp', pris: 80, beskrivelse: "Et tungt våben, som åbner særlige valg i nogle hændelser." },
    'stormoekse': { id: 'stormoekse', navn: 'Stormøkse', type: 'våben', billede: '/inventory/oekse_upgr.webp', pris: 255, kanKoebes: false, beskrivelse: "Åbner de samme valg som en almindelig økse, men rydder forhindringer i ét hug og giver derfor mere guld og mindre skade." },
    'koelle': { id: 'koelle', navn: 'Kølle', type: 'våben', billede: '/inventory/koelle.webp', pris: 150, beskrivelse: "Kan smadre markeder og almindelige byfelter til ruiner. Det koster meget energi og HP." },
    'koelle_upgr': { id: 'koelle_upgr', navn: 'Murknuser', type: 'våben', billede: '/inventory/koelle_upgr.webp', pris: 275, kanKoebes: false, beskrivelse: "Kan også smadre værksteder og tømme feltets pengekasse. Det koster stadig meget energi og HP." },
    'svaerd': { id: 'svaerd', navn: 'Sværd', type: 'våben', billede: '/inventory/svaerd.webp', pris: 80, beskrivelse: "Et alsidigt våben, som åbner særlige valg i flere hændelser." },
    'sabel': { id: 'sabel', navn: 'Sabel', type: 'våben', billede: '/inventory/sabel.webp', pris: 60, beskrivelse: "Et let våben, som åbner særlige valg i nogle hændelser." },
    'skovl': { id: 'skovl', navn: 'Skovl', type: 'værktøj', billede: '/inventory/skovl.webp', pris: 60, beskrivelse: "Lader dig grave efter guld og helende rødder. Det er dyrere og farligere at grave med hænderne." },
    'mesterskovl': { id: 'mesterskovl', navn: 'Mesterskovl', type: 'værktøj', billede: '/inventory/skovl_upgr.webp', pris: 210, kanKoebes: false, beskrivelse: "Giver dobbelt så meget guld ved gravning og udløser ikke nedgravede fælder." },
    'metaldetektor': { id: 'metaldetektor', navn: 'Detektor', type: 'værktøj', billede: '/inventory/detector.webp', pris: 150, beskrivelse: "Viser skjult guld på kendte felter op til 3 felter væk. Går du ind på et krystalfelt, kortslutter den og går tabt." },
    'malmviser': { id: 'malmviser', navn: 'Malmviser', type: 'værktøj', billede: '/inventory/detector_upgr.webp', pris: 400, kanKoebes: false, beskrivelse: "Viser skjult guld på kendte felter op til 3 felter væk og guldminer gennem bjerge op til 2 felter væk. Du får desuden 25% mere skjult guld ved gravning. På krystal bliver den til en almindelig detektor." },
    'soegekvist': { id: 'soegekvist', navn: 'Søgekvist', type: 'værktøj', billede: '/inventory/oenskekvist.webp', pris: 150, beskrivelse: "Viser helende rødder på kendte felter op til 3 felter væk. Går tabt på ritualfelter." },
    'runekvist': { id: 'runekvist', navn: 'Runekvist', type: 'værktøj', billede: '/inventory/oenskekvist_upgr.webp', pris: 325, kanKoebes: false, beskrivelse: "Viser helende rødder op til 3 felter væk. Mangler du HP, trækker den automatisk en skjult rod op, når du træder ind på feltet. Det koster 1 energi og tømmer feltet uden at grave det. På ritualfelter bliver den til en almindelig søgekvist." },
    'livseliksir': { id: 'livseliksir', navn: 'Livseliksir', type: 'forbrug', billede: '/inventory/livseliksir.webp', pris: 400, beskrivelse: "Bruges automatisk ved dødelig skade. Du overlever med op til 90 HP." },
    'fakkel': { id: 'fakkel', navn: 'Fakkel', type: 'værktøj', billede: '/inventory/fakkel.webp', pris: 150, synsMod: 1, beskrivelse: "Udvider dit synsfelt med 1. Du kan bruge den til et stort bål, som alle kan se. Bålet giver dig fuld HP og 50 guld. Faklen går tabt i vand." },
    'solfakkel': { id: 'solfakkel', navn: 'Solfakkel', type: 'værktøj', billede: '/inventory/fakkel_upgr.webp', pris: 375, kanKoebes: false, synsMod: 2, beskrivelse: "Udvider dit synsfelt med 2. Du kan bruge den til et solbål, som afslører et større område og giver dig fuld HP og 100 guld. Solfaklen går tabt i vand." },
    'sovepose': { id: 'sovepose', navn: 'Sovepose', type: 'værktøj', billede: '/inventory/sovepose.webp', pris: 80, beskrivelse: "Lader dig slå lejr i vildmarken og få 20 HP. Det bruger resten af din energi. Fugtige huler ødelægger soveposen med det samme." },
    'silkesovepose': { id: 'silkesovepose', navn: 'Silkesovepose', type: 'værktøj', billede: '/inventory/sovepose_upgr.webp', pris: 230, kanKoebes: false, beskrivelse: "Lader dig slå lejr i vildmarken og få 40 HP. I en fugtig hule bliver den til en almindelig sovepose i stedet for at gå helt tabt." },
    'mad': { id: 'mad', navn: 'Madration', type: 'forbrug', billede: '/inventory/food.webp', pris: 30, beskrivelse: "Giver +20 HP, og din næste bevægelse koster 0 energi. Kan gå tabt i ruiner." },
    'kikkert_250': { id: 'kikkert_250', navn: 'Gylden Kikkert', type: 'forbandelse', billede: '/inventory/kikkert.webp', pris: 100, beskrivelse: "Går i stykker, hvis du træder ind på et krystalfelt." },
    'kikkert_45': { id: 'kikkert_45', navn: 'Gylden Kikkert', type: 'forbandelse', billede: '/inventory/kikkert.webp', pris: 100, beskrivelse: "Går i stykker, hvis du træder ind på et krystalfelt." },
    'diamant': { id: 'diamant', navn: 'Diamant', type: 'skat', billede: '/inventory/diamant.webp', pris: 500, beskrivelse: "En sjælden ædelsten til 250-600 guld. Værdien afhænger af diamantens størrelse." },
    'gylden_destillator': { id: 'gylden_destillator', navn: 'Gylden Destillator', type: 'skat', billede: '/inventory/goldenhance.webp', pris: 700, kanKoebes: false, beskrivelse: "Et relikvie, der fordobler alt guld, du graver op. Sammen med mesterskovlen bliver guldet tredoblet, ikke firedoblet." },
    'rodhjertet': { id: 'rodhjertet', navn: 'Rodhjertet', type: 'skat', billede: '/inventory/rootenhance.webp', pris: 500, kanKoebes: false, beskrivelse: "Et relikvie, der fordobler al heling fra rødder – både ved gravning og når runekvisten trækker dem op." },
    'hemmelighed': { id: 'hemmelighed', navn: 'Skattekort', type: 'forbrug', billede: '/inventory/treasuremap.webp', pris: 100, beskrivelse: "Peger mod et område med en nedgravet skat. Nogle øer gemmer på mere end én." }
}

export const tilgaengeligeKarakterer: Karakter[] = [
    { id: 'knight_m', navn: "Ridder", ikon: "/game_faces/knight_m.webp", startMsg: "Robust og godt beskyttet.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 0.9, goldMod: 1.0, fordel: "Ordenen: Du tager 10% mindre skade, mærker ikke rustningens vægt og undgår nedgravede fælder.", ulempe: "Du starter uden guld og ser kun 1 felt. Det koster 5 energi at grave, og rustningen går tabt i vand.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'knight_f', navn: "Skjoldmø", ikon: "/game_faces/knight_f.webp", startMsg: "Robust og godt beskyttet.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 0.9, goldMod: 1.0, fordel: "Ordenen: Du tager 10% mindre skade, mærker ikke rustningens vægt og undgår nedgravede fælder.", ulempe: "Du starter uden guld og ser kun 1 felt. Det koster 5 energi at grave, og rustningen går tabt i vand.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'magician_m', navn: "Troldmand", ikon: "/game_faces/magician_m.webp", startMsg: "Mobil magi med en nødplan.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir', 'sovepose'], moveCost: 1, digCost: 7, dmgMod: 1.5, goldMod: 1.0, fordel: "Magikere: Staven flytter dig mod øst. Krystaller heler dig og lader staven afsløre andre krystalfelter.", ulempe: "Du starter med 80 HP og uden guld, tager 50% mere skade og bruger 7 energi på at grave. Der er ikke meget plads til fejl.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'krystal': -2 } },
    { id: 'magician_f', navn: "Vølve", ikon: "/game_faces/magician_f.webp", startMsg: "Mobil magi med en nødplan.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir', 'sovepose'], moveCost: 1, digCost: 7, dmgMod: 1.5, goldMod: 1.0, fordel: "Magikere: Staven flytter dig mod øst. Krystaller heler dig og lader staven afsløre andre krystalfelter.", ulempe: "Du starter med 80 HP og uden guld, tager 50% mere skade og bruger 7 energi på at grave. Der er ikke meget plads til fejl.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'krystal': -2 } },
    { id: 'thief_m', navn: "Tyv", ikon: "/game_faces/thief_m.webp", startMsg: "Hurtig, rig og klar til indbrud.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'dirk', 'klude', 'sovepose'], moveCost: 1, digCost: 4, dmgMod: 1.2, goldMod: 1.1, fordel: "Lovløse: Du kan bryde ind i tomme byfelter med en dirk og får 10% mere ud af alt guld.", ulempe: "Du tager 20% mere skade og ser kun 1 felt. Det koster 4 energi at grave.", baseEnergi: 9, synsRadius: 1, biomeMod: { 'bandit': -2 } },
    { id: 'thief_f', navn: "Skygge", ikon: "/game_faces/thief_f.webp", startMsg: "Hurtig, rig og klar til indbrud.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'dirk', 'klude', 'sovepose'], moveCost: 1, digCost: 4, dmgMod: 1.2, goldMod: 1.1, fordel: "Lovløse: Du kan bryde ind i tomme byfelter med en dirk og får 10% mere ud af alt guld.", ulempe: "Du tager 20% mere skade og ser kun 1 felt. Det koster 4 energi at grave.", baseEnergi: 9, synsRadius: 1, biomeMod: { 'bandit': -2 } },
    { id: 'explorer_m', navn: "Opdager", ikon: "/game_faces/explorer_m.webp", startMsg: "Ser langt og graver billigt.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude', 'sovepose'], moveCost: 1, digCost: 3, dmgMod: 1.0, goldMod: 0.9, fordel: "Udforskere: Du ser længere end de fleste. Huler og ruiner koster 2 mindre energi, og du graver for kun 3.", ulempe: "Du starter uden guld og våben og får 10% mindre ud af alt guld. Du må bygge din økonomi ved at udforske og grave.", baseEnergi: 7, synsRadius: 2, biomeMod: { 'hule': -2, 'ruin': -2 } },
    { id: 'explorer_f', navn: "Eventyrer", ikon: "/game_faces/explorer_f.webp", startMsg: "Ser langt og graver billigt.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude', 'sovepose'], moveCost: 1, digCost: 3, dmgMod: 1.0, goldMod: 0.9, fordel: "Udforskere: Du ser længere end de fleste. Huler og ruiner koster 2 mindre energi, og du graver for kun 3.", ulempe: "Du starter uden guld og våben og får 10% mindre ud af alt guld. Du må bygge din økonomi ved at udforske og grave.", baseEnergi: 7, synsRadius: 2, biomeMod: { 'hule': -2, 'ruin': -2 } },
    { id: 'viking_m', navn: "Viking", ikon: "/game_faces/viking_m.webp", startMsg: "Stærk og sejlivet, men uden sovepose.", startHp: 140, startGuld: 100, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 4, dmgMod: 0.9, goldMod: 0.9, fordel: "Nordboere: Du tager 10% mindre skade. Når du bliver såret, kan bersærkergang gøre din næste energikrævende handling gratis.", ulempe: "Du starter uden sovepose og får 10% mindre ud af alt guld. Heling skal findes eller købes undervejs.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'viking_f', navn: "Valkyrie", ikon: "/game_faces/viking_f.webp", startMsg: "Stærk og sejlivet, men uden sovepose.", startHp: 140, startGuld: 100, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 4, dmgMod: 0.9, goldMod: 0.9, fordel: "Nordboere: Du tager 10% mindre skade. Når du bliver såret, kan bersærkergang gøre din næste energikrævende handling gratis.", ulempe: "Du starter uden sovepose og får 10% mindre ud af alt guld. Heling skal findes eller købes undervejs.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'royal_m', navn: "Hertug", ikon: "/game_faces/royal_m.webp", startMsg: "Rig fra start, men uden våben.", startHp: 100, startGuld: 500, startUdstyr: ['flot_toej', 'sovepose'], moveCost: 1, digCost: 9, dmgMod: 1.1, goldMod: 1.2, fordel: "Adel: Du får 20% mere guld og kan presse handlende på prisen. Når du møder andre spillere, opkræver du skat.", ulempe: "Du har kun 6 energi, tager 10% mere skade og starter uden våben. Gravning koster hele 9 energi.", baseEnergi: 6, synsRadius: 1 },
    { id: 'royal_f', navn: "Dronning", ikon: "/game_faces/royal_f.webp", startMsg: "Rig fra start, men uden våben.", startHp: 100, startGuld: 500, startUdstyr: ['flot_toej', 'sovepose'], moveCost: 1, digCost: 9, dmgMod: 1.1, goldMod: 1.2, fordel: "Adel: Du får 20% mere guld og kan presse handlende på prisen. Når du møder andre spillere, opkræver du skat.", ulempe: "Du har kun 6 energi, tager 10% mere skade og starter uden våben. Gravning koster hele 9 energi.", baseEnergi: 6, synsRadius: 1 },
    { id: 'hunter_m', navn: "Jæger", ikon: "/game_faces/hunter_m.webp", startMsg: "Ser langt og bevæger sig let i skov.", startHp: 90, startGuld: 20, startUdstyr: ['bue', 'klude', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 1.1, goldMod: 1.0, fordel: "Spejdere: Du ser længere end de fleste. Når du spiller med andre, kan du spore en spiller på samme felt i 20 dage.", ulempe: "Du starter med 90 HP og 20 guld og tager 10% mere skade. Gravning koster 5 energi.", baseEnergi: 8, synsRadius: 2, biomeMod: { 'skov': -2, 'blodskov': -2 } },
    { id: 'hunter_f', navn: "Skytte", ikon: "/game_faces/hunter_f.webp", startMsg: "Ser langt og bevæger sig let i skov.", startHp: 90, startGuld: 20, startUdstyr: ['bue', 'klude', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 1.1, goldMod: 1.0, fordel: "Spejdere: Du ser længere end de fleste. Når du spiller med andre, kan du spore en spiller på samme felt i 20 dage.", ulempe: "Du starter med 90 HP og 20 guld og tager 10% mere skade. Gravning koster 5 energi.", baseEnergi: 8, synsRadius: 2, biomeMod: { 'skov': -2, 'blodskov': -2 } },
    { id: 'pirate_m', navn: "Kaptajn", ikon: "/game_faces/pirate_m.webp", startMsg: "Tjener godt og bevæger sig let på vand.", startHp: 110, startGuld: 150, startUdstyr: ['sabel', 'klude', 'hemmelighed'], moveCost: 1, digCost: 4, dmgMod: 1.0, goldMod: 1.2, fordel: "Sørøvere: Du får 20% mere guld og starter med et skattekort. Når du spiller med andre, kan sabelen bruges til at røve udvalgte klasser.", ulempe: "Du starter uden sovepose og ser kun 1 felt. Du må finde eller købe din heling undervejs.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'hav': -3, 'soe': -1 } },
    { id: 'pirate_f', navn: "Korsar", ikon: "/game_faces/pirate_f.webp", startMsg: "Tjener godt og bevæger sig let på vand.", startHp: 110, startGuld: 150, startUdstyr: ['sabel', 'klude', 'hemmelighed'], moveCost: 1, digCost: 4, dmgMod: 1.0, goldMod: 1.2, fordel: "Sørøvere: Du får 20% mere guld og starter med et skattekort. Når du spiller med andre, kan sabelen bruges til at røve udvalgte klasser.", ulempe: "Du starter uden sovepose og ser kun 1 felt. Du må finde eller købe din heling undervejs.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'hav': -3, 'soe': -1 } },
    { id: 'dwarf_m', navn: "Dværg", ikon: "/game_faces/dwarf_m.webp", startMsg: "Graver billigt og trives i bjergene.", startHp: 130, startGuld: 80, startUdstyr: ['skovl', 'oekse', 'klude'], moveCost: 1.5, digCost: 2, dmgMod: 1.0, goldMod: 1.1, fordel: "Bjergfolk: Du graver for kun 2 energi, får 10% mere guld og bevæger dig let gennem bjerge og krystalfelter.", ulempe: "Hvert almindeligt skridt koster 1,5 energi. Du ser kun 1 felt og starter uden sovepose.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'bjerg': -3, 'krystal': -2 } },
    { id: 'dwarf_f', navn: "Graver", ikon: "/game_faces/dwarf_f.webp", startMsg: "Graver billigt og trives i bjergene.", startHp: 130, startGuld: 80, startUdstyr: ['skovl', 'oekse', 'klude'], moveCost: 1.5, digCost: 2, dmgMod: 1.0, goldMod: 1.1, fordel: "Bjergfolk: Du graver for kun 2 energi, får 10% mere guld og bevæger dig let gennem bjerge og krystalfelter.", ulempe: "Hvert almindeligt skridt koster 1,5 energi. Du ser kun 1 felt og starter uden sovepose.", baseEnergi: 7, synsRadius: 1, biomeMod: { 'bjerg': -3, 'krystal': -2 } },
    { id: 'orc_m', navn: "Ork", ikon: "/game_faces/orc_m.webp", startMsg: "Tåler meget og kan smadre handelssteder.", startHp: 150, startGuld: 0, startUdstyr: ['koelle'], moveCost: 1, digCost: 5, dmgMod: 0.8, goldMod: 0.8, fordel: "Klanfolk: Du tager 20% mindre skade og kan smadre byer og markeder med din kølle.", ulempe: "Du starter uden guld, tøj og sovepose og får 20% mindre ud af alt guld. Gravning koster 5 energi.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'orc_f', navn: "Kriger", ikon: "/game_faces/orc_f.webp", startMsg: "Tåler meget og kan smadre handelssteder.", startHp: 150, startGuld: 0, startUdstyr: ['koelle'], moveCost: 1, digCost: 5, dmgMod: 0.8, goldMod: 0.8, fordel: "Klanfolk: Du tager 20% mindre skade og kan smadre byer og markeder med din kølle.", ulempe: "Du starter uden guld, tøj og sovepose og får 20% mindre ud af alt guld. Gravning koster 5 energi.", baseEnergi: 8, synsRadius: 1, biomeMod: { 'slagmark': -2 } },
    { id: 'joker_m', navn: "Joker", ikon: "/game_faces/joker_m.webp", startMsg: "Stor gevinst, næsten ingen fejlmargin.", startHp: 50, startGuld: 1, startUdstyr: ['kniv'], moveCost: 1, digCost: 4, dmgMod: 2.0, goldMod: 1.5, fordel: "Fantaster: Du ser længere, får 50% mere guld og kan bluffe dig gennem valg i hændelser, der kræver udstyr eller bestemte karakterer.", ulempe: "Du starter med 50 HP og 1 guld, uden tøj eller sovepose, og tager dobbelt skade. Næsten enhver fejl kan blive den sidste.", baseEnergi: 7, synsRadius: 2 },
    { id: 'joker_f', navn: "Harlekin", ikon: "/game_faces/joker_f.webp", startMsg: "Stor gevinst, næsten ingen fejlmargin.", startHp: 50, startGuld: 1, startUdstyr: ['kniv'], moveCost: 1, digCost: 4, dmgMod: 2.0, goldMod: 1.5, fordel: "Fantaster: Du ser længere, får 50% mere guld og kan bluffe dig gennem valg i hændelser, der kræver udstyr eller bestemte karakterer.", ulempe: "Du starter med 50 HP og 1 guld, uden tøj eller sovepose, og tager dobbelt skade. Næsten enhver fejl kan blive den sidste.", baseEnergi: 7, synsRadius: 2 }
];

export const karakterKlasseNavne: Record<string, string> = {
    knight: 'Ordenen',
    magician: 'Magikere',
    thief: 'Lovløse',
    explorer: 'Udforskere',
    viking: 'Nordboere',
    royal: 'Adel',
    hunter: 'Spejdere',
    pirate: 'Sørøvere',
    dwarf: 'Bjergfolk',
    orc: 'Klanfolk',
    joker: 'Fantaster'
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
