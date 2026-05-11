import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/admin/')({
  component: AdminList,
})

function AdminList() {
  return <div>Hello "/admin"!</div>
}
