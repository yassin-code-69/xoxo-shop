import { NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "../../../lib/rateLimit";

// Every call here can spend Gemini quota, so it is capped per IP.
const MAX_MESSAGES_PER_MINUTE = 12;
const MAX_MESSAGE_LENGTH = 2000;

const SYSTEM_PROMPT =`You are the official AI Support Assistant for "XoXo Shop" (xoxoshop.com), the most trusted and fastest automated Free Fire diamond top-up platform in Bangladesh.

Shop Features & Knowledge:
1. UID Topup: 100% safe, fast, automated diamond top-up via Free Fire Player UID. Delivery takes 1 to 5 minutes after payment verification.
2. Available Packages:
   - UID Diamonds: 115, 240, 355, 480, 610, 1240, 2530, 5060 Diamonds.
   - Memberships: Weekly Membership (450 diamonds), Monthly Membership (2600 diamonds).
   - Passes: Level Up Pass (800 diamonds), Weekly Lite (50/150 diamonds).
   - Special: FF Likes (200, 500, 1000 likes), Indonesia Server topup.
3. Payment Methods:
   - bKash, Nagad, Rocket (Personal Send Money).
   - How to Pay: Send exact amount to the given number -> Copy 8-10 character Transaction ID (TrxID) -> Paste TrxID in the payment confirmation page -> Order completes automatically.
4. Support & Safety:
   - 24/7 Order processing, Active Telegram support: @xoxoshop_support.
   - Strict policy: 18+ only, no unauthorized transactions.
5. Tone & Language:
   - Be helpful, polite, and reassuring.
   - Reply in Bengali (Bangla) if the user asks in Bengali or Banglish, and in English if asked in English.
   - Keep answers clear, structured, and easy to read.`;

export async function POST(req: Request) {
  try {
    if (isRateLimited(`chat:${getClientIp(req)}`, MAX_MESSAGES_PER_MINUTE, 60_000)) {
      return NextResponse.json(
        {
          reply:
            "একটু ধীরে! কিছুক্ষণ পর আবার মেসেজ করুন, অথবা সরাসরি [Telegram Support](https://t.me/xoxoshop_support) এ যোগাযোগ করুন।",
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const lastUserMessage = String(messages[messages.length - 1]?.content ?? "").slice(
      0,
      MAX_MESSAGE_LENGTH,
    );
    const apiKey = process.env.GEMINI_API_KEY || "";
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (apiKey) {
      try {
        // Call Google Gemini REST API
        // Try requested model, with fallback models if needed
        const candidateModels = [model, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
        let geminiResponse: any = null;
        let lastError: any = null;

        for (const candidate of Array.from(new Set(candidateModels))) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`;
            const contents = [
              {
                role: "user",
                parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Question:\n${lastUserMessage}` }],
              },
            ];

            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents,
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 800,
                },
              }),
            });

            if (res.ok) {
              geminiResponse = await res.json();
              break;
            } else {
              lastError = await res.text();
            }
          } catch (e) {
            lastError = e;
          }
        }

        if (geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const text = geminiResponse.candidates[0].content.parts[0].text;
          return NextResponse.json({ reply: text, source: "gemini" });
        }
        console.warn(
          "Gemini API call returned unparsed response, falling back to local engine:",
          lastError,
        );
      } catch (geminiErr) {
        console.error("Gemini invocation error, using smart local assistant:", geminiErr);
      }
    }

    // Smart Local Knowledge Engine fallback for XoXo Shop
    const lower = lastUserMessage.toLowerCase();
    let reply = "";

    if (
      lower.includes("uid") ||
      lower.includes("topup") ||
      lower.includes("টপআপ") ||
      lower.includes("ডায়মন্ড")
    ) {
      reply = `**💎 Free Fire UID Top-Up করার সহজ নিয়ম:**
1. ওয়েবসাইটের **Topup** মেনু বা [UID Topup](/uid-topup) পেজে যান।
2. আপনার পছন্দের ডায়মন্ড প্যাকেজ সিলেক্ট করুন (যেমন: 115, 240, 610 Diamonds)।
3. আপনার **Free Fire Player UID** সঠিক ভাবে লিখুন।
4. পেমেন্ট মেথড (bKash / Nagad / Rocket) সিলেক্ট করে **Proceed to Pay** বাটনে ক্লিক করুন।
5. টাকা পাঠিয়ে **Transaction ID (TrxID)** সাবমিট করলেই ১-৫ মিনিটের মধ্যে ডায়মন্ড পৌঁছে যাবে! 🚀`;
    } else if (
      lower.includes("payment") ||
      lower.includes("পেমেন্ট") ||
      lower.includes("bkash") ||
      lower.includes("nagad") ||
      lower.includes("বিকাশ") ||
      lower.includes("নগদ") ||
      lower.includes("rocket") ||
      lower.includes("টাকা")
    ) {
      reply = `**💳 পেমেন্ট করার নিয়মাবলী:**
• আমাদের সাপোর্টেড পেমেন্ট মেথড: **bKash**, **Nagad**, এবং **Rocket** (Personal Send Money)।
• অর্ডারের সময় উল্লেখিত একাউন্ট নাম্বারে নির্ধারিত টাকা Send Money করুন।
• টাকা পাঠানোর পর SMS-এ আসা **Transaction ID (TrxID)** টি কপি করে পেমেন্ট বক্সে পেস্ট করে **Verify** বাটনে চাপুন।
• অটোমেটিক বা অ্যাডমিন ভেরিফিকেশনের পর সাথে সাথে অর্ডার ডেলিভারি সম্পন্ন হবে!`;
    } else if (
      lower.includes("time") ||
      lower.includes("সময়") ||
      lower.includes("somoy") ||
      lower.includes("koto khon") ||
      lower.includes("কতক্ষণ") ||
      lower.includes("late")
    ) {
      reply = `**⏱️ ডায়মন্ড ডেলিভারি সময়:**
• সাধারণ সময়ে পেমেন্ট সাবমিটের পর **১ থেকে ৫ মিনিটের মধ্যে** ডায়মন্ড সরাসরি ফ্রি ফায়ার আইডিতে যুক্ত হয়ে যায়।
• গ্যারেনা সার্ভার রক্ষণাবেক্ষণ বা ট্রাফিক থাকলে সর্বোচ্চ ১০-১৫ মিনিট সময় লাগতে পারে।
• অর্ডার ট্র্যাকিং এর জন্য আপনার [My Orders](/orders) পেজ চেক করুন।`;
    } else if (
      lower.includes("contact") ||
      lower.includes("support") ||
      lower.includes("হেল্প") ||
      lower.includes("কথা") ||
      lower.includes("telegram") ||
      lower.includes("admin")
    ) {
      reply = `**📞 কাস্টমার সাপোর্ট ও হেল্পলাইন:**
• আমাদের অফিসিয়াল টেলিগ্রাম সাপোর্ট: [@xoxoshop_support](https://t.me/xoxoshop_support)
• সাপোর্ট সময়: প্রতিদিন সকাল ৯:০০ AM থেকে রাত ১২:০০ PM
• যেকোনো সমস্যা বা ভুল UID দিলে দ্রুত টেলিগ্রামে যোগাযোগ করুন!`;
    } else if (
      lower.includes("order") ||
      lower.includes("status") ||
      lower.includes("অর্ডার") ||
      lower.includes("চেক")
    ) {
      reply = `**📦 আপনার অর্ডার ট্র্যাক করতে:**
• আপনার একাউন্টে লগইন করে [Profile](/profile) অথবা [My Orders](/orders) পেজে যান।
• সেখানে আপনার সাম্প্রতিক অর্ডারের স্ট্যাটাস (Pending, Processing, Completed) দেখতে পাবেন।`;
    } else if (
      lower.includes("hi") ||
      lower.includes("hello") ||
      lower.includes("হাই") ||
      lower.includes("হ্যালো") ||
      lower.includes("help") ||
      lower.includes("আসসালামু আলাইকুম")
    ) {
      reply = `হ্যালো! **XoXo Shop**-এ আপনাকে স্বাগতম! 🎮
আমি আপনার স্মার্ট এআই অ্যাসিস্ট্যান্ট। Free Fire UID Topup, অফার প্যাকেজ, অথবা পেমেন্ট সংক্রান্ত যেকোনো তথ্যে সাহায্য করতে পারি। আপনি কীভাবে সাহায্য চান বলুন?`;
    } else {
      reply = `ধন্যবাদ আপনার মেসেজের জন্য! **XoXo Shop** এ Free Fire UID টপআপ সবচেয়ে দ্রুত ও নিরাপদ। 
• সরাসরি ডায়মন্ড কিনতে [UID Topup](/uid-topup) এ যান।
• আপনার অর্ডার চেক করতে [My Orders](/orders) এ যান।
• জরুরি সহযোগিতায় আমাদের [Telegram Support](https://t.me/xoxoshop_support) এ মেসেজ দিন।`;
    }

    return NextResponse.json({ reply, source: apiKey ? "gemini-fallback" : "local-knowledge" });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        reply:
          "দুঃখিত, এই মুহূর্তে সার্ভারে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা আমাদের টেলিগ্রাম সাপোর্টে যোগাযোগ করুন।",
      },
      { status: 500 },
    );
  }
}
