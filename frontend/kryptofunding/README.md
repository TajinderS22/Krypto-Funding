This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment variables

The frontend loads the repository-root `.env` when Next.js starts. Set
`NEXT_PUBLIC_RAZORPAY_KEY_ID` there to the Razorpay public key ID; do not put
the Razorpay secret in a `NEXT_PUBLIC_` variable. Restart the frontend after
changing environment variables.

Set `NEXT_PUBLIC_FRONTEND_URL` to the public frontend origin when deploying
(for example, `https://app.example.com`). Razorpay's callback URL is built from
this origin; if it is unset, the current browser origin is used.

The API defaults to `http://localhost:3005/api/v1`. To use a different backend,
set `NEXT_PUBLIC_API_URL` to its API base URL and set the backend's
`FRONTEND_URL` to the frontend's origin for CORS.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
