import Link from 'next/link';
import { Shield, Lock, Zap, Server } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative isolate min-h-screen">
      {/* Background decoration */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-24 pb-32 sm:pt-32 lg:flex lg:items-center lg:gap-x-10 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
          <div className="flex">
            <div className="relative flex items-center gap-x-4 rounded-full px-4 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20">
              <span className="font-semibold text-primary-600">New updates</span>
              <span className="h-4 w-px bg-slate-900/10" aria-hidden="true"></span>
              <a href="#" className="flex items-center gap-x-1">
                Auth System v2.0
              </a>
            </div>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Secure Authentication <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
              Made Simple.
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            A production-ready authentication system featuring JWT, Refresh Tokens, Redis-backed rate limiting, and enterprise-grade security.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link
              href="/login"
              className="rounded-xl bg-primary-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-500 transition-all hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Get Started
            </Link>
            <Link href="/register" className="text-sm font-semibold leading-6 text-slate-900 hover:text-primary-600 transition-colors">
              Create an account <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow">
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard icon={<Shield className="w-6 h-6 text-primary-600" />} title="JWT Ready" desc="Secure stateless auth using JSON Web Tokens." />
            <FeatureCard icon={<Lock className="w-6 h-6 text-indigo-600" />} title="IP Whitelist" desc="Restrict access to authorized IP addresses." />
            <FeatureCard icon={<Zap className="w-6 h-6 text-amber-500" />} title="Rate Limited" desc="Prevent brute-force attacks automatically." />
            <FeatureCard icon={<Server className="w-6 h-6 text-emerald-600" />} title="Redis Backed" desc="High performance session and blacklist storage." />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card !p-6 flex flex-col gap-y-4 hover:border-primary-500/30 transition-colors group">
      <div className="rounded-lg bg-white p-2 w-fit shadow-sm ring-1 ring-slate-900/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

