export default function Sidebar() {
  return (
    <div class="bg-zinc-50 text-zinc-800 px-2 rounded-tr-lg rounded-br-lg w-1/6 min-h-screen shadow-md">
        <div class="flex flex-col items-center">
            <span class="text-2xl koh-santepheap-black uppercase">
                WatchSec
            </span>
            <span class="text-sm koh-santepheap-thin">
                Keep your eyes wide open.
            </span>
        </div>

        <ul class="flex flex-col items-center py-6 gap-2 text-lg koh-santepheap-regular">
            <li class="py-4 px-6 w-full rounded-md text-center hover:bg-zinc-100 hover:text-blue-600 hover:shadow-sm hover:cursor-pointer transition-all duration-300 flex gap-2 items-center">
                <i class="fa-solid fa-house text-xl"></i>
                <span>Home</span>
            </li>
            <li class="py-4 px-6 w-full rounded-md text-center hover:bg-zinc-100 hover:text-blue-600 hover:shadow-sm hover:cursor-pointer transition-all duration-300 flex gap-2 items-center">
                <i class="fa-solid fa-map-location-dot text-xl"></i>
                <span>Map</span>
            </li>
            <li class="py-4 px-6 w-full rounded-md text-center hover:bg-zinc-100 hover:text-blue-600 hover:shadow-sm hover:cursor-pointer transition-all duration-300 flex gap-2 items-center">
                <i class="fa-solid fa-users text-xl"></i>
                <span>Employees</span>
            </li>
            <li class="py-4 px-6 w-full rounded-md text-center hover:bg-zinc-100 hover:text-blue-600 hover:shadow-sm hover:cursor-pointer transition-all duration-300 flex gap-2 items-center">
                <i class="fa-solid fa-building text-xl"></i>
                <span>Businesses</span>
            </li>
            <li class="py-4 px-6 w-full rounded-md text-center hover:bg-zinc-100 hover:text-blue-600 hover:shadow-sm hover:cursor-pointer transition-all duration-300 flex gap-2 items-center">
                <i class="fa-solid fa-gear text-xl"></i>
                <span>Settings</span>
            </li>
        </ul>
    </div>
  );
}
