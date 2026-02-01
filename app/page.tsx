import { Sun, Plus, MoreHorizontal, Calendar as CalendarIcon, Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const tasks = [
  { id: 1, title: "Review implementation plan", completed: true, important: true },
  { id: 2, title: "Configure tailwind v4 colors", completed: true, important: false },
  { id: 3, title: "Install shadcn sidebar", completed: true, important: false },
  { id: 4, title: "Implement My Day view", completed: false, important: true },
  { id: 5, title: "Personal Assistant App UI skeleton", completed: false, important: false },
]

export default function Home() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <Sun className="h-8 w-8 text-accent" />
            My Day
          </h1>
          <p className="text-muted-foreground">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex items-center gap-4 p-4">
            <Plus className="h-5 w-5 text-primary" />
            <input
              type="text"
              placeholder="Add a task"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </CardContent>
        </Card>

        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} className="group transition-all hover:bg-muted/50">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Checkbox id={`task-${task.id}`} checked={task.completed} />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm font-medium leading-none cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {task.title}
                  </label>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Star className={`h-4 w-4 ${task.important ? 'fill-accent text-accent' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
