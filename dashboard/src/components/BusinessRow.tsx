import { useState } from "react";
import SecurityDeviceItem from "./SecurityDeviceItem";
import ResetAlertButton from "./ResetAlertButton";
import ResetMalfunctionButton from "./ResetMalfunctionButton";
import ViewLogsButton from "./ViewLogsButton";
import { Business } from "../models/Business";

type BusinessRowProps = {
    business: Business;
};

function BusinessRow({ business }: BusinessRowProps) {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    return (
        <div className="rounded-md bg-zinc-900 text-zinc-200 p-3">
            <div className="grid grid-cols-12">
                <div className="col-span-10 md:col-span-11">
                    <h1 className="text-lg md:text-2xl poppins-black">
                        {business.name}
                    </h1>
                    <div className="flex flex-col poppins-light text-xs md:text-sm">
                        <span>{business.address}</span>
                        <span>
                            Latitude & Longitude: {business.lat}, {business.lon}
                        </span>
                    </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                    <div
                        className="text-md md:text-lg bg-zinc-800 p-5 rounded-sm hover:cursor-pointer h-15 flex items-center justify-center"
                        onClick={toggleDetails}
                    >
                        <i
                            className={
                                showDetails
                                    ? "fa-solid fa-chevron-up"
                                    : "fa-solid fa-chevron-down"
                            }
                        ></i>
                    </div>
                </div>
            </div>
            {showDetails && (
                <div className="animate__animated animate__faster animate__fadeIn">
                    <hr className="my-4" />
                    <h3 className="text-lg poppins-bold">
                        Active security devices
                    </h3>
                    <span className="block text-xs poppins-light">
                        Number of devices: {business.devices.length}
                    </span>
                    <ul className="mt-4 flex flex-col space-y-2">
                        {business.devices.map((device, index) => (
                            <SecurityDeviceItem key={index} device={device} />
                        ))}
                    </ul>
                    <div className="mt-4 flex flex-col md:flex-row gap-2 items-center">
                        {business.alert && (
                            <div className="w-full md:w-fit">
                                <ResetAlertButton />
                            </div>
                        )}
                        {business.malfunction && (
                            <div className="w-full md:w-fit">
                                <ResetMalfunctionButton />
                            </div>
                        )}
                        <div className="w-full md:w-fit">
                            <ViewLogsButton />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BusinessRow;
