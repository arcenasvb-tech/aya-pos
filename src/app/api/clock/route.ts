// src/app/api/clock/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const body = await request.json()
    const { type } = body
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    if (type === 'in') {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          staff_id: user.id,
          clock_in: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    } else if (type === 'out') {
      const { data: activeEntry } = await supabase
        .from('time_entries')
        .select('id')
        .eq('staff_id', user.id)
        .eq('status', 'active')
        .single()
      
      if (!activeEntry) throw new Error('No active clock-in found')
      
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          clock_out: new Date().toISOString(),
        })
        .eq('id', activeEntry.id)
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}