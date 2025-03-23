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
    const IconAlert = new Icon({
        iconUrl: `/icons/business_icon_alert.png`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const IconWarning = new Icon({
        iconUrl: `/icons/business_icon_warning.png`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const IconNormal = new Icon({
        iconUrl: `/icons/business_icon_normal.png`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });

    const getBusinessIcon = () => {
        if (business.alert)
            return IconAlert;

        if (business.anyBrokenDevice())
            return IconWarning;

        return IconNormal;
    };

    const sensors = [
        {
            name: "Motion Detection",
            value: business.getSensorStatusByType("motion"),
            icon: "fa-person-walking",
        },
        {
            name: "Sound Detection",
            value: business.getSensorStatusByType("sound"),
            icon: "fa-volume-high",
        },
        {
            name: "Gas Detection",
            value: business.getSensorStatusByType("gas"),
            icon: "fa-wind",
        },
        {
            name: "Fire Detection",
            value: business.getSensorStatusByType("fire"),
            icon: "fa-fire",
        },
    ];

    const activeSensors = sensors.filter(
        (sensor) => sensor.value !== SensorStatus.SENSOR_NOT_USED
    );

    const malfunction = business.anyBrokenDevice();

    const getSensorStatusIcon = (status: SensorStatus) => {
        switch (status) {
            case SensorStatus.SENSOR_ONLINE:
                return "fa-circle-check";
            case SensorStatus.SENSOR_MALFUNCTION:
                return "fa-triangle-exclamation";
            case SensorStatus.SENSOR_OFFLINE:
                return "fa-circle-exclamation";
            default:
                return "";
        }
    };

    const getSensorStatusColor = (status: SensorStatus) => {
        switch (status) {
            case SensorStatus.SENSOR_ONLINE:
                return "text-emerald-400";
            case SensorStatus.SENSOR_MALFUNCTION:
                return "text-amber-500";
            case SensorStatus.SENSOR_OFFLINE:
                return "text-red-400";
            default:
                return "";
        }
    };

    return (
        <Marker
            position={[business.lat, business.lon]}
            icon={getBusinessIcon()}
        >
            <Popup>
                <div className="p-4 bg-zinc-900 text-zinc-200 rounded-lg shadow-md poppins-medium w-72">
                    <div
                        className={`-m-4 mb-4 p-3 ${
                            business.alert
                                ? "bg-red-900/70"
                                : malfunction
                                ? "bg-amber-900/50"
                                : "bg-emerald-900/50"
                        } rounded-t-lg`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                                <i
                                    className={`fa-solid ${
                                        business.alert
                                            ? "fa-bell"
                                            : malfunction
                                            ? "fa-triangle-exclamation"
                                            : "fa-building"
                                    } mr-2 ${
                                        business.alert
                                            ? "text-red-400"
                                            : malfunction
                                            ? "text-amber-400"
                                            : "text-emerald-400"
                                    }`}
                                ></i>
                                <h3 className="text-lg poppins-black">
                                    {business.name}
                                </h3>
                            </div>
                            <div
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                    business.alert
                                        ? "bg-red-600"
                                        : malfunction
                                        ? "bg-amber-600"
                                        : "bg-emerald-600"
                                }`}
                            >
                                {business.alert
                                    ? "ALERT"
                                    : malfunction
                                    ? "WARNING"
                                    : "SECURE"}
                            </div>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="flex items-center">
                                <i className="fa-solid fa-shield-halved mr-1"></i>
                                {business.numberOfDevices()} devices
                            </span>
                            <span className="flex items-center">
                                <i className="fa-solid fa-location-dot mr-1"></i>
                                ID: {business.id}
                            </span>
                        </div>
                    </div>

                    {(business.alert || malfunction) && (
                        <div
                            className={`mb-4 p-2 rounded ${
                                business.alert
                                    ? "bg-red-950/50 border border-red-800"
                                    : "bg-amber-950/50 border border-amber-800"
                            }`}
                        >
                            {business.alert && (
                                <div className="text-red-400 poppins-bold flex items-center gap-2 mb-1">
                                    <i className="fa-solid fa-bell"></i>
                                    <span>Security Alert Triggered</span>
                                </div>
                            )}
                            {malfunction && (
                                <div className="text-amber-400 poppins-bold flex items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                    <span>Device Malfunction Detected</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-zinc-800 rounded-lg mb-4">
                        <div className="p-2 border-b border-zinc-700 flex items-center justify-between">
                            <span className="text-sm font-medium flex items-center">
                                <i className="fa-solid fa-diagram-project mr-2 text-zinc-500"></i>
                                Sensor Status
                            </span>
                            <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full">
                                {activeSensors.length} active
                            </span>
                        </div>
                        <ul className="p-2 space-y-1">
                            {activeSensors.map((sensor, index) => (
                                <li
                                    key={index}
                                    className="flex items-center justify-between text-sm p-1 hover:bg-zinc-700 rounded transition-colors"
                                >
                                    <div className="flex items-center">
                                        <i
                                            className={`fa-solid ${sensor.icon} mr-2 text-zinc-500`}
                                        ></i>
                                        {sensor.name}
                                    </div>
                                    <div
                                        className={`flex items-center ${getSensorStatusColor(
                                            sensor.value
                                        )} ${
                                            sensor.value ===
                                                SensorStatus.SENSOR_MALFUNCTION ||
                                            sensor.value ===
                                                SensorStatus.SENSOR_OFFLINE
                                                ? "animate__animated animate__pulse animate__infinite"
                                                : ""
                                        }`}
                                    >
                                        <i
                                            className={`fa-solid ${getSensorStatusIcon(
                                                sensor.value
                                            )} mr-1`}
                                        ></i>
                                        {sensor.value ===
                                        SensorStatus.SENSOR_ONLINE
                                            ? "Online"
                                            : sensor.value ===
                                              SensorStatus.SENSOR_MALFUNCTION
                                            ? "Malfunction"
                                            : "Offline"}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-zinc-800 p-2 rounded">
                                <div className="text-zinc-400 mb-1">
                                    Address
                                </div>
                                <div className="flex items-center">
                                    <i className="fa-solid fa-map-marker-alt mr-1 text-zinc-500"></i>
                                    {business.address || "No address"}
                                </div>
                            </div>
                            <div className="bg-zinc-800 p-2 rounded">
                                <div className="text-zinc-400 mb-1">
                                    Contact
                                </div>
                                <div className="flex items-center">
                                    <i className="fa-solid fa-user mr-1 text-zinc-500"></i>
                                    {business.contactName || "Not provided"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
