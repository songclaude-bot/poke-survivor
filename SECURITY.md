# Security Policy

## 이 레포는 추후 퍼블릭 전환 예정입니다

private → public 전환 전 반드시 아래 체크리스트를 완료하세요.

## 퍼블릭 전환 전 체크리스트

- [ ] `git log --all --full-history` 에서 시크릿/토큰/키 노출 이력 없음 확인
- [ ] `.env` 파일이 커밋된 적 없음 확인 (`git log --all --diff-filter=A -- '*.env*'`)
- [ ] API 키, PAT, 비밀번호가 코드에 하드코딩되지 않았음 확인
- [ ] 이미지/에셋에 민감 정보 없음 확인 (EXIF 메타데이터 등)
- [ ] `CREDITS.md` 및 `LICENSE` 파일이 최신 상태임 확인
- [ ] 저작권 관련 NOTICE가 모든 소스 파일에 포함됨 확인

## 커밋 시 금지 사항

다음 항목은 **절대** 커밋하지 않습니다:

- API 키, 토큰, 비밀번호, 개인정보
- `.env` 파일 (`.gitignore`에 등록됨)
- 인증서/키 파일 (`*.pem`, `*.key`, `*.cert`)
- 외부 서비스 credentials
- 사용자 개인정보가 포함된 데이터

## 시크릿이 실수로 커밋된 경우

1. 해당 시크릿을 즉시 무효화 (토큰 재발급 등)
2. `git filter-branch` 또는 `git-filter-repo`로 이력에서 제거
3. force push 전 반드시 백업

## 보안 관련 문의

이 프로젝트 관련 보안 이슈는 레포 관리자에게 직접 연락하세요.
