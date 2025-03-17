export enum SensorStatus {
    SENSOR_NOT_USED = -1,
    SENSOR_OFFLINE = 0,
    SENSOR_ONLINE = 1,
    SENSOR_MALFUNCTION = 2,
}

export type Device = {
    name: string,

    motion_sensor: SensorStatus;
    sound_sensor: SensorStatus;
    fire_sensor: SensorStatus;
    gas_sensor: SensorStatus;
};
