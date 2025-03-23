import { IBusiness } from "../types/Business";
import { SensorStatus } from "../types/Device";
import { Device } from "./Device";

export class Business implements IBusiness {
    id: number;
    key: string;

    name: string;

    address: string;
    lat: number;
    lon: number;

    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;

    devices: Array<Device>;

    alert: boolean;

    constructor(
        id: number,
        key: string,
        name: string,
        address: string,
        lat: number,
        lon: number,
        devices: Array<Device>,
        alert: boolean,
        contactName: string | null,
        contactPhone: string | null,
        contactEmail: string | null
    ) {
        this.id = id;
        this.key = key;

        this.name = name;

        this.address = address;
        this.lat = lat;
        this.lon = lon;
        this.devices = devices;
        this.alert = alert;

        this.contactEmail = contactEmail;
        this.contactName = contactName;
        this.contactPhone = contactPhone;
    }

    public anyBrokenDevice(): boolean {
        for (let device of this.devices)
            if (device.anyBrokenSensor()) return true;

        return false;
    }

    public getSensorStatusByType(sensor_type: string): SensorStatus {
        sensor_type = sensor_type.toLowerCase();
        let atleastOneSensor: boolean = false;

        switch (sensor_type) {
            default:
                throw new Error(
                    "Invalid sensor type. Valid types: motion, sound, fire, gas"
                );
            case "motion": {
                for (let device of this.devices) {
                    if (
                        device.motion_sensor ===
                            SensorStatus.SENSOR_MALFUNCTION ||
                        device.motion_sensor === SensorStatus.SENSOR_OFFLINE
                    ) {
                        return device.motion_sensor;
                    }
                    if (device.motion_sensor === SensorStatus.SENSOR_ONLINE) {
                        atleastOneSensor = true;
                    }
                }
                break;
            }
            case "sound": {
                for (let device of this.devices) {
                    if (
                        device.sound_sensor ===
                            SensorStatus.SENSOR_MALFUNCTION ||
                        device.sound_sensor === SensorStatus.SENSOR_OFFLINE
                    ) {
                        return device.sound_sensor;
                    }
                    if (device.sound_sensor === SensorStatus.SENSOR_ONLINE) {
                        atleastOneSensor = true;
                    }
                }
                break;
            }
            case "fire": {
                for (let device of this.devices) {
                    if (
                        device.fire_sensor ===
                            SensorStatus.SENSOR_MALFUNCTION ||
                        device.fire_sensor === SensorStatus.SENSOR_OFFLINE
                    ) {
                        return device.fire_sensor;
                    }
                    if (device.fire_sensor === SensorStatus.SENSOR_ONLINE) {
                        atleastOneSensor = true;
                    }
                }
                break;
            }
            case "gas": {
                for (let device of this.devices) {
                    if (
                        device.gas_sensor === SensorStatus.SENSOR_MALFUNCTION ||
                        device.gas_sensor === SensorStatus.SENSOR_OFFLINE
                    ) {
                        return device.gas_sensor;
                    }
                    if (device.gas_sensor === SensorStatus.SENSOR_ONLINE) {
                        atleastOneSensor = true;
                    }
                }
                break;
            }
        }

        return atleastOneSensor
            ? SensorStatus.SENSOR_ONLINE
            : SensorStatus.SENSOR_NOT_USED;
    }

    public numberOfDevices(): number {
        return this.devices.length;
    }
}
