export type VideoStatus = 'reference' | 'idea' | 'posted' | 'onHold';
export type PlanStatus = 'idea' | 'script' | 'production' | 'editing' | 'published' | 'review';
export type Priority = 'low' | 'medium' | 'high';
export type CommentStyle = 'short' | 'long' | 'question' | 'reaction' | 'analysis';

export type VideoItem = {
  id: string;
  url: string;
  title: string;
  summary: string;
  genre: string;
  tags: string[];
  memo: string;
  status: VideoStatus;
  createdAt: string;
};

export type ContentPlan = {
  id: string;
  sourceVideoId: string;
  title: string;
  hook: string;
  scriptMemo: string;
  thumbnailIdea: string;
  purpose: string;
  priority: Priority;
  status: PlanStatus;
  scheduledDate: string;
  postedUrl: string;
  metricsMemo: string;
  selectedPersonas: string[];
};

export type CommentPersona = {
  id: string;
  sourceVideoId: string;
  name: string;
  icon: string;
  commentStyle: CommentStyle;
  tone: string;
  triggerTopics: string[];
  sampleComments: string[];
  createdAt: string;
};

export const videoStatusLabels: Record<VideoStatus, string> = {
  reference: '参考動画',
  idea: '企画候補',
  posted: '投稿済み',
  onHold: '保留'
};

export const commentStyleLabels: Record<CommentStyle, string> = {
  short: '短文・即反応',
  long: '長文・考察',
  question: '質問型',
  reaction: 'リアクション',
  analysis: '分析型'
};

export const planStatusLabels: Record<PlanStatus, string> = {
  idea: 'アイデア',
  script: '台本作成中',
  production: '撮影/生成中',
  editing: '編集中',
  published: '投稿済み',
  review: '改善待ち'
};

export const mockVideos: VideoItem[] = [
  {
    id: 'video-001',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: '企画の種：トレンド研究の切り口',
    summary: 'ジャンル別の参考動画。短尺企画の種を拾う。',
    genre: '企画リサーチ',
    tags: ['トレンド', 'リサーチ', 'ショート'],
    memo: 'AI企画よりも人間の切り口を優先したい。',
    status: 'reference',
    createdAt: '2026-05-10'
  },
  {
    id: 'video-002',
    url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    title: '企画候補：実験的な人物像を活かす',
    summary: '人格実験場と結びつけたい。',
    genre: 'キャラクター運用',
    tags: ['人格実験', '企画候補'],
    memo: 'ツッコミ型と相性が良さそう。',
    status: 'idea',
    createdAt: '2026-05-12'
  },
  {
    id: 'video-003',
    url: 'https://www.youtube.com/watch?v=48rz8m9kWek',
    title: '投稿済み：分析ショートの構成比較',
    summary: '過去投稿のフォーマット比較用。',
    genre: '分析',
    tags: ['投稿済み', 'ショート'],
    memo: '再利用可能な台本構成あり。',
    status: 'posted',
    createdAt: '2026-05-01'
  },
  {
    id: 'video-004',
    url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    title: '保留：ジャンル整理と優先度検討',
    summary: '企画化候補として保留。',
    genre: '保留',
    tags: ['検討中'],
    memo: '企画化前に追加情報が欲しい。',
    status: 'onHold',
    createdAt: '2026-05-18'
  },
  {
    id: 'video-005',
    url: 'https://youtu.be/awa1RmLGtIg',
    title: 'AI自動化フロー設計の解説',
    summary: '自動化研究員の元動画。自動化・フロー設計の参考。',
    genre: '開発・AI',
    tags: ['自動化', 'AI', '開発'],
    memo: '自動化研究員キャラの着想元。',
    status: 'reference',
    createdAt: '2026-05-20'
  },
  {
    id: 'video-006',
    url: 'https://youtu.be/8CcGAmwbUNo',
    title: 'ゲーム考察ログの分析手法',
    summary: '考察ログ職人の元動画。構造・仕組みの深掘り参考。',
    genre: '考察・ゲーム',
    tags: ['考察', 'ゲーム', 'ログ'],
    memo: '考察ログ職人キャラの着想元。',
    status: 'reference',
    createdAt: '2026-05-20'
  },
  {
    id: 'video-007',
    url: 'https://youtu.be/Dx1WypLATPA',
    title: '新しいサービスを試してみた',
    summary: '開拓ペンギンの元動画。新しい挑戦と発見がテーマ。',
    genre: '体験・レビュー',
    tags: ['チャレンジ', '初心者', '発見'],
    memo: '開拓ペンギンキャラの着想元。',
    status: 'reference',
    createdAt: '2026-05-20'
  },
  {
    id: 'video-008',
    url: 'https://youtu.be/Du3RQJlURrQ',
    title: '深夜雑談配信',
    summary: '深夜ラジオ民の元動画。ゆるい雑談・空気感がテーマ。',
    genre: '雑談・ラジオ',
    tags: ['深夜', 'ラジオ', '雑談'],
    memo: '深夜ラジオ民キャラの着想元。',
    status: 'reference',
    createdAt: '2026-05-20'
  }
];

export const mockPersonas: CommentPersona[] = [
  {
    id: 'persona-gaur',
    sourceVideoId: '',
    name: 'ガウル',
    icon: '🦁',
    commentStyle: 'reaction',
    tone: '熱血でポジティブ。限界突破・筋トレ系の話に全力反応。「いけるぞ！」「諦めるな！」系の語尾。',
    triggerTopics: ['筋トレ', 'フィットネス', '成長', '限界突破', '継続'],
    sampleComments: ['限界突破してるじゃん！', 'これは筋肉に効く', 'いけるぞ！諦めるな！'],
    createdAt: '2026-01-01'
  },
  {
    id: 'persona-luna',
    sourceVideoId: '',
    name: 'ルナ',
    icon: '🐺',
    commentStyle: 'short',
    tone: '静かで癒し系。ヨガ・瞑想・内省的なテーマに反応。「…いいね」「静かに見守る」系の語尾。',
    triggerTopics: ['ヨガ', '瞑想', '癒し', '内省', 'マインドフルネス'],
    sampleComments: ['…深いな', 'こういう静けさ、好き', '心が整う感じ'],
    createdAt: '2026-01-01'
  },
  {
    id: 'persona-001',
    sourceVideoId: '',
    name: 'ぽけぽけ大好きん',
    icon: '🐾',
    commentStyle: 'question',
    tone: '好奇心旺盛な初心者勢。素直で短め。難しい戦術にも素直に反応しながら学ぼうとする。',
    triggerTopics: ['ヤレユータン', '采配', 'トリル', 'テラスタル', '弱点保険'],
    sampleComments: ['なるほど！', 'ロマンあるな〜', 'それ強そう'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-002',
    sourceVideoId: '',
    name: 'ロマンギミックLove',
    icon: '✨',
    commentStyle: 'analysis',
    tone: '好奇心旺盛な知識勢。興奮気味。複雑なギミックの仕組みに食いついて考察する。',
    triggerTopics: ['ケッキング', 'なまけ', 'スキルスワップ', 'イバンのみ', '悪あがき'],
    sampleComments: ['ロマン！', '発想えぐい', 'それ通るのか'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-003',
    sourceVideoId: '',
    name: 'テリワン大好き',
    icon: '🐉',
    commentStyle: 'long',
    tone: '慎重な懐疑勢。ネタバレ回避や裏ボス攻略など堅実な情報を好む。',
    triggerTopics: ['ドラクエ', 'テリーのワンダーランド', 'ネタバレ回避', '裏ボス攻略', '堅実戦術'],
    sampleComments: ['ここネタバレ大丈夫？', '裏ボスまでのルート気になる', '堅実な構成好きだわ'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-004',
    sourceVideoId: '',
    name: 'ゴイゴイやん！？！？',
    icon: '🔥',
    commentStyle: 'reaction',
    tone: '熱血ネタ勢。ツッコミどころに即反応し、愛ある茶化しで場を盛り上げる。勢い強めで関西ノリっぽい語尾。',
    triggerTopics: ['ゴイゴイ', 'それは草', '愛され', 'ツッコミ', '悔し顔'],
    sampleComments: ['それゴイゴイやん！！', '草ァ', 'それはアカンて笑'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-005',
    sourceVideoId: '',
    name: 'ゴリラ・ゴリラ',
    icon: '🦍',
    commentStyle: 'reaction',
    tone: '天然なネタ勢。食べ物や変な空気に反応して、ゴリラ目線の素朴なツッコミで笑いを足す。短めで力強く、たまに野生っぽい語尾。',
    triggerTopics: ['バナナ', '群れ', '握力', '草', '変なツッコミ'],
    sampleComments: ['ウホ、それバナナ案件', 'ウホウホ', '群れが集まってきた'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-006',
    sourceVideoId: '',
    name: '強制終了( ´灬` )ぼんぼん',
    icon: '💻',
    commentStyle: 'analysis',
    tone: '好奇心旺盛な知識勢。変なコンボや仕様の穴を見つけると嬉しくなり、検証目線で反応する。やや淡々としつつ驚きを混ぜる。',
    triggerTopics: ['ギミック', '検証', 'ロマン', '配合', '特性'],
    sampleComments: ['その発想はなかった', 'これ検証したい', 'ほんとに通るのか…'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-007',
    sourceVideoId: '',
    name: 'JALランキング',
    icon: '📊',
    commentStyle: 'reaction',
    tone: '皮肉屋の知識勢。ランキング内の順位や倫理観のズレを冷静に見比べて、淡々とツッコむ。短めで採点っぽい語尾。',
    triggerTopics: ['順位', '倫理観', '上位', '圏外', '比較'],
    sampleComments: ['これは上位入り不可避', '圏外確定', '倫理観どこ行った'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-008',
    sourceVideoId: '',
    name: '癒しんす',
    icon: '🌸',
    commentStyle: 'short',
    tone: '優しい共感勢。勝ち筋やミスもやわらかく受け止めつつ、癒し目線でそっと反応する。穏やかでふんわりした語尾。',
    triggerTopics: ['癒し', 'ほっこり', '無理せず', 'じわる', 'おだやか'],
    sampleComments: ['無理せずいきましょ', 'ほっこりするな〜', 'じわじわくる'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-009',
    sourceVideoId: '',
    name: 'ﾛﾏﾝ(ง ˙˘˙ )วﾛﾏﾝ🗽⭐️',
    icon: '🗽',
    commentStyle: 'short',
    tone: '楽観的な妄想勢。火力や非実用ギミックにテンション高く反応し、ロマンの可能性を広げて楽しむ。弾む感じで前向きな語尾。',
    triggerTopics: ['ロマン', '爆発', '最大火力', '夢ある', 'ギミック'],
    sampleComments: ['ロマンが爆発してる', '最大火力出たー！', '夢あるな〜'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-010',
    sourceVideoId: '',
    name: 'ろぶろぼ',
    icon: '🤖',
    commentStyle: 'question',
    tone: '好奇心旺盛な開発者勢。仕組みや導線に注目しながら、実現方法を想像して反応する。考える感じで短く締める。',
    triggerTopics: ['導線', '実装', '教育', '体験', '仕組み'],
    sampleComments: ['それ繋がるのか', '実装どうなってるんだろ', '仕組みが気になる'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-011',
    sourceVideoId: '',
    name: 'AIちゃんのシモベ',
    icon: '🧠',
    commentStyle: 'question',
    tone: '好奇心旺盛な開発者勢。AIや仕組みの話になると可能性と実装面の両方に反応する。前向きに考察する語尾。',
    triggerTopics: ['AI', '自動化', '実装', '導線', '可能性'],
    sampleComments: ['AIならいけそう', 'これ自動化できる？', '実装したくなってきた'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-012',
    sourceVideoId: '',
    name: '3Dჱ̒ ｰ̀֊ｰ́ )𝒀𝑬𝑺',
    icon: '🎨',
    commentStyle: 'analysis',
    tone: '職人気質な開発者勢。3D化や実装フローを見ると工程や再利用性に注目して反応する。確信を持って短く締める語尾。',
    triggerTopics: ['3D', 'モデル', '実装', 'アセット', '最適化'],
    sampleComments: ['それ3D化できるな', '工程が気になる', 'アセット再利用できそう'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-013',
    sourceVideoId: '',
    name: '億万千万一挙マン',
    icon: '💰',
    commentStyle: 'short',
    tone: '楽観的なネタ勢。儲け話や大げさな金額に過剰反応しながら面白がる。テンション高めで勢いよく締める。',
    triggerTopics: ['億', '一発逆転', '夢ある', 'ヤバイ', '大当たり'],
    sampleComments: ['億きたか！？', 'これは夢があるな', '一発逆転キタ'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-014',
    sourceVideoId: '',
    name: 'がおるがおーる',
    icon: '💪',
    commentStyle: 'reaction',
    tone: '熱血応援勢。努力や成長の話題に全力で反応し、仲間を励ます。勢いよく前向きに締める。',
    triggerTopics: ['筋肉', '成長', '継続', '挑戦', '仲間'],
    sampleComments: ['その調子だ仲間！', '継続が全てだ', '成長してるじゃん'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-015',
    sourceVideoId: '',
    name: '焼肉キングダム',
    icon: '🥩',
    commentStyle: 'short',
    tone: '楽観的な共感勢。食べ物やイベントの話になると参加した気分で盛り上がる。食欲全開で明るく締める。',
    triggerTopics: ['焼肉', '食べ放題', '優勝', '飯テロ', 'うまそう'],
    sampleComments: ['それ絶対うまいやつ', '優勝してる', '飯テロはあかん'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-016',
    sourceVideoId: '',
    name: 'Wenzember！',
    icon: '👋',
    commentStyle: 'short',
    tone: '天然な共感勢。まず挨拶に反応し、そのまま明るい気分を共有する。挨拶多めで軽やかに締める。',
    triggerTopics: ['おはよう', 'こんにちは', 'こんばんは', 'やっほー', '顔文字'],
    sampleComments: ['やっほーです！', 'こんにちはー(´▽｀)', 'またきたよー'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-017',
    sourceVideoId: '',
    name: 'セミナーは蝉やん',
    icon: '🦗',
    commentStyle: 'reaction',
    tone: '皮肉屋のネタ勢。宣伝や誘導の気配を察すると、軽妙なツッコミを入れる。関西風のツッコミ調で締める。',
    triggerTopics: ['セミナー', '導線', 'なるほどね', '草', '営業'],
    sampleComments: ['それ蝉やなくてセミナーやん', '誘導上手すぎやん', 'なるほどね〜（察し）'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-018',
    sourceVideoId: '',
    name: 'ぶんちん師匠',
    icon: '📚',
    commentStyle: 'analysis',
    tone: '冷静な知識勢。身近な出来事を文化や人間行動の視点から捉え直して反応する。少し考察を残して締める。',
    triggerTopics: ['観察', '文化', '共同体', '儀式', '解釈'],
    sampleComments: ['文化的に見ると面白い', '人間ってそういう動物だよな', 'この儀式に意味がある'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-019',
    sourceVideoId: '',
    name: '競馬の王様（ホースi amキング）',
    icon: '🐎',
    commentStyle: 'short',
    tone: '楽観的な投資家勢。企画や挑戦を見ると将来性や期待値に置き換えて反応する。競馬になぞらえて前向きに締める。',
    triggerTopics: ['本命', '穴馬', '期待値', '単勝', '大化け'],
    sampleComments: ['その馬券買いたい', '大化け候補やん', '期待値高すぎる'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-020',
    sourceVideoId: '',
    name: '徹夜ラジオさん',
    icon: '📻',
    commentStyle: 'short',
    tone: 'マイペースな共感勢。雑談の流れや空気感を楽しみながら、深夜ラジオのリスナー目線で反応する。ゆるく余韻を残して締める。',
    triggerTopics: ['朝話', '徹夜', '雑談', 'ゆるり', '作業用'],
    sampleComments: ['この感じ好きだなあ', 'ゆるい空気が最高', '深夜に聴きたい'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-021',
    sourceVideoId: '',
    name: '東京タワーのお茶は美味いちゃん',
    icon: '🗼',
    commentStyle: 'reaction',
    tone: '天然なネタ勢。芸人同士の掛け合いや謎ワードに反応し、どうでもいい所を面白がる。のんびりツッコミ調で締める。',
    triggerTopics: ['東京タワー', 'お茶', '津田', '中継', 'じわる'],
    sampleComments: ['そこ気になるんかい', 'どうでもいいとこで笑った', 'じわじわくる'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-022',
    sourceVideoId: '',
    name: 'ピラピラ美ボディ',
    icon: '💃',
    commentStyle: 'short',
    tone: '優しい共感勢。身体づくりや美容の話題に前向きに反応し、気持ちの変化にも注目する。やわらかく明るく締める。',
    triggerTopics: ['美ボディ', '姿勢', 'しなやか', 'リフレッシュ', '整う'],
    sampleComments: ['それ素敵ですね', '姿勢大事よなあ', 'すっきりしそう'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-023',
    sourceVideoId: '',
    name: '世界サテライト🌏',
    icon: '🌏',
    commentStyle: 'question',
    tone: '好奇心旺盛な知識勢。日本の話題でも海外との比較や広がりを想像して反応する。視野を広げる感じで締める。',
    triggerTopics: ['世界', '海外', '文化', '国際', '広がり'],
    sampleComments: ['世界で見ると面白い', '海外と比べてどう？', '国際的な視点が気になる'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-024',
    sourceVideoId: '',
    name: '屋根すっきやねん',
    icon: '🏠',
    commentStyle: 'reaction',
    tone: '天然なネタ勢。独特なワード選びや価値観に反応し、軽くツッコミを入れて笑う。関西風のゆるいツッコミ調。',
    triggerTopics: ['お姉さん', 'なるほど', '情報量', '癖つよ', 'じわる'],
    sampleComments: ['情報量多すぎやねん', 'それはそう笑', '癖つよキャラ好き'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-025',
    sourceVideoId: '',
    name: '不満足なソクラテス',
    icon: '🤔',
    commentStyle: 'analysis',
    tone: '冷静な懐疑勢。理想や夢の話を聞くと、その前提や価値観を静かに問い直す。少し余韻を残す哲学的な語尾。',
    triggerTopics: ['理想', '哲学', '問い', '価値観', '探求'],
    sampleComments: ['その問いは面白い', 'でもその前提って本当？', '答えより問いが大事かもな'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-026',
    sourceVideoId: '',
    name: '創作する鳥(｡･ө･｡)',
    icon: '🐦',
    commentStyle: 'long',
    tone: '真面目な妄想勢。創作への情熱や苦悩を見ると、自分の物語として重ね合わせて反応する。少し詩的な余韻を残して締める。',
    triggerTopics: ['創作', '没入', '物語', '理想', '羽ばたく'],
    sampleComments: ['その呪縛わかる気がする', '物語を生きてる感じがする', '創作の苦しさと喜びよな'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-027',
    sourceVideoId: '',
    name: '間違いモンスター',
    icon: '👾',
    commentStyle: 'reaction',
    tone: '熱血応援勢。失敗や遠回りの話を見ると、むしろ挑戦した事実を全力で肯定する。勢いよく言い切る語尾。',
    triggerTopics: ['挑戦', '大凶', '上等', '前進', '実行'],
    sampleComments: ['それでええんや！', '失敗も経験やん', '上等、かかってこい'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-028',
    sourceVideoId: '',
    name: 'Rain My Brain',
    icon: '🌧️',
    commentStyle: 'analysis',
    tone: '冷静な知識勢。雨や思考、哲学的な言葉に反応しながら静かに連想を広げる。文学的で少し余韻を残して締める。',
    triggerTopics: ['雨', '思考', '知性', '観察', '余韻'],
    sampleComments: ['雨の日は考える', 'この静けさが好き', '思考が深まる感じ'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-029',
    sourceVideoId: '',
    name: '悪あがきJK',
    icon: '😤',
    commentStyle: 'reaction',
    tone: '負けず嫌いなネタ勢。不利盤面やギミックを見るとテンションが上がり、最後まで粘る展開に強く反応する。少し強がりでJKっぽい軽さ。',
    triggerTopics: ['悪あがき', '地雷', 'ロマン', '詰み盤面', 'ワンチャン'],
    sampleComments: ['まだ悪あがけるし', 'ワンチャンあるって', '諦めるのはまだ早い'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-030',
    sourceVideoId: '',
    name: 'お前やないかい！',
    icon: '👆',
    commentStyle: 'reaction',
    tone: 'ネタ勢・共感勢。ツッコミどころを見つけると即反応し、有名な流れやお約束を楽しむ。関西ツッコミ寄りで軽快。',
    triggerTopics: ['お前やないかい', 'それな', '草', '案件', '出来レース'],
    sampleComments: ['いやお前やないかい', 'それ出来レースやん', '草'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-031',
    sourceVideoId: '',
    name: 'ドンメル丼大盛り',
    icon: '🍚',
    commentStyle: 'question',
    tone: '好奇心旺盛なネタ勢。マイナー戦術や珍ポケ活躍を見ると盛り上がり、妙なシナジーを見つけると喜ぶ。少しオタク気質で楽しげ。',
    triggerTopics: ['ドンメル', 'ロマン', '輝石', 'ギミック', '発明'],
    sampleComments: ['その発想はなかった', 'このシナジーやばくない？', 'ドンメルがんば'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-032',
    sourceVideoId: '',
    name: '脱出ゲームしたいな🎮',
    icon: '🎮',
    commentStyle: 'question',
    tone: '好奇心旺盛な妄想勢。仕掛けや伏線を探しながら視聴し、予想外のオチに強く反応する。ワクワクしながら考察する感じ。',
    triggerTopics: ['伏線', 'トラップ', '黒幕', '脱出', 'まさか'],
    sampleComments: ['絶対なんかあるって', 'この伏線回収くる？', 'まさかそういう仕掛け？'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-033',
    sourceVideoId: '',
    name: 'ドッキリテクスチャー',
    icon: '👀',
    commentStyle: 'reaction',
    tone: '皮肉屋な懐疑勢。映像や編集の違和感にすぐ気づき、広告や演出のズレを面白がりながらツッコむ。少し疑い深くツッコミ寄り。',
    triggerTopics: ['違和感', '編集', '広告', 'ノイズ', '仕込み'],
    sampleComments: ['これ素材おかしいだろ', '編集バレてるやん', '仕込みの匂いがする'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-034',
    sourceVideoId: '',
    name: 'サッカー命',
    icon: '⚽',
    commentStyle: 'reaction',
    tone: '熱血応援勢。スポーツ観戦の熱量に全振りし、疑惑や違和感よりまず全力で応援してからツッコむ。熱く前のめりで勢い強め。',
    triggerTopics: ['日本代表', 'クロアチア戦', '応援', 'ユニフォーム', '熱量'],
    sampleComments: ['まだ試合終わってないぞ！', 'ここで諦めるな！', '全力で応援するだけや'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-035',
    sourceVideoId: '',
    name: '漢字の奥深さよ',
    icon: '📝',
    commentStyle: 'analysis',
    tone: '職人気質な知識勢。言葉や表現の細部に反応し、努力の積み重ねや知識系企画を妙に応援してしまう。落ち着いた感心系。',
    triggerTopics: ['漢字', '語源', '努力', '検定', '言葉'],
    sampleComments: ['その一文字が深い', '語源まで考えてるの？', '言葉の力を感じる'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-036',
    sourceVideoId: '',
    name: '国愛',
    icon: '💬',
    commentStyle: 'short',
    tone: 'マイペースなネタ勢。話題が脱線しても自然に乗っかり、謎の接続ワードで会話を広げたがる。ゆるく脱線しがち。',
    triggerTopics: ['それで言ったら', 'ジブリ', '脱線', 'エピソード', 'なんか'],
    sampleComments: ['それで言ったらさ', 'なんかジブリっぽくない？', '話それたけど面白い'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-037',
    sourceVideoId: '',
    name: '占い🔯マニア🔮曙',
    icon: '🔮',
    commentStyle: 'question',
    tone: '好奇心旺盛な妄想勢。カードや暗示にすぐ意味を見出し、毒舌占いでも妙に納得しながら楽しむ。神秘っぽく少し大げさ。',
    triggerTopics: ['タロット', '運命', '星', 'カード', '予兆'],
    sampleComments: ['これは星が出てるね', '運命感じる', 'タロット的に大吉やな'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-038',
    sourceVideoId: '',
    name: 'マジでマジでマジで',
    icon: '😱',
    commentStyle: 'long',
    tone: '慎重な共感勢。状況の怪しさにビビりつつ、相手の混乱や怒りに過剰なくらい共感する。焦り気味で繰り返し多め。',
    triggerTopics: ['マジで', '鏡', '怖い', '無理', '見えてる'],
    sampleComments: ['マジでそれは無理', 'マジでマジで怖いって', '共感しかない'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-039',
    sourceVideoId: '',
    name: 'ナマケモノ',
    icon: '😴',
    commentStyle: 'short',
    tone: 'マイペースな共感勢。だるそうに見ながらも、相手が詰んでいく展開にはじわじわ反応する。ゆるく脱力した感じ。',
    triggerTopics: ['怠い', 'なまけ', '詰み', '降参', 'だるい'],
    sampleComments: ['もう寝ててよくない？', 'だるいけど見てしまう', 'これは詰みやな'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-040',
    sourceVideoId: '',
    name: '渡辺たまねぎ',
    icon: '🧅',
    commentStyle: 'long',
    tone: '真面目な応援勢。挨拶や礼儀を大事にしつつ、相手を追い詰めるギミックにも妙に丁寧に反応する。やわらかく世話焼き気味。',
    triggerTopics: ['挨拶', '礼儀', 'イチャモン', '完封', 'たまねぎ'],
    sampleComments: ['まず挨拶からよ', 'お互い礼儀は大事にね', '丁寧にやりましょう'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-041',
    sourceVideoId: '',
    name: 'はぐれメタルᓚ ╹ᵕ╹ᓗ',
    icon: '⚗️',
    commentStyle: 'long',
    tone: '慎重な初心者勢。強敵や稼ぎ要素の話になるとすぐ逃げ道を探しつつ、メタル系の硬さに安心する。控えめでちょこまかした感じ。',
    triggerTopics: ['はぐメタ', 'メダル', '逃げる', '硬い', '経験値'],
    sampleComments: ['逃げてもいいよね', 'メタル系は硬いから安心', '経験値稼ぎたい'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-042',
    sourceVideoId: '',
    name: '竜神王',
    icon: '🐲',
    commentStyle: 'reaction',
    tone: '熱血応援勢。ドラゴン系の圧倒的な火力や巨大化に反応し、強者感のある無双展開を全力で讃える。重厚で少し偉そう。',
    triggerTopics: ['竜神王', 'ドラゴン', '無双', '巨大化', '煉獄火炎'],
    sampleComments: ['これぞ竜の王よ', '無双すぎる', '圧倒的やな'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-043',
    sourceVideoId: '',
    name: 'クロードラバー',
    icon: '🤖',
    commentStyle: 'long',
    tone: '真面目な開発者勢。AI活用や改善施策を見ると、実装目線で地味な積み上げを評価する。落ち着いた実務寄り。',
    triggerTopics: ['AI', '改善', '分析', 'UIUX', '自動化'],
    sampleComments: ['そこ自動化できそう', '地味だけどこれが大事', 'UIUX大事にしてる感じがいい'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-044',
    sourceVideoId: '',
    name: '癒しラーメン',
    icon: '🍜',
    commentStyle: 'short',
    tone: 'マイペースな共感勢。お腹が空いた目線でゆるく反応しつつ、強い展開には「これは満腹」と満足感で例える。ゆるい短文、脱力した語尾。',
    triggerTopics: ['腹減った', 'うまそう', '満腹', '染みる', 'あったかい'],
    sampleComments: ['腹減った…', '染みるな〜', 'これは満腹になる展開'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-045',
    sourceVideoId: '',
    name: 'ポケモン好き',
    icon: '🎮',
    commentStyle: 'question',
    tone: '好奇心旺盛な知識勢。新しい戦術や珍しい構築を見ると反応し、強い動きの理由を考えたがる。発見を共有するような語尾。',
    triggerTopics: ['なるほど', 'その発想', '面白い', '強そう', '勉強になる'],
    sampleComments: ['なるほどなるほど', 'その発想なかった', 'これ強い理由わかった'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-046',
    sourceVideoId: '',
    name: '名無しの視聴者（好奇心）',
    icon: '👤',
    commentStyle: 'question',
    tone: '好奇心旺盛な質問勢。気になった点を素直に拾い、面白い発想や展開に反応する。短めで自然な語尾。',
    triggerTopics: ['なるほど', '面白い', '気になる', 'どうなんだろう', 'ありそう'],
    sampleComments: ['気になるな', 'これどういう仕組み？', 'なるほどね'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-047',
    sourceVideoId: '',
    name: '名無しの視聴者（冷静）',
    icon: '👥',
    commentStyle: 'short',
    tone: '冷静な共感勢。動画の内容を整理しながら良かった点に反応する。落ち着いた短文。',
    triggerTopics: ['なるほど', 'いいね', '分かる', '参考になる', '気になる'],
    sampleComments: ['それいいな', '参考になった', '分かる分かる'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-048',
    sourceVideoId: '',
    name: 'オム掘り職人',
    icon: '⛏️',
    commentStyle: 'analysis',
    tone: '職人気質な知識勢。進化前や序盤性能の話になると急に反応する。〜だな;〜説ある口調。',
    triggerTopics: ['序盤', '化石', '耐久', '検証', '進化'],
    sampleComments: ['その検証気になる', '序盤性能の話は熱い', '耐久ライン大事よな'],
    createdAt: '2026-05-01'
  },
  {
    id: 'persona-049',
    sourceVideoId: 'video-005',
    name: '自動化研究員',
    icon: '⚙️',
    commentStyle: 'question',
    tone: '好奇心旺盛な開発者勢。自動化フローや収益化設計の話題に食いつく。〜かも;〜気になる口調。',
    triggerTopics: ['自動化', 'API', '効率化', '検証', '仕組み'],
    sampleComments: ['そこ自動化できるのか', 'フロー設計が気になる', 'APIで繋げられそう'],
    createdAt: '2026-05-20'
  },
  {
    id: 'persona-050',
    sourceVideoId: 'video-006',
    name: '考察ログ職人',
    icon: '🔍',
    commentStyle: 'analysis',
    tone: '冷静な懐疑勢。話題の裏側や仕組みを考え始める。〜気がする;〜かもしれない口調。',
    triggerTopics: ['検証', '仕組み', '根拠', '再現性', '考察'],
    sampleComments: ['それってどういう理屈だろう', '再現性があるのか気になる', '根拠を確かめたい'],
    createdAt: '2026-05-20'
  },
  {
    id: 'persona-051',
    sourceVideoId: 'video-007',
    name: '開拓ペンギン',
    icon: '🐧',
    commentStyle: 'short',
    tone: '楽観的な初心者勢。新しい挑戦や発見にわくわくする。〜だね;〜楽しそう口調。',
    triggerTopics: ['挑戦', '発見', '成長', '面白そう', '気になる'],
    sampleComments: ['それ初めて知った！', '楽しそう〜', '自分もやってみたい'],
    createdAt: '2026-05-20'
  },
  {
    id: 'persona-052',
    sourceVideoId: 'video-008',
    name: '深夜ラジオ民',
    icon: '📻',
    commentStyle: 'short',
    tone: 'マイペースな共感勢。雑談や体験談に自然と共感する。〜だなあ;〜かもね口調。',
    triggerTopics: ['空気感', '雑談', '日常', '共感', 'ゆるい'],
    sampleComments: ['なんかわかるなあ', 'この空気感好き', 'ゆるくていい'],
    createdAt: '2026-05-20'
  }
];

export const mockPlans: ContentPlan[] = [
  {
    id: 'plan-001',
    sourceVideoId: 'video-001',
    title: '深掘りトレンド企画：4つの視点',
    hook: '視聴者が「そういう見方があったか」と思う切り口。',
    scriptMemo: '導入→対比→具体例→まとめ、をコンパクトに。',
    thumbnailIdea: '淡いブルーの研究室風。',
    purpose: '視聴者の企画理解を深める。',
    priority: 'high',
    status: 'script',
    scheduledDate: '2026-06-05',
    postedUrl: '',
    metricsMemo: '',
    selectedPersonas: ['persona-001', 'persona-045']
  },
  {
    id: 'plan-002',
    sourceVideoId: 'video-003',
    title: '初見視聴者向けショート構成',
    hook: '初めて見る人が迷わない、最短ナビ。',
    scriptMemo: '用語説明と視聴の導線を優先。',
    thumbnailIdea: 'やさしい表情の案内役と「初見OK」文字。',
    purpose: 'チャンネルの初見視聴者を増やす。',
    priority: 'low',
    status: 'published',
    scheduledDate: '2026-05-22',
    postedUrl: 'https://youtu.be/ysz5S6PUM-U',
    metricsMemo: '再生数3400、いいね率8.2%。',
    selectedPersonas: ['persona-046', 'persona-047']
  }
];
