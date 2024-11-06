import { BasicInfo } from "@/components/form/steps/basic-info";
import { Experience } from "@/components/form/steps/experience";
import { Education } from "@/components/form/steps/education";
import { Motivation } from "@/components/form/steps/motivation";

export type StepID = 'basicInfo' | 'experience' | 'education' | 'motivation';

export const formConfig = {
  steps: [
    {
      id: 'basicInfo' as StepID,
      title: 'Основная информация',
      description: 'Заполните ваши личные данные',
      questions: [
        {
          id: 'fullName',
          type: 'text',
          label: 'ФИО',
          required: true,
          validation: (value: string) => {
            if (!value) return 'ФИО обязательно для заполнения'
            if (value.length < 5) return 'ФИО должно содержать не менее 5 символов'
            return null
          }
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          validation: (value: string) => {
            if (!value) return 'Email обязателен для заполнения'
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(value)) return 'Введите корректный email'
            return null
          }
        },
        {
          id: 'phone',
          type: 'tel',
          label: 'Телефон',
          required: true,
          validation: (value: string) => {
            if (!value) return 'Телефон обязателен для заполнения'
            const phoneRegex = /^\+?[\d\s-()]{10,}$/
            if (!phoneRegex.test(value)) return 'Введите корректный номер телефона'
            return null
          }
        }
      ]
    },
    // Другие шаги будут добавлены позже
  ],
  stepComponents: {
    basicInfo: BasicInfo,
    experience: Experience,
    education: Education,
    motivation: Motivation
  }
}

export type FormConfig = typeof formConfig;
