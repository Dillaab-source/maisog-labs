import "./globals.css";
import { getPublicContent } from "../lib/content/local.mjs";
import DesignRuntime from "./DesignRuntime";

export async function generateMetadata() {
  const { seo, site } = await getPublicContent();
  return {
    title: seo.title,
    description: seo.description,
    metadataBase: new URL(seo.canonicalUrl),
    alternates: { canonical: seo.canonicalUrl },
    openGraph: {
      title: site.name,
      description: seo.description,
      type: "website",
    },
  };
}

export default async function RootLayout({ children }) {
  const { meta } = await getPublicContent();
  return (
    <html lang={meta.locale}>
      <body>
        <DesignRuntime />
        {children}
      </body>
    </html>
  );
}
