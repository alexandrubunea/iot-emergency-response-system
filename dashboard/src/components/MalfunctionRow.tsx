import { Malfunction } from "../types/Malfunction";
import { sweetAlert } from "../utils/ui";

type MalfunctionProps = {
    malfunction: Malfunction;
    onSolve: (malfunctionId: number) => void;
};

function MalfunctionRow({ malfunction, onSolve }: MalfunctionProps) {
    const getMalfunctionIcon = (malfunctionType: string) => {
        switch (malfunctionType) {
            case "motion_sensor":
                return "fa-person-walking";
            case "fire_sensor":
                return "fa-fire-flame-curved";
            case "sound_sensor":
                return "fa-volume-high";
            case "gas_sensor":
                return "fa-biohazard";
            default:
                return "fa-circle-question";
        }
    };

    const showConfirmation = (malfunctionID: number) => {
        sweetAlert(
            "Are you sure?",
            "This malfunction will be marked as solved.",
            "warning",
            "Yes, mark as solved",
            "Cancel",
            true,
            true,
            0,
            () => onSolve(malfunctionID),
            null
        );
    };

    return (
        <div className="bg-amber-700/70 rounded-md overflow-hidden shadow-lg border border-amber-900">
            <div className="grid grid-cols-12">
                <div className="col-span-2 border-r-2 border-zinc-100/20 flex justify-center items-center bg-amber-700">
                    <i
                        className={`fa-solid ${getMalfunctionIcon(
                            malfunction.malfunction_type
                        )} text-5xl text-indigo-100 m-5`}
                    ></i>
                </div>
                <div className="col-span-10 p-5 bg-amber-600/40">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl poppins-bold text-white flex items-center">
                            {malfunction.business_name}
                            <span className="ml-3 text-xs bg-zinc-950 text-zinc-100 px-3 py-1 rounded-full poppins-medium">
                                {malfunction.malfunction_type
                                    .replace(/_/g, " ")
                                    .toUpperCase()}
                            </span>
                        </h2>
                        <span className="text-indigo-100 poppins-light flex items-center">
                            <i className="fa-regular fa-clock mr-2"></i>
                            {new Date(malfunction.malfunction_time).toLocaleString(
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
                        {malfunction.device_name}
                    </div>

                    {malfunction.message && (
                        <div className="mt-4 text-indigo-100 poppins-light flex">
                            <i className="fa-solid fa-message mr-2 mt-1"></i>
                            <p>{malfunction.message}</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => showConfirmation(malfunction.id)}
                            className="bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-amber-600 poppins-medium px-4 py-2 rounded-md flex items-center transition-colors duration-200 shadow-md hover:cursor-pointer"
                        >
                            <i className="fa-solid fa-check mr-2"></i>
                            Mark as solved
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MalfunctionRow;
