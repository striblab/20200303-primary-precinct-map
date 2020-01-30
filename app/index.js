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

mapboxgl.accessToken = 'pk.eyJ1IjoiY2pkZDNiIiwiYSI6ImNqZWJtZWVsYjBoYTAycm1raTltdnpvOWgifQ.aPWEg8C-5IJ0_7cXusY-1g';

/********** MAKE MAP **********/

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/cjdd3b/cjo7h26le2fov2rqlhq9f3muj',
  center: [-93.472709, 45.014002],
  zoom: 8.5,
  minZoom: 8.5,
  maxZoom: 12,
  scrollZoom: false
});

// Setup basic map controls
map.keyboard.disable();
map.dragPan.disable();
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
    "source-layer": "sheriffresultsgeo",
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
  map.on('click', 'sheriffresultsgeo', function(e) {
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
    map.on('mousemove', 'sheriffresultsgeo', function(e) {
      popup.open(e);
    });

    map.on('mouseleave', 'sheriffresultsgeo', function() {
      popup.close();
    });
  }
});
