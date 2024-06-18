import { ENV } from '@paima/batcher-utils';
import axios from 'axios';

export class RecaptchaError extends Error {}

/*
  This method executes Google reCAPTCHA V3 validation for backend.
  If the validation fails, an error is thrown - otherwise, the method returns void.
  Check the docs to setup reCAPTCHA V3.
*/
export async function reCaptchaValidation(captcha: string): Promise<void> {
  if (!ENV.RECAPTCHA_V3_BACKEND) return;
  //
  // API Request Parameters:
  //   secret	  Required. The shared key between your site and reCAPTCHA.
  //   response	Required. The user response token provided by the reCAPTCHA client-side integration on your site.
  //   remoteip	Optional. The user's IP address.
  //
  const recaptchaResponse = await axios<{
    success: boolean;
    score: number; // the score for this request (0.0 - 1.0)
    action: string; // the action name for this request (important to verify)
    challenge_ts: string;
    hostname: string;
    'error-codes'?: string[];
  }>({
    url: 'https://www.google.com/recaptcha/api/siteverify',
    method: 'post',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: {
      secret: ENV.RECAPTCHA_V3_BACKEND,
      response: captcha,
    },
  });

  if (!recaptchaResponse.data?.success) {
    throw new RecaptchaError('Recaptcha validation failed');
  }

  if (ENV.ENABLE_RECAPTCHA_V3) {
    if (recaptchaResponse.data.score < ENV.RECAPTCHA_V3_SCORE) {
      throw new RecaptchaError('Recaptcha validation failed');
    }
  } else {
    console.log('INFO: ENABLE_RECAPTCHA_V3 is disabled, but RECAPTCHA_V3_BACKEND is set.');
  }
}
