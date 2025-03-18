import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import BusinessRow from "../components/BusinessRow";
import { Business } from "../models/Business";
import { useQuery } from "@tanstack/react-query";
import { createBusinessesFromJson } from "../utils/createObjectsFromJson";

function Businesses() {
    const { isPending, isError, isSuccess, data } = useQuery({
        queryKey: ["businessesData"],
        queryFn: async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL;
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

    useEffect(() => {
        if (isSuccess && data) {
            const businesses_json: Array<Business> = createBusinessesFromJson(data);
            setBusinesses(businesses_json);
        }
    }, [isSuccess, data]);

    const searchBusiness = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let input = DOMPurify.sanitize(inputValue);

        if (input === null || input.length === 0 || !/\S/.test(input)) {
            setBusinesses(businesses);
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

    return (
        <>
            <div className="p-5 flex flex-col space-y-5">
                <div className="w-full rounded-lg bg-zinc-800 text-zinc-200 p-3">
                    <div className="flex space-x-2 items-center text-2xl">
                        <i className="fa-solid fa-magnifying-glass text"></i>
                        <span className="domine-bold text">
                            Search Business
                        </span>
                    </div>
                    <form
                        method="POST"
                        onSubmit={searchBusiness}
                        className="mt-3 flex flex-col space-x-3"
                    >
                        <input
                            className="w-full bg-transparent text-xl poppins-regular p-3 outline-0 border-0 active:outline-0"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Business Name..."
                        ></input>
                        <button
                            type="submit"
                            className="p-3 rounded-md poppins-bold uppercase bg-pink-700 hover:bg-pink-900 transition-colors duration-300 hover:cursor-pointer min-w-fit w-1/8"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="flex flex-col space-y-3 bg-zinc-800 rounded-lg p-3">
                    {isPending && (
                        <h1 className="text-3xl poppins-black text-zinc-300 uppercase my-10">
                            Please wait...
                        </h1>
                    )}
                    {isError && (
                        <h1 className="text-3xl poppins-black text-zinc-300 uppercase my-10">
                            There was an error trying to fetch data.
                        </h1>
                    )}
                    {isSuccess && businesses.length === 0 && (
                        <h1 className="text-3xl poppins-black text-zinc-300 uppercase my-10">
                            No businesses found.
                        </h1>
                    )}
                    {isSuccess &&
                        businesses.map((business) => (
                            <BusinessRow key={business.key} business={business} />
                        ))}
                </div>
            </div>
        </>
    );
}

export default Businesses;
