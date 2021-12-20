import { ErrorsTypes } from './models/enums';
export declare class CustomError extends Error {
    message: string;
    code: number;
    statusType: ErrorsTypes;
    esxception: Error;
    constructor(message: string, code: number, statusType: ErrorsTypes, exception: Error);
}
//# sourceMappingURL=errors.d.ts.map