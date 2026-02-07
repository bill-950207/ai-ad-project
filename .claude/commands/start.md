새 작업 브랜치를 생성하고 최신 main 기반으로 작업을 시작합니다.

사용법: /start [branch-name]
예시:
  /start feature/user-auth
  /start fix/login-error
  /start refactor/api-cleanup
  /start                        # 브랜치명 자동 생성

## 실행 절차

다음 단계를 순서대로 실행하세요:

### 1. 현재 상태 확인
커밋되지 않은 변경사항이 있는지 `git status`로 확인합니다. 변경사항이 있으면 사용자에게 알리고 진행 여부를 확인합니다.

### 2. 브랜치명 결정
- **$ARGUMENTS가 있는 경우**: 해당 값을 브랜치명으로 사용
  - prefix가 없으면 작업 내용에 맞는 prefix를 추천
- **$ARGUMENTS가 비어있는 경우**: 사용자에게 어떤 작업을 할 건지 물어본 후, 답변을 기반으로 브랜치명을 자동 생성
  - 예: "로그인 버그 수정" → `fix/login-bug`
  - 예: "아바타 목록 API 추가" → `feature/avatar-list-api`
  - 영어 kebab-case로 변환하여 생성
  - 생성한 브랜치명을 사용자에게 보여주고 확인 후 진행

### 3. 최신 main 동기화
```bash
git fetch origin
git checkout main
git pull origin main
```

### 4. 새 브랜치 생성
```bash
git checkout -b <브랜치명>
```

### 5. 결과 보고
생성된 브랜치명과 현재 상태를 알려줍니다.

## 브랜치명 컨벤션

- `feature/` - 새 기능 개발
- `fix/` - 버그 수정
- `refactor/` - 코드 리팩토링
