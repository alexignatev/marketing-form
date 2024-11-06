'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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

interface EducationProps {
  data: {
    degree?: string
    university?: string
    graduationYear?: string
    specialization?: string
    additionalEducation?: string[]
  }
  onChange: (data: any) => void
  onValidChange: (isValid: boolean) => void
}

export function Education({ data, onChange, onValidChange }: EducationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const degrees = [
    { value: 'bachelor', label: 'Бакалавр' },
    { value: 'master', label: 'Магистр' },
    { value: 'specialist', label: 'Специалист' },
    { value: 'phd', label: 'Кандидат наук' }
  ]

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'degree':
        if (!value) return 'Выберите уровень образования'
        return ''
      case 'university':
        if (!value) return 'Укажите учебное заведение'
        return ''
      case 'graduationYear': {
        if (!value) return 'Укажите год окончания'
        const year = parseInt(value)
        const currentYear = new Date().getFullYear()
        if (year < 1950 || year > currentYear) return 'Укажите корректный год'
        return ''
      }
      case 'specialization':
        if (!value) return 'Укажите специализацию'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (name: string, value: string) => {
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error }))
    onChange({ ...data, [name]: value })
  }

  useEffect(() => {
    const isValid = Boolean(
      !Object.values(errors).some(error => error) &&
      data.degree &&
      data.university &&
      data.graduationYear &&
      data.specialization
    )
    onValidChange(isValid)
  }, [errors, data])

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="degree">Уровень образования</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Выберите ваш наивысший уровень образования</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={data.degree}
            onValueChange={value => handleChange('degree', value)}
          >
            <SelectTrigger className={errors.degree ? 'border-red-500' : ''}>
              <SelectValue placeholder="Выберите уровень образования" />
            </SelectTrigger>
            <SelectContent>
              {degrees.map(degree => (
                <SelectItem key={degree.value} value={degree.value}>
                  {degree.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.degree && (
            <p className="text-sm text-red-500">{errors.degree}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">Учебное заведение</Label>
          <Input
            id="university"
            value={data.university || ''}
            onChange={e => handleChange('university', e.target.value)}
            className={errors.university ? 'border-red-500' : ''}
          />
          {errors.university && (
            <p className="text-sm text-red-500">{errors.university}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="graduationYear">Год окончания</Label>
          <Input
            id="graduationYear"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={data.graduationYear || ''}
            onChange={e => handleChange('graduationYear', e.target.value)}
            className={errors.graduationYear ? 'border-red-500' : ''}
          />
          {errors.graduationYear && (
            <p className="text-sm text-red-500">{errors.graduationYear}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization">Специализация</Label>
          <Input
            id="specialization"
            value={data.specialization || ''}
            onChange={e => handleChange('specialization', e.target.value)}
            className={errors.specialization ? 'border-red-500' : ''}
          />
          {errors.specialization && (
            <p className="text-sm text-red-500">{errors.specialization}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Дополнительное образование</Label>
          <textarea
            className="w-full min-h-[100px] p-2 rounded-md border border-input"
            placeholder="Укажите курсы, сертификаты и другое дополнительное образование"
            value={data.additionalEducation?.join('\n') || ''}
            onChange={e => onChange({
              ...data,
              additionalEducation: e.target.value.split('\n').filter(Boolean)
            })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
