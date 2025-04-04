import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import DOMPurify from "dompurify";
import { io } from "socket.io-client";
import { DeviceLog } from "../../types/DeviceLog";
import LogRow from "../../components/LogRow";
import { createLogsFromJson } from "../../utils/createObjectsFromJson";
import Pagination from "../../components/Pagination";

function Other() {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;
    const socketRef = useRef(
        io(API_URL, {
            transports: ["websocket"],
        })
    );

    const resultsPerPage = 10;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [inputValue, setInputValue] = useState("");
    const [displayedLogs, setDisplayedLogs] = useState<DeviceLog[]>([]);
    const original_logs_full = useRef<DeviceLog[]>([]);
    const filtered_logs_full = useRef<DeviceLog[]>([]);

    const { data, isPending, isError, isSuccess } = useQuery({
        queryKey: ["device_logs"],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/api/devices_logs`);
            return response.data;
        },
        staleTime: 5000,
    });

    const updateDisplayedData = (currentPage: number) => {
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        setDisplayedLogs(
            filtered_logs_full.current.slice(startIndex, endIndex)
        );
        setPage(currentPage);
    };

    const applyCurrentFilterAndPaginate = (searchTerm: string) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        if (!searchTerm || !/\S/.test(searchTerm)) {
            filtered_logs_full.current = [...original_logs_full.current];
        } else {
            filtered_logs_full.current = original_logs_full.current.filter(
                (log) =>
                    (log.business_name &&
                        log.business_name
                            .toLowerCase()
                            .includes(lowerCaseSearchTerm)) ||
                    (log.message &&
                        log.message.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        const newTotalPages = Math.ceil(
            filtered_logs_full.current.length / resultsPerPage
        );
        setTotalPages(newTotalPages);
        updateDisplayedData(1);
    };

    useEffect(() => {
        if (isSuccess && data) {
            const logs_json: Array<DeviceLog> = createLogsFromJson(data);
            original_logs_full.current = logs_json;
            applyCurrentFilterAndPaginate(DOMPurify.sanitize(inputValue));
        }
    }, [isSuccess, data]);

    useEffect(() => {
        const socket = socketRef.current;
        const currentSearchTerm = DOMPurify.sanitize(inputValue).toLowerCase();

        const handleUpdateLogs = (logData: DeviceLog) => {
            original_logs_full.current = [
                logData,
                ...original_logs_full.current,
            ];

            if (!currentSearchTerm || !/\S/.test(currentSearchTerm)) {
                filtered_logs_full.current = [...original_logs_full.current];
            } else {
                filtered_logs_full.current = original_logs_full.current.filter(
                    (log) =>
                        (log.business_name &&
                            log.business_name
                                .toLowerCase()
                                .includes(currentSearchTerm)) ||
                        (log.message &&
                            log.message
                                .toLowerCase()
                                .includes(currentSearchTerm))
                );
            }

            const newTotalPages = Math.ceil(
                filtered_logs_full.current.length / resultsPerPage
            );
            setTotalPages(newTotalPages);
            updateDisplayedData(page);
        };

        socket.on("update-device_logs", handleUpdateLogs);

        return () => {
            socket.off("update-device_logs", handleUpdateLogs);
        };
    }, [inputValue, page]);

    const searchLogs = (event?: React.FormEvent<HTMLFormElement>) => {
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

    let content;
    if (isPending) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mb-3"></div>
                    <h2 className="text-xl poppins-bold text-zinc-300">
                        Loading Logs...
                    </h2>
                </div>
            </div>
        );
    } else if (isError) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center text-center">
                    <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-3"></i>
                    <h2 className="text-xl poppins-bold text-zinc-300">
                        There was an error fetching data.
                    </h2>
                    <p className="text-zinc-400 mt-2 poppins-light">
                        We encountered an issue retrieving log data. Please try
                        again later or contact support.
                    </p>
                </div>
            </div>
        );
    } else if (isSuccess && original_logs_full.current.length === 0) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center text-center">
                    <i className="fa-solid fa-file-lines text-3xl text-zinc-500 mb-3"></i>
                    <h2 className="text-xl poppins-bold text-zinc-300">
                        No Recent Logs
                    </h2>
                    <p className="text-zinc-400 mt-2 poppins-light">
                        There are no device logs recorded currently.
                    </p>
                </div>
            </div>
        );
    } else if (isSuccess && filtered_logs_full.current.length === 0) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center text-center">
                    <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-3"></i>
                    <h2 className="text-xl poppins-bold text-zinc-300">
                        No logs found matching your search.
                    </h2>
                    <p className="text-zinc-400 mt-2 poppins-light">
                        Try adjusting your search terms.
                    </p>
                </div>
            </div>
        );
    } else if (isSuccess && displayedLogs.length > 0) {
        content = (
            <div className="space-y-3">
                <h2 className="text-xl domine-bold mb-4">Search Results</h2>
                {displayedLogs.map((log: DeviceLog) => (
                    <LogRow key={log._id || log.id} log={log} />
                ))}
            </div>
        );
    } else {
        content = (
            <div className="flex justify-center items-center h-40">
                <p className="text-zinc-400 mt-2 poppins-light">
                    No logs to display on this page.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                        <h2 className="text-2xl domine-bold">Search Logs</h2>
                    </div>
                    <form
                        method="POST"
                        onSubmit={searchLogs}
                        className="flex flex-col sm:flex-row gap-3"
                    >
                        <input
                            className="flex-grow bg-zinc-700 text-zinc-200 rounded-md text-lg p-3 border border-zinc-600 focus:ring-0 focus:outline-0 placeholder-zinc-400 poppins-light"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Search by Business Name or Log Message..."
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

export default Other;
