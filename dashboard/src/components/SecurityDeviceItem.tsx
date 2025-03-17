import { Device } from "../types/Device";

type SecurityDeviceItemProps = {
    device: Device;
};

function SecurityDeviceItem({device}: SecurityDeviceItemProps) {
    const sensors = [
        { name: "Motion Detection", value: device.motion_sensor, show: device.motion_sensor !== -1 },
        { name: "Sound Detection", value: device.sound_sensor, show: device.sound_sensor !== -1 },
        { name: "Gas Detection", value: device.gas_sensor, show: device.gas_sensor !== -1 },
        { name: "Fire Detection", value: device.fire_sensor, show: device.fire_sensor !== -1 },
    ];

    return (
        <>
            <div className="rounded-sm bg-zinc-700 p-2 text-zinc-200">
                <h1 className="text-md poppins-bold">{device.name}</h1>
                <ul className="space-y-0 poppins-light text-sm">
                    {sensors
                        .filter((sensor) => sensor.show)
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
                                                ? sensor.value === 1
                                                    ? "text-green-400"
                                                    : "text-amber-500"
                                                : "text-red-400"
                                        }
                                        ${
                                            sensor.value === 2
                                                ? "animate__animated animate__pulse animate__infinite"
                                                : ""
                                        }`}
                                >
                                    {sensor.value
                                        ? sensor.value === 1
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
