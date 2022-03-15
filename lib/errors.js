"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, code, statusType, exception) {
        super(message);
        this.message = message;
        this.code = code;
        this.statusType = statusType;
        this.exception = exception;
        // console.error(`
        // Error!
        // Status Code: ${code}
        // ${ErrorsTypes[statusType]}: ${message}
        // '____|  Additional info  |____'
        // ${this.exception ? exception.message : 'No additional info'}`);
    }
}
exports.CustomError = CustomError;
//# sourceMappingURL=errors.js.map