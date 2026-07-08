// ── Visual types ─────────────────────────────────────────────────────────────
// Visuals are separate from section content — they live in lib/visuals/
// and are injected into SectionBlock at render time by slug + section id.

export type NodeColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'slate' | 'rose';

// ArchDiagram — stacked layers of nodes with arrows between layers
export interface ArchNode {
  label: string;
  sublabel?: string;
  color?: NodeColor;
}
export interface ArchLayer {
  nodes: ArchNode[];
  edgeLabel?: string; // label on the arrow going INTO this layer
}
export interface ArchDiagramData {
  type: 'arch';
  title: string;
  layers: ArchLayer[];
}

// FlowTimeline — numbered steps with optional branch paths
export interface FlowStep {
  label: string;
  detail?: string;
  color?: NodeColor;
  branch?: FlowStep[]; // parallel path shown beside main step
}
export interface FlowTimelineData {
  type: 'flow';
  title: string;
  steps: FlowStep[];
}

// ComponentTree — indented hierarchy
export interface TreeNode {
  label: string;
  note?: string;
  color?: NodeColor;
  children?: TreeNode[];
}
export interface ComponentTreeData {
  type: 'tree';
  title: string;
  root: TreeNode;
}

// ComparisonPanel — side-by-side two columns
export interface ComparisonColumn {
  heading: string;
  color: NodeColor;
  points: string[];
}
export interface ComparisonPanelData {
  type: 'comparison';
  title: string;
  columns: [ComparisonColumn, ComparisonColumn];
}

export type VisualData =
  | ArchDiagramData
  | FlowTimelineData
  | ComponentTreeData
  | ComparisonPanelData;
