import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default async function AuthWrapper({ children }: AuthWrapperProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <>{children}</>
}
