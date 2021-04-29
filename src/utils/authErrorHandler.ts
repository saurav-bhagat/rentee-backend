const _ = require("lodash");

export interface ErrorMessage {
    name?: string;
    message: string;
    properties?: object;
    kind: string;
    path: string;
}

const handleAuthError = (err: any): any => {
    if(err.message) return err.message;
    const errMessage: ErrorMessage = <ErrorMessage>Object.values(err.errors)[0];
    return errMessage.message;
};

export const isEmptyFields = (obj: any) => {
    const objValues = Object.keys(obj);
    if (_.includes(objValues, "") || _.includes(objValues, null)) {
        return true;
    } else {
        return false;
    }
};

export default handleAuthError;
