import React, { useState } from "react";
import DOMPurify from "dompurify";
import BusinessRow from "../components/BusinessRow";

function Businesses() {
    const [isInvalidSearch, setInvalidSearch] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const searchBusiness = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let input = DOMPurify.sanitize(inputValue);

        if (input === null || input.length === 0 || !/\S/.test(input)) {
            setInvalidSearch(true);
            setTimeout(() => {
                setInvalidSearch(false);
            }, 1000);

            return;
        }

        // To be implemented...
        console.log(input);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };

    // Mock-up data... Will be removed.
    const businesses = [
        {
            name: "The Pharma",
            lat: 45.6549781,
            lon: 25.6017911,
            address: "Some Street, Number 7",
            alert: true,
            malfunction: false,
            devices: [
                {
                    name: "Bathroom",
                    motion: 1,
                    sound: 1,
                    fire: 1,
                    gas: 1,
                },
            ],
        },
        {
            name: "Some Restaurant",
            lat: 45.6541784,
            lon: 25.6145364,
            address: "Some Street, Number 7",
            alert: false,
            malfunction: true,
            devices: [
                {
                    name: "Bathroom",
                    motion: 1,
                    sound: 2,
                    fire: -1,
                    gas: 1,
                },
            ],
        },
        {
            name: "Pizza? Ok",
            lat: 45.6592795,
            lon: 25.5984613,
            address: "Some Street, Number 7",
            alert: true,
            malfunction: true,
            devices: [
                {
                    name: "Bathroom",
                    motion: 1,
                    sound: 1,
                    fire: 0,
                    gas: 2,
                },
            ],
        },
        {
            name: "Hospital",
            lat: 45.6482229,
            lon: 25.6010333,
            address: "Some Street, Number 7",
            alert: false,
            malfunction: false,
            devices: [
                {
                    name: "Bathroom",
                    motion: 1,
                    sound: 1,
                    fire: 1,
                    gas: 1,
                },
            ],
        },
    ];

    return (
        <>
            <div className="p-5 flex flex-col space-y-5">
                <div
                    className={`w-full rounded-lg bg-zinc-800 text-zinc-200 p-3 ${
                        isInvalidSearch
                            ? "animate__animated animate__shakeX"
                            : ""
                    }`}
                >
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
                    {businesses.map((business, index) => (
                        <BusinessRow
                            key={index}
                            name={business.name}
                            address={business.address}
                            lat={business.lat}
                            lon={business.lon}
                            devices={business.devices}
                            alert={business.alert}
                            malfunction={business.malfunction}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

export default Businesses;
