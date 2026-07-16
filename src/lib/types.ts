export type Biome = 'mark' | 'eng' | 'skov' | 'bjerg' | 'hule' | 'ritual' | 'ruin' | 'bandit' | 'hoejland' | 'blodskov' | 'by' | 'hav' | 'soe' | 'krystal' | 'marked' | 'slagmark' | 'meteor';
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
    diamanter?: number[];
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
    deathCause?: 'vand' | 'taage' | null;
    escapeIndex?: number | null;
    escapeIcon?: string | null;
    score: number;
    ikon?: string;
    mitUdstyr?: RygsækTing[];
    kendteFelter?: number[];
    historik?: number[];
    tidligereHistorik?: number[][];
    energi?: number;
    turNummer: number;
    rundeSeed?: string;
    dag?: number;
    sidstAktiv?: number;
    activeAlarm?: boolean;
    retning: string;
    besoegteMiner?: number[];
    browserId?: string | null;
    userId?: string | null;
    rumKode?: string;
    kanalNoegle?: string;
    harSkattekort?: boolean;
    skattekortFelter?: number[];
    aktivTracker?: {
        targetNavn: string;
        slutterDag: number;
    } | null;
    trackedeSpillere?: string[];
    royalSkatDage?: Record<string, number>;
    piratRovDage?: Record<string, number>;
    gratisNaesteBevaegelse?: boolean;
    gratisBevaegelseKilde?: '' | 'mad' | 'bersaerk';
    sidsteBersaerkDag?: number;
    harEnergisyn?: boolean;
    venteFriIndtilDag?: number;
}

export interface GravstenMinde {
    ikon: string;
    navn: string;
    dag: number;
    tekst?: string;
}

export interface Felt {
    id?: number; 
    kolonne?: number;
    raekke?: number;
    x?: number;
    y?: number;
    hasBoat?: boolean;
    boatCount?: number;
    hasPortal?: boolean;
    hasWorkshop?: boolean;
    
    guld: number;
    gravet: boolean;
    udforsket: boolean;
    eventFuldført: boolean; 
    biome: Biome | string;
    
    isCampfire?: boolean;
    eventID?: string;
    shopItems?: string[]; 
    shopBasisItems?: string[];
    shopGenopfyldtDag?: number;
    taageLukketShop?: boolean;
    taageLukketVaerksted?: boolean;
    indbrudt?: boolean;
    plyndret?: boolean;
    kasseGuld?: number;
    naegterHandelFor?: string[];
    naegterHandelGrundFor?: Record<string, 'koelle' | 'smadrede_naboer'>;
    
    type?: string;
    opdaget?: boolean;
    billede?: string;
    gravstenIkon?: string;
    gravstenListe?: GravstenMinde[];

    kanGraves?: boolean;
    skjultGuld?: number;
    skjultLiv?: number;
    skjultFaelde?: boolean;
    skjultLoot?: string | null;
    tomSkattekiste?: boolean;
    isSkatteKlynge?: boolean;
    jordskredsSkatSpor?: boolean;
    skatId?: number;

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
    grundIsCampfire?: boolean;
    grundHasWorkshop?: boolean;
    grundHasGoldmine?: boolean;
    grundHasPortal?: boolean;
    grundAfgroede?: 'hvede' | 'boenner';
    grundShopItems?: string[];
    grundShopBasisItems?: string[];
    katastrofeFraBiome?: string | Biome;
    katastrofeVisuelAktiv?: boolean;
    katastrofeVisuelId?: number;
}
