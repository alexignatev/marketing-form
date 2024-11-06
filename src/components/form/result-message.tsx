'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Download, RefreshCcw } from 'lucide-react'

interface ResultMessageProps {
  type: 'success' | 'error'
  title: string
  message: string
  applicationId?: string
  onRetry?: () => void
  onDownload?: () => void
}

export function ResultMessage({
  type,
  title,
  message,
  applicationId,
  onRetry,
  onDownload
}: ResultMessageProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex justify-center mb-4">
          {type === 'success' ? (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          )}
        </div>
        <CardTitle className="text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">{message}</p>
        
        {applicationId && (
          <div className="bg-muted p-3 rounded-md text-center">
            <p className="text-sm text-muted-foreground">Номер заявки</p>
            <p className="font-medium">{applicationId}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {onDownload && (
            <Button
              variant="outline"
              onClick={onDownload}
              className="w-full flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Скачать копию заявки
            </Button>
          )}
          
          {onRetry && (
            <Button
              variant="ghost"
              onClick={onRetry}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Попробовать снова
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
