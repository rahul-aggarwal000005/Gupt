import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Password reset emails are disabled.",
    );
  }
  return new Resend(apiKey);
}

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
) => {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: "Gupt <onboarding@resend.dev>",
    to: [email],
    subject: "Reset your Gupt password",
    html: `
      <h2>Reset your password</h2>

      <p>We received a request to reset your Gupt password.</p>

      <p>
        Click the button below to create a new password:
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>
      </p>

      <p>This link will expire in 1 hour.</p>

      <p>
        If you didn't request a password reset, you can safely ignore this
        email.
      </p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
