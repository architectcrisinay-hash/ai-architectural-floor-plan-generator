"use client";

import { useState, type CSSProperties } from "react";

type Project = {
  projectName: string;
  lotSize: number;
  plotLength: number;
  plotWidth: number;
  frontage: number;
  depth: number;
  frontSetback: number;
  rearSetback: number;
  leftSetback: number;
  rightSetback: number;
  frontFootprint: number;
  rearFootprint: number;
  leftFootprint: number;
  rightFootprint: number;
};

const initialProject: Project = {
  projectName: "My Villa Project",
  lotSize: 432,
  plotLength: 24,
  plotWidth: 18,
  frontage: 18,
  depth: 24,
  frontSetback: 4,
  rearSetback: 3,
  leftSetback: 2,
  rightSetback: 2,
  frontFootprint: 14,
  rearFootprint: 12,
  leftFootprint: 10,
  rightFootprint: 10
};

export default function Home() {
  const [project, setProject] = useState<Project>(initialProject);
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [concept, setConcept] = useState("");

  function updateField(field: keyof Project, value: string | number) {
    setProject((prev) => ({ ...prev, [field]: value }));
  }

  function saveProject() {
    setSavedProjects((prev) => [{ ...project }, ...prev]);
  }

  function generateConcept() {
    setConcept(
      `Concept: Modern family villa designed for a ${project.plotWidth}m x ${project.plotLength}m plot. ` +
      `The layout prioritizes natural light, ventilation, and clear zoning between public, private, and service spaces. ` +
      `Recommended built-up area is around ${Math.round(project.lotSize * 0.55)} m² with front setbacks of ${project.frontSetback}m and soft landscape edges.`
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <div>
            <div style={styles.topLabel}>AI VILLA PLANNER</div>
            <h1 style={styles.title}>Villa Planning Studio</h1>
          </div>

          <div style={styles.buttonRow}>
            <button style={styles.primaryButton} onClick={saveProject}>Save Project</button>
            <button style={styles.secondaryButton} onClick={generateConcept}>Generate Concept</button>
          </div>
        </header>

        <div style={styles.contentGrid}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Project Details</h2>

            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span style={styles.label}>Project Name</span>
                <input value={project.projectName} onChange={(e) => updateField("projectName", e.target.value)} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Lot Size (m²)</span>
                <input type="number" value={project.lotSize} onChange={(e) => updateField("lotSize", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Plot Length (m)</span>
                <input type="number" value={project.plotLength} onChange={(e) => updateField("plotLength", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Plot Width (m)</span>
                <input type="number" value={project.plotWidth} onChange={(e) => updateField("plotWidth", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Frontage (m)</span>
                <input type="number" value={project.frontage} onChange={(e) => updateField("frontage", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Depth (m)</span>
                <input type="number" value={project.depth} onChange={(e) => updateField("depth", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Front Setback (m)</span>
                <input type="number" value={project.frontSetback} onChange={(e) => updateField("frontSetback", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Rear Setback (m)</span>
                <input type="number" value={project.rearSetback} onChange={(e) => updateField("rearSetback", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Left Setback (m)</span>
                <input type="number" value={project.leftSetback} onChange={(e) => updateField("leftSetback", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Right Setback (m)</span>
                <input type="number" value={project.rightSetback} onChange={(e) => updateField("rightSetback", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Front Footprint (m)</span>
                <input type="number" value={project.frontFootprint} onChange={(e) => updateField("frontFootprint", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Rear Footprint (m)</span>
                <input type="number" value={project.rearFootprint} onChange={(e) => updateField("rearFootprint", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Left Footprint (m)</span>
                <input type="number" value={project.leftFootprint} onChange={(e) => updateField("leftFootprint", Number(e.target.value))} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Right Footprint (m)</span>
                <input type="number" value={project.rightFootprint} onChange={(e) => updateField("rightFootprint", Number(e.target.value))} />
              </label>
            </div>
          </section>

          <aside style={styles.panelRight}>
            <h2 style={styles.panelTitle}>Saved Projects</h2>

            <div style={{ minHeight: 120 }}>
              {savedProjects.length === 0 ? (
                <p style={styles.emptyText}>No saved projects yet.</p>
              ) : (
                savedProjects.map((item, index) => (
                  <div key={index} style={styles.savedItem}>{item.projectName}</div>
                ))
              )}
            </div>

            <h3 style={{ ...styles.panelTitle, marginTop: 28 }}>AI Concept</h3>
            <div style={styles.conceptBox}>
              {concept || "Generate a concept to get your architectural summary."}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#021321",
    color: "#edf5ff",
    padding: "32px 20px"
  },
  wrapper: {
    maxWidth: 1280,
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 28,
    flexWrap: "wrap"
  },
  topLabel: {
    fontSize: 12,
    letterSpacing: "0.2em",
    color: "#3be5d0",
    textTransform: "uppercase",
    fontWeight: 800,
    marginBottom: 8
  },
  title: {
    margin: 0,
    fontSize: "clamp(2.4rem, 5vw, 4.6rem)",
    lineHeight: 1.1,
    fontWeight: 800
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
  },
  primaryButton: {
    background: "#39d6b7",
    color: "#022a2b",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontWeight: 700,
    fontSize: 18
  },
  secondaryButton: {
    background: "rgba(18, 35, 52, 0.9)",
    color: "#edf5ff",
    border: "1px solid rgba(120, 150, 190, 0.5)",
    borderRadius: 12,
    padding: "14px 28px",
    fontWeight: 700,
    fontSize: 18
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 0.9fr",
    gap: 24
  },
  panel: {
    background: "rgba(8, 22, 35, 0.82)",
    border: "1px solid rgba(120, 150, 190, 0.28)",
    borderRadius: 18,
    padding: 24
  },
  panelRight: {
    background: "rgba(8, 22, 35, 0.82)",
    border: "1px solid rgba(120, 150, 190, 0.28)",
    borderRadius: 18,
    padding: 24
  },
  panelTitle: {
    margin: "0 0 20px 0",
    fontSize: "clamp(1.6rem, 3vw, 2.5rem)",
    fontWeight: 800
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 18
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: 15
  },
  label: {
    color: "#dfeaf8",
    fontSize: 15,
    fontWeight: 600
  },
  emptyText: {
    color: "#dfeaf8",
    fontSize: 18
  },
  savedItem: {
    background: "#071a29",
    border: "1px solid rgba(120, 150, 190, 0.38)",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 10
  },
  conceptBox: {
    background: "#071a29",
    border: "1px solid rgba(120, 150, 190, 0.38)",
    borderRadius: 12,
    padding: 18,
    color: "#edf5ff",
    lineHeight: 1.6,
    minHeight: 120
  }
};
