export const COLORS = ['#70e1ff', '#9a7cff', '#64f0a8', '#ffd166', '#ff7b8a'];

export const CONFIG = [
  { key: 'N_subjects', label: 'Subjects', category: 'Volume', min: 1, max: 2000, step: 1, value: 100 },
  { key: 'N_visits', label: 'Visits', category: 'Volume', min: 1, max: 40, step: 1, value: 5 },
  { key: 'N_timepoints', label: 'Timepoints', category: 'Volume', min: 1, max: 20, step: 1, value: 2 },
  { key: 'N_aliquots', label: 'Aliquots', category: 'Volume', min: 1, max: 10, step: 1, value: 2 },
  { key: 'K_kit', label: 'Kit Cost per Sample ($)', category: 'Kitting & Site', min: 0, max: 200, step: 1, value: 18 },
  { key: 'K_site', label: 'Site Cost per Sample ($)', category: 'Kitting & Site', min: 0, max: 300, step: 1, value: 22 },
  { key: 'K_special', label: 'Special Handling Cost per Sample ($)', category: 'Kitting & Site', min: 0, max: 500, step: 1, value: 0 },
  { key: 'L_ship', label: 'Avg Cost per Shipment ($)', category: 'Logistics', min: 0, max: 2000, step: 10, value: 120 },
  { key: 'N_samples_ship', label: 'Avg # Samples per Shipment', category: 'Logistics', min: 1, max: 200, step: 1, value: 10 },
  { key: 'N_shipments', label: '# Shipment Legs per Sample', category: 'Logistics', min: 1, max: 6, step: 1, value: 1 },
  { key: 'L_accession', label: 'Accessioning Cost per Sample ($)', category: 'Logistics', min: 0, max: 100, step: 1, value: 6 },
  { key: 'T_process', label: 'Lab Processing Cost per Sample ($)', category: 'Testing', min: 0, max: 500, step: 1, value: 12 },
  { key: 'T_test', label: 'Assay Cost per Sample ($)', category: 'Testing', min: 0, max: 5000, step: 5, value: 80 },
  { key: 'T_data_total', label: 'Total Data Transfer Cost ($)', category: 'Testing', min: 0, max: 200000, step: 100, value: 5000 },
  { key: 'S_setup', label: 'LTS Receipt Cost per Sample ($)', category: 'Storage', min: 0, max: 200, step: 1, value: 5 },
  { key: 'S_rate', label: 'LTS Monthly Storage Rate ($)', category: 'Storage', min: 0, max: 50, step: 0.1, value: 0.25 },
  { key: 'S_duration', label: 'LTS Storage Duration (months)', category: 'Storage', min: 0, max: 500, step: 1, value: 0 },
  { key: 'D_retrieve', label: 'Retrieval Cost per Sample ($)', category: 'Disposal', min: 0, max: 200, step: 1, value: 2 },
  { key: 'D_destroy', label: 'Destruction Cost per Sample ($)', category: 'Disposal', min: 0, max: 200, step: 1, value: 6 },
  { key: 'D_doc', label: 'Destruction Documentation Cost per Sample ($)', category: 'Disposal', min: 0, max: 200, step: 1, value: 2 },
];

export const PRESETS = {
  s1: { N_shipments: 1, S_setup: 0, S_rate: 0, S_duration: 0, D_retrieve: 0, D_destroy: 0, D_doc: 0 },
  s2: { N_shipments: 2, S_setup: 1.22, S_rate: 0.07, S_duration: 300, D_retrieve: 2.32, D_destroy: 2.32, D_doc: 0 },
  s3: { N_shipments: 3, S_setup: 1.22, S_rate: 0.07, S_duration: 300, D_retrieve: 2.32, D_destroy: 2.32, D_doc: 0 },
  s4: {
    N_shipments: 2,
    L_accession: 0,
    T_process: 0,
    T_test: 0,
    T_data_total: 0,
    S_setup: 1.22,
    S_rate: 0.07,
    S_duration: 300,
    D_retrieve: 2.32,
    D_destroy: 2.32,
    D_doc: 0,
  },
};

export const SCENARIO_LABELS = {
  s1: 'Direct to Central Lab -> Single Analysis, No Residuals, No LTS',
  s2: 'Direct to Central Lab Analysis -> Residual LTS (25 Year Consent)',
  s3: 'Direct to Central Lab -> Specialty Lab Testing -> Residual LTS (25 Year Consent)',
  s4: 'LTS Only: No CL Routing, No Analysis (25 Year Consent)',
};

export const SCENARIO_META = {
  s1: {
    changes: ['Shipment legs per sample = 1', 'Storage values set to 0', 'Disposal values set to 0'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s2: {
    changes: ['Shipment legs per sample = 2', 'Storage receipt = $1.22', 'Storage rate = $0.07', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s3: {
    changes: ['Shipment legs per sample = 3', 'Storage receipt = $1.22', 'Storage rate = $0.07', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs', 'Testing costs'],
  },
  s4: {
    changes: ['Shipment legs per sample = 2', 'Accessioning cost set to $0', 'All testing values set to 0', 'Storage duration = 300 months'],
    constants: ['Study levers', 'Kitting and site costs'],
  },
};

export const DEFAULTS = Object.fromEntries(CONFIG.map((item) => [item.key, item.value]));

export const GROUP_ABBREV = {
  'Kitting & Site': 'K',
  'Logistics': 'L',
  'Testing': 'T',
  'Storage': 'S',
  'Disposal': 'D',
};
