import { UserButton, useUser } from "@clerk/nextjs";

export default function WorkflowPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to your Workflow</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          This is a protected page. Only authenticated users can see this content.
        </p>
        <div className="pt-6">
          <UserButton showName />
        </div>
      </div>
    </div>
  );
}
