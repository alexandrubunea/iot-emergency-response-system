import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./components/Sidebar";
import Home from "./views/Home";
import Map from "./views/Map";
import Businesses from "./views/Businesses";
import Employees from "./views/Employees";
import Alerts from "./views/LogsView/Alerts";
import Malfunctions from "./views/LogsView/Malfunctions";
import Other from "./views/LogsView/Other";

const queryClient = new QueryClient();

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
            case "Logs/Alerts":
                return <Alerts />;
            case "Logs/Malfunctions":
                return <Malfunctions />;
            case "Logs/Other":
                return <Other />;
            default:
                return <Home />;
        }
    };

    return (
        <QueryClientProvider client={queryClient}>
            <div className="bg-zinc-900 min-h-screen flex flex-col lg:flex-row">
                <Sidebar
                    setCurrentView={setCurrentView}
                    isMobileMenuOpen={isMobileMenuOpen}
                    toggleMobileMenu={toggleMobileMenu}
                />
                <div className="flex-grow overflow-x-hidden">
                    {renderView()}
                </div>
            </div>
        </QueryClientProvider>
    );
}
export default App;
