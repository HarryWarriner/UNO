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
          assert.ok(validTypes.includes(card.type), `Invalid type: ${card.type}`);

          if (card.type === "+4") {
            assert.ok(!card.color, "+4 should not have a color");
            assert.strictEqual(card.number, 4);
          } else {
            assert.ok(validColors.includes(card.color));
            if (card.type === "+2") {
              assert.strictEqual(card.number, 2);
            }
          }
        } else {
          assert.ok(validColors.includes(card.color));
          assert.ok(typeof card.number === "number");
          assert.ok(card.number >= 1 && card.number <= 9);
        }
      }
    });
  });

  describe("createHands", function () {
    it("creates the correct number of empty hands", function () {
      const hands = UNO.createHands(4);
      assert.strictEqual(hands.length, 4);
      hands.forEach(hand => {
        assert.ok(Array.isArray(hand));
        assert.strictEqual(hand.length, 0);
      });
    });

    it("returns an empty array if numPlayers is 0", function () {
      const hands = UNO.createHands(0);
      assert.deepStrictEqual(hands, []);
    });
  });

  describe("dealHands", function () {
    it("deals 7 cards to each player", function () {
      const hands = UNO.dealHands(3);
      assert.strictEqual(hands.length, 3);
      hands.forEach(hand => assert.strictEqual(hand.length, 7));
    });

    it("produces cards with valid structure", function () {
      const hands = UNO.dealHands(2);
      hands.flat().forEach(card => {
        assert.ok(card.color || card.type === "+4");
        assert.ok("number" in card || "type" in card);
      });
    });
  });

  describe("drawCard", function () {
    it("returns a new hand with an extra card", function () {
      const original = [];
      const newHand = UNO.drawCard(original);
      assert.strictEqual(original.length, 0);
      assert.strictEqual(newHand.length, 1);
    });
  });

  describe("isValidPlay", function () {
    it("returns true for matching color", function () {
      const card = { color: "Red", number: 3 };
      const current = { color: "Red", number: 5 };
      assert.ok(UNO.isValidPlay(card, current));
    });

    it("returns true for matching number", function () {
      const card = { color: "Blue", number: 7 };
      const current = { color: "Green", number: 7 };
      assert.ok(UNO.isValidPlay(card, current));
    });

    it("returns true for matching type", function () {
      const card = { type: "Skip", color: "Red" };
      const current = { type: "Skip", color: "Blue" };
      assert.ok(UNO.isValidPlay(card, current));
    });

    it("returns true for +4 regardless of current card", function () {
      const card = { type: "+4", number: 4 };
      const current = { color: "Green", number: 5 };
      assert.ok(UNO.isValidPlay(card, current));
    });

    it("returns false when nothing matches", function () {
      const card = { color: "Red", number: 3 };
      const current = { color: "Green", number: 5 };
      assert.ok(!UNO.isValidPlay(card, current));
    });
  });

  describe("nextTurn", function () {
    it("advances to next player", function () {
      assert.strictEqual(UNO.nextTurn(0, 4), 1);
      assert.strictEqual(UNO.nextTurn(2, 4), 3);
    });

    it("wraps around the player list", function () {
      assert.strictEqual(UNO.nextTurn(3, 4), 0);
    });

    it("respects direction", function () {
      assert.strictEqual(UNO.nextTurn(0, 4, -1), 3);
    });
  });

  describe("declareUno", function () {
    it("adds player to protected list when they have one card", function () {
      const hands = [[{ color: "Red", number: 2 }]];
      const protectedPlayers = new Set();
      const result = UNO.declareUno(0, hands, protectedPlayers);
      assert.ok(result);
      assert.ok(protectedPlayers.has(0));
    });

    it("does not protect player with more than one card", function () {
      const hands = [[{ color: "Red", number: 2 }, { color: "Green", number: 4 }]];
      const protectedPlayers = new Set();
      const result = UNO.declareUno(0, hands, protectedPlayers);
      assert.ok(!result);
      assert.ok(!protectedPlayers.has(0));
    });
  });

  describe("callUno", function () {
    it("penalizes unprotected player with 1 card", function () {
        const hands = [
            [{ color: "Red", number: 5 }],
            [{ color: "Blue", number: 4 }]
        ];
        const protectedPlayers = new Set();

        const result = UNO.callUno(1, hands, protectedPlayers);

        assert.ok(result.caught);
        assert.deepStrictEqual(result.punishedPlayers, [0]);

        // simulate what the caller (uno.js) would do:
        const punishedHand = hands[0];
        const afterPenalty = UNO.drawCard(UNO.drawCard(punishedHand));
        assert.strictEqual(afterPenalty.length, 3);
    });

    it("does not penalize protected player", function () {
      const hands = [[{ color: "Red", number: 5 }]];
      const protectedPlayers = new Set([0]);
      const result = UNO.callUno(1, hands, protectedPlayers);
      assert.ok(!result.caught);
      assert.ok(result.falseCall);
    });
  });

  describe("generateTurnSummary", function () {
    it("describes number card play", function () {
      const summary = UNO.generateTurnSummary(0, 4, 1, { color: "Red", number: 3 }, "Red");
      assert.ok(summary.includes("Player 1 played 3"));
    });

    it("describes +2 play", function () {
      const summary = UNO.generateTurnSummary(0, 4, 1, { type: "+2", color: "Blue", number: 2 }, "Blue");
      assert.ok(summary.includes("Player 1 played +2"));
      assert.ok(summary.includes("drew 2 cards"));
    });

    it("describes +4 play with color", function () {
      const summary = UNO.generateTurnSummary(0, 4, 1, { type: "+4", number: 4 }, "Green");
      assert.ok(summary.includes("Player 1 played +4"));
      assert.ok(summary.includes("drew 4 cards"));
      assert.ok(summary.includes("new color: Green"));
    });

    it("describes reverse", function () {
      const summary = UNO.generateTurnSummary(0, 4, 1, { type: "Reverse", color: "Blue" }, "Blue");
      assert.ok(summary.includes("Direction reversed"));
    });

    it("describes skip", function () {
      const summary = UNO.generateTurnSummary(0, 4, 1, { type: "Skip", color: "Yellow" }, "Yellow");
      assert.ok(summary.includes("was skipped"));
    });
  });

  describe("getCardStyle", function () {
    it("formats +4", function () {
      const card = { type: "+4", number: 4 };
      assert.deepStrictEqual(UNO.getCardStyle(card), { bgColor: "black", label: "+4" });
    });

    it("formats +2", function () {
      const card = { type: "+2", color: "Red", number: 2 };
      assert.deepStrictEqual(UNO.getCardStyle(card), { bgColor: "red", label: "+2" });
    });

    it("formats Reverse", function () {
      const card = { type: "Reverse", color: "Green" };
      assert.deepStrictEqual(UNO.getCardStyle(card), { bgColor: "green", label: "🔄" });
    });

    it("formats Skip", function () {
      const card = { type: "Skip", color: "Yellow" };
      assert.deepStrictEqual(UNO.getCardStyle(card), { bgColor: "yellow", label: "⏩" });
    });

    it("formats number card", function () {
      const card = { color: "Blue", number: 9 };
      assert.deepStrictEqual(UNO.getCardStyle(card), { bgColor: "blue", label: "9" });
    });
  });

  describe("performAITurn", function () {
    it("AI draws a card if it has no valid play", function () {
      const hands = [[{ color: "Red", number: 1 }], [{ color: "Green", number: 2 }]];
      const currentCard = { color: "Blue", number: 9 };
      const result = UNO.performAITurn(1, hands, currentCard, 1, 2);
      assert.strictEqual(result.updatedHands[1].length, 2); // Drew 1
      assert.deepStrictEqual(result.newCard, currentCard);
    });

    it("AI plays a valid card and removes it from hand", function () {
      const hands = [[{ color: "Red", number: 1 }], [{ color: "Green", number: 5 }]];
      const currentCard = { color: "Green", number: 9 };
      const result = UNO.performAITurn(1, hands, currentCard, 1, 2);
      assert.strictEqual(result.updatedHands[1].length, 0);
      assert.strictEqual(result.newCard.color, "Green");
    });

    it("AI chooses color for +4", function () {
      const hands = [
        [{ color: "Red", number: 2 }],
        [{ type: "+4", number: 4 }, { color: "Blue", number: 3 }]
      ];
      const currentCard = { color: "Green", number: 5 };
      const result = UNO.performAITurn(1, hands, currentCard, 1, 2);
      assert.ok(result.newCard.type === "+4");
      assert.ok(UNO.COLORS.includes(result.newCard.color));
    });

    it("AI reverses direction with Reverse card", function () {
      const hands = [
        [{ color: "Red", number: 1 }],
        [{ type: "Reverse", color: "Blue" }]
      ];
      const currentCard = { color: "Blue", number: 5 };
      const result = UNO.performAITurn(1, hands, currentCard, 1, 2);
      assert.strictEqual(result.direction, -1);
    });

    it("AI sets skip flag on Skip card", function () {
      const hands = [
        [{ color: "Red", number: 1 }],
        [{ type: "Skip", color: "Blue" }]
      ];
      const currentCard = { color: "Blue", number: 3 };
      const result = UNO.performAITurn(1, hands, currentCard, 1, 2);
      assert.ok(result.skipNext);
    });
  });
});
