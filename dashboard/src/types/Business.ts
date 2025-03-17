import { Device } from "./Device"

export type Business = {
    name: string,

    address: string,
    lat: number,
    lon: number,

    devices: Array<Device>,

    alert: boolean,
    malfunction: boolean
}
