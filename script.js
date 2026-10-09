// ============================================================
// 🌱 ECO ROUTE
// JR京都線・琵琶湖線対応版 (ステップ1: JR表示の整理)
// ============================================================

const map = L.map("map").setView([35.0116, 135.7681], 13);

L.maplibreGL({
  style: "https://tiles.openfreemap.org/styles/liberty"
}).addTo(map);

map.attributionControl.addAttribution(
  'OpenFreeMap © OpenMapTiles Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
);

let routeLines = [];
let mapMarkers = [];


// ============================================================
// 🧹 地図クリア
// ============================================================

function clearMapLayers() {

  routeLines.forEach(layer => {
    map.removeLayer(layer);
  });

  mapMarkers.forEach(marker => {
    map.removeLayer(marker);
  });

  routeLines = [];
  mapMarkers = [];
}


// ============================================================
// 📍 マーカー
// ============================================================

function addMarker(point, text) {

  const marker = L.marker([point.lat, point.lon])
    .addTo(map)
    .bindPopup(text);

  mapMarkers.push(marker);

  return marker;
}


// ============================================================
// 🚇 地下鉄CSV
// ============================================================

const trainFiles = {
  karasumaWeekdayUp: "karasuma-weekday-up.csv",
  karasumaWeekdayDown: "karasuma-weekday-down.csv",
  karasumaHolidayUp: "karasuma-holiday-up.csv",
  karasumaHolidayDown: "karasuma-holiday-down.csv",

  tozaiWeekdayUp: "tozai-weekday-up.csv",
  tozaiWeekdayDown: "tozai-weekday-down.csv",
  tozaiHolidayUp: "tozai-holiday-up.csv",
  tozaiHolidayDown: "tozai-holiday-down.csv"
};

let trainData = {};


// ============================================================
// 🚇 地下鉄駅
// ============================================================

const karasumaStations = [
  "国際会館",
  "松ヶ崎",
  "北山",
  "北大路",
  "鞍馬口",
  "今出川",
  "丸太町",
  "烏丸御池",
  "四条",
  "五条",
  "京都",
  "九条",
  "十条",
  "くいな橋",
  "竹田"
];

const tozaiStations = [
  "六地蔵",
  "石田",
  "醍醐",
  "小野",
  "椥辻",
  "東野",
  "山科",
  "御陵",
  "蹴上",
  "東山",
  "三条京阪",
  "京都市役所前",
  "烏丸御池",
  "二条城前",
  "二条",
  "西大路御池",
  "太秦天神川"
];

const karasumaDistances = [
  1.0, 1.1, 1.2, 1.0, 0.9,
  1.2, 1.0, 0.9, 1.0, 1.0,
  0.9, 1.0, 1.0, 1.0
];

const tozaiDistances = [
  1.1, 1.2, 1.3, 1.3, 1.2,
  1.0, 1.1, 1.3, 1.0, 1.0,
  1.1, 1.1, 1.0, 1.0, 1.1,
  1.5
];

const TRAIN_CO2_PER_KM = 20;


// ============================================================
// 🚇 地下鉄駅座標
// ============================================================

const stationCoords = {

  "国際会館": [35.0627, 135.7850],
  "松ヶ崎": [35.0503, 135.7735],
  "北山": [35.0438, 135.7688],
  "北大路": [35.0422, 135.7594],
  "鞍馬口": [35.0340, 135.7598],
  "今出川": [35.0294, 135.7580],
  "丸太町": [35.0169, 135.7593],
  "烏丸御池": [35.0095, 135.7590],
  "四条": [35.0038, 135.7590],
  "五条": [34.9954, 135.7594],
  "京都": [34.9858, 135.7588],
  "九条": [34.9786, 135.7589],
  "十条": [34.9732, 135.7580],
  "くいな橋": [34.9619, 135.7595],
  "竹田": [34.9480, 135.7577],

  "六地蔵": [34.9326, 135.7998],
  "石田": [34.9503, 135.8003],
  "醍醐": [34.9516, 135.8102],
  "小野": [34.9632, 135.8204],
  "椥辻": [34.9722, 135.8177],
  "東野": [34.9837, 135.8165],
  "山科": [34.9925, 135.8170],
  "御陵": [35.0008, 135.7948],
  "蹴上": [35.0097, 135.7904],
  "東山": [35.0099, 135.7820],
  "三条京阪": [35.0098, 135.7735],
  "京都市役所前": [35.0113, 135.7680],
  "二条城前": [35.0115, 135.7488],
  "二条": [35.0101, 135.7410],
  "西大路御池": [35.0096, 135.7335],
  "太秦天神川": [35.0100, 135.7155]

};


// ============================================================
// 🚃 JR京都線・琵琶湖線
// ============================================================

const jrStations = [

  { name: "東淀川",   line: "JR京都線", lat: 34.7392, lon: 135.5027 },
  { name: "吹田",     line: "JR京都線", lat: 34.7630, lon: 135.5181 },
  { name: "岸辺",     line: "JR京都線", lat: 34.7758, lon: 135.5415 },
  { name: "千里丘",   line: "JR京都線", lat: 34.7900, lon: 135.5515 },
  { name: "茨木",     line: "JR京都線", lat: 34.8162, lon: 135.5621 },
  { name: "JR総持寺", line: "JR京都線", lat: 34.8270, lon: 135.5870 },
  { name: "摂津富田", line: "JR京都線", lat: 34.8372, lon: 135.5938 },
  { name: "高槻",     line: "JR京都線", lat: 34.8510, lon: 135.6177 },
  { name: "島本",     line: "JR京都線", lat: 34.8800, lon: 135.6625 },
  { name: "山崎",     line: "JR京都線", lat: 34.8920, lon: 135.6715 },
  { name: "長岡京",   line: "JR京都線", lat: 34.9247, lon: 135.6965 },
  { name: "向日町",   line: "JR京都線", lat: 34.9510, lon: 135.7100 },
  { name: "桂川",     line: "JR京都線", lat: 34.9645, lon: 135.7107 },
  { name: "西大路",   line: "JR京都線", lat: 34.9802, lon: 135.7310 },
  { name: "京都",     line: "JR京都線", lat: 34.9858, lon: 135.7588 },

  { name: "山科",     line: "琵琶湖線", lat: 34.9925, lon: 135.8170 },
  { name: "大津",     line: "琵琶湖線", lat: 35.0037, lon: 135.8646 },
  { name: "膳所",     line: "琵琶湖線", lat: 34.9978, lon: 135.8788 },
  { name: "石山",     line: "琵琶湖線", lat: 34.9797, lon: 135.9002 },
  { name: "瀬田",     line: "琵琶湖線", lat: 34.9870, lon: 135.9240 },
  { name: "南草津",   line: "琵琶湖線", lat: 35.0038, lon: 135.9470 },
  { name: "草津",     line: "琵琶湖線", lat: 35.0225, lon: 135.9615 },
  { name: "守山",     line: "琵琶湖線", lat: 35.0580, lon: 135.9900 },
  { name: "野洲",     line: "琵琶湖線", lat: 35.0678, lon: 136.0235 }

];


// ============================================================
// 📏 距離
// ============================================================

function haversineDistance(a, b) {

  const R = 6371000;

  const p1 = a.lat * Math.PI / 180;
  const p2 = b.lat * Math.PI / 180;

  const dp = (b.lat - a.lat) * Math.PI / 180;
  const dl = (b.lon - a.lon) * Math.PI / 180;

  const x =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) *
    Math.cos(p2) *
    Math.sin(dl / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}


// ============================================================
// 🚇 最寄り地下鉄
// ============================================================

function findNearestStation(point) {

  const allStations = [
    ...new Set([
      ...karasumaStations,
      ...tozaiStations
    ])
  ];

  let best = null;

  for (const name of allStations) {

    const c = stationCoords[name];

    if (!c) continue;

    const station = {
      lat: c[0],
      lon: c[1]
    };

    const distance = haversineDistance(point, station);

    if (!best || distance < best.distance) {

      best = {
        name,
        point: station,
        distance
      };

    }

  }

  return best;
}


// ============================================================
// 🚃 最寄りJR駅
// ============================================================

function findNearestJRStation(point) {

  let best = null;

  for (const station of jrStations) {

    const p = {
      lat: station.lat,
      lon: station.lon
    };

    const distance = haversineDistance(point, p);

    if (!best || distance < best.distance) {

      best = {
        name: station.name,
        line: station.line,
        point: p,
        distance
      };

    }

  }

  return best;
}


// ============================================================
// 📄 CSV読み込み
// ============================================================

async function loadCSV(filename) {

  const response = await fetch(filename, {
    cache: "no-store"
  });

  if (!response.ok) {

    throw new Error(filename + " を読み込めませんでした");

  }

  return parseCSV(await response.text());
}


function parseCSV(text) {

  text = text.replace(/^\uFEFF/, "");

  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {

    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {

      if (insideQuotes && next === '"') {

        cell += '"';
        i++;

      } else {

        insideQuotes = !insideQuotes;

      }

      continue;
    }

    if (ch === "," && !insideQuotes) {

      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !insideQuotes) {

      if (ch === "\r" && next === "\n") {

        i++;
      }

      row.push(cell);
      rows.push(row);

      row = [];
      cell = "";

      continue;
    }

    cell += ch;
  }

  if (cell !== "" || row.length > 0) {

    row.push(cell);
    rows.push(row);

  }

  return rows;
}


// ============================================================
// 🚇 地下鉄データ読み込み
// ============================================================

async function loadAllTrainData() {

  const status = document.getElementById("train-status");

  try {

    for (const [name, file] of Object.entries(trainFiles)) {

      trainData[name] = await loadCSV(file);

    }

    if (status) {

      status.textContent = "✓ 地下鉄時刻表8件を読み込みました";
      status.style.color = "#388e3c";

    }

  } catch (error) {

    console.error(error);

    if (status) {

      status.textContent = "⚠ 地下鉄データの読み込みに失敗しました";
      status.style.color = "#d32f2f";

    }

  }
}

loadAllTrainData();


// ============================================================
// 📍 住所検索
// ============================================================

let lastGeocodeTime = 0;

const geocodeCache = new Map();


function sleep(ms) {

  return new Promise(resolve => setTimeout(resolve, ms));
}


async function geocode(place) {

  const key = place.trim();

  if (geocodeCache.has(key)) {

    return geocodeCache.get(key);

  }

  const wait = Math.max(
    0,
    1100 - (Date.now() - lastGeocodeTime)
  );

  if (wait > 0) {
    await sleep(wait);
  }

  lastGeocodeTime = Date.now();

  const url =
    "https://nominatim.openstreetmap.org/search" +
    "?format=jsonv2" +
    "&limit=1" +
    "&accept-language=ja" +
    "&q=" +
    encodeURIComponent(key);

  const response = await fetch(url);

  if (!response.ok) {

    throw new Error("住所検索に失敗しました");

  }

  const data = await response.json();

  if (!data.length) {

    throw new Error(key + " が見つかりませんでした");

  }

  const result = {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };

  geocodeCache.set(key, result);

  return result;
}


// ============================================================
// 🚗 OSRM
// ============================================================

async function getRoute(start, end, profile) {

  const url =
    "https://router.project-osrm.org/route/v1/" +
    profile +
    "/" +
    `${start.lon},${start.lat};${end.lon},${end.lat}` +
    "?overview=full&geometries=geojson";

  const response = await fetch(url);

  if (!response.ok) {

    throw new Error("ルート取得に失敗しました");

  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {

    throw new Error("ルートが見つかりませんでした");

  }

  return data.routes[0];
}


// ============================================================
// ⏱️ 表示
// ============================================================

function formatDistance(meters) {

  if (meters < 1000) {

    return Math.round(meters) + " m";

  }

  return (meters / 1000).toFixed(1) + " km";
}


function formatTime(minutes) {

  minutes = Math.max(0, Math.round(minutes));

  if (minutes < 60) {

    return minutes + "分";

  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return hours + "時間" + (mins > 0 ? mins + "分" : "");
}


// ============================================================
// 🚇 地下鉄時刻
// ============================================================

function getCurrentMinutes() {

  const now = new Date();

  let minutes = now.getHours() * 60 + now.getMinutes();

  if (now.getHours() < 3) {

    minutes += 1440;

  }

  return minutes;
}


function parseTime(value) {

  if (value === null || value === undefined) {

    return null;

  }

  const match = String(value)
    .trim()
    .match(/(\d{1,2})[:：](\d{2})/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);

  const minute = Number(match[2]);

  if (hour < 3) {
    hour += 24;
  }

  return hour * 60 + minute;
}


function minutesToTime(minutes) {

  if (minutes === null || minutes === undefined) {

    return "--:--";

  }

  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;

  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0")
  );
}


// ============================================================
// 🚇 地下鉄CSV検索
// ============================================================

function findHeaderRow(rows, fromStation, toStation) {

  for (let i = 0; i < Math.min(rows.length, 15); i++) {

    const row = rows[i];

    if (row.includes(fromStation) && row.includes(toStation)) {

      return i;

    }

  }

  return -1;
}


function findNextDirectTrain(rows, fromStation, toStation, afterMinutes) {

  const headerIndex = findHeaderRow(rows, fromStation, toStation);

  if (headerIndex < 0) {
    return null;
  }

  const header = rows[headerIndex];

  const fromIndex = header.indexOf(fromStation);
  const toIndex = header.indexOf(toStation);

  if (fromIndex < 0 || toIndex < 0) {

    return null;

  }

  let best = null;

  for (let i = headerIndex + 1; i < rows.length; i++) {

    const row = rows[i];

    const depart = parseTime(row[fromIndex]);
    const arrive = parseTime(row[toIndex]);

    if (depart === null || arrive === null) {

      continue;

    }

    if (depart < afterMinutes) {

      continue;

    }

    if (arrive < depart) {

      continue;

    }

    if (!best || depart < best.depart) {

      best = {
        depart,
        arrive
      };

    }

  }

  return best;
}


function searchLineTrain(line, fromStation, toStation, afterMinutes) {

  const day = new Date().getDay();

  const holiday = day === 0 || day === 6;

  let up;
  let down;

  if (line === "karasuma") {

    if (holiday) {

      up = trainData.karasumaHolidayUp;
      down = trainData.karasumaHolidayDown;

    } else {

      up = trainData.karasumaWeekdayUp;
      down = trainData.karasumaWeekdayDown;

    }

  } else {

    if (holiday) {

      up = trainData.tozaiHolidayUp;
      down = trainData.tozaiHolidayDown;

    } else {

      up = trainData.tozaiWeekdayUp;
      down = trainData.tozaiWeekdayDown;

    }

  }

  const candidates = [];

  if (up) {

    const result = findNextDirectTrain(up, fromStation, toStation, afterMinutes);

    if (result) {

      result.line = line;
      candidates.push(result);

    }

  }

  if (down) {

    const result = findNextDirectTrain(down, fromStation, toStation, afterMinutes);

    if (result) {

      result.line = line;
      candidates.push(result);

    }

  }

  candidates.sort((a, b) => a.depart - b.depart);

  return candidates[0] || null;
}


// ============================================================
// 🚇 地下鉄距離
// ============================================================

function getRailDistance(line, fromStation, toStation) {

  const stations =
    line === "karasuma"
      ? karasumaStations
      : tozaiStations;

  const distances =
    line === "karasuma"
      ? karasumaDistances
      : tozaiDistances;

  const from = stations.indexOf(fromStation);
  const to = stations.indexOf(toStation);

  if (from < 0 || to < 0) {

    return 0;

  }

  let total = 0;

  const start = Math.min(from, to);
  const end = Math.max(from, to);

  for (let i = start; i < end; i++) {

    total += distances[i] || 0;

  }

  return total;
}


// ============================================================
// 🚇 地下鉄ルート
// ============================================================

function findTrainRoute(fromStation, toStation, afterMinutes) {

  if (fromStation === toStation) {

    return {
      type: "same",
      totalMinutes: 0,
      distanceKm: 0
    };

  }

  const fromK = karasumaStations.includes(fromStation);
  const toK = karasumaStations.includes(toStation);

  const fromT = tozaiStations.includes(fromStation);
  const toT = tozaiStations.includes(toStation);

  if (fromK && toK) {

    const train = searchLineTrain(
      "karasuma",
      fromStation,
      toStation,
      afterMinutes
    );

    if (train) {

      return {
        type: "direct",
        train,
        totalMinutes: train.arrive - train.depart,
        distanceKm: getRailDistance("karasuma", fromStation, toStation)
      };

    }

  }

  if (fromT && toT) {

    const train = searchLineTrain(
      "tozai",
      fromStation,
      toStation,
      afterMinutes
    );

    if (train) {

      return {
        type: "direct",
        train,
        totalMinutes: train.arrive - train.depart,
        distanceKm: getRailDistance("tozai", fromStation, toStation)
      };

    }

  }

  if ((fromK && toT) || (fromT && toK)) {

    const firstLine = fromK ? "karasuma" : "tozai";
    const secondLine = fromK ? "tozai" : "karasuma";

    const first = searchLineTrain(
      firstLine,
      fromStation,
      "烏丸御池",
      afterMinutes
    );

    if (!first) {
      return null;
    }

    const second = searchLineTrain(
      secondLine,
      "烏丸御池",
      toStation,
      first.arrive + 4
    );

    if (!second) {
      return null;
    }

    return {
      type: "transfer",
      first,
      second,
      totalMinutes: second.arrive - first.depart,
      distanceKm:
        getRailDistance(firstLine, fromStation, "烏丸御池") +
        getRailDistance(secondLine, "烏丸御池", toStation)
    };

  }

  return null;
}


// ============================================================
// 🚇 地下鉄カード
// ============================================================

function displaySubwayResult(result, walkToMinutes, walkFromMinutes) {

  const line = document.getElementById("train-line");
  const time = document.getElementById("train-time");
  const distance = document.getElementById("train-distance");
  const co2 = document.getElementById("train-co2");
  const status = document.getElementById("train-status");

  if (!result) {

    line.textContent = "--";
    time.textContent = "--";
    distance.textContent = "--";
    co2.textContent = "--";

    status.textContent = "利用できる地下鉄ルートがありません";

    return;

  }

  const total =
    result.totalMinutes +
    walkToMinutes +
    walkFromMinutes;

  const emission = result.distanceKm * TRAIN_CO2_PER_KM;

  line.textContent =
    result.type === "transfer"
      ? "乗換1回"
      : "地下鉄";

  time.textContent = formatTime(total);

  distance.textContent = result.distanceKm.toFixed(1) + " km";

  co2.textContent = Math.round(emission) + " g";

  status.textContent = "🚇 京都市営地下鉄";

  status.style.color = "#388e3c";

  return emission;
}


// ============================================================
// 🚃 JRカードのリセット
// (検索のたびに、前回のJRの結果が残らないようにする)
// ============================================================

function resetJRCard(message) {

  ["jr-line", "jr-time", "jr-distance", "jr-co2"].forEach(id => {

    const el = document.getElementById(id);

    if (el) {
      el.textContent = "--";
    }

  });

  const status = document.getElementById("jr-status");

  if (status) {

    status.textContent = message;
    status.style.color = "";

  }
}


// ============================================================
// 🚃 JRルート計算
// ============================================================

function calculateJRDistance(fromName, toName) {

  const fromIndex = jrStations.findIndex(s => s.name === fromName);
  const toIndex = jrStations.findIndex(s => s.name === toName);

  if (fromIndex < 0 || toIndex < 0) {

    return null;

  }

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);

  let total = 0;

  for (let i = start; i < end; i++) {

    const a = jrStations[i];
    const b = jrStations[i + 1];

    total +=
      haversineDistance(
        { lat: a.lat, lon: a.lon },
        { lat: b.lat, lon: b.lon }
      ) / 1000;

  }

  return total;
}


// ============================================================
// 🚃 JR所要時間
// ============================================================

function estimateJRMinutes(distanceKm) {

  if (distanceKm === null) {

    return null;

  }

  // JRの駅間走行を概算
  return Math.max(5, distanceKm / 55 * 60);

}


// ============================================================
// 🚃 JR表示
// ============================================================

function displayJRResult(startJR, endJR, start, end) {

  const line = document.getElementById("jr-line");
  const time = document.getElementById("jr-time");
  const distance = document.getElementById("jr-distance");
  const co2 = document.getElementById("jr-co2");
  const status = document.getElementById("jr-status");

  if (!startJR || !endJR) {

    return null;

  }

  const distanceKm = calculateJRDistance(startJR.name, endJR.name);

  if (distanceKm === null) {

    return null;

  }

  const trainMinutes = estimateJRMinutes(distanceKm);

  const walkTo = startJR.distance / 1000 / 4.5 * 60;
  const walkFrom = endJR.distance / 1000 / 4.5 * 60;

  const totalMinutes = trainMinutes + walkTo + walkFrom;

  const emission = distanceKm * TRAIN_CO2_PER_KM;

  let routeName = startJR.name + " → " + endJR.name;

  if (
    (startJR.name === "野洲" && endJR.name !== "野洲") ||
    (endJR.name === "野洲" && startJR.name !== "野洲")
  ) {

    routeName += "（琵琶湖線）";

  } else {

    routeName += "（JR京都線・琵琶湖線）";

  }

  line.textContent = routeName;

  time.textContent = formatTime(totalMinutes);

  distance.textContent = distanceKm.toFixed(1) + " km";

  co2.textContent = Math.round(emission) + " g";

  status.textContent = "🚃 JR駅間の距離から所要時間を推定";

  status.style.color = "#1565c0";

  return {
    time: totalMinutes,
    distance: distanceKm,
    co2: emission
  };
}


// ============================================================
// 🌱 ECOスコア
// ============================================================

function calculateEcoScore(co2) {

  if (!Number.isFinite(co2)) {

    return 0;

  }

  if (co2 <= 0) {
    return 100;
  }

  return Math.max(
    0,
    Math.round(100 - (co2 / 2000 * 100))
  );
}


// ============================================================
// 🌱 ECO表示 (地下鉄とJRを別々に表示)
// ============================================================

function updateEcoDashboard(
  walkCo2,
  bikeCo2,
  carCo2,
  subwayCo2,
  jrCo2
) {

  const hasValue = v =>
    v !== null &&
    v !== undefined &&
    Number.isFinite(v);

  const scoreOf = co2 =>
    hasValue(co2)
      ? calculateEcoScore(co2)
      : null;

  const items = [
    { id: "walk-score",  name: "徒歩",   score: scoreOf(walkCo2) },
    { id: "bike-score",  name: "自転車", score: scoreOf(bikeCo2) },
    { id: "car-score",   name: "車",     score: scoreOf(carCo2) },
    { id: "train-score", name: "地下鉄", score: scoreOf(subwayCo2) },
    { id: "jr-score",    name: "JR",     score: scoreOf(jrCo2) }
  ];

  items.forEach(item => {

    const el = document.getElementById(item.id);

    if (el) {

      el.textContent =
        item.score === null
          ? "--"
          : item.score + "点";

    }

  });

  const message = document.getElementById("eco-message");

  if (!message) {
    return;
  }

  // 車は「おすすめ」の候補に入れず、徒歩・自転車・鉄道から選ぶ
  const options = items
    .filter(item => item.id !== "car-score" && item.score !== null)
    .sort((a, b) => b.score - a.score);

  if (!options.length) {
    return;
  }

  message.textContent =
    "🌱 CO₂排出量を基準にすると " +
    options[0].name +
    " が最もエコです";

}


// ============================================================
// 🌱 初期化
// ============================================================

function resetEcoDashboard() {

  [
    "walk-score",
    "bike-score",
    "car-score",
    "train-score",
    "jr-score"
  ].forEach(id => {

    const el = document.getElementById(id);

    if (el) {
      el.textContent = "--";
    }

  });

  const message = document.getElementById("eco-message");

  if (message) {

    message.textContent = "ルートを検索するとエコ度を表示します";

  }
}


// ============================================================
// 🔎 メイン検索
// ============================================================

async function searchRoute() {

  const button = document.getElementById("searchButton");

  const startText = document.getElementById("start").value.trim();
  const endText = document.getElementById("end").value.trim();

  if (!startText || !endText) {

    alert("出発地と目的地を入力してください");

    return;

  }

  button.disabled = true;
  button.textContent = "検索中…";

  resetEcoDashboard();


  try {

    // ========================================================
    // 📍 場所
    // ========================================================

    const start = await geocode(startText);
    const end = await geocode(endText);

    clearMapLayers();

    addMarker(start, "📍 出発地：" + startText);
    addMarker(end, "🎯 目的地：" + endText);


    // ========================================================
    // 🚶🚲🚗
    // ========================================================

    const [walk, bike, car] = await Promise.all([
      getRoute(start, end, "walking"),
      getRoute(start, end, "cycling"),
      getRoute(start, end, "driving")
    ]);

    const walkLine = L.geoJSON(walk.geometry).addTo(map);

    routeLines.push(walkLine);

    // 距離
    document.getElementById("walk-distance").textContent =
      formatDistance(walk.distance);

    document.getElementById("bike-distance").textContent =
      formatDistance(bike.distance);

    document.getElementById("car-distance").textContent =
      formatDistance(car.distance);

    // 時間
    const walkMinutes = walk.distance / 1000 / 4.5 * 60;
    const bikeMinutes = bike.distance / 1000 / 15 * 60;
    const carMinutes = car.distance / 1000 / 50 * 60;

    document.getElementById("walk-time").textContent =
      formatTime(walkMinutes);

    document.getElementById("bike-time").textContent =
      formatTime(bikeMinutes);

    document.getElementById("car-time").textContent =
      formatTime(carMinutes);

    // CO2
    const walkCo2 = 0;
    const bikeCo2 = 0;

    const carCo2 = car.distance / 1000 * 130;

    document.getElementById("car-co2").textContent =
      Math.round(carCo2) + " g";


    // ========================================================
    // 🚃 JR
    // ========================================================

    const startJR = findNearestJRStation(start);
    const endJR = findNearestJRStation(end);

    let jrResult = null;

    if (startJR && endJR && startJR.name !== endJR.name) {

      addMarker(startJR.point, "🚃 JR最寄り駅：" + startJR.name);
      addMarker(endJR.point, "🚃 JR最寄り駅：" + endJR.name);

      jrResult = displayJRResult(startJR, endJR, start, end);

      if (!jrResult) {

        resetJRCard("JRの距離を計算できませんでした");

      }

    } else {

      resetJRCard("JRで移動できる区間がありません");

    }


    // ========================================================
    // 🚇 地下鉄
    // ========================================================

    const startSubway = findNearestStation(start);
    const endSubway = findNearestStation(end);

    let subwayCo2 = null;

    // 地下鉄駅まで遠すぎる場合は、
    // 長距離移動の主役として扱わない
    const subwayUseful =
      startSubway &&
      endSubway &&
      startSubway.distance <= 3000 &&
      endSubway.distance <= 3000;

    if (subwayUseful) {

      addMarker(startSubway.point, "🚇 地下鉄：" + startSubway.name);
      addMarker(endSubway.point, "🚇 地下鉄：" + endSubway.name);

      const walkTo = startSubway.distance / 1000 / 4.5 * 60;
      const walkFrom = endSubway.distance / 1000 / 4.5 * 60;

      const subwayResult = findTrainRoute(
        startSubway.name,
        endSubway.name,
        getCurrentMinutes() + Math.round(walkTo)
      );

      if (subwayResult) {

        subwayCo2 = displaySubwayResult(subwayResult, walkTo, walkFrom);

      } else {

        displaySubwayResult(null, 0, 0);

      }

    } else {

      // 野洲→金閣寺のような場合
      // 地下鉄を無理やり主ルートにしない

      document.getElementById("train-line").textContent = "--";
      document.getElementById("train-time").textContent = "--";
      document.getElementById("train-distance").textContent = "--";
      document.getElementById("train-co2").textContent = "--";

      document.getElementById("train-status").textContent =
        "遠距離移動のため地下鉄は主ルート候補外";

    }


    // ========================================================
    // 🗺️ 地図表示範囲
    // ========================================================

    const points = [
      [start.lat, start.lon],
      [end.lat, end.lon]
    ];

    if (startJR) {

      points.push([startJR.point.lat, startJR.point.lon]);

    }

    if (endJR) {

      points.push([endJR.point.lat, endJR.point.lon]);

    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [30, 30]
    });


    // ========================================================
    // 🌱 ECO (地下鉄とJRを別々に渡す)
    // ========================================================

    updateEcoDashboard(
      walkCo2,
      bikeCo2,
      carCo2,
      subwayCo2,
      jrResult ? jrResult.co2 : null
    );


    // ========================================================
    // 🌱 おすすめ
    // ========================================================

    const recommendation = document.getElementById("eco-recommendation");

    if (recommendation) {

      recommendation.style.display = "block";

    }


  } catch (error) {

    console.error(error);

    alert(
      "ルート検索でエラーが発生しました。\n" +
      error.message
    );

  } finally {

    button.disabled = false;
    button.textContent = "ルート検索";

  }

}


// ============================================================
// ⌨️ Enter
// ============================================================

["start", "end"].forEach(id => {

  const input = document.getElementById(id);

  if (!input) return;

  input.addEventListener("keydown", event => {

    if (event.key === "Enter") {

      searchRoute();

    }

  });

});


// ============================================================
// 🚀 起動
// ============================================================

resetEcoDashboard();

console.log("🌱 ECO ROUTE 起動");
console.log("🚇 地下鉄対応");
console.log("🚃 JR京都線・琵琶湖線対応");
