import { Employee } from "../types/Employee";
import { sweetAlert } from "../utils/ui";

type EmployeeRowProps = {
    employee: Employee;
    onRemove?: (employeeId: number) => void;
};

function EmployeeRow({ employee, onRemove }: EmployeeRowProps) {
    const showConfirmation = () =>
        sweetAlert(
            "Are you sure?",
            "This action is irreversible.",
            "question",
            "Yes",
            "No",
            true,
            true,
            0,
            () => {
                if (onRemove) onRemove(employee.id);
            },
            null
        );

    const formattedDate = new Date(employee.created_at).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );

    return (
        <>
            <div className="rounded-md bg-zinc-900 text-zinc-200border border-zinc-800 shadow-lg hover:border-zinc-700 transition-colors">
                <div className="grid grid-cols-12">
                    <div className="col-span-11 p-5">
                        <h1 className="text-2xl poppins-bold">
                            {employee.first_name} {employee.last_name}
                        </h1>
                        <hr className="my-2 border-zinc-800" />
                        <p className="text-sm poppins-light flex flex-row space-x-2 items-center text-zinc-400">
                            <i className="fa-solid fa-envelope"></i>
                            <span>{employee.email}</span>
                        </p>
                        <p className="text-sm poppins-light flex flex-row space-x-2 items-center text-zinc-400">
                            <i className="fa-solid fa-phone"></i>
                            <span>{employee.phone}</span>
                        </p>
                        <p className="text-sm poppins-light flex flex-row space-x-2 items-center text-zinc-400">
                            <i className="fa-solid fa-calendar-days"></i>
                            <span>{formattedDate}</span>
                        </p>
                    </div>
                    <div
                        onClick={() => showConfirmation()}
                        className="col-span-1 p-5 rounded-tr-md rounded-br-md text-red-500 hover:text-red-800 bg-zinc-950 hover:cursor-pointer transition-colors flex justify-center items-center duration-300"
                    >
                        <i className="fa-solid fa-trash text-xl"></i>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EmployeeRow;
