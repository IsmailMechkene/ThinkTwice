import { Button, EmptyState } from '../components/ui'

export default function NotFound() {
  return <EmptyState title="Page not found" action={<Button to="/">Back home</Button>} />
}
