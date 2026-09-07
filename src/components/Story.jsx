import { Clock3, Leaf, Sparkles } from 'lucide-react'
import { Card, CardContent } from './ui/card'

const values = [
  {
    icon: Leaf,
    title: 'Quality ingredients',
    text: 'Thoughtfully sourced and prepared fresh every day.',
  },
  {
    icon: Clock3,
    title: 'Ready when you are',
    text: 'Reliable pickup and delivery without the long wait.',
  },
  {
    icon: Sparkles,
    title: 'Smarter recommendations',
    text: 'Helpful suggestions based on what you actually enjoy.',
  },
]

export const Story = () => {
  return (
    <section id="story" className="border-y bg-lilac">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">The Enzo standard</p>
          <h2 className="section-title">Good food should be simple.</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            A focused personal ordering platform with clear choices, quick checkout, and helpful
            recommendations.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {values.map((value) => {
            const ValueIcon = value.icon
            return (
              <Card key={value.title} className="bg-card">
                <CardContent>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ValueIcon size={21} />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.text}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
