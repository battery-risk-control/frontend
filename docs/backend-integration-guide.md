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
`taskkill /PID <PID> /F`로 정리. strictPort 설정으로 포트 충돌 시 즉시 에러가 뜨므로
최소한 문제 발생 자체는 바로 알아챌 수 있다.

```bash
npm run dev:live
```

`npm run dev`(기본)는 `.env.live`를 읽지 않으므로 항상 ①단계(mock)로 뜬다 — `dev:live`를 쓸
때만 실제 백엔드를 호출한다.

## 5. 종료 방법

`.env.live` 파일을 지울 필요가 없다 — 그냥 `npm run dev`로 돌아가면 자동으로 ①단계(mock)로
전환된다. 백엔드 컨테이너는 `docker compose down`(백엔드 레포 루트에서)으로 종료한다.

## 알려진 이슈

- **e2e 프리뷰 포트(4173) CORS 미허용** — Playwright e2e(`npm run test:e2e`)는
  `vite preview`(4173)를 대상으로 하는데, 백엔드 `CORS_ALLOWED_ORIGINS` 기본값에 4173이
  없어 실 백엔드 대상으로 e2e를 돌리면 대부분 실패한다. 백엔드 팀(minji) 확인 대기 중 —
  상세는 [docs/roadmap-candidates.md](roadmap-candidates.md) "C6" 참고.
- **테스트 계정 3종 미시드** — `purchasing@test.local`/`planning@test.local`/
  `executive@test.local`은 mock 전용이라 실제 DB에는 없다. 필요하면 회원가입 플로우로 직접
  만들거나, 백엔드의 기존 방식 가입 경로(`role` 필드 지정 시 즉시 APPROVED)로 시드한다.
