import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import BusinessRow from "../components/BusinessRow";
import { Business } from "../models/Business";
import { createBusinessesFromJson } from "../utils/createObjectsFromJson";
import { sweetAlert } from "../utils/ui";

type BusinesesListProps = {
    toggleFunction: () => void;
};

function BusinesesList({ toggleFunction }: BusinesesListProps) {
    const API_URL = import.meta.env.VITE_EXPRESS_API_URL;

    const { isPending, isError, isSuccess, data } = useQuery({
        queryKey: ["businessesData"],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_URL}/api/businesses`, {
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
                console.error("Failed to fetch businesses:", error);
                throw error;
            }
        },
    });

    const [inputValue, setInputValue] = useState("");
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const businesses_full = useRef<Business[]>([]);

    useEffect(() => {
        if (isSuccess && data) {
            const businesses_json: Array<Business> =
                createBusinessesFromJson(data);
            setBusinesses(businesses_json);
            businesses_full.current = businesses_json;
        }
    }, [isSuccess, data]);

    const searchBusiness = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let input = DOMPurify.sanitize(inputValue);

        if (input === null || input.length === 0 || !/\S/.test(input)) {
            setBusinesses(businesses_full.current);
            return;
        }

        let business_filtred = businesses.filter((business) =>
            business.name
                .toLocaleLowerCase()
                .includes(inputValue.toLocaleLowerCase())
        );

        setBusinesses(business_filtred);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    const onRemoveBusiness = (id: number) => {
        axios
            .delete(`${API_URL}/api/businesses/${id}`)
            .then((res) => {
                if (res.status !== 200) {
                    throw new Error("Error removing business");
                }

                const newBusinesses = businesses.filter(
                    (business) => business.id !== id
                );
                setBusinesses(newBusinesses);
                businesses_full.current = newBusinesses;

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
                    {isPending && (
                        <div className="flex justify-center items-center h-40">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mb-3"></div>
                                <h2 className="text-xl poppins-bold text-zinc-300">
                                    Loading Businesses...
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
                                    We encountered an issue retrieving business
                                    data. Please try again later or contact
                                    support.
                                </p>
                            </div>
                        </div>
                    )}

                    {isSuccess && businesses.length === 0 && (
                        <div className="flex justify-center items-center h-40">
                            <div className="flex flex-col items-center text-center">
                                <i className="fa-solid fa-face-frown text-3xl text-zinc-500 mb-3"></i>
                                <h2 className="text-xl poppins-bold text-zinc-300">
                                    No businesses found.
                                </h2>
                                <p className="text-zinc-400 mt-2 poppins-light">
                                    Your search did not match any business. Try
                                    adjusting your search terms or adding a new
                                    business.
                                </p>
                            </div>
                        </div>
                    )}

                    {isSuccess && businesses.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xl domine-bold mb-4">
                                Search Results
                            </h2>
                            {businesses.map((business) => (
                                <BusinessRow
                                    key={business.key}
                                    business={business}
                                    onRemove={() =>
                                        onRemoveBusiness(business.id)
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

export default BusinesesList;
