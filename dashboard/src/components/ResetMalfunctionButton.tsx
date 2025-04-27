import axios from "axios";
import { sweetAlert } from "../utils/ui";

type ResetMalfunctionButtonProps = {
    bussinessId: number;
    onReset: () => void;
};

function ResetMalfunctionButton({
    bussinessId,
    onReset,
}: ResetMalfunctionButtonProps) {
    const resetMalfunction = () => {
        const API_URL = import.meta.env.VITE_EXPRESS_API_URL;

        axios
            .post(`${API_URL}/api/solve_business_malfunctions/${bussinessId}`)
            .then(() => {
                sweetAlert(
                    "Success!",
                    "All malfunctions for this business have been reset.",
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
                    "An error occurred while resetting the malfunctions.",
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
            "This action will reset all the malfunctions for this business.",
            "warning",
            "Yes, reset it!",
            "No, cancel!",
            true,
            true,
            0,
            resetMalfunction,
            null
        );
    };

    return (
        <>
            <button
                onClick={showConfirmation}
                type="button"
                className="rounded-md p-3 w-full uppercase poppins-bold hover:cursor-pointer text-zinc-200 bg-teal-700 hover:bg-teal-900 active:bg-teal-950 transition-colors duration-300 flex flex-row items-center justify-center space-x-2"
            >
                <i className="fa-solid fa-bug-slash"></i>
                <span>Reset Malfunction</span>
            </button>
        </>
    );
}

export default ResetMalfunctionButton;
