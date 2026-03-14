'use client'

import { useState } from 'react'
import { Instagram, Menu, X } from 'lucide-react'

interface SiteNavProps {
  activeSite: 'main' | 'roomsize' | 'handyroo'
}

export default function SiteNav({ activeSite }: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = (site: string) =>
    `px-3 py-2 text-sm font-medium transition-colors ${
      activeSite === site
        ? 'text-[#10B981] border-b-2 border-[#10B981]'
        : 'text-[#475569] hover:text-[#0F172A]'
    }`

  const mobileLinkClass = (site: string) =>
    `block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeSite === site
        ? 'text-[#10B981] bg-[#ECFDF5]'
        : 'text-[#475569] hover:bg-[#F8FAFC]'
    }`

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="https://refittr.co.uk" className="flex items-center gap-2">
          <img src="/refittr-app-icon-512.png" alt="Refittr" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-[#0F172A] text-lg" style={{ fontFamily: 'var(--font-sora)' }}>Refittr</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          <a href="https://roomsize.refittr.co.uk" className={linkClass('roomsize')}>RoomSize</a>
          <a href="https://handyroo.refittr.co.uk" className={linkClass('handyroo')}>HandyRoo</a>
          <a
            href="https://www.instagram.com/refittr"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#475569] hover:text-[#0F172A] transition-colors"
            aria-label="Follow us on Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="https://refittr.co.uk/#waitlist"
            className="ml-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Join Waitlist
          </a>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-[#475569]"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 py-3 space-y-1">
          <a href="https://roomsize.refittr.co.uk" className={mobileLinkClass('roomsize')}>RoomSize</a>
          <a href="https://handyroo.refittr.co.uk" className={mobileLinkClass('handyroo')}>HandyRoo</a>
          <a
            href="https://www.instagram.com/refittr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] rounded-lg"
          >
            <Instagram className="w-4 h-4" /> Instagram
          </a>
          <a
            href="https://refittr.co.uk/#waitlist"
            className="block px-3 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg text-center transition-colors"
          >
            Join Waitlist
          </a>
        </div>
      )}
    </header>
  )
}
