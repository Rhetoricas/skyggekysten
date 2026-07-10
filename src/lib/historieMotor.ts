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
                `Du når kysten med kun ${hp} HP tilbage. Først da båden ligger fri af land, tør du trække vejret roligt. `,
                `You reach the coast with only ${hp} HP left. Only when the boat pulls clear of shore do you finally breathe easy. `
            );
        } else if (hp <= 75) {
            blok1 = tekst(
                `Du træder ud af tågen med ${hp} HP. Rejsen har sat sine spor, men du står stadig. `,
                `You step out of the fog with ${hp} HP. The journey has left its mark, but you are still standing. `
            );
        } else {
            blok1 = tekst(
                `Du når kysten i god behold med ${hp} HP tilbage. Båden ligger klar foran dig. `,
                `You reach the coast in good shape with ${hp} HP left. The boat is waiting ahead. `
            );
        }

        let blok2: string;
        if (harDiamant) {
            blok2 = tekst(
                "Diamanten ligger stadig sikkert i din oppakning – et sjældent minde om det, du fandt på øen. ",
                "The diamond is still safe in your pack, a rare reminder of what you found on the island. "
            );
        } else if (harSvaerd) {
            blok2 = tekst(
                "Dit våben bærer mærker efter alt det, der stod mellem dig og kysten. ",
                "Your weapon bears the marks of everything that stood between you and the coast. "
            );
        } else if (harSkovl) {
            blok2 = tekst(
                "Der sidder stadig jord på dine hænder efter alt det, du gravede frem undervejs. ",
                "There is still soil on your hands from everything you uncovered along the way. "
            );
        } else {
            blok2 = tekst(
                "Der er ikke meget udstyr tilbage, men du kom ud med livet i behold. ",
                "Little of your equipment remains, but you made it out alive. "
            );
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = tekst(
                `På dag ${dag} forlader du øen med hele ${guld} guld. `,
                `On day ${dag}, you leave the island with an impressive ${guld} gold. `
            );
        } else if (guld >= 400) {
            blok3 = tekst(
                `På dag ${dag} slipper du væk med ${guld} guld i tasken. Det rækker til mere end bare den næste rejse. `,
                `On day ${dag}, you escape with ${guld} gold in your bag, enough for more than the next journey. `
            );
        } else {
            blok3 = tekst(
                `På dag ${dag} slipper du væk med ${guld} guld. Det er ikke en formue, men du er fri af øen. `,
                `On day ${dag}, you escape with ${guld} gold. It is no fortune, but you are free of the island. `
            );
        }

        const blok4 = tekst(
            `Rejsen slutter på rang ${niveau}. Du forlader øen som ${titelStort} fra ${oeNavnStort}.`,
            `The journey ends at rank ${niveau}. You leave the island as ${titelStort} from ${oeNavnStort}.`
        );

        return `${blok1}${blok2}${blok3}${blok4}`;
    } else {
        let blok2: string;
        if (harDiamant) {
            blok2 = tekst(
                "Diamanten bliver liggende et sted i tågen, langt fra kysten. ",
                "The diamond remains somewhere in the fog, far from the coast. "
            );
        } else if (harSvaerd) {
            blok2 = tekst(
                "Dit våben ligger tilbage på øen, hvor rejsen sluttede. ",
                "Your weapon remains on the island where the journey ended. "
            );
        } else if (harSkovl) {
            blok2 = tekst(
                "De åbne huller i jorden står tilbage som spor efter din vej over øen. ",
                "The open pits remain as traces of your path across the island. "
            );
        } else {
            blok2 = tekst(
                "Du nåede hverken båden eller et sikkert sted at vente. ",
                "You reached neither the boat nor a safe place to wait. "
            );
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = tekst(
                `Du nåede dag ${dag} og samlede ${guld} guld, men flugtbåden forblev uden for rækkevidde. `,
                `You reached day ${dag} and gathered ${guld} gold, but the escape boat remained out of reach. `
            );
        } else if (guld >= 400) {
            blok3 = tekst(
                `Du nåede dag ${dag} og samlede ${guld} guld, før rejsen endte i tågen. `,
                `You reached day ${dag} and gathered ${guld} gold before the journey ended in the fog. `
            );
        } else {
            blok3 = tekst(
                `På dag ${dag} slap kræfterne op. Du faldt med ${guld} guld på dig. `,
                `On day ${dag}, your strength gave out. You fell carrying ${guld} gold. `
            );
        }

        const blok4 = tekst(
            `Rejsen slutter på rang ${niveau}. På øen ${oeNavnStort} bliver du husket som ${titelStort}.`,
            `The journey ends at rank ${niveau}. On the island of ${oeNavnStort}, you are remembered as ${titelStort}.`
        );

        return `${blok2}${blok3}${blok4}`;
    }
}
