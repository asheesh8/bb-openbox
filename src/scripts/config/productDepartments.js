// Department setup controls tabs, category IDs, filters, and spec parsing.
export const DEPTS = [
  {
    id: "laptops", label: "Laptops", icon: "💻",
    cats: ["abcat0204000"],
    filters: [
      { id: "brand", label: "Brand", type: "pills", opts: ["All","Apple","Dell","HP","Lenovo","Samsung","Microsoft","Asus","Acer"] },
      { id: "ram", label: "RAM", type: "pills", opts: ["All","8GB","16GB","32GB","64GB"] },
      { id: "storage", label: "Storage", type: "pills", opts: ["All","256GB","512GB","1TB","2TB"] },
    ],
    parseSpec: (name, desc) => {
      const specs = [];
      const txt = (name + " " + desc).toLowerCase();
      // RAM
      const ram = txt.match(/(\d+)\s*gb\s*(ram|memory|unified)/);
      if (ram) specs.push(ram[1] + "GB RAM");
      // Storage
      const ssd = txt.match(/(\d+)\s*(gb|tb)\s*(ssd|storage|flash|emmc|nvme)/);
      if (ssd) specs.push(ssd[1] + ssd[2].toUpperCase() + " SSD");
      // Processor
      const m = txt.match(/m[1-4]\s*(pro|max|ultra)?/);
      const i = txt.match(/core\s*i[3579][-\s]?[\w]*/);
      const r = txt.match(/ryzen\s*[379]\s*[\d]*/i);
      if (m) specs.push(m[0].toUpperCase().trim());
      else if (i) specs.push(i[0].replace(/core /i,"").trim().toUpperCase());
      else if (r) specs.push(r[0].trim());
      // Display
      const disp = name.match(/(\d+\.?\d*)["\s]*(?:inch|")/i);
      if (disp) specs.push(disp[1] + '"');
      return specs.slice(0, 4);
    },
    brandFromName: (name) => {
      const b = ["Apple","Dell","HP","Lenovo","Samsung","Microsoft","Asus","Acer","LG","Razer"];
      return b.find(x => name.toLowerCase().includes(x.toLowerCase())) || "";
    }
  },
  {
    id: "tvs", label: "TVs", icon: "📺",
    cats: ["abcat0101001"],
    filters: [
      { id: "brand", label: "Brand", type: "pills", opts: ["All","Samsung","LG","Sony","TCL","Hisense","Vizio","Insignia"] },
      { id: "size", label: "Size", type: "pills", opts: ["All","Under 50\"","50–65\"","65–75\"","75\"+"] },
      { id: "type", label: "Type", type: "pills", opts: ["All","OLED","QLED","LED","Mini LED"] },
    ],
    parseSpec: (name, desc) => {
      const specs = [];
      const sizeMatch = name.match(/(\d{2,3})[\s"']*(?:class|inch|")/i) || name.match(/(\d{2,3})"/i);
      if (sizeMatch) specs.push(sizeMatch[1] + '"');
      if (/oled/i.test(name+desc)) specs.push("OLED");
      else if (/qled|neo qled/i.test(name+desc)) specs.push("QLED");
      else if (/mini.?led/i.test(name+desc)) specs.push("Mini LED");
      if (/4k|uhd/i.test(name+desc)) specs.push("4K");
      if (/8k/i.test(name+desc)) specs.push("8K");
      if (/120hz|144hz|240hz/i.test(name+desc)) { const hz = (name+desc).match(/(\d{3})hz/i); if(hz) specs.push(hz[1]+"Hz"); }
      return specs.slice(0,4);
    },
    brandFromName: (name) => {
      const b = ["Samsung","LG","Sony","TCL","Hisense","Vizio","Insignia","Philips"];
      return b.find(x => name.toLowerCase().includes(x.toLowerCase())) || "";
    }
  },
  {
    id: "phones", label: "Phones", icon: "📱",
    cats: ["abcat0208012"],
    filters: [
      { id: "brand", label: "Brand", type: "pills", opts: ["All","Apple","Samsung","Google","Motorola","OnePlus"] },
      { id: "storage", label: "Storage", type: "pills", opts: ["All","128GB","256GB","512GB","1TB"] },
    ],
    parseSpec: (name, desc) => {
      const specs = [];
      const stor = name.match(/(\d+)\s*GB/i);
      if (stor) specs.push(stor[1] + "GB");
      if (/pro max/i.test(name)) specs.push("Pro Max");
      else if (/pro/i.test(name)) specs.push("Pro");
      else if (/ultra/i.test(name)) specs.push("Ultra");
      else if (/plus/i.test(name)) specs.push("Plus");
      const ver = name.match(/(?:iphone|galaxy s|pixel)\s*([\d]+)/i);
      if (ver) specs.push(ver[0].trim());
      return specs.slice(0,4);
    },
    brandFromName: (name) => {
      const b = ["Apple","Samsung","Google","Motorola","OnePlus","Nothing"];
      return b.find(x => name.toLowerCase().includes(x.toLowerCase())) || "";
    }
  },
  {
    id: "tablets", label: "Tablets", icon: "🖥️",
    cats: ["abcat0208000"],
    filters: [
      { id: "brand", label: "Brand", type: "pills", opts: ["All","Apple","Samsung","Microsoft","Lenovo","Amazon"] },
      { id: "storage", label: "Storage", type: "pills", opts: ["All","64GB","128GB","256GB","512GB"] },
    ],
    parseSpec: (name, desc) => {
      const specs = [];
      const stor = name.match(/(\d+)\s*GB/i);
      if (stor) specs.push(stor[1] + "GB");
      if (/m[1-4]/i.test(name)) { const m = name.match(/m[1-4]\s*(pro|max)?/i); if(m) specs.push(m[0].toUpperCase()); }
      const disp = name.match(/(\d+\.?\d*)["\s]*(?:inch|")/i);
      if (disp) specs.push(disp[1] + '"');
      if (/wi-?fi/i.test(name)) specs.push("Wi-Fi");
      if (/cellular|5g|lte/i.test(name)) specs.push("5G");
      return specs.slice(0,4);
    },
    brandFromName: (name) => {
      const b = ["Apple","Samsung","Microsoft","Lenovo","Amazon"];
      return b.find(x => name.toLowerCase().includes(x.toLowerCase())) || "";
    }
  },
  {
    id: "appliances", label: "Appliances", icon: "🏠",
    cats: ["abcat0401000","abcat0902000","abcat0401800"],
    filters: [
      { id: "brand", label: "Brand", type: "pills", opts: ["All","Samsung","LG","Whirlpool","GE","Bosch","Maytag","KitchenAid"] },
      { id: "type", label: "Type", type: "pills", opts: ["All","Refrigerators","Washers","Dryers","Dishwashers","Ranges"] },
    ],
    parseSpec: (name, desc) => {
      const specs = [];
      const cu = name.match(/(\d+\.?\d*)\s*cu\.?\s*ft/i);
      if (cu) specs.push(cu[1] + " cu.ft");
      if (/french door/i.test(name)) specs.push("French Door");
      else if (/side.by.side/i.test(name)) specs.push("Side-by-Side");
      else if (/bottom freezer/i.test(name)) specs.push("Bottom Freezer");
      if (/stainless/i.test(name+desc)) specs.push("Stainless");
      if (/smart|wifi/i.test(name+desc)) specs.push("Smart");
      return specs.slice(0,4);
    },
    brandFromName: (name) => {
      const b = ["Samsung","LG","Whirlpool","GE","Bosch","Maytag","KitchenAid","Frigidaire","Electrolux"];
      return b.find(x => name.toLowerCase().includes(x.toLowerCase())) || "";
    }
  },
  {
    id: "audio", label: "Audio", icon: "🎧",
    cats: ["abcat0507002","abcat0500000"],
    filters: [
      { id: "brand", label: "Brand", type: "pills", opts: ["All","Sony","Bose","Apple","Samsung","JBL","Sennheiser","Jabra","Sonos"] },
      { id: "type", label: "Type", type: "pills", opts: ["All","Over-Ear","In-Ear","Earbuds","Soundbar","Speaker"] },
    ],
    parseSpec: (name, desc) => {
      const specs = [];
      if (/noise.canceling|anc/i.test(name+desc)) specs.push("ANC");
      if (/wireless|bluetooth/i.test(name+desc)) specs.push("Wireless");
      const hrs = (name+desc).match(/(\d+).?hr|(\d+).?hour/i);
      if (hrs) specs.push((hrs[1]||hrs[2]) + "hr battery");
      if (/true wireless|tws/i.test(name+desc)) specs.push("True Wireless");
      return specs.slice(0,4);
    },
    brandFromName: (name) => {
      const b = ["Sony","Bose","Apple","Samsung","JBL","Sennheiser","Jabra","Sonos","Beats","Skullcandy"];
      return b.find(x => name.toLowerCase().includes(x.toLowerCase())) || "";
    }
  },
  {
    id: "computers", label: "Computers", icon: "🖱️",
    cats: ["abcat0200000"],
    filters: [
      { id: "brand", label: "Brand", type: "pills", opts: ["All","Apple","Dell","HP","Lenovo","Asus","Acer","LG","Samsung"] },
      { id: "type", label: "Type", type: "pills", opts: ["All","Desktop","Monitor","All-in-One"] },
    ],
    parseSpec: (name, desc) => {
      const specs = [];
      const txt = (name+desc).toLowerCase();
      const ram = txt.match(/(\d+)\s*gb\s*(ram|memory)/);
      if (ram) specs.push(ram[1]+"GB RAM");
      const stor = txt.match(/(\d+)\s*(gb|tb)\s*(ssd|hdd|storage)/);
      if (stor) specs.push(stor[1]+stor[2].toUpperCase());
      const cpu = txt.match(/i[3579][-\s]?\d{4,5}/);
      if (cpu) specs.push(cpu[0].toUpperCase());
      const disp = name.match(/(\d+\.?\d*)["\s]*(?:inch|")/i);
      if (disp) specs.push(disp[1]+'"');
      return specs.slice(0,4);
    },
    brandFromName: (name) => {
      const b = ["Apple","Dell","HP","Lenovo","Asus","Acer","Microsoft","LG","Samsung"];
      return b.find(x => name.toLowerCase().includes(x.toLowerCase())) || "";
    }
  },
];
