import type { Karakter } from './types';

export const BREDDE = 50;
export const HOEJDE = 20;
export const HEX_W = 96;  
export const ROW_H = 82; 

export const biomeVægte = [
    { id: 'mark', vaegt: 15 }, { id: 'eng', vaegt: 15 }, { id: 'skov', vaegt: 15 }, { id: 'bjerg', vaegt: 15 },
    { id: 'hule', vaegt: 2 }, { id: 'ritual', vaegt: 2 }, { id: 'ruin', vaegt: 2 }, { id: 'bandit', vaegt: 2 },
    { id: 'gen', vaegt: 15 }, { id: 'blodskov', vaegt: 5 }, { id: 'by', vaegt: 5 }, { id: 'hav', vaegt: 10 },
    { id: 'krystal', vaegt: 5 }, { id: 'marked', vaegt: 5 }, { id: 'slagmark', vaegt: 5 }
];

export const biomeTerraenCost: Record<string, number> = {
    'mark': 1, 'eng': 1, 'by': 1, 'marked': 1,
    'skov': 1.5, 'ruin': 1.5, 'ritual': 1.5, 'bandit': 1.5, 'gen': 1.5, 'slagmark': 1.5,
    'bjerg': 2.5, 'blodskov': 2.5, 'hule': 2, 'krystal': 2,
    'hav': 3
};

export const itemDB: Record<string, { id: string, navn: string, type: string, billede: string, bonus: number, pris: number }> = {
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
    'kikkert_250': { id: 'kikkert_250', navn: 'Gylden Kikkert (Nær)', type: 'forbandelse', billede: '/inventory/kikkert.webp', bonus: 0, pris: 0 },
    'kikkert_45': { id: 'kikkert_45', navn: 'Gylden Kikkert (Fjern)', type: 'forbandelse', billede: '/inventory/kikkert.webp', bonus: 0, pris: 0 },
    
   };

export const tilgaengeligeKarakterer: Karakter[] = [
    { id: 'knight_m', navn: "Ridder", ikon: "/game_faces/knight_m.png", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning'], moveCost: 2, digCost: 6, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Starter med sværd og rustning (-50% skade).", ulempe: "Koster 2 HP at rykke sig.", baseEnergi: 6, synsRadius: 1 },
    { id: 'knight_f', navn: "Skjoldmø", ikon: "/game_faces/knight_f.png", startMsg: "Rustningen tynger, men beskytter.", startHp: 120, startGuld: 0, startUdstyr: ['svaerd', 'rustning'], moveCost: 2, digCost: 6, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Starter med sværd og rustning (-50% skade).", ulempe: "Koster 2 HP at rykke sig.", baseEnergi: 6, synsRadius: 1 },
    { id: 'magician_m', navn: "Troldmand", ikon: "/game_faces/magician_m.png", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir'], moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en livseliksir og en stav.", ulempe: "Starter uden guld og tager +50% skade.", baseEnergi: 7, synsRadius: 1 },
    { id: 'magician_f', navn: "Troldkvinde", ikon: "/game_faces/magician_f.png", startMsg: "Magi beskytter ikke mod mudder.", startHp: 80, startGuld: 0, startUdstyr: ['stav', 'klude', 'livseliksir'], moveCost: 1, digCost: 10, dmgMod: 1.5, goldMod: 1.0, canRest: true, fordel: "Starter med en livseliksir og en stav.", ulempe: "Starter uden guld og tager +50% skade.", baseEnergi: 7, synsRadius: 1 },
    { id: 'thief_m', navn: "Tyv", ikon: "/game_faces/thief_m.png", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.0, canRest: true, fordel: "Hurtig og udstyret med en kniv.", ulempe: "Tager +20% skade.", baseEnergi: 9, synsRadius: 1 },
    { id: 'thief_f', navn: "Skygge", ikon: "/game_faces/thief_f.png", startMsg: "Hold dig i bevægelse.", startHp: 100, startGuld: 50, startUdstyr: ['kniv', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.2, goldMod: 1.0, canRest: true, fordel: "Hurtig og udstyret med en kniv.", ulempe: "Tager +20% skade.", baseEnergi: 9, synsRadius: 1 },
    { id: 'explorer_m', navn: "Udforsker", ikon: "/game_faces/explorer_m.png", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude'], moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Kan se langt og starter med en spade.", ulempe: "Mangler våben fra start.", baseEnergi: 7, synsRadius: 2 },
    { id: 'explorer_f', navn: "Eventyrer", ikon: "/game_faces/explorer_f.png", startMsg: "Du kender terrænet.", startHp: 100, startGuld: 0, startUdstyr: ['skovl', 'klude'], moveCost: 1, digCost: 2, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Kan se langt og starter med en spade.", ulempe: "Mangler våben fra start.", baseEnergi: 7, synsRadius: 2 },
    { id: 'viking_m', navn: "Viking", ikon: "/game_faces/viking_m.png", startMsg: "Hvile er for de svage.", startHp: 150, startGuld: 0, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og tung økse.", ulempe: "Nægter at slå lejr og hvile.", baseEnergi: 8, synsRadius: 1 },
    { id: 'viking_f', navn: "Valkyrie", ikon: "/game_faces/viking_f.png", startMsg: "Hvile er for de svage.", startHp: 150, startGuld: 0, startUdstyr: ['oekse', 'klude'], moveCost: 1, digCost: 5, dmgMod: 1.0, goldMod: 1.0, canRest: false, fordel: "Enorm HP og tung økse.", ulempe: "Nægter at slå lejr og hvile.", baseEnergi: 8, synsRadius: 1 },
    { id: 'royal_m', navn: "Hertug", ikon: "/game_faces/royal_m.png", startMsg: "Penge løser alt.", startHp: 100, startGuld: 400, startUdstyr: ['flot_toej'], moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Masser af guld og fint tøj (+50% indtægt).", ulempe: "Intet våben. Gravning koster mere HP.", baseEnergi: 6, synsRadius: 1 },
    { id: 'royal_f', navn: "Hertuginde", ikon: "/game_faces/royal_f.png", startMsg: "Penge løser alt.", startHp: 100, startGuld: 400, startUdstyr: ['flot_toej'], moveCost: 1, digCost: 15, dmgMod: 1.0, goldMod: 1.0, canRest: true, fordel: "Masser af guld og fint tøj (+50% indtægt).", ulempe: "Intet våben. Gravning koster mere HP.", baseEnergi: 6, synsRadius: 1 }
];