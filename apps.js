/* Applications explorer */
(function () {
  const grid = document.getElementById('apps-grid');
  const filters = document.getElementById('apps-filters');
  if (!grid || !filters) return;

  const CATS = [
    { id: 'all', label: 'All' },
    { id: 'wallets', label: 'Wallets & Liquidity' },
    { id: 'universal', label: 'Universal Assets' },
    { id: 'privacy', label: 'Privacy & Compliance' }
  ];

  const APPS = [
    {
      cat: 'wallets', name: 'Chain-Agnostic Wallet', built: false, star: false,
      issue: 'Managing assets across blockchains usually means a separate wallet, gas token, and tooling for each one.',
      enables: 'A single account that holds and sends assets on every integrated chain, with your whole portfolio on one ledger.',
      contract: '—'
    },
    {
      cat: 'wallets', name: 'Cross-Chain DEX', built: true, star: false,
      issue: 'Cross-chain swaps support few networks and charge high fees, pushing users onto centralized exchanges or bridge aggregators.',
      enables: 'Standard AMM contracts perform atomic swaps between native assets from arbitrary chains — one backend trade.',
      contract: 'AMM pool (e.g. Uniswap)'
    },
    {
      cat: 'wallets', name: 'Universal Receive Addresses', built: false, star: false,
      issue: 'Merchants and donation recipients often accept only a few assets, forcing senders to convert funds themselves.',
      enables: 'Recipient-bound addresses on every chain that auto-convert incoming funds to the recipient’s asset of choice.',
      contract: 'Custom deposit + swap contracts'
    },
    {
      cat: 'universal', name: 'Universal Stablecoin', built: false, star: false,
      issue: 'Stablecoin chain support is chosen by a centralized issuer — USDT is on roughly 13 of 150+ active chains.',
      enables: 'Permissionless stablecoin deployment and spending on any integrated chain.',
      contract: 'Stablecoin issuance contract'
    },
    {
      cat: 'universal', name: 'Cross-Chain Lending & Staking', built: false, star: false,
      issue: 'Lending and staking are confined to a chain’s own assets — borrowing across chains needs custodians, and protocols can only be secured by their native token.',
      enables: 'Post collateral or stake from any chain to borrow any Crossroads asset or secure another chain — atomic cross-chain shorts, and liquid ETH or BTC backing emerging chains.',
      contract: 'Lending / staking pool (e.g. Morpho, Euler)'
    },
    {
      cat: 'universal', name: 'Universal Testnet Faucet', built: true, star: false,
      issue: 'Testnet faucets are rate-limited, depleted, or identity-gated — and AI agents can’t clear the identity checks at all.',
      enables: 'Convert proof-of-work (Monero) directly into funds on any integrated testnet — no rate limits or identity.',
      contract: 'Faucet token contract'
    },
    {
      cat: 'privacy', name: 'Private Payments', built: true, star: true,
      issue: 'On-chain transactions are public; matching the privacy of a centralized exchange otherwise means trusting a custodian.',
      enables: 'Private transfers that leak only the size of deposits and withdrawals as funds enter or leave Crossroads.',
      contract: '—'
    },
    {
      cat: 'privacy', name: 'Private Asset Management', built: false, star: true,
      issue: 'Institutions need confidentiality, but most liquidity lives on public chains — forcing a custody vs. liquidity trade-off.',
      enables: 'Private institutional management of public-chain assets with fine-grained disclosure policies.',
      contract: 'Disclosure-management contract'
    },
    {
      cat: 'privacy', name: 'On-Chain Compliance', built: false, star: false,
      issue: 'Compliance is usually enforced off-chain by centralized, opaque entities.',
      enables: 'Transparent, smart-contract-enforced policies (e.g. KYC whitelisting) that compose with private apps.',
      contract: 'KYC / whitelisting contracts'
    }
  ];

  const catLabel = id => (CATS.find(c => c.id === id) || {}).label || id;
  function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  // build filter chips
  CATS.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'apps-filter' + (i === 0 ? ' active' : '');
    b.textContent = c.label;
    b.dataset.cat = c.id;
    b.addEventListener('click', () => setFilter(c.id, b));
    filters.appendChild(b);
  });

  // build cards
  APPS.forEach(app => {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.dataset.cat = app.cat;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', 'false');

    const badges =
      (app.built ? '<span class="apps-badge apps-badge-built">Built</span>' : '') +
      (app.star ? '<span class="apps-mark" title="Needs a privacy-preserving backend">&lowast;</span>' : '');

    card.innerHTML =
      `<span class="app-card-cat" data-cat="${app.cat}">${esc(catLabel(app.cat))}</span>` +
      `<span class="app-card-name">${esc(app.name)} ${badges}</span>` +
      `<p class="app-card-tease">${esc(app.enables)}</p>` +
      `<div class="app-card-detail">` +
        `<div class="app-detail-row"><span class="app-detail-label">The problem</span>${esc(app.issue)}</div>` +
        `<div class="app-detail-row"><span class="app-detail-label">Crossroads enables</span>${esc(app.enables)}</div>` +
        `<div class="app-detail-row"><span class="app-detail-label">Backend contract</span><span class="app-contract">${esc(app.contract)}</span></div>` +
      `</div>`;

    const toggle = () => {
      const open = card.classList.toggle('open');
      card.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    grid.appendChild(card);
  });

  function setFilter(cat, btn) {
    filters.querySelectorAll('.apps-filter').forEach(b => b.classList.toggle('active', b === btn));
    grid.querySelectorAll('.app-card').forEach(card => {
      const show = cat === 'all' || card.dataset.cat === cat;
      card.style.display = show ? '' : 'none';
    });
  }
})();
