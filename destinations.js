/*
  destinations.js — Curated destination database for the FriendlyFlights Planner.
  Each entry: { code, city, country, flag, region, tags[], vibe, emoji, popularity }
  popularity: 1 = hidden gem · 2 = popular · 3 = iconic
*/

/* global */ var DESTINATIONS = [

  // ── Spain ──────────────────────────────────────────────────────
  { code:'BCN', city:'Barcelona',    country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','culture','nightlife','food'],    vibe:'Beach & Culture',     emoji:'🌊', popularity:3 },
  { code:'MAD', city:'Madrid',       country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['culture','nightlife','food','art'],       vibe:'City & Culture',      emoji:'🎭', popularity:3 },
  { code:'PMI', city:'Mallorca',     country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','party','nightlife'],              vibe:'Beach & Party',       emoji:'🏖️', popularity:3 },
  { code:'IBZ', city:'Ibiza',        country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','party','nightlife'],              vibe:'Party Island',        emoji:'🎉', popularity:3 },
  { code:'AGP', city:'Málaga',       country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','culture','food'],                 vibe:'Beach & Culture',     emoji:'☀️', popularity:2 },
  { code:'SVQ', city:'Sevilla',      country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['culture','food','history','romantic'],    vibe:'Culture & History',   emoji:'💃', popularity:2 },
  { code:'VLC', city:'Valencia',     country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','food','culture'],                 vibe:'Beach & Food',        emoji:'🥘', popularity:2 },
  { code:'ACE', city:'Lanzarote',    country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','nature'],                         vibe:'Volcanic Island',     emoji:'🌋', popularity:2 },
  { code:'TFS', city:'Tenerife',     country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','party','nature'],                 vibe:'Island Vibes',        emoji:'🌴', popularity:3 },
  { code:'LPA', city:'Gran Canaria', country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','party'],                          vibe:'Sun & Beach',         emoji:'🌞', popularity:2 },
  { code:'FUE', city:'Fuerteventura',country:'Spain',    flag:'🇪🇸', region:'Southern Europe', tags:['beach','nature','kite'],                  vibe:'Wind & Waves',        emoji:'🏄', popularity:2 },

  // ── Portugal ───────────────────────────────────────────────────
  { code:'LIS', city:'Lisbon',       country:'Portugal', flag:'🇵🇹', region:'Southern Europe', tags:['culture','food','nightlife','romantic'],  vibe:'Culture & Vibes',     emoji:'🛤️', popularity:3 },
  { code:'OPO', city:'Porto',        country:'Portugal', flag:'🇵🇹', region:'Southern Europe', tags:['culture','food','romantic','wine'],       vibe:'Wine & Culture',      emoji:'🍷', popularity:2 },
  { code:'FAO', city:'Algarve',      country:'Portugal', flag:'🇵🇹', region:'Southern Europe', tags:['beach','golf','nature'],                  vibe:'Beach & Golf',        emoji:'⛳', popularity:2 },

  // ── Italy ──────────────────────────────────────────────────────
  { code:'FCO', city:'Rome',         country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['culture','history','food','art','romantic'], vibe:'Culture & History', emoji:'🏛️', popularity:3 },
  { code:'MXP', city:'Milan',        country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['culture','nightlife','shopping','food'],  vibe:'Fashion & Culture',   emoji:'👗', popularity:3 },
  { code:'VCE', city:'Venice',       country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['romantic','culture','history'],           vibe:'Romantic Escape',     emoji:'🚤', popularity:3 },
  { code:'NAP', city:'Naples',       country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['food','culture','history'],               vibe:'Food & History',      emoji:'🍕', popularity:2 },
  { code:'PSA', city:'Pisa',         country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['culture','history'],                      vibe:'Day Trip Classic',    emoji:'🗼', popularity:2 },
  { code:'BLQ', city:'Bologna',      country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['food','culture'],                         vibe:'Food Capital',        emoji:'🍝', popularity:1 },
  { code:'CTA', city:'Catania',      country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['beach','food','nature'],                  vibe:'Sicily & Etna',       emoji:'🌋', popularity:1 },
  { code:'FLR', city:'Florence',     country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['art','culture','romantic','history'],     vibe:'Art & Romance',       emoji:'🎨', popularity:3 },
  { code:'PMO', city:'Palermo',      country:'Italy',    flag:'🇮🇹', region:'Southern Europe', tags:['beach','food','culture'],                 vibe:'Hidden Sicily',       emoji:'🌊', popularity:1 },

  // ── Greece ─────────────────────────────────────────────────────
  { code:'ATH', city:'Athens',       country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['culture','history','food','nightlife'],  vibe:'History & Life',      emoji:'🏛️', popularity:3 },
  { code:'HER', city:'Heraklion',    country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['beach','culture','history'],             vibe:'Crete & History',     emoji:'🌊', popularity:2 },
  { code:'CFU', city:'Corfu',        country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['beach','nature','romantic'],             vibe:'Green Island',        emoji:'🫒', popularity:2 },
  { code:'RHO', city:'Rhodes',       country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['beach','culture','history'],             vibe:'Sun & History',       emoji:'☀️', popularity:2 },
  { code:'JMK', city:'Mykonos',      country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['beach','party','nightlife'],             vibe:'Island Party',        emoji:'🎉', popularity:2 },
  { code:'JTR', city:'Santorini',    country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['romantic','beach','wine'],               vibe:'Most Romantic',       emoji:'💑', popularity:3 },
  { code:'SKG', city:'Thessaloniki', country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['food','culture','nightlife'],            vibe:'Greek Hidden Gem',    emoji:'🍢', popularity:1 },
  { code:'ZTH', city:'Zakynthos',    country:'Greece',   flag:'🇬🇷', region:'Southern Europe', tags:['beach','nature'],                        vibe:'Shipwreck Beach',     emoji:'⛵', popularity:2 },

  // ── Croatia ────────────────────────────────────────────────────
  { code:'DBV', city:'Dubrovnik',    country:'Croatia',  flag:'🇭🇷', region:'Southern Europe', tags:['beach','culture','history'],             vibe:'Medieval Coast',      emoji:'🏰', popularity:3 },
  { code:'SPU', city:'Split',        country:'Croatia',  flag:'🇭🇷', region:'Southern Europe', tags:['beach','culture','nightlife'],           vibe:'Beach & History',     emoji:'🌊', popularity:2 },
  { code:'ZAG', city:'Zagreb',       country:'Croatia',  flag:'🇭🇷', region:'Central Europe',  tags:['culture','food'],                        vibe:'Underrated Capital',  emoji:'🏙️', popularity:1 },

  // ── Turkey ─────────────────────────────────────────────────────
  { code:'IST', city:'Istanbul',     country:'Turkey',   flag:'🇹🇷', region:'Southern Europe', tags:['culture','food','shopping','history'],   vibe:'East meets West',     emoji:'🕌', popularity:3 },
  { code:'ADB', city:'Izmir',        country:'Turkey',   flag:'🇹🇷', region:'Southern Europe', tags:['beach','culture','food'],                vibe:'Turkish Riviera',     emoji:'🌊', popularity:1 },
  { code:'AYT', city:'Antalya',      country:'Turkey',   flag:'🇹🇷', region:'Southern Europe', tags:['beach','resort'],                        vibe:'All-Inclusive Sun',   emoji:'🏖️', popularity:2 },

  // ── Morocco ────────────────────────────────────────────────────
  { code:'RAK', city:'Marrakech',    country:'Morocco',  flag:'🇲🇦', region:'North Africa',    tags:['culture','food','shopping','romantic'],  vibe:'Exotic & Vibrant',    emoji:'🌺', popularity:2 },
  { code:'CMN', city:'Casablanca',   country:'Morocco',  flag:'🇲🇦', region:'North Africa',    tags:['culture','history'],                     vibe:'Gateway to Morocco',  emoji:'🕌', popularity:1 },
  { code:'TNG', city:'Tangier',      country:'Morocco',  flag:'🇲🇦', region:'North Africa',    tags:['culture','beach'],                       vibe:'Strait Crossroads',   emoji:'🏺', popularity:1 },

  // ── France ─────────────────────────────────────────────────────
  { code:'CDG', city:'Paris',        country:'France',   flag:'🇫🇷', region:'Western Europe',  tags:['romantic','culture','food','art','shopping'], vibe:'City of Love',   emoji:'🗼', popularity:3 },
  { code:'NCE', city:'Nice',         country:'France',   flag:'🇫🇷', region:'Western Europe',  tags:['beach','culture','romantic'],            vibe:'French Riviera',      emoji:'💎', popularity:2 },
  { code:'MRS', city:'Marseille',    country:'France',   flag:'🇫🇷', region:'Western Europe',  tags:['beach','food','culture'],                vibe:'Raw & Authentic',     emoji:'⚓', popularity:1 },
  { code:'BOD', city:'Bordeaux',     country:'France',   flag:'🇫🇷', region:'Western Europe',  tags:['wine','food','culture'],                 vibe:'Wine Capital',        emoji:'🍷', popularity:1 },
  { code:'LYS', city:'Lyon',         country:'France',   flag:'🇫🇷', region:'Western Europe',  tags:['food','culture'],                        vibe:'Gastronomy Capital',  emoji:'🍽️', popularity:1 },

  // ── Netherlands & Belgium ──────────────────────────────────────
  { code:'AMS', city:'Amsterdam',    country:'Netherlands',flag:'🇳🇱',region:'Western Europe', tags:['culture','nightlife','romantic','cycling'], vibe:'Canals & Culture',  emoji:'🚲', popularity:3 },
  { code:'BRU', city:'Brussels',     country:'Belgium',  flag:'🇧🇪', region:'Western Europe',  tags:['food','culture','history'],              vibe:'Beer & Waffles',      emoji:'🧇', popularity:2 },

  // ── Germany ────────────────────────────────────────────────────
  { code:'BER', city:'Berlin',       country:'Germany',  flag:'🇩🇪', region:'Western Europe',  tags:['culture','nightlife','art','history'],   vibe:'Arts & Nightlife',    emoji:'🐻', popularity:3 },
  { code:'MUC', city:'Munich',       country:'Germany',  flag:'🇩🇪', region:'Western Europe',  tags:['culture','beer','nature','ski'],         vibe:'Beer & Alps',         emoji:'🍻', popularity:3 },
  { code:'HAM', city:'Hamburg',      country:'Germany',  flag:'🇩🇪', region:'Western Europe',  tags:['culture','nightlife','food'],            vibe:'Port City',           emoji:'⚓', popularity:1 },
  { code:'CGN', city:'Cologne',      country:'Germany',  flag:'🇩🇪', region:'Western Europe',  tags:['culture','history'],                     vibe:'Cathedral City',      emoji:'⛪', popularity:1 },

  // ── Switzerland & Austria ──────────────────────────────────────
  { code:'ZRH', city:'Zurich',       country:'Switzerland',flag:'🇨🇭',region:'Western Europe', tags:['nature','culture','ski','shopping'],     vibe:'Alps & Luxury',       emoji:'🏔️', popularity:2 },
  { code:'GVA', city:'Geneva',       country:'Switzerland',flag:'🇨🇭',region:'Western Europe', tags:['nature','culture','ski'],               vibe:'Lake & Mountains',    emoji:'⛰️', popularity:2 },
  { code:'VIE', city:'Vienna',       country:'Austria',  flag:'🇦🇹', region:'Central Europe',  tags:['culture','music','romantic','history'],  vibe:'Classical Europe',    emoji:'🎻', popularity:3 },
  { code:'SZG', city:'Salzburg',     country:'Austria',  flag:'🇦🇹', region:'Central Europe',  tags:['culture','music','ski','history'],       vibe:'Mozart & Music',      emoji:'🎵', popularity:2 },

  // ── Central Europe ─────────────────────────────────────────────
  { code:'PRG', city:'Prague',       country:'Czech Rep.',flag:'🇨🇿',region:'Central Europe',  tags:['culture','nightlife','history','romantic'], vibe:'Medieval Party',    emoji:'🏰', popularity:3 },
  { code:'BUD', city:'Budapest',     country:'Hungary',  flag:'🇭🇺', region:'Central Europe',  tags:['culture','nightlife','history','romantic'], vibe:'Pearl of Danube',   emoji:'🛁', popularity:3 },
  { code:'WAW', city:'Warsaw',       country:'Poland',   flag:'🇵🇱', region:'Central Europe',  tags:['culture','history','nightlife'],         vibe:'Rising Capital',      emoji:'🦅', popularity:2 },
  { code:'KRK', city:'Kraków',       country:'Poland',   flag:'🇵🇱', region:'Central Europe',  tags:['culture','history','nightlife'],         vibe:'Medieval Gem',        emoji:'👑', popularity:2 },
  { code:'GDN', city:'Gdańsk',       country:'Poland',   flag:'🇵🇱', region:'Central Europe',  tags:['culture','history','beach'],             vibe:'Baltic Hanseatic',    emoji:'⚓', popularity:1 },

  // ── Scandinavia & Baltics ──────────────────────────────────────
  { code:'CPH', city:'Copenhagen',   country:'Denmark',  flag:'🇩🇰', region:'Northern Europe', tags:['culture','food','design'],               vibe:'Hygge & Design',      emoji:'🧜', popularity:2 },
  { code:'ARN', city:'Stockholm',    country:'Sweden',   flag:'🇸🇪', region:'Northern Europe', tags:['culture','nature','design'],             vibe:'Scandinavian Cool',   emoji:'👑', popularity:2 },
  { code:'OSL', city:'Oslo',         country:'Norway',   flag:'🇳🇴', region:'Northern Europe', tags:['nature','culture','skiing'],             vibe:'Fjords & Nature',     emoji:'🛶', popularity:2 },
  { code:'HEL', city:'Helsinki',     country:'Finland',  flag:'🇫🇮', region:'Northern Europe', tags:['design','culture','sauna','nature'],     vibe:'Nordic Tranquil',     emoji:'🧖', popularity:1 },
  { code:'KEF', city:'Reykjavik',    country:'Iceland',  flag:'🇮🇸', region:'Northern Europe', tags:['nature','aurora','adventure'],           vibe:'Otherworldly Nature', emoji:'🌌', popularity:2 },
  { code:'RIX', city:'Riga',         country:'Latvia',   flag:'🇱🇻', region:'Eastern Europe',  tags:['culture','nightlife','history'],         vibe:'Baltic Beauty',       emoji:'🌲', popularity:1 },
  { code:'TLL', city:'Tallinn',      country:'Estonia',  flag:'🇪🇪', region:'Eastern Europe',  tags:['culture','history','nightlife'],         vibe:'Medieval Fairy Tale', emoji:'🏰', popularity:1 },

  // ── Balkans & Eastern Europe ───────────────────────────────────
  { code:'BEG', city:'Belgrade',     country:'Serbia',   flag:'🇷🇸', region:'Eastern Europe',  tags:['nightlife','culture','food'],            vibe:'Balkan Nightlife',    emoji:'🎶', popularity:1 },
  { code:'SOF', city:'Sofia',        country:'Bulgaria', flag:'🇧🇬', region:'Eastern Europe',  tags:['culture','history','ski'],               vibe:'Hidden Gem',          emoji:'🌹', popularity:1 },
  { code:'OTP', city:'Bucharest',    country:'Romania',  flag:'🇷🇴', region:'Eastern Europe',  tags:['nightlife','culture'],                   vibe:'Party & Culture',     emoji:'🦢', popularity:1 },
  { code:'VNO', city:'Vilnius',      country:'Lithuania',flag:'🇱🇹', region:'Eastern Europe',  tags:['culture','history'],                     vibe:'Baroque Gem',         emoji:'🌿', popularity:1 },

  // ── UK & Ireland ──────────────────────────────────────────────
  { code:'DUB', city:'Dublin',       country:'Ireland',  flag:'🇮🇪', region:'Western Europe',  tags:['culture','nightlife','pub','music'],     vibe:'Pub & Craic',         emoji:'🍀', popularity:2 },
  { code:'EDI', city:'Edinburgh',    country:'UK',       flag:'🇬🇧', region:'Western Europe',  tags:['culture','history','nature'],            vibe:'Castles & Highlands', emoji:'🏰', popularity:2 },
  { code:'LHR', city:'London',       country:'UK',       flag:'🇬🇧', region:'Western Europe',  tags:['culture','nightlife','food','art','shopping'], vibe:'World Capital',  emoji:'🎡', popularity:3 },

  // ── Middle East & Long-Haul ────────────────────────────────────
  { code:'DXB', city:'Dubai',        country:'UAE',      flag:'🇦🇪', region:'Middle East',     tags:['shopping','luxury','beach'],             vibe:'Ultra-Modern Luxury', emoji:'🏙️', popularity:3 },
  { code:'JFK', city:'New York',     country:'USA',      flag:'🇺🇸', region:'Americas',        tags:['culture','nightlife','food','art'],       vibe:'The Big Apple',       emoji:'🗽', popularity:3 },
  { code:'MIA', city:'Miami',        country:'USA',      flag:'🇺🇸', region:'Americas',        tags:['beach','nightlife','food'],              vibe:'Sun & Nightlife',     emoji:'🌴', popularity:2 },
  { code:'GRU', city:'São Paulo',    country:'Brazil',   flag:'🇧🇷', region:'Americas',        tags:['culture','nightlife','food'],            vibe:'Megacity Energy',     emoji:'🎺', popularity:2 },
  { code:'EZE', city:'Buenos Aires', country:'Argentina',flag:'🇦🇷', region:'Americas',        tags:['culture','food','nightlife','tango'],    vibe:'Tango & Steak',       emoji:'💃', popularity:2 },
  { code:'NRT', city:'Tokyo',        country:'Japan',    flag:'🇯🇵', region:'Asia',            tags:['culture','food','shopping','tech'],       vibe:'Future & Tradition',  emoji:'🌸', popularity:3 },
  { code:'SIN', city:'Singapore',    country:'Singapore',flag:'🇸🇬', region:'Asia',            tags:['food','shopping','culture','modern'],    vibe:'Clean & Cosmopolitan',emoji:'🦁', popularity:3 },
  { code:'BKK', city:'Bangkok',      country:'Thailand', flag:'🇹🇭', region:'Asia',            tags:['culture','food','nightlife','temples'],  vibe:'Vibrant & Cheap',     emoji:'🛕', popularity:3 },
  { code:'HKG', city:'Hong Kong',    country:'Hong Kong',flag:'🇭🇰', region:'Asia',            tags:['food','culture','shopping','nightlife'], vibe:'East-meets-West',     emoji:'🥟', popularity:3 },
  { code:'ICN', city:'Seoul',        country:'South Korea',flag:'🇰🇷',region:'Asia',           tags:['food','culture','nightlife','shopping','tech'], vibe:'K-Pop & Cuisine', emoji:'🎤', popularity:3 },
  { code:'HKT', city:'Phuket',       country:'Thailand', flag:'🇹🇭', region:'Asia',            tags:['beach','party','nature','food'],         vibe:'Tropical Beach Party',emoji:'🏝️', popularity:3 },
  { code:'DPS', city:'Bali',         country:'Indonesia',flag:'🇮🇩', region:'Asia',            tags:['beach','nature','culture','romantic'],   vibe:'Island Paradise',     emoji:'🌺', popularity:3 },
  { code:'KUL', city:'Kuala Lumpur', country:'Malaysia', flag:'🇲🇾', region:'Asia',            tags:['food','shopping','culture','modern'],    vibe:'Skyline & Street Food',emoji:'🏙️', popularity:2 },

  // ── More Middle East ──────────────────────────────────────────
  { code:'DOH', city:'Doha',         country:'Qatar',    flag:'🇶🇦', region:'Middle East',     tags:['luxury','shopping','culture','modern'],  vibe:'Modern Arabia',       emoji:'🕌', popularity:2 },
  { code:'AUH', city:'Abu Dhabi',    country:'UAE',      flag:'🇦🇪', region:'Middle East',     tags:['luxury','beach','shopping','modern'],    vibe:'Capital of Luxury',   emoji:'🏛️', popularity:2 },

  // ── Frankfurt (Germany hub) ──────────────────────────────────
  { code:'FRA', city:'Frankfurt',    country:'Germany',  flag:'🇩🇪', region:'Western Europe',  tags:['culture','food','shopping','modern'],    vibe:'Skyline of Europe',   emoji:'🌆', popularity:2 },

  // ── More Americas ─────────────────────────────────────────────
  { code:'LAX', city:'Los Angeles',  country:'USA',      flag:'🇺🇸', region:'Americas',        tags:['beach','culture','nightlife','shopping'], vibe:'Hollywood & Beaches', emoji:'🌴', popularity:3 },
  { code:'SFO', city:'San Francisco',country:'USA',      flag:'🇺🇸', region:'Americas',        tags:['culture','food','tech','nature'],         vibe:'Bay City Vibes',      emoji:'🌉', popularity:3 },
  { code:'MCO', city:'Orlando',      country:'USA',      flag:'🇺🇸', region:'Americas',        tags:['adventure','resort','culture'],           vibe:'Theme-Park Capital',  emoji:'🎢', popularity:3 },
  { code:'LAS', city:'Las Vegas',    country:'USA',      flag:'🇺🇸', region:'Americas',        tags:['nightlife','party','luxury','music'],     vibe:'Neon Nightlife',      emoji:'🎰', popularity:3 },
  { code:'HNL', city:'Honolulu',     country:'USA',      flag:'🇺🇸', region:'Americas',        tags:['beach','nature','romantic','resort'],     vibe:'Hawaiian Paradise',   emoji:'🏄', popularity:3 },
  { code:'CUN', city:'Cancún',       country:'Mexico',   flag:'🇲🇽', region:'Americas',        tags:['beach','party','resort','nightlife'],     vibe:'Caribbean Resort',    emoji:'🏖️', popularity:3 },
  { code:'MEX', city:'Mexico City',  country:'Mexico',   flag:'🇲🇽', region:'Americas',        tags:['culture','food','history','nightlife'],   vibe:'Aztec Megacity',      emoji:'🌮', popularity:3 },
  { code:'YYZ', city:'Toronto',      country:'Canada',   flag:'🇨🇦', region:'Americas',        tags:['culture','food','nightlife','modern'],    vibe:'Multicultural Metro', emoji:'🍁', popularity:2 },
  { code:'YVR', city:'Vancouver',    country:'Canada',   flag:'🇨🇦', region:'Americas',        tags:['nature','culture','food','adventure'],    vibe:'Mountains & Sea',     emoji:'🏔️', popularity:2 },
  { code:'GIG', city:'Rio de Janeiro',country:'Brazil',  flag:'🇧🇷', region:'Americas',        tags:['beach','party','culture','nightlife'],    vibe:'Beach & Carnival',    emoji:'⛱️', popularity:3 },
  { code:'LIM', city:'Lima',         country:'Peru',     flag:'🇵🇪', region:'Americas',        tags:['food','culture','history'],               vibe:'Foodie Capital',      emoji:'🍤', popularity:2 },

  // ── North Africa ──────────────────────────────────────────────
  { code:'CAI', city:'Cairo',        country:'Egypt',    flag:'🇪🇬', region:'North Africa',    tags:['culture','history','adventure'],         vibe:'Pyramids & Pharaohs', emoji:'🗿', popularity:3 },
];
