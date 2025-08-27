export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  const isKorean = lang === 'ko'

  return (
    <div className="min-h-screen w-full bg-neutral-50 pt-20 text-neutral-900 antialiased">
      <div id="content" className="mx-auto max-w-4xl px-6 py-10">
        <article className="card rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          {/* Intro */}
          <section className="mb-8 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {isKorean ? '웹사이트 이용약관' : 'Website Terms of Service'}
            </h2>
            <p className="leading-7">
              {isKorean ? (
                <>
                  이 약관은{' '}
                  <strong>
                    Google Developer Group on Campus Yonsei University
                  </strong>{' '}
                  (이하 ‘GDGoC Yonsei’)가 운영하는 웹사이트(이하 ‘서비스’)의
                  이용과 관련하여 ‘GDGoC Yonsei’와 회원 간의 권리, 의무 및
                  책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </>
              ) : (
                <>
                  These Terms of Service (&#34;Terms&#34;) govern the use of the
                  website operated by{' '}
                  <strong>
                    Google Developer Group on Campus Yonsei University
                  </strong>{' '}
                  (&#34;GDGoC Yonsei&#34;) and set forth the rights,
                  obligations, and responsibilities between GDGoC Yonsei and its
                  members.
                </>
              )}
            </p>
            <hr className="my-6 border-gray-200" />
          </section>

          {/* Purpose */}
          <section id="purpose" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean ? '제1조 (목적)' : 'Article 1 (Purpose)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '본 약관은 ‘GDGoC Yonsei’가 제공하는 모든 서비스의 이용 조건 및 절차, 회원과 ‘GDGoC Yonsei’의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.'
                : 'These Terms define the conditions of use, procedures, rights, obligations, and responsibilities of members and GDGoC Yonsei regarding all services provided.'}
            </p>
          </section>

          {/* Membership */}
          <section id="membership" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean ? '제2조 (회원가입)' : 'Article 2 (Membership)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '회원으로 가입하고자 하는 자는 ‘GDGoC Yonsei’가 정한 가입 양식에 따라 회원 정보를 기입하고 약관에 동의해야 합니다.'
                : 'Those wishing to register as members must fill out the membership form provided by GDGoC Yonsei and agree to these Terms.'}
            </p>
          </section>

          {/* Obligations */}
          <section id="obligations" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean
                ? '제3조 (회원의 의무)'
                : 'Article 3 (Member Obligations)'}
            </h3>
            <ul className="list-disc space-y-2 pl-5 leading-7">
              {isKorean ? (
                <>
                  <li>
                    회원은 관계 법령, 본 약관의 규정, 이용 안내 및 주의 사항을
                    준수해야 합니다.
                  </li>
                  <li>
                    회원은 자신의 계정을 타인에게 양도하거나 대여할 수 없습니다.
                  </li>
                  <li>회원은 서비스 운영을 방해하는 행위를 할 수 없습니다.</li>
                </>
              ) : (
                <>
                  <li>
                    Members must comply with relevant laws, these Terms, usage
                    guidelines, and notices.
                  </li>
                  <li>
                    Members may not transfer or lend their account to others.
                  </li>
                  <li>
                    Members shall not engage in any activity that interferes
                    with the operation of the service.
                  </li>
                </>
              )}
            </ul>
          </section>

          {/* Privacy */}
          <section id="privacy" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean
                ? '제4조 (개인정보보호)'
                : 'Article 4 (Privacy Protection)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '‘GDGoC Yonsei’는 회원의 개인정보를 보호하며, 관련 법령에 따라 개인정보처리방침을 따릅니다.'
                : 'GDGoC Yonsei protects members’ personal information in accordance with applicable laws and its Privacy Policy.'}
            </p>
          </section>

          {/* Service Use */}
          <section id="service-use" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean ? '제5조 (서비스 이용)' : 'Article 5 (Use of Service)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '서비스의 이용은 연중무휴, 1일 24시간을 원칙으로 합니다. 다만, 시스템 점검이나 기술적 사유로 서비스 이용이 제한될 수 있습니다.'
                : 'The service is, in principle, available 24 hours a day, year-round. However, service availability may be restricted due to system maintenance or technical reasons.'}
            </p>
          </section>

          {/* Suspension */}
          <section id="suspension" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean
                ? '제6조 (서비스 제공의 중지)'
                : 'Article 6 (Suspension of Service)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '‘GDGoC Yonsei’는 다음 각 호에 해당하는 경우 서비스 제공을 중지할 수 있습니다: 시스템 점검, 장애, 불가항력 사유.'
                : 'GDGoC Yonsei may suspend service in the following cases: system maintenance, malfunction, or force majeure.'}
            </p>
          </section>

          {/* Termination */}
          <section id="termination" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean
                ? '제7조 (이용계약 해지 및 제한)'
                : 'Article 7 (Termination and Restrictions)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '회원이 본 약관을 위반하거나 서비스 운영을 방해한 경우 ‘GDGoC Yonsei’는 사전 통보 없이 이용계약을 해지하거나 서비스 이용을 제한할 수 있습니다.'
                : 'If a member violates these Terms or interferes with service operation, GDGoC Yonsei may terminate the agreement or restrict service use without prior notice.'}
            </p>
          </section>

          {/* Copyright */}
          <section id="copyright" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean ? '제8조 (저작권)' : 'Article 8 (Copyright)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '서비스에 게재된 모든 콘텐츠에 대한 저작권은 ‘GDGoC Yonsei’ 또는 해당 저작권자에게 있으며, 무단 복제 및 배포를 금합니다.'
                : 'All content posted on the service is copyrighted by GDGoC Yonsei or the respective copyright holders. Unauthorized reproduction or distribution is prohibited.'}
            </p>
          </section>

          {/* Changes */}
          <section id="changes" className="mb-10 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean ? '제9조 (약관의 변경)' : 'Article 9 (Amendments)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '‘GDGoC Yonsei’는 필요 시 약관을 변경할 수 있으며, 변경된 약관은 공지사항을 통해 회원에게 안내됩니다.'
                : 'GDGoC Yonsei may amend these Terms when necessary, and members will be notified of changes through public announcements.'}
            </p>
          </section>

          {/* Law & Jurisdiction */}
          <section id="law" className="mb-6 scroll-mt-24">
            <h3 className="mb-3 text-xl font-semibold">
              {isKorean
                ? '제10조 (준거법 및 재판관할)'
                : 'Article 10 (Governing Law and Jurisdiction)'}
            </h3>
            <p className="leading-7">
              {isKorean
                ? '‘GDGoC Yonsei’와 회원 간에 발생한 분쟁에 대하여는 대한민국 법을 준거법으로 합니다. 본 약관과 관련하여 발생하는 모든 분쟁은 서울중앙지방법원을 전속 관할 법원으로 합니다.'
                : 'Any disputes arising between GDGoC Yonsei and members shall be governed by the laws of the Republic of Korea. The Seoul Central District Court shall have exclusive jurisdiction over all disputes related to these Terms.'}
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm ring-1 ring-gray-200">
              <p>
                <strong>{isKorean ? '공고일자:' : 'Date of Notice:'}</strong>{' '}
                2025년 8월 27일
              </p>
              <p>
                <strong>{isKorean ? '시행일자:' : 'Effective Date:'}</strong>{' '}
                2025년 8월 27일
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  )
}
