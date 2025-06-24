import * as UNOLogic from './uno-logic.js';

/**
 * @namespace UNO
 */
const UNO = Object.create(null);

let currentCard = UNOLogic.getRandomCard();
let numPlayers = 2;
let hands = [];
let turn = 0;

// HTML Elements
const startGame_button = document.getElementById("startGame");
const numPlayersInput = document.getElementById("numPlayersInput");
const currentTurnDiv = document.getElementById("currentTurn");
const currentCardDiv = document.getElementById("currentCard");
const handsContainer = document.getElementById("handsContainer");

/**
 * Start the UNO game.
 */
UNO.start_game = () => {
  numPlayers = parseInt(numPlayersInput.value) || 2;
  hands = UNOLogic.createHands(numPlayers);
  currentCard = UNOLogic.getRandomCard();
  turn = 0;
  UNO.render_current_card();
  UNO.renderAllHands();
  UNO.start_turn();
};

/**
 * Start current player's turn.
 */
UNO.start_turn = () => {
  currentTurnDiv.textContent = `Player ${turn + 1}'s turn`;
};

/**
 * Move to next player's turn.
 */
UNO.next_turn = () => {
  turn = UNOLogic.nextTurn(turn, numPlayers);
  UNO.start_turn();
};

/**
 * Draw a card for a player.
 * @param {number} playerIndex
 */
UNO.draw_card = (playerIndex) => {
  hands[playerIndex].push(UNOLogic.getRandomCard());
  UNO.render_hand(playerIndex);
};

/**
 * Render all player hands and draw buttons.
 */
UNO.renderAllHands = () => {
  handsContainer.innerHTML = "";

  hands.forEach((_, index) => {
    const handSection = document.createElement("div");
    handSection.classList.add("hand-section");

    const title = document.createElement("h2");
    title.textContent = `Player ${index + 1}'s cards:`;

    const button = document.createElement("button");
    button.className = "buttoncss";
    button.textContent = "Draw";
    button.onclick = () => {
      if (turn === index) UNO.draw_card(index);
    };

    const headerDiv = document.createElement("div");
    headerDiv.className = "hand-header";
    headerDiv.appendChild(title);
    headerDiv.appendChild(button);

    const handDiv = document.createElement("div");
    handDiv.id = `hand-${index}`;

    const hr = document.createElement("hr");

    handSection.appendChild(headerDiv);
    handSection.appendChild(handDiv);
    handSection.appendChild(hr);
    handsContainer.appendChild(handSection);

    UNO.render_hand(index);
  });
};

/**
 * Render one player's hand.
 * @param {number} index
 */
UNO.render_hand = (index) => {
  const handDiv = document.getElementById(`hand-${index}`);
  handDiv.innerHTML = "";

  hands[index].forEach((card, cardIndex) => {
    const div = document.createElement("div");
    div.className = "card";
    styleCardDiv(div, card);

    div.onclick = () => {
      if (turn === index && UNOLogic.isValidPlay(card, currentCard)) {
        hands[index].splice(cardIndex, 1);
        currentCard = card;
        UNO.render_current_card();
        UNO.render_hand(index);
        UNO.next_turn();
      }
    };

    handDiv.appendChild(div);
  });
};

/**
 * Render the current top card.
 */
UNO.render_current_card = () => {
  styleCardDiv(currentCardDiv, currentCard);
};

/**
 * Apply style to a card div.
 * @param {HTMLElement} div
 * @param {Object} card
 */
function styleCardDiv(div, card) {
  div.style.backgroundColor = card.color.toLowerCase();
  div.textContent = card.number;
}

// Start game on button click
startGame_button.onclick = UNO.start_game;

export default Object.freeze(UNO);
