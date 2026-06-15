import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { PortalLayout } from "../../components/PortalLayout";

export function RecruiterLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("Recruiter");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const userObj = JSON.parse(storedUser);
      if (userObj.role !== "recruiter") {
        // Not a recruiter
        navigate("/login", { replace: true });
        return;
      }

      const name =
        `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim();
      setUserName(name || "Recruiter");
      setAuthorized(true);
    } catch (err) {
      console.error("Failed to parse user in RecruiterLayout:", err);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fc]">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PortalLayout role="recruiter" userName={userName}>
      <Outlet />
    </PortalLayout>
  );
}
