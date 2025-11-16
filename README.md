# <p align="center">🃏 UNO Game (Browser-Based)</p>
<p align="center">A fully client-side, open-source implementation of the classic UNO®-style card game, built in JavaScript for the browser.</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/built_with-JavaScript-yellow?style=flat-square" />
  <img src="https://img.shields.io/github/stars/HarryWarriner/UNO?style=flat-square" />
</p>

---
<p align="center">
  <!-- Replace this path with your actual banner image -->
  <img src="assets\Banner.png" width="80%" alt="UNO Game Banner">
</p>

---

## 📌 Overview

This project is a **browser-based UNO-style card game** built for my computing module at University with:

- A clean, responsive UI
- Support for **multiple players** (human and AI)
- A modular game engine separated from the UI
---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🃏 Full UNO Deck | Standard UNO-style deck with coloured numbers and action cards |
| 🧠 AI Players | Computer-controlled opponents using basic decision logic |
| 👥 Local Multiplayer | Support for multiple players taking turns on one device |
| 🔁 Direction Arrows | Visual arrows showing current direction of play (CW/CCW) |
| 🎨 Responsive UI | Works in modern desktop browsers; easily styled via CSS |
| 🧱 Modular Logic | Game rules isolated in a dedicated logic module |
| 🧪 Testable Core | Core logic structured to be unit-test friendly |

---

## 📚 Table of Contents

- [Play](#-play)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [How to run it yourself](#-how-to-run-it-yourself)
- [Gameplay](#-gameplay)
- [Development](#-development)
- [License](#-license)

---

## 🎥 Play:

Play here:



| Start | 4 Players | Win |
|---------|---------| ---|
|  <img src="assets\start.png"> | <img src="assets\4Players.png"> |  <img src="assets\win.png"> |


## 🧰 Tech Stack

- **Language:** JavaScript
- **Runtime:** Browser (no backend required)
- **Markup & Styles:** HTML5, CSS3
- **Testing (optional):** Vitest / Mocha / Jest 
- **Tooling (optional):** Vite, npm scripts, or simple static hosting

---

## 🧱 Project Structure

Update this to match your repo layout.

```text
uno-game/
├── index.html          # Main HTML entry point
├── style.css           # Core styling for the game
├── uno.js              # UI wiring, DOM interaction, event handlers
├── uno-logic.js        # Pure game logic (deck, hands, rules, turn order)
├── assets/
│   ├── cards/          # Card images or SVGs (optional)
│   └── icons/          # UI icons, arrows, etc.
├── docs/
│   ├── uno-banner.png
│   └── screenshots...
└── tests/              # Unit tests for game logic (optional)
```

---

## How the AI functions

The AI uses a simple but strategic **rule-based decision engine** designed to feel natural while remaining predictable.

### 🎯 Goals
- Play a legal card whenever possible  
- Reduce its hand size efficiently  
- Save powerful action cards for key moments  
- Avoid helping the next player

### 🤖 Decision Logic 

1. **Find all playable cards**  
   Matches by colour, number, type, or wild. If none → draw a card.

2. **Prefer safe, simple plays**  
   Number cards are used first to avoid unnecessary disruption.

3. **Use action cards strategically:**  
   - **Skip** → Used when the next player is close to winning  
   - **Reverse** → Used when direction shift is beneficial  
   - **+2** → Used when it pressures opponents  
   - **Wild / +4** → Used only when necessary; AI picks the colour it holds the most.

4. **Choose Wild colour smartly**  
   Selects the colour with the highest count in its hand.

5. **UNO Logic**  
   Automatically calls UNO when reaching 1 card.


## 🚀 How to run it yourself

### 1. Clone the repository

```bash
git clone https://github.com/HarryWarriner/UNO.git
cd uno-game
```

### 2. Run locally

You can open `index.html` directly in the browser, but using a local server is recommended.

#### VS Code Live Server

1. Install the **Live Server** extension in VS Code  
2. Right-click `index.html` → **Open with Live Server**



---

## 🕹 Gameplay

### Basic Rules

Its just UNO rules

---

## 🛠 Development

### File Overview

- **`uno-logic.js`**  
  Contains all the **core game logic**:
  - Deck generation & shuffling
  - Valid move checking
  - Turn order, direction, and skip handling
  - Applying action card effects

- **`uno.js`**  
  Handles the **UI layer**:
  - Rendering player hands and the discard pile
  - Click events on cards and buttons
  - Updating direction arrows and UNO call states
  - Showing win/loss messages

- **`style.css`**  
  Controls:
  - Layout of the table, hands, and discard pile
  - Animations / hover states
  - Colour theming for suits and action cards

### Running Tests

Example using Vitest:

```bash
npm install
npm test
# or
npx vitest
```

---


## 📄 License

This project is licensed under the **MIT License**.
See the [`LICENSE`](LICENSE) file for details.

---

## ⭐ Support & Attribution

If you enjoy this project:

- ⭐ Star the repo on GitHub
- 📨 Share ideas and improvements via issues or PRs

UNO® is a trademark of Mattel.
This is an **unofficial, fan-made implementation** for educational and recreational purposes only.
