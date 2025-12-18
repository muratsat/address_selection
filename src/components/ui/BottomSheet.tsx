import { MapPin, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { Address } from '@/types/location'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface BottomSheetProps {
  address: Address | null
  loading: boolean
  onConfirm: () => void
}

export function BottomSheet({ address, loading, onConfirm }: BottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'rounded-t-3xl bg-card border-t shadow-2xl',
        'transition-all duration-300',
        isExpanded ? 'max-h-[60vh]' : 'max-h-[200px]'
      )}
    >
      {/* Handle */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full flex-col items-center py-3 h-auto hover:bg-transparent"
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        <div className="h-1 w-12 rounded-full bg-muted" />
        {isExpanded && (
          <ChevronUp className="mt-2 h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      {/* Content */}
      <div className="px-6 pb-8">
        <div className="mb-6">
          <div className="mb-3 flex items-start gap-3">
            <MapPin className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="flex-1">
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                Selected Location
              </h3>
              {loading ? (
                <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              ) : address ? (
                <p className="text-lg font-semibold leading-tight text-foreground">
                  {address.displayName}
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">Move map to select location</p>
              )}
            </div>
          </div>

          {/* Expanded details */}
          {isExpanded && address && !loading && (
            <div className="mt-4 space-y-2 rounded-xl bg-muted p-4 text-sm">
              {address.street && (
                <div>
                  <span className="font-medium text-muted-foreground">Street: </span>
                  <span className="text-foreground">{address.street}</span>
                </div>
              )}
              {address.district && (
                <div>
                  <span className="font-medium text-muted-foreground">District: </span>
                  <span className="text-foreground">{address.district}</span>
                </div>
              )}
              {address.city && (
                <div>
                  <span className="font-medium text-muted-foreground">City: </span>
                  <span className="text-foreground">{address.city}</span>
                </div>
              )}
              {address.postalCode && (
                <div>
                  <span className="font-medium text-muted-foreground">Postal Code: </span>
                  <span className="text-foreground">{address.postalCode}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm button */}
        <Button
          onClick={onConfirm}
          disabled={!address || loading}
          className="h-14 w-full rounded-2xl text-base font-semibold active:scale-[0.98] transition-all"
        >
          {loading ? 'Loading...' : 'Confirm Location'}
        </Button>
      </div>
    </div>
  )
}
