declare module 'twilio' {
  interface TwilioClient {
    messages: {
      create(options: unknown): Promise<{ sid: string; status: string }>;
      (messageId: string): {
        fetch(): Promise<{ status: string }>;
      };
    };
  }

  function twilio(accountSid: string, authToken: string): TwilioClient;
  export = twilio;
}
