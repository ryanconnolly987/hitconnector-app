import { getTopFollowedStudios } from "@/lib/studios/getTopFollowedStudios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4');
    
    const studios = await getTopFollowedStudios(limit);
    return NextResponse.json(studios);
  } catch (error) {
    console.error('Error fetching top studios:', error);
    return NextResponse.json({ error: 'Failed to fetch top studios' }, { status: 500 });
  }
} 