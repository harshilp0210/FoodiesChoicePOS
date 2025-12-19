import { getMenuData } from "@/lib/menu-data";
import POSInterface from "@/components/pos/POSInterface";

export default async function Home() {
  const categories = await getMenuData();

  return (
    <main className="h-screen w-screen overflow-hidden bg-background">
      <POSInterface categories={categories} />
    </main>
  );
}
