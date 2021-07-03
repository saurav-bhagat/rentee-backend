import { Router } from 'express';
import { payWithPaytm, paytmCallBackUrl } from '../paytm/paytm.controller';
const router: Router = Router();

router.post('/paynow', payWithPaytm);
router.post('/callBack', paytmCallBackUrl);
router.post('/test', (req, res) => {
	console.log('in test');
	res.json({ msg: 'response form backend' });
});

export default router;
