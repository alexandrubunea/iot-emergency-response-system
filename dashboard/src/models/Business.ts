import { IBusiness } from "../types/Business";
import { SensorStatus } from "../types/Device";
import { Device } from "./Device";

export class Business implements IBusiness {
    name: string;

    address: string;
    lat: number;
    lon: number;

    devices: Array<Device>;

    alert: boolean;
    malfunction: boolean;

    constructor(
        name: string,
        address: string,
        lat: number,
        lon: number,
        devices: Array<Device>,
        alert: boolean,
        malfunction: boolean
    ) {
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lon = lon;
        this.devices = devices;
        this.alert = alert;
        this.malfunction = malfunction;
    }

    public anyBrokenDevice(): boolean {
        this.devices.forEach((device) => {
            if (device.anyBrokenSensor()) return true;
        });
        return false;
    }

    public getSensorStatusByType(sensor_type: string): SensorStatus {
        sensor_type = sensor_type.toLowerCase();
        let atleastOneSensor:boolean = false;

        switch (sensor_type) {
            default:
                throw new Error(
                    "Invalid sensor type. Valid types: motion, sound, fire, gas"
                );
            case "motion": {
                this.devices.forEach((device) => {
                    if (device.motion_sensor == SensorStatus.SENSOR_MALFUNCTION)
                        return SensorStatus.SENSOR_MALFUNCTION;
                    if (device.motion_sensor == SensorStatus.SENSOR_OFFLINE)
                        return SensorStatus.SENSOR_OFFLINE;
                    if (device.motion_sensor == SensorStatus.SENSOR_ONLINE)
                        atleastOneSensor = true;
                });
                break;
            }
            case "sound": {
                this.devices.forEach((device) => {
                    if (device.sound_sensor == SensorStatus.SENSOR_MALFUNCTION)
                        return SensorStatus.SENSOR_MALFUNCTION;
                    if (device.sound_sensor == SensorStatus.SENSOR_OFFLINE)
                        return SensorStatus.SENSOR_OFFLINE;
                    if (device.sound_sensor == SensorStatus.SENSOR_ONLINE)
                        atleastOneSensor = true;
                });
                break;
            }
            case "fire": {
                this.devices.forEach((device) => {
                    if (device.fire_sensor == SensorStatus.SENSOR_MALFUNCTION)
                        return SensorStatus.SENSOR_MALFUNCTION;
                    if (device.fire_sensor == SensorStatus.SENSOR_OFFLINE)
                        return SensorStatus.SENSOR_OFFLINE;
                    if (device.fire_sensor == SensorStatus.SENSOR_ONLINE)
                        atleastOneSensor = true;
                });
                break;
            }
            case "gas": {
                this.devices.forEach((device) => {
                    if (device.gas_sensor == SensorStatus.SENSOR_MALFUNCTION)
                        return SensorStatus.SENSOR_MALFUNCTION;
                    if (device.gas_sensor == SensorStatus.SENSOR_OFFLINE)
                        return SensorStatus.SENSOR_OFFLINE;
                    if (device.gas_sensor == SensorStatus.SENSOR_ONLINE)
                        atleastOneSensor = true;
                });
                break;
            }
        }

        return atleastOneSensor ? SensorStatus.SENSOR_ONLINE : SensorStatus.SENSOR_NOT_USED;
    }

    public numberOfDevices(): number {
        return this.devices.length;
    }
}
