import * as UNOLogic from "./uno-logic.js";

/**
 * @namespace UNO
 */
const UNO = Object.create(null);

/**
 * @typedef {Object} Card
 * @property {string} color
 * @property {number} number
 * @property {string} [type]
 */

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

unoButton.disabled = true;

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
  } while (card.type); // Ensure first card is not a special card

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

UNO.start_game = () => {
  numPlayers = parseInt(numPlayersInput.value) || 2;
  state = createInitialState();
  turnFinished = false;

  UNO.render_current_card();
  UNO.renderAllHands();
  UNO.renderPlayerStats();
  UNO.updateDirectionArrow();
  unoButton.disabled = false;
};

UNO.start_turn = () => {
  handVisible = true;
  turnFinished = false;
};

UNO.next_turn = () => {
  state = advanceTurn(state);
  UNO.start_turn();
  UNO.renderAllHands();
  UNO.renderPlayerStats();
};

UNO.draw_card = (playerIndex) => {
  if (turnFinished) return;
  UNOLogic.drawCard(state.hands[playerIndex]);
  UNO.render_hand(playerIndex);
  UNO.renderPlayerStats();
};

UNO.renderAllHands = () => {
  handsContainer.innerHTML = "";
  const index = state.turn;

  const handSection = document.createElement("div");
  handSection.classList.add("hand-section");

  const title = document.createElement("h2");
  title.textContent = `Player ${index + 1}'s cards:`;

  const button = document.createElement("button");
  button.className = "buttoncss";
  button.textContent = "Draw";
  button.onclick = () => UNO.draw_card(index);

  const handDiv = document.createElement("div");
  handDiv.id = `hand-${index}`;

  const headerDiv = document.createElement("div");
  headerDiv.className = "hand-header";
  headerDiv.appendChild(title);
  headerDiv.appendChild(button);

  handSection.appendChild(headerDiv);
  handSection.appendChild(handDiv);
  handsContainer.appendChild(handSection);

  UNO.render_hand(index);
};

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
    result.punishedPlayers.forEach(index => {
      alert(`Player ${index + 1} forgot to say UNO and picked up 2 penalty cards!`);
    });
  } else {
    alert("False UNO! You get 2 penalty cards.");
    UNOLogic.drawCard(currentHand);
    UNOLogic.drawCard(currentHand);
    turnFinished = true;
  }

  UNO.render_hand(state.turn);
  UNO.renderPlayerStats();
};

UNO.render_hand = (index) => {
  const handDiv = document.getElementById(`hand-${index}`);
  handDiv.innerHTML = "";

  state.hands[index].forEach((card, cardIndex) => {
    const div = document.createElement("div");
    div.className = "card";
    styleCardDiv(div, card);

    div.onclick = () => {
      if (state.turn !== index || turnFinished) return;

      if (UNOLogic.isValidPlay(card, state.currentCard)) {
        state.hands[index].splice(cardIndex, 1);
        state.currentCard = card;

        if (card.type === "+2") {
          const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);
          UNOLogic.drawCard(state.hands[next]);
          UNOLogic.drawCard(state.hands[next]);
        }

        if (card.type === "+4") {
          const next = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);
          R.times(() => UNOLogic.drawCard(state.hands[next]), 4);

          const newColor = prompt("Choose a color: Red, Green, Blue, Yellow");
          state.currentCard.color = UNOLogic.COLORS.includes(newColor) ? newColor : "Red";
        }

        if (card.type === "Reverse") {
          state.direction *= -1;
        }

        if (card.type === "Skip") {
          state.skipNext = true;
          state.lastSkipped = UNOLogic.nextTurn(state.turn, numPlayers, state.direction);
        }

        UNO.render_current_card();
        UNO.updateDirectionArrow();
        UNO.renderPlayerStats();

        // Mid-turn pause UI
        handsContainer.innerHTML = "";

        const midPageContainer = document.createElement("div");
        midPageContainer.className = "mid-page-container";

        const message = document.createElement("div");
        message.className = "turn-summary";
        message.textContent = UNOLogic.generateTurnSummary(
          state.turn, numPlayers, state.direction, card, state.currentCard.color
        );

        const continueButton = document.createElement("button");
        continueButton.textContent = "Continue to Next Player";
        continueButton.className = "buttoncss";
        continueButton.onclick = () => UNO.next_turn();

        midPageContainer.appendChild(message);
        midPageContainer.appendChild(continueButton);
        handsContainer.appendChild(midPageContainer);

        turnFinished = true;
      }
    };

    handDiv.appendChild(div);
  });
};

UNO.updateDirectionArrow = () => {
  directionIndicator.textContent = state.direction === 1 ? "⬇️" : "⬆️";
};

UNO.renderPlayerStats = () => {
  playerStatsList.innerHTML = "";

  state.hands.forEach((hand, index) => {
    const li = document.createElement("li");
    let text = `Player ${index + 1}: ${hand.length} card${hand.length !== 1 ? "s" : ""}`;

    if (hand.length === 1 && state.protectedPlayers.has(index)) {
      text += " (UNO!)";
    }
    if (state.lastSkipped === index && state.turn !== index) {
      text += " (SKIPPED)";
    }
    if (index === state.turn) {
      li.style.fontWeight = "bold";
    }

    li.textContent = text;
    playerStatsList.appendChild(li);
  });
};

UNO.render_current_card = () => {
  styleCardDiv(currentCardDiv, state.currentCard);
};

/**
 * Apply style to a card div.
 * @param {HTMLElement} div
 * @param {Card} card
 */
function styleCardDiv(div, card) {
  const { bgColor, label } = UNOLogic.getCardStyle(card);
  div.style.backgroundColor = bgColor;
  div.textContent = label;
}

startGame_button.onclick = UNO.start_game;

export default Object.freeze(UNO);
