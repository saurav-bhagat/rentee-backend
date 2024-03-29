/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import _ from 'lodash';

export interface ErrorMessage {
	name?: string;
	message: string;
	properties?: Record<string, unknown>;
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
	if (_.includes(objValues, '') || _.includes(objValues, null) || _.includes(objValues, undefined)) {
		return true;
	} else {
		return false;
	}
};

export const verifyObjectId = (obj: any) => {
	let result = true;
	const ids = [...obj];
	ids.forEach((id) => {
		if (!id.match(/^[0-9a-fA-F]{24}$/)) {
			result = false;
		}
	});
	return result;
};
