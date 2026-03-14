import { Instagram, Mail } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="bg-[#0F172A] text-[#94A3B8]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[#10B981] rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs" style={{ fontFamily: 'var(--font-sora)' }}>R</span>
              </div>
              <span className="text-white font-bold" style={{ fontFamily: 'var(--font-sora)' }}>Refittr</span>
            </div>
            <p className="text-sm">Built the same. Fits the same.</p>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-sora)' }}>Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://roomsize.refittr.co.uk" className="hover:text-[#10B981] transition-colors">RoomSize</a></li>
              <li><a href="https://handyroo.refittr.co.uk" className="hover:text-[#10B981] transition-colors">HandyRoo</a></li>
              <li><a href="https://refittr.co.uk/privacy" className="hover:text-[#10B981] transition-colors">Privacy</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-sora)' }}>Connect</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://www.instagram.com/refittr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#10B981] transition-colors">
                  <Instagram className="w-4 h-4" /> @refittr
                </a>
              </li>
              <li>
                <a href="mailto:admin@refittr.co.uk" className="flex items-center gap-2 hover:text-[#10B981] transition-colors">
                  <Mail className="w-4 h-4" /> admin@refittr.co.uk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          © 2026 Refittr. Built in Liverpool.
        </div>
      </div>
    </footer>
  )
}
