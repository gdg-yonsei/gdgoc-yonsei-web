import { getMember } from '@/lib/fetcher/get-member'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import formatUserName from '@/lib/format-user-name'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { auth } from '@/auth'
import UserProfileImage from '@/app/components/user-profile-image'
import DataEditLink from '@/app/components/admin/data-edit-link'

export default async function MemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const { memberId } = await params

  const memberData = await getMember(memberId)
  const session = await auth()

  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin/members'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Members</p>
      </AdminNavigationButton>
      <div className={'w-full flex items-center justify-start gap-2 py-1'}>
        <div className={'admin-title'}>
          {formatUserName(
            memberData.name,
            memberData.firstName,
            memberData.lastName,
            memberData.isForeigner
          )}
        </div>

        <DataEditLink
          session={session}
          dataId={memberId}
          dataType={'members'}
          href={`/admin/members/${memberId}/edit`}
        />
      </div>
      <div className={'w-full py-2 member-data-grid gap-2'}>
        <div className={'row-span-2 flex items-center justify-center'}>
          <UserProfileImage
            src={memberData.image}
            alt={'User Profile Image'}
            width={160}
            height={160}
            className={'size-40 rounded-xl'}
          />
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>First Name</div>
          <div className={'member-data-context'}>{memberData.firstName}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Last Name</div>
          <div className={'member-data-context'}>{memberData.lastName}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>E-Mail</div>
          <div className={'member-data-context'}>{memberData.email}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Role</div>
          <div className={'member-data-context'}>{memberData.role}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Part</div>
          <div className={'member-data-context'}>{memberData.part}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Github ID</div>
          <div className={'member-data-context'}>{memberData.githubId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Instagram ID</div>
          <div className={'member-data-context'}>{memberData.instagramId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Linked In ID</div>
          <div className={'member-data-context'}>{memberData.linkedInId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Major</div>
          <div className={'member-data-context'}>{memberData.major}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Student ID</div>
          <div className={'member-data-context'}>{memberData.studentId}</div>
        </div>
        <div className={'member-data-box'}>
          <div className={'member-data-title'}>Telephone</div>
          <div className={'member-data-context'}>{memberData.telephone}</div>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
