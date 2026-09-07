import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, isConfigured } from '@/lib/supabase';
import { isTokenExpired } from '@/lib/token';

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = getSupabase();

  try {
    const { token, full_name, phone, shop_name, address, customer_type } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!full_name || !phone || !address) {
      return NextResponse.json({ error: 'Name, phone, and address are required' }, { status: 400 });
    }

    // Find customer by token
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id, profile_completed, token_expires_at')
      .eq('profile_token', token)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Check if profile is already completed
    if (customer.profile_completed) {
      return NextResponse.json({ error: 'Profile already completed' }, { status: 400 });
    }

    // Check if token is expired
    if (isTokenExpired(customer.token_expires_at)) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Update customer profile
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        full_name,
        phone,
        shop_name: shop_name || null,
        address,
        customer_type: customer_type || 'walk_in',
        profile_completed: true,
        profile_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Profile completed successfully',
    });
  } catch (error: any) {
    console.error('Error completing profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
