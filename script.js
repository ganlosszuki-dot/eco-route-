// ============================================================
// 🌱 ECO ROUTE  (修正版)
// JR京都線・琵琶湖線 + 京都市営地下鉄対応
// ============================================================
//
// 【今回の主な修正】
// 1. JRカードを作る処理が ".route-card" を探していたが、HTMLは ".card" だった
//    → カードが作られず #jr-line などが null → textContent でエラー、が原因でした
// 2. すべての表示を setText() 経由にして、要素が無くても落ちないようにした
// 3. 徒歩/自転車/車で別々のルートサーバーを使うようにした(徒歩が車ルートになる問題の対策)
// 4. おすすめ表示が毎回「徒歩」にならないよう、現実的な所要時間で判定
// ============================================================


// ------------------------------------------------------------
// 🗺️ 地図
// ------------------------------------------------------------

const map = L.map("map").setView([35.0116, 135.7681], 13);

L.maplibreGL({
  style: "https://tiles.openfreemap.org/styles/liberty"
}).addTo(map);

map.attributionControl.addAttribution(
  'OpenFreeMap © OpenMapTiles Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
);

let routeLines = [];
let mapMarkers = [];

function clearMapLayers() {
  routeLines.forEach(l => map.removeLayer(l));
  mapMarkers.forEach(m => map.removeLayer(m));
  routeLines = [];
  mapMarkers = [];
}

function addMarker(point, text) {
  const marker = L.marker([point.lat, point.lon]).addTo(map).bindPopup(text);
  mapMarkers.push(marker);
  return marker;
}


// ------------------------------------------------------------
// 🧰 安全に文字を入れる道具(要素が無くてもエラーにならない)
// ------------------------------------------------------------

function $(id) {
  return document.getElementById(id);
}

function setText(id, text, color) {
  const el = $(id);
  if (!el) {
    console.warn("要素が見つかりません: #" + id);
    return;
  }
  el.textContent = text;
  if (color !== undefined) el.style.color = color;
}


// ------------------------------------------------------------
// 🚇 地下鉄データ
// ------------------------------------------------------------

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

const karasumaStations = [
  "国際会館", "松ヶ崎", "北山", "北大路", "鞍馬口",
  "今出川", "丸太町", "烏丸御池", "四条", "五条",
  "京都", "九条", "十条", "くいな橋", "竹田"
];

const tozaiStations = [
  "六地蔵", "石田", "醍醐", "小野", "椥辻", "東野",
  "山科", "御陵", "蹴上", "東山", "三条京阪",
  "京都市役所前", "烏丸御池", "二条城前", "二条",
  "西大路御池", "太秦天神川"
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

const TRAIN_CO2_PER_KM = 20; // g/km
const WALK_TO_STATION_LIMIT = 3000; // 駅まで歩く上限(m)

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


// ------------------------------------------------------------
// 🚃 JR京都線・琵琶湖線(西→東の順)
// ------------------------------------------------------------

const jrStations = [
  { name: "東淀川", line: "JR京都線", lat: 34.7392, lon: 135.5027 },
  { name: "吹田", line: "JR京都線", lat: 34.7630, lon: 135.5181 },
  { name: "岸辺", line: "JR京都線", lat: 34.7758, lon: 135.5415 },
  { name: "千里丘", line: "JR京都線", lat: 34.7900, lon: 135.5515 },
  { name: "茨木", line: "JR京都線", lat: 34.8162, lon: 135.5621 },
  { name: "JR総持寺", line: "JR京都線", lat: 34.8270, lon: 135.5870 },
  { name: "摂津富田", line: "JR京都線", lat: 34.8372, lon: 135.5938 },
  { name: "高槻", line: "JR京都線", lat: 34.8510, lon: 135.6177 },
  { name: "島本", line: "JR京都線", lat: 34.8800, lon: 135.6625 },
  { name: "山崎", line: "JR京都線", lat: 34.8920, lon: 135.6715 },
  { name: "長岡京", line: "JR京都線", lat: 34.9247, lon: 135.6965 },
  { name: "向日町", line: "JR京都線", lat: 34.9510, lon: 135.7100 },
  { name: "桂川", line: "JR京都線", lat: 34.9645, lon: 135.7107 },
  { name: "西大路", line: "JR京都線", lat: 34.9802, lon: 135.7310 },
  { name: "京都", line: "JR京都線", lat: 34.9858, lon: 135.7588 },
  { name: "山科", line: "琵琶湖線", lat: 34.9925, lon: 135.8170 },
  { name: "大津", line: "琵琶湖線", lat: 35.0037, lon: 135.8646 },
  { name: "膳所", line: "琵琶湖線", lat: 34.9978, lon: 135.8788 },
  { name: "石山", line: "琵琶湖線", lat: 34.9797, lon: 135.9002 },
  { name: "瀬田", line: "琵琶湖線", lat: 34.9870, lon: 135.9240 },
  { name: "南草津", line: "琵琶湖線", lat: 35.0038, lon: 135.9470 },
  { name: "草津", line: "琵琶湖線", lat: 35.0225, lon: 135.9615 },
  { name: "守山", line: "琵琶湖線", lat: 35.0580, lon: 135.9900 },
  { name: "野洲", line: "琵琶湖線", lat: 35.0678, lon: 136.0235 }
];


// ------------------------------------------------------------
// 📏 距離計算
// ------------------------------------------------------------

function haversineDistance(a, b) {
  const R = 6371000;
  const p1 = a.lat * Math.PI / 180;
  const p2 = b.lat * Math.PI / 180;
  const dp = (b.lat - a.lat) * Math.PI / 180;
  const dl = (b.lon - a.lon) * Math.PI / 180;
  const x =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function findNearestStation(point) {
  const names = [...new Set([...karasumaStations, ...tozaiStations])];
  let best = null;
  for (const name of names) {
    const c = stationCoords[name];
    if (!c) continue;
    const station = { lat: c[0], lon: c[1] };
    const distance = haversineDistance(point, station);
    if (!best || distance < best.distance) {
      best = { name, point: station, distance };
    }
  }
  return best;
}

function findNearestJRStation(point) {
  let best = null;
  for (const s of jrStations) {
    const p = { lat: s.lat, lon: s.lon };
    const distance = haversineDistance(point, p);
    if (!best || distance < best.distance) {
      best = { name: s.name, line: s.line, point: p, distance };
    }
  }
  return best;
}


// ------------------------------------------------------------
// 📄 CSV読み込み
// ------------------------------------------------------------

async function loadCSV(filename) {
  const response = await fetch(filename, { cache: "no-store" });
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
      if (ch === "\r" && next === "\n") i++;
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

async function loadAllTrainData() {
  try {
    for (const [name, file] of Object.entries(trainFiles)) {
      trainData[name] = await loadCSV(file);
    }
    setText("train-status", "✓ 地下鉄時刻表8件を読み込みました", "#388e3c");
  } catch (error) {
    console.error(error);
    setText("train-status", "⚠ 地下鉄データの読み込みに失敗しました", "#d32f2f");
  }
}


// ------------------------------------------------------------
// 📍 住所検索(Nominatim)
// ------------------------------------------------------------

let lastGeocodeTime = 0;
const geocodeCache = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocode(place) {
  const key = place.trim();

  if (geocodeCache.has(key)) return geocodeCache.get(key);

  // Nominatimは1秒に1回までのルール
  const wait = Math.max(0, 1100 - (Date.now() - lastGeocodeTime));
  if (wait > 0) await sleep(wait);
  lastGeocodeTime = Date.now();

  const url =
    "https://nominatim.openstreetmap.org/search" +
    "?format=jsonv2&limit=1&accept-language=ja&q=" +
    encodeURIComponent(key);

  const response = await fetch(url);
  if (!response.ok) throw new Error("住所検索に失敗しました");

  const data = await response.json();
  if (!data.length) throw new Error(key + " が見つかりませんでした");

  const result = {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };

  geocodeCache.set(key, result);
  return result;
}


// ------------------------------------------------------------
// 🚗🚲🚶 ルート取得(OSRM)
// ------------------------------------------------------------
// router.project-osrm.org は徒歩・自転車を指定しても
// 車ルートが返ることが多いので、乗り物ごとの専用サーバーを先に試します。

const ROUTE_SERVERS = {
  walking: [
    "https://routing.openstreetmap.de/routed-foot/route/v1/driving/",
    "https://router.project-osrm.org/route/v1/walking/"
  ],
  cycling: [
    "https://routing.openstreetmap.de/routed-bike/route/v1/driving/",
    "https://router.project-osrm.org/route/v1/cycling/"
  ],
  driving: [
    "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
    "https://router.project-osrm.org/route/v1/driving/"
  ]
};

async function getRoute(start, end, profile) {
  const coords = `${start.lon},${start.lat};${end.lon},${end.lat}`;
  const query = "?overview=full&geometries=geojson";
  let lastError = null;

  for (const base of ROUTE_SERVERS[profile]) {
    try {
      const response = await fetch(base + coords + query);
      if (!response.ok) throw new Error("ルート取得に失敗しました");

      const data = await response.json();
      if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("ルートが見つかりませんでした");
      }
      return data.routes[0];

    } catch (error) {
      lastError = error;
      console.warn("ルートサーバー失敗:", base, error);
    }
  }

  throw lastError || new Error("ルート取得に失敗しました");
}


// ------------------------------------------------------------
// ⏱️ 表示用の整形
// ------------------------------------------------------------

function formatDistance(meters) {
  if (meters < 1000) return Math.round(meters) + " m";
  return (meters / 1000).toFixed(1) + " km";
}

function formatTime(minutes) {
  minutes = Math.max(0, Math.round(minutes));
  if (minutes < 60) return minutes + "分";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours + "時間" + (mins > 0 ? mins + "分" : "");
}


// ------------------------------------------------------------
// 🚇 時刻の処理
// ------------------------------------------------------------

function getCurrentMinutes() {
  const now = new Date();
  let minutes = now.getHours() * 60 + now.getMinutes();
  if (now.getHours() < 3) minutes += 1440;
  return minutes;
}

function parseTime(value) {
  if (value === null || value === undefined) return null;

  const match = String(value).trim().match(/(\d{1,2})[:：](\d{2})/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 3) hour += 24;

  return hour * 60 + minute;
}


// ------------------------------------------------------------
// 🚇 地下鉄の時刻表検索
// ------------------------------------------------------------

function findHeaderRow(rows, fromStation, toStation) {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    if (rows[i].includes(fromStation) && rows[i].includes(toStation)) {
      return i;
    }
  }
  return -1;
}

function findNextDirectTrain(rows, fromStation, toStation, afterMinutes) {
  const headerIndex = findHeaderRow(rows, fromStation, toStation);
  if (headerIndex < 0) return null;

  const header = rows[headerIndex];
  const fromIndex = header.indexOf(fromStation);
  const toIndex = header.indexOf(toStation);
  if (fromIndex < 0 || toIndex < 0) return null;

  let best = null;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const depart = parseTime(rows[i][fromIndex]);
    const arrive = parseTime(rows[i][toIndex]);

    if (depart === null || arrive === null) continue;
    if (depart < afterMinutes) continue;
    if (arrive < depart) continue;

    if (!best || depart < best.depart) best = { depart, arrive };
  }

  return best;
}

function searchLineTrain(line, fromStation, toStation, afterMinutes) {
  const day = new Date().getDay();
  const holiday = day === 0 || day === 6;

  // 例: karasuma + Holiday → karasumaHolidayUp / karasumaHolidayDown
  const key = line + (holiday ? "Holiday" : "Weekday");
  const tables = [trainData[key + "Up"], trainData[key + "Down"]];

  const candidates = [];

  for (const rows of tables) {
    if (!rows) continue;
    const result = findNextDirectTrain(rows, fromStation, toStation, afterMinutes);
    if (result) {
      result.line = line;
      candidates.push(result);
    }
  }

  candidates.sort((a, b) => a.depart - b.depart);
  return candidates[0] || null;
}

function getRailDistance(line, fromStation, toStation) {
  const stations = line === "karasuma" ? karasumaStations : tozaiStations;
  const distances = line === "karasuma" ? karasumaDistances : tozaiDistances;

  const from = stations.indexOf(fromStation);
  const to = stations.indexOf(toStation);
  if (from < 0 || to < 0) return 0;

  let total = 0;
  for (let i = Math.min(from, to); i < Math.max(from, to); i++) {
    total += distances[i] || 0;
  }
  return total;
}

function findTrainRoute(fromStation, toStation, afterMinutes) {
  if (fromStation === toStation) {
    return { type: "same", totalMinutes: 0, distanceKm: 0 };
  }

  const fromK = karasumaStations.includes(fromStation);
  const toK = karasumaStations.includes(toStation);
  const fromT = tozaiStations.includes(fromStation);
  const toT = tozaiStations.includes(toStation);

  // 同じ路線で行ける場合
  for (const [line, ok] of [["karasuma", fromK && toK], ["tozai", fromT && toT]]) {
    if (!ok) continue;

    const train = searchLineTrain(line, fromStation, toStation, afterMinutes);
    if (train) {
      return {
        type: "direct",
        train,
        totalMinutes: train.arrive - train.depart,
        distanceKm: getRailDistance(line, fromStation, toStation)
      };
    }
  }

  // 烏丸御池で乗り換える場合
  if ((fromK && toT) || (fromT && toK)) {
    const firstLine = fromK ? "karasuma" : "tozai";
    const secondLine = fromK ? "tozai" : "karasuma";

    const first = searchLineTrain(firstLine, fromStation, "烏丸御池", afterMinutes);
    if (!first) return null;

    const second = searchLineTrain(secondLine, "烏丸御池", toStation, first.arrive + 4);
    if (!second) return null;

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


// ------------------------------------------------------------
// 🚇 地下鉄カードの表示
// ------------------------------------------------------------

function resetSubwayCard(message) {
  setText("train-line", "--");
  setText("train-time", "--");
  setText("train-distance", "--");
  setText("train-co2", "--");
  setText("train-status", message, "");
}

// 成功したら { co2, minutes } を返す。だめなら null
function displaySubwayResult(result, walkToMinutes, walkFromMinutes) {
  if (!result) {
    resetSubwayCard("利用できる地下鉄ルートがありません");
    return null;
  }

  const total = result.totalMinutes + walkToMinutes + walkFromMinutes;
  const emission = result.distanceKm * TRAIN_CO2_PER_KM;

  setText("train-line", result.type === "transfer" ? "乗換1回" : "地下鉄");
  setText("train-time", formatTime(total));
  setText("train-distance", result.distanceKm.toFixed(1) + " km");
  setText("train-co2", Math.round(emission) + " g");
  setText("train-status", "🚇 京都市営地下鉄", "#388e3c");

  return { co2: emission, minutes: total };
}


// ------------------------------------------------------------
// 🚃 JRカード(HTMLに無いのでJSで作る)
// ------------------------------------------------------------
// ★ 元のバグ: ".route-card" を探していたが、HTMLのカードは ".card" だった。
//   → trainCard が null で return → #jr-line が存在せず textContent でエラー。

function createJRCard() {
  if ($("jr-card")) return;

  const trainCard = $("train-card");
  if (!trainCard) {
    console.warn("#train-card が見つからないのでJRカードを作れません");
    return;
  }

  const card = document.createElement("div");
  card.id = "jr-card";
  card.className = "card";

  card.innerHTML = `
    <div class="icon">🚃</div>
    <h3>JR</h3>
    <div class="route-label" style="background:#e8f1ff;color:#1565c0;">
      JR京都線・琵琶湖線
    </div>

    <div class="info">路線
      <div class="big-number" id="jr-line" style="font-size:15px;">--</div>
    </div>

    <div class="info">時間
      <div class="big-number" id="jr-time">--</div>
    </div>

    <div class="info">距離
      <div class="big-number" id="jr-distance">--</div>
    </div>

    <div class="co2">🌱 CO₂
      <div class="co2-number" id="jr-co2">--</div>
    </div>

    <div class="train-status" id="jr-status">JRルートを検索します</div>
  `;

  trainCard.after(card);
}

// 環境スコア欄にもJRを追加
function createJRScore() {
  if ($("jr-score")) return;

  const grid = document.querySelector(".score-grid");
  if (!grid) return;

  const item = document.createElement("div");
  item.className = "score-item";
  item.innerHTML = `
    <div class="score-icon">🚃</div>
    <div class="score-name">JR</div>
    <div class="score-value" id="jr-score">--</div>
  `;
  grid.appendChild(item);
}

function resetJRCard(message) {
  setText("jr-line", "--");
  setText("jr-time", "--");
  setText("jr-distance", "--");
  setText("jr-co2", "--");
  setText("jr-status", message, "");
}


// ------------------------------------------------------------
// 🚃 JRの計算と表示
// ------------------------------------------------------------

function calculateJRDistance(fromName, toName) {
  const fromIndex = jrStations.findIndex(s => s.name === fromName);
  const toIndex = jrStations.findIndex(s => s.name === toName);
  if (fromIndex < 0 || toIndex < 0) return null;

  let total = 0;
  for (let i = Math.min(fromIndex, toIndex); i < Math.max(fromIndex, toIndex); i++) {
    const a = jrStations[i];
    const b = jrStations[i + 1];
    total += haversineDistance(
      { lat: a.lat, lon: a.lon },
      { lat: b.lat, lon: b.lon }
    ) / 1000;
  }
  return total;
}

function estimateJRMinutes(distanceKm) {
  // 停車時間込みでだいたい時速55km
  return Math.max(5, distanceKm / 55 * 60);
}

// 成功したら { co2, minutes } を返す。だめなら null
function displayJRResult(startJR, endJR) {
  createJRCard();

  const distanceKm = calculateJRDistance(startJR.name, endJR.name);
  if (distanceKm === null) {
    resetJRCard("JRルートを計算できませんでした");
    return null;
  }

  const walkTo = startJR.distance / 1000 / 4.5 * 60;
  const walkFrom = endJR.distance / 1000 / 4.5 * 60;
  const totalMinutes = estimateJRMinutes(distanceKm) + walkTo + walkFrom;
  const emission = distanceKm * TRAIN_CO2_PER_KM;

  // 通る路線名(京都を境に JR京都線 / 琵琶湖線)
  const lines = new Set([startJR.line, endJR.line]);
  const lineName = [...lines].join("・");

  setText("jr-line", `${startJR.name} → ${endJR.name}（${lineName}）`);
  setText("jr-time", formatTime(totalMinutes));
  setText("jr-distance", distanceKm.toFixed(1) + " km");
  setText("jr-co2", Math.round(emission) + " g");
  setText("jr-status", "🚃 駅間の距離から所要時間を推定（時刻表ではありません）", "#1565c0");

  return { co2: emission, minutes: totalMinutes };
}


// ------------------------------------------------------------
// 🌱 エコスコア
// ------------------------------------------------------------

function calculateEcoScore(co2) {
  if (!Number.isFinite(co2)) return null;
  if (co2 <= 0) return 100;
  return Math.max(0, Math.round(100 - co2 / 2000 * 100));
}

const MODE_NAMES = {
  walk: "徒歩",
  bike: "自転車",
  car: "車",
  train: "地下鉄",
  jr: "JR"
};

// items: { walk:{co2,minutes}, bike:{...}, car:{...}, train:{...}|null, jr:{...}|null }
function updateEcoDashboard(items) {

  // スコア表示
  for (const key of Object.keys(MODE_NAMES)) {
    const item = items[key];
    const score = item ? calculateEcoScore(item.co2) : null;
    if ($(key + "-score")) {
      setText(key + "-score", score === null ? "--" : score + "点");
    }
  }

  // おすすめ(現実的な所要時間のものだけ候補にする)
  const candidates = [];

  for (const key of Object.keys(MODE_NAMES)) {
    const item = items[key];
    if (!item) continue;
    if (key === "walk" && item.minutes > 60) continue;  // 徒歩は1時間まで
    if (key === "bike" && item.minutes > 90) continue;  // 自転車は1.5時間まで
    candidates.push({ key, ...item });
  }

  if (!candidates.length) {
    setText("eco-message", "条件に合うルートが見つかりませんでした");
    return;
  }

  // CO₂が少ない順 → 同じなら速い順
  candidates.sort((a, b) => a.co2 - b.co2 || a.minutes - b.minutes);

  const best = candidates[0];

  setText(
    "eco-message",
    `🌱 現実的な所要時間で最もエコなのは「${MODE_NAMES[best.key]}」です` +
    `（約${formatTime(best.minutes)}・CO₂ ${Math.round(best.co2)} g）`
  );
}

function resetEcoDashboard() {
  Object.keys(MODE_NAMES).forEach(key => {
    if ($(key + "-score")) setText(key + "-score", "--");
  });
  setText("eco-message", "ルートを検索するとエコ度を表示します");
}


// ------------------------------------------------------------
// 🔎 メイン検索
// ------------------------------------------------------------

let searching = false;

async function searchRoute() {
  if (searching) return; // 二重実行防止(Enter連打など)

  const button = $("searchButton");
  const startText = $("start").value.trim();
  const endText = $("end").value.trim();

  if (!startText || !endText) {
    alert("出発地と目的地を入力してください");
    return;
  }

  searching = true;
  button.disabled = true;
  button.textContent = "検索中…";
  resetEcoDashboard();

  try {

    // ---------- 場所 ----------
    const start = await geocode(startText);
    const end = await geocode(endText);

    clearMapLayers();
    addMarker(start, "📍 出発地：" + startText);
    addMarker(end, "🎯 目的地：" + endText);

    // ---------- 徒歩・自転車・車 ----------
    const [walk, bike, car] = await Promise.all([
      getRoute(start, end, "walking"),
      getRoute(start, end, "cycling"),
      getRoute(start, end, "driving")
    ]);

    // 地図に3本とも描く(色分け)
    [
      [car, "#ef6c00"],
      [bike, "#1e88e5"],
      [walk, "#43a047"]
    ].forEach(([route, color]) => {
      const layer = L.geoJSON(route.geometry, {
        style: { color, weight: 5, opacity: 0.8 }
      }).addTo(map);
      routeLines.push(layer);
    });

    const walkMinutes = walk.distance / 1000 / 4.5 * 60;
    const bikeMinutes = bike.distance / 1000 / 15 * 60;
    const carMinutes = car.distance / 1000 / 50 * 60;
    const carCo2 = car.distance / 1000 * 130;

    setText("walk-distance", formatDistance(walk.distance));
    setText("bike-distance", formatDistance(bike.distance));
    setText("car-distance", formatDistance(car.distance));

    setText("walk-time", formatTime(walkMinutes));
    setText("bike-time", formatTime(bikeMinutes));
    setText("car-time", formatTime(carMinutes));

    setText("car-co2", Math.round(carCo2) + " g");

    // ---------- JR ----------
    createJRCard();
    createJRScore();

    const startJR = findNearestJRStation(start);
    const endJR = findNearestJRStation(end);
    let jrResult = null;

    const jrUseful =
      startJR && endJR &&
      startJR.name !== endJR.name &&
      startJR.distance <= WALK_TO_STATION_LIMIT &&
      endJR.distance <= WALK_TO_STATION_LIMIT;

    if (jrUseful) {
      addMarker(startJR.point, "🚃 JR最寄り駅：" + startJR.name);
      addMarker(endJR.point, "🚃 JR最寄り駅：" + endJR.name);
      jrResult = displayJRResult(startJR, endJR);
    } else if (startJR && endJR && startJR.name === endJR.name) {
      resetJRCard("最寄りのJR駅が同じため、JRは候補外です");
    } else {
      resetJRCard("JRの駅が遠いため候補外です");
    }

    // ---------- 地下鉄 ----------
    const startSubway = findNearestStation(start);
    const endSubway = findNearestStation(end);
    let subwayResult = null;

    const subwayUseful =
      startSubway && endSubway &&
      startSubway.distance <= WALK_TO_STATION_LIMIT &&
      endSubway.distance <= WALK_TO_STATION_LIMIT;

    if (subwayUseful) {
      addMarker(startSubway.point, "🚇 地下鉄：" + startSubway.name);
      addMarker(endSubway.point, "🚇 地下鉄：" + endSubway.name);

      const walkTo = startSubway.distance / 1000 / 4.5 * 60;
      const walkFrom = endSubway.distance / 1000 / 4.5 * 60;

      const route = findTrainRoute(
        startSubway.name,
        endSubway.name,
        getCurrentMinutes() + Math.round(walkTo)
      );

      subwayResult = displaySubwayResult(route, walkTo, walkFrom);

    } else {
      resetSubwayCard("遠距離移動のため地下鉄は主ルート候補外");
    }

    // ---------- 地図の表示範囲 ----------
    const points = [
      [start.lat, start.lon],
      [end.lat, end.lon]
    ];
    if (jrResult) {
      points.push([startJR.point.lat, startJR.point.lon]);
      points.push([endJR.point.lat, endJR.point.lon]);
    }

    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });

    // ---------- エコ表示 ----------
    updateEcoDashboard({
      walk: { co2: 0, minutes: walkMinutes },
      bike: { co2: 0, minutes: bikeMinutes },
      car: { co2: carCo2, minutes: carMinutes },
      train: subwayResult,
      jr: jrResult
    });

    const recommendation = $("eco-recommendation");
    if (recommendation) recommendation.style.display = "block";

  } catch (error) {

    console.error(error);
    alert("ルート検索でエラーが発生しました。\n" + error.message);

  } finally {

    // エラーが起きても必ずボタンを元に戻す
    searching = false;
    button.disabled = false;
    button.textContent = "ルート検索";

  }
}


// ------------------------------------------------------------
// ⌨️ Enterキーで検索
// ------------------------------------------------------------

["start", "end"].forEach(id => {
  const input = $(id);
  if (!input) return;

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") searchRoute();
  });
});


// ------------------------------------------------------------
// 🚀 起動
// ------------------------------------------------------------

loadAllTrainData();
createJRCard();
createJRScore();
resetEcoDashboard();

console.log("🌱 ECO ROUTE 起動（地下鉄 + JR京都線・琵琶湖線）");
