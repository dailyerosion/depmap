import { BACKEND } from './constants';
import { getState, setState, StateKeys } from './state';
import { showToast } from './toaster';

const myDateFormat = 'M d, yy';

export function formatDate(fmt, dt) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return dt.toLocaleDateString('en-US', options);
}

export function makeDate(year, month, day) {
    return new Date(year, month - 1, day);
}

export function setToday(remap) {
    const lastdate = getState(StateKeys.LAST_DATE);
    setDate(lastdate.getFullYear(),
        lastdate.getMonth() + 1,
        lastdate.getDate(), remap);
    document.getElementById('settoday').style.display = 'none';
}

export function setDate(year, month, day, remap) {
    setState(StateKeys.DATE, makeDate(year, month, day));
    setState(StateKeys.DATE2, null);
    document.getElementById("dp2").style.display = 'none';
    remap();
}

export function setYearInterval(syear, remap, eventsModal) {
    if (eventsModal) {
        eventsModal.hide();
    }

    setState(StateKeys.DATE, makeDate(syear, 1, 1));
    setState(StateKeys.DATE2, makeDate(syear, 12, 31));
    remap();
    document.getElementById("dp2").style.display = 'block';
}

export function setDateFromString(s, remap, eventsModal) {
    if (eventsModal) {
        eventsModal.hide();
    }
    var dt = (new Date(s));
    setDate(formatDate('yy', dt),
        formatDate('mm', dt),
        formatDate('dd', dt), remap);
}

export function checkDates(scenario, setDateFunc) {
    fetch(`${BACKEND}/geojson/timedomain.py?scenario=${scenario}`)
        .then(response => response.json())
        .then(data => {
            if (data['last_date']) {
                const newdate = new Date(data['last_date']);
                const lastdate = getState(StateKeys.LAST_DATE);
                const currentDate = getState(StateKeys.DATE);
                
                if (newdate > lastdate && (
                    currentDate == null || newdate.getTime() !== currentDate.getTime())) {
                    setState(StateKeys.LAST_DATE, newdate);
                    if (currentDate != null) {
                        document.getElementById('newdate-thedate').innerHTML = formatDate(myDateFormat, newdate);
                    } else {
                        setDateFunc(
                            newdate.getFullYear(),
                            newdate.getMonth() + 1,
                            newdate.getDate()
                        );
                    }
                }
            }
        })
        .catch(error => {
            showToast("New data check failed " + error.message);
        });
}

export { myDateFormat };
