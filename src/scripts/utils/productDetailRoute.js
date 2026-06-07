export function makeProductDetailUrl(currentUrl, productId) {
  const url = new URL(currentUrl);
  url.hash = `product=${encodeURIComponent(productId)}`;
  return url.toString();
}

export function getProductDetailParam(currentUrl) {
  const hash = new URL(currentUrl).hash.replace(/^#/, "");
  if (!hash.startsWith("product=")) return null;
  return decodeURIComponent(hash.slice("product=".length)) || null;
}

export function makeProductListUrl(currentUrl) {
  const url = new URL(currentUrl);
  url.hash = "";
  return url.toString();
}
