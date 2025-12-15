// app/sign-out/[[...sign-out]]/page.tsx
'use client';

import { SignOut } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#05060a] text-slate-100">
      <div className="mx-auto w-full max-w-[520px] px-6 pt-16">
        <SignOut routing="path" path="/sign-out" redirectUrl="/" />
      </div>
    </div>
  );
}
