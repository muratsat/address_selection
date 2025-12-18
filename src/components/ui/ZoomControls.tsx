import { Plus, Minus } from 'lucide-react'
import { Button } from './button'

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
}

export function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="flex flex-col gap-0 rounded-full bg-background shadow-lg border overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        className="h-12 w-12 rounded-none hover:bg-accent active:scale-95 transition-all"
        aria-label="Zoom in"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <div className="h-px bg-border" />
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        className="h-12 w-12 rounded-none hover:bg-accent active:scale-95 transition-all"
        aria-label="Zoom out"
      >
        <Minus className="h-6 w-6" />
      </Button>
    </div>
  )
}
