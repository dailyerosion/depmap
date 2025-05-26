import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import Collection from 'ol/Collection';
import { XYZ } from 'ol/source';
import { Style, Fill, Stroke } from 'ol/style';
import { Vector as VectorLayer } from 'ol/layer';
import { Tile as TileLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { createVectorLayer, createBaseLayers, defaultCenter, defaultZoom } from './mapConfig';
import { multipliers, levels, colors, tilecache } from './constants';

let hoverOverlayLayer = null;
let clickOverlayLayer = null;

export function getHoverOverlayLayer() {
    return hoverOverlayLayer;
}
export function getClickOverlayLayer() {
    return clickOverlayLayer;
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

export function initializeMap() {
    const vectorLayer = createVectorLayer(multipliers, levels, colors);

    const map = new Map({
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

    const popup = new Overlay({
        element: document.getElementById('fdetails'),
        offset: [7, 7],
        autoPan: false
    });
    map.addOverlay(popup);

    return { map, vectorLayer, popup };
}

export function createOverlayLayers(map) {
    const highlightStyle = [new Style({
        stroke: new Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new Fill({
            color: 'rgba(255,0,0,0.1)'
        })
    })];
    
    const clickStyle = [new Style({
        stroke: new Stroke({
            color: '#000',
            width: 2
        })
    })];

    hoverOverlayLayer = new VectorLayer({
        source: new VectorSource({
            features: new Collection()
        }),
        style: () => {
            return highlightStyle;
        }
    });
    map.addLayer(hoverOverlayLayer);

    clickOverlayLayer = new VectorLayer({
        source: new VectorSource({
            features: new Collection()
        }),
        style: () => {
            return clickStyle;
        }
    });
    map.addLayer(clickOverlayLayer);

}
