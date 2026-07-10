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
        if (e.key === 'Escape') {
            lukRegler();
            e.preventDefault();
            e.stopImmediatePropagation();
        }
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
                    <p class="regelbog-kicker">{tekst('Tågeøerne', 'Fog Island')}</p>
                    <h2 id="regelbog-titel">{tekst('Regelbog', 'Rulebook')}</h2>
                </div>
                <button type="button" class="regelbog-luk" onclick={lukRegler} aria-label={tekst('Luk regelbog', 'Close rulebook')}>×</button>
            </header>

            <div class="regelbog-indhold">
                {#if sprogState.sprog === 'en'}
                <section>
                    <h3>Goal</h3>
                    <p>You have washed ashore on an island with the fog closing in behind you. Find an escape boat to the east and board it before your route is cut off.</p>
                    <p class="eksempel">Example: If you spot a boat far to the east, you do not need to explore the entire island. Reaching the boat before fog or sea blocks the way is what matters.</p>
                </section>

                <section>
                    <h3>Start and Island Name</h3>
                    <p>Players who enter the same island name share the same island. New players may join until the active players have moved beyond day 5. Games played offline are stored only in the browser and device used to start them.</p>
                    <p class="eksempel">Example: If you both enter "Sortoe", you land on the same island. Once the active players reach day 6, no new player can join that game.</p>
                </section>

                <section>
                    <h3>Turns, Energy and Movement</h3>
                    <ul>
                        <li>Every move costs energy. The cost depends on your character, equipment, terrain and any terrain bonuses.</li>
                        <li>You may spend more energy than you have left. The action still happens; then the day advances and your energy is restored.</li>
                        <li>Moving in fog costs 2 extra energy.</li>
                        <li>Food can make your next move free. Berserk can make your next energy-costing action free.</li>
                        <li>If you move at least 5 days ahead of the slowest active multiplayer character, the waiting minigame opens. The table closes when that character reaches your day, when fog nears your field, or after at most 60 seconds. After it closes, you can play for at least 5 days before another waiting game. You get one free round on your current field; each additional round there costs 5 gold.</li>
                    </ul>
                    <p class="eksempel">Example: If you have 3 energy left and entering a mountain costs 6, you may still move there. You resolve the field while your energy is negative, and then the next day begins.</p>
                </section>

                <section>
                    <h3>Sight and Fog</h3>
                    <ul>
                        <li>Moving reveals fields around you. Your character and equipment such as torches determine your sight radius.</li>
                        <li>Mountains block sight unless you are standing on one. Climbing onto a mountain gives you a sight radius of at least 2.</li>
                        <li>The fog begins moving after day 6. You take damage if time passes while you are standing in fog, and you cannot camp there.</li>
                        <li>When the fog returns from the east, it deals double damage. If it crosses the island and comes again from the west, it deals triple damage. Fog blockers reduce this to normal fog damage on protected fields.</li>
                        <li>When fog reaches a field, hidden roots wither, campfires go out, and shops, markets and workshops close for the rest of that game. Starting a new game on the island restores them.</li>
                        <li>Some rare events can push the fog back, hold it behind a field or reveal a boat to everyone.</li>
                    </ul>
                    <p class="eksempel">Example: Hunters, archers, explorers and adventurers see farther than most. A mountain between you and the coast can still hide unexplored dangers until you improve your view.</p>
                </section>

                <section>
                    <h3>HP, Damage and Rest</h3>
                    <ul>
                        <li>HP represents your health. If it reaches 0 outside fog or water, you normally collapse instead of dying.</li>
                        <li>When you collapse, you lose half your gold. Time passes, and you wake shortly afterwards with 10 HP.</li>
                        <li>If your HP reaches 0 in fog or water, you die unless a life elixir saves you.</li>
                        <li>A life elixir is used automatically when damage would kill you or make you collapse. It restores up to 90 HP, even if your maximum is higher.</li>
                        <li>Armor reduces damage. Royal armor reduces damage by 70%. Armor and royal armor are normally heavy, but Knight and Shieldmaiden ignore the weight and take no damage from buried traps. Elven armor protects like normal armor, but is not heavy.</li>
                        <li>Food gives +20 HP and makes your next move free. A sleeping bag can be used in the wild for +20 HP, but resting takes the remainder of the day. A silk sleeping bag gives +40 HP and is downgraded only by cave damp.</li>
                        <li>A torch gives +1 sight, and a sun torch gives +2. Both can light campfires; a sunfire reveals a larger area and gives 100 gold instead of 50.</li>
                        <li>Viking and Valkyrie automatically go berserk the first time each day they take at least 5 damage. The next energy-costing action costs 0 energy.</li>
                        <li>Water and floods extinguish torches. Normal and royal armor are lost in water; elven armor is not.</li>
                    </ul>
                </section>

                <section>
                    <h3>Digging</h3>
                    <ul>
                        <li>The dig icon in your inventory becomes active whenever your current field can be dug.</li>
                        <li>If you carry a shovel or master shovel, you use it automatically. Otherwise, you dig by hand and lose additional energy and HP.</li>
                        <li>A master shovel counts as a shovel, doubles gold found while digging and uncovers buried traps without triggering them.</li>
                        <li>The Golden Distiller is a rare relic that doubles dug-up gold. Combined with a master shovel, it triples digging gold rather than quadrupling it.</li>
                        <li>Hidden traps, gold, roots and other rewards are resolved only when you dig. The field is marked as dug immediately.</li>
                        <li>A detector and dowsing rod reveal signs of hidden gold or life on known tiles up to 3 tiles from you. The Ore Finder also adds 25% to hidden gold you dig up and reveals gold mines up to 2 tiles away, even through mountains.</li>
                        <li>The Rune Rod is an upgraded dowsing rod. If you are missing HP and enter an undug field with hidden life, it pulls up the roots automatically for 1 energy without marking the field as dug.</li>
                        <li>When the Rune Rod pulls up roots, it also clears the field's hidden gold, rewards and trap. Other players may still dig there, but they will find only stones and worms.</li>
                        <li>The Root Heart is a rare relic. It doubles HP gained from healing roots, whether you dig them up or use the Rune Rod.</li>
                    </ul>
                </section>

                <section>
                    <h3>Fields</h3>
                    <ul>
                        <li>Towns and markets may contain shops, while towns may also contain workshops. You can use a lockpick to burgle an empty town field.</li>
                        <li>Shops restock their fixed goods after a new day has passed. If you carry a club or wallbreaker, the merchant refuses to trade after your first purchase.</li>
                        <li>Fields ripen in ten-day blocks. Ripe crops restore a little HP and can be harvested once per block, unless locusts or disasters destroy them first.</li>
                        <li>Gold mines give gold and points. An unlocked mine can be taken over by other players.</li>
                        <li>You gain gold the first time you take over a mine. If you later reclaim a mine you have already visited, it becomes locked.</li>
                        <li>A locked mine cannot be taken over, but disasters can still destroy it.</li>
                        <li>Escape boats normally appear on the east coast from day 6. Their number follows the number of living players. Each boat can be used once; boarding one wins the game.</li>
                        <li>Portals send you 4, 5 or 6 fields east. The landing field then works like any other field.</li>
                    </ul>
                </section>

                <section>
                    <h3>Inventory and Equipment</h3>
                    <ul>
                        <li>Tap an active item at the bottom of the screen to use it.</li>
                        <li>The shovel, sleeping bag or silk sleeping bag, food, lockpick and club are active only when they can be used in your current situation.</li>
                        <li>Food, life elixirs, torches, treasure maps and diamonds can stack. Diamonds are worth 250-600 gold: below 375 is small, 375-499 is large, and 500+ is huge. You can carry only one of most other weapons, tools, clothes and special items.</li>
                        <li>You can keep only one version of each large tool, weapon or piece of clothing. Upgrade lines such as shovel/master shovel, staff/dragon staff, detector/ore finder and clothes/fine/royal clothes count as one type.</li>
                        <li>Torches and sun torches can light fires. Staffs and dragon staffs can teleport you. Treasure maps mark an old treasure cluster with a sepia trail. Some islands hide several treasures, and the map does not show whether a chest has already been claimed.</li>
                        <li>Treasure map trails do not count as normal exploration and give no exploration points until you personally get close enough to the field.</li>
                        <li>Some items can be bought; others appear only in events. Ordinary shops never sell elven armor, upgraded items or relics.</li>
                    </ul>
                </section>

                <section>
                    <h3>Workshops</h3>
                    <p>Workshops are found in larger towns. Instead of selling ordinary goods, they upgrade equipment you already own. The upgraded item replaces the old one.</p>
                    <p class="eksempel">Example: A workshop can turn a shovel and 150 gold into a master shovel, or a sleeping bag and 150 gold into a silk sleeping bag. Clothes can become fine clothes, which can later become royal clothes.</p>
                </section>

                <section>
                    <h3>Events</h3>
                    <p>Events are encounters that force you to make a choice. Some have local consequences; others can change large parts of the map. Your weapons, class and equipment may open safer, richer or more dangerous options.</p>
                    <ul>
                        <li>Natural disasters can change terrain around you and can remove mines, boats, crops, shops and events on affected fields.</li>
                        <li>Event damage normally makes you collapse at 0 HP. Sea, flood and fog can kill you outright.</li>
                        <li>Some events are rare or unique. They can give relics that cannot be bought in shops.</li>
                        <li>Follow-up scenes belong to the same encounter and cannot appear as separate events.</li>
                        <li>If an event requires or consumes an ordinary item, its upgraded version often counts as the same type. If the choice consumes the item, the upgraded version is lost as well.</li>
                        <li>Storm Axe improves axe choices in events with more gold and less damage. Falcon Bow improves bow choices, and when you move it reveals a small fan just beyond your sight in the direction you went.</li>
                        <li>You can open the meteor stone by hand or with a shovel, axe, club or sword. Using a tool destroys it but gives you gold and a diamond. A master shovel gives the best reward. The gold counts as an event reward and is affected by your gold bonus.</li>
                    </ul>
                </section>

                <section>
                    <h3>Theft</h3>
                    <p>You can use a lockpick to burgle empty town fields without shops. It costs half your base energy, rounded up. If you escape, you gain 35-50 gold. If you are caught, you take a beating and gain nothing. A Master Lockpick doubles the reward but does not reduce the risk.</p>
                </section>

                <section>
                    <h3>Smashing</h3>
                    <p>A club can smash markets and ordinary town fields into ruins. Markets cost 8 energy and deal 20 base damage. Town fields cost 16 energy and deal 30 base damage. Workshops cost 24 energy, deal 50 base damage and require Wallbreaker. The base reward is 45-75, 90-150 or 225 gold plus two thirds of the cash box, adjusted by your gold bonus. Afterwards, nearby merchants refuse to trade with you.</p>
                </section>

                <section>
                    <h3>Multiplayer</h3>
                    <ul>
                        <li>All players see the same island and change the same world.</li>
                        <li>You do not see each other's final routes before you finish.</li>
                        <li>One account cannot play multiple characters on the same island at the same time.</li>
                        <li>Only active players affect the pace. Dead, escaped or inactive players no longer hold anyone back.</li>
                        <li>Hunters can place a tracker when standing on the same field as another active player. For 20 days they see the fields that player knows.</li>
                        <li>Royals collect 10% tax when they enter the same field as another player. They cannot tax pirates; when a royal meets a pirate, the pirate robs the royal instead. A player cannot be taxed again for 20 days.</li>
                        <li>Pirates with a sabre steal 10% of the gold carried by royals, magicians, hunters, jokers and explorers on the same field. A player cannot be robbed again for 20 days.</li>
                        <li>Gold mines award more points in multiplayer because they are harder to hold. Their value rises with the number of players, up to a limit.</li>
                        <li>Your total score also receives a multiplier for the number of players: 1 player x1.0, 2 players x1.1, 3 players x1.2, 4 players x1.3, 5 players x1.4 and 6+ players x1.5.</li>
                    </ul>
                </section>

                <section>
                    <h3>Score</h3>
                    <ul>
                        <li>Your score combines gold, exploration, mines, equipment and either progress or the escape bonus, followed by HP and multiplayer multipliers.</li>
                        <li>Exploration gives 2 points per known field.</li>
                        <li>Sepia fields shown by treasure maps are only map trails. They do not count as known fields when score is calculated.</li>
                        <li>Progress gives 2 points per column east. If you escape, you get 1000 points instead.</li>
                        <li>Mines give 100 points each, multiplied by the mine multiplier for the number of players.</li>
                        <li>Equipment gives points equal to 2/3 of the sale price.</li>
                        <li>Finally, the total is multiplied by 1 + HP/1000. With 100 HP, the multiplier is 1.100.</li>
                        <li>Global leaderboards require login. The end screen shows your local island score, global character-class score and global overall score. Offline scores are stored only locally.</li>
                        <li>If the connection fails, the game tries to save pending scores again later.</li>
                        <li>Medal 11 is awarded only if you score at least 12500 and finish in the weekly top ten.</li>
                    </ul>
                </section>

                <section>
                    <h3>Playing Offline</h3>
                    <p>To play on a plane, prepare the game on the same device and in the same browser first. While online, open the game, tap Offline / Flight mode, start or continue an offline game, and then test the map in flight mode.</p>
                    <p class="eksempel">Example: Downloading the game in Chrome does not prepare Safari on the same phone. Offline saves and scores remain in the browser where you created them.</p>
                </section>
                {:else}
                <section>
                    <h3>Målet</h3>
                    <p>Du er skyllet i land på en ø, og tågen nærmer sig bagfra. Find en flugtbåd mod øst, og gå ombord, før vejen bliver lukket.</p>
                    <p class="eksempel">Eksempel: Får du øje på en båd langt mod øst, behøver du ikke udforske hele øen. Det afgørende er at nå båden, før tågen eller havet spærrer vejen.</p>
                </section>

                <section>
                    <h3>Start og ønavn</h3>
                    <p>Spillere, der skriver samme ønavn, deler den samme ø. Nye spillere kan slutte sig til, indtil de aktive spillere er kommet forbi dag 5. Spil uden net gemmes kun i den browser og på den enhed, hvor de blev startet.</p>
                    <p class="eksempel">Eksempel: Skriver I begge "Sortoe", lander I på samme ø. Når de aktive spillere er nået til dag 6, kan nye spillere ikke længere slutte sig til det spil.</p>
                </section>

                <section>
                    <h3>Tur, energi og bevægelse</h3>
                    <ul>
                        <li>Hver bevægelse koster energi. Prisen afhænger af din karakter, dit udstyr, terrænet og eventuelle terrænfordele.</li>
                        <li>Du må gerne bruge mere energi, end du har tilbage. Handlingen gennemføres først; derefter går dagen videre, og din energi bliver fyldt op.</li>
                        <li>Bevægelse i tågen koster 2 ekstra energi.</li>
                        <li>Mad kan gøre din næste bevægelse gratis. Bersærkergang kan gøre din næste energikrævende handling gratis.</li>
                        <li>Kommer du mindst 5 dage foran den langsomste aktive spiller, åbner ventespillet. Bordet lukker, når spilleren når din dag, når tågen nærmer sig dit felt, eller efter højst 60 sekunder. Derefter kan du spille i mindst 5 dage, før et nyt ventespil åbner. Du får én gratis runde på dit nuværende felt; hver ekstra runde dér koster 5 guld.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Har du 3 energi tilbage, og det koster 6 at gå ind på et bjerg, må du stadig flytte dertil. Du håndterer feltet, mens din energi er negativ, og derefter begynder næste dag.</p>
                </section>

                <section>
                    <h3>Syn og tåge</h3>
                    <ul>
                        <li>Når du bevæger dig, afslører du felterne omkring dig. Din karakter og udstyr som fakler bestemmer din synsradius.</li>
                        <li>Bjerge blokerer udsynet, medmindre du selv står på et bjerg. Når du går op på et bjergfelt, får du en synsradius på mindst 2.</li>
                        <li>Tågen begynder at rykke efter dag 6. Du tager skade, hvis tiden går, mens du står i tågen, og du kan ikke slå lejr dér.</li>
                        <li>Når tågen vender fra øst, giver den dobbelt skade. Hvis den krydser øen og kommer igen fra vest, giver den tredobbelt skade. Tågeblokkere sænker det til normal tågeskade på beskyttede felter.</li>
                        <li>Når tågen rammer et felt, visner skjulte rødder, lejrbål går ud, og butikker, markeder og værksteder lukker resten af spillet. Starter du et nyt spil på øen, er de tilbage.</li>
                        <li>Nogle sjældne hændelser kan skubbe tågen tilbage, holde den bag et felt eller afsløre en båd for alle.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Jægere, skytter, opdagere og eventyrere ser længere end de fleste. Et bjerg mellem dig og kysten kan stadig skjule ukendte farer, indtil du forbedrer dit udsyn.</p>
                </section>

                <section>
                    <h3>HP, skade og hvile</h3>
                    <ul>
                        <li>HP er dit helbred. Rammer det 0 uden for tåge og vand, kollapser du normalt i stedet for at dø.</li>
                        <li>Når du kollapser, mister du halvdelen af dit guld. Tiden går, og du vågner kort efter med 10 HP.</li>
                        <li>Rammer din HP 0 i tåge eller vand, dør du, medmindre en livseliksir redder dig.</li>
                        <li>En livseliksir bruges automatisk, når skade ellers ville dræbe dig eller få dig til at kollapse. Den giver op til 90 HP tilbage, selv om dit maksimum er højere.</li>
                        <li>Rustning mindsker skade. Kongepanser mindsker skade med 70%. Rustning og kongepanser er normalt tunge, men Ridder og Skjoldmø ignorerer vægten og tager ingen skade fra nedgravede fælder. Elverrustning beskytter som almindelig rustning, men er ikke tung.</li>
                        <li>Mad giver +20 HP og gør din næste bevægelse gratis. En sovepose kan bruges i vildmarken og giver +20 HP, men hvilen tager resten af dagen. En silkesovepose giver +40 HP og bliver kun nedgraderet af fugten i en hule.</li>
                        <li>En fakkel giver +1 syn, og en solfakkel giver +2. Begge kan tænde lejrbål; et solbål afslører et større område og giver 100 guld i stedet for 50.</li>
                        <li>Viking og valkyrie går automatisk bersærk første gang pr. dag, de tager mindst 5 skade. Næste energikrævende handling koster 0 energi.</li>
                        <li>Vand og oversvømmelser slukker fakler. Almindelig rustning og kongepanser går tabt i vand; det gør elverrustning ikke.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Har du 12 HP foran et farligt felt, kan det være bedre at spise maden end at gemme den. Rammer du alligevel 0 HP på land, kollapser du. I tåge eller vand er følgerne langt værre.</p>
                </section>

                <section>
                    <h3>Gravning</h3>
                    <ul>
                        <li>Graveikonet i udstyrsrækken bliver aktivt, når du står på et felt, der kan graves.</li>
                        <li>Har du en skovl eller mesterskovl, bruger du den automatisk. Ellers graver du med hænderne og mister ekstra energi og HP.</li>
                        <li>En mesterskovl tæller som en skovl, fordobler guld fra gravning og finder nedgravede fælder uden at udløse dem.</li>
                        <li>Gylden Destillator er et sjældent relikvie, der fordobler opgravet guld. Sammen med en mesterskovl bliver graveguldet tredoblet, ikke firedoblet.</li>
                        <li>Skjulte fælder, guld, rødder og bytte bliver først afgjort, når du graver. Feltet markeres straks som gravet.</li>
                        <li>En metaldetektor og en søgekvist kan afsløre tegn på skjult guld eller liv på kendte felter op til 3 felter fra dig. Malmviseren lægger desuden 25% til skjult guld, du graver frem, og afslører guldminer op til 2 felter væk, selv gennem bjerge.</li>
                        <li>Runekvisten er en opgraderet søgekvist. Når du mangler HP og går ind på et ugravet felt med skjult liv, trækker den rødderne op automatisk for 1 energi uden at markere feltet som gravet.</li>
                        <li>Når runekvisten trækker rødderne op, fjerner den samtidig feltets skjulte guld, bytte og fælde. Andre kan stadig grave dér, men finder kun sten og orme.</li>
                        <li>Rodhjertet er et sjældent relikvie. Det fordobler HP fra helende rødder, både når du graver, og når runekvisten bruges.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Viser metaldetektoren metal i en ruin, kan der ligge guld. En almindelig skovl kan stadig udløse feltets fælde. Med en mesterskovl får du mere guld og finder fælden uden skade. Runekvisten kan hente skjult liv, men fjerner samtidig feltets øvrige skjulte indhold.</p>
                </section>

                <section>
                    <h3>Felter</h3>
                    <ul>
                        <li>Byer og markeder kan have butikker, og byer kan også have værksteder. På tomme byfelter kan du begå indbrud med en dirk.</li>
                        <li>Butikker fylder deres faste varer op, når en ny dag er gået. Har du en kølle eller murknuser, nægter den handlende at sælge mere efter dit første køb.</li>
                        <li>Marker modner i blokke på ti dage. Modne afgrøder giver lidt HP og kan høstes én gang pr. blok, medmindre græshopper eller katastrofer ødelægger dem først.</li>
                        <li>Guldminer giver guld og point. En ulåst mine kan overtages af andre spillere.</li>
                        <li>Første gang du overtager en mine, får du guld. Tager du senere en mine tilbage, som du allerede har besøgt, bliver den låst.</li>
                        <li>En låst mine kan ikke overtages, men den kan stadig blive ødelagt af katastrofer.</li>
                        <li>Flugtbåde dukker normalt op på østkysten fra dag 6. Antallet følger antallet af levende spillere. Hver båd kan bruges én gang; går du ombord, vinder du spillet.</li>
                        <li>Portaler sender dig 4, 5 eller 6 felter mod øst. Landingsfeltet fungerer derefter som ethvert andet felt.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Du overtager en neutral mine og får guld. Kommer en anden spiller senere forbi, kan de tage den, hvis den ikke er låst. Hvis du tager den tilbage efter at have besøgt den før, låses den. Rammer en meteor feltet, forsvinder minen uanset ejer.</p>
                </section>

                <section>
                    <h3>Udstyr og oppakning</h3>
                    <ul>
                        <li>Tryk på en aktiv genstand nederst på skærmen for at bruge den.</li>
                        <li>Skovl, sovepose eller silkesovepose, mad, dirk og kølle er kun aktive, når de kan bruges i din aktuelle situation.</li>
                        <li>Mad, livseliksirer, fakler, skattekort og diamanter kan ligge i stakke. Diamanter er 250-600 guld værd: under 375 er lille, 375-499 er stor, og 500+ er enorm. Af de fleste andre våben, værktøjer, beklædningsdele og specialgenstande kan du kun bære én.</li>
                        <li>Store værktøjer, våben og tøj findes kun i én version ad gangen. Skovl/mesterskovl, stav/dragestav, søgekvist/runekvist, detektor/malmviser, dirk/mesterdirk, kniv/mesterkniv, rustning/kongepanser, økse/stormøkse, kølle/murknuser, bue/falkebue, fakkel/solfakkel, sovepose/silkesovepose og tøj/fint tøj/royalt tøj tæller som samme type.</li>
                        <li>Fakler og solfakler kan tænde bål. Stave og dragestave kan teleportere dig. Skattekort markerer en gammel skatteklynge med et sepiafarvet spor. Nogle øer gemmer flere skatte, og kortet viser ikke, om kisten allerede er taget. Butikker sælger ikke flere skattekort, når du har tydet alle øens spor.</li>
                        <li>Skattekortspor tæller ikke som almindelig udforskning og giver ikke udforskningspoint, før du selv kommer tæt nok på feltet.</li>
                        <li>Nogle genstande kan købes; andre findes kun i hændelser. Almindelige butikker sælger aldrig elverrustning, opgraderede genstande eller relikvier.</li>
                    </ul>
                    <p class="eksempel">Eksempel: En sovepose kan ikke bruges midt i en by, men er nyttig på rolige naturfelter. Et skattekort kan tegne et sepiafarvet spor mod en gammel skatteklynge, men først når du graver, ved du, om kisten stadig er der.</p>
                </section>

                <section>
                    <h3>Værksteder</h3>
                    <p>Værksteder findes i større byer. De sælger ikke almindelige varer, men opgraderer udstyr, du allerede ejer. Den nye version erstatter den gamle.</p>
                    <p class="eksempel">Eksempel: Har du en skovl og 150 guld, kan værkstedet gøre den til en mesterskovl. Har du en sovepose og 150 guld, kan den blive til en silkesovepose. Har du tøj og 100 guld, kan det blive til fint tøj. Fint tøj kan for 500 guld blive til royalt tøj, som giver stor guldbonus, men bliver nedgraderet til fint tøj, hvis det flænses.</p>
                </section>

                <section>
                    <h3>Hændelser</h3>
                    <p>Hændelser er møder, hvor du skal træffe et valg. Nogle har lokale følger; andre kan ændre store dele af kortet. Din klasse, dine våben og dit udstyr kan åbne sikrere, rigere eller farligere muligheder.</p>
                    <ul>
                        <li>Naturkatastrofer kan ændre terrænet omkring dig og fjerne miner, både, afgrøder, butikker og hændelser fra de ramte felter.</li>
                        <li>Skade fra hændelser får dig normalt til at kollapse ved 0 HP. Hav, oversvømmelse og tåge kan dræbe dig med det samme.</li>
                        <li>Nogle hændelser er sjældne eller unikke og kan give relikvier, som ikke sælges i butikker.</li>
                        <li>Fortsættelser hører til det samme møde og kan ikke dukke op som selvstændige hændelser.</li>
                        <li>Kræver eller forbruger et valg en almindelig genstand, tæller den opgraderede version ofte som samme type. Forbruges genstanden, mister du også den opgraderede version.</li>
                        <li>Stormøksen forbedrer valg med økser ved at give mere guld og mindre skade. Falkebuen forbedrer valg med buer og afslører under bevægelse en lille vifte lige uden for dit syn i den retning, du går.</li>
                        <li>Du kan åbne meteorstenen med hænderne eller med en skovl, økse, kølle eller et sværd. Bruger du et værktøj, går det tabt, men du får guld og en diamant. Mesterskovlen giver det største udbytte. Guldet tæller som guld fra en hændelse og påvirkes af din guldbonus.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Et jordskælv kan forvandle en eng til et bjerg eller en ruin. Lå der en guldmine, butik, båd eller et værksted på feltet, er det væk bagefter. Et valg kan derfor hjælpe dig nu, men skade resten af øen.</p>
                </section>

                <section>
                    <h3>Tyveri</h3>
                    <p>Du kan bruge en dirk til indbrud på tomme byfelter uden butik. Det koster halvdelen af din grundenergi, rundet op. Slipper du væk, får du 35-50 guld. Bliver du opdaget, får du tæv og intet guld. Mesterdirken fordobler udbyttet, men mindsker ikke risikoen.</p>
                    <p class="eksempel">Eksempel: Hvis du mangler lidt guld til en opgradering, kan indbrud være fristende. Tyve bliver sjældnere opdaget end andre, mens tunge krigere larmer mere.</p>
                </section>

                <section>
                    <h3>Smadring</h3>
                    <p>En kølle kan smadre markeder og almindelige byfelter til ruiner. Markeder koster 8 energi og giver 20 grundskade. Byfelter koster 16 energi og giver 30 grundskade. Værksteder koster 24 energi, giver 50 grundskade og kræver Murknuser. Grundbyttet er 45-75, 90-150 eller 225 guld plus to tredjedele af kassen, justeret af din guldbonus. Bagefter nægter handlende på nabofelterne at handle med dig.</p>
                    <p class="eksempel">Eksempel: En ork kan købe en vare på et marked og derefter smadre markedet for at hente noget af værdien fra kassen. Det koster tid og HP: Energien kan falde langt under nul, og en svag karakter kan kollapse under selve smadringen.</p>
                </section>

                <section>
                    <h3>Flere spillere</h3>
                    <ul>
                        <li>Alle spillere ser den samme ø og ændrer den samme verden.</li>
                        <li>I ser ikke hinandens slutruter, før I selv er færdige.</li>
                        <li>Den samme bruger må ikke spille flere karakterer på den samme ø samtidig.</li>
                        <li>Kun aktive spillere påvirker tempoet. Spillere, der er døde, sluppet væk eller har været inaktive i flere minutter, holder ikke længere andre tilbage.</li>
                        <li>Jægere kan sætte et sporingsmærke, når de står på samme felt som en anden aktiv spiller. I 20 dage kan de se alle felter, den spiller kender.</li>
                        <li>Royale opkræver 10% skat, når de står på samme felt som en anden spiller. De kan ikke beskatte pirater; møder en royal en pirat, røver piraten den royale i stedet. En spiller kan først beskattes igen efter 20 dage.</li>
                        <li>Pirater med sabel stjæler 10% af guldet fra royale, troldfolk, jægere, skytter, jokere og opdagere på samme felt. En spiller kan først røves igen efter 20 dage.</li>
                        <li>Guldminer giver flere point i spil med flere spillere, fordi de er sværere at holde. Værdien stiger med antallet af spillere, op til en grænse.</li>
                        <li>Dine samlede point får også en multiplikator for antal spillere: 1 spiller x1.0, 2 spillere x1.1, 3 spillere x1.2, 4 spillere x1.3, 5 spillere x1.4 og 6+ spillere x1.5.</li>
                    </ul>
                    <p class="eksempel">Eksempel: Hvis en medspiller tager en mine, kan du se den skifte ejer på kortet. Hvis du senere går ind på den ulåste mine, overtager du den fra medspilleren. Hvis minen er låst, må du finde point et andet sted.</p>
                </section>

                <section>
                    <h3>Point</h3>
                    <ul>
                        <li>Dine point består af guld, udforskning, miner, udstyr og enten fremdrift eller flugtbonus. Derefter ganges summen med multiplikatorerne for HP og antal spillere.</li>
                        <li>Udforskning giver 2 point pr. kendt felt.</li>
                        <li>Sepiafelter fra skattekort er kun kortspor. De tæller ikke som kendte felter, når dine point beregnes.</li>
                        <li>Fremdrift giver 2 point pr. kolonne mod øst. Hvis du slipper væk, får du 1000 point i stedet.</li>
                        <li>Miner giver 100 point pr. mine ganget med multiplikatoren for antal spillere.</li>
                        <li>Udstyr giver point svarende til 2/3 af salgsprisen.</li>
                        <li>Til sidst ganges summen med 1 + HP/1000. Har du 100 HP, er multiplikatoren 1,100.</li>
                        <li>Globale toplister kræver login. Slutskærmen viser dine lokale øpoint, globale klassepoint og dine samlede globale point. Point fra spil uden net gemmes kun lokalt.</li>
                        <li>Hvis forbindelsen svigter, forsøger spillet at gemme ventende point igen senere.</li>
                        <li>Medalje 11 gives kun, hvis du får mindst 12500 point og ender i ugens top ti.</li>
                    </ul>
                    <p class="eksempel">Eksempel: 1000 guld, 200 udforskningspoint, 300 minepoint og 1000 flugtpoint bliver 2500 før HP. Med 80 HP ender det på 2700 point.</p>
                </section>

                <section>
                    <h3>Spil uden net</h3>
                    <p>Vil du spille i et fly, skal spillet først gøres klar på den samme enhed og i den samme browser. Åbn spillet, mens du er online, tryk på Offline / Flytilstand, start eller fortsæt et spil uden net, og test derefter kortet i flytilstand.</p>
                    <p class="eksempel">Eksempel: Downloader du spillet i Chrome, bliver det ikke også klar i Safari på den samme telefon. Spil og point uden net bliver i den browser, hvor de blev oprettet.</p>
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
