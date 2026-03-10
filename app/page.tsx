import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { FeatureCard } from "@/components/landing/FeatureCard";

const CDN = "https://pdxuzstqqrliidgsfblc.supabase.co/storage/v1/object/public/assets";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/boards");

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#faf9f7]/80 backdrop-blur-lg border-b border-sage-100/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <span className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-sage-600/20">
              B
            </span>
            <span className="text-lg font-bold tracking-tight text-zinc-900">
              Bolyst
            </span>
          </a>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2 text-sm font-semibold bg-sage-600 text-white rounded-xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-md shadow-sage-600/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero tagline */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-sage-600 mb-8">
            Collaborative apartment search
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-zinc-900 leading-[1.08]">
            Find your place,
            <br />
            <span className="text-sage-600">together.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Stop losing apartment links in group chats. Bolyst gives you and your
            roommates a shared board to save, compare, and decide on your next
            home.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="px-8 py-3.5 text-sm font-semibold bg-sage-600 text-white rounded-2xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-lg shadow-sage-600/25"
            >
              Start your board, it&apos;s free
            </Link>
          </div>
        </div>
      </section>

      {/* Hero video */}
      <section className="pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-sage-200/60 shadow-2xl shadow-sage-900/5 overflow-hidden bg-white">
            <HeroVideo
              src={`${CDN}/videos/hero.mp4`}
              poster={`${CDN}/images/hero-screenshot.png`}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
              Everything you need to decide,{" "}
              <span className="text-sage-600">together</span>
            </h2>
            <p className="mt-4 text-base text-zinc-500 max-w-xl mx-auto">
              No more scattered links, lost screenshots, or &quot;which one was
              that again?&quot; moments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Share with your people"
              description="Invite roommates or your partner by email. Everyone can add listings, comment, tag, and favorite. All in one place."
              videoSrc={`${CDN}/videos/feature-share.mp4`}
              videoPoster={`${CDN}/images/feature-share.png`}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-sage-600">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              }
            />
            <FeatureCard
              title="Map view"
              description="See every listing on a map with pins for work, uni, or anywhere that matters. Distance calculated automatically."
              videoSrc={`${CDN}/videos/feature-map.mp4`}
              videoPoster={`${CDN}/images/feature-map.png`}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-sage-600">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
              }
            />
            <FeatureCard
              title="Compare side by side"
              description="Select any listings and compare price, size, price per m², location, and tags in a clean table. Sort by any column."
              videoSrc={`${CDN}/videos/feature-compare.mp4`}
              videoPoster={`${CDN}/images/feature-compare.png`}
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-sage-600">
                  <rect x="2" y="4" width="7" height="16" rx="1.5" />
                  <rect x="15" y="4" width="7" height="16" rx="1.5" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-sage-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
              Up and running in under a minute
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
                1
              </div>
              <h3 className="text-[15px] font-bold text-zinc-900 mb-2">
                Create a board
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Give it a name like &quot;Berlin Q2&quot; or &quot;Stockholm
                summer&quot; and invite your co-searchers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
                2
              </div>
              <h3 className="text-[15px] font-bold text-zinc-900 mb-2">
                Paste a link
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Drop in a listing URL and Bolyst extracts the title, price,
                images, and location automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-sage-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-5 shadow-md shadow-sage-600/20">
                3
              </div>
              <h3 className="text-[15px] font-bold text-zinc-900 mb-2">
                Compare & decide
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Tag, comment, favorite, and compare listings until you find
                the one. <span className="text-sage-600 font-semibold">Together.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Extra details */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-zinc-100 p-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-3">
                Paste any listing URL
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                Works with any apartment site. Finn.no, Immobilienscout, Hemnet,
                Funda, you name it. We extract what we can and you fill in
                the rest.
              </p>
              <div className="flex items-center gap-2 text-xs text-sage-600 font-medium">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
                Title, price, images, and location auto-extracted
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-3">
                Reference points on the map
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                Pin your work, university, gym, or favorite coffee shop. Every
                listing shows the distance to your closest pin.
              </p>
              <div className="flex items-center gap-2 text-xs text-sage-600 font-medium">
                <span className="text-base">★</span>
                Distance to nearest pin on every card
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-3">
                Track your progress
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                Move listings through stages: New, Viewing, Applied, Accepted, or
                Rejected. Know exactly where each apartment stands at a glance.
              </p>
              <div className="flex flex-wrap gap-2">
                {["New", "Viewing", "Applied", "Accepted"].map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-sage-50 text-sage-700 border border-sage-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-3">
                Tags & favorites
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                Create custom tags per board like &quot;balcony&quot;,
                &quot;pet-friendly&quot;, or &quot;close to metro&quot; and
                filter or sort by them. Heart your favorites and see who else
                liked what.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Balcony", "Pet-friendly", "Near metro"].map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-sage-50 text-sage-700 border border-sage-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-sage-50/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
            Your next home is out there.
            <br />
            Find it,{" "}
            <span className="text-sage-600">together.</span>
          </h2>
          <p className="mt-5 text-base text-zinc-500">
            Free to use. Create a board in seconds. Invite whoever you&apos;re
            searching with.
          </p>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="inline-flex px-8 py-3.5 text-sm font-semibold bg-sage-600 text-white rounded-2xl hover:bg-sage-700 active:scale-[0.98] transition-all shadow-lg shadow-sage-600/25"
            >
              Get started for free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <a href="#" className="flex items-center gap-2.5 mb-4">
                <span className="w-7 h-7 bg-sage-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  B
                </span>
                <span className="text-base font-bold text-zinc-900">
                  Bolyst
                </span>
              </a>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The shared workspace for apartment hunting.
                Save listings, compare options, and decide,{" "}
                <span className="text-sage-600 font-medium">together</span>.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/sign-up" className="text-sm text-zinc-600 hover:text-sage-600 transition-colors">
                    Get started
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-sm text-zinc-600 hover:text-sage-600 transition-colors">
                    Features
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:hello@bolyst.com" className="text-sm text-zinc-600 hover:text-sage-600 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Bolyst
            </p>
            <p className="text-xs text-zinc-400">
              Find your place, <span className="text-sage-500">together</span>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
