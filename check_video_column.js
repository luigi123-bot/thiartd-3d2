// Script para verificar si la columna video_url existe
// Ejecutar con: node check_video_column.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas');
  console.error('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideoColumn() {
  console.log('🔍 Verificando columna video_url en tabla productos...\n');

  try {
    // Intentar obtener un producto con video_url
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, video_url')
      .limit(5);

    if (error) {
      if (error.message.includes('column') && error.message.includes('video_url')) {
        console.log('❌ LA COLUMNA video_url NO EXISTE');
        console.log('📝 Necesitas ejecutar el script setup_videos_bucket.sql en Supabase SQL Editor');
        return;
      }
      throw error;
    }

    console.log('✅ La columna video_url EXISTE en la tabla productos\n');
    console.log('📊 Primeros 5 productos:\n');
    
    data.forEach(producto => {
      const hasVideo = producto.video_url ? '✅ Tiene video' : '❌ Sin video';
      console.log(`  ID: ${producto.id} | ${producto.nombre} | ${hasVideo}`);
      if (producto.video_url) {
        console.log(`     URL: ${producto.video_url}`);
      }
    });

    const conVideo = data.filter(p => p.video_url).length;
    const sinVideo = data.filter(p => !p.video_url).length;

    console.log(`\n📈 Estadísticas:`);
    console.log(`   - Productos con video: ${conVideo}`);
    console.log(`   - Productos sin video: ${sinVideo}`);

    if (conVideo === 0) {
      console.log('\n💡 Para agregar videos:');
      console.log('   1. Ve al panel de admin');
      console.log('   2. Edita un producto');
      console.log('   3. Sube un video en la sección de videos');
      console.log('   4. Guarda el producto');
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

checkVideoColumn();
