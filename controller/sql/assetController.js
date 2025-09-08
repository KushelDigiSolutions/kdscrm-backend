import db from "../../db/sql_conn.js"
import mongoose from "mongoose";
import { removeUndefined } from "../../utils/util.js";
import { mailSender } from "../../utils/SendMail2.js";

// 🔹 Create Asset
export const createAsset = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { asset_name, identification_number, asset_condition, model_number, attachment, current_value, acquired_date, comments } = req.body;

        if (!asset_name) {
            return res.status(400).json({ success: false, message: "Asset name is required" });
        }

        const data = removeUndefined({
            asset_name,
            identification_number,
            asset_condition,
            model_number,
            attachment,
            current_value,
            acquired_date,
            comments,
            organizationId
        });

        const fields = Object.keys(data);
        const placeholders = fields.map(() => "?").join(", ");
        const values = Object.values(data);

        const [result] = await db.execute(
            `INSERT INTO asset (${fields.join(", ")}) VALUES (${placeholders})`,
            values
        );

        return res.status(201).json({
            success: true,
            message: "Asset created successfully",
            assetId: result.insertId,
            data
        });
    } catch (error) {
        console.error("Error creating asset:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 🔹 Get All Assets (with optional org filter)
export const getAssets = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const [rows] = await db.execute(
            "SELECT * FROM asset WHERE organizationId = ?",
            [organizationId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Error fetching assets" });
    }
};

// 🔹 Get Single Asset
export const getAssetById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute("SELECT * FROM asset WHERE id = ?", [id]);

        if (!rows.length) return res.status(404).json({ success: false, message: "Asset not found" });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching asset" });
    }
};

// 🔹 Update Asset
export const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const data = removeUndefined(req.body);

        if (!Object.keys(data).length) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const updates = Object.keys(data).map((key) => `${key} = ?`).join(", ");
        const values = [...Object.values(data), id];

        const [result] = await db.execute(
            `UPDATE asset SET ${updates} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }

        return res.status(200).json({ success: true, message: "Asset updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error updating asset" });
    }
};

// 🔹 Delete Asset
export const DeleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute("DELETE FROM asset WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }

        return res.status(200).json({ success: true, message: "Asset deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error deleting asset" });
    }
};





// 🔹 Create Transaction (allocation)
export const createTransaction = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { employee_id, asset_id, allocate_date, comments, notify_email } = req.body;

        if (!employee_id || !asset_id || !allocate_date) {
            return res.status(400).json({
                success: false,
                message: "employee_id, asset_id and allocate_date are required"
            });
        }



        // 1. Check if asset is already allocated
        const [assetRows] = await db.execute(
            "SELECT id, is_allocated, allocated_to FROM asset WHERE id = ? AND organizationId = ?",
            [asset_id, organizationId]
        );
        if (!assetRows.length) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }
        const asset = assetRows[0];
        if (asset.is_allocated) {
            return res.status(400).json({
                success: false,
                message: `This asset is already allocated to user ID ${asset.allocated_to}`
            });
        }

        // 2. Verify employee exists
        const [userRows] = await db.execute(
            "SELECT id, fullName, email FROM users WHERE id = ? AND organizationId = ?",
            [employee_id, organizationId]
        );
        if (!userRows.length) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }
        const user = userRows[0];

        // 3. Insert into asset_transactions
        const data = removeUndefined({
            employee_id,
            asset_id,
            allocate_date,
            comments,
            notify_email,
            organizationId
        });

        const fields = Object.keys(data);
        const placeholders = fields.map(() => "?").join(", ");
        const values = Object.values(data);

        const [result] = await db.execute(
            `INSERT INTO asset_transactions (${fields.join(", ")}) VALUES (${placeholders})`,
            values
        );

        // 4. Update asset status → allocated
        await db.execute(
            "UPDATE asset SET is_allocated = 1, allocated_to = ? WHERE id = ?",
            [employee_id, asset_id]
        );

        // 5. Send email notification if enabled
        if (notify_email) {
            const emailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>KDS CRM - Asset Allocation</title>
        <style>
          body { font-family: Arial, sans-serif; margin:0; padding:0; background:#f4f6f8; }
          .container { max-width:600px; margin:20px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);}
          .header { background:#2563eb; color:#ffffff; padding:20px; text-align:center; }
          .header h1 { margin:0; font-size:22px; }
          .content { padding:20px; color:#333333; }
          .content h2 { font-size:18px; color:#2563eb; margin-top:0; }
          .content p { font-size:15px; line-height:1.6; }
          .details { margin:20px 0; }
          .details table { width:100%; border-collapse:collapse; }
          .details td { padding:8px; border-bottom:1px solid #e5e7eb; font-size:14px; }
          .footer { background:#f9fafb; padding:15px; text-align:center; font-size:13px; color:#6b7280; }
          .btn { display:inline-block; margin-top:15px; padding:10px 20px; background:#2563eb; color:#fff; text-decoration:none; border-radius:6px; font-size:14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KDS CRM - Asset Allocation</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>You have been allocated a new asset in <strong>KDS CRM</strong>. Please find the details below:</p>

            <div class="details">
              <table>
                <tr><td><strong>Asset ID</strong></td><td>${asset_id}</td></tr>
                <tr><td><strong>Allocation Date</strong></td><td>${allocate_date}</td></tr>
                ${comments ? `<tr><td><strong>Comments</strong></td><td>${comments}</td></tr>` : ""}
              </table>
            </div>

            <p>Please login to <strong>KDS CRM</strong> to view more details about your allocated assets.</p>
            <a href="https://app.kdscrm.com/login" class="btn">Login to KDS CRM</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} KDS CRM. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
      `;

            await mailSender(
                organizationId,
                user.email,
                "Asset Allocation Notification - KDS CRM",
                emailTemplate
            );
        }

        return res.status(201).json({
            success: true,
            message: "Transaction created and asset allocated successfully",
            transactionId: result.insertId
        });
    } catch (error) {
        console.error("Error in createTransaction:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating transaction",
            error: error.message
        });
    }
};



// Asset Deallocation
export const deallocateAsset = async (req, res) => {
    try {
        const {
            transactionId,
            deallocation_date,
            handed_over_to,
            condition, // frontend se condition aa rahi hai
            deallocation_description,
            notify_email,
        } = req.body;

        if (!transactionId || !deallocation_date || !condition) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID, Deallocation Date aur Condition required hai",
            });
        }

        // Step 1: Transaction exist karta hai ya nahi check karo
        const [rows] = await db.execute(
            "SELECT * FROM asset_transactions WHERE id = ?",
            [transactionId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        // Step 2: Update transaction with deallocation details
        await db.execute(
            `UPDATE asset_transactions
       SET deallocation_date = ?, handed_over_to = ?, return_condition = ?, deallocation_description = ?, notify_email = ?
       WHERE id = ?`,
            [
                deallocation_date,
                handed_over_to || null,
                condition, // ✅ yaha JS variable ka naam "condition" hai, DB column "return_condition" hai
                deallocation_description || null,
                notify_email || false,
                transactionId,
            ]
        );

        // Step 3: Asset table me bhi mark karo ki allocated nahi hai
        await db.execute(
            `UPDATE asset
       SET is_allocated = FALSE, allocated_to = NULL
       WHERE id = ?`,
            [rows[0].asset_id]
        );

        // (Optional) Email notify logic agar notify_email true hai
        if (notify_email) {
            console.log("Send email notification to employee...");
        }

        return res.status(200).json({
            success: true,
            message: "Asset successfully deallocated",
        });
    } catch (error) {
        console.error("Deallocation error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};




// 🔹 Get All Transactions
export const getTransactions = async (req, res) => {
    try {
        const { organizationId } = req.user;

        const [rows] = await db.execute(
            `
           SELECT 
    at.*,
    u.fullName AS employee_name,
    u.profileImage AS employee_profile,
    h.fullName AS handover_name,
    h.profileImage AS handover_profile,
    a.asset_name,
    a.identification_number
FROM asset_transactions at
LEFT JOIN users u ON at.employee_id = u.id
LEFT JOIN users h ON at.handed_over_to = h.id
LEFT JOIN asset a ON at.asset_id = a.id
WHERE at.organizationId = ?

            `,
            [organizationId]
        );

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return res.status(500).json({ success: false, message: "Error fetching transactions" });
    }
};


export const getEmployeeTransactions = async (req, res) => {
    try {
        const { id } = req.user;

        const [rows] = await db.execute(
            `SELECT 
  at.id, 
  at.asset_id, 
  at.employee_id, 
  at.allocate_date, 
  at.deallocation_date, 
  at.comments, 
  at.handed_over_to, 
  at.created_at, 
  at.updated_at,

  u.fullName     AS employee_name,
  u.profileImage AS employee_profile,

  h.fullName     AS handover_name,
  h.profileImage AS handover_profile,

  a.asset_name, 
  a.identification_number,
  a.is_allocated  -- ✅ yaha se asset table ka is_allocated le lo
FROM asset_transactions at
LEFT JOIN users u ON u.id = at.employee_id
LEFT JOIN users h ON h.id = at.handed_over_to
LEFT JOIN asset a ON a.id = at.asset_id
WHERE at.employee_id = ?
ORDER BY at.created_at DESC
`,
            [id]
        );

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching transactions:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching transactions",
            error: error.message,
        });
    }
};



// 🔹 Get Single Transaction
export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute("SELECT * FROM asset_transactions WHERE id = ?", [id]);

        if (!rows.length) return res.status(404).json({ success: false, message: "Transaction not found" });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching transaction" });
    }
};

// 🔹 Update Transaction (also handle deallocation)
export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const data = removeUndefined(req.body);

        if (!Object.keys(data).length) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        const updates = Object.keys(data).map((key) => `${key} = ?`).join(", ");
        const values = [...Object.values(data), id];

        const [result] = await db.execute(
            `UPDATE asset_transactions SET ${updates} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        return res.status(200).json({ success: true, message: "Transaction updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Error updating transaction" });
    }
};

// 🔹 Delete Transaction
export const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.execute("DELETE FROM asset_transactions WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        return res.status(200).json({ success: true, message: "Transaction deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error deleting transaction" });
    }
};
