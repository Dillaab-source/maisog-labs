// WEB-INC-002 (ML-DEVOS-RFC-004 / ML-DEVOS-AS-015 / D-025) read-only admin
// dashboard shell, upgraded from the WEB-INC-001 authentication-boundary
// placeholder, and extended by WEB-INC-007 (ML-DEVOS-RFC-010 /
// ML-DEVOS-AS-030 / D-032) with the first authenticated design-control
// surface. This page itself renders no editorial data — it is a static
// shell served only after the Worker's fail-closed Cloudflare Access
// verification succeeds (worker/auth.mjs); `DashboardClient` and
// `DesignControls` each fetch only their own authorized same-origin
// endpoints client-side. No project/media/journal create/edit/save/delete/
// upload/audit control exists on this page — `DesignControls` is bounded
// to exactly the theme/section design routes RFC-010 authorizes.
import DashboardClient from "./DashboardClient";
import DesignControls from "./DesignControls";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main style={{ padding: "3rem 1.5rem", fontFamily: "system-ui, sans-serif", maxWidth: "48rem" }}>
      <h1>Admin dashboard</h1>
      <p>
        Read-only status view of current content, plus bounded theme/section design controls below. No project,
        Journal, or media editing exists on this page.
      </p>
      <DashboardClient />
      <DesignControls />
    </main>
  );
}
