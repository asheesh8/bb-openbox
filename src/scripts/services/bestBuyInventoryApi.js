import { DEPTS } from "../config/productDepartments.js";

// Sends a tiny request so we can tell whether the pasted Best Buy API key works.
export async function verifyBestBuyApiKey(apiKey) {
  try {
    const response = await fetch(`https://api.bestbuy.com/beta/products/openBox(categoryId=abcat0507002)?apiKey=${apiKey}&pageSize=1`);
    return response.ok;
  } catch {
    return false;
  }
}

// Downloads open box offers for every department category and normalizes them.
export async function fetchOpenBoxInventory({ apiKey, store, onStatus = () => {} }) {
  const results = [];
  const seen = new Set();
  const categoryIds = [...new Set(DEPTS.flatMap(dept => dept.cats))];

  onStatus(`Fetching ${store.city} open box inventory...`);

  await Promise.all(categoryIds.map(async catId => {
    try {
      const response = await fetch(`https://api.bestbuy.com/beta/products/openBox(categoryId=${catId})?apiKey=${apiKey}&pageSize=100&storeId=${store.bbStoreId}`);
      if (!response.ok) return;
      const data = await response.json();
      const dept = DEPTS.find(candidate => candidate.cats.includes(catId));
      if (!dept) return;

      for (const item of (data.results || [])) {
        for (const offer of (item.offers || [])) {
          const key = `${item.sku}-${offer.condition}`;
          const reg = offer.prices?.regular || item.prices?.regular || 0;
          const sale = offer.prices?.current || item.prices?.current || 0;
          const savings = +(reg - sale).toFixed(2);
          if (seen.has(key) || savings <= 0) continue;

          seen.add(key);
          const fullDesc = await fetchProductDescription(apiKey, item);
          const name = item.names?.title || "Unknown";

          results.push({
            sku: item.sku,
            name,
            desc: fullDesc,
            category: dept.id,
            reg,
            sale,
            savings,
            pct: Math.round(savings / Math.max(reg, 1) * 100),
            cond: offer.condition || "unknown",
            rating: parseFloat(item.customerReviews?.averageScore) || 0,
            reviews: item.customerReviews?.count || 0,
            img: item.images?.standard || "",
            url: item.links?.web || `https://www.bestbuy.com/site/${item.sku}.p?skuId=${item.sku}`,
            specs: dept.parseSpec(name, fullDesc),
            brand: dept.brandFromName(name),
          });
        }
      }
    } catch {}
  }));

  return results;
}

async function fetchProductDescription(apiKey, item) {
  let fullDesc = item.descriptions?.short || "";
  try {
    const response = await fetch(`https://api.bestbuy.com/v1/products/${item.sku}.json?show=shortDescription,manufacturer,modelNumber&apiKey=${apiKey}`);
    if (!response.ok) return fullDesc;
    const data = await response.json();
    return data.shortDescription || fullDesc;
  } catch {
    return fullDesc;
  }
}
