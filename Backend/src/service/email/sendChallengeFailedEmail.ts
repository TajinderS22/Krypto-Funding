import { sendEmail } from "./email.js";

const sendChallengeFailedEmail = async ({
  firstName,
  lastName,
  challengeName,
  userId,
  purchaseId,
  accountBalance,
  email,
  failureReason,
  message
}: {
  firstName: string;
  lastName: string;
  challengeName: string;
  userId: string;
  purchaseId: string;
  accountBalance: string;
  email: string;
  failureReason:string;
  message:string;
}) => {


    console.log("checking at mail code",email,userId,purchaseId)


  const failedEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body style="margin:0; padding:0; background:#f8f7f7; font-family:Arial,Helvetica,sans-serif;">

  <div style="max-width:600px; margin:40px auto; padding:0 20px;">

    <div style="
      background:#ffffff;
      border-radius:20px;
      padding:40px 35px;
      border:1px solid #e5e7eb;
    ">

      <!-- Brand -->
      <div style="text-align:center; margin-bottom:35px;">

        <div style="
          display:inline-block;
          width:52px;
          height:52px;
          line-height:52px;
          border-radius:14px;
          background:#fef2f2;
          color:#dc2626;
          font-size:26px;
          font-weight:bold;
        ">
          !
        </div>

        <h2 style="
          margin:15px 0 0;
          color:#111827;
          font-size:22px;
        ">
          Challenge Update
        </h2>

      </div>

      <!-- Greeting -->
      <p style="
        margin:0 0 10px;
        font-size:16px;
        color:#111827;
      ">
        Hi ${firstName} ${lastName},
      </p>

      <p style="
        margin:0 0 28px;
        font-size:15px;
        line-height:1.7;
        color:#6b7280;
      ">
        Your challenge has been reviewed and the account has
        reached the configured drawdown limit.
      </p>

      <!-- Result -->
      <div style="
        background:#fef2f2;
        border-radius:14px;
        padding:22px;
        margin-bottom:28px;
      ">

        <div style="
          font-size:12px;
          color:#6b7280;
          margin-bottom:8px;
          text-transform:uppercase;
          letter-spacing:1px;
        ">
          Status
        </div>

        <div style="
          font-size:20px;
          font-weight:bold;
          color:#dc2626;
        ">
          FAILED
        </div>

      </div>

      <!-- Details -->
      <table width="100%" style="border-collapse:collapse;">

        <tr>
          <td style="padding:10px 0; color:#6b7280; font-size:14px;">
            Challenge
          </td>
          <td style="padding:10px 0; text-align:right; color:#111827; font-size:14px; font-weight:600;">
            ${challengeName}
          </td>
        </tr>


        <tr>
          <td style="padding:10px 0; color:#6b7280; font-size:14px;">
            Current Balance
          </td>
          <td style="padding:10px 0; text-align:right; color:#dc2626; font-size:14px; font-weight:600;">
            $${accountBalance}
          </td>
        </tr>

        <tr>
          <td style="padding:10px 0; color:#6b7280; font-size:14px;">
            Failure reason
          </td>
          <td style="padding:10px 0; text-align:right; color:#dc2626; font-size:14px; font-weight:600;">
            $${failureReason}
          </td>
        </tr>

        <tr>
          <td style="padding:10px 0; color:#6b7280; font-size:14px;">
            Message
          </td>
          <td style="padding:10px 0; text-align:right; color:#dc2626; font-size:14px; font-weight:600;">
            $${message}
          </td>
        </tr>

      </table>

      <!-- Message -->
      <p style="
        margin:28px 0 0;
        font-size:14px;
        line-height:1.7;
        color:#6b7280;
      ">
        Your challenge result has been recorded in our system.
        You can log in to your dashboard to review your account
        and challenge details.
      </p>

      <!-- Footer -->
      <div style="
        margin-top:35px;
        padding-top:20px;
        border-top:1px solid #f0f0f0;
        text-align:center;
      ">

        <p style="
          margin:0;
          font-size:12px;
          color:#9ca3af;
        ">
          This is an automated message. Please do not reply to this email.
        </p>

        <p style="
          margin:8px 0 0;
          font-size:12px;
          color:#9ca3af;
        ">
          © ${new Date().getFullYear()} Krypto Funding
        </p>

      </div>

    </div>

  </div>

</body>
</html>
`;

  const data = {
    subject: `Important Update: Challenge Failed - ${challengeName}`,
    to: email,
    html: failedEmail,
  };

  await sendEmail(data);
};



export default sendChallengeFailedEmail;
