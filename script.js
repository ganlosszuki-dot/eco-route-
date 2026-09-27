// ============================================================
// 🌱 ECO ROUTE
// script.js
// 京都市営地下鉄 + JR京都線 + 琵琶湖線 対応版
// ============================================================


// ============================================================
// 🗺️ 地図
// ============================================================

const map = L.map("map").setView(
  [35.0116, 135.7681],
  13
);

L.maplibreGL({
  style: "https://tiles.openfreemap.org/styles/liberty"
}).addTo(map);

map.attributionControl.addAttribution(
  'OpenFreeMap © OpenMapTiles Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
);


let routeLines = [];
let mapMarkers = [];


// ============================================================
// 🧹 地図レイヤー削除
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

  const marker = L.marker([
    point.lat,
    point.lon
  ])
    .addTo(map)
    .bindPopup(text);

  mapMarkers.push(marker);

  return marker;
}


// ============================================================
// 🚇 京都市営地下鉄 CSV
// ============================================================

const trainFiles = {

  karasumaWeekdayUp:
    "karasuma-weekday-up.csv",

  karasumaWeekdayDown:
    "karasuma-weekday-down.csv",

  karasumaHolidayUp:
    "karasuma-holiday-up.csv",

  karasumaHolidayDown:
    "karasuma-holiday-down.csv",

  tozaiWeekdayUp:
    "tozai-weekday-up.csv",

  tozaiWeekdayDown:
    "tozai-weekday-down.csv",

  tozaiHolidayUp:
    "tozai-holiday-up.csv",

  tozaiHolidayDown:
    "tozai-holiday-down.csv"

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


// ============================================================
// 🚇 地下鉄駅間距離 km
// ============================================================

const karasumaDistances = [

  1.0,
  1.1,
  1.2,
  1.0,
  0.9,
  1.2,
  1.0,
  0.9,
  1.0,
  1.0,
  0.9,
  1.0,
  1.0,
  1.0

];


const tozaiDistances = [

  1.1,
  1.2,
  1.3,
  1.3,
  1.2,
  1.0,
  1.1,
  1.3,
  1.0,
  1.0,
  1.1,
  1.1,
  1.0,
  1.0,
  1.1,
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

  {
    name: "東淀川",
    line: "JR京都線",
    lat: 34.7392,
    lon: 135.5027
  },

  {
    name: "吹田",
    line: "JR京都線",
    lat: 34.7630,
    lon: 135.5181
  },

  {
    name: "岸辺",
    line: "JR京都線",
    lat: 34.7758,
    lon: 135.5415
  },

  {
    name: "千里丘",
    line: "JR京都線",
    lat: 34.7900,
    lon: 135.5515
  },

  {
    name: "茨木",
    line: "JR京都線",
    lat: 34.8162,
    lon: 135.5621
  },

  {
    name: "JR総持寺",
    line: "JR京都線",
    lat: 34.8270,
    lon: 135.5870
  },

  {
    name: "摂津富田",
    line: "JR京都線",
    lat: 34.8372,
    lon: 135.5938
  },

  {
    name: "高槻",
    line: "JR京都線",
    lat: 34.8510,
    lon: 135.6177
  },

  {
    name: "島本",
    line: "JR京都線",
    lat: 34.8800,
    lon: 135.6625
  },

  {
    name: "山崎",
    line: "JR京都線",
    lat: 34.8920,
    lon: 135.6715
  },

  {
    name: "長岡京",
    line: "JR京都線",
    lat: 34.9247,
    lon: 135.6965
  },

  {
    name: "向日町",
    line: "JR京都線",
    lat: 34.9510,
    lon: 135.7100
  },

  {
    name: "桂川",
    line: "JR京都線",
    lat: 34.9645,
    lon: 135.7107
  },

  {
    name: "西大路",
    line: "JR京都線",
    lat: 34.9802,
    lon: 135.7310
  },

  {
    name: "京都",
    line: "JR京都線",
    lat: 34.9858,
    lon: 135.7588
  },

  {
    name: "山科",
    line: "琵琶湖線",
    lat: 34.9925,
    lon: 135.8170
  },

  {
    name: "大津",
    line: "琵琶湖線",
    lat: 35.0037,
    lon: 135.8646
  },

  {
    name: "膳所",
    line: "琵琶湖線",
    lat: 34.9978,
    lon: 135.8788
  },

  {
    name: "石山",
    line: "琵琶湖線",
    lat: 34.9797,
    lon: 135.9002
  },

  {
    name: "瀬田",
    line: "琵琶湖線",
    lat: 34.9870,
    lon: 135.9240
  },

  {
    name: "南草津",
    line: "琵琶湖線",
    lat: 35.0038,
    lon: 135.9470
  },

  {
    name: "草津",
    line: "琵琶湖線",
    lat: 35.0225,
    lon: 135.9615
  },

  {
    name: "守山",
    line: "琵琶湖線",
    lat: 35.0580,
    lon: 135.9900
  },

  {
    name: "野洲",
    line: "琵琶湖線",
    lat: 35.0678,
    lon: 136.0235
  }

];


// ============================================================
// 🚃 JR駅を名前から取得
// ============================================================

function getJRStation(name) {

  return jrStations.find(
    station => station.name === name
  );

}


// ============================================================
// 🚇 地下鉄駅ポイント
// ============================================================

function stationPoint(name) {

  const c = stationCoords[name];

  if (!c) {
    return null;
  }

  return {
    lat: c[0],
    lon: c[1]
  };

}


// ============================================================
// 📏 2地点間距離
// ============================================================

function haversineDistance(a, b) {

  const R = 6371000;

  const p1 =
    a.lat * Math.PI / 180;

  const p2 =
    b.lat * Math.PI / 180;

  const dp =
    (b.lat - a.lat) * Math.PI / 180;

  const dl =
    (b.lon - a.lon) * Math.PI / 180;

  const x =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) *
    Math.cos(p2) *
    Math.sin(dl / 2) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(x),
      Math.sqrt(1 - x)
    )
  );

}


// ============================================================
// 🚇 最寄り地下鉄駅
// ============================================================

function findNearestStation(point) {

  const all = [
    ...new Set([
      ...karasumaStations,
      ...tozaiStations
    ])
  ];

  let best = null;

  for (const name of all) {

    const p =
      stationPoint(name);

    if (!p) {
      continue;
    }

    const distance =
      haversineDistance(
        point,
        p
      );

    if (
      !best ||
      distance < best.distance
    ) {

      best = {
        name,
        point: p,
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

    const stationPointData = {
      lat: station.lat,
      lon: station.lon
    };

    const distance =
      haversineDistance(
        point,
        stationPointData
      );

    if (
      !best ||
      distance < best.distance
    ) {

      best = {
        name: station.name,
        line: station.line,
        point: stationPointData,
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

  const response =
    await fetch(
      filename,
      {
        cache: "no-store"
      }
    );

  if (!response.ok) {

    throw new Error(
      filename +
      " を読み込めませんでした"
    );

  }

  return parseCSV(
    await response.text()
  );

}


// ============================================================
// 📄 CSV解析
// ============================================================

function parseCSV(text) {

  text =
    text.replace(
      /^\uFEFF/,
      ""
    );

  const rows = [];

  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {

    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {

      if (
        insideQuotes &&
        next === '"'
      ) {

        cell += '"';
        i++;

      } else {

        insideQuotes =
          !insideQuotes;

      }

      continue;
    }

    if (
      ch === "," &&
      !insideQuotes
    ) {

      row.push(cell);
      cell = "";

      continue;
    }

    if (
      (
        ch === "\n" ||
        ch === "\r"
      ) &&
      !insideQuotes
    ) {

      if (
        ch === "\r" &&
        next === "\n"
      ) {

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

  if (
    cell !== "" ||
    row.length > 0
  ) {

    row.push(cell);
    rows.push(row);

  }

  return rows;
}


// ============================================================
// 🚃 地下鉄データ読み込み
// ============================================================

async function loadAllTrainData() {

  const status =
    document.getElementById(
      "train-status"
    );

  try {

    for (
      const [name, file]
      of Object.entries(trainFiles)
    ) {

      trainData[name] =
        await loadCSV(file);

      console.log(
        "読み込み完了:",
        file
      );

    }

    if (status) {

      status.textContent =
        "✓ 地下鉄時刻表8件を読み込みました";

      status.style.color =
        "#388e3c";

    }

  } catch (error) {

    console.error(
      "地下鉄CSV読み込みエラー:",
      error
    );

    if (status) {

      status.textContent =
        "⚠ 地下鉄データの読み込みに失敗しました";

      status.style.color =
        "#d32f2f";

    }

  }

}


loadAllTrainData();


// ============================================================
// 📍 住所検索
// ============================================================

let lastGeocodeTime = 0;

const geocodeCache =
  new Map();


function sleep(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


async function geocode(place) {

  const key =
    place.trim();

  if (
    geocodeCache.has(key)
  ) {

    return geocodeCache.get(key);

  }

  const wait =
    Math.max(
      0,
      1100 -
      (
        Date.now() -
        lastGeocodeTime
      )
    );

  if (wait > 0) {
    await sleep(wait);
  }

  lastGeocodeTime =
    Date.now();

  const url =
    "https://nominatim.openstreetmap.org/search" +
    "?format=jsonv2" +
    "&limit=1" +
    "&accept-language=ja" +
    "&q=" +
    encodeURIComponent(key);

  const response =
    await fetch(
      url,
      {
        headers: {
          "Accept":
            "application/json"
        }
      }
    );

  if (!response.ok) {

    throw new Error(
      "住所検索サービスに接続できませんでした"
    );

  }

  const data =
    await response.json();

  if (!data.length) {

    throw new Error(
      key +
      " が見つかりませんでした"
    );

  }

  const result = {

    lat:
      parseFloat(
        data[0].lat
      ),

    lon:
      parseFloat(
        data[0].lon
      )

  };

  geocodeCache.set(
    key,
    result
  );

  return result;
}


// ============================================================
// 🚗 OSRM
// ============================================================

async function getRoute(
  start,
  end,
  profile
) {

  const url =
    "https://router.project-osrm.org/route/v1/" +
    profile +
    "/" +
    `${start.lon},${start.lat};${end.lon},${end.lat}` +
    "?overview=full&geometries=geojson";

  const response =
    await fetch(url);

  if (!response.ok) {

    throw new Error(
      profile +
      " のルートサービスに接続できませんでした"
    );

  }

  const data =
    await response.json();

  if (
    data.code !== "Ok" ||
    !data.routes?.length
  ) {

    throw new Error(
      profile +
      " のルートを取得できませんでした"
    );

  }

  return data.routes[0];
}


// ============================================================
// 📏 表示
// ============================================================

function formatDistance(meters) {

  if (meters < 1000) {

    return (
      Math.round(meters) +
      " m"
    );

  }

  return (
    (meters / 1000)
      .toFixed(1) +
    " km"
  );
}


function formatTime(minutes) {

  minutes =
    Math.max(
      0,
      Math.round(minutes)
    );

  if (minutes < 60) {

    return (
      minutes +
      "分"
    );

  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const mins =
    minutes % 60;

  return (
    hours +
    "時間" +
    (
      mins
        ? mins + "分"
        : ""
    )
  );
}


// ============================================================
// 🚃 地下鉄：現在時刻
// ============================================================

function getCurrentMinutes() {

  const now =
    new Date();

  let minutes =
    now.getHours() * 60 +
    now.getMinutes();

  if (
    now.getHours() < 3
  ) {

    minutes +=
      24 * 60;

  }

  return minutes;
}


// ============================================================
// 🚃 時刻解析
// ============================================================

function parseTime(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }

  const text =
    String(value)
      .trim();

  const match =
    text.match(
      /(\d{1,2})[:：](\d{2})/
    );

  if (!match) {

    return null;

  }

  let hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  if (hour < 3) {

    hour += 24;

  }

  return (
    hour * 60 +
    minute
  );
}


// ============================================================
// 🚃 分 → 時刻
// ============================================================

function minutesToTime(minutes) {

  if (
    minutes === null ||
    minutes === undefined
  ) {

    return "--:--";

  }

  const h =
    Math.floor(
      minutes / 60
    ) % 24;

  const m =
    minutes % 60;

  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0")
  );
}


// ============================================================
// 🚃 CSVヘッダー
// ============================================================

function findHeaderRow(
  rows,
  fromStation,
  toStation
) {

  const max =
    Math.min(
      rows.length,
      15
    );

  for (
    let i = 0;
    i < max;
    i++
  ) {

    const row =
      rows[i];

    if (
      row.includes(fromStation) &&
      row.includes(toStation)
    ) {

      return i;

    }

  }

  return -1;
}


// ============================================================
// 🚃 次の直通列車
// ============================================================

function findNextDirectTrain(
  rows,
  fromStation,
  toStation,
  afterMinutes
) {

  const headerIndex =
    findHeaderRow(
      rows,
      fromStation,
      toStation
    );

  if (headerIndex < 0) {
    return null;
  }

  const header =
    rows[headerIndex];

  const fromIndex =
    header.indexOf(
      fromStation
    );

  const toIndex =
    header.indexOf(
      toStation
    );

  if (
    fromIndex < 0 ||
    toIndex < 0
  ) {

    return null;

  }

  let best = null;

  for (
    let i = headerIndex + 1;
    i < rows.length;
    i++
  ) {

    const row =
      rows[i];

    if (
      !row ||
      row.length <=
        Math.max(
          fromIndex,
          toIndex
        )
    ) {

      continue;

    }

    const depart =
      parseTime(
        row[fromIndex]
      );

    const arrive =
      parseTime(
        row[toIndex]
      );

    if (
      depart === null ||
      arrive === null
    ) {

      continue;

    }

    if (
      arrive < depart
    ) {

      continue;

    }

    if (
      depart < afterMinutes
    ) {

      continue;

    }

    if (
      !best ||
      depart < best.depart
    ) {

      best = {
        depart,
        arrive
      };

    }

  }

  return best;
}


// ============================================================
// 🚃 地下鉄路線検索
// ============================================================

function searchLineTrain(
  line,
  fromStation,
  toStation,
  afterMinutes
) {

  const now =
    new Date();

  const day =
    now.getDay();

  const holiday =
    day === 0 ||
    day === 6;

  let rowsUp;
  let rowsDown;

  if (
    line === "karasuma"
  ) {

    if (holiday) {

      rowsUp =
        trainData.karasumaHolidayUp;

      rowsDown =
        trainData.karasumaHolidayDown;

    } else {

      rowsUp =
        trainData.karasumaWeekdayUp;

      rowsDown =
        trainData.karasumaWeekdayDown;

    }

  } else {

    if (holiday) {

      rowsUp =
        trainData.tozaiHolidayUp;

      rowsDown =
        trainData.tozaiHolidayDown;

    } else {

      rowsUp =
        trainData.tozaiWeekdayUp;

      rowsDown =
        trainData.tozaiWeekdayDown;

    }

  }

  const candidates = [];

  if (rowsUp) {

    const result =
      findNextDirectTrain(
        rowsUp,
        fromStation,
        toStation,
        afterMinutes
      );

    if (result) {

      result.line =
        line;

      candidates.push(
        result
      );

    }

  }

  if (rowsDown) {

    const result =
      findNextDirectTrain(
        rowsDown,
        fromStation,
        toStation,
        afterMinutes
      );

    if (result) {

      result.line =
        line;

      candidates.push(
        result
      );

    }

  }

  if (
    candidates.length === 0
  ) {

    return null;

  }

  candidates.sort(
    (a, b) =>
      a.depart -
      b.depart
  );

  return candidates[0];
}


// ============================================================
// 🚃 地下鉄距離
// ============================================================

function getRailDistance(
  line,
  fromStation,
  toStation
) {

  let stations;
  let distances;

  if (
    line === "karasuma"
  ) {

    stations =
      karasumaStations;

    distances =
      karasumaDistances;

  } else {

    stations =
      tozaiStations;

    distances =
      tozaiDistances;

  }

  const from =
    stations.indexOf(
      fromStation
    );

  const to =
    stations.indexOf(
      toStation
    );

  if (
    from < 0 ||
    to < 0
  ) {

    return 0;

  }

  let distance = 0;

  const start =
    Math.min(
      from,
      to
    );

  const end =
    Math.max(
      from,
      to
    );

  for (
    let i = start;
    i < end;
    i++
  ) {

    distance +=
      distances[i] || 0;

  }

  return distance;
}


// ============================================================
// 🚃 地下鉄ルート
// ============================================================

function findTrainRoute(
  fromStation,
  toStation,
  afterMinutes
) {

  if (
    fromStation ===
    toStation
  ) {

    return {
      type: "same",
      totalMinutes: 0,
      distanceKm: 0
    };

  }

  const karasumaFrom =
    karasumaStations.includes(
      fromStation
    );

  const karasumaTo =
    karasumaStations.includes(
      toStation
    );

  const tozaiFrom =
    tozaiStations.includes(
      fromStation
    );

  const tozaiTo =
    tozaiStations.includes(
      toStation
    );

  if (
    karasumaFrom &&
    karasumaTo
  ) {

    const train =
      searchLineTrain(
        "karasuma",
        fromStation,
        toStation,
        afterMinutes
      );

    if (train) {

      return {

        type: "direct",

        train,

        totalMinutes:
          train.arrive -
          train.depart,

        distanceKm:
          getRailDistance(
            "karasuma",
            fromStation,
            toStation
          )

      };

    }

  }

  if (
    tozaiFrom &&
    tozaiTo
  ) {

    const train =
      searchLineTrain(
        "tozai",
        fromStation,
        toStation,
        afterMinutes
      );

    if (train) {

      return {

        type: "direct",

        train,

        totalMinutes:
          train.arrive -
          train.depart,

        distanceKm:
          getRailDistance(
            "tozai",
            fromStation,
            toStation
          )

      };

    }

  }

  if (
    (
      karasumaFrom &&
      tozaiTo
    ) ||
    (
      tozaiFrom &&
      karasumaTo
    )
  ) {

    const firstLine =
      karasumaFrom
        ? "karasuma"
        : "tozai";

    const secondLine =
      karasumaFrom
        ? "tozai"
        : "karasuma";

    const first =
      searchLineTrain(
        firstLine,
        fromStation,
        "烏丸御池",
        afterMinutes
      );

    if (!first) {
      return null;
    }

    const second =
      searchLineTrain(
        secondLine,
        "烏丸御池",
        toStation,
        first.arrive + 4
      );

    if (!second) {
      return null;
    }

    const distanceKm =
      getRailDistance(
        firstLine,
        fromStation,
        "烏丸御池"
      ) +
      getRailDistance(
        secondLine,
        "烏丸御池",
        toStation
      );

    return {

      type: "transfer",

      first,

      second,

      totalMinutes:
        second.arrive -
        first.depart,

      distanceKm

    };

  }

  return null;
}


// ============================================================
// 🚃 地下鉄結果表示
// ============================================================

function displayTrainResult(
  result,
  fromStation,
  toStation,
  walkToMinutes = 0,
  walkFromMinutes = 0
) {

  const lineElement =
    document.getElementById(
      "train-line"
    );

  const timeElement =
    document.getElementById(
      "train-time"
    );

  const distanceElement =
    document.getElementById(
      "train-distance"
    );

  const co2Element =
    document.getElementById(
      "train-co2"
    );

  const statusElement =
    document.getElementById(
      "train-status"
    );

  if (!result) {

    lineElement.textContent =
      "--";

    timeElement.textContent =
      "--";

    distanceElement.textContent =
      "--";

    co2Element.textContent =
      "--";

    statusElement.textContent =
      "利用できる地下鉄ルートを見つけられませんでした";

    statusElement.style.color =
      "#d32f2f";

    return;

  }

  const distanceKm =
    result.distanceKm;

  const co2 =
    distanceKm *
    TRAIN_CO2_PER_KM;

  const totalMinutes =
    result.totalMinutes +
    walkToMinutes +
    walkFromMinutes;

  if (
    result.type ===
    "transfer"
  ) {

    lineElement.textContent =
      "乗換1回";

    statusElement.textContent =
      `${fromStation} → 烏丸御池 → ${toStation}`;

  } else {

    lineElement.textContent =
      fromStation +
      " → " +
      toStation;

    statusElement.textContent =
      result.train
        ? (
          result.train.line ===
          "karasuma"
            ? "烏丸線"
            : "東西線"
        )
        : "同一駅";

  }

  timeElement.textContent =
    formatTime(
      totalMinutes
    );

  distanceElement.textContent =
    distanceKm.toFixed(1) +
    " km";

  co2Element.textContent =
    Math.round(co2) +
    " g";

  if (
    result.type ===
    "transfer"
  ) {

    statusElement.textContent +=
      `（${minutesToTime(result.first.depart)}発 → 烏丸御池 → ${minutesToTime(result.second.depart)}発）`;

  } else if (
    result.train
  ) {

    statusElement.textContent +=
      `・${minutesToTime(result.train.depart)}発`;

  }

  statusElement.style.color =
    "#388e3c";
}


// ============================================================
// 🚇 地下鉄検索
// ============================================================

function searchTrain(
  fromStation,
  toStation,
  walkToMinutes = 0,
  walkFromMinutes = 0
) {

  const status =
    document.getElementById(
      "train-status"
    );

  if (
    Object.keys(trainData).length <
    8
  ) {

    status.textContent =
      "地下鉄データを読み込み中です…";

    status.style.color =
      "#666";

    return;

  }

  const afterMinutes =
    getCurrentMinutes() +
    Math.round(
      walkToMinutes
    );

  const result =
    findTrainRoute(
      fromStation,
      toStation,
      afterMinutes
    );

  displayTrainResult(
    result,
    fromStation,
    toStation,
    walkToMinutes,
    walkFromMinutes
  );
}


// ============================================================
// 🚃 JRルート推定
// ============================================================

function estimateJRRoute(
  startStation,
  endStation
) {

  if (
    !startStation ||
    !endStation
  ) {

    return null;

  }

  const startIndex =
    jrStations.findIndex(
      station =>
        station.name ===
        startStation.name
    );

  const endIndex =
    jrStations.findIndex(
      station =>
        station.name ===
        endStation.name
    );

  if (
    startIndex < 0 ||
    endIndex < 0
  ) {

    return null;

  }

  if (
    startIndex ===
    endIndex
  ) {

    return {
      distanceKm: 0,
      travelMinutes: 0,
      line: startStation.line
    };

  }

  let distanceKm = 0;

  const from =
    Math.min(
      startIndex,
      endIndex
    );

  const to =
    Math.max(
      startIndex,
      endIndex
    );

  for (
    let i = from;
    i < to;
    i++
  ) {

    const a =
      jrStations[i];

    const b =
      jrStations[i + 1];

    distanceKm +=
      haversineDistance(
        {
          lat: a.lat,
          lon: a.lon
        },
        {
          lat: b.lat,
          lon: b.lon
        }
      ) / 1000;

  }

  // JRの車内移動時間を概算
  const travelMinutes =
    distanceKm /
    60 *
    60;

  return {

    distanceKm,

    travelMinutes:
      Math.max(
        3,
        travelMinutes
      ),

    line:
      startIndex <= endIndex
        ? (
          startStation.name ===
          "京都" ||
          startStation.name ===
          "山科"
            ? "JR京都線・琵琶湖線"
            : startStation.line
        )
        : endStation.line

  };

}


// ============================================================
// 🚃 JR結果表示
// ============================================================

function displayJRResult(
  jrResult,
  walkToMinutes,
  walkFromMinutes
) {

  if (!jrResult) {
    return;
  }

  const totalMinutes =
    jrResult.travelMinutes +
    walkToMinutes +
    walkFromMinutes;

  const co2 =
    jrResult.distanceKm *
    TRAIN_CO2_PER_KM;

  const lineElement =
    document.getElementById(
      "train-line"
    );

  const timeElement =
    document.getElementById(
      "train-time"
    );

  const distanceElement =
    document.getElementById(
      "train-distance"
    );

  const co2Element =
    document.getElementById(
      "train-co2"
    );

  const statusElement =
    document.getElementById(
      "train-status"
    );

  if (!lineElement) {
    return;
  }

  lineElement.textContent =
    jrResult.line;

  timeElement.textContent =
    formatTime(
      totalMinutes
    );

  distanceElement.textContent =
    jrResult.distanceKm.toFixed(1) +
    " km";

  co2Element.textContent =
    Math.round(co2) +
    " g";

  statusElement.textContent =
    "🚃 JRルート（所要時間は距離からの推定）";

  statusElement.style.color =
    "#1565c0";
}


// ============================================================
// 🌱 ECOスコア
// ============================================================

function calculateEcoScore(
  co2
) {

  if (
    !Number.isFinite(co2)
  ) {

    return 0;

  }

  if (co2 <= 0) {
    return 100;
  }

  if (co2 >= 2000) {
    return 0;
  }

  return Math.round(
    100 -
    (
      co2 /
      2000 *
      100
    )
  );

}


// ============================================================
// 🌱 ECOダッシュボード
// ============================================================

function updateEcoDashboard(
  walkCo2,
  bikeCo2,
  carCo2,
  trainCo2
) {

  const scores = {

    walk:
      calculateEcoScore(
        walkCo2
      ),

    bike:
      calculateEcoScore(
        bikeCo2
      ),

    car:
      calculateEcoScore(
        carCo2
      ),

    train:
      calculateEcoScore(
        trainCo2
      )

  };


  const ids = {

    walk:
      "walk-score",

    bike:
      "bike-score",

    car:
      "car-score",

    train:
      "train-score"

  };


  Object.entries(scores)
    .forEach(
      ([key, score]) => {

        const element =
          document.getElementById(
            ids[key]
          );

        if (!element) {
          return;
        }

        element.textContent =
          score + "点";

      }
    );


  const recommendation =
    document.getElementById(
      "eco-message"
    );

  if (!recommendation) {
    return;
  }


  const available =
    Object.entries(scores)
      .filter(
        ([key]) =>
          key !== "car"
      );


  available.sort(
    (a, b) =>
      b[1] - a[1]
  );


  if (
    available.length
  ) {

    const best =
      available[0][0];

    const names = {

      walk:
        "徒歩",

      bike:
        "自転車",

      train:
        "鉄道"

    };

    recommendation.textContent =
      "🌱 エコ度が高い移動方法："
      +
      names[best];

  }

}


// ============================================================
// 🌱 ECO初期化
// ============================================================

function resetEcoDashboard() {

  const ids = [

    "walk-score",
    "bike-score",
    "car-score",
    "train-score"

  ];

  ids.forEach(id => {

    const element =
      document.getElementById(
        id
      );

    if (element) {

      element.textContent =
        "--";

    }

  });

  const message =
    document.getElementById(
      "eco-message"
    );

  if (message) {

    message.textContent =
      "ルートを検索するとエコ度を表示します";

  }
}


// ============================================================
// 🔎 メイン検索
// ============================================================

async function searchRoute() {

  const button =
    document.getElementById(
      "searchButton"
    );

  const startText =
    document.getElementById(
      "start"
    ).value.trim();

  const endText =
    document.getElementById(
      "end"
    ).value.trim();

  if (
    !startText ||
    !endText
  ) {

    alert(
      "出発地と目的地を入力してください！"
    );

    return;

  }

  resetEcoDashboard();

  button.disabled =
    true;

  button.textContent =
    "検索中…";


  try {

    // ========================================================
    // 📍 住所
    // ========================================================

    const start =
      await geocode(
        startText
      );

    const end =
      await geocode(
        endText
      );


    clearMapLayers();


    map.setView(
      [
        start.lat,
        start.lon
      ],
      13
    );


    addMarker(
      start,
      "📍 出発地：" +
      startText
    ).openPopup();


    addMarker(
      end,
      "🎯 目的地：" +
      endText
    );


    // ========================================================
    // 🚶🚲🚗 道路ルート
    // ========================================================

    const [
      walk,
      bike,
      car
    ] =
      await Promise.all([

        getRoute(
          start,
          end,
          "walking"
        ),

        getRoute(
          start,
          end,
          "cycling"
        ),

        getRoute(
          start,
          end,
          "driving"
        )

      ]);


    // 徒歩ルート
    const walkLine =
      L.geoJSON(
        walk.geometry
      ).addTo(map);

    routeLines.push(
      walkLine
    );


    document.getElementById(
      "walk-distance"
    ).textContent =
      formatDistance(
        walk.distance
      );


    document.getElementById(
      "bike-distance"
    ).textContent =
      formatDistance(
        bike.distance
      );


    document.getElementById(
      "car-distance"
    ).textContent =
      formatDistance(
        car.distance
      );


    // ========================================================
    // ⏱️ 所要時間
    // ========================================================

    const walkMinutes =
      (
        walk.distance /
        1000
      ) /
      4.5 *
      60;


    const bikeMinutes =
      (
        bike.distance /
        1000
      ) /
      15 *
      60;


    const carMinutes =
      (
        car.distance /
        1000
      ) /
      50 *
      60;


    document.getElementById(
      "walk-time"
    ).textContent =
      formatTime(
        walkMinutes
      );


    document.getElementById(
      "bike-time"
    ).textContent =
      formatTime(
        bikeMinutes
      );


    document.getElementById(
      "car-time"
    ).textContent =
      formatTime(
        carMinutes
      );


    // ========================================================
    // 🌱 CO2
    // ========================================================

    const walkCo2 = 0;

    const bikeCo2 = 0;

    const carCo2 =
      (
        car.distance /
        1000
      ) *
      130;


    document.getElementById(
      "car-co2"
    ).textContent =
      Math.round(
        carCo2
      ) +
      " g";


    // ========================================================
    // 🚇 最寄り地下鉄
    // ========================================================

    const startStation =
      findNearestStation(
        start
      );

    const endStation =
      findNearestStation(
        end
      );


    // ========================================================
    // 🚃 最寄りJR
    // ========================================================

    const startJR =
      findNearestJRStation(
        start
      );

    const endJR =
      findNearestJRStation(
        end
      );


    // JR駅を地図表示
    if (startJR) {

      addMarker(
        startJR.point,
        "🚃 JR最寄り駅：" +
        startJR.name +
        "（" +
        startJR.line +
        "）"
      );

    }


    if (endJR) {

      addMarker(
        endJR.point,
        "🚃 JR最寄り駅：" +
        endJR.name +
        "（" +
        endJR.line +
        "）"
      );

    }


    // ========================================================
    // 🚇 地下鉄駅までの徒歩
    // ========================================================

    let trainCo2 = null;


    if (
      startStation &&
      endStation
    ) {

      addMarker(
        startStation.point,
        "🚇 地下鉄最寄り駅：" +
        startStation.name
      );


      addMarker(
        endStation.point,
        "🚇 地下鉄最寄り駅：" +
        endStation.name
      );


      const [
        walkToStation,
        walkFromStation
      ] =
        await Promise.all([

          getRoute(
            start,
            startStation.point,
            "walking"
          ),

          getRoute(
            endStation.point,
            end,
            "walking"
          )

        ]);


      const line1 =
        L.geoJSON(
          walkToStation.geometry
        ).addTo(map);


      const line2 =
        L.geoJSON(
          walkFromStation.geometry
        ).addTo(map);


      routeLines.push(
        line1,
        line2
      );


      const walkToMinutes =
        (
          walkToStation.distance /
          1000
        ) /
        4.5 *
        60;


      const walkFromMinutes =
        (
          walkFromStation.distance /
          1000
        ) /
        4.5 *
        60;


      // ======================================================
      // 🚇 地下鉄
      // ======================================================

      await searchTrain(

        startStation.name,

        endStation.name,

        walkToMinutes,

        walkFromMinutes

      );


      const trainCo2Element =
        document.getElementById(
          "train-co2"
        );


      if (
        trainCo2Element &&
        trainCo2Element.textContent !== "--"
      ) {

        trainCo2 =
          parseFloat(
            trainCo2Element
              .textContent
              .replace(
                "g",
                ""
              )
          );

      }

    }


    // ========================================================
    // 🚃 JR
    // ========================================================

    let jrCo2 = null;


    if (
      startJR &&
      endJR
    ) {

      const jrRoute =
        estimateJRRoute(
          startJR,
          endJR
        );


      if (jrRoute) {

        const walkToJR =
          haversineDistance(
            start,
            startJR.point
          ) /
          1000 /
          4.5 *
          60;


        const walkFromJR =
          haversineDistance(
            endJR.point,
            end
          ) /
          1000 /
          4.5 *
          60;


        jrCo2 =
          jrRoute.distanceKm *
          TRAIN_CO2_PER_KM;


        // ----------------------------------------------------
        // 地下鉄とJRを比較
        // ----------------------------------------------------

        if (
          trainCo2 === null ||
          jrCo2 < trainCo2
        ) {

          displayJRResult(
            jrRoute,
            walkToJR,
            walkFromJR
          );

        }

      }

    }


    // ========================================================
    // 🌱 ECOダッシュボード
    // ========================================================

    const finalTrainCo2 =
      (
        jrCo2 !== null &&
        (
          trainCo2 === null ||
          jrCo2 < trainCo2
        )
      )
        ? jrCo2
        : trainCo2;


    updateEcoDashboard(

      walkCo2,

      bikeCo2,

      carCo2,

      finalTrainCo2 === null
        ? 0
        : finalTrainCo2

    );


    // ========================================================
    // 🗺️ 地図調整
    // ========================================================

    const points = [

      [
        start.lat,
        start.lon
      ],

      [
        end.lat,
        end.lon
      ]

    ];


    if (startStation) {

      points.push([
        startStation.point.lat,
        startStation.point.lon
      ]);

    }


    if (endStation) {

      points.push([
        endStation.point.lat,
        endStation.point.lon
      ]);

    }


    if (startJR) {

      points.push([
        startJR.point.lat,
        startJR.point.lon
      ]);

    }


    if (endJR) {

      points.push([
        endJR.point.lat,
        endJR.point.lon
      ]);

    }


    map.fitBounds(
      L.latLngBounds(
        points
      ),
      {
        padding: [
          30,
          30
        ]
      }
    );


  } catch (error) {

    console.error(
      error
    );


    alert(
      "ルート検索でエラーが発生しました。\n" +
      error.message
    );


    const status =
      document.getElementById(
        "train-status"
      );


    if (status) {

      status.textContent =
        "検索に失敗しました";

    }


  } finally {

    button.disabled =
      false;

    button.textContent =
      "ルート検索";

  }

}


// ============================================================
// ⌨️ Enterキー
// ============================================================

[
  "start",
  "end"
].forEach(
  id => {

    const input =
      document.getElementById(
        id
      );

    if (!input) {
      return;
    }

    input.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Enter"
        ) {

          searchRoute();

        }

      }
    );

  }
);


// ============================================================
// 🚀 初期状態
// ============================================================

resetEcoDashboard();

console.log(
  "🌱 ECO ROUTE 起動完了"
);

console.log(
  "🚇 京都市営地下鉄：対応"
);

console.log(
  "🚃 JR京都線・琵琶湖線：対応"
);
