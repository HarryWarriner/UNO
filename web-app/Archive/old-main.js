
import R from "../ramda.js";

/**
 * uno.js is a module to model and play "UNO".
 *
 * @namespace UNO
 * @author Harry Warriner
 * @version 2025
 */

const UNO = Object.create(null);

/**
 * A card in UNO, defined by a color and a number.
 * @memberof UNO
 * @typedef {Object} Card
 * @property {string} color The color of the card (e.g., "Red", "Green").
 * @property {number} number The number on the card (1–9).
 */

/**
 * A player's hand, which is a list of cards.
 * @memberof UNO
 * @typedef {UNO.Card[]} Hand
 */

/** @type {string[]} */
const UNO_COLORS = ["Red", "Green", "Blue", "Yellow"];

let currentCard = getRandomCard();
let numPlayers = 2;
let hands =[];
let turn = 0;

// HTML Elements

const startGame_button = document.getElementById('startGame');
const numPlayersInput = document.getElementById('numPlayersInput');
const currentTurnDiv = document.getElementById('currentTurn');
const currentCardDiv = document.getElementById('currentCard');
const handsContainer = document.getElementById('handsContainer');

// --- Game Logic ---

/**
 * Starts a new UNO game with the current number of players.
 * @memberof UNO
 * @function
 */


UNO.start_game = function () {
    numPlayers = parseInt(numPlayersInput.value) || 2;
    currentCard = getRandomCard();
    hands = Array.from({ length: numPlayers }, () => []);
    turn = 0;
    UNO.render_current_card();
    UNO.renderAllHands();
    UNO.start_turn();
};

/**
 * Begins a player's turn by updating the display.
 * @memberof UNO
 * @function
 */

UNO.start_turn = function(){
    currentTurnDiv.textContent = `Player ${turn + 1}'s turn`;
};

/**
 * Moves to the next player's turn.
 * @memberof UNO
 * @function
 */
UNO.next_turn = function(){
    turn = (turn + 1) % numPlayers;
    UNO.start_turn();
};

/**
 * Draws a random card for the specified player.
 * @memberof UNO
 * @function
 * @param {number} playerIndex The index of the player.
 */

UNO.draw_card = function (playerIndex){
    const card = getRandomCard();
    hands[playerIndex].push(card);
    UNO.render_hand(playerIndex);
};

/**
 * Renders all player hands and their associated draw buttons.
 * @memberof UNO
 * @function
 */

UNO.renderAllHands = function () {
    handsContainer.innerHTML= '';

    hands.forEach((_, index) => {
        const handSection = document.createElement('div');
        handSection.classList.add('hand-section');

        const title = document.createElement('h2');
        title.textContent = `Player ${index + 1}'s cards:`;

        const button = document.createElement('button');
        button.className = 'buttoncss';
        button.textContent = 'Draw';
        button.onclick = () => {
            if (turn === index) UNO.draw_card(index);
        };
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'hand-header';
        headerDiv.appendChild(title);
        headerDiv.appendChild(button);

        handSection.appendChild(headerDiv);

        const handDiv = document.createElement('div');
        handDiv.id = `hand-${index}`;
        handSection.appendChild(handDiv);

        const hr = document.createElement('hr');
        handSection.appendChild(hr);

        handsContainer.appendChild(handSection);

        UNO.render_hand(index);

    });
};

/**
 * Renders a single player's hand.
 * @memberof UNO
 * @function
 * @param {number} index Player index
 */

UNO.render_hand = function(index){
    const handDiv = document.getElementById(`hand-${index}`);
    handDiv.innerHTML = '';

    hands[index].forEach((card, cardIndex) => {
        const div = document.createElement('div');
        div.className = 'card';
        styleCardDiv(div, card);

        div.onclick = () => {
            if ((card.color === currentCard.color || card.number === currentCard.number) && turn === index) {
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
 * Renders the current card on the display.
 * @memberof UNO
 * @function
 */

UNO.render_current_card = function(){
    styleCardDiv(currentCardDiv, currentCard);
};


// --- Utility Functions ---

/**
 * Gets a random UNO card.
 * @returns {UNO.Card}
 */
function getRandomCard(){
    const color = UNO_COLORS[Math.floor(Math.random() * UNO_COLORS.length)];
    const number = Math.floor(Math.random() * 9) +1;
    return {color, number};
}

/**
 * Applies visual styling to a card element.
 * @param {HTMLElement} div
 * @param {UNO.Card} card
 */
function styleCardDiv(div, card){
    div.style.backgroundColor = card.color.toLowerCase();
    div.textContent = card.number;
}

// --- Hook up UI ---

startGame_button.onclick = UNO.start_game;

export default Object.freeze(UNO);









