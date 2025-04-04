import { Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import ResetAlertButton from "./ResetAlertButton";
import ResetMalfunctionButton from "./ResetMalfunctionButton";
import { Business } from "../models/Business";
import { SensorStatus } from "../types/Device";
import { useEffect, useState } from "react";

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
        if (getAlertStatus) return IconAlert;

        if (getMalfunctionStatus) return IconWarning;

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

    const [getAlertStatus, setAlertStatus] = useState(business.alert);
    const [getMalfunctionStatus, setMalfunctionStatus] = useState(
        business.anyBrokenDevice()
    );

    useEffect(() => {
        setAlertStatus(business.alert);
        setMalfunctionStatus(business.anyBrokenDevice());
    }
    , [business]);

    const getSensorStatusIcon = (status: SensorStatus) => {
        switch (status) {
            case SensorStatus.SENSOR_HEALTHY:
                return "fa-circle-check";
            case SensorStatus.SENSOR_MALFUNCTION:
                return "fa-triangle-exclamation";
            default:
                return "";
        }
    };

    const getSensorStatusColor = (status: SensorStatus) => {
        switch (status) {
            case SensorStatus.SENSOR_HEALTHY:
                return "text-emerald-400";
            case SensorStatus.SENSOR_MALFUNCTION:
                return "text-amber-500";
            default:
                return "";
        }
    };

    const alertReset = () => {
        setAlertStatus(false);
    };

    const malfunctionReset = () => {
        setMalfunctionStatus(false);
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
                            getAlertStatus
                                ? "bg-red-900/70"
                                : getMalfunctionStatus
                                ? "bg-amber-900/50"
                                : "bg-emerald-900/50"
                        } rounded-t-lg`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                                <i
                                    className={`fa-solid ${
                                        getAlertStatus
                                            ? "fa-bell"
                                            : getMalfunctionStatus
                                            ? "fa-triangle-exclamation"
                                            : "fa-building"
                                    } mr-2 ${
                                        getAlertStatus
                                            ? "text-red-400"
                                            : getMalfunctionStatus
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
                                    getAlertStatus
                                        ? "bg-red-600"
                                        : getMalfunctionStatus
                                        ? "bg-amber-600"
                                        : "bg-emerald-600"
                                }`}
                            >
                                {getAlertStatus
                                    ? "ALERT"
                                    : getMalfunctionStatus
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

                    {(getAlertStatus || getMalfunctionStatus) && (
                        <div
                            className={`mb-4 p-2 rounded ${
                                getAlertStatus
                                    ? "bg-red-950/50 border border-red-800"
                                    : "bg-amber-950/50 border border-amber-800"
                            }`}
                        >
                            {getAlertStatus && (
                                <div className="text-red-400 poppins-bold flex items-center gap-2 mb-1">
                                    <i className="fa-solid fa-bell"></i>
                                    <span>Security Alert Triggered</span>
                                </div>
                            )}
                            {getMalfunctionStatus && (
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
                                            SensorStatus.SENSOR_MALFUNCTION
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
                                        SensorStatus.SENSOR_HEALTHY
                                            ? "Healthy"
                                            : sensor.value ===
                                              SensorStatus.SENSOR_MALFUNCTION
                                            ? "Malfunction"
                                            : ""}
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
                        {getAlertStatus && (
                            <ResetAlertButton
                                businessId={business.id}
                                onReset={alertReset}
                            />
                        )}
                        {getMalfunctionStatus && (
                            <ResetMalfunctionButton
                                bussinessId={business.id}
                                onReset={malfunctionReset}
                            />
                        )}
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

export default BusinessMapPin;
