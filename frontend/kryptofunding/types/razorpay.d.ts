
export {};

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency?: string;
      description?: string;
      order_id: string;
      callback_url?: string;
      notes?: Record<string, string>;
    }) => {
      open: () => void;
      on: (
        event: string,
        callback: (response: unknown) => void
      ) => void;
    };
  }
}
