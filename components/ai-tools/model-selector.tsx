'use client'

import Link from 'next/link'

interface Model {
  id: string
  name: string
  description: string
  creator?: string
  creatorColor?: string
  href?: string
  comingSoon?: boolean
}

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string
  onSelect: (modelId: string) => void
}

function CreatorLogo({ creator, color }: { creator: string; color: string }) {
  const initials = creator.length <= 2 ? creator : creator.slice(0, 2).toUpperCase()
  const isBlack = color === '#000000' || color === '#1F2937'

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
      style={{
        backgroundColor: color,
        color: isBlack ? '#FFFFFF' : '#FFFFFF',
      }}
    >
      {initials}
    </div>
  )
}

export default function ModelSelector({ models, selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div
      className="flex gap-3 px-1 py-1 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {models.map((model) => {
        const isSelected = selectedModel === model.id

        const cardContent = (
          <>
            {model.creator && model.creatorColor && (
              <CreatorLogo creator={model.creator} color={model.creatorColor} />
            )}
            <div className="font-semibold text-xs leading-tight">{model.name}</div>
            {model.creator && (
              <div className="text-[10px] opacity-60 leading-tight">{model.creator}</div>
            )}
            <div className="text-[10px] opacity-50 leading-tight">{model.description}</div>
            {model.comingSoon && (
              <div className="mt-0.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-semibold rounded-full leading-none">
                COMING SOON
              </div>
            )}
          </>
        )

        if (model.comingSoon) {
          return (
            <div
              key={model.id}
              className="snap-start shrink-0 w-[120px] flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center border-2 border-dashed border-border/60 bg-secondary/20 text-muted-foreground opacity-70 cursor-default"
            >
              {cardContent}
            </div>
          )
        }

        const cardClassName = `snap-start shrink-0 w-[120px] flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'bg-card text-foreground shadow-md border-2 border-primary/60 scale-[1.03]'
            : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground border-2 border-transparent'
        }`

        if (model.href) {
          return (
            <Link
              key={model.id}
              href={model.href}
              onClick={(e) => {
                e.preventDefault()
                onSelect(model.id)
                window.history.replaceState(null, '', model.href)
              }}
              className={cardClassName}
            >
              {cardContent}
            </Link>
          )
        }

        return (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            className={cardClassName}
          >
            {cardContent}
          </button>
        )
      })}
    </div>
  )
}
