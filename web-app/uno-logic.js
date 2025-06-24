import * as R from "./ramda.js";

/**
 * @typedef {{ color: string, number: number }} Card
 */

/**
 * Available UNO colors.
 * @type {string[]}
 */
export const COLORS = ["Red", "Green", "Blue", "Yellow"];

/**
 * Generate a random UNO card.
 * @returns {Card}
 */
export const getRandomCard = () => ({
  color: R.nth(Math.floor(Math.random() * COLORS.length), COLORS),
  number: Math.floor(Math.random() * 9) + 1,
});

/**
 * Create a list of empty hands for each player.
 * @param {number} numPlayers
 * @returns {Card[][]}
 */
export const createHands = (numPlayers) => R.repeat([], numPlayers);

/**
 * Check if a card can be legally played on the current card.
 * @param {Card} card
 * @param {Card} currentCard
 * @returns {boolean}
 */
export const isValidPlay = (card, currentCard) =>
  R.either(
    R.equals(card.color),
    R.equals(card.number)
  )(currentCard.color, currentCard.number);

/**
 * Compute the next turn index.
 * @param {number} currentTurn
 * @param {number} numPlayers
 * @returns {number}
 */
export const nextTurn = (currentTurn, numPlayers) =>
  (currentTurn + 1) % numPlayers;
