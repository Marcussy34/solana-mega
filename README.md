# 📚💸 SkillStreak – Learn, Earn & Build Habits on Solana  
**A gamified Learn-to-Earn app combining education, DeFi yield, and behavioral finance.**

---

## 🧠 Overview

**SkillStreak** is a **Learn-to-Earn DeFi app** on **Solana** that helps users develop real-world skills while earning yield on their capital. Users deposit **USDC**, choose a learning track (like crypto, coding, or language skills), and complete **daily tasks** to earn up to **30% APR**.

It's designed to **gamify consistency** with **streaks**, **top-up penalties**, and a DeFi-powered reward system that builds both habit and capital. Think **Duolingo meets DeFi**, with **financial stakes for personal growth**.

---

## 🧩 Core Concept

- 💰 Lock up USDC → 📚 Learn daily → 🏆 Earn interest
- Miss a day? Pay a small penalty to stay in—or risk deductions.
- The **more consistent you are**, the **more you earn**.
- Users can even **bet on each other's performance** with a **Long/Short streak market**.

---

## 🔥 Key Features

### ✅ 1. **USDC Deposits + DeFi Yield**
- Users deposit **USDC** into the app and select a **lock-in period** (1–12 months).
- Yield is generated through **Solana DeFi protocols** (e.g., Kamino, MarginFi).
- **APR scales** with streak performance and duration, up to **30%**.

---

### 📚 2. **Daily Learning Tasks**
- Users pick a track:
  - "Solana Basics"
  - "Rust for Smart Contracts"
  - "Duolingo-style Language Learning" *(in-app simulation)*
- Completing a task each day **maintains your streak**.
- Streak = yield multiplier + reputation boost.

---

### 🔥 3. **Streak-Based Penalty System**

| Miss Count | What Happens                                    |
|------------|-------------------------------------------------|
| 1st Miss   | Top-up 10% of deposit (split: 50% to app, 50% to user balance) |
| 2nd Miss   | Top-up 20%                                      |
| 3rd Miss   | Top-up 30%                                      |
| 4th+ Misses| No top-up? → Deduct 20–30% of deposit, halve APR |

- Penalties are designed to create **healthy pressure** and **accountability**.
- Encourages long-term discipline like a savings goal with educational benefits.

---

### 🔓 4. **Flexible Withdrawal Options**
- At the end of lock-in: get **full balance + earned interest**.
- Early withdrawal allowed: **5% exit fee**, but keep accrued interest.
- Transparency and flexibility built in for real-life needs.

---

## 🧠 Bonus Feature (Simulated for MVP)

### 🗣️ **Duolingo-style Language Track**
- Fully integrated second learning track that mimics Duolingo's micro-lessons.
- Designed to showcase **multi-track support** and **fun UX**.
- Sets the stage for future **third-party learning integrations**.

---

## 📈 Long/Short Streaks – *Social Speculation Layer*

**A new game layer:** Let users **bet on each other's consistency.**

### How it Works:
- **"Long" someone** → You think they'll keep their streak.
- **"Short" someone** → You think they'll break it.
- You stake USDC on your prediction (e.g., 10 USDC).
- Outcome determined by user's streak performance.

#### MVP Implementation:
- Built on **Solana Devnet** using **Anchor smart contracts**.
- Outcomes are **hardcoded** in demo mode.
- Correct predictions = earn 1.5x or more.
- All bets are **on-chain**, trustless, and transparent.

#### Future Vision:
- Reputation system for bettable users.
- Leaderboards for top performers and bettors.
- Dynamic odds + fee splits.

---

## 🌐 Future Platform Integrations

- OAuth or extension-based connections to:
  - **Duolingo**
  - **Udemy**
  - **Oracle Academy**
  - **Khan Academy**
- Allow users to **sync external learning streaks** into the platform.
- Verification via **browser extension**, API hooks, or quizzes.

---

## 💸 Ecosystem Funding Model

- Platform earns revenue from:
  - **Top-up penalties** (50% to app treasury)
  - **Missed-streak deductions**
  - **Early withdrawal fees**
  - **Optional yield spread from DeFi integrations**
- Revenue goes toward:
  - Expanding content and learning tracks
  - Funding user rewards
  - Supporting protocol growth and sustainability

---

## 🛠️ Tech Stack

### ⚛️ Frontend
- **Next.js (no TypeScript)**
- **Tailwind CSS** – UI
  - Using v3 (`^3.4.17`) for compatibility with HeroUI.
  - Configured in `tailwind.config.js` and `postcss.config.js`.
  - Base styles included in `styles/globals.css`.
- **HeroUI (`@heroui/react` ^2.7.6)** - Component library
  - Requires Tailwind CSS v3.
  - `HeroUIProvider` wraps the application in `pages/_app.js`.
  - Tailwind plugin configured via `@heroui/theme/plugin` in `tailwind.config.js`.
  - `tailwind.config.js` `content` array includes paths to `@heroui/theme/dist` and individual component packages (e.g., `@heroui/button/dist`).
  - Components should be imported from their specific packages (e.g., `import { Button } from "@heroui/button";`).
  - Dark/Light mode theme requires `className="dark"` or `className="light"` on the `<html>` tag (added in `pages/_document.js`).
- **Framer Motion** – animations
- **Solana Wallet Adapter** – for Phantom, Backpack, etc.

### 🔗 Blockchain & DeFi
- **Solana Devnet**
- **USDC (SPL token)**
- **Anchor Framework** – for on-chain logic (long/short system)
- **DeFi Protocols** (e.g., Kamino, MarginFi) – for real yield (future)

### 🔧 Backend / Infra
- **Supabase** – for user streaks, deposits, history
- **CRON Jobs** – for streak validation
- **Firebase** – as an alternative backend stack
- **Vercel** – frontend deployment

---

## 📁 Key Directory Structure (MVP)

```bash
/pages           # Main pages (task view, dashboard, etc.)
/components      # UI components (cards, modals, charts)
/utils           # Logic for streaks, APR, penalties
/hooks           # State and wallet hooks
/contracts       # Solana programs (Anchor smart contracts)
```

---

## 🔮 Vision & Roadmap

- 🌐 Multi-platform learning: Bring in any platform via plug-ins.
- 📊 On-chain credentials: NFT badges for streaks, proof-of-skill.
- 🎮 Gamified UX: Leaderboards, achievements, collectibles.
- 🤝 Community challenges: Weekly quests, cohort-based learning.
- 📱 Mobile-first design: Habit stackers on the go.

---

## 🎯 Why It Matters

SkillStreak addresses real problems:
- Builds motivation and discipline in online learning
- Makes DeFi yield meaningful and behavior-based
- Bridges **Web3**, **education**, and **gamification** into one flow
- Aligns **capital**, **habits**, and **growth** like never before

---

## 🚀 Status

- MVP learning track: ✅  
- USDC staking & yield logic: ✅  
- Streak management: ✅  
- Simulated Duolingo track: ✅  
- Long/Short streak betting (on Devnet): ✅  
- External integration (placeholder): 🔜  
- Full on-chain deployment: 🔜

---

## 👥 Built For

- Habit hackers  
- Crypto learners  
- Builders, devs, and DeFi natives  
- Anyone who wants to **earn while they grow**
