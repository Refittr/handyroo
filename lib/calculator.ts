import type { JobTemplate } from "./templates";

export interface RoomInput {
  length_cm: number;
  width_cm: number;
  height_cm: number;
  door_count: number | null;
  window_count: number | null;
}

export interface DoorwayEntry {
  other_side: string;
  bar_type: string;
}

export interface MaterialLine {
  name: string;
  quantity: number;
  unit: string;
  notes: string;
}

export interface DoorBarLine {
  bar_type: string;
  count: number;
  label: string;
}

export interface CalculationResult {
  materials: MaterialLine[];
  door_bars: DoorBarLine[];
  calculations: Record<string, number>;
}

function suggestCoats(currentColour: string, newColour: string, newPlaster: boolean): number {
  if (newPlaster) return 2;
  if ((currentColour === "dark" || currentColour === "medium") && newColour === "light") return 3;
  return 2;
}

export function calculateMaterials(
  room: RoomInput,
  template: JobTemplate,
  answers: Record<string, unknown>,
  defaults: Record<string, number>,
  doorways: DoorwayEntry[]
): CalculationResult {
  const calcs: Record<string, number> = {};
  const materials: MaterialLine[] = [];
  const door_bars: DoorBarLine[] = [];

  // ── Quantity map built per template ───────────────────────────────────────
  const quantities: Record<string, number> = {};

  if (template.job_id === "laminate_flooring") {
    const pack_coverage_sqm = defaults.pack_coverage_sqm ?? 2.1;
    const waste_percent = defaults.waste_percent ?? 10;
    const underlay_roll_sqm = defaults.underlay_roll_sqm ?? 15;
    const beading_length_m = defaults.beading_length_m ?? 2.4;

    const underlay_needed = answers.underlay_needed !== false;
    const beading_needed = answers.beading_needed !== false;
    const subfloor_concrete = answers.subfloor_type === "concrete";

    const floor_area_sqm = (room.length_cm * room.width_cm) / 10000;
    const floor_area_with_waste = floor_area_sqm * (1 + waste_percent / 100);
    const laminate_packs = Math.ceil(floor_area_with_waste / pack_coverage_sqm);

    const doorway_count = doorways.length > 0 ? doorways.length : (room.door_count ?? 1);
    const perimeter_m = ((room.length_cm + room.width_cm) * 2) / 100;
    const beading_total_m = beading_needed ? Math.max(0, perimeter_m - doorway_count * 0.8) : 0;
    const beading_lengths = beading_needed ? Math.ceil(beading_total_m / beading_length_m) : 0;

    const underlay_rolls = underlay_needed ? Math.ceil(floor_area_with_waste / underlay_roll_sqm) : 0;
    const dpm_rolls = subfloor_concrete && underlay_needed ? underlay_rolls : 0;

    calcs.floor_area_sqm = Math.round(floor_area_sqm * 100) / 100;
    calcs.floor_area_with_waste = Math.round(floor_area_with_waste * 100) / 100;
    calcs.waste_percent = waste_percent;
    calcs.perimeter_m = Math.round(perimeter_m * 100) / 100;
    calcs.doorway_count = doorway_count;
    calcs.beading_total_m = Math.round(beading_total_m * 100) / 100;

    quantities.laminate_packs = laminate_packs;
    quantities.underlay_rolls = underlay_rolls;
    quantities.dpm_rolls = dpm_rolls;
    quantities.beading_lengths = beading_lengths;
    quantities.spacers = 1;
    quantities.underlay_tape = underlay_needed ? 1 : 0;
    quantities.dpm_tape = subfloor_concrete ? 1 : 0;

    // Door bars grouped by type
    const barCounts: Record<string, number> = {};
    doorways.forEach((d) => {
      barCounts[d.bar_type] = (barCounts[d.bar_type] ?? 0) + 1;
    });
    for (const [bar_type, count] of Object.entries(barCounts)) {
      door_bars.push({ bar_type, count, label: `${count}× ${bar_type}` });
    }

  } else if (template.job_id === "paint_walls") {
    const coverage_sqm_per_litre = defaults.coverage_sqm_per_litre ?? 12;
    const tin_size_litres = defaults.tin_size_litres ?? 2.5;
    const door_area_sqm = defaults.door_area_sqm ?? 1.6;
    const window_area_sqm = defaults.window_area_sqm ?? 1.2;

    const new_plaster = answers.new_plaster === true;
    const feature_wall = answers.feature_wall === true;
    const wall_assignments = (answers.wall_assignments ?? {}) as Record<string, string>;

    // room height fallback
    const height_cm = room.height_cm > 0 ? room.height_cm : 240;
    const door_count_total = room.door_count ?? (answers.door_count_override as number | null) ?? 1;
    const window_count_total = room.window_count ?? (answers.window_count_override as number | null) ?? 1;

    const wall_areas = [
      (room.length_cm * height_cm) / 10000,  // wall 0 (length)
      (room.width_cm * height_cm) / 10000,   // wall 1 (width)
      (room.length_cm * height_cm) / 10000,  // wall 2 (length opposite)
      (room.width_cm * height_cm) / 10000,   // wall 3 (width opposite)
    ];
    const total_wall_area = wall_areas.reduce((s, a) => s + a, 0);
    const deductions = door_count_total * door_area_sqm + window_count_total * window_area_sqm;
    const paintable_area = Math.max(0, total_wall_area - deductions);

    calcs.total_wall_area = Math.round(total_wall_area * 100) / 100;
    calcs.paintable_area = Math.round(paintable_area * 100) / 100;
    calcs.door_count_total = door_count_total;
    calcs.window_count_total = window_count_total;
    calcs.door_deduction = Math.round(door_count_total * door_area_sqm * 100) / 100;
    calcs.window_deduction = Math.round(window_count_total * window_area_sqm * 100) / 100;
    calcs.height_m = Math.round((height_cm / 100) * 100) / 100;

    let tins_a = 0;
    let tins_b = 0;

    if (!feature_wall) {
      const current = (answers.current_colour as string) ?? "light";
      const next = (answers.new_colour as string) ?? "light";
      const coats = (answers.coats as number) ?? suggestCoats(current, next, new_plaster);
      const mist_extra = new_plaster ? 1 : 0;
      const total_coats = coats + mist_extra;
      const litres = (paintable_area * total_coats) / coverage_sqm_per_litre;
      tins_a = Math.ceil(litres / tin_size_litres);
      calcs.coats_a = coats;
      calcs.mist_extra = mist_extra;
    } else {
      // Split walls by assignment
      let area_a = 0;
      let area_b = 0;
      wall_areas.forEach((wa, i) => {
        if (wall_assignments[i] === "b") area_b += wa;
        else area_a += wa;
      });
      // Distribute deductions proportionally
      const total = area_a + area_b || 1;
      const deductions_a = deductions * (area_a / total);
      const deductions_b = deductions * (area_b / total);
      const paintable_a = Math.max(0, area_a - deductions_a);
      const paintable_b = Math.max(0, area_b - deductions_b);

      const current_a = (answers.current_colour_a as string) ?? "light";
      const next_a = (answers.new_colour_a as string) ?? "light";
      const coats_a = (answers.coats_a as number) ?? suggestCoats(current_a, next_a, new_plaster);

      const current_b = (answers.current_colour_b as string) ?? "light";
      const next_b = (answers.new_colour_b as string) ?? "light";
      const coats_b = (answers.coats_b as number) ?? suggestCoats(current_b, next_b, false);

      const mist_extra = new_plaster ? 1 : 0;
      const litres_a = (paintable_a * (coats_a + mist_extra)) / coverage_sqm_per_litre;
      const litres_b = (paintable_b * coats_b) / coverage_sqm_per_litre;
      tins_a = Math.ceil(litres_a / tin_size_litres);
      tins_b = Math.ceil(litres_b / tin_size_litres);
      calcs.coats_a = coats_a;
      calcs.coats_b = coats_b;
      calcs.mist_extra = new_plaster ? 1 : 0;
    }

    quantities.tins_colour_a = tins_a;
    quantities.tins_colour_b = tins_b;
    quantities.tape_rolls = 2;
    quantities.dust_sheets = 2;
    quantities.roller_sets = 1;
    quantities.spare_sleeves = feature_wall ? 3 : 2;
    quantities.brushes = 1;
    quantities.extension_poles = 1;
    quantities.sugar_soap = 1;
    quantities.filler = 1;
    quantities.sandpaper = 1;
  }

  // ── Build materials list from template, filtered by conditions ─────────────
  const conditionMet = (condition: string | null): boolean => {
    if (!condition) return true;
    if (condition === "underlay_needed") return answers.underlay_needed !== false;
    if (condition === "beading_needed") return answers.beading_needed !== false;
    if (condition === "subfloor_concrete") return answers.subfloor_type === "concrete";
    if (condition === "feature_wall") return (quantities.tins_colour_b ?? 0) > 0;
    return true;
  };

  for (const mat of template.materials as Array<{ name: string; quantity_key: string; unit: string; condition: string | null; notes: string }>) {
    if (!conditionMet(mat.condition)) continue;
    const qty = quantities[mat.quantity_key] ?? 0;
    if (qty === 0 && mat.condition !== null) continue;
    materials.push({ name: mat.name, quantity: qty, unit: mat.unit, notes: mat.notes });
  }

  return { materials, door_bars, calculations: calcs };
}
