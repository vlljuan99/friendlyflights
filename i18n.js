/*
  i18n.js — FriendlyFlights translations (EN / ES)
  Loaded before app.js so t() is always available.
*/

var currentLang = (function () {
  try { return localStorage.getItem('ff_lang') || 'en'; } catch { return 'en'; }
})();

var STRINGS = {
  en: {
    // ── Navbar ────────────────────────────────────────────────────
    nav_how:    'How it works',
    nav_signin: 'Sign in',
    lang_switch:'🇪🇸 ES',

    // ── Hero ──────────────────────────────────────────────────────
    hero_h1:  'Fly together from <em>anywhere</em>',
    hero_sub: 'Everyone searches from their own city. We find the best flight combination for the whole group — automatically.',

    // ── Search panel ──────────────────────────────────────────────
    panel_h2:          'Where is everyone flying from?',
    panel_sub:         'Add each traveler and their departure city',
    add_traveler:      'Add another traveler',
    flying_to:         'Flying to',
    dest_placeholder:  'Destination city or airport',
    dep_date:          'Departure date',
    ret_date:          'Return date',
    optional:          '(optional)',
    search_btn:        'Search flights for everyone',

    // ── Traveler row ──────────────────────────────────────────────
    traveler_name_ph: 'Name',
    airport_ph:       'Departure city or airport',
    pax_label:        'pax',

    // ── Flexible dates ────────────────────────────────────────────
    flex_label:        '±2 days',
    flex_exact:        'Exact date',
    flex_days:         function (n) { return '± ' + n + ' day' + (n !== 1 ? 's' : ''); },
    flex_dates_label:  'Flexible dates',

    // ── Itinerary ─────────────────────────────────────────────────
    itin_title:     'Your itinerary',
    itin_outbound:  '↗ Outbound',
    itin_return:    '↩ Return',
    itin_total:     'Trip total',
    itin_noresult:  'No flights found',
    itin_search:    'Search manually',
    itin_oneway:    'One-way',

    // ── Share as image ────────────────────────────────────────────
    save_img:     '📸 Save as image',
    saving_img:   '⏳ Generating…',

    // ── Loading ───────────────────────────────────────────────────
    loading_text: 'Searching flights for everyone…',
    loading_note: 'Live prices from Google Flights — this may take a few seconds per route',
    loading_found: function (n, src) {
      return '— ' + n + ' flight' + (n !== 1 ? 's' : '') + ' found' + (src ? ' (' + src + ')' : '');
    },
    loading_none: '— no results',

    // ── Results ───────────────────────────────────────────────────
    edit_search:    '✏️ Edit search',
    travelers_label: function(n) { return n + ' traveler' + (n !== 1 ? 's' : ''); },
    one_way:        '· One way',
    round_trip:     '· Round trip',

    // ── View tabs ─────────────────────────────────────────────────
    view_tab_flights:      '✈️ Individual flights',
    view_tab_combos:       '🏆 Best group combos',
    view_tab_destinations: '🗺️ Other destinations',

    // ── All-flights picker ────────────────────────────────────────
    all_flights_title: 'All available flights',
    all_flights_hint:  'Click any flight to set it as the chosen one above',
    flight_selected:   '✓ Chosen',
    flight_select:     'Choose',
    show_more:         function (n) { return 'Show ' + n + ' more'; },

    // ── Sort bar ──────────────────────────────────────────────────
    sort_by:    'Sort by:',
    sort_value: '★ Best value',
    sort_total: '€ Total price',
    sort_fair:  '⚖ Fairest',
    sort_quick: '⚡ Quickest',
    direct_only:'✈ Direct only',

    // ── Combo cards ───────────────────────────────────────────────
    badge_best:       '★ Best pick',
    badge_top:        'Top pick',
    combo_total_sfx:  'total',
    combo_book:       'Book →',
    combo_direct:     'Direct',
    combo_stop:       function (n) { return n + ' stop'; },
    combo_maxdur:     function (d) { return d + ' max'; },
    combo_pax_label:  function (n) { return n + ' pax'; },

    // ── No results ────────────────────────────────────────────────
    no_results:         'No flights found for this route.',
    no_results_for:     'No results for:',
    no_results_hint:    'Try the airline links below to search manually.',
    error_past_date:    'The departure date is in the past — pick a future date.',
    error_return_order: 'The return date must be on or after the departure date.',
    error_search_failed:'Something went wrong while searching. Please try again.',
    error_no_flights:   'No flights found for this search.',
    no_direct_flights:  'No direct flights found for this route combination.',
    no_direct_hint:     'Remove the filter to see all available flights.',
    show_all_flights:   'Show all flights',

    // ── Deep links ────────────────────────────────────────────────
    dl_title: 'Search all airlines per traveler',

    // ── Share ─────────────────────────────────────────────────────
    share_h3:    'Share with the group',
    share_p:     'Send the best combo + everyone\'s search links in one message',
    share_wa:    'WhatsApp',
    share_copy:  'Copy links',
    share_copied:'✅ Copied!',
    share_intro: function (city, date) { return '✈️ FriendlyFlights — ' + city + ', ' + date; },
    share_best:  function (total) { return '🏆 Best combo: €' + total + ' total'; },
    share_links: '🔗 Search links:',
    share_links_text: 'Search links:',
    share_total: 'Total',

    // ── Planner ───────────────────────────────────────────────────
    planner_cta:      'Not sure where to go? Discover destinations',
    planner_cta_hint: 'See where everyone in your group can meet',
    planner_title:    '🗺️ Where could you all go?',
    planner_from:     'From',
    planner_hint:     'Select departure airports above to see where everyone can meet',
    planner_show_all: 'Show all destinations',
    planner_reachable:function (n) { return '✓ ' + n + ' reachable from all origins'; },
    planner_tag_all:  '✈ All',
    planner_plan:     'Plan trip →',
    planner_empty:    'No destinations match this filter from your origins.',
    reach_all:        '✓ All can fly',
    reach_some:       '~ Some can fly',

    // ── Tag labels ────────────────────────────────────────────────
    tag_beach:     '🏖️ Beach',
    tag_culture:   '🏛️ Culture',
    tag_nightlife: '🌃 Nightlife',
    tag_food:      '🍽️ Food',
    tag_nature:    '🏔️ Nature',
    tag_romantic:  '💑 Romantic',
    tag_party:     '🎉 Party',
    tag_ski:       '⛷️ Ski',
    tag_history:   '📜 History',
    tag_art:       '🎨 Art',
    tag_shopping:  '🛍️ Shopping',
    tag_kite:      '🪁 Kite',
    tag_golf:      '⛳ Golf',
    tag_wine:      '🍷 Wine',
    tag_resort:    '🏨 Resort',
    tag_beer:      '🍺 Beer',
    tag_cycling:   '🚲 Cycling',
    tag_music:     '🎵 Music',
    tag_design:    '🖋️ Design',
    tag_sauna:     '🧖 Sauna',
    tag_aurora:    '🌌 Aurora',
    tag_adventure: '🧗 Adventure',
    tag_pub:       '🍻 Pub',
    tag_luxury:    '💎 Luxury',
    tag_tech:      '💻 Tech',
    tag_tango:     '💃 Tango',
    tag_temples:   '🛕 Temples',
    tag_modern:    '🏙️ Modern',
    tag_skiing:    '⛷️ Skiing',

    // ── Region names ──────────────────────────────────────────────
    'Southern Europe': 'Southern Europe',
    'Western Europe':  'Western Europe',
    'Central Europe':  'Central Europe',
    'Northern Europe': 'Northern Europe',
    'Eastern Europe':  'Eastern Europe',
    'North Africa':    'North Africa',
    'Middle East':     'Middle East',
    'Americas':        'Americas',
    'Asia':            'Asia',

    // ── How it works ─────────────────────────────────────────────
    hiw_title: 'How it works',
    hiw_1_h: 'Add your crew',
    hiw_1_p: 'Enter each friend\'s name and their nearest airport.',
    hiw_2_h: 'Pick a destination',
    hiw_2_p: 'Choose any city as your meeting point.',
    hiw_3_h: 'We search Skyscanner',
    hiw_3_p: 'A real browser fetches flight prices for each traveler — no fake data.',
    hiw_4_h: 'Best combo ranked',
    hiw_4_p: 'We score every combination by total price + max travel time, so the whole group wins.',

    // ── Footer ────────────────────────────────────────────────────
    footer_note: 'Prices fetched live from Google Flights · airline fallbacks for budget routes',
  },

  es: {
    // ── Navbar ────────────────────────────────────────────────────
    nav_how:    'Cómo funciona',
    nav_signin: 'Iniciar sesión',
    lang_switch:'🇬🇧 EN',

    // ── Hero ──────────────────────────────────────────────────────
    hero_h1:  'Volad juntos desde <em>cualquier lugar</em>',
    hero_sub: 'Cada uno busca desde su ciudad. Encontramos la mejor combinación de vuelos para todo el grupo — automáticamente.',

    // ── Search panel ──────────────────────────────────────────────
    panel_h2:          '¿Desde dónde vuela cada uno?',
    panel_sub:         'Añade a cada viajero y su ciudad de salida',
    add_traveler:      'Añadir otro viajero',
    flying_to:         'Destino',
    dest_placeholder:  'Ciudad o aeropuerto de destino',
    dep_date:          'Fecha de salida',
    ret_date:          'Fecha de vuelta',
    optional:          '(opcional)',
    search_btn:        'Buscar vuelos para todos',

    // ── Traveler row ──────────────────────────────────────────────
    traveler_name_ph: 'Nombre',
    airport_ph:       'Ciudad o aeropuerto de salida',
    pax_label:        'pax',

    // ── Flexible dates ────────────────────────────────────────────
    flex_label:        '±2 días',
    flex_exact:        'Fecha exacta',
    flex_days:         function (n) { return '± ' + n + ' día' + (n !== 1 ? 's' : ''); },
    flex_dates_label:  'Fechas flexibles',

    // ── Itinerary ─────────────────────────────────────────────────
    itin_title:     'Vuestro itinerario',
    itin_outbound:  '↗ Ida',
    itin_return:    '↩ Vuelta',
    itin_total:     'Total viaje',
    itin_noresult:  'Sin vuelos encontrados',
    itin_search:    'Buscar manualmente',
    itin_oneway:    'Solo ida',

    // ── Share as image ────────────────────────────────────────────
    save_img:     '📸 Guardar imagen',
    saving_img:   '⏳ Generando…',

    // ── Loading ───────────────────────────────────────────────────
    loading_text: 'Buscando vuelos para todos…',
    loading_note: 'Precios en vivo de Google Flights — puede tardar unos segundos por ruta',
    loading_found: function (n, src) {
      return '— ' + n + ' vuelo' + (n !== 1 ? 's' : '') + ' encontrado' + (n !== 1 ? 's' : '') + (src ? ' (' + src + ')' : '');
    },
    loading_none: '— sin resultados',

    // ── Results ───────────────────────────────────────────────────
    edit_search:     '✏️ Editar búsqueda',
    travelers_label: function(n) { return n + ' viajero' + (n !== 1 ? 's' : ''); },
    one_way:         '· Solo ida',
    round_trip:      '· Ida y vuelta',

    // ── View tabs ─────────────────────────────────────────────────
    view_tab_flights:      '✈️ Vuelos individuales',
    view_tab_combos:       '🏆 Mejores combos',
    view_tab_destinations: '🗺️ Otros destinos',

    // ── All-flights picker ────────────────────────────────────────
    all_flights_title: 'Todos los vuelos disponibles',
    all_flights_hint:  'Pulsa cualquier vuelo para fijarlo como el elegido arriba',
    flight_selected:   '✓ Elegido',
    flight_select:     'Elegir',
    show_more:         function (n) { return 'Ver ' + n + ' más'; },

    // ── Sort bar ──────────────────────────────────────────────────
    sort_by:    'Ordenar por:',
    sort_value: '★ Mejor opción',
    sort_total: '€ Precio total',
    sort_fair:  '⚖ Más equitativo',
    sort_quick: '⚡ Más rápido',
    direct_only:'✈ Solo directos',

    // ── Combo cards ───────────────────────────────────────────────
    badge_best:      '★ Mejor opción',
    badge_top:       'Top',
    combo_total_sfx: 'total',
    combo_book:      'Reservar →',
    combo_direct:    'Directo',
    combo_stop:      function (n) { return n + ' escala'; },
    combo_maxdur:    function (d) { return d + ' máx.'; },
    combo_pax_label: function (n) { return n + ' pax'; },

    // ── No results ────────────────────────────────────────────────
    no_results:         'No se han encontrado vuelos para esta ruta.',
    no_results_for:     'Sin resultados para:',
    no_results_hint:    'Usa los enlaces de abajo para buscar manualmente.',
    error_past_date:    'La fecha de salida ya ha pasado — elige una fecha futura.',
    error_return_order: 'La fecha de vuelta debe ser igual o posterior a la de salida.',
    error_search_failed:'Algo falló durante la búsqueda. Inténtalo de nuevo.',
    error_no_flights:   'No hemos encontrado vuelos para esta búsqueda.',
    no_direct_flights:  'No hay vuelos directos disponibles para esta combinación de rutas.',
    no_direct_hint:     'Quita el filtro para ver todos los vuelos disponibles.',
    show_all_flights:   'Ver todos los vuelos',

    // ── Deep links ────────────────────────────────────────────────
    dl_title: 'Buscar en todas las aerolíneas por viajero',

    // ── Share ─────────────────────────────────────────────────────
    share_h3:    'Compartir con el grupo',
    share_p:     'Envía la mejor combinación + los enlaces de todos en un mensaje',
    share_wa:    'WhatsApp',
    share_copy:  'Copiar enlaces',
    share_copied:'✅ ¡Copiado!',
    share_intro: function (city, date) { return '✈️ FriendlyFlights — ' + city + ', ' + date; },
    share_best:  function (total) { return '🏆 Mejor combo: €' + total + ' total'; },
    share_links: '🔗 Enlaces de búsqueda:',
    share_links_text: 'Enlaces de búsqueda:',
    share_total: 'Total',

    // ── Planner ───────────────────────────────────────────────────
    planner_cta:      '¿No sabéis a dónde ir? Descubrid destinos',
    planner_cta_hint: 'Mirad a dónde puede volar todo el grupo',
    planner_title:    '🗺️ ¿A dónde nos vamos?',
    planner_from:     'Desde',
    planner_hint:     'Selecciona los aeropuertos de origen arriba para ver dónde podéis quedar',
    planner_show_all: 'Ver todos los destinos',
    planner_reachable:function (n) { return '✓ ' + n + ' accesibles desde todos los orígenes'; },
    planner_tag_all:  '✈ Todos',
    planner_plan:     'Planear →',
    planner_empty:    'Ningún destino coincide con este filtro desde tus orígenes.',
    reach_all:        '✓ Todos pueden volar',
    reach_some:       '~ Algunos pueden volar',

    // ── Tag labels ────────────────────────────────────────────────
    tag_beach:     '🏖️ Playa',
    tag_culture:   '🏛️ Cultura',
    tag_nightlife: '🌃 Vida nocturna',
    tag_food:      '🍽️ Gastronomía',
    tag_nature:    '🏔️ Naturaleza',
    tag_romantic:  '💑 Romántico',
    tag_party:     '🎉 Fiesta',
    tag_ski:       '⛷️ Esquí',
    tag_history:   '📜 Historia',
    tag_art:       '🎨 Arte',
    tag_shopping:  '🛍️ Compras',
    tag_kite:      '🪁 Kite',
    tag_golf:      '⛳ Golf',
    tag_wine:      '🍷 Vino',
    tag_resort:    '🏨 Resort',
    tag_beer:      '🍺 Cerveza',
    tag_cycling:   '🚲 Ciclismo',
    tag_music:     '🎵 Música',
    tag_design:    '🖋️ Diseño',
    tag_sauna:     '🧖 Sauna',
    tag_aurora:    '🌌 Aurora',
    tag_adventure: '🧗 Aventura',
    tag_pub:       '🍻 Pub',
    tag_luxury:    '💎 Lujo',
    tag_tech:      '💻 Tecnología',
    tag_tango:     '💃 Tango',
    tag_temples:   '🛕 Templos',
    tag_modern:    '🏙️ Moderno',
    tag_skiing:    '⛷️ Esquí',

    // ── Region names ──────────────────────────────────────────────
    'Southern Europe': 'Europa del Sur',
    'Western Europe':  'Europa Occidental',
    'Central Europe':  'Europa Central',
    'Northern Europe': 'Europa del Norte',
    'Eastern Europe':  'Europa del Este',
    'North Africa':    'Norte de África',
    'Middle East':     'Oriente Medio',
    'Americas':        'América',
    'Asia':            'Asia',

    // ── How it works ─────────────────────────────────────────────
    hiw_title: 'Cómo funciona',
    hiw_1_h: 'Añade a tu grupo',
    hiw_1_p: 'Introduce el nombre de cada amigo y su aeropuerto más cercano.',
    hiw_2_h: 'Elige el destino',
    hiw_2_p: 'Escoge cualquier ciudad como punto de encuentro.',
    hiw_3_h: 'Buscamos en Skyscanner',
    hiw_3_p: 'Un navegador real obtiene precios reales para cada viajero — sin datos falsos.',
    hiw_4_h: 'Mejor combo clasificado',
    hiw_4_p: 'Puntuamos cada combinación por precio total + tiempo de vuelo máximo, para que gane todo el grupo.',

    // ── Footer ────────────────────────────────────────────────────
    footer_note: 'Precios en tiempo real de Google Flights · aerolíneas alternativas para rutas económicas',
  },
};

// ─── Public API ─────────────────────────────────────────────────
function t(key) {
  var args = Array.prototype.slice.call(arguments, 1);
  var val  = (STRINGS[currentLang] && STRINGS[currentLang][key] !== undefined)
    ? STRINGS[currentLang][key]
    : (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key);
  return typeof val === 'function' ? val.apply(null, args) : val;
}

function setLang(lang) {
  currentLang = lang;
  try { localStorage.setItem('ff_lang', lang); } catch {}
  applyI18n();
  // Flip the switcher label
  var btn = document.getElementById('langSwitcher');
  if (btn) btn.textContent = t('lang_switch');
}

function applyI18n() {
  // Text content
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  // innerHTML (for <em> etc.)
  document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
}
