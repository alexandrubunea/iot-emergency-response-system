type SidebarProps = {
    setCurrentView: (view: string) => void;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
};

function Sidebar({
    setCurrentView,
    isMobileMenuOpen,
    toggleMobileMenu,
}: SidebarProps) {
    return (
        <>
            <button
                className="lg:hidden fixed top-4 left-4 z-50 bg-zinc-800 p-2 rounded-md text-zinc-200"
                onClick={toggleMobileMenu}
            >
                <i
                    className={`fa-solid ${
                        isMobileMenuOpen ? "fa-xmark" : "fa-bars"
                    }`}
                ></i>
            </button>

            <div
                className={`
                bg-zinc-800 text-zinc-200 fixed lg:relative z-40
                w-64 min-h-screen px-3 py-5
                transform transition-transform duration-300 ease-in-out
                ${
                    isMobileMenuOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                }
            `}
            >
                <div className="flex flex-col items-center">
                    <h1 className="text-3xl domine-black">WatchSec</h1>
                    <h5 className="text-sm domine-thin">Keeps you safe.</h5>
                </div>
                <ul className="mt-20 text-lg flex flex-col space-y-2 poppins-light">
                    {[
                        { name: "Home", icon: "fa-house" },
                        { name: "Map", icon: "fa-map-location-dot" },
                        { name: "Businesses", icon: "fa-briefcase" },
                        { name: "Employees", icon: "fa-users" },
                        { name: "Logs", icon: "fa-book-open" },
                        { name: "Settings", icon: "fa-gears" },
                    ].map(({ name, icon }) => (
                        <li
                            key={name}
                            className="p-2 rounded-md hover:bg-zinc-900 transition-colors duration-300 hover:text-pink-700 hover:cursor-pointer flex items-center space-x-3"
                            onClick={() => {
                                setCurrentView(name);
                                if (window.innerWidth < 1024) {
                                    toggleMobileMenu();
                                }
                            }}
                        >
                            <i className={`fa-solid ${icon}`}></i>
                            <span>{name}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={toggleMobileMenu}
                ></div>
            )}
        </>
    );
}
export default Sidebar;
