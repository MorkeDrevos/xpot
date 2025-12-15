// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
