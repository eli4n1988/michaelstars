# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Hebrew (RTL) star reward chart app for children. Parents award or remove stars, and the child can redeem stars for rewards. Built with React + TypeScript + Vite.

## Running

```bash
npm install
npm run dev      # Dev server with HMR
npm run build    # Production build to dist/
```

The original vanilla JS version is preserved in `stars.html`.

## Architecture

React + TypeScript SPA using Vite. No UI libraries — plain CSS.

### File Structure

```
src/
  main.tsx                     # Entry point
  App.tsx                      # Root component — all state, conditional onboarding vs main app
  App.css                      # All CSS (extracted from original stars.html)
  types.ts                     # TypeScript interfaces (AppState, AppConfig, Reward, etc.)
  constants.ts                 # ALL_REWARDS catalog, storage keys
  hooks/
    useLocalStorage.ts         # Generic localStorage<->useState sync
    useSound.ts                # Web Audio API sound hook
  components/
    Onboarding.tsx             # 3-step wizard (name, password, prizes)
    StarCounter.tsx            # Big star number display
    StarActions.tsx            # Add/remove star buttons
    StarGrid.tsx               # Visual grid of star emojis
    RewardCard.tsx             # Single reward card with pips + claim button
    RewardsSection.tsx         # Maps active rewards to RewardCards
    HistorySection.tsx         # History list with delete buttons
    ParentZone.tsx             # Reset stars button
    ParentApprovalModal.tsx    # Mama/abba approval modal
    PasswordModal.tsx          # Password entry for protected actions
    Celebration.tsx            # Confetti overlay
    FloatingStar.tsx           # Floating star animation
```

### State Management

- No Redux/Context — simple props + `useState` (tree is only 2-3 levels deep)
- `useLocalStorage` hook for persistent state (`AppState` under key `starRewardsApp`, `AppConfig` under key `starRewardsConfig`)
- `useRef` for `pendingPasswordAction` callback (avoids stale closures)
- All state lives in `App.tsx` and is passed down via props

### Key Behaviors

- **Parent approval modal**: Adding/removing a star requires confirming via a modal (choose mama or abba)
- **Password protection**: Reset stars and delete history require parent password
- **Rewards system**: Defined in `ALL_REWARDS` constant. Active rewards filtered by config. Claiming deducts stars and logs to history (capped at 20 entries)
- **Visual feedback**: CSS animations for star pop-in, floating star on add, confetti on reward claim, Web Audio API sound effects
- **Onboarding**: 3-step wizard on first use (child name, parent password, prize selection)

## Key Conventions

- Language is Hebrew; the page uses `dir="rtl"` on `<html>` in `index.html`
- localStorage keys: `starRewardsApp` (state), `starRewardsConfig` (config)
- `deleteHistory` looks up reward cost in `ALL_REWARDS` by name for star refund
