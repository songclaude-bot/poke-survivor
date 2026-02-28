# Poké Survivor

> 포켓몬 불가사의 던전 × 뱀파이어 서바이버즈 — 모바일 웹 팬게임

**[Play Now](https://songclaude-bot.github.io/poke-survivor/)**

---

## Overview

| 항목 | 내용 |
|------|------|
| 장르 | Vampire Survivors류 뱀서라이크 |
| 엔진 | Phaser 3.90.0 + TypeScript + Vite 6 |
| 플랫폼 | 모바일 웹 (세로 390×844), 데스크톱도 지원 |
| 조작 | 한손 가상 조이스틱, 공격 자동 |
| 사이클 | 5분 × 무한 반복, 보스 격파 → 군단 합류 → 다음 사이클 |
| 성격 | 비상업적 팬게임 |

---

## Game Flow

```
Boot (로딩) → Title (스플래시) → Lobby (4탭 허브) → Game (전투) → 사망/클리어 → Lobby
```

---

## Screens

### 1. Boot Scene — 로딩 화면

400+ 포켓몬 스프라이트를 CDN에서 로딩합니다.

- 진행률 바 (파란색→보라색 그라디언트)
- 현재 로딩 중인 에셋명 표시
- 4초마다 교체되는 게임 팁 15종
- 로딩 완료 시 자동으로 Title Scene 전환

### 2. Title Scene — 타이틀 화면

- "POKÉ SURVIVOR" 로고 (Back.easeOut 애니메이션)
- "Mystery Dungeon × Vampire Survivors" 서브타이틀
- 배경에 랜덤 포켓몬 6마리 유영 (0.15 투명도)
- 던전 타일 배경
- "TAP TO START" — 탭하면 Lobby로 이동
- 하단 저작권 고지

### 3. Lobby Scene — 메인 허브 (4탭)

하단 탭바로 전환. 상단에 코인 뱃지 + "POKÉ SURVIVOR" 헤더.

#### Tab 0: Play — 스타터 선택

- **스타터 그리드** (5열) — 15종 포켓몬
  - 해금된 스타터: 초상화/스프라이트 + 이름 표시
  - 잠긴 스타터: 🔒 아이콘 + 코인 가격 표시
  - 선택 시 노란 테두리 하이라이트
- **스타터 상세 카드** (선택 시)
  - 초상화, 이름, 타입 라벨 (⚔ Glass Cannon / 🛡 Tank / 💨 Speedster / ⚖ Balanced)
  - 고유 패시브 스킬 이름 + 설명
  - 진화 체인 미리보기 (스프라이트 + 화살표)
  - 스탯바 4개: HP, ATK, SPD, RNG (2×2 그리드)
  - **START 버튼** → 게임 시작
  - 최고 기록 표시
- **잠긴 스타터 선택 시**
  - 해금 조건 표시
  - 코인 해금 버튼 (보유 코인 >= 가격이면 활성화)
- **근육몬 이스터에그** — 우하단 투명 스프라이트, 5번 탭하면 해금

#### Tab 1: Shop — 영구 업그레이드

- 8개 업그레이드 (2열 그리드):

| 업그레이드 | 효과 | 최대 레벨 |
|-----------|------|----------|
| ❤ Max HP | +5% HP/레벨 | 10 |
| ⚔ Attack | +4% ATK/레벨 | 10 |
| 💨 Speed | +3% Speed/레벨 | 10 |
| ✨ XP Gain | +8% XP/레벨 | 8 |
| 💥 Crit Chance | +3% 크리티컬/레벨 | 8 |
| 💚 Regeneration | +0.3% HP/5초/레벨 | 5 |
| 🧲 Magnet Range | +10% 수집 범위/레벨 | 5 |
| 🪙 Coin Bonus | +10% 코인 획득/레벨 | 5 |

- 각 항목: 아이콘, 이름, 레벨바, 설명, 구매 버튼
- 비용은 레벨마다 배율 증가 (baseCost × costScale^level)

#### Tab 2: Pokédex — 도감

- 만난 포켓몬 수 / 전체 수 표시
- 5열 그리드, 스크롤 지원 (드래그)
- 만난 포켓몬: 정적 이미지 (Walk/Idle 프레임) + 이름
- 안 만난 포켓몬: "?" 표시
- 적 처치 + 스타터 해금 + 진화가 자동 등록

#### Tab 3: Records — 기록/업적

- **통계 패널**: 총 런 수, 최고 킬, 최고 웨이브, 최고 레벨, 최고 사이클, 해금 스타터 수, 도감 수
- **업적 목록** (2열 그리드, 13개):
  - First Blood, Hunter (50킬), Slayer (200킬), Exterminator (500킬)
  - Survivor (5웨이브), Veteran (10웨이브), Elite (20웨이브)
  - Growing (Lv.5), Experienced (Lv.10)
  - Evolution!, Squad Goals (5동료)
  - New Game+ (사이클 2), Combo Master (15킬 스트릭)
- 업적 달성 → 스타터 해금 조건 연동

### 4. Game Scene — 전투

#### HUD (항상 표시)
- **HP바** (좌상단) — 초록/노랑/빨강 색상 변화
- **XP바** (HP바 아래) — 파란색
- **레벨** (좌상단, "Lv.1")
- **타이머** (상단 중앙, "5:00" 카운트다운) — 60초 이하 빨간색
- **사이클 + 던전명** (우상단, "Tiny Woods — Cycle 1")
- **웨이브** (우상단, "Wave 1")
- **킬 카운트** (우하단, "Kill: 0") — 10스트릭 이상 🔥표시
- **미니맵** (우하단 60×60) — 적(빨강), 동료(하늘), XP(파랑), 보스(보라), 플레이어(금)
- **일시정지 버튼** (우상단 ❚❚)
- **보스 HP바** (보스 스폰 시 하단)

#### 가상 조이스틱
- 화면 아무 곳 터치로 이동 (조이스틱 base + thumb)
- 최대 거리 50px, 방향+세기에 따라 이동

#### 전투 시스템
- **자동 공격** — 가장 가까운 적에게 자동 발사
  - 레벨 1: 1발, Lv.7: 3발(부채꼴), Lv.15: 5발
  - 공격 시 에이스 Attack 포즈 재생
- **투사체** — 타입별 이펙트 (18종 타입 스프라이트시트)
  - 관통: 1 + 진화단계 (+ sheer_force 보너스)
- **피격 이펙트** — 타입별 hit/melee 이펙트 자동 재생
- **조준선** — 가장 가까운 적까지 연한 선 표시
- **크리티컬** — 빨간 CRIT! 팝업, 기본 2배 (Inner Focus: 3배)
- **킬 스트릭** — 2초 내 연속 킬, 10/15/20/25에서 콤보 텍스트
- **흡혈** — 데미지의 lifestealRate% 만큼 HP 회복

#### 적 시스템
- **5단계 티어** (시간 경과에 따라 등장):
  - T0 (0~45초): rattata, caterpie 등 21종
  - T1 (45~90초): zubat, sandshrew 등 43종
  - T2 (90~150초): raticate, golbat 등 46종
  - T3 (150~220초): pinsir, scyther 등 43종
  - T4 (220초+): snorlax, dragonite 등 27종
- **5종 행동 AI**: chase(추격), swarm(떼), circle(선회), ranged(원거리), charge(돌진)
- **엘리트** — 금색 틴트, 강화 스탯, 좋은 드랍
- **미니보스** — 3웨이브마다 스폰
- **보스** — 4분(240초)에 스폰, 33종 풀 (전설 포함)
- **포메이션 이벤트** (짝수 웨이브마다):
  - 포위(Encirclement): 원형 배치
  - 대각선 행군(Diagonal March): 대각선 줄
  - 돌격 떼(Rush Swarm): 집중 공격

#### 웨이브 시스템
- 웨이브마다 적 수 = 5 + wave×3 + cycle×2
- 웨이브 클리어 시: "WAVE CLEAR!" 텍스트, HP 10% 회복, XP 자석 효과
- 웨이브 간 휴식 (3초, 사이클 높으면 감소)
- 5웨이브마다 동료 진화

#### 진화 시스템
- **에이스 진화** — 레벨업 시 선택지로 등장 (Lv.5, Lv.10)
  - 15 스타터 × 2~3단계 진화 체인 (예: Pikachu → Raichu → Raichu GX)
  - ATK/HP/SPD 배율 적용, 스프라이트 변경
- **동료 진화** — 5웨이브마다 자동

#### 레벨업 선택
- 3개 랜덤 카드 (전체화면 오버레이):
  - **진화** (조건 충족 시) — 다음 단계 진화
  - **동료 추가** (최대 5마리) — Squirtle/Gastly/Geodude/Charmander/Bulbasaur
  - **ATK +25%** — 동료도 +15%
  - **MAX HP +30** — 풀회복
  - **SPEED +20%** — 이동+공격 속도
  - **CRIT +10%** (최대 50%)
  - **LIFESTEAL +5%** (최대 30%)
  - **XP MAGNET +30** — 수집 범위

#### 동료 시스템 (최대 5마리)
- **Projectile** — 원거리 투사체 발사 (Squirtle, Charmander)
- **Orbital** — 에이스 주위 공전, 접촉 데미지 (Gastly)
- **Area** — 주기적 범위 공격 (Geodude, Bulbasaur)
- 에이스 주위를 공전하며 자동 공격

#### 아이템 드랍
- **Heal** (50%) — HP 25% 회복
- **Bomb** (25%) — 300범위 내 적 50% HP 데미지
- **Magnet** (25%) — 모든 XP젬 흡수
- 보스 100%, 엘리트 40%, 일반 8% 드랍률
- 10초 후 소멸 (3초 전부터 깜빡임)

#### 15 스타터 고유 패시브 스킬

| 스타터 | 스킬 | 효과 |
|--------|------|------|
| Pikachu | Static | 10% 확률 적 둔화 |
| Charmander | Blaze | HP 30% 이하 시 ATK +30% |
| Squirtle | Torrent | HP 70% 이상 시 피해 -25% |
| Bulbasaur | Overgrow | 3초마다 HP 1% 재생 |
| Gastly | Levitate | 피격 후 1초 무적 (투명) |
| Geodude | Sturdy | 웨이브당 1회 치명타 생존 (HP→1) |
| Eevee | Adaptability | 레벨업 스탯 보너스 +20% |
| Chikorita | Leaf Guard | 동료 있을 때 피해 -15% |
| Cyndaquil | Flash Fire | 킬마다 ATK +1% (최대 +30%) |
| Totodile | Sheer Force | 투사체 관통 +1 |
| Treecko | Unburden | 킬 후 3초간 Speed +50% |
| Torchic | Speed Boost | 30초마다 공격속도 +5% |
| Mudkip | Damp | 근처 적 속도 -20% |
| Riolu | Inner Focus | 크리티컬 3배 (기본 2배) |
| Machop | Guts | ATK +50%, Speed -20%, 근접 범위 |

#### 일시정지 메뉴
- "PAUSED" 패널
- RESUME 버튼
- 볼륨 조절 (+/−)
- MAIN MENU 버튼 → 코인 정산 후 로비

#### 사망 화면
- "DEFEATED" 패널
- 결과: 포켓몬명, 레벨, 킬, 웨이브, 사이클, 파티 수, 총 시간, 난이도, 획득 코인
- 최고 기록 표시
- RETRY 버튼 (맥동 애니메이션) → 코인 정산 후 로비

#### 사이클 클리어 (보스 격파)
- "STAGE CLEAR!" 화면
- 사이클 통계 + 군단 편성 정보
- "LEGION FORMED" — 현재 파티가 군단으로 합류
- "NEXT CYCLE →" — 탭하면 다음 사이클 시작
  - 새 던전 테마, 더 강한 적, 영구 업그레이드 유지

#### 군단 (Legion) 시스템
- 사이클 클리어 시 현재 파티(에이스+동료)가 군단으로 압축
- 에이스 주위를 큰 원으로 공전
- 자동으로 범위 내 적 공격
- 시각: 3개까지 개별 표시 (멤버 원형), 이후는 뭉쳐서 표시
- 무한 누적 가능

#### 코인 계산
```
coins = (kills/10) + (wave×5) + ((cycle-1)×10) + (level×2)
       × (1 + coinBonus업그레이드)
```

#### 업적 시스템
- 인게임에서 실시간 체크
- 달성 시 화면 상단 배너 알림 (2.7초)
- 업적 달성 → 스타터 자동 해금

---

## 던전 테마 (6종)

| 사이클 | 이름 | 타일 |
|--------|------|------|
| 1 | Tiny Woods | dungeon-tiny |
| 2 | Mt. Steel | dungeon-steel |
| 3 | Crystal Cave | dungeon-crystal |
| 4 | Mystic Forest | dungeon-forest |
| 5 | Frosty Forest | dungeon-frost |
| 6+ | Dark Crater | dungeon-floor |

---

## 난이도

| 사이클 | 라벨 |
|--------|------|
| 1 | (없음) |
| 2 | NORMAL+ |
| 3~4 | HARD |
| 5~6 | NIGHTMARE |
| 7+ | INFERNO |

사이클마다 적 HP/ATK 증가, 스폰 간격 감소, 웨이브 휴식 시간 감소.

---

## 스프라이트 시스템

- **출처**: [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) (GPL-3.0)
- **형식**: TexturePacker multiatlas (JSON + PNG)
- **프레임**: `Normal/{Action}/Anim/{Direction 0-7}/{FrameIndex}`
  - Actions: Walk, Idle, Attack, Hurt, Hop, Sleep 등
  - Directions: 0=Down ~ 7=DownLeft (8방향)
- **등록 종수**: 200+ (Gen 1~5)
- **초상화**: `portraits/{id}/Normal.png`
- **공격 이펙트**: 18종 타입별 스프라이트시트 (range/hit/melee)
- **BGM**: PMD 던전 음악 4곡 + 보스/위험/승리/타이틀 음악

---

## Tech Stack

| 기술 | 버전 |
|------|------|
| Phaser | 3.90.0 |
| TypeScript | 5.7+ |
| Vite | 6.4 |
| 배포 | GitHub Pages (Actions) |

### 프로젝트 구조

```
src/
├── main.ts                      # Phaser 게임 설정
├── config.ts                    # 상수 (390×844, 3000×3000 월드)
├── scenes/
│   ├── BootScene.ts             # 에셋 로딩 + 플레이스홀더 생성
│   ├── TitleScene.ts            # 스플래시 화면
│   ├── LobbyScene.ts            # 4탭 허브 (Play/Shop/Pokédex/Records)
│   └── GameScene.ts             # 메인 전투 오케스트레이터 (~1380줄)
├── managers/
│   ├── GameContext.ts            # Scene↔Manager 공유 인터페이스
│   ├── CombatManager.ts         # 투사체, 데미지, XP, 진화, 아이템
│   ├── EnemyManager.ts          # 스폰, AI, 포메이션, 보스
│   ├── UIManager.ts             # HUD, 미니맵, 경고, 파티클
│   └── CompanionManager.ts      # 동료, 군단
├── data/
│   ├── GameTypes.ts             # 공유 인터페이스/타입
│   ├── GameData.ts              # 진화 체인, 적 풀, 보스, 업적
│   └── SaveData.ts              # localStorage, 스타터, 스킬, 업그레이드
├── effects/
│   └── AttackEffects.ts         # 18종 타입별 공격 애니메이션
├── sprites/
│   └── PmdSpriteLoader.ts       # PAC 스프라이트 로더 (200+ 포켓몬)
├── audio/
│   └── SfxManager.ts            # BGM + SFX (PMD 음원)
└── ui/
    └── UIComponents.ts          # 재사용 UI: 버튼, 패널, 탭바, 코인뱃지
```

### 아키텍처

- **GameScene**: 상태 보유 + 라이프사이클 관리
- **Managers**: 순수 함수, GameContext 주입 방식
- **GameContext**: `this.ctx` getter → 스냅샷 객체 생성 → 매니저 실행 → `syncBack()` 반영
- **저장**: `localStorage` (poke-survivor-data)

---

## 로컬 개발

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ 생성
```

빌드 시 메모리 부족 발생하면:
```bash
NODE_OPTIONS="--max-old-space-size=1024" npx vite build
```

---

## Legal

- **코드**: [GPL v3](./LICENSE)
- **스프라이트 원본**: [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess) (GPL-3.0)
- **초상화/음악**: [PMD SpriteCollab](https://sprites.pmdcollab.org/) (CC BY-NC 4.0)
- **포켓몬 IP**: The Pokémon Company / Nintendo / Creatures / GAME FREAK

이 프로젝트는 **비상업적 팬게임**입니다.

- [NOTICE.md](./NOTICE.md) — 지적재산권 고지
- [CREDITS.md](./CREDITS.md) — 크레딧 & 라이선스
- [SECURITY.md](./SECURITY.md) — 보안 정책
