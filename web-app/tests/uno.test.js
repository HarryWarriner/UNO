import * as UNO from "../uno-logic.js";
import assert from "assert";

describe("UNO Logic", function () {
    describe("getRandomCard", function () {
        it("returns a card with a valid structure", function () {
            const validColors = UNO.COLORS;
            const validTypes = ["+2", "+4", "Reverse", "Skip"];

            for (let i = 0; i < 100; i++) {
                const card = UNO.getRandomCard();

                if (card.type) {
                    // Special cards
                    assert.ok(validTypes.includes(card.type), `Invalid type: ${card.type}`);

                    if (card.type === "+4") {
                        // Wild +4 has no color
                        assert.ok(!card.color, "+4 should not have a color");
                        assert.strictEqual(card.number, 4, "+4 should have number 4");
                    } else {
                        // Other action cards must have a valid color
                        assert.ok(validColors.includes(card.color), `Invalid color for action card: ${card.color}`);
                        if (card.type === "+2") {
                            assert.strictEqual(card.number, 2, "+2 should have number 2");
                        }
                    }
                } else {
                    // Number cards
                    assert.ok(validColors.includes(card.color), `Invalid color: ${card.color}`);
                    assert.ok(
                        typeof card.number === "number" &&
                        card.number >= 1 &&
                        card.number <= 9,
                        `Invalid number card: ${JSON.stringify(card)}`
                    );
                }
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
            const current = { color: "Red", number: 9 };
            const card = { color: "Red", number: 5 };
            assert.ok(UNO.isValidPlay(card, current));
        });

        it("returns true when numbers match", function () {
            const current = { color: "Red", number: 7 };
            const card = { color: "Blue", number: 7 };
            assert.ok(UNO.isValidPlay(card, current));
        });

        it("returns true when types match", function () {
            const current = { color: "Green", type: "Skip" };
            const card = { color: "Red", type: "Skip" };
            assert.ok(UNO.isValidPlay(card, current));
        });

        it("returns true when card is a +4 (wild)", function () {
            const current = { color: "Green", number: 3 };
            const card = { type: "+4", number: 4 }; // Wild +4 has no color
            assert.ok(UNO.isValidPlay(card, current));
        });

        it("returns false when color, number, and type do not match", function () {
            const current = { color: "Green", number: 2 };
            const card = { color: "Red", number: 5 };
            assert.ok(!UNO.isValidPlay(card, current));
        });

        it("returns true when both color and type match for +2", function () {
            const current = { color: "Blue", type: "+2", number: 2 };
            const card = { color: "Blue", type: "+2", number: 2 };
            assert.ok(UNO.isValidPlay(card, current));
        });

        it("returns false for +2 if color and type do not match", function () {
            const current = { color: "Yellow", number: 1 };
            const card = { color: "Blue", type: "+2", number: 2 };
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
    describe("dealHands", function () {
        it("deals 7 cards to each player", function () {
            const numPlayers = 3;
            const hands = UNO.dealHands(numPlayers);
            assert.strictEqual(hands.length, numPlayers);
            hands.forEach(hand => {
                assert.strictEqual(hand.length, 7);
            });
        });

        it("produces cards with valid structure", function () {
            const hands = UNO.dealHands(2);
            hands.flat().forEach(card => {
                assert.ok(card.color || card.type === "+4", "Card should have a color unless it's a +4");
                assert.ok("number" in card || "type" in card, "Card must have number or type");
            });
        });
    });
    describe("drawCard", function () {
        it("adds a card to the hand", function () {
            const hand = [];
            UNO.drawCard(hand);
            assert.strictEqual(hand.length, 1);
        });
    });
    describe("declareUno", function () {
        it("protects player when they have one card", function () {
            const hands = [[{ color: "Red", number: 2 }]];
            const protectedPlayers = new Set();
            const result = UNO.declareUno(0, hands, protectedPlayers);
            assert.ok(result);
            assert.ok(protectedPlayers.has(0));
        });

        it("does not protect when hand has more than one card", function () {
            const hands = [[{ color: "Red", number: 2 }, { color: "Green", number: 3 }]];
            const protectedPlayers = new Set();
            const result = UNO.declareUno(0, hands, protectedPlayers);
            assert.ok(!result);
            assert.ok(!protectedPlayers.has(0));
        });
    });
    describe("callUno", function () {
        it("punishes players with 1 card who didn't declare UNO", function () {
            const hands = [
                [{ color: "Red", number: 2 }],
                [{ color: "Green", number: 5 }, { color: "Blue", number: 6 }]
            ];
            const protectedPlayers = new Set();
            const result = UNO.callUno(1, hands, protectedPlayers);
            assert.ok(result.caught);
            assert.deepStrictEqual(result.punishedPlayers, [0]);
            assert.strictEqual(hands[0].length, 3); // Drew 2 extra cards
        });

        it("does not punish protected players", function () {
            const hands = [[{ color: "Red", number: 2 }]];
            const protectedPlayers = new Set([0]);
            const result = UNO.callUno(1, hands, protectedPlayers);
            assert.ok(!result.caught);
            assert.ok(result.falseCall);
        });
    });
    describe("generateTurnSummary", function () {
        it("describes a normal number play", function () {
            const card = { color: "Red", number: 3 };
            const summary = UNO.generateTurnSummary(0, 4, 1, card, "Red");
            assert.ok(summary.includes("Player 1 played 3"));
        });

        it("includes +2 and card draw notice", function () {
            const card = { type: "+2", color: "Red", number: 2 };
            const summary = UNO.generateTurnSummary(1, 4, 1, card, "Red");
            assert.ok(summary.includes("Player 2 played +2"));
            assert.ok(summary.includes("drew 2 cards"));
        });

        it("includes +4 and color change", function () {
            const card = { type: "+4", number: 4 };
            const summary = UNO.generateTurnSummary(2, 4, 1, card, "Green");
            assert.ok(summary.includes("Player 3 played +4"));
            assert.ok(summary.includes("drew 4 cards"));
            assert.ok(summary.includes("new color: Green"));
        });

        it("includes Reverse and Skip effects", function () {
            const reverse = UNO.generateTurnSummary(0, 4, 1, { type: "Reverse", color: "Blue" }, "Blue");
            assert.ok(reverse.includes("Direction reversed"));

            const skip = UNO.generateTurnSummary(1, 4, 1, { type: "Skip", color: "Green" }, "Green");
            assert.ok(skip.includes("was skipped"));
        });
    });
    describe("getCardStyle", function () {
        it("returns correct style for +4", function () {
            const card = { type: "+4", number: 4 };
            const style = UNO.getCardStyle(card);
            assert.deepStrictEqual(style, { bgColor: "black", label: "+4" });
        });

        it("returns correct style for +2", function () {
            const card = { type: "+2", color: "Red", number: 2 };
            const style = UNO.getCardStyle(card);
            assert.deepStrictEqual(style, { bgColor: "red", label: "+2" });
        });

        it("returns correct style for Reverse", function () {
            const card = { type: "Reverse", color: "Green" };
            const style = UNO.getCardStyle(card);
            assert.deepStrictEqual(style, { bgColor: "green", label: "🔄" });
        });

        it("returns correct style for Skip", function () {
            const card = { type: "Skip", color: "Yellow" };
            const style = UNO.getCardStyle(card);
            assert.deepStrictEqual(style, { bgColor: "yellow", label: "⏩" });
        });

        it("returns correct style for number card", function () {
            const card = { color: "Blue", number: 7 };
            const style = UNO.getCardStyle(card);
            assert.deepStrictEqual(style, { bgColor: "blue", label: "7" });
        });
    });




});
