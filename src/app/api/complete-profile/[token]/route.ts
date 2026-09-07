import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isConfigured } from '@/lib/supabase';
import { isTokenExpired } from '@/lib/token';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = getSupabase();
  const { token } = await context.params;

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, shop_name, address, customer_type, profile_completed, token_expires_at')
      .eq('profile_token', token)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: 'Invalid or expired token', valid: false },
        { status: 404 }
      );
    }

    // Check if profile is already completed
    if (customer.profile_completed) {
      return NextResponse.json(
        { error: 'Profile already completed', valid: false, alreadyCompleted: true },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(customer.token_expires_at)) {
      return NextResponse.json(
        { error: 'Token has expired', valid: false, expired: true },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        phone: customer.phone,
        shop_name: customer.shop_name || '',
        address: customer.address || '',
        customer_type: customer.customer_type,
      },
    });
  } catch (error: any) {
    console.error('Error validating token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
