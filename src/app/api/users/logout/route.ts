import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST() {
    try {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error signing out:', error.message);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        console.log('User signed out successfully.');
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error during logout:', e);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}