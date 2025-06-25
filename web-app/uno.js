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
let direction = 1; // 1 : 1=>2+>3, -1: 1=>3+>2
let skipNextPlayer = false;
let lastSkippedPlayer = null;



// HTML Elements
const startGame_button = document.getElementById("startGame");
const unoButton = document.getElementById("unoButton");
const numPlayersInput = document.getElementById("numPlayersInput");
const currentCardDiv = document.getElementById("currentCard");
const handsContainer = document.getElementById("handsContainer");
const playerStatsList = document.getElementById("playerStats");
const directionIndicator = document.getElementById("directionIndicator");

unoButton.disabled = true;

/**
 * Start the UNO game.
 */
UNO.start_game = () => {
  
  numPlayers = parseInt(numPlayersInput.value) || 2;
  hands = UNOLogic.dealHands(numPlayers);

  // Draw until a number card (non-special) is found
  do {
    currentCard = UNOLogic.getRandomCard();
  } while (currentCard.type); // Repeat if it's a special card
  direction = 1;
  turn = 0;
  turnFinished = false;
  protectedPlayers.clear();

  UNO.render_current_card();
  UNO.renderAllHands();
  UNO.renderPlayerStats();
  UNO.updateDirectionArrow();
  UNO.start_turn();

  unoButton.disabled = false;
};

/**
 * Start current player's turn.
 */
UNO.start_turn = () => {
  // nextPlayer_button.textContent = "Next Player";
  handVisible = true;
  if (lastSkippedPlayer === turn) {
    lastSkippedPlayer = null;
  }
  protectedPlayers.delete(turn);
  turnFinished = false;
};

/**
 * Move to next player's turn.
 */
UNO.next_turn = () => {
  if (skipNextPlayer) {
    // Skip the next player
    turn = UNOLogic.nextTurn(turn, numPlayers, direction);
    skipNextPlayer = false;
  }

  turn = UNOLogic.nextTurn(turn, numPlayers, direction);
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


  const headerDiv = document.createElement("div");
  headerDiv.className = "hand-header";
  headerDiv.appendChild(title);
  headerDiv.appendChild(button);

  handSection.appendChild(headerDiv);
  handSection.appendChild(handDiv);
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
        UNO.render_current_card();
        UNO.render_hand(index);
        UNO.renderPlayerStats();
        UNO.updateDirectionArrow();

        if (card.type === "+2") {
          const next = UNOLogic.nextTurn(turn, numPlayers, direction);
          UNOLogic.drawCard(hands[next]);
          UNOLogic.drawCard(hands[next]);
          alert(`Player ${next + 1} draws 2 cards`);
          UNO.renderPlayerStats();
        }

        if (card.type === "+4") {
          const next = UNOLogic.nextTurn(turn, numPlayers, direction);
          UNOLogic.drawCard(hands[next]);
          UNOLogic.drawCard(hands[next]);
          UNOLogic.drawCard(hands[next]);
          UNOLogic.drawCard(hands[next]);
          alert(`Player ${next + 1} draws 4 cards`);

          // Prompt for new color
          const newColor = prompt("Choose a color: Red, Green, Blue, Yellow");
          if (UNOLogic.COLORS.includes(newColor)) {
            currentCard.color = newColor;
          } else {
            alert("Invalid color chosen. Defaulting to Red.");
            currentCard.color = "Red";
          }

          UNO.renderPlayerStats();
          UNO.updateDirectionArrow();
        }
        if (card.type === "Reverse") {
          direction *= -1; // Reverse the turn direction
          UNO.updateDirectionArrow();
        }
        if (card.type === "Skip") {
          skipNextPlayer = true;
          lastSkippedPlayer = UNOLogic.nextTurn(turn, numPlayers, direction);
        }
        
        //----- Once played:

        // Clear Play Area
        handsContainer.innerHTML = "";

        // Create a container for the message and button
        const midPageContainer = document.createElement("div");
        midPageContainer.className = "mid-page-container";

        // Create a message element
        const message = document.createElement("div");
        message.className = "turn-summary";

        const summary = UNOLogic.generateTurnSummary(turn, numPlayers, direction, card, currentCard.color);

        message.textContent = summary;

        // Create the Continue button
        const continueButton = document.createElement("button");
        continueButton.textContent = "Continue to Next Player";
        continueButton.className = "buttoncss";

        continueButton.onclick = () => {
          handsContainer.innerHTML = ""; // Clear everything
          handVisible = false;

          UNO.next_turn();
          UNO.renderAllHands();
          UNO.renderPlayerStats();
          handVisible = true;
        };

        // Add message and button to the container
        midPageContainer.appendChild(message);
        midPageContainer.appendChild(continueButton);
        handsContainer.appendChild(midPageContainer);

      }
    };


    handDiv.appendChild(div);
  });
};

/**
 * Render the arrow direction
 */
UNO.updateDirectionArrow = () => {
  directionIndicator.textContent = direction === 1 ? "⬇️" : "⬆️";
}


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
    if (lastSkippedPlayer === index && turn !== index) {
      text += " (SKIPPED)";
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
  const { bgColor, label } = UNOLogic.getCardStyle(card);
  div.style.backgroundColor = bgColor;
  div.textContent = label;
}


// Start game on button click
startGame_button.onclick = UNO.start_game;

export default Object.freeze(UNO);
