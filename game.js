// Vibe Coding Lounge - Challenge 1: Irani Chai & Osmania Biscuit Rush
// Pure vanilla JS with HTML5 Canvas & Web Audio API Engine

(function() {
  'use strict';

  // --- AUDIO SYNTHESIS ENGINE (Web Audio API) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.initOnInteraction = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    playTone(freq, type, duration, gainValue = 0.15) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playChaiClick() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      // Tea cup clink + liquid bubble sound
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.15);
    }

    playBiscuitCatch() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;

      // Crunchy snap sound using noise buffer
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    }

    playGoldenBonus() {
      if (this.muted) return;
      this.init();
      [600, 800, 1000, 1200].forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 'triangle', 0.12, 0.2), idx * 45);
      });
    }

    playBurntCatch() {
      if (this.muted) return;
      this.init();
      this.playTone(130, 'sawtooth', 0.25, 0.25);
    }

    playTick() {
      if (this.muted) return;
      this.playTone(850, 'sine', 0.04, 0.1);
    }

    playFrenzy() {
      if (this.muted) return;
      this.init();
      [440, 554, 659, 880, 1108].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.18, 0.2), i * 70);
      });
    }

    playGameOver() {
      if (this.muted) return;
      this.init();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.35, 0.25), i * 110);
      });
    }
  }

  const audio = new SoundEngine();

  // --- GAME STATE ---
  const state = {
    // Currencies & Scores
    chaiCount: 0,
    totalChaiBrewed: 0,
    biscuitsCaught: 0,
    biscuitsDropped: 0,
    score: 0,
    highScore: parseInt(localStorage.getItem('vibeChaiHighScore') || '0', 10),

    // Incremental Stats
    chaiPerClick: 1,
    chaiPerSecond: 0,
    activeMultiplier: 1,

    // Dum Frenzy
    dumHeat: 0,
    frenzyActive: false,
    frenzyTimer: 0,

    // Biscuits Combo & Synergy
    biscuitCombo: 0,
    maxCombo: 0,
    synergyMultiplier: 1.0,
    saucerWidth: 95,

    // Time & Modes
    gameMode: 'rush60', // 'rush60', 'rush120', 'endless'
    timeRemaining: 60,
    timerInterval: null,
    isPlaying: false,
    lastTick: performance.now(),
  };

  // --- UPGRADES CATALOG ---
  const upgrades = [
    {
      id: 'elaichi',
      name: 'Cardamom & Elaichi Crush',
      desc: '+1 Chai cup per click',
      icon: '🌱',
      baseCost: 15,
      costMultiplier: 1.35,
      level: 0,
      effect: (lvl) => { state.chaiPerClick = 1 + lvl * 1 + (upgrades.find(u => u.id === 'malai').level * 4); }
    },
    {
      id: 'malai',
      name: 'Thick Malai Clotted Cream',
      desc: '+4 Chai cups per click',
      icon: '🥛',
      baseCost: 60,
      costMultiplier: 1.4,
      level: 0,
      effect: (lvl) => { state.chaiPerClick = 1 + (upgrades.find(u => u.id === 'elaichi').level * 1) + lvl * 4; }
    },
    {
      id: 'samovar',
      name: 'Brass Dum Samovar',
      desc: '+2 Cups brewed per second',
      icon: '🫖',
      baseCost: 40,
      costMultiplier: 1.3,
      level: 0,
      effect: () => recalculateCPS()
    },
    {
      id: 'chotu',
      name: 'Chotu Chaiwala Assistant',
      desc: '+8 Cups brewed per second',
      icon: '🏃',
      baseCost: 180,
      costMultiplier: 1.35,
      level: 0,
      effect: () => recalculateCPS()
    },
    {
      id: 'saucer_upgrade',
      name: 'Royal Porcelain Saucer',
      desc: 'Wider saucer plate to catch biscuits easily',
      icon: '🍽️',
      baseCost: 250,
      costMultiplier: 1.6,
      level: 0,
      effect: (lvl) => { state.saucerWidth = 95 + (lvl * 18); }
    },
    {
      id: 'ustad',
      name: 'Irani Ustad Brewmaster',
      desc: '+25 Cups brewed per second',
      icon: '👨‍🍳',
      baseCost: 650,
      costMultiplier: 1.38,
      level: 0,
      effect: () => recalculateCPS()
    },
    {
      id: 'synergy_dip',
      name: 'Osmania Chai Dip Syrup',
      desc: 'Biscuits grant +25% extra score & chai synergy',
      icon: '🍪',
      baseCost: 1200,
      costMultiplier: 1.5,
      level: 0,
      effect: (lvl) => { state.synergyMultiplier = 1.0 + (lvl * 0.25); }
    },
    {
      id: 'franchise',
      name: 'Charminar Cafe Franchise',
      desc: '+100 Cups brewed per second!',
      icon: '🏛️',
      baseCost: 3000,
      costMultiplier: 1.45,
      level: 0,
      effect: () => recalculateCPS()
    }
  ];

  function getUpgradeCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
  }

  function recalculateCPS() {
    let cps = 0;
    const samovar = upgrades.find(u => u.id === 'samovar');
    const chotu = upgrades.find(u => u.id === 'chotu');
    const ustad = upgrades.find(u => u.id === 'ustad');
    const franchise = upgrades.find(u => u.id === 'franchise');

    cps += samovar.level * 2;
    cps += chotu.level * 8;
    cps += ustad.level * 25;
    cps += franchise.level * 100;

    state.chaiPerSecond = cps;
  }

  // --- DOM ELEMENTS ---
  const el = {
    timerText: document.getElementById('timerText'),
    timerBox: document.getElementById('timerBox'),
    scoreText: document.getElementById('scoreText'),
    chaiTotalVal: document.getElementById('chaiTotalVal'),
    chaiCPSVal: document.getElementById('chaiCPSVal'),
    chaiCPCVal: document.getElementById('chaiCPCVal'),
    chaiCup: document.getElementById('chaiCupWrapper'),
    teaLiquid: document.getElementById('teaLiquid'),
    frenzyBar: document.getElementById('frenzyBar'),
    frenzyBadge: document.getElementById('frenzyBadge'),
    upgradeList: document.getElementById('upgradeList'),
    biscuitComboVal: document.getElementById('biscuitComboVal'),
    biscuitsCountVal: document.getElementById('biscuitsCountVal'),
    synergyBonusText: document.getElementById('synergyBonusText'),
    muteBtn: document.getElementById('muteBtn'),
    startModal: document.getElementById('startModal'),
    gameOverModal: document.getElementById('gameOverModal'),
    btnStartGame: document.getElementById('btnStartGame'),
    btnPlayAgain: document.getElementById('btnPlayAgain'),
    resScore: document.getElementById('resScore'),
    resChai: document.getElementById('resChai'),
    resBiscuits: document.getElementById('resBiscuits'),
    resCombo: document.getElementById('resCombo'),
    resRank: document.getElementById('resRank'),
    canvas: document.getElementById('biscuitCanvas'),
  };

  const ctx = el.canvas ? el.canvas.getContext('2d') : null;

  // --- CANVAS RESIZING ---
  function resizeCanvas() {
    if (!el.canvas) return;
    const rect = el.canvas.parentElement.getBoundingClientRect();
    el.canvas.width = rect.width;
    el.canvas.height = rect.height;
  }
  window.addEventListener('resize', resizeCanvas);

  // --- BISCUIT CATCHER ARENA SIMULATION ---
  const biscuitTypes = {
    CLASSIC: { name: 'Osmania', score: 10, color: '#e6a15c', edgeColor: '#b46e30', speedMin: 2.2, speedMax: 3.8, prob: 0.70 },
    SAFFRON: { name: 'Kesar Gold', score: 50, color: '#fbbf24', edgeColor: '#f59e0b', speedMin: 2.8, speedMax: 4.5, prob: 0.15, bonusTime: 2 },
    PISTA: { name: 'Double Pista', score: 30, color: '#86efac', edgeColor: '#16a34a', speedMin: 3.2, speedMax: 5.0, prob: 0.10, frenzyBoost: 25 },
    BURNT: { name: 'Charcoal Burnt', score: -20, color: '#332720', edgeColor: '#1a1410', speedMin: 3.0, speedMax: 4.8, prob: 0.05, isHazard: true }
  };

  const biscuits = [];
  const particles = [];
  const floatingCanvasTexts = [];

  const playerSaucer = {
    x: 150,
    y: 0, // dynamic
    height: 18,
    targetX: 150,
  };

  function spawnBiscuit() {
    if (!state.isPlaying || !el.canvas) return;

    const rand = Math.random();
    let selectedType = biscuitTypes.CLASSIC;

    // In frenzy mode, saffron gold biscuits spawn much more frequently
    if (state.frenzyActive && Math.random() < 0.5) {
      selectedType = biscuitTypes.SAFFRON;
    } else if (rand < 0.08) {
      selectedType = biscuitTypes.BURNT;
    } else if (rand < 0.22) {
      selectedType = biscuitTypes.PISTA;
    } else if (rand < 0.40) {
      selectedType = biscuitTypes.SAFFRON;
    }

    const radius = 22;
    const x = radius + Math.random() * (el.canvas.width - radius * 2);
    const speed = selectedType.speedMin + Math.random() * (selectedType.speedMax - selectedType.speedMin);

    biscuits.push({
      x: x,
      y: -radius,
      radius: radius,
      speed: speed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      type: selectedType,
    });
  }

  function spawnCrumbs(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 1.5 + Math.random() * 2.5,
        color: color,
        alpha: 1,
        life: 0.6 + Math.random() * 0.4,
      });
    }
  }

  function addCanvasFloatingText(text, x, y, color = '#fef3c7') {
    floatingCanvasTexts.push({
      text: text,
      x: x,
      y: y,
      alpha: 1,
      vy: -1.8,
      color: color,
    });
  }

  // --- DRAWING CANVAS ITEMS ---
  function drawOsmaniaBiscuit(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);

    // Outer glow for special biscuits
    if (b.type === biscuitTypes.SAFFRON) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
    } else if (b.type === biscuitTypes.PISTA) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
    }

    // Scalloped / round Osmania biscuit shape
    ctx.beginPath();
    const r = b.radius;
    const bumps = 12;
    for (let i = 0; i < bumps * 2; i++) {
      const angle = (i * Math.PI) / bumps;
      const radiusOffset = i % 2 === 0 ? r : r - 2;
      const x = Math.cos(angle) * radiusOffset;
      const y = Math.sin(angle) * radiusOffset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Baked biscuit gradient
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    grad.addColorStop(0, b.type.color);
    grad.addColorStop(0.85, b.type.edgeColor);
    grad.addColorStop(1, '#653818');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#43230c';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Authentic Osmania 4 central glaze indentations
    ctx.fillStyle = 'rgba(75, 42, 17, 0.4)';
    const holeOffset = r * 0.38;
    const holeRadius = 2.2;
    [[-holeOffset, -holeOffset], [holeOffset, -holeOffset], [-holeOffset, holeOffset], [holeOffset, holeOffset]].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, holeRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sugar & Salt crystals
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let j = 0; j < 5; j++) {
      const sx = (Math.sin(j * 3 + b.y * 0.1) * r * 0.55);
      const sy = (Math.cos(j * 4 + b.y * 0.1) * r * 0.55);
      ctx.fillRect(sx, sy, 2, 2);
    }

    ctx.restore();
  }

  function drawSaucer(ctx) {
    const sw = state.saucerWidth;
    const sh = playerSaucer.height;
    const sx = playerSaucer.x;
    const sy = playerSaucer.y;

    ctx.save();
    // Saucer shadow
    ctx.beginPath();
    ctx.ellipse(sx, sy + 6, sw / 2 + 6, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fill();

    // Ceramic Saucer Body
    const saucerGrad = ctx.createLinearGradient(sx - sw / 2, sy, sx + sw / 2, sy);
    saucerGrad.addColorStop(0, '#e2e8f0');
    saucerGrad.addColorStop(0.5, '#ffffff');
    saucerGrad.addColorStop(1, '#cbd5e1');

    ctx.beginPath();
    ctx.ellipse(sx, sy, sw / 2, sh / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = saucerGrad;
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner Hyderabad Chai Cup Saucer Ring
    ctx.beginPath();
    ctx.ellipse(sx, sy, sw * 0.35, (sh / 2) * 0.6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  // --- BISCUIT CATCHER INPUT HANDLERS ---
  function setupCatcherInputs() {
    if (!el.canvas) return;

    // Mouse movement
    el.canvas.addEventListener('mousemove', (e) => {
      const rect = el.canvas.getBoundingClientRect();
      playerSaucer.targetX = e.clientX - rect.left;
    });

    // Touch controls
    el.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = el.canvas.getBoundingClientRect();
      if (e.touches.length > 0) {
        playerSaucer.targetX = e.touches[0].clientX - rect.left;
      }
    }, { passive: false });

    // Mid-air Click/Tap to slice/catch biscuits
    const handleMidAirTap = (clientX, clientY) => {
      audio.init();
      const rect = el.canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      for (let i = biscuits.length - 1; i >= 0; i--) {
        const b = biscuits[i];
        const dist = Math.hypot(b.x - clickX, b.y - clickY);
        if (dist <= b.radius * 1.5) {
          // Mid-air tap successful!
          catchBiscuit(b, i, true);
          break;
        }
      }
    };

    el.canvas.addEventListener('mousedown', (e) => {
      handleMidAirTap(e.clientX, e.clientY);
    });

    el.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        handleMidAirTap(t.clientX, t.clientY);
        const rect = el.canvas.getBoundingClientRect();
        playerSaucer.targetX = t.clientX - rect.left;
      }
    }, { passive: true });

    // Keyboard controls (Left/Right or A/D)
    window.addEventListener('keydown', (e) => {
      if (!state.isPlaying) return;
      const step = 28;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        playerSaucer.targetX = Math.max(state.saucerWidth / 2, playerSaucer.targetX - step);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        playerSaucer.targetX = Math.min(el.canvas.width - state.saucerWidth / 2, playerSaucer.targetX + step);
      }
    });
  }

  function catchBiscuit(b, index, isMidAirTap = false) {
    biscuits.splice(index, 1);
    spawnCrumbs(b.x, b.y, b.type.color, 16);

    if (b.type.isHazard) {
      // Burnt Hazard
      audio.playBurntCatch();
      state.biscuitCombo = 0;
      const pen = 25;
      state.score = Math.max(0, state.score - pen);
      addCanvasFloatingText(`-25 Burnt!`, b.x, b.y, '#ef4444');
    } else {
      // Successful catch!
      audio.playBiscuitCatch();
      state.biscuitsCaught++;
      state.biscuitCombo++;
      if (state.biscuitCombo > state.maxCombo) {
        state.maxCombo = state.biscuitCombo;
      }

      // Combo Multiplier
      const comboMult = Math.min(5, 1 + Math.floor(state.biscuitCombo / 5) * 0.5);
      const earned = Math.round(b.type.score * comboMult * state.synergyMultiplier);
      state.score += earned;

      let msg = `+${earned}`;
      let color = '#fbbf24';

      if (isMidAirTap) {
        msg += ' (Air Crunch!)';
        state.score += 5;
      }

      if (b.type === biscuitTypes.SAFFRON) {
        audio.playGoldenBonus();
        color = '#f59e0b';
        if (state.gameMode !== 'endless') {
          state.timeRemaining += b.type.bonusTime;
          msg += ` (+${b.type.bonusTime}s!)`;
        }
      } else if (b.type === biscuitTypes.PISTA) {
        color = '#10b981';
        increaseDumHeat(b.type.frenzyBoost);
        msg += ' (+HEAT!)';
      }

      addCanvasFloatingText(msg, b.x, b.y, color);

      // Synergy: Every 4 biscuits caught brews bonus cups of Chai!
      if (state.biscuitsCaught % 4 === 0) {
        const bonusChai = 5 + Math.floor(state.chaiPerClick * 2);
        brewChai(bonusChai, false);
      }
    }

    updateUI();
  }

  // --- CHAI BREWING (Incremental Clicker) ---
  function brewChai(amount = state.chaiPerClick, isUserClick = true) {
    const totalAdded = Math.round(amount * state.activeMultiplier);
    state.chaiCount += totalAdded;
    state.totalChaiBrewed += totalAdded;
    state.score += Math.round(totalAdded * 2);

    if (isUserClick) {
      audio.playChaiClick();
      increaseDumHeat(6);

      // Cup liquid level visual effect
      const currentHeight = 70 + Math.min(25, (state.dumHeat * 0.25));
      if (el.teaLiquid) {
        el.teaLiquid.style.height = `${currentHeight}%`;
      }

      // Spawn floating click text
      spawnFloatingText(`+${totalAdded} ☕`, el.chaiCup);
    }

    updateUI();
  }

  function spawnFloatingText(text, targetEl) {
    if (!targetEl) return;
    const popup = document.createElement('div');
    popup.className = 'floating-text';
    popup.textContent = text;

    const rect = targetEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 60;
    const y = rect.top + rect.height * 0.35 + (Math.random() - 0.5) * 30;

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    document.body.appendChild(popup);

    setTimeout(() => {
      if (popup.parentElement) {
        popup.parentElement.removeChild(popup);
      }
    }, 850);
  }

  function increaseDumHeat(amount) {
    if (state.frenzyActive) return;

    state.dumHeat = Math.min(100, state.dumHeat + amount);
    if (state.dumHeat >= 100) {
      triggerFrenzy();
    }
  }

  function triggerFrenzy() {
    state.frenzyActive = true;
    state.frenzyTimer = 7.0; // 7 seconds frenzy!
    state.activeMultiplier = 3.5; // 3.5x boost
    audio.playFrenzy();

    if (el.frenzyBadge) el.frenzyBadge.style.display = 'block';

    // Rain of biscuits during frenzy!
    for (let i = 0; i < 4; i++) {
      setTimeout(spawnBiscuit, i * 200);
    }
  }

  // --- UPGRADES STORE ---
  function renderUpgrades() {
    if (!el.upgradeList) return;
    el.upgradeList.innerHTML = '';

    upgrades.forEach(u => {
      const cost = getUpgradeCost(u);
      const canAfford = state.chaiCount >= cost;

      const card = document.createElement('div');
      card.className = `upgrade-card ${canAfford ? '' : 'disabled'}`;
      card.innerHTML = `
        <div class="upgrade-icon-box">${u.icon}</div>
        <div class="upgrade-details">
          <div class="upgrade-name-row">
            <span class="upgrade-name">${u.name}</span>
            <span class="upgrade-level">Lvl ${u.level}</span>
          </div>
          <div class="upgrade-desc">${u.desc}</div>
          <div class="upgrade-cost-row">
            <span>☕ ${cost.toLocaleString()} Cups</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        if (state.chaiCount >= cost) {
          state.chaiCount -= cost;
          u.level++;
          u.effect(u.level);
          audio.playTone(880, 'triangle', 0.15, 0.2);
          updateUI();
          renderUpgrades();
        }
      });

      el.upgradeList.appendChild(card);
    });
  }

  function updateUpgradesAvailability() {
    if (!el.upgradeList) return;
    const cards = el.upgradeList.children;
    upgrades.forEach((u, i) => {
      const cost = getUpgradeCost(u);
      const card = cards[i];
      if (card) {
        if (state.chaiCount >= cost) {
          card.classList.remove('disabled');
        } else {
          card.classList.add('disabled');
        }
      }
    });
  }

  // --- GAME LOOP & UPDATES ---
  let lastSpawnTime = 0;

  function gameLoop(currentTime) {
    const delta = (currentTime - state.lastTick) / 1000;
    state.lastTick = currentTime;

    if (state.isPlaying) {
      // 1. Passive Chai Per Second (CPS)
      if (state.chaiPerSecond > 0) {
        const passiveChai = state.chaiPerSecond * delta * state.activeMultiplier;
        state.chaiCount += passiveChai;
        state.totalChaiBrewed += passiveChai;
        state.score += Math.round(passiveChai * 1.5);
      }

      // 2. Dum Heat Decay & Frenzy Timer
      if (state.frenzyActive) {
        state.frenzyTimer -= delta;
        state.dumHeat = (state.frenzyTimer / 7.0) * 100;
        if (state.frenzyTimer <= 0) {
          state.frenzyActive = false;
          state.dumHeat = 0;
          state.activeMultiplier = 1;
          if (el.frenzyBadge) el.frenzyBadge.style.display = 'none';
        }
      } else {
        // Natural gradual heat decay
        state.dumHeat = Math.max(0, state.dumHeat - delta * 8);
      }

      // 3. Biscuit Spawn Interval (faster spawn rate as game progresses)
      const spawnInterval = state.frenzyActive ? 550 : Math.max(650, 1500 - (state.biscuitsCaught * 12));
      if (currentTime - lastSpawnTime > spawnInterval) {
        spawnBiscuit();
        lastSpawnTime = currentTime;
      }

      // 4. Update Biscuit Physics
      updateBiscuits(delta);
      updateParticles(delta);

      // Smooth Saucer Lerp
      playerSaucer.x += (playerSaucer.targetX - playerSaucer.x) * 0.28;
      // Clamp within canvas boundaries
      if (el.canvas) {
        playerSaucer.y = el.canvas.height - 24;
        const halfWidth = state.saucerWidth / 2;
        playerSaucer.x = Math.max(halfWidth, Math.min(el.canvas.width - halfWidth, playerSaucer.x));
      }

      // Render Canvas
      renderCanvas();
    }

    updateUI();
    requestAnimationFrame(gameLoop);
  }

  function updateBiscuits(delta) {
    if (!el.canvas) return;
    const saucerY = playerSaucer.y;
    const saucerHalfW = state.saucerWidth / 2;

    for (let i = biscuits.length - 1; i >= 0; i--) {
      const b = biscuits[i];
      b.y += b.speed * (delta * 60);
      b.rotation += b.rotationSpeed;

      // Collision with Saucer
      if (b.y + b.radius >= saucerY - playerSaucer.height / 2 &&
          b.y - b.radius <= saucerY + playerSaucer.height / 2 &&
          b.x >= playerSaucer.x - saucerHalfW &&
          b.x <= playerSaucer.x + saucerHalfW) {
        catchBiscuit(b, i, false);
        continue;
      }

      // Hit Floor (Dropped biscuit)
      if (b.y - b.radius > el.canvas.height) {
        biscuits.splice(i, 1);
        if (!b.type.isHazard) {
          state.biscuitsDropped++;
          state.biscuitCombo = 0; // combo reset!
          spawnCrumbs(b.x, el.canvas.height - 8, b.type.color, 8);
        }
      }
    }
  }

  function updateParticles(delta) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18; // gravity
      p.alpha -= delta / p.life;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    for (let j = floatingCanvasTexts.length - 1; j >= 0; j--) {
      const ft = floatingCanvasTexts[j];
      ft.y += ft.vy;
      ft.alpha -= delta * 1.4;
      if (ft.alpha <= 0) {
        floatingCanvasTexts.splice(j, 1);
      }
    }
  }

  function renderCanvas() {
    if (!ctx || !el.canvas) return;
    ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);

    // Draw Biscuits
    biscuits.forEach(b => drawOsmaniaBiscuit(ctx, b));

    // Draw Saucer
    drawSaucer(ctx);

    // Draw Particles (Crumbs)
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Floating Texts on Canvas
    floatingCanvasTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  // --- UI UPDATER ---
  function updateUI() {
    if (el.scoreText) el.scoreText.textContent = Math.floor(state.score).toLocaleString();
    if (el.chaiTotalVal) el.chaiTotalVal.textContent = Math.floor(state.chaiCount).toLocaleString();
    if (el.chaiCPSVal) el.chaiCPSVal.textContent = (state.chaiPerSecond * state.activeMultiplier).toFixed(1);
    if (el.chaiCPCVal) el.chaiCPCVal.textContent = (state.chaiPerClick * state.activeMultiplier);
    if (el.biscuitComboVal) el.biscuitComboVal.textContent = `${state.biscuitCombo}x`;
    if (el.biscuitsCountVal) el.biscuitsCountVal.textContent = state.biscuitsCaught;

    if (el.frenzyBar) {
      el.frenzyBar.style.width = `${Math.min(100, state.dumHeat)}%`;
    }

    if (el.synergyBonusText) {
      el.synergyBonusText.textContent = `${Math.round((state.synergyMultiplier - 1) * 100)}%`;
    }

    updateUpgradesAvailability();
  }

  // --- TIMER & CHALLENGE MANAGEMENT ---
  function startTimer() {
    clearInterval(state.timerInterval);
    if (state.gameMode === 'endless') {
      if (el.timerText) el.timerText.textContent = '∞ Endless';
      if (el.timerBox) el.timerBox.classList.remove('urgent');
      return;
    }

    state.timeRemaining = state.gameMode === 'rush120' ? 120 : 60;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      if (!state.isPlaying) return;

      state.timeRemaining--;
      updateTimerDisplay();

      if (state.timeRemaining <= 10 && state.timeRemaining > 0) {
        audio.playTick();
        if (el.timerBox) el.timerBox.classList.add('urgent');
      } else {
        if (el.timerBox) el.timerBox.classList.remove('urgent');
      }

      if (state.timeRemaining <= 0) {
        endGame();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!el.timerText) return;
    const mins = Math.floor(state.timeRemaining / 60);
    const secs = state.timeRemaining % 60;
    el.timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function startGame() {
    audio.init();
    state.isPlaying = true;
    state.score = 0;
    state.chaiCount = 0;
    state.totalChaiBrewed = 0;
    state.biscuitsCaught = 0;
    state.biscuitsDropped = 0;
    state.biscuitCombo = 0;
    state.maxCombo = 0;
    state.dumHeat = 0;
    state.frenzyActive = false;
    state.activeMultiplier = 1;

    // Reset upgrades
    upgrades.forEach(u => {
      u.level = 0;
      u.effect(0);
    });

    biscuits.length = 0;
    particles.length = 0;
    floatingCanvasTexts.length = 0;

    if (el.startModal) el.startModal.style.display = 'none';
    if (el.gameOverModal) el.gameOverModal.style.display = 'none';

    resizeCanvas();
    renderUpgrades();
    startTimer();
  }

  function endGame() {
    state.isPlaying = false;
    clearInterval(state.timerInterval);
    audio.playGameOver();

    // Calculate Rank
    let rank = 'Tea Stall Novice';
    if (state.score >= 5000) rank = '👑 Nizam\'s Royal Chaiwala Legend';
    else if (state.score >= 2500) rank = '🔥 Kadak Irani Ustad';
    else if (state.score >= 1200) rank = '⚡ Master Dum Brewer';
    else if (state.score >= 500) rank = '☕ Senior Chai Runner';

    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem('vibeChaiHighScore', state.highScore.toString());
    }

    if (el.resScore) el.resScore.textContent = state.score.toLocaleString();
    if (el.resChai) el.resChai.textContent = Math.floor(state.totalChaiBrewed).toLocaleString();
    if (el.resBiscuits) el.resBiscuits.textContent = state.biscuitsCaught.toLocaleString();
    if (el.resCombo) el.resCombo.textContent = `${state.maxCombo}x`;
    if (el.resRank) el.resRank.textContent = rank;

    if (el.gameOverModal) el.gameOverModal.style.display = 'flex';
  }

  // --- INITIALIZATION ---
  function initGame() {
    resizeCanvas();
    setupCatcherInputs();
    renderUpgrades();

    // Mode Selector Buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.gameMode = e.currentTarget.dataset.mode;
      });
    });

    // Start Button
    if (el.btnStartGame) {
      el.btnStartGame.addEventListener('click', startGame);
    }

    // Play Again Button
    if (el.btnPlayAgain) {
      el.btnPlayAgain.addEventListener('click', startGame);
    }

    // Interactive Chai Cup Click
    if (el.chaiCup) {
      el.chaiCup.addEventListener('click', () => {
        if (!state.isPlaying) return;
        brewChai(state.chaiPerClick, true);
      });
    }

    // Mute Audio Toggle
    if (el.muteBtn) {
      el.muteBtn.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        el.muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Sound';
      });
    }

    // Kick off animation loop
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener('DOMContentLoaded', initGame);

})();
