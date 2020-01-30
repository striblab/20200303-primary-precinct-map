class Popover {

  constructor(el){
    this.el = el;
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

    return '<div id="popover-header"> \
      <h4 id="title">' + precinct + '</h4> \
      <span id="close">&#10006;</span> \
    </div> \
    <table> \
      <thead> \
        <tr> \
          <th>Candidate</th> \
          <th class="right">Votes</th> \
          <th class="right">Pct.</th> \
        </tr> \
      </thead> \
      <tbody> \
        <tr> \
          <td><span class="' + this._get_label(winner.name) + '"></span>' + this._get_name(winner.name) + '</td> \
          <td id="votes-r" class="right">' + winner.votes + '</td> \
          <td id="pct-r" class="right">' + Math.round(winner.votes_pct) + '%</td> \
        </tr> \
        <tr> \
          <td><span class="' + this._get_label(second.name) + '"></span>' + this._get_name(second.name) + '</td> \
          <td id="votes-r" class="right">' + second.votes + '</td> \
          <td id="pct-r" class="right">' + Math.round(second.votes_pct) + '%</td> \
        </tr>\
      </tbody> \
    </table>';
  }

  is_in_viewport() {
    let el = document.querySelector(this.el);

    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    while(el.offsetParent) {
      el = el.offsetParent;
      top += el.offsetTop;
      left += el.offsetLeft;
    }

    return (
      top < (window.pageYOffset + window.innerHeight) &&
      left < (window.pageXOffset + window.innerWidth) &&
      (top + height) > window.pageYOffset &&
      (left + width) > window.pageXOffset
    );
  }

  open(f) {
    var self = this;

    // Create and populate popover if mobile or small viewport
    let precinct = f.properties.precinct;
    let votes_obj = eval(f.properties.votes_obj);

    let el = document.querySelector(this.el);
    el.innerHTML = this._layout(precinct, votes_obj);

    let close_button = el.querySelector('#close');
    close_button.onclick = function() {
      self.close();
    }

    if (el.style.visibility != 'visible') {
      el.style.visibility = 'visible';
    }
  }
 
  close() {
    let el = document.querySelector('#map-popover');
    if (el.style.visibility == 'visible') {
      el.style.visibility = 'hidden';
    }
  }

}

export default Popover;