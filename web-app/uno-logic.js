/**
 * @module uno-logic
 * @namespace UNOLogic
 * @description Functional UNO game logic core.
 * @author Harry
 * @version 2025
 */

import * as R from "./ramda.js";

/**
 * @typedef {Object} Card
 * @property {string} color - "Red", "Green", "Blue", or "Yellow" (or undefined for Wild)
 * @property {string} value - "1"–"9", "+2", "+4", "Skip", "Reverse"
 */

/** @constant {string[]} */
export const COLORS = Object.freeze(["Red", "Green", "Blue", "Yellow"]);

/** @constant {string[]} */
const SPECIAL_VALUES = Object.freeze(["+2", "+4", "Skip", "Reverse"]);

/** @constant {string[]} */
const NUMBER_VALUES = R.map(String, R.range(1, 10));

/**
 * Create a random card.
 * @returns {Card}
 * @pure
 */
export const getRandomCard = () => {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const r = Math.random();

  if (r < 0.10) return { value: "+2", color };
  if (r < 0.15) return { value: "+4" };
  if (r < 0.20) return { value: "Reverse", color };
  if (r < 0.25) return { value: "Skip", color };
  return { value: String(Math.floor(Math.random() * 9) + 1), color };
};

/**
 * Generate a hand of n cards.
 * @param {number} n
 * @returns {Card[]}
 * @pure
 */
const generateHand = (n) => R.times(getRandomCard, n);

/**
 * Deal hands to players.
 * @param {number} numPlayers
 * @returns {Card[][]}
 * @pure
 */
export const dealHands = (numPlayers) => R.times(() => generateHand(7), numPlayers);

/**
 * Draw a card for a hand.
 * @param {Card[]} hand
 * @returns {Card[]}
 * @pure
 */
export const drawCard = (hand) => R.append(getRandomCard(), hand);

/**
 * Check if a card is playable.
 * @param {Card} card
 * @param {Card} currentCard
 * @returns {boolean}
 * @pure
 */
export const isValidPlay = (card, currentCard) =>
  card.value === "+4" ||
  card.color === currentCard.color ||
  card.value === currentCard.value;

/**
 * Get next player index.
 * @param {number} current
 * @param {number} total
 * @param {number} dir
 * @returns {number}
 * @pure
 */
export const nextTurn = (current, total, dir = 1) =>
  (current + dir + total) % total;

/**
 * Protect player when declaring UNO.
 * @param {number} index
 * @param {Card[][]} hands
 * @param {Set<number>} protectedSet
 * @returns {boolean}
 * @pure
 */
export const declareUno = (index, hands, protectedSet) => {
  if (hands[index].length === 1) {
    protectedSet.add(index);
    return true;
  }
  return false;
};

/**
 * Call out other players who failed to say UNO.
 * @param {number} caller
 * @param {Card[][]} hands
 * @param {Set<number>} protectedSet
 * @returns {{ caught: boolean, punishedPlayers: number[] }}
 * @pure
 */
export const callUno = (caller, hands, protectedSet) => {
  const punished = hands
    .map((hand, i) => ({ i, hand }))
    .filter(({ i, hand }) => i !== caller && hand.length === 1 && !protectedSet.has(i))
    .map(({ i }) => i);

  return {
    caught: punished.length > 0,
    punishedPlayers: punished
  };
};

/**
 * Return styling for a card.
 * @param {Card} card
 * @returns {{ bgColor: string, label: string }}
 * @pure
 */
export const getCardStyle = (card) => {
  const bgColor = (card.color || "wild").toLowerCase();
  const labelMap = {
    "+4": "+4",
    "+2": "+2",
    Skip: "⏩",
    Reverse: "🔄"
  };
  return {
    bgColor,
    label: labelMap[card.value] || card.value
  };
};

/**
 * Generate human-readable turn summary.
 * @param {number} turn
 * @param {number} num
 * @param {number} dir
 * @param {Card} card
 * @param {string} currentColor
 * @returns {string}
 * @pure
 */
export const generateTurnSummary = (turn, num, dir, card, currentColor) => {
  const next = nextTurn(turn, num, dir);
  const base = `Player ${turn + 1} played ${card.value}`;
  if (card.value === "+2") return `${base} - Player ${next + 1} drew 2 cards`;
  if (card.value === "+4") return `${base} - Player ${next + 1} drew 4 cards, new color: ${currentColor}`;
  if (card.value === "Reverse") return `${base} - Direction reversed`;
  if (card.value === "Skip") {
    const after = nextTurn(next, num, dir);
    return `${base} - Player ${next + 1} skipped - Player ${after + 1}'s Turn`;
  }
  return base;
};

/**
 * Perform AI turn.
 * @param {number} aiIndex
 * @param {Card[][]} hands
 * @param {Card} currentCard
 * @param {number} dir
 * @param {number} numPlayers
 * @returns {{ updatedHands: Card[][], newCard: Card, direction: number, skipNext: boolean }}
 * @pure
 */
export const performAITurn = (aiIndex, hands, currentCard, dir, numPlayers) => {
  const hand = hands[aiIndex];
  const colorFreq = R.countBy(R.prop("color"), hand);
  const commonColor = R.sortBy(([_, count]) => -count, R.toPairs(colorFreq))[0]?.[0] || COLORS[0];

  const validCards = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => isValidPlay(card, currentCard));

  const priorities = { "+4": 0, "+2": 1, Reverse: 2, Skip: 3 };
  const sortPriority = ({ card }) => (priorities[card.value] ?? 4) + (card.color === commonColor ? -0.5 : 0);
  const sorted = R.sortBy(sortPriority, validCards);

  let handsCopy = R.clone(hands);
  let newDirection = dir;
  let skipNext = false;
  let playedCard = null;

  if (sorted.length > 0) {
    const { card, i } = sorted[0];
    playedCard = { ...card };
    handsCopy[aiIndex] = R.remove(i, 1, hand);

    const target = nextTurn(aiIndex, numPlayers, dir);
    if (card.value === "+4") {
      playedCard.color = commonColor;
      handsCopy[target] = R.reduce(drawCard, handsCopy[target], R.range(0, 4));
    } else if (card.value === "+2") {
      handsCopy[target] = R.reduce(drawCard, handsCopy[target], R.range(0, 2));
    } else if (card.value === "Reverse") {
      newDirection *= -1;
    } else if (card.value === "Skip") {
      skipNext = true;
    }
  } else {
    handsCopy[aiIndex] = drawCard(hand);
  }

  return {
    updatedHands: handsCopy,
    newCard: playedCard || currentCard,
    direction: newDirection,
    skipNext
  };
};
