export type Biome = 'mark' | 'eng' | 'skov' | 'bjerg' | 'hule' | 'ritual' | 'ruin' | 'bandit' | 'hoejland' | 'blodskov' | 'by' | 'hav' | 'krystal' | 'marked' | 'slagmark' | 'meteor';
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
    anskaffetDag?: number;
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
    biomeMod?: Record<string, number>;
}

export interface SpillerData {
    index: number;
    kolonne: number;
    hp: number;
    maxHp?: number;
    guld: number;
    isDead: boolean;
    isWinner: boolean;
    score: number;
    ikon?: string;
    mitUdstyr?: RygsækTing[];
    kendteFelter?: number[];
    historik?: number[];
    tidligereHistorik?: number[][];
    energi?: number;
    turNummer: number;
    dag?: number;
    sidstAktiv?: number;
    activeAlarm?: boolean;
    retning: string;
    besoegteMiner?: number[];
    browserId?: string | null;
    userId?: string | null;
    harSkattekort?: boolean;
}

export interface Felt {
    id?: number; 
    kolonne?: number;
    raekke?: number;
    x?: number;
    y?: number;
    hasBoat?: boolean;
    hasPortal?: boolean;
    
    guld: number;
    gravet: boolean;
    udforsket: boolean;
    eventFuldført: boolean; 
    biome: Biome | string;
    
    isCampfire?: boolean;
    eventID?: string;
    shopItems?: string[]; 
    indbrudt?: boolean;
    
    type?: string;
    opdaget?: boolean;
    billede?: string;
    gravstenIkon?: string;

    kanGraves?: boolean;
    skjultGuld?: number;
    skjultLiv?: number;
    skjultFaelde?: boolean;
    skjultLoot?: string | null;
    tomSkattekiste?: boolean;
    isSkatteKlynge?: boolean;

    afgroede?: 'hvede' | 'boenner';
    smadretFremTilBlok?: number;
    hoestetFremTilBlok?: number;
    insektPlageBlok?: number;

    hasGoldmine?: boolean;
    mineOwner?: string;
    mineLocked?: boolean;
    hasMeteorStone?: boolean;
    taagenHoldtTilDag?: number;
    taageBlokker?: boolean;

    grundBiome?: string | Biome;
    grundEvent?: string;
}
