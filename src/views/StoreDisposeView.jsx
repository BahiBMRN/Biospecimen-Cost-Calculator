import { useMemo, useState } from 'react';
import { SD_SAMPLE_TYPE_CONTAINERS } from '../constants.js';
import { calculateDisposal, calculateStorage, calculateStoreAndDispose } from '../calculate.js';
import SDConfigPanel from '../components/SDConfigPanel.jsx';
import SDOutputPanel from '../components/SDOutputPanel.jsx';

const DEFAULT_STORE_INPUTS = {
  sampleType: null,
  containerSize: null,
  storageTemp: null,
  storageDuration: 0,
  totalSamples: '',
};

const DEFAULT_DISPOSE_INPUTS = {
  sampleType: null,
  containerSize: null,
  totalSamples: '',
};

export default function StoreDisposeView() {
  const [activeSDTab, setActiveSDTab] = useState('store');
  const [storeInputs, setStoreInputsRaw] = useState(DEFAULT_STORE_INPUTS);
  const [disposeInputs, setDisposeInputsRaw] = useState(DEFAULT_DISPOSE_INPUTS);

  const setStoreInputs = (updater) => {
    setStoreInputsRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // If sampleType changed, reset containerSize if it's no longer valid
      if (next.sampleType !== prev.sampleType) {
        const allowed = SD_SAMPLE_TYPE_CONTAINERS[next.sampleType] ?? [];
        if (next.containerSize && !allowed.includes(next.containerSize)) {
          return { ...next, containerSize: null };
        }
      }
      return next;
    });
  };

  const setDisposeInputs = (updater) => {
    setDisposeInputsRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next.sampleType !== prev.sampleType) {
        const allowed = SD_SAMPLE_TYPE_CONTAINERS[next.sampleType] ?? [];
        if (next.containerSize && !allowed.includes(next.containerSize)) {
          return { ...next, containerSize: null };
        }
      }
      return next;
    });
  };

  const storeResult = useMemo(() => calculateStorage(storeInputs), [storeInputs]);
  const disposeResult = useMemo(() => calculateDisposal(disposeInputs), [disposeInputs]);
  const sdResult = useMemo(() => calculateStoreAndDispose(storeInputs, disposeInputs), [storeInputs, disposeInputs]);

  return (
    <div className="shell">
      <section className="hero">
        <h1>Store or Dispose</h1>
        <p className="sub">
          <span className="hero-dot" />
          Compare and contrast Biospecimen Storage &amp; Disposal strategies
          <span className="hero-dot" style={{ marginRight: 0, marginLeft: 10 }} />
        </p>
      </section>

      <div className="layout sd-layout">
        <SDConfigPanel
          activeSDTab={activeSDTab}
          setActiveSDTab={setActiveSDTab}
          storeInputs={storeInputs}
          setStoreInputs={setStoreInputs}
          disposeInputs={disposeInputs}
          setDisposeInputs={setDisposeInputs}
        />
        <SDOutputPanel
          activeSDTab={activeSDTab}
          storeInputs={storeInputs}
          disposeInputs={disposeInputs}
          storeResult={storeResult}
          disposeResult={disposeResult}
          sdResult={sdResult}
        />
      </div>
    </div>
  );
}
