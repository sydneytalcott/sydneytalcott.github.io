// Animated wireframe wave shown under the Contact section (canvas.mesh-wave).
// Line color follows the canvas's CSS `color`. Tune SPEED, COLS and ROWS below.
document.addEventListener('DOMContentLoaded', () => {
  const SPEED = 1;
  const STYLE = 'dots'; // 'dots' = a dot at each mesh vertex, 'lines' = wireframe
  const W = 680, H = 84, TOP = 143; // drawing units; TOP crops the empty sky above the crest (sized for AMP = 1.4)
  const SQUASH = 0.5; // vertical compression of the whole wave (1 = original proportions); H is the visible span times SQUASH
  const AMP = 1.4; // wave height multiplier (1 = original)
  const NEAR = 0.22; // where the mesh starts in front of the crest (0 = full-depth base, higher = shorter base)

  document.querySelectorAll('canvas.mesh-wave').forEach((c) => {
    const g = c.getContext && c.getContext('2d');
    if (!g) return;

    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let COLS = 170, ROWS = 61, thick = 1;
    let px = new Float32Array(0), py = new Float32Array(0);
    let visible = true, running = false;

    function size() {
      const d = window.devicePixelRatio || 1;
      const w = c.clientWidth || W, h = c.clientHeight || (w * H / W);
      c.width = Math.round(w * d);
      c.height = Math.round(h * d);
      g.setTransform(c.width / W, 0, 0, c.height / H, 0, 0);
      // Coarser mesh and proportionally heavier lines on narrow screens so it stays legible
      const narrow = w < 600;
      COLS = narrow ? 96 : 170;
      if (STYLE === 'dots') { COLS = narrow ? 190 : 520; ROWS = narrow ? 45 : 71; } // far denser across, to balance the closely spaced rows
      ROWS = narrow ? 41 : 61;
      thick = Math.max(1, 0.75 / (w / W));
      px = new Float32Array(COLS * ROWS);
      py = new Float32Array(COLS * ROWS);
    }

    function height(x, y, t) {
      const yc = 0.47 + 0.07 * Math.sin(x * 0.9 + t * 0.25);
      const u = y - yc;
      const crest = 0.6 * Math.exp(-u * u / (u > 0 ? 0.035 : 0.007)) * (0.62 + 0.38 * Math.cos(x * 0.75 - t * 0.12));
      const ripple = 0.035 * Math.sin(x * 3.1 + y * 15 - t * 1.1)
                   + 0.025 * Math.sin(x * 5.3 - y * 10 + t * 1.4)
                   + 0.02 * Math.sin(y * 26 + t * 0.8);
      return (crest + ripple) * AMP;
    }

    function draw(t) {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = getComputedStyle(c).color;
      g.lineJoin = 'round';
      let i, j, k;
      for (j = 0; j < ROWS; j++) {
        const y = NEAR + (1 - NEAR) * j / (ROWS - 1);
        const stagger = STYLE === 'dots' && j % 2 ? 0.5 : 0; // offset alternate rows so dots don't line up into streaks
        for (i = 0; i < COLS; i++) {
          const x = ((i + stagger) / (COLS - 1) * 2 - 1) * 2.3;
          const h = height(x, y, t);
          const s = 1 / (1 + (y - h * 0.14) * 1.5);
          k = j * COLS + i;
          px[k] = 340 + x * 380 * s;
          py[k] = (70 - TOP + (1.0 - h * 0.62) * 300 * s) * SQUASH;
        }
      }
      if (STYLE === 'dots') {
        // One dot per mesh vertex; nearer rows get larger, darker dots
        g.fillStyle = g.strokeStyle;
        for (j = 0; j < ROWS; j++) {
          const a = (1 - NEAR) * (1 - j / (ROWS - 1));
          const r = (0.22 + 0.24 * a) * thick;
          g.globalAlpha = 0.4 + 0.6 * a;
          g.beginPath();
          // Tiny squares read as dots at this size and are much cheaper to draw than arcs
          for (i = 0; i < COLS; i++) { k = j * COLS + i; g.rect(px[k] - r, py[k] - r, 2 * r, 2 * r); }
          g.fill();
        }
      } else {
        for (j = 0; j < ROWS; j++) {
          const a = (1 - NEAR) * (1 - j / (ROWS - 1));
          g.globalAlpha = 0.28 + 0.62 * a;
          g.lineWidth = (0.35 + 0.45 * a) * thick;
          g.beginPath();
          for (i = 0; i < COLS; i++) { k = j * COLS + i; if (i) g.lineTo(px[k], py[k]); else g.moveTo(px[k], py[k]); }
          g.stroke();
        }
        g.lineWidth = 0.4 * thick;
        g.globalAlpha = 0.5;
        for (i = 0; i < COLS; i++) {
          g.beginPath();
          for (j = 0; j < ROWS; j++) { k = j * COLS + i; if (j) g.lineTo(px[k], py[k]); else g.moveTo(px[k], py[k]); }
          g.stroke();
        }
      }
      g.globalAlpha = 1;
    }

    function loop(ms) {
      if (!visible) { running = false; return; }
      draw(ms / 1000 * SPEED);
      requestAnimationFrame(loop);
    }

    function start() {
      if (still || running) return;
      running = true;
      requestAnimationFrame(loop);
    }

    size();
    window.addEventListener('resize', () => { size(); if (still) draw(2); });

    // Pause while scrolled out of view
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(c);
    }

    if (still) draw(2); else start();
  });
});
