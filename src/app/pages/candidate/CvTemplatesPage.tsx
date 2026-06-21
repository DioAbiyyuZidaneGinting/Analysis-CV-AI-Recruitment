import { motion } from "motion/react";
import { Download } from "lucide-react";
import { useCandidateContext, getValidToken } from "./candidateContext";
import { TEMPLATES } from "./candidateShared";
import harvardPreview from "./harvard_preview.png";
import atsPreview from "./ats_preview.png";

const PREVIEWS: Record<string, string> = {
  harvard: harvardPreview,
  ats_friendly: atsPreview,
};

export function CvTemplatesPage() {
  const { showToast } = useCandidateContext();

  const handleDownloadStaticTemplate = async (templateId: string) => {
    try {
      const authHeaders = await getValidToken();
      const response = await fetch(`/api/candidate/templates/download/${templateId}`, {
        headers: authHeaders,
      });
      if (response.ok) {
        const json = await response.json();

        // Decode base64 -> binary -> Blob -> download
        const byteCharacters = atob(json.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = json.filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();
        }, 100);
      } else {
        const errData = await response.json();
        showToast(errData.error || "Failed to download template.", "error");
      }
    } catch (err) {
      console.error("Template download error:", err);
      showToast("Network error. Please try again.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-black text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CV Templates
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select from our professionally curated ATS-optimized designs and
          download your resume template instantly as a PDF.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-xl border border-black/[0.08] p-5 flex flex-col justify-between group transition-all duration-200 hover:border-black/20"
          >
            <div>
              <span className="text-[10px] font-mono text-black/40 block mb-1">{tmpl.id.toUpperCase()} CV TEMPLATE</span>
              <div className="h-64 rounded-lg mb-4 overflow-hidden border border-black/[0.08] bg-black/[0.02] flex items-center justify-center">
                <img
                  src={PREVIEWS[tmpl.id]}
                  alt={tmpl.name}
                  className="w-full h-full object-cover object-top transition-transform group-hover:scale-[1.01] duration-300"
                />
              </div>
              <h3
                className="font-black text-foreground text-base mt-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tmpl.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {tmpl.desc}
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => handleDownloadStaticTemplate(tmpl.id)}
                className="flex-1 bg-[#0052CC] hover:bg-[#0052CC]/95 text-white py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm font-mono uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
