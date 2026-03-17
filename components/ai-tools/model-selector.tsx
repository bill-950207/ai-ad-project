'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

export interface Model {
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

function CreatorLogo({ creator, color, isSelected }: { creator: string; color: string; isSelected: boolean }) {
  const initials = creator.length <= 2 ? creator : creator.slice(0, 2).toUpperCase()

  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300 ${
        isSelected ? 'shadow-lg scale-105' : ''
      }`}
      style={{
        backgroundColor: color,
        color: '#FFFFFF',
        boxShadow: isSelected ? `0 4px 14px ${color}50` : 'none',
      }}
    >
      {initials}
    </div>
  )
}

export default function ModelSelector({ models, selectedModel, onSelect }: ModelSelectorProps) {
  const { t } = useLanguage()
  const aiToolsT = (t as Record<string, Record<string, string>>).aiTools || {}

  return (
    <div
      className="flex gap-2.5 px-0.5 py-1 overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      {models.map((model) => {
        const isSelected = selectedModel === model.id

        const cardContent = (
          <>
            {model.creator && model.creatorColor && (
              <CreatorLogo creator={model.creator} color={model.creatorColor} isSelected={isSelected} />
            )}
            <div className={`font-semibold text-[11px] leading-tight tracking-tight transition-colors duration-200 ${
              isSelected ? 'text-foreground' : ''
            }`}>
              {model.name}
            </div>
            {model.creator && (
              <div className="text-[10px] opacity-50 leading-tight">{model.creator}</div>
            )}
            <div className={`text-[9px] leading-tight mt-auto transition-colors duration-200 ${
              isSelected ? 'text-primary/70' : 'opacity-40'
            }`}>
              {model.description}
            </div>
            {model.comingSoon && (
              <div className="mt-1 px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-semibold rounded-full leading-none border border-amber-500/20">
                {aiToolsT.comingSoon || 'Coming Soon'}
              </div>
            )}
          </>
        )

        if (model.comingSoon) {
          return (
            <div
              key={model.id}
              className="snap-start shrink-0 w-[116px] flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-2xl text-center border border-dashed border-border/50 bg-secondary/10 text-muted-foreground opacity-60 cursor-default"
            >
              {cardContent}
            </div>
          )
        }

        const cardClassName = `snap-start shrink-0 w-[116px] flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-2xl text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
          isSelected
            ? 'bg-card text-foreground shadow-lg shadow-primary/10 border border-primary/50 scale-[1.02]'
            : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent hover:border-border/50 hover:shadow-sm'
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
              {isSelected && (
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    background: model.creatorColor
                      ? `radial-gradient(ellipse at top, ${model.creatorColor}, transparent 70%)`
                      : undefined,
                  }}
                />
              )}
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
            {isSelected && (
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  background: model.creatorColor
                    ? `radial-gradient(ellipse at top, ${model.creatorColor}, transparent 70%)`
                    : undefined,
                }}
              />
            )}
            {cardContent}
          </button>
        )
      })}
    </div>
  )
}
