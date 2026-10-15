import Breadcrumbs from '@/app/components/site/breadcrumbs'
import PageTransition from '@/app/components/site/page-transition'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { chromeCopy } from '@/lib/contents/site-copy'
import { Metadata } from 'next'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import { localeStaticParams } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n/server'
import { localeHref } from '@/lib/site/routes'
import AnalyticsOptOut from '@/app/components/site/analytics-opt-out'
import { buttonClasses } from '@/app/components/site/button-link'

export function generateStaticParams() {
  return localeStaticParams()
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale()

  if (lang === 'ko') {
    return createLocalizedMetadata({
      locale: lang,
      path: '/privacy-policy',
      title: `개인정보처리방침`,
      description:
        'GDGoC Yonsei 웹사이트의 개인정보 수집, 이용, 보관, 파기 절차와 이용자 권리 및 개인정보 보호 조치를 안내합니다.',
    })
  }

  return createLocalizedMetadata({
    locale: lang,
    path: '/privacy-policy',
    title: `Privacy Policy`,
    description:
      'Read how the GDGoC Yonsei website collects, uses, stores, protects, and deletes personal information, including your privacy rights and choices.',
  })
}

export default async function PrivacyPolicyPage() {
  const lang = await getLocale()
  const common = archiveCommonCopy[lang]
  const isKorean = lang === 'ko'

  return (
    <PageTransition>
      <div className="site-page">
        <Breadcrumbs
          label={common.breadcrumb}
          items={[
            { label: common.home, href: localeHref(lang) },
            { label: chromeCopy[lang].privacy },
          ]}
        />
        <div id="content">
          <article className="policy-doc site-prose prose">
            {isKorean ? (
              <>
                {}
                <section>
                  <h1>웹사이트 개인정보처리방침</h1>
                  <p>
                    본 개인정보처리방침은{' '}
                    <strong>
                      Google Developer Group on Campus Yonsei University
                    </strong>{' '}
                    (이하 ‘GDGoC Yonsei’)가 이용자의 개인정보를 수집, 이용,
                    보관, 파기하는 방식에 대해 설명합니다. ‘GDGoC Yonsei’는
                    대한민국 개인정보보호법 및 관련 법령을 준수하며, 이용자의
                    개인정보 보호를 위해 최선을 다하고 있습니다.
                  </p>
                  <hr />
                </section>
                {}
                <nav aria-label="섹션 목록">
                  <h2>목차</h2>
                  <ol>
                    <li>
                      <a href="#purpose">개인정보의 수집 및 이용 목적</a>
                    </li>
                    <li>
                      <a href="#items">수집하는 개인정보 항목 및 수집 방법</a>
                    </li>
                    <li>
                      <a href="#retention">개인정보의 처리 및 보유 기간</a>
                    </li>
                    <li>
                      <a href="#outsourcing">
                        개인정보의 제3자 제공 및 처리 위탁
                      </a>
                    </li>
                    <li>
                      <a href="#rights">
                        정보주체와 법정대리인의 권리·의무 및 행사 방법
                      </a>
                    </li>
                    <li>
                      <a href="#security">개인정보의 안전성 확보 조치</a>
                    </li>
                    <li>
                      <a href="#dpo">개인정보 보호책임자</a>
                    </li>
                    <li>
                      <a href="#analytics">
                        자동 수집 장치의 설치·운영 및 거부
                      </a>
                    </li>
                    <li>
                      <a href="#change">개인정보처리방침의 변경</a>
                    </li>
                  </ol>
                </nav>
                {}
                <section id="purpose">
                  <h2>1. 개인정보의 수집 및 이용 목적</h2>
                  <p>
                    ‘GDGoC Yonsei’는 다음의 목적을 위해 최소한의 개인정보를
                    수집하고 이용합니다. 수집된 개인정보는 다음 목적 이외의
                    용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전
                    동의를 구할 것입니다.
                  </p>
                  <ul>
                    <li>
                      <strong>회원 관리:</strong> 본인 확인, 개인 식별,
                      불량회원의 부정 이용 방지, 가입 의사 확인, 연령 확인
                    </li>
                    <li>
                      <strong>GDGoC Yonsei 제공:</strong> 콘텐츠 제공, 맞춤
                      GDGoC Yonsei 제공 등
                    </li>
                    <li>
                      <strong>민원 처리:</strong> 개인정보 열람, 정정, 삭제,
                      처리정지 요구 등
                    </li>
                  </ul>
                </section>
                {}
                <section id="items">
                  <h2>2. 수집하는 개인정보 항목 및 수집 방법</h2>
                  <p>
                    ‘GDGoC Yonsei’는 회원가입 및 GDGoC Yonsei 이용 과정에서
                    다음과 같은 개인정보를 수집합니다.
                  </p>
                  <div>
                    <h3>수집 항목</h3>
                    <ul>
                      <li>
                        <strong>필수 항목:</strong> 이름, 학번, 학과, 이메일
                        주소
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3>수집 방법</h3>
                    <p>
                      이용자가 회원가입 시{' '}
                      <strong>Google 또는 GitHub 계정</strong>을 통해 제공하는
                      정보를 수집합니다. 이용자는 동의 후 개인정보를 제공하게
                      됩니다.
                    </p>
                  </div>
                </section>
                {}
                <section id="retention">
                  <h2>3. 개인정보의 처리 및 보유 기간</h2>
                  <p>
                    ‘GDGoC Yonsei’는 법령에 따른 보유·이용 기간 또는 동의받은
                    기간 내에서 개인정보를 처리하고 보유합니다.
                  </p>
                  <ul>
                    <li>
                      <strong>보유 기간:</strong> 회원 탈퇴 시까지
                    </li>
                    <li>
                      <strong>파기 절차:</strong> 기간 경과 또는 목적 달성 시
                      지체 없이 파기
                    </li>
                  </ul>
                </section>
                {}
                <section id="outsourcing">
                  <h2>4. 개인정보의 제3자 제공 및 처리 위탁</h2>
                  <p>
                    ‘GDGoC Yonsei’는 동의 없이 개인정보를 외부에 제공하지
                    않습니다. 다만, 법률에 특별한 규정이 있는 경우는 예외입니다.
                  </p>
                  <div className="policy-note">
                    <h3>가. 개인정보 국내 처리 위탁</h3>
                    <ul>
                      <li>수탁업체: 한국오라클 유한회사</li>
                      <li>업무 내용: 클라우드 서버 운영 및 관리</li>
                      <li>보유 기간: 회원 탈퇴 시 또는 계약 종료 시까지</li>
                    </ul>
                  </div>
                </section>
                {}
                <section id="rights">
                  <h2>5. 정보주체와 법정대리인의 권리·의무 및 행사 방법</h2>
                  <p>
                    이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 요구를
                    할 수 있습니다.
                  </p>
                </section>
                {}
                <section id="security">
                  <h2>6. 개인정보의 안전성 확보 조치</h2>
                  <ul>
                    <li>관리적 조치: 내부관리계획 수립·시행</li>
                    <li>
                      기술적 조치: 접근권한 관리, 암호화, 보안프로그램 설치
                    </li>
                    <li>물리적 조치: 전산실 접근통제</li>
                  </ul>
                </section>
                {}
                <section id="dpo">
                  <h2>7. 개인정보 보호책임자</h2>
                  <ul>
                    <li>성명: 전현우</li>
                    <li>직책: Organizer 및 전산 시스템 담당자</li>
                    <li>연락처: 010-9260-2402</li>
                    <li>이메일: jhyunwoo0228@gmail.com</li>
                  </ul>
                </section>
                {}
                <section id="analytics">
                  <h2>8. 자동 수집 장치의 설치·운영 및 거부</h2>
                  <p>
                    ‘GDGoC Yonsei’는 웹사이트를 개선하기 위해 방문 기록을
                    자동으로 수집합니다. 이 정보만으로는 이용자가 누구인지 알 수
                    없습니다.
                  </p>
                  <div>
                    <h3>수집 항목</h3>
                    <ul>
                      <li>
                        브라우저 저장소(localStorage)에 저장하는 무작위 방문자
                        식별값
                      </li>
                      <li>방문한 페이지와 시각, 머문 시간, 스크롤 깊이</li>
                      <li>유입 경로(이전 페이지 주소, 캠페인 정보)</li>
                      <li>
                        기기 종류, 브라우저, 운영체제, 화면 크기, 언어, 시간대
                      </li>
                      <li>페이지 로딩 성능 지표, 외부 링크와 주요 버튼 클릭</li>
                    </ul>
                    <p>
                      IP 주소는 비정상적인 대량 요청을 막는 데에만 잠시 사용하고
                      저장하지 않습니다.
                    </p>
                  </div>
                  <div>
                    <h3>이용 목적 및 보유 기간</h3>
                    <p>
                      서비스 개선, 검색 노출 개선, 콘텐츠 기획에 사용하며
                      수집일로부터 26개월이 지나면 지체 없이 파기합니다.
                    </p>
                  </div>
                  <div>
                    <h3>거부 방법</h3>
                    <p>
                      아래 버튼으로 수집을 거부할 수 있습니다. 브라우저의
                      GPC(Global Privacy Control) 설정을 켜거나 브라우저
                      저장소를 삭제해도 됩니다. 수집을 거부해도 웹사이트
                      이용에는 제한이 없습니다.
                    </p>
                    <AnalyticsOptOut
                      buttonClassName={buttonClasses('solid')}
                      copy={{
                        enabled: '현재 방문 분석 수집이 켜져 있습니다.',
                        disabled: '방문 분석 수집을 거부했습니다.',
                        gpc: '브라우저의 GPC 설정에 따라 방문 분석을 수집하지 않습니다.',
                        disable: '수집 거부',
                        enable: '수집 허용',
                      }}
                    />
                  </div>
                </section>
                {}
                <section id="change">
                  <h2>9. 개인정보처리방침의 변경</h2>
                  <p>법령 및 방침 변경 시 공지사항을 통해 고지합니다.</p>
                  <div className="policy-note">
                    <p>
                      <strong>공고일자:</strong> 2026년 10월 14일
                    </p>
                    <p>
                      <strong>시행일자:</strong> 2026년 10월 14일
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <>
                {}
                {}
                <section>
                  <h1>Website Privacy Policy</h1>
                  <p>
                    This Privacy Policy describes how{' '}
                    <strong>
                      Google Developer Group on Campus Yonsei University
                    </strong>{' '}
                    (hereinafter referred to as &#39;GDGoC Yonsei&#39;)
                    collects, uses, stores, and destroys user&#39;s personal
                    information. &#39;GDGoC Yonsei&#39; complies with the
                    Personal Information Protection Act of the Republic of Korea
                    and related laws, and is committed to protecting users&#39;
                    personal information.
                  </p>
                  <hr />
                </section>
                {}
                <nav aria-label="Table of Contents">
                  <h2>Table of Contents</h2>
                  <ol>
                    <li>
                      <a href="#purpose">
                        Purpose of Collection and Use of Personal Information
                      </a>
                    </li>
                    <li>
                      <a href="#items">
                        Items of Personal Information Collected and Collection
                        Methods
                      </a>
                    </li>
                    <li>
                      <a href="#retention">
                        Processing and Retention Period of Personal Information
                      </a>
                    </li>
                    <li>
                      <a href="#outsourcing">
                        Provision and Outsourcing of Personal Information to
                        Third Parties
                      </a>
                    </li>
                    <li>
                      <a href="#rights">
                        Rights and Obligations of Data Subjects and Their Legal
                        Representatives
                      </a>
                    </li>
                    <li>
                      <a href="#security">
                        Measures to Ensure the Security of Personal Information
                      </a>
                    </li>
                    <li>
                      <a href="#dpo">Data Protection Officer</a>
                    </li>
                    <li>
                      <a href="#analytics">
                        Automatic Data Collection and How to Opt Out
                      </a>
                    </li>
                    <li>
                      <a href="#change">Changes to the Privacy Policy</a>
                    </li>
                  </ol>
                </nav>
                {}
                <section id="purpose">
                  <h2>
                    1. Purpose of Collection and Use of Personal Information
                  </h2>
                  <p>
                    &#39;GDGoC Yonsei&#39; collects and uses the minimum amount
                    of personal information for the following purposes. The
                    collected personal information will not be used for any
                    purpose other than those stated below, and prior consent
                    will be obtained if the purpose of use is changed.
                  </p>
                  <ul>
                    <li>
                      <strong>Member Management:</strong> Identity verification,
                      personal identification, prevention of fraudulent use by
                      delinquent members, confirmation of intent to join, and
                      age verification.
                    </li>
                    <li>
                      <strong>Provision of GDGoC Yonsei Services:</strong>
                      Providing content, personalized services, etc.
                    </li>
                    <li>
                      <strong>Handling Complaints:</strong> Handling requests
                      for access, correction, deletion, and suspension of
                      processing of personal information.
                    </li>
                  </ul>
                </section>
                {}
                <section id="items">
                  <h2>
                    2. Items of Personal Information Collected and Collection
                    Methods
                  </h2>
                  <p>
                    &#39;GDGoC Yonsei&#39; collects the following personal
                    information during membership registration and service use.
                  </p>
                  <div>
                    <h3>Collected Items</h3>
                    <ul>
                      <li>
                        <strong>Required Items:</strong> Name, student ID,
                        major, email address.
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3>Collection Method</h3>
                    <p>
                      We collect information provided by the user through their{' '}
                      <strong>Google or GitHub account</strong> during
                      registration. The user provides personal information after
                      giving consent.
                    </p>
                  </div>
                </section>
                {}
                <section id="retention">
                  <h2>
                    3. Processing and Retention Period of Personal Information
                  </h2>
                  <p>
                    &#39;GDGoC Yonsei&#39; processes and retains personal
                    information within the period of retention and use
                    stipulated by law or agreed upon by the user.
                  </p>
                  <ul>
                    <li>
                      <strong>Retention Period:</strong> Until membership
                      withdrawal.
                    </li>
                    <li>
                      <strong>Destruction Procedure:</strong> Personal
                      information is destroyed without delay when the retention
                      period expires or the purpose of processing is achieved.
                    </li>
                  </ul>
                </section>
                {}
                <section id="outsourcing">
                  <h2>
                    4. Provision and Outsourcing of Personal Information to
                    Third Parties
                  </h2>
                  <p>
                    &#39;GDGoC Yonsei&#39; does not provide personal information
                    to external parties without the user&#39;s consent, except
                    in cases where there are special provisions in the law.
                  </p>
                  <div className="policy-note">
                    <h3>
                      a. Domestic Outsourcing of Personal Information Processing
                    </h3>
                    <ul>
                      <li>Trustee: Oracle Korea Ltd.</li>
                      <li>
                        Scope of Work: Cloud server operation and management.
                      </li>
                      <li>
                        Retention Period: Until membership withdrawal or
                        termination of the contract.
                      </li>
                    </ul>
                  </div>
                </section>
                {}
                <section id="rights">
                  <h2>
                    5. Rights and Obligations of Data Subjects and Their Legal
                    Representatives
                  </h2>
                  <p>
                    Users may at any time request to view, correct, delete, or
                    suspend the processing of their personal information.
                  </p>
                </section>
                {}
                <section id="security">
                  <h2>
                    6. Measures to Ensure the Security of Personal Information
                  </h2>
                  <ul>
                    <li>
                      Administrative Measures: Establishment and implementation
                      of internal management plans.
                    </li>
                    <li>
                      Technical Measures: Management of access rights,
                      encryption, installation of security programs.
                    </li>
                    <li>
                      Physical Measures: Access control to computer rooms.
                    </li>
                  </ul>
                </section>
                {}
                <section id="dpo">
                  <h2>7. Data Protection Officer</h2>
                  <ul>
                    <li>Name: Hyunwoo Jeon</li>
                    <li>Title: Organizer & System Administrator</li>
                    <li>Contact: 010-9260-2402</li>
                    <li>Email: jhyunwoo0228@gmail.com</li>
                  </ul>
                </section>
                {}
                <section id="analytics">
                  <h2>8. Automatic Data Collection and How to Opt Out</h2>
                  <p>
                    &#39;GDGoC Yonsei&#39; automatically records visits to
                    improve this website. This information alone cannot identify
                    who you are.
                  </p>
                  <div>
                    <h3>Collected Items</h3>
                    <ul>
                      <li>
                        A random visitor ID stored in your browser
                        (localStorage)
                      </li>
                      <li>
                        Pages visited, visit times, time on page, scroll depth
                      </li>
                      <li>
                        How you arrived (previous page address, campaign tags)
                      </li>
                      <li>
                        Device type, browser, operating system, screen size,
                        language, time zone
                      </li>
                      <li>
                        Page loading performance, clicks on outbound links and
                        key buttons
                      </li>
                    </ul>
                    <p>
                      Your IP address is used only briefly to block abusive
                      request floods and is never stored.
                    </p>
                  </div>
                  <div>
                    <h3>Purpose and Retention</h3>
                    <p>
                      We use this data to improve the service, search visibility
                      and content, and delete it 26 months after collection.
                    </p>
                  </div>
                  <div>
                    <h3>How to Opt Out</h3>
                    <p>
                      Use the button below to opt out. Turning on Global Privacy
                      Control (GPC) in your browser or clearing browser storage
                      also works. Opting out does not limit your use of the
                      website.
                    </p>
                    <AnalyticsOptOut
                      buttonClassName={buttonClasses('solid')}
                      copy={{
                        enabled: 'Visit analytics is currently on.',
                        disabled: 'You have opted out of visit analytics.',
                        gpc: 'Your browser sends GPC, so we do not collect visit analytics.',
                        disable: 'Opt out',
                        enable: 'Allow analytics',
                      }}
                    />
                  </div>
                </section>
                {}
                <section id="change">
                  <h2>9. Changes to the Privacy Policy</h2>
                  <p>
                    Any changes to this Privacy Policy will be announced through
                    notices on the website.
                  </p>
                  <div className="policy-note">
                    <p>
                      <strong>Announcement Date:</strong> October 14, 2026
                    </p>
                    <p>
                      <strong>Effective Date:</strong> October 14, 2026
                    </p>
                  </div>
                </section>
              </>
            )}
          </article>

          <div className="mt-8 flex justify-end">
            <a href="#top" className="policy-top no-print">
              {isKorean ? '맨 위로' : 'Back to Top'}
            </a>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
