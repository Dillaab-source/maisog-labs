import "./globals.css";

export const metadata = {
  title: "Maisog Labs — Ideas into systems",
  description:
    "Independent projects exploring automation, digital systems, and practical experiments for a brighter tomorrow.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
