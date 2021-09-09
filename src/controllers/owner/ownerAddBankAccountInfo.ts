import { Request, Response } from 'express';

import Owner from '../../models/owner/ownerInfo';
import { isEmptyFields, formatDbError, verifyObjectId } from '../../utils/errorUtils';
import Property from '../../models/property/property';

export const ownerAddBankAccountInfo = async (req: Request, res: Response) => {
	const { accountName, accountNumber, ifsc, bankName, beneficiaryName, ownerId } = req.body;
	if (req.isAuth || verifyObjectId(ownerId)) {
		if (isEmptyFields({ accountName, accountNumber, ifsc, bankName })) {
			return res.status(400).json({ err: 'Fields cannot be empty' });
		}

		try {
			const ownerInfoDoc = await Owner.create({ accountName, accountNumber, ifsc, bankName, beneficiaryName });

			if (!(await Property.findOne({ ownerId }))) {
				await Property.create({ ownerId, ownerInfo: ownerInfoDoc._id });
				return res.status(200).json({ ownerInfoDoc });
			} else {
				await Property.findOneAndUpdate({ ownerId }, { ownerInfo: ownerInfoDoc._id }, { new: true });
				return res.status(200).json({ ownerInfoDoc });
			}
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
