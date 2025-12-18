import { Crosshair, Loader2 } from 'lucide-react'
import { Button } from './button'

interface LocationButtonProps {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
}

export function LocationButton({
  onClick,
  loading = false,
  disabled = false,
}: LocationButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled || loading}
      className="h-12 w-12 rounded-full bg-background shadow-lg hover:shadow-xl active:scale-95 transition-all"
      aria-label="Get current location"
    >
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <Crosshair className="h-6 w-6" />
      )}
    </Button>
  )
}
