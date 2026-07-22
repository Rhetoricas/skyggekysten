# Roadmap og idebank

Senest opdateret: 2026-07-19

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

- Banditlejr-shop: overvej at banditfelter kan have en lille sortbørs-shop med kølle og dirk til salg.
- Lager kan have begrænset antal pr. dag, men pas på at det føles som en dum butik.
- Dagsgenopfyldning koster tid, så det kan være en strategi uden at være gratis.
- Flere ens basisvarer i en butik kan være tilfældigt 1-3, hvis det ikke giver shopping-mikrostyring.

## Highscore og scoreopgørelse

Nuværende retning:

- Toplister viser 10 ad gangen, men global/klasse er top 100.
- Highscore-rækker kan klikkes for opgørelse.
- Detaljer hentes lazy pr. række, så top 100 ikke henter unødige felter.
- Score gemmer `player_count`, så man kan se solo/multiplayer.
- Medaljer findes som scorebaserede niveauer i dag. Særlige trofævarianter er kun et roadmap-spor, ikke implementeret.

Åbne ideer:

- Overvej filtrering/visning for solo vs multiplayer.
- Overvej om top 10-listen skal give særlig medalje eller markering mere synligt.
- Gamle highscores kan rettes direkte i DB ved navneændringer, hvis der kun er få.

### Medaljer og særlige trofæer

Roadmap-status:

- Implementeret: standardmedalje ud fra score samt ni trofætyper med almindelig og mytisk variant.
- De præcise krav kan ses ved at åbne trofæerne på profilen.
- Almindelige trofæer kræver, at spilleren slipper levende væk. Mytiske trofæer kræver desuden et solospil og det almindelige trofæ i samme samling.
- En gennemspilning kan opfylde flere trofækrav. Nye trofæer gemmes på profilen og knyttes til spillets resultat.
- Resultatet gemmer lette trofæmålinger, så opgørelsen kan vises uden at hente log/rute/tung detaljedata på toplisten.

### Spillertips til medaljer og trofæer

Formål:

- Giv spilleren strategisk hjælp til at gå efter en bestemt medalje eller et bestemt trofæ uden at love en sikker opskrift.
- Skeln mellem **krav** og **tip**: kravteksten siger, hvad der tæller; tippet foreslår, hvordan spilleren kan bygge sin tur op.
- Bevar opdagelse og genspilningsværdi. Tips må gerne nævne relevante systemer og afvejninger, men bør ikke afsløre faste kortplaceringer, eventtabeller eller optimale facitlister.
- Skriv korte, konkrete råd i spillets tone. Ét godt råd er bedre end en lang guide.

Anbefalet placering:

- Vis et kort "Sådan kan du gå efter den" under kravteksten, når et låst eller opnået trofæ åbnes på profilen.
- Vis generelle medaljetips ved scoreopgørelsen eller som roterende tips før en ny tur.
- Lad mytiske varianter genbruge grundtippet og tilføje en tydelig note om, at de kun kan opnås solo.
- Overvej senere fremdrift fra seneste afsluttede spil, fx "8/12 miner", men undgå en permanent HUD-tjekliste under selve turen.

Generelle medaljetips:

- Forklar, at medaljescoren kommer fra flere spor: guld, udforskning, miner, resterende udstyr og at slippe væk. Spilleren behøver derfor ikke satse alt på én aktivitet.
- Gør det tydeligt, at høj resterende HP løfter hele grundscoren. En rig tur med meget lav HP er ikke nødvendigvis den bedste scoretur.
- Mind spilleren om, at flugt giver en stor fremdriftsbonus, og at udstyr i rygsækken stadig har pointværdi ved spilslut.
- Højere medaljer bør beskrives som et valg mellem grådighed og sikker hjemrejse: byg værdien op, men planlæg udgangen, før tågen eller skaderne lukker turen.
- Medalje 11 bør fortsat have sit særskilte, præcise råd: mindst 12.500 point og en placering i ugens top ti.

Forslag til trofæspecifikke tips:

- **Mineejer:** Læg en rute gennem områder med mange miner, og behold ressourcer nok til at overtage dem. Det er de miner, du stadig ejer ved flugten, der tæller.
- **Tågekonge:** Forbered heling, mad og en kendt vej mod udgangen, før du bevidst tager mange bevægelser i tågen. Overlevelsen er stadig en del af kravet.
- **Bølgebærer:** Start først oversvømmelsen, når du har HP, heling og en realistisk flugtvej. Kun vandhændelser, der faktisk giver skade, tæller.
- **Relikviejæger:** Behold Rodhjertet, Gylden Destillator, Dragestav og Runekvist, når du finder dem. Planlæg turen omkring flere kilder til sjældne genstande, og undgå at sælge eller ofre dem før flugten.
- **Guldfyrste:** Det er guldbeholdningen ved flugten, der tæller. Sælg overflødigt udstyr nær slutningen, og undgå dyre sidsteøjeblikskøb, når målet er tæt på.
- **Livvogter:** Kun HP, der faktisk bliver gendannet, tæller. Spred helingen over turen, og sørg for at have mistet HP, før du bruger stærke helinger.
- **Korttegner:** Prioritér udsyn, udforskning og kontrollerede omveje frem for den korteste rute. Sørg samtidig for at vende om i tide, så den lange kortlægning ender med flugt.
- **Udstyrsmester:** Saml forskellige opgraderede genstande og behold dem samtidig i rygsækken. Royalt tøj er særligt værdifuldt, fordi det tæller som to opgraderingspoint.
- **Diamantjæger:** Det er den fulde råværdi af alle diamanter fundet i turen, der tæller, så tidligere fund tæller fortsat, selv hvis diamanterne senere sælges. Opsøg flere diamantkilder frem for kun at håbe på ét stort fund.

Åbne designspørgsmål for tips:

- Skal alle tips være synlige fra starten, eller skal et mere konkret tip låses op efter første mislykkede forsøg på trofæet?
- Skal tips være faste pr. trofæ eller rotere mellem 2-3 korte råd?
- Skal seneste trofæmålinger kun vises efter spilslut, eller også på profilen som hjælp til næste forsøg?
- Skal tips nævne bestemte karakterer og klassefordele, eller holdes karakterneutrale for at undgå én oplevet facitløsning?

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
