# 09. 기술 구현 & 퍼포먼스

## Phaser 3 프로젝트 구조

```
src/
├── scenes/
│   ├── BootScene.ts          # 에셋 로딩
│   ├── MenuScene.ts          # 메인 메뉴
│   ├── GameScene.ts          # 인게임
│   ├── LevelUpScene.ts       # 레벨업 오버레이
│   ├── CycleTransition.ts    # 사이클 전환
│   └── ResultScene.ts        # 결과
├── entities/
│   ├── AcePokemon.ts         # 플레이어 에이스
│   ├── CompanionPokemon.ts   # 동료
│   ├── EnemyPokemon.ts       # 적
│   ├── BossPokemon.ts        # 보스
│   ├── Legion.ts             # 군단
│   └── Projectile.ts         # 투사체
├── systems/
│   ├── CycleManager.ts       # 사이클 진행 관리
│   ├── LegionManager.ts      # 군단 LOD & 렌더
│   ├── WaveManager.ts        # 웨이브/스폰
│   ├── TypeSystem.ts         # 타입 상성
│   ├── WeatherSystem.ts      # 날씨
│   ├── EvolutionSystem.ts    # 진화
│   ├── ItemSystem.ts         # 아이템
│   ├── ScalingSystem.ts      # 수치 스케일링/세대
│   └── SaveSystem.ts         # 저장/불러오기
├── data/
│   ├── pokemon-stats.json    # 스탯 (오토체스 추출)
│   ├── abilities.json        # 기술 정의
│   ├── type-chart.json       # 상성표
│   ├── stages.json           # 스테이지 정의
│   └── items.json            # 아이템 정의
├── ui/
│   ├── HUD.ts
│   ├── Joystick.ts
│   ├── LevelUpPanel.ts
│   └── CycleTransitionUI.ts
└── utils/
    ├── SpriteLoader.ts       # PMD 스프라이트 로딩
    ├── TilesetRenderer.ts    # 타일셋 배경
    ├── ObjectPool.ts         # 오브젝트 풀
    └── ParticleManager.ts    # 파티클
```

## 퍼포먼스 — 무한을 가능하게 하는 기술

### 3단계 LOD (Level of Detail) for 군단

| LOD | 적용 | 렌더 | 데미지 계산 |
|-----|------|------|------------|
| 상세 | 최근 2개 | 4마리 풀 스프라이트 + 개별 AI | 실제 투사체 + 충돌 |
| 심플 | 3~8번째 | 에이스 1 + 오라 | 0.5초마다 AOE |
| 추상 | 9번째~ | 파티클 점 1개 | 1초마다 글로벌 DPS |

### 렌더링 상한 (고정)

```
상세 군단: 2 × 4 = 8 스프라이트
심플 군단: 최대 6 스프라이트
추상 군단: 파티클 (비용 ~0)
현재 파티: 4 스프라이트
적: 최대 80마리 (Object Pool)
투사체: 최대 50개 (Object Pool)
─────────────────────
총: ~150개 이하 (사이클 무관 고정)
```

### 적 관리

```
MAX_ENEMIES = 80

초과 시:
1. 가장 약한 적 즉사 처리
2. 새 적은 강한 개체로 스폰

사이클 높아질수록:
- 적 수 감소 (80 → 60 → 40)
- 개별 HP/ATK 상승
→ 오브젝트 수 감소, 전투감 유지
```

### 스프라이트 메모리 관리

```
로딩 전략:
1. 현재 파티: 항상 로드
2. 상세 군단: 로드
3. 심플 군단: 에이스 스프라이트만
4. 추상 군단: 스프라이트 없음
5. 현재 스테이지 적: 프리로드 (최대 15종)
6. 보스: 3:30 시점에 프리로드

사이클 전환 시:
- 이전 스테이지 적 언로드
- 새 적 프리로드
- 군단 LOD 재계산

메모리 상한: ~50MB (모바일 안전)
```

### 저장 시스템

```json
{
  "cycle": 12,
  "generation": 1,
  "legions": [
    {
      "ace": "PIKACHU",
      "companions": ["SQUIRTLE", "CHARMANDER", "EEVEE"],
      "power": 80,
      "skill": "ELECTRIC_FIELD",
      "cycleFormed": 1
    }
  ],
  "inventory": ["FOCUS_BAND", "WIDE_LENS"],
  "stardust": 12450,
  "pokedex": [25, 1, 4, 7, ...],
  "unlockedAces": ["PIKACHU", "BULBASAUR", ...]
}
```

저장은 **localStorage** + 선택적 클라우드 동기화.

## 성능 타겟

| 항목 | 목표 |
|------|------|
| FPS | 60fps (모바일 WebGL) |
| 로딩 | 첫 로딩 <5초, 사이클 전환 <2초 |
| 메모리 | <50MB |
| 배터리 | 30분 플레이 시 배터리 <15% 소모 |
| 오프라인 | PWA로 오프라인 플레이 가능 |

## 개발 로드맵

### Phase 1: 코어 프로토 (2~3주)
- [ ] Phaser 3 셋업
- [ ] 에이스 이동 + 조이스틱
- [ ] 동료 1종 자동공격
- [ ] 적 스폰 + AI
- [ ] 레벨업 선택
- [ ] 1사이클 완주 가능

### Phase 2: 사이클 루프 (3~4주)
- [ ] 사이클 전환 시스템
- [ ] 군단 시스템 (3단계 LOD)
- [ ] 보스 전투
- [ ] 타입 상성
- [ ] 아이템/진화
- [ ] 3사이클 연속 플레이

### Phase 3: 콘텐츠 (4~6주)
- [ ] 에이스 10종
- [ ] 동료 30종
- [ ] 적 50종
- [ ] 12스테이지 (1세대)
- [ ] 날씨 시스템
- [ ] 도감

### Phase 4: 폴리시 (2~3주)
- [ ] 세대 시스템 (2세대+)
- [ ] 모바일 최적화
- [ ] PWA
- [ ] 밸런스
- [ ] 크레딧 페이지
