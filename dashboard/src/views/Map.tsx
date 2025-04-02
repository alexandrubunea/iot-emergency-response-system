import { useEffect, useState } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import BusinessMapPin from "../components/BusinessMapPin";
import CarMapPin from "../components/CarMapPin";
import { Business } from "../models/Business";
import { useQuery } from "@tanstack/react-query";
import { createBusinessesFromJson } from "../utils/createObjectsFromJson";

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

    const [businesses, setBusinesses] = useState<Business[]>([]);

    useEffect(() => {
        if (isSuccess && data) {
            const businesses_json: Array<Business> =
                createBusinessesFromJson(data);
            setBusinesses(businesses_json);
        }
    }, [isSuccess, data]);

    const mockup_cars = [
        {
            license_plate: "BV02WSC",
            lat: 45.6563613,
            lon: 25.6199825,
        },
        {
            license_plate: "BV17WSC",
            lat: 45.6602945,
            lon: 25.5972262,
        },
        {
            license_plate: "BV66WSC",
            lat: 45.6644987,
            lon: 25.5791601,
        },
        {
            license_plate: "BV05WSC",
            lat: 45.6728155,
            lon: 25.6051891,
        },
    ];

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
                {mockup_cars.map((car, index) => (
                    <CarMapPin
                        key={index}
                        license_plate={car.license_plate}
                        lon={car.lon}
                        lat={car.lat}
                    />
                ))}
            </MapContainer>
        </>
    );
}

export default Map;
