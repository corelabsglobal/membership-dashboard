import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 bg-card shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center flex-1 max-w-md">
          <Search className="w-5 h-5 ml-3 text-muted-foreground absolute" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}