export const tilecache = (window.location.host.indexOf(".local") > 0) ? "http://iem.local" : "https://mesonet.agron.iastate.edu";
export const BACKEND = (window.location.host.indexOf(".local") > 0) ? "http://depbackend.local" : "https://mesonet-dep.agron.iastate.edu";

export const varnames = ['qc_precip', 'avg_runoff', 'avg_loss', 'avg_delivery'];

export const multipliers = {
    'qc_precip': [1, 25.4],
    'avg_runoff': [1, 25.4],
    'avg_loss': [1, 2.2417],
    'avg_delivery': [1, 2.2417],
    'dt': [1, 1],
    'slp': [100, 100]
};

export const levels = {
    'qc_precip': [[], [], 0, 0],
    'avg_runoff': [[], [], 0, 0],
    'avg_loss': [[], [], 0, 0],
    'avg_delivery': [[], [], 0, 0],
    'dt': [[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], 6, 6],
    'slp': [[1, 2, 3, 5, 10, 20], [1, 2, 3, 5, 10, 20], -1, -1]
};

export const colors = {
    'qc_precip': ['#FFFF80', '#98F046', '#3BD923', '#3FC453', '#37AD7A', '#26989E', '#215394', '#0C1078'],
    'avg_runoff': ['#FFFF80', '#98F046', '#3BD923', '#3FC453', '#37AD7A', '#26989E', '#215394', '#0C1078'],
    'avg_loss': ['#FFEBAF', '#E0A870', '#BF8347', '#DDFA00', '#21DE00', '#16B568', '#1A818F', '#003075'],
    'avg_delivery': ['#FFEBAF', '#E0A870', '#BF8347', '#DDFA00', '#21DE00', '#16B568', '#1A818F', '#003075'],
    'dt': ['#FFEBAF', '#E0A870', '#BF8347', '#DDFA00', '#21DE00', '#16B568'],
    'slp': ['#16B568', '#21DE00', '#DDFA00', '#BF8347', '#E0A870', '#FFEBAF']
};

export const vardesc = {
    avg_runoff: 'Runoff is the average amount of water that left the hillslopes via above ground transport.',
    avg_loss: 'Soil Detachment is the average amount of soil disturbed on the modelled hillslopes.',
    qc_precip: 'Precipitation is the average amount of rainfall and melted snow received on the hillslopes.',
    avg_delivery: 'Hillslope Soil Loss is the average amount of soil transported to the bottom of the modelled hillslopes.',
    dt: "Dominant Tillage Code is an index value with increasing values indicating increasing tillage intensity.",
    slp: "Average hillslope bulk slope."
};

export const varunits = {
    avg_runoff: ['inches', 'mm'],
    avg_loss: ['tons per acre', 'tonnes per ha'],
    qc_precip: ['inches', 'mm'],
    avg_delivery: ['tons per acre', 'tonnes per ha'],
    dt: [' ', ' '],
    slp: ['%', '%']
};

export const vartitle = {
    avg_runoff: 'Water Runoff',
    avg_loss: 'Soil Detachment',
    qc_precip: 'Precipitation',
    avg_delivery: 'Hillslope Soil Loss',
    dt: 'Dominant Tillage',
    slp: 'Bulk Slope'
};
