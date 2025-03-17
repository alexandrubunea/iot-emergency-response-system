type SecurityDeviceItemProps = {
    name: string;

    // Sensor Status:
    // -1 = disabled, 0 = offline, 1 = online, 2 = malfunction
    motion: number;
    sound: number;
    fire: number;
    gas: number;
};

function SecurityDeviceItem({
    name,
    motion,
    sound,
    fire,
    gas,
}: SecurityDeviceItemProps) {
    const sensors = [
        { name: "Motion Detection", value: motion, show: motion !== -1 },
        { name: "Sound Detection", value: sound, show: sound !== -1 },
        { name: "Gas Detection", value: gas, show: gas !== -1 },
        { name: "Fire Detection", value: fire, show: fire !== -1 },
    ];

    return (
        <>
            <div className="rounded-sm bg-zinc-700 p-2 text-zinc-200">
                <h1 className="text-md poppins-bold">{name}</h1>
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
