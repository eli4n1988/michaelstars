# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page Hebrew (RTL) star reward chart app for a child ("Michael's Stars"). Parents award or remove stars, and the child can redeem stars for rewards (pizza, movie+popcorn, pool+ice cream). No build system or dependencies — it's one self-contained `stars.html` file.

## Running

Open `stars.html` directly in a browser. No server, build step, or install required.

## Architecture

Everything lives in `stars.html` — HTML structure, CSS styles, and vanilla JavaScript in a single file:

- **State management**: App state (`stars` count + reward `history`) is persisted in `localStorage` under the key `starRewardsApp`.
- **Parent approval modal**: Adding/removing a star requires confirming via a modal (choose "mama" or "abba"). The `pendingAction` variable tracks whether the modal is for an add or remove.
- **Rewards system**: Defined in the `rewards` object (key → name/emoji/cost). Claiming a reward deducts stars and logs to history (capped at 20 entries).
- **Visual feedback**: CSS animations for star pop-in, floating star on add, confetti celebration on reward claim, and Web Audio API sound effects (`playSound`).
- **Rendering**: A single `render()` function re-draws the entire UI from state — star count, star grid, reward card pips/buttons, and history list.

## Key Conventions

- Language is Hebrew; the page uses `dir="rtl"`.
- No framework, no modules — plain DOM manipulation and inline event handlers (`onclick`).
