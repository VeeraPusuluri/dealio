import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/useAuthStore";

import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Placeholder from "./pages/Placeholder";
import Home from "./pages/Home";

import BuilderOverview from "./pages/builder/BuilderOverview";
import BuilderProjects from "./pages/builder/BuilderProjects";
import BuilderProjectDetail from "./pages/builder/BuilderProjectDetail";
import AddProjectWizard from "./pages/builder/AddProjectWizard";
import EditProjectWizard from "./pages/builder/EditProjectWizard";
import BuilderUnits from "./pages/builder/BuilderUnits";
import BuilderLeads from "./pages/builder/BuilderLeads";
import BuilderCPPerformance from "./pages/builder/BuilderCPPerformance";
import BuilderDocuments from "./pages/builder/BuilderDocuments";
import BuilderBroadcast from "./pages/builder/BuilderBroadcast";
import BuilderMeetings from "./pages/builder/BuilderMeetings";
import BuilderDealsPage from "./pages/builder/BuilderDealsPage";
import BuilderAIPricing from "./pages/builder/BuilderAIPricing";
import BuilderAnalytics from "./pages/builder/BuilderAnalytics";
import BuilderVirtualTours from "./pages/builder/BuilderVirtualTours";
import BuilderInventory from "./pages/builder/BuilderInventory";
import BuilderRERA from "./pages/builder/BuilderRERA";
import BuilderDemandLetters from "./pages/builder/BuilderDemandLetters";
import BuilderSettings from "./pages/builder/BuilderSettings";

import CPOverview from "./pages/cp/CPOverview";
import CPProjects from "./pages/cp/CPProjects";
import CPLeads from "./pages/cp/CPLeads";
import CPCommissions from "./pages/cp/CPCommissions";
import CPReferral from "./pages/cp/CPReferral";
import CPBrochure from "./pages/cp/CPBrochure";
import CPCommunity from "./pages/cp/CPCommunity";
import CPFollowUps from "./pages/cp/CPFollowUps";
import CPLeaderboard from "./pages/cp/CPLeaderboard";
import CPMeetingRequests from "./pages/cp/CPMeetingRequests";
import CPContentStudio from "./pages/cp/CPContentStudio";
import CPSocialAnalytics from "./pages/cp/CPSocialAnalytics";
import CPWhatsAppBroadcast from "./pages/cp/CPWhatsAppBroadcast";
import CPAIInsights from "./pages/cp/CPAIInsights";
import CPPipeline from "./pages/cp/CPPipeline";
import CPContacts from "./pages/cp/CPContacts";
import CPSettings from "./pages/cp/CPSettings";

import CustomerHome from "./pages/customer/CustomerHome";
import CustomerProjectDetail from "./pages/customer/CustomerProjectDetail";
import CustomerSettings from "./pages/customer/CustomerSettings";
import CustomerProperty from "./pages/customer/CustomerProperty";
import CustomerJourney from "./pages/customer/CustomerJourney";
import CustomerEMI from "./pages/customer/CustomerEMI";
import CustomerMeeting from "./pages/customer/CustomerMeeting";
import CustomerDocuments from "./pages/customer/CustomerDocuments";
import CustomerInvestments from "./pages/customer/CustomerInvestments";
import CustomerTopup from "./pages/customer/CustomerTopup";
import CustomerLoanStatus from "./pages/customer/CustomerLoanStatus";
import CustomerLoanEngine from "./pages/customer/CustomerLoanEngine";

import BankOverview from "./pages/bank/BankOverview";
import BankInbox from "./pages/bank/BankInbox";
import BankStatus from "./pages/bank/BankStatus";
import BankLoanCases from "./pages/bank/BankLoanCases";
import BankAnalytics from "./pages/bank/BankAnalytics";
import BankDocuments from "./pages/bank/BankDocuments";

import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminFraud from "./pages/admin/AdminFraud";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminBuilders from "./pages/admin/AdminBuilders";
import AdminCPs from "./pages/admin/AdminCPs";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminDeals from "./pages/admin/AdminDeals";
import AdminCampaigns from "./pages/admin/AdminCampaigns";
import LoanPortal from "./pages/shared/LoanPortal";
import DealConversation from "./pages/shared/DealConversation";
import ProjectSharePage from "./pages/shared/ProjectSharePage";
import { BuilderPossession, CustomerPossession } from "./pages/shared/PossessionTracker";
import { BuilderSnagging, CustomerSnagging } from "./pages/shared/SnaggingModule";
import NRIDashboard from "./pages/nri/NRIDashboard";
import NRIProjects from "./pages/nri/NRIProjects";
import NRIProjectDetail from "./pages/nri/NRIProjectDetail";
import NRIProperty from "./pages/nri/NRIProperty";
import NRIJourney from "./pages/nri/NRIJourney";
import NRILoan from "./pages/nri/NRILoan";
import NRIConsultation from "./pages/nri/NRIConsultation";
import NRIDocuments from "./pages/nri/NRIDocuments";
import NRIPoa from "./pages/nri/NRIPoa";
import NRILegal from "./pages/nri/NRILegal";
import NRICalculator from "./pages/nri/NRICalculator";
import NRIProfile from "./pages/nri/NRIProfile";
import NRIManage from "./pages/nri/NRIManage";
import NRIInvest from "./pages/nri/NRIInvest";
import NRILoanStatus from "./pages/nri/NRILoanStatus";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Builder */}
          <Route path="/builder" element={<ProtectedRoute><BuilderOverview /></ProtectedRoute>} />
          <Route path="/builder/projects" element={<ProtectedRoute><BuilderProjects /></ProtectedRoute>} />
          <Route path="/builder/projects/new" element={<ProtectedRoute><AddProjectWizard /></ProtectedRoute>} />
          <Route path="/builder/projects/:id/edit" element={<ProtectedRoute><EditProjectWizard /></ProtectedRoute>} />
          <Route path="/builder/projects/:id" element={<ProtectedRoute><BuilderProjectDetail /></ProtectedRoute>} />
          <Route path="/builder/units" element={<ProtectedRoute><BuilderUnits /></ProtectedRoute>} />
          <Route path="/builder/leads" element={<ProtectedRoute><BuilderLeads /></ProtectedRoute>} />
          <Route path="/builder/cp-performance" element={<ProtectedRoute><BuilderCPPerformance /></ProtectedRoute>} />
          <Route path="/builder/documents" element={<ProtectedRoute><BuilderDocuments /></ProtectedRoute>} />
          <Route path="/builder/broadcast" element={<ProtectedRoute><BuilderBroadcast /></ProtectedRoute>} />
          <Route path="/builder/loan" element={<ProtectedRoute><LoanPortal /></ProtectedRoute>} />
          <Route path="/builder/meetings" element={<ProtectedRoute><BuilderMeetings /></ProtectedRoute>} />
          <Route path="/builder/deals" element={<ProtectedRoute><BuilderDealsPage /></ProtectedRoute>} />
          <Route path="/builder/ai" element={<ProtectedRoute><BuilderAIPricing /></ProtectedRoute>} />
          <Route path="/builder/analytics" element={<ProtectedRoute><BuilderAnalytics /></ProtectedRoute>} />
          <Route path="/builder/virtual-tours" element={<ProtectedRoute><BuilderVirtualTours /></ProtectedRoute>} />
          <Route path="/builder/inventory" element={<ProtectedRoute><BuilderInventory /></ProtectedRoute>} />
          <Route path="/builder/rera" element={<ProtectedRoute><BuilderRERA /></ProtectedRoute>} />
          <Route path="/builder/demand-letters" element={<ProtectedRoute><BuilderDemandLetters /></ProtectedRoute>} />
          <Route path="/builder/possession" element={<ProtectedRoute><BuilderPossession /></ProtectedRoute>} />
          <Route path="/builder/snagging" element={<ProtectedRoute><BuilderSnagging /></ProtectedRoute>} />
          <Route path="/builder/conversations" element={<ProtectedRoute><DealConversation /></ProtectedRoute>} />
          <Route path="/builder/settings" element={<ProtectedRoute><BuilderSettings /></ProtectedRoute>} />

          {/* CP */}
          <Route path="/cp" element={<ProtectedRoute><CPOverview /></ProtectedRoute>} />
          <Route path="/cp/projects" element={<ProtectedRoute><CPProjects /></ProtectedRoute>} />
          <Route path="/cp/leads" element={<ProtectedRoute><CPLeads /></ProtectedRoute>} />
          <Route path="/cp/pipeline" element={<ProtectedRoute><CPPipeline /></ProtectedRoute>} />
          <Route path="/cp/commissions" element={<ProtectedRoute><CPCommissions /></ProtectedRoute>} />
          <Route path="/cp/referral" element={<ProtectedRoute><CPReferral /></ProtectedRoute>} />
          <Route path="/cp/brochure" element={<ProtectedRoute><CPBrochure /></ProtectedRoute>} />
          <Route path="/cp/community" element={<ProtectedRoute><CPCommunity /></ProtectedRoute>} />
          <Route path="/cp/followups" element={<ProtectedRoute><CPFollowUps /></ProtectedRoute>} />
          <Route path="/cp/leaderboard" element={<ProtectedRoute><CPLeaderboard /></ProtectedRoute>} />
          <Route path="/cp/loan" element={<ProtectedRoute><LoanPortal /></ProtectedRoute>} />
          <Route path="/cp/meetings" element={<ProtectedRoute><CPMeetingRequests /></ProtectedRoute>} />
          <Route path="/cp/content-studio" element={<ProtectedRoute><CPContentStudio /></ProtectedRoute>} />
          <Route path="/cp/social-analytics" element={<ProtectedRoute><CPSocialAnalytics /></ProtectedRoute>} />
          <Route path="/cp/whatsapp-broadcast" element={<ProtectedRoute><CPWhatsAppBroadcast /></ProtectedRoute>} />
          <Route path="/cp/ai-insights" element={<ProtectedRoute><CPAIInsights /></ProtectedRoute>} />
          <Route path="/cp/contacts" element={<ProtectedRoute><CPContacts /></ProtectedRoute>} />
          <Route path="/cp/settings" element={<ProtectedRoute><CPSettings /></ProtectedRoute>} />
          <Route path="/cp/conversations" element={<ProtectedRoute><DealConversation /></ProtectedRoute>} />

          {/* Customer */}
          <Route path="/customer" element={<ProtectedRoute><CustomerHome /></ProtectedRoute>} />
          <Route path="/customer/projects/:id" element={<ProtectedRoute><CustomerProjectDetail /></ProtectedRoute>} />
          <Route path="/customer/property" element={<ProtectedRoute><CustomerProperty /></ProtectedRoute>} />
          <Route path="/customer/journey" element={<ProtectedRoute><CustomerJourney /></ProtectedRoute>} />
          <Route path="/customer/loan" element={<ProtectedRoute><LoanPortal /></ProtectedRoute>} />
          <Route path="/customer/loan-engine" element={<ProtectedRoute><CustomerLoanEngine /></ProtectedRoute>} />
          <Route path="/customer/loan-status" element={<ProtectedRoute><CustomerLoanStatus /></ProtectedRoute>} />
          <Route path="/customer/documents" element={<ProtectedRoute><CustomerDocuments /></ProtectedRoute>} />
          <Route path="/customer/emi" element={<ProtectedRoute><CustomerEMI /></ProtectedRoute>} />
          <Route path="/customer/meeting" element={<ProtectedRoute><CustomerMeeting /></ProtectedRoute>} />
          <Route path="/customer/investments" element={<ProtectedRoute><CustomerInvestments /></ProtectedRoute>} />
          <Route path="/customer/topup" element={<ProtectedRoute><CustomerTopup /></ProtectedRoute>} />
          <Route path="/customer/possession" element={<ProtectedRoute><CustomerPossession /></ProtectedRoute>} />
          <Route path="/customer/snagging" element={<ProtectedRoute><CustomerSnagging /></ProtectedRoute>} />
          <Route path="/customer/conversations" element={<ProtectedRoute><DealConversation /></ProtectedRoute>} />
          <Route path="/customer/settings" element={<ProtectedRoute><CustomerSettings /></ProtectedRoute>} />

          {/* Bank */}
          <Route path="/bank" element={<ProtectedRoute><BankOverview /></ProtectedRoute>} />
          <Route path="/bank/inbox" element={<ProtectedRoute><BankInbox /></ProtectedRoute>} />
          <Route path="/bank/loan" element={<ProtectedRoute><LoanPortal /></ProtectedRoute>} />
          <Route path="/bank/loan-cases" element={<ProtectedRoute><BankLoanCases /></ProtectedRoute>} />
          <Route path="/bank/documents" element={<ProtectedRoute><BankDocuments /></ProtectedRoute>} />
          <Route path="/bank/status" element={<ProtectedRoute><BankStatus /></ProtectedRoute>} />
          <Route path="/bank/analytics" element={<ProtectedRoute><BankAnalytics /></ProtectedRoute>} />
          <Route path="/bank/conversations" element={<ProtectedRoute><DealConversation /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/builders" element={<ProtectedRoute><AdminBuilders /></ProtectedRoute>} />
          <Route path="/admin/cps" element={<ProtectedRoute><AdminCPs /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute><AdminRevenue /></ProtectedRoute>} />
          <Route path="/admin/commissions" element={<ProtectedRoute><AdminCommissions /></ProtectedRoute>} />
          <Route path="/admin/deals" element={<ProtectedRoute><AdminDeals /></ProtectedRoute>} />
          <Route path="/admin/fraud" element={<ProtectedRoute><AdminFraud /></ProtectedRoute>} />
          <Route path="/admin/campaigns" element={<ProtectedRoute><AdminCampaigns /></ProtectedRoute>} />

          {/* Public share page — no auth required */}
          <Route path="/p/:token" element={<ProjectSharePage />} />

          {/* Shared Loan */}
          <Route path="/loan" element={<ProtectedRoute><LoanPortal /></ProtectedRoute>} />

          {/* NRI */}
          <Route path="/nri" element={<ProtectedRoute><NRIDashboard /></ProtectedRoute>} />
          <Route path="/nri/projects" element={<ProtectedRoute><NRIProjects /></ProtectedRoute>} />
          <Route path="/nri/project/:id" element={<ProtectedRoute><NRIProjectDetail /></ProtectedRoute>} />
          <Route path="/nri/property" element={<ProtectedRoute><NRIProperty /></ProtectedRoute>} />
          <Route path="/nri/manage" element={<ProtectedRoute><NRIManage /></ProtectedRoute>} />
          <Route path="/nri/invest" element={<ProtectedRoute><NRIInvest /></ProtectedRoute>} />
          <Route path="/nri/journey" element={<ProtectedRoute><NRIJourney /></ProtectedRoute>} />
          <Route path="/nri/loan" element={<ProtectedRoute><NRILoan /></ProtectedRoute>} />
          <Route path="/nri/loan-status" element={<ProtectedRoute><NRILoanStatus /></ProtectedRoute>} />
          <Route path="/nri/consultation" element={<ProtectedRoute><NRIConsultation /></ProtectedRoute>} />
          <Route path="/nri/documents" element={<ProtectedRoute><NRIDocuments /></ProtectedRoute>} />
          <Route path="/nri/poa" element={<ProtectedRoute><NRIPoa /></ProtectedRoute>} />
          <Route path="/nri/legal" element={<ProtectedRoute><NRILegal /></ProtectedRoute>} />
          <Route path="/nri/calculator" element={<ProtectedRoute><NRICalculator /></ProtectedRoute>} />
          <Route path="/nri/profile" element={<ProtectedRoute><NRIProfile /></ProtectedRoute>} />
          <Route path="/nri/conversations" element={<ProtectedRoute><DealConversation /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
