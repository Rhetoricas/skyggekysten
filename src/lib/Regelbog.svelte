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
                    <p>Du er drevet i land på en ø. Tågen kommer bagfra. Find en båd på den anden side af øen, før tågen omslutter dig eller du mister alle HP.</p>
                </section>

                <section>
                    <h3>Start og ø-navn</h3>
                    <p>Alle der skriver samme ø-navn, spiller på samme ø, hvis de går i land inden for de første fem dage. Offline-spil gemmes kun i browseren på den enhed.</p>
                </section>

                <section>
                    <h3>Tur, energi og bevægelse</h3>
                    <ul>
                        <li>Hver bevægelse koster energi. Når du løber tør, går der en ny dag.</li>
                        <li>Terræn kan være tungt eller let afhængigt af din karakter.</li>
                        <li>Energifelter du aldrig kan bruge med din nuværende baseenergi vises inaktive.</li>
                        <li>Hvis du kommer for langt foran den langsomste spiller i multiplayer, må du vente.</li>
                    </ul>
                </section>

                <section>
                    <h3>Syn og tåge</h3>
                    <ul>
                        <li>Du afslører felter omkring dig, når du bevæger dig.</li>
                        <li>Bjerge blokerer udsyn. Du kan ikke bare se hen over dem fra lavere terræn.</li>
                        <li>Tågen rykker frem over tid. Felter bag tågen er farlige eller utilgængelige.</li>
                        <li>Nogle sjældne events kan holde tågen tilbage eller blokere den bag et bestemt felt.</li>
                    </ul>
                </section>

                <section>
                    <h3>HP, skade og hvile</h3>
                    <ul>
                        <li>HP er dit helbred. Når HP når 0, dør du.</li>
                        <li>Rustning mindsker skade. Elverrustning beskytter som almindelig rustning, men er ikke tung. Ridder med rustning tager ingen skade fra nedgravede fælder.</li>
                        <li>Mad giver HP og gør næste bevægelse gratis. Sovepose og lejrbål kan bruges til hvile.</li>
                        <li>Viking og valkyrie går automatisk bersærk første gang pr. dag, de tager mindst 5 skade. Næste bevægelse koster 0 energi.</li>
                        <li>Oversvømmelse kan slukke fakler og få tung rustning til at gå tabt.</li>
                    </ul>
                </section>

                <section>
                    <h3>Gravning</h3>
                    <ul>
                        <li>Hvis feltet kan graves, vises graveikonet aktivt i inventory-linjen.</li>
                        <li>Har du en skovl, graves der med skovl. Ellers graver du med hænderne.</li>
                        <li>Skjulte fælder, guld og loot bliver først udløst, når du graver.</li>
                        <li>Metaldetektor og søgekvist kan afsløre tegn på skjult guld eller liv.</li>
                    </ul>
                </section>

                <section>
                    <h3>Felter</h3>
                    <ul>
                        <li>Byer og markeder kan have butikker. Byer kan også brydes op med dirk, hvis feltet er tomt.</li>
                        <li>Marker modner i blokke på ti dage. Modne afgrøder kan hjælpe dig, men naturkatastrofer kan ødelægge dem.</li>
                        <li>Guldminer giver point og kan overtages af andre spillere.</li>
                        <li>Portaler og magiske felter flytter dig, men landingsfeltet behandles som et normalt felt.</li>
                    </ul>
                </section>

                <section>
                    <h3>Inventory og udstyr</h3>
                    <ul>
                        <li>Tryk på en genstand i bunden for at bruge den, hvis den er aktiv.</li>
                        <li>Skovl, sovepose, mad og dirk er kun aktive, når de kan bruges på det aktuelle felt.</li>
                        <li>Fakkel kan lave bål. Staven kan teleportere. Hemmeligheder og særlige fund kan have egne effekter.</li>
                        <li>Nogle ting kan købes, andre findes kun i events.</li>
                    </ul>
                </section>

                <section>
                    <h3>Events</h3>
                    <p>Events er møder på øen. Nogle er små valg. Andre kan ændre store dele af kortet. Våben, klasse og udstyr kan åbne bedre eller farligere valg.</p>
                    <ul>
                        <li>Naturkatastrofer kan ændre terræn omkring dig.</li>
                        <li>Nogle events er sjældne og kommer først senere på øen.</li>
                        <li>Subevents er fortsættelser af samme event og bliver ikke trukket som almindelige events.</li>
                    </ul>
                </section>

                <section>
                    <h3>Tyveri</h3>
                    <p>Dirken kan bruges til indbrud på tomme byfelter. Det koster mindst halvdelen af din baseenergi. Udbyttet er moderat, og der er risiko for at blive opdaget og få tæv.</p>
                </section>

                <section>
                    <h3>Multiplayer</h3>
                    <ul>
                        <li>I ser samme ø og ændrer samme verden.</li>
                        <li>I ser ikke hinandens slutruter, før I selv er færdige.</li>
                        <li>Den samme loginbruger må ikke spille flere karakterer på samme ø samtidig.</li>
                        <li>Guldminer giver mere score i multiplayer, fordi de er sværere at holde.</li>
                    </ul>
                </section>

                <section>
                    <h3>Score</h3>
                    <ul>
                        <li>Score bygger på guld, udforskning, miner, fremdrift og HP.</li>
                        <li>Hvis du slipper væk, byttes fremdrift ud med en overlevelsesbonus.</li>
                        <li>Global highscore kræver login. Offline-score gemmes kun lokalt.</li>
                        <li>En særlig medalje kan gives ved ny global rekord, men kun hvis scoren også er høj nok.</li>
                    </ul>
                </section>

                <section>
                    <h3>Offline</h3>
                    <p>For at spille i et fly skal spillet først gøres fly-klar på samme enhed og i samme browser. Åbn spillet online, tryk Download, start eller fortsæt et offline-spil, og test derefter kort i flytilstand.</p>
                </section>
            </div>
        </div>
    </div>
{/if}

<style>
    .regelbog-knap {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        border: 1px solid #3a3a3a;
        background: rgba(255, 255, 255, 0.06);
        color: #f4f4f4;
        font-family: 'Cinzel', Georgia, serif;
        font-size: 1.8rem;
        line-height: 1;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, background 0.2s, border-color 0.2s;
    }

    .regelbog-knap:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: #666;
        transform: scale(1.04);
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
    }

    .regelbog-indhold p {
        margin: 0;
    }

    .regelbog-indhold ul {
        margin: 0;
        padding-left: 1.2rem;
    }

    .regelbog-indhold li + li {
        margin-top: 5px;
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
