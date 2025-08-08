"use client"

import { useEffect, useState } from "react"
import { LoginForm } from "@/components/login-form"
import { AdminSetupForm } from "@/components/admin-setup-form"

export function UserCountCheck() {
  const [userCount, setUserCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkUserCount() {
      try {
        const response = await fetch('/api/auth/user-count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to check user count')
        }

        const data = await response.json()
        console.log("User count response:", data)
        setUserCount(data.count)
      } catch (err) {
        console.error('Error checking user count:', err)
        setError('Failed to check user count')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserCount()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Checking system status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return userCount === 0 ? <AdminSetupForm /> : <LoginForm />
} 