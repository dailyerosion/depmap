// Our bootstrapping
var tilecache = "https://mesonet.agron.iastate.edu";
var BACKEND = "http://depbackend.local";
var appstate = {
	lastdate: null,
	lat: null,
	lon: null,
	date: null,
	date2: null,
    metric: 0,
	ltype: 'qc_precip'
};

$(document).ready(function(){
    build();
});