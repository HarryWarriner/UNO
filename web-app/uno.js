import * as UNOLogic from "./uno-logic.js";

/**
 * @namespace UNO
 */
const UNO = Object.create(null);

/**
 * @typedef {Object} GameState
 * @property {Card} currentCard
 * @property {Card[][]} hands
 * @property {number} turn
 * @property {number} direction
 * @property {boolean} skipNext
 * @property {Set<number>} protectedPlayers
 * @property {number|null} lastSkipped
 */

// HTML Elements
const startGame_button = document.getElementById("startGame");
const unoButton = document.getElementById("unoButton");
const numPlayersInput = document.getElementById("numPlayersInput");
const currentCardDiv = document.getElementById("currentCard");
const handsContainer = document.getElementById("handsContainer");
const playerStatsList = document.getElementById("playerStats");
const directionIndicator = document.getElementById("directionIndicator");
const vsAI_checkbox = document.getElementById("vsAI");
const showAIHand_checkbox = document.getElementById("showAIHand");
const colorSelectModal = document.getElementById("colorSelectModal");
const colorButtons = document.querySelectorAll(".color-option");


let aiPlayerIndex = null;
let numPlayers = 2;
let state = createInitialState();
let handVisible = true;
let turnFinished = false;

/**
 * Create the initial game state.
 * @returns {GameState}
 */
function createInitialState() {
  let card;
  do {
    card = UNOLogic.getRandomCard();
  } while (card.type); // Start with a number card

  return {
    currentCard: card,
    hands: UNOLogic.dealHands(numPlayers),
    turn: 0,
    direction: 1,
    skipNext: false,
    protectedPlayers: new Set(),
    lastSkipped: null,
  };
}

/**
 * Advance the turn and return new game state.
 * @param {GameState} s
 * @returns {GameState}
 */
function advanceTurn(s) {
  const skip = s.skipNext ? 2 : 1;
  const nextTurn = (s.turn + skip * s.direction + s.hands.length) % s.hands.length;
  return {
    ...s,
    turn: nextTurn,
    skipNext: false,
    lastSkipped: skip === 2 ? nextTurn : null,
    protectedPlayers: new Set([...s.protectedPlayers].filter(p => p !== nextTurn)),
  };
}

/**
 * Start a new game session.
 * @function
 */
UNO.start_game = () => {
  numPlayers = parseInt(numPlayersInput.value) || 2;
  aiPlayerIndex = vsAI_checkbox.checked ? 1 : null;
  state = createInitialState();
  turnFinished = false;

  unoButton.disabled = false;

  UNO.render_current_card();
  UNO.renderAllHands();
  UNO.renderPlayerStats();
  UNO.updateDirectionArrow();

  if (state.turn === aiPlayerIndex) {
    setTimeout(UNO.ai_play_turn, 500);
  }
};

/**
 * Begin a player's turn.
 * @function
 */
UNO.start_turn = () => {
  handVisible = true;
  turnFinished = false;
};

/**
 * Proceed to next player.
 * @function
 */
UNO.next_turn = () => {
  state = advanceTurn(state);
  UNO.start_turn();
  UNO.renderAllHands();
  UNO.renderPlayerStats();

  if (state.turn === aiPlayerIndex) {
    setTimeout(UNO.ai_play_turn, 800);
  }
};

/**
 * Handle card drawing.
 * @param {number} playerIndex
 */
UNO.draw_card = (playerIndex) => {
  if (turnFinished) return;

  const newHand = UNOLogic.drawCard(state.hands[playerIndex]);
  state.hands = state.hands.map((h, i) => (i === playerIndex ? newHand : h));

  UNO.render_hand(playerIndex);
  UNO.renderPlayerStats();
};

/**
 * Render all player hands.
 */
UNO.renderAllHands = () => {
  handsContainer.innerHTML = "";

  const index = state.turn;
  const isAI = index === aiPlayerIndex;
  const showAIHand = showAIHand_checkbox.checked;

  const section = document.createElement("div");
  section.classList.add("hand-section");

  const title = document.createElement("h2");
  title.textContent = `Player ${index + 1}'s cards:` + (isAI ? " (AI)" : "");

  const drawBtn = document.createElement("button");
  drawBtn.textContent = "Draw";
  drawBtn.className = "buttoncss";
  drawBtn.onclick = () => UNO.draw_card(index);
  drawBtn.disabled = isAI;

  const header = document.createElement("div");
  header.className = "hand-header";
  header.appendChild(title);
  if (!isAI) header.appendChild(drawBtn);

  const handDiv = document.createElement("div");
  handDiv.id = `hand-${index}`;
  handDiv.style.backgroundColor = isAI && showAIHand ? "red" : "";

  section.appendChild(header);
  section.appendChild(handDiv);
  handsContainer.appendChild(section);

  if (!isAI || showAIHand) {
    UNO.render_hand(index);
  } else {
    handDiv.textContent = "(AI hand hidden)";
    handDiv.style.fontStyle = "italic";
    handDiv.style.color = "gray";
  }
};

/**
 * Render one hand.
 * @param {number} index
 */
UNO.render_hand = (index) => {
  const handDiv = document.getElementById(`hand-${index}`);
  handDiv.innerHTML = "";

  state.hands[index].forEach((card, cardIndex) => {
    const div = document.createElement("div");
    div.className = "card";
    styleCardDiv(div, card);

    div.onclick = () => {
      if (state.turn !== index || turnFinished) return;
      if (!UNOLogic.isValidPlay(card, state.currentCard)) return;

      const newHand = state.hands[index].filter((_, i) => i !== cardIndex);
      state.hands = state.hands.map((h, i) => (i === index ? newHand : h));
      state.currentCard = { ...card };

      const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);

      if (card.type === "+2") {
        state.hands[next] = UNOLogic.drawCard(UNOLogic.drawCard(state.hands[next]));
      }

      if (card.type === "+4") {
        const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);
        for (let i = 0; i < 4; i++) {
          state.hands[next] = UNOLogic.drawCard(state.hands[next]);
        }

        // Show modal and wait for color selection
        chooseColorViaPopup().then((selectedColor) => {
          state.currentCard.color = selectedColor;
          finalizeCardPlay(); 
        });

        return;
      }


      if (card.type === "Reverse") {
        state.direction *= -1;
      }

      if (card.type === "Skip") {
        state.skipNext = true;
        state.lastSkipped = next;
      }

      turnFinished = true;
      UNO.render_current_card();
      UNO.updateDirectionArrow();
      UNO.renderPlayerStats();
      showTurnSummary(card);
    };

    handDiv.appendChild(div);
  });
};

function finalizeCardPlay() {
  UNO.render_current_card();
  UNO.updateDirectionArrow();
  UNO.renderPlayerStats();
  turnFinished = true;
  showTurnSummary(state.currentCard);
}


/**
 * Update direction indicator.
 */
UNO.updateDirectionArrow = () => {
  directionIndicator.textContent = state.direction === 1 ? "⬇️" : "⬆️";
};

/**
 * Render current card.
 */
UNO.render_current_card = () => {
  styleCardDiv(currentCardDiv, state.currentCard);
};

/**
 * Render player stats.
 */
UNO.renderPlayerStats = () => {
  playerStatsList.innerHTML = "";

  state.hands.forEach((hand, index) => {
    const li = document.createElement("li");
    let text = `Player ${index + 1}`;

    if (index === aiPlayerIndex) text += " (AI)";
    text += `: ${hand.length} card${hand.length !== 1 ? "s" : ""}`;

    if (hand.length === 1 && state.protectedPlayers.has(index)) text += " (UNO!)";
    if (state.lastSkipped === index && state.turn !== index) text += " (SKIPPED)";

    li.textContent = text;
    if (index === state.turn) li.style.fontWeight = "bold";

    playerStatsList.appendChild(li);
  });
};

/**
 * Handle UNO button click.
 */
unoButton.onclick = () => {
  if (!handVisible) return;

  const currentHand = state.hands[state.turn];

  if (UNOLogic.declareUno(state.turn, state.hands, state.protectedPlayers)) {
    alert("You're protected! UNO declared.");
    UNO.renderPlayerStats();
    return;
  }

  const result = UNOLogic.callUno(state.turn, state.hands, state.protectedPlayers);

  if (result.caught) {
    result.punishedPlayers.forEach(i => {
      alert(`Player ${i + 1} forgot to say UNO and picked up 2 penalty cards!`);
    });
  } else {
    alert("False UNO! You get 2 penalty cards.");
    state.hands[state.turn] = UNOLogic.drawCard(UNOLogic.drawCard(currentHand));
    turnFinished = true;
  }

  UNO.render_hand(state.turn);
  UNO.renderPlayerStats();
};

/**
 * Handle +4 Colour picking
 */
function chooseColorViaPopup() {
  return new Promise((resolve) => {
    colorSelectModal.showModal();
    colorButtons.forEach(button => {
      button.onclick = () => {
        const color = button.dataset.color;
        colorSelectModal.close();
        resolve(color);
      };
    });
  });
}


/**
 * Handle AI turn.
 */
UNO.ai_play_turn = () => {
  const result = UNOLogic.performAITurn(
    aiPlayerIndex,
    state.hands,
    state.currentCard,
    state.direction,
    numPlayers
  );

  state.hands = result.updatedHands;
  state.currentCard = result.newCard;
  state.direction = result.direction;
  if (result.skipNext) state.skipNext = true;

  turnFinished = true;
  UNO.render_current_card();
  UNO.updateDirectionArrow();
  UNO.renderPlayerStats();
  UNO.renderAllHands();

  showTurnSummary(state.currentCard);
};

/**
 * Apply visual styling to a card.
 * @param {HTMLElement} div
 * @param {Card} card
 */
function styleCardDiv(div, card) {
  const { bgColor, label } = UNOLogic.getCardStyle(card);
  div.style.backgroundColor = bgColor;
  div.textContent = label;
}

/**
 * Show turn summary after card played.
 * @param {Card} card
 */
function showTurnSummary(card) {
  const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);

  if (next === aiPlayerIndex) {
    UNO.next_turn();
    return;
  }

  handsContainer.innerHTML = "";
  const container = document.createElement("div");
  container.className = "mid-page-container";

  const summary = document.createElement("div");
  summary.className = "turn-summary";
  summary.textContent = UNOLogic.generateTurnSummary(
    state.turn, numPlayers, state.direction, card, state.currentCard.color
  );

  const continueBtn = document.createElement("button");
  continueBtn.textContent = "Continue to Next Player";
  continueBtn.className = "buttoncss";
  continueBtn.onclick = UNO.next_turn;

  container.appendChild(summary);
  container.appendChild(continueBtn);
  handsContainer.appendChild(container);
}

// Attach start game button
startGame_button.onclick = UNO.start_game;

export default Object.freeze(UNO);
