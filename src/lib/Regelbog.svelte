<script lang="ts">
    import { sprogState, tekst } from '$lib/i18n.svelte';

    let { knapClass = '', knapTekst = '', onOpen } = $props<{ knapClass?: string; knapTekst?: string; onOpen?: () => void }>();

    let visRegler = $state(false);

    function aabnRegler() {
        visRegler = true;
        onOpen?.();
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
    title={tekst('Regelbog', 'Rulebook')}
    aria-label={tekst('Åbn regelbog', 'Open rulebook')}
>
    {#if knapTekst}
        {knapTekst}
    {:else}
        <svg class="regelbog-ikon" viewBox="0 0 48 48" aria-hidden="true">
            <path class="bog-side bog-side-venstre" d="M8 10h12c3.2 0 5.4 1.2 6 3.2V39c-.9-1.7-3-2.7-6-2.7H8z" />
            <path class="bog-side bog-side-hoejre" d="M40 10H28c-3.2 0-5.4 1.2-6 3.2V39c.9-1.7 3-2.7 6-2.7h12z" />
            <path class="bog-ryg" d="M24 13v26" />
            <path class="bog-linje" d="M13 17h8M13 23h8M29 17h6M29 23h8M29 29h6" />
        </svg>
    {/if}
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
                    <p class="regelbog-kicker">{tekst('Tågeøerne', 'Fog Isles')}</p>
                    <h2 id="regelbog-titel">{tekst('Regelbog', 'Rulebook')}</h2>
                </div>
                <button type="button" class="regelbog-luk" onclick={lukRegler} aria-label={tekst('Luk regelbog', 'Close rulebook')}>×</button>
            </header>

            <div class="regelbog-indhold">
                {#if sprogState.sprog === 'en'}
                <section>
                    <h3>Goal</h3>
                    <p>You wash ashore on an island. The fog comes from behind. Find an escape boat toward the east and board it before the fog closes around you.</p>
                    <p class="eksempel">Example: If a boat appears far east, you do not need to explore everything. The main thing is reaching it before fog or sea makes the route impossible.</p>
                </section>

                <section>
                    <h3>Start And Island Name</h3>
                    <p>Everyone who writes the same island name plays on the same island. New players can join as long as the active players have not gone past day 5. Offline games are saved only in the browser on that device.</p>
                    <p class="eksempel">Example: If both of you enter "Sortoe", you land on the same island. If active players have reached day 6, it is too late for a new player to land on that run.</p>
                </section>

                <section>
                    <h3>Turns, Energy And Movement</h3>
                    <ul>
                        <li>Each move costs energy. The cost depends on character, equipment, terrain and terrain bonuses.</li>
                        <li>You may spend more energy than you have left. The action still happens, then the day advances and you get new energy.</li>
                        <li>Moving in fog costs 2 extra energy.</li>
                        <li>Food can make the next move free. Berserk can make the next energy-costing action free.</li>
                        <li>If you get at least 5 days ahead of the slowest active multiplayer character, the waiting game opens. The table closes when the slowest reaches your day, when fog is close to the field, or after at most 60 seconds. When it closes, you can play at least 5 days before another waiting game. You get one free waiting-game round on the field you stand on; more rounds on the same field cost 5 gold.</li>
                    </ul>
                    <p class="eksempel">Example: If you have 3 energy left and a mountain costs 6, you can still enter it. You end on negative energy, the field activates, and then time advances to the next day.</p>
                </section>

                <section>
                    <h3>Sight And Fog</h3>
                    <ul>
                        <li>You reveal fields around you when moving. Sight radius comes from your character and equipment such as torches.</li>
                        <li>Mountains block sight unless you stand on a mountain. Mountain fields give at least radius 2 when you climb up.</li>
                        <li>The fog starts moving after day 6. If you stand in fog when time passes, you take damage. You cannot camp in fog.</li>
                        <li>Some rare events can hold fog back, block it behind a field or reveal a boat for everyone.</li>
                    </ul>
                    <p class="eksempel">Example: Hunters, archers, explorers and adventurers see farther than most. If a mountain stands between you and the coast, unknown danger can still hide behind it until you get better sight.</p>
                </section>

                <section>
                    <h3>HP, Damage And Rest</h3>
                    <ul>
                        <li>HP is your health. When HP reaches 0 outside fog and sea, you normally collapse instead of dying.</li>
                        <li>On collapse you lose half your gold, time passes, and you wake shortly after with 10 HP.</li>
                        <li>If HP reaches 0 in fog or water, you die unless a life elixir saves you first.</li>
                        <li>Life elixir is used automatically on lethal damage or collapse and restores you to up to 90 HP, even if your max is higher.</li>
                        <li>Armor reduces damage. Royal armor reduces damage by 70%. Armor and royal armor are normally heavy, but Knight and Shieldmaiden ignore the weight and take no damage from buried traps. Elven armor protects like normal armor, but is not heavy.</li>
                        <li>Food gives +20 HP and makes the next move free. Sleeping bag can be used in the wild and gives +20 HP, but uses the rest of the day. Silk sleeping bag gives +40 HP and is only downgraded by cave damp.</li>
                        <li>Torch gives +1 sight. Sun torch gives +2 sight. Both can light campfires; sunfire reveals a larger area and gives 100 gold instead of 50.</li>
                        <li>Viking and Valkyrie automatically go berserk the first time each day they take at least 5 damage. The next energy-costing action costs 0 energy.</li>
                        <li>Water and floods extinguish torches. Normal armor and royal armor are lost in water; elven armor is not.</li>
                    </ul>
                </section>

                <section>
                    <h3>Digging</h3>
                    <ul>
                        <li>If a field can be dug, the dig icon in the inventory row becomes active.</li>
                        <li>If you have a shovel or master shovel, you dig with it. Otherwise you dig with your hands and lose extra energy and HP.</li>
                        <li>A master shovel counts as a shovel, gives double digging gold and finds buried traps without triggering them.</li>
                        <li>The Golden Destillator is a rare relic. It doubles dug-up gold. With master shovel, digging gold is tripled, not quadrupled.</li>
                        <li>Hidden traps, gold, roots and loot trigger only when you dig. The field is marked as dug immediately.</li>
                        <li>Detector and dowsing rod reveal signs of hidden gold or life on known fields within radius 3 of your character. Ore Finder also gives 25% extra when hidden gold is dug up, and gold mines within radius 2 become known fields even through mountains.</li>
                        <li>Rune Rod is an upgraded dowsing rod. When you lack HP and enter an undug field with hidden life, it pulls the roots up automatically for 1 energy without marking the field as dug.</li>
                        <li>When Rune Rod works, the field's hidden gold, loot, trap and life are emptied. Others can still dig the field, but only stones and worms remain.</li>
                        <li>Root Heart is a rare relic. It doubles HP from healing roots, both by digging and Rune Rod.</li>
                    </ul>
                </section>

                <section>
                    <h3>Fields</h3>
                    <ul>
                        <li>Towns and markets can have shops. Towns can also have workshops. Empty town fields can be broken into with a lockpick.</li>
                        <li>Shops refill fixed goods after a new day has passed. If you have club or wallbreaker, the merchant stops trading with you after one purchase.</li>
                        <li>Fields ripen in ten-day blocks. Ripe crops give a little HP, but can be harvested once per block or ruined by locusts and disasters.</li>
                        <li>Gold mines give gold and points. An unlocked mine can be taken over by other players.</li>
                        <li>The first time you take over a mine, you get gold. If you later take back a mine you have visited before, it locks.</li>
                        <li>A locked mine cannot be taken over, but disasters can still destroy it.</li>
                        <li>Escape boats normally appear on the east coast from day 6. The number follows living players. Each boat can be used once. When you board, you win.</li>
                        <li>Portals throw you 4, 5 or 6 fields east. The landing field is handled like a normal field.</li>
                    </ul>
                </section>

                <section>
                    <h3>Inventory And Equipment</h3>
                    <ul>
                        <li>Tap an item at the bottom to use it when it is active.</li>
                        <li>Shovel, sleeping bag/silk sleeping bag, food, lockpick and club are active only when they can be used in the current situation.</li>
                        <li>Food, life elixir, torches, treasure maps and diamonds can stack. Diamonds are worth 250-600 gold: below 375 is small, 375-499 is large, and 500+ is huge. Most other weapons, tools, clothes and special items can exist only once at a time.</li>
                        <li>Large tools, weapons and clothes exist in only one version at a time. Upgrade pairs such as shovel/master shovel, staff/dragon staff, detector/ore finder and clothes/fine/royal clothes count as the same type.</li>
                        <li>Torch and sun torch can light fires. Staff and dragon staff can teleport. Treasure maps show an old treasure cluster as a sepia map trail. Some islands hide several treasures, and the map does not reveal whether the chest has already been taken.</li>
                        <li>Treasure map trails do not count as normal exploration and give no exploration points until you personally get close enough to the field.</li>
                        <li>Some items can be bought, others are found only in events. Elven armor, upgraded items and relics cannot be bought in ordinary shops.</li>
                    </ul>
                </section>

                <section>
                    <h3>Workshops</h3>
                    <p>Workshops are found in larger towns. They do not sell ordinary goods, but rebuild your existing equipment into a better version. You do not keep the old item beside the new one.</p>
                    <p class="eksempel">Example: With a shovel and 150 gold, a workshop can make it a master shovel. With a sleeping bag and 150 gold, it can become a silk sleeping bag. Clothes can become fine clothes, and fine clothes can become royal clothes.</p>
                </section>

                <section>
                    <h3>Events</h3>
                    <p>Events are encounters on the island. Some are small choices. Others can change large parts of the map. Weapons, class and equipment can open better or more dangerous choices.</p>
                    <ul>
                        <li>Natural disasters can change terrain around you and can remove mines, boats, crops, shops and events on affected fields.</li>
                        <li>Damage from events can normally lead to collapse if you hit 0 HP. Sea, flood and fog can kill you outright.</li>
                        <li>Some events are rare or unique. They can give relics that cannot be bought in shops.</li>
                        <li>Subevents are continuations of the same event and are not drawn as ordinary events.</li>
                        <li>If an event requires or spends an ordinary item, an upgraded version often counts as the same type. If paid, the upgraded item is lost too.</li>
                        <li>Storm Axe improves axe choices in events with more gold and less damage. Falcon Bow improves bow choices and reveals three fields east after the shot.</li>
                        <li>The meteor stone can be opened with hands or tools like shovel, axe, club and sword. If opened with a tool, the tool is lost and you get gold and a diamond. Master shovel gives the best reward. The gold is event gold and is affected by gold modifier.</li>
                    </ul>
                </section>

                <section>
                    <h3>Theft</h3>
                    <p>The lockpick can be used for burglary on empty town fields without shops. It costs half your base energy rounded up. The reward is 35-50 gold, with a risk of being caught and beaten. Master Lockpick gives double reward, but does not make burglary safer.</p>
                </section>

                <section>
                    <h3>Smashing</h3>
                    <p>The club can smash markets and ordinary town fields into ruins. Markets cost 8 energy and 20 base damage. Town fields cost 16 energy and 30 base damage. Workshops cost 24 energy, 50 base damage and require Wallbreaker. Base loot is 45-75, 90-150 or 225 gold plus two thirds of the cash box, affected by gold modifier. Nearby merchants refuse to trade with you afterwards.</p>
                </section>

                <section>
                    <h3>Multiplayer</h3>
                    <ul>
                        <li>You see the same island and change the same world.</li>
                        <li>You do not see each other's final routes before you finish.</li>
                        <li>The same login user cannot play multiple characters on the same island at the same time.</li>
                        <li>Only active players slow the tempo. Dead, escaped or inactive players stop holding others back.</li>
                        <li>Hunters can place a tracker when standing on the same field as another active player. For 10 days they see the fields that player knows.</li>
                        <li>Gold mines give more score in multiplayer because they are harder to hold. Mine points rise with player count up to a limit.</li>
                        <li>Total score also gets multiplayer modifier: 1 player x1.0, 2 players x1.1, 3 players x1.2, 4 players x1.3, 5 players x1.4 and 6+ players x1.5.</li>
                    </ul>
                </section>

                <section>
                    <h3>Score</h3>
                    <ul>
                        <li>Score is built from gold, exploration, mines, equipment, progress or escape bonus, plus HP and multiplayer multipliers.</li>
                        <li>Exploration gives 2 points per known field.</li>
                        <li>Sepia fields from treasure maps are only map trails and do not count as known fields in score.</li>
                        <li>Progress gives 2 points per column east. If you escape, you get 1000 points instead.</li>
                        <li>Mines give 100 points per mine multiplied by the mine modifier for player count.</li>
                        <li>Equipment gives points equal to 2/3 of the sale price.</li>
                        <li>Finally, the sum is multiplied by 1 + HP/1000. With 100 HP, the sum is multiplied by 1.100.</li>
                        <li>Global highscore requires login. The end screen shows local island score, global character-class score and global overall score. Offline score is saved only locally.</li>
                        <li>If the connection fails, the game tries to save pending scores again later.</li>
                        <li>Medal 11 is awarded only if you score at least 12500 and place in the first ten spots on the weekly leaderboard.</li>
                    </ul>
                </section>

                <section>
                    <h3>Offline</h3>
                    <p>To play on a plane, the game must first be made flight-ready on the same device and in the same browser. Open the game online, tap Download, start or continue an offline game, and then test the map in flight mode.</p>
                    <p class="eksempel">Example: Downloading the game in Chrome on a phone does not help Safari on the same phone. Offline saves and offline scores belong to the browser where they were made.</p>
                </section>
                {:else}
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
                        <li>Mad kan gøre næste bevægelse gratis. Bersærkergang kan gøre næste energikrævende handling gratis.</li>
                        <li>Hvis du kommer mindst 5 dage foran den langsomste aktive spiller i multiplayer, åbner ventespillet. Bordet lukker, når den langsomste når din dag, når tågen er tæt på feltet, eller efter højst 60 sekunder. Når bordet lukker, kan du spille mindst 5 dage uden nyt ventespil. Du får én gratis ventespilsrunde på det felt, du står på; flere runder på samme felt koster 5 guld.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Har du 3 energi tilbage, og et bjerg koster 6, kan du stadig gå derind. Du ender på negativ energi, feltet aktiveres, og bagefter går tiden videre til næste dag.</p>
                </section>

                <section>
                    <h3>Syn og tåge</h3>
                    <ul>
                        <li>Du afslører felter omkring dig, når du bevæger dig. Din synsradius kommer fra karakteren og udstyr som fakkel.</li>
                        <li>Bjerge blokerer udsyn, medmindre du selv står på et bjerg. Bjergfelter giver mindst radius 2, når du kommer derop.</li>
                        <li>Tågen begynder først at rykke efter dag 6. Hvis du står i tågen, når tiden går, tager du skade. Du kan ikke slå lejr i tågen.</li>
                        <li>Nogle sjældne events kan holde tågen tilbage, blokere den bag et felt eller vise en båd for alle.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Jæger, skytte, opdager og eventyrer ser længere end de fleste. Står der et bjerg imellem dig og kysten, kan ukendte farer stadig gemme sig bag det, indtil du får et bedre udsyn.</p>
                </section>

                <section>
                    <h3>HP, skade og hvile</h3>
                    <ul>
                        <li>HP er dit helbred. Når HP rammer 0 uden for tåge og hav, kollapser du normalt i stedet for at dø.</li>
                        <li>Ved kollaps mister du halvdelen af dit guld, tiden går, og du vågner kort efter med 10 HP.</li>
                        <li>Hvis HP rammer 0 i tågen eller i vand, dør du, medmindre en livseliksir redder dig først.</li>
                        <li>Livseliksir bruges automatisk ved dødelig skade eller kollaps og giver dig op til 90 HP tilbage, selv om dit max er højere.</li>
                        <li>Rustning mindsker skade. Kongepanser mindsker skade med 70%. Rustning og kongepanser er normalt tunge, men Ridder og Skjoldmø ignorerer vægten og tager ingen skade fra nedgravede fælder. Elverrustning beskytter som almindelig rustning, men er ikke tung.</li>
                        <li>Mad giver +20 HP og gør næste bevægelse gratis. Sovepose kan bruges i vildmarken og giver +20 HP, men bruger resten af dagen. Silkesovepose giver +40 HP og bliver kun nedgraderet til almindelig sovepose af hulefugt.</li>
                        <li>Fakkel udvider synet med +1. Solfakkel udvider synet med +2. Begge kan bruges til bål; solbålet afslører et større område og giver 100 guld i stedet for 50.</li>
                        <li>Viking og valkyrie går automatisk bersærk første gang pr. dag, de tager mindst 5 skade. Næste energikrævende handling koster 0 energi.</li>
                        <li>Vand og oversvømmelse slukker fakler. Almindelig rustning og kongepanser går tabt i vand; elverrustning gør ikke.</li>
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
                        <li>Butikker genfylder deres faste varer, når en ny dag er gået. Har du kølle eller murknuser, stopper den handlende med at handle med dig efter et køb.</li>
                        <li>Marker modner i blokke på ti dage. Modne afgrøder giver lidt HP, men kan høstes én gang pr. blok eller ødelægges af græshopper og katastrofer.</li>
                        <li>Guldminer giver guld og point. En ulåst mine kan overtages af andre spillere.</li>
                        <li>Første gang du overtager en mine, får du guld. Hvis du senere tager en tidligere besøgt mine tilbage, låses den.</li>
                        <li>En låst mine kan ikke overtages, men den kan stadig blive ødelagt af katastrofer.</li>
                        <li>Flugtbåde dukker normalt op på østkysten fra dag 6. Antallet følger de levende spillere. Hver båd kan bruges én gang. Når du går ombord, har du vundet.</li>
                        <li>Portaler slynger dig 4, 5 eller 6 felter mod øst. Landingsfeltet behandles som et normalt felt.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Du overtager en neutral mine og får guld. Kommer en anden spiller senere forbi, kan de tage den, hvis den ikke er låst. Hvis du tager den tilbage efter at have besøgt den før, låses den. Rammer en meteor feltet, forsvinder minen uanset ejer.</p>
                </section>

                <section>
                    <h3>Inventory og udstyr</h3>
                    <ul>
                        <li>Tryk på en genstand i bunden for at bruge den, hvis den er aktiv.</li>
                        <li>Skovl, sovepose/silkesovepose, mad, dirk og kølle er kun aktive, når de kan bruges i den aktuelle situation.</li>
                        <li>Mad, livseliksir, fakler, skattekort og diamanter kan stables i flere styk. Diamanter er 250-600 guld værd: under 375 er lille, 375-499 er stor, og 500+ er enorm. De fleste andre våben, værktøjer, tøj og særlige items findes kun én gang ad gangen.</li>
                        <li>Store værktøjer, våben og tøj findes kun i én version ad gangen. Skovl/mesterskovl, stav/dragestav, søgekvist/runekvist, detektor/malmviser, dirk/mesterdirk, kniv/mesterkniv, rustning/kongepanser, økse/stormøkse, kølle/murknuser, bue/falkebue, fakkel/solfakkel, sovepose/silkesovepose og tøj/fint tøj/royalt tøj tæller som samme type.</li>
                        <li>Fakkel og solfakkel kan lave bål. Stav og dragestav kan teleportere. Skattekort viser en gammel skatteklynge som et sepiafarvet kortspor. Nogle øer kan gemme på flere skatte, og kortet afslører ikke om kisten allerede er taget. Butikker sælger ikke flere skattekort til dig, når du har tydet alle øens spor.</li>
                        <li>Skattekortspor tæller ikke som almindelig udforskning og giver ikke udforskningspoint, før du selv kommer tæt nok på feltet.</li>
                        <li>Nogle ting kan købes, andre findes kun i events. Elverrustning, opgraderede items og relikvier kan ikke købes i almindelige butikker.</li>
                    </ul>
                    <p class="eksempel">Eksempel: En sovepose hjælper ikke midt i en by, men kan være stærk på roligere naturfelter. Et skattekort kan tegne et rødt spor mod en gammel klynge, men du ved først ved gravning, om kisten stadig findes.</p>
                </section>

                <section>
                    <h3>Værksteder</h3>
                    <p>Værksteder findes i større byer. De sælger ikke almindelige varer, men bygger dit eksisterende udstyr om til en bedre version. Du beholder ikke den gamle genstand ved siden af den nye.</p>
                    <p class="eksempel">Eksempel: Har du en skovl og 150 guld, kan værkstedet gøre den til en mesterskovl. Har du en sovepose og 150 guld, kan den blive til en silkesovepose. Har du tøj og 100 guld, kan det blive til fint tøj. Fint tøj kan for 500 guld blive til royalt tøj, som giver stor guldbonus, men bliver nedgraderet til fint tøj, hvis det flænses.</p>
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
                        <li>Meteorstenen kan åbnes med hænderne eller med udstyr som skovl, økse, kølle og sværd. Åbner du den med et værktøj, går værktøjet tabt, og du får guld og en diamant. Mesterskovlen giver det største udbytte. Guldet behandles som event-guld og påvirkes af guldmodifier.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Et jordskælv kan gøre en eng til bjerg eller ruin. Hvis der lå en guldmine, butik, båd eller et værksted på feltet, er det væk bagefter. Et eventvalg kan altså være godt for dig her og nu, men dyrt for kortet.</p>
                </section>

                <section>
                    <h3>Tyveri</h3>
                    <p>Dirken kan bruges til indbrud på tomme byfelter uden butik. Det koster halvdelen af din baseenergi rundet op. Udbyttet er 35-50 guld, og der er risiko for at blive opdaget og få tæv. Mesterdirken giver dobbelt udbytte, men gør ikke indbruddet sikrere.</p>
                    <p class="eksempel">Eksempel: Hvis du mangler lidt guld til en opgradering, kan indbrud være fristende. Tyve bliver sjældnere opdaget end andre, mens tunge krigere larmer mere.</p>
                </section>

                <section>
                    <h3>Smadring</h3>
                    <p>Køllen kan smadre markeder og almindelige byfelter til ruiner. Markeder koster 8 energi og 20 grundskade. Byfelter koster 16 energi og 30 grundskade. Værksteder koster 24 energi, 50 grundskade og kræver Murknuser. Grundbyttet er 45-75, 90-150 eller 225 guld plus to tredjedele af kassen, påvirket af guldmodifier. Handlende på nabofelter nægter bagefter at handle med dig.</p>
                    <p class="eksempel">Eksempel: En ork kan købe en vare på et marked og bagefter smadre markedet for at få noget af værdien tilbage fra kassen. Prisen er tid og blod: energien kan ryge langt under nul, og svage karakterer kan knække på selve smadringen.</p>
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
                        <li>Den samlede score får også multiplayer-modifier: 1 spiller x1.0, 2 spillere x1.1, 3 spillere x1.2, 4 spillere x1.3, 5 spillere x1.4 og 6+ spillere x1.5.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Hvis en medspiller tager en mine, kan du se den skifte ejer på kortet. Hvis du senere går ind på den ulåste mine, overtager du den fra medspilleren. Hvis minen er låst, må du finde point et andet sted.</p>
                </section>

                <section>
                    <h3>Score</h3>
                    <ul>
                        <li>Score bygger på guld, udforskning, miner, udstyr, fremdrift eller flugtbonus, og HP- og multiplayer-multiplikatorer.</li>
                        <li>Udforskning giver 2 point pr. kendt felt.</li>
                        <li>Sepiafelter fra skattekort er kun kortspor og tæller ikke som kendte felter i score.</li>
                        <li>Fremdrift giver 2 point pr. kolonne mod øst. Hvis du slipper væk, får du 1000 point i stedet.</li>
                        <li>Miner giver 100 point pr. mine ganget med mine-modifieren for antal spillere.</li>
                        <li>Udstyr giver point svarende til 2/3 af salgsprisen.</li>
                        <li>Til sidst ganges summen med 1 + HP/1000. Har du 100 HP, bliver summen ganget med 1,100.</li>
                        <li>Global highscore kræver login. Slutskærmen viser lokal ø-score, global karakterklasse-score og global samlet score. Offline-score gemmes kun lokalt.</li>
                        <li>Hvis forbindelsen svigter, forsøger spillet at gemme ventende scores igen senere.</li>
                        <li>Medalje 11 gives kun, hvis du scorer mindst 12500 og kommer på en af de første ti pladser på ugens topliste.</li>
                    </ul>
                    <p class="eksempel">Eksempel: 1000 guld, 200 udforskningspoint, 300 minepoint og 1000 flugtpoint bliver 2500 før HP. Med 80 HP ender det på 2700 point.</p>
                </section>

                <section>
                    <h3>Offline</h3>
                    <p>For at spille i et fly skal spillet først gøres fly-klar på samme enhed og i samme browser. Åbn spillet online, tryk Download, start eller fortsæt et offline-spil, og test derefter kort i flytilstand.</p>
                    <p class="eksempel">Eksempel: Downloader du spillet i Chrome på en telefon, hjælper det ikke i Safari på samme telefon. Offline-gem og offline-score hører til den browser, de blev lavet i.</p>
                </section>
                {/if}
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
        font-size: 1.35rem;
        line-height: 1;
        font-weight: 700;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95);
        transition: transform 0.2s, color 0.2s, text-shadow 0.2s;
    }

    .regelbog-ikon {
        width: 37px;
        height: 37px;
        overflow: visible;
        filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.72));
    }

    .bog-side {
        fill: rgba(216, 228, 222, 0.9);
        stroke: #f4fbf8;
        stroke-width: 1.7;
        stroke-linejoin: round;
    }

    .bog-side-hoejre {
        fill: rgba(188, 204, 197, 0.88);
    }

    .bog-ryg,
    .bog-linje {
        fill: none;
        stroke: #52605b;
        stroke-width: 1.8;
        stroke-linecap: round;
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

        .regelbog-ikon {
            width: 33px;
            height: 33px;
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
