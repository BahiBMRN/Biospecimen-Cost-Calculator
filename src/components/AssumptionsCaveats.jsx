export default function AssumptionsCaveats() {
  return (
    <div className="notes">
      <strong>Cost Normalization Assumptions</strong>
      <br />
      Cost per sample is calculated by dividing the average cost by the number of samples, then multiplying by the output unit.
      <br />
      <br />
      <strong>Caveats</strong>
      <br />
      This model assumes steady-state operations, average costs, and no extraordinary rework, sample loss, or protocol amendments. Real-world studies may vary due to site performance, assay variability, or changes in study design.
      <br />
      <br />
      Regional cost multipliers and expedite timeline surcharges default to configurable placeholder values, adjustable via each panel&apos;s &quot;Fine-tune&quot; controls, and should be validated against actual regional/vendor pricing before use in final study budgeting.
    </div>
  );
}
