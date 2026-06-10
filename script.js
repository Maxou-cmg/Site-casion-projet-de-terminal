const state = {
  balance: 500,
  history: [],
  currentGame: 'blackjack',
};

const gameTitle = document.getElementById('gameTitle');
const gameIntro = document.getElementById('gameIntro');
const gameArea = document.getElementById('gameArea');
const balanceValue = document.getElementById('balanceValue');
const historyList = document.getElementById('historyList');

function formatMoney(value) {
  return `${value} jetons`;
}

function updateBalance() {
  balanceValue.textContent = state.balance;
}

function addHistory(text) {
  state.history.unshift(text);
  state.history = state.history.slice(0, 6);
  historyList.innerHTML = state.history.map((item) => `<li>${item}</li>`).join('');
}

function renderCardHand(cards) {
  return `<div class="hand-row">${cards
    .map((card) => `<span class="card-chip">${card}</span>`)
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
        <div class="field"><label for="bjBet">Mise</label><input id="bjBet" type="number" min="10" value="50" /></div>
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
    let playerScore = score(player);

    function reveal() {
      const dealerScore = score(dealer);
      const playerFinal = score(player);
      let resultText = '';
      let kind = 'info';
      if (dealerScore > 21 || playerFinal > dealerScore) {
        state.balance += bet * 2;
        resultText = `Vous gagnez ${bet} jetons ! Score final : ${playerFinal} contre ${dealerScore}.`;
        kind = 'success';
      } else if (playerFinal === dealerScore) {
        state.balance += bet;
        resultText = `Égalité, votre mise est remboursée (${bet} jetons).`;
        kind = 'info';
      } else {
        resultText = `Le croupier gagne. Vous perdez ${bet} jetons.`;
        kind = 'error';
      }
      showResult('bjResult', `${resultText} Solde actuel : ${formatMoney(state.balance)}.`, kind);
      addHistory(`Blackjack : ${resultText}`);
      updateBalance();
    }

    const drawDealer = () => {
      while (score(dealer) < 17) dealer.push(draw(deck));
      reveal();
    };

    const render = () => {
      const playerScoreNow = score(player);
      const dealerVisible = dealer.length > 1 ? [dealer[0], '?'] : dealer;
      gameArea.innerHTML = `
        <article class="game-box">
          <h3>Blackjack en cours</h3>
          <p class="muted">Mise : ${bet} jetons</p>
          <div class="badge-row"><span>Vous : ${playerScoreNow}</span><span>Croupier : ${score([dealer[0]])}</span></div>
          <p><strong>Vos cartes</strong>${renderCardHand(player)}</p>
          <p><strong>Cartes du croupier</strong>${renderCardHand(dealerVisible)}</p>
          <div class="inline-actions">
            <button class="button button-primary" id="bjHit">Tirer</button>
            <button class="button button-secondary" id="bjStand">Rester</button>
          </div>
          <div id="bjStatus" class="result-box info">Choisissez tirer ou rester.</div>
        </article>
      `;

      document.getElementById('bjHit').addEventListener('click', () => {
        player.push(draw(deck));
        if (score(player) > 21) {
          showResult('bjStatus', `Vous dépassez 21. Vous perdez ${bet} jetons.`, 'error');
          addHistory(`Blackjack : Vous dépassez 21, perte de ${bet} jetons.`);
          updateBalance();
          return;
        }
        render();
      });

      document.getElementById('bjStand').addEventListener('click', () => {
        drawDealer();
      });
    };

    render();
  });

  document.getElementById('bjRules').addEventListener('click', () => {
    showResult('bjResult', 'Règle : la main la plus proche de 21 gagne. Le croupier joue à partir de 17.', 'info');
  });
}

function renderRoulette() {
  gameArea.innerHTML = `
    <article class="game-box">
      <h3>Roulette</h3>
      <p class="muted">Choisissez un numéro entre 0 et 36 ou pariez sur couleur / parité.</p>
      <div class="form-row">
        <div class="field"><label for="rouletteType">Type de pari</label>
          <select id="rouletteType"><option value="num">Numéro</option><option value="color">Couleur</option><option value="pair">Pair / impair</option></select>
        </div>
        <div class="field"><label for="rouletteValue">Valeur</label><input id="rouletteValue" type="text" value="17" /></div>
        <div class="field"><label for="rouletteBet">Mise</label><input id="rouletteBet" type="number" min="10" value="40" /></div>
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
    const color = result === 0 ? 'vert' : (result % 2 === 0 ? 'rouge' : 'noir');
    let win = false;

    if (type === 'num') {
      win = Number(value) === result;
    } else if (type === 'color') {
      win = (value === 'R' && color === 'rouge') || (value === 'N' && color === 'noir') || (value === 'V' && color === 'vert');
    } else {
      win = (value === 'P' && result % 2 === 0) || (value === 'I' && result % 2 !== 0);
    }

    state.balance -= bet;
    if (win) {
      state.balance += bet * 2;
      showResult('rouletteResult', `Résultat : ${result} (${color}). Vous gagnez ${bet} jetons !`, 'success');
      addHistory(`Roulette : ${result} (${color}) — gain de ${bet} jetons.`);
    } else {
      showResult('rouletteResult', `Résultat : ${result} (${color}). Vous perdez ${bet} jetons.`, 'error');
      addHistory(`Roulette : ${result} (${color}) — perte de ${bet} jetons.`);
    }
    updateBalance();
  });
}

function renderCraps() {
  gameArea.innerHTML = `
    <article class="game-box">
      <h3>Craps</h3>
      <p class="muted">Lancez les dés. Si vous obtenez 7 ou 11, vous gagnez ; sinon, continuez jusqu’au point.</p>
      <div class="form-row">
        <div class="field"><label for="crapsBet">Mise</label><input id="crapsBet" type="number" min="10" value="30" /></div>
        <div class="inline-actions"><button class="button button-primary" id="crapsStart">Lancer les dés</button></div>
      </div>
      <div id="crapsResult" class="result-box info">Cliquez pour lancer les dés.</div>
    </article>
  `;

  document.getElementById('crapsStart').addEventListener('click', () => {
    const bet = Number(document.getElementById('crapsBet').value || 0);
    if (!Number.isFinite(bet) || bet < 10 || bet > state.balance) {
      showResult('crapsResult', 'Mise invalide : minimum 10 jetons.', 'error');
      return;
    }
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    state.balance -= bet;
    if (total === 7 || total === 11) {
      state.balance += bet * 2;
      showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Vous gagnez ${bet} jetons !`, 'success');
      addHistory(`Craps : ${total} — gain de ${bet} jetons.`);
    } else {
      showResult('crapsResult', `Dés : ${d1} + ${d2} = ${total}. Vous perdez ${bet} jetons.`, 'error');
      addHistory(`Craps : ${total} — perte de ${bet} jetons.`);
    }
    updateBalance();
  });
}

function renderSlots() {
  gameArea.innerHTML = `
    <article class="game-box">
      <h3>Machine à sous</h3>
      <p class="muted">Trois symboles identiques rapportent un jackpot, deux identiques donnent un gain partiel.</p>
      <div class="form-row">
        <div class="field"><label for="slotsBet">Mise</label><input id="slotsBet" type="number" min="10" value="25" /></div>
        <div class="inline-actions"><button class="button button-primary" id="slotsStart">Tirer</button></div>
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
    const symbols = ['🍒', '🍋', '🍊', '⭐', '7'];
    const r1 = symbols[Math.floor(Math.random() * symbols.length)];
    const r2 = symbols[Math.floor(Math.random() * symbols.length)];
    const r3 = symbols[Math.floor(Math.random() * symbols.length)];

    state.balance -= bet;
    if (r1 === r2 && r2 === r3) {
      const coeff = { '🍒': 2, '🍋': 3, '🍊': 4, '⭐': 6, '7': 10 }[r1] || 1;
      state.balance += bet * coeff;
      showResult('slotsResult', `Jackpot ! ${r1} ${r2} ${r3} — vous gagnez ${bet * coeff} jetons.`, 'success');
      addHistory(`Slots : jackpot ${r1}${r2}${r3} (+${bet * coeff}).`);
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      state.balance += Math.floor(bet * 1.5);
      showResult('slotsResult', `Deux symboles identiques : ${r1} ${r2} ${r3}. Vous gagnez ${Math.floor(bet * 1.5)} jetons.`, 'info');
      addHistory(`Slots : 2 identiques ${r1}${r2}${r3} (+${Math.floor(bet * 1.5)}).`);
    } else {
      showResult('slotsResult', `Aucun alignement : ${r1} ${r2} ${r3}. Vous perdez ${bet} jetons.`, 'error');
      addHistory(`Slots : échec ${r1}${r2}${r3} (-${bet}).`);
    }
    updateBalance();
  });
}

function showResult(elementId, text, tone) {
  const box = document.getElementById(elementId);
  if (!box) return;
  box.textContent = text;
  box.className = `result-box ${tone}`;
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
