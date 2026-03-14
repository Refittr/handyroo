interface CrossLinkBannerProps {
  site: 'roomsize' | 'handyroo'
}

export default function CrossLinkBanner({ site }: CrossLinkBannerProps) {
  return (
    <section className="bg-[#ECFDF5] border-t border-[#10B981]/20">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {site === 'roomsize' ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-[#0F172A]" style={{ fontFamily: 'var(--font-sora)' }}>
                Need help planning a project?
              </p>
              <p className="text-sm text-[#475569] mt-0.5">
                Try HandyRoo - our AI materials calculator. Tell us what you want to do and we&apos;ll give you an exact materials list.
              </p>
            </div>
            <a
              href="https://handyroo.refittr.co.uk"
              className="flex-shrink-0 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Try HandyRoo →
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-semibold text-[#0F172A]" style={{ fontFamily: 'var(--font-sora)' }}>
                Need to check your room dimensions?
              </p>
              <p className="text-sm text-[#475569] mt-0.5">
                Try RoomSize - instant room measurements for your house type. No tape measure required.
              </p>
            </div>
            <a
              href="https://roomsize.refittr.co.uk"
              className="flex-shrink-0 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Try RoomSize →
            </a>
          </div>
        )}

        <div className="border-t border-[#10B981]/20" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-[#0F172A]" style={{ fontFamily: 'var(--font-sora)' }}>
              Refittr - the circular economy marketplace for home fixtures
            </p>
            <p className="text-sm text-[#475569] mt-0.5">
              Buy and sell second-hand kitchens, bathrooms, and more - with guaranteed compatibility for your house type.
            </p>
          </div>
          <a
            href="https://refittr.co.uk/#waitlist"
            className="flex-shrink-0 px-5 py-2.5 border-2 border-[#10B981] text-[#059669] hover:bg-[#10B981] hover:text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Join the Waitlist →
          </a>
        </div>
      </div>
    </section>
  )
}
