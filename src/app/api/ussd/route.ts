import { NextRequest, NextResponse } from "next/server";
import { ensureSeeded } from "@/db/seed";
import { db } from "@/db";
import { users, markets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * USSD Gateway API - Compatible with Africa's Talking USSD protocol
 * 
 * POST /api/ussd
 * 
 * Accepts either:
 * - Africa's Talking format: { sessionId, phoneNumber, serviceCode, text }
 * - Custom format: { phoneNumber, text, userId }
 * 
 * Returns: { response: "CON ..." or "END ..." }
 */
export async function POST(request: NextRequest) {
  await ensureSeeded();
  
  try {
    const body = await request.json();
    const { sessionId, phoneNumber, serviceCode, text = "", userId } = body;

    if (!phoneNumber && !userId) {
      return NextResponse.json({ 
        success: false, 
        error: "phoneNumber or userId is required" 
      }, { status: 400 });
    }

    // Find user by phone or ID
    let user;
    if (userId) {
      const userList = await db.select().from(users).where(eq(users.id, Number(userId)));
      user = userList[0];
    } else if (phoneNumber) {
      const userList = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
      user = userList[0];
    }

    if (!user) {
      return NextResponse.json({
        response: "END Arena Prediction Market\nError: Phone number not registered. Visit web portal to sign up."
      });
    }

    const currency = user.currency;
    const steps = text ? text.split("*").filter((x: string) => x !== "") : [];

    // Root Menu
    if (steps.length === 0) {
      return NextResponse.json({
        response: `CON Karibu Arena Predictions!\nSelect option:\n1. Live Markets\n2. Deposit Funds\n3. Check Balance\n4. View Chamas\n5. My Predictions`,
        sessionId,
        serviceCode
      });
    }

    const rootChoice = steps[0];

    // 1. LIVE MARKETS
    if (rootChoice === "1") {
      const openMarkets = await db.select().from(markets).where(eq(markets.status, "OPEN")).limit(3);
      
      if (steps.length === 1) {
        let textMenu = "CON Select a Market to Predict:\n";
        openMarkets.forEach((m, idx) => {
          textMenu += `${idx + 1}. ${m.title.substring(0, 35)}...\n`;
        });
        return NextResponse.json({ response: textMenu, sessionId });
      }

      const marketIndex = parseInt(steps[1]) - 1;
      const selectedMarket = openMarkets[marketIndex];
      if (!selectedMarket) {
        return NextResponse.json({ response: "END Invalid choice. Market not found." });
      }

      if (steps.length === 2) {
        return NextResponse.json({
          response: `CON ${selectedMarket.title.substring(0, 50)}...\nOdds: Yes(${selectedMarket.oddsYes}), No(${selectedMarket.oddsNo})\nSelect outcome:\n1. Back YES\n2. Back NO`,
          sessionId
        });
      }

      const outcomeChoice = steps[2];
      const outcomeStr = outcomeChoice === "1" ? "YES" : "NO";

      if (steps.length === 3) {
        return NextResponse.json({
          response: `CON Enter amount in ${currency} (Min 100):\nYour balance: ${user.balance} ${currency}`,
          sessionId
        });
      }

      const rawAmount = parseInt(steps[3]);
      if (isNaN(rawAmount) || rawAmount < 100) {
        return NextResponse.json({ 
          response: `END Invalid amount. Min prediction is 100 ${currency}.` 
        });
      }

      if (rawAmount > user.balance) {
        return NextResponse.json({ 
          response: `END Insufficient funds. Your balance is ${user.balance} ${currency}.\nPlease deposit first.` 
        });
      }

      if (steps.length === 4) {
        const odd = outcomeStr === "YES" ? selectedMarket.oddsYes : selectedMarket.oddsNo;
        const potentialPayout = Math.round(rawAmount * odd);
        return NextResponse.json({
          response: `CON Confirm prediction:\nMarket: ${selectedMarket.title.substring(0, 30)}...\nOutcome: ${outcomeStr}\nAmount: ${rawAmount} ${currency}\nEst Payout: ${potentialPayout} ${currency}\n1. Confirm & Predict\n2. Cancel`,
          sessionId
        });
      }

      const confirmChoice = steps[4];
      if (confirmChoice === "1") {
        // Call the predictions API internally via dynamic import
        const { placePrediction } = await import("@/app/actions");
        const result = await placePrediction({
          userId: user.id,
          marketId: selectedMarket.id,
          outcome: outcomeStr,
          amount: rawAmount,
          currency,
          platform: "USSD"
        });

        if (result.success) {
          return NextResponse.json({
            response: `END Safi sana! Prediction placed successfully.\nYour new balance is ${user.balance - rawAmount} ${currency}.\nGood luck!`,
            sessionId
          });
        } else {
          return NextResponse.json({
            response: `END Error: ${result.error}`,
            sessionId
          });
        }
      } else {
        return NextResponse.json({
          response: "END Prediction cancelled. Ahsante!",
          sessionId
        });
      }
    }

    // 2. DEPOSIT FUNDS
    if (rootChoice === "2") {
      const provider = currency === "KES" ? "M-PESA" : (currency === "UGX" || currency === "RWF" ? "MTN_MOMO" : "AIRTEL_MONEY");
      
      if (steps.length === 1) {
        return NextResponse.json({
          response: `CON Deposit via ${provider}\nEnter amount to deposit in ${currency}:`,
          sessionId
        });
      }

      const depositAmount = parseInt(steps[1]);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return NextResponse.json({ response: "END Invalid amount. Try again." });
      }

      const { depositMobileMoney } = await import("@/app/actions");
      const depositResult = await depositMobileMoney({
        userId: user.id,
        amount: depositAmount,
        currency,
        provider,
        phoneNumber: user.phoneNumber
      });

      if (depositResult.success) {
        return NextResponse.json({
          response: `END STK Push simulated!\nRef: ${depositResult.reference}.\nAdded ${depositAmount} ${currency}.\nNew balance: ${depositResult.newBalance} ${currency}.`,
          sessionId
        });
      } else {
        return NextResponse.json({
          response: `END Deposit failed: ${depositResult.error}`,
          sessionId
        });
      }
    }

    // 3. CHECK BALANCE
    if (rootChoice === "3") {
      return NextResponse.json({
        response: `END Jambo ${user.name}!\nBalance: ${user.balance.toLocaleString()} ${currency}\nPhone: ${user.phoneNumber}\nThank you for using Arena Africa.`,
        sessionId
      });
    }

    // 4. VIEW CHAMAS
    if (rootChoice === "4") {
      const { getChamas } = await import("@/app/actions");
      const activeChamas = await getChamas();
      
      if (steps.length === 1) {
        if (activeChamas.length === 0) {
          return NextResponse.json({
            response: "END No active Chamas found. Create one online!",
            sessionId
          });
        }

        let menuTxt = "CON Live Chama Pools:\n";
        activeChamas.slice(0, 3).forEach((c, idx) => {
          menuTxt += `${idx + 1}. ${c.chama.name} (${c.chama.totalAmount} ${c.chama.currency})\n`;
        });
        return NextResponse.json({ response: menuTxt, sessionId });
      }

      const chamaIdx = parseInt(steps[1]) - 1;
      const selectedC = activeChamas[chamaIdx];
      if (!selectedC) {
        return NextResponse.json({
          response: "END Invalid Chama option.",
          sessionId
        });
      }

      return NextResponse.json({
        response: `END Chama: ${selectedC.chama.name}\nTopic: ${selectedC.marketTitle.substring(0, 30)}...\nBacking: ${selectedC.chama.targetOutcome}\nTotal: ${selectedC.chama.totalAmount} ${selectedC.chama.currency}\nCode: ${selectedC.chama.code}`,
        sessionId
      });
    }

    // 5. MY PREDICTIONS
    if (rootChoice === "5") {
      const { getUserPredictions } = await import("@/app/actions");
      const userPreds = await getUserPredictions(user.id);
      
      if (userPreds.length === 0) {
        return NextResponse.json({
          response: "END You have not placed any predictions yet.",
          sessionId
        });
      }

      let pText = "END Your Active Predictions:\n";
      userPreds.slice(0, 3).forEach((p, idx) => {
        pText += `${idx + 1}. ${p.prediction.outcome} on "${p.marketTitle.substring(0, 20)}..." (Amt: ${p.prediction.amount} ${p.prediction.currency})\n`;
      });
      return NextResponse.json({ response: pText, sessionId });
    }

    return NextResponse.json({
      response: "END Option not recognized. Please try again.",
      sessionId
    });
  } catch (error: any) {
    return NextResponse.json({
      response: `END System error: ${error.message}`,
      success: false
    }, { status: 500 });
  }
}
