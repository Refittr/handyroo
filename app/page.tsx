"use client";

import { useState } from "react";
import { Home, MessageSquare, ClipboardList } from "lucide-react";

type Tab = "house" | "project";

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>("house");

  // House request form
  const [houseBuilder, setHouseBuilder] = useState("");
  const [houseType, setHouseType] = useState("");
  const [houseEmail, setHouseEmail] = useState("");
  const [houseSubmitted, setHouseSubmitted] = useState(false);

  // Project request form
  const [projectDescription, setProjectDescription] = useState("");
  const [projectEmail, setProjectEmail] = useState("");
  const [projectSubmitted, setProjectSubmitted] = useState(false);

  function handleHouseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHouseSubmitted(true);
  }

  function handleProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProjectSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[600px] mx-auto px-6 py-12">

        {/* Header */}
        <header className="mb-16">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">Handyroo</span>
            <span className="text-sm text-slate-500">by Refittr</span>
          </div>
        </header>

        {/* Hero */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-sm text-slate-600 font-medium">Coming summer 2026</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 leading-snug mb-4">
            Your room. Your project. Your materials list.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Tell us what you want to do, and we&apos;ll tell you exactly what you need. We already know your room dimensions — no tape measure required.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">How it works</h2>
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-5 flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <Home size={20} className="text-[#087F8C]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">Select your house</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pick your house type from our verified database of UK new builds. We know every room dimension.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-5 flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <MessageSquare size={20} className="text-[#087F8C]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">Tell us the project</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  &ldquo;I want to lay laminate in bedroom 2&rdquo; — that&apos;s all we need. We&apos;ll ask a few smart questions to nail down the details.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-5 flex gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <ClipboardList size={20} className="text-[#087F8C]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">Get your list</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Materials, quantities, tools, and a step-by-step plan. Calculated from your actual room dimensions, not guesswork.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Request forms */}
        <section className="mb-16">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">Get early access</h2>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab("house")}
              className={`pb-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "house"
                  ? "border-[#087F8C] text-[#087F8C]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Request your house
            </button>
            <button
              onClick={() => setActiveTab("project")}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "project"
                  ? "border-[#087F8C] text-[#087F8C]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Request a project
            </button>
          </div>

          {/* House tab */}
          {activeTab === "house" && (
            <div>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                We&apos;re building our database of UK house types every day. Tell us yours and we&apos;ll prioritise getting it added.
              </p>
              {houseSubmitted ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-800">
                  Thanks! We&apos;ll get your house type added and let you know.
                </div>
              ) : (
                <form onSubmit={handleHouseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Builder name</label>
                    <input
                      type="text"
                      value={houseBuilder}
                      onChange={(e) => setHouseBuilder(e.target.value)}
                      placeholder="e.g. Barratt Homes"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">House type</label>
                    <input
                      type="text"
                      value={houseType}
                      onChange={(e) => setHouseType(e.target.value)}
                      placeholder="e.g. The Marford, 3 bed semi-detached"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your email</label>
                    <input
                      type="email"
                      value={houseEmail}
                      onChange={(e) => setHouseEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#087F8C] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#076e79] transition-colors focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:ring-offset-2"
                  >
                    Request this house
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Project tab */}
          {activeTab === "project" && (
            <div>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                Got a DIY project in mind that you&apos;d like us to support? Tell us what job you want to do and we&apos;ll build a template for it.
              </p>
              {projectSubmitted ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4 text-sm text-green-800">
                  Nice one! We&apos;ll build that template and let you know when it&apos;s ready.
                </div>
              ) : (
                <form onSubmit={handleProjectSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project description</label>
                    <input
                      type="text"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="e.g. Lay engineered wood flooring in a bedroom"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your email</label>
                    <input
                      type="email"
                      value={projectEmail}
                      onChange={(e) => setProjectEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#087F8C] text-white text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-[#076e79] transition-colors focus:outline-none focus:ring-2 focus:ring-[#087F8C] focus:ring-offset-2"
                  >
                    Request this project
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* Refittr teaser */}
        <section className="mb-16">
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
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-100 pt-6">
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
            — Built in Liverpool.
          </p>
        </footer>

      </div>
    </div>
  );
}
