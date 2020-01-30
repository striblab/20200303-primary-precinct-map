class StribPopup {

  constructor(map){
    this.popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 30
    });
    this.map = map;
  }

  _get_name(name) {
    if (name == 'Rich Stanek') {
      return 'Stanek';
    } else if (name == 'Dave Hutch') {
      return 'Hutchinson';
    } else {
      return 'label-oth';
    }
  }

  _get_label(party) {
    if (party == 'Rich Stanek') {
      return 'label-stanek';
    } else if (party == 'Dave Hutch') {
      return 'label-hutch';
    } else {
      return 'label-oth';
    }
  }

  _layout(precinct, votes_obj) {
    let winner = votes_obj[0];
    let second = votes_obj[1];

    return '<div class=".mapboxgl-popup"> \
      <h4 id="title">' + precinct + '</h4> \
      <table> \
        <thead> \
          <tr> \
            <th>Candidate</th> \
            <th class="right">Votes</th> \
          </tr> \
        </thead> \
        <tbody> \
          <tr> \
            <td><span class="' + this._get_label(winner.name) + '"></span>' + this._get_name(winner.name) + '</td> \
            <td id="votes-d" class="right">' + winner.votes + '</td> \
          </tr> \
          <tr> \
            <td><span class="' + this._get_label(second.name) + '"></span>' + this._get_name(second.name) + '</td> \
            <td id="votes-r" class="right">' + second.votes + '</td> \
          </tr>\
        </tbody> \
      </table> \
    </div>';
  }

  open(e) {
    var coordinates = e.features[0].geometry.coordinates.slice();

    // Popup components
    let precinct = e.features[0].properties.precinct;
    let votes_obj = eval(e.features[0].properties.votes_obj);

    // Populate the popup and set its coordinates
    // based on the feature found.
    this.popup.setLngLat(e.lngLat)
      .setHTML(this._layout(precinct, votes_obj))
      .addTo(this.map);
  }
 
  close() {
    this.popup.remove();
  }

}

export default StribPopup;