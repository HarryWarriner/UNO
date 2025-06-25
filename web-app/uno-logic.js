import * as R from "./ramda.js";

/**
 * @typedef {Object} Card
 * @property {string} color
 * @property {number} number
 * @property {string} [type] Optional special type: "+2", "+4", "Reverse", "Skip"
 */

/**
 * An array of valid UNO card colors.
 * @type {string[]}
 */
export const COLORS = ["Red", "Green", "Blue", "Yellow"];

/**
 * Generate a random UNO card.
 * May include special types.
 * @returns {Card}
 */
export const getRandomCard = () => {
  const color = R.nth(Math.floor(Math.random() * COLORS.length), COLORS);
  const random = Math.random();

  if (random < 0.10) return { type: "+2", color, number: 2 };
  if (random < 0.15) return { type: "+4", number: 4 };
  if (random < 0.20) return { type: "Reverse", color };
  if (random < 0.25) return { type: "Skip", color };

  return {
    color,
    number: Math.floor(Math.random() * 9) + 1
  };
};

/**
 * Create a 2D array representing all players' hands.
 * @param {number} numPlayers
 * @returns {Card[][]}
 */
export const createHands = (numPlayers) => R.times(() => [], numPlayers);

/**
 * Deal 7 random cards to each player.
 * @param {number} numPlayers
 * @returns {Card[][]}
 */
export const dealHands = (numPlayers) =>
  R.times(() => R.times(getRandomCard, 7), numPlayers);

/**
 * Add a card to a given hand (in-place).
 * @param {Card[]} hand
 */
export const drawCard = (hand) => {
  hand.push(getRandomCard());
};

/**
 * Determine if a card can be legally played on the current card.
 * @param {Card} card
 * @param {Card} currentCard
 * @returns {boolean}
 */
export const isValidPlay = (card, currentCard) => {
  if (card.type === "+4") return true;
  return (
    card.color === currentCard.color ||
    card.number === currentCard.number ||
    (card.type && card.type === currentCard.type)
  );
};

/**
 * Get the index of the next player.
 * @param {number} currentTurn
 * @param {number} numPlayers
 * @param {number} [direction=1]
 * @returns {number}
 */
export const nextTurn = (currentTurn, numPlayers, direction = 1) =>
  (currentTurn + direction + numPlayers) % numPlayers;

/**
 * Protects a player if they correctly declare UNO.
 * @param {number} playerIndex
 * @param {Card[][]} hands
 * @param {Set<number>} protectedPlayers
 * @returns {boolean} true if declaration was valid
 */
export const declareUno = (playerIndex, hands, protectedPlayers) => {
  if (hands[playerIndex].length === 1) {
    protectedPlayers.add(playerIndex);
    return true;
  }
  return false;
};

/**
 * Attempt to call UNO on another player.
 * @param {number} callerIndex
 * @param {Card[][]} hands
 * @param {Set<number>} protectedPlayers
 * @returns {{ caught: boolean, punishedPlayers: number[], falseCall: boolean }}
 */
export const callUno = (callerIndex, hands, protectedPlayers) => {
  const punishedPlayers = hands.reduce((acc, hand, index) => {
    if (
      index !== callerIndex &&
      hand.length === 1 &&
      !protectedPlayers.has(index)
    ) {
      drawCard(hand);
      drawCard(hand);
      acc.push(index);
    }
    return acc;
  }, []);

  return {
    caught: punishedPlayers.length > 0,
    punishedPlayers,
    falseCall: punishedPlayers.length === 0
  };
};

/**
 * Generate a human-readable summary of a player's action.
 * @param {number} turn
 * @param {number} numPlayers
 * @param {number} direction
 * @param {Card} card
 * @param {string} currentColor
 * @returns {string}
 */
export const generateTurnSummary = (turn, numPlayers, direction, card, currentColor) => {
  const next = nextTurn(turn, numPlayers, direction);
  const base = `Player ${turn + 1} played ${card.type || card.number}`;
  switch (card.type) {
    case "+2":
      return `${base} - Player ${next + 1} drew 2 cards`;
    case "+4":
      return `${base} - Player ${next + 1} drew 4 cards, new color: ${currentColor}`;
    case "Reverse":
      return `${base} - Direction reversed`;
    case "Skip":
      const skipped = next;
      const afterSkip = nextTurn(skipped, numPlayers, direction);
      return `${base} - Player ${skipped + 1} was skipped - Player ${afterSkip + 1}'s Turn`;
    default:
      return base;
  }
};

/**
 * Return visual style metadata for a card (e.g. for rendering).
 * @param {Card} card
 * @returns {{ bgColor: string, label: string }}
 */
export const getCardStyle = (card) => {
  const baseColor = (card.color || "black").toLowerCase();
  const labelMap = {
    "+4": "+4",
    "+2": "+2",
    "Reverse": "🔄",
    "Skip": "⏩"
  };

  return {
    bgColor: baseColor,
    label: labelMap[card.type] || String(card.number)
  };
};
