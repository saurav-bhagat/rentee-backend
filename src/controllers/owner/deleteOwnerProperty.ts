import { Request, Response } from 'express';

export class DeleteOwnerProperty {
	pong = (_req: Request, res: Response): void => {
		res.status(200).send('pong');
	};
}
