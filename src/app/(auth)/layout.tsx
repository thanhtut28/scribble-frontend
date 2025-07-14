import AuthFormLayout from '@/components/auth/auth-form-layout'
import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
   return <AuthFormLayout>{children}</AuthFormLayout>
}
