# Roadmap og idebank

Senest opdateret: 2026-05-22

Dette dokument er til ideer, balancering og designspor, som skal være nemme at finde igen. Det er ikke en kravspecifikation. Når noget herfra skal laves, skal vi stadig tale det igennem først, især hvis det ændrer centrale regler.

## Arbejdsaftaler

- Når Gert skriver "ikke kode", skal der ikke ændres kode.
- Ved mekanik og balance: læs eksisterende kode før vurdering.
- Bevar spillets enkelhed. Hvis en sjov regel kræver mange særregler, skal den mistænkes.
- Multiplayer-regler skal vurderes for griefing, mistet forbindelse og ventetid.
- Samme ø-navn skal føles som samme ø: overfladen kan læres, men undergrunden må gerne overraske.

## Grundprincipper

- Samme ø skal bevare overfladen: form, biomer, byer, markeder, shops, værksteder, portaler, lejrbål/events og faste guldminefelter.
- Ny gennemspilning skal rerolle undergrunden: skjult guld, rødder, fælder, loot og skat.
- Highscore skal være forståelig og sammenlignelig. Vis kun bonuslinjer, når de faktisk påvirker scoren.
- Afsluttede spillere må ikke blokere multiplayer. Spillere der mister forbindelsen må højst drille midlertidigt.

## Launch-nære tjekpunkter

- Test at en færdig spiller ikke genoptages som en gammel "zombie" på en tidligere dag.
- Test at "Samme ø igen" renser forurenet ø-session uden at skifte grundkort.
- Test at idle-forbindelse holder i ventespil og på slutkort efter sejr/død.
- Test at nye karakter-navne gemmes og vises korrekt i highscores.
- Kør Supabase-migration for `game_results.player_count`, hvis den ikke allerede er kørt:

```sql
alter table public.game_results
add column if not exists player_count integer not null default 1;
```

## Ventespil

Nuværende mekanik:

- Ventespil trigger, når en spiller prøver at rykke og er mindst 5 dage foran langsomste aktive spiller.
- Modal lukker automatisk, når de andre indhenter dagtallet, eller når Impens tid løber ud.
- Efter lukning får spilleren fredning indtil egen dag + 5.
- Impen er tidsbegrænset, så man ikke kan campere bordet uendeligt.

Åbne ideer:

- Kortere imp-tid end 60 sekunder, hvis modal stadig føles stressende.
- Bedre tekst i modal: forklar tydeligt at spilleren er foran, og hvad der lukker bordet.
- Undersøg om "fredning" skal føles mere som egne spillemuligheder end som dagtal.
- Overvej om puljen/gevinst skal give mere følelsen af kompensation for ventetiden.

Risici:

- For lang ventetid føles som tab af kontrol.
- For generøs fredning kan udnyttes af spillere, der bevidst skyder langt frem.
- For hård catch-up-regel kan gøre hurtige spillere frustrerede.

## Ork, kølle og smadring

Nuværende retning:

- Ork skal være sjov og brutal, ikke drukne i særregler.
- Kølle/murknuser må gerne åbne stærke plays, men skal have tydelige omkostninger.
- Shops/værksteder skal ikke nødvendigvis lukke globalt, men naboer kan nægte at handle med den spiller, der lige har smadret.

Åbne ideer:

- Test om smadring stadig er for stærk i multiplayer, især værksteder med mange penge.
- Overvej om værksted efter én opgradering nægter mere handel med køllebæreren.
- Hold øje med om "køb alt og smadr bagefter" stadig er sjovt eller for dominerende.
- Undgå regeltekst der siger butikken lukker for alle, hvis den reelt kun nægter handel med én spiller.

## Shops og lager

Nuværende retning:

- Shopvarer er en del af øens overflade og bør være samme på samme ø.
- Købte varer kan fyldes tilbage ved ny gennemspilning.
- Mad, fakler og livseliksir skal holdes øje med, fordi de kan konvertere overskudsguld til overlevelse/items.

Åbne ideer:

- Lager kan have begrænset antal pr. dag, men pas på at det føles som en dum butik.
- Dagsgenopfyldning koster tid, så det kan være en strategi uden at være gratis.
- Flere ens basisvarer i en butik kan være tilfældigt 1-3, hvis det ikke giver shopping-mikrostyring.

## Highscore og scoreopgørelse

Nuværende retning:

- Toplister viser 10 ad gangen, men global/klasse er top 100.
- Highscore-rækker kan klikkes for opgørelse.
- Detaljer hentes lazy pr. række, så top 100 ikke henter unødige felter.
- Score gemmer `player_count`, så man kan se solo/multiplayer.

Åbne ideer:

- Overvej filtrering/visning for solo vs multiplayer.
- Overvej om top 10-listen skal give særlig medalje eller markering mere synligt.
- Gamle highscores kan rettes direkte i DB ved navneændringer, hvis der kun er få.

## Multiplayer og forbindelse

Nuværende retning:

- Heartbeat holder forbindelsen i live under `play` og på slutskærme/slutkort.
- Start-flow auto-refresher én gang efter 10 sekunder, hvis det hænger på forbindelse.
- Afsluttet spiller skrives aktivt tilbage til ø-sessionen, så andre ikke blokeres.

Åbne ideer:

- Overvej synlig forbindelsesindikator, hvis spillere ofte oplever idle-tab.
- Test længere idle på mobil og desktop: ventespil, login-skærm, sejrskort, dødskort.
- Overvej om realtime-kanal skal genstartes med fast interval, kun hvis status viser problemer.

## Karakterer og navne

Aktuelle navne der er vigtige:

- Troldmand og Vølve er klassen Magikere.
- Opdager erstatter Udforsker.
- Dronning erstatter Hertuginde.
- Graver og Kriger bruges som kortere navne.
- "Tøj" bruges i stedet for "klude" i spillertekst.

Åbne ideer:

- Løbende stram karakterkorttekster som regelskriver: korte, sande, og gerne forskellige på kønsvarianter.
- Tjek at alle gamle navne er ude af UI, hvis databasen er rettet.
- Hold øje med om klassenavne på scoretavler føles naturlige i flertal.

## Balancepunkter

- Guldminer må ikke gøre spillet til et rent minespil.
- Dværg/Graver har lavere guldbonus end tidligere og skal testes igen.
- Harlekin/Joker kan eksplodere med guld og miner; det kan være sjovt, men kræver risiko.
- Medaljekrav skal føles stigende og ikke have mærkelige spring mellem de sidste niveauer.

## Event-ideer og tekst

- Spejl-eventet skal være forståeligt uden eksakte værdier.
- Felter med flere effekter, fx portal plus lejrbål, skal undgå tvetydig timing.
- Meteor-eventet kan bruge kølle.
- Kikkert-event skal centrere karakteren bagefter.

## Ting der ikke må glemmes

- Same-island design: spilleren skal kunne lære øen over mange gennemspilninger.
- Undergrunden må ikke være fast facitliste.
- Hvis en DB-oprydning kun sletter spiller-entry, kan ø-sessionen stadig være forurenet med gammelt kort/tåge. Spillet skal håndtere tom, men forurenet session.
- Når en bug virker løst ved manuel refresh, er det ofte et idle/realtime/auth-problem, ikke nødvendigvis spilmekanik.
