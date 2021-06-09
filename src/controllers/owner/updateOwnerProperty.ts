import { Request, Response } from 'express';

export class UpdateOwnerProperty {
	pong = (_req: Request, res: Response): void => {
		res.status(200).send('pong');
	};
}
