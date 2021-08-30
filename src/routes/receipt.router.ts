import { Router } from 'express';
import { createReceipt } from '../controllers/receipts/createReceipt';

const router: Router = Router();

router.post('/create-receipt', createReceipt);

export default router;
