import { EXPEDITE_TIERS } from '../constants.js';

function currentTierKey(inputs) {
  if (!inputs.expedite_enabled) {
    return 'standard';
  }

  const match = Object.keys(EXPEDITE_TIERS).find((key) => {
    const tier = EXPEDITE_TIERS[key];
    return (
      Number(inputs.expedite_shipping_pct) === tier.shipping &&
      Number(inputs.expedite_testing_pct) === tier.testing &&
      Number(inputs.expedite_reporting_pct) === tier.reporting
    );
  });

  return match ?? 'expedited';
}

export default function ExpeditePanel({ inputs, onPatch }) {
  const selected = currentTierKey(inputs);

  const handleTierChange = (event) => {
    const key = event.target.value;
    if (key === 'standard') {
      onPatch({
        expedite_enabled: false,
        expedite_shipping_pct: 0,
        expedite_testing_pct: 0,
        expedite_reporting_pct: 0,
      });
      return;
    }

    const tier = EXPEDITE_TIERS[key];
    onPatch({
      expedite_enabled: true,
      expedite_shipping_pct: tier.shipping,
      expedite_testing_pct: tier.testing,
      expedite_reporting_pct: tier.reporting,
    });
  };

  const handleFineTune = (key, rawValue) => {
    const value = rawValue === '' ? 0 : Number(rawValue);
    if (Number.isNaN(value)) {
      return;
    }

    onPatch({ expedite_enabled: true, [key]: value });
  };

  return (
    <div className="control study-control">
      <div className="control-header">
        <label htmlFor="expedite-tier">Timeline</label>
        <div className="control-input-group">
          <select id="expedite-tier" value={selected} onChange={handleTierChange}>
            {Object.keys(EXPEDITE_TIERS).map((key) => (
              <option key={key} value={key}>
                {EXPEDITE_TIERS[key].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="accordion fine-tune-details">
        <summary>Fine-tune surcharges</summary>
        <div className="accordion-content">
          <div className="control">
            <div className="control-header">
              <label htmlFor="expedite-shipping-pct">Shipping surcharge (%)</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="expedite-shipping-pct"
                  min={0}
                  max={500}
                  step={1}
                  value={Number(inputs.expedite_shipping_pct) || 0}
                  onChange={(event) => handleFineTune('expedite_shipping_pct', event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="control">
            <div className="control-header">
              <label htmlFor="expedite-testing-pct">Testing surcharge (%)</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="expedite-testing-pct"
                  min={0}
                  max={500}
                  step={1}
                  value={Number(inputs.expedite_testing_pct) || 0}
                  onChange={(event) => handleFineTune('expedite_testing_pct', event.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="control">
            <div className="control-header">
              <label htmlFor="expedite-reporting-pct">Reporting surcharge (%)</label>
              <div className="control-input-group">
                <input
                  type="number"
                  id="expedite-reporting-pct"
                  min={0}
                  max={500}
                  step={1}
                  value={Number(inputs.expedite_reporting_pct) || 0}
                  onChange={(event) => handleFineTune('expedite_reporting_pct', event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
