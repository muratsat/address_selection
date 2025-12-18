import { createFileRoute } from '@tanstack/react-router'
import { AddressSelection } from '@/components/AddressSelection'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return <AddressSelection />
}
