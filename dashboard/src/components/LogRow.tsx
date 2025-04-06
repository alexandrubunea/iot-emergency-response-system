import { DeviceLog } from "../types/DeviceLog";

type LogRowProps = {
    log: DeviceLog;
};

function LogRow({ log }: LogRowProps) {
    const getLogIcon = (logType: string) => {
        switch (logType) {
            case "esp32_boot":
                return "fa-microchip";
            case "esp32_online_ping":
                return "fa-signal";
            default:
                return "fa-circle-question";
        }
    };

    return (
        <div className="bg-blue-700/70 rounded-md overflow-hidden shadow-lg border border-blue-900">
            <div className="grid grid-cols-12">
                <div className="col-span-2 border-r-2 border-zinc-100/20 flex justify-center items-center bg-blue-700">
                    <i
                        className={`fa-solid ${getLogIcon(
                            log.log_type
                        )} text-5xl text-indigo-100 m-5`}
                    ></i>
                </div>
                <div className="col-span-10 p-5 bg-blue-600/40">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl poppins-bold text-white flex items-center">
                            {log.business_name}
                            <span className="ml-3 text-xs bg-zinc-950 text-zinc-100 px-3 py-1 rounded-full poppins-medium">
                                {log.log_type
                                    .replace(/_/g, " ")
                                    .toUpperCase()}
                            </span>
                        </h2>
                        <span className="text-indigo-100 poppins-light flex items-center">
                            <i className="fa-regular fa-clock mr-2"></i>
                            {new Date(log.log_time).toLocaleString(
                                "en-US",
                                {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                }
                            )}
                        </span>
                    </div>

                    <div className="mt-4 text-indigo-100 poppins-light flex items-center">
                        <i className="fa-solid fa-tablet-screen-button mr-2"></i>
                        {log.device_name}
                    </div>

                    {log.message && (
                        <div className="mt-4 text-indigo-100 poppins-light flex">
                            <i className="fa-solid fa-message mr-2 mt-1"></i>
                            <p>{log.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LogRow;
