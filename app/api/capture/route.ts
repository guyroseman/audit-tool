import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Your live Google Apps Script Webhook
    const googleSheetUrl = "https://script.google.com/macros/s/AKfycbwbV1hYR06GWKHRpytVJe_w9z7BD_g3mYRFc_H6m-_FHpLr_rXjaMRK3XC-TKwQ_k3k/exec";

    // Silently forward the lead data to your spreadsheet
    await fetch(googleSheetUrl, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to capture lead:", error);
    return NextResponse.json({ error: 'Failed to capture lead' }, { status: 500 });
  }
}