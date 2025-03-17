import { useState } from "react";
import SecurityDeviceItem from "./SecurityDeviceItem";
import ResetAlertButton from "./ResetAlertButton";
import ResetMalfunctionButton from "./ResetMalfunctionButton";
import ViewLogsButton from "./ViewLogsButton";

type Device = {
    name: string;

    // Sensor Status:
    // -1 = disabled, 0 = offline, 1 = online, 2 = malfunction
    motion: number;
    sound: number;
    fire: number;
    gas: number;
}

type BusinessRowType = {
    name: string;
    address: string;
    lat: number;
    lon: number;
    devices: Array<Device>;
    alert: boolean;
    malfunction: boolean;
};

function BusinessRow({ name, address, lat, lon, devices, alert, malfunction }: BusinessRowType) {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    return (
        <>
            <div className="rounded-md bg-zinc-900 text-zinc-200 p-3">
                <div className="grid grid-cols-12">
                    <div className="col-span-10 md:col-span-11">
                        <h1 className="text-lg md:text-2xl poppins-black">
                            {name}
                        </h1>
                        <div className="flex flex-col poppins-light text-xs md:text-sm">
                            <span>{address}</span>
                            <span>
                                Latitude & Longitude: {lat}, {lon}
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
                        <hr className="my-5"></hr>
                        <h3 className="text-lg poppins-bold">
                            Active security devices
                        </h3>
                        <span className="block text-xs poppins-light">
                            Number of active devices: {devices.length}
                        </span>
                        <ul className="mt-5 flex flex-col space-y-2">
                            {devices.map((device, index) => (
                                <SecurityDeviceItem key={index} name={device.name} motion={device.motion} sound={device.sound} fire={device.fire} gas={device.gas} />
                            ))}
                        </ul>
                        <div className="mt-5 flex flex-col md:flex-row gap-2 items-center">
                            {alert && (
                                <div className="w-full md:w-fit">
                                    <ResetAlertButton />
                                </div>
                            )}
                            {malfunction && (
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
        </>
    );
}
export default BusinessRow;
