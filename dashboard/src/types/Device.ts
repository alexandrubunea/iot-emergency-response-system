export enum SensorStatus {
    SENSOR_NOT_USED = -1,
    SENSOR_HEALTHY = 1,
    SENSOR_MALFUNCTION = 2,
}

export type IDevice = {
    id: number,
    key: string,

    name: string,

    motion_sensor: SensorStatus;
    sound_sensor: SensorStatus;
    fire_sensor: SensorStatus;
    gas_sensor: SensorStatus;
};
