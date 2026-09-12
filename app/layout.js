import "./globals.css";

export const metadata = {
  title: "Maisog Labs — Human potential. AI possibilities.",
  description:
    "An independent technology lab building useful automation, secure systems, and human-centered AI experiences.",
  metadataBase: new URL("https://maisoglabs.com"),
  openGraph: {
    title: "Maisog Labs",
    description: "Practical automation, secure systems, and human-centered AI experiences.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
