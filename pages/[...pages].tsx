import type {
  GetStaticPathsContext,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from 'next'
import commerce from '@lib/api/commerce'
import { Text } from '@components/ui'
import { Layout } from '@components/common'
import getSlug from '@lib/get-slug'
import type { Page } from '@commerce/types/page'
import { useRouter } from 'next/router'

export async function getStaticProps({
  preview,
  params,
  locale,
  locales,
}: GetStaticPropsContext<{ pages: string[] }>) {
  
  const config = { locale, locales }
  const pagesPromise = commerce.getAllPages({ config, preview })
  const siteInfoPromise = commerce.getSiteInfo({ config, preview })
  const { pages } = await pagesPromise
  const { categories } = await siteInfoPromise
  const path = params?.pages.join('/')
  const slug = locale ? `${locale}/${path}` : path

  const pageItem = pages.find((p: Page) =>
    p.url ? getSlug(p.url) === slug : false
  )

  const data =
    pageItem &&
    (await commerce.getPage({
      url: pageItem.url,
      variables: { id: pageItem.id! },
      config,
      preview,
    }))

  const page = data?.page

  if (!page) {
    // We throw to make sure this fails at build time as this is never expected to happen
    throw new Error(`Page with slug '${slug}' not found`)
  }

  return {
    props: { pages, page, categories },
    revalidate: 60 * 60, // Every hour
  }
}

export async function getStaticPaths({ locales }: GetStaticPathsContext) {
  const config = { locales }
  const { pages }: { pages: Page[] } = await commerce.getAllPages({ config })
  
  const paths = pages
    .map((page) => {
      const arr = page?.url?.toString().split('/');
      arr?.shift();
      return { params: { pages : [arr?.join('/')] } }
    })

  return {
    paths: paths,
    fallback: 'blocking',
  }
}

export default function Pages({
  page,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()

  return router.isFallback ? (
    <h1>Loading...</h1> // TODO (BC) Add Skeleton Views
  ) : (
    <div className="max-w-2xl mx-8 sm:mx-auto py-20">
      {page?.body && <Text html={page.body} />}
    </div>
  )
}

Pages.Layout = Layout
