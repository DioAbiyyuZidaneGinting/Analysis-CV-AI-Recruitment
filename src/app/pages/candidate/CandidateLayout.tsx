import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { PortalLayout } from "../../components/PortalLayout";
import { CandidateProvider, useCandidateContext } from "./candidateContext";

export function CandidateLayout() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const userObj = JSON.parse(storedUser);
      if (userObj.role !== "candidate") {
        navigate("/login", { replace: true });
        return;
      }
      setAuthorized(true);
    } catch {
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
    <CandidateProvider
      onNavigateToCV={() => navigate("/candidate/cv-analysis")}
    >
      <CandidateLayoutContent />
    </CandidateProvider>
  );
}

function CandidateLayoutContent() {
  const { candidate } = useCandidateContext();

  return (
    <PortalLayout role="candidate" userName={candidate.name || "Sarah Johnson"}>
      <Outlet />
    </PortalLayout>
  );
}
