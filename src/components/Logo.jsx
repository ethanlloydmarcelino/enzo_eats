export const Logo = ({ compact = false }) => {
  return (
    <a href="#top" className="group flex items-center gap-2.5" aria-label="Enzo Eats home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-base font-extrabold text-white dark:text-black">
        E
      </span>
      {!compact && (
        <span className="text-xl font-bold tracking-[-.045em] text-ink">
          Enzo <span className="text-primary">Eats</span>
        </span>
      )}
    </a>
  )
}
