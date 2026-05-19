import { spilTilstand } from './spilTilstand.svelte';

const titelKatalog: Record<string, string[]> = {
    knight: ['Væbner', 'Fodsoldat', 'Lejesvend', 'Kaptajn', 'Ridder', 'Bannerfører', 'Hærfører', 'Krigsherre', 'Paladin', 'Konge'],
    magician: ['Lærling', 'Novice', 'Akolyt', 'Illusionist', 'Elementalist', 'Besværger', 'Magister', 'Ærkemagiker', 'Runemester', 'Halvgud'],
    thief: ['Lommetyv', 'Røver', 'Indbrudstyv', 'Snigmorder', 'Skygge', 'Lurendrejer', 'Bandeleder', 'Syndikatboss', 'Fantom', 'Skyggekonge'],
    explorer: ['Vildfaren', 'Spejder', 'Stifinder', 'Kortlægger', 'Vandrer', 'Banebryder', 'Pioner', 'Opdagelsesrejsende', 'Erobrer', 'Legende'],
    viking: ['Træl', 'Bådsmand', 'Plyndrer', 'Øksebærer', 'Bersærk', 'Skjoldbryder', 'Høvding', 'Jarl', 'Søkonge', 'Einherjer'],
    royal: ['Arving', 'Hofsnog', 'Baron', 'Greve', 'Markis', 'Hertug', 'Storfyrste', 'Kronprins', 'Enevældshersker', 'Kejser'],
    hunter: ['Krybskytte', 'Sporhund', 'Flåer', 'Bueskytte', 'Jæger', 'Skarpskytte', 'Falkeøje', 'Udyrsbetvinger', 'Skovløber', 'Jagtmester'],
    pirate: ['Dæksdreng', 'Matros', 'Bådsmand', 'Skytte', 'Rorsmand', 'Styrmand', 'Kaptajn', 'Korsar', 'Piratkonge', 'Havets Hersker'],
    dwarf: ['Støvbider', 'Stenknuser', 'Grubebisse', 'Klippebryder', 'Smeltemester', 'Tunnelherre', 'Malmbaron', 'Guldherre', 'Bjergkonge', 'Dybdens Hersker'],
    orc: ['Kryb', 'Pjalt', 'Grønskolling', 'Kriger', 'Blodtørster', 'Krigsråber', 'Klanleder', 'Høvding', 'Krigsherre', 'Ødelægger'],
    joker: ['Nar', 'Gøgler', 'Taskenspiller', 'Jonglør', 'Trickster', 'Illusionist', 'Lykkejæger', 'Dæmon', 'Kaosfyrste', 'Skæbnemager']
};

export function hentTitel(karakterId: string, niveau: number): string {
    const klasse = karakterId.split('_')[0]; 
    const titler = titelKatalog[klasse] || titelKatalog['explorer'];
    const index = Math.max(0, Math.min(9, niveau - 1));
    return titler[index];
}

export function genererSlutHistorie(titel: string, niveau: number, oeNavn: string, vundet: boolean): string {
    const hp = Math.max(0, spilTilstand.livspoint);
    const guld = spilTilstand.guldTotal;
    const dag = spilTilstand.dag;
    const udstyr = spilTilstand.mitUdstyr || [];

    const harSvaerd = udstyr.some(i => ['svaerd', 'oekse', 'stormoekse', 'koelle', 'koelle_upgr', 'sabel', 'bue', 'mesterbue', 'kniv', 'mesterkniv', 'dragestav'].includes(i.id));
    const harSkovl = udstyr.some(i => ['skovl', 'mesterskovl', 'metaldetektor', 'malmviser'].includes(i.id));
    const harDiamant = udstyr.some(i => i.id === 'diamant');

    const oeNavnStort = oeNavn.toUpperCase();
    const titelStort = titel.toUpperCase();

    if (vundet) {
        let blok1: string;
        if (hp <= 25) {
            blok1 = `Du når kysten med ${hp} HP tilbage og må samle vejret, før du går videre. `;
        } else if (hp <= 75) {
            blok1 = `Du træder ud af tågen med ${hp} HP og tydelige spor efter rejsen. `;
        } else {
            blok1 = `Du finder kysten i god behold med ${hp} HP tilbage. `;
        }

        let blok2: string;
        if (harDiamant) {
            blok2 = "Diamanten ligger stadig sikkert i din oppakning. ";
        } else if (harSvaerd) {
            blok2 = "Dit våben bærer mærker efter turen. ";
        } else if (harSkovl) {
            blok2 = "Der sidder stadig jord på hænderne efter alt det, du gravede frem. ";
        } else {
            blok2 = "Du har ikke meget udstyr tilbage, men du nåede ud. ";
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = `På dag ${dag} forlader du øen med ${guld} guld. `;
        } else if (guld >= 400) {
            blok3 = `På dag ${dag} slipper du væk med ${guld} guld i tasken. `;
        } else {
            blok3 = `På dag ${dag} slipper du væk med ${guld} guld. Det var nok denne gang. `;
        }

        const blok4 = `Du ender på rang ${niveau}. Din titel: ${titelStort} AF ${oeNavnStort}`;

        return `${blok1}${blok2}${blok3}${blok4}`;
    } else {
        let blok2: string;
        if (harDiamant) {
            blok2 = "Diamanten kom ikke med dig ud. ";
        } else if (harSvaerd) {
            blok2 = "Dit våben ligger tilbage på øen. ";
        } else if (harSkovl) {
            blok2 = "Sporene efter dit gravearbejde er det eneste, der bliver tilbage. ";
        } else {
            blok2 = "Du nåede ikke at få nok med dig. ";
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = `Du nåede dag ${dag} og samlede ${guld} guld, men kom ikke væk. `;
        } else if (guld >= 400) {
            blok3 = `Du nåede dag ${dag} og samlede ${guld} guld, før turen sluttede. `;
        } else {
            blok3 = `Du faldt på dag ${dag} med ${guld} guld. `;
        }

        const blok4 = `Du ender på rang ${niveau}. Din titel: ${titelStort} AF ${oeNavnStort}`;

        return `${blok2}${blok3}${blok4}`;
    }
}
