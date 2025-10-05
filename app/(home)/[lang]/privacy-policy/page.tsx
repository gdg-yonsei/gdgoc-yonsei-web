import languageParamChecker from '@/lib/language-param-checker'
import { Metadata } from 'next'

type Props = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params

  if (lang === 'ko') {
    return {
      title: `개인정보처리방침`,
      description: `GDGoC Yonsei 개인정보처리방침`,
    }
  }

  return {
    title: `Privacy Policy`,
    description: `GDGoC Yonsei Privacy Policy`,
  }
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const isKorean = lang === 'ko'

  return (
    <div className="min-h-screen w-full bg-neutral-50 pt-20 text-neutral-900 antialiased">
      <div id="content" className="mx-auto max-w-4xl px-6 py-10">
        <article className="card rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          {isKorean ? (
            <>
              {/* Intro */}
              <section className="mb-8 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  웹사이트 개인정보처리방침
                </h2>
                <p className="leading-7">
                  본 개인정보처리방침은{' '}
                  <strong>
                    Google Developer Group on Campus Yonsei University
                  </strong>{' '}
                  (이하 ‘GDGoC Yonsei’)가 이용자의 개인정보를 수집, 이용, 보관,
                  파기하는 방식에 대해 설명합니다. ‘GDGoC Yonsei’는 대한민국
                  개인정보보호법 및 관련 법령을 준수하며, 이용자의 개인정보
                  보호를 위해 최선을 다하고 있습니다.
                </p>
                <hr className="my-6 border-gray-200" />
              </section>

              {/* Table of Contents */}
              <nav aria-label="섹션 목록" className="mb-10">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  목차
                </h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#purpose"
                    >
                      개인정보의 수집 및 이용 목적
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#items"
                    >
                      수집하는 개인정보 항목 및 수집 방법
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#retention"
                    >
                      개인정보의 처리 및 보유 기간
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#outsourcing"
                    >
                      개인정보의 제3자 제공 및 처리 위탁
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#rights"
                    >
                      정보주체와 법정대리인의 권리·의무 및 행사 방법
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#security"
                    >
                      개인정보의 안전성 확보 조치
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#dpo"
                    >
                      개인정보 보호책임자
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#change"
                    >
                      개인정보처리방침의 변경
                    </a>
                  </li>
                </ol>
              </nav>

              {/* 1. Purpose */}
              <section id="purpose" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  1. 개인정보의 수집 및 이용 목적
                </h3>
                <p className="leading-7">
                  ‘GDGoC Yonsei’는 다음의 목적을 위해 최소한의 개인정보를
                  수집하고 이용합니다. 수집된 개인정보는 다음 목적 이외의
                  용도로는 사용되지 않으며, 이용 목적이 변경될 시에는 사전
                  동의를 구할 것입니다.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    <strong>회원 관리:</strong> 본인 확인, 개인 식별, 불량회원의
                    부정 이용 방지, 가입 의사 확인, 연령 확인
                  </li>
                  <li>
                    <strong>GDGoC Yonsei 제공:</strong> 콘텐츠 제공, 맞춤 GDGoC
                    Yonsei 제공 등
                  </li>
                  <li>
                    <strong>민원 처리:</strong> 개인정보 열람, 정정, 삭제,
                    처리정지 요구 등
                  </li>
                </ul>
              </section>

              {/* 2. Items */}
              <section id="items" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  2. 수집하는 개인정보 항목 및 수집 방법
                </h3>
                <p className="leading-7">
                  ‘GDGoC Yonsei’는 회원가입 및 GDGoC Yonsei 이용 과정에서 다음과
                  같은 개인정보를 수집합니다.
                </p>
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">수집 항목</h4>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      <strong>필수 항목:</strong> 이름, 학번, 학과, 이메일 주소
                    </li>
                  </ul>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">수집 방법</h4>
                  <p className="leading-7">
                    이용자가 회원가입 시{' '}
                    <strong>Google 또는 GitHub 계정</strong>을 통해 제공하는
                    정보를 수집합니다. 이용자는 동의 후 개인정보를 제공하게
                    됩니다.
                  </p>
                </div>
              </section>

              {/* 3. Retention */}
              <section id="retention" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  3. 개인정보의 처리 및 보유 기간
                </h3>
                <p className="leading-7">
                  ‘GDGoC Yonsei’는 법령에 따른 보유·이용 기간 또는 동의받은 기간
                  내에서 개인정보를 처리하고 보유합니다.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    <strong>보유 기간:</strong> 회원 탈퇴 시까지
                  </li>
                  <li>
                    <strong>파기 절차:</strong> 기간 경과 또는 목적 달성 시 지체
                    없이 파기
                  </li>
                </ul>
              </section>

              {/* 4. Outsourcing */}
              <section id="outsourcing" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  4. 개인정보의 제3자 제공 및 처리 위탁
                </h3>
                <p className="leading-7">
                  ‘GDGoC Yonsei’는 동의 없이 개인정보를 외부에 제공하지
                  않습니다. 다만, 법률에 특별한 규정이 있는 경우는 예외입니다.
                </p>
                <div className="mt-6 rounded-xl border border-gray-200 p-4">
                  <h4 className="font-medium">가. 개인정보 국내 처리 위탁</h4>
                  <ul className="mt-2 list-disc pl-6">
                    <li>수탁업체: 한국오라클 유한회사</li>
                    <li>업무 내용: 클라우드 서버 운영 및 관리</li>
                    <li>보유 기간: 회원 탈퇴 시 또는 계약 종료 시까지</li>
                  </ul>
                </div>
              </section>

              {/* 5. Rights */}
              <section id="rights" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  5. 정보주체와 법정대리인의 권리·의무 및 행사 방법
                </h3>
                <p className="leading-7">
                  이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 요구를
                  할 수 있습니다.
                </p>
              </section>

              {/* 6. Security */}
              <section id="security" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  6. 개인정보의 안전성 확보 조치
                </h3>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>관리적 조치: 내부관리계획 수립·시행</li>
                  <li>기술적 조치: 접근권한 관리, 암호화, 보안프로그램 설치</li>
                  <li>물리적 조치: 전산실 접근통제</li>
                </ul>
              </section>

              {/* 7. DPO */}
              <section id="dpo" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  7. 개인정보 보호책임자
                </h3>
                <ul className="list-disc space-y-1 pl-6">
                  <li>성명: 전현우</li>
                  <li>직책: Organizer 및 전산 시스템 담당자</li>
                  <li>연락처: 010-9260-2402</li>
                  <li>이메일: jhyunwoo0228@gmail.com</li>
                </ul>
              </section>

              {/* 8. Change */}
              <section id="change" className="mb-6 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  8. 개인정보처리방침의 변경
                </h3>
                <p className="leading-7">
                  법령 및 방침 변경 시 공지사항을 통해 고지합니다.
                </p>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm ring-1 ring-gray-200">
                  <p>
                    <strong>공고일자:</strong> 2025년 8월 27일
                  </p>
                  <p>
                    <strong>시행일자:</strong> 2025년 8월 27일
                  </p>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* English Version */}
              {/* Intro */}
              <section className="mb-8 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">
                  Website Privacy Policy
                </h2>
                <p className="leading-7">
                  This Privacy Policy describes how{' '}
                  <strong>
                    Google Developer Group on Campus Yonsei University
                  </strong>{' '}
                  (hereinafter referred to as &#39;GDGoC Yonsei&#39;) collects,
                  uses, stores, and destroys user&#39;s personal information.
                  &#39;GDGoC Yonsei&#39; complies with the Personal Information
                  Protection Act of the Republic of Korea and related laws, and
                  is committed to protecting users&#39; personal information.
                </p>
                <hr className="my-6 border-gray-200" />
              </section>

              {/* Table of Contents */}
              <nav aria-label="Table of Contents" className="mb-10">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Table of Contents
                </h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#purpose"
                    >
                      Purpose of Collection and Use of Personal Information
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#items"
                    >
                      Items of Personal Information Collected and Collection
                      Methods
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#retention"
                    >
                      Processing and Retention Period of Personal Information
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#outsourcing"
                    >
                      Provision and Outsourcing of Personal Information to Third
                      Parties
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#rights"
                    >
                      Rights and Obligations of Data Subjects and Their Legal
                      Representatives
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#security"
                    >
                      Measures to Ensure the Security of Personal Information
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#dpo"
                    >
                      Data Protection Officer
                    </a>
                  </li>
                  <li>
                    <a
                      className="underline underline-offset-4 hover:text-gray-900"
                      href="#change"
                    >
                      Changes to the Privacy Policy
                    </a>
                  </li>
                </ol>
              </nav>

              {/* 1. Purpose */}
              <section id="purpose" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  1. Purpose of Collection and Use of Personal Information
                </h3>
                <p className="leading-7">
                  &#39;GDGoC Yonsei&#39; collects and uses the minimum amount of
                  personal information for the following purposes. The collected
                  personal information will not be used for any purpose other
                  than those stated below, and prior consent will be obtained if
                  the purpose of use is changed.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Member Management:</strong> Identity verification,
                    personal identification, prevention of fraudulent use by
                    delinquent members, confirmation of intent to join, and age
                    verification.
                  </li>
                  <li>
                    <strong>Provision of GDGoC Yonsei Services:</strong>
                    Providing content, personalized services, etc.
                  </li>
                  <li>
                    <strong>Handling Complaints:</strong> Handling requests for
                    access, correction, deletion, and suspension of processing
                    of personal information.
                  </li>
                </ul>
              </section>

              {/* 2. Items */}
              <section id="items" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  2. Items of Personal Information Collected and Collection
                  Methods
                </h3>
                <p className="leading-7">
                  &#39;GDGoC Yonsei&#39; collects the following personal
                  information during membership registration and service use.
                </p>
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Collected Items</h4>
                  <ul className="list-disc space-y-1 pl-6">
                    <li>
                      <strong>Required Items:</strong> Name, student ID, major,
                      email address.
                    </li>
                  </ul>
                </div>
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Collection Method</h4>
                  <p className="leading-7">
                    We collect information provided by the user through their{' '}
                    <strong>Google or GitHub account</strong> during
                    registration. The user provides personal information after
                    giving consent.
                  </p>
                </div>
              </section>

              {/* 3. Retention */}
              <section id="retention" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  3. Processing and Retention Period of Personal Information
                </h3>
                <p className="leading-7">
                  &#39;GDGoC Yonsei&#39; processes and retains personal
                  information within the period of retention and use stipulated
                  by law or agreed upon by the user.
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Retention Period:</strong> Until membership
                    withdrawal.
                  </li>
                  <li>
                    <strong>Destruction Procedure:</strong> Personal information
                    is destroyed without delay when the retention period expires
                    or the purpose of processing is achieved.
                  </li>
                </ul>
              </section>

              {/* 4. Outsourcing */}
              <section id="outsourcing" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  4. Provision and Outsourcing of Personal Information to Third
                  Parties
                </h3>
                <p className="leading-7">
                  &#39;GDGoC Yonsei&#39; does not provide personal information
                  to external parties without the user&#39;s consent, except in
                  cases where there are special provisions in the law.
                </p>
                <div className="mt-6 rounded-xl border border-gray-200 p-4">
                  <h4 className="font-medium">
                    a. Domestic Outsourcing of Personal Information Processing
                  </h4>
                  <ul className="mt-2 list-disc pl-6">
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

              {/* 5. Rights */}
              <section id="rights" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  5. Rights and Obligations of Data Subjects and Their Legal
                  Representatives
                </h3>
                <p className="leading-7">
                  Users may at any time request to view, correct, delete, or
                  suspend the processing of their personal information.
                </p>
              </section>

              {/* 6. Security */}
              <section id="security" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  6. Measures to Ensure the Security of Personal Information
                </h3>
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  <li>
                    Administrative Measures: Establishment and implementation of
                    internal management plans.
                  </li>
                  <li>
                    Technical Measures: Management of access rights, encryption,
                    installation of security programs.
                  </li>
                  <li>Physical Measures: Access control to computer rooms.</li>
                </ul>
              </section>

              {/* 7. DPO */}
              <section id="dpo" className="mb-10 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  7. Data Protection Officer
                </h3>
                <ul className="list-disc space-y-1 pl-6">
                  <li>Name: Hyunwoo Jeon</li>
                  <li>Title: Organizer & System Administrator</li>
                  <li>Contact: 010-9260-2402</li>
                  <li>Email: jhyunwoo0228@gmail.com</li>
                </ul>
              </section>

              {/* 8. Change */}
              <section id="change" className="mb-6 scroll-mt-24">
                <h3 className="mb-3 text-xl font-semibold">
                  8. Changes to the Privacy Policy
                </h3>
                <p className="leading-7">
                  Any changes to this Privacy Policy will be announced through
                  notices on the website.
                </p>
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm ring-1 ring-gray-200">
                  <p>
                    <strong>Announcement Date:</strong> August 27, 2025
                  </p>
                  <p>
                    <strong>Effective Date:</strong> August 27, 2025
                  </p>
                </div>
              </section>
            </>
          )}
        </article>

        <div className="mt-8 flex justify-end">
          <a
            href="#top"
            className="no-print inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {isKorean ? '맨 위로' : 'Back to Top'}
          </a>
        </div>
      </div>
    </div>
  )
}
