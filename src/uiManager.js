import { BACKEND, scenario } from './constants';

export function setupSidebarEvents() {
    const sidebarElement = document.getElementById('sidebar');
    if (sidebarElement) {
        sidebarElement.addEventListener('shown.bs.offcanvas', () => {
            setState(StateKeys.SIDEBAR_OPEN, true);
        });
        sidebarElement.addEventListener('hidden.bs.offcanvas', () => {
            setState(StateKeys.SIDEBAR_OPEN, false);
        });
    }
}

export function handleSideBarClick() {
    // Toggle the sidebar state - Bootstrap handles the actual display
    setState(StateKeys.SIDEBAR_OPEN, !getState(StateKeys.SIDEBAR_OPEN));
}

export function makeLayerSwitcher(map) {
    var base_elem = document.getElementById("ls-base-layers");
    var over_elem = document.getElementById("ls-overlay-layers");
    map.getLayers().getArray().forEach(function (lyr, i) {
        var lyrTitle = lyr.get('title');
        if (lyrTitle === undefined) return;
        var lid = 'oll' + i;
        var li = document.createElement('li');
        var input = document.createElement('input');
        input.id = lid;
        var label = document.createElement('label');
        label.htmlFor = lid;
        if (lyr.get('type') === 'base') {
            input.type = 'radio';
            input.name = 'base';
        } else {
            input.type = 'checkbox';
        }
        input.checked = lyr.get('visible');
        input.addEventListener("change", function (e) {
            layerVisible(lyr, e.target.checked);
        });
        label.innerHTML = "&nbsp; " + lyrTitle;
        li.appendChild(input);
        li.appendChild(label);
        if (lyr.get('type') === 'base') {
            base_elem.appendChild(li);
        } else {
            over_elem.appendChild(li);
        }

    });
}

export function showVersions() {
    // Update the UI with what versions we have at play here.
    fetch(`${BACKEND}/auto/version.py?scenario=${scenario}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("dv_label").textContent = data["label"];
            document.getElementById("dv_wepp").textContent = data["wepp"];
            document.getElementById("dv_acpf").textContent = data["acpf"];
            document.getElementById("dv_flowpath").textContent = data["flowpath"];
            document.getElementById("dv_gssurgo").textContent = data["gssurgo"];
            document.getElementById("dv_software").textContent = data["software"];
            document.getElementById("dv_tillage").textContent = data["tillage"];
        })
        .catch(error => {
            setStatus(`DEP version check failed ${error.message}`);
        });

}