import Link from "next/link";

export function LearnMoreSection() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Unlock your learning potential.
          </h2>
          <p className="mt-4 text-base text-gray-500">
            Start learning today and unlock your full potential.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/wallets"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
} 