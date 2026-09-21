import assert from "node:assert/strict";
import test from "node:test";
import { getAlertLevel } from "../src/utils/getAlertLevel.js";

test("40%, majd 100 százalékpontos lépésekben ad riasztási szinteket", () => {
  assert.deepEqual(getAlertLevel(Number.NaN), {
    alertLevel: null,
    nextAlertLevel: 40,
  });
  assert.deepEqual(getAlertLevel(39.99), {
    alertLevel: null,
    nextAlertLevel: 40,
  });
  assert.deepEqual(getAlertLevel(40), {
    alertLevel: 40,
    nextAlertLevel: 100,
  });
  assert.deepEqual(getAlertLevel(99.99), {
    alertLevel: 40,
    nextAlertLevel: 100,
  });
  assert.deepEqual(getAlertLevel(100), {
    alertLevel: 100,
    nextAlertLevel: 200,
  });
  assert.deepEqual(getAlertLevel(250), {
    alertLevel: 200,
    nextAlertLevel: 300,
  });
});
