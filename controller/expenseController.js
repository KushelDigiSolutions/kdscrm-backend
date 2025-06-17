import Expense from "../models/Expense.js"

export const CreateExpense = async (req, res) => {
   try {
      const { title, itemCode, quantity, unit, purchasePrice, salesPrice, purchaseDate, category, organizationId } = req.body;
      const expenseDetail = await Expense.create({ title, itemCode, quantity, unit, purchasePrice, salesPrice, purchaseDate, category, organizationId });

      return res.status(200).json({
         status: true,
         expenseDetail
      })
   } catch (error) {
      return res.status(500).json({
         status: false,
         message: "Interval server error"
      })
   }

}

export const deleteExpense = async (req, res) => {
   const { expenseId } = req.params;
   await Expense.findByIdAndDelete(expenseId);
   return res.status(200).json({
      status: true,

   })
}

export const getExpense = async (req, res) => {
   try {
      const organizationId = req.user.organizationId
      const expesnes = await Expense.find({ organizationId });

      return res.status(200).json({
         status: true,
         expesnes
      })
   } catch (error) {
      return res.status(500).json({ status: false, message: "interval Server Error" })
   }
}