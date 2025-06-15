"use client";
import AdminDashboard from "@/components/AdminDashboard";
import DashboardCustomerCare from "@/components/DashboardCustomerCare";
import AboutUsPage from "@/components/AboutUsPage";
import { useAdminStore } from "@/stores/adminStore";
import { useCustomerCareStore } from "@/stores/customerCareStore";
import { Spinner } from "@/components/Spinner";

export default function Home() {
  const adminLoggedInAs = useAdminStore((state) => state.user?.logged_in_as);
  const customerCareLoggedInAs = useCustomerCareStore(
    (state) => state.user?.logged_in_as
  );
  const loggedInAs = adminLoggedInAs || customerCareLoggedInAs;
  const RenderHomeComponent = () => {
    switch (loggedInAs) {
      case "SUPER_ADMIN":
        return <AdminDashboard />;
      case "FINANCE_ADMIN":
        return <AdminDashboard />;
      case "COMPANION_ADMIN":
        return <AdminDashboard />;
      case "CUSTOMER_CARE_REPRESENTATIVE":
        return <DashboardCustomerCare />;
      default:
        return <AboutUsPage />;
    }
  };

  return <RenderHomeComponent />;
}
