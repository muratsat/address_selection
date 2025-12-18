import { Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { SearchResult } from '@/types/location'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Button } from './button'

interface SearchBarProps {
  onSelectLocation: (result: SearchResult) => void
  onSearch: (query: string) => void
  results: SearchResult[]
  isSearching: boolean
}

export function SearchBar({
  onSelectLocation,
  onSearch,
  results,
  isSearching,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    onSearch(value)
    setShowResults(true)
  }

  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.displayName)
    setShowResults(false)
    onSelectLocation(result)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    setShowResults(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search for a location..."
          className="h-14 w-full rounded-2xl border bg-background pl-12 pr-12 text-base shadow-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {showResults && (query || isSearching) && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-card shadow-xl">
          {isSearching ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto">
              {results.map((result) => (
                <li key={result.id}>
                  <Button
                    variant="ghost"
                    onClick={() => handleSelectResult(result)}
                    className={cn(
                      'w-full justify-start px-4 py-3 h-auto min-h-12 text-sm',
                      'first:rounded-t-xl last:rounded-b-xl rounded-none'
                    )}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <Search className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="line-clamp-2">{result.displayName}</span>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-muted-foreground">No results found</div>
          )}
        </div>
      )}
    </div>
  )
}
