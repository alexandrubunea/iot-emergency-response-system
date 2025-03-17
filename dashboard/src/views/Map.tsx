import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import BusinessMapPin from "../components/BusinessMapPin";
import CarMapPin from "../components/CarMapPin";
import { Business } from "../models/Business";
import { Device } from "../models/Device";
import { SensorStatus } from "../types/Device";

function Map() {
    // will be removed after api implementation
    const businesses = [
        new Business(
            "The Pharma",
            "Some Street, Number 7",
            45.6549781,
            25.6017911,
            [
                new Device(
                    "Bathroom",
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_ONLINE
                ),
            ],
            true,
        ),
        new Business(
            "Some Restaurant",
            "Some Street, Number 7",
            45.6541784,
            25.6145364,
            [
                new Device(
                    "Bathroom",
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_MALFUNCTION,
                    SensorStatus.SENSOR_NOT_USED,
                    SensorStatus.SENSOR_ONLINE
                ),
            ],
            false,
        ),
        new Business(
            "Pizza? Ok",
            "Some Street, Number 7",
            45.6592795,
            25.5984613,
            [
                new Device(
                    "Bathroom",
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_OFFLINE,
                    SensorStatus.SENSOR_MALFUNCTION
                ),
            ],
            true,
        ),
        new Business(
            "Hospital",
            "Some Street, Number 7",
            45.6482229,
            25.6010333,
            [
                new Device(
                    "Bathroom",
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_ONLINE,
                    SensorStatus.SENSOR_ONLINE
                ),
            ],
            false,
        ),
    ];

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
                {businesses.map((business, index) => (
                    <BusinessMapPin key={index} business={business} />
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
