"use client";
import type { Address, SearchResult } from "@/types/location";
import {
  Drawer,
  DrawerContent
} from "@/components/ui/drawer";
import { useEffect, useState } from "react";
import { Search, MapPin, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

export type DrawerState = "panning" | "preview" | "search";

interface BottomSheetProps {
  state: DrawerState;
  address: Address | null;
  loading: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onSearchResultClick: (result: SearchResult) => void;
  onSearchOpen: () => void;
  onSearchClose?: () => void;
}

export function BottomSheet({
  state,
  address,
  loading,
  searchQuery,
  searchResults,
  isSearching,
  onSearchChange,
  onSearchResultClick,
  onSearchOpen,
  onSearchClose
}: BottomSheetProps) {
  // Define snap points based on state
  const snapPoints: (number | string)[] =
    state === "search" ? ["500px", 1] : ["300px", "500px", 1];

  const getActiveSnapPoint = (): number | string | null => {
    switch (state) {
      case "panning":
        return "300px"; // Low snap point when panning
      case "preview":
        return "500px"; // Medium snap point for preview
      case "search":
        return 1; // Full height for search
      default:
        return "500px";
    }
  };

  const [snap, setSnap] = useState<number | string | null>(
    getActiveSnapPoint()
  );

  // Update snap point when state changes
  useEffect(() => {
    const newSnap = getActiveSnapPoint();
    setSnap(newSnap);
  }, [state]);

  // Handle snap point changes - if user drags down in search mode, exit search
  useEffect(() => {
    if (state === "search" && snap === "500px") {
      // User dragged down from full height, exit search mode
      onSearchClose?.();
    }
  }, [snap, state, onSearchClose]);

  // Handle browser back button
  useEffect(() => {
    if (state !== "search") return;

    const handlePopState = () => {
      onSearchClose?.();
    };

    window.history.pushState({ searchOpen: true }, "");
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [state, onSearchClose]);

  return (
    <Drawer
      open={true}
      modal={false}
      dismissible={false}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <DrawerContent>
        {state === "panning" && (
          <div className="p-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="flex-1 truncate">
                {address?.displayName || "Previous location"}
              </span>
            </div>
          </div>
        )}

        {state === "preview" && (
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Loading address...
                </span>
              </div>
            ) : (
              <>
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={onSearchOpen}
                >
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {address?.displayName || "Unknown location"}
                    </h3>
                    {address?.street && (
                      <p className="text-sm text-muted-foreground truncate">
                        {address.street}
                        {address.district && `, ${address.district}`}
                      </p>
                    )}
                  </div>
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* <Button onClick={onConfirm} className="w-full" size="lg">
                  Confirm Location
                </Button> */}
              </>
            )}
          </div>
        )}

        {state === "search" && (
          <div className="flex flex-col h-full max-h-dvh">
            <div className="flex items-center gap-3 p-4 pb-2 shrink-0">
              <button
                onClick={onSearchClose}
                className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Close search"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold">Search Address</h2>
            </div>

            <div className="px-4 pb-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter delivery address"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto px-4 pb-4 min-h-0">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => onSearchResultClick(result)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {result.displayName}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-8 text-muted-foreground">
                  No results found
                </div>
              ) : null}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
