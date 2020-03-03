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

const popover_thresh = 500; // The width of the map when tooltips turn to popovers
const isMobile = (window.innerWidth <= popover_thresh || document.body.clientWidth) <= popover_thresh || utils.isMobile();
const adaptive_ratio = utils.isMobile() ? 1.1 : 1.3; // Height/width ratio for adaptive map sizing

// Probably a better way than declaring this up here, but ...
let popover = new Popover('#map-popover');
let center = null;

mapboxgl.accessToken = 'pk.eyJ1Ijoic3RhcnRyaWJ1bmUiLCJhIjoiY2sxYjRnNjdqMGtjOTNjcGY1cHJmZDBoMiJ9.St9lE8qlWR5jIjkPYd3Wqw';

/********** MAKE MAP **********/

// Set adaptive sizing
let mapHeight = window.innerWidth * adaptive_ratio;
document.getElementById("map").style.height = mapHeight.toString() + "px";

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/startribune/ck6shlqld11uq1jnyvclo6tfd',
  center: [-94.6859, 47.7296],
  zoom: 2,
  minZoom: 2,
  maxZoom: 13,
  maxBounds: [-97.25, 43.2, -89.53, 49.5],
  scrollZoom: false
});

/********** SPECIAL RESET BUTTON **********/
class HomeReset {
  onAdd(map){
    this.map = map;
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl my-custom-control mapboxgl-ctrl-group';

    const button = this._createButton('mapboxgl-ctrl-icon monitor_button stateface stateface-mn')
    this.container.appendChild(button);
    return this.container;
  }
  onRemove(){
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }
  _createButton(className) {
    const el = window.document.createElement('button')
    el.className = className;
    el.textContent = 'W';
    el.addEventListener('click',(e)=>{
      e.style.display = 'none'
      console.log(e);
      // e.preventDefault()
      e.stopPropagation()
    },false )
    return el;
  }
}
const toggleControl = new HomeReset();

// Setup basic map controls
map.keyboard.disable();
// map.dragPan.disable();
if (utils.isMobile()) {
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
} else {

  map.getCanvas().style.cursor = 'pointer';
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }),'top-right');
  map.addControl(toggleControl,'top-right');

  $('.my-custom-control').on('click', function(){
    map.jumpTo({
      center: [-94.6859, 47.7296],
      zoom: 2,
    });
  });
}



/********** MAP BEHAVIORS **********/

map.on('load', function() {
  // Prep popup
  let popup = new StribPopup(map);

  // Fastclick-circumventing hack. Awful.
  // https://github.com/mapbox/mapbox-gl-js/issues/2035
  $(map.getCanvas()).addClass('needsclick');

  // This is a layer purely for precinct highlights
  // Fun fact: The source-layer here is the PARENT tileset of the layer you'll reference most other places, like for clicks.
  map.addLayer({
    "id": "precincts-highlighted",
    "type": "line",
    "source": "composite",
    "source-layer": "pres_primary_precinctsresultsgeo",
    "paint": {
      "line-color": "#000000"
    },
      "filter": ['in', 'id', '']
  }, 'place-city-sm'); // Place polygon under these labels.

  // Only allow dragpan after you zoom in
  map.on('zoomend', function(e) {
    if (map.getZoom() < 6 ) {
      map.dragPan.disable();
    } else {
      map.dragPan.enable();
    }
  });

  // Capture mousemove events on desktop and touch on mobile or small viewports
  map.on('click', 'primaryprecinctsresults', function(e) {
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
    map.on('mousemove', 'primaryprecinctsresults', function(e) {
      popup.open(e);
    });

    map.on('mouseleave', 'primaryprecinctsresults', function() {
      popup.close();
    });
  }
});