import { REGIONS } from '../constants.js';
import { getRegionFactors } from '../calculate.js';

const FACTOR_FIELDS = [
  { key: 'region_factor_K', abbrev: 'K', label: 'Kitting & Site Multiplier', id: 'region-factor-K' },
  { key: 'region_factor_L', abbrev: 'L', label: 'Logistics Multiplier', id: 'region-factor-L' },
  { key: 'region_factor_T', abbrev: 'T', label: 'Testing Multiplier', id: 'region-factor-T' },
  { key: 'region_factor_S', abbrev: 'S', label: 'Storage Multiplier', id: 'region-factor-S' },
  { key: 'region_factor_D', abbrev: 'D', label: 'Disposal Multiplier', id: 'region-factor-D' },
];

export default function RegionPanel({ inputs, onPatch }) {
  const baseFactors = getRegionFactors(inputs.region);

  const handleRegionChange = (event) => {
    // Selecting a new region clears any prior fine-tune overrides so the
    // newly selected region's preset multipliers take effect immediately.
    onPatch({
      region: event.target.value,
      region_factor_K: null,
      region_factor_L: null,
      region_factor_T: null,
      region_factor_S: null,
      region_factor_D: null,
    });
  };

  const handleFineTune = (key, rawValue) => {
    const value = rawValue === '' ? 0 : Number(rawValue);
    if (Number.isNaN(value)) {
      return;
    }

    onPatch({ [key]: value });
  };

  return (
    <div className="control study-control">
      <div className="control-header">
        <label htmlFor="region-select">Region</label>
        <div className="control-input-group">
          <select id="region-select" value={inputs.region ?? 'us'} onChange={handleRegionChange}>
            {REGIONS.map((region) => (
              <option key={region.key} value={region.key}>
                {region.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="accordion fine-tune-details">
        <summary>Fine-tune regional multipliers</summary>
        <div className="accordion-content">
          {FACTOR_FIELDS.map((field) => (
            <div className="control" key={field.key}>
              <div className="control-header">
                <label htmlFor={field.id}>{field.label}</label>
                <div className="control-input-group">
                  <input
                    type="number"
                    id={field.id}
                    min={0}
                    max={5}
                    step={0.01}
                    value={inputs[field.key] ?? baseFactors[field.abbrev]}
                    onChange={(event) => handleFineTune(field.key, event.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
