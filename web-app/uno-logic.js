/**
 * @namespace UNOLogic
 * @description Core logic for a functional UNO game implementation.
 */

import * as R from "./ramda.js";

/**
 * @typedef {Object} Card
 * @property {string} [color] - "Red", "Green", "Blue", or "Yellow"
 * @property {number} [number] - A number from 1 to 9
 * @property {string} [type] - Special card type: "+2", "+4", "Reverse", or "Skip"
 */

/** @constant {string[]} */
export const COLORS = Object.freeze(["Red", "Green", "Blue", "Yellow"]);

/**
 * Generate a random UNO card.
 * @returns {Card}
 */
export const getRandomCard = () => {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const random = Math.random();

  if (random < 0.10) return { type: "+2", color, number: 2 };
  if (random < 0.15) return { type: "+4", number: 4 };
  if (random < 0.20) return { type: "Reverse", color };
  if (random < 0.25) return { type: "Skip", color };
  return { color, number: Math.floor(Math.random() * 9) + 1 };
};

/**
 * Create a list of empty hands.
 * @param {number} numPlayers
 * @returns {Card[][]}
 */
export const createHands = (numPlayers) =>
  R.times(() => [], numPlayers);

/**
 * Deal 7 random cards to each player.
 * @param {number} numPlayers
 * @returns {Card[][]}
 */
export const dealHands = (numPlayers) =>
  R.times(() => R.times(getRandomCard, 2), numPlayers);

/**
 * Add a card to the player's hand.
 * @param {Card[]} hand
 * @returns {Card[]}
 */
export const drawCard = (hand) => [...hand, getRandomCard()];

/**
 * Check if a card is valid to play on the current card.
 * @param {Card} card
 * @param {Card} currentCard
 * @returns {boolean}
 */
export const isValidPlay = (card, currentCard) =>
  card.type === "+4" ||
  card.color === currentCard.color ||
  card.number === currentCard.number ||
  (card.type && card.type === currentCard.type);

/**
 * Determine the index of the next player.
 * @param {number} currentTurn
 * @param {number} numPlayers
 * @param {number} [direction=1]
 * @returns {number}
 */
export const nextTurn = (currentTurn, numPlayers, direction = 1) =>
  (currentTurn + direction + numPlayers) % numPlayers;

/**
 * Protect a player from penalty by declaring UNO.
 * @param {number} playerIndex
 * @param {Card[][]} hands
 * @param {Set<number>} protectedPlayers
 * @returns {boolean}
 */
export const declareUno = (playerIndex, hands, protectedPlayers) => {
  if (hands[playerIndex].length === 1) {
    protectedPlayers.add(playerIndex);
    return true;
  }
  return false;
};

/**
 * Attempt to call UNO on players.
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
 * Generate a human-readable string summarising the turn.
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
    case "Skip": {
      const afterSkip = nextTurn(next, numPlayers, direction);
      return `${base} - Player ${next + 1} was skipped - Player ${afterSkip + 1}'s Turn`;
    }
    default:
      return base;
  }
};

/**
 * Return display styling for a card.
 * @param {Card} card
 * @returns {{ bgColor: string, label: string }}
 */
export const getCardStyle = (card) => {
  const baseColor = (card.color || "wild").toLowerCase();
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

/**
 * Determine and apply the best AI move.
 * @param {number} aiIndex
 * @param {Card[][]} hands
 * @param {Card} currentCard
 * @param {number} direction
 * @param {number} numPlayers
 * @returns {{
 *   updatedHands: Card[][],
 *   newCard: Card,
 *   direction: number,
 *   skipNext: boolean
 * }}
 */
export const performAITurn = (aiIndex, hands, currentCard, direction, numPlayers) => {
  const hand = hands[aiIndex];
  let newDirection = direction;
  let skipNext = false;
  let playedCard = null;

  // Count most frequent color
  const colorCounts = COLORS.reduce((acc, color) => {
    acc[color] = hand.filter(c => c.color === color).length;
    return acc;
  }, {});
  const mostCommonColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Priority sort
  const priorities = { "+4": 0, "+2": 1, "Reverse": 2, "Skip": 3, "normal": 4 };
  const getPriority = (card) => {
    const typeScore = priorities[card.type] ?? priorities.normal;
    const colorBonus = card.color === mostCommonColor ? -0.5 : 0;
    return typeScore + colorBonus;
  };

  const validCards = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => isValidPlay(card, currentCard))
    .sort((a, b) => getPriority(a.card) - getPriority(b.card));

  let handsCopy = [...hands];
  let newHand = [...hand];

  if (validCards.length > 0) {
    const { card, index } = validCards[0];
    playedCard = { ...card };
    newHand = newHand.filter((_, i) => i !== index);

    const next = nextTurn(aiIndex, numPlayers, direction);

    if (card.type === "+4") {
      playedCard.color = mostCommonColor || COLORS[0];
      handsCopy[next] = drawCard(drawCard(drawCard(drawCard(handsCopy[next]))));
    } else if (card.type === "+2") {
      handsCopy[next] = drawCard(drawCard(handsCopy[next]));
    } else if (card.type === "Reverse") {
      newDirection *= -1;
    } else if (card.type === "Skip") {
      skipNext = true;
    }
  } else {
    newHand = drawCard(newHand);
  }

  handsCopy[aiIndex] = newHand;

  return {
    updatedHands: handsCopy,
    newCard: playedCard || currentCard,
    direction: newDirection,
    skipNext
  };
};
