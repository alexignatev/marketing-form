'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface MotivationProps {
  data: {
    letter?: string
    timeCommitment?: string
    goals?: string[]
    expectations?: string
  }
  onChange: (data: any) => void
  onValidChange: (isValid: boolean) => void
}

export function Motivation({ data, onChange, onValidChange }: MotivationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [charCount, setCharCount] = useState(0)

  const timeCommitments = [
    { value: 'full', label: 'Полная занятость (20+ часов в неделю)' },
    { value: 'partial', label: 'Частичная занятость (10-20 часов в неделю)' },
    { value: 'minimal', label: 'Минимальная занятость (до 10 часов в неделю)' }
  ]

  const validateField = (name: string, value: string | string[]) => {
    switch (name) {
      case 'letter':
        if (!value) return 'Напишите мотивационное письмо'
        if (typeof value === 'string' && value.length < 300) return 'Минимум 300 символов'
        return ''
      case 'timeCommitment':
        if (!value) return 'Выберите предполагаемую занятость'
        return ''
      case 'goals':
        if (!Array.isArray(value) || value.length === 0) return 'Укажите хотя бы одну цель'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (name: string, value: string | string[]) => {
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
    onChange({ ...data, [name]: value })

    if (name === 'letter') {
      setCharCount(value.toString().length)
    }
  }

  useEffect(() => {
    const isValid = !Object.values(errors).some(error => error) &&
      data.letter &&
      data.timeCommitment &&
      data.goals?.length > 0
    onValidChange(isValid)
  }, [errors, data])

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="letter">Мотивационное письмо</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Расскажите, почему вы хотите учиться и как это поможет в достижении ваших целей</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <textarea
            id="letter"
            className={`w-full min-h-[200px] p-3 rounded-md border ${
              errors.letter ? 'border-red-500' : 'border-input'
            }`}
            value={data.letter || ''}
            onChange={e => handleChange('letter', e.target.value)}
            placeholder="Опишите вашу мотивацию..."
          />
          <div className="flex justify-between text-sm">
            <span className={errors.letter ? 'text-red-500' : 'text-muted-foreground'}>
              {charCount} / 300 символов
            </span>
            {errors.letter && <span className="text-red-500">{errors.letter}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeCommitment">Готовность к обучению</Label>
          <Select
            value={data.timeCommitment}
            onValueChange={value => handleChange('timeCommitment', value)}
          >
            <SelectTrigger className={errors.timeCommitment ? 'border-red-500' : ''}>
              <SelectValue placeholder="Выберите предполагаемую занятость" />
            </SelectTrigger>
            <SelectContent>
              {timeCommitments.map(commitment => (
                <SelectItem key={commitment.value} value={commitment.value}>
                  {commitment.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timeCommitment && (
            <p className="text-sm text-red-500">{errors.timeCommitment}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="goals">Ваши цели</Label>
          <textarea
            className={`w-full min-h-[100px] p-3 rounded-md border ${
              errors.goals ? 'border-red-500' : 'border-input'
            }`}
            placeholder="Укажите ваши цели (каждая с новой строки)"
            value={data.goals?.join('\n') || ''}
            onChange={e => handleChange('goals', e.target.value.split('\n').filter(Boolean))}
          />
          {errors.goals && (
            <p className="text-sm text-red-500">{errors.goals}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectations">Ожидания от программы</Label>
          <textarea
            className="w-full min-h-[100px] p-3 rounded-md border border-input"
            placeholder="Опишите ваши ожидания..."
            value={data.expectations || ''}
            onChange={e => onChange({ ...data, expectations: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
