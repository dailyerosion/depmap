import { transform } from 'ol/proj';
import { Tile as TileLayer, Vector as VectorLayer, VectorImage as VectorImageLayer } from 'ol/layer';
import { OSM, XYZ, Vector as VectorSource } from 'ol/source';
import { Style, Fill, Stroke, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { getState, StateKeys } from './state';

const tilecache = (window.location.host.indexOf(".local") > 0) ? "http://iem.local" : "https://mesonet.agron.iastate.edu";
const BACKEND = (window.location.host.indexOf(".local") > 0) ? "http://depbackend.local" : "https://mesonet-dep.agron.iastate.edu";

export const defaultCenter = transform([-94.5, 42.1], 'EPSG:4326', 'EPSG:3857');
export const defaultZoom = 6;

export function createVectorLayer(multipliers, levels, colors) {
    const style = new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0)' }),
        text: new Text({
            font: '14px Calibri,sans-serif',
            stroke: new Stroke({ color: '#fff', width: 8 }),
            fill: new Fill({ color: '#000', width: 3 })
        }),
        stroke: new Stroke({ color: '#000000', width: 0.5 })
    });

    return new VectorImageLayer({
        title: 'DEP Data Layer',
        imageRatio: 2,
        source: new VectorSource({
            url: `${BACKEND}/geojson/huc12.geojson`,
            format: new GeoJSON(),
            projection: 'EPSG:4326'
        }),
        style: function (feature, resolution) {
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
            style.getFill().setColor(c);
            style.getStroke().setColor(resolution < 1250 ? '#000000' : c);
            style.getText().setText(resolution < 160 ? val.toFixed(2) : '');
            return [style];
        }
    });
}

export function createBaseLayers() {
    return [
        new TileLayer({
            title: 'OpenStreetMap',
            visible: true,
            type: 'base',
            source: new OSM()
        }),
        new TileLayer({
            title: "Global Imagery",
            visible: false,
            type: 'base',
            source: new XYZ({
                url: 'https://s3.amazonaws.com/com.modestmaps.bluemarble/{z}-r{y}-c{x}.jpg'
            })
        })
    ];
}
