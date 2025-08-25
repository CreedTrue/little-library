import { verifyInviteToken } from "@/app/actions/invites"
import { InviteForm } from "./invite-form"

export default async function InviteAcceptPage({ params }: any) {
  const { token } = params
  const result = await verifyInviteToken(token)

  if (result.error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold text-red-500">Invalid Invitation</h1>
        <p className="mt-4">{result.error}</p>
      </div>
    )
  }

  return <InviteForm token={token} email={result.email || null} />
}
