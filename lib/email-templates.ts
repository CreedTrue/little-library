export function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Reset Your Password</h2>
        
        <p style="color: #555; line-height: 1.6; margin-bottom: 16px;">
          You requested a password reset for your account.
        </p>
        
        <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
          Click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; 
                    background-color: #007bff; 
                    color: white; 
                    padding: 12px 32px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: 500;
                    font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
          This link will expire in 1 hour for security reasons.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
          If you didn't request this password reset, you can safely ignore this email.
        </p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
        
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
          This is an automated message, please do not reply.
        </p>
      </div>
    </div>
  `
}
