/* Cross-chain swap — the cost of exchanging across chains today (motivation figure).
   The route models how cross-chain DEX/bridge aggregators (LI.FI, Rango, Squid, ...) compose a
   trade: a source-chain swap into a bridge asset (USDC) -> bridge(s) through the Ethereum hub -> a
   destination swap. Cross-ecosystem and long-tail pairs need several legs, each charging a fee —
   that stacked cost is the point. Per-leg fees are grounded in published protocol fee schedules
   (see the "How these fees are estimated" note in index.html); totals illustrative on $1,000, gas extra. */
(function () {
  const fromSel = document.getElementById('swap-from');
  const toSel = document.getElementById('swap-to');
  const routeBox = document.getElementById('swap-old');
  const presetsBox = document.getElementById('swap-presets');
  if (!fromSel || !toSel || !routeBox) return;

  // chain metadata: eco = bridging ecosystem; dex = has on-chain DEXs for local swaps
  const CH = {
    Ethereum: { eco: 'ethereum', dex: true },
    Arbitrum: { eco: 'evm-l2', dex: true },
    Base: { eco: 'evm-l2', dex: true },
    Starknet: { eco: 'starknet', dex: true },
    Solana: { eco: 'solana', dex: true },
    Cosmos: { eco: 'cosmos', dex: true },
    Osmosis: { eco: 'cosmos', dex: true },
    Tron: { eco: 'tron', dex: true },
    Bitcoin: { eco: 'bitcoin', dex: false },
    XRPL: { eco: 'xrpl', dex: false }
  };

  // curated assets — majors plus assets known for gnarly cross-chain paths (lt = thin liquidity)
  const ASSETS = [
    { sym: 'ETH', chain: 'Ethereum' },
    { sym: 'USDC', chain: 'Ethereum' },
    { sym: 'BTC', chain: 'Bitcoin' },
    { sym: 'SOL', chain: 'Solana' },
    { sym: 'ETH', chain: 'Arbitrum' },
    { sym: 'ETH', chain: 'Base' },
    { sym: 'ETH', chain: 'Starknet' },
    { sym: 'STRK', chain: 'Starknet', lt: true },
    { sym: 'WIF', chain: 'Solana', lt: true },
    { sym: 'BRETT', chain: 'Base', lt: true },
    { sym: 'ATOM', chain: 'Cosmos' },
    { sym: 'OSMO', chain: 'Osmosis', lt: true },
    { sym: 'XRP', chain: 'XRPL' },
    { sym: 'SUN', chain: 'Tron', lt: true }
  ];

  const CARRY = 'USDC';                 // the cross-chain lingua franca
  const EVM = new Set(['ethereum', 'evm-l2', 'evm-alt']);
  const NOTIONAL = 1000;
  // per-leg fees (% of notional), grounded in published fee schedules (see the "How these fees are
  // estimated" note in index.html): agg = aggregator platform fee (LI.FI ~0.25%, charged once);
  // swap = DEX standard tier (Uniswap ~0.3%); swapLong = thin long-tail tier (~1% + slippage);
  // swapThor = THORChain liquidity+affiliate+outbound (~0.5%); bridge = Across/Stargate/Axelar (~0.05-0.25%).
  const FEE = { agg: 0.25, swap: 0.30, swapLong: 1.00, swapThor: 0.50, bridge: 0.15 };

  const keyOf = a => a.sym + '@' + a.chain;
  const byKey = k => ASSETS.find(a => keyOf(a) === k);
  const ecoOf = chain => CH[chain].eco;
  const sameEvm = (a, b) => EVM.has(ecoOf(a)) && EVM.has(ecoOf(b));
  function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function art(word) { return /^[aeiou]/i.test(word) ? 'an' : 'a'; }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  // bridge path (list of chains the carry asset traverses) between two bridgeable chains
  function hubPath(a, b) {
    if (a === b) return [a];
    if (sameEvm(a, b)) return [a, b];
    const p = [a];
    if (a !== 'Ethereum') p.push('Ethereum');
    if (b !== 'Ethereum') { if (p[p.length - 1] !== 'Ethereum') p.push('Ethereum'); p.push(b); }
    return p;
  }

  // populate selects
  ASSETS.forEach(a => {
    const label = `${a.sym} on ${a.chain}`;
    fromSel.add(new Option(label, keyOf(a)));
    toSel.add(new Option(label, keyOf(a)));
  });
  fromSel.value = 'ETH@Starknet';  // the paper's motivating example
  toSel.value = 'SOL@Solana';

  function step(node, label, cls) {
    return `<li class="swap-step"><span class="swap-node ${cls || ''}">${node}</span><span>${esc(label)}</span></li>`;
  }
  const HOP = '&#8646;', OK = '&#10003;';

  function renderRoute(from, to) {
    const steps = [];
    let swaps = 0, bridges = 0, feePct = 0;
    const touched = new Set([from.chain, to.chain]);

    if (from.chain === to.chain) {
      steps.push(step('1', `Have ${from.sym} on ${from.chain}`));
      if (from.sym !== to.sym) {
        steps.push(step(HOP, `Swap ${from.sym} → ${to.sym} on ${art(from.chain)} ${from.chain} DEX`, 'swap-step-hop'));
        swaps++; feePct += (from.lt || to.lt) ? FEE.swapLong : FEE.swap;
      }
      steps.push(step(OK, `Receive ${to.sym}`));
    } else {
      feePct += FEE.agg;  // aggregator platform fee, charged once on the whole route
      const sameAsset = from.sym === to.sym;
      const carry = (sameAsset && (sameEvm(from.chain, to.chain) || from.sym === CARRY)) ? from.sym : CARRY;
      let startChain = from.chain, endChain = to.chain;

      steps.push(step('1', `Have ${from.sym} on ${from.chain}`));

      // source conversion into the carry asset
      if (from.sym !== carry) {
        if (CH[from.chain].dex) {
          steps.push(step(HOP, `Swap ${from.sym} → ${carry} on ${art(from.chain)} ${from.chain} DEX`, 'swap-step-hop'));
          feePct += from.lt ? FEE.swapLong : FEE.swap;
        } else {
          steps.push(step(HOP, `Swap ${from.sym} → ${carry} via THORChain → Ethereum`, 'swap-step-hop'));
          feePct += FEE.swapThor; startChain = 'Ethereum'; touched.add('Ethereum');
        }
        swaps++;
      }
      // if destination chain can't host a local swap, the carry must arrive via Ethereum
      const destViaThor = to.sym !== carry && !CH[to.chain].dex;
      if (destViaThor) endChain = 'Ethereum';

      // bridges
      const path = hubPath(startChain, endChain);
      path.forEach(c => touched.add(c));
      for (let i = 0; i < path.length - 1; i++) {
        steps.push(step(HOP, `Bridge ${carry}: ${path[i]} → ${path[i + 1]}`, 'swap-step-hop'));
        bridges++; feePct += FEE.bridge;
      }

      // destination conversion
      if (to.sym !== carry) {
        if (CH[to.chain].dex) {
          steps.push(step(HOP, `Swap ${carry} → ${to.sym} on ${art(to.chain)} ${to.chain} DEX`, 'swap-step-hop'));
          feePct += to.lt ? FEE.swapLong : FEE.swap;
        } else {
          steps.push(step(HOP, `Swap ${carry} → ${to.sym} via THORChain`, 'swap-step-hop'));
          feePct += FEE.swapThor;
        }
        swaps++;
      }
      steps.push(step(OK, `Receive ${to.sym} on ${to.chain}`));
    }

    const actions = swaps + bridges;
    const legs = [];
    if (bridges) legs.push(plural(bridges, 'bridge'));
    if (swaps) legs.push(plural(swaps, 'swap'));
    // --- fee figures hidden for now (accuracy uncertain); uncomment to restore ---
    // const ltNote = (from.lt || to.lt)
    //   ? `<div class="swap-note">Thin liquidity on long-tail tokens can split a swap across several pools, pushing slippage and fees higher still.</div>`
    //   : '';
    // const dollars = Math.round(feePct / 100 * NOTIONAL);
    // const pctShown = (dollars / NOTIONAL * 100).toFixed(1);

    routeBox.innerHTML =
      // `<div class="swap-route-head"><span class="swap-route-title">The route today</span>` +
      // `<span class="swap-route-tag">${plural(actions, 'on-chain action')}</span></div>` +
      `<ul class="swap-steps">${steps.join('')}</ul>` +
      // `<div class="swap-summary"><span class="swap-cost swap-cost-bad">&asymp; $${dollars.toLocaleString('en-US')} in fees</span> ` +
      // `on a $1,000 swap (${pctShown}%) &middot; ${legs.join(' + ')} across ` +
      // `<strong>${touched.size} chains</strong>, each charging at its own hop.</div>` +
      // ltNote;
      `<div class="swap-summary">${legs.join(' + ')} across <strong>${touched.size} chains</strong>.</div>`;
  }

  function renderSame() {
    routeBox.innerHTML =
      `<div class="swap-route-head"><span class="swap-route-title">Pick two different assets</span></div>` +
      `<ul class="swap-steps"><li class="swap-step"><span>Choose what you hold and a different asset you want.</span></li></ul>`;
  }

  function update() {
    const from = byKey(fromSel.value), to = byKey(toSel.value);
    if (!from || !to) return;
    if (keyOf(from) === keyOf(to)) { renderSame(); }
    else { renderRoute(from, to); }
    if (presetsBox) presetsBox.querySelectorAll('.swap-preset').forEach(b =>
      b.classList.toggle('active', b.dataset.from === fromSel.value && b.dataset.to === toSel.value));
  }

  // quick "try a hard pair" presets
  const PRESETS = [
    { label: 'StarkNet ETH → SOL', from: 'ETH@Starknet', to: 'SOL@Solana' },
    { label: 'WIF → BRETT', from: 'WIF@Solana', to: 'BRETT@Base' },
    { label: 'BTC → ATOM', from: 'BTC@Bitcoin', to: 'ATOM@Cosmos' },
    { label: 'SUN → OSMO', from: 'SUN@Tron', to: 'OSMO@Osmosis' }
  ];
  if (presetsBox) {
    presetsBox.appendChild(Object.assign(document.createElement('span'),
      { className: 'swap-presets-label', textContent: 'Examples:' }));
    PRESETS.forEach(p => {
      const b = document.createElement('button');
      b.className = 'swap-preset';
      b.textContent = p.label;
      b.dataset.from = p.from; b.dataset.to = p.to;
      b.addEventListener('click', () => { fromSel.value = p.from; toSel.value = p.to; update(); });
      presetsBox.appendChild(b);
    });
  }

  fromSel.addEventListener('change', update);
  toSel.addEventListener('change', update);
  update();
})();
