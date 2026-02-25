'use client'

interface Model {
  id: string
  name: string
  description: string
}

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string
  onSelect: (modelId: string) => void
}

export default function ModelSelector({ models, selectedModel, onSelect }: ModelSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
      {models.map((model) => (
        <button
          key={model.id}
          onClick={() => onSelect(model.id)}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedModel === model.id
              ? 'bg-card text-foreground shadow-sm border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="font-semibold">{model.name}</div>
          <div className="text-xs mt-0.5 opacity-70">{model.description}</div>
        </button>
      ))}
    </div>
  )
}
