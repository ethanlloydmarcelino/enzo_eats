import { Heart, Plus, Star } from 'lucide-react'
import { useOrderStore } from '../store/useOrderStore'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

export const MenuCard = ({ item }) => {
  const favorites = useOrderStore((state) => state.favorites)
  const toggleFavorite = useOrderStore((state) => state.toggleFavorite)
  const addToCart = useOrderStore((state) => state.addToCart)
  const isFavorite = favorites.includes(item.id)
  return (
    <Card className="menu-card group">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={item.image}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          style={{ objectPosition: item.position }}
        />
        {item.badge && (
          <Badge className="absolute left-3 top-3 bg-card text-foreground shadow-sm">
            {item.badge}
          </Badge>
        )}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => toggleFavorite(item.id)}
          className="absolute right-3 top-3 h-9 w-9 rounded-full bg-card/95"
          aria-label={`${isFavorite ? 'Remove' : 'Add'} ${item.name} ${isFavorite ? 'from' : 'to'} favorites`}
        >
          <Heart size={18} className={isFavorite ? 'fill-primary text-primary' : ''} />
        </Button>
      </div>
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{item.category}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{item.name}</h3>
          </div>
          <span className="font-semibold">${item.price}</span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm font-medium">
            <Star size={14} className="fill-coral text-coral" /> {item.rating}
          </span>
          <Button size="sm" onClick={() => addToCart(item)}>
            <Plus size={15} /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
