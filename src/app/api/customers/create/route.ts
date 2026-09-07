import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isConfigured } from '@/lib/supabase';
import { generateProfileToken, getTokenExpiry } from '@/lib/token';

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = getSupabase();

  try {
    const { full_name, phone } = await request.json();

    if (!full_name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Check if customer with this phone already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, full_name, phone, profile_completed')
      .eq('phone', phone)
      .single();

    if (existingCustomer) {
      return NextResponse.json({
        customer: existingCustomer,
        created: false,
        message: 'Customer already exists',
      });
    }

    // Generate username from phone
    const username = `walkin_${phone.replace(/[^0-9]/g, '').slice(-8)}`;

    // Generate profile token
    const profileToken = generateProfileToken();
    const tokenExpiresAt = getTokenExpiry();

    // Create new customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        username,
        full_name,
        phone,
        customer_type: 'walk_in',
        created_via: 'pos',
        profile_completed: false,
        profile_token: profileToken,
        token_expires_at: tokenExpiresAt,
        address: '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      customer: newCustomer,
      created: true,
      profileToken,
      tokenExpiresAt,
      message: 'Customer created successfully',
    });
  } catch (error: any) {
    console.error('Error in customer creation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
