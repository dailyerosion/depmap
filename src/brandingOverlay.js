// Controls the app title div
import { subscribeToState, StateKeys, getState } from "./state";
import { vartitle } from "./constants";
import { formatDate } from "./dateUtils";

/**
 * called back when state changes
 */
function updateTitle() {
    const titleElement = document.getElementById('maptitle');
    if (!titleElement) {
        console.error('maptitle element not found');
        return;
    }
    const ltype = getState(StateKeys.LTYPE);
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);
    let title = `Viewing ${vartitle[ltype] || ltype} for ${formatDate('yy-mm-dd', date)}`;
    if (date2) {
        title += ` to ${formatDate('yy-mm-dd', date2)}`;
    }
    titleElement.textContent = title;
}

/**
 * Initialize things we need for branding
 */
export function setupBranding(){
    subscribeToState(StateKeys.LTYPE, updateTitle);
    subscribeToState(StateKeys.DATE, updateTitle);
    subscribeToState(StateKeys.DATE2, updateTitle);
    // Call updateTitle initially to set current state
    updateTitle();
}