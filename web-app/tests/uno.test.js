import R from "../ramda.js";
import UNO from "../uno.js";

/**
 * @namespace UNO.test
 * Unit tests for the UNO game logic.
 */

describe("UNO: Card Generation", function () {
    it("Generated card has valid color and number", function () {
        const validColors = ["Red", "Green", "Blue", "Yellow"];
        for (let i = 0; i < 100; i++) {
            const card = UNO.getRandomCard?.() || window.getRandomCard(); // support either exposed
            if (!validColors.includes(card.color)) {
                throw new Error(`Invalid color: ${card.color}`);
            }
            if (typeof card.number !== "number" || card.number < 1 || card.number > 9) {
                throw new Error(`Invalid number: ${card.number}`);
            }
        }
    });
});

