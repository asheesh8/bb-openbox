import assert from "node:assert/strict";
import { test } from "node:test";

import { getProductDetailParam, makeProductDetailUrl } from "./productDetailRoute.js";

test("makeProductDetailUrl preserves existing query and sets the product hash", () => {
  const url = makeProductDetailUrl("http://127.0.0.1:4173/?photos=2", "6514417-excellent");

  assert.equal(url, "http://127.0.0.1:4173/?photos=2#product=6514417-excellent");
});

test("getProductDetailParam reads encoded product ids from the hash", () => {
  const productId = getProductDetailParam("http://127.0.0.1:4173/?photos=2#product=6514417-excellent");

  assert.equal(productId, "6514417-excellent");
});

test("getProductDetailParam ignores non-product hashes", () => {
  const productId = getProductDetailParam("http://127.0.0.1:4173/?photos=2#top");

  assert.equal(productId, null);
});
