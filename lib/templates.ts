import laminateFlooring from "@/data/templates/laminate_flooring.json";
import paintWalls from "@/data/templates/paint_walls.json";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClarifyingQuestion {
  id: string;
  question: string;
  type: "yes_no" | "choice";
  options?: (string | number)[];
  default: boolean | string | number | null;
  auto_logic?: string;
}

export interface ConfigurableDefault {
  id: string;
  label: string;
  unit: string;
  default: number;
  options: number[];
}

export interface Material {
  name: string;
  quantity_key: string;
  unit: string;
  condition: string | null;
  notes: string;
}

export interface ToolItem {
  name: string;
  reason: string;
}

export interface JobTemplate {
  job_id: string;
  job_name: string;
  category: string;
  difficulty: string;
  estimated_time: string;
  icon: string;
  applicable_room_types: string[];
  clarifying_questions: ClarifyingQuestion[];
  configurable_defaults: ConfigurableDefault[];
  materials: Material[];
  tools: {
    essential: ToolItem[];
    helpful: ToolItem[];
  };
  steps: string[];
  pro_tips: string[];
  caveats: string[];
  refittr_message: string;
  [key: string]: unknown;
}

// ── Template registry ─────────────────────────────────────────────────────────

const ALL_TEMPLATES: JobTemplate[] = [
  laminateFlooring as unknown as JobTemplate,
  paintWalls as unknown as JobTemplate,
];

// ── Exported functions ────────────────────────────────────────────────────────

export function getTemplates(): JobTemplate[] {
  return ALL_TEMPLATES;
}

export function getTemplate(jobId: string): JobTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.job_id === jobId);
}

export function getTemplatesForRoom(roomType: string): JobTemplate[] {
  const normalized = roomType.toLowerCase();
  return ALL_TEMPLATES.filter((t) =>
    t.applicable_room_types.some((rt) => normalized.includes(rt) || rt.includes(normalized))
  );
}
