import { Suspense } from "react"
import { UserCountCheck } from "./user-count"

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Suspense fallback={<div>Loading...</div>}>
          <UserCountCheck />
        </Suspense>
      </div>
    </div>
  )
}
