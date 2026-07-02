import { useState } from 'react';

export default function ExportToolbar({ onExcel, onImage, onSavePreset }) {
  const [showNameInput, setShowNameInput] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleConfirmSave = () => {
    const trimmed = presetName.trim();
    if (!trimmed) {
      return;
    }
    onSavePreset(trimmed);
    setPresetName('');
    setShowNameInput(false);
  };

  return (
    <div className="button-inline export-toolbar">
      <button type="button" onClick={onExcel}>
        Export to Excel
      </button>
      <button type="button" onClick={onImage}>
        Save as Image
      </button>
      {onSavePreset && !showNameInput && (
        <button type="button" onClick={() => setShowNameInput(true)}>
          Save as Preset
        </button>
      )}
      {onSavePreset && showNameInput && (
        <div className="export-toolbar-preset-input">
          <input
            type="text"
            placeholder="Preset name"
            value={presetName}
            onChange={(event) => setPresetName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleConfirmSave();
              }
            }}
          />
          <button type="button" onClick={handleConfirmSave}>
            Confirm
          </button>
          <button type="button" onClick={() => { setShowNameInput(false); setPresetName(''); }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
