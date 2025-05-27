import { transform } from 'ol/proj';
import { setToday, formatDate } from './dateUtils';
import { rerender_vectors } from './mapManager';
import { doHUC12Search } from './huc12Utils';
import { BACKEND } from './constants';
import { getState, setState, StateKeys } from './state';
import { setStatus } from './toaster';
import { handleSideBarClick } from './uiManager';
import { getMap, getVectorLayer } from './mapManager';

/**
 *
 * @param {*} amount
 */
function changeOpacity(amount) {
    const vectorLayer = getVectorLayer();
    vectorLayer.setOpacity(vectorLayer.getOpacity() + amount);
}

function handleMapControlsClick(event) {
    const btnid = event.currentTarget.id;
    document
        .querySelectorAll('#mapcontrols button')
        .forEach((btn) => btn.classList.remove('active'));
    document.getElementById(btnid)?.classList.add('active');
}

/**
 * Update the metric and re-render the vectors
 * @param {*} newunit
 */
function setUnits(newunit) {
    setState(StateKeys.METRIC, parseInt(newunit));
    rerender_vectors();
}

// When user clicks the "Get Shapefile" Button
function getShapefile() {
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);
    const metric = getState(StateKeys.METRIC);

    const dt = formatDate('yy-mm-dd', date);
    const states = [];
    document
        .querySelectorAll('input[name="dlstates"]:checked')
        .forEach((input) => {
            if (input instanceof HTMLInputElement) {
                states.push(input.value);
            }
        });
    let uri = `${BACKEND}/dl/shapefile.py?dt=${dt}&states=${states.join(',')}`;
    if (date2 !== null) {
        uri = `${uri}&dt2=${formatDate('yy-mm-dd', date2)}`;
    }
    uri = `${uri}&conv=${metric === 0 ? 'english' : 'metric'}`;
    window.location.href = uri;
}

export function setupDatePickerHandlers() {
    const datepicker = document.getElementById('datepicker');
    const datepicker2 = document.getElementById('datepicker2');
    const setTodayButton = document.getElementById('settoday');
    const minusOneDay = document.getElementById('minus1d');
    const plusOneDay = document.getElementById('plus1d');

    if (
        !datepicker ||
        !datepicker2 ||
        !setTodayButton ||
        !minusOneDay ||
        !plusOneDay ||
        !(datepicker instanceof HTMLInputElement) ||
        !(datepicker2 instanceof HTMLInputElement)
    ) {
        console.error('Required date control elements not found');
        return;
    }

    // Initialize date pickers with current state
    const currentDate = getState(StateKeys.DATE);
    if (currentDate instanceof Date) {
        datepicker.value = formatDate('yy-mm-dd', currentDate);
    }

    const currentDate2 = getState(StateKeys.DATE2);
    if (currentDate2 instanceof Date) {
        datepicker2.value = formatDate('yy-mm-dd', currentDate2);
    }

    // Handler for minus one day button
    minusOneDay.addEventListener('click', () => {
        const stateDate = getState(StateKeys.DATE);
        if (stateDate instanceof Date) {
            const newDate = new Date(stateDate);
            newDate.setDate(newDate.getDate() - 1);
            setState(StateKeys.DATE, newDate);
            datepicker.value = formatDate('yy-mm-dd', newDate);
            
            const lastDate = getState(StateKeys.LAST_DATE);
            if (lastDate instanceof Date && newDate < lastDate) {
                setTodayButton.style.display = 'block';
            }
        }
    });

    // Handler for plus one day button
    plusOneDay.addEventListener('click', () => {
        const stateDate = getState(StateKeys.DATE);
        if (stateDate instanceof Date) {
            const newDate = new Date(stateDate);
            newDate.setDate(newDate.getDate() + 1);
            setState(StateKeys.DATE, newDate);
            datepicker.value = formatDate('yy-mm-dd', newDate);
            
            const lastDate = getState(StateKeys.LAST_DATE);
            if (lastDate instanceof Date && newDate < lastDate) {
                setTodayButton.style.display = 'block';
            }
        }
    });

    datepicker.addEventListener('change', () => {
        if (!datepicker.value) {return;}
        const selectedDate = new Date(datepicker.value);
        setState(StateKeys.DATE, selectedDate);
        
        const lastDate = getState(StateKeys.LAST_DATE);
        if (lastDate instanceof Date && selectedDate < lastDate) {
            setTodayButton.style.display = 'block';
        }
    });

    datepicker2.addEventListener('change', () => {
        if (!datepicker2.value) {return;}
        const selectedDate = new Date(datepicker2.value);
        setState(StateKeys.DATE2, selectedDate);
    });

    setTodayButton.addEventListener('click', () => {
        setToday();
    });
}

export function setupRadioHandlers() {
    document
        .querySelectorAll('input[type=radio][name=whichlayer]')
        .forEach((radio) => {
            radio.addEventListener('change', function () {
                setState(StateKeys.LTYPE, this.value);

                rerender_vectors();
            });
        });

    document
        .querySelectorAll('#units_radio input[type=radio]')
        .forEach((radio) => {
            radio.addEventListener('change', () => {
                console.log('fixme');
            });
        });
}

export function setupSearchHandlers() {
    document
        .getElementById('huc12searchtext')
        ?.addEventListener('keypress', (event) => {
            if (event.code === '13') {
                doHUC12Search();
            }
        });

    document.getElementById('huc12searchbtn')?.addEventListener('click', () => {
        doHUC12Search();
    });
}

export function setupStateNavigationHandlers() {
    document.getElementById('il')?.addEventListener('click', () => {
        getMap()
            .getView()
            .setCenter(transform([-88.75, 40.14], 'EPSG:4326', 'EPSG:3857'));
        getMap().getView().setZoom(7);
        this.blur();
    });

    document.getElementById('wi')?.addEventListener('click', () => {
        getMap()
            .getView()
            .setCenter(transform([-91.2, 45.11], 'EPSG:4326', 'EPSG:3857'));
        getMap().getView().setZoom(7);
    });

    document.getElementById('ia')?.addEventListener('click', function () {
        getMap()
            .getView()
            .setCenter(transform([-93.5, 42.07], 'EPSG:4326', 'EPSG:3857'));
        getMap().getView().setZoom(7);
        this.blur();
    });

    document.getElementById('mn')?.addEventListener('click', function () {
        getMap()
            .getView()
            .setCenter(transform([-93.21, 46.05], 'EPSG:4326', 'EPSG:3857'));
        getMap().getView().setZoom(7);
        this.blur();
    });

    document.getElementById('ks')?.addEventListener('click', function () {
        getMap()
            .getView()
            .setCenter(transform([-98.38, 38.48], 'EPSG:4326', 'EPSG:3857'));
        getMap().getView().setZoom(7);
        this.blur();
    });

    document.getElementById('ne')?.addEventListener('click', function () {
        getMap()
            .getView()
            .setCenter(transform([-96.01, 40.55], 'EPSG:4326', 'EPSG:3857'));
        getMap().getView().setZoom(8);
        this.blur();
    });
}

export function setupMapControlHandlers() {
    document.querySelectorAll('#mapcontrols button').forEach((button) => {
        button.addEventListener('click', handleMapControlsClick);
    });

    document.getElementById('mapplus')?.addEventListener('click', () => {
        getMap()
            .getView()
            .setZoom(getMap().getView().getZoom() + 1);
    });

    document.getElementById('mapminus')?.addEventListener('click', () => {
        getMap()
            .getView()
            .setZoom(getMap().getView().getZoom() - 1);
    });

    document.getElementById('mapprint')?.addEventListener('click', () => {
        const date = getState(StateKeys.DATE);
        const date2 = getState(StateKeys.DATE2);
        const ltype = getState(StateKeys.LTYPE);

        const url = `${BACKEND}/auto/${formatDate('yymmdd', date)}_` +
        `${formatDate('yymmdd', date2 || date)}_0_${ltype}.png`;
        window.open(url);
    });

    document.getElementById('mapinfo')?.addEventListener('click', () => {
        setStatus('Double click HUC12 for detailed data.');
    });
}

export function setupInlineEventHandlers(setDateSelection) {
    document.getElementById('btnq1')?.addEventListener('click', () => {
        handleSideBarClick();
    });

    document.getElementById('huc12searchbtn')?.addEventListener('click', () => {
        doHUC12Search();
    });
    // Unit selection radio buttons
    document.querySelectorAll('input[name="units"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                setUnits(parseInt(target.value, 10));
            }
        });
    });

    // Date selection radio buttons
    document.querySelectorAll('input[name="t"]').forEach((radio) => {
        radio.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement) {
                setDateSelection(target.value);
            }
        });
    });

    // Shapefile download button
    const shapefileBtn = document.querySelector(
        'button[data-action="download-shapefile"]'
    );
    if (shapefileBtn) {
        shapefileBtn.addEventListener('click', () => {
            getShapefile();
        });
    }

    // Opacity control buttons
    const opacityDecreaseBtn = document.querySelector(
        'button[data-action="decrease-opacity"]'
    );
    if (opacityDecreaseBtn) {
        opacityDecreaseBtn.addEventListener('click', () => {
            changeOpacity(-0.1);
        });
    }

    const opacityIncreaseBtn = document.querySelector(
        'button[data-action="increase-opacity"]'
    );
    if (opacityIncreaseBtn) {
        opacityIncreaseBtn.addEventListener('click', () => {
            changeOpacity(0.1);
        });
    }
}
