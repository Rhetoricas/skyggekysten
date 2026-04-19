export interface Udfald {
	log: string; 
	aktionType: 'guld' | 'hp' | 'upgrade' | 'fortsaet';
	vaerdi: number;
	itemType?: string;
	naesteTrin?: string;
}

export interface Valg {
	tekst: string;
	aktionType?: 'guld' | 'hp' | 'luk' | 'upgrade' | 'fortsaet';
	vaerdi?: number;
	itemType?: string;
	chance?: number;
	failVaerdi?: number;
	naesteTrin?: string;
	udfald?: {
		katastrofe: Udfald;
		fiasko: Udfald;
		neutral: Udfald;
		succes: Udfald;
		mirakel: Udfald;
	};
}

export interface SpilEvent {
	titel: string;
	tekst: string;
	type: 'historie' | 'butik' | 'kamp';
	billedeUrl?: string;
	biome: string;
	erSubTrin?: boolean;
	valg: Valg[];
}

export const eventBibliotek: Record<string, SpilEvent> = {
	// --- BY & MARKED (Sikkerhed og Handel) ---
	'by_smeden': {
		titel: "Den Rustne Ambolt",
		tekst: "Smeden banker rytmisk på et stykke glødende jern. 'Udstyr redder liv. Har du mønt?'",
		type: 'butik',
		biome: 'by',
		valg: [
			{ tekst: "Slib Sabel (40G)", aktionType: 'upgrade', vaerdi: -40, itemType: 'sabel' },
			{ tekst: "Hærd Skovl (60G)", aktionType: 'upgrade', vaerdi: -60, itemType: 'skovl' },
			{ tekst: "Forlad smedjen", aktionType: 'luk' }
		]
	},
	'marked_tasketyv': {
		titel: "Trængsel på Markedet",
		tekst: "Du maser dig gennem mængden. Pludselig mærker du et ryk i din pengepung. En lille dreng sprinter væk.",
		type: 'historie',
		biome: 'marked',
		valg: [
			{ 
				tekst: "Sæt efter ham!", 
				udfald: {
					katastrofe: { log: "Du snubler ind i en vagt og får en bøde.", aktionType: 'guld', vaerdi: -50 },
					fiasko: { log: "Drengen forsvinder i mængden med dine mønter.", aktionType: 'guld', vaerdi: -20 },
					neutral: { log: "Du fanger ham ikke, men beholder din pung.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Du fanger ham og tager din pung tilbage plus hans tyvekoster.", aktionType: 'guld', vaerdi: 40 },
					mirakel: { log: "Du tackler ham ned i en forladt skattekiste.", aktionType: 'guld', vaerdi: 150 }
				}
			},
			{ tekst: "Lad ham løbe (-10G)", aktionType: 'guld', vaerdi: -10, naesteTrin: undefined } // Særlig flugt med straf
		]
	},
	'marked_spaadom': {
		titel: "Spåkonens Telt",
		tekst: "Et røgfyldt telt lugter af røgelse. En gammel kvinde stirrer ind i en krystalkugle. 'Fremtiden koster blod eller guld.'",
		type: 'historie',
		biome: 'marked',
		valg: [
			{ tekst: "Betal 50 Guld", aktionType: 'fortsaet', vaerdi: -50, naesteTrin: 'marked_spaadom_guld' },
			{ tekst: "Giv dit blod (-20 HP)", aktionType: 'fortsaet', vaerdi: -20, naesteTrin: 'marked_spaadom_blod' },
			{ tekst: "Gå igen", aktionType: 'luk' }
		]
	},
	'marked_spaadom_guld': {
		titel: "Købt Viden",
		tekst: "Hun nikker grådigt. 'Guld tiltrækker guld. Kig under den gamle bro ved byporten.'",
		type: 'historie',
		biome: 'marked',
		erSubTrin: true,
		valg: [
			{ tekst: "Gå til broen (+80G)", aktionType: 'guld', vaerdi: 80, naesteTrin: undefined },
		]
	},
	'marked_spaadom_blod': {
		titel: "Blodets Bånd",
		tekst: "Hun slikker blodet af dolken. 'Smerten heler sjælen. Et vildt mørke vil styrke dig.'",
		type: 'historie',
		biome: 'marked',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Modtag velsignelsen", 
				udfald: {
					katastrofe: { log: "Spådommen var en forbandelse!", aktionType: 'hp', vaerdi: -40 },
					fiasko: { log: "Røgelsen gør dig svimmel og syg.", aktionType: 'hp', vaerdi: -10 },
					neutral: { log: "Du føler intet udover dit åbne sår.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "En varm kraft skyller gennem dig.", aktionType: 'hp', vaerdi: 40 },
					mirakel: { log: "Dit blod muterer og heler dig maksimalt.", aktionType: 'hp', vaerdi: 100 }
				}
			}
		]
	},

	// --- SKOV, ENG & MARK (Naturens luner) ---
	'skov_baer_2d6': {
		titel: "Fristende Frugt",
		tekst: "En busk er dækket af pulserende bær. De drypper med en tyk, rød saft og dufter af råt jern.",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ 
				tekst: "Spis en håndfuld", 
				udfald: {
					katastrofe: { log: "Gift! Dine lunger brænder op indefra.", aktionType: 'hp', vaerdi: -40 },
					fiasko: { log: "Mavekramperne rammer dig hårdt.", aktionType: 'hp', vaerdi: -15 },
					neutral: { log: "Smager af aske, men de mætter lidt.", aktionType: 'hp', vaerdi: 5 },
					succes: { log: "Sød saft. Sårene heler hurtigt.", aktionType: 'hp', vaerdi: 20 },
					mirakel: { log: "Guddommelig nektar! Blodet koger af kraft.", aktionType: 'hp', vaerdi: 80 }
				}
			},
			{ tekst: "Ignorer dem", aktionType: 'luk' }
		]
	},
	'skov_jæger': {
		titel: "Dyrefælden",
		tekst: "En gigantisk bjørnefælde er smækket i over et skelet. Knoglerne klemmer fast om en læderpose.",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ 
				tekst: "Lirk posen fri", 
				udfald: {
					katastrofe: { log: "Fælden smækker om din arm og knuser knogler!", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Du river posen i stykker, og mønterne forsvinder i mudderet.", aktionType: 'hp', vaerdi: -10 },
					neutral: { log: "Du får posen fri. Den er næsten tom.", aktionType: 'guld', vaerdi: 15 },
					succes: { log: "Du tømmer posen sikkert.", aktionType: 'guld', vaerdi: 70 },
					mirakel: { log: "I posen ligger en massiv guldbarre.", aktionType: 'guld', vaerdi: 200 }
				}
			},
			{ tekst: "Lad de døde hvile", aktionType: 'luk' }
		]
	},
	'eng_sovende_kaempe': {
		titel: "Bjerget der ånder",
		tekst: "Midt på engen sover en trold så stor som et hus. Dens snorken ryster jorden. Om dens hals hænger en nøgle af massivt guld.",
		type: 'historie',
		biome: 'eng',
		valg: [
			{ tekst: "Snig dig frem og stjæl nøglen", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'eng_kaempe_tyveri' },
			{ tekst: "Bak langsomt væk", aktionType: 'luk' }
		]
	},
	'eng_kaempe_tyveri': {
		titel: "På listefødder",
		tekst: "Du står ved kæmpens bryst. Lugten er ubeskrivelig. Nøglen vejer mindst ti kilo.",
		type: 'kamp',
		biome: 'eng',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Løft guldet af dens hals", 
				udfald: {
					katastrofe: { log: "Den vågner og klemmer dig bevidstløs.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "Kæden rasler! Du flygter i panik gennem en torvebusk.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Du får nøglen, men taber noget af dit eget guld under flugten.", aktionType: 'guld', vaerdi: 50 },
					succes: { log: "En perfekt manøvre. Massivt guld sikret.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Den vågner ikke engang da du tager dens skjulte skattekiste.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},
	'mark_synkehul': {
		titel: "Jorden forsvinder",
		tekst: "Med et tørt knæk giver marken efter under dig. Du skrider ned mod et bundløst sort hul.",
		type: 'kamp',
		biome: 'mark',
		valg: [
			{ 
				tekst: "Spring mod kanten", 
				udfald: {
					katastrofe: { log: "Du falder dybt og slår dig halvt ihjel på vej op.", aktionType: 'hp', vaerdi: -60 },
					fiasko: { log: "Du vrider ankelen stygt, før du får fat i kanten.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Du trækker dig op, dækket af mudder og blå mærker.", aktionType: 'hp', vaerdi: -5 },
					succes: { log: "Du lander elegant på sikker grund.", aktionType: 'hp', vaerdi: 0 },
					mirakel: { log: "I springet griber du en gammel relikvie i jorden.", aktionType: 'guld', vaerdi: 100 }
				}
			}
		]
	},

	// --- BJERG, HULE & KRYSTAL (Underjordisk og hårdt terræn) ---
	'bjerg_alter': {
		titel: "Glemt Alter",
		tekst: "Et forvitret stenalter står på kanten af afgrunden. Der er indhugget en skål til ofringer.",
		type: 'historie',
		biome: 'bjerg',
		valg: [
			{
				tekst: "Læg hænderne på stenen",
				udfald: {
					katastrofe: { log: "Stenen suger livskraften ud af marven på dig!", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Et usynligt slag rammer dit bryst.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Ingenting sker. Vinden hyler bare.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Stenen varmer. Et skjult rum åbner sig.", aktionType: 'guld', vaerdi: 100 },
					mirakel: { log: "Bjergets ånd velsigner dig med glemt rigdom.", aktionType: 'guld', vaerdi: 300 }
				}
			},
			{ tekst: "Hold dig væk", aktionType: 'luk' }
		]
	},
	'hule_ekko': {
		titel: "Stemmer i mørket",
		tekst: "Grotten er kulsort. Fra dybet hører du nogen græde. Det lyder som et barn, der beder om hjælp.",
		type: 'historie',
		biome: 'hule',
		valg: [
			{ tekst: "Gå mod lyden", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'hule_ekko_sandhed' },
			{ tekst: "Mørket lyver. Gå tilbage.", aktionType: 'luk' }
		]
	},
	'hule_ekko_sandhed': {
		titel: "Fælden klapper",
		tekst: "Gråden stopper brat. En gigantisk edderkop falder ned fra loftet lige foran dig. Den var lokkemaden.",
		type: 'kamp',
		biome: 'hule',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Træk dit våben og kæmp!", 
				udfald: {
					katastrofe: { log: "Giftige tænder borer sig ind i din nakke.", aktionType: 'hp', vaerdi: -65 },
					fiasko: { log: "Du dræber den, men syren brænder din hud.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Du hugger dens ben af og overlever med skrammer.", aktionType: 'hp', vaerdi: -10 },
					succes: { log: "Et rent hug kløver den. Du finder mønter i dens spind.", aktionType: 'guld', vaerdi: 60 },
					mirakel: { log: "I dens mave finder du dens tidligere offer. En rig adelsmand.", aktionType: 'guld', vaerdi: 250 }
				}
			}
		]
	},
	'krystal_spejl': {
		titel: "Det Knuste Spejl",
		tekst: "Du står i en grotte af gigantiske lilla krystaller. I den største kan du se din egen spejling. Men spejlbilledet smiler, selvom du ikke gør.",
		type: 'historie',
		biome: 'krystal',
		valg: [
			{ tekst: "Slå krystallen i stykker", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'krystal_spejl_kamp' },
			{ tekst: "Ræk hånden frem mod den", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'krystal_spejl_bytte' },
			{ tekst: "Vend ryggen til", aktionType: 'luk' }
		]
	},
	'krystal_spejl_kamp': {
		titel: "Skarpe Skår",
		tekst: "Krystallen eksploderer. Dit spejlbillede træder ud, bevæbnet med glasskår og et mord i øjnene.",
		type: 'kamp',
		biome: 'krystal',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Dræb dig selv (spejlbilledet)", 
				udfald: {
					katastrofe: { log: "Den skærer dig dybt i maven.", aktionType: 'hp', vaerdi: -60 },
					fiasko: { log: "I kæmper, og glasset flænser jer begge.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Den splintres til støv ved første slag.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Du smadrer den og samler dens magiske krystalstøv op.", aktionType: 'guld', vaerdi: 80 },
					mirakel: { log: "Den kaster et legendarisk krystalsværd da den dør.", aktionType: 'guld', vaerdi: 300 }
				}
			}
		]
	},
	'krystal_spejl_bytte': {
		titel: "Dæmonisk Pagt",
		tekst: "Spejlbilledet lægger sin hånd mod din gennem glasset. 'Jeg tager din smerte. Men det koster dit materielle værd.'",
		type: 'historie',
		biome: 'krystal',
		erSubTrin: true,
		valg: [
			{ tekst: "Accepter (Giver alt guld, heler alt HP)", aktionType: 'fortsaet', vaerdi: -9999, naesteTrin: 'krystal_spejl_heling' }
		]
	},
	'krystal_spejl_heling': {
		titel: "Tomme Lommer, Fuld Krop",
		tekst: "Glasset tømmes for farve. Dine sår lukker sig, men din pung føles uendeligt let. Alt dit guld er forsvundet ind i spejlet.",
		type: 'historie',
		biome: 'krystal',
		erSubTrin: true,
		valg: [
			{ tekst: "Mærk energien (+100 HP)", aktionType: 'hp', vaerdi: 100, naesteTrin: undefined }
		]
	},

	// --- RUIN, RITUAL & ALKYMI (Magi og gamle hemmeligheder) ---
	'ruin_dæmon_start': {
		titel: "Lænket Vrede",
		tekst: "Et enormt, hornbeklædt væsen sidder fast i magiske kæder. Det kigger på dig med brændende øjne. 'Bryd lænkerne, og jeg gør dig rig.'",
		type: 'historie',
		biome: 'ruin',
		valg: [
			{
				tekst: "Slå kæderne i stykker",
				udfald: {
					katastrofe: { log: "Væsenet slår dig halvt ihjel i ren frihedstrang.", aktionType: 'fortsaet', vaerdi: -60, naesteTrin: 'ruin_dæmon_fri' },
					fiasko: { log: "Kædernes magi brænder dine hænder mørke.", aktionType: 'fortsaet', vaerdi: -20, naesteTrin: 'ruin_dæmon_fri' },
					neutral: { log: "Du åbner dem med besvær og slid.", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ruin_dæmon_fri' },
					succes: { log: "Lænkerne splintres nemt. Dæmonen er fri.", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ruin_dæmon_fri' },
					mirakel: { log: "Den overskydende magi helbreder dine skader.", aktionType: 'fortsaet', vaerdi: 30, naesteTrin: 'ruin_dæmon_fri' }
				}
			},
			{ tekst: "Lad den rådne i mørket", aktionType: 'luk' }
		]
	},
	'ruin_dæmon_fri': {
		titel: "Dæmonens Tak",
		tekst: "Den rejser sig. To meter høj. Den rækker en massiv hånd frem. 'Jeg betaler altid min gæld. Slå terningerne.'",
		type: 'butik',
		biome: 'ruin',
		erSubTrin: true,
		valg: [
			{
				tekst: "Kræv din betaling",
				udfald: {
					katastrofe: { log: "Den griner, slår dig ned og tømmer dine lommer.", aktionType: 'guld', vaerdi: -150 },
					fiasko: { log: "Den kaster foragtende en håndfuld mønter ud.", aktionType: 'guld', vaerdi: 20 },
					neutral: { log: "Den kaster en tung pose før den forsvinder.", aktionType: 'guld', vaerdi: 100 },
					succes: { log: "Den overøser dig med ædelstene og takker dig.", aktionType: 'guld', vaerdi: 250 },
					mirakel: { log: "Den brækker sit eget gyldne horn af til dig.", aktionType: 'guld', vaerdi: 600 }
				}
			}
		]
	},
	'ritual_blodmaane': {
		titel: "Blodmåne Kulten",
		tekst: "Seks skikkelser messer omkring et alter af knogler. De skærer i deres egne håndled og lader blodet dryppe ned over mønter.",
		type: 'historie',
		biome: 'ritual',
		valg: [
			{ tekst: "Angrib kultisterne", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ritual_blod_kamp' },
			{ tekst: "Drik fra alteret", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ritual_blod_drik' },
			{ tekst: "Forsvind lydløst", aktionType: 'luk' }
		]
	},
	'ritual_blod_kamp': {
		titel: "Fanatisk Forsvar",
		tekst: "De afbryder ritualet og vender sig mod dig. Deres øjne er fuldstændig sorte, og de bærer forgiftede dolke.",
		type: 'kamp',
		biome: 'ritual',
		erSubTrin: true,
		valg: [
			{
				tekst: "Dræb dem alle",
				udfald: {
					katastrofe: { log: "Deres giftige knive flænser dit kød.", aktionType: 'hp', vaerdi: -65 },
					fiasko: { log: "Du vinder, men det koster dyrt i blod.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Du slagter dem effektivt, men får en skramme.", aktionType: 'hp', vaerdi: -10 },
					succes: { log: "En perfekt massakre. Du tager deres ofrede guld.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Du tømmer alteret fuldstændigt for kultens skatte.", aktionType: 'guld', vaerdi: 350 }
				}
			}
		]
	},
	'ritual_blod_drik': {
		titel: "Kosmisk Tjeneste",
		tekst: "Du skubber en kultist til side og drikker af alteret. De falder på knæ i ærefrygt, da magien rammer dit system.",
		type: 'historie',
		biome: 'ritual',
		erSubTrin: true,
		valg: [
			{
				tekst: "Kæmp mod mutationen",
				udfald: {
					katastrofe: { log: "Dit hjerte stopper næsten. En brutal forgiftning.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Blodet smager af råd. Du kaster voldsomt op.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Ingenting sker. Kultisterne ser forvirrede ud.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Magien lukker alle dine sår øjeblikkeligt.", aktionType: 'hp', vaerdi: 60 },
					mirakel: { log: "Guddommelig udødelighed pumper gennem dig.", aktionType: 'hp', vaerdi: 100 }
				}
			}
		]
	},
	'alkymi_pool': {
		titel: "Den Kogende Pøl",
		tekst: "Du finder et forladt laboratorium. Midt i rummet koger en kilde med tyk, neon-grøn syre. Der flyder mønter nede i den.",
		type: 'historie',
		biome: 'alkymi',
		valg: [
			{
				tekst: "Stik armen ned i syren",
				udfald: {
					katastrofe: { log: "Syren ætser huden af din arm. Det er knoglerne der trækkes op.", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Smerten er intens, du taber mønterne.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Du får en håndfuld mønter med 2. grads forbrændinger.", aktionType: 'guld', vaerdi: 30 },
					succes: { log: "Du er hurtig og tømmer bunden af pølen.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Du finder en ubeskadiget platin-barre i bunden.", aktionType: 'guld', vaerdi: 300 }
				}
			},
			{ tekst: "Lad det koge", aktionType: 'luk' }
		]
	},

	// --- BANDIT, SLAGMARK & BLODSKOV (Blodsudgydelser) ---
	'bandit_told': {
		titel: "Landevejsrøveri",
		tekst: "Tre mænd med armbrøster træder ud af buskene. 'Livet koster 50 guld i denne skov, ven.'",
		type: 'historie',
		biome: 'bandit',
		valg: [
			{ tekst: "Betal dem (50G)", aktionType: 'guld', vaerdi: -50 },
			{ 
				tekst: "Træk våben!", 
				udfald: {
					katastrofe: { log: "De skyder dig ned som en hund.", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Du overlever kun akkurat pileregnen.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Du skræmmer dem væk med et brøl.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Du dræber to, den tredje flygter og efterlader sit bytte.", aktionType: 'guld', vaerdi: 80 },
					mirakel: { log: "Du slagter hele lejren og tager deres samlede skat.", aktionType: 'guld', vaerdi: 200 }
				}
			}
		]
	},
	'slagmark_plyndring': {
		titel: "De Faldnes Seng",
		tekst: "Kråker kredser over et bjerg af lig. Fanerne fra to glemte hære vajer i vinden. Der ligger skatte her, men også sygdom.",
		type: 'historie',
		biome: 'slagmark',
		valg: [
			{ 
				tekst: "Begynd at plyndre", 
				udfald: {
					katastrofe: { log: "Et lig vågner og stikker dig med en rusten klinge.", aktionType: 'hp', vaerdi: -40 },
					fiasko: { log: "Ligene er syge. Du kaster op og mister energi.", aktionType: 'hp', vaerdi: -15 },
					neutral: { log: "De blev alle plyndret før dig. Ingenting.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Du finder en officers ubrudte pung.", aktionType: 'guld', vaerdi: 100 },
					mirakel: { log: "Kongens faldne vogn står uberørt midt i blodbadet.", aktionType: 'guld', vaerdi: 350 }
				}
			},
			{ tekst: "Vis respekt og gå", aktionType: 'luk' }
		]
	},
	'blodskov_roedder': {
		titel: "Levende Rødder",
		tekst: "Du træder på noget blødt. Inden du kan reagere, slynger tykke, kødfulde rødder sig om dine ben og trækker dig ned i mulden.",
		type: 'kamp',
		biome: 'blodskov',
		valg: [
			{ 
				tekst: "Hak dig fri!", 
				udfald: {
					katastrofe: { log: "Rødderne knuser dine ribben langsomt.", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Det koster hud og hår at vriste sig fri.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Du hakker dem over og kravler ud.", aktionType: 'hp', vaerdi: -5 },
					succes: { log: "Du dræber planten. Dens 'frugt' er lavet af guld.", aktionType: 'guld', vaerdi: 60 },
					mirakel: { log: "Planten bløder helende saft, da du dræber den.", aktionType: 'hp', vaerdi: 50 }
				}
			}
		]
	},
    // --- MORAL: SKOV & ENG ---
	'skov_forladt_barn': {
		titel: "Grædende Skygge",
		tekst: "Et lille barn sidder alene i skovbunden og græder. Om dets hals hænger en medaljon af det reneste, tungeste guld.",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ 
				tekst: "Trøst barnet og følg det hjem", 
				udfald: {
					katastrofe: { log: "Det var et bagholdsangreb! Banditter overfalder dig.", aktionType: 'hp', vaerdi: -60 },
					fiasko: { log: "Du farer vild i timevis og river dig på tornekrat.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Du finder landsbyen, men får ingen tak.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Forældrene græder af glæde og deler deres beskedne mad.", aktionType: 'hp', vaerdi: 30 },
					mirakel: { log: "Faderen er en rigmand i eksil. Han belønner dig fyrsteligt.", aktionType: 'guld', vaerdi: 200 }
				}
			},
			{ 
				tekst: "Riv medaljonen af og løb", 
				udfald: {
					katastrofe: { log: "Medaljonen er forbandet! Den brænder sig ind i din hud.", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Barnet skriger og bider dig til blods.", aktionType: 'hp', vaerdi: -15 },
					neutral: { log: "Du får guldet, men skammen hviler tungt.", aktionType: 'guld', vaerdi: 50 },
					succes: { log: "En kold, ren fortjeneste. Ingen så det.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Kæden gemte på en skjult, endnu større ædelsten.", aktionType: 'guld', vaerdi: 300 }
				}
			}
		]
	},
	'eng_enhjoerning': {
		titel: "Faldet Renhed",
		tekst: "Et sagnomspundet hvidt væsen ligger blødende i græsset. Dets horn glimter magisk. Det lider voldsomt.",
		type: 'historie',
		biome: 'eng',
		valg: [
			{ 
				tekst: "Brug din egen livskraft på at hele det (-40 HP)", 
				aktionType: 'hp', 
				vaerdi: -40, 
				chance: 1.0, 
				naesteTrin: 'eng_enhjoerning_frelst' 
			},
			{ 
				tekst: "Skær hornet af (Dræb det)", 
				udfald: {
					katastrofe: { log: "Skoven vender sig mod dig i raseri! Træerne slår ud.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Dyrets sidste krampetrækning spidder dig.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "En brutal handling. Hornet er dit.", aktionType: 'guld', vaerdi: 150 },
					succes: { log: "Krystalklart snit. Blodet giver dig styrke.", aktionType: 'guld', vaerdi: 250 },
					mirakel: { log: "Hornet transformerer sig til ufattelige rigdomme.", aktionType: 'guld', vaerdi: 500 }
				}
			}
		]
	},
	'eng_enhjoerning_frelst': {
		titel: "Skoven Husker",
		tekst: "Dyret rejser sig. Det rører din pande med sit horn og forsvinder i et glimt af lys.",
		type: 'historie',
		biome: 'eng',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Modtag skovens velsignelse", 
				udfald: {
					katastrofe: { log: "Magien er for ren for dit mørke sind. Det gør ondt.", aktionType: 'hp', vaerdi: -10 },
					fiasko: { log: "Lyset falmer hurtigt. Du er bare træt.", aktionType: 'hp', vaerdi: 0 },
					neutral: { log: "Dine sår lukker sig langsomt.", aktionType: 'hp', vaerdi: 50 },
					succes: { log: "Du fyldes af en udødelig energi.", aktionType: 'hp', vaerdi: 120 },
					mirakel: { log: "Naturen kaster skjulte skatte op af jorden for dine fødder.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},

	// --- MORAL: BJERG & HULE ---
	'bjerg_kravler': {
		titel: "På Kanten af Afgrunden",
		tekst: "En rivaliserende skattejæger hænger fra en klippekant med én hånd. Hans taske svulmer af guld. 'Hjælp mig! Jeg deler byttet!'",
		type: 'historie',
		biome: 'bjerg',
		valg: [
			{ 
				tekst: "Træk ham op", 
				udfald: {
					katastrofe: { log: "Han trækker dig med ned! Du slår dig fordærvet på hylden under.", aktionType: 'hp', vaerdi: -75 },
					fiasko: { log: "Du redder ham, men forstrækker ryggen. Han løber uden at betale.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Du redder ham. Han kaster et par mønter i støvet.", aktionType: 'guld', vaerdi: 25 },
					succes: { log: "Han holder ord og deler sit bytte med dig.", aktionType: 'guld', vaerdi: 100 },
					mirakel: { log: "Han er i livsgæld og giver dig hele sin formue.", aktionType: 'guld', vaerdi: 300 }
				}
			},
			{ 
				tekst: "Træd på hans fingre og tag tasken", 
				udfald: {
					katastrofe: { log: "Han griber din ankel på vej ned. I falder begge!", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Tasken falder med ham ned i mørket.", aktionType: 'guld', vaerdi: 0 },
					neutral: { log: "Et koldt mord. Tasken er din.", aktionType: 'guld', vaerdi: 80 },
					succes: { log: "Rigdom uden konsekvens. Hans skrig forstummer.", aktionType: 'guld', vaerdi: 180 },
					mirakel: { log: "Manden bar på et sjældent, uvurderligt krystal.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},
	'hule_forraederi': {
		titel: "En Andens Skjulested",
		tekst: "Inderst i grotten finder du en sovepose, lidt tørret kød og en trækiste. Nogen bor her.",
		type: 'historie',
		biome: 'hule',
		valg: [
			{ 
				tekst: "Læg 50 guld som en gave", 
				aktionType: 'guld', 
				vaerdi: -50, 
				chance: 1.0, 
				naesteTrin: 'hule_forraederi_karma' 
			},
			{ 
				tekst: "Stjæl alt og læg en fælde", 
				udfald: {
					katastrofe: { log: "Ejeren står pludselig bag dig med en kniv!", aktionType: 'hp', vaerdi: -60 },
					fiasko: { log: "Du skærer dig på din egen fælde i mørket.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Kisten er næsten tom, men maden er god.", aktionType: 'hp', vaerdi: 15 },
					succes: { log: "En succesfuld plyndring. Du finder guld skjult i gulvet.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Det var en berygtet morders skjul. Du fandt hans formue.", aktionType: 'guld', vaerdi: 350 }
				}
			}
		]
	},
	'hule_forraederi_karma': {
		titel: "Karmas Ekko",
		tekst: "Da du forlader grotten, støder du på en såret jæger. Det er hans grotte. Han ser dit guld.",
		type: 'historie',
		biome: 'hule',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Modtag hans taknemmelighed", 
				udfald: {
					katastrofe: { log: "Han er skør og angriber dig alligevel.", aktionType: 'hp', vaerdi: -40 },
					fiasko: { log: "Han takker, men har intet at give tilbage.", aktionType: 'guld', vaerdi: 0 },
					neutral: { log: "Han giver dig en helbredende drik.", aktionType: 'hp', vaerdi: 40 },
					succes: { log: "Han viser dig en hemmelig guldåre i væggen.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Han sværger evig troskab og afleverer et magisk våben.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},

	// --- MORAL: SLAGMARK & BANDIT ---
	'slagmark_overlevende': {
		titel: "Det Åndende Lig",
		tekst: "Mens du gennemsøger ligene, griber en blodig hånd din ankel. Det er en ung soldat. Han bærer en officers ring.",
		type: 'historie',
		biome: 'slagmark',
		valg: [
			{ 
				tekst: "Giv ham din sidste vand og bær ham væk (-20 HP)", 
				aktionType: 'hp', 
				vaerdi: -20, 
				chance: 1.0, 
				naesteTrin: 'slagmark_redning' 
			},
			{ 
				tekst: "Skær hans finger af og tag ringen", 
				udfald: {
					katastrofe: { log: "Hans sidstemandskrampe driver en dolk i dit lår.", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Sygdommen i blodet smitter dig.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Et nådesløst snit. Ringen er din.", aktionType: 'guld', vaerdi: 80 },
					succes: { log: "Ringen er tung. Du finder også mønter i hans bælte.", aktionType: 'guld', vaerdi: 160 },
					mirakel: { log: "Ringen er et konge-segl. Den er ufatteligt meget værd.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},
	'slagmark_redning': {
		titel: "Ærens Pris",
		tekst: "Du slæber ham i sikkerhed. Han hiver efter vejret og peger mod sit bryst.",
		type: 'historie',
		biome: 'slagmark',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Lyt til hans hemmelighed", 
				udfald: {
					katastrofe: { log: "Han dør før han kan sige et ord. Du spildte dit helbred.", aktionType: 'guld', vaerdi: 0 },
					fiasko: { log: "Han giver dig ringen af ære, men den er ikke meget værd.", aktionType: 'guld', vaerdi: 30 },
					neutral: { log: "Han beder dig beholde ringen som tak.", aktionType: 'guld', vaerdi: 100 },
					succes: { log: "Han betror dig koden til hærens krigskasse.", aktionType: 'guld', vaerdi: 250 },
					mirakel: { log: "Han er kronprinsen. Dit navn vil stå i guld.", aktionType: 'guld', vaerdi: 600 }
				}
			}
		]
	},
	'bandit_fange': {
		titel: "Gidslet",
		tekst: "Du falder over en lejr. Tre banditter sover. En rig købmand er bundet til et træ. Han hvisker om en massiv dusør.",
		type: 'historie',
		biome: 'bandit',
		valg: [
			{ tekst: "Skær ham fri og løb", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'bandit_fange_flugt' },
			{ 
				tekst: "Væk banditterne og forhandl om en part", 
				udfald: {
					katastrofe: { log: "De stoler ikke på dig. De tager dig som gidsel nr. 2!", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "De griner og giver dig kun et par kobbermønter for ikke at blande dig.", aktionType: 'guld', vaerdi: 10 },
					neutral: { log: "De accepterer. Du får din del af blodpengene.", aktionType: 'guld', vaerdi: 80 },
					succes: { log: "Du forhandler dem i sænk. Dusøren er enorm.", aktionType: 'guld', vaerdi: 200 },
					mirakel: { log: "Du lokker dem i et baghold, dræber dem og tager købmandens penge OG banditternes.", aktionType: 'guld', vaerdi: 450 }
				}
			}
		]
	},
	'bandit_fange_flugt': {
		titel: "Dusørjægeren",
		tekst: "Købmanden er fri. Han fører dig til sit hjem i udkanten af skoven for at betale sin gæld.",
		type: 'historie',
		biome: 'bandit',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Modtag dusøren", 
				udfald: {
					katastrofe: { log: "Han forråder dig! Det var en fælde for at undgå at betale.", aktionType: 'hp', vaerdi: -50 },
					fiasko: { log: "Han lyver om sin rigdom. Han er fattig.", aktionType: 'guld', vaerdi: 20 },
					neutral: { log: "Han giver dig en ærlig, men beskeden belønning.", aktionType: 'guld', vaerdi: 100 },
					succes: { log: "Kisten åbnes. Løftet var sandt.", aktionType: 'guld', vaerdi: 250 },
					mirakel: { log: "Han gør dig til arving af sit handelshus.", aktionType: 'guld', vaerdi: 500 }
				}
			}
		]
	},

	// --- MORAL: BY & MARKED ---
	'by_tigger': {
		titel: "Sult og Hemmeligheder",
		tekst: "En udmagret skikkelse i gyden hiver fat i din kappe. 'Et brød... Giv mig guld til et brød, og jeg giver dig kortet til underverdenen.'",
		type: 'historie',
		biome: 'by',
		valg: [
			{ tekst: "Betal manden 50 Guld", aktionType: 'guld', vaerdi: -50, chance: 1.0, naesteTrin: 'by_tigger_kort' },
			{ 
				tekst: "Slå ham og tag kortet", 
				udfald: {
					katastrofe: { log: "Han er en forklædt snigmorder! Hans dolk finder dine ribben.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "Vagterne ser dig og giver dig tæsk.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Han krøller sammen. Kortet er dit.", aktionType: 'guld', vaerdi: 40 },
					succes: { log: "Han taber kortet og sin egen lille skjulte formue.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Kortet fører direkte til byens bankboks.", aktionType: 'guld', vaerdi: 350 }
				}
			}
		]
	},
	'by_tigger_kort': {
		titel: "Underverdenens Netværk",
		tekst: "Han kaster sig over mønterne. Kortet i din hånd viser en rute til byens smuglere.",
		type: 'historie',
		biome: 'by',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Følg kortet", 
				udfald: {
					katastrofe: { log: "Det var en fælde, arrangeret af byvagten. Du får en massiv bøde.", aktionType: 'guld', vaerdi: -100 },
					fiasko: { log: "Smuglerne er flyttet. Der er kun skrald tilbage.", aktionType: 'guld', vaerdi: 0 },
					neutral: { log: "Du finder lidt efterladt tyvegods.", aktionType: 'guld', vaerdi: 60 },
					succes: { log: "Du finder deres lager og tager hvad du kan bære.", aktionType: 'guld', vaerdi: 200 },
					mirakel: { log: "Du afbryder en ulovlig auktion og stikker af med hovedpræmien.", aktionType: 'guld', vaerdi: 450 }
				}
			}
		]
	},
	'marked_slaveri': {
		titel: "Auktionen",
		tekst: "På et skummelt hjørne af markedet sælges en muskuløs fange. Auktionarius råber: 'En stærk ryg til minerne! Startbud 100 guld!'",
		type: 'historie',
		biome: 'marked',
		valg: [
			{ tekst: "Køb ham fri og lad ham gå (-100G)", aktionType: 'guld', vaerdi: -100, chance: 1.0, naesteTrin: 'marked_slaveri_frihed' },
			{ 
				tekst: "Køb ham og tving ham til at bære guld (-100G)", 
				udfald: {
					katastrofe: { log: "Han kvæler dig om natten og stjæler alt.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Han flygter ved første lejlighed med nogle af dine ting.", aktionType: 'guld', vaerdi: -50 },
					neutral: { log: "Han gør arbejdet sløvt, men bærer vægten.", aktionType: 'guld', vaerdi: 150 },
					succes: { log: "Hans styrke mangedobler din lasteevne.", aktionType: 'guld', vaerdi: 250 },
					mirakel: { log: "Han slår lejr og finder skjulte ædelstene mens du sover.", aktionType: 'guld', vaerdi: 400 }
				}
			},
			{ tekst: "Ignorer det og gå", aktionType: 'luk' }
		]
	},
	'marked_slaveri_frihed': {
		titel: "En Brudt Lænke",
		tekst: "Du bryder hans lænker. Han kigger tavst på dig og forsvinder ud i mængden.",
		type: 'historie',
		biome: 'marked',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Vent på at karma vender tilbage", 
				udfald: {
					katastrofe: { log: "Han var kriminel. Byvagten kaster dig i fængsel for at befri ham.", aktionType: 'guld', vaerdi: -150 },
					fiasko: { log: "Ingenting sker. Du spildte dit guld.", aktionType: 'guld', vaerdi: 0 },
					neutral: { log: "Du finder en anonym pose mønter næste morgen.", aktionType: 'guld', vaerdi: 120 },
					succes: { log: "Han sender sine brødre med en enorm taknemmelighedsgave.", aktionType: 'guld', vaerdi: 300 },
					mirakel: { log: "Han er konge af underverdenen og gør dig usandsynligt rig.", aktionType: 'guld', vaerdi: 600 }
				}
			}
		]
	},
    // --- KROP & MUTATION: KØDSKOV & BLODSKOV ---
	'alkymi_frugt': {
		titel: "Kødtræets Frugt",
		tekst: "Et træ lavet af pulserende sener bærer en frugt, der ligner et flået, bankende hjerte. Den drypper af varm saft.",
		type: 'historie',
		biome: 'alkymi',
		valg: [
			{ 
				tekst: "Sæt tænderne i den", 
				udfald: {
					katastrofe: { log: "Den er fyldt med ædende maddiker! De graver sig ind i dine tarme.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Kødet er råddent. Du kaster blod op.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Det smager af jern, men det mætter en smule.", aktionType: 'hp', vaerdi: 15 },
					succes: { log: "Rå muskelmasse. Din krop absorberer det øjeblikkeligt.", aktionType: 'hp', vaerdi: 80 },
					mirakel: { log: "Perfekt symbiose! Frugten muterer dine organer til at være dobbelt så stærke.", aktionType: 'hp', vaerdi: 200 }
				}
			},
			{ tekst: "Skær den ned og sælg den", aktionType: 'guld', vaerdi: 40, chance: 0.8, failVaerdi: -10 }
		]
	},
	'alkymi_parasit': {
		titel: "En Ny Ven",
		tekst: "Du træder i en blød pøl. En tyk, ormelignende parasit borer sig lynhurtigt ind under huden på din underarm. Den taler til dig inde i dit hoved.",
		type: 'kamp',
		biome: 'alkymi',
		valg: [
			{ tekst: "Skær den ud med sablen (-40 HP)", aktionType: 'hp', vaerdi: -40, chance: 1.0, naesteTrin: undefined },
			{ tekst: "Lad den blive og lyt til den", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'alkymi_parasit_vokser' }
		]
	},
	'alkymi_parasit_vokser': {
		titel: "Symbiosens Pris",
		tekst: "Parasitten snor sig om dine knogler. 'Giv mig dit guld, og jeg giver dig mit kød,' siger stemmen.",
		type: 'historie',
		biome: 'alkymi',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Fodr den (Kast terningerne)", 
				udfald: {
					katastrofe: { log: "Den fortærer din arm indefra i stedet!", aktionType: 'hp', vaerdi: -100 },
					fiasko: { log: "Den spiser dit guld, men gør dig syg.", aktionType: 'guld', vaerdi: -50 },
					neutral: { log: "Den tager 100 guld og heler dine skrammer.", aktionType: 'hp', vaerdi: 30 },
					succes: { log: "Den bygger panser under din hud. Du mister guld, men bliver en tank.", aktionType: 'hp', vaerdi: 120 },
					mirakel: { log: "Den kaster en massiv guldklump op og dør. Du får alt.", aktionType: 'guld', vaerdi: 300 }
				}
			}
		]
	},
	'blodskov_kilde': {
		titel: "Det Åbne Sår",
		tekst: "Jorden er sprækket, og en tyk, rød væske bobler op fra dybet. Det lugter svagt af kobber og gammel magi.",
		type: 'historie',
		biome: 'blodskov',
		valg: [
			{ 
				tekst: "Bad i kilden", 
				udfald: {
					katastrofe: { log: "Væsken er kogende syre!", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Det brænder i øjnene, og du mister orienteringen.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Du bliver ren, men væsken gør intet for dine sår.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Sårene lukker sig, og huden hærdes.", aktionType: 'hp', vaerdi: 60 },
					mirakel: { log: "Kilden forynger dine celler fuldstændigt. Vitaliteten sprænger skalaen.", aktionType: 'hp', vaerdi: 150 }
				}
			},
			{ tekst: "Fyld din dunk og gå", aktionType: 'hp', vaerdi: 15, chance: 1.0 }
		]
	},

	// --- KROP & MUTATION: ALKYMI & BY ---
	'alkymi_kirurg': {
		titel: "Mekanisk Medicin",
		tekst: "En rusten, otte-armet maskine hænger fra loftet. Et skilt blinker: 'KROPS-OPGRADERING. KUN 100 GULD. SMERTE ER MIDLERTIDIG'.",
		type: 'butik',
		biome: 'alkymi',
		valg: [
			{ tekst: "Betal for operationen (-100G)", aktionType: 'guld', vaerdi: -100, chance: 1.0, naesteTrin: 'alkymi_kirurg_operation' },
			{ tekst: "Afslå tilbuddet", aktionType: 'luk' }
		]
	},
	'alkymi_kirurg_operation': {
		titel: "Under Kniven",
		tekst: "Maskinens arme griber dig. Boremaskiner og beskidte kanyler nærmer sig din brystkasse.",
		type: 'kamp',
		biome: 'alkymi',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Hold ud og lad den arbejde", 
				udfald: {
					katastrofe: { log: "En fatal fejl. Den sprætter dig op og kortslutter.", aktionType: 'hp', vaerdi: -120 },
					fiasko: { log: "Den syr dig forkert sammen. Kroniske smerter.", aktionType: 'hp', vaerdi: -40 },
					neutral: { log: "Operationen lykkes akkurat. Du er lidt stærkere.", aktionType: 'hp', vaerdi: 30 },
					succes: { log: "Stålplader er indopereret over dine ribben.", aktionType: 'hp', vaerdi: 120 },
					mirakel: { log: "Maskinen injicerer rent titan-marv i dine knogler.", aktionType: 'hp', vaerdi: 300 }
				}
			}
		]
	},
	'by_pestlaege': {
		titel: "Kurens Pris",
		tekst: "En skikkelse i en fuglemaske trækker dig ind i en gyde. 'Luften her gør dig svag. Drik denne forebyggende eliksir. Det er gratis for de modige.'",
		type: 'historie',
		biome: 'by',
		valg: [
			{ 
				tekst: "Bæl den sorte væske", 
				udfald: {
					katastrofe: { log: "Dine årer bliver sorte. Det var en dødelig gift.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Du kaster voldsomt op i en time.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Smager af lakrids og mudder. Ingen effekt.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Dit åndedræt bliver dybt og stærkt.", aktionType: 'hp', vaerdi: 50 },
					mirakel: { log: "Eliksiren hærder dit immunsystem for evigt. Ren kraft.", aktionType: 'hp', vaerdi: 150 }
				}
			},
			{ tekst: "Skub ham væk", aktionType: 'luk' }
		]
	},
	'marked_organ_handler': {
		titel: "Boden under jorden",
		tekst: "Under en presenning sælger en mand kød. Ikke fra dyr. Han har et perfekt, friskt hjerte liggende i et glas. 'Skift dit gamle ud for 200 guld.'",
		type: 'butik',
		biome: 'marked',
		valg: [
			{ tekst: "Køb og indtag det (-200G)", aktionType: 'guld', vaerdi: -200, chance: 1.0, naesteTrin: 'marked_organ_effekt' },
			{ tekst: "Bliv forarget og gå", aktionType: 'luk' }
		]
	},
	'marked_organ_effekt': {
		titel: "Kødets Accept",
		tekst: "Du fortærer hjertet råt. Din egen krop reagerer voldsomt på det fremmede væv.",
		type: 'kamp',
		biome: 'marked',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Kæmp mod afstødningen", 
				udfald: {
					katastrofe: { log: "Dit eget hjerte stopper i protest.", aktionType: 'hp', vaerdi: -100 },
					fiasko: { log: "Du sveder blod og kollapser.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Vævet integreres efter en hård nat.", aktionType: 'hp', vaerdi: 20 },
					succes: { log: "Dobbelt hjerteslag! Din puls hamrer med ny styrke.", aktionType: 'hp', vaerdi: 120 },
					mirakel: { log: "Guddommelig kondition. Du føler dig uovervindelig.", aktionType: 'hp', vaerdi: 250 }
				}
			}
		]
	},

	// --- KROP & MUTATION: SLAGMARK & HULE ---
	'slagmark_grafter': {
		titel: "Kirurgi på Slagmarken",
		tekst: "Du mangler en hånd? En vanvittig feltlæge har bundet sig fast til en vogn. Han vifter med en kødøkse og en enorm, afhugget ork-arm.",
		type: 'historie',
		biome: 'slagmark',
		valg: [
			{ tekst: "Få ork-armen sat på din krop", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'slagmark_grafter_operation' },
			{ tekst: "Behold dine egne lemmer", aktionType: 'luk' }
		]
	},
	'slagmark_grafter_operation': {
		titel: "Amputationen",
		tekst: "Han hakker din egen, raske arm af uden bedøvelse. Så begynder han at sy det massive grønne kød fast på din stump.",
		type: 'kamp',
		biome: 'slagmark',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Overlev smerten", 
				udfald: {
					katastrofe: { log: "Blodtabet er for massivt. Du dør langsomt.", aktionType: 'hp', vaerdi: -120 },
					fiasko: { log: "Koldbrand i syningerne. Du er alvorligt svækket.", aktionType: 'hp', vaerdi: -60 },
					neutral: { log: "Armen sidder fast, men den er klodset.", aktionType: 'hp', vaerdi: 10 },
					succes: { log: "Musklerne forbinder sig. Du kan knuse sten med den nye næve.", aktionType: 'hp', vaerdi: 100 },
					mirakel: { log: "Orkens blod muterer hele din krop til enorm styrke.", aktionType: 'hp', vaerdi: 200 }
				}
			}
		]
	},
	'hule_svamp': {
		titel: "Blinkende Sporer",
		tekst: "Grottens vægge er dækket af lysende, blå svampe. Luften er tyk af deres støv. Hvert åndedrag kildrer i lungerne.",
		type: 'historie',
		biome: 'hule',
		valg: [
			{ 
				tekst: "Inhaler dybt", 
				udfald: {
					katastrofe: { log: "Svampe begynder at gro ud gennem dine øjne.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Kvælningsfornemmelse. Du hoster blod.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "En kort hallucination af flyvende fisk. Intet andet.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Sporene udvider din lungekapacitet permanent.", aktionType: 'hp', vaerdi: 70 },
					mirakel: { log: "Svampene danner et beskyttende lag over dine indre organer.", aktionType: 'hp', vaerdi: 180 }
				}
			},
			{ tekst: "Hold vejret og skynd dig ud (-10 HP)", aktionType: 'hp', vaerdi: -10, chance: 1.0 }
		]
	},

	// --- KROP & MUTATION: blodskov ---
	'blodskov_igler': {
		titel: "Vandet Lever",
		tekst: "Du skal krydse en lavvandet pøl. Vandet koger af store, sorte igler. De er kendt for enten at rense blod eller dræne det.",
		type: 'kamp',
		biome: 'blodskov',
		valg: [
			{ 
				tekst: "Vade igennem uden beskyttelse", 
				udfald: {
					katastrofe: { log: "De suger dig tør på få minutter.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "De tager mere blod end godt er. Du er svimmel.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "De sutter lidt, men slipper hurtigt.", aktionType: 'hp', vaerdi: -5 },
					succes: { log: "De renser infektioner fra din krop og dør.", aktionType: 'hp', vaerdi: 60 },
					mirakel: { log: "Iglerne overfører helende enzymer direkte til dit hjerte.", aktionType: 'hp', vaerdi: 150 }
				}
			},
			{ tekst: "Gå en kæmpe omvej (-20 Guld i mistet tid)", aktionType: 'guld', vaerdi: -20, chance: 1.0 }
		]
	},
    // --- KÆRLIGHED: RUIN & KRYSTAL ---
	'ruin_elskende': {
		titel: "Kærlighed i Sten",
		tekst: "To stenfigurer er låst i en evig omfavnelse. En skål står mellem dem. 'Blod forener', står der indgraveret i soklen.",
		type: 'historie',
		biome: 'ruin',
		valg: [
			{ tekst: "Skær din håndflade over skålen", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ruin_elskende_blod' },
			{ tekst: "Spit i skålen og gå videre", aktionType: 'luk' }
		]
	},
	'ruin_elskende_blod': {
		titel: "Stenens Tørst",
		tekst: "Du lader blodet dryppe ned i stenskålen. Figurerne begynder at ryste voldsomt. Sten skurrer mod sten.",
		type: 'historie',
		biome: 'ruin',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Stå fast og vent", 
				udfald: {
					katastrofe: { log: "Statuerne suger livskraften ud af dig gennem luften.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Såret i din hånd nægter at lukke sig. Du bløder tungt.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "Stenene drikker blodet. Ingenting andet sker.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Deres hænder åbner sig. Gamle mønter falder ud.", aktionType: 'guld', vaerdi: 100 },
					mirakel: { log: "Statuerne smuldrer væk. To kongelige kroner ligger i støvet.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},
	'krystal_fange': {
		titel: "Glasskønhed",
		tekst: "En ufatteligt smuk skikkelse er fanget inde i en lilla krystal. Den presser hænderne mod overfladen. Læberne former ordet 'hjælp'.",
		type: 'historie',
		biome: 'krystal',
		valg: [
			{ tekst: "Slå krystallen i stykker", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'krystal_fange_knus' },
			{ tekst: "Vend blikket væk", aktionType: 'luk' }
		]
	},
	'krystal_fange_knus': {
		titel: "Den Falske Engel",
		tekst: "Glasset splintres i tusind stykker. Skikkelsen falder ud i dine arme. Dens hud er kold.",
		type: 'kamp',
		biome: 'krystal',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Grib den", 
				udfald: {
					katastrofe: { log: "Det er et monster. Dens kæber flænser din hals.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Glasstykkerne skærer dybt i din krop.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Væsenet bliver til støv i dine hænder.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Den takker dig og forærer dig krystallens kerne.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Den velsigner dig med et kys. Dine sår heler totalt.", aktionType: 'hp', vaerdi: 150 }
				}
			}
		]
	},

	// --- KÆRLIGHED: SKOV & ENG ---
	'skov_spejlpoel': {
		titel: "Narcissus",
		tekst: "En fuldstændig klar skovsø ligger foran dig. Du kigger ned og ser den mest perfekte, fejlfrie version af dig selv. Synet drager dig magnetisk.",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ tekst: "Dyk ned i omfavnelsen", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'skov_spejlpoel_dyk' },
			{ tekst: "Kast en sten i vandet", aktionType: 'luk' }
		]
	},
	'skov_spejlpoel_dyk': {
		titel: "Koldt Begær",
		tekst: "Du kaster dig i det isnende vand for at nå spejlbilledet. Vandet lukker sig om dig.",
		type: 'kamp',
		biome: 'skov',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Svøm dybere", 
				udfald: {
					katastrofe: { log: "Spejlbilledet trækker dig ned. Du drukner næsten.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Kulden giver dig voldsomme kramper.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Du bryder overfladen igen. Våd og forfrossen.", aktionType: 'hp', vaerdi: -10 },
					succes: { log: "Vandet renser dit sind for mørke tanker. Du føler dig let.", aktionType: 'hp', vaerdi: 50 },
					mirakel: { log: "På bunden finder du en glemt kiste fyldt med guld.", aktionType: 'guld', vaerdi: 250 }
				}
			}
		]
	},
	'eng_hjerteblomst': {
		titel: "Jordens Puls",
		tekst: "En stor blomst vokser præcis i form som et menneskehjerte. Den slår rytmisk. Rødderne pumper med rød saft.",
		type: 'historie',
		biome: 'eng',
		valg: [
			{ 
				tekst: "Spis blomsten rå", 
				udfald: {
					katastrofe: { log: "Blomsten slår rødder i din mave. En ulidelig smerte.", aktionType: 'hp', vaerdi: -75 },
					fiasko: { log: "Den smager af råddent kød. Du kaster op.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Den mætter lidt. Saften er sød.", aktionType: 'hp', vaerdi: 10 },
					succes: { log: "Ren vitalitet pumper gennem dine årer.", aktionType: 'hp', vaerdi: 80 },
					mirakel: { log: "Dit eget hjerte slår nu med naturens uendelige kraft.", aktionType: 'hp', vaerdi: 180 }
				}
			},
			{ tekst: "Træd den flad", aktionType: 'luk' }
		]
	},

	// --- KÆRLIGHED: BY & MARKED ---
	'by_samler': {
		titel: "Besættelsen",
		tekst: "En rigmand stopper dig på gaden. Han græder ukontrolleret. 'Du har hendes øjne. Min afdøde kone. Jeg må eje dem.'",
		type: 'butik',
		biome: 'by',
		valg: [
			{ tekst: "Accepter hans kirurgi", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'by_samler_kirurgi' },
			{ tekst: "Slå ham i ansigtet", aktionType: 'luk' }
		]
	},
	'by_samler_kirurgi': {
		titel: "Sølvskeen",
		tekst: "Han smiler bredt. Han trækker en pudset sølvske og en enorm læderpose fyldt med guld frem fra sin kappe.",
		type: 'kamp',
		biome: 'by',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Hold ud under smerten", 
				udfald: {
					katastrofe: { log: "Skeen skærer for dybt. Han ødelægger dit ansigt.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Operationen giver dig en hidsig infektion.", aktionType: 'hp', vaerdi: -40 },
					neutral: { log: "Han fortryder i sidste sekund. Du får et par mønter for besværet.", aktionType: 'guld', vaerdi: 40 },
					succes: { log: "Han tager ét øje. Det gør ondt, men betalingen er massiv.", aktionType: 'guld', vaerdi: 200 },
					mirakel: { log: "Han erstatter dit øje med en magisk diamant. Du ser alt.", aktionType: 'guld', vaerdi: 500 }
				}
			}
		]
	},
	'marked_elskovsdrik': {
		titel: "Flydende Hengivenhed",
		tekst: "En købmand ryster en lille lyserød flaske. 'Kærlighed på flaske. Drik den selv, og elsk din egen eksistens ubetinget.'",
		type: 'butik',
		biome: 'marked',
		valg: [
			{ tekst: "Køb eliksiren (60G)", aktionType: 'guld', vaerdi: -60, chance: 1.0, naesteTrin: 'marked_elskovsdrik_drik' },
			{ tekst: "Ignorer ham", aktionType: 'luk' }
		]
	},
	'marked_elskovsdrik_drik': {
		titel: "Blind Kærlighed",
		tekst: "Du trækker proppen af. Væsken dufter af roser og brændt sukker. Du bunder flasken i ét drag.",
		type: 'historie',
		biome: 'marked',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Afvent effekten", 
				udfald: {
					katastrofe: { log: "Ren gift. Dine tarme kramper sammen.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "Du forelsker dig i en sten og kaster dine penge efter den.", aktionType: 'guld', vaerdi: -40 },
					neutral: { log: "Du smiler fjernt i ti minutter. Intet andet.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Et varmt lys spreder sig i din krop. Smerter forsvinder.", aktionType: 'hp', vaerdi: 60 },
					mirakel: { log: "Du elsker dig selv nok til at blive ustoppelig. Ren styrke.", aktionType: 'hp', vaerdi: 150 }
				}
			}
		]
	},

	// --- KÆRLIGHED: BJERG & HULE ---
	'bjerg_frosset_kram': {
		titel: "Varmens Pris",
		tekst: "To bjergbestigere er frosset fast til isen. De døde i armene på hinanden. En tung diamantring sidder på hendes finger.",
		type: 'historie',
		biome: 'bjerg',
		valg: [
			{ tekst: "Hug fingeren af med magt", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'bjerg_frosset_hug' },
			{ tekst: "Byg en stenvarde over dem", aktionType: 'hp', vaerdi: 10, chance: 1.0 }
		]
	},
	'bjerg_frosset_hug': {
		titel: "Kold Profeti",
		tekst: "Isen er hård som stål. Du løfter dit værktøj og slår til med fuld kraft.",
		type: 'kamp',
		biome: 'bjerg',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Bryd isen", 
				udfald: {
					katastrofe: { log: "Isen splintres. Kanten falder sammen under dig.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Du forstrækker skulderen voldsomt under slaget.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Du får ringen, men den er ikke meget værd.", aktionType: 'guld', vaerdi: 40 },
					succes: { log: "Et rent snit. Diamanten er fejlfri.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Under isen finder du deres skjulte forsyningskasse.", aktionType: 'guld', vaerdi: 350 }
				}
			}
		]
	},
	'hule_troll_sorg': {
		titel: "Udyrets Tårer",
		tekst: "En enorm grottetroll sidder i mudderet. Den vugger en knust goblin i sine arme. Tårer på størrelse med æbler rammer jorden.",
		type: 'historie',
		biome: 'hule',
		valg: [
			{ tekst: "Træd frem og trøst den", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'hule_troll_troest' },
			{ tekst: "Udnyt situationen og løb", aktionType: 'luk' }
		]
	},
	'hule_troll_troest': {
		titel: "Kæmpefavnen",
		tekst: "Du rækker hånden ud mod monstret. Den kigger på dig med røde, opsvulmede øjne.",
		type: 'kamp',
		biome: 'hule',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Mød dens blik", 
				udfald: {
					katastrofe: { log: "Den knuser din brystkasse i et fortvivlet kram.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Den slår blindt ud efter dig i vrede.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "Den snøfter højlydt og ignorerer dig derefter.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Den lader dig ae dens hoved. Den taber en pose guld.", aktionType: 'guld', vaerdi: 100 },
					mirakel: { log: "Den bærer dig sikkert ud og forærer dig sin skat.", aktionType: 'guld', vaerdi: 300 }
				}
			}
		]
	},

	// --- KÆRLIGHED: ALKYMI, BANDIT, MARK & blodskov ---
	'alkymi_brud': {
		titel: "Det Perfekte Match",
		tekst: "En videnskabsmand syr lemmer sammen på et operationsbord. 'Jeg bygger den perfekte ægtefælle. Jeg mangler bare friskt blod.'",
		type: 'historie',
		biome: 'alkymi',
		valg: [
			{ tekst: "Doner dit blod (-30 HP)", aktionType: 'fortsaet', vaerdi: -30, naesteTrin: 'alkymi_brud_blod' },
			{ tekst: "Vælt operationsbordet", aktionType: 'luk' }
		]
	},
	'alkymi_brud_blod': {
		titel: "Skabelsens Øjeblik",
		tekst: "Du lader blodet dryppe ned i laboratoriets rør. Maskinerne hviner. Kropsdelene på bordet begynder at spænde op.",
		type: 'historie',
		biome: 'alkymi',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Se resultatet", 
				udfald: {
					katastrofe: { log: "Skabningen vågner. Den er sulten og angriber dig.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "Kødklumpen rådner øjeblikkeligt. Forsøget fejler.", aktionType: 'guld', vaerdi: 0 },
					neutral: { log: "Alkymisten takker dig med et beskedent honorar.", aktionType: 'guld', vaerdi: 50 },
					succes: { log: "Den ånder! Alkymisten betaler dig fyrsteligt for succesen.", aktionType: 'guld', vaerdi: 180 },
					mirakel: { log: "Skabningen kaster op. Den kaster rene guldbarrer ud.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},
	'bandit_broder': {
		titel: "Broderbånd",
		tekst: "En døende bandit ligger i græsset. Hans makker holder ham tæt. 'Tag min tyvekost. Tag alt mit guld. Bare red ham.'",
		type: 'historie',
		biome: 'bandit',
		valg: [
			{ tekst: "Overfør din livskraft (-40 HP)", aktionType: 'fortsaet', vaerdi: -40, naesteTrin: 'bandit_broder_hjaelp' },
			{ tekst: "Dræb makkeren og tag alt", aktionType: 'guld', vaerdi: 100, chance: 0.8, failVaerdi: -40 }
		]
	},
	'bandit_broder_hjaelp': {
		titel: "Blodpenge",
		tekst: "Du lægger hænderne på den blødende mand. Hans vejrtrækning stabiliserer sig. Makkeren rejser sig langsomt op.",
		type: 'historie',
		biome: 'bandit',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Forlang din betaling", 
				udfald: {
					katastrofe: { log: "De trækker knive. 'Ingen vidner', siger de.", aktionType: 'hp', vaerdi: -75 },
					fiasko: { log: "Han smider en tynd pung og flygter med sin bror.", aktionType: 'guld', vaerdi: 20 },
					neutral: { log: "De holder ord. Du får deres seneste bytte.", aktionType: 'guld', vaerdi: 80 },
					succes: { log: "Han tømmer alle sine lommer. Det er meget.", aktionType: 'guld', vaerdi: 200 },
					mirakel: { log: "De forærer dig nøglen til kartellets hovedkiste.", aktionType: 'guld', vaerdi: 450 }
				}
			}
		]
	},
	'mark_moder': {
		titel: "Det Tomme Bryst",
		tekst: "En gammel kvinde graver rasende i jorden med de bare næver. 'Mit barn er begravet hernede. Hjælp mig.'",
		type: 'historie',
		biome: 'mark',
		valg: [
			{ tekst: "Brug kræfter på at grave", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'mark_moder_grav' },
			{ tekst: "Træk hende væk", aktionType: 'luk' }
		]
	},
	'mark_moder_grav': {
		titel: "Under Mulden",
		tekst: "Jorden er hård pakket. Du graver indtil dine hænder bløder og dine lunger brænder. Du rammer noget hårdt.",
		type: 'kamp',
		biome: 'mark',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Træk genstanden op", 
				udfald: {
					katastrofe: { log: "Det er en minefælde. Eksplosionen smadrer jer.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Det er bare en sten. Du har udmattet dig selv totalt.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Du finder en kiste med gamle mønter. Kvinden græder.", aktionType: 'guld', vaerdi: 50 },
					succes: { log: "Kisten er fyldt med familiens arvestykker. Du får dem.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Du udgraver et legendarisk guldskjold.", aktionType: 'guld', vaerdi: 350 }
				}
			}
		]
	},
	'blodskov_bryllup': {
		titel: "Evigt Løfte",
		tekst: "En sunket hestevogn i mudderet. Indeni sidder to skeletter i fint tøj. De holder stadig i hånd. En stor rubin lyser på brudens finger.",
		type: 'historie',
		biome: 'blodskov',
		valg: [
			{ tekst: "Vrid ringen af fingeren", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'blodskov_bryllup_ring' },
			{ tekst: "Læg en mønt som respekt", aktionType: 'luk' }
		]
	},
	'blodskov_bryllup_ring': {
		titel: "Ægteskabets Lænker",
		tekst: "Du stikker armen ind gennem vognens rådne vindue. Dine fingre griber fat om stenen.",
		type: 'kamp',
		biome: 'blodskov',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Træk hårdt til", 
				udfald: {
					katastrofe: { log: "Gommens skelet bider dig i armen. Råd spreder sig.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "blodskovens igler sætter sig på din arm.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Ringen er forbandet. Den mærker dig mørkt.", aktionType: 'hp', vaerdi: -10 },
					succes: { log: "Du får stenen fri uden kamp. Den er mange penge værd.", aktionType: 'guld', vaerdi: 160 },
					mirakel: { log: "Ringen rummer brudens rene kærlighed. Den heler dig.", aktionType: 'hp', vaerdi: 150 }
				}
			}
		]
	},
	'ritual_hjertebaand': {
		titel: "En Krop",
		tekst: "Syv kultister syr deres hud sammen i en stor cirkel. De vil skabe en samlet organisme af ren hengivenhed. Blodet flyder frit.",
		type: 'historie',
		biome: 'ritual',
		valg: [
			{ tekst: "Træd ind og modtag nålen", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ritual_hjertebaand_deltag' },
			{ tekst: "Afbryd deres vanvid", aktionType: 'luk' }
		]
	},
	'ritual_hjertebaand_deltag': {
		titel: "Blodets Bånd",
		tekst: "Nålen genneborer din skulder. Du bliver fysisk bundet til fremmede mennesker. Der trækkes i tråden.",
		type: 'historie',
		biome: 'ritual',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Mærk forbindelsen", 
				udfald: {
					katastrofe: { log: "En af kultisterne har pest. Sygdommen pumper ind i dig.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Smerten er ubeskrivelig. Tråden river i dit kød.", aktionType: 'hp', vaerdi: -40 },
					neutral: { log: "Cirklen giver varme, men ingen yderligere kraft.", aktionType: 'hp', vaerdi: 10 },
					succes: { log: "Syv personers livskraft flyder sammen og styrker dig.", aktionType: 'hp', vaerdi: 100 },
					mirakel: { log: "Hengivenheden transcenderer grænser. Du bliver usårlig i et magisk øjeblik.", aktionType: 'hp', vaerdi: 250 }
				}
			}
		]
	},
    // --- INTELLIGENS: RUIN & ALKYMI (Gåder og Maskiner) ---
	'ruin_sfinx_start': {
		titel: "Dørens Spørgsmål",
		tekst: "En massiv metaldør blokerer vejen. En indgraveret mund bevæger sig i stålpladen. 'Jeg har byer uden huse, bjerge uden sten og floder uden vand. Hvad er jeg?'",
		type: 'historie',
		biome: 'ruin',
		valg: [
			{ tekst: "Svar: Et kort", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ruin_sfinx_svar' },
			{ tekst: "Svar: Sindet", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ruin_sfinx_svar' },
			{ tekst: "Tving døren op med rå magt (-20 HP)", aktionType: 'hp', vaerdi: -20, chance: 1.0 }
		]
	},
	'ruin_sfinx_svar': {
		titel: "Stålets Dom",
		tekst: "Døren tygger på dit svar. Gennem sprækkerne siver en grønlig røg frem. Du skal have overtænkt maskinens logik perfekt for at undgå fælden.",
		type: 'kamp',
		biome: 'ruin',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Afvent mekanismen", 
				udfald: {
					katastrofe: { log: "Forkert! Røgen er ren syre. Dine lunger brænder.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Døren smækker en jernpig ind i dit lår for din uvidenhed.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Døren forbliver låst. Du må gå tomhændet derfra.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Korrekt. Døren glider op til et skjult skattekammer.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Mekanismen anerkender dit geni og spytter ældgamle diamanter ud.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},
	'alkymi_ventil_start': {
		titel: "Trykkammeret",
		tekst: "Et kompliceret rør-system lækker farlig gas. Der er tre ventiler: Rød, blå og gul. Et notat nævner, at 'Ildens farve skal dræbes af havets'.",
		type: 'historie',
		biome: 'alkymi',
		valg: [
			{ tekst: "Drejekombinationen", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'alkymi_ventil_traek' },
			{ tekst: "Løb væk før det sprænger", aktionType: 'luk' }
		]
	},
	'alkymi_ventil_traek': {
		titel: "Kemisk Reaktion",
		tekst: "Du drejer den blå ventil, derefter den røde. Trykket i rørene stiger til et kritisk niveau. Glasset i måleren begynder at revne.",
		type: 'kamp',
		biome: 'alkymi',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Hold fast og håb på din logik", 
				udfald: {
					katastrofe: { log: "Forkert rækkefølge! Maskinen eksploderer i kogende kemikalier.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Et rør springer og flænser din arm.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "Systemet lukker ned. Ingen skade, men ingen belønning.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Trykket falder. En skuffe åbner sig med alkymistisk guld.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Du stabiliserer maskinen perfekt. Den kondenserer en uvurderlig helbredelseseliksir.", aktionType: 'hp', vaerdi: 200 }
				}
			}
		]
	},

	// --- INTELLIGENS: BY & MARKED (Svindel og Strategi) ---
	'by_skak_start': {
		titel: "Galningens Bræt",
		tekst: "En lærd tigger sidder ved et skakbræt af elfenben. Han mangler kun ét træk for at sætte mat. 'Du ser kvik ud. Vis mig trækket. Spil om dit liv.'",
		type: 'historie',
		biome: 'by',
		valg: [
			{ tekst: "Analyser brættet og ryk dronningen", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'by_skak_slut' },
			{ tekst: "Vælt brættet for at stjæle brikkerne", aktionType: 'guld', vaerdi: 40, chance: 0.6, failVaerdi: -20 }
		]
	},
	'by_skak_slut': {
		titel: "Det Sidste Træk",
		tekst: "Du flytter brikken. Manden stirrer intenst på brættet. Hans øjne flakker hurtigt over mulighederne.",
		type: 'historie',
		biome: 'by',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Afvent hans modtræk", 
				udfald: {
					katastrofe: { log: "Det var en fælde. Han trækker en dolk og stikker dig ned.", aktionType: 'hp', vaerdi: -65 },
					fiasko: { log: "Du overså hans løber. Han vinder og stjæler din pung.", aktionType: 'guld', vaerdi: -40 },
					neutral: { log: "Stemate. Ingen vinder. Han surmuler.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Skakmat! Han græder af ærefrygt og giver dig sin formue.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Et genialt træk. Han afleverer et skøde til et byhus fyldt med værdier.", aktionType: 'guld', vaerdi: 350 }
				}
			}
		]
	},
	'marked_baeger_start': {
		titel: "Svindlerens Kop",
		tekst: "En hurtigsnakkende mand flytter en perle rundt under tre træbægre. Tempoet er svimlende. 'Hvor er perlen? Indsatsen er 50 guld!'",
		type: 'butik',
		biome: 'marked',
		valg: [
			{ tekst: "Hold øjnene skarpe og betal (-50G)", aktionType: 'guld', vaerdi: -50, chance: 1.0, naesteTrin: 'marked_baeger_slut' },
			{ tekst: "Ryst på hovedet og gå", aktionType: 'luk' }
		]
	},
	'marked_baeger_slut': {
		titel: "Afsløringen",
		tekst: "Han stopper pludselig hænderne. De tre bægre står stille. Din hjerne arbejder på højtryk for at rekonstruere mønsteret.",
		type: 'historie',
		biome: 'marked',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Peg på det midterste bæger", 
				udfald: {
					katastrofe: { log: "Mens du peger, skærer hans makker din rygsæk op bagfra.", aktionType: 'guld', vaerdi: -100 },
					fiasko: { log: "Tomt! Hans hænder var hurtigere end dine øjne.", aktionType: 'guld', vaerdi: 0 },
					neutral: { log: "Du fanger ham i at snyde. Han giver dig din indsats tilbage.", aktionType: 'guld', vaerdi: 50 },
					succes: { log: "Du regnede ham ud! Perlen ligger der. Dobbelt op.", aktionType: 'guld', vaerdi: 100 },
					mirakel: { log: "Du knækker hans system og tømmer ham totalt for alt han ejer.", aktionType: 'guld', vaerdi: 300 }
				}
			}
		]
	},

	// --- INTELLIGENS: HULE & KRYSTAL (Tolkning og Optik) ---
	'hule_runer_start': {
		titel: "De Blinde Runer",
		tekst: "I det totale mørke mærker du riller i stenvæggen. Det er et ældgammelt sprog. Din hukommelse om antik lingvistik er din eneste vejledning.",
		type: 'historie',
		biome: 'hule',
		valg: [
			{ tekst: "Læs teksten med fingrene", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'hule_runer_laes' },
			{ tekst: "Mørket er for farligt", aktionType: 'luk' }
		]
	},
	'hule_runer_laes': {
		titel: "Oversættelsen",
		tekst: "Du kører fingrene over skarpe hjørner. 'Træd ikke på...', danner det i dit hoved. Men hvad er det sidste ord?",
		type: 'kamp',
		biome: 'hule',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Beregn næste skridt i blinde", 
				udfald: {
					katastrofe: { log: "Du fejltolkede ordet 'slange'. Noget bider dig dybt i læggen.", aktionType: 'hp', vaerdi: -75 },
					fiasko: { log: "Du træder på glasskår. Beskeden var en advarsel mod fælder.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Du står musestille indtil du finder udgangen. Uskadt.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Ordet var 'Skyggen'. Du følger væggen sikkert frem til en skat.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Beskeden var en instruks. Du deaktiverer hulens beskyttelse og finder kongens gemte grav.", aktionType: 'guld', vaerdi: 450 }
				}
			}
		]
	},
	'krystal_prisme_start': {
		titel: "Prismespejlet",
		tekst: "Et massivt lilla prisme kaster en skarp lysstråle skævt ud i rummet. Seks andre krystaller står på sokler. Det er et optisk puslespil.",
		type: 'historie',
		biome: 'krystal',
		valg: [
			{ tekst: "Juster krystallerne", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'krystal_prisme_lys' },
			{ tekst: "Slå en flig af og gå (+20G)", aktionType: 'guld', vaerdi: 20, chance: 1.0 }
		]
	},
	'krystal_prisme_lys': {
		titel: "Fokuspunktet",
		tekst: "Du drejer det sidste prisme. Lysstrålen reflekteres i et lukkede loop og samler sig med enorm varme mod en lukket jerndør.",
		type: 'historie',
		biome: 'krystal',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Håb på at geometrien er præcis", 
				udfald: {
					katastrofe: { log: "Lyset reflekteres direkte i dit ansigt! Du bliver voldsomt forbrændt.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Strålen skyder forbi og antænder din taske. Du taber guld.", aktionType: 'guld', vaerdi: -40 },
					neutral: { log: "Lyset dør langsomt ud. En mekanisk fejl i krystallen.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Lyset brænder låsen væk. Bag døren ligger massiv rigdom.", aktionType: 'guld', vaerdi: 180 },
					mirakel: { log: "Det koncentrerede lys lader dine våben op med rå energi.", aktionType: 'hp', vaerdi: 200 }
				}
			}
		]
	},

	// --- INTELLIGENS: SLAGMARK & BANDIT (Kryptografi og Dirk) ---
	'slagmark_kode_start': {
		titel: "Kryptografen",
		tekst: "I lommen på en falden feltmarskal finder du en stålboks med et kodelås af fem tandhjul. Hans notesbog ligger ved siden af, fyldt med abstrakte skitser.",
		type: 'historie',
		biome: 'slagmark',
		valg: [
			{ tekst: "Forsøg at knække koden", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'slagmark_kode_bryd' },
			{ tekst: "Efterlad boksen", aktionType: 'luk' }
		]
	},
	'slagmark_kode_bryd': {
		titel: "Tumblerne falder",
		tekst: "Mønsteret i bogen peger på stjernebillederne, den nat slaget startede. Du drejer det sidste tandhjul på plads.",
		type: 'historie',
		biome: 'slagmark',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Træk låsen op", 
				udfald: {
					katastrofe: { log: "Det var en falsk kombination! En fjederbelastet klinge hugger fingrene af dig.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "Boksen låser sig selv permanent med et tungt klik.", aktionType: 'guld', vaerdi: 0 },
					neutral: { log: "Boksen åbner. Der ligger kun papir og et par småmønter.", aktionType: 'guld', vaerdi: 25 },
					succes: { log: "Kassen indeholder hærens samlede udbetaling for ugen.", aktionType: 'guld', vaerdi: 180 },
					mirakel: { log: "Udover guld finder du feltmarskallens uvurderlige platin-segl.", aktionType: 'guld', vaerdi: 450 }
				}
			}
		]
	},
	'bandit_pengeskab_start': {
		titel: "Det Tunge Skab",
		tekst: "Banditterne har efterladt et enormt jernskab de ikke kunne få op. Det har en avanceret dværg-lås med syv mekaniske stifter.",
		type: 'historie',
		biome: 'bandit',
		valg: [
			{ tekst: "Find dit dirkeværktøj frem", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'bandit_pengeskab_dirk' },
			{ tekst: "For tungt. Gå videre.", aktionType: 'luk' }
		]
	},
	'bandit_pengeskab_dirk': {
		titel: "Mekanisk Føling",
		tekst: "Du lukker øjnene og stoler rent på den mekaniske feedback i metallet. Stift fire driller voldsomt.",
		type: 'historie',
		biome: 'bandit',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Tving den sidste stift", 
				udfald: {
					katastrofe: { log: "Låsen klemmer dit værktøj og udløser et gasangreb.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Din dirk knækker af inde i låsen. Skabet er ødelagt.", aktionType: 'hp', vaerdi: -10 },
					neutral: { log: "Skabet er åbent, men de forrige ejere har tømt det.", aktionType: 'guld', vaerdi: 0 },
					succes: { log: "Det åbner med et smukt klik. Tyvekosterne er dine.", aktionType: 'guld', vaerdi: 130 },
					mirakel: { log: "Banditterne har stjålet kongens personlige formue.", aktionType: 'guld', vaerdi: 380 }
				}
			}
		]
	},

	// --- INTELLIGENS: SKOV, RITUAL, blodskov & BJERG (Natur og Mystik) ---
	'skov_ugle_start': {
		titel: "Uglens Dom",
		tekst: "En spektral ugle lander lydløst foran dig. Den taler med tusind stemmer: 'Kun den med perfekt hukommelse må passere. Nævn de syv træer du passerede for at nå mig.'",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ tekst: "Fremkald mindet", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'skov_ugle_svar' },
			{ tekst: "Angrib ånden (-15 HP)", aktionType: 'hp', vaerdi: -15, chance: 1.0 }
		]
	},
	'skov_ugle_svar': {
		titel: "Sandhedens Vægt",
		tekst: "Du reciterer de mørke træers navne. Uglen lytter og lægger hovedet på skrå. Dens øjne brænder.",
		type: 'historie',
		biome: 'skov',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Stol på dit sind", 
				udfald: {
					katastrofe: { log: "Du husker forkert. Den flænser dit sind og stjæler din livskraft.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "Din hukommelse svigter. Den skriger og giver dig migræne.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Du ramte plet, men uglen forsvinder i tavshed.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Perfekt erindring. Den taber en pose feguld for dine fødder.", aktionType: 'guld', vaerdi: 100 },
					mirakel: { log: "Dit intellekt er overlegent. Den forærer dig en magisk indsigt.", aktionType: 'hp', vaerdi: 150 }
				}
			}
		]
	},
	'ritual_geometri_start': {
		titel: "Kosmisk Geometri",
		tekst: "En ufærdig runecirkel gløder i jorden. Hvis du kan beregne de manglende streger, kan du høste ritualets energi.",
		type: 'historie',
		biome: 'ritual',
		valg: [
			{ tekst: "Tegn de sidste linjer med blod", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ritual_geometri_tegn' },
			{ tekst: "Forstyr ikke mørk magi", aktionType: 'luk' }
		]
	},
	'ritual_geometri_tegn': {
		titel: "Forbindelsen",
		tekst: "Linjerne formes til en perfekt decagon. Ritualet er nu i balance, og den rå magi søger en modtager.",
		type: 'historie',
		biome: 'ritual',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Absorber energien", 
				udfald: {
					katastrofe: { log: "Din vinkel var en grad forkert! En dæmonisk shockbølge knuser dig.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Cirklen lukker ikke tæt. Energien antænder dit tøj.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Selve cirklen slukkes permanent.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Korrekt geometri. Du absorberer ren healende kraft.", aktionType: 'hp', vaerdi: 75 },
					mirakel: { log: "Dit sind og universet smelter sammen. Ubeskrivelig udødelighed.", aktionType: 'hp', vaerdi: 300 }
				}
			}
		]
	},
	'blodskov_lys_start': {
		titel: "Vildfarelsens Sti",
		tekst: "Svævende, blå lys danser over den dødelige blodskov. De følger et komplekst, matematisk mønster henover mudderhullerne.",
		type: 'historie',
		biome: 'blodskov',
		valg: [
			{ tekst: "Afkod sekvensen og træd frem", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'blodskov_lys_foelg' },
			{ tekst: "Bliv på fast grund", aktionType: 'luk' }
		]
	},
	'blodskov_lys_foelg': {
		titel: "På Tynd Is",
		tekst: "Du følger lysene ved at træde der, hvor de netop har svævet. Fibonacci-sekvensen i praksis. Ét forkert trin og du synker.",
		type: 'kamp',
		biome: 'blodskov',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Træd på det 8. felt", 
				udfald: {
					katastrofe: { log: "Du beregner galt. Mudderet suger dig næsten til døden.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Du synker i til knæene og mister udstyr under kampen op.", aktionType: 'guld', vaerdi: -40 },
					neutral: { log: "Du når over, gennemblødt og træt.", aktionType: 'hp', vaerdi: -10 },
					succes: { log: "En sikker passage frem til en druknet guldtransport.", aktionType: 'guld', vaerdi: 140 },
					mirakel: { log: "Perfekt udførelse. Du finder blodskovens skjulte, tørre skattekammer.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},
	'bjerg_stjerne_start': {
		titel: "Astrolabiet",
		tekst: "Et ældgammelt instrument af messing sidder fastboltet i klippen. Tre ringe med utallige konstellationer skal rettes ind mod himlen.",
		type: 'historie',
		biome: 'bjerg',
		valg: [
			{ tekst: "Brug din viden om astronomi", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'bjerg_stjerne_stil' },
			{ tekst: "Det er bare rustent skrot", aktionType: 'luk' }
		]
	},
	'bjerg_stjerne_stil': {
		titel: "Sfærernes Musik",
		tekst: "Du justerer den yderste ring mod nordstjernen og den inderste mod ekliptika. Det massive bjerg begynder at brumme dybt indefra.",
		type: 'historie',
		biome: 'bjerg',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Lås mekanismen", 
				udfald: {
					katastrofe: { log: "Maskineriet kollapser og kaster tunge messingdele i nakken på dig.", aktionType: 'hp', vaerdi: -75 },
					fiasko: { log: "Tandhjulene låser sig fast og klemmer dine hænder.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Mekanismen ruster fast før noget åbnes.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Klippen deler sig. Ædle metaller åbenbares.", aktionType: 'guld', vaerdi: 160 },
					mirakel: { log: "Bjergtop-templet hæver sig. Du arver en formue samlet over århundreder.", aktionType: 'guld', vaerdi: 500 }
				}
			}
		]
	},
	'mark_korncirkel': {
		titel: "Geometrisk Advarsel",
		tekst: "Marken er lagt ned i et fuldstændigt symmetrisk mønster. De knækkede strå skaber et optisk bedrag, der peger mod et bestemt midtpunkt.",
		type: 'historie',
		biome: 'mark',
		valg: [
			{ 
				tekst: "Regn centret ud og grav", 
				udfald: {
					katastrofe: { log: "Du beregnede forkert. Der lå en sprængfælde fra en svunden tid.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Cirklen gør dig svimmel. Du kaster op og mister kræfter.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Du graver en meter ned og finder intet.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "I det præcise centrum graver du en massiv jernkiste op.", aktionType: 'guld', vaerdi: 110 },
					mirakel: { log: "Mønsteret var et skattekort af meteorit-guld. En uendelig rigdom.", aktionType: 'guld', vaerdi: 380 }
				}
			},
			{ tekst: "Følg bare stien videre", aktionType: 'luk' }
		]
	},
    // --- KAMP: SKOV & RUIN (Nærkampsrytme) ---
	'skov_baghold_start': {
		titel: "en pil i barken",
		tekst: "Et projektil borer sig ind i træstammen en centimeter fra dit ansigt. En massiv mand i ringbrynje træder ud fra krattet med draget sværd.",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ tekst: "Træk dit våben og mød ham", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'skov_baghold_kamp' },
			{ tekst: "Kast sand i øjnene på ham og flygt", aktionType: 'hp', vaerdi: -15, chance: 1.0 }
		]
	},
	'skov_baghold_kamp': {
		titel: "klingens dans",
		tekst: "Han svinger sit våben i en dræbende bue mod din hals. Du skal time din parade perfekt og støde tilbage i hans blottede flanke.",
		type: 'kamp',
		biome: 'skov',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Parér og stik", 
				udfald: {
					katastrofe: { log: "Dit våben knækker under slaget. Han hugger dig dybt i brystet.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Du blokerer hugget, men han sparker dig hårdt i maven.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "I udveksler overfladiske snit. Han trækker sig tilbage.", aktionType: 'hp', vaerdi: -15 },
					succes: { log: "En perfekt afvisning. Din klinge finder hans hjerte.", aktionType: 'guld', vaerdi: 80 },
					mirakel: { log: "Du afvæbner ham i én glidende bevægelse. Han overgiver hele sin formue.", aktionType: 'guld', vaerdi: 250 }
				}
			}
		]
	},
	'ruin_rustning_start': {
		titel: "tomt stål",
		tekst: "En rustning blokerer stien. Den løfter en enorm stridsøkse. Gammel mekanik knirker under det tunge metal.",
		type: 'kamp',
		biome: 'ruin',
		valg: [
			{ tekst: "Gå i offensiven", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ruin_rustning_kamp' },
			{ tekst: "Løb den anden vej", aktionType: 'luk' }
		]
	},
	'ruin_rustning_kamp': {
		titel: "det tunge hug",
		tekst: "Øksen falder med enorm kraft mod dit hoved. Du har et splitsekund til at rulle under hugget og smadre rustningens knæled.",
		type: 'kamp',
		biome: 'ruin',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Rul og knus knæet", 
				udfald: {
					katastrofe: { log: "Du er for langsom. Øksen knuser din skulder.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Metalmassen vælter ned over dig og klemmer luften ud af dine lunger.", aktionType: 'hp', vaerdi: -40 },
					neutral: { log: "Du undviger, men dit modangreb preller af. Den fryser fast.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Metallet splintres. Du plukker en ædelsten fra dens brystplade.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Du afmonterer dens energikerne uskadt. Den pulserer af rå kraft.", aktionType: 'hp', vaerdi: 150 }
				}
			}
		]
	},

	// --- KAMP: blodskov & KRYSTAL (Bæster og Konstruktioner) ---
	'blodskov_monster_start': {
		titel: "vandets vrede",
		tekst: "Mudderet bobler foran dig. Et enormt, skællende krybdyr kaster sig op af vandet med åbent gab.",
		type: 'kamp',
		biome: 'blodskov',
		valg: [
			{ tekst: "Stå fast", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'blodskov_monster_kamp' },
			{ tekst: "Kast et stykke kød og flygt (-20G)", aktionType: 'guld', vaerdi: -20, chance: 1.0 }
		]
	},
	'blodskov_monster_kamp': {
		titel: "kæberne",
		tekst: "Væsenet forsøger at flænse dit ben. Du må bruge dit våben som en kile for at holde kæberne åbne.",
		type: 'kamp',
		biome: 'blodskov',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Spid kæberne fast", 
				udfald: {
					katastrofe: { log: "Den bider lige igennem dit forsvar. Dit ben er flænset.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Kæberne strejfer dig. Bakterierne svækker dig øjeblikkeligt.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "Dyret opgiver og glider tilbage i mørket.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Du driver klingen op i dens hjerne. Skindet er værdifuldt.", aktionType: 'guld', vaerdi: 90 },
					mirakel: { log: "Du finder maveindholdet fyldt med ufordøjede guldmønter.", aktionType: 'guld', vaerdi: 280 }
				}
			}
		]
	},
	'krystal_golem_start': {
		titel: "skårene samles",
		tekst: "Klippegulvet ryster. Lilla krystaller flyver sammen og danner en kantet kæmpe. Den løfter en arm af skarpt glas.",
		type: 'kamp',
		biome: 'krystal',
		valg: [
			{ tekst: "Gør klar til stød", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'krystal_golem_kamp' },
			{ tekst: "Dyk bag en sten og vent", aktionType: 'luk' }
		]
	},
	'krystal_golem_kamp': {
		titel: "det blottede hjerte",
		tekst: "Golemen trækker armen tilbage for at smadre dig. Hendes bryst åbner sig og blotter en glødende kerne.",
		type: 'kamp',
		biome: 'krystal',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Stød mod kernen før den slår", 
				udfald: {
					katastrofe: { log: "Du fejlervider. Krystalnæven knuser dine ribben.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Kernen er for hård. Rekylen senderverer smerte op gennem din arm.", aktionType: 'hp', vaerdi: -40 },
					neutral: { log: "I rammer hinanden. Golemen splintres, du falder bagover.", aktionType: 'hp', vaerdi: -20 },
					succes: { log: "Dit stød knuser kernen totalt. Du samler støvet op.", aktionType: 'guld', vaerdi: 140 },
					mirakel: { log: "Kernen pulserer. Den fusionerer med dit udstyr og giver dig massiv styrke.", aktionType: 'hp', vaerdi: 200 }
				}
			}
		]
	},

	// --- KAMP: BANDIT & BJERG (Beskidte tricks og rovdyr) ---
	'bandit_lejr_start': {
		titel: "bagholdet slår fejl",
		tekst: "Du træder på en tør gren. To mænd med knive springer ud fra deres skjul. De vil have blod.",
		type: 'kamp',
		biome: 'bandit',
		valg: [
			{ tekst: "Mød dem frontalt", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'bandit_lejr_kamp' },
			{ tekst: "Smid en pose guld som afledning (-30G)", aktionType: 'guld', vaerdi: -30, chance: 1.0 }
		]
	},
	'bandit_lejr_kamp': {
		titel: "skyggekampen",
		tekst: "Den første mand stikker efter din mave. Du må bruge hans momentum til at kaste ham ind i hans makker.",
		type: 'kamp',
		biome: 'bandit',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Grib hans arm og drej", 
				udfald: {
					katastrofe: { log: "Kniven finder sit mål. Du mister alvorligt meget blod.", aktionType: 'hp', vaerdi: -75 },
					fiasko: { log: "De overmander dig i et sekund og skærer dig over armen.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "I kæmper i mudderet indtil de trækker sig trætte tilbage.", aktionType: 'hp', vaerdi: -10 },
					succes: { log: "De støder hovederne sammen og falder bevidstløse om. Du tømmer deres lommer.", aktionType: 'guld', vaerdi: 110 },
					mirakel: { log: "Deres lejr er fyldt med stjålne skatte. Du tager det hele.", aktionType: 'guld', vaerdi: 320 }
				}
			}
		]
	},
	'bjerg_rovfugl_start': {
		titel: "skygger fra himlen",
		tekst: "En massiv skygge spærrer for solen. En fugl med et vingefang på fem meter dykker direkte mod dig med udstrakte kløer.",
		type: 'kamp',
		biome: 'bjerg',
		valg: [
			{ tekst: "Stil dig i forsvarsposition", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'bjerg_rovfugl_kamp' },
			{ tekst: "Klem dig ind i en klippespalte", aktionType: 'hp', vaerdi: -5, chance: 1.0 }
		]
	},
	'bjerg_rovfugl_kamp': {
		titel: "kløer mod stål",
		tekst: "Fuglen slår ned. Du må plante fødderne solidt i klippen og støde dit våben opad.",
		type: 'kamp',
		biome: 'bjerg',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Afvent nedslaget og hug", 
				udfald: {
					katastrofe: { log: "Kløerne løfter dig og slipper. Du brækker benene i faldet.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Næbbet flænser din skulder under nedslaget.", aktionType: 'hp', vaerdi: -40 },
					neutral: { log: "Fuglen rammer klippen i stedet for dig og flyver væk.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Du spidder fuglen. Den bærer guld i sin kro.", aktionType: 'guld', vaerdi: 130 },
					mirakel: { log: "Du finder dens rede spækket med sjældne ædelstene.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},

	// --- KAMP: HULE & BY (Kravlende farer og Gyder) ---
	'hule_kravler_start': {
		titel: "mørkets loft",
		tekst: "Små sten falder i dit hår. Du kigger op i kulsort mørke. Noget med mange ben slipper sit tag og falder mod dit ansigt.",
		type: 'kamp',
		biome: 'hule',
		valg: [
			{ tekst: "Kast dig til siden", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'hule_kravler_kamp' },
			{ tekst: "Løb blindt fremad (-15 HP)", aktionType: 'hp', vaerdi: -15, chance: 1.0 }
		]
	},
	'hule_kravler_kamp': {
		titel: "kamp i blinde",
		tekst: "Væsenet lander med et tungt smæld. Det hvæser og hugger ud i mørket med giftige palper.",
		type: 'kamp',
		biome: 'hule',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Slå mod lyden", 
				udfald: {
					katastrofe: { log: "Det sprøjter lammende gift direkte i dit blodomløb.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Du rammer væggen, og væsenet river din hud op.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Du skræmmer det væk med et heldigt slag.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Du knuser dets skjold. Dets organer er værdifulde.", aktionType: 'guld', vaerdi: 95 },
					mirakel: { log: "Væsenets mave er fyldt med stjålne guldmønter fra en svunden ekspedition.", aktionType: 'guld', vaerdi: 270 }
				}
			}
		]
	},
	'by_overfald_start': {
		titel: "tolden",
		tekst: "To silhuetter spærrer gyden bag dig. En trækker en lang kniv. 'Din pung. Vi samler ikke på døde kroppe, men vi gør undtagelser.'",
		type: 'kamp',
		biome: 'by',
		valg: [
			{ tekst: "Løft næverne", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'by_overfald_kamp' },
			{ tekst: "Kast pungen (-80G)", aktionType: 'guld', vaerdi: -80, chance: 1.0 }
		]
	},
	'by_overfald_kamp': {
		titel: "det brækkede håndled",
		tekst: "Manden med kniven stikker lavt mod din mave. Den anden forsøger at gribe dine arme bagfra.",
		type: 'kamp',
		biome: 'by',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Brug angriberen som skjold", 
				udfald: {
					katastrofe: { log: "De fanger dig. Kniven rammer vitale organer.", aktionType: 'hp', vaerdi: -85 },
					fiasko: { log: "Du får et grimt snit og tvinges på flugt.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Du slår kniven ud af hånden på ham. De stikker af.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Kniven rammer makkeren. Du slår dem ud og tager deres guld.", aktionType: 'guld', vaerdi: 120 },
					mirakel: { log: "Du finder lederens skjulte formue i hans støvle.", aktionType: 'guld', vaerdi: 310 }
				}
			}
		]
	},

	// --- KAMP: SLAGMARK & RITUAL (Undead og Fanatikere) ---
	'slagmark_kriger_start': {
		titel: "rustent jern",
		tekst: "Et lig med spiddet brystkasse åbner øjnene. Det trækker sig selv fri af lansen og løfter et tungt slagsværd.",
		type: 'kamp',
		biome: 'slagmark',
		valg: [
			{ tekst: "Gør klar til parade", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'slagmark_kriger_kamp' },
			{ tekst: "Træd forsigtigt tilbage", aktionType: 'luk' }
		]
	},
	'slagmark_kriger_kamp': {
		titel: "det døde hug",
		tekst: "Kroppen bevæger sig ujævnt, men hugget falder med unaturlig, mekanisk kraft. Et direkte træf vil kløve dig.",
		type: 'kamp',
		biome: 'slagmark',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Parér og afkap hovedet", 
				udfald: {
					katastrofe: { log: "Sværdet slår gennem din parade og smadrer dine knogler.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Kroppen kaster sig over dig og bider dig i skulderen.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "Det falder sammen af sig selv efter et par angreb.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Et rent snit fjerner kraniet. Ridderens pung er intakt.", aktionType: 'guld', vaerdi: 150 },
					mirakel: { log: "Den faldne krigers rustning helbreder dig magisk.", aktionType: 'hp', vaerdi: 180 }
				}
			}
		]
	},
	'ritual_vagt_start': {
		titel: "fanatikerens charge",
		tekst: "En kultist i mørke klæder skriger dit navn. Han løber mod dig med to dolke, ligeglad med sit eget forsvar.",
		type: 'kamp',
		biome: 'ritual',
		valg: [
			{ tekst: "Stå fast", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'ritual_vagt_kamp' },
			{ tekst: "Kast din rygsæk og løb", aktionType: 'hp', vaerdi: -10, chance: 1.0 }
		]
	},
	'ritual_vagt_kamp': {
		titel: "indre cirkel",
		tekst: "Han vil ofre sig selv for at dræbe dig. Du skal lade ham komme uhyggeligt tæt på for at ramme hans hals.",
		type: 'kamp',
		biome: 'ritual',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Afvent og hug", 
				udfald: {
					katastrofe: { log: "Han driver begge dolke dybt ind i dit bryst.", aktionType: 'hp', vaerdi: -80 },
					fiasko: { log: "Du dræber ham, men han skærer din arm til blods.", aktionType: 'hp', vaerdi: -30 },
					neutral: { log: "Du slår ham bevidstløs uden en skramme.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Et præcist hug stopper ham øjeblikkeligt. Du tager kultens guld.", aktionType: 'guld', vaerdi: 110 },
					mirakel: { log: "Han bærer kultens offerkasse fyldt med platin.", aktionType: 'guld', vaerdi: 400 }
				}
			}
		]
	},

	// --- KAMP: ALKYMI, KØDSKOV, MARK & ENG (Singulære Encounters) ---
	'alkymi_mutant_start': {
		titel: "knuste glas",
		tekst: "Et forsøgsrør på størrelse med en mand eksploderer. Ud kravler en skabning med knive monteret direkte i underarmene.",
		type: 'kamp',
		biome: 'alkymi',
		valg: [
			{ tekst: "Angrib dens svage punkter", aktionType: 'fortsaet', vaerdi: 0, naesteTrin: 'alkymi_mutant_kamp' },
			{ tekst: "Søg dækning", aktionType: 'luk' }
		]
	},
	'alkymi_mutant_kamp': {
		titel: "rykvise bevægelser",
		tekst: "Skabningen rykker sig frem i stød. Dens angreb er mekaniske, usynkroniserede og svære at læse.",
		type: 'kamp',
		biome: 'alkymi',
		erSubTrin: true,
		valg: [
			{ 
				tekst: "Læs dens mønster og parér", 
				udfald: {
					katastrofe: { log: "Knivene hakker din krop i stumper og stykker.", aktionType: 'hp', vaerdi: -95 },
					fiasko: { log: "Den skærer dig og flygter ud i mørket.", aktionType: 'hp', vaerdi: -35 },
					neutral: { log: "Skabningen falder død om af sine egne sår.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Du adskiller maskinen fra kødet og piller mekanismen for guld.", aktionType: 'guld', vaerdi: 130 },
					mirakel: { log: "Dens indbyggede blodsyntese strømmer over i dig og helbreder dig.", aktionType: 'hp', vaerdi: 200 }
				}
			}
		]
	},
	'alkymi_flaat_kamp': {
		titel: "det røde sug",
		tekst: "En blodflåt på størrelse med en hund falder ned på din ryg og slår tænderne i din rygrad.",
		type: 'kamp',
		biome: 'alkymi',
		valg: [
			{ 
				tekst: "Riv den af og hug den over", 
				udfald: {
					katastrofe: { log: "Den tømmer dig næsten for blod, før du får den af.", aktionType: 'hp', vaerdi: -70 },
					fiasko: { log: "Du river dens hoved af. Tænderne sidder og værker i huden.", aktionType: 'hp', vaerdi: -25 },
					neutral: { log: "Du kvaser den mod et træ. Bare ulækkert.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Den spytter en tidligere eventyrers pung ud da du dræber den.", aktionType: 'guld', vaerdi: 80 },
					mirakel: { log: "Blodet den sprøjter ud, muterer dine muskler positivt.", aktionType: 'hp', vaerdi: 150 }
				}
			}
		]
	},
	'mark_hund_kamp': {
		titel: "glammende tænder",
		tekst: "En syg, frådende hund sprinter gennem kornet direkte mod din strube. Den ignorerer alt for at bide dig.",
		type: 'kamp',
		biome: 'mark',
		valg: [
			{ 
				tekst: "Træd til siden og knæk nakken", 
				udfald: {
					katastrofe: { log: "Hunden bider sig fast og smitter dig med stivkrampe.", aktionType: 'hp', vaerdi: -65 },
					fiasko: { log: "Den flænser dit ben, inden du kvæler den.", aktionType: 'hp', vaerdi: -20 },
					neutral: { log: "Et enkelt, trist drab. Ingenting vundet.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Hunden bar et dyrt guldhalsbånd.", aktionType: 'guld', vaerdi: 75 },
					mirakel: { log: "I hundens halsbånd er indsyet en massiv diamant.", aktionType: 'guld', vaerdi: 250 }
				}
			}
		]
	},
	'eng_ridder_kamp': {
		titel: "den faldne garde",
		tekst: "En ridder i kulsort rustning sidder ved en vejsten. Han trækker sit store sværd. 'Ingen passerer uden kamp.'",
		type: 'kamp',
		biome: 'eng',
		valg: [
			{ 
				tekst: "Kryds klinger med ham", 
				udfald: {
					katastrofe: { log: "Hans evner er overlegne. Han gennemskuer dig og knuser dine ribben.", aktionType: 'hp', vaerdi: -90 },
					fiasko: { log: "Han giver dig et ydmygende og smertefuldt hug og griner.", aktionType: 'hp', vaerdi: -40 },
					neutral: { log: "Han anerkender din styrke og lader dig passere.", aktionType: 'hp', vaerdi: 0 },
					succes: { log: "Du afvæbner ham. Han giver op og kaster sin pung.", aktionType: 'guld', vaerdi: 160 },
					mirakel: { log: "Han kaster sig på sværdet i respekt og overlader hele sin kongelige apanage til dig.", aktionType: 'guld', vaerdi: 500 }
				}
			}
		]
	},
    // --- GÅDER: RUIN & HULE (Ældgamle vogtere) ---
	'ruin_gaade_kort': {
		titel: "Stenens Spørgsmål",
		tekst: "Et udhugget ansigt i muren spærrer stien. Det rasler med stenstøv, da det taler: 'Jeg har byer, men ingen huse. Bjerge, men ingen træer. Vand, men ingen fisk. Hvad er jeg?'",
		type: 'historie',
		biome: 'ruin',
		valg: [
			{ tekst: "Et kort", aktionType: 'guld', vaerdi: 150, chance: 1.0 },
			{ tekst: "Et spejl", aktionType: 'hp', chance: 0.0, failVaerdi: -40 },
			{ tekst: "Et minde", aktionType: 'hp', chance: 0.0, failVaerdi: -40 }
		]
	},
	'ruin_gaade_loeg': {
		titel: "Kryptens Lås",
		tekst: "Døren til gravkammeret har tre knapper. Et skilt lyder: 'Fjern min hud, og jeg græder ikke, men du vil. Hvad er jeg?'",
		type: 'historie',
		biome: 'ruin',
		valg: [
			{ tekst: "Tryk på Slange-symbolet", aktionType: 'hp', chance: 0.0, failVaerdi: -45 },
			{ tekst: "Tryk på Løg-symbolet", aktionType: 'guld', vaerdi: 180, chance: 1.0 },
			{ tekst: "Tryk på Død-symbolet", aktionType: 'hp', chance: 0.0, failVaerdi: -45 }
		]
	},
	'hule_gaade_skygge': {
		titel: "Mørkets Væsen",
		tekst: "En stemme hvisker fra bunden af skakten: 'Jeg lever kun der, hvor der er lys, men dør, hvis lyset skinner direkte på mig. Hvad er jeg?'",
		type: 'historie',
		biome: 'hule',
		valg: [
			{ tekst: "En skygge", aktionType: 'guld', vaerdi: 120, chance: 1.0 },
			{ tekst: "En vampyr", aktionType: 'hp', chance: 0.0, failVaerdi: -35 },
			{ tekst: "En isterning", aktionType: 'hp', chance: 0.0, failVaerdi: -35 }
		]
	},
	'hule_gaade_haandklaede': {
		titel: "Den Blinde Orakel",
		tekst: "En blind heks spærrer udgangen. 'Svar mig dette, rejsende: Hvad bliver vådere, jo mere det tørrer?'",
		type: 'historie',
		biome: 'hule',
		valg: [
			{ tekst: "Et håndklæde", aktionType: 'hp', vaerdi: 40, chance: 1.0 },
			{ tekst: "En svamp", aktionType: 'hp', chance: 0.0, failVaerdi: -30 },
			{ tekst: "Tårer", aktionType: 'hp', chance: 0.0, failVaerdi: -30 }
		]
	},

	// --- GÅDER: SKOV & BLODSKOV (Naturens hemmeligheder) ---
	'skov_gaade_fodspor': {
		titel: "Skovens Hvisken",
		tekst: "Træernes grene bøjer sig ned og danner en mur. Vinden hvisker: 'Jo mere du tager, jo mere efterlader du bag dig. Hvad er jeg?'",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ tekst: "Tid", aktionType: 'hp', chance: 0.0, failVaerdi: -30 },
			{ tekst: "Fodspor", aktionType: 'guld', vaerdi: 100, chance: 1.0 },
			{ tekst: "Minder", aktionType: 'hp', chance: 0.0, failVaerdi: -30 }
		]
	},
	'skov_gaade_bog': {
		titel: "Skovridderens Gemmested",
		tekst: "En kiste af massivt egetræ har et indgraveret spørgsmål: 'Hvad har blade, men ingen grene, og ord, men ingen stemme?'",
		type: 'historie',
		biome: 'skov',
		valg: [
			{ tekst: "En bog", aktionType: 'guld', vaerdi: 140, chance: 1.0 },
			{ tekst: "Vinden", aktionType: 'hp', chance: 0.0, failVaerdi: -25 },
			{ tekst: "En papegøje", aktionType: 'hp', chance: 0.0, failVaerdi: -25 }
		]
	},
	'blodskov_gaade_vejr': {
		titel: "Det Blødende Egetræ",
		tekst: "Et enormt træ drypper med rød saft. En indskrift i barken lyder: 'Hvad er let som en fjer, men selv den stærkeste kæmpe kan ikke holde det længe?'",
		type: 'historie',
		biome: 'blodskov',
		valg: [
			{ tekst: "Et løfte", aktionType: 'hp', chance: 0.0, failVaerdi: -50 },
			{ tekst: "Smerten", aktionType: 'hp', chance: 0.0, failVaerdi: -50 },
			{ tekst: "Åndedrættet", aktionType: 'hp', vaerdi: 50, chance: 1.0 }
		]
	},

	// --- GÅDER: BJERG & KRYSTAL (Elementerne) ---
	'bjerg_gaade_vind': {
		titel: "Vindens Vogter",
		tekst: "En statue af is blokerer paset. Den brummer dybt: 'Jeg har ingen stemme, men jeg græder. Ingen vinger, men jeg flyver. Hvad er jeg?'",
		type: 'historie',
		biome: 'bjerg',
		valg: [
			{ tekst: "En sky", aktionType: 'hp', chance: 0.0, failVaerdi: -40 },
			{ tekst: "Vinden", aktionType: 'guld', vaerdi: 160, chance: 1.0 },
			{ tekst: "En dæmon", aktionType: 'hp', chance: 0.0, failVaerdi: -40 }
		]
	},
	'bjerg_gaade_naal': {
		titel: "Eremittens Krav",
		tekst: "En gal gammel mand nægter at flytte sig fra rebstigen. 'Svar rigtigt, ellers skærer jeg rebet! Jeg har ét øje, men kan ikke se. Hvad er jeg?'",
		type: 'historie',
		biome: 'bjerg',
		valg: [
			{ tekst: "En cyklop", aktionType: 'hp', chance: 0.0, failVaerdi: -35 },
			{ tekst: "En nål", aktionType: 'guld', vaerdi: 80, chance: 1.0 },
			{ tekst: "En storm", aktionType: 'hp', chance: 0.0, failVaerdi: -35 }
		]
	},
	'krystal_gaade_ild': {
		titel: "Det Knuste Prisme",
		tekst: "En pulserende krystal danner ord i dit sind: 'Jeg er altid sulten. Den finger jeg slikker, bliver hurtigt rød. Hvad er jeg?'",
		type: 'historie',
		biome: 'krystal',
		valg: [
			{ tekst: "Ilden", aktionType: 'guld', vaerdi: 200, chance: 1.0 },
			{ tekst: "Grådighed", aktionType: 'hp', chance: 0.0, failVaerdi: -45 },
			{ tekst: "En klinge", aktionType: 'hp', chance: 0.0, failVaerdi: -45 }
		]
	},
	'krystal_gaade_albue': {
		titel: "Spejl-labyrinten",
		tekst: "Du er fanget i et spejlkammer. En skrift på glasset lyder: 'Hvad kan du holde i din højre hånd, men aldrig nogensinde i din venstre?'",
		type: 'historie',
		biome: 'krystal',
		valg: [
			{ tekst: "Din venstre albue", aktionType: 'guld', vaerdi: 130, chance: 1.0 },
			{ tekst: "Dit eget hjerte", aktionType: 'hp', chance: 0.0, failVaerdi: -30 },
			{ tekst: "Fremtiden", aktionType: 'hp', chance: 0.0, failVaerdi: -30 }
		]
	},

	// --- GÅDER: ALKYMI & RITUAL (Videnskab og Okkultisme) ---
	'alkymi_gaade_tid': {
		titel: "Homunculus' Spørgsmål",
		tekst: "Et skabning af syet kød holder nøglen til kemikalieskabet. 'Jeg sluger bjerge, ruster stål og dræber konger. Nævn mit navn.'",
		type: 'historie',
		biome: 'alkymi',
		valg: [
			{ tekst: "Syre", aktionType: 'hp', chance: 0.0, failVaerdi: -50 },
			{ tekst: "Tiden", aktionType: 'guld', vaerdi: 180, chance: 1.0 },
			{ tekst: "Døden", aktionType: 'hp', chance: 0.0, failVaerdi: -50 }
		]
	},
	'alkymi_gaade_vej': {
		titel: "Navigatørens Lås",
		tekst: "For at åbne porten til laboratoriets indre, må du trykke på det rette symbol: 'Hvad går gennem byer og bjerge, men bevæger sig aldrig?'",
		type: 'historie',
		biome: 'alkymi',
		valg: [
			{ tekst: "Vinden", aktionType: 'hp', chance: 0.0, failVaerdi: -40 },
			{ tekst: "En vej", aktionType: 'guld', vaerdi: 140, chance: 1.0 },
			{ tekst: "Solen", aktionType: 'hp', chance: 0.0, failVaerdi: -40 }
		]
	},
	'ritual_gaade_loefte': {
		titel: "Alterets Tørst",
		tekst: "Præsten holder kniven mod din strube. 'Svar mig dette: Hvad kan ikke holdes, før den er givet?'",
		type: 'historie',
		biome: 'ritual',
		valg: [
			{ tekst: "En hemmelighed", aktionType: 'hp', chance: 0.0, failVaerdi: -45 },
			{ tekst: "Et løfte", aktionType: 'hp', vaerdi: 60, chance: 1.0 },
			{ tekst: "Smerte", aktionType: 'hp', chance: 0.0, failVaerdi: -45 }
		]
	},
	'ritual_gaade_kam': {
		titel: "Kultens Test",
		tekst: "De maskerede mænd vil se, om du har sindet til at overleve mørket. 'Hvad har mange tænder, men kan ikke bide?'",
		type: 'historie',
		biome: 'ritual',
		valg: [
			{ tekst: "En dæmon", aktionType: 'hp', chance: 0.0, failVaerdi: -35 },
			{ tekst: "En sav", aktionType: 'hp', chance: 0.0, failVaerdi: -35 },
			{ tekst: "En kam", aktionType: 'guld', vaerdi: 90, chance: 1.0 }
		]
	},

	// --- GÅDER: BY, MARKED & BANDIT (Samfundets svindlere) ---
	'by_gaade_navn': {
		titel: "Tiggerens Pris",
		tekst: "En snavset mand vil sælge dig et stjålet skattekort. 'Jeg giver dig det gratis, hvis du ved: Hvad tilhører dig, men bruges mest af andre?'",
		type: 'historie',
		biome: 'by',
		valg: [
			{ tekst: "Mine penge", aktionType: 'hp', chance: 0.0, failVaerdi: -20 },
			{ tekst: "Mit navn", aktionType: 'guld', vaerdi: 100, chance: 1.0 },
			{ tekst: "Min tid", aktionType: 'hp', chance: 0.0, failVaerdi: -20 }
		]
	},
	'by_gaade_lys': {
		titel: "Krofatters Veddemål",
		tekst: "Kroejeren sætter en flaske dyr vin på bordet. 'Gæt den, og flasken er din: Jeg er høj, når jeg er ung, og kort, når jeg er gammel.'",
		type: 'historie',
		biome: 'by',
		valg: [
			{ tekst: "Et stearinlys", aktionType: 'hp', vaerdi: 30, chance: 1.0 }, // Vin heler dig
			{ tekst: "Et menneske", aktionType: 'guld', vaerdi: -20, chance: 0.0, failVaerdi: -20 },
			{ tekst: "Et træ", aktionType: 'guld', vaerdi: -20, chance: 0.0, failVaerdi: -20 }
		]
	},
	'marked_gaade_moerke': {
		titel: "Svindlerens Lås",
		tekst: "En låsesmed sælger en kiste med ukendt indhold. Han griner: 'Koden er svaret: Jo mere der er af det, jo mindre kan du se.'",
		type: 'historie',
		biome: 'marked',
		valg: [
			{ tekst: "Tåge", aktionType: 'hp', chance: 0.0, failVaerdi: -30 },
			{ tekst: "Mørke", aktionType: 'guld', vaerdi: 130, chance: 1.0 },
			{ tekst: "Røg", aktionType: 'hp', chance: 0.0, failVaerdi: -30 }
		]
	},
	'marked_gaade_aeg': {
		titel: "Gamblerens Tilbud",
		tekst: "En mand med guldringe på fingrene smiler til dig. 'Hvad skal brydes, før du kan bruge det?'",
		type: 'historie',
		biome: 'marked',
		valg: [
			{ tekst: "Et løfte", aktionType: 'guld', vaerdi: -30, chance: 0.0, failVaerdi: -30 },
			{ tekst: "Et æg", aktionType: 'guld', vaerdi: 80, chance: 1.0 },
			{ tekst: "En forbandelse", aktionType: 'guld', vaerdi: -30, chance: 0.0, failVaerdi: -30 }
		]
	},
	'bandit_gaade_moent': {
		titel: "Landevejsrøverens Told",
		tekst: "Banditlederen smiler, mens hans mænd omringer dig. 'Hvis du gætter, hvad jeg har i lommen, lader vi dig gå. Den har hoved og hale, men ingen krop.'",
		type: 'kamp',
		biome: 'bandit',
		valg: [
			{ tekst: "En slange", aktionType: 'hp', chance: 0.0, failVaerdi: -50 },
			{ tekst: "En guldmønt", aktionType: 'hp', vaerdi: 0, chance: 1.0, naesteTrin: undefined }, // Slipper uskadt
			{ tekst: "En pil", aktionType: 'hp', chance: 0.0, failVaerdi: -50 }
		]
	},
	'bandit_gaade_alder': {
		titel: "Smuglerens Kodeord",
		tekst: "Du banker på kælderdøren. 'Hvad går op, men kommer aldrig ned?' brummer en rå stemme fra den anden side.",
		type: 'historie',
		biome: 'bandit',
		valg: [
			{ tekst: "Din alder", aktionType: 'guld', vaerdi: 150, chance: 1.0 }, // Får adgang til lageret
			{ tekst: "En fugl", aktionType: 'hp', chance: 0.0, failVaerdi: -35 }, // En pil gennem døren
			{ tekst: "Røgen", aktionType: 'hp', chance: 0.0, failVaerdi: -35 }
		]
	},

	// --- GÅDER: SLAGMARK, ENG & MARK (Krig og landbrug) ---
	'slagmark_gaade_falsk': {
		titel: "Den Døde Kasserer",
		tekst: "En dræbt kasserer holder et kodelås på krigskassen. Skiltet siger: 'Den der laver mig, fortæller det ikke. Den der tager mig, kender mig ikke.'",
		type: 'historie',
		biome: 'slagmark',
		valg: [
			{ tekst: "Sygdom", aktionType: 'hp', chance: 0.0, failVaerdi: -40 },
			{ tekst: "Falske mønter", aktionType: 'guld', vaerdi: 200, chance: 1.0 },
			{ tekst: "Døden", aktionType: 'hp', chance: 0.0, failVaerdi: -40 }
		]
	},
	'slagmark_gaade_imorgen': {
		titel: "Spøgelsets Vagt",
		tekst: "En spektral soldat nægter at forlade sin post. 'Jeg venter på noget, der altid er på vej, men aldrig ankommer. Hvad er det?'",
		type: 'historie',
		biome: 'slagmark',
		valg: [
			{ tekst: "Forstærkninger", aktionType: 'hp', chance: 0.0, failVaerdi: -45 },
			{ tekst: "Døden", aktionType: 'hp', chance: 0.0, failVaerdi: -45 },
			{ tekst: "I morgen", aktionType: 'guld', vaerdi: 140, chance: 1.0 }
		]
	},
	'eng_gaade_skjorte': {
		titel: "Feernes Cirkel",
		tekst: "Du træder ind i en ring af svampe. En barnlig stemme kvidrer: 'Jeg har en hals, men intet hoved. To arme, men ingen hænder. Hvad er jeg?'",
		type: 'historie',
		biome: 'eng',
		valg: [
			{ tekst: "Et træ", aktionType: 'hp', chance: 0.0, failVaerdi: -25 },
			{ tekst: "En trøje", aktionType: 'hp', vaerdi: 40, chance: 1.0 }, // Feerne heler dig
			{ tekst: "En bjørn", aktionType: 'hp', chance: 0.0, failVaerdi: -25 }
		]
	},
	'mark_gaade_ingenting': {
		titel: "Fugleskræmslets Tale",
		tekst: "Et dæmonisk fugleskræmsel drejer sit græskarhoved mod dig. 'Fattige har det. Rige mangler det. Spiser du det, dør du. Svar, ellers stikker jeg.'",
		type: 'kamp',
		biome: 'mark',
		valg: [
			{ tekst: "Gift", aktionType: 'hp', chance: 0.0, failVaerdi: -40 },
			{ tekst: "Ingenting", aktionType: 'guld', vaerdi: 90, chance: 1.0 },
			{ tekst: "Sult", aktionType: 'hp', chance: 0.0, failVaerdi: -40 }
		]
	}
};