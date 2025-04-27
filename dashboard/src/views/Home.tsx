import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import StatsCard from "../components/StatsCard";
import StatsGraph from "../components/StatsGraph";

function Home() {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["stats"],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/api/stats`);
            if (!response.data || typeof response.data !== "object") {
                throw new Error("Invalid data format received");
            }

            return response.data.data;
        },
        staleTime: 5000,
    });

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 md:p-10 text-zinc-200 w-full text-center">
                Loading dashboard data...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 sm:p-6 md:p-10 text-red-500 w-full text-center">
                Error fetching stats:{" "}
                {error instanceof Error
                    ? error.message
                    : "An unknown error occurred"}
            </div>
        );
    }

    const stats = {
        clients: data?.clients ?? 0,
        activeDevices: data?.activeDevices ?? 0,
        alerts: data?.alerts ?? 0,
        detectedIntruders: data?.detectedIntruders ?? 0,
        detectedFires: data?.detectedFires ?? 0,
        devicesMalfunction: data?.deviceMalfunctions ?? 0,
    };

    return (
        <div className="p-4 sm:p-6 md:p-10 text-zinc-200 w-full">
            <h1 className="text-2xl sm:text-3xl domine-bold mt-12 lg:mt-0">
                Dashboard
            </h1>

            <div className="mt-6 sm:mt-10 flex flex-wrap justify-center gap-5">
                <StatsCard
                    icon="fa-solid fa-users"
                    title="Clients"
                    period={0}
                    count={stats.clients}
                />
                <StatsCard
                    icon="fa-solid fa-microchip"
                    title="Active Devices"
                    period={0}
                    count={stats.activeDevices}
                />
                <StatsCard
                    icon="fa-solid fa-bell"
                    title="Alerts"
                    period={7}
                    count={stats.alerts}
                />
                <StatsCard
                    icon="fa-solid fa-person-burst"
                    title="Detected Intruders"
                    period={0}
                    count={stats.detectedIntruders}
                />
                <StatsCard
                    icon="fa-solid fa-fire"
                    title="Detected Fires"
                    period={0}
                    count={stats.detectedFires}
                />
                <StatsCard
                    icon="fa-solid fa-bug"
                    title="Devices Malfunction"
                    period={30}
                    count={stats.devicesMalfunction}
                />
            </div>

            <div className="w-full mt-6 sm:mt-10 p-3 sm:p-5 rounded-lg bg-zinc-800 text-zinc-200 shadow shadow-zinc-950">
                <StatsGraph />
            </div>
        </div>
    );
}
export default Home;
