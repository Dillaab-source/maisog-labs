export default function Logo({ dark = false }) {
  return (
    <div className={`logo ${dark ? "dark" : ""}`}>
      <div className="logo-word">MAISOG</div>
      <div className="logo-sub">LABS</div>
      <span className="logo-orbit" />
      <span className="logo-star" />
    </div>
  );
}
