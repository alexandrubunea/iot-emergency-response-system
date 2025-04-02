import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import DOMPurify from "dompurify";
import { io } from "socket.io-client";
import { Alert } from "../../types/Alert";
import AlertRow from "../../components/AlertRow";
import { createAlertsFromJson } from "../../utils/createObjectsFromJson";

function Alerts() {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;
    const socketRef = useRef(io(import.meta.env.VITE_EXPRESS_API_URL, {
        transports: ["websocket"],
    }));
// NOT WORKING YET
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
            setAlertsData(alerts_json);
            alerts_full.current = alerts_json;
        }
    }, [isSuccess, data]);

    useEffect(() => {
        const socket = socketRef.current;

        socket.on("update-alerts", (alertData: Alert) => {
            setAlertsData((prevAlerts) => {
                const newAlerts = prevAlerts;
                newAlerts.push(alertData);
                alerts_full.current = newAlerts;
                return newAlerts;
            });
            console.log("Received new alert from Flask:", alertData);
        });

        return () => {
            socket.off("update-alerts");
            socket.disconnect();
        };
    }, []);

    const searchBusiness = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let input = DOMPurify.sanitize(inputValue);

        if (input === null || input.length === 0 || !/\S/.test(input)) {
            setAlertsData(alerts_full.current);
            return;
        }

        const searchTerm = input.toLowerCase();
        let alerts_filtered = alerts_full.current.filter((alert) =>
            alert.business_name.toLowerCase().includes(searchTerm)
        );

        setAlertsData(alerts_filtered);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
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

                    {isSuccess && alertsData.length === 0 && (
                        <div className="flex justify-center items-center h-40">
                            <div className="flex flex-col items-center text-center">
                                <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-3"></i>
                                <h2 className="text-xl poppins-bold text-zinc-300">
                                    No alerts found from this business.
                                </h2>
                                <p className="text-zinc-400 mt-2 poppins-light">
                                    Your search did not match any business. Try
                                    adjusting your search terms.
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
                                <AlertRow key={alert._id} alert={alert} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Alerts;
