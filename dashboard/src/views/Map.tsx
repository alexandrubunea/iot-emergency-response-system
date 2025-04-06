import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import BusinessMapPin from "../components/BusinessMapPin";
import { Business } from "../models/Business";
import { useQuery } from "@tanstack/react-query";
import { createBusinessesFromJson } from "../utils/createObjectsFromJson";
import { io } from "socket.io-client";
import { Alert } from "../types/Alert";
import { Malfunction } from "../types/Malfunction";
import { Device } from "../models/Device";
import { SensorStatus } from "../types/Device";

function Map() {
    const { isSuccess, data } = useQuery({
        queryKey: ["businessesData"],
        queryFn: async () => {
            try {
                const API_URL = import.meta.env.VITE_EXPRESS_API_URL;
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
    const socketRef = useRef(
        io(import.meta.env.VITE_EXPRESS_API_URL, {
            transports: ["websocket"],
        })
    );

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

            setBusinesses((prevBusinesses) =>
                prevBusinesses.map(updateBusinessInstance)
            );
        };

        const handleUpdateMalfunctions = (malfunctionData: Malfunction) => {
            const updateDeviceInstance = (device: Device): Device => {
                if (device.id === malfunctionData.device_id) {
                    return new Device(
                        device.id,
                        device.key,
                        device.name,
                        malfunctionData.malfunction_type === "motion_sensor"
                            ? SensorStatus.SENSOR_MALFUNCTION
                            : device.motion_sensor,
                        malfunctionData.malfunction_type === "sound_sensor"
                            ? SensorStatus.SENSOR_MALFUNCTION
                            : device.sound_sensor,
                        malfunctionData.malfunction_type === "fire_sensor"
                            ? SensorStatus.SENSOR_MALFUNCTION
                            : device.fire_sensor,
                        malfunctionData.malfunction_type === "gas_sensor"
                            ? SensorStatus.SENSOR_MALFUNCTION
                            : device.gas_sensor
                    );
                }

                return device;
            };

            const updateBusinessInstance = (business: Business): Business => {
                if (business.id === malfunctionData.business_id) {
                    const updatedDevices =
                        business.devices.map(updateDeviceInstance);

                    return new Business(
                        business.id,
                        business.key,
                        business.name,
                        business.address,
                        business.lat,
                        business.lon,
                        updatedDevices,
                        business.alert,
                        business.contactName,
                        business.contactPhone,
                        business.contactEmail
                    );
                }
                return business;
            };

            setBusinesses((prevBusinesses) =>
                prevBusinesses.map(updateBusinessInstance)
            );
        };

        socket.on("update-alerts", handleUpdateAlerts);
        socket.on("update-malfunctions", handleUpdateMalfunctions);

        return () => {
            socket.off("update-alerts", handleUpdateAlerts);
            socket.off("update-malfunctions", handleUpdateMalfunctions);
        };
    }, []);

    const [businesses, setBusinesses] = useState<Business[]>([]);

    useEffect(() => {
        if (isSuccess && data) {
            const businesses_json: Array<Business> =
                createBusinessesFromJson(data);
            setBusinesses(businesses_json);
        }
    }, [isSuccess, data]);

    return (
        <>
            <MapContainer
                center={[45.655, 25.608]}
                zoom={15}
                scrollWheelZoom={true}
                doubleClickZoom={false}
                minZoom={15}
                zoomControl={false}
                className="h-screen w-full poppins-regular"
            >
                <TileLayer
                    attribution="&copy; Stadia Maps & OpenStreetMap contributors"
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                />
                <ZoomControl position="bottomright" />
                {businesses.map((business) => (
                    <BusinessMapPin key={business.key} business={business} />
                ))}
            </MapContainer>
        </>
    );
}

export default Map;
