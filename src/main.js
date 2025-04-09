import './style.css';
import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import Collection from 'ol/Collection';
import { Style, Fill, Stroke, Text } from 'ol/style';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { XYZ, Vector as VectorSource } from 'ol/source';
import { transform } from 'ol/proj';
import { createVectorLayer, createBaseLayers, defaultCenter, defaultZoom } from './mapConfig';
import { tilecache, BACKEND, varnames, multipliers, levels, colors, vardesc, varunits, vartitle } from './constants';
import { readUrlParams, setQueryParams } from './urlHandler';
import { showToast } from './toaster';

const appstate = {
    sidebarOpen: false,
    lastdate: null,
    lat: null,
    lon: null,
    date: null,
    date2: null,
    metric: 0,
    ltype: 'qc_precip'
};

let map = null;
let vectorLayer = null;
let scenario = 0;
const myDateFormat = 'M d, yy';
let quickFeature = null;
let detailedFeature = null;
let hoverOverlayLayer = null;
let clickOverlayLayer = null;
let popup = null;

function handleSideBarClick() {
    $("#buttontabs .btn").removeClass('focus');
    $('.row-offcanvas').toggleClass("active");
    appstate.sidebarOpen = !appstate.sidebarOpen;
}

function formatDate(fmt, dt) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return dt.toLocaleDateString('en-US', options);
}

function makeDate(year, month, day) {
    return new Date(year, month - 1, day);
}

// Update the status box on the page with the given text
function setStatus(text, type = 'info') {
    showToast(text, type);
}

function showVersions() {
    // Update the UI with what versions we have at play here.
    $.ajax({
        url: `${BACKEND}/auto/version.py?scenario=${scenario}`,
        fail(_jqXHR, textStatus) {
            setStatus(`DEP version check failed ${textStatus}`);
        },
        success(data) {
            $("#dv_label").text(data["label"]);
            $("#dv_wepp").text(data["wepp"]);
            $("#dv_acpf").text(data["acpf"]);
            $("#dv_flowpath").text(data["flowpath"]);
            $("#dv_gssurgo").text(data["gssurgo"]);
            $("#dv_software").text(data["software"]);
            $("#dv_tillage").text(data["tillage"]);
        }
    });

}
function checkDates() {
    // Check the server for updated run information
    $.ajax({
        url: `${BACKEND}/geojson/timedomain.py?scenario=${scenario}`,
        fail(_jqXHR, textStatus) {
            setStatus("New data check failed " + textStatus);
        },
        success(data) {
            if (data['last_date']) {
                const newdate = new Date(data['last_date']);
                if (newdate > appstate.lastdate && (
                    appstate.date == null || newdate.getTime() !== appstate.date.getTime())) {
                    appstate.lastdate = newdate;
                    //$('#datepicker').datepicker("change",
                    //    { maxDate: formatDate(myDateFormat, newdate) });
                    //$('#datepicker2').datepicker("change",
                    //    { maxDate: formatDate(myDateFormat, newdate) });
                    // If we have no current date, don't show the modal
                    if (appstate.date != null) {
                        $('#newdate-thedate').html(formatDate(myDateFormat,
                            newdate));
                        /**
                        $("#newdate-message").dialog({
                            modal: true,
                            buttons: [{
                                text: 'Show Data!',
                                icons: {
                                    primary: "ui-icon-heart"
                                },
                                click: function () {
                                    setDate(appstate.lastdate.getFullYear(),
                                        appstate.lastdate.getMonth() + 1,
                                        appstate.lastdate.getDate());
                                    $(this).dialog("close");
                                }
                            }, {
                                text: 'Ok',
                                click: function () {
                                    $(this).dialog("close");
                                }
                            }]
                        });
                        */
                    } else {
                        setDate(
                            appstate.lastdate.getFullYear(),
                            appstate.lastdate.getMonth() + 1,
                            appstate.lastdate.getDate()
                        );
                    }
                }
            }

        }
    });
}

// Sets the permalink stuff
// date/date2/ltype/lon/lat/zoom
function setWindowHash() {
    var hash = "";
    if (appstate.date && appstate.date != 'Invalid Date') {
        hash += formatDate("yymmdd", appstate.date);
    }
    hash += "/";
    if (appstate.date2 && appstate.date2 != 'Invalid Date') {
        hash += formatDate("yymmdd", appstate.date2)
    }
    hash += "/" + appstate.ltype + "/";
    var center = map.getView().getCenter();
    center = transform(center, 'EPSG:3857', 'EPSG:4326'),
        hash += center[0].toFixed(2) + "/" + center[1].toFixed(2) + "/" + map.getView().getZoom() + "/";
    if (detailedFeature) {
        hash += detailedFeature.getId();
    }
    hash += "/" + appstate.metric.toString() + "/";
    window.location.hash = hash;
}

// Sets the date back to today
function setToday() {
    setDate(appstate.lastdate.getFullYear(),
        appstate.lastdate.getMonth() + 1,
        appstate.lastdate.getDate());
    $('#settoday').css('display', 'none');
}
// Sets the title shown on the page for what is being viewed
function setTitle() {
    return;
    dt = formatDate(myDateFormat, appstate.date);
    dtextra = (appstate.date2 === null) ? '' : ' to ' + formatDate(myDateFormat, appstate.date2);
    $('#maptitle').html(`Viewing ${vartitle[appstate.ltype]}` +
        ` for ${dt} ${dtextra}`);
    $('#variable_desc').html(vardesc[appstate.ltype]);
}

// When user clicks the "Get Shapefile" Button
function getShapefile() {
    const dt = formatDate("yy-mm-dd", appstate.date);
    const states = [];
    $("input[name='dlstates']:checked").each((_idx, v) => {
        states.push($(v).val());
    });
    let uri = `${BACKEND}/dl/shapefile.py?dt=${dt}&states=${states.join(",")}`;
    if (appstate.date2 !== null) {
        uri = `${uri}&dt2=${formatDate("yy-mm-dd", appstate.date2)}`;
    }
    uri = `${uri}&conv=${(appstate.metric == 0) ? 'english' : 'metric'}`;
    window.location.href = uri;
}

function hideDetails() {
    $('#details_hidden').css('display', 'block');
    $('#details_details').css('display', 'none');
    $('#details_loading').css('display', 'none');
}

/**
 * Update the HUC12 details widget panel
 * @param {String} huc12
 */
function updateDetails(huc12) {
    // Show side panel
    if (!appstate.sidebarOpen) {
        $("#btnq1").click();
        handleSideBarClick();
    }
    // Show Data Tab in side bar
    $("#data-tab").click();
    $('#details_hidden').css('display', 'none');
    $('#details_details').css('display', 'none');
    $('#details_loading').css('display', 'block');
    $.get(`${BACKEND}/huc12-details.php`, {
        huc12,
        date: formatDate("yy-mm-dd", appstate.date),
        date2: formatDate("yy-mm-dd", appstate.date2),
        metric: appstate.metric
    },
        function (data) {
            $('#details_details').css('display', 'block');
            $('#details_loading').css('display', 'none');
            $('#details_details').html(data);
        });

}

function getJSONURL() {
    // Generate the TMS URL given the current settings
    return BACKEND + '/auto/' + formatDate("yymmdd", appstate.date) + '_' +
        formatDate("yymmdd", (appstate.date2 !== null) ? appstate.date2 : appstate.date) +
        '.json';
}
function rerender_vectors() {
    drawColorbar();
    vectorLayer.changed();
    setQueryParams(appstate, map);
    setTitle();
}

function remap() {
    // Our main function for updating the map data

    // Abort if we have no date set
    if (appstate.date == null) return;

    //console.log("remap() called"+ detailedFeature);
    if (appstate.date2 != null && appstate.date2 <= appstate.date) {
        setStatus("Please ensure that 'To Date' is later than 'Date'");
        return;
    }
    setStatus("Fetching new data to display...");
    $.ajax({
        url: getJSONURL(),
        dataType: 'json',
        success: function (json) {
            var vsource = vectorLayer.getSource();
            // Zero out current data
            vsource.getFeatures().forEach(function (feat) {
                feat.setProperties({
                    'avg_delivery': 0,
                    'qc_precip': 0
                }, true);
            });
            // Merge in JSON provided data
            json.data.forEach(function (entry) {
                var feat = vsource.getFeatureById(entry.huc_12);
                if (feat === null) {
                    return;
                }
                feat.setProperties(entry, true);
            });

            // Setup what was provided to use by the JSON service for levels,
            // we also do the unit conversion so that we have levels in metric
            for (var i = 0; i < varnames.length; i++) {
                levels[varnames[i]][0] = json.ramps[varnames[i]];
                levels[varnames[i]][2] = json.max_values[varnames[i]];
                for (var j = 0; j < levels[varnames[i]][0].length; j++) {
                    levels[varnames[i]][1][j] = levels[varnames[i]][0][j] * multipliers[varnames[i]][1];
                }
                levels[varnames[i]][3] = json.max_values[varnames[i]] * multipliers[varnames[i]][1];

            }
            drawColorbar();

            if (detailedFeature) {
                clickOverlayLayer.getSource().removeFeature(detailedFeature);
                detailedFeature = vectorLayer.getSource().getFeatureById(detailedFeature.getId());
                clickOverlayLayer.getSource().addFeature(detailedFeature);
                updateDetails(detailedFeature.getId());
            }
            drawColorbar();
            vectorLayer.changed();
        }
    });
    setTitle();
    setQueryParams(appstate, map);
}
function setYearInterval(syear) {
    $('#eventsModal').modal('hide');

    appstate.date = makeDate(syear, 1, 1);
    appstate.date2 = makeDate(syear, 12, 31);
    //$('#datepicker').datepicker("setDate", formatDate(myDateFormat,
    //    appstate.date));
    //$('#datepicker2').datepicker("setDate", formatDate(myDateFormat,
    //    appstate.date2));
    //$('#multi').prop('checked', true).button('refresh');
    remap();
    $("#dp2").css('display', 'block');
}

function setDateFromString(s) {
    $('#eventsModal').modal('hide');
    var dt = (new Date(s));
    setDate(formatDate('yy', dt),
        formatDate('mm', dt),
        formatDate('dd', dt));
}

function setDate(year, month, day) {
    appstate.date = makeDate(year, month, day);
    //$('#datepicker').datepicker("setDate", formatDate(myDateFormat,
    //    appstate.date));
    // Called from top 10 listing, so disable the period
    //$('#single').prop('checked', true).button('refresh');
    appstate.date2 = null;
    $("#dp2").css('display', 'none');
    remap();
}

function make_iem_tms(title, layername, visible, type) {
    return new TileLayer({
        title: title,
        visible: visible,
        type: type,
        maxZoom: (layername == 'depmask') ? 9 : 21,
        source: new XYZ({
            url: tilecache + '/c/tile.py/1.0.0/' + layername + '/{z}/{x}/{y}.png'
        })
    })
}
function setHUC12(huc12) {
    feature = vectorLayer.getSource().getFeatureById(huc12);
    makeDetailedFeature(feature);
    $('#myModal').modal('hide');
}

function makeDetailedFeature(feature) {
    if (feature == null) {
        return;
    }

    if (feature != detailedFeature) {
        if (detailedFeature) {
            detailedFeature.set('clicked', false);
            clickOverlayLayer.getSource().removeFeature(detailedFeature);
        }
        if (feature) {
            clickOverlayLayer.getSource().addFeature(feature);
        }
        detailedFeature = feature;
    }
    updateDetails(feature.getId());
    setQueryParams(appstate, map);
}

/**
 * Create popup table for given huc12
 * @param {*} huc12
 * @param {*} mode
 */
function viewEvents(huc12, mode) {
    function pprint(val, _mode) {
        if (val == null) return "0";
        return val.toFixed(2);
    }
    function pprint2(val, _mode) {
        if (_mode === 'daily') return "";
        return ` (${val})`;
    }
    var colLabel = (mode == 'daily') ? "Date" : "Year";
    var lbl = ((mode == 'daily') ? 'Daily events' : 'Yearly summary (# daily events)');
    $('#eventsModalLabel').html(`${lbl} for ${huc12}`);
    $('#eventsres').html('<p><img src="images/wait24trans.gif" /> Loading...</p>');
    $.ajax({
        method: 'GET',
        url: BACKEND + '/geojson/huc12_events.py',
        data: { huc12: huc12, mode: mode }
    }).done(function (res) {
        var myfunc = ((mode == 'yearly') ? 'setYearInterval(' : 'setDateFromString(');
        var tbl = '<button class="btn btn-primary" ' +
            'onclick="javascript: window.open(\'' + BACKEND + '/geojson/huc12_events.py?huc12=' + huc12 + '&amp;mode=' + mode + '&amp;format=xlsx\');">' +
            '<i class="bi-download"></i> Excel Download</button><br />' +
            '<table class="table table-striped header-fixed" id="depdt">' +
            "<thead><tr><th>" + colLabel + "</th><th>Precip [" + varunits['qc_precip'][appstate.metric] +
            "]</th><th>Runoff [" + varunits['qc_precip'][appstate.metric] +
            "]</th><th>Detach [" + varunits['avg_loss'][appstate.metric] +
            "]</th><th>Hillslope Soil Loss [" + varunits['avg_loss'][appstate.metric] +
            "]</th></tr></thead>";
        $.each(res.results, function (idx, result) {
            var dt = ((mode == 'daily') ? result.date : result.date.substring(0, 4));
            tbl += "<tr><td><a href=\"javascript: " + myfunc + "'" + dt + "');\">" + dt + "</a></td><td>" +
                pprint(result.qc_precip * multipliers['qc_precip'][appstate.metric]) + pprint2(result.qc_precip_events, mode) + "</td><td>" +
                pprint(result.avg_runoff * multipliers['avg_runoff'][appstate.metric]) + pprint2(result.avg_runoff_events, mode) + "</td><td>" +
                pprint(result.avg_loss * multipliers['avg_loss'][appstate.metric]) + pprint2(result.avg_loss_events, mode) + "</td><td>" +
                pprint(result.avg_delivery * multipliers['avg_delivery'][appstate.metric]) + pprint2(result.avg_delivery_events, mode) + "</td></tr>";
        });
        tbl += "</table>";
        if (mode == 'yearly') {
            tbl += "<h4>Monthly Averages</h4>";
            tbl += '<p><img src="' + BACKEND + '/auto/huc12_bymonth.py?huc12=' + huc12 + '" class="img img-responsive"></p>';
        }

        $('#eventsres').html(tbl);
        $("#depdt").DataTable();
    }).fail(function (res) {
        $('#eventsres').html("<p>Something failed, sorry</p>");
    });

}

function doHUC12Search() {
    $('#huc12searchres').html('<p><img src="images/wait24trans.gif" /> Searching...</p>');
    var txt = $('#huc12searchtext').val();
    $.ajax({
        method: 'GET',
        url: BACKEND + '/geojson/hsearch.py',
        data: { q: txt }
    }).done(function (res) {
        var tbl = "<table class='table table-striped'><thead><tr><th>ID</th><th>Name</th></tr></thead>";
        $.each(res.results, function (idx, result) {
            tbl += "<tr><td><a href=\"javascript: setHUC12('" + result.huc_12 + "');\">" + result.huc_12 + "</a></td><td>" + result.name + "</td></tr>";
        });
        tbl += "</table>";
        $('#huc12searchres').html(tbl);
    }).fail(function (res) {
        $('#huc12searchres').html("<p>Search failed, sorry</p>");
    });
}

function drawColorbar() {
    //console.log("drawColorbar called...");
    var canvas = document.getElementById('colorbar');
    var ctx = canvas.getContext('2d');

    // 20px for each color, 40 pixels on bottom, 40 on top
    canvas.height = colors[appstate.ltype].length * 20 + 40 + 40;

    // Clear out the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 12pt Calibri';
    ctx.fillStyle = 'black';
    var metrics = ctx.measureText('Legend');
    ctx.fillText('Legend', (canvas.width / 2) - (metrics.width / 2), 14);

    var maxval = levels[appstate.ltype][appstate.metric + 2];
    var txt = "Max: " + maxval.toFixed((maxval < 100) ? 2 : 0);
    ctx.font = 'bold 10pt Calibri';
    ctx.fillStyle = 'black';
    metrics = ctx.measureText(txt);
    if (appstate.ltype != "dt" && appstate.ltype != "slp") {
        ctx.fillText(txt, (canvas.width / 2) - (metrics.width / 2), 32);
    }
    var pos = 20;
    $.each(levels[appstate.ltype][appstate.metric], function (idx, level) {
        // Confusion with pyIEM levels
        if (idx >= colors[appstate.ltype].length) {
            return;
        }
        ctx.beginPath();
        ctx.rect(5, canvas.height - pos - 40, 20, 20);
        ctx.fillStyle = colors[appstate.ltype][idx];
        ctx.fill();

        ctx.font = 'bold 12pt Calibri';
        ctx.fillStyle = 'black';
        var precision = (level < 100) ? 2 : 0;
        if (appstate.ltype == "dt") {
            precision = 0;
        }
        var leveltxt = level.toFixed(precision);
        if (level == 0.001) {
            leveltxt = 0.001;
        }
        metrics = ctx.measureText(leveltxt);
        if (appstate.ltype == "dt") {
            ctx.fillText(leveltxt, 10, canvas.height - (pos + 26));
        } else {
            ctx.fillText(
                leveltxt, 45 - (metrics.width / 2),
                canvas.height - (pos + 10) - 4);
        }
        pos = pos + 20;
    });

    // Title of what the legend is for
    txt = varunits[appstate.ltype][appstate.metric];
    metrics = ctx.measureText(txt);
    ctx.fillText(txt, (canvas.width / 2) - (metrics.width / 2), canvas.height - 5);

}

function layerVisible(lyr, visible) {
    lyr.setVisible(visible);
    if (visible && lyr.get('type') === 'base') {
        // Hide all other base layers regardless of grouping
        $.each(map.getLayers().getArray(), function (i, l) {
            if (l != lyr && l.get('type') === 'base') {
                l.setVisible(false);
            }
        });
    }

}
function makeLayerSwitcher() {
    var base_elem = $("#ls-base-layers")[0];
    var over_elem = $("#ls-overlay-layers")[0];
    $.each(map.getLayers().getArray(), function (i, lyr) {
        var lyrTitle = lyr.get('title');
        if (lyrTitle === undefined) return;
        var lid = 'oll' + i;
        var li = document.createElement('li');
        var input = document.createElement('input');
        input.id = lid;
        var label = document.createElement('label');
        label.htmlFor = lid;
        if (lyr.get('type') === 'base') {
            input.type = 'radio';
            input.name = 'base';
        } else {
            input.type = 'checkbox';
        }
        input.checked = lyr.get('visible');
        input.addEventListener("change", function (e) {
            layerVisible(lyr, e.target.checked);
        });
        label.innerHTML = "&nbsp; " + lyrTitle;
        li.appendChild(input);
        li.appendChild(label);
        if (lyr.get('type') === 'base') {
            base_elem.appendChild(li);
        } else {
            over_elem.appendChild(li);
        }

    });
}
function displayFeatureInfo(evt) {

    var features = map.getFeaturesAtPixel(map.getEventPixel(evt.originalEvent));
    var feature;
    if (features.length > 0) {
        feature = features[0];
        popup.element.hidden = false;
        popup.setPosition(evt.coordinate);
        $('#info-name').html(feature.get('name'));
        $('#info-huc12').html(feature.getId());
        $('#info-loss').html((feature.get('avg_loss') * multipliers['avg_loss'][appstate.metric]).toFixed(2) + ' ' + varunits['avg_loss'][appstate.metric]);
        $('#info-runoff').html((feature.get('avg_runoff') * multipliers['avg_runoff'][appstate.metric]).toFixed(2) + ' ' + varunits['avg_runoff'][appstate.metric]);
        $('#info-delivery').html((feature.get('avg_delivery') * multipliers['avg_delivery'][appstate.metric]).toFixed(2) + ' ' + varunits['avg_delivery'][appstate.metric]);
        $('#info-precip').html((feature.get('qc_precip') * multipliers['qc_precip'][appstate.metric]).toFixed(2) + ' ' + varunits['qc_precip'][appstate.metric]);
    } else {
        popup.element.hidden = true;
        $('#info-name').html('&nbsp;');
        $('#info-huc12').html('&nbsp;');
        $('#info-loss').html('&nbsp;');
        $('#info-runoff').html('&nbsp;');
        $('#info-delivery').html('&nbsp;');
        $('#info-precip').html('&nbsp;');
    }

    // Keep only one selected
    if (feature) {
        if (feature !== quickFeature) {
            if (quickFeature) {
                hoverOverlayLayer.getSource().removeFeature(quickFeature);
            }
            if (feature) {
                hoverOverlayLayer.getSource().addFeature(feature);
            }
            quickFeature = feature;
        }
    }

};
function changeOpacity(amount) {
    vectorLayer.setOpacity(vectorLayer.getOpacity() + amount);
}

function handleMapControlsClick(event) {
    const btnid = event.currentTarget.id;
    $("#mapcontrols button").removeClass("active");
    $("#" + btnid).addClass("active");
}

/**
 * Update the appstate.metric and re-render the vectors
 * @param {*} newunit 
 */
function setUnits(newunit) {
    appstate.metric = parseInt(newunit);
    rerender_vectors();
}

/**
 * Update the date selection type single or multi
 * @param {*} newval
 */
function setDateSelection(newval) {
    if (newval === 'single') {
        appstate.date2 = null;
        $("#dp2").css('display', 'none');
        remap();
    } else {
        $("#dp2").css('display', 'block');
        //var dt = $("#datepicker2").datepicker("getDate");
        //appstate.date2 = makeDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1,
        //    dt.getUTCDate());
    }
}


function build() {
    readUrlParams(appstate, defaultCenter, defaultZoom);


    $('[data-target="q1"]').click((event) => {
        handleSideBarClick();
    });

    var style = new Style({
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0)'
        }),
        text: new Text({
            font: '14px Calibri,sans-serif',
            stroke: new Stroke({
                color: '#fff',
                width: 8
            }),
            fill: new Fill({
                color: '#000',
                width: 3
            })
        }),
        stroke: new Stroke({
            color: '#000000', //'#319FD3',
            width: 0.5
        })
    });

    vectorLayer = createVectorLayer(appstate, multipliers, levels, colors);

    map = new Map({
        target: 'map',
        controls: [],
        layers: [
            ...createBaseLayers(),
            vectorLayer,
            make_iem_tms('Domain Mask', 'depmask', true, ''),
            make_iem_tms('US Counties', 'c-900913', false, ''),
            make_iem_tms('US States', 's-900913', true, ''),
            make_iem_tms('HUC 8', 'huc8-900913', false, '')
        ],
        view: new View({
            enableRotation: false,
            projection: 'EPSG:3857',
            center: defaultCenter,
            zoom: defaultZoom
        })
    });

    //  showing the position the user clicked
    popup = new Overlay({
        element: document.getElementById('fdetails'),
        offset: [7, 7],
        autoPan: false // Disable auto-panning
    });
    map.addOverlay(popup);

    var highlightStyle = [new Style({
        stroke: new Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new Fill({
            color: 'rgba(255,0,0,0.1)'
        })
    })];
    var clickStyle = [new Style({
        stroke: new Stroke({
            color: '#000',
            width: 2
        })
    })];

    hoverOverlayLayer = new VectorLayer({
        source: new VectorSource({
            features: new Collection()
        }),
        style: function (feature, resolution) {
            return highlightStyle;
        }
    });
    map.addLayer(hoverOverlayLayer);  // makes unmanaged

    clickOverlayLayer = new VectorLayer({
        source: new VectorSource({
            features: new Collection()
        }),
        style: function (feature, resolution) {
            return clickStyle;
        }
    });
    map.addLayer(clickOverlayLayer);  // makes unmanaged

    // fired when the map is done being moved around
    map.on('moveend', function () {
        setQueryParams(appstate, map);
    });
    // fired as the pointer is moved over the map
    map.on('pointermove', function (evt) {
        if (evt.dragging) {
            return;
        }
        displayFeatureInfo(evt);
    });
    //redundant to the above to support mobile
    map.on('click', function (evt) {
        if (evt.dragging) {
            return;
        }
        displayFeatureInfo(evt);
    });

    // fired as somebody double clicks
    map.on('dblclick', function (evt) {
        // no zooming please
        evt.stopPropagation();
        var pixel = map.getEventPixel(evt.originalEvent);
        var features = map.getFeaturesAtPixel(pixel);
        if (features.length > 0) {
            makeDetailedFeature(features[0]);
        } else {
            setStatus("No features found for where you double clicked on the map.");
        }
    });

    const datepicker = document.getElementById('datepicker');
    const datepicker2 = document.getElementById('datepicker2');

    //datepicker.value = appstate.date ? appstate.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    //datepicker2.value = appstate.date2 ? appstate.date2.toISOString().split('T')[0] : (appstate.lastdate ? appstate.lastdate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    datepicker.addEventListener('change', () => {
        const [year, month, day] = datepicker.value.split('-');
        appstate.date = makeDate(year, month, day);
        remap();
        if (appstate.date < appstate.lastdate) {
            document.getElementById('settoday').style.display = 'block';
        }
    });

    datepicker2.addEventListener('change', () => {
        const [year, month, day] = datepicker2.value.split('-');
        appstate.date2 = makeDate(year, month, day);
        remap();
    });

    document.getElementById('settoday').addEventListener('click', () => {
        setToday();
    });


    $("input[type=radio][name=whichlayer]").change(function () {
        //console.log("cb on radio this.value=" + this.value);
        appstate.ltype = this.value;
        rerender_vectors();
    });
    $("#units_radio input[type=radio]").change(function () {
    });
    if (appstate.date2) {
        //$('#t input[value=multi]').prop('checked', true).button('refresh');
    }

    if (appstate.date2) {
        $("#dp2").css('display', 'block');
    }

    $('#huc12searchtext').on('keypress', function (event) {
        if (event.which === 13) {
            doHUC12Search();
        }
    });


    $('#huc12searchbtn').on('click', function () {
        doHUC12Search();
    });

    /*
    $('#minus1d').on('click', function () {
        appstate.date.setDate(appstate.date.getDate() - 1);
        $("#datepicker").datepicker("setDate",
            formatDate(myDateFormat, appstate.date));
        remap();
        if (appstate.date < appstate.lastdate) {
            $("#plus1d").prop("disabled", false);
        }
        if (appstate.date != appstate.lastdate) {
            $('#settoday').css('display', 'block');
        }
    });
    */

    $('#plus1d').on('click', function () {
        appstate.date.setDate(appstate.date.getDate() + 1);
        if (appstate.date > appstate.lastdate) {
            $("#plus1d").prop("disabled", true);
            appstate.date.setDate(appstate.date.getDate() - 1);
        } else {
            //$("#datepicker").datepicker("setDate",
            //    formatDate(myDateFormat, appstate.date));
            remap();
        }
    });

    $('#il').on('click', function () {
        map.getView().setCenter(transform([-88.75, 40.14], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        $(this).blur();
    });
    $('#wi').on('click', () => {
        map.getView().setCenter(transform([-91.2, 45.11], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        $(this).blur();
    });
    $('#ia').on('click', function () {
        map.getView().setCenter(transform([-93.5, 42.07], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        $(this).blur();
    });
    $('#mn').on('click', function () {
        map.getView().setCenter(transform([-93.21, 46.05], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        $(this).blur();
    });
    $('#ks').on('click', function () {
        map.getView().setCenter(transform([-98.38, 38.48], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        $(this).blur();
    });
    $('#ne').on('click', function () {
        map.getView().setCenter(transform([-96.01, 40.55], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(8);
        $(this).blur();
    });

    $("#mapcontrols button").click(handleMapControlsClick);
    $("#mapplus").click(function () {
        map.getView().setZoom(map.getView().getZoom() + 1);
    });
    $("#mapminus").click(function () {
        map.getView().setZoom(map.getView().getZoom() - 1);
    });
    $("#mapprint").click(() => {
        // construct URL
        const url = BACKEND + "/auto/" + formatDate("yymmdd", appstate.date) +
            "_" + formatDate("yymmdd", (appstate.date2 === null) ? appstate.date : appstate.date2) +
            "_0_" + appstate.ltype + ".png"
        window.open(url);
    });
    $("#mapinfo").click(function () {
        setStatus("Double click HUC12 for detailed data.");
    });

    checkDates();
    window.setInterval(checkDates, 600000);
    makeLayerSwitcher();
    showVersions();

}; // End of build

function migrateHashToQueryParams() {
    const hash = window.location.hash.substring(1); // Remove the '#' character
    if (hash) {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParts = hash.split('/');
        if (hashParts.length > 0) queryParams.set('date', hashParts[0]);
        if (hashParts.length > 1) queryParams.set('date2', hashParts[1]);
        if (hashParts.length > 2) queryParams.set('ltype', hashParts[2]);
        if (hashParts.length > 5) {
            queryParams.set('lon', hashParts[3]);
            queryParams.set('lat', hashParts[4]);
            queryParams.set('zoom', hashParts[5]);
        }
        if (hashParts.length > 6) queryParams.set('feature', hashParts[6]);
        if (hashParts.length > 7) queryParams.set('metric', hashParts[7]);

        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    migrateHashToQueryParams();
    build();

    document.getElementById('huc12searchbtn').addEventListener('click', () => {
        doHUC12Search();
    });

    document.getElementById('settoday').addEventListener('click', () => {
        setToday();
    });

    document.getElementById('mapplus').addEventListener('click', () => {
        map.getView().setZoom(map.getView().getZoom() + 1);
    });

    document.getElementById('mapminus').addEventListener('click', () => {
        map.getView().setZoom(map.getView().getZoom() - 1);
    });

    document.getElementById('mapprint').addEventListener('click', () => {
        const url = `${BACKEND}/auto/${formatDate("yymmdd", appstate.date)}_${formatDate("yymmdd", appstate.date2 || appstate.date)}_0_${appstate.ltype}.png`;
        window.open(url);
    });
});

