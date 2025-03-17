import StatsCard from "../components/StatsCard";
import StatsGraph from "../components/StatsGraph";

function Home() {
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
                    count={260}
                />
                <StatsCard
                    icon="fa-solid fa-microchip"
                    title="Active Devices"
                    period={0}
                    count={523}
                />
                <StatsCard
                    icon="fa-solid fa-bell"
                    title="Alerts"
                    period={7}
                    count={25}
                />
                <StatsCard
                    icon="fa-solid fa-person-burst"
                    title="Detected Intruders"
                    period={0}
                    count={76}
                />
                <StatsCard
                    icon="fa-solid fa-fire"
                    title="Detected Fires"
                    period={0}
                    count={27}
                />
                <StatsCard
                    icon="fa-solid fa-bug"
                    title="Devices Malfunction"
                    period={30}
                    count={10}
                />
            </div>

            <div className="w-full mt-6 sm:mt-10 p-3 sm:p-5 rounded-lg bg-zinc-800 text-zinc-200 shadow shadow-zinc-950">
                <StatsGraph />
            </div>
        </div>
    );
}
export default Home;
