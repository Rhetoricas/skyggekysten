import { itemDB, tilgaengeligeKarakterer, hentKarakterKlasseNavn, hentKarakterKlasseNoegle } from './spildata';
import { tekst } from './i18n.svelte';
import type { Karakter } from './types';

type TekstPar = { navn?: string; fordel?: string; ulempe?: string; beskrivelse?: string };

const karakterTekster: Record<string, TekstPar> = {
    knight_m: {
        navn: 'Knight',
        fordel: 'The Order: You take 10% less damage, ignore armor weight and avoid buried traps.',
        ulempe: 'You start with no gold and can see only 1 tile. Digging costs 5 energy, and your armor is lost in water.'
    },
    knight_f: {
        navn: 'Shieldmaiden',
        fordel: 'The Order: You take 10% less damage, ignore armor weight and avoid buried traps.',
        ulempe: 'You start with no gold and can see only 1 tile. Digging costs 5 energy, and your armor is lost in water.'
    },
    magician_m: {
        navn: 'Wizard',
        fordel: 'Mages: Your staff moves you east. Crystals heal you and let the staff reveal other crystal tiles.',
        ulempe: 'You start with 80 HP and no gold, take 50% more damage and spend 7 energy to dig. There is little room for mistakes.'
    },
    magician_f: {
        navn: 'Seeress',
        fordel: 'Mages: Your staff moves you east. Crystals heal you and let the staff reveal other crystal tiles.',
        ulempe: 'You start with 80 HP and no gold, take 50% more damage and spend 7 energy to dig. There is little room for mistakes.'
    },
    thief_m: {
        navn: 'Thief',
        fordel: 'Outlaws: You can break into empty houses in town with your lockpick. You find a little more gold than others.',
        ulempe: 'You take 20% more damage and can see only 1 tile. Digging costs 4 energy.'
    },
    thief_f: {
        navn: 'Shadow',
        fordel: 'Outlaws: You can break into empty houses in town with your lockpick. You find a little more gold than others.',
        ulempe: 'You take 20% more damage and can see only 1 tile. Digging costs 4 energy.'
    },
    explorer_m: {
        navn: 'Explorer',
        fordel: 'Explorers: You can see farther than most. Caves and ruins cost 2 less energy, and you dig for only 3.',
        ulempe: 'You start without gold or a weapon and gain 10% less from all gold. Build your economy by exploring and digging.'
    },
    explorer_f: {
        navn: 'Adventurer',
        fordel: 'Explorers: You can see farther than most. Caves and ruins cost 2 less energy, and you dig for only 3.',
        ulempe: 'You start without gold or a weapon and gain 10% less from all gold. Build your economy by exploring and digging.'
    },
    viking_m: {
        navn: 'Viking',
        fordel: 'Northfolk: You take 10% less damage. When you are hurt, berserk may make your next energy-costing action free.',
        ulempe: 'You start without a sleeping bag and gain 10% less from all gold. Healing must be found or bought along the way.'
    },
    viking_f: {
        navn: 'Valkyrie',
        fordel: 'Northfolk: You take 10% less damage. When you are hurt, berserk may make your next energy-costing action free.',
        ulempe: 'You start without a sleeping bag and gain 10% less from all gold. Healing must be found or bought along the way.'
    },
    royal_m: {
        navn: 'Duke',
        fordel: 'Nobility: You gain 20% more gold, can pressure merchants on price and collect tax from other players in multiplayer.',
        ulempe: 'You have only 6 energy, take 10% more damage and start without a weapon. Digging costs a full 9 energy.'
    },
    royal_f: {
        navn: 'Queen',
        fordel: 'Nobility: You gain 20% more gold, can pressure merchants on price and collect tax from other players in multiplayer.',
        ulempe: 'You have only 6 energy, take 10% more damage and start without a weapon. Digging costs a full 9 energy.'
    },
    hunter_m: {
        navn: 'Hunter',
        fordel: 'Scouts: You can see farther than most. You can track other players you meet.',
        ulempe: 'You start with 90 HP and 20 gold and take 10% more damage. Digging costs 5 energy.'
    },
    hunter_f: {
        navn: 'Archer',
        fordel: 'Scouts: You can see farther than most. You can track other players you meet.',
        ulempe: 'You start with 90 HP and 20 gold and take 10% more damage. Digging costs 5 energy.'
    },
    pirate_m: {
        navn: 'Captain',
        fordel: 'Sea Raiders: You land with a treasure map and find more gold than others. With your sabre, you can ambush other players.',
        ulempe: 'You start without a sleeping bag and can see only 1 tile. Find or buy healing along the way.'
    },
    pirate_f: {
        navn: 'Corsair',
        fordel: 'Sea Raiders: You land with a treasure map and find more gold than others. With your sabre, you can ambush other players.',
        ulempe: 'You start without a sleeping bag and can see only 1 tile. Find or buy healing along the way.'
    },
    dwarf_m: {
        navn: 'Dwarf',
        fordel: 'Mountainfolk: You are the best digger and find a little more gold than others. You move more easily through mountains and crystal tiles.',
        ulempe: 'Each normal step costs 1.5 energy. You can see only 1 tile and start without a sleeping bag.'
    },
    dwarf_f: {
        navn: 'Digger',
        fordel: 'Mountainfolk: You are the best digger and find a little more gold than others. You move more easily through mountains and crystal tiles.',
        ulempe: 'Each normal step costs 1.5 energy. You can see only 1 tile and start without a sleeping bag.'
    },
    orc_m: {
        navn: 'Orc',
        fordel: 'Clansfolk: You take 20% less damage and can smash towns and markets with your club.',
        ulempe: 'You start without gold, clothes or a sleeping bag and gain 20% less from all gold. Digging costs 5 energy.'
    },
    orc_f: {
        navn: 'Warrior',
        fordel: 'Clansfolk: You take 20% less damage and can smash towns and markets with your club.',
        ulempe: 'You start without gold, clothes or a sleeping bag and gain 20% less from all gold. Digging costs 5 energy.'
    },
    joker_m: {
        navn: 'Joker',
        fordel: 'Wildcards: You can see farther, gain 50% more gold and bluff through event choices that require items or specific characters.',
        ulempe: 'You start with 50 HP and 1 gold, without clothes or a sleeping bag, and take double damage. Almost any mistake can be your last.'
    },
    joker_f: {
        navn: 'Harlequin',
        fordel: 'Wildcards: You can see farther, gain 50% more gold and bluff through event choices that require items or specific characters.',
        ulempe: 'You start with 50 HP and 1 gold, without clothes or a sleeping bag, and take double damage. Almost any mistake can be your last.'
    },
    tutorial_laerling: {
        navn: 'Apprentice',
        fordel: 'You can see far, dig cheaply and start with a shovel, food and a sleeping bag.',
        ulempe: 'The Apprentice is used only in the tutorial and does not count toward your score.'
    }
};

const klasseTekster: Record<string, string> = {
    knight: 'The Order',
    magician: 'Mages',
    thief: 'Outlaws',
    explorer: 'Explorers',
    viking: 'Northfolk',
    royal: 'Nobility',
    hunter: 'Scouts',
    pirate: 'Sea Raiders',
    dwarf: 'Mountainfolk',
    orc: 'Clansfolk',
    joker: 'Wildcards'
};

const itemTekster: Record<string, TekstPar> = {
    klude: { navn: 'Clothes', beskrivelse: 'Offers light protection and reduces all damage by 5%.' },
    rustning: { navn: 'Armor', beskrivelse: 'Halves all damage. Its weight normally costs 1 extra energy per step, but Knight and Shieldmaiden ignore the weight and avoid buried traps. The armor sinks and is lost in water.' },
    kongepanser: { navn: 'Royal Armor', beskrivelse: 'Reduces all damage by 70%. Its weight normally costs 1 extra energy per step, but Knight and Shieldmaiden ignore the weight and avoid buried traps. The armor sinks and is lost in water.' },
    rustning_elver: { navn: 'Elven Armor', beskrivelse: 'Halves all damage without costing extra energy. Knight and Shieldmaiden also avoid buried traps while wearing it. Cannot be bought.' },
    flot_toej: { navn: 'Fine Clothes', beskrivelse: 'Gives 15% more gold and light protection. Can be ruined in caves and blood forest.' },
    royalt_toej: { navn: 'Royal Clothes', beskrivelse: 'Gives 40% more gold and better protection than fine clothes. If torn in a cave or blood forest, it becomes ordinary fine clothes.' },
    kniv: { navn: 'Knife', beskrivelse: 'A simple weapon that also unlocks special choices in some events.' },
    mesterkniv: { navn: 'Master Knife', beskrivelse: 'Unlocks the same choices as an ordinary knife, but knife choices give more gold and deal less damage.' },
    dirk: { navn: 'Lockpick', beskrivelse: 'Lets you burgle empty town tiles.' },
    mesterdirk: { navn: 'Master Lockpick', beskrivelse: 'Unlocks the same burglaries as an ordinary lockpick and gives twice as much gold.' },
    stav: { navn: 'Staff', beskrivelse: 'Moves you 4 tiles east at your normal energy cost. The landing tile activates as usual. On crystal, the staff reveals crystal tiles up to 4 tiles away.' },
    dragestav: { navn: 'Dragon Staff', beskrivelse: 'Moves you 5 tiles east and reveals the route along the way. If the jump ends in open water, you land on the last safe tile and the dragon staff becomes an ordinary staff. On crystal, it reveals crystal tiles up to 5 tiles away.' },
    bue: { navn: 'Bow', beskrivelse: 'Unlocks special choices in events where distance matters.' },
    mesterbue: { navn: 'Falcon Bow', beskrivelse: 'Unlocks the same choices as an ordinary bow, but gives more gold and less damage. As you move, it reveals a small area just beyond your sight.' },
    oekse: { navn: 'Axe', beskrivelse: 'A heavy weapon that unlocks special choices in some events.' },
    stormoekse: { navn: 'Storm Axe', beskrivelse: 'Unlocks the same choices as an ordinary axe, but clears obstacles in one blow and therefore gives more gold and less damage.' },
    koelle: { navn: 'Club', beskrivelse: 'Can smash markets and ordinary town tiles into ruins. It costs a lot of energy and HP.' },
    koelle_upgr: { navn: 'Wallbreaker', beskrivelse: 'Can also smash workshops and empty the tile cash box. It still costs a lot of energy and HP.' },
    svaerd: { navn: 'Sword', beskrivelse: 'A versatile weapon that unlocks special choices in several events.' },
    sabel: { navn: 'Sabre', beskrivelse: 'A light weapon that unlocks special choices in some events.' },
    skovl: { navn: 'Shovel', beskrivelse: 'Lets you dig for gold and healing roots. Digging with your hands costs more and can hurt you.' },
    mesterskovl: { navn: 'Master Shovel', beskrivelse: 'Gives twice as much gold when digging and does not trigger buried traps.' },
    metaldetektor: { navn: 'Detector', beskrivelse: 'Shows hidden gold on known tiles up to 3 tiles away. Entering a crystal tile shorts it out and destroys it.' },
    malmviser: { navn: 'Ore Finder', beskrivelse: 'Shows hidden gold on known tiles up to 3 tiles away and gold mines through mountains up to 2 tiles away. You also gain 25% more hidden gold when digging. On crystal, it becomes an ordinary detector.' },
    soegekvist: { navn: 'Dowsing Rod', beskrivelse: 'Shows healing roots on known tiles up to 3 tiles away. Lost on ritual tiles.' },
    runekvist: { navn: 'Rune Rod', beskrivelse: 'Shows healing roots up to 3 tiles away. If you are missing HP, it automatically pulls up a hidden root when you enter the tile. This costs 1 energy and empties the tile without digging it. On ritual tiles, it becomes an ordinary dowsing rod.' },
    livseliksir: { navn: 'Life Elixir', beskrivelse: 'Used automatically when you take lethal damage and saves you with up to 90 HP.' },
    fakkel: { navn: 'Torch', beskrivelse: 'Extends your sight by 1. You can use it to light a large fire that everyone can see. The fire gives you full HP and 50 gold. The torch is lost in water.' },
    solfakkel: { navn: 'Sun Torch', beskrivelse: 'Extends your sight by 2. You can use it to light a sunfire that reveals a larger area and gives you full HP and 100 gold. The sun torch is lost in water.' },
    sovepose: { navn: 'Sleeping Bag', beskrivelse: 'Lets you make camp in the wild and gain 20 HP. This uses the rest of your energy. Damp caves ruin the sleeping bag immediately.' },
    silkesovepose: { navn: 'Silk Sleeping Bag', beskrivelse: 'Lets you make camp in the wild and gain 40 HP. In a damp cave, it becomes an ordinary sleeping bag instead of being lost entirely.' },
    mad: { navn: 'Food Ration', beskrivelse: 'Gives +20 HP, and your next move costs 0 energy. Can be lost in ruins.' },
    kikkert_250: { navn: 'Golden Spyglass', beskrivelse: 'Breaks if you enter a crystal tile.' },
    kikkert_45: { navn: 'Golden Spyglass', beskrivelse: 'Breaks if you enter a crystal tile.' },
    diamant: { navn: 'Diamond', beskrivelse: 'A rare gem worth 250-600 gold. Its value depends on its size.' },
    gylden_destillator: { navn: 'Golden Distiller', beskrivelse: 'A relic that doubles all gold you dig up. With the master shovel, the gold is tripled rather than quadrupled.' },
    rodhjertet: { navn: 'Root Heart', beskrivelse: 'A relic that doubles all healing from roots, both when digging and when the Rune Rod pulls them up.' },
    hemmelighed: { navn: 'Treasure Map', beskrivelse: 'Points toward an area with buried treasure. Some islands hide more than one.' }
};

const titelTekster: Record<string, string> = {
    'Væbner': 'Squire',
    Fodsoldat: 'Foot Soldier',
    Lejesvend: 'Mercenary',
    Kompagnifører: 'Company Commander',
    Kaptajn: 'Captain',
    Lansefører: 'Lance Bearer',
    Ridder: 'Knight',
    Bannerfører: 'Banner Bearer',
    Hærfører: 'Commander',
    Hærmester: 'War Master',
    Krigsherre: 'Warlord',
    Paladin: 'Paladin',
    Konge: 'King',
    Aspirant: 'Aspirant',
    Lærling: 'Apprentice',
    Novice: 'Novice',
    Akolyt: 'Acolyte',
    Illusionist: 'Illusionist',
    Elementalist: 'Elementalist',
    Besværger: 'Conjurer',
    Magister: 'Magister',
    Ærkemagiker: 'Archmage',
    Runemester: 'Runemaster',
    Stormagiker: 'Grand Mage',
    Halvgud: 'Demigod',
    Lommetyv: 'Pickpocket',
    Røver: 'Robber',
    Indbrudstyv: 'Burglar',
    Snigmorder: 'Assassin',
    Nattegænger: 'Nightwalker',
    Skygge: 'Shadow',
    Lurendrejer: 'Swindler',
    Bandeleder: 'Gang Leader',
    Syndikatboss: 'Syndicate Boss',
    Syndikatleder: 'Syndicate Leader',
    Fantom: 'Phantom',
    Skyggekonge: 'Shadow King',
    Mestertyv: 'Master Thief',
    Vildfaren: 'Stray',
    Forløber: 'Forerunner',
    Spejder: 'Scout',
    Stifinder: 'Pathfinder',
    Kortlægger: 'Cartographer',
    Vandrer: 'Wanderer',
    Banebryder: 'Trailblazer',
    Pioner: 'Pioneer',
    Opdagelsesrejsende: 'Expeditioner',
    Ekspeditionsleder: 'Expedition Leader',
    Økender: 'Island Expert',
    Erobrer: 'Conqueror',
    Legende: 'Legend',
    Træl: 'Thrall',
    Langskibsroer: 'Longship Rower',
    Bådsmand: 'Boatswain',
    Plyndrer: 'Raider',
    Øksebærer: 'Axe Bearer',
    Bersærk: 'Berserker',
    Skjoldbryder: 'Shieldbreaker',
    Høvding: 'Chieftain',
    Jarl: 'Jarl',
    Søkonge: 'Sea King',
    Einherjer: 'Einherjar',
    Arving: 'Heir',
    Hofsnog: 'Court Snake',
    Hofmand: 'Courtier',
    Baron: 'Baron',
    Greve: 'Count',
    Markis: 'Marquess',
    Lensherre: 'Liege Lord',
    Hertug: 'Duke',
    Storfyrste: 'Grand Prince',
    Kronprins: 'Crown Prince',
    Enevældshersker: 'Autocrat',
    Regent: 'Regent',
    Kejser: 'Emperor',
    Krybskytte: 'Poacher',
    Sporhund: 'Tracker',
    Flåer: 'Skinner',
    Pelsjæger: 'Trapper',
    Langbueskytte: 'Longbowman',
    Bueskytte: 'Archer',
    Vildtsporer: 'Game Tracker',
    Jæger: 'Hunter',
    Skarpskytte: 'Marksman',
    Falkeøje: 'Falcon Eye',
    Udyrsbetvinger: 'Beast Tamer',
    Storvildtjæger: 'Big Game Hunter',
    Skovløber: 'Forest Runner',
    Jagtmester: 'Huntmaster',
    Dæksdreng: 'Deckhand',
    Matros: 'Sailor',
    Kanonér: 'Cannoneer',
    Skytte: 'Gunner',
    Rorsmand: 'Helmsman',
    Styrmand: 'First Mate',
    Skibsfører: 'Shipmaster',
    Fribytter: 'Privateer',
    Korsar: 'Corsair',
    Piratkonge: 'Pirate King',
    Piratkaptajn: 'Pirate Captain',
    'Havets Hersker': 'Ruler of the Sea',
    Søhersker: 'Sea Ruler',
    Støvbider: 'Dust Biter',
    Stenknuser: 'Stone Crusher',
    Grubebisse: 'Mine Brute',
    Klippebryder: 'Rock Breaker',
    Smeltemester: 'Smeltmaster',
    Tunnelherre: 'Tunnel Lord',
    Tunnelmester: 'Tunnel Master',
    Malmbaron: 'Ore Baron',
    Guldherre: 'Gold Lord',
    Bjergkonge: 'Mountain King',
    'Dybdens Hersker': 'Ruler of the Deep',
    Dybdemester: 'Master of the Deep',
    Kryb: 'Creep',
    Pjalt: 'Ragged One',
    Grønskolling: 'Greenhorn',
    Stridsmand: 'Fighter',
    Kriger: 'Warrior',
    Blodtørster: 'Bloodthirster',
    Krigsråber: 'War Crier',
    Klanleder: 'Clan Leader',
    Klanherre: 'Clan Lord',
    Blodherre: 'Blood Lord',
    Ødelægger: 'Destroyer',
    Nar: 'Fool',
    Gøgler: 'Jester',
    Taskenspiller: 'Trickster',
    Jonglør: 'Juggler',
    Spilopmager: 'Prankster',
    Maskemager: 'Maskmaker',
    Lykkejæger: 'Fortune Hunter',
    Dæmon: 'Demon',
    Provokatør: 'Provocateur',
    Kaosfyrste: 'Chaos Prince',
    Kaosmager: 'Chaos Maker',
    Skæbnespiller: 'Fate Gambler',
    Skæbnemager: 'Fatemaker'
};

export function karakterNavn(karakter?: Pick<Karakter, 'id' | 'navn'> | string | null) {
    const fundet = findKarakter(karakter);
    if (!fundet && typeof karakter === 'object' && karakter?.id === 'tutorial_laerling') {
        return tekst(karakter.navn || 'Lærling', karakterTekster.tutorial_laerling?.navn || 'Apprentice');
    }
    if (!fundet && typeof karakter === 'string' && karakter) return karakter;
    return tekst(fundet?.navn || 'Ukendt', fundet ? karakterTekster[fundet.id]?.navn || fundet.navn : 'Unknown');
}

export function karakterFordel(karakter: Karakter) {
    return tekst(karakter.fordel, karakterTekster[karakter.id]?.fordel || karakter.fordel);
}

export function karakterUlempe(karakter: Karakter) {
    return tekst(karakter.ulempe, karakterTekster[karakter.id]?.ulempe || karakter.ulempe);
}

export function karakterKlasseNavn(karakter?: Pick<Karakter, 'id' | 'navn'> | string | null) {
    const noegle = hentKarakterKlasseNoegle(karakter);
    return noegle ? tekst(hentKarakterKlasseNavn(karakter), klasseTekster[noegle] || noegle) : tekst('Alle', 'All');
}

export function itemNavn(id?: string | null) {
    if (!id) return tekst('Ukendt genstand', 'Unknown item');
    return tekst(itemDB[id]?.navn || id, itemTekster[id]?.navn || itemDB[id]?.navn || id);
}

export function itemBeskrivelse(id?: string | null) {
    if (!id) return tekst('Genstand i din rygsæk.', 'Item in your backpack.');
    return tekst(itemDB[id]?.beskrivelse || 'Genstand i din rygsæk.', itemTekster[id]?.beskrivelse || itemDB[id]?.beskrivelse || 'Item in your backpack.');
}

export function titelNavn(titel?: string | null) {
    if (!titel || titel === 'Ingen titel endnu') return tekst('Ingen titel endnu', 'No title yet');
    return tekst(titel, titelTekster[titel] || titel);
}

function findKarakter(karakter?: Pick<Karakter, 'id' | 'navn'> | string | null) {
    if (!karakter) return null;
    const idEllerNavn = typeof karakter === 'string' ? karakter : karakter.id || karakter.navn;
    return tilgaengeligeKarakterer.find((k) => k.id === idEllerNavn || k.navn === idEllerNavn) || null;
}
