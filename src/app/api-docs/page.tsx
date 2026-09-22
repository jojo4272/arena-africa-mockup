import Link from "next/link";
import { ArrowLeft, Code, CreditCard, Database, Mail, MapPin, ShieldCheck, Smartphone, Sparkles, Globe, Wallet, Users, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ApiDocsPage() {
  const endpoints = [
    {
      category: "Markets",
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      routes: [
        { method: "GET", path: "/api/markets", desc: "List all markets (filter: locale, category, status, featured)" },
        { method: "POST", path: "/api/markets", desc: "Create a new prediction market" },
        { method: "GET", path: "/api/markets/[id]", desc: "Get single market details" },
        { method: "PATCH", path: "/api/markets/[id]", desc: "Resolve market (triggers automatic payouts)" },
      ],
    },
    {
      category: "Users",
      icon: <Code className="w-5 h-5 text-indigo-400" />,
      routes: [
        { method: "GET", path: "/api/users", desc: "List all users" },
        { method: "POST", path: "/api/users", desc: "Create a new user" },
        { method: "GET", path: "/api/users/[id]", desc: "Get user by ID" },
      ],
    },
    {
      category: "Predictions",
      icon: <Smartphone className="w-5 h-5 text-amber-400" />,
      routes: [
        { method: "GET", path: "/api/predictions", desc: "List predictions (filter: userId)" },
        { method: "POST", path: "/api/predictions", desc: "Place a new prediction" },
      ],
    },
    {
      category: "Wallet",
      icon: <Wallet className="w-5 h-5 text-rose-400" />,
      routes: [
        { method: "POST", path: "/api/wallet/deposit", desc: "Simulate mobile money deposit" },
        { method: "POST", path: "/api/wallet/withdraw", desc: "Simulate mobile money withdrawal" },
        { method: "GET", path: "/api/wallet/transactions", desc: "List transactions (filter: userId)" },
      ],
    },
    {
      category: "Card Payments",
      icon: <CreditCard className="w-5 h-5 text-indigo-400" />,
      routes: [
        { method: "POST", path: "/api/cards/pay", desc: "Visa / Mastercard / Discover deposit — BIN detect, Luhn check, tokenization, 3-D Secure simulation" },
      ],
    },
    {
      category: "Early Access",
      icon: <Mail className="w-5 h-5 text-teal-400" />,
      routes: [
        { method: "POST", path: "/api/early-access", desc: "Join the country-by-country rollout waitlist" },
      ],
    },
    {
      category: "Identity & Automation",
      icon: <MapPin className="w-5 h-5 text-emerald-400" />,
      routes: [
        { method: "GET", path: "/api/geo", desc: "Detect country from IP/edge headers → currency, locale, dial code, welcome bonus" },
        { method: "POST", path: "/api/auth/register", desc: "Automated geo-aware registration — currency applied, session issued" },
        { method: "POST", path: "/api/auth/login", desc: "Phone or userId sign-in; sets httpOnly session cookie" },
      ],
    },
    {
      category: "Policy & Roles",
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      routes: [
        { method: "GET", path: "/api/policy/evaluate", desc: "Introspect roles, capability matrix, rules and KYC limits" },
        { method: "POST", path: "/api/policy/evaluate", desc: "Dry-run a decision — returns ALLOW/DENY/REVIEW with reason codes" },
      ],
    },
    {
      category: "AI (Gemini)",
      icon: <Sparkles className="w-5 h-5 text-violet-400" />,
      routes: [
        { method: "POST", path: "/api/ai/draft-market", desc: "Draft a resolvable market from an idea, then AI-moderate it" },
        { method: "GET", path: "/api/ai/insight", desc: "Neutral YES/NO briefing for a market (?marketId=)" },
        { method: "POST", path: "/api/ai/resolve-assist", desc: "Resolver-only settlement recommendation from evidence" },
      ],
    },
    {
      category: "Chamas",
      icon: <Users className="w-5 h-5 text-purple-400" />,
      routes: [
        { method: "GET", path: "/api/chamas", desc: "List all Chama pools" },
        { method: "POST", path: "/api/chamas", desc: "Create a new Chama" },
        { method: "POST", path: "/api/chamas/join", desc: "Join existing Chama by code" },
      ],
    },
    {
      category: "USSD Gateway",
      icon: <MessageSquare className="w-5 h-5 text-teal-400" />,
      routes: [
        { method: "POST", path: "/api/ussd", desc: "USSD gateway endpoint (Africa's Talking compatible)" },
      ],
    },
    {
      category: "Internationalization",
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      routes: [
        { method: "GET", path: "/api/i18n/[locale]", desc: "Get translations (en, sw, fr, pt)" },
      ],
    },
    {
      category: "Health",
      icon: <Code className="w-5 h-5 text-slate-400" />,
      routes: [
        { method: "GET", path: "/api/health", desc: "Health check endpoint" },
      ],
    },
  ];

  const methodColors: { [key: string]: string } = {
    GET: "bg-emerald-500 text-slate-950",
    POST: "bg-amber-500 text-slate-950",
    PATCH: "bg-indigo-500 text-white",
    PUT: "bg-rose-500 text-white",
    DELETE: "bg-slate-500 text-white dark:bg-slate-700",
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 text-sm mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-10">
          <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black tracking-widest uppercase px-3 py-1 rounded-md mb-3 inline-block">
            API Reference
          </span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Arena Africa REST API</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Full API-first architecture with PostgreSQL + Drizzle ORM backend.
            Supports mobile money, USSD, multi-language, and communal Chama pools.
          </p>
        </div>

        {/* Base URL */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-5 mb-8">
          <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Base URL</h3>
          <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
            {process.env.NEXT_PUBLIC_APP_URL || "https://your-app-url.com"}
          </code>
          <p className="text-xs text-slate-500 mt-2">
            All endpoints accept <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">application/json</code> Content-Type.
            Response format: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">&#123; &quot;success&quot;: boolean, &quot;data&quot;: any, &quot;error&quot;: string &#125;</code>
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Link href="/dashboard" className="bg-white border border-slate-200 hover:border-emerald-500/50 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-4 transition-all">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Web Dashboard</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Full desktop experience</p>
          </Link>
          <Link href="/mobile" className="bg-white border border-slate-200 hover:border-indigo-500/50 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-4 transition-all">
            <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Mobile App</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PWA mobile experience</p>
          </Link>
          <Link href="/api/markets" className="bg-white border border-slate-200 hover:border-amber-500/50 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-4 transition-all">
            <Code className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Live API</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Test /api/markets</p>
          </Link>
          <Link href="/api/i18n/en" className="bg-white border border-slate-200 hover:border-blue-500/50 dark:bg-slate-900 dark:border-slate-800 rounded-2xl p-4 transition-all">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">i18n API</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Translations (en/sw/fr/pt)</p>
          </Link>
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          {endpoints.map((section) => (
            <div key={section.category} className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                {section.icon}
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.routes.map((route) => (
                  <div key={route.path + route.method} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 dark:bg-slate-950 dark:border-slate-850 dark:hover:border-slate-700 transition-all">
                    <span className={`${methodColors[route.method]} text-[10px] font-black px-2 py-1 rounded min-w-[52px] text-center`}>
                      {route.method}
                    </span>
                    <div className="flex-1">
                      {route.path.includes("[") ? (
                        <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 block">
                          {route.path}
                        </span>
                      ) : (
                        <Link
                          href={route.path}
                          className="font-mono text-xs text-emerald-600 dark:text-emerald-400 hover:underline block"
                        >
                          {route.path}
                        </Link>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{route.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sample request */}
        <div className="bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-3xl p-6 mt-8">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">Sample Request: Place a Prediction</h3>
          <pre className="bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-inherit text-xs p-4 rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-800">
{`POST /api/predictions
Content-Type: application/json

{
  "userId": 1,
  "marketId": 5,
  "outcome": "YES",
  "amount": 1000,
  "currency": "KES",
  "platform": "MOBILE"
}

Response:
{
  "success": true,
  "data": {
    "id": 42,
    "marketId": 5,
    "userId": 1,
    "outcome": "YES",
    "amount": 1000,
    "potentialPayout": 1850,
    "currency": "KES",
    "platform": "MOBILE"
  },
  "newBalance": 3500,
  "potentialPayout": 1850
}`}
          </pre>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500">
            Arena Africa API v1.0 · Built with Next.js, Drizzle ORM, PostgreSQL
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
            Languages: English · Swahili · French · Portuguese
          </p>
        </div>
      </div>
    </div>
  );
}
