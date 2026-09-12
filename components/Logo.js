export default function Logo({ compact = false }) {
  return (
    <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}`}>
      <span className="signature-mark" aria-hidden="true" />
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-word">MAISOGLABS</span>
    </span>
  );
}
