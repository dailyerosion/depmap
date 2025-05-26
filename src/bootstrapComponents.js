import { Modal, Offcanvas } from 'bootstrap';

function initializeBootstrapComponents() {
    let eventsModal = null;
    let myModal = null;
    let dtModal = null;
    let sidebar = null;

    const eventsModalElement = document.getElementById('eventsModal');
    if (eventsModalElement) {
        eventsModal = new Modal(eventsModalElement);
    }
    
    const myModalElement = document.getElementById('myModal');
    if (myModalElement) {
        myModal = new Modal(myModalElement);
    }
    
    const dtModalElement = document.getElementById('dtModal');
    if (dtModalElement) {
        dtModal = new Modal(dtModalElement);
    }
    
    const sidebarElement = document.getElementById('sidebar');
    if (sidebarElement) {
        sidebar = new Offcanvas(sidebarElement);
    }

    return { eventsModal, myModal, dtModal, sidebar };
}

export { initializeBootstrapComponents };
