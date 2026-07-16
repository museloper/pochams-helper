// Client-side UI translation dictionary (issue #8).
//
// Data names (Pokémon/move/ability) are localized via each entity's own
// `LocalizedName`; this module covers the surrounding UI copy. Korean is the
// source of truth — `en`/`ja` are typed to cover exactly the same keys.
// Values may contain `{name}` placeholders filled in by `interpolate`.

import { useCallback } from "react";
import type { Language } from "@/lib/types";
import { useLanguage } from "@/stores/useLanguage";

type Vars = Record<string, string | number>;

const ko = {
  // Site chrome
  "site.brand": "포켓몬 챔피언스 헬퍼",
  "footer.disclaimer1":
    "포켓몬 챔피언스 헬퍼는 닌텐도 · 게임프리크 · 포켓몬 컴퍼니와 무관한 비공식 팬 프로젝트입니다.",
  "footer.disclaimer2":
    "Pokémon 및 관련 이미지 · 명칭의 저작권은 각 권리자에게 있습니다.",

  // Shared
  "common.backHome": "← 홈",
  "common.all": "전체",
  "common.ability": "특성",
  "common.abilityHidden": " (드림)",
  "common.item": "도구",
  "common.physical": "물리",
  "common.special": "특수",
  "common.evOf": "{stat} 노력치",
  "common.natureOf": "{stat} 성격",
  "common.rankOf": "{stat} 랭크",
  "common.statValueOf": "{stat} 실수치",
  "common.hitsN": "{n}회",
  "common.megaStone": "메가스톤",

  // Stats
  "stat.attack": "공격",
  "stat.spAttack": "특공",
  "stat.defense": "방어",
  "stat.spDefense": "특방",
  "stat.bulk": "내구",
  "stat.defBoth": "방어/특방",
  "stat.hp": "HP",

  // Natures
  "nature.plus": "상승",
  "nature.neutral": "무보정",
  "nature.minus": "하락",

  // KO verdict
  "verdict.ohko": "확정 1타",
  "verdict.ohkoChance": "난수 1타",
  "verdict.nhko": "확정 {n}타",
  "verdict.immune": "효과 없음",

  // Damage page
  "damage.pageTitle": "데미지 계산기",
  "damage.pageSubtitle":
    "Lv50 기준 · 공격/방어 포켓몬과 기술·노력치를 입력해 데미지와 확정·난수 1타를 확인하세요.",

  // Damage calculator
  "damage.attacker": "공격",
  "damage.defender": "방어",
  "damage.searchAttacker": "공격 포켓몬 검색…",
  "damage.searchDefender": "방어 포켓몬 검색…",
  "damage.searchMove": "기술 이름 검색 (선택)…",
  "damage.noMoves": "해당 기술이 없습니다",
  "damage.stab": "자속",
  "damage.change": "변경 ▾",
  "damage.hitCount": "명중 횟수",
  "damage.dmgVsHp": "데미지 (HP 대비)",
  "damage.dmgDetail": "{min} ~ {max} 데미지 · 상대 HP {hp}",
  "damage.typeEff": "타입 상성 ×{mult}",
  "damage.multiHitInfo": "{hits}회 명중 위력 {power}",
  "damage.weightInfo": "상대 몸무게 {weight}kg · 위력 {power}",
  "damage.hpStat": "상대 HP 실수치",
  "damage.remainingHp": "남은 체력",
  "damage.survivalKo": "쓰러짐 (확정 1타)",
  "damage.survivalSurvive": "견딤 (최대 데미지도 버팀)",
  "damage.faintChance": "쓰러질 확률 {pct}%",
  "damage.surviveThreshold": "견디려면 HP {hp} 이상 (풀피의 {pct}% 이상)",
  "damage.noSurvive": "풀피에서도 최대 데미지에 쓰러짐",
  "damage.variablePower":
    "이 기술은 위력이 고정/가변이라 표준 데미지 계산을 할 수 없습니다.",
  "damage.emptyState":
    "공격 포켓몬과 기술, 방어 포켓몬을 선택하면 데미지와 확정/난수 1타 여부를 계산합니다.",
  "damage.weather": "날씨",
  "weather.none": "없음",
  "weather.sun": "쾌청",
  "weather.rain": "비",
  "weather.sand": "모래바람",
  "weather.snow": "눈",

  // Speed page
  "speed.pageTitle": "스피드 계산기",
  "speed.pageSubtitle":
    "Lv50 기준 · 성격과 노력치(0~32)를 조절해 추월하지 못하는 상대를 그룹별로 확인하세요.",

  // Speed calculator
  "speed.myPokemon": "내 포켓몬",
  "speed.searchPokemon": "포켓몬 이름 검색…",
  "speed.baseSpeedN": "종족값 스피드 {n}",
  "speed.speedN": "스피드 {n}",
  "speed.nature": "성격",
  "speed.naturePlus": "+스피드",
  "speed.natureNeutral": "무보정",
  "speed.natureMinus": "-스피드",
  "speed.ev": "스피드 노력치",
  "speed.scarf": "구애스카프",
  "speed.scarfOn": "착용 (×1.5)",
  "speed.scarfOff": "미착용",
  "speed.mySpeed": "내 스피드",
  "speed.scarfNote": "구애스카프 ×1.5 (기본 {base})",
  "speed.rankNote": "랭크 {rank}",
  "speed.baseNote": "(기본 {base})",
  "speed.myRank": "내 스피드 랭크",
  "speed.oppRank": "상대 스피드 랭크",
  "speed.weakTypes": "약점 타입",
  "speed.none": "없음",
  "speed.targetSearch": "타겟 포켓몬 검색 (그룹에서 필터)…",
  "speed.weakOnly": "약점 공격기 보유만",
  "speed.countN": "{n}마리",
  "speed.cantOutrun": "{desc} 상대를 추월 못 함",
  "speed.tie": "동속",
  "speed.allOutrun": "전부 추월 가능",
  "speed.filteredOutrun": "이 기준에선 추월 가능",
  "speed.emptyState":
    "포켓몬을 선택하면 최저속·최속·구애스카프 기준으로 추월하지 못하는 상대를 보여줍니다.",
  // Speed groups
  "speed.group.min": "최저속",
  "speed.group.minDesc": "0 노력치 · -스피드",
  "speed.group.submax": "준속",
  "speed.group.submaxDesc": "32 노력치 · 무보정",
  "speed.group.max": "최속",
  "speed.group.maxDesc": "32 노력치 · +스피드",
  "speed.group.scarf": "구애스카프",
  "speed.group.scarfDesc": "준속 × 1.5",
  "speed.group.scarfNote": "준속 상태에서 구애스카프 적용 기준",

  // Move list
  "common.status": "변화",
  "stat.speed": "스피드",
  "move.power": "위력 {power}",
  "move.accuracy": "명중 {acc}",
  "moveList.empty": "해당 조건의 기술이 없습니다.",

  // Pokémon detail page
  "detail.backToDex": "← 도감",
  "detail.learnableMoves": "배울 수 있는 기술 ({n})",
  "detail.stats": "종족값",
  "detail.total": "총합 {n}",
  "detail.abilities": "특성",
  "detail.hiddenBadge": "드림",
  "detail.matchup": "약점 · 내구",
  "detail.mult.x4": "×4 매우 약함",
  "detail.mult.x2": "×2 약함",
  "detail.mult.xHalf": "×½ 반감",
  "detail.mult.xQuarter": "×¼ 반감",
  "detail.mult.x0": "×0 무효",
} as const;

type Key = keyof typeof ko;

const en: Record<Key, string> = {
  "site.brand": "Pokémon Champions Helper",
  "footer.disclaimer1":
    "Pokémon Champions Helper is an unofficial fan project, not affiliated with Nintendo, Game Freak, or The Pokémon Company.",
  "footer.disclaimer2":
    "Pokémon and related images and names are copyright of their respective owners.",

  "common.backHome": "← Home",
  "common.all": "All",
  "common.ability": "Ability",
  "common.abilityHidden": " (Hidden)",
  "common.item": "Item",
  "common.physical": "Physical",
  "common.special": "Special",
  "common.evOf": "{stat} EV",
  "common.natureOf": "{stat} nature",
  "common.rankOf": "{stat} stage",
  "common.statValueOf": "{stat} stat",
  "common.hitsN": "{n} hits",
  "common.megaStone": "Mega Stone",

  "stat.attack": "Attack",
  "stat.spAttack": "Sp. Atk",
  "stat.defense": "Defense",
  "stat.spDefense": "Sp. Def",
  "stat.bulk": "Bulk",
  "stat.defBoth": "Def / Sp. Def",
  "stat.hp": "HP",

  "nature.plus": "Boost",
  "nature.neutral": "Neutral",
  "nature.minus": "Drop",

  "verdict.ohko": "Guaranteed OHKO",
  "verdict.ohkoChance": "Possible OHKO",
  "verdict.nhko": "Guaranteed {n}HKO",
  "verdict.immune": "No effect",

  "damage.pageTitle": "Damage Calculator",
  "damage.pageSubtitle":
    "At Lv50 · enter the attacking/defending Pokémon, move, and EVs to check damage and OHKO/roll odds.",

  "damage.attacker": "Attacker",
  "damage.defender": "Defender",
  "damage.searchAttacker": "Search attacker…",
  "damage.searchDefender": "Search defender…",
  "damage.searchMove": "Search move name (optional)…",
  "damage.noMoves": "No matching moves",
  "damage.stab": "STAB",
  "damage.change": "Change ▾",
  "damage.hitCount": "Hits landed",
  "damage.dmgVsHp": "Damage (% of HP)",
  "damage.dmgDetail": "{min} ~ {max} damage · target HP {hp}",
  "damage.typeEff": "Type effectiveness ×{mult}",
  "damage.multiHitInfo": "{hits} hits, power {power}",
  "damage.weightInfo": "target weight {weight}kg · power {power}",
  "damage.hpStat": "Target HP stat",
  "damage.remainingHp": "Remaining HP",
  "damage.survivalKo": "Fainted (guaranteed OHKO)",
  "damage.survivalSurvive": "Survives (even the max roll)",
  "damage.faintChance": "faint chance {pct}%",
  "damage.surviveThreshold": "Needs HP {hp}+ to survive ({pct}%+ of full HP)",
  "damage.noSurvive": "Fainted by the max roll even at full HP",
  "damage.variablePower":
    "This move has fixed/variable power, so standard damage cannot be calculated.",
  "damage.emptyState":
    "Pick an attacker with a move and a defender to calculate damage and OHKO/roll odds.",
  "damage.weather": "Weather",
  "weather.none": "None",
  "weather.sun": "Sun",
  "weather.rain": "Rain",
  "weather.sand": "Sandstorm",
  "weather.snow": "Snow",

  "speed.pageTitle": "Speed Calculator",
  "speed.pageSubtitle":
    "At Lv50 · adjust nature and EVs (0–32) to see, by group, who you can't outrun.",

  "speed.myPokemon": "My Pokémon",
  "speed.searchPokemon": "Search Pokémon name…",
  "speed.baseSpeedN": "Base Speed {n}",
  "speed.speedN": "Speed {n}",
  "speed.nature": "Nature",
  "speed.naturePlus": "+Speed",
  "speed.natureNeutral": "Neutral",
  "speed.natureMinus": "-Speed",
  "speed.ev": "Speed EV",
  "speed.scarf": "Choice Scarf",
  "speed.scarfOn": "Held (×1.5)",
  "speed.scarfOff": "None",
  "speed.mySpeed": "My Speed",
  "speed.scarfNote": "Choice Scarf ×1.5 (base {base})",
  "speed.rankNote": "stage {rank}",
  "speed.baseNote": "(base {base})",
  "speed.myRank": "My speed stage",
  "speed.oppRank": "Opponent speed stage",
  "speed.weakTypes": "Weak to",
  "speed.none": "None",
  "speed.targetSearch": "Search target Pokémon (filter groups)…",
  "speed.weakOnly": "Has super-effective move only",
  "speed.countN": "{n}",
  "speed.cantOutrun": "Can't outrun ({desc})",
  "speed.tie": "Speed tie",
  "speed.allOutrun": "Outruns all",
  "speed.filteredOutrun": "Outruns these",
  "speed.emptyState":
    "Pick a Pokémon to see who you can't outrun at min / max / Choice Scarf speeds.",
  "speed.group.min": "Min",
  "speed.group.minDesc": "0 EV · -Speed",
  "speed.group.submax": "Sub-max",
  "speed.group.submaxDesc": "32 EV · Neutral",
  "speed.group.max": "Max",
  "speed.group.maxDesc": "32 EV · +Speed",
  "speed.group.scarf": "Choice Scarf",
  "speed.group.scarfDesc": "Sub-max × 1.5",
  "speed.group.scarfNote": "Choice Scarf on a sub-max spread",

  "common.status": "Status",
  "stat.speed": "Speed",
  "move.power": "Power {power}",
  "move.accuracy": "Acc {acc}",
  "moveList.empty": "No moves match these filters.",

  "detail.backToDex": "← Dex",
  "detail.learnableMoves": "Learnable moves ({n})",
  "detail.stats": "Base stats",
  "detail.total": "Total {n}",
  "detail.abilities": "Abilities",
  "detail.hiddenBadge": "Hidden",
  "detail.matchup": "Weaknesses · Resistances",
  "detail.mult.x4": "×4 very weak",
  "detail.mult.x2": "×2 weak",
  "detail.mult.xHalf": "×½ resists",
  "detail.mult.xQuarter": "×¼ resists",
  "detail.mult.x0": "×0 immune",
};

const ja: Record<Key, string> = {
  "site.brand": "ポケモンチャンピオンズ ヘルパー",
  "footer.disclaimer1":
    "ポケモンチャンピオンズ ヘルパーは任天堂・ゲームフリーク・株式会社ポケモンとは無関係の非公式ファンプロジェクトです。",
  "footer.disclaimer2":
    "Pokémon および関連する画像・名称の著作権は各権利者に帰属します。",

  "common.backHome": "← ホーム",
  "common.all": "すべて",
  "common.ability": "とくせい",
  "common.abilityHidden": "（隠れ）",
  "common.item": "どうぐ",
  "common.physical": "物理",
  "common.special": "特殊",
  "common.evOf": "{stat} 努力値",
  "common.natureOf": "{stat} 性格",
  "common.rankOf": "{stat} ランク",
  "common.statValueOf": "{stat} 実数値",
  "common.hitsN": "{n}回",
  "common.megaStone": "メガストーン",

  "stat.attack": "こうげき",
  "stat.spAttack": "とくこう",
  "stat.defense": "ぼうぎょ",
  "stat.spDefense": "とくぼう",
  "stat.bulk": "耐久",
  "stat.defBoth": "防御/特防",
  "stat.hp": "HP",

  "nature.plus": "上昇",
  "nature.neutral": "無補正",
  "nature.minus": "下降",

  "verdict.ohko": "確定1発",
  "verdict.ohkoChance": "乱数1発",
  "verdict.nhko": "確定{n}発",
  "verdict.immune": "効果なし",

  "damage.pageTitle": "ダメージ計算機",
  "damage.pageSubtitle":
    "Lv50基準 · 攻撃/防御ポケモンと技・努力値を入力してダメージと確定/乱数1発を確認できます。",

  "damage.attacker": "こうげき",
  "damage.defender": "ぼうぎょ",
  "damage.searchAttacker": "攻撃ポケモンを検索…",
  "damage.searchDefender": "防御ポケモンを検索…",
  "damage.searchMove": "技名を検索（任意）…",
  "damage.noMoves": "該当する技がありません",
  "damage.stab": "タイプ一致",
  "damage.change": "変更 ▾",
  "damage.hitCount": "命中回数",
  "damage.dmgVsHp": "ダメージ（HP比）",
  "damage.dmgDetail": "{min} ~ {max} ダメージ · 相手HP {hp}",
  "damage.typeEff": "タイプ相性 ×{mult}",
  "damage.multiHitInfo": "{hits}回命中 威力{power}",
  "damage.weightInfo": "相手の体重 {weight}kg · 威力 {power}",
  "damage.hpStat": "相手HP実数値",
  "damage.remainingHp": "残りHP",
  "damage.survivalKo": "倒れる（確定1発）",
  "damage.survivalSurvive": "耐える（最大乱数でも）",
  "damage.faintChance": "倒れる確率 {pct}%",
  "damage.surviveThreshold": "耐えるにはHP {hp}以上（満タンの{pct}%以上）",
  "damage.noSurvive": "満タンでも最大乱数で倒れる",
  "damage.variablePower":
    "この技は威力が固定/可変のため、標準ダメージ計算ができません。",
  "damage.emptyState":
    "攻撃ポケモンと技、防御ポケモンを選ぶとダメージと確定/乱数1発を計算します。",
  "damage.weather": "天気",
  "weather.none": "なし",
  "weather.sun": "はれ",
  "weather.rain": "あめ",
  "weather.sand": "すなあらし",
  "weather.snow": "ゆき",

  "speed.pageTitle": "素早さ計算機",
  "speed.pageSubtitle":
    "Lv50基準 · 性格と努力値（0〜32）を調整して、抜けない相手をグループ別に確認できます。",

  "speed.myPokemon": "自分のポケモン",
  "speed.searchPokemon": "ポケモン名を検索…",
  "speed.baseSpeedN": "種族値 素早さ {n}",
  "speed.speedN": "素早さ {n}",
  "speed.nature": "性格",
  "speed.naturePlus": "+素早さ",
  "speed.natureNeutral": "無補正",
  "speed.natureMinus": "-素早さ",
  "speed.ev": "素早さ努力値",
  "speed.scarf": "こだわりスカーフ",
  "speed.scarfOn": "装備（×1.5）",
  "speed.scarfOff": "未装備",
  "speed.mySpeed": "自分の素早さ",
  "speed.scarfNote": "こだわりスカーフ ×1.5（基本 {base}）",
  "speed.rankNote": "ランク {rank}",
  "speed.baseNote": "（基本 {base}）",
  "speed.myRank": "自分の素早さランク",
  "speed.oppRank": "相手の素早さランク",
  "speed.weakTypes": "弱点タイプ",
  "speed.none": "なし",
  "speed.targetSearch": "対象ポケモンを検索（グループを絞り込み）…",
  "speed.weakOnly": "弱点技持ちのみ",
  "speed.countN": "{n}匹",
  "speed.cantOutrun": "{desc} 相手を抜けない",
  "speed.tie": "同速",
  "speed.allOutrun": "すべて抜ける",
  "speed.filteredOutrun": "この基準では抜ける",
  "speed.emptyState":
    "ポケモンを選ぶと、最遅・最速・こだわりスカーフ基準で抜けない相手を表示します。",
  "speed.group.min": "最遅",
  "speed.group.minDesc": "0努力値 · -素早さ",
  "speed.group.submax": "準速",
  "speed.group.submaxDesc": "32努力値 · 無補正",
  "speed.group.max": "最速",
  "speed.group.maxDesc": "32努力値 · +素早さ",
  "speed.group.scarf": "こだわりスカーフ",
  "speed.group.scarfDesc": "準速 × 1.5",
  "speed.group.scarfNote": "準速にこだわりスカーフを適用した基準",

  "common.status": "変化",
  "stat.speed": "素早さ",
  "move.power": "威力 {power}",
  "move.accuracy": "命中 {acc}",
  "moveList.empty": "この条件の技はありません。",

  "detail.backToDex": "← 図鑑",
  "detail.learnableMoves": "覚える技（{n}）",
  "detail.stats": "種族値",
  "detail.total": "合計 {n}",
  "detail.abilities": "とくせい",
  "detail.hiddenBadge": "隠れ",
  "detail.matchup": "弱点 · 耐性",
  "detail.mult.x4": "×4 とても弱い",
  "detail.mult.x2": "×2 弱い",
  "detail.mult.xHalf": "×½ 半減",
  "detail.mult.xQuarter": "×¼ 半減",
  "detail.mult.x0": "×0 無効",
};

const DICTS: Record<Language, Record<Key, string>> = { ko, en, ja };

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

/** Translate a UI key for a given language (falls back to Korean). */
export function translate(lang: Language, key: Key, vars?: Vars): string {
  const template = DICTS[lang][key] ?? ko[key];
  return interpolate(template, vars);
}

export type TranslationKey = Key;

/** Hook returning a `t(key, vars?)` bound to the current display language. */
export function useT() {
  const lang = useLanguage((s) => s.lang);
  return useCallback(
    (key: Key, vars?: Vars) => translate(lang, key, vars),
    [lang],
  );
}
