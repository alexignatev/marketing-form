'use client'

import { useState, useCallback } from 'react'
import { FormStepper } from '@/components/form/form-stepper'
import { BasicInfo } from '@/components/form/steps/basic-info'
import { Experience } from '@/components/form/steps/experience'
import { Education } from '@/components/form/steps/education'
import { Motivation } from '@/components/form/steps/motivation'
import { Preview } from '@/components/form/preview'
import { ResultMessage } from '@/components/form/result-message'
import { formConfig } from '@/config/form-config'

export default function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    status: 'success' | 'error'
    applicationId?: string
  } | null>(null)

  const handleStepComplete = useCallback((stepIndex: number, data: any) => {
    setFormData(prev => ({
      ...prev,
      [formConfig.steps[stepIndex].id]: data
    }))

    if (stepIndex === formConfig.steps.length - 1) {
      setShowPreview(true)
    }
  }, [])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Здесь будет отправка данных на сервер
      await new Promise(resolve => setTimeout(resolve, 2000)) // Имитация запроса
      
      setSubmitResult({
        status: 'success',
        applicationId: `APP-${Date.now()}`
      })
    } catch (error) {
      setSubmitResult({
        status: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = () => {
    const jsonData = JSON.stringify(formData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `application-${submitResult?.applicationId || 'draft'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (submitResult) {
    return (
      <ResultMessage
        type={submitResult.status}
        title={
          submitResult.status === 'success'
            ? 'Заявка успешно отправлена'
            : 'Ошибка отправки'
        }
        message={
          submitResult.status === 'success'
            ? 'Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время'
            : 'Произошла ошибка при отправке заявки. Пожалуйста, попробуйте снова'
        }
        applicationId={submitResult.applicationId}
        onDownload={handleDownload}
        onRetry={submitResult.status === 'error' ? () => setSubmitResult(null) : undefined}
      />
    )
  }

  if (showPreview) {
    return (
      <Preview
        data={formData}
        onEdit={(step) => {
          setCurrentStep(step)
          setShowPreview(false)
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    )
  }

  return (
    <FormStepper
      currentStep={currentStep}
      onStepComplete={handleStepComplete}
      initialData={formData}
      onStepChange={setCurrentStep}
    />
  )
}
