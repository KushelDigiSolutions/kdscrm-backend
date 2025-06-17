
import Award from "../models/award/award.js"
import User from "../models/User/User.js"
import db from "../db/sql_conn.js"
import { mailSender } from "../utils/SendMail2.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { removeUndefined } from "../utils/util.js";
// import auth
export const createAward = async (req, res) => {
    try {

        const { userId, awardType, date, gift, description, rating, organizationId } = req.body;
        console.log(organizationId)
        if (!organizationId) {
            return res.status(500).json({
                status: true,
                message: "organizationId required "
            })
        }
        const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const userDetail = users[0];


        await mailSender(userDetail.email, `Regarding Award`, `<div>
  <div>awardType: ${awardType}</div>
  <div>date: ${date}</div>
  <div>gift: ${gift}</div>
  <div>description: ${description}</div>
  <div>rating: ${rating}</div>
  </div>`);




        const awardDetail = await Award.create({ userId, employee: userDetail.fullName, awardType, date, gift, description, rating, organizationId });

        return res.status(200).json({
            status: true,
            message: "Successfuly creeated",
            awardDetail
        })


    } catch (error) {
        console.log("error ", error);
        return res.status(500).json({
            status: true,
            message: "Internal server error "
        })
    }
}

export const getAllAward = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        console.log(organizationId)
        const allAward = await Award.find({ organizationId });
        // allAward.forEach((e)=>{
        //     e.organizationId = "1ca91b9f-260c-4ee1-b770-1e4cc3deacf6"
        //     e.save();
        // })

        return res.status(200).json({
            status: true,
            data: allAward
        })
    } catch (error) {
        console.log(error);
    }
}

export const deleteAward = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await Award.findByIdAndDelete(id);
    return res
        .status(200)
        .json(new ApiResponse(200, data, "Deleted Successfully"));
});

export const updateAward = asyncHandler(async (req, res) => {
    const { userId, employee, awardType, date, gift, description, rating } = req.body;

    const { id } = req.params;

    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
        return res.status(404).json({ status: false, message: "User not found" });
    }
    const userDetail = users[0];

    let updateObj = removeUndefined({
        userId, employee: userDetail.fullName, awardType, date, gift, description, rating
    });

    await mailSender(userDetail.email, `Regarding Award`, `<div>
  <div>awardType: ${awardType}</div>
  <div>date: ${date}</div>
  <div>gift: ${gift}</div>
  <div>description: ${description}</div>
  <div>rating: ${rating}</div>
  </div>`);

    const updatePromotion = await Award.findByIdAndUpdate(
        id,
        {
            $set: updateObj,
        },
        {
            new: true,
        }
    );
    return res
        .status(200)
        .json(new ApiResponse(200, updatePromotion, "Updated  Successfully"));
});

