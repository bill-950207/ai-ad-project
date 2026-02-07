새 작업 브랜치를 생성하고 최신 main 기반으로 작업을 시작합니다.

사용법: /start <branch-name>
예시:
  /start feature/user-auth
  /start fix/login-error
  /start refactor/api-cleanup

브랜치명에 prefix(feature/, fix/, refactor/)가 없으면 적절한 prefix를 추천해주세요.

## 실행 절차

다음 단계를 순서대로 실행하세요:

1. **현재 상태 확인**: 커밋되지 않은 변경사항이 있는지 `git status`로 확인합니다. 변경사항이 있으면 사용자에게 알리고 진행 여부를 확인합니다.

2. **최신 main 동기화**:
   ```bash
   git fetch origin
   git checkout main
   git pull origin main
   ```

3. **새 브랜치 생성**:
   ```bash
   git checkout -b $ARGUMENTS
   ```

4. **결과 보고**: 생성된 브랜치명과 현재 상태를 알려줍니다.

## 브랜치명 컨벤션

- `feature/` - 새 기능 개발
- `fix/` - 버그 수정
- `refactor/` - 코드 리팩토링

$ARGUMENTS 값이 prefix 없이 전달되면 (예: `user-auth`), 작업 내용을 파악하여 적절한 prefix를 추천하세요.
