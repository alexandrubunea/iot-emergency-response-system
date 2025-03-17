import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import ResetAlertButton from "./ResetAlertButton";
import ResetMalfunctionButton from "./ResetMalfunctionButton";
import ViewLogsButton from "./ViewLogsButton";
import { Business } from "../models/Business";
import { SensorStatus } from "../types/Device";

type BusinessMapPinProps = {
    business: Business;
};

function BusinessMapPin({ business }: BusinessMapPinProps) {
    const business_icon = new Icon({
        iconUrl: "/icons/business_icon.png",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const sensors = [
        {
            name: "Motion Detection",
            value: business.getSensorStatusByType("motion"),
        },
        {
            name: "Sound Detection",
            value: business.getSensorStatusByType("sound"),
        },
        {
            name: "Gas Detection",
            value: business.getSensorStatusByType("gas")
        },
        {
            name: "Fire Detection",
            value: business.getSensorStatusByType("fire"),
        },
    ];

    const malfunction:boolean = business.anyBrokenDevice();

    return (
        <Marker
            position={[business.lat, business.lon]}
            icon={business_icon}
        >
            <Popup>
                <div className="p-4 bg-zinc-900 text-zinc-200 rounded-lg shadow-md poppins-medium w-64">
                    <div className="flex flex-col mb-4">
                        <h3 className="text-xl poppins-black">
                            {business.name}
                        </h3>
                        <span className="text-xs poppins-light">
                            Number of devices: {business.numberOfDevices()}
                        </span>
                    </div>
                    <ul className="space-y-1">
                        {sensors
                            .filter(
                                (sensor) =>
                                    sensor.value !==
                                    SensorStatus.SENSOR_NOT_USED
                            )
                            .map((sensor, index) => (
                                <li key={index} className="flex items-center justify-between">
                                    <span>{sensor.name}</span>
                                    <span
                                        className={
                                            sensor.value === SensorStatus.SENSOR_ONLINE
                                                ? "text-green-400"
                                                : sensor.value === SensorStatus.SENSOR_MALFUNCTION
                                                ? "text-amber-500 animate__animated animate__pulse animate__infinite"
                                                : "text-red-400 animate__animated animate__pulse animate__infinite"
                                        }
                                    >
                                        {sensor.value === SensorStatus.SENSOR_ONLINE
                                            ? "Online"
                                            : sensor.value === SensorStatus.SENSOR_MALFUNCTION
                                            ? "Malfunction"
                                            : "Offline"}
                                    </span>
                                </li>
                            ))}
                    </ul>
                    <hr className="my-4" />
                    <div className="flex flex-col space-y-2">
                        {business.alert ? (
                            <h3 className="text-red-500 poppins-black uppercase flex flex-row gap-2">
                                <i className="fa-solid fa-land-mine-on text-2xl"></i>
                                <span>
                                    Property on alert. Intervention required.
                                </span>
                            </h3>
                        ) : (
                            <h3 className="text-green-500 poppins-bold flex flex-row gap-2">
                                <i className="fa-solid fa-shield text-2xl"></i>
                                <span>
                                    Safe property. No action required.
                                </span>
                            </h3>
                        )}
                        {malfunction && (
                            <h3 className="text-orange-500 poppins-black uppercase flex flex-row gap-2">
                                <i className="fa-solid fa-bug text-2xl"></i>
                                <span>
                                    WARNING: A device has a malfunction.
                                </span>
                            </h3>
                        )}
                    </div>
                    <div className="mt-4 flex flex-col space-y-2 items-center">
                        {business.alert && <ResetAlertButton />}
                        {malfunction && <ResetMalfunctionButton />}
                        <ViewLogsButton />
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

export default BusinessMapPin;
