import Sidebar from "../components/Sidebar.tsx";
export default function Home() {
  return (
    <div class="flex bg-zinc-200 min-h-screen">
      <Sidebar />
      <div class="flex-1 p-6">
        {/* Content goes here */}
      </div>
    </div>
  );
}
