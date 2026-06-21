import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiUrl } from "../../utils/apiConfig";

const DEFAULT_CANDIDATE = {
  name: "",
  email: "",
  id: "",
  cvScore: 0,
  atsScore: 0,
  hiringChance: 0,
  hiringRecommendation: "Not Recommended",
  jobCategory: "",
  applicationsSent: 0,
  skills: [] as string[],
  strengths: [] as string[],
  improvements: [] as string[],
  cvAnalyzed: false,
  details: { experienceYears: 0, skillScore: 0 },
};

/** Auto-refresh the Supabase JWT if it's expired/near-expiry, then return auth headers. */
export async function getValidToken(): Promise<Record<string, string>> {
  const token = localStorage.getItem("access_token");
  const expiresAt = parseInt(localStorage.getItem("token_expires_at") || "0", 10);
  const refreshToken = localStorage.getItem("refresh_token");
  const now = Date.now();

  const needsRefresh = !token || (expiresAt > 0 && now >= expiresAt);

  if (needsRefresh && refreshToken) {
    try {
      console.log("JWT near-expiry — refreshing silently...");
      const res = await fetch(apiUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token_expires_at", String(now + 55 * 60 * 1000));
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        console.log("Token refreshed successfully.");
        return { Authorization: `Bearer ${data.access_token}` };
      } else {
        console.warn("Token refresh failed — user may need to re-login.");
      }
    } catch (e) {
      console.error("Token refresh request error:", e);
    }
  }

  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Sync fallback for non-critical reads (kept for existing non-download calls). */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface CandidateContextValue {
  // CV Analysis state
  candidate: any;
  setCandidate: React.Dispatch<React.SetStateAction<any>>;
  analyzed: boolean;
  setAnalyzed: React.Dispatch<React.SetStateAction<boolean>>;
  analyzing: boolean;
  setAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  errorMsg: string;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
  applications: any[];
  setApplications: React.Dispatch<React.SetStateAction<any[]>>;
  history: any[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  fetchHistory: () => void;

  // AI Resume Builder state
  rbName: string;
  setRbName: React.Dispatch<React.SetStateAction<string>>;
  rbContact: { email: string; phone: string; address: string; linkedin: string; portfolio: string };
  setRbContact: React.Dispatch<React.SetStateAction<{ email: string; phone: string; address: string; linkedin: string; portfolio: string }>>;
  rbEducationList: any[];
  setRbEducationList: React.Dispatch<React.SetStateAction<any[]>>;
  rbExperiences: any[];
  setRbExperiences: React.Dispatch<React.SetStateAction<any[]>>;
  rbProjects: any[];
  setRbProjects: React.Dispatch<React.SetStateAction<any[]>>;
  rbLeadership: any[];
  setRbLeadership: React.Dispatch<React.SetStateAction<any[]>>;
  rbSkillsObj: { technicalSkills: string; programmingLanguages: string; tools: string; softSkills: string };
  setRbSkillsObj: React.Dispatch<React.SetStateAction<{ technicalSkills: string; programmingLanguages: string; tools: string; softSkills: string }>>;
  rbCertificationsList: any[];
  setRbCertificationsList: React.Dispatch<React.SetStateAction<any[]>>;
  rbInterestsStr: string;
  setRbInterestsStr: React.Dispatch<React.SetStateAction<string>>;
  rbTargetJob: string;
  setRbTargetJob: React.Dispatch<React.SetStateAction<string>>;
  optimizing: boolean;
  setOptimizing: React.Dispatch<React.SetStateAction<boolean>>;
  optimizedResult: any;
  setOptimizedResult: React.Dispatch<React.SetStateAction<any>>;
  selectedTemplate: string;
  setSelectedTemplate: React.Dispatch<React.SetStateAction<string>>;

  // Actions
  handleFileSelect: (file: File) => Promise<void>;
  handleImportFromCV: () => Promise<void>;
  handleSaveResumeDraft: () => Promise<void>;
  handleOptimizeResume: (e: React.FormEvent) => Promise<void>;
  handleDownloadPDF: (templateId?: string) => Promise<void>;
  handleDownloadWord: () => Promise<void>;
  handleSelectHistoryItem: (item: any) => void;

  // Dynamic list helpers — Education
  addEducation: () => void;
  removeEducation: (index: number) => void;
  updateEducation: (index: number, key: string, val: string) => void;

  // Dynamic list helpers — Experience
  addExperience: () => void;
  removeExperience: (index: number) => void;
  updateExperience: (index: number, key: string, val: string) => void;

  // Dynamic list helpers — Projects
  addProject: () => void;
  removeProject: (index: number) => void;
  updateProject: (index: number, key: string, val: string) => void;

  // Dynamic list helpers — Leadership
  addLeadership: () => void;
  removeLeadership: (index: number) => void;
  updateLeadership: (index: number, key: string, val: string) => void;

  // Dynamic list helpers — Certifications
  addCertification: () => void;
  removeCertification: (index: number) => void;
  updateCertification: (index: number, key: string, val: string) => void;

  // Custom Toast Notifier
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const CandidateContext = createContext<CandidateContextValue | null>(null);

export function useCandidateContext(): CandidateContextValue {
  const ctx = useContext(CandidateContext);
  if (!ctx) throw new Error("useCandidateContext must be used inside CandidateProvider");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CandidateProvider({ children, onNavigateToCV }: { children: ReactNode; onNavigateToCV?: () => void }) {
  // CV Analysis state
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [candidate, setCandidate] = useState<any>(DEFAULT_CANDIDATE);
  const [errorMsg, setErrorMsg] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // AI Harvard Resume Builder form state
  const [rbName, setRbName] = useState("");
  const [rbContact, setRbContact] = useState({
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    portfolio: ""
  });
  const [rbEducationList, setRbEducationList] = useState<any[]>([
    { university: "", degree: "", gpa: "", startYear: "", endYear: "", relevantCoursework: "" }
  ]);
  const [rbExperiences, setRbExperiences] = useState<any[]>([
    { company: "", position: "", location: "", startDate: "", endDate: "", description: "" }
  ]);
  const [rbProjects, setRbProjects] = useState<any[]>([
    { projectName: "", role: "", description: "", technologies: "" }
  ]);
  const [rbLeadership, setRbLeadership] = useState<any[]>([
    { organization: "", role: "", description: "", startDate: "", endDate: "" }
  ]);
  const [rbSkillsObj, setRbSkillsObj] = useState({
    technicalSkills: "",
    programmingLanguages: "",
    tools: "",
    softSkills: ""
  });
  const [rbCertificationsList, setRbCertificationsList] = useState<any[]>([
    { name: "", issuer: "", date: "" }
  ]);
  const [rbInterestsStr, setRbInterestsStr] = useState("");
  const [rbTargetJob, setRbTargetJob] = useState("Backend Developer");

  const [optimizing, setOptimizing] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("harvard");

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchResumeDraft = useCallback(async () => {
    const headers = await getValidToken();
    if (!headers.Authorization) return;
    try {
      const res = await fetch(apiUrl("/api/candidate/resume"), { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.resume) {
          const r = data.resume;
          if (r.name) setRbName(r.name);
          if (r.contact) setRbContact(prev => ({ ...prev, ...r.contact }));
          if (r.education) setRbEducationList(r.education);
          if (r.experiences) setRbExperiences(r.experiences);
          if (r.projects) setRbProjects(r.projects);
          if (r.leadership) setRbLeadership(r.leadership);
          if (r.skills) setRbSkillsObj(prev => ({ ...prev, ...r.skills }));
          if (r.certifications) setRbCertificationsList(r.certifications);
          if (r.interests) setRbInterestsStr(r.interests);
          if (r.targetJob) setRbTargetJob(r.targetJob);
        }
      }
    } catch (err) {
      console.error("Error loading resume draft:", err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    const headers = await getValidToken();
    if (!headers.Authorization) return;
    fetch(apiUrl("/api/candidate/history"), { headers })
      .then((res) => res.ok ? res.json() : { history: [] })
      .then((data) => setHistory(data.history || []))
      .catch(() => setHistory([]));
  }, []);

  // Load profile and applications via JWT-authenticated API calls.
  // SECURITY: Never sends user_id in request — uses Authorization: Bearer token.
  // Uses getValidToken() (async) to auto-refresh expired tokens before requests.
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const userObj = JSON.parse(storedUser);
    const fullName = `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim();
    setCandidate((prev: any) => ({ ...prev, name: fullName, email: userObj.email || "", id: userObj.id || "" }));
    setRbName(fullName);

    // Async IIFE so we can await token refresh before firing requests
    (async () => {
      const headers = await getValidToken();
      if (!headers.Authorization) {
        console.warn("[candidateContext] No valid token available — skipping data fetch");
        return;
      }

      fetch(apiUrl("/api/candidate/profile"), { headers })
        .then((res) => { if (res.ok) return res.json(); throw new Error(`Profile fetch failed: ${res.status}`); })
        .then((data) => { if (data.candidate) { setCandidate(data.candidate); if (data.candidate.cvAnalyzed) setAnalyzed(true); } })
        .catch((err) => console.warn("Profile not found in Supabase yet:", err));

      fetch(apiUrl("/api/candidate/applications"), { headers })
        .then((res) => res.ok ? res.json() : { applications: [] })
        .then((data) => setApplications(data.applications || []))
        .catch(() => setApplications([]));

      fetchHistory();
      fetchResumeDraft();
    })();
  }, [fetchHistory, fetchResumeDraft]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelect = async (file: File) => {
    setAnalyzing(true);
    setErrorMsg("");

    const headers = getAuthHeaders();
    if (!headers.Authorization) {
      setAnalyzing(false);
      setErrorMsg("Not authenticated. Please log in again.");
      return;
    }

    // SECURITY: user_id is NOT sent from frontend.
    // Backend extracts it from the JWT token via @require_auth.
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(apiUrl("/api/candidate/upload"), {
        method: "POST",
        headers,  // Authorization Bearer token only (no Content-Type for multipart)
        body: formData,
      });
      const data = await res.json();
      setAnalyzing(false);
      if (res.ok) {
        setCandidate(data.candidate);
        setAnalyzed(true);
        fetchHistory(); // Refresh history!
      } else {
        setErrorMsg(data.error || "Failed to analyze CV");
      }
    } catch (err) {
      console.error("CV upload error:", err);
      setAnalyzing(false);
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  };

  const handleSelectHistoryItem = (item: any) => {
    setCandidate((prev: any) => ({
      ...prev,
      role: item.jobCategory || item.predictedCategory || prev.role,
      cvScore: item.cvScore,
      atsScore: item.atsScore,
      skillsRelevanceScore: item.skillsRelevanceScore,
      experienceQualityScore: item.experienceQualityScore,
      formatClarityScore: item.formatClarityScore,
      skills: item.skills,
      jobCategory: item.jobCategory,
      experienceLevel: item.experienceLevel,
      experienceYears: item.experienceYears,
      strengths: item.strengths,
      improvements: item.improvements,
      aiNote: item.aiNote,
      hiringChance: item.hiringChance,
      hiringRecommendation: item.hiringRecommendation,
      communicationScore: item.communicationScore,
      culturalFitScore: item.culturalFitScore,
      cvAnalyzed: true,
    }));
    setAnalyzed(true);
    onNavigateToCV?.();
  };

  // ─── Education helpers ──────────────────────────────────────────────────────

  const addEducation = () => {
    setRbEducationList((prev) => [
      ...prev,
      { university: "", degree: "", gpa: "", startYear: "", endYear: "", relevantCoursework: "" }
    ]);
  };
  const removeEducation = (index: number) => {
    setRbEducationList((prev) => prev.filter((_, i) => i !== index));
  };
  const updateEducation = (index: number, key: string, val: string) => {
    setRbEducationList((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [key]: val } : edu)),
    );
  };

  // ─── Experience helpers ─────────────────────────────────────────────────────

  const addExperience = () => {
    setRbExperiences((prev) => [
      ...prev,
      { company: "", position: "", location: "", startDate: "", endDate: "", description: "" },
    ]);
  };
  const removeExperience = (index: number) => {
    setRbExperiences((prev) => prev.filter((_, i) => i !== index));
  };
  const updateExperience = (index: number, key: string, val: string) => {
    setRbExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [key]: val } : exp)),
    );
  };

  // ─── Project helpers ────────────────────────────────────────────────────────

  const addProject = () => {
    setRbProjects((prev) => [
      ...prev,
      { projectName: "", role: "", description: "", technologies: "" }
    ]);
  };
  const removeProject = (index: number) => {
    setRbProjects((prev) => prev.filter((_, i) => i !== index));
  };
  const updateProject = (index: number, key: string, val: string) => {
    setRbProjects((prev) =>
      prev.map((proj, i) => (i === index ? { ...proj, [key]: val } : proj))
    );
  };

  // ─── Leadership helpers ─────────────────────────────────────────────────────

  const addLeadership = () => {
    setRbLeadership((prev) => [
      ...prev,
      { organization: "", role: "", description: "", startDate: "", endDate: "" }
    ]);
  };
  const removeLeadership = (index: number) => {
    setRbLeadership((prev) => prev.filter((_, i) => i !== index));
  };
  const updateLeadership = (index: number, key: string, val: string) => {
    setRbLeadership((prev) =>
      prev.map((lead, i) => (i === index ? { ...lead, [key]: val } : lead)
      ));
  };

  // ─── Certification helpers ──────────────────────────────────────────────────

  const addCertification = () => {
    setRbCertificationsList((prev) => [
      ...prev,
      { name: "", issuer: "", date: "" }
    ]);
  };
  const removeCertification = (index: number) => {
    setRbCertificationsList((prev) => prev.filter((_, i) => i !== index));
  };
  const updateCertification = (index: number, key: string, val: string) => {
    setRbCertificationsList((prev) =>
      prev.map((cert, i) => (i === index ? { ...cert, [key]: val } : cert)
      ));
  };

  // ─── Resume API actions ─────────────────────────────────────────────────────

  const handleImportFromCV = async () => {
    try {
      const res = await fetch(apiUrl("/api/candidate/import-latest-cv"), {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json();
        showToast(errData.error || "Failed to import from CV", "error");
        return;
      }
      const r = await res.json();
      if (r) {
        if (r.name) setRbName(r.name);
        if (r.contact) setRbContact(prev => ({ ...prev, ...r.contact }));
        if (r.education) setRbEducationList(r.education);
        if (r.experiences) setRbExperiences(r.experiences);
        if (r.projects) setRbProjects(r.projects);
        if (r.leadership) setRbLeadership(r.leadership);
        if (r.skills) setRbSkillsObj(prev => ({ ...prev, ...r.skills }));
        if (r.certifications) setRbCertificationsList(r.certifications);
        if (r.interests) setRbInterestsStr(r.interests);
        showToast("Successfully imported details from your latest CV!", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to import from CV due to network error.", "error");
    }
  };

  const handleSaveResumeDraft = async () => {
    const resumePayload = {
      name: rbName,
      contact: rbContact,
      education: rbEducationList,
      experiences: rbExperiences,
      projects: rbProjects,
      leadership: rbLeadership,
      skills: rbSkillsObj,
      certifications: rbCertificationsList,
      interests: rbInterestsStr,
      targetJob: rbTargetJob
    };

    try {
      const res = await fetch(apiUrl("/api/candidate/resume"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          resume: resumePayload,
          template: "harvard"
        })
      });
      if (res.ok) {
        showToast("Draft saved successfully!", "success");
      } else {
        showToast("Failed to save draft", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving draft", "error");
    }
  };

  const handleOptimizeResume = async (e: React.FormEvent) => {
    e.preventDefault();
    setOptimizing(true);
    try {
      const res = await fetch(apiUrl("/api/candidate/optimize-resume"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          resume: {
            name: rbName,
            contact: rbContact,
            education: rbEducationList,
            experiences: rbExperiences,
            projects: rbProjects,
            leadership: rbLeadership,
            skills: rbSkillsObj,
            certifications: rbCertificationsList,
            interests: rbInterestsStr,
            targetJob: rbTargetJob
          }
        }),
      });
      const data = await res.json();
      setOptimizing(false);
      if (res.ok) {
        const opt = data.optimized;
        // Apply ALL returned fields to preserve data integrity
        if (opt.name) setRbName(opt.name);
        if (opt.contact) setRbContact((prev: any) => ({ ...prev, ...opt.contact }));
        if (opt.education) setRbEducationList(opt.education);
        if (opt.experiences) setRbExperiences(opt.experiences);
        if (opt.projects) setRbProjects(opt.projects);
        if (opt.leadership) setRbLeadership(opt.leadership);
        if (opt.skills) setRbSkillsObj((prev: any) => ({ ...prev, ...opt.skills }));
        if (opt.certifications) setRbCertificationsList(opt.certifications);
        if (opt.interests !== undefined) setRbInterestsStr(opt.interests);
        showToast("Resume enhanced successfully! Action verbs strengthened.", "success");
      } else {
        showToast(data.error || "Optimization failed", "error");
      }
    } catch (err) {
      console.error(err);
      setOptimizing(false);
      showToast("Error calling optimize API", "error");
    }
  };

  const handleDownloadPDF = async (templateId?: string) => {
    const templateStyle = typeof templateId === "string" ? templateId : "harvard";
    const resumeSource = {
      name: rbName,
      contact: rbContact,
      education: rbEducationList,
      experiences: rbExperiences,
      projects: rbProjects,
      leadership: rbLeadership,
      skills: rbSkillsObj,
      certifications: rbCertificationsList,
      interests: rbInterestsStr,
      targetJob: rbTargetJob
    };

    console.log("PDF export triggered. Payload resumeSource:", resumeSource);
    console.log("Template style:", templateStyle);

    try {
      const authHeaders = await getValidToken();
      const response = await fetch(apiUrl("/api/candidate/generate-pdf"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          resume: resumeSource,
          template: templateStyle,
        }),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        // Backend returns base64-encoded JSON to bypass browser PDF extension interception
        const json = await response.json();
        console.log("Server reported PDF size:", json.size, "bytes");

        if (!json.pdf_base64 || json.size === 0) {
          console.error("Error: Server returned empty PDF data.");
          showToast("Error: Generated PDF is empty.", "error");
          return;
        }

        // Decode base64 → binary → Blob → download
        const byteCharacters = atob(json.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        console.log("Decoded PDF blob size:", blob.size, "bytes");

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(resumeSource.name || "Resume").replace(/\s+/g, "_")}_Harvard_Resume.pdf`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();
        }, 100);
      } else {
        const errorText = await response.text();
        console.error("Failed to generate PDF:", response.status, errorText);
        showToast("Failed to generate PDF.", "error");
      }
    } catch (err) {
      console.error("Error calling PDF downloader endpoint:", err);
      showToast("Error calling PDF downloader.", "error");
    }
  };

  const handleDownloadWord = async () => {
    const resumeSource = {
      name: rbName,
      contact: rbContact,
      education: rbEducationList,
      experiences: rbExperiences,
      projects: rbProjects,
      leadership: rbLeadership,
      skills: rbSkillsObj,
      certifications: rbCertificationsList,
      interests: rbInterestsStr,
      targetJob: rbTargetJob
    };

    console.log("Word export triggered. Payload resumeSource:", resumeSource);

    try {
      const authHeaders = await getValidToken();
      const response = await fetch(apiUrl("/api/candidate/generate-docx"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          resume: resumeSource,
          template: "harvard",
        }),
      });

      console.log("Word Response status:", response.status);
      console.log("Word Response headers:", Array.from(response.headers.entries()));

      if (response.ok) {
        // Backend returns base64-encoded JSON (mirrors PDF approach)
        const json = await response.json();
        console.log("Server reported DOCX size:", json.size, "bytes");

        if (!json.docx_base64 || json.size === 0) {
          console.error("Error: Server returned empty DOCX data.");
          showToast("Error: Generated Word document is empty.", "error");
          return;
        }

        // Decode base64 → binary → Blob → download
        const byteCharacters = atob(json.docx_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        console.log("Decoded DOCX blob size:", blob.size, "bytes");

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(resumeSource.name || "Resume").replace(/\s+/g, "_")}_Harvard_Resume.docx`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();
        }, 100);
      } else {
        const errorText = await response.text();
        console.error("Failed to generate Word document:", errorText);
        showToast("Failed to generate Word document.", "error");
      }
    } catch (err) {
      console.error("Error calling Word downloader endpoint:", err);
      showToast("Error calling Word downloader.", "error");
    }
  };

  return (
    <CandidateContext.Provider
      value={{
        candidate, setCandidate,
        analyzed, setAnalyzed,
        analyzing, setAnalyzing,
        errorMsg, setErrorMsg,
        applications, setApplications,
        history, setHistory,
        fetchHistory,

        rbName, setRbName,
        rbContact, setRbContact,
        rbEducationList, setRbEducationList,
        rbExperiences, setRbExperiences,
        rbProjects, setRbProjects,
        rbLeadership, setRbLeadership,
        rbSkillsObj, setRbSkillsObj,
        rbCertificationsList, setRbCertificationsList,
        rbInterestsStr, setRbInterestsStr,
        rbTargetJob, setRbTargetJob,
        optimizing, setOptimizing,
        optimizedResult, setOptimizedResult,
        selectedTemplate, setSelectedTemplate,

        handleFileSelect,
        handleImportFromCV,
        handleSaveResumeDraft,
        handleOptimizeResume,
        handleDownloadPDF,
        handleDownloadWord,
        handleSelectHistoryItem,

        addEducation, removeEducation, updateEducation,
        addExperience, removeExperience, updateExperience,
        addProject, removeProject, updateProject,
        addLeadership, removeLeadership, updateLeadership,
        addCertification, removeCertification, updateCertification,
        showToast,
      }}
    >
      {children}

      {/* Custom Global Candidate Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10"
          >
            <div className={`w-2 h-2 rounded-full ${
              toast.type === "success" ? "bg-emerald-500 animate-pulse" :
              toast.type === "error" ? "bg-rose-500 animate-pulse" :
              "bg-blue-500 animate-pulse"
            }`} />
            <span className="text-[12px] font-medium tracking-tight font-sans text-white/90">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-3 text-white/40 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </CandidateContext.Provider>
  );
}
