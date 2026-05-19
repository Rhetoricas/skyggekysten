<script lang="ts">
    let { knapClass = '', knapTekst = '☰' } = $props<{ knapClass?: string; knapTekst?: string }>();

    let visRegler = $state(false);

    function aabnRegler() {
        visRegler = true;
    }

    function lukRegler() {
        visRegler = false;
    }

    function haandterTast(e: KeyboardEvent) {
        if (!visRegler) return;
        if (e.key === 'Escape') lukRegler();
    }
</script>

<svelte:window onkeydown={haandterTast} />

<button
    type="button"
    class="regelbog-knap {knapClass}"
    onclick={aabnRegler}
    title="Regelbog"
    aria-label="Åbn regelbog"
>
    {knapTekst}
</button>

{#if visRegler}
    <div class="regelbog-overlay" onclick={lukRegler} role="presentation">
        <div
            class="regelbog-modal"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="regelbog-titel"
            tabindex="-1"
        >
            <header class="regelbog-header">
                <div>
                    <p class="regelbog-kicker">Tågeøerne</p>
                    <h2 id="regelbog-titel">Regelbog</h2>
                </div>
                <button type="button" class="regelbog-luk" onclick={lukRegler} aria-label="Luk regelbog">×</button>
            </header>

            <div class="regelbog-indhold">
                <section>
                    <h3>Målet</h3>
                    <p>Du er drevet i land på en ø. Tågen kommer bagfra. Find en flugtbåd mod øst og gå ombord, før tågen lukker sig om dig.</p>
                    <p class="eksempel">Eksempel: Hvis en båd bliver synlig langt mod øst, behøver du ikke udforske alt. Det vigtigste er at nå frem, før tågen eller havet gør turen umulig.</p>
                </section>

                <section>
                    <h3>Start og ø-navn</h3>
                    <p>Alle der skriver samme ø-navn, spiller på samme ø. Nye spillere kan slutte sig til, så længe de aktive spillere ikke er kommet længere end dag 5. Offline-spil gemmes kun i browseren på den enhed.</p>
                    <p class="eksempel">Eksempel: Skriver I begge "Sortoe", lander I på samme ø. Hvis de aktive spillere er nået til dag 6, er det for sent for en ny spiller at gå i land på den tur.</p>
                </section>

                <section>
                    <h3>Tur, energi og bevægelse</h3>
                    <ul>
                        <li>Hver bevægelse koster energi. Prisen afhænger af karakter, udstyr, terræn og eventuelle terrænfordele.</li>
                        <li>Du kan godt bruge mere energi, end du har tilbage. Så går dagen videre efter handlingen, og du får ny energi.</li>
                        <li>Bevægelse i tågen koster 2 ekstra energi.</li>
                        <li>Mad og bersærkergang kan gøre næste bevægelse gratis.</li>
                        <li>Hvis du kommer mindst 5 dage foran den langsomste aktive spiller i multiplayer, må du vente. Du får én gratis ventespilsrunde på det felt, du står på; flere runder på samme felt koster 5 guld.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Har du 3 energi tilbage, og et bjerg koster 6, kan du stadig gå derind. Du ender på negativ energi, feltet aktiveres, og bagefter går tiden videre til næste dag.</p>
                </section>

                <section>
                    <h3>Syn og tåge</h3>
                    <ul>
                        <li>Du afslører felter omkring dig, når du bevæger dig. Din synsradius kommer fra karakteren og udstyr som fakkel.</li>
                        <li>Bjerge blokerer udsyn, medmindre du selv står på et bjerg. Bjergfelter giver mindst radius 2, når du kommer derop.</li>
                        <li>Tågen begynder at rykke efter dag 5. Hvis du står i tågen, når tiden går, tager du skade.</li>
                        <li>I tågen kan du lave blodoffer: -10 Max HP for +50 HP.</li>
                        <li>Nogle sjældne events kan holde tågen tilbage, blokere den bag et felt eller vise en båd for alle.</li>
                    </ul>
                    <p class="eksempel">Eksempel: En jæger eller udforsker ser længere end de fleste. Står der et bjerg imellem dig og kysten, kan ukendte farer stadig gemme sig bag det, indtil du får et bedre udsyn.</p>
                </section>

                <section>
                    <h3>HP, skade og hvile</h3>
                    <ul>
                        <li>HP er dit helbred. Når HP rammer 0 uden for tåge og hav, kollapser du normalt i stedet for at dø.</li>
                        <li>Ved kollaps mister du halvdelen af dit guld, tiden går, og du vågner kort efter med 10 HP.</li>
                        <li>Hvis HP rammer 0 i tågen eller i vand, dør du, medmindre en livseliksir redder dig først.</li>
                        <li>Livseliksir bruges automatisk ved dødelig skade eller kollaps og sætter HP til 90.</li>
                        <li>Rustning mindsker skade. Kongepanser mindsker skade med 70%, men er stadig tungt. Elverrustning beskytter som almindelig rustning, men er ikke tung. Ridder med rustning eller panser tager ingen skade fra nedgravede fælder.</li>
                        <li>Mad giver +20 HP og gør næste bevægelse gratis. Sovepose kan bruges i vildmarken og giver +20 HP, men bruger resten af dagen. Silkesovepose giver +40 HP og bliver kun nedgraderet til almindelig sovepose af hulefugt.</li>
                        <li>Fakkel udvider synet med +1. Solfakkel udvider synet med +2. Begge kan bruges til bål; solbålet afslører et større område og giver 100 guld i stedet for 50.</li>
                        <li>Viking og valkyrie går automatisk bersærk første gang pr. dag, de tager mindst 5 skade. Næste bevægelse koster 0 energi.</li>
                        <li>Hav og oversvømmelse kan slukke fakler og få tung rustning til at gå tabt.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Hvis du har 12 HP og står foran et farligt felt, kan mad være bedre end at spare det. Hvis du alligevel ryger i 0 HP på land, kollapser du; sker det i tågen eller vandet, er det langt farligere.</p>
                </section>

                <section>
                    <h3>Gravning</h3>
                    <ul>
                        <li>Hvis feltet kan graves, vises graveikonet aktivt i inventory-linjen.</li>
                        <li>Har du en skovl eller mesterskovl, graves der med den. Ellers graver du med hænderne og mister ekstra energi og HP.</li>
                        <li>En mesterskovl tæller som skovl, giver dobbelt guld ved gravning og finder nedgravede fælder uden at udløse dem.</li>
                        <li>Gylden Destillator er et sjældent relikvie. Den fordobler opgravet guld. Sammen med mesterskovl bliver graveguld tredoblet, ikke firedoblet.</li>
                        <li>Skjulte fælder, guld, rødder og loot bliver først udløst, når du graver. Feltet bliver markeret som gravet med det samme.</li>
                        <li>Metaldetektor og søgekvist kan afsløre tegn på skjult guld eller liv på kendte felter inden for radius 3 af din karakter. Malmviseren giver også 25% ekstra, når det skjulte guld graves frem, og guldminer inden for radius 2 bliver kendte felter, selv gennem bjerge.</li>
                        <li>Runekvisten er en opgraderet søgekvist. Når du mangler HP og går ind på et ugravet felt med skjult liv, trækker den rødderne op automatisk for 1 energi uden at markere feltet som gravet.</li>
                        <li>Når runekvisten virker, tømmes feltets skjulte guld, loot, fælde og liv. Andre kan stadig grave feltet, men der er kun sten og orme tilbage.</li>
                        <li>Rodhjertet er et sjældent relikvie. Det fordobler HP fra helende rødder, både ved gravning og Runekvist.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Viser metaldetektoren tegn på metal i en ruin, kan der være guld. Med almindelig skovl kan samme felt stadig klappe en fælde om benet på dig. Med mesterskovl får du mere ud af guldet, og fælden bliver fundet uden skade. Med runekvist kan du tage skjult liv på et felt, men så er feltets øvrige skjulte indhold også væk.</p>
                </section>

                <section>
                    <h3>Felter</h3>
                    <ul>
                        <li>Byer og markeder kan have butikker. Byer kan også have værksteder. Tomme byfelter kan brydes op med dirk.</li>
                        <li>Marker modner i blokke på ti dage. Modne afgrøder giver lidt HP, men kan høstes én gang pr. blok eller ødelægges af græshopper og katastrofer.</li>
                        <li>Guldminer giver guld og point. En ulåst mine kan overtages af andre spillere.</li>
                        <li>Første gang du overtager en mine, får du guld. Hvis du senere tager en tidligere besøgt mine tilbage, låses den.</li>
                        <li>En låst mine kan ikke overtages, men den kan stadig blive ødelagt af katastrofer.</li>
                        <li>Flugtbåde dukker normalt op på østkysten fra dag 6. Antallet følger de levende spillere. Hver båd kan bruges én gang.</li>
                        <li>Portaler slynger dig 4, 5 eller 6 felter mod øst. Landingsfeltet behandles som et normalt felt.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Du overtager en neutral mine og får guld. Kommer en anden spiller senere forbi, kan de tage den, hvis den ikke er låst. Hvis du tager den tilbage efter at have besøgt den før, låses den. Rammer en meteor feltet, forsvinder minen uanset ejer.</p>
                </section>

                <section>
                    <h3>Inventory og udstyr</h3>
                    <ul>
                        <li>Tryk på en genstand i bunden for at bruge den, hvis den er aktiv.</li>
                        <li>Skovl, sovepose/silkesovepose, mad og dirk er kun aktive, når de kan bruges i den aktuelle situation.</li>
                        <li>Kun mad og livseliksir kan stables i flere styk. Alle andre våben, værktøjer, tøj og særlige items findes kun én gang ad gangen.</li>
                        <li>Store værktøjer, våben og tøj findes kun i én version ad gangen. Skovl/mesterskovl, stav/dragestav, søgekvist/runekvist, detektor/malmviser, dirk/mesterdirk, kniv/mesterkniv, rustning/kongepanser, økse/stormøkse, bue/falkebue, fakkel/solfakkel, sovepose/silkesovepose og klude/fint tøj/royalt tøj tæller som samme type.</li>
                        <li>Fakkel og solfakkel kan lave bål. Stav og dragestav kan teleportere. Skattekort viser en gammel skatteklynge som et sepiafarvet kortspor. Nogle øer kan gemme på flere skatte, og kortet afslører ikke om kisten allerede er taget. Butikker sælger ikke flere skattekort til dig, når du har tydet alle øens spor.</li>
                        <li>Skattekortspor tæller ikke som almindelig udforskning og giver ikke udforskningspoint, før du selv kommer tæt nok på feltet.</li>
                        <li>Nogle ting kan købes, andre findes kun i events. Elverrustning, opgraderede items og relikvier kan ikke købes i almindelige butikker.</li>
                    </ul>
                    <p class="eksempel">Eksempel: En sovepose hjælper ikke midt i en by, men kan være stærk på roligere naturfelter. Et skattekort kan tegne et rødt spor mod en gammel klynge, men du ved først ved gravning, om kisten stadig findes.</p>
                </section>

                <section>
                    <h3>Værksteder</h3>
                    <p>Værksteder findes i større byer. De sælger ikke almindelige varer, men bygger dit eksisterende udstyr om til en bedre version. Du beholder ikke den gamle genstand ved siden af den nye.</p>
                    <p class="eksempel">Eksempel: Har du en skovl og 150 guld, kan værkstedet gøre den til en mesterskovl. Har du en sovepose og 150 guld, kan den blive til en silkesovepose. Har du klude og 100 guld, kan de blive til fint tøj. Fint tøj kan for 500 guld blive til royalt tøj, som giver stor guldbonus, men bliver nedgraderet til fint tøj, hvis det flænses.</p>
                </section>

                <section>
                    <h3>Events</h3>
                    <p>Events er møder på øen. Nogle er små valg. Andre kan ændre store dele af kortet. Våben, klasse og udstyr kan åbne bedre eller farligere valg.</p>
                    <ul>
                        <li>Naturkatastrofer kan ændre terræn omkring dig og kan fjerne miner, både, afgrøder, butikker og events på de ramte felter.</li>
                        <li>Skade fra events kan normalt føre til kollaps, hvis du rammer 0 HP. Hav, oversvømmelse og tåge kan dog slå dig rigtigt ihjel.</li>
                        <li>Nogle events er sjældne eller unikke. De kan give relikvier, som ikke kan købes i butikker.</li>
                        <li>Subevents er fortsættelser af samme event og bliver ikke trukket som almindelige events.</li>
                        <li>Hvis et event kræver eller bruger en almindelig genstand, kan en opgraderet version ofte tælle som samme type. Betales den, ryger den opgraderede genstand også.</li>
                        <li>Stormøksen forbedrer øksevalg i events med mere guld og mindre skade. Falkebuen forbedrer buevalg og afslører tre felter mod øst efter skuddet.</li>
                        <li>Meteorstenen kan åbnes med hænderne eller med udstyr. Mesterskovlen giver 600 guld og en diamant, men skovlen går tabt i stenen.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Et jordskælv kan gøre en eng til bjerg eller ruin. Hvis der lå en guldmine, butik, båd eller et værksted på feltet, er det væk bagefter. Et eventvalg kan altså være godt for dig her og nu, men dyrt for kortet.</p>
                </section>

                <section>
                    <h3>Tyveri</h3>
                    <p>Dirken kan bruges til indbrud på tomme byfelter uden butik. Det koster halvdelen af din baseenergi rundet op. Udbyttet er 35-50 guld, og der er risiko for at blive opdaget og få tæv. Mesterdirken giver dobbelt udbytte, men gør ikke indbruddet sikrere.</p>
                    <p class="eksempel">Eksempel: Hvis du mangler lidt guld til en opgradering, kan indbrud være fristende. Tyve bliver sjældnere opdaget end andre, mens tunge krigere larmer mere.</p>
                </section>

                <section>
                    <h3>Multiplayer</h3>
                    <ul>
                        <li>I ser samme ø og ændrer samme verden.</li>
                        <li>I ser ikke hinandens slutruter, før I selv er færdige.</li>
                        <li>Den samme loginbruger må ikke spille flere karakterer på samme ø samtidig.</li>
                        <li>Kun aktive spillere tæller som tempo-bremse. Hvis en spiller er død, sluppet væk eller inaktiv i flere minutter, holder de ikke de andre tilbage.</li>
                        <li>Jægere kan sætte en tracker, hvis de står på samme felt som en anden aktiv spiller. I 10 dage ser de de felter, den spiller kender.</li>
                        <li>Guldminer giver mere score i multiplayer, fordi de er sværere at holde. Minepoint stiger med antal spillere, op til en grænse.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Hvis en medspiller tager en mine, kan du se den skifte ejer på kortet. Hvis du senere går ind på den ulåste mine, overtager du den fra medspilleren. Hvis minen er låst, må du finde point et andet sted.</p>
                </section>

                <section>
                    <h3>Score</h3>
                    <ul>
                        <li>Score bygger på guld, udforskning, miner, udstyr, fremdrift eller flugtbonus, og en HP-multiplikator.</li>
                        <li>Udforskning giver 2 point pr. kendt felt.</li>
                        <li>Sepiafelter fra skattekort er kun kortspor og tæller ikke som kendte felter i score.</li>
                        <li>Fremdrift giver 2 point pr. kolonne mod øst. Hvis du slipper væk, får du 1000 point i stedet.</li>
                        <li>Miner giver 100 point pr. mine ganget med multiplayer-modifieren.</li>
                        <li>Udstyr giver point svarende til 2/3 af salgsprisen.</li>
                        <li>Til sidst ganges summen med 1 + HP/1000. Har du 100 HP, bliver summen ganget med 1,100.</li>
                        <li>Global highscore kræver login. Offline-score gemmes kun lokalt.</li>
                        <li>Hvis forbindelsen svigter, forsøger spillet at gemme ventende scores igen senere.</li>
                        <li>En særlig medalje kan gives ved ny global rekord, men kun hvis scoren også er høj nok.</li>
                    </ul>
                    <p class="eksempel">Eksempel: 1000 guld, 200 udforskningspoint, 300 minepoint og 1000 flugtpoint bliver 2500 før HP. Med 80 HP ender det på 2700 point.</p>
                </section>

                <section>
                    <h3>Offline</h3>
                    <p>For at spille i et fly skal spillet først gøres fly-klar på samme enhed og i samme browser. Åbn spillet online, tryk Download, start eller fortsæt et offline-spil, og test derefter kort i flytilstand.</p>
                    <p class="eksempel">Eksempel: Downloader du spillet i Chrome på en telefon, hjælper det ikke i Safari på samme telefon. Offline-gem og offline-score hører til den browser, de blev lavet i.</p>
                </section>
            </div>
        </div>
    </div>
{/if}

<style>
    .regelbog-knap {
        width: 48px;
        height: 48px;
        border: none;
        background: transparent;
        color: #f4f4f4;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1.8rem;
        line-height: 1;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
        transition: transform 0.2s, color 0.2s, text-shadow 0.2s;
    }

    .regelbog-knap:hover {
        color: #fff;
        transform: scale(1.04);
        text-shadow: 0 0 14px rgba(255, 255, 255, 0.45), 0 2px 8px rgba(0, 0, 0, 0.95);
    }

    .regelbog-overlay {
        position: fixed;
        inset: 0;
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        background: rgba(0, 0, 0, 0.82);
    }

    .regelbog-modal {
        width: min(820px, 94vw);
        max-height: min(86dvh, 900px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #151515;
        color: #f0f0f0;
        border: 1px solid #555;
        border-radius: 10px;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.75);
    }

    .regelbog-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        padding: 22px 24px 16px;
        border-bottom: 1px solid #333;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
    }

    .regelbog-kicker {
        margin: 0 0 4px;
        color: #aaa;
        font-size: 0.8rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .regelbog-header h2 {
        margin: 0;
        color: #fff;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 2rem;
        letter-spacing: 0;
    }

    .regelbog-luk {
        width: 42px;
        height: 42px;
        border: 1px solid #555;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
        font-size: 1.7rem;
        line-height: 1;
        cursor: pointer;
    }

    .regelbog-luk:hover {
        background: rgba(255, 255, 255, 0.12);
    }

    .regelbog-indhold {
        overflow-y: auto;
        padding: 20px 24px 26px;
        text-align: left;
    }

    .regelbog-indhold section {
        padding: 16px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .regelbog-indhold section:first-child {
        padding-top: 0;
    }

    .regelbog-indhold section:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }

    .regelbog-indhold h3 {
        margin: 0 0 8px;
        color: #fff;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1.08rem;
        letter-spacing: 0;
    }

    .regelbog-indhold p,
    .regelbog-indhold li {
        color: #d6d6d6;
        font-size: 1rem;
        line-height: 1.55;
        text-align: left;
    }

    .regelbog-indhold p {
        margin: 0;
    }

    .regelbog-indhold .eksempel {
        margin-top: 8px;
        padding: 10px 12px;
        color: #f1e7c8;
        background: rgba(255, 204, 0, 0.08);
        border-left: 3px solid rgba(255, 204, 0, 0.55);
        border-radius: 4px;
    }

    .regelbog-indhold ul {
        margin: 0;
        padding-left: 0;
        list-style: none;
    }

    .regelbog-indhold li + li {
        margin-top: 8px;
    }

    @media (max-width: 700px) {
        .regelbog-knap {
            width: 42px;
            height: 42px;
            font-size: 1.55rem;
        }

        .regelbog-overlay {
            padding: calc(env(safe-area-inset-top, 0px) + 10px) 10px calc(env(safe-area-inset-bottom, 0px) + 10px);
            align-items: stretch;
        }

        .regelbog-modal {
            width: 100%;
            max-height: 100%;
        }

        .regelbog-header {
            padding: 16px;
        }

        .regelbog-header h2 {
            font-size: 1.55rem;
        }

        .regelbog-indhold {
            padding: 16px;
        }

        .regelbog-indhold p,
        .regelbog-indhold li {
            font-size: 0.95rem;
        }
    }
</style>
