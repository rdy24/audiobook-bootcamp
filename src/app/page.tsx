import Link from "next/link";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#69026d] to-[#15162c]">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-16 flex flex-col items-center justify-between space-y-8 md:flex-row md:space-y-0">
              {/* Logo/Brand */}
              <div className="text-center md:text-left">
                <h1 className="bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-4xl font-extrabold text-transparent text-white md:text-6xl">
                  Audiopintar
                </h1>
                <p className="mt-2 text-lg text-purple-200">
                  Transform your documents into audio, intelligently
                </p>
              </div>

              {/* Auth Section */}
              {session ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 rounded-full bg-white/5 py-2 pl-4 pr-2 transition-colors hover:bg-white/10">
                    <span className="text-sm text-purple-200">
                      {session.user?.name}
                    </span>
                    <Link
                      href="/api/auth/signout"
                      className="rounded-full bg-purple-600 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-purple-700"
                    >
                      Sign out
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/api/auth/signin"
                  className="rounded-full bg-purple-600 px-8 py-2.5 text-sm font-medium text-white transition-all hover:bg-purple-700"
                >
                  Sign in
                </Link>
              )}
            </div>

            {/* Documents Section */}
            {session && (
              <div className="mt-8 rounded-2xl border border-purple-500/20 bg-white/5 px-8 py-16 backdrop-blur-sm">
                {/* Document list will be here */}
                <img
                  src={session?.user.image ?? ""}
                  alt={session?.user.name ?? "User"}
                />
                <pre className="text-white">
                  <code>{JSON.stringify(session?.user, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Call to Action for Non-authenticated Users */}
            {!session && (
              <div className="mt-16 text-center">
                <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
                  Get Started Today
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-purple-200">
                  Sign in to start converting your PDF documents into
                  high-quality audio files.
                </p>
                <Link
                  href="/api/auth/signin"
                  className="group inline-flex items-center rounded-full bg-purple-600 px-8 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                >
                  Start Converting
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
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
