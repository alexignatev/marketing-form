'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formConfig, StepID } from '@/config/form-config'
import { cn } from '@/lib/utils'

interface FormStepperProps {
  onStepComplete: (stepIndex: number, data: any) => void
  initialData?: any
  currentStep?: number
  onStepChange?: (step: number) => void
}

interface FormData {
  [key: string]: Record<string, string> | undefined
}

export function FormStepper({
  onStepComplete,
  initialData = {},
  currentStep = 0,
  onStepChange
}: FormStepperProps) {
  const [activeStep, setActiveStep] = useState(currentStep)
  const [formData, setFormData] = useState<FormData>(initialData)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    // Загрузка сохраненных данных из localStorage
    const savedData = localStorage.getItem('formData')
    if (savedData) {
      setFormData(JSON.parse(savedData))
    }
  }, [])

  useEffect(() => {
    // Сохранение данных в localStorage при изменении
    localStorage.setItem('formData', JSON.stringify(formData))
  }, [formData])

  const handleNext = async () => {
    // Валидация текущего шага
    const stepConfig = formConfig.steps[activeStep]
    const isStepValid = await validateStep(stepConfig, formData)

    if (isStepValid) {
      onStepComplete(activeStep, formData)
      if (activeStep < formConfig.steps.length - 1) {
        setActiveStep(prev => prev + 1)
        onStepChange?.(activeStep + 1)
      }
    }
  }

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1)
      onStepChange?.(activeStep - 1)
    }
  }

  const validateStep = async (stepConfig: any, data: any): Promise<boolean> => {
    let isValid = true
    const stepData = data[stepConfig.id] || {}

    for (const question of stepConfig.questions) {
      if (question.required && !stepData[question.id]) {
        isValid = false
        break
      }

      if (question.validation) {
        const validationResult = await question.validation(stepData[question.id])
        if (validationResult) {
          isValid = false
          break
        }
      }
    }

    setIsValid(isValid)
    return isValid
  }

  const renderStepContent = () => {
    const stepConfig = formConfig.steps[activeStep] as typeof formConfig.steps[number] & { id: StepID };

    const StepComponent = formConfig.stepComponents[stepConfig.id];

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{stepConfig.title}</h2>
          {stepConfig.description && (
            <p className="text-muted-foreground">{stepConfig.description}</p>
          )}
        </div>
        
        <StepComponent
          data={formData[stepConfig.id] as Record<string, string> || {}}
          onChange={(data: any) =>
            setFormData(prev => ({
              ...prev,
              [stepConfig.id]: { ...prev[stepConfig.id], ...data }
            }))
          }
          onValidChange={setIsValid}
        />
      </div>
    )
  }

  const progress = ((activeStep + 1) / formConfig.steps.length) * 100

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="p-6">
        {/* Progress indicator */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="mt-2 flex justify-between">
            {formConfig.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "text-sm",
                  index === activeStep
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={activeStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isValid}
          >
            {activeStep === formConfig.steps.length - 1 ? (
              'Завершить'
            ) : (
              <>
                Далее
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
