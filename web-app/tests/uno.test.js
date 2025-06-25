import * as UNO from "../uno-logic.js";
import assert from "assert";

describe("UNO Logic", function () {
    describe("getRandomCard", function () {
        it("returns a card with a valid color and number", function () {
            const validColors = UNO.COLORS;
            for (let i = 0; i < 100; i++) {
                const card = UNO.getRandomCard();
                assert.ok(validColors.includes(card.color), `Invalid color: ${card.color}`);
                assert.ok(
                    typeof card.number === "number" &&
                    card.number >= 1 &&
                    card.number <= 9,
                    `Invalid number: ${card.number}`
                );
            }
        });
    });

    describe("createHands", function () {
        it("creates the correct number of empty hands", function () {
            const hands = UNO.createHands(4);
            assert.strictEqual(hands.length, 4);
            hands.forEach(hand => {
                assert.ok(Array.isArray(hand), "Hand should be an array");
                assert.strictEqual(hand.length, 0, "Hand should be empty");
            });
        });

        it("returns an empty array if numPlayers is 0", function () {
            const hands = UNO.createHands(0);
            assert.deepStrictEqual(hands, []);
        });
    });

    describe("isValidPlay", function () {
        it("returns true when colors match", function () {
            const current = { color: "Red", number: 999 }; 
            const card = { color: "Red", number: 5 };
            assert.ok(UNO.isValidPlay(card, current));
        });

        it("returns true when numbers match (by placing number in color field)", function () {
            const current = { color: "Red", number: 7 }; 
            const card = { color: "Blue", number: 7 };
            assert.ok(UNO.isValidPlay(card, current));
        });

        it("returns false when neither color nor number match", function () {
            const current = { color: "Green", number: 2 };
            const card = { color: "Red", number: 5 };
            assert.ok(!UNO.isValidPlay(card, current));
        });
    });

    describe("nextTurn", function () {
        it("advances to the next player", function () {
            assert.strictEqual(UNO.nextTurn(0, 4), 1);
            assert.strictEqual(UNO.nextTurn(2, 4), 3);
        });

        it("wraps around to 0 after the last player", function () {
            assert.strictEqual(UNO.nextTurn(3, 4), 0);
        });
    });
});
