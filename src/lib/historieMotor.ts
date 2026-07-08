import { spilTilstand } from './spilTilstand.svelte';
import { tekst } from './i18n.svelte';
import { titelNavn } from './spilTekst';

const titelKatalog: Record<string, string[]> = {
    knight: ['Væbner', 'Fodsoldat', 'Lejesvend', 'Kompagnifører', 'Lansefører', 'Bannerfører', 'Hærfører', 'Hærmester', 'Paladin', 'Konge'],
    magician: ['Aspirant', 'Novice', 'Akolyt', 'Illusionist', 'Elementalist', 'Besværger', 'Magister', 'Ærkemagiker', 'Runemester', 'Halvgud'],
    thief: ['Lommetyv', 'Røver', 'Indbrudstyv', 'Snigmorder', 'Nattegænger', 'Lurendrejer', 'Bandeleder', 'Syndikatboss', 'Fantom', 'Skyggekonge'],
    explorer: ['Vildfaren', 'Forløber', 'Stifinder', 'Kortlægger', 'Vandrer', 'Banebryder', 'Pioner', 'Opdagelsesrejsende', 'Erobrer', 'Legende'],
    viking: ['Træl', 'Langskibsroer', 'Plyndrer', 'Øksebærer', 'Bersærk', 'Skjoldbryder', 'Høvding', 'Jarl', 'Søkonge', 'Einherjer'],
    royal: ['Arving', 'Hofsnog', 'Baron', 'Greve', 'Markis', 'Lensherre', 'Storfyrste', 'Kronprins', 'Enevældshersker', 'Kejser'],
    hunter: ['Krybskytte', 'Sporhund', 'Flåer', 'Langbueskytte', 'Vildtsporer', 'Skarpskytte', 'Falkeøje', 'Udyrsbetvinger', 'Skovløber', 'Jagtmester'],
    pirate: ['Dæksdreng', 'Matros', 'Bådsmand', 'Kanonér', 'Rorsmand', 'Styrmand', 'Skibsfører', 'Fribytter', 'Piratkonge', 'Havets Hersker'],
    dwarf: ['Støvbider', 'Stenknuser', 'Grubebisse', 'Klippebryder', 'Smeltemester', 'Tunnelherre', 'Malmbaron', 'Guldherre', 'Bjergkonge', 'Dybdens Hersker'],
    orc: ['Kryb', 'Pjalt', 'Grønskolling', 'Stridsmand', 'Blodtørster', 'Krigsråber', 'Klanleder', 'Klanherre', 'Blodherre', 'Ødelægger'],
    joker: ['Nar', 'Gøgler', 'Taskenspiller', 'Jonglør', 'Trickster', 'Maskemager', 'Lykkejæger', 'Dæmon', 'Kaosfyrste', 'Skæbnemager']
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
    const titelStort = titelNavn(titel).toUpperCase();

    if (vundet) {
        let blok1: string;
        if (hp <= 25) {
            blok1 = tekst(
                `Du når kysten med ${hp} HP tilbage og må samle vejret, før du går videre. `,
                `You reach the coast with ${hp} HP left and have to catch your breath before moving on. `
            );
        } else if (hp <= 75) {
            blok1 = tekst(
                `Du træder ud af tågen med ${hp} HP og tydelige spor efter rejsen. `,
                `You step out of the fog with ${hp} HP and clear marks from the journey. `
            );
        } else {
            blok1 = tekst(
                `Du finder kysten i god behold med ${hp} HP tilbage. `,
                `You find the coast in good shape with ${hp} HP left. `
            );
        }

        let blok2: string;
        if (harDiamant) {
            blok2 = tekst(
                "Diamanten ligger stadig sikkert i din oppakning. ",
                "The diamond is still safe in your pack. "
            );
        } else if (harSvaerd) {
            blok2 = tekst(
                "Dit våben bærer mærker efter turen. ",
                "Your weapon bears marks from the journey. "
            );
        } else if (harSkovl) {
            blok2 = tekst(
                "Der sidder stadig jord på hænderne efter alt det, du gravede frem. ",
                "There is still soil on your hands from everything you dug up. "
            );
        } else {
            blok2 = tekst(
                "Du har ikke meget udstyr tilbage, men du nåede ud. ",
                "You do not have much equipment left, but you made it out. "
            );
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = tekst(
                `På dag ${dag} forlader du øen med ${guld} guld. `,
                `On day ${dag}, you leave the island with ${guld} gold. `
            );
        } else if (guld >= 400) {
            blok3 = tekst(
                `På dag ${dag} slipper du væk med ${guld} guld i tasken. `,
                `On day ${dag}, you escape with ${guld} gold in your bag. `
            );
        } else {
            blok3 = tekst(
                `På dag ${dag} slipper du væk med ${guld} guld. Det var nok denne gang. `,
                `On day ${dag}, you escape with ${guld} gold. It was enough this time. `
            );
        }

        const blok4 = tekst(
            `Du ender på rang ${niveau}. Din titel: ${titelStort} AF ${oeNavnStort}`,
            `You end at rank ${niveau}. Your title: ${titelStort} OF ${oeNavnStort}`
        );

        return `${blok1}${blok2}${blok3}${blok4}`;
    } else {
        let blok2: string;
        if (harDiamant) {
            blok2 = tekst(
                "Diamanten kom ikke med dig ud. ",
                "The diamond did not make it out with you. "
            );
        } else if (harSvaerd) {
            blok2 = tekst(
                "Dit våben ligger tilbage på øen. ",
                "Your weapon lies behind on the island. "
            );
        } else if (harSkovl) {
            blok2 = tekst(
                "Sporene efter dit gravearbejde er det eneste, der bliver tilbage. ",
                "The traces of your digging are all that remain. "
            );
        } else {
            blok2 = tekst(
                "Du nåede ikke at få nok med dig. ",
                "You did not manage to bring enough with you. "
            );
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = tekst(
                `Du nåede dag ${dag} og samlede ${guld} guld, men kom ikke væk. `,
                `You reached day ${dag} and gathered ${guld} gold, but did not escape. `
            );
        } else if (guld >= 400) {
            blok3 = tekst(
                `Du nåede dag ${dag} og samlede ${guld} guld, før turen sluttede. `,
                `You reached day ${dag} and gathered ${guld} gold before the journey ended. `
            );
        } else {
            blok3 = tekst(
                `Du faldt på dag ${dag} med ${guld} guld. `,
                `You fell on day ${dag} with ${guld} gold. `
            );
        }

        const blok4 = tekst(
            `Du ender på rang ${niveau}. Din titel: ${titelStort} AF ${oeNavnStort}`,
            `You end at rank ${niveau}. Your title: ${titelStort} OF ${oeNavnStort}`
        );

        return `${blok2}${blok3}${blok4}`;
    }
}
