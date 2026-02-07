작업을 마무리하고 PR을 생성합니다.

사용법: /finish [관련 이슈 번호]
예시:
  /finish
  /finish #42
  /finish #42 #43

## 실행 절차

다음 단계를 순서대로 실행하세요:

### 1. 현재 상태 확인
- `git status`로 커밋되지 않은 변경사항 확인
- 변경사항이 있으면 의미 있는 메시지로 커밋할지 사용자에게 확인
- 현재 브랜치가 main이 아닌지 확인 (main이면 중단하고 알림)

### 2. 최신 main 리베이스
```bash
git fetch origin
git rebase origin/main
```
- 충돌 발생 시: 충돌 파일을 확인하고 해결한 후 `git rebase --continue`
- 해결이 어려운 충돌은 사용자에게 알리고 판단을 요청

### 3. 린트 확인
```bash
npm run lint
```
- 에러가 있으면 자동 수정 시도
- 수정한 내용은 별도 커밋

### 4. 빌드 확인
```bash
npm run build
```
- 빌드 실패 시 에러를 분석하고 수정 시도
- 수정한 내용은 별도 커밋

### 5. 푸시
```bash
git push origin HEAD
```
- force push가 필요한 경우 (리베이스 후) 사용자에게 확인 후 `git push --force-with-lease origin HEAD`

### 6. PR 생성
`gh pr create`로 PR을 생성합니다.

PR 본문 형식:
```
## 작업 내용
- 변경사항을 bullet point로 요약 (커밋 히스토리 기반)

## 테스트 방법
- 수동 테스트 또는 자동 테스트 방법 기술

## 관련 이슈
- $ARGUMENTS에 이슈 번호가 있으면 여기에 표시
- closes #이슈번호 형태로 자동 연결
```

PR 제목은 커밋 히스토리를 분석하여:
- 단일 기능이면: `feat: 기능 설명`
- 단일 수정이면: `fix: 수정 내용`
- 복합 작업이면: 가장 핵심적인 변경사항 기준으로 작성
- 70자 이내로 유지

### 7. 결과 보고
- 생성된 PR URL을 알려줍니다
