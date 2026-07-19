// ============================================================
// REAL TREE GUY OS — WELCOME EMAIL (HTML TEMPLATE)
// ============================================================

export function buildWelcomeEmailHTML(verifyUrl, userName = "there") {
  return {
    subject: "Welcome to Real Tree Guy OS — Verify Your Email",

    html: `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Welcome to Real Tree Guy OS</title>

<style>
  body {
    margin: 0;
    padding: 0;
    background: url('https://rtg.chainsawclay.com/public/assets/img/backgrounds/rtg-welcome-back.jpg')
      no-repeat center center fixed;
    background-size: cover;
    font-family: 'Lumberjack', 'Impact', 'Trebuchet MS', sans-serif;
    color: #fff;
  }

  .overlay {
    background: rgba(0,0,0,0.65);
    padding: 40px;
    max-width: 700px;
    margin: 40px auto;
    border-radius: 14px;
    border: 2px solid rgba(255,255,255,0.15);
  }

  .logo {
    width: 120px;
    height: 120px;
    object-fit: contain;
    display: block;
    margin: 0 auto 20px auto;
  }

  h1 {
    text-align: center;
    font-size: 2.4rem;
    margin-bottom: 10px;
    letter-spacing: 1px;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.6rem;
    margin-bottom: 18px;
  }

  .verify-btn {
    display: block;
    width: fit-content;
    margin: 25px auto;
    padding: 14px 26px;
    background: #2ecc71;
    color: #000;
    font-weight: bold;
    border-radius: 10px;
    text-decoration: none;
    font-size: 1.2rem;
  }

  .footer {
    margin-top: 30px;
    text-align: center;
    opacity: 0.85;
    font-size: 1rem;
  }
</style>

</head>
<body>

<div class="overlay">

  <img class="logo"
       src="https://rtg.chainsawclay.com/public/assets/img/logos/chainsaw-clays-logo.png"
       alt="Real Tree Guy Logo">

  <h1>Welcome to Real Tree Guy OS</h1>

  <p>Hi ${userName},</p>

  <p>
    Thanks for signing up with <strong>Real Tree Guy OS</strong>. Before you jump in,
    we need to verify your email. This keeps your account secure and unlocks your full RTG dashboard.
  </p>

  <a href="${verifyUrl}" class="verify-btn">Verify My Email</a>

  <p>
    Once verified, you’ll instantly gain access to the full RTG advantage:
  </p>

  <p>
    • Auto-filled contracts and agreements<br>
    • Digital signatures and instant send-back<br>
    • Photo attachments for bids, hazards, and proof<br>
    • Organized jobs, dates, pricing, and clients<br>
    • Zero lost paperwork, zero confusion<br>
  </p>

  <p>
    Most people running tree work without RTG are juggling texts, paper contracts,
    random notes, and memory. You won’t be. RTG keeps everything tight, backed up,
    and ready to send with one tap.
  </p>

  <div class="footer">
    Signed,<br>
    <strong>Real Tree Guy</strong><br>
    Chainsaw Clays Tree Service LLC
  </div>

</div>

</body>
</html>
`
  };
}
