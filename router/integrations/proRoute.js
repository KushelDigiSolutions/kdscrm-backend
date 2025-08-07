import {
    createProduct, getAllProducts, getProductById,
    updateProduct, deleteProduct, updateRequiredFields, installApp,
    updateAppFields,
    uninstallApp, getInstalledApps
} from "../../controller/interegations/pro.js"
import isAuthenticated from "../../middleware/auth.js";

import { Router } from "express"


const router = Router();


router.post("/postProduct", createProduct);
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.put('/products/:id/requiredFields', updateRequiredFields);


router.post("/install", isAuthenticated, installApp);
router.get('/getInstalledApps', isAuthenticated, getInstalledApps);
router.put("/update/:name", isAuthenticated, updateAppFields);
router.delete("/uninstall/:name", isAuthenticated, uninstallApp);

export default router;