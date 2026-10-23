import { ArrowDown, ArrowUp, MoreHorizontal, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePlayer } from "@/components/player/PlayerProvider"

export function QueueTrackActions({ index, isLast }: { index: number; isLast: boolean }) {
  const { jumpTo, moveInQueue, removeFromQueue } = usePlayer()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for queue item ${index + 1}`} />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-45" sideOffset={4}>
        <DropdownMenuItem onClick={() => jumpTo(index)}>
          <Play />
          Play now
        </DropdownMenuItem>
        <DropdownMenuItem disabled={index === 0} onClick={() => moveInQueue(index, -1)}>
          <ArrowUp />
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLast} onClick={() => moveInQueue(index, 1)}>
          <ArrowDown />
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => removeFromQueue(index)}>
          <Trash2 />
          Remove from queue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}