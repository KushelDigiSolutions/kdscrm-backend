
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


        const awardDetail = await Award.create({ userId, employee: userDetail.fullName, awardType, date, gift, description, rating, organizationId });

        await mailSender(
            userDetail.email,
            `Regarding Award`,
            `
  <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f4f6f8; color: #333;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <h2 style="color: #2e86de; text-align: center; margin-bottom: 25px;">🎖️ Award Notification</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #555;">Award Type:</td>
          <td style="padding: 10px; color: #000;">${awardType}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; color: #555;">Date:</td>
          <td style="padding: 10px; color: #000;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #555;">Gift:</td>
          <td style="padding: 10px; color: #000;">${gift}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; color: #555;">Description:</td>
          <td style="padding: 10px; color: #000;">${description}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #555;">Rating:</td>
          <td style="padding: 10px; color: #000;">${rating}</td>
        </tr>
      </table>
      <div style="margin-top: 30px; text-align: center; color: #888;">
        <small>This is an automated message from the HR System. No reply is necessary.</small>
      </div>
    </div>
  </div>
  `
        );


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

    const updatePromotion = await Award.findByIdAndUpdate(
        id,
        {
            $set: updateObj,
        },
        {
            new: true,
        }
    );
    await mailSender(
        userDetail.email,
        `Regarding Award`,
        `
  <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f4f6f8; color: #333;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <h2 style="color: #2e86de; text-align: center; margin-bottom: 25px;">🎖️ Award Notification</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #555;">Award Type:</td>
          <td style="padding: 10px; color: #000;">${awardType}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; color: #555;">Date:</td>
          <td style="padding: 10px; color: #000;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #555;">Gift:</td>
          <td style="padding: 10px; color: #000;">${gift}</td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; font-weight: bold; color: #555;">Description:</td>
          <td style="padding: 10px; color: #000;">${description}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold; color: #555;">Rating:</td>
          <td style="padding: 10px; color: #000;">${rating}</td>
        </tr>
      </table>
      <div style="margin-top: 30px; text-align: center; color: #888;">
        <small>This is an automated message from the HR System. No reply is necessary.</small>
      </div>
    </div>
  </div>
  `
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatePromotion, "Updated  Successfully"));
});

