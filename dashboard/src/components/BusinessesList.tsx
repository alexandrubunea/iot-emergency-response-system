import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import axios from "axios";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import BusinessRow from "../components/BusinessRow";
import { Business } from "../models/Business";
import { createBusinessesFromJson } from "../utils/createObjectsFromJson";
import { sweetAlert } from "../utils/ui";
import { Alert } from "../types/Alert";
import Pagination from "../components/Pagination";

type BusinesesListProps = {
    toggleFunction: () => void;
};

function BusinesesList({ toggleFunction }: BusinesesListProps) {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;
    const socketRef = useRef(
        io(import.meta.env.VITE_EXPRESS_API_URL, {
            transports: ["websocket"],
        })
    );

    const resultsPerPage = 10;
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const [inputValue, setInputValue] = useState("");
    const [displayedBusinesses, setDisplayedBusinesses] = useState<Business[]>(
        []
    );
    const original_businesses_full = useRef<Business[]>([]);
    const filtered_businesses_full = useRef<Business[]>([]);

    const { data, isPending, isError, isSuccess } = useQuery({
        queryKey: ["businesses"],
        queryFn: async () => {
            const response = await axios.get(`${API_URL}/api/businesses`);
            return response.data;
        },
        staleTime: 5000,
    });

    const updateDisplayedData = (currentPage: number) => {
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        setDisplayedBusinesses(
            filtered_businesses_full.current.slice(startIndex, endIndex)
        );
        setPage(currentPage);
    };

    const applyCurrentFilterAndPaginate = (searchTerm: string) => {
        if (!searchTerm || !/\S/.test(searchTerm)) {
            filtered_businesses_full.current = [
                ...original_businesses_full.current,
            ];
        } else {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered_businesses_full.current =
                original_businesses_full.current.filter((business) =>
                    business.name.toLowerCase().includes(lowerCaseSearchTerm)
                );
        }

        const newTotalPages = Math.ceil(
            filtered_businesses_full.current.length / resultsPerPage
        );
        setTotalPages(newTotalPages);

        updateDisplayedData(1);
    };

    useEffect(() => {
        if (isSuccess && data) {
            const businesses_json: Array<Business> =
                createBusinessesFromJson(data);
            original_businesses_full.current = businesses_json;
            applyCurrentFilterAndPaginate(inputValue);
        }
    }, [isSuccess, data]);

    useEffect(() => {
        const socket = socketRef.current;

        const handleUpdateAlerts = (alertData: Alert) => {
            const updateBusinessInstance = (business: Business): Business => {
                if (business.id === alertData.business_id && !business.alert) {
                    return new Business(
                        business.id,
                        business.key,
                        business.name,
                        business.address,
                        business.lat,
                        business.lon,
                        business.devices,
                        true,
                        business.contactName,
                        business.contactPhone,
                        business.contactEmail
                    );
                }
                return business;
            };

            original_businesses_full.current =
                original_businesses_full.current.map(updateBusinessInstance);
            filtered_businesses_full.current =
                filtered_businesses_full.current.map(updateBusinessInstance);

            updateDisplayedData(page);
        };

        socket.on("update-alerts", handleUpdateAlerts);

        return () => {
            socket.off("update-alerts", handleUpdateAlerts);
        };
    }, [page]);

    const searchBusiness = (event?: React.FormEvent<HTMLFormElement>) => {
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

    const onRemoveBusiness = (id: number) => {
        axios
            .delete(`${API_URL}/api/businesses/${id}`)
            .then((res) => {
                if (res.status !== 200) {
                    throw new Error("Error removing business");
                }

                original_businesses_full.current =
                    original_businesses_full.current.filter(
                        (business) => business.id !== id
                    );
                filtered_businesses_full.current =
                    filtered_businesses_full.current.filter(
                        (business) => business.id !== id
                    );

                const newTotalPages = Math.ceil(
                    filtered_businesses_full.current.length / resultsPerPage
                );
                setTotalPages(newTotalPages);

                let nextPage = page;
                if (page > newTotalPages) {
                    nextPage = Math.max(1, newTotalPages);
                }

                updateDisplayedData(nextPage);

                sweetAlert(
                    "Business removed",
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
                    "There was an error removing the business.",
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
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mb-3"></div>
                    <h2 className="text-xl poppins-bold text-zinc-300">
                        Loading Businesses...
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
                        We encountered an issue retrieving business data. Please
                        try again later or contact support.
                    </p>
                </div>
            </div>
        );
    } else if (isSuccess && original_businesses_full.current.length === 0) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center text-center">
                    <i className="fa-solid fa-store-slash text-3xl text-zinc-500 mb-3"></i>
                    <h2 className="text-xl poppins-bold text-zinc-300">
                        No businesses added yet.
                    </h2>
                    <p className="text-zinc-400 mt-2 poppins-light">
                        Click the "Add business profile" button to get started.
                    </p>
                </div>
            </div>
        );
    } else if (isSuccess && filtered_businesses_full.current.length === 0) {
        content = (
            <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center text-center">
                    <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-3"></i>
                    <h2 className="text-xl poppins-bold text-zinc-300">
                        No businesses found.
                    </h2>
                    <p className="text-zinc-400 mt-2 poppins-light">
                        Your search did not match any business. Try adjusting
                        your search terms.
                    </p>
                </div>
            </div>
        );
    } else if (isSuccess && displayedBusinesses.length > 0) {
        content = (
            <div className="space-y-3">
                <h2 className="text-xl domine-bold mb-4">Search Results</h2>
                {displayedBusinesses.map((business) => (
                    <BusinessRow
                        key={business.key}
                        business={business}
                        onRemove={() => onRemoveBusiness(business.id)}
                    />
                ))}
            </div>
        );
    } else {
        content = (
            <div className="flex justify-center items-center h-40">
                <p className="text-zinc-400 mt-2 poppins-light">
                    No businesses to display on this page.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                        <h2 className="text-2xl domine-bold">
                            Search Business
                        </h2>
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

                <div className="rounded-lg bg-zinc-800 text-zinc-200 p-5 shadow-md">
                    <div className="flex items-center mb-3">
                        <h2 className="text-2xl domine-bold">
                            A new customer?
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={toggleFunction}
                        className="flex items-center space-x-2 px-4 py-3 rounded-md poppins-bold uppercase bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 transition-colors duration-300 hover:cursor-pointer"
                    >
                        <i className="fa-solid fa-square-plus"></i>
                        <span>Add business profile</span>
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

export default BusinesesList;
