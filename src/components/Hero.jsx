import { ArrowRight, Clock3, MapPin, Sparkles, Star } from 'lucide-react'
import { useOrderStore } from '../store/useOrderStore'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

export const Hero = () => {
  const orderType = useOrderStore((state) => state.orderType)
  const setOrderType = useOrderStore((state) => state.setOrderType)
  return (
    <section id="top" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid min-h-[570px] overflow-hidden rounded-3xl bg-lilac lg:grid-cols-[1fr_.92fr]">
        <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16">
          <Badge variant="lime" className="mb-6 w-fit gap-2">
            <Sparkles size={13} /> Personalized for you
          </Badge>
          <h1 className="max-w-2xl text-5xl font-bold leading-[.98] tracking-[-.055em] sm:text-7xl">
            Your meal.
            <br />
            <span className="text-primary">Ready to order.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            Four satisfying rice meals, one simple online ordering experience.
          </p>
          <div className="mt-8 max-w-lg rounded-2xl bg-card p-2 shadow-lg sm:flex sm:items-center">
            <Tabs value={orderType} onValueChange={setOrderType} className="sm:flex-1">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                {['Pickup', 'Delivery'].map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button size="lg" className="mt-2 w-full sm:ml-2 sm:mt-0 sm:w-auto" asChild>
              <a href="#menu">
                Order now <ArrowRight size={18} />
              </a>
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Clock3 size={16} /> 20–30 min
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={16} /> 2.4 miles
            </span>
            <span className="flex items-center gap-2">
              <Star size={16} className="fill-coral text-coral" /> 4.9
            </span>
          </div>
        </div>
        <div className="relative min-h-[360px] lg:min-h-0">
          <img
            className="h-full w-full object-cover"
            src="/images/filipino-rice-meals.png"
            alt="Shomai, chicken, beef, and sisig rice meals"
          />
          <div className="absolute bottom-5 left-5 rounded-xl bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-xs font-semibold text-primary">Recommended for you</p>
            <p className="mt-0.5 font-semibold">Shomai and Rice</p>
          </div>
        </div>
      </div>
    </section>
  )
}
