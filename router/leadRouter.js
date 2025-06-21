import { Router } from "express";
import {
    createLead, getAllLead, getAllLead3, ShareLead, SaveRelivingLetter, saveCompletionLetter, saveLORLetter, saveLetter1Api, saveOfferLetterInter, saveExperienceLetter, GetLeadByUser, GetDesiUser, editLeadStatus, getAllLead2, postImage, deleteLeads, editLead, editLeadNote, GetAllLeadByAdmin, GetLeadById, CreateLeadStatus, getLeadStatus, getLeadSource, CreateLeadSource, UpdateLeadStatus, UpdateLeadSource, CreateLeadNote, UpdateLeadNote, DeleteLeadNote, GetNoteById, GetOpenLeads, GetDesiUser1, PostQuotationForm, PostProposalForm, GetQuotationApi, DeleteQuotationapi, deletePropapi, GetUserLetter, UpdateQuotationForm, UpdateProposalForm, OfferLetterDocs, changeOfferLetterPer, changeRelivingLetterPer, InstaAddLead, changeExperienceLetterPer, FreelencerOfferApi, GetSaveTempalte, partTimeOfferApi
    , deleteOfferLetterDocs, deletepartTimeOfferApi, deleteFreelencerOffer, deleteCompletionLetter, deleteRelivingLetter, deleteExperienceLetter, deleteOfferLetterInter, deleteLetter1Api, deleteLORLetter
} from "../controller/leadController.js"
import { deleteExpense, getExpense, CreateExpense } from "../controller/expenseController.js";
import { postLeadCategory, getLeadCategories, updateLeadCategory, deleteLeadTypeCategory, postLeadSubCategory, getSubCategory, updateSubCategory, deleteSubCategory } from "../controller/systemController.js";
import isAuthenticated from "../middleware/auth.js";
const router = Router();

router.post("/createLead", createLead);
// router.post("")
router.post("/partTimeOfferApi", partTimeOfferApi);
router.get("/getLeadById/:id", GetLeadById);
router.get("/getOpenLeads/:id", GetOpenLeads);
router.post("/createExpense",isAuthenticated, CreateExpense);
router.get("/getLeadByUser/:id", GetLeadByUser);
router.get("/getDesiUser", GetDesiUser);
router.get("/getDesiUser1", GetDesiUser1);
router.get("/getSaveTempalte/:leadId", GetSaveTempalte);

router.post('/getAllLead', async (req, res) => {
    const { id } = req.body;
    const data = await getAllLead({ ...req.query, userId: id });
    res.json(data);
});
router.get('/getAllLead', async (req, res) => {
    const data = await getAllLead2({ ...req.query });
    res.json(data);
});
router.get('/getAllLead2/:userId', async (req, res) => {
    const data = await getAllLead3({ ...req.query, ...req.params });
    res.json(data);
});

router.post('/saveCompletionLetter', saveCompletionLetter);
router.delete('/deleteCompletionLetter/:id', deleteCompletionLetter);

router.get("/getAllLeadByAdmin", GetAllLeadByAdmin);
router.post("/postImage", postImage);
router.delete("/deleteLead/:id", deleteLeads);
router.post("/editLead/:id", editLead);


router.post("/createLeadStatus", CreateLeadStatus);
router.post("/createLeadSource", CreateLeadSource);

router.get("/allLeadStatus", getLeadStatus);
router.get("/allLeadSource", getLeadSource);

router.post("updateLeadStatus", UpdateLeadStatus);
router.post("updateLeadSource", UpdateLeadSource);

router.post("/updateLeadStatus/:id", editLeadStatus);
router.post("/updateLeadNote/:id", editLeadNote);

router.post("/createLeadNote/:LeadId", isAuthenticated, CreateLeadNote);
router.post("/updateLeadNote2/:noteId", UpdateLeadNote);
router.delete("/deleteLeadNote/:leadId", DeleteLeadNote);
router.get("/getNoteById/:leadId", GetNoteById);
router.get("/getQuotationApi/:leadId", GetQuotationApi);
router.delete("/deleteQuotationapi/:id", DeleteQuotationapi);
router.post("/postQuotationForm",isAuthenticated, PostQuotationForm);
router.delete("/deletePropapi/:id", deletePropapi);
router.post("/postProposalForm", PostProposalForm);

router.post("/updateQuotationForm/:quoId", UpdateQuotationForm);
router.post("/UpdateProposalForm/:quoId", UpdateProposalForm);

router.post("/postSaveOfERdOCS", OfferLetterDocs);
router.post("/freelencerOfferApi", FreelencerOfferApi);
router.post("/saveRelivingLetter", SaveRelivingLetter);
router.post("/saveExperienceLetter", saveExperienceLetter);
router.post("/saveOfferLetterInter", saveOfferLetterInter);
router.post("/saveLORLetter", saveLORLetter);
router.post("/saveLetter1Api", saveLetter1Api);

router.post("/getUserLetter", GetUserLetter);
router.delete("/deleteOfferLetterDocs/:id", deleteOfferLetterDocs);
router.delete('/deletepartTimeOfferApi/:id', deletepartTimeOfferApi);
router.delete('/deleteFreelencerOffer/:id', deleteFreelencerOffer);
router.delete('/deleteRelivingLetter/:id', deleteRelivingLetter);
router.delete('/deleteExperienceLetter/:id', deleteExperienceLetter);
router.delete('/deleteOfferLetterInter/:id', deleteOfferLetterInter);
router.delete('/deleteLetter1Api/:id', deleteLetter1Api);
router.delete('/deleteLORLetter/:id', deleteLORLetter)

router.post("/changeOfferLetterPer", changeOfferLetterPer);
router.post("/changeRelivingLetterPer", changeRelivingLetterPer);
router.post("/changeExperienceLetterPer", changeExperienceLetterPer);


// for  expense 
// router.post("/createExpense",isAuthenticated, CreateExpense);
router.post("/deleteExpense/:expenseId", deleteExpense);
router.post("/getExpense", isAuthenticated, getExpense);


router.post("/instaAddLead", InstaAddLead);
router.post("/sharelead", ShareLead);


router.post('/postLeadCategory', postLeadCategory);
router.get('/getLeadCategories', getLeadCategories)
router.put('/updateLeadCategory/:id', updateLeadCategory)
router.delete('/deleteLeadTypeCategory/:id', deleteLeadTypeCategory)


router.post('/postLeadSubCategory', postLeadSubCategory)
router.get('/getSubCategory', getSubCategory)
router.put('/updateSubCategory/:id', updateSubCategory)
router.delete('/deleteSubCategory/:id', deleteSubCategory)
export default router;
