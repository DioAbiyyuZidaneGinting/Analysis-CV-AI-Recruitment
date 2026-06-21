import { motion } from "motion/react";
import { Sparkles, Plus, Trash2, Brain, Download } from "lucide-react";
import { useCandidateContext } from "./candidateContext";

export function ResumeBuilderPage() {
  const {
    rbName,
    setRbName,
    rbContact,
    setRbContact,
    rbEducationList,
    rbExperiences,
    rbProjects,
    rbLeadership,
    rbSkillsObj,
    rbCertificationsList,
    rbInterestsStr,
    setRbInterestsStr,
    rbTargetJob,
    setRbTargetJob,
    optimizing,
    handleImportFromCV,
    handleSaveResumeDraft,
    handleOptimizeResume,
    handleDownloadPDF,
    handleDownloadWord,

    addEducation,
    removeEducation,
    updateEducation,
    addExperience,
    removeExperience,
    updateExperience,
    addProject,
    removeProject,
    updateProject,
    addLeadership,
    removeLeadership,
    updateLeadership,
    addCertification,
    removeCertification,
    updateCertification,
  } = useCandidateContext();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            AI Resume Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Create an optimized, ATS-friendly resume. Import your data, optimize
            with AI, and download as PDF or Word.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleImportFromCV}
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#0052CC] hover:bg-[#0052CC]/95 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Import from Latest CV
          </button>
          <button
            type="button"
            onClick={handleSaveResumeDraft}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-black/[0.08] text-foreground rounded-lg text-sm font-bold hover:bg-black/5 transition-all flex items-center justify-center gap-2"
          >
            Save Draft
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Form Block */}
        <div className="space-y-4 max-h-[850px] overflow-y-auto pr-2">
          {/* Personal & Contact Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <span className="text-[10px] font-mono text-black/40 block">[ CONTACT INFORMATION ] </span>
            <h3
              className="text-base font-black text-foreground mt-[-8px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              1. Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={rbName}
                  onChange={(e) => setRbName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  value={rbContact.email}
                  onChange={(e) =>
                    setRbContact({ ...rbContact, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Phone
                </label>
                <input
                  type="text"
                  value={rbContact.phone}
                  onChange={(e) =>
                    setRbContact({ ...rbContact, phone: e.target.value })
                  }
                  placeholder="(123) 456-7890"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Address
                </label>
                <input
                  type="text"
                  value={rbContact.address}
                  onChange={(e) =>
                    setRbContact({ ...rbContact, address: e.target.value })
                  }
                  placeholder="Boston, MA"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={rbContact.linkedin}
                  onChange={(e) =>
                    setRbContact({ ...rbContact, linkedin: e.target.value })
                  }
                  placeholder="linkedin.com/in/johndoe"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Portfolio
                </label>
                <input
                  type="text"
                  value={rbContact.portfolio}
                  onChange={(e) =>
                    setRbContact({ ...rbContact, portfolio: e.target.value })
                  }
                  placeholder="johndoe.dev"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Education Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-black/40 block">[ EDUCATION HISTORY ]</span>
                <h3
                  className="text-base font-black text-foreground mt-[-2px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  2. Education
                </h3>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className="flex items-center gap-1 text-xs text-[#0052CC] font-bold hover:underline font-mono uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add School
              </button>
            </div>
            {rbEducationList.map((edu, index) => (
              <div
                key={index}
                className="p-4 bg-black/[0.01] rounded-lg border border-black/[0.06] space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="University / School"
                      value={edu.university}
                      onChange={(e) =>
                        updateEducation(index, "university", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.S. in Computer Science)"
                      value={edu.degree}
                      onChange={(e) =>
                        updateEducation(index, "degree", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="GPA (e.g. 3.8 / 4.0)"
                      value={edu.gpa}
                      onChange={(e) =>
                        updateEducation(index, "gpa", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Start Date / Year"
                      value={edu.startYear}
                      onChange={(e) =>
                        updateEducation(index, "startYear", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="End Date / Year"
                      value={edu.endYear}
                      onChange={(e) =>
                        updateEducation(index, "endYear", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Location (e.g. Cambridge, MA)"
                      value={edu.location || ""}
                      onChange={(e) =>
                        updateEducation(index, "location", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Relevant Coursework (comma separated)"
                      value={edu.relevantCoursework}
                      onChange={(e) =>
                        updateEducation(
                          index,
                          "relevantCoursework",
                          e.target.value,
                        )
                      }
                      rows={2}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Experience Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-black/40 block">[ PROFESSIONAL EXPERIENCE ]</span>
                <h3
                  className="text-base font-black text-foreground mt-[-2px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  3. Experience
                </h3>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className="flex items-center gap-1 text-xs text-[#0052CC] font-bold hover:underline font-mono uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>
            {rbExperiences.map((exp, index) => (
              <div
                key={index}
                className="p-4 bg-black/[0.01] rounded-lg border border-black/[0.06] space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(index, "company", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Position"
                      value={exp.position}
                      onChange={(e) =>
                        updateExperience(index, "position", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={exp.startDate}
                      onChange={(e) =>
                        updateExperience(index, "startDate", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="End Date"
                      value={exp.endDate}
                      onChange={(e) =>
                        updateExperience(index, "endDate", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Location (e.g. New York, NY)"
                      value={exp.location}
                      onChange={(e) =>
                        updateExperience(index, "location", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Bullet Points (one per line)&#10;e.g. Engineered distributed message processing using RabbitMQ&#10;Optimized database latency by 20% using Redis"
                      value={exp.description}
                      onChange={(e) =>
                        updateExperience(index, "description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Projects Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-black/40 block">[ PERSONAL PROJECTS ]</span>
                <h3
                  className="text-base font-black text-foreground mt-[-2px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  4. Projects
                </h3>
              </div>
              <button
                type="button"
                onClick={addProject}
                className="flex items-center gap-1 text-xs text-[#0052CC] font-bold hover:underline font-mono uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>
            {rbProjects.map((proj, index) => (
              <div
                key={index}
                className="p-4 bg-black/[0.01] rounded-lg border border-black/[0.06] space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={proj.projectName}
                      onChange={(e) =>
                        updateProject(index, "projectName", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Role (e.g. Lead Developer)"
                      value={proj.role}
                      onChange={(e) =>
                        updateProject(index, "role", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Technologies (e.g. Python, Docker, AWS)"
                      value={proj.technologies}
                      onChange={(e) =>
                        updateProject(index, "technologies", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Project description / bullets"
                      value={proj.description}
                      onChange={(e) =>
                        updateProject(index, "description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Leadership & Activities Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-black/40 block">[ LEADERSHIP ACTIVITIES ]</span>
                <h3
                  className="text-base font-black text-foreground mt-[-2px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  5. Leadership & Activities
                </h3>
              </div>
              <button
                type="button"
                onClick={addLeadership}
                className="flex items-center gap-1 text-xs text-[#0052CC] font-bold hover:underline font-mono uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add Activity
              </button>
            </div>
            {rbLeadership.map((lead, index) => (
              <div
                key={index}
                className="p-4 bg-black/[0.01] rounded-lg border border-black/[0.06] space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeLeadership(index)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Organization"
                      value={lead.organization}
                      onChange={(e) =>
                        updateLeadership(index, "organization", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Role / Title"
                      value={lead.role}
                      onChange={(e) =>
                        updateLeadership(index, "role", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Start Date"
                      value={lead.startDate}
                      onChange={(e) =>
                        updateLeadership(index, "startDate", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="End Date"
                      value={lead.endDate}
                      onChange={(e) =>
                        updateLeadership(index, "endDate", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <textarea
                      placeholder="Description"
                      value={lead.description}
                      onChange={(e) =>
                        updateLeadership(index, "description", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Skills Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-black/40 block">[ TECHNICAL SKILLSET ]</span>
              <h3
                className="text-base font-black text-foreground mt-[-2px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                6. Skills
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Programming Languages
                </label>
                <input
                  type="text"
                  value={rbSkillsObj.programmingLanguages}
                  onChange={(e) =>
                    setRbSkillsObj({
                      ...rbSkillsObj,
                      programmingLanguages: e.target.value,
                    })
                  }
                  placeholder="e.g. Python, Java, SQL, JavaScript"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Technical Skills
                </label>
                <input
                  type="text"
                  value={rbSkillsObj.technicalSkills}
                  onChange={(e) =>
                    setRbSkillsObj({
                      ...rbSkillsObj,
                      technicalSkills: e.target.value,
                    })
                  }
                  placeholder="e.g. System Design, REST APIs, Microservices"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Tools
                </label>
                <input
                  type="text"
                  value={rbSkillsObj.tools}
                  onChange={(e) =>
                    setRbSkillsObj({ ...rbSkillsObj, tools: e.target.value })
                  }
                  placeholder="e.g. Git, Docker, Kubernetes, AWS, JIRA"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Soft Skills
                </label>
                <input
                  type="text"
                  value={rbSkillsObj.softSkills}
                  onChange={(e) =>
                    setRbSkillsObj({
                      ...rbSkillsObj,
                      softSkills: e.target.value,
                    })
                  }
                  placeholder="e.g. Leadership, Mentoring, Public Speaking"
                  className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Certifications Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-black/40 block">[ CERTIFICATIONS ]</span>
                <h3
                  className="text-base font-black text-foreground mt-[-2px]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  7. Certifications
                </h3>
              </div>
              <button
                type="button"
                onClick={addCertification}
                className="flex items-center gap-1 text-xs text-[#0052CC] font-bold hover:underline font-mono uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>
            {rbCertificationsList.map((cert, index) => (
              <div
                key={index}
                className="p-4 bg-black/[0.01] rounded-lg border border-black/[0.06] space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Certification Name"
                      value={cert.name}
                      onChange={(e) =>
                        updateCertification(index, "name", e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Issuer (e.g. AWS)"
                      value={cert.issuer}
                      onChange={(e) =>
                        updateCertification(index, "issuer", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Date"
                      value={cert.date}
                      onChange={(e) =>
                        updateCertification(index, "date", e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-black/[0.08] text-xs focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interests Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5 space-y-4">
            <div>
              <span className="text-[10px] font-mono text-black/40 block">[ INTERESTS ]</span>
              <h3
                className="text-base font-black text-foreground mt-[-2px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                8. Interests
              </h3>
            </div>
            <textarea
              placeholder="e.g. Hiking, Marathon Running, Chess, Open-source development"
              value={rbInterestsStr}
              onChange={(e) => setRbInterestsStr(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
            />
          </div>

          {/* AI Optimization Block */}
          <div className="bg-white rounded-xl border border-black/[0.08] p-5">
            <div className="mb-4">
              <span className="text-[10px] font-mono text-black/40 block">[ AI RESUME OPTIMIZATION ]</span>
              <label className="text-xs font-semibold text-foreground mb-1 block mt-1">
                Target Job Category for AI Optimization
              </label>
              <select
                value={rbTargetJob}
                onChange={(e) => setRbTargetJob(e.target.value)}
                className="w-full px-3 py-2 bg-black/[0.02] rounded-lg border border-black/[0.08] text-sm focus:outline-none focus:border-[#0052CC] hover:border-black/20 transition-all"
              >
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Machine Learning Engineer">
                  Machine Learning Engineer
                </option>
                <option value="Web Designing">Web Designing</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Java Developer">Java Developer</option>
                <option value="Python Developer">Python Developer</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleOptimizeResume}
              disabled={optimizing}
              className="w-full bg-[#0052CC] hover:bg-[#0052CC]/95 text-white py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-75 flex items-center justify-center gap-2 font-mono uppercase tracking-wider shadow-sm"
            >
              {optimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing & Paraphrasing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" /> Enhance Resume via AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Harvard Paper Preview Block */}
        <div className="bg-white rounded-xl border border-black/[0.08] p-5 flex flex-col justify-between h-[850px] sticky top-24">
          <div className="flex justify-between items-center pb-4 border-b border-black/[0.06] flex-shrink-0">
            <div>
              <span className="text-[10px] font-mono text-black/40 block">[ HARVARD CV TEMPLATE ]</span>
              <h3
                className="text-base font-black text-foreground mt-[-2px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Live Harvard CV Preview
              </h3>
              <p className="text-xs text-muted-foreground">
                Interactive Paper Layout (Times New Roman)
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => handleDownloadPDF("harvard")}
                className="px-3 py-1.5 bg-black hover:bg-black/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Download PDF"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>

              <button
                type="button"
                onClick={handleDownloadWord}
                className="px-3 py-1.5 bg-white border border-black/[0.08] hover:bg-black/5 text-black rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Download Word (DOCX)"
              >
                <Download className="w-3.5 h-3.5" /> Word
              </button>
            </div>
          </div>

          {/* A4 Paper Container */}
          <div className="flex-1 overflow-y-auto bg-muted/40 p-4 rounded-xl mt-4 flex justify-center items-start border border-black/[0.04] scrollbar-thin">
            <div
              className="w-full bg-white shadow-md border border-black/[0.08] p-6 text-black transition-all duration-300 font-serif"
              style={{
                fontSize: "9px",
                lineHeight: "1.3",
                fontFamily: "'Times New Roman', Times, serif",
                minHeight: "297mm",
              }}
            >
              {/* Header */}
              <div className="text-center mb-1">
                <h1
                  className="text-lg font-bold tracking-tight text-black uppercase"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {rbName || "YOUR FULL NAME"}
                </h1>
              </div>

              {/* Contact details */}
              <div className="text-center text-[8.5px] text-gray-800 mb-3 pb-1.5 border-b border-black">
                {[
                  rbContact.address,
                  rbContact.phone,
                  rbContact.email,
                  rbContact.linkedin,
                  rbContact.portfolio,
                ]
                  .filter(Boolean)
                  .join("  •  ")}
              </div>

              {/* Education */}
              {rbEducationList.length > 0 && (
                <div className="mb-3">
                  <h2 className="text-center font-bold text-[9px] uppercase tracking-wider border-b border-black mb-1.5">
                    Education
                  </h2>
                  {rbEducationList.map((edu, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{edu.university || "University / School"}</span>
                        <span>
                          {edu.startYear && edu.endYear
                            ? `${edu.startYear} – ${edu.endYear}`
                            : edu.endYear || ""}
                        </span>
                      </div>
                      <div className="flex justify-between text-[8.5px] text-gray-700 italic">
                        <span>
                          {edu.degree || "Degree Description"}
                          {edu.gpa ? ` (GPA: ${edu.gpa})` : ""}
                        </span>
                        <span>{edu.location || ""}</span>
                      </div>
                      {edu.relevantCoursework && (
                        <div className="text-[8.5px] text-gray-700 mt-0.5">
                          <span className="font-bold">
                            Relevant Coursework:
                          </span>{" "}
                          {edu.relevantCoursework}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {rbExperiences.length > 0 && (
                <div className="mb-3">
                  <h2 className="text-center font-bold text-[9px] uppercase tracking-wider border-b border-black mb-1.5">
                    Experience
                  </h2>
                  {rbExperiences.map((exp, i) => (
                    <div key={i} className="mb-2.5">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{exp.company || "Company"}</span>
                        <span>{exp.location || ""}</span>
                      </div>
                      <div className="flex justify-between text-[8.5px] text-gray-700 italic">
                        <span>{exp.position || "Position"}</span>
                        <span>
                          {exp.startDate && exp.endDate
                            ? `${exp.startDate} – ${exp.endDate}`
                            : exp.endDate || ""}
                        </span>
                      </div>
                      {exp.description && (
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[8px] text-gray-800">
                          {exp.description
                            .split("\n")
                            .filter(Boolean)
                            .map((bullet, bIdx) => (
                              <li key={bIdx}>
                                {bullet.replace(/^[•\-\*\s]+/, "")}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {rbProjects.length > 0 && (
                <div className="mb-3">
                  <h2 className="text-center font-bold text-[9px] uppercase tracking-wider border-b border-black mb-1.5">
                    Projects
                  </h2>
                  {rbProjects.map((proj, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>
                          {proj.projectName || "Project Name"}
                          {proj.role ? ` – ${proj.role}` : ""}
                        </span>
                        <span className="italic font-normal text-[8px] text-gray-600">
                          {proj.technologies}
                        </span>
                      </div>
                      {proj.description && (
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[8px] text-gray-800">
                          {proj.description
                            .split("\n")
                            .filter(Boolean)
                            .map((bullet, bIdx) => (
                              <li key={bIdx}>
                                {bullet.replace(/^[•\-\*\s]+/, "")}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Leadership & Activities */}
              {rbLeadership.length > 0 && (
                <div className="mb-3">
                  <h2 className="text-center font-bold text-[9px] uppercase tracking-wider border-b border-black mb-1.5">
                    Leadership & Activities
                  </h2>
                  {rbLeadership.map((lead, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold text-gray-900">
                        <span>{lead.organization || "Organization"}</span>
                        <span>
                          {lead.startDate && lead.endDate
                            ? `${lead.startDate} – ${lead.endDate}`
                            : lead.endDate || ""}
                        </span>
                      </div>
                      <div className="text-[8.5px] text-gray-700 italic">
                        {lead.role}
                      </div>
                      {lead.description && (
                        <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[8px] text-gray-800">
                          {lead.description
                            .split("\n")
                            .filter(Boolean)
                            .map((bullet, bIdx) => (
                              <li key={bIdx}>
                                {bullet.replace(/^[•\-\*\s]+/, "")}
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills & Interests */}
              <div className="mb-3">
                <h2 className="text-center font-bold text-[9px] uppercase tracking-wider border-b border-black mb-1.5">
                  Skills & Interests
                </h2>
                <div className="text-[8px] text-gray-800 space-y-0.5">
                  {rbSkillsObj.programmingLanguages && (
                    <div>
                      <span className="font-bold">Programming Languages:</span>{" "}
                      {rbSkillsObj.programmingLanguages}
                    </div>
                  )}
                  {rbSkillsObj.technicalSkills && (
                    <div>
                      <span className="font-bold">Technical Skills:</span>{" "}
                      {rbSkillsObj.technicalSkills}
                    </div>
                  )}
                  {rbSkillsObj.tools && (
                    <div>
                      <span className="font-bold">Tools:</span>{" "}
                      {rbSkillsObj.tools}
                    </div>
                  )}
                  {rbSkillsObj.softSkills && (
                    <div>
                      <span className="font-bold">Soft Skills:</span>{" "}
                      {rbSkillsObj.softSkills}
                    </div>
                  )}
                  {rbInterestsStr && (
                    <div>
                      <span className="font-bold">Interests:</span>{" "}
                      {rbInterestsStr}
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              {rbCertificationsList.length > 0 && (
                <div className="mb-3">
                  <h2 className="text-center font-bold text-[9px] uppercase tracking-wider border-b border-black mb-1.5">
                    Certifications
                  </h2>
                  <ul className="list-disc pl-4 space-y-0.5 text-[8px] text-gray-800">
                    {rbCertificationsList.map((cert, i) => (
                      <li key={i}>
                        <span className="font-bold">{cert.name}</span>
                        {cert.issuer ? `, ${cert.issuer}` : ""}
                        {cert.date ? ` (${cert.date})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
