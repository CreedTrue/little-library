import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { Resend } from "resend"
import { getPasswordResetEmailHtml } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json(
        { message: "If an account with that email exists, a password reset link has been sent." },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex")
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: resetToken,
        resetTokenExpires: resetTokenExpires
      }
    })

    // Send password reset email using Resend
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    const serverEmail = process.env.SERVER_EMAIL as string
    
    try {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is not set")
      }
      
      const resend = new Resend(apiKey)
      
      await resend.emails.send({
        from: serverEmail, // Update this to your verified domain
        to: [email],
        subject: 'Reset your password',
        html: getPasswordResetEmailHtml(resetUrl)
      })
      
      console.log("Email sent successfully to:", email)
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      // Still return success to prevent email enumeration
    }

    return NextResponse.json(
      { 
        message: "If an account with that email exists, a password reset link has been sent."
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
