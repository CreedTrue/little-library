"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { acceptInvite } from "@/app/actions/invites"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface InviteFormProps {
  token: string
  email: string | null
  error?: string | null
}

export function InviteForm({ token, email, error }: InviteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }
    setLoading(true)
    const result = await acceptInvite(token, name, password)
    if (result.error) {
      toast.error("Failed to accept invite", { description: result.error })
      setLoading(false)
    } else {
      toast.success("Account created successfully! You can now log in.")
      router.push("/login")
    }
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Complete Your Registration</h1>
      <p className="mb-4">Creating an account for: <strong>{email}</strong></p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </div>
  )
}
