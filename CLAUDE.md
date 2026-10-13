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

## Teacher Mode

- Every visit starts with a role choice (`RoleSelect`): parent or teacher, unless the URL hash picks one (`#parent`, `#teacher`). A remembered session for that role skips the login; choosing the other role shows its login, which replaces the current session.
- Teacher login screen (`teacher` / `123456`, see `src/constants.ts`) is only a UI gate — it ships in the public bundle. Each teacher device then signs in with Firebase **anonymous auth** (must be enabled in the Firebase console).
- Linking: the parent creates an 8-char code in the dashboard's "מורה" tab → `teacherLinks/{code}` = `{parentUid, childId}`, and the child doc gets `teacherCode`. The teacher device joins by adding its uid to the child's `teacherUids` together with `joinCode` (rules require `joinCode == teacherCode`). Linked students are kept in the device's localStorage (`teacherStudents.v2`). "נתק את כל המורים" clears `teacherUids` and the code.
- Child doc fields written by the teacher: `teacher` (`{name, schedule[6]}`, Sun–Fri lesson counts), `lessonMarks[YYYY-MM-DD][lessonIndex]` (`star` | `bad` + optional note, `seen`), plus `stars`. Teacher marks go through a transaction in `useTeacherChild` and are not logged in `starHistory` (that is the parents' history; the parent dashboard shows teacher stars as a weekly table, `SchoolWeekTable`).
- `firestore.rules` lets a joined teacher `get` the child and update only `stars` (±1 per write), `teacher` and `lessonMarks`. Deploy rules with `firebase deploy --only firestore:rules --project michaelstars-6b4a4`.
