import { ErrorsTypes } from './models/enums';
export class CustomError extends Error {
    constructor(message, code, statusType, exception) {
        super(message);
        this.message = message;
        this.code = code;
        this.statusType = statusType;
        this.esxception = exception;
        console.error(`
    Error!    
    Status Code: ${code}
    ${ErrorsTypes[statusType]}: ${message}`);
    }
}
//# sourceMappingURL=errors.js.map