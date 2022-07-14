var tilecache = (window.location.host.indexOf(".local") > 0) ? "http://iem.local": "https://mesonet.agron.iastate.edu";
var BACKEND = (window.location.host.indexOf(".local") > 0) ? "http://depbackend.local" : "https://mesonet-dep.agron.iastate.edu";
var appstate = {
    sidebarOpen: false,
    lastdate: null,
    lat: null,
    lon: null,
    date: null,
    date2: null,
    metric: 0,
    ltype: 'qc_precip'
};
