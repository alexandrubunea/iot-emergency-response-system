import { Device } from "../models/Device";
import { SensorStatus } from "../types/Device";
import { sweetAlert } from "../utils/ui";

type SecurityDeviceItemProps = {
    device: Device;
};

function SecurityDeviceItem({ device }: SecurityDeviceItemProps) {
    const sensors = [
        { name: "Motion Detection", value: device.motion_sensor },
        { name: "Sound Detection", value: device.sound_sensor },
        { name: "Gas Detection", value: device.gas_sensor },
        { name: "Fire Detection", value: device.fire_sensor },
    ];

    const showConfirmation = () => sweetAlert(
        "Are you sure?",
        "This action is irreversible. Once a device is removed, it must be erased before it can be reconfigured and used again.",
        "question",
        "Yes",
        "No",
        true,
        true,
        0,
        deleteDevice,
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

    return (
        <div className="rounded-sm bg-zinc-700 p-2 text-zinc-200">
            <div className="flex justify-between">
                <h1 className="text-md poppins-bold">{device.name}</h1>
                <button
                    className="p-2 rounded-sm poppins-regular text-xs bg-rose-500 hover:bg-rose-700 hover:cursor-pointer transition-colors duration-300 flex flex-row space-x-2 items-center"
                    onClick={showConfirmation}
                >
                    <i className="fa-solid fa-trash-can"></i>
                    <span className="uppercase">Remove device</span>
                </button>
            </div>
            <ul className="mt-3 space-y-0 poppins-light text-sm">
                {sensors
                    .filter(
                        (sensor) =>
                            sensor.value !== SensorStatus.SENSOR_NOT_USED
                    )
                    .map((sensor, index) => (
                        <li
                            key={index}
                            className="flex items-center justify-between"
                        >
                            <span>{sensor.name}</span>
                            <span
                                className={`
                                    ${
                                        sensor.value ===
                                        SensorStatus.SENSOR_ONLINE
                                            ? "text-green-400"
                                            : sensor.value ===
                                              SensorStatus.SENSOR_MALFUNCTION
                                            ? "text-amber-500"
                                            : "text-red-400"
                                    }
                                    ${
                                        sensor.value ===
                                            SensorStatus.SENSOR_MALFUNCTION ||
                                        sensor.value ===
                                            SensorStatus.SENSOR_OFFLINE
                                            ? "animate__animated animate__pulse animate__infinite"
                                            : ""
                                    }`}
                            >
                                {sensor.value === SensorStatus.SENSOR_ONLINE
                                    ? "Online"
                                    : sensor.value ===
                                      SensorStatus.SENSOR_MALFUNCTION
                                    ? "Malfunction"
                                    : "Offline"}
                            </span>
                        </li>
                    ))}
            </ul>
        </div>
    );
}

export default SecurityDeviceItem;
