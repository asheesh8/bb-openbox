import { DEPTS } from "../config/productDepartments.js";

// Demo products let the app run without a live API key during presentations.
const IMAGE_SKU_OVERRIDES = {
  "6534632": "6534615",
  "6499198": "6540611",
  "6534001": "10895273",
  "6543912": "6571371",
  "6537029": "11996803",
  "6534892": "11972434",
  "6544510": "12110254",
  "6539006": "6438723",
  "6521121": "6532244",
  "6514417": "6599654",
  "6542015": "6535024",
  "6532199": "6403999",
};

const bestBuyProductImage = sku =>
  `https://pisces.bbystatic.com/image2/BestBuy_US/images/products/${String(sku).slice(0, 4)}/${sku}_sd.jpg`;

export const DEMO_ITEMS = [
  {sku:"6534632",name:"Apple MacBook Pro 14\" M3 Pro 18GB/512GB",desc:"M3 Pro chip, 18GB unified memory, Liquid Retina XDR, ProRes",category:"laptops",reg:1999.99,sale:1399.99,cond:"excellent",rating:4.9,reviews:447,img:""},
  {sku:"6499198",name:"Dell XPS 15\" OLED Touch i7-13700H 16GB/512GB",desc:"Intel Core i7 13th Gen, NVIDIA RTX 4060, OLED touch 3.5K",category:"laptops",reg:1899.99,sale:1099.99,cond:"excellent",rating:4.6,reviews:312,img:""},
  {sku:"6534001",name:"Samsung Galaxy Book3 Pro 360 16\" i7 16GB/512GB",desc:"Intel Evo i7, 16GB RAM, 512GB SSD, AMOLED touch, S Pen",category:"laptops",reg:1399.99,sale:799.99,cond:"certified",rating:4.4,reviews:198,img:""},
  {sku:"6543912",name:"Lenovo Yoga 9i 14\" 2-in-1 Core Ultra 7 16GB/1TB",desc:"OLED touch display, Intel Core Ultra 7, 16GB memory, 1TB SSD, pen included",category:"laptops",reg:1649.99,sale:1049.99,cond:"excellent",rating:4.6,reviews:284,img:""},
  {sku:"6537029",name:"HP Spectre x360 16\" Core Ultra 7 32GB/2TB",desc:"2-in-1 OLED touch, 32GB RAM, 2TB SSD, Intel Arc graphics, Windows 11",category:"laptops",reg:1999.99,sale:1199.99,cond:"good",rating:4.5,reviews:219,img:""},
  {sku:"6541288",name:"Asus ROG Zephyrus G14 14\" Ryzen 9 32GB/1TB RTX 4070",desc:"Ryzen 9, 32GB memory, 1TB SSD, NVIDIA GeForce RTX 4070, OLED gaming display",category:"laptops",reg:2199.99,sale:1499.99,cond:"certified",rating:4.7,reviews:531,img:""},
  {sku:"6502221",name:"Acer Swift Go 14\" OLED Intel Evo i7 16GB/512GB",desc:"Intel Core i7, 16GB RAM, 512GB SSD, lightweight OLED laptop",category:"laptops",reg:999.99,sale:599.99,cond:"excellent",rating:4.3,reviews:176,img:""},
  {sku:"6529910",name:"Microsoft Surface Laptop 5 13.5\" i5 8GB/512GB",desc:"PixelSense touch display, Intel Core i5, 8GB memory, 512GB SSD",category:"laptops",reg:1299.99,sale:699.99,cond:"satisfactory",rating:4.4,reviews:612,img:""},
  {sku:"6519014",name:"Dell Inspiron 16\" 2-in-1 i7 16GB/1TB",desc:"Intel Core i7, 16GB RAM, 1TB SSD, touch display, fingerprint reader",category:"laptops",reg:1199.99,sale:729.99,cond:"excellent",rating:4.5,reviews:244,img:""},

  {sku:"6502438",name:"LG 65\" C3 OLED evo 4K Smart TV",desc:"OLED evo panel, alpha9 Gen6 AI, 120Hz, Dolby Vision IQ",category:"tvs",reg:1799.99,sale:1069.99,cond:"excellent",rating:4.7,reviews:892,img:""},
  {sku:"6412149",name:"Samsung 75\" QN90B Neo QLED 4K",desc:"Mini LED, Neo Quantum 4K, Dolby Atmos, 120Hz, Quantum HDR",category:"tvs",reg:2199.99,sale:1249.99,cond:"certified",rating:4.5,reviews:1203,img:""},
  {sku:"6535928",name:"Sony 65\" BRAVIA XR A80L OLED 4K Smart TV",desc:"OLED, Cognitive Processor XR, Google TV, Dolby Vision, 120Hz",category:"tvs",reg:2199.99,sale:1399.99,cond:"excellent",rating:4.8,reviews:938,img:""},
  {sku:"6551177",name:"TCL 85\" QM8 QLED Mini LED 4K Smart TV",desc:"Mini LED, QLED color, 120Hz, HDR Ultra, Google TV",category:"tvs",reg:2799.99,sale:1599.99,cond:"good",rating:4.6,reviews:684,img:""},
  {sku:"6538124",name:"Hisense 75\" U8K Mini LED QLED 4K Google TV",desc:"Mini LED Pro, Quantum Dot, 144Hz, Dolby Vision, Wi-Fi",category:"tvs",reg:1699.99,sale:949.99,cond:"excellent",rating:4.5,reviews:1136,img:""},
  {sku:"6550092",name:"LG 77\" B3 OLED 4K Smart TV",desc:"OLED panel, 120Hz, Dolby Vision, webOS, Game Optimizer",category:"tvs",reg:2499.99,sale:1499.99,cond:"certified",rating:4.7,reviews:472,img:""},
  {sku:"6527334",name:"Vizio 55\" MQX QLED 4K 120Hz Smart TV",desc:"QLED, 120Hz, Dolby Vision HDR, AMD FreeSync Premium",category:"tvs",reg:699.99,sale:399.99,cond:"excellent",rating:4.3,reviews:829,img:""},
  {sku:"6401726",name:"Insignia 43\" F30 LED 4K Fire TV",desc:"LED 4K UHD, Fire TV built in, DTS Studio Sound",category:"tvs",reg:299.99,sale:169.99,cond:"satisfactory",rating:4.4,reviews:3914,img:""},

  {sku:"6523401",name:"Samsung Galaxy S24 Ultra 256GB Titanium Gray",desc:"Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, titanium frame",category:"phones",reg:1299.99,sale:849.99,cond:"excellent",rating:4.7,reviews:1876,img:""},
  {sku:"6508812",name:"Apple iPhone 15 Pro 256GB Natural Titanium",desc:"A17 Pro, 48MP triple camera, USB-C, Action button",category:"phones",reg:1099.99,sale:749.99,cond:"excellent",rating:4.8,reviews:3201,img:""},
  {sku:"6549235",name:"Apple iPhone 15 Pro Max 512GB Blue Titanium",desc:"A17 Pro chip, 48MP camera system, USB-C, Pro Max battery life",category:"phones",reg:1399.99,sale:999.99,cond:"certified",rating:4.8,reviews:2844,img:""},
  {sku:"6531775",name:"Google Pixel 8 Pro 128GB Obsidian",desc:"Google Tensor G3, pro camera controls, AI photo tools, 5G",category:"phones",reg:999.99,sale:599.99,cond:"excellent",rating:4.6,reviews:1429,img:""},
  {sku:"6540721",name:"Samsung Galaxy Z Fold5 512GB Phantom Black",desc:"Foldable 7.6-inch display, Snapdragon 8 Gen 2, 512GB storage",category:"phones",reg:1919.99,sale:1199.99,cond:"good",rating:4.5,reviews:992,img:""},
  {sku:"6535504",name:"Motorola razr+ 256GB Viva Magenta",desc:"Foldable pOLED display, Snapdragon 8+, 256GB storage, 5G",category:"phones",reg:999.99,sale:549.99,cond:"excellent",rating:4.2,reviews:618,img:""},
  {sku:"6546060",name:"Google Pixel 8 256GB Hazel",desc:"Tensor G3, 256GB storage, advanced photo editing, 5G",category:"phones",reg:759.99,sale:469.99,cond:"certified",rating:4.5,reviews:1712,img:""},
  {sku:"6531259",name:"OnePlus 12 512GB Flowy Emerald",desc:"Snapdragon 8 Gen 3, 16GB RAM, 512GB storage, Hasselblad camera",category:"phones",reg:899.99,sale:649.99,cond:"excellent",rating:4.6,reviews:306,img:""},

  {sku:"6487263",name:"Apple iPad Pro 12.9\" M2 256GB Wi-Fi",desc:"Liquid Retina XDR, M2, ProMotion 120Hz, Face ID, USB-C",category:"tablets",reg:1099.99,sale:749.99,cond:"excellent",rating:4.8,reviews:2341,img:""},
  {sku:"6543899",name:"Apple iPad Air 11\" M2 128GB Wi-Fi",desc:"M2 chip, 128GB storage, Liquid Retina display, Touch ID",category:"tablets",reg:599.99,sale:449.99,cond:"excellent",rating:4.7,reviews:486,img:""},
  {sku:"6547221",name:"Apple iPad Pro 11\" M4 512GB Wi-Fi",desc:"M4 chip, Ultra Retina XDR display, 512GB storage, Wi-Fi",category:"tablets",reg:1199.99,sale:899.99,cond:"certified",rating:4.9,reviews:214,img:""},
  {sku:"6529328",name:"Samsung Galaxy Tab S9 Ultra 14.6\" 512GB Wi-Fi",desc:"AMOLED display, Snapdragon 8 Gen 2, S Pen included, 512GB storage",category:"tablets",reg:1319.99,sale:849.99,cond:"good",rating:4.7,reviews:624,img:""},
  {sku:"6537752",name:"Microsoft Surface Pro 9 13\" i7 16GB/256GB",desc:"PixelSense touch, Intel Core i7, 16GB memory, 256GB SSD, Wi-Fi",category:"tablets",reg:1599.99,sale:899.99,cond:"excellent",rating:4.4,reviews:812,img:""},
  {sku:"6529246",name:"Lenovo Tab P12 12.7\" 128GB Wi-Fi",desc:"3K display, 128GB storage, quad JBL speakers, Wi-Fi",category:"tablets",reg:399.99,sale:249.99,cond:"excellent",rating:4.3,reviews:357,img:""},
  {sku:"6508087",name:"Amazon Fire Max 11 64GB Wi-Fi",desc:"11-inch display, 64GB storage, Wi-Fi, aluminum design",category:"tablets",reg:229.99,sale:129.99,cond:"satisfactory",rating:4.2,reviews:1188,img:""},
  {sku:"6546330",name:"Samsung Galaxy Tab S9 FE 10.9\" 256GB Wi-Fi",desc:"S Pen included, 256GB storage, IP68 rating, Wi-Fi",category:"tablets",reg:519.99,sale:349.99,cond:"certified",rating:4.6,reviews:549,img:""},

  {sku:"6412002",name:"Samsung 29 cu.ft. 4-Door French Door Refrigerator",desc:"Family Hub, AutoFill Water Pitcher, Dual Ice Maker, stainless steel",category:"appliances",reg:3299.99,sale:1899.99,cond:"certified",rating:4.3,reviews:567,img:""},
  {sku:"6536211",name:"LG 5.0 cu.ft. Smart Front Load Washer",desc:"TurboWash 360, AI Direct Drive, built-in intelligence, Wi-Fi",category:"appliances",reg:1199.99,sale:699.99,cond:"excellent",rating:4.4,reviews:789,img:""},
  {sku:"6529904",name:"LG 7.4 cu.ft. Smart Electric Dryer",desc:"Steam, Sensor Dry, Wi-Fi, stackable design, graphite steel",category:"appliances",reg:1199.99,sale:649.99,cond:"excellent",rating:4.5,reviews:654,img:""},
  {sku:"6508881",name:"Whirlpool 24.6 cu.ft. Side-by-Side Refrigerator",desc:"Fingerprint resistant stainless, frameless glass shelves, LED lighting",category:"appliances",reg:1699.99,sale:999.99,cond:"good",rating:4.2,reviews:873,img:""},
  {sku:"6531222",name:"GE 30\" Smart Slide-In Electric Convection Range",desc:"No preheat air fry, Wi-Fi, stainless steel, 5-element cooktop",category:"appliances",reg:2199.99,sale:1299.99,cond:"certified",rating:4.5,reviews:458,img:""},
  {sku:"6540048",name:"Bosch 500 Series Dishwasher 24\" Stainless Steel",desc:"AutoAir, flexible third rack, quiet 44 dBA, stainless tub",category:"appliances",reg:1099.99,sale:729.99,cond:"excellent",rating:4.6,reviews:738,img:""},
  {sku:"6517319",name:"Maytag 5.3 cu.ft. Smart Top Load Washer",desc:"Extra Power button, deep fill, Wi-Fi, stainless steel basket",category:"appliances",reg:999.99,sale:549.99,cond:"satisfactory",rating:4.1,reviews:531,img:""},
  {sku:"6530907",name:"KitchenAid 26.8 cu.ft. French Door Refrigerator",desc:"PrintShield finish, exterior ice and water, measured fill, stainless",category:"appliances",reg:3499.99,sale:2199.99,cond:"excellent",rating:4.4,reviews:286,img:""},

  {sku:"6412877",name:"Sony WH-1000XM5 Wireless Noise Canceling Headphones",desc:"Industry-leading ANC, Bluetooth, multipoint, 30 hour battery",category:"audio",reg:399.99,sale:219.99,cond:"excellent",rating:4.8,reviews:5621,img:""},
  {sku:"6501045",name:"Bose QuietComfort Ultra Wireless Noise Canceling Headphones",desc:"Spatial audio, advanced ANC, Bluetooth multipoint, 24 hour battery",category:"audio",reg:429.99,sale:279.99,cond:"certified",rating:4.7,reviews:1856,img:""},
  {sku:"6525420",name:"Apple AirPods Pro 2 True Wireless Earbuds USB-C",desc:"Active noise canceling, adaptive audio, MagSafe charging case, wireless",category:"audio",reg:249.99,sale:169.99,cond:"excellent",rating:4.8,reviews:9104,img:""},
  {sku:"6543154",name:"Samsung Galaxy Buds2 Pro True Wireless Earbuds",desc:"ANC, Hi-Fi sound, 360 audio, Bluetooth, water resistant",category:"audio",reg:229.99,sale:119.99,cond:"good",rating:4.5,reviews:3188,img:""},
  {sku:"6530224",name:"JBL Charge 5 Portable Bluetooth Speaker",desc:"Waterproof speaker, powerbank, wireless Bluetooth, 20 hour battery",category:"audio",reg:179.99,sale:99.99,cond:"excellent",rating:4.8,reviews:7421,img:""},
  {sku:"6505163",name:"Sonos Arc Soundbar with Dolby Atmos",desc:"Premium smart soundbar, Dolby Atmos, Wi-Fi, voice control",category:"audio",reg:899.99,sale:599.99,cond:"certified",rating:4.7,reviews:2743,img:""},
  {sku:"6534017",name:"Jabra Elite 10 True Wireless Earbuds",desc:"Dolby Atmos, ANC, Bluetooth multipoint, 36 hour battery with case",category:"audio",reg:249.99,sale:139.99,cond:"excellent",rating:4.4,reviews:527,img:""},
  {sku:"6519118",name:"Sennheiser Momentum 4 Wireless Over-Ear Headphones",desc:"Adaptive noise canceling, Bluetooth, audiophile sound, 60 hour battery",category:"audio",reg:379.99,sale:229.99,cond:"excellent",rating:4.6,reviews:941,img:""},

  {sku:"6534892",name:"LG 27\" UltraGear OLED 240Hz Gaming Monitor",desc:"0.03ms response, G-Sync compatible, WQHD, DisplayHDR 400",category:"computers",reg:999.99,sale:599.99,cond:"excellent",rating:4.7,reviews:743,img:""},
  {sku:"6544510",name:"Apple iMac 24\" M3 8GB/256GB All-in-One",desc:"M3 chip, 8GB memory, 256GB SSD, 4.5K Retina display",category:"computers",reg:1299.99,sale:949.99,cond:"excellent",rating:4.8,reviews:319,img:""},
  {sku:"6539006",name:"Dell Inspiron 27\" All-in-One i7 16GB/1TB",desc:"Intel Core i7, 16GB RAM, 1TB SSD, 27-inch display, pop-up camera",category:"computers",reg:1199.99,sale:749.99,cond:"certified",rating:4.5,reviews:431,img:""},
  {sku:"6521121",name:"HP Envy Desktop i7 16GB/1TB SSD",desc:"Intel Core i7, 16GB memory, 1TB SSD, Wi-Fi 6, Windows 11",category:"computers",reg:1099.99,sale:649.99,cond:"good",rating:4.4,reviews:288,img:""},
  {sku:"6514417",name:"Samsung Odyssey G9 49\" OLED Gaming Monitor",desc:"OLED, 240Hz, 0.03ms, DisplayHDR True Black, ultrawide",category:"computers",reg:1799.99,sale:1099.99,cond:"excellent",rating:4.6,reviews:524,img:""},
  {sku:"6542015",name:"Lenovo Legion Tower 5i i7 16GB/1TB RTX 4070",desc:"Intel Core i7, 16GB RAM, 1TB SSD, NVIDIA RTX 4070 desktop",category:"computers",reg:1699.99,sale:1099.99,cond:"certified",rating:4.6,reviews:361,img:""},
  {sku:"6532199",name:"Asus ZenScreen 15.6\" Portable Monitor",desc:"Full HD IPS portable monitor, USB-C, smart cover, lightweight",category:"computers",reg:249.99,sale:129.99,cond:"satisfactory",rating:4.3,reviews:641,img:""},
  {sku:"6540894",name:"Acer Predator 32\" 4K Mini LED Gaming Monitor",desc:"4K UHD, Mini LED, 144Hz, HDMI 2.1, HDR1000",category:"computers",reg:1299.99,sale:799.99,cond:"excellent",rating:4.5,reviews:196,img:""},
];
// Add the same calculated fields the live API mapper creates.
DEMO_ITEMS.forEach(d => {
  d.img = d.img || bestBuyProductImage(IMAGE_SKU_OVERRIDES[d.sku] || d.sku);
  d.savings = +(d.reg - d.sale).toFixed(2);
  d.pct = Math.round(d.savings / d.reg * 100);
  const dept = DEPTS.find(x => x.id === d.category);
  d.specs = dept ? dept.parseSpec(d.name, d.desc) : [];
  d.brand = dept ? dept.brandFromName(d.name) : "";
  d.url = `https://www.bestbuy.com/site/${d.sku}.p?skuId=${d.sku}`;
});
