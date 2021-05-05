const _ = require("lodash");

export interface ErrorMessage {
    name?: string;
    message: string;
    properties?: object;
    kind: string;
    path: string;
}

const handleDbError = (err: any): any => {
    if (err.errors) {
        const errMessage: ErrorMessage = <ErrorMessage>Object.values(err.errors)[0];
        return errMessage.message;
    }
    return err.message;
};

export const isEmptyFields = (obj: any) => {
    const objValues = Object.keys(obj);
    if (_.includes(objValues, "") || _.includes(objValues, null)) {
        return true;
    } else {
        return false;
    }
};

export const verifyObjectId = (id: string) => {
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        return true;
    } else {
        false;
    }
};

export default handleDbError;
