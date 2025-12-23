"use client";
import type { Location } from "@/types/location";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";

export type DrawerState = "panning" | "preview" | "search";

interface BottomSheetProps {
  state: DrawerState;
  pinLocation: Location;
}

enum BreakPoints {
  SMALL = "150px",
  MEDIUM = "400px",
  LARGE = 1
}

export function BottomSheet({ state, pinLocation }: BottomSheetProps) {
  // Define snap points based on state
  const snapPoints: (number | string)[] =
    state === "search"
      ? [BreakPoints.MEDIUM, 1]
      : [BreakPoints.SMALL, BreakPoints.MEDIUM, BreakPoints.LARGE];

  const getActiveSnapPoint = (): number | string | null => {
    switch (state) {
      case "panning":
        return BreakPoints.SMALL; // Low snap point when panning
      case "preview":
        return BreakPoints.MEDIUM; // Medium snap point for preview
      case "search":
        return BreakPoints.LARGE; // Full height for search
      default:
        return BreakPoints.MEDIUM;
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
                {pinLocation.lat.toFixed(8)} {pinLocation.lng.toFixed(8)}
              </span>
            </div>
          </div>
        )}

        {state === "preview" && (
          <div className="p-4 space-y-4">
            <>
              <div className="flex items-start gap-3 cursor-pointer">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">
                    {pinLocation.lat.toFixed(8)} {pinLocation.lng.toFixed(8)}
                  </h3>
                </div>
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
            </>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
