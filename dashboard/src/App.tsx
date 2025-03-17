import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./views/Home";
import Map from "./views/Map";
import Businesses from "./views/Businesses";
import Employees from "./views/Employees";
import Logs from "./views/Logs";
import Settings from "./views/Settings";

function App() {
    const [currentView, setCurrentView] = useState("Home");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const renderView = () => {
        switch (currentView) {
            case "Home":
                return <Home />;
            case "Map":
                return <Map />;
            case "Businesses":
                return <Businesses />;
            case "Employees":
                return <Employees />;
            case "Logs":
                return <Logs />;
            case "Settings":
                return <Settings />;
            default:
                return <Home />;
        }
    };

    return (
        <div className="bg-zinc-900 min-h-screen flex flex-col lg:flex-row">
            <Sidebar
                setCurrentView={setCurrentView}
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={toggleMobileMenu}
            />
            <div className="flex-grow overflow-x-hidden">{renderView()}</div>
        </div>
    );
}
export default App;
