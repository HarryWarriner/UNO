import * as UNOLogic from "../uno-logic.js";
import assert from "assert";

describe("UNOLogic", function () {
  describe("getRandomCard", function () {
    it("returns a valid card structure", function () {
      for (let i = 0; i < 100; i++) {
        const card = UNOLogic.getRandomCard();
        assert.ok(card.value);
        if (card.value === "+4") {
          assert.strictEqual(card.color, undefined);
        } else {
          assert.ok(UNOLogic.COLORS.includes(card.color));
        }
      }
    });
  });

  describe("dealHands", function () {
    it("check that each player recieves 7 cards on start", function () {
      const hands = UNOLogic.dealHands(4);
      assert.strictEqual(hands.length, 4);
      hands.forEach(hand => assert.strictEqual(hand.length, 7));
    });
  });

  describe("drawCard", function () {
    it("checks that a new card is added to the hand", function () {
      const hand = [];
      const newHand = UNOLogic.drawCard(hand);
      assert.strictEqual(newHand.length, 1);
    });
  });

  describe("isValidPlay", function () {
    it("Checks same colour", function () {
      assert.ok(UNOLogic.isValidPlay(
        { value: "5", color: "Red" },
        { value: "3", color: "Red" }
      ));
    });

    it("Checks same value", function () {
      assert.ok(UNOLogic.isValidPlay(
        { value: "Skip", color: "Red" },
        { value: "Skip", color: "Blue" }
      ));
    });

    it("always allows +4", function () {
      assert.ok(UNOLogic.isValidPlay(
        { value: "+4" },
        { value: "2", color: "Green" }
      ));
    });

    it("Checks that non-matching cards is not valid", function () {
      assert.ok(!UNOLogic.isValidPlay(
        { value: "3", color: "Red" },
        { value: "4", color: "Green" }
      ));
    });
  });

  describe("nextTurn", function () {
    it("rotates correctly", function () {
      assert.strictEqual(UNOLogic.nextTurn(3, 4), 0);
      assert.strictEqual(UNOLogic.nextTurn(0, 4, -1), 3);
    });
  });

  describe("declareUno", function () {
    it("checks that someone is added to protected set", function () {
      const hands = [[{ value: "5", color: "Red" }]];
      const prot = new Set();
      const res = UNOLogic.declareUno(0, hands, prot);
      assert.ok(res);
      assert.ok(prot.has(0));
    });
  });

  describe("callUno", function () {
    it("catches unprotected players with 1 card", function () {
      const hands = [[{ value: "4", color: "Red" }], [{ value: "5", color: "Blue" }]];
      const prot = new Set();
      const result = UNOLogic.callUno(1, hands, prot);
      assert.ok(result.caught);
      assert.deepStrictEqual(result.punishedPlayers, [0]);
    });
  });

  describe("getCardStyle", function () {
    it("returns proper formatting", function () {
      const card = { value: "Reverse", color: "Red" };
      const style = UNOLogic.getCardStyle(card);
      assert.deepStrictEqual(style, { bgColor: "red", label: "🔄" });
    });
  });

  describe("generateTurnSummary", function () {
    it("describes +2 play", function () {
      const s = UNOLogic.generateTurnSummary(0, 4, 1, { value: "+2", color: "Green" }, "Green");
      assert.ok(s.includes("drew 2 cards"));
    });
  });

  describe("performAITurn", function () {
    it("Check if it draws if there is no valid play", function () {
      const hands = [[{ value: "1", color: "Red" }], [{ value: "2", color: "Green" }]];
      const res = UNOLogic.performAITurn(1, hands, { value: "5", color: "Blue" }, 1, 2);
      assert.strictEqual(res.updatedHands[1].length, 2);
    });

    it("plays valid card and updates hand", function () {
      const hands = [[{ value: "1", color: "Red" }], [{ value: "2", color: "Blue" }]];
      const res = UNOLogic.performAITurn(1, hands, { value: "5", color: "Blue" }, 1, 2);
      assert.strictEqual(res.updatedHands[1].length, 0);
      assert.strictEqual(res.newCard.color, "Blue");
    });

    it("sets skip flag for Skip card", function () {
      const hands = [[{ value: "1", color: "Red" }], [{ value: "Skip", color: "Green" }]];
      const res = UNOLogic.performAITurn(1, hands, { value: "9", color: "Green" }, 1, 2);
      assert.ok(res.skipNext);
    });

    it("updates direction for Reverse card", function () {
      const hands = [[{ value: "1", color: "Red" }], [{ value: "Reverse", color: "Green" }]];
      const res = UNOLogic.performAITurn(1, hands, { value: "7", color: "Green" }, 1, 2);
      assert.strictEqual(res.direction, -1);
    });

  });

  describe("End game detection", function () {
    it("confirms a win when a player has no cards left", function () {
      const hands = [[{ value: "7", color: "Red" }], []];
      const currentCard = { value: "7", color: "Red" };
      const result = UNOLogic.performAITurn(0, hands, currentCard, 1, 2);
      const isWin = result.updatedHands.some(hand => hand.length === 0);
      assert.ok(isWin);
    });
  });
});