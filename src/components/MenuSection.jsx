import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { categories, fetchMenu } from '../data/menu'
import { MenuCard } from './MenuCard'
import { Button } from './ui/button'

export const MenuSection = ({ category, setCategory, search, setSearch }) => {
  const { data = [], isPending } = useQuery({ queryKey: ['menu'], queryFn: fetchMenu })
  const visible = useMemo(
    () =>
      data.filter((item) => {
        const matchesCategory = category === 'All' || item.category === category
        const needle = search.toLowerCase()
        return matchesCategory && `${item.name} ${item.description}`.toLowerCase().includes(needle)
      }),
    [data, category, search],
  )
  return (
    <section
      id="menu"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Made fresh daily</p>
          <h2 className="section-title">Popular dishes</h2>
          <p className="mt-3 text-muted-foreground">Four favorites. No decision fatigue.</p>
        </div>
        <label className="flex h-12 w-full items-center gap-3 rounded-xl border border-input bg-card px-4 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary md:w-72">
          <Search size={18} className="text-muted-foreground" />
          <input
            id="menu-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search menu"
          />
        </label>
      </div>
      <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {categories.map((name) => (
          <Button
            key={name}
            onClick={() => setCategory(name)}
            variant={category === name ? 'default' : 'secondary'}
          >
            {name}
          </Button>
        ))}
      </div>
      {isPending ? (
        <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[430px] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : visible.length ? (
        <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed py-16 text-center">
          <p className="text-xl font-semibold">No dishes found</p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('')
              setCategory('All')
            }}
            className="mt-2 text-primary"
          >
            Clear filters
          </Button>
        </div>
      )}
    </section>
  )
}
