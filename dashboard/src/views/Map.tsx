import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import BusinessMapPin from "../components/BusinessMapPin";
import CarMapPin from "../components/CarMapPin";

function Map() {
    // will be removed after api implementation
    const mockup_businesses = [
        {
            name: "The Pharma",
            lat: 45.6549781,
            lon: 25.6017911,
            motion: 1,
            sound: 1,
            fire: 1,
            gas: 1,
            alert: true,
        },
        {
            name: "Some Restaurant",
            lat: 45.6541784,
            lon: 25.6145364,
            motion: 1,
            sound: 1,
            fire: -1,
            gas: 1,
            alert: false,
        },
        {
            name: "Pizza? Ok",
            lat: 45.6592795,
            lon: 25.5984613,
            motion: 1,
            sound: 1,
            fire: 0,
            gas: 1,
            alert: true,
        },
        {
            name: "Hospital",
            lat: 45.6482229,
            lon: 25.6010333,
            motion: 1,
            sound: 1,
            fire: 1,
            gas: 1,
            alert: false,
        },
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
                maxZoom={20}
                zoomControl={false}
                className="h-screen w-full poppins-regular"
            >
                <TileLayer
                    attribution="&copy; Stadia Maps & OpenStreetMap contributors"
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                />
                <ZoomControl position="bottomright" />
                {mockup_businesses.map((business, index) => (
                    <BusinessMapPin
                        key={index}
                        name={business.name}
                        lon={business.lon}
                        lat={business.lat}
                        motion={business.motion}
                        sound={business.sound}
                        fire={business.fire}
                        gas={business.gas}
                        alert={business.alert}
                    />
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
