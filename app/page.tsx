import Image from "next/image";
import SignOutButton from "@/components/auth/SignOutButton";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-4xl flex-col justify-between gap-16 bg-white px-6 py-12 sm:px-16">
        <header className="flex w-full items-center justify-between gap-4">
          <Image
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <SignOutButton />
        </header>

        <section className="flex flex-col items-start gap-6 text-left">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-zinc-950">
            Ship faster with a minimal workspace crafted for modern product
            teams.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600">
            You are authenticated. Explore deployments, manage access, and keep
            your projects moving with a clean, focused interface. Ready to roll
            out the next big update?
          </p>
        </section>

        <footer className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] md:w-[180px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] md:w-[180px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </footer>
      </main>
    </div>
  );
}
