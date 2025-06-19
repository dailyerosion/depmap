// Controls the app title div
import { subscribeToState, StateKeys, getState } from "./state";
import { vartitle } from "./constants";
import strftime from "strftime";
import { requireElement } from "iemjs/domUtils";

const DTFMT = "%-d %b %Y";

/**
 * called back when state changes
 */
function updateTitle() {
    const titleElement = requireElement('maptitle');
    const ltype = getState(StateKeys.LTYPE);
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);
    let title = `Viewing ${vartitle[ltype] || ltype} for ${strftime(DTFMT, date)}`;
    if (date2) {
        title += ` to ${strftime(DTFMT, date2)}`;
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