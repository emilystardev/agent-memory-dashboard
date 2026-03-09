export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border p-4">
        <div className="mb-8">
          <h1 className="text-lg font-semibold">Agent Memory</h1>
          <p className="text-sm text-muted-foreground">OpenClaw Dashboard</p>
        </div>
        <nav className="space-y-2">
          <a
            href="#sprint-board"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Sprint Board
          </a>
          <a
            href="#session-timeline"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Session Timeline
          </a>
          <a
            href="#inference-analytics"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Inference Analytics
          </a>
          <a
            href="#memory-explorer"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Memory Explorer
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* Sprint Board Section */}
          <section id="sprint-board" className="space-y-4">
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl font-bold">Sprint Board</h2>
              <p className="mt-2 text-muted-foreground">
                Kanban board reading SPRINT.md + GitHub issues/PRs. Columns: Backlog, In Progress, In Review, Done.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {["Backlog", "In Progress", "In Review", "Done"].map((column) => (
                <div key={column} className="rounded-lg border border-border p-4">
                  <h3 className="mb-4 font-semibold">{column}</h3>
                  <div className="space-y-2">
                    <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
                      <p className="text-muted-foreground">No cards yet</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Session Timeline Section */}
          <section id="session-timeline" className="space-y-4">
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl font-bold">Session Timeline</h2>
              <p className="mt-2 text-muted-foreground">
                Chronological view of agent sessions and cron runs from jobs.json and gateway logs.
              </p>
            </div>
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground">Timeline will be displayed here</p>
            </div>
          </section>

          {/* Inference Analytics Section */}
          <section id="inference-analytics" className="space-y-4">
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl font-bold">Inference Analytics</h2>
              <p className="mt-2 text-muted-foreground">
                Token usage and cost per agent with charts and model distribution.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 font-semibold">Token Usage by Agent</h3>
                <div className="flex items-center justify-center rounded-md bg-muted/50 p-8">
                  <p className="text-muted-foreground">Bar chart placeholder</p>
                </div>
              </div>
              <div className="rounded-lg border border-border p-6">
                <h3 className="mb-4 font-semibold">7-Day Usage Trend</h3>
                <div className="flex items-center justify-center rounded-md bg-muted/50 p-8">
                  <p className="text-muted-foreground">Time series placeholder</p>
                </div>
              </div>
            </div>
          </section>

          {/* Memory Explorer Section */}
          <section id="memory-explorer" className="space-y-4">
            <div className="border-b border-border pb-4">
              <h2 className="text-2xl font-bold">Memory Explorer</h2>
              <p className="mt-2 text-muted-foreground">
                Browse and search agent semantic memory from exported SQLite stores.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="search"
                  placeholder="Search memories..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <select className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option>All Agents</option>
                </select>
              </div>
              <div className="rounded-lg border border-border p-8 text-center">
                <p className="text-muted-foreground">Memory cards will be displayed here</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
