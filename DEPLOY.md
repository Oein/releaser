# 배포 가이드

배포 대상: `oeinct` → `/opt/deploy-web`  
서비스 포트: `38571`

---

## 최초 배포 (이미 완료됨)

```bash
# 1. 서버에 디렉토리 생성
ssh oeinct "mkdir -p /opt/deploy-web"

# 2. 소스 전송
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='data' --exclude='.env.local' \
  /home/oein/deploy-web/ oeinct:/opt/deploy-web/

# 3. 서버에서 의존성 설치 및 빌드
# npm rebuild better-sqlite3 필수 — Node.js 버전에 맞게 native 바이너리 재컴파일
ssh oeinct "cd /opt/deploy-web && \
  PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v24.14.1/bin \
  npm install --legacy-peer-deps && \
  npm rebuild better-sqlite3 && \
  npm run build"

# 4. 환경변수 설정
ssh oeinct "nano /opt/deploy-web/.env"
# ADMIN_ID, ADMIN_PASSWORD, SESSION_SECRET 수정

# 5. systemd 서비스 등록 (이미 완료)
# /etc/systemd/system/deploy-web.service 참고

# 6. 서비스 시작
ssh oeinct "systemctl daemon-reload && systemctl enable deploy-web && systemctl start deploy-web"
```

---

## 코드 업데이트 배포

```bash
# 로컬에서 빌드 후 배포
cd /home/oein/deploy-web

# 1. 소스 전송 (data/, node_modules/, .next/ 제외)
rsync -avz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='data' \
  --exclude='.env.local' \
  /home/oein/deploy-web/ \
  oeinct:/opt/deploy-web/

# 2. 서버에서 빌드
ssh oeinct "cd /opt/deploy-web && \
  PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v24.14.1/bin \
  npm install --legacy-peer-deps && \
  npm rebuild better-sqlite3 && \
  npm run build && \
  systemctl restart deploy-web"

# 3. 상태 확인
ssh oeinct "systemctl status deploy-web --no-pager"
```

---

## 환경변수 (`/opt/deploy-web/.env`)

```env
ADMIN_ID=admin
ADMIN_PASSWORD=<강력한 비밀번호>
SESSION_SECRET=<32자 이상의 랜덤 문자열>
```

변경 후 서비스 재시작 필요:
```bash
ssh oeinct "systemctl restart deploy-web"
```

---

## 서비스 관리

```bash
# 상태 확인
ssh oeinct "systemctl status deploy-web"

# 로그 확인
ssh oeinct "journalctl -u deploy-web -f"
ssh oeinct "journalctl -u deploy-web -n 100"

# 재시작
ssh oeinct "systemctl restart deploy-web"

# 중지
ssh oeinct "systemctl stop deploy-web"
```

---

## 데이터 위치

| 항목 | 경로 |
|------|------|
| SQLite DB | `/opt/deploy-web/data/deploy.db` |
| 업로드 파일 | `/opt/deploy-web/data/files/` |
| 환경변수 | `/opt/deploy-web/.env` |
| systemd 서비스 | `/etc/systemd/system/deploy-web.service` |

> `data/` 디렉토리는 rsync 대상에서 제외되어 배포 시 덮어쓰이지 않습니다.
