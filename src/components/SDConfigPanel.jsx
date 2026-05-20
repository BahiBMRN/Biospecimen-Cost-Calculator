import { SD_CONTAINER_SIZES, SD_SAMPLE_TYPE_CONTAINERS, SD_SAMPLE_TYPES, SD_STORAGE_TEMPS } from '../constants.js';

// ── Icons for sub-tab toggle buttons ────────────────────────────────────────
const StoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="15" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="17" />
    <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" />
  </svg>
);

const DisposeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const BothIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const SD_TABS = [
  { key: 'store',          label: 'Store',           Icon: StoreIcon },
  { key: 'dispose',        label: 'Dispose',         Icon: DisposeIcon },
  { key: 'storeAndDispose',label: 'Store & Dispose',  Icon: BothIcon },
];

// ── Option row: large buttons (sample type) ──────────────────────────────────
function SampleTypeRow({ selected, onSelect }) {
  return (
    <div className="sd-option-section">
      <div className="sd-option-row-label">Sample Type</div>
      <div className="sd-option-row sd-option-row--large">
        {SD_SAMPLE_TYPES.map((type) => (
          <button
            key={type.key}
            type="button"
            className={`sd-option-btn-large${selected === type.key ? ' selected' : ''}`}
            onClick={() => onSelect(type.key === selected ? null : type.key)}
            aria-pressed={selected === type.key}
          >
            <span className="sd-option-emoji" aria-hidden="true">{type.emoji}</span>
            <span className="sd-option-label">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Option row: small buttons (container size, storage temp) ─────────────────
function SmallOptionRow({ label, options, selected, onSelect }) {
  if (options.length === 0) return null;
  return (
    <div className="sd-option-section">
      <div className="sd-option-row-label">{label}</div>
      <div className="sd-option-row sd-option-row--small">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`sd-option-btn-small${selected === opt.key ? ' selected' : ''}`}
            onClick={() => onSelect(opt.key === selected ? null : opt.key)}
            aria-pressed={selected === opt.key}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Numeric input row ─────────────────────────────────────────────────────────
function NumericRow({ label, value, onChange, min = 0, max, step = 1, placeholder }) {
  return (
    <div className="sd-option-section">
      <div className="sd-option-row-label">{label}</div>
      <div className="sd-numeric-row">
        <input
          type="number"
          className="sd-numeric-input"
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        {max && (
          <input
            type="range"
            className="sd-numeric-slider"
            min={min}
            max={max}
            step={step}
            value={value === '' ? 0 : value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        )}
      </div>
    </div>
  );
}

// ── Store & Dispose read-only summary cards ───────────────────────────────────
function ReadOnlySummaryCards({ storeInputs, disposeInputs }) {
  const storeSummary = [
    { label: 'Sample Type', value: SD_SAMPLE_TYPES.find((t) => t.key === storeInputs.sampleType)?.label },
    { label: 'Container Size', value: SD_CONTAINER_SIZES.find((c) => c.key === storeInputs.containerSize)?.label },
    { label: 'Storage Temp', value: SD_STORAGE_TEMPS.find((t) => t.key === storeInputs.storageTemp)?.label },
    { label: 'Duration', value: storeInputs.storageDuration > 0 ? `${storeInputs.storageDuration} months` : null },
    { label: 'Total Samples', value: storeInputs.totalSamples !== '' && Number(storeInputs.totalSamples) > 0 ? Number(storeInputs.totalSamples).toLocaleString() : null },
  ].filter((r) => r.value != null);

  const disposeSummary = [
    { label: 'Sample Type', value: SD_SAMPLE_TYPES.find((t) => t.key === disposeInputs.sampleType)?.label },
    { label: 'Container Size', value: SD_CONTAINER_SIZES.find((c) => c.key === disposeInputs.containerSize)?.label },
    { label: 'Total Samples', value: disposeInputs.totalSamples !== '' && Number(disposeInputs.totalSamples) > 0 ? Number(disposeInputs.totalSamples).toLocaleString() : null },
  ].filter((r) => r.value != null);

  return (
    <div className="sd-read-only-cards">
      <div className="sd-read-only-card">
        <div className="sd-read-only-card-title">Store Configuration</div>
        {storeSummary.length > 0 ? (
          <ul className="sd-summary-list">
            {storeSummary.map((r) => (
              <li key={r.label}><span className="sd-summary-key">{r.label}:</span> {r.value}</li>
            ))}
          </ul>
        ) : (
          <p className="sd-validation-msg">No Store selections made yet.</p>
        )}
      </div>
      <div className="sd-read-only-card">
        <div className="sd-read-only-card-title">Dispose Configuration</div>
        {disposeSummary.length > 0 ? (
          <ul className="sd-summary-list">
            {disposeSummary.map((r) => (
              <li key={r.label}><span className="sd-summary-key">{r.label}:</span> {r.value}</li>
            ))}
          </ul>
        ) : (
          <p className="sd-validation-msg">No Dispose selections made yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Main Config Panel ─────────────────────────────────────────────────────────
export default function SDConfigPanel({ activeSDTab, setActiveSDTab, storeInputs, setStoreInputs, disposeInputs, setDisposeInputs }) {
  // Derive allowed container sizes for each tab
  const storeContainerOptions = storeInputs.sampleType
    ? SD_CONTAINER_SIZES.filter((c) => (SD_SAMPLE_TYPE_CONTAINERS[storeInputs.sampleType] ?? []).includes(c.key))
    : SD_CONTAINER_SIZES;

  const disposeContainerOptions = disposeInputs.sampleType
    ? SD_CONTAINER_SIZES.filter((c) => (SD_SAMPLE_TYPE_CONTAINERS[disposeInputs.sampleType] ?? []).includes(c.key))
    : SD_CONTAINER_SIZES;

  return (
    <div className="panel sd-config-panel">
      {/* Sub-tab toggle */}
      <div className="sd-tab-row">
        {SD_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            className={`sd-tab-btn${activeSDTab === key ? ' active' : ''}`}
            onClick={() => setActiveSDTab(key)}
            aria-pressed={activeSDTab === key}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      <div className="sd-config-body">
        {/* ── Store tab ── */}
        {activeSDTab === 'store' && (
          <>
            <SampleTypeRow
              selected={storeInputs.sampleType}
              onSelect={(val) => setStoreInputs((p) => ({ ...p, sampleType: val, containerSize: null }))}
            />
            <SmallOptionRow
              label="Container Size"
              options={storeContainerOptions}
              selected={storeInputs.containerSize}
              onSelect={(val) => setStoreInputs((p) => ({ ...p, containerSize: val }))}
            />
            <SmallOptionRow
              label="Storage Temperature"
              options={SD_STORAGE_TEMPS}
              selected={storeInputs.storageTemp}
              onSelect={(val) => setStoreInputs((p) => ({ ...p, storageTemp: val }))}
            />
            <NumericRow
              label="Storage Duration (months)"
              value={storeInputs.storageDuration}
              onChange={(val) => setStoreInputs((p) => ({ ...p, storageDuration: val }))}
              min={0}
              max={500}
              step={1}
            />
            <NumericRow
              label="Total Number of Expected Samples"
              value={storeInputs.totalSamples}
              onChange={(val) => setStoreInputs((p) => ({ ...p, totalSamples: val }))}
              min={1}
              placeholder="Optional"
            />
          </>
        )}

        {/* ── Dispose tab ── */}
        {activeSDTab === 'dispose' && (
          <>
            <SampleTypeRow
              selected={disposeInputs.sampleType}
              onSelect={(val) => setDisposeInputs((p) => ({ ...p, sampleType: val, containerSize: null }))}
            />
            <SmallOptionRow
              label="Container Size"
              options={disposeContainerOptions}
              selected={disposeInputs.containerSize}
              onSelect={(val) => setDisposeInputs((p) => ({ ...p, containerSize: val }))}
            />
            <NumericRow
              label="Total Number of Expected Samples"
              value={disposeInputs.totalSamples}
              onChange={(val) => setDisposeInputs((p) => ({ ...p, totalSamples: val }))}
              min={1}
              placeholder="Optional"
            />
          </>
        )}

        {/* ── Store & Dispose tab ── */}
        {activeSDTab === 'storeAndDispose' && (
          <ReadOnlySummaryCards storeInputs={storeInputs} disposeInputs={disposeInputs} />
        )}
      </div>
    </div>
  );
}
