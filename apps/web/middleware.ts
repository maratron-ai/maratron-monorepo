import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/home',
    '/profile',
    '/profile/:path*',
    '/plan-generator',
    '/plans/:path*',
    '/runs/:path*',
    '/shoes/:path*',
    '/social/:path*',
    '/signup/profile',
  ],
};
