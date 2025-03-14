import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
        return new Response('Missing query parameter', { status: 400 })
    }
    return new Response(`Hello, ${query}!`)
}