export const OE_NAVN_FORLED = ['rav', 'mose', 'jern', 'taage', 'maan', 'ask', 'skum', 'sort'];
export const OE_NAVN_EFTERLED = ['holm', 'vig', 'oe', 'rev', 'naes', 'skov', 'dal', 'borg'];

const STANDARD_OE_NAVNE = new Set(
    OE_NAVN_FORLED.flatMap((forled) => OE_NAVN_EFTERLED.map((efterled) => `${forled}${efterled}`))
);

export function normaliserOeNavn(navn: string) {
    return navn.trim().toLowerCase();
}

export function erStandardOeNavn(navn: string) {
    return STANDARD_OE_NAVNE.has(normaliserOeNavn(navn));
}
