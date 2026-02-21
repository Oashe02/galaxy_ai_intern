import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center justify-between py-24 px-12 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm sm:items-start">
        <Image
          className="dark:invert mb-12"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left mb-12">
          <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            NextFlow with Clerk Authentication
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Experience a seamless authentication flow with Clerk and Next.js. 
            Secure your routes and manage users with ease.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <SignedIn>
            <Link
              href="/workflow"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 md:w-auto"
            >
              Go to Workflow
            </Link>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-8 text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 md:w-auto cursor-pointer">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-zinc-200 px-8 transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:border-zinc-100 md:w-auto"
            href="https://clerk.com/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Clerk Docs
          </a>
        </div>
      </main>
    </div>
  );
}
