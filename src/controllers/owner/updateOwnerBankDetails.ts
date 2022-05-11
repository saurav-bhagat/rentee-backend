import { Request, Response } from 'express';
import Owner from '../../models/owner/ownerInfo';

import { formatDbError, verifyObjectId } from '../../utils/errorUtils';
import { validateBankAccountNumber, validateIfsc } from './ownerUtils';

export const updateOwnerBankDetails = async (req: Request, res: Response) => {
	const { accountName, accountNumber, ifsc, bankName, beneficiaryName, ownerId, vendorId } = req.body;
	if (req.isAuth && ownerId && verifyObjectId([ownerId])) {
		const data: any = {};
		if (accountName) data['accountName'] = accountName;
		if (accountNumber && !validateBankAccountNumber(accountNumber)) {
			return res.status(400).json({ err: 'Invalid account number' });
		}
		if (accountNumber) data['accountNumber'] = accountNumber;
		if (ifsc && !validateIfsc(ifsc)) {
			return res.status(400).json({ err: 'Invalid Ifsc code' });
		}
		if (ifsc) data['ifsc'] = ifsc;
		if (bankName) data['bankName'] = bankName;
		if (beneficiaryName) data['beneficiaryName'] = beneficiaryName;
		if (vendorId) data['vendorId'] = vendorId;

		try {
			if (!(Object.keys(data).length == 0)) {
				const result = await Owner.findOneAndUpdate({ ownerUserId: ownerId }, data, {
					new: true,
					runValidators: true,
					context: 'query',
				});
				if (!result) {
					return res.status(400).json({ err: 'Invalid owner ' });
				}
				return res.status(400).json({ msg: 'Owner bank detail updated Successfully' });
			} else {
				return res.status(400).json({ err: 'Updating field mandatory' });
			}
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
