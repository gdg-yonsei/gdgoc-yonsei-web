import {
  Tailwind,
  pixelBasedPreset,
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
} from '@react-email/components'

interface NewParticipantProps {
  session: {
    name: string
    location: string
    startAt: string
    endAt: string
    leftCapacity: number
  }
  participantName: string
}

// 세션 날짜 포맷을 위한 options
const formatOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

/**
 * 새로운 세션이 생성될 때 참여 등록 되지 않은 같은 기수 멤버에게 보내는 메일
 *
 * @param session - 세션 이름
 * @param participantName - 참가자 이름
 * @constructor
 */
const NewParticipant = ({ session, participantName }: NewParticipantProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>[GDGoC Yonsei] 새로운 참가자가 등록했습니다.</Preview>
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
                <Column align="center">
                  {participantName}님이 {session.name}에 등록했습니다.
                </Column>
              </Row>
              <Row>
                <Column align="left" className={'text-sm'}>
                  남은 자리: {session.leftCapacity}
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
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

// 테스트 데이터
NewParticipant.PreviewProps = {
  session: {
    name: 'Front-End 세션',
    location: '도서관 세미나실',
    startAt: '2024-01-01 10:00',
    endAt: '2024-01-01 12:00',
    leftCapacity: 10,
  },
  participantName: '전현우',
} as NewParticipantProps

export default NewParticipant
