-- 첫 공지. 고정 id라 마이그레이션을 다시 적용해도 한 번만 들어간다.
INSERT INTO "announcements" ("id", "title", "body", "ctaLabel", "ctaHref")
VALUES (
	'5b0c6a52-7f1e-4c39-9d2a-6e1f3c8b4a01',
	'GYMS MCP가 추가되었습니다',
	E'Claude, ChatGPT, Codex 같은 AI 도구에 GYMS를 연결할 수 있습니다. 연결하면 대화로 세션 일정을 확인하고 참가 신청을 하거나, 프로젝트를 조회하고 내 프로필을 고칠 수 있습니다.\n\nAI는 내 역할이 허용하는 작업만 할 수 있고, 연결할 때 허용할 권한을 직접 고릅니다.',
	'설치 방법 보기',
	'/admin/mcp'
)
ON CONFLICT ("id") DO NOTHING;
