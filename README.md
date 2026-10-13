# Vibe Coding Lounge — Challenge 1: Irani Chai & Osmania Biscuit Rush

> **Challenge Brief:**
> *"A fast-paced incremental clicker game where players have to catch falling Osmania biscuits or make continuous cups of Irani chai before a timer runs out."*

---

## 🎮 Game Features & Mechanics

### 1. Dual-Action Synergistic Gameplay
- **Irani Chai Brew Station (Incremental Clicker)**:
  - Click or tap the steaming Chai Cup to brew cups of Kadak Irani Dum Chai.
  - Builds up the **Dum Heat Pressure Gauge**; tapping fast unleashes a **Kadak Frenzy** with a 3.5x multiplier boost and a golden biscuit rain!
  - Purchase incremental upgrades to scale Cups Per Click (CPC) and passive Cups Per Second (CPS).

- **Osmania Biscuit Arena (Arcade Catcher)**:
  - Authentic Hyderabadi scalloped Osmania biscuits fall from the top of the bakery conveyor.
  - Control the porcelain chai saucer plate with your mouse, touch gestures, or keyboard (`Left`/`Right` or `A`/`D`).
  - **Air-Slice Mechanic**: Tap/click falling biscuits directly mid-air for extra crunch points!
  - **Biscuit Types**:
    - **Classic Osmania**: +10 pts, increments combo.
    - **Kesar Gold Biscuit**: +50 pts and extends your countdown timer (+2s)!
    - **Double Pista Biscuit**: +30 pts and instantly surges Dum steam heat!
    - **Charcoal Burnt Biscuit**: Hazard! Avoid catching to protect your score and combo streak.

- **Chai & Biscuit Dip Synergy**:
  - Catching biscuits regularly triggers automatic brewing surges.
  - Biscuit combos and dip syrup upgrades multiply overall cafe scores.

### 2. Challenge Modes
- **⏱️ 60s Rush (Official Challenge Mode)**: Beat the clock in a 60-second high-energy cafe rush!
- **⏳ 120s Cafe Rush**: Extended rush mode for deeper strategy and higher upgrade tiers.
- **♾️ Endless Vibe**: Infinite incremental cafe tycoon mode without a timer.

### 3. Audio & Visuals
- **Zero-Dependency Web Audio API Engine**: Realistic synthesized sound effects for tea pouring clinks, crispy biscuit crunches, golden chimes, urgent countdown ticks, and game over fanfares.
- **Hyderabad Cafe Aesthetics**: Rich caramel/amber hues, rising steam animations, clotted malai layer, crumb physics particle system, and floating score notifications.

---

## 🚀 How to Run & Play

1. Open `index.html` directly in any web browser (Chrome, Edge, Firefox, Safari).
2. Or open the file via local server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```
3. Click **"START CHALLENGE"**, choose your mode, and start brewing and catching!

---

## 📁 File Structure
- `index.html` — Semantic markup and UI components.
- `style.css` — High-contrast Hyderabad Irani cafe themed styles, animations, and responsive layout.
- `game.js` — Game loop, physics engine, canvas renderer, incremental calculations, and Web Audio synthesizer.
- `README.md` — Project documentation and gameplay guide.
