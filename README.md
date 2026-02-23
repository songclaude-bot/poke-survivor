# Poké Survivor — 포켓몬 서바이버즈

> 포켓몬 뱀서라이크 웹게임 | Phaser 3 | 모바일 웹

5분마다 새 포켓몬을 골라 파티를 짓고, 보스를 잡고, 군단을 키워 끝없이 강해져라.

## Status

**기획 단계** — 게임 디자인 문서(GDD) 작성 중

## Overview

| 항목 | 내용 |
|------|------|
| 장르 | 뱀서라이크 (Vampire Survivors류) |
| 플랫폼 | 모바일 웹 (Phaser 3), 세로(portrait) |
| 조작 | 한손 가상 조이스틱, 공격 자동 |
| 플레이 | 5분 사이클 × 무한 반복 |
| 성격 | 비상업적 팬게임 |

## Core Loop

```
5분 플레이 → 보스 격파 → 파티가 "군단"으로 압축 → 새 에이스 선택 → 다음 5분
```

매 사이클마다 군단이 하나씩 늘어나고, 적도 강해진다.
군단은 이전 사이클의 파티가 축소된 형태로 영구히 자동 전투에 참여.

## Docs

기획 문서는 [`docs/`](./docs/) 디렉토리에 정리되어 있습니다:

| 문서 | 내용 |
|------|------|
| [00-overview](docs/00-overview.md) | 게임 개요, 차별점, 리소스 |
| [01-core-loop](docs/01-core-loop.md) | 5분 사이클 루프, 타임라인, 규칙 |
| [02-pokemon-roles](docs/02-pokemon-roles.md) | 1,000마리 역할 분배, 에이스/동료/적/보스 |
| [03-skills-weapons](docs/03-skills-weapons.md) | 기술 분류, 무기 아키타입, 타입 상성 |
| [04-legion-system](docs/04-legion-system.md) | 군단 시스템, LOD, 재귀 성장 |
| [05-scaling](docs/05-scaling.md) | 무한 스케일링, 세대 시스템 |
| [06-stages](docs/06-stages.md) | 스테이지 구성, 날씨 |
| [07-items](docs/07-items.md) | 아이템, 나무열매, 진화석, 상태이상 |
| [08-ui-ux](docs/08-ui-ux.md) | HUD, 메뉴, 초상화 활용 |
| [09-tech-spec](docs/09-tech-spec.md) | 기술 구현, 퍼포먼스, 로드맵 |

## Legal

- **코드**: [GPL v3](./LICENSE)
- **에셋 원본**: CC BY-NC 4.0 ([PMD SpriteCollab](https://sprites.pmdcollab.org/))
- **포켓몬 IP**: The Pokémon Company / Nintendo / Creatures / GAME FREAK

이 프로젝트는 **비상업적 팬게임**입니다. 상세 내용:
- [NOTICE.md](./NOTICE.md) — 지적재산권 고지
- [CREDITS.md](./CREDITS.md) — 크레딧 & 라이선스 상세
- [SECURITY.md](./SECURITY.md) — 보안 정책 (퍼블릭 전환 체크리스트)

## Resource Attribution

스프라이트, BGM, 게임 데이터는 [pokemonAutoChess](https://github.com/keldaanCommunity/pokemonAutoChess)에서 파생.
개별 스프라이트 기여자: [SpriteCollab Credits](https://sprites.pmdcollab.org/#/credits)
