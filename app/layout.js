import "./globals.css";

export const metadata = {
  title: "Maisog Labs — Ideas into useful systems",
  description:
    "An independent technology lab building useful automation, secure systems, and human-centered AI experiences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
