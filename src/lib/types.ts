// types.ts
export type Biome = 'mark' | 'eng' | 'skov' | 'bjerg' | 'hule' | 'ritual' | 'ruin' | 'bandit' | 'gen' | 'blodskov' | 'by' | 'hav' | 'krystal' | 'marked' | 'slagmark';
export type ItemType = 'tøj' | 'våben' | 'værktøj' | 'forbrug' | 'forbandelse' | 'skat';

export interface Item {
    id: string;
    navn: string;
    billede: string;
    type?: ItemType;
    brugCount?: number;
}

export interface SmidtTing {
    itemID: string;
    kolonne: number;
    raekke: number;
}

export interface RygsækTing {
    id: string;
    maengde: number;
}

export interface Karakter { 
    id: string; 
    navn: string; 
    ikon: string; 
    startMsg: string;
    startHp: number; 
    startGuld: number; 
    startUdstyr: string[];
    moveCost: number; 
    digCost: number; 
    dmgMod: number; 
    goldMod: number;
    fordel: string; 
    ulempe: string;
    baseEnergi: number;
    synsRadius: number;
}

export interface SpillerData {
    index: number;
    kolonne: number;
    hp: number;
    guld: number;
    isDead: boolean;
    isWinner: boolean;
    score: number;
    ikon?: string;
    mitUdstyr?: RygsækTing[];
    kendteFelter?: number[];
    energi?: number;
    turNummer: number;
    dag?: number;
    sidstAktiv?: number;
    activeAlarm?: boolean;
    retning: string;
}

export interface Felt {
    id?: number; 
    kolonne?: number;
    raekke?: number;
    x?: number;
    y?: number;
    
    guld: number;
    gravet: boolean;
    udforsket: boolean;
    eventFuldført: boolean; 
    biome: Biome | string;
    
    isCampfire?: boolean;
    eventID?: string;
    shopItems?: string[]; 
    
    type?: string;
    opdaget?: boolean;
    billede?: string;

    kanGraves?: boolean;
    skjultGuld?: number;
    skjultLiv?: number;
    skjultFaelde?: boolean;
    skjultLoot?: string | null;
}