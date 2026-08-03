# Supabase authentication email template

In Supabase Dashboard → Authentication → Email Templates → Magic Link, keep `{{ .ConfirmationURL }}` as the button URL and replace the body with:

```html
<h2>Sign in to Follow Verified Investors</h2>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>Using another device? Enter this 6-digit code on the sign-in page:</p>
<p style="font-size:24px;font-weight:700;letter-spacing:6px">{{ .Token }}</p>
<p>This code and link expire in 60 minutes. If you did not request this email, you can ignore it.</p>
```

Set the OTP expiry and email rate limits in Authentication → Settings. The link works on the requesting browser; the code is device independent.
