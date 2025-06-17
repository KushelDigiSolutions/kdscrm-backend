import mongoose from 'mongoose';
import { mailSender } from "../../utils/SendMail2.js";
import User from "../User/User.js"

const mySchema = new mongoose.Schema({
  admin: String,
  holidayName: String,
  startDate: String,
  endDate: String,
  organizationId: String
});

const sendHolidayNotificationEmail = async (holiday, users) => {
  const { holidayName, startDate, endDate } = holiday;

  for (const user of users) {
    await mailSender(user.email, "Upcoming Holiday Notification", `
        <div>
          <div>Dear ${user.name},</div>
          <div>Holiday: ${holidayName}</div>
          <div>Start Date: ${startDate}</div>
          <div>End Date: ${endDate}</div>
          <div>To accept, click the link below:</div>
          <a href="https://hrms.kusheldigi.com/accept/${holiday._id}">Accept Holiday</a>
        </div>
      `);
  }
};

mySchema.post('save', async function (doc) {
  const holiday = doc;

  const holidayStartDate = new Date(holiday.startDate);
  const now = new Date();

  const oneDayBeforeStart = new Date(holidayStartDate);
  oneDayBeforeStart.setDate(holidayStartDate.getDate() - 1);

  const timeUntilEmail = oneDayBeforeStart - now;

  if (timeUntilEmail > 0) {
    setTimeout(async () => {
      const users = await User.find();

      await sendHolidayNotificationEmail(holiday, users);
    }, timeUntilEmail);
  }
});


const Holiday = mongoose.model('Holiday', mySchema);

export default Holiday;



