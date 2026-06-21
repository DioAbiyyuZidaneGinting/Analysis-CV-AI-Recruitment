import { createBrowserRouter, redirect } from "react-router";
import { Root } from "./Root";
import { LandingPage } from "./pages/Landing";
import { AuthPage } from "./pages/Auth";
import { AuthCallbackPage } from "./pages/AuthCallback";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { CandidateLayout } from "./pages/candidate/CandidateLayout";
import { DashboardPage } from "./pages/candidate/DashboardPage";
import { CvAnalysisPage } from "./pages/candidate/CvAnalysisPage";
import { AnalysisHistoryPage } from "./pages/candidate/AnalysisHistoryPage";
import { ResumeBuilderPage } from "./pages/candidate/ResumeBuilderPage";
import { CvTemplatesPage } from "./pages/candidate/CvTemplatesPage";
import { ApplicationsPage } from "./pages/candidate/ApplicationsPage";
import { JobMatchesPage } from "./pages/candidate/JobMatchesPage";
import { NotificationsPage } from "./pages/candidate/NotificationsPage";
import { FeedbackPage } from "./pages/candidate/FeedbackPage";
import { RecruiterLayout } from "./pages/recruiter/RecruiterLayout";
import { RecruiterDashboardPage } from "./pages/recruiter/RecruiterDashboardPage";
import { CandidatesPage } from "./pages/recruiter/CandidatesPage";
import { PipelinePage } from "./pages/recruiter/PipelinePage";
import { ReportsPage } from "./pages/recruiter/Reports";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: AuthPage },
      { path: "register", Component: AuthPage },
      // Google OAuth redirect landing — must live outside protected layouts
      { path: "auth/callback", Component: AuthCallbackPage },
      // Password reset — Supabase redirects here after reset link click
      { path: "reset-password", Component: ResetPasswordPage },
      {
        path: "candidate",
        Component: CandidateLayout,
        children: [
          { index: true, loader: () => redirect("/candidate/dashboard") },
          { path: "dashboard", Component: DashboardPage },
          { path: "cv-analysis", Component: CvAnalysisPage },
          { path: "analysis-history", Component: AnalysisHistoryPage },
          { path: "resume-builder", Component: ResumeBuilderPage },
          { path: "cv-templates", Component: CvTemplatesPage },
          { path: "applications", Component: ApplicationsPage },
          { path: "job-matches", Component: JobMatchesPage },
          { path: "notifications", Component: NotificationsPage },
          { path: "feedback", Component: FeedbackPage },
        ],
      },
      {
        path: "recruiter",
        Component: RecruiterLayout,
        children: [
          { index: true, loader: () => redirect("/recruiter/dashboard") },
          { path: "dashboard", Component: RecruiterDashboardPage },
          { path: "candidates", Component: CandidatesPage },
          { path: "pipeline", Component: PipelinePage },
          { path: "reports", Component: ReportsPage },
        ],
      },
    ],
  },
]);
