// spildata.ts
import type { Karakter, Biome, ItemType } from './types';

export const BREDDE = 50;
export const HOEJDE = 20;
export const HEX_W = 96;  
export const ROW_H = 82; 

export const biomeVægte: Array<{ id: Biome; vaegt: number }> = [
    { id: 'mark', vaegt: 20 }, { id: 'eng', vaegt: 20 }, { id: 'skov', vaegt: 20 }, { id: 'bjerg', vaegt: 20 },
    { id: 'hule', vaegt: 2 }, { id: 'ritual', vaegt: 2 }, { id: 'ruin', vaegt: 2 }, { id: 'bandit', vaegt: 2 },
    { id: 'gen', vaegt: 15 }, { id: 'blodskov', vaegt: 5 }, { id: 'hav', vaegt: 10 },
    { id: 'krystal', vaegt: 5 }, { id: 'slagmark', vaegt: 5 }
];

export const biomeTerraenCost: Record<Biome, number> = {
    'mark': 1, 'eng': 1, 'by': 1, 'marked': 1,
    'skov': 1.5, 'ruin': 1.5, 'ritual': 1.5, 'bandit': 1.5, 'gen': 1.5, 'slagmark': 1.5,
    'bjerg': 2.5, 'blodskov': 2.5, 'hule': 2, 'krystal': 2,
    'hav': 3
};

// Sovepose er nu på markedet
export const markedVarePool = ['skovl', 'livseliksir', 'klude', 'kniv', 'metaldetektor', 'soegekvist', 'fakkel', 'sovepose'];

export const itemDB: Record<string, { id: string; navn: string; type: ItemType; billede: string; bonus: number; pris: number }> = {
    'klude': { id: 'klude', navn: 'Klude', type: 'tøj', billede: '/inventory/klude.webp', bonus: 0, pris: 10 },
    'rustning': { id: 'rustning', navn: 'Rustning', type: 'tøj', billede: '/inventory/rustning.webp', bonus: 0, pris: 150 },
    'flot_toej': { id: 'flot_toej', navn: 'Fint tøj', type: 'tøj', billede: '/inventory/flot_toej.webp', bonus: 0, pris: 120 },
    'kniv': { id: 'kniv', navn: 'Kniv', type: 'våben', billede: '/inventory/kniv.webp', bonus: 1, pris: 40 },
    'stav': { id: 'stav', navn: 'Stav', type: 'våben', billede: '/inventory/stav.webp', bonus: 1, pris: 40 },
    'bue': { id: 'bue', navn: 'Bue', type: 'våben', billede: '/inventory/bue.webp', bonus: 1, pris: 80 },
    'oekse': { id: 'oekse', navn: 'Økse', type: 'våben', billede: '/inventory/oekse.webp', bonus: 2, pris: 100 },
    'svaerd': { id: 'svaerd', navn: 'Sværd', type: 'våben', billede: '/inventory/svaerd.webp', bonus: 2, pris: 120 },
    'sabel': { id: 'sabel', navn: 'Sabel', type: 'våben', billede: '/inventory/sabel.webp', bonus: 2, pris: 100 },
    'skovl': { id: 'skovl', navn: 'Skovl', type: 'værktøj', billede: '/inventory/skovl.webp', bonus: 0, pris: 60 },
    'metaldetektor': { id: 'metaldetektor', navn: 'Detektor', type: 'værktøj', billede: '/inventory/detector.webp', bonus: 0, pris: 200 },
    'soegekvist': { id: 'soegekvist', navn: 'Søgekvist', type: 'værktøj', billede: '/inventory/oenskekvist.webp', bonus: 0, pris: 150 },
    'livseliksir': { id: 'livseliksir', navn: 'Livseliksir', type: 'forbrug', billede: '/inventory/livseliksir.webp', bonus: 0, pris: 500 },
    'fakkel': { id: 'fakkel', navn: 'Fakkel', type: 'værktøj', billede: '/inventory/fakkel.webp', bonus: 0, pris: 150 },
    'sovepose': { id: 'sovepose', navn: 'Sovepose', type: 'værktøj', billede: '/inventory/sovepose.webp', bonus: 0, pris: 100 },
    'kikkert_250': { id: 'kikkert_250', navn: 'Gylden Kikkert (Nær)', type: 'forbandelse', billede: '/inventory/kikkert.webp', bonus: 0, pris: 0 },
    'kikkert_45': { id: 'kikkert_45', navn: 'Gylden Kikkert (Fjern)', type: 'forbandelse', billede: '/inventory/kikkert.webp', bonus: 0, pris: 0 },
    'diamant': { id: 'diamant', navn: 'Diamant', type: 'skat', billede: '/inventory/diamant.webp', bonus: 0, pris: 500 }
}

export const tilgaengeligeKarakterer: Karakter[] = [
    { id: 'knight_m', navn: "Ridder", ikon: "/game_faces/knight_m.webp", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning', 'sovepose'], moveCost: 2, digCost: 6, dmgMod: 1.0, goldMod: 1.0, fordel: "Starter med sværd og rustning.", ulempe: "Koster mere at rykke sig.", baseEnergi: 6, synsRadius: 1 },
    { id: 'knight_f', navn: "Skjoldmø", ikon: "/game_faces/knight_f.webp", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning', 'sovepose'], moveCost: 2, digCost: 6, dmgMod: 1.0, goldMod: 1.0, fordel: "Starter med sværd og rustning.", ulempe: "Koster mere at rykke sig.", baseEnergi: 6, synsRadius: 1 },
    { id: 'magician_m', navn: "Troldmand", ikon: "/game_faces/magician_m.webp", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir', 'sovepose'], moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, fordel: "Starter med en livseliksir og en stav.", ulempe: "Starter uden guld og tager +50% skade.", baseEnergi: 7, synsRadius: 1 },
    { id: 'magician_f', navn: "Troldkvinde", ikon: "/game_faces/magician_f.webp", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir', 'sovepose'], moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, fordel: "Starter med en livseliksir og en stav.", ulempe: "Starter uden guld og tager +50% skade.", baseEnergi: 7, synsRadius: 1 },
    { id: 'thief_m', navn: "Tyv", ikon: "/game_faces/thief_m.webp", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'klude', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.0, fordel: "Hurtig og udstyret med en kniv.", ulempe: "Tager mere skade.", baseEnergi: 9, synsRadius: 1 },
    { id: 'thief_f', navn: "Skygge", ikon: "/game_faces/thief_f.webp", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'klude', 'sovepose'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.0, fordel: "Hurtig og udstyret med en kniv.", ulempe: "Tager mere skade.", baseEnergi: 9, synsRadius: 1 },
    { id: 'explorer_m', navn: "Udforsker", ikon: "/game_faces/explorer_m.webp", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude', 'sovepose'], moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, fordel: "Kan se langt og starter med en spade.", ulempe: "Mangler våben fra start.", baseEnergi: 7, synsRadius: 2 },
    { id: 'explorer_f', navn: "Eventyrer", ikon: "/game_faces/explorer_f.webp", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude', 'sovepose'], moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, fordel: "Kan se langt og starter med en spade.", ulempe: "Mangler våben fra start.", baseEnergi: 7, synsRadius: 2 },
    { id: 'viking_m', navn: "Viking", ikon: "/game_faces/viking_m.webp", startMsg: "Hvile er for de svage.", startHp: 150, startGuld: 100, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, fordel: "Enorm HP og tung økse.", ulempe: "Mangler sovepose, så kræver guld at sove.", baseEnergi: 8, synsRadius: 1 },
    { id: 'viking_f', navn: "Valkyrie", ikon: "/game_faces/viking_f.webp", startMsg: "Hvile er for de svage.", startHp: 150, startGuld: 100, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, fordel: "Enorm HP og tung økse.", ulempe: "Mangler sovepose, så kræver guld at sove.", baseEnergi: 8, synsRadius: 1 },
    { id: 'royal_m', navn: "Hertug", ikon: "/game_faces/royal_m.webp", startMsg: "Penge løser alt.", startHp: 100, startGuld: 400, startUdstyr: ['flot_toej', 'sovepose'], moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, fordel: "Masser af guld og fint tøj.", ulempe: "Intet våben. Gravning koster mere HP.", baseEnergi: 6, synsRadius: 1 },
    { id: 'royal_f', navn: "Hertuginde", ikon: "/game_faces/royal_f.webp", startMsg: "Penge løser alt.", startHp: 100, startGuld: 400, startUdstyr: ['flot_toej', 'sovepose'], moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, fordel: "Masser af guld og fint tøj.", ulempe: "Intet våben. Gravning koster mere HP.", baseEnergi: 6, synsRadius: 1 },
    { id: 'hunter_m', navn: "Jæger", ikon: "/game_faces/hunter_m.webp", startMsg: "Hold afstand til byttet.", startHp: 90, startGuld: 20, startUdstyr: ['bue', 'klude', 'sovepose'], moveCost: 1, digCost: 6, dmgMod: 1.1, goldMod: 1.0, fordel: "Starter med bue og højt syn.", ulempe: "Lav start-HP.", baseEnergi: 8, synsRadius: 2 },
    { id: 'hunter_f', navn: "Skytte", ikon: "/game_faces/hunter_f.webp", startMsg: "Hold afstand til byttet.", startHp: 90, startGuld: 20, startUdstyr: ['bue', 'klude', 'sovepose'], moveCost: 1, digCost: 6, dmgMod: 1.1, goldMod: 1.0, fordel: "Starter med bue og højt syn.", ulempe: "Lav start-HP.", baseEnergi: 8, synsRadius: 2 },
    { id: 'pirate_m', navn: "Kaptajn", ikon: "/game_faces/pirate_m.webp", startMsg: "Havet tog alt andet.", startHp: 110, startGuld: 150, startUdstyr: ['sabel', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.2, fordel: "Høj startkapital og hurtig sabel.", ulempe: "Ingen sovepose.", baseEnergi: 7, synsRadius: 1 },
    { id: 'pirate_f', navn: "Korsar", ikon: "/game_faces/pirate_f.webp", startMsg: "Havet tog alt andet.", startHp: 110, startGuld: 150, startUdstyr: ['sabel', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.2, fordel: "Høj startkapital og hurtig sabel.", ulempe: "Ingen sovepose.", baseEnergi: 7, synsRadius: 1 },
    { id: 'dwarf_m', navn: "Dværg", ikon: "/game_faces/dwarf_m.webp", startMsg: "Klippen tygger knogler til støv.", startHp: 130, startGuld: 80, startUdstyr: ['skovl', 'oekse', 'klude'], moveCost: 2, digCost: 2, dmgMod: 1.0, goldMod: 1.3, fordel: "Mestergraver og guldjæger.", ulempe: "Tung og langsom at flytte", baseEnergi: 6, synsRadius: 1 },
    { id: 'dwarf_f', navn: "Minegraver", ikon: "/game_faces/dwarf_f.webp", startMsg: "Klippen tygger knogler til støv.", startHp: 130, startGuld: 80, startUdstyr: ['skovl', 'oekse', 'klude'], moveCost: 2, digCost: 2, dmgMod: 1.0, goldMod: 1.3, fordel: "Mestergraver og guldjæger.", ulempe: "Tung og langsom at flytte.", baseEnergi: 6, synsRadius: 1 },
    { id: 'orc_m', navn: "Ork", ikon: "/game_faces/orc_m.webp", startMsg: "Smerte gør dig stærk.", startHp: 160, startGuld: 0, startUdstyr: ['svaerd', 'klude'], moveCost: 1, digCost: 7, dmgMod: 0.8, goldMod: 0.8, fordel: "Masser af liv og tyk hud.", ulempe: "Dårlig til at grave guld.", baseEnergi: 8, synsRadius: 1 },
    { id: 'orc_f', navn: "Klanleder", ikon: "/game_faces/orc_f.webp", startMsg: "Smerte gør dig stærk.", startHp: 160, startGuld: 0, startUdstyr: ['svaerd', 'klude'], moveCost: 1, digCost: 7, dmgMod: 0.8, goldMod: 0.8, fordel: "Masser af liv og tyk hud.", ulempe: "Dårlig til at grave guld.", baseEnergi: 8, synsRadius: 1 },
    { id: 'joker_m', navn: "Joker", ikon: "/game_faces/joker_m.webp", startMsg: "Held er en strategi.", startHp: 50, startGuld: 1, startUdstyr: ['kniv'], moveCost: 1, digCost: 3, dmgMod: 2.0, goldMod: 2.0, fordel: "Guldbonus og godt syn.", ulempe: "Tyndt helbred og tager dobbelt skade.", baseEnergi: 7, synsRadius: 2 },
    { id: 'joker_f', navn: "Harlekin", ikon: "/game_faces/joker_f.webp", startMsg: "Held er en strategi.", startHp: 50, startGuld: 1, startUdstyr: ['kniv'], moveCost: 1, digCost: 3, dmgMod: 2.0, goldMod: 2.0, fordel: "Guldbonus og godt syn.", ulempe: "Tyndt helbred og tager dobbelt skade.", baseEnergi: 7, synsRadius: 2 }

];