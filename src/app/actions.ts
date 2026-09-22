"use server";

import { db } from "@/db";
import { users, markets, predictions, chamaPools, chamaMembers, transactions } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { withTransaction } from "@/lib/transactions";
import { logger, LogLevel } from "@/lib/logger";
import { verifyPhoneToken } from "@/lib/auth";
import { validatePrediction, validateDeposit, validateWithdrawal, validateChamaCreation, validateChamaJoin } from "@/lib/validators";

/**
 * NIST CSF PROTECT: Resolve the authenticated user from the session cookie.
 * Server actions are publicly callable, so every mutation must verify the caller
 * instead of trusting a userId passed from the client (IDOR protection).
 */
async function authedUser(expectedUserId?: number): Promise<any> {
  const store = await cookies();
  const token = store.get("arena_token")?.value;
  if (!token) throw new Error("Unauthorized. Please select a profile to continue.");

  const verified = verifyPhoneToken(token);
  if (!verified?.valid) throw new Error("Unauthorized. Session expired, please select a profile again.");

  const list = await db.select().from(users).where(eq(users.id, verified.userId));
  const user = list[0];
  if (!user) throw new Error("Unauthorized. User not found.");

  if (expectedUserId !== undefined && user.id !== Number(expectedUserId)) {
    logger.security("IDOR attempt blocked in server action", {
      userId: user.id,
      metadata: { requestedUserId: expectedUserId },
    });
    throw new Error("Unauthorized. You can only act on your own account.");
  }
  return user;
}

// Generate random transaction reference codes (M-Pesa or MTN style)
function generateRef(provider: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let prefix = "TX";
  if (provider === "M-PESA") prefix = "MP";
  if (provider === "MTN_MOMO") prefix = "MTN";
  if (provider === "AIRTEL_MONEY") prefix = "ART";
  
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${code}`;
}

// 1. Ensure seed is run, then fetch users
export async function getUsers() {
  await ensureSeeded();
  try {
    return await db.select().from(users).orderBy(users.id);
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// 2. Fetch markets
export async function getMarkets(category?: string) {
  await ensureSeeded();
  try {
    if (category && category !== "all") {
      return await db.select().from(markets).where(eq(markets.category, category)).orderBy(desc(markets.createdAt));
    }
    return await db.select().from(markets).orderBy(desc(markets.createdAt));
  } catch (error) {
    console.error("Error fetching markets:", error);
    return [];
  }
}

// 3. Fetch specific user details
export async function getUserById(userId: number) {
  await ensureSeeded();
  try {
    const list = await db.select().from(users).where(eq(users.id, userId));
    return list[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// 4. Create new market (Admin / Community powered)
export async function createMarket(data: {
  title: string;
  description: string;
  category: string;
  endsAt: string;
  oddsYes: number;
  oddsNo: number;
  isFeatured: boolean;
}) {
  try {
    await authedUser(); // NIST PROTECT
    const newMarket = await db.insert(markets).values({
      title: data.title,
      description: data.description,
      category: data.category,
      endsAt: new Date(data.endsAt),
      oddsYes: Number(data.oddsYes) || 1.85,
      oddsNo: Number(data.oddsNo) || 1.85,
      volume: 0,
      status: "OPEN",
      isFeatured: !!data.isFeatured,
    }).returning();

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, market: newMarket[0] };
  } catch (error: any) {
    console.error("Error creating market:", error);
    return { success: false, error: error.message };
  }
}

// 5. Place a Prediction (Individual)
export async function placePrediction(data: {
  userId: number;
  marketId: number;
  outcome: string; // "YES" or "NO"
  amount: number;  // Local currency amount
  currency: string;
  platform: string; // "WEB" or "USSD"
 }): Promise<{ success: boolean; prediction?: any; error?: string; newBalance?: number; potentialPayout?: number }> {
  try {
    // NIST PROTECT: verify caller identity before mutating
    await authedUser(data.userId);

    // POLICY ENFORCEMENT: Validate through policy engine before proceeding
    const validation = await validatePrediction({
      userId: data.userId,
      marketId: data.marketId,
      amount: data.amount,
      channel: data.platform as "WEB" | "USSD",
    });

    if (!validation.allowed) {
      return { success: false, error: validation.error || "Prediction not allowed" };
    }

    // NIST CSF PROTECT: Wrap multi-step operation in DB transaction
    const result = await withTransaction(async () => {
      // 1. Fetch user & market (already validated, but needed for transaction)
      const userList = await db.select().from(users).where(eq(users.id, data.userId));
      const user = userList[0];
      if (!user) throw new Error("User not found");

      const marketList = await db.select().from(markets).where(eq(markets.id, data.marketId));
      const market = marketList[0];
      if (!market) throw new Error("Market not found");

      // Security event log (NIST DETECT)
      logger.log(LogLevel.INFO, `Prediction placed by user ${data.userId}`, {
        userId: data.userId,
        metadata: {
          marketId: data.marketId,
          outcome: data.outcome,
          amount: data.amount,
          currency: data.currency,
          endpoint: "/api/predictions",
        },
      });

      // 2. Calculate potential payout
      const odd = data.outcome === "YES" ? market.oddsYes : market.oddsNo;
      const potentialPayout = Math.round(data.amount * odd);

      // 3. Deduct balance from user
      await db.update(users)
        .set({ balance: user.balance - data.amount })
        .where(eq(users.id, user.id));

      // 4. Create prediction entry
      const newPrediction = await db.insert(predictions).values({
        marketId: data.marketId,
        userId: data.userId,
        outcome: data.outcome,
        amount: data.amount,
        potentialPayout: potentialPayout,
        currency: data.currency,
        platform: data.platform,
      }).returning();

      // 5. Update market volume
      let volumeIncrement = data.amount;
      if (data.currency === "UGX") volumeIncrement = Math.round(data.amount / 30);
      else if (data.currency === "TZS") volumeIncrement = Math.round(data.amount / 20);
      else if (data.currency === "RWF") volumeIncrement = Math.round(data.amount / 10);

      await db.update(markets)
        .set({ volume: market.volume + volumeIncrement })
        .where(eq(markets.id, market.id));

      // 6. Record transaction log
      await db.insert(transactions).values({
        userId: data.userId,
        type: "PREDICT_BUY",
        amount: data.amount,
        currency: data.currency,
        provider: "WALLET",
        reference: generateRef("WALLET"),
        phoneNumber: user.phoneNumber,
        status: "SUCCESS",
      });

      revalidatePath("/dashboard");
    revalidatePath("/");
      return { success: true, prediction: newPrediction[0] };
    });

    return result;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    logger.log(LogLevel.ERROR, `Prediction failed: ${errorMsg}`, {
      userId: data.userId,
      metadata: {
        marketId: data.marketId,
        endpoint: "/api/predictions",
      },
    });
    console.error("Error placing prediction:", err);
    return { success: false, error: errorMsg };
  }
}

// 6. Mobile Money Deposit Simulation
export async function depositMobileMoney(data: {
  userId: number;
  amount: number;
  currency: string;
  provider: string; // "M-PESA", "MTN_MOMO", "AIRTEL_MONEY"
  phoneNumber: string;
}) {
  try {
    await authedUser(data.userId); // NIST PROTECT

    // POLICY ENFORCEMENT: Validate through policy engine
    const validation = await validateDeposit({
      userId: data.userId,
      amount: data.amount,
      channel: "WEB",
    });

    if (!validation.allowed) {
      return { success: false, error: validation.error || "Deposit not allowed" };
    }

    const userList = await db.select().from(users).where(eq(users.id, data.userId));
    const user = userList[0];
    if (!user) throw new Error("User not found");

    const ref = generateRef(data.provider);

    // Update user balance
    await db.update(users)
      .set({ balance: user.balance + Number(data.amount) })
      .where(eq(users.id, user.id));

    // Record transaction
    await db.insert(transactions).values({
      userId: data.userId,
      type: "DEPOSIT",
      amount: Number(data.amount),
      currency: data.currency,
      provider: data.provider,
      reference: ref,
      phoneNumber: data.phoneNumber,
      status: "SUCCESS",
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, reference: ref, newBalance: user.balance + Number(data.amount) };
  } catch (error: any) {
    console.error("Error depositing mobile money:", error);
    return { success: false, error: error.message };
  }
}

// 7. Mobile Money Withdrawal Simulation
export async function withdrawMobileMoney(data: {
  userId: number;
  amount: number;
  currency: string;
  provider: string;
  phoneNumber: string;
}) {
  try {
    await authedUser(data.userId); // NIST PROTECT

    // POLICY ENFORCEMENT: Validate through policy engine
    const validation = await validateWithdrawal({
      userId: data.userId,
      amount: data.amount,
      channel: "WEB",
    });

    if (!validation.allowed) {
      return { success: false, error: validation.error || "Withdrawal not allowed" };
    }

    const userList = await db.select().from(users).where(eq(users.id, data.userId));
    const user = userList[0];
    if (!user) throw new Error("User not found");

    const ref = generateRef(data.provider);

    // Update balance
    await db.update(users)
      .set({ balance: user.balance - Number(data.amount) })
      .where(eq(users.id, user.id));

    // Record transaction
    await db.insert(transactions).values({
      userId: data.userId,
      type: "WITHDRAWAL",
      amount: Number(data.amount),
      currency: data.currency,
      provider: data.provider,
      reference: ref,
      phoneNumber: data.phoneNumber,
      status: "SUCCESS",
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, reference: ref, newBalance: user.balance - Number(data.amount) };
  } catch (error: any) {
    console.error("Error withdrawing mobile money:", error);
    return { success: false, error: error.message };
  }
}

// 8. Fetch User Transactions
export async function getUserTransactions(userId: number) {
  try {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

// 9. Fetch User Predictions
export async function getUserPredictions(userId: number) {
  try {
    const rows = await db.select({
      prediction: predictions,
      marketTitle: markets.title,
      marketStatus: markets.status,
      winningOutcome: markets.winningOutcome,
    })
    .from(predictions)
    .innerJoin(markets, eq(predictions.marketId, markets.id))
    .where(eq(predictions.userId, userId))
    .orderBy(desc(predictions.createdAt));

    return rows;
  } catch (error) {
    console.error("Error fetching user predictions:", error);
    return [];
  }
}

// 10. Fetch all Chamas
export async function getChamas() {
  try {
    const rows = await db.select({
      chama: chamaPools,
      marketTitle: markets.title,
    })
    .from(chamaPools)
    .innerJoin(markets, eq(chamaPools.marketId, markets.id))
    .orderBy(desc(chamaPools.createdAt));

    return rows;
  } catch (error) {
    console.error("Error fetching chamas:", error);
    return [];
  }
}

// 11. Create a Chama (Group prediction pool)
export async function createChama(data: {
  name: string;
  marketId: number;
  code: string;
  targetOutcome: string;
  userId: number;
  contribution: number;
  currency: string;
}) {
  try {
    await authedUser(data.userId); // NIST PROTECT
    // Check balance
    const userList = await db.select().from(users).where(eq(users.id, data.userId));
    const user = userList[0];
    if (!user) throw new Error("User not found");
    if (user.balance < data.contribution) {
      throw new Error(`Insufficient balance to start Chama pool with ${data.contribution} ${data.currency}`);
    }

    // Deduct user balance
    await db.update(users)
      .set({ balance: user.balance - data.contribution })
      .where(eq(users.id, user.id));

    // Create Chama pool
    const newChama = await db.insert(chamaPools).values({
      name: data.name,
      marketId: data.marketId,
      code: data.code.toUpperCase().replace(/\s+/g, ""),
      targetOutcome: data.targetOutcome,
      totalAmount: data.contribution,
      currency: data.currency,
    }).returning();

    // Create Member record
    await db.insert(chamaMembers).values({
      chamaId: newChama[0].id,
      userId: data.userId,
      contribution: data.contribution,
    });

    // Record wallet purchase transaction
    await db.insert(transactions).values({
      userId: data.userId,
      type: "PREDICT_BUY",
      amount: data.contribution,
      currency: data.currency,
      provider: "WALLET",
      reference: generateRef("WALLET"),
      phoneNumber: user.phoneNumber,
      status: "SUCCESS",
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, chama: newChama[0] };
  } catch (error: any) {
    console.error("Error creating chama:", error);
    return { success: false, error: error.message };
  }
}

// 12. Join / Contribute to a Chama
export async function joinChama(data: {
  code: string;
  userId: number;
  contribution: number;
}) {
  try {
    await authedUser(data.userId); // NIST PROTECT
    const cleanCode = data.code.toUpperCase().replace(/\s+/g, "");
    
    // Find Chama
    const chamaList = await db.select().from(chamaPools).where(eq(chamaPools.code, cleanCode));
    const chama = chamaList[0];
    if (!chama) throw new Error("Chama with this code does not exist. Please check the code and try again.");

    // Find User
    const userList = await db.select().from(users).where(eq(users.id, data.userId));
    const user = userList[0];
    if (!user) throw new Error("User not found");

    if (user.balance < data.contribution) {
      throw new Error(`Insufficient wallet balance. You need ${data.contribution} ${chama.currency}, but you only have ${user.balance} ${chama.currency}.`);
    }

    // Deduct user balance
    await db.update(users)
      .set({ balance: user.balance - data.contribution })
      .where(eq(users.id, user.id));

    // Add member contribution
    await db.insert(chamaMembers).values({
      chamaId: chama.id,
      userId: data.userId,
      contribution: data.contribution,
    });

    // Update Chama pool total
    await db.update(chamaPools)
      .set({ totalAmount: chama.totalAmount + data.contribution })
      .where(eq(chamaPools.id, chama.id));

    // Record transaction
    await db.insert(transactions).values({
      userId: data.userId,
      type: "PREDICT_BUY",
      amount: data.contribution,
      currency: chama.currency,
      provider: "WALLET",
      reference: generateRef("WALLET"),
      phoneNumber: user.phoneNumber,
      status: "SUCCESS",
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, chama };
  } catch (error: any) {
    console.error("Error joining chama:", error);
    return { success: false, error: error.message };
  }
}

// 13. Admin Resolve Market
export async function resolveMarket(marketId: number, winningOutcome: string): Promise<{ success: boolean; winningPredictionsCount?: number; winningChamasCount?: number; error?: string }> {
  try {
    await authedUser(); // NIST PROTECT: admin action requires authenticated session
    const result = await withTransaction(async () => {
      // 1. Fetch market
      const marketList = await db.select().from(markets).where(eq(markets.id, marketId));
      const market = marketList[0];
      if (!market) throw new Error("Market not found");
      if (market.status !== "OPEN") throw new Error("Market is already resolved");

      // 2. Update market status
      await db.update(markets)
        .set({ status: "RESOLVED", winningOutcome })
        .where(eq(markets.id, marketId));

      // 3. Find winning predictions
      const winningPredictions = await db.select()
        .from(predictions)
        .where(and(eq(predictions.marketId, marketId), eq(predictions.outcome, winningOutcome)));

      // 4. Payout individual predictions
      for (const pred of winningPredictions) {
        const predUserList = await db.select().from(users).where(eq(users.id, pred.userId));
        const predUser = predUserList[0];
        if (predUser) {
          await db.update(users)
            .set({ balance: predUser.balance + pred.potentialPayout })
            .where(eq(users.id, predUser.id));

          await db.insert(transactions).values({
            userId: predUser.id,
            type: "PREDICT_PAYOUT",
            amount: pred.potentialPayout,
            currency: pred.currency,
            provider: "WALLET",
            reference: generateRef("WALLET"),
            phoneNumber: predUser.phoneNumber,
            status: "SUCCESS",
          });
        }
      }

      // 5. Payout winning Chamas
      const winningChamas = await db.select()
        .from(chamaPools)
        .where(and(eq(chamaPools.marketId, marketId), eq(chamaPools.targetOutcome, winningOutcome)));

      const odds = winningOutcome === "YES" ? market.oddsYes : market.oddsNo;

      for (const chama of winningChamas) {
        const members = await db.select().from(chamaMembers).where(eq(chamaMembers.chamaId, chama.id));
        for (const member of members) {
          const memberUserList = await db.select().from(users).where(eq(users.id, member.userId));
          const memberUser = memberUserList[0];
          if (memberUser) {
            const payoutAmount = Math.round(member.contribution * odds);
            await db.update(users)
              .set({ balance: memberUser.balance + payoutAmount })
              .where(eq(users.id, memberUser.id));
            await db.insert(transactions).values({
              userId: memberUser.id,
              type: "PREDICT_PAYOUT",
              amount: payoutAmount,
              currency: chama.currency,
              provider: "WALLET",
              reference: generateRef("WALLET") + "-CHAMA",
              phoneNumber: memberUser.phoneNumber,
              status: "SUCCESS",
            });
          }
        }
      }

      revalidatePath("/dashboard");
    revalidatePath("/");
      return { success: true, winningPredictionsCount: winningPredictions.length, winningChamasCount: winningChamas.length };
    });
    return result;
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    logger.log(LogLevel.ERROR, `Market resolution failed: ${errorMsg}`, {
      metadata: { marketId, winningOutcome },
    });
    console.error("Error resolving market:", err);
    return { success: false, error: errorMsg };
  }
}

// 14. USSD Gateway Simulation Engine
// It processes a raw input string like "1*250" or "4" and returns the updated menu state
export async function processUSSDInput(sessionState: string, userInput: string, activeUserId: number) {
  // Retrieve user to know balance & phone number
  const user = await getUserById(activeUserId);
  if (!user) {
    return {
      menuText: "CON Arena Prediction Market\nError: User session not found. Please log in on the Web view first.",
      shouldClose: true,
      nextState: ""
    };
  }

  const currency = user.currency;

  // Split steps to parse what the user has typed so far
  let fullInput = sessionState ? `${sessionState}*${userInput}` : userInput;
  // Clean empty values
  if (!sessionState && userInput === "") {
    fullInput = "";
  }
  
  const steps = fullInput ? fullInput.split("*").filter(x => x !== "") : [];

  // USSD Menu Levels:
  // Root Menu (steps.length === 0):
  // 1. Predict a Live Market
  // 2. Deposit Funds (M-Pesa/MTN MoMo)
  // 3. Check Wallet Balance
  // 4. View Active Chamas
  // 5. My Active Predictions

  if (steps.length === 0) {
    return {
      menuText: `CON Karibu Arena Predictions!\nSelect option:\n1. Live Markets\n2. Deposit Funds\n3. Check Balance\n4. View Chamas\n5. My Predictions`,
      shouldClose: false,
      nextState: ""
    };
  }

  const rootChoice = steps[0];

  // 1. LIVE MARKETS
  if (rootChoice === "1") {
    const openMarkets = await db.select().from(markets).where(eq(markets.status, "OPEN")).limit(3);
    
    // Sub-option: Pick Market
    if (steps.length === 1) {
      let textMenu = "CON Select a Local Market to Predict:\n";
      openMarkets.forEach((m, idx) => {
        textMenu += `${idx + 1}. ${m.title.substring(0, 35)}...\n`;
      });
      return {
        menuText: textMenu,
        shouldClose: false,
        nextState: "1"
      };
    }

    const marketIndex = parseInt(steps[1]) - 1;
    const selectedMarket = openMarkets[marketIndex];
    if (!selectedMarket) {
      return {
        menuText: "END Invalid choice. Market not found.",
        shouldClose: true,
        nextState: ""
      };
    }

    // Sub-option: Select Outcome (YES or NO)
    if (steps.length === 2) {
      return {
        menuText: `CON ${selectedMarket.title.substring(0, 50)}...\nOdds: Yes(${selectedMarket.oddsYes}), No(${selectedMarket.oddsNo})\nSelect outcome:\n1. Back YES\n2. Back NO`,
        shouldClose: false,
        nextState: `1*${steps[1]}`
      };
    }

    const outcomeChoice = steps[2];
    const outcomeStr = outcomeChoice === "1" ? "YES" : "NO";

    // Sub-option: Enter prediction amount
    if (steps.length === 3) {
      return {
        menuText: `CON Enter amount in ${currency} (Min 100):\nYour balance: ${user.balance} ${currency}`,
        shouldClose: false,
        nextState: `1*${steps[1]}*${steps[2]}`
      };
    }

    const rawAmount = parseInt(steps[3]);
    if (isNaN(rawAmount) || rawAmount < 100) {
      return {
        menuText: `END Invalid amount. Min prediction is 100 ${currency}.`,
        shouldClose: true,
        nextState: ""
      };
    }

    if (rawAmount > user.balance) {
      return {
        menuText: `END Insufficient funds. Your balance is ${user.balance} ${currency}.\nPlease deposit first.`,
        shouldClose: true,
        nextState: ""
      };
    }

    // Sub-option: Confirm
    if (steps.length === 4) {
      const odd = outcomeStr === "YES" ? selectedMarket.oddsYes : selectedMarket.oddsNo;
      const potentialPayout = Math.round(rawAmount * odd);
      return {
        menuText: `CON Confirm prediction:\nMarket: ${selectedMarket.title.substring(0, 30)}...\nOutcome: ${outcomeStr}\nAmount: ${rawAmount} ${currency}\nEst Payout: ${potentialPayout} ${currency}\n1. Confirm & Predict\n2. Cancel`,
        shouldClose: false,
        nextState: `1*${steps[1]}*${steps[2]}*${steps[3]}`
      };
    }

    const confirmChoice = steps[4];
    if (confirmChoice === "1") {
      // Execute the prediction
      const result = await placePrediction({
        userId: user.id,
        marketId: selectedMarket.id,
        outcome: outcomeStr,
        amount: rawAmount,
        currency: currency,
        platform: "USSD"
      });

      if (result.success) {
        return {
          menuText: `END Safi sana! Prediction placed successfully.\nRef: ${generateRef("WALLET")}\nYour new balance is ${user.balance - rawAmount} ${currency}.\nGood luck!`,
          shouldClose: true,
          nextState: ""
        };
      } else {
        return {
          menuText: `END Error: ${result.error}`,
          shouldClose: true,
          nextState: ""
        };
      }
    } else {
      return {
        menuText: "END Prediction cancelled. Ahsante!",
        shouldClose: true,
        nextState: ""
      };
    }
  }

  // 2. DEPOSIT FUNDS
  if (rootChoice === "2") {
    const provider = currency === "KES" ? "M-PESA" : (currency === "UGX" || currency === "RWF" ? "MTN_MOMO" : "AIRTEL_MONEY");
    
    if (steps.length === 1) {
      return {
        menuText: `CON Deposit via ${provider}\nEnter amount to deposit in ${currency}:\n(Funds will be simulated instantly on approval)`,
        shouldClose: false,
        nextState: "2"
      };
    }

    const depositAmount = parseInt(steps[1]);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return {
        menuText: `END Invalid amount. Try again.`,
        shouldClose: true,
        nextState: ""
      };
    }

    // Commit Deposit
    const depositResult = await depositMobileMoney({
      userId: user.id,
      amount: depositAmount,
      currency: currency,
      provider: provider,
      phoneNumber: user.phoneNumber
    });

    if (depositResult.success) {
      return {
        menuText: `END M-Pesa STK Push simulated!\nReceived reference ${depositResult.reference}.\nAdded ${depositAmount} ${currency} to wallet.\nNew balance is ${depositResult.newBalance} ${currency}.`,
        shouldClose: true,
        nextState: ""
      };
    } else {
      return {
        menuText: `END Deposit failed: ${depositResult.error}`,
        shouldClose: true,
        nextState: ""
      };
    }
  }

  // 3. CHECK BALANCE
  if (rootChoice === "3") {
    return {
      menuText: `END Jambo ${user.name}!\nYour current active wallet balance is:\n${user.balance.toLocaleString()} ${currency}\nRegistered No: ${user.phoneNumber}\nThank you for using Arena Africa.`,
      shouldClose: true,
      nextState: ""
    };
  }

  // 4. VIEW ACTIVE CHAMAS
  if (rootChoice === "4") {
    const activeChamas = await getChamas();
    if (steps.length === 1) {
      if (activeChamas.length === 0) {
        return {
          menuText: "END No active Chamas found. Create one online!",
          shouldClose: true,
          nextState: ""
        };
      }

      let menuTxt = "CON Live Chama Pools:\n";
      activeChamas.slice(0, 3).forEach((c, idx) => {
        menuTxt += `${idx + 1}. ${c.chama.name} (${c.chama.totalAmount} ${c.chama.currency})\n`;
      });
      return {
        menuText: menuTxt,
        shouldClose: false,
        nextState: "4"
      };
    }

    const chamaIdx = parseInt(steps[1]) - 1;
    const selectedC = activeChamas[chamaIdx];
    if (!selectedC) {
      return {
        menuText: "END Invalid Chama option chosen.",
        shouldClose: true,
        nextState: ""
      };
    }

    return {
      menuText: `END Chama: ${selectedC.chama.name}\nTopic: ${selectedC.marketTitle.substring(0, 30)}...\nBacking Outcome: ${selectedC.chama.targetOutcome}\nTotal Pooled: ${selectedC.chama.totalAmount} ${selectedC.chama.currency}\nShare code: ${selectedC.chama.code} to let friends join via web.`,
      shouldClose: true,
      nextState: ""
    };
  }

  // 5. MY ACTIVE PREDICTIONS
  if (rootChoice === "5") {
    const userPreds = await getUserPredictions(user.id);
    if (userPreds.length === 0) {
      return {
        menuText: `END Jambo! You have not placed any predictions yet. Check options 1 to place one!`,
        shouldClose: true,
        nextState: ""
      };
    }

    let pText = "END Your Active Predictions:\n";
    userPreds.slice(0, 3).forEach((p, idx) => {
      pText += `${idx + 1}. ${p.prediction.outcome} on "${p.marketTitle.substring(0, 20)}..." (Amt: ${p.prediction.amount} ${p.prediction.currency})\n`;
    });
    return {
      menuText: pText,
      shouldClose: true,
      nextState: ""
    };
  }

  // Fallback
  return {
    menuText: "END Option not implemented. Please check again later.",
    shouldClose: true,
    nextState: ""
  };
}
