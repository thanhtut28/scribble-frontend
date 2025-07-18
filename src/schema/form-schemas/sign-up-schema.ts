import * as z from 'zod'

export const signUpSchema = z
   .object({
      fullName: z.string().min(2, 'Full name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      password: z
         .string()
         .min(8, 'Password must be at least 8 characters')
         .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
         .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
         .regex(/[0-9]/, 'Password must contain at least one number'),
      confirmPassword: z.string(),
   })
   .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
   })

export type SignUpSchemaType = z.infer<typeof signUpSchema>
