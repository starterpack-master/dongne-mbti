export interface TypeProfile {
  code: string;
  nick: string;
  emoji: string;
  tagline: string;
  desc: string;
  tags: string[];
  routine: string[];
  /** gradient colors: [main, accent, soft] */
  colors: [string, string, string];
}

export const AXES = [
  { first: "E", second: "I", firstName: "밖순이", secondName: "집순이", title: "놀러 나가는 동네 vs 집에 있기 좋은 동네" },
  { first: "S", second: "N", firstName: "현실파", secondName: "감성파", title: "시장·생활밀착 vs 카페·트렌드" },
  { first: "T", second: "F", firstName: "갓생파", secondName: "힐링파", title: "오피스·공부·운동 vs 뷰티·반려·케어" },
  { first: "J", second: "P", firstName: "루틴파", secondName: "즉흥파", title: "학원·병원 루틴 vs 놀거리·여행" },
] as const;

export const TYPES: Record<string, TypeProfile> = {
  ENFP: {
    code: "ENFP", nick: "감성 파티 동네", emoji: "🎉",
    tagline: "카페 투어로 시작해서 이자카야로 끝나는 하루",
    desc: "예쁜 카페, 소품샵, 세계 음식점이 골목마다 있고 밤이 되면 술집이 불을 켜요. 계획 없이 나와도 하루가 꽉 차는 동네.",
    tags: ["#핫플", "#골목투어", "#2차는국룰"],
    routine: ["12:00 브런치 카페", "15:00 소품샵 구경", "19:00 요리주점", "23:00 즉흥 노래방"],
    colors: ["#ff4fd8", "#ffb800", "#ff8a8a"],
  },
  ENFJ: {
    code: "ENFJ", nick: "우아한 인싸 동네", emoji: "🌷",
    tagline: "필라테스 끝나고 브런치, 저녁엔 와인 모임",
    desc: "뷰티·운동 샵과 감성 맛집이 모여 있고, 학원·병원 같은 생활 루틴도 탄탄해요. 모임 많고 늘 잘 가꾸는 사람들의 동네.",
    tags: ["#자기관리", "#모임장", "#브런치"],
    routine: ["07:00 필라테스", "11:00 브런치 모임", "16:00 피부 관리", "20:00 와인 한 잔"],
    colors: ["#00c9a7", "#ff7ac6", "#9ff5d8"],
  },
  ENTJ: {
    code: "ENTJ", nick: "야망 가득 동네", emoji: "💼",
    tagline: "아아 한 잔, 점심은 샐러드, 저녁은 회식",
    desc: "오피스와 전문직 사무실이 빽빽하고, 점심 맛집과 회식 장소가 줄지어 있어요. 평일 낮 에너지가 가장 센 동네.",
    tags: ["#오피스타운", "#점심전쟁", "#갓생"],
    routine: ["08:30 아아 테이크아웃", "12:00 샐러드", "19:00 삼겹살 회식", "22:00 헬스장"],
    colors: ["#7b2cff", "#ff2e93", "#b69cff"],
  },
  ENTP: {
    code: "ENTP", nick: "트렌드 실험실", emoji: "🧪",
    tagline: "새로 생긴 건 일단 가 봐야 직성이 풀림",
    desc: "사무실과 스튜디오, 세계 음식과 놀거리가 한데 섞인 실험적인 동네. 오늘 문 연 가게가 내일 핫플이 되는 곳.",
    tags: ["#팝업성지", "#새로운거좋아", "#놀거리"],
    routine: ["11:00 팝업 스토어", "13:00 이국 음식", "17:00 셀프사진관", "21:00 방탈출"],
    colors: ["#8b3dff", "#1fd6ff", "#c9a2ff"],
  },
  INFJ: {
    code: "INFJ", nick: "조용한 감성 루틴 동네", emoji: "🕯️",
    tagline: "학원 픽업 후 동네 빵집, 요가로 마무리",
    desc: "감성 카페와 빵집, 뷰티·운동 샵이 조용히 자리 잡고 학원·병원도 가까워요. 잔잔하지만 빈틈없는 동네.",
    tags: ["#잔잔한일상", "#동네빵집", "#루틴"],
    routine: ["08:00 모닝 요가", "10:30 동네 빵집", "15:00 학원 픽업", "20:00 조용한 산책"],
    colors: ["#12b886", "#8ce99a", "#74c0fc"],
  },
  INFP: {
    code: "INFP", nick: "몽글몽글 감성 동네", emoji: "☁️",
    tagline: "창가 자리 카페와 즉흥 산책, 여행 온 것 같은 동네",
    desc: "카페·소품샵·게스트하우스가 많아 살아도 여행하는 기분이에요. 조용히 혼자 놀기 좋은 감성 충전소.",
    tags: ["#감성충전", "#혼자놀기", "#여행같은일상"],
    routine: ["11:00 창가 자리 카페", "14:00 독립 서점", "17:00 노을 산책", "22:00 편의점 야식"],
    colors: ["#38d9a9", "#ffd43b", "#ffa8d6"],
  },
  INTJ: {
    code: "INTJ", nick: "갓생 요새", emoji: "🧠",
    tagline: "스터디카페와 헬스장 사이, 계획대로 산다",
    desc: "학원·스터디카페·오피스가 촘촘하고 술집은 적은 편. 목표 있는 사람들이 조용히 칼을 가는 동네.",
    tags: ["#갓생", "#스터디카페", "#계획충"],
    routine: ["06:30 헬스장", "09:00 스터디카페", "13:00 김밥 한 줄", "23:00 내일 계획 세우기"],
    colors: ["#5f3dc4", "#9775fa", "#4dabf7"],
  },
  INTP: {
    code: "INTP", nick: "덕후 은신처", emoji: "🎮",
    tagline: "만화카페·서점·게임장, 취향에 진심인 동네",
    desc: "혼자 즐길 거리와 놀거리가 많고, 트렌디한 가게도 슬쩍 섞여 있어요. 남 눈치 안 보고 취향 파기 좋은 동네.",
    tags: ["#취향존중", "#혼놀", "#덕질"],
    routine: ["13:00 늦잠 후 브런치", "15:00 만화카페", "19:00 게임장", "01:00 새벽 덕질"],
    colors: ["#9b5cff", "#ff8cf0", "#3bc9db"],
  },
  ISTJ: {
    code: "ISTJ", nick: "모범생 동네", emoji: "📚",
    tagline: "독서실·학원·반찬가게, 흔들림 없는 루틴",
    desc: "생활 밀착 가게와 학원·병원·사무실이 정석대로 자리 잡았어요. 화려하진 않아도 모든 게 제자리에 있는 동네.",
    tags: ["#정석", "#생활밀착", "#루틴"],
    routine: ["07:00 백반 아침", "09:00 출근", "18:30 반찬가게", "21:00 독서실"],
    colors: ["#1c4fd8", "#4dabf7", "#a5d8ff"],
  },
  ISTP: {
    code: "ISTP", nick: "혼자서도 잘해요 동네", emoji: "🛠️",
    tagline: "철물점 사장님과 PC방이 공존하는 실속파",
    desc: "철물점·정비소 같은 실속 가게와 편의점·PC방이 함께 있어요. 필요한 건 다 있고 간섭은 없는 동네.",
    tags: ["#실속", "#혼자서도잘해요", "#편의점"],
    routine: ["10:00 철물점 쇼핑", "13:00 국밥 한 그릇", "16:00 셀프 세차", "22:00 PC방"],
    colors: ["#e8a200", "#ffe066", "#adb5bd"],
  },
  ISFJ: {
    code: "ISFJ", nick: "살림 고수 동네", emoji: "🧺",
    tagline: "반찬가게·소아과·미용실, 따뜻한 생활권",
    desc: "시장과 반찬가게, 병원·미용실이 걸어서 다 닿는 동네. 살림 잘하는 이웃들이 모여 사는 따뜻한 생활권.",
    tags: ["#살기좋은동네", "#반찬가게", "#생활권"],
    routine: ["09:00 소아과", "11:00 시장 장보기", "15:00 미용실", "18:00 반찬가게 털기"],
    colors: ["#1098f7", "#99e9f2", "#fcc2d7"],
  },
  ISFP: {
    code: "ISFP", nick: "소확행 동네", emoji: "🐶",
    tagline: "펫샵 들렀다 편의점 야식, 소소한 행복",
    desc: "반려동물 가게와 뷰티샵, 편의점이 가까워 혼자서도 소소하게 즐거워요. 느긋하게 사는 사람들의 동네.",
    tags: ["#소확행", "#댕댕이", "#느긋"],
    routine: ["10:00 댕댕이 산책", "13:00 분식", "16:00 네일샵", "23:00 편의점 야식"],
    colors: ["#ff9f1c", "#ffb3d9", "#ffe8a3"],
  },
  ESTJ: {
    code: "ESTJ", nick: "회식 부장님 동네", emoji: "🍻",
    tagline: "퇴근하면 삼겹살, 2차는 호프, 다음 날 칼출근",
    desc: "고깃집·호프와 사무실, 시장이 함께 있는 든든한 동네. 일할 땐 일하고 먹을 땐 제대로 먹어요.",
    tags: ["#회식", "#삼겹살", "#든든"],
    routine: ["08:00 칼출근", "12:00 백반 맛집", "19:00 삼겹살", "21:00 2차 호프"],
    colors: ["#1d5bff", "#ff7a1a", "#74c0fc"],
  },
  ESTP: {
    code: "ESTP", nick: "불금 전투 동네", emoji: "🔥",
    tagline: "1차 고기, 2차 호프, 3차 노래방. 계획? 그런 거 없음",
    desc: "술집·고깃집·노래방에 놀거리까지 빽빽한 에너지 과다 동네. 해가 지면 본격적으로 깨어나요.",
    tags: ["#불금", "#3차까지", "#에너지과다"],
    routine: ["18:00 퇴근과 동시에", "19:00 곱창", "22:00 노래방", "02:00 해장국"],
    colors: ["#ff3b3b", "#ffb020", "#ff8fa3"],
  },
  ESFJ: {
    code: "ESFJ", nick: "오지랖 반장님 동네", emoji: "🙋",
    tagline: "미용실 원장님이 소식통, 반찬가게 이모가 내 안부 챙김",
    desc: "시장·미용실·고깃집이 모인 정 많은 동네. 모임도 많고 이웃끼리 얼굴 아는 사이예요.",
    tags: ["#정", "#동네모임", "#반장님"],
    routine: ["10:00 미용실 수다", "12:00 시장 국수", "18:00 동네 모임", "20:00 고기 파티"],
    colors: ["#2f6bff", "#ff9ecb", "#ffd43b"],
  },
  ESFP: {
    code: "ESFP", nick: "흥부자 동네", emoji: "🕺",
    tagline: "횟집·노래방·레저까지, 놀 줄 아는 동네",
    desc: "시장과 횟집, 놀거리와 여행 숙소가 넘쳐 늘 축제 분위기예요. 오늘 할 일? 일단 노는 거.",
    tags: ["#흥부자", "#바다", "#놀줄아는"],
    routine: ["11:00 시장 먹방", "14:00 수상 레저", "18:00 횟집", "22:00 노래방"],
    colors: ["#ff2d6f", "#ffd21f", "#ff9a3c"],
  },
};

export const TYPE_ORDER = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

export const profileOf = (t: string): TypeProfile => TYPES[t] ?? TYPES.ENFP;
