import { Router } from "express";
import {ProvidePermission  , updatePermission  , fetchallRole , DeleteRoleApi} from "../controller/Permission.js"

const router = Router();

router.post("/providePermission" , ProvidePermission);
router.post("/updatePermission" , updatePermission);
router.post("/fetchallRole" , fetchallRole);
router.post("/DeleteRoleApi" , DeleteRoleApi);


export default router;
