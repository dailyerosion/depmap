import { Modal, Offcanvas } from 'bootstrap';
import { requireElement } from 'iemjs/domUtils';

function initializeBootstrapComponents() {
    let eventsModal = null;
    let myModal = null;
    let dtModal = null;
    let sidebar = null;

    const eventsModalElement = requireElement('eventsModal');
    eventsModal = new Modal(eventsModalElement);

    const myModalElement = requireElement('myModal');
    myModal = new Modal(myModalElement);

    const dtModalElement = requireElement('dtModal');
    dtModal = new Modal(dtModalElement);

    const sidebarElement = requireElement('sidebar');
    sidebar = new Offcanvas(sidebarElement);

    return { eventsModal, myModal, dtModal, sidebar };
}

export { initializeBootstrapComponents };
