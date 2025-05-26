import { setQueryParams } from './urlHandler';
import { colors, levels, varunits, BACKEND } from './constants';
import { formatDate } from './dateUtils';
import { getState, StateKeys } from './state';

/**
 * Draw the colorbar legend on the canvas
 */
export function drawColorbar() {
    const ltype = getState(StateKeys.LTYPE);
    const metric = getState(StateKeys.METRIC);
    
    const canvas = document.getElementById('colorbar');
    const ctx = canvas.getContext('2d');

    // 20px for each color, 40 pixels on bottom, 40 on top
    canvas.height = colors[ltype].length * 20 + 40 + 40;

    // Clear out the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 12pt Calibri';
    ctx.fillStyle = 'black';
    var metrics = ctx.measureText('Legend');
    ctx.fillText('Legend', (canvas.width / 2) - (metrics.width / 2), 14);

    var maxval = levels[ltype][metric + 2];
    var txt = "Max: " + maxval.toFixed((maxval < 100) ? 2 : 0);
    ctx.font = 'bold 10pt Calibri';
    ctx.fillStyle = 'black';
    metrics = ctx.measureText(txt);
    if (ltype != "dt" && ltype != "slp") {
        ctx.fillText(txt, (canvas.width / 2) - (metrics.width / 2), 32);
    }
    var pos = 20;
    levels[ltype][metric].forEach(function (level, idx) {
        // Confusion with pyIEM levels
        if (idx >= colors[ltype].length) {
            return;
        }
        ctx.beginPath();
        ctx.rect(5, canvas.height - pos - 40, 20, 20);
        ctx.fillStyle = colors[ltype][idx];
        ctx.fill();

        ctx.font = 'bold 12pt Calibri';
        ctx.fillStyle = 'black';
        var precision = (level < 100) ? 2 : 0;
        if (ltype == "dt") {
            precision = 0;
        }
        var leveltxt = level.toFixed(precision);
        if (level == 0.001) {
            leveltxt = 0.001;
        }
        metrics = ctx.measureText(leveltxt);
        if (ltype == "dt") {
            ctx.fillText(leveltxt, 10, canvas.height - (pos + 26));
        } else {
            ctx.fillText(
                leveltxt, 45 - (metrics.width / 2),
                canvas.height - (pos + 10) - 4);
        }
        pos = pos + 20;
    });

    // Title of what the legend is for
    txt = varunits[ltype][metric];
    metrics = ctx.measureText(txt);
    ctx.fillText(txt, (canvas.width / 2) - (metrics.width / 2), canvas.height - 5);
}

/**
 * Get the JSON URL for fetching map data
 * @returns {string} JSON URL
 */
export function getJSONURL() {
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);
    
    return BACKEND + '/auto/' + formatDate("yymmdd", date) + '_' +
        formatDate("yymmdd", date2 || date) +
        '.json';
}

/**
 * Re-render vectors and update the map display
 * @param {Object} appstate - Application state
 * @param {Object} map - OpenLayers map instance
 * @param {Object} vectorLayer - Vector layer
 * @param {Function} setTitle - Function to set the map title
 */
export function rerender_vectors(appstate, map, vectorLayer, setTitle) {
    drawColorbar();
    vectorLayer.changed();
    setQueryParams(appstate, map);
    setTitle();
}

/**
 * Set the title shown on the page for what is being viewed
 * @param {Object} appstate - Application state
 */
export function setTitle(appstate) {
    // Currently disabled - return early
    return;
    // This code is commented out in the original
    // dt = formatDate(myDateFormat, appstate.date);
    // dtextra = (appstate.date2 === null) ? '' : ' to ' + formatDate(myDateFormat, appstate.date2);
    // $('#maptitle').html(`Viewing ${vartitle[appstate.ltype]}` +
    //     ` for ${dt} ${dtextra}`);
    // $('#variable_desc').html(vardesc[appstate.ltype]);
}
