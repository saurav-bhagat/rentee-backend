import {Router} from "express";

const router: Router = Router();

//endpoints for tenants

router.get("/ping", (req, res, next) => {
    res.status(200).send("Tenant pong");
});

export default router;
