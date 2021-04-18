import {Router} from "express";
const router: Router = Router();

import {OwnerController} from "../controllers/owner.controller";
const ownerController: OwnerController = new OwnerController();

//endpoints for owner
router.get("/ping", ownerController.pong);

export default router;
