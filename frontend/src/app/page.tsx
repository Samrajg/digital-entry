import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 font-sans select-none selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <main className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-10">
        
        {/* Brand Logo */}
        <div className="mb-2">
          <img
            src="/digilogo.png"
            alt="Digital Entry Logo"
            className="h-20 w-auto object-contain filter drop-shadow-md"
          />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-none">
            Digital Entry
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Secure, real-time visitor management and security scanning system designed for modern facilities.
          </p>
        </div>

        {/* Action Button (Dark Blue) */}
        <div className="pt-4">
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 active:scale-[0.98] transition-all"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </main>
    </div>
  );
}
