"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Edit, Save, X, Headphones } from "lucide-react"

interface ProjectHighlight {
  id: string
  title: string
  description: string
}

interface ProjectHighlightsProps {
  highlights: ProjectHighlight[]
  onChange: (highlights: ProjectHighlight[]) => void
  maxHighlights?: number
}

export function ProjectHighlights({
  highlights,
  onChange,
  maxHighlights = 3
}: ProjectHighlightsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempData, setTempData] = useState<{ title: string; description: string }>({ title: '', description: '' })

  const addHighlight = () => {
    if (highlights.length >= maxHighlights) return

    const newHighlight: ProjectHighlight = {
      id: `highlight-${Date.now()}`,
      title: '',
      description: ''
    }

    setEditingId(newHighlight.id)
    setTempData({ title: '', description: '' })
    onChange([...highlights, newHighlight])
  }

  const startEditing = (highlight: ProjectHighlight) => {
    setEditingId(highlight.id)
    setTempData({ title: highlight.title, description: highlight.description })
  }

  const cancelEditing = () => {
    if (editingId) {
      // If it's a new highlight with empty title, remove it
      const isNewEmpty = highlights.find(h => h.id === editingId && !h.title.trim())
      if (isNewEmpty) {
        onChange(highlights.filter(h => h.id !== editingId))
      }
    }
    setEditingId(null)
    setTempData({ title: '', description: '' })
  }

  const saveHighlight = () => {
    if (!editingId || !tempData.title.trim()) return

    const updatedHighlights = highlights.map(highlight =>
      highlight.id === editingId
        ? { ...highlight, title: tempData.title.trim(), description: tempData.description.trim() }
        : highlight
    )

    onChange(updatedHighlights)
    setEditingId(null)
    setTempData({ title: '', description: '' })
  }

  const removeHighlight = (id: string) => {
    onChange(highlights.filter(highlight => highlight.id !== id))
    if (editingId === id) {
      setEditingId(null)
    }
  }

  const canAddMore = highlights.length < maxHighlights

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Project Highlights ({highlights.length}/{maxHighlights})
        </Label>
        {canAddMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHighlight}
            disabled={editingId !== null}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {highlights.map((highlight) => (
          <Card key={highlight.id} className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              {editingId === highlight.id ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor={`title-${highlight.id}`} className="text-sm">
                      Project Title
                    </Label>
                    <Input
                      id={`title-${highlight.id}`}
                      value={tempData.title}
                      onChange={(e) => setTempData({ ...tempData, title: e.target.value })}
                      placeholder="e.g., Midnight Reflections EP"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`description-${highlight.id}`} className="text-sm">
                      Description
                    </Label>
                    <Textarea
                      id={`description-${highlight.id}`}
                      value={tempData.description}
                      onChange={(e) => setTempData({ ...tempData, description: e.target.value })}
                      placeholder="Brief description of the project..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveHighlight}
                      disabled={!tempData.title.trim()}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEditing}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <Headphones className="h-4 w-4" />
                        {highlight.title || 'Untitled Project'}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {highlight.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(highlight)}
                        disabled={editingId !== null}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHighlight(highlight.id)}
                        disabled={editingId !== null}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {highlights.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Headphones className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No project highlights yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add up to {maxHighlights} featured projects to showcase your work
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {highlights.length > 0 && highlights.length < maxHighlights && !editingId && (
        <Button
          type="button"
          variant="outline"
          onClick={addHighlight}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Project ({highlights.length}/{maxHighlights})
        </Button>
      )}
    </div>
  )
} 