# 📚💸 LockedIn – Learn, Earn & Build Habits on Solana  
**A gamified Learn-to-Earn app combining education, DeFi yield, and behavioral finance.**

---

## 🧠 Overview

**LockedIn** is a **Learn-to-Earn DeFi app** on **Solana** that helps users develop real-world skills while earning yield on their capital. Users deposit **USDC**, choose a learning track (like crypto, coding, or language skills), and complete **daily tasks** to earn up to **30% APR**.

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
  - "English Beginner by Duolingo" 
- Completing a task within 24 hours of last task **maintains your streak**.
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

### 🔓 4. **Withdrawal Options**
- At the end of lock-in: get **full balance + earned interest**.
- Early withdrawal allowed: **50% exit fee**, but keep accrued interest.
- Transparency built in for real-life needs.

---

## 🧠 Bonus Feature

### 🗣️ **Duolingo-style Language Track**
- Fully integrated English track that mimics Duolingo's micro-lessons.
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

#### Implementation:
- Built on **Solana Devnet** using **Anchor smart contracts**.
- Correct predictions = earn up to 200% depending on the pool.
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
- **Next.js (v13.5.4)** 
- **React (v18.2.0)**
- **Tailwind CSS** – UI styling with **tailwindcss-animate**
- **Framer Motion & GSAP** – animations
- **Solana Wallet Adapter** – for Phantom
- **@heroui/react & @tabler/icons-react** – UI components/icons
- **class-variance-authority & clsx** – utility styling

### 🔗 Blockchain & DeFi
- **Solana Devnet**
- **USDC (SPL token)**
- **Anchor Framework (v0.30.0)** – for on-chain logic
- **@solana/web3.js & @solana/spl-token** – Solana interactions
- **DeFi Protocols** (e.g., Kamino, MarginFi) – for real yield (future)

### 🔧 Backend / Infra
- **Anchor-based Solana Program**
- **Vercel** – frontend deployment

---

## 📁 Project Structure

```bash
/frontend
  /pages           # Main pages (index, courses, learn, etc.)
    /course        # Course-specific pages
    /api           # API routes
  /components      # UI components
    /ui            # Shared UI elements
  /hooks           # Custom React hooks
  /styles          # Global styles and Tailwind config
  /lib             # Utility functions and shared logic
  /public          # Static assets

/backend
  /skillstreak_program  # Solana program (Anchor)
    /programs
      /skillstreak_program
        /src        # Main program logic (lib.rs)
    /tests          # Program tests
```

The project is structured into two main directories:
- **Frontend**: Next.js application with React components
- **Backend**: Solana programs written using Anchor framework

---

## 🔮 Vision & Roadmap

- 🌐 Multi-platform learning: Bring in any platform via plug-ins.
- 🎮 Gamified UX: Leaderboards, achievements, collectibles.
- 📊 On-chain credentials: NFT badges for streaks, proof-of-skill.
- 🤝 Community challenges: Weekly quests, cohort-based learning.

---

## 🎯 Why It Matters

LockedIn addresses real problems:
- Builds motivation and discipline in online learning
- Makes DeFi yield meaningful and behavior-based
- Bridges **Web2 education**, **Web3 earning** and **gamification** into one flow
- Aligns **capital**, **habits**, and **growth** like never before

---

## 🚀 Current Status

- ✅ Frontend UI implementation (pages, components)
- ✅ Wallet connection integration
- ✅ Learning track UI implementation (courses, lessons)
- ✅ Initial Solana program structure (Anchor)
- ✅ User initialization flow
- ✅ USDC deposit
- ✅ Streak management 
- ✅ Solana program integration with frontend
- ✅ Long/Short streak betting 
- ✅ Full production deployment
- 🔜 USD Yield Logic (placeholders ready)
- 🔜 External integration (placeholders ready)

---

## 👥 Built For

- Habit hackers  
- Crypto learners  
- Builders, devs, and DeFi natives  
- Anyone who wants to **earn while they grow**

