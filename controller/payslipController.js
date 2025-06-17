
import Payslip from "../models/PaySlip/Payslip.js"
import User from "../models/User/User.js";
import Leave from "../models/Leave/Leave.js"
import db from "../db/sql_conn.js"

export const getPayslip = async (req, res) => {
    try {
        const { month, year } = req.body;
        const monthNames = {
            "January": 1,
            "February": 2,
            "March": 3,
            "April": 4,
            "May": 5,
            "June": 6,
            "July": 7,
            "August": 8,
            "September": 9,
            "October": 10,
            "November": 11,
            "December": 12
        };

        // Find all users
        const [users] = await db.execute('SELECT * FROM users ORDER BY updatedAt DESC');
        const allUsers = users;

        let filteredUsers = allUsers.filter(user => {
            const { joiningDate } = user;

            const [yearPart, monthPart, datePart] = joiningDate.split("-");

            const dumYear = parseInt(yearPart);
            const dumMonth = parseInt(monthPart);

            const numMonth = monthNames[month];

            if (year > dumYear) {
                return true;
            }
            else if (year <= dumYear) {
                if (dumMonth <= numMonth) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }

        });
        const usersWithPayslipStatus = await Promise.all(filteredUsers.map(async (user) => {
            const [payslip, leaves] = await Promise.all([
                Payslip.findOne({
                    user: user.id,
                    month: month,
                    year: year
                }),
                Leave.find({
                    user: user.id,
                    status: "Accepted",
                    $or: [
                        { from: { $regex: `^${year}-${String(monthNames[month]).padStart(2, '0')}` } },
                        { to: { $regex: `^${year}-${String(monthNames[month]).padStart(2, '0')}` } }
                    ]
                })
            ]);

            let totalLeaves = 0;
            leaves.forEach(leave => {
                const leaveDays = parseInt(leave.days);
                totalLeaves += isNaN(leaveDays) ? 1 : leaveDays + 1;
            });

            return {
                user: user,
                status: payslip ? payslip.status : "Unpaid",
                month,
                year,
                totalLeaves
            };
        }));


        return res.status(200).json({
            status: true,
            message: "Payslip details fetched successfully",
            payslipDetails: usersWithPayslipStatus
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

export const togglePayslip = async (req, res) => {
    try {
        const { userId } = req.params;
        const { month, year } = req.body;

        // Check if the user exists
        const [user] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        // Check if the user already has a payslip for the given month and year
        let payslip = await Payslip.findOne({
            user: userId,
            month: month,
            year: year
        });

        if (!payslip) {
            // If payslip doesn't exist, create a new one and mark it as paid
            payslip = await Payslip.create({
                user: userId,
                month: month,
                year: year,
                status: "Paid"
            });
        } else {
            // If payslip exists, toggle its status
            payslip.status = payslip.status === "Paid" ? "Unpaid" : "Paid";
            await payslip.save();
        }

        return res.status(200).json({
            status: true,
            message: "Payslip status toggled successfully",
            payslip: payslip
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

export const bulkPayslip = async (req, res) => {
    try {
        const { month, year } = req.body;

        // Get all users
        const users = await User.find();

        // Iterate over each user and create payslip
        for (const user of users) {
            // Check if the user already has a payslip for the given month and year
            let payslip = await Payslip.findOne({
                user: user._id,
                month: month,
                year: year
            });

            if (!payslip) {
                // If payslip doesn't exist, create a new one and mark it as paid
                payslip = await Payslip.create({
                    user: user._id,
                    month: month,
                    year: year,
                    status: "Paid"
                });
            }
            else {
                // If payslip exists, update its status to "Paid"
                payslip.status = "Paid";
                await payslip.save();
            }
        }

        return res.status(200).json({
            status: true,
            message: `Bulk payslips for ${month}-${year} created successfully`
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

export const SetUserTotalLeave = async (req, res) => {
    try {
        // Find all users
        const allUsers = await User.find({});


        // Initialize an object to store total leaves for each user
        const userTotalLeaves = {};

        // Iterate over each user
        for (const user of allUsers) {
            // Find all leaves for the current user
            const leaves = await Leave.find({
                user: user.id,
                status: "Accepted"
            });

            let totalLeaves = 0;

            // Calculate total leaves for the user
            leaves.forEach(leave => {
                const leaveDays = parseInt(leave.days);
                totalLeaves += isNaN(leaveDays) ? 1 : leaveDays + 1;
            });

            // Update user's totalLeave field
            user.totalLeaves = totalLeaves;

            // Save updated user
            await user.save();

            // Store user's total leaves for response or further processing
            userTotalLeaves[user.id] = totalLeaves;
        }

        return res.status(200).json({
            status: true,
            message: "User total leaves updated successfully",
            userTotalLeaves: userTotalLeaves
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};