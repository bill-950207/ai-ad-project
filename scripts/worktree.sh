#!/bin/bash
# 워크트리 통합 관리 스크립트
# 사용법: ./scripts/worktree.sh <command> [options]

set -e

MAIN_PROJECT="/Users/bill/Desktop/projects/ai_ad_project"
PROJECT_NAME="ai_ad_project"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "사용법: ./scripts/worktree.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create <feature-name>  새 워크트리 생성 (feature/<name> 브랜치 자동 생성)"
    echo "  list                   현재 워크트리 목록"
    echo "  remove <feature-name>  워크트리 제거"
    echo "  status                 모든 워크트리 상태 확인"
    echo ""
    echo "Examples:"
    echo "  ./scripts/worktree.sh create user-auth"
    echo "  ./scripts/worktree.sh list"
    echo "  ./scripts/worktree.sh remove user-auth"
}

# 워크트리 생성
create_worktree() {
    local feature_name="$1"

    if [ -z "$feature_name" ]; then
        echo -e "${RED}Error: feature name required${NC}"
        echo "Usage: ./scripts/worktree.sh create <feature-name>"
        exit 1
    fi

    local branch_name="feature/${feature_name}"
    local worktree_path="../${PROJECT_NAME}-${feature_name}"

    echo -e "${BLUE}📁 Creating worktree for: ${branch_name}${NC}"

    # 현재 main에서 최신 상태 가져오기
    echo -e "${YELLOW}🔄 Fetching latest from origin...${NC}"
    git fetch origin main

    # 브랜치가 이미 존재하는지 확인
    if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
        echo -e "${YELLOW}⚠️  Branch ${branch_name} already exists, using existing branch${NC}"
        git worktree add "$worktree_path" "$branch_name"
    else
        echo -e "${GREEN}✨ Creating new branch: ${branch_name}${NC}"
        git worktree add -b "$branch_name" "$worktree_path" origin/main
    fi

    # 워크트리로 이동하여 설정 실행
    echo -e "${BLUE}📦 Running setup in worktree...${NC}"
    cd "$worktree_path"

    # setup-worktree.sh 실행
    if [ -f "./scripts/setup-worktree.sh" ]; then
        ./scripts/setup-worktree.sh
    else
        # 직접 설정 수행
        echo "📦 Installing dependencies..."
        npm install

        echo "🔐 Copying .env file..."
        if [ -f "$MAIN_PROJECT/.env" ]; then
            cp "$MAIN_PROJECT/.env" .
            echo "✓ .env copied"
        fi

        echo "🗄️  Generating Prisma client..."
        npm run db:generate
    fi

    echo ""
    echo -e "${GREEN}✅ Worktree created successfully!${NC}"
    echo -e "${BLUE}📍 Location: ${worktree_path}${NC}"
    echo -e "${BLUE}🌿 Branch: ${branch_name}${NC}"
    echo ""
    echo "다음 단계:"
    echo "  cd ${worktree_path}"
    echo "  npm run dev"
}

# 워크트리 목록
list_worktrees() {
    echo -e "${BLUE}📋 Current worktrees:${NC}"
    echo ""
    git worktree list
    echo ""

    # 추가 정보 표시
    echo -e "${YELLOW}Worktree details:${NC}"
    for worktree in $(git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2); do
        if [ "$worktree" != "$MAIN_PROJECT" ]; then
            local branch=$(git -C "$worktree" branch --show-current 2>/dev/null || echo "unknown")
            local status=$(git -C "$worktree" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
            echo -e "  ${GREEN}${worktree}${NC}"
            echo -e "    Branch: ${branch}"
            echo -e "    Uncommitted changes: ${status} files"
        fi
    done
}

# 워크트리 제거
remove_worktree() {
    local feature_name="$1"

    if [ -z "$feature_name" ]; then
        echo -e "${RED}Error: feature name required${NC}"
        echo "Usage: ./scripts/worktree.sh remove <feature-name>"
        exit 1
    fi

    local worktree_path="../${PROJECT_NAME}-${feature_name}"
    local branch_name="feature/${feature_name}"

    if [ ! -d "$worktree_path" ]; then
        echo -e "${RED}Error: Worktree not found: ${worktree_path}${NC}"
        exit 1
    fi

    # 커밋되지 않은 변경사항 확인
    local uncommitted=$(git -C "$worktree_path" status --porcelain 2>/dev/null | wc -l | tr -d ' ')
    if [ "$uncommitted" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Warning: ${uncommitted} uncommitted changes in worktree${NC}"
        read -p "Continue anyway? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "Cancelled."
            exit 0
        fi
    fi

    echo -e "${BLUE}🗑️  Removing worktree: ${worktree_path}${NC}"
    git worktree remove "$worktree_path" --force

    echo -e "${GREEN}✅ Worktree removed${NC}"
    echo ""
    echo -e "${YELLOW}Note: Branch '${branch_name}' still exists.${NC}"
    echo "To delete the branch: git branch -D ${branch_name}"
}

# 모든 워크트리 상태
status_worktrees() {
    echo -e "${BLUE}📊 Worktree Status:${NC}"
    echo ""

    for worktree in $(git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2); do
        local name=$(basename "$worktree")
        local branch=$(git -C "$worktree" branch --show-current 2>/dev/null || echo "detached")
        local ahead=$(git -C "$worktree" rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
        local behind=$(git -C "$worktree" rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
        local status=$(git -C "$worktree" status --porcelain 2>/dev/null | wc -l | tr -d ' ')

        echo -e "${GREEN}${name}${NC} (${branch})"
        echo -e "  Commits: +${ahead} / -${behind} vs origin/main"
        echo -e "  Uncommitted: ${status} files"
        echo ""
    done
}

# 메인 실행
case "$1" in
    create)
        create_worktree "$2"
        ;;
    list)
        list_worktrees
        ;;
    remove)
        remove_worktree "$2"
        ;;
    status)
        status_worktrees
        ;;
    *)
        print_usage
        exit 1
        ;;
esac
