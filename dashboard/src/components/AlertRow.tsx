import { Alert } from "../types/Alert";

type AlertRowProps = {
    alert: Alert;
};

function AlertRow({ alert }: AlertRowProps) {
    const getAlertIcon = (alertType: string) => {
        switch (alertType) {
            case "motion_alert":
                return "fa-person-walking";
            case "fire_alert":
                return "fa-fire-flame-curved";
            case "sound_alert":
                return "fa-volume-high";
            case "gas_alert":
                return "fa-biohazard";
            default:
                return "fa-circle-question";
        }
    };

    return (
        <div className="bg-rose-700/70 rounded-md overflow-hidden shadow-lg border border-rose-900">
            <div className="grid grid-cols-12">
                <div className="col-span-2 border-r-2 border-zinc-100/20 flex justify-center items-center bg-rose-700">
                    <i
                        className={`fa-solid ${getAlertIcon(
                            alert.alert_type
                        )} text-5xl text-indigo-100 m-5`}
                    ></i>
                </div>
                <div className="col-span-10 p-5 bg-rose-600/40">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl poppins-bold text-white flex items-center">
                            {alert.business_name}
                            <span className="ml-3 text-xs bg-zinc-950 text-zinc-100 px-3 py-1 rounded-full poppins-medium">
                                {alert.alert_type
                                    .replace(/_/g, " ")
                                    .toUpperCase()}
                            </span>
                        </h2>
                        <span className="text-indigo-100 poppins-light flex items-center">
                            <i className="fa-regular fa-clock mr-2"></i>
                            {new Date(alert.alert_time).toLocaleString(
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
                        {alert.device_name}
                    </div>

                    {alert.message && (
                        <div className="mt-4 text-indigo-100 poppins-light flex">
                            <i className="fa-solid fa-message mr-2 mt-1"></i>
                            <p>{alert.message}</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button className="bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-red-600 poppins-medium px-4 py-2 rounded-md flex items-center transition-colors duration-200 shadow-md hover:cursor-pointer">
                            <i className="fa-solid fa-check mr-2"></i>
                            Mark as solved
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AlertRow;
