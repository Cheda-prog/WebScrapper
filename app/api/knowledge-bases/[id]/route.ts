import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Knowledge base ID is required'
      }, { status: 400 });
    }

    console.log('🗑️  Deleting knowledge base:', id);
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 500 });
    }

    // Try to delete from JSON table first
    const { error: jsonError } = await supabase
      .from('knowledge_base_json')
      .delete()
      .eq('id', id);

    if (!jsonError) {
      console.log('✅ Successfully deleted from knowledge_base_json table');
      return NextResponse.json({
        success: true,
        message: 'Knowledge base deleted successfully'
      });
    }

    console.log('⚠️  Not found in JSON table, trying structured tables...');
    
    // If not found in JSON table, try structured tables
    const { error: kbError } = await supabase
      .from('knowledge_bases')
      .delete()
      .eq('id', id);

    if (kbError) {
      console.error('❌ Error deleting from knowledge_bases:', kbError);
      return NextResponse.json({
        success: false,
        error: `Failed to delete: ${kbError.message}`
      }, { status: 500 });
    }

    console.log('✅ Successfully deleted from knowledge_bases table');
    return NextResponse.json({
      success: true,
      message: 'Knowledge base deleted successfully'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Error deleting knowledge base:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}