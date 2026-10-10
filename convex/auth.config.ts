// Tells Convex which sign-in provider to trust. The domain is the Clerk
// application's Frontend API URL, set per deployment with
// `npx convex env set CLERK_JWT_ISSUER_DOMAIN <url>`. "convex" is the name of
// the JWT template in Clerk.
const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
