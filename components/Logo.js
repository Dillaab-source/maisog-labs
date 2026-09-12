export default function Logo({ compact = false, name = "Maisog Labs" }) {
  return (
    <span className={`brand-lockup${compact ? " brand-lockup--compact" : ""}`}>
      <span className="signature-mark" aria-hidden="true" />
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-word">{name.replace(/\s+/g, "").toUpperCase()}</span>
    </span>
  );
}
