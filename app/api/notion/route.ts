import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
        return new Response('Missing query parameter', { status: 400 })
    }
    return new Response(`Hello, ${query}!`)
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body) {
            return new Response(JSON.stringify({ message: 'Invalid request data' }), { status: 400 });
        }

        const { Title, Content, Tags } = body;
        console.log(Title, Content, Tags);

        return new Response(JSON.stringify({ message: 'Data received successfully' }), { status: 201 });
    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({ message: 'Invalid request data' }), { status: 400 });
    }
}

