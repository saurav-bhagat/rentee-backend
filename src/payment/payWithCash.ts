import { Request, Response } from 'express';
import { v4 as uuid4 } from 'uuid';

import { format, setDate, addMonths } from 'date-fns';
import Tenant from '../models/tenant/tenant';

import Payment from '../models/payment/payment';
import Receipt from '../models/receipt/receipt';

import { formatDbError, isEmptyFields, verifyObjectId } from '../utils/errorUtils';

export const payWithCashAndOtherMeans = async (req: Request, res: Response) => {
	const { amount, tenantUserId, rentDueDate } = req.body;

	if (req.isAuth && tenantUserId && verifyObjectId([tenantUserId])) {
		if (isEmptyFields({ amount, rentDueDate })) {
			return res.status(400).json({ err: 'Either amount/rentDueDate is empty' });
		}

		const month = format(new Date(rentDueDate), 'MMMM');

		const paymentDetails = {
			currency: 'INR',
			respMsg: 'Txn Success',
			respCode: '01',
			orderId: tenantUserId + uuid4().substr(0, 3),
			txnAmount: amount,
			status: 'Success',
			txnDate: new Date(),
			paymentMode: 'Cash',
		};
		try {
			const paymentDocument = await Payment.create(paymentDetails);

			if (paymentDocument) {
				const receipt = await Receipt.create({ amount, month, mode: paymentDetails.paymentMode });
				if (receipt) {
					const tenantDocument = await Tenant.findOneAndUpdate(
						{ userId: tenantUserId },
						{
							$push: { payments: paymentDocument._id, receipts: receipt._id },
							rentDueDate: setDate(addMonths(new Date(rentDueDate), 1), 5),
						}
					);
					if (!tenantDocument) {
						return res.status(400).json({ msg: 'Unable to push payment id in tenant' });
					}
				} else {
					return res.status(400).json({ msg: 'Unable to push receipt id in tenant' });
				}
			} else {
				return res.status(400).json({ msg: 'Unable to create payment document' });
			}
			return res.status(200).json({ msg: 'Transaction successfull' });
		} catch (error) {
			return res.status(400).json({ err: formatDbError(error) });
		}
	} else {
		return res.status(403).json({ err: 'Not Authorized' });
	}
};
