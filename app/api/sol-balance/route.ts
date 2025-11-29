import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

const ENDPOINT = 'https://api.mainnet-beta.solana.com';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Missing address' },
      { status: 400 }
    );
  }

  try {
    const connection = new Connection(ENDPOINT, 'confirmed');
    const publicKey = new PublicKey(address);
    const lamports = await connection.getBalance(publicKey);

    return NextResponse.json({ lamports });
  } catch (err) {
    console.error('Error in /api/sol-balance', err);
    return NextResponse.json(
      { error: 'Failed to load balance' },
      { status: 500 }
    );
  }
}
