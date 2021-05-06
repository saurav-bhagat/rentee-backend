import _ from "lodash";

export interface ErrorMessage {
    name?: string;
    message: string;
    properties?: object;
    kind: string;
    path: string;
}

export const formatDbError = (err: any): any => {
    if (err.errors) {
        const errMessage: ErrorMessage = <ErrorMessage>Object.values(err.errors)[0];
        return errMessage.message;
    }
    return err.message;
};

export const isEmptyFields = (obj: any) => {
    const objValues = Object.values(obj);
    if (_.includes(objValues, "") || _.includes(objValues, null) || _.includes(objValues, undefined)) {
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
