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

    const harSvaerd = udstyr.some(i => ['svaerd', 'oekse', 'sabel', 'bue', 'dragestav'].includes(i.id));
    const harSkovl = udstyr.some(i => ['skovl', 'mesterskovl', 'metaldetektor'].includes(i.id));
    const harDiamant = udstyr.some(i => i.id === 'diamant');

    const oeNavnStort = oeNavn.toUpperCase();
    const titelStort = titel.toUpperCase();

    if (vundet) {
        let blok1: string;
        if (hp <= 25) {
            blok1 = `Du slæber dig op på stranden med kun ${hp} HP tilbage i kroppen og smager jern i munden. `;
        } else if (hp <= 75) {
            blok1 = `Du træder ud af mørket med ${hp} HP og mærker udmattelsen trække i knoglerne. `;
        } else {
            blok1 = `Kysten åbner sig foran dig. Du står rank med hele ${hp} HP, og tågen har knapt sat sine spor. `;
        }

        let blok2: string;
        if (harDiamant) {
            blok2 = "En kølig, massiv diamant kaster et skarpt lys fra din lomme. ";
        } else if (harSvaerd) {
            blok2 = "Dit våben er hakket og sløvt af de brutale kampe, du tog undervejs. ";
        } else if (harSkovl) {
            blok2 = "Dine hænder er dækket af tykt mudder fra de hemmeligheder, du flåede op af undergrunden. ";
        } else {
            blok2 = "Dine fingre er tomme, og rygsækken rasler hult i vinden. ";
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = `Du afsluttede rejsen på Dag ${dag} med et overskud, der trodser fornuften. Hele ${guld} guldklumper tynger dig ned. `;
        } else if (guld >= 400) {
            blok3 = `Tiden pressede dig, men på Dag ${dag} krydser du grænsen med ${guld} mønter klirrende i tasken. `;
        } else {
            blok3 = `Du nåede slutningen på Dag ${dag}, blottet for rigdom med usle ${guld} guld. Overlevelse må være belønning nok i sig selv. `;
        }

        const blok4 = `Du har banet dig vej helt op til rang ${niveau}. Din nye titel: ${titelStort} AF ${oeNavnStort}`;

        return `${blok1}${blok2}${blok3}${blok4}`;
    } else {
        let blok2: string;
        if (harDiamant) {
            blok2 = "Den massive diamant ligger nu ubrugelig og kold i din lomme. ";
        } else if (harSvaerd) {
            blok2 = "Dit beskadigede våben ligger rustent i græsset ved siden af dig. ";
        } else if (harSkovl) {
            blok2 = "Dine stive fingre klamrer sig stadig fast til det mudder, du gravede i. ";
        } else {
            blok2 = "Dine tomme hænder griber krampagtigt ud i luften. ";
        }

        let blok3: string;
        if (guld >= 1500) {
            blok3 = `De ${guld} guldklumper, du grådigt samlede frem til Dag ${dag}, kan ikke købe dig fri fra mørket. `;
        } else if (guld >= 400) {
            blok3 = `Du nåede frem til Dag ${dag} og skrabede ${guld} mønter sammen. Nu tilhører de bare undergrunden igen. `;
        } else {
            blok3 = `Du faldt på Dag ${dag} med usle ${guld} mønter. Du var aldrig tiltænkt storhed. `;
        }

        const blok4 = `Dit fald stopper på rang ${niveau}. Din sidste titel: ${titelStort} AF ${oeNavnStort}`;

        return `${blok2}${blok3}${blok4}`;
    }
}
