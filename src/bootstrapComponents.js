import { Modal, Offcanvas } from 'bootstrap';
import { requireElement } from 'iemjs/domUtils';

function initializeBootstrapComponents() {

    const eventsModalElement = requireElement('eventsModal');
    const eventsModal = new Modal(eventsModalElement);

    const myModalElement = requireElement('myModal');
    const myModal = new Modal(myModalElement);

    const dtModalElement = requireElement('dtModal');
    const dtModal = new Modal(dtModalElement);

    const sidebarElement = requireElement('sidebar');
    const sidebar = new Offcanvas(sidebarElement);

    return { eventsModal, myModal, dtModal, sidebar };
}

export { initializeBootstrapComponents };
