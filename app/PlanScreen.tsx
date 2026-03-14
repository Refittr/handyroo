"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Wrench,
  ListChecks,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  Minus,
  Plus,
  FileImage,
} from "lucide-react";
import type { HouseSchema, Room } from "@/lib/supabase";
import type { JobTemplate } from "@/lib/templates";
import { calculateMaterials, type DoorwayEntry } from "@/lib/calculator";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(cm: number) { return (cm / 100).toFixed(2); }

function quantityAnnotation(quantityKey: string, defaults: Record<string, number>): string | null {
  switch (quantityKey) {
    case "laminate_packs": return `${defaults.pack_coverage_sqm} sqm/pack`;
    case "underlay_rolls": return `${defaults.underlay_roll_sqm} sqm/roll`;
    case "dpm_rolls":      return `${defaults.underlay_roll_sqm} sqm/roll`;
    case "beading_lengths": return `${defaults.beading_length_m}m`;
    case "tins_colour_a":  return `${defaults.tin_size_litres}L`;
    case "tins_colour_b":  return `${defaults.tin_size_litres}L`;
    default: return null;
  }
}

function PillGroup<T extends string | number | boolean>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const label = labels?.[String(opt)] ?? String(opt);
        const selected = opt === value;
        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selected
                ? "bg-[#087F8C] text-white border-[#087F8C]"
                : "bg-white text-[#475569] border-[#CBD5E1] hover:border-[#087F8C] hover:text-[#087F8C]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function Collapsible({ title, icon, defaultOpen = false, children }: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#CBD5E1] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#F1F5F9] transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-[#0F172A]">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type SessionUpdateData = {
  answers: Record<string, unknown>;
  changedDefaults: Record<string, number>;
  doorways: Array<{ other_side: string; bar_type: string }>;
  result: ReturnType<typeof calculateMaterials>;
};

export default function PlanScreen({
  schema,
  room,
  job,
  onBack,
  onSessionUpdate,
}: {
  schema: HouseSchema;
  room: Room;
  job: JobTemplate;
  onBack: () => void;
  onSessionUpdate?: (data: SessionUpdateData) => void;
}) {
  // ── Answers state (pre-seeded with template defaults) ─────────────────────
  const initialAnswers = useMemo(() => {
    const ans: Record<string, unknown> = {};
    for (const q of job.clarifying_questions) {
      ans[q.id] = q.default;
    }
    // Paint: suggest coats based on defaults
    if (job.job_id === "paint_walls") {
      ans.coats = 2;
      ans.coats_a = 2;
      ans.coats_b = 2;
    }
    return ans;
  }, [job]);

  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);

  // Doorway state
  const [doorwayCountOverride, setDoorwayCountOverride] = useState<number | null>(null);
  const [doorways, setDoorways] = useState<DoorwayEntry[]>([]);

  const effectiveDoorCount = doorwayCountOverride ?? room.door_count ?? 1;

  // Sync doorways array length to door count
  const syncedDoorways = useMemo(() => {
    const count = effectiveDoorCount;
    const doorwayOptions = (job.doorway_questions as { options?: Array<{ label: string; bar_type: string }> })?.options ?? [];
    const defaultBar = doorwayOptions[0]?.bar_type ?? "T-bar";
    const defaultLabel = doorwayOptions[0]?.label ?? "Carpet";
    const arr: DoorwayEntry[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(doorways[i] ?? { other_side: defaultLabel, bar_type: defaultBar });
    }
    return arr;
  }, [effectiveDoorCount, doorways, job]);

  // Defaults state
  const initialDefaults = useMemo(() => {
    const d: Record<string, number> = {};
    for (const cd of job.configurable_defaults) {
      d[cd.id] = cd.default;
    }
    return d;
  }, [job]);
  const [defaults, setDefaults] = useState<Record<string, number>>(initialDefaults);

  // Wall assignment for feature wall (paint)
  const [wallAssignments, setWallAssignments] = useState<Record<string, string>>({ "0": "a", "1": "a", "2": "a", "3": "a" });

  // "Adjust" toggles
  const [showDoorwayAdjust, setShowDoorwayAdjust] = useState(false);
  const [showDefaults, setShowDefaults] = useState(false);

  // Collapsibles open state
  const [stepsOpen, setStepsOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const setAnswer = (id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const setDoorway = (index: number, entry: DoorwayEntry) => {
    const updated = [...syncedDoorways];
    updated[index] = entry;
    setDoorways(updated);
  };

  // ── Calculation (live) ────────────────────────────────────────────────────
  const allAnswers = useMemo(() => ({
    ...answers,
    wall_assignments: wallAssignments,
    door_count_override: doorwayCountOverride,
    window_count_override: null,
  }), [answers, wallAssignments, doorwayCountOverride]);

  const result = useMemo(() => {
    return calculateMaterials(
      {
        length_cm: room.length_cm,
        width_cm: room.width_cm,
        height_cm: room.height_cm > 0 ? room.height_cm : 240,
        door_count: room.door_count,
        window_count: room.window_count,
      },
      job,
      allAnswers,
      defaults,
      syncedDoorways
    );
  }, [room, job, allAnswers, defaults, syncedDoorways]);

  const { calculations: calcs } = result;

  // ── Session logging ────────────────────────────────────────────────────────
  const changedDefaults = useMemo(() => {
    return Object.fromEntries(
      Object.entries(defaults).filter(([k, v]) => v !== initialDefaults[k])
    ) as Record<string, number>;
  }, [defaults, initialDefaults]);

  // Use a ref so the effect doesn't depend on onSessionUpdate identity
  const onSessionUpdateRef = useRef(onSessionUpdate);
  useEffect(() => { onSessionUpdateRef.current = onSessionUpdate; });

  useEffect(() => {
    onSessionUpdateRef.current?.({
      answers: allAnswers,
      changedDefaults,
      doorways: syncedDoorways,
      result,
    });
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLaminate = job.job_id === "laminate_flooring";
  const isPaint = job.job_id === "paint_walls";
  const hasDoorwayQ = !!(job.doorway_questions as { enabled?: boolean })?.enabled;
  const doorwayOptions = (job.doorway_questions as { options?: Array<{ label: string; bar_type: string }> })?.options ?? [];

  const featureWall = answers.feature_wall === true;

  // Wall dimension labels
  const wallLabels = [
    `Wall 1 (${fmt(room.length_cm)}m)`,
    `Wall 2 (${fmt(room.width_cm)}m)`,
    `Wall 3 (${fmt(room.length_cm)}m)`,
    `Wall 4 (${fmt(room.width_cm)}m)`,
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to projects
      </button>

      {/* Compact header */}
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]">{job.job_name}</h1>
        <div className="flex items-start justify-between gap-3 mt-0.5">
          <p className="text-sm text-[#64748B]">
            {room.room_name} &middot; {fmt(room.length_cm)}m &times; {fmt(room.width_cm)}m &middot;{" "}
            {schema.model_name}
            {schema.builders ? ` by ${schema.builders.name}` : ""}
          </p>
          {schema.floor_plan_url && (
            <a
              href={schema.floor_plan_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#087F8C] hover:underline flex-shrink-0 mt-0.5"
            >
              <FileImage size={12} />
              Floor plan
            </a>
          )}
        </div>
      </div>

      {/* ── Questions ───────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        {job.clarifying_questions.map((q) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-[#0F172A] mb-2">{q.question}</p>
            {q.type === "yes_no" && (
              <PillGroup
                options={[true, false] as boolean[]}
                value={answers[q.id] as boolean ?? q.default as boolean}
                onChange={(v) => setAnswer(q.id, v)}
                labels={{ true: "Yes", false: "No" }}
              />
            )}
            {q.type === "choice" && q.options && (
              <PillGroup
                options={q.options as string[]}
                value={answers[q.id] as string ?? q.default as string}
                onChange={(v) => setAnswer(q.id, v)}
              />
            )}
          </div>
        ))}

        {/* Feature wall colour assignments */}
        {isPaint && featureWall && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-medium text-[#0F172A]">Which wall is the feature wall?</p>
              {schema.floor_plan_url && (
                <a
                  href={schema.floor_plan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#087F8C] hover:underline flex-shrink-0"
                >
                  <FileImage size={11} />
                  Floor plan
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {wallLabels.map((label, i) => {
                const assignment = wallAssignments[i] ?? "a";
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setWallAssignments((prev) => ({ ...prev, [i]: prev[i] === "b" ? "a" : "b" }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      assignment === "b"
                        ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                        : "bg-white text-[#475569] border-[#CBD5E1] hover:border-[#7C3AED] hover:text-[#7C3AED]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#64748B] mt-1.5">White/unselected = main colour, purple = feature colour</p>
          </div>
        )}

        {/* Doorway section */}
        {hasDoorwayQ && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-[#0F172A]">
                {room.door_count !== null && !showDoorwayAdjust
                  ? `Your ${room.room_name.toLowerCase()} has ${room.door_count} doorway${room.door_count !== 1 ? "s" : ""} according to our records.`
                  : "How many doorways does the room have?"}
              </p>
              {room.door_count !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setShowDoorwayAdjust(!showDoorwayAdjust);
                    if (!showDoorwayAdjust) setDoorwayCountOverride(room.door_count);
                  }}
                  className="text-xs text-[#087F8C] hover:underline flex-shrink-0"
                >
                  {showDoorwayAdjust ? "Use our data" : "Not right? Adjust"}
                </button>
              )}
            </div>

            {(room.door_count === null || showDoorwayAdjust) && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDoorwayCountOverride(Math.max(0, effectiveDoorCount - 1))}
                  className="w-8 h-8 rounded-lg border border-[#CBD5E1] flex items-center justify-center hover:border-[#087F8C] transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-semibold text-[#0F172A] w-4 text-center">{effectiveDoorCount}</span>
                <button
                  type="button"
                  onClick={() => setDoorwayCountOverride(effectiveDoorCount + 1)}
                  className="w-8 h-8 rounded-lg border border-[#CBD5E1] flex items-center justify-center hover:border-[#087F8C] transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {effectiveDoorCount > 0 && doorwayOptions.length > 0 && (
              <div className="space-y-3 pt-1">
                {Array.from({ length: effectiveDoorCount }).map((_, i) => (
                  <div key={i}>
                    <p className="text-xs text-[#64748B] mb-1.5">Doorway {i + 1} — what&apos;s on the other side?</p>
                    <div className="flex flex-wrap gap-2">
                      {doorwayOptions.map((opt) => {
                        const current = syncedDoorways[i];
                        const selected = current?.other_side === opt.label;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => setDoorway(i, { other_side: opt.label, bar_type: opt.bar_type })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              selected
                                ? "bg-[#087F8C] text-white border-[#087F8C]"
                                : "bg-white text-[#475569] border-[#CBD5E1] hover:border-[#087F8C]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Configurable defaults ────────────────────────────────────────────── */}
      <div className="border border-[#CBD5E1] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDefaults(!showDefaults)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F1F5F9] transition-colors"
        >
          <span className="text-sm font-semibold text-[#0F172A]">Adjust assumptions</span>
          {showDefaults ? <ChevronUp size={14} className="text-[#64748B]" /> : <ChevronDown size={14} className="text-[#64748B]" />}
        </button>
        {showDefaults && (
          <div className="px-4 pb-4 space-y-4">
            {job.configurable_defaults.map((cd) => (
              <div key={cd.id}>
                <p className="text-xs font-medium text-[#475569] mb-1.5">
                  {cd.label} <span className="text-[#64748B] font-normal">({cd.unit})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {cd.options.map((opt) => {
                    const selected = defaults[cd.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDefaults((prev) => ({ ...prev, [cd.id]: opt }))}
                        className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                          selected
                            ? "bg-[#087F8C] text-white border-[#087F8C]"
                            : "bg-white text-[#475569] border-[#CBD5E1] hover:border-[#087F8C]"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DIVIDER ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-[#CBD5E1]" />

      {/* ── Room summary ─────────────────────────────────────────────────────── */}
      <div className="bg-[#F1F5F9] rounded-lg p-4 space-y-1.5 text-sm">
        {isLaminate && (
          <>
            <p className="text-[#0F172A]">
              Floor area: <span className="font-semibold">{calcs.floor_area_sqm} sqm</span>
              {" "}+{" "}{calcs.waste_percent}% waste ={" "}
              <span className="font-semibold">{calcs.floor_area_with_waste} sqm</span>
            </p>
            <p className="text-[#64748B] text-xs">
              Perimeter: {calcs.perimeter_m}m &middot; {calcs.doorway_count} doorway{calcs.doorway_count !== 1 ? "s" : ""} &middot; Beading run: {calcs.beading_total_m}m
            </p>
          </>
        )}
        {isPaint && (
          <>
            <p className="text-[#0F172A]">
              Wall area: <span className="font-semibold">{calcs.total_wall_area} sqm</span>
              {" "}- {calcs.door_count_total} door{calcs.door_count_total !== 1 ? "s" : ""} ({calcs.door_deduction} sqm)
              {" "}- {calcs.window_count_total} window{calcs.window_count_total !== 1 ? "s" : ""} ({calcs.window_deduction} sqm)
              {" "}= <span className="font-semibold">{calcs.paintable_area} sqm paintable</span>
            </p>
            <p className="text-[#64748B] text-xs">
              Room height: {calcs.height_m}m &middot; {calcs.coats_a ?? 2} coats
              {calcs.mist_extra ? " + mist coat (new plaster)" : ""}
            </p>
          </>
        )}
      </div>

      {/* ── Shopping list ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart size={16} className="text-[#087F8C]" />
          <h2 className="text-base font-semibold text-[#0F172A]">Shopping list</h2>
        </div>
        <div className="border border-[#CBD5E1] rounded-lg divide-y divide-[#E2E8F0]">
          {result.materials.map((mat, i) => {
            const annotation = quantityAnnotation(mat.quantity_key, defaults);
            return (
            <div key={i} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-[#0F172A]">{mat.name}</span>
                <span className="text-sm font-semibold text-[#087F8C] flex-shrink-0">
                  {mat.quantity} {mat.unit}{annotation ? ` (${annotation})` : ""}
                </span>
              </div>
              {mat.notes && (
                <p className="text-xs text-[#64748B] mt-0.5">{mat.notes}</p>
              )}
            </div>
          );})}
          {result.door_bars.length > 0 && (
            <div className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-[#0F172A]">Door threshold bars</span>
                <span className="text-sm font-semibold text-[#087F8C] flex-shrink-0">
                  {result.door_bars.reduce((s, b) => s + b.count, 0)} bar{result.door_bars.reduce((s, b) => s + b.count, 0) !== 1 ? "s" : ""}
                </span>
              </div>
              {result.door_bars.map((bar, j) => (
                <p key={j} className="text-xs text-[#64748B] mt-0.5">{bar.label}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tools ─────────────────────────────────────────────────────────────── */}
      <Collapsible
        title="Tools"
        icon={<Wrench size={15} className="text-[#087F8C]" />}
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Essential</p>
            <div className="space-y-2">
              {(job.tools.essential as Array<{ name: string; reason: string }>).map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-sm font-medium text-[#0F172A] min-w-0">{t.name}</span>
                  <span className="text-xs text-[#64748B] mt-0.5">— {t.reason}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Helpful extras</p>
            <div className="space-y-2">
              {(job.tools.helpful as Array<{ name: string; reason: string }>).map((t, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-sm font-medium text-[#0F172A] min-w-0">{t.name}</span>
                  <span className="text-xs text-[#64748B] mt-0.5">— {t.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Collapsible>

      {/* ── Steps ─────────────────────────────────────────────────────────────── */}
      <div className="border border-[#CBD5E1] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setStepsOpen(!stepsOpen)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#F1F5F9] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListChecks size={15} className="text-[#087F8C]" />
            <span className="text-sm font-semibold text-[#0F172A]">Step-by-step guide</span>
          </div>
          {stepsOpen ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
        </button>
        {stepsOpen && (
          <div className="px-4 pb-4 pt-1 space-y-3">
            {(job.steps as string[]).map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#E0F7F7] text-[#087F8C] text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[#0F172A] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pro tips ──────────────────────────────────────────────────────────── */}
      <div className="border border-[#CBD5E1] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setTipsOpen(!tipsOpen)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-[#F1F5F9] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={15} className="text-[#087F8C]" />
            <span className="text-sm font-semibold text-[#0F172A]">Pro tips</span>
          </div>
          {tipsOpen ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
        </button>
        {tipsOpen && (
          <div className="px-4 pb-4 pt-1 space-y-2">
            {(job.pro_tips as string[]).map((tip, i) => (
              <div key={i} className="flex gap-2">
                <Lightbulb size={13} className="text-[#087F8C] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#0F172A]">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Caveats ───────────────────────────────────────────────────────────── */}
      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={15} className="text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">Things to check</p>
        </div>
        {(job.caveats as string[]).map((caveat, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-xs text-amber-600 flex-shrink-0 mt-0.5">•</span>
            <p className="text-xs text-amber-800 leading-relaxed">{caveat}</p>
          </div>
        ))}
      </div>

      {/* ── Refittr teaser ────────────────────────────────────────────────────── */}
      <div className="border border-[#CBD5E1] rounded-lg p-5 bg-[#F1F5F9]">
        <p className="text-sm text-[#475569] leading-relaxed mb-3">{job.refittr_message as string}</p>
        <a
          href="https://refittr.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#087F8C] hover:text-[#065f69] transition-colors"
        >
          Check out Refittr
          <ExternalLink size={13} />
        </a>
      </div>

    </div>
  );
}
