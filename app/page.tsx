"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ArrowLeft,
  Sofa,
  ChefHat,
  Bed,
  Bath,
  WashingMachine,
  BookOpen,
  DoorOpen,
  Home,
  Layers,
  Paintbrush,
  Hammer,
  Wrench,
  Zap,
  Clock,
  FileImage,
  type LucideIcon,
} from "lucide-react";
import { supabase, type HouseSchema, type Room } from "@/lib/supabase";
import { getTemplatesForRoom, type JobTemplate } from "@/lib/templates";
import type { CalculationResult } from "@/lib/calculator";
import PlanScreen from "./PlanScreen";

// ── Types ────────────────────────────────────────────────────────────────────

type AppState = "search" | "rooms" | "jobs" | "plan";

const ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Paintbrush,
  Hammer,
  Wrench,
  Zap,
  Home,
};

const FLOOR_LABELS: Record<number, string> = {
  0: "Ground Floor",
  1: "First Floor",
  2: "Second Floor",
  3: "Third Floor",
};

function roomIcon(roomType: string) {
  const t = roomType.toLowerCase();
  if (t.includes("kitchen") || t.includes("dining")) return ChefHat;
  if (t.includes("bedroom")) return Bed;
  if (t.includes("bathroom") || t.includes("bath") || t.includes("en suite") || t.includes("ensuite") || t.includes("shower")) return Bath;
  if (t.includes("utility") || t.includes("laundry")) return WashingMachine;
  if (t.includes("study") || t.includes("office")) return BookOpen;
  if (t.includes("hall") || t.includes("landing") || t.includes("entrance")) return DoorOpen;
  if (t.includes("living") || t.includes("lounge") || t.includes("sitting")) return Sofa;
  return Home;
}

function fmt(cm: number) {
  return (cm / 100).toFixed(2);
}

function area(l: number, w: number) {
  return ((l / 100) * (w / 100)).toFixed(2);
}

// ── House request form ────────────────────────────────────────────────────────

function HouseRequestForm() {
  const [builder, setBuilder] = useState("");
  const [houseType, setHouseType] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-800">
        Thanks! We&apos;ll get your house type added and let you know.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!builder.trim() || !houseType.trim() || !email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase
        .from("house_requests")
        .insert({ builder_name: builder.trim(), house_type: houseType.trim(), email: email.trim() });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Builder name</label>
        <input
          type="text"
          value={builder}
          onChange={(e) => setBuilder(e.target.value)}
          placeholder="e.g. Barratt Homes"
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">House type</label>
        <input
          type="text"
          value={houseType}
          onChange={(e) => setHouseType(e.target.value)}
          placeholder="e.g. The Marford, 3 bed semi-detached"
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Your email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#10B981] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending..." : "Request this house"}
      </button>
    </form>
  );
}

// ── Project request form ──────────────────────────────────────────────────────

function ProjectRequestForm() {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-800">
        Nice one! We&apos;ll build that template and let you know when it&apos;s ready.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!description.trim() || !email.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase
        .from("project_requests")
        .insert({ project_description: description.trim(), email: email.trim() });
      if (dbError) throw dbError;
      setSubmitted(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Project description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Lay engineered wood flooring in a bedroom"
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Your email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#10B981] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Sending..." : "Request this project"}
      </button>
    </form>
  );
}

// ── Floor plan block ──────────────────────────────────────────────────────────

function FloorPlanBlock({ url }: { url: string }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm text-[#087F8C] hover:bg-[#F1F5F9] transition-colors"
      >
        <FileImage size={16} />
        View floor plan
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-[#087F8C] transition-colors"
    >
      <img
        src={url}
        alt="Floor plan"
        className="w-full object-contain max-h-80"
        onError={() => setImgFailed(true)}
      />
      <div className="flex items-center gap-1.5 px-3 py-2 border-t border-[#E2E8F0] text-xs text-[#087F8C]">
        <FileImage size={12} />
        View full size
      </div>
    </a>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

type SessionUpdateData = {
  answers: Record<string, unknown>;
  changedDefaults: Record<string, number>;
  doorways: Array<{ other_side: string; bar_type: string }>;
  result: CalculationResult;
};

export default function Page() {
  const [appState, setAppState] = useState<AppState>("search");
  const [selectedSchema, setSelectedSchema] = useState<HouseSchema | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobTemplate | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HouseSchema[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search error state
  const [searchError, setSearchError] = useState<string | null>(null);

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const q = query.trim();

        const { data, error } = await supabase
          .rpc("search_house_schemas", { search_term: q });

        if (error) throw error;

        // Fetch exterior photos + floor plans for matched schemas (RPC doesn't return them)
        const ids = (data || []).map((r: any) => r.id as string);
        let photoMap: Record<string, { exterior_photo_url: string | null; floor_plan_url: string | null }> = {};
        if (ids.length > 0) {
          const { data: photos } = await supabase
            .from("house_schemas")
            .select("id, exterior_photo_url, floor_plan_url")
            .in("id", ids);
          if (photos) {
            for (const p of photos as Array<{ id: string; exterior_photo_url: string | null; floor_plan_url: string | null }>) {
              photoMap[p.id] = { exterior_photo_url: p.exterior_photo_url, floor_plan_url: p.floor_plan_url };
            }
          }
        }

        // RPC returns builder_name as a flat field — reshape to match HouseSchema
        const normalised = (data || []).map((r: any) => ({
          id: r.id,
          builder_id: r.builder_id,
          model_name: r.model_name,
          bedrooms: r.bedrooms,
          property_type: r.property_type,
          exterior_photo_url: photoMap[r.id]?.exterior_photo_url ?? null,
          floor_plan_url: photoMap[r.id]?.floor_plan_url ?? null,
          builders: r.builder_name ? { id: r.builder_id, name: r.builder_name } : undefined,
        })) as HouseSchema[];
        setResults(normalised);
      } catch (err: any) {
        setResults([]);
        setSearchError(err?.message ?? "Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Fetch rooms when schema selected
  const selectSchema = async (schema: HouseSchema) => {
    setSelectedSchema(schema);
    setAppState("rooms");
    setIsLoadingRooms(true);
    setRoomsError(null);
    setRooms([]);

    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, house_schema_id, room_name, room_type, floor_level, length_cm, width_cm, height_cm, door_count, window_count")
        .eq("house_schema_id", schema.id)
        .order("floor_level", { ascending: true })
        .order("room_name", { ascending: true });

      if (error) throw error;
      // Filter out rooms with no dimensions
      setRooms((data as Room[]).filter((r) => r.length_cm > 0 || r.width_cm > 0));
    } catch {
      setRoomsError("Failed to load rooms. Please try again.");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const selectRoom = (room: Room) => {
    setSelectedRoom(room);
    setSelectedJob(null);
    setAppState("jobs");
  };

  const handleSessionUpdate = useCallback(async (data: SessionUpdateData) => {
    if (!selectedSchema || !selectedRoom || !selectedJob) return;
    const calculatedOutput = Object.fromEntries(
      data.result.materials.map((m) => [m.quantity_key, m.quantity])
    );
    if (!sessionIdRef.current) {
      try {
        const { data: row, error } = await supabase
          .from("handyroo_sessions")
          .insert({
            house_schema_id: selectedSchema.id,
            room_id: selectedRoom.id,
            job_template_id: selectedJob.job_id,
            user_inputs: data.answers,
            configured_defaults: data.changedDefaults,
            doorways: data.doorways,
            calculated_output: calculatedOutput,
          })
          .select("id")
          .single();
        if (error) { console.error("Session insert error:", error); return; }
        sessionIdRef.current = (row as { id: string }).id;
      } catch (e) {
        console.error("Session insert error:", e);
      }
    } else {
      try {
        const { error } = await supabase
          .from("handyroo_sessions")
          .update({
            user_inputs: data.answers,
            configured_defaults: data.changedDefaults,
            doorways: data.doorways,
            calculated_output: calculatedOutput,
          })
          .eq("id", sessionIdRef.current);
        if (error) console.error("Session update error:", error);
      } catch (e) {
        console.error("Session update error:", e);
      }
    }
  }, [selectedSchema, selectedRoom, selectedJob]);

  const selectJob = (job: JobTemplate) => {
    sessionIdRef.current = null;
    setSelectedJob(job);
    setAppState("plan");
  };

  const goBackToSearch = () => {
    sessionIdRef.current = null;
    setAppState("search");
    setSelectedSchema(null);
    setSelectedRoom(null);
    setSelectedJob(null);
    setRooms([]);
  };

  const goBackToRooms = () => {
    sessionIdRef.current = null;
    setAppState("rooms");
    setSelectedRoom(null);
    setSelectedJob(null);
  };

  const goBackToJobs = () => {
    sessionIdRef.current = null;
    setAppState("jobs");
    setSelectedJob(null);
  };

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = room.floor_level;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-[600px] mx-auto px-6 py-12 flex-1 w-full">

        {/* Page header */}
        <header className="mb-12">
          <div className="flex items-baseline gap-2">
            <button
              onClick={goBackToSearch}
              className="text-2xl font-bold tracking-tight text-[#0F172A] hover:text-[#10B981] transition-colors"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              HandyRoo
            </button>
            <span className="text-sm text-[#64748B]">by Refittr</span>
          </div>
        </header>

        {/* ── STATE 1: Search ── */}
        {appState === "search" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-[#0F172A] mb-2">
                What&apos;s your house type?
              </h1>
              <p className="text-[#64748B] text-sm">
                We know the dimensions of thousands of UK homes.
              </p>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by house type or builder (e.g. The Alderney by Barratt)"
                autoFocus
                className="w-full pl-9 pr-4 py-3 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
              />
            </div>

            {/* Results */}
            {isSearching && (
              <p className="text-sm text-[#94A3B8]">Searching...</p>
            )}

            {!isSearching && results.length > 0 && (
              <div className="space-y-3">
                {results.map((schema) => (
                  <button
                    key={schema.id}
                    onClick={() => selectSchema(schema)}
                    className="w-full border border-[#E2E8F0] rounded-xl overflow-hidden text-left hover:border-[#10B981] transition-colors group"
                  >
                    {/* Exterior photo */}
                    {schema.exterior_photo_url ? (
                      <img
                        src={schema.exterior_photo_url}
                        alt={schema.model_name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-[#F1F5F9] flex items-center justify-center">
                        <Home size={36} className="text-[#CBD5E1]" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="px-4 py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] group-hover:text-[#10B981] transition-colors">
                          {schema.model_name}
                          {schema.builders && (
                            <span className="text-[#64748B] font-normal"> by {schema.builders.name}</span>
                          )}
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {schema.bedrooms} bed {schema.property_type}
                        </p>
                        {schema.floor_plan_url && (
                          <a
                            href={schema.floor_plan_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-[#087F8C] mt-1.5 hover:underline"
                          >
                            <FileImage size={11} />
                            View floor plan
                          </a>
                        )}
                      </div>
                      <ArrowLeft size={14} className="text-[#CBD5E1] rotate-180 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <p className="text-sm text-red-500">
                Search error: {searchError}
              </p>
            )}

            {!isSearching && !searchError && query.trim() && results.length === 0 && (
              <p className="text-sm text-[#94A3B8]">
                No results for &ldquo;{query}&rdquo;.
              </p>
            )}

            {/* Don't see your house */}
            <div className="border border-[#E2E8F0] rounded-lg p-5">
              <p className="text-sm font-medium text-[#475569] mb-1">Don&apos;t see your house?</p>
              <p className="text-xs text-[#64748B] mb-4">
                We&apos;re building our database every day. Tell us yours and we&apos;ll prioritise getting it added.
              </p>
              <HouseRequestForm />
            </div>
          </div>
        )}

        {/* ── STATE 2: Rooms ── */}
        {appState === "rooms" && selectedSchema && (
          <div className="space-y-6">
            {/* Back + house label */}
            <div>
              <button
                onClick={goBackToSearch}
                className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4"
              >
                <ArrowLeft size={14} />
                Change house
              </button>
              <h1 className="text-xl font-semibold text-[#0F172A]">
                {selectedSchema.model_name}
                {selectedSchema.builders && (
                  <span className="text-[#64748B] font-normal"> by {selectedSchema.builders.name}</span>
                )}
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1">
                {selectedSchema.bedrooms} bed {selectedSchema.property_type}
              </p>
            </div>

            {/* Floor plan */}
            {selectedSchema.floor_plan_url && (
              <div>
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">Floor plan</p>
                <FloorPlanBlock url={selectedSchema.floor_plan_url} />
              </div>
            )}

            <p className="text-sm text-[#475569]">
              Select the room you want to work on.
            </p>

            {/* Loading */}
            {isLoadingRooms && (
              <p className="text-sm text-[#94A3B8]">Loading rooms...</p>
            )}

            {/* Error */}
            {roomsError && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">
                {roomsError}
              </div>
            )}

            {/* Rooms by floor */}
            {!isLoadingRooms && !roomsError && rooms.length > 0 && (
              <div className="space-y-6">
                {Object.entries(roomsByFloor)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([floor, floorRooms]) => (
                    <div key={floor}>
                      <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                        {FLOOR_LABELS[Number(floor)] ?? `Floor ${floor}`}
                      </h2>
                      <div className="space-y-2">
                        {floorRooms.map((room) => {
                          const Icon = roomIcon(room.room_type);
                          return (
                            <button
                              key={room.id}
                              onClick={() => selectRoom(room)}
                              className="w-full border border-[#E2E8F0] rounded-lg px-4 py-3.5 flex items-center gap-4 hover:border-[#10B981] hover:bg-[#F8FAFC] transition-colors text-left group"
                            >
                              <Icon size={18} className="text-[#10B981] flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#0F172A] group-hover:text-[#10B981] transition-colors">
                                  {room.room_name}
                                </p>
                                <p className="text-xs text-[#94A3B8] mt-0.5">
                                  {fmt(room.length_cm)}m × {fmt(room.width_cm)}m &middot; {area(room.length_cm, room.width_cm)} sqm
                                </p>
                              </div>
                              <ArrowLeft size={14} className="text-[#CBD5E1] rotate-180 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {!isLoadingRooms && !roomsError && rooms.length === 0 && (
              <div className="border border-[#E2E8F0] rounded-lg p-5 text-center">
                <p className="text-sm text-[#64748B]">
                  No room dimensions available for this house type yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STATE 3: Job selector ── */}
        {appState === "jobs" && selectedSchema && selectedRoom && (() => {
          const templates = getTemplatesForRoom(selectedRoom.room_type);
          return (
            <div className="space-y-6">
              {/* Back */}
              <button
                onClick={goBackToRooms}
                className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
              >
                <ArrowLeft size={14} />
                Back to rooms
              </button>

              {/* Compact summary */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-sm font-medium text-[#0F172A]">
                  {selectedRoom.room_name}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  {fmt(selectedRoom.length_cm)}m × {fmt(selectedRoom.width_cm)}m &middot; {area(selectedRoom.length_cm, selectedRoom.width_cm)} sqm
                </span>
                <span className="text-xs text-[#CBD5E1]">&middot;</span>
                <span className="text-xs text-[#94A3B8]">
                  {selectedSchema.model_name}
                  {selectedSchema.builders && ` by ${selectedSchema.builders.name}`}
                </span>
              </div>

              <h1 className="text-xl font-semibold text-[#0F172A]">What do you want to do?</h1>

              {templates.length > 0 ? (
                <div className="space-y-3">
                  {templates.map((template) => {
                    const Icon = ICON_MAP[template.icon] ?? Home;
                    return (
                      <button
                        key={template.job_id}
                        onClick={() => selectJob(template)}
                        className="w-full border border-[#E2E8F0] rounded-lg px-4 py-4 flex items-start gap-4 hover:border-[#10B981] hover:bg-[#F8FAFC] transition-colors text-left group"
                      >
                        <Icon size={20} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-medium text-[#0F172A] group-hover:text-[#10B981] transition-colors">
                              {template.job_name}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#059669] font-medium capitalize">
                              {template.difficulty}
                            </span>
                          </div>
                          <p className="text-xs text-[#94A3B8] flex items-center gap-1">
                            <Clock size={11} className="flex-shrink-0" />
                            {template.estimated_time}
                          </p>
                        </div>
                        <ArrowLeft size={14} className="text-[#CBD5E1] rotate-180 flex-shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-[#E2E8F0] rounded-lg p-5">
                  <p className="text-sm text-[#64748B]">
                    We don&apos;t have any project templates for this room type yet.
                  </p>
                </div>
              )}

              {/* Project request form */}
              <div className="border border-[#E2E8F0] rounded-lg p-5">
                <p className="text-sm font-medium text-[#475569] mb-1">Don&apos;t see your project?</p>
                <p className="text-xs text-[#64748B] mb-4">
                  Tell us what job you want to do and we&apos;ll build a template for it.
                </p>
                <ProjectRequestForm />
              </div>

              {/* Refittr teaser */}
              <div className="border border-[#E2E8F0] rounded-lg p-5 bg-[#F8FAFC]">
                <p className="text-sm text-[#475569] leading-relaxed mb-3">
                  Imagine getting a materials list and then being matched with second-hand fixtures guaranteed to fit your room. That&apos;s what&apos;s coming.
                </p>
                <a
                  href="https://refittr.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#10B981] hover:text-[#059669] transition-colors"
                >
                  Check out Refittr &rarr;
                </a>
              </div>
            </div>
          );
        })()}

        {/* ── STATE 4: Plan ── */}
        {appState === "plan" && selectedSchema && selectedRoom && selectedJob && (
          <PlanScreen
            schema={selectedSchema}
            room={selectedRoom}
            job={selectedJob}
            onBack={goBackToJobs}
            onSessionUpdate={handleSessionUpdate}
          />
        )}
      </div>

    </div>
  );
}
