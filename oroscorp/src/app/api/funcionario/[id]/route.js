import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const API_URL = process.env.API_URL;
const ROTA_FUNCIONARIO = '/v1/oroscorp/funcionario';

export async function PUT(request) {
    
    const token = request.cookies.get('token')?.value;
    const body = await request.json()

    const poyload = {}

}