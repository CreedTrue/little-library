"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { createInvite } from "@/app/actions/invites"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function InvitePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState("")

  // Debug: Log session data
  useEffect(() => {
    console.log("Session status:", status)
    console.log("Session data:", session)
    if (session?.user) {
      console.log("User role:", session.user.role)
    }
  }, [session, status])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="mb-4">
            You need admin privileges to access this page.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Current role: {session?.user?.role || "Unknown"}
          </p>
          <Button onClick={() => update()}>Refresh Session</Button>
          <Button 
            onClick={() => router.push("/dashboard")} 
            variant="outline" 
            className="ml-2"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setInviteLink("")

    const result = await createInvite(email)

    if (result.error) {
      toast.error("Failed to create invite", { description: result.error })
    } else if (result.inviteToken) {
      const link = `${window.location.origin}/invite/${result.inviteToken}`
      setInviteLink(link)
      toast.success("Invite link generated successfully!")
    }

    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.info("Invite link copied to clipboard!")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Invite New User</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <Label htmlFor="email">User Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Invite Link"}
        </Button>
      </form>

      {inviteLink && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">Generated Invite Link</h2>
          <div className="mt-2 flex items-center gap-2">
            <Input type="text" value={inviteLink} readOnly />
            <Button onClick={copyToClipboard}>Copy</Button>
          </div>
        </div>
      )}
    </div>
  )
}
