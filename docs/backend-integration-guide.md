# 백엔드 연결 시연 가이드 (②서비스 테스트 단계)

## 목적

이 문서는 프론트엔드를 실제 백엔드(Spring Boot)에 연결해 시연·QA하는 절차를 정리한다 —
CLAUDE.md "환경 단계" 3단계 모델 중 **②서비스 테스트**로의 전환 방법이다. ①프론트엔드
단독(mock) 모드는 별도 설정 없이 `npm run dev`로 항상 그대로 유지된다.

## 1. 백엔드 레포 준비

백엔드는 이 프론트엔드 레포와 별도 레포다. 이 프론트엔드 레포 **밖**(예: 상위 폴더)에 별도로
clone한다.

```bash
git clone --branch minji https://github.com/battery-risk-control/backend.git backend
```

이미 clone돼 있다면 `minji` 브랜치로 체크아웃 후 `git pull`.

## 2. 백엔드 로컬 기동 (Docker Compose)

백엔드 레포 루트에서:

```bash
docker compose up -d postgres fastapi spring
```

`spring` 서비스가 `healthy` 상태가 될 때까지 기다린다(`docker compose ps`로 확인, Swagger는
http://localhost:8080/swagger-ui.html). 처음 실행이면 이미지 빌드에 시간이 걸릴 수 있다.

## 3. 프론트엔드 환경변수 설정

이 레포 루트에서 `.env.live.example`을 `.env.live`로 복사한다.

```bash
cp .env.live.example .env.live
```

`.env.live`의 `VITE_API_BASE_URL` 값이 실제 백엔드 주소와 맞는지 확인/수정한다(로컬
docker-compose 기준 기본값 `http://localhost:8080`).

## 4. 프론트엔드를 ②단계로 실행

⚠️ dev:live 종료 후 재실행 전에는 `netstat -ano | findstr :5173`으로 포트가 실제로
비어있는지 확인할 것 — Ctrl+C→Y로도 vite 프로세스가 완전히 안 죽는 경우가 있다
(Windows/node 조합에서 보고되는 이슈). 남아있다면 `tasklist /FI "PID eq <PID>"`로 확인 후
`taskkill /PID <PID> /F`로 정리. `vite.config.ts`의 `strictPort`는 `mode === 'live'`일 때만
적용되므로(5173 고정), dev:live가 5173을 점유한 상태에서 dev:live를 또 띄우면(또는 dev:live가
먼저 5173을 차지한 뒤 다른 dev:live 인스턴스를 또 띄우면) 조용히 다른 포트로 밀리지 않고
즉시 에러가 떠 문제 발생 자체는 바로 알아챌 수 있다.

**mock(dev)과 live(dev:live) 동시 구동**: `npm run dev`(mock)는 위 strictPort 대상이 아니라
Vite 기본 동작(포트 점유 시 5174 등으로 자동 이동)을 그대로 따른다. 따라서 `dev:live`를 먼저
띄워 5173에 고정한 뒤 `npm run dev`를 추가로 띄우면 mock은 자동으로 5174에서 뜬다 — 두 브라우저
탭을 나란히 열어 mock 화면과 실제 백엔드 연결 화면을 직접 비교하며 시연할 수 있다. 반대로
mock을 먼저 띄운 상태에서 `dev:live`를 실행하면(5173이 이미 점유돼 있으므로) strictPort 때문에
즉시 에러가 난다 — live는 5173 고정이 전제라 `dev:live`를 먼저 띄우는 순서를 권장한다.

```bash
npm run dev:live
```

`npm run dev`(기본)는 `.env.live`를 읽지 않으므로 항상 ①단계(mock)로 뜬다 — `dev:live`를 쓸
때만 실제 백엔드를 호출한다.

## 5. 종료 방법

`.env.live` 파일을 지울 필요가 없다 — 그냥 `npm run dev`로 돌아가면 자동으로 ①단계(mock)로
전환된다. 백엔드 컨테이너는 `docker compose down`(백엔드 레포 루트에서)으로 종료한다.

## 알려진 이슈

- ~~e2e 프리뷰 포트(4173) CORS 미허용~~ — **해결됨(2026-07-27)**. 백엔드 `CORS_ALLOWED_ORIGINS`
  에 4173이 정식 추가됐다(`bb9f17a`). 상세는 [docs/roadmap-candidates.md](roadmap-candidates.md)
  "C6" 참고.
- ~~테스트 계정 3종 미시드~~ — **해결됨(2026-07-27)**. 백엔드 `AUTH_TEST_SEED_ENABLED=true`
  설정 시 `purchasing`/`planning`/`executive@test.local`(비번 `test1234!`, APPROVED)과
  `pending@company.com`(비번 `anything`, PENDING)이 자동 시드된다(`bb9f17a`,
  `AuthTestSeedConfig.java`). 로컬에서 실 백엔드 대상 시연/e2e를 돌릴 때는 백엔드 `.env`
  (또는 `docker compose` 환경변수)에 `AUTH_TEST_SEED_ENABLED=true`를 설정하고
  `docker compose up -d --build postgres fastapi spring`으로 재기동해야 한다(기본값은
  `false` — 운영 환경에 이 계정들이 새는 것을 막기 위함). **CI에서 실 백엔드 대상 e2e를
  돌릴 때도 이 환경변수가 필요하다** — 백엔드 구동 스텝을 갖고 있는 쪽(백엔드 레포 CI)에서
  설정해야 한다.
- **실 DB 대상 e2e는 고정 이메일 재사용 시 유니크 제약으로 실패할 수 있음** — mock은
  무상태라 재발 안 함(2026-07-27 실측: `pending-approval.spec.ts`의 회원가입 테스트가 고정
  이메일 `hong@company.com`을 재사용해 실 DB 대상 2회차 실행부터 실패, 24개 중 1개
  실패 → 원인 규명 후 수정). 신규 e2e 작성 시 회원가입류 테스트는 고정 이메일 대신 매번
  고유값(예: `` `hong-${Date.now()}@company.com` ``)을 쓰는 것을 기본으로 한다.
