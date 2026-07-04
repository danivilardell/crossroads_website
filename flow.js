/* Deposit -> trade -> withdraw — animated walkthrough */
(function () {
  const stage = document.getElementById('flow-stage');
  const descBox = document.getElementById('flow-desc');
  const dotsBox = document.getElementById('flow-dots');
  const prevBtn = document.getElementById('flow-prev');
  const nextBtn = document.getElementById('flow-next');
  const playBtn = document.getElementById('flow-play');
  if (!stage || !descBox) return;

  const SVG = 'http://www.w3.org/2000/svg';
  const W = 820, H = 350;

  // light, editorial palette
  const C = {
    stroke: '#d9d8cd', fill: '#ffffff',
    strokeHi: '#14756e', fillHi: '#e8f2f0',
    title: '#1a1f1e', titleHi: '#0e5751', sub: '#8a918f', subHi: '#2f6f68',
    edge: '#c3c4ba', edgeHi: '#14756e',
    btc: '#b07a2e', crbtc: '#2f8a82', creth: '#5560a8', eth: '#466aa3', burned: '#a7aaa3',
    paper: '#fbfaf7', poolFill: '#f6f5ef'
  };
  // light fill tint for each token colour
  const TINT = {
    '#b07a2e': '#f5ecda', '#2f8a82': '#e2f0ee', '#5560a8': '#e9ebf6',
    '#466aa3': '#e7eef6', '#a7aaa3': '#eeeeeb'
  };
  const FONT = "'Inter', system-ui, sans-serif";

  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG, tag);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function text(parent, x, y, str, opts) {
    const t = el('text', Object.assign({ x, y, 'text-anchor': 'middle', 'font-family': FONT }, opts || {}), parent);
    t.textContent = str;
    return t;
  }

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}` }, stage);

  // ---- defs: one arrow marker (fill inherits each edge's stroke, so tip + body always match) ----
  const defs = el('defs', {}, svg);
  const arrM = el('marker', { id: 'fa-arr', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7.5, markerHeight: 7.5, orient: 'auto-start-reverse' }, defs);
  el('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'context-stroke' }, arrM);

  // ---- edges (drawn first, behind nodes) ----
  const edges = {};
  function edge(key, x1, y1, x2, y2) {
    edges[key] = el('line', { x1, y1, x2, y2, stroke: C.edge, 'stroke-width': 1.2, 'marker-end': 'url(#fa-arr)' }, svg);
  }
  edge('e1', 84, 70, 84, 182);      // alice -> bitcoin
  // bitcoin -> backend, elbowed so the Oracle box sits on its horizontal run (one relayed step)
  edges['e2'] = el('path', { d: 'M 84 238 L 84 282 L 244 282', fill: 'none', stroke: C.edge, 'stroke-width': 1.2, 'marker-end': 'url(#fa-arr)' }, svg);
  edge('e4', 405, 106, 405, 72);    // backend -> committee
  edge('e5', 565, 188, 652, 162);   // backend -> ethereum
  edge('e6', 708, 176, 708, 261);   // ethereum -> Alice's wallet

  // ---- nodes (white cards; the opaque white fill also hides the edge behind the Oracle) ----
  const nodes = {};
  function node(key, cx, cy, w, h, title, sub, titleY) {
    const g = el('g', {}, svg);
    const box = el('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 10, fill: C.fill, stroke: C.stroke, 'stroke-width': 1.2 }, g);
    const ty = titleY != null ? titleY : (sub ? cy - 3 : cy + 4);
    const t1 = text(g, cx, ty, title, { 'font-size': 13, 'font-weight': 600, fill: C.title });
    const t2 = sub ? text(g, cx, ty + 15, sub, { 'font-size': 10, fill: C.sub }) : null;
    nodes[key] = { g, box, t1, t2 };
  }
  node('alice', 84, 48, 110, 44, 'Alice', 'user');
  node('btc', 84, 208, 110, 52, 'Bitcoin', 'asset chain');
  node('eth', 708, 150, 112, 52, 'Ethereum', 'asset chain');
  node('aliceEoa', 708, 286, 138, 50, 'Alice’s wallet', 'EOA on Ethereum');
  node('committee', 405, 50, 232, 44, 'Signing committee', 'threshold keys');
  node('oracle', 164, 282, 132, 34, 'Oracle', null);
  node('backend', 405, 202, 320, 192, 'Crossroads backend', null, 126);

  // ---- AMM pool inside the backend (drawn on top of the backend box) ----
  const poolG = el('g', {}, svg);
  const BASE = 262;                                   // bar baseline (bottom)
  const pool = {
    box: el('rect', { x: 400, y: 172, width: 152, height: 104, rx: 8, fill: C.poolFill, stroke: C.stroke, 'stroke-width': 1.2 }, poolG),
    header: text(poolG, 476, 188, 'AMM pool', { 'font-size': 10, 'font-weight': 600, fill: C.sub, 'letter-spacing': '0.04em' })
  };
  // reserve bars
  pool.crBTC = el('rect', { x: 438, y: BASE - 26, width: 28, height: 26, rx: 3, fill: C.crbtc, opacity: 0.9 }, poolG);
  pool.crETH = el('rect', { x: 488, y: BASE - 26, width: 28, height: 26, rx: 3, fill: C.creth, opacity: 0.9 }, poolG);
  text(poolG, 452, 270, 'crBTC', { 'font-size': 8, 'font-weight': 600, fill: C.crbtc });
  text(poolG, 502, 270, 'crETH', { 'font-size': 8, 'font-weight': 600, fill: C.creth });
  // swap arrow (crBTC -> crETH), shown during the trade step
  pool.arrow = el('path', { d: 'M 466 220 Q 477 210 488 220', fill: 'none', stroke: C.edgeHi, 'stroke-width': 1.4, 'marker-end': 'url(#fa-arr)', opacity: 0 }, poolG);

  function setPool(traded, hi) {
    const crB = traded ? { y: BASE - 44, h: 44 } : { y: BASE - 26, h: 26 };
    const crE = traded ? { y: BASE - 12, h: 12 } : { y: BASE - 26, h: 26 };
    pool.crBTC.setAttribute('y', crB.y); pool.crBTC.setAttribute('height', crB.h);
    pool.crETH.setAttribute('y', crE.y); pool.crETH.setAttribute('height', crE.h);
    pool.box.setAttribute('stroke', hi ? C.strokeHi : C.stroke);
    pool.box.setAttribute('fill', hi ? C.fillHi : C.poolFill);
    pool.header.setAttribute('fill', hi ? C.subHi : C.sub);
    pool.arrow.setAttribute('opacity', hi ? 1 : 0);
  }

  // ---- ghost token (the crBTC going INTO the pool during the trade) ----
  const ghostG = el('g', {}, svg);
  ghostG.setAttribute('opacity', 0);
  el('circle', { cx: 452, cy: 222, r: 11, fill: TINT[C.crbtc], stroke: C.crbtc, 'stroke-width': 1.3 }, ghostG);
  text(ghostG, 452, 225, 'crBTC', { 'font-size': 7, 'font-weight': 600, fill: C.crbtc });

  // ---- main token (flat chip: light fill, coloured border + label) ----
  const tokenG = el('g', {}, svg);
  tokenG.style.transition = 'transform 650ms cubic-bezier(.4,0,.2,1)';
  const tokenRing = el('circle', { r: 22, fill: 'none', stroke: 'transparent', 'stroke-width': 1.4, 'stroke-dasharray': '3 3' }, tokenG);
  const tokenCirc = el('circle', { r: 18, fill: TINT[C.btc], stroke: C.btc, 'stroke-width': 1.5 }, tokenG);
  const tokenTxt = text(tokenG, 0, 4, 'BTC', { 'font-size': 10, 'font-weight': 700, fill: C.btc });
  function placeToken(x, y) { tokenG.style.transform = `translate(${x}px, ${y}px)`; }

  // ---- steps (titles/bodies unchanged) ----
  const steps = [
    {
      title: 'Deposit',
      body: 'Alice sends BTC to a Crossroads address controlled by the signing committee on Bitcoin. The deposit carries a tag (e.g. via the zero-value OP_RETURN output in Bitcoin transactions) binding it to her backend Crossroads account.',
      nodes: ['alice', 'btc'], edges: ['e1'], pool: false,
      token: { x: 84, y: 126, label: 'BTC', color: C.btc, state: null }
    },
    {
      title: 'Verify finality',
      body: "Bitcoin's oracle waits until the deposit is finalized, then relays the transaction inclusion to the backend chain.",
      nodes: ['btc', 'oracle', 'backend'], edges: ['e2'], pool: false,
      token: { x: 84, y: 126, label: 'BTC', color: C.btc, state: 'lock' }
    },
    {
      title: 'Mint',
      body: 'The asset contract verifies the proof and mints crBTC, an ERC-20 representation of her bitcoin, to Alices account on the backend chain.',
      nodes: ['backend'], edges: [], pool: false,
      token: { x: 322, y: 205, label: 'crBTC', color: C.crbtc, state: null }
    },
    {
      title: 'Trade',
      body: "Alice can now swap crBTC for crETH on a standard AMM contract such as Uniswap in the backend chain settling a BTC-to-ETH exchange atomically.",
      nodes: ['backend'], edges: [], pool: true, poolHi: true, ghost: true,
      token: { x: 505, y: 224, label: 'crETH', color: C.creth, state: null }
    },
    {
      title: 'Burn',
      body: 'To cash out, Alice burns her crETH on the backend chain. The burn authorizes a withdrawal of the underlying ETH.',
      nodes: ['backend'], edges: [], pool: true,
      token: { x: 322, y: 205, label: 'crETH', color: C.burned, state: 'burn' }
    },
    {
      title: 'Sign',
      body: 'The signing committee reads the asset contract, verifies the tokens have been burned, and threshold-signs an Ethereum transfer of the corresponding assets from the crossroad address in Ethereum to Alices EOA.',
      nodes: ['committee', 'backend'], edges: ['e4'], pool: true,
      token: { x: 600, y: 176, label: 'ETH', color: C.eth, state: 'pending' }
    },
    {
      title: 'Withdraw',
      body: 'Alice broadcasts the signed transaction and receives native ETH on Ethereum on her own address. The oracle confirms it and settles her balance on the backend chain.',
      nodes: ['eth', 'aliceEoa'], edges: ['e5', 'e6'], pool: true,
      token: { x: 708, y: 210, label: 'ETH', color: C.eth, state: null }
    }
  ];

  let cur = 0;
  let timer = null;

  function resetStyles() {
    Object.values(nodes).forEach(n => {
      n.box.setAttribute('stroke', C.stroke);
      n.box.setAttribute('fill', C.fill);
      n.t1.setAttribute('fill', C.title);
      if (n.t2) n.t2.setAttribute('fill', C.sub);
    });
    Object.values(edges).forEach(e => {
      e.setAttribute('stroke', C.edge);
      e.setAttribute('stroke-width', 1.2);
    });
  }

  function render(i) {
    cur = i;
    const s = steps[i];
    resetStyles();
    (s.nodes || []).forEach(k => {
      const n = nodes[k];
      if (!n) return;
      n.box.setAttribute('stroke', C.strokeHi);
      n.box.setAttribute('fill', C.fillHi);
      n.t1.setAttribute('fill', C.titleHi);
      if (n.t2) n.t2.setAttribute('fill', C.subHi);
    });
    (s.edges || []).forEach(k => {
      const e = edges[k];
      if (!e) return;
      e.setAttribute('stroke', C.edgeHi);
      e.setAttribute('stroke-width', 2);
    });

    // pool + ghost
    setPool(!!s.pool, !!s.poolHi);
    ghostG.setAttribute('opacity', s.ghost ? 1 : 0);

    // token
    const tk = s.token;
    placeToken(tk.x, tk.y);
    tokenCirc.setAttribute('fill', TINT[tk.color] || '#ffffff');
    tokenCirc.setAttribute('stroke', tk.color);
    tokenTxt.textContent = tk.label;
    tokenTxt.setAttribute('font-size', tk.label.length > 4 ? 8.5 : 10);
    tokenTxt.setAttribute('fill', tk.color);
    tokenG.style.opacity = tk.state === 'burn' ? 0.6 : 1;
    if (tk.state === 'lock' || tk.state === 'pending') tokenRing.setAttribute('stroke', '#9aa19e');
    else if (tk.state === 'burn') tokenRing.setAttribute('stroke', '#b3b6af');
    else tokenRing.setAttribute('stroke', 'transparent');

    // description — toggle the active pre-rendered panel (heights are reserved, so nothing shifts)
    descEls.forEach((d, di) => d.classList.toggle('active', di === i));

    // dots + buttons
    Array.from(dotsBox.children).forEach((d, di) => d.classList.toggle('active', di === i));
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === steps.length - 1;
  }

  // dots
  steps.forEach((s, i) => {
    const d = document.createElement('button');
    d.className = 'flow-dot';
    d.setAttribute('aria-label', `Step ${i + 1}: ${s.title}`);
    d.addEventListener('click', () => { stop(); render(i); });
    dotsBox.appendChild(d);
  });

  // pre-render every step's description, stacked in one grid cell, so the panel height stays constant
  const descEls = steps.map((s, i) => {
    const d = document.createElement('div');
    d.className = 'flow-step-desc';
    d.innerHTML =
      `<p class="flow-step-num">Step ${i + 1} of ${steps.length} &middot; ${s.title}</p>` +
      `<p class="flow-step-body">${s.body}</p>`;
    descBox.appendChild(d);
    return d;
  });

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.innerHTML = '&#9654;&nbsp;Play';
  }
  function play() {
    if (cur >= steps.length - 1) render(0);
    playBtn.innerHTML = '&#10073;&#10073;&nbsp;Pause';
    timer = setInterval(() => {
      if (cur >= steps.length - 1) { stop(); return; }
      render(cur + 1);
    }, 2400);
  }

  prevBtn.addEventListener('click', () => { stop(); if (cur > 0) render(cur - 1); });
  nextBtn.addEventListener('click', () => { stop(); if (cur < steps.length - 1) render(cur + 1); });
  playBtn.addEventListener('click', () => { timer ? stop() : play(); });

  render(0);
})();
