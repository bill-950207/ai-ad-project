#!/bin/bash
# 워크트리 초기 설정 스크립트
# 사용법: ./scripts/setup-worktree.sh

set -e

MAIN_PROJECT="/Users/bill/Desktop/projects/ai_ad_project"

echo "📦 Installing dependencies..."
npm install

echo "🔐 Copying .env file..."
if [ -f "$MAIN_PROJECT/.env" ]; then
  cp "$MAIN_PROJECT/.env" .
  echo "✓ .env copied"
else
  echo "⚠️  .env not found in main project"
fi

echo "🗄️  Generating Prisma client..."
npm run db:generate

echo "✅ Worktree setup complete!"
