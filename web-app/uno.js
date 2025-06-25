import * as UNOLogic from "./uno-logic.js";

/**
 * @namespace UNO
 */
const UNO = Object.create(null);

let currentCard = UNOLogic.getRandomCard();
let numPlayers = 2;
let hands = [];
let turn = 0;
let turnFinished = false;
let handVisible = true;
let protectedPlayers = new Set();

// HTML Elements
const startGame_button = document.getElementById("startGame");
const unoButton = document.getElementById("unoButton");
const nextPlayer_button = document.getElementById("nextPlayer");
const numPlayersInput = document.getElementById("numPlayersInput");
const currentCardDiv = document.getElementById("currentCard");
const handsContainer = document.getElementById("handsContainer");
const playerStatsList = document.getElementById("playerStats");

/**
 * Start the UNO game.
 */
UNO.start_game = () => {
  numPlayers = parseInt(numPlayersInput.value) || 2;
  hands = UNOLogic.dealHands(numPlayers);

  currentCard = UNOLogic.getRandomCard();
  turn = 0;
  turnFinished = false;
  protectedPlayers.clear();

  UNO.render_current_card();
  UNO.renderAllHands();
  UNO.renderPlayerStats();
  UNO.start_turn();
};

/**
 * Start current player's turn.
 */
UNO.start_turn = () => {
  nextPlayer_button.textContent = "Next Player";
  handVisible = true;
  protectedPlayers.delete(turn);
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
  if (turnFinished) return;
  UNOLogic.drawCard(hands[playerIndex]);
  UNO.render_hand(playerIndex);
  UNO.renderPlayerStats();
};

/**
 * Render all player hands and draw buttons.
 */
UNO.renderAllHands = () => {
  handsContainer.innerHTML = "";

  const index = turn;

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

  const hr = document.createElement("hr");

  const headerDiv = document.createElement("div");
  headerDiv.className = "hand-header";
  headerDiv.appendChild(title);
  headerDiv.appendChild(button);

  handSection.appendChild(headerDiv);
  handSection.appendChild(handDiv);
  handSection.appendChild(hr);
  handsContainer.appendChild(handSection);

  UNO.render_hand(index);
};

/**
 * UNO button logic
 */
unoButton.onclick = () => {
  if (!handVisible) return;

  const currentHand = hands[turn];

  // Try to declare UNO for current player
  if (UNOLogic.declareUno(turn, hands, protectedPlayers)) {
    alert("You're protected! UNO declared.");
    UNO.renderPlayerStats();
    return;
  }

  // Try to catch others
  const result = UNOLogic.callUno(turn, hands, protectedPlayers);

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

  UNO.render_hand(turn);
  UNO.renderPlayerStats();
};

/**
 * Next player button logic
 */
nextPlayer_button.onclick = () => {
  if (handVisible) {
    if (!turnFinished) {
      alert("You must play a card before ending your turn.");
      return;
    }

    handsContainer.innerHTML = ""; // Hide cards
    handVisible = false;
    nextPlayer_button.textContent = "Show Hand";
    UNO.renderPlayerStats();
  } else {
    turnFinished = false;
    UNO.next_turn();
    UNO.renderAllHands();
    UNO.renderPlayerStats();
    handVisible = true;
    nextPlayer_button.textContent = "Next Player";
  }
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
      if (turn !== index || turnFinished) return;

      if (UNOLogic.isValidPlay(card, currentCard)) {
        hands[index].splice(cardIndex, 1);
        currentCard = card;
        turnFinished = true;
        UNO.render_current_card();
        UNO.render_hand(index);
        UNO.renderPlayerStats();
      }
    };

    handDiv.appendChild(div);
  });
};

/**
 * Render the player stats list.
 */
UNO.renderPlayerStats = () => {
  playerStatsList.innerHTML = "";

  hands.forEach((hand, index) => {
    const li = document.createElement("li");

    let text = `Player ${index + 1}: ${hand.length} card${hand.length !== 1 ? "s" : ""}`;

    if (hand.length === 1 && protectedPlayers.has(index)) {
      text += " (UNO!)";
    }

    li.textContent = text;

    if (index === turn) {
      li.style.fontWeight = "bold";
    }

    playerStatsList.appendChild(li);
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
