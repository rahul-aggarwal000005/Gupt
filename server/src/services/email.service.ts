import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
) => {
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
