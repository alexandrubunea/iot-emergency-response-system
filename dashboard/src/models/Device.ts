import { IDevice, SensorStatus } from "../types/Device";

export class Device implements IDevice {
    name: string;

    motion_sensor: SensorStatus;
    sound_sensor: SensorStatus;
    fire_sensor: SensorStatus;
    gas_sensor: SensorStatus;

    constructor(
        name: string,
        motion_sensor: SensorStatus,
        sound_sensor: SensorStatus,
        fire_sensor: SensorStatus,
        gas_sensor: SensorStatus
    ) {
        this.name = name;

        this.motion_sensor = motion_sensor;
        this.sound_sensor = sound_sensor;
        this.fire_sensor = fire_sensor;
        this.gas_sensor = gas_sensor;
    }

    public anyBrokenSensor(): boolean {
        return (
            this.motion_sensor === SensorStatus.SENSOR_MALFUNCTION ||
            this.sound_sensor === SensorStatus.SENSOR_MALFUNCTION ||
            this.fire_sensor === SensorStatus.SENSOR_MALFUNCTION ||
            this.gas_sensor === SensorStatus.SENSOR_MALFUNCTION
        );
    }
}
