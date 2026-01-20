'use client'

import { useState } from 'react'
import { Template } from '@/stores/template-store'
import { TemplateCard } from './template-card'
import { CreateProjectDialog } from './create-project-dialog'

interface TemplateListProps {
  templates: Template[]
}

export function TemplateList({ templates }: TemplateListProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => setSelectedTemplate(template)}
          />
        ))}
      </div>

      <CreateProjectDialog
        template={selectedTemplate}
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </>
  )
}
