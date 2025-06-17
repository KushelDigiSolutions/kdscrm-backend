import { Router } from "express";
import { postLeave, postHalfDay, updateLeave, monthlyLeave, LeaveTypeApi, postAllowance, getUserLeaves, getUserHalfDay, rejectHalfDayHandler, getTotalLeaveCount, getUserLeaveById, deleteLeave, deleteAllLeaves, rejectLeaveHandler, acceptLeaveHandler, acceptHalfDayHandler, GetTodayLeave, FetchUserLeave } from "../controller/leaveController.js";
import isAuthenticated from "../middleware/auth.js";


const router = Router();

router.post("/postLeave", isAuthenticated, async (req, res) => {
  try {
    const data = await postLeave({ ...req.body, auth: req.user });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});
router.post("/halfday", isAuthenticated, async (req, res) => {
  try {
    const data = await postHalfDay({ ...req.body, auth: req.user });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/leaveAllowance", async (req, res) => {
  try {
    const data = await postAllowance({ ...req.body });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});
router.post("/leaveTypeApi", async (req, res) => {
  try {
    const data = await LeaveTypeApi({ ...req.body });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.put("/updateLeave/:id", isAuthenticated, async (req, res) => {
  try {
    const data = await updateLeave({
      ...req.body,
      auth: req.user,
      id: req.params.id,
    });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/getUserLeaves", isAuthenticated, async (req, res) => {
  try {
    const data = await getUserLeaves({ ...req.query, auth: req.user });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/getUserHalfDay", isAuthenticated, async (req, res) => {
  try {
    const data = await getUserHalfDay({ ...req.query, auth: req.user });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/getUserLeaveById/:id", isAuthenticated, async (req, res) => {
  try {
    const data = await getUserLeaveById({
      ...req.query,
      auth: req.user,
      id: req.params.id,
    });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/getToalLeaveCount", isAuthenticated, async (req, res) => {
  try {
    const data = await getTotalLeaveCount({
      ...req.query, auth: req.user
    });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
})

router.delete("/deleteLeave/:id", isAuthenticated, async (req, res) => {
  try {


    const data = await deleteLeave({ auth: req.user, id: req.params.id });
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.delete("/deleteAllLeaves", async (req, res) => {
  try {
    const data = await deleteAllLeaves();
    if (data.success) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/acceptLeave/:id", async (req, res) => {
  try {
    const data = await acceptLeaveHandler({ ...req.body, ...req.params });
    if (data.status) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});
router.post("/acceptHalfDay/:id", async (req, res) => {
  try {
    const data = await acceptHalfDayHandler({ ...req.body, ...req.params });
    if (data.status) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});
router.post("/rejectLeave/:id", async (req, res) => {
  try {
    const data = await rejectLeaveHandler({ ...req.body, ...req.params });
    if (data.status) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});
router.post("/rejectHalfDay/:id", async (req, res) => {
  try {
    const data = await rejectHalfDayHandler({ ...req.body, ...req.params });
    if (data.status) {
      res.json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/monthlyLeave", monthlyLeave);
// this is employe on leave routes 

router.get("/getTodayLeave",isAuthenticated, GetTodayLeave);

router.get("/fetchUserLeaves/:userId", FetchUserLeave);

export default router;
