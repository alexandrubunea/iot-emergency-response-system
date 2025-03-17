import { Device } from "../models/Device";
import { SensorStatus } from "../types/Device";

type SecurityDeviceItemProps = {
    device: Device;
};

function SecurityDeviceItem({device}: SecurityDeviceItemProps) {
    const sensors = [
        { name: "Motion Detection", value: device.motion_sensor },
        { name: "Sound Detection", value: device.sound_sensor },
        { name: "Gas Detection", value: device.gas_sensor },
        { name: "Fire Detection", value: device.fire_sensor },
    ];

    return (
        <>
            <div className="rounded-sm bg-zinc-700 p-2 text-zinc-200">
                <h1 className="text-md poppins-bold">{device.name}</h1>
                <ul className="space-y-0 poppins-light text-sm">
                    {sensors
                        .filter((sensor) => sensor.value != SensorStatus.SENSOR_NOT_USED)
                        .map((sensor, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between"
                            >
                                <span>{sensor.name}</span>
                                <span
                                    className={`
                                        ${
                                            sensor.value
                                                ? sensor.value === SensorStatus.SENSOR_ONLINE
                                                    ? "text-green-400"
                                                    : "text-amber-500"
                                                : "text-red-400"
                                        }
                                        ${
                                            sensor.value === SensorStatus.SENSOR_MALFUNCTION || sensor.value == SensorStatus.SENSOR_OFFLINE
                                                ? "animate__animated animate__pulse animate__infinite"
                                                : ""
                                        }`}
                                >
                                    {sensor.value
                                        ? sensor.value === SensorStatus.SENSOR_ONLINE
                                            ? "Online"
                                            : "Malfunction"
                                        : "Offline"}
                                </span>
                            </li>
                        ))}
                </ul>
            </div>
        </>
    );
}

export default SecurityDeviceItem;
