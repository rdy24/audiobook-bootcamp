import Link from "next/link";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#69026d] to-[#15162c]">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 mb-16">
              {/* Logo/Brand */}
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                  Audiopintar
                </h1>
                <p className="mt-2 text-purple-200 text-lg">
                  Transform your documents into audio, intelligently
                </p>
              </div>

              {/* Auth Section */}
              {session ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-full pr-2 pl-4 py-2">
                    <span className="text-sm text-purple-200">
                      {session.user?.name}
                    </span>
                    <Link
                      href="/api/auth/signout"
                      className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 transition-all text-sm font-medium text-white"
                    >
                      Sign out
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="px-8 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 transition-all text-sm font-medium text-white"
                >
                  Sign in
                </Link>
              )}
            </div>

            {/* Documents Section */}
            {session && (
              <div className="mt-8 px-8 py-16 rounded-2xl bg-white/5 backdrop-blur-sm border border-purple-500/20">
                {/* Document list will be here */}
              </div>
            )}

            {/* Call to Action for Non-authenticated Users */}
            {!session && (
              <div className="text-center mt-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Get Started Today
                </h2>
                <p className="text-purple-200 mb-8 max-w-2xl mx-auto">
                  Sign in to start converting your PDF documents into high-quality audio files.
                </p>
                <Link
                  href="/api/auth/signin"
                  className="inline-flex items-center px-8 py-3 rounded-full bg-purple-600 hover:bg-purple-700 transition-colors text-white font-medium group"
                >
                  Start Converting
                  <svg
                    className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
