import DOMPurify from "dompurify";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "../types/Employee";
import { createEmployeesFromJson } from "../utils/createObjectsFromJson";
import { sweetAlert } from "../utils/ui";
import EmployeeRow from "./EmployeeRow";
import Pagination from "../components/Pagination";

type EmployeesListProps = {
    toggleFunction: () => void;
};

function EmployeesList({ toggleFunction }: EmployeesListProps) {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;

    const resultsPerPage = 3;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [inputValue, setInputValue] = useState("");
    const [displayedEmployees, setDisplayedEmployees] = useState<Employee[]>(
        []
    );
    const original_employees_full = useRef<Employee[]>([]);
    const filtered_employees_full = useRef<Employee[]>([]);

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
        staleTime: 5000,
    });

    const updateDisplayedData = (currentPage: number) => {
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        setDisplayedEmployees(
            filtered_employees_full.current.slice(startIndex, endIndex)
        );
        setPage(currentPage);
    };

    const applyCurrentFilterAndPaginate = (searchTerm: string) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        if (!searchTerm || !/\S/.test(searchTerm)) {
            filtered_employees_full.current = [
                ...original_employees_full.current,
            ];
        } else {
            filtered_employees_full.current =
                original_employees_full.current.filter((employee) => {
                    return (
                        employee.first_name
                            .toLowerCase()
                            .includes(lowerCaseSearchTerm) ||
                        employee.last_name
                            .toLowerCase()
                            .includes(lowerCaseSearchTerm) ||
                        employee.email
                            .toLowerCase()
                            .includes(lowerCaseSearchTerm) ||
                        employee.phone
                            .toLowerCase()
                            .includes(lowerCaseSearchTerm)
                    );
                });
        }

        const newTotalPages = Math.ceil(
            filtered_employees_full.current.length / resultsPerPage
        );
        setTotalPages(newTotalPages);

        updateDisplayedData(1);
    };

    useEffect(() => {
        if (isSuccess && data) {
            const employees_json: Array<Employee> =
                createEmployeesFromJson(data);
            original_employees_full.current = employees_json;
            applyCurrentFilterAndPaginate(DOMPurify.sanitize(inputValue));
        }
    }, [isSuccess, data]);

    const searchEmployee = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) {
            event.preventDefault();
        }
        const sanitizedInput = DOMPurify.sanitize(inputValue);
        applyCurrentFilterAndPaginate(sanitizedInput);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            updateDisplayedData(newPage);
        }
    };

    const onRemoveEmployee = (id: number) => {
        axios
            .delete(`${API_URL}/api/employees/${id}`)
            .then((res) => {
                if (res.status !== 200) {
                    throw new Error("Error removing employee");
                }

                original_employees_full.current =
                    original_employees_full.current.filter(
                        (employee) => employee.id !== id
                    );
                filtered_employees_full.current =
                    filtered_employees_full.current.filter(
                        (employee) => employee.id !== id
                    );

                const newTotalPages = Math.ceil(
                    filtered_employees_full.current.length / resultsPerPage
                );
                setTotalPages(newTotalPages);

                let nextPage = page;
                if (page > newTotalPages) {
                    nextPage = Math.max(1, newTotalPages);
                }

                updateDisplayedData(nextPage);

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

    let content;
    if (isPending) {
        content = (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent"></div>
                <h3 className="text-xl poppins-bold text-zinc-300">
                    Loading Employees...
                </h3>
            </div>
        );
    } else if (isError) {
        content = (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-4"></i>
                <h3 className="text-xl poppins-bold text-zinc-300">
                    Error Fetching Employees
                </h3>
                <p className="text-zinc-400 text-base max-w-md">
                    We encountered an issue retrieving employee data. Please try
                    again later or contact support.
                </p>
            </div>
        );
    } else if (isSuccess && original_employees_full.current.length === 0) {
        content = (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <i className="fa-solid fa-users-slash text-3xl text-zinc-500 mb-4"></i>
                <h3 className="text-xl poppins-bold text-zinc-300">
                    No employees added yet
                </h3>
                <p className="text-zinc-400 text-base max-w-md">
                    Click the "Add a new employee" button to get started.
                </p>
            </div>
        );
    } else if (isSuccess && filtered_employees_full.current.length === 0) {
        content = (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-4"></i>
                <h3 className="text-xl poppins-bold text-zinc-300">
                    No employees found
                </h3>
                <p className="text-zinc-400 text-base max-w-md">
                    Your search did not match any employees. Try adjusting your
                    search terms.
                </p>
            </div>
        );
    } else if (isSuccess && displayedEmployees.length > 0) {
        content = (
            <div className="space-y-3">
                <h2 className="text-xl domine-bold mb-4">Search Results</h2>
                {displayedEmployees.map((employee) => (
                    <EmployeeRow
                        key={`${employee.id}-${employee.last_name}`}
                        employee={employee}
                        onRemove={() => onRemoveEmployee(employee.id)}
                    />
                ))}
            </div>
        );
    } else {
        content = (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                <p className="text-zinc-400 text-base max-w-md">
                    No employees to display on this page.
                </p>
            </div>
        );
    }

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
                    {content}
                </div>

                {isSuccess && totalPages > 1 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        handlePageChange={handlePageChange}
                    />
                )}
            </div>
        </>
    );
}

export default EmployeesList;
