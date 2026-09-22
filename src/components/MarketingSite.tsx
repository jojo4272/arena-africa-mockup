"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  Code2,
  CreditCard,
  Database,
  Fingerprint,
  Globe2,
  Languages,
  Landmark,
  Lock,
  Menu,
  MessageSquareText,
  Network,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { LOCALE_FLAGS, LOCALE_NAMES } from "@/lib/i18n";
import LoginFlow, { type DemoUser } from "@/components/LoginFlow";
import LiveMarkets, { type LiveMarket } from "@/components/LiveMarkets";
import EarlyAccess from "@/components/EarlyAccess";
import ThemeToggle from "@/components/ThemeToggle";

type MarketingSiteProps = {
  stats: {
    markets: number;
    openMarkets: number;
    chamas: number;
    countries: number;
    totalVolume: number;
  };
  featuredMarkets: LiveMarket[];
  demoUsers: DemoUser[];
};

type Copy = {
  announcement: string;
  announcementLink: string;
  product: string;
  infrastructure: string;
  coverage: string;
  developers: string;
  openPlatform: string;
  eyebrow: string;
  heroLead: string;
  heroAccent: string;
  heroEnd: string;
  heroBody: string;
  startForecasting: string;
  exploreApi: string;
  noCard: string;
  liveMarkets: string;
  totalVolume: string;
  yes: string;
  no: string;
  seeAll: string;
  statMarkets: string;
  statCountries: string;
  statLanguages: string;
  statChannels: string;
  channelsEyebrow: string;
  channelsTitle: string;
  channelsBody: string;
  webTitle: string;
  webBody: string;
  mobileTitle: string;
  mobileBody: string;
  ussdTitle: string;
  ussdBody: string;
  moneyTitle: string;
  moneyBody: string;
  coverageEyebrow: string;
  coverageTitle: string;
  coverageBody: string;
  localMarkets: string;
  globalMarkets: string;
  communityPools: string;
  howEyebrow: string;
  howTitle: string;
  step1Title: string;
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step3Title: string;
  step3Body: string;
  step4Title: string;
  step4Body: string;
  apiEyebrow: string;
  apiTitle: string;
  apiBody: string;
  apiDocs: string;
  publicReads: string;
  signedMutations: string;
  postgresLedger: string;
  responsibleEyebrow: string;
  responsibleTitle: string;
  responsibleBody: string;
  guard1: string;
  guard2: string;
  guard3: string;
  guard4: string;
  finalTitle: string;
  finalBody: string;
  launchDashboard: string;
  viewMobile: string;
  platform: string;
  company: string;
  status: string;
  disclaimer: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    announcement: "Arena Africa is live in preview — Africa-first infrastructure, global markets.",
    announcementLink: "Explore the product",
    product: "Product",
    infrastructure: "Infrastructure",
    coverage: "Coverage",
    developers: "Developers",
    openPlatform: "Open platform",
    eyebrow: "Forecasting infrastructure for everyone",
    heroLead: "Forecast what’s next.",
    heroAccent: "Built for Africa.",
    heroEnd: "Open to the world.",
    heroBody: "A multi-channel prediction platform connecting web, mobile, USSD and mobile money to local, pan-African and global markets.",
    startForecasting: "Start forecasting",
    exploreApi: "Explore the API",
    noCard: "No card required · Demo wallets · 4 languages",
    liveMarkets: "Live markets",
    totalVolume: "market volume",
    yes: "YES",
    no: "NO",
    seeAll: "See all markets",
    statMarkets: "markets in catalog",
    statCountries: "demo countries",
    statLanguages: "interface languages",
    statChannels: "access channels",
    channelsEyebrow: "One market. Every channel.",
    channelsTitle: "Access designed around how people actually connect.",
    channelsBody: "From low-bandwidth feature phones to a modern mobile experience, Arena keeps the same account, wallet and market logic across every interface.",
    webTitle: "Responsive web",
    webBody: "Explore markets, compare probabilities and manage a wallet from any browser.",
    mobileTitle: "Installable mobile app",
    mobileBody: "A focused PWA with market discovery, Chama pools, wallet and offline shell.",
    ussdTitle: "USSD access",
    ussdBody: "Navigate live markets and place forecasts from a feature phone without mobile data.",
    moneyTitle: "Mobile money rails",
    moneyBody: "Provider-ready flows for M-Pesa, MTN MoMo, Airtel Money and wallet ledgers.",
    coverageEyebrow: "Local context, global horizon",
    coverageTitle: "From Nairobi and Lagos to São Paulo and New York.",
    coverageBody: "Arena supports region-specific questions without limiting discovery. Browse local events alongside crypto, climate, technology, finance and global sports.",
    localMarkets: "Regional African markets",
    globalMarkets: "Worldwide topics",
    communityPools: "Community pools",
    howEyebrow: "How Arena works",
    howTitle: "From an informed view to a transparent result.",
    step1Title: "Discover",
    step1Body: "Filter public markets by topic, geography and language.",
    step2Title: "Take a position",
    step2Body: "Choose YES or NO and see the potential payout before committing.",
    step3Title: "Fund your wallet",
    step3Body: "Use the simulated wallet today; connect regional payment rails in production.",
    step4Title: "Resolve & settle",
    step4Body: "A resolution triggers atomic wallet and community-pool settlement.",
    apiEyebrow: "API-first by design",
    apiTitle: "Build a channel without rebuilding the core.",
    apiBody: "Markets, predictions, users, wallets, Chamas, localization and USSD are exposed through modular REST endpoints backed by PostgreSQL.",
    apiDocs: "Read API documentation",
    publicReads: "Public market discovery",
    signedMutations: "Signed, authenticated mutations",
    postgresLedger: "PostgreSQL transaction ledger",
    responsibleEyebrow: "Trust by design",
    responsibleTitle: "Built with guardrails, not just growth loops.",
    responsibleBody: "The current product is a functional demonstration. Real-money launch requires local licensing, provider certification, age controls, KYC/AML, responsible participation controls and independent market-resolution governance in every jurisdiction.",
    guard1: "HMAC-signed sessions",
    guard2: "Atomic wallet operations",
    guard3: "Rate-limited APIs",
    guard4: "Audit-ready transaction references",
    finalTitle: "See the full platform in action.",
    finalBody: "Explore live markets, switch countries and currencies, test the USSD flow, or open the mobile experience.",
    launchDashboard: "Launch dashboard",
    viewMobile: "View mobile app",
    platform: "Platform",
    company: "Resources",
    status: "All demo systems operational",
    disclaimer: "Demo environment. No real funds are accepted or paid out. Market availability and real-money features are subject to local law and licensing.",
  },
  sw: {
    announcement: "Arena Africa ipo hewani kama hakikisho — miundombinu ya Afrika, masoko ya dunia.",
    announcementLink: "Angalia bidhaa",
    product: "Bidhaa",
    infrastructure: "Miundombinu",
    coverage: "Ufikiaji",
    developers: "Waendelezaji",
    openPlatform: "Fungua jukwaa",
    eyebrow: "Miundombinu ya utabiri kwa kila mtu",
    heroLead: "Tabiri kinachofuata.",
    heroAccent: "Imeundwa kwa Afrika.",
    heroEnd: "Iko wazi kwa dunia.",
    heroBody: "Jukwaa la utabiri la njia nyingi linalounganisha wavuti, simu, USSD na pesa za simu na masoko ya ndani, Afrika na dunia.",
    startForecasting: "Anza kutabiri",
    exploreApi: "Chunguza API",
    noCard: "Hakuna kadi · Pochi za majaribio · Lugha 4",
    liveMarkets: "Masoko hai",
    totalVolume: "kiasi cha soko",
    yes: "NDIO",
    no: "HAPANA",
    seeAll: "Angalia masoko yote",
    statMarkets: "masoko kwenye katalogi",
    statCountries: "nchi za majaribio",
    statLanguages: "lugha za kiolesura",
    statChannels: "njia za ufikiaji",
    channelsEyebrow: "Soko moja. Kila njia.",
    channelsTitle: "Ufikiaji ulioundwa kulingana na jinsi watu wanavyounganishwa.",
    channelsBody: "Kutoka simu za kawaida hadi programu ya kisasa, Arena hutumia akaunti, pochi na mantiki moja ya soko katika kila kiolesura.",
    webTitle: "Wavuti inayojirekebisha",
    webBody: "Chunguza masoko, linganisha uwezekano na dhibiti pochi kutoka kivinjari chochote.",
    mobileTitle: "Programu ya simu",
    mobileBody: "PWA yenye masoko, vikundi vya Chama, pochi na ganda la nje ya mtandao.",
    ussdTitle: "Ufikiaji wa USSD",
    ussdBody: "Tumia masoko na weka utabiri kwa simu ya kawaida bila data.",
    moneyTitle: "Pesa za simu",
    moneyBody: "Mtiririko tayari kwa M-Pesa, MTN MoMo, Airtel Money na daftari la pochi.",
    coverageEyebrow: "Muktadha wa ndani, upeo wa dunia",
    coverageTitle: "Kutoka Nairobi na Lagos hadi São Paulo na New York.",
    coverageBody: "Arena inaunga mkono maswali ya kikanda bila kuzuia ugunduzi. Angalia matukio ya ndani pamoja na kripto, hali ya hewa, teknolojia, fedha na michezo ya dunia.",
    localMarkets: "Masoko ya kikanda Afrika",
    globalMarkets: "Mada za dunia",
    communityPools: "Vikundi vya jamii",
    howEyebrow: "Arena inavyofanya kazi",
    howTitle: "Kutoka maoni yenye taarifa hadi matokeo wazi.",
    step1Title: "Gundua",
    step1Body: "Chuja masoko kwa mada, eneo na lugha.",
    step2Title: "Chagua msimamo",
    step2Body: "Chagua NDIO au HAPANA na uone malipo kabla ya kuthibitisha.",
    step3Title: "Weka fedha kwenye pochi",
    step3Body: "Tumia pochi ya majaribio sasa; unganisha njia za malipo katika uzalishaji.",
    step4Title: "Amua na ulipe",
    step4Body: "Uamuzi unaanzisha malipo salama kwa pochi na vikundi.",
    apiEyebrow: "API kwanza",
    apiTitle: "Jenga njia bila kujenga mfumo wa msingi upya.",
    apiBody: "Masoko, utabiri, watumiaji, pochi, Chama, lugha na USSD zinapatikana kupitia REST API juu ya PostgreSQL.",
    apiDocs: "Soma nyaraka za API",
    publicReads: "Ugunduzi wa masoko ya umma",
    signedMutations: "Mabadiliko yaliyothibitishwa",
    postgresLedger: "Daftari la PostgreSQL",
    responsibleEyebrow: "Uaminifu kwa muundo",
    responsibleTitle: "Imejengwa na ulinzi, si ukuaji pekee.",
    responsibleBody: "Bidhaa ya sasa ni onyesho linalofanya kazi. Uzinduzi wa pesa halisi unahitaji leseni, uthibitisho wa watoa huduma, umri, KYC/AML na usimamizi huru katika kila nchi.",
    guard1: "Vipindi vilivyosainiwa",
    guard2: "Shughuli salama za pochi",
    guard3: "API zenye kikomo",
    guard4: "Marejeleo ya ukaguzi",
    finalTitle: "Tazama jukwaa kamili likifanya kazi.",
    finalBody: "Chunguza masoko hai, badili nchi na sarafu, jaribu USSD au fungua programu ya simu.",
    launchDashboard: "Fungua dashibodi",
    viewMobile: "Angalia programu ya simu",
    platform: "Jukwaa",
    company: "Rasilimali",
    status: "Mifumo yote ya majaribio inafanya kazi",
    disclaimer: "Mazingira ya majaribio. Hakuna pesa halisi zinazopokelewa au kulipwa. Vipengele vinategemea sheria na leseni za eneo.",
  },
  fr: {
    announcement: "Arena Africa est disponible en aperçu — infrastructure africaine, marchés mondiaux.",
    announcementLink: "Découvrir le produit",
    product: "Produit",
    infrastructure: "Infrastructure",
    coverage: "Couverture",
    developers: "Développeurs",
    openPlatform: "Ouvrir la plateforme",
    eyebrow: "L’infrastructure de prévision pour tous",
    heroLead: "Anticipez la suite.",
    heroAccent: "Conçu pour l’Afrique.",
    heroEnd: "Ouvert au monde.",
    heroBody: "Une plateforme multicanale reliant web, mobile, USSD et mobile money aux marchés locaux, panafricains et mondiaux.",
    startForecasting: "Commencer",
    exploreApi: "Explorer l’API",
    noCard: "Sans carte · Portefeuilles démo · 4 langues",
    liveMarkets: "Marchés en direct",
    totalVolume: "volume du marché",
    yes: "OUI",
    no: "NON",
    seeAll: "Voir tous les marchés",
    statMarkets: "marchés au catalogue",
    statCountries: "pays de démonstration",
    statLanguages: "langues d’interface",
    statChannels: "canaux d’accès",
    channelsEyebrow: "Un marché. Tous les canaux.",
    channelsTitle: "Un accès adapté à la façon dont les gens se connectent.",
    channelsBody: "Du téléphone basique à l’application moderne, Arena conserve le même compte, portefeuille et moteur de marché.",
    webTitle: "Web adaptatif",
    webBody: "Explorez les marchés, comparez les probabilités et gérez un portefeuille depuis tout navigateur.",
    mobileTitle: "Application installable",
    mobileBody: "Une PWA dédiée aux marchés, groupes Chama, portefeuille et usage hors ligne.",
    ussdTitle: "Accès USSD",
    ussdBody: "Parcourez et participez depuis un téléphone basique, sans données mobiles.",
    moneyTitle: "Mobile money",
    moneyBody: "Flux prêts pour M-Pesa, MTN MoMo, Airtel Money et les registres de portefeuille.",
    coverageEyebrow: "Contexte local, horizon mondial",
    coverageTitle: "De Nairobi et Lagos à São Paulo et New York.",
    coverageBody: "Arena accueille les questions régionales sans limiter la découverte : crypto, climat, technologie, finance et sport mondial.",
    localMarkets: "Marchés africains régionaux",
    globalMarkets: "Sujets mondiaux",
    communityPools: "Groupes communautaires",
    howEyebrow: "Comment fonctionne Arena",
    howTitle: "D’un avis éclairé à un résultat transparent.",
    step1Title: "Découvrir",
    step1Body: "Filtrez les marchés publics par sujet, région et langue.",
    step2Title: "Prendre position",
    step2Body: "Choisissez OUI ou NON et voyez le gain potentiel avant validation.",
    step3Title: "Alimenter le portefeuille",
    step3Body: "Utilisez le portefeuille démo aujourd’hui; connectez les paiements en production.",
    step4Title: "Résoudre et régler",
    step4Body: "Une résolution déclenche le règlement atomique des portefeuilles et groupes.",
    apiEyebrow: "API-first par conception",
    apiTitle: "Créez un canal sans reconstruire le cœur.",
    apiBody: "Marchés, prévisions, utilisateurs, portefeuilles, Chamas, langues et USSD sont exposés via REST sur PostgreSQL.",
    apiDocs: "Lire la documentation API",
    publicReads: "Découverte publique",
    signedMutations: "Mutations signées et authentifiées",
    postgresLedger: "Registre transactionnel PostgreSQL",
    responsibleEyebrow: "Confiance dès la conception",
    responsibleTitle: "Des garde-fous, pas seulement de la croissance.",
    responsibleBody: "Le produit actuel est une démonstration fonctionnelle. Le lancement en argent réel exige licences locales, certification des opérateurs, contrôle d’âge, KYC/AML et gouvernance indépendante.",
    guard1: "Sessions signées HMAC",
    guard2: "Opérations atomiques",
    guard3: "API limitées",
    guard4: "Références auditables",
    finalTitle: "Découvrez la plateforme complète.",
    finalBody: "Explorez les marchés, changez de pays et devise, testez l’USSD ou ouvrez l’expérience mobile.",
    launchDashboard: "Ouvrir le tableau de bord",
    viewMobile: "Voir l’app mobile",
    platform: "Plateforme",
    company: "Ressources",
    status: "Tous les systèmes démo sont opérationnels",
    disclaimer: "Environnement de démonstration. Aucun fonds réel n’est accepté ou payé. Les fonctions réelles dépendent des lois et licences locales.",
  },
  pt: {
    announcement: "Arena Africa está em prévia — infraestrutura africana, mercados globais.",
    announcementLink: "Explorar o produto",
    product: "Produto",
    infrastructure: "Infraestrutura",
    coverage: "Cobertura",
    developers: "Desenvolvedores",
    openPlatform: "Abrir plataforma",
    eyebrow: "Infraestrutura de previsão para todos",
    heroLead: "Preveja o que vem a seguir.",
    heroAccent: "Feito para a África.",
    heroEnd: "Aberto ao mundo.",
    heroBody: "Uma plataforma multicanal conectando web, mobile, USSD e mobile money a mercados locais, pan-africanos e globais.",
    startForecasting: "Começar a prever",
    exploreApi: "Explorar a API",
    noCard: "Sem cartão · Carteiras demo · 4 idiomas",
    liveMarkets: "Mercados ao vivo",
    totalVolume: "volume de mercado",
    yes: "SIM",
    no: "NÃO",
    seeAll: "Ver todos os mercados",
    statMarkets: "mercados no catálogo",
    statCountries: "países de demonstração",
    statLanguages: "idiomas da interface",
    statChannels: "canais de acesso",
    channelsEyebrow: "Um mercado. Todos os canais.",
    channelsTitle: "Acesso pensado para a forma como as pessoas se conectam.",
    channelsBody: "Do celular básico ao app moderno, Arena mantém a mesma conta, carteira e lógica de mercado.",
    webTitle: "Web responsiva",
    webBody: "Explore mercados, compare probabilidades e gerencie a carteira em qualquer navegador.",
    mobileTitle: "App instalável",
    mobileBody: "Uma PWA focada em mercados, grupos Chama, carteira e shell offline.",
    ussdTitle: "Acesso USSD",
    ussdBody: "Navegue e participe usando um celular básico, sem dados móveis.",
    moneyTitle: "Mobile money",
    moneyBody: "Fluxos prontos para M-Pesa, MTN MoMo, Airtel Money e registro de carteira.",
    coverageEyebrow: "Contexto local, horizonte global",
    coverageTitle: "De Nairobi e Lagos a São Paulo e Nova York.",
    coverageBody: "Arena apoia questões regionais sem limitar a descoberta: cripto, clima, tecnologia, finanças e esporte global.",
    localMarkets: "Mercados regionais africanos",
    globalMarkets: "Tópicos mundiais",
    communityPools: "Grupos comunitários",
    howEyebrow: "Como Arena funciona",
    howTitle: "De uma visão informada a um resultado transparente.",
    step1Title: "Descobrir",
    step1Body: "Filtre mercados públicos por tema, região e idioma.",
    step2Title: "Tomar posição",
    step2Body: "Escolha SIM ou NÃO e veja o pagamento potencial antes de confirmar.",
    step3Title: "Financiar a carteira",
    step3Body: "Use a carteira demo agora; conecte pagamentos regionais em produção.",
    step4Title: "Resolver e liquidar",
    step4Body: "A resolução aciona a liquidação atômica das carteiras e grupos.",
    apiEyebrow: "API-first por design",
    apiTitle: "Crie um canal sem reconstruir o núcleo.",
    apiBody: "Mercados, previsões, usuários, carteiras, Chamas, idiomas e USSD são expostos via REST sobre PostgreSQL.",
    apiDocs: "Ler documentação da API",
    publicReads: "Descoberta pública",
    signedMutations: "Mutações assinadas",
    postgresLedger: "Registro PostgreSQL",
    responsibleEyebrow: "Confiança por design",
    responsibleTitle: "Proteções, não apenas crescimento.",
    responsibleBody: "O produto atual é uma demonstração funcional. O lançamento com dinheiro real exige licenças, certificação, controle de idade, KYC/AML e governança independente em cada jurisdição.",
    guard1: "Sessões HMAC assinadas",
    guard2: "Operações atômicas",
    guard3: "APIs com limite",
    guard4: "Referências auditáveis",
    finalTitle: "Veja a plataforma completa em ação.",
    finalBody: "Explore mercados, troque país e moeda, teste USSD ou abra a experiência mobile.",
    launchDashboard: "Abrir painel",
    viewMobile: "Ver app mobile",
    platform: "Plataforma",
    company: "Recursos",
    status: "Todos os sistemas demo operacionais",
    disclaimer: "Ambiente de demonstração. Nenhum fundo real é aceito ou pago. Recursos reais dependem das leis e licenças locais.",
  },
};

const regionCards = [
  { flag: "🇳🇬", city: "Lagos", topic: "Economy · Crypto", color: "from-emerald-500/20" },
  { flag: "🇰🇪", city: "Nairobi", topic: "FX · Technology", color: "from-teal-500/20" },
  { flag: "🇿🇦", city: "Johannesburg", topic: "Sports · Economy", color: "from-amber-500/20" },
  { flag: "🇲🇦", city: "Casablanca", topic: "Sports · Climate", color: "from-rose-500/20" },
  { flag: "🇧🇷", city: "São Paulo", topic: "Climate · Economy", color: "from-blue-500/20" },
  { flag: "🌍", city: "Global", topic: "Crypto · AI · Space", color: "from-indigo-500/20" },
];

function fmtVolume(volume: number) {
  if (volume >= 1_000_000) return `KSh ${(volume / 1_000_000).toFixed(1)}m`;
  if (volume >= 1_000) return `KSh ${(volume / 1_000).toFixed(0)}k`;
  return `KSh ${volume}`;
}

export default function MarketingSite({ stats, featuredMarkets, demoUsers }: MarketingSiteProps) {
  const [locale, setLocale] = useState<Locale>("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const c = COPY[locale];

  const nav = [
    { href: "#markets", label: "Live markets" },
    { href: "#infrastructure", label: c.infrastructure },
    { href: "#payments", label: "Payments" },
    { href: "#developers", label: c.developers },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900 selection:bg-emerald-400 selection:text-emerald-950 dark:bg-[#07100d] dark:text-white">
      {/* Announcement */}
      <div className="border-b border-emerald-500/10 bg-emerald-50 px-4 py-2 text-center text-[11px] text-emerald-800 dark:bg-emerald-400/[0.06] dark:text-emerald-100 sm:text-xs">
        <span>{c.announcement}</span>{" "}
        <Link href="/dashboard" className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
          {c.announcementLink} <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Navigation */}
      <header className="relative z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#07100d]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Arena Africa home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400 text-emerald-950 shadow-[0_0_30px_rgba(52,211,153,.2)]">
              <TrendingUp className="h-5 w-5" strokeWidth={2.6} />
            </span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[.12em]">Arena</span>
              <span className="block text-[9px] font-semibold uppercase tracking-[.22em] text-emerald-600 dark:text-emerald-400">Africa · Global</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/[0.04]" aria-label="Language selector">
              {(["en", "sw", "fr", "pt"] as Locale[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                    locale === lang ? "bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                  aria-label={LOCALE_NAMES[lang]}
                  aria-pressed={locale === lang}
                >
                  {LOCALE_FLAGS[lang]} {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <ThemeToggle />
            <LoginFlow users={demoUsers} className="group flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-emerald-950 transition hover:bg-emerald-300">
              {c.openPlatform} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </LoginFlow>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-white/10 dark:text-slate-300"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 dark:border-white/10 dark:bg-[#08130f] md:hidden">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="my-4 flex gap-1 border-y border-slate-200 dark:border-white/10 py-3">
              {(["en", "sw", "fr", "pt"] as Locale[]).map((lang) => (
                <button key={lang} onClick={() => setLocale(lang)} className={`flex-1 rounded-lg py-2 text-xs font-bold ${locale === lang ? "bg-emerald-400 text-emerald-950" : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"}`}>
                  {LOCALE_FLAGS[lang]} {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <LoginFlow users={demoUsers} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-extrabold text-emerald-950">
              {c.openPlatform} <ArrowRight className="h-4 w-4" />
            </LoginFlow>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section id="product" className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,.16),transparent_30%),radial-gradient(circle_at_82%_40%,rgba(59,130,246,.10),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:64px_64px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700 dark:bg-emerald-400/[.07] dark:text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" /> {c.eyebrow}
              </div>

              <h1 className="max-w-3xl text-[clamp(2.7rem,6.4vw,5.7rem)] font-black leading-[.91] tracking-[-.055em]">
                <span className="block text-slate-900 dark:text-white">{c.heroLead}</span>
                <span className="mt-2 block bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 dark:from-emerald-300 dark:via-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">{c.heroAccent}</span>
                <span className="mt-2 block text-slate-500">{c.heroEnd}</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-500 dark:text-slate-400 sm:text-lg">{c.heroBody}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LoginFlow users={demoUsers} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3.5 text-sm font-black text-emerald-950 transition hover:-translate-y-0.5 hover:bg-emerald-300">
                  {c.startForecasting} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </LoginFlow>
                <Link href="/api-docs" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-900 transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/[.04] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[.07]">
                  <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> {c.exploreApi}
                </Link>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[11px] text-slate-500">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> {c.noCard}
              </div>
            </div>

            {/* Payments & wallet visual */}
            <div className="relative lg:pl-7">
              <div className="absolute -inset-8 rounded-full bg-emerald-500/[.07] blur-3xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d1814] shadow-[0_45px_110px_rgba(0,0,0,.45)]">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[.07] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.75)]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[.15em] text-white">ONE WALLET · EVERY RAIL</span>
                  </div>
                  <span className="rounded-full bg-white/[.05] px-2 py-1 text-[9px] font-mono text-slate-500">CARDS + MoMo</span>
                </div>

                <div className="border-b border-slate-200 dark:border-white/[.07] bg-gradient-to-br from-emerald-400/[.08] to-transparent px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-500">{c.totalVolume}</span>
                      <p className="mt-1 text-xl font-black">{fmtVolume(stats.totalVolume)}</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex h-12 items-end gap-1" aria-hidden>
                    {[20, 34, 27, 51, 42, 59, 45, 66, 53, 72, 61, 82, 76, 94].map((h, i) => (
                      <span key={i} className="flex-1 rounded-t-sm bg-emerald-400/50" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                {/* Card network badges */}
                <div className="border-b border-slate-200 dark:border-white/[.07] px-4 py-3.5">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <CreditCard className="h-3 w-3 text-emerald-400" /> Card networks
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-indigo-400/20 bg-indigo-400/[.06] px-2.5 py-1.5 text-[11px] font-black italic tracking-wider text-indigo-300">VISA</span>
                    <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1.5">
                      <span className="relative flex h-4 w-6">
                        <span className="absolute left-0 h-4 w-4 rounded-full bg-rose-500/70" />
                        <span className="absolute left-2 h-4 w-4 rounded-full bg-amber-400/70" />
                      </span>
                      <span className="text-[10px] font-black text-slate-300">Mastercard</span>
                    </span>
                    <span className="flex items-center gap-1.5 rounded-lg border border-orange-400/20 bg-orange-400/[.06] px-2.5 py-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      <span className="text-[10px] font-black tracking-wider text-orange-300">DISCOVER</span>
                    </span>
                  </div>
                  <p className="mt-2.5 mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <WalletCards className="h-3 w-3 text-emerald-400" /> Mobile money
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "M-Pesa", cls: "border-emerald-400/20 bg-emerald-400/[.08] text-emerald-300" },
                      { label: "MTN MoMo", cls: "border-amber-400/20 bg-amber-400/[.08] text-amber-300" },
                      { label: "Airtel Money", cls: "border-rose-400/20 bg-rose-400/[.08] text-rose-300" },
                      { label: "Orange Money", cls: "border-orange-400/20 bg-orange-400/[.08] text-orange-300" },
                    ].map((p) => (
                      <span key={p.label} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black ${p.cls}`}>{p.label}</span>
                    ))}
                  </div>
                </div>

                {/* Process strip */}
                <div className="space-y-1.5 px-4 py-4">
                  {[
                    { icon: CreditCard, label: "Enter card · BIN detected · Luhn verified" },
                    { icon: Lock, label: "Tokenized — no raw PAN stored (PCI-style)" },
                    { icon: ShieldCheck, label: "3-D Secure + issuer authorization" },
                    { icon: BarChart3, label: "Wallet credited instantly · receipt issued" },
                  ].map((step) => (
                    <div key={step.label} className="flex items-center gap-2.5 rounded-xl border border-white/[.06] bg-slate-50 dark:bg-white/[.02] px-3 py-2">
                      <step.icon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                      <span className="text-[10px] font-semibold text-slate-300">{step.label}</span>
                    </div>
                  ))}
                </div>

                <Link href="/dashboard" className="flex items-center justify-center gap-1.5 border-t border-slate-200 dark:border-white/[.07] py-3 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/[.04]">
                  Fund your wallet <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-slate-200 bg-slate-50 dark:border-white/[.07] dark:bg-white/[.018]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 px-5 dark:divide-white/[.07] sm:grid-cols-4 sm:divide-y-0 lg:px-8">
            {[
              [stats.markets, c.statMarkets],
              [stats.countries, c.statCountries],
              [4, c.statLanguages],
              [4, c.statChannels],
            ].map(([value, label]) => (
              <div key={String(label)} className="px-4 py-6 first:pl-0 sm:px-7">
                <p className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live Markets board */}
        <LiveMarkets markets={featuredMarkets} openMarketsCount={stats.openMarkets} />

        {/* Access channels */}
        <section id="infrastructure" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-400">{c.channelsEyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-.035em] text-slate-900 dark:text-white sm:text-5xl">{c.channelsTitle}</h2>
              <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">{c.channelsBody}</p>
            </div>

            <div className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Globe2, title: c.webTitle, body: c.webBody, tag: "WEB", tone: "emerald" },
                { icon: Smartphone, title: c.mobileTitle, body: c.mobileBody, tag: "PWA", tone: "blue" },
                { icon: MessageSquareText, title: c.ussdTitle, body: c.ussdBody, tag: "*384#", tone: "amber" },
                { icon: WalletCards, title: c.moneyTitle, body: c.moneyBody, tag: "MoMo", tone: "rose" },
              ].map((item) => (
                <article key={item.tag} className="group rounded-3xl border border-slate-200 dark:border-white/[.08] bg-slate-50 dark:bg-white/[.025] p-5 transition hover:-translate-y-1 hover:border-white/[.15] hover:bg-white/[.04]">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-400">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-slate-200 dark:border-white/10 px-2 py-1 text-[8px] font-mono font-bold uppercase tracking-widest text-slate-500">{item.tag}</span>
                  </div>
                  <h3 className="mt-7 text-base font-black text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Payments */}
        <section id="payments" className="relative py-24 sm:py-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(99,102,241,.10),transparent_30%)]" />
          <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-400">Payments</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-.035em] text-slate-900 dark:text-white sm:text-5xl">
                Mobile money where it rules. <span className="text-slate-500">Cards where it helps.</span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
                One wallet, every rail. Fund predictions with M-Pesa, MTN MoMo and Airtel Money — or any
                Visa, Mastercard or Discover card — and cash out to the rail you trust.
              </p>
            </div>

            {/* Card brand features */}
            <div className="mt-12 grid gap-3 md:grid-cols-3">
              {[
                {
                  badge: <span className="rounded-lg border border-indigo-500/20 bg-indigo-50 dark:bg-indigo-400/[.06] px-3 py-1.5 text-sm font-black italic tracking-wider text-indigo-700 dark:text-indigo-300">VISA</span>,
                  name: "Visa",
                  hint: "Test card 4242 4242 4242 4242",
                },
                {
                  badge: (
                    <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-white/[.04] px-3 py-1.5">
                      <span className="relative flex h-4 w-6">
                        <span className="absolute left-0 h-4 w-4 rounded-full bg-rose-500/70" />
                        <span className="absolute left-2 h-4 w-4 rounded-full bg-amber-400/70" />
                      </span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">Mastercard</span>
                    </span>
                  ),
                  name: "Mastercard",
                  hint: "Test card 5555 5555 5555 4444",
                },
                {
                  badge: (
                    <span className="flex items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-50 dark:bg-orange-400/[.06] px-3 py-1.5">
                      <span className="h-3 w-3 rounded-full bg-orange-500" />
                      <span className="text-xs font-black tracking-wider text-orange-700 dark:text-orange-300">DISCOVER</span>
                    </span>
                  ),
                  name: "Discover",
                  hint: "Test card 6011 1111 1111 1117",
                },
              ].map((item) => (
                <article key={item.name} className="rounded-3xl border border-slate-200 dark:border-white/[.08] bg-slate-50 dark:bg-white/[.025] p-5">
                  {item.badge}
                  <h3 className="mt-5 text-base font-black text-slate-900 dark:text-white">{item.name} card deposits</h3>
                  <ul className="mt-3 space-y-2">
                    {[
                      "Instant wallet credit after authorization",
                      "BIN detection + Luhn checksum validation",
                      "3-digit CVV and expiry verification",
                      "PCI-style tokenization (no raw PAN stored)",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs leading-5 text-slate-400">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" /> {feature}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 rounded-xl border border-slate-200 bg-slate-100 dark:border-white/[.06] dark:bg-black/20 px-3 py-2 text-[10px] font-mono text-slate-500">
                    {item.hint}
                  </p>
                </article>
              ))}
            </div>

            {/* Process pipeline */}
            <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[.08] bg-[#0b1612]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-white/[.07] px-5 py-3.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Card payment process — from tap to credit</p>
                <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> 3-D SECURE · PCI-STYLE
                </span>
              </div>
              <div className="grid divide-y divide-white/[.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {[
                  { icon: CreditCard, title: "1 · Capture & detect", body: "Card number, expiry and CVV captured over TLS. Brand detected from the BIN (Visa 4…, Mastercard 51–55/2221–2720, Discover 6011/65/644–649) and the Luhn checksum verified." },
                  { icon: Landmark, title: "2 · Verify & authorize", body: "Expiry and CVV validated, then the issuer network authorizes the transaction. 3-D Secure challenges are simulated in the demo gateway." },
                  { icon: Lock, title: "3 · Tokenize & settle", body: "The PAN is tokenized and never stored. On approval the wallet is credited atomically and a branded receipt (VISA/MC/DISCOVER + auth code) is logged for audit." },
                ].map((step) => (
                  <div key={step.title} className="p-5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-400">
                      <step.icon className="h-4 w-4" />
                    </span>
                    <h4 className="mt-4 text-sm font-black text-slate-900 dark:text-white">{step.title}</h4>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Functions */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Deposit from card", body: "Any supported card tops up the wallet in seconds with a receipt." },
                { label: "Fund predictions", body: "Wallet balance pays for YES/NO positions across all markets." },
                { label: "Cash out", body: "Withdraw to mobile money or a card on file (rails vary by market)." },
              ].map((fn) => (
                <div key={fn.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/[.07] bg-slate-50 dark:bg-white/[.02] px-4 py-3.5">
                  <WalletCards className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{fn.label}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">{fn.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[10px] text-slate-600">
              Demo gateway only — industry test cards are used and no real funds move.
            </p>
          </div>
        </section>

        {/* Coverage */}
        <section id="coverage" className="border-y border-slate-200 bg-slate-50 dark:border-white/[.07] dark:bg-[#091510] py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-600 dark:text-emerald-400">{c.coverageEyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-.035em] text-slate-900 dark:text-white sm:text-5xl">{c.coverageTitle}</h2>
              <p className="mt-5 text-sm leading-7 text-slate-500 dark:text-slate-400 sm:text-base">{c.coverageBody}</p>

              <div className="mt-8 flex flex-wrap gap-2">
                {[c.localMarkets, c.globalMarkets, c.communityPools].map((tag) => (
                  <span key={tag} className="rounded-full border border-emerald-500/15 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/[.05] dark:text-emerald-200">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="pointer-events-none absolute inset-1/3 rounded-full bg-emerald-400/10 blur-3xl" />
              {regionCards.map((region, index) => (
                <div key={region.city} className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/[.08] bg-gradient-to-br ${region.color} to-white dark:to-white/[.025] p-4 ${index === 0 || index === 5 ? "sm:translate-y-5" : ""}`}>
                  <span className="text-2xl">{region.flag}</span>
                  <h3 className="mt-8 text-sm font-black text-slate-900 dark:text-white">{region.city}</h3>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">{region.topic}</p>
                  <div className="mt-4 flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                    <Radio className="h-3 w-3" /> MARKET ONLINE
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-400">{c.howEyebrow}</p>
              <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-[-.035em] sm:text-5xl">{c.howTitle}</h2>
            </div>

            <div className="relative mt-14 grid gap-3 md:grid-cols-4">
              <div className="absolute left-[12.5%] right-[12.5%] top-6 hidden border-t border-dashed border-emerald-400/20 md:block" />
              {[
                ["01", c.step1Title, c.step1Body],
                ["02", c.step2Title, c.step2Body],
                ["03", c.step3Title, c.step3Body],
                ["04", c.step4Title, c.step4Body],
              ].map(([number, title, body]) => (
                <article key={number} className="relative rounded-3xl border border-slate-200 bg-slate-50 dark:border-white/[.07] dark:bg-[#0b1612] p-5">
                  <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full border border-emerald-500/25 bg-slate-50 dark:bg-[#0b1612] text-xs font-black text-emerald-600 dark:text-emerald-400">{number}</span>
                  <h3 className="mt-6 text-base font-black">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* API section */}
        <section id="developers" className="border-y border-slate-200 dark:border-white/[.07] bg-slate-50 dark:bg-white/[.018] py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-400">{c.apiEyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-.035em] sm:text-5xl">{c.apiTitle}</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">{c.apiBody}</p>

              <ul className="mt-7 space-y-3">
                {[c.publicReads, c.signedMutations, c.postgresLedger].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/10 text-emerald-400"><Check className="h-3 w-3" /></span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/api-docs" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-emerald-400 hover:text-emerald-300">
                {c.apiDocs} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050a08] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[.07] px-4 py-3">
                <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" /></div>
                <span className="text-[9px] font-mono text-slate-600">api.arena.africa/v1</span>
              </div>
              <pre className="overflow-x-auto p-5 text-[11px] leading-6 text-slate-400 sm:p-7 sm:text-xs"><code><span className="text-violet-400">GET</span> <span className="text-emerald-400">/api/markets</span>?category=global{`\n\n`}<span className="text-slate-600">{`// 200 OK`}</span>{`\n`}{`{`}{`\n`}  <span className="text-blue-300">&quot;success&quot;</span>: <span className="text-amber-300">true</span>,{`\n`}  <span className="text-blue-300">&quot;data&quot;</span>: [{`{`}{`\n`}    <span className="text-blue-300">&quot;title&quot;</span>: <span className="text-emerald-200">&quot;Will Bitcoin reach...&quot;</span>,{`\n`}    <span className="text-blue-300">&quot;oddsYes&quot;</span>: <span className="text-amber-300">2.85</span>,{`\n`}    <span className="text-blue-300">&quot;locale&quot;</span>: <span className="text-emerald-200">&quot;global&quot;</span>{`\n`}  {`}`}] {`\n`}{`}`}{`\n\n`}<span className="text-violet-400">POST</span> <span className="text-emerald-400">/api/predictions</span>{`\n`}<span className="text-slate-600">Authorization: Bearer &#123;token&#125;</span></code></pre>
              <div className="grid grid-cols-3 border-t border-slate-200 dark:border-white/[.07]">
                {[{ icon: Network, label: "REST" }, { icon: Database, label: "PostgreSQL" }, { icon: Fingerprint, label: "HMAC Auth" }].map((item) => (
                  <div key={item.label} className="flex items-center justify-center gap-1.5 border-r border-slate-200 dark:border-white/[.07] py-3 text-[9px] font-bold uppercase tracking-wider text-slate-500 last:border-r-0">
                    <item.icon className="h-3 w-3 text-emerald-400" /> {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Governance, roles & AI */}
        <section id="governance" className="border-y border-slate-200 bg-slate-50 dark:border-white/[.07] dark:bg-[#091510] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[.2em] text-emerald-400">Governance & automation</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-.035em] text-slate-900 dark:text-white sm:text-5xl">
                Every action passes a policy. <span className="text-slate-500">Every role has a limit.</span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">
                A declarative policy engine sits between authentication and business logic. Requests are
                evaluated against role capabilities, KYC tiers, jurisdiction, velocity and responsible-play
                rules — then written to an audit trail that can be replayed and explained.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
              {/* Roles */}
              <div className="rounded-3xl border border-slate-200 dark:border-white/[.08] bg-slate-50 dark:bg-white/[.02] p-6">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  <Users className="h-4 w-4 text-emerald-400" /> Roles & capabilities
                </h3>
                <div className="mt-5 space-y-2">
                  {[
                    { role: "MEMBER", caps: "9", desc: "Predict, fund a wallet, join Chamas", tone: "text-slate-600 dark:text-slate-300" },
                    { role: "CREATOR", caps: "12", desc: "Author markets and start Chama pools", tone: "text-sky-600 dark:text-sky-300" },
                    { role: "RESOLVER", caps: "7", desc: "Settle markets — cannot move member funds", tone: "text-violet-600 dark:text-violet-300" },
                    { role: "COMPLIANCE", caps: "9", desc: "KYC review, suspend accounts, policy override", tone: "text-amber-600 dark:text-amber-300" },
                    { role: "TREASURY", caps: "7", desc: "Reconcile ledgers and issue refunds", tone: "text-teal-600 dark:text-teal-300" },
                    { role: "ADMIN", caps: "26", desc: "Full platform control and role management", tone: "text-rose-600 dark:text-rose-300" },
                    { role: "SERVICE", caps: "8", desc: "USSD gateway and payment webhooks only", tone: "text-indigo-600 dark:text-indigo-300" },
                  ].map((r) => (
                    <div key={r.role} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white dark:border-white/[.06] dark:bg-black/20 px-3.5 py-2.5">
                      <span className={`w-24 flex-shrink-0 text-[10px] font-black uppercase tracking-wider ${r.tone}`}>{r.role}</span>
                      <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">{r.desc}</span>
                      <span className="flex-shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
                        {r.caps} caps
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[10px] text-slate-600">
                  Segregation of duties is enforced: a resolver holding a position in a market triggers a second-approver requirement.
                </p>
              </div>

              {/* Policy + AI */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 dark:border-white/[.08] bg-slate-50 dark:bg-white/[.02] p-6">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Policy rules
                  </h3>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {[
                      "RBAC capability",
                      "Account status",
                      "Jurisdiction",
                      "KYC per-transaction",
                      "24h velocity",
                      "Sufficient funds",
                      "Market open-only",
                      "Segregation of duties",
                      "Responsible stake cap",
                      "USSD ceiling",
                    ].map((rule) => (
                      <span key={rule} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Check className="h-3 w-3 flex-shrink-0 text-emerald-400" /> {rule}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] text-slate-600">
                    Decisions return ALLOW / DENY / REVIEW with machine-readable reason codes.
                  </p>
                </div>

                <div className="rounded-3xl border border-indigo-400/15 bg-indigo-400/[.04] p-6">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    <Sparkles className="h-4 w-4 text-indigo-400" /> AI assistance (Gemini)
                  </h3>
                  <div className="mt-4 space-y-2.5">
                    {[
                      { t: "Market drafting", d: "Turns a plain-language idea into a resolvable question with a named source." },
                      { t: "Content moderation", d: "Screens submissions against house rules before publishing." },
                      { t: "Neutral briefings", d: "Explains the YES and NO case without giving advice." },
                      { t: "Resolution support", d: "Recommends an outcome from evidence — a human always confirms." },
                      { t: "Localisation", d: "Translates markets into English, Kiswahili, French and Portuguese." },
                    ].map((f) => (
                      <div key={f.t} className="flex items-start gap-2.5">
                        <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white">{f.t}</p>
                          <p className="text-[10px] leading-4 text-slate-500">{f.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] text-slate-600">
                    Structured JSON output with schema enforcement. Degrades to deterministic heuristics when no key is configured.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Responsibility */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="overflow-hidden rounded-[2rem] border border-amber-500/15 bg-gradient-to-br from-amber-100 via-slate-50 to-emerald-100 dark:from-amber-300/[.07] dark:via-[#0b1511] dark:to-emerald-400/[.05] p-6 sm:p-10">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_.8fr]">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[.2em] text-amber-700 dark:text-amber-300">{c.responsibleEyebrow}</p>
                  <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-.035em] sm:text-4xl">{c.responsibleTitle}</h2>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">{c.responsibleBody}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {[c.guard1, c.guard2, c.guard3, c.guard4].map((guard) => (
                    <div key={guard} className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/[.07] bg-white dark:bg-black/15 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <ShieldCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" /> {guard}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Early access */}
        <EarlyAccess />

        {/* Final CTA */}
        <section className="px-5 pb-24 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-emerald-400 px-6 py-14 text-emerald-950 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[45px] border-emerald-950/[.06]" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <h2 className="max-w-2xl text-3xl font-black tracking-[-.04em] sm:text-5xl">{c.finalTitle}</h2>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-emerald-950/70">{c.finalBody}</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <LoginFlow users={demoUsers} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-black text-white hover:bg-black">
                  {c.launchDashboard} <ArrowRight className="h-4 w-4" />
                </LoginFlow>
                <Link href="/mobile" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-950/15 bg-white/40 px-5 py-3 text-sm font-black text-emerald-950 hover:bg-white/60">
                  <Smartphone className="h-4 w-4" /> {c.viewMobile}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-white/[.07] dark:bg-[#050b08]">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_.6fr_.6fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400 text-emerald-950"><TrendingUp className="h-4 w-4" /></span>
                <span className="text-sm font-black uppercase tracking-wider">Arena Africa</span>
              </Link>
              <p className="mt-4 max-w-sm text-xs leading-5 text-slate-500">{c.disclaimer}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold text-emerald-400">
                <Activity className="h-3.5 w-3.5" /> {c.status}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{c.platform}</h3>
              <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500">
                <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white">Dashboard</Link>
                <Link href="/mobile" className="hover:text-slate-900 dark:hover:text-white">Mobile app</Link>
                <a href="#infrastructure" className="hover:text-slate-900 dark:hover:text-white">USSD & Mobile Money</a>
                <a href="#coverage" className="hover:text-slate-900 dark:hover:text-white">Global markets</a>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{c.company}</h3>
              <div className="mt-4 flex flex-col gap-3 text-xs text-slate-500">
                <Link href="/api-docs" className="hover:text-slate-900 dark:hover:text-white">API documentation</Link>
                <Link href="/api/health" className="hover:text-slate-900 dark:hover:text-white">System health</Link>
                <Link href="/api/markets" className="hover:text-slate-900 dark:hover:text-white">Live API</Link>
                <a href="#product" className="hover:text-slate-900 dark:hover:text-white">Product overview</a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 dark:border-white/[.07] pt-6 text-[10px] text-slate-600 sm:flex-row">
            <span>© {new Date().getFullYear()} Arena Africa. Product demonstration.</span>
            <span className="flex items-center gap-1.5"><Languages className="h-3 w-3" /> English · Kiswahili · Français · Português</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
