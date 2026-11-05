# Phone OTP setup (manual step for the owner)

## Current status

**Phone sign-in does NOT work.** The Phone OTP tab on the sign-in page is
disabled on purpose. No SMS provider is configured anywhere for this project:

- No SMS provider credentials (Twilio, MessageBird, Vonage, etc.) are stored
  in the app — the `settings` table holds no SMS keys, and there are no SMS
  environment variables. The only "Twilio" reference in the codebase is the
  WhatsApp connection test, which is a WhatsApp credential, not an SMS
  provider for Supabase Auth.
- The app code alone cannot send an SMS. Supabase phone auth
  (`supabase.auth.signInWithOtp`) only works when an SMS provider is
  configured in the Supabase dashboard. Until that is done, every OTP
  attempt fails.

## What the owner must do (Supabase dashboard)

1. **Get an SMS provider account.** The simplest option for Bangladesh is
   Twilio (https://www.twilio.com): create an account, buy or verify a phone
   number that can send SMS, and copy the **Account SID**, **Auth Token**,
   and the **Twilio phone number**. (MessageBird is the other provider
   Supabase supports directly.)
2. **Open the Supabase dashboard** for this project
   (https://supabase.com/dashboard) and select the RYmos project.
3. Go to **Authentication > Providers > Phone**.
4. **Enable the Phone provider.**
5. Under **SMS Provider**, choose **Twilio** (or MessageBird) and fill in:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio phone number (the sender number, in `+880...` / international
     format)
6. **Save** the provider settings.
7. **Test it yourself:** open the RYmos sign-in page, use the Phone OTP tab
   with your own Bangladeshi number (`01XXXXXXXXX`), and confirm the SMS
   arrives and the 6-digit code signs you in. If no SMS arrives, check the
   Twilio console message logs and the Supabase Auth logs
   (Authentication > Logs) for the provider error.
8. Only after a real SMS has been received, ask a developer to re-enable
   the Phone OTP tab in `src/app/auth/login/page.tsx` and restore the
   `loginWithOtp` / `verifyOtp` helpers in `src/context/auth-context.tsx`
   (both are currently stubbed to return the "not available" message, with
   comments marking the exact place to restore the Supabase calls).

## Notes

- Supabase also offers its own built-in SMS service (Twilio Verify under
  the hood) on paid plans — if that is used instead, enable it in the same
  Phone provider screen and skip the Twilio account in step 1.
- SMS sending costs money per message (Twilio charges per SMS). Keep an
  eye on the Twilio balance / Supabase usage.
- Do **not** paste SMS provider secrets into the app's Settings page or
  into the code — they belong only in the Supabase dashboard.
