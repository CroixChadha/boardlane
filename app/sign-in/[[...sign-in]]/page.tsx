import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

// Clerk's form reads the current URL, which Next.js only allows inside a
// Suspense boundary on a page that is otherwise prerendered.
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] p-4">
      <Suspense fallback={null}>
        <SignIn />
      </Suspense>
    </div>
  );
}
