import { Button, EmptyState } from '../components/ui'
import { useI18n } from '../i18n/I18nContext'

export default function NotFound() {
  const { t } = useI18n()
  return <EmptyState title={t('notFound.title')} action={<Button to="/">{t('common.backHome')}</Button>} />
}
