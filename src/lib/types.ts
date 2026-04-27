export interface Item {
    id: string;
    navn: string;
    billede: string;
    type?: string;
    brugCount?: number; // Holder styr på holdbarhed for spader, våben etc.
}

export interface SmidtTing {
    itemID: string;
    kolonne: number;
    raekke: number;
}

export interface RygsækTing {
    id: string;
    maengde: number; // Fungerer både som antal eliksirer og brændetid for fakler
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
    canRest: boolean; 
    fordel: string; 
    ulempe: string;
    baseEnergi: number;
    synsRadius: number;
    synsProfil: 'cirkel' | 'frem' | 'kile';
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
    inventory?: Item[];
    kendteFelter?: number[];
    energi?: number; 
    turNummer: number; 
    dag?: number; 
    sidstAktiv?: number;
    activeAlarm?: boolean; 
    retning: string;
    udstyr: RygsækTing[]; // Gør op med den gamle metode, hvis du brugte string[]
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
    biome: string;
    
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