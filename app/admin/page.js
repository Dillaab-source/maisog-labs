// WEB-INC-002 (ML-DEVOS-RFC-004 / ML-DEVOS-AS-015 / D-025) read-only admin
// dashboard shell, upgraded from the WEB-INC-001 authentication-boundary
// placeholder, and extended by WEB-INC-007 (ML-DEVOS-RFC-010 /
// ML-DEVOS-AS-030 / D-032) with the first authenticated design-control
// surface. This page itself renders no editorial data — it is a static
// shell served only after the Worker's fail-closed Cloudflare Access
// verification succeeds (worker/auth.mjs); `DashboardClient` and
// `DesignControls` each fetch only their own authorized same-origin
// endpoints client-side. No media/journal create/edit/save/delete/upload/
// audit control exists on this page — `DesignControls` is bounded to exactly
// the theme/section design routes RFC-010 authorizes.
// RFC-022 Tier 1 (ML-DEVOS-AS-132, D-106) adds `ContentClient`: the bounded
// V10 homepage content editor (project facts and the contact email only),
// using the existing project lifecycle and the contact lifecycle routes.
import DashboardClient from "./DashboardClient";
import DesignControls from "./DesignControls";
import ContentClient from "./ContentClient";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main style={{ padding: "3rem 1.5rem", fontFamily: "system-ui, sans-serif", maxWidth: "48rem" }}>
      <h1>Admin dashboard</h1>
      <p>
        Status view of current content, the bounded homepage content editor (projects and contact email), and the
        theme/section design controls. Journal and media editing are not on this page.
      </p>
      <DashboardClient />
      <ContentClient />
      <DesignControls />
    </main>
  );
}
