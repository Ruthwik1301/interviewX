export const RoutePaths = {
  root: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  googleCallback: "/auth/google/success",
  appRoot: "/app",
  createInterview: "/app/interviews/new",
  interviewRoom: "/app/interviews/:id",
  dsaRoom: "/app/dsa/:id",
  interviewReport: "/app/reports/:id",
  profile: "/app/profile",
};

export const ChildPaths = {
  createInterview: "interviews/new",
  interviewRoom: "interviews/:id",
  dsaRoom: "dsa/:id",
  interviewReport: "reports/:id",
  profile: "profile",
};
