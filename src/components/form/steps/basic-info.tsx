'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface BasicInfoProps {
  data: {
    fullName?: string
    email?: string
    phone?: string
  }
  onChange: (data: any) => void
  onValidChange: (isValid: boolean) => void
}

export function BasicInfo({ data, onChange, onValidChange }: BasicInfoProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'fullName':
        if (!value) return 'ФИО обязательно для заполнения'
        if (value.length < 5) return 'ФИО должно содержать не менее 5 символов'
        return ''
      case 'email':
        if (!value) return 'Email обязателен для заполнения'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Введите корректный email'
        return ''
      case 'phone':
        if (!value) return 'Телефон обязателен для заполнения'
        if (!/^\+?[\d\s-()]{10,}$/.test(value)) return 'Введите корректный номер телефона'
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
      data.fullName &&
      data.email &&
      data.phone
    onValidChange(isValid)
  }, [errors, data])

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">ФИО</Label>
          <Input
            id="fullName"
            value={data.fullName || ''}
            onChange={e => handleChange('fullName', e.target.value)}
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={e => handleChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ''}
            onChange={e => handleChange('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
