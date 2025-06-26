/**
 * @namespace UNO
 * @description Main UNO game logic and UI handler.
 */

import * as UNOLogic from "./uno-logic.js";

/**
 * @typedef {Object} GameState
 * @property {Card} currentCard
 * @property {Card[][]} hands
 * @property {number} turn
 * @property {number} direction
 * @property {boolean} skipNext
 * @property {Set<number>} protectedPlayers
 * @property {number|null} lastSkipped
 * @property {boolean} [pendingColorChange]
 */

// DOM Elements
const el = (id) => document.getElementById(id);

const currentCardDiv = el("currentCard");
const setupModal = el("setupModal");
const turnPopup = el("turnPopup");
const turnPopupText = el("turnPopupText");
const beginTurnButton = el("beginTurnButton");
const colorSelectModal = el("colorSelectModal");
const colorButtons = colorSelectModal.querySelectorAll(".color-option");
const drawButton = document.createElement("button");
drawButton.id = "drawButton";
drawButton.textContent = "Draw Card";
drawButton.className = "buttoncss draw-button";
document.body.appendChild(drawButton);

// Game State
let aiPlayerIndex = null;
let numPlayers = 2;
let state = createInitialState();
let turnFinished = false;

function createInitialState() {
  let card;
  do {
    card = UNOLogic.getRandomCard();
  } while (card.type); // ensure starting card is not a special

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

// UI Initialization
document.addEventListener("DOMContentLoaded", () => {
  setupModal.showModal();

  el("startGame").onclick = () => {
    numPlayers = parseInt(el("numPlayersInput").value) || 2;
    aiPlayerIndex = el("vsAI").checked ? 1 : null;
    state = createInitialState();
    turnFinished = false;
    setupModal.close();
    for (let i = numPlayers; i < 4; i++) {
      const playerEl = el(`player-${i}`);
      if (playerEl) playerEl.style.display = "none";
    }
    showTurnPopup();
    updateDirectionArrows();
  };
});

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

function drawCardForPlayer(playerIndex, hands) {
  return hands.map((hand, i) => i === playerIndex ? UNOLogic.drawCard(hand) : hand);
}

function rotateIndex(i) {
  return (i - state.turn + state.hands.length) % state.hands.length;
}

function renderAllHands() {
  state.hands.forEach((hand, i) => {
    const rotated = rotateIndex(i);
    const handEl = el(`hand-${rotated}`);
    const playerEl = el(`player-${rotated}`);
    if (!handEl || !playerEl) return;

    playerEl.className = "player";
    playerEl.classList.add(["player-bottom", "player-left", "player-top", "player-right"][rotated]);
    playerEl.querySelector(".label").textContent = `Player ${i + 1}${i === aiPlayerIndex ? " (AI)" : ""}`;

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
        if (!turnFinished && isCurrent) {
          div.onclick = () => handleCardPlay(i, cardIndex);
        }
      }
      handEl.appendChild(div);
    });
  });
}

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

  switch (card.type) {
    case "+2":
      nextState.hands = applyDraws(nextState.hands, next, 2);
      break;
    case "+4":
      nextState.hands = applyDraws(nextState.hands, next, 4);
      nextState.pendingColorChange = true;
      handleColorSelection(card);
      return;
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

function applyDraws(hands, player, count) {
  let updated = hands;
  for (let i = 0; i < count; i++) {
    updated = updated.map((hand, idx) =>
      idx === player ? UNOLogic.drawCard(hand) : hand
    );
  }
  return updated;
}

function handleColorSelection(card) {
  chooseColorViaPopup().then((selectedColor) => {
    state.currentCard.color = selectedColor;
    finalisePlayAndAdvance({
      ...state,
      pendingColorChange: false
    });
  });
}

function finalisePlayAndAdvance(newState) {
  turnFinished = true;
  state = newState;
  updateDirectionArrows();
  render_current_card();
  renderAllHands();
  disableCurrentPlayerHand();
  showTurnSummary(state.currentCard);

  setTimeout(() => {
    state = advanceTurn(state);
    turnFinished = false;

    if (state.turn === aiPlayerIndex) {
      setTimeout(aiPlayTurn, 600);
    } else {
      showTurnPopup();
    }
  }, 1500);
}


function disableCurrentPlayerHand() {
  const handEl = el(`hand-${rotateIndex(state.turn)}`);
  if (handEl) {
    handEl.querySelectorAll(".card").forEach(div => {
      div.className = "card card-back";
      div.textContent = "";
    });
  }
}

function chooseColorViaPopup() {
  return new Promise((resolve) => {
    colorSelectModal.showModal();
    colorButtons.forEach(btn => {
      btn.onclick = () => {
        const color = btn.dataset.color;
        colorSelectModal.close();
        resolve(color);
      };
    });
  });
}

function render_current_card() {
  styleCardDiv(currentCardDiv, state.currentCard);
}

function styleCardDiv(div, card) {
  const { bgColor, label } = UNOLogic.getCardStyle(card);
  div.className = `card ${bgColor}`;
  div.textContent = label;
}

function showTurnPopup() {
  turnPopupText.textContent = `Player ${state.turn + 1}'s Turn`;
  turnPopup.showModal();
}

function updateDirectionArrows() {
  const arrowsDiv = document.getElementById("directionArrows");
  if (!arrowsDiv) return;

  // Set the data-direction attribute based on state.direction
  arrowsDiv.setAttribute("data-direction", state.direction);
}


function showTurnSummary(card) {
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
}

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

  updateDirectionArrows(); 
  turnFinished = true;
  render_current_card();
  renderAllHands();
  showTurnSummary(state.currentCard);

  setTimeout(() => {
    state = advanceTurn(state);
    turnFinished = false;
    showTurnPopup();
    if (state.turn === aiPlayerIndex) {
      setTimeout(aiPlayTurn, 600);
    }
  }, 1500);
}

el("unoButton").onclick = () => {
  const currentHand = state.hands[state.turn];
  if (UNOLogic.declareUno(state.turn, state.hands, state.protectedPlayers)) {
    alert("You're protected! UNO declared.");
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

export default Object.freeze({});
