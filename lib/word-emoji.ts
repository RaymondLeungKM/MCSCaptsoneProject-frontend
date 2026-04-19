/**
 * Comprehensive word-to-emoji mapping for children's Cantonese vocabulary.
 * Used by both the image-generation API route and game-component fallbacks
 * to show a *correct* emoji instantly instead of a random/hash-based one.
 */

// ── Cantonese → Emoji (direct character lookup) ──────────────────────────
const CANTONESE_TO_EMOJI: Record<string, string> = {
  // Animals
  貓: "🐱", 貓咪: "🐱", 狗: "🐶", 狗狗: "🐶", 小狗: "🐶",
  鳥: "🐦", 雀: "🐦", 雀仔: "🐦", 魚: "🐟", 金魚: "🐟",
  兔: "🐰", 兔仔: "🐰", 白兔: "🐰", 熊: "🐻", 熊人: "🐻",
  象: "🐘", 大象: "🐘", 獅: "🦁", 獅子: "🦁",
  猴: "🐵", 馬騮: "🐵", 猴子: "🐵", 馬: "🐴",
  牛: "🐄", 豬: "🐷", 雞: "🐔", 鴨: "🦆",
  蛙: "🐸", 青蛙: "🐸", 蛇: "🐍", 龜: "🐢", 烏龜: "🐢",
  鼠: "🐭", 老鼠: "🐭", 虎: "🐯", 老虎: "🐯",
  羊: "🐑", 山羊: "🐐", 蝴蝶: "🦋", 蜜蜂: "🐝",
  螞蟻: "🐜", 企鵝: "🐧", 海豚: "🐬", 鯨: "🐳", 鯨魚: "🐳",
  蝸牛: "🐌", 熊貓: "🐼", 狐狸: "🦊", 貓頭鷹: "🦉",
  長頸鹿: "🦒", 斑馬: "🦓", 鱷魚: "🐊", 蟹: "🦀",
  蝦: "🦐", 鹿: "🦌", 猩猩: "🦍", 駱駝: "🐫",
  公雞: "🐓", 小雞: "🐤", 鷹: "🦅", 鸚鵡: "🦜",
  天鵝: "🦢", 孔雀: "🦚", 恐龍: "🦕", 龍: "🐉",
  甲蟲: "🐞", 蟲: "🐛", 刺蝟: "🦔", 蝙蝠: "🦇",
  河馬: "🦛", 犀牛: "🦏", 動物: "🐾",

  // Food & Drinks
  蘋果: "🍎", 香蕉: "🍌", 橙: "🍊", 士多啤梨: "🍓", 草莓: "🍓",
  提子: "🍇", 葡萄: "🍇", 西瓜: "🍉", 桃: "🍑", 桃子: "🍑",
  車厘子: "🍒", 櫻桃: "🍒", 檸檬: "🍋", 菠蘿: "🍍",
  芒果: "🥭", 奇異果: "🥝", 椰子: "🥥", 牛油果: "🥑",
  番茄: "🍅", 西紅柿: "🍅", 粟米: "🌽", 玉米: "🌽",
  蘿蔔: "🥕", 紅蘿蔔: "🥕", 薯仔: "🥔", 馬鈴薯: "🥔",
  洋蔥: "🧅", 蒜: "🧄", 辣椒: "🌶️", 青瓜: "🥒",
  西蘭花: "🥦", 蘑菇: "🍄", 菜: "🥬", 生菜: "🥬",
  麵包: "🍞", 蛋糕: "🎂", 曲奇: "🍪", 糖: "🍬", 糖果: "🍬",
  朱古力: "🍫", 巧克力: "🍫", 雪糕: "🍦", 冰淇淋: "🍦",
  薄餅: "🍕", 披薩: "🍕", 漢堡包: "🍔", 漢堡: "🍔",
  三文治: "🥪", 三明治: "🥪", 飯: "🍚", 白飯: "🍚",
  麵: "🍜", 公仔麵: "🍜", 湯: "🍲", 蛋: "🥚", 雞蛋: "🥚",
  奶: "🥛", 牛奶: "🥛", 果汁: "🧃", 水: "💧",
  茶: "🍵", 咖啡: "☕", 壽司: "🍣", 點心: "🥟", 餃子: "🥟",
  豆腐: "🧊", 芝士: "🧀", 蜜糖: "🍯", 鹽: "🧂",
  冬甩: "🍩", 爆谷: "🍿", 班戟: "🥞", 肉: "🍖",
  雞翼: "🍗", 牛排: "🥩", 煙肉: "🥓",
  生果: "🍎", 水果: "🍎", 蔬菜: "🥬", 食物: "🍽️",
  飲品: "🥤", 零食: "🍿", 米飯: "🍚", 炒飯: "🍚",

  // Body parts
  眼: "👁️", 眼睛: "👀", 鼻: "👃", 鼻子: "👃",
  口: "👄", 嘴: "👄", 嘴巴: "👄", 耳: "👂", 耳朵: "👂",
  手: "✋", 腳: "🦶", 頭: "🗣️", 面: "😊", 臉: "😊",
  牙: "🦷", 牙齒: "🦷", 心: "❤️", 心臟: "❤️",
  手指: "👆", 舌: "👅", 舌頭: "👅", 頭髮: "💇",
  肌肉: "💪", 身體: "🧍", 骨: "🦴", 腦: "🧠",

  // Objects & Things
  波: "⚽", 球: "⚽", 足球: "⚽", 籃球: "🏀",
  書: "📖", 書本: "📖", 筆: "✏️", 鉛筆: "✏️",
  袋: "🎒", 書包: "🎒", 椅: "🪑", 椅子: "🪑",
  枱: "🪑", 桌: "🪑", 桌子: "🪑", 床: "🛏️",
  門: "🚪", 窗: "🪟", 窗戶: "🪟", 鐘: "🕐",
  電話: "📱", 手機: "📱", 電腦: "💻", 電視: "📺",
  車: "🚗", 汽車: "🚗", 巴士: "🚌", 單車: "🚲",
  火車: "🚂", 飛機: "✈️", 船: "⛵", 火箭: "🚀",
  遮: "☂️", 雨傘: "☂️", 帽: "🎩", 帽子: "🎩",
  鞋: "👟", 鞋子: "👟", 衫: "👕", 褲: "👖", 裙: "👗",
  外套: "🧥", 杯: "☕", 杯子: "☕", 碗: "🥣", 碟: "🍽️",
  匙: "🥄", 匙羹: "🥄", 叉: "🍴", 刀: "🔪",
  筷子: "🥢", 鎖匙: "🔑", 鑰匙: "🔑", 燈: "💡",
  相機: "📷", 結他: "🎸", 琴: "🎹", 鼓: "🥁",
  鈴: "🔔", 禮物: "🎁", 氣球: "🎈", 風箏: "🪁",
  玩具: "🧸", 公仔: "🧸", 熊仔: "🧸", 機器人: "🤖", 機械人: "🤖", 箱: "📦",
  積木: "🧱", 蠟筆: "🖍️", 間尺: "📏", 擦膠: "🧽", 膠水: "🧴",
  剪刀: "✂️", 紙: "📄", 油: "🎨", 刷: "🖌️",
  梘: "🧼", 肥皂: "🧼", 牙刷: "🪥", 毛巾: "🧣",

  // Nature & Weather
  太陽: "☀️", 日: "☀️", 月: "🌙", 月亮: "🌙",
  星: "⭐", 星星: "⭐", 雲: "☁️", 雨: "🌧️",
  雪: "❄️", 風: "💨", 彩虹: "🌈", 花: "🌸",
  玫瑰: "🌹", 向日葵: "🌻", 樹: "🌳", 草: "🌿",
  葉: "🍃", 山: "🏔️", 河: "🏞️", 海: "🌊",
  湖: "🏞️", 天: "🌤️", 天空: "🌤️", 火: "🔥",
  石: "🪨", 石頭: "🪨", 沙: "🏖️", 島: "🏝️",
  地球: "🌍", 森林: "🌲", 花園: "🌻", 閃電: "⚡",
  暴風雨: "⛈️", 龍捲風: "🌪️", 日出: "🌅", 日落: "🌇",
  浪: "🌊",

  // Colors
  紅: "🔴", 紅色: "🔴", 藍: "🔵", 藍色: "🔵",
  綠: "🟢", 綠色: "🟢", 黃: "🟡", 黃色: "🟡",
  紫: "🟣", 紫色: "🟣", 橙色: "🟠",
  黑: "⚫", 黑色: "⚫", 白: "⚪", 白色: "⚪",
  粉紅: "🩷", 粉紅色: "🩷", 啡色: "🟤", 棕色: "🟤",

  // Actions & Verbs
  跑: "🏃", 跑步: "🏃", 跳: "🤸", 跳躍: "🤸",
  行: "🚶", 行路: "🚶", 走路: "🚶", 坐: "🪑", 企: "🧍",
  食: "🍽️", 食嘢: "🍽️", 飲: "🥤", 瞓: "😴",
  瞓覺: "😴", 睡: "😴", 睡覺: "😴",
  跳舞: "💃", 讀: "📖", 讀書: "📚", 寫: "✍️", 寫字: "✍️",
  唱: "🎤", 唱歌: "🎤", 游水: "🏊", 游泳: "🏊",
  飛: "✈️", 拍手: "👏", 笑: "😊", 微笑: "😊",
  喊: "😢", 哭: "😢", 嗌: "😠", 想: "🤔",
  玩: "🎮", 畫: "🎨", 畫畫: "🎨", 煮: "👨‍🍳", 煮飯: "👨‍🍳",
  洗: "🧼", 開: "📂", 閂: "📁", 掟: "🤾",
  接: "🤲", 踢: "🦶", 揈手: "👋", 攬: "🤗",
  錫: "😘", 傾偈: "🗣️", 聽: "👂", 睇: "👁️",
  學: "📖", 教: "👩‍🏫", 做嘢: "💼", 買: "🛒", 賣: "🏷️",
  拍: "📸", 影相: "📷", 揸車: "🚗", 踩單車: "🚲",

  // People & Family
  媽媽: "👩", 爸爸: "👨", 阿媽: "👩", 阿爸: "👨",
  哥哥: "👦", 家姐: "👧", 姐姐: "👧", 弟弟: "👦", 妹妹: "👧",
  BB: "👶", 嬰兒: "👶", 細路: "🧒", 小朋友: "🧒",
  男仔: "👦", 女仔: "👧", 男人: "👨", 女人: "👩",
  家人: "👪", 阿嫲: "👵", 阿爺: "👴",
  朋友: "🧑‍🤝‍🧑", 老師: "👩‍🏫", 醫生: "👩‍⚕️", 警察: "👮",
  國王: "🤴", 皇后: "👸", 王子: "🤴", 公主: "👸",

  // Places & Buildings
  屋: "🏠", 屋企: "🏠", 家: "🏠", 學校: "🏫",
  醫院: "🏥", 舖頭: "🏪", 商店: "🏪", 餐廳: "🍽️",
  圖書館: "📚", 動物園: "🦁", 街市: "🏪",
  公園: "🏞️", 沙灘: "🏖️", 城市: "🏙️",
  農場: "🌾", 機場: "✈️", 酒店: "🏨",
  戲院: "🎬", 博物館: "🏛️", 遊樂場: "🛝",
  課室: "🏫", 廚房: "🍳", 廁所: "🚽", 睡房: "🛏️",
  客廳: "🏠", 飯廳: "🍽️",

  // Emotions & Feelings
  開心: "😊", 唔開心: "😢", 嬲: "😠", 驚: "😨",
  攰: "😴", 肚餓: "🤤", 口渴: "🥤", 病: "🤒",
  鍾意: "❤️", 愛: "❤️", 興奮: "🤩", 悶: "😑",
  擔心: "😟", 緊張: "😰", 驕傲: "🥹", 怕醜: "🫣",

  // Time & Numbers
  早晨: "🌅", 下晝: "🌤️", 夜晚: "🌙", 今日: "📅",
  聽日: "📆", 尋日: "📅", 生日: "🎂",

  // Adjectives
  大: "🔺", 細: "🔹", 熱: "🔥", 凍: "🥶",
  新: "✨", 舊: "📜", 快: "⚡", 慢: "🐌",
  靚: "✨", 多: "➕", 少: "➖", 高: "⬆️",
  矮: "⬇️", 長: "📏", 短: "📐",

  // Greetings & Common phrases
  你好: "👋", 再見: "👋", 多謝: "🙏", 唔該: "🙏",
  對唔住: "🙏",
};

// ── English → Emoji ──────────────────────────────────────────────────────
const ENGLISH_TO_EMOJI: Record<string, string> = {
  // Animals
  cat: "🐱", kitten: "🐱", kitty: "🐱", dog: "🐶", puppy: "🐶",
  bird: "🐦", fish: "🐟", goldfish: "🐟",
  rabbit: "🐰", bunny: "🐰", bear: "🐻",
  elephant: "🐘", lion: "🦁", monkey: "🐵",
  horse: "🐴", cow: "🐄", pig: "🐷",
  chicken: "🐔", duck: "🦆", frog: "🐸",
  snake: "🐍", turtle: "🐢", mouse: "🐭", rat: "🐭",
  tiger: "🐯", sheep: "🐑", goat: "🐐",
  butterfly: "🦋", bee: "🐝", ant: "🐜",
  spider: "🕷️", penguin: "🐧", dolphin: "🐬",
  whale: "🐳", octopus: "🐙", snail: "🐌",
  panda: "🐼", koala: "🐨", fox: "🦊",
  owl: "🦉", giraffe: "🦒", zebra: "🦓",
  crocodile: "🐊", alligator: "🐊", crab: "🦀",
  shrimp: "🦐", lobster: "🦞", squid: "🦑",
  deer: "🦌", gorilla: "🦍", camel: "🐫",
  rooster: "🐓", hen: "🐔", chick: "🐤",
  eagle: "🦅", parrot: "🦜", flamingo: "🦩",
  swan: "🦢", peacock: "🦚", dinosaur: "🦕",
  dragon: "🐉", ladybug: "🐞", worm: "🪱",
  hedgehog: "🦔", bat: "🦇", hippo: "🦛",
  rhinoceros: "🦏", rhino: "🦏", animal: "🐾",
  hamster: "🐹", squirrel: "🐿️", seal: "🦭",
  shark: "🦈", starfish: "⭐", seahorse: "🐴",

  // Food & Drinks
  apple: "🍎", banana: "🍌", orange: "🍊",
  strawberry: "🍓", grape: "🍇", grapes: "🍇",
  watermelon: "🍉", peach: "🍑", cherry: "🍒",
  lemon: "🍋", pineapple: "🍍", mango: "🥭",
  kiwi: "🥝", coconut: "🥥", avocado: "🥑",
  tomato: "🍅", corn: "🌽", carrot: "🥕",
  potato: "🥔", onion: "🧅", garlic: "🧄",
  pepper: "🌶️", cucumber: "🥒", lettuce: "🥬",
  broccoli: "🥦", mushroom: "🍄", vegetable: "🥬",
  bread: "🍞", cake: "🎂", cookie: "🍪",
  candy: "🍬", chocolate: "🍫", "ice cream": "🍦",
  icecream: "🍦", pizza: "🍕", hamburger: "🍔", burger: "🍔",
  "hot dog": "🌭", hotdog: "🌭", sandwich: "🥪",
  taco: "🌮", burrito: "🌯", rice: "🍚",
  noodle: "🍜", noodles: "🍜", soup: "🍲",
  egg: "🥚", milk: "🥛", juice: "🧃",
  water: "💧", tea: "🍵", coffee: "☕",
  sushi: "🍣", dumpling: "🥟", "dim sum": "🥟",
  cheese: "🧀", butter: "🧈", honey: "🍯",
  salt: "🧂", pie: "🥧", donut: "🍩", doughnut: "🍩",
  popcorn: "🍿", pancake: "🥞", waffle: "🧇",
  meat: "🍖", steak: "🥩", bacon: "🥓",
  fruit: "🍎", food: "🍽️", drink: "🥤", snack: "🍿",
  "fried rice": "🍚", "fried egg": "🍳",

  // Body parts
  eye: "👁️", eyes: "👀", nose: "👃", mouth: "👄",
  ear: "👂", hand: "✋", hands: "🙌", foot: "🦶",
  feet: "🦶", head: "🗣️", face: "😊",
  tooth: "🦷", teeth: "🦷", finger: "👆",
  arm: "💪", leg: "🦵", brain: "🧠",
  heart: "❤️", bone: "🦴", tongue: "👅",
  hair: "💇", muscle: "💪", body: "🧍",

  // Objects & Things
  ball: "⚽", soccer: "⚽", football: "🏈",
  basketball: "🏀", baseball: "⚾", tennis: "🎾",
  book: "📖", books: "📚", pen: "🖊️", pencil: "✏️",
  bag: "🎒", backpack: "🎒", chair: "🪑",
  table: "🪑", desk: "🪑", bed: "🛏️",
  door: "🚪", window: "🪟", clock: "🕐", watch: "⌚",
  phone: "📱", telephone: "📞", computer: "💻",
  tv: "📺", television: "📺",
  car: "🚗", bus: "🚌", bicycle: "🚲", bike: "🚲",
  train: "🚂", airplane: "✈️", plane: "✈️",
  boat: "⛵", ship: "🚢", rocket: "🚀",
  umbrella: "☂️", hat: "🎩", cap: "🧢",
  shoe: "👟", shoes: "👟", shirt: "👕",
  pants: "👖", dress: "👗", coat: "🧥", jacket: "🧥",
  cup: "☕", glass: "🥤", bottle: "🍼",
  bowl: "🥣", plate: "🍽️", spoon: "🥄",
  fork: "🍴", knife: "🔪", chopsticks: "🥢",
  key: "🔑", lock: "🔒", lamp: "💡", light: "💡",
  mirror: "🪞", camera: "📷", guitar: "🎸",
  piano: "🎹", drum: "🥁", violin: "🎻",
  bell: "🔔", gift: "🎁", present: "🎁",
  balloon: "🎈", kite: "🪁", toy: "🧸",
  doll: "🪆", robot: "🤖", teddy: "🧸", "teddy bear": "🧸",
  blocks: "🧱", block: "🧱", "building blocks": "🧱",
  box: "📦", scissors: "✂️", paper: "📄",
  crayon: "🖍️", brush: "🖌️", paint: "🎨",
  ruler: "📏", eraser: "🧽", glue: "🧴",
  soap: "🧼", toothbrush: "🪥", towel: "🧣",
  money: "💰", coin: "🪙", ring: "💍",
  map: "🗺️", flag: "🚩", ticket: "🎫",

  // Nature & Weather
  sun: "☀️", moon: "🌙", star: "⭐", stars: "✨",
  cloud: "☁️", rain: "🌧️", snow: "❄️", snowflake: "❄️",
  wind: "💨", rainbow: "🌈",
  flower: "🌸", flowers: "💐", rose: "🌹",
  sunflower: "🌻", tulip: "🌷",
  tree: "🌳", trees: "🌲", grass: "🌿",
  leaf: "🍃", leaves: "🍂",
  mountain: "🏔️", river: "🏞️", sea: "🌊", ocean: "🌊",
  lake: "🏞️", sky: "🌤️", fire: "🔥",
  rock: "🪨", stone: "🪨", sand: "🏖️",
  island: "🏝️", volcano: "🌋", earth: "🌍", world: "🌍",
  forest: "🌲", garden: "🌻", park: "🏞️",
  beach: "🏖️", desert: "🏜️",
  lightning: "⚡", thunder: "⚡", storm: "⛈️",
  tornado: "🌪️", sunrise: "🌅", sunset: "🌇", wave: "🌊",

  // Colors
  red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡",
  purple: "🟣", orange_color: "🟠",
  black: "⚫", white: "⚪", pink: "🩷", brown: "🟤",
  gold: "🥇", silver: "🥈", color: "🎨", colour: "🎨",

  // Actions & Verbs
  run: "🏃", running: "🏃", jump: "🤸", jumping: "🤸",
  walk: "🚶", walking: "🚶", sit: "🪑", stand: "🧍",
  "eat food": "🍽️", eating: "🍽️", "have a drink": "🥤", drinking: "🥤",
  sleep: "😴", sleeping: "😴", dance: "💃", dancing: "💃",
  read: "📖", reading: "📖", write: "✍️", writing: "✍️",
  sing: "🎤", singing: "🎤", swim: "🏊", swimming: "🏊",
  fly: "✈️", flying: "✈️", clap: "👏", clapping: "👏",
  smile: "😊", smiling: "😊", cry: "😢", crying: "😢",
  laugh: "😂", laughing: "😂", think: "🤔", thinking: "🤔",
  play: "🎮", playing: "🎮", draw: "🎨", drawing: "🎨",
  cook: "👨‍🍳", cooking: "👨‍🍳", clean: "🧹", cleaning: "🧹",
  wash: "🧼", washing: "🧼", open: "📂", close: "📁",
  throw: "🤾", catch: "🤲", kick: "🦶",
  hug: "🤗", kiss: "😘", push: "🫸", pull: "🫷",
  climb: "🧗", drive: "🚗", ride: "🏇",
  cut: "✂️", talk: "🗣️", talking: "🗣️",
  listen: "👂", listening: "👂", look: "👁️",
  see: "👁️", hear: "👂", study: "📚",
  learn: "📖", teach: "👩‍🏫", work: "💼",
  buy: "🛒", shopping: "🛒", sell: "🏷️",
  waving: "👋",

  // People & Family
  mother: "👩", mom: "👩", mama: "👩", mum: "👩",
  father: "👨", dad: "👨", papa: "👨",
  parent: "👪", brother: "👦", sister: "👧",
  baby: "👶", child: "🧒", boy: "👦", girl: "👧",
  man: "👨", woman: "👩", family: "👪",
  grandmother: "👵", grandma: "👵",
  grandfather: "👴", grandpa: "👴",
  friend: "🧑‍🤝‍🧑", teacher: "👩‍🏫",
  doctor: "👩‍⚕️", police: "👮", policeman: "👮",
  king: "🤴", queen: "👸", prince: "🤴", princess: "👸",
  farmer: "🧑‍🌾", firefighter: "🧑‍🚒", pilot: "🧑‍✈️",

  // Places & Buildings
  house: "🏠", home: "🏠", school: "🏫",
  hospital: "🏥", store: "🏪", shop: "🏪",
  restaurant: "🍽️", church: "⛪", temple: "🛕",
  library: "📚", zoo: "🦁", market: "🏪",
  city: "🏙️", town: "🏘️", building: "🏢",
  castle: "🏰", farm: "🌾", factory: "🏭",
  station: "🚉", airport: "✈️", hotel: "🏨",
  museum: "🏛️", cinema: "🎬", theater: "🎭",
  stadium: "🏟️", playground: "🛝",
  classroom: "🏫", office: "🏢", room: "🏠",
  kitchen: "🍳", bathroom: "🛁", bedroom: "🛏️",

  // Emotions & Feelings
  happy: "😊", sad: "😢", angry: "😠",
  scared: "😨", surprised: "😮", tired: "😴",
  hungry: "🤤", thirsty: "🥤", sick: "🤒",
  love: "❤️", like: "👍", excited: "🤩",
  bored: "😑", worried: "😟", nervous: "😰",
  proud: "🥹", shy: "🫣", lonely: "😔", brave: "💪",

  // Sports & Games
  game: "🎮", sport: "🏅", trophy: "🏆", medal: "🥇",
  volleyball: "🏐", badminton: "🏸",

  // Music & Art
  music: "🎵", song: "🎶", art: "🎨",
  picture: "🖼️", photo: "📸", movie: "🎬", story: "📖",

  // Adjectives & Misc
  big: "🔺", small: "🔹", hot: "🔥", cold: "🥶",
  new: "✨", old: "📜", fast: "⚡", slow: "🐌",
  up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️",
  hello: "👋", goodbye: "👋", "thank you": "🙏",
  thanks: "🙏", sorry: "🙏", please: "🙏",
  help: "🆘", stop: "🛑", go: "🟢",
  day: "☀️", night: "🌙", morning: "🌅", afternoon: "🌤️",
  evening: "🌆", birthday: "🎂", party: "🎉",
  christmas: "🎄", festival: "🎊",
  magic: "✨", treasure: "💎", crown: "👑",
  number: "🔢", letter: "🔤", word: "📝",
  yes: "✅", no: "❌", good: "👍", bad: "👎",
  tall: "⬆️", short: "⬇️", long: "📏",
  heavy: "🏋️", tidy: "✨", dirty: "💩",
  beautiful: "✨", ugly: "👎", strong: "💪", weak: "😩",
};

// ── Normalise helper ─────────────────────────────────────────────────────
function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s\-_.,!?;:'"()（）「」『』，。！？、；：]+/g, "");
}

/**
 * Try to find a matching emoji for the given word / Cantonese word pair.
 *
 * Priority:
 *  1. Direct Cantonese lookup (instant, no network)
 *  2. Direct English lookup  (instant, no network)
 *  3. null – caller should fall back to translation or generic icon
 */
export function lookupEmoji(
  englishWord?: string,
  cantoneseWord?: string,
): string | null {
  // 1. Try Cantonese direct match (exact → normalised)
  if (cantoneseWord) {
    const raw = cantoneseWord.trim();
    if (CANTONESE_TO_EMOJI[raw]) return CANTONESE_TO_EMOJI[raw];
    const n = norm(raw);
    if (CANTONESE_TO_EMOJI[n]) return CANTONESE_TO_EMOJI[n];
    // Try substrings ≥ 1 char (e.g. "隻貓" → "貓")
    for (const [key, emoji] of Object.entries(CANTONESE_TO_EMOJI)) {
      if (n.includes(key) || key.includes(n)) return emoji;
    }
  }

  // 2. Try English direct match (exact → normalised)
  if (englishWord) {
    const raw = englishWord.trim().toLowerCase();
    if (ENGLISH_TO_EMOJI[raw]) return ENGLISH_TO_EMOJI[raw];
    const n = norm(raw);
    if (ENGLISH_TO_EMOJI[n]) return ENGLISH_TO_EMOJI[n];
    // Try partial – e.g. "a red apple" → "apple"
    for (const [key, emoji] of Object.entries(ENGLISH_TO_EMOJI)) {
      if (n.includes(key) || key.includes(n)) return emoji;
    }
  }

  return null;
}

/**
 * Same as lookupEmoji but guaranteed to return *something*.
 * Falls back to a category-coloured circle or generic icon.
 */
export function lookupEmojiOrFallback(
  englishWord?: string,
  cantoneseWord?: string,
): string {
  return lookupEmoji(englishWord, cantoneseWord) ?? "🎨";
}
