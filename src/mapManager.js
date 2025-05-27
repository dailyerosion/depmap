import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import Collection from 'ol/Collection';
import { XYZ } from 'ol/source';
import OSM from 'ol/source/OSM';
import { GeoJSON } from 'ol/format';
import { Style, Fill, Stroke, Text as TextStyle } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import { Tile as TileLayer, VectorImage as VectorImageLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { transform } from 'ol/proj';
import {
    BACKEND,
    multipliers,
    levels,
    colors,
    tilecache,
    varunits,
} from './constants';
import { setQueryParams } from './urlHandler';
import { getState, StateKeys } from './state';
import { setStatus } from './toaster';
import { updateDetails } from './huc12Utils';
import { remap } from './dataFetchers';

let hoverOverlayLayer = null;
let clickOverlayLayer = null;
let map = null;
let popup = null;
let vectorLayer = null;
let detailedFeature = null;
let quickFeature = null;

/** @type {{ name: HTMLElement | null, huc12: HTMLElement | null, loss: HTMLElement | null, runoff: HTMLElement | null, delivery: HTMLElement | null, precip: HTMLElement | null }} */
const infoElements = {
    name: null,
    huc12: null,
    loss: null,
    runoff: null,
    delivery: null,
    precip: null,
};

/**
 * Initialize cached references to DOM elements
 */
function initializeInfoElements() {
    const elements = {
        name: document.getElementById('info-name'),
        huc12: document.getElementById('info-huc12'),
        loss: document.getElementById('info-loss'),
        runoff: document.getElementById('info-runoff'),
        delivery: document.getElementById('info-delivery'),
        precip: document.getElementById('info-precip'),
    };

    // Validate all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Required element #info-${key} not found`);
            return;
        }
    }

    Object.assign(infoElements, elements);
}

/**
 *
 * @param {*} evt
 */
function displayFeatureInfo(evt) {
    const metric = getState(StateKeys.METRIC);

    const features = getMap().getFeaturesAtPixel(
        getMap().getEventPixel(evt.originalEvent)
    );
    let feature;

    // Validate all elements exist before proceeding
    if (
        !infoElements.name ||
        !infoElements.huc12 ||
        !infoElements.loss ||
        !infoElements.runoff ||
        !infoElements.delivery ||
        !infoElements.precip
    ) {
        console.error('Info elements not initialized');
        return;
    }

    if (features.length > 0) {
        feature = features[0];
        popup.element.hidden = false;
        popup.setPosition(evt.coordinate);
        infoElements.name.innerHTML = feature.get('name');
        infoElements.huc12.innerHTML = feature.getId();
        infoElements.loss.innerHTML = `${(
            feature.get('avg_loss') * multipliers.avg_loss[metric]
        ).toFixed(2)} ${varunits.avg_loss[metric]}`;
        infoElements.runoff.innerHTML = `${(
            feature.get('avg_runoff') * multipliers.avg_runoff[metric]
        ).toFixed(2)} ${varunits.avg_runoff[metric]}`;
        infoElements.delivery.innerHTML = `${(
            feature.get('avg_delivery') * multipliers.avg_delivery[metric]
        ).toFixed(2)} ${varunits.avg_delivery[metric]}`;
        infoElements.precip.innerHTML = `${(
            feature.get('qc_precip') * multipliers.qc_precip[metric]
        ).toFixed(2)} ${varunits.qc_precip[metric]}`;
    } else {
        popup.element.hidden = true;
        infoElements.name.innerHTML = '&nbsp;';
        infoElements.huc12.innerHTML = '&nbsp;';
        infoElements.loss.innerHTML = '&nbsp;';
        infoElements.runoff.innerHTML = '&nbsp;';
        infoElements.delivery.innerHTML = '&nbsp;';
        infoElements.precip.innerHTML = '&nbsp;';
    }

    // Keep only one selected
    if (feature) {
        if (feature !== quickFeature) {
            if (quickFeature) {
                getHoverOverlayLayer().getSource().removeFeature(quickFeature);
            }
            if (feature) {
                getHoverOverlayLayer().getSource().addFeature(feature);
            }
            quickFeature = feature;
        }
    }
}

export function setupMapEventHandlers() {
    getMap().on('moveend', () => {
        setQueryParams();
    });

    getMap().on('pointermove', (evt) => {
        if (evt.dragging) {
            return;
        }
        displayFeatureInfo(evt);
    });

    getMap().on('click', (evt) => {
        if (evt.dragging) {
            return;
        }
        displayFeatureInfo(evt);
    });

    getMap().on('dblclick', (evt) => {
        evt.stopPropagation();
        const pixel = getMap().getEventPixel(evt.originalEvent);
        const features = getMap().getFeaturesAtPixel(pixel);
        if (features.length > 0) {
            makeDetailedFeature(features[0]);
        } else {
            setStatus(
                'No features found for where you double clicked on the map.'
            );
        }
    });
}

/**
 *
 * @param {*} feature
 * @returns
 */
function makeDetailedFeature(feature) {
    if (feature === null) {
        return;
    }

    if (feature !== detailedFeature) {
        if (detailedFeature) {
            detailedFeature.set('clicked', false);
            getClickOverlayLayer().getSource().removeFeature(detailedFeature);
        }
        if (feature) {
            getClickOverlayLayer().getSource().addFeature(feature);
        }
        detailedFeature = feature;
    }

    updateDetails(feature.getId());
    setQueryParams();
}

/**
 * Draw the colorbar legend on the canvas
 */
export function drawColorbar() {
    const ltype = getState(StateKeys.LTYPE);
    const metric = getState(StateKeys.METRIC);

    const canvas = document.getElementById('colorbar');
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        setStatus('Failed to find colorbar canvas element', 'error');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        setStatus('Failed to get canvas context for colorbar', 'error');
        return;
    }

    // 20px for each color, 40 pixels on bottom, 40 on top
    canvas.height = colors[ltype].length * 20 + 40 + 40;

    // Clear out the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 12pt Calibri';
    ctx.fillStyle = 'black';
    let metrics = ctx.measureText('Legend');
    ctx.fillText('Legend', canvas.width / 2 - metrics.width / 2, 14);

    const maxval = levels[ltype][metric + 2];
    let txt = `Max: ${maxval.toFixed(maxval < 100 ? 2 : 0)}`;
    ctx.font = 'bold 10pt Calibri';
    ctx.fillStyle = 'black';
    metrics = ctx.measureText(txt);
    if (ltype !== 'dt' && ltype !== 'slp') {
        ctx.fillText(txt, canvas.width / 2 - metrics.width / 2, 32);
    }
    let pos = 20;
    levels[ltype][metric].forEach((level, idx) => {
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
        let precision = level < 100 ? 2 : 0;
        if (ltype === 'dt') {
            precision = 0;
        }
        let leveltxt = level.toFixed(precision);
        if (level === 0.001) {
            leveltxt = 0.001;
        }
        metrics = ctx.measureText(leveltxt);
        if (ltype === 'dt') {
            ctx.fillText(leveltxt, 10, canvas.height - (pos + 26));
        } else {
            ctx.fillText(
                leveltxt,
                45 - metrics.width / 2,
                canvas.height - (pos + 10) - 4
            );
        }
        pos = pos + 20;
    });

    // Title of what the legend is for
    txt = varunits[ltype][metric];
    metrics = ctx.measureText(txt);
    ctx.fillText(txt, canvas.width / 2 - metrics.width / 2, canvas.height - 5);
}

/**
 * Re-render vectors and update the map display
 */
export function rerender_vectors() {
    drawColorbar();
    getVectorLayer().changed();
    setQueryParams();
}


export function getVectorLayer() {
    return vectorLayer;
}

function createVectorLayer() {
    const huc12Style = new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0)' }),
        text: new TextStyle({
            font: '14px Calibri,sans-serif',
            stroke: new Stroke({ color: '#fff', width: 8 }),
            fill: new Fill({ color: '#000' }),
        }),
        stroke: new Stroke({ color: '#000000', width: 0.5 }),
    });

    vectorLayer = new VectorImageLayer({
        imageRatio: 2,
        source: new VectorSource({
            url: `${BACKEND}/geojson/huc12.geojson`,
            format: new GeoJSON(),
        }),
        style: (feature, resolution) => {
            const ltype = getState(StateKeys.LTYPE);
            const metric = getState(StateKeys.METRIC);

            let val = feature.get(ltype);
            val = val * multipliers[ltype][metric];
            let c = 'rgba(255, 255, 255, 0)';
            for (let i = levels[ltype][metric].length - 2; i >= 0; i--) {
                if (val >= levels[ltype][metric][i]) {
                    c = colors[ltype][i];
                    break;
                }
            }
            huc12Style.getFill()?.setColor(c);
            huc12Style.getStroke()?.setColor(resolution < 1250 ? '#000000' : c);
            huc12Style
                .getText()
                ?.setText(resolution < 160 ? val.toFixed(2) : '');
            return [huc12Style];
        },
    });
    vectorLayer.on('change', () => {
        console.error('vectorLayer change event');
        if (detailedFeature) {
            clickOverlayLayer.getSource().removeFeature(detailedFeature);
            detailedFeature = vectorLayer
                .getSource()
                .getFeatureById(detailedFeature.getId());
            clickOverlayLayer.getSource().addFeature(detailedFeature);
            updateDetails(detailedFeature.getId());
        }
        setQueryParams();
    });
    // Trigger a remap once this layer is loaded
    vectorLayer.getSource()?.on('featuresloadend', () => {
        remap();
    });
}

export function createBaseLayers() {
    return [
        new TileLayer({
            // @ts-ignore
            title: 'OpenStreetMap',
            visible: true,
            type: 'base',
            source: new OSM(),
        }),
        new TileLayer({
            // @ts-ignore
            title: 'Global Imagery',
            visible: false,
            type: 'base',
            source: new XYZ({
                url: 'https://s3.amazonaws.com/com.modestmaps.bluemarble/{z}-r{y}-c{x}.jpg',
            }),
        }),
    ];
}

export function getMap() {
    return map;
}

export function getHoverOverlayLayer() {
    return hoverOverlayLayer;
}
export function getClickOverlayLayer() {
    return clickOverlayLayer;
}

/**
 *
 * @param {string} title
 * @param {string} layername
 * @param {boolean} visible
 * @param {string} type
 * @returns
 */
function make_iem_tms(title, layername, visible, type) {
    return new TileLayer({
        // @ts-ignore
        title,
        visible,
        type,
        maxZoom: layername === 'depmask' ? 9 : 21,
        source: new XYZ({
            url: `${tilecache}/c/tile.py/1.0.0/${layername}/{z}/{x}/{y}.png`,
        }),
    });
}

export function initializeMap() {
    initializeInfoElements();
    createVectorLayer();

    map = new Map({
        target: 'map',
        controls: [],
        layers: [
            ...createBaseLayers(),
            vectorLayer,
            make_iem_tms('Domain Mask', 'depmask', true, ''),
            make_iem_tms('US Counties', 'c-900913', false, ''),
            make_iem_tms('US States', 's-900913', true, ''),
            make_iem_tms('HUC 8', 'huc8-900913', false, ''),
        ],
        view: new View({
            enableRotation: false,
            projection: 'EPSG:3857',
            center: transform(
                [getState(StateKeys.LON), getState(StateKeys.LAT)],
                'EPSG:4326',
                'EPSG:3857'
            ),
            zoom: getState(StateKeys.ZOOM),
        }),
    });

    const fbdetails = document.getElementById('fdetails');
    if (!fbdetails) {
        console.error('Failed to find fdetails element');
        return;
    }
    popup = new Overlay({
        element: fbdetails,
        offset: [7, 7],
        autoPan: false,
    });
    map.addOverlay(popup);
    createOverlayLayers();
    initializeInfoElements();
    setupMapEventHandlers();

    return { map, vectorLayer, popup };
}

export function createOverlayLayers() {
    const highlightStyle = [
        new Style({
            stroke: new Stroke({
                color: '#f00',
                width: 1,
            }),
            fill: new Fill({
                color: 'rgba(255,0,0,0.1)',
            }),
        }),
    ];

    const clickStyle = [
        new Style({
            stroke: new Stroke({
                color: '#000',
                width: 2,
            }),
        }),
    ];

    hoverOverlayLayer = new VectorLayer({
        source: new VectorSource({
            features: new Collection(),
        }),
        style: () => {
            return highlightStyle;
        },
    });
    map.addLayer(hoverOverlayLayer);

    clickOverlayLayer = new VectorLayer({
        source: new VectorSource({
            features: new Collection(),
        }),
        style: () => {
            return clickStyle;
        },
    });
    map.addLayer(clickOverlayLayer);
}
