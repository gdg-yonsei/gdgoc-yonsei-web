import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminNavigationButton from '@/app/components/admin/admin-navigation-button'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export default function PermissionsPage() {
  return (
    <AdminDefaultLayout>
      <AdminNavigationButton href={'/admin'}>
        <ChevronLeftIcon className={'size-8'} />
        <p className={'text-lg'}>Home</p>
      </AdminNavigationButton>
      <div className={'admin-title'}>
        Information Accessible by Permission Level
      </div>
      <div className={'flex w-full flex-col gap-4 pt-4'}>
        {/*GET*/}
        <div className={'w-full overflow-x-scroll rounded-lg bg-white p-2'}>
          <h2 className={'text-xl font-semibold'}>GET</h2>
          <table className={'w-full text-center'}>
            <thead className={'bg-neutral-100'}>
              <tr className={'*:border-2 *:border-neutral-200 *:p-1'}>
                <th>Permission</th>
                <th>Admin Page</th>
                <th>Profile Page</th>
                <th>Projects Page</th>
                <th>Sessions Page</th>
                <th>Members Page</th>
                <th>Parts Page</th>
                <th>Generations Page</th>
              </tr>
            </thead>
            <tbody>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>UNVERIFIED</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>ALUMNUS</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>MEMBER</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>CORE</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>LEAD</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/*POST*/}
        <div className={'w-full overflow-x-scroll rounded-lg bg-white p-2'}>
          <h2 className={'text-xl font-semibold'}>POST</h2>
          <table className={'w-full text-center'}>
            <thead className={'bg-neutral-100'}>
              <tr className={'*:border-2 *:border-neutral-200 *:p-1'}>
                <th>Permission</th>
                <th>Members</th>
                <th>Members Role</th>
                <th>Generations</th>
                <th>Projects</th>
                <th>Sessions</th>
                <th>Parts</th>
              </tr>
            </thead>
            <tbody>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>UNVERIFIED</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>ALUMNUS</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>MEMBER</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>CORE</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>LEAD</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/*PUT*/}
        <div className={'w-full overflow-x-scroll rounded-lg bg-white p-2'}>
          <h2 className={'text-xl font-semibold'}>PUT</h2>
          <table className={'w-full text-center'}>
            <thead className={'bg-neutral-100'}>
              <tr className={'*:border-2 *:border-neutral-200 *:p-1'}>
                <th>Permission</th>
                <th>Members</th>
                <th>Members Role</th>
                <th>Generations</th>
                <th>Projects</th>
                <th>Sessions</th>
                <th>Parts</th>
              </tr>
            </thead>
            <tbody>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>UNVERIFIED</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>ALUMNUS</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>MEMBER</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>CORE</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>LEAD</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/*DELETE*/}
        <div className={'w-full overflow-x-scroll rounded-lg bg-white p-2'}>
          <h2 className={'text-xl font-semibold'}>DELETE</h2>
          <table className={'w-full text-center'}>
            <thead className={'bg-neutral-100'}>
              <tr className={'*:border-2 *:border-neutral-200 *:p-1'}>
                <th>Permission</th>
                <th>Members</th>
                <th>Members Role</th>
                <th>Generations</th>
                <th>Projects</th>
                <th>Sessions</th>
                <th>Parts</th>
              </tr>
            </thead>
            <tbody>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>UNVERIFIED</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>ALUMNUS</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>MEMBER</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>CORE</td>
                <td>✅</td>
                <td>✅</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
                <td>❌</td>
              </tr>
              <tr className={'*:border-2 *:border-neutral-200'}>
                <td>LEAD</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
                <td>✅</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminDefaultLayout>
  )
}
