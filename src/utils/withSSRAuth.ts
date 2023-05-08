import { AuthTokenError } from '@/services/errors/AuthTokenError'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next'
import { destroyCookie, parseCookies } from 'nookies'

export function withSSRAuth<P extends { [key: string]: any }>(
  fn: GetServerSideProps<P>,
) {
  return async (
    ctx: GetServerSidePropsContext,
  ): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx)

    if (!cookies['@nextauth.token']) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      }
    }

    try {
      return await fn(ctx)
    } catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, '@nextauth.token', { path: '/' })
        destroyCookie(ctx, '@nextauth.refreshToken', { path: '/' })

        return {
          redirect: {
            destination: '/',
            permanent: false,
          },
        }
      }

      destroyCookie(ctx, '@nextauth.token', { path: '/' })
      destroyCookie(ctx, '@nextauth.refreshToken', { path: '/' })

      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      }
    }
  }
}
