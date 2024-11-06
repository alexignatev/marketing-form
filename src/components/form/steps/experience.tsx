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

interface ExperienceProps {
  data: {
    currentPosition?: string
    yearsOfExperience?: string
    company?: string
    industry?: string
  }
  onChange: (data: any) => void
  onValidChange: (isValid: boolean) => void
}

export function Experience({ data, onChange, onValidChange }: ExperienceProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const industries = [
    { value: 'tech', label: 'Технологии' },
    { value: 'finance', label: 'Финансы' },
    { value: 'retail', label: 'Розничная торговля' },
    { value: 'manufacturing', label: 'Производство' },
    { value: 'consulting', label: 'Консалтинг' },
    { value: 'education', label: 'Образование' },
  ]

  const experienceRanges = [
    { value: '0-2', label: '0-2 года' },
    { value: '3-5', label: '3-5 лет' },
    { value: '5-10', label: '5-10 лет' },
    { value: '10+', label: 'Более 10 лет' },
  ]

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'currentPosition':
        if (!value) return 'Укажите текущую должность'
        return ''
      case 'yearsOfExperience':
        if (!value) return 'Укажите опыт работы'
        return ''
      case 'company':
        if (!value) return 'Укажите компанию'
        return ''
      case 'industry':
        if (!value) return 'Выберите отрасль'
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
    const isValid = !Object.values(errors).some(error => error) &&
      data.currentPosition &&
      data.yearsOfExperience &&
      data.company &&
      data.industry
    onValidChange(isValid)
  }, [errors, data])

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="currentPosition">Текущая должность</Label>
          <Input
            id="currentPosition"
            value={data.currentPosition || ''}
            onChange={e => handleChange('currentPosition', e.target.value)}
            className={errors.currentPosition ? 'border-red-500' : ''}
          />
          {errors.currentPosition && (
            <p className="text-sm text-red-500">{errors.currentPosition}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Опыт работы</Label>
          <Select
            value={data.yearsOfExperience}
            onValueChange={value => handleChange('yearsOfExperience', value)}
          >
            <SelectTrigger className={errors.yearsOfExperience ? 'border-red-500' : ''}>
              <SelectValue placeholder="Выберите опыт работы" />
            </SelectTrigger>
            <SelectContent>
              {experienceRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.yearsOfExperience && (
            <p className="text-sm text-red-500">{errors.yearsOfExperience}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Компания</Label>
          <Input
            id="company"
            value={data.company || ''}
            onChange={e => handleChange('company', e.target.value)}
            className={errors.company ? 'border-red-500' : ''}
          />
          {errors.company && (
            <p className="text-sm text-red-500">{errors.company}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Отрасль</Label>
          <Select
            value={data.industry}
            onValueChange={value => handleChange('industry', value)}
          >
            <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
              <SelectValue placeholder="Выберите отрасль" />
            </SelectTrigger>
            <SelectContent>
              {industries.map(industry => (
                <SelectItem key={industry.value} value={industry.value}>
                  {industry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.industry && (
            <p className="text-sm text-red-500">{errors.industry}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
