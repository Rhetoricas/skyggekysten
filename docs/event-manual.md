# Eventmanual til Tågeøen

Denne manual beskriver den eventform, koden forventer lige nu. Brug den som kontrakt, når der skrives nye events, så teksterne kan sættes direkte ind i spillet uden at bryde motoren.

## Hvor events bor

Eventtyperne er defineret i `src/lib/eventBibliotek.ts`.

Events kan skrives direkte i `eventBibliotek`, men større pakker bør ligge i egne filer og importeres ind, ligesom disse:

- `event_blodskov.ts`
- `event_naturkatastrofer.ts`
- `event_meta.ts`
- `event_vaaben.ts`
- `event_specialitems.ts`

Nye eventpakker skal eksportere:

```ts
export const mineEvents: Record<string, SpilEvent> = {
    ...
};
```

Og derefter merges ind i `eventBibliotek`:

```ts
export const eventBibliotek: Record<string, SpilEvent> = {
    ...mineEvents,
    ...
};
```

## Grundstruktur

```ts
'event_id_i_snake_case': {
    id: 'event_id_i_snake_case',
    titel: 'Titel Som Spilleren Ser',
    tekst: 'Første brødtekst. Skriv scenen, konflikten og hvad der er på spil.',
    biome: ['skov', 'blodskov'],
    billede: '/events/ev_skov.webp',
    unik: true,
    vaegt: 1,
    kravDag: 3,
    minKolonnePct: 0.20,
    maxKolonnePct: 0.85,
    valg: [
        {
            tekst: 'Gør noget almindeligt.',
            udfaldListe: [
                { log: 'Resultattekst.', hpAendring: -8, guldAendring: 60 }
            ]
        }
    ]
}
```

## Eventfelter

`id`: Skal være unik og matche objektets nøgle. Brug `snake_case`.

`titel`: Kort titel, vises i eventmodalen.

`tekst`: Første scenetekst. Den bliver første loglinje i eventet.

`biome`: Hvor eventet må placeres. Kan være et biome-id, en liste, `'alle'` eller `'any'`.

`billede`: Valgfrit. Hvis det mangler, prøver UI at bruge `/events/ev_${biome}.webp`, ellers fallback `/events/event.webp`.

`vaegt`: Valgfri vægt i generatoren. Højere betyder mere sandsynligt, hvis eventet ellers passer.

`kravDag`: Eventet må først dukke op fra denne dag.

`minKolonnePct` / `maxKolonnePct`: Begrænser placering efter øst-vest-position. `0.20` betyder efter 20% af kortbredden.

`unik`: Hvis `true`, bør eventet kun placeres én gang på øen.

`sfx`: Feltet findes, men brug sparsomt og tjek lydsystemet før nye værdier.

`erSubTrin`: Bruges til multi-step events. Subtrin skal normalt ikke placeres på kortet som selvstændige events.

## Gyldige biomer

```ts
mark
eng
skov
bjerg
hule
ritual
ruin
bandit
hoejland
blodskov
by
hav
krystal
marked
slagmark
meteor
```

Bemærk: `by` og `marked` har ofte butikker eller værksteder. Undgå tunge grave-events dér, medmindre det er meningen.

## Valg

Hvert event har `valg: Valg[]`. Et valg kan være låst bag item, karakter, guld eller energi.

```ts
{
    tekst: 'Skær rebet over med kniven.',
    kraeverItem: 'kniv',
    udfaldListe: [
        { log: 'Kniven går rent igennem.', guldAendring: 80 },
        { log: 'Klingen smutter.', hpAendring: -10, guldAendring: 40 }
    ]
}
```

### Valgfelter der virker

`tekst`: Knapteksten.

`kraeverItem`: Kræver et item, men bruger det ikke.

`kosterItem`: Kræver et item og fjerner det, når valget tages.

`kraeverEtAfItems`: Kræver mindst ét item fra listen.

`kosterEnergi`: Kræver og bruger energi.

`kraeverKarakter`: Vises kun for én bestemt karakter-id.

`puljeVaerdi`: Kræver og bruger guld.

`udfaldListe`: Liste af mulige udfald. Ét vælges tilfældigt.

`effekt`: Funktion til speciallogik.

### Valgfelter der findes, men ikke bør bruges endnu

Disse ligger i typen, men motoren bruger dem ikke aktivt lige nu:

- `gemtForKarakter`
- `fordelItem`
- `fordelKarakter`
- `naesteTrin` direkte på `Valg`

Brug i stedet `naesteTrin` inde i et `Udfald`, eller `naesteEvent` inde i et `effekt`-resultat.

## Udfaldsliste

Et `Udfald` bruges inde i `udfaldListe`.

```ts
{
    log: 'Du finder en pung under stenen.',
    hpAendring: -6,
    maxHpAendring: 3,
    guldAendring: 90,
    givItem: 'mad',
    mistItem: 'fakkel',
    naesteTrin: 'event_id_subtrin',
    kollaps: true
}
```

`log`: Resultatteksten.

`hpAendring`: Positiv eller negativ HP. Negativ skade går gennem karakterens skadeberegning og rustning.

`maxHpAendring`: Ændrer max HP. Positiv ændring lægges også til nuværende HP.

`guldAendring`: Positiv eller negativ guldændring. Positiv indkomst går gennem karakterens og tøjets guldbonus.

`givItem`: Item-id eller kommasepareret liste, fx `'mad,diamant'`.

`mistItem`: Item-id eller kommasepareret liste. Hvis du skriver basis-id, fx `'kniv'`, kan motoren fjerne opgraderingen, hvis det er den spillerens version.

`naesteTrin`: Starter et subevent efter “Fortsæt”.

`kollaps`: Sætter spilleren til kollaps efter eventvalget.

## Effekt-funktioner

Brug `effekt`, når resultatet afhænger af nuværende felt, karakter, rygsæk, tilfældighed, tåge eller andre spillere.

```ts
{
    tekst: 'Betal 100 guld for et forsøg.',
    puljeVaerdi: 100,
    effekt: () => ({
        logBesked: 'Maskinen hoster og spytter mønter ud.',
        guldOp: 120
    })
}
```

Effekt-resultat kan bruge:

- `logBesked`
- `hpOp`
- `hpNed`
- `guldOp`
- `guldNed`
- `energiOp`
- `energiNed`
- `maxHpAendring`
- `itemUd`
- `naesteEvent`

Hvis valget har `kosterItem`, sender motoren det faktisk betalte item-id ind i funktionen. Det bruges fx til at se om spilleren betalte med `mesterskovl` i stedet for `skovl`:

```ts
effekt: (betaltItem?: string | null) => ({
    logBesked: betaltItem === 'mesterskovl'
        ? 'Mesterskovlen klarer arbejdet rent.'
        : 'Skovlen får arbejdet gjort.',
    guldOp: betaltItem === 'mesterskovl' ? 600 : 300
})
```

## Items og item-id'er

Brug altid id'et i kode, ikke visningsnavnet.

| ID | Navn | Type | Kan købes | Værdi |
|---|---|---:|---:|---:|
| `klude` | Klude | tøj | ja | 10 |
| `flot_toej` | Fint tøj | tøj | ja | 120 |
| `royalt_toej` | Royalt tøj | tøj | nej | 620 |
| `rustning` | Rustning | tøj | ja | 150 |
| `kongepanser` | Kongepanser | tøj | nej | 400 |
| `rustning_elver` | Elverrustning | tøj | nej | 900 |
| `kniv` | Kniv | våben | ja | 40 |
| `mesterkniv` | Mesterkniv | våben | nej | 190 |
| `dirk` | Dirk | værktøj | nej/evt | 0 |
| `mesterdirk` | Mesterdirk | værktøj | nej | 150 |
| `stav` | Stav | våben | ja | 100 |
| `dragestav` | Dragestav | våben | nej | 300 |
| `bue` | Bue | våben | ja | 60 |
| `mesterbue` | Falkebue | våben | nej | 235 |
| `oekse` | Økse | våben | ja | 80 |
| `stormoekse` | Stormøkse | våben | nej | 255 |
| `svaerd` | Sværd | våben | ja | 80 |
| `sabel` | Sabel | våben | ja | 60 |
| `skovl` | Skovl | værktøj | ja | 60 |
| `mesterskovl` | Mesterskovl | værktøj | nej | 210 |
| `metaldetektor` | Detektor | værktøj | ja | 150 |
| `malmviser` | Malmviser | værktøj | nej | 400 |
| `soegekvist` | Søgekvist | værktøj | ja | 150 |
| `runekvist` | Runekvist | værktøj | nej | 325 |
| `fakkel` | Fakkel | værktøj | ja | 150 |
| `solfakkel` | Solfakkel | værktøj | nej | 375 |
| `sovepose` | Sovepose | værktøj | ja | 80 |
| `silkesovepose` | Silkesovepose | værktøj | nej | 230 |
| `mad` | Madration | forbrug | ja | 30 |
| `livseliksir` | Livseliksir | forbrug | ja | 500 |
| `hemmelighed` | Skattekort | forbrug | ja | 100 |
| `diamant` | Diamant | skat | ja/salg | 500 |
| `gylden_destillator` | Gylden Destillator | skat | nej | 700 |
| `rodhjertet` | Rodhjertet | skat | nej | 500 |
| `kikkert_250` | Gylden Kikkert | forbandelse | nej | 100 |
| `kikkert_45` | Gylden Kikkert | forbandelse | nej | 100 |

## Opgraderede items som krav

Hvis et valg kræver basis-id, tæller opgraderingen normalt også:

- `skovl` tæller også `mesterskovl`
- `stav` tæller også `dragestav`
- `soegekvist` tæller også `runekvist`
- `dirk` tæller også `mesterdirk`
- `kniv` tæller også `mesterkniv`
- `rustning` tæller også `kongepanser`
- `oekse` tæller også `stormoekse`
- `bue` tæller også `mesterbue`
- `flot_toej` tæller også `royalt_toej`
- `fakkel` tæller også `solfakkel`
- `metaldetektor` tæller også `malmviser`
- `sovepose` tæller også `silkesovepose`

Vigtigt: `rustning_elver` tæller ikke automatisk som `rustning` i eventkrav. Hvis et valg skal acceptere begge, brug:

```ts
kraeverEtAfItems: ['rustning', 'rustning_elver']
```

## Auto-bonusser fra mesteritems i events

Motoren giver automatisk bonus, hvis et valg bruger disse basisitems:

`kniv`: Hvis spilleren har `mesterkniv`, får positive guldudfald x1.5 og negativ HP-skade x0.75.

`oekse`: Hvis spilleren har `stormoekse`, får positive guldudfald x1.5 og negativ HP-skade x0.5.

`bue`: Hvis spilleren har `mesterbue`, får positive guldudfald x1.25, negativ HP-skade x0.5, og tre felter mod øst afsløres efter valget.

Det virker når valget bruger `kraeverItem`, `kosterItem` eller `kraeverEtAfItems` med basis-id'et.

## Stack-regler

Disse items kan ligge i flere eksemplarer hos samme spiller: `mad`, `livseliksir`, `diamant`, `hemmelighed`, `fakkel` og `solfakkel`.

Alle andre items er normalt én pr. spiller. `tilfoejTilRygsæk` håndterer dubletter ved at afvise eller opgradere inden for samme udstyrsfamilie, men eventdesign bør stadig undgå at give dubletter af unikt udstyr som skovle, stave, våben, tøj, rustninger og specialværktøj.

## Karakterer og karakter-id'er

Brug `kraeverKarakter` til karakter-specifikke valg. Husk at mand/kvinde-versioner har forskellige id'er.

| ID | Navn | Startudstyr | Nøgleprofil |
|---|---|---|---|
| `knight_m` | Ridder | `svaerd`, `rustning`, `sovepose` | robust, panser, slagmark |
| `knight_f` | Skjoldmø | `svaerd`, `rustning`, `sovepose` | robust, panser, slagmark |
| `magician_m` | Troldmand | `stav`, `klude`, `livseliksir`, `sovepose` | skrøbelig, magi, krystal |
| `magician_f` | Troldkvinde | `stav`, `klude`, `livseliksir`, `sovepose` | skrøbelig, magi, krystal |
| `thief_m` | Tyv | `kniv`, `dirk`, `klude`, `sovepose` | hurtig, indbrud, bandit |
| `thief_f` | Skygge | `kniv`, `dirk`, `klude`, `sovepose` | hurtig, indbrud, bandit |
| `explorer_m` | Udforsker | `skovl`, `klude`, `sovepose` | højt syn, grave, hule/ruin |
| `explorer_f` | Eventyrer | `skovl`, `klude`, `sovepose` | højt syn, grave, hule/ruin |
| `viking_m` | Viking | `oekse`, `klude` | høj HP, bersærk, ingen sovepose |
| `viking_f` | Valkyrie | `oekse`, `klude` | høj HP, bersærk, ingen sovepose |
| `royal_m` | Hertug | `flot_toej`, `sovepose` | meget guld, social magt, intet våben |
| `royal_f` | Hertuginde | `flot_toej`, `sovepose` | meget guld, social magt, intet våben |
| `hunter_m` | Jæger | `bue`, `klude`, `sovepose` | bue, syn, skov/blodskov |
| `hunter_f` | Skytte | `bue`, `klude`, `sovepose` | bue, syn, skov/blodskov |
| `pirate_m` | Kaptajn | `sabel`, `klude`, `hemmelighed` | kapital, skattekort, hav |
| `pirate_f` | Korsar | `sabel`, `klude`, `hemmelighed` | kapital, skattekort, hav |
| `dwarf_m` | Dværg | `skovl`, `oekse`, `klude` | miner, bjerg/krystal, graveguld |
| `dwarf_f` | Minegraver | `skovl`, `oekse`, `klude` | miner, bjerg/krystal, graveguld |
| `orc_m` | Ork | `svaerd`, `klude` | meget HP, lav guldindkomst |
| `orc_f` | Klanleder | `svaerd`, `klude` | meget HP, lav guldindkomst |
| `joker_m` | Joker | `kniv` | lav HP, høj risiko, høj guldbonus |
| `joker_f` | Harlekin | `kniv` | lav HP, høj risiko, høj guldbonus |

## Balancetal

Små valg:

- HP: -5 til +20
- Guld: 25 til 90
- Max HP: -3 til +5

Mellemvalg eller itemkrav:

- HP: -10 til +35
- Guld: 80 til 180
- Max HP: +5 til +10

Store valg, unik event eller dyr betaling:

- HP: -20 til +50
- Guld: 180 til 350
- Max HP: +8 til +15
- Sjældne items kan gives, men bør føles som hovedbelønning.

Undgå ren “du dør”-randomness. Hvis et event kan slå hårdt, så giv spilleren et tydeligt farligt valg, en dyr udvej eller en mulighed for at betale med udstyr.

## Multi-step events

Et subevent skal have egen event-id og `erSubTrin: true`.

```ts
'min_event_start': {
    id: 'min_event_start',
    titel: 'Den Lukkede Port',
    tekst: 'Porten er låst, men noget bevæger sig bag den.',
    biome: ['ruin'],
    valg: [
        {
            tekst: 'Lirk låsen med dirken.',
            kraeverItem: 'dirk',
            udfaldListe: [
                { log: 'Låsen giver efter.', naesteTrin: 'min_event_bag_porten' }
            ]
        }
    ]
},

'min_event_bag_porten': {
    id: 'min_event_bag_porten',
    erSubTrin: true,
    titel: 'Bag Porten',
    tekst: 'Rummet bag porten er koldt og fuldt af støv.',
    biome: ['ruin'],
    valg: [
        {
            tekst: 'Tag den lille æske.',
            udfaldListe: [
                { log: 'Æsken er tung af mønter.', guldAendring: 120 }
            ]
        }
    ]
}
```

Når sidste trin ikke sender videre med `naesteTrin`, markerer motoren root-eventet som fuldført på feltet.

## Billeder

Brug eksisterende eventbilleder hvis muligt:

- `/events/ev_skov.webp`
- `/events/ev_bjerg.webp`
- `/events/ev_ruin.webp`
- `/events/ev_bandit.webp`
- `/events/ev_krystal.webp`
- `/events/ev_campfire.webp`
- `/events/ev_kikkert.webp`
- `/events/event.webp`

Hvis der laves nye billeder, brug webp og læg dem i `static/events/`.

## Tekststil

Gode events bør:

- Starte med en konkret situation, ikke en regeltekst.
- Give 2-4 valg, gerne med mindst ét almindeligt valg og ét item/karaktervalg.
- Lade dyre eller sjældne items føles stærke.
- Undgå at forklare tal i valgets tekst. Lad kvitteringen vise `(+80 Guld)` osv.
- Undgå at låse alle valg bag items. Hvis alle valg er låst, viser spillet kun “Flygt fra faren!”.

## Tjekliste før indsendelse

- Event-id er unikt og i `snake_case`.
- `id` matcher objektets nøgle.
- Alle item-id'er findes i `itemDB`.
- Alle karakter-id'er findes i `tilgaengeligeKarakterer`.
- `naesteTrin` peger på et eksisterende event-id.
- Subtrin har `erSubTrin: true`.
- `biome` bruger kun gyldige biome-id'er.
- Eventet har mindst ét valg, der ofte kan vælges.
- Hvis item skal bruges op, bruges `kosterItem`; hvis det kun skal kræves, bruges `kraeverItem`.
- Hvis guld gives, bruges `guldAendring` eller `guldOp`, så guldmodifikatorer virker.
- Hvis skade gives, bruges `hpAendring` eller `hpNed`, så skadeberegning virker.
