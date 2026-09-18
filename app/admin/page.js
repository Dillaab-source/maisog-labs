// WEB-INC-001 authentication-boundary placeholder only (ML-DEVOS-RFC-002 §5).
// This page exists solely to prove the Worker auth boundary in worker/auth.mjs
// blocks unauthenticated requests and allows authenticated ones through. It
// reads no private/editorial content, has no mutation controls, and is not
// the WEB-INC-002 dashboard.
export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main style={{ padding: "3rem 1.5rem", fontFamily: "system-ui, sans-serif", maxWidth: "40rem" }}>
      <h1>Admin</h1>
      <p>
        You have reached the MaisogLabs admin authentication-boundary placeholder. This page confirms the
        Cloudflare Access assertion for this request was verified server-side before this asset was served.
      </p>
      <p>No editorial data, dashboard, or content controls exist here yet.</p>
    </main>
  );
}
