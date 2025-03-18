import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SecurityDeviceItem from "./SecurityDeviceItem";
import ResetAlertButton from "./ResetAlertButton";
import ResetMalfunctionButton from "./ResetMalfunctionButton";
import ViewLogsButton from "./ViewLogsButton";
import { Business } from "../models/Business";
import BusinessRowTitle from "./BusinessRowTitle";

type BusinessRowProps = {
    business: Business;
};

function BusinessRow({ business }: BusinessRowProps) {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const malfunction = business.anyBrokenDevice();

    return (
        <div className="rounded-md bg-zinc-900 text-zinc-200 p-3">
            <div className="grid grid-cols-12">
                <div className="col-span-10 md:col-span-11">
                    <BusinessRowTitle
                        text={business.name}
                        malfunction={malfunction}
                        alert={business.alert}
                    />
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
                        <motion.i
                            className="fa-solid fa-chevron-down"
                            animate={{ rotate: showDetails ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        ></motion.i>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <hr className="my-4" />
                        <h3 className="text-lg poppins-bold">
                            Active security devices
                        </h3>
                        <span className="block text-xs poppins-light">
                            Number of devices: {business.devices.length}
                        </span>
                        <ul className="mt-4 flex flex-col space-y-2">
                            {business.devices.map((device) => (
                                <SecurityDeviceItem
                                    key={device.key}
                                    device={device}
                                />
                            ))}
                        </ul>
                        <div className="mt-4 flex flex-col md:flex-row gap-2 items-center">
                            {business.alert && (
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
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default BusinessRow;
