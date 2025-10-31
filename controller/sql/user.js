import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import db from "../../db/sql_conn.js"
import jwt from "jsonwebtoken"
import { uploadToCloudinary } from "../../utils/cloudinary.js"
import { SendEmail } from '../../utils/SendEmail.js';
import Clients from '../../models/Tasks/Clients.js';
import mongoose from 'mongoose';
import { mailSender } from '../../utils/SendMail2.js';
import EmailModel from '../../models/EmailModel.js';


/**
 * Remove any keys whose value is exactly undefined
 * @param {object} obj 
 * @returns {object} new object without undefined values
 */
function removeUndefined(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
}


/* =================== Organization ================================*/

export const createOrganization = async (req, res) => {
    try {
        const { name, email, userLimit, imageUrl, imageUrl2 } = req.body;
        if (!name || !email || userLimit == null) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        const [existing] = await db.execute(
            'SELECT 1 FROM organizations WHERE email = ?', [email]
        );
        if (existing.length) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const subscriptionStart = new Date();
        const subscriptionEnd = new Date();
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 3);
        const data = removeUndefined({ name, email, userLimit, imageUrl, imageUrl2, subscriptionStart, subscriptionEnd });

        // Generate a unique ID
        let unique = false;
        let generatedId;
        while (!unique) {
            generatedId = new mongoose.Types.ObjectId().toHexString();
            const [existingId] = await db.execute(
                'SELECT 1 FROM organizations WHERE id = ?', [generatedId]
            );
            if (!existingId.length) unique = true;
        }
        data.id = generatedId;

        // dynamic INSERT
        const fields = Object.keys(data);
        const placeholders = fields.map(_ => '?').join(', ');
        const values = fields.map(k => data[k]);

        await db.execute(
            `INSERT INTO organizations (${fields.join(', ')}) VALUES (${placeholders})`,
            values
        );

        return res.status(201).json({
            status: true,
            message: "Organization created successfully",
            data
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getOrganization = async (req, res) => {
    try {
        const [organizations] = await db.execute('SELECT * FROM organizations ORDER BY updatedAt DESC');
        return res.status(200).json(organizations);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export const getOrganizationById = async (req, res) => {
    const { id } = req.params;

    try {
        const [organization] = await db.execute('SELECT * FROM organizations WHERE id = ?', [id]);
        if (organization.length === 0) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        return res.status(200).json(organization[0]);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export const updateOrganization = async (req, res) => {
    const { id } = req.params;
    const { name, email, userLimit, imageUrl, imageUrl2, isDeactivated } = req.body;

    try {
        const data = removeUndefined({ name, email, userLimit, imageUrl, isDeactivated, imageUrl2 });
        console.log(data);

        const fields = Object.keys(data);
        const values = Object.values(data);

        // Build SET clause like "name = ?, email = ?"
        const setClause = fields.map(field => `${field} = ?`).join(', ');

        const [result] = await db.execute(
            `UPDATE organizations SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        const [rows] = await db.execute('SELECT * FROM organizations WHERE id = ?', [id]);
        return res.status(200).json({ id, data: rows[0], status: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message, status: false });
    }
};


export const deleteOrganization = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.execute('DELETE FROM organizations WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        return res.status(200).json({ message: 'Organization deleted' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

/* =================== Permission Roles ================================*/

const allPermission = [
    "leadEditPermission",
    "leadCreatePermission",
    "permissionPagePermission",
    "leadPermission",
    "projectDeletePermission",
    "showProjectPermission",
    "showAllProjectPermission",
    "projectEditPermission",
    "projectCreatePermission",
    "leadSystemPermission",
    "leadSystemSettingEditPermission",
    "leadSystemSettingDeletePermission",
    "leadSystemSettingCreatePermission",
    "showTasksDetailPermission",
    "addTaskPermission",
    "deleteTaskPermission",
    "editTaskPermission",
    "hrmsSetUpPermission",
    "hrmsSetupEditPermission",
    "hrmsSetupCreatePermission",
    "hrmsSetupDeletePermission",
    "hrAdminSetupPermission",
    "trainingSetupPermission",
    "assetsPermission",
    "userAllowanceCreatePermission",
    "showExpensePermission",
    "createExpensePermission",
    "payrollPermission",
    "activeEmployeePermission",
    "leaveRequestPermission",
    "employeeOnLeavePermission",
    "totalEmployeePermission",
    "paySlipActionPermission",
    "halfDayPermission",
    "attendencePermission",
    "documentPermission",
    "leaveManagePermission",
    "leaveReqestEditPermission",
    "leaveReqestActionPermission",
    "performancePermission",
    "employeeManagePermission",
    "employeeManageEditPermission",
    "employeeManageActivatePermission",
    "hrManagement",
    "holidaylistPermission",
];

// Create Permissions
export const providePermissions = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const { name, Service } = req.body;

        if (!organizationId || !name || !Service) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        // 1. Validate organization exists
        const [orgResult] = await db.execute('SELECT id FROM organizations WHERE id = ?', [organizationId]);
        if (orgResult.length === 0) {
            return res.status(400).json({ status: false, message: 'Invalid organizationId' });
        }

        // 2. Check if same role name exists in the same org
        const [existing] = await db.execute(
            'SELECT 1 FROM permission_roles WHERE name = ? AND organizationId = ?',
            [name, organizationId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ status: false, message: 'Role already exists in this organization' });
        }
        // Generate a unique ID
        let unique = false;
        let generatedId;
        while (!unique) {
            generatedId = new mongoose.Types.ObjectId().toHexString();
            const [existingId] = await db.execute(
                'SELECT 1 FROM permission_roles WHERE id = ?', [generatedId]
            );
            if (!existingId.length) unique = true;
        }
        const id = generatedId;


        // 3. Initialize and update permissions
        const permissions = Object.fromEntries(allPermission.map(p => [p, false]));
        if (Array.isArray(Service)) {
            Service.forEach(p => {
                if (permissions.hasOwnProperty(p)) {
                    permissions[p] = true;
                }
            });
        }

        const fields = ['id', 'name', 'organizationId', ...allPermission];
        const values = [id, name, organizationId, ...allPermission.map(p => permissions[p])];
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO permission_roles (${fields.join(', ')}) VALUES (${placeholders})`;

        await db.execute(query, values);

        res.status(201).json({
            status: true,
            message: 'Role created successfully',
            role: { id, name, organizationId, permissions }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: error.message });
    }
}

// Get all Permissions Roles
export const getAllPerissionRoles = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM permission_roles ORDER BY updatedAt DESC');
        res.status(200).json({
            status: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
}

// Get all organization permission Roles 
export const getOrganizationPermission = async (req, res) => {
    try {
        const { organizationId } = req.user;
        if (!organizationId) {
            return res.status(400).json({ status: false, message: 'organizationId required' });
        }

        const [rows] = await db.execute(
            'SELECT * FROM permission_roles WHERE organizationId = ? ORDER BY updatedAt DESC',
            [organizationId]
        );
        `                                                                                 `
        res.status(200).json({
            status: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching roles by organization:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
}

// Get Single Permission Role
export const getPermission = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: false, message: 'id required' });
        }

        const [rows] = await db.execute(
            'SELECT * FROM permission_roles WHERE id = ? ORDER BY updatedAt DESC',
            [id]
        );
        // 🟡 Check if no record found
        if (rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Permission role not found',
            });
        }
        res.status(200).json({
            status: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching roles by organization:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error'
        });
    }
}

// Update Permission
export const updatePermission = async (req, res) => {
    try {
        const { roleId, Service, name } = req.body;

        if (!roleId || !name) {
            return res.status(400).json({ status: false, message: 'roleId and name are required' });
        }

        // Check if role exists
        const [existingRows] = await db.execute('SELECT * FROM permission_roles WHERE id = ?', [roleId]);
        if (existingRows.length === 0) {
            return res.status(404).json({ status: false, message: 'Role not found' });
        }

        // Build permissions update string and values dynamically
        const updatedPermissions = allPermission.reduce((acc, perm) => {
            acc[perm] = Array.isArray(Service) && Service.includes(perm) ? 1 : 0;
            return acc;
        }, {});

        // Prepare SET clause for SQL update
        const setClauses = [`name = ?`];
        const values = [name];

        for (const [key, val] of Object.entries(updatedPermissions)) {
            setClauses.push(`${key} = ?`);
            values.push(val);
        }
        values.push(roleId);

        const query = `UPDATE permission_roles SET ${setClauses.join(', ')} WHERE id = ?`;
        await db.execute(query, values);

        // Return updated role data
        const [updatedRows] = await db.execute('SELECT * FROM permission_roles WHERE id = ?', [roleId]);

        res.status(200).json({
            status: true,
            message: 'Permissions updated successfully',
            role: updatedRows[0]
        });

    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({
            status: false,
            message: 'Internal server error'
        });
    }
}

// Delete Permission
export const deletePermissionRole = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: false, message: 'roleId is required' });
        }

        const [result] = await db.execute('DELETE FROM permission_roles WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: 'Role not found' });
        }

        res.status(200).json({
            status: true,
            message: 'Role deleted successfully',
        });
    } catch (error) {
        console.error('DeleteRoleApi Error:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                status: false,
                message: 'Cannot delete role because it is assigned to one or more users',
            });
        }

        res.status(500).json({
            status: false,
            message: 'Failed to delete role',
            error,
        });
    }
};


/* =================== User ================================*/

// Create User
export const createUser = async (req, res) => {
    try {
        const { organizationId } = req.user
        const {
            fullName,
            password,
            department,
            gmail,
            reportingManager,
            designation,
            joiningDate,
            email,
            email1,
            mobile,
            gender,
            dob,
            pan,
            adhar,
            father,
            currentAddress,
            currentState,
            currentCity,
            currentPin,
            residence,
            perState,
            perCity,
            perPin,
            Martial,
            nationality,
            Mother,
            qualification,
            specialization,
            qualificationType,
            yearPass,
            university,
            college,
            percentage,
            previousCompany,
            profileImage,
            previousDesignation,
            toDate,
            fromDate,
            numberOfMonth,
            Jobdescription,
            SalaryPay,
            SalaryBankName,
            BeneficiaryName,
            BankIfsc,
            AccountNumber,
            confirmAccount,
            Branch,
            EmployeeType,
            PermissionRole,
            employeeCode,
            leaveNumber

        } = req.body;

        if (!organizationId) {
            return res.status(400).json({ status: false, message: "Organization ID is required" });
        }

        // Get user limit and check organization exists
        const [orgRows] = await db.execute('SELECT userLimit FROM organizations WHERE id = ?', [organizationId]);
        if (orgRows.length === 0) {
            return res.status(400).json({ status: false, message: "Invalid organization ID" });
        }
        const userLimit = orgRows[0].userLimit;

        // Count existing users in the organization
        const [[{ currentUserCount }]] = await db.execute(
            'SELECT COUNT(*) AS currentUserCount FROM users WHERE organizationId = ?',
            [organizationId]
        );

        // Check if user limit is reached
        if (currentUserCount >= userLimit) {
            return res.status(400).json({
                status: false,
                message: "User limit exceeded for this organization",
            });
        }

        // Validate permission role if provided
        if (PermissionRole && PermissionRole !== "Select Role") {
            const [roleRows] = await db.execute(
                'SELECT 1 FROM permission_roles WHERE id = ? AND organizationId = ?',
                [PermissionRole, organizationId]
            );
            if (roleRows.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: "Permission role does not belong to the organization",
                });
            }
        }

        // Check if email already exists
        const [userRows] = await db.execute(
            'SELECT 1 FROM users WHERE email = ? AND organizationId = ?',
            [email, organizationId]
        );
        if (userRows.length > 0) {
            return res.status(400).json({
                status: false,
                message: "Email already registered in this organization",
            });
        }

        // Prepare data
        const data = removeUndefined({
            fullName,
            password,
            department,
            gmail,
            reportingManager,
            designation,
            joiningDate,
            email,
            email1,
            mobile,
            gender,
            dob,
            pan,
            adhar,
            profileImage,
            father,
            currentAddress,
            currentState,
            currentCity,
            currentPin,
            residence,
            perState,
            perCity,
            perPin,
            Martial,
            nationality,
            Mother,
            qualification,
            specialization,
            qualificationType,
            yearPass,
            university,
            college,
            percentage,
            previousCompany,
            previousDesignation,
            toDate,
            fromDate,
            numberOfMonth,
            Jobdescription,
            SalaryPay,
            SalaryBankName,
            BeneficiaryName,
            BankIfsc,
            AccountNumber,
            confirmAccount,
            Branch,
            EmployeeType,
            employeeCode,
            leaveNumber,
            organizationId,
        });


        // Generate a unique ID
        let unique = false;
        let generatedId;
        while (!unique) {
            generatedId = new mongoose.Types.ObjectId().toHexString();
            const [existingId] = await db.execute(
                'SELECT 1 FROM users WHERE id = ?', [generatedId]
            );
            if (!existingId.length) unique = true;
        }
        data.id = generatedId;

        // Assign role
        const role = department === "Hr" ? "HR" : department === "Manager" ? "MANAGER" : "EMPLOYEE";
        data.role = role;

        // Hash password
        const saltRounds = 10;
        data.password = await bcrypt.hash(password, saltRounds);

        // Assign permission role
        if (PermissionRole && PermissionRole !== "Select Role") {
            data.permissionRoleId = PermissionRole;
        } else {
            data.permissionRoleId = null;
        }

        // Remove unused key
        delete data.PermissionRole;

        // Prepare SQL insert
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(k => data[k]);
        const query = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;

        await db.execute(query, values);
        const message = `
            <div>
                  Welcome aboard! We are excited to have you as a part of our team and introduce you to our HRMS system. Here, you’ll find a centralized platform for managing essential HR-related tasks and accessing important information.
        <br/>
        Your account has been successfully created and below are your login details:
        <br/>
        - email: ${email} 
        - Temporary ${password}:
        <br/>
        Please use the link below to log in for the first time. For security purposes, we recommend changing your password after your initial login.
        <br/>
        Login Here; ${`https://app.kdscrm.com/login`}
        
        <br/>
        If you have any questions or need assistance, please don’t hesitate to reach out to our support team.
        
        Welcome once again!
        <br/>
        Best Regards, 
        Kushel Digi Solutions
             </div>
          `;

        const html = `
  <div style="max-width:600px; margin:0 auto; font-family:Arial, sans-serif; background-color:#f7f9fc; padding:20px; border:1px solid #e0e0e0; border-radius:8px; color:#333;">
    <h2 style="color:#4A90E2; text-align:center;">Welcome to Kushel Digi HRMS 🎉</h2>

    <p style="font-size:15px; line-height:1.6;">
      We are excited to welcome you to the team! Our <strong>HRMS system</strong> is your central hub for managing essential HR tasks and accessing important information.
    </p>

    <p style="font-size:15px; line-height:1.6;">Your account has been successfully created. Below are your login credentials:</p>

    <table style="width:100%; margin-top:15px; border-collapse:collapse; font-size:15px;">
      <tr>
        <td style="padding:8px; font-weight:bold;">Email</td>
        <td style="padding:8px;">${email}</td>
      </tr>
      <tr>
        <td style="padding:8px; font-weight:bold;">Temporary Password</td>
        <td style="padding:8px;">${password}</td>
      </tr>
    </table>

    <p style="font-size:15px; margin-top:20px;">
      Please click the button below to log in for the first time:
    </p>

    <div style="text-align:center; margin:20px 0;">
      <a href="https://hrms.kusheldigi.com/login" style="background-color:#4A90E2; color:white; padding:12px 24px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;">
        Login to HRMS
      </a>
    </div>

    <p style="font-size:14px; color:#555;">
      For security, please change your password after logging in.
    </p>

    <p style="font-size:14px; color:#555;">
      If you have any questions or need help, feel free to contact our support team.
    </p>

    <p style="font-size:14px; margin-top:30px;">Best Regards,<br><strong>Kushel Digi Solutions</strong></p>
  </div>
`;

        await SendEmail(organizationId, email, "Login Details", message, html);

        return res.status(201).json({
            status: true,
            message: "User created successfully",
            data,
        });

    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error", error });
    }
};

// Create Admin
export const createAdmin = async (req, res) => {
    0
    try {
        const {
            fullName,
            password,
            department,
            gmail,
            reportingManager,
            designation,
            joiningDate,
            email,
            email1,
            mobile,
            gender,
            dob,
            pan,
            adhar,
            father,
            currentAddress,
            currentState,
            currentCity,
            currentPin,
            residence,
            perState,
            perCity,
            perPin,
            profileImage,
            Martial,
            nationality,
            Mother,
            qualification,
            specialization,
            qualificationType,
            yearPass,
            university,
            college,
            percentage,
            previousCompany,
            previousDesignation,
            toDate,
            fromDate,
            numberOfMonth,
            Jobdescription,
            SalaryPay,
            SalaryBankName,
            BeneficiaryName,
            BankIfsc,
            AccountNumber,
            confirmAccount,
            Branch,
            EmployeeType,
            PermissionRole,
            employeeCode,
            organizationId,
            leaveNumber
        } = req.body;

        // Required field validation
        if (!organizationId || !email || !fullName || !password) {
            return res.status(400).json({ status: false, message: "Required fields are missing" });
        }

        // Validate Organization
        const [orgRows] = await db.execute('SELECT userLimit FROM organizations WHERE id = ?', [organizationId]);
        if (orgRows.length === 0) {
            return res.status(400).json({ status: false, message: "Invalid organization ID" });
        }

        const userLimit = orgRows[0].userLimit;

        const [[{ currentUserCount }]] = await db.execute(
            'SELECT COUNT(*) AS currentUserCount FROM users WHERE organizationId = ?',
            [organizationId]
        );

        if (currentUserCount >= userLimit) {
            return res.status(400).json({ status: false, message: "User limit exceeded for this organization" });
        }

        // Check if email already exists in the same org
        const [userRows] = await db.execute(
            'SELECT 1 FROM users WHERE email = ? AND organizationId = ?',
            [email, organizationId]
        );
        if (userRows.length > 0) {
            return res.status(400).json({ status: false, message: "Email already exists" });
        }

        // Validate Permission Role
        let permissionRoleId = null;
        if (PermissionRole && PermissionRole !== "Select Role") {
            const [roleRows] = await db.execute(
                'SELECT id FROM permission_roles WHERE id = ? AND organizationId = ?',
                [PermissionRole, organizationId]
            );
            if (roleRows.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: "Permission role does not belong to this organization or does not exist",
                });
            }
            permissionRoleId = roleRows[0].id;
        }

        // Generate unique user ID
        let unique = false;
        let generatedId;
        while (!unique) {
            generatedId = new mongoose.Types.ObjectId().toHexString();
            const [existingId] = await db.execute('SELECT 1 FROM users WHERE id = ?', [generatedId]);
            if (!existingId.length) unique = true;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare insert data
        const data = removeUndefined({
            id: generatedId,
            fullName,
            password: hashedPassword,
            department,
            gmail,
            reportingManager,
            designation,
            joiningDate,
            email,
            email1,
            mobile,
            gender,
            dob,
            pan,
            adhar,
            father,
            currentAddress,
            currentState,
            currentCity,
            currentPin,
            residence,
            perState,
            perCity,
            perPin,
            Martial,
            nationality,
            Mother,
            qualification,
            specialization,
            qualificationType,
            yearPass,
            university,
            college,
            percentage,
            previousCompany,
            previousDesignation,
            profileImage,
            toDate,
            fromDate,
            numberOfMonth,
            Jobdescription,
            SalaryPay,
            SalaryBankName,
            BeneficiaryName,
            BankIfsc,
            AccountNumber,
            confirmAccount,
            Branch,
            EmployeeType,
            leaveNumber,
            employeeCode,
            organizationId,
            role: "ADMIN",
            permissionRoleId: permissionRoleId,
        });

        // Insert into MySQL
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(key => data[key]);
        const query = `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`;

        await db.execute(query, values);

        // Email content (optional)
        const html = `
        <div>
            Welcome Admin! Your HRMS admin account has been successfully created.<br/>
            <strong>Email:</strong> ${email}<br/>
            <strong>Temporary Password:</strong> ${password}<br/>
            <br/>
            <a href="https://app.kdscrm.com/login">Login here</a><br/>
            Please change your password after logging in.<br/><br/>
            Regards,<br/>Kushel Digi Solutions
        </div>`;

        await SendEmail(organizationId, email, "Your Admin Account is Ready", html, html); // Uncomment if email sending configured

        return res.status(201).json({
            status: true,
            message: "Admin created successfully",
            data
        });

    } catch (error) {
        console.error("Error creating admin:", error);
        return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
};

// Update User
export const UpdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fullName,
            department,
            gmail,
            reportingManager,
            designation,
            joiningDate,
            email1,
            mobile,
            gender,
            dob,
            pan,
            adhar,
            father,
            currentAddress,
            currentState,
            currentCity,
            currentPin,
            residence,
            perState,
            perCity,
            perPin,
            Martial,
            nationality,
            Mother,
            qualification,
            specialization,
            qualificationType,
            yearPass,
            university,
            college,
            percentage,
            previousCompany,
            previousDesignation,
            profileImage,
            toDate,
            fromDate,
            numberOfMonth,
            Jobdescription,
            SalaryPay,
            SalaryBankName,
            BeneficiaryName,
            BankIfsc,
            AccountNumber,
            confirmAccount,
            Branch,
            EmployeeType,
            PermissionRole,
            employeeCode,
            leaveNumber
        } = req.body;
        console.log(req.body);

        if (!id) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        // Check if user exists
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (userRows.length === 0) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        // Hash password if provided
        // let hashedPassword = null;
        // if (password) {
        //     const saltRounds = 10;
        //     hashedPassword = await bcrypt.hash(password, saltRounds);
        // }
        console.log(profileImage)

        // Prepare update data
        const data = removeUndefined({
            fullName,
            department,
            gmail,
            reportingManager,
            designation,
            joiningDate,
            email1,
            mobile,
            gender,
            dob,
            pan,
            adhar,
            father,
            currentAddress,
            currentState,
            currentCity,
            currentPin,
            residence,
            perState,
            perCity,
            perPin,
            Martial,
            nationality,
            Mother,
            qualification,
            specialization,
            qualificationType,
            yearPass,
            university,
            college,
            percentage,
            previousCompany,
            previousDesignation,
            profileImage,
            toDate,
            fromDate,
            numberOfMonth,
            Jobdescription,
            SalaryPay,
            SalaryBankName,
            BeneficiaryName,
            BankIfsc,
            AccountNumber,
            confirmAccount,
            Branch,
            EmployeeType,
            employeeCode,
            leaveNumber
        });
        console.log(data);
        console.log(data.profileImage, " at 1043")
        // Set role from department
        // if (department) {
        //     data.role = department === "Hr" ? "HR" : department === "Manager" ? "MANAGER" : "EMPLOYEE";
        // }

        // // Set hashed password if available
        // if (hashedPassword) {
        //     data.password = hashedPassword;
        // }

        // Set permission role if provided
        if (PermissionRole && PermissionRole === "Select Role") {
            data.permissionRoleId = null;
        } else if (PermissionRole) {
            data.permissionRoleId = PermissionRole;
        }

        // Ensure there is at least one field to update
        const fields = Object.keys(data);
        const values = fields.map(key => data[key]);

        if (fields.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No valid fields provided for update"
            });
        }

        // Build and run SQL update
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const query = `UPDATE users SET ${setClause} WHERE id = ?`;
        await db.execute(query, [...values, id]);

        // Fetch updated user
        const [updatedRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        const updatedUser = updatedRows[0];

        return res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: updatedUser,
        });

    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
};

// Update User By Active and Deactive
export const UpdateUserActivityMode = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (userRows.length === 0) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        const currentStatus = userRows[0].isDeactivated;

        // Toggle the status
        const newStatus = currentStatus === 'Yes' ? 'No' : 'Yes';

        // Update the user status
        await db.execute('UPDATE users SET isDeactivated = ? WHERE id = ?', [newStatus, id]);

        return res.status(200).json({
            status: true,
            message: `User has been ${newStatus === 'Yes' ? 'deactivated' : 'activated'} successfully.`,
            newStatus
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
};

// Get User 
export const GetUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT * FROM users ORDER BY updatedAt DESC');
        return res.status(200).json({
            status: true,
            data: users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
};

// Get Single User By Id
export const GetSingleUser = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        // Step 1: Fetch user
        const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const { password, ...user } = users[0];
        // const user = users[0];

        // Step 2: Fetch permission role if available
        let permissionRole = null;
        if (user.permissionRoleId) {
            const [roles] = await db.execute('SELECT * FROM permission_roles WHERE id = ?', [user.permissionRoleId]);
            if (roles.length > 0) {
                const { organizationId, createdAt, updatedAt, ...rest } = roles[0];
                permissionRole = rest;
            }
        }
        user.permissionRole = permissionRole;

        // Step 3: Fetch user documents
        const [documents] = await db.execute(
            'SELECT id, name, url FROM documents WHERE userId = ?',
            [userId]
        );
        user.documents = documents; // Attach documents to user object

        return res.status(200).json({
            status: true,
            data: user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
};


// Get User By Organization
export const getUserByOrganization = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            return res.status(400).json({ status: false, message: "Organization ID is required" });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE organizationId = ? ORDER BY updatedAt DESC', [organizationId]);

        // Get all permissionRoleIds
        const permissionRoleIds = [...new Set(users.map(u => u.permissionRoleId).filter(Boolean))];

        // Fetch permissionRoles in bulk
        let rolesMap = {};
        if (permissionRoleIds.length > 0) {
            const placeholders = permissionRoleIds.map(() => '?').join(',');
            const [roles] = await db.execute(`SELECT * FROM permission_roles WHERE id IN (${placeholders})`, permissionRoleIds);
            rolesMap = roles.reduce((acc, role) => {
                const { organizationId, createdAt, updatedAt, ...rest } = role;
                acc[role.id] = rest;
                return acc;
            }, {});
        }

        // Attach permissionRole to each user
        const sanitizedUsers = users.map(user => {
            if (user.permissionRoleId && rolesMap[user.permissionRoleId]) {
                user.permissionRole = rolesMap[user.permissionRoleId];
            } else {
                user.permissionRole = null;
            }
            return user;
        });

        return res.status(200).json({
            status: true,
            data: sanitizedUsers,
        });
    } catch (error) {
        console.error("Error fetching users by organization:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
}

// Delete a User
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        return res.status(200).json({
            status: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
};



const generateClientRefreshToken = async (userId) => {
    try {
        const user = await Clients.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const token = user.generateAuthToken();
        return token;
    } catch (error) {
        // Log the actual error for debugging purposes
        console.error("Error in generateRefreshToken:", error.message);

        throw new ApiError(500, "Something went wrong");
    }
};
// User Login
export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: false, message: "Email and password required" });
        }

        // Fetch user by email
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {

            const client = await Clients.findOne({ Email: email });
            const [myOrg] = await db.execute('SELECT name, imageUrl, imageUrl2, id, email FROM organizations WHERE id = ?', [client.organizationId]);
            const organization = myOrg[0];
            // return next(new ApiError(404, "User not found"));
            if (!client) {
                return res.status(404).json({
                    status: false,
                    message: "User not found",
                });
            }

            const isMatch = await bcrypt.compare(password, client.Password);

            console.log('this ', password)
            if (!isMatch) {
                return res.status(401).json({
                    status: false,
                    message: "Incorrect password",
                });
            }
            const token = await generateClientRefreshToken(client._id);
            return res.status(200).json({
                status: true,
                message: "Login successful",
                user: client,
                token,
                organization
            });

        }
        const user = users[0];

        // Fetch permissionRole if exists
        let permissionRole = null;
        if (user.permissionRoleId) {
            const [roles] = await db.execute('SELECT * FROM permission_roles WHERE id = ?', [user.permissionRoleId]);
            if (roles.length > 0) {
                const { organizationId, createdAt, updatedAt, ...rest } = roles[0];
                permissionRole = rest;
            }
        }
        // let document = []
        const [documents] = await db.execute(
            `SELECT * FROM documents WHERE userId = ?`,
            [user.id]
        );
        user.permissionRole = permissionRole;
        user.document = documents

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: false, message: "Invalid Password" });
        }

        if (user.isDeactivated === "Yes") {
            return res.status(403).json({
                status: false,
                message: "User account is deactivated",
            });
        }

        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
        };

        const token = jwt.sign(payload, process.env.SK, { expiresIn: '500d' });
        const [myOrg] = await db.execute('SELECT name, imageUrl, imageUrl2, id, email FROM organizations WHERE id = ?', [user.organizationId]);
        const organization = myOrg[0];

        return res.status(200).json({
            status: true,
            message: "Login successful",
            token,
            user,
            organization
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
};

export const fetchUserDetail = async (req, res) => {
    try {
        const { email } = req.user;
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {

            const client = await Clients.findOne({ Email: email });
            if (!client) {
                return res.status(404).json({
                    status: false,
                    message: "User not found",
                });
            }
            const token = await generateClientRefreshToken(client._id);
            return res.status(200).json({
                status: true,
                message: "Login successful",
                user: client,
                token,
            });

        }
        const user = users[0];

        // Fetch permissionRole if exists
        let permissionRole = null;
        if (user.permissionRoleId) {
            const [roles] = await db.execute('SELECT * FROM permission_roles WHERE id = ?', [user.permissionRoleId]);
            if (roles.length > 0) {
                const { organizationId, createdAt, updatedAt, ...rest } = roles[0];
                permissionRole = rest;
            }
        }
        // let document = []
        const [documents] = await db.execute(
            `SELECT * FROM documents WHERE userId = ?`,
            [user.id]
        );
        user.permissionRole = permissionRole;
        user.document = documents

        if (user.isDeactivated === "Yes") {
            return res.status(403).json({
                status: false,
                message: "User account is deactivated",
            });
        }

        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId,
        };

        const token = jwt.sign(payload, process.env.SK, { expiresIn: '500d' });

        return res.status(200).json({
            status: true,
            message: "Login successful",
            token,
            user,
        });

    } catch (error) {

    }
}

/* =================== Users Documents ================================*/

export const uploadUserDocuments = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(userId)
        const {
            adharCard,
            pancard,
            tenCert,
            twevelCert,
            cancelCheque,
            LastOrganization,
            RelievingLetter,
            OfferLetter,
            ExperienceLetter,
            ITR,
            ITR2,
        } = req.files;

        // 1. Verify user exists
        const [users] = await db.execute(`SELECT * FROM users WHERE id = ?`, [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2. Fetch existing documents
        const [existingDocs] = await db.execute(
            `SELECT * FROM documents WHERE userId = ?`,
            [userId]
        );

        const documentsToUpload = [
            { name: "adharCard", file: adharCard },
            { name: "pancard", file: pancard },
            { name: "tenCert", file: tenCert },
            { name: "twevelCert", file: twevelCert },
            { name: "cancelCheque", file: cancelCheque },
            { name: "LastOrganization", file: LastOrganization },
            { name: "RelievingLetter", file: RelievingLetter },
            { name: "OfferLetter", file: OfferLetter },
            { name: "ExperienceLetter", file: ExperienceLetter },
            { name: "ITR", file: ITR },
            { name: "ITR2", file: ITR2 },
        ];

        for (let doc of documentsToUpload) {
            if (doc.file) {
                const cloudData = await uploadToCloudinary(doc.file.tempFilePath);

                const existing = existingDocs.find(d => d.name === doc.name);

                if (existing) {
                    // Update
                    await db.execute(
                        `UPDATE documents SET url = ? WHERE id = ?`,
                        [cloudData.secure_url, existing.id]
                    );
                } else {
                    // Insert
                    // Generate a unique ID
                    let unique = false;
                    let generatedId;
                    while (!unique) {
                        generatedId = new mongoose.Types.ObjectId().toHexString();
                        const [existingId] = await db.execute(
                            'SELECT 1 FROM organizations WHERE id = ?', [generatedId]
                        );
                        if (!existingId.length) unique = true;
                    }
                    const id = generatedId;
                    await db.execute(
                        `INSERT INTO documents (id, name, url, userId) VALUES (?, ?, ?, ?)`,
                        [id, doc.name, cloudData.secure_url, userId]
                    );
                }
            }
        }

        // 3. Get updated docs
        const [updatedDocs] = await db.execute(
            `SELECT * FROM documents WHERE userId = ?`,
            [userId]
        );

        return res.status(200).json({
            status: true,
            message: "Documents uploaded/updated successfully",
            documents: updatedDocs,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

export const getUserDocuments = async (req, res) => {
    try {
        const { userId } = req.body; // <-- Check where you send userId from client

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const [documents] = await db.execute(
            `SELECT * FROM documents WHERE userId = ?`,
            [userId]
        );

        if (!documents || documents.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No documents found for this user",
            });
        }

        return res.status(200).json({
            success: true,
            documents,
        });
    } catch (error) {
        console.log("Error fetching documents:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/* =================== Assets ================================*/

// Post Assets
export const postAssets = async (req, res) => {
    try {
        const { organizationId } = req.user;
        const {
            userId,
            designation,
            department,
            product,
            purchaseDate,
            additonal,
            description,
            status,
        } = req.body;

        // 1. Verify user exists
        const [userRows] = await db.execute(
            'SELECT id, fullName, organizationId, email FROM users WHERE id = ?',
            [userId]
        );
        if (userRows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }
        const user = userRows[0];
        // Generate a unique ID
        let unique = false;
        let generatedId;
        while (!unique) {
            generatedId = new mongoose.Types.ObjectId().toHexString();
            const [existingId] = await db.execute(
                'SELECT 1 FROM assets WHERE id = ?', [generatedId]
            );
            if (!existingId.length) unique = true;
        }

        const data = removeUndefined({
            userId,
            designation,
            department,
            product,
            purchaseDate,
            additonal,
            description,
            status
        })
        data.employee = user.fullName
        data.id = generatedId;
        data.organizationId = organizationId;

        // Prepare SQL insert
        const fields = Object.keys(data);
        const placeholders = fields.map(() => '?').join(', ');
        const values = fields.map(k => data[k]);
        const query = `INSERT INTO assets (${fields.join(', ')}) VALUES (${placeholders}) `
        await db.execute(query, values);
        console.log(user)
        await mailSender(organizationId,
            user.email,
            "Regarding Asset Assignment",
            `
  <div style="max-width:600px; margin:0 auto; padding:20px; font-family:Arial, sans-serif; background-color:#f9f9f9; color:#333; border-radius:10px; border:1px solid #ddd;">
    <h2 style="color:#4A90E2; text-align:center;">Asset Assignment Details</h2>
    <p>Hello <strong>${user.fullName}</strong>,</p>

    <p>You have been assigned the following asset. Please review the details below and accept the assignment.</p>

    <table style="width:100%; border-collapse:collapse; margin-top:20px;">
      <tr>
        <td style="padding:8px; border:1px solid #ccc;"><strong>Designation</strong></td>
        <td style="padding:8px; border:1px solid #ccc;">${designation || '-'}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ccc;"><strong>Department</strong></td>
        <td style="padding:8px; border:1px solid #ccc;">${department || '-'}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ccc;"><strong>Product</strong></td>
        <td style="padding:8px; border:1px solid #ccc;">${product || '-'}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ccc;"><strong>Purchase Date</strong></td>
        <td style="padding:8px; border:1px solid #ccc;">${purchaseDate || '-'}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ccc;"><strong>Additional Product</strong></td>
        <td style="padding:8px; border:1px solid #ccc;">${additonal || '-'}</td>
      </tr>
      <tr>
        <td style="padding:8px; border:1px solid #ccc;"><strong>Description</strong></td>
        <td style="padding:8px; border:1px solid #ccc;">${description || '-'}</td>
      </tr>
    </table>

    <div style="text-align:center; margin-top:30px;">
      <p 
         style=" padding:12px 24px; text-decoration:none; border-radius:5px; display:inline-block; font-weight:bold;">
        Accept Asset By Reply
      </p>
    </div>

    <p style="margin-top:30px; font-size:12px; color:#888; text-align:center;">
      If you believe this message was sent in error, please ignore it.
    </p>
  </div>
  `
        );

        // 3. Return created asset (you could also re-select if you want all columns)
        return res.status(201).json({
            status: true,
            message: "Asset created successfully",
            data
        });
    } catch (error) {
        console.error("Error creating asset:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
};


// Get Assets
export const getAssets = async (req, res) => {
    try {
        const [assets] = await db.execute('SELECT * FROM assets ORDER BY updatedAt DESC');
        return res.status(200).json({
            status: true,
            data: assets,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
}

// Get User Assets 
export const getAssetsByID = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }
        const [asset] = await db.execute('SELECT * FROM assets WHERE id = ?', [id]);
        if (asset.length === 0) {
            return res.status(404).json({ status: false, message: "User not found" });
        }
        const data = asset[0];
        return res.status(200).json({
            status: true,
            data,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
        });
    }
}

// Get User By Organization
export const getAssetsByOrganization = async (req, res) => {
    try {
        const { organizationId } = req.user;
        if (!organizationId) {
            return res.status(400).json({
                status: false,
                message: "Organization ID is required"
            });
        }

        const [rows] = await db.execute(
            'SELECT * FROM assets WHERE organizationId = ?',
            [organizationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No assets found for this organization"
            });
        }

        return res.status(200).json({
            status: true,
            data: rows
        });
    } catch (error) {
        console.error("Error fetching assets by organization:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
};

// Update Asset
export const updateAsset = async (req, res) => {
    try {
        const { id } = req.params
        const {
            designation,
            department,
            product,
            purchaseDate,
            additonal,
            description,
            status
        } = req.body;

        // 1. Validate asset ID
        if (!id) {
            return res.status(400).json({ status: false, message: "Asset ID is required" });
        }

        // 2. Check if asset exists
        const [existingRows] = await db.execute('SELECT * FROM assets WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ status: false, message: "Asset not found" });
        }

        // 3. Prepare update data
        const updateData = {
            designation,
            department,
            product,
            purchaseDate,
            additonal,
            description,
            status
        };

        // Remove undefined fields
        const data = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined));
        const fields = Object.keys(data);
        const values = Object.values(data);

        if (fields.length === 0) {
            return res.status(400).json({ status: false, message: "No data provided to update" });
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const query = `UPDATE assets SET ${setClause} WHERE id = ?`;
        values.push(id); // Add id at the end for WHERE clause

        // 4. Execute update
        await db.execute(query, values);

        // 5. Return updated asset
        const [updatedRows] = await db.execute('SELECT * FROM assets WHERE id = ?', [id]);
        return res.status(200).json({
            status: true,
            message: "Asset updated successfully",
            data: updatedRows[0]
        });

    } catch (error) {
        console.error("Error updating asset:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
};

// Delete Asset
export const deleteAsset = async (req, res) => {
    try {
        const { id } = req.body;

        // 1. Validate ID
        if (!id) {
            return res.status(400).json({ status: false, message: "Asset ID is required" });
        }

        // 2. Check if asset exists
        const [existingRows] = await db.execute('SELECT * FROM assets WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ status: false, message: "Asset not found" });
        }

        // 3. Delete asset
        await db.execute('DELETE FROM assets WHERE id = ?', [id]);

        // 4. Return response
        return res.status(200).json({
            status: true,
            message: "Asset deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting asset:", error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error"
        });
    }
};


// For Organization Email

// Create
export const createOrUpdateEmailConfig = async (req, res) => {
    try {
        const { organizationId } = req.user; // Assume user is authenticated and orgId comes from token
        const payload = { ...req.body, organizationId };

        const existing = await EmailModel.findOne({ organizationId });

        if (existing) {
            // Update existing config
            const updated = await EmailModel.findOneAndUpdate(
                { organizationId },
                payload,
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                success: true,
                message: "Email config updated successfully.",
                data: updated,
            });
        } else {
            // Create new config
            const created = await EmailModel.create(payload);
            return res.status(201).json({
                success: true,
                message: "Email config created successfully.",
                data: created,
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};

// Read
export const getEmailConfig = async (req, res) => {
    try {
        const { organizationId } = req.user;

        const email = await EmailModel.findOne({ organizationId });
        if (!email) {
            return res.status(404).json({
                success: false,
                message: "Email config not found for this organization.",
            });
        }

        return res.status(200).json({ success: true, message: "Email config fetched", data: email });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// Update
export const updateEmailConfig = async (req, res) => {
    try {
        const { organizationId } = req.body;

        const updated = await EmailModel.findOneAndUpdate(
            { organizationId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Email config not found to update.",
            });
        }

        return res.status(200).json({ success: true, message: "Email config updated", data: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// Delete
export const deleteEmailConfig = async (req, res) => {
    try {
        const { organizationId } = req.user;

        const deleted = await EmailModel.findOneAndDelete({ organizationId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Email config not found to delete.",
            });
        }

        return res.status(200).json({ success: true, message: "Email config deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};


const defaultRoles = [
    {
        "name": "Sales",
        "Service": [
            "leadPermission",
            "leadEditPermission",
            "leadCreatePermission",
            "leadSystemPermission",
            "leadSystemSettingEditPermission",
            "leadSystemSettingDeletePermission",
            "leadSystemSettingCreatePermission"
        ]
    },
    {
        "name": "HR",
        "Service": [
            "showTasksDetailPermission",
            "halfDayPermission",
            "leadPermission",
            "leadEditPermission",
            "leadCreatePermission",
            "permissionPagePermission",
            "hrAdminSetupPermission",
            "trainingSetupPermission",
            "hrmsSetUpPermission",
            "attendencePermission",
            "assetsPermission",
            "documentPermission",
            "leaveManagePermission",
            "performancePermission",
            "employeeManagePermission",
            "activeEmployeePermission",
            "leaveRequestPermission",
            "employeeOnLeavePermission",
            "totalEmployeePermission",
            "hrmsSetupEditPermission",
            "hrmsSetupDeletePermission",
            "hrmsSetupCreatePermission",
            "leaveReqestEditPermission",
            "leaveReqestActionPermission",
            "employeeManageEditPermission",
            "employeeManageActivatePermission"
        ]
    },
    {
        "name": "Admin",
        "Service": [
            "showTasksDetailPermission",
            "projectEditPermission",
            "showProjectPermission",
            "projectDeletePermission",
            "addTaskPermission",
            "halfDayPermission",
            "projectCreatePermission",
            "deleteTaskPermission",
            "editTaskPermission",
            "showAllProjectPermission",
            "permissionPagePermission",
            "hrAdminSetupPermission",
            "trainingSetupPermission",
            "hrmsSetUpPermission",
            "attendencePermission",
            "documentPermission",
            "leaveManagePermission",
            "performancePermission",
            "employeeManagePermission",
            "payrollPermission",
            "activeEmployeePermission",
            "leaveRequestPermission",
            "employeeOnLeavePermission",
            "totalEmployeePermission",
            "hrmsSetupEditPermission",
            "hrmsSetupDeletePermission",
            "hrmsSetupCreatePermission",
            "leaveReqestEditPermission",
            "leaveReqestActionPermission",
            "employeeManageEditPermission",
            "employeeManageActivatePermission"
        ]
    },
    {
        "name": "Project Manager",
        "Service": [
            "showTasksDetailPermission",
            "projectEditPermission",
            "showProjectPermission",
            "projectDeletePermission",
            "addTaskPermission",
            "projectCreatePermission",
            "deleteTaskPermission",
            "editTaskPermission",
            "showAllProjectPermission"
        ]
    },
    {
        "name": "Seo",
        "Service": [
            "showTasksDetailPermission",
            "projectEditPermission",
            "showProjectPermission",
            "projectDeletePermission",
            "addTaskPermission",
            "projectCreatePermission",
            "deleteTaskPermission",
            "editTaskPermission"
        ]
    },
    {
        "name": "Developer",
        "Service": [
            "showTasksDetailPermission",
            "projectEditPermission",
            "showProjectPermission",
            "projectDeletePermission",
            "addTaskPermission",
            "projectCreatePermission",
            "deleteTaskPermission",
            "editTaskPermission",
            "showAllProjectPermission"
        ]
    }
]

export const signupOrganizationWithAdmin = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const {
            orgName, orgEmail,
            adminName, adminEmail,
            password, mobile
        } = req.body;

        if (!orgName || !orgEmail || !adminName || !adminEmail || !password) {
            return res.status(400).json({ status: false, message: "Required fields are missing" });
        }

        const [orgCheck] = await conn.execute(
            "SELECT id FROM organizations WHERE email = ?",
            [orgEmail]
        );
        if (orgCheck.length > 0) {
            return res.status(400).json({ status: false, message: "Organization email already exists" });
        }

        const [userCheck] = await conn.execute(
            "SELECT id FROM users WHERE email = ?",
            [adminEmail]
        );
        if (userCheck.length > 0) {
            return res.status(400).json({ status: false, message: "User email already exists" });
        }

        const subscriptionStart = new Date();
        const subscriptionEnd = new Date();
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 3);

        const orgId = uuidv4();
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await conn.beginTransaction();

        await conn.execute(
            `INSERT INTO organizations (id, name, email, userLimit, subscriptionStatus, subscriptionStart, subscriptionEnd)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orgId, orgName, orgEmail, 10, "FREE", subscriptionStart, subscriptionEnd]
        );

        await conn.execute(
            `INSERT INTO users (id, fullName, email, password, mobile, role, organizationId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, adminName, adminEmail, hashedPassword, mobile, "ADMIN", orgId]
        );

        // Insert default permission roles
        for (const role of defaultRoles) {
            const { name, Service } = role;

            let unique = false;
            let generatedId;
            while (!unique) {
                generatedId = new mongoose.Types.ObjectId().toHexString();
                const [existingId] = await conn.execute(
                    'SELECT 1 FROM permission_roles WHERE id = ?', [generatedId]
                );
                if (!existingId.length) unique = true;
            }

            const permissions = Object.fromEntries(allPermission.map(p => [p, false]));
            if (Array.isArray(Service)) {
                Service.forEach(p => {
                    if (permissions.hasOwnProperty(p)) {
                        permissions[p] = true;
                    }
                });
            }

            const fields = ['id', 'name', 'organizationId', ...allPermission];
            const values = [generatedId, name, orgId, ...allPermission.map(p => permissions[p])];
            const placeholders = fields.map(() => '?').join(', ');
            const query = `INSERT INTO permission_roles (${fields.join(', ')}) VALUES (${placeholders})`;

            await conn.execute(query, values);
        }

        await conn.commit();

        // Send welcome email
        (async () => {
            const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Organization Created Successfully</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #f6f9fc;
        color: #333;
      }
      .email-container {
        max-width: 600px;
        margin: 30px auto;
        background: #ffffff;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(90deg, #0B56E4, #5A8DF7);
        color: #ffffff;
        text-align: center;
        padding: 25px 15px;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
      }
      .content {
        padding: 25px 30px;
      }
      .content p {
        line-height: 1.6;
        font-size: 15px;
        margin-bottom: 15px;
      }
      .content b {
        color: #0B56E4;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        background: #0B56E4;
        color: #ffffff;
        padding: 12px 28px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        font-weight: 600;
      }
      .button:hover {
        background: #0848c3;
      }
      .footer {
        background: #f0f4f9;
        color: #666;
        text-align: center;
        font-size: 13px;
        padding: 15px;
        border-top: 1px solid #e0e6ef;
      }
      @media (max-width: 600px) {
        .content {
          padding: 20px;
        }
        .button {
          width: 100%;
          box-sizing: border-box;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>🎉 Organization Created Successfully!</h1>
      </div>

      <div class="content">
        <p>Hi <b>${adminName}</b>,</p>

        <p>We’re excited to inform you that your organization <b>${orgName}</b> has been successfully created on <b>KDS CRM</b>.</p>

        <p>Here are your login details:</p>
        <p>
          <b>Login Email:</b> ${adminEmail}<br/>
          <b>Password:</b> ${password}
        </p>

        <div class="button-container">
          <a href="https://app.kdscrm.com/login" class="button" target="_blank">Login Now</a>
        </div>

        <p>If you didn’t request this, please contact our support team immediately.</p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} KDS CRM. All rights reserved.<br/>
        <a href="https://kdscrm.com" style="color:#0B56E4;text-decoration:none;">Visit Website</a>
      </div>
    </div>
  </body>
</html>
`;


            await SendEmail(
                orgId,
                adminEmail,
                "Welcome to KDS CRM - Organization Created",
                html,
                html
            );

            // Internal email
            const internalHtml = `
                <h2>New Organization Registered 🚀</h2>
                <p><strong>Organization Name:</strong> ${orgName}</p>
                <p><strong>Organization Email:</strong> ${orgEmail}</p>
                <p><strong>Admin Name:</strong> ${adminName}</p>
                <p><strong>Admin Email:</strong> ${adminEmail}</p>
                <p><strong>Mobile:</strong> ${mobile || "N/A"}</p>
                <p><strong>Subscription:</strong> FREE (3 Months)</p>
                <p><strong>User Limit:</strong> 10</p>
                <p><strong>Created On:</strong> ${new Date().toLocaleString()}</p>
            `;

            await SendEmail(
                orgId,
                "noreply@kdscrm.com",
                "New Organization Registered - KDS CRM",
                internalHtml,
                internalHtml
            );
        })();

        return res.status(201).json({
            status: true,
            message: "Organization & Admin created successfully",
            organization: { id: orgId, name: orgName, email: orgEmail },
            admin: { id: userId, fullName: adminName, email: adminEmail, mobile }
        });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error("Error in signup:", err);
        return res.status(500).json({ status: false, message: err.message || "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
};