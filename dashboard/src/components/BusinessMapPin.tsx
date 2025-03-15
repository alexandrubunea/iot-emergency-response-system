import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";

type BusinessMapPinProps = {
    name: string;
    lat: number;
    lon: number;

    // Sensor Status:
    // -1 = disabled, 0 = offline, 1 = online
    motion: number;
    sound: number;
    fire: number;
    gas: number;

    alert: boolean;
};

function BusinessMapPin({
    name,
    lat,
    lon,
    motion,
    sound,
    fire,
    gas,
    alert,
}: BusinessMapPinProps) {
    const business_icon = new Icon({
        iconUrl: "/icons/business_icon.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const sensors = [
        { name: "Motion Detection", value: motion, show: motion !== -1 },
        { name: "Sound Detection", value: sound, show: sound !== -1 },
        { name: "Gas Detection", value: gas, show: gas !== -1 },
        { name: "Fire Detection", value: fire, show: fire !== -1 },
    ];

    return (
        <>
            <Marker position={[lat, lon]} icon={business_icon}>
                <Popup>
                    <div className="p-4 bg-zinc-900 text-zinc-200 rounded-lg shadow-md poppins-medium w-56">
                        <h3 className="text-xl poppins-black mb-2">{name}</h3>
                        <ul className="space-y-1">
                            {sensors
                                .filter((sensor) => sensor.show)
                                .map((sensor, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between"
                                    >
                                        <span>{sensor.name}</span>
                                        <span
                                            className={
                                                sensor.value
                                                    ? "text-green-400"
                                                    : "text-red-400"
                                            }
                                        >
                                            {sensor.value
                                                ? "Online"
                                                : "Offline"}
                                        </span>
                                    </li>
                                ))}
                        </ul>
                        <hr className="my-5"></hr>
                        {alert ? (
                            <h3 className="text-red-500 poppins-black uppercase flex flex-row gap-2">
                                <i className="fa-solid fa-land-mine-on text-2xl"></i>
                                <span>
                                    Property on alert. Intervention Required.
                                </span>
                            </h3>
                        ) : (
                            <h3 className="text-green-500 poppins-bold flex flex-row gap-2">
                                <i className="fa-solid fa-shield text-2xl"></i>
                                <span>
                                    Safe property. <br></br>
                                    No action required.
                                </span>
                            </h3>
                        )}
                    </div>
                </Popup>
            </Marker>
        </>
    );
}

export default BusinessMapPin;
