import { itemDB, tilgaengeligeKarakterer, hentKarakterKlasseNavn, hentKarakterKlasseNoegle } from './spildata';
import { tekst } from './i18n.svelte';
import type { Karakter } from './types';

type TekstPar = { navn?: string; fordel?: string; ulempe?: string; beskrivelse?: string };

const karakterTekster: Record<string, TekstPar> = {
    knight_m: {
        navn: 'Knight',
        fordel: 'Safe opener: 120 HP, sword, armor and sleeping bag. Takes 10% less damage, ignores armor weight, avoids traps and has battlefield -2 energy.',
        ulempe: 'Starts with 0 gold, sight 1 and digging costs 6 energy. The armor can still be lost in water.'
    },
    knight_f: {
        navn: 'Shieldmaiden',
        fordel: 'Safe opener: 120 HP, sword, armor and sleeping bag. Takes 10% less damage, ignores armor weight, avoids traps and has battlefield -2 energy.',
        ulempe: 'Starts with 0 gold, sight 1 and digging costs 6 energy. The armor can still be lost in water.'
    },
    magician_m: {
        navn: 'Wizard',
        fordel: 'Mobile magic: staff jumps east, life elixir can save lethal damage, and sleeping bag gives healing. Crystal costs -2 energy; staff on crystal reveals crystal fields.',
        ulempe: 'Only 80 HP, 0 gold, 50% more damage and expensive digging at 8 energy. Very little room for mistakes.'
    },
    magician_f: {
        navn: 'Seeress',
        fordel: 'Mobile magic: staff jumps east, life elixir can save lethal damage, and sleeping bag gives healing. Crystal costs -2 energy; staff on crystal reveals crystal fields.',
        ulempe: 'Only 80 HP, 0 gold, 50% more damage and expensive digging at 8 energy. Very little room for mistakes.'
    },
    thief_m: {
        navn: 'Thief',
        fordel: 'Speed and money: 9 energy, 50 gold, +10% gold, knife, lockpick and sleeping bag. Lockpick allows burglary in empty town fields; bandit costs -2 energy.',
        ulempe: 'Takes 20% more damage. Sight is only 1, and digging costs 5 energy, so fast routes need sharp reading.'
    },
    thief_f: {
        navn: 'Shadow',
        fordel: 'Speed and money: 9 energy, 50 gold, +10% gold, knife, lockpick and sleeping bag. Lockpick allows burglary in empty town fields; bandit costs -2 energy.',
        ulempe: 'Takes 20% more damage. Sight is only 1, and digging costs 5 energy, so fast routes need sharp reading.'
    },
    explorer_m: {
        navn: 'Explorer',
        fordel: 'Map reader: sight 2, shovel, sleeping bag and cheap digging at 3 energy. Cave and ruin cost -2 energy, so dangerous terrain is easier to inspect.',
        ulempe: '0 gold, no weapon and 10% less gold income. Needs overview and digging to build an economy.'
    },
    explorer_f: {
        navn: 'Adventurer',
        fordel: 'Map reader: sight 2, shovel, sleeping bag and cheap digging at 3 energy. Cave and ruin cost -2 energy, so dangerous terrain is easier to inspect.',
        ulempe: '0 gold, no weapon and 10% less gold income. Needs overview and digging to build an economy.'
    },
    viking_m: {
        navn: 'Viking',
        fordel: 'Robust tempo: 140 HP, 100 gold, axe, 8 energy and 10% less damage. Berserk can help after damage; battlefield costs -2 energy.',
        ulempe: 'No sleeping bag and 10% less gold income. Sight is 1, and healing must be found or bought along the way.'
    },
    viking_f: {
        navn: 'Valkyrie',
        fordel: 'Robust tempo: 140 HP, 100 gold, axe, 8 energy and 10% less damage. Berserk can help after damage; battlefield costs -2 energy.',
        ulempe: 'No sleeping bag and 10% less gold income. Sight is 1, and healing must be found or bought along the way.'
    },
    royal_m: {
        navn: 'Duke',
        fordel: 'Buying start: 500 gold, sleeping bag, fine clothes and +20% gold income. Can buy weapon, tool or healing before others.',
        ulempe: 'Only 6 energy, no weapon, 10% more damage and extremely expensive digging at 10 energy. No terrain bonus.'
    },
    royal_f: {
        navn: 'Queen',
        fordel: 'Buying start: 500 gold, sleeping bag, fine clothes and +20% gold income. Can buy weapon, tool or healing before others.',
        ulempe: 'Only 6 energy, no weapon, 10% more damage and extremely expensive digging at 10 energy. No terrain bonus.'
    },
    hunter_m: {
        navn: 'Hunter',
        fordel: 'Planner: sight 2, bow, sleeping bag, 8 energy and normal gold income. Forest and blood forest cost -2 energy.',
        ulempe: 'Only 90 HP, 20 gold and 10% more damage. Digging costs 6 energy, so bad choices hurt.'
    },
    hunter_f: {
        navn: 'Archer',
        fordel: 'Planner: sight 2, bow, sleeping bag, 8 energy and normal gold income. Forest and blood forest cost -2 energy.',
        ulempe: 'Only 90 HP, 20 gold and 10% more damage. Digging costs 6 energy, so bad choices hurt.'
    },
    pirate_m: {
        navn: 'Captain',
        fordel: 'Treasure and economy: 110 HP, 150 gold, sabre, treasure map and +20% gold income. Sea costs -3 energy and lake -1.',
        ulempe: 'No sleeping bag and sight 1. Survival must be funded by treasure, purchases or found healing.'
    },
    pirate_f: {
        navn: 'Corsair',
        fordel: 'Treasure and economy: 110 HP, 150 gold, sabre, treasure map and +20% gold income. Sea costs -3 energy and lake -1.',
        ulempe: 'No sleeping bag and sight 1. Survival must be funded by treasure, purchases or found healing.'
    },
    dwarf_m: {
        navn: 'Dwarf',
        fordel: 'Digging master: 130 HP, 80 gold, shovel, axe, digging for 2 energy and +10% gold. Mountain costs -3 energy and crystal -2.',
        ulempe: 'Normal steps cost 1.5 energy, sight is 1, and there is no sleeping bag. Strongest when the route can be dug.'
    },
    dwarf_f: {
        navn: 'Digger',
        fordel: 'Digging master: 130 HP, 80 gold, shovel, axe, digging for 2 energy and +10% gold. Mountain costs -3 energy and crystal -2.',
        ulempe: 'Normal steps cost 1.5 energy, sight is 1, and there is no sleeping bag. Strongest when the route can be dug.'
    },
    orc_m: {
        navn: 'Orc',
        fordel: 'Raw strength: 150 HP, 8 energy, club and 20% less damage. Club can smash town/market; battlefield costs -2 energy.',
        ulempe: '0 gold, no clothes, no sleeping bag, 20% less gold income and digging at 6 energy. Smashing can cost relations and resources.'
    },
    orc_f: {
        navn: 'Warrior',
        fordel: 'Raw strength: 150 HP, 8 energy, club and 20% less damage. Club can smash town/market; battlefield costs -2 energy.',
        ulempe: '0 gold, no clothes, no sleeping bag, 20% less gold income and digging at 6 energy. Smashing can cost relations and resources.'
    },
    joker_m: {
        navn: 'Joker',
        fordel: 'Highscore gambit: sight 2, knife and +50% gold income. Normal movement and digging at 5 energy.',
        ulempe: 'Only 50 HP, 1 gold, no clothes, no sleeping bag and double damage. No terrain bonus; almost no room for error.'
    },
    joker_f: {
        navn: 'Harlequin',
        fordel: 'Highscore gambit: sight 2, knife and +50% gold income. Normal movement and digging at 5 energy.',
        ulempe: 'Only 50 HP, 1 gold, no clothes, no sleeping bag and double damage. No terrain bonus; almost no room for error.'
    },
    tutorial_laerling: {
        navn: 'Apprentice',
        fordel: 'Balanced practice character with shovel, food and a little extra room for mistakes.',
        ulempe: 'Only used on the tutorial island and does not count toward scores.'
    }
};

const klasseTekster: Record<string, string> = {
    knight: 'The Order',
    magician: 'Mages',
    thief: 'Outlaws',
    explorer: 'Explorers',
    viking: 'Nordics',
    royal: 'Nobility',
    hunter: 'Trackers',
    pirate: 'Sea Raiders',
    dwarf: 'Mountainfolk',
    orc: 'Clansfolk',
    joker: 'Wildcards'
};

const itemTekster: Record<string, TekstPar> = {
    klude: { navn: 'Clothes', beskrivelse: 'Gives a little protection. You take 5% less damage.' },
    rustning: { navn: 'Armor', beskrivelse: 'Halves all damage, but the heavy weight normally costs 1 energy per step. Knight and Shieldmaiden ignore the weight and take no damage from buried traps. Sinks and disappears if you enter water.' },
    kongepanser: { navn: 'Royal Armor', beskrivelse: 'Upgraded armor. Reduces damage by 70%, but the heavy weight normally costs 1 energy per step. Knight and Shieldmaiden ignore the weight and take no damage from buried traps. Sinks and disappears if you enter water.' },
    rustning_elver: { navn: 'Elven Armor', beskrivelse: 'Halves damage like ordinary armor, but weighs nothing. Knight with armor takes no damage from buried traps. Cannot be bought.' },
    flot_toej: { navn: 'Fine Clothes', beskrivelse: 'Increases all gold income by 15%. Can be ruined in caves and blood forest.' },
    royalt_toej: { navn: 'Royal Clothes', beskrivelse: 'Upgraded fine clothes. Increases all gold income by 40% and gives a little better protection. If torn in caves or blood forest, it becomes ordinary fine clothes.' },
    kniv: { navn: 'Knife', beskrivelse: 'A simple weapon. Also used in some events.' },
    mesterkniv: { navn: 'Master Knife', beskrivelse: 'Upgraded knife. Counts as a knife in events. Knife choices give better rewards: more gold and less damage.' },
    dirk: { navn: 'Lockpick', beskrivelse: 'Thief tool. Can be used for burglary on empty town fields.' },
    mesterdirk: { navn: 'Master Lockpick', beskrivelse: 'Upgraded lockpick. Counts as a lockpick and gives double gold when burgling.' },
    stav: { navn: 'Staff', beskrivelse: 'Can teleport you 4 fields east. Costs base energy. The landing field activates normally. If you stand on crystal, the staff reveals crystal fields within radius 4.' },
    dragestav: { navn: 'Dragon Staff', beskrivelse: 'Upgraded staff. Teleports you 5 fields east and reveals the route in between. If it would send you into open water, it saves you on the last safe field and becomes an ordinary staff. On crystal, it reveals crystal fields within radius 5.' },
    bue: { navn: 'Bow', beskrivelse: 'A weapon for events where distance matters.' },
    mesterbue: { navn: 'Falcon Bow', beskrivelse: 'Upgraded bow. Counts as a bow in events. Bow choices give a little more gold and less damage. When you move, it reveals a small fan just beyond your sight in the direction you went.' },
    oekse: { navn: 'Axe', beskrivelse: 'A heavy weapon. Used in some events.' },
    stormoekse: { navn: 'Storm Axe', beskrivelse: 'Upgraded axe. Counts as an axe in events. Axe choices give more gold and less damage because it can chop obstacles away in one blow.' },
    koelle: { navn: 'Club', beskrivelse: 'A brutal weapon. Can smash markets and ordinary town fields into ruins for a lot of energy and HP.' },
    koelle_upgr: { navn: 'Wallbreaker', beskrivelse: 'Upgraded club. Can also smash workshops and empty the field cash box, but it costs hard in energy and HP.' },
    svaerd: { navn: 'Sword', beskrivelse: 'A versatile weapon. Used in several events.' },
    sabel: { navn: 'Sabre', beskrivelse: 'A light weapon. Used in some events.' },
    skovl: { navn: 'Shovel', beskrivelse: 'Lets you dig up gold and healing roots. Without a shovel, digging can get expensive.' },
    mesterskovl: { navn: 'Master Shovel', beskrivelse: 'Upgraded shovel. Gives double gold when digging and does not trigger buried traps.' },
    metaldetektor: { navn: 'Detector', beskrivelse: 'Shows hidden gold on known fields within radius 3. Entering a crystal field shorts it out and destroys it.' },
    malmviser: { navn: 'Ore Finder', beskrivelse: 'Upgraded detector. Shows hidden gold on known fields within radius 3, reveals gold mines within radius 2 through mountains and gives 25% more hidden gold when you dig it up. Crystals downgrade it to an ordinary detector.' },
    soegekvist: { navn: 'Dowsing Rod', beskrivelse: 'Shows healing roots on known fields within radius 3. Lost on ritual fields.' },
    runekvist: { navn: 'Rune Rod', beskrivelse: 'Upgraded dowsing rod. Shows healing roots within radius 3 and automatically pulls hidden life up when you lack HP and enter the field. Costs 1 energy and leaves the field undug, but empty. Ritual fields downgrade it to an ordinary dowsing rod.' },
    livseliksir: { navn: 'Life Elixir', beskrivelse: 'Drunk automatically if you take lethal damage. Heals you back to a maximum of 90 HP.' },
    fakkel: { navn: 'Torch', beskrivelse: 'Extends your sight by +1. Can be used for large campfires that everyone can see. The one who lights the fire gets full HP and 50 gold. Lost in water.' },
    solfakkel: { navn: 'Sun Torch', beskrivelse: 'Upgraded torch. Extends sight by +2. Can be used for a larger sunfire that reveals a larger area, gives full HP and 100 gold. Lost in water.' },
    sovepose: { navn: 'Sleeping Bag', beskrivelse: 'Make camp in the wild and gain 20 HP (costs the rest of your energy). Damp caves make it rot immediately.' },
    silkesovepose: { navn: 'Silk Sleeping Bag', beskrivelse: 'Upgraded sleeping bag. Make camp in the wild and gain 40 HP. Cave damp ruins the lining, so it becomes an ordinary sleeping bag instead of being lost entirely.' },
    mad: { navn: 'Food Ration', beskrivelse: 'Gives +20 HP, and your next move costs 0 energy. Can be lost in ruins.' },
    kikkert_250: { navn: 'Golden Spyglass', beskrivelse: 'Breaks on crystal fields.' },
    kikkert_45: { navn: 'Golden Spyglass', beskrivelse: 'Breaks on crystal fields.' },
    diamant: { navn: 'Diamond', beskrivelse: 'A rare gem worth 250-600 gold. The value depends on size and is set when found.' },
    gylden_destillator: { navn: 'Golden Destillator', beskrivelse: 'Relic. Dug-up gold is worth double. With master shovel, digging gold is tripled instead of quadrupled.' },
    rodhjertet: { navn: 'Root Heart', beskrivelse: 'Relic. Healing roots give double HP, both when digging and when the Rune Rod pulls them up.' },
    hemmelighed: { navn: 'Treasure Map', beskrivelse: 'An old treasure map. Some islands may hide several treasures.' }
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
    Fantom: 'Phantom',
    Skyggekonge: 'Shadow King',
    Vildfaren: 'Stray',
    Forløber: 'Forerunner',
    Spejder: 'Scout',
    Stifinder: 'Pathfinder',
    Kortlægger: 'Cartographer',
    Vandrer: 'Wanderer',
    Banebryder: 'Trailblazer',
    Pioner: 'Pioneer',
    Opdagelsesrejsende: 'Expeditioner',
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
    Baron: 'Baron',
    Greve: 'Count',
    Markis: 'Marquess',
    Lensherre: 'Liege Lord',
    Hertug: 'Duke',
    Storfyrste: 'Grand Prince',
    Kronprins: 'Crown Prince',
    Enevældshersker: 'Autocrat',
    Kejser: 'Emperor',
    Krybskytte: 'Poacher',
    Sporhund: 'Tracker',
    Flåer: 'Skinner',
    Langbueskytte: 'Longbowman',
    Bueskytte: 'Archer',
    Vildtsporer: 'Game Tracker',
    Jæger: 'Hunter',
    Skarpskytte: 'Marksman',
    Falkeøje: 'Falcon Eye',
    Udyrsbetvinger: 'Beast Tamer',
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
    'Havets Hersker': 'Ruler of the Sea',
    Støvbider: 'Dust Biter',
    Stenknuser: 'Stone Crusher',
    Grubebisse: 'Mine Brute',
    Klippebryder: 'Rock Breaker',
    Smeltemester: 'Smeltmaster',
    Tunnelherre: 'Tunnel Lord',
    Malmbaron: 'Ore Baron',
    Guldherre: 'Gold Lord',
    Bjergkonge: 'Mountain King',
    'Dybdens Hersker': 'Ruler of the Deep',
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
    Maskemager: 'Maskmaker',
    Lykkejæger: 'Fortune Hunter',
    Dæmon: 'Demon',
    Kaosfyrste: 'Chaos Prince',
    Skæbnemager: 'Fatemaker'
};

export function karakterNavn(karakter?: Pick<Karakter, 'id' | 'navn'> | string | null) {
    const fundet = findKarakter(karakter);
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
