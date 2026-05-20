export default function NumberControl({ item, value, onChange, withSlider, disabled = false, lockHint = '' }) {
  const controlTitle = disabled ? lockHint : undefined;

  return (
    <div className={`control ${withSlider ? '' : 'study-control'} ${disabled ? 'is-locked' : ''}`}>
      <div className="control-header">
        <label htmlFor={item.key}>{item.label}</label>
        <div className="control-input-group">
          <input
            type="number"
            id={item.key}
            value={value}
            step={item.step}
            min={item.min}
            max={item.max}
            disabled={disabled}
            title={controlTitle}
            onChange={(event) => {
              if (!disabled) {
                onChange(item.key, Number(event.target.value));
              }
            }}
          />
        </div>
      </div>
      {withSlider && (
        <input
          type="range"
          id={`${item.key}-range`}
          min={item.min}
          max={item.max}
          step={item.step}
          value={value}
          disabled={disabled}
          title={controlTitle}
          onChange={(event) => {
            if (!disabled) {
              onChange(item.key, Number(event.target.value));
            }
          }}
        />
      )}
    </div>
  );
}
