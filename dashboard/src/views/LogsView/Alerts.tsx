import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import DOMPurify from "dompurify";
import { io } from "socket.io-client";
import { Alert } from "../../types/Alert";
import AlertRow from "../../components/AlertRow";
import { createAlertsFromJson } from "../../utils/createObjectsFromJson";
import Pagination from "../../components/Pagination";
import { sweetAlert } from "../../utils/ui";

function Alerts() {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;
    const socketRef = useRef(
        io(import.meta.env.VITE_EXPRESS_API_URL, {
            transports: ["websocket"],
        })
    );
    const resultsPerPage = 10;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const { data, isPending, isError, isSuccess } = useQuery({
        queryKey: ["alerts"],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/api/alerts`);
            return response.data;
        },
        staleTime: 5000,
    });

    const [inputValue, setInputValue] = useState("");
    const [alertsData, setAlertsData] = useState<Alert[]>([]);
    const alerts_full = useRef<Alert[]>([]);

    useEffect(() => {
        if (isSuccess && data) {
            const alerts_json: Array<Alert> = createAlertsFromJson(data);
            alerts_full.current = alerts_json;
            setTotalPages(Math.ceil(alerts_json.length / resultsPerPage));
            setPage(1);
            setAlertsData(alerts_json.slice(0, resultsPerPage));
        }
    }, [isSuccess, data]);

    const applyCurrentFilter = () => {
        const searchTerm = DOMPurify.sanitize(inputValue).toLowerCase();
        if (!searchTerm || !/\S/.test(searchTerm)) {
            setTotalPages(
                Math.ceil(alerts_full.current.length / resultsPerPage)
            );
            setPage(1);
            setAlertsData(alerts_full.current.slice(0, resultsPerPage));
            return;
        }

        const filtered = alerts_full.current.filter((alert) =>
            alert.business_name.toLowerCase().includes(searchTerm)
        );

        setTotalPages(Math.ceil(filtered.length / resultsPerPage));
        setPage(1);
        setAlertsData(filtered.slice(0, resultsPerPage));
    };

    useEffect(() => {
        const socket = socketRef.current;

        socket.on("update-alerts", (alertData: Alert) => {
            alerts_full.current = [alertData, ...alerts_full.current];

            applyCurrentFilter();
        });

        return () => {
            socket.off("update-alerts");
        };
    }, [inputValue]);

    const searchBusiness = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) {
            event.preventDefault();
        }

        applyCurrentFilter();
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);

        setAlertsData(() => {
            const startIndex = (newPage - 1) * resultsPerPage;
            const endIndex = startIndex + resultsPerPage;
            return alerts_full.current.slice(startIndex, endIndex);
        });
    };

    const onDelete = (alertId: number) => {
        axios
            .post(`${API_URL}/api/solve_alert/${alertId}`)
            .then(() => {
                alerts_full.current = alerts_full.current.filter(
                    (alert) => alert.id !== alertId
                );

                const newTotalPages = Math.ceil(alerts_full.current.length / resultsPerPage);
                setTotalPages(newTotalPages);

                if (page > newTotalPages) {
                    handlePageChange(Math.max(1, newTotalPages));
                } else {
                    handlePageChange(page);
                }

                sweetAlert(
                    "Alert Solved",
                    "The alert has been marked as solved.",
                    "success",
                    "",
                    "",
                    false,
                    false,
                    3000,
                    null,
                    null
                );
            })
            .catch(() => {
                sweetAlert(
                    "Error",
                    "There was an error marking the alert as solved.",
                    "error",
                    "",
                    "",
                    false,
                    false,
                    5000,
                    null,
                    null
                );
            });
    };

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                        <h2 className="text-2xl domine-bold">Search Alerts</h2>
                    </div>
                    <form
                        method="POST"
                        onSubmit={searchBusiness}
                        className="flex flex-col sm:flex-row gap-3"
                    >
                        <input
                            className="flex-grow bg-zinc-700 text-zinc-200 rounded-md text-lg p-3 border border-zinc-600 focus:ring-0 focus:outline-0 placeholder-zinc-400 poppins-light"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Business Name..."
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
                    {isPending && (
                        <div className="flex justify-center items-center h-40">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mb-3"></div>
                                <h2 className="text-xl poppins-bold text-zinc-300">
                                    Loading Alerts...
                                </h2>
                            </div>
                        </div>
                    )}

                    {isError && (
                        <div className="flex justify-center items-center h-40">
                            <div className="flex flex-col items-center text-center">
                                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-3"></i>
                                <h2 className="text-xl poppins-bold text-zinc-300">
                                    There was an error fetching data.
                                </h2>
                                <p className="text-zinc-400 mt-2 poppins-light">
                                    We encountered an issue retrieving alerts
                                    data. Please try again later or contact
                                    support.
                                </p>
                            </div>
                        </div>
                    )}

                    {isSuccess &&
                        alerts_full.current.length > 0 &&
                        alertsData.length === 0 && (
                            <div className="flex justify-center items-center h-40">
                                <div className="flex flex-col items-center text-center">
                                    <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-3"></i>
                                    <h2 className="text-xl poppins-bold text-zinc-300">
                                        No alerts found from this business.
                                    </h2>
                                    <p className="text-zinc-400 mt-2 poppins-light">
                                        Your search did not match any business.
                                        Try adjusting your search terms.
                                    </p>
                                </div>
                            </div>
                        )}

                    {isSuccess && alerts_full.current.length === 0 && (
                        <div className="flex justify-center items-center h-40">
                            <div className="flex flex-col items-center text-center">
                                <i className="fa-solid fa-shield-heart text-3xl text-emerald-400 mb-3"></i>
                                <h2 className="text-xl poppins-bold text-zinc-300">
                                    Hoooooooooray!
                                </h2>
                                <p className="text-zinc-400 mt-2 poppins-light">
                                    No alerts found. You are safe for now. Keep
                                    up the good work!
                                </p>
                            </div>
                        </div>
                    )}

                    {isSuccess && alertsData.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xl domine-bold mb-4">
                                Search Results
                            </h2>
                            {alertsData.map((alert: Alert) => (
                                <AlertRow key={alert._id} alert={alert} onDelete={() => onDelete(alert.id)} />
                            ))}
                        </div>
                    )}
                </div>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    handlePageChange={handlePageChange}
                />
            </div>
        </>
    );
}

export default Alerts;
