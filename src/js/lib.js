function readWindowHash() {
    var tokens = window.location.hash.split("/");
    // careful, we have the # char here to deal with
    if (tokens.length > 0 && tokens[0] != '' &&
        tokens[0] != '#' && tokens[0] != '#NaNNaNNaN') {
        APPSTATE.date = makeDate(tokens[0].substr(1, 4), tokens[0].substr(5, 2),
            tokens[0].substr(7, 2));
    }
    if (tokens.length > 1 && tokens[1] != '' && tokens[1] != 'NaNNaNNaN') {
        APPSTATE.date2 = makeDate(tokens[1].substr(0, 4), tokens[1].substr(4, 2),
            tokens[1].substr(6, 2));
    }
    if (tokens.length > 2 && tokens[2] != '') {
        APPSTATE.ltype = tokens[2];
        $('#radio input[value=' + tokens[2] + ']').prop('checked', true);
    }
    if (tokens.length > 5 && tokens[3] != '' && tokens[4] != '' &&
        tokens[5] != '') {
        defaultCenter = ol.proj.transform([parseFloat(tokens[3]), parseFloat(tokens[4])], 'EPSG:4326', 'EPSG:3857');
        defaultZoom = parseFloat(tokens[5]);
    }
    if (tokens.length > 6 && tokens[6].length == 12) {
        detailedFeatureIn = tokens[6];
    }
    if (tokens.length > 7 && tokens[7].length == 1) {
        APPSTATE.metric = parseInt(tokens[7]);
        $('#units_radio input[value=' + tokens[7] + ']').prop('checked', true);
    }

}
