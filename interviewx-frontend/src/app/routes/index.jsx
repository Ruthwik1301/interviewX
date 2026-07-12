import { RoutePaths, ChildPaths } from "./paths";
import PublicLayout from "../layouts/PublicLayout";
import AppShell from "../AppShell";
import { RequireAuth, RedirectIfAuthed } from "../RouteGuards";
import LandingPage from "../../features/landing/LandingPage";
import LoginPage from "../../features/auth/LoginPage";
import RegisterPage from "../../features/auth/RegisterPage";
import ForgotPasswordPage from "../../features/auth/ForgotPasswordPage";
import ResetPasswordPage from "../../features/auth/ResetPasswordPage";
import VerifyEmailPage from "../../features/auth/VerifyEmailPage";
import GoogleCallbackPage from "../../features/auth/GoogleCallbackPage";
import DashboardPage from "../../features/dashboard/DashboardPage";
import CreateInterviewPage from "../../features/create-interview/CreateInterviewPage";
import InterviewRoomPage from "../../features/interview-room/InterviewRoomPage";
import DSARoomPage from "../../features/dsa-room/DSARoomPage";
import InterviewReportPage from "../../features/interview-report/InterviewReportPage";
import ProfilePage from "../../features/profile/ProfilePage";

export const routes = [
  {
    path: RoutePaths.root,
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: RoutePaths.login, element: <LoginPage /> },
          { path: RoutePaths.register, element: <RegisterPage /> },
        ],
      },
      { path: RoutePaths.forgotPassword, element: <ForgotPasswordPage /> },
      { path: RoutePaths.resetPassword, element: <ResetPasswordPage /> },
      { path: RoutePaths.verifyEmail, element: <VerifyEmailPage /> },
      { path: RoutePaths.googleCallback, element: <GoogleCallbackPage /> },
    ],
  },
  {
    path: RoutePaths.appRoot,
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          {
            path: ChildPaths.createInterview,
            element: <CreateInterviewPage />,
          },
          {
            path: ChildPaths.interviewReport,
            element: <InterviewReportPage />,
          },
          { path: ChildPaths.profile, element: <ProfilePage /> },
        ],
      },
      // Interview room and DSA room are OUTSIDE AppShell (full-screen, no navbar)
      { path: ChildPaths.interviewRoom, element: <InterviewRoomPage /> },
      { path: ChildPaths.dsaRoom, element: <DSARoomPage /> },
    ],
  },
];
