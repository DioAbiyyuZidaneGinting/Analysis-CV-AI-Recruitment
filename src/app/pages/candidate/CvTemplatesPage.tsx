import { motion } from "motion/react";
import { Download } from "lucide-react";
import { getValidToken } from "./candidateContext";
import { TEMPLATES } from "./candidateShared";
import harvardPreview from "./harvard_preview.png";
import atsPreview from "./ats_preview.png";

const PREVIEWS: Record<string, string> = {
  harvard: harvardPreview,
  ats_friendly: atsPreview,
};

export function CvTemplatesPage() {
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
        alert(errData.error || "Failed to download template.");
      }
    } catch (err) {
      console.error("Template download error:", err);
      alert("Network error. Please try again.");
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
        <p className="text-muted-foreground mt-1">
          Select from our professionally curated ATS-optimized designs and
          download your resume template instantly as a PDF.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-2xl border border-black/[0.06] p-6 flex flex-col justify-between group hover:shadow-lg transition-shadow"
          >
            <div>
              <div className="h-64 rounded-xl mb-4 overflow-hidden border border-black/[0.06] bg-muted/20 flex items-center justify-center">
                <img
                  src={PREVIEWS[tmpl.id]}
                  alt={tmpl.name}
                  className="w-full h-full object-cover object-top transition-transform group-hover:scale-[1.02] duration-300"
                />
              </div>
              <h3
                className="font-black text-foreground text-base"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {tmpl.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {tmpl.desc}
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => handleDownloadStaticTemplate(tmpl.id)}
                className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
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
