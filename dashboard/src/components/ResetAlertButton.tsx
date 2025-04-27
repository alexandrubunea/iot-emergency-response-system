import { sweetAlert } from "../utils/ui";
import axios from "axios";

type ResetAlertButtonProps = {
    businessId: number;
    onReset: () => void;
};

function ResetAlertButton({ businessId, onReset }: ResetAlertButtonProps) {
    const resetAlert = () => {
        const API_URL = import.meta.env.VITE_EXPRESS_API_URL;

        axios
            .post(`${API_URL}/api/solve_business_alerts/${businessId}`)
            .then(() => {
                sweetAlert(
                    "Success!",
                    "All alerts for this business have been reset.",
                    "success",
                    "",
                    "",
                    false,
                    false,
                    3000,
                    null,
                    null
                );

                onReset();
            })
            .catch(() => {
                sweetAlert(
                    "Error!",
                    "An error occurred while resetting the alerts.",
                    "error",
                    "",
                    "",
                    false,
                    false,
                    3000,
                    null,
                    null
                );
            });
    };

    const showConfirmation = () => {
        sweetAlert(
            "Are you sure?",
            "This action will reset all the alerts for this business.",
            "warning",
            "Yes, reset it!",
            "No, cancel!",
            true,
            true,
            0,
            resetAlert,
            null
        );
    };

    return (
        <>
            <button
                onClick={showConfirmation}
                type="button"
                className="rounded-md p-3 w-full uppercase poppins-bold hover:cursor-pointer text-zinc-200 bg-amber-700 hover:bg-amber-900 active:bg-amber-950  transition-colors duration-300 flex flex-row items-center justify-center space-x-2"
            >
                <i className="fa-solid fa-bell-slash"></i>
                <span>Reset Alert</span>
            </button>
        </>
    );
}

export default ResetAlertButton;
