import AdminStudio from "../../components/AdminStudio";
import content from "../../data/site.json";

export const metadata = {
  title: "Maisog Labs Admin",
  description: "Private content administration for Maisog Labs.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    nosnippet: true,
  },
};

export default function AdminPage() {
  return <AdminStudio initialContent={content} />;
}
