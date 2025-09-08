import { createAsset, getAssets, getAssetById, updateAsset, DeleteAsset, createTransaction, deallocateAsset, getTransactionById, getTransactions, getEmployeeTransactions, updateTransaction, deleteTransaction } from "../controller/sql/assetController.js";
import { Router } from "express";
import isAuthenticated from "../middleware/auth.js"


const router = Router();

router.post("/createAsset", isAuthenticated, createAsset);
router.get('/getAllAsset', isAuthenticated, getAssets);
router.get('/getAsset/:id', getAssetById)
router.put('/updateAset/:id', updateAsset);
router.delete('/assetDelete/:id', DeleteAsset);


router.post("/allocate", isAuthenticated, createTransaction);
router.post('/dellocate', deallocateAsset);
router.get('/getAllAllocates', isAuthenticated, getTransactions);
router.get('/getEmployeeTransactions', isAuthenticated, getEmployeeTransactions)
router.get('/getTransaction/:id', getTransactionById);
router.put(`/updateTransaction/:id`, updateTransaction);
router.delete('/deleteAllocation/:id', deleteTransaction);

export default router;