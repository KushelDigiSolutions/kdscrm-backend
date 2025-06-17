import User from "../models/User/User.js"
import Roles from "../models/Role.js";

const allPermission = [
    'leadDeletePermission',
    'leadEditPermission',
    'leadCreatePermission',
    'permissionPagePermission',
    'leadPermission',
    'projectDeletePermission',
    'showProjectPermission',
    'showAllProjectPermission',
    'projectEditPermission',
    'projectCreatePermission',
    'leadSystemPermission',
    'leadSystemSettingEditPermission',
    'leadSystemSettingDeletePermission',
    'leadSystemSettingCreatePermission',
    'showTasksDetailPermission',
    'addTaskPermission',
    'deleteTaskPermission',
    'editTaskPermission',
    'hrmsSetUpPermission',
    'hrmsSetupEditPermission',
    'hrmsSetupCreatePermission',
    'hrmsSetupDeletePermission',
    'hrAdminSetupPermission',
    'trainingSetupPermission',
    'assetsPermission',
    'userAllowanceCreatePermission',
    'showExpensePermission',
    'createExpensePermission',
    'payrollPermission',
    'activeEmployeePermission',
    'leaveRequestPermission',
    'employeeOnLeavePermission',
    'totalEmployeePermission',
    'paySlipActionPermission',
    'halfDayPermission',
    'attendencePermission',
    'documentPermission',
    'leaveManagePermission',
    'leaveReqestEditPermission',
    'leaveReqestActionPermission',
    'performancePermission',
    'employeeManagePermission',
    'employeeManageEditPermission',
    'employeeManageActivatePermission',
    'hrManagement',
    'holidaylistPermission'
];

export const ProvidePermission = async (req, res) => {
    try {
        const { name, Service } = req.body;
        const roleDetail = new Roles({ name });

        allPermission.forEach(permission => {
            roleDetail[permission] = false;
        });

        if (Service && Service.length > 0) {
            Service.forEach(permission => {
                if (allPermission.includes(permission)) {
                    roleDetail[permission] = true;
                }
            });
        }

        await roleDetail.save();

        return res.status(200).json({
            status: true,
            message: "Permissions updated successfully",
            role: roleDetail
        });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};

export const fetchallRole = async(req ,res)=>{
    const allRoles = await Roles.find();

    return res.status(200).json({
        status:true , 
        data: allRoles
    })
}

export const DeleteRoleApi = async(req ,res)=>{
  
     const {roleId} = req.body;

     const roleDetail = await Roles.findByIdAndDelete(roleId);

    return res.status(200).json({
        status:true , 
        data:roleDetail
    })
}

export const updatePermission = async (req, res) => {
    try {
        const { roleId, Service , name} = req.body;

        console.log("id " , roleId , Service , name);
        const roleDetail = await Roles.findById(roleId);
        if (!roleDetail) {
            return res.status(404).json({
                status: false,
                message: "Role not found"
            });
        }

        roleDetail.name = name;

        allPermission.forEach(permission => {
            roleDetail[permission] = false;
        });

        if (Service && Service.length > 0) {
            Service.forEach(permission => {
                if (allPermission.includes(permission)) {
                    roleDetail[permission] = true;
                }
            });
        }

        await roleDetail.save();

        console.log("roldeta" , roleDetail)

        return res.status(200).json({
            status: true,
            message: "Permissions updated successfully",
            role: roleDetail
        });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
};


export const setupPermissionRemovalByAdmin = async ({service}) =>{
    const {id} = req.params;
    const requestByUser = await User.find({department:id});

    const totalRemovalRequest = requestByUser[service];
    console.log(totalRemovalRequest)

   if (totalRemovalRequest.father === false){
      requestByUser = false;
      console.log(requestByUser);
   }
   else if(totalRemovalRequest.father === true){
    requestByUser = true;
    console.log(requestByUser);
   }

   return(
    {
        data:requestByUser,
        data1:totalRemovalRequest,
        message:"request user is fetch successfully",
        status:true
    }
   )

}

