import assert from "node:assert/strict"
import test from "node:test"
import { shuffledOrder, stepIndex } from "../src/lib/playback.ts"

test("shuffledOrder keeps the first index in front and covers the queue once", () => {
  const order = shuffledOrder(5, 2)
  assert.equal(order[0], 2)
  assert.deepEqual([...order].sort((a, b) => a - b), [0, 1, 2, 3, 4])
})

test("stepIndex walks forward then stops at the end when repeat is off", () => {
  assert.equal(stepIndex([0, 1, 2], 0, 1, "off"), 1)
  assert.equal(stepIndex([0, 1, 2], 2, 1, "off"), -1)
})

test("stepIndex wraps around when repeat is all", () => {
  assert.equal(stepIndex([0, 1, 2], 2, 1, "all"), 0)
  assert.equal(stepIndex([0, 1, 2], 0, -1, "all"), 2)
})

test("stepIndex follows the shuffled order instead of queue order", () => {
  assert.equal(stepIndex([3, 1, 0, 2], 3, 1, "off"), 1)
  assert.equal(stepIndex([3, 1, 0, 2], 2, 1, "off"), -1)
})

test("stepIndex starts at the head of a fresh queue", () => {
  assert.equal(stepIndex([0, 1], -1, 1, "off"), 0)
  assert.equal(stepIndex([], 0, 1, "off"), -1)
})