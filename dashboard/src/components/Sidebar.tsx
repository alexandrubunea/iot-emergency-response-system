import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SidebarItem = {
    name: string;
    icon: string;
    items?: SidebarSubItem[];
    view?: string;
};

type SidebarSubItem = {
    name: string;
    icon: string;
    view?: string;
};

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
    const sideBarOptions: SidebarItem[] = [
        { name: "Home", icon: "fa-house", view: "Home" },
        { name: "Map", icon: "fa-map-location-dot", view: "Map" },
        { name: "Businesses", icon: "fa-briefcase", view: "Businesses" },
        { name: "Employees", icon: "fa-users", view: "Employees" },
        {
            name: "Logs",
            icon: "fa-book-open",
            items: [
                { name: "Alerts", icon: "fa-bell", view: "Logs/Alerts" },
                {
                    name: "Malfunctions",
                    icon: "fa-bug",
                    view: "Logs/Malfunctions",
                },
                {
                    name: "Other",
                    icon: "fa-solid fa-circle-question",
                    view: "Logs/Other",
                },
            ],
        },
        { name: "Settings", icon: "fa-gears", view: "Settings" },
    ];

    const [openDropdowns, setOpenDropdowns] = useState<{
        [key: string]: boolean;
    }>({});

    const toggleDropdown = (name: string) => {
        setOpenDropdowns((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const [isMobileDevice, setIsMobileDevice] = useState(
        window.innerWidth < 1024
    );

    useEffect(() => {
        const handleResize = () => {
            setIsMobileDevice(window.innerWidth < 1024);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const handleItemClick = (item: SidebarItem | SidebarSubItem) => {
        if (item.view) {
            setCurrentView(item.view);

            if (isMobileDevice) {
                toggleMobileMenu();
            }
        }
    };

    const sidebarVariants = {
        hidden: {
            x: "-100%",
            transition: {
                type: "tween",
                duration: 0.3,
            },
        },
        visible: {
            x: 0,
            transition: {
                type: "tween",
                duration: 0.3,
            },
        },
    };

    const dropdownVariants = {
        closed: {
            y: 0,
            height: 0,
            opacity: 0,
            transition: {
                duration: 0.3,
            },
        },
        open: {
            y:10,
            height: "auto",
            opacity: 1,
            transition: {
                duration: 0.3,
            },
        },
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="lg:hidden fixed top-4 left-4 z-[999] bg-zinc-800 p-2 rounded-md text-zinc-200"
                onClick={toggleMobileMenu}
            >
                <i
                    className={`fa-solid ${
                        isMobileMenuOpen ? "fa-xmark" : "fa-bars"
                    }`}
                ></i>
            </motion.button>

            <motion.div
                initial={isMobileDevice ? "hidden" : "visible"}
                animate={
                    isMobileDevice
                        ? isMobileMenuOpen
                            ? "visible"
                            : "hidden"
                        : "visible"
                }
                variants={sidebarVariants}
                className={`
                    bg-zinc-800 text-zinc-200 fixed lg:relative z-[998]
                    min-w-64 min-h-screen px-3 py-5
                    overflow-y-auto
                `}
            >
                <div className="flex flex-col items-center mb-10">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl domine-black"
                    >
                        WatchSec
                    </motion.h1>
                    <motion.h5
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-sm domine-thin"
                    >
                        Keeps you safe.
                    </motion.h5>
                </div>

                <ul className="text-lg flex flex-col space-y-2 poppins-light">
                    {sideBarOptions.map((item) => (
                        <li key={item.name} className="group">
                            <motion.div
                                className="flex justify-between items-center rounded-md p-2 transition-colors duration-300 hover:bg-zinc-900 hover:text-pink-600 hover:cursor-pointer"
                                onClick={() => {
                                    if (!item.items) {
                                        handleItemClick(item);
                                    } else {
                                        toggleDropdown(item.name);
                                    }
                                }}
                            >
                                <div className="flex items-center space-x-3">
                                    <i className={`fa-solid ${item.icon}`}></i>
                                    <span>{item.name}</span>
                                </div>

                                {item.items && (
                                    <motion.div
                                        animate={{
                                            rotate: openDropdowns[item.name]
                                                ? 180
                                                : 0,
                                        }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <i className="fa-solid fa-chevron-down text-sm"></i>
                                    </motion.div>
                                )}
                            </motion.div>

                            {item.items && (
                                <AnimatePresence>
                                    {openDropdowns[item.name] && (
                                        <motion.ul
                                            initial="closed"
                                            animate="open"
                                            exit="closed"
                                            variants={dropdownVariants}
                                            className="pl-8 space-y-2 overflow-hidden"
                                        >
                                            {item.items.map((subItem) => (
                                                <motion.li
                                                    key={subItem.name}
                                                    onClick={() =>
                                                        handleItemClick(subItem)
                                                    }
                                                    className="flex items-center space-x-3 cursor-pointer hover:text-pink-600 transition-all duration-300 hover:translate-x-2"
                                                >
                                                    <i
                                                        className={`fa-solid ${subItem.icon} text-sm`}
                                                    ></i>
                                                    <span>{subItem.name}</span>
                                                </motion.li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>
                            )}
                        </li>
                    ))}
                </ul>
            </motion.div>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-[997] lg:hidden"
                        onClick={toggleMobileMenu}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default Sidebar;
