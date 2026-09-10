import AdminStudio from "../../components/AdminStudio";
import content from "../../data/site.json";

export const metadata = {
  title: "Maisog Labs Admin",
  description: "Content administration for Maisog Labs.",
};

export default function AdminPage() {
  return <AdminStudio initialContent={content} />;
}
