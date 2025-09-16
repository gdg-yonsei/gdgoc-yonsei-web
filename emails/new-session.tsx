import {
  Tailwind,
  pixelBasedPreset,
  Button,
  Html,
  Head,
  Body,
  Preview,
  Container,
  Heading,
  Img,
  Section,
  Row,
  Column,
  Hr,
} from '@react-email/components'

interface NewSessionProps {
  session: {
    name: string
    location: string
    startAt: string
    endAt: string
    leftCapacity: number
  }
  part: string
  generation: string
  registerUrl: string
}

const formatOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

const NewSession = ({
  session,
  part,
  generation,
  registerUrl,
}: NewSessionProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>[GDGoC Yonsei] 새로운 세션이 생성되었습니다.</Preview>
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={'https://gdgoc.yonsei.ac.kr/gdgoc-logo.png'}
                className={'mx-auto size-24'}
              ></Img>
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
              GDGoC Yonsei
            </Heading>
            <Section className={'rounded-lg bg-neutral-100 p-4 py-8'}>
              <Row className={'py-4 text-xl font-semibold'}>
                <Column align="center">{session.name}</Column>
              </Row>
              <Row>
                <Column align="left" className={'text-sm'}>
                  Part: {generation} {part}
                </Column>
              </Row>
              <Row>
                <Column align="left" className={'text-sm'}>
                  시작:{' '}
                  {new Intl.DateTimeFormat('ko-KR', formatOptions).format(
                    new Date(session.startAt)
                  )}
                </Column>
              </Row>
              <Row>
                <Column align="left" className={'text-sm'}>
                  종료:{' '}
                  {new Intl.DateTimeFormat('ko-KR', formatOptions).format(
                    new Date(session.endAt)
                  )}
                </Column>
              </Row>
              <Row className={'text-sm'}>
                <Column align="left">장소: {session.location}</Column>
              </Row>
            </Section>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
                href={registerUrl}
              >
                세션 참가하기
              </Button>
            </Section>
            <p className="text-[14px] leading-[24px] text-black">
              또는 GYMS 세션 페이지에서 참가 등록을 해주세요.
            </p>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <p className="text-[12px] leading-[24px] text-[#666666]">
              세션 생성 알림을 받고 싶지 않으시자면 GYMS 프로필 페이지에서 수신
              설정을 꺼주세요.
            </p>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

NewSession.PreviewProps = {
  session: {
    name: 'Front-End 세션',
    location: '도서관 세미나실',
    startAt: '2024-01-01 10:00',
    endAt: '2024-01-01 12:00',
    leftCapacity: 10,
  },
  part: 'Front-End',
  generation: '25-26',
  registerUrl: 'https://gdgoc.yonsei.ac.kr/admin/sessions/ddd/register',
} as NewSessionProps
export default NewSession
