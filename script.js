const state = {
  balance: 500,
  history: [],
  currentGame: 'blackjack',
  stats: {
    rounds: 0,
    wins: 0,
    losses: 0,
    totalWon: 0,
    totalLost: 0,
  },
};

const gameTitle = document.getElementById('gameTitle');
const gameIntro = document.getElementById('gameIntro');
const gameArea = document.getElementById('gameArea');
const balanceValue = document.getElementById('balanceValue');
const historyList = document.getElementById('historyList');
const statsGrid = document.getElementById('statsGrid');

function formatMoney(value) {
  return `${value} jetons`;
}

function updateBalance() {
  balanceValue.textContent = state.balance;
  updateStats();
}

function addHistory(text) {
  state.history.unshift(text);
  state.history = state.history.slice(0, 6);
  historyList.innerHTML = state.history.map((item) => `<li>${item}</li>`).join('');
}

function recordRound(result, amount, won) {
  state.stats.rounds += 1;
  if (result === 'win') {
    state.stats.wins += 1;
    state.stats.totalWon += won;
  } else if (result === 'lose') {
    state.stats.losses += 1;
    state.stats.totalLost += amount;
  }
  updateStats();
}

function updateStats() {
  statsGrid.innerHTML = [
    ['Parties', state.stats.rounds],
    ['Victoires', state.stats.wins],
    ['Défaites', state.stats.losses],
    ['Jetons gagnés', state.stats.totalWon],
    ['Jetons perdus', state.stats.totalLost],
    ['Solde', state.balance],
  ].map(([label, value]) => `<article class="stat-box"><strong>${value}</strong><span>${label}</span></article>`).join('');
}

function renderCardHand(cards) {
  return `<div class="hand-row">${cards
    .map((card, index) => `<span class="card-chip pop" style="animation-delay:${index * 40}ms">${card}</span>`)
    .join('')}</div>`;
}

function setGame(game) {
  state.currentGame = game;
  document.querySelectorAll('.game-card').forEach((button) => {
    button.classList.toggle('active', button.dataset.game === game);
  });

  const labels = {
    blackjack: ['Blackjack', 'Choisissez votre mise puis lancez une partie.'],
    roulette: ['Roulette', 'Choisissez un numéro, une couleur ou une parité.'],
    craps: ['Craps', 'Pariez sur le lancer de dés et tentez la victoire.'],
    slots: ['Machine à sous', 'Choisissez une mise et faites tourner les rouleaux.'],
  };

  const [title, intro] = labels[game] || labels.blackjack;
  gameTitle.textContent = title;
  gameIntro.textContent = intro;

  if (game === 'blackjack') {
    renderBlackjack();
  } else if (game === 'roulette') {
    renderRoulette();
  } else if (game === 'craps') {
    renderCraps();
  } else {
    renderSlots();
  }
}

function renderBlackjack() {
  gameArea.innerHTML = `
    <article class="game-box">
      <h3>Blackjack</h3>
      <p class="muted">Le but : totaliser 21 sans dépasser. Le croupier joue à partir de 17.</p>
      <div class="form-row">
        <div class="field"><label for="bjBet">Mise</label><input id="bjBet" type="number" min="10" max="${state.balance}" value="50" /></div>
        <div class="inline-actions">
          <button class="button button-primary" id="bjStart">Démarrer</button>
          <button class="button button-secondary" id="bjRules">Règles</button>
        </div>
      </div>
      <div id="bjResult" class="result-box info">Choisissez une mise puis démarrez une partie.</div>
    </article>
  `;

  document.getElementById('bjStart').addEventListener('click', () => {
    const bet = Number(document.getElementById('bjBet').value || 0);
    if (!Number.isFinite(bet) || bet < 10 || bet > state.balance) {
      showResult('bjResult', 'Mise invalide : entrez une valeur entre 10 et votre solde.', 'error');
      return;
    }

    state.balance -= bet;
    updateBalance();

    const deck = createDeck();
    const player = [draw(deck), draw(deck)];
    const dealer = [draw(deck), draw(deck)];

    const finish = () => {
      const dealerScore = score(dealer);
      const playerScore = score(player);
      let message = '';
      let tone = 'info';

      if (playerScore === 21 && player.length === 2 && dealerScore !== 21) {
        const bonus = Math.floor(bet * 1.5);
        state.balance += bet + bonus;
        message = `Blackjack ! Vous gagnez ${bonus} jetons bonus (${bet} + ${bonus}).`;
        tone = 'success';
        recordRound('win', bet, bonus);
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        state.balance += bet * 2;
        message = `Vous gagnez ${bet} jetons. Score final : ${playerScore} contre ${dealerScore}.`;
        tone = 'success';
        recordRound('win', bet, bet);
      } else if (playerScore === dealerScore) {
        state.balance += bet;
        message = `Égalité, votre mise de ${bet} jetons est remboursée.`;
        tone = 'info';
        recordRound('draw', bet, 0);
      } else {
        message = `Le croupier gagne. Vous perdez ${bet} jetons.`;
        tone = 'error';
        recordRound('lose', bet, 0);
      }

      showResult('bjResult', `${message} Solde : ${formatMoney(state.balance)}.`, tone);
      addHistory(`Blackjack : ${message}`);
      updateBalance();
    };

    const render = () => {
      const dealerVisible = dealer.map((card, index) => (index === 1 ? '?' : card));
      const playerScore = score(player);
      const dealerScore = score(dealer.slice(0, 1));

      gameArea.innerHTML = `
        <article class="game-box casino-surface">
          <div class="table-top">
            <p class="table-label">Blackjack</p>
            <h3>Table de jeu</h3>
            <p class="muted">Mise : ${bet} jetons</p>
            <div class="badge-row"><span>Vous : ${playerScore}</span><span>Croupier visible : ${dealerScore}</span></div>
            <div class="card-stack">
              <div>
                <strong>Vos cartes</strong>
                ${renderCardHand(player)}
              </div>
            </div>
            <div class="card-stack">
              <div>
                <strong>Cartes du croupier</strong>
                ${renderCardHand(dealerVisible)}
              </div>
            </div>
          </div>
          <div class="inline-actions">
            <button class="button button-primary" id="bjHit">Tirer</button>
            <button class="button button-secondary" id="bjStand">Rester</button>
          </div>
          <div id="bjStatus" class="result-box info">Choisissez tirer ou rester.</div>
        </article>
      `;

      document.getElementById('bjHit').addEventListener('click', () => {
        const hitButton = document.getElementById('bjHit');
        hitButton.classList.add('spin-pill');
        setTimeout(() => hitButton.classList.remove('spin-pill'), 220);
        player.push(draw(deck));
        const scoreNow = score(player);
        if (scoreNow > 21) {
          showResult('bjStatus', `Vous dépassez 21. Vous perdez ${bet} jetons.`, 'error');
          addHistory(`Blackjack : vous dépassez 21, perte de ${bet} jetons.`);
          updateBalance();
          return;
        }
        render();
      });

      document.getElementById('bjStand').addEventListener('click', () => {
        const standButton = document.getElementById('bjStand');
        standButton.classList.add('spin-pill');
        setTimeout(() => standButton.classList.remove('spin-pill'), 220);
        while (score(dealer) < 17) dealer.push(draw(deck));
        finish();
      });
    };

    if (score(player) === 21) {
      finish();
      return;
    }

    render();
  });

  document.getElementById('bjRules').addEventListener('click', () => {
    showResult('bjResult', 'Règle : le croupier tire jusqu’à 17. Un blackjack naturel gagne avec un bonus de 1,5 fois la mise.', 'info');
  });
}

function renderRoulette() {
  gameArea.innerHTML = `
    <article class="game-box casino-surface">
      <div class="table-top">
        <p class="table-label">Roulette</p>
        <h3>Roue de fortune</h3>
        <p class="muted">Choisissez un numéro (0–36), la couleur, la parité ou les moitiés de la roue.</p>
        <div class="form-row">
          <div class="field"><label for="rouletteType">Type de pari</label>
            <select id="rouletteType">
              <option value="numero">Numéro plein</option>
              <option value="couleur">Rouge / Noir</option>
              <option value="parite">Pair / Impair</option>
              <option value="moitie">1–18 / 19–36</option>
            </select>
          </div>
          <div class="field"><label for="rouletteValue">Valeur</label><input id="rouletteValue" type="text" value="17" /></div>
          <div class="field"><label for="rouletteBet">Mise</label><input id="rouletteBet" type="number" min="10" max="${state.balance}" value="40" /></div>
        </div>
        <div class="roulette-wheel spin-pill" aria-label="Roulette animée"><div class="roulette-center"></div></div>
      </div>
      <div class="inline-actions"><button class="button button-primary" id="rouletteStart">Lancer</button></div>
      <div id="rouletteResult" class="result-box info">Choisissez le pari et lancez la roulette.</div>
    </article>
  `;

  document.getElementById('rouletteStart').addEventListener('click', () => {
    const bet = Number(document.getElementById('rouletteBet').value || 0);
    if (!Number.isFinite(bet) || bet < 10 || bet > state.balance) {
      showResult('rouletteResult', 'Mise invalide : minimum 10 jetons.', 'error');
      return;
    }

    const type = document.getElementById('rouletteType').value;
    const value = document.getElementById('rouletteValue').value.trim().toUpperCase();
    const result = Math.floor(Math.random() * 37);
    const isRed = result !== 0 && [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(result);
    const color = result === 0 ? 'vert' : (isRed ? 'rouge' : 'noir');
    const parity = result % 2 === 0 ? 'pair' : 'impair';
    const half = result >= 19 ? '19-36' : result === 0 ? '0' : '1-18';

    let win = false;
    let gain = 0;
    let detail = '';

    if (type === 'numero') {
      const picked = Number(value);
      win = picked === result;
      gain = win ? bet * 35 : 0;
      detail = `numéro ${picked}`;
    } else if (type === 'couleur') {
      const choice = value || 'R';
      win = (choice === 'R' && color === 'rouge') || (choice === 'N' && color === 'noir') || (choice === 'V' && color === 'vert');
      gain = win ? bet * 2 : 0;
      detail = `couleur ${choice}`;
    } else if (type === 'parite') {
      const choice = value || 'P';
      win = (choice === 'P' && parity === 'pair') || (choice === 'I' && parity === 'impair');
      gain = win ? bet * 2 : 0;
      detail = `parité ${choice}`;
    } else {
      const choice = value || 'B';
      win = (choice === 'B' && half === '1-18') || (choice === 'H' && half === '19-36');
      gain = win ? bet * 2 : 0;
      detail = `moitié ${choice}`;
    }

    state.balance -= bet;
    if (win) {
      state.balance += bet + gain;
      showResult('rouletteResult', `Résultat : ${result} (${color}, ${parity}, ${half}). Vous gagnez ${gain} jetons sur le pari ${detail}.`, 'success');
      addHistory(`Roulette : ${result} (${color}) — gain de ${gain} jetons.`);
      recordRound('win', bet, gain);
    } else {
      showResult('rouletteResult', `Résultat : ${result} (${color}, ${parity}, ${half}). Vous perdez ${bet} jetons.`, 'error');
      addHistory(`Roulette : ${result} (${color}) — perte de ${bet} jetons.`);
      recordRound('lose', bet, 0);
    }
    updateBalance();
  });
}

function renderCraps() {
  gameArea.innerHTML = `
    <article class="game-box casino-surface">
      <div class="table-top">
        <p class="table-label">Craps</p>
        <h3>Table de dés</h3>
        <p class="muted">Choisissez un type de pari : Pass Line, Don't Pass ou Any Seven.</p>
        <div class="form-row">
          <div class="field"><label for="crapsType">Pari</label>
            <select id="crapsType">
              <option value="pass">Pass Line</option>
              <option value="dontpass">Don't Pass</option>
              <option value="any7">Any Seven</option>
            </select>
          </div>
          <div class="field"><label for="crapsBet">Mise</label><input id="crapsBet" type="number" min="10" max="${state.balance}" value="30" /></div>
          <div class="inline-actions"><button class="button button-primary" id="crapsStart">Lancer les dés</button></div>
        </div>
        <div class="badge-row"><span class="dice-face">⚀</span><span class="dice-face">⚁</span></div>
      </div>
      <div id="crapsResult" class="result-box info">Choisissez votre pari puis lancez les dés.</div>
    </article>
  `;

  document.getElementById('crapsStart').addEventListener('click', () => {
    const bet = Number(document.getElementById('crapsBet').value || 0);
    if (!Number.isFinite(bet) || bet < 10 || bet > state.balance) {
      showResult('crapsResult', 'Mise invalide : minimum 10 jetons.', 'error');
      return;
    }

    const type = document.getElementById('crapsType').value;
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;

    state.balance -= bet;

    if (type === 'any7') {
      if (total === 7) {
        const gain = bet * 4;
        state.balance += bet + gain;
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Any Seven ! Vous gagnez ${gain} jetons bonus.`, 'success');
        addHistory(`Craps : Any Seven — gain de ${gain} jetons.`);
        recordRound('win', bet, gain);
      } else {
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Pas de 7, vous perdez ${bet} jetons.`, 'error');
        addHistory(`Craps : Any Seven — perte de ${bet} jetons.`);
        recordRound('lose', bet, 0);
      }
      updateBalance();
      return;
    }

    if (type === 'pass') {
      if (total === 7 || total === 11) {
        state.balance += bet * 2;
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Pass Line gagnant : +${bet} jetons.`, 'success');
        addHistory(`Craps : Pass Line — gain de ${bet} jetons.`);
        recordRound('win', bet, bet);
      } else if (total === 2 || total === 3 || total === 12) {
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Craps, vous perdez ${bet} jetons.`, 'error');
        addHistory(`Craps : Pass Line — perte de ${bet} jetons.`);
        recordRound('lose', bet, 0);
      } else {
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Point établi : continuez jusqu'à obtenir ${total} avant un 7.`, 'info');
        addHistory(`Craps : point ${total} établi.`);
      }
    } else {
      if (total === 2 || total === 3) {
        state.balance += bet * 2;
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Don't Pass gagnant : +${bet} jetons.`, 'success');
        addHistory(`Craps : Don't Pass — gain de ${bet} jetons.`);
        recordRound('win', bet, bet);
      } else if (total === 12) {
        state.balance += bet;
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Bar 12, mise remboursée.`, 'info');
        addHistory(`Craps : Don't Pass — mise remboursée.`);
      } else if (total === 7 || total === 11) {
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Don't Pass perdu : -${bet} jetons.`, 'error');
        addHistory(`Craps : Don't Pass — perte de ${bet} jetons.`);
        recordRound('lose', bet, 0);
      } else {
        showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Le point est ${total}, continuez jusqu'à obtenir un 7.`, 'info');
        addHistory(`Craps : point ${total} établi.`);
      }
    }

    updateBalance();
  });
}

function renderSlots() {
  gameArea.innerHTML = `
    <article class="game-box casino-surface">
      <div class="table-top">
        <p class="table-label">Machine à sous</p>
        <h3>Cabine de jeu</h3>
        <p class="muted">Trois symboles identiques rapportent un jackpot, deux identiques donnent un gain partiel.</p>
        <div class="form-row">
          <div class="field"><label for="slotsBet">Mise</label><input id="slotsBet" type="number" min="10" max="${state.balance}" value="25" /></div>
          <div class="inline-actions"><button class="button button-primary" id="slotsStart">Tirer</button></div>
        </div>
        <div class="slot-machine">
          <div class="slot-reel spin">🍒</div>
          <div class="slot-reel spin">🍋</div>
          <div class="slot-reel spin">⭐</div>
        </div>
      </div>
      <div id="slotsResult" class="result-box info">Choisissez votre mise puis faites tourner les rouleaux.</div>
    </article>
  `;

  document.getElementById('slotsStart').addEventListener('click', () => {
    const bet = Number(document.getElementById('slotsBet').value || 0);
    if (!Number.isFinite(bet) || bet < 10 || bet > state.balance) {
      showResult('slotsResult', 'Mise invalide : minimum 10 jetons.', 'error');
      return;
    }

    const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '7'];
    const r1 = symbols[Math.floor(Math.random() * symbols.length)];
    const r2 = symbols[Math.floor(Math.random() * symbols.length)];
    const r3 = symbols[Math.floor(Math.random() * symbols.length)];
    const payout = { '🍒': 2, '🍋': 3, '🍊': 4, '🍇': 5, '⭐': 8, '7': 10 };

    state.balance -= bet;
    if (r1 === r2 && r2 === r3) {
      const coeff = payout[r1] || 1;
      const gain = bet * coeff;
      state.balance += bet + gain;
      showResult('slotsResult', `Jackpot ! ${r1} ${r2} ${r3} — vous remportez ${gain} jetons (×${coeff}).`, 'success');
      addHistory(`Slots : jackpot ${r1}${r2}${r3} (+${gain}).`);
      recordRound('win', bet, gain);
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      const gain = Math.floor(bet * 1.5);
      state.balance += bet + gain;
      showResult('slotsResult', `Deux symboles identiques : ${r1} ${r2} ${r3}. Vous gagnez ${gain} jetons.`, 'info');
      addHistory(`Slots : 2 identiques ${r1}${r2}${r3} (+${gain}).`);
      recordRound('win', bet, gain);
    } else {
      showResult('slotsResult', `Aucun alignement : ${r1} ${r2} ${r3}. Vous perdez ${bet} jetons.`, 'error');
      addHistory(`Slots : échec ${r1}${r2}${r3} (-${bet}).`);
      recordRound('lose', bet, 0);
    }
    updateBalance();
  });
}

function showResult(elementId, text, tone) {
  const box = document.getElementById(elementId);
  if (!box) return;
  box.textContent = text;
  box.className = `result-box ${tone}`;
  box.animate([
    { transform: 'translateY(2px)', opacity: 0.75 },
    { transform: 'translateY(0)', opacity: 1 },
  ], { duration: 180, easing: 'ease-out' });
}

function createDeck() {
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suits = ['♠', '♥', '♦', '♣'];
  const deck = [];
  for (const suit of suits) for (const value of values) deck.push(`${value}${suit}`);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function draw(deck) {
  return deck.pop();
}

function score(cards) {
  let total = 0;
  let aces = 0;
  cards.forEach((card) => {
    const value = card[0];
    if (value === 'A') {
      total += 11;
      aces += 1;
    } else if (['J', 'Q', 'K'].includes(value) || value === '1') {
      total += 10;
    } else {
      total += Number(value);
    }
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

updateBalance();
addHistory('Bienvenue dans NEON CASINO — 500 jetons disponibles.');
setGame('blackjack');

Array.from(document.querySelectorAll('.game-card, [data-game]')).forEach((button) => {
  button.addEventListener('click', () => {
    const game = button.dataset.game;
    if (game) setGame(game);
  });
});
