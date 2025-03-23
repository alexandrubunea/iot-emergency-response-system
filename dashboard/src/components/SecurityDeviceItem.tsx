import { Device } from "../models/Device";
import { SensorStatus } from "../types/Device";
import { sweetAlert } from "../utils/ui";
import DeleteButton from "./DeleteButton";

type SecurityDeviceItemProps = {
    device: Device;
    onRemove?: (deviceId: number) => void;
};

function SecurityDeviceItem({ device, onRemove }: SecurityDeviceItemProps) {
    const sensors = [
        {
            name: "Motion Detection",
            value: device.motion_sensor,
            icon: "fa-person-walking",
        },
        {
            name: "Sound Detection",
            value: device.sound_sensor,
            icon: "fa-volume-high",
        },
        {
            name: "Gas Detection",
            value: device.gas_sensor,
            icon: "fa-wind",
        },
        {
            name: "Fire Detection",
            value: device.fire_sensor,
            icon: "fa-fire",
        },
    ];

    const activeSensors = sensors.filter(
        (sensor) => sensor.value !== SensorStatus.SENSOR_NOT_USED
    );

    const getDeviceHealth = () => {
        if (
            activeSensors.some((s) => s.value === SensorStatus.SENSOR_OFFLINE)
        ) {
            return {
                status: "offline",
                color: "text-red-400",
                bgColor: "bg-red-900/50",
            };
        }
        if (
            activeSensors.some(
                (s) => s.value === SensorStatus.SENSOR_MALFUNCTION
            )
        ) {
            return {
                status: "warning",
                color: "text-amber-400",
                bgColor: "bg-amber-900/50",
            };
        }
        return {
            status: "online",
            color: "text-emerald-400",
            bgColor: "bg-emerald-900/50",
        };
    };

    const deviceHealth = getDeviceHealth();

    const showConfirmation = () =>
        sweetAlert(
            "Are you sure?",
            "This action is irreversible. Once a device is removed, it must be erased before it can be reconfigured and used again.",
            "question",
            "Yes",
            "No",
            true,
            true,
            0,
            () => {
                deleteDevice();
                if (onRemove) onRemove(device.id);
            },
            null
        );

    const deleteDevice = () => {
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
    };

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
        <div
            className={`rounded-md border border-zinc-600 ${deviceHealth.bgColor} shadow-md`}
        >
            <div className="p-3 pb-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <i className="fa-solid fa-microchip mr-2 text-zinc-400"></i>
                        <h3 className="text-md poppins-bold text-zinc-200">
                            {device.name}
                        </h3>
                        <div
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs poppins-light ${deviceHealth.bgColor} ${deviceHealth.color}`}
                        >
                            <i
                                className={`fa-solid ${
                                    deviceHealth.status === "online"
                                        ? "fa-signal"
                                        : "fa-triangle-exclamation"
                                } mr-1`}
                            ></i>
                            {deviceHealth.status === "online"
                                ? "Active"
                                : deviceHealth.status === "warning"
                                ? "Warning"
                                : "Issues"}
                        </div>
                    </div>
                    <div className="text-xs text-zinc-400 poppins-light">
                        ID: {device.id}
                    </div>
                </div>
            </div>

            <div className="px-3 pb-3">
                <div className="bg-zinc-800 rounded p-2">
                    <div className="text-xs text-zinc-400 mb-2 flex items-center poppins-light">
                        <i className="fa-solid fa-diagram-project mr-1"></i>
                        Connected Sensors ({activeSensors.length})
                    </div>
                    <ul className="space-y-1">
                        {activeSensors.map((sensor, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between py-1 px-2 text-sm rounded hover:bg-zinc-700"
                            >
                                <div className="flex items-center poppins-light">
                                    <i
                                        className={`fa-solid ${sensor.icon} mr-2 text-zinc-500`}
                                    ></i>
                                    {sensor.name}
                                </div>
                                <div
                                    className={`flex items-center poppins-bold ${getSensorStatusColor(
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
                                    {sensor.value === SensorStatus.SENSOR_ONLINE
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
            </div>

            <div className="p-3">
                <DeleteButton text="Remove" showConfirmation={showConfirmation} />
            </div>
        </div>
    );
}

export default SecurityDeviceItem;
