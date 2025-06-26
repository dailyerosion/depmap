import { transform } from 'ol/proj';
import { setToday } from './dateUtils';
import { rerender_vectors } from './mapManager';
import { doHUC12Search } from './huc12Utils';
import { BACKEND } from './constants';
import { getState, setState, StateKeys, subscribeToState } from './state';
import { setStatus } from './toaster';
import { handleSideBarClick } from './uiManager';
import { getMap, getVectorLayer } from './mapManager';
import { requireElement } from 'iemjs/domUtils';
import strftime from 'strftime';

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
    requireElement(btnid).classList.add('active');
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

    const dt = strftime('%Y-%m-%d', date);
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
        uri = `${uri}&dt2=${strftime('%Y-%m-%d', date2)}`;
    }
    uri = `${uri}&conv=${metric === 0 ? 'english' : 'metric'}`;
    window.location.href = uri;
}

export function setupDatePickerHandlers() {
    const datepicker = requireElement('datepicker');
    const datepicker2 = requireElement('datepicker2');
    const setTodayButton = requireElement('settoday');
    const minusOneDay = requireElement('minus1d');
    const plusOneDay = requireElement('plus1d');

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
        datepicker.value = strftime('%Y-%m-%d', currentDate);
    }

    const currentDate2 = getState(StateKeys.DATE2);
    if (currentDate2 instanceof Date) {
        datepicker2.value = strftime('%Y-%m-%d', currentDate2);
    }

    // Handler for minus one day button
    minusOneDay.addEventListener('click', () => {
        const stateDate = getState(StateKeys.DATE);
        if (stateDate instanceof Date) {
            const newDate = new Date(stateDate);
            newDate.setDate(newDate.getDate() - 1);
            setState(StateKeys.DATE, newDate);
            datepicker.value = strftime('%Y-%m-%d', newDate);
            
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
            datepicker.value = strftime('%Y-%m-%d', newDate);
            
            const lastDate = getState(StateKeys.LAST_DATE);
            if (lastDate instanceof Date && newDate < lastDate) {
                setTodayButton.style.display = 'block';
            }
        }
    });

    datepicker.addEventListener('change', () => {
        if (!datepicker.value) {return;}
        // Parse date string properly to avoid timezone issues
        const dateParts = datepicker.value.split('-');
        const selectedDate = new Date(
            parseInt(dateParts[0], 10), // year
            parseInt(dateParts[1], 10) - 1, // month (0-indexed)
            parseInt(dateParts[2], 10) // day
        );
        setState(StateKeys.DATE, selectedDate);
        
        const lastDate = getState(StateKeys.LAST_DATE);
        if (lastDate instanceof Date && selectedDate < lastDate) {
            setTodayButton.style.display = 'block';
        }
    });

    datepicker2.addEventListener('change', () => {
        if (!datepicker2.value) {return;}
        // Parse date string properly to avoid timezone issues
        const dateParts = datepicker2.value.split('-');
        const selectedDate = new Date(
            parseInt(dateParts[0], 10), // year
            parseInt(dateParts[1], 10) - 1, // month (0-indexed)
            parseInt(dateParts[2], 10) // day
        );
        setState(StateKeys.DATE2, selectedDate);
    });

    setTodayButton.addEventListener('click', () => {
        setToday();
    });

    // Subscribe to state changes to keep date pickers in sync
    subscribeToState(StateKeys.DATE, (newDate) => {
        if (newDate instanceof Date) {
            datepicker.value = strftime('%Y-%m-%d', newDate);
        } else {
            datepicker.value = '';
        }
    });

    subscribeToState(StateKeys.DATE2, (newDate2) => {
        if (newDate2 instanceof Date) {
            datepicker2.value = strftime('%Y-%m-%d', newDate2);
        } else {
            datepicker2.value = '';
        }
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
    requireElement('huc12searchtext').addEventListener('keypress', (event) => {
            if (event.code === '13') {
                doHUC12Search();
            }
        });

    requireElement('huc12searchbtn').addEventListener('click', () => {
        doHUC12Search();
    });
}

/**
 * Sets up event handlers for state navigation buttons.
 */
export function setupStateNavigationHandlers() {
    const state_coordinates_zoom = {
        il: [-88.75, 40.14, 7],
        wi: [-91.2, 45.11, 7],
        ia: [-93.5, 42.07, 7],
        mn: [-93.21, 46.05, 7],
        ks: [-98.38, 38.48, 7],
        ne: [-98.01, 42.0, 7],
    };

    const buttons = document.querySelectorAll('button.szoom');
    buttons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const target = event.currentTarget;
            if (!(target instanceof HTMLButtonElement)) {
                console.warn('Expected a button element');
                return;
            }
            const state = target.dataset.state;
            const coords = state_coordinates_zoom[state];
            if (coords) {
                getMap()
                    .getView()
                    .setCenter(transform(coords.slice(0, 2), 'EPSG:4326', 'EPSG:3857'));
                getMap().getView().setZoom(coords[2]);
                target.blur();
            } else {
                console.warn(`No coordinates defined for state: ${state}`);
            }
        });
    });
}

export function setupMapControlHandlers() {
    document.querySelectorAll('#mapcontrols button').forEach((button) => {
        button.addEventListener('click', handleMapControlsClick);
    });

    requireElement('mapplus').addEventListener('click', () => {
        getMap()
            .getView()
            .setZoom(getMap().getView().getZoom() + 1);
    });

    requireElement('mapminus').addEventListener('click', () => {
        getMap()
            .getView()
            .setZoom(getMap().getView().getZoom() - 1);
    });

    requireElement('mapprint').addEventListener('click', () => {
        const date = getState(StateKeys.DATE);
        const date2 = getState(StateKeys.DATE2);
        const ltype = getState(StateKeys.LTYPE);

        const url = `${BACKEND}/auto/${strftime('%Y%m%d', date)}_` +
        `${strftime('%Y%m%d', date2 || date)}_0_${ltype}.png`;
        window.open(url);
    });

    requireElement('mapinfo').addEventListener('click', () => {
        setStatus('Double click HUC12 for detailed data.');
    });
}

export function setupInlineEventHandlers(setDateSelection) {
    requireElement('btnq1').addEventListener('click', () => {
        handleSideBarClick();
    });

    requireElement('huc12searchbtn').addEventListener('click', () => {
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

    // "Go to Latest Date" button in the new date notification modal
    const gotoLatestBtn = document.querySelector(
        'button[data-action="goto-latest"]'
    );
    if (gotoLatestBtn) {
        gotoLatestBtn.addEventListener('click', () => {
            setToday();
        });
    }
}
