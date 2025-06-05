import { prisma } from "@/lib/prisma"
import { LoginForm } from "@/components/login-form"
import { AdminSetupForm } from "@/components/admin-setup-form"

export async function UserCountCheck() {
  const userCount = await prisma.user.count()
  
  return userCount === 0 ? <AdminSetupForm /> : <LoginForm />
} 