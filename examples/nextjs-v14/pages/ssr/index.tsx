import type { NextPage, NextPageContext } from 'next'
import { Dispatch, SetStateAction, createContext, useState } from 'react'
import SSR from './SSR'

export const Context = createContext({
  lang: 'en',
  setLang: (() => {}) as Dispatch<SetStateAction<string>>,
})

const Home: NextPage = (props: any) => {
  const [lang, setLang] = useState('en')

  return (
    <Context.Provider value={{ lang, setLang }}>
      <div>lang: {lang}</div>
      <SSR {...props} />
    </Context.Provider>
  )
}

// This gets called on every request
export async function getServerSideProps(context: NextPageContext) {
  console.log({ context })

  // Fetch data from nextjs API
  const host = (context.req as any).apiGateway.event.headers['x-forwarded-host']
  const res = await fetch('https://' + host + '/api/hello')
  const date = new Date()
  const data = { ...(await res.json()), date: date.toISOString() }

  // Pass data to the page via props
  return {
    props: {
      data,
      status: res.status,
      env: process.env.AWS_EXECUTION_ENV ?? null,
    },
  }
}

export default Home
