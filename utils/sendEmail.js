import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true only for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// Example: send verification email inside register route
export const sendVerificationEmail = async (req, res, token, toEmail) => {
  try {
    const verifyLink = `${req.protocol}://${req.get("host")}/api/auth/verify/${token}`;

    // const mailOptions = {
    //   from: `"SecureApp" <${process.env.EMAIL_USER}>`,
    //   to: toEmail,
    //   subject: "Verify your email",
    //   text: `Click here to verify your email: ${verifyLink}`,
    //   html: `<p>Click <a href="${verifyLink}">here</a> to verify your email.</p>`,
    // };

    const mailOptions = {
      from: `"SecureFamily Support" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "SecureFamily - Verify Your Email Address",
      text: `Welcome to SecureFamily! 
    Please verify your email by clicking the link below:
    
    ${verifyLink}
    
    If you didn’t sign up for SecureFamily, you can safely ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#2E86C1;">Welcome to SecureFamily!</h2>
          <p>Thank you for registering with <strong>SecureFamily</strong>. Please confirm your email address to activate your account.</p>
          <p>
            <a href="${verifyLink}" 
               style="background-color:#2E86C1; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px;">
               Verify Email
            </a>
          </p>
          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p style="word-break:break-all;">${verifyLink}</p>
          <hr />
          <small style="color:#777;">If you did not create an account with SecureFamily, you can safely ignore this message.</small>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.messageId);

    return res.status(200).json({
      status: "success",
      message: "Registration success. Verification link sent to your email.",
    });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return res.status(500).json({
      error: "Invalid Email",
      message: "Error sending email. Cross check your email address.",
    });
  }
};
