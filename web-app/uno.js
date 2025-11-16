/**
 * @file uno.js
 * @description UNO UI and DOM controller module. Handles rendering, event interaction, and user interface logic
 * for a functional UNO game built on top of the core game logic in {@link module:uno-logic}.
 * @namespace UNO
 * @author Harry Warriner
 * @version 2025
 * @see {@link https://en.wikipedia.org/wiki/Uno_(card_game) | UNO on Wikipedia}
 */

import * as UNOLogic from "./uno-logic.js";

/**
 * @typedef {Object} GameState
 * @memberof UNO
 * @description Represents the full state of a UNO game at any moment.
 * @property {UNOLogic.Card} currentCard The card currently in play.
 * @property {UNOLogic.Card[][]} hands An array of hands, one per player.
 * @property {number} turn Index of the current player's turn.
 * @property {number} direction Game direction: `1` for clockwise, `-1` for counter-clockwise.
 * @property {boolean} skipNext Whether the next player is to be skipped.
 * @property {Set<number>} protectedPlayers Indices of players who are safe from being called out for UNO.
 * @property {number|null} lastSkipped Index of last player skipped due to a Skip or Draw effect.
 * @property {boolean} [pendingColorChange] Whether a Wild Draw 4 is awaiting a chosen color.
 */

const el = (id) => document.getElementById(id);

const currentCardDiv = el("currentCard");
const setupModal = el("setupModal");
const turnPopup = el("turnPopup");
const turnPopupText = el("turnPopupText");
const beginTurnButton = el("beginTurnButton");
const colorSelectModal = el("colorSelectModal");
const colorButtons = colorSelectModal.querySelectorAll(".color-option");
const drawButton = el("drawButton");

let aiPlayerIndex = null;
let numPlayers = 2;
let state = createInitialState();
let turnFinished = false;

/**
 * @memberof UNO
 * Create the initial game state with a valid starting card.
 * @returns {GameState} The starting state of the game.
 */
function createInitialState() {
  let card;
  do {
    card = UNOLogic.getRandomCard();
  } while (card.type);

  return {
    currentCard: card,
    hands: UNOLogic.dealHands(numPlayers),
    turn: 0,
    direction: 1,
    skipNext: false,
    protectedPlayers: new Set(),
    lastSkipped: null
  };
}

/**
 * Advance the turn to the next player.
 * @memberof UNO
 * @param {GameState} prevState The previous game state.
 * @returns {GameState} The updated game state with new turn.
 */
function advanceTurn(prevState) {
  const skip = prevState.skipNext ? 2 : 1;
  const nextTurn = (prevState.turn + skip * prevState.direction + prevState.hands.length) % prevState.hands.length;

  return {
    ...prevState,
    turn: nextTurn,
    skipNext: false,
    lastSkipped: skip === 2 ? nextTurn : null,
    protectedPlayers: new Set([...prevState.protectedPlayers].filter(p => p !== nextTurn)),
    pendingColorChange: false
  };
}

const rotateIndex = (i) => (i - state.turn + state.hands.length) % state.hands.length;

const drawCardForPlayer = (playerIndex, hands) =>
  hands.map((hand, i) => i === playerIndex ? UNOLogic.drawCard(hand) : hand);

const styleCardDiv = (div, card) => {
  const { bgColor, label } = UNOLogic.getCardStyle(card);
  div.className = `card ${bgColor}`;
  div.textContent = label;
};

const chooseColorViaPopup = () => new Promise((resolve) => {
  colorSelectModal.showModal();
  colorButtons.forEach(btn => {
    btn.onclick = () => {
      const color = btn.dataset.color;
      colorSelectModal.close();
      resolve(color);
    };
  });
});

const disableCurrentPlayerHand = () => {
  const handEl = el(`hand-${rotateIndex(state.turn)}`);
  if (handEl) {
    handEl.querySelectorAll(".card").forEach(div => {
      div.className = "card card-back";
      div.textContent = "";
    });
  }
};

const showTurnPopup = () => {
  turnPopupText.textContent = `Player ${state.turn + 1}'s Turn`;
  turnPopup.showModal();
};

const showTurnSummary = (card) => {
  const summary = document.createElement("div");
  summary.textContent = UNOLogic.generateTurnSummary(
    state.turn,
    numPlayers,
    state.direction,
    card,
    state.currentCard.color
  );
  Object.assign(summary.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "white",
    color: "black",
    padding: "10px",
    border: "2px solid black",
    zIndex: 1000,
    borderRadius: "8px"
  });
  document.body.appendChild(summary);
  setTimeout(() => summary.remove(), 1300);
};

const updateDirectionArrows = () => {
  const arrowsDiv = el("directionArrows");
  if (arrowsDiv) arrowsDiv.setAttribute("data-direction", state.direction);
};

/**
 * @memberof UNO
 * Show the game over modal dialog.
 * @param {number} winnerIndex Index of the winning player.
 */
function showEndGameDialog(winnerIndex) {
  const modal = el("endGameModal");
  const winnerText = el("winnerText");
  const isAI = winnerIndex === aiPlayerIndex;
  winnerText.textContent = `🎉 ${isAI ? "AI" : "Player " + (winnerIndex + 1)} wins! Well done!`;
  modal.showModal();
}

const render_current_card = () => styleCardDiv(currentCardDiv, state.currentCard);

/**
 * Render all player hands to the DOM.
 */
function renderAllHands() {
  state.hands.forEach((hand, i) => {
    if (i >= numPlayers) return;
    const rotated = rotateIndex(i);
    const handEl = el(`hand-${rotated}`);
    const playerEl = el(`player-${rotated}`);
    if (!handEl || !playerEl) return;

    playerEl.className = "player";
    playerEl.classList.add(["player-bottom", "player-left", "player-top", "player-right"][rotated]);

    const labelEl = el(`playerLabel${rotated}`);
    if (labelEl) labelEl.textContent = `Player ${i + 1}${i === aiPlayerIndex ? " (AI)" : ""}`;

    const countEl = el(`cardCount${rotated}`);
    if (countEl) countEl.textContent = hand.length;

    const isCurrent = i === state.turn;
    const isAI = i === aiPlayerIndex;
    const shouldHide = (isAI && !el("showAIHand").checked) || (!isAI && !isCurrent);

    handEl.innerHTML = "";
    hand.forEach((card, cardIndex) => {
      const div = document.createElement("div");
      div.className = "card";
      if (shouldHide) {
        div.classList.add("card-back");
      } else {
        styleCardDiv(div, card);
        if (!turnFinished && isCurrent) div.onclick = () => handleCardPlay(i, cardIndex);
      }
      handEl.appendChild(div);
    });
  });
}

/**
 * @memberof UNO
 * Handle playing a card.
 * @param {number} playerIndex Index of the player playing the card.
 * @param {number} cardIndex Index of the card in their hand.
 */
function handleCardPlay(playerIndex, cardIndex) {
  const card = state.hands[playerIndex][cardIndex];
  if (!UNOLogic.isValidPlay(card, state.currentCard)) return;

  let newHands = state.hands.map((hand, i) =>
    i === playerIndex ? hand.filter((_, j) => j !== cardIndex) : hand
  );

  let nextState = {
    ...state,
    hands: newHands,
    currentCard: { ...card }
  };

  const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);

  switch (card.value) {
    case "+2":
      nextState.hands = applyDraws(nextState.hands, next, 2);
      break;
    case "+4":
      nextState.hands = applyDraws(nextState.hands, next, 4);
      nextState.pendingColorChange = true;
      return handleColorSelection(card, nextState);
    case "Reverse":
      nextState.direction *= -1;
      break;
    case "Skip":
      nextState.skipNext = true;
      nextState.lastSkipped = next;
      break;
  }

  finalisePlayAndAdvance(nextState);
}

const applyDraws = (hands, player, count) => {
  const newHands = hands.slice();
  let hand = hands[player];
  for (let i = 0; i < count; i++) {
    hand = UNOLogic.drawCard(hand);
  }
  newHands[player] = hand;
  return newHands;
};

const handleColorSelection = (card, nextState) => {
  chooseColorViaPopup().then((selectedColor) => {
    card.color = selectedColor;
    finalisePlayAndAdvance({
      ...nextState,
      currentCard: card,
      pendingColorChange: false
    });
  });
};

/**
 * @memberof UNO
 * Finalise the current move and advance the game.
 * @param {GameState} newState The game state after a move.
 */
function finalisePlayAndAdvance(newState) {
  turnFinished = true;
  state = newState;
  updateDirectionArrows();
  render_current_card();
  renderAllHands();
  disableCurrentPlayerHand();
  if (state.hands[state.turn].length === 0) return showEndGameDialog(state.turn);

  const currentPlayer = state.turn;
  const waitForUnoTime = (state.hands[currentPlayer].length === 1 && currentPlayer !== aiPlayerIndex) ? 2000 : 0;

  setTimeout(() => {
    showTurnSummary(state.currentCard);
    setTimeout(() => {
      state = advanceTurn(state);
      turnFinished = false;
      if (state.turn === aiPlayerIndex) setTimeout(aiPlayTurn, 600);
      else showTurnPopup();
    }, 1500);
  }, waitForUnoTime);
}

/**
 * Let the AI perform its turn.
 */
function aiPlayTurn() {
  const result = UNOLogic.performAITurn(
    aiPlayerIndex,
    state.hands,
    state.currentCard,
    state.direction,
    numPlayers
  );

  state = {
    ...state,
    hands: result.updatedHands,
    currentCard: result.newCard,
    direction: result.direction,
    skipNext: result.skipNext
  };

  if (state.hands[aiPlayerIndex].length === 1 && Math.random() < 0.8) {
    state.protectedPlayers.add(aiPlayerIndex);
  }

  updateDirectionArrows();
  turnFinished = true;
  render_current_card();
  renderAllHands();
  showTurnSummary(state.currentCard);

  setTimeout(() => {
    state = advanceTurn(state);
    turnFinished = false;
    showTurnPopup();
    if (state.turn === aiPlayerIndex) setTimeout(aiPlayTurn, 600);
  }, 1500);
}

/**
 * Initialise the game by binding setup and starting UI.
 */
function initGame() {
  el("setupModal").showModal();
  el("startGame").onclick = () => {
    numPlayers = parseInt(el("numPlayersInput").value) || 2;
    aiPlayerIndex = el("vsAI").checked ? 1 : null;
    state = createInitialState();
    setupModal.close();
    renderAllHands();
    showTurnPopup();
    updateDirectionArrows();
  };
}

beginTurnButton.onclick = () => {
  turnPopup.close();
  render_current_card();
  renderAllHands();
};

drawButton.onclick = () => {
  if (!turnFinished) {
    state = {
      ...state,
      hands: drawCardForPlayer(state.turn, state.hands)
    };
    renderAllHands();
  }
};

el("unoButton").onclick = () => {
  const currentHand = state.hands[state.turn];
  if (UNOLogic.declareUno(state.turn, state.hands, state.protectedPlayers)) {
    el(`shield${state.turn}`).style.display = "inline";
    return;
  }

  const result = UNOLogic.callUno(state.turn, state.hands, state.protectedPlayers);
  if (result.caught) {
    result.punishedPlayers.forEach(i => {
      alert(`Player ${i + 1} forgot to say UNO and picked up 2 penalty cards!`);
      state.hands[i] = UNOLogic.drawCard(UNOLogic.drawCard(state.hands[i]));
    });
  } else {
    alert("False UNO! You get 2 penalty cards.");
    state.hands[state.turn] = UNOLogic.drawCard(UNOLogic.drawCard(currentHand));
  }
  renderAllHands();
};

document.addEventListener("DOMContentLoaded", () => {
  initGame();
});

export default Object.freeze({});