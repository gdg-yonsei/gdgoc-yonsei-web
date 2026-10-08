import type { Metadata } from 'next'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import DataForm from '@/app/components/admin/data-form'
import DataInput from '@/app/components/admin/data-input'
import DataTextarea from '@/app/components/admin/data-textarea'
import SubmitButton from '@/app/components/admin/submit-button'
import { createAnnouncementAction } from '@/app/(admin)/admin/announcements/create/actions'
import {
  getAdminLocale,
  getAdminMessages,
  localizeAdminHref,
} from '@/lib/admin-i18n/server'

export const metadata: Metadata = {
  title: 'Write Announcement',
}

export default async function CreateAnnouncementPage() {
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale)

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.newAnnouncement}
        backHref={localizeAdminHref('/admin/announcements', locale)}
        backLabel={t.announcements}
      />
      <DataForm
        action={createAnnouncementAction}
        className={'admin-form-grid gap-2'}
      >
        <DataInput
          defaultValue={null}
          name={'title'}
          title={t.announcementTitle}
          placeholder={t.announcementTitle}
          required={true}
        />
        <DataTextarea
          defaultValue={null}
          name={'body'}
          placeholder={t.announcementBody}
        />
        <DataInput
          defaultValue={null}
          name={'ctaLabel'}
          title={t.announcementCtaLabel}
          placeholder={t.announcementCtaLabel}
        />
        <DataInput
          defaultValue={null}
          name={'ctaHref'}
          title={t.announcementCtaHref}
          placeholder={'/admin/mcp'}
        />
        <p
          className={'admin-form-grid-full type-caption text-ink-muted px-0.5'}
        >
          {t.announcementCtaHrefHint}
        </p>
        <SubmitButton>{t.publishAnnouncement}</SubmitButton>
      </DataForm>
    </AdminDefaultLayout>
  )
}
