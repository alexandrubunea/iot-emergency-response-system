import { v4 as uuidv4 } from 'uuid';

export function provideUniqueIdentifier(data: any): any {
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        throw new Error("JSON data is empty.");
    }

    if (Array.isArray(data)) {
        return data.map(item => {
            return { ...item, _id: uuidv4() };
        });
    }

    if (typeof data === 'object' && data !== null) {
        const result = { ...data };

        for (const key in result) {
            if (Array.isArray(result[key])) {
                result[key] = result[key].map((item: any) => {
                    return { ...item, _id: uuidv4() };
                });
            }
        }

        return result;
    }

    return data;
}
