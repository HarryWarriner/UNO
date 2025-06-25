// Full uno.js including all logic and layout compatibility
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
const currentCardDiv = document.getElementById("currentCard");

const setupModal = document.getElementById("setupModal");
const turnPopup = document.getElementById("turnPopup");
const colorSelectModal = document.getElementById("colorSelectModal");
const colorButtons = colorSelectModal.querySelectorAll(".color-option");

const startGame_button = document.getElementById("startGame");
const numPlayersInput = document.getElementById("numPlayersInput");
const vsAI_checkbox = document.getElementById("vsAI");
const showAIHand_checkbox = document.getElementById("showAIHand");

const turnPopupText = document.getElementById("turnPopupText");
const beginTurnButton = document.getElementById("beginTurnButton");


document.addEventListener("DOMContentLoaded", () => {
  setupModal.showModal();

  startGame_button.onclick = () => {
    numPlayers = parseInt(numPlayersInput.value) || 2;
    aiPlayerIndex = vsAI_checkbox.checked ? 1 : null;
    state = createInitialState();
    turnFinished = false;
    setupModal.close();
    showTurnPopup();
  };
});

// Turn popup
beginTurnButton.onclick = () => {
  turnPopup.close();
  render_current_card();
  renderAllHands();
};

function showTurnPopup() {
  turnPopupText.textContent = `Player ${state.turn + 1}'s Turn`;
  turnPopup.showModal();
}

// Create Draw Card button
const drawButton = document.createElement("button");
drawButton.id = "drawButton";
drawButton.textContent = "Draw Card";
drawButton.className = "buttoncss draw-button";

drawButton.onclick = () => {
  if (!turnFinished) {
    const currentPlayer = state.turn;
    state.hands[currentPlayer] = UNOLogic.drawCard(state.hands[currentPlayer]);
    renderAllHands();
  }
};
document.body.appendChild(drawButton);


// Game state setup
let aiPlayerIndex = null;
let numPlayers = 2;
let state = createInitialState();
let turnFinished = false;

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
    lastSkipped: null,
  };
}

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

function rotateIndex(i) {
  return (i - state.turn + state.hands.length) % state.hands.length;
}

function renderAllHands() {
  for (let i = 0; i < state.hands.length; i++) {
    const rotated = rotateIndex(i);
    const handEl = document.getElementById(`hand-${rotated}`);
    const playerEl = document.getElementById(`player-${rotated}`);
    playerEl.className = "player"; // Reset

    // Assign position classes based on visual order
    if (rotated === 0) playerEl.classList.add("player-bottom");
    if (rotated === 1) playerEl.classList.add("player-left");
    if (rotated === 2) playerEl.classList.add("player-top");
    if (rotated === 3) playerEl.classList.add("player-right");

    if (!handEl || !playerEl) continue;

    handEl.innerHTML = "";
    const hand = state.hands[i];
    const isCurrent = i === state.turn;
    const isAI = i === aiPlayerIndex;

    playerEl.querySelector(".label").textContent = `Player ${i + 1}${isAI ? " (AI)" : ""}`;

    const shouldHide = (isAI && !showAIHand_checkbox.checked) || (!isAI && !isCurrent);

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
  }
}


function handleCardPlay(playerIndex, cardIndex) {
  const card = state.hands[playerIndex][cardIndex];
  if (!UNOLogic.isValidPlay(card, state.currentCard)) return;

  state.hands[playerIndex] = state.hands[playerIndex].filter((_, i) => i !== cardIndex);
  state.currentCard = { ...card };

  if (card.type === "+2") {
    const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);
    state.hands[next] = UNOLogic.drawCard(UNOLogic.drawCard(state.hands[next]));
  }

  if (card.type === "+4") {
    const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);
    for (let i = 0; i < 4; i++) {
      state.hands[next] = UNOLogic.drawCard(state.hands[next]);
    }
    chooseColorViaPopup().then((selectedColor) => {
      state.currentCard.color = selectedColor;
      finalizePlayAndAdvance(card);
    });
    return;
  }

  if (card.type === "Reverse") {
    state.direction *= -1;
  }

  if (card.type === "Skip") {
    const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);
    state.skipNext = true;
    state.lastSkipped = next;
  }

  finalizePlayAndAdvance(card);
}

function finalizePlayAndAdvance(card) {
  turnFinished = true;
  render_current_card();
  renderAllHands();

  const handEl = document.getElementById(`hand-${rotateIndex(state.turn)}`);
  if (handEl) {
    handEl.querySelectorAll(".card").forEach(div => {
      div.className = "card card-back";
      div.textContent = "";
    });
  }

  showTurnSummary(card);

  setTimeout(() => {
    state = advanceTurn(state);
    turnFinished = false;

    if (state.turn !== aiPlayerIndex) showTurnPopup();
    if (state.turn === aiPlayerIndex) setTimeout(aiPlayTurn, 600);
  }, 1500);
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

function showTurnSummary(card) {
  const summary = document.createElement("div");
  summary.textContent = UNOLogic.generateTurnSummary(
    state.turn,
    numPlayers,
    state.direction,
    card,
    state.currentCard.color
  );
  summary.style.position = "fixed";
  summary.style.top = "50%";
  summary.style.left = "50%";
  summary.style.transform = "translate(-50%, -50%)";
  summary.style.background = "white";
  summary.style.color = "black";
  summary.style.padding = "10px";
  summary.style.border = "2px solid black";
  summary.style.zIndex = 1000;
  summary.style.borderRadius = "8px";

  document.body.appendChild(summary);
  setTimeout(() => summary.remove(), 1300);
}

function render_current_card() {
  styleCardDiv(currentCardDiv, state.currentCard);
}

function styleCardDiv(div, card) {
  const { bgColor, label } = UNOLogic.getCardStyle(card);
  div.className = `card ${bgColor}`;
  div.textContent = label;
}



function aiPlayTurn() {
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

unoButton.onclick = () => {
  const currentHand = state.hands[state.turn];

  if (UNOLogic.declareUno(state.turn, state.hands, state.protectedPlayers)) {
    alert("You're protected! UNO declared.");
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
  }

  renderAllHands();
};

export default Object.freeze(UNO);
