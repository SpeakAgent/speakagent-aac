
var Util = {};

Util.toRadians = function(num) {
  return num * Math.PI / 180;
}

Util.distanceLatLng = function(lat1, lon1, lat2, lon2) {

    // Handily swiped from
    // http://www.movable-type.co.uk/scripts/latlong.html
    //
    // Accurate down to a few meters -- we'll see what happens
    // if we need to do the whole "the world is really a sphere"
    // thing then ok.
    //
    // Love the fancy Greek variables. :-D  Modern code FTW.
    //
    var φ1 = Util.toRadians(lat1),
        φ2 = Util.toRadians(lat2),
        Δλ = Util.toRadians((lon2-lon1)),
        R = 6371; // gives d in km

    return Math.acos(Math.sin(φ1)*Math.sin(φ2) +
            Math.cos(φ1)*Math.cos(φ2) * Math.cos(Δλ)) * R;
};
