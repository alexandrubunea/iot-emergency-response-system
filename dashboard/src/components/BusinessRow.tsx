import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SecurityDeviceItem from "./SecurityDeviceItem";
import ResetAlertButton from "./ResetAlertButton";
import ResetMalfunctionButton from "./ResetMalfunctionButton";
import ViewLogsButton from "./ViewLogsButton";
import { Business } from "../models/Business";
import { Device } from "../models/Device";
import BusinessRowTitle from "./BusinessRowTitle";
import { sweetAlert } from "../utils/ui";
import DeleteButton from "./DeleteButton";

type BusinessRowProps = {
    business: Business;
    onRemove?: (businessId: number) => void;
};

function BusinessRow({ business, onRemove }: BusinessRowProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);

    useEffect(() => {
        setDevices(business.devices);
    }, [business.devices]);

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const malfunction = business.anyBrokenDevice();

    const showConfirmation = () =>
        sweetAlert(
            "Are you sure?",
            "This action is irreversible. All the devices attached to this business will be deleted too!",
            "question",
            "Yes",
            "No",
            true,
            true,
            0,
            () => {
                if (onRemove) onRemove(business.id);
            },
            null
        );

    const onRemoveDevice = (deviceId: number) => {
        const API_URL = import.meta.env.VITE_API_URL;
        axios
            .delete(`${API_URL}/api/devices/${deviceId}`)
            .then((res) => {
                if (res.status !== 200) {
                    throw new Error("Error removing device");
                }

                const updatedDevices = devices.filter(
                    (device) => device.id !== deviceId
                );
                setDevices(updatedDevices);

                sweetAlert(
                    "Device removed",
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
                    "An error occurred while trying to remove the device. Please try again later.",
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
        <div className="rounded-md bg-zinc-900 text-zinc-200 p-4 border border-zinc-800 shadow-lg hover:border-zinc-700 transition-all">
            <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-10 md:col-span-11">
                    <div className="flex items-center">
                        <BusinessRowTitle
                            text={business.name}
                            malfunction={malfunction}
                            alert={business.alert}
                        />
                    </div>
                    <div className="flex flex-col poppins-light text-xs md:text-sm text-zinc-400 mt-1">
                        <div className="flex items-center">
                            <i className="fa-solid fa-location-dot mr-1"></i>
                            <span>{business.address}</span>
                        </div>
                        <div className="flex items-center">
                            <i className="fa-solid fa-map-pin mr-1"></i>
                            <span>
                                Latitude & Longitude: {business.lat},{" "}
                                {business.lon}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                    <div
                        className="text-md md:text-lg bg-zinc-800 p-3 rounded hover:cursor-pointer h-10 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        onClick={toggleDetails}
                        aria-label={
                            showDetails ? "Hide details" : "Show details"
                        }
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
                        <hr className="my-4 border-zinc-800" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg poppins-bold flex items-center mb-2">
                                    <i className="fa-solid fa-circle-info mr-2 text-blue-400"></i>
                                    About the business
                                </h3>
                                <ul className="poppins-light space-y-2 bg-zinc-800 p-3 rounded">
                                    <li className="flex items-center">
                                        <i className="fa-solid fa-fingerprint w-6 text-zinc-500"></i>
                                        ID:{" "}
                                        <span className="text-rose-400 ml-1">
                                            {business.id}
                                        </span>
                                    </li>
                                    {business.contactName &&
                                        business.contactName.length && (
                                            <li className="flex items-center">
                                                <i className="fa-solid fa-user w-6 text-zinc-500"></i>
                                                Contact:{" "}
                                                <span className="text-rose-400 ml-1">
                                                    {business.contactName}
                                                </span>
                                            </li>
                                        )}
                                    {business.contactPhone &&
                                        business.contactPhone.length && (
                                            <li className="flex items-center">
                                                <i className="fa-solid fa-phone w-6 text-zinc-500"></i>
                                                Phone:{" "}
                                                <span className="text-rose-400 ml-1">
                                                    {business.contactPhone}
                                                </span>
                                            </li>
                                        )}
                                    {business.contactEmail &&
                                        business.contactEmail.length && (
                                            <li className="flex items-center">
                                                <i className="fa-solid fa-envelope w-6 text-zinc-500"></i>
                                                Email:{" "}
                                                <span className="text-rose-400 ml-1">
                                                    {business.contactEmail}
                                                </span>
                                            </li>
                                        )}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg poppins-bold flex items-center mb-2">
                                    <i className="fa-solid fa-shield-halved mr-2 text-green-400"></i>
                                    Active security devices
                                    <span className="ml-2 text-xs bg-zinc-800 px-2 py-1 rounded-full">
                                        {devices.length}
                                    </span>
                                </h3>
                                <ul className="mt-2 flex flex-col space-y-2">
                                    {devices.map((device) => (
                                        <SecurityDeviceItem
                                            key={device.key}
                                            device={device}
                                            onRemove={() =>
                                                onRemoveDevice(device.id)
                                            }
                                        />
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3 items-stretch">
                            {business.alert && <ResetAlertButton />}
                            {malfunction && <ResetMalfunctionButton />}
                            <ViewLogsButton />
                            <DeleteButton
                                text="Delete Business"
                                showConfirmation={showConfirmation}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default BusinessRow;
