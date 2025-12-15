// app/sign-in/[[...sign-in]]/page.tsx
'use client';

import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#05060a] text-slate-100">
      <div className="mx-auto w-full max-w-[520px] px-6 pt-16">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/hub"
        />
      </div>
    </div>
  );
}
