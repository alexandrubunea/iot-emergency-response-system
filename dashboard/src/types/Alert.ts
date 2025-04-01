export type Alert = {
    _id: string;
    id: number;
    device_id: number;
    device_name: string;
    alert_time: string;
    alert_type: string;
    business_name: string;
    message: string | null;
    resolved: boolean;
}
