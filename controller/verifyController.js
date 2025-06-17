export const verifyUser = ({ auth, role }) => {
  if (!auth) {
    return { success: false, message: "Not Authorised" };
  }
  if (auth.role !== role) {
    return { success: false, message: "Not Authorised" };
  }
  return { success: true, message: "User Authorised", user: auth };
};
