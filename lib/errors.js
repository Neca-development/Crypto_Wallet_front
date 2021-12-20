import { ErrorsTypes } from './models/enums';
export class CustomError extends Error {
    constructor(message, code, statusType, exception) {
        super(message);
        this.message = message;
        this.code = code;
        this.statusType = statusType;
        this.exception = exception;
        console.error(`
    Error!    
    Status Code: ${code}
    ${ErrorsTypes[statusType]}: ${message}

    '____|  Additional info  |____'

    ${this.exception ? exception.message : 'No additional info'}`);
    }
}
//# sourceMappingURL=errors.js.map