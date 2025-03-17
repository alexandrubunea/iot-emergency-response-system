import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";

type CarMapPinProps = {
    license_plate: string;
    lat: number;
    lon: number;
};

function CarMapPin({ license_plate, lat, lon }: CarMapPinProps) {
    const business_icon = new Icon({
        iconUrl: "/icons/car_icon.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    return (
        <>
            <Marker position={[lat, lon]} icon={business_icon}>
                <Popup>
                    <div className="p-4 bg-zinc-900 text-zinc-200 rounded-lg shadow-md poppins-medium w-56 flex items-center justfiy-center">
                        <h3 className="text-xl poppins-black mx-auto text-center">
                            {license_plate}
                        </h3>
                    </div>
                </Popup>
            </Marker>
        </>
    );
}

export default CarMapPin;
