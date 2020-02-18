/**
 * Main JS file for project.
 */

// Define globals that are added through the js.globals in
// the config.json file, here like this:
// /* global _ */

// Utility functions, such as Pym integration, number formatting,
// and device checking

import Popover from './shared/popover.js';
import StribPopup from './shared/popup.js';
import utilsFn from './utils.js';
const utils = utilsFn({});

const popover_thresh = 450; // The width of the map when tooltips turn to popovers
const isMobile = (window.innerWidth <= popover_thresh || document.body.clientWidth) <= popover_thresh || utils.isMobile();

// Probably a better way than declaring this up here, but ...
let popover = new Popover('#map-popover');
let center = null;

mapboxgl.accessToken = 'pk.eyJ1Ijoic3RhcnRyaWJ1bmUiLCJhIjoiY2sxYjRnNjdqMGtjOTNjcGY1cHJmZDBoMiJ9.St9lE8qlWR5jIjkPYd3Wqw';

/********** MAKE MAP **********/

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/startribune/ck6shlqld11uq1jnyvclo6tfd',
  center: [-93.472709, 45.014002],
  zoom: 6,
  minZoom: 6,
  maxZoom: 9,
  scrollZoom: false
});

// Setup basic map controls
map.keyboard.disable();
// map.dragPan.disable();
if (utils.isMobile()) {
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
} else {
  map.getCanvas().style.cursor = 'pointer';
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
}

/********** MAP BEHAVIORS **********/

map.on('load', function() {
  // Prep popup
  let popup = new StribPopup(map);

  // Fastclick-circumventing hack. Awful.
  // https://github.com/mapbox/mapbox-gl-js/issues/2035
  $(map.getCanvas()).addClass('needsclick');

  // This is a layer purely for precinct highlights
  map.addLayer({
    "id": "precincts-highlighted",
    "type": "line",
    "source": "composite",
    "source-layer": "pres-primary-precinctsresultsgeo",
    "paint": {
      "line-color": "#000000"
    },
      "filter": ['in', 'id', '']
  }, 'place-city-sm'); // Place polygon under these labels.

  // Only allow dragpan after you zoom in
  map.on('zoomend', function(e) {
    if (map.getZoom() < 9 ) {
      map.dragPan.disable();
    } else {
      map.dragPan.enable();
    }
  });

  // Capture mousemove events on desktop and touch on mobile or small viewports
  map.on('click', 'pres-primary-precinctsresultsgeo', function(e) {
    let f = e.features[0];

    // Highlight precinct on touch
    map.setFilter("precincts-highlighted", ['==', 'id', f.properties.id]);

    if (isMobile) {
      popover.open(f);

      // Scroll into view if popover is off the screen. jQuery assumed to
      // be on page because of Strib environment.
      if (!popover.is_in_viewport()) {
        $('html, body').animate({
          'scrollTop' : $("#map").offset().top
        });
      }

      // Zoom and enhance! But only if you're not already zoomed in past 9
      let zoom = map.getZoom() < 9 ? 9 : map.getZoom();
      map.flyTo({center: e.lngLat, zoom: zoom});
    }

  });

  // Handle mouseover events in desktop and non-mobile viewports
  if (!isMobile) {
    map.on('mousemove', 'pres-primary-precinctsresultsgeo', function(e) {
      popup.open(e);
    });

    map.on('mouseleave', 'pres-primary-precinctsresultsgeo', function() {
      popup.close();
    });
  }
});
