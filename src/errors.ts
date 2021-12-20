import { ErrorsTypes } from './models/enums';

export class CustomError extends Error {
  message: string;
  code: number;
  statusType: ErrorsTypes;
  esxception: Error;

  constructor(message: string, code: number, statusType: ErrorsTypes, exception: Error) {
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
