import { Locale } from '@/i18n-config'

export type McpClientId =
  | 'claude-code'
  | 'codex'
  | 'claude-web'
  | 'claude-desktop'
  | 'chatgpt-web'
  | 'chatgpt-desktop'

export interface McpInstallStep {
  text: string
  /** 복사 버튼과 함께 보여줄 명령어나 설정 */
  code?: string
}

export interface McpInstallGuide {
  id: McpClientId
  name: string
  steps: McpInstallStep[]
  note?: string
}

/**
 * 클라이언트별 GYMS MCP 연결 방법.
 * 메뉴 이름은 각 서비스 UI 가 바뀌면 함께 고쳐야 한다 (docs/architecture/mcp.md 참고).
 */
export function getMcpInstallGuides(
  locale: Locale,
  url: string
): McpInstallGuide[] {
  const codexToml = `[mcp_servers.gyms]\nurl = "${url}"`

  if (locale === 'ko') {
    return [
      {
        id: 'claude-code',
        name: 'Claude Code',
        steps: [
          {
            text: '터미널에서 아래 명령어를 실행합니다. 모든 프로젝트에서 쓰려면 --scope user 를 붙이세요.',
            code: `claude mcp add --transport http gyms ${url}`,
          },
          {
            text: 'Claude Code 에서 /mcp 를 입력하고 gyms 를 골라 Authenticate 를 누릅니다.',
            code: '/mcp',
          },
          {
            text: '브라우저가 열리면 GYMS 계정으로 로그인하고 허용할 권한을 고릅니다.',
          },
        ],
      },
      {
        id: 'codex',
        name: 'Codex',
        steps: [
          {
            text: '터미널에서 서버를 추가합니다.',
            code: `codex mcp add gyms --url ${url}`,
          },
          {
            text: '로그인 명령어를 실행하면 브라우저에서 로그인과 권한 선택 화면이 열립니다.',
            code: 'codex mcp login gyms',
          },
          {
            text: 'CLI, IDE 확장, Codex 앱은 ~/.codex/config.toml 을 함께 씁니다. 직접 편집하려면 아래 내용을 추가하세요.',
            code: codexToml,
          },
        ],
        note: 'IDE 확장에서는 톱니바퀴 → MCP servers → Add server → Streamable HTTP 를 고르고 URL 을 넣은 뒤 Authenticate 를 누르면 됩니다.',
      },
      {
        id: 'claude-web',
        name: 'Claude (웹)',
        steps: [
          {
            text: 'claude.ai 에서 Customize(설정) → Connectors 로 이동해 + → Add custom connector 를 누릅니다.',
          },
          {
            text: '이름은 GYMS, URL 에는 아래 주소를 넣고 Add 를 누릅니다.',
            code: url,
          },
          {
            text: 'Connect 를 눌러 GYMS 계정으로 로그인하고 권한을 고릅니다.',
          },
          {
            text: '채팅 입력창 왼쪽 아래 + → Connectors 에서 GYMS 를 켜고 사용합니다.',
          },
        ],
        note: '무료 플랜은 커스텀 커넥터를 1개만 추가할 수 있습니다. Team/Enterprise 플랜은 조직 Owner 가 먼저 Organization settings → Connectors 에 추가해야 합니다.',
      },
      {
        id: 'claude-desktop',
        name: 'Claude Desktop',
        steps: [
          {
            text: '커넥터는 Claude 계정에 저장됩니다. 웹에서 이미 추가했다면 데스크톱 앱에도 바로 나타납니다.',
          },
          {
            text: '아직이라면 앱에서 Customize(설정) → Connectors → + → Add custom connector 를 누르고 아래 URL 을 넣습니다.',
            code: url,
          },
          {
            text: 'Connect 로 로그인한 뒤, 채팅 입력창의 + → Connectors 에서 GYMS 를 켭니다.',
          },
        ],
        note: '원격 서버이므로 claude_desktop_config.json 을 편집할 필요가 없습니다.',
      },
      {
        id: 'chatgpt-web',
        name: 'ChatGPT (웹)',
        steps: [
          {
            text: 'chatgpt.com 에서 Settings → Security and login 으로 이동해 Developer mode 를 켭니다.',
          },
          {
            text: 'chatgpt.com/plugins (Plugins) 로 이동해 + 버튼을 누릅니다.',
          },
          {
            text: '이름은 GYMS 로 쓰고 설명을 입력합니다. Connection 의 MCP 서버 URL 에는 /mcp 경로까지 포함된 아래 주소를 넣습니다.',
            code: url,
          },
          {
            text: '연결을 만들면 GYMS 계정 로그인과 권한 선택 화면이 열립니다. 로그인한 뒤 서버에서 불러온 도구 목록을 확인합니다.',
          },
          {
            text: '새 대화를 열고 도구 메뉴(입력창의 +)에서 GYMS 연결을 추가해 사용합니다.',
          },
        ],
        note: 'Developer mode 는 계정·워크스페이스 정책에 따라 쓸 수 없을 수 있고, 쓰기 도구도 쓸 수 있습니다. ChatGPT 가 쓰기 작업 전에 확인을 요청하면 내용을 꼭 확인하세요. 도구가 바뀐 뒤에는 Plugins 에서 GYMS 연결을 열어 Refresh 를 누르세요.',
      },
      {
        id: 'chatgpt-desktop',
        name: 'ChatGPT Desktop',
        steps: [
          {
            text: 'MCP 연결은 웹에서 만드는 것을 권장합니다. 먼저 ChatGPT (웹) 탭의 방법대로 GYMS 연결을 등록하세요.',
          },
          {
            text: '같은 계정으로 로그인한 데스크톱 앱에서 새 대화를 열고 도구 메뉴에서 GYMS 연결을 추가합니다.',
          },
        ],
        note: '앱 버전에 따라 데스크톱에서 GYMS 연결이 보이지 않을 수 있습니다. 그럴 때는 웹에서 사용하세요.',
      },
    ]
  }

  return [
    {
      id: 'claude-code',
      name: 'Claude Code',
      steps: [
        {
          text: 'Run this in a terminal. Add --scope user to use it in every project.',
          code: `claude mcp add --transport http gyms ${url}`,
        },
        {
          text: 'In Claude Code, type /mcp, pick gyms and choose Authenticate.',
          code: '/mcp',
        },
        {
          text: 'Sign in with your GYMS account in the browser and choose the permissions to grant.',
        },
      ],
    },
    {
      id: 'codex',
      name: 'Codex',
      steps: [
        {
          text: 'Add the server from a terminal.',
          code: `codex mcp add gyms --url ${url}`,
        },
        {
          text: 'Log in. A browser opens for sign-in and permissions.',
          code: 'codex mcp login gyms',
        },
        {
          text: 'The CLI, IDE extension and Codex app share ~/.codex/config.toml. To edit it by hand, add:',
          code: codexToml,
        },
      ],
      note: 'In the IDE extension: gear menu → MCP servers → Add server → Streamable HTTP, paste the URL, save, then Authenticate.',
    },
    {
      id: 'claude-web',
      name: 'Claude (web)',
      steps: [
        {
          text: 'On claude.ai, open Customize (Settings) → Connectors, then + → Add custom connector.',
        },
        {
          text: 'Name it GYMS, paste this URL and click Add.',
          code: url,
        },
        {
          text: 'Click Connect, sign in with your GYMS account and choose permissions.',
        },
        {
          text: 'In a chat, open + → Connectors at the bottom left and turn GYMS on.',
        },
      ],
      note: 'Free plans can add one custom connector. On Team/Enterprise plans an Owner must first add it under Organization settings → Connectors.',
    },
    {
      id: 'claude-desktop',
      name: 'Claude Desktop',
      steps: [
        {
          text: 'Connectors are saved to your Claude account. If you added GYMS on the web, it already shows up in the desktop app.',
        },
        {
          text: 'Otherwise open Customize (Settings) → Connectors → + → Add custom connector in the app and paste this URL.',
          code: url,
        },
        {
          text: 'Click Connect to sign in, then turn GYMS on from + → Connectors in a chat.',
        },
      ],
      note: 'It is a remote server, so you do not need to edit claude_desktop_config.json.',
    },
    {
      id: 'chatgpt-web',
      name: 'ChatGPT (web)',
      steps: [
        {
          text: 'On chatgpt.com, open Settings → Security and login and turn on Developer mode.',
        },
        {
          text: 'Go to chatgpt.com/plugins (Plugins) and click the + button.',
        },
        {
          text: 'Name it GYMS and add a description. Under Connection, paste this URL as the MCP server URL, including the /mcp path.',
          code: url,
        },
        {
          text: 'Create the connection, sign in with your GYMS account and choose permissions, then review the tools discovered from the server.',
        },
        {
          text: 'Start a new chat and add the GYMS connection from the tools menu (+ in the composer).',
        },
      ],
      note: 'Developer mode may be unavailable depending on your account or workspace policy, and it can run write tools. Read the details when ChatGPT asks you to confirm a write. After the tools change, open the GYMS connection in Plugins and click Refresh.',
    },
    {
      id: 'chatgpt-desktop',
      name: 'ChatGPT Desktop',
      steps: [
        {
          text: 'We recommend creating the MCP connection on the web. Register GYMS first by following the ChatGPT (web) tab.',
        },
        {
          text: 'In the desktop app, signed in with the same account, start a new chat and add the GYMS connection from the tools menu.',
        },
      ],
      note: 'Some app versions may not show the GYMS connection on desktop. If so, use ChatGPT on the web.',
    },
  ]
}
