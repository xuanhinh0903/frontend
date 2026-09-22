type HomeHeroProps = {
  title: string
}

export function HomeHero({ title }: HomeHeroProps) {
  return (
    <div className="home-hero">
      <p>{title}</p>
      <p className="home-hero__hint">
        Feature module scaffold for the home domain.
      </p>
    </div>
  )
}
