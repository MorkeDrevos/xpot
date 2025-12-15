// app/sign-up/[[...sign-up]]/page.tsx
'use client';

import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#05060a] text-slate-100">
      <div className="mx-auto w-full max-w-[520px] px-6 pt-16">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/hub"
        />
      </div>
    </div>
  );
}
