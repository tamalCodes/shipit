import AuthFlow from "@/components/auth/AuthFlow";

type AuthPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function AuthPage({ searchParams }: AuthPageProps) {
  const redirectParam = searchParams?.redirectTo;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/")
      ? redirectParam
      : undefined;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-zinc-200 px-6 py-12 sm:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center">
        <AuthFlow redirectTo={redirectTo} />
      </div>
    </div>
  );
}
