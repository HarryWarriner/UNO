import * as R from "./ramda.js";

/**
 * @typedef {{ color: string, number: number, type?: string }} Card
 */

export const COLORS = ["Red", "Green", "Blue", "Yellow"];

export const getRandomCard = () => {
  const color = R.nth(Math.floor(Math.random() * COLORS.length), COLORS);
  const random = Math.random();

  if (random < 0.1) {
    return { type: "+2", color, number: 2 };
  }

  if (random < 0.15) {
    return { type: "+4", number: 4 }; // Wild,
  }

  if (random < 0.20){
    return {type: "Reverse", color};
  }
  if (random < 0.25) {
    return { type: "Skip", color };
  }

  return {
    color,
    number: Math.floor(Math.random() * 9) + 1
  };
};


/**
 * Create empty hands for each player.
 */
export const createHands = (numPlayers) =>
  R.times(() => [], numPlayers);

/**
 * Deal 7 cards to each player.
 * @param {number} numPlayers
 * @returns {Card[][]}
 */
export const dealHands = (numPlayers) =>
  R.times(() => R.times(getRandomCard, 7), numPlayers);

/**
 * Draw a card into a hand.
 * @param {Card[]} hand
 */
export const drawCard = (hand) => {
  hand.push(getRandomCard());
};

/**
 * Check if a card can be played.
 * @param {Card} card
 * @param {Card} currentCard
 * @returns {boolean}
 */
export const isValidPlay = (card, currentCard) => {
  if (card.type === "+4") return true; // +4 is always playable
  return (
    card.color === currentCard.color ||
    (card.number !== undefined && card.number === currentCard.number) ||
    (card.type && card.type === currentCard.type)
  );
};
/**
 * Advance to next player.
 * @param {number} currentTurn
 * @param {number} numPlayers
 */
export const nextTurn = (currentTurn, numPlayers, direction = 1) =>
  (currentTurn + direction + numPlayers) % numPlayers; 

/**
 * Handle UNO declaration.
 * @param {number} playerIndex
 * @param {Card[][]} hands
 * @param {Set<number>} protectedPlayers
 * @returns {boolean} true if protected
 */
export const declareUno = (playerIndex, hands, protectedPlayers) => {
  const hand = hands[playerIndex];
  if (hand.length === 1) {
    protectedPlayers.add(playerIndex);
    return true;
  }
  return false;
};

/**
 * Handle calling UNO on others.
 * @param {number} callerIndex
 * @param {Card[][]} hands
 * @param {Set<number>} protectedPlayers
 * @returns {{caught: boolean, punishedPlayers: number[], falseCall: boolean}}
 */
export const callUno = (callerIndex, hands, protectedPlayers) => {
  let caught = false;
  let punishedPlayers = [];

  hands.forEach((hand, index) => {
    if (index !== callerIndex && hand.length === 1 && !protectedPlayers.has(index)) {
      drawCard(hand);
      drawCard(hand);
      caught = true;
      punishedPlayers.push(index);
    }
  });

  return {
    caught,
    punishedPlayers,
    falseCall: !caught,
  };
};
