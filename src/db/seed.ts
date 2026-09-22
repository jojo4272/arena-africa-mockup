import { db } from "@/db";
import { users, markets, predictions, chamaPools, chamaMembers, transactions, appMeta } from "./schema";
import { count, eq } from "drizzle-orm";

// Bump when the market/user catalog changes so existing DBs pick up new rows.
export const SEED_VERSION = "3";

/**
 * Reusable catalog. Inserted with onConflictDoNothing() keyed on
 * users.phoneNumber / markets.title, so re-running is safe and
 * new rows roll out to already-seeded databases.
 */
export const seedUsers = [
  // East Africa
  { name: "Mwangi Juma", phoneNumber: "+254712345678", country: "Kenya", currency: "KES", balance: 4500 },
  { name: "Sarah Nakato", phoneNumber: "+256701234567", country: "Uganda", currency: "UGX", balance: 150000 },
  { name: "Amadi Tarimo", phoneNumber: "+255755112233", country: "Tanzania", currency: "TZS", balance: 95000 },
  { name: "Jean Bosco", phoneNumber: "+250788998877", country: "Rwanda", currency: "RWF", balance: 42000 },
  // West Africa
  { name: "Chidi Okonkwo", phoneNumber: "+2348012345678", country: "Nigeria", currency: "NGN", balance: 55000 },
  { name: "Kwame Asante", phoneNumber: "+233501234567", country: "Ghana", currency: "GHS", balance: 650 },
  // Southern Africa
  { name: "Thabo Mokoena", phoneNumber: "+27812345678", country: "South Africa", currency: "ZAR", balance: 850 },
  // Central Africa
  { name: "Marie Tshibangu", phoneNumber: "+243801234567", country: "DRC", currency: "CDF", balance: 25000 },
  // North Africa
  { name: "Youssef Benali", phoneNumber: "+212661234567", country: "Morocco", currency: "MAD", balance: 480 },
  // Global
  { name: "Alex Johnson", phoneNumber: "+14155551234", country: "USA", currency: "USD", balance: 50 },
  { name: "Priya Sharma", phoneNumber: "+919876543210", country: "India", currency: "INR", balance: 4200 },
  { name: "Luca Müller", phoneNumber: "+4917612345678", country: "Germany", currency: "EUR", balance: 45 },
];

export async function ensureSeeded() {
  const marketCountResult = await db.select({ value: count() }).from(markets);
  const marketCount = marketCountResult[0]?.value || 0;

  // Read stored seed version
  let storedVersion: string | null = null;
  try {
    const meta = await db.select().from(appMeta).where(eq(appMeta.key, "seed_version"));
    storedVersion = meta[0]?.value ?? null;
  } catch {
    storedVersion = null; // app_meta table not yet created
  }

  if (marketCount > 0 && storedVersion === SEED_VERSION) {
    return; // fresh and current
  }

  // Idempotent catalog sync: adds new users/markets, skips existing ones
  try {
    await db.insert(users).values(seedUsers).onConflictDoNothing({ target: users.phoneNumber });
    console.log(`Seed sync: users upserted (v${SEED_VERSION})`);
  } catch (e: any) {
    console.warn("User seed sync skipped:", e.message);
  }

  if (marketCount === 0) {
    // Atomic claim: concurrent requests can all observe marketCount===0 before
    // any of them commits, so guard the one-time catalog seed with a unique
    // insert. Only the request that actually inserts the lock row proceeds.
    const claim = await db
      .insert(appMeta)
      .values({ key: "seed_lock", value: "claimed" })
      .onConflictDoNothing({ target: appMeta.key })
      .returning();
    if (claim.length === 0) {
      return; // another concurrent request already claimed the seed
    }

    console.log("Seeding database with pan-African and global market data...");

  // 1. Create pan-African + global demo users
  // Users were already upserted above from seedUsers; just read them back.
  // (kept as `insertedUsers` so downstream references keep working)
  const insertedUsers = await db.select().from(users).orderBy(users.id);
  void [
    // East Africa
    {
      name: "Mwangi Juma",
      phoneNumber: "+254712345678",
      country: "Kenya",
      currency: "KES",
      balance: 4500,
    },
    {
      name: "Sarah Nakato",
      phoneNumber: "+256701234567",
      country: "Uganda",
      currency: "UGX",
      balance: 150000,
    },
    {
      name: "Amadi Tarimo",
      phoneNumber: "+255755112233",
      country: "Tanzania",
      currency: "TZS",
      balance: 95000,
    },
    {
      name: "Jean Bosco",
      phoneNumber: "+250788998877",
      country: "Rwanda",
      currency: "RWF",
      balance: 42000,
    },
    // West Africa
    {
      name: "Chidi Okonkwo",
      phoneNumber: "+234801@234567",
      country: "Nigeria",
      currency: "NGN",
      balance: 55000,
    },
    {
      name: "Kwame Asante",
      phoneNumber: "+233501234567",
      country: "Ghana",
      currency: "GHS",
      balance: 650,
    },
    // Southern Africa
    {
      name: "Thabo Mokoena",
      phoneNumber: "+27812345678",
      country: "South Africa",
      currency: "ZAR",
      balance: 850,
    },
    // Central Africa
    {
      name: "Marie Tshibangu",
      phoneNumber: "+243801234567",
      country: "DRC",
      currency: "CDF",
      balance: 25000,
    },
    // North Africa
    {
      name: "Youssef Benali",
      phoneNumber: "+212661234567",
      country: "Morocco",
      currency: "MAD",
      balance: 480,
    },
    // Global
    {
      name: "Alex Johnson",
      phoneNumber: "+14155551234",
      country: "USA",
      currency: "USD",
      balance: 50,
    },
    {
      name: "Priya Sharma",
      phoneNumber: "+919876543210",
      country: "India",
      currency: "INR",
      balance: 4200,
    },
    {
      name: "Luca Müller",
      phoneNumber: "+4917612345678",
      country: "Germany",
      currency: "EUR",
      balance: 45,
    },
  ];

  // 2. Create high-engagement East African + Global prediction markets
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 45);

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 15);

  const insertedMarkets = await db.insert(markets).values([
    // EAST AFRICAN MARKETS (onConflictDoNothing by title → re-runnable)
    {
      title: "Will USD to KES exchange rate fall below 120 KES by the end of this year?",
      description: "Safaricom diaspora remittances and central bank interest rates are stabilizing the Kenya Shilling. Will the dollar go below 120 KES?",
      category: "economy",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 2.15,
      oddsNo: 1.65,
      volume: 480000,
      isFeatured: true,
    },
    {
      title: "Will Gor Mahia win the Kenyan Premier League (KPL) 2026 Title?",
      description: "K'Ogalo is currently leading the table, but Tusker FC and Police FC are close behind. Can they retain their title?",
      category: "sports",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.55,
      oddsNo: 2.30,
      volume: 750000,
      isFeatured: true,
    },
    {
      title: "Will Safaricom M-Pesa officially launch fully-licensed services in 3 more countries?",
      description: "Safaricom is currently in talks with DRC, Angola, and Burundi regulatory boards to launch M-Pesa. Will they secure 3 licenses?",
      category: "culture",
      locale: "sw",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.95,
      oddsNo: 1.80,
      volume: 320000,
      isFeatured: false,
    },
    {
      title: "Will East African Community (EAC) roll out a Unified Tourist Visa for all 8 partner states?",
      description: "The proposal is on the CECAFA and EAC table to boost cross-border tourism. Will all 8 countries ratify it by next quarter?",
      category: "politics",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 2.50,
      oddsNo: 1.45,
      volume: 125000,
      isFeatured: false,
    },
    {
      title: "Will Diamond Platnumz win a Grammy Award for Best African Music Performance?",
      description: "Tanzania's Wasafi icon is preparing a brand new world album in collaboration with US artists. Will he win the coveted Grammy?",
      category: "culture",
      locale: "sw",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 3.20,
      oddsNo: 1.28,
      volume: 980000,
      isFeatured: true,
    },
    {
      title: "Will Uganda start commercial petroleum production from the Albertine Graben before December?",
      description: "The Tilenga and Kingfisher oil projects are 85% ready. Will the first barrel of crude flow through the East African Crude Oil Pipeline (EACOP)?",
      category: "economy",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.80,
      oddsNo: 1.95,
      volume: 540000,
      isFeatured: false,
    },
    {
      title: "Did Kenya win more than 5 Gold Medals at the recent Athletics Championship?",
      description: "Resolved historic market for platform verification. Kenya won 6 gold medals, proving world-class dominance in long distance.",
      category: "sports",
      locale: "en",
      endsAt: pastDate,
      status: "RESOLVED",
      winningOutcome: "YES",
      oddsYes: 1.40,
      oddsNo: 2.80,
      volume: 620000,
      isFeatured: false,
    },
    
    // WEST AFRICAN MARKETS
    {
      title: "Will Nigeria's SEC approve a spot Bitcoin ETF in 2026?",
      description: "Nigeria is Africa's largest crypto market by volume. Will the SEC greenlight a spot BTC ETF following the US precedent?",
      category: "crypto",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 2.10,
      oddsNo: 1.70,
      volume: 320000,
      isFeatured: true,
    },
    {
      title: "Will Ghana achieve 6% GDP growth driven by oil and gold exports?",
      description: "Ghana's economy is rebounding with new oil fields and record gold prices. Can growth hit the 6% target?",
      category: "economy",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.95,
      oddsNo: 1.80,
      volume: 180000,
      isFeatured: false,
    },
    {
      title: "Will Afrobeats surpass Amapiano as Africa's most streamed genre globally?",
      description: "Nigeria's Afrobeats and South Africa's Amapiano are battling for global dominance. Will Afrobeats take the crown by year-end?",
      category: "culture",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.80,
      oddsNo: 1.90,
      volume: 720000,
      isFeatured: true,
    },

    // SOUTHERN AFRICAN MARKETS
    {
      title: "Will South Africa's rand strengthen below R16 to the) USD in 2026?",
      description: "Load shedding reforms and GNU stability are boosting investor confidence. Will the rand break R16?",
      category: "economy",
      locale: "en",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 2.30,
      oddsNo: 1.55,
      volume: 410000,
      isFeatured: false,
    },
    {
      title: "Will Springboks win back-to-back Rugby World Cups in 2027?",
      description: "South Africa's dominant rugby squad seeks an unprecedented third consecutive RWC title.",
      category: "sports",
      locale: "en",
      endsAt: new Date("2027-11-01"),
      status: "OPEN",
      oddsYes: 2.60,
      oddsNo: 1.45,
      volume: 580000,
      isFeatured: false,
    },

    // NORTH AFRICAN MARKETS
    {
      title: "Will Morocco qualify for the 2026 FIFA World Cup knockout stage?",
      description: "After their historic 2022 semi-final run, can the Atlas Lions go deep again on the world stage?",
      category: "sports",
      locale: "fr",
      endsAt: new Date("2026-07-20"),
      status: "OPEN",
      oddsYes: 1.55,
      oddsNo: 2.30,
      volume: 390000,
      isFeatured: false,
    },

    // CENTRAL AFRICAN MARKETS
    {
      title: "Will DRC hold peaceful and internationally recognized presidential elections?",
      description: "The DRC faces immense logistical and security challenges. Will the next election cycle meet international standards?",
      category: "politics",
      locale: "fr",
      endsAt: new Date("2028-12-31"),
      status: "OPEN",
      oddsYes: 2.80,
      oddsNo: 1.35,
      volume: 140000,
      isFeatured: false,
    },

    // PAN-AFRICAN MARKETS
    {
      title: "Will the African Continental Free Trade Area (AfCFTA) reach 50% intra-African trade by 2030?",
      description: "AfCFTA aims to boost intra-African trade from 15% to 50%. Will this ambitious target be met?",
      category: "economy",
      locale: "global",
      endsAt: new Date("2030-12-31"),
      status: "OPEN",
      oddsYes: 3.20,
      oddsNo: 1.28,
      volume: 210000,
      isFeatured: true,
    },
    {
      title: "Will an African startup achieve unicorn status ($1B+ valuation) outside Nigeria, Kenya, or South Africa?",
      description: "Egypt, Ghana, and Tanzania are emerging. Will a new country produce its first unicorn?",
      category: "tech",
      locale: "global",
      endsAt: new Date("2028-12-31"),
      status: "OPEN",
      oddsYes: 2.40,
      oddsNo: 1.55,
      volume: 280000,
      isFeatured: false,
    },

    // GLOBAL / INTERNATIONAL MARKETS
    {
      title: "Will Bitcoin reach $150,000 USD by Q4 2026?",
      description: "With institutional adoption accelerating and the next halving cycle, can BTC break the $150K barrier before year-end?",
      category: "crypto",
      locale: "global",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 2.85,
      oddsNo: 1.35,
      volume: 2450000,
      isFeatured: true,
    },
    {
      title: "Will SpaceX successfully land Starship on Mars before 2028?",
      description: "Elon Musk's ambitious timeline for Mars colonization depends on multiple successful orbital test flights. Will they achieve the first Mars landing?",
      category: "tech",
      locale: "global",
      endsAt: new Date("2028-01-01"),
      status: "OPEN",
      oddsYes: 3.50,
      oddsNo: 1.25,
      volume: 1850000,
      isFeatured: true,
    },
    {
      title: "Will global average temperature rise exceed 1.5°C above pre-industrial levels in 2026?",
      description: "Climate scientists warn that 2026 could be the year we breach the Paris Agreement threshold. Will the data confirm this?",
      category: "climate",
      locale: "global",
      endsAt: new Date("2026-12-31"),
      status: "OPEN",
      oddsYes: 1.75,
      oddsNo: 2.05,
      volume: 680000,
      isFeatured: false,
    },
    {
      title: "Will OpenAI release GPT-5 with AGI-level reasoning capabilities?",
      description: "OpenAI's next-generation model promises breakthrough advances in reasoning and multimodal understanding. Will it achieve AGI benchmarks?",
      category: "tech",
      locale: "global",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 2.20,
      oddsNo: 1.60,
      volume: 1420000,
      isFeatured: true,
    },
    {
      title: "Will the US Federal Reserve cut interest rates below 3% in 2026?",
      description: "With inflation stabilizing and economic growth concerns, will the Fed pivot to aggressive rate cuts?",
      category: "economy",
      locale: "global",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.90,
      oddsNo: 1.85,
      volume: 890000,
      isFeatured: false,
    },
    {
      title: "Will Manchester City win the UEFA Champions League 2026?",
      description: "Pep Guardiola's squad is seeking another European triumph. Can they overcome Real Madrid and Bayern Munich?",
      category: "sports",
      locale: "global",
      endsAt: new Date("2026-06-01"),
      status: "OPEN",
      oddsYes: 2.40,
      oddsNo: 1.55,
      volume: 1650000,
      isFeatured: false,
    },
    {
      title: "Will a major African nation host the FIFA World Cup before 2034?",
      description: "Morocco, Egypt, and Nigeria have expressed interest. Will FIFA award an African nation hosting rights?",
      category: "sports",
      locale: "global",
      endsAt: new Date("2030-12-31"),
      status: "OPEN",
      oddsYes: 2.10,
      oddsNo: 1.70,
      volume: 520000,
      isFeatured: false,
    },
    {
      title: "Will Ethereum complete the 'Surge' upgrade and reach 100,000 TPS?",
      description: "Vitalik Buterin's roadmap includes massive scalability improvements. Will ETH achieve web-scale transaction throughput?",
      category: "crypto",
      locale: "global",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 2.65,
      oddsNo: 1.42,
      volume: 780000,
      isFeatured: false,
    },
    {
      title: "Will France win the 2026 FIFA World Cup?",
      description: "Les Bleus have a golden generation with Mbappé at his peak. Can they secure back-to-back World Cup victories?",
      category: "sports",
      locale: "fr",
      endsAt: new Date("2026-07-20"),
      status: "OPEN",
      oddsYes: 3.80,
      oddsNo: 1.22,
      volume: 1250000,
      isFeatured: false,
    },
    {
      title: "Will Brazil's economy grow above 3% GDP in 2026?",
      description: "Under President Lula's economic policies and commodity exports, can Brazil achieve robust growth?",
      category: "economy",
      locale: "pt",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.85,
      oddsNo: 1.90,
      volume: 420000,
      isFeatured: false,
    },
    {
      title: "Will India's GDP overtake Japan to become the world's 3rd largest economy?",
      description: "India's growth trajectory is accelerating. Will it surpass Japan in nominal GDP terms?",
      category: "economy",
      locale: "global",
      endsAt: new Date("2028-12-31"),
      status: "OPEN",
      oddsYes: 1.65,
      oddsNo: 2.15,
      volume: 960000,
      isFeatured: true,
    },
    {
      title: "Will the EU implement a continent-wide AI regulation framework before the US?",
      description: "The EU AI Act is progressing. Will Europe beat the US to comprehensive AI governance?",
      category: "politics",
      locale: "global",
      endsAt: futureDate,
      status: "OPEN",
      oddsYes: 1.45,
      oddsNo: 2.55,
      volume: 380000,
      isFeatured: false,
    },
    {
      title: "Will China's Tiangong space station host non-Chinese astronauts by 2028?",
      description: "China has opened Tiangong for international cooperation. Will foreign astronauts board the station?",
      category: "tech",
      locale: "global",
      endsAt: new Date("2028-12-31"),
      status: "OPEN",
      oddsYes: 2.90,
      oddsNo: 1.33,
      volume: 310000,
      isFeatured: false,
    },
    {
      title: "Will a cure for sickle cell disease reach Phase 3 clinical trials by 2027?",
      description: "Gene therapy breakthroughs are accelerating. Will a definitive SCD cure reach late-stage trials?",
      category: "culture",
      locale: "global",
      endsAt: new Date("2027-12-31"),
      status: "OPEN",
      oddsYes: 1.75,
      oddsNo: 2.05,
      volume: 290000,
      isFeatured: false,
    },
    {
      title: "Will Lula da Silva's government implement full Amazon deforestation zero by 2027?",
      description: "Brazil's deforestation rates are falling. Can the government achieve zero deforestation targets?",
      category: "climate",
      locale: "pt",
      endsAt: new Date("2027-12-31"),
      status: "OPEN",
      oddsYes: 3.40,
      oddsNo: 1.25,
      volume: 220000,
      isFeatured: false,
    },
  ])
  .onConflictDoNothing()
  .returning();

  // Let's retrieve inserted IDs
  const user1 = insertedUsers[0];
  const user2 = insertedUsers[1];
  const user3 = insertedUsers[2];
  const user4 = insertedUsers[3];
  const user5 = insertedUsers[4];

  const mRate = insertedMarkets[0];
  const mGor = insertedMarkets[1];
  const mMpesa = insertedMarkets[2];
  const mDiamond = insertedMarkets[4];

  // 3. Create predictions (Individual)
  await db.insert(predictions).values([
    {
      marketId: mRate.id,
      userId: user1.id,
      outcome: "YES",
      amount: 1500,
      potentialPayout: Math.round(1500 * mRate.oddsYes),
      currency: "KES",
      platform: "WEB",
    },
    {
      marketId: mRate.id,
      userId: user2.id,
      outcome: "NO",
      amount: 45000, // UGX
      potentialPayout: Math.round(45000 * mRate.oddsNo),
      currency: "UGX",
      platform: "USSD",
    },
    {
      marketId: mGor.id,
      userId: user1.id,
      outcome: "YES",
      amount: 1000,
      potentialPayout: Math.round(1000 * mGor.oddsYes),
      currency: "KES",
      platform: "WEB",
    },
    {
      marketId: mGor.id,
      userId: user5.id,
      outcome: "YES",
      amount: 3000,
      potentialPayout: Math.round(3000 * mGor.oddsYes),
      currency: "KES",
      platform: "USSD",
    },
    {
      marketId: mDiamond.id,
      userId: user3.id,
      outcome: "YES",
      amount: 25000, // TZS
      potentialPayout: Math.round(25000 * mDiamond.oddsYes),
      currency: "TZS",
      platform: "WEB",
    },
    {
      marketId: mMpesa.id,
      userId: user4.id,
      outcome: "YES",
      amount: 15000, // RWF
      potentialPayout: Math.round(15000 * mMpesa.oddsYes),
      currency: "RWF",
      platform: "USSD",
    }
  ]);

  // 4. Create local "Chamas" (community predictions)
  const chama1 = await db.insert(chamaPools).values({
    name: "Nairobi Tech Hustlers Chama",
    marketId: mRate.id,
    code: "HUSTLE-KES",
    targetOutcome: "YES",
    totalAmount: 12000,
    currency: "KES",
  }).returning();

  const chama2 = await db.insert(chamaPools).values({
    name: "Wasafi Fan Club Tanzania",
    marketId: mDiamond.id,
    code: "WASAFI-TZS",
    targetOutcome: "YES",
    totalAmount: 85000,
    currency: "TZS",
  }).returning();

  // Add members to Chamas
  await db.insert(chamaMembers).values([
    {
      chamaId: chama1[0].id,
      userId: user1.id,
      contribution: 5000,
    },
    {
      chamaId: chama1[0].id,
      userId: user5.id,
      contribution: 7000,
    },
    {
      chamaId: chama2[0].id,
      userId: user3.id,
      contribution: 85000,
    }
  ]);

  // 5. Create some sample mobile money transaction logs
  await db.insert(transactions).values([
    {
      userId: user1.id,
      type: "DEPOSIT",
      amount: 5000,
      currency: "KES",
      provider: "M-PESA",
      reference: "QHC8147JLP3",
      phoneNumber: user1.phoneNumber,
      status: "SUCCESS",
    },
    {
      userId: user2.id,
      type: "DEPOSIT",
      amount: 200000,
      currency: "UGX",
      provider: "MTN_MOMO",
      reference: "UGX-MOMO-8821",
      phoneNumber: user2.phoneNumber,
      status: "SUCCESS",
    },
    {
      userId: user3.id,
      type: "DEPOSIT",
      amount: 100000,
      currency: "TZS",
      provider: "AIRTEL_MONEY",
      reference: "TZ-AIRTEL-90021",
      phoneNumber: user3.phoneNumber,
      status: "SUCCESS",
    },
    {
      userId: user1.id,
      type: "WITHDRAWAL",
      amount: 1000,
      currency: "KES",
      provider: "M-PESA",
      reference: "QHC8149KLT8",
      phoneNumber: user1.phoneNumber,
      status: "SUCCESS",
    }
  ]);

  console.log("Database successfully seeded!");
  }
  // Record the seed version so future deploys roll out new catalog rows
  try {
    await db
      .insert(appMeta)
      .values({ key: "seed_version", value: SEED_VERSION })
      .onConflictDoUpdate({ target: appMeta.key, set: { value: SEED_VERSION } });
    console.log(`Seed version set to ${SEED_VERSION}`);
  } catch (e: any) {
    console.warn("Could not record seed version:", e.message);
  }
}
