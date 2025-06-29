/**
 * @file uno-logic.js
 * @description Core functional logic for the UNO game, including turn management, AI, and card validation.
 * @namespace UNOLogic
 * @author Harry Warriner
 * @version 2025
 */

import * as R from "./ramda.js";

const UNOLogic = Object.create(null);

/**
 * @typedef {Object} Card
 * @memberof UNOLogic
 * @property {string} value - "1"–"9", "+2", "+4", "Skip", "Reverse"
 * @property {string} [color] - "Red", "Green", "Blue", or "Yellow" (undefined for Wild cards)
 */

/** @constant {string[]} COLORS - Valid UNO card colors */
export const COLORS = Object.freeze(["Red", "Green", "Blue", "Yellow"]);

/** @constant {string[]} SPECIAL_VALUES - Valid special card types @private */
const SPECIAL_VALUES = Object.freeze(["+2", "+4", "Skip", "Reverse"]);

/** @constant {string[]} NUMBER_VALUES - Valid number card values @private */
const NUMBER_VALUES = R.map(String, R.range(1, 10));

/**
 * Create a random UNO card.
 * @memberof UNOLogic
 * @returns {Card} A randomly generated UNO card.
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
 * Generate a hand of random UNO cards.
 * @memberof UNOLogic
 * @param {number} n Number of cards in the hand.
 * @returns {UNOLogic.Card[]} A list of randomly generated cards.
 * @private
 * @pure
 */
const generateHand = (n) => R.times(getRandomCard, n);

/**
 * Deal hands to players.
 * @memberof UNOLogic
 * @param {number} numPlayers Total number of players.
 * @returns {UNOLogic.Card[][]} A 2D array of cards, one hand per player.
 * @pure
 */
export const dealHands = (numPlayers) => R.times(() => generateHand(7), numPlayers);

/**
 * Draw one card and append it to the given hand.
 * @memberof UNOLogic
 * @param {UNOLogic.Card[]} hand The player's current hand.
 * @returns {UNOLogic.Card[]} A new hand with an additional card.
 * @pure
 */
export const drawCard = (hand) => R.append(getRandomCard(), hand);

/**
 * Check if a given card is playable against the current card.
 * @memberof UNOLogic
 * @param {UNOLogic.Card} card The card to be played.
 * @param {UNOLogic.Card} currentCard The card currently on the pile.
 * @returns {boolean} True if the play is valid.
 * @pure
 */
export const isValidPlay = (card, currentCard) =>
  card.value === "+4" ||
  card.color === currentCard.color ||
  card.value === currentCard.value;

/**
 * Get the index of the next player.
 * @memberof UNOLogic
 * @param {number} current Index of current player.
 * @param {number} total Total number of players.
 * @param {number} dir Direction of play (1 or -1).
 * @returns {number} Index of the next player.
 * @pure
 */
export const nextTurn = (current, total, dir = 1) =>
  (current + dir + total) % total;

/**
 * Declare UNO for a player.
 * @memberof UNOLogic
 * @param {number} index Index of the declaring player.
 * @param {UNOLogic.Card[][]} hands All player hands.
 * @param {Set<number>} protectedSet Set of protected players.
 * @returns {boolean} Whether the declaration was valid.
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
 * Attempt to call UNO on opponents.
 * @memberof UNOLogic
 * @param {number} caller Index of calling player.
 * @param {UNOLogic.Card[][]} hands All player hands.
 * @param {Set<number>} protectedSet Set of protected players.
 * @returns {{ caught: boolean, punishedPlayers: number[] }} Result of the call.
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
 * Get CSS class and label for a card.
 * @memberof UNOLogic
 * @param {UNOLogic.Card} card The card to style.
 * @returns {{ bgColor: string, label: string }} CSS and label info.
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
 * Generate a summary of the last turn.
 * @memberof UNOLogic
 * @param {number} turn The player who just played.
 * @param {number} num Total number of players.
 * @param {number} dir Game direction.
 * @param {UNOLogic.Card} card The card played.
 * @param {string} currentColor Current color in play.
 * @returns {string} Summary string.
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
 * Perform an AI player's turn.
 * @memberof UNOLogic
 * @param {number} aiIndex Index of the AI player.
 * @param {UNOLogic.Card[][]} hands All player hands.
 * @param {UNOLogic.Card} currentCard Current card in play.
 * @param {number} dir Current direction.
 * @param {number} numPlayers Total number of players.
 * @returns {{ updatedHands: UNOLogic.Card[][], newCard: UNOLogic.Card, direction: number, skipNext: boolean }} Result of AI move.
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