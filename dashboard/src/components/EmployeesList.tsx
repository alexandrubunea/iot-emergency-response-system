import DOMPurify from "dompurify";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "../types/Employee";
import { createEmployeesFromJson } from "../utils/createObjectsFromJson";
import { sweetAlert } from "../utils/ui";
import EmployeeRow from "./EmployeeRow";

type EmployeesListProps = {
    toggleFunction: () => void;
};

function EmployeesList({ toggleFunction }: EmployeesListProps) {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;

    const { isPending, isError, isSuccess, data } = useQuery({
        queryKey: ["employeesData"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_URL}/api/employees`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(
                        `Error ${response.status}: ${response.statusText}`
                    );
                }

                return response.json();
            } catch (error) {
                console.error("Failed to fetch employees:", error);
                throw error;
            }
        },
    });

    const [inputValue, setInputValue] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const employees_full = useRef<Employee[]>([]);

    useEffect(() => {
        if (isSuccess && data) {
            const employees_json: Array<Employee> =
                createEmployeesFromJson(data);
            setEmployees(employees_json);
            employees_full.current = employees_json;
        }
    }, [isSuccess, data]);

    const searchEmployee = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let input = DOMPurify.sanitize(inputValue);

        if (input === null || input.length === 0 || !/\S/.test(input)) {
            setEmployees(employees_full.current);
            return;
        }

        let filteredEmployees = employees_full.current.filter((employee) => {
            return (
                employee.first_name
                    .toLowerCase()
                    .includes(input.toLowerCase()) ||
                employee.last_name
                    .toLowerCase()
                    .includes(input.toLowerCase()) ||
                employee.email.toLowerCase().includes(input.toLowerCase()) ||
                employee.phone.toLowerCase().includes(input.toLowerCase())
            );
        });

        setEmployees(filteredEmployees);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const onRemoveEmployee = (id: number) => {
        axios
            .delete(`${API_URL}/api/employees/${id}`)
            .then((res) => {
                if (res.status !== 200) {
                    throw new Error("Error removing employee");
                }

                const newEmployees = employees.filter(
                    (employee) => employee.id !== id
                );
                setEmployees(newEmployees);
                employees_full.current = newEmployees;

                sweetAlert(
                    "Employee removed",
                    "",
                    "success",
                    "",
                    "",
                    false,
                    false,
                    2000,
                    null,
                    null
                );
            })
            .catch(() => {
                sweetAlert(
                    "Error",
                    "There was an error removing the employee.",
                    "error",
                    "",
                    "",
                    false,
                    false,
                    2000,
                    null,
                    null
                );
            });
    };

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 space-y-6 text-zinc-200">
                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                        <h2 className="text-2xl domine-bold">
                            Search Employee
                        </h2>
                    </div>
                    <form
                        method="POST"
                        onSubmit={searchEmployee}
                        className="flex flex-col sm:flex-row gap-3"
                    >
                        <input
                            className="flex-grow bg-zinc-700 text-zinc-200 rounded-md text-lg p-3 border border-zinc-600 focus:ring-0 focus:outline-0 placeholder-zinc-400 poppins-light"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Search by Name, Email or Phone"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-md poppins-bold uppercase bg-pink-600 hover:bg-pink-700 active:bg-pink-800 transition-colors duration-300 whitespace-nowrap hover:cursor-pointer flex flex-row space-x-2 items-center"
                        >
                            <i className="fa-solid fa-magnifying-glass mr-2"></i>
                            <span>Search</span>
                        </button>
                    </form>
                </div>

                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                        <h2 className="text-2xl domine-bold">
                            A new employee?
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={toggleFunction}
                        className="flex items-center space-x-2 px-4 py-3 rounded-md poppins-bold uppercase bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 transition-colors duration-300 hover:cursor-pointer"
                    >
                        <i className="fa-solid fa-square-plus"></i>
                        <span>Add a new employee</span>
                    </button>
                </div>

                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md min-h-40">
                    {isPending && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent"></div>
                            <h3 className="text-xl poppins-bold text-zinc-300">
                                Loading Employees...
                            </h3>
                        </div>
                    )}

                    {isError && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                            <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-4"></i>
                            <h3 className="text-xl poppins-bold text-zinc-300">
                                Error Fetching Employees
                            </h3>
                            <p className="text-zinc-400 text-base max-w-md">
                                We encountered an issue retrieving employee
                                data. Please try again later or contact support.
                            </p>
                        </div>
                    )}

                    {isSuccess && employees.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                            <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-4"></i>
                            <h3 className="text-xl poppins-bold text-zinc-300">
                                No employees found
                            </h3>
                            <p className="text-zinc-400 text-base max-w-md">
                                Your search did not match any employees. Try
                                adjusting your search terms or adding a new
                                employee.
                            </p>
                        </div>
                    )}

                    {isSuccess && employees.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xl domine-bold mb-4">
                                Search Results
                            </h2>
                            {employees.map((employee) => (
                                <EmployeeRow
                                    key={
                                        employee.id +
                                        employee.last_name +
                                        employee.first_name
                                    }
                                    employee={employee}
                                    onRemove={() =>
                                        onRemoveEmployee(employee.id)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default EmployeesList;
