'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, Pencil } from 'lucide-react'

interface PreviewProps {
  data: any
  onEdit: (step: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function Preview({ data, onEdit, onSubmit, isSubmitting }: PreviewProps) {
  const steps = [
    {
      title: 'Основная информация',
      fields: [
        { key: 'fullName', label: 'ФИО' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Телефон' }
      ]
    },
    {
      title: 'Опыт работы',
      fields: [
        { key: 'currentPosition', label: 'Текущая должность' },
        { key: 'yearsOfExperience', label: 'Опыт работы' },
        { key: 'company', label: 'Компания' },
        { key: 'industry', label: 'Отрасль' }
      ]
    },
    {
      title: 'Образование',
      fields: [
        { key: 'degree', label: 'Уровень образования' },
        { key: 'university', label: 'Учебное заведение' },
        { key: 'graduationYear', label: 'Год окончания' },
        { key: 'specialization', label: 'Специализация' }
      ]
    },
    {
      title: 'Мотивация',
      fields: [
        { key: 'letter', label: 'Мотивационное письмо' },
        { key: 'timeCommitment', label: 'Готовность к обучению' },
        { key: 'goals', label: 'Цели' },
        { key: 'expectations', label: 'Ожидания' }
      ]
    }
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Проверьте введенные данные</CardTitle>
      # Продолжение файла src/components/form/preview.tsx
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {steps.map((step, stepIndex) => (
            <div key={stepIndex} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(stepIndex)}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Изменить
                </Button>
              </div>

              <div className="space-y-4">
                {step.fields.map((field, fieldIndex) => {
                  const value = data[step.id]?.[field.key]
                  return (
                    <div key={fieldIndex} className="grid grid-cols-3 gap-4">
                      <div className="font-medium text-sm">{field.label}</div>
                      <div className="col-span-2 text-sm">
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside">
                            {value.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : field.key === 'letter' ? (
                          <div className="whitespace-pre-wrap">{value}</div>
                        ) : (
                          value || '-'
                        )}
                      </div>
                    </div>
                  )}
                )}
              </div>

              {stepIndex < steps.length - 1 && (
                <div className="my-4 border-b border-gray-200" />
              )}
            </div>
          ))}
        </ScrollArea>

        <div className="mt-6 flex flex-col gap-4">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⌛</span>
                Отправка...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Подтвердить и отправить
              </span>
            )}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Пожалуйста, внимательно проверьте все данные перед отправкой.
            После отправки формы внесение изменений будет недоступно.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
