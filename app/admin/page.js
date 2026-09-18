// WEB-INC-002 (ML-DEVOS-RFC-004 / ML-DEVOS-AS-015 / D-025) read-only admin
// dashboard shell. Upgraded from the WEB-INC-001 authentication-boundary
// placeholder. This page itself renders no editorial data — it is a static
// shell served only after the Worker's fail-closed Cloudflare Access
// verification succeeds (worker/auth.mjs); `DashboardClient` fetches the
// single authorized endpoint (GET /admin/api/dashboard) client-side and
// renders bounded status only. No create/edit/save/delete/publish/upload/
// theme/journal/audit control exists on this page.
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main style={{ padding: "3rem 1.5rem", fontFamily: "system-ui, sans-serif", maxWidth: "48rem" }}>
      <h1>Admin dashboard</h1>
      <p>
        Read-only status view of current content. No editing, publishing, or content-mutation controls exist
        here.
      </p>
      <DashboardClient />
    </main>
  );
}
