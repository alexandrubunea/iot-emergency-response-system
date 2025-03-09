type StatsCardProps = {
    icon: string;
    title: string;
    period: number;
    count: number;
};

function StatsCard({ icon, title, period, count }: StatsCardProps) {
    return (
        <div
            className="bg-zinc-800 rounded-lg p-3 flex space-x-3
            shadow shadow-zinc-950 hover:text-pink-700 hover:cursor-pointer
            transition-all duration-300 w-full sm:w-64 md:w-72 lg:w-80
            hover:shadow-lg hover:shadow-zinc-900"
        >
            <i
                className={`${icon} text-zinc-200 text-xl sm:text-2xl lg:text-3xl flex-shrink-0`}
            ></i>
            <div className="flex flex-col space-y-1">
                <span className="text-lg sm:text-xl lg:text-2xl poppins-thin">
                    {title}
                    <div className="text-xs md:text-sm">
                        {period ? " / " + period + " days" : ""}
                    </div>
                </span>
                <span className="text-md md:text-lg lg:text-xl poppins-bold">
                    {count}
                </span>
            </div>
        </div>
    );
}
export default StatsCard;
