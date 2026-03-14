"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { supabase, type HouseSchema, type Room } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

type AppState = "search" | "rooms" | "project";

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

// ── House request form (client-side only) ────────────────────────────────────

function HouseRequestForm() {
  const [builder, setBuilder] = useState("");
  const [houseType, setHouseType] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-800">
        Thanks! We&apos;ll get your house type added and let you know.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Builder name</label>
        <input
          type="text"
          value={builder}
          onChange={(e) => setBuilder(e.target.value)}
          placeholder="e.g. Barratt Homes"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">House type</label>
        <input
          type="text"
          value={houseType}
          onChange={(e) => setHouseType(e.target.value)}
          placeholder="e.g. The Marford, 3 bed semi-detached"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Your email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-[#087F8C] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#076e79] transition-colors"
      >
        Request this house
      </button>
    </form>
  );
}

// ── Project request form (client-side only) ──────────────────────────────────

function ProjectRequestForm() {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-800">
        Nice one! We&apos;ll build that template and let you know when it&apos;s ready.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Project description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Lay engineered wood flooring in a bedroom"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Your email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-[#087F8C] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#076e79] transition-colors"
      >
        Request this project
      </button>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [appState, setAppState] = useState<AppState>("search");
  const [selectedSchema, setSelectedSchema] = useState<HouseSchema | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HouseSchema[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      try {
        const q = query.trim();

        // 1. Find builder IDs matching the query
        const { data: builderData } = await supabase
          .from("builders")
          .select("id")
          .ilike("name", `%${q}%`);
        const builderIds = (builderData || []).map((b: any) => b.id);

        // 2. Query schemas matching model_name OR matching builder IDs
        let schemaQuery = supabase
          .from("house_schemas")
          .select("id, builder_id, model_name, bedrooms, property_type, builders(id, name)")
          .limit(10);

        if (builderIds.length > 0) {
          schemaQuery = schemaQuery.or(
            `model_name.ilike.%${q}%,builder_id.in.(${builderIds.join(",")})`
          );
        } else {
          schemaQuery = schemaQuery.ilike("model_name", `%${q}%`);
        }

        const { data, error } = await schemaQuery;
        if (error) throw error;

        // Normalise builders (Supabase returns array from join)
        const normalised = (data || []).map((s: any) => ({
          ...s,
          builders: Array.isArray(s.builders) ? s.builders[0] ?? undefined : s.builders,
        })) as HouseSchema[];
        setResults(normalised);
      } catch {
        setResults([]);
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
    setAppState("project");
  };

  const goBackToSearch = () => {
    setAppState("search");
    setSelectedSchema(null);
    setSelectedRoom(null);
    setRooms([]);
  };

  const goBackToRooms = () => {
    setAppState("rooms");
    setSelectedRoom(null);
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

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-baseline gap-2">
            <button
              onClick={goBackToSearch}
              className="text-2xl font-semibold tracking-tight text-slate-900 hover:text-[#087F8C] transition-colors"
            >
              Handyroo
            </button>
            <span className="text-sm text-slate-500">by Refittr</span>
          </div>
        </header>

        {/* ── STATE 1: Search ── */}
        {appState === "search" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                What&apos;s your house type?
              </h1>
              <p className="text-slate-500 text-sm">
                We know the dimensions of thousands of UK homes.
              </p>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by house type or builder (e.g. The Alderney by Barratt)"
                autoFocus
                className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
              />
            </div>

            {/* Results */}
            {isSearching && (
              <p className="text-sm text-slate-400">Searching...</p>
            )}

            {!isSearching && results.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                {results.map((schema) => (
                  <button
                    key={schema.id}
                    onClick={() => selectSchema(schema)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {schema.model_name}
                        {schema.builders && (
                          <span className="text-slate-500 font-normal"> by {schema.builders.name}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {schema.bedrooms} bed {schema.property_type}
                      </p>
                    </div>
                    <ArrowLeft size={14} className="text-slate-300 rotate-180 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {!isSearching && query.trim() && results.length === 0 && (
              <p className="text-sm text-slate-400">
                No results for &ldquo;{query}&rdquo;.
              </p>
            )}

            {/* Don't see your house */}
            <div className="border border-slate-200 rounded-lg p-5">
              <p className="text-sm font-medium text-slate-700 mb-1">Don&apos;t see your house?</p>
              <p className="text-xs text-slate-500 mb-4">
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
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
              >
                <ArrowLeft size={14} />
                Change house
              </button>
              <h1 className="text-xl font-semibold text-slate-900">
                {selectedSchema.model_name}
                {selectedSchema.builders && (
                  <span className="text-slate-500 font-normal"> by {selectedSchema.builders.name}</span>
                )}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {selectedSchema.bedrooms} bed {selectedSchema.property_type}
              </p>
            </div>

            <p className="text-sm text-slate-600">
              Select the room you want to work on.
            </p>

            {/* Loading */}
            {isLoadingRooms && (
              <p className="text-sm text-slate-400">Loading rooms...</p>
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
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                        {FLOOR_LABELS[Number(floor)] ?? `Floor ${floor}`}
                      </h2>
                      <div className="space-y-2">
                        {floorRooms.map((room) => {
                          const Icon = roomIcon(room.room_type);
                          return (
                            <button
                              key={room.id}
                              onClick={() => selectRoom(room)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-3.5 flex items-center gap-4 hover:border-[#087F8C] hover:bg-slate-50 transition-colors text-left group"
                            >
                              <Icon size={18} className="text-[#087F8C] flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 group-hover:text-[#087F8C] transition-colors">
                                  {room.room_name}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {fmt(room.length_cm)}m × {fmt(room.width_cm)}m &middot; {area(room.length_cm, room.width_cm)} sqm
                                </p>
                              </div>
                              <ArrowLeft size={14} className="text-slate-300 rotate-180 flex-shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {!isLoadingRooms && !roomsError && rooms.length === 0 && (
              <div className="border border-slate-200 rounded-lg p-5 text-center">
                <p className="text-sm text-slate-500">
                  No room dimensions available for this house type yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STATE 3: Project placeholder ── */}
        {appState === "project" && selectedSchema && selectedRoom && (
          <div className="space-y-6">
            {/* Back */}
            <button
              onClick={goBackToRooms}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to rooms
            </button>

            {/* Selected house + room */}
            <div className="border border-slate-200 rounded-lg p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-3">Your selection</p>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400 w-12 flex-shrink-0">House</span>
                  <span className="text-sm text-slate-900">
                    {selectedSchema.model_name}
                    {selectedSchema.builders && (
                      <span className="text-slate-500"> by {selectedSchema.builders.name}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400 w-12 flex-shrink-0">Room</span>
                  <span className="text-sm text-slate-900">{selectedRoom.room_name}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400 w-12 flex-shrink-0">Size</span>
                  <span className="text-sm text-slate-700">
                    {fmt(selectedRoom.length_cm)}m × {fmt(selectedRoom.width_cm)}m &middot; {area(selectedRoom.length_cm, selectedRoom.width_cm)} sqm
                  </span>
                </div>
              </div>
            </div>

            {/* Coming soon */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
              <p className="text-sm font-medium text-slate-700 mb-1">Job selection coming soon</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                We&apos;re building this right now. Once it&apos;s live, you&apos;ll tell us what you want to do and we&apos;ll give you an exact materials list from your actual room dimensions.
              </p>
            </div>

            {/* Project request form */}
            <div className="border border-slate-200 rounded-lg p-5">
              <p className="text-sm font-medium text-slate-700 mb-1">Don&apos;t see your project?</p>
              <p className="text-xs text-slate-500 mb-4">
                Tell us what job you want to do and we&apos;ll build a template for it.
              </p>
              <ProjectRequestForm />
            </div>

            {/* Refittr teaser */}
            <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                Imagine getting a materials list and then being matched with second-hand fixtures guaranteed to fit your room. That&apos;s what&apos;s coming.
              </p>
              <a
                href="https://refittr.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#087F8C] hover:underline"
              >
                Check out Refittr &rarr;
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-[600px] mx-auto px-6 pb-10 w-full">
        <div className="border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-400">
            Handyroo by{" "}
            <a
              href="https://refittr.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-700 underline underline-offset-2"
            >
              Refittr
            </a>{" "}
            - Built in Liverpool.
          </p>
        </div>
      </footer>
    </div>
  );
}
