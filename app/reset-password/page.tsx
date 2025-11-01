import ResetPasswordFlow from "@/components/auth/ResetPasswordFlow";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const resolvedParams = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16">
      <ResetPasswordFlow
        initialEmail={resolvedParams.email}
        token={resolvedParams.token}
      />
    </main>
  );
}
