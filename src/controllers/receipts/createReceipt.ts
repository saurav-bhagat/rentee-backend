import { Request, Response } from 'express';
import Receipt from '../../models/receipt/receipt';
import Tenant from '../../models/tenant/tenant';
import { isEmptyFields } from '../../utils/errorUtils';

export const createReceipt = async (req: Request, res: Response) => {
	if (req.isAuth) {
		const { amount, month, mode, userId } = req.body;
		if (isEmptyFields({ amount, month, mode })) {
			return res.status(400).json({ err: 'Either amount/month/mode is empty' });
		}
		const receipt = await Receipt.create({ amount, month, mode });
		// We need userId( from tenant Schema ) otherwise we need
		// to make two calls to db
		const tenantDocument = await Tenant.findOneAndUpdate({ userId }, { $push: { receipts: receipt._id } });
		if (tenantDocument) {
			return res.status(200).json({ msg: 'Receipt created successfully' });
		} else {
			return res.status(400).json({ msg: 'Error while creating receipt' });
		}
	} else {
		return res.status(403).json({ err: 'Authroization error' });
	}
};